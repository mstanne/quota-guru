// End-of-season projection of the leagues (scripts/lib/season-sim.mjs, written by scripts/predict-football.mjs):
// for every team the expected final points and the share of simulated seasons ending in each position.
// Shown on the standings pages (src/components/calcio/SeasonOutlook.tsx) and on the club pages.
import data from "../data/football-season-sim.json";
import { teamName } from "./teamDisplay.mjs";

interface TeamSim {
  xpts: number;
  /** pos[i] = share of simulated seasons ending in position i + 1 */
  pos: number[];
  /** European cups (kind "uefa"): share reaching 0 top 8, 1 top 24, 2 round of 16, 3 quarter-finals, 4 semi-finals,
   *  5 final, 6 winner (scripts/lib/uefa-sim.mjs) */
  stage?: number[];
  /** matches played with xG: [points expected from the xG, real points in the same matches, matches] */
  xg?: [number, number, number];
  /** matches still to play: points per match an average team would expect in the same fixtures (lower = harder) */
  sched?: number;
}
interface CompetitionSim {
  remaining: number;
  /** "uefa": league phase of a European cup, knockout rounds included */
  kind?: "uefa";
  teams: Record<string, TeamSim>;
}
const sim = data as unknown as {
  generatedAt: string | null;
  runs: number;
  competitions: Record<string, CompetitionSim>;
  /** strength ranking: teamId → [expected goals for, against, league slug, short name] against a reference team,
   *  neutral ground */
  ranking?: Record<string, [number, number, string, string]>;
};

export const simGeneratedAt = sim.generatedAt;

/** Strength ranking of the clubs (model ratings), strongest first. */
let rankingCache: { id: number; name: string; gf: number; ga: number; gd: number; league: string }[] | null = null;
export function strengthRanking() {
  return (rankingCache ??= Object.entries(sim.ranking ?? {})
    .map(([id, [gf, ga, league, name]]) => ({ id: Number(id), name, gf, ga, gd: Math.round((gf - ga) * 100) / 100, league }))
    .sort((a, b) => b.gd - a.gd || b.gf - a.gf));
}
/** Place of a club in the strength ranking (overall and in its league), or null. */
export function strengthOf(id: number) {
  const all = strengthRanking();
  const i = all.findIndex((t) => t.id === id);
  if (i < 0) return null;
  const t = all[i];
  const inLeague = all.filter((x) => x.league === t.league);
  return { ...t, rank: i + 1, of: all.length, leagueRank: inLeague.findIndex((x) => x.id === id) + 1, leagueOf: inLeague.length };
}

/** Expected points from xG and schedule difficulty of a league (null without data). */
export function leagueXg(slug: string) {
  const c = sim.competitions[slug];
  if (!c || c.kind === "uefa") return null;
  const teams = Object.entries(c.teams).filter(([, t]) => t.xg || t.sched != null);
  if (!teams.length) return null;
  // schedule rank: 1 = hardest (lowest points per match for an average team)
  const hard = teams
    .filter(([, t]) => t.sched != null)
    .sort((a, b) => a[1].sched! - b[1].sched!)
    .map(([id]) => id);
  return {
    team: (id: number) => {
      const t = c.teams[String(id)];
      if (!t) return null;
      const r = hard.indexOf(String(id));
      return { xg: t.xg ?? null, sched: t.sched ?? null, schedRank: r >= 0 ? r + 1 : null, of: hard.length };
    },
  };
}

/** A group of positions with the same meaning: from/to are 1-based, negative counts from the bottom (-1 = last). */
export interface Zone {
  key: string;
  /** column header */
  short: string;
  /** "vince lo scudetto", "va in Champions League": phrase after the team name */
  phrase: string;
  from: number;
  to: number;
  tone: "top" | "europe" | "bottom";
}

const title = (phrase: string): Zone => ({ key: "titolo", short: "1° posto", phrase, from: 1, to: 1, tone: "top" });
const top = (n: number, phrase: string): Zone => ({ key: `primi-${n}`, short: `Primi ${n}`, phrase, from: 1, to: n, tone: "europe" });
const bottom = (n: number, phrase = "retrocede"): Zone => ({ key: `ultimi-${n}`, short: `Ultimi ${n}`, phrase, from: -n, to: -1, tone: "bottom" });

/**
 * Zones of each league, by its rules (direct places only: play-offs and play-outs are not simulated).
 * The European places of a league can change with the UEFA ranking; these are the usual ones.
 */
