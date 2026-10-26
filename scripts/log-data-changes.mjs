// Daily log of what the API downloads added to the match data, published as /registro-dati.json.
//
// At every workflow run (after the fetch-* scripts, before the build) it compares the fresh snapshots with the
// ones of the previous run and records:
//   nuova      – a match/game that appeared in the calendar (football-data.org, BALLDONTLIE)
//   risultato  – a match that became final, with its score
//   stato      – a match postponed, suspended or cancelled
//   dettagli   – line-ups/stats (football) or box score (NBA) downloaded from API-Sports
//   highlights – an official YouTube highlight found for a finished match
// The previous snapshot and the log (last 8 days) live in .cache/seo/data-log.json, which the workflow keeps
// between runs with actions/cache. The first run only records the baseline (no entries).
// The daily e-mail report reads the published file and summarises the last 24 hours.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE = path.join(root, ".cache", "seo", "data-log.json");
const OUT = path.join(root, "public", "registro-dati.json");
const KEEP_DAYS = 8;
const MAX_RUNS = 80;

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  } catch {
    return fallback;
  }
};

const now = new Date();
const at = now.toISOString();
const football = readJson("src/data/football.json", { competitions: [] });
const basket = readJson("src/data/basket.json", { nba: { games: [] } });
const fDetails = readJson("src/data/football-details.json", {});
const bDetails = readJson("src/data/basket-details.json", {});
const highlights = readJson("src/data/highlights.json", {});

const romeDay = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit" });

// ---------- current snapshot: id -> { label, competition, status, score } ----------
const FINAL_F = ["FINISHED", "AWARDED"];
const OFF_F = ["POSTPONED", "SUSPENDED", "CANCELLED"];
const matches = {};
for (const c of football.competitions ?? []) {
  for (const m of c.matches ?? []) {
    const ft = m.score?.fullTime ?? {};
    matches[`calcio:${m.id}`] = {
      sport: "calcio",
      competition: c.name,
      slug: c.slug,
      label: `${m.homeTeam?.shortName ?? "?"} – ${m.awayTeam?.shortName ?? "?"}`,
      day: romeDay(m.utcDate),
      final: FINAL_F.includes(m.status),
      off: OFF_F.includes(m.status) ? m.status : null,
      score: ft.home != null && ft.away != null ? `${ft.home}-${ft.away}` : null,
    };
  }
}
for (const g of basket.nba?.games ?? []) {
  const s = g.score ?? {};
  matches[`nba:${g.id}`] = {
    sport: "basket",
    competition: "NBA",
    slug: "nba",
    label: `${g.home?.shortName ?? g.home?.name ?? "?"} – ${g.away?.shortName ?? g.away?.name ?? "?"}`,
    day: romeDay(g.utcDate),
    final: g.status === "final",
    off: ["postponed", "cancelled"].includes(String(g.status).toLowerCase()) ? g.status : null,
    score: s.home != null && s.away != null ? `${s.home}-${s.away}` : null,
  };
}
const detailIds = [
  ...Object.keys(fDetails).map((id) => `calcio:${id}`),
  ...Object.keys(bDetails).map((id) => `nba:${id}`),
];
const highlightIds = [];
for (const [slug, list] of Object.entries(highlights)) {
  if (slug === "generatedAt" || !list || typeof list !== "object") continue;
  for (const id of Object.keys(list)) highlightIds.push(slug === "nba" ? `nba:${id}` : `calcio:${id}`);
}

// ---------- compare with the previous run ----------
let state = null;
try {
  state = JSON.parse(fs.readFileSync(STATE, "utf8"));
} catch {
  state = null;
}

const entries = state?.entries ?? [];
const added = [];
const entry = (kind, key, extra = {}) => {
  const m = matches[key] ?? state?.matches?.[key];
  if (!m) return;
  added.push({ at, kind, sport: m.sport, competition: m.competition, match: m.label, day: m.day, ...extra });
};

if (state?.matches) {
  const prevDetails = new Set(state.details ?? []);
  const prevHighlights = new Set(state.highlights ?? []);
  for (const [key, m] of Object.entries(matches)) {
    const prev = state.matches[key];
    if (!prev) {
      entry("nuova", key, m.final && m.score ? { score: m.score } : {});
    } else {
      if (m.final && !prev.final) entry("risultato", key, { score: m.score });
      if (m.off && m.off !== prev.off) entry("stato", key, { status: m.off });
    }
  }
  for (const key of detailIds) if (!prevDetails.has(key)) entry("dettagli", key);
  for (const key of highlightIds) if (!prevHighlights.has(key)) entry("highlights", key);
}

const cutoff = now.getTime() - KEEP_DAYS * 86400000;
const kept = [...entries, ...added].filter((e) => new Date(e.at).getTime() >= cutoff);
const runs = [...(state?.runs ?? []), { at, added: added.length, baseline: !state?.matches }]
  .filter((r) => new Date(r.at).getTime() >= cutoff)
  .slice(-MAX_RUNS);

// matches that left the data window are kept in the snapshot for a while, so they do not come back as "nuova"
const snapshot = { ...(state?.matches ?? {}), ...matches };
for (const key of Object.keys(snapshot)) {
  if (!matches[key] && (snapshot[key].leftAt ?? at) < new Date(cutoff).toISOString()) delete snapshot[key];
  else if (!matches[key]) snapshot[key].leftAt ??= at;
  else delete snapshot[key].leftAt;
}

fs.mkdirSync(path.dirname(STATE), { recursive: true });
fs.writeFileSync(
  STATE,
  JSON.stringify({ updatedAt: at, matches: snapshot, details: detailIds, highlights: highlightIds, runs, entries: kept }),
);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ updatedAt: at, runs, entries: kept }, null, 1) + "\n");

const byKind = added.reduce((o, e) => ((o[e.kind] = (o[e.kind] ?? 0) + 1), o), {});
console.log(
  state?.matches
    ? `Registro dati: ${added.length} aggiunte in questo giro ${JSON.stringify(byKind)}`
    : "Registro dati: primo giro, salvato lo stato di partenza (nessuna voce).",
);
