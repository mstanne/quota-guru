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
// Full results history used only by the prediction model (scripts/predict-football.mjs); not bundled in the site.
const HISTORY = path.join(root, "data", "football-history.json");
// Club details and squads (team pages, scripts/derive-teams.mjs); kept from the previous run if a request fails.
const TEAMS = path.join(root, "data", "football-teams.json");

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
const HISTORY_SEASONS = 2; // previous seasons kept for the model (fetched once, then reused from the file)
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
const team = (t) => ({
  id: t.id,
  name: t.name,
  shortName: t.shortName || t.name,
  tla: t.tla || "",
  crest: crestUrl(t.crest),
});

// Match events (goals, cards) as returned by /matches/{id} or, when included, by the match lists.
const events = (m) => {
  const goals = (m.goals || [])
    .filter((g) => g?.team?.id != null && Number.isFinite(g.minute))
    .map((g) => ({
      minute: g.minute,
      injuryTime: g.injuryTime ?? null,
      type: g.type === "OWN" || g.type === "PENALTY" ? g.type : "REGULAR",
      team: g.team.id,
      scorer: g.scorer?.name ?? null,
      assist: g.assist?.name ?? null,
    }));
  const cards = (m.bookings || [])
    .filter((b) => b?.team?.id != null && Number.isFinite(b.minute))
    .map((b) => ({
      minute: b.minute,
      team: b.team.id,
      player: b.player?.name ?? null,
      card: b.card === "RED" || b.card === "YELLOW_RED" ? b.card : "YELLOW",
    }));
  return { goals, cards };
};

function compactMatch(m) {
  const duration = m.score?.duration ?? "REGULAR";
  const { goals, cards } = events(m);
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
      // extra time / penalties: kept only when the match did not end after 90 minutes
      ...(duration !== "REGULAR"
        ? {
            duration,
            regularTime: m.score?.regularTime ?? null,
            extraTime: m.score?.extraTime ?? null,
            penalties: m.score?.penalties ?? null,
          }
        : {}),
    },
    referee: m.referees?.find((r) => r.type === "REFEREE")?.name ?? null,
    ...(goals.length ? { goals } : {}),
    ...(cards.length ? { cards } : {}),
  };
}

// ---------- events of finished matches (goals, cards) ----------
// The free plan may not include them: the first request tells. If a finished match with goals comes back without
// scorers, the plan does not provide them and the check is repeated only after DETAILS_RETRY_DAYS.
// Details are kept in .cache/match-details (restored between workflow runs), so each match costs one request.
const DETAILS_FILE = path.join(root, ".cache", "match-details", "football.json");
const DETAILS_DAYS = 4; // matches finished in the last N days are checked...
const DETAILS_MAX = 12; // ...at most this many per run (1 request each)
const DETAILS_RETRY_DAYS = 7;

async function addMatchDetails(token, competitions, now) {
  const store = fs.existsSync(DETAILS_FILE)
    ? JSON.parse(fs.readFileSync(DETAILS_FILE, "utf8"))
    : { unsupportedUntil: null, matches: {} };
  const all = competitions.flatMap((c) => c.matches);
  const finished = (m) => m.status === "FINISHED" && m.score.fullTime.home != null;
  const hasGoals = (m) => m.score.fullTime.home + m.score.fullTime.away > 0;
  const unsupported = store.unsupportedUntil && Date.parse(store.unsupportedUntil) > now.getTime();
  if (unsupported) {
    console.log(`Marcatori e cartellini: non inclusi nel piano (nuovo controllo dopo il ${store.unsupportedUntil.slice(0, 10)})`);
  } else {
    const todo = all
      .filter((m) => finished(m) && !m.goals && !store.matches[m.id])
      .filter((m) => now.getTime() - Date.parse(m.utcDate) < DETAILS_DAYS * 86400000)
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
      .slice(0, DETAILS_MAX);
    for (const m of todo) {
      try {
        const d = await api(`/matches/${m.id}`, token);
        const ev = events(d);
        if (hasGoals(m) && ev.goals.length === 0) {
          store.unsupportedUntil = new Date(now.getTime() + DETAILS_RETRY_DAYS * 86400000).toISOString();
          console.log("Marcatori e cartellini: non inclusi nel piano attuale di football-data.org");
          break;
        }
        store.matches[m.id] = { ...ev, savedAt: now.toISOString() };
      } catch (err) {
        console.warn(`  dettagli non disponibili per ${m.id}: ${err.message.slice(0, 80)}`);
      }
    }
  }
  // merge into the snapshot and forget matches no longer in it
  const ids = new Set(all.map((m) => String(m.id)));
  for (const id of Object.keys(store.matches)) if (!ids.has(id)) delete store.matches[id];
  let merged = 0;
  for (const m of all) {
    const d = store.matches[m.id];
    if (!d || m.goals) continue;
    if (d.goals.length) m.goals = d.goals;
    if (d.cards.length) m.cards = d.cards;
    merged++;
  }
  fs.mkdirSync(path.dirname(DETAILS_FILE), { recursive: true });
  fs.writeFileSync(DETAILS_FILE, JSON.stringify(store));
  if (merged) console.log(`Marcatori e cartellini: ${merged} partite`);
}

