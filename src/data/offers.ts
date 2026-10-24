/**
 * WELCOME OFFERS (offerte di benvenuto)
 * -------------------------------------
 * Data lives in ./offers.json. It is prepared by the offers agent (see scripts/offers-agent/ISTRUZIONI.md)
 * from the operators' own terms pages and enters as `status: "bozza"`. Only offers that an editor has
 * set to `"approvata"` are shown on the public site; drafts are visible only in `npm run dev`.
 *
 * Structure: one offer = what the user selects at sign-up (e.g. "Bonus Benvenuto Sport").
 * An offer is made of components, each tied to a product: the "sport" offer of many operators also
 * contains a slot/casino bonus, and the page shows it as such instead of repeating the headline total.
 *
 * Validation: scripts/check-offers.mjs (runs before every build).
 */
import raw from "./offers.json";

/** Products an offer component can apply to. Slot bonuses count as "casino". */
export type OfferProduct = "sport" | "casino" | "lotterie" | "poker" | "bingo" | "ippica" | "virtual";

export interface ProductSection {
  id: OfferProduct;
  label: string;
  /** Short neutral intro shown under the section title. */
  intro: string;
  /** false = kept in the schema and in the data, not shown on the site. */
  visible: boolean;
}

/** Sections of the /bonus page, in display order. */
export const productSections: ProductSection[] = [
  {
    id: "sport",
    label: "Scommesse sportive",
    intro: "Offerte che si scelgono in fase di registrazione per le scommesse sportive.",
    visible: true,
  },
  {
    id: "casino",
    label: "Casinò e slot",
    intro: "Offerte per casinò e slot. Hanno in genere requisiti di giocata più alti e scadenze più brevi.",
    visible: true,
  },
  {
    id: "lotterie",
    label: "Lotterie",
    intro: "Offerte per le lotterie.",
    visible: false,
  },
];

export const productLabels: Record<OfferProduct, string> = {
  sport: "Scommesse sportive",
  casino: "Casinò e slot",
  lotterie: "Lotterie",
  poker: "Poker",
  bingo: "Bingo",
  ippica: "Ippica",
  virtual: "Virtual",
};

export type ComponentKind = "bonus-deposito" | "senza-deposito" | "rimborso" | "bonus-real";

export const componentKindLabels: Record<ComponentKind, string> = {
  "bonus-deposito": "Bonus sul primo deposito",
  "senza-deposito": "Bonus senza deposito",
  rimborso: "Rimborso",
  "bonus-real": "Bonus real",
};

export interface OfferComponent {
  id: string;
  product: OfferProduct;
  kind: ComponentKind;
  /** Percentage of the first deposit (e.g. 25 = 25%), null when not deposit-based. */
  percent: number | null;
  /** Maximum amount in euro. */
  maxAmount: number;
  /** Maximum amount that can become withdrawable/real bonus, when the terms set one. */
  maxConvertible: number | null;
  /** Wagering requirement in times the bonus (e.g. 5 = 5x), null if none. */
  wagering: number | null;
  /** Days to complete the wagering requirement. */
  wageringDays: number | null;
  /** Days the bonus can be used after it is credited. */
  validityDays: number | null;
  /** Minimum number of events per bet slip (sport). */
  minEvents: number | null;
  /** Minimum odds per event (sport). */
  minOddsPerEvent: number | null;
  /** Where it can be used, in neutral words: "Multiple con almeno 5 eventi", "Slot del provider Inspired". */
  usableOn: string;
  /** Other conditions worth knowing (exclusions, tranches...). Factual, no promotional wording. */
  notes: string[];
}

export type OfferStatus = "bozza" | "approvata" | "ritirata";

export interface WelcomeOffer {
  id: string;
  /** References OperatorData.id (src/data/operators.ts). */
  operatorId: string;
  /** Operator name, used while the operator entry in operators.ts is still a placeholder. */
  operatorName: string;
  /** Sections where the offer is listed (an operator's combined offer can appear in more than one). */
  sections: OfferProduct[];
  /** Name of the offer on the operator's site, e.g. "Bonus Benvenuto Sport". */
  title: string;
  /** "Fino a X €" total as advertised by the operator (sum of all components), null if not stated. */
  advertisedTotal: number | null;
  minDeposit: number | null;
  /** First deposit must be made within N days of registration. */
  depositWithinDays: number | null;
  /** Conditions common to all components (ID verification, one offer per household...). */
  requirements: string[];
  excludedPaymentMethods: string[];
  /** ISO dates (YYYY-MM-DD), null when not stated by the operator. */
  validFrom: string | null;
  validUntil: string | null;
  /** Page the data was read from. */
  sourceUrl: string;
  /** Page with the offer's full terms (often the same as sourceUrl). */
  termsUrl: string;
  /** ISO date of the last check against the source. */
  verifiedAt: string;
  status: OfferStatus;
  /** One or two neutral sentences written by the editor (no invitation to play). */
  description: string;
  /** Inconsistencies found in the operator's own pages: to resolve before approving. Never shown publicly. */
  issues: string[];
  components: OfferComponent[];
}

interface OffersFile {
  updatedAt: string;
  offers: WelcomeOffer[];
}

const data = raw as unknown as OffersFile;

export const offersUpdatedAt = data.updatedAt;
export const allOffers: WelcomeOffer[] = data.offers;

/** An approved offer must have been checked against the source within this many days. */
export const MAX_VERIFICATION_AGE_DAYS = 14;

const DAY = 24 * 60 * 60 * 1000;
const endOfDay = (iso: string) => new Date(`${iso}T23:59:59+01:00`).getTime();

export const isExpired = (o: WelcomeOffer, now = Date.now()) => o.validUntil !== null && endOfDay(o.validUntil) < now;
export const isStale = (o: WelcomeOffer, now = Date.now()) =>
  now - new Date(`${o.verifiedAt}T00:00:00+01:00`).getTime() > MAX_VERIFICATION_AGE_DAYS * DAY;

/** Offers shown on the site: approved, not expired, recently verified. Drafts too when `includeDrafts`. */
export function visibleOffers({ includeDrafts = false, now = Date.now() } = {}): WelcomeOffer[] {
  return allOffers.filter((o) => {
    if (isExpired(o, now)) return false;
    if (o.status === "approvata") return !isStale(o, now);
    return includeDrafts && o.status === "bozza";
  });
}

/** Offers listed in a section. */
export const offersInSection = (offers: WelcomeOffer[], section: OfferProduct) =>
  offers.filter((o) => o.sections.includes(section));

/** Sum of the maximum amounts of the components for one product. */
export const amountFor = (o: WelcomeOffer, product: OfferProduct) =>
  o.components.filter((c) => c.product === product).reduce((sum, c) => sum + c.maxAmount, 0);

/** "2.150 €", "537,50 €" – always with the thousands separator (it-IT omits it on 4-digit numbers). */
export function formatEuro(n: number) {
  const [int, dec] = n.toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped}${dec === "00" ? "" : `,${dec}`} €`;
}

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T12:00:00`));
