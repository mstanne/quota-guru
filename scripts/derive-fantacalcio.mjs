// Fantasy football ("fantacalcio") advice for the next round of Serie A, /fantacalcio and /fantacalcio/chi-schierare
// (runs at every build after scripts/derive-players.mjs, no network).
//
// For every player of the round: start chance (share of starts this season and in his last appearances, or the
// official line-up once it is out, about an hour before kick-off), expected minutes, expected goals and assists, card
// chance; for the goalkeeper expected to start, clean sheet and goals conceded. All from the prediction of the match
// (team expected goals, chance the opponent does not score, expected cards) and the players' season figures, with the
// same recipe as the goalscorer probabilities of the match pages (scripts/lib/scorers.mjs fantaFor).
//
// Expected bonus, classic rules of the game: goal +3, assist +1, booking −0.5; goalkeeper: clean sheet +1, goal
// conceded −1, penalty saved +3. It counts the chance that the player plays little or not at all, so it compares
// players directly ("chi schierare"); the base mark (voto) is not estimated.
//
// Writes:
//   src/data/fantacalcio.json        the round, its matches and every player (pages of the site)
//   <archive>/fantacalcio.json       the same file in the predictions archive (`archivio-pronostici` branch): the
//                                    Telegram rubrics read it (scripts/telegram/rubriche.mjs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TIME_FILE } from "../src/lib/eventTiming.mjs";
import { scorerModel } from "./lib/scorers.mjs";
import { absenceIt } from "./lib/italian.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "fantacalcio.json");
const archiveDir = path.resolve(root, process.env.PREDICTION_ARCHIVE_DIR ?? ".cache/predictions-archive");
const read = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};

let nowMs;
try {
  nowMs = Date.parse(fs.readFileSync(path.join(root, BUILD_TIME_FILE), "utf8").trim());
} catch {
  nowMs = Date.now();
}
if (!Number.isFinite(nowMs)) nowMs = Date.now();

const football = read("src/data/football.json", { competitions: [] });
const predictions = read("src/data/football-predictions.json", { predictions: {} }).predictions ?? {};
const details = read("src/data/football-details.json", {});
const teams = read("src/data/teams/index.json", { football: [] }).football;
const slugs = read("src/data/players/slugs.json", {});
const api = read("data/team-seasons-api.json", { football: {} }).football ?? {};
const unavailable = read("data/giocatori-extra.json", { unavailable: {} }).unavailable ?? {};
const teamById = new Map(teams.map((t) => [t.id, t]));

/** Fantasy roles from the API positions (they can differ from the official list of the game). */
const ROLE = { Goalkeeper: "P", Defender: "D", Midfielder: "C", Attacker: "A", Forward: "A" };
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;

/** Expected bonus with the classic rules (see the top of the file). */
function bonusOf(x) {
  const b = 3 * x.goals + 1 * x.assists - 0.5 * x.card;
  return x.cleanSheet != null ? b + x.cleanSheet - x.conceded + 3 * (x.penSaved ?? 0) : b;
}
/** Start chance in words (official line-ups: certain). */
function band(start, official) {
  if (official) return start ? "titolare" : "panchina";
  if (start >= 0.8) return "quasi certo";
  if (start >= 0.55) return "probabile";
  if (start >= 0.3) return "in dubbio";
  return "riserva";
}
const startersOf = (lineup) => {
  const ids = (lineup?.starters ?? []).map((p) => p.id).filter(Boolean);
  return ids.length >= 10 ? new Set(ids) : null;
};

