// Channels of one match: the broadcasters' schedule checked every morning (src/data/tv-schedule.json) when it has
// the match, otherwise the rights deals of the season (src/lib/broadcast.ts).
import schedule from "../data/tv-schedule.json";
import { footballBroadcast, nbaBroadcast, withSchedule, type TvSchedule } from "./broadcast";
import { matchPath, type Competition, type Match } from "./footballCore";
import { gamePath } from "./nbaPaths";

const tv = schedule as TvSchedule;

/** Kick-offs of the matches of the same round (Serie A: Sky's three slots). */
const roundDates = (c: Competition, m: Match) =>
  c.matches.filter((x) => x.matchday != null && x.matchday === m.matchday && x.stage === m.stage).map((x) => x.utcDate);

export const matchBroadcast = (c: Competition, m: Match) =>
  withSchedule(
    tv.football[matchPath(c, m)],
    footballBroadcast(c.slug, m.utcDate, roundDates(c, m), [m.homeTeam.name, m.awayTeam.name], !!c.national),
  );

export const gameBroadcast = (g: Parameters<typeof gamePath>[0]) => withSchedule(tv.nba[gamePath(g)], nbaBroadcast());
