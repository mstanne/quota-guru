// Every goal market of a football match from one score matrix: P(home scores h, away scores a), Dixon-Coles
// corrected, rebuilt from the prediction's exact parameters (`lam`: expected goals and ρ, scripts/lib/poisson-model.mjs).
//
// A market outcome is a test on the final score (90 minutes). So the probability of an outcome is the sum of the
// cells where the test holds, and the probability of several outcomes of the SAME match all coming true (a combo
// built in the slip) is the sum of the cells where all the tests hold: exact, where the product of the single
// probabilities would be wrong (the outcomes of one match depend on each other).
//
// Pure functions, no data import: used by the match page (MoreMarkets), the slip (src/lib/slip.ts) and the list cells.
import { MULTIGOAL_RANGES, type Prediction } from "./predictionsCore";

/** [expected goals home, expected goals away, Dixon-Coles ρ]. */
export type Lam = [number, number, number];
/** grid[h][a] = probability of the final score h-a (0…MAX each, normalised). */
export type Grid = number[][];
type Test = (h: number, a: number) => boolean;

const MAX = 10;

/** Matrix parameters of a prediction; older predictions (no `lam`): plain Poisson from the rounded expected goals. */
export const lamOf = (p: Prediction): Lam => p.lam ?? [p.xg[0], p.xg[1], 0];

function tau(x: number, y: number, l: number, m: number, rho: number) {
  if (x === 0 && y === 0) return 1 - l * m * rho;
  if (x === 0 && y === 1) return 1 + l * rho;
  if (x === 1 && y === 0) return 1 + m * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}
function pmf(lam: number) {
  const p = [Math.exp(-lam)];
  for (let k = 1; k <= MAX; k++) p.push((p[k - 1] * lam) / k);
  return p;
}

const grids = new Map<string, Grid>();
/** Score matrix of the parameters (memoised: the same match is asked for many times on a page). */
export function scoreGrid([lh, la, rho]: Lam): Grid {
  const id = `${lh}|${la}|${rho}`;
  const hit = grids.get(id);
  if (hit) return hit;
  const ph = pmf(lh);
  const pa = pmf(la);
  let total = 0;
  const g: Grid = ph.map((x, i) =>
    pa.map((y, j) => {
      const v = Math.max(0, x * y * tau(i, j, lh, la, rho));
      total += v;
      return v;
    }),
  );
  for (const row of g) for (let j = 0; j < row.length; j++) row[j] /= total;
  if (grids.size > 500) grids.clear();
  grids.set(id, g);
  return g;
}

/** Probability that every test holds on the final score. */
export function chance(grid: Grid, tests: Test[]) {
  let s = 0;
  for (let h = 0; h < grid.length; h++)
    for (let a = 0; a < grid[h].length; a++) if (tests.every((t) => t(h, a))) s += grid[h][a];
  return s;
}

// ------------------------------------------------------------------------------------------------ outcome catalogue

export interface Outcome {
  /** Pick id in the slip (the same keys as the list cells, src/lib/predictionsCore.ts marketCells). */
  key: string;
  /** Short text of the button. */
  label: string;
  /** Text of the pick in the slip. */
  slipLabel: string;
  /** For screen readers. */
  spoken: string;
  /** Test on the final score (outcomes of the score matrix). */
  test: Test;
  /** Probability given directly (first half, corners, cards): not a test on the final score, `test` is unused. */
  p?: number;
}
export interface MarketGroup {
  /** Market id: two picks of the same match and the same market replace each other in the slip. */
  id: string;
  title: string;
  /** One line under the title. */
  note?: string;
  outcomes: Outcome[];
}

const dec = (x: number) => String(x).replace(".", ",");
const k10 = (x: number) => String(Math.round(x * 10)).padStart(2, "0");
const out = (o: number) => (h: number, a: number) => (o === 0 ? h > a : o === 1 ? h === a : h < a);
const OUT = ["1", "X", "2"] as const;
const DC: { key: string; test: Test; text: (home: string, away: string) => string }[] = [
  { key: "1X", test: (h, a) => h >= a, text: (home) => `${home} o pareggio` },
  { key: "12", test: (h, a) => h !== a, text: (home, away) => `${home} o ${away}` },
  { key: "X2", test: (h, a) => h <= a, text: (_, away) => `${away} o pareggio` },
];
const UO_LINES = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];
const TEAM_LINES = [0.5, 1.5, 2.5];
/** Home handicap of the European handicap markets (−1 = the home side starts one goal behind). */
const EH_LINES = [-2, -1, 1, 2];

