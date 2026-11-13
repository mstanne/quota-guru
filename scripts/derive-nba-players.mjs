// Builds the data of the NBA player pages (runs at every build, no network):
//   src/data/players-nba/ids.json        ids of the players with a page (links from team pages and box scores)
//   src/data/players-nba/part-<n>.json   the players, split in 8 parts by id (a page loads only its part)
// Sources: data/team-seasons-api.json (API-NBA: each team's roster and, by season, every player's totals with one row
// per game, see nbaAverages in scripts/fetch-match-details.mjs), src/data/basket.json (games of the current season),
// data/archivio/nba (games of past seasons, when the archive is there), src/data/teams/index.json (team pages) and
// the results ledger (.cache/seo/results.json, written just before by scripts/derive-results.mjs: game pages).
// A page exists for every player with an API-NBA id who played this season for a team with a page, or is on its
// current roster.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { country } from "./lib/italian.mjs";
import { nbaPlayerPart, nbaPlayerUrl } from "../src/lib/playerNames.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "players-nba");
const read = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.isAbsolute(file) ? file : path.join(root, file), "utf8"));
  } catch {
    return fallback;
  }
};
const api = read("data/team-seasons-api.json", { nba: {} });
const basket = read("src/data/basket.json", { nba: { season: 0, games: [] } });
const teams = read("src/data/teams/index.json", { nba: [] }).nba;
const ledger = read(path.join(process.env.SEO_CACHE_DIR ?? path.join(".cache", "seo"), "results.json"), { nba: {} });

