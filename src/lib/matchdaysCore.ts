// Matchday logic without data imports, shared by the pages (which load one competition, src/lib/footballData.ts)
// and by the route list (src/lib/matchdays.ts, which has the whole snapshot).
import { formatDay, isFinished, isMatchdayStage, matchdayPath, matchPath, type Competition, type Match } from "./footballCore";
import type { RouteMeta } from "../routes";

export interface Matchday {
  n: number;
  stage: string;
  matches: Match[];
}

/** Share of a full round the snapshot must hold before the round gets a page. */
const MIN_COVERAGE = 0.7;

const cache = new WeakMap<Competition, Matchday[]>();
export function matchdaysOf(c: Competition): Matchday[] {
  const hit = cache.get(c);
  if (hit) return hit;
  const by = new Map<number, Matchday>();
  for (const m of c.matches) {
    if (!isMatchdayStage(m) || m.status === "CANCELLED") continue;
    const n = m.matchday!;
    let md = by.get(n);
    if (!md) by.set(n, (md = { n, stage: m.stage!, matches: [] }));
    md.matches.push(m);
  }
  const all = [...by.values()];
  const full = Math.max(0, ...all.map((d) => d.matches.length));
  const list = all
    .filter((d) => d.matches.length >= Math.max(2, Math.ceil(full * MIN_COVERAGE)))
    .sort((a, b) => a.n - b.n)
    .map((d) => ({ ...d, matches: [...d.matches].sort((a, b) => a.utcDate.localeCompare(b.utcDate)) }));
  cache.set(c, list);
  return list;
}

/** The round to point visitors to: the one with most matches still to play, else the last one. */
export function featuredMatchday(c: Competition) {
  const list = matchdaysOf(c);
  // a single postponed match does not keep an old round in front
  const open = (d: Matchday) => d.matches.filter((m) => !isFinished(m) && m.status !== "POSTPONED").length;
  const best = list.reduce<Matchday | undefined>((b, d) => (open(d) > (b ? open(b) : 0) ? d : b), undefined);
  return best ?? list[list.length - 1];
}

export const matchdayLabel = (d: Matchday) =>
  d.stage === "LEAGUE_STAGE" ? `fase campionato, ${d.n}ª giornata` : `${d.n}ª giornata`;

export function matchdayDates(d: Matchday) {
  const a = formatDay(d.matches[0].utcDate);
  const b = formatDay(d.matches[d.matches.length - 1].utcDate);
  return a === b ? a : `da ${a} a ${b}`;
}

/** `isPredicted`: whether the model has a prediction for a match (the description counts them). */
export function matchdayMeta(c: Competition, d: Matchday, isPredicted: (id: number) => boolean): RouteMeta {
  const done = d.matches.every(isFinished);
  const predicted = d.matches.filter((m) => isPredicted(m.id)).length;
  const label = matchdayLabel(d);
  return {
    path: matchdayPath(c, d.n),
    title: done
      ? `${c.name}, ${label}: risultati e pronostici a confronto`
      : `Pronostici ${c.name}, ${label}: le probabilità di ogni partita`,
    description: done
      ? `Risultati della ${label} di ${c.name} confrontati con le probabilità che il modello statistico aveva calcolato prima di ogni partita.`
      : `Pronostici della ${label} di ${c.name}: probabilità 1X2, Under/Over e Goal per ${predicted || d.matches.length} partite, con i dati che li spiegano. ${matchdayDates(d)}.`,
    archive: done,
    jsonLd: [
      {
        "@type": "ItemList",
        name: `${c.name}, ${label}`,
        itemListElement: d.matches.map((m, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`,
          url: matchPath(c, m),
        })),
      },
    ],
  };
}
