// Types for goalStats.mjs (plain JavaScript shared by the site and the build scripts).
export interface GoalResult {
  date: string;
  home: number;
  away: number;
  hg: number | null;
  ag: number | null;
}
/** Counts over n matches: goals for/against, matches over each line of LINES, both teams scored, clean sheets,
 *  matches without scoring. */
export interface GoalCounts {
  n: number;
  gf: number;
  ga: number;
  over: [number, number, number];
  btts: number;
  clean: number;
  blank: number;
}
export interface TeamGoalStats {
  all: GoalCounts;
  home: GoalCounts;
  away: GoalCounts;
  last: GoalCounts;
}
export declare const LINES: [number, number, number];
export declare function teamGoalStats(results: GoalResult[], teamId: number, recent?: number): TeamGoalStats;
export declare function leagueGoalStats(results: GoalResult[]): GoalCounts;
