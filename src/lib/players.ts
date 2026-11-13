// Player pages (/calcio/giocatori/<name>-<id>): ids of the players with a page (small, bundled where players are
// linked) and on-demand loading of their data (src/data/players/part-*.json, built by scripts/derive-players.mjs).
import ids from "../data/players/ids.json";
import { PLAYER_BASE, playerPart, playerUrl, type PlayerNameParts } from "./playerNames.mjs";

export interface PlayerSeason {
  season: number;
  label: string;
  team: { id: number; slug: string; shortName: string; crest: string | null };
  competition: string | null;
  apps: number;
  starts: number;
  min: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  rating: number | null;
  comps: string[];
}
export interface PlayerRank {
  rank: number;
  competition: string;
  slug: string;
  value: number;
}
export interface PlayerTotals {
  apps: number;
  starts: number;
  min: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  rating: number | null;
}
/** Detailed season statistics (API-Football /players), all competitions together. */
export interface PlayerDetail {
  subIn: number;
  subOut: number;
  bench: number;
  shots: number;
  shotsOn: number;
  passes: number;
  keyPasses: number;
  tackles: number;
  blocks: number;
  interceptions: number;
  duels: number;
  duelsWon: number;
  dribbles: number;
  dribblesOk: number;
  foulsDrawn: number;
  fouls: number;
  penWon: number;
  penCommitted: number;
  penScored: number;
  penMissed: number;
  penSaved: number;
  saves: number;
  conceded: number;
}
/** One match of the player (current season). */
export interface PlayerMatch {
  id: number;
  date: string;
  competition: string | null;
  home: boolean;
  opponent: { id: number; name: string; slug: string | null };
  /** [goals for, goals against] */
  score: [number | null, number | null];
  path: string | null;
  min: number;
  rating: number | null;
  goals: number;
  assists: number;
  shots: number;
  shotsOn: number;
  keyPasses: number;
  yellow: number;
  red: number;
  starter: boolean;
  saves: number;
  conceded: number;
}
export interface PlayerSide {
  apps: number;
  min: number;
  goals: number;
  assists: number;
  rating: number | null;
}
export interface PlayerCurrent {
  label: string;
  team: { id: number; slug: string; shortName: string };
  totals: PlayerTotals;
  detail: PlayerDetail | null;
  byComp: (PlayerTotals & { league: string; leagueId: number | null })[] | null;
  homeAway: { home?: PlayerSide | null; away?: PlayerSide | null } | null;
  last: PlayerMatch[];
}
export interface PlayerClub {
  name: string;
  /** team page slug, when the site has the club */
  slug: string | null;
}
export interface PlayerHistory {
  transfers: { date: string; type: string | null; from: PlayerClub | null; to: PlayerClub | null }[];
  trophies: { competition: string; country: string | null; won: string[]; other: { season: string; place: string | null }[] }[];
  sidelined: { type: string; start: string; end: string | null; days: number | null; ongoing: boolean }[];
  /** which kinds have been downloaded at least once (an empty list then means "none") */
  complete: { transfers: boolean; trophies: boolean; sidelined: boolean };
}
/**
 * The player's chances in the next match of his club with a prediction (scripts/derive-players.mjs, model in
 * scripts/lib/scorers.mjs): each one only where it applies.
 */
export interface NextMatch {
  competition: { slug: string; name: string };
  date: string;
  home: { id: number; shortName: string };
  away: { id: number; shortName: string };
  /** the player's club: "h" home, "a" away */
  side: "h" | "a";
  /** at least one goal in the 90 minutes */
  goal?: number;
  /** booked (yellow or red card) */
  card?: number;
  /** goalkeeper expected to start: no goal conceded */
  cleanSheet?: number;
  /** usual penalty taker: scores a penalty */
  penScored?: number;
  /** goalkeeper expected to start: saves a penalty */
  penSaved?: number;
}
export interface FootballPlayer {
  id: number;
  url: string;
  nextMatch?: NextMatch | null;
  /** false: kept out of search engines (few minutes this season, scripts/derive-players.mjs). */
  index?: false;
  name: string;
  fullName: string;
  birth: string | null;
  age: number | null;
  nationality: string | null;
  height: number | null;
  weight?: number | null;
  number?: number | null;
  position: string | null;
  team: { id: number; slug: string; name: string; shortName: string; crest: string | null };
  competition: { slug: string; name: string; season: string } | null;
  ranks: { scorers?: PlayerRank; assists?: PlayerRank } | null;
  /** out or doubtful for the next match */
  availability?: { doubtful: boolean; reason: string | null; date: string } | null;
  history?: PlayerHistory | null;
  current?: PlayerCurrent;
  seasons: PlayerSeason[];
}

const withPage = new Set(ids as number[]);
/** URL of a player's page, or undefined if the player has none. */
export const playerPath = (p: PlayerNameParts & { id?: number | null }) =>
  p.id != null && withPage.has(p.id) ? playerUrl({ ...p, id: p.id }) : undefined;

const loaders = import.meta.glob<{ default: Record<string, FootballPlayer> }>("../data/players/part-*.json");
const cache = new Map<number, Record<string, FootballPlayer>>();
const idOf = (slug?: string) => Number(slug?.match(/-(\d+)$/)?.[1] ?? NaN);

function loadPart(part: number): Promise<unknown> {
  if (cache.has(part)) return Promise.resolve();
  const load = loaders[`../data/players/part-${part}.json`];
  if (!load) return Promise.resolve();
  return load().then((m) => void cache.set(part, m.default));
}
/** Build time: every page is rendered, so every part is loaded first (called by entry-server). */
export const loadAllPlayerData = () => Promise.all(Array.from({ length: 32 }, (_, i) => loadPart(i)));

/** The player's data, or a promise to wait for (Suspense) while its part is loading. */
export function footballPlayer(slug?: string): FootballPlayer | null | Promise<unknown> {
  const id = idOf(slug);
  if (!Number.isFinite(id) || !withPage.has(id)) return null;
  const part = cache.get(playerPart(id));
  if (!part) return loadPart(playerPart(id));
  return part[String(id)] ?? null;
}

/** Data a URL needs before hydration (see preloadForPath in App.tsx). */
export function preloadPlayerData(pathname: string): Promise<unknown> {
  const m = pathname.match(new RegExp(`^${PLAYER_BASE}/([^/]+)$`));
  const id = idOf(m?.[1]);
  return Number.isFinite(id) ? loadPart(playerPart(id)) : Promise.resolve();
}

/** Every player page, for the pre-render (data already loaded by loadAllPlayerData). */
export const allPlayers = () => [...cache.values()].flatMap((p) => Object.values(p));
