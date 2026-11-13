// The multiples of the day ("multiple del giorno"): every day, from the football matches of that day with a
// prediction, four accumulators built only from the model's probabilities: the most likely double, and three
// accumulators whose fair odds (1 ÷ probability of all the picks) get close to 2, 5 and 10. Informative, like the tris:
// next to each one the chance that all the picks come in, and later how it went. No operator odds, no operator link.
//
// Rules shared by the site (scripts/derive-multiple.mjs → /pronostici/multiple). The first build of each Rome day locks
// the day's multiples in the predictions archive (`archivio-pronostici` branch, multiple.json): never changed after.
//
// `entries` are predictions archive entries (scripts/archive-predictions.mjs):
//   { id, kickoff, label: "Home – Away", where, path, prediction: { p, dc, over, btts, confidence, lam? }, result?, void? }

export const MULTIPLE = {
  doppia: {
    slug: "doppia",
    title: "La doppia del giorno",
    short: "Doppia",
    // two picks, the most likely of the day within the range
    legs: 2,
    range: [0.55, 0.88],
  },
  // target fair odds and the number of picks aimed at: each pick close to target^(−1/n) (quota 2 in 3 picks: ~79%)
  "quota-2": { slug: "quota-2", title: "La multipla a quota 2", short: "Quota 2", target: 2, aim: 3, range: [0.55, 0.88] },
  "quota-5": { slug: "quota-5", title: "La multipla a quota 5", short: "Quota 5", target: 5, aim: 4, range: [0.5, 0.85] },
  "quota-10": { slug: "quota-10", title: "La multipla a quota 10", short: "Quota 10", target: 10, aim: 5, range: [0.45, 0.8] },
};
export const MULTIPLE_IDS = Object.keys(MULTIPLE);
const MAX_LEGS = 8;

// ---------------------------------------------------------------------------------------------- markets
// Final-score tests: the same keys as the site's slip (src/lib/footballMarkets.ts), so a multiple can go in the slip.
const home = (label) => label.split(" – ")[0];
const away = (label) => label.split(" – ")[1];
export const PICK_MARKETS = [
  { key: "1", sign: "1", text: (l) => `vittoria ${home(l)}`, p: (pr) => pr.p[0], test: (h, a) => h > a },
  { key: "X", sign: "X", text: () => "pareggio", p: (pr) => pr.p[1], test: (h, a) => h === a },
  { key: "2", sign: "2", text: (l) => `vittoria ${away(l)}`, p: (pr) => pr.p[2], test: (h, a) => h < a },
  { key: "1X", sign: "1X", text: (l) => `${home(l)} o pareggio`, p: (pr) => pr.dc[0], test: (h, a) => h >= a },
  { key: "12", sign: "12", text: (l) => `vince ${home(l)} o ${away(l)}`, p: (pr) => pr.dc[1], test: (h, a) => h !== a },
  { key: "X2", sign: "X2", text: (l) => `${away(l)} o pareggio`, p: (pr) => pr.dc[2], test: (h, a) => h <= a },
  ...[1.5, 2.5, 3.5].flatMap((line) => {
    const k = String(line * 10).padStart(2, "0");
    const d = String(line).replace(".", ",");
    return [
      { key: `over${k}`, sign: `Over ${d}`, text: () => `più di ${d} gol`, p: (pr) => pr.over[line.toFixed(1)], test: (h, a) => h + a > line },
      { key: `under${k}`, sign: `Under ${d}`, text: () => `meno di ${d} gol`, p: (pr) => 1 - pr.over[line.toFixed(1)], test: (h, a) => h + a < line },
    ];
  }),
  { key: "gg", sign: "Goal", text: () => "segnano entrambe", p: (pr) => pr.btts, test: (h, a) => h > 0 && a > 0 },
  { key: "ng", sign: "No goal", text: () => "almeno una non segna", p: (pr) => 1 - pr.btts, test: (h, a) => h === 0 || a === 0 },
];
const MARKET = new Map(PICK_MARKETS.map((m) => [m.key, m]));

