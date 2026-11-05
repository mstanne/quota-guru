// Quick update of the NBA games under way, between the full refreshes (called by scripts/fetch-live-scores.mjs,
// every 15 minutes). Starts from src/data/basket.json of the last full run and, only if a game is under way or around
// tip-off, asks API-NBA for the games of those dates (1 request per date, usually 1–2 a night: NBA games are played
// at night, Italian time, often across two UTC dates). Changes only status, score, quarter and quarter points of
// those games; calendar, teams and everything else stay as the full run left them.
import fs from "node:fs";
import path from "node:path";
import { apiSports } from "./api-sports.mjs";
import { loadIdMap } from "./id-map.mjs";
import { nbaGameState } from "./nba-games.mjs";

const BEFORE_MS = 15 * 60e3; // from a quarter of an hour before tip-off...
const AFTER_MS = 4 * 3600e3; // ...to 4 hours after it, while the game is not final
const FIELDS = ["status", "score", "periods", "period", "halftime"];

/** Games worth checking now: under way, or around tip-off and not final yet. */
export function liveNbaGames(games, now = Date.now()) {
  return games.filter((g) => {
    if (g.status === "live") return true;
    if (g.status !== "scheduled") return false;
    const t = Date.parse(g.utcDate);
    return now >= t - BEFORE_MS && now <= t + AFTER_MS;
  });
}

const state = (g) => JSON.stringify(FIELDS.map((k) => g[k] ?? null));

/**
 * Updates src/data/basket.json in place. Returns { active, changed }: active = some game was worth checking,
 * changed = the file was rewritten.
 */
export async function updateLiveNba(root, key, now = Date.now()) {
  const file = path.join(root, "src", "data", "basket.json");
  if (!key || !fs.existsSync(file)) return { active: false, changed: false };
  const snap = JSON.parse(fs.readFileSync(file, "utf8"));
  const games = snap.nba?.games ?? [];
  const live = liveNbaGames(games, now);
  if (!live.length) {
    console.log("NBA: nessuna partita in corso o in arrivo.");
    return { active: false, changed: false };
  }
  console.log(`NBA: partite da controllare: ${live.length}`);

  // API-NBA game id of each site game: kept in the data since the move to API-NBA, else from the id map
  const map = loadIdMap(path.join(root, "data", "id-map.json"));
  const apiOf = new Map(Object.entries(map.nbaGames ?? {}).map(([api, site]) => [site, Number(api)]));
  const byApi = new Map();
  for (const g of live) {
    const api = g.apiId ?? apiOf.get(g.id);
    if (api) byApi.set(api, g);
  }
  const dates = [...new Set(live.map((g) => g.utcDate.slice(0, 10)))];

  const api = apiSports("nba", key);
  let changed = 0;
  for (const date of dates) {
    for (const a of await api.get(`/games?date=${date}`)) {
      const g = byApi.get(a.id);
      if (!g) continue;
      const before = state(g);
      for (const k of FIELDS) delete g[k];
      Object.assign(g, nbaGameState(a));
      if (state(g) === before) continue;
      changed++;
      console.log(
        `  ${g.home.shortName ?? g.home.name} – ${g.away.shortName ?? g.away.name}: ${g.status} ${g.score.home ?? "-"}-${g.score.away ?? "-"}${g.period ? ` · Q${g.period}` : ""}`,
      );
    }
  }
  if (changed) {
    snap.generatedAt = new Date(now).toISOString();
    fs.writeFileSync(file + ".tmp", JSON.stringify(snap) + "\n");
    fs.renameSync(file + ".tmp", file);
  }
  console.log(`NBA: partite cambiate: ${changed} (${api.stats().requests} richieste)`);
  return { active: true, changed: changed > 0 };
}
