// Match details of finished games from API-Sports (one key for API-Football and API-NBA):
//   football: events (goals, cards, substitutions → timeline), line-ups, team statistics, player ratings (top rated)
//             and every player's row (data/football-player-lines.json, for the player pages);
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
import { footballDetails, num } from "./lib/match-details.mjs";

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
// Every player's row of the football matches still in the data (match id → home/away rows, see PLAYER_LINE in
// scripts/lib/match-details.mjs): kept out of football-details.json, which the match pages load whole.
const OUT_LINES = path.join(root, "data", "football-player-lines.json");
const TEAMS = path.join(root, "data", "football-teams.json");
const SEASONS_BACK = 2; // current season + the 2 before it (football); NBA: current + 1
const DAY = 86400000;

const DAYS_BACK = 3; // finished matches of the last N days are looked up
const RESERVE = 4; // requests left unused each day (manual checks)
const MIN_GAP_MS = Number(process.env.API_SPORTS_GAP_MS ?? 250); // Pro plan: 300 requests/minute
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
  ["serie-b", 136],
  ["europa-league", 3],
  ["conference-league", 848],
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
    // header missing → keep the previous value (Number(null) would be 0 and stop everything)
    const header = res.headers.get("x-ratelimit-requests-remaining");
    const left = header == null || header === "" ? NaN : Number(header);
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

