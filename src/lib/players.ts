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
export interface FootballPlayer {
  id: number;
  url: string;
  name: string;
  fullName: string;
  birth: string | null;
  age: number | null;
  nationality: string | null;
  height: number | null;
  position: string | null;
  team: { id: number; slug: string; name: string; shortName: string; crest: string | null };
  competition: { slug: string; name: string; season: string } | null;
  ranks: { scorers?: PlayerRank; assists?: PlayerRank } | null;
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
