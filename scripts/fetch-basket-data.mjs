// Downloads basketball data from the BALLDONTLIE API (free tier) and writes src/data/basket.json.
//   - NBA: calendar and results (games endpoint, free)
//   - Lega Basket Serie A: standings (free; games require a paid plan)
//
// Usage:  BALLDONTLIE_API_KEY=<key> node scripts/fetch-basket-data.mjs
// The key is sent in the "Authorization" header, read only from the environment (GitHub secret or a
// git-ignored .env file) and never written to disk or logs. Without a key the existing snapshot is kept.
// Free plan: 5 requests/minute → requests are spaced ~13 s apart.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.balldontlie.io";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "basket.json");
// All NBA results of the current and previous season, used only by the prediction model
// (scripts/predict-basket.mjs); not bundled in the site.
const HISTORY = path.join(root, "data", "basket-history.json");
const CACHE_DIR = path.join(root, ".cache", "balldontlie");
const CACHE_TTL_MS = Number(process.env.BASKET_CACHE_MINUTES ?? 30) * 60000;
const MIN_GAP_MS = 13000;
const DAYS_BACK = 21;
const DAYS_AHEAD = 14;

function loadDotEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
const cacheFile = (p) => path.join(CACHE_DIR, p.replace(/[^a-zA-Z0-9]+/g, "_") + ".json");

async function api(p, key, attempt = 1) {
  const cached = cacheFile(p);
  if (CACHE_TTL_MS > 0 && fs.existsSync(cached) && Date.now() - fs.statSync(cached).mtimeMs < CACHE_TTL_MS) {
    return JSON.parse(fs.readFileSync(cached, "utf8"));
  }
  const wait = last + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(API + p, { headers: { Authorization: key } });
  if (res.status === 429 && attempt <= 3) {
    console.warn("  rate limit raggiunto, attendo 60 s...");
    await sleep(60000);
    return api(p, key, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${p}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const json = await res.json();
  if (CACHE_TTL_MS > 0) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cached, JSON.stringify(json));
  }
  return json;
}

/** Follows meta.next_cursor until the last page. */
async function all(p, key) {
  const out = [];
  let cursor = null;
  for (let page = 0; page < 25; page++) {
    const sep = p.includes("?") ? "&" : "?";
    const r = await api(`${p}${sep}per_page=100${cursor ? `&cursor=${cursor}` : ""}`, key);
    out.push(...(r.data ?? []));
    cursor = r.meta?.next_cursor;
    if (!cursor || !r.data?.length) break;
  }
  return out;
}

const iso = (d) => d.toISOString().slice(0, 10);
const nbaTeam = (t) => ({ id: t.id, name: t.full_name, shortName: t.name, city: t.city, abbr: t.abbreviation });

function nbaGame(g) {
  const state = String(g.status_state ?? "").toLowerCase();
  const final = state === "final" || /^final/i.test(String(g.status ?? ""));
  const scheduled = state === "scheduled" && !final;
  const q = (side) =>
    ["q1", "q2", "q3", "q4", "ot1", "ot2", "ot3"]
      .map((k) => g[`${side}_${k}`])
      .filter((v) => v !== null && v !== undefined);
  return {
    id: g.id,
    utcDate: g.datetime ?? `${g.date}T00:00:00Z`,
    status: g.postponed ? "postponed" : final ? "final" : scheduled ? "scheduled" : "live",
    postseason: Boolean(g.postseason),
    home: nbaTeam(g.home_team),
    away: nbaTeam(g.visitor_team),
    score: final || !scheduled ? { home: g.home_team_score, away: g.visitor_team_score } : { home: null, away: null },
    periods: final ? { home: q("home"), away: q("visitor") } : null,
  };
}

