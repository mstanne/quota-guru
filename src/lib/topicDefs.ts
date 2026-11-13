/**
 * Slugs, names and texts of the thematic pages under /siti-scommesse (no operator data: imported by the header menu,
 * which is in every page's main bundle). The data logic is in topicPages.ts.
 */
import { paths } from "../routes";

// ---------- payment methods ----------

export type MethodId =
  | "paypal"
  | "postepay"
  | "carte"
  | "visa"
  | "mastercard"
  | "maestro"
  | "american-express"
  | "apple-pay"
  | "google-pay"
  | "skrill"
  | "neteller"
  | "muchbetter"
  | "paysafecard"
  | "bonifico"
  | "mybank"
  | "bancoposta"
  | "klarna"
  | "bitcoin";

export interface PaymentMethodInfo {
  id: MethodId;
  slug: string;
  name: string;
  /** Matches the method as written in the operator's list and in the per-method tables. */
  match: RegExp;
  /** Matches the same method in an offer's excludedPaymentMethods. */
  excluded: RegExp;
  /** What the method is, one or two neutral sentences. */
  about: string;
  /** Column in the table of the "Metodi di pagamento" page (card circuits are covered by "Carte"). */
  hub: boolean;
  /** Card circuit page: operators that write only "carte di credito" are listed apart, circuit not stated. */
  circuit?: boolean;
}

