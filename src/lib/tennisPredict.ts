// Head-to-head tennis predictions from the ratings in src/data/tennis-ratings.json
// (scripts/predict-tennis.mjs) and the model in src/lib/tennis/model.mjs.
import ratingsRaw from "../data/tennis-ratings.json";
import { predictMatch, ratingOn, type MatchPrediction, type Rating, type Surface } from "./tennis/model.mjs";
import type { Tour } from "./tennis";

export type { MatchPrediction, Surface } from "./tennis/model.mjs";

const data = ratingsRaw as unknown as {
  generatedAt: string;
  source: "points" | "elo";
  matches: number;
} & Record<Tour, Record<string, Rating>>;

/** "points" = ratings from ranking points only; "elo" = surface Elo from match results. */
export const ratingSource = data.source;
export const ratingFor = (tour: Tour, playerId: number): Rating | undefined => data[tour]?.[String(playerId)];

/** Does any rating of this tour depend on the surface? (only with match results) */
export const hasSurfaceRatings = (tour: Tour) =>
  Object.values(data[tour] ?? {}).some((r) => r.Hard != null || r.Clay != null || r.Grass != null);

export function tennisPrediction(
  tour: Tour,
  a: number,
  b: number,
  { surface = null, bestOf = 3 }: { surface?: Surface | null; bestOf?: 3 | 5 } = {},
): MatchPrediction | null {
  const ra = ratingOn(ratingFor(tour, a), surface);
  const rb = ratingOn(ratingFor(tour, b), surface);
  if (ra == null || rb == null || a === b) return null;
  return predictMatch(ra, rb, bestOf);
}

/** API surface names (tournament calendar) → model surfaces. */
export function modelSurface(s: string | null | undefined): Surface | null {
  if (s === "Hard" || s === "Clay" || s === "Grass") return s;
  if (s && /indoor|carpet/i.test(s)) return "Hard";
  return null;
}
