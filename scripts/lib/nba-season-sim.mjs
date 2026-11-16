// NBA season projection: standings of the regular season and Monte Carlo simulation of the rest of the season, of the
// play-in and of the playoffs, with the same points model as the game predictions (scripts/lib/basket-model.mjs).
//
// Start: the current record of each team (regular-season games already played). Games still to play: the remaining
// regular-season schedule (data/basket-history.json `schedule`, scripts/fetch-basket-data.mjs). Each simulated season:
//   1. every team gets a strength shock (Normal, RATING_SD points of margin): the ratings themselves are estimates, so
//      a team that is good on paper can still have a worse season than the model expects;
//   2. every remaining game is a coin with the model's home-win probability (expected margin / sdMargin), the shock
//      included;
//   3. conference seeds by wins (ties broken at random: the NBA head-to-head and division rules are not simulated);
//   4. play-in: 7-8 (winner is seed 7), 9-10, then loser of 7-8 against winner of 9-10 (winner is seed 8);
//   5. playoffs: best-of-seven series 1-8, 4-5, 3-6, 2-7, then the bracket; home court to the better seed (better
//      record in the Finals), games 2-2-1-1-1.
//
// Output per team: expected wins, share of seasons ending in each conference seed, and the share of seasons reaching
// each stage (play-in, playoffs, conference semifinals, conference finals, Finals, title).
// Pure functions, no I/O: used by scripts/predict-basket.mjs.
import { expected, phi } from "./basket-model.mjs";

/** Season length of the regular season. */
export const GAMES = 82;
/** Spread of the season-long strength shock of a team, points of margin. */
const RATING_SD = 2;

