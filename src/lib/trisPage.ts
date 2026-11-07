// /pronostici/tris – the threes ("tris"): every week the three matches where the football model is most sure of one
// outcome (weekend: top five leagues; one per European cup), the chance that all three come in, and how each one went.
// Data: src/data/tris.json (scripts/derive-tris.mjs; rules in scripts/lib/tris.mjs, shared with the Telegram channel).
import raw from "../data/tris.json";
import type { RouteMeta } from "../routes";

export const TRIS_PATH = "/pronostici/tris";

export interface TrisPick {
  id: number;
  kickoff: string;
  label: string;
  where: string;
  path: string;
  /** 0 = 1, 1 = X, 2 = 2 */
  index: number;
  sign: string;
  outcome: string;
  /** probability of that outcome when the three was published */
  p: number;
  /** "2-1" once played */
  result: string | null;
  hit: boolean | null;
  void: boolean;
}
export interface Tris {
  id: string;
  slug: string;
  title: string;
  /** Rome day of publication, "2026-11-07" */
  day: string;
  locked: string;
  /** probability that all three come in (product) */
  all: number;
  picks: TrisPick[];
  hits: number;
  status: "in-attesa" | "in-corso" | "concluso";
}
export interface TrisData {
  generatedAt: string | null;
  tris: Tris[];
  stats: { n: number; allThree: number; expected: number; picks: number; pickHits: number };
}
export const trisData = raw as unknown as TrisData;

/** The four kinds, in page order (= scripts/lib/tris.mjs). */
export const TRIS_KINDS = [
  {
    id: "tris-weekend",
    slug: "weekend",
    name: "Weekend",
    title: "Il tris del weekend",
    when: "Esce il sabato mattina, con le partite di sabato e domenica di Serie A, Premier League, LaLiga, Bundesliga e Ligue 1.",
  },
  {
    id: "tris-champions",
    slug: "champions-league",
    name: "Champions League",
    title: "Il tris di Champions",
    when: "Esce il martedì mattina di ogni giornata, con le partite di martedì e mercoledì.",
  },
  {
    id: "tris-europa-league",
    slug: "europa-league",
    name: "Europa League",
    title: "Il tris di Europa League",
    when: "Esce la mattina del primo giorno di ogni giornata.",
  },
  {
    id: "tris-conference",
    slug: "conference-league",
    name: "Conference League",
    title: "Il tris di Conference",
    when: "Esce la mattina del primo giorno di ogni giornata.",
  },
] as const;

export const trisOf = (id: string) => trisData.tris.filter((t) => t.id === id);

/** Plain sentence with the totals (page lead and description); null before the first three is over. */
export function trisLead() {
  const s = trisData.stats;
  if (!s.n) return null;
  return `Su ${s.n} tris conclusi, tutte e tre le partite sono andate come indicato dal modello ${s.allThree} ${s.allThree === 1 ? "volta" : "volte"} (il modello se ne aspettava circa ${Math.round(s.expected)}); prese una per una, ${s.pickHits} su ${s.picks}.`;
}

export function trisMeta(): RouteMeta {
  const lead = trisLead();
  return {
    path: TRIS_PATH,
    title: "Il tris del weekend e delle coppe: le 3 partite più prevedibili",
    description:
      lead ??
      "Ogni settimana le 3 partite più prevedibili secondo il modello statistico, nel weekend e in ogni coppa europea, con la probabilità che si verifichino tutte e tre e com'è andata.",
  };
}
