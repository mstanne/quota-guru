// Football types and pure helpers (URLs, formatting, standings maths).
// No data import here, so components that only format matches do not pull the full snapshot into their JS chunk.

import { isOverdue } from "./eventTiming.mjs";
import { sportsEvent, videoObject, type EventVenue } from "./schema";

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  /** Club crest from the football-data.org CDN (null if not available). */
  crest?: string | null;
}
export interface Score {
  home: number | null;
  away: number | null;
}
export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED"
  /** Set by the site, not by the API: past its expected end but not yet marked as finished by the source. */
  | "RESULT_PENDING";
export interface Match {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string | null;
  group: string | null;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: Score;
    halfTime: Score;
    /** Only for matches that did not end after 90 minutes. */
    duration?: "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    regularTime?: Score | null;
    extraTime?: Score | null;
    penalties?: Score | null;
  };
  referee: string | null;
  /** Goals and cards: only when the data plan provides them (scripts/fetch-football-data.mjs). */
  goals?: MatchGoal[];
  cards?: MatchCard[];
}
export interface MatchGoal {
  minute: number;
  injuryTime: number | null;
  type: "REGULAR" | "OWN" | "PENALTY";
  /** Team credited with the goal. */
  team: number;
  scorer: string | null;
  assist: string | null;
}
export interface MatchCard {
  minute: number;
  team: number;
  player: string | null;
  card: "YELLOW" | "YELLOW_RED" | "RED";
}
export interface StandingRow {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
export interface Competition {
  code: string;
  slug: string;
  name: string;
  area: string | null;
  season: { startDate: string; endDate: string; currentMatchday: number | null } | null;
  matches: Match[];
  standings: { stage: string; group: string | null; table: StandingRow[] }[];
}
export interface HeadToHead {
  numberOfMatches: number;
  totalGoals: number;
  matches: {
    id: number;
    utcDate: string;
    competition: string;
    homeTeam: Team;
    awayTeam: Team;
    score: { fullTime: Score };
  }[];
}

// ---------- URLs ----------
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const TZ = "Europe/Rome";
/** Calendar day of the match in Italian time, e.g. "2026-10-18". */
export const romeDay = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date(iso));

/** Stable slug per match, e.g. "inter-juventus-2026-10-18" (the dated page: permanent archive of one match).
 *  Built from the source's short names and never changed, so published URLs keep working. */
export function matchSlug(m: Match) {
  return `${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`;
}

/**
 * One slug per club for the evergreen URLs, written the way Italians search for it ("pronostico siviglia
 * barcellona", not "sevilla-fc-barca"). Every club not listed uses its short name. Add a line when a new club's
 * short name makes a poor slug; never change a line already published (it would change live URLs).
 */
export const TEAM_SLUGS: Record<string, string> = {
  // Serie A
  "Como 1907": "como",
  "Venezia FC": "venezia",
  // LaLiga
  "Barça": "barcellona",
  Atleti: "atletico-madrid",
  Athletic: "athletic-bilbao",
  "Sevilla FC": "siviglia",
  Celta: "celta-vigo",
  Santander: "racing-santander",
  // Bundesliga
  Bayern: "bayern-monaco",
  Dortmund: "borussia-dortmund",
  "M'gladbach": "borussia-monchengladbach",
  "1. FC Köln": "colonia",
  Bremen: "werder-brema",
  Frankfurt: "eintracht-francoforte",
  HSV: "amburgo",
  Mainz: "magonza",
  "SC Paderborn": "paderborn",
  // Premier League e Championship
  "Man City": "manchester-city",
  "Man United": "manchester-united",
  "Brighton Hove": "brighton",
  Nottingham: "nottingham-forest",
  Newcastle: "newcastle",
  "Preston NE": "preston",
  "Sheffield Utd": "sheffield-united",
  QPR: "queens-park-rangers",
  // Ligue 1
  PSG: "psg",
  "Olympique Lyon": "lione",
  Marseille: "marsiglia",
  Nice: "nizza",
  "RC Lens": "lens",
  "Stade Rennais": "rennes",
  "Angers SCO": "angers",
  // Portogallo e Olanda
  "SL Benfica": "benfica",
  "Sporting CP": "sporting-lisbona",
  "CD Nacional": "nacional",
  "Acad. Viseu": "academico-viseu",
  "Vitória SC": "vitoria-guimaraes",
  AZ: "az-alkmaar",
  // coppe europee
  Shaktar: "shakhtar-donetsk",
  "Sl. Bratislava": "slovan-bratislava",
  "PAE AEK": "aek-atene",
  "Slavia Praha": "slavia-praga",
  "Sabah FK": "sabah",
  // Brasileirão
  Mineiro: "atletico-mineiro",
  Paranaense: "athletico-paranaense",
};
/** Slug of a club in the evergreen URLs (see TEAM_SLUGS). */
export const teamSlug = (t: Pick<Team, "shortName">) => TEAM_SLUGS[t.shortName] ?? slugify(t.shortName);

