/**
 * EDITORIAL GUIDES
 * Every guide has its own page (/guide/<slug>) and belongs to a category (/guide/categoria/<slug>).
 * Content is structured in blocks, so it can later come from a CMS without touching the layout.
 * Editorial line: informative, no promise of winnings, responsible-gambling note on every page.
 */

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: "info" | "warn"; title: string; text: string }
  | { type: "example"; title: string; text: string }
  | { type: "cards"; items: { title: string; text: string }[] }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string };

export interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

export interface GuideCategory {
  slug: string;
  name: string;
  description: string;
  icon: "book" | "calculator" | "target" | "shield" | "award" | "clock";
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory["slug"];
  readTime: string;
  updatedAt: string;
  /** Cover image URL; null = layout placeholder ([PLACEHOLDER_IMMAGINE_...]). */
  image: string | null;
  featured?: boolean;
  sections: GuideSection[];
}

export const guideCategories: GuideCategory[] = [
  { slug: "principianti", name: "Per principianti", icon: "book", description: "Le basi: cos'è una scommessa, come si legge una quota, quali mercati esistono." },
  { slug: "quote-e-probabilita", name: "Quote e probabilità", icon: "calculator", description: "Formati delle quote, probabilità implicita e margine dell'operatore." },
  { slug: "analisi", name: "Analisi delle partite", icon: "target", description: "Come leggere dati e contesto di un evento prima di valutarlo." },
  { slug: "gestione-del-budget", name: "Gestione del budget", icon: "shield", description: "Limiti, budget e strumenti per mantenere il controllo." },
  { slug: "sport", name: "Sport specifici", icon: "award", description: "Le particolarità di calcio, tennis e basket." },
  { slug: "in-diretta", name: "Scommesse in diretta", icon: "clock", description: "Come funzionano le quote durante l'evento e quali rischi comportano." },
];

