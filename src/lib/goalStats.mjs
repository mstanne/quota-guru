// Under/Over and Goal/No goal statistics of teams, from final scores only (no external data). Plain JavaScript
// shared by the site (src/lib/goalStats.d.mts for the types) and the build scripts (scripts/derive-teams.mjs).
//
// A result is { date: ISO string, home: team id, away: team id, hg: goals, ag: goals }.
// Percentages are not rounded here; every count is kept so pages can always show "x su n".

/** Over/Under lines shown on the site. */
export const LINES = [1.5, 2.5, 3.5];

const empty = () => ({ n: 0, gf: 0, ga: 0, over: [0, 0, 0], btts: 0, clean: 0, blank: 0 });

function add(s, gf, ga) {
  s.n++;
  s.gf += gf;
  s.ga += ga;
  LINES.forEach((l, i) => {
    if (gf + ga > l) s.over[i]++;
  });
  if (gf > 0 && ga > 0) s.btts++;
  if (ga === 0) s.clean++;
  if (gf === 0) s.blank++;
}

/**
 * Statistics of one team over `results` (any competition mix the caller chose), split by venue, plus the last
 * `recent` matches. Results without a score are ignored.
 */
export function teamGoalStats(results, teamId, recent = 5) {
  const all = empty();
  const home = empty();
  const away = empty();
  const last = empty();
  const played = results
    .filter((r) => r.hg != null && r.ag != null && (r.home === teamId || r.away === teamId))
    .sort((a, b) => a.date.localeCompare(b.date));
  played.forEach((r, i) => {
    const atHome = r.home === teamId;
    const gf = atHome ? r.hg : r.ag;
    const ga = atHome ? r.ag : r.hg;
    add(all, gf, ga);
    add(atHome ? home : away, gf, ga);
    if (i >= played.length - recent) add(last, gf, ga);
  });
  return { all, home, away, last };
}

/** Statistics of a whole league over `results` (one value per match). */
export function leagueGoalStats(results) {
  const s = empty();
  for (const r of results) if (r.hg != null && r.ag != null) add(s, r.hg, r.ag);
  return s;
}
