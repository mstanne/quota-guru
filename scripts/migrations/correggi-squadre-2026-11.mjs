// One-off correction of the club ids paired wrongly on 1 November 2026 (move from football-data.org to API-Football).
//
// What happened. scripts/lib/id-map.mjs pairs every API-Football club with the same club of the previous data, so
// ids, names and URLs stay the same. Its name match was loose across competitions, and the cups are processed before
// the leagues, so five cup clubs took the id and the name of a league club ("Rangers" ~ "Queens Park Rangers FC",
// "Sparta Praha" ~ "Sparta Rotterdam"), and the real clubs got a new id. Four more clubs got a new id because their
// names did not match ("Wolves" / "Wolverhampton Wanderers FC", "Barcelona" with Espanyol as second candidate…).
// Effects: the model saw these 9 clubs with only the matches since November; their history, team pages and match
// URLs were split in two; cup pages showed the 5 cup clubs under the wrong name; 9 matches have two archived
// predictions.
//
// The fix keeps the ids the real clubs have now (all data since November uses them) and gives them back their
// names, hence their URLs, of before November; the 5 cup clubs get their own id and their API-Football name.
//   prima       before scripts/fetch-football.mjs: corrects data/id-map.json
//   dati        after it: football history, permanent archive, clubs, current data; URLs that changed in the
//               meantime go in data/url-spostati.json (bridge pages to the right URL, scripts/prerender.mjs)
//   pronostici  before the build: predictions archive (labels and URLs of these clubs' matches, merges the 9
//               predictions recorded twice, keeping every published version in the count)
// Each phase runs once (marks in data/id-map.json and in the predictions archive) and can be repeated safely.
// Options: --dry-run (report only).
//
// How an old id is read. The id of a real club that a cup club took (e.g. 67, Newcastle) means the cup club in the
// data made from API-Football (match id from 1,000,000,000) of a cup, the real club everywhere else (its league,
// and the cup matches of football-data.org, which have smaller ids). Checked on all the data of 7 November 2026.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { loadIdMap, MATCH_OFFSET, saveIdMap, TEAM_OFFSET, tlaOf } from "../lib/id-map.mjs";
import { slugify } from "../lib/italian.mjs";

const KEY = "squadre-2026-11";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = (...p) => path.join(root, ...p);
const IDMAP = R("data", "id-map.json");
const MOVED = R("data", "url-spostati.json");
const ARCHIVE = R("data", "archivio");
const SEO = R(".cache", "seo");
const PRED = path.resolve(root, process.env.PREDICTION_ARCHIVE_DIR ?? ".cache/predictions-archive");
const DRY = process.argv.includes("--dry-run");
const phase = process.argv[2];

// The 9 clubs: id before November, id now, names of before November (football-data.org).
const CLUBS = [
  { oldId: 67, newId: 10000034, name: "Newcastle United FC", shortName: "Newcastle", tla: "NEW" },
  { oldId: 69, newId: 10000072, name: "Queens Park Rangers FC", shortName: "QPR", tla: "QPR" },
  { oldId: 512, newId: 10000106, name: "Stade Brestois 29", shortName: "Brest", tla: "SB2" },
  { oldId: 6806, newId: 10000426, name: "Sparta Rotterdam", shortName: "Sparta", tla: "SPA" },
  { oldId: 1912, newId: 10000427, name: "Telstar 1963", shortName: "Telstar", tla: "TEL" },
  { oldId: 76, newId: 10000039, name: "Wolverhampton Wanderers FC", shortName: "Wolverhampton", tla: "WOL" },
  { oldId: 81, newId: 10000529, name: "FC Barcelona", shortName: "Barça", tla: "FCB" },
  { oldId: 529, newId: 10000094, name: "Stade Rennais FC 1901", shortName: "Stade Rennais", tla: "REN" },
  { oldId: 1766, newId: 10001062, name: "CA Mineiro", shortName: "Mineiro", tla: "CAM" },
];
const CUPS = new Set(["CL", "EL", "ECL", "champions-league", "europa-league", "conference-league"]);

