// Check of the bet-slip probability ("schedina"): is the product of the model's probabilities a faithful estimate of
// how often a multiple bet comes true? Not part of the build; run it by hand when the model changes.
//
//   node scripts/backtest-slip.mjs                 walk-forward on data/football-history.json (+ the snapshot)
//   node scripts/backtest-slip.mjs --json out.json also write the tables
//   PUBLISHED_DIR=<folder> node scripts/backtest-slip.mjs
//       also the predictions really published by the site (the `archivio-pronostici` branch, calcio/*.json)
//
// Method
//  1. Walk-forward: every past match gets the prediction the model would have published the day before (refit once a
//     week on the results up to that day, as `predict-football.mjs --backtest`), with every market the slip offers:
//     1X2, double chance, Under/Over 2.5, Goal/No goal, combos.
//  2. Random slips of 1–8 picks, from different matches of the same week (as a reader builds one: one pick per
//     match), in two ways: "favoriti" = the most likely 1X2 outcome of each match; "esiti vari" = a random outcome of
//     a random market.
//  3. Slips grouped by estimated probability: if the estimate is right, slips estimated at ~10% come true ~10% of
//     the time. Also by number of picks (mean estimate vs share that came true).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fitModel, predict } from "./lib/poisson-model.mjs";
import { FIT } from "./lib/football-fit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLIPS_PER_WEEK = Number(process.env.SLIPS_PER_WEEK ?? 300);
const MAX_LEGS = 8;

// deterministic random numbers (same result at every run)
let seed = 20261105;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pickOne = (a) => a[Math.floor(rand() * a.length)];

// ---------- data ----------
const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const history = readJson(path.join(root, "data", "football-history.json"), { results: [] });
const snapshot = readJson(path.join(root, "src", "data", "football.json"), { competitions: [] });
const byId = new Map();
for (const r of history.results ?? []) byId.set(r.id, r);
for (const c of snapshot.competitions)
  for (const m of c.matches) {
    const ft = m.score?.regularTime?.home != null ? m.score.regularTime : m.score?.fullTime; // 90 minutes
    if (!["FINISHED", "AWARDED"].includes(m.status) || ft?.home == null) continue;
    if (!byId.has(m.id))
      byId.set(m.id, { id: m.id, date: m.utcDate, comp: c.code, home: m.homeTeam.id, away: m.awayTeam.id, hg: ft.home, ag: ft.away });
  }
const results = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));

/** Every pick the slip offers for a match, with its estimated probability and whether it came true. */
function outcomes(p, hg, ag) {
  const o = hg > ag ? 0 : hg === ag ? 1 : 2;
  const over = hg + ag > 2.5;
  const gg = hg > 0 && ag > 0;
  const list = [
    ["1", p.p[0], o === 0], ["X", p.p[1], o === 1], ["2", p.p[2], o === 2],
    ["1X", p.dc[0], o !== 2], ["12", p.dc[1], o !== 1], ["X2", p.dc[2], o !== 0],
    ["Over 2,5", p.over["2.5"], over], ["Under 2,5", 1 - p.over["2.5"], !over],
    ["Goal", p.btts, gg], ["No goal", 1 - p.btts, !gg],
  ];
  const OUT = ["1", "X", "2"];
  for (let i = 0; i < 3; i++) {
    list.push([`${OUT[i]}+Under`, p.combo.ou[i][0], o === i && !over], [`${OUT[i]}+Over`, p.combo.ou[i][1], o === i && over]);
    list.push([`${OUT[i]}+NoGoal`, p.combo.gg[i][0], o === i && !gg], [`${OUT[i]}+Goal`, p.combo.gg[i][1], o === i && gg]);
  }
  return { list, favourite: list[[0, 1, 2].reduce((a, b) => (p.p[b] > p.p[a] ? b : a), 0)] };
}

// ---------- 1. walk-forward predictions ----------
const minDate = Date.parse(results[0]?.date ?? 0) + 60 * 86400000; // two months of history first, as the backtest
const weekOf = (iso) => {
  const d = new Date(iso);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return `${d.getUTCFullYear()}-${String(Math.floor((d - start) / (7 * 86400000))).padStart(2, "0")}`;
};
const games = [];
let cache = { key: "", m: null };
const t0 = Date.now();
for (const r of results) {
  if (Date.parse(r.date) < minDate) continue;
  const key = weekOf(r.date);
  if (cache.key !== key) cache = { key, m: fitModel(results, { ...FIT, asOf: r.date.slice(0, 10) + "T00:00:00Z" }) };
  const p = predict(cache.m, { comp: r.comp, home: r.home, away: r.away });
  if (!p) continue;
  games.push({ week: key, ...outcomes(p, r.hg, r.ag) });
}
console.log(`Previsioni walk-forward: ${games.length} partite in ${new Set(games.map((g) => g.week)).size} settimane (${((Date.now() - t0) / 1000).toFixed(0)} s)`);

