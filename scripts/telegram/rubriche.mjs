// The rubrics of the Telegram channel: when each one goes out (Rome time) and how its post is built from the site's
// data. Every builder returns the HTML text of the post, or null when there is nothing to say (no matches, data not
// ready): the rubric is then skipped, never sent empty. Texts are informative only (see the compliance filter in lib.mjs).
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
const open = (e) => !e.void && e.prediction?.p;
const p1x2 = (p) => `1 ${pct(p[0])} · X ${pct(p[1])} · 2 ${pct(p[2])}`;
const timeOf = (e) => rome(Date.parse(e.kickoff)).time;
const post = (...parts) => [...parts.filter((x) => x !== null && x !== undefined && x !== ""), FOOTER].join("\n\n");

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
function nextSerieARound(data, nowMs) {
  const sa = data.football?.competitions?.find((c) => c.code === "SA");
  if (!sa) return null;
  const upcoming = sa.matches.filter(
    (m) => (m.status === "SCHEDULED" || m.status === "TIMED") && Date.parse(m.utcDate) > nowMs && m.matchday,
  );
  if (!upcoming.length) return null;
  const n = Math.min(...upcoming.map((m) => m.matchday));
  const matches = sa.matches
    .filter((m) => m.matchday === n && m.stage === "REGULAR_SEASON")
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  return { sa, n, matches, open: matches.filter((m) => Date.parse(m.utcDate) > nowMs) };
}
const shortName = (t) => t.shortName.replace(/ FC$/, "");

