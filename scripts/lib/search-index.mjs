// Pages offered to search engines (index + sitemap + IndexNow), decided by URL in scripts/prerender.mjs.
//
// Search Console (November 2026): of ~8,800 URLs in the sitemap Google had left ~5,700 out of the index ("scansionata/
// rilevata, ma attualmente non indicizzata"), and the pages below had no impressions at all in the last 28 days.
// Too many thin pages make Google crawl and trust the useful ones less, so these stay on the site (links, visitors)
// with "noindex" and out of the sitemap. Pages with a data-based rule are in their own scripts: football players
// (scripts/derive-players.mjs) and NBA players (scripts/derive-nba-players.mjs).
import { COMPETITIONS, NATIONAL_CUPS } from "./leagues.mjs";

/** Foreign national cups and super cups (the Italian ones stay). */
const FOREIGN_CUPS = new Set(NATIONAL_CUPS.filter((c) => c.country !== "Italy").map((c) => c.slug));
/** National-team competitions whose matches stay in the index (plus every match of Italy, see ITALY). */
const NATIONAL_KEPT = new Set(["nations-league"]);
const NATIONAL_OUT = new Set(COMPETITIONS.filter((c) => c.national && !NATIONAL_KEPT.has(c.slug)).map((c) => c.slug));
/** Matches of Italy (senior team, slug "italia") in a pair or dated match slug. */
const ITALY = /(^|-)italia(-|$)/;
/** Followed leagues outside the main ones: one page per match, the evergreen /pronostici page (the dated one goes). */
const ONE_PAGE_PER_MATCH = new Set(["championship", "eredivisie", "primeira-liga", "brasileirao"]);
/** Past seasons ("albo d'oro") kept in the index. */
const SEASON_ARCHIVES = new Set(["serie-a", "premier-league", "liga", "bundesliga", "ligue-1", "champions-league"]);
/** Club pages kept: clubs of the leagues with predictions (not the lower divisions shown only for information). */
const TEAM_LEAGUES = new Set(COMPETITIONS.filter((c) => !c.info && !c.cup && !c.national).map((c) => c.slug));
/** National-team pages kept. */
const NATIONAL_TEAMS_KEPT = new Set(["italia"]);

const DATED_MATCH = /-\d{4}-\d{2}-\d{2}$/;

/**
 * Why the page at `pathname` is kept out of the index, or null if it may be indexed.
 * `teamCompetition(slug)`: the competition of a football club page ("nazionali" for national teams), from
 * src/data/teams/index.json; undefined for unknown teams (left as they are).
 */
export function outOfIndex(pathname, { teamCompetition = () => undefined } = {}) {
  const seg = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const [section, slug, page] = seg;

  if (section === "pronostici" && seg.length === 3) {
    if (FOREIGN_CUPS.has(slug)) return "coppa nazionale estera";
    if (NATIONAL_OUT.has(slug) && !ITALY.test(page)) return "partita di nazionali";
  }

  if (section === "calcio" && slug === "squadre" && page) {
    const comp = teamCompetition(page);
    if (comp === "nazionali") return NATIONAL_TEAMS_KEPT.has(page) ? null : "nazionale";
    if (comp && !TEAM_LEAGUES.has(comp)) return "squadra di un campionato minore";
    return null;
  }

  if (section === "calcio" && seg.length >= 3) {
    if (page === "stagioni") return SEASON_ARCHIVES.has(slug) ? null : "stagioni passate";
    if (seg.length === 3 && DATED_MATCH.test(page)) {
      if (FOREIGN_CUPS.has(slug)) return "coppa nazionale estera";
      if (NATIONAL_OUT.has(slug) && !ITALY.test(page)) return "partita di nazionali";
      if (ONE_PAGE_PER_MATCH.has(slug)) return "partita con pagina pronostico";
    }
  }
  return null;
}
