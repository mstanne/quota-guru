// Derives src/data/football-home.json (next fixtures shown on the home page) from the full snapshot,
// so the home page does not have to download all the football data (T1). Run automatically by
// `npm run data` and `npm run build`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "data", "football.json");
const out = path.join(root, "src", "data", "football-home.json");

const PRIORITY = ["SA", "CL", "PL", "PD"]; // competitions shown on the home page
const LIMIT = 8;

const data = JSON.parse(fs.readFileSync(src, "utf8"));
const upcoming = (m) => ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"].includes(m.status);
const matches = data.competitions
  .filter((c) => PRIORITY.includes(c.code))
  .flatMap((c) =>
    c.matches.filter(upcoming).map((match) => ({ competition: { code: c.code, slug: c.slug, name: c.name }, match })),
  )
  .sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate))
  .slice(0, LIMIT);

const next = JSON.stringify({ generatedAt: data.generatedAt, matches }) + "\n";
if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== next) fs.writeFileSync(out, next);
console.log(`football-home.json: ${matches.length} partite`);
