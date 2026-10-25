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
// Season statistics for the team pages (players, venue): built up over days, see seasonRun functions below.
const SEASONS_STORE = path.join(root, ".cache", "match-details", "api-sports-seasons.json");
const OUT_SEASONS = path.join(root, "data", "team-seasons-api.json");
const TEAMS = path.join(root, "data", "football-teams.json");
const SEASONS_BACK = 2; // current season + the 2 before it (football); NBA: current + 1
const DAY = 86400000;

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
  async function request(pathAndQuery) {
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
    return json;
  }
  return {
    get: async (p) => (await request(p)).response ?? [],
    raw: request,
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

// ---------- season statistics for the team pages ----------
// Past seasons never change: downloaded once. The current season is refreshed every few days.
const fresh = (entry, days) => entry && (entry.final || Date.now() - Date.parse(entry.fetchedAt) < days * DAY);

/** Players' season totals over all competitions (API-Football /players). */
function compactPlayers(rows) {
  return rows
    .map((r) => {
      const st = r.statistics ?? [];
      const sum = (f) => st.reduce((t, x) => t + (num(f(x)) ?? 0), 0);
      const apps = sum((x) => x.games?.appearences);
      if (!apps) return null;
      const rated = st.filter((x) => num(x.games?.rating) != null && num(x.games?.appearences));
      const rating = rated.length
        ? rated.reduce((t, x) => t + num(x.games.rating) * num(x.games.appearences), 0) /
          rated.reduce((t, x) => t + num(x.games.appearences), 0)
        : null;
      return {
        name: r.player?.name ?? "",
        age: r.player?.age ?? null,
        nationality: r.player?.nationality ?? null,
        pos: st.find((x) => x.games?.position)?.games?.position ?? null,
        apps,
        starts: sum((x) => x.games?.lineups),
        min: sum((x) => x.games?.minutes),
        goals: sum((x) => x.goals?.total),
        assists: sum((x) => x.goals?.assists),
        yellow: sum((x) => x.cards?.yellow),
        red: sum((x) => x.cards?.red) + sum((x) => x.cards?.yellowred),
        rating: rating == null ? null : Math.round(rating * 100) / 100,
        comps: [...new Set(st.filter((x) => num(x.games?.appearences)).map((x) => x.league?.name).filter(Boolean))],
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.min - a.min);
}

async function footballSeasonsRun(api, seasons, data, now) {
  const teamsFile = readJson(TEAMS, { teams: {}, competitions: {} });
  seasons.football ??= {};
  seasons.afTeams ??= {};
  for (const [slug, league] of LEAGUES) {
    const comp = data.competitions.find((c) => c.slug === slug);
    if (!comp || slug === "champions-league") continue; // team pages follow the domestic league
    const season = Number(comp.season?.startDate?.slice(0, 4));
    if (!season) continue;
    // API-Football ids, venue and founding year of the league's clubs (1 request, refreshed monthly)
    const key = `${league}-${season}`;
    if (!fresh(seasons.afTeams[key], 30)) {
      const list = await api.get(`/teams?league=${league}&season=${season}`);
      seasons.afTeams[key] = {
        fetchedAt: new Date(now).toISOString(),
        teams: list.map((t) => ({
          id: t.team?.id,
          name: t.team?.name ?? "",
          founded: t.team?.founded ?? null,
          venue: t.venue?.name
            ? { name: t.venue.name, city: t.venue.city ?? null, capacity: t.venue.capacity ?? null, surface: t.venue.surface ?? null }
            : null,
        })),
      };
    }
    const afList = seasons.afTeams[key].teams;
    const ids = teamsFile.competitions[slug] ?? comp.standings[0]?.table.map((r) => r.team.id) ?? [];
    for (const id of ids) {
      const fd = teamsFile.teams[id] ?? comp.standings[0]?.table.find((r) => r.team.id === id)?.team;
      if (!fd) continue;
      const af = afList.find((t) => sameTeam(t.name, team(fd)));
      if (!af) continue;
      seasons.footballInfo ??= {};
      seasons.footballInfo[id] = { founded: af.founded, venue: af.venue };
      for (let y = season; y >= season - SEASONS_BACK; y--) {
        const k = `${id}-${y}`;
        if (fresh(seasons.football[k], 4)) continue;
        const players = [];
        for (let page = 1, total = 1; page <= total && page <= 6; page++) {
          const res = await api.raw(`/players?team=${af.id}&season=${y}&page=${page}`);
          players.push(...(res.response ?? []));
          total = res.paging?.total ?? 1;
        }
        seasons.football[k] = {
          fetchedAt: new Date(now).toISOString(),
          final: y < season, // past seasons: never downloaded again
          afTeam: af.id,
          players: compactPlayers(players),
        };
        console.log(`  rosa ${fd.shortName ?? fd.name} ${y}/${String(y + 1).slice(2)}: ${seasons.football[k].players.length} giocatori`);
      }
    }
  }
}

/** Per-game box scores of a team-season (API-NBA /players/statistics) → each player's averages. */
function nbaAverages(rows) {
  const by = new Map();
  for (const r of rows) {
    const id = r.player?.id;
    const min = parseFloat(String(r.min ?? "0").split(":")[0]) || 0;
    if (id == null || !min) continue;
    const p = by.get(id) ?? {
      name: [r.player?.firstname, r.player?.lastname].filter(Boolean).join(" "),
      g: 0, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
    };
    p.g++;
    p.min += min;
    for (const [k, src] of [["pts", "points"], ["reb", "totReb"], ["ast", "assists"], ["stl", "steals"], ["blk", "blocks"], ["tov", "turnovers"], ["fgm", "fgm"], ["fga", "fga"], ["tpm", "tpm"], ["tpa", "tpa"], ["ftm", "ftm"], ["fta", "fta"]]) {
      p[k] += num(r[src]) ?? 0;
    }
    by.set(id, p);
  }
  return [...by.values()].sort((a, b) => b.pts - a.pts);
}

async function nbaSeasonsRun(api, seasons, data, now) {
  seasons.nba ??= {};
  const season = data.nba.season;
  if (!fresh(seasons.nbaTeams, 60)) {
    const list = await api.get(`/teams`);
    seasons.nbaTeams = {
      fetchedAt: new Date(now).toISOString(),
      teams: list.filter((t) => t.nbaFranchise && !t.allStar).map((t) => ({ id: t.id, name: t.name, city: t.city ?? null })),
    };
  }
  const ours = new Map();
  for (const g of data.nba.games) for (const t of [g.home, g.away]) ours.set(t.id, t);
  for (const t of ours.values()) {
    const af = seasons.nbaTeams.teams.find((x) => sameTeam(x.name, team({ name: t.name, shortName: t.shortName, tla: t.abbr })));
    if (!af) continue;
    const rk = `${t.id}-roster`;
    if (!fresh(seasons.nba[rk], 7)) {
      const list = await api.get(`/players?team=${af.id}&season=${season}`);
      seasons.nba[rk] = {
        fetchedAt: new Date(now).toISOString(),
        players: list.map((p) => ({
          name: [p.firstname, p.lastname].filter(Boolean).join(" "),
          number: p.leagues?.standard?.jersey ?? null,
          pos: p.leagues?.standard?.pos ?? null,
          born: p.birth?.date ?? null,
          country: p.birth?.country ?? null,
          height: num(p.height?.meters),
          weight: num(p.weight?.kilograms),
          college: p.college ?? null,
        })),
      };
    }
    for (let y = season; y >= season - 1; y--) {
      const k = `${t.id}-${y}`;
      if (fresh(seasons.nba[k], 3)) continue;
      const rows = await api.get(`/players/statistics?team=${af.id}&season=${y}`);
      seasons.nba[k] = { fetchedAt: new Date(now).toISOString(), final: y < season, players: nbaAverages(rows) };
      console.log(`  NBA ${t.shortName} ${y}-${String(y + 1).slice(2)}: ${seasons.nba[k].players.length} giocatori`);
    }
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
const seasons = readJson(SEASONS_STORE, {});
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
  // match details first, then the season statistics with what is left of the day
  await run(
    "football",
    "v3.football.api-sports.io",
    async (api, st, data, t) => {
      await footballRun(api, st, data, t);
      await footballSeasonsRun(api, seasons, data, t);
    },
    readJson(FOOTBALL, { competitions: [] }),
  );
  await run(
    "nba",
    "v2.nba.api-sports.io",
    async (api, st, data, t) => {
      await nbaRun(api, st, data, t);
      await nbaSeasonsRun(api, seasons, data, t);
    },
    readJson(BASKET, { nba: { games: [] } }),
  );

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

  fs.writeFileSync(SEASONS_STORE, JSON.stringify(seasons));
  const pick = (o, f) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, f(v)]));
  fs.mkdirSync(path.dirname(OUT_SEASONS), { recursive: true });
  fs.writeFileSync(
    OUT_SEASONS,
    JSON.stringify({
      updatedAt: new Date(now).toISOString(),
      footballInfo: seasons.footballInfo ?? {},
      football: pick(seasons.football, (v) => v.players),
      nba: pick(seasons.nba, (v) => v.players),
    }) + "\n",
  );
  status.football.teamSeasons = Object.keys(seasons.football ?? {}).length;
  status.nba.teamSeasons = Object.keys(seasons.nba ?? {}).filter((k) => !k.endsWith("-roster")).length;
}
fs.mkdirSync(path.dirname(STATUS), { recursive: true });
fs.writeFileSync(STATUS, JSON.stringify(status, null, 2) + "\n");