/** Compact form of the four API-Football answers for one fixture. */
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
  // national teams: their matches already carry API-Football's fixture id (scripts/fetch-football.mjs), and one
  // /fixtures?ids= request returns events, line-ups, statistics and players of 20 matches at once
  const todo = all
    .filter((c) => c.national)
    .flatMap((c) => c.matches.map((m) => ({ c, m })))
    .filter(({ m }) => m.apiId && finished(m) && !store.football[m.id] && now - Date.parse(m.utcDate) < DAYS_BACK * 86400000);
  for (let i = 0; i < todo.length; i += 20) {
    const chunk = todo.slice(i, i + 20);
    const list = await api.get(`/fixtures?ids=${chunk.map(({ m }) => m.apiId).join("-")}`);
    for (const { c, m } of chunk) {
      const fx = list.find((f) => f.fixture?.id === m.apiId);
      if (!fx || !["FT", "AET", "PEN"].includes(fx.fixture?.status?.short)) continue;
      const sideOf = (teamId) => (teamId === fx.teams.home.id ? "home" : teamId === fx.teams.away.id ? "away" : null);
      store.football[m.id] = footballDetails(fx, fx.events ?? [], fx.lineups ?? [], fx.statistics ?? [], fx.players ?? [], sideOf);
      console.log(`  ${c.slug}: ${m.homeTeam.shortName}-${m.awayTeam.shortName} ✓`);
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
      id: r.player?.id ?? null,
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
    if (!byDay.has(day)) {
      try {
        byDay.set(day, await api.get(`/games?date=${day}`));
      } catch (err) {
        // the free plan covers only a few days around today: other dates are skipped, not a reason to stop
        if (!(err instanceof PlanError) || !/date/i.test(err.message)) throw err;
        byDay.set(day, []);
      }
    }
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

/** Average rating weighted by appearances, 2 decimals (null without ratings). */
function avgRating(st) {
  const rated = st.filter((x) => num(x.games?.rating) != null && num(x.games?.appearences));
  if (!rated.length) return null;
  const r =
    rated.reduce((t, x) => t + num(x.games.rating) * num(x.games.appearences), 0) /
    rated.reduce((t, x) => t + num(x.games.appearences), 0);
  return Math.round(r * 100) / 100;
}

/** Basic totals of a set of API-Football statistics entries (one per competition). */
function basicTotals(st) {
  const sum = (f) => st.reduce((t, x) => t + (num(f(x)) ?? 0), 0);
  return {
    apps: sum((x) => x.games?.appearences),
    starts: sum((x) => x.games?.lineups),
    min: sum((x) => x.games?.minutes),
    goals: sum((x) => x.goals?.total),
    assists: sum((x) => x.goals?.assists),
    yellow: sum((x) => x.cards?.yellow),
    red: sum((x) => x.cards?.red) + sum((x) => x.cards?.yellowred),
    rating: avgRating(st),
  };
}

/**
 * Players' season totals over all competitions (API-Football /players).
 * v3: also the detailed statistics (shots, passes, defending, duels, dribbles, fouls, penalties, goalkeeping) and the
 * split by competition, used by the player pages. Pass accuracy is left out: its meaning in this endpoint is unclear.
 */
function compactPlayers(rows) {
  return rows
    .map((r) => {
      const all = r.statistics ?? [];
      const st = all.filter((x) => num(x.games?.appearences));
      const sum = (f) => st.reduce((t, x) => t + (num(f(x)) ?? 0), 0);
      const base = basicTotals(st);
      if (!base.apps) return null;
      const number = st.map((x) => num(x.games?.number)).find((n) => n != null) ?? null;
      return {
        id: r.player?.id ?? null,
        name: r.player?.name ?? "",
        first: r.player?.firstname ?? null,
        last: r.player?.lastname ?? null,
        birth: r.player?.birth?.date ?? null,
        height: num(String(r.player?.height ?? "").replace(/\s*cm$/, "")),
        weight: num(String(r.player?.weight ?? "").replace(/\s*kg$/, "")),
        age: r.player?.age ?? null,
        nationality: r.player?.nationality ?? null,
        pos: all.find((x) => x.games?.position)?.games?.position ?? null,
        number,
        ...base,
        comps: [...new Set(st.map((x) => x.league?.name).filter(Boolean))],
        detail: {
          subIn: sum((x) => x.substitutes?.in),
          subOut: sum((x) => x.substitutes?.out),
          bench: sum((x) => x.substitutes?.bench),
          shots: sum((x) => x.shots?.total),
          shotsOn: sum((x) => x.shots?.on),
          passes: sum((x) => x.passes?.total),
          keyPasses: sum((x) => x.passes?.key),
          tackles: sum((x) => x.tackles?.total),
          blocks: sum((x) => x.tackles?.blocks),
          interceptions: sum((x) => x.tackles?.interceptions),
          duels: sum((x) => x.duels?.total),
          duelsWon: sum((x) => x.duels?.won),
          dribbles: sum((x) => x.dribbles?.attempts),
          dribblesOk: sum((x) => x.dribbles?.success),
          foulsDrawn: sum((x) => x.fouls?.drawn),
          fouls: sum((x) => x.fouls?.committed),
          penWon: sum((x) => x.penalty?.won),
          penCommitted: sum((x) => x.penalty?.commited),
          penScored: sum((x) => x.penalty?.scored),
          penMissed: sum((x) => x.penalty?.missed),
          penSaved: sum((x) => x.penalty?.saved),
          saves: sum((x) => x.goals?.saves),
          conceded: sum((x) => x.goals?.conceded),
        },
        // by competition, only when the player played in more than one
        byComp:
          st.length > 1
            ? st.map((x) => ({ league: x.league?.name ?? "", leagueId: x.league?.id ?? null, ...basicTotals([x]) }))
            : undefined,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.min - a.min);
}

// Pro plan: the season statistics would otherwise take a large share of the day's requests in one run
const SEASON_REQUESTS_PER_RUN = 300;
let seasonRequests = 0;

async function footballSeasonsRun(api, seasons, data, now, allowed) {
  const teamsFile = readJson(TEAMS, { teams: {}, competitions: {} });
  seasons.football ??= {};
  seasons.afTeams ??= {};
  for (const [slug, league] of LEAGUES) {
    const comp = data.competitions.find((c) => c.slug === slug);
    if (!comp || ["champions-league", "europa-league", "conference-league"].includes(slug)) continue; // team pages follow the domestic league
    const season = Number(comp.season?.startDate?.slice(0, 4));
    if (!season) continue;
    // a plan limited to some seasons (e.g. "from 2022 to 2024"): only those, with the latest for the club list
    const inPlan = (y) => !allowed || (y >= allowed[0] && y <= allowed[1]);
    const listSeason = allowed ? Math.min(season, allowed[1]) : season;
    const wanted = [];
    for (let y = season; y >= season - SEASONS_BACK; y--) if (inPlan(y)) wanted.push(y);
    if (!wanted.length) continue;
    // API-Football ids, venue and founding year of the league's clubs (1 request, refreshed monthly)
    const key = `${league}-${listSeason}`;
    if (!fresh(seasons.afTeams[key], 30)) {
      const list = await api.get(`/teams?league=${league}&season=${listSeason}`);
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
      for (const y of wanted) {
        const k = `${id}-${y}`;
        // v3: players with their API-Football id, personal data, detailed statistics and split by competition
        // (player pages); older entries, including past seasons, are downloaded again once, a few teams per run
        if (seasons.football[k]?.v === 3 && fresh(seasons.football[k], 4)) continue;
        if (seasonRequests >= SEASON_REQUESTS_PER_RUN) return;
        const players = [];
        for (let page = 1, total = 1; page <= total && page <= 6; page++) {
          seasonRequests++;
          const res = await api.raw(`/players?team=${af.id}&season=${y}&page=${page}`);
          players.push(...(res.response ?? []));
          total = res.paging?.total ?? 1;
        }
        seasons.football[k] = {
          fetchedAt: new Date(now).toISOString(),
          final: y < season, // past seasons: never downloaded again
          afTeam: af.id,
          v: 3,
          players: compactPlayers(players),
        };
        console.log(`  rosa ${fd.shortName ?? fd.name} ${y}/${String(y + 1).slice(2)}: ${seasons.football[k].players.length} giocatori`);
      }
    }
  }
}

/**
 * Per-game box scores of a team-season (API-NBA /players/statistics) → each player's totals and, for the player
 * pages, one row per game played (order of the values: NBA_LINE).
 */
const NBA_LINE = ["game", "min", "pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "tpm", "tpa", "ftm", "fta", "pm", "oreb", "dreb", "pf"];
function nbaAverages(rows) {
  const by = new Map();
  for (const r of rows) {
    const id = r.player?.id;
    const min = parseFloat(String(r.min ?? "0").split(":")[0]) || 0;
    if (id == null || !min) continue;
    const p = by.get(id) ?? {
      id,
      name: [r.player?.firstname, r.player?.lastname].filter(Boolean).join(" "),
      first: r.player?.firstname ?? null,
      last: r.player?.lastname ?? null,
      g: 0, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
      oreb: 0, dreb: 0, pf: 0, games: [],
    };
    p.g++;
    p.min += min;
    for (const [k, src] of [["pts", "points"], ["reb", "totReb"], ["ast", "assists"], ["stl", "steals"], ["blk", "blocks"], ["tov", "turnovers"], ["fgm", "fgm"], ["fga", "fga"], ["tpm", "tpm"], ["tpa", "tpa"], ["ftm", "ftm"], ["fta", "fta"], ["oreb", "offReb"], ["dreb", "defReb"], ["pf", "pFouls"]]) {
      p[k] += num(r[src]) ?? 0;
    }
    const v = (k) => num(r[k]) ?? 0;
    p.games.push([r.game?.id ?? null, min, v("points"), v("totReb"), v("assists"), v("steals"), v("blocks"), v("turnovers"), v("fgm"), v("fga"), v("tpm"), v("tpa"), v("ftm"), v("fta"), num(r.plusMinus), v("offReb"), v("defReb"), v("pFouls")]);
    by.set(id, p);
  }
  return [...by.values()].sort((a, b) => b.pts - a.pts);
}

async function nbaSeasonsRun(api, seasons, data, now, allowed) {
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
    const rosterInPlan = !allowed || (season >= allowed[0] && season <= allowed[1]);
    // v2: with the player ids (links to the player pages)
    if (rosterInPlan && (seasons.nba[rk]?.v !== 2 || !fresh(seasons.nba[rk], 7))) {
      const list = await api.get(`/players?team=${af.id}&season=${season}`);
      seasons.nba[rk] = {
        fetchedAt: new Date(now).toISOString(),
        v: 2,
        players: list.map((p) => ({
          id: p.id ?? null,
          name: [p.firstname, p.lastname].filter(Boolean).join(" "),
          first: p.firstname ?? null,
          last: p.lastname ?? null,
          nbaStart: num(p.nba?.start),
          pro: num(p.nba?.pro),
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
      if (allowed && (y < allowed[0] || y > allowed[1])) continue;
      const k = `${t.id}-${y}`;
      // v2: player ids and one row per game (player pages); older entries, including the past season, once again
      if (seasons.nba[k]?.v === 2 && fresh(seasons.nba[k], 3)) continue;
      const rows = await api.get(`/players/statistics?team=${af.id}&season=${y}`);
      seasons.nba[k] = { fetchedAt: new Date(now).toISOString(), final: y < season, v: 2, players: nbaAverages(rows) };
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
store.allowed ??= {}; // seasons the plan covers, learnt from its error messages
// Pro plan from November 2026: forget the pauses and season limits learnt on the free plan (once)
if (store.plan !== "pro") {
  store.blocked = {};
  store.allowed = {};
  store.plan = "pro";
}
// pauses saved by the previous version of this script (one per sport) are dropped: steps now pause on their own
for (const k of Object.keys(store.blocked)) if (!k.includes(":")) delete store.blocked[k];
const seasons = readJson(SEASONS_STORE, {});
const status = { updatedAt: new Date(now).toISOString(), football: {}, nba: {} };

/** Range of seasons a plan error allows, e.g. "try from 2022 to 2024" → [2022, 2024]. */
const allowedRange = (msg) => {
  const m = String(msg).match(/from (\d{4}) to (\d{4})/);
  return m ? [Number(m[1]), Number(m[2])] : null;
};

/**
 * One sport: match details first, then season statistics, sharing the day's requests. A step the plan refuses is
 * paused for RETRY_HOURS on its own, so the other step keeps working.
 */
async function run(sport, host, steps, data) {
  const st = status[sport];
  const api = client(host, key, st);
  for (const [name, fn] of steps) {
    const id = `${sport}:${name}`;
    const out = (st[name] = {});
    if (store.blocked[id] && Date.parse(store.blocked[id].until) > now) {
      Object.assign(out, { ok: false, message: `piano: ${store.blocked[id].message}` });
      console.log(`${id}: in pausa fino al ${store.blocked[id].until} (${store.blocked[id].message})`);
      continue;
    }
    try {
      try {
        await fn(api, data);
      } catch (err) {
        // the plan names the seasons it covers: learn them and try once more within them
        const range = err instanceof PlanError && /season/i.test(err.message) ? allowedRange(err.message) : null;
        if (!range || String(store.allowed[sport]) === String(range)) throw err;
        store.allowed[sport] = range;
        console.log(`${id}: il piano copre le stagioni ${range[0]}-${range[1]}, riprovo con quelle`);
        await fn(api, data);
      }
      out.ok = true;
      delete store.blocked[id];
    } catch (err) {
      Object.assign(out, { ok: false, message: err.message.slice(0, 200) });
      if (err instanceof PlanError) {
        store.blocked[id] = { until: new Date(now + RETRY_HOURS * 3600000).toISOString(), message: err.message };
        const range = allowedRange(err.message);
        if (range) store.allowed[sport] = range;
        console.log(`${id}: il piano non copre questi dati (${err.message})`);
      } else if (err instanceof BudgetError) {
        console.log(`${id}: ${err.message}, continuo al prossimo aggiornamento`);
        break;
      } else {
        console.warn(`${id}: errore (${err.message})`);
      }
    }
  }
  st.ok = steps.every(([name]) => st[name]?.ok);
  api.report();
}

if (!key) {
  console.log("API_FOOTBALL_KEY non impostata: dettagli partite invariati.");
} else {
  // match details first, then the season statistics with what is left of the day
  await run(
    "football",
    "v3.football.api-sports.io",
    [
      ["details", (api, data) => footballRun(api, store, data, now)],
      ["seasons", (api, data) => footballSeasonsRun(api, seasons, data, now, store.allowed.football)],
    ],
    readJson(FOOTBALL, { competitions: [] }),
  );
  await run(
    "nba",
    "v2.nba.api-sports.io",
    [
      ["details", (api, data) => nbaRun(api, store, data, now)],
      ["seasons", (api, data) => nbaSeasonsRun(api, seasons, data, now, store.allowed.nba)],
    ],
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
  // football: the player rows go to their own file (NBA box scores stay: the NBA match pages show them)
  const noLines = (o) => Object.fromEntries(Object.entries(o).map(([id, { players, ...d }]) => [id, d]));
  fs.writeFileSync(OUT_FOOTBALL, JSON.stringify(noLines(strip(store.football))) + "\n");
  const lines = Object.fromEntries(Object.entries(store.football).filter(([, d]) => d.players).map(([id, d]) => [id, d.players]));
  fs.mkdirSync(path.dirname(OUT_LINES), { recursive: true });
  fs.writeFileSync(OUT_LINES, JSON.stringify(lines) + "\n");
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
// keep what scripts/fetch-football.mjs and fetch-basket-data.mjs wrote earlier in this run
const previous = readJson(STATUS, {});
for (const k of ["calendarioCalcio", "calendarioNba"]) if (previous[k]) status[k] = previous[k];
fs.mkdirSync(path.dirname(STATUS), { recursive: true });
fs.writeFileSync(STATUS, JSON.stringify(status, null, 2) + "\n");
