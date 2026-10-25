// Match details of finished games from API-Sports (one key for API-Football and API-NBA):
//   football: events (goals, cards, substitutions → timeline), line-ups, team statistics, player ratings (top rated);
//   NBA:      player box scores (team totals and top performer are computed from them).
// Writes src/data/football-details.json and src/data/basket-details.json (read only by the match pages) and
// public/stato-dati.json (what the last run could get, e.g. if the plan does not cover the current season).
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/fetch-match-details.mjs
// The key is sent in the "x-apisports-key" header, read only from the environment (GitHub secret or a git-ignored
// .env file) and never written to disk or logs. Without a key the existing files are kept.
//
// Free plan: 100 requests per day per sport and 10 per minute. Details of a finished match are downloaded once and
// kept in .cache/match-details (restored between workflow runs); each run spends at most what is left of the day,
// competitions in the order below (Serie A first). If the plan refuses the current season, the run stops and
// retries the next day.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sameTeam, team } from "./lib/teams.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOOTBALL = path.join(root, "src", "data", "football.json");
const BASKET = path.join(root, "src", "data", "basket.json");
const OUT_FOOTBALL = path.join(root, "src", "data", "football-details.json");
const OUT_BASKET = path.join(root, "src", "data", "basket-details.json");
const STATUS = path.join(root, "public", "stato-dati.json");
const STORE = path.join(root, ".cache", "match-details", "api-sports.json");

const DAYS_BACK = 3; // finished matches of the last N days are looked up
const RESERVE = 4; // requests left unused each day (manual checks)
const MIN_GAP_MS = 6500; // ~9 requests/minute, under the free limit of 10
const RETRY_HOURS = 20; // after a "plan does not cover this season" answer

// football-data.org competition slug → API-Football league id; order = priority when the daily budget is short
const LEAGUES = [
  ["serie-a", 135],
  ["champions-league", 2],
  ["premier-league", 39],
  ["liga", 140],
  ["bundesliga", 78],
  ["ligue-1", 61],
  ["eredivisie", 88],
  ["primeira-liga", 94],
  ["championship", 40],
  ["brasileirao", 71],
];

function loadDotEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

class PlanError extends Error {}
class BudgetError extends Error {}