/** Slug of a fixture without the date, home team first, e.g. "inter-juventus" (the evergreen event page). */
export function pairSlug(m: Pick<Match, "homeTeam" | "awayTeam">) {
  return `${teamSlug(m.homeTeam)}-${teamSlug(m.awayTeam)}`;
}
/** Minimal competition info needed to build URLs and labels. */
export type CompetitionRef = Pick<Competition, "code" | "slug" | "name">;

// URL schema (README, "Schema degli URL"):
//   /pronostici/<lega>                         hub of a competition (calendar, predictions)
//   /pronostici/<lega>/giornata-<n>            one round (league phase of the cups: fase-campionato-giornata-<n>)
//   /pronostici/<lega>/<casa>-<trasferta>      evergreen event page: always the next meeting of that fixture
//   /calcio/<lega>/<casa>-<trasferta>-<data>   one match, kept forever as the archive of its prediction
//   /calcio/<lega>/classifica, /risultati      standings and results stay under /calcio
export const PRONOSTICI = "/pronostici";
export const competitionPath = (c: Pick<CompetitionRef, "slug">) => `${PRONOSTICI}/${c.slug}`;
export const standingsPath = (c: CompetitionRef) => `/calcio/${c.slug}/classifica`;
/** Under/Over and Goal statistics of every team of a competition (src/components/stats/GoalStatsPage.tsx). */
export const goalStatsPath = (c: Pick<CompetitionRef, "slug">) => `/calcio/${c.slug}/statistiche-under-over`;
/** "2026/27", or "2026" for calendar-year seasons (Brasileirão). */
export function seasonName(c: Pick<Competition, "code" | "season">) {
  const y = Number(c.season?.startDate?.slice(0, 4));
  if (!y) return "";
  return c.code === "BSA" ? String(y) : `${y}/${String(y + 1).slice(2)}`;
}
export const matchPath = (c: CompetitionRef, m: Match) => `/calcio/${c.slug}/${matchSlug(m)}`;
export const eventPath = (c: Pick<CompetitionRef, "slug">, m: Pick<Match, "homeTeam" | "awayTeam">) =>
  `${PRONOSTICI}/${c.slug}/${pairSlug(m)}`;

/** Slug of a round page: "giornata-12", or "fase-campionato-giornata-3" for the league phase of the cups. */
export const matchdaySlug = (d: { n: number; stage?: string | null }) =>
  d.stage === "LEAGUE_STAGE" ? `fase-campionato-giornata-${d.n}` : `giornata-${d.n}`;
/** Round number from a round slug, null if the slug is not a round. */
export function parseMatchdaySlug(slug?: string): { n: number; leaguePhase: boolean } | null {
  const m = slug?.match(/^(fase-campionato-)?giornata-(\d{1,3})$/);
  return m ? { n: Number(m[2]), leaguePhase: !!m[1] } : null;
}

