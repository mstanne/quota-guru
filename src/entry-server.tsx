// Server entry used only at build time by scripts/prerender.mjs to generate static HTML for each URL.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";

import { routes as staticRoutes } from "./routes";
import { footballRoutes } from "./lib/footballRoutes";
import { matchdayRoutes } from "./lib/matchdays";
import { loadAllCompetitionData } from "./lib/footballData";
import { dayRoutes } from "./lib/dayPages";
import { basketRoutes } from "./lib/basket";
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
export const routes = [...staticRoutes, ...footballRoutes(), ...matchdayRoutes(), ...dayRoutes(), ...basketRoutes((id) => !!basketPredictionFor(id), (id) => highlightFor("nba", id)), ...tennisRoutes(), ...guideRoutes(), ...teamRoutes(), ...resultsRoutes()];

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