const ZONES: Record<string, { zones: Zone[]; note: string }> = {
  "serie-a": {
    zones: [title("vince lo scudetto"), top(4, "chiude tra le prime 4"), bottom(3)],
    note: "In Serie A le prime 4 vanno di solito in Champions League; retrocedono le ultime 3.",
  },
  "serie-b": {
    zones: [
      { key: "promozione", short: "Primi 2", phrase: "è promossa direttamente", from: 1, to: 2, tone: "top" },
      { key: "playoff", short: "3°-8°", phrase: "va ai playoff", from: 3, to: 8, tone: "europe" },
      bottom(3, "retrocede direttamente"),
    ],
    note: "In Serie B le prime 2 sono promosse direttamente, dalla 3ª all'8ª si giocano i playoff; le ultime 3 retrocedono direttamente (16ª e 17ª al playout, non simulato).",
  },
  "premier-league": {
    zones: [title("vince la Premier League"), top(4, "chiude tra le prime 4"), bottom(3)],
    note: "In Premier League le prime 4 vanno di solito in Champions League; retrocedono le ultime 3.",
  },
  liga: {
    zones: [title("vince la Liga"), top(4, "chiude tra le prime 4"), bottom(3)],
    note: "Nella Liga le prime 4 vanno di solito in Champions League; retrocedono le ultime 3.",
  },
  bundesliga: {
    zones: [title("vince la Bundesliga"), top(4, "chiude tra le prime 4"), bottom(2, "retrocede direttamente")],
    note: "In Bundesliga le prime 4 vanno di solito in Champions League; le ultime 2 retrocedono direttamente (la 16ª va allo spareggio, non simulato).",
  },
  "ligue-1": {
    zones: [title("vince la Ligue 1"), top(3, "chiude tra le prime 3"), bottom(2, "retrocede direttamente")],
    note: "In Ligue 1 le prime 3 vanno di solito in Champions League; le ultime 2 retrocedono direttamente (la 16ª va allo spareggio, non simulato).",
  },
  eredivisie: {
    zones: [title("vince l'Eredivisie"), top(2, "chiude tra le prime 2"), bottom(2, "retrocede direttamente")],
    note: "In Eredivisie le ultime 2 retrocedono direttamente (la 16ª va ai playoff, non simulati).",
  },
  "primeira-liga": {
    zones: [title("vince la Primeira Liga"), top(2, "chiude tra le prime 2"), bottom(2, "retrocede direttamente")],
    note: "In Primeira Liga le ultime 2 retrocedono direttamente (la 16ª va allo spareggio, non simulato).",
  },
  championship: {
    zones: [
      { key: "promozione", short: "Primi 2", phrase: "è promossa direttamente", from: 1, to: 2, tone: "top" },
      { key: "playoff", short: "3°-6°", phrase: "va ai playoff", from: 3, to: 6, tone: "europe" },
      bottom(3),
    ],
    note: "In Championship le prime 2 salgono in Premier League, dalla 3ª alla 6ª si giocano i playoff; retrocedono le ultime 3.",
  },
  "champions-league": {
    zones: [
      { key: "top-8", short: "Primi 8", phrase: "va direttamente agli ottavi", from: 1, to: 8, tone: "top" },
      { key: "playoff", short: "9°-24°", phrase: "va ai playoff", from: 9, to: 24, tone: "europe" },
      { key: "fuori", short: "Eliminata", phrase: "è eliminata", from: 25, to: 36, tone: "bottom" },
    ],
    note: "Nella fase campionato le prime 8 vanno direttamente agli ottavi, dalla 9ª alla 24ª ai playoff; dalla 25ª in giù si esce dalle coppe.",
  },
  "europa-league": {
    zones: [
      { key: "top-8", short: "Primi 8", phrase: "va direttamente agli ottavi", from: 1, to: 8, tone: "top" },
      { key: "playoff", short: "9°-24°", phrase: "va ai playoff", from: 9, to: 24, tone: "europe" },
      { key: "fuori", short: "Eliminata", phrase: "è eliminata", from: 25, to: 36, tone: "bottom" },
    ],
    note: "Nella fase campionato le prime 8 vanno direttamente agli ottavi, dalla 9ª alla 24ª ai playoff; dalla 25ª in giù si esce dalle coppe.",
  },
  "conference-league": {
    zones: [
      { key: "top-8", short: "Primi 8", phrase: "va direttamente agli ottavi", from: 1, to: 8, tone: "top" },
      { key: "playoff", short: "9°-24°", phrase: "va ai playoff", from: 9, to: 24, tone: "europe" },
      { key: "fuori", short: "Eliminata", phrase: "è eliminata", from: 25, to: 36, tone: "bottom" },
    ],
    note: "Nella fase campionato le prime 8 vanno direttamente agli ottavi, dalla 9ª alla 24ª ai playoff; dalla 25ª in giù si è eliminati.",
  },
  brasileirao: {
    zones: [title("vince il Brasileirão"), top(4, "chiude tra le prime 4"), bottom(4)],
    note: "Nel Brasileirão le prime 4 vanno di solito in Copa Libertadores; retrocedono le ultime 4.",
  },
};

