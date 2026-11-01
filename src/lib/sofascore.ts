// SofaScore event ids of the football matches (src/data/sofascore.json, written at build time by
// scripts/derive-sofascore.mjs from the list downloaded on the editorial computer).
import raw from "../data/sofascore.json";

const data = raw as unknown as Record<string, number | undefined>;

export const sofascoreEventFor = (matchId: number): number | undefined => data[String(matchId)];

/** The widgets are offered from shortly before kick-off (line-ups are published about an hour before)
 *  until a few hours after it: the rest of the time the page shows the site's own data. */
export const LIVE_WINDOW = { beforeMs: 75 * 60e3, afterMs: 4 * 3600e3 };

export function inLiveWindow(utcDate: string, now = Date.now()): boolean {
  const t = Date.parse(utcDate);
  return now >= t - LIVE_WINDOW.beforeMs && now <= t + LIVE_WINDOW.afterMs;
}
