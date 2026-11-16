// Projection of a European cup with a 36-team league phase (Champions League, Europa League, Conference League):
// Monte Carlo simulation of the league-phase matches still to play and then of the knockout rounds, with the same
// Poisson / Dixon-Coles model as the match predictions.
//
// League phase: start from the current table; the remaining fixtures come from the cup's calendar
// (data/football-history.json `schedule`, scripts/fetch-football.mjs). Order: points, goal difference, goals scored,
// then at random (the other UEFA criteria are not simulated). 1st-8th go to the round of 16, 9th-24th to the knockout
// play-offs, 25th-36th are out.
// Knockout rounds (two legs, the better-placed team at home in the second leg, extra time and penalties as in
// scripts/lib/knockout.mjs; the final is one match on neutral ground), with the bracket of the format:
//   play-offs   9th/10th v 23rd/24th, 11th/12th v 21st/22nd, 13th/14th v 19th/20th, 15th/16th v 17th/18th
//   round of 16 1st/2nd v the winners from 15th-18th, 3rd/4th v 13th/14th-19th/20th, 5th/6th v 11th/12th-21st/22nd,
//               7th/8th v 9th/10th-23rd/24th (which of the two at random, as in the draw)
//   quarter-finals and semi-finals: fixed bracket from the league-phase places (simplified: 1st and 2nd in different
//               halves, 1st side v 8th side, 4th v 5th, 2nd v 7th, 3rd v 6th).
//
// Output per team: expected league-phase points, share of simulations ending in each place, and the share reaching each
// stage: 0 top 8, 1 top 24, 2 round of 16, 3 quarter-finals, 4 semi-finals, 5 final, 6 winner.
// Pure functions, no I/O: used by scripts/predict-football.mjs.
import { expectedGoals, scoreMatrix } from "./poisson-model.mjs";
import { qualifyChance } from "./knockout.mjs";

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

export const TEAMS = 36;

/**
 * @param {object} model fitted model (fitModel)
 * @param {string} comp competition code (CL, EL, ECL)
 * @param {{ team: { id: number }, points: number, goalsFor: number, goalsAgainst: number, playedGames: number }[]} table
 * @param {{ home: number, away: number }[]} fixtures league-phase matches still to play
 * @param {{ runs?: number, seed?: number, games?: number }} [opts] `games`: league-phase matches per team (8)
 * @returns {{ remaining: number, teams: Record<number, { xpts: number, pos: number[], stage: number[] }> } | null}
 *   null when the table is not a 36-team league phase or table and calendar disagree
 */
