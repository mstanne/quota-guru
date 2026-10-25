// Results pages: every finished match that has a page on the site, also after it leaves the data window
// (the page is then published from the archive, see scripts/prerender.mjs).
//
// A ledger of finished matches is kept in .cache/seo/results.json (restored between workflow runs with the archive)
// and updated at every build from the current data. Writes:
//   src/data/results/football-<comp>.json   one file per competition, read only by its results page
//   src/data/results/nba.json               NBA games
//   src/data/results/index.json             competitions and NBA months that have results (routes, links)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER = path.resolve(root, process.env.SEO_CACHE_DIR ?? path.join(".cache", "seo"), "results.json");
const OUT = path.join(root, "src", "data", "results");
const read = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};

// same URL rules as src/lib/footballCore.ts and src/lib/basket.ts
const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const romeDay = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date(iso));
const STAGES = {
  PLAYOFFS: "Playoff",
  LAST_16: "Ottavi di finale",
  QUARTER_FINALS: "Quarti di finale",
  SEMI_FINALS: "Semifinali",
  FINAL: "Finale",
  GROUP_STAGE: "Fase a gironi",
};
const roundLabel = (m) =>
  m.stage === "REGULAR_SEASON" && m.matchday
    ? `${m.matchday}ª giornata`
    : m.stage === "LEAGUE_STAGE" && m.matchday
      ? `Fase campionato · ${m.matchday}ª giornata`
      : (m.stage && STAGES[m.stage]) || (m.matchday ? `${m.matchday}ª giornata` : "Altre partite");
// order of the rounds inside a season: matchday, then knock-out stages
const roundOrder = (m) =>
  (m.matchday ?? 0) + { PLAYOFFS: 100, LAST_16: 200, QUARTER_FINALS: 300, SEMI_FINALS: 400, FINAL: 500 }[m.stage] || (m.matchday ?? 0);

const football = read(path.join(root, "src", "data", "football.json"), { competitions: [] });
const basket = read(path.join(root, "src", "data", "basket.json"), { nba: { season: 0, games: [] } });
const ledger = read(LEDGER, { football: {}, nba: {} });
ledger.football ??= {};
ledger.nba ??= {};

for (const c of football.competitions) {
  const season = Number(c.season?.startDate?.slice(0, 4)) || null;
  for (const m of c.matches) {
    if (m.status !== "FINISHED" || m.score?.fullTime?.home == null) continue;
    ledger.football[m.id] = {
      comp: c.slug,
      season,
      date: m.utcDate,
      round: roundLabel(m),
      order: roundOrder(m),
      home: { id: m.homeTeam.id, name: m.homeTeam.shortName },
      away: { id: m.awayTeam.id, name: m.awayTeam.shortName },
      score: [m.score.fullTime.home, m.score.fullTime.away],
      path: `/calcio/${c.slug}/${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`,
    };
  }
}
for (const g of basket.nba.games) {
  if (g.status !== "final" || g.score?.home == null) continue;
  const name = (t) => t.shortName || t.name;
  ledger.nba[g.id] = {
    season: basket.nba.season,
    date: g.utcDate,
    post: !!g.postseason,
    home: { id: g.home.id, name: name(g.home) },
    away: { id: g.away.id, name: name(g.away) },
    score: [g.score.home, g.score.away],
    path: `/basket/nba/${slugify(name(g.home))}-${slugify(name(g.away))}-${romeDay(g.utcDate)}`,
  };
}
fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
fs.writeFileSync(LEDGER, JSON.stringify(ledger));

// ---------- pages ----------
const seasonLabel = (y, comp) => (comp === "brasileirao" ? String(y) : `${y}/${String(y + 1).slice(2)}`);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const index = { football: [], nba: [] };

const byComp = new Map();
for (const [id, r] of Object.entries(ledger.football)) {
  if (!byComp.has(r.comp)) byComp.set(r.comp, []);
  byComp.get(r.comp).push({ id: Number(id), ...r });
}
for (const c of football.competitions) {
  const list = byComp.get(c.slug);
  if (!list?.length) continue;
  // seasons (newest first) → rounds (latest first) → matches by kick-off
  const seasons = [...new Set(list.map((r) => r.season))].sort((a, b) => b - a);
  const out = seasons.map((y) => {
    const ofSeason = list.filter((r) => r.season === y);
    const rounds = [...new Set(ofSeason.map((r) => r.round))]
      .map((round) => {
        const matches = ofSeason.filter((r) => r.round === round).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
        return { round, order: matches[0].order, last: matches.at(-1).date, matches };
      })
      .sort((a, b) => b.order - a.order || Date.parse(b.last) - Date.parse(a.last))
      .map(({ round, matches }) => ({
        round,
        matches: matches.map(({ id, date, home, away, score, path: p }) => ({ id, date, home, away, score, path: p })),
      }));
    return { season: y, label: y ? seasonLabel(y, c.slug) : "", rounds };
  });
  fs.writeFileSync(path.join(OUT, `football-${c.slug}.json`), JSON.stringify(out) + "\n");
  index.football.push({ slug: c.slug, name: c.name, count: list.length });
}

const months = new Map();
for (const [id, r] of Object.entries(ledger.nba)) {
  const month = romeDay(r.date).slice(0, 7);
  if (!months.has(month)) months.set(month, []);
  months.get(month).push({ id: Number(id), date: r.date, post: r.post, home: r.home, away: r.away, score: r.score, path: r.path });
}
const nbaOut = {};
for (const [month, list] of [...months.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
  // days (latest first) → games by tip-off
  const days = [...new Set(list.map((g) => romeDay(g.date)))].sort().reverse();
  nbaOut[month] = days.map((day) => ({
    day,
    games: list.filter((g) => romeDay(g.date) === day).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
  }));
  index.nba.push({ month, count: list.length });
}
fs.writeFileSync(path.join(OUT, "nba.json"), JSON.stringify(nbaOut) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index) + "\n");
console.log(
  `Risultati: ${Object.keys(ledger.football).length} partite di calcio in ${index.football.length} competizioni, ` +
    `${Object.keys(ledger.nba).length} NBA in ${index.nba.length} mesi`,
);
