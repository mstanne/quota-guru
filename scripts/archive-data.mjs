// Permanent archive of the site's data (data/archivio/, saved in the `dati` branch by scripts/data-branch.sh).
//
// The data the site downloads are a moving window (football matches from 45 days ago, three seasons of results for
// the model, the latest squads), so what leaves the window would survive only in the commit history. After every full
// data refresh this script copies what was downloaded into an archive that only grows:
//   data/archivio/calcio/<competition>/<season>/<YYYY-MM>.json   every finished match with its details (scorers, cards,
//                                                    substitutions, line-ups, statistics, best player, highlights)
//   data/archivio/nba/<season>/<YYYY-MM>.json        every finished NBA game with quarters and box score
//   data/archivio/risultati/<sport>-<season>.json    every result ever used by the prediction models
//   data/archivio/squadre/anagrafica.json            clubs: identity, logo, venue
//   data/archivio/squadre/<sport>-<season>.json      squad and coach of every club, season by season
//   data/archivio/giocatori/<sport>-<season>.json    players' season statistics by team
// Files are split by month (matches) or season, so a refresh rewrites only the few files that changed and the
// history of the `dati` branch stays small.
//   data/archivio/loghi/calcio/<id>.png                club logos, served by the site from /loghi/calcio/
// Entries are added or updated, never deleted. Past seasons are filled in by scripts/backfill-archive.mjs.
//
// Logos: the API-Football logos are downloaded once and the site uses its own copy (no dependency on the provider's
// CDN, also after the subscription ends); src/data/football.json and data/football-teams.json are rewritten to point
// to /loghi/calcio/. Club logos are trademarks of the clubs, used to identify them (see the site's terms).
//
// Usage:  node scripts/archive-data.mjs     (after the downloads, before the build; never fails the build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ARCHIVE = path.join(root, "data", "archivio");
const LOGOS = path.join(ARCHIVE, "loghi", "calcio");
const PUBLIC_LOGOS = path.join(root, "public", "loghi", "calcio");
export const LOGO_PATH = "/loghi/calcio/";
const API_LOGO = /^https:\/\/media\.api-sports\.io\/football\/teams\/(\d+)\.png$/;

export const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", JSON.stringify(value) + "\n");
  fs.renameSync(file + ".tmp", file);
}
const FINAL = new Set(["FINISHED", "AWARDED"]);
/** Season start year: European seasons start in July, the Brasileirão follows the calendar year. */
export const seasonOf = (date, code) => {
  const y = Number(date.slice(0, 4));
  return code === "BSA" ? y : Number(date.slice(5, 7)) >= 7 ? y : y - 1;
};
const team = (t) => ({ id: t.id, name: t.name, shortName: t.shortName, tla: t.tla ?? t.abbr ?? "" });

/** Football match in archive form. `details`: compact API-Football details (scripts/lib/match-details.mjs). */
export function archivedMatch(m, details, highlight) {
  return {
    id: m.id,
    apiId: m.apiId ?? details?.fixture ?? null,
    utcDate: m.utcDate,
    status: m.status,
    stage: m.stage ?? null,
    matchday: m.matchday ?? null,
    home: team(m.homeTeam),
    away: team(m.awayTeam),
    score: m.score,
    referee: m.referee ?? details?.referee ?? null,
    ...(details
      ? { venue: details.venue ?? null, timeline: details.timeline, lineups: details.lineups, stats: details.stats, top: details.top }
      : {}),
    ...(highlight ? { highlight: { video: highlight.video, title: highlight.title, channel: highlight.channel ?? null } } : {}),
  };
}

/** Month file of a match: <dir>/<season>/<YYYY-MM>.json (kick-off month, UTC). */
export const monthFile = (dir, season, utcDate) => path.join(dir, String(season), `${utcDate.slice(0, 7)}.json`);

/** Adds matches to their month files (`dir`: competition folder). Returns how many were added or changed. */
export function upsertMatches(dir, meta, season, matches) {
  const byFile = new Map();
  for (const m of matches) {
    const f = monthFile(dir, season, m.utcDate);
    byFile.set(f, [...(byFile.get(f) ?? []), m]);
  }
  let n = 0;
  for (const [f, list] of byFile) n += upsertFile(f, { ...meta, season }, list);
  return n;
}