// ---------- evergreen event pages ----------
// A fixture (home team, away team, competition) has one evergreen URL. It shows the next meeting that is not
// finished; once every meeting in the data is finished the page "rests" (last result, history, reverse fixture)
// and the dated page of the match becomes the canonical one.
const isClosed = (m: Pick<Match, "status">) =>
  m.status === "FINISHED" || m.status === "AWARDED" || m.status === "CANCELLED";

const pairCache = new WeakMap<Competition, Map<string, Match[]>>();
/** Meetings of one fixture in a competition (cancelled ones excluded), oldest first. */
export function pairMatches(c: Competition, slug: string): Match[] {
  let byPair = pairCache.get(c);
  if (!byPair) {
    byPair = new Map();
    for (const m of [...c.matches].sort((a, b) => a.utcDate.localeCompare(b.utcDate))) {
      if (m.status === "CANCELLED") continue;
      const k = pairSlug(m);
      byPair.set(k, [...(byPair.get(k) ?? []), m]);
    }
    pairCache.set(c, byPair);
  }
  return byPair.get(slug) ?? [];
}
/** The meeting the evergreen page shows: the first one not finished, undefined when the page is resting. */
export const nextOfPair = (list: Match[]) => list.find((m) => !isClosed(m));

/** True when `m` is the meeting shown by its evergreen page (its canonical URL is then the evergreen one). */
export function isOnEventPage(c: CompetitionRef | Competition, m: Match) {
  if (isClosed(m)) return false;
  // without the whole competition (home page extract) the first open meeting in sight is assumed to be the next
  if (!("matches" in c)) return true;
  return nextOfPair(pairMatches(c, pairSlug(m)))?.id === m.id;
}
/** Where a link to a match points: the evergreen page while it shows the match, else the dated archive page. */
export const matchHref = (c: CompetitionRef | Competition, m: Match) =>
  isOnEventPage(c, m) ? eventPath(c, m) : matchPath(c, m);
/** Canonical path of a dated match page. */
export const matchCanonical = matchHref;

// ---------- status & formatting ----------
export const isFinished = (m: Match) => m.status === "FINISHED" || m.status === "AWARDED";
export const isUpcoming = (m: Match) => m.status === "SCHEDULED" || m.status === "TIMED";
export const isLive = (m: Match) => m.status === "IN_PLAY" || m.status === "PAUSED";
/** Played (by the clock) but the source has not published the final result yet. */
/** Round page, e.g. /pronostici/serie-a/giornata-12 (league phases only, see src/lib/matchdays.ts). */
export const matchdayPath = (c: Pick<CompetitionRef, "slug">, d: { n: number; stage?: string | null }) =>
  `${PRONOSTICI}/${c.slug}/${matchdaySlug(d)}`;
/** Stages whose matchdays get their own page. */
export const isMatchdayStage = (m: Pick<Match, "stage" | "matchday">) =>
  !!m.matchday && (m.stage === "REGULAR_SEASON" || m.stage === "LEAGUE_STAGE");
export const isResultPending = (m: Match) => m.status === "RESULT_PENDING";

/** Reference time of this build (vite.config.ts), the same for pre-rendered pages and the browser. */
export const referenceTime = typeof __BUILD_TIME__ === "string" ? Date.parse(__BUILD_TIME__) : Date.now();

/**
 * The source is not live and sometimes leaves a match "scheduled" or "in play" long after it ended.
 * Past its expected end (src/lib/eventTiming.mjs) such a match becomes RESULT_PENDING: it leaves
 * "Prossime", is listed with the results and shows "Risultato in arrivo" instead of a time or "In corso".
 */
export function settleMatch<M extends Pick<Match, "status" | "utcDate">>(m: M, refMs = referenceTime): M {
  const open = m.status === "SCHEDULED" || m.status === "TIMED" || m.status === "IN_PLAY" || m.status === "PAUSED";
  return open && isOverdue(m.utcDate, "football", refMs) ? { ...m, status: "RESULT_PENDING" } : m;
}

const STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: "Da programmare",
  TIMED: "In programma",
  IN_PLAY: "In corso",
  PAUSED: "Intervallo",
  FINISHED: "Finita",
  SUSPENDED: "Sospesa",
  POSTPONED: "Rinviata",
  CANCELLED: "Annullata",
  AWARDED: "A tavolino",
  RESULT_PENDING: "Risultato in arrivo",
};
export const statusLabel = (m: Match) => STATUS_LABEL[m.status] ?? m.status;

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(iso),
  );
export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
export const formatUpdated = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function roundLabel(m: Match) {
  if (m.stage === "REGULAR_SEASON" && m.matchday) return `${m.matchday}ª giornata`;
  if (m.stage === "LEAGUE_STAGE" && m.matchday) return `Fase campionato · ${m.matchday}ª giornata`;
  const stages: Record<string, string> = {
    PLAYOFFS: "Playoff",
    LAST_16: "Ottavi di finale",
    QUARTER_FINALS: "Quarti di finale",
    SEMI_FINALS: "Semifinali",
    FINAL: "Finale",
    GROUP_STAGE: "Fase a gironi",
  };
  return (m.stage && stages[m.stage]) || (m.matchday ? `${m.matchday}ª giornata` : "");
}

// ---------- standings helpers ----------
export const mainTable = (c: Competition) => c.standings[0]?.table ?? [];
export const standingOf = (c: Competition, teamId: number) => mainTable(c).find((r) => r.team.id === teamId);

/** Last results (most recent first) of a team in the snapshot: "V" | "N" | "P". */
export function recentForm(c: Competition, teamId: number, limit = 5) {
  return c.matches
    .filter((m) => isFinished(m) && (m.homeTeam.id === teamId || m.awayTeam.id === teamId))
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, limit)
    .map((m) => {
      if (m.score.winner === "DRAW") return { result: "N" as const, match: m };
      const home = m.homeTeam.id === teamId;
      const won = (m.score.winner === "HOME_TEAM") === home;
      return { result: (won ? "V" : "P") as "V" | "P", match: m };
    });
}

// ---------- SEO metadata for generated pages ----------
export function competitionMeta(c: Competition) {
  return {
    path: competitionPath(c),
    title: `Pronostici ${c.name}: calendario e risultati`,
    description: `Pronostici con le probabilità 1X2, calendario, orari e risultati delle partite di ${c.name}${c.area ? ` (${c.area})` : ""}, con classifica aggiornata.`,
  };
}
/** `league`: Under/Over counts of the whole season (src/lib/goalStats.mjs), for the description. */
export function goalStatsMeta(c: Competition, league?: { n: number; gf: number; over: number[]; btts: number }) {
  const season = seasonName(c);
  const pc = (k: number) => (league?.n ? Math.round((k / league.n) * 100) : 0);
  return {
    path: goalStatsPath(c),
    title: `Statistiche Under/Over ${c.name}${season ? ` ${season}` : ""}: Over 2,5 e Goal squadra per squadra`,
    description: league?.n
      ? `Percentuali Over 1,5, Over 2,5, Over 3,5 e Goal/No Goal di ogni squadra di ${c.name}, in casa e in trasferta. Finora il ${pc(league.over[1])}% delle partite è finito Over 2,5 e nel ${pc(league.btts)}% hanno segnato entrambe le squadre (${league.n} partite).`
      : `Percentuali Over 1,5, Over 2,5, Over 3,5 e Goal/No Goal di ogni squadra di ${c.name}, in casa e in trasferta.`,
  };
}
export function standingsMeta(c: Competition) {
  return {
    path: standingsPath(c),
    title: `Classifica ${c.name}`,
    description: `Classifica aggiornata di ${c.name}: punti, partite giocate, vittorie, pareggi, sconfitte e differenza reti.`,
  };
}
/** `predicted`: the model has a prediction for this match (title and description mention it only then). */
export function matchMeta(
  c: Competition,
  m: Match,
  predicted = false,
  video?: { video: string; title: string; published: string },
  venue?: EventVenue | null,
) {
  const teams = `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`;
  const when = `${formatDay(m.utcDate)} ore ${formatTime(m.utcDate)}`;
  const path = matchPath(c, m);
  // while the evergreen page shows this match, it is the canonical URL (the dated page is its future archive)
  const canonical = matchCanonical(c, m);
  const description = isFinished(m)
    ? `Risultato finale di ${teams} (${c.name}), giocata ${when}.`
    : isResultPending(m)
      ? `${teams} (${c.name}), giocata ${when}: risultato in arrivo. Classifica, forma recente e precedenti delle due squadre.`
      : `${teams}, ${c.name}: si gioca ${when}. ${predicted ? "Pronostico con le probabilità 1X2, classifica" : "Classifica"}, forma recente e precedenti delle due squadre.`;
  return {
    path,
    ...(canonical !== path ? { canonical } : {}),
    title: isFinished(m)
      ? `${teams} ${m.score.fullTime.home}-${m.score.fullTime.away}: risultato ${c.name}`
      : `${teams}: ${predicted ? "pronostico, orario e precedenti" : "orario, classifica e precedenti"}`,
    description,
    archive: isFinished(m),
    // the event is described once, on its canonical page
    jsonLd: canonical !== path ? [] : footballEventLd(c, m, path, description, video, venue),
  };
}

