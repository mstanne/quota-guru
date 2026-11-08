// Fills the permanent archive (data/archivio/, see scripts/archive-data.mjs) with past seasons, a small block at a
// time, from API-Sports (Pro plan).
//
// Football: for every competition on the site, plus the archive-only ones in ARCHIVE_ONLY (Coppa Italia), the current
// season (matches older than 3 days) and the ARCHIVE_SEASONS before it (default 10, i.e. back to 2016/17; set the
// repository variable ARCHIVE_SEASONS to change it): first the list of finished matches (1 request per season), then the
// matches with all their details, 20 per request (/fixtures?ids=…: result, scorers, cards, substitutions, line-ups,
// statistics, ratings, every player's row). Most recent seasons first, Serie A first.
// NBA: results and quarter scores of the past seasons (1 request per season; box scores are not backfilled).
//
// Each run spends at most ARCHIVE_BACKFILL_MAX requests (default 150, ~2% of the daily Pro quota) and stops; the
// progress is kept in data/archivio/recupero.json, so the next run goes on from there. Each competition-season costs
// ~20 requests and ~2 MB in the `dati` branch: the 7 seasons added by the default of 10 (14 competitions, ~2,000
// requests, ~200 MB) are complete after about two days of normal runs (8 runs a day).
// A past season the plan does not cover (PlanError) is marked as unavailable and skipped, so it never blocks the others.
// Before the matches, the official final standings of every past league season (1 request each, once; season pages).
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/backfill-archive.mjs     (never fails the build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiSports, BudgetError, loadDotEnv, PlanError } from "./lib/api-sports.mjs";
import { footballTeamResolver, loadIdMap, MATCH_OFFSET, saveIdMap, TEAM_OFFSET } from "./lib/id-map.mjs";
import { footballDetails } from "./lib/match-details.mjs";
import { COMPETITIONS, compactFixture, compactStandings, groupIt } from "./fetch-football.mjs";
import { nationalTeamResolver } from "./lib/national-teams.mjs";
import { ARCHIVE, archivedMatch, readJson, upsertMatches, writeJson } from "./archive-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROGRESS = path.join(ARCHIVE, "recupero.json");
const IDMAP = path.join(root, "data", "id-map.json");
const STORE = path.join(root, ".cache", "match-details", "football-store.json");
const SEASONS_BACK = Number(process.env.ARCHIVE_SEASONS || 10);
const MAX = Number(process.env.ARCHIVE_BACKFILL_MAX ?? 150);
const FINAL = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
// Competitions kept in the archive only (no pages, no predictions yet). `check`: the league name the API must return
// for `api` before anything is archived, so a wrong id can never write another competition into the folder.
const ARCHIVE_ONLY = [
  {
    code: "CI",
    slug: "coppa-italia",
    name: "Coppa Italia",
    api: 137,
    check: /coppa italia/i,
    country: "Italy",
    archiveOnly: true,
  },
];

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

  // archive-only competitions: check once that the API id is the expected competition
  progress.leagueCheck ??= {};
  const extra = [];
  for (const c of ARCHIVE_ONLY) {
    if (progress.leagueCheck[c.code] === undefined) {
      budget.left--;
      const [l] = await api.get(`/leagues?id=${c.api}`);
      const ok = !!l && c.check.test(l.league?.name ?? "") && l.country?.name === c.country;
      progress.leagueCheck[c.code] = { ok, name: l ? `${l.league?.name} (${l.country?.name})` : null };
      if (!ok) console.warn(`  ${c.name}: l'id ${c.api} corrisponde a "${progress.leagueCheck[c.code].name}", competizione saltata`);
    }
    if (progress.leagueCheck[c.code].ok) extra.push(c);
  }

  // official final standings of the past seasons of every league (1 request each, once): they include the point
  // deductions and the tie-breaks that a table computed from the results would miss (season pages)
  await standingsJobs(api, progress, budget, { resolve, seasons, year });

  // work list: most recent seasons first, competitions in site order (archive-only ones last)
  const jobs = [];
  for (let back = 0; back <= SEASONS_BACK; back++)
    // national teams: no past-season archive (their recent results are in the model history)
    for (const c of [...COMPETITIONS.filter((c) => !c.national), ...extra]) {
      const current = seasons[c.code]?.year ?? (c.code === "BSA" ? year : new Date().getUTCMonth() >= 6 ? year : year - 1);
      jobs.push({ c, y: current - back, current: back === 0 });
    }

  // past editions of the national-team competitions (after the clubs: they matter less to the season pages)
  for (const c of COMPETITIONS.filter((c) => c.national && c.code !== "FRI")) {
    progress.nationalSeasons ??= {};
    const info = progress.nationalSeasons[c.code];
    if (!info || Date.now() - Date.parse(info.at) > 30 * 86400e3) {
      if (budget.left <= 0) break;
      budget.left--;
      const [l] = await api.get(`/leagues?id=${c.api}`);
      // a wrong id would archive another competition under this name
      if ((l?.league?.name ?? "").toLowerCase() !== c.apiName.toLowerCase()) {
        console.warn(`  ${c.name}: l'id ${c.api} corrisponde a "${l?.league?.name}", edizioni saltate`);
        continue;
      }
      progress.nationalSeasons[c.code] = {
        at: new Date().toISOString(),
        seasons: (l.seasons ?? []).map((s) => ({ year: s.year, start: s.start, end: s.end })),
      };
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const since = `${year - SEASONS_BACK}-01-01`;
  for (const c of COMPETITIONS.filter((c) => c.national && c.code !== "FRI"))
    for (const s of [...(progress.nationalSeasons?.[c.code]?.seasons ?? [])].sort((a, b) => b.year - a.year))
      // ended editions only: the one under way is on the competition's own pages
      if (s.end && s.end < today && s.end >= since) jobs.push({ c, y: s.year, current: false, national: s });

  const resolveNational = nationalTeamResolver(map, logo, TEAM_OFFSET);
  for (const { c, y, current, national } of jobs) {
    if (budget.left <= 0) break;
    if (national) {
      try {
        await footballSeason(api, progress, budget, { c, y, current, resolve: (t) => resolveNational(t), map, national });
        await nationalStandings(api, progress, budget, { c, y, resolve: (t) => resolveNational(t) });
      } catch (err) {
        if (!(err instanceof PlanError)) throw err;
        progress.football[`${c.code}-${y}`] = { ids: [], done: [], complete: true, unavailable: err.message };
      }
      continue;
    }
    try {
      await footballSeason(api, progress, budget, { c, y, current, resolve, map });
    } catch (err) {
      // a past season outside the plan: remember it and go on with the others (the current season must work)
      if (!(err instanceof PlanError) || (current && !c.archiveOnly)) throw err;
      progress.football[`${c.code}-${y}`] = { ids: [], done: [], complete: true, unavailable: err.message };
      console.log(`  ${c.name} ${y}: non disponibile nel piano (${err.message})`);
    }
  }
  saveIdMap(IDMAP, map);
}

/** Final standings of the past league seasons: data/archivio/classifiche/calcio/<competition>/<season>.json */
async function standingsJobs(api, progress, budget, { resolve, seasons, year }) {
  progress.standings ??= {};
  for (let back = 1; back <= SEASONS_BACK; back++)
    for (const c of COMPETITIONS.filter((c) => c.domestic)) {
      if (budget.left <= 0) return;
      const current = seasons[c.code]?.year ?? (c.code === "BSA" ? year : new Date().getUTCMonth() >= 6 ? year : year - 1);
      const y = current - back;
      const key = `${c.code}-${y}`;
      const done = progress.standings[key];
      // an empty answer is asked again after a month; saved or not in the plan: never again
      if (done && (done.status !== "vuota" || Date.now() - Date.parse(done.at) < 30 * 86400e3)) continue;
      budget.left--;
      try {
        const [s] = await api.get(`/standings?league=${c.api}&season=${y}`);
        const raw = s?.league?.standings ?? [];
        const groups = compactStandings(raw, (t) => resolve(t, c.slug)).map((g, i) => ({
          ...g,
          // API-Football ids (logos) and the zone of each row ("Promotion - Champions League", "Relegation"…)
          table: g.table.map((row, j) => ({ ...row, apiId: raw[i]?.[j]?.team?.id ?? null, description: raw[i]?.[j]?.description ?? null })),
        }));
        if (groups.length)
          writeJson(path.join(ARCHIVE, "classifiche", "calcio", c.slug, `${y}.json`), {
            competition: c.name,
            code: c.code,
            slug: c.slug,
            season: y,
            fetchedAt: new Date().toISOString(),
            groups,
          });
        progress.standings[key] = { status: groups.length ? "ok" : "vuota", at: new Date().toISOString() };
        console.log(`  Classifica finale ${c.name} ${y}: ${groups.length ? "salvata" : "non disponibile"}`);
      } catch (err) {
        if (!(err instanceof PlanError)) throw err;
        progress.standings[key] = { status: "non disponibile", at: new Date().toISOString() };
        console.log(`  Classifica finale ${c.name} ${y}: non disponibile nel piano (${err.message})`);
      }
    }
}

/** Group tables of an ended national-team edition (all groups, 1 request, once): its season page. */
async function nationalStandings(api, progress, budget, { c, y, resolve }) {
  progress.standings ??= {};
  const key = `${c.code}-${y}`;
  if (c.standings === false || progress.standings[key] || !progress.football[key]?.complete || budget.left <= 0) return;
  budget.left--;
  const [s] = await api.get(`/standings?league=${c.api}&season=${y}`);
  const groups = compactStandings(s?.league?.standings ?? [], resolve).map((g) => ({ ...g, group: groupIt(g.group) }));
  if (groups.length)
    writeJson(path.join(ARCHIVE, "classifiche", "calcio", c.slug, `${y}.json`), {
      competition: c.name,
      code: c.code,
      slug: c.slug,
      season: y,
      fetchedAt: new Date().toISOString(),
      groups,
    });
  progress.standings[key] = { status: groups.length ? "ok" : "vuota", at: new Date().toISOString() };
}

async function footballSeason(api, progress, budget, { c, y, current, resolve, map, national = null }) {
  const key = `${c.code}-${y}`;
  const p = (progress.football[key] ??= { ids: null, done: [], complete: false, lines: true });
  // national editions: dates of the edition (season page label) and the round names of national teams
  if (national) Object.assign(p, { start: national.start, end: national.end });
  // the current season is downloaded again once to add every player's row (player pages: last matches, home/away);
  // ~1 request per 20 matches, so a few runs. Past seasons keep what they have.
  if (current && !p.lines) Object.assign(p, { ids: null, done: [], complete: false, lines: true });
  if (p.complete) return;
  if (!p.ids) {
    budget.left--;
    const list = await api.get(`/fixtures?league=${c.api}&season=${y}`);
    // the current season: matches older than 3 days (the recent ones get their details from fetch-match-details.mjs)
    const limit = current ? Date.now() - 3 * 86400e3 : Infinity;
    p.ids = list.filter((f) => FINAL.has(f.fixture?.status?.short) && Date.parse(f.fixture.date) < limit).map((f) => f.fixture.id);
    if (!p.ids.length) {
      p.complete = true;
      return;
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
      const m = compactFixture(f, teamOf, (apiId) => map.footballMatches[String(apiId)] ?? MATCH_OFFSET + apiId, !!national);
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
