// Basketball data. Writes src/data/basket.json and data/basket-history.json (same format as before):
//   - NBA: calendar, results and quarter scores from API-NBA (API-Sports, Pro plan; key API_FOOTBALL_KEY, the same
//     API-Sports account as the football). Until November 2026 they came from BALLDONTLIE: game and team ids are
//     kept through data/id-map.json (scripts/lib/id-map.mjs), so archive, model and team pages do not change.
//   - Lega Basket Serie A: standings from BALLDONTLIE, only if BALLDONTLIE_API_KEY is set (check that its terms allow
//     commercial use); otherwise the last standings are kept.
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/fetch-basket-data.mjs
// Requests per run: 1 for the whole current season, plus 1 for the previous season until it is stored complete.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiSports, loadDotEnv } from "./lib/api-sports.mjs";
import { loadIdMap, MATCH_OFFSET, saveIdMap, TEAM_OFFSET } from "./lib/id-map.mjs";
import { sameTeam, team as teamMatcher } from "./lib/teams.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "basket.json");
const HISTORY = path.join(root, "data", "basket-history.json");
const IDMAP = path.join(root, "data", "id-map.json");
const STATUS = path.join(root, "public", "stato-dati.json");
const DAYS_BACK = 21;
const DAYS_AHEAD = 14;
const DAY = 86400e3;
const PAIR_WINDOW_MS = 36 * 3600e3;

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", JSON.stringify(value) + "\n");
  fs.renameSync(file + ".tmp", file);
};

/**
 * Site team for an API-NBA team: the BALLDONTLIE team with the same name when the site already had it (same id,
 * same names), else a new one. Pairings are kept in data/id-map.json.
 */
function nbaTeamResolver(map, previousTeams) {
  const known = previousTeams.map((t) => ({ t, matcher: teamMatcher({ name: t.name, shortName: t.shortName, tla: t.abbr }) }));
  return (t) => {
    const key = String(t.id);
    if (!map.nbaTeams[key]) {
      const hits = known.filter(({ matcher }) => sameTeam(t.name, matcher));
      const shortName = t.nickname || t.name;
      map.nbaTeams[key] =
        hits.length === 1
          ? { ...hits[0].t }
          : {
              id: TEAM_OFFSET + t.id,
              name: t.name,
              shortName,
              city: t.name.endsWith(shortName) ? t.name.slice(0, -shortName.length).trim() : null,
              abbr: t.code ?? "",
            };
    }
    return map.nbaTeams[key];
  };
}

/** API-NBA stage: the most frequent value is the regular season; lower = preseason, higher = postseason. */
function stagesOf(games) {
  const count = new Map();
  for (const g of games) count.set(g.stage, (count.get(g.stage) ?? 0) + 1);
  const regular = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return { pre: (g) => g.stage < regular, post: (g) => g.stage > regular };
}

function statusOf(g) {
  const long = String(g.status?.long ?? "").toLowerCase();
  if (long.includes("postponed") || long.includes("canceled") || long.includes("cancelled")) return "postponed";
  if (g.status?.short === 3 || long === "finished") return "final";
  if (g.status?.short === 2 || long.includes("play") || long.includes("half")) return "live";
  return "scheduled";
}

