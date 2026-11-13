// Builds the data of the player pages (runs at every build, no network):
//   src/data/players/ids.json          ids of the players with a page (links from team pages and leaderboards)
//   src/data/players/part-<n>.json     the players, split in 32 parts by id (a page loads only its part)
//   src/data/players/slugs.json        id → URL name of every page, for links where only the id is known (match
//                                      line-ups, events, best player: src/lib/playerLinks.ts)
// Source: data/team-seasons-api.json (season statistics of every club of the domestic leagues, API-Football, with the
// player's id, full name, birth date and height), src/data/teams/index.json (club pages), src/data/football.json
// (current seasons and leaderboards), data/giocatori-partite.json (last matches and home/away figures of the current
// season, from the archive: scripts/archive-data.mjs) and the results ledger (.cache/seo/results.json, written just
// before by scripts/derive-results.mjs: links to the match pages), data/giocatori-extra.json (transfers, trophies,
// injury history and who is out for the next match: scripts/fetch-player-extras.mjs) and data/id-map.json
// (API-Football club ids → the site's clubs, for links to the team pages). A page exists for every player with an id who
// plays this season for a club that has a page; the career table lists every season of the player found in the data,
// for any of those clubs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { absenceIt, country, leagueIt, placeIt, positionIt, transferTypeIt } from "./lib/italian.mjs";
import { playerName, playerPart, playerUrl } from "../src/lib/playerNames.mjs";
import { isCalendarSeason } from "./lib/leagues.mjs";
import { scorerModel } from "./lib/scorers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "players");
const read = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};
const api = read("data/team-seasons-api.json", { football: {} });
const teams = read("src/data/teams/index.json", { football: [] }).football;
const football = read("src/data/football.json", { competitions: [] });
const playerMatches = read("data/giocatori-partite.json", { fields: [], players: {} });
const extra = read("data/giocatori-extra.json", { players: {}, unavailable: {} });
const idMap = read("data/id-map.json", { footballTeams: {} });
const buildTime = Date.now();
const ledger = read(path.join(process.env.SEO_CACHE_DIR ?? path.join(".cache", "seo"), "results.json"), { football: {} });

const predictions = read("src/data/football-predictions.json", { predictions: {} }).predictions ?? {};

const teamById = new Map(teams.map((t) => [t.id, t]));

// Next match of the player's club with a prediction: his chances in it (scripts/lib/scorers.mjs propsFor): goal,
// booking, and where they apply clean sheet, penalty scored (usual taker) and penalty saved (goalkeeper). The
// goal chance is the same as in the "probabili marcatori" of the match page. Data no other site publishes.
const nextMatch = new Map();
{
  const props = scorerModel(root, buildTime)?.propsFor;
  const upcoming = football.competitions
    .flatMap((c) => c.matches.map((m) => ({ c, m })))
    .filter(({ m }) => ["SCHEDULED", "TIMED"].includes(m.status) && Date.parse(m.utcDate) > buildTime)
    .sort((a, b) => a.m.utcDate.localeCompare(b.m.utcDate));
  const done = new Set();
  const team = (t) => ({ id: t.id, shortName: t.shortName });
  for (const { c, m } of props ? upcoming : []) {
    const pr = predictions[m.id];
    if (!pr?.lam || !pr.goals) continue;
    for (const side of ["h", "a"]) {
      const club = side === "h" ? m.homeTeam : m.awayTeam;
      if (done.has(club.id)) continue;
      done.add(club.id);
      const i = side === "h" ? 0 : 1;
      const list = props(club.id, {
        xg: pr.lam[i],
        cards: pr.cards?.[i] ?? null,
        concedeNone: (side === "h" ? pr.goals.a : pr.goals.h)[0],
      });
      for (const [pid, x] of list ?? [])
        nextMatch.set(pid, { competition: { slug: c.slug, name: c.name }, date: m.utcDate, home: team(m.homeTeam), away: team(m.awayTeam), side, ...x });
    }
  }
}
const compBySlug = new Map(football.competitions.map((c) => [c.slug, c]));
const currentOf = (slug) => Number(compBySlug.get(slug)?.season?.startDate?.slice(0, 4)) || null;
const label = (y, code) => (isCalendarSeason(code) ? String(y) : `${y}/${String(y + 1).slice(2)}`);
const fields = playerMatches.fields ?? [];
const lineOf = (row) => Object.fromEntries(fields.map((k, i) => [k, row[i] ?? null]));

/** Last matches of the current season, with links to the match and opponent pages when they exist. */
function lastMatches(entry) {
  return (entry?.last ?? []).map((x) => {
    const { id, ...line } = lineOf(x.l);
    const opp = teamById.get(x.o.id);
    return {
      id: x.m,
      date: x.d,
      competition: compBySlug.get(x.c)?.name ?? null,
      home: x.h,
      opponent: { id: x.o.id, name: opp?.shortName ?? x.o.name, slug: opp?.slug ?? null },
      score: x.s,
      path: ledger.football?.[x.m]?.path ?? null,
      ...line,
      starter: line.starter === 1,
    };
  });
}

