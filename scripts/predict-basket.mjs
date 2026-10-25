// NBA predictions (points model, see scripts/lib/basket-model.mjs).
//
// Reads  src/data/basket.json                calendar/results shown on the site (BALLDONTLIE)
//        data/basket-history.json            results of the current and previous season
//                                            (scripts/fetch-basket-data.mjs; `npm run history:basket`)
// Writes src/data/basket-predictions.json    { generatedAt, model, track, predictions: { [gameId]: Prediction } }
//
// Upcoming games get a prediction from a fit on everything played so far; games already finished in the
// snapshot get the prediction the model would have made that morning (refit once per day), which feeds
// the "pronostico corretto" badge and the track record. Without history the file is written empty and
// the site simply shows no prediction.
//
// Usage: node scripts/predict-basket.mjs [--backtest]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backToBack, fitModel, predict } from "./lib/basket-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = path.join(root, "src", "data", "basket.json");
const HISTORY = process.env.BASKET_HISTORY || path.join(root, "data", "basket-history.json");
const OUT = path.join(root, "src", "data", "basket-predictions.json");

const snap = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
const history = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, "utf8")) : { games: [] };

const byId = new Map((history.games || []).map((g) => [g.id, g]));
const snapGames = snap.nba?.games ?? [];
for (const g of snapGames) {
  if (g.status !== "final" || g.score.home == null) continue;
  byId.set(g.id, { id: g.id, date: g.utcDate, home: g.home.id, away: g.away.id, hp: g.score.home, ap: g.score.away });
}
const results = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));
// back-to-backs need the full schedule, including games not played yet
const schedule = [...results];
for (const g of snapGames) if (!byId.has(g.id)) schedule.push({ id: g.id, date: g.utcDate, home: g.home.id, away: g.away.id });
const b2b = backToBack(schedule);

const asOf = snap.generatedAt;
const predictions = {};
const track = { n: 0, hits: 0, logLoss: 0, brier: 0 };
let model = null;

if (results.length) {
  model = fitModel(results, { asOf, b2b });
  for (const g of snapGames) {
    if (g.status !== "scheduled" && g.status !== "live") continue;
    const p = predict(model, { home: g.home.id, away: g.away.id, b2b: b2b.get(g.id) });
    if (p) predictions[g.id] = { ...p, pre: false };
  }
  const finals = snapGames.filter((g) => g.status === "final" && g.score.home != null);
  const days = [...new Set(finals.map((g) => g.utcDate.slice(0, 10)))].sort();
  for (const day of days) {
    const m = fitModel(results, { asOf: `${day}T00:00:00Z`, b2b });
    for (const g of finals.filter((x) => x.utcDate.startsWith(day))) {
      const p = predict(m, { home: g.home.id, away: g.away.id, b2b: b2b.get(g.id) });
      if (!p) continue;
      predictions[g.id] = { ...p, pre: true };
      const y = g.score.home > g.score.away ? 1 : 0;
      track.n++;
      if ((p.p[0] > 0.5) === !!y) track.hits++;
      track.logLoss += -Math.log(Math.max(1e-6, y ? p.p[0] : p.p[1]));
      track.brier += (p.p[0] - y) ** 2;
    }
  }
  if (track.n) {
    track.logLoss = Math.round((track.logLoss / track.n) * 1000) / 1000;
    track.brier = Math.round((track.brier / track.n) * 1000) / 1000;
  }
}

const r1 = (x) => Math.round(x * 10) / 10;
const out = {
  generatedAt: asOf,
  model: model
    ? { name: "Modello a punti (attacco/difesa)", games: model.n, home: r1(model.home), b2b: r1(model.b2b), sdMargin: r1(model.sdMargin) }
    : null,
  track,
  predictions,
};
const next = JSON.stringify(out) + "\n";
if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== next) fs.writeFileSync(OUT, next);
console.log(
  results.length
    ? `basket-predictions.json: ${Object.keys(predictions).length} partite (storico ${results.length}) · track ${track.hits}/${track.n}`
    : "basket-predictions.json: nessuno storico NBA (npm run history:basket), pronostici non disponibili",
);

if (process.argv.includes("--backtest") && results.length) {
  const start = Date.parse(results[0].date) + 120 * 86400000;
  const s = { n: 0, hit: 0, ll: 0, mae: 0 };
  let cache = { k: "", m: null };
  for (const g of results.filter((r) => Date.parse(r.date) >= start)) {
    const k = g.date.slice(0, 10);
    if (cache.k !== k) cache = { k, m: fitModel(results, { asOf: `${k}T00:00:00Z`, b2b }) };
    const p = predict(cache.m, { home: g.home, away: g.away, b2b: b2b.get(g.id) });
    if (!p) continue;
    const y = g.hp > g.ap ? 1 : 0;
    s.n++;
    s.hit += (p.p[0] > 0.5) === !!y;
    s.ll += -Math.log(y ? p.p[0] : p.p[1]);
    s.mae += Math.abs(g.hp - g.ap - p.margin);
  }
  console.log(
    `Backtest: n=${s.n} esatti=${((s.hit / s.n) * 100).toFixed(1)}% log-loss=${(s.ll / s.n).toFixed(3)} errore medio margine=${(s.mae / s.n).toFixed(1)} punti`,
  );
}
