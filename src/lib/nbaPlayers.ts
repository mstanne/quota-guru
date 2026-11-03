// NBA player pages (/basket/nba/giocatori/<name>-<id>): ids of the players with a page (small, bundled where players
// are linked) and on-demand loading of their data (src/data/players-nba/part-*.json, built by
// scripts/derive-nba-players.mjs).
import ids from "../data/players-nba/ids.json";
import { NBA_PLAYER_BASE, nbaPlayerPart, nbaPlayerUrl } from "./playerNames.mjs";

/** Totals over a set of games (minutes, points, rebounds…). */
export interface NbaTotals {
  g: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  pf: number;
}
export interface NbaPlayerGame {
  id: number;
  date: string;
  home: boolean;
  post: boolean;
  opponent: { id: number; shortName: string; slug: string | null };
  /** [points for, points against] */
  score: [number, number];
  path: string | null;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  pm: number | null;
  oreb: number;
  dreb: number;
  pf: number;
}
export interface NbaBest {
  value: number;
  date: string;
  opponent: string;
  path: string | null;
}
export interface NbaTeamRef {
  id: number;
  slug: string | null;
  shortName: string;
}
export interface NbaPlayer {
  id: number;
  url: string;
  name: string;
  team: { id: number; slug: string; name: string; shortName: string };
  number: string | number | null;
  pos: string | null;
  position: string | null;
  born: string | null;
  country: string | null;
  height: number | null;
  weight: number | null;
  college: string | null;
  nbaStart: number | null;
  pro: number | null;
  current: {
    label: string;
    totals: NbaTotals;
    byTeam: ({ team: NbaTeamRef } & NbaTotals)[] | null;
    best: { pts: NbaBest | null; reb: NbaBest | null; ast: NbaBest | null; tpm: NbaBest | null };
    doubleDoubles: number;
    tripleDoubles: number;
    homeAway: { home: NbaTotals | null; away: NbaTotals | null } | null;
    last: NbaPlayerGame[];
  } | null;
  seasons: ({ season: number; label: string; team: NbaTeamRef } & NbaTotals)[];
}

const withPage = new Set(ids as number[]);
/** URL of an NBA player's page, or undefined if the player has none. */
export const nbaPlayerPath = (p: { id?: number | null; name: string }) =>
  p.id != null && withPage.has(p.id) ? nbaPlayerUrl({ name: p.name, id: p.id }) : undefined;

const loaders = import.meta.glob<{ default: Record<string, NbaPlayer> }>("../data/players-nba/part-*.json");
const cache = new Map<number, Record<string, NbaPlayer>>();
const idOf = (slug?: string) => Number(slug?.match(/-(\d+)$/)?.[1] ?? NaN);

function loadPart(part: number): Promise<unknown> {
  if (cache.has(part)) return Promise.resolve();
  const load = loaders[`../data/players-nba/part-${part}.json`];
  if (!load) return Promise.resolve();
  return load().then((m) => void cache.set(part, m.default));
}
/** Build time: every page is rendered, so every part is loaded first (called by entry-server). */
export const loadAllNbaPlayerData = () => Promise.all(Array.from({ length: 8 }, (_, i) => loadPart(i)));

/** The player's data, or a promise to wait for (Suspense) while its part is loading. */
export function nbaPlayer(slug?: string): NbaPlayer | null | Promise<unknown> {
  const id = idOf(slug);
  if (!Number.isFinite(id) || !withPage.has(id)) return null;
  const part = cache.get(nbaPlayerPart(id));
  if (!part) return loadPart(nbaPlayerPart(id));
  return part[String(id)] ?? null;
}

/** Data a URL needs before hydration (see preloadForPath in App.tsx). */
export function preloadNbaPlayerData(pathname: string): Promise<unknown> {
  const m = pathname.match(new RegExp(`^${NBA_PLAYER_BASE}/([^/]+)$`));
  const id = idOf(m?.[1]);
  return Number.isFinite(id) ? loadPart(nbaPlayerPart(id)) : Promise.resolve();
}

/** Title, description and structured data of an NBA player page (page and pre-render). */
export function nbaPlayerMeta(p: NbaPlayer) {
  const c = p.current;
  const avg = (v: number) => (c && c.totals.g ? (v / c.totals.g).toFixed(1).replace(".", ",") : "0");
  const stats = c
    ? `${avg(c.totals.pts)} punti, ${avg(c.totals.reb)} rimbalzi e ${avg(c.totals.ast)} assist di media in ${c.totals.g} partite nel ${c.label}`
    : "statistiche della stagione";
  const role = p.position ? `${p.position.toLowerCase()} ` : "";
  return {
    path: p.url,
    title: `${p.name}: statistiche NBA ${c?.label ?? ""} e ultime partite`.replace(/\s+/g, " "),
    description: `${p.name}, ${role}dei ${p.team.shortName}${p.country ? ` (${p.country})` : ""}: ${stats}, percentuali al tiro, migliori prestazioni, ultime partite e medie stagione per stagione.`,
    jsonLd: [
      {
        "@type": "Person",
        "@id": `${p.url}#giocatore`,
        name: p.name,
        url: p.url,
        birthDate: p.born ?? undefined,
        nationality: p.country ? { "@type": "Country", name: p.country } : undefined,
        height: p.height ? { "@type": "QuantitativeValue", value: p.height, unitCode: "MTR" } : undefined,
        weight: p.weight ? { "@type": "QuantitativeValue", value: p.weight, unitCode: "KGM" } : undefined,
        jobTitle: p.position ? `Cestista (${p.position.toLowerCase()})` : "Cestista",
        memberOf: { "@type": "SportsTeam", name: p.team.name, url: `/basket/nba/squadre/${p.team.slug}` },
      },
    ],
  };
}
