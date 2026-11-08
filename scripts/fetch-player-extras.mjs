// Per-player data of the football player pages, from API-Football (Pro plan):
//   transfers   /transfers?player=<id>   club changes with date and type (loan, free, fee)
//   trophies    /trophies?player=<id>    titles and placings, by competition and season
//   sidelined   /sidelined?player=<id>   injuries and suspensions with start and end date
//   unavailable /injuries?league=<id>&season=<y>   players out or doubtful for their team's next match
//                                         (one request per competition, every run)
// Writes data/giocatori-extra.json, which is also the state of the downloads (date of each player's last download),
// kept in the data snapshot and in the `dati` branch (scripts/data-branch.sh).
//
// One request per player and kind of data, so the work is spread over many runs: players who played most this
// season first, at most PLAYER_EXTRAS_MAX requests per run (default 250; ~5,000 players × 3 kinds ≈ 15,000 requests,
// a full pass in about a week of runs every 3 hours). Afterwards each kind is downloaded again only when it is old:
// transfers and injuries every 30 days, trophies every 90. The client stops when fewer than 1,500 requests are left
// in the day, so the match data always come first.
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/fetch-player-extras.mjs     (never fails the build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiSports, BudgetError, loadDotEnv, PlanError } from "./lib/api-sports.mjs";
import { COMPETITIONS } from "./lib/leagues.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "data", "giocatori-extra.json");
const MAX = Number(process.env.PLAYER_EXTRAS_MAX ?? 250);
const DAY = 86400e3;
/** Days before each kind of data is downloaded again. */
export const REFRESH_DAYS = { transfers: 30, trophies: 90, sidelined: 30 };
const KEEP_SIDELINED = 30; // most recent entries kept per player

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const team = (t) => (t?.id != null ? { id: t.id, name: t.name ?? "" } : null);

