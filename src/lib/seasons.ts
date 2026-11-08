// Past seasons (src/data/seasons/, built by scripts/derive-seasons.mjs from the permanent archive): final standings,
// results round by round and roll of honour. The per-season files are loaded only by their page.
import index from "../data/seasons/index.json";

export interface SeasonTeam {
  id: number;
  name: string;
}
export interface SeasonMatch {
  id: number;
  date: string;
  home: SeasonTeam;
  away: SeasonTeam;
  score: [number, number];
  /** After extra time / penalty shoot-out score. */
  aet?: boolean;
  pen?: [number, number];
  /** Match page, when the site has one. */
  path?: string;
}
export interface SeasonRow {
  pos: number;
  team: SeasonTeam;
  crest?: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  /** "Champions League", "Retrocessione", "Promozione"… (official tables only). */
  zone?: string;
  /** Point deduction (negative). */
  ded?: number;
}
export interface SeasonSummary {
  key: string;
  label: string;
  year: number;
  matches: number;
  champion: SeasonTeam | null;
  runnerUp: SeasonTeam | null;
  /** Cups: "PSG – Inter 5-0". */
  final: string | null;
}
/** "league", "cup", or "national" (an edition of a national-team competition: groups, then knock-outs). */
export type SeasonType = "league" | "cup" | "national";
export interface SeasonData extends SeasonSummary {
  slug: string;
  name: string;
  type: SeasonType;
  notes: string[];
  standings: SeasonRow[] | null;
  /** Group tables of a national-team edition (Nations League, qualifiers, tournaments). */
  groups?: { name: string; rows: SeasonRow[] }[] | null;
  rounds: { round: string; matches: SeasonMatch[] }[];
}
export interface SeasonsCompetition {
  slug: string;
  name: string;
  type: SeasonType;
  seasons: SeasonSummary[];
}

const idx = index as unknown as { generatedAt?: string; competitions: SeasonsCompetition[] };
export const seasonsIndex = idx.competitions;

export const seasonsHubPath = "/calcio/stagioni";
export const seasonsPath = (slug: string) => `/calcio/${slug}/stagioni`;
export const seasonPath = (slug: string, key: string) => `/calcio/${slug}/stagioni/${key}`;
export const seasonsOf = (slug?: string) => idx.competitions.find((c) => c.slug === slug) ?? null;
export const hasSeasons = (slug?: string) => !!seasonsOf(slug);

// ---------- data, loaded on demand ----------
const loaders = import.meta.glob<{ default: SeasonData }>("../data/seasons/*/*.json");
const cache = new Map<string, SeasonData>();
const fileOf = (slug: string, key: string) => `../data/seasons/${slug}/${key}.json`;

export function loadSeason(slug: string, key: string): Promise<unknown> {
  const f = fileOf(slug, key);
  if (cache.has(f)) return Promise.resolve();
  const load = loaders[f];
  return load ? load().then((m) => void cache.set(f, m.default)) : Promise.resolve();
}
export const loadAllSeasons = () =>
  Promise.all(idx.competitions.flatMap((c) => c.seasons.map((s) => loadSeason(c.slug, s.key))));

/** One season, or a promise to wait for (Suspense) while it loads; null if it does not exist. */
export function seasonData(slug?: string, key?: string): SeasonData | null | Promise<unknown> {
  if (!slug || !key || !seasonsOf(slug)?.seasons.some((s) => s.key === key)) return null;
  return cache.get(fileOf(slug, key)) ?? loadSeason(slug, key);
}

/** Data a URL needs before hydration (see preloadForPath in App.tsx). */
export function preloadSeasonData(pathname: string): Promise<unknown> {
  const m = pathname.match(/^\/calcio\/([^/]+)\/stagioni\/([^/]+)$/);
  return m ? loadSeason(m[1], m[2]) : Promise.resolve();
}

// ---------- routes ----------
export function seasonsRoutes() {
  if (!idx.competitions.length) return [];
  return [
    {
      path: seasonsHubPath,
      title: "Albo d'oro e stagioni passate del calcio",
      description:
        "Vincitori, classifiche finali e risultati delle stagioni passate di Serie A, Serie B, coppe europee, Coppa Italia, principali campionati esteri e competizioni delle nazionali.",
    },
    ...idx.competitions.map((c) => ({
      path: seasonsPath(c.slug),
      title: c.type === "national" ? `Albo d'oro ${c.name}: tutte le edizioni` : `Albo d'oro ${c.name}: tutte le stagioni`,
      description:
        c.type === "national"
          ? `Vincitori, finali, gironi e risultati delle edizioni passate di ${c.name}.`
          : `I vincitori di ogni stagione di ${c.name}${c.type === "cup" ? ", con le finali" : " e le prime classificate"}, con classifica finale e risultati di ogni stagione.`,
    })),
    ...idx.competitions.flatMap((c) =>
      c.seasons.map((s) => ({
        path: seasonPath(c.slug, s.key),
        title:
          c.type === "national"
            ? `${c.name} ${s.label}: gironi, risultati${s.final ? " e finale" : ""}`
            : c.type === "cup"
              ? `${c.name} ${s.label}: risultati e finale`
              : `${c.name} ${s.label}: classifica finale e risultati`,
        description:
          c.type === "national"
            ? `Gironi e tutte le partite di ${c.name} ${s.label}${s.champion ? `: ha vinto ${s.champion.name}` : ""}${s.final ? ` (finale ${s.final})` : ""}.`
            : c.type === "cup"
              ? `Tutte le partite di ${c.name} ${s.label}, turno per turno${s.champion ? `: ha vinto ${s.champion.name}` : ""}.`
              : `Classifica finale e risultati giornata per giornata di ${c.name} ${s.label}${s.champion ? `, vinta da ${s.champion.name}` : ""}.`,
      })),
    ),
  ];
}
