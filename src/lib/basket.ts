// Basketball data from the BALLDONTLIE snapshot (src/data/basket.json, refreshed by scripts/fetch-basket-data.mjs):
// NBA calendar/results and Lega Basket Serie A standings.
import raw from "../data/basket.json";
import { sportsEvent, videoObject, type EventVenue } from "./schema";
import { formatDay, formatDayMonth, formatLongDate, formatTime, referenceTime } from "./footballCore";
import type { OgCard } from "../routes";
import { gamePairSlug, gamePath, gameSlug, NBA_HUB, nbaEventPath } from "./nbaPaths";
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
  nba: NBA_HUB,
  lbaStandings: "/basket/serie-a/classifica",
};
export { gamePath, gameSlug, gamePairSlug, nbaEventPath };

// ---------- evergreen event pages (same rules as football, src/lib/footballCore.ts) ----------
const isGameClosed = (g: BasketGame) => g.status === "final";
const pairs = new Map<string, BasketGame[]>();
for (const g of [...nbaGames].sort((a, b) => a.utcDate.localeCompare(b.utcDate))) {
  const k = gamePairSlug(g);
  pairs.set(k, [...(pairs.get(k) ?? []), g]);
}
/** Meetings of one fixture (home team, away team), oldest first. */
export const nbaPairGames = (slug?: string) => (slug ? (pairs.get(slug) ?? []) : []);
/** All fixtures with at least one game in the data. */
export const nbaPairSlugs = () => [...pairs.keys()];
/** The game the evergreen page shows: the first one not final, undefined when the page is resting. */
export const nextOfNbaPair = (list: BasketGame[]) => list.find((g) => !isGameClosed(g));
/** True when `g` is the game shown by its evergreen page (its canonical URL is then the evergreen one). */
export const isOnNbaEventPage = (g: BasketGame) =>
  !isGameClosed(g) && nextOfNbaPair(nbaPairGames(gamePairSlug(g)))?.id === g.id;
/** Where a link to a game points: the evergreen page while it shows the game, else the dated archive page. */
export const gameHref = (g: BasketGame) => (isOnNbaEventPage(g) ? nbaEventPath(g) : gamePath(g));
/** Wins in the last `n` finished games of a team before `beforeIso` (null with fewer than 5 games). */
export function nbaRecentRecord(teamId: number, beforeIso: string, n = 10) {
  const games = nbaGames
    .filter((g) => g.status === "final" && g.utcDate < beforeIso && (g.home.id === teamId || g.away.id === teamId))
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, n);
  if (games.length < 5) return null;
  const won = games.filter((g) => {
    const home = g.home.id === teamId;
    return home ? (g.score.home ?? 0) > (g.score.away ?? 0) : (g.score.away ?? 0) > (g.score.home ?? 0);
  }).length;
  return { won, games: games.length };
}
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
function nbaEventLd(
  g: BasketGame,
  path: string,
  description: string,
  video?: { video: string; title: string; published: string },
  venue?: EventVenue | null,
) {
  return [
    sportsEvent({
      path,
      name: `${teams(g)} (NBA)`,
      description,
      startDate: g.utcDate,
      durationMinutes: 150,
      sport: "Pallacanestro",
      venue,
      league: "NBA",
      home: { name: g.home.name },
      away: { name: g.away.name },
      status: g.status === "postponed" ? "postponed" : "scheduled",
    }),
    ...(video ? [videoObject(video, `Gli highlights ufficiali di ${teams(g)} (NBA).`)] : []),
  ];
}

/** Social image of a game page (src/routes.ts OgCard). `p`: the prediction the page shows, if any. */
export function nbaCard(
  g: BasketGame,
  p: { p: [number, number]; fav: 0 | 1 } | undefined,
): OgCard | null {
  if (!p) return null;
  const home = g.home.shortName ?? g.home.name;
  const away = g.away.shortName ?? g.away.name;
  const done = isGameFinished(g) && g.score.home != null && g.score.away != null;
  const day = formatDay(g.utcDate);
  const fav = p.fav === 0 ? home : away;
  return {
    competition: `NBA · ${gameRoundLabel(g)}`,
    when: `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${formatTime(g.utcDate)}`,
    home,
    away,
    probs: [
      { label: `${home} (casa)`, p: p.p[0] },
      { label: `${away} (trasferta)`, p: p.p[1] },
    ],
    pick: { label: `Vittoria ${fav}`, p: p.p[p.fav] },
    result: done ? { home: g.score.home!, away: g.score.away!, hit: (g.score.home! > g.score.away! ? 0 : 1) === p.fav } : null,
  };
}