const season = basket.nba.season;
const MIN_AVG_MINUTES = 15;
const MIN_GAMES = 3;
const MIN_GAMES_PREV = 20;
let belowThreshold = 0;
const label = (y) => `${y}-${String(y + 1).slice(2)}`;
const teamById = new Map(teams.map((t) => [t.id, t]));
// order of the per-game rows: NBA_LINE in scripts/fetch-match-details.mjs
const LINE = ["game", "min", "pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "tpm", "tpa", "ftm", "fta", "pm", "oreb", "dreb", "pf"];
const lineOf = (row) => Object.fromEntries(LINE.map((k, i) => [k, row[i] ?? null]));

// games by API-NBA id: current season from the data, past seasons from the archive (if present)
const gameByApi = new Map();
const addGame = (g) => g?.apiId != null && g.score?.home != null && gameByApi.set(g.apiId, g);
for (const g of basket.nba.games) if (g.status === "final") addGame(g);
const archive = path.join(root, "data", "archivio", "nba");
if (fs.existsSync(archive))
  for (const y of fs.readdirSync(archive))
    for (const f of fs.existsSync(path.join(archive, y)) && fs.statSync(path.join(archive, y)).isDirectory() ? fs.readdirSync(path.join(archive, y)) : [])
      for (const g of Object.values(read(path.join(archive, y, f), { matches: {} }).matches ?? {})) if (!gameByApi.has(g.apiId)) addGame(g);

const POS = { G: "Guardia", F: "Ala", C: "Centro", PG: "Playmaker", SG: "Guardia tiratrice", SF: "Ala piccola", PF: "Ala grande" };
const posIt = (p) => (p ? String(p).split("-").map((x) => POS[x] ?? x).join("/") : null);
const SUMS = ["min", "pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "tpm", "tpa", "ftm", "fta", "oreb", "dreb", "pf"];
const totalsOf = (rows) => {
  const t = Object.fromEntries(SUMS.map((k) => [k, 0]));
  for (const r of rows) for (const k of SUMS) t[k] += r[k] ?? 0;
  return { g: rows.length, ...t };
};

// every team-season row and every roster entry, by player id
const seasonRows = new Map(); // id → [{ teamId, y, p }]
const rosterOf = new Map(); // id → { teamId, p }
for (const [key, v] of Object.entries(api.nba ?? {})) {
  const roster = key.match(/^(\d+)-roster$/);
  if (roster && Array.isArray(v)) {
    for (const p of v) if (p?.id != null && teamById.has(Number(roster[1]))) rosterOf.set(p.id, { teamId: Number(roster[1]), p });
    continue;
  }
  const m = key.match(/^(\d+)-(\d{4})$/);
  if (!m || !Array.isArray(v)) continue;
  for (const p of v) {
    if (p?.id == null) continue;
    const list = seasonRows.get(p.id) ?? [];
    list.push({ teamId: Number(m[1]), y: Number(m[2]), p });
    seasonRows.set(p.id, list);
  }
}

/** One game of the player, joined with the game data (null if the game is unknown). */
function gameRow(teamId, row) {
  const l = lineOf(row);
  const g = gameByApi.get(l.game);
  if (!g) return null;
  const home = g.home.id === teamId;
  const opp = home ? g.away : g.home;
  const ref = teamById.get(opp.id);
  const { game, ...stats } = l;
  return {
    id: g.id,
    date: g.utcDate,
    home,
    post: !!g.postseason,
    opponent: { id: opp.id, shortName: ref?.shortName ?? opp.shortName ?? opp.name, slug: ref?.slug ?? null },
    score: home ? [g.score.home, g.score.away] : [g.score.away, g.score.home],
    path: ledger.nba?.[g.id]?.path ?? null,
    ...stats,
  };
}
const doubles = (r) => ["pts", "reb", "ast", "stl", "blk"].filter((k) => (r[k] ?? 0) >= 10).length;

const parts = Array.from({ length: 8 }, () => ({}));
const ids = [];
const allIds = new Set([...seasonRows.keys(), ...rosterOf.keys()]);
for (const id of allIds) {
  const rows = seasonRows.get(id) ?? [];
  const cur = rows.filter((r) => r.y === season && teamById.has(r.teamId) && r.p.g > 0);
  const roster = rosterOf.get(id);
  if (!cur.length && !roster) continue;

  // games of the current season (all teams, if traded), newest first
  const games = cur
    .flatMap((r) => (r.p.games ?? []).map((row) => ({ teamId: r.teamId, g: gameRow(r.teamId, row) })))
    .filter((x) => x.g)
    .sort((a, b) => Date.parse(b.g.date) - Date.parse(a.g.date));
  // current team: the roster, else the team of the latest game, else the one with most games
  const teamId = roster?.teamId ?? games[0]?.teamId ?? [...cur].sort((a, b) => b.p.g - a.p.g)[0]?.teamId;
  const team = teamById.get(teamId);
  if (!team) continue;
  const first = cur[0]?.p ?? rows[0]?.p ?? {};
  const name = roster?.p.name || first.name || [first.first, first.last].filter(Boolean).join(" ");
  if (!name) continue;
  const rp = roster?.p ?? {};

  let current = null;
  if (cur.length) {
    const sum = (k) => cur.reduce((t, r) => t + (r.p[k] ?? 0), 0);
    const totals = { g: sum("g"), ...Object.fromEntries(SUMS.map((k) => [k, sum(k)])) };
    const gl = games.map((x) => x.g);
    const best = (k) => {
      const top = gl.reduce((b, r) => (b == null || (r[k] ?? 0) > (b[k] ?? 0) ? r : b), null);
      return top && top[k] > 0 ? { value: top[k], date: top.date, opponent: top.opponent.shortName, path: top.path } : null;
    };
    const side = (h) => {
      const list = gl.filter((r) => r.home === h && !r.post);
      return list.length ? totalsOf(list) : null;
    };
    current = {
      label: label(season),
      totals,
      // by team, only after a trade
      byTeam:
        cur.length > 1
          ? cur.map((r) => {
              const t = teamById.get(r.teamId);
              return { team: { id: t.id, slug: t.slug, shortName: t.shortName }, g: r.p.g, ...Object.fromEntries(SUMS.map((k) => [k, r.p[k] ?? 0])) };
            })
          : null,
      best: { pts: best("pts"), reb: best("reb"), ast: best("ast"), tpm: best("tpm") },
      doubleDoubles: gl.filter((r) => doubles(r) >= 2).length,
      tripleDoubles: gl.filter((r) => doubles(r) >= 3).length,
      homeAway: gl.length ? { home: side(true), away: side(false) } : null,
      last: gl.slice(0, 10),
    };
  }

  const seasons = rows
    .filter((r) => r.p.g > 0)
    .sort((a, b) => b.y - a.y || b.p.g - a.p.g)
    .map((r) => {
      const t = teamById.get(r.teamId);
      return {
        season: r.y,
        label: label(r.y),
        team: { id: r.teamId, slug: t?.slug ?? null, shortName: t?.shortName ?? String(r.teamId) },
        g: r.p.g,
        ...Object.fromEntries(SUMS.map((k) => [k, r.p[k] ?? 0])),
      };
    });

  const index = searchIndexed(current, seasons);
  if (!index) belowThreshold++;
  const player = {
    id,
    url: nbaPlayerUrl({ name, id }),
    ...(index ? {} : { index: false }),
    name,
    team: { id: team.id, slug: team.slug, name: team.name, shortName: team.shortName },
    number: rp.number ?? null,
    pos: rp.pos ?? null,
    position: posIt(rp.pos),
    born: rp.born ?? null,
    country: country(rp.country) ?? null,
    height: rp.height ?? null,
    weight: rp.weight ?? null,
    college: rp.college ?? null,
    nbaStart: rp.nbaStart ?? null,
    pro: rp.pro ?? null,
    current,
    seasons,
  };
  parts[nbaPlayerPart(id)][id] = player;
  ids.push(id);
}

/**
 * Search engines (November 2026, Search Console): pages of players with few minutes were almost never shown by Google.
 * They stay on the site but out of the index and the sitemap ("noindex") unless the player averages MIN_AVG_MINUTES
 * minutes a game this season (from MIN_GAMES games); before that, last season counts (from MIN_GAMES_PREV games:
 * players back from injury, start of the season). Checked at every build, like the football players.
 */
function searchIndexed(current, seasons) {
  const t = current?.totals;
  if (t && t.g >= MIN_GAMES) return t.min / t.g >= MIN_AVG_MINUTES;
  const prev = seasons.find((s) => s.season < season);
  return !!prev && prev.g >= MIN_GAMES_PREV && prev.min / prev.g >= MIN_AVG_MINUTES;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/^part-\d+\.json$/.test(f)) fs.rmSync(path.join(OUT, f));
parts.forEach((part, i) => fs.writeFileSync(path.join(OUT, `part-${i}.json`), JSON.stringify(part) + "\n"));
fs.writeFileSync(path.join(OUT, "ids.json"), JSON.stringify(ids.sort((a, b) => a - b)) + "\n");
console.log(`Pagine giocatore NBA: ${ids.length} (fuori dall'indice: ${belowThreshold}, meno di ${MIN_AVG_MINUTES} minuti a partita)`);
