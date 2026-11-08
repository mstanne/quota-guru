// Football predictions (Poisson / Dixon-Coles model, see scripts/lib/poisson-model.mjs).
//
// Reads  src/data/football.json            (current snapshot: fixtures, recent results)
//        data/football-history.json         (optional: all results of the current and previous season,
//                                            written by scripts/fetch-football.mjs)
// Writes src/data/football-predictions.json  { generatedAt, model, track, predictions: { [matchId]: Prediction } }
//
// Predictions are made for every upcoming match AND, "before kick-off", for the finished matches in the
// snapshot (the model is refitted with only the results played before that day), so match pages can show
// what the model expected and the site can publish an honest track record.
//
// Usage:
//   node scripts/predict-football.mjs              # write predictions
//   node scripts/predict-football.mjs --backtest   # also print a walk-forward backtest on the history
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fitModel, predict } from "./lib/poisson-model.mjs";
import { CUPS, FIT, XG_WEIGHT } from "./lib/football-fit.mjs";
import { NATIONAL_CODES, NATIONAL_FIT } from "./lib/national-fit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = path.join(root, "src", "data", "football.json");
const HISTORY = path.join(root, "data", "football-history.json");
const OUT = path.join(root, "src", "data", "football-predictions.json");
const PLAYED = new Set(["FINISHED", "AWARDED"]);
const OPEN = new Set(["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "POSTPONED"]);

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
const history = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, "utf8")) : { results: [] };

// ---- results: history + snapshot, de-duplicated by match id ----
const byId = new Map();
for (const r of history.results || []) byId.set(r.id, r);
for (const c of snapshot.competitions) {
  for (const m of c.matches) {
    const ft = m.score?.fullTime;
    if (!PLAYED.has(m.status) || ft?.home == null || ft?.away == null) continue;
    // expected goals of the match, when the history has them (scripts/archive-data.mjs)
    const h = byId.get(m.id);
    const xg = Number.isFinite(h?.hxg) ? { hxg: h.hxg, axg: h.axg } : {};
    const neutral = m.neutral ?? h?.neutral;
    byId.set(m.id, {
      id: m.id, date: m.utcDate, comp: c.code, home: m.homeTeam.id, away: m.awayTeam.id, hg: ft.home, ag: ft.away, ...xg,
      ...(neutral ? { neutral: true } : {}),
    });
  }
}
const all = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));
// clubs and national teams are two separate models (scripts/lib/national-fit.mjs)
const isNational = (code) => NATIONAL_CODES.has(code);
const results = all.filter((r) => !isNational(r.comp));
const nationalResults = all.filter((r) => isNational(r.comp));
// European cup finals are on neutral ground; national teams: from the stadium's country (scripts/fetch-football.mjs)
const neutral = (c, m) => (isNational(c.code) ? !!m.neutral : CUPS.includes(c.code) && m.stage === "FINAL");
const fitFor = (code, asOf) =>
  isNational(code) ? fitModel(nationalResults, { ...NATIONAL_FIT, asOf }) : fitModel(results, { ...FIT, asOf });

const asOf = snapshot.generatedAt;
console.log(`Risultati usati: ${results.length} club, ${nationalResults.length} nazionali (storico: ${(history.results || []).length})`);

// ---- upcoming matches: one fit with everything known now ----
const model = fitModel(results, { ...FIT, asOf });
const nationalModel = fitModel(nationalResults, { ...NATIONAL_FIT, asOf });
const predictions = {};
for (const c of snapshot.competitions) {
  for (const m of c.matches) {
    if (!OPEN.has(m.status)) continue;
    const p = predict(isNational(c.code) ? nationalModel : model, {
      comp: c.code, home: m.homeTeam.id, away: m.awayTeam.id, neutral: neutral(c, m),
    });
    if (p) predictions[m.id] = { ...p, pre: false };
  }
}

