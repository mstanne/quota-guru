/**
 * "What it means in practice" for a welcome offer: how much has to be wagered and what that costs on average.
 * Pure arithmetic on the fields of src/data/offers.json, with two stated assumptions (shown on the page and in the
 * guide /guide/quanto-costa-un-bonus). Informational: it never says an offer is "worth it" – at most that, on
 * average, meeting the requirement costs more than what can be converted.
 */
import { formatEuro, type OfferComponent, type WelcomeOffer } from "../data/offers";

/** Assumed bookmaker margin on each event of a bet (typical of main markets). */
export const SPORT_MARGIN_PER_EVENT = 0.05;
/** Assumed return to player for slots / casino games. */
export const CASINO_RTP = 0.96;

export const BONUS_COST_GUIDE = "/guide/quanto-costa-un-bonus";

export interface ComponentMath {
  /** Total amount to wager to meet the requirement (wagering × amount), null when there is no requirement. */
  volume: number | null;
  /** Days available (requirement deadline, or bonus validity). */
  days: number | null;
  /** Average wagering per day needed to finish in time. */
  perDay: number | null;
  /** Average share of each euro wagered that is lost (null when it cannot be estimated, e.g. live games). */
  lossRate: number | null;
  /** Average cost of meeting the requirement (volume × lossRate). */
  expectedCost: number | null;
  /** Most that can end up withdrawable/real from this component. */
  cap: number;
  /** Sport bonus spent on bets: average euro returned if the whole bonus is played once at the minimum conditions. */
  averageReturn: number | null;
  /** Probability that one bet at the minimum conditions (events × minimum odds) wins. */
  winProbability: number | null;
  /** Plain-language sentences, factual, for the "In pratica" box. */
  lines: string[];
}

/** Whole euro from 10 € up, cents below (9,50 € must not read as 10 €). */
const money = (x: number) => formatEuro(x >= 10 ? Math.round(x) : Math.round(x * 100) / 100);
const pctText = (x: number) => `${Math.round(x * 100)}%`;
const oddsText = (x: number) => x.toFixed(2).replace(".", ",");
const oneIn = (p: number) => {
  const n = Math.round(1 / p);
  return n <= 1 ? "quasi sempre" : `circa 1 volta su ${n}`;
};

