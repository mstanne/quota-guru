// Football prediction model: bivariate Poisson with Dixon-Coles low-score correction.
//
//   log λ_home = μ_c + h_c + att_home + q_league(home) − def_away − q_league(away)
//   log λ_away = μ_c       + att_away + q_league(away) − def_home − q_league(home)
//
//   μ_c   base scoring rate of competition c (Serie A, Champions League, ...)
//   h_c   home advantage of competition c
//   att/def  team attack and defence strength (higher def = concedes less)
//   q_L   strength of a domestic league; it cancels out in domestic games and is learnt only from
//         cross-league games (Champions League), so Serie A teams can be compared with Premier League teams.
//
// Fitting: penalised maximum likelihood (Gaussian priors = ridge shrinkage towards the average team),
// matches weighted by recency (exponential decay), solved with block Newton steps.
// Then a single Dixon-Coles ρ is estimated on the weighted results to fix the 0-0 / 1-0 / 0-1 / 1-1 cells.
//
// Pure functions, no I/O: used by scripts/predict-football.mjs (and its --backtest mode).

export const DEFAULTS = {
  halfLifeDays: 365, // weight of a match halves every year (tuned on 2022-2026 backtest)
  teamSigma: 0.4, // prior sd of attack/defence ratings (log scale)
  leagueSigma: 0.25, // prior sd of league strength
  homeMean: 0.2, // prior mean of home advantage (≈ +22% goals at home)
  homeSigma: 0.1,
  newTeamPrior: -0.1, // prior mean of att and def for teams new to their league (promoted sides)
  compSigma: 0.1, // prior sd of a competition's scoring rate around the overall average
  otherLeague: -0.05, // prior strength of teams whose domestic league is not in the data (e.g. Club Brugge in CL):
  // their league is weaker, but they are its best teams, so the two effects nearly cancel
  cupSigma: 0.05, // cups have few games: their scoring rate stays close to the overall average
  iterations: 80,
  maxGoals: 10,
};

const DAY = 86400000;
/** Below this many (weighted) games for one of the teams, `predict` returns null: too little data. */
export const MIN_GAMES = 3;

/**
 * @typedef {{ date: string, comp: string, home: number, away: number, hg: number, ag: number, neutral?: boolean }} Result
 * @typedef {{ comp: string, home: number, away: number, neutral?: boolean }} Fixture
 */

/**
 * Fits the model.
 * @param {Result[]} results finished matches (any competitions)
 * @param {{ asOf?: string, cups?: string[], leaguePriors?: Record<string, number>, options?: Partial<typeof DEFAULTS> }} [cfg]
 *   asOf: only matches before this date are used and weights are computed from it
 *   cups: competition codes that are not domestic leagues (e.g. ["CL"])
 *   leaguePriors: prior strength of each domestic league (log scale); learnt from cross-league games
 */