export const paymentMethods: PaymentMethodInfo[] = [
  {
    id: "paypal",
    slug: "paypal",
    name: "PayPal",
    match: /paypal/i,
    excluded: /paypal/i,
    hub: true,
    about:
      "PayPal è un portafoglio elettronico: si collega una carta o un conto e si paga con email e password, senza inserire i dati della carta sul sito dell'operatore. Il conto PayPal deve essere intestato alla stessa persona del conto di gioco.",
  },
  {
    id: "postepay",
    slug: "postepay",
    name: "Postepay",
    match: /postepay/i,
    excluded: /postepay/i,
    hub: true,
    about:
      "Postepay è la carta prepagata di Poste Italiane (anche nella versione Evolution con IBAN). Sui siti di scommesse si usa come una normale carta di pagamento, con la conferma nell'app.",
  },
  {
    id: "carte",
    slug: "carte-di-credito",
    name: "Carte di credito e debito",
    match: /visa|mastercard|maestro|cart[ae] (di (credito|debito)|bancari|prepagat)/i,
    excluded: /^cart[ae]\b|visa|mastercard/i,
    hub: true,
    about:
      "Carte di credito, di debito e prepagate dei circuiti Visa e Mastercard (e le Maestro ancora in corso di validità). Il deposito è accreditato subito; il prelievo sulla carta richiede in genere più tempo dei portafogli elettronici.",
  },
  {
    id: "visa",
    slug: "visa",
    name: "Visa",
    match: /visa/i,
    excluded: /^cart[ae]\b|visa/i,
    hub: false,
    circuit: true,
    about:
      "Visa è un circuito di pagamento: la carta la emette la tua banca o un istituto di pagamento, Visa gestisce la rete che collega carta e operatore. Sui siti di scommesse si usano carte Visa di debito, prepagate e di credito.",
  },
  {
    id: "mastercard",
    slug: "mastercard",
    name: "Mastercard",
    match: /mastercard/i,
    excluded: /^cart[ae]\b|mastercard/i,
    hub: false,
    circuit: true,
    about:
      "Mastercard è un circuito di pagamento: la carta la emette la tua banca o un istituto di pagamento. Dal 2023 le nuove carte di debito che sostituiscono le Maestro sono Debit Mastercard, quindi è il circuito di molte carte collegate al conto corrente.",
  },
  {
    id: "maestro",
    slug: "maestro",
    name: "Maestro",
    match: /maestro/i,
    excluded: /maestro/i,
    hub: false,
    circuit: true,
    about:
      "Maestro era il circuito delle carte di debito di Mastercard. Dal 1° luglio 2023 in Europa non si emettono più carte Maestro: quelle già emesse funzionano fino alla scadenza, poi la banca le sostituisce con una Debit Mastercard.",
  },
  {
    id: "american-express",
    slug: "american-express",
    name: "American Express",
    match: /american express|amex/i,
    excluded: /american express|amex/i,
    hub: false,
    about:
      "American Express è insieme circuito ed emittente delle proprie carte di credito. Nessuno degli operatori che confrontiamo la indica tra i metodi accettati nelle pagine di pagamento che abbiamo verificato.",
  },
  {
    id: "apple-pay",
    slug: "apple-pay",
    name: "Apple Pay",
    match: /apple pay/i,
    excluded: /apple pay/i,
    hub: true,
    about:
      "Apple Pay usa una carta salvata nel Wallet di iPhone, iPad o Mac: il pagamento si conferma con Face ID o Touch ID e l'operatore non riceve il numero della carta.",
  },
  {
    id: "google-pay",
    slug: "google-pay",
    name: "Google Pay",
    match: /google pay/i,
    excluded: /google pay/i,
    hub: true,
    about:
      "Google Pay usa una carta salvata nel portafoglio Google dello smartphone Android: il pagamento si conferma con lo sblocco del telefono, senza inserire i dati della carta.",
  },
  {
    id: "skrill",
    slug: "skrill",
    name: "Skrill",
    match: /skrill/i,
    excluded: /skrill/i,
    hub: true,
    about:
      "Skrill è un portafoglio elettronico del gruppo Paysafe, diffuso nel gioco online. Molti operatori lo escludono dalle offerte di benvenuto: conviene controllarlo prima del primo deposito.",
  },
  {
    id: "neteller",
    slug: "neteller",
    name: "Neteller",
    match: /neteller/i,
    excluded: /neteller/i,
    hub: true,
    about:
      "Neteller è un portafoglio elettronico dello stesso gruppo di Skrill (Paysafe), con un conto separato. Come Skrill, è spesso escluso dalle offerte di benvenuto.",
  },
  {
    id: "muchbetter",
    slug: "muchbetter",
    name: "MuchBetter",
    match: /muchbetter/i,
    excluded: /muchbetter/i,
    hub: true,
    about:
      "MuchBetter è un portafoglio elettronico che si usa dall'app sullo smartphone. Si ricarica con carta, bonifico o con un voucher comprato in contanti nei negozi convenzionati.",
  },
  {
    id: "paysafecard",
    slug: "paysafecard",
    name: "Paysafecard",
    match: /paysafe/i,
    excluded: /paysafe/i,
    hub: true,
    about:
      "Paysafecard è un credito prepagato con un codice PIN di 16 cifre, che si compra in tabaccherie e ricevitorie. Serve quasi sempre solo per depositare: per prelevare va usato un altro metodo.",
  },
  {
    id: "bonifico",
    slug: "bonifico-bancario",
    name: "Bonifico bancario",
    match: /bonifico/i,
    excluded: /bonifico|movimentazione bancaria/i,
    hub: true,
    about:
      "Il bonifico parte dal conto corrente in banca o in posta. Il bonifico istantaneo arriva in pochi secondi e per legge non può costare più di quello ordinario, che richiede uno o più giorni lavorativi.",
  },
  {
    id: "mybank",
    slug: "mybank",
    name: "MyBank",
    match: /mybank/i,
    excluded: /mybank/i,
    hub: true,
    about:
      "MyBank permette di pagare con un bonifico immediato direttamente dal proprio home banking: dal sito dell'operatore si sceglie la banca, si accede e si conferma un bonifico già compilato.",
  },
  {
    id: "bancoposta",
    slug: "bancoposta",
    name: "BancoPosta",
    match: /bancoposta|postale|postagiro/i,
    excluded: /bancoposta|postale|postagiro/i,
    hub: true,
    about:
      "I servizi di Poste Italiane per il conto di gioco: bonifico postale e Postagiro dal conto BancoPosta, bollettino postale per ricaricare, bonifico sull'IBAN BancoPosta o bonifico domiciliato (ritiro in ufficio postale) per le vincite. Postepay ha una pagina a parte.",
  },
  {
    id: "klarna",
    slug: "klarna",
    name: "Klarna",
    match: /klarna/i,
    excluded: /klarna/i,
    hub: false,
    about:
      "Klarna è conosciuta soprattutto per i pagamenti a rate o posticipati negli acquisti online. Nessuno degli operatori che confrontiamo la indica tra i metodi per ricaricare il conto di gioco.",
  },
  {
    id: "bitcoin",
    slug: "bitcoin",
    name: "Bitcoin e criptovalute",
    match: /bitcoin|cripto|crypto/i,
    excluded: /bitcoin|cripto|crypto/i,
    hub: false,
    about:
      "Nessun concessionario ADM accetta Bitcoin o altre criptovalute per depositare o prelevare. I siti che le accettano da giocatori italiani operano senza concessione: in Italia non sono legali e non offrono le tutele dei siti autorizzati.",
  },
];