/** Knockout stages of a European cup projection (index in TeamSim.stage). */
export const CUP_STAGES = [
  { i: 2, short: "Ottavi", long: "arriva agli ottavi" },
  { i: 3, short: "Quarti", long: "arriva ai quarti" },
  { i: 4, short: "Semifinale", long: "arriva in semifinale" },
  { i: 5, short: "Finale", long: "arriva in finale" },
  { i: 6, short: "Vince", long: "vince la coppa" },
] as const;

export interface TeamOutlook {
  xpts: number;
  pos: number[];
  stage?: number[];
  /** most likely final position (1-based) */
  likely: number;
  zones: { zone: Zone; p: number }[];
}

export interface LeagueOutlook {
  remaining: number;
  /** European cup: league phase and knockout rounds (TeamOutlook.stage) */
  cup: boolean;
  runs: number;
  zones: Zone[];
  note: string;
  team: (id: number) => TeamOutlook | null;
}

function zoneP(pos: number[], z: Zone) {
  const n = pos.length;
  const from = z.from < 0 ? n + z.from + 1 : z.from;
  const to = z.to < 0 ? n + z.to + 1 : z.to;
  let p = 0;
  for (let i = from; i <= to; i++) p += pos[i - 1] ?? 0;
  return p;
}

/** Projection of a league, or null (not simulated: cups, lower divisions, a season not under way). */
export function leagueOutlook(slug: string): LeagueOutlook | null {
  const c = sim.competitions[slug];
  const def = ZONES[slug];
  if (!c || !def || c.remaining === 0) return null;
  return {
    remaining: c.remaining,
    cup: c.kind === "uefa",
    runs: sim.runs,
    zones: def.zones,
    note: def.note,
    team: (id) => {
      const t = c.teams[String(id)];
      if (!t) return null;
      const likely = t.pos.indexOf(Math.max(...t.pos)) + 1;
      return { ...t, likely, zones: def.zones.map((zone) => ({ zone, p: zoneP(t.pos, zone) })) };
    },
  };
}

/** "63%", "<1%", ">99%", "–" (never in the simulated seasons). */
export function pct(p: number) {
  if (p <= 0) return "–";
  if (p < 0.005) return "<1%";
  if (p > 0.995 && p < 1) return ">99%";
  return `${Math.round(p * 100)}%`;
}

/** What the first zone is called in a sentence ("Probabilità scudetto: …"). */
const FIRST_ZONE_NOUN: Record<string, string> = { "serie-a": "scudetto", "serie-b": "promozione diretta", championship: "promozione diretta" };

/**
 * One sentence for the description of the standings page ("Probabilità scudetto secondo il modello: Inter 63%,
 * Roma 19%"): the two teams most often in the first zone. Null without a projection.
 */
export function outlookSentence(slug: string, table: { team: { id: number; shortName: string } }[]) {
  const o = leagueOutlook(slug);
  if (!o) return null;
  if (o.cup) {
    const win = table
      .map((r) => ({ name: teamName(r.team), p: o.team(r.team.id)?.stage?.[6] ?? 0 }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 2)
      .filter((x) => x.p > 0);
    return win.length ? `Chi vince la coppa secondo il modello: ${win.map((x) => `${x.name} ${pct(x.p)}`).join(", ")}` : null;
  }
  const best = table
    .map((r) => ({ name: teamName(r.team), p: o.team(r.team.id)?.zones[0]?.p ?? 0 }))
    .sort((a, b) => b.p - a.p)
    .filter((x, i) => x.p > 0 && (i === 0 || x.p >= 0.05))
    .slice(0, 2);
  if (!best.length) return null;
  return `Probabilità ${FIRST_ZONE_NOUN[slug] ?? "titolo"} secondo il modello: ${best.map((x) => `${x.name} ${pct(x.p)}`).join(", ")}`;
}