/** Club details and squad from /competitions/{code}/teams (fields the plan does not provide stay null). */
function compactTeam(t, now) {
  const person = (p) => ({
    name: p.name ?? "",
    position: p.position ?? null,
    born: p.dateOfBirth ?? null,
    nationality: p.nationality ?? null,
    number: p.shirtNumber ?? null,
  });
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName || t.name,
    tla: t.tla || "",
    crest: crestUrl(t.crest),
    area: t.area?.name ?? null,
    address: t.address ?? null,
    website: typeof t.website === "string" && /^https?:\/\//.test(t.website) ? t.website : null,
    founded: Number.isFinite(t.founded) ? t.founded : null,
    colors: t.clubColors ?? null,
    venue: t.venue ?? null,
    coach: t.coach?.name
      ? { name: t.coach.name, nationality: t.coach.nationality ?? null, since: t.coach.contract?.start ?? null }
      : null,
    squad: (t.squad || []).map(person),
    updatedAt: now.toISOString(),
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

  // Club details and squads: 1 request per competition.
  const teamsFile = fs.existsSync(TEAMS) ? JSON.parse(fs.readFileSync(TEAMS, "utf8")) : { teams: {}, competitions: {} };
  for (const c of competitions) {
    try {
      const t = await api(`/competitions/${c.code}/teams`, token);
      teamsFile.competitions[c.slug] = (t.teams || []).map((x) => x.id);
      for (const x of t.teams || []) teamsFile.teams[x.id] = compactTeam(x, now);
    } catch (err) {
      console.warn(`  squadre di ${c.name} non disponibili: ${err.message.slice(0, 80)}`);
    }
  }
  teamsFile.updatedAt = now.toISOString();
  fs.mkdirSync(path.dirname(TEAMS), { recursive: true });
  fs.writeFileSync(TEAMS, JSON.stringify(teamsFile) + "\n");
  console.log(`Squadre: ${Object.keys(teamsFile.teams).length}`);

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

  await addMatchDetails(token, competitions, now);
  await updateHistory(token, competitions);

  const snapshot = { generatedAt: now.toISOString(), source: "football-data.org", competitions, headToHead };
  // Write atomically: temp file in the same folder, then rename.
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const tmp = OUT + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(snapshot) + "\n");
  fs.renameSync(tmp, OUT);
  const total = competitions.reduce((n, c) => n + c.matches.length, 0);
  console.log(`Salvato ${path.relative(root, OUT)}: ${competitions.length} competizioni, ${total} partite.`);
}

// Results of the current season (refreshed every run) and of the previous seasons (downloaded once and kept in
// data/football-history.json, so later runs do not spend requests on them). One request per competition-season.
// Past seasons come from football-data.org when the plan allows it, otherwise from openfootball
// (github.com/openfootball/football.json, public domain), whose team names are the same as football-data.org's.
// Teams not found in our data (e.g. relegated sides) get a stable negative id derived from the name.
const OPENFOOTBALL = "https://raw.githubusercontent.com/openfootball/football.json/master";
const OPENFOOTBALL_FILES = {
  SA: "it.1",
  PL: "en.1",
  PD: "es.1",
  BL1: "de.1",
  FL1: "fr.1",
  DED: "nl.1",
  PPL: "pt.1",
  ELC: "en.2",
  BSA: "br.1", // calendar-year season: folder "2025" instead of "2025-26"
};

const nameId = (name) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) | 0;
  return -Math.abs(h || 1);
};

