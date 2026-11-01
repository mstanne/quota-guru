// Adds SofaScore events to src/data/sofascore-events.json (the list the build uses to show the SofaScore
// widgets on live match pages). SofaScore blocks requests from servers (GitHub Actions gets HTTP 403), so the
// list is downloaded in a real browser on the editorial computer: see scripts/sofascore-agent/ISTRUZIONI.md.
//
// Usage:  node scripts/sofascore-events.mjs <downloaded.json>
//   <downloaded.json>: array of { id, league, start, home, away } as produced by the browser snippet.
// Events whose kick-off is more than KEEP_DAYS days old are dropped; the same id downloaded again replaces the old one.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORE = path.join(root, "src", "data", "sofascore-events.json");
const KEEP_DAYS = 10;
const LEAGUES = new Set([
  "serie-a",
  "champions-league",
  "premier-league",
  "liga",
  "bundesliga",
  "ligue-1",
  "eredivisie",
  "primeira-liga",
  "championship",
  "brasileirao",
]);

const input = process.argv[2];
if (!input) {
  console.error("Uso: node scripts/sofascore-events.mjs <file scaricato.json>");
  process.exit(1);
}

const incoming = JSON.parse(fs.readFileSync(input, "utf8"));
if (!Array.isArray(incoming)) throw new Error("Il file deve contenere un elenco (array) di partite.");

const valid = (e) =>
  e &&
  Number.isInteger(e.id) &&
  LEAGUES.has(e.league) &&
  typeof e.home === "string" &&
  typeof e.away === "string" &&
  !Number.isNaN(Date.parse(e.start));

const bad = incoming.filter((e) => !valid(e));
if (bad.length) console.warn(`Scartate ${bad.length} righe non valide, es.: ${JSON.stringify(bad[0])}`);

const old = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, "utf8")).events ?? [] : [];
const byId = new Map(old.map((e) => [e.id, e]));
for (const e of incoming.filter(valid)) {
  byId.set(e.id, { id: e.id, league: e.league, start: new Date(e.start).toISOString().replace(".000", ""), home: e.home, away: e.away });
}
const cutoff = Date.now() - KEEP_DAYS * 86400e3;
const events = [...byId.values()]
  .filter((e) => Date.parse(e.start) >= cutoff)
  .sort((a, b) => a.start.localeCompare(b.start) || a.id - b.id);

fs.writeFileSync(STORE, JSON.stringify({ updatedAt: new Date().toISOString(), events }, null, 1) + "\n");
console.log(`sofascore-events.json: ${events.length} partite (${incoming.length - bad.length} lette, ${old.length} prima).`);
