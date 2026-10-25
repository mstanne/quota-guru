// Basketball data from the BALLDONTLIE snapshot (src/data/basket.json, refreshed by scripts/fetch-basket-data.mjs):
// NBA calendar/results and Lega Basket Serie A standings.
import raw from "../data/basket.json";
import { sportsEvent } from "./schema";
import { formatDay, formatTime, referenceTime, romeDay, slugify } from "./footballCore";
import { isOverdue } from "./eventTiming.mjs";

export interface BasketTeam {
  id: number;
  name: string;
  shortName?: string;
  city?: string;
  abbr: string;
}
/** "pending" is set by the site, not by the API: past its expected end but not yet final at the source. */
export type BasketStatus = "scheduled" | "live" | "final" | "postponed" | "pending";
export interface BasketGame {
  id: number;
  utcDate: string;
  status: BasketStatus;
  postseason: boolean;
  home: BasketTeam;
  away: BasketTeam;
  score: { home: number | null; away: number | null };
  /** Points per quarter (and overtime) – only for finished games. */
  periods: { home: number[]; away: number[] } | null;
}
export interface BasketStanding {
  rank: number;
  team: BasketTeam;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
}
interface Snapshot {
  generatedAt: string;
  nba: { season: number; games: BasketGame[] };
  lba: { season: number; standings: BasketStanding[] };
}
const raw0 = raw as unknown as Snapshot;

/**
 * The source is not live and can leave a game "scheduled" or "live" after it ended. Past its expected end
 * (src/lib/eventTiming.mjs, same reference time as the football pages) the game becomes "pending":
 * it leaves "Prossime", is listed with the results and shows "Risultato in arrivo".
 */
export function settleGame(g: BasketGame, refMs = referenceTime): BasketGame {
  const open = g.status === "scheduled" || g.status === "live";
  return open && isOverdue(g.utcDate, "basket", refMs) ? { ...g, status: "pending" } : g;
}

const data: Snapshot = { ...raw0, nba: { ...raw0.nba, games: raw0.nba.games.map((g) => settleGame(g)) } };

export const basketUpdatedAt = data.generatedAt;
export const nbaGames = data.nba.games;
export const lbaStandings = data.lba.standings;
export const seasonLabel = (s: number) => `${s}-${String(s + 1).slice(2)}`;
export const nbaSeason = seasonLabel(data.nba.season);
export const nbaSeasonYear = data.nba.season;
export const lbaSeason = seasonLabel(data.lba.season);

// ---------- URLs ----------
export const basketPaths = {
  nba: "/basket/nba",
  lbaStandings: "/basket/serie-a/classifica",
};
const teamSlug = (t: BasketTeam) => slugify(t.shortName || t.name);
export const gameSlug = (g: BasketGame) => `${teamSlug(g.home)}-${teamSlug(g.away)}-${romeDay(g.utcDate)}`;
export const gamePath = (g: BasketGame) => `${basketPaths.nba}/${gameSlug(g)}`;
export const findGame = (slug?: string) => nbaGames.find((g) => gameSlug(g) === slug);

// ---------- status ----------
export const isGameFinished = (g: BasketGame) => g.status === "final";
export const isGameUpcoming = (g: BasketGame) => g.status === "scheduled";
export const isGameLive = (g: BasketGame) => g.status === "live";
export const isGamePending = (g: BasketGame) => g.status === "pending";
export const gameStatusLabel = (g: BasketGame) =>
  ({
    scheduled: "In programma",
    live: "In corso",
    final: "Finita",
    postponed: "Rinviata",
    pending: "Risultato in arrivo",
  })[g.status];
export const gameRoundLabel = (g: BasketGame) => (g.postseason ? "Playoff" : "Stagione regolare");

// ---------- SEO metadata ----------
const teams = (g: BasketGame) => `${g.home.name} – ${g.away.name}`;
/** `predicted`: the model has a prediction for this game (title and description mention it only then). */
export function gameMeta(g: BasketGame, predicted = false) {
  const when = `${formatDay(g.utcDate)} ore ${formatTime(g.utcDate)}`;
  const path = gamePath(g);
  const description = isGameFinished(g)
    ? `Risultato finale e parziali di ${teams(g)} (NBA), giocata ${when}.`
    : isGamePending(g)
      ? `${teams(g)} (NBA), giocata ${when} (ora italiana): risultato in arrivo.`
      : `${teams(g)}, NBA: si gioca ${when} (ora italiana).${predicted ? " Orario e pronostico con le probabilità di vittoria." : ""}`;
  return {
    path,
    title: isGameFinished(g)
      ? `${teams(g)} ${g.score.home}-${g.score.away}: risultato NBA`
      : `${teams(g)}: ${predicted ? "pronostico e orario NBA" : "orario NBA"}`,
    description,
    archive: isGameFinished(g),
    jsonLd: [
      sportsEvent({
        path,
        name: `${teams(g)} (NBA)`,
        description,
        startDate: g.utcDate,
        sport: "Pallacanestro",
        league: "NBA",
        home: { name: g.home.name },
        away: { name: g.away.name },
        status: g.status === "postponed" ? "postponed" : "scheduled",
      }),
    ],
  };
}
export const nbaMeta = {
  path: basketPaths.nba,
  title: `Pronostici NBA ${nbaSeason}: calendario e risultati`,
  description:
    "Calendario e risultati delle partite NBA in orario italiano, con il pronostico e le probabilità di vittoria di ogni partita.",
};
export const lbaMeta = {
  path: basketPaths.lbaStandings,
  title: `Classifica Serie A basket ${lbaSeason}`,
  description:
    "Classifica aggiornata della Lega Basket Serie A: partite giocate, vittorie, sconfitte, punti fatti e subiti.",
};

/** `predicted(id)`: whether a game has a prediction (passed in to keep the predictions out of this module). */
export function basketRoutes(predicted: (gameId: number) => boolean = () => false) {
  return [nbaMeta, ...(lbaStandings.length ? [lbaMeta] : []), ...nbaGames.map((g) => gameMeta(g, predicted(g.id)))];
}