const ehText = (hcp: number) => (hcp < 0 ? `0:${-hcp}` : `${hcp}:0`);

/** Groups of outcomes shown under "Altri mercati" on the match page (every one can go in the slip). */
export function goalMarkets(home: string, away: string): MarketGroup[] {
  const uo = (line: number): MarketGroup => ({
    id: `ou${k10(line)}`,
    title: `Under/Over ${dec(line)}`,
    outcomes: [
      { key: `under${k10(line)}`, label: `Under ${dec(line)}`, slipLabel: `Under ${dec(line)}`, spoken: `meno di ${line} gol`, test: (h, a) => h + a < line },
      { key: `over${k10(line)}`, label: `Over ${dec(line)}`, slipLabel: `Over ${dec(line)}`, spoken: `più di ${line} gol`, test: (h, a) => h + a > line },
    ],
  });
  const team = (side: "h" | "a", line: number): MarketGroup => {
    const name = side === "h" ? home : away;
    const goals = (h: number, a: number) => (side === "h" ? h : a);
    return {
      id: `${side}ou${k10(line)}`,
      title: `Gol ${name} ${dec(line)}`,
      outcomes: [
        {
          key: `${side}-under${k10(line)}`,
          label: line === 0.5 ? "Non segna" : `Under ${dec(line)}`,
          slipLabel: `Gol ${name} – Under ${dec(line)}${line === 0.5 ? " (non segna)" : ""}`,
          spoken: `${name} meno di ${line} gol`,
          test: (h, a) => goals(h, a) < line,
        },
        {
          key: `${side}-over${k10(line)}`,
          label: line === 0.5 ? "Segna" : `Over ${dec(line)}`,
          slipLabel: `Gol ${name} – Over ${dec(line)}${line === 0.5 ? " (segna)" : ""}`,
          spoken: `${name} più di ${line} gol`,
          test: (h, a) => goals(h, a) > line,
        },
      ],
    };
  };
  const eh = (hcp: number): MarketGroup => {
    const leader = hcp < 0 ? home : away;
    const n = Math.abs(hcp);
    const fav = hcp < 0 ? 0 : 2; // the side that gives the goals
    const notWin = (name: string) => (n === 1 ? `${name} non vince` : `${name} non vince con ${n} o più gol di scarto`);
    const texts =
      fav === 0
        ? [`${home} vince con almeno ${n + 1} gol di scarto`, `${home} vince con ${n} gol di scarto`, notWin(home)]
        : [notWin(away), `${away} vince con ${n} gol di scarto`, `${away} vince con almeno ${n + 1} gol di scarto`];
    return {
      id: `eh${hcp}`,
      title: `Handicap europeo ${ehText(hcp)}`,
      note: `${leader} parte con ${n} gol di svantaggio.`,
      outcomes: OUT.map((o, i) => ({
        key: `eh${hcp}:${o}`,
        label: `${o}H`,
        slipLabel: `Handicap ${ehText(hcp)} – ${o}H (${texts[i]})`,
        spoken: texts[i],
        test: (h: number, a: number) => out(i)(h + hcp, a),
      })),
    };
  };
  const margin = (side: 0 | 2, n: number, plus: boolean): Outcome => {
    const name = side === 0 ? home : away;
    const diff = (h: number, a: number) => (side === 0 ? h - a : a - h);
    const txt = `${name} vince con ${plus ? `${n} o più` : n} gol di scarto`;
    return {
      key: `m${OUT[side]}-${n}${plus ? "+" : ""}`,
      label: `${OUT[side]} · scarto ${n}${plus ? "+" : ""}`,
      slipLabel: `Margine di vittoria – ${txt}`,
      spoken: txt,
      test: plus ? (h, a) => diff(h, a) >= n : (h, a) => diff(h, a) === n,
    };
  };
  return [
    ...UO_LINES.filter((l) => l !== 2.5).map(uo),
    ...TEAM_LINES.map((l) => team("h", l)),
    ...TEAM_LINES.map((l) => team("a", l)),
    {
      id: "w2n",
      title: "Vince senza subire gol",
      outcomes: [
        { key: "1-nil", label: home, slipLabel: `${home} vince senza subire gol`, spoken: `${home} vince senza subire gol`, test: (h, a) => h > 0 && a === 0 },
        { key: "2-nil", label: away, slipLabel: `${away} vince senza subire gol`, spoken: `${away} vince senza subire gol`, test: (h, a) => a > 0 && h === 0 },
      ],
    },
    {
      id: "margin",
      title: "Margine di vittoria",
      note: "Con quanti gol di scarto finisce la partita.",
      outcomes: [
        margin(0, 1, false),
        margin(0, 2, false),
        margin(0, 3, true),
        { key: "mX", label: "Pareggio", slipLabel: "Margine di vittoria – Pareggio", spoken: "pareggio", test: (h, a) => h === a },
        margin(2, 1, false),
        margin(2, 2, false),
        margin(2, 3, true),
      ],
    },
    ...EH_LINES.map(eh),
    {
      id: "dc-ou",
      title: "Doppia chance + Under/Over 2,5",
      outcomes: DC.flatMap((d) =>
        (["Under", "Over"] as const).map((u) => ({
          key: `${d.key}+${u}`,
          label: `${d.key} + ${u}`,
          slipLabel: `Combo – ${d.key} + ${u} 2,5`,
          spoken: `${d.text(home, away)} e ${u === "Under" ? "meno" : "più"} di 2,5 gol`,
          test: (h: number, a: number) => d.test(h, a) && (u === "Under" ? h + a < 2.5 : h + a > 2.5),
        })),
      ),
    },
    {
      id: "dc-gg",
      title: "Doppia chance + Goal/No goal",
      outcomes: DC.flatMap((d) =>
        (["Goal", "NoGol"] as const).map((u) => ({
          key: `${d.key}+${u}`,
          label: `${d.key} + ${u === "Goal" ? "Goal" : "No goal"}`,
          slipLabel: `Combo – ${d.key} + ${u === "Goal" ? "Goal" : "No goal"}`,
          spoken: `${d.text(home, away)} e ${u === "Goal" ? "entrambe segnano" : "almeno una non segna"}`,
          test: (h: number, a: number) => d.test(h, a) && (u === "Goal" ? h > 0 && a > 0 : h === 0 || a === 0),
        })),
      ),
    },
    {
      id: "oe",
      title: "Pari/Dispari",
      note: "Somma dei gol della partita (0 gol è pari).",
      outcomes: [
        { key: "even", label: "Pari", slipLabel: "Somma gol pari", spoken: "somma dei gol pari", test: (h, a) => (h + a) % 2 === 0 },
        { key: "odd", label: "Dispari", slipLabel: "Somma gol dispari", spoken: "somma dei gol dispari", test: (h, a) => (h + a) % 2 === 1 },
      ],
    },
  ];
}

