// /pronostici/under-over, /pronostici/goal-no-goal, /pronostici/multigol – the matches of the next days ranked by
// the model's probability of one market (Over 2,5, Goal, a multigoal range), and how often outcomes the model
// rated that likely came true in the matches already played. Informative pages: no bet slip, no operator links.
// Like the day pages (src/lib/dayPages.ts) they read the whole snapshot and are rebuilt with every data update.
import { allMatches, formatDay, formatTime, isFinished, isUpcoming, matchHref, referenceTime, type Competition, type Match } from "./football";
import { predictionFor } from "./predictions";
import { goalDistributions, LIST_MULTIGOAL, multigoal, type Prediction } from "./predictionsCore";
import type { RouteMeta } from "../routes";

export type MarketKey = "under-over" | "goal-no-goal" | "multigol";
export const MARKET_KEYS: MarketKey[] = ["under-over", "goal-no-goal", "multigol"];
export const marketPath = (k: MarketKey) => `/pronostici/${k}`;

/** Days ahead covered by the lists. */
export const WINDOW_DAYS = 7;
/** Matches per list (multigoal has three lists one under the other: shorter). */
const LIST_SIZE: Record<MarketKey, number> = { "under-over": 10, "goal-no-goal": 10, multigol: 6 };
/** Probability from which a past outcome counts in the record ("the model rated it likely"). */
export const RECORD_THRESHOLD = 0.6;
/** Graded matches needed before the record is shown. */
const MIN_RECORD = 30;

/** One side of a market: its probability and whether it happened, from a prediction and a final score. */
interface Side {
  id: string;
  /** List heading, e.g. "Over 2,5". */
  name: string;
  /** What it means, for the list intro and screen readers. */
  meaning: string;
  prob: (p: Prediction) => number;
  hit: (home: number, away: number) => boolean;
  /** Matches that can enter the list (multigoal: those whose most likely range is this one). Default: all. */
  eligible?: (p: Prediction) => boolean;
  /** Probability from which a finished match counts in the record. */
  recordFrom: number;
}

/** Multigoal: the most likely of the three ranges of the match lists (1-3, 2-4, 3-5). */
function bestRange(p: Prediction) {
  const t = goalDistributions(p).t;
  return LIST_MULTIGOAL.map(([lo, hi]) => ({ lo, hi, p: multigoal(t, lo, hi) })).reduce((a, b) => (b.p > a.p ? b : a));
}

/** One list per multigoal range: the matches where that range is the most likely, graded on all of them (the
 *  ranges rarely pass 70%, so a threshold would leave out the 3-5 matches). */
const multigoalSide = ([lo, hi]: [number, number]): Side => ({
  id: `mg${lo}-${hi}`,
  name: `Multigol ${lo}-${hi}`,
  meaning: `da ${lo} a ${hi} gol in totale tra le due squadre`,
  prob: (p) => multigoal(goalDistributions(p).t, lo, hi),
  hit: (h, a) => h + a >= lo && h + a <= hi,
  eligible: (p) => bestRange(p).lo === lo,
  recordFrom: 0,
});

/** Competitions left out of the lists and of the record: friendlies (rotations, youth teams). */
const EXCLUDED = new Set(["amichevoli-nazionali"]);

const total = (p: Prediction) => p.xg[0] + p.xg[1];

interface MarketDef {
  title: string;
  h1: string;
  /** Opening of the meta description. */
  lead: string;
  intro: string;
  sides: Side[];
}

export const MARKETS: Record<MarketKey, MarketDef> = {
  "under-over": {
    title: "Pronostici Under/Over 2,5: le partite con più e meno gol",
    h1: "Pronostici Under/Over 2,5",
    lead: "Le partite dei prossimi 7 giorni con l'Over 2,5 e l'Under 2,5 più probabili secondo il modello statistico",
    intro:
      "Le partite dei prossimi giorni ordinate per probabilità di Over 2,5 (almeno 3 gol in totale) e di Under 2,5 (al massimo 2), calcolate dal modello statistico sui gol attesi delle due squadre.",
    sides: [
      { id: "over", name: "Over 2,5", meaning: "almeno 3 gol in totale", prob: (p) => p.over["2.5"], hit: (h, a) => h + a >= 3, recordFrom: RECORD_THRESHOLD },
      { id: "under", name: "Under 2,5", meaning: "al massimo 2 gol in totale", prob: (p) => 1 - p.over["2.5"], hit: (h, a) => h + a <= 2, recordFrom: RECORD_THRESHOLD },
    ],
  },
  "goal-no-goal": {
    title: "Pronostici Goal/No goal: dove segnano entrambe le squadre",
    h1: "Pronostici Goal/No goal",
    lead: "Le partite dei prossimi 7 giorni in cui è più probabile che segnino entrambe le squadre, o che una resti a zero",
    intro:
      "Le partite dei prossimi giorni ordinate per probabilità di Goal (segnano entrambe le squadre) e di No goal (almeno una resta a zero), calcolate dal modello statistico.",
    sides: [
      { id: "goal", name: "Goal", meaning: "segnano entrambe le squadre", prob: (p) => p.btts, hit: (h, a) => h > 0 && a > 0, recordFrom: RECORD_THRESHOLD },
      { id: "nogoal", name: "No goal", meaning: "almeno una squadra non segna", prob: (p) => 1 - p.btts, hit: (h, a) => h === 0 || a === 0, recordFrom: RECORD_THRESHOLD },
    ],
  },
  multigol: {
    title: "Pronostici Multigol 1-3, 2-4 e 3-5: le partite per fascia",
    h1: "Pronostici Multigol",
    lead: "Le partite dei prossimi 7 giorni divise per fascia di gol totali più probabile, 1-3, 2-4 o 3-5, secondo il modello statistico",
    intro:
      "Le partite dei prossimi giorni divise per la fascia di gol totali più probabile tra 1-3, 2-4 e 3-5: partite chiuse, equilibrate o da tanti gol, ciascuna con la probabilità della sua fascia.",
    sides: LIST_MULTIGOAL.map(multigoalSide),
  },
};

