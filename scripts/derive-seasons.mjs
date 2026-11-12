// Season pages: final standings, results and roll of honour of the past seasons of every competition, built from the
// permanent archive (data/archivio/, see scripts/archive-data.mjs and scripts/backfill-archive.mjs).
//
// Reads  data/archivio/calcio/<competition>/<season>/<YYYY-MM>.json     finished matches
//        data/archivio/classifiche/calcio/<competition>/<season>.json   official final standings (leagues)
//        data/archivio/recupero.json                                  which past seasons are complete
//        src/data/results/football-<competition>.json                 match pages that exist (links)
// Writes src/data/seasons/<competition>/<season>.json                 one file per season page (loaded on demand)
//        src/data/seasons/index.json                                  competitions, seasons, winners (routes, links)
//        data/stagioni/                                               copy of the above, kept with the data
//
// The archive is in the full data runs only. Without it (quick live-score runs, local builds) the pages are rebuilt
// from data/stagioni/ (part of the data snapshot of the last full run) or, failing that, the committed files stay.
//
// Only complete past seasons get a page: the current one is on the competition's own pages. Standings: the official
// final table (API-Football) when the archive has it, otherwise computed from the results (and the page says so).
// Usage:  node scripts/derive-seasons.mjs   (in `npm run build`, after derive-results.mjs; never fails the build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPETITIONS } from "./lib/leagues.mjs";
import { isCalendarSeason, isNationalCup } from "./lib/leagues.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE = path.join(root, "data", "archivio");
const OUT = path.join(root, "src", "data", "seasons");
const KEEP = path.join(root, "data", "stagioni");

// competitions kept in the archive only (scripts/backfill-archive.mjs), shown after the site's ones. Coppa Italia was
// one of them until it became a competition of the site (November 2026, scripts/lib/leagues.mjs)
const EXTRA = [];
// tie-breaks of the computed tables (only when the official table is missing): head-to-head first in these leagues
const H2H = new Set(["SA", "SB", "PD", "PPL"]);

const read = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data) + "\n");
};
const copyDir = (from, to) => {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
};

