// Tennis data from the BALLDONTLIE snapshot (src/data/tennis.json, refreshed by scripts/fetch-tennis-data.mjs):
// ATP/WTA rankings (top 100) and tournament calendar. Matches are not included in the free plan.
import raw from "../data/tennis.json";
import { referenceTime, romeDay } from "./footballCore";

export type Tour = "atp" | "wta";
export interface TennisPlayer {
  id: number;
  name: string;
  country: string | null;
  countryCode: string | null;
  age: number | null;
}
export interface RankingRow {
  rank: number;
  points: number | null;
  movement: number;
  player: TennisPlayer;
}
export interface Tournament {
  id: number;
  name: string;
  location: string | null;
  surface: string | null;
  category: string | null;
  season: number | null;
  start: string | null;
  end: string | null;
  prizeMoney: number | null;
  prizeCurrency: string | null;
  drawSize: number | null;
}
interface TourData {
  rankingDate: string | null;
  rankings: RankingRow[];
  tournaments: Tournament[];
}
const data = raw as unknown as { generatedAt: string } & Record<Tour, TourData>;

export const tennisUpdatedAt = data.generatedAt;
export const tours: Tour[] = ["atp", "wta"];
export const tourData = (t: Tour): TourData => data[t] ?? { rankingDate: null, rankings: [], tournaments: [] };
export const tourLabel = (t: Tour) => t.toUpperCase();

// ---------- URLs ----------
export const tennisPaths = {
  ranking: (t: Tour) => `/tennis/classifica-${t}`,
  calendar: (t: Tour) => `/tennis/calendario-${t}`,
};

// ---------- labels ----------
const SURFACE: Record<string, { label: string; color: string }> = {
  Hard: { label: "Cemento", color: "#2B5DA8" },
  Clay: { label: "Terra battuta", color: "#C2593A" },
  Grass: { label: "Erba", color: "#3E8E41" },
  Carpet: { label: "Sintetico", color: "#7F93AE" },
};
export const surfaceInfo = (s: string | null) => (s ? SURFACE[s] ?? { label: s, color: "#7F93AE" } : null);
export const categoryLabel = (c: string | null) => (c === "Grand Slam" ? "Grande Slam" : c);

/** Category weight, used to highlight the main tournaments. */
export function categoryRank(c: string | null) {
  if (!c) return 9;
  if (c === "Grand Slam") return 0;
  if (/Finals/i.test(c)) return 1;
  if (/1000/.test(c)) return 2;
  if (/500/.test(c)) return 3;
  if (/250/.test(c)) return 4;
  if (/125/.test(c)) return 5;
  return 6;
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", ...opts }).format(new Date(`${iso}T12:00:00Z`));
export const formatShort = (iso: string) => fmt(iso, { day: "numeric", month: "short" });
export const formatLong = (iso: string) => fmt(iso, { day: "numeric", month: "long", year: "numeric" });
export const monthLabel = (iso: string) => fmt(iso, { month: "long", year: "numeric" });
export const dateRange = (t: Tournament) =>
  t.start && t.end ? `${formatShort(t.start)} – ${formatShort(t.end)}` : t.start ? formatShort(t.start) : "";

export const formatPrize = (t: Tournament) =>
  t.prizeMoney ? `${new Intl.NumberFormat("it-IT").format(t.prizeMoney)} ${t.prizeCurrency ?? ""}`.trim() : null;

// ---------- status (relative to the build time, so server and browser agree) ----------
// The build time, not the snapshot date: if the source stops updating, a tournament whose end date has
// passed still shows as "Concluso". A tournament lasts from its start to its end date (the source's dates).
const today = romeDay(new Date(Math.max(referenceTime, Date.parse(data.generatedAt) || 0)).toISOString());
export type TournamentStatus = "live" | "upcoming" | "finished";
export function tournamentStatus(t: Tournament): TournamentStatus {
  if (t.start && t.start > today) return "upcoming";
  if (t.end && t.end < today) return "finished";
  return "live";
}
export const statusLabel = { live: "In corso", upcoming: "In programma", finished: "Concluso" } as const;

/** Tournaments in progress first, then the next ones. */
export function currentAndNext(t: Tour, limit = 4) {
  const list = tourData(t).tournaments.filter((x) => tournamentStatus(x) !== "finished");
  return [...list]
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "") || categoryRank(a.category) - categoryRank(b.category))
    .slice(0, limit);
}

// ---------- SEO metadata ----------
export const rankingMeta = (t: Tour) => ({
  path: tennisPaths.ranking(t),
  title: `Classifica ${tourLabel(t)} aggiornata: i primi 100`,
  description: `La classifica ${tourLabel(t)} ${t === "atp" ? "maschile" : "femminile"} aggiornata: posizione, punti e variazioni dei primi 100 ${t === "atp" ? "tennisti" : "tenniste"} del mondo.`,
});
export const calendarMeta = (t: Tour) => {
  const seasons = [...new Set(tourData(t).tournaments.map((x) => x.season).filter(Boolean))].join("-");
  return {
    path: tennisPaths.calendar(t),
    title: `Calendario tornei ${tourLabel(t)} ${seasons}`,
    description: `Tutti i tornei del circuito ${tourLabel(t)}: date, sede, superficie, categoria e montepremi, con i tornei in corso e i prossimi in programma.`,
  };
};

export function tennisRoutes() {
  return tours.flatMap((t) => [
    ...(tourData(t).rankings.length ? [rankingMeta(t)] : []),
    ...(tourData(t).tournaments.length ? [calendarMeta(t)] : []),
  ]);
}
