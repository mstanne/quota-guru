// Goalscorer probabilities of a club match ("segna almeno un gol nei 90 minuti"), from the team's expected goals of
// the prediction and the players' season figures (API-Football).
//
//   rate      goals per 90 minutes of the player this season, shrunk towards the usual rate of his position (and
//             helped by last season's figures, at half weight): few minutes say little
//   minutes   expected minutes in the next match: his share of the team's minutes this season, mixed with his last
//             appearances; less if he has not played for a while, none if he is out for the next match
//   λ         rate × minutes / 90, then scaled so the players of the team add up to the team's expected goals
//             (minus ~3% own goals): the model's goal estimate stays the reference
//   P         1 − e^(−λ): at least one goal
//
// The same squad figures give the other per-player chances of the player pages (propsFor, used by
// scripts/derive-players.mjs): booking, clean sheet of the goalkeeper, penalty scored by the usual taker and penalty
// saved by the goalkeeper. Same recipe: a rate per 90 minutes (or per team game) shrunk towards the usual value
// (priors from the 2025 seasons of the data), times the expected minutes, then P = 1 − e^(−λ).
//
// Sources: data/team-seasons-api.json (season statistics per club, key "<site club id>-<season>"),
// data/giocatori-partite.json (last appearances), data/giocatori-extra.json (`unavailable`: out for the next match).
import fs from "node:fs";
import path from "node:path";

const DAY = 86400000;
/** Goals per 90 minutes of a typical player of each position (prior of the shrinkage). */
const POSITION_RATE = { Attacker: 0.36, Forward: 0.36, Midfielder: 0.11, Defender: 0.04, Goalkeeper: 0 };
/** Weight of the prior, in minutes. */
const PRIOR_MINUTES = 450;
const OWN_GOALS = 0.03;
/** Players shown per team. */
const TOP = 6;
/** Cards (yellow + red) per 90 minutes of a typical player of each position, and the weight of that prior. */
const CARD_RATE = { Attacker: 0.16, Forward: 0.16, Midfielder: 0.21, Defender: 0.21, Goalkeeper: 0.066 };
/** Penalties a team is awarded / concedes per game, share scored, share saved by the goalkeeper; prior weights. */
const PEN_FOR = 0.147;
const PEN_AGAINST = 0.106;
const PEN_CONVERSION = 0.78;
const PEN_SAVE = 0.155;
const PRIOR_GAMES = 10;
const PRIOR_PENS = 4;

const read = (root, rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};

