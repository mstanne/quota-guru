// Football data from API-Football (API-Sports, Pro plan): fixtures, results, standings, head-to-head, clubs and
// squads of every competition on the site. Writes, in the same format as before:
//   src/data/football.json       { generatedAt, source, competitions: [{ code, slug, name, area, season, matches,
//                                  standings }], headToHead }  (matches from 45 days ago to 14 days ahead)
//   data/football-history.json   every result of the current and the 2 previous seasons (prediction model)
//   data/football-teams.json     club details, coach and squad (team pages)
//   data/id-map.json             API-Football id → site id (see scripts/lib/id-map.mjs)
// Until November 2026 these files came from football-data.org (whose free plan does not allow commercial use) and,
// for Serie B and the European cups, from scripts/fetch-extra-leagues.mjs: ids, names and URLs stay the same.
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/fetch-football.mjs
// Without the key, or if a competition cannot be downloaded, the previous data of that competition is kept.
// Requests per full run: ~2 per competition (fixtures, standings) + head-to-head of the next matches (cached for a
// day) + current-season results; clubs, squads and coaches are refreshed a few at a time. Well under the Pro quota.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiSports, BudgetError, loadDotEnv, PlanError } from "./lib/api-sports.mjs";
import { footballTeamResolver, loadIdMap, matchIdResolver, MATCH_OFFSET, saveIdMap } from "./lib/id-map.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "football.json");
const HISTORY = path.join(root, "data", "football-history.json");
const TEAMS = path.join(root, "data", "football-teams.json");
const IDMAP = path.join(root, "data", "id-map.json");
const STORE = path.join(root, ".cache", "match-details", "football-store.json");
const STATUS = path.join(root, "public", "stato-dati.json");

import { COMPETITIONS } from "./lib/leagues.mjs";
export { COMPETITIONS };

const DAYS_BACK = 45;
const DAYS_AHEAD = 14;
const HISTORY_SEASONS = 2;
const H2H_DAYS = 7;
const H2H_MAX = 40;
const SQUAD_DAYS = 3; // squads refreshed every N days...
const COACH_DAYS = 7;
const TEAM_STATS_DAYS = 3; // season statistics of a club (/teams/statistics)
const CLUBS_PER_RUN = 80; // ...a few clubs per run
const DAY = 86400e3;

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", JSON.stringify(value) + "\n");
  fs.renameSync(file + ".tmp", file);
};
const fresh = (iso, days) => iso && Date.now() - Date.parse(iso) < days * DAY;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const logo = (u) => (typeof u === "string" && /^https:\/\/media\.api-sports\.io\/football\/teams\/\d+\.png$/.test(u) ? u : null);

// ------------------------------------------------------------------------------------------- conversion
const STATUS_MAP = {
  TBD: "SCHEDULED", NS: "TIMED", "1H": "IN_PLAY", HT: "PAUSED", "2H": "IN_PLAY", ET: "IN_PLAY", BT: "PAUSED",
  P: "IN_PLAY", LIVE: "IN_PLAY", INT: "PAUSED", SUSP: "SUSPENDED", FT: "FINISHED", AET: "FINISHED",
  PEN: "FINISHED", AWD: "AWARDED", WO: "AWARDED", PST: "POSTPONED", CANC: "CANCELLED", ABD: "CANCELLED",
};