function footballEventLd(
  c: Competition,
  m: Match,
  path: string,
  description: string,
  video?: { video: string; title: string; published: string },
  venue?: EventVenue | null,
) {
  const teams = `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`;
  return [
    sportsEvent({
      path,
      name: `${teams} (${c.name})`,
      description,
      startDate: m.utcDate,
      durationMinutes: 115,
      sport: "Calcio",
      venue,
      league: c.name,
      home: { name: m.homeTeam.name, logo: m.homeTeam.crest },
      away: { name: m.awayTeam.name, logo: m.awayTeam.crest },
      status: m.status === "POSTPONED" ? "postponed" : m.status === "CANCELLED" ? "cancelled" : "scheduled",
    }),
    ...(video ? [videoObject(video, `Gli highlights ufficiali di ${teams} (${c.name}).`)] : []),
  ];
}

/**
 * Evergreen event page /pronostici/<lega>/<casa>-<trasferta>. With a meeting still to play it describes that
 * meeting (title aimed at "pronostico <casa> <trasferta>"); resting, it presents the last result and the history.
 * Resting pages are archived by the pre-render, so the URL survives when the fixture leaves the data.
 */
export function eventMeta(
  c: Competition,
  slug: string,
  predicted: (id: number) => boolean = () => false,
  venue?: EventVenue | null,
) {
  const list = pairMatches(c, slug);
  const last = list[list.length - 1];
  if (!last) return null;
  const next = nextOfPair(list);
  const teams = `${last.homeTeam.shortName} – ${last.awayTeam.shortName}`;
  const path = eventPath(c, last);
  if (next) {
    const when = `${formatDay(next.utcDate)} ore ${formatTime(next.utcDate)}`;
    const p = predicted(next.id);
    const description = isResultPending(next)
      ? `${teams} (${c.name}), giocata ${when}: risultato in arrivo. Il pronostico pubblicato prima della partita, classifica e precedenti.`
      : `Pronostico ${teams} (${c.name}), ${when}: ${p ? "probabilità 1X2, Under/Over e Goal calcolate dal modello statistico" : "orario"}, classifica, forma recente e precedenti.`;
    return {
      path,
      event: true,
      title: `Pronostico ${teams}: ${p ? "probabilità, orario e precedenti" : "orario e precedenti"} · ${c.name}`,
      description,
      archive: false,
      jsonLd: footballEventLd(c, next, path, description, undefined, venue),
    };
  }
  const ft = last.score.fullTime;
  return {
    path,
    event: true,
    title: `${teams} (${c.name}): ultimo risultato e precedenti`,
    description: `${teams} in ${c.name}: l'ultima sfida è finita ${ft.home}-${ft.away} (${formatShortDate(last.utcDate)}). Il risultato, i precedenti tra le due squadre e la prossima sfida appena sarà in calendario.`,
    archive: true,
  };
}