/** Adds or updates matches in one file. Keeps details already archived if the new copy has none. */
export function upsertFile(file, meta, matches) {
  const cur = readJson(file, { ...meta, matches: {} });
  let n = 0;
  for (const m of matches) {
    const old = cur.matches[m.id];
    const merged = old ? { ...old, ...m, ...(m.timeline ? {} : pick(old, ["venue", "timeline", "lineups", "stats", "top"])) } : m;
    if (!old || JSON.stringify(old) !== JSON.stringify(merged)) n++;
    cur.matches[m.id] = merged;
  }
  if (n) writeJson(file, { ...cur, ...meta, updatedAt: new Date().toISOString() });
  return n;
}
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

// ------------------------------------------------------------------------------------------- logos
async function downloadLogo(apiId) {
  const file = path.join(LOGOS, `${apiId}.png`);
  if (fs.existsSync(file)) return true;
  try {
    const res = await fetch(`https://media.api-sports.io/football/teams/${apiId}.png`);
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100 || buf.length > 500_000) return false;
    fs.mkdirSync(LOGOS, { recursive: true });
    fs.writeFileSync(file, buf);
    return true;
  } catch {
    return false;
  }
}

/** Replaces the API-Football logo URLs found in `value` with the site's copy, downloading the missing ones. */
async function localLogos(value, stats) {
  const urls = new Set();
  JSON.stringify(value, (k, v) => {
    if (typeof v === "string" && API_LOGO.test(v)) urls.add(v);
    return v;
  });
  const ok = new Set();
  for (const u of urls) {
    const id = u.match(API_LOGO)[1];
    if (await downloadLogo(id)) ok.add(u);
    else stats.failed++;
  }
  const rewrite = (v) => {
    if (Array.isArray(v)) return v.map(rewrite);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rewrite(x)]));
    if (typeof v === "string" && ok.has(v)) return LOGO_PATH + v.match(API_LOGO)[1] + ".png";
    return v;
  };
  return rewrite(value);
}

