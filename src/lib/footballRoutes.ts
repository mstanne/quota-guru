// Metadata of the football pages generated from the football-data.org snapshot
// (one per competition, one per standings table, one per match). Kept out of src/routes.ts
// so that the football data is not part of the initial JavaScript bundle.
import { allMatches, competitionMeta, competitions, matchMeta, standingsMeta } from "./football";
import type { RouteMeta } from "../routes";
import { predictionFor } from "./predictions";
import { highlightFor } from "./highlights";
import type { Competition, Match } from "./footballCore";

/** Official highlights: only Serie A for now (scripts/fetch-highlights.mjs). */
export const highlightOf = (c: Competition, m: Match) =>
  c.slug === "serie-a" ? highlightFor("serie-a", m.id) : undefined;

export function footballRoutes(): RouteMeta[] {
  return [
    ...competitions.map(competitionMeta),
    ...competitions.filter((c) => c.standings.length > 0).map(standingsMeta),
    ...allMatches.map(({ competition, match }) => matchMeta(competition, match, !!predictionFor(match.id), highlightOf(competition, match))),
  ];
}