// ------------------------------------------------------------------------------------------- helpers
const readJson = (f, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return fallback;
  }
};
let written = 0;
const writeJson = (f, v) => {
  written++;
  if (DRY) return;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + ".tmp", JSON.stringify(v) + "\n");
  fs.renameSync(f + ".tmp", f);
};
const romeDay = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date(iso));
const say = (s) => console.log(`correzione squadre (${phase}${DRY ? ", prova" : ""}): ${s}`);
const listFiles = (dir, re) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) out.push(...listFiles(p, re));
    else if (re.test(n)) out.push(p);
  }
  return out;
};
/** Moved URLs: { from: to }, merged with the file (read by scripts/prerender.mjs). */
function saveMoved(moves) {
  const cur = readJson(MOVED, {});
  let n = 0;
  for (const [from, to] of Object.entries(moves)) if (from !== to && cur[from] !== to) ((cur[from] = to), n++);
  // no chains: a → b, b → c becomes a → c
  for (const k of Object.keys(cur)) {
    const seen = new Set([k]);
    while (cur[cur[k]] && !seen.has(cur[k])) (seen.add(cur[k]), (cur[k] = cur[cur[k]]));
  }
  if (n) writeJson(MOVED, Object.fromEntries(Object.entries(cur).sort()));
  return n;
}

// ------------------------------------------------------------------------------------------- phases
const map = loadIdMap(IDMAP);
map.correzioni ??= {};
const rec = map.correzioni[KEY];

if (phase === "prima") prima();
else if (phase === "dati") await dati();
else if (phase === "pronostici") pronostici();
else {
  console.error("Uso: node scripts/migrations/correggi-squadre-2026-11.mjs prima|dati|pronostici [--dry-run]");
  process.exit(1);
}

/** data/id-map.json: real clubs get their names back, the cup clubs that took their ids get their own. */
function prima() {
  if (rec?.prima) return say("già applicata");
  const byId = (id) => Object.entries(map.footballTeams).filter(([, t]) => t.id === id);
  const plan = [];
  for (const c of CLUBS) {
    const real = byId(c.newId);
    if (real.length !== 1) {
      say(
        `id ${c.newId} (${c.shortName}) trovato ${real.length} volte nella mappa: correzione annullata, niente modificato`,
      );
      return;
    }
    const holders = byId(c.oldId);
    if (holders.length > 1) {
      say(`id ${c.oldId} assegnato a ${holders.length} club: correzione annullata, niente modificato`);
      return;
    }
    const [realKey, realTeam] = real[0];
    const imp = holders[0] ? { apiId: Number(holders[0][0]), id: TEAM_OFFSET + Number(holders[0][0]) } : null;
    if (imp && Object.values(map.footballTeams).some((t) => t.id === imp.id)) {
      say(`id ${imp.id} già usato: correzione annullata, niente modificato`);
      return;
    }
    plan.push({
      ...c,
      realApi: Number(realKey),
      wrong: { name: realTeam.name, shortName: realTeam.shortName, tla: realTeam.tla },
      impostor: imp,
    });
  }
  for (const p of plan) {
    map.footballTeams[String(p.realApi)] = { id: p.newId, name: p.name, shortName: p.shortName, tla: p.tla };
    // name from API-Football at the next download (scripts/lib/id-map.mjs fills entries without a name)
    if (p.impostor)
      map.footballTeams[String(p.impostor.apiId)] = { id: p.impostor.id, name: null, shortName: null, tla: "" };
    say(
      `${p.shortName}: id ${p.newId} con il nome di prima (era "${p.wrong.shortName}")` +
        (p.impostor
          ? `; il club API ${p.impostor.apiId} che aveva preso l'id ${p.oldId} ora ha l'id ${p.impostor.id}`
          : ""),
    );
  }
  map.correzioni[KEY] = { prima: new Date().toISOString(), clubs: plan };
  if (!DRY) saveIdMap(IDMAP, map);
}

