// Kinds of football competitions for the site's pages, from the shared list in scripts/lib/leagues.mjs:
//   info leagues   lower divisions shown only for information (standings, clubs, matches), without predictions: their
//                  hub is /calcio/<slug> instead of /pronostici/<slug>, and their match pages are not indexed
//   national cups  national cups and super cups: knockout rounds, predictions with the chance of going through
export {
  COMPETITIONS,
  INFO_LEAGUES,
  NATIONAL_CUPS,
  isCalendarSeason,
  isInfoLeague,
  isNationalCup,
} from "../../scripts/lib/leagues.mjs";
import { COMPETITIONS } from "../../scripts/lib/leagues.mjs";

const BY_SLUG = new Map(COMPETITIONS.map((c) => [c.slug, c]));
/** Definition of a competition by its slug (scripts/lib/leagues.mjs). */
export const competitionDef = (slug: string) => BY_SLUG.get(slug);
/** Kind fields of a competition from its definition, for data written before they were in the snapshot. */
export function withKind<T extends { slug: string; cup?: "national" | "super"; info?: boolean }>(c: T): T {
  const d = BY_SLUG.get(c.slug);
  if (!d || (!d.cup && !d.info)) return c;
  return { ...c, ...(d.cup ? { cup: d.supercup ? "super" : "national" } : {}), ...(d.info ? { info: true } : {}) };
}
export const isSuperCup = (slug: string) => !!BY_SLUG.get(slug)?.supercup;
