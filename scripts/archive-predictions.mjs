// Archive of every published prediction (football and NBA), so the track record counts what the site actually
// showed before each match, not a recalculation.
//
// Runs in `npm run build` right after the prediction scripts. For every match still to start it records the
// prediction being published now; until kick-off a newer version replaces the older one (the first publication
// time is kept), from kick-off on the entry is locked and is never changed again, except to add the final result.
// Entries are never deleted.
//
// Where the archive lives: PREDICTION_ARCHIVE_DIR (default .cache/predictions-archive). On GitHub the workflow
// keeps that folder in the `archivio-pronostici` branch of the repository and commits it after every build: the
// commit history is the public, timestamped proof of when each prediction was published.
//
// Writes:
//   <archive>/calcio/<YYYY-MM>.json, <archive>/nba/<YYYY-MM>.json   { [matchId]: Entry }  (month of kick-off)
//   src/data/track-record.json     summary for the site: totals, last 30 days, last 10
//   src/data/archived-predictions-<sport>.json   archived prediction of the matches in the current data that have
//                                   started (shown on their match pages instead of a recalculation)
//   public/dati/archivio-pronostici-<sport>.json   full archive, downloadable from the site
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TIME_FILE } from "../src/lib/eventTiming.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archiveDir = path.resolve(root, process.env.PREDICTION_ARCHIVE_DIR ?? ".cache/predictions-archive");
const readJson = (f, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (f, data) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data) + "\n");
};

let nowIso;
try {
  nowIso = new Date(fs.readFileSync(path.join(root, BUILD_TIME_FILE), "utf8").trim()).toISOString();
} catch {
  nowIso = new Date().toISOString();
}
const now = Date.parse(nowIso);

// ---------------------------------------------------------------------------------------- slugs (= src/lib)
const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const romeDay = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date(iso));
const footballPath = (c, m) =>
  `/calcio/${c.slug}/${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`;
const nbaPath = (g) =>
  `/basket/nba/${slugify(g.home.shortName || g.home.name)}-${slugify(g.away.shortName || g.away.name)}-${romeDay(g.utcDate)}`;

