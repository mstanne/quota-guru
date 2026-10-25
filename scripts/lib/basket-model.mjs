// NBA prediction model: team offensive / defensive ratings in points (Gaussian points model).
//
//   points(home) = μ + h + off_home − def_away − r · b2b_home + r · b2b_away / 2 ...   (see `expected`)
//   points(away) = μ     + off_away − def_home ...
//
//   μ        league scoring level (moves with the season: weighted towards recent games)
//   h        home-court advantage in points
//   off/def  team ratings (points above/below average scored / prevented)
//   r        back-to-back penalty: a team playing the second night in a row scores r/2 less and allows r/2 more
//
// Fitted by weighted, penalised least squares (ridge priors shrink every team towards average), with
// exponential recency weights. A new season starts from last season's ratings, shrunk by the time decay.
// Margin and total are then Normal with standard deviations estimated from the residuals, which gives win
// probability, expected score, point spread and over/under probabilities.
//
// Pure functions, no I/O: used by scripts/predict-basket.mjs (and its --backtest mode).

export const DEFAULTS = {
  halfLifeDays: 90, // weight of a game halves every 90 days (tuned on a 2018-2024 walk-forward backtest)
  teamSigma: 6, // prior sd of off/def ratings (points)
  homeMean: 2.5,
  homeSigma: 1.5,
  iterations: 40,
  minGames: 8, // below this many weighted games for a team the prediction is not published
};

const DAY = 86400000;

/**
 * @typedef {{ id: number|string, date: string, home: number, away: number, hp: number, ap: number }} Game
 */

/** Days since the previous game of each team, for every game in `schedule` (finished + upcoming). */
export function backToBack(schedule) {
  const last = new Map();
  const out = new Map();
  for (const g of [...schedule].sort((a, b) => a.date.localeCompare(b.date))) {
    const d = Date.parse(g.date);
    const b2b = (t) => (last.has(t) && d - last.get(t) <= 1.6 * DAY ? 1 : 0);
    out.set(g.id, [b2b(g.home), b2b(g.away)]);
    last.set(g.home, d);
    last.set(g.away, d);
  }
  return out;
}

/**
 * @param {Game[]} games finished games
 * @param {{ asOf?: string, b2b?: Map<any, [number, number]>, options?: Partial<typeof DEFAULTS> }} [cfg]
 */
export function fitModel(games, cfg = {}) {
  const o = { ...DEFAULTS, ...(cfg.options || {}) };
  const asOf = cfg.asOf ? Date.parse(cfg.asOf) : Date.now();
  const lambda = Math.LN2 / o.halfLifeDays;
  const rows = [];
  for (const g of games) {
    const t = Date.parse(g.date);
    if (!(t < asOf) || !Number.isFinite(g.hp) || !Number.isFinite(g.ap)) continue;
    const w = Math.exp((-lambda * (asOf - t)) / DAY);
    if (w < 1e-3) continue;
    const [bh, ba] = cfg.b2b?.get(g.id) ?? [0, 0];
    rows.push({ w, home: g.home, away: g.away, hp: g.hp, ap: g.ap, bh, ba });
  }
  const teams = new Set(rows.flatMap((r) => [r.home, r.away]));
  const off = new Map([...teams].map((t) => [t, 0]));
  const def = new Map([...teams].map((t) => [t, 0]));
  const W = rows.reduce((s, r) => s + r.w, 0) || 1;
  let mu = rows.reduce((s, r) => s + r.w * (r.hp + r.ap), 0) / (2 * W) || 112;
  let h = o.homeMean;
  let r2b = 0;

  // observations: one per team per game (points scored)
  const obs = [];
  for (const r of rows) {
    obs.push({ w: r.w, att: r.home, opp: r.away, home: 1, b: (r.bh - r.ba) / 2, y: r.hp });
    obs.push({ w: r.w, att: r.away, opp: r.home, home: 0, b: (r.ba - r.bh) / 2, y: r.ap });
  }
  const pred = (x) => mu + h * x.home + off.get(x.att) - def.get(x.opp) - r2b * x.b;
  const varPrior = (sd) => 1 / (sd * sd);
  // residual variance of a single team's points, used to weigh the priors (≈ 12²)
  const s2 = 144;

  for (let it = 0; it < o.iterations; it++) {
    // μ (flat prior)
    let num = 0;
    for (const x of obs) num += x.w * (x.y - pred(x) + mu);
    mu = num / (2 * W);
    // home advantage
    num = o.homeMean * varPrior(o.homeSigma) * s2;
    let den = varPrior(o.homeSigma) * s2;
    for (const x of obs) if (x.home) (num += x.w * (x.y - pred(x) + h)), (den += x.w);
    h = num / den;
    // back-to-back penalty (prior 0 ± 3)
    num = 0;
    den = varPrior(3) * s2;
    for (const x of obs) if (x.b) (num += -x.w * x.b * (x.y - pred(x) - r2b * x.b)), (den += x.w * x.b * x.b);
    r2b = num / den;
    // offence, then defence (Gauss-Seidel)
    for (const [map, key, sign] of [
      [off, "att", 1],
      [def, "opp", -1],
    ]) {
      const n = new Map();
      const d = new Map();
      for (const x of obs) {
        const t = x[key];
        n.set(t, (n.get(t) || 0) + x.w * sign * (x.y - pred(x) + sign * map.get(t)));
        d.set(t, (d.get(t) || 0) + x.w);
      }
      for (const t of teams) map.set(t, (n.get(t) || 0) / ((d.get(t) || 0) + varPrior(o.teamSigma) * s2));
      // centre ratings (identifiability: μ carries the average)
      const avg = [...map.values()].reduce((a, b) => a + b, 0) / (map.size || 1);
      for (const t of teams) map.set(t, map.get(t) - avg);
    }
  }

  // residual sd of margin and total (weighted)
  let sm = 0;
  let st = 0;
  let sw = 0;
  for (let i = 0; i < obs.length; i += 2) {
    const a = obs[i];
    const b = obs[i + 1];
    const em = pred(a) - pred(b);
    const et = pred(a) + pred(b);
    sm += a.w * (a.y - b.y - em) ** 2;
    st += a.w * (a.y + b.y - et) ** 2;
    sw += a.w;
  }
  const games_n = new Map();
  for (const x of obs) games_n.set(x.att, (games_n.get(x.att) || 0) + x.w);

  return {
    options: o,
    asOf: new Date(asOf).toISOString(),
    mu,
    home: h,
    b2b: r2b,
    off: Object.fromEntries(off),
    def: Object.fromEntries(def),
    games: Object.fromEntries(games_n),
    // a little extra spread for parameter uncertainty; floors avoid over-confidence with few games
    sdMargin: Math.max(11, Math.sqrt(sm / (sw || 1)) * 1.03),
    sdTotal: Math.max(16, Math.sqrt(st / (sw || 1)) * 1.03),
    n: rows.length,
  };
}

