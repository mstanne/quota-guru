// Builds the data of the player pages (runs at every build, no network):
//   src/data/players/ids.json          ids of the players with a page (links from team pages and leaderboards)
//   src/data/players/part-<n>.json     the players, split in 32 parts by id (a page loads only its part)
// Source: data/team-seasons-api.json (season statistics of every club of the domestic leagues, API-Football, with the
// player's id, full name, birth date and height), src/data/teams/index.json (club pages), src/data/football.json
// (current seasons and leaderboards), data/giocatori-partite.json (last matches and home/away figures of the current
// season, from the archive: scripts/archive-data.mjs) and the results ledger (.cache/seo/results.json, written just
// before by scripts/derive-results.mjs: links to the match pages). A page exists for every player with an id who
// plays this season for a club that has a page; the career table lists every season of the player found in the data,
// for any of those clubs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { country, positionIt } from "./lib/italian.mjs";
import { playerName, playerPart, playerUrl } from "../src/lib/playerNames.mjs";

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
const ledger = read(path.join(process.env.SEO_CACHE_DIR ?? path.join(".cache", "seo"), "results.json"), { football: {} });

const teamById = new Map(teams.map((t) => [t.id, t]));
const compBySlug = new Map(football.competitions.map((c) => [c.slug, c]));
const currentOf = (slug) => Number(compBySlug.get(slug)?.season?.startDate?.slice(0, 4)) || null;
const label = (y, code) => (code === "BSA" ? String(y) : `${y}/${String(y + 1).slice(2)}`);
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
        yellow: s.yellow, red: s.red, rating: s.rating, comps: s.comps ?? [],
      };
    });
  const comp = compBySlug.get(now.team.competition);
  const pm = playerMatches.players?.[id];
  const player = {
    id,
    url: playerUrl({ ...p, id }),
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
    // the current season in detail (v3 season data: detailed statistics and split by competition)
    current: {
      label: label(now.y, comp?.code),
      team: { id: now.team.id, slug: now.team.slug, shortName: now.team.shortName },
      totals: {
        apps: p.apps, starts: p.starts, min: p.min, goals: p.goals, assists: p.assists,
        yellow: p.yellow, red: p.red, rating: p.rating,
      },
      detail: p.detail ?? null,
      byComp: p.byComp ?? null,
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
console.log(`Pagine giocatore: ${ids.length}`);