// ---------------------------------------------------------------------------------------------- rubrics
export const RUBRICHE = [
  {
    id: "partite-oggi",
    name: "Le partite di oggi",
    days: EVERY_DAY,
    time: "09:30",
    build({ data, today, nowMs }) {
      const list = data.archive.calcio.filter((e) => open(e) && dayOf(e) === today && Date.parse(e.kickoff) > nowMs);
      if (!list.length) return null;
      const { text, more } = listByCompetition(list, (e) => `${timeOf(e)} ${esc(e.label)}\n${p1x2(e.prediction.p)}`);
      return post(
        `⚽ <b>Le partite di oggi</b> – ${dayLabel(today)}`,
        "Le probabilità 1X2 del modello statistico per le partite di oggi.",
        text,
        more > 0 ? `…e altre ${more} partite sul sito.` : null,
        `Analisi complete, Under/Over e Goal: ${anchor("/pronostici/oggi", "pronostici di oggi", "partite-oggi")}`,
      );
    },
  },
  {
    id: "track-record",
    name: "Track record del weekend",
    days: [1],
    time: "10:00",
    build({ data, today }) {
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
      return post(
        `📊 <b>Track record del weekend</b> (${dayLabel(addDays(today, -3))} – ${dayLabel(addDays(today, -1))})`,
        `L'esito indicato come più probabile dal modello si è verificato in <b>${hits} partite su ${list.length}</b> (${pct(hits / list.length)}).`,
        rows.join("\n"),
        last30.length ? `Ultimi 30 giorni: ${h30} su ${last30.length} (${pct(h30 / last30.length)}).` : null,
        "Contano i pronostici così come erano pubblicati prima del calcio d'inizio, anche quando vanno male.",
        `Archivio completo e calibrazione del modello: ${anchor("/metodologia#calibrazione", "metodologia", "track-record")}`,
      );
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
      const list = data.archive.calcio.filter(
        (e) => open(e) && CUPS.has(e.where) && dayOf(e) === today && Date.parse(e.kickoff) > nowMs,
      );
      if (!list.length) return null;
      const comps = [...new Set(list.map((e) => e.where))].sort((a, b) => rank(a) - rank(b));
      const { text, more } = listByCompetition(
        list,
        (e) =>
          `${timeOf(e)} ${esc(e.label)}\n${p1x2(e.prediction.p)}${e.prediction.xg ? ` · gol attesi ${(e.prediction.xg[0] + e.prediction.xg[1]).toFixed(1).replace(".", ",")}` : ""}`,
        18,
      );
      return post(
        `🏆 <b>${comps.join(", ")}</b> – le partite di stasera`,
        text,
        more > 0 ? `…e altre ${more} partite sul sito.` : null,
        `Tutte le probabilità: ${anchor(`/pronostici/${compSlug(data, comps[0])}`, `pronostici ${comps[0]}`, "coppe")}`,
      );
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
      const top = (key, dir = -1) =>
        [...stats]
          .sort((a, b) => dir * (key(a) - key(b)) || a.name.localeCompare(b.name))
          .slice(0, 3)
          .map((s) => `${esc(s.name)} ${Math.round(key(s) * s.last.n)} su ${s.last.n}`)
          .join(" · ");
      const over = (s) => s.last.over[1] / s.last.n;
      const btts = (s) => s.btts / s.n;
      return post(
        "🔢 <b>Numeri della settimana</b> – Serie A, ultime 5 partite",
        `<b>Più Over 2,5</b>\n${top(over)}`,
        `<b>Più partite con Goal</b> (segnano entrambe)\n${top((s) => btts(s.last))}`,
        `<b>Meno Over 2,5</b>\n${top(over, 1)}`,
        "Statistiche, non previsioni: cinque partite sono poche e i numeri oscillano molto.",
        `Tutte le squadre: ${anchor(`/calcio/${sa.slug}/statistiche-under-over`, "statistiche Under/Over e Goal", "numeri")}`,
      );
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
      return post(
        "🏀 <b>NBA, le partite della notte</b>",
        lines.join("\n\n"),
        list.length > 12 ? `…e altre ${list.length - 12} partite sul sito.` : null,
        `Punti attesi e handicap: ${anchor("/pronostici/nba", "pronostici NBA", "nba")}`,
      );
    },
  },
  {
    id: "anteprima-serie-a",
    name: "Anteprima Serie A",
    days: [5],
    time: "12:00",
    build({ data, nowMs }) {
      const round = nextSerieARound(data, nowMs);
      if (!round) return null;
      const byId = new Map(data.archive.calcio.filter(open).map((e) => [e.id, e]));
      const list = round.open.map((m) => ({ m, e: byId.get(m.id) })).filter((x) => x.e);
      if (list.length < 5) return null;
      const name = ({ m }) => `${shortName(m.homeTeam)} – ${shortName(m.awayTeam)}`;
      const maxP = ({ e }) => Math.max(...e.prediction.p);
      const sign = ({ e }) => ["1", "X", "2"][e.prediction.p.indexOf(Math.max(...e.prediction.p))];
      const goals = ({ e }) => (e.prediction.xg ? e.prediction.xg[0] + e.prediction.xg[1] : 0);
      const fav = list.reduce((a, b) => (maxP(b) > maxP(a) ? b : a));
      const uncertain = list.reduce((a, b) => (maxP(b) < maxP(a) ? b : a));
      const most = list.reduce((a, b) => (goals(b) > goals(a) ? b : a));
      const all = list
        .map((x) => `${esc(shortDayTime(x.m.utcDate))} ${esc(name(x))}\n${p1x2(x.e.prediction.p)}`)
        .join("\n");
      return post(
        `🇮🇹 <b>Serie A, ${round.n}ª giornata</b> – cosa dice il modello`,
        [
          `Più probabile: <b>${esc(name(fav))}</b>, ${sign(fav)} al ${pct(maxP(fav))}`,
          `Più incerta: <b>${esc(name(uncertain))}</b>, nessun esito oltre il ${pct(maxP(uncertain))}`,
          goals(most)
            ? `Più gol attesi: <b>${esc(name(most))}</b>, ${goals(most).toFixed(1).replace(".", ",")} gol`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        all,
        `Probabilità, quota equa e Under/Over di ogni partita: ${anchor(`/pronostici/${round.sa.slug}/giornata-${round.n}`, `${round.n}ª giornata`, "anteprima-serie-a")}`,
      );
    },
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
      const lines = round.open.map((m) => {
        const b = footballBroadcast(round.sa.slug, m.utcDate, dates);
        if (b?.note) note = b.note;
        return `${esc(shortDayTime(m.utcDate))} ${esc(shortName(m.homeTeam))} – ${esc(shortName(m.awayTeam))}: ${esc(b?.channels ?? "da definire")}`;
      });
      return post(
        `📺 <b>Serie A, ${round.n}ª giornata: dove vederla in TV</b>`,
        lines.join("\n"),
        note ? esc(note) : null,
        "Secondo gli accordi sui diritti TV della stagione 2026/27; controlla sempre il palinsesto ufficiale.",
        `Calendario e pronostici: ${anchor(`/pronostici/${round.sa.slug}/giornata-${round.n}`, `${round.n}ª giornata`, "dove-vederla")}`,
      );
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
      return post(
        `📋 <b>Serie A, la classifica</b> dopo ${Math.max(...table.map((r) => r.playedGames))} giornate`,
        rows.join("\n"),
        scorers.length ? `<b>Marcatori</b>\n${scorers.join("\n")}` : null,
        `${anchor(`/calcio/${sa.slug}/classifica`, "Classifica completa", "classifica")} · ${anchor(`/calcio/${sa.slug}/marcatori`, "marcatori e assist", "classifica")}`,
      );
    },
  },
];

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
  return post(
    `📈 <b>Risultati di oggi e modello</b> – ${dayLabel(today)}`,
    `Esito più probabile verificato in <b>${hits} partite su ${list.length}</b>.`,
    text,
    more > 0 ? `…e altre ${more} partite nell'archivio.` : null,
    `Ogni pronostico resta pubblicato con il suo esito: ${anchor("/metodologia#calibrazione", "archivio e track record", campaign)}`,
  );
}
