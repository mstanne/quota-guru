// Types for model.mjs (plain JavaScript shared by the site and scripts/predict-tennis.mjs).
export type TourKey = "atp" | "wta";
export type Surface = "Hard" | "Clay" | "Grass";
export interface Rating {
  all: number;
  n: number;
  Hard?: number;
  Clay?: number;
  Grass?: number;
}
export interface MatchPrediction {
  /** Win probability of A and B. */
  p: [number, number];
  /** Centre of A's per-set win probability. */
  setP: number;
  bestOf: 3 | 5;
  /** Exact set scores, A's sets first, A's wins first. */
  scores: { a: number; b: number; p: number }[];
  /** Probability of each total number of sets ("2", "3" or "3", "4", "5"). */
  sets: Record<string, number>;
  /** A wins by 2+ sets / B wins by 2+ sets. */
  handicap: { a: number; b: number };
}
export const BASE: number;
export const SLOPE: Record<TourKey, number>;
export const SURFACES: Surface[];
export const FORM: number;
export function pointsToElo(points: number | null, tour?: TourKey): number;
export function eloProb(ra: number, rb: number): number;
export function setProbability(p3: number, form?: number): number;
export function predictMatch(ra: number, rb: number, bestOf?: 3 | 5, form?: number): MatchPrediction;
export function ratingOn(r: Rating | null | undefined, surface?: Surface | null): number | null;
export function buildElo(
  matches: { date: string; tour: TourKey; surface: string | null; winner: number; loser: number }[],
  seed: (id: number, tour: TourKey) => number,
): Map<number, Rating & Record<string, number>>;
