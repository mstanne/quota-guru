// /calcio lists in full only the main competitions: Italian leagues, the top foreign leagues, the European cups and
// the main national-team competitions, plus any match of an Italian national team. The other competitions (minor
// leagues, friendlies, other confederations) get one summary line each, linking to their own page
// (/pronostici/<lega>/), where all their matches are listed. Keeps the page focused (hundreds of youth friendlies
// during an international break would otherwise fill it) and lighter; visitors can still show every match.
import type { CompetitionRef, Match } from "./footballCore";

/** Site codes of the competitions listed in full on /calcio (scripts/lib/leagues.mjs). */
export const FEATURED_COMPETITIONS = new Set([
  // clubs
  "SA",
  "SB",
  "CL",
  "EL",
  "ECL",
  "PL",
  "PD",
  "BL1",
  "FL1",
  // national teams
  "WC",
  "EURO",
  "UNL",
  "EUROQ",
  "WCQE",
  "WCQPO",
  "COPA",
]);

/** Italian national teams: "Italia" (senior team, Italian name) and the youth teams ("Italy U21"). */
const ITALY = /^(Italia|Italy)\b/;

export function isFeaturedMatch(competition: Pick<CompetitionRef, "code">, match: Match) {
  return (
    FEATURED_COMPETITIONS.has(competition.code) || ITALY.test(match.homeTeam.name) || ITALY.test(match.awayTeam.name)
  );
}