async function dati() {
  if (!rec?.prima) return say("fase 'prima' non ancora applicata: niente da fare");
  if (rec.dati) return say("già applicata");
  const clubs = rec.clubs;

  // names of the cup clubs: from this run's download, else asked to API-Football
  for (const c of clubs.filter((c) => c.impostor)) {
    const t = map.footballTeams[String(c.impostor.apiId)];
    if (t?.name) continue;
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) continue;
    try {
      const { apiSports } = await import("../lib/api-sports.mjs");
      const res = await apiSports("football", key).get(`/teams?id=${c.impostor.apiId}`);
      const name = res?.[0]?.team?.name;
      if (name) Object.assign(t, { name, shortName: name, tla: tlaOf(name) });
    } catch (e) {
      say(`nome del club API ${c.impostor.apiId} non disponibile: ${e.message}`);
    }
  }
  const missing = clubs.filter((c) => c.impostor && !map.footballTeams[String(c.impostor.apiId)]?.name);
  if (missing.length) {
    say(
      `mancano i nomi dei club API ${missing.map((c) => c.impostor.apiId).join(", ")}: riprovo al prossimo aggiornamento`,
    );
    if (!DRY) saveIdMap(IDMAP, map);
    return;
  }

  // canonical team of every id involved, and the wrong names each was shown with since November
  const canon = new Map();
  const wrongShort = new Map(); // id now → short name shown since 1 November
  for (const c of clubs) {
    canon.set(c.newId, { id: c.newId, name: c.name, shortName: c.shortName, tla: c.tla });
    wrongShort.set(c.newId, c.wrong.shortName);
    if (c.impostor) {
      const t = map.footballTeams[String(c.impostor.apiId)];
      canon.set(c.impostor.id, { id: c.impostor.id, name: t.name, shortName: t.shortName, tla: t.tla });
      wrongShort.set(c.impostor.id, c.shortName);
    }
  }
  const byOld = new Map(clubs.map((c) => [c.oldId, c]));
  /** Id of a club now, read from an old id: see the header. */
  const fixId = (id, matchId, comp) => {
    const c = byOld.get(id);
    if (!c) return id;
    if (!c.impostor) return c.newId;
    const apiMade = Number(matchId) >= MATCH_OFFSET;
    return CUPS.has(comp) && apiMade ? c.impostor.id : c.newId;
  };
  const fixTeam = (t, matchId, comp) => {
    if (!t || typeof t !== "object") return false;
    const id = fixId(t.id, matchId, comp);
    const k = canon.get(id);
    if (!k) return false;
    const before = JSON.stringify(t);
    Object.assign(t, k);
    return JSON.stringify(t) !== before;
  };
  const stats = {};
  const count = (k, n = 1) => (stats[k] = (stats[k] ?? 0) + n);

  // 1. results for the model, and their permanent archive
  const hFile = R("data", "football-history.json");
  const history = readJson(hFile);
  if (history) {
    let n = 0;
    for (const r of history.results ?? []) {
      const h = fixId(r.home, r.id, r.comp);
      const a = fixId(r.away, r.id, r.comp);
      if (h !== r.home || a !== r.away) ((r.home = h), (r.away = a), n++);
    }
    if (n) (writeJson(hFile, history), count("risultati del modello", n));
  }
  for (const f of listFiles(path.join(ARCHIVE, "risultati"), /^calcio-\d{4}\.json$/)) {
    const j = readJson(f);
    let n = 0;
    for (const r of Object.values(j?.results ?? {})) {
      const h = fixId(r.home, r.id, r.comp);
      const a = fixId(r.away, r.id, r.comp);
      if (h !== r.home || a !== r.away) ((r.home = h), (r.away = a), n++);
    }
    if (n) (writeJson(f, j), count("risultati in archivio", n));
  }

  // 2. permanent archive of the matches
  for (const f of listFiles(path.join(ARCHIVE, "calcio"), /^\d{4}-\d{2}\.json$/)) {
    const j = readJson(f);
    if (!j?.matches) continue;
    const comp = j.slug ?? path.basename(path.dirname(path.dirname(f)));
    let n = 0;
    for (const m of Object.values(j.matches)) if (fixTeam(m.home, m.id, comp) | fixTeam(m.away, m.id, comp)) n++;
    if (n) (writeJson(f, j), count("partite in archivio", n));
  }

  // 3. clubs: the entry under the old id is the real club as it was on 1 November (squad and coach of
  //    football-data.org); the club has an up-to-date one under the id it has now, so the old one goes
  const tFile = R("data", "football-teams.json");
  const teams = readJson(tFile);
  if (teams) {
    let n = 0;
    for (const c of clubs) {
      if (teams.teams?.[c.oldId]) (delete teams.teams[c.oldId], n++);
      if (teams.teams?.[c.newId]) (Object.assign(teams.teams[c.newId], canon.get(c.newId)), n++);
    }
    for (const [slug, list] of Object.entries(teams.competitions ?? {})) {
      const fixed = [...new Set(list.map((id) => fixId(id, CUPS.has(slug) ? MATCH_OFFSET : null, slug)))];
      if (JSON.stringify(fixed) !== JSON.stringify(list)) ((teams.competitions[slug] = fixed), n++);
    }
    if (n) (writeJson(tFile, teams), count("schede squadra", n));
  }
  const aFile = path.join(ARCHIVE, "squadre", "anagrafica.json");
  const ana = readJson(aFile);
  if (ana?.calcio) {
    let n = 0;
    for (const c of clubs) {
      const old = ana.calcio[c.oldId];
      if (old) {
        // same as above: the real club; kept under its id now only if it has nothing there yet
        if (!ana.calcio[c.newId]) ana.calcio[c.newId] = { ...old, ...canon.get(c.newId) };
        delete ana.calcio[c.oldId];
        n++;
      }
      if (ana.calcio[c.newId]) (Object.assign(ana.calcio[c.newId], canon.get(c.newId)), n++);
    }
    if (n) (writeJson(aFile, ana), count("anagrafica club", n));
  }
  for (const f of listFiles(path.join(ARCHIVE, "squadre"), /^calcio-\d{4}\.json$/)) {
    const j = readJson(f);
    let n = 0;
    for (const c of clubs) {
      const e = j?.teams?.[c.oldId];
      if (!e) continue;
      const to = c.impostor && CUPS.has(e.competition) ? c.impostor.id : c.newId;
      if (!j.teams[to]) j.teams[to] = e;
      delete j.teams[c.oldId];
      n++;
    }
    if (n) (writeJson(f, j), count("rose per stagione", n));
  }

  // 4. current data (already right after this run's download; this covers the head-to-head kept in cache)
  const fFile = R("src", "data", "football.json");
  const football = readJson(fFile);
  if (football) {
    let n = 0;
    for (const c of football.competitions ?? []) {
      for (const m of c.matches ?? []) n += fixTeam(m.homeTeam, m.id, c.code) | fixTeam(m.awayTeam, m.id, c.code);
      for (const g of c.standings ?? [])
        for (const r of g.table ?? []) n += fixTeam(r.team, CUPS.has(c.code) ? MATCH_OFFSET : null, c.code);
    }
    for (const h of Object.values(football.headToHead ?? {}))
      for (const m of h.matches ?? [])
        n +=
          fixTeam(m.homeTeam, m.id, m.competition?.code ?? "") | fixTeam(m.awayTeam, m.id, m.competition?.code ?? "");
    if (n) (writeJson(fFile, football), count("dati correnti", n));
  }

  // 5. URLs published since November with the wrong names → the right ones
  const moves = movedUrls(football, canon, wrongShort);
  const nm = saveMoved(moves);
  if (nm) count("indirizzi reindirizzati", nm);

  rec.dati = new Date().toISOString();
  rec.stats = stats;
  if (!DRY) saveIdMap(IDMAP, map);
  say(
    Object.keys(stats).length
      ? Object.entries(stats)
          .map(([k, v]) => `${k} ${v}`)
          .join(", ")
      : "niente da correggere",
  );
}

