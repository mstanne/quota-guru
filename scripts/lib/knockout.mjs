// Chance of going through a knockout tie (cups), from the Poisson model of scripts/lib/poisson-model.mjs.
//
//   single match   win in 90 minutes, or draw and then extra time (30 minutes: a third of the expected goals) and,
//                  still level, penalties (50/50)
//   two legs       aggregate score of the two matches; level after the second leg: extra time at the second leg's
//                  ground, then penalties. No away-goals rule (abolished by UEFA in 2021 and by the national cups).
//                  First leg still to play: both legs from the model; first leg played: its score plus the second leg.
//
// Pure functions, no I/O: used by scripts/predict-football.mjs.
import { expectedGoals, scoreMatrix } from "./poisson-model.mjs";

const EXTRA_TIME = 1 / 3;

/** Distribution of (home goals − away goals) of a score matrix: Map diff → probability. */
function diffs(m) {
  const d = new Map();
  for (let i = 0; i < m.length; i++) for (let j = 0; j < m[i].length; j++) d.set(i - j, (d.get(i - j) ?? 0) + m[i][j]);
  return d;
}

/** Extra time then penalties of the match `f` (whose home side plays at home): [home goes through, away goes through]. */
function afterDraw(model, f) {
  const xg = expectedGoals(model, f);
  const d = diffs(scoreMatrix(xg.home * EXTRA_TIME, xg.away * EXTRA_TIME, 0, 6));
  let h = 0, a = 0, x = 0;
  for (const [k, v] of d) k > 0 ? (h += v) : k < 0 ? (a += v) : (x += v);
  return [h + x / 2, a + x / 2];
}

/**
 * Chance that each side of `f` (the match to predict) goes through, [home, away], or null when the tie cannot be
 * worked out. `other`: the other leg of a two-legged tie ({ home, away, comp, neutral, played?: [hg, ag] } with the
 * teams as they are in that match), null for a single match.
 */
export function qualifyChance(model, f, other = null) {
  const xg = expectedGoals(model, f);
  const m = scoreMatrix(xg.home, xg.away, model.rho, model.options.maxGoals);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  if (!other) {
    const d = diffs(m);
    const [eh, ea] = afterDraw(model, f);
    let h = 0, a = 0;
    for (const [k, v] of d) k > 0 ? (h += v) : k < 0 ? (a += v) : ((h += v * eh), (a += v * ea));
    return [r3(h), r3(a)];
  }
  // aggregate from the point of view of f's home side; `other` has the two teams the other way round
  if (other.home !== f.away || other.away !== f.home) return null;
  const first = other.played ? "other" : Date.parse(other.date ?? 0) < Date.parse(f.date ?? 0) ? "other" : "f";
  // distribution of the other leg's (f.home − f.away) goals
  let otherD;
  if (other.played) otherD = new Map([[other.played[1] - other.played[0], 1]]);
  else {
    const ox = expectedGoals(model, other);
    otherD = new Map([...diffs(scoreMatrix(ox.home, ox.away, model.rho, model.options.maxGoals))].map(([k, v]) => [-k, v]));
  }
  const fD = diffs(m);
  // extra time at the second leg's ground
  const second = first === "other" ? f : other;
  const et = afterDraw(model, second);
  const etF = first === "other" ? et : [et[1], et[0]]; // from f's point of view: [f.home, f.away]
  let h = 0, a = 0;
  for (const [k1, v1] of fD)
    for (const [k2, v2] of otherD) {
      const v = v1 * v2;
      const k = k1 + k2;
      if (k > 0) h += v;
      else if (k < 0) a += v;
      else (h += v * etF[0]), (a += v * etF[1]);
    }
  return [r3(h), r3(a)];
}
