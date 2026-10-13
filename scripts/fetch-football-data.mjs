// Downloads fixtures, results, standings and head-to-head data from the football-data.org API (v4)
// and writes a compact snapshot to src/data/football.json, which the site reads at build time.
//
// Usage:
//   FOOTBALL_DATA_TOKEN=<token> node scripts/fetch-football-data.mjs
//
// The token is sent in the "X-Auth-Token" HTTP header. It is read ONLY from the environment
// (GitHub Actions secret or a local, git-ignored .env file) and is never written to disk or logs.
// If no token is set the script leaves the existing snapshot untouched and exits successfully.
//
// Free plan limits: 10 requests/minute. The script spaces requests out and honours the
// rate-limit headers, so a full run takes a few minutes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.football-data.org/v4";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "football.json");

// Competitions included in the free plan, in display order. Slugs become URLs: /calcio/<slug>.
export const COMPETITIONS = [
  { code: "SA", slug: "serie-a", name: "Serie A" },
  { code: "CL", slug: "champions-league", name: "Champions League" },
  { code: "PL", slug: "premier-league", name: "Premier League" },
  { code: "PD", slug: "liga", name: "LaLiga" },
  { code: "BL1", slug: "bundesliga", name: "Bundesliga" },
  { code: "FL1", slug: "ligue-1", name: "Ligue 1" },
  { code: "DED", slug: "eredivisie", name: "Eredivisie" },
  { code: "PPL", slug: "primeira-liga", name: "Primeira Liga" },
  { code: "ELC", slug: "championship", name: "Championship" },
  { code: "BSA", slug: "brasileirao", name: "Brasileirão" },
];

const DAYS_BACK = 45; // finished matches kept for results and recent form
const DAYS_AHEAD = 14; // upcoming matches
const H2H_DAYS = 7; // head-to-head is fetched only for matches in the next N days...
const H2H_MAX = 30; // ...and for at most this many matches (1 request each)
const MIN_GAP_MS = 6500; // ~9 requests/minute, under the free limit of 10
// Responses are cached on disk for a short time, so an interrupted run can be resumed
// without spending the request budget again. The cache folder is git-ignored.
const CACHE_DIR = path.join(root, ".cache", "football-data");
const CACHE_TTL_MS = Number(process.env.FOOTBALL_DATA_CACHE_MINUTES ?? 30) * 60000;

