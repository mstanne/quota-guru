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
  | "apple-pay"
  | "google-pay"
  | "skrill"
  | "neteller"
  | "paysafecard"
  | "bonifico";

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
}

export const paymentMethods: PaymentMethodInfo[] = [
  {
    id: "paypal",
    slug: "paypal",
    name: "PayPal",
    match: /paypal/i,
    excluded: /paypal/i,
    about:
      "PayPal è un portafoglio elettronico: si collega una carta o un conto e si paga con email e password, senza inserire i dati della carta sul sito dell'operatore. Il conto PayPal deve essere intestato alla stessa persona del conto di gioco.",
  },
  {
    id: "postepay",
    slug: "postepay",
    name: "Postepay",
    match: /postepay/i,
    excluded: /postepay/i,
    about:
      "Postepay è la carta prepagata di Poste Italiane (anche nella versione Evolution con IBAN). Sui siti di scommesse si usa come una normale carta del circuito Visa o Mastercard.",
  },
  {
    id: "carte",
    slug: "carte-di-credito",
    name: "Carte di credito e debito",
    match: /visa|mastercard|maestro|cart[ae] di (credito|debito)/i,
    excluded: /visa|mastercard|maestro|carta/i,
    about:
      "Carte di credito, di debito e prepagate dei circuiti Visa, Mastercard e Maestro. Il deposito è accreditato subito; il prelievo sulla carta richiede in genere più tempo dei portafogli elettronici.",
  },
  {
    id: "apple-pay",
    slug: "apple-pay",
    name: "Apple Pay",
    match: /apple pay/i,
    excluded: /apple pay/i,
    about:
      "Apple Pay usa una carta salvata nel Wallet di iPhone, iPad o Mac: il pagamento si conferma con Face ID o Touch ID e l'operatore non riceve il numero della carta.",
  },
  {
    id: "google-pay",
    slug: "google-pay",
    name: "Google Pay",
    match: /google pay/i,
    excluded: /google pay/i,
    about:
      "Google Pay usa una carta salvata nel portafoglio Google dello smartphone Android: il pagamento si conferma con lo sblocco del telefono, senza inserire i dati della carta.",
  },
  {
    id: "skrill",
    slug: "skrill",
    name: "Skrill",
    match: /skrill/i,
    excluded: /skrill/i,
    about:
      "Skrill è un portafoglio elettronico diffuso nel gioco online. Molti operatori lo escludono dalle offerte di benvenuto: conviene controllarlo prima del primo deposito.",
  },
  {
    id: "neteller",
    slug: "neteller",
    name: "Neteller",
    match: /neteller/i,
    excluded: /neteller/i,
    about:
      "Neteller è un portafoglio elettronico dello stesso gruppo di Skrill. Come Skrill, è spesso escluso dalle offerte di benvenuto.",
  },
  {
    id: "paysafecard",
    slug: "paysafecard",
    name: "Paysafecard",
    match: /paysafe/i,
    excluded: /paysafe/i,
    about:
      "Paysafecard è una carta prepagata con un codice PIN, che si compra in contanti in tabaccherie e ricevitorie. Serve quasi sempre solo per depositare: per prelevare va usato un altro metodo.",
  },
  {
    id: "bonifico",
    slug: "bonifico-bancario",
    name: "Bonifico bancario",
    match: /bonifico/i,
    excluded: /bonifico|movimentazione bancaria/i,
    about:
      "Il bonifico parte dal conto corrente in banca o in posta. Con il bonifico istantaneo il denaro arriva in pochi secondi se la banca lo supporta; il bonifico ordinario richiede uno o più giorni lavorativi.",
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

