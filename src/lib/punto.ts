// "Il punto del modello": weekly dated editions with the model's season numbers (scripts/derive-punto.mjs).
// /il-punto lists them, /il-punto/<YYYY-MM-DD> shows one. The list is bundled (src/data/punto/index.json); an
// edition's data are loaded on demand (one file each), all of them at build time (entry-server).
import index from "../data/punto/index.json";

export interface Delta {
  title?: number;
  top?: number;
  rel?: number;
  xpts?: number;
  win?: number;
  playoffs?: number;
  xw?: number;
}
export interface PuntoLeague {
  name: string;
  played: number;
  top: number;
  bottom: number;
  /** "lo scudetto", "la Premier League" */
  titleWord: string;
  teams: { id: number; name: string; pts: number; xpts: number; title: number; top: number; rel: number; d?: Delta }[];
}
export interface PuntoEdition {
  date: string;
  at: string;
  prev: string | null;
  leagues: Record<string, PuntoLeague>;
  cups: Record<string, { name: string; teams: { id: number; name: string; win: number; r16: number; d?: Delta }[] }>;
  nba: { id: number; name: string; w: number; l: number; xw: number; playoffs: number; title: number; d?: Delta }[];
  ranking: { id: number; name: string; league: string; leagueName: string; gd: number; rank: number; move: number | null }[];
}
export interface PuntoSummary {
  date: string;
  at: string;
  prev: string | null;
  scudetto: { name: string; p: number; d: number | null }[];
  champions: { name: string; p: number } | null;
}

export const PUNTO_BASE = "/il-punto";
export const puntoEditions = (index as unknown as { editions: PuntoSummary[] }).editions;
export const puntoPath = (date: string) => `${PUNTO_BASE}/${date}`;
export const hasPunto = () => puntoEditions.length > 0;

const loaders = import.meta.glob<{ default: PuntoEdition }>("../data/punto/2*.json");
const cache = new Map<string, PuntoEdition>();
function load(date: string): Promise<unknown> {
  if (cache.has(date)) return Promise.resolve();
  const l = loaders[`../data/punto/${date}.json`];
  return l ? l().then((m) => void cache.set(date, m.default)) : Promise.resolve();
}
/** Build time: every edition before rendering (entry-server). */
export const loadAllPuntoData = () => Promise.all(puntoEditions.map((e) => load(e.date)));
/** Data a URL needs before hydration (preloadForPath in App.tsx). */
export function preloadPuntoData(pathname: string): Promise<unknown> {
  const m = pathname.match(/^\/il-punto(?:\/(\d{4}-\d{2}-\d{2}))?$/);
  if (!m) return Promise.resolve();
  const date = m[1] ?? puntoEditions[0]?.date;
  return date ? load(date) : Promise.resolve();
}
/** The edition, null if there is none, or a promise to wait for (Suspense) while it loads. */
export function puntoEdition(date: string | undefined): PuntoEdition | null | Promise<unknown> {
  if (!date || !puntoEditions.some((e) => e.date === date)) return null;
  return cache.get(date) ?? load(date);
}

// ---------------------------------------------------------------------------------------------- texts
const pct = (p: number) => `${Math.round(p * 100)}%`;
export const longDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });
/** "+5 punti" / "−3 punti" / "invariata" for a change of a chance. */
export function deltaText(d: number | null | undefined) {
  if (d == null) return null;
  const v = Math.round(d * 100);
  if (v === 0) return "invariata";
  return `${v > 0 ? "+" : "−"}${Math.abs(v)} punt${Math.abs(v) === 1 ? "o" : "i"}`;
}
/** Article "l'"/"il"/"la" is not added: team names are used as subjects ("Inter al 38%"). */
export function leadSentence(s: PuntoSummary) {
  const [first, ...rest] = s.scudetto;
  if (!first) return null;
  const d = deltaText(first.d);
  return [
    `Aggiornato al ${longDate(s.date)}: secondo il modello di QuotaGuru ${first.name} vince lo scudetto nel ${pct(first.p)} delle stagioni simulate${d && s.prev ? ` (${d} rispetto al ${longDate(s.prev)})` : ""}`,
    rest.length ? `, davanti a ${rest.map((t) => `${t.name} (${pct(t.p)})`).join(" e ")}.` : ".",
    s.champions ? ` In Champions League la favorita è ${s.champions.name} (${pct(s.champions.p)}).` : "",
  ].join("");
}

export function puntoMeta(s: PuntoSummary) {
  return {
    path: puntoPath(s.date),
    title: `Chi vince lo scudetto secondo il modello: il punto del ${longDate(s.date)}`,
    description: leadSentence(s) ?? `Il punto del modello del ${longDate(s.date)}.`,
    article: { headline: `Chi vince lo scudetto secondo il modello: il punto del ${longDate(s.date)}`, section: "Il punto del modello" },
  };
}

export function puntoHubMeta() {
  const last = puntoEditions[0];
  return {
    path: PUNTO_BASE,
    title: "Il punto del modello: probabilità scudetto e Champions ogni lunedì",
    description: last
      ? `Ogni lunedì i numeri del modello di QuotaGuru sulla stagione, con data e confronto con la settimana prima. ${leadSentence(last) ?? ""}`.trim()
      : "Ogni lunedì i numeri del modello di QuotaGuru sulla stagione.",
  };
}
