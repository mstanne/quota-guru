// Builds the data of the team pages (runs at every build, no network):
//   src/data/teams/index.json             every team with its URL slug (routes, links from standings and matches)
//   src/data/teams/football-<comp>.json   clubs of one domestic league: details, squad, season by season
//   src/data/teams/nba.json               NBA teams: roster, season by season
// Sources: src/data/football.json and basket.json (current season), data/football-history.json and
// basket-history.json (past results), data/football-teams.json (club details and squads, API-Football),
// data/team-seasons-api.json (players' season statistics, API-Sports; filled in over time).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { teamGoalStats } from "../src/lib/goalStats.mjs";
import { seasonResults } from "./lib/season-results.mjs";
import { matchPlayer } from "./derive-player-links.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};
const OUT = path.join(root, "src", "data", "teams");

const football = read("src/data/football.json", { competitions: [] });
const fHistory = read("data/football-history.json", { results: [] });
const fTeams = read("data/football-teams.json", { teams: {}, competitions: {} });
const api = read("data/team-seasons-api.json", { footballInfo: {}, football: {}, nba: {} });
// corners, cards and expected goals of the current season by team (scripts/archive-data.mjs)
const matchStats = read("data/statistiche-partite.json", { competitions: {} }).competitions ?? {};
const basket = read("src/data/basket.json", { nba: { season: 0, games: [] } });
const bHistory = read("data/basket-history.json", { games: [] });

import { country, slugify } from "./lib/italian.mjs";
import { NATIONAL } from "./lib/leagues.mjs";
import { isCalendarSeason, isNationalCup } from "./lib/leagues.mjs";

const COLOURS = {
  red: "rosso", black: "nero", white: "bianco", blue: "blu", "navy blue": "blu scuro", "sky blue": "celeste",
  "light blue": "celeste", yellow: "giallo", green: "verde", orange: "arancione", purple: "viola", violet: "viola",
  claret: "granata", maroon: "granata", gold: "oro", silver: "argento", grey: "grigio", gray: "grigio", brown: "marrone",
  pink: "rosa", amber: "ambra", royal: "blu reale",
};
const colours = (s) =>
  s
    ? s
        .split("/")
        .map((c) => COLOURS[c.trim().toLowerCase()] ?? c.trim())
        .join(" / ")
    : s;

const romeDay = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date(iso));

// ---------- football ----------
/** Season start year of a result: European seasons start in July, the Brasileirão follows the calendar year. */
const seasonOf = (date, code) => {
  const y = Number(date.slice(0, 4));
  return isCalendarSeason(code) ? y : Number(date.slice(5, 7)) >= 7 ? y : y - 1;
};
const seasonLabel = (y, code) => (isCalendarSeason(code) ? String(y) : `${y}/${String(y + 1).slice(2)}`);

/** League table and home/away records from a list of results of one competition-season. */
function table(results) {
  const rows = new Map();
  const row = (id) => {
    if (!rows.has(id)) {
      rows.set(id, {
        id, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, points: 0,
        home: { played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0 },
        away: { played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0 },
      });
    }
    return rows.get(id);
  };
  const add = (r, side, gf, ga) => {
    for (const t of [r, r[side]]) {
      t.played++;
      t.gf += gf;
      t.ga += ga;
      if (gf > ga) t.won++;
      else if (gf === ga) t.draw++;
      else t.lost++;
    }
    r.points += gf > ga ? 3 : gf === ga ? 1 : 0;
  };
  for (const m of results) {
    if (m.hg == null || m.ag == null) continue;
    add(row(m.home), "home", m.hg, m.ag);
    add(row(m.away), "away", m.ag, m.hg);
  }
  const sorted = [...rows.values()].sort(
    (a, b) => b.points - a.points || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf,
  );
  sorted.forEach((r, i) => (r.position = i + 1));
  const played = results.filter((m) => m.hg != null && m.ag != null).length;
  return { rows: new Map(sorted.map((r) => [r.id, r])), size: sorted.length, played };
}

/** Under/Over and Goal counts of one team (total, home, away, last 5); null without matches. */
function goalsOf(results, id, complete = true) {
  const g = teamGoalStats(results ?? [], id);
  return g.all.n ? { ...g, complete } : null;
}

