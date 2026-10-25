// Team pages: index of every team (small, bundled where team names are linked) and on-demand loading of the
// per-league data (src/data/teams/*.json, built by scripts/derive-teams.mjs).
import index from "../data/teams/index.json";

export interface TeamRef {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  crest?: string | null;
  competition?: string;
}
export interface SeasonRecord {
  position: number;
  size: number;
  played: number;
  won: number;
  draw?: number;
  lost: number;
  gf?: number;
  ga?: number;
  points?: number;
  pf?: number;
  pa?: number;
  home?: { played?: number; won: number; draw?: number; lost: number; gf?: number; ga?: number };
  away?: { played?: number; won: number; draw?: number; lost: number; gf?: number; ga?: number };
}
export interface FootballPlayerSeason {
  name: string;
  age: number | null;
  nationality: string | null;
  pos: string | null;
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
export interface FootballSeason {
  season: number;
  label: string;
  competition: string;
  current: boolean;
  /** Past season whose results are incomplete in the data: the table is approximate. */
  partial?: { played: number; expected: number } | null;
  record: SeasonRecord | null;
  recent: { date: string; home: boolean; opponent: string; gf: number | null; ga: number | null }[];
  players: FootballPlayerSeason[] | null;
}
export interface FootballTeam {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
  competition: { slug: string; name: string };
  area: string | null;
  founded: number | null;
  colors: string | null;
  address: string | null;
  website: string | null;
  venue: { name: string; city: string | null; capacity: number | null; surface: string | null } | null;
  coach: { name: string; nationality: string | null; since: string | null } | null;
  squad: { name: string; position: string | null; born: string | null; nationality: string | null; number: number | null }[];
  seasons: FootballSeason[];
}
export interface NbaPlayerAverages {
  name: string;
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
}
export interface NbaTeam {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  city: string | null;
  abbr: string;
  roster: {
    name: string;
    number: string | null;
    pos: string | null;
    born: string | null;
    country: string | null;
    height: number | null;
    weight: number | null;
    college: string | null;
  }[];
  seasons: { season: number; label: string; current: boolean; record: SeasonRecord | null; players: NbaPlayerAverages[] | null }[];
}

const idx = index as unknown as { football: TeamRef[]; nba: TeamRef[] };
export const footballTeamRefs = idx.football;
export const nbaTeamRefs = idx.nba;

export const teamPaths = { football: "/calcio/squadre", nba: "/basket/nba/squadre" };
const byFootballId = new Map(idx.football.map((t) => [t.id, t]));
const byNbaId = new Map(idx.nba.map((t) => [t.id, t]));
/** URL of a club's page, or undefined if it has none (e.g. a club seen only in the Champions League). */
export const footballTeamPath = (id: number) => {
  const t = byFootballId.get(id);
  return t ? `${teamPaths.football}/${t.slug}` : undefined;
};
export const nbaTeamPath = (id: number) => {
  const t = byNbaId.get(id);
  return t ? `${teamPaths.nba}/${t.slug}` : undefined;
};
export const findFootballRef = (slug?: string) => idx.football.find((t) => t.slug === slug);
export const findNbaRef = (slug?: string) => idx.nba.find((t) => t.slug === slug);

// ---------- data, loaded on demand ----------
const footballLoaders = import.meta.glob<{ default: Record<string, FootballTeam> }>("../data/teams/football-*.json");
const nbaLoader = () => import("../data/teams/nba.json") as unknown as Promise<{ default: Record<string, NbaTeam> }>;
const footballCache = new Map<string, Record<string, FootballTeam>>();
let nbaCache: Record<string, NbaTeam> | null = null;

const fileOf = (comp: string) => `../data/teams/football-${comp}.json`;
export function loadFootballLeague(comp: string): Promise<unknown> {
  if (footballCache.has(comp)) return Promise.resolve();
  const load = footballLoaders[fileOf(comp)];
  if (!load) return Promise.resolve();
  return load().then((m) => void footballCache.set(comp, m.default));
}
export function loadNbaTeams(): Promise<unknown> {
  if (nbaCache) return Promise.resolve();
  return nbaLoader().then((m) => void (nbaCache = m.default));
}
/** Build time: every team page is rendered, so everything is loaded first (called by entry-server). */
export const loadAllTeamData = () =>
  Promise.all([
    ...Object.keys(footballLoaders).map((f) => loadFootballLeague(f.replace(/^.*football-|\.json$/g, ""))),
    loadNbaTeams(),
  ]);

/** The club's data, or a promise to wait for (Suspense) when its league is not loaded yet. */
export function footballTeam(slug?: string): FootballTeam | null | Promise<unknown> {
  const ref = findFootballRef(slug);
  if (!ref?.competition) return null;
  const league = footballCache.get(ref.competition);
  if (!league) return loadFootballLeague(ref.competition);
  return league[String(ref.id)] ?? null;
}
export function nbaTeam(slug?: string): NbaTeam | null | Promise<unknown> {
  const ref = findNbaRef(slug);
  if (!ref) return null;
  if (!nbaCache) return loadNbaTeams();
  return nbaCache[String(ref.id)] ?? null;
}

/** Data a URL needs before hydration (see preloadForPath in App.tsx). */
export function preloadTeamData(pathname: string): Promise<unknown> {
  const f = pathname.match(/^\/calcio\/squadre\/([^/]+)/);
  if (f) {
    const ref = findFootballRef(f[1]);
    return ref?.competition ? loadFootballLeague(ref.competition) : Promise.resolve();
  }
  if (/^\/basket\/nba\/squadre\/[^/]+/.test(pathname)) return loadNbaTeams();
  return Promise.resolve();
}