/** API-Football round name → stage and matchday as the site uses them. */
export function roundOf(round = "") {
  let m = round.match(/^Regular Season - (\d+)/i);
  if (m) return { stage: "REGULAR_SEASON", matchday: Number(m[1]) };
  m = round.match(/^League Stage - (\d+)/i);
  if (m) return { stage: "LEAGUE_STAGE", matchday: Number(m[1]) };
  // European cups until 2023/24 (and the past seasons of the archive)
  m = round.match(/^Group Stage - (\d+)/i);
  if (m) return { stage: "GROUP_STAGE", matchday: Number(m[1]) };
  // national cups (Coppa Italia): "1st Round", "2nd Round"…
  m = round.match(/^(\d)(?:st|nd|rd|th) Round/i);
  if (m) return { stage: `ROUND_${m[1]}`, matchday: null };
  const r = round.toLowerCase();
  if (r.includes("qualifying") || r.startsWith("preliminary")) return { stage: "QUALIFICATION", matchday: null };
  if (r.includes("knockout round play-offs") || r === "play-offs" || r.includes("play-off")) return { stage: "PLAYOFFS", matchday: null };
  if (r.includes("round of 32") || r.includes("16th finals")) return { stage: "LAST_32", matchday: null };
  if (r.includes("round of 16") || r.includes("8th finals")) return { stage: "LAST_16", matchday: null };
  if (r.includes("quarter")) return { stage: "QUARTER_FINALS", matchday: null };
  if (r.includes("semi")) return { stage: "SEMI_FINALS", matchday: null };
  if (r === "final") return { stage: "FINAL", matchday: null };
  return { stage: "PLAYOFFS", matchday: null };
}

/** One API-Football fixture in the site's match format. `teamOf(apiTeam)` and `idOf(fixture, home, away)` give site ids. */
// API-Football names of the competitions the precedents most often come from, as the site writes them
const H2H_NAMES = {
  "UEFA Champions League": "Champions League",
  "UEFA Europa League": "Europa League",
  "UEFA Europa Conference League": "Conference League",
  "UEFA Conference League": "Conference League",
  "UEFA Super Cup": "Supercoppa europea",
  "Super Cup": "Supercoppa",
  "Club Friendlies": "Amichevole",
  "League Cup": "League Cup",
};
const h2hCompetition = (name) => H2H_NAMES[name] ?? name;

export function compactFixture(f, teamOf, idOf) {
  const short = f.fixture?.status?.short;
  const status = STATUS_MAP[short] ?? "SCHEDULED";
  const { stage, matchday } = roundOf(f.league?.round);
  const g = f.goals ?? {};
  const played = ["FINISHED", "AWARDED", "IN_PLAY", "PAUSED", "SUSPENDED"].includes(status);
  const ft = played ? { home: g.home ?? null, away: g.away ?? null } : { home: null, away: null };
  const ht = f.score?.halftime ?? {};
  const pen = f.score?.penalty;
  let winner = null;
  if (status === "FINISHED" || status === "AWARDED") {
    if (short === "PEN" && pen?.home != null) winner = pen.home > pen.away ? "HOME_TEAM" : "AWAY_TEAM";
    else winner = ft.home > ft.away ? "HOME_TEAM" : ft.home < ft.away ? "AWAY_TEAM" : "DRAW";
  }
  const homeTeam = teamOf(f.teams.home);
  const awayTeam = teamOf(f.teams.away);
  const utcDate = new Date(f.fixture.date).toISOString().replace(".000Z", "Z");
  return {
    id: idOf(f.fixture.id, homeTeam.id, awayTeam.id, utcDate),
    apiId: f.fixture.id,
    utcDate,
    status,
    matchday,
    stage,
    group: null,
    homeTeam,
    awayTeam,
    score: {
      winner,
      fullTime: ft,
      halfTime: { home: ht.home ?? null, away: ht.away ?? null },
      ...(short === "AET" || short === "PEN"
        ? {
            duration: short === "PEN" ? "PENALTY_SHOOTOUT" : "EXTRA_TIME",
            regularTime: f.score?.fulltime ?? null,
            extraTime: f.score?.extratime ?? null,
            penalties: short === "PEN" ? pen : null,
          }
        : {}),
    },
    referee: f.fixture?.referee ? String(f.fixture.referee).split(",")[0].trim() : null,
    // minute of play at the time of the update (matches under way only), e.g. 67 or 45 + 2
    ...(status === "IN_PLAY" && f.fixture?.status?.elapsed != null
      ? { elapsed: f.fixture.status.elapsed, ...(f.fixture.status.extra ? { elapsedExtra: f.fixture.status.extra } : {}) }
      : {}),
  };
}

