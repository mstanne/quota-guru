// Types and formatting helpers for the football predictions (Poisson / Dixon-Coles model).
// The numbers come from scripts/predict-football.mjs; no data import here, so small components can use it.

export interface Prediction {
  /** Expected goals [home, away]. */
  xg: [number, number];
  /** Exact expected goals and Dixon-Coles ρ of the score matrix [home, away, ρ] (src/lib/footballMarkets.ts rebuilds
   *  the matrix from them). Missing on predictions made before November 2026: the matrix then comes from `xg`. */
  lam?: [number, number, number];
  /** Share of the goals scored in the first half (first-half markets). Missing on older predictions. */
  half?: number;
  /** Expected corners and cards [home, away, dispersion = variance ÷ mean] (club matches with enough statistics). */
  corners?: [number, number, number];
  cards?: [number, number, number];
  /** Most likely goalscorers of each club [player id, name, probability of at least one goal in 90 minutes]. */
  scorers?: { h: [number, string, number][]; a: [number, string, number][] };
  /** Probabilities of 1, X, 2. */
  p: [number, number, number];
  /** Double chance 1X, 12, X2. */
  dc: [number, number, number];
  /** Probability of more than 1.5 / 2.5 / 3.5 goals. */
  over: Record<"1.5" | "2.5" | "3.5", number>;
  /** Both teams to score. */
  btts: number;
  /** Combo markets, [outcome 1/X/2][0 = Under 2.5 / No goal, 1 = Over 2.5 / Goal]. Missing on older predictions. */
  combo?: { ou: Pair3; gg: Pair3 };
  /** Most likely scores [home, away, probability], best first. */
  scores: [number, number, number][];
  /** Goal distributions for the multigoal markets: total 0…6 and 7+ (`t`), each team 0…4 and 5+ (`h`, `a`).
   *  Missing on predictions made before the model wrote it: goalDistributions() rebuilds them from `xg`. */
  goals?: { t: number[]; h: number[]; a: number[] };
  /** Most likely outcome: "1" | "X" | "2", or a double chance when no outcome reaches 45%. */
  pick: "1" | "X" | "2" | "1X" | "X2";
  /** How much data the model had on the two teams. */
  confidence: "alta" | "media" | "bassa";
  /** Knockout ties of the cups: chance that each side goes through [home, away] (extra time and penalties included;
   *  two legs: the aggregate, with the first leg's score once played). Missing elsewhere. */
  qualify?: [number, number];
  /** true = made before kick-off of a match that is now finished. */
  pre: boolean;
}

type Pair3 = [[number, number], [number, number], [number, number]];

export interface PredictionsFile {
  generatedAt: string;
  model: { name: string; results: number; rho: number; halfLifeDays: number; from: string | null };
  track: { n: number; hits: number; logLoss: number; brier: number };
  predictions: Record<string, Prediction>;
}

/** "52%" (whole percent, never 0% or 100% for an open event). */
export function pct(x: number) {
  const v = Math.round(x * 100);
  return `${Math.min(99, Math.max(1, v))}%`;
}

/**
 * Fair odds ("quota equa"): 1 ÷ probability, the price of an outcome with no bookmaker margin.
 * Informational only: it is not an odd offered by any operator. "—" below 2% (odds above 50 say nothing useful).
 */
export function fairOdds(x: number) {
  if (!(x >= 0.02)) return "—";
  const o = 1 / Math.min(x, 0.99);
  return o.toFixed(2).replace(".", ",");
}

/** Index (0/1/2) of the most likely 1X2 outcome. */
export const topOutcome = (p: Prediction) => p.p.indexOf(Math.max(...p.p)) as 0 | 1 | 2;

export const CONFIDENCE_LABEL: Record<Prediction["confidence"], string> = {
  alta: "Affidabilità alta",
  media: "Affidabilità media",
  bassa: "Affidabilità bassa",
};

/** Plain-language description of the pick, e.g. "Vittoria Inter" / "Inter o pareggio". */
export function pickLabel(p: Prediction, home: string, away: string) {
  switch (p.pick) {
    case "1":
      return `Vittoria ${home}`;
    case "2":
      return `Vittoria ${away}`;
    case "X":
      return "Pareggio";
    case "1X":
      return `${home} o pareggio`;
    case "X2":
      return `${away} o pareggio`;
  }
}

/** Probability of the model's pick (single outcome or double chance). */
export function pickProbability(p: Prediction) {
  switch (p.pick) {
    case "1":
      return p.p[0];
    case "X":
      return p.p[1];
    case "2":
      return p.p[2];
    case "1X":
      return p.dc[0];
    case "X2":
      return p.dc[2];
  }
}

