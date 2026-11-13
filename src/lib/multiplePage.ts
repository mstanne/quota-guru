// /pronostici/multiple – the multiples of the day: four accumulators built every day from the football model's
// probabilities (a double and three at fair odds near 2, 5 and 10), the chance that every pick comes in, and how each
// one went. Data: src/data/multiple.json (scripts/derive-multiple.mjs; rules in scripts/lib/multiple.mjs).
import raw from "../data/multiple.json";
import type { RouteMeta } from "../routes";

export const MULTIPLE_PATH = "/pronostici/multiple";

export interface MultiplePick {
  id: number;
  kickoff: string;
  label: string;
  where: string;
  path: string;
  /** Slip key of the outcome (src/lib/footballMarkets.ts): "1", "1X", "over15", "gg"… */
  key: string;
  /** "1X", "Over 1,5", "Goal". */
  sign: string;
  /** "Inter o pareggio". */
  outcome: string;
  /** Probability when the multiple was published. */
  p: number;
  lam?: [number, number, number];
  result: string | null;
  hit: boolean | null;
  void: boolean;
}
export interface Multipla {
  id: string;
  slug: string;
  title: string;
  /** Rome day of publication, "2026-11-13". */
  day: string;
  locked: string;
  /** Probability that every pick comes in (product). */
  all: number;
  picks: MultiplePick[];
  hits: number;
  outcome: "vinta" | "persa" | null;
  status: "in-attesa" | "in-corso" | "concluso";
}
export interface MultipleData {
  generatedAt: string | null;
  multiple: Multipla[];
  stats: Record<string, { n: number; won: number; expected: number }>;
}
export const multipleData = raw as unknown as MultipleData;

/** The kinds, in page order (= scripts/lib/multiple.mjs). */
export const MULTIPLE_KINDS = [
  {
    id: "doppia",
    name: "Doppia",
    title: "La doppia del giorno",
    how: "I due esiti più probabili della giornata, ciascuno sotto l'88%.",
  },
  {
    id: "quota-2",
    name: "Quota 2",
    title: "La multipla a quota 2",
    how: "Esiti di partite diverse finché la quota equa della multipla arriva intorno a 2: di solito tre esiti attorno all'80%.",
  },
  {
    id: "quota-5",
    name: "Quota 5",
    title: "La multipla a quota 5",
    how: "Quota equa intorno a 5: di solito quattro esiti attorno al 67%.",
  },
  {
    id: "quota-10",
    name: "Quota 10",
    title: "La multipla a quota 10",
    how: "Quota equa intorno a 10: di solito cinque esiti attorno al 63%.",
  },
] as const;

/** The latest day with multiples, and the multiples of that day in page order. */
export function latestMultiples(): { day: string | null; list: Multipla[] } {
  const day = multipleData.multiple[0]?.day ?? null;
  return { day, list: day ? multipleData.multiple.filter((m) => m.day === day) : [] };
}
export const pastMultiples = (day: string | null) => multipleData.multiple.filter((m) => m.day !== day);

/** Plain sentence with the totals; null before the first multiple is settled. */
export function multipleLead() {
  const all = Object.values(multipleData.stats);
  const n = all.reduce((s, x) => s + x.n, 0);
  if (!n) return null;
  const won = all.reduce((s, x) => s + x.won, 0);
  const expected = all.reduce((s, x) => s + x.expected, 0);
  return `Su ${n} multiple concluse, ${won} ${won === 1 ? "è andata" : "sono andate"} a segno: il modello se ne aspettava circa ${Math.round(expected)}.`;
}

export function multipleMeta(): RouteMeta {
  return {
    path: MULTIPLE_PATH,
    title: "Multiple del giorno: doppia e multiple a quota 2, 5 e 10 dal modello",
    description:
      multipleLead() ??
      "Ogni giorno una doppia e tre multiple a quota equa 2, 5 e 10 costruite con le probabilità del modello statistico, con la probabilità che entrino e com'è andata ognuna.",
  };
}