const index = { football: [], nba: [] };
const usedSlugs = new Set();
const uniqueSlug = (base, extra) => {
  let s = base || "squadra";
  if (usedSlugs.has(s)) s = `${base}-${slugify(extra)}`;
  usedSlugs.add(s);
  return s;
};

// past seasons by competition code, from the history used by the prediction model
const histBy = new Map(); // "SA-2025" → results
for (const r of fHistory.results ?? []) {
  const k = `${r.comp}-${seasonOf(r.date, r.comp)}`;
  if (!histBy.has(k)) histBy.set(k, []);
  histBy.get(k).push(r);
}

fs.mkdirSync(OUT, { recursive: true });
for (const comp of football.competitions) {
  if (["CL", "EL", "ECL"].includes(comp.code) || isNationalCup(comp.code)) continue; // team pages follow the domestic leagues
  if (comp.national) continue; // national teams: one page each, below
  const current = Number(comp.season?.startDate?.slice(0, 4)) || null;
  const standing = comp.standings?.[0]?.table ?? [];
  const ids = fTeams.competitions?.[comp.slug]?.length ? fTeams.competitions[comp.slug] : standing.map((r) => r.team.id);
  if (!ids.length) continue;
  const seasonsAvailable = [...histBy.keys()]
    .filter((k) => k.startsWith(`${comp.code}-`))
    .map((k) => Number(k.split("-")[1]))
    .filter((y) => y !== current)
    .sort((a, b) => b - a);
  const tables = new Map(seasonsAvailable.map((y) => [y, table(histBy.get(`${comp.code}-${y}`))]));
  // Under/Over and Goal statistics of the current league season (src/lib/goalStats.mjs)
  const { results: currentResults, complete: currentComplete } = seasonResults(comp, fHistory);
  const out = {};
  for (const id of ids) {
    const info = fTeams.teams?.[id];
    const st = standing.find((r) => r.team.id === id);
    const base = info ?? st?.team;
    if (!base) continue;
    const slug = uniqueSlug(slugify(base.shortName || base.name), base.tla || String(id));
    const afInfo = api.footballInfo?.[id] ?? {};
    const players = (y) => api.football?.[`${id}-${y}`]?.map((p) => ({ ...p, nationality: country(p.nationality) })) ?? null;

    const seasons = [];
    if (current) {
      const matches = comp.matches.filter(
        (m) => ["FINISHED", "AWARDED"].includes(m.status) && (m.homeTeam.id === id || m.awayTeam.id === id),
      );
      seasons.push({
        season: current,
        label: seasonLabel(current, comp.code),
        competition: comp.name,
        current: true,
        goals: goalsOf(currentResults, id, currentComplete),
        record: st
          ? {
              position: st.position, size: standing.length, played: st.playedGames, won: st.won, draw: st.draw,
              lost: st.lost, gf: st.goalsFor, ga: st.goalsAgainst, points: st.points,
            }
          : null,
        recent: matches
          .slice(-5)
          .reverse()
          .map((m) => ({
            date: m.utcDate,
            home: m.homeTeam.id === id,
            opponent: (m.homeTeam.id === id ? m.awayTeam : m.homeTeam).shortName,
            gf: m.homeTeam.id === id ? m.score.fullTime.home : m.score.fullTime.away,
            ga: m.homeTeam.id === id ? m.score.fullTime.away : m.score.fullTime.home,
            path: `/calcio/${comp.slug}/${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`,
          })),
        players: players(current),
      });
    }
    for (const y of seasonsAvailable) {
      const t = tables.get(y);
      const r = t.rows.get(id);
      if (!r && !players(y)) continue; // not in this league that season (e.g. promoted later)
      seasons.push({
        season: y,
        label: seasonLabel(y, comp.code),
        competition: comp.name,
        current: false,
        // the history may miss a few results (e.g. a source not updated): the table is then approximate
        partial: t.played < t.size * (t.size - 1) ? { played: t.played, expected: t.size * (t.size - 1) } : null,
        goals: r ? goalsOf(histBy.get(`${comp.code}-${y}`), id) : null,
        record: r
          ? {
              position: r.position, size: t.size, played: r.played, won: r.won, draw: r.draw, lost: r.lost,
              gf: r.gf, ga: r.ga, points: r.points, home: r.home, away: r.away,
            }
          : null,
        recent: [],
        players: players(y),
      });
    }

    out[id] = {
      id,
      slug,
      name: base.name,
      shortName: base.shortName || base.name,
      tla: base.tla || "",
      crest: base.crest ?? null,
      competition: { slug: comp.slug, name: comp.name },
      area: info?.area ?? comp.area ?? null,
      founded: info?.founded ?? afInfo.founded ?? null,
      colors: colours(info?.colors ?? null),
      address: info?.address ?? null,
      website: info?.website ?? null,
      venue: afInfo.venue ?? (info?.venue ? { name: info.venue, city: null, capacity: null, surface: null } : null),
      coach: info?.coach ? { ...info.coach, nationality: country(info.coach.nationality) } : null,
      // squads saved before the ids were kept: the id from the club's season statistics, when the name fits one player
      // birth date and nationality are not in the squad download (/players/squads): taken from the club's season
      // statistics, which have them for every player who has played
      squad: (info?.squad ?? []).map((p) => {
        const stats = api.football?.[`${id}-${current}`] ?? [];
        const pid = p.id ?? matchPlayer(p.name, stats);
        const s = pid != null ? stats.find((x) => x.id === pid) : null;
        return { ...p, id: pid, born: p.born ?? s?.birth ?? null, nationality: country(p.nationality ?? s?.nationality ?? null) };
      }),
      // season statistics in the league (API-Football /teams/statistics) and corners, cards, xG from the archive
      stats: info?.stats?.competition === comp.slug ? info.stats : null,
      matchStats: matchStats[comp.slug]?.teams?.[id] ? { ...matchStats[comp.slug].teams[id], lines: matchStats[comp.slug].lines } : null,
      seasons,
    };
    index.football.push({ id, slug, name: base.name, shortName: base.shortName || base.name, crest: base.crest ?? null, competition: comp.slug });
  }
  fs.writeFileSync(path.join(OUT, `football-${comp.slug}.json`), JSON.stringify(out) + "\n");
}