/** One API-Sports host (each sport has its own daily quota). */
function client(host, key, status) {
  let last = 0;
  let remaining = Infinity;
  let used = 0;
  async function get(pathAndQuery) {
    if (remaining <= RESERVE) throw new BudgetError("richieste del giorno esaurite");
    const wait = last + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    // API_SPORTS_TEST_URL: local test server (http://localhost:…) standing in for the API, used only in tests
    const base = process.env.API_SPORTS_TEST_URL ? `${process.env.API_SPORTS_TEST_URL}/${host}` : `https://${host}`;
    const res = await fetch(`${base}${pathAndQuery}`, { headers: { "x-apisports-key": key } });
    used++;
    const left = Number(res.headers.get("x-ratelimit-requests-remaining"));
    if (Number.isFinite(left)) remaining = left;
    if (res.status === 429) throw new BudgetError("limite di richieste raggiunto");
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${pathAndQuery}`);
    const json = await res.json();
    const errors = json.errors && !Array.isArray(json.errors) ? json.errors : {};
    const msg = Object.values(errors).join(" ");
    if (errors.plan) throw new PlanError(errors.plan);
    if (errors.requests || errors.rateLimit) throw new BudgetError(msg);
    if (errors.token) throw new Error(`chiave non valida: ${errors.token}`);
    if (msg) throw new Error(msg);
    return json.response ?? [];
  }
  return {
    get,
    report: () => Object.assign(status, { requests: used, remainingToday: Number.isFinite(remaining) ? remaining : null }),
  };
}

// ---------- football ----------
const num = (v) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace("%", ""));
  return Number.isFinite(n) ? n : null;
};

/** Compact form of the four API-Football answers for one fixture. */
function footballDetails(fx, events, lineups, statistics, players, sideOf) {
  const side = (teamId) => sideOf(teamId);
  const timeline = events
    .filter((e) => side(e.team?.id))
    .map((e) => ({
      minute: e.time?.elapsed ?? null,
      extra: e.time?.extra ?? null,
      side: side(e.team.id),
      type: e.type === "subst" ? "sub" : String(e.type ?? "").toLowerCase(), // goal | card | sub | var
      detail: e.detail ?? "",
      player: e.player?.name ?? null,
      // for substitutions API-Football puts the player coming in under "assist"
      other: e.assist?.name ?? null,
      comment: e.comments ?? null,
    }))
    .filter((e) => Number.isFinite(e.minute));
  const lineup = {};
  for (const l of lineups) {
    const s = side(l.team?.id);
    if (!s) continue;
    const p = (x) => ({ name: x.player?.name ?? "", number: x.player?.number ?? null, pos: x.player?.pos ?? null });
    lineup[s] = {
      formation: l.formation ?? null,
      coach: l.coach?.name ?? null,
      starters: (l.startXI ?? []).map(p),
      bench: (l.substitutes ?? []).map(p),
    };
  }
  const stats = {};
  for (const t of statistics) {
    const s = side(t.team?.id);
    if (!s) continue;
    stats[s] = Object.fromEntries((t.statistics ?? []).map((x) => [x.type, num(x.value)]));
  }
  let top = null;
  for (const t of players) {
    const s = side(t.team?.id);
    if (!s) continue;
    for (const p of t.players ?? []) {
      const st = p.statistics?.[0] ?? {};
      const rating = num(st.games?.rating);
      if (rating == null) continue;
      const goals = st.goals?.total ?? 0;
      const assists = st.goals?.assists ?? 0;
      if (!top || rating > top.rating || (rating === top.rating && goals > top.goals)) {
        top = { name: p.player?.name ?? "", side: s, rating, goals, assists, minutes: st.games?.minutes ?? null };
      }
    }
  }
  return {
    fixture: fx.fixture?.id,
    venue: fx.fixture?.venue?.name ?? null,
    city: fx.fixture?.venue?.city ?? null,
    referee: fx.fixture?.referee ?? null,
    timeline,
    lineups: lineup,
    stats,
    top,
    savedAt: new Date().toISOString(),
  };
}

async function footballRun(api, store, data, now) {
  const all = data.competitions;
  const finished = (m) => ["FINISHED", "AWARDED"].includes(m.status);
  for (const [slug, league] of LEAGUES) {
    const comp = all.find((c) => c.slug === slug);
    if (!comp) continue;
    const todo = comp.matches.filter(
      (m) => finished(m) && !store.football[m.id] && now - Date.parse(m.utcDate) < DAYS_BACK * 86400000,
    );
    if (!todo.length) continue;
    // one request per competition: the fixtures of the last days, to find API-Football's ids
    const season = Number(comp.season?.startDate?.slice(0, 4)) || new Date(now).getUTCFullYear();
    const from = isoDay(Math.min(...todo.map((m) => Date.parse(m.utcDate))) - 86400000);
    const to = isoDay(now);
    const fixtures = await api.get(`/fixtures?league=${league}&season=${season}&from=${from}&to=${to}`);
    for (const m of todo) {
      const home = team(m.homeTeam);
      const away = team(m.awayTeam);
      const fx = fixtures.find(
        (f) =>
          Math.abs(Date.parse(f.fixture?.date) - Date.parse(m.utcDate)) < 3 * 3600000 &&
          sameTeam(f.teams?.home?.name ?? "", home) &&
          sameTeam(f.teams?.away?.name ?? "", away),
      );
      if (!fx) {
        console.log(`  ${slug}: ${m.homeTeam.shortName}-${m.awayTeam.shortName} non trovata su API-Football`);
        continue;
      }
      if (!["FT", "AET", "PEN"].includes(fx.fixture?.status?.short)) continue; // not final there yet: next run
      // safety check: same final score in both sources, otherwise it is not the same match (or not settled yet)
      const ft = m.score.fullTime;
      if (fx.goals && ft.home != null && (fx.goals.home !== ft.home || fx.goals.away !== ft.away)) {
        console.log(`  ${slug}: ${m.homeTeam.shortName}-${m.awayTeam.shortName} punteggio diverso tra le fonti, salto`);
        continue;
      }
      const id = fx.fixture.id;
      const sideOf = (teamId) => (teamId === fx.teams.home.id ? "home" : teamId === fx.teams.away.id ? "away" : null);
      const events = await api.get(`/fixtures/events?fixture=${id}`);
      const lineups = await api.get(`/fixtures/lineups?fixture=${id}`);
      const statistics = await api.get(`/fixtures/statistics?fixture=${id}`);
      const players = await api.get(`/fixtures/players?fixture=${id}`);
      store.football[m.id] = footballDetails(fx, events, lineups, statistics, players, sideOf);
      console.log(`  ${slug}: ${m.homeTeam.shortName}-${m.awayTeam.shortName} ✓`);
    }
  }
}

// ---------- NBA ----------
function nbaDetails(g, rows, sideOf) {
  const players = { home: [], away: [] };
  for (const r of rows) {
    const s = sideOf(r.team?.id);
    if (!s) continue;
    const n = (k) => num(r[k]) ?? 0;
    players[s].push({
      name: [r.player?.firstname, r.player?.lastname].filter(Boolean).join(" "),
      pos: r.pos || null,
      min: r.min ? String(r.min) : null,
      pts: n("points"),
      fgm: n("fgm"),
      fga: n("fga"),
      tpm: n("tpm"),
      tpa: n("tpa"),
      ftm: n("ftm"),
      fta: n("fta"),
      oreb: n("offReb"),
      dreb: n("defReb"),
      reb: n("totReb"),
      ast: n("assists"),
      stl: n("steals"),
      blk: n("blocks"),
      tov: n("turnovers"),
      pf: n("pFouls"),
      pm: num(r.plusMinus),
    });
  }
  return { game: g.id, arena: g.arena?.name ?? null, city: g.arena?.city ?? null, players, savedAt: new Date().toISOString() };
}

async function nbaRun(api, store, data, now) {
  const todo = data.nba.games.filter(
    (g) => g.status === "final" && !store.nba[g.id] && now - Date.parse(g.utcDate) < DAYS_BACK * 86400000,
  );
  // API-NBA dates may follow US time: if a game is not on its UTC day it is looked up on the day before
  const byDay = new Map();
  const gamesOn = async (day) => {
    if (!byDay.has(day)) byDay.set(day, await api.get(`/games?date=${day}`));
    return byDay.get(day);
  };
  for (const g of todo) {
    const home = team({ name: g.home.name, shortName: g.home.shortName, tla: g.home.abbr });
    const away = team({ name: g.away.name, shortName: g.away.shortName, tla: g.away.abbr });
    const t = Date.parse(g.utcDate);
    let found = null;
    for (const day of [isoDay(t), isoDay(t - 86400000)]) {
      found = (await gamesOn(day)).find(
        (x) => sameTeam(x.teams?.home?.name ?? "", home) && sameTeam(x.teams?.visitors?.name ?? "", away),
      );
      if (found) break;
    }
    if (!found) {
      console.log(`  NBA: ${g.home.shortName}-${g.away.shortName} non trovata su API-NBA`);
      continue;
    }
    if (found.status?.short !== 3 && found.status?.long !== "Finished") continue;
    const game = found;
    const sideOf = (id) => (id === game.teams.home.id ? "home" : id === game.teams.visitors.id ? "away" : null);
    const rows = await api.get(`/players/statistics?game=${game.id}`);
    if (!rows.length) continue; // box score not ready yet: next run
    const details = nbaDetails(game, rows, sideOf);
    // safety check: the players' points must add up to the final score of our data
    const pts = (s) => details.players[s].reduce((t, p) => t + p.pts, 0);
    if (pts("home") !== g.score.home || pts("away") !== g.score.away) {
      console.log(`  NBA: ${g.home.shortName}-${g.away.shortName} punti dei giocatori diversi dal risultato, salto`);
      continue;
    }
    store.nba[g.id] = details;
    console.log(`  NBA: ${g.home.shortName}-${g.away.shortName} ✓`);
  }
}

// ---------- main ----------
loadDotEnv();
const key = process.env.API_FOOTBALL_KEY;
const now = Date.now();
const store = readJson(STORE, {});
store.football ??= {};
store.nba ??= {};
store.blocked ??= {};
const status = { updatedAt: new Date(now).toISOString(), football: {}, nba: {} };

async function run(sport, host, fn, data) {
  const st = status[sport];
  if (store.blocked[sport] && Date.parse(store.blocked[sport].until) > now) {
    Object.assign(st, { ok: false, message: `piano: ${store.blocked[sport].message}` });
    console.log(`${sport}: in pausa fino al ${store.blocked[sport].until} (${store.blocked[sport].message})`);
    return;
  }
  const api = client(host, key, st);
  try {
    await fn(api, store, data, now);
    Object.assign(st, { ok: true });
    delete store.blocked[sport];
  } catch (err) {
    Object.assign(st, { ok: false, message: err.message.slice(0, 200) });
    if (err instanceof PlanError) {
      store.blocked[sport] = { until: new Date(now + RETRY_HOURS * 3600000).toISOString(), message: err.message };
      console.log(`${sport}: il piano non copre questi dati (${err.message})`);
    } else if (err instanceof BudgetError) {
      console.log(`${sport}: ${err.message}, continuo al prossimo aggiornamento`);
    } else {
      console.warn(`${sport}: errore (${err.message})`);
    }
  }
  api.report();
}

if (!key) {
  console.log("API_FOOTBALL_KEY non impostata: dettagli partite invariati.");
} else {
  await run("football", "v3.football.api-sports.io", footballRun, readJson(FOOTBALL, { competitions: [] }));
  await run("nba", "v2.nba.api-sports.io", nbaRun, readJson(BASKET, { nba: { games: [] } }));

  // keep only matches still in the data; the archived pages keep the details in their saved HTML
  const fIds = new Set(readJson(FOOTBALL, { competitions: [] }).competitions.flatMap((c) => c.matches.map((m) => String(m.id))));
  const bIds = new Set(readJson(BASKET, { nba: { games: [] } }).nba.games.map((g) => String(g.id)));
  for (const id of Object.keys(store.football)) if (!fIds.has(id)) delete store.football[id];
  for (const id of Object.keys(store.nba)) if (!bIds.has(id)) delete store.nba[id];

  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(store));
  const strip = (o) => Object.fromEntries(Object.entries(o).map(([id, { savedAt, ...d }]) => [id, d]));
  fs.writeFileSync(OUT_FOOTBALL, JSON.stringify(strip(store.football)) + "\n");
  fs.writeFileSync(OUT_BASKET, JSON.stringify(strip(store.nba)) + "\n");
  status.football.matches = Object.keys(store.football).length;
  status.nba.games = Object.keys(store.nba).length;
  console.log(`Dettagli partite: calcio ${status.football.matches}, NBA ${status.nba.games}`);
}
fs.mkdirSync(path.dirname(STATUS), { recursive: true });
fs.writeFileSync(STATUS, JSON.stringify(status, null, 2) + "\n");
