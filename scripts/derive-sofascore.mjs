// Build step: pairs the matches in src/data/football.json with the SofaScore events in
// src/data/sofascore-events.json and writes src/data/sofascore.json ({ matchId: sofascoreEventId }),
// used by the match pages to show the SofaScore live widgets. Never fails the build.
//
// A match and an event are the same when they are in the same league, kick off within 3 hours of each other
// and both teams match; within 20 minutes one matching team is enough (names differ a lot between sources:
// "Borussia M'gladbach" / "Borussia Mönchengladbach").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sameTeam, team } from "./lib/teams.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOOTBALL = path.join(root, "src", "data", "football.json");
const EVENTS = path.join(root, "src", "data", "sofascore-events.json");
const OUT = path.join(root, "src", "data", "sofascore.json");

const HOUR = 3600e3;

function main() {
  const football = JSON.parse(fs.readFileSync(FOOTBALL, "utf8"));
  const events = fs.existsSync(EVENTS) ? JSON.parse(fs.readFileSync(EVENTS, "utf8")).events ?? [] : [];
  const byLeague = new Map();
  for (const e of events) byLeague.set(e.league, [...(byLeague.get(e.league) ?? []), e]);

  const out = {};
  const used = new Set();
  let candidates = 0;
  for (const c of football.competitions ?? []) {
    const list = byLeague.get(c.slug) ?? [];
    if (!list.length) continue;
    for (const m of c.matches ?? []) {
      const t = Date.parse(m.utcDate);
      const near = list.filter((e) => !used.has(e.id) && Math.abs(Date.parse(e.start) - t) <= 3 * HOUR);
      if (!near.length) continue;
      candidates++;
      const home = team(m.homeTeam);
      const away = team(m.awayTeam);
      const score = (e) => (sameTeam(e.home, home) ? 1 : 0) + (sameTeam(e.away, away) ? 1 : 0);
      const best =
        near.find((e) => score(e) === 2) ??
        near.find((e) => score(e) === 1 && Math.abs(Date.parse(e.start) - t) <= HOUR / 3);
      if (best) {
        out[m.id] = best.id;
        used.add(best.id);
      }
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(out) + "\n");
  console.log(`sofascore.json: ${Object.keys(out).length} partite abbinate su ${candidates} con eventi SofaScore vicini.`);
}

try {
  main();
} catch (err) {
  console.warn(`derive-sofascore: ${err.message} (widget SofaScore non mostrati)`);
  if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, "{}\n");
}
