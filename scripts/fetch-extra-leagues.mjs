// Competitions not in the football-data.org free plan, from API-Football (API-Sports): Serie B, Europa League and
// Conference League. They are added to src/data/football.json in the same format, so calendar, match pages,
// round pages, standings, team pages and predictions work for them like for the other competitions.
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/fetch-extra-leagues.mjs     (after scripts/fetch-football-data.mjs)
//
// The API-Football FREE plan does not cover the current season: the script then learns it from the error, keeps
// the site unchanged and checks again after RETRY_HOURS. With a paid plan (e.g. Pro) it works on its own.
// Requests per run: 1 per competition for the fixtures, plus 1 per competition for the standings every 12 hours.
// The last good data is kept in .cache/match-details/extra-leagues.json (restored between workflow runs), so a
// failed run never removes the competitions from the site. Serie B results of past seasons, used by the
// prediction model, come from openfootball (public domain) and are added to data/football-history.json once.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { norm, sameTeam, team as teamMatcher } from "./lib/teams.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOOTBALL = path.join(root, "src", "data", "football.json");
const HISTORY = path.join(root, "data", "football-history.json");
const STORE = path.join(root, ".cache", "match-details", "extra-leagues.json");
const STATUS = path.join(root, "public", "stato-dati.json");

export const EXTRA_LEAGUES = [
  { code: "SB", slug: "serie-b", name: "Serie B", api: 136, area: "Italy", after: "SA", openfootball: "it.2" },
  { code: "EL", slug: "europa-league", name: "Europa League", api: 3, area: "Europe", after: "CL" },
  { code: "ECL", slug: "conference-league", name: "Conference League", api: 848, area: "Europe", after: "EL" },
];
const DAYS_BACK = 45; // same window as scripts/fetch-football-data.mjs
const DAYS_AHEAD = 14;
const STANDINGS_EVERY_HOURS = 12;
const KEEP_DAYS = 3; // cached competitions older than this are dropped from the site
const RETRY_HOURS = 20;
const HISTORY_SEASONS = 2;
const MIN_GAP_MS = Number(process.env.API_SPORTS_GAP_MS ?? 6500);
// Ids of teams and matches that do not come from football-data.org get an offset, so they never collide.
const TEAM_OFFSET = 10_000_000;
const MATCH_OFFSET = 1_000_000_000;

function loadDotEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class PlanError extends Error {}