/** Exact-score outcomes: the `n` most likely scores of the grid. */
export function exactScores(grid: Grid, n = 9): (Outcome & { p: number })[] {
  const all: [number, number, number][] = [];
  grid.forEach((row, h) => row.forEach((v, a) => all.push([h, a, v])));
  return all
    .sort((x, y) => y[2] - x[2])
    .slice(0, n)
    .map(([h, a, v]) => ({ ...scoreOutcome(h, a), p: v }));
}
const scoreOutcome = (h: number, a: number): Outcome => ({
  key: `cs${h}-${a}`,
  label: `${h}-${a}`,
  slipLabel: `Risultato esatto ${h}-${a}`,
  spoken: `risultato esatto ${h} a ${a}`,
  test: (x, y) => x === h && y === a,
});

// ------------------------------------------------------------------------------------------------ key → test

interface KeyInfo {
  group: string;
  test: Test;
}
const REGISTRY = new Map<string, KeyInfo>();
{
  const add = (group: string, key: string, test: Test) => REGISTRY.set(key, { group, test });
  // the picks of the lists and of the "Aggiungi un esito" box (marketCells)
  OUT.forEach((o, i) => add("1x2", o, out(i)));
  DC.forEach((d) => add("dc", d.key, d.test));
  add("gg", "gg", (h, a) => h > 0 && a > 0);
  add("gg", "ng", (h, a) => h === 0 || a === 0);
  add("ou25", "under25", (h, a) => h + a < 2.5);
  add("ou25", "over25", (h, a) => h + a > 2.5);
  for (const [lo, hi] of MULTIGOAL_RANGES) add("mg", `mg${lo}-${hi}`, (h, a) => h + a >= lo && h + a <= hi);
  OUT.forEach((o, i) => {
    add("combo-ou", `${o}+Under`, (h, a) => out(i)(h, a) && h + a < 2.5);
    add("combo-ou", `${o}+Over`, (h, a) => out(i)(h, a) && h + a > 2.5);
    add("combo-gg", `${o}+NoGol`, (h, a) => out(i)(h, a) && (h === 0 || a === 0));
    add("combo-gg", `${o}+Goal`, (h, a) => out(i)(h, a) && h > 0 && a > 0);
  });
  // "Altri mercati" (team names do not change the tests)
  for (const g of goalMarkets("", "")) for (const o of g.outcomes) add(g.id, o.key, o.test);
}