/** Most likely combination of 1X2 and Under/Over 2,5 (combo market), e.g. { label: "1 + Over 2,5", p: 0.31 }. */
export function topCombo(p: Prediction): { label: string; p: number } | null {
  if (!p.combo) return null;
  let best: { label: string; p: number } | null = null;
  p.combo.ou.forEach((pair, o) =>
    pair.forEach((v, over) => {
      if (!best || v > best.p) best = { label: `${["1", "X", "2"][o]} + ${over ? "Over" : "Under"} 2,5`, p: v };
    }),
  );
  return best;
}

/** Outcome of a finished match as an index (0 = 1, 1 = X, 2 = 2). */
export function outcomeIndex(home: number, away: number) {
  return home > away ? 0 : home === away ? 1 : 2;
}

/** Did the pick (including double chance) match the final result? */
export function pickHit(p: Prediction, home: number, away: number) {
  const o = ["1", "X", "2"][outcomeIndex(home, away)];
  return p.pick.includes(o);
}

// ---------------------------------------------------------------------------------------------
// Markets for the quick filter on the match lists

export type FootballMarket = "1x2" | "dc" | "uo" | "gg" | "mg" | "combo";

export const FOOTBALL_MARKETS: { id: FootballMarket; label: string; short: string }[] = [
  { id: "1x2", label: "1X2", short: "1X2" },
  { id: "dc", label: "Doppia chance", short: "DC" },
  { id: "uo", label: "Under/Over 2,5", short: "U/O" },
  { id: "gg", label: "Goal/No goal", short: "GG/NG" },
  { id: "mg", label: "Multigol", short: "Multigol" },
  { id: "combo", label: "Combo", short: "Combo" },
];

export interface MarketCell {
  label: string;
  value: number;
  /** Most likely option of the market: highlighted. */
  top: boolean;
  /** Spoken label for screen readers. */
  spoken: string;
  /** Pick id in the bet slip (same keys everywhere, so a list row and the match page share the selection). */
  key: string;
  /** Text of the pick in the bet slip, e.g. "Esito finale – Inter vincente". */
  slipLabel: string;
  /** Score-matrix parameters of the match (src/lib/footballMarkets.ts lamOf): picks of the same match can be combined. */
  lam?: [number, number, number];
}

const poisson = (l: number, k: number) => {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * l ** k) / f;
};

/** Combo table from the expected goals (plain Poisson), for predictions made before the model wrote `combo`. */
function comboFromXg([lh, la]: [number, number]): { ou: Pair3; gg: Pair3 } {
  const ou: Pair3 = [[0, 0], [0, 0], [0, 0]];
  const gg: Pair3 = [[0, 0], [0, 0], [0, 0]];
  let total = 0;
  for (let i = 0; i <= 10; i++)
    for (let j = 0; j <= 10; j++) {
      const v = poisson(lh, i) * poisson(la, j);
      const o = i > j ? 0 : i === j ? 1 : 2;
      ou[o][i + j > 2.5 ? 1 : 0] += v;
      gg[o][i > 0 && j > 0 ? 1 : 0] += v;
      total += v;
    }
  for (const t of [ou, gg]) for (const r of t) for (let k = 0; k < 2; k++) r[k] /= total;
  return { ou, gg };
}

const OUT = ["1", "X", "2"] as const;

// ---------------------------------------------------------------------------------------------
// Multigoal: total goals (or one team's goals) between two numbers, both included

/** Ranges of total goals, as in the Italian multigoal markets (1-2 … 5-6). */
export const MULTIGOAL_RANGES: [number, number][] = [
  [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 3], [2, 4], [2, 5], [2, 6],
  [3, 4], [3, 5], [3, 6],
  [4, 5], [4, 6],
  [5, 6],
];
/** Ranges of one team's goals (multigol casa / ospite). */
export const TEAM_MULTIGOAL_RANGES: [number, number][] = [[1, 2], [1, 3], [2, 3]];
/** The three ranges of the "Multigol" column of the match lists. */
export const LIST_MULTIGOAL: [number, number][] = [[1, 3], [2, 4], [3, 5]];

/** Goal distributions of a prediction; plain Poisson from the expected goals for predictions without `goals`. */
export function goalDistributions(p: Prediction): { t: number[]; h: number[]; a: number[] } {
  if (p.goals) return p.goals;
  const team = (l: number, last: number) => {
    const d = Array.from({ length: last }, (_, k) => poisson(l, k));
    return [...d, Math.max(0, 1 - d.reduce((a, b) => a + b, 0))];
  };
  return { t: team(p.xg[0] + p.xg[1], 7), h: team(p.xg[0], 5), a: team(p.xg[1], 5) };
}