async function openfootballSeason(code, year, teamIds) {
  const file = OPENFOOTBALL_FILES[code];
  if (!file) throw new Error("competizione non coperta");
  const folder = code === "BSA" ? `${year}` : `${year}-${String(year + 1).slice(2)}`;
  const res = await fetch(`${OPENFOOTBALL}/${folder}/${file}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const id = (n) => teamIds.get(n) ?? nameId(n);
  return (json.matches || [])
    .filter((m) => Array.isArray(m.score?.ft))
    .map((m) => ({
      id: `of-${code}-${m.date}-${id(m.team1)}-${id(m.team2)}`,
      date: `${m.date}T${(m.time || "15:00").slice(0, 5)}:00Z`,
      comp: code,
      home: id(m.team1),
      away: id(m.team2),
      hg: m.score.ft[0],
      ag: m.score.ft[1],
    }));
}

async function updateHistory(token, competitions) {
  const old = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, "utf8")) : { seasons: {}, results: [] };
  const seasons = old.seasons || {}; // "SA-2025": { n, source }
  const keep = new Map((old.results || []).map((r) => [r.id, r]));
  const compact = (code) => (m) => ({
    id: m.id,
    date: m.utcDate,
    comp: code,
    home: m.homeTeam.id,
    away: m.awayTeam.id,
    hg: m.score.fullTime.home,
    ag: m.score.fullTime.away,
  });
  const played = (m) => ["FINISHED", "AWARDED"].includes(m.status) && m.score?.fullTime?.home != null;

  // football-data.org team ids by full name, from everything we have
  const teamIds = new Map();
  for (const c of competitions) for (const m of c.matches) for (const t of [m.homeTeam, m.awayTeam]) teamIds.set(t.name, t.id);

  for (const c of competitions) {
    const start = c.season?.startDate ? Number(c.season.startDate.slice(0, 4)) : null;
    if (!start) continue;
    for (let y = start; y >= start - HISTORY_SEASONS; y--) {
      const key = `${c.code}-${y}`;
      if (y !== start && seasons[key]?.n > 0) continue; // past season already stored
      let list = null;
      let source = "football-data.org";
      if (token) {
        try {
          const res = await api(`/competitions/${c.code}/matches?season=${y}&status=FINISHED`, token);
          list = (res.matches || []).filter(played).map(compact(c.code));
        } catch (err) {
          console.warn(`  storico ${key} da football-data.org non disponibile: ${err.message.slice(0, 80)}`);
        }
      }
      if (y !== start && !list?.length) {
        try {
          list = await openfootballSeason(c.code, y, teamIds);
          source = "openfootball";
        } catch (err) {
          console.warn(`  storico ${key} da openfootball non disponibile: ${err.message}`);
        }
      }
      if (!list) continue;
      // a season comes from one source only: drop what the other source left for it
      for (const [id, r] of keep) if (r.comp === c.code && seasonOf(r, c.code) === y) keep.delete(id);
      for (const r of list) keep.set(r.id, r);
      seasons[key] = { n: list.length, source };
      console.log(`  storico ${key}: ${list.length} risultati (${source})`);
    }
  }
  // drop anything older than the oldest season we keep
  const oldest = Math.min(...competitions.map((c) => Number(c.season?.startDate?.slice(0, 4)) || 9999)) - HISTORY_SEASONS;
  const results = [...keep.values()].filter((r) => Number(r.date.slice(0, 4)) >= oldest).sort((a, b) => a.date.localeCompare(b.date));
  fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
  fs.writeFileSync(HISTORY, JSON.stringify({ updatedAt: new Date().toISOString(), seasons, results }) + "\n");
  console.log(`Storico per il modello: ${results.length} risultati (${path.relative(root, HISTORY)})`);
}

// Season start year of a result: European seasons start in July, Brasileirão follows the calendar year.
function seasonOf(r, code) {
  const y = Number(r.date.slice(0, 4));
  if (code === "BSA") return y;
  return Number(r.date.slice(5, 7)) >= 7 ? y : y - 1;
}

// `node scripts/fetch-football-data.mjs --history` updates only the history (token optional: without it
// past seasons come from openfootball), using the competitions of the current snapshot.
if (process.argv.includes("--history")) {
  loadDotEnv();
  const snap = JSON.parse(fs.readFileSync(OUT, "utf8"));
  updateHistory(process.env.FOOTBALL_DATA_TOKEN, snap.competitions).catch((err) => {
    console.error("Storico non aggiornato:", err.message);
    process.exit(1);
  });
} else
main().catch((err) => {
  console.error("Download dati non riuscito:", err.message);
  process.exit(1);
});