/** Matches of the current season involving the 9 clubs or the 5 cup clubs (current data and archive). */
function affectedMatches(football, canon) {
  const out = new Map();
  const add = (slug, m, home, away) => {
    if (!canon.has(home.id) && !canon.has(away.id)) return;
    out.set(`${slug}|${m.id}`, { slug, id: m.id, utcDate: m.utcDate, home, away });
  };
  for (const c of football?.competitions ?? []) for (const m of c.matches ?? []) add(c.slug, m, m.homeTeam, m.awayTeam);
  for (const f of listFiles(path.join(ARCHIVE, "calcio"), /^2026-\d{2}\.json$/)) {
    const j = readJson(f);
    const slug = j?.slug ?? path.basename(path.dirname(path.dirname(f)));
    for (const m of Object.values(j?.matches ?? {})) if (m.utcDate >= "2026-09-01") add(slug, m, m.home, m.away);
  }
  return [...out.values()];
}

/** Slugs of the evergreen URLs (TEAM_SLUGS in src/lib/footballCore.ts). */
function teamSlugs() {
  const src = fs.readFileSync(R("src", "lib", "footballCore.ts"), "utf8");
  const block = src.match(/export const TEAM_SLUGS[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? "";
  const table = {};
  for (const [, k1, k2, v] of block.matchAll(/^\s*(?:"([^"]+)"|([A-Za-z0-9_]+)):\s*"([^"]+)"/gm)) table[k1 ?? k2] = v;
  return (short) => table[short] ?? slugify(short);
}

/**
 * Every published URL (sitemap state, archived pages) that carries a wrong name, with the URL it has now:
 * dated match pages, evergreen event pages, team pages (and their sub-pages).
 */
function movedUrls(football, canon, wrongShort) {
  const published = new Set(Object.keys(readJson(path.join(SEO, "state.json"), {}).pages ?? {}));
  const archiveDir = path.join(SEO, "archive");
  if (fs.existsSync(archiveDir))
    for (const n of fs.readdirSync(archiveDir).filter((x) => x.endsWith(".json.gz"))) {
      try {
        const p = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(archiveDir, n)))).meta?.path;
        if (p) published.add(p);
      } catch {
        /* unreadable entry: skipped */
      }
    }
  for (const e of predictionEntries()) if (e.path) published.add(e.path);
  const teamSlug = teamSlugs();
  const moves = {};
  const variants = (t) => (wrongShort.has(t.id) ? [t.shortName, wrongShort.get(t.id)] : [t.shortName]);
  for (const m of affectedMatches(football, canon)) {
    const day = romeDay(m.utcDate);
    const right = `/calcio/${m.slug}/${slugify(m.home.shortName)}-${slugify(m.away.shortName)}-${day}`;
    const rightEvent = `/pronostici/${m.slug}/${teamSlug(m.home.shortName)}-${teamSlug(m.away.shortName)}`;
    for (const h of variants(m.home))
      for (const a of variants(m.away)) {
        const dated = `/calcio/${m.slug}/${slugify(h)}-${slugify(a)}-${day}`;
        if (dated !== right && published.has(dated)) moves[dated] = right;
        const event = `/pronostici/${m.slug}/${teamSlug(h)}-${teamSlug(a)}`;
        if (event !== rightEvent && published.has(event)) moves[event] = rightEvent;
      }
  }
  // team pages: /calcio/squadre/<slug> of the names shown since November (only the 9 league clubs have one)
  const leagueClubs = new Set(CLUBS.map((c) => c.newId));
  for (const [id, wrong] of wrongShort) {
    if (!leagueClubs.has(id)) continue;
    const from = `/calcio/squadre/${slugify(wrong)}`;
    const to = `/calcio/squadre/${slugify(canon.get(id).shortName)}`;
    if (from === to) continue;
    for (const p of published) if (p === from || p.startsWith(`${from}/`)) moves[p] = to + p.slice(from.length);
  }
  return moves;
}

