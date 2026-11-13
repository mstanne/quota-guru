// Corners and cards model and first-half share of goals (scripts/lib/counts-model.mjs), for the football predictions.
//
// Reads  data/archivio/calcio/**  (permanent archive, statistics of finished matches; present in the full runs)
//        src/data/football.json   (only its date: the model is fitted with what was known then)
// Writes data/modello-corner-cartellini.json  { asOf, half, corners: { model, phi, n }, cards: { … } }
//
// Without the archive (quick live-score runs, local builds without data) the file is left as it is: those runs use
// the model of the last full run, so the published corner and card estimates do not come and go between runs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fitCounts, loadArchiveStats } from "./lib/counts-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archive = path.join(root, "data", "archivio");
const OUT = path.join(root, "data", "modello-corner-cartellini.json");

if (!fs.existsSync(path.join(archive, "calcio"))) {
  console.log(`Corner e cartellini: archivio assente, ${fs.existsSync(OUT) ? "resta il modello dell'ultimo aggiornamento completo" : "nessun modello"}`);
  process.exit(0);
}
let asOf;
try {
  asOf = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "football.json"), "utf8")).generatedAt;
} catch {
  /* no snapshot: now */
}
asOf ??= new Date().toISOString();
const from = Date.parse(asOf) - 3 * 365 * 86400000;
const fit = fitCounts(loadArchiveStats(archive, from), asOf);
fs.writeFileSync(OUT, JSON.stringify(fit) + "\n");
console.log(
  `Corner e cartellini: ${fit.corners.n} partite con i corner (dispersione ${fit.corners.phi}), ${fit.cards.n} con i cartellini ` +
    `(dispersione ${fit.cards.phi}); gol nel primo tempo ${(fit.half * 100).toFixed(1)}%`,
);
