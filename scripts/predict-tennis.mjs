// Tennis ratings for the head-to-head predictor (model: src/lib/tennis/model.mjs).
//
// Reads  src/data/tennis.json          ATP/WTA top-100 rankings (BALLDONTLIE free plan)
//        data/tennis-matches.json      OPTIONAL match results, one object per match:
//                                      { date: "2026-10-12", tour: "atp"|"wta", surface: "Hard"|"Clay"|"Grass"|null,
//                                        winner: <player id>, loser: <player id> }
//                                      (same player ids as the rankings). Not available on the free plan:
//                                      fill it from a match feed when one is connected.
// Writes src/data/tennis-ratings.json  { generatedAt, source: "points"|"elo", matches, atp: {...}, wta: {...} }
//
// Without results every rating comes from ranking points; with results it is a surface Elo seeded with the
// ranking-points rating (so players with few matches stay close to what their ranking says).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildElo, pointsToElo, SURFACES } from "../src/lib/tennis/model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = path.join(root, "src", "data", "tennis.json");
const MATCHES = path.join(root, "data", "tennis-matches.json");
const OUT = path.join(root, "src", "data", "tennis-ratings.json");
const MATCH_DAYS = 3 * 365; // results older than this are ignored

const snap = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
const since = new Date(Date.parse(snap.generatedAt) - MATCH_DAYS * 86400000).toISOString().slice(0, 10);
const matches = fs.existsSync(MATCHES)
  ? JSON.parse(fs.readFileSync(MATCHES, "utf8")).filter((m) => m.date >= since && m.winner && m.loser)
  : [];

const r1 = (x) => Math.round(x * 10) / 10;
const out = { generatedAt: snap.generatedAt, source: matches.length ? "elo" : "points", matches: matches.length };
for (const tour of ["atp", "wta"]) {
  const rows = snap[tour]?.rankings ?? [];
  const points = new Map(rows.map((r) => [r.player.id, r.points]));
  // players outside the top 100 start a little below the 100th
  const floor = Math.min(...rows.map((r) => r.points ?? Infinity)) * 0.8;
  const seed = (id) => pointsToElo(points.get(id) ?? floor, tour);
  const elo = buildElo(
    matches.filter((m) => m.tour === tour),
    seed,
  );
  out[tour] = Object.fromEntries(
    rows.map((r) => {
      const e = elo.get(r.player.id);
      const rating = { all: r1(e?.all ?? seed(r.player.id)), n: e?.n ?? 0 };
      // a surface rating is kept only with some matches on that surface
      if (e) for (const s of SURFACES) if ((e[`n${s}`] ?? 0) >= 5) rating[s] = r1(e[s]);
      return [r.player.id, rating];
    }),
  );
}

const next = JSON.stringify(out) + "\n";
if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== next) fs.writeFileSync(OUT, next);
console.log(`tennis-ratings.json: ${out.source === "elo" ? `Elo su ${matches.length} partite` : "da punti classifica"}`);
