/**
 * Editorial content of the payment method pages (/siti-scommesse/<metodo>): how the method works, its own costs,
 * pros and cons, security, who runs it, alternatives, method-specific FAQs and the sources of every fact about the
 * method. Operator data (limits, times, bonus exclusions) is NOT here: it comes from operators.ts and
 * operatorProfiles.ts through topicPages.ts.
 *
 * Kept out of topicDefs.ts, which is in every page's main bundle (header menu): this file is only loaded by the
 * thematic pages. Facts checked on 13/11/2026: re-check the sources when a method changes its fees or rules.
 */
import type { MethodId } from "./topicDefs";

export interface Source {
  label: string;
  url: string;
}

export interface MethodGuide {
  /** "Portafoglio elettronico", "Circuito di carte"... */
  kind: string;
  /** Steps to deposit; null when no operator accepts the method. */
  deposit: string[] | null;
  /** Steps to withdraw; null when the method is not used for withdrawals. */
  withdraw: string[] | null;
  /** Why the method cannot be used and what to do instead (methods no operator accepts). */
  instead?: { title: string; paragraphs: string[] };
  /** What the method itself charges (not the operator). */
  costs: string[];
  pros: string[];
  cons: string[];
  security: string[];
  /** Short identity card of the method. */
  facts: { label: string; value: string }[];
  alternatives: MethodId[];
  faqs: { q: string; a: string }[];
  sources: Source[];
}

const SRC = {
  paypalFees: { label: "PayPal, tariffe per i consumatori (Italia)", url: "https://www.paypal.com/it/digital-wallet/paypal-consumer-fees" },
  instant: {
    label: "Regolamento (UE) 2024/886 sui bonifici istantanei",
    url: "https://eur-lex.europa.eu/eli/reg/2024/886/oj",
  },
  maestro: {
    label: "Adyen, Debit Mastercard sostituisce Maestro",
    url: "https://www.adyen.com/it_IT/knowledge-hub/debit-mastercard-sostituisce-maestro-cose-da-sapere",
  },
  mybank: { label: "MyBank, guida per i merchant (PRETA S.A.S.)", url: "https://mybank.eu/wp-content/uploads/2025/06/Guida-Merchant-MyBank-2025-5.pdf" },
  muchbetter: { label: "MuchBetter, informazioni legali", url: "https://muchbetter.com/it/conti-aziendali/app-activation" },
  paysafecard: {
    label: "Paysafecard, documento informativo sulle tariffe",
    url: "https://www.paysafecard.com/fileadmin/Legal/Account_and_Card_TnC/2024/Fee_Information_Document-it-IT.pdf",
  },
  paysafeFees: {
    label: "Italia Oggi, quanto costa lasciare fermo il saldo di una ricarica prepagata",
    url: "https://www.italiaoggi.it/native-content/quanto-costa-lasciare-fermo-il-saldo-di-una-ricarica-prepagata-rwo6p1of",
  },
  neteller: { label: "Tuttosport, Neteller sui siti ADM", url: "https://www.tuttosport.com/casino/metodo-di-pagamento/neteller" },
  skrill: { label: "Finanza Digitale, recensione di Skrill", url: "https://www.finanzadigitale.com/recensioni/skrill/" },
  amex: {
    label: "American Express Italia, documento di sintesi",
    url: "https://www.americanexpress.com/content/dam/amex/it/staticassets/pdf/RegolamentoCorporate_Titolari_0326.pdf",
  },
  klarna: {
    label: "Klarna, condizioni del saldo Klarna (Italia)",
    url: "https://res.cloudinary.com/dlhhugvi8/image/upload/v1774539350/financial/klarna_it_IT_Klarna_balance_1_451872143b.pdf",
  },
  crypto: { label: "Casinos.com, criptovalute e normativa ADM", url: "https://www.casinos.com/it/guide/crypto-casino" },
} satisfies Record<string, Source>;

/** The ADM rules on payments for online gaming accounts (shown on every method page). */
export const admPaymentRules: { paragraphs: string[]; source: Source } = {
  paragraphs: [
    "Per ricaricare il conto di gioco valgono bonifici, addebiti diretti, carte di pagamento e prepagate offerti da prestatori di servizi di pagamento italiani o europei che identificano chi paga. Gli strumenti con PIN o voucher hanno regole più strette: chi li compra deve essere identificato e deve essere il titolare del conto di gioco.",
    "Per i prelievi il giocatore indica un conto o uno strumento tracciabile intestato a sé: l'operatore deve verificarlo prima di pagare e, se l'intestatario non coincide, non paga. Il saldo del conto online non si ritira in contanti nei punti vendita.",
    "I portafogli elettronici sono ammessi se gestiti da intermediari autorizzati e vigilati. Resta il limite di 100 € a settimana per le ricariche in contanti nei punti vendita, fissato dal decreto legislativo 41/2024.",
  ],
  source: {
    label: "Casinos.com, la determinazione ADM sui pagamenti del gioco online (28/10/2026)",
    url: "https://www.casinos.com/it/news/gioco-online-adm-stringe-sui-pagamenti-controlli-sui-conti-e-stop-ai-prelievi-nei-punti-vendita",
  },
};

const cardDeposit = (name: string, check: string) => [
  `Nella sezione Deposito (o Ricarica) del conto di gioco scegli ${name} e indica l'importo.`,
  "Inserisci numero, scadenza e codice di sicurezza della carta, oppure scegli una carta già salvata.",
  `Conferma il pagamento con ${check}: è l'autenticazione forte prevista dalle regole europee sui pagamenti.`,
  "Il deposito è accreditato subito sul conto di gioco.",
];

