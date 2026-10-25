// Results pages (src/data/results/*.json, built by scripts/derive-results.mjs): every finished match with a page,
// archived ones included. The per-competition files are loaded only by their results page.
import index from "../data/results/index.json";

export interface ResultRow {
  id: number;
  date: string;
  home: { id: number; name: string };
  away: { id: number; name: string };
  score: [number, number];
  path: string;
  post?: boolean;
}
export type FootballResults = { season: number; label: string; rounds: { round: string; matches: ResultRow[] }[] }[];
export type NbaResults = Record<string, { day: string; games: ResultRow[] }[]>;

const idx = index as unknown as {
  football: { slug: string; name: string; count: number }[];
  nba: { month: string; count: number }[];
};
export const resultsIndex = idx;

export const resultsPath = (compSlug: string) => `/calcio/${compSlug}/risultati`;
export const nbaResultsPath = (month?: string) => (month ? `/basket/nba/risultati/${month}` : "/basket/nba/risultati");
export const hasResults = (compSlug: string) => idx.football.some((c) => c.slug === compSlug);

const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
export const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

// ---------- data, loaded on demand ----------
const loaders = import.meta.glob<{ default: FootballResults }>("../data/results/football-*.json");
const nbaLoader = () => import("../data/results/nba.json") as unknown as Promise<{ default: NbaResults }>;
const cache = new Map<string, FootballResults>();
let nbaCache: NbaResults | null = null;

export function loadResults(comp: string): Promise<unknown> {
  if (cache.has(comp)) return Promise.resolve();
  const load = loaders[`../data/results/football-${comp}.json`];
  return load ? load().then((m) => void cache.set(comp, m.default)) : Promise.resolve();
}
export const loadNbaResults = (): Promise<unknown> =>
  nbaCache ? Promise.resolve() : nbaLoader().then((m) => void (nbaCache = m.default));
export const loadAllResults = () =>
  Promise.all([...idx.football.map((c) => loadResults(c.slug)), loadNbaResults()]);

/** The competition's results, or a promise to wait for (Suspense) while they load. */
export function footballResults(comp?: string): FootballResults | null | Promise<unknown> {
  if (!comp || !hasResults(comp)) return null;
  return cache.get(comp) ?? loadResults(comp);
}
export function nbaResults(): NbaResults | Promise<unknown> {
  return nbaCache ?? loadNbaResults();
}

/** Data a URL needs before hydration (see preloadForPath in App.tsx). */
export function preloadResultsData(pathname: string): Promise<unknown> {
  const f = pathname.match(/^\/calcio\/([^/]+)\/risultati$/);
  if (f) return loadResults(f[1]);
  if (/^\/basket\/nba\/risultati(\/[^/]+)?$/.test(pathname)) return loadNbaResults();
  return Promise.resolve();
}

// ---------- routes ----------
export function resultsRoutes() {
  return [
    ...idx.football.map((c) => ({
      path: resultsPath(c.slug),
      title: `Risultati ${c.name}: tutte le partite giocate`,
      description: `I risultati di tutte le partite di ${c.name} giocate, giornata per giornata, con il link alla scheda di ogni partita.`,
    })),
    ...(idx.nba.length
      ? [
          {
            path: nbaResultsPath(),
            title: "Risultati NBA: tutte le partite giocate",
            description: "I risultati delle partite NBA mese per mese, in orario italiano, con il link alla scheda di ogni partita.",
          },
        ]
      : []),
    ...idx.nba.map((m) => ({
      path: nbaResultsPath(m.month),
      title: `Risultati NBA di ${monthLabel(m.month)}`,
      description: `Tutte le partite NBA di ${monthLabel(m.month)} con il risultato finale e il link alla scheda di ogni partita.`,
    })),
  ];
}
