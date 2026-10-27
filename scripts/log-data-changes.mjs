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
// No duplicates: the providers sometimes flip a finished match back to "scheduled" for a few hours (football-data.org
// did it with four Primeira Liga matches on 26/10), which also hides its highlight. So "final", the details and the
// highlights already seen are sticky in the saved state, and every entry carries the match key: the same kind is
// never recorded twice for the same match.
// "editorial" (top level) = latest numbers of the Claude rewrite of the match texts; runs[].editorial = texts rewritten in
// that run. The daily e-mail report reads the published file and summarises the last 24 hours.
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
// numbers of the Claude rewrite of this run (scripts/generate-editorial.mjs); stale files from other runs are ignored
const editorialRaw = readJson(".cache/editorial-stats.json", null);
const editorial =
  editorialRaw && Math.abs(Date.parse(editorialRaw.at) - Date.now()) < 3 * 3600000 ? editorialRaw : null;

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

// ---------- compare with the previous run ----------
let state = null;
try {
  state = JSON.parse(fs.readFileSync(STATE, "utf8"));
} catch {
  state = null;
}

// a match already seen as final stays final (the provider may flip it back for a while)
for (const [key, m] of Object.entries(matches)) {
  const prev = state?.matches?.[key];
  if (prev?.final && !m.final) {
    m.final = true;
    m.score ??= prev.score;
  }
}
// details and highlights already seen are kept while their match is in the snapshot
const known = (ids) => (ids ?? []).filter((key) => matches[key] || state?.matches?.[key]);
const detailIds = [
  ...new Set([
    ...known(state?.details),
    ...Object.keys(fDetails).map((id) => `calcio:${id}`),
    ...Object.keys(bDetails).map((id) => `nba:${id}`),
  ]),
];
const highlightIds = new Set(known(state?.highlights));
const newHighlights = [];
for (const [slug, list] of Object.entries(highlights)) {
  if (slug === "generatedAt" || !list || typeof list !== "object") continue;
  for (const id of Object.keys(list)) newHighlights.push(slug === "nba" ? `nba:${id}` : `calcio:${id}`);
}

const added = [];
// entries already in the log, by kind + match (older entries without "key" are matched on competition, teams, day);
// duplicates logged before this check existed are dropped, keeping the first one
const seenKey = (e) => `${e.kind}|${e.key ?? `${e.sport}|${e.competition}|${e.match}|${e.day}`}`;
const seen = new Map();
const entries = (state?.entries ?? []).filter((e) => {
  const k = seenKey(e);
  if (seen.has(k) && (e.kind !== "risultato" || seen.get(k).score === e.score)) return false;
  seen.set(k, e);
  return true;
});
const entry = (kind, key, extra = {}) => {
  const m = matches[key] ?? state?.matches?.[key];
  if (!m) return;
  const e = { at, kind, key, sport: m.sport, competition: m.competition, match: m.label, day: m.day, ...extra };
  const old = seen.get(seenKey(e)) ?? seen.get(seenKey({ ...e, key: undefined }));
  if (old && (kind !== "risultato" || old.score === e.score)) return;
  seen.set(seenKey(e), e);
  added.push(e);
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
  for (const key of newHighlights) if (!prevHighlights.has(key)) entry("highlights", key);
}
for (const key of newHighlights) highlightIds.add(key);

const cutoff = now.getTime() - KEEP_DAYS * 86400000;
const kept = [...entries, ...added].filter((e) => new Date(e.at).getTime() >= cutoff);
// running totals of the Claude rewrite since the counting started (kept in the state, not limited to the 8 days)
const editorialTotals = { since: at, texts: 0, requests: 0, ...state?.editorialTotals };
if (editorial) {
  editorialTotals.texts += editorial.new ?? 0;
  editorialTotals.requests += editorial.requests ?? editorial.new ?? 0;
}
const runs = [
  ...(state?.runs ?? []),
  {
    at,
    added: added.length,
    baseline: !state?.matches,
    ...(editorial ? { editorial: editorial.new, editorialRequests: editorial.requests ?? editorial.new } : {}),
  },
]
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
  JSON.stringify({
    updatedAt: at,
    matches: snapshot,
    details: detailIds,
    highlights: [...highlightIds],
    editorialTotals,
    runs,
    entries: kept,
  }),
);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      updatedAt: at,
      ...(editorial ? { editorial: { ...editorial, totals: editorialTotals } } : {}),
      runs,
      entries: kept,
    },
    null,
    1,
  ) + "\n",
);

const byKind = added.reduce((o, e) => ((o[e.kind] = (o[e.kind] ?? 0) + 1), o), {});
console.log(
  state?.matches
    ? `Registro dati: ${added.length} aggiunte in questo giro ${JSON.stringify(byKind)}`
    : "Registro dati: primo giro, salvato lo stato di partenza (nessuna voce).",
);