export function simulateLeaguePhase(model, comp, table, fixtures, { runs = 10000, seed = 1, games = 8 } = {}) {
  const ids = table.map((r) => r.team.id);
  const n = ids.length;
  if (n !== TEAMS) return null;
  const index = new Map(ids.map((id, i) => [id, i]));
  const left = fixtures.filter((f) => index.has(f.home) && index.has(f.away));
  const count = new Array(n).fill(0);
  for (const f of left) count[index.get(f.home)]++, count[index.get(f.away)]++;
  for (let i = 0; i < n; i++) if (table[i].playedGames + count[i] !== games) return null;

  const samplers = left.map((f) => [index.get(f.home), index.get(f.away), sampler(model, { comp, home: f.home, away: f.away })]);
  // chance that `a` goes through a two-legged tie with the second leg at `a`'s ground (cached)
  const tieCache = new Map();
  const tie = (a, b) => {
    const k = `${a}-${b}`;
    if (!tieCache.has(k)) {
      const second = { comp, home: ids[a], away: ids[b], date: "2001-01-08" };
      const first = { comp, home: ids[b], away: ids[a], date: "2001-01-01" };
      tieCache.set(k, qualifyChance(model, second, first)?.[0] ?? 0.5);
    }
    return tieCache.get(k);
  };
  const finalCache = new Map();
  const final = (a, b) => {
    const k = `${a}-${b}`;
    if (!finalCache.has(k)) finalCache.set(k, qualifyChance(model, { comp, home: ids[a], away: ids[b], neutral: true })?.[0] ?? 0.5);
    return finalCache.get(k);
  };

  const rand = rng(seed);
  const pts = new Array(n);
  const gd = new Array(n);
  const gf = new Array(n);
  const ptsSum = new Array(n).fill(0);
  const posCount = ids.map(() => new Array(n).fill(0));
  const stage = ids.map(() => new Array(7).fill(0));
  const order = ids.map((_, i) => i);
  const rank = new Array(n);
  /** two-legged tie, the better-placed team at home in the second leg */
  const play = (x, y) => {
    const [a, b] = rank[x] < rank[y] ? [x, y] : [y, x];
    return rand() < tie(a, b) ? a : b;
  };
  const shuffle2 = ([x, y]) => (rand() < 0.5 ? [x, y] : [y, x]);

  for (let run = 0; run < runs; run++) {
    for (let i = 0; i < n; i++) {
      pts[i] = table[i].points;
      gd[i] = table[i].goalsFor - table[i].goalsAgainst;
      gf[i] = table[i].goalsFor;
    }
    for (const [h, a, s] of samplers) {
      const c = draw(s, rand());
      const x = s.hg[c];
      const y = s.ag[c];
      if (x > y) pts[h] += 3;
      else if (x < y) pts[a] += 3;
      else pts[h]++, pts[a]++;
      gd[h] += x - y;
      gd[a] += y - x;
      gf[h] += x;
      gf[a] += y;
    }
    const tieBreak = order.map(() => rand());
    order.sort((i, j) => pts[j] - pts[i] || gd[j] - gd[i] || gf[j] - gf[i] || tieBreak[j] - tieBreak[i]);
    for (let p = 0; p < n; p++) {
      rank[order[p]] = p;
      posCount[order[p]][p]++;
      if (p < 8) stage[order[p]][0]++;
      if (p < 24) stage[order[p]][1]++;
    }
    for (let i = 0; i < n; i++) ptsSum[i] += pts[i];
    const at = (p) => order[p - 1]; // team in place p (1-based)
    // play-offs: pools of places, the draw decides which of the two
    const pools = [
      [[15, 16], [17, 18]],
      [[13, 14], [19, 20]],
      [[11, 12], [21, 22]],
      [[9, 10], [23, 24]],
    ];
    const playoffWinners = pools.map(([top, low]) => {
      const t = shuffle2(top);
      const l = shuffle2(low);
      return [play(at(t[0]), at(l[0])), play(at(t[1]), at(l[1]))];
    });
    // round of 16: 1st/2nd v winners from pool 0, 3rd/4th v pool 1, 5th/6th v pool 2, 7th/8th v pool 3
    const r16 = new Map(); // place of the seeded team (1-8) → winner of its tie
    [[1, 2], [3, 4], [5, 6], [7, 8]].forEach((seeds, k) => {
      const opp = shuffle2(playoffWinners[k]);
      seeds.forEach((s, j) => {
        stage[at(s)][2]++;
        stage[opp[j]][2]++;
        r16.set(s, play(at(s), opp[j]));
      });
    });
    const qf = [
      [r16.get(1), r16.get(8)],
      [r16.get(4), r16.get(5)],
      [r16.get(2), r16.get(7)],
      [r16.get(3), r16.get(6)],
    ].map(([x, y]) => {
      stage[x][3]++;
      stage[y][3]++;
      return play(x, y);
    });
    const sf = [
      [qf[0], qf[1]],
      [qf[2], qf[3]],
    ].map(([x, y]) => {
      stage[x][4]++;
      stage[y][4]++;
      return play(x, y);
    });
    stage[sf[0]][5]++;
    stage[sf[1]][5]++;
    const [x, y] = shuffle2(sf);
    stage[rand() < final(x, y) ? x : y][6]++;
  }
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const teams = {};
  ids.forEach((id, i) => {
    teams[id] = {
      xpts: Math.round((ptsSum[i] / runs) * 10) / 10,
      pos: posCount[i].map((c) => r3(c / runs)),
      stage: stage[i].map((c) => r3(c / runs)),
    };
  });
  return { remaining: left.length, teams };
}