/** Probability that the goals (distribution `d`, last bucket = "that many or more") are between lo and hi. */
export function multigoal(d: number[], lo: number, hi: number) {
  let s = 0;
  for (let k = lo; k <= Math.min(hi, d.length - 2); k++) s += d[k] ?? 0;
  return s;
}

/** Cells shown in a match row for the selected market. */
export function marketCells(p: Prediction, market: FootballMarket, home: string, away: string): MarketCell[] {
  const lam: [number, number, number] = p.lam ?? [p.xg[0], p.xg[1], 0];
  return marketCellsOf(p, market, home, away).map((c) => ({ ...c, lam }));
}

function marketCellsOf(p: Prediction, market: FootballMarket, home: string, away: string): MarketCell[] {
  const mark = (cells: Omit<MarketCell, "top">[], skip: number[] = []) => {
    let best = -1;
    cells.forEach((c, i) => {
      if (!skip.includes(i) && (best < 0 || c.value > cells[best].value)) best = i;
    });
    return cells.map((c, i) => ({ ...c, top: i === best }));
  };
  switch (market) {
    case "1x2":
      return mark([
        { label: "1", value: p.p[0], spoken: `vittoria ${home}`, key: "1", slipLabel: `Esito finale – ${home} vincente` },
        { label: "X", value: p.p[1], spoken: "pareggio", key: "X", slipLabel: "Esito finale – Pareggio" },
        { label: "2", value: p.p[2], spoken: `vittoria ${away}`, key: "2", slipLabel: `Esito finale – ${away} vincente` },
      ]);
    case "dc":
      // "12" is almost always the highest: highlight the best of 1X / X2, as on the match page
      return mark(
        [
          { label: "1X", value: p.dc[0], spoken: `${home} o pareggio`, key: "1X", slipLabel: `Doppia chance – ${home} o pareggio` },
          { label: "12", value: p.dc[1], spoken: `${home} o ${away}`, key: "12", slipLabel: `Doppia chance – ${home} o ${away}` },
          { label: "X2", value: p.dc[2], spoken: `${away} o pareggio`, key: "X2", slipLabel: `Doppia chance – ${away} o pareggio` },
        ],
        [1],
      );
    case "uo":
      return mark([
        { label: "Under", value: 1 - p.over["2.5"], spoken: "under 2,5", key: "under25", slipLabel: "Under 2,5" },
        { label: "Over", value: p.over["2.5"], spoken: "over 2,5", key: "over25", slipLabel: "Over 2,5" },
      ]);
    case "gg":
      return mark([
        { label: "Goal", value: p.btts, spoken: "entrambe segnano", key: "gg", slipLabel: "Goal (entrambe segnano)" },
        { label: "NoGoal", value: 1 - p.btts, spoken: "almeno una non segna", key: "ng", slipLabel: "No goal" },
      ]);
    case "mg": {
      // fixed ranges, the same on every row; the most likely of the three highlighted
      const t = goalDistributions(p).t;
      return mark(
        LIST_MULTIGOAL.map(([lo, hi]) => ({
          label: `${lo}-${hi}`,
          value: multigoal(t, lo, hi),
          spoken: `multigol ${lo}-${hi}, da ${lo} a ${hi} gol in totale`,
          key: `mg${lo}-${hi}`,
          slipLabel: `Multigol ${lo}-${hi}`,
        })),
      );
    }
    case "combo": {
      const c = p.combo ?? comboFromXg(p.xg);
      const best = (t: Pair3, names: [string, string], spoken: [string, string], slip: [string, string]) => {
        let o = 0, k = 0;
        t.forEach((r, i) => r.forEach((v, j) => v > t[o][k] && ((o = i), (k = j))));
        const who = o === 0 ? `vittoria ${home}` : o === 1 ? "pareggio" : `vittoria ${away}`;
        return {
          label: `${OUT[o]}+${names[k]}`,
          value: t[o][k],
          spoken: `${who} e ${spoken[k]}`,
          key: `${OUT[o]}+${names[k]}`,
          slipLabel: `Combo – ${OUT[o]} + ${slip[k]}`,
        };
      };
      // two most likely combos, one per family; both highlighted as "best of their family"
      return [
        { ...best(c.ou, ["Under", "Over"], ["under 2,5", "over 2,5"], ["Under 2,5", "Over 2,5"]), top: true },
        { ...best(c.gg, ["NoGol", "Goal"], ["almeno una non segna", "entrambe segnano"], ["No goal", "Goal"]), top: true },
      ];
    }
  }
}