export const methodPath = (m: PaymentMethodInfo) => `${paths.sitiScommesse}/${m.slug}`;

// ---------- topics ----------

export type TopicId = "deposito-5" | "prelievo" | "cash-out" | "streaming" | "spid" | "metodi";

export interface Topic {
  id: TopicId;
  slug: string;
  /** Label in the menu and on the tiles. */
  label: string;
  /** H1. */
  heading: string;
  title: string;
  description: string;
}

export const topics: Topic[] = [
  {
    id: "deposito-5",
    slug: "deposito-minimo-5-euro",
    label: "Deposito minimo 5 €",
    heading: "Siti scommesse con deposito minimo di 5 €",
    title: "Siti scommesse con deposito minimo 5 euro: quali sono",
    description:
      "Gli operatori ADM che accettano depositi online da 5 € o meno, con i metodi che lo permettono e il deposito richiesto dalle offerte di benvenuto.",
  },
  {
    id: "prelievo",
    slug: "prelievo-immediato",
    label: "Prelievo immediato",
    heading: "Siti scommesse con prelievo immediato o in giornata",
    title: "Siti scommesse con prelievo immediato: tempi a confronto",
    description:
      "Quanto tempo serve per prelevare dai siti di scommesse ADM: il metodo più veloce di ogni operatore e i tempi dichiarati nelle sue pagine di aiuto.",
  },
  {
    id: "cash-out",
    slug: "cash-out",
    label: "Cash out",
    heading: "Siti scommesse con cash out",
    title: "Siti scommesse con cash out: quali operatori lo offrono",
    description:
      "Gli operatori ADM che permettono di chiudere una giocata prima della fine con il cash out, come funziona e cosa sapere prima di usarlo.",
  },
  {
    id: "streaming",
    slug: "streaming",
    label: "Live e streaming",
    heading: "Siti scommesse con diretta streaming",
    title: "Siti scommesse con streaming live delle partite",
    description:
      "Gli operatori ADM che trasmettono in streaming alcuni eventi su cui si scommette dal vivo, con le condizioni per vederli e le alternative.",
  },
  {
    id: "spid",
    slug: "spid",
    label: "Registrazione con SPID",
    heading: "Siti scommesse con registrazione SPID",
    title: "Siti scommesse con SPID: aprire il conto con l'identità digitale",
    description:
      "Gli operatori ADM che permettono di aprire il conto di gioco con SPID, verificati sulle loro pagine di registrazione, e come funziona.",
  },
  {
    id: "metodi",
    slug: "metodi-di-pagamento",
    label: "Metodi di pagamento",
    heading: "Metodi di pagamento dei siti scommesse",
    title: "Metodi di pagamento dei siti scommesse a confronto",
    description:
      "PayPal, Postepay, carte, Apple Pay, Skrill, bonifico: quali operatori ADM accettano ciascun metodo, con limiti, tempi di prelievo e validità per i bonus.",
  },
];

export const topicPath = (t: Pick<Topic, "slug">) => `${paths.sitiScommesse}/${t.slug}`;
export const findTopic = (id: TopicId) => topics.find((t) => t.id === id)!;

