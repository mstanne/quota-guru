// Pages offered to search engines (index + sitemap + IndexNow), decided by URL in scripts/prerender.mjs.
//
// Search Console, 16 November 2026: on 8 November Google crawled ~6,600 pages in one day (the day thousands of
// national-team pages went online), then nearly stopped crawling, and every query of the site fell from positions
// 10-25 to 50-75. Of ~8,700 known URLs only ~2,200 were indexed: ~4,100 "scansionata, ma attualmente non indicizzata"
// and ~2,200 "rilevata, ma attualmente non indicizzata". No manual action, no host problem: Google judged a three-week-
// old domain with thousands of generated pages as low value, and the useful pages went down with the rest.
// So the index is limited to the pages with the most value for an Italian reader:
//   - competitions: Serie A, Serie B, Coppa Italia, Supercoppa, the four big foreign leagues and the three European
//     cups (hub, standings, statistics, match pages); NBA; national teams only for Italy's matches and the hubs of
//     the competitions Italy plays;
//   - match pages: the evergreen /pronostici page while the meeting is upcoming (a resting pair, which only shows the
//     last result, goes out) and the dated page of a finished match for MATCH_DAYS days (result searches);
//   - club pages of the domestic leagues above; players by their own rule (scripts/derive-players.mjs,
//     scripts/derive-nba-players.mjs).
// Everything else stays on the site (links, visitors) with "noindex" and out of the sitemap, and can be reopened by
// editing these lists once the domain's impressions recover.
import { COMPETITIONS } from "./leagues.mjs";

/** Competitions whose pages stay in the index. */
export const MAIN_COMPETITIONS = new Set([
  "serie-a",
  "serie-b",
  "coppa-italia",
  "supercoppa-italiana",
  "premier-league",
  "liga",
  "bundesliga",
  "ligue-1",
  "champions-league",
  "europa-league",
  "conference-league",
]);
/** Domestic leagues whose club pages stay in the index. */
const TEAM_LEAGUES = new Set(["serie-a", "serie-b", "premier-league", "liga", "bundesliga", "ligue-1"]);
const COMPETITION_SLUGS = new Set(COMPETITIONS.map((c) => c.slug));
const NATIONAL = new Set(COMPETITIONS.filter((c) => c.national).map((c) => c.slug));
/** National-team competitions whose hub and standings stay (Italy plays them); their matches only with Italy. */
const NATIONAL_HUBS = new Set(["mondiali", "europei", "nations-league", "qualificazioni-mondiali-europa", "qualificazioni-europei"]);
/** Matches of Italy (senior team, slug "italia") in a pair or dated match slug. */
const ITALY = /(^|-)italia(-|$)/;
/** Past seasons ("albo d'oro") kept in the index. */
const SEASON_ARCHIVES = new Set(["serie-a", "champions-league"]);
/** National-team pages kept. */
const NATIONAL_TEAMS_KEPT = new Set(["italia"]);
/** Days a finished match's dated page stays in the index after the match. */
export const MATCH_DAYS = 7;

const DATED_MATCH = /-(\d{4}-\d{2}-\d{2})$/;
const DAY = 86400e3;

/** True when the dated slug's day is more than MATCH_DAYS before `today` (YYYY-MM-DD). */
function old(page, today) {
  const m = DATED_MATCH.exec(page);
  return !!m && Date.parse(today) - Date.parse(m[1]) > MATCH_DAYS * DAY;
}

/**
 * Why the page at `pathname` is kept out of the index, or null if it may be indexed.
 * `teamCompetition(slug)`: the competition of a football club page ("nazionali" for national teams), from
 * src/data/teams/index.json; undefined for unknown teams (left as they are).
 * `today`: day of the build (YYYY-MM-DD). `resting`: an evergreen match page with no meeting to come (it shows the
 * last result: live meta with `archive`, or restored from the archive).
 */
export function outOfIndex(pathname, { teamCompetition = () => undefined, today = new Date().toISOString().slice(0, 10), resting = false } = {}) {
  const seg = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const [section, slug, page] = seg;

  if (section === "pronostici" && seg.length >= 2) {
    if (slug === "nba") return seg.length === 3 && resting ? "sfida senza partita in programma" : null;
    if (!COMPETITION_SLUGS.has(slug)) return null; // oggi, domani, tris, nazionali, market pages
    if (NATIONAL.has(slug)) {
      if (seg.length === 2) return NATIONAL_HUBS.has(slug) ? null : "competizione di nazionali";
      if (!ITALY.test(page)) return "partita di nazionali";
    } else if (!MAIN_COMPETITIONS.has(slug)) return "competizione secondaria";
    return seg.length === 3 && resting ? "sfida senza partita in programma" : null;
  }

  if (section === "calcio" && slug === "squadre" && page) {
    const comp = teamCompetition(page);
    if (comp === "nazionali") return NATIONAL_TEAMS_KEPT.has(page) ? null : "nazionale";
    if (comp && !TEAM_LEAGUES.has(comp)) return "squadra di un campionato secondario";
    return null;
  }

  if (section === "calcio" && COMPETITION_SLUGS.has(slug)) {
    if (NATIONAL.has(slug)) {
      const match = seg.length === 3 && DATED_MATCH.test(page);
      if (match) return ITALY.test(page) && !old(page, today) ? null : "partita di nazionali";
      if (!NATIONAL_HUBS.has(slug)) return "competizione di nazionali";
    } else if (!MAIN_COMPETITIONS.has(slug)) return "competizione secondaria";
    if (page === "stagioni") return SEASON_ARCHIVES.has(slug) ? null : "stagioni passate";
    if (seg.length === 3 && old(page, today)) return "partita di più di una settimana fa";
    return null;
  }

  if (section === "basket" && slug === "nba" && seg.length === 3 && old(page, today)) return "partita di più di una settimana fa";

  return null;
}