function build() {
  const sa = football.competitions.find((c) => c.code === "SA");
  const model = scorerModel(root, nowMs);
  if (!sa || !model?.fantaFor) return null;
  // the round: the first one with a match not played yet (the round in progress until its last match starts)
  const regular = sa.matches.filter((m) => m.matchday && (!m.stage || m.stage === "REGULAR_SEASON"));
  const pending = regular.filter((m) => ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"].includes(m.status));
  if (!pending.length) return null;
  const n = Math.min(...pending.map((m) => m.matchday));
  const matches = regular.filter((m) => m.matchday === n).sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  const season = Number(sa.season?.startDate?.slice(0, 4)) || null;

  const players = [];
  const outList = [];
  const matchRows = [];
  for (const m of matches) {
    const pr = predictions[m.id];
    const det = details[m.apiId] ?? details[m.id];
    const lineups = { h: startersOf(det?.lineups?.home), a: startersOf(det?.lineups?.away) };
    const official = !!(lineups.h && lineups.a);
    const row = {
      id: m.id,
      kickoff: m.utcDate,
      status: m.status,
      home: { id: m.homeTeam.id, name: m.homeTeam.shortName },
      away: { id: m.awayTeam.id, name: m.awayTeam.shortName },
      lineups: official,
    };
    if (pr?.lam && pr.goals) {
      row.xg = [r2(pr.lam[0]), r2(pr.lam[1])];
      row.cleanSheet = [r3(pr.goals.a[0]), r3(pr.goals.h[0])];
    }
    matchRows.push(row);
    if (!pr?.lam || !pr.goals || !["SCHEDULED", "TIMED"].includes(m.status)) continue;
    for (const side of ["h", "a"]) {
      const club = side === "h" ? m.homeTeam : m.awayTeam;
      const opp = side === "h" ? m.awayTeam : m.homeTeam;
      const i = side === "h" ? 0 : 1;
      const list = model.fantaFor(club.id, {
        xg: pr.lam[i],
        oppXg: pr.lam[1 - i],
        cards: pr.cards?.[i] ?? null,
        concedeNone: (side === "h" ? pr.goals.a : pr.goals.h)[0],
        lineup: official ? lineups[side] : null,
      });
      for (const x of list ?? []) {
        const role = ROLE[x.pos];
        if (!role) continue;
        // only who may play: expected in the match (or in the official line-up / on the bench)
        if (!official && x.minutes < 10 && x.start < 0.1) continue;
        // goalkeepers: only the one expected to start (the others would rank above him with a bonus of 0)
        if (role === "P" && x.cleanSheet == null) continue;
        const slug = slugs[x.id];
        players.push({
          id: x.id,
          name: x.name,
          ...(slug ? { url: `/calcio/giocatori/${slug}-${x.id}` } : {}),
          role,
          team: { id: club.id, name: club.shortName, slug: teamById.get(club.id)?.slug ?? null },
          opp: { id: opp.id, name: opp.shortName },
          home: side === "h",
          match: m.id,
          start: x.start,
          band: band(x.start, official),
          min: x.minutes,
          goal: r3(1 - Math.exp(-x.goals)),
          assist: r3(1 - Math.exp(-x.assists)),
          card: x.card,
          ...(x.cleanSheet != null ? { cleanSheet: x.cleanSheet, conceded: r2(x.conceded), penSaved: x.penSaved } : {}),
          bonus: r2(bonusOf(x)),
        });
      }
      // who is out (injured or suspended) for this match
      const squad = api[`${club.id}-${season}`] ?? [];
      for (const p of squad) {
        const u = unavailable[String(p.id)];
        if (!u || !ROLE[p.pos]) continue;
        outList.push({ name: p.name, role: ROLE[p.pos], team: club.shortName, reason: absenceIt(u.reason) ?? null });
      }
    }
  }
  if (players.length < 100) return null;
  players.sort((a, b) => b.bonus - a.bonus);
  const open = matches.filter((m) => Date.parse(m.utcDate) > nowMs);
  return {
    generatedAt: new Date(nowMs).toISOString(),
    season,
    matchday: n,
    // line-ups of the game are due before the first match of the round
    deadline: matches[0]?.utcDate ?? null,
    started: open.length < matches.length,
    matches: matchRows,
    players,
    out: outList.sort((a, b) => a.team.localeCompare(b.team) || a.role.localeCompare(b.role)),
  };
}

const doc = build();
const empty = { generatedAt: null, season: null, matchday: null, deadline: null, started: false, matches: [], players: [], out: [] };
const text = JSON.stringify(doc ?? empty) + "\n";
if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== text) fs.writeFileSync(OUT, text);
// the Telegram rubrics read it from the predictions archive (only when the archive is there: site builds)
// (rewritten only when something besides the time changed: no archive commit at every build)
if (doc && fs.existsSync(archiveDir)) {
  const f = path.join(archiveDir, "fantacalcio.json");
  const same = (a) => JSON.stringify({ ...a, generatedAt: null });
  const prev = read(f, null);
  if (!prev || same(prev) !== same(doc)) fs.writeFileSync(f, text);
}
console.log(
  doc
    ? `fantacalcio.json: ${doc.matchday}ª giornata di Serie A, ${doc.players.length} giocatori, ${doc.out.length} indisponibili${
        doc.matches.some((m) => m.lineups) ? `, formazioni ufficiali per ${doc.matches.filter((m) => m.lineups).length} partite` : ""
      }`
    : "fantacalcio.json: nessuna giornata di Serie A con pronostici e dati dei giocatori",
);
