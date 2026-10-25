// Official YouTube highlights of finished matches (src/data/highlights.json, written by scripts/fetch-highlights.mjs).
import raw from "../data/highlights.json";

export interface Highlight {
  /** YouTube video id. */
  video: string;
  title: string;
  /** ISO date the video was published. */
  published: string;
  /** Official channel that published it. */
  channel?: string;
}

/** Keyed by football competition slug ("serie-a", "liga", …) or "nba", then by match id. */
const data = raw as unknown as Record<string, Record<string, Highlight> | undefined>;

export const highlightFor = (league: string, matchId: number): Highlight | undefined =>
  data[league]?.[String(matchId)];
