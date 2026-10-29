// URLs moved by the URL schema of October 2026 (README, "Schema degli URL"). GitHub Pages cannot answer with a
// 301, so every old URL is published as a bridge page: canonical to the new URL plus an immediate redirect
// (scripts/prerender.mjs), and the router sends visitors on with <Navigate replace> (App.tsx).
//
//   /calcio/<lega>                      → /pronostici/<lega>
//   /calcio/<lega>/giornata/<n>         → /pronostici/<lega>/giornata-<n>  (fase-campionato-giornata-<n> for cups)
//   /basket/nba                         → /pronostici/nba
// The dated match pages (/calcio/<lega>/<casa>-<trasferta>-<data>, /basket/nba/<...>-<data>) do not move:
// they are the permanent archive of each published prediction.
import { findCompetitionInfo } from "./footballData";
import { competitionPath, matchdayPath } from "./footballCore";
import { NBA_HUB } from "./nbaPaths";

const clean = (p: string) => (p !== "/" ? p.replace(/\/+$/, "") : p);

/** New path of a moved URL, null when the URL did not move. */
export function legacyTarget(pathname: string): string | null {
  const p = clean(pathname);
  if (p === "/basket/nba") return NBA_HUB;
  const hub = p.match(/^\/calcio\/([^/]+)$/);
  if (hub) {
    const c = findCompetitionInfo(hub[1]);
    return c ? competitionPath(c) : null;
  }
  const round = p.match(/^\/calcio\/([^/]+)\/giornata\/(\d{1,3})$/);
  if (round) {
    const c = findCompetitionInfo(round[1]);
    return c ? matchdayPath(c, { n: Number(round[2]), stage: c.leaguePhase ? "LEAGUE_STAGE" : null }) : null;
  }
  return null;
}

/** Internal links in stored HTML (archived pages saved before the move) rewritten to the new URLs. */
export function rewriteLegacyLinks(html: string): string {
  return html.replace(/href="(\/(?:calcio|basket)\/[^"?#]*)([?#][^"]*)?"/g, (all, path: string, rest = "") => {
    const slash = path.endsWith("/");
    const target = legacyTarget(path);
    return target ? `href="${target}${slash ? "/" : ""}${rest}"` : all;
  });
}
