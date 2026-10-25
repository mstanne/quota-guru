// Details of finished matches from API-Sports (scripts/fetch-match-details.mjs): football events, line-ups,
// statistics and top-rated player; NBA player box scores. Types and helpers only: the data is imported by
// footballDetails.ts and basketDetails.ts, so each match page loads only its own sport.

export type Side = "home" | "away";

export interface TimelineEvent {
  minute: number;
  extra: number | null;
  side: Side;
  /** goal | card | sub | var */
  type: string;
  /** e.g. "Normal Goal", "Own Goal", "Penalty", "Missed Penalty", "Yellow Card", "Red Card", "Substitution 1" */
  detail: string;
  player: string | null;
  /** assist for goals, player coming in for substitutions */
  other: string | null;
  comment: string | null;
}
export interface LineupPlayer {
  name: string;
  number: number | null;
  pos: string | null;
}
export interface Lineup {
  formation: string | null;
  coach: string | null;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}
export interface FootballDetails {
  venue: string | null;
  city: string | null;
  referee: string | null;
  timeline: TimelineEvent[];
  lineups: Partial<Record<Side, Lineup>>;
  stats: Partial<Record<Side, Record<string, number | null>>>;
  top: { name: string; side: Side; rating: number; goals: number; assists: number; minutes: number | null } | null;
}

export interface NbaPlayerLine {
  name: string;
  pos: string | null;
  min: string | null;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  pm: number | null;
}
export interface NbaDetails {
  arena: string | null;
  city: string | null;
  players: Record<Side, NbaPlayerLine[]>;
}

// ---------- football helpers ----------
export const isGoal = (e: TimelineEvent) => e.type === "goal" && e.detail !== "Missed Penalty";

/**
 * Goals with the running score. Sources differ on which team an own goal is filed under: the reading that
 * reproduces the final score (90' + extra time) is used.
 */
export function goalsWithScore(d: FootballDetails, final: { home: number | null; away: number | null }) {
  const goals = d.timeline.filter(isGoal);
  const run = (ownToOpponent: boolean) => {
    let h = 0;
    let a = 0;
    return goals.map((e) => {
      const flip = ownToOpponent && e.detail === "Own Goal";
      const side: Side = flip ? (e.side === "home" ? "away" : "home") : e.side;
      if (side === "home") h++;
      else a++;
      return { event: e, side, score: `${h}-${a}`, h, a };
    });
  };
  const plain = run(false);
  const last = plain.at(-1);
  if (!last || (last.h === final.home && last.a === final.away)) return plain;
  const flipped = run(true);
  const end = flipped.at(-1)!;
  return end.h === final.home && end.a === final.away ? flipped : plain;
}

/** Statistic labels in Italian, in display order (API-Football names). */
export const FOOTBALL_STATS: [string, string, "pct" | "dec" | "int"][] = [
  ["Ball Possession", "Possesso palla", "pct"],
  ["expected_goals", "Expected goals (xG)", "dec"],
  ["Total Shots", "Tiri totali", "int"],
  ["Shots on Goal", "Tiri in porta", "int"],
  ["Shots off Goal", "Tiri fuori", "int"],
  ["Blocked Shots", "Tiri respinti", "int"],
  ["Shots insidebox", "Tiri dentro l'area", "int"],
  ["Shots outsidebox", "Tiri da fuori area", "int"],
  ["Corner Kicks", "Calci d'angolo", "int"],
  ["Offsides", "Fuorigioco", "int"],
  ["Fouls", "Falli", "int"],
  ["Yellow Cards", "Ammonizioni", "int"],
  ["Red Cards", "Espulsioni", "int"],
  ["Goalkeeper Saves", "Parate", "int"],
  ["Total passes", "Passaggi", "int"],
  ["Passes accurate", "Passaggi riusciti", "int"],
  ["Passes %", "Precisione passaggi", "pct"],
];

// ---------- NBA helpers ----------
/** Hollinger's Game Score: one number for a player's box-score line. */
export const gameScore = (p: NbaPlayerLine) =>
  p.pts + 0.4 * p.fgm - 0.7 * p.fga - 0.4 * (p.fta - p.ftm) + 0.7 * p.oreb + 0.3 * p.dreb + p.stl + 0.7 * p.ast +
  0.7 * p.blk - 0.4 * p.pf - p.tov;

export function nbaTotals(lines: NbaPlayerLine[]) {
  const sum = (k: keyof NbaPlayerLine) => lines.reduce((t, p) => t + (Number(p[k]) || 0), 0);
  return {
    pts: sum("pts"),
    fgm: sum("fgm"),
    fga: sum("fga"),
    tpm: sum("tpm"),
    tpa: sum("tpa"),
    ftm: sum("ftm"),
    fta: sum("fta"),
    oreb: sum("oreb"),
    dreb: sum("dreb"),
    reb: sum("reb"),
    ast: sum("ast"),
    stl: sum("stl"),
    blk: sum("blk"),
    tov: sum("tov"),
    pf: sum("pf"),
  };
}

/** Best Game Score of the match (ties: the winning side's player). */
export function nbaTopPlayer(d: NbaDetails, winner: Side | null) {
  let best: { line: NbaPlayerLine; side: Side; score: number } | null = null;
  for (const side of ["home", "away"] as Side[]) {
    for (const line of d.players[side] ?? []) {
      const score = gameScore(line);
      if (!best || score > best.score || (score === best.score && side === winner)) best = { line, side, score };
    }
  }
  return best;
}
