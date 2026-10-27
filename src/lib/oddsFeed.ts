// Bookmaker odds next to the model's probabilities – ready for the operators' feeds, empty until one is connected.
//
// src/data/odds-feed.json, written by the future feed script (one per agreement, same format for all):
//   {
//     "generatedAt": "2026-11-02T08:00:00Z",          // when the feed was read
//     "provider": "nome del fornitore",
//     "football": { "<matchId>": { "updatedAt": "...", "markets": {
//         "1x2":  { "<operatorId>": { "home": 2.10, "draw": 3.30, "away": 3.60 } },
//         "uo25": { "<operatorId>": { "under": 1.85, "over": 1.95 } },
//         "gg":   { "<operatorId>": { "yes": 1.80, "no": 1.95 } } } } },
//     "nba":      { "<gameId>":  { "updatedAt": "...", "markets": {
//         "win":  { "<operatorId>": { "home": 1.60, "away": 2.35 } } } } }
//   }
// Match ids are the site's ids (football-data.org / BALLDONTLIE); operator ids are those of src/data/operators.ts.
// While the file is empty every odds block renders nothing, so pages look exactly as they do today.
import raw from "../data/odds-feed.json";
import type { OddsByOperator } from "./odds";

export type OddsSport = "football" | "nba";
interface Entry {
  updatedAt: string;
  markets: Record<string, Record<string, Record<string, number>>>;
}
const feed = raw as unknown as { generatedAt: string | null; provider: string | null } & Record<OddsSport, Record<string, Entry>>;

export const oddsFeedActive = () => !!feed.generatedAt;

/** Odds of one market of one match, by operator, or null when the feed has none. */
export function marketOdds(sport: OddsSport, id: number, market: string): { odds: OddsByOperator; updatedAt: string } | null {
  const e = feed[sport]?.[String(id)];
  const m = e?.markets?.[market];
  if (!e || !m || !Object.keys(m).length) return null;
  return { odds: m as OddsByOperator, updatedAt: e.updatedAt };
}

/** Probabilities implied by a set of odds, with the bookmaker margin removed proportionally. */
export function impliedProbabilities(odds: number[]) {
  const inv = odds.map((o) => (o > 1 ? 1 / o : 0));
  const total = inv.reduce((a, b) => a + b, 0);
  return { probs: inv.map((v) => (total ? v / total : 0)), margin: total - 1 };
}