/** Market and test of a pick key; null for keys that are not a test on the final score (or unknown). */
export function keyInfo(key: string): KeyInfo | null {
  const known = REGISTRY.get(key);
  if (known) return known;
  const cs = /^cs(\d+)-(\d+)$/.exec(key);
  if (cs) return { group: "cs", test: scoreOutcome(Number(cs[1]), Number(cs[2])).test };
  return null;
}

/** Probability that all the keys come true together on one match (null if a key is not a final-score test). */
export function jointChance(lam: Lam, keys: string[]): number | null {
  const tests = keys.map(keyInfo);
  if (tests.some((t) => !t)) return null;
  return chance(scoreGrid(lam), tests.map((t) => t!.test));
}

// ------------------------------------------------------------------------------------------------ Asian handicap

export interface AsianLine {
  /** Home handicap: −1.5, −1.25, −1, … */
  line: number;
  /** Fair odds of home and away with that line (push and half results included). */
  home: number;
  away: number;
  /** Probability that the home bet is won in full, refunded (push), lost in full. */
  win: number;
  push: number;
}

/**
 * Asian handicap: the home side's goals plus `line`. Whole lines can end level (stake refunded), quarter lines are half
 * on each of the two nearest lines. Fair odds: those where the expected profit is zero.
 */
export function asianLines(grid: Grid, lines: number[]): AsianLine[] {
  const settle = (line: number, d: number): number => {
    const frac = Math.abs(line * 4) % 2;
    if (frac === 1) return (settle(line - 0.25, d) + settle(line + 0.25, d)) / 2; // quarter line
    const x = d + line;
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  };
  return lines.map((line) => {
    // distribution of the result of the home bet: +1, +½, 0, −½, −1
    const r = new Map<number, number>();
    grid.forEach((row, h) => row.forEach((v, a) => {
      const s = settle(line, h - a);
      r.set(s, (r.get(s) ?? 0) + v);
    }));
    const g = (k: number) => r.get(k) ?? 0;
    const fair = (w: number, hw: number, hl: number, l: number) => 1 + (hl / 2 + l) / (w + hw / 2);
    return {
      line,
      home: fair(g(1), g(0.5), g(-0.5), g(-1)),
      away: fair(g(-1), g(-0.5), g(0.5), g(1)),
      win: g(1),
      push: g(0),
    };
  });
}

/** The asian lines to show: the most balanced one (home fair odds closest to 2) and four on each side. */
export function asianTable(grid: Grid): AsianLine[] {
  const all = asianLines(grid, Array.from({ length: 25 }, (_, i) => -3 + i * 0.25));
  let best = 0;
  all.forEach((l, i) => Math.abs(l.home - 2) < Math.abs(all[best].home - 2) && (best = i));
  const from = Math.max(0, Math.min(all.length - 9, best - 4));
  return all.slice(from, from + 9);
}

/** Draw no bet: the stake comes back on a draw. Probabilities (without the draw) and fair odds of the two sides. */
export function drawNoBet(grid: Grid) {
  const [l] = asianLines(grid, [0]);
  return { home: l.home, away: l.away, pHome: l.win / (1 - l.push), draw: l.push };
}

// ------------------------------------------------------------------------------------------------ first half

export const DEFAULT_HALF = 0.444;

function poissonGrid(lh: number, la: number, max = 8): Grid {
  const ph = pmf(lh).slice(0, max + 1);
  const pa = pmf(la).slice(0, max + 1);
  const g = ph.map((x) => pa.map((y) => x * y));
  const t = g.flat().reduce((s, v) => s + v, 0);
  return g.map((r) => r.map((v) => v / t));
}

/**
 * First half, second half and half-time/full-time. The goals of each half follow a Poisson count with a share of the
 * match's expected goals (`half`: first half, measured on the archive, ~44%); the halves are independent. The 9
 * half-time/full-time outcomes are then rescaled so that their full-time totals match the 1X2 of the main matrix.
 */
