// Probability that every pick of the bet slip ("schedina") comes true, from the model's estimates.
// No data import: the picks carry their own probability (set when they are added from a prediction).
//
// The product of the single probabilities is exact only for independent events. The slip keeps at most one pick per
// match (BetSlipContext), so two outcomes of the same match – the clearly dependent case – can never be combined.

/** Model probability of each pick, or null when a pick has none (added from the odds, no prediction). */
export interface SlipChance {
  /** Probability that all the picks with a probability come true (null when none has one). */
  probability: number | null;
  /** Picks with a probability / all picks. */
  covered: number;
  total: number;
}

export function slipChance(picks: { probability?: number }[]): SlipChance {
  const known = picks.filter((p) => typeof p.probability === "number" && p.probability > 0);
  return {
    probability: known.length ? known.reduce((acc, p) => acc * (p.probability as number), 1) : null,
    covered: known.length,
    total: picks.length,
  };
}

/** Percentage with enough decimals to stay readable on long slips: "52%", "4,2%", "0,35%". */
export function formatChance(p: number) {
  const v = p * 100;
  const digits = v >= 10 ? 0 : v >= 1 ? 1 : 2;
  const s = v.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return v > 0 && Number(v.toFixed(digits)) === 0 ? "meno dello 0,01%" : `${s}%`;
}

/** "circa 1 su 24". */
export function oneIn(p: number) {
  const n = Math.round(1 / p);
  return n <= 1 ? "quasi certa" : `circa 1 su ${n.toLocaleString("it-IT")}`;
}

/** Fair odds of the whole slip (1 ÷ probability), Italian decimal format: "23,81". */
export function slipFairOdds(p: number) {
  return (1 / p).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