async function main() {
  loadDotEnv(root);
  const key = process.env.API_FOOTBALL_KEY;
  const now = Date.now();
  const previous = readJson(OUT, { nba: { season: null, games: [] }, lba: { season: null, standings: [] } });
  const status = { updatedAt: new Date(now).toISOString(), source: "API-NBA", ok: false };
  if (!key) {
    console.warn("API_FOOTBALL_KEY non impostata: mantengo i dati NBA esistenti (src/data/basket.json).");
    return;
  }
  const api = apiSports("nba", key);
  const map = loadIdMap(IDMAP);
  const prevTeams = new Map();
  for (const g of previous.nba?.games ?? []) for (const t of [g.home, g.away]) prevTeams.set(t.id, t);
  const teamOf = nbaTeamResolver(map, [...prevTeams.values()]);
  const taken = new Set(Object.values(map.nbaGames));
  const prevGames = previous.nba?.games ?? [];
  const gameId = (apiId, home, away, utcDate) => {
    const k = String(apiId);
    if (map.nbaGames[k] != null) return map.nbaGames[k];
    const t = Date.parse(utcDate);
    const old = prevGames.find(
      (g) => !taken.has(g.id) && g.home.id === home && g.away.id === away && Math.abs(Date.parse(g.utcDate) - t) <= PAIR_WINDOW_MS,
    );
    const id = old ? old.id : MATCH_OFFSET + apiId;
    map.nbaGames[k] = id;
    taken.add(id);
    return id;
  };

  // seasons use the starting year (2026 = 2026-27); a new season starts in October
  const d = new Date(now);
  const season = d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  const seasonGames = async (y) => (await api.get(`/games?league=standard&season=${y}`)).filter((g) => g.teams?.home && g.teams?.visitors);

  const all = await seasonGames(season);
  const { pre, post } = stagesOf(all);
  const toGame = (g) => {
    const home = teamOf(g.teams.home);
    const away = teamOf(g.teams.visitors);
    const utcDate = new Date(g.date?.start).toISOString();
    const st = statusOf(g);
    const lines = (side) => (g.scores?.[side]?.linescore ?? []).map(Number).filter((n) => Number.isFinite(n));
    return {
      id: gameId(g.id, home.id, away.id, utcDate),
      apiId: g.id,
      utcDate,
      status: st,
      postseason: post(g),
      home,
      away,
      score: st === "scheduled" || st === "postponed" ? { home: null, away: null } : { home: g.scores?.home?.points ?? null, away: g.scores?.visitors?.points ?? null },
      periods: st === "final" ? { home: lines("home"), away: lines("visitors") } : null,
      // quarter being played (1–4, 5+ = overtime) and half-time break, for games under way
      ...(st === "live" && g.periods?.current ? { period: g.periods.current, ...(g.status?.halftime ? { halftime: true } : {}) } : {}),
    };
  };
  const regular = all.filter((g) => !pre(g));
  const from = now - DAYS_BACK * DAY;
  const to = now + DAYS_AHEAD * DAY;
  const games = regular
    .filter((g) => {
      const t = Date.parse(g.date?.start);
      return t >= from && t <= to;
    })
    .map(toGame)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  console.log(`NBA ${season}-${String(season + 1).slice(2)}: ${regular.length} partite in stagione, ${games.length} nel calendario del sito`);

  // history for the model: the current season always, the previous one until stored complete
  const history = readJson(HISTORY, { seasons: {}, games: [] });
  history.seasons ??= {};
  const finals = (list) =>
    list
      .filter((g) => !pre(g) && statusOf(g) === "final" && g.scores?.home?.points > 0 && g.scores?.visitors?.points > 0)
      .map((g) => {
        const x = toGame(g);
        return { id: x.id, date: x.utcDate, season: null, home: x.home.id, away: x.away.id, hp: x.score.home, ap: x.score.away, post: x.postseason };
      });
  let kept = (history.games ?? []).filter((g) => g.season !== season);
  const current = finals(all).map((g) => ({ ...g, season }));
  history.seasons[season] = { n: current.length, complete: false, source: "api-nba" };
  // also replaces a season stored from BALLDONTLIE (until November 2026)
  if (!history.seasons[season - 1]?.complete || history.seasons[season - 1]?.source !== "api-nba") {
    const prevAll = await seasonGames(season - 1);
    const { pre: p0, post: p1 } = stagesOf(prevAll);
    const list = prevAll
      .filter((g) => !p0(g) && statusOf(g) === "final" && g.scores?.home?.points > 0)
      .map((g) => ({
        id: MATCH_OFFSET + g.id,
        date: new Date(g.date.start).toISOString(),
        season: season - 1,
        home: teamOf(g.teams.home).id,
        away: teamOf(g.teams.visitors).id,
        hp: g.scores.home.points,
        ap: g.scores.visitors.points,
        post: p1(g),
      }));
    if (list.length) {
      kept = kept.filter((g) => g.season !== season - 1);
      kept.push(...list);
      history.seasons[season - 1] = { n: list.length, complete: list.length > 1000, source: "api-nba" };
      console.log(`  storico NBA ${season - 1}-${String(season).slice(2)}: ${list.length} partite`);
    }
  }
  history.games = [...kept, ...current].filter((g) => g.season >= season - 1).sort((a, b) => a.date.localeCompare(b.date));
  history.updatedAt = new Date(now).toISOString();
  console.log(`  storico NBA ${season}-${String(season + 1).slice(2)}: ${current.length} partite`);

  const lba = await lbaStandings(previous.lba, now);
  writeJson(HISTORY, history);
  writeJson(OUT, {
    generatedAt: new Date(now).toISOString(),
    source: "API-NBA",
    nba: { season, games },
    lba,
  });
  saveIdMap(IDMAP, map);
  Object.assign(status, { ok: true, games: games.length }, api.stats());
  const st = readJson(STATUS, {});
  st.calendarioNba = status;
  writeJson(STATUS, st);
  console.log(`Salvato src/data/basket.json: ${games.length} partite NBA (${api.stats().requests} richieste).`);
}

/** Lega Basket Serie A standings from BALLDONTLIE, only with its key; otherwise the last ones are kept. */
async function lbaStandings(prev, now) {
  const key = process.env.BALLDONTLIE_API_KEY;
  const keep = prev ?? { season: null, standings: [] };
  if (!key) return keep;
  const d = new Date(now);
  const season = d.getUTCMonth() >= 7 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  try {
    const res = await fetch(`https://api.balldontlie.io/lba/v1/standings?season=${season}&per_page=100`, { headers: { Authorization: key } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()).data ?? [];
    if (!rows.length) return keep;
    return {
      season,
      standings: rows
        .map((r) => ({
          rank: r.rank,
          team: { id: r.team.id, name: r.team.name, abbr: r.team.abbreviation },
          played: r.games_played,
          won: r.wins,
          lost: r.losses,
          pointsFor: r.points_for,
          pointsAgainst: r.points_against,
        }))
        .sort((a, b) => a.rank - b.rank),
    };
  } catch (err) {
    console.warn(`  classifica Serie A basket non aggiornata: ${err.message}`);
    return keep;
  }
}

main().catch((err) => {
  console.error("Download dati basket non riuscito:", err.message);
  process.exit(1);
});