export function halfMarkets(p: Prediction, home: string, away: string): MarketGroup[] {
  const [lh, la] = lamOf(p);
  const s = p.half ?? DEFAULT_HALF;
  const h1 = poissonGrid(s * lh, s * la);
  const h2 = poissonGrid((1 - s) * lh, (1 - s) * la);
  const sum = (g: Grid, t: Test) => chance(g, [t]);
  const prob = (key: string, label: string, slipLabel: string, spoken: string, v: number): Outcome => ({
    key, label, slipLabel, spoken, p: v, test: () => false,
  });
  const names = [home, "pareggio", away];
  const o1x2 = (g: Grid, tag: string, pre: string): MarketGroup => ({
    id: `${tag}1x2`,
    title: `Esito ${pre}`,
    outcomes: OUT.map((o, i) =>
      prob(`${tag}:${o}`, o, `Esito ${pre} – ${o} (${i === 1 ? "pareggio" : `${names[i]} avanti`})`, `${pre}: ${i === 1 ? "pareggio" : `${names[i]} avanti`}`, sum(g, out(i))),
    ),
  });
  const ou = (g: Grid, tag: string, pre: string, line: number): MarketGroup => ({
    id: `${tag}ou${k10(line)}`,
    title: `Under/Over ${dec(line)} ${pre}`,
    outcomes: [
      prob(`${tag}:under${k10(line)}`, `Under ${dec(line)}`, `Under ${dec(line)} ${pre}`, `${pre}: meno di ${line} gol`, sum(g, (h, a) => h + a < line)),
      prob(`${tag}:over${k10(line)}`, `Over ${dec(line)}`, `Over ${dec(line)} ${pre}`, `${pre}: più di ${line} gol`, sum(g, (h, a) => h + a > line)),
    ],
  });
  // half-time / full-time: HT outcome i, FT outcome j (FT score = sum of the two halves)
  const raw = [0, 1, 2].map(() => [0, 0, 0]);
  h1.forEach((r1, a) => r1.forEach((v1, b) => h2.forEach((r2, c) => r2.forEach((v2, d) => {
    const i = a > b ? 0 : a === b ? 1 : 2;
    const ft = a + c - (b + d);
    raw[i][ft > 0 ? 0 : ft === 0 ? 1 : 2] += v1 * v2;
  }))));
  const ftMain = [0, 1, 2].map((j) => chance(scoreGrid(lamOf(p)), [out(j)]));
  const ftRaw = [0, 1, 2].map((j) => raw[0][j] + raw[1][j] + raw[2][j]);
  const htft = raw.map((r) => r.map((v, j) => (ftRaw[j] > 0 ? (v * ftMain[j]) / ftRaw[j] : 0)));
  // goals: more in the first half, in the second, as many
  const totals = (g: Grid) => {
    const t: number[] = [];
    g.forEach((row, i) => row.forEach((v, j) => (t[i + j] = (t[i + j] ?? 0) + v)));
    return t;
  };
  const t1 = totals(h1);
  const t2 = totals(h2);
  let more1 = 0, more2 = 0, same = 0;
  t1.forEach((x, i) => t2.forEach((y, j) => (i > j ? (more1 += x * y) : i < j ? (more2 += x * y) : (same += x * y))));
  return [
    o1x2(h1, "ht", "primo tempo"),
    ou(h1, "ht", "primo tempo", 0.5),
    ou(h1, "ht", "primo tempo", 1.5),
    ou(h1, "ht", "primo tempo", 2.5),
    {
      id: "htgg",
      title: "Goal/No goal primo tempo",
      outcomes: [
        prob("ht:gg", "Goal", "Goal primo tempo", "primo tempo: segnano entrambe", sum(h1, (h, a) => h > 0 && a > 0)),
        prob("ht:ng", "No goal", "No goal primo tempo", "primo tempo: almeno una non segna", sum(h1, (h, a) => h === 0 || a === 0)),
      ],
    },
    o1x2(h2, "st", "secondo tempo"),
    ou(h2, "st", "secondo tempo", 0.5),
    ou(h2, "st", "secondo tempo", 1.5),
    {
      id: "half-more",
      title: "Tempo con più gol",
      outcomes: [
        prob("hm:1", "1° tempo", "Tempo con più gol – primo", "più gol nel primo tempo", more1),
        prob("hm:X", "Uguale", "Tempo con più gol – stessi gol", "stessi gol nei due tempi", same),
        prob("hm:2", "2° tempo", "Tempo con più gol – secondo", "più gol nel secondo tempo", more2),
      ],
    },
    {
      id: "htft",
      title: "Parziale/Finale",
      note: "Esito a fine primo tempo / esito finale.",
      outcomes: OUT.flatMap((a, i) =>
        OUT.map((b, j) => prob(`htft:${a}/${b}`, `${a}/${b}`, `Parziale/Finale ${a}/${b}`, `${names[i]} a metà, ${names[j]} alla fine`, htft[i][j])),
      ),
    },
  ];
}