export const guides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "guida-completa-scommesse-sportive",
    title: "Guida completa alle scommesse sportive",
    description: "Cos'è una scommessa sportiva, come funzionano quote e mercati, come gestire il budget ed evitare gli errori più comuni.",
    category: "principianti",
    readTime: "8 min",
    updatedAt: "13 ottobre 2026",
    image: null,
    featured: true,
    sections: [
      {
        id: "intro",
        title: "Cos'è una scommessa sportiva",
        blocks: [
          { type: "p", text: "Una scommessa sportiva è una previsione sull'esito di un evento – chi vince, quanti gol si segnano, chi vince un set – su cui si punta una somma di denaro. Se la previsione è corretta, l'operatore paga la puntata moltiplicata per la quota; se è sbagliata, la puntata è persa." },
          { type: "p", text: "In Italia si può scommettere solo con operatori che hanno una concessione dell'Agenzia delle Dogane e dei Monopoli (ADM). Gli operatori senza concessione non offrono tutele su pagamenti, dati e limiti di gioco." },
          { type: "callout", tone: "warn", title: "Prima di tutto", text: "Le scommesse sono una forma di intrattenimento a pagamento, non un modo per guadagnare. Nel lungo periodo il margine dell'operatore fa sì che, in media, chi scommette perda. Gioca solo somme che puoi permetterti di perdere." },
        ],
      },
      {
        id: "quote",
        title: "Come funzionano le quote",
        blocks: [
          { type: "p", text: "La quota indica quanto viene pagata una giocata vincente e, indirettamente, quanto l'operatore ritiene probabile un esito. In Italia si usano le quote decimali: la vincita totale è puntata × quota." },
          { type: "example", title: "Esempio", text: "Punti 10 € su una quota di 2,50: se l'esito si verifica ricevi 25 € (10 € di puntata + 15 € di guadagno netto). Se non si verifica perdi i 10 €." },
          { type: "p", text: "Per approfondire formati, probabilità implicita e margine, leggi la guida dedicata a come leggere le quote." },
        ],
      },
      {
        id: "tipologie",
        title: "I mercati più comuni",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "1X2 (esito finale)", text: "Vittoria della squadra di casa (1), pareggio (X) o vittoria della squadra ospite (2) al termine dei tempi regolamentari." },
              { title: "Over/Under", text: "Il totale di gol o punti sarà sopra (Over) o sotto (Under) una soglia, ad esempio 2,5 gol." },
              { title: "Goal/No goal", text: "Entrambe le squadre segnano almeno un gol (Goal) oppure almeno una non segna (No goal)." },
              { title: "Handicap", text: "Si assegna un vantaggio o svantaggio virtuale a una squadra, per rendere più equilibrato un confronto con un chiaro favorito." },
              { title: "Multipla", text: "Più selezioni in un'unica giocata: le quote si moltiplicano, ma basta un esito sbagliato per perdere tutta la giocata." },
            ],
          },
        ],
      },
      {
        id: "strategie",
        title: "Un approccio informato",
        blocks: [
          { type: "p", text: "Nessun metodo garantisce vincite. Si può però evitare di giocare alla cieca:" },
          {
            type: "list",
            items: [
              "Informati su formazioni, infortuni, calendario e motivazioni prima di valutare un evento.",
              "Concentrati su pochi campionati che conosci bene invece di giocare su tutto.",
              "Confronta le quote tra più operatori: la stessa previsione può essere pagata in modo diverso.",
              "Diffida di chi vende pronostici \"sicuri\" o sistemi infallibili: non esistono.",
            ],
          },
        ],
      },
      {
        id: "bankroll",
        title: "Gestione del budget",
        blocks: [
          { type: "p", text: "Decidi in anticipo quanto sei disposto a spendere in un mese, come faresti per un abbonamento o una cena fuori, e non superarlo. Molti preferiscono puntate piccole e costanti, così una serie di risultati negativi non esaurisce il budget in poche giocate." },
          { type: "example", title: "Esempio", text: "Con un budget mensile di 50 € e puntate da 2 €, servono 25 giocate perse per esaurirlo: hai il tempo di fermarti e valutare." },
        ],
      },
      {
        id: "errori",
        title: "Errori comuni da evitare",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Inseguire le perdite", text: "Aumentare le puntate per recuperare quanto perso è il comportamento più pericoloso: porta a perdere di più e più in fretta." },
              { title: "Giocare con il cuore", text: "Puntare sempre sulla propria squadra rende difficile una valutazione obiettiva." },
              { title: "Confondere quota bassa e sicurezza", text: "Una quota bassa indica un esito probabile, non certo. Le sorprese sono parte dello sport." },
              { title: "Multiple troppo lunghe", text: "Più selezioni aggiungi, più cresce la quota ma crolla la probabilità che siano tutte corrette." },
            ],
          },
        ],
      },
      {
        id: "responsabile",
        title: "Gioco responsabile",
        blocks: [
          {
            type: "list",
            items: [
              "Imposta limiti di deposito e di tempo direttamente nel tuo conto di gioco: gli operatori ADM devono offrirli.",
              "Non giocare per risolvere problemi economici e non usare denaro destinato ad altre spese.",
              "Fai pause regolari e non giocare quando sei stanco, arrabbiato o hai bevuto.",
              "Se senti di perdere il controllo puoi chiedere l'autoesclusione da tutti gli operatori ADM.",
            ],
          },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "come-leggere-le-quote",
    title: "Come leggere le quote sportive",
    description: "Quote decimali, frazionarie e americane, probabilità implicita e margine dell'operatore spiegati con esempi.",
    category: "quote-e-probabilita",
    readTime: "5 min",
    updatedAt: "13 ottobre 2026",
    image: null,
    featured: true,
    sections: [
      {
        id: "formati",
        title: "I tre formati delle quote",
        blocks: [
          {
            type: "table",
            caption: "Lo stesso esito espresso nei tre formati",
            head: ["Formato", "Esempio", "Come si legge"],
            rows: [
              ["Decimale (Italia, Europa)", "2,50", "Vincita totale = puntata × 2,50"],
              ["Frazionario (Regno Unito)", "3/2", "Guadagno netto di 3 per ogni 2 puntati"],
              ["Americano (Stati Uniti)", "+150", "Guadagno netto di 150 su 100 puntati"],
            ],
          },
          { type: "p", text: "Sul sito tutte le quote sono in formato decimale con due cifre, come sui siti degli operatori italiani." },
        ],
      },
      {
        id: "probabilita",
        title: "Dalla quota alla probabilità implicita",
        blocks: [
          { type: "p", text: "Dividendo 1 per la quota decimale si ottiene la probabilità che la quota \"implica\", cioè quella che l'operatore sta di fatto prezzando." },
          { type: "example", title: "Esempio", text: "Quota 2,00 → 1 / 2,00 = 50%. Quota 1,50 → 1 / 1,50 ≈ 66,7%. Quota 4,00 → 1 / 4,00 = 25%." },
        ],
      },
      {
        id: "margine",
        title: "Il margine dell'operatore",
        blocks: [
          { type: "p", text: "Se sommi le probabilità implicite di tutti gli esiti di un mercato ottieni un valore superiore al 100%. La differenza è il margine (o aggio) dell'operatore: è il motivo per cui, nel lungo periodo, chi gioca perde in media." },
          { type: "example", title: "Esempio su un 1X2", text: "Quote 2,10 / 3,40 / 3,60 → 47,6% + 29,4% + 27,8% = 104,8%. Il margine è circa il 4,8%." },
          { type: "callout", tone: "info", title: "Perché confrontare le quote", text: "Operatori diversi applicano margini diversi. Confrontarle non cambia la probabilità dell'evento, ma ti permette di scegliere l'offerta che paga meglio lo stesso esito." },
        ],
      },
      {
        id: "variazioni",
        title: "Perché le quote cambiano",
        blocks: [
          {
            type: "list",
            items: [
              "Notizie su formazioni, infortuni o condizioni meteo.",
              "Volume di giocate su un esito: l'operatore riequilibra il proprio rischio.",
              "Durante la partita, ogni evento (gol, espulsione, break nel tennis) modifica le probabilità.",
            ],
          },
          { type: "p", text: "Per questo ogni quota sul sito riporta l'orario dell'ultimo aggiornamento: il valore che conta è sempre quello sul sito dell'operatore al momento della giocata." },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "analizzare-una-partita-di-calcio",
    title: "Come analizzare una partita di calcio",
    description: "Quali dati guardare prima di valutare una partita: classifica, forma, precedenti, assenze e calendario. Senza promesse di vincita.",
    category: "analisi",
    readTime: "7 min",
    updatedAt: "13 ottobre 2026",
    image: null,
    featured: true,
    sections: [
      {
        id: "premessa",
        title: "Una premessa onesta",
        blocks: [
          { type: "p", text: "Analizzare una partita aiuta a capire meglio lo sport e a evitare scelte impulsive, ma non elimina l'incertezza: il calcio è uno degli sport con più risultati a sorpresa. Nessuna analisi trasforma una scommessa in un guadagno sicuro." },
        ],
      },
      {
        id: "classifica",
        title: "Classifica e rendimento",
        blocks: [
          { type: "p", text: "La classifica dice dove sono le squadre, ma i numeri dietro i punti dicono di più: gol fatti e subiti, media gol a partita, differenza reti. Una squadra con molti pareggi e pochi gol subiti ha caratteristiche diverse da una con le stesse vittorie ottenute segnando tanto." },
          { type: "p", text: "Nelle schede partita del sito trovi queste statistiche affiancate per le due squadre." },
        ],
      },
      {
        id: "forma",
        title: "Forma recente e precedenti",
        blocks: [
          { type: "p", text: "Le ultime cinque partite mostrano il momento di una squadra meglio della classifica generale, soprattutto a inizio stagione. I precedenti diretti vanno presi con cautela: rose e allenatori cambiano spesso da un anno all'altro." },
        ],
      },
      {
        id: "contesto",
        title: "Il contesto della partita",
        blocks: [
          {
            type: "list",
            items: [
              "Assenze per infortunio o squalifica, soprattutto di portiere e attaccanti.",
              "Impegni ravvicinati: una squadra impegnata in coppa a metà settimana può fare turnover.",
              "Motivazioni: lotta per il titolo, per la salvezza o partita senza obiettivi.",
              "Fattore campo e condizioni del terreno di gioco.",
            ],
          },
        ],
      },
      {
        id: "mercati",
        title: "Collegare l'analisi al mercato giusto",
        blocks: [
          {
            type: "table",
            head: ["Se l'analisi suggerisce…", "Mercato da considerare"],
            rows: [
              ["Una squadra nettamente più forte", "1X2 o handicap"],
              ["Due squadre che segnano e subiscono molto", "Over/Under, Goal/No goal"],
              ["Partita molto tattica ed equilibrata", "Under, pareggio"],
            ],
          },
          { type: "callout", tone: "warn", title: "Attenzione", text: "Se ti accorgi di cercare \"conferme\" per una giocata già decisa, fermati: è il modo più comune per ingannarsi da soli." },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "gestione-del-budget",
    title: "Gestione del budget di gioco",
    description: "Come stabilire un budget, quali limiti impostare sul conto di gioco e quali strumenti offre la legge italiana per mantenere il controllo.",
    category: "gestione-del-budget",
    readTime: "6 min",
    updatedAt: "13 ottobre 2026",
    image: null,
    sections: [
      {
        id: "budget",
        title: "Stabilire un budget",
        blocks: [
          { type: "p", text: "Il budget di gioco è la somma che decidi di destinare al gioco in un periodo – di solito un mese – sapendo che potresti perderla tutta senza conseguenze sulle altre spese. Va deciso a mente fredda, prima di iniziare, e non va integrato quando finisce." },
          { type: "example", title: "Esempio", text: "Entrate disponibili dopo spese fisse e risparmi: 200 € al mese per il tempo libero. Decidi che il gioco ne vale al massimo 30 €. Quando i 30 € sono finiti, ci si ferma fino al mese successivo." },
        ],
      },
      {
        id: "puntate",
        title: "Puntate piccole e costanti",
        blocks: [
          { type: "p", text: "Puntare ogni volta una piccola parte del budget, sempre la stessa, rende il gioco più prevedibile e allunga il tempo per riflettere. Aumentare le puntate dopo una perdita, al contrario, accelera le perdite." },
        ],
      },
      {
        id: "limiti",
        title: "I limiti sul conto di gioco",
        blocks: [
          { type: "p", text: "Gli operatori con concessione ADM devono permetterti di impostare limiti sul tuo conto. Conviene farlo appena apri il conto:" },
          {
            type: "list",
            items: [
              "Limite di deposito giornaliero, settimanale o mensile.",
              "Limite di tempo di gioco e promemoria periodici.",
              "Autoesclusione temporanea o permanente da un operatore.",
              "Autoesclusione da tutti gli operatori italiani, gestita dall'ADM.",
            ],
          },
        ],
      },
      {
        id: "segnali",
        title: "Segnali da non ignorare",
        blocks: [
          {
            type: "list",
            items: [
              "Giochi più di quanto avevi deciso o per più tempo.",
              "Pensi spesso al gioco o a come recuperare le perdite.",
              "Nascondi il gioco a familiari o amici.",
              "Usi soldi destinati ad altro o chiedi prestiti per giocare.",
            ],
          },
          { type: "callout", tone: "warn", title: "Puoi chiedere aiuto", text: "Se riconosci uno o più di questi segnali, il Telefono Verde Nazionale dell'Istituto Superiore di Sanità (800 558 822) offre ascolto gratuito e anonimo." },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-sul-tennis",
    title: "Tennis: mercati e fattori da considerare",
    description: "Vincente, risultato in set e totale game; superfici, formato del torneo e condizione fisica: cosa conta nel tennis.",
    category: "sport",
    readTime: "7 min",
    updatedAt: "13 ottobre 2026",
    image: null,
    sections: [
      {
        id: "mercati",
        title: "I mercati principali",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Vincente", text: "Chi vince l'incontro. Nel tennis non esiste il pareggio, quindi gli esiti sono due." },
              { title: "Risultato in set", text: "Il punteggio finale in set, ad esempio 2-0 o 2-1 nei match al meglio dei tre set." },
              { title: "Totale game", text: "Il numero complessivo di game giocati sopra o sotto una soglia." },
              { title: "Handicap game", text: "Un vantaggio virtuale in game assegnato al giocatore sfavorito." },
            ],
          },
        ],
      },
      {
        id: "superfici",
        title: "Le superfici",
        blocks: [
          {
            type: "table",
            head: ["Superficie", "Caratteristiche"],
            rows: [
              ["Terra battuta", "Rimbalzo alto e lento, scambi lunghi, favorisce i giocatori da fondo campo."],
              ["Erba", "Rimbalzo basso e veloce, premia servizio e gioco di volo."],
              ["Cemento", "Velocità intermedia; indoor le condizioni sono più costanti."],
            ],
          },
        ],
      },
      {
        id: "fattori",
        title: "Altri fattori",
        blocks: [
          {
            type: "list",
            items: [
              "Formato: nei tornei del Grande Slam maschili si gioca al meglio dei cinque set, il favorito ha più margine per recuperare.",
              "Condizione fisica e partite giocate nei giorni precedenti.",
              "Ritiri: le regole di pagamento in caso di ritiro cambiano da operatore a operatore, leggile prima.",
              "Precedenti sulla stessa superficie, più indicativi di quelli generali.",
            ],
          },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "basket-over-under-handicap",
    title: "Basket: Over/Under e handicap spiegati",
    description: "Come funzionano totale punti e handicap nel basket, perché i supplementari contano e cosa cambia tra NBA e campionati europei.",
    category: "sport",
    readTime: "6 min",
    updatedAt: "13 ottobre 2026",
    image: null,
    sections: [
      {
        id: "supplementari",
        title: "Prima di tutto: i supplementari",
        blocks: [
          { type: "p", text: "Nel basket non esiste il pareggio: in caso di parità si giocano i supplementari. Molti mercati, compreso il vincente, includono i supplementari; altri si riferiscono ai soli tempi regolamentari. Controlla sempre la descrizione del mercato sul sito dell'operatore." },
        ],
      },
      {
        id: "totale",
        title: "Over/Under punti",
        blocks: [
          { type: "p", text: "Si sceglie se il totale dei punti segnati dalle due squadre sarà sopra o sotto una soglia, di solito con mezzo punto (es. 224,5) per evitare la parità." },
          { type: "example", title: "Esempio", text: "Soglia 224,5: con risultato finale 112-110 (222 punti) vince l'Under; con 118-109 (227 punti) vince l'Over." },
        ],
      },
      {
        id: "handicap",
        title: "Handicap punti",
        blocks: [
          { type: "p", text: "Si aggiunge o sottrae un numero di punti al risultato di una squadra. Con handicap -5,5 la favorita deve vincere con almeno 6 punti di scarto; con +5,5 la sfavorita può anche perdere di 5." },
        ],
      },
      {
        id: "campionati",
        title: "NBA e campionati europei",
        blocks: [
          {
            type: "table",
            head: ["", "NBA", "Europa (Serie A, EuroLeague)"],
            rows: [
              ["Durata", "4 quarti da 12 minuti", "4 quarti da 10 minuti"],
              ["Punti medi", "Totali più alti", "Totali più bassi"],
              ["Calendario", "Partite molto ravvicinate, back-to-back", "Di solito una o due partite a settimana"],
            ],
          },
          { type: "p", text: "Per questo le soglie dei totali sono molto diverse tra NBA ed Europa: non confrontarle tra loro." },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-in-diretta",
    title: "Scommesse in diretta: come funzionano",
    description: "Perché le quote live cambiano di continuo, cosa sono le sospensioni e il cash out, e perché il gioco in diretta richiede più attenzione.",
    category: "in-diretta",
    readTime: "5 min",
    updatedAt: "13 ottobre 2026",
    image: null,
    sections: [
      {
        id: "cosa",
        title: "Cosa cambia rispetto alla pre-partita",
        blocks: [
          { type: "p", text: "Durante l'evento le quote vengono ricalcolate di continuo in base a punteggio, tempo trascorso ed episodi. Dopo un gol, un'espulsione o un break nel tennis il mercato viene spesso sospeso per alcuni secondi e riaperto con nuove quote." },
        ],
      },
      {
        id: "cashout",
        title: "Il cash out",
        blocks: [
          { type: "p", text: "Molti operatori permettono di chiudere una giocata prima della fine dell'evento, incassando un importo calcolato sulle quote del momento. Il valore offerto include comunque il margine dell'operatore." },
        ],
      },
      {
        id: "rischi",
        title: "Perché richiede più attenzione",
        blocks: [
          {
            type: "list",
            items: [
              "Le decisioni sono rapide e lasciano poco tempo per riflettere.",
              "È facile fare molte giocate in poco tempo e perdere il conto della spesa.",
              "Le immagini in TV o in streaming possono essere in ritardo rispetto ai dati dell'operatore.",
            ],
          },
          { type: "callout", tone: "warn", title: "Un consiglio pratico", text: "Se giochi in diretta, imposta un limite di spesa per l'evento prima che inizi e non modificarlo durante la partita." },
        ],
      },
    ],
  },
];

export const guidePath = (g: Pick<Guide, "slug">) => `/guide/${g.slug}`;
export const categoryPath = (c: Pick<GuideCategory, "slug">) => `/guide/categoria/${c.slug}`;
export const findGuide = (slug?: string) => guides.find((g) => g.slug === slug);
export const findCategory = (slug?: string) => guideCategories.find((c) => c.slug === slug);
export const guidesIn = (cat: string) => guides.filter((g) => g.category === cat);

export const guideMeta = (g: Guide) => ({ path: guidePath(g), title: g.title, description: g.description });
export const categoryMeta = (c: GuideCategory) => ({
  path: categoryPath(c),
  title: `Guide: ${c.name.toLowerCase()}`,
  description: c.description,
});
export const guideRoutes = () => [...guides.map(guideMeta), ...guideCategories.filter((c) => guidesIn(c.slug).length).map(categoryMeta)];
