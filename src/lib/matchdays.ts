// Matchday pages: one page per round of a league phase (/calcio/serie-a/giornata/12) with the model's
// probabilities for every match. Generated from the snapshot; a round is published only when the snapshot holds
// most of its matches (the data window can cut the first and last rounds), and is archived once all are played.
import { competitions, findCompetition } from "./football";
import {
  formatDay,
  isFinished,
  isMatchdayStage,
  matchdayPath,
  matchPath,
  type Competition,
  type Match,
} from "./footballCore";
import { predictionFor } from "./predictions";
import type { RouteMeta } from "../routes";

export interface Matchday {
  n: number;
  stage: string;
  matches: Match[];
}

/** Share of a full round the snapshot must hold before the round gets a page. */
const MIN_COVERAGE = 0.7;

const cache = new Map<string, Matchday[]>();
export function matchdaysOf(c: Competition): Matchday[] {
  const hit = cache.get(c.slug);
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
  cache.set(c.slug, list);
  return list;
}

export function findMatchday(slug?: string, n?: string) {
  const competition = findCompetition(slug);
  const num = Number(n);
  const matchday = competition && /^\d+$/.test(n ?? "") ? matchdaysOf(competition).find((d) => d.n === num) : undefined;
  return { competition, matchday };
}

/** The round to point visitors to: the one with most matches still to play, else the last one. */
export function featuredMatchday(c: Competition) {
  const list = matchdaysOf(c);
  // the round with most matches still to play (a single postponed match does not keep an old round in front)
  const open = (d: Matchday) => d.matches.filter((m) => !isFinished(m) && m.status !== "POSTPONED").length;
  const best = list.reduce<Matchday | undefined>((b, d) => (open(d) > (b ? open(b) : 0) ? d : b), undefined);
  return best ?? list[list.length - 1];
}

export const matchdayLabel = (d: Matchday) =>
  d.stage === "LEAGUE_STAGE" ? `fase campionato, ${d.n}ª giornata` : `${d.n}ª giornata`;

export function matchdayDates(d: Matchday) {
  const first = d.matches[0].utcDate;
  const last = d.matches[d.matches.length - 1].utcDate;
  const a = formatDay(first);
  const b = formatDay(last);
  return a === b ? a : `da ${a} a ${b}`;
}

export function matchdayMeta(c: Competition, d: Matchday): RouteMeta {
  const done = d.matches.every(isFinished);
  const path = matchdayPath(c, d.n);
  const predicted = d.matches.filter((m) => predictionFor(m.id)).length;
  const label = matchdayLabel(d);
  return {
    path,
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

export function matchdayRoutes(): RouteMeta[] {
  return competitions.flatMap((c) => matchdaysOf(c).map((d) => matchdayMeta(c, d)));
}
