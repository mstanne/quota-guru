// Server entry used only at build time by scripts/prerender.mjs to generate static HTML for each URL.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";

import { routes as staticRoutes } from "./routes";
import { footballRoutes, legacyFootballRoutes } from "./lib/footballRoutes";
import { legacyMatchdayRoutes, matchdayRoutes } from "./lib/matchdays";
import { NBA_HUB } from "./lib/nbaPaths";
import { goalStatsMeta, type Competition } from "./lib/footballCore";
import { leagueGoalStats, type GoalResult } from "./lib/goalStats.mjs";
import { loadAllCompetitionData } from "./lib/footballData";
import { dayRoutes } from "./lib/dayPages";
import { basketRoutes, nbaGames } from "./lib/basket";
import { nbaDetailsFor } from "./lib/basketDetails";
import type { EventVenue } from "./lib/schema";
import { archivedBasketPredictionFor, basketPredictionFor } from "./lib/basketPredict";
import { highlightFor } from "./lib/highlights";
import { loadAllTeamData, type FootballTeam, type NbaTeam } from "./lib/teams";
import { loadAllResults, resultsRoutes } from "./lib/results";
import { footballTeamMeta, nbaTeamMeta } from "./lib/teamMeta";
import nbaTeamsData from "./data/teams/nba.json";

// team pages (server only: every league file is bundled here)
const footballTeamFiles = import.meta.glob<{ default: Record<string, FootballTeam> }>("./data/teams/football-*.json", {
  eager: true,
});
const teamRoutes = () => [
  ...Object.values(footballTeamFiles).flatMap((f) => Object.values(f.default).map(footballTeamMeta)),
  ...Object.values(nbaTeamsData as unknown as Record<string, NbaTeam>).map(nbaTeamMeta),
];
import { guideRoutes } from "./data/guides";
import { offerRoutes } from "./lib/offerPages";
import { tennisRoutes } from "./lib/tennis";
import { preloadAllPages } from "./lib/lazyPage";
import { setArchivedHtml } from "./lib/archive";

export { notFoundMeta, fullTitle } from "./routes";
export { site } from "./data/site";
/** Page chunks and the data loaded on demand (team pages) must all be ready before rendering synchronously. */
const preloadAll = () => Promise.all([preloadAllPages(), loadAllTeamData(), loadAllResults(), loadAllCompetitionData()]);
export { preloadAll as preloadAllPages };
/** Every URL to pre-render: static pages + one page per competition, standings table and match. */
// venues for the events' structured data: football from the team pages' data, NBA arenas from the box scores
const footballVenues = new Map<number, EventVenue>();
for (const f of Object.values(footballTeamFiles))
  for (const t of Object.values(f.default))
    if (t.venue?.name) footballVenues.set(t.id, { name: t.venue.name, city: t.venue.city, country: t.area });
const nbaVenues = new Map<number, EventVenue>();
for (const g of nbaGames) {
  const d = nbaDetailsFor(g.id);
  if (d?.arena) nbaVenues.set(g.home.id, { name: d.arena, city: d.city, country: g.home.abbr === "TOR" ? "CA" : "US" });
}
/** Moved URLs (bridge pages, see src/lib/legacyUrls.ts). */
const legacyRoutes = [
  ...legacyFootballRoutes(),
  ...legacyMatchdayRoutes(),
  { path: "/basket/nba", redirect: NBA_HUB, title: "Pronostici NBA", description: `Pagina spostata su ${NBA_HUB}.`, index: false },
];
export { legacyTarget, rewriteLegacyLinks } from "./lib/legacyUrls";
// Under/Over statistics pages: one per competition with a table and results (description from the season figures)
const competitionFiles = import.meta.glob<{ default: { competition: Competition; season?: { results: GoalResult[] } } }>(
  "./data/football/comp-*.json",
  { eager: true },
);
const goalStatsRoutes = () =>
  Object.values(competitionFiles).flatMap(({ default: f }) => {
    const league = leagueGoalStats(f.season?.results ?? []);
    return f.competition.standings.length && league.n ? [goalStatsMeta(f.competition, league)] : [];
  });
export const routes = [...legacyRoutes, ...goalStatsRoutes(), ...staticRoutes, ...footballRoutes((id) => footballVenues.get(id) ?? null), ...matchdayRoutes(), ...dayRoutes(), ...basketRoutes(
  (id) => !!basketPredictionFor(id),
  (id) => highlightFor("nba", id),
  (g) => nbaVenues.get(g.home.id) ?? null,
  // the prediction the page shows: as published before tip-off once the game has started
  // (same rule as BasketGamePage: a final game shows only a prediction made before tip-off)
  (g) => {
    const archived = g.status !== "scheduled" ? archivedBasketPredictionFor(g.id)?.prediction : undefined;
    const p = archived ?? basketPredictionFor(g.id);
    return g.status === "final" && !archived && !basketPredictionFor(g.id)?.pre ? undefined : p;
  },
), ...tennisRoutes(), ...guideRoutes(), ...offerRoutes(), ...teamRoutes(), ...resultsRoutes()];

/** `archivedHtml`: stored HTML of a finished match no longer in the data (see src/lib/archive.tsx). */
export function render(url: string, basename: string, archivedHtml: string | null = null) {
  setArchivedHtml(url.slice(basename.length) || "/", archivedHtml);
  try {
    return renderToString(
      <StrictMode>
        <StaticRouter location={url} basename={basename}>
          <App />
        </StaticRouter>
      </StrictMode>,
    );
  } finally {
    setArchivedHtml(null);
  }
}