/** Visible H1 of a game page (same text as BasketGamePage). */
export function gameHeadline(g: BasketGame) {
  const t = `${g.home.shortName ?? g.home.name} – ${g.away.shortName ?? g.away.name}`;
  return isGameFinished(g)
    ? `${t} ${g.score.home}-${g.score.away}: risultato e pronostico (${formatLongDate(g.utcDate)})`
    : `Pronostico ${t} (${formatLongDate(g.utcDate)})`;
}

/** `predicted`: the model has a prediction for this game (title and description mention it only then). */
export function gameMeta(
  g: BasketGame,
  predicted = false,
  video?: { video: string; title: string; published: string },
  venue?: EventVenue | null,
) {
  const when = `${formatDay(g.utcDate)} ore ${formatTime(g.utcDate)}`;
  const path = gamePath(g);
  // while the evergreen page shows this game, it is the canonical URL (the dated page is its future archive)
  const canonical = gameHref(g);
  const description = isGameFinished(g)
    ? `Risultato finale e parziali di ${teams(g)} (NBA), giocata ${when}.`
    : isGamePending(g)
      ? `${teams(g)} (NBA), giocata ${when} (ora italiana): risultato in arrivo.`
      : `${teams(g)}, NBA: si gioca ${when} (ora italiana).${predicted ? " Orario e pronostico con le probabilità di vittoria." : ""}`;
  return {
    path,
    ...(canonical !== path ? { canonical } : {}),
    title: isGameFinished(g)
      ? `${teams(g)} ${g.score.home}-${g.score.away}: risultato NBA`
      : `${teams(g)}: ${predicted ? "pronostico e orario NBA" : "orario NBA"}`,
    description,
    archive: isGameFinished(g),
    ...(canonical === path ? { article: { headline: gameHeadline(g), section: "NBA" } } : {}),
    jsonLd: canonical !== path ? [] : nbaEventLd(g, path, description, video, venue),
  };
}

/** Evergreen NBA event page /pronostici/nba/<casa>-<trasferta> (same rules as eventMeta for football). */
export function nbaEventMeta(slug: string, predicted = false, venue?: EventVenue | null) {
  const list = nbaPairGames(slug);
  const last = list[list.length - 1];
  if (!last) return null;
  const next = nextOfNbaPair(list);
  const path = nbaEventPath(last);
  if (next) {
    const when = `${formatDay(next.utcDate)} ore ${formatTime(next.utcDate)}`;
    const description = isGamePending(next)
      ? `${teams(next)} (NBA), giocata ${when} (ora italiana): risultato in arrivo. Il pronostico pubblicato prima della partita.`
      : `Pronostico ${teams(next)} (NBA), ${when} ora italiana: ${predicted ? "probabilità di vittoria e punti attesi calcolati dal modello statistico" : "orario"}, forma recente e precedenti.`;
    return {
      path,
      event: true,
      article: { headline: gameHeadline(next), section: "NBA" },
      title: `Pronostico ${teams(next)} (${formatDayMonth(next.utcDate)}): ${predicted ? "probabilità e orario" : "orario"} NBA`,
      description,
      archive: false,
      jsonLd: nbaEventLd(next, path, description, undefined, venue),
    };
  }
  return {
    path,
    event: true,
    title: `${teams(last)} (NBA): ultimo risultato e precedenti`,
    description: `${teams(last)}: l'ultima sfida NBA è finita ${last.score.home}-${last.score.away}. Il risultato, i precedenti della stagione e la prossima partita appena sarà in calendario.`,
    archive: true,
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
export function basketRoutes(
  predicted: (gameId: number) => boolean = () => false,
  video: (gameId: number) => { video: string; title: string; published: string } | undefined = () => undefined,
  venue: (g: BasketGame) => EventVenue | null = () => null,
  shownPrediction: (g: BasketGame) => { p: [number, number]; fav: 0 | 1 } | undefined = () => undefined,
) {
  const withCard = <M extends { article?: unknown }>(meta: M, g: BasketGame) => {
    const card = meta.article ? nbaCard(g, shownPrediction(g)) : null;
    return card ? { ...meta, card } : meta;
  };
  return [
    nbaMeta,
    ...(lbaStandings.length ? [lbaMeta] : []),
    ...nbaGames.map((g) => withCard(gameMeta(g, predicted(g.id), video(g.id), venue(g)), g)),
    ...nbaPairSlugs().map((slug) => {
      const next = nextOfNbaPair(nbaPairGames(slug));
      const g = next ?? nbaPairGames(slug).at(-1)!;
      const meta = nbaEventMeta(slug, !!next && predicted(next.id), venue(g))!;
      return next ? withCard(meta, next) : meta;
    }),
  ];
}
