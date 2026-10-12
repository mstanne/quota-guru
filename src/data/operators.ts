/**
 * OPERATOR TEMPLATE DATA
 * ----------------------
 * Every operator-specific value shown on the site (name, logo, link, licence, offers) lives here.
 * Components never hard-code operator data: they receive `OperatorData` / `OfferData` objects as props.
 *
 * To add or replace an operator, fill in the fields below (or load the same shape from a JSON file / CMS / API).
 * Placeholder values use the [UPPER_SNAKE_CASE] convention so that missing data is obvious on screen.
 *
 * Logos: set `logoUrl` to an image path/URL. While it is `null`, a neutral box with the exact slot size
 * (e.g. [PLACEHOLDER_LOGO_48x48]) is rendered instead, so the layout never changes.
 */

/** A value not filled in yet, e.g. "[NOME_OPERATORE_1]". */
export type Placeholder = `[${string}]`;
export const isPlaceholder = (v: unknown): v is Placeholder => typeof v === "string" && /^\[[^\]]+\]$/.test(v.trim());

export interface OperatorData {
  /** Stable id used to link odds and offers to the operator (no spaces). */
  id: string;
  /** Display name, e.g. "Operatore Alfa". */
  name: string;
  /** 2–4 character abbreviation used where there is no room for the logo text. */
  shortName: string;
  /** Logo image URL (SVG/PNG, transparent background). `null` = layout placeholder. */
  logoUrl: string | null;
  logoAlt: string;
  /** Tracked outbound link (affiliate/referral URL). */
  affiliateUrl: string;
  /** Internal or external review page. */
  reviewUrl: string;
  /** ADM concession number, shown next to the operator. */
  admLicense: string;
  /** Editorial rating 0–5 (number) or placeholder. */
  rating: number | string;
  /** Short neutral description (no promotional claims). */
  description: string;
  minDeposit: string;
  withdrawalTime: string;
  paymentMethods: string[];
  features: string[];
  pros: string[];
  cons: string[];
  /** Capabilities used by the "Siti Scommesse" filters. */
  liveStreaming: boolean;
  cashOut: boolean;
}

export interface OfferData {
  id: string;
  /** References `OperatorData.id`. */
  operatorId: string;
  /** Offer category id (see `offerCategories`). */
  category: "welcome" | "no-deposit" | "free-bet" | "cashback";
  title: string;
  offerType: string;
  /** Headline amount, e.g. "€ 50". */
  amount: string;
  description: string;
  highlights: string[];
  terms: string[];
  minDeposit: string;
  wageringRequirement: string;
  promoCode: string | null;
  /** Link to the operator's full terms of the offer. */
  termsUrl: string;
  featured: boolean;
}

export const AFFILIATE_URL_PLACEHOLDER = "[URL_AFFILIAZIONE_OPERATORE]";

const placeholderOperator = (n: number, overrides: Partial<OperatorData> = {}): OperatorData => ({
  id: `operatore-${n}`,
  name: `[NOME_OPERATORE_${n}]`,
  shortName: `[OP${n}]`,
  logoUrl: null,
  logoAlt: `Logo [NOME_OPERATORE_${n}]`,
  affiliateUrl: AFFILIATE_URL_PLACEHOLDER,
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  admLicense: "[NUMERO_CONCESSIONE_ADM]",
  rating: "[VALUTAZIONE]",
  description: "[DESCRIZIONE_OPERATORE]",
  minDeposit: "[DEPOSITO_MINIMO]",
  withdrawalTime: "[TEMPI_PRELIEVO]",
  paymentMethods: ["[METODO_PAGAMENTO_1]", "[METODO_PAGAMENTO_2]", "[METODO_PAGAMENTO_3]", "[METODO_PAGAMENTO_4]"],
  features: ["[CARATTERISTICA_1]", "[CARATTERISTICA_2]", "[CARATTERISTICA_3]", "[CARATTERISTICA_4]"],
  pros: ["[PUNTO_DI_FORZA_1]", "[PUNTO_DI_FORZA_2]", "[PUNTO_DI_FORZA_3]"],
  cons: ["[PUNTO_DEBOLE_1]", "[PUNTO_DEBOLE_2]"],
  liveStreaming: true,
  cashOut: true,
  ...overrides,
});

/** Operators shown across the site (comparison tables, offers, bet slip). Order = display order. */
export const operators: OperatorData[] = [
  placeholderOperator(1),
  placeholderOperator(2, { liveStreaming: false }),
  placeholderOperator(3),
  placeholderOperator(4),
  placeholderOperator(5, { liveStreaming: false }),
  placeholderOperator(6, { liveStreaming: false }),
];

/** Operators used in odds comparison tables (subset, same order). */
export const oddsOperators = operators.slice(0, 5);

const placeholderOffer = (n: number, overrides: Partial<OfferData> = {}): OfferData => ({
  id: `offerta-${n}`,
  operatorId: `operatore-${n}`,
  category: "welcome",
  title: "[TITOLO_PROMO]",
  offerType: "[TIPO_OFFERTA]",
  amount: "[BONUS_BENVENUTO]",
  description: "[DESCRIZIONE_PROMO]",
  highlights: ["[PUNTO_SALIENTE_1]", "[PUNTO_SALIENTE_2]", "[PUNTO_SALIENTE_3]"],
  terms: ["[TERMINE_CONDIZIONE_1]", "[TERMINE_CONDIZIONE_2]", "[TERMINE_CONDIZIONE_3]"],
  minDeposit: "[DEPOSITO_MINIMO]",
  wageringRequirement: "[REQUISITI_SCOMMESSA]",
  promoCode: null,
  termsUrl: "[URL_TERMINI_OFFERTA]",
  featured: false,
  ...overrides,
});

export const offers: OfferData[] = [
  placeholderOffer(1, { featured: true, promoCode: "[CODICE_PROMO]" }),
  placeholderOffer(2, { featured: true }),
  placeholderOffer(3, { category: "free-bet" }),
  placeholderOffer(4, { category: "free-bet" }),
  placeholderOffer(5, { category: "free-bet" }),
  placeholderOffer(6),
];

export const offerCategories = [
  { id: "all", name: "Tutte le offerte" },
  { id: "welcome", name: "Benvenuto" },
  { id: "no-deposit", name: "Senza deposito" },
  { id: "free-bet", name: "Free bet" },
  { id: "cashback", name: "Cashback" },
] as const;

export function getOperator(id: string): OperatorData {
  return (
    operators.find((o) => o.id === id) ??
    placeholderOperator(0, { id, name: "[NOME_OPERATORE]", shortName: "[OP]", logoAlt: "Logo [NOME_OPERATORE]" })
  );
}

/** Responsible-gambling references for Italy (shown in footer, bonus page and guides). */
export const responsibleGambling = {
  helplineName: "Telefono Verde Nazionale per le problematiche legate al gioco d'azzardo",
  helplineOrg: "Istituto Superiore di Sanità",
  helplineNumber: "800 558 822",
  helplineHref: "tel:800558822",
  regulatorName: "Agenzia delle Dogane e dei Monopoli (ADM)",
  regulatorUrl: "https://www.adm.gov.it",
  /** Official ADM "gioco sicuro e responsabile" logo (allowed by D.L. 87/2018, art. 9). */
  admLogoUrl: null as string | null,
  minAge: 18,
};