const EAST = new Set([
  "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets", "Chicago Bulls", "Cleveland Cavaliers",
  "Detroit Pistons", "Indiana Pacers", "Miami Heat", "Milwaukee Bucks", "New York Knicks", "Orlando Magic",
  "Philadelphia 76ers", "Toronto Raptors", "Washington Wizards",
]);
const WEST = new Set([
  "Dallas Mavericks", "Denver Nuggets", "Golden State Warriors", "Houston Rockets", "LA Clippers", "Los Angeles Clippers",
  "Los Angeles Lakers", "Memphis Grizzlies", "Minnesota Timberwolves", "New Orleans Pelicans", "Oklahoma City Thunder",
  "Phoenix Suns", "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Utah Jazz",
]);
/** "est" / "ovest" from the team's full name, null for an unknown team. */
export function conferenceOf(name) {
  return EAST.has(name) ? "est" : WEST.has(name) ? "ovest" : null;
}

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
/** Standard normal draw (Box-Muller). */
function gauss(rand) {
  const u = Math.max(1e-12, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/**
 * Regular-season standings from the games played.
 * @param {{ id: number, name: string, shortName: string, abbr: string }[]} teams the 30 teams
 * @param {{ date: string, home: number, away: number, hp: number, ap: number }[]} games regular-season games played
 */
export function standings(teams, games) {
  const rows = new Map(
    teams.map((t) => [
      t.id,
      { id: t.id, name: t.name, shortName: t.shortName, abbr: t.abbr, conf: conferenceOf(t.name), w: 0, l: 0, hw: 0, hl: 0, aw: 0, al: 0, cw: 0, cl: 0, pf: 0, pa: 0, seq: [] },
    ]),
  );
  for (const g of [...games].sort((a, b) => a.date.localeCompare(b.date))) {
    const h = rows.get(g.home);
    const a = rows.get(g.away);
    if (!h || !a) continue;
    const hw = g.hp > g.ap;
    h.pf += g.hp, h.pa += g.ap, a.pf += g.ap, a.pa += g.hp;
    if (hw) h.w++, h.hw++, a.l++, a.al++;
    else a.w++, a.aw++, h.l++, h.hl++;
    if (h.conf && h.conf === a.conf) {
      if (hw) h.cw++, a.cl++;
      else a.cw++, h.cl++;
    }
    h.seq.push(hw ? 1 : 0);
    a.seq.push(hw ? 0 : 1);
  }
  const out = {};
  for (const r of rows.values()) {
    const last = r.seq.slice(-10);
    let streak = 0;
    for (let i = r.seq.length - 1; i >= 0 && r.seq[i] === r.seq[r.seq.length - 1]; i--) streak++;
    const { seq, ...rest } = r;
    out[r.id] = {
      ...rest,
      last10: [last.filter((x) => x).length, last.filter((x) => !x).length],
      // "V3" = three wins in a row, "P2" = two defeats
      streak: seq.length ? `${seq[seq.length - 1] ? "V" : "P"}${streak}` : null,
    };
  }
  return out;
}

/**
 * Simulates the rest of the season. Null when a conference does not have 15 teams or a team would play more than 82
 * regular-season games (schedule and results not consistent).
 * @param {object} model fitted points model (fitModel)
 * @param {Record<number, { conf: string|null, w: number, l: number }>} table standings()
 * @param {{ home: number, away: number }[]} schedule regular-season games still to play
 * @param {{ runs?: number, seed?: number }} [opts]
 */
export function simulateNbaSeason(model, table, schedule, { runs = 10000, seed = 1 } = {}) {
  const ids = Object.keys(table).map(Number);
  const confs = { est: ids.filter((id) => table[id].conf === "est"), ovest: ids.filter((id) => table[id].conf === "ovest") };
  if (confs.est.length !== 15 || confs.ovest.length !== 15) return null;
  const index = new Map(ids.map((id, i) => [id, i]));
  const games = schedule.filter((g) => index.has(g.home) && index.has(g.away));
  const left = new Array(ids.length).fill(0);
  for (const g of games) left[index.get(g.home)]++, left[index.get(g.away)]++;
  for (const id of ids) if (table[id].w + table[id].l + left[index.get(id)] > GAMES) return null;

  const n = ids.length;
  const sd = model.sdMargin;
  // expected margin of a game on a team's court (no back-to-back: unknown this far ahead)
  const margin = (h, a, neutral = false) => {
    const e = expected(model, { home: ids[h], away: ids[a], neutral });
    return e.home - e.away;
  };
  const base = games.map((g) => {
    const h = index.get(g.home);
    const a = index.get(g.away);
    return [h, a, margin(h, a)];
  });
  const homeMargin = ids.map((_, h) => ids.map((__, a) => (h === a ? 0 : margin(h, a))));
  const rand = rng(seed);
  const shock = new Array(n);
  const wins = new Array(n);
  const winsSum = new Array(n).fill(0);
  const seedCount = ids.map(() => new Array(15).fill(0));
  // stages: 0 play-in or better (top 10), 1 playoffs, 2 conference semifinals, 3 conference finals, 4 Finals, 5 title
  const stage = ids.map(() => new Array(6).fill(0));
  const pHome = (h, a) => phi((homeMargin[h][a] + shock[h] - shock[a]) / sd);
  const game = (h, a) => (rand() < pHome(h, a) ? h : a);
  /** best of seven, `h` with home court (games 1, 2, 5, 7) */
  const series = (h, a) => {
    let wh = 0;
    let wa = 0;
    for (let k = 0; wh < 4 && wa < 4; k++) {
      const home = k === 0 || k === 1 || k === 4 || k === 6;
      const winner = home ? game(h, a) : game(a, h);
      if (winner === h) wh++;
      else wa++;
    }
    return wh === 4 ? h : a;
  };

  for (let run = 0; run < runs; run++) {
    for (let i = 0; i < n; i++) {
      shock[i] = gauss(rand) * RATING_SD;
      wins[i] = table[ids[i]].w;
    }
    for (const [h, a, m] of base) {
      if (rand() < phi((m + shock[h] - shock[a]) / sd)) wins[h]++;
      else wins[a]++;
    }
    const champions = [];
    for (const conf of ["est", "ovest"]) {
      const tie = new Map(confs[conf].map((id) => [index.get(id), rand()]));
      const order = confs[conf].map((id) => index.get(id)).sort((i, j) => wins[j] - wins[i] || tie.get(j) - tie.get(i));
      order.forEach((i, p) => seedCount[i][p]++);
      for (let p = 0; p < 10; p++) stage[order[p]][0]++;
      // play-in
      const w78 = game(order[6], order[7]);
      const l78 = w78 === order[6] ? order[7] : order[6];
      const w910 = game(order[8], order[9]);
      const seed8 = game(l78, w910);
      const seeds = [...order.slice(0, 6), w78, seed8];
      for (const i of seeds) stage[i][1]++;
      // bracket: (1-8 v 4-5) and (3-6 v 2-7)
      const r1 = [series(seeds[0], seeds[7]), series(seeds[3], seeds[4]), series(seeds[2], seeds[5]), series(seeds[1], seeds[6])];
      for (const i of r1) stage[i][2]++;
      const rank = (i) => seeds.indexOf(i);
      const pair = (x, y) => (rank(x) < rank(y) ? series(x, y) : series(y, x));
      const r2 = [pair(r1[0], r1[1]), pair(r1[2], r1[3])];
      for (const i of r2) stage[i][3]++;
      const champ = pair(r2[0], r2[1]);
      stage[champ][4]++;
      champions.push(champ);
    }
    const [e, w] = champions;
    const title = wins[e] > wins[w] || (wins[e] === wins[w] && rand() < 0.5) ? series(e, w) : series(w, e);
    stage[title][5]++;
    for (let i = 0; i < n; i++) winsSum[i] += wins[i];
  }
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const teams = {};
  ids.forEach((id, i) => {
    teams[id] = {
      xw: Math.round((winsSum[i] / runs) * 10) / 10,
      seed: seedCount[i].map((c) => r3(c / runs)),
      stage: stage[i].map((c) => r3(c / runs)),
    };
  });
  return { remaining: games.length, teams };
}
