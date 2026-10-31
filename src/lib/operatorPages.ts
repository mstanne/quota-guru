/**
 * One page per operator: /siti-scommesse/<operator id> ("scheda operatore").
 * Factual profile built only from src/data/operators.ts and offers.json: no ratings, no ranking, no outbound
 * call to action. Operators still to be filled in ([NOME_OPERATORE_n]) get no page.
 */
import { isPlaceholder, operators, type OperatorData } from "../data/operators";
import { amountFor, formatEuro, visibleOffers, type WelcomeOffer } from "../data/offers";
import { paths, type RouteMeta } from "../routes";

export const operatorPath = (o: Pick<OperatorData, "id">) => `${paths.sitiScommesse}/${o.id}`;

export const publishedOperators = () => operators.filter((o) => !isPlaceholder(o.name));

export const findOperator = (id?: string) => publishedOperators().find((o) => o.id === id);

/** The operator's offers currently shown on the site, sport first. */
export function offersOfOperator(id: string, includeDrafts = false): WelcomeOffer[] {
  return visibleOffers({ includeDrafts })
    .filter((o) => o.operatorId === id)
    .sort((a, b) => Number(b.sections.includes("sport")) - Number(a.sections.includes("sport")));
}

/** "www.planetwin365.it" from the operator's public URL (null while it is a placeholder). */
export function operatorSite(o: OperatorData) {
  if (isPlaceholder(o.affiliateUrl)) return null;
  try {
    const u = new URL(o.affiliateUrl);
    return { host: u.hostname, href: `${u.protocol}//${u.hostname}` };
  } catch {
    return null;
  }
}

export function operatorMeta(o: OperatorData): RouteMeta {
  const sport = offersOfOperator(o.id).find((x) => x.sections.includes("sport"));
  const bonus = sport ? `, offerta di benvenuto sport fino a ${formatEuro(amountFor(sport, "sport"))}` : "";
  return {
    path: operatorPath(o),
    title: `${o.name}: scommesse, pagamenti, prelievi e bonus`,
    description: `Scheda di ${o.name}${isPlaceholder(o.admLicense) ? "" : ` (concessione ADM ${o.admLicense})`}: prodotti, metodi di deposito e prelievo${bonus}, con le condizioni spiegate.`,
  };
}

export const operatorRoutes = () => publishedOperators().map(operatorMeta);
