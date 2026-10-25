// NBA predictions written by scripts/predict-basket.mjs (points model, scripts/lib/basket-model.mjs).
import raw from "../data/basket-predictions.json";

export interface BasketPrediction {
  /** Win probability [home, away]. */
  p: [number, number];
  /** Expected points [home, away]. */
  pts: [number, number];
  /** Expected home margin (negative = away team ahead). */
  margin: number;
  total: number;
  /** Favourite: 0 = home, 1 = away. */
  fav: 0 | 1;
  /** [line, P(favourite wins by more than line)]. */
  spread: [number, number][];
  /** [line, P(total points > line)]. */
  totals: [number, number][];
  /** P(win by 10+) [home, away]. */
  big: [number, number];
  /** Second night of a back-to-back [home, away] (1 = yes). */
  b2b: [number, number];
  confidence: "alta" | "media" | "bassa";
  /** true = made before tip-off of a game that is now finished. */
  pre: boolean;
}

const data = raw as unknown as {
  generatedAt: string;
  model: { name: string; games: number; home: number; b2b: number; sdMargin: number } | null;
  track: { n: number; hits: number; logLoss: number; brier: number };
  predictions: Record<string, BasketPrediction>;
};

export const basketModel = data.model;
export const basketTrack = data.track;
export const basketPredictionFor = (gameId: number): BasketPrediction | undefined => data.predictions[String(gameId)];

/** "112,5" */
export const fmtPts = (x: number) => x.toFixed(1).replace(".", ",");
