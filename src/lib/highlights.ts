// Official YouTube highlights of finished matches (src/data/highlights.json, written by scripts/fetch-highlights.mjs).
import raw from "../data/highlights.json";

export interface Highlight {
  /** YouTube video id. */
  video: string;
  title: string;
  /** ISO date the video was published. */
  published: string;
}
type League = "serie-a" | "nba";

const data = raw as unknown as Partial<Record<League, Record<string, Highlight>>>;

export const highlightFor = (league: League, matchId: number): Highlight | undefined =>
  data[league]?.[String(matchId)];
