/**
 * One explanatory page per published welcome offer: /bonus/<offer id>.
 * Informational ("condizioni spiegate"): what the offer contains, how much has to be wagered, what that costs on
 * average, the official terms. No outbound call to action to the operator (only the link to the official terms).
 * Only approved, current, recently verified offers get a page (same rule as the /bonus list).
 */
import { formatEuro, visibleOffers, type WelcomeOffer } from "../data/offers";
import { getOperator, isPlaceholder } from "../data/operators";
import { paths, type RouteMeta } from "../routes";
import { componentMath } from "./bonusCost";

export const offerPath = (o: Pick<WelcomeOffer, "id">) => `${paths.bonus}/${o.id}`;

export function operatorNameFor(o: WelcomeOffer) {
  const op = getOperator(o.operatorId);
  return isPlaceholder(op.name) ? o.operatorName : op.name;
}

export const findOffer = (id: string | undefined, includeDrafts = false) =>
  visibleOffers({ includeDrafts }).find((o) => o.id === id);

/** Sum of the wagering needed by all components of the offer (null when none has a requirement). */
export function offerVolume(o: WelcomeOffer) {
  const v = o.components.map((c) => componentMath(c).volume).filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
}

/** "scommesse" for offers chosen for sports betting, "casinò" for casino-only offers. */
export const offerKind = (o: WelcomeOffer) => (o.sections.includes("sport") ? "scommesse" : "casinò");

export function offerMeta(o: WelcomeOffer): RouteMeta {
  const name = operatorNameFor(o);
  const vol = offerVolume(o);
  // two published offers of the same operator and kind: add the offer's own name to tell them apart
  const twin = visibleOffers().some((x) => x.id !== o.id && x.operatorId === o.operatorId && offerKind(x) === offerKind(o));
  return {
    path: offerPath(o),
    title: `Bonus ${offerKind(o)} ${name}${twin ? ` (${o.title})` : ""}: condizioni e requisiti spiegati`,
    description:
      `Cosa comprende l'offerta di benvenuto ${name}, quanto bisogna giocare` +
      (vol !== null ? ` (fino a ${formatEuro(vol)} in totale)` : "") +
      ", quanto costa in media completare i requisiti e dove leggere i termini ufficiali.",
  };
}

/** Pre-render list: published offers only (never drafts). */
export const offerRoutes = () => visibleOffers().map(offerMeta);