export interface MarketRow {
  c: Competition;
  m: Match;
  path: string;
  label: string;
  when: string;
  /** probability of the side */
  p: number;
  /** shown under the probability: "Gol attesi 3,1" */
  detail: string;
}

const comma = (x: number) => x.toFixed(1).replace(".", ",");
/** "al 72%", "all'83%", "all'11%" */
const alPct = (x: number) => {
  const v = Math.round(x * 100);
  return `${/^(8|11)/.test(String(v)) ? "all'" : "al "}${v}%`;
};

/** Upcoming matches in the window with a prediction the model rates at least of medium reliability. */
function openMatches() {
  const to = referenceTime + WINDOW_DAYS * 86400000;
  return allMatches.flatMap(({ competition: c, match: m }) => {
    const t = Date.parse(m.utcDate);
    const p = predictionFor(m.id);
    return isUpcoming(m) && t > referenceTime && t <= to && p && !p.pre && p.confidence !== "bassa" && !EXCLUDED.has(c.slug)
      ? [{ c, m, p }]
      : [];
  });
}

export function marketLists(k: MarketKey) {
  const open = openMatches();
  return MARKETS[k].sides.map((side) => {
    const rows: MarketRow[] = open
      .filter(({ p }) => side.eligible?.(p) ?? true)
      .map(({ c, m, p }) => ({
        c,
        m,
        path: matchHref(c, m),
        label: `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`,
        when: `${formatDay(m.utcDate)}, ${formatTime(m.utcDate)}`,
        p: side.prob(p),
        detail: `Gol attesi ${comma(total(p))}`,
      }))
      .sort((a, b) => b.p - a.p || a.m.utcDate.localeCompare(b.m.utcDate))
      .slice(0, LIST_SIZE[k]);
    return { side, rows };
  });
}

export interface MarketRecord {
  side: string;
  n: number;
  hits: number;
  /** mean probability the model gave to those outcomes */
  expected: number;
}

/**
 * How often the outcomes the model rated likely came true (from the side's `recordFrom`, among the matches it could
 * list), over the finished matches of the snapshot. Their predictions are recalculated with the data available
 * before kick-off (as in the track record "ricalcolo"); low-reliability predictions and friendlies are left out, as
 * in the lists.
 */
export function marketRecord(k: MarketKey): MarketRecord[] {
  const out = MARKETS[k].sides.map((s) => ({ side: s.name, n: 0, hits: 0, sum: 0 }));
  for (const { competition: c, match: m } of allMatches) {
    const p = predictionFor(m.id);
    // markets are settled on 90 minutes: the regular-time score of cup ties that went to extra time
    const { home, away } = m.score.regularTime?.home != null ? m.score.regularTime : m.score.fullTime;
    if (!p || !isFinished(m) || p.confidence === "bassa" || EXCLUDED.has(c.slug) || home == null || away == null) continue;
    MARKETS[k].sides.forEach((s, i) => {
      const q = s.prob(p);
      if (q < s.recordFrom || !(s.eligible?.(p) ?? true)) return;
      out[i].n++;
      out[i].sum += q;
      if (s.hit(home, away)) out[i].hits++;
    });
  }
  return out.filter((r) => r.n >= MIN_RECORD).map(({ side, n, hits, sum }) => ({ side, n, hits, expected: sum / n }));
}

export function marketMeta(k: MarketKey): RouteMeta {
  const lists = marketLists(k);
  const n = Math.max(...lists.map((l) => l.rows.length));
  // the list's best row: the most likely of all the lists (multigoal: the clearest range)
  const top = lists.flatMap((l) => l.rows.map((r) => ({ r, name: l.side.name }))).sort((a, b) => b.r.p - a.r.p)[0];
  const d = MARKETS[k];
  return {
    path: marketPath(k),
    title: d.title,
    description: top
      ? `${d.lead}. Il più netto: ${top.name} in ${top.r.label}, ${alPct(top.r.p)}. Con il bilancio delle partite giocate.`
      : `${d.lead}.`,
    // too few matches (international breaks): reachable, kept out of the index until the lists fill up again
    index: n >= 3,
    jsonLd: top
      ? [
          {
            "@type": "ItemList",
            name: d.h1,
            itemListElement: lists.flatMap((l) => l.rows).slice(0, 20).map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.label, url: r.path })),
          },
        ]
      : undefined,
  };
}

export const marketRoutes = (): RouteMeta[] => MARKET_KEYS.map(marketMeta);