/** A club of the API-Football numbering, linked to its team page when the site has one. */
function club(t) {
  if (!t) return null;
  const site = teamById.get(idMap.footballTeams?.[t.id]?.id);
  return { name: site?.shortName ?? t.name, slug: site?.slug ?? null };
}
const DAY = 86400e3;
/** Out or doubtful for the next match (only if that match is still to come, within two weeks). */
function availability(id) {
  const a = extra.unavailable?.[id];
  if (!a?.date) return null;
  const t = Date.parse(a.date);
  if (t < buildTime - 3 * 3600e3 || t > buildTime + 14 * DAY) return null;
  return { doubtful: /questionable|doubt/i.test(a.type ?? ""), reason: absenceIt(a.reason) ?? null, date: a.date };
}
/** Transfers (newest first), trophies by competition, injury and suspension history (newest first). */
function history(id) {
  const x = extra.players?.[id];
  if (!x) return null;
  const transfers = (x.transfers ?? []).slice(0, 15).map((t) => ({ date: t.date, type: transferTypeIt(t.type), from: club(t.from), to: club(t.to) }));
  const byLeague = new Map();
  for (const t of x.trophies ?? []) {
    const k = `${t.league}|${t.country ?? ""}`;
    const e = byLeague.get(k) ?? { competition: t.league, country: country(t.country) ?? null, won: [], other: [] };
    if (/^winner$/i.test(t.place ?? "")) e.won.push(t.season);
    else e.other.push({ season: t.season, place: placeIt(t.place) });
    byLeague.set(k, e);
  }
  const trophies = [...byLeague.values()]
    .map((e) => ({ ...e, won: [...new Set(e.won)].sort().reverse() }))
    .sort((a, b) => b.won.length - a.won.length || b.other.length - a.other.length);
  const sidelined = (x.sidelined ?? []).slice(0, 12).map((s) => {
    const days = s.end ? Math.round((Date.parse(s.end) - Date.parse(s.start)) / DAY) + 1 : null;
    // no end date: still out only if it started recently (old entries without an end are just incomplete)
    const ongoing = !s.end && buildTime - Date.parse(s.start) < 120 * DAY;
    return { type: absenceIt(s.type), start: s.start, end: s.end ?? null, days: days != null && days > 0 ? days : null, ongoing };
  });
  return {
    transfers,
    trophies,
    sidelined,
    complete: { transfers: !!x.fetched?.transfers, trophies: !!x.fetched?.trophies, sidelined: !!x.fetched?.sidelined },
  };
}

/** Home and away figures of the current season (matches with a player row). */
function homeAway(entry) {
  const side = (t) =>
    t && { apps: t.n, min: t.min, goals: t.goals, assists: t.assists, rating: t.rn ? Math.round((t.rs / t.rn) * 100) / 100 : null };
  const out = { home: side(entry?.split?.home), away: side(entry?.split?.away) };
  return out.home || out.away ? out : null;
}

// every season row of every player, by player id
const rows = new Map();
for (const [key, list] of Object.entries(api.football ?? {})) {
  const m = key.match(/^(\d+)-(\d{4})$/);
  if (!m || !Array.isArray(list)) continue;
  const team = teamById.get(Number(m[1]));
  if (!team) continue;
  const y = Number(m[2]);
  for (const p of list) {
    if (p?.id == null) continue;
    const r = rows.get(p.id) ?? [];
    r.push({ p, team, y });
    rows.set(p.id, r);
  }
}

// leaderboards of the domestic leagues: rank of the player among scorers and assist makers
const ranks = new Map();
for (const c of football.competitions)
  for (const [kind, list] of [["scorers", c.leaders?.scorers], ["assists", c.leaders?.assists]])
    (list ?? []).forEach((r, i) => {
      if (r.id == null) return;
      const e = ranks.get(r.id) ?? {};
      e[kind] ??= { rank: i + 1, competition: c.name, slug: c.slug, value: kind === "scorers" ? r.goals : r.assists };
      ranks.set(r.id, e);
    });

// Search engines: pages of players with few minutes are mostly empty tables. They stay on the site (links from teams
// and matches) but are kept out of the index and the sitemap ("noindex") when the player has fewer than
// MIN_MINUTES minutes this season (MIN_MINUTES_ITALY for clubs of Serie A and Serie B), counted only once the league
// has played ROUNDS_BEFORE_THRESHOLD rounds (before that everybody is below the threshold). Checked again at every
// build (every few hours, so after every round): a player who passes the threshold is indexed again and announced to
// IndexNow (scripts/prerender.mjs).
// November 2026 (Search Console): with 450 minutes everywhere ~3,000 player pages were in the sitemap, most of them
// never shown by Google; the threshold went up to 900 minutes outside Italy (see also scripts/lib/search-index.mjs).
const MIN_MINUTES = 900;
const MIN_MINUTES_ITALY = 450;
const ITALIAN_LEAGUES = new Set(["serie-a", "serie-b"]);
const ROUNDS_BEFORE_THRESHOLD = 10;
/** Rounds played in a league: the highest round with a finished match (postponed matches do not hold it back). */
const roundsPlayed = new Map(
  football.competitions.map((c) => [
    c.slug,
    Math.max(
      0,
      ...c.matches
        .filter((m) => ["FINISHED", "AWARDED"].includes(m.status) && Number.isFinite(m.matchday))
        .filter((m) => !m.stage || m.stage === "REGULAR_SEASON")
        .map((m) => m.matchday),
    ),
  ]),
);
let belowThreshold = 0;

