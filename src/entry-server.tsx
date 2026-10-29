// Server entry used only at build time by scripts/prerender.mjs to generate static HTML for each URL.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";

import { routes as staticRoutes } from "./routes";
import { footballRoutes, legacyFootballRoutes } from "./lib/footballRoutes";
import { legacyMatchdayRoutes, matchdayRoutes } from "./lib/matchdays";
import { NBA_HUB } from "./lib/nbaPaths";
import { loadAllCompetitionData } from "./lib/footballData";
import { dayRoutes } from "./lib/dayPages";
import { basketRoutes, nbaGames } from "./lib/basket";
import { nbaDetailsFor } from "./lib/basketDetails";
import type { EventVenue } from "./lib/schema";
import { basketPredictionFor } from "./lib/basketPredict";
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
export const routes = [...legacyRoutes, ...staticRoutes, ...footballRoutes((id) => footballVenues.get(id) ?? null), ...matchdayRoutes(), ...dayRoutes(), ...basketRoutes((id) => !!basketPredictionFor(id), (id) => highlightFor("nba", id), (g) => nbaVenues.get(g.home.id) ?? null), ...tennisRoutes(), ...guideRoutes(), ...teamRoutes(), ...resultsRoutes()];

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