// ---------------------------------------------------------------------------------------- archive files
function loadArchive(sport) {
  const dir = path.join(archiveDir, sport);
  const all = {};
  if (fs.existsSync(dir))
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".json"))) Object.assign(all, readJson(path.join(dir, f), {}));
  return all;
}
function saveArchive(sport, all) {
  // a rescheduled match can move to another month: rewrite every month file, drop the ones left empty
  const dir = path.join(archiveDir, sport);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".json"))) fs.rmSync(path.join(dir, f));
  const byMonth = {};
  for (const e of Object.values(all)) (byMonth[e.kickoff.slice(0, 7)] ??= {})[e.id] = e;
  for (const [month, entries] of Object.entries(byMonth)) {
    const sorted = Object.fromEntries(
      Object.values(entries)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id - b.id)
        .map((e) => [e.id, e]),
    );
    // one match per line: readable, and every commit diff shows exactly which predictions changed
    const lines = Object.entries(sorted).map(([id, e]) => `${JSON.stringify(id)}:${JSON.stringify(e)}`);
    const file = path.join(archiveDir, sport, `${month}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `{\n${lines.join(",\n")}\n}\n`);
  }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * One match: create / refresh before kick-off, lock after, add the result when known.
 * `m`: { id, kickoff, label, where, path, prediction, pick: { label, prob, index }, result, void }
 */
function update(log, m, stats) {
  let e = log[m.id];
  const open = Date.parse(m.kickoff) > now;
  if (m.prediction && open) {
    if (!e) {
      e = log[m.id] = { id: m.id, firstPublished: nowIso, published: nowIso, versions: 1 };
      stats.added++;
    } else if (!same(e.prediction, m.prediction)) {
      e.published = nowIso;
      e.versions = (e.versions ?? 1) + 1;
      stats.updated++;
    }
    Object.assign(e, {
      kickoff: m.kickoff,
      label: m.label,
      where: m.where,
      path: m.path,
      pick: m.pick,
      prediction: m.prediction,
    });
  }
  if (!e) return;
  // rescheduled before kick-off: the entry follows the new date
  if (Date.parse(e.kickoff) > now && m.kickoff !== e.kickoff) e.kickoff = m.kickoff;
  if (m.void && !e.result) e.void = true;
  if (m.result && !e.result && Date.parse(e.published) < Date.parse(m.kickoff)) {
    e.result = m.result;
    e.hit = m.result.index === e.pick.index;
    e.graded = nowIso;
    delete e.void;
    stats.graded++;
  }
}

// ---------------------------------------------------------------------------------------- football
const football = readJson(path.join(root, "src/data/football.json"), { competitions: [] });
const fPred = readJson(path.join(root, "src/data/football-predictions.json"), { predictions: {} }).predictions;
const fLog = loadArchive("calcio");
const fStats = { added: 0, updated: 0, graded: 0 };
const OUT = ["1", "X", "2"];
for (const c of football.competitions) {
  for (const m of c.matches) {
    const p = fPred[m.id];
    const pred = p && !p.pre ? (({ pre, games, ...rest }) => rest)(p) : null;
    const top = pred ? pred.p.indexOf(Math.max(...pred.p)) : 0;
    const names = [m.homeTeam.shortName, "pareggio", m.awayTeam.shortName];
    const ft = m.score?.fullTime;
    const played = (m.status === "FINISHED" || m.status === "AWARDED") && ft?.home != null && ft?.away != null;
    update(
      fLog,
      {
        id: m.id,
        kickoff: m.utcDate,
        label: `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`,
        where: c.name,
        path: footballPath(c, m),
        prediction: pred,
        pick: pred ? { index: top, label: `${OUT[top]} · ${names[top]}`, prob: pred.p[top] } : null,
        result: played
          ? { home: ft.home, away: ft.away, index: ft.home > ft.away ? 0 : ft.home === ft.away ? 1 : 2 }
          : null,
        void: m.status === "CANCELLED",
      },
      fStats,
    );
  }
}

// ---------------------------------------------------------------------------------------- NBA
const basket = readJson(path.join(root, "src/data/basket.json"), { nba: { games: [] } });
const bPred = readJson(path.join(root, "src/data/basket-predictions.json"), { predictions: {} }).predictions;
const bLog = loadArchive("nba");
const bStats = { added: 0, updated: 0, graded: 0 };
for (const g of basket.nba.games) {
  const p = bPred[g.id];
  const pred = p && !p.pre ? (({ pre, ...rest }) => rest)(p) : null;
  const name = (t) => t.shortName || t.name;
  const played = g.status === "final" && g.score?.home != null && g.score?.away != null;
  update(
    bLog,
    {
      id: g.id,
      kickoff: g.utcDate,
      label: `${name(g.home)} – ${name(g.away)}`,
      where: "NBA",
      path: nbaPath(g),
      prediction: pred,
      pick: pred ? { index: pred.fav, label: `${pred.fav === 0 ? "1" : "2"} · ${name(pred.fav === 0 ? g.home : g.away)}`, prob: pred.p[pred.fav] } : null,
      result: played ? { home: g.score.home, away: g.score.away, index: g.score.home > g.score.away ? 0 : 1 } : null,
      void: g.status === "postponed" && Date.parse(g.utcDate) < now - 7 * 86400000,
    },
    bStats,
  );
}

const readme = path.join(archiveDir, "README.md");
if (!fs.existsSync(readme)) {
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(
    readme,
    `# Archivio dei pronostici di QuotaGuru

Ogni pronostico pubblicato su www.quotaguru.it, salvato a ogni aggiornamento del sito (scripts/archive-predictions.mjs).

- \`calcio/AAAA-MM.json\`, \`nba/AAAA-MM.json\`: una partita per riga, raggruppate per mese di inizio.
- \`firstPublished\`: prima pubblicazione; \`published\`: ultima versione pubblicata prima dell'inizio
  (\`versions\` = quante volte è cambiata). Dall'inizio della partita il pronostico non viene più modificato.
- \`pick\`: esito indicato come più probabile; \`result\` e \`hit\`: risultato finale e se il pronostico era giusto.

La cronologia dei commit di questo branch mostra quando ogni pronostico è stato pubblicato.
`,
  );
}