export function fitModel(results, cfg = {}) {
  const o = { ...DEFAULTS, ...(cfg.options || {}) };
  const asOf = cfg.asOf ? Date.parse(cfg.asOf) : Date.now();
  const cups = new Set(cfg.cups || []);
  const games = results.filter(
    (r) => Number.isFinite(r.hg) && Number.isFinite(r.ag) && Date.parse(r.date) < asOf && r.home !== r.away,
  );

  // Domestic league of each team = the non-cup competition where it played most (weighted) games.
  const leagueCount = new Map();
  for (const g of games) {
    if (cups.has(g.comp)) continue;
    for (const t of [g.home, g.away]) {
      const m = leagueCount.get(t) || new Map();
      m.set(g.comp, (m.get(g.comp) || 0) + 1);
      leagueCount.set(t, m);
    }
  }
  const teamLeague = new Map();
  for (const [t, m] of leagueCount) teamLeague.set(t, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  // teams seen only in cups belong to a pseudo-league "OTHER" (leagues we do not follow)
  for (const g of games) for (const t of [g.home, g.away]) if (!teamLeague.has(t)) teamLeague.set(t, "OTHER");
  const leaguePrior = (l) => (l === "OTHER" ? o.otherLeague : (cfg.leaguePriors?.[l] ?? 0));

  // Teams new to their league in the most recent season (first league game in the last ~120 days, and the
  // league itself has older games) get a slightly negative prior: promoted sides are usually weaker.
  const firstLeagueGame = new Map();
  const leagueFirst = new Map();
  for (const g of games) {
    if (cups.has(g.comp)) continue;
    const d = Date.parse(g.date);
    leagueFirst.set(g.comp, Math.min(leagueFirst.get(g.comp) ?? Infinity, d));
    for (const t of [g.home, g.away]) {
      if (teamLeague.get(t) !== g.comp) continue;
      firstLeagueGame.set(t, Math.min(firstLeagueGame.get(t) ?? Infinity, d));
    }
  }
  const prior = new Map();
  for (const [t, d] of firstLeagueGame) {
    const lf = leagueFirst.get(teamLeague.get(t));
    const isNew = asOf - d < 120 * DAY && d - lf > 200 * DAY;
    prior.set(t, isNew ? o.newTeamPrior : 0);
  }

  // Observations: one per team per game.
  const lambda = Math.LN2 / o.halfLifeDays;
  /** @type {{ y:number, w:number, comp:string, att:number, def:number, home:boolean, lA?:string, lD?:string }[]} */
  const obs = [];
  for (const g of games) {
    const w = Math.exp((-lambda * (asOf - Date.parse(g.date))) / DAY);
    if (w < 1e-4) continue;
    const lh = teamLeague.get(g.home);
    const la = teamLeague.get(g.away);
    // league strength is learnt only from cup games between leagues: in domestic games a promoted or
    // relegated side would otherwise link two leagues with a team that changed level
    const cross = cups.has(g.comp) && lh && la && lh !== la;
    obs.push({ y: g.hg, w, comp: g.comp, att: g.home, def: g.away, home: !g.neutral, lA: cross ? lh : undefined, lD: cross ? la : undefined });
    obs.push({ y: g.ag, w, comp: g.comp, att: g.away, def: g.home, home: false, lA: cross ? la : undefined, lD: cross ? lh : undefined });
  }

  const teams = new Set();
  const comps = new Set();
  const leagues = new Set();
  for (const r of obs) {
    teams.add(r.att);
    comps.add(r.comp);
    if (r.lA) leagues.add(r.lA), leagues.add(r.lD);
  }
  // overall scoring rate, used as the prior of every competition's rate

  // Parameters
  const meanGoals = obs.reduce((s, r) => s + r.w * r.y, 0) / Math.max(1e-9, obs.reduce((s, r) => s + r.w, 0));
  const muPrior = Math.log(Math.max(0.3, meanGoals));
  const mu = new Map([...comps].map((c) => [c, muPrior]));
  const home = new Map([...comps].map((c) => [c, o.homeMean]));
  const att = new Map([...teams].map((t) => [t, prior.get(t) ?? 0]));
  const def = new Map([...teams].map((t) => [t, prior.get(t) ?? 0]));
  const q = new Map([...leagues].map((l) => [l, leaguePrior(l)]));

  const eta = (r) =>
    mu.get(r.comp) +
    (r.home ? home.get(r.comp) : 0) +
    att.get(r.att) -
    def.get(r.def) +
    (r.lA ? q.get(r.lA) - q.get(r.lD) : 0);

  // One Newton step for a block of parameters. `terms(r)` lists [key, sign] pairs the observation touches.
  function step(params, terms, priorMean, priorSd) {
    const g = new Map();
    const h = new Map();
    for (const r of obs) {
      const ts = terms(r);
      if (!ts.length) continue;
      const lam = Math.exp(eta(r));
      for (const [k, s] of ts) {
        g.set(k, (g.get(k) || 0) + r.w * s * (r.y - lam));
        h.set(k, (h.get(k) || 0) + r.w * lam);
      }
    }
    for (const [k, v] of params) {
      const pm = priorMean(k);
      const sd = typeof priorSd === "function" ? priorSd(k) : priorSd;
      const prec = 1 / (sd * sd);
      const grad = (g.get(k) || 0) - prec * (v - pm);
      const hess = (h.get(k) || 0) + prec;
      params.set(k, v + Math.max(-1, Math.min(1, grad / hess)));
    }
  }

  for (let it = 0; it < o.iterations; it++) {
    step(mu, (r) => [[r.comp, 1]], () => muPrior, (c) => (cups.has(c) ? o.cupSigma : o.compSigma));
    step(home, (r) => (r.home ? [[r.comp, 1]] : []), () => o.homeMean, o.homeSigma);
    step(att, (r) => [[r.att, 1]], (t) => prior.get(t) ?? 0, o.teamSigma);
    step(def, (r) => [[r.def, -1]], (t) => prior.get(t) ?? 0, o.teamSigma);
    if (q.size) step(q, (r) => (r.lA ? [[r.lA, 1], [r.lD, -1]] : []), leaguePrior, o.leagueSigma);
  }

  // Effective number of (weighted) games per team, used as a confidence measure.
  const games_n = new Map();
  for (const r of obs) games_n.set(r.att, (games_n.get(r.att) || 0) + r.w);

  // Dixon-Coles ρ by grid search on the weighted low-score log-likelihood.
  let rho = 0;
  {
    const pairs = [];
    for (let i = 0; i < obs.length; i += 2) {
      const a = obs[i];
      const b = obs[i + 1];
      if (a.y <= 1 && b.y <= 1) pairs.push({ x: a.y, y: b.y, l: Math.exp(eta(a)), m: Math.exp(eta(b)), w: a.w });
    }
    let best = -Infinity;
    for (let r = -0.2; r <= 0.2001; r += 0.01) {
      let ll = 0;
      for (const p of pairs) {
        const t = tau(p.x, p.y, p.l, p.m, r);
        ll += t > 0 ? p.w * Math.log(t) : -1e9;
      }
      if (ll > best) (best = ll), (rho = Math.round(r * 100) / 100);
    }
  }

  return {
    options: o,
    asOf: new Date(asOf).toISOString(),
    mu: Object.fromEntries(mu),
    home: Object.fromEntries(home),
    att: Object.fromEntries(att),
    def: Object.fromEntries(def),
    league: Object.fromEntries([...new Set([...q.keys(), ...teamLeague.values()])].map((l) => [l, q.get(l) ?? leaguePrior(l)])),
    teamLeague: Object.fromEntries(teamLeague),
    games: Object.fromEntries(games_n),
    rho,
    nResults: games.length,
  };
}

function tau(x, y, l, m, rho) {
  if (x === 0 && y === 0) return 1 - l * m * rho;
  if (x === 0 && y === 1) return 1 + l * rho;
  if (x === 1 && y === 0) return 1 + m * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}
function poissonPmf(lam, max) {
  const p = new Array(max + 1);
  p[0] = Math.exp(-lam);
  for (let k = 1; k <= max; k++) p[k] = (p[k - 1] * lam) / k;
  return p;
}

/** Expected goals for a fixture. Unknown teams count as average for the competition. */
export function expectedGoals(model, f) {
  const mus = Object.values(model.mu);
  const mu = model.mu[f.comp] ?? (mus.length ? mus.reduce((a, b) => a + b, 0) / mus.length : Math.log(1.35));
  const h = f.neutral ? 0 : (model.home[f.comp] ?? model.options.homeMean);
  const a = (t) => model.att[t] ?? 0;
  const d = (t) => model.def[t] ?? 0;
  const lh = model.teamLeague[f.home];
  const la = model.teamLeague[f.away];
  const ql = lh && la && lh !== la ? (model.league[lh] ?? 0) - (model.league[la] ?? 0) : 0;
  return {
    home: Math.exp(mu + h + a(f.home) - d(f.away) + ql),
    away: Math.exp(mu + a(f.away) - d(f.home) - ql),
  };
}

/** Full score matrix P[h][a] (Dixon-Coles corrected, normalised). */
export function scoreMatrix(lh, la, rho, max = DEFAULTS.maxGoals) {
  const ph = poissonPmf(lh, max);
  const pa = poissonPmf(la, max);
  const m = [];
  let total = 0;
  for (let i = 0; i <= max; i++) {
    m.push([]);
    for (let j = 0; j <= max; j++) {
      const v = Math.max(0, ph[i] * pa[j] * tau(i, j, lh, la, rho));
      m[i].push(v);
      total += v;
    }
  }
  for (const row of m) for (let j = 0; j < row.length; j++) row[j] /= total;
  return m;
}

const r3 = (x) => Math.round(x * 1000) / 1000;

/**
 * Prediction for one fixture: 1X2, double chance, over/under, both teams to score, likely scores.
 * Probabilities are rounded to 3 decimals. Returns null when a team has too little data (see MIN_GAMES).
 */
export function predict(model, f) {
  const xg = expectedGoals(model, f);
  const m = scoreMatrix(xg.home, xg.away, model.rho, model.options.maxGoals);
  let p1 = 0, pX = 0, p2 = 0, btts = 0;
  const over = { "1.5": 0, "2.5": 0, "3.5": 0 };
  // combo markets: [outcome 1/X/2][0 = Under 2.5 / No goal, 1 = Over 2.5 / Goal]
  const ou = [[0, 0], [0, 0], [0, 0]];
  const gg = [[0, 0], [0, 0], [0, 0]];
  const scores = [];
  for (let i = 0; i < m.length; i++) {
    for (let j = 0; j < m[i].length; j++) {
      const v = m[i][j];
      if (i > j) p1 += v;
      else if (i === j) pX += v;
      else p2 += v;
      if (i > 0 && j > 0) btts += v;
      const o = i > j ? 0 : i === j ? 1 : 2;
      ou[o][i + j > 2.5 ? 1 : 0] += v;
      gg[o][i > 0 && j > 0 ? 1 : 0] += v;
      for (const k of Object.keys(over)) if (i + j > Number(k)) over[k] += v;
      scores.push([i, j, v]);
    }
  }
  scores.sort((a, b) => b[2] - a[2]);

  const n = [model.games[f.home] ?? 0, model.games[f.away] ?? 0];
  const minGames = Math.min(...n);
  // effective (recency-weighted) games of the team with less data
  const confidence = minGames >= 15 ? "alta" : minGames >= 6 ? "media" : minGames >= MIN_GAMES ? "bassa" : null;

  const probs = { "1": p1, X: pX, "2": p2 };
  const top = Object.entries(probs).sort((a, b) => b[1] - a[1])[0];
  let pick = top[0];
  if (top[1] < 0.45) {
    const dc = { "1X": p1 + pX, X2: pX + p2 };
    pick = dc["1X"] >= dc["X2"] ? "1X" : "X2";
  }

  if (!confidence) return null;
  return {
    xg: [Math.round(xg.home * 100) / 100, Math.round(xg.away * 100) / 100],
    p: [r3(p1), r3(pX), r3(p2)],
    dc: [r3(p1 + pX), r3(p1 + p2), r3(pX + p2)],
    over: Object.fromEntries(Object.entries(over).map(([k, v]) => [k, r3(v)])),
    btts: r3(btts),
    combo: { ou: ou.map((r) => r.map(r3)), gg: gg.map((r) => r.map(r3)) },
    scores: scores.slice(0, 5).map(([h, a, v]) => [h, a, r3(v)]),
    pick,
    confidence,
    games: n.map((x) => Math.round(x * 10) / 10),
  };
}