/** Loads the sources once; returns `scorersFor(siteTeamId, teamExpectedGoals)` or null without data. */
export function scorerModel(root, nowMs = Date.now()) {
  const api = read(root, "data/team-seasons-api.json", null)?.football;
  if (!api) return null;
  const pm = read(root, "data/giocatori-partite.json", { fields: [], players: {} });
  const minIdx = (pm.fields ?? []).indexOf("min");
  const out = new Set(Object.keys(read(root, "data/giocatori-extra.json", { unavailable: {} }).unavailable ?? {}));

  // seasons per API club, and last season's figures of every player (whatever his club was)
  const seasons = new Map();
  for (const key of Object.keys(api)) {
    const [team, season] = key.split("-");
    seasons.set(team, [...(seasons.get(team) ?? []), Number(season)].sort((a, b) => b - a));
  }
  const latest = Math.max(...[...seasons.values()].map((x) => x[0]));
  const prevOf = new Map();
  const cache = new Map();

  function squad(team_) {
    if (cache.has(team_)) return cache.get(team_);
    const ss = seasons.get(team_);
    if (!ss?.length) return cache.set(team_, null).get(team_);
    const current = api[`${team_}-${ss[0]}`] ?? [];
    if (!prevOf.size)
      for (const [key, list] of Object.entries(api))
        for (const p of list) {
          const season = Number(key.split("-")[1]);
          // last season = the one before the most recent of the data
          const prev = prevOf.get(p.id);
          if (season < latest && (!prev || prev.season < season))
            prevOf.set(p.id, {
              season,
              goals: p.goals ?? 0,
              min: p.min ?? 0,
              cards: (p.yellow ?? 0) + (p.red ?? 0),
              penScored: p.detail?.penScored ?? 0,
              penTaken: (p.detail?.penScored ?? 0) + (p.detail?.penMissed ?? 0),
              penSaved: p.detail?.penSaved ?? 0,
            });
        }
    // team games this season ≈ all minutes played / (11 × 90)
    const teamMin = current.reduce((s, p) => s + (p.min ?? 0), 0);
    const games = teamMin / 990;
    const list = current
      .filter((p) => p.id && (p.min ?? 0) > 0 && !out.has(String(p.id)))
      .map((p) => {
        const prior = POSITION_RATE[p.pos] ?? 0.1;
        const prev = prevOf.get(p.id);
        const goals = (p.goals ?? 0) + 0.5 * (prev?.goals ?? 0);
        const min = (p.min ?? 0) + 0.5 * (prev?.min ?? 0);
        const rate = (goals + (prior * PRIOR_MINUTES) / 90) / ((min + PRIOR_MINUTES) / 90);
        // expected minutes: season share, mixed with the last three appearances
        const seasonAvg = games > 0 ? Math.min(90, (p.min ?? 0) / games) : 0;
        const last = (pm.players?.[p.id]?.last ?? []).slice().sort((a, b) => b.d.localeCompare(a.d));
        const recent = last.slice(0, 3).map((x) => x.l?.[minIdx] ?? 0);
        const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : seasonAvg;
        let minutes = 0.5 * seasonAvg + 0.5 * recentAvg;
        // no appearance for three weeks: probably injured or out of the team
        const lastDay = last[0] ? Date.parse(last[0].d) : 0;
        if (!lastDay || nowMs - lastDay > 21 * DAY) minutes *= 0.3;
        const d = p.detail ?? {};
        const cardRate =
          ((p.yellow ?? 0) + (p.red ?? 0) + 0.5 * (prev?.cards ?? 0) + ((CARD_RATE[p.pos] ?? 0.2) * PRIOR_MINUTES) / 90) /
          ((min + PRIOR_MINUTES) / 90);
        return {
          id: p.id,
          name: p.name,
          pos: p.pos,
          minutes,
          raw: p.pos === "Goalkeeper" ? 0 : (rate * minutes) / 90,
          cardRaw: (cardRate * minutes) / 90,
          penTaken: (d.penScored ?? 0) + (d.penMissed ?? 0) + 0.5 * (prev?.penTaken ?? 0),
          penScored: (d.penScored ?? 0) + 0.5 * (prev?.penScored ?? 0),
          penSaved: (d.penSaved ?? 0) + 0.5 * (prev?.penSaved ?? 0),
          penCommitted: d.penCommitted ?? 0,
          min: p.min ?? 0,
        };
      });
    const taken = current.reduce((n, p) => n + (p.detail?.penScored ?? 0) + (p.detail?.penMissed ?? 0), 0);
    const committed = current.reduce((n, p) => n + (p.detail?.penCommitted ?? 0), 0);
    const team = {
      games,
      penFor: (taken + PEN_FOR * PRIOR_GAMES) / (games + PRIOR_GAMES),
      penAgainst: (committed + PEN_AGAINST * PRIOR_GAMES) / (games + PRIOR_GAMES),
      penTaken: list.reduce((n, p) => n + p.penTaken, 0),
      gkMin: list.filter((p) => p.pos === "Goalkeeper").reduce((n, p) => n + p.min, 0),
      committed,
    };
    return cache.set(team_, { list, team }).get(team_);
  }

  const r3 = (x) => Math.round(x * 1000) / 1000;
  const atLeastOne = (lam) => r3(1 - Math.exp(-lam));

  /** [[playerId, name, probability], …] best first, or null when the club has no player data. */
  function scorersFor(siteTeamId, teamXg) {
    const list = squad(String(siteTeamId))?.list.filter((p) => p.raw > 0);
    if (!list?.length) return null;
    const total = list.reduce((s, p) => s + p.raw, 0);
    const k = (teamXg * (1 - OWN_GOALS)) / total;
    return list
      .map((p) => [p.id, p.name, atLeastOne(p.raw * k)])
      .sort((a, b) => b[2] - a[2])
      .slice(0, TOP);
  }

  /**
   * Chances of every player of a club in one match, by player id: { goal, card, cleanSheet, penScored, penSaved }
   * (each only where it applies). `xg`: the team's expected goals; `cards`: its expected cards (null: the players'
   * own rates); `concedeNone`: chance the opponent does not score. Players expected to play under 15 minutes are left
   * out. Null when the club has no player data.
   */
  function propsFor(siteTeamId, { xg, cards = null, concedeNone }) {
    const sq = squad(String(siteTeamId));
    if (!sq?.list.length) return null;
    const { list, team } = sq;
    const goalTotal = list.reduce((s, p) => s + p.raw, 0);
    const kGoal = goalTotal > 0 ? (xg * (1 - OWN_GOALS)) / goalTotal : 0;
    const cardTotal = list.reduce((s, p) => s + p.cardRaw, 0);
    const kCard = cards && cardTotal > 0 ? cards / cardTotal : 1;
    // the goalkeeper expected to start: most expected minutes
    const keeper = list.filter((p) => p.pos === "Goalkeeper").sort((a, b) => b.minutes - a.minutes)[0];
    const out = new Map();
    for (const p of list) {
      if (p.minutes < 15) continue;
      const plays = Math.min(1, p.minutes / 90);
      const x = { goal: p.raw > 0 ? atLeastOne(p.raw * kGoal) : undefined, card: atLeastOne(p.cardRaw * kCard) };
      // usual penalty taker: his share of the club's penalties, scored at his own (shrunk) rate
      if (team.penTaken > 0 && p.penTaken / team.penTaken >= 0.25) {
        const conv = (p.penScored + PEN_CONVERSION * PRIOR_PENS) / (p.penTaken + PRIOR_PENS);
        x.penScored = atLeastOne(team.penFor * (p.penTaken / team.penTaken) * conv * plays);
      }
      if (keeper && p.id === keeper.id) {
        x.cleanSheet = r3(concedeNone * plays);
        // penalties he faced ≈ those the club conceded while he played
        const faced = team.gkMin > 0 ? team.committed * (p.min / team.gkMin) : 0;
        const save = (p.penSaved + PEN_SAVE * PRIOR_PENS) / (faced + PRIOR_PENS);
        x.penSaved = atLeastOne(team.penAgainst * Math.min(0.5, save) * plays);
      }
      out.set(p.id, x);
    }
    return out;
  }

  scorersFor.propsFor = propsFor;
  return scorersFor;
}
