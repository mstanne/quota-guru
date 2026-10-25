// When a match should be over, by sport. Shared by the site (src/lib/*.ts) and the build scripts.
//
// The data sources are not live and sometimes stop updating a match (it stays "scheduled" or "in play"
// for days). The site must not trust the status alone: once a match is past its expected end plus a
// margin for the source's delay, it is treated as "result pending" instead of upcoming/live.

/** Average duration from kick-off/tip-off to the final whistle, in minutes. */
export const EXPECTED_MINUTES = {
  // 90' + 15' half-time + stoppage time
  football: 115,
  // NBA: 48' of play, timeouts, half-time; about 2h15–2h30
  basket: 150,
};

/** Extra time allowed for the data source to publish the final status. */
export const DATA_DELAY_MINUTES = 60;

/** Time (ms) after which a match that is not marked as finished is considered overdue. */
export function overdueAfter(utcDate, sport) {
  return Date.parse(utcDate) + (EXPECTED_MINUTES[sport] + DATA_DELAY_MINUTES) * 60000;
}

/** True if, at time `refMs`, the match should already be over. */
export function isOverdue(utcDate, sport, refMs) {
  const start = Date.parse(utcDate);
  return Number.isFinite(start) && refMs > overdueAfter(utcDate, sport);
}

/** Build time shared by the scripts and Vite (see vite.config.ts), so the pre-rendered pages and the
 *  browser bundle use the same reference: written by scripts/stamp-build-time.mjs at the start of a build. */
export const BUILD_TIME_FILE = ".cache/build-time.txt";
export const BUILD_TIME_MAX_AGE_MS = 60 * 60000;