// Standard normal CDF (Zelen & Severo approximation, |error| < 7.5e-8)
export function phi(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/** Expected points of both teams. Unknown teams count as average. */
export function expected(model, f) {
  const off = (t) => model.off[t] ?? 0;
  const def = (t) => model.def[t] ?? 0;
  const [bh, ba] = f.b2b ?? [0, 0];
  const b = (bh - ba) / 2;
  const h = f.neutral ? 0 : model.home;
  return {
    home: model.mu + h + off(f.home) - def(f.away) - model.b2b * b,
    away: model.mu + off(f.away) - def(f.home) + model.b2b * b,
  };
}

const r3 = (x) => Math.round(x * 1000) / 1000;
const half = (x) => Math.floor(x) + 0.5;

/** Prediction for one game: win probability, expected score, margins and totals. Null with too little data. */
export function predict(model, f) {
  const gh = model.games[f.home] ?? 0;
  const ga = model.games[f.away] ?? 0;
  if (Math.min(gh, ga) < model.options.minGames) return null;
  const e = expected(model, f);
  const m = e.home - e.away;
  const t = e.home + e.away;
  const pHome = phi(m / model.sdMargin);
  // point spread from the favourite's side: P(favourite wins by more than `line`), lines around the
  // expected margin (only positive lines)
  const fav = m >= 0 ? 0 : 1;
  const am = Math.abs(m);
  const spread = [-1, 0, 1]
    .map((k) => half(am) + k * 4)
    .filter((line) => line > 0)
    .map((line) => [line, r3(phi((am - line) / model.sdMargin))]);
  const totals = [-1, 0, 1].map((k) => {
    const line = half(t) + k * 6;
    return [line, r3(1 - phi((line - t) / model.sdTotal))]; // P(total > line)
  });
  const minGames = Math.min(gh, ga);
  return {
    p: [r3(pHome), r3(1 - pHome)],
    pts: [Math.round(e.home * 10) / 10, Math.round(e.away * 10) / 10],
    margin: Math.round(m * 10) / 10,
    total: Math.round(t * 10) / 10,
    fav,
    spread,
    totals,
    // win by 10+ points
    big: [r3(1 - phi((10 - m) / model.sdMargin)), r3(phi((-10 - m) / model.sdMargin))],
    b2b: f.b2b ?? [0, 0],
    confidence: minGames >= 30 ? "alta" : minGames >= 15 ? "media" : "bassa",
  };
}
