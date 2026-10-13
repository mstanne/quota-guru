// Football types and pure helpers (URLs, formatting, standings maths).
// No data import here, so components that only format matches do not pull the full snapshot into their JS chunk.

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
  "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "SUSPENDED" | "POSTPONED" | "CANCELLED" | "AWARDED";
export interface Match {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string | null;
  group: string | null;
  homeTeam: Team;
  awayTeam: Team;
  score: { winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null; fullTime: Score; halfTime: Score };
  referee: string | null;
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

/** Stable slug per match, e.g. "inter-juventus-2026-10-18". */
export function matchSlug(m: Match) {
  return `${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`;
}
/** Minimal competition info needed to build URLs and labels. */
export type CompetitionRef = Pick<Competition, "code" | "slug" | "name">;

export const competitionPath = (c: CompetitionRef) => `/calcio/${c.slug}`;
export const standingsPath = (c: CompetitionRef) => `/calcio/${c.slug}/classifica`;
export const matchPath = (c: CompetitionRef, m: Match) => `/calcio/${c.slug}/${matchSlug(m)}`;

// ---------- status & formatting ----------
export const isFinished = (m: Match) => m.status === "FINISHED" || m.status === "AWARDED";
export const isUpcoming = (m: Match) => m.status === "SCHEDULED" || m.status === "TIMED";
export const isLive = (m: Match) => m.status === "IN_PLAY" || m.status === "PAUSED";

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
    title: `${c.name}: calendario e risultati`,
    description: `Calendario, orari e risultati delle partite di ${c.name}${c.area ? ` (${c.area})` : ""}, con classifica aggiornata.`,
  };
}
export function standingsMeta(c: Competition) {
  return {
    path: standingsPath(c),
    title: `Classifica ${c.name}`,
    description: `Classifica aggiornata di ${c.name}: punti, partite giocate, vittorie, pareggi, sconfitte e differenza reti.`,
  };
}
export function matchMeta(c: Competition, m: Match) {
  const teams = `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`;
  const when = `${formatDay(m.utcDate)} ore ${formatTime(m.utcDate)}`;
  return {
    path: matchPath(c, m),
    title: isFinished(m)
      ? `${teams} ${m.score.fullTime.home}-${m.score.fullTime.away}: risultato ${c.name}`
      : `${teams}: orario, classifica e precedenti`,
    description: isFinished(m)
      ? `Risultato finale di ${teams} (${c.name}), giocata ${when}.`
      : `${teams}, ${c.name}: si gioca ${when}. Classifica, forma recente e precedenti delle due squadre.`,
  };
}