let last = 0;
async function api(key, pathAndQuery) {
  const wait = last + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  // API_SPORTS_TEST_URL: local test server standing in for the API, used only in tests
  const base = process.env.API_SPORTS_TEST_URL
    ? `${process.env.API_SPORTS_TEST_URL}/v3.football.api-sports.io`
    : "https://v3.football.api-sports.io";
  const res = await fetch(base + pathAndQuery, { headers: { "x-apisports-key": key } });
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${pathAndQuery}`);
  const json = await res.json();
  const errors = json.errors && !Array.isArray(json.errors) ? json.errors : {};
  if (errors.plan) throw new PlanError(errors.plan);
  const msg = Object.values(errors).join(" ");
  if (msg) throw new Error(msg);
  return json.response ?? [];
}

// ---------------------------------------------------------------------------------------- conversion
const STATUS_MAP = {
  TBD: "SCHEDULED", NS: "TIMED", "1H": "IN_PLAY", HT: "PAUSED", "2H": "IN_PLAY", ET: "IN_PLAY", BT: "PAUSED",
  P: "IN_PLAY", LIVE: "IN_PLAY", INT: "PAUSED", SUSP: "SUSPENDED", FT: "FINISHED", AET: "FINISHED",
  PEN: "FINISHED", AWD: "AWARDED", WO: "AWARDED", PST: "POSTPONED", CANC: "CANCELLED", ABD: "CANCELLED",
};
/** API-Football round name → football-data.org stage and matchday. */
export function roundOf(round = "") {
  let m = round.match(/^Regular Season - (\d+)/i);
  if (m) return { stage: "REGULAR_SEASON", matchday: Number(m[1]) };
  m = round.match(/^League Stage - (\d+)/i);
  if (m) return { stage: "LEAGUE_STAGE", matchday: Number(m[1]) };
  const r = round.toLowerCase();
  if (r.includes("qualifying") || r.startsWith("preliminary")) return { stage: "QUALIFICATION", matchday: null };
  if (r.includes("knockout round play-offs") || r === "play-offs" || r.includes("play-off")) return { stage: "PLAYOFFS", matchday: null };
  if (r.includes("round of 16") || r.includes("8th finals")) return { stage: "LAST_16", matchday: null };
  if (r.includes("quarter")) return { stage: "QUARTER_FINALS", matchday: null };
  if (r.includes("semi")) return { stage: "SEMI_FINALS", matchday: null };
  if (r === "final") return { stage: "FINAL", matchday: null };
  return { stage: "PLAYOFFS", matchday: null };
}
const tla = (name) => norm(name).replace(/[^A-Z]/g, "").slice(0, 3);
const logo = (u) => (typeof u === "string" && /^https:\/\/media\.api-sports\.io\/football\/teams\/\d+\.png$/.test(u) ? u : null);

/** Teams of the football-data.org competitions, to give the same club the same id (model, team pages). */
function knownTeams(snapshot) {
  const byId = new Map();
  for (const c of snapshot.competitions)
    for (const m of c.matches) for (const t of [m.homeTeam, m.awayTeam]) byId.set(t.id, t);
  return [...byId.values()].map((t) => ({ t, matcher: teamMatcher(t) }));
}
function teamResolver(known) {
  const cache = new Map();
  return (apiTeam) => {
    if (cache.has(apiTeam.id)) return cache.get(apiTeam.id);
    const hits = known.filter(({ matcher }) => sameTeam(apiTeam.name, matcher));
    const out =
      hits.length === 1
        ? { ...hits[0].t }
        : { id: TEAM_OFFSET + apiTeam.id, name: apiTeam.name, shortName: apiTeam.name, tla: tla(apiTeam.name), crest: logo(apiTeam.logo) };
    cache.set(apiTeam.id, out);
    return out;
  };
}

function compactFixture(f, resolve) {
  const status = STATUS_MAP[f.fixture?.status?.short] ?? "SCHEDULED";
  const { stage, matchday } = roundOf(f.league?.round);
  const g = f.goals ?? {};
  const played = status === "FINISHED" || status === "AWARDED" || status === "IN_PLAY" || status === "PAUSED";
  const ft = played ? { home: g.home ?? null, away: g.away ?? null } : { home: null, away: null };
  const ht = f.score?.halftime ?? { home: null, away: null };
  const short = f.fixture?.status?.short;
  const pen = f.score?.penalty;
  let winner = null;
  if (status === "FINISHED" || status === "AWARDED") {
    if (short === "PEN" && pen?.home != null) winner = pen.home > pen.away ? "HOME_TEAM" : "AWAY_TEAM";
    else winner = ft.home > ft.away ? "HOME_TEAM" : ft.home < ft.away ? "AWAY_TEAM" : "DRAW";
  }
  return {
    id: MATCH_OFFSET + f.fixture.id,
    utcDate: new Date(f.fixture.date).toISOString().replace(".000Z", "Z"),
    status,
    matchday,
    stage,
    group: null,
    homeTeam: resolve(f.teams.home),
    awayTeam: resolve(f.teams.away),
    score: {
      winner,
      fullTime: ft,
      halfTime: { home: ht.home ?? null, away: ht.away ?? null },
      ...(short === "AET" || short === "PEN"
        ? {
            duration: short === "PEN" ? "PENALTY_SHOOTOUT" : "EXTRA_TIME",
            regularTime: f.score?.fulltime ?? null,
            extraTime: f.score?.extratime ?? null,
            penalties: short === "PEN" ? pen : null,
          }
        : {}),
    },
    referee: f.fixture?.referee ? String(f.fixture.referee).split(",")[0].trim() : null,
  };
}

function compactStandings(groups, resolve) {
  return groups.map((rows) => ({
    stage: "REGULAR_SEASON",
    group: rows[0]?.group && groups.length > 1 ? rows[0].group : null,
    table: rows.map((r) => ({
      position: r.rank,
      team: resolve(r.team),
      playedGames: r.all?.played ?? 0,
      won: r.all?.win ?? 0,
      draw: r.all?.draw ?? 0,
      lost: r.all?.lose ?? 0,
      points: r.points ?? 0,
      goalsFor: r.all?.goals?.for ?? 0,
      goalsAgainst: r.all?.goals?.against ?? 0,
      goalDifference: r.goalsDiff ?? 0,
    })),
  }));
}

// ---------------------------------------------------------------------------------------- Serie B history
const nameId = (name) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) | 0;
  return -Math.abs(h || 1);
};
async function addHistory(comp, league, startYear) {
  if (!league.openfootball) return;
  const history = readJson(HISTORY, { seasons: {}, results: [] });
  history.seasons ??= {};
  const teams = new Map();
  for (const m of comp.matches) for (const t of [m.homeTeam, m.awayTeam]) teams.set(t.id, { t, matcher: teamMatcher(t) });
  const idOf = (name) => {
    const hits = [...teams.values()].filter(({ matcher }) => sameTeam(name, matcher));
    return hits.length === 1 ? hits[0].t.id : nameId(name);
  };
  let changed = false;
  for (let y = startYear - 1; y >= startYear - HISTORY_SEASONS; y--) {
    const key = `${league.code}-${y}`;
    if (history.seasons[key]?.n > 0) continue;
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/openfootball/football.json/master/${y}-${String(y + 1).slice(2)}/${league.openfootball}.json`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = (json.matches || [])
        .filter((m) => Array.isArray(m.score?.ft))
        .map((m) => ({
          id: `of-${league.code}-${m.date}-${idOf(m.team1)}-${idOf(m.team2)}`,
          date: `${m.date}T${(m.time || "15:00").slice(0, 5)}:00Z`,
          comp: league.code,
          home: idOf(m.team1),
          away: idOf(m.team2),
          hg: m.score.ft[0],
          ag: m.score.ft[1],
        }));
      history.results = (history.results || []).filter((r) => !(r.comp === league.code && seasonStart(r.date) === y));
      history.results.push(...list);
      history.seasons[key] = { n: list.length, source: "openfootball" };
      changed = true;
      console.log(`  storico ${key}: ${list.length} risultati (openfootball)`);
    } catch (err) {
      console.warn(`  storico ${key} non disponibile: ${err.message}`);
    }
  }
  if (changed) {
    history.results.sort((a, b) => a.date.localeCompare(b.date));
    fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
    fs.writeFileSync(HISTORY, JSON.stringify({ ...history, updatedAt: new Date().toISOString() }) + "\n");
  }
}
const seasonStart = (date) => (Number(date.slice(5, 7)) >= 7 ? Number(date.slice(0, 4)) : Number(date.slice(0, 4)) - 1);

