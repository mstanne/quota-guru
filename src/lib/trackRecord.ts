// Track record of the prediction models, built from the data snapshot at render time.
// Every finished match with a "pre-match" prediction counts (made with the data available before kick-off,
// see scripts/predict-football.mjs and scripts/predict-basket.mjs): hits and misses alike, nothing is filtered
// out except football matches where the model itself flagged low reliability (the same rule as the published
// track record on the Metodologia page).
// Types and maths only: the data joins live in trackRecordFootball.ts / trackRecordNba.ts so each page loads
// only its own sport's snapshot.
import { referenceTime } from "./footballCore";

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
}
export interface TrackRecord {
  all: { n: number; hits: number };
  last30: { n: number; hits: number };
  /** Most recent first. */
  recent: TrackEntry[];
}

export function summarize(entries: TrackEntry[]): TrackRecord {
  const sorted = [...entries].sort((a, b) => b.utcDate.localeCompare(a.utcDate));
  const from = new Date(referenceTime - 30 * 86400000).toISOString();
  const count = (list: TrackEntry[]) => ({ n: list.length, hits: list.filter((e) => e.hit).length });
  return { all: count(sorted), last30: count(sorted.filter((e) => e.utcDate >= from)), recent: sorted.slice(0, 10) };
}

