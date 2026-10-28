// Metadata of the football pages generated from the football-data.org snapshot
// (one per competition, one per standings table, one per match). Kept out of src/routes.ts
// so that the football data is not part of the initial JavaScript bundle.
import { allMatches, competitionMeta, competitions, matchMeta, standingsMeta } from "./football";
import type { RouteMeta } from "../routes";
import { predictionFor } from "./predictions";
import { highlightFor } from "./highlights";
import type { Competition, Match } from "./footballCore";
import type { EventVenue } from "./schema";

/** Official highlights from YouTube, for the competitions covered by scripts/fetch-highlights.mjs. */
export const highlightOf = (c: Competition, m: Match) => highlightFor(c.slug, m.id);

/** `venueOf(teamId)`: the home team's stadium, when the team data has it (see entry-server.tsx). */
export function footballRoutes(venueOf: (teamId: number) => EventVenue | null = () => null): RouteMeta[] {
  return [
    ...competitions.map(competitionMeta),
    ...competitions.filter((c) => c.standings.length > 0).map(standingsMeta),
    ...allMatches.map(({ competition, match }) => matchMeta(competition, match, !!predictionFor(match.id), highlightOf(competition, match), venueOf(match.homeTeam.id))),
  ];
}
