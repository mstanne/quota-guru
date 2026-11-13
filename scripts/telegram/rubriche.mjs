// The rubrics of the Telegram channel: when each one goes out (Rome time) and how its post is built from the site's
// data. Every builder returns { text: HTML caption, card: image data (scripts/telegram/cards.mjs) }, a list of them
// (event rubrics), or null when there is nothing to say (no matches, data not ready): the rubric is then skipped, never
// sent empty. Texts are informative only (see the compliance filter in lib.mjs).
import fs from "node:fs";
import path from "node:path";
import { teamGoalStats } from "../../src/lib/goalStats.mjs";
import { footballBroadcast } from "../../src/lib/broadcast.ts";
import { TRIS, chooseTris, lockKey } from "../lib/tris.mjs";
import { MULTIPLE, MULTIPLE_IDS, chooseMultiples, lockKey as multipleKey, pickTest } from "../lib/multiple.mjs";
import {
  CAPTION_MAX,
  FOOTER,
  addDays,
  anchor,
  dayLabel,
  esc,
  pct,
  rome,
  romeInstant,
  root,
  shortDayTime,
} from "./lib.mjs";

// days: 0 = Sunday … 6 = Saturday
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** Order of the competitions in the lists (the others follow, alphabetically). */
const PRIORITY = [
  "Serie A",
  "Champions League",
  "Supercoppa Italiana",
  "Coppa Italia",
  "Europa League",
  "Conference League",
  "Premier League",
  "LaLiga",
  "Bundesliga",
  "Ligue 1",
  "Serie B",
  "Eredivisie",
  "Primeira Liga",
  "Championship",
  "Brasileirão",
  // national teams (scripts/lib/leagues.mjs), the main European ones first
  "Mondiali",
  "Europei",
  "Nations League",
  "Qualificazioni Mondiali Europa",
  "Qualificazioni Europei",
  "Amichevoli internazionali",
];
const CUPS = new Set(["Champions League", "Europa League", "Conference League"]);
const ITALIAN_CUPS = new Set(["Coppa Italia", "Supercoppa Italiana"]);
const rank = (where) => (PRIORITY.includes(where) ? PRIORITY.indexOf(where) : PRIORITY.length);
const byCompThenTime = (a, b) =>
  rank(a.where) - rank(b.where) || a.where.localeCompare(b.where) || a.kickoff.localeCompare(b.kickoff);

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
/** Site slug of a competition from its name ("LaLiga" → "liga"), from the downloaded data. */
const compSlug = (data, name) => data.football?.competitions?.find((c) => c.name === name)?.slug ?? slugify(name);

const dayOf = (e) => rome(Date.parse(e.kickoff)).day;
/** Ids of the matches in the current data: the archive can still hold a match under an older id (stale duplicate). */
const currentIds = (data) => new Set((data.football?.competitions ?? []).flatMap((c) => c.matches.map((m) => m.id)));
const open = (e) => !e.void && e.prediction?.p;
/** "al 46%", "all'81%", "all'11%". */
const alPct = (p) => `${/^(8|11$)/.test(String(Math.round(p * 100))) ? "all'" : "al "}${pct(p)}`;
const p1x2 = (p) => `1 ${pct(p[0])} · X ${pct(p[1])} · 2 ${pct(p[2])}`;
const timeOf = (e) => rome(Date.parse(e.kickoff)).time;
const post = (...parts) => [...parts.filter((x) => x !== null && x !== undefined && x !== ""), FOOTER].join("\n\n");

/** Football entries grouped by competition, in the order of the lists (for the cards). */
function groups(entries, row) {
  const out = [];
  for (const e of [...entries].sort(byCompThenTime)) {
    const last = out.at(-1);
    if (last?.name === e.where) last.matches.push(row(e));
    else out.push({ name: e.where, matches: [row(e)] });
  }
  return out;
}
const matchRow = (e) => ({ time: timeOf(e), label: e.label, p: e.prediction.p });

/** Groups football entries by competition, max `limit` matches in all; returns the lines and how many were left out. */
function listByCompetition(entries, line, limit = 14) {
  const sorted = [...entries].sort(byCompThenTime);
  const shown = sorted.slice(0, limit);
  const blocks = [];
  for (const e of shown) {
    const last = blocks.at(-1);
    if (last?.where === e.where) last.lines.push(line(e));
    else blocks.push({ where: e.where, lines: [line(e)] });
  }
  return {
    text: blocks.map((b) => [`<b>${esc(b.where)}</b>`, ...b.lines].join("\n")).join("\n\n"),
    more: sorted.length - shown.length,
  };
}

/** Graded predictions (result known) in an interval of kick-off times. */
const graded = (list, fromMs, toMs) =>
  list.filter(
    (e) =>
      !e.void &&
      e.pick &&
      e.result &&
      typeof e.hit === "boolean" &&
      Date.parse(e.kickoff) >= fromMs &&
      Date.parse(e.kickoff) < toMs,
  );

