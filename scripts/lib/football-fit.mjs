// Settings of the football prediction model, shared by scripts/predict-football.mjs (published predictions) and
// scripts/backtest-slip.mjs (check of the bet-slip probabilities), so both always fit the same model.
import { NATIONAL_CUPS } from "./leagues.mjs";

const NATIONAL_CUP_CODES = NATIONAL_CUPS.map((c) => c.code);
// competitions that are not domestic leagues: European cups, national cups and super cups (November 2026). Their games
// between clubs of different leagues teach the model how strong each league is (Serie A vs Serie B and Serie C in the
// Coppa Italia, as Serie A vs Premier League in the Champions League)
export const CUPS = ["CL", "EL", "ECL", ...NATIONAL_CUP_CODES];
// Starting strength of each league (log scale; half the goal gap between two leagues), roughly in line with UEFA rankings.
// Only a starting point: the model corrects it with the cup results between leagues. Lower divisions (shown for
// information only, no predictions): one or two levels below their country's top league.
export const LEAGUE_PRIORS = {
  PL: 0.08, SA: 0.05, PD: 0.05, BL1: 0.05, FL1: 0.03, PPL: -0.03, DED: -0.03, ELC: -0.08, BSA: -0.05, SB: -0.15,
  SD: -0.14, BL2: -0.12, FL2: -0.18, ED: -0.3, PPL2: -0.3, BSB: -0.25, LO: -0.22, SCA: -0.32, SCBG: -0.32, SCC: -0.32,
};
// National cups count a little less: the big clubs often rest their best players in the early rounds
export const COMP_WEIGHTS = Object.fromEntries(NATIONAL_CUP_CODES.map((c) => [c, 0.75]));
// MODEL_XG_WEIGHT (0–1, default 0): share of expected goals in the fit, see scripts/lib/poisson-model.mjs.
// Compare first:  MODEL_XG_WEIGHT=0.3 node scripts/predict-football.mjs --backtest
export const XG_WEIGHT = Math.min(1, Math.max(0, Number(process.env.MODEL_XG_WEIGHT ?? 0) || 0));
// MODEL_NATIONAL_CUPS=0: fit without the national cups and the lower divisions (backtest comparison only)
export const WITH_NEW_DATA = process.env.MODEL_NATIONAL_CUPS !== "0";
export const FIT = { cups: CUPS, leaguePriors: LEAGUE_PRIORS, compWeights: COMP_WEIGHTS, options: { xgWeight: XG_WEIGHT } };