// ---------- national teams ----------
// One page per national team that played in the last two years (data/football-history.json): next matches with the
// model's prediction, last results, record year by year and by competition, call-ups and coach (API-Football,
// scripts/fetch-football.mjs). Written to football-nazionali.json, listed in the index with competition "nazionali".
{
  const NAT = new Map(NATIONAL.map((c) => [c.code, c]));
  const predictions = read("src/data/football-predictions.json", { predictions: {} }).predictions ?? {};
  const idMap = read("data/id-map.json", { footballTeams: {} }).footballTeams ?? {};
  const known = new Map(); // site id → { name, shortName, tla, crest }
  for (const [apiId, t] of Object.entries(idMap))
    if (t.national) known.set(t.id, { ...t, crest: `https://media.api-sports.io/football/teams/${apiId}.png` });
  for (const c of football.competitions.filter((c) => c.national))
    for (const m of c.matches) for (const t of [m.homeTeam, m.awayTeam]) known.set(t.id, { ...known.get(t.id), ...t });
  const nameOf = (id) => known.get(id)?.shortName ?? known.get(id)?.name ?? null;

  const since = new Date(Date.now() - 2 * 365 * 86400e3).toISOString();
  const results = (fHistory.results ?? []).filter((r) => NAT.has(r.comp));
  // finished matches of the snapshot not yet in the history (the history is written by the full download only)
  const seen = new Set(results.map((r) => r.id));
  for (const c of football.competitions.filter((c) => c.national))
    for (const m of c.matches)
      if (["FINISHED", "AWARDED"].includes(m.status) && m.score.fullTime.home != null && !seen.has(m.id))
        results.push({ id: m.id, date: m.utcDate, comp: c.code, home: m.homeTeam.id, away: m.awayTeam.id, hg: m.score.fullTime.home, ag: m.score.fullTime.away });
  results.sort((a, b) => a.date.localeCompare(b.date));

  // confederation: where the team plays its continental games
  const confCount = new Map();
  for (const r of results) {
    const cf = NAT.get(r.comp)?.confed;
    if (!cf) continue;
    for (const id of [r.home, r.away]) {
      const m = confCount.get(id) ?? {};
      m[cf] = (m[cf] ?? 0) + 1;
      confCount.set(id, m);
    }
  }
  const confOf = (id) => Object.entries(confCount.get(id) ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  // match pages of the snapshot (dated URL), for links from the results
  const pathOf = new Map();
  for (const c of football.competitions.filter((c) => c.national))
    for (const m of c.matches)
      pathOf.set(m.id, `/calcio/${c.slug}/${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`);

  const teamIds = new Set();
  for (const r of results) if (r.date >= since) teamIds.add(r.home), teamIds.add(r.away);
  for (const c of football.competitions.filter((c) => c.national))
    for (const m of c.matches) teamIds.add(m.homeTeam.id), teamIds.add(m.awayTeam.id);

  const out = {};
  for (const id of teamIds) {
    const base = known.get(id);
    if (!base?.name) continue;
    const info = fTeams.teams?.[id];
    const mine = results.filter((r) => r.home === id || r.away === id);
    const rec = () => ({ played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0 });
    const add = (t, gf, ga) => {
      t.played++;
      t.gf += gf;
      t.ga += ga;
      if (gf > ga) t.won++;
      else if (gf === ga) t.draw++;
      else t.lost++;
    };
    const years = new Map();
    for (const r of mine) {
      const y = Number(r.date.slice(0, 4));
      const home = r.home === id;
      const [gf, ga] = home ? [r.hg, r.ag] : [r.ag, r.hg];
      const yr = years.get(y) ?? { year: y, total: rec(), byComp: new Map() };
      add(yr.total, gf, ga);
      const comp = NAT.get(r.comp)?.name ?? r.comp;
      if (!yr.byComp.has(comp)) yr.byComp.set(comp, rec());
      add(yr.byComp.get(comp), gf, ga);
      years.set(y, yr);
    }
    const upcoming = [];
    for (const c of football.competitions.filter((c) => c.national))
      for (const m of c.matches) {
        if (!["SCHEDULED", "TIMED"].includes(m.status) || (m.homeTeam.id !== id && m.awayTeam.id !== id)) continue;
        const p = predictions[m.id];
        upcoming.push({
          date: m.utcDate,
          competition: c.name,
          home: m.homeTeam.id === id,
          opponent: (m.homeTeam.id === id ? m.awayTeam : m.homeTeam).shortName,
          opponentId: (m.homeTeam.id === id ? m.awayTeam : m.homeTeam).id,
          path: `/pronostici/${c.slug}/${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}`,
          p: p ? (m.homeTeam.id === id ? p.p : [p.p[2], p.p[1], p.p[0]]) : null,
        });
      }
    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    const slug = uniqueSlug(slugify(base.shortName || base.name), base.tla || String(id));
    out[id] = {
      id,
      slug,
      name: base.name,
      shortName: base.shortName || base.name,
      tla: base.tla || "",
      crest: base.crest ?? null,
      national: true,
      confed: confOf(id),
      coach: info?.coach ? { ...info.coach, nationality: country(info.coach.nationality) } : null,
      squad: (info?.squad ?? []).map((p) => ({ ...p, nationality: country(p.nationality ?? null) })),
      squadUpdatedAt: info?.updatedAt ?? null,
      upcoming: upcoming.slice(0, 6),
      recent: mine
        .slice(-10)
        .reverse()
        .map((r) => ({
          date: r.date,
          competition: NAT.get(r.comp)?.name ?? r.comp,
          home: r.home === id,
          opponent: nameOf(r.home === id ? r.away : r.home) ?? "",
          opponentId: r.home === id ? r.away : r.home,
          gf: r.home === id ? r.hg : r.ag,
          ga: r.home === id ? r.ag : r.hg,
          path: pathOf.get(r.id) ?? null,
        })),
      years: [...years.values()]
        .sort((a, b) => b.year - a.year)
        .map((y) => ({ year: y.year, total: y.total, byComp: [...y.byComp.entries()].map(([competition, r]) => ({ competition, ...r })) })),
      // Under/Over and Goal over the last two years, every competition
      goals: goalsOf(mine.filter((r) => r.date >= since), id),
    };
    index.football.push({ id, slug, name: base.name, shortName: base.shortName || base.name, crest: base.crest ?? null, competition: "nazionali", national: true, confed: out[id].confed });
  }
  fs.writeFileSync(path.join(OUT, "football-nazionali.json"), JSON.stringify(out) + "\n");
  console.log(`Pagine nazionale: ${Object.keys(out).length}`);
}

// ---------- NBA ----------
const nbaTeams = new Map();
for (const g of basket.nba.games) for (const t of [g.home, g.away]) nbaTeams.set(t.id, t);
const nbaSeason = basket.nba.season;
const games = new Map();
for (const g of bHistory.games ?? []) games.set(g.id, g);
for (const g of basket.nba.games) {
  if (g.status === "final" && g.score.home != null) {
    games.set(g.id, { id: g.id, date: g.utcDate, season: nbaSeason, home: g.home.id, away: g.away.id, hp: g.score.home, ap: g.score.away, post: g.postseason });
  }
}
const nbaSeasons = [...new Set([...games.values()].map((g) => g.season))].sort((a, b) => b - a);
function nbaRecords(season) {
  const rows = new Map();
  const row = (id) =>
    rows.get(id) ?? rows.set(id, { id, played: 0, won: 0, lost: 0, pf: 0, pa: 0, home: { won: 0, lost: 0 }, away: { won: 0, lost: 0 } }).get(id);
  for (const g of games.values()) {
    if (g.season !== season || g.post) continue;
    for (const [id, pf, pa, side] of [[g.home, g.hp, g.ap, "home"], [g.away, g.ap, g.hp, "away"]]) {
      const r = row(id);
      r.played++;
      r.pf += pf;
      r.pa += pa;
      if (pf > pa) {
        r.won++;
        r[side].won++;
      } else {
        r.lost++;
        r[side].lost++;
      }
    }
  }
  const sorted = [...rows.values()].sort((a, b) => b.won / (b.played || 1) - a.won / (a.played || 1) || b.pf - b.pa - (a.pf - a.pa));
  sorted.forEach((r, i) => (r.position = i + 1));
  return { rows: new Map(sorted.map((r) => [r.id, r])), size: sorted.length };
}
const nbaTables = new Map(nbaSeasons.map((y) => [y, nbaRecords(y)]));
const nbaOut = {};
for (const t of [...nbaTeams.values()].sort((a, b) => a.name.localeCompare(b.name))) {
  const slug = uniqueSlug(slugify(t.shortName || t.name), t.abbr);
  const seasons = nbaSeasons.map((y) => {
    const tb = nbaTables.get(y);
    const r = tb.rows.get(t.id);
    return {
      season: y,
      label: `${y}-${String(y + 1).slice(2)}`,
      current: y === nbaSeason,
      record: r ? { position: r.position, size: tb.size, played: r.played, won: r.won, lost: r.lost, pf: r.pf, pa: r.pa, home: r.home, away: r.away } : null,
      // averages only: the per-game rows are for the player pages (scripts/derive-players.mjs)
      players: api.nba?.[`${t.id}-${y}`]?.map(({ games, first, last, oreb, dreb, pf, ...p }) => p) ?? null,
    };
  }).filter((s) => s.record || s.players);
  nbaOut[t.id] = {
    id: t.id,
    slug,
    name: t.name,
    shortName: t.shortName || t.name,
    city: t.city ?? null,
    abbr: t.abbr ?? "",
    roster: (api.nba?.[`${t.id}-roster`] ?? []).map(({ first, last, nbaStart, pro, ...p }) => ({ ...p, country: country(p.country) })),
    seasons,
  };
  index.nba.push({ id: t.id, slug, name: t.name, shortName: t.shortName || t.name });
}
fs.writeFileSync(path.join(OUT, "nba.json"), JSON.stringify(nbaOut) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index) + "\n");
console.log(`Pagine squadra: ${index.football.length} di calcio, ${index.nba.length} NBA`);
