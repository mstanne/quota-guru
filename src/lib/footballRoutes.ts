// Metadata of the football pages generated from the football-data.org snapshot
// (one per competition, one per standings table, one per match). Kept out of src/routes.ts
// so that the football data is not part of the initial JavaScript bundle.
import { allMatches, competitionMeta, competitions, matchMeta, standingsMeta } from "./football";
import type { RouteMeta } from "../routes";
import { predictionFor } from "./predictions";
import { highlightFor } from "./highlights";
import { eventMeta, pairMatches, pairSlug, nextOfPair, competitionPath, type Competition, type Match } from "./footballCore";
import type { EventVenue } from "./schema";

/** Official highlights from YouTube, for the competitions covered by scripts/fetch-highlights.mjs. */
export const highlightOf = (c: Competition, m: Match) => highlightFor(c.slug, m.id);

/** `venueOf(teamId)`: the home team's stadium, when the team data has it (see entry-server.tsx). */
export function footballRoutes(venueOf: (teamId: number) => EventVenue | null = () => null): RouteMeta[] {
  return [
    ...competitions.map(competitionMeta),
    ...competitions.filter((c) => c.standings.length > 0).map(standingsMeta),
    ...allMatches.map(({ competition, match }) => matchMeta(competition, match, !!predictionFor(match.id), highlightOf(competition, match), venueOf(match.homeTeam.id))),
    ...competitions.flatMap((c) => eventRoutes(c, venueOf)),
  ];
}

/** One evergreen page per fixture (home team, away team) with a meeting in the data. */
function eventRoutes(c: Competition, venueOf: (teamId: number) => EventVenue | null): RouteMeta[] {
  const slugs = [...new Set(c.matches.filter((m) => m.status !== "CANCELLED").map(pairSlug))];
  return slugs.flatMap((slug) => {
    const list = pairMatches(c, slug);
    const shown = nextOfPair(list) ?? list[list.length - 1];
    const meta = shown && eventMeta(c, slug, (id) => !!predictionFor(id), venueOf(shown.homeTeam.id));
    return meta ? [meta] : [];
  });
}

/** Bridge pages of the URLs moved to /pronostici (src/lib/legacyUrls.ts): old hub of every competition. */
export function legacyFootballRoutes(): RouteMeta[] {
  return competitions.map((c) => ({
    path: `/calcio/${c.slug}`,
    redirect: competitionPath(c),
    title: `Pronostici ${c.name}`,
    description: `Pagina spostata: i pronostici di ${c.name} sono ora su ${competitionPath(c)}.`,
    index: false,
  }));
}
