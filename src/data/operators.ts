/**
 * OPERATOR TEMPLATE DATA
 * ----------------------
 * Every operator-specific value shown on the site (name, logo, link, licence, offers) lives here.
 * Components never hard-code operator data: they receive `OperatorData` / `OfferData` objects as props.
 *
 * To add or replace an operator, fill in the fields below (or load the same shape from a JSON file / CMS / API).
 * Placeholder values use the [UPPER_SNAKE_CASE] convention so that missing data is obvious on screen.
 *
 * Logos: put the file in public/ (e.g. public/operators/eurobet.svg) and set `logoUrl` to its path relative to
 * public/ ("operators/eurobet.svg"): the site base path is added automatically. While it is `null`, a neutral box
 * with the exact slot size (e.g. [PLACEHOLDER_LOGO_48x48]) is rendered instead, so the layout never changes.
 *
 * Welcome offers are no longer here: see src/data/offers.ts and offers.json.
 */

/** A value not filled in yet, e.g. "[NOME_OPERATORE_1]". */
export type Placeholder = `[${string}]`;
export const isPlaceholder = (v: unknown): v is Placeholder => typeof v === "string" && /^\[[^\]]+\]$/.test(v.trim());

export interface OperatorData {
  /** Stable id used to link odds and offers to the operator (no spaces). Must match `operatorId` in offers.json. */
  id: string;
  /** Display name, e.g. "Operatore Alfa". */
  name: string;
  /** 2–4 character abbreviation used where there is no room for the logo text. */
  shortName: string;
  /** Logo path relative to public/ (or absolute URL). SVG/PNG, transparent background. `null` = layout placeholder. */
  logoUrl: string | null;
  logoAlt: string;
  /** Outbound link ("Vai al sito"): affiliate/referral URL or the operator's public site. */
  affiliateUrl: string;
  /** Internal or external review page. */
  reviewUrl: string;
  /** ADM concession number, shown next to the operator (check it on the official ADM list). */
  admLicense: string;
  /** Company holding the concession (from the operator's site footer), shown on the operator page. */
  company?: string;
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

const eurobet: OperatorData = {
  id: "eurobet",
  name: "Eurobet",
  shortName: "EB",
  logoUrl: "operators/Eurobet-logo-light.svg",
  logoAlt: "Logo Eurobet",
  affiliateUrl: "https://www.eurobet.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // From the footer of eurobet.it ("Eurobet Italia S.r.l. Unipersonale"), 24/10/2026: verify on the ADM list.
  admLicense: "GAD 16012",
  company: "Eurobet Italia S.r.l. Unipersonale",
  description:
    "Concessionario ADM gestito da Eurobet Italia S.r.l., con scommesse sportive pre-partita e live, casinò, slot, poker e bingo online.",
  minDeposit: "10 €",
  withdrawalTime: "24 ore",
  paymentMethods: [
    "Carte di credito/debito",
    "Postepay",
    "PayPal",
    "Skrill",
    "Neteller",
    "Apple Pay",
    "Ricarica Eurobet (voucher)",
    "Paysafecard",
    "Bollettino postale",
    "Bonifico bancario",
  ],
  features: [
    "Scommesse sportive pre-partita e live",
    "Streaming di eventi sportivi",
    "Cash out",
    "Casinò, slot, poker e bingo",
  ],
  pros: [
    "Deposito minimo di 10 €",
    "Tempo di prelievo indicato in 24 ore",
    "Dieci metodi di pagamento, tra cui PayPal, Postepay e Apple Pay",
  ],
  cons: [
    "Il bonus sport di benvenuto vale solo su multiple con almeno 5 eventi a quota 1,50",
    "I depositi con Skrill, Neteller e Paysafecard sono esclusi dall'offerta di benvenuto",
  ],
  liveStreaming: true,
  cashOut: true,
};

// Goldbet and Planetwin365 belong to the same group (same platform and offer structure).
// Payments: goldbet.it and planetwin365.it /guida/depositi and /guida/prelievi, 25/10/2026.
// liveStreaming is false until verified on the operator's site.
const goldbet: OperatorData = {
  id: "goldbet",
  name: "Goldbet",
  shortName: "GB",
  // Square "GB" mark (fits the square logo slots); full wordmark: operators/logo_goldbet-full.png
  logoUrl: "operators/logo_goldbet.png",
  logoAlt: "Logo Goldbet",
  affiliateUrl: "https://www.goldbet.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // From the footer of goldbet.it ("GBO Italy S.p.A."), 24/10/2026: verify on the ADM list.
  admLicense: "GAD 16009",
  company: "GBO Italy S.p.A.",
  description:
    "Concessionario ADM gestito da GBO Italy S.p.A., con scommesse sportive, casinò, casinò live, slot, poker, bingo, giochi di carte e lotterie online.",
  minDeposit: "10 € (carte, Postepay e PayPal)",
  withdrawalTime: "Entro 24 ore con PayPal, Skrill e Neteller; 24-48 ore lavorative con carta",
  paymentMethods: [
    "Carte di credito/debito",
    "Postepay",
    "PayPal",
    "Apple Pay",
    "Google Pay",
    "Skrill",
    "Neteller",
    "MuchBetter",
    "Paysafecard",
    "Ricarica nei punti vendita",
    "Bonifico bancario",
    "Bonifico e bollettino postale",
  ],
  features: ["Scommesse sportive", "Cash out", "Casinò, casinò live e slot", "Poker, bingo e lotterie"],
  pros: [
    "Prelievo con bonifico istantaneo, indicato come accreditato subito",
    "Nessuna spesa applicata dall'operatore su depositi e prelievi",
    "Ricarica anche in contanti nei punti vendita",
  ],
  cons: [
    "Deposito minimo di 30 € con Skrill, Neteller, Rapid Transfer e Paysafecard",
    "Le vincite da bonus e promozioni possono essere pagate solo con bonifico bancario",
  ],
  liveStreaming: false,
  cashOut: true,
};

const planetwin365: OperatorData = {
  id: "planetwin365",
  name: "Planetwin365",
  shortName: "PW",
  logoUrl: "operators/logo-planetwin-yellow.svg",
  logoAlt: "Logo Planetwin365",
  affiliateUrl: "https://www.planetwin365.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // From the footer of planetwin365.it ("PWO S.p.A."), 24/10/2026: verify on the ADM list.
  admLicense: "GAD 16007",
  company: "PWO S.p.A.",
  description:
    "Concessionario ADM gestito da PWO S.p.A., con scommesse sportive, casinò, casinò live, slot, poker, bingo, giochi di carte e lotterie online, e una rete di punti vendita.",
  minDeposit: "10 € (carte, Postepay e PayPal)",
  withdrawalTime: "Entro 24 ore con PayPal, Skrill e Neteller; 24-48 ore lavorative con carta",
  paymentMethods: [
    "Carte di credito/debito",
    "Postepay",
    "PayPal",
    "Apple Pay",
    "Google Pay",
    "Skrill",
    "Neteller",
    "MuchBetter",
    "Paysafecard",
    "Ricarica nei punti vendita",
    "Bonifico bancario",
    "Bonifico e bollettino postale",
  ],
  features: ["Scommesse sportive", "Cash out", "Casinò, casinò live e slot", "Punti vendita sul territorio"],
  pros: [
    "Prelievo con bonifico istantaneo, indicato come accreditato subito",
    "Nessuna spesa applicata dall'operatore su depositi e prelievi",
    "Ricarica anche in contanti nei punti vendita",
  ],
  cons: [
    "Deposito minimo di 30 € con Skrill, Neteller, Rapid Transfer e Paysafecard",
    "Le vincite da bonus e promozioni possono essere pagate solo con bonifico bancario",
  ],
  // "le emozioni della diretta streaming" on planetwin365.it/app/sport, 31/10/2026
  liveStreaming: true,
  cashOut: true,
};

// Data from help.bet365.it (deposit and withdrawal methods) and the footer of bet365.it, 24/10/2026.
// The welcome offer is shown only to logged-in users, so it is not in offers.json.
const bet365: OperatorData = {
  id: "bet365",
  name: "bet365",
  shortName: "B365",
  logoUrl: "operators/bet365_Logo_Inline.svg",
  logoAlt: "Logo bet365",
  affiliateUrl: "https://www.bet365.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "Hillside (New Media Malta) Plc ... Concessione n° 16030": verify on the ADM list.
  admLicense: "16030",
  company: "Hillside (New Media Malta) Plc",
  description:
    "Concessionario ADM gestito da Hillside (New Media Malta) Plc, con scommesse sportive pre-partita e live e casinò online.",
  minDeposit: "5 €",
  withdrawalTime: "1-4 ore (carta o bonifico)",
  paymentMethods: [
    "Carte di debito",
    "Carte di credito",
    "Apple Pay",
    "Google Pay",
    "PayPal",
    "Voucher prepagati",
    "Skrill",
    "Neteller",
    "Bonifico bancario",
  ],
  features: ["Scommesse sportive pre-partita e live", "Cash out", "Bet Builder", "Casinò"],
  pros: [
    "Deposito minimo di 5 €",
    "Prelievo su carta o bonifico indicato in 1-4 ore",
    "Nove metodi di pagamento, tra cui PayPal, Apple Pay e Google Pay",
  ],
  cons: ["L'offerta di benvenuto è visibile solo dopo l'accesso al sito"],
  liveStreaming: false,
  cashOut: true,
};

// Betsson, bwin and Sisal: data from the footers, promotions and help pages of the official sites, 25/10/2026.
// Betsson's payment pages need a login: deposit, withdrawal and payment fields stay to be filled in.
const betsson: OperatorData = {
  id: "betsson",
  name: "Betsson",
  shortName: "BS",
  logoUrl: "operators/betsson-logo-white.svg",
  logoAlt: "Logo Betsson",
  affiliateUrl: "https://www.betsson.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "Azzurri Ltd ... Titolare della concessione GAD 16027" (footer of betsson.it): verify on the ADM list.
  admLicense: "GAD 16027",
  company: "Azzurri Ltd",
  description:
    "Concessionario ADM gestito da Azzurri Ltd (Malta), con scommesse sportive pre-partita e live, virtuali, casinò, casinò live, giochi di carte, bingo e ippica.",
  minDeposit: "[DEPOSITO_MINIMO]",
  withdrawalTime: "[TEMPI_PRELIEVO]",
  paymentMethods: ["[METODO_PAGAMENTO_1]", "[METODO_PAGAMENTO_2]", "[METODO_PAGAMENTO_3]", "[METODO_PAGAMENTO_4]"],
  features: ["Scommesse sportive pre-partita e live", "Cash out", "Virtuali e ippica", "Casinò, casinò live, carte e bingo"],
  pros: [
    "Offerta di benvenuto sport attivabile con un primo deposito da 5 €",
    "Le vincite ottenute con il real bonus sport vanno nel saldo prelevabile",
  ],
  cons: [
    "Skrill e Neteller sono esclusi dalle offerte di benvenuto",
    "Il real bonus sport non vale su scommesse live, sistemi e bet builder",
  ],
  liveStreaming: false,
  cashOut: true,
};

const bwin: OperatorData = {
  id: "bwin",
  name: "bwin",
  shortName: "BW",
  logoUrl: "operators/bwin-logo-white.svg",
  logoAlt: "Logo bwin",
  affiliateUrl: "https://www.bwin.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "bwin è una piattaforma di gaming online di Eurobet Italia srl unipersonale concessione GAD 16013 (ex 15026)".
  admLicense: "GAD 16013",
  company: "Eurobet Italia S.r.l. Unipersonale",
  description:
    "Piattaforma di gioco online di Eurobet Italia S.r.l. (concessione distinta da quella di Eurobet), con scommesse sportive, casinò, poker, bingo e giochi di carte.",
  minDeposit: "10 € (Postepay)",
  withdrawalTime: "PayPal entro 12 ore; Postepay e bonifico 3-5 giorni lavorativi",
  paymentMethods: [
    "Visa",
    "Mastercard",
    "Maestro",
    "Postepay",
    "Apple Pay",
    "PayPal",
    "Paysafecard",
    "Voucher epay",
    "Mooney",
    "Revolut e Hype",
    "Bonifico bancario (solo prelievi)",
  ],
  features: ["Scommesse sportive", "Cash out", "Casinò e slot", "Poker, bingo e giochi di carte"],
  pros: [
    "Prelievo con PayPal indicato entro 12 ore",
    "Undici metodi di pagamento, tra cui PayPal, Postepay e Apple Pay",
  ],
  cons: [
    "Il primo deposito valido per il bonus di benvenuto è solo con Visa, Mastercard, Postepay o Apple Pay",
    "Il bonus scommesse di benvenuto viene accreditato 33 giorni dopo la registrazione",
  ],
  liveStreaming: false,
  cashOut: true,
};

const sisal: OperatorData = {
  id: "sisal",
  name: "Sisal",
  shortName: "SI",
  // Official logo, wordmark turned white for the dark background (colour mark: operators/sisal-mark.svg).
  logoUrl: "operators/sisal-logo-white.png",
  logoAlt: "Logo Sisal",
  affiliateUrl: "https://www.sisal.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "Sisal Italia S.p.A. - Via Ugo Bassi 6, 20159 Milano - Conc. GAD: 16020" (footer of sisal.it).
  admLicense: "GAD 16020",
  company: "Sisal Italia S.p.A.",
  description:
    "Concessionario ADM gestito da Sisal Italia S.p.A., con scommesse sportive, lotterie, casinò, casinò live, poker, giochi di carte, bingo e una rete di punti vendita.",
  minDeposit: "10 € (1 € nei punti vendita)",
  withdrawalTime: "Generalmente immediato con carta, PayPal, Skrill e Neteller; bonifico 1-2 giorni lavorativi",
  paymentMethods: [
    "Visa",
    "Mastercard",
    "Postepay",
    "Apple Pay",
    "PayPal",
    "Skrill",
    "Neteller",
    "Paysafecard",
    "MyBank",
    "Bonifico bancario",
    "Ricarica nei punti vendita e istituti di pagamento",
  ],
  features: ["Scommesse sportive e live", "Lotterie", "Casinò, casinò live e slot", "Poker, carte e bingo"],
  pros: [
    "Prelievi gratuiti, generalmente immediati con carta, PayPal, Skrill e Neteller",
    "Ricarica anche in contanti nei punti vendita, da 1 €",
  ],
  cons: [
    "Il bonifico bancario non vale come primo deposito per le offerte di benvenuto",
    "Il bonus di benvenuto scelto alla registrazione non può essere cambiato",
  ],
  liveStreaming: false,
  cashOut: false,
};

// Codere, 888, AdmiralBet, LeoVegas and Lottomatica: footers, payment and promotion pages of the official sites,
// read on 29/10/2026. Logos are not in public/operators yet (layout placeholder until added).
const codere: OperatorData = {
  id: "codere",
  name: "Codere",
  shortName: "CO",
  logoUrl: "operators/codere.png",
  logoAlt: "Logo Codere",
  affiliateUrl: "https://www.codere.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "Codere.it s.r.l. - C.F. 14678721003 - P. IVA 16338101005 Conc. GAD 16018" (footer of codere.it)
  admLicense: "GAD 16018",
  company: "Codere.it S.r.l.",
  description:
    "Concessionario ADM gestito da Codere.it S.r.l., con scommesse sportive pre-partita e live, virtuali, ippica, slot, casinò live, poker, bingo, giochi di carte e lotterie.",
  minDeposit: "[DEPOSITO_MINIMO]",
  withdrawalTime: "PayPal 12-24 ore; carta e bonifico 1-3 giorni; Skrill immediato",
  paymentMethods: ["Carte di credito (Visa, Mastercard, Maestro)", "PayPal", "Skrill", "Scratch card", "Bonifico bancario o postale"],
  features: ["Scommesse sportive pre-partita e live", "Virtuali e ippica", "Slot e casinò live", "Poker, bingo e lotterie"],
  pros: ["Prelievo con Skrill indicato come immediato", "Prelievo anche con bonifico domiciliato e voucher"],
  cons: ["Cinque metodi di deposito, senza Postepay né Apple Pay", "Skrill escluso dall'offerta di benvenuto casinò"],
  liveStreaming: false,
  cashOut: true,
};

const eight88: OperatorData = {
  id: "888",
  name: "888",
  shortName: "888",
  logoUrl: "operators/888_logo.svg",
  logoAlt: "Logo 888",
  affiliateUrl: "https://sport.888casino.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "888 Italia Limited, società titolare della concessione ... n. 16045" (footer of sport.888casino.it)
  admLicense: "16045",
  company: "888 Italia Limited",
  description:
    "Concessionario ADM gestito da 888 Italia Limited (Malta, gruppo Evoke), con scommesse sportive (888sport), casinò, casinò live e poker.",
  minDeposit: "[DEPOSITO_MINIMO]",
  withdrawalTime: "Elaborazione entro 24 ore lavorative; PayPal, Skrill e bonifico rapido in giornata",
  paymentMethods: ["Visa", "Mastercard", "Apple Pay", "PayPal", "Skrill", "Neteller", "Bonifico rapido", "Paysafecard (solo depositi)"],
  features: ["Scommesse sportive pre-partita e live", "Streaming di eventi sportivi", "Casinò e casinò live", "Poker"],
  pros: ["Prelievo con PayPal, Skrill e bonifico rapido indicato in giornata", "Servizi di prelievo senza costi"],
  cons: ["Nessuna offerta di benvenuto per le scommesse sportive al 29/10/2026", "Neteller, Skrill e OnShop esclusi dal bonus sulla prima ricarica"],
  liveStreaming: true,
  cashOut: false,
};

const admiralbet: OperatorData = {
  id: "admiralbet",
  name: "AdmiralBet",
  shortName: "AB",
  logoUrl: "operators/admiralbet_logo-white.svg",
  logoAlt: "Logo AdmiralBet",
  affiliateUrl: "https://www.admiralbet.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "Admiral Bet S.r.l., titolare della concessione GAD n. 16048" (footer of admiralbet.it)
  admLicense: "GAD 16048",
  company: "Admiral Bet S.r.l.",
  description:
    "Concessionario ADM gestito da Admiral Bet S.r.l. (gruppo Novomatic), con scommesse sportive, virtuali, ippica, slot, casinò, casinò live, poker, bingo e lotterie, e una rete di punti vendita.",
  minDeposit: "5 € con la maggior parte dei metodi",
  withdrawalTime: "2-5 giorni lavorativi secondo la tabella dell'operatore",
  paymentMethods: ["Visa", "Mastercard", "Postepay", "PayPal", "Skrill", "Neteller", "Paysafecard", "Bonifico bancario"],
  features: ["Scommesse sportive", "Virtuali e ippica", "Slot Novomatic, casinò e casinò live", "Poker, bingo e lotterie"],
  pros: ["Deposito minimo di 5 € con la maggior parte dei metodi", "Nessuna commissione sui prelievi"],
  cons: ["Skrill escluso dall'offerta di benvenuto scommesse", "Prelievo massimo di 1.000 € con carta e Postepay"],
  liveStreaming: false,
  cashOut: true,
};

const leovegas: OperatorData = {
  id: "leovegas",
  name: "LeoVegas",
  shortName: "LV",
  logoUrl: "operators/leovegas_logo.svg",
  logoAlt: "Logo LeoVegas",
  affiliateUrl: "https://www.leovegas.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "LeoVegas Gaming Plc (P.IVA MT28686627) ... concessione numero 16019" (footer of leovegas.it)
  admLicense: "16019",
  company: "LeoVegas Gaming Plc",
  description:
    "Concessionario ADM gestito da LeoVegas Gaming Plc (Malta), con casinò, casinò live e scommesse sportive.",
  minDeposit: "[DEPOSITO_MINIMO]",
  withdrawalTime: "[TEMPI_PRELIEVO]",
  paymentMethods: ["Visa", "Mastercard", "Postepay", "PayPal", "Apple Pay", "Google Pay"],
  features: ["Scommesse sportive e live", "Casinò e slot", "Casinò live", "App"],
  pros: ["Offerte di benvenuto distinte per casinò e casinò live", "Assistenza in italiano via chat ed email"],
  cons: ["Nessuna offerta di benvenuto per le scommesse sportive al 29/10/2026"],
  liveStreaming: false,
  cashOut: false,
};

const lottomatica: OperatorData = {
  id: "lottomatica",
  name: "Lottomatica",
  shortName: "LO",
  // Official wordmark turned white for the dark background (original colour: operators/lottomatica-logo.webp).
  logoUrl: "operators/lottomatica-logo-white.png",
  logoAlt: "Logo Lottomatica",
  affiliateUrl: "https://www.lottomatica.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "Concessione GAD n° 16010. GBO Italy S.p.A." (footer of lottomatica.it); same company as Goldbet, separate concession.
  admLicense: "GAD 16010",
  company: "GBO Italy S.p.A.",
  description:
    "Concessionario ADM gestito da GBO Italy S.p.A. (concessione distinta da quella di Goldbet), con scommesse sportive, lotterie, casinò, casinò live, poker, bingo, giochi di carte e una rete di punti vendita.",
  minDeposit: "10 € (carte, Apple Pay, Google Pay, Postepay e PayPal)",
  withdrawalTime: "Entro 24 ore con PayPal, Skrill e Neteller; 24-48 ore lavorative con carta; bonifico istantaneo immediato",
  paymentMethods: [
    "Carte di credito/debito",
    "Postepay",
    "PayPal",
    "Apple Pay",
    "Google Pay",
    "Skrill",
    "Neteller",
    "MuchBetter",
    "Paysafecard",
    "Ricarica nei punti vendita",
    "Bonifico bancario e postale",
    "Bollettino postale",
  ],
  features: ["Scommesse sportive", "Lotterie", "Casinò, casinò live e slot", "Poker, bingo e giochi di carte"],
  pros: ["Prelievo con bonifico istantaneo e Quick2Cash indicato come immediato", "Nessuna spesa applicata dall'operatore su depositi e prelievi"],
  cons: [
    "Deposito minimo di 30 € con Skrill, Neteller, Rapid Transfer e Paysafecard",
    "Le vincite da bonus e promozioni possono essere pagate solo con bonifico bancario",
  ],
  liveStreaming: false,
  cashOut: true,
};

// Snai: footer, contacts, app and bonus pages of snai.it, 31/10/2026.
const snai: OperatorData = {
  id: "snai",
  name: "Snai",
  shortName: "SN",
  logoUrl: "operators/logo_snai.png",
  logoAlt: "Logo Snai",
  affiliateUrl: "https://www.snai.it",
  reviewUrl: "[URL_RECENSIONE_OPERATORE]",
  // "Snaitech S.p.a. - Socio Unico ... CONCESSIONE N°16032" (footer of snai.it): verify on the ADM list.
  admLicense: "16032",
  company: "Snaitech S.p.A.",
  description:
    "Concessionario ADM gestito da Snaitech S.p.A., con scommesse sportive pre-partita e live, ippica, virtuali, slot, casinò, casinò live, poker, giochi di carte, lotterie e bingo, e una rete di punti vendita.",
  // snai.it/faq/ricariche and snai.it/faq/prelievi, 31/10/2026
  minDeposit: "10 € online (1 € nei punti vendita)",
  withdrawalTime:
    "Generalmente immediato con carta, Apple Pay, PayPal, Skrill, Neteller e bonifico istantaneo; bonifico 1-2 giorni lavorativi",
  paymentMethods: [
    "Visa",
    "Mastercard",
    "Postepay",
    "Apple Pay",
    "PayPal",
    "Skrill",
    "Neteller",
    "Paysafecard (solo depositi)",
    "MyBank (solo depositi)",
    "Bonifico bancario e istantaneo",
    "Punti vendita Snai",
    "Istituti di pagamento",
  ],
  features: [
    "Scommesse sportive pre-partita e live",
    "Cash out",
    "Ippica e virtuali",
    "Casinò, casinò live e slot",
    "Poker, carte, lotterie e bingo",
  ],
  pros: [
    "Prelievi senza commissioni con tutti i metodi",
    "Prelievi generalmente immediati con carta, PayPal, Skrill, Neteller e bonifico istantaneo",
    "Live chat con un operatore tutti i giorni dalle 9 alle 24, assistente automatico 24 ore su 24",
  ],
  cons: [
    "Il bonus sport di benvenuto vale solo su multiple con almeno 3 eventi a quota 1,50 ed è erogato in 5 tranche settimanali",
    "Paysafecard e MyBank non sono disponibili per i prelievi",
  ],
  liveStreaming: false,
  cashOut: true,
};

/** Operators shown across the site (comparison tables, offers, bet slip). Order = display order. */
export const operators: OperatorData[] = [
  eurobet,
  goldbet,
  planetwin365,
  bet365,
  betsson,
  bwin,
  sisal,
  snai,
  lottomatica,
  admiralbet,
  codere,
  eight88,
  leovegas,
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

/** Legacy placeholder offers, still used by the home block and the Siti Scommesse page. */
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
  /** Official ADM logo, path relative to public/ (null hides it). */
  admLogoUrl: "adm/logo-adm.png" as string | null,
  /** "Gioca responsabile +18" badge, path relative to public/ (null shows a plain "18+" mark instead). */
  responsibleBadgeUrl: "adm/gioca-responsabile-18.png" as string | null,
  minAge: 18,
};
