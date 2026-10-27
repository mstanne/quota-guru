// Track record of the prediction models. Two sources:
//   "archivio"  – the predictions the site actually published before each match, archived at every build
//                 (scripts/archive-predictions.mjs → src/data/track-record.json). Used as soon as it holds
//                 MIN_ARCHIVED graded matches.
//   "ricalcolo" – until then, every finished match of the snapshot re-predicted with the data available before
//                 kick-off (scripts/predict-*.mjs), excluding football matches the model flags as low reliability.
// Hits and misses count alike in both. The data joins live in trackRecordFootball.ts / trackRecordNba.ts so each
// page loads only its own sport's snapshot.
import { referenceTime } from "./footballCore";
import archive from "../data/track-record.json";

/** Graded archived predictions needed before the archive replaces the recalculation. */
export const MIN_ARCHIVED = 10;

export interface TrackEntry {
  key: string;
  path: string;
  label: string;
  /** Competition or league. */
  where: string;
  utcDate: string;
  /** What the model indicated as most likely, e.g. "1 · Inter" (with its probability). */
  pick: string;
  prob: number;
  result: string;
  hit: boolean;
  /** When the prediction was published (archive only). */
  published?: string;
}
export interface TrackRecord {
  source: "archivio" | "ricalcolo";
  /** First archived publication (archive only). */
  since?: string | null;
  all: { n: number; hits: number };
  last30: { n: number; hits: number };
  /** Most recent first. */
  recent: TrackEntry[];
}

export function summarize(entries: TrackEntry[]): TrackRecord {
  const sorted = [...entries].sort((a, b) => b.utcDate.localeCompare(a.utcDate));
  const from = new Date(referenceTime - 30 * 86400000).toISOString();
  const count = (list: TrackEntry[]) => ({ n: list.length, hits: list.filter((e) => e.hit).length });
  return {
    source: "ricalcolo",
    all: count(sorted),
    last30: count(sorted.filter((e) => e.utcDate >= from)),
    recent: sorted.slice(0, 10),
  };
}

type ArchiveSummary = Omit<TrackRecord, "source">;
const archived = archive as unknown as Record<"calcio" | "nba", ArchiveSummary>;

/** The archive of published predictions, or null while it is too short. */
export function archivedTrackRecord(sport: "calcio" | "nba"): TrackRecord | null {
  const a = archived[sport];
  return a && a.all.n >= MIN_ARCHIVED ? { ...a, source: "archivio" } : null;
}

