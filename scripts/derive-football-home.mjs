// Derives src/data/football-home.json (next fixtures shown on the home page, with the model's predictions)
// from the full snapshot, so the home page does not have to download all the football data (T1).
// Run automatically by `npm run data` and `npm run build`.
//   matches  → "Prossime partite" list: the next LIMIT matches of the HOME competitions in time order, plus the
//              next LIMIT of each of them (the list has a competition filter), merged and sorted by date
//   competitions → the HOME competitions, in filter order
//   featured → the hero cards: next FEATURED matches with a prediction, Serie A first
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isOverdue } from "../src/lib/eventTiming.mjs";
import { readBuildTime } from "./lib/build-time.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "data", "football.json");
const predFile = path.join(root, "src", "data", "football-predictions.json");
const out = path.join(root, "src", "data", "football-home.json");

const PRIORITY = ["SA", "CL", "PL", "PD"]; // hero cards: one per competition, in this order
const HOME = ["SA", "CL", "PL", "PD", "BL1", "FL1"]; // "Prossime partite" list and its filter
const LIMIT = 8;
const FEATURED = 3;
const FEATURED_DAYS = 7; // hero cards only for matches in the next week

const data = JSON.parse(fs.readFileSync(src, "utf8"));
const predData = fs.existsSync(predFile) ? JSON.parse(fs.readFileSync(predFile, "utf8")) : null;
const predictions = predData?.predictions ?? {};
// model summary + track record, shown on the Metodologia page without loading every prediction
const model = predData ? { ...predData.model, track: predData.track, generatedAt: predData.generatedAt } : null;
// Same rule as the site (settleMatch in src/lib/footballCore.ts): a match past its expected end is not
// "upcoming" any more, even if the source still lists it as scheduled or in play.
const buildMs = Date.parse(readBuildTime(root));
const upcoming = (m) =>
  ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"].includes(m.status) && !isOverdue(m.utcDate, "football", buildMs);
const all = data.competitions
  .filter((c) => HOME.includes(c.code))
  .flatMap((c) =>
    c.matches.filter(upcoming).map((match) => {
      const p = predictions[match.id];
      return { competition: { code: c.code, slug: c.slug, name: c.name }, match, ...(p ? { prediction: p } : {}) };
    }),
  )
  .sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));

const picked = new Set(all.slice(0, LIMIT));
for (const code of HOME) all.filter((x) => x.competition.code === code).slice(0, LIMIT).forEach((x) => picked.add(x));
// the list rows show only the 1X2 probabilities: keep just those (the hero cards below keep the full prediction)
const matches = all
  .filter((x) => picked.has(x))
  .map(({ prediction, ...x }) => (prediction ? { ...x, prediction: { p: prediction.p } } : x));
const competitions = HOME.map((code) => data.competitions.find((c) => c.code === code))
  .filter((c) => c && matches.some((x) => x.competition.code === c.code))
  .map((c) => ({ code: c.code, slug: c.slug, name: c.name }));

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

const next = JSON.stringify({ generatedAt: data.generatedAt, matches, competitions, featured, model }) + "\n";
if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== next) fs.writeFileSync(out, next);
console.log(`football-home.json: ${matches.length} partite (${competitions.length} campionati), ${featured.length} in evidenza`);
