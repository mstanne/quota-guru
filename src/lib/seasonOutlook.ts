// End-of-season projection of the leagues (scripts/lib/season-sim.mjs, written by scripts/predict-football.mjs):
// for every team the expected final points and the share of simulated seasons ending in each position.
// Shown on the standings pages (src/components/calcio/SeasonOutlook.tsx) and on the club pages.
import data from "../data/football-season-sim.json";

interface TeamSim {
  xpts: number;
  /** pos[i] = share of simulated seasons ending in position i + 1 */
  pos: number[];
}
interface CompetitionSim {
  remaining: number;
  teams: Record<string, TeamSim>;
}
const sim = data as unknown as { generatedAt: string | null; runs: number; competitions: Record<string, CompetitionSim> };

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
  brasileirao: {
    zones: [title("vince il Brasileirão"), top(4, "chiude tra le prime 4"), bottom(4)],
    note: "Nel Brasileirão le prime 4 vanno di solito in Copa Libertadores; retrocedono le ultime 4.",
  },
};

export interface TeamOutlook {
  xpts: number;
  pos: number[];
  /** most likely final position (1-based) */
  likely: number;
  zones: { zone: Zone; p: number }[];
}

export interface LeagueOutlook {
  remaining: number;
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
  const best = table
    .map((r) => ({ name: r.team.shortName, p: o.team(r.team.id)?.zones[0]?.p ?? 0 }))
    .sort((a, b) => b.p - a.p)
    .filter((x, i) => x.p > 0 && (i === 0 || x.p >= 0.05))
    .slice(0, 2);
  if (!best.length) return null;
  return `Probabilità ${FIRST_ZONE_NOUN[slug] ?? "titolo"} secondo il modello: ${best.map((x) => `${x.name} ${pct(x.p)}`).join(", ")}`;
}