// ---------- 2–3. random slips and calibration ----------
const BINS = [0, 0.01, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 1.0001];
const binLabel = (i) => `${(BINS[i] * 100).toFixed(0)}–${Math.min(100, BINS[i + 1] * 100).toFixed(0)}%`;
// Wilson 95% interval of an observed share
const wilson = (k, n) => {
  if (!n) return [0, 0];
  const z = 1.96, ph = k / n, d = 1 + (z * z) / n;
  const c = (ph + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((ph * (1 - ph)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
};

function simulate(legPick) {
  const bins = BINS.slice(0, -1).map(() => ({ n: 0, est: 0, hit: 0 }));
  const byLegs = Array.from({ length: MAX_LEGS + 1 }, () => ({ n: 0, est: 0, hit: 0 }));
  const weeks = new Map();
  for (const g of games) weeks.set(g.week, [...(weeks.get(g.week) ?? []), g]);
  for (const list of weeks.values()) {
    if (list.length < MAX_LEGS) continue;
    for (let s = 0; s < SLIPS_PER_WEEK; s++) {
      const k = 1 + Math.floor(rand() * MAX_LEGS);
      // k different matches of the week
      const chosen = new Set();
      while (chosen.size < k) chosen.add(Math.floor(rand() * list.length));
      let est = 1, hit = true;
      for (const i of chosen) {
        const [, p, ok] = legPick(list[i]);
        est *= p;
        hit &&= ok;
      }
      const b = bins[BINS.findIndex((x, j) => est >= x && est < BINS[j + 1])];
      for (const t of [b, byLegs[k]]) (t.n++, (t.est += est), (t.hit += hit ? 1 : 0));
    }
  }
  return {
    bins: bins.map((b, i) => ({ range: binLabel(i), ...summary(b) })).filter((b) => b.n),
    legs: byLegs.map((b, k) => ({ legs: k, ...summary(b) })).filter((b) => b.n),
  };
}
const summary = ({ n, est, hit }) => {
  const [lo, hi] = wilson(hit, n);
  return { n, estimated: est / n, observed: hit / n, ci: [lo, hi] };
};

const pct = (x) => `${(x * 100).toFixed(x < 0.1 ? 2 : 1)}%`.padStart(7);
function print(title, r) {
  console.log(`\n${title}`);
  console.log("  probabilità stimata    schedine   media stimata   uscite davvero   (intervallo 95%)");
  for (const b of r.bins)
    console.log(`  ${b.range.padEnd(20)} ${String(b.n).padStart(9)}   ${pct(b.estimated)}         ${pct(b.observed)}       ${pct(b.ci[0])} – ${pct(b.ci[1]).trim()}`);
  console.log("  esiti   schedine   media stimata   uscite davvero   rapporto");
  for (const b of r.legs)
    console.log(`  ${String(b.legs).padStart(5)} ${String(b.n).padStart(10)}   ${pct(b.estimated)}         ${pct(b.observed)}        ${(b.observed / b.estimated).toFixed(2)}`);
}

const favourites = simulate((g) => g.favourite);
const mixed = simulate((g) => pickOne(g.list));
print("Schedine di favoriti (esito 1X2 più probabile di ogni partita)", favourites);
print("Schedine di esiti vari (mercato ed esito a caso)", mixed);

// ---------- predictions really published by the site ----------
let published = null;
if (process.env.PUBLISHED_DIR) {
  const entries = fs
    .readdirSync(process.env.PUBLISHED_DIR)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => Object.values(readJson(path.join(process.env.PUBLISHED_DIR, f), {})))
    .filter((e) => e.result && e.prediction?.p);
  // every pair and triple of 1X2 favourites of different matches: small sample, indicative only
  const legs = entries.map((e) => {
    const i = [0, 1, 2].reduce((a, b) => (e.prediction.p[b] > e.prediction.p[a] ? b : a), 0);
    return [e.prediction.p[i], e.result.index === i];
  });
  const agg = (k) => {
    let n = 0, est = 0, hit = 0;
    const rec = (start, depth, p, ok) => {
      if (depth === k) return (n++, (est += p), (hit += ok ? 1 : 0));
      for (let i = start; i < legs.length; i++) rec(i + 1, depth + 1, p * legs[i][0], ok && legs[i][1]);
    };
    rec(0, 0, 1, true);
    return { legs: k, ...summary({ n, est, hit }) };
  };
  published = { matches: legs.length, byLegs: [1, 2, 3].map(agg) };
  console.log(`\nPronostici pubblicati dal sito (${legs.length} partite concluse; tutte le combinazioni di favoriti)`);
  for (const b of published.byLegs)
    console.log(`  ${b.legs} esiti: ${b.n} combinazioni, stimata ${pct(b.estimated).trim()}, uscite ${pct(b.observed).trim()}`);
}

const out = process.argv.indexOf("--json");
if (out > 0)
  fs.writeFileSync(process.argv[out + 1], JSON.stringify({ games: games.length, favourites, mixed, published }, null, 1));