// ---- finished matches in the snapshot: "pre-match" prediction, refitting once per calendar day ----
const finished = snapshot.competitions.flatMap((c) =>
  c.matches.filter((m) => PLAYED.has(m.status) && m.score?.fullTime?.home != null).map((m) => ({ c, m })),
);
const days = [...new Set(finished.map(({ m }) => m.utcDate.slice(0, 10)))].sort();
// national teams have their own track record: they play few games, and mixing them would change the clubs' figures
const track = { n: 0, hits: 0, logLoss: 0, brier: 0 };
const trackNational = { n: 0, hits: 0, logLoss: 0, brier: 0 };
for (const day of days) {
  const models = new Map(); // one refit per day and per model, only when that day has games of that kind
  for (const { c, m } of finished.filter(({ m }) => m.utcDate.startsWith(day))) {
    const kind = isNational(c.code) ? "national" : "club";
    if (!models.has(kind)) models.set(kind, fitFor(c.code, `${day}T00:00:00Z`));
    const p = predict(models.get(kind), { comp: c.code, home: m.homeTeam.id, away: m.awayTeam.id, neutral: neutral(c, m) });
    if (!p) continue;
    const ft = m.score.fullTime;
    const outcome = ft.home > ft.away ? 0 : ft.home === ft.away ? 1 : 2;
    predictions[m.id] = { ...p, pre: true };
    // the track record counts only matches where both teams had some history
    if (p.confidence === "bassa") continue;
    const t = kind === "national" ? trackNational : track;
    t.n++;
    if (p.p.indexOf(Math.max(...p.p)) === outcome) t.hits++;
    t.logLoss += -Math.log(Math.max(1e-6, p.p[outcome]));
    t.brier += p.p.reduce((s, v, i) => s + (v - (i === outcome ? 1 : 0)) ** 2, 0);
  }
}
for (const t of [track, trackNational])
  if (t.n) {
    t.logLoss = Math.round((t.logLoss / t.n) * 1000) / 1000;
    t.brier = Math.round((t.brier / t.n) * 1000) / 1000;
  }

const out = {
  generatedAt: asOf,
  model: {
    name: "Poisson con correzione Dixon-Coles",
    results: results.length,
    rho: model.rho,
    halfLifeDays: model.options.halfLifeDays,
    from: results[0]?.date ?? null,
  },
  track,
  national: {
    name: "Poisson con correzione Dixon-Coles (nazionali)",
    results: nationalResults.length,
    rho: nationalModel.rho,
    halfLifeDays: nationalModel.options.halfLifeDays,
    from: nationalResults[0]?.date ?? null,
    track: trackNational,
  },
  predictions,
};
const next = JSON.stringify(out) + "\n";
if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== next) fs.writeFileSync(OUT, next);
console.log(
  `football-predictions.json: ${Object.keys(predictions).length} partite · track record ${track.hits}/${track.n}` +
    (track.n ? ` (log-loss ${track.logLoss}, Brier ${track.brier})` : "") +
    ` · nazionali ${trackNational.hits}/${trackNational.n}`,
);

// ---- optional walk-forward backtest on the whole history ----
if (process.argv.includes("--backtest")) {
  const minDate = Date.parse(results[0]?.date ?? 0) + 60 * 86400000; // skip the first two months (no history)
  const tests = results.filter((r) => Date.parse(r.date) >= minDate);
  const weeks = [...new Set(tests.map((r) => r.date.slice(0, 10)))].sort();
  const s = { model: [0, 0, 0, 0], base: [0, 0, 0, 0] }; // n, hits, logLoss, brier
  const freq = [0.44, 0.27, 0.29]; // simple baseline: typical league 1X2 frequencies
  let cache = { key: "", m: null };
  for (const r of tests) {
    // refit once per ISO week to keep it fast
    const d = new Date(r.date);
    const key = `${d.getUTCFullYear()}-${Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / (7 * 86400000))}`;
    if (cache.key !== key) cache = { key, m: fitModel(results, { ...FIT, asOf: r.date.slice(0, 10) + "T00:00:00Z" }) };
    const p = predict(cache.m, { comp: r.comp, home: r.home, away: r.away })?.p;
    if (!p) continue;
    const o = r.hg > r.ag ? 0 : r.hg === r.ag ? 1 : 2;
    for (const [k, probs] of [["model", p], ["base", freq]]) {
      s[k][0]++;
      if (probs.indexOf(Math.max(...probs)) === o) s[k][1]++;
      s[k][2] += -Math.log(Math.max(1e-6, probs[o]));
      s[k][3] += probs.reduce((a, v, i) => a + (v - (i === o ? 1 : 0)) ** 2, 0);
    }
  }
  const fmt = ([n, h, ll, b]) =>
    `n=${n}  esatti=${((h / n) * 100).toFixed(1)}%  log-loss=${(ll / n).toFixed(3)}  Brier=${(b / n).toFixed(3)}`;
  const withXg = results.filter((r) => Number.isFinite(r.hxg)).length;
  console.log(`Backtest su ${weeks.length} giornate (peso xG ${XG_WEIGHT}; risultati con xG: ${withXg} su ${results.length})`);
  console.log(`  modello : ${fmt(s.model)}`);
  console.log(`  baseline: ${fmt(s.base)}  (frequenze fisse 44/27/29)`);
}
