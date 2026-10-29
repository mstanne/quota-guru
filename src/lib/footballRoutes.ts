// Metadata of the football pages generated from the football-data.org snapshot
// (one per competition, one per standings table, one per match). Kept out of src/routes.ts
// so that the football data is not part of the initial JavaScript bundle.
import { allMatches, competitionMeta, competitions, matchMeta, standingsMeta } from "./football";
import type { RouteMeta } from "../routes";
import { archivedPredictionFor, predictionFor } from "./predictions";
import { highlightFor } from "./highlights";
import { eventMeta, footballCard, isFinished, isUpcoming, pairMatches, pairSlug, nextOfPair, competitionPath, type Competition, type Match } from "./footballCore";
import type { EventVenue } from "./schema";

/** Official highlights from YouTube, for the competitions covered by scripts/fetch-highlights.mjs. */
export const highlightOf = (c: Competition, m: Match) => highlightFor(c.slug, m.id);

/** `venueOf(teamId)`: the home team's stadium, when the team data has it (see entry-server.tsx). */
export function footballRoutes(venueOf: (teamId: number) => EventVenue | null = () => null): RouteMeta[] {
  return [
    ...competitions.map(competitionMeta),
    ...competitions.filter((c) => c.standings.length > 0).map(standingsMeta),
    ...allMatches.map(({ competition, match }) => {
      const meta: RouteMeta = matchMeta(competition, match, !!predictionFor(match.id), highlightOf(competition, match), venueOf(match.homeTeam.id));
      const card = meta.article ? footballCard(competition, match, shownPrediction(match)) : null;
      return card ? { ...meta, card } : meta;
    }),
    ...competitions.flatMap((c) => eventRoutes(c, venueOf)),
  ];
}

/** The prediction a match page shows: as published before kick-off once the match has started. */
/** Same rule as the match page (CalcioMatchPage): the archived copy once the match has started, else the current one;
 *  a finished match shows a prediction only if it was made before kick-off. */
function shownPrediction(m: Match) {
  const archived = isUpcoming(m) ? undefined : archivedPredictionFor(m.id);
  if (archived) return { ...archived.prediction, pre: true };
  const p = predictionFor(m.id);
  return isFinished(m) && !p?.pre ? undefined : p;
}

/** One evergreen page per fixture (home team, away team) with a meeting in the data. */
function eventRoutes(c: Competition, venueOf: (teamId: number) => EventVenue | null): RouteMeta[] {
  const slugs = [...new Set(c.matches.filter((m) => m.status !== "CANCELLED").map(pairSlug))];
  return slugs.flatMap((slug) => {
    const list = pairMatches(c, slug);
    const shown = nextOfPair(list) ?? list[list.length - 1];
    const meta: RouteMeta | null = shown && eventMeta(c, slug, (id) => !!predictionFor(id), venueOf(shown.homeTeam.id));
    if (!meta) return [];
    const card = nextOfPair(list) ? footballCard(c, shown, shownPrediction(shown)) : null;
    return [card ? { ...meta, card } : meta];
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
