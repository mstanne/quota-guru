// "Il punto del modello": every Monday a dated edition with the model's numbers on the season, /il-punto/<date>
// (title and Champions places in the five big leagues, relegation, the European cups, the NBA title, the strength
// ranking), each with the change since the previous edition. Runs in `npm run build` after the prediction scripts.
//
// The first build of each Monday (Rome time, from 06:00) freezes the edition in the predictions archive
// (<archive>/punto/<YYYY-MM-DD>.json, `archivio-pronostici` branch): an edition never changes afterwards, so its
// numbers can be quoted with their date. With no edition at all yet, the first one is written at once (launch).
//
// Sources: src/data/football-season-sim.json (season projections and strength ranking, scripts/predict-football.mjs),
// src/data/nba-season.json (scripts/predict-basket.mjs), src/data/football.json (names, rounds played).
// Writes src/data/punto/<YYYY-MM-DD>.json (one edition, with the changes since the edition before: a page loads only
// its own) and src/data/punto/index.json (every edition, newest first, with the few figures of its title and lead).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TIME_FILE } from "../src/lib/eventTiming.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "punto");
const archiveDir = path.resolve(root, process.env.PREDICTION_ARCHIVE_DIR ?? ".cache/predictions-archive");
const editionsDir = path.join(archiveDir, "punto");
const read = (f, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.isAbsolute(f) ? f : path.join(root, f), "utf8"));
  } catch {
    return fallback;
  }
};

let nowMs;
try {
  nowMs = Date.parse(fs.readFileSync(path.join(root, BUILD_TIME_FILE), "utf8").trim());
} catch {
  nowMs = Date.now();
}
if (!Number.isFinite(nowMs)) nowMs = Date.now();

/** Day (YYYY-MM-DD), weekday (0 = Sunday) and hour in Rome. */
function rome(ms) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    })
      .formatToParts(new Date(ms))
      .map((p) => [p.type, p.value]),
  );
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: `${parts.year}-${parts.month}-${parts.day}`, weekday: days[parts.weekday], hour: Number(parts.hour) };
}

/** Leagues of the edition: Champions League places and direct relegations (as src/lib/seasonOutlook.ts ZONES). */
const LEAGUES = [
  { slug: "serie-a", top: 4, bottom: 3, title: "lo scudetto" },
  { slug: "premier-league", top: 4, bottom: 3, title: "la Premier League" },
  { slug: "liga", top: 4, bottom: 3, title: "la Liga" },
  { slug: "bundesliga", top: 4, bottom: 2, title: "la Bundesliga" },
  { slug: "ligue-1", top: 3, bottom: 2, title: "la Ligue 1" },
];
const CUPS = ["champions-league", "europa-league", "conference-league"];
const r3 = (x) => Math.round(x * 1000) / 1000;
const sum = (a, from, to) => a.slice(from, to).reduce((s, x) => s + x, 0);

