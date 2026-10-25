// Typed access to src/data/football-predictions.json (written by scripts/predict-football.mjs).
// Importing this module bundles every prediction: pages that show few matches should use the copies
// already embedded in football-home.json instead.
import raw from "../data/football-predictions.json";
import type { Prediction, PredictionsFile } from "./predictionsCore";

export * from "./predictionsCore";

const data = raw as unknown as PredictionsFile;

export const predictionsMeta = { generatedAt: data.generatedAt, model: data.model, track: data.track };
export const predictionFor = (matchId: number): Prediction | undefined => data.predictions[String(matchId)];