function loadDotEnv() {
  // Minimal .env support for local runs (KEY=value lines). .env is git-ignored.
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;

const cacheFile = (p) => path.join(CACHE_DIR, p.replace(/[^a-zA-Z0-9]+/g, "_") + ".json");

async function api(pathAndQuery, token, attempt = 1) {
  const cached = cacheFile(pathAndQuery);
  if (CACHE_TTL_MS > 0 && fs.existsSync(cached) && Date.now() - fs.statSync(cached).mtimeMs < CACHE_TTL_MS) {
    return JSON.parse(fs.readFileSync(cached, "utf8"));
  }
  const wait = lastRequest + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();

  const res = await fetch(API + pathAndQuery, { headers: { "X-Auth-Token": token } });
  if (res.status === 429 && attempt <= 3) {
    const reset = Number(res.headers.get("x-requestcounter-reset")) || 60;
    console.warn(`  rate limit raggiunto, attendo ${reset}s...`);
    await sleep((reset + 1) * 1000);
    return api(pathAndQuery, token, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} su ${pathAndQuery}: ${body.slice(0, 200)}`);
  }
  // If the minute budget is exhausted, wait for the counter to reset before the next call.
  if (res.headers.get("x-requests-available-minute") === "0") {
    const reset = Number(res.headers.get("x-requestcounter-reset")) || 60;
    lastRequest = Date.now() + reset * 1000 - MIN_GAP_MS;
  }
  const json = await res.json();
  if (CACHE_TTL_MS > 0) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cached, JSON.stringify(json));
  }
  return json;
}

const isoDate = (d) => d.toISOString().slice(0, 10);
// Only https crests from the football-data.org CDN are kept (anything else is dropped).
const crestUrl = (u) => (typeof u === "string" && /^https:\/\/crests\.football-data\.org\/[\w.-]+$/.test(u) ? u : null);
const team = (t) => ({ id: t.id, name: t.name, shortName: t.shortName || t.name, tla: t.tla || "", crest: crestUrl(t.crest) });

function compactMatch(m) {
  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    matchday: m.matchday ?? null,
    stage: m.stage ?? null,
    group: m.group ?? null,
    homeTeam: team(m.homeTeam),
    awayTeam: team(m.awayTeam),
    score: {
      winner: m.score?.winner ?? null,
      fullTime: m.score?.fullTime ?? { home: null, away: null },
      halfTime: m.score?.halfTime ?? { home: null, away: null },
    },
    referee: m.referees?.find((r) => r.type === "REFEREE")?.name ?? null,
  };
}

function compactStanding(row) {
  return {
    position: row.position,
    team: team(row.team),
    playedGames: row.playedGames,
    won: row.won,
    draw: row.draw,
    lost: row.lost,
    points: row.points,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
  };
}

async function main() {
  loadDotEnv();
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    console.warn(
      "FOOTBALL_DATA_TOKEN non impostato: mantengo il file dati esistente (" + path.relative(root, OUT) + ").",
    );
    return;
  }

  const now = new Date();
  const from = isoDate(new Date(now.getTime() - DAYS_BACK * 86400000));
  const to = isoDate(new Date(now.getTime() + DAYS_AHEAD * 86400000));
  const competitions = [];

  for (const c of COMPETITIONS) {
    console.log(`${c.name}: partite ${from} → ${to}`);
    const m = await api(`/competitions/${c.code}/matches?dateFrom=${from}&dateTo=${to}`, token);
    let standings = [];
    try {
      const s = await api(`/competitions/${c.code}/standings`, token);
      standings = (s.standings || [])
        .filter((g) => g.type === "TOTAL")
        .map((g) => ({ stage: g.stage, group: g.group, table: g.table.map(compactStanding) }));
    } catch (err) {
      console.warn(`  classifica non disponibile: ${err.message}`);
    }
    competitions.push({
      code: c.code,
      slug: c.slug,
      name: c.name,
      area: m.competition?.area?.name ?? null,
      season: m.matches?.[0]?.season ?? null,
      matches: (m.matches || []).map(compactMatch),
      standings,
    });
  }

  // Head-to-head for the next upcoming matches (1 request per match).
  const soon = now.getTime() + H2H_DAYS * 86400000;
  const upcoming = competitions
    .flatMap((c) => c.matches)
    .filter((m) => ["SCHEDULED", "TIMED"].includes(m.status) && new Date(m.utcDate).getTime() <= soon)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(0, H2H_MAX);
  const headToHead = {};
  for (const m of upcoming) {
    try {
      const h = await api(`/matches/${m.id}/head2head?limit=5`, token);
      headToHead[m.id] = {
        numberOfMatches: h.aggregates?.numberOfMatches ?? 0,
        totalGoals: h.aggregates?.totalGoals ?? 0,
        matches: (h.matches || [])
          .filter((x) => x.id !== m.id)
          .map((x) => ({
            id: x.id,
            utcDate: x.utcDate,
            competition: x.competition?.name ?? "",
            homeTeam: team(x.homeTeam),
            awayTeam: team(x.awayTeam),
            score: { fullTime: x.score?.fullTime ?? { home: null, away: null } },
          })),
      };
    } catch (err) {
      console.warn(`  precedenti non disponibili per ${m.id}: ${err.message}`);
    }
  }
  console.log(`Precedenti scaricati: ${Object.keys(headToHead).length}`);

  const snapshot = { generatedAt: now.toISOString(), source: "football-data.org", competitions, headToHead };
  // Write atomically: temp file in the same folder, then rename.
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const tmp = OUT + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(snapshot) + "\n");
  fs.renameSync(tmp, OUT);
  const total = competitions.reduce((n, c) => n + c.matches.length, 0);
  console.log(`Salvato ${path.relative(root, OUT)}: ${competitions.length} competizioni, ${total} partite.`);
}

main().catch((err) => {
  console.error("Download dati non riuscito:", err.message);
  process.exit(1);
});
