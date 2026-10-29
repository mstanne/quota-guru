// NBA URLs, without data imports (README, "Schema degli URL"):
//   /pronostici/nba                              hub (calendar, predictions)
//   /pronostici/nba/<casa>-<trasferta>           evergreen event page: always the next meeting of that fixture
//   /basket/nba/<casa>-<trasferta>-<data>        one game, kept forever as the archive of its prediction
//   /basket/nba/risultati, /basket/nba/squadre   results and teams stay under /basket
import { romeDay, slugify } from "./footballCore";

export const NBA_HUB = "/pronostici/nba";

interface GameTeams {
  home: { name: string; shortName?: string };
  away: { name: string; shortName?: string };
}
const teamSlug = (t: { name: string; shortName?: string }) => slugify(t.shortName || t.name);
/** Fixture slug without the date, home team first, e.g. "lakers-celtics". */
export const gamePairSlug = (g: GameTeams) => `${teamSlug(g.home)}-${teamSlug(g.away)}`;
export const gameSlug = (g: GameTeams & { utcDate: string }) => `${gamePairSlug(g)}-${romeDay(g.utcDate)}`;
/** Dated page of one game (archive). */
export const gamePath = (g: GameTeams & { utcDate: string }) => `/basket/nba/${gameSlug(g)}`;
/** Evergreen page of a fixture. */
export const nbaEventPath = (g: GameTeams) => `${NBA_HUB}/${gamePairSlug(g)}`;