/** The numbers of today, for a new edition (null without the season projection). */
function snapshot() {
  const sim = read("src/data/football-season-sim.json", null);
  const football = read("src/data/football.json", { competitions: [] });
  const nba = read("src/data/nba-season.json", null);
  if (!sim?.competitions?.["serie-a"]) return null;
  const comp = new Map(football.competitions.map((c) => [c.slug, c]));
  const leagues = {};
  for (const l of LEAGUES) {
    const s = sim.competitions[l.slug];
    const c = comp.get(l.slug);
    const table = c?.standings?.find((t) => !t.stage || t.stage === "REGULAR_SEASON")?.table;
    if (!s || !table) continue;
    const n = table.length;
    leagues[l.slug] = {
      name: c.name,
      played: Math.max(0, ...table.map((r) => r.playedGames ?? 0)),
      top: l.top,
      bottom: l.bottom,
      titleWord: l.title,
      teams: table
        .map((r) => {
          const t = s.teams[r.team.id];
          if (!t) return null;
          return {
            id: r.team.id,
            name: r.team.shortName,
            pts: r.points,
            xpts: t.xpts,
            title: r3(t.pos[0]),
            top: r3(sum(t.pos, 0, l.top)),
            rel: r3(sum(t.pos, n - l.bottom, n)),
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.xpts - a.xpts),
    };
  }
  const cups = {};
  for (const slug of CUPS) {
    const s = sim.competitions[slug];
    const c = comp.get(slug);
    const table = c?.standings?.[0]?.table;
    if (s?.kind !== "uefa" || !table) continue;
    cups[slug] = {
      name: c.name,
      teams: table
        .map((r) => ({ id: r.team.id, name: r.team.shortName, win: r3(s.teams[r.team.id]?.stage?.[6] ?? 0), r16: r3(s.teams[r.team.id]?.stage?.[2] ?? 0) }))
        .sort((a, b) => b.win - a.win)
        .slice(0, 12),
    };
  }
  const nbaTeams = nba?.runs
    ? Object.values(nba.teams)
        .filter((t) => t.sim)
        .map((t) => ({ id: t.id, name: t.shortName, w: t.w, l: t.l, xw: t.sim.xw, playoffs: t.sim.stage[1], title: t.sim.stage[5] }))
        .sort((a, b) => b.title - a.title)
        .slice(0, 12)
    : [];
  const ranking = Object.entries(sim.ranking ?? {})
    .map(([id, [gf, ga, league, name]]) => ({ id: Number(id), name, league, gd: Math.round((gf - ga) * 100) / 100 }))
    .sort((a, b) => b.gd - a.gd)
    .slice(0, 30)
    .map((t, i) => ({ ...t, rank: i + 1, leagueName: comp.get(t.league)?.name ?? t.league }));
  return { leagues, cups, nba: nbaTeams, ranking };
}

// ---------------------------------------------------------------------------------------------- freeze this Monday
const r = rome(nowMs);
// (only where the archive is: site builds; a local build without it has no editions)
const hasArchive = fs.existsSync(archiveDir);
if (hasArchive) fs.mkdirSync(editionsDir, { recursive: true });
const stored = hasArchive
  ? fs
      .readdirSync(editionsDir)
      .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
      .sort()
  : [];
const due = !stored.includes(`${r.day}.json`) && ((r.weekday === 1 && r.hour >= 6) || stored.length === 0);
if (hasArchive && due) {
  const snap = snapshot();
  if (snap) {
    fs.writeFileSync(path.join(editionsDir, `${r.day}.json`), JSON.stringify({ date: r.day, at: new Date(nowMs).toISOString(), ...snap }) + "\n");
    stored.push(`${r.day}.json`);
    console.log(`Il punto del modello: nuova edizione del ${r.day}`);
  }
}

// ---------------------------------------------------------------------------------------------- site data
const editions = stored
  .sort()
  .map((n) => read(path.join(editionsDir, n), null))
  .filter((e) => e?.date);
/** Changes since the previous edition: percentage points for the chances, places for the ranking. */
function withChanges(e, prev) {
  if (!prev) return { ...e, prev: null };
  const delta = (list, prevList, keys) => {
    const by = new Map((prevList ?? []).map((t) => [t.id, t]));
    return list.map((t) => {
      const p = by.get(t.id);
      if (!p) return t;
      const d = {};
      for (const k of keys) if (typeof t[k] === "number" && typeof p[k] === "number") d[k] = r3(t[k] - p[k]);
      return { ...t, d };
    });
  };
  const leagues = Object.fromEntries(
    Object.entries(e.leagues).map(([k, l]) => [k, { ...l, teams: delta(l.teams, prev.leagues?.[k]?.teams, ["title", "top", "rel", "xpts"]) }]),
  );
  const cups = Object.fromEntries(Object.entries(e.cups ?? {}).map(([k, c]) => [k, { ...c, teams: delta(c.teams, prev.cups?.[k]?.teams, ["win"]) }]));
  const nba = delta(e.nba ?? [], prev.nba, ["title", "playoffs", "xw"]);
  const prevRank = new Map((prev.ranking ?? []).map((t) => [t.id, t.rank]));
  const ranking = (e.ranking ?? []).map((t) => ({ ...t, move: prevRank.has(t.id) ? prevRank.get(t.id) - t.rank : null }));
  return { ...e, leagues, cups, nba, ranking, prev: prev.date };
}
const out = editions.map((e, i) => withChanges(e, editions[i - 1])).reverse();
/** What the list and the titles need: the favourites for the scudetto and for the Champions League. */
function summaryOf(e) {
  const sa = e.leagues["serie-a"]?.teams ?? [];
  const top = [...sa].sort((a, b) => b.title - a.title).slice(0, 3).map((t) => ({ name: t.name, p: t.title, d: t.d?.title ?? null }));
  const cl = e.cups?.["champions-league"]?.teams?.[0];
  return { date: e.date, at: e.at, prev: e.prev, scudetto: top, champions: cl ? { name: cl.name, p: cl.win } : null };
}
fs.mkdirSync(OUT, { recursive: true });
const keep = new Set(["index.json"]);
const write = (name, data) => {
  keep.add(name);
  const f = path.join(OUT, name);
  const text = JSON.stringify(data) + "\n";
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== text) fs.writeFileSync(f, text);
};
for (const e of out) write(`${e.date}.json`, e);
write("index.json", { editions: out.map(summaryOf) });
for (const f of fs.readdirSync(OUT)) if (!keep.has(f)) fs.rmSync(path.join(OUT, f));
console.log(`punto: ${out.length} edizioni${out[0] ? `, l'ultima del ${out[0].date}` : ""}`);
