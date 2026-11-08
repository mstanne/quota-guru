// Settings of the national-team prediction model: same Poisson / Dixon-Coles model as the clubs
// (scripts/lib/poisson-model.mjs), fitted apart on the games between national teams only.
//
// National teams play 8–12 games a year, so the model remembers longer and lets ratings spread further than for
// clubs; the confederation plays the part of the domestic league (Euro qualifiers and Nations League both mean UEFA),
// its strength learnt from the games between confederations (World Cup, friendlies, intercontinental play-offs).
// Friendlies count less: line-ups are often experimental.
//
// Tuned in November 2026 with a walk-forward backtest on 3,000 official games of 2022-2026 (monthly refits, data
// from 2012): log-loss 0.843 and 62% exact 1X2 picks, against 1.055 of fixed frequencies. Half-life 1 year: 0.891;
// 2 years: 0.866; 3 years: 0.843 with teamSigma 1 (4–6 years: same). Friendlies weight 0.3 / 0.7 / 1: 0.868 /
// 0.844 / 0.843. Without confederations: +0.008.
import { NATIONAL } from "./leagues.mjs";

export const NATIONAL_CODES = new Set(NATIONAL.map((c) => c.code));
const CONFED = Object.fromEntries(NATIONAL.filter((c) => c.confed).map((c) => [c.code, c.confed]));
/** History kept for the model (years): with a 3-year half-life older games weigh less than 1/4. */
export const NATIONAL_HISTORY_YEARS = 7;

export const NATIONAL_FIT = {
  // competitions between confederations: their games link the confederations' strengths
  cups: NATIONAL.filter((c) => !c.confed).map((c) => c.code),
  leagueOf: (code) => CONFED[code],
  crossAll: true,
  compWeights: { FRI: 0.7 },
  options: { halfLifeDays: 1095, teamSigma: 1.0, otherLeague: 0, cupSigma: 0.1 },
};
