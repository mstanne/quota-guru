// Basketball data from the BALLDONTLIE snapshot (src/data/basket.json, refreshed by scripts/fetch-basket-data.mjs):
// NBA calendar/results and Lega Basket Serie A standings.
import raw from "../data/basket.json";
import { formatDay, formatTime, romeDay, slugify } from "./footballCore";

export interface BasketTeam {
  id: number;
  name: string;
  shortName?: string;
  city?: string;
  abbr: string;
}
export type BasketStatus = "scheduled" | "live" | "final" | "postponed";
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
const data = raw as unknown as Snapshot;

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
export const gameStatusLabel = (g: BasketGame) =>
  ({ scheduled: "In programma", live: "In corso", final: "Finita", postponed: "Rinviata" })[g.status];
export const gameRoundLabel = (g: BasketGame) => (g.postseason ? "Playoff" : "Stagione regolare");

// ---------- SEO metadata ----------
const teams = (g: BasketGame) => `${g.home.name} – ${g.away.name}`;
export function gameMeta(g: BasketGame) {
  const when = `${formatDay(g.utcDate)} ore ${formatTime(g.utcDate)}`;
  return {
    path: gamePath(g),
    title: isGameFinished(g)
      ? `${teams(g)} ${g.score.home}-${g.score.away}: risultato NBA`
      : `${teams(g)}: orario e quote NBA`,
    description: isGameFinished(g)
      ? `Risultato finale e parziali di ${teams(g)} (NBA), giocata ${when}.`
      : `${teams(g)}, NBA: si gioca ${when} (ora italiana). Orario, stato della partita e quote a confronto.`,
  };
}
export const nbaMeta = {
  path: basketPaths.nba,
  title: `NBA ${nbaSeason}: calendario e risultati`,
  description:
    "Calendario e risultati delle partite NBA in orario italiano, con quote a confronto degli operatori autorizzati.",
};
export const lbaMeta = {
  path: basketPaths.lbaStandings,
  title: `Classifica Serie A basket ${lbaSeason}`,
  description:
    "Classifica aggiornata della Lega Basket Serie A: partite giocate, vittorie, sconfitte, punti fatti e subiti.",
};

export function basketRoutes() {
  return [nbaMeta, ...(lbaStandings.length ? [lbaMeta] : []), ...nbaGames.map(gameMeta)];
}