const parts = Array.from({ length: 32 }, () => ({}));
const ids = [];
for (const [id, list] of rows) {
  // the club of the current season (the most recent row of a club whose league is in its current season)
  const now = list
    .filter(({ team, y }) => y === currentOf(team.competition))
    .sort((a, b) => b.p.min - a.p.min)[0];
  if (!now) continue;
  const p = now.p;
  const seasons = list
    .sort((a, b) => b.y - a.y || b.p.min - a.p.min)
    .map(({ p: s, team, y }) => {
      const comp = compBySlug.get(team.competition);
      return {
        season: y,
        label: label(y, comp?.code),
        team: { id: team.id, slug: team.slug, shortName: team.shortName, crest: team.crest ?? null },
        competition: comp?.name ?? null,
        apps: s.apps, starts: s.starts, min: s.min, goals: s.goals, assists: s.assists,
        yellow: s.yellow, red: s.red, rating: s.rating,
        comps: (s.comps ?? []).map((n) => leagueIt(n, null, { brazil: team.competition === "brasileirao" })),
      };
    });
  const comp = compBySlug.get(now.team.competition);
  const pm = playerMatches.players?.[id];
  // minutes of this season, with every club of the season (a player moved in the window counts both)
  const seasonMin = list.filter(({ team, y }) => y === currentOf(team.competition)).reduce((n, r) => n + (r.p.min ?? 0), 0);
  const rounds = comp ? (roundsPlayed.get(comp.slug) ?? 0) : 0;
  const minMinutes = comp && ITALIAN_LEAGUES.has(comp.slug) ? MIN_MINUTES_ITALY : MIN_MINUTES;
  const index = !comp || rounds < ROUNDS_BEFORE_THRESHOLD || seasonMin >= minMinutes;
  if (!index) belowThreshold++;
  const player = {
    id,
    url: playerUrl({ ...p, id }),
    ...(index ? {} : { index: false }),
    name: playerName(p),
    fullName: [p.first, p.last].filter(Boolean).join(" ") || p.name,
    birth: p.birth ?? null,
    age: p.age ?? null,
    nationality: country(p.nationality) ?? null,
    height: p.height ?? null,
    weight: p.weight ?? null,
    number: p.number ?? null,
    position: positionIt(p.pos),
    team: { id: now.team.id, slug: now.team.slug, name: now.team.name, shortName: now.team.shortName, crest: now.team.crest ?? null },
    competition: comp ? { slug: comp.slug, name: comp.name, season: label(now.y, comp.code) } : null,
    ranks: ranks.get(id) ?? null,
    nextMatch: nextMatch.get(id) ?? null,
    availability: availability(id),
    history: history(id),
    // the current season in detail (v3 season data: detailed statistics and split by competition)
    current: {
      label: label(now.y, comp?.code),
      team: { id: now.team.id, slug: now.team.slug, shortName: now.team.shortName },
      totals: {
        apps: p.apps, starts: p.starts, min: p.min, goals: p.goals, assists: p.assists,
        yellow: p.yellow, red: p.red, rating: p.rating,
      },
      detail: p.detail ?? null,
      byComp:
        p.byComp?.map((c) => ({
          ...c,
          league: leagueIt(c.league, c.leagueId, { brazil: now.team.competition === "brasileirao" }),
        })) ?? null,
      homeAway: homeAway(pm),
      last: lastMatches(pm),
    },
    seasons,
  };
  parts[playerPart(id)][id] = player;
  ids.push(id);
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/^part-\d+\.json$/.test(f)) fs.rmSync(path.join(OUT, f));
parts.forEach((part, i) => fs.writeFileSync(path.join(OUT, `part-${i}.json`), JSON.stringify(part) + "\n"));
fs.writeFileSync(path.join(OUT, "ids.json"), JSON.stringify(ids.sort((a, b) => a - b)) + "\n");
const slugs = {};
for (const part of parts) for (const [id, p] of Object.entries(part)) slugs[id] = p.url.slice(p.url.lastIndexOf("/") + 1, -(`-${id}`.length));
fs.writeFileSync(path.join(OUT, "slugs.json"), JSON.stringify(slugs) + "\n");
console.log(
  `Pagine giocatore: ${ids.length} (fuori dall'indice: ${belowThreshold}, meno di ${MIN_MINUTES} minuti, ${MIN_MINUTES_ITALY} in Serie A e B, dopo ${ROUNDS_BEFORE_THRESHOLD} giornate)`,
);
