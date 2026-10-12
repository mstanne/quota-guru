// Server entry used only at build time by scripts/prerender.mjs to generate static HTML for each URL.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";

export { routes, notFoundMeta, findRoute, fullTitle } from "./routes";

export function render(url: string, basename: string) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url} basename={basename}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
}
