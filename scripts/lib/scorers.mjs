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

  function squad(team) {
    if (cache.has(team)) return cache.get(team);
    const ss = seasons.get(team);
    if (!ss?.length) return cache.set(team, null).get(team);
    const current = api[`${team}-${ss[0]}`] ?? [];
    if (!prevOf.size)
      for (const [key, list] of Object.entries(api))
        for (const p of list) {
          const season = Number(key.split("-")[1]);
          // last season = the one before the most recent of the data
          const prev = prevOf.get(p.id);
          if (season < latest && (!prev || prev.season < season))
            prevOf.set(p.id, { season, goals: p.goals ?? 0, min: p.min ?? 0 });
        }
    // team games this season ≈ all minutes played / (11 × 90)
    const teamMin = current.reduce((s, p) => s + (p.min ?? 0), 0);
    const games = teamMin / 990;
    const list = current
      .filter((p) => p.id && p.pos !== "Goalkeeper" && (p.min ?? 0) > 0 && !out.has(String(p.id)))
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
        return { id: p.id, name: p.name, raw: (rate * minutes) / 90 };
      })
      .filter((p) => p.raw > 0);
    return cache.set(team, list).get(team);
  }

  /** [[playerId, name, probability], …] best first, or null when the club has no player data. */
  return function scorersFor(siteTeamId, teamXg) {
    const list = squad(String(siteTeamId));
    if (!list?.length) return null;
    const total = list.reduce((s, p) => s + p.raw, 0);
    const k = (teamXg * (1 - OWN_GOALS)) / total;
    return list
      .map((p) => [p.id, p.name, Math.round((1 - Math.exp(-p.raw * k)) * 1000) / 1000])
      .sort((a, b) => b[2] - a[2])
      .slice(0, TOP);
  };
}