/** "2024-25" (season starting in 2024), "2024" for calendar-year leagues (Brasileirão). */
export const seasonKey = (year, calendar) =>
  calendar ? String(year) : `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
const seasonLabel = (year, calendar) =>
  calendar ? String(year) : `${year}/${String((year + 1) % 100).padStart(2, "0")}`;

// ---------- rounds ----------
const STAGES = {
  QUALIFICATION: ["Turni preliminari", 10],
  QUALIFYING_PLAYOFFS: ["Spareggi per la fase finale", 15],
  EARLY_ROUNDS: ["Turni eliminatori", 20],
  ROUND_1: ["Primo turno", 20],
  ROUND_2: ["Secondo turno", 21],
  ROUND_3: ["Terzo turno", 22],
  ROUND_4: ["Quarto turno", 23],
  GROUP_STAGE: ["Fase a gironi", 30],
  LEAGUE_STAGE: ["Fase campionato", 30],
  PLAYOFFS: ["Playoff", 40],
  // national cups: the rounds before the round of 32
  LAST_512: ["Primo turno", 41],
  LAST_256: ["Turno eliminatorio", 42],
  LAST_128: ["Sessantaquattresimi di finale", 43],
  LAST_64: ["Trentaduesimi di finale", 44],
  LAST_32: ["Sedicesimi di finale", 45],
  LAST_16: ["Ottavi di finale", 50],
  QUARTER_FINALS: ["Quarti di finale", 60],
  SEMI_FINALS: ["Semifinali", 70],
  THIRD_PLACE: ["Finale per il terzo posto", 75],
  FINAL: ["Finale", 80],
  // national teams: group rounds (Nations League, qualifiers) and friendlies
  REGULAR_SEASON: ["Fase a gironi", 30],
  FRIENDLY: ["Amichevoli", 90],
};

const EUROPEAN = new Set(["CL", "EL", "ECL"]);

/**
 * Stage of a match. Seasons archived before groups and national-cup rounds were recognised (fetch-football.mjs
 * roundOf) have them as PLAYOFFS. In the European cups the month tells them apart: August = play-offs for the
 * group/league stage, September–December = group stage, February = knock-out play-offs. In a national cup the
 * early rounds are labelled together.
 */
function stageOf(m, code) {
  if (m.stage === "PLAYOFFS" && m.matchday == null) {
    const month = Number(m.utcDate.slice(5, 7));
    if (EUROPEAN.has(code)) {
      if (month >= 7 && month <= 8) return "QUALIFYING_PLAYOFFS";
      if (month >= 9) return "GROUP_STAGE";
    } else if (isNationalCup(code)) return "EARLY_ROUNDS";
  }
  return m.stage ?? "REGULAR_SEASON";
}

function roundsOf(matches, code, cup, linkOf, national = false) {
  const groups = new Map();
  for (const m of matches) {
    const stage = stageOf(m, code);
    // national teams: the group rounds read "Fase a gironi · 3ª giornata", like the cups
    if (national && stage === "REGULAR_SEASON" && m.matchday) {
      const key = `GROUP-${m.matchday}`;
      if (!groups.has(key)) groups.set(key, { round: `Fase a gironi · ${m.matchday}ª giornata`, sort: 3000 + m.matchday, matches: [] });
      groups.get(key).matches.push(compactMatch(m, linkOf));
      continue;
    }
    const isDay = stage === "REGULAR_SEASON" || ((stage === "GROUP_STAGE" || stage === "LEAGUE_STAGE") && m.matchday);
    const key = isDay ? `${stage}-${m.matchday}` : stage;
    // leagues: after the regular season come play-offs, play-outs and tie-breakers
    const [name, order] =
      !cup && stage !== "REGULAR_SEASON"
        ? [stage === "PLAYOFFS" ? "Playoff e playout" : "Spareggi", stage === "PLAYOFFS" ? 85 : 86]
        : (STAGES[stage] ?? ["Altre partite", 90]);
    const label =
      stage === "REGULAR_SEASON" ? `${m.matchday}ª giornata` : isDay ? `${name} · ${m.matchday}ª giornata` : name;
    const sort = stage === "REGULAR_SEASON" ? m.matchday : order * 100 + (m.matchday ?? 0);
    if (!groups.has(key)) groups.set(key, { round: label, sort, matches: [] });
    groups.get(key).matches.push(compactMatch(m, linkOf));
  }
  return [...groups.values()]
    .sort((a, b) => a.sort - b.sort)
    .map(({ round, matches }) => ({ round, matches: matches.sort((a, b) => a.date.localeCompare(b.date)) }));
}

function compactMatch(m, linkOf) {
  const out = {
    id: m.id,
    date: m.utcDate,
    home: { id: m.home.id, name: m.home.shortName || m.home.name },
    away: { id: m.away.id, name: m.away.shortName || m.away.name },
    score: [m.score.fullTime.home, m.score.fullTime.away],
  };
  if (m.score.duration === "EXTRA_TIME" || m.score.duration === "PENALTY_SHOOTOUT") out.aet = true;
  if (m.score.penalties?.home != null) out.pen = [m.score.penalties.home, m.score.penalties.away];
  const p = linkOf(m.id);
  if (p) out.path = p;
  return out;
}

// ---------- standings ----------
const ZONES = [
  [/champions league/i, "Champions League"],
  [/europa league/i, "Europa League"],
  [/conference league/i, "Conference League"],
  [/relegation.*(play|round)|play.?out/i, "Playout"],
  [/relegation/i, "Retrocessione"],
  [/promotion.*(play|round)|play.?off/i, "Playoff"],
  [/promotion/i, "Promozione"],
  [/libertadores/i, "Libertadores"],
  [/sudamericana/i, "Sudamericana"],
];
const zoneIt = (d) => (d ? (ZONES.find(([re]) => re.test(d))?.[1] ?? null) : null);

function officialTable(file, crestOf) {
  const t = read(file, null)?.groups?.[0]?.table;
  if (!t?.length) return null;
  return t.map((r) => {
    const ded = r.points - (3 * r.won + r.draw);
    const row = {
      pos: r.position,
      team: { id: r.team.id, name: r.team.shortName || r.team.name },
      played: r.playedGames,
      won: r.won,
      draw: r.draw,
      lost: r.lost,
      gf: r.goalsFor,
      ga: r.goalsAgainst,
      gd: r.goalDifference,
      pts: r.points,
    };
    const crest = crestOf(r.apiId);
    if (crest) row.crest = crest;
    const zone = zoneIt(r.description);
    if (zone) row.zone = zone;
    if (ded < 0) row.ded = ded;
    return row;
  });
}

/** Table from the results (3-1-0), tie-breaks: head-to-head where the league uses it, then goal difference. */
function computedTable(matches, h2h) {
  const rows = new Map();
  const row = (t) => {
    if (!rows.has(t.id))
      rows.set(t.id, {
        team: { id: t.id, name: t.shortName || t.name },
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        pts: 0,
      });
    return rows.get(t.id);
  };
  const add = (r, f, a) => {
    r.played++;
    r.gf += f;
    r.ga += a;
    if (f > a) (r.won++, (r.pts += 3));
    else if (f === a) (r.draw++, r.pts++);
    else r.lost++;
  };
  for (const m of matches) {
    const h = m.score.fullTime.home,
      a = m.score.fullTime.away;
    if (h == null || a == null) continue;
    add(row(m.home), h, a);
    add(row(m.away), a, h);
  }
  const list = [...rows.values()].map((r) => ({ ...r, gd: r.gf - r.ga }));
  const mini = new Map();
  if (h2h) {
    const byPts = new Map();
    for (const r of list) byPts.set(r.pts, [...(byPts.get(r.pts) ?? []), r.team.id]);
    for (const ids of byPts.values()) {
      if (ids.length < 2) continue;
      const set = new Set(ids);
      const sub = computedTable(
        matches.filter((m) => set.has(m.home.id) && set.has(m.away.id)),
        false,
      );
      for (const r of sub) mini.set(r.team.id, r);
    }
  }
  list.sort(
    (a, b) =>
      b.pts - a.pts ||
      (mini.get(b.team.id)?.pts ?? 0) - (mini.get(a.team.id)?.pts ?? 0) ||
      (mini.get(b.team.id)?.gd ?? 0) - (mini.get(a.team.id)?.gd ?? 0) ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.team.name.localeCompare(b.team.name),
  );
  return list.map((r, i) => ({ pos: i + 1, ...r }));
}

function winnerOfFinal(m) {
  if (!m) return null;
  const w = m.score.winner;
  if (w === "HOME_TEAM") return [m.home, m.away];
  if (w === "AWAY_TEAM") return [m.away, m.home];
  return null;
}

/** Every group table of an edition (national teams), from the official standings in the archive; null without. */
function groupTables(file, crestOf) {
  const groups = read(file, null)?.groups ?? [];
  const out = groups
    .filter((g) => g.table?.length)
    .map((g, i) => ({
      name: g.group ?? (groups.length > 1 ? `Girone ${i + 1}` : "Classifica"),
      rows: g.table.map((r) => {
        const row = {
          pos: r.position,
          team: { id: r.team.id, name: r.team.shortName || r.team.name },
          played: r.playedGames, won: r.won, draw: r.draw, lost: r.lost,
          gf: r.goalsFor, ga: r.goalsAgainst, gd: r.goalDifference, pts: r.points,
        };
        const crest = crestOf(r.apiId);
        if (crest) row.crest = crest;
        return row;
      }),
    }));
  return out.length ? out : null;
}

/** "2024" or "2024/25" from the dates of an edition (national teams). */
const spanLabel = (start, end) => {
  const a = Number(start?.slice(0, 4));
  const b = Number(end?.slice(0, 4)) || a;
  return !a || a === b ? String(a || b) : `${a}/${String(b % 100).padStart(2, "0")}`;
};

/**
 * Past editions of the national-team competitions (archived by scripts/backfill-archive.mjs, which records the
 * dates of each edition). A tournament is named by its year ("Europei 2024"), the others by their dates
 * ("Nations League 2024/25"). Friendlies have no editions.
 */
function nationalEditions(c, calcio, progress, linkOf, crestOf) {
  const dir = path.join(calcio, c.slug);
  if (c.code === "FRI" || !fs.existsSync(dir)) return [];
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  const used = new Set();
  const years = fs.readdirSync(dir).filter((y) => /^\d{4}$/.test(y)).map(Number).sort((a, b) => b - a);
  for (const y of years) {
    const p = progress.football?.[`${c.code}-${y}`];
    // only editions the backfill has completed and that are over
    if (!p?.complete || !p.end || p.end >= today) continue;
    const matches = [];
    for (const f of fs.readdirSync(path.join(dir, String(y))).filter((f) => f.endsWith(".json")))
      for (const m of Object.values(read(path.join(dir, String(y), f), { matches: {} }).matches))
        if ((m.status === "FINISHED" || m.status === "AWARDED") && m.score?.fullTime?.home != null) matches.push(m);
    if (!matches.length) continue;
    matches.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    let label = c.tournament ? String(y) : spanLabel(p.start, p.end);
    if (used.has(label)) label = `${label} (${y})`;
    used.add(label);
    const key = label.replace(/\//g, "-").replace(/[^0-9a-z-]+/gi, "-").replace(/-+$/, "");
    const fin = matches.find((m) => m.stage === "FINAL");
    const w = winnerOfFinal(fin);
    let champion = null,
      runnerUp = null,
      final = null;
    if (w) {
      champion = { id: w[0].id, name: w[0].shortName || w[0].name };
      runnerUp = { id: w[1].id, name: w[1].shortName || w[1].name };
      const s = fin.score;
      final = `${fin.home.shortName || fin.home.name} – ${fin.away.shortName || fin.away.name} ${s.fullTime.home}-${s.fullTime.away}${s.penalties?.home != null ? ` (${s.penalties.home}-${s.penalties.away} ai rigori)` : s.duration === "EXTRA_TIME" ? " dts" : ""}`;
    }
    const groups = groupTables(path.join(ARCHIVE, "classifiche", "calcio", c.slug, `${y}.json`), crestOf);
    const notes = [];
    if (!fin && c.tournament) notes.push("La finale non è nell'archivio.");
    write(path.join(OUT, c.slug, `${key}.json`), {
      slug: c.slug,
      name: c.name,
      type: "national",
      season: y,
      key,
      label,
      champion,
      runnerUp,
      final,
      notes,
      standings: null,
      groups,
      rounds: roundsOf(matches, c.code, true, linkOf, true),
    });
    out.push({ key, label, year: y, matches: matches.length, champion, runnerUp, final });
  }
  return out;
}

// ---------- main ----------
function main() {
  const calcio = path.join(ARCHIVE, "calcio");
  if (!fs.existsSync(calcio)) {
    if (fs.existsSync(path.join(KEEP, "index.json"))) {
      copyDir(KEEP, OUT);
      console.log("Stagioni passate: archivio assente, uso la copia dell'ultimo aggiornamento completo.");
    } else console.log("Stagioni passate: archivio assente, restano i file presenti.");
    return;
  }

  const football = read(path.join(root, "src", "data", "football.json"), { competitions: [] });
  const progress = read(path.join(ARCHIVE, "recupero.json"), { football: {} });
  const logoDirs = [path.join(ARCHIVE, "loghi", "calcio"), path.join(root, "public", "loghi", "calcio")];
  const crestOf = (apiId) =>
    apiId != null && logoDirs.some((d) => fs.existsSync(path.join(d, `${apiId}.png`)))
      ? `/loghi/calcio/${apiId}.png`
      : null;

  const now = new Date();
  const index = { generatedAt: now.toISOString(), competitions: [] };
  fs.rmSync(OUT, { recursive: true, force: true });

  // national teams: their editions below (nationalEditions)
  for (const c of [...COMPETITIONS.filter((c) => !c.national), ...EXTRA]) {
    const dir = path.join(calcio, c.slug);
    if (!fs.existsSync(dir)) continue;
    const cup = c.cup ?? !c.domestic;
    const calendar = isCalendarSeason(c.code);
    const snap = football.competitions.find((x) => x.code === c.code);
    const current =
      Number(snap?.season?.startDate?.slice(0, 4)) ||
      (calendar ? now.getUTCFullYear() : now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1);
    const pages = read(path.join(root, "src", "data", "results", `football-${c.slug}.json`), []);
    const links = new Map();
    for (const s of pages) for (const r of s.rounds ?? []) for (const m of r.matches ?? []) links.set(m.id, m.path);
    const linkOf = (id) => links.get(id) ?? null;

    const seasons = [];
    const years = fs
      .readdirSync(dir)
      .filter((y) => /^\d{4}$/.test(y) && Number(y) < current)
      .map(Number)
      .sort((a, b) => b - a);
    for (const y of years) {
      const p = progress.football?.[`${c.code}-${y}`];
      if (p && !p.complete) continue; // still being recovered: the page comes when the season is complete
      const matches = [];
      for (const f of fs.readdirSync(path.join(dir, String(y))).filter((f) => f.endsWith(".json")))
        for (const m of Object.values(read(path.join(dir, String(y), f), { matches: {} }).matches))
          if ((m.status === "FINISHED" || m.status === "AWARDED") && m.score?.fullTime?.home != null) matches.push(m);
      if (!matches.length) continue;
      matches.sort((a, b) => a.utcDate.localeCompare(b.utcDate));

      const key = seasonKey(y, calendar);
      const label = seasonLabel(y, calendar);
      const notes = [];
      let standings = null;
      let champion = null,
        runnerUp = null,
        final = null;
      if (!cup) {
        const regular = matches.filter((m) => (m.stage ?? "REGULAR_SEASON") === "REGULAR_SEASON");
        standings = officialTable(path.join(ARCHIVE, "classifiche", "calcio", c.slug, `${y}.json`), crestOf);
        if (!standings) {
          standings = computedTable(regular, H2H.has(c.code));
          notes.push("Classifica calcolata dai risultati: non tiene conto di eventuali penalizzazioni o spareggi.");
        }
        for (const r of standings) if (r.ded) notes.push(`${r.team.name}: ${r.ded} punti di penalizzazione.`);
        champion = standings[0]?.team ?? null;
        runnerUp = standings[1]?.team ?? null;
      } else {
        const fin = matches.find((m) => m.stage === "FINAL");
        const w = winnerOfFinal(fin);
        if (w) {
          champion = { id: w[0].id, name: w[0].shortName || w[0].name };
          runnerUp = { id: w[1].id, name: w[1].shortName || w[1].name };
          const s = fin.score;
          final = `${s.fullTime.home}-${s.fullTime.away}${s.penalties?.home != null ? ` (${s.penalties.home}-${s.penalties.away} ai rigori)` : s.duration === "EXTRA_TIME" ? " dts" : ""}`;
          final = `${fin.home.shortName || fin.home.name} – ${fin.away.shortName || fin.away.name} ${final}`;
        } else if (!fin) notes.push("La finale non è nell'archivio.");
      }

      write(path.join(OUT, c.slug, `${key}.json`), {
        slug: c.slug,
        name: c.name,
        type: cup ? "cup" : "league",
        season: y,
        key,
        label,
        champion,
        runnerUp,
        final,
        notes,
        standings,
        rounds: roundsOf(matches, c.code, cup, linkOf),
      });
      seasons.push({ key, label, year: y, matches: matches.length, champion, runnerUp, final });
    }
    if (seasons.length) index.competitions.push({ slug: c.slug, name: c.name, type: cup ? "cup" : "league", seasons });
    console.log(`Stagioni passate ${c.name}: ${seasons.length}`);
  }
  // national teams: past editions, after the clubs
  for (const c of COMPETITIONS.filter((c) => c.national)) {
    const pages = read(path.join(root, "src", "data", "results", `football-${c.slug}.json`), []);
    const links = new Map();
    for (const s of pages) for (const r of s.rounds ?? []) for (const m of r.matches ?? []) links.set(m.id, m.path);
    const seasons = nationalEditions(c, calcio, progress, (id) => links.get(id) ?? null, crestOf);
    if (seasons.length) {
      index.competitions.push({ slug: c.slug, name: c.name, type: "national", seasons });
      console.log(`Edizioni passate ${c.name}: ${seasons.length}`);
    }
  }
  write(path.join(OUT, "index.json"), index);
  copyDir(OUT, KEEP);
}

try {
  main();
} catch (err) {
  console.warn("Stagioni passate non aggiornate:", err.message);
}
