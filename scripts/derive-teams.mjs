// Builds the data of the team pages (runs at every build, no network):
//   src/data/teams/index.json             every team with its URL slug (routes, links from standings and matches)
//   src/data/teams/football-<comp>.json   clubs of one domestic league: details, squad, season by season
//   src/data/teams/nba.json               NBA teams: roster, season by season
// Sources: src/data/football.json and basket.json (current season), data/football-history.json and
// basket-history.json (past results), data/football-teams.json (club details and squads, football-data.org),
// data/team-seasons-api.json (players' season statistics, API-Sports; filled in over time).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const basket = read("src/data/basket.json", { nba: { season: 0, games: [] } });
const bHistory = read("data/basket-history.json", { games: [] });

const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ---------- Italian names for countries and club colours (the sources are in English) ----------
const COUNTRY = new Map();
{
  const en = new Intl.DisplayNames(["en"], { type: "region" });
  const it = new Intl.DisplayNames(["it"], { type: "region" });
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of A) for (const b of A) {
    const code = a + b;
    try {
      const e = en.of(code);
      if (e && e !== code) COUNTRY.set(e.toLowerCase(), it.of(code));
    } catch {
      /* not a region code */
    }
  }
  for (const [e, i] of Object.entries({
    England: "Inghilterra", Scotland: "Scozia", Wales: "Galles", "Northern Ireland": "Irlanda del Nord",
    USA: "Stati Uniti", "United States": "Stati Uniti", "Korea Republic": "Corea del Sud", "South Korea": "Corea del Sud",
    "Côte d'Ivoire": "Costa d'Avorio", "Ivory Coast": "Costa d'Avorio", "Congo DR": "Repubblica Democratica del Congo",
    "DR Congo": "Repubblica Democratica del Congo", "Czech Republic": "Repubblica Ceca", Türkiye: "Turchia", Turkey: "Turchia",
    "Cape Verde Islands": "Capo Verde", "Bosnia-Herzegovina": "Bosnia ed Erzegovina", Kosovo: "Kosovo",
  })) COUNTRY.set(e.toLowerCase(), i);
}
const country = (s) => (s ? COUNTRY.get(String(s).toLowerCase()) ?? s : s);
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
  return code === "BSA" ? y : Number(date.slice(5, 7)) >= 7 ? y : y - 1;
};
const seasonLabel = (y, code) => (code === "BSA" ? String(y) : `${y}/${String(y + 1).slice(2)}`);

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
  if (comp.code === "CL") continue; // team pages follow the domestic leagues
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
      squad: (info?.squad ?? []).map((p) => ({ ...p, nationality: country(p.nationality) })),
      seasons,
    };
    index.football.push({ id, slug, name: base.name, shortName: base.shortName || base.name, crest: base.crest ?? null, competition: comp.slug });
  }
  fs.writeFileSync(path.join(OUT, `football-${comp.slug}.json`), JSON.stringify(out) + "\n");
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
      players: api.nba?.[`${t.id}-${y}`] ?? null,
    };
  }).filter((s) => s.record || s.players);
  nbaOut[t.id] = {
    id: t.id,
    slug,
    name: t.name,
    shortName: t.shortName || t.name,
    city: t.city ?? null,
    abbr: t.abbr ?? "",
    roster: (api.nba?.[`${t.id}-roster`] ?? []).map((p) => ({ ...p, country: country(p.country) })),
    seasons,
  };
  index.nba.push({ id: t.id, slug, name: t.name, shortName: t.shortName || t.name });
}
fs.writeFileSync(path.join(OUT, "nba.json"), JSON.stringify(nbaOut) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index) + "\n");
console.log(`Pagine squadra: ${index.football.length} di calcio, ${index.nba.length} NBA`);
