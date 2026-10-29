// Matchday pages over the whole snapshot (route list for the pre-render, links from the hub pages).
// Page components use ./matchdaysCore with the data of one competition.
import { competitions } from "./football";
import { predictionFor } from "./predictions";
import { matchdayMeta, matchdaysOf } from "./matchdaysCore";
import { matchdayPath } from "./footballCore";
import type { RouteMeta } from "../routes";

export * from "./matchdaysCore";

export function matchdayRoutes(): RouteMeta[] {
  return competitions.flatMap((c) => matchdaysOf(c).map((d) => matchdayMeta(c, d, (id) => !!predictionFor(id))));
}

/** Bridge pages of the old round URLs /calcio/<lega>/giornata/<n> (src/lib/legacyUrls.ts). */
export function legacyMatchdayRoutes(): RouteMeta[] {
  return competitions.flatMap((c) =>
    matchdaysOf(c).map((d) => ({
      path: `/calcio/${c.slug}/giornata/${d.n}`,
      redirect: matchdayPath(c, d),
      title: `${c.name}, ${d.n}ª giornata`,
      description: `Pagina spostata su ${matchdayPath(c, d)}.`,
      index: false,
    })),
  );
}
