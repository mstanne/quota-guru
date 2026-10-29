// Football data by competition (src/data/football/*.json, written by scripts/split-football-data.mjs), loaded on
// demand: a match, round, standings or competition page downloads only its own competition. Same pattern as the
// team pages (src/lib/teams.ts): the browser preloads the competition of the current URL before hydrating
// (preloadFootballData, App.tsx), the pre-render loads everything (loadAllCompetitionData, entry-server.tsx), and
// pages reached by in-app navigation wait for it with Suspense.
import index from "../data/football/index.json";
import { settleMatch, matchSlug, type Competition, type HeadToHead, type Match } from "./footballCore";
import type { Prediction } from "./predictionsCore";
import type { TrackEntry } from "./trackRecord";

export interface CompetitionInfo {
  code: string;
  slug: string;
  name: string;
  area: string | null;
  season: Competition["season"];
  hasStandings: boolean;
  /** The competition has a league phase (Champions League): its rounds are "fase-campionato-giornata-<n>". */
  leaguePhase?: boolean;
}
interface CompetitionFile {
  generatedAt: string;
  competition: Competition;
  headToHead: Record<string, HeadToHead>;
  predictions: Record<string, Prediction>;
  archived: Record<string, { published: string; prediction: Omit<Prediction, "pre"> }>;
}

const idx = index as unknown as {
  generatedAt: string;
  competitions: CompetitionInfo[];
  trackRecord: { all: { n: number; hits: number }; last30: { n: number; hits: number }; recent: TrackEntry[] };
};
export const footballIndex = idx.competitions;
export const footballGeneratedAt = idx.generatedAt;
/** Recalculated track record, computed at build time (see src/lib/trackRecord.ts). */
export const recalculatedFootballTrack = idx.trackRecord;
export const findCompetitionInfo = (slug?: string) => idx.competitions.find((c) => c.slug === slug);

/** One competition with the lookups its pages need. */
export class CompetitionData {
  readonly competition: Competition;
  readonly generatedAt: string;
  private readonly file: CompetitionFile;
  constructor(file: CompetitionFile) {
    this.file = file;
    this.generatedAt = file.generatedAt;
    // matches past their expected end but not finished at the source become RESULT_PENDING (see settleMatch)
    this.competition = { ...file.competition, matches: file.competition.matches.map((m) => settleMatch(m)) };
  }
  findMatch(slug?: string) {
    return this.competition.matches.find((m) => matchSlug(m) === slug);
  }
  prediction(id: number): Prediction | undefined {
    return this.file.predictions[String(id)];
  }
  archived(id: number) {
    return this.file.archived[String(id)];
  }
  headToHead(m: Match): HeadToHead | undefined {
    return this.file.headToHead[String(m.id)];
  }
}

const loaders = import.meta.glob<{ default: CompetitionFile }>("../data/football/comp-*.json");
const cache = new Map<string, CompetitionData>();
const fileOf = (slug: string) => `../data/football/comp-${slug}.json`;

export function loadCompetitionData(slug: string): Promise<unknown> {
  if (cache.has(slug)) return Promise.resolve();
  const load = loaders[fileOf(slug)];
  if (!load) return Promise.resolve();
  return load().then((m) => void cache.set(slug, new CompetitionData(m.default)));
}
export const loadAllCompetitionData = () => Promise.all(idx.competitions.map((c) => loadCompetitionData(c.slug)));

/** The competition's data; while it downloads, a promise is thrown for Suspense. null = no such competition. */
export function useCompetitionData(slug?: string): CompetitionData | null {
  if (!findCompetitionInfo(slug) || !loaders[fileOf(slug!)]) return null;
  const hit = cache.get(slug!);
  if (!hit) throw loadCompetitionData(slug!);
  return hit;
}

/** Every competition (the "/calcio" page); throws a promise for Suspense until all are downloaded. */
export function useAllCompetitionData(): CompetitionData[] {
  const missing = idx.competitions.filter((c) => !cache.has(c.slug) && loaders[fileOf(c.slug)]);
  if (missing.length) throw loadAllCompetitionData();
  return idx.competitions.map((c) => cache.get(c.slug)).filter((d): d is CompetitionData => !!d);
}

/** Data a URL needs before hydration (see preloadForPath in App.tsx). */
export function preloadFootballData(pathname: string): Promise<unknown> {
  if (/^\/calcio\/?$/.test(pathname)) return loadAllCompetitionData();
  const m = pathname.match(/^\/(?:calcio|pronostici)\/([^/]+)/);
  if (m && findCompetitionInfo(m[1])) return loadCompetitionData(m[1]);
  return Promise.resolve();
}