saveArchive("calcio", fLog);
saveArchive("nba", bLog);

// ---------------------------------------------------------------------------------------- site summary
const inData = {
  calcio: new Set(football.competitions.flatMap((c) => c.matches.map((m) => String(m.id)))),
  nba: new Set(basket.nba.games.map((g) => String(g.id))),
};
/**
 * Calibration: every outcome of every graded prediction (1, X, 2 for football; home and away for NBA) goes into a
 * 10%-wide bin by its predicted probability; per bin, the average predicted probability and how often the outcome
 * actually happened. A calibrated model has the two close.
 */
function calibration(sport, graded) {
  const bins = Array.from({ length: 10 }, (_, i) => ({ lo: i / 10, hi: (i + 1) / 10, n: 0, pred: 0, hit: 0 }));
  for (const e of graded) {
    const probs = e.prediction?.p;
    if (!probs) continue;
    probs.forEach((p, i) => {
      const b = bins[Math.min(9, Math.floor(p * 10))];
      b.n++;
      b.pred += p;
      if (e.result.index === i) b.hit++;
    });
  }
  return bins
    .filter((b) => b.n > 0)
    .map((b) => ({ lo: b.lo, hi: b.hi, n: b.n, pred: Math.round((b.pred / b.n) * 1000) / 1000, obs: Math.round((b.hit / b.n) * 1000) / 1000 }));
}

function summary(sport, log) {
  const graded = Object.values(log)
    .filter((e) => e.result)
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
  const from = new Date(now - 30 * 86400000).toISOString();
  const count = (list) => ({ n: list.length, hits: list.filter((e) => e.hit).length });
  const first = Object.values(log).reduce((min, e) => (!min || e.firstPublished < min ? e.firstPublished : min), null);
  return {
    since: first,
    all: count(graded),
    last30: count(graded.filter((e) => e.kickoff >= from)),
    calibration: calibration(sport, graded),
    recent: graded.slice(0, 10).map((e) => ({
      key: `${sport}-${e.id}`,
      path: e.path,
      label: e.label,
      where: e.where,
      utcDate: e.kickoff,
      pick: e.pick.label,
      prob: e.pick.prob,
      result: `${e.result.home}-${e.result.away}`,
      hit: e.hit,
      published: e.published,
    })),
  };
}
const site = { generatedAt: nowIso, calcio: summary("calcio", fLog), nba: summary("nba", bLog) };
writeJson(path.join(root, "src/data/track-record.json"), site);
// archived prediction of the matches in the current data that have started, for their match pages
for (const [sport, log] of [
  ["calcio", fLog],
  ["nba", bLog],
]) {
  const byId = Object.fromEntries(
    Object.values(log)
      .filter((e) => inData[sport].has(String(e.id)) && Date.parse(e.kickoff) <= now)
      .map((e) => [e.id, { published: e.published, prediction: e.prediction }]),
  );
  writeJson(path.join(root, `src/data/archived-predictions-${sport}.json`), byId);
}

// full archive, downloadable from the site
for (const [sport, log] of [
  ["calcio", fLog],
  ["nba", bLog],
]) {
  const list = Object.values(log).sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  writeJson(path.join(root, "public/dati", `archivio-pronostici-${sport}.json`), { generatedAt: nowIso, entries: list });
}

const line = (s, st, log) =>
  `${s}: ${Object.keys(log).length} pronostici in archivio (+${st.added} nuovi, ${st.updated} aggiornati prima del via, ${st.graded} con il risultato)`;
console.log(`Archivio pronostici (${archiveDir})\n  ${line("calcio", fStats, fLog)}\n  ${line("NBA", bStats, bLog)}`);
