// Types and formatting helpers for the football predictions (Poisson / Dixon-Coles model).
// The numbers come from scripts/predict-football.mjs; no data import here, so small components can use it.

export interface Prediction {
  /** Expected goals [home, away]. */
  xg: [number, number];
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
  /** Most likely outcome: "1" | "X" | "2", or a double chance when no outcome reaches 45%. */
  pick: "1" | "X" | "2" | "1X" | "X2";
  /** How much data the model had on the two teams. */
  confidence: "alta" | "media" | "bassa";
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

export type FootballMarket = "1x2" | "dc" | "uo" | "gg" | "combo";

export const FOOTBALL_MARKETS: { id: FootballMarket; label: string; short: string }[] = [
  { id: "1x2", label: "1X2", short: "1X2" },
  { id: "dc", label: "Doppia chance", short: "DC" },
  { id: "uo", label: "Under/Over 2,5", short: "U/O" },
  { id: "gg", label: "Goal/No goal", short: "GG/NG" },
  { id: "combo", label: "Combo", short: "Combo" },
];

export interface MarketCell {
  label: string;
  value: number;
  /** Most likely option of the market: highlighted. */
  top: boolean;
  /** Spoken label for screen readers. */
  spoken: string;
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

/** Cells shown in a match row for the selected market. */
export function marketCells(p: Prediction, market: FootballMarket, home: string, away: string): MarketCell[] {
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
        { label: "1", value: p.p[0], spoken: `vittoria ${home}` },
        { label: "X", value: p.p[1], spoken: "pareggio" },
        { label: "2", value: p.p[2], spoken: `vittoria ${away}` },
      ]);
    case "dc":
      // "12" is almost always the highest: highlight the best of 1X / X2, as on the match page
      return mark(
        [
          { label: "1X", value: p.dc[0], spoken: `${home} o pareggio` },
          { label: "12", value: p.dc[1], spoken: `${home} o ${away}` },
          { label: "X2", value: p.dc[2], spoken: `${away} o pareggio` },
        ],
        [1],
      );
    case "uo":
      return mark([
        { label: "Under", value: 1 - p.over["2.5"], spoken: "under 2,5" },
        { label: "Over", value: p.over["2.5"], spoken: "over 2,5" },
      ]);
    case "gg":
      return mark([
        { label: "Goal", value: p.btts, spoken: "entrambe segnano" },
        { label: "NoGoal", value: 1 - p.btts, spoken: "almeno una non segna" },
      ]);
    case "combo": {
      const c = p.combo ?? comboFromXg(p.xg);
      const best = (t: Pair3, names: [string, string], spoken: [string, string]) => {
        let o = 0, k = 0;
        t.forEach((r, i) => r.forEach((v, j) => v > t[o][k] && ((o = i), (k = j))));
        const who = o === 0 ? `vittoria ${home}` : o === 1 ? "pareggio" : `vittoria ${away}`;
        return { label: `${OUT[o]}+${names[k]}`, value: t[o][k], spoken: `${who} e ${spoken[k]}` };
      };
      // two most likely combos, one per family; both highlighted as "best of their family"
      return [
        { ...best(c.ou, ["Under", "Over"], ["under 2,5", "over 2,5"]), top: true },
        { ...best(c.gg, ["NoGol", "Goal"], ["almeno una non segna", "entrambe segnano"]), top: true },
      ];
    }
  }
}
