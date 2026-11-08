// Football track record (see ./trackRecord.ts): the archive of published predictions when it is long enough,
// otherwise the recalculation computed at build time by scripts/split-football-data.mjs (no data download).
import { recalculatedFootballTrack, recalculatedNationalTrack } from "./footballData";
import { archivedTrackRecord, type TrackRecord } from "./trackRecord";

let football: TrackRecord | null = null;
export function footballTrackRecord(): TrackRecord {
  return (football ??= archivedTrackRecord("calcio") ?? { source: "ricalcolo", ...recalculatedFootballTrack });
}

let national: TrackRecord | null = null;
/** National teams: own model, own track record (same sources). */
export function nationalTrackRecord(): TrackRecord {
  return (national ??= archivedTrackRecord("nazionali") ?? { source: "ricalcolo", ...recalculatedNationalTrack });
}