function predictionEntries() {
  const dir = path.join(PRED, "calcio");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .flatMap((n) => Object.values(readJson(path.join(dir, n), {})));
}

/** Predictions archive: labels and URLs of the affected matches, and the 9 matches recorded twice. */
function pronostici() {
  const mark = path.join(PRED, "correzioni.json");
  const marks = readJson(mark, {});
  if (marks[KEY]) return say("già applicata");
  if (!rec?.dati) return say("fase 'dati' non ancora applicata: niente da fare");
  const dir = path.join(PRED, "calcio");
  if (!fs.existsSync(dir)) return say("archivio dei pronostici assente: niente da fare");
  const all = {};
  for (const n of fs.readdirSync(dir).filter((x) => x.endsWith(".json")))
    Object.assign(all, readJson(path.join(dir, n), {}));

  const canon = new Map();
  for (const c of rec.clubs) {
    canon.set(c.newId, { id: c.newId, shortName: c.shortName });
    if (c.impostor)
      canon.set(c.impostor.id, {
        id: c.impostor.id,
        shortName: map.footballTeams[String(c.impostor.apiId)]?.shortName,
      });
  }
  const football = readJson(R("src", "data", "football.json"), { competitions: [] });
  const index = new Map(affectedMatches(football, canon).map((m) => [m.id, m]));
  const current = new Set([
    ...football.competitions.flatMap((c) => c.matches.map((m) => m.id)),
    ...Object.values(map.footballMatches ?? {}),
  ]);
  const moves = {};
  let relabeled = 0;
  for (const e of Object.values(all)) {
    const m = index.get(e.id);
    if (!m) continue;
    const label = `${m.home.shortName} – ${m.away.shortName}`;
    const p = `/calcio/${m.slug}/${slugify(m.home.shortName)}-${slugify(m.away.shortName)}-${romeDay(e.kickoff)}`;
    if (e.label === label && e.path === p) continue;
    if (e.path && e.path !== p) moves[e.path] = p;
    // names only: the prediction, the pick and the result stay as published
    if (e.pick?.label)
      e.pick.label = e.pick.label.replace(
        / · .*$/,
        ` · ${[m.home.shortName, "pareggio", m.away.shortName][e.pick.index]}`,
      );
    Object.assign(e, { label, path: p });
    relabeled++;
  }

  // the same match recorded under two ids (before and after the pairing): one entry, every version counted
  const groups = new Map();
  for (const e of Object.values(all)) {
    const k = `${e.where}|${e.label}|${romeDay(e.kickoff)}`;
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  let merged = 0;
  for (const list of groups.values()) {
    if (list.length !== 2) continue;
    const [a, b] = list;
    const keep =
      current.has(a.id) && !current.has(b.id) ? a : current.has(b.id) && !current.has(a.id) ? b : a.id > b.id ? a : b;
    const drop = keep === a ? b : a;
    if (drop.result && !keep.result) continue; // never lose a graded entry
    keep.firstPublished = [keep.firstPublished, drop.firstPublished].sort()[0];
    keep.versions = (keep.versions ?? 1) + (drop.versions ?? 1);
    keep.idPrecedenti = [...new Set([...(keep.idPrecedenti ?? []), drop.id])];
    if (drop.path && drop.path !== keep.path) moves[drop.path] = keep.path;
    delete all[drop.id];
    merged++;
  }

  if (!DRY) {
    for (const n of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) fs.rmSync(path.join(dir, n));
    const byMonth = {};
    for (const e of Object.values(all)) (byMonth[e.kickoff.slice(0, 7)] ??= {})[e.id] = e;
    for (const [mo, entries] of Object.entries(byMonth)) writeJson(path.join(dir, `${mo}.json`), entries);
    marks[KEY] = { at: new Date().toISOString(), relabeled, merged };
    writeJson(mark, marks);
  }
  const nm = saveMoved(moves);
  say(`${relabeled} pronostici con i nomi corretti, ${merged} pronostici doppi uniti, ${nm} indirizzi reindirizzati`);
}