/** Did the pick come true on the final score? */
export const pickTest = (key, h, a) => !!MARKET.get(key)?.test(h, a);

// ---------------------------------------------------------------------------------------------- Rome time
const fmt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" });
export const romeDayOf = (ms) => fmt.format(new Date(ms));
export const lockKey = (id, day) => `${id}/${day}`;

// ---------------------------------------------------------------------------------------------- selection
/** Matches out of the multiples: friendlies (little information on line-ups and motivation). */
const SKIP_WHERE = /amichevol/i;

/** The pick of a match within `range` closest to `ideal` (the most likely one without `ideal`); null if none. */
function bestPick(e, [lo, hi], ideal) {
  let best = null;
  const score = (p) => (ideal ? -Math.abs(p - ideal) : p);
  for (const m of PICK_MARKETS) {
    const p = m.p(e.prediction);
    if (!Number.isFinite(p) || p < lo || p > hi) continue;
    if (!best || score(p) > score(best.p)) best = { m, p };
  }
  return best;
}
const RELIABILITY = { alta: 0, media: 1 };

/**
 * The multiples of the Rome day of `nowMs`: { [id]: lock } (missing ids: not enough matches). Matches of that day
 * still to start, with a prediction of medium or high reliability. A match goes in one multiple only while there
 * are enough matches for all of them.
 */
export function chooseMultiples(entries, { nowMs, currentIds }) {
  const today = romeDayOf(nowMs);
  const open = entries.filter(
    (e) =>
      !e.void &&
      e.prediction?.p &&
      e.prediction.confidence !== "bassa" &&
      !SKIP_WHERE.test(e.where ?? "") &&
      (!currentIds || currentIds.has(e.id)) &&
      Date.parse(e.kickoff) > nowMs &&
      romeDayOf(Date.parse(e.kickoff)) === today,
  );
  const used = new Set();
  const out = {};
  for (const id of MULTIPLE_IDS) {
    const k = MULTIPLE[id];
    const ideal = k.target ? k.target ** (-1 / k.aim) : null;
    const fit = (c) => (ideal ? Math.abs(c.best.p - ideal) : -c.best.p);
    const cands = open
      .map((e) => ({ e, best: bestPick(e, k.range, ideal) }))
      .filter((c) => c.best)
      // matches not used yet first, then high reliability, then the pick closest to the ideal (doppia: most likely)
      .sort(
        (a, b) =>
          used.has(a.e.id) - used.has(b.e.id) ||
          RELIABILITY[a.e.prediction.confidence] - RELIABILITY[b.e.prediction.confidence] ||
          fit(a) - fit(b) ||
          a.e.id - b.e.id,
      );
    const legs = [];
    let all = 1;
    for (const c of cands) {
      if (k.legs ? legs.length >= k.legs : 1 / all >= k.target * 0.92 || legs.length >= MAX_LEGS) break;
      legs.push(c);
      all *= c.best.p;
    }
    if (legs.length < 2 || (k.legs && legs.length < k.legs) || (k.target && 1 / all < k.target * 0.85)) continue;
    for (const c of legs) used.add(c.e.id);
    out[id] = lockOf(id, today, legs, nowMs);
  }
  return out;
}

/** The record kept in multiple.json: enough to show and grade the multiple after the matches leave the data. */
export function lockOf(id, day, legs, nowMs) {
  const picks = legs
    .map(({ e, best: { m, p } }) => ({
      id: e.id,
      kickoff: e.kickoff,
      label: e.label,
      where: e.where,
      path: e.path,
      key: m.key,
      sign: m.sign,
      outcome: m.text(e.label),
      p: Math.round(p * 1000) / 1000,
      // score-matrix parameters: the site can put the multiple in the slip with the same probabilities
      ...(e.prediction.lam ? { lam: e.prediction.lam } : {}),
    }))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id - b.id);
  const all = picks.reduce((x, p) => x * p.p, 1);
  return { id, day, locked: new Date(nowMs).toISOString(), picks, all: Math.round(all * 10000) / 10000 };
}
