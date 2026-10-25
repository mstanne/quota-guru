// Server entry used only at build time by scripts/prerender.mjs to generate static HTML for each URL.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";

import { routes as staticRoutes } from "./routes";
import { footballRoutes } from "./lib/footballRoutes";
import { basketRoutes } from "./lib/basket";
import { guideRoutes } from "./data/guides";
import { tennisRoutes } from "./lib/tennis";
import { preloadAllPages } from "./lib/lazyPage";
import { setArchivedHtml } from "./lib/archive";

export { notFoundMeta, fullTitle } from "./routes";
export { site } from "./data/site";
export { preloadAllPages };
/** Every URL to pre-render: static pages + one page per competition, standings table and match. */
export const routes = [...staticRoutes, ...footballRoutes(), ...basketRoutes(), ...tennisRoutes(), ...guideRoutes()];

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