async function main() {
  loadDotEnv();
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) {
    console.warn("BALLDONTLIE_API_KEY non impostata: mantengo il file dati esistente (src/data/basket.json).");
    return;
  }
  const now = new Date();
  const from = iso(new Date(now.getTime() - DAYS_BACK * 86400000));
  const to = iso(new Date(now.getTime() + DAYS_AHEAD * 86400000));
  // Seasons use the starting year (2026 = 2026–27); a new season starts in autumn.
  const season = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;

  console.log(`NBA: partite ${from} → ${to}`);
  const games = (await all(`/v1/games?start_date=${from}&end_date=${to}`, key)).map(nbaGame);

  console.log(`Serie A basket: classifica ${season}-${String(season + 1).slice(2)}`);
  let standings = [];
  try {
    const rows = await all(`/lba/v1/standings?season=${season}`, key);
    standings = rows
      .map((r) => ({
        rank: r.rank,
        team: { id: r.team.id, name: r.team.name, abbr: r.team.abbreviation },
        played: r.games_played,
        won: r.wins,
        lost: r.losses,
        pointsFor: r.points_for,
        pointsAgainst: r.points_against,
      }))
      .sort((a, b) => a.rank - b.rank);
  } catch (err) {
    console.warn("  classifica non disponibile:", err.message);
  }

  try {
    await updateHistory(key, season);
  } catch (err) {
    console.warn("  storico NBA non aggiornato:", err.message);
  }

  const snapshot = {
    generatedAt: now.toISOString(),
    source: "balldontlie.io",
    nba: { season, games: games.sort((a, b) => a.utcDate.localeCompare(b.utcDate)) },
    lba: { season, standings },
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT + ".tmp", JSON.stringify(snapshot) + "\n");
  fs.renameSync(OUT + ".tmp", OUT);
  console.log(
    `Salvato src/data/basket.json: ${games.length} partite NBA, ${standings.length} squadre in classifica Serie A.`,
  );
}

// NBA results for the model. The previous season is downloaded once (~15 requests, ~3 minutes on the free
// plan) and kept in data/basket-history.json; the current season is updated incrementally (from a few days
// before the last stored game), so a normal run costs 1-2 requests.
async function updateHistory(key, season) {
  const old = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, "utf8")) : { seasons: {}, games: [] };
  const games = new Map((old.games || []).map((g) => [g.id, g]));
  const seasons = old.seasons || {};
  const compact = (g, s) => ({
    id: g.id,
    date: g.datetime ?? `${g.date}T00:00:00Z`,
    season: s,
    home: g.home_team.id,
    away: g.visitor_team.id,
    hp: g.home_team_score,
    ap: g.visitor_team_score,
    post: Boolean(g.postseason),
  });
  const isFinal = (g) =>
    (String(g.status_state ?? "").toLowerCase() === "final" || /^final/i.test(String(g.status ?? ""))) &&
    g.home_team_score > 0 &&
    g.visitor_team_score > 0;

  for (const s of [season - 1, season]) {
    const stored = [...games.values()].filter((g) => g.season === s);
    if (s < season && seasons[s]?.complete) continue;
    let query = `/v1/games?seasons[]=${s}`;
    if (s === season && stored.length) {
      const last = stored.reduce((m, g) => (g.date > m ? g.date : m), "");
      const from = new Date(Date.parse(last) - 3 * 86400000).toISOString().slice(0, 10);
      query += `&start_date=${from}`;
    }
    const rows = await all(query, key);
    let added = 0;
    for (const g of rows.filter(isFinal)) {
      if (!games.has(g.id)) added++;
      games.set(g.id, compact(g, s));
    }
    const n = [...games.values()].filter((g) => g.season === s).length;
    seasons[s] = { n, complete: s < season && n > 1000 };
    console.log(`  storico NBA ${s}-${String(s + 1).slice(2)}: ${n} partite (+${added})`);
  }
  const keep = [...games.values()].filter((g) => g.season >= season - 1).sort((a, b) => a.date.localeCompare(b.date));
  fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
  fs.writeFileSync(HISTORY, JSON.stringify({ updatedAt: new Date().toISOString(), seasons, games: keep }) + "\n");
}

// `node scripts/fetch-basket-data.mjs --history` updates only data/basket-history.json.
if (process.argv.includes("--history")) {
  loadDotEnv();
  const key = process.env.BALLDONTLIE_API_KEY;
  const now = new Date();
  const season = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  if (!key) {
    console.error("BALLDONTLIE_API_KEY non impostata (nel file .env o nell'ambiente).");
    process.exit(1);
  }
  updateHistory(key, season).catch((err) => {
    console.error("Storico NBA non aggiornato:", err.message);
    process.exit(1);
  });
} else
  main().catch((err) => {
    console.error("Download dati basket non riuscito:", err.message);
    process.exit(1);
  });