/** Matches of the next Serie A round still to be played (from the downloaded data), with the round number. */
function nextRound(data, code, nowMs) {
  const comp = data.football?.competitions?.find((c) => c.code === code);
  if (!comp) return null;
  const upcoming = comp.matches.filter(
    (m) => (m.status === "SCHEDULED" || m.status === "TIMED") && Date.parse(m.utcDate) > nowMs && m.matchday,
  );
  if (!upcoming.length) return null;
  const n = Math.min(...upcoming.map((m) => m.matchday));
  const matches = comp.matches
    .filter((m) => m.matchday === n && m.stage === "REGULAR_SEASON")
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  return { comp, sa: comp, n, matches, open: matches.filter((m) => Date.parse(m.utcDate) > nowMs) };
}
const nextSerieARound = (data, nowMs) => nextRound(data, "SA", nowMs);
const shortName = (t) => t.shortName.replace(/ FC$/, "");
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------------------------- captions
// Text that goes with the image (Telegram: at most 1024 characters): the highlights in a few lines, the link and the
// responsible-gaming line. The full list is on the image; the long text is used only if the image cannot be made.
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const dec1 = (n) => n.toFixed(1).replace(".", ",");
const topOf = (p) => p.indexOf(Math.max(...p));
const maxP = (e) => Math.max(...e.prediction.p);
const goalsOf = (e) => (e.prediction.xg ? e.prediction.xg[0] + e.prediction.xg[1] : 0);
const best = (list, key) => list.reduce((a, b) => (key(b) > key(a) ? b : a));
/** "Roma contro il Sassuolo… " → "Roma, contro Sassuolo (64%)" or "il pareggio in Parma – Bologna (31%)". */
function favouriteText(e) {
  const [home, away] = e.label.split(" – ");
  const i = topOf(e.prediction.p);
  if (e.prediction.p.length === 3 && i === 1) return `il pareggio in ${esc(e.label)} (${pct(e.prediction.p[1])})`;
  const win = i === 0 ? home : away;
  const other = i === 0 ? away : home;
  return `<b>${esc(win)}</b>, ${i === 0 ? "in casa contro" : "in trasferta contro"} ${esc(i === 0 ? other : home)} (${pct(e.prediction.p[i])})`;
}
/** Highlights of a list of matches: most likely outcome, most open match, most expected goals. */
function highlights(list) {
  const fav = best(list, maxP);
  const open = best(list, (e) => -maxP(e));
  const goals = list.some((e) => e.prediction.xg) ? best(list, goalsOf) : null;
  return [
    `Il pronostico più netto: ${favouriteText(fav)}.`,
    open !== fav ? `La più equilibrata: <b>${esc(open.label)}</b>, nessun esito oltre il ${pct(maxP(open))}.` : null,
    goals && goals !== fav && goals !== open
      ? `Più gol attesi: <b>${esc(goals.label)}</b> (${dec1(goalsOf(goals))}).`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------------------------- rubrics
export const RUBRICHE = [
  {
    id: "partite-oggi",
    name: "Le partite di oggi",
    days: EVERY_DAY,
    time: "09:30",
    build({ data, today, nowMs }) {
      const ids = currentIds(data);
      const list = data.archive.calcio.filter(
        (e) => open(e) && ids.has(e.id) && dayOf(e) === today && Date.parse(e.kickoff) > nowMs,
      );
      if (!list.length) return null;
      const { text, more } = listByCompetition(list, (e) => `${timeOf(e)} ${esc(e.label)}\n${p1x2(e.prediction.p)}`);
      const serieA = list.filter((e) => e.where === "Serie A");
      const comps = new Set(list.map((e) => e.where)).size;
      return {
        caption: post(
          `⚽ <b>Le partite di oggi</b> – ${dayLabel(today)}`,
          `${plural(list.length, "partita", "partite")} in ${plural(comps, "competizione", "competizioni")}` +
            (serieA.length ? `, ${serieA.length} di Serie A.` : "."),
          serieA.length >= 2 ? `<b>Serie A</b>\n${highlights(serieA)}` : highlights(list),
          serieA.length >= 2 && list.length - serieA.length >= 2
            ? `<b>Nel resto d'Europa</b>\n${highlights(list.filter((e) => e.where !== "Serie A"))}`
            : null,
          `Probabilità 1X2 nell'immagine; analisi, Under/Over e Goal: ${anchor("/pronostici/oggi", "pronostici di oggi", "partite-oggi")}`,
        ),
        text: post(
          `⚽ <b>Le partite di oggi</b> – ${dayLabel(today)}`,
          "Le probabilità 1X2 del modello statistico per le partite di oggi.",
          text,
          more > 0 ? `…e altre ${more} partite sul sito.` : null,
          `Analisi complete, Under/Over e Goal: ${anchor("/pronostici/oggi", "pronostici di oggi", "partite-oggi")}`,
        ),
        card: {
          type: "matchList",
          badge: "Partite di oggi",
          title: "Le partite di oggi",
          subtitle: `${capital(dayLabel(today))} · probabilità 1X2 del modello`,
          groups: groups(list, matchRow),
        },
      };
    },
  },
  {
    id: "track-record",
    name: "Track record del weekend",
    days: [1],
    time: "10:00",
    build({ data, today, register, mode }) {
      const from = romeInstant(addDays(today, -3), "00:00");
      const to = romeInstant(today, "00:00");
      const list = [...graded(data.archive.calcio, from, to), ...graded(data.archive.nba, from, to)];
      if (list.length < 5) return null;
      const hits = list.filter((e) => e.hit).length;
      const groups = new Map();
      for (const e of list) {
        const g = groups.get(e.where) ?? { n: 0, hits: 0 };
        g.n++;
        if (e.hit) g.hits++;
        groups.set(e.where, g);
      }
      const rows = [...groups]
        .sort((a, b) => rank(a[0]) - rank(b[0]))
        .slice(0, 8)
        .map(([w, g]) => `${esc(w)}: ${g.hits} su ${g.n}`);
      const last30 = [
        ...graded(data.archive.calcio, to - 30 * 86400000, to),
        ...graded(data.archive.nba, to - 30 * 86400000, to),
      ];
      const h30 = last30.filter((e) => e.hit).length;
      // the threes of the last week (register): how they went, once all their matches are graded
      const trisLine =
        Object.entries(register?.data.tris?.[mode] ?? {})
          .filter(([, t]) => t.day >= addDays(today, -7))
          .map(([k, t]) => {
            // graded against the outcome of the three (older register entries: ids only, the archive's own hit)
            const picks = t.picks ?? t.ids.map((id) => ({ id }));
            const done = picks
              .map((p) => {
                const e = data.archive.calcio.find((x) => x.id === p.id);
                if (!e?.result) return null;
                return p.index === undefined ? e.hit : e.result.index === p.index;
              })
              .filter((hit) => typeof hit === "boolean");
            if (done.length !== 3) return null;
            return `${TRIS[k]?.title ?? k}: ${done.map((hit) => (hit ? "✅" : "❌")).join(" ")} (${done.filter(Boolean).length} su 3).`;
          })
          .filter(Boolean)
          .join("\n") || null;
      const trisText = trisLine ? `${trisLine}\n${anchor("/pronostici/tris", "Tutti i tris", "track-record")}` : null;
      const caption = post(
        `📊 <b>Track record del weekend</b> (${dayLabel(addDays(today, -3))} – ${dayLabel(addDays(today, -1))})`,
        `L'esito indicato come più probabile dal modello si è verificato in <b>${hits} partite su ${list.length}</b> (${pct(hits / list.length)}).`,
        rows.join("\n"),
        last30.length ? `Ultimi 30 giorni: ${h30} su ${last30.length} (${pct(h30 / last30.length)}).` : null,
        trisText,
        "Contano i pronostici così come erano pubblicati prima del calcio d'inizio, anche quando vanno male.",
        `Archivio completo e calibrazione del modello: ${anchor("/metodologia#calibrazione", "metodologia", "track-record")}`,
      );
      return {
        text: caption,
        card: {
          type: "trackRecord",
          badge: "Track record",
          title: "Il weekend del modello",
          subtitle: `Da ${dayLabel(addDays(today, -3))} a ${dayLabel(addDays(today, -1))}`,
          hits,
          n: list.length,
          rows: [...groups]
            .sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].n - a[1].n)
            .map(([name, g]) => ({ name, ...g })),
          last30: last30.length ? { hits: h30, n: last30.length } : null,
        },
      };
    },
  },
  {
    id: "academy",
    name: "Academy",
    days: [1, 3],
    time: "18:00",
    build({ register, mode }) {
      const queue = JSON.parse(fs.readFileSync(path.join(root, "scripts/telegram/academy.json"), "utf8"));
      if (!queue.length) return null;
      const i = (register.data.academy?.[mode] ?? 0) % queue.length;
      const g = queue[i];
      return {
        text: post(
          `📘 <b>Academy</b> – ${esc(g.title)}`,
          ...g.paragraphs.map(esc),
          `Approfondisci: ${anchor(`/guide/${g.slug}`, g.linkText, "academy")}`,
        ),
        caption: post(
          `📘 <b>Academy</b> – ${esc(g.title)}`,
          esc(g.paragraphs[0]),
          `Approfondisci: ${anchor(`/guide/${g.slug}`, g.linkText, "academy")}`,
        ),
        card: {
          type: "academy",
          badge: "Academy",
          title: g.title,
          titleSize: 56,
          subtitle: "Le guide di QuotaGuru, senza scorciatoie",
          slug: g.slug,
          lead: g.paragraphs[0],
          rest: g.paragraphs.slice(1),
        },
        after: () => {
          register.data.academy = { ...register.data.academy, [mode]: i + 1 };
        },
      };
    },
  },
  {
    id: "coppe",
    name: "Coppe europee",
    days: [2, 3, 4],
    time: "12:00",
    build({ data, today, nowMs }) {
      const ids = currentIds(data);
      const list = data.archive.calcio.filter(
        (e) => open(e) && ids.has(e.id) && CUPS.has(e.where) && dayOf(e) === today && Date.parse(e.kickoff) > nowMs,
      );
      if (!list.length) return null;
      const comps = [...new Set(list.map((e) => e.where))].sort((a, b) => rank(a) - rank(b));
      const { text, more } = listByCompetition(
        list,
        (e) =>
          `${timeOf(e)} ${esc(e.label)}\n${p1x2(e.prediction.p)}${e.prediction.xg ? ` · gol attesi ${(e.prediction.xg[0] + e.prediction.xg[1]).toFixed(1).replace(".", ",")}` : ""}`,
        18,
      );
      return {
        caption: post(
          `🏆 <b>${comps.join(", ")}</b> – le partite di stasera`,
          `${plural(list.length, "partita", "partite")} in programma.`,
          highlights(list),
          `Tutte le probabilità: ${anchor(`/pronostici/${compSlug(data, comps[0])}`, `pronostici ${comps[0]}`, "coppe")}`,
        ),
        text: post(
          `🏆 <b>${comps.join(", ")}</b> – le partite di stasera`,
          text,
          more > 0 ? `…e altre ${more} partite sul sito.` : null,
          `Tutte le probabilità: ${anchor(`/pronostici/${compSlug(data, comps[0])}`, `pronostici ${comps[0]}`, "coppe")}`,
        ),
        card: {
          type: "matchList",
          badge: "Coppe europee",
          title: comps.length === 1 ? comps[0] : "Coppe europee, stasera",
          subtitle: `${capital(dayLabel(today))} · probabilità 1X2 e gol attesi`,
          groups: groups(list, (e) => ({
            ...matchRow(e),
            note: e.prediction.xg
              ? `gol attesi ${(e.prediction.xg[0] + e.prediction.xg[1]).toFixed(1).replace(".", ",")}`
              : null,
          })),
        },
      };
    },
  },
  {
    // Coppa Italia and Supercoppa Italiana (November 2026): the matches of the day with the chance of going through
    id: "coppa-italia",
    name: "Coppa Italia e Supercoppa",
    days: EVERY_DAY,
    time: "11:30",
    build({ data, today, nowMs }) {
      const ids = currentIds(data);
      const list = data.archive.calcio.filter(
        (e) => open(e) && ids.has(e.id) && ITALIAN_CUPS.has(e.where) && dayOf(e) === today && Date.parse(e.kickoff) > nowMs,
      );
      if (!list.length) return null;
      const comps = [...new Set(list.map((e) => e.where))].sort((a, b) => rank(a) - rank(b));
      const through = (e) => {
        const q = e.prediction.qualify;
        if (!q) return null;
        const [h, a] = e.label.split(" – ");
        const fav = q[0] >= q[1] ? [h, q[0]] : [a, q[1]];
        return `${e.final || e.where === "Supercoppa Italiana" ? "Alza il trofeo" : "Passa il turno"}: ${esc(fav[0])} ${pct(fav[1])}`;
      };
      const line = (e) => [`${timeOf(e)} ${esc(e.label)}`, p1x2(e.prediction.p), through(e)].filter(Boolean).join("\n");
      const title = `🇮🇹 <b>${comps.join(" e ")}</b> – le partite di oggi`;
      const link = `Tutte le probabilità: ${anchor(`/pronostici/${compSlug(data, comps[0])}`, `pronostici ${comps[0]}`, "coppa-italia")}`;
      return {
        caption: post(title, `${plural(list.length, "partita", "partite")} in programma.`, highlights(list), link),
        text: post(title, list.map(line).join("\n\n"), link),
        card: {
          type: "matchList",
          badge: comps.length === 1 ? comps[0] : "Coppe italiane",
          title: comps.length === 1 ? `${comps[0]}, oggi` : "Coppe italiane, oggi",
          subtitle: `${capital(dayLabel(today))} · probabilità 1X2 sui 90 minuti`,
          groups: groups(list, (e) => ({ ...matchRow(e), note: through(e)?.replace(/<[^>]+>/g, "") ?? null })),
        },
      };
    },
  },
  {
    id: "numeri",
    name: "Numeri della settimana",
    days: [2],
    time: "18:00",
    build({ data }) {
      const sa = data.football?.competitions?.find((c) => c.code === "SA");
      if (!sa) return null;
      const results = sa.matches
        .filter((m) => m.status === "FINISHED" && m.score?.fullTime?.home != null)
        .map((m) => ({
          date: m.utcDate,
          home: m.homeTeam.id,
          away: m.awayTeam.id,
          hg: m.score.fullTime.home,
          ag: m.score.fullTime.away,
        }));
      const teams = new Map();
      for (const m of sa.matches) for (const t of [m.homeTeam, m.awayTeam]) teams.set(t.id, shortName(t));
      const stats = [...teams]
        .map(([id, name]) => ({ name, last: teamGoalStats(results, id, 5).last }))
        .filter((s) => s.last.n >= 5);
      if (stats.length < 10) return null;
      const best = (key, dir = -1) =>
        [...stats].sort((a, b) => dir * (key(a) - key(b)) || a.name.localeCompare(b.name)).slice(0, 3);
      const rowsOf = (key, dir) =>
        best(key, dir).map((s) => ({ team: s.name, count: Math.round(key(s) * s.last.n), n: s.last.n }));
      const top = (key, dir = -1) =>
        rowsOf(key, dir)
          .map((r) => `${esc(r.team)} ${r.count} su ${r.n}`)
          .join(" · ");
      const over = (s) => s.last.over[1] / s.last.n;
      const btts = (s) => s.btts / s.n;
      const caption = post(
        "🔢 <b>Numeri della settimana</b> – Serie A, ultime 5 partite",
        `<b>Più Over 2,5</b>\n${top(over)}`,
        `<b>Più partite con Goal</b> (segnano entrambe)\n${top((s) => btts(s.last))}`,
        `<b>Meno Over 2,5</b>\n${top(over, 1)}`,
        "Statistiche, non previsioni: cinque partite sono poche e i numeri oscillano molto.",
        `Tutte le squadre: ${anchor(`/calcio/${sa.slug}/statistiche-under-over`, "statistiche Under/Over e Goal", "numeri")}`,
      );
      return {
        text: caption,
        card: {
          type: "numbers",
          badge: "Numeri",
          title: "I numeri della settimana",
          subtitle: "Serie A, le ultime 5 partite di ogni squadra",
          panels: [
            { title: "Più Over 2,5", note: "partite con almeno 3 gol", rows: rowsOf(over) },
            { title: "Più partite con Goal", note: "segnano entrambe le squadre", rows: rowsOf((s) => btts(s.last)) },
            { title: "Meno Over 2,5", note: "partite con al massimo 2 gol", rows: rowsOf(over, 1), color: "#7F93AE" },
          ],
        },
      };
    },
  },
  {
    id: "nba",
    name: "NBA, la notte",
    days: [4],
    time: "18:00",
    build({ data, nowMs }) {
      const list = data.archive.nba
        .filter((e) => open(e) && Date.parse(e.kickoff) > nowMs && Date.parse(e.kickoff) < nowMs + 16 * 3600000)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
      if (!list.length) return null;
      const lines = list.slice(0, 12).map((e) => {
        const [home, away] = e.label.split(" – ");
        const fav = e.prediction.p[0] >= e.prediction.p[1] ? 0 : 1;
        return `${timeOf(e)} ${esc(e.label)}\nPiù probabile: ${esc(fav === 0 ? home : away)}, ${pct(e.prediction.p[fav])}`;
      });
      const nbaFav = best(list, maxP);
      const nbaOpen = best(list, (e) => -maxP(e));
      return {
        caption: post(
          "🏀 <b>NBA, le partite della notte</b>",
          `${plural(list.length, "partita", "partite")} nella notte italiana.`,
          [
            `La favorita più netta: ${favouriteText(nbaFav)}.`,
            nbaOpen !== nbaFav
              ? `La più incerta: <b>${esc(nbaOpen.label)}</b>, ${pct(maxP(nbaOpen))} contro ${pct(1 - maxP(nbaOpen))}.`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
          `Punti attesi e handicap: ${anchor("/pronostici/nba", "pronostici NBA", "nba")}`,
        ),
        text: post(
          "🏀 <b>NBA, le partite della notte</b>",
          lines.join("\n\n"),
          list.length > 12 ? `…e altre ${list.length - 12} partite sul sito.` : null,
          `Punti attesi e handicap: ${anchor("/pronostici/nba", "pronostici NBA", "nba")}`,
        ),
        card: {
          type: "nba",
          badge: "NBA",
          title: "NBA, le partite della notte",
          subtitle: "Probabilità di vittoria del modello · orari italiani",
          games: list.map((e) => {
            const [home, away] = e.label.split(" – ");
            return { time: timeOf(e), home, away, p: e.prediction.p };
          }),
        },
      };
    },
  },
  // round previews: Serie A on Friday; the other leagues the day before their round starts (also midweek rounds)
  roundPreview({ id: "anteprima-serie-a", code: "SA", flag: "🇮🇹", days: [5], time: "12:00" }),
  roundPreview({
    id: "anteprima-premier-league",
    code: "PL",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    days: EVERY_DAY,
    time: "13:00",
    dayBefore: true,
  }),
  roundPreview({ id: "anteprima-liga", code: "PD", flag: "🇪🇸", days: EVERY_DAY, time: "14:00", dayBefore: true }),
  roundPreview({ id: "anteprima-ligue-1", code: "FL1", flag: "🇫🇷", days: EVERY_DAY, time: "15:00", dayBefore: true }),
  { id: "tris-weekend", name: "Il tris del weekend", days: [6], time: "10:30", build: makeTris("tris-weekend") },
  // cups: checked every matchday morning, posted only on the first day of each matchweek
  {
    id: "tris-champions",
    name: "Il tris di Champions",
    days: [2, 3],
    time: "10:30",
    build: makeTris("tris-champions"),
  },
  {
    id: "tris-europa-league",
    name: "Il tris di Europa League",
    days: [3, 4],
    time: "10:30",
    build: makeTris("tris-europa-league"),
  },
  {
    id: "tris-conference",
    name: "Il tris di Conference",
    days: [3, 4],
    time: "11:00",
    build: makeTris("tris-conference"),
  },
  {
    id: "tris-nazionali",
    name: "Il tris delle nazionali",
    days: EVERY_DAY,
    time: "10:30",
    build: makeTris("tris-nazionali"),
  },
  // every day, after the site has locked the day's multiples (first build of the day) and before the first matches
  { id: "multiple", name: "Le multiple del giorno", days: EVERY_DAY, time: "11:15", build: dailyMultiples },
  {
    id: "pronostici-del-giorno",
    name: "I pronostici del giorno",
    // weekends with the leagues, European cup days; skipped on the other days (dailyPicks)
    days: [0, 2, 3, 4, 6],
    time: "11:45",
    build: dailyPicks,
  },
  {
    id: "studio-pronostico",
    name: "Lo studio del pronostico",
    event: true,
    build: studyPosts,
  },
  {
    id: "nazionale-italia",
    name: "L'Italia di oggi",
    days: EVERY_DAY,
    time: "11:30",
    build: italyToday,
  },
  {
    id: "dove-vederla",
    name: "Dove vederla in TV",
    days: [5],
    time: "18:00",
    build({ data, nowMs }) {
      const round = nextSerieARound(data, nowMs);
      if (!round || round.open.length < 5) return null;
      const dates = round.matches.map((m) => m.utcDate);
      let note = null;
      const tvRows = round.open.map((m) => {
        const b = footballBroadcast(round.sa.slug, m.utcDate, dates);
        if (b?.note) note = b.note;
        return { m, channels: b?.channels ?? "da definire" };
      });
      const lines = tvRows.map(
        ({ m, channels }) =>
          `${esc(shortDayTime(m.utcDate))} ${esc(shortName(m.homeTeam))} – ${esc(shortName(m.awayTeam))}: ${esc(channels)}`,
      );
      const caption = post(
        `📺 <b>Serie A, ${round.n}ª giornata: dove vederla in TV</b>`,
        lines.join("\n"),
        note ? esc(note) : null,
        "Secondo gli accordi sui diritti TV della stagione 2026/27; controlla sempre il palinsesto ufficiale.",
        `Calendario e pronostici: ${anchor(`/pronostici/${round.sa.slug}/giornata-${round.n}`, `${round.n}ª giornata`, "dove-vederla")}`,
      );
      const byChannel = new Map();
      for (const { m, channels } of tvRows)
        for (const ch of channels.split(/\s*(?:,|\be\b|\+)\s*/).filter(Boolean))
          byChannel.set(ch, [...(byChannel.get(ch) ?? []), `${shortName(m.homeTeam)} – ${shortName(m.awayTeam)}`]);
      const channelLines = [...byChannel]
        .sort((a, b) => b[1].length - a[1].length)
        .map(([ch, ms]) =>
          ms.length === tvRows.length
            ? `<b>${esc(ch)}</b>: tutte le ${tvRows.length} partite`
            : `<b>${esc(ch)}</b>: ${ms.length > 4 ? `${ms.length} partite` : esc(ms.join(", "))}`,
        );
      return {
        caption: post(
          `📺 <b>Serie A, ${round.n}ª giornata: dove vederla in TV</b>`,
          channelLines.join("\n"),
          note ? esc(note) : null,
          "Orari e canali partita per partita nell'immagine; controlla sempre il palinsesto ufficiale.",
          `Calendario e pronostici: ${anchor(`/pronostici/${round.sa.slug}/giornata-${round.n}`, `${round.n}ª giornata`, "dove-vederla")}`,
        ),
        text: caption,
        card: {
          type: "tv",
          badge: "Dove vederla",
          title: `${round.n}ª giornata in TV`,
          subtitle: "Serie A · secondo gli accordi sui diritti 2026/27",
          matches: tvRows.map(({ m, channels }) => ({
            when: shortDayTime(m.utcDate),
            label: `${shortName(m.homeTeam)} – ${shortName(m.awayTeam)}`,
            channels: channels.split(/\s*(?:,|\be\b|\+)\s*/).filter(Boolean),
          })),
          note: [note, "Controlla sempre il palinsesto ufficiale."].filter(Boolean).join(" "),
        },
      };
    },
  },
  {
    id: "risultati",
    name: "Risultati vs modello",
    days: [6],
    time: "23:00",
    build: (ctx) => results(ctx, "risultati"),
  },
  {
    id: "risultati-domenica",
    name: "Risultati vs modello (domenica)",
    days: [0],
    time: "23:30",
    build: (ctx) => results(ctx, "risultati"),
  },
  {
    id: "formazioni",
    name: "Formazioni ufficiali",
    event: true,
    live: true,
    build: lineupPosts,
  },
  {
    id: "classifica",
    name: "Classifica e marcatori",
    days: [1],
    time: "12:30",
    build({ data }) {
      const sa = data.football?.competitions?.find((c) => c.code === "SA");
      const table =
        sa?.standings?.find((s) => s.stage === "REGULAR_SEASON" && !s.group)?.table ?? sa?.standings?.[0]?.table;
      if (!table?.length) return null;
      const rows = table.map((r) => `${r.position}. ${esc(shortName(r.team))} ${r.points}`);
      const scorers = (sa.leaders?.scorers ?? [])
        .slice(0, 5)
        .map((p, i) => `${i + 1}. ${esc(p.name)} (${esc(p.team.shortName)}) ${p.goals}`);
      const caption = post(
        `📋 <b>Serie A, la classifica</b> dopo ${Math.max(...table.map((r) => r.playedGames))} giornate`,
        rows.join("\n"),
        scorers.length ? `<b>Marcatori</b>\n${scorers.join("\n")}` : null,
        `${anchor(`/calcio/${sa.slug}/classifica`, "Classifica completa", "classifica")} · ${anchor(`/calcio/${sa.slug}/marcatori`, "marcatori e assist", "classifica")}`,
      );
      const [first, second] = table;
      const gap = first.points - second.points;
      const last3 = table.slice(-3).map((r) => esc(shortName(r.team)));
      const top = sa.leaders?.scorers?.[0];
      return {
        caption: post(
          `📋 <b>Serie A, la classifica</b> dopo ${Math.max(...table.map((r) => r.playedGames))} giornate`,
          [
            gap > 0
              ? `In testa <b>${esc(shortName(first.team))}</b> con ${first.points} punti, poi ${esc(shortName(second.team))} a ${second.points} (${plural(gap, "punto", "punti")} di distacco).`
              : `In testa <b>${esc(shortName(first.team))}</b> e <b>${esc(shortName(second.team))}</b> a ${first.points} punti.`,
            `Nei primi quattro posti: ${table
              .slice(0, 4)
              .map((r) => esc(shortName(r.team)))
              .join(", ")}.`,
            `In fondo: ${last3.join(", ")}.`,
            top
              ? `Capocannoniere: <b>${esc(top.name)}</b> (${esc(top.team.shortName)}) con ${plural(top.goals, "gol", "gol")}.`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
          `${anchor(`/calcio/${sa.slug}/classifica`, "Classifica completa", "classifica")} · ${anchor(`/calcio/${sa.slug}/marcatori`, "marcatori e assist", "classifica")}`,
        ),
        text: caption,
        card: {
          type: "standings",
          badge: "Classifica",
          title: "Serie A, la classifica",
          subtitle: `Dopo ${Math.max(...table.map((r) => r.playedGames))} giornate`,
          zones: { top: 4, bottom: 3 },
          rows: table.map((r) => ({
            pos: r.position,
            team: shortName(r.team),
            played: r.playedGames,
            gd: r.goalDifference,
            points: r.points,
          })),
          scorers: (sa.leaders?.scorers ?? [])
            .slice(0, 3)
            .map((p) => ({ name: p.name, team: p.team.shortName, goals: p.goals })),
        },
      };
    },
  },
];

/**
 * Preview of the next round of a league: most likely outcome, most open match, most expected goals, every match.
 * dayBefore: posted only when the round starts 12 to 36 hours later, so once per round whatever the day.
 */
function roundPreview({ id, code, flag, days, time, dayBefore = false }) {
  return {
    id,
    name: `Anteprima ${code}`,
    days,
    time,
    build({ data, nowMs }) {
      const round = nextRound(data, code, nowMs);
      if (!round) return null;
      if (dayBefore) {
        const first = Date.parse(round.matches[0]?.utcDate);
        if (!(first >= nowMs + 12 * 3600000 && first < nowMs + 36 * 3600000)) return null;
      }
      const byId = new Map(data.archive.calcio.filter(open).map((e) => [e.id, e]));
      const list = round.open.map((m) => ({ m, e: byId.get(m.id) })).filter((x) => x.e);
      if (list.length < 5) return null;
      const league = round.comp.name;
      const name = ({ m }) => `${shortName(m.homeTeam)} – ${shortName(m.awayTeam)}`;
      const top = ({ e }) => Math.max(...e.prediction.p);
      const sign = ({ e }) => ["1", "X", "2"][e.prediction.p.indexOf(Math.max(...e.prediction.p))];
      const goals = ({ e }) => (e.prediction.xg ? e.prediction.xg[0] + e.prediction.xg[1] : 0);
      const fav = list.reduce((a, b) => (top(b) > top(a) ? b : a));
      const uncertain = list.reduce((a, b) => (top(b) < top(a) ? b : a));
      const most = list.reduce((a, b) => (goals(b) > goals(a) ? b : a));
      const title = `${flag} <b>${esc(league)}, ${round.n}ª giornata</b> – cosa dice il modello`;
      const lines = [
        `Più probabile: <b>${esc(name(fav))}</b>, ${sign(fav)} ${alPct(top(fav))}`,
        `Più incerta: <b>${esc(name(uncertain))}</b>, nessun esito oltre il ${pct(top(uncertain))}`,
        goals(most) ? `Più gol attesi: <b>${esc(name(most))}</b>, ${dec1(goals(most))} gol` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const link = `Probabilità, quota equa e Under/Over di ogni partita: ${anchor(`/pronostici/${round.comp.slug}/giornata-${round.n}`, `${round.n}ª giornata`, id)}`;
      const all = list
        .map((x) => `${esc(shortDayTime(x.m.utcDate))} ${esc(name(x))}\n${p1x2(x.e.prediction.p)}`)
        .join("\n");
      return {
        caption: post(title, lines, "Tutte le partite con le probabilità 1X2 nell'immagine.", link),
        text: post(title, lines, all, link),
        card: {
          type: "preview",
          badge: "Anteprima",
          title: `${league}, ${round.n}ª giornata`,
          subtitle: "Cosa dice il modello, partita per partita",
          highlights: [
            { label: "Più probabile", match: name(fav), value: `${sign(fav)} ${alPct(top(fav))}` },
            { label: "Più incerta", match: name(uncertain), value: `max ${pct(top(uncertain))}`, color: "#FBBF24" },
            goals(most) ? { label: "Più gol attesi", match: name(most), value: `${dec1(goals(most))} gol` } : null,
          ].filter(Boolean),
          matches: list.map((x) => ({ when: shortDayTime(x.m.utcDate), label: name(x), p: x.e.prediction.p })),
        },
      };
    },
  };
}

/**
 * A three ("tris"): the three matches where the model is most sure of one outcome, and the chance that all three come
 * in (rules and config: scripts/lib/tris.mjs). The site locks each three at its first build of the day (`tris.json` in
 * the archive branch): the post shows that one, so channel and /pronostici/tris agree; without a lock (build late or
 * failed) the three is chosen here with the same rules. Kept in the register: Monday's track record says how it went.
 */
function makeTris(id) {
  return ({ data, today, nowMs, register, mode }) => {
    const t = TRIS[id];
    const lock =
      data.tris?.[lockKey(id, today)] ?? chooseTris(id, data.archive.calcio, { nowMs, currentIds: currentIds(data) });
    if (!lock) return null;
    const three = lock.picks;
    const all = lock.all;
    const rows = three.map(
      (e) =>
        `${esc(shortDayTime(e.kickoff))} <b>${esc(e.label)}</b>${t.cup ? "" : ` (${esc(e.where)})`}\n${e.sign} · ${esc(e.outcome)} ${alPct(e.p)}`,
    );
    const title = `${t.emoji} <b>${t.title}</b> – le 3 partite più prevedibili secondo il modello`;
    const miss = Math.round((1 - all) * 10);
    const lesson = `Prese una per una sembrano quasi sicure. Insieme, la probabilità che si verifichino tutte e tre è del <b>${pct(all)}</b>: ${all < 0.5 ? "è più facile che almeno una vada diversamente" : `in circa ${miss} casi su 10 almeno una va diversamente`}.`;
    const link = `Tutti i tris e com'è andata: ${anchor(`/pronostici/tris#${t.slug}`, "quotaguru.it/pronostici/tris", id)}`;
    return {
      caption: post(title, rows.join("\n\n"), lesson, link),
      card: {
        type: "tris",
        badge: t.title.replace(/^Il /, "").replace(/^t/, "T"),
        title: t.title,
        subtitle: "Le 3 partite più prevedibili secondo il modello",
        picks: three.map((e) => ({
          when: shortDayTime(e.kickoff),
          where: e.where,
          label: e.label,
          sign: e.sign,
          outcome: e.outcome,
          p: e.p,
        })),
        all,
      },
      after: () => {
        register.data.tris ??= {};
        register.data.tris[mode] = {
          ...register.data.tris[mode],
          [id]: { day: today, picks: three.map((e) => ({ id: e.id, index: e.index })) },
        };
      },
    };
  };
}

/**
 * Match day of the Italian national team: the model's prediction and where to watch it (Rai). One post per match
 * (Italy plays at most once a day); null on the other days.
 */
function italyToday({ data, today, nowMs }) {
  const ids = currentIds(data);
  const comps = (data.football?.competitions ?? []).filter((c) => c.national);
  const matches = comps.flatMap((c) =>
    c.matches.filter((m) => m.homeTeam.name === "Italia" || m.awayTeam.name === "Italia").map((m) => ({ c, m })),
  );
  const archived = new Map(data.archive.calcio.map((e) => [e.id, e]));
  const hit = matches.find(
    ({ m }) => ids.has(m.id) && rome(Date.parse(m.utcDate)).day === today && Date.parse(m.utcDate) > nowMs,
  );
  if (!hit) return null;
  const e = archived.get(hit.m.id);
  if (!open(e)) return null;
  const p = e.prediction;
  const tv = footballBroadcast(hit.c.slug, hit.m.utcDate, [], [hit.m.homeTeam.name, hit.m.awayTeam.name], true);
  const goals = p.xg ? (p.xg[0] + p.xg[1]).toFixed(1).replace(".", ",") : null;
  const caption = post(
    `🇮🇹 <b>${esc(e.label)}</b> – ${esc(hit.c.name)}, ore ${timeOf(e)}`,
    `Le probabilità del modello delle nazionali: ${p1x2(p.p)}.`,
    [
      goals ? `Gol attesi in tutto: ${goals}.` : null,
      p.over?.["2.5"] != null ? `Over 2,5 ${alPct(p.over["2.5"])}, Goal (segnano entrambe) ${alPct(p.btts)}.` : null,
    ]
      .filter(Boolean)
      .join(" ") || null,
    tv ? `In TV: ${esc(tv.channels)}.` : null,
    `Analisi completa: ${anchor(e.path, e.label, "nazionale-italia")}`,
  );
  // the other matches of the same competition today, under Italy's (the card has room for ten rows)
  const sameDay = data.archive.calcio.filter(
    (x) => open(x) && ids.has(x.id) && x.where === hit.c.name && dayOf(x) === today && x.id !== e.id,
  );
  const top = p.p.indexOf(Math.max(...p.p));
  const [home, away] = e.label.split(" – ");
  return {
    caption,
    card: {
      type: "preview",
      badge: "Nazionale",
      title: e.label,
      subtitle: `${hit.c.name} · ${capital(dayLabel(today))}, ore ${timeOf(e)}${tv ? ` · ${tv.channels}` : ""}`,
      highlights: [
        {
          label: "Più probabile",
          match: e.label,
          value: `${top === 1 ? "pareggio" : top === 0 ? home : away} ${pct(p.p[top])}`,
        },
        p.over?.["2.5"] != null
          ? { label: "Over 2,5", match: e.label, value: pct(p.over["2.5"]), color: "#FBBF24" }
          : null,
        p.btts != null ? { label: "Goal", match: e.label, value: pct(p.btts) } : null,
      ].filter(Boolean),
      matches: [e, ...sameDay.sort((a, b) => a.kickoff.localeCompare(b.kickoff))]
        .slice(0, 10)
        .map((x) => ({ when: shortDayTime(x.kickoff), label: x.label, p: x.prediction.p })),
    },
  };
}

/** Competitions whose line-ups are posted: every Serie A match, cup matches only with an Italian club. */
const LINEUP_LEAGUES = new Set([
  "serie-a",
  "champions-league",
  "europa-league",
  "conference-league",
  "coppa-italia",
  "supercoppa-italiana",
]);

/** Official line-ups, one post per match, as soon as the live worker has them (event rubric: no time slot). */
function lineupPosts({ data, nowMs }) {
  const comps = data.football?.competitions ?? [];
  const italian = new Set(
    comps.find((c) => c.code === "SA")?.matches.flatMap((m) => [m.homeTeam.id, m.awayTeam.id]) ?? [],
  );
  const byApi = new Map();
  for (const c of comps) for (const m of c.matches) if (m.apiId) byApi.set(m.apiId, { c, m });
  const archived = new Map(data.archive.calcio.map((e) => [e.id, e]));
  const posts = [];
  for (const x of data.lineups ?? []) {
    const ko = Date.parse(x.kickoff);
    if (ko <= nowMs || ko > nowMs + 90 * 60000) continue;
    const site = byApi.get(x.id);
    if (!site) continue;
    // the Italian national team too, whatever the competition
    const italy = site.c.national && [site.m.homeTeam.name, site.m.awayTeam.name].includes("Italia");
    if (!LINEUP_LEAGUES.has(x.league) && !italy) continue;
    if (!italy && x.league !== "serie-a" && !italian.has(site.m.homeTeam.id) && !italian.has(site.m.awayTeam.id))
      continue;
    const home = shortName(site.m.homeTeam);
    const away = shortName(site.m.awayTeam);
    const e = archived.get(site.m.id);
    const team = (name, l) =>
      [
        `<b>${esc(name)}</b>${l.formation ? ` (${esc(l.formation)})` : ""}`,
        esc(l.starters.join(", ")),
        l.coach ? `All. ${esc(l.coach)}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    posts.push({
      key: String(x.id),
      card: {
        type: "lineups",
        badge: "Formazioni",
        title: `${home} – ${away}`,
        subtitle: `${site.c.name} · ore ${rome(ko).time} · formazioni ufficiali`,
        teams: [
          { name: home, ...x.lineups.home },
          { name: away, ...x.lineups.away },
        ],
        p: e?.prediction?.p ?? null,
      },
      text: post(
        `📋 <b>Formazioni ufficiali</b> – ${esc(home)} – ${esc(away)}`,
        `${esc(site.c.name)}, ore ${rome(ko).time}`,
        team(home, x.lineups.home),
        team(away, x.lineups.away),
        e?.prediction?.p ? `Il modello prima delle formazioni: ${p1x2(e.prediction.p)}` : null,
        `Cronaca e statistiche in diretta: ${anchor(e?.path ?? `/pronostici/${site.c.slug}`, `${home} – ${away}`, "formazioni")}`,
      ),
    });
  }
  return posts;
}

/** Today's graded predictions: what the model said and how it went. */
function results({ data, today }, campaign) {
  const list = graded(data.archive.calcio, romeInstant(today, "00:00"), romeInstant(addDays(today, 1), "00:00"));
  if (list.length < 3) return null;
  const hits = list.filter((e) => e.hit).length;
  const { text, more } = listByCompetition(
    list,
    (e) =>
      `${e.hit ? "✅" : "❌"} ${esc(e.label)} ${e.result.home}-${e.result.away} (modello: ${esc(e.pick.label.split(" · ")[0])} ${alPct(e.pick.prob)})`,
    16,
  );
  const misses = list.filter((e) => !e.hit);
  const surprise = misses.length ? best(misses, (e) => e.pick.prob) : null;
  const sure = list.filter((e) => e.hit).length
    ? best(
        list.filter((e) => e.hit),
        (e) => e.pick.prob,
      )
    : null;
  return {
    caption: post(
      `📈 <b>Risultati di oggi e modello</b> – ${dayLabel(today)}`,
      `Esito più probabile verificato in <b>${hits} partite su ${list.length}</b> (${pct(hits / list.length)}).`,
      [
        surprise
          ? `La sorpresa: <b>${esc(surprise.label)}</b> ${surprise.result.home}-${surprise.result.away}, il modello dava ${esc(surprise.pick.label.split(" · ")[0])} ${alPct(surprise.pick.prob)}.`
          : null,
        sure
          ? `Il più netto e azzeccato: <b>${esc(sure.label)}</b> ${sure.result.home}-${sure.result.away} (${esc(sure.pick.label.split(" · ")[0])} ${alPct(sure.pick.prob)}).`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      `Ogni partita nell'immagine; ogni pronostico resta pubblicato con il suo esito: ${anchor("/metodologia#calibrazione", "archivio e track record", campaign)}`,
    ),
    text: post(
      `📈 <b>Risultati di oggi e modello</b> – ${dayLabel(today)}`,
      `Esito più probabile verificato in <b>${hits} partite su ${list.length}</b>.`,
      text,
      more > 0 ? `…e altre ${more} partite nell'archivio.` : null,
      `Ogni pronostico resta pubblicato con il suo esito: ${anchor("/metodologia#calibrazione", "archivio e track record", campaign)}`,
    ),
    card: {
      type: "results",
      badge: "Risultati",
      title: "Risultati e modello",
      subtitle: capital(dayLabel(today)),
      hits,
      n: list.length,
      groups: groups(list, (e) => ({
        label: e.label,
        score: `${e.result.home}-${e.result.away}`,
        hit: e.hit,
        pick: `${e.pick.label.split(" · ")[0]} ${alPct(e.pick.prob)}`,
      })),
    },
  };
}

// ---------------------------------------------------------------------------------------------- predictions of the day
const LEAGUES5 = new Set(["Serie A", "Premier League", "LaLiga", "Bundesliga", "Ligue 1"]);
const fair = (p) => (1 / p).toFixed(2).replace(".", ",");

const poissonPmf = (l, k) => {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * l ** k) / f;
};
/** Total goals distribution 0…6 and 7+ (the model's, or plain Poisson from the expected goals on older entries). */
function totalGoals(pr) {
  if (pr.goals?.t) return pr.goals.t;
  if (!pr.xg) return null;
  const d = Array.from({ length: 7 }, (_, k) => poissonPmf(pr.xg[0] + pr.xg[1], k));
  return [...d, Math.max(0, 1 - d.reduce((a, b) => a + b, 0))];
}
/** The likeliest of the multigoal ranges 1-3, 2-4, 3-5: { lo, hi, p }. */
function bestMultigoal(pr) {
  const t = totalGoals(pr);
  if (!t) return null;
  return [
    [1, 3],
    [2, 4],
    [3, 5],
  ]
    .map(([lo, hi]) => ({ lo, hi, p: t.slice(lo, hi + 1).reduce((a, b) => a + b, 0) }))
    .reduce((a, b) => (b.p > a.p ? b : a));
}

/**
 * The most telling outcome of a match among 1X2, Goal/No Goal, Over/Under 2,5, multigoal, double chance and Over 1,5:
 * the first
 * one, in that order (most specific first), above its threshold, else the closest to it; `edge` = how far above it
 * is (for the ranking).
 */
function bestMarket(e) {
  const pr = e.prediction;
  const [home, away] = e.label.split(" – ");
  const i = topOf(pr.p);
  const out = [
    {
      min: 0.6,
      p: pr.p[i],
      sign: ["1", "X", "2"][i],
      text: i === 1 ? "pareggio" : `vittoria ${i === 0 ? home : away}`,
    },
  ];
  if (typeof pr.btts === "number")
    out.push(
      pr.btts >= 0.5
        ? { min: 0.62, p: pr.btts, sign: "Goal", text: "segnano entrambe" }
        : { min: 0.62, p: 1 - pr.btts, sign: "No Goal", text: "almeno una non segna" },
    );
  const o25 = pr.over?.["2.5"];
  if (typeof o25 === "number")
    out.push(
      o25 >= 0.5
        ? { min: 0.62, p: o25, sign: "Over 2,5", text: "almeno 3 gol" }
        : { min: 0.62, p: 1 - o25, sign: "Under 2,5", text: "al massimo 2 gol" },
    );
  const mg = bestMultigoal(pr);
  if (mg) out.push({ min: 0.64, p: mg.p, sign: `Multigol ${mg.lo}-${mg.hi}`, text: `da ${mg.lo} a ${mg.hi} gol` });
  if (pr.dc && i !== 1)
    out.push(
      i === 0
        ? { min: 0.75, p: pr.dc[0], sign: "1X", text: `${home} o pareggio` }
        : { min: 0.75, p: pr.dc[2], sign: "X2", text: `${away} o pareggio` },
    );
  const o15 = pr.over?.["1.5"];
  if (typeof o15 === "number") out.push({ min: 0.8, p: o15, sign: "Over 1,5", text: "almeno 2 gol" });
  // none above its threshold (balanced match): the one closest to it
  const ok = out.find((m) => m.p >= m.min) ?? out.reduce((a, b) => (b.p - b.min > a.p - a.min ? b : a));
  return { ...ok, edge: ok.p - ok.min };
}

/**
 * Weekend days with league matches and European cup days: five matches of the day, one outcome each (the most telling
 * of several markets, bestMarket), with probability, fair odds and the chance that all five come in.
 */
function dailyPicks({ data, today, nowMs }) {
  const { weekday } = rome(nowMs);
  const ids = currentIds(data);
  const todays = data.archive.calcio.filter(
    (e) => open(e) && ids.has(e.id) && dayOf(e) === today && Date.parse(e.kickoff) > nowMs,
  );
  const cupDay = [2, 3, 4].includes(weekday) && todays.filter((e) => CUPS.has(e.where)).length >= 2;
  const leagueDay = [0, 6].includes(weekday) && todays.filter((e) => LEAGUES5.has(e.where)).length >= 4;
  if (!cupDay && !leagueDay) return null;
  const pool = new Set([...LEAGUES5, ...CUPS, "Serie B"]);
  const inTris = new Set(
    Object.entries(data.tris ?? {})
      .filter(([k]) => k.endsWith(`/${today}`))
      .flatMap(([, l]) => l.picks.map((p) => p.id)),
  );
  // at most two per competition (three on cup days) while others are left; the matches of today's threes left out,
  // unless without them there are not five
  const choose = (skipTris) => {
    const ranked = todays
      .filter((e) => pool.has(e.where) && !(skipTris && inTris.has(e.id)))
      .map((e) => ({ e, m: bestMarket(e) }))
      .filter((x) => x.m)
      .sort((a, b) => b.m.edge - a.m.edge || rank(a.e.where) - rank(b.e.where) || a.e.id - b.e.id);
    const out = [];
    const perComp = new Map();
    const isMg = (x) => x.m.sign.startsWith("Multigol");
    for (const x of ranked) {
      if ((perComp.get(x.e.where) ?? 0) >= (cupDay ? 3 : 2)) continue;
      // variety: at most two multigoal outcomes
      if (isMg(x) && out.filter(isMg).length >= 2) continue;
      perComp.set(x.e.where, (perComp.get(x.e.where) ?? 0) + 1);
      out.push(x);
      if (out.length === 5) break;
    }
    // too few competitions today for the cap (Wednesday: Champions League almost alone): fill up without it
    for (const x of ranked) if (out.length < 5 && !out.includes(x)) out.push(x);
    return out;
  };
  let five = choose(true);
  if (five.length < 5) five = choose(false);
  if (five.length < 5) return null;
  five.sort((a, b) => a.e.kickoff.localeCompare(b.e.kickoff) || a.e.id - b.e.id);
  const all = five.reduce((x, { m }) => x * m.p, 1);
  const caption = (withFair) =>
    post(
      `📋 <b>I pronostici del giorno</b> – ${dayLabel(today)}`,
      five
        .map(
          ({ e, m }) =>
            `${timeOf(e)} <b>${esc(e.label)}</b>\n${esc(m.sign)} · ${esc(m.text)}: ${pct(m.p)}${withFair ? ` · quota equa ${fair(m.p)}` : ""}`,
        )
        .join("\n"),
      `Ognuno è l'esito più netto della sua partita per il modello. Tutti e cinque insieme: <b>${pct(all)}</b>, cioè in circa ${Math.round((1 - all) * 10)} casi su 10 almeno uno va diversamente. Quota equa = 1 ÷ probabilità, non è la quota di un operatore.`,
      `Tutte le partite di oggi: ${anchor("/pronostici/oggi", "quotaguru.it/pronostici/oggi", "pronostici-del-giorno")}`,
    );
  return {
    // within Telegram's 1.024 characters: without the fair odds (they are on the image) when it does not fit
    caption: caption(true).length <= CAPTION_MAX ? caption(true) : caption(false),
    card: {
      type: "tris",
      badge: "Pronostici del giorno",
      title: "I pronostici del giorno",
      subtitle: `${capital(dayLabel(today))} · un esito per partita, secondo il modello`,
      picks: five.map(({ e, m }) => ({
        when: timeOf(e),
        where: e.where,
        label: e.label,
        sign: m.sign,
        outcome: `${m.text} · quota equa ${fair(m.p)}`,
        p: m.p,
      })),
      all,
      allLabel: "Tutti e cinque insieme",
    },
  };
}

// ---------------------------------------------------------------------------------------------- match study
const STUDY_MAX_PER_DAY = 2;

/** Position and points of a club in its league table (null when not found). */
function standingOf(comp, teamId) {
  const table =
    comp?.standings?.find((s) => s.stage === "REGULAR_SEASON" && !s.group)?.table ?? comp?.standings?.[0]?.table;
  return table?.find((r) => r.team.id === teamId) ?? null;
}

/** Last five results of a club in any competition of the data: "VVPSV" (oldest first). */
function formOf(comps, teamId, beforeIso) {
  const played = comps
    .flatMap((c) => c.matches)
    .filter(
      (m) =>
        m.status === "FINISHED" &&
        m.utcDate < beforeIso &&
        (m.homeTeam.id === teamId || m.awayTeam.id === teamId) &&
        m.score.fullTime.home !== null,
    )
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(-5);
  return played
    .map((m) => {
      const mine = m.homeTeam.id === teamId ? m.score.fullTime.home : m.score.fullTime.away;
      const theirs = m.homeTeam.id === teamId ? m.score.fullTime.away : m.score.fullTime.home;
      return mine > theirs ? "V" : mine < theirs ? "S" : "P";
    })
    .join("");
}

/**
 * The matches of the day worth a study (at most STUDY_MAX_PER_DAY): Italian clubs in the European cups (Champions
 * first) and the Serie A match of the day between the best-placed clubs (lowest average position). The same list all
 * day long, so every match is posted once, in its own slot.
 */
function studyMatches(data, today) {
  const comps = data.football?.competitions ?? [];
  const sa = comps.find((c) => c.code === "SA");
  const italian = new Set(sa?.matches.flatMap((m) => [m.homeTeam.id, m.awayTeam.id]) ?? []);
  const archived = new Map(data.archive.calcio.map((e) => [e.id, e]));
  const out = [];
  const cupScore = { CL: 100, EL: 90, ECL: 80 };
  for (const c of comps) {
    for (const m of c.matches) {
      if (rome(Date.parse(m.utcDate)).day !== today || ["POSTPONED", "CANCELLED"].includes(m.status)) continue;
      const e = archived.get(m.id);
      if (!e || !open(e)) continue;
      if (cupScore[c.code] && (italian.has(m.homeTeam.id) || italian.has(m.awayTeam.id)))
        out.push({ c, m, e, score: cupScore[c.code] });
      if (c.code === "SA") {
        const a = standingOf(c, m.homeTeam.id)?.position;
        const b = standingOf(c, m.awayTeam.id)?.position;
        if (a && b) out.push({ c, m, e, score: 70 - (a + b) / 2, serieA: true });
      }
    }
  }
  out.sort((x, y) => y.score - x.score || x.m.utcDate.localeCompare(y.m.utcDate) || x.m.id - y.m.id);
  // one Serie A match a day: the best-placed pair
  const picked = [];
  for (const x of out) {
    if (x.serieA && picked.some((p) => p.serieA)) continue;
    picked.push(x);
    if (picked.length === STUDY_MAX_PER_DAY) break;
  }
  return picked;
}

/** Event rubric: the study of a chosen match (studyMatches), posted about four hours before kick-off. */
function studyPosts({ data, today, nowMs }) {
  const comps = data.football?.competitions ?? [];
  const posts = [];
  for (const { c, m, e } of studyMatches(data, today)) {
    const ko = Date.parse(m.utcDate);
    if (nowMs < ko - 4 * 3600000 || nowMs > ko - 90 * 60000) continue;
    const home = shortName(m.homeTeam);
    const away = shortName(m.awayTeam);
    const pr = e.prediction;
    const best = bestMarket(e);
    const i = topOf(pr.p);
    const pickText = i === 1 ? "X · pareggio" : `${i === 0 ? "1" : "2"} · vittoria ${i === 0 ? home : away}`;
    const mgBest = bestMultigoal(pr);
    const formH = formOf(comps, m.homeTeam.id, m.utcDate);
    const formA = formOf(comps, m.awayTeam.id, m.utcDate);
    // league table only for Serie A matches (a cup table says little)
    const posH = c.code === "SA" ? standingOf(c, m.homeTeam.id) : null;
    const posA = c.code === "SA" ? standingOf(c, m.awayTeam.id) : null;
    const scores = (pr.scores ?? []).slice(0, 3);
    const inj = m.injuries;
    const round = m.matchday && m.stage !== "LEAGUE_STAGE" ? `, ${m.matchday}ª giornata` : "";
    const lines = [
      `📊 Il modello: ${p1x2(pr.p)}\nQuote eque: ${pr.p.map(fair).join(" · ")}`,
      pr.xg
        ? `⚽ Gol attesi ${dec1(pr.xg[0])} – ${dec1(pr.xg[1])}${pr.over?.["2.5"] != null ? ` · Over 2,5 ${pct(pr.over["2.5"])}` : ""}${pr.btts != null ? ` · Goal ${pct(pr.btts)}` : ""}${mgBest ? ` · Multigol ${mgBest.lo}-${mgBest.hi} ${pct(mgBest.p)}` : ""}`
        : null,
      scores.length ? `🎯 Risultati più probabili: ${scores.map(([h, a]) => `${h}-${a}`).join(", ")}` : null,
      formH.length >= 3 && formA.length >= 3
        ? `📈 Ultime partite: ${esc(home)} ${formH} · ${esc(away)} ${formA}`
        : null,
      posH && posA
        ? `🏆 Classifica: ${esc(home)} ${posH.position}ª (${posH.points} pt), ${esc(away)} ${posA.position}ª (${posA.points} pt)`
        : null,
      inj ? `🚑 Indisponibili: ${esc(home)} ${inj.home.length}, ${esc(away)} ${inj.away.length}` : null,
    ];
    posts.push({
      key: String(m.id),
      caption: post(
        `🔎 <b>Lo studio del pronostico</b> – ${esc(home)} – ${esc(away)}`,
        `${esc(c.name)}${round} · oggi alle ${rome(ko).time}`,
        lines.filter(Boolean).join("\n"),
        `➡️ Per il modello: <b>${esc(pickText)}</b> ${alPct(pr.p[i])}${best && best.sign !== ["1", "X", "2"][i] ? `; l'esito più netto tra gli altri mercati: ${esc(best.sign)} (${esc(best.text)}) ${alPct(best.p)}` : ""}.`,
        `Lo studio completo, con statistiche e confronto: ${anchor(e.path, `${home} – ${away}`, "studio-pronostico")}`,
      ),
      card: {
        type: "study",
        badge: "Lo studio del pronostico",
        title: `${home} – ${away}`,
        subtitle: `${c.name}${round} · oggi alle ${rome(ko).time}`,
        home,
        away,
        p: pr.p,
        xg: pr.xg ?? null,
        over25: pr.over?.["2.5"] ?? null,
        btts: pr.btts ?? null,
        scores,
        form: formH.length >= 3 && formA.length >= 3 ? [formH, formA] : null,
        pick: { sign: ["1", "X", "2"][i], text: pickText.split(" · ")[1], p: pr.p[i] },
      },
    });
  }
  return posts;
}

// ---------------------------------------------------------------------------------------------- multiples of the day
const fairOf = (p) => (1 / p).toFixed(2).replace(".", ",");

/**
 * The multiples of the day (/pronostici/multiple): a double and three accumulators at fair odds near 2, 5 and 10, from
 * the model's probabilities (rules: scripts/lib/multiple.mjs). The site locks them at its first build of the day
 * (`multiple.json` in the archive branch): the post shows those, so channel and site agree; without a lock (build late
 * or failed) they are chosen here with the same rules. Also how yesterday's went, graded with the archive's results.
 * The picks are in the image; the caption has one line per multiple (Telegram's 1.024 characters).
 */
function dailyMultiples({ data, today, nowMs }) {
  const locked = MULTIPLE_IDS.map((id) => data.multiple?.[multipleKey(id, today)]).filter(Boolean);
  const list = locked.length
    ? locked
    : Object.values(chooseMultiples(data.archive.calcio, { nowMs, currentIds: currentIds(data) }));
  // only multiples still entirely to play
  const todays = list.filter((m) => m.picks.every((p) => Date.parse(p.kickoff) > nowMs));
  if (!todays.length) return null;
  const short = (m) => MULTIPLE[m.id]?.short ?? m.id;

  // yesterday: lost as soon as a pick is wrong, won when every played pick came in
  const byId = new Map(data.archive.calcio.map((e) => [e.id, e]));
  const yesterday = addDays(today, -1);
  const past = MULTIPLE_IDS.map((id) => data.multiple?.[multipleKey(id, yesterday)])
    .filter(Boolean)
    .map((m) => {
      const marks = m.picks.map((p) => {
        const r = byId.get(p.id)?.result;
        return r ? pickTest(p.key, r.home, r.away) : null;
      });
      const played = marks.filter((x) => x !== null);
      const lost = played.some((x) => !x);
      const done = played.length === m.picks.length;
      if (!lost && !done) return null;
      return `${short(m)} ${lost ? "❌" : "✅"} (${played.filter(Boolean).length} su ${m.picks.length})`;
    })
    .filter(Boolean);

  const lines = todays.map(
    (m) =>
      `<b>${esc(short(m))}</b>: ${m.picks.length} esiti, insieme ${alPct(m.all)} · quota equa ${fairOf(m.all)}`,
  );
  const caption = post(
    `🧮 <b>Le multiple del giorno</b> – ${dayLabel(today)}`,
    lines.join("\n"),
    "Costruite solo con le probabilità del modello. Ogni esito da solo è probabile, ma devono entrare tutti: le probabilità si moltiplicano. Quota equa = 1 ÷ probabilità, non è la quota di un operatore.",
    past.length ? `Ieri: ${past.join(" · ")}` : null,
    `Gli esiti e com'è andata ogni multipla: ${anchor("/pronostici/multiple", "quotaguru.it/pronostici/multiple", "multiple")}`,
  );
  return {
    caption,
    card: {
      type: "multiple",
      badge: "Multiple",
      title: "Le multiple del giorno",
      subtitle: `${capital(dayLabel(today))} · dalle probabilità del modello`,
      multiple: todays.map((m) => ({
        name: MULTIPLE[m.id]?.title ?? m.id,
        all: m.all,
        fair: fairOf(m.all),
        picks: m.picks.map((p) => ({ when: timeOf(p), label: p.label, sign: p.sign, p: p.p })),
      })),
    },
  };
}