export function componentMath(c: OfferComponent): ComponentMath {
  const days = c.wageringDays ?? c.validityDays;
  const cap = c.maxConvertible !== null ? Math.min(c.maxConvertible, c.maxAmount) : c.maxAmount;
  // "Ogni euro giocato conta al 75% del requisito": each euro wagered covers only part of it
  const text = [c.usableOn, ...c.notes].join(" ");
  const share = Number(text.match(/conta al (\d+)%/i)?.[1] ?? 100) / 100;
  // bonus credited in tranches (or one per provider), each with its own deadline: no single "per day" figure
  const tranches = /tranche|erogato come \d+ bonus|per provider/i.test(text);
  const volume =
    c.wagering !== null && c.wagering > 0 && c.kind !== "rimborso" ? (c.wagering * c.maxAmount) / (share || 1) : null;
  const perDay = volume !== null && days && !tranches ? volume / days : null;
  const legs = Math.max(1, c.minEvents ?? 1);
  // live casino games only ("esclusi Live Roulette" is not a live-only bonus)
  const live = /\blive\b/i.test(c.usableOn) && !/esclus/i.test(c.usableOn);

  let lossRate: number | null = null;
  if (c.product === "sport") lossRate = 1 - (1 - SPORT_MARGIN_PER_EVENT) ** legs;
  else if (c.product === "casino" && !live) lossRate = 1 - CASINO_RTP;
  const expectedCost = volume !== null && lossRate !== null ? volume * lossRate : null;

  // sport bonus that is simply spent on bets (no rollover, or rollover of 1)
  const spent = c.product === "sport" && c.kind !== "rimborso" && (c.wagering === null || c.wagering <= 1);
  const averageReturn = spent ? c.maxAmount * (1 - SPORT_MARGIN_PER_EVENT) ** legs : null;
  const winProbability =
    c.product === "sport" && c.minOddsPerEvent !== null && c.minOddsPerEvent > 1
      ? Math.min(1, ((1 - SPORT_MARGIN_PER_EVENT) / c.minOddsPerEvent) ** legs)
      : null;

  const lines: string[] = [];
  const amount = formatEuro(c.maxAmount);
  if (c.kind === "rimborso") {
    lines.push(
      `Il rimborso restituisce una parte di quanto si perde: per ottenerlo bisogna prima perdere, e l'importo massimo di ${amount} si raggiunge solo con perdite almeno pari.`,
    );
  } else if (volume !== null && c.wagering! > 1) {
    const dayWord = (d: number) => `${d} ${d === 1 ? "giorno" : "giorni"}`;
    lines.push(
      `Per sbloccare ${amount} di bonus bisogna giocare ${formatEuro(Math.round(volume))} (${c.wagering} volte l'importo` +
        (share < 1 ? `, con ogni euro giocato che conta al ${Math.round(share * 100)}%` : "") +
        ")" +
        (!days
          ? "."
          : tranches
            ? `, in più tranche: ognuna va completata entro ${dayWord(days)}.`
            : ` entro ${dayWord(days)}, cioè in media ${formatEuro(Math.round(perDay!))} al giorno.`),
    );
    if (expectedCost !== null) {
      const hyp =
        c.product === "sport"
          ? `margine del ${pctText(SPORT_MARGIN_PER_EVENT)} per evento${legs > 1 ? ` su multiple da ${legs} eventi` : ""}`
          : `ritorno teorico del ${pctText(CASINO_RTP)}`;
      lines.push(`Con un ${hyp}, in media queste giocate costano circa ${money(expectedCost)}.`);
      if (expectedCost >= cap)
        lines.push(
          `In media il requisito costa più di quanto si può ottenere (${formatEuro(cap)}${cap < c.maxAmount ? ", importo massimo convertibile" : ""}).`,
        );
    } else if (live) {
      lines.push("Sui giochi live il ritorno varia molto da un gioco all'altro: non stimiamo un costo medio.");
    }
  } else if (averageReturn !== null) {
    lines.push(
      `Il bonus va giocato${legs > 1 ? ` su scommesse con almeno ${legs} eventi` : " in scommesse"}: con un margine del ${pctText(
        SPORT_MARGIN_PER_EVENT,
      )} per evento, giocandolo tutto una volta restituisce in media circa ${money(averageReturn)} su ${amount}.`,
    );
  } else if (c.kind === "bonus-real" && c.wagering === null) {
    lines.push("Le condizioni non indicano un requisito di giocata per questa parte.");
  }
  if (winProbability !== null && legs > 1 && c.kind !== "rimborso")
    lines.push(
      `Una multipla di ${legs} eventi a quota ${oddsText(c.minOddsPerEvent!)} (quota totale ${oddsText(
        c.minOddsPerEvent! ** legs,
      )}) vince ${oneIn(winProbability)}.`,
    );
  if (c.maxConvertible !== null && c.maxConvertible < c.maxAmount)
    lines.push(`Di ${amount} se ne possono convertire al massimo ${formatEuro(c.maxConvertible)}.`);

  return { volume, days, perDay, lossRate, expectedCost, cap, averageReturn, winProbability, lines };
}

/** Total wagering needed across all components of an offer for one product (null when none has a requirement). */
export function totalVolume(o: WelcomeOffer, product: OfferComponent["product"]) {
  const vols = o.components.filter((c) => c.product === product).map((c) => componentMath(c).volume);
  const known = vols.filter((v): v is number => v !== null);
  return known.length ? known.reduce((a, b) => a + b, 0) : null;
}
