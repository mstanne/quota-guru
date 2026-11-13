// End-of-season projection of a league: Monte Carlo simulation of every match still to play, with the same
// Poisson / Dixon-Coles model as the match predictions (scripts/lib/poisson-model.mjs).
//
// Start: the current table (points as published, so penalty points are included). Matches still to play: every
// ordered pair (home, away) of the table's teams not yet played this season (round-robin leagues: each pair meets once
// at each ground), whether or not it is already in the calendar. Each simulated season draws the score of every such
// match from its score matrix; the final order is by points, then goal difference, then goals scored (head-to-head
// rules and play-offs are not simulated).
//
// Output per team: expected final points, and the share of simulated seasons ending in each position.
// Pure functions, no I/O: used by scripts/predict-football.mjs.
import { expectedGoals, scoreMatrix } from "./poisson-model.mjs";

/** Small deterministic PRNG (mulberry32): the same data give the same figures at every build. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cumulative distribution of the score cells of a fixture, for sampling: { cdf, hg, ag }. */
function sampler(model, f) {
  const xg = expectedGoals(model, f);
  const m = scoreMatrix(xg.home, xg.away, model.rho, 8);
  const cdf = [];
  const hg = [];
  const ag = [];
  let acc = 0;
  for (let i = 0; i < m.length; i++)
    for (let j = 0; j < m[i].length; j++) {
      if (m[i][j] < 1e-5) continue;
      acc += m[i][j];
      cdf.push(acc);
      hg.push(i);
      ag.push(j);
    }
  for (let k = 0; k < cdf.length; k++) cdf[k] /= acc;
  return { cdf, hg, ag };
}

function draw(s, u) {
  let lo = 0;
  let hi = s.cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (s.cdf[mid] < u) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Simulates the rest of a league season.
 * @param {object} model fitted model (fitModel)
 * @param {string} comp competition code
 * @param {{ team: { id: number }, points: number, goalsFor: number, goalsAgainst: number, playedGames: number }[]} table
 * @param {{ home: number, away: number }[]} played league matches already played this season
 * @param {{ runs?: number, seed?: number }} [opts]
 * @returns {{ remaining: number, teams: Record<number, { xpts: number, pos: number[] }> } | null}
 *   null when the season is not a plain double round robin (a pair played more than twice, or more games than that)
 */
export function simulateSeason(model, comp, table, played, { runs = 10000, seed = 1 } = {}) {
  const ids = table.map((r) => r.team.id);
  const n = ids.length;
  if (n < 4) return null;
  const index = new Map(ids.map((id, i) => [id, i]));
  const done = new Set();
  for (const r of played) {
    if (!index.has(r.home) || !index.has(r.away)) continue;
    const k = `${r.home}-${r.away}`;
    if (done.has(k)) return null; // the same fixture twice: not a double round robin
    done.add(k);
  }
  const fixtures = [];
  for (const h of ids) for (const a of ids) if (h !== a && !done.has(`${h}-${a}`)) fixtures.push([index.get(h), index.get(a)]);
  // the table and the results must agree on the games played, or points would be counted twice (or never)
  const games = 2 * (n - 1);
  for (const r of table) {
    const i = index.get(r.team.id);
    const left = fixtures.filter(([h, a]) => h === i || a === i).length;
    if (r.playedGames + left !== games) return null;
  }
  const samplers = fixtures.map(([h, a]) => sampler(model, { comp, home: ids[h], away: ids[a] }));
  const rand = rng(seed);
  const posCount = ids.map(() => new Array(n).fill(0));
  const ptsSum = new Array(n).fill(0);
  const pts = new Array(n);
  const gd = new Array(n);
  const gf = new Array(n);
  const order = ids.map((_, i) => i);
  for (let run = 0; run < runs; run++) {
    for (let i = 0; i < n; i++) {
      const r = table[i];
      pts[i] = r.points;
      gd[i] = r.goalsFor - r.goalsAgainst;
      gf[i] = r.goalsFor;
    }
    for (let k = 0; k < fixtures.length; k++) {
      const [h, a] = fixtures[k];
      const s = samplers[k];
      const c = draw(s, rand());
      const x = s.hg[c];
      const y = s.ag[c];
      if (x > y) pts[h] += 3;
      else if (x < y) pts[a] += 3;
      else {
        pts[h]++;
        pts[a]++;
      }
      gd[h] += x - y;
      gd[a] += y - x;
      gf[h] += x;
      gf[a] += y;
    }
    // ties left after points, goal difference and goals: random order (a coin for head-to-head)
    const tie = order.map(() => rand());
    order.sort((i, j) => pts[j] - pts[i] || gd[j] - gd[i] || gf[j] - gf[i] || tie[j] - tie[i]);
    for (let p = 0; p < n; p++) posCount[order[p]][p]++;
    for (let i = 0; i < n; i++) ptsSum[i] += pts[i];
  }
  const teams = {};
  ids.forEach((id, i) => {
    teams[id] = {
      xpts: Math.round((ptsSum[i] / runs) * 10) / 10,
      pos: posCount[i].map((c) => Math.round((c / runs) * 1000) / 1000),
    };
  });
  return { remaining: fixtures.length, teams };
}
