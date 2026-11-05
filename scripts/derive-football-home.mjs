// Derives src/data/football-home.json (next fixtures shown on the home page, with the model's predictions)
// from the full snapshot, so the home page does not have to download all the football data (T1).
// Run automatically by `npm run data` and `npm run build`.
//   matches  → "Prossime partite" list: the next LIMIT matches of the HOME competitions in time order, plus the
//              next LIMIT of each of them (the list has a competition filter), merged and sorted by date
//   competitions → the HOME competitions, in filter order (European cups included: on Thursdays the Europa and
//                  Conference League matches are the next ones)
//   featured → the hero cards: FEATURED matches with a prediction, today's first, Serie A first within a day
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isOverdue } from "../src/lib/eventTiming.mjs";
import { readBuildTime } from "./lib/build-time.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "data", "football.json");
const predFile = path.join(root, "src", "data", "football-predictions.json");
const out = path.join(root, "src", "data", "football-home.json");

const PRIORITY = ["SA", "CL", "EL", "PL", "PD", "ECL"]; // hero cards: order of the competitions within a day
const HOME = ["SA", "CL", "EL", "ECL", "PL", "PD", "BL1", "FL1"]; // "Prossime partite" list and its filter
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

// Hero: FEATURED cards, today's matches first, then the following days in order. Within a day the competitions
// in PRIORITY order come first (Italian clubs first within a cup), one card per competition before a second one
// of the same competition. Only matches with a prediction that have not started yet (not live), within
// FEATURED_DAYS of the data snapshot. Every build re-picks them, so a match drops out as soon as it kicks off.
const horizon = Date.parse(data.generatedAt) + FEATURED_DAYS * 86400000;
const romeDay = (ms) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date(ms));
const candidates = all.filter(
  (x) =>
    x.prediction &&
    ["SCHEDULED", "TIMED"].includes(x.match.status) &&
    Date.parse(x.match.utcDate) > buildMs &&
    Date.parse(x.match.utcDate) <= horizon,
);
const rank = (code) => (PRIORITY.includes(code) ? PRIORITY.indexOf(code) : PRIORITY.length + HOME.indexOf(code));
// in the European cups, matches of Italian clubs (teams of the Serie A / Serie B data) come first
const italian = new Set(
  data.competitions
    .filter((c) => c.code === "SA" || c.code === "SB")
    .flatMap((c) => c.matches.flatMap((m) => [m.homeTeam.id, m.awayTeam.id])),
);
const local = (x) => (italian.has(x.match.homeTeam.id) || italian.has(x.match.awayTeam.id) ? 0 : 1);
const days = [...new Set(candidates.map((x) => romeDay(Date.parse(x.match.utcDate))))].sort();
const featured = [];
for (const day of days) {
  const pool = candidates
    .filter((x) => romeDay(Date.parse(x.match.utcDate)) === day)
    .sort(
      (a, b) =>
        rank(a.competition.code) - rank(b.competition.code) ||
        local(a) - local(b) ||
        a.match.utcDate.localeCompare(b.match.utcDate),
    );
  // first pass: one per competition; second pass: the rest of the day
  for (const x of pool)
    if (featured.length < FEATURED && !featured.some((f) => f.competition.code === x.competition.code)) featured.push(x);
  for (const x of pool) if (featured.length < FEATURED && !featured.includes(x)) featured.push(x);
  if (featured.length === FEATURED) break;
}
featured.sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));

const next = JSON.stringify({ generatedAt: data.generatedAt, matches, competitions, featured, model }) + "\n";
if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== next) fs.writeFileSync(out, next);
console.log(`football-home.json: ${matches.length} partite (${competitions.length} campionati), ${featured.length} in evidenza`);