export function compactStandings(groups, teamOf) {
  return groups
    .filter((rows) => rows.length)
    .map((rows) => ({
      stage: "REGULAR_SEASON",
      group: groups.length > 1 ? (rows[0]?.group ?? null) : null,
      table: rows.map((r) => ({
        position: r.rank,
        team: teamOf(r.team),
        playedGames: r.all?.played ?? 0,
        won: r.all?.win ?? 0,
        draw: r.all?.draw ?? 0,
        lost: r.all?.lose ?? 0,
        points: r.points ?? 0,
        goalsFor: r.all?.goals?.for ?? 0,
        goalsAgainst: r.all?.goals?.against ?? 0,
        goalDifference: r.goalsDiff ?? 0,
      })),
    }));
}

/** Why a player is missing, in Italian (API-Football gives an English reason). */
const BODY = {
  knee: "al ginocchio", ankle: "alla caviglia", hamstring: "al bicipite femorale", thigh: "alla coscia", calf: "al polpaccio",
  groin: "all'inguine", back: "alla schiena", shoulder: "alla spalla", foot: "al piede", hip: "all'anca", achilles: "al tendine d'Achille",
  head: "alla testa", muscle: "muscolare", hand: "alla mano", wrist: "al polso", arm: "al braccio", leg: "alla gamba", toe: "al piede",
  rib: "alle costole", chest: "al torace", neck: "al collo", face: "al volto", adductor: "agli adduttori", quadriceps: "al quadricipite",
};
export function reasonIt(reason = "") {
  const r = reason.toLowerCase();
  if (/suspend|red card|yellow card|card/.test(r)) return "squalifica";
  if (/illness|sick|virus|flu/.test(r)) return "malattia";
  if (/knock/.test(r)) return "botta";
  if (/international|national team/.test(r)) return "impegni con la nazionale";
  if (/personal|family/.test(r)) return "motivi personali";
  if (/lack of fitness|fitness/.test(r)) return "condizione fisica";
  if (/coach|decision/.test(r)) return "scelta tecnica";
  if (/injur|strain|sprain|fracture|broken|ligament|tear|surgery|problem|pain/.test(r) || Object.keys(BODY).some((k) => r.includes(k))) {
    const part = Object.keys(BODY).find((k) => r.includes(k));
    return part ? (BODY[part] === "muscolare" ? "problema muscolare" : `infortunio ${BODY[part]}`) : "infortunio";
  }
  return "non specificato";
}

const POSITION = { Goalkeeper: "Goalkeeper", Defender: "Defence", Midfielder: "Midfield", Attacker: "Offence" };