/** Compact forms of the API answers (exported for the tests). */
export function compactTransfers(response) {
  const list = response.flatMap((r) => r.transfers ?? []);
  const seen = new Set();
  return list
    .map((t) => ({ date: t.date ?? null, type: t.type ?? null, from: team(t.teams?.out), to: team(t.teams?.in) }))
    .filter((t) => {
      const k = `${t.date}|${t.from?.id}|${t.to?.id}`;
      if (!t.date || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
export const compactTrophies = (response) =>
  response
    .map((t) => ({ league: t.league ?? "", country: t.country ?? null, season: t.season ?? null, place: t.place ?? null }))
    .filter((t) => t.league);
export const compactSidelined = (response) =>
  response
    .map((s) => ({ type: s.type ?? "", start: s.start ?? null, end: s.end ?? null }))
    .filter((s) => s.type && s.start)
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, KEEP_SIDELINED);

/**
 * Players out or doubtful for their team's next match: the latest /injuries entry of each player whose fixture has
 * not been played yet (kick-off after `now` minus 3 hours).
 */
export function upcomingAbsences(response, now) {
  const out = {};
  for (const r of response) {
    const id = r.player?.id;
    const date = r.fixture?.date;
    if (id == null || !date || Date.parse(date) < now - 3 * 3600e3) continue;
    const cur = out[id];
    // the nearest upcoming match counts
    if (cur && Date.parse(cur.date) <= Date.parse(date)) continue;
    out[id] = {
      type: r.player?.type ?? null, // "Missing Fixture" | "Questionable"
      reason: r.player?.reason ?? null,
      date,
      fixture: r.fixture?.id ?? null,
      team: team(r.team),
    };
  }
  return out;
}

/** Players of the current season with an id, most minutes first (data/team-seasons-api.json, src/data/football.json). */
function currentPlayers() {
  const api = readJson(path.join(root, "data", "team-seasons-api.json"), { football: {} });
  const football = readJson(path.join(root, "src", "data", "football.json"), { competitions: [] });
  const years = new Set(football.competitions.map((c) => Number(c.season?.startDate?.slice(0, 4))).filter(Boolean));
  const best = new Map();
  for (const [key, list] of Object.entries(api.football ?? {})) {
    const y = Number(key.split("-")[1]);
    if (!years.has(y) || !Array.isArray(list)) continue;
    for (const p of list) if (p?.id != null && (best.get(p.id) ?? -1) < (p.min ?? 0)) best.set(p.id, p.min ?? 0);
  }
  return [...best.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

async function main() {
  loadDotEnv(root);
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return console.log("API_FOOTBALL_KEY non impostata: dati extra dei giocatori invariati.");
  const now = Date.now();
  const store = readJson(OUT, { players: {}, unavailable: {} });
  store.players ??= {};
  const api = apiSports("football", key, { reserve: 1500 });
  let used = 0;
  const report = { transfers: 0, trophies: 0, sidelined: 0, unavailable: 0 };
  try {
    // out or doubtful for the next match: every competition of the current season, every run
    const football = readJson(path.join(root, "src", "data", "football.json"), { competitions: [] });
    const unavailable = {};
    let complete = true;
    // national teams: their absences come with the fixtures (/injuries?ids=, scripts/fetch-football.mjs)
    for (const c of COMPETITIONS.filter((c) => !c.national)) {
      const y = Number(football.competitions.find((x) => x.slug === c.slug)?.season?.startDate?.slice(0, 4));
      if (!y) continue;
      try {
        used++;
        const list = await api.get(`/injuries?league=${c.api}&season=${y}`);
        for (const [id, a] of Object.entries(upcomingAbsences(list, now)))
          if (!unavailable[id] || Date.parse(a.date) < Date.parse(unavailable[id].date)) unavailable[id] = a;
      } catch (err) {
        if (err instanceof BudgetError) throw err;
        complete = false;
        console.log(`  indisponibili ${c.name}: ${err.message}`);
      }
    }
    // a partial answer must not drop absences found earlier
    store.unavailable = complete ? unavailable : { ...(store.unavailable ?? {}), ...unavailable };
    store.unavailableAt = new Date(now).toISOString();
    report.unavailable = Object.keys(store.unavailable).length;

    // transfers, trophies, injury history: one request each, the most used players first, only when old
    const stale = (p, kind) => !p.fetched?.[kind] || now - Date.parse(p.fetched[kind]) > REFRESH_DAYS[kind] * DAY;
    for (const id of currentPlayers()) {
      if (used >= MAX) break;
      const p = (store.players[id] ??= { fetched: {} });
      p.fetched ??= {};
      for (const [kind, url, compact] of [
        ["transfers", `/transfers?player=${id}`, compactTransfers],
        ["sidelined", `/sidelined?player=${id}`, compactSidelined],
        ["trophies", `/trophies?player=${id}`, compactTrophies],
      ]) {
        if (used >= MAX || !stale(p, kind)) continue;
        used++;
        try {
          p[kind] = compact(await api.get(url));
          p.fetched[kind] = new Date(now).toISOString();
          report[kind]++;
        } catch (err) {
          if (err instanceof BudgetError || err instanceof PlanError) throw err;
          console.log(`  giocatore ${id}, ${kind}: ${err.message}`);
        }
      }
    }
  } catch (err) {
    if (!(err instanceof BudgetError || err instanceof PlanError)) throw err;
    console.log(`Dati extra dei giocatori interrotti: ${err.message}`);
  } finally {
    store.updatedAt = new Date(now).toISOString();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT + ".tmp", JSON.stringify(store) + "\n");
    fs.renameSync(OUT + ".tmp", OUT);
  }
  const done = Object.values(store.players).filter((p) => p.fetched?.transfers && p.fetched?.sidelined && p.fetched?.trophies).length;
  console.log(
    `Dati extra dei giocatori: ${api.stats().requests} richieste; aggiornati ${report.transfers} trasferimenti, ` +
      `${report.sidelined} storici infortuni, ${report.trophies} palmarès; ${report.unavailable} indisponibili; ` +
      `${done} giocatori completi su ${currentPlayers().length}.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => console.warn("Dati extra dei giocatori non aggiornati:", err.message));
}
