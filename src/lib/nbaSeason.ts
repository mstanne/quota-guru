// NBA standings and season projection (src/data/nba-season.json, written by scripts/predict-basket.mjs with
// scripts/lib/nba-season-sim.mjs): shown on /basket/nba/classifica, on the team pages and on the game pages.
import data from "../data/nba-season.json";
import { pct } from "./seasonOutlook";

export type Conference = "est" | "ovest";
export interface NbaSim {
  /** expected wins at the end of the regular season */
  xw: number;
  /** seed[i] = share of simulated seasons ending as seed i + 1 of the conference */
  seed: number[];
  /** share of seasons reaching: 0 top 10 (play-in or better), 1 playoffs, 2 conference semifinals, 3 conference
   *  finals, 4 NBA Finals, 5 title */
  stage: number[];
}
export interface NbaStandingRow {
  id: number;
  name: string;
  shortName: string;
  abbr: string;
  conf: Conference | null;
  w: number;
  l: number;
  hw: number;
  hl: number;
  aw: number;
  al: number;
  cw: number;
  cl: number;
  pf: number;
  pa: number;
  last10: [number, number];
  streak: string | null;
  sim?: NbaSim;
}
interface SeasonDoc {
  generatedAt: string | null;
  season: number;
  games: number;
  runs?: number;
  remaining?: number;
  teams: Record<string, NbaStandingRow>;
}
const doc = data as unknown as SeasonDoc;

export const nbaSeasonUpdatedAt = doc.generatedAt;
export const nbaStandingsPath = "/basket/nba/classifica";
export const CONFERENCES: { key: Conference; name: string }[] = [
  { key: "est", name: "Eastern Conference" },
  { key: "ovest", name: "Western Conference" },
];
export const confName = (c: Conference) => (c === "est" ? "Eastern Conference" : "Western Conference");
export const confShort = (c: Conference) => (c === "est" ? "Est" : "Ovest");

const winPct = (r: { w: number; l: number }) => (r.w + r.l ? r.w / (r.w + r.l) : 0);

/** Conference standings: win percentage, then wins, then point differential (the NBA tie-breakers are not applied). */
export function nbaStandings(conf: Conference): (NbaStandingRow & { pos: number; gb: number })[] {
  const rows = Object.values(doc.teams)
    .filter((r) => r.conf === conf)
    .sort((a, b) => winPct(b) - winPct(a) || b.w - a.w || b.pf - b.pa - (a.pf - a.pa) || a.shortName.localeCompare(b.shortName));
  const lead = rows[0];
  return rows.map((r, i) => ({ ...r, pos: i + 1, gb: lead ? (lead.w - r.w + (r.l - lead.l)) / 2 : 0 }));
}

/** True once the season has games: the standings page exists only then. */
export const hasNbaStandings = () => doc.games > 0 && CONFERENCES.every((c) => nbaStandings(c.key).length === 15);
/** True when the projection was computed (remaining schedule available). */
export const hasNbaProjection = () => !!doc.runs && Object.values(doc.teams).some((t) => t.sim);
export const nbaProjectionInfo = () => ({ runs: doc.runs ?? 0, remaining: doc.remaining ?? 0 });

/** Standing of one team in its conference (null without data). */
export function nbaTeamStanding(id: number) {
  const r = doc.teams[String(id)];
  if (!r?.conf) return null;
  return nbaStandings(r.conf).find((x) => x.id === id) ?? null;
}

/** Stages of the projection, as table columns and phrases. */
export const NBA_STAGES = [
  { i: 0, short: "Top 10", long: "almeno il play-in (primi 10 posti)" },
  { i: 1, short: "Playoff", long: "va ai playoff (play-in compreso)" },
  { i: 2, short: "Semifinale conf.", long: "arriva alla semifinale di conference" },
  { i: 3, short: "Finale conf.", long: "arriva alla finale di conference" },
  { i: 4, short: "Finale NBA", long: "arriva alle NBA Finals" },
  { i: 5, short: "Titolo", long: "vince il titolo" },
] as const;

/** Share of seasons ending in the direct playoff places (seeds 1-6) and in the play-in (7-10). */
export function seedZones(s: NbaSim) {
  const sum = (from: number, to: number) => s.seed.slice(from - 1, to).reduce((a, b) => a + b, 0);
  return { top6: sum(1, 6), playIn: sum(7, 10), out: sum(11, 15), likely: s.seed.indexOf(Math.max(...s.seed)) + 1 };
}

/** "Probabilità titolo NBA secondo il modello: Celtics 24%, Spurs 22%" (null without the projection). */
export function nbaTitleSentence() {
  if (!hasNbaProjection()) return null;
  const best = Object.values(doc.teams)
    .filter((t) => t.sim)
    .sort((a, b) => b.sim!.stage[5] - a.sim!.stage[5])
    .slice(0, 3);
  return `Probabilità titolo NBA secondo il modello: ${best.map((t) => `${t.shortName} ${pct(t.sim!.stage[5])}`).join(", ")}`;
}

export const fmtRecord = (w: number, l: number) => `${w}-${l}`;
export const fmtPct = (r: { w: number; l: number }) => (r.w + r.l ? `${(winPct(r) * 100).toFixed(1).replace(".", ",")}%` : "–");
export const fmtGb = (gb: number) => (gb === 0 ? "–" : String(gb).replace(".", ","));

export function nbaStandingsMeta() {
  const label = `${doc.season}-${String(doc.season + 1).slice(2)}`;
  const leaders = CONFERENCES.map((c) => nbaStandings(c.key)[0])
    .filter(Boolean)
    .map((r, i) => `${r.shortName} prima a ${CONFERENCES[i].key === "est" ? "Est" : "Ovest"} (${r.w}-${r.l})`);
  const title = nbaTitleSentence();
  return {
    path: nbaStandingsPath,
    title: `Classifica NBA ${label}: Est, Ovest${hasNbaProjection() ? " e probabilità playoff" : " e record"}`,
    description: [
      `Classifica NBA ${label} aggiornata, Eastern e Western Conference${leaders.length ? `: ${leaders.join(", ")}` : ""}.`,
      title ? `${title}.` : null,
      hasNbaProjection() ? "Vittorie attese, play-in e playoff simulati." : "Record in casa e trasferta, ultime 10 e serie.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}