// ------------------------------------------------------------------------------------------- main
async function main() {
  loadDotEnv(root);
  const key = process.env.API_FOOTBALL_KEY;
  const now = Date.now();
  const previous = readJson(OUT, { competitions: [], headToHead: {} });
  const status = { updatedAt: new Date(now).toISOString(), source: "API-Football", ok: false, competitions: {} };
  if (!key) {
    console.warn("API_FOOTBALL_KEY non impostata: mantengo i dati esistenti (src/data/football.json).");
    return;
  }
  const api = apiSports("football", key);
  const store = readJson(STORE, {});
  store.seasons ??= {};
  store.h2h ??= {};
  store.squads ??= {};
  store.coaches ??= {};
  store.clubs ??= {};

  // ids: pair API-Football teams and matches with those of the previous data (once; see scripts/lib/id-map.mjs)
  const map = loadIdMap(IDMAP);
  const teamsFile = readJson(TEAMS, { teams: {}, competitions: {} });
  const prevTeams = new Map();
  const addTeam = (t, slug) => {
    if (!t?.id) return;
    const e = prevTeams.get(t.id) ?? { team: t, comps: new Set() };
    e.comps.add(slug);
    prevTeams.set(t.id, e);
  };
  for (const c of previous.competitions ?? []) {
    for (const m of c.matches ?? []) for (const t of [m.homeTeam, m.awayTeam]) addTeam(t, c.slug);
    for (const g of c.standings ?? []) for (const r of g.table ?? []) addTeam(r.team, c.slug);
  }
  for (const [slug, ids] of Object.entries(teamsFile.competitions ?? {}))
    for (const id of ids) if (teamsFile.teams?.[id]) addTeam(teamsFile.teams[id], slug);
  const resolveTeam = footballTeamResolver(map, [...prevTeams.values()], logo);
  const prevMatches = (previous.competitions ?? []).flatMap((c) => (c.matches ?? []).map((match) => ({ match, comp: c.slug })));
  const resolveMatch = matchIdResolver(map.footballMatches, prevMatches);

  const from = isoDay(now - DAYS_BACK * DAY);
  const to = isoDay(now + DAYS_AHEAD * DAY);
  const competitions = [];
  const history = readJson(HISTORY, { seasons: {}, results: [] });
  history.seasons ??= {};
  const keepHistory = new Map((history.results ?? []).map((r) => [String(r.id), r]));
  let stopped = null;

  for (const c of COMPETITIONS) {
    const prev = (previous.competitions ?? []).find((x) => x.code === c.code);
    if (stopped) {
      if (prev) competitions.push(prev);
      continue;
    }
    try {
      // current season (refreshed daily): year, start and end dates
      if (!fresh(store.seasons[c.code]?.at, 1)) {
        const lg = await api.get(`/leagues?id=${c.api}&current=true`);
        const s = lg[0]?.seasons?.find((x) => x.current) ?? lg[0]?.seasons?.[0];
        if (s) store.seasons[c.code] = { at: new Date(now).toISOString(), year: s.year, start: s.start, end: s.end };
      }
      const season = store.seasons[c.code];
      if (!season) throw new Error("stagione corrente non trovata");
      const teamOf = (t) => resolveTeam(t, c.slug);
      const idOf = (apiId, home, away, date) => resolveMatch(apiId, c.slug, home, away, date);

      const fixtures = await api.get(`/fixtures?league=${c.api}&season=${season.year}&from=${from}&to=${to}`);
      const matches = fixtures.map((f) => compactFixture(f, teamOf, idOf)).sort((a, b) => a.utcDate.localeCompare(b.utcDate));
      let standings = prev?.standings ?? [];
      try {
        const s = await api.get(`/standings?league=${c.api}&season=${season.year}`);
        const st = compactStandings(s[0]?.league?.standings ?? [], teamOf);
        if (st.length) standings = st;
      } catch (err) {
        if (err instanceof BudgetError || err instanceof PlanError) throw err;
        console.warn(`  classifica ${c.name} non disponibile: ${err.message}`);
      }
      const regular = matches.filter((m) => m.matchday != null);
      const next = regular.find((m) => !["FINISHED", "AWARDED", "CANCELLED"].includes(m.status));
      const comp = {
        code: c.code,
        slug: c.slug,
        name: c.name,
        area: c.area,
        season: {
          startDate: season.start,
          endDate: season.end,
          currentMatchday: next?.matchday ?? regular.at(-1)?.matchday ?? null,
        },
        matches,
        standings,
      };
      // top scorers, assists and cards (4 requests, refreshed daily): /calcio/<competition>/marcatori
      store.leaders ??= {};
      if (!fresh(store.leaders[c.code]?.at, 1) || store.leaders[c.code]?.season !== season.year) {
        const row = (r) => {
          const st = r.statistics?.find((x) => x.league?.id === c.api) ?? r.statistics?.[0] ?? {};
          const t = st.team ? teamOf(st.team) : null;
          return {
            id: r.player?.id ?? null,
            name: r.player?.name ?? "",
            first: r.player?.firstname ?? null,
            last: r.player?.lastname ?? null,
            nationality: r.player?.nationality ?? null,
            team: t ? { id: t.id, shortName: t.shortName, crest: t.crest } : null,
            apps: st.games?.appearences ?? 0,
            min: st.games?.minutes ?? 0,
            goals: st.goals?.total ?? 0,
            assists: st.goals?.assists ?? 0,
            pen: st.penalty?.scored ?? 0,
            yellow: st.cards?.yellow ?? 0,
            red: (st.cards?.red ?? 0) + (st.cards?.yellowred ?? 0),
          };
        };
        const get = async (what) => (await api.get(`/players/${what}?league=${c.api}&season=${season.year}`)).slice(0, 20).map(row);
        store.leaders[c.code] = {
          at: new Date(now).toISOString(),
          season: season.year,
          scorers: await get("topscorers"),
          assists: await get("topassists"),
          yellow: await get("topyellowcards"),
          red: await get("topredcards"),
        };
      }
      {
        const { at, season: _s, ...lists } = store.leaders[c.code];
        if (lists.scorers?.length) comp.leaders = { updatedAt: at, ...lists };
      }
      // a competition with nothing to show (e.g. a cup between seasons) stays off the site
      if (matches.length || standings.length) competitions.push(comp);
      status.competitions[c.code] = { ok: true, matches: matches.length };
      console.log(`${c.name}: ${matches.length} partite, classifica ${standings.length ? "sì" : "no"}`);

      // history for the model: the whole current season at every run, past seasons once
      for (let y = season.year; y >= season.year - HISTORY_SEASONS; y--) {
        const hk = `${c.code}-${y}`;
        if (y !== season.year && history.seasons[hk]?.n > 0) continue;
        const list = (await api.get(`/fixtures?league=${c.api}&season=${y}&status=FT-AET-PEN-AWD`))
          .filter((f) => f.goals?.home != null)
          .map((f) => {
            const home = teamOf(f.teams.home).id;
            const away = teamOf(f.teams.away).id;
            const date = new Date(f.fixture.date).toISOString().replace(".000Z", "Z");
            // the current season shares ids with the matches above; past seasons need no pairing
            const id = y === season.year ? idOf(f.fixture.id, home, away, date) : MATCH_OFFSET + f.fixture.id;
            return { id, date, comp: c.code, home, away, hg: f.goals.home, ag: f.goals.away };
          });
        if (!list.length && y !== season.year) continue;
        // a season comes from one source only: drop what an older source left for it
        for (const [k, r] of keepHistory) if (r.comp === c.code && seasonStartOf(r.date, c.code) === y) keepHistory.delete(k);
        for (const r of list) keepHistory.set(String(r.id), r);
        history.seasons[hk] = { n: list.length, source: "api-football" };
        if (y !== season.year) console.log(`  storico ${hk}: ${list.length} risultati`);
      }
    } catch (err) {
      status.competitions[c.code] = { ok: false, message: err.message.slice(0, 160) };
      console.warn(`${c.name}: non aggiornata (${err.message})`);
      if (prev) competitions.push(prev);
      if (err instanceof BudgetError || err instanceof PlanError) stopped = err.message;
    }
  }

  // head-to-head of the next matches (1 request per pairing, kept for a day)
  const headToHead = {};
  const soon = now + H2H_DAYS * DAY;
  const upcoming = competitions
    .flatMap((c) => c.matches.map((m) => ({ c, m })))
    .filter(({ m }) => ["SCHEDULED", "TIMED"].includes(m.status) && Date.parse(m.utcDate) <= soon && m.apiId)
    .sort((a, b) => a.m.utcDate.localeCompare(b.m.utcDate))
    .slice(0, H2H_MAX);
  for (const { c, m } of upcoming) {
    const pair = `${m.homeTeam.id}-${m.awayTeam.id}`;
    try {
      if (!stopped && !fresh(store.h2h[pair]?.at, 1)) {
        const homeApi = apiTeamId(map, m.homeTeam.id);
        const awayApi = apiTeamId(map, m.awayTeam.id);
        if (homeApi && awayApi) {
          // a few more than shown: friendlies are dropped below
          const list = await api.get(`/fixtures/headtohead?h2h=${homeApi}-${awayApi}&last=10`);
          store.h2h[pair] = { at: new Date(now).toISOString(), list };
        }
      }
      // official matches only: friendlies ("Friendlies Clubs") say little and read oddly as precedents
      const list = (store.h2h[pair]?.list ?? [])
        .filter((f) => f.fixture?.id !== m.apiId && f.goals?.home != null && !/friendl/i.test(f.league?.name ?? ""))
        .slice(0, 6);
      if (!store.h2h[pair]) continue;
      const teamOf = (t) => resolveTeam(t, c.slug);
      headToHead[m.id] = {
        numberOfMatches: list.length,
        totalGoals: list.reduce((n, f) => n + (f.goals.home ?? 0) + (f.goals.away ?? 0), 0),
        matches: list.slice(0, 5).map((f) => ({
          id: MATCH_OFFSET + f.fixture.id,
          utcDate: new Date(f.fixture.date).toISOString().replace(".000Z", "Z"),
          competition: h2hCompetition(f.league?.name ?? ""),
          homeTeam: teamOf(f.teams.home),
          awayTeam: teamOf(f.teams.away),
          score: { fullTime: { home: f.goals.home, away: f.goals.away } },
        })),
      };
    } catch (err) {
      if (err instanceof BudgetError || err instanceof PlanError) stopped = err.message;
      console.warn(`  precedenti non disponibili per ${m.homeTeam.shortName} – ${m.awayTeam.shortName}: ${err.message}`);
    }
  }
  for (const [pair, v] of Object.entries(store.h2h)) if (!fresh(v.at, 3)) delete store.h2h[pair];
  console.log(`Precedenti: ${Object.keys(headToHead).length} partite`);

  // live data gathered by the quick runs (line-ups, events, statistics: scripts/fetch-live-scores.mjs) stay with
  // their matches until the full details arrive
  const prevById = new Map((previous.competitions ?? []).flatMap((c) => (c.matches ?? []).map((m) => [m.id, m])));
  for (const c of competitions)
    for (const m of c.matches) {
      const old = prevById.get(m.id);
      if (old?.live && !m.live) m.live = old.live;
    }

  // injured and suspended players of the matches of the next 3 days (20 matches per request)
  if (!stopped) {
    const soonest = competitions
      .flatMap((c) => c.matches)
      .filter((m) => {
        const t = Date.parse(m.utcDate);
        return m.apiId && ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"].includes(m.status) && t >= now - 4 * 3600e3 && t <= now + 3 * DAY;
      });
    const sideOf = (m, apiTeamId) => {
      const site = map.footballTeams[String(apiTeamId)]?.id;
      return site === m.homeTeam.id ? "home" : site === m.awayTeam.id ? "away" : null;
    };
    try {
      for (let i = 0; i < soonest.length; i += 20) {
        const chunk = soonest.slice(i, i + 20);
        const list = await api.get(`/injuries?ids=${chunk.map((m) => m.apiId).join("-")}`);
        for (const m of chunk) {
          const rows = list.filter((r) => r.fixture?.id === m.apiId);
          const out = { home: [], away: [] };
          const seen = new Set();
          for (const r of rows) {
            const side = sideOf(m, r.team?.id);
            if (!side || !r.player?.name) continue;
            // the API can list the same player more than once for a match: one row per player
            const key = r.player.id ?? `${side}|${r.player.name}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out[side].push({
              id: r.player.id ?? null, // API-Football id: link to the player page
              name: r.player.name,
              doubtful: r.player.type === "Questionable",
              reason: reasonIt(r.player.reason),
            });
          }
          if (out.home.length || out.away.length) m.injuries = out;
        }
      }
      console.log(`Indisponibili: ${soonest.filter((m) => m.injuries).length} partite su ${soonest.length} dei prossimi 3 giorni`);
    } catch (err) {
      if (err instanceof BudgetError || err instanceof PlanError) stopped = err.message;
      console.warn(`Indisponibili non aggiornati: ${err.message}`);
    }
  }

  // clubs, coaches and squads of the domestic leagues (team pages), a few clubs per run
  if (!stopped) {
    try {
      await updateClubs(api, competitions, teamsFile, store, map, now);
    } catch (err) {
      console.warn(`Squadre: aggiornamento interrotto (${err.message})`);
    }
  }

  if (!competitions.length) {
    console.warn("Nessuna competizione scaricata: mantengo i dati esistenti.");
    return;
  }
  const oldest = Math.min(...competitions.map((c) => Number(c.season?.startDate?.slice(0, 4)) || 9999)) - HISTORY_SEASONS;
  history.results = [...keepHistory.values()]
    .filter((r) => Number(r.date.slice(0, 4)) >= oldest)
    .sort((a, b) => a.date.localeCompare(b.date));
  history.updatedAt = new Date(now).toISOString();
  writeJson(HISTORY, history);
  writeJson(OUT, { generatedAt: new Date(now).toISOString(), source: "API-Football", competitions, headToHead });
  saveIdMap(IDMAP, map);
  writeJson(STORE, store);
  status.ok = !stopped && Object.values(status.competitions).every((s) => s.ok);
  if (stopped) status.message = stopped;
  Object.assign(status, api.stats());
  const st = readJson(STATUS, {});
  st.calendarioCalcio = status;
  writeJson(STATUS, st);
  const total = competitions.reduce((n, c) => n + c.matches.length, 0);
  console.log(`Salvato src/data/football.json: ${competitions.length} competizioni, ${total} partite (${api.stats().requests} richieste).`);
}

const seasonStartOf = (date, code) => {
  const y = Number(date.slice(0, 4));
  return code === "BSA" ? y : Number(date.slice(5, 7)) >= 7 ? y : y - 1;
};

/** API-Football team id of a site team id (from the id map). */
function apiTeamId(map, siteId) {
  for (const [apiId, t] of Object.entries(map.footballTeams)) if (t.id === siteId) return Number(apiId);
  return null;
}

/** /teams/statistics in compact form (the answer is an object, not a list). */
function compactTeamStats(st, slug, season) {
  const minutes = (o) =>
    Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, v?.total ?? 0]).filter(([k]) => /^\d+-\d+$/.test(k)));
  const hat = (o) => ({ home: o?.home ?? 0, away: o?.away ?? 0, total: o?.total ?? 0 });
  return {
    competition: slug,
    season,
    form: typeof st.form === "string" ? st.form.slice(-10) : null,
    played: hat(st.fixtures?.played),
    goalsByMinute: { for: minutes(st.goals?.for?.minute), against: minutes(st.goals?.against?.minute) },
    cleanSheets: hat(st.clean_sheet),
    failedToScore: hat(st.failed_to_score),
    penalty: { scored: st.penalty?.scored?.total ?? 0, missed: st.penalty?.missed?.total ?? 0 },
    formations: (st.lineups ?? []).slice(0, 4).map((l) => ({ formation: l.formation, played: l.played })),
    streak: { wins: st.biggest?.streak?.wins ?? 0, draws: st.biggest?.streak?.draws ?? 0, loses: st.biggest?.streak?.loses ?? 0 },
    biggestWin: { home: st.biggest?.wins?.home ?? null, away: st.biggest?.wins?.away ?? null },
  };
}

async function updateClubs(api, competitions, teamsFile, store, map, now) {
  teamsFile.teams ??= {};
  teamsFile.competitions ??= {};
  let budget = CLUBS_PER_RUN;
  for (const def of COMPETITIONS.filter((c) => c.domestic)) {
    const comp = competitions.find((c) => c.code === def.code);
    const season = store.seasons[def.code]?.year;
    if (!comp || !season) continue;
    // club list with venue and founding year (1 request per league, refreshed weekly)
    const ck = `${def.code}-${season}`;
    if (!fresh(store.clubs[ck]?.at, 7)) {
      store.clubs[ck] = { at: new Date(now).toISOString(), list: await api.get(`/teams?league=${def.api}&season=${season}`) };
    }
    const ids = [];
    for (const entry of store.clubs[ck].list) {
      const t = entry.team;
      if (!t?.id) continue;
      const known = map.footballTeams[String(t.id)];
      // only clubs already in the site's data (resolved through fixtures or standings)
      if (!known) continue;
      ids.push(known.id);
      const old = teamsFile.teams[known.id] ?? {};
      const v = entry.venue ?? {};
      const out = {
        id: known.id,
        name: known.name,
        shortName: known.shortName,
        tla: known.tla,
        crest: logo(t.logo) ?? old.crest ?? null,
        area: t.country ?? old.area ?? null,
        address: [v.address, v.city].filter(Boolean).join(", ") || old.address || null,
        // colours and website are not in API-Football: kept from the previous data when known
        website: old.website ?? null,
        founded: Number.isFinite(t.founded) ? t.founded : (old.founded ?? null),
        colors: old.colors ?? null,
        venue: v.name ?? old.venue ?? null,
        coach: old.coach ?? null,
        squad: old.squad ?? [],
        updatedAt: old.updatedAt ?? null,
      };
      if (budget > 0 && !fresh(store.squads[t.id], SQUAD_DAYS)) {
        budget--;
        const sq = await api.get(`/players/squads?team=${t.id}`);
        const players = sq[0]?.players ?? [];
        if (players.length) {
          const before = new Map((old.squad ?? []).map((p) => [p.name, p]));
          out.squad = players.map((p) => ({
            id: p.id ?? null, // API-Football id: link to the player page
            name: p.name ?? "",
            position: POSITION[p.position] ?? p.position ?? null,
            // birth date and nationality are not in this answer: kept when the player was already known
            born: before.get(p.name)?.born ?? null,
            nationality: before.get(p.name)?.nationality ?? null,
            number: p.number ?? null,
            age: p.age ?? null,
          }));
          out.updatedAt = new Date(now).toISOString();
        }
        store.squads[t.id] = new Date(now).toISOString();
      }
      if (budget > 0 && !fresh(store.coaches[t.id], COACH_DAYS)) {
        budget--;
        const coaches = await api.get(`/coachs?team=${t.id}`);
        const current = coaches.find((c) => c.career?.[0]?.team?.id === t.id && !c.career[0].end);
        if (current)
          out.coach = { name: current.name, nationality: current.nationality ?? null, since: current.career[0].start ?? null };
        store.coaches[t.id] = new Date(now).toISOString();
      }
      // season statistics in the league: goals by minute, clean sheets, penalties, formations, streaks
      store.teamStats ??= {};
      if (budget > 0 && !fresh(store.teamStats[`${t.id}-${def.code}`], TEAM_STATS_DAYS)) {
        budget--;
        const ts = await api.get(`/teams/statistics?league=${def.api}&season=${season}&team=${t.id}`);
        const st = Array.isArray(ts) ? ts[0] : ts;
        if (st?.fixtures) out.stats = compactTeamStats(st, comp.slug, season);
        store.teamStats[`${t.id}-${def.code}`] = new Date(now).toISOString();
      }
      if (!out.stats && old.stats) out.stats = old.stats;
      teamsFile.teams[known.id] = out;
    }
    if (ids.length) teamsFile.competitions[comp.slug] = ids;
  }
  teamsFile.updatedAt = new Date(now).toISOString();
  writeJson(TEAMS, teamsFile);
  console.log(`Squadre: ${Object.keys(teamsFile.teams).length} club (${CLUBS_PER_RUN - budget} richieste per rose e allenatori)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("Download dati calcio non riuscito:", err.message);
    process.exit(1);
  });
}
