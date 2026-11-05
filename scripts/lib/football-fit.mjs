// Settings of the football prediction model, shared by scripts/predict-football.mjs (published predictions) and
// scripts/backtest-slip.mjs (check of the bet-slip probabilities), so both always fit the same model.
export const CUPS = ["CL", "EL", "ECL"]; // competitions that are not domestic leagues
// Starting strength of each league (log scale; half the goal gap between two leagues), roughly in line with UEFA rankings.
// Only a starting point: the model corrects it with the Champions League results between leagues.
export const LEAGUE_PRIORS = { PL: 0.08, SA: 0.05, PD: 0.05, BL1: 0.05, FL1: 0.03, PPL: -0.03, DED: -0.03, ELC: -0.08, BSA: -0.05, SB: -0.15 };
// MODEL_XG_WEIGHT (0–1, default 0): share of expected goals in the fit, see scripts/lib/poisson-model.mjs.
// Compare first:  MODEL_XG_WEIGHT=0.3 node scripts/predict-football.mjs --backtest
export const XG_WEIGHT = Math.min(1, Math.max(0, Number(process.env.MODEL_XG_WEIGHT ?? 0) || 0));
export const FIT = { cups: CUPS, leaguePriors: LEAGUE_PRIORS, options: { xgWeight: XG_WEIGHT } };
