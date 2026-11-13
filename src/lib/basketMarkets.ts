// More NBA markets from the points model (scripts/lib/basket-model.mjs): team points and first half.
//
// The final margin and total are normal around the expected values with standard deviations `sd` (measured on real
// results). Team points: two correlated normals with those margin and total spreads, so each team's spread is
// √((sdMargin² + sdTotal²) / 4). First half, from the NBA archive (2023-2026, 4,132 games): half of the points, the
// first-half margin about half of the final one, spreads 0.75 × (margin) and 0.64 × (total) of the final ones.
import type { BasketPrediction } from "./basketPredict";
import type { MarketGroup, Outcome } from "./footballMarkets";

const H1_SHARE = 0.5;
const H1_MARGIN_SHARE = 0.53;
const H1_SD_MARGIN = 0.75;
const H1_SD_TOTAL = 0.64;
const DEFAULT_SD: [number, number] = [14.7, 20];

/** Standard normal cumulative distribution. */
function Phi(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
const half = (x: number) => Math.floor(x) + 0.5;
const fmt = (x: number) => x.toFixed(1).replace(".", ",");
const prob = (key: string, label: string, slipLabel: string, spoken: string, p: number): Outcome => ({
  key, label, slipLabel, spoken, p, test: () => false,
});

/** Over/Under groups of a normal quantity: three lines around its mean, 4 points apart. */
function overUnder(id: string, title: string, mean: number, sd: number, step: number, what: string): MarketGroup[] {
  return [-1, 0, 1].map((k) => {
    const line = half(mean) + k * step;
    const over = 1 - Phi((line - mean) / sd);
    return {
      id: `${id}${line}`,
      title: `${title} ${fmt(line)}`,
      outcomes: [
        prob(`${id}:under${line}`, `Under ${fmt(line)}`, `${title} – Under ${fmt(line)}`, `meno di ${fmt(line)} ${what}`, 1 - over),
        prob(`${id}:over${line}`, `Over ${fmt(line)}`, `${title} – Over ${fmt(line)}`, `più di ${fmt(line)} ${what}`, over),
      ],
    };
  });
}

export function nbaMoreMarkets(p: BasketPrediction, home: string, away: string): { title: string; note: string; groups: MarketGroup[] }[] {
  const [sdM, sdT] = p.sd ?? DEFAULT_SD;
  const sdTeam = Math.sqrt((sdM * sdM + sdT * sdT) / 4);
  const m1 = p.margin * H1_MARGIN_SHARE;
  const t1 = p.total * H1_SHARE;
  const s1m = sdM * H1_SD_MARGIN;
  const s1t = sdT * H1_SD_TOTAL;
  // first half can end level: margin within ±0.5
  const pHome1 = 1 - Phi((0.5 - m1) / s1m);
  const pAway1 = Phi((-0.5 - m1) / s1m);
  const favHome = m1 >= 0;
  const fav = favHome ? home : away;
  const line1 = half(Math.abs(m1));
  const pFav1 = 1 - Phi((line1 - Math.abs(m1)) / s1m);
  return [
    {
      title: "Punti delle squadre",
      note: `Punti attesi: ${fmt(p.pts[0])} ${home}, ${fmt(p.pts[1])} ${away}.`,
      groups: [
        ...overUnder("nh", `Punti ${home}`, p.pts[0], sdTeam, 4, `punti ${home}`),
        ...overUnder("na", `Punti ${away}`, p.pts[1], sdTeam, 4, `punti ${away}`),
      ],
    },
    {
      title: "Primo tempo",
      note: `Stima dai valori della partita intera: nel primo tempo si segna circa metà dei punti (${fmt(t1)} attesi). Il pareggio a metà partita succede circa 3 volte su 100.`,
      groups: [
        {
          id: "n1x2",
          title: "Esito primo tempo",
          outcomes: [
            prob("n1:1", home, `Primo tempo – ${home} avanti`, `${home} avanti all'intervallo`, pHome1),
            prob("n1:X", "Pari", "Primo tempo – pareggio", "parità all'intervallo", 1 - pHome1 - pAway1),
            prob("n1:2", away, `Primo tempo – ${away} avanti`, `${away} avanti all'intervallo`, pAway1),
          ],
        },
        {
          id: "n1hcp",
          title: `Handicap primo tempo ${fav} −${fmt(line1)}`,
          outcomes: [
            prob(`n1:hcp-fav-${line1}`, `${favHome ? "1" : "2"} −${fmt(line1)}`, `Handicap primo tempo – ${fav} −${fmt(line1)}`, `${fav} avanti di più di ${fmt(line1)} all'intervallo`, pFav1),
            prob(`n1:hcp-dog-${line1}`, `${favHome ? "2" : "1"} +${fmt(line1)}`, `Handicap primo tempo – ${favHome ? away : home} +${fmt(line1)}`, `${favHome ? away : home} sotto di meno di ${fmt(line1)} o avanti`, 1 - pFav1),
          ],
        },
        ...overUnder("n1t", "Punti primo tempo", t1, s1t, 4, "punti nel primo tempo"),
      ],
    },
  ];
}