// ---------------------------------------------------------------------------------------- main
async function main() {
  loadDotEnv();
  const key = process.env.API_FOOTBALL_KEY;
  const now = Date.now();
  const store = readJson(STORE, { comps: {}, fetchedAt: {}, standingsAt: {} });
  store.comps ??= {};
  store.fetchedAt ??= {};
  store.standingsAt ??= {};
  const snapshot = readJson(FOOTBALL, null);
  if (!snapshot) return console.log("src/data/football.json assente: competizioni extra non aggiunte.");
  const status = { updatedAt: new Date(now).toISOString(), ok: false, competitions: {} };

  const blocked = store.blockedUntil && Date.parse(store.blockedUntil) > now;
  if (!key) status.message = "API_FOOTBALL_KEY non impostata";
  else if (blocked) status.message = `piano: ${store.blockMessage} (nuovo controllo dopo il ${store.blockedUntil})`;
  else {
    const d = new Date(now);
    const season = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
    const from = new Date(now - DAYS_BACK * 86400000).toISOString().slice(0, 10);
    const to = new Date(now + DAYS_AHEAD * 86400000).toISOString().slice(0, 10);
    const resolve = teamResolver(knownTeams(snapshot));
    try {
      for (const league of EXTRA_LEAGUES) {
        const fixtures = await api(key, `/fixtures?league=${league.api}&season=${season}&from=${from}&to=${to}`);
        const prev = store.comps[league.code];
        let standings = prev?.standings ?? [];
        if (!store.standingsAt[league.code] || now - Date.parse(store.standingsAt[league.code]) > STANDINGS_EVERY_HOURS * 3600000) {
          try {
            const s = await api(key, `/standings?league=${league.api}&season=${season}`);
            standings = compactStandings(s[0]?.league?.standings ?? [], resolve);
            store.standingsAt[league.code] = new Date(now).toISOString();
          } catch (err) {
            if (err instanceof PlanError) throw err;
            console.warn(`  classifica ${league.name} non disponibile: ${err.message}`);
          }
        }
        const comp = {
          code: league.code,
          slug: league.slug,
          name: league.name,
          area: league.area,
          season: { startDate: `${season}-07-01`, endDate: `${season + 1}-06-30`, currentMatchday: null },
          matches: fixtures.map((f) => compactFixture(f, resolve)).sort((a, b) => a.utcDate.localeCompare(b.utcDate)),
          standings,
          source: "api-football",
        };
        store.comps[league.code] = comp;
        store.fetchedAt[league.code] = new Date(now).toISOString();
        status.competitions[league.code] = { ok: true, matches: comp.matches.length };
        console.log(`${league.name}: ${comp.matches.length} partite, classifica ${standings.length ? "sì" : "no"}`);
        await addHistory(comp, league, season);
      }
      status.ok = true;
      delete store.blockedUntil;
      delete store.blockMessage;
    } catch (err) {
      if (err instanceof PlanError) {
        store.blockedUntil = new Date(now + RETRY_HOURS * 3600000).toISOString();
        store.blockMessage = err.message;
        status.message = `piano: ${err.message}`;
        console.log(`Serie B / Europa League / Conference League: il piano API-Football non le copre (${err.message})`);
      } else {
        status.message = err.message.slice(0, 200);
        console.warn(`Competizioni extra: errore (${err.message})`);
      }
    }
  }

  // merge the last good data into the snapshot, in display order
  let added = 0;
  for (const league of EXTRA_LEAGUES) {
    const comp = store.comps[league.code];
    const fresh = comp && store.fetchedAt[league.code] && now - Date.parse(store.fetchedAt[league.code]) < KEEP_DAYS * 86400000;
    snapshot.competitions = snapshot.competitions.filter((c) => c.code !== league.code);
    if (!fresh || (!comp.matches.length && !comp.standings.length)) continue;
    const i = snapshot.competitions.findIndex((c) => c.code === league.after);
    snapshot.competitions.splice(i >= 0 ? i + 1 : snapshot.competitions.length, 0, comp);
    added++;
  }
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(store));
  const tmp = FOOTBALL + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(snapshot) + "\n");
  fs.renameSync(tmp, FOOTBALL);
  console.log(`Competizioni extra nel sito: ${added}${status.message ? ` (${status.message})` : ""}`);

  // status for /stato-dati.json (scripts/fetch-match-details.mjs keeps this part when it rewrites the file)
  const st = readJson(STATUS, {});
  st.extraLeagues = status;
  fs.mkdirSync(path.dirname(STATUS), { recursive: true });
  fs.writeFileSync(STATUS, JSON.stringify(st, null, 2) + "\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  main().catch((err) => {
    console.error("Competizioni extra non aggiornate:", err.message);
    process.exit(1);
  });