const cardWithdraw = (name: string) => [
  `Nella sezione Prelievo scegli ${name}: molti operatori lo propongono solo per la carta già usata per depositare.`,
  "Il primo prelievo richiede il conto di gioco verificato, con il documento d'identità caricato.",
  "Dopo l'approvazione dell'operatore l'importo arriva sulla carta: i tempi dipendono dall'operatore e dalla banca (vedi la tabella).",
];

export const methodGuides: Record<MethodId, MethodGuide> = {
  paypal: {
    kind: "Portafoglio elettronico",
    deposit: [
      "Nella sezione Deposito (o Ricarica) del conto di gioco scegli PayPal e indica l'importo.",
      "Si apre la finestra di PayPal: accedi e conferma il pagamento, nell'app o con il secondo fattore di sicurezza.",
      "Il deposito è accreditato subito. PayPal addebita il saldo PayPal oppure la carta o il conto collegati.",
    ],
    withdraw: [
      "Nella sezione Prelievo scegli PayPal: alcuni operatori lo propongono solo a chi ha già depositato con PayPal.",
      "Il primo prelievo richiede il conto di gioco verificato, con il documento d'identità caricato.",
      "Dopo l'approvazione dell'operatore l'importo arriva sul saldo PayPal; da lì si trasferisce sul conto corrente o si usa per altri pagamenti.",
    ],
    costs: [
      "Per chi paga, PayPal non applica tariffe sui pagamenti, salvo quando serve una conversione di valuta: ricaricare un conto di gioco in euro non costa nulla.",
      "Trasferire il saldo PayPal su un conto bancario italiano è gratuito, anche con il trasferimento immediato. Trasferirlo su una carta costa l'1% dell'importo, con un minimo e un massimo indicati nel tariffario.",
    ],
    pros: [
      "L'operatore non riceve il numero della carta né le coordinate del conto.",
      "Vale sia per depositare sia per prelevare presso quasi tutti gli operatori che lo accettano.",
      "Movimenti del conto di gioco visibili a parte, nell'app PayPal.",
    ],
    cons: [
      "Serve un conto PayPal verificato e intestato a te.",
      "Le vincite arrivano sul saldo PayPal: per averle sul conto corrente serve un trasferimento in più.",
      "Il trasferimento del saldo su una carta costa l'1%.",
    ],
    security: [
      "Per pagare servono le credenziali PayPal e la conferma con autenticazione forte (app, codice via SMS o biometria).",
      "Al sito dell'operatore arriva solo l'esito del pagamento: i dati della carta o del conto restano a PayPal.",
    ],
    facts: [
      { label: "Tipo", value: "Portafoglio elettronico (moneta elettronica)" },
      { label: "Società per i clienti europei", value: "PayPal (Europe) S.à r.l. et Cie, S.C.A." },
      { label: "Sede", value: "Lussemburgo" },
      { label: "Vigilanza", value: "Commission de Surveillance du Secteur Financier (Lussemburgo)" },
      { label: "Costo dei pagamenti in euro", value: "Gratuito" },
    ],
    alternatives: ["skrill", "neteller", "apple-pay", "postepay"],
    faqs: [
      {
        q: "Le vincite prelevate con PayPal dove arrivano?",
        a: "Sul saldo del conto PayPal. Da lì puoi trasferirle sul conto corrente (gratis se non serve una conversione di valuta) o su una carta (1% dell'importo).",
      },
      {
        q: "Posso usare il conto PayPal di un familiare?",
        a: "No: il conto PayPal deve essere intestato alla stessa persona del conto di gioco. Pagamenti da conti di altri vengono bloccati e le vincite non vengono pagate su strumenti intestati ad altri.",
      },
    ],
    sources: [SRC.paypalFees],
  },

  postepay: {
    kind: "Carta prepagata",
    deposit: cardDeposit("Postepay (o carta di credito, se l'operatore non la elenca a parte)", "la notifica nell'app Postepay"),
    withdraw: [
      "Nella sezione Prelievo scegli Postepay oppure il bonifico: con Postepay Evolution le vincite possono arrivare anche sull'IBAN della carta.",
      "Il primo prelievo richiede il conto di gioco verificato, con il documento d'identità caricato.",
      "Dopo l'approvazione dell'operatore l'importo arriva sulla carta; i tempi sono nella tabella, operatore per operatore.",
    ],
    costs: [
      "Gli operatori che confrontiamo non applicano spese sui depositi con Postepay. I costi propri della carta (canone di Postepay Evolution, ricariche nei punti vendita) sono nel foglio informativo di Poste Italiane.",
    ],
    pros: [
      "Molto diffusa e ricaricabile anche in contanti, negli uffici postali e nei punti convenzionati.",
      "Il pagamento si conferma nell'app, dove si può anche bloccare la carta.",
      "La versione Evolution ha un IBAN e riceve anche i bonifici.",
    ],
    cons: [
      "Non tutti gli operatori pagano le vincite sulla carta: alcuni la accettano solo per i prelievi o solo per i depositi.",
      "I prelievi sulla carta possono richiedere più giorni di quelli verso un portafoglio elettronico.",
    ],
    security: [
      "I pagamenti online si confermano nell'app Postepay (3D Secure): senza la conferma il deposito non parte.",
      "Essendo prepagata, si può tenere sulla carta solo la somma che si vuole usare.",
    ],
    facts: [
      { label: "Tipo", value: "Carta prepagata (anche con IBAN nella versione Evolution)" },
      { label: "Gruppo", value: "Poste Italiane" },
      { label: "Vigilanza", value: "Banca d'Italia" },
    ],
    alternatives: ["carte", "paypal", "apple-pay", "bancoposta"],
    faqs: [
      {
        q: "Postepay vale come carta di credito sui siti scommesse?",
        a: "Sì: quando un operatore non elenca Postepay a parte, la si usa scegliendo il pagamento con carta. Fanno fede i limiti indicati per le carte.",
      },
    ],
    sources: [],
  },

  carte: {
    kind: "Carte di credito, debito e prepagate",
    deposit: cardDeposit("la carta", "il codice o la notifica dell'app della banca"),
    withdraw: cardWithdraw("la carta"),
    costs: [
      "Gli operatori che confrontiamo non applicano spese sui depositi con carta. La banca o l'istituto che ha emesso la carta può applicare costi propri: sono nel foglio informativo della carta.",
      "Con una carta di credito a rate (revolving) il deposito entra nel debito della carta e può maturare interessi.",
    ],
    pros: [
      "Accettate da tutti gli operatori che confrontiamo.",
      "Deposito accreditato subito, senza aprire conti nuovi.",
      "Le vincite tornano sulla stessa carta, presso molti operatori.",
    ],
    cons: [
      "I prelievi sulla carta richiedono spesso più giorni dei portafogli elettronici.",
      "Alcune carte di credito non sono abilitate ai pagamenti di gioco, a discrezione della banca.",
      "Le carte Maestro sono in dismissione e alcune offerte di benvenuto le escludono.",
    ],
    security: [
      "I pagamenti online si confermano con l'autenticazione forte della banca (codice, notifica o biometria): Visa Secure e Mastercard Identity Check.",
      "Una carta prepagata o una carta virtuale permette di separare la spesa di gioco dal conto corrente.",
    ],
    facts: [
      { label: "Circuiti accettati", value: "Visa, Mastercard; Maestro fino alla scadenza delle carte" },
      { label: "Chi emette la carta", value: "La tua banca o istituto di pagamento" },
      { label: "American Express", value: "Non elencata dagli operatori che confrontiamo" },
    ],
    alternatives: ["postepay", "apple-pay", "google-pay", "paypal"],
    faqs: [
      {
        q: "Meglio una carta di debito o di credito per il conto di gioco?",
        a: "Con la carta di debito o prepagata il deposito esce subito dal conto o dal saldo della carta. Con la carta di credito l'addebito arriva dopo, e con le carte a rate può maturare interessi: un rischio in più di spendere oltre il previsto.",
      },
    ],
    sources: [SRC.maestro],
  },

  visa: {
    kind: "Circuito di carte",
    deposit: cardDeposit("Visa (o la carta di credito, se l'operatore non distingue i circuiti)", "Visa Secure, cioè il codice o la notifica dell'app della banca"),
    withdraw: cardWithdraw("la carta Visa"),
    costs: [
      "Visa non applica costi a chi paga: eventuali costi dipendono dalla banca che ha emesso la carta e sono nel suo foglio informativo. Gli operatori che confrontiamo non applicano spese sui depositi con carta.",
    ],
    pros: [
      "È uno dei due circuiti accettati da tutti gli operatori che accettano carte.",
      "Esistono carte Visa di debito, credito e prepagate, anche virtuali.",
    ],
    cons: [
      "Molti operatori scrivono solo \"carte di credito\" senza indicare i circuiti.",
      "Il prelievo sulla carta richiede spesso più giorni di un portafoglio elettronico.",
    ],
    security: [
      "I pagamenti online si confermano con Visa Secure, l'autenticazione forte gestita dalla banca (codice, notifica o biometria).",
    ],
    facts: [
      { label: "Tipo", value: "Circuito di pagamento" },
      { label: "Società", value: "Visa Inc. (Stati Uniti); in Europa Visa Europe" },
      { label: "Chi emette la carta", value: "La tua banca o istituto di pagamento" },
      { label: "Autenticazione online", value: "Visa Secure (3D Secure)" },
    ],
    alternatives: ["mastercard", "carte", "apple-pay", "paypal"],
    faqs: [
      {
        q: "Se l'operatore scrive solo \"carte di credito\", accetta Visa?",
        a: "Quasi sempre sì, ma non lo dà per scontato: nella pagina indichiamo a parte gli operatori che non nominano i circuiti. Il circuito accettato si vede anche nella cassa del conto, prima di pagare.",
      },
    ],
    sources: [],
  },

  mastercard: {
    kind: "Circuito di carte",
    deposit: cardDeposit(
      "Mastercard (o la carta di credito, se l'operatore non distingue i circuiti)",
      "Mastercard Identity Check, cioè il codice o la notifica dell'app della banca",
    ),
    withdraw: cardWithdraw("la carta Mastercard"),
    costs: [
      "Mastercard non applica costi a chi paga: eventuali costi dipendono dalla banca che ha emesso la carta. Gli operatori che confrontiamo non applicano spese sui depositi con carta.",
    ],
    pros: [
      "È il circuito delle Debit Mastercard che dal 2023 sostituiscono le Maestro, quindi di molte carte collegate al conto corrente.",
      "Esistono carte Mastercard di debito, credito e prepagate, anche virtuali.",
    ],
    cons: [
      "Molti operatori scrivono solo \"carte di credito\" senza indicare i circuiti.",
      "Il prelievo sulla carta richiede spesso più giorni di un portafoglio elettronico.",
    ],
    security: [
      "I pagamenti online si confermano con Mastercard Identity Check, l'autenticazione forte gestita dalla banca.",
    ],
    facts: [
      { label: "Tipo", value: "Circuito di pagamento" },
      { label: "Società", value: "Mastercard Inc. (Stati Uniti); in Europa Mastercard Europe" },
      { label: "Chi emette la carta", value: "La tua banca o istituto di pagamento" },
      { label: "Autenticazione online", value: "Mastercard Identity Check (3D Secure)" },
    ],
    alternatives: ["visa", "carte", "google-pay", "paypal"],
    faqs: [
      {
        q: "La mia carta di debito nuova è Mastercard: vale come quella di credito?",
        a: "Sì, per depositare si usa allo stesso modo. Dal 1° luglio 2023 le banche europee emettono Debit Mastercard al posto delle Maestro.",
      },
    ],
    sources: [SRC.maestro],
  },

  maestro: {
    kind: "Circuito di carte di debito (in dismissione)",
    deposit: cardDeposit("la carta (Maestro, se l'operatore la elenca)", "il codice o la notifica dell'app della banca"),
    withdraw: cardWithdraw("la carta Maestro"),
    costs: [
      "Eventuali costi dipendono dalla banca che ha emesso la carta. Gli operatori che confrontiamo non applicano spese sui depositi con carta.",
    ],
    pros: ["Le carte Maestro ancora valide funzionano fino alla scadenza."],
    cons: [
      "Dal 1° luglio 2023 non si emettono più carte Maestro in Europa: le ultime scadono al più tardi nel 2027.",
      "Pochi operatori la nominano tra i metodi, e alcune offerte di benvenuto la escludono.",
    ],
    security: ["I pagamenti online si confermano con l'autenticazione forte della banca, come per le altre carte."],
    facts: [
      { label: "Tipo", value: "Circuito di carte di debito" },
      { label: "Proprietario", value: "Mastercard" },
      { label: "Stato in Europa", value: "Nessuna nuova carta dal 1° luglio 2023" },
      { label: "Sostituita da", value: "Debit Mastercard" },
    ],
    alternatives: ["mastercard", "visa", "carte", "bonifico"],
    faqs: [
      {
        q: "Cosa succede alla mia carta Maestro?",
        a: "Funziona fino alla data di scadenza; alla scadenza (o prima, se la banca decide di sostituirla) ricevi una Debit Mastercard collegata allo stesso conto, che si usa sui siti di gioco come le altre carte.",
      },
    ],
    sources: [SRC.maestro],
  },

  "american-express": {
    kind: "Carta di credito (circuito ed emittente)",
    deposit: null,
    withdraw: null,
    instead: {
      title: "Si può usare American Express sui siti scommesse?",
      paragraphs: [
        "Nessuno degli operatori ADM che confrontiamo elenca American Express tra i metodi di pagamento: la cassa propone carte Visa e Mastercard, portafogli elettronici e bonifici.",
        "Alcune guide suggeriscono di collegare la carta a un portafoglio elettronico accettato dall'operatore, per esempio PayPal: in quel caso all'operatore arriva un pagamento PayPal. Prima di farlo controlla nelle condizioni della carta e del portafoglio che l'uso per il gioco sia ammesso e quanto costa.",
      ],
    },
    costs: [
      "Le condizioni (quota annuale, costi delle operazioni) dipendono dalla singola carta American Express e sono nel suo documento di sintesi.",
    ],
    pros: ["Carta molto diffusa per viaggi e acquisti online, con protezioni contro le frodi."],
    cons: ["Non accettata direttamente dagli operatori che confrontiamo.", "Non serve per ricevere le vincite."],
    security: ["I pagamenti online si confermano con SafeKey, l'autenticazione forte di American Express (3D Secure)."],
    facts: [
      { label: "Tipo", value: "Carte di credito e charge" },
      { label: "Società", value: "American Express Company (Stati Uniti)" },
      { label: "In Italia", value: "American Express Italia S.r.l., istituto di pagamento vigilato da Banca d'Italia" },
      { label: "Accettata dagli operatori che confrontiamo", value: "No" },
    ],
    alternatives: ["visa", "mastercard", "paypal", "apple-pay"],
    faqs: [
      {
        q: "Esistono siti scommesse ADM che accettano American Express?",
        a: "Tra gli operatori che confrontiamo nessuno la elenca nelle pagine dei pagamenti. Se un operatore la aggiunge, la troverai in questa pagina.",
      },
    ],
    sources: [SRC.amex],
  },

  "apple-pay": {
    kind: "Pagamento da smartphone",
    deposit: [
      "Aggiungi la carta della tua banca al Wallet di iPhone (la banca deve supportare Apple Pay).",
      "Nella sezione Deposito del conto di gioco scegli Apple Pay e indica l'importo.",
      "Conferma con Face ID, Touch ID o il codice del dispositivo: il deposito è accreditato subito.",
    ],
    withdraw: [
      "Dove il prelievo con Apple Pay è previsto, l'importo arriva sulla carta collegata al Wallet.",
      "Molti operatori accettano Apple Pay solo per depositare: in quel caso si preleva con un altro metodo (vedi la tabella).",
    ],
    costs: [
      "Apple non applica costi a chi paga: valgono le condizioni della carta collegata. Gli operatori che confrontiamo non applicano spese sui depositi.",
    ],
    pros: [
      "Non si inseriscono i dati della carta sul sito dell'operatore.",
      "Conferma rapida con il riconoscimento del volto o dell'impronta.",
    ],
    cons: [
      "Solo con dispositivi Apple e con carte di banche che aderiscono.",
      "Spesso vale solo per i depositi.",
    ],
    security: [
      "Il Wallet usa al posto del numero della carta un codice specifico del dispositivo: l'operatore non riceve il numero reale.",
      "Ogni pagamento richiede Face ID, Touch ID o il codice del dispositivo.",
    ],
    facts: [
      { label: "Tipo", value: "Portafoglio digitale per carte" },
      { label: "Gestore", value: "Apple" },
      { label: "Dispositivi", value: "iPhone, iPad, Apple Watch, Mac" },
      { label: "Costo per chi paga", value: "Nessuno da parte di Apple" },
    ],
    alternatives: ["google-pay", "carte", "paypal", "postepay"],
    faqs: [
      {
        q: "Con Apple Pay si possono prelevare le vincite?",
        a: "Dipende dall'operatore: alcuni pagano sulla carta collegata, altri accettano Apple Pay solo per depositare. La colonna Prelievo della tabella lo indica operatore per operatore.",
      },
    ],
    sources: [],
  },

  "google-pay": {
    kind: "Pagamento da smartphone",
    deposit: [
      "Aggiungi la carta della tua banca a Google Wallet (la banca deve supportare Google Pay).",
      "Nella sezione Deposito del conto di gioco scegli Google Pay e indica l'importo.",
      "Conferma con lo sblocco del telefono: il deposito è accreditato subito.",
    ],
    withdraw: [
      "Dove il prelievo con Google Pay è previsto, l'importo arriva sulla carta collegata.",
      "Molti operatori accettano Google Pay solo per depositare: in quel caso si preleva con un altro metodo (vedi la tabella).",
    ],
    costs: [
      "Google non applica costi a chi paga: valgono le condizioni della carta collegata. Gli operatori che confrontiamo non applicano spese sui depositi.",
    ],
    pros: [
      "Non si inseriscono i dati della carta sul sito dell'operatore.",
      "Funziona con la maggior parte degli smartphone Android.",
    ],
    cons: ["Accettato da meno operatori di Apple Pay.", "Spesso vale solo per i depositi."],
    security: [
      "Il pagamento usa un numero virtuale al posto di quello della carta e si conferma con lo sblocco del telefono (impronta, volto o PIN).",
    ],
    facts: [
      { label: "Tipo", value: "Portafoglio digitale per carte" },
      { label: "Gestore", value: "Google" },
      { label: "Dispositivi", value: "Smartphone e orologi Android" },
      { label: "Costo per chi paga", value: "Nessuno da parte di Google" },
    ],
    alternatives: ["apple-pay", "carte", "paypal", "postepay"],
    faqs: [],
    sources: [],
  },

  skrill: {
    kind: "Portafoglio elettronico",
    deposit: [
      "Apri un conto Skrill intestato a te e completa la verifica dell'identità; ricaricalo con bonifico, carta o altri metodi.",
      "Nella sezione Deposito del conto di gioco scegli Skrill, indica l'importo e accedi a Skrill per confermare.",
      "Il deposito è accreditato subito. Prima, controlla se l'offerta di benvenuto esclude Skrill.",
    ],
    withdraw: [
      "Nella sezione Prelievo scegli Skrill.",
      "Dopo l'approvazione dell'operatore l'importo arriva sul saldo Skrill, di solito in tempi brevi (vedi la tabella).",
      "Dal saldo Skrill si trasferisce il denaro su conto o carta, con i costi indicati da Skrill.",
    ],
    costs: [
      "Skrill applica commissioni su alcune operazioni: certe ricariche (per esempio con carta), il trasferimento del saldo verso banca o carta, la conversione di valuta e una commissione mensile se il conto resta inattivo a lungo. Gli importi aggiornati sono nel tariffario di Skrill.",
    ],
    pros: [
      "Prelievi tra i più rapidi, presso gli operatori che pubblicano i tempi.",
      "Accettato da quasi tutti gli operatori che confrontiamo.",
    ],
    cons: [
      "Spesso escluso dalle offerte di benvenuto.",
      "Costi per riportare il saldo sul conto corrente e in caso di inattività.",
    ],
    security: [
      "Accesso con password e verifica in due passaggi; l'operatore non riceve i dati di carta o conto.",
      "Il conto deve essere verificato con documento d'identità ed essere intestato al titolare del conto di gioco.",
    ],
    facts: [
      { label: "Tipo", value: "Portafoglio elettronico (moneta elettronica)" },
      { label: "Gruppo", value: "Paysafe (con Neteller e Paysafecard)" },
      { label: "Costi", value: "Su alcune ricariche, trasferimenti e inattività" },
    ],
    alternatives: ["neteller", "paypal", "muchbetter", "bonifico"],
    faqs: [
      {
        q: "Se l'offerta esclude Skrill, esclude anche Neteller?",
        a: "Non necessariamente: sono due portafogli distinti dello stesso gruppo. Fa fede l'elenco dei metodi esclusi nelle condizioni dell'offerta.",
      },
    ],
    sources: [SRC.skrill],
  },

  neteller: {
    kind: "Portafoglio elettronico",
    deposit: [
      "Apri un conto Neteller intestato a te e completa la verifica dell'identità; ricaricalo con bonifico, carta o altri metodi.",
      "Nella sezione Deposito del conto di gioco scegli Neteller, indica l'importo e conferma accedendo a Neteller.",
      "Il deposito è accreditato subito. Prima, controlla se l'offerta di benvenuto esclude Neteller.",
    ],
    withdraw: [
      "Nella sezione Prelievo scegli Neteller.",
      "Dopo l'approvazione dell'operatore l'importo arriva sul saldo Neteller (tempi nella tabella).",
      "Dal saldo si trasferisce il denaro su conto o carta, con i costi indicati da Neteller.",
    ],
    costs: [
      "Neteller applica commissioni su alcune operazioni (certe ricariche, trasferimenti verso banca o carta, conversione di valuta, inattività prolungata): gli importi sono nel tariffario di Neteller.",
    ],
    pros: ["Prelievi rapidi presso gli operatori che pubblicano i tempi.", "Conto separato da quello bancario."],
    cons: ["Spesso escluso dalle offerte di benvenuto.", "Costi per riportare il saldo sul conto corrente."],
    security: [
      "Accesso con password e verifica in due passaggi; l'operatore non riceve i dati di carta o conto.",
      "Il conto deve essere verificato ed essere intestato al titolare del conto di gioco.",
    ],
    facts: [
      { label: "Tipo", value: "Portafoglio elettronico (moneta elettronica)" },
      { label: "Emittente", value: "Paysafe Payment Solutions Limited (Dublino)" },
      { label: "Vigilanza", value: "Central Bank of Ireland" },
      { label: "Gruppo", value: "Paysafe (con Skrill e Paysafecard)" },
    ],
    alternatives: ["skrill", "paypal", "muchbetter", "bonifico"],
    faqs: [],
    sources: [SRC.neteller],
  },

  muchbetter: {
    kind: "Portafoglio elettronico (app)",
    deposit: [
      "Scarica l'app MuchBetter, apri il conto e verifica l'identità; ricaricalo con carta, bonifico o voucher comprato in negozio.",
      "Nella sezione Deposito del conto di gioco scegli MuchBetter e indica l'importo.",
      "Conferma il pagamento nell'app: il deposito è accreditato subito.",
    ],
    withdraw: [
      "Nella sezione Prelievo scegli MuchBetter: alcuni operatori lo accettano solo per depositare.",
      "Dopo l'approvazione dell'operatore l'importo arriva sul saldo dell'app (tempi nella tabella).",
    ],
    costs: [
      "I trasferimenti tra utenti MuchBetter sono gratuiti; le altre commissioni sono nella pagina tariffe di MuchBetter e nell'app.",
    ],
    pros: [
      "Si ricarica anche in contanti, con voucher venduti nei negozi convenzionati.",
      "Deposito minimo molto basso presso alcuni operatori (vedi la tabella).",
    ],
    cons: [
      "Accettato da pochi operatori.",
      "Le ricariche con voucher in contanti sono soggette alle regole più strette per gli strumenti a PIN.",
    ],
    security: [
      "Accesso e pagamenti si confermano nell'app, anche con impronta o volto.",
      "La carta prepagata collegata usa un codice di sicurezza dinamico generato dall'app.",
    ],
    facts: [
      { label: "Tipo", value: "Portafoglio elettronico con app e carta prepagata Mastercard" },
      { label: "Moneta elettronica nello SEE", value: "Distribuita per Sureswipe EMI PLC (Revsto), vigilata dalla Banca Centrale di Cipro" },
      { label: "Carta", value: "MuchBetter Mastercard prepagata, emessa da Paynovate SA" },
    ],
    alternatives: ["skrill", "neteller", "paysafecard", "paypal"],
    faqs: [],
    sources: [SRC.muchbetter],
  },

  paysafecard: {
    kind: "Credito prepagato con PIN",
    deposit: [
      "Compra un codice Paysafecard in tabaccheria, ricevitoria o online: in Italia serve il codice fiscale e un conto myPaysafe per usarlo.",
      "Nella sezione Deposito del conto di gioco scegli Paysafecard e indica l'importo.",
      "Inserisci il PIN di 16 cifre o accedi a myPaysafe: il deposito è accreditato subito.",
    ],
    withdraw: null,
    costs: [
      "Paysafecard applica una commissione mensile sul credito dei codici rimasto inutilizzato a lungo e una commissione di inattività sul conto myPaysafe senza movimenti per 12 mesi: gli importi sono nel tariffario di Paysafecard.",
    ],
    pros: [
      "Si compra anche in contanti e si spende al massimo il valore del codice.",
      "Al sito dell'operatore non arrivano dati bancari.",
    ],
    cons: [
      "Quasi sempre vale solo per depositare: le vincite vanno prelevate con un altro metodo.",
      "Spesso escluso dalle offerte di benvenuto.",
      "Il PIN è come contante: chi lo conosce può usarlo.",
    ],
    security: [
      "Non serve inserire carta o conto; il PIN va custodito come contante e non va mai comunicato a chi lo chiede al telefono o in chat.",
      "Con le nuove regole ADM, chi compra strumenti a PIN deve essere identificato e coincidere con il titolare del conto di gioco.",
    ],
    facts: [
      { label: "Tipo", value: "Credito prepagato con PIN" },
      { label: "Emittente", value: "Paysafe Prepaid Services Limited (Dublino)" },
      { label: "Gruppo", value: "Paysafe (con Skrill e Neteller)" },
      { label: "Per usarlo in Italia", value: "Conto myPaysafe e codice fiscale" },
    ],
    alternatives: ["muchbetter", "postepay", "paypal", "skrill"],
    faqs: [
      {
        q: "Con Paysafecard si possono prelevare le vincite?",
        a: "Raramente: la maggior parte degli operatori la accetta solo per depositare. Per prelevare serve un metodo intestato a te, come bonifico, carta o portafoglio elettronico.",
      },
    ],
    sources: [SRC.paysafecard, SRC.paysafeFees],
  },

  bonifico: {
    kind: "Bonifico (ordinario o istantaneo)",
    deposit: [
      "Nella sezione Deposito scegli il bonifico: l'operatore indica IBAN e causale (spesso con il numero del conto di gioco), oppure ti porta sul sito della banca con un bonifico già compilato.",
      "Esegui il bonifico dal conto intestato a te, copiando con cura IBAN e causale.",
      "Il deposito è accreditato quando il denaro arriva: in pochi secondi con il bonifico istantaneo, in uno o più giorni lavorativi con quello ordinario.",
    ],
    withdraw: [
      "Nella sezione Prelievo scegli il bonifico e indica l'IBAN di un conto intestato a te.",
      "Il primo prelievo richiede il conto di gioco verificato; l'operatore controlla l'intestazione del conto.",
      "Dopo l'approvazione l'importo arriva sul conto: subito con il bonifico istantaneo, in alcuni giorni lavorativi con quello ordinario.",
    ],
    costs: [
      "Il costo del bonifico lo decide la tua banca. Per il regolamento europeo sui bonifici istantanei, dal 9 gennaio 2025 un bonifico istantaneo in euro non può costare più di uno ordinario.",
      "Gli operatori che confrontiamo non applicano spese sui depositi con bonifico.",
    ],
    pros: [
      "Massimali alti, per depositi e prelievi.",
      "Accettato da quasi tutti gli operatori, almeno per prelevare.",
      "Con il bonifico istantaneo le vincite arrivano in pochi secondi, presso gli operatori che lo offrono.",
    ],
    cons: [
      "Il bonifico ordinario richiede uno o più giorni lavorativi.",
      "Alcune offerte di benvenuto escludono il bonifico come primo deposito.",
      "Un errore nella causale può ritardare l'accredito.",
    ],
    security: [
      "Dal 9 ottobre 2025 la banca verifica che IBAN e nome del beneficiario corrispondano prima di eseguire il bonifico.",
      "Il conto corrente deve essere intestato al titolare del conto di gioco, sia per depositare sia per prelevare.",
    ],
    facts: [
      { label: "Tipo", value: "Bonifico SEPA ordinario o istantaneo" },
      { label: "Bonifico istantaneo", value: "Obbligatorio per le banche dell'area euro dal 9 ottobre 2025 (invio)" },
      { label: "Costo dell'istantaneo", value: "Non superiore a quello del bonifico ordinario" },
      { label: "Verifica del beneficiario", value: "Dal 9 ottobre 2025" },
    ],
    alternatives: ["mybank", "bancoposta", "paypal", "skrill"],
    faqs: [
      {
        q: "Il bonifico istantaneo costa di più?",
        a: "No: per il regolamento UE 2024/886 le banche dell'area euro non possono far pagare un bonifico istantaneo più di uno ordinario.",
      },
      {
        q: "Cos'è il bonifico domiciliato?",
        a: "È un prelievo in cui l'operatore manda il denaro all'ufficio postale, dove lo ritiri in contanti con un documento. Lo offrono alcuni operatori, con tempi di alcuni giorni lavorativi.",
      },
    ],
    sources: [SRC.instant],
  },

  mybank: {
    kind: "Bonifico online immediato",
    deposit: [
      "Nella sezione Deposito scegli MyBank e indica l'importo.",
      "Scegli la tua banca dall'elenco: si apre l'home banking con un bonifico già compilato.",
      "Accedi con le tue credenziali e autorizza il bonifico: la conferma arriva in pochi secondi.",
    ],
    withdraw: null,
    costs: [
      "Il costo è quello del bonifico previsto dalla tua banca. Gli operatori che confrontiamo non applicano spese sui depositi.",
    ],
    pros: [
      "Non si comunicano dati bancari all'operatore: si autorizza nell'home banking.",
      "Niente IBAN e causale da copiare a mano.",
    ],
    cons: [
      "La tua banca deve aderire a MyBank.",
      "Di solito vale solo per depositare: le vincite arrivano con un bonifico normale.",
    ],
    security: [
      "Il pagamento si autorizza nell'ambiente della propria banca, con le credenziali e l'autenticazione forte abituali.",
      "Il bonifico è irrevocabile: controlla importo e destinatario prima di confermare.",
    ],
    facts: [
      { label: "Tipo", value: "Bonifico online immediato e irrevocabile" },
      { label: "Società", value: "PRETA S.A.S., controllata da EBA CLEARING" },
      { label: "Requisito", value: "Banca aderente a MyBank" },
    ],
    alternatives: ["bonifico", "paypal", "carte", "bancoposta"],
    faqs: [
      {
        q: "MyBank è un conto da aprire?",
        a: "No: è un servizio delle banche aderenti. Si usa l'home banking che hai già.",
      },
    ],
    sources: [SRC.mybank],
  },

  bancoposta: {
    kind: "Servizi di Poste Italiane",
    deposit: [
      "Dal conto BancoPosta: scegli bonifico postale o Postagiro nella sezione Deposito e usa IBAN e causale indicati dall'operatore.",
      "In alternativa alcuni operatori accettano il bollettino postale, da pagare in ufficio postale o online, con spese postali.",
      "L'accredito arriva quando l'operatore riceve il pagamento: per bonifico e bollettino servono di solito uno o più giorni.",
    ],
    withdraw: [
      "Per ricevere le vincite sul conto BancoPosta scegli il bonifico e indica l'IBAN del conto, intestato a te.",
      "Alcuni operatori offrono il bonifico domiciliato: il denaro si ritira in contanti all'ufficio postale dopo alcuni giorni lavorativi.",
    ],
    costs: [
      "Bollettino e bonifico postale hanno le spese previste da Poste Italiane per il servizio scelto. Gli operatori che confrontiamo non applicano spese proprie sui depositi.",
    ],
    pros: [
      "Depositi da 5 € presso diversi operatori.",
      "Il bollettino si può pagare anche in contanti allo sportello.",
    ],
    cons: [
      "Tempi più lunghi di carte e portafogli elettronici.",
      "Spese postali su bollettini e bonifici.",
    ],
    security: [
      "Bonifici e Postagiro si autorizzano dall'app o dal sito di Poste con le credenziali del conto.",
      "Il conto BancoPosta deve essere intestato al titolare del conto di gioco.",
    ],
    facts: [
      { label: "Tipo", value: "Conto corrente postale e servizi collegati" },
      { label: "Gestore", value: "Poste Italiane S.p.A. – Patrimonio BancoPosta" },
      { label: "Vigilanza", value: "Banca d'Italia" },
    ],
    alternatives: ["postepay", "bonifico", "mybank", "carte"],
    faqs: [],
    sources: [],
  },

  klarna: {
    kind: "Pagamenti a rate e saldo Klarna",
    deposit: null,
    withdraw: null,
    instead: {
      title: "Si può ricaricare il conto di gioco con Klarna?",
      paragraphs: [
        "Nessuno degli operatori ADM che confrontiamo indica Klarna tra i metodi di pagamento nelle pagine che abbiamo verificato.",
        "Klarna è pensata soprattutto per dividere in rate o posticipare il pagamento degli acquisti. Giocare con denaro preso a prestito o pagato a rate aumenta il rischio di spendere più di quanto ci si può permettere: per ricaricare il conto di gioco conviene usare denaro già disponibile, con un metodo intestato a te.",
      ],
    },
    costs: ["Le condizioni dei pagamenti a rate e del saldo Klarna sono nei documenti di Klarna."],
    pros: [],
    cons: ["Non accettata dagli operatori che confrontiamo."],
    security: ["Per gli acquisti online Klarna chiede l'accesso all'app o una conferma con autenticazione forte."],
    facts: [
      { label: "Tipo", value: "Pagamenti a rate o posticipati, saldo Klarna" },
      { label: "Società", value: "Klarna Bank AB (publ), Stoccolma" },
      { label: "Vigilanza", value: "Finansinspektionen (Svezia); in Italia in libera prestazione di servizi" },
      { label: "Accettata dagli operatori che confrontiamo", value: "No" },
    ],
    alternatives: ["bonifico", "mybank", "paypal", "carte"],
    faqs: [
      {
        q: "Si può scommettere a rate?",
        a: "Gli operatori che confrontiamo non offrono metodi di pagamento a rate. Ricaricare il conto di gioco a credito aumenta il rischio di perdere più del previsto: meglio fissare un limite di deposito sul conto.",
      },
    ],
    sources: [SRC.klarna],
  },

  bitcoin: {
    kind: "Criptovalute",
    deposit: null,
    withdraw: null,
    instead: {
      title: "Perché i siti ADM non accettano criptovalute",
      paragraphs: [
        "Ad oggi nessun operatore con concessione ADM elenca depositi o prelievi in Bitcoin, Ethereum o altre criptovalute, né direttamente né tramite servizi di conversione. Le regole ADM chiedono strumenti che identificano chi paga e chi riceve.",
        "Possedere criptovalute in Italia è legale; il limite riguarda il loro uso sul conto di gioco. I siti che accettano criptovalute da giocatori italiani lo fanno senza concessione: la loro offerta in Italia non è legale, l'ADM li oscura e chi gioca non ha le tutele dei siti autorizzati (autoesclusione, limiti, reclami all'ADM, fondi dei giocatori separati).",
      ],
    },
    costs: [],
    pros: [],
    cons: ["Non accettate da nessun concessionario ADM."],
    security: [
      "I pagamenti in criptovaluta non si possono annullare e, su siti senza concessione, nessuna autorità italiana garantisce il pagamento delle vincite.",
    ],
    facts: [
      { label: "Sui siti con concessione ADM", value: "Non accettate" },
      { label: "Possedere criptovalute", value: "Legale in Italia" },
      { label: "Siti che le accettano", value: "Senza concessione ADM: non legali in Italia" },
    ],
    alternatives: ["bonifico", "paypal", "skrill", "carte"],
    faqs: [
      {
        q: "Esistono siti scommesse legali in Italia che accettano Bitcoin?",
        a: "No. Nessun concessionario ADM accetta criptovalute; i siti che le accettano operano senza concessione italiana.",
      },
      {
        q: "Come si riconosce un sito autorizzato?",
        a: "Ha il numero di concessione ADM in fondo alla pagina e compare nell'elenco dei concessionari sul sito dell'Agenzia delle Dogane e dei Monopoli.",
      },
    ],
    sources: [SRC.crypto],
  },
};
