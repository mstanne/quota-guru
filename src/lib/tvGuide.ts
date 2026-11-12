// /calcio-in-tv-oggi: where to watch in Italy the football matches of today and tomorrow. One URL that is rewritten
// with every data update (every 3 hours), the way people search for it ("partite in tv oggi"); the channels of each
// match stay on its own dated page, which is the archive. Channels: src/lib/tvSchedule.ts.
import { allMatches, isFinished, romeDay, type Competition, type Match } from "./football";
import { dayOf, type DayKey } from "./dayPages";
import { matchBroadcast } from "./tvSchedule";
import type { Broadcast } from "./broadcast";
import type { RouteMeta } from "../routes";

export const TV_GUIDE_PATH = "/calcio-in-tv-oggi";

export interface TvRow {
  competition: Competition;
  match: Match;
  broadcast: Broadcast | null;
}

/** "DAZN e Prime Video (LaB Channel)" -> ["DAZN", "Prime Video"]: the channels a reader filters by. */
export function channelTokens(b: Broadcast | null) {
  if (!b) return [];
  const names = b.channels
    .split(/,| e /)
    .map((s) => s.replace(/\(.*?\)/g, "").trim())
    .filter(Boolean);
  // NOW is Sky's streaming service: one filter for both
  return names.includes("Sky") ? names.filter((n) => n !== "NOW") : names;
}

export function tvDay(d: DayKey) {
  const { iso, label } = dayOf(d);
  const rows: TvRow[] = allMatches
    .filter(
      ({ competition, match }) =>
        // lower divisions shown only for information stay out of the TV guide
        !competition.info && romeDay(match.utcDate) === iso && match.status !== "POSTPONED" && match.status !== "CANCELLED",
    )
    .map(({ competition, match }) => ({ competition, match, broadcast: matchBroadcast(competition, match) }));
  return {
    iso,
    label,
    rows,
    onTv: rows.filter((r) => r.broadcast),
    elsewhere: rows.filter((r) => !r.broadcast),
    open: rows.filter((r) => r.broadcast && !isFinished(r.match)),
  };
}

/** Matches per channel, most first: [["DAZN", 9], ["Sky", 5], ...]. */
export function channelCounts(rows: TvRow[]) {
  const n = new Map<string, number>();
  for (const r of rows) for (const t of channelTokens(r.broadcast)) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function tvGuideMeta(): RouteMeta {
  const today = tvDay("oggi");
  const counts = channelCounts(today.onTv)
    .slice(0, 3)
    .map(([c]) => c);
  return {
    path: TV_GUIDE_PATH,
    title: `Calcio in TV oggi, ${today.label}: partite e canali`,
    description: today.onTv.length
      ? `Le ${today.onTv.length} partite di calcio in TV oggi, ${today.label}${counts.length ? `, su ${counts.join(", ")}` : ""}: orari, canali e pronostici, più le partite di domani.`
      : `Dove vedere in TV e in streaming le partite di calcio di oggi e domani: orari, canali e pronostici.`,
  };
}
