// Types and formatting helpers for the football predictions (Poisson / Dixon-Coles model).
// The numbers come from scripts/predict-football.mjs; no data import here, so small components can use it.

export interface Prediction {
  /** Expected goals [home, away]. */
  xg: [number, number];
  /** Probabilities of 1, X, 2. */
  p: [number, number, number];
  /** Double chance 1X, 12, X2. */
  dc: [number, number, number];
  /** Probability of more than 1.5 / 2.5 / 3.5 goals. */
  over: Record<"1.5" | "2.5" | "3.5", number>;
  /** Both teams to score. */
  btts: number;
  /** Most likely scores [home, away, probability], best first. */
  scores: [number, number, number][];
  /** Most likely outcome: "1" | "X" | "2", or a double chance when no outcome reaches 45%. */
  pick: "1" | "X" | "2" | "1X" | "X2";
  /** How much data the model had on the two teams. */
  confidence: "alta" | "media" | "bassa";
  /** true = made before kick-off of a match that is now finished. */
  pre: boolean;
}

export interface PredictionsFile {
  generatedAt: string;
  model: { name: string; results: number; rho: number; halfLifeDays: number; from: string | null };
  track: { n: number; hits: number; logLoss: number; brier: number };
  predictions: Record<string, Prediction>;
}

/** "52%" (whole percent, never 0% or 100% for an open event). */
export function pct(x: number) {
  const v = Math.round(x * 100);
  return `${Math.min(99, Math.max(1, v))}%`;
}

/** Index (0/1/2) of the most likely 1X2 outcome. */
export const topOutcome = (p: Prediction) => p.p.indexOf(Math.max(...p.p)) as 0 | 1 | 2;

export const CONFIDENCE_LABEL: Record<Prediction["confidence"], string> = {
  alta: "Affidabilità alta",
  media: "Affidabilità media",
  bassa: "Affidabilità bassa",
};

/** Plain-language description of the pick, e.g. "Vittoria Inter" / "Inter o pareggio". */
export function pickLabel(p: Prediction, home: string, away: string) {
  switch (p.pick) {
    case "1":
      return `Vittoria ${home}`;
    case "2":
      return `Vittoria ${away}`;
    case "X":
      return "Pareggio";
    case "1X":
      return `${home} o pareggio`;
    case "X2":
      return `${away} o pareggio`;
  }
}

/** Outcome of a finished match as an index (0 = 1, 1 = X, 2 = 2). */
export function outcomeIndex(home: number, away: number) {
  return home > away ? 0 : home === away ? 1 : 2;
}

/** Did the pick (including double chance) match the final result? */
export function pickHit(p: Prediction, home: number, away: number) {
  const o = ["1", "X", "2"][outcomeIndex(home, away)];
  return p.pick.includes(o);
}
