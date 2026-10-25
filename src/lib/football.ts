// Typed access to the football-data.org snapshot (src/data/football.json).
// The snapshot is refreshed by scripts/fetch-football-data.mjs (scheduled GitHub Action).
// Importing this module includes the whole snapshot in the JS chunk: use ./footballCore for pure helpers.
import raw from "../data/football.json";
import { matchSlug, settleMatch, type Competition, type HeadToHead, type Match } from "./footballCore";

export * from "./footballCore";

interface Snapshot {
  generatedAt: string;
  source: string;
  competitions: Competition[];
  headToHead: Record<string, HeadToHead>;
}

const raw0 = raw as unknown as Snapshot;
// Matches past their expected end but not yet finished at the source become RESULT_PENDING (see settleMatch).
const data: Snapshot = {
  ...raw0,
  competitions: raw0.competitions.map((c) => ({ ...c, matches: c.matches.map((m) => settleMatch(m)) })),
};

export const generatedAt = data.generatedAt;
export const competitions: Competition[] = data.competitions.filter(
  (c) => c.matches.length > 0 || c.standings.length > 0,
);

export const findCompetition = (slug?: string) => competitions.find((c) => c.slug === slug);
export function findMatch(c: Competition | undefined, slug?: string) {
  return c?.matches.find((m) => matchSlug(m) === slug);
}
export const headToHead = (m: Match): HeadToHead | undefined => data.headToHead[String(m.id)];

/** All matches with their competition, sorted by kick-off. */
export const allMatches = competitions
  .flatMap((c) => c.matches.map((m) => ({ competition: c, match: m })))
  .sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));
