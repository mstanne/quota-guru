// Splits the football data by competition, so a match, round, standings or competition page downloads only its
// own competition instead of the whole snapshot (faster pages on mobile).
//
// Reads  src/data/football.json, src/data/football-predictions.json, src/data/archived-predictions-calcio.json
// Writes src/data/football/index.json          competitions (no matches), data time, recalculated track record
//        src/data/football/comp-<slug>.json    one competition: matches, standings, head-to-head, predictions
//                                             and archived predictions of its matches
// Runs in `npm run build` after the prediction scripts, and before `npm run dev`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TIME_FILE } from "../src/lib/eventTiming.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "football");
const read = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};
const football = read("src/data/football.json", { generatedAt: null, competitions: [], headToHead: {} });
const predictions = read("src/data/football-predictions.json", { predictions: {} }).predictions ?? {};
const archived = read("src/data/archived-predictions-calcio.json", {});
let now;
try {
  now = Date.parse(fs.readFileSync(path.join(root, BUILD_TIME_FILE), "utf8").trim());
} catch {
  now = Date.now();
}
if (!Number.isFinite(now)) now = Date.now();

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const romeDay = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date(iso));
const matchPath = (c, m) =>
  `/calcio/${c.slug}/${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`;
const pick = (obj, ids) => Object.fromEntries(ids.filter((id) => obj[id] !== undefined).map((id) => [id, obj[id]]));

fs.mkdirSync(OUT, { recursive: true });
const written = new Set();
for (const c of football.competitions) {
  if (!c.matches.length && !c.standings.length) continue;
  const ids = c.matches.map((m) => String(m.id));
  const file = `comp-${c.slug}.json`;
  fs.writeFileSync(
    path.join(OUT, file),
    JSON.stringify({
      generatedAt: football.generatedAt,
      competition: c,
      headToHead: pick(football.headToHead ?? {}, ids),
      predictions: pick(predictions, ids),
      archived: pick(archived, ids),
    }) + "\n",
  );
  written.add(file);
}
// competitions no longer in the data
for (const f of fs.readdirSync(OUT)) if (f.startsWith("comp-") && !written.has(f)) fs.rmSync(path.join(OUT, f));

// recalculated track record (used by the site until the archive of published predictions is long enough):
// finished matches re-predicted with the data available before kick-off, low-reliability ones excluded
const entries = [];
for (const c of football.competitions)
  for (const m of c.matches) {
    const p = predictions[m.id];
    const ft = m.score?.fullTime;
    const played = (m.status === "FINISHED" || m.status === "AWARDED") && ft?.home != null && ft?.away != null;
    if (!p || !p.pre || p.confidence === "bassa" || !played) continue;
    const top = p.p.indexOf(Math.max(...p.p));
    const outcome = ft.home > ft.away ? 0 : ft.home === ft.away ? 1 : 2;
    const names = [m.homeTeam.shortName, "pareggio", m.awayTeam.shortName];
    entries.push({
      key: `f${m.id}`,
      path: matchPath(c, m),
      label: `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`,
      where: c.name,
      utcDate: m.utcDate,
      pick: `${["1", "X", "2"][top]} · ${names[top]}`,
      prob: p.p[top],
      result: `${ft.home}-${ft.away}`,
      hit: top === outcome,
    });
  }
entries.sort((a, b) => b.utcDate.localeCompare(a.utcDate));
const from = new Date(now - 30 * 86400000).toISOString();
const count = (list) => ({ n: list.length, hits: list.filter((e) => e.hit).length });

fs.writeFileSync(
  path.join(OUT, "index.json"),
  JSON.stringify({
    generatedAt: football.generatedAt,
    competitions: football.competitions
      .filter((c) => c.matches.length || c.standings.length)
      .map(({ code, slug, name, area, season, standings, matches }) => ({
        code, slug, name, area, season, hasStandings: standings.length > 0,
        // rounds of the league phase of the cups are "fase-campionato-giornata-<n>" (src/lib/footballCore.ts)
        leaguePhase: matches.some((m) => m.stage === "LEAGUE_STAGE"),
      })),
    trackRecord: { all: count(entries), last30: count(entries.filter((e) => e.utcDate >= from)), recent: entries.slice(0, 10) },
  }) + "\n",
);
console.log(`Dati calcio per competizione: ${written.size} file (src/data/football)`);
