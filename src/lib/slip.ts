// Probability that every pick of the bet slip ("schedina") comes true, from the model's estimates.
// No data import: the picks carry their own probability (set when they are added from a prediction).
//
// Different matches are taken as independent: the product of their probabilities. Several picks of the SAME match
// (football, BetSlipContext `combinable`) depend on each other: their joint probability comes from the match's score
// matrix (src/lib/footballMarkets.ts), and enters the product once.
import { jointChance, type Lam } from "./footballMarkets";

/** Model probability of each pick, or null when a pick has none (added from the odds, no prediction). */
export interface SlipChance {
  /** Probability that all the picks with a probability come true (null when none has one). */
  probability: number | null;
  /** Picks with a probability / all picks. */
  covered: number;
  total: number;
}

interface SlipPick {
  probability?: number;
  matchId?: string;
  betType?: string;
  lam?: Lam;
}

/** Joint probability of the picks of each match with more than one pick: { matchId: probability }. */
export function matchCombos(picks: SlipPick[]): Map<string, number> {
  const byMatch = new Map<string, SlipPick[]>();
  for (const p of picks) if (p.matchId) byMatch.set(p.matchId, [...(byMatch.get(p.matchId) ?? []), p]);
  const out = new Map<string, number>();
  for (const [id, list] of byMatch) {
    if (list.length < 2 || !list[0].lam) continue;
    const j = jointChance(list[0].lam, list.map((p) => p.betType ?? ""));
    if (j !== null) out.set(id, j);
  }
  return out;
}

export function slipChance(picks: SlipPick[]): SlipChance {
  const known = picks.filter((p) => typeof p.probability === "number" && p.probability > 0);
  const combos = matchCombos(known);
  let probability = 1;
  for (const p of known) if (!p.matchId || !combos.has(p.matchId)) probability *= p.probability as number;
  for (const v of combos.values()) probability *= v;
  return {
    probability: known.length ? probability : null,
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
