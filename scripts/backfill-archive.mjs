// Fills the permanent archive (data/archivio/, see scripts/archive-data.mjs) with past seasons, a small block at a
// time, from API-Sports (Pro plan).
//
// Football: for every competition on the site, the current season (matches older than 3 days) and
// the ARCHIVE_SEASONS before it (default 3): first the list of finished matches (1 request per season), then the
// matches with all their details, 20 per request (/fixtures?ids=…: result, scorers, cards, substitutions, line-ups,
// statistics, ratings). Most recent seasons first, Serie A first.
// NBA: results and quarter scores of the past seasons (1 request per season; box scores are not backfilled).
//
// Each run spends at most ARCHIVE_BACKFILL_MAX requests (default 150, ~2% of the daily Pro quota) and stops; the
// progress is kept in data/archivio/recupero.json, so the next run goes on from there. With 13 competitions and
// 4 seasons (~20,000 matches, ~1,000 requests) the archive is complete after a few days of normal runs.
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/backfill-archive.mjs     (never fails the build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiSports, BudgetError, loadDotEnv, PlanError } from "./lib/api-sports.mjs";
import { footballTeamResolver, loadIdMap, MATCH_OFFSET, saveIdMap, TEAM_OFFSET } from "./lib/id-map.mjs";
import { footballDetails } from "./lib/match-details.mjs";
import { COMPETITIONS, compactFixture } from "./fetch-football.mjs";
import { ARCHIVE, archivedMatch, readJson, upsertMatches, writeJson } from "./archive-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROGRESS = path.join(ARCHIVE, "recupero.json");
const IDMAP = path.join(root, "data", "id-map.json");
const STORE = path.join(root, ".cache", "match-details", "football-store.json");
const SEASONS_BACK = Number(process.env.ARCHIVE_SEASONS ?? 3);
const MAX = Number(process.env.ARCHIVE_BACKFILL_MAX ?? 150);
const FINAL = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const logo = (u) => (typeof u === "string" && /^https:\/\/media\.api-sports\.io\/football\/teams\/\d+\.png$/.test(u) ? u : null);

async function football(api, progress, budget) {
  const map = loadIdMap(IDMAP);
  // known clubs (current data and archive) keep their site id; others get the API-Football id plus the offset
  const football = readJson(path.join(root, "src", "data", "football.json"), { competitions: [] });
  const known = new Map();
  for (const c of football.competitions ?? [])
    for (const m of c.matches ?? [])
      for (const t of [m.homeTeam, m.awayTeam]) {
        const e = known.get(t.id) ?? { team: t, comps: new Set() };
        e.comps.add(c.slug);
        known.set(t.id, e);
      }
  const resolve = footballTeamResolver(map, [...known.values()], logo);
  const seasons = readJson(STORE, {}).seasons ?? {};
  const year = new Date().getUTCFullYear();

  // work list: most recent seasons first, competitions in site order
  const jobs = [];
  for (let back = 0; back <= SEASONS_BACK; back++)
    for (const c of COMPETITIONS) {
      const current = seasons[c.code]?.year ?? (c.code === "BSA" ? year : new Date().getUTCMonth() >= 6 ? year : year - 1);
      jobs.push({ c, y: current - back, current: back === 0 });
    }

  for (const { c, y, current } of jobs) {
    if (budget.left <= 0) break;
    const key = `${c.code}-${y}`;
    const p = (progress.football[key] ??= { ids: null, done: [], complete: false });
    if (p.complete) continue;
    if (!p.ids) {
      budget.left--;
      const list = await api.get(`/fixtures?league=${c.api}&season=${y}`);
      // the current season: matches older than 3 days (the recent ones get their details from fetch-match-details.mjs)
      const limit = current ? Date.now() - 3 * 86400e3 : Infinity;
      p.ids = list.filter((f) => FINAL.has(f.fixture?.status?.short) && Date.parse(f.fixture.date) < limit).map((f) => f.fixture.id);
      if (!p.ids.length) {
        p.complete = true;
        continue;
      }
    }
    const done = new Set(p.done);
    const todo = p.ids.filter((id) => !done.has(id));
    let added = 0;
    for (let i = 0; i < todo.length && budget.left > 0; i += 20) {
      budget.left--;
      const chunk = todo.slice(i, i + 20);
      const fixtures = await api.get(`/fixtures?ids=${chunk.join("-")}`);
      const matches = fixtures.map((f) => {
        const teamOf = (t) => resolve(t, c.slug);
        const m = compactFixture(f, teamOf, (apiId) => map.footballMatches[String(apiId)] ?? MATCH_OFFSET + apiId);
        const sideOf = (id) => (id === f.teams.home.id ? "home" : id === f.teams.away.id ? "away" : null);
        const details = footballDetails(f, f.events ?? [], f.lineups ?? [], f.statistics ?? [], f.players ?? [], sideOf);
        return archivedMatch(m, details, null);
      });
      added += upsertMatches(path.join(ARCHIVE, "calcio", c.slug), { competition: c.name, code: c.code, slug: c.slug }, y, matches);
      p.done.push(...chunk);
    }
    if (p.done.length >= p.ids.length) p.complete = true;
    console.log(`  ${c.name} ${y}: ${p.done.length}/${p.ids.length} partite${p.complete ? " (completa)" : ""}${added ? `, +${added}` : ""}`);
  }
  saveIdMap(IDMAP, map);
}

