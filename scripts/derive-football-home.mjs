// Derives src/data/football-home.json (next fixtures shown on the home page, with the model's predictions)
// from the full snapshot, so the home page does not have to download all the football data (T1).
// Run automatically by `npm run data` and `npm run build`.
//   matches  → "Prossime partite" list (next LIMIT matches of the PRIORITY competitions)
//   featured → the hero cards: next FEATURED matches with a prediction, Serie A first
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "data", "football.json");
const predFile = path.join(root, "src", "data", "football-predictions.json");
const out = path.join(root, "src", "data", "football-home.json");

const PRIORITY = ["SA", "CL", "PL", "PD"]; // competitions shown on the home page
const LIMIT = 8;
const FEATURED = 3;
const FEATURED_DAYS = 7; // hero cards only for matches in the next week

const data = JSON.parse(fs.readFileSync(src, "utf8"));
const predData = fs.existsSync(predFile) ? JSON.parse(fs.readFileSync(predFile, "utf8")) : null;
const predictions = predData?.predictions ?? {};
// model summary + track record, shown on the Metodologia page without loading every prediction
const model = predData ? { ...predData.model, track: predData.track, generatedAt: predData.generatedAt } : null;
const upcoming = (m) => ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"].includes(m.status);
const all = data.competitions
  .filter((c) => PRIORITY.includes(c.code))
  .flatMap((c) =>
    c.matches.filter(upcoming).map((match) => {
      const p = predictions[match.id];
      return { competition: { code: c.code, slug: c.slug, name: c.name }, match, ...(p ? { prediction: p } : {}) };
    }),
  )
  .sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));

const matches = all.slice(0, LIMIT);

// Hero: one card per competition in PRIORITY order (Serie A first), the earliest predicted match of each,
// only scheduled matches (not live) within FEATURED_DAYS of the data snapshot.
const horizon = Date.parse(data.generatedAt) + FEATURED_DAYS * 86400000;
const candidates = all.filter(
  (x) => x.prediction && ["SCHEDULED", "TIMED"].includes(x.match.status) && Date.parse(x.match.utcDate) <= horizon,
);
const featured = [];
for (const code of PRIORITY) {
  const hit = candidates.find((x) => x.competition.code === code && !featured.includes(x));
  if (hit) featured.push(hit);
  if (featured.length === FEATURED) break;
}
for (const x of candidates) if (featured.length < FEATURED && !featured.includes(x)) featured.push(x);
featured.sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));

const next = JSON.stringify({ generatedAt: data.generatedAt, matches, featured, model }) + "\n";
if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== next) fs.writeFileSync(out, next);
console.log(`football-home.json: ${matches.length} partite, ${featured.length} in evidenza`);
