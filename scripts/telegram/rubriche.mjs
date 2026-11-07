// The rubrics of the Telegram channel: when each one goes out (Rome time) and how its post is built from the site's
// data. Every builder returns { text: HTML caption, card: image data (scripts/telegram/cards.mjs) }, a list of them
// (event rubrics), or null when there is nothing to say (no matches, data not ready): the rubric is then skipped, never
// sent empty. Texts are informative only (see the compliance filter in lib.mjs).
import fs from "node:fs";
import path from "node:path";
import { teamGoalStats } from "../../src/lib/goalStats.mjs";
import { footballBroadcast } from "../../src/lib/broadcast.ts";
import { FOOTER, addDays, anchor, dayLabel, esc, pct, rome, romeInstant, root, shortDayTime } from "./lib.mjs";

// days: 0 = Sunday … 6 = Saturday
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** Order of the competitions in the lists (the others follow, alphabetically). */
const PRIORITY = [
  "Serie A",
  "Champions League",
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
];
const CUPS = new Set(["Champions League", "Europa League", "Conference League"]);
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
            const done = t.ids
              .map((id) => data.archive.calcio.find((e) => e.id === id))
              .filter((e) => e && typeof e.hit === "boolean");
            if (done.length !== 3) return null;
            return `${TRIS[k]?.title ?? k}: ${done.map((e) => (e.hit ? "✅" : "❌")).join(" ")} (${done.filter((e) => e.hit).length} su 3).`;
          })
          .filter(Boolean)
          .join("\n") || null;
      const caption = post(
        `📊 <b>Track record del weekend</b> (${dayLabel(addDays(today, -3))} – ${dayLabel(addDays(today, -1))})`,
        `L'esito indicato come più probabile dal modello si è verificato in <b>${hits} partite su ${list.length}</b> (${pct(hits / list.length)}).`,
        rows.join("\n"),
        last30.length ? `Ultimi 30 giorni: ${h30} su ${last30.length} (${pct(h30 / last30.length)}).` : null,
        trisLine,
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
        `Più probabile: <b>${esc(name(fav))}</b>, ${sign(fav)} al ${pct(top(fav))}`,
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
            { label: "Più probabile", match: name(fav), value: `${sign(fav)} al ${pct(top(fav))}` },
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
 * in, the product, much lower than each one. Informative: it shows how quickly "sure" outcomes stop being sure when
 * put together. The three are kept in the register; Monday's track record says how they went.
 *   weekend: Saturday and Sunday, top five leagues
 *   cups: one per cup, the morning of the first day of each matchweek (Champions: Tuesday and Wednesday together)
 */
const TRIS = {
  "tris-weekend": {
    title: "Il tris del weekend",
    emoji: "🎯",
    leagues: new Set(["Serie A", "Premier League", "LaLiga", "Bundesliga", "Ligue 1"]),
    min: 6,
  },
  "tris-champions": {
    title: "Il tris di Champions",
    emoji: "🏆",
    leagues: new Set(["Champions League"]),
    cup: true,
    min: 4,
  },
  "tris-europa-league": {
    title: "Il tris di Europa League",
    emoji: "🟠",
    leagues: new Set(["Europa League"]),
    cup: true,
    min: 4,
  },
  "tris-conference": {
    title: "Il tris di Conference",
    emoji: "🟢",
    leagues: new Set(["Conference League"]),
    cup: true,
    min: 4,
  },
};

function makeTris(id) {
  return ({ data, today, nowMs, register, mode }) => {
    const t = TRIS[id];
    const ids = currentIds(data);
    const of = (e) => open(e) && ids.has(e.id) && t.leagues.has(e.where);
    if (t.cup) {
      // first day of the matchweek: matches today, none in the three days before
      const before = romeInstant(addDays(today, -3), "00:00");
      const start = romeInstant(today, "00:00");
      if (!data.archive.calcio.some((e) => of(e) && dayOf(e) === today)) return null;
      if (
        data.archive.calcio.some(
          (e) => t.leagues.has(e.where) && Date.parse(e.kickoff) >= before && Date.parse(e.kickoff) < start,
        )
      )
        return null;
    }
    const end = romeInstant(addDays(today, 2), "00:00");
    const list = data.archive.calcio.filter(
      (e) => of(e) && Date.parse(e.kickoff) > nowMs && Date.parse(e.kickoff) < end,
    );
    if (list.length < t.min) return null;
    const three = [...list].sort((a, b) => maxP(b) - maxP(a) || a.kickoff.localeCompare(b.kickoff)).slice(0, 3);
    three.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    const all = three.reduce((p, e) => p * maxP(e), 1);
    const outcome = (e) => {
      const [home, away] = e.label.split(" – ");
      const i = topOf(e.prediction.p);
      return i === 1 ? "pareggio" : `vittoria ${i === 0 ? home : away}`;
    };
    const sign = (e) => ["1", "X", "2"][topOf(e.prediction.p)];
    const rows = three.map(
      (e) =>
        `${esc(shortDayTime(e.kickoff))} <b>${esc(e.label)}</b>${t.cup ? "" : ` (${esc(e.where)})`}\n${sign(e)} · ${esc(outcome(e))} al ${pct(maxP(e))}`,
    );
    const title = `${t.emoji} <b>${t.title}</b> – le 3 partite più prevedibili secondo il modello`;
    const miss = Math.round((1 - all) * 10);
    const lesson = `Prese una per una sembrano quasi sicure. Insieme, la probabilità che si verifichino tutte e tre è del <b>${pct(all)}</b>: ${all < 0.5 ? "è più facile che almeno una vada diversamente" : `in circa ${miss} casi su 10 almeno una va diversamente`}.`;
    const page = t.cup ? `/pronostici/${compSlug(data, [...t.leagues][0])}` : "/pronostici/oggi";
    const link = `Le probabilità di ogni partita: ${anchor(page, "pronostici", id)}`;
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
          sign: sign(e),
          outcome: outcome(e),
          p: maxP(e),
        })),
        all,
      },
      after: () => {
        register.data.tris ??= {};
        register.data.tris[mode] = { ...register.data.tris[mode], [id]: { day: today, ids: three.map((e) => e.id) } };
      },
    };
  };
}

/** Competitions whose line-ups are posted: every Serie A match, cup matches only with an Italian club. */
const LINEUP_LEAGUES = new Set(["serie-a", "champions-league", "europa-league", "conference-league"]);

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
    if (!LINEUP_LEAGUES.has(x.league) || ko <= nowMs || ko > nowMs + 90 * 60000) continue;
    const site = byApi.get(x.id);
    if (!site) continue;
    if (x.league !== "serie-a" && !italian.has(site.m.homeTeam.id) && !italian.has(site.m.awayTeam.id)) continue;
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
      `${e.hit ? "✅" : "❌"} ${esc(e.label)} ${e.result.home}-${e.result.away} (modello: ${esc(e.pick.label.split(" · ")[0])} al ${pct(e.pick.prob)})`,
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
          ? `La sorpresa: <b>${esc(surprise.label)}</b> ${surprise.result.home}-${surprise.result.away}, il modello dava ${esc(surprise.pick.label.split(" · ")[0])} al ${pct(surprise.pick.prob)}.`
          : null,
        sure
          ? `Il più netto e azzeccato: <b>${esc(sure.label)}</b> ${sure.result.home}-${sure.result.away} (${esc(sure.pick.label.split(" · ")[0])} al ${pct(sure.pick.prob)}).`
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
        pick: `${e.pick.label.split(" · ")[0]} al ${pct(e.pick.prob)}`,
      })),
    },
  };
}