// ------------------------------------------------------------------------------------------- main
async function main() {
  const football = readJson(path.join(root, "src", "data", "football.json"), null);
  const basket = readJson(path.join(root, "src", "data", "basket.json"), null);
  const fDetails = readJson(path.join(root, "src", "data", "football-details.json"), {});
  const bDetails = readJson(path.join(root, "src", "data", "basket-details.json"), {});
  const highlights = readJson(path.join(root, "src", "data", "highlights.json"), {});
  const fTeams = readJson(path.join(root, "data", "football-teams.json"), { teams: {}, competitions: {} });
  const seasonsApi = readJson(path.join(root, "data", "team-seasons-api.json"), {});
  const report = { matches: 0, games: 0, results: 0, teams: 0, players: 0 };

  // football matches, by competition and season
  for (const c of football?.competitions ?? []) {
    const bySeason = new Map();
    for (const m of c.matches ?? []) {
      if (!FINAL.has(m.status)) continue;
      const y = seasonOf(m.utcDate, c.code);
      const list = bySeason.get(y) ?? [];
      list.push(archivedMatch(m, fDetails[m.id], highlights[c.slug]?.[m.id]));
      bySeason.set(y, list);
    }
    for (const [y, list] of bySeason)
      report.matches += upsertMatches(path.join(ARCHIVE, "calcio", c.slug), { competition: c.name, code: c.code, slug: c.slug }, y, list);
  }

  // NBA games
  const games = (basket?.nba?.games ?? []).filter((g) => g.status === "final");
  if (games.length) {
    const s = basket.nba.season;
    report.games += upsertMatches(
      path.join(ARCHIVE, "nba"),
      { competition: "NBA" },
      s,
      games.map((g) => ({
        id: g.id,
        apiId: g.apiId ?? null,
        utcDate: g.utcDate,
        postseason: g.postseason,
        home: team(g.home),
        away: team(g.away),
        score: g.score,
        periods: g.periods,
        ...(bDetails[g.id] ? { boxScore: bDetails[g.id] } : {}),
        ...(highlights.nba?.[g.id] ? { highlight: { video: highlights.nba[g.id].video, title: highlights.nba[g.id].title } } : {}),
      })),
    );
  }

  // every result used by the models (the model files keep only three seasons), by sport and season
  const fh = readJson(path.join(root, "data", "football-history.json"), { results: [] });
  const bh = readJson(path.join(root, "data", "basket-history.json"), { games: [] });
  const groups = new Map();
  for (const r of fh.results ?? []) {
    const k = `calcio-${seasonOf(r.date, r.comp)}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  for (const g of bh.games ?? []) {
    const k = `nba-${g.season ?? seasonOf(g.date, "NBA")}`;
    groups.set(k, [...(groups.get(k) ?? []), g]);
  }
  for (const [k, list] of groups) {
    const file = path.join(ARCHIVE, "risultati", `${k}.json`);
    const cur = readJson(file, { results: {} });
    let n = 0;
    for (const r of list) if (!cur.results[r.id]) (cur.results[r.id] = r), n++;
    if (n) writeJson(file, { ...cur, updatedAt: new Date().toISOString() });
    report.results += n;
  }

  // clubs: identity (one file) and squad and coach season by season (one file per season)
  const idFile = path.join(ARCHIVE, "squadre", "anagrafica.json");
  const ids = readJson(idFile, { calcio: {}, nba: {} });
  const compOf = new Map();
  for (const [slug, list] of Object.entries(fTeams.competitions ?? {})) for (const id of list) compOf.set(id, slug);
  const perSeason = new Map();
  for (const t of Object.values(fTeams.teams ?? {})) {
    const c = football?.competitions?.find((x) => x.slug === compOf.get(t.id));
    const e = ids.calcio[t.id] ?? {};
    ids.calcio[t.id] = { id: t.id, name: t.name, shortName: t.shortName, tla: t.tla, crest: t.crest ?? e.crest ?? null, founded: t.founded ?? e.founded ?? null, venue: t.venue ?? e.venue ?? null, area: t.area ?? e.area ?? null };
    const y = c?.season?.startDate ? Number(c.season.startDate.slice(0, 4)) : null;
    if (y && (t.squad?.length || t.coach)) {
      const m = perSeason.get(y) ?? {};
      m[t.id] = { competition: c.slug, coach: t.coach ?? null, squad: t.squad ?? [] };
      perSeason.set(y, m);
    }
  }
  for (const g of basket?.nba?.games ?? []) for (const t of [g.home, g.away]) ids.nba[t.id] = { ...ids.nba[t.id], ...t };
  writeJson(idFile, { ...ids, updatedAt: new Date().toISOString() });
  for (const [y, clubs] of perSeason) {
    const file = path.join(ARCHIVE, "squadre", `calcio-${y}.json`);
    const cur = readJson(file, { season: y, teams: {} });
    let n = 0;
    for (const [id, v] of Object.entries(clubs)) if (JSON.stringify(cur.teams[id]) !== JSON.stringify(v)) (cur.teams[id] = v), n++;
    if (n) writeJson(file, { ...cur, updatedAt: new Date().toISOString() });
    report.teams += n;
  }

  // players' season statistics (API-Sports), by team
  for (const sport of ["football", "nba"]) {
    const bySeason = new Map();
    for (const [k, players] of Object.entries(seasonsApi[sport] ?? {})) {
      const m = k.match(/^(\d+)-(\d{4})$/);
      if (!m || !Array.isArray(players)) continue;
      const list = bySeason.get(m[2]) ?? {};
      list[m[1]] = players;
      bySeason.set(m[2], list);
    }
    for (const [y, teams] of bySeason) {
      const file = path.join(ARCHIVE, "giocatori", `${sport === "football" ? "calcio" : "nba"}-${y}.json`);
      const cur = readJson(file, { season: Number(y), teams: {} });
      let n = 0;
      for (const [id, players] of Object.entries(teams))
        if (JSON.stringify(cur.teams[id]) !== JSON.stringify(players)) (cur.teams[id] = players), n++;
      if (n) writeJson(file, { ...cur, updatedAt: new Date().toISOString() });
      report.players += n;
    }
  }

  // logos: the site's own copy
  const stats = { failed: 0 };
  if (football) writeJson(path.join(root, "src", "data", "football.json"), await localLogos(football, stats));
  writeJson(path.join(root, "data", "football-teams.json"), await localLogos(fTeams, stats));
  writeJson(idFile, await localLogos(readJson(idFile, {}), stats));
  fs.mkdirSync(PUBLIC_LOGOS, { recursive: true });
  let logos = 0;
  if (fs.existsSync(LOGOS))
    for (const f of fs.readdirSync(LOGOS)) {
      fs.copyFileSync(path.join(LOGOS, f), path.join(PUBLIC_LOGOS, f));
      logos++;
    }

  console.log(
    `Archivio: ${report.matches} partite di calcio e ${report.games} NBA aggiunte o aggiornate, ${report.results} risultati, ` +
      `${report.teams} rose, ${report.players} statistiche giocatori; ${logos} loghi${stats.failed ? ` (${stats.failed} non scaricati: resta il link originale)` : ""}.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.warn("Archivio non aggiornato:", err.message);
  });
}
