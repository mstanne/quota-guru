// Matchday pages over the whole snapshot (route list for the pre-render, links from the hub pages).
// Page components use ./matchdaysCore with the data of one competition.
import { competitions } from "./football";
import { predictionFor } from "./predictions";
import { matchdayMeta, matchdaysOf } from "./matchdaysCore";
import type { RouteMeta } from "../routes";

export * from "./matchdaysCore";

export function matchdayRoutes(): RouteMeta[] {
  return competitions.flatMap((c) => matchdaysOf(c).map((d) => matchdayMeta(c, d, (id) => !!predictionFor(id))));
}