// ------------------------------------------------------------------------------------------------ corners and cards

function lgamma(x: number): number {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/** Count distribution 0…max with mean `mu` and variance `phi`·mu: Poisson (phi ≤ 1) or negative binomial. */
function countPmf(mu: number, phi: number, max = 30) {
  const out: number[] = [];
  if (phi <= 1.0001) {
    let v = Math.exp(-mu);
    for (let k = 0; k <= max; k++) {
      out.push(v);
      v = (v * mu) / (k + 1);
    }
    return out;
  }
  const r = mu / (phi - 1);
  const q = r / (r + mu);
  for (let k = 0; k <= max; k++)
    out.push(Math.exp(lgamma(k + r) - lgamma(r) - lgamma(k + 1) + r * Math.log(q) + k * Math.log(1 - q)));
  return out;
}

/** Corner or card markets of a match from [expected home, expected away, dispersion]. */
export function countMarkets(
  kind: "corners" | "cards",
  [mh, ma, phi]: [number, number, number],
  home: string,
  away: string,
): MarketGroup[] {
  const ph = countPmf(mh, phi);
  const pa = countPmf(ma, phi);
  const joint = (t: Test) => {
    let s = 0;
    ph.forEach((x, i) => pa.forEach((y, j) => t(i, j) && (s += x * y)));
    return s;
  };
  const word = kind === "corners" ? "corner" : "cartellini";
  const tag = kind === "corners" ? "c" : "k";
  const lines = kind === "corners" ? [7.5, 8.5, 9.5, 10.5, 11.5, 12.5] : [2.5, 3.5, 4.5, 5.5, 6.5];
  const teamLines = kind === "corners" ? [3.5, 4.5, 5.5] : [1.5, 2.5];
  const prob = (key: string, label: string, slipLabel: string, spoken: string, v: number): Outcome => ({
    key, label, slipLabel, spoken, p: v, test: () => false,
  });
  const ou = (who: "t" | "h" | "a", line: number): MarketGroup => {
    const name = who === "t" ? "" : ` ${who === "h" ? home : away}`;
    const val = (h: number, a: number) => (who === "t" ? h + a : who === "h" ? h : a);
    return {
      id: `${tag}${who}ou${k10(line)}`,
      title: who === "t" ? `Totale ${word} ${dec(line)}` : `${word[0].toUpperCase()}${word.slice(1)}${name} ${dec(line)}`,
      outcomes: [
        prob(`${tag}${who}:under${k10(line)}`, `Under ${dec(line)}`, `${word[0].toUpperCase()}${word.slice(1)}${name} – Under ${dec(line)}`, `meno di ${line} ${word}${name}`, joint((h, a) => val(h, a) < line)),
        prob(`${tag}${who}:over${k10(line)}`, `Over ${dec(line)}`, `${word[0].toUpperCase()}${word.slice(1)}${name} – Over ${dec(line)}`, `più di ${line} ${word}${name}`, joint((h, a) => val(h, a) > line)),
      ],
    };
  };
  return [
    {
      id: `${tag}1x2`,
      title: kind === "corners" ? "Chi batte più corner" : "Chi riceve più cartellini",
      outcomes: [
        prob(`${tag}:1`, home, `Più ${word} – ${home}`, `più ${word} ${home}`, joint((h, a) => h > a)),
        prob(`${tag}:X`, "Pari", `Più ${word} – stesso numero`, `stesso numero di ${word}`, joint((h, a) => h === a)),
        prob(`${tag}:2`, away, `Più ${word} – ${away}`, `più ${word} ${away}`, joint((h, a) => h < a)),
      ],
    },
    ...lines.map((l) => ou("t", l)),
    ...teamLines.map((l) => ou("h", l)),
    ...teamLines.map((l) => ou("a", l)),
  ];
}
