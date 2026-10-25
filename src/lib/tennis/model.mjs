// Tennis prediction model. Plain JS so it runs both in the browser (head-to-head calculator) and in
// scripts/predict-tennis.mjs (Node). Types in model.d.mts.
//
// 1. Ratings on the Elo scale (400 points = 10:1 odds).
//    - With match results (data/tennis-matches.json): surface Elo in the FiveThirtyEight / Tennis Abstract
//      style. Each player has an overall rating and one per surface; K shrinks with the number of matches
//      played; the rating used for a match is the average of overall and surface rating.
//    - Without results: rating from ATP/WTA ranking points, R = BASE + SLOPE · ln(points / 1000).
//      With SLOPE ≈ 170, a player with twice the points of the opponent wins ~66% of best-of-3 matches,
//      in line with published rank/points models; it is also the seed for players new to the Elo.
// 2. Match → sets: Elo probabilities refer to best-of-3. Sets are not independent (a player having a good
//    day tends to win in straight sets), so the per-set probability varies from match to match: half the
//    time it is higher, half lower (± FORM on the logit scale) around a centre chosen so that the best-of-3
//    win probability matches the Elo one. With FORM = 0.7 an even match goes to a third set ~44% of the
//    time instead of 50% under independence. The same mixture gives best-of-5, exact set scores, total sets
//    and set handicaps. FORM is an initial value, to be recalibrated when match results are available.

export const BASE = 1800;
/** Elo points per unit of ln(ranking points). WTA results are a little less predictable from points. */
export const SLOPE = { atp: 170, wta: 155 };
export const SURFACES = ["Hard", "Clay", "Grass"];
/** Match-to-match spread of the set win probability (logit scale). 0 = independent sets. */
export const FORM = 0.7;

const logit = (x) => Math.log(x / (1 - x));
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const bo3 = (s) => s * s * (3 - 2 * s);

/** Rating from ranking points (null points → weakest top-100 level). */
export function pointsToElo(points, tour = "atp") {
  const p = Math.max(points ?? 400, 50);
  return BASE + SLOPE[tour] * Math.log(p / 1000);
}

/** Probability that A beats B in a best-of-3 match. */
export const eloProb = (ra, rb) => 1 / (1 + 10 ** ((rb - ra) / 400));

/**
 * Centre of the per-set probability (see FORM) such that the average best-of-3 win probability is p3.
 * With form = 0 this is the exact inverse of P3 = s²(3 − 2s).
 */
export function setProbability(p3, form = FORM) {
  let lo = -12;
  let hi = 12;
  for (let i = 0; i < 60; i++) {
    const c = (lo + hi) / 2;
    const v = (bo3(sigmoid(c + form)) + bo3(sigmoid(c - form))) / 2;
    if (v < p3) lo = c;
    else hi = c;
  }
  return sigmoid((lo + hi) / 2);
}

const C = (n, k) => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};

/**
 * Full prediction for A vs B.
 * @returns {{ p: [number, number], setP: number, bestOf: 3|5, scores: { a: number, b: number, p: number }[],
 *   sets: Record<string, number>, handicap: { a: number, b: number } }}
 *   scores: exact set scores (A's sets first) · sets: probability of each total number of sets
 *   handicap: A −1.5 sets (A wins by 2+ sets) and B −1.5 sets
 */
export function predictMatch(ra, rb, bestOf = 3, form = FORM) {
  const centre = setProbability(eloProb(ra, rb), form);
  const need = bestOf === 5 ? 3 : 2;
  const states = form ? [sigmoid(logit(centre) + form), sigmoid(logit(centre) - form)] : [centre];
  const scores = [];
  // A wins need-k (B took k sets, A won the last one), then B wins need-k
  for (let k = 0; k < need; k++) scores.push({ a: need, b: k, p: 0 });
  for (let k = need - 1; k >= 0; k--) scores.push({ a: k, b: need, p: 0 });
  for (const s of states) {
    for (const x of scores) {
      const k = Math.min(x.a, x.b);
      const win = x.a === need ? s : 1 - s;
      x.p += (C(need - 1 + k, k) * win ** need * (1 - win) ** k) / states.length;
    }
  }
  const pa = scores.filter((x) => x.a === need).reduce((t, x) => t + x.p, 0);
  const sets = {};
  for (const x of scores) sets[x.a + x.b] = (sets[x.a + x.b] ?? 0) + x.p;
  const margin = (who) => scores.filter((x) => (who === "a" ? x.a - x.b : x.b - x.a) >= 2).reduce((t, x) => t + x.p, 0);
  return { p: [pa, 1 - pa], setP: centre, bestOf, scores, sets, handicap: { a: margin("a"), b: margin("b") } };
}

/** Rating for a match on a surface: average of overall and surface Elo when the surface one exists. */
export function ratingOn(r, surface) {
  if (!r) return null;
  const s = surface && r[surface];
  return s != null ? (r.all + s) / 2 : r.all;
}

/**
 * Surface Elo from match results.
 * @param {{ date: string, tour: "atp"|"wta", surface: string|null, winner: number, loser: number }[]} matches
 * @param {(id: number, tour: string) => number} seed starting rating of a player (e.g. from ranking points)
 * @returns {Map<number, { all: number, n: number, Hard?: number, Clay?: number, Grass?: number, nHard?: number, ... }>}
 */
export function buildElo(matches, seed) {
  const k = (n) => 250 / (n + 5) ** 0.4;
  const players = new Map();
  const get = (id, tour) => {
    if (!players.has(id)) {
      const r0 = seed(id, tour);
      players.set(id, { all: r0, n: 0, ...Object.fromEntries(SURFACES.map((s) => [s, r0])) });
    }
    return players.get(id);
  };
  for (const m of [...matches].sort((a, b) => a.date.localeCompare(b.date))) {
    const w = get(m.winner, m.tour);
    const l = get(m.loser, m.tour);
    const e = eloProb(w.all, l.all);
    const dw = k(w.n) * (1 - e);
    const dl = k(l.n) * (1 - e);
    w.all += dw;
    l.all -= dl;
    w.n++;
    l.n++;
    if (SURFACES.includes(m.surface)) {
      const nk = `n${m.surface}`;
      const es = eloProb(w[m.surface], l[m.surface]);
      w[m.surface] += k(w[nk] ?? 0) * (1 - es);
      l[m.surface] -= k(l[nk] ?? 0) * (1 - es);
      w[nk] = (w[nk] ?? 0) + 1;
      l[nk] = (l[nk] ?? 0) + 1;
    }
  }
  return players;
}