async function nba(api, progress, budget) {
  const map = loadIdMap(IDMAP);
  const now = new Date();
  const current = now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  for (let y = current - 1; y >= current - SEASONS_BACK && budget.left > 0; y--) {
    const key = `NBA-${y}`;
    if (progress.nba[key]?.complete) continue;
    budget.left--;
    const all = (await api.get(`/games?league=standard&season=${y}`)).filter((g) => g.teams?.home && g.teams?.visitors);
    const count = new Map();
    for (const g of all) count.set(g.stage, (count.get(g.stage) ?? 0) + 1);
    const regular = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const team = (t) =>
      map.nbaTeams[String(t.id)] ?? { id: TEAM_OFFSET + t.id, name: t.name, shortName: t.nickname || t.name, abbr: t.code ?? "" };
    const games = all
      .filter((g) => g.stage >= regular && (g.status?.short === 3 || String(g.status?.long).toLowerCase() === "finished"))
      .map((g) => ({
        id: map.nbaGames[String(g.id)] ?? MATCH_OFFSET + g.id,
        apiId: g.id,
        utcDate: new Date(g.date.start).toISOString(),
        postseason: g.stage > regular,
        home: team(g.teams.home),
        away: team(g.teams.visitors),
        score: { home: g.scores?.home?.points ?? null, away: g.scores?.visitors?.points ?? null },
        periods: {
          home: (g.scores?.home?.linescore ?? []).map(Number).filter(Number.isFinite),
          away: (g.scores?.visitors?.linescore ?? []).map(Number).filter(Number.isFinite),
        },
      }));
    const added = upsertMatches(path.join(ARCHIVE, "nba"), { competition: "NBA" }, y, games);
    progress.nba[key] = { complete: games.length > 0, games: games.length };
    console.log(`  NBA ${y}-${String(y + 1).slice(2)}: ${games.length} partite${added ? `, +${added}` : ""}`);
  }
}

async function main() {
  loadDotEnv(root);
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return console.log("API_FOOTBALL_KEY non impostata: recupero delle stagioni passate rimandato.");
  const progress = readJson(PROGRESS, { football: {}, nba: {} });
  progress.football ??= {};
  progress.nba ??= {};
  const budget = { left: MAX };
  try {
    await football(apiSports("football", key, { reserve: 500 }), progress, budget);
    await nba(apiSports("nba", key, { reserve: 500 }), progress, { left: 5 });
  } catch (err) {
    if (!(err instanceof BudgetError || err instanceof PlanError)) throw err;
    console.log(`Recupero interrotto: ${err.message}`);
  } finally {
    progress.updatedAt = new Date().toISOString();
    writeJson(PROGRESS, progress);
  }
  const f = Object.values(progress.football);
  const left = f.filter((p) => !p.complete).length;
  console.log(
    `Recupero stagioni passate: ${MAX - budget.left} richieste in questo giro; ` +
      `${f.length - left} stagioni di calcio complete${left ? `, ${left} in corso o da iniziare` : ""}.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => console.warn("Recupero delle stagioni passate non riuscito:", err.message));
}
