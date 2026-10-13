// Guides – category "Per principianti". Inline links: [testo](/percorso).
import type { Guide } from "../guides";
import imgLegali from "../../assets/guides/siti-scommesse-legali.svg";
import imgConto from "../../assets/guides/aprire-un-conto-di-gioco.svg";
import imgGlossario from "../../assets/guides/glossario-scommesse.svg";
import imgTipi from "../../assets/guides/singola-multipla-sistema.svg";

const UPDATED = "13 ottobre 2026";

export const principiantiGuides: Guide[] = [
  {
    slug: "siti-scommesse-legali",
    title: "Come riconoscere un sito di scommesse legale",
    description:
      "Concessione ADM, numero di concessione, elenco ufficiale e siti oscurati: come verificare in pochi minuti che un operatore è autorizzato in Italia.",
    category: "principianti",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgLegali,
    sections: [
      {
        id: "perche",
        title: "Perché conta",
        blocks: [
          {
            type: "p",
            text: "In Italia il gioco a distanza è riservato agli operatori con una concessione rilasciata dall'Agenzia delle Dogane e dei Monopoli (ADM). Solo con loro valgono le tutele previste dalla legge: separazione del denaro dei giocatori, verifica dell'età, limiti di deposito, autoesclusione e un'autorità a cui rivolgersi in caso di problemi.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Siti senza concessione",
            text: "Un sito non autorizzato non dà alcuna garanzia su pagamenti, vincite e dati personali, e giocarci può esporre anche il giocatore a sanzioni. Se un sito offre condizioni \"troppo belle per essere vere\" o non mostra la concessione, lascia perdere.",
          },
        ],
      },
      {
        id: "verifica",
        title: "La verifica in quattro passi",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Cerca a fondo pagina il numero di concessione ADM e la ragione sociale dell'operatore.",
              "Controlla che il dominio del sito compaia nell'elenco dei siti autorizzati pubblicato sul sito ufficiale dell'ADM (adm.gov.it).",
              "Verifica che siano presenti il divieto di gioco ai minori di 18 anni e i riferimenti al gioco responsabile.",
              "Diffida di link ricevuti via messaggio o social che portano a indirizzi simili ma non identici a quelli dell'elenco.",
            ],
          },
          {
            type: "p",
            text: "Su QuotaGuru compaiono solo operatori con concessione valida, verificata come descritto nella pagina [Metodologia](/metodologia).",
          },
        ],
      },
      {
        id: "oscurati",
        title: "I siti oscurati",
        blocks: [
          {
            type: "p",
            text: "L'ADM tiene un elenco di siti non autorizzati che i fornitori di connettività italiani devono bloccare. Se apri uno di questi indirizzi vedi una pagina informativa al posto del sito. Usare VPN o indirizzi alternativi per aggirare il blocco non rende il sito legale.",
          },
        ],
      },
      {
        id: "segnali",
        title: "Altri segnali utili",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "Termini chiari",
                text: "Regolamento, condizioni delle offerte e regole di pagamento delle scommesse sono pubblici e in italiano.",
              },
              {
                title: "Assistenza raggiungibile",
                text: "Sono indicati recapiti dell'assistenza clienti e modalità di reclamo.",
              },
              {
                title: "Strumenti di tutela",
                text: "Nel conto trovi limiti di deposito, promemoria e autoesclusione. Vedi la guida su [autoesclusione e limiti](/guide/autoesclusione-e-limiti-di-gioco).",
              },
              {
                title: "Nessuna pressione",
                text: "Un operatore serio non promette vincite e non ti spinge a depositare con messaggi insistenti.",
              },
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Un sito con estensione .it è sempre autorizzato?",
        a: "No. Il dominio da solo non basta: l'unico riferimento affidabile è l'elenco dei siti autorizzati dell'ADM.",
      },
      {
        q: "Posso giocare su un sito estero con licenza di un altro Paese?",
        a: "In Italia sono legali solo gli operatori con concessione ADM. Una licenza estera non è sufficiente per offrire gioco ai residenti in Italia.",
      },
      {
        q: "Cosa faccio se ho già un conto su un sito non autorizzato?",
        a: "Smetti di depositare e prova a prelevare il saldo. Se hai problemi puoi segnalare il sito all'ADM.",
      },
    ],
    related: ["aprire-un-conto-di-gioco", "autoesclusione-e-limiti-di-gioco", "depositi-e-prelievi"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "aprire-un-conto-di-gioco",
    title: "Aprire un conto di gioco: cosa serve",
    description:
      "Requisiti, documenti, verifica dell'identità e limiti da impostare subito: come funziona la registrazione presso un operatore autorizzato.",
    category: "principianti",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgConto,
    sections: [
      {
        id: "requisiti",
        title: "I requisiti",
        blocks: [
          {
            type: "list",
            items: [
              "Avere almeno 18 anni: la verifica dell'età è obbligatoria.",
              "Un codice fiscale italiano e un documento d'identità valido (carta d'identità, patente o passaporto).",
              "Un indirizzo email e un numero di cellulare a te intestati.",
              "Un metodo di pagamento intestato a te: non si possono usare carte o conti di altre persone.",
            ],
          },
          {
            type: "p",
            text: "Si può avere un solo conto di gioco per operatore, e i dati devono essere veri: in caso contrario l'operatore può bloccare il conto e trattenere le vincite.",
          },
        ],
      },
      {
        id: "registrazione",
        title: "Come avviene la registrazione",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Compili il modulo con dati anagrafici, residenza e codice fiscale, oppure usi l'accesso con identità digitale (SPID o CIE) se l'operatore lo prevede.",
              "Accetti il contratto di conto di gioco e l'informativa privacy.",
              "Imposti i limiti di deposito richiesti in fase di registrazione.",
              "Carichi la copia del documento: finché non è verificata il conto può avere funzioni limitate e i prelievi non sono possibili.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Tempi della verifica",
            text: "Se il documento non viene inviato entro il termine indicato dall'operatore, il conto viene sospeso. Conviene caricarlo subito, prima del primo deposito.",
          },
        ],
      },
      {
        id: "limiti",
        title: "I limiti da impostare subito",
        blocks: [
          {
            type: "p",
            text: "Il momento migliore per decidere i limiti è prima di iniziare a giocare. In genere ridurre un limite ha effetto immediato, mentre aumentarlo richiede un periodo di attesa: è una tutela pensata per evitare decisioni impulsive.",
          },
          {
            type: "table",
            head: ["Strumento", "A cosa serve"],
            rows: [
              ["Limite di deposito", "Massimo che puoi versare in un giorno, una settimana o un mese."],
              ["Promemoria di sessione", "Ti avvisa dopo un certo tempo di gioco."],
              ["Autoesclusione", "Blocca l'accesso al gioco per un periodo o a tempo indeterminato."],
            ],
          },
          {
            type: "p",
            text: "Per decidere l'importo puoi seguire la guida alla [gestione del budget](/guide/gestione-del-budget).",
          },
        ],
      },
      {
        id: "sicurezza",
        title: "Sicurezza del conto",
        blocks: [
          {
            type: "list",
            items: [
              "Usa una password unica e attiva la verifica in due passaggi se disponibile.",
              "Non condividere il conto: è personale e il titolare risponde di tutte le giocate.",
              "Controlla periodicamente la cronologia di depositi, giocate e prelievi.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Posso aprire conti presso più operatori?",
        a: "Sì, uno per operatore. Ricorda però che i limiti di deposito valgono per il singolo conto: tienine conto nel budget complessivo.",
      },
      {
        q: "Perché mi chiedono il documento se ho già inserito i dati?",
        a: "La legge impone all'operatore di verificare identità ed età del titolare, anche per prevenire frodi e riciclaggio.",
      },
      {
        q: "Posso chiudere il conto quando voglio?",
        a: "Sì, puoi chiedere la chiusura all'operatore. Se il motivo è il controllo del gioco, valuta anche l'autoesclusione.",
      },
    ],
    related: ["siti-scommesse-legali", "depositi-e-prelievi", "autoesclusione-e-limiti-di-gioco"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "glossario-scommesse",
    title: "Glossario delle scommesse dalla A alla Z",
    description:
      "Aggio, cash out, handicap, rollover, sistema e gli altri termini più usati nelle scommesse sportive, spiegati in parole semplici.",
    category: "principianti",
    readTime: "9 min",
    updatedAt: UPDATED,
    image: imgGlossario,
    sections: [
      {
        id: "a-c",
        title: "Dalla A alla C",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "ADM", text: "Agenzia delle Dogane e dei Monopoli: rilascia le concessioni e vigila sul gioco legale in Italia." },
              { title: "Aggio (margine)", text: "La parte che l'operatore trattiene, incorporata nelle quote. Vedi [come leggere le quote](/guide/come-leggere-le-quote)." },
              { title: "Antepost", text: "Scommessa su un esito di lungo periodo, come il vincitore di un campionato." },
              { title: "Autoesclusione", text: "Blocco volontario dell'accesso al gioco. Vedi la [guida dedicata](/guide/autoesclusione-e-limiti-di-gioco)." },
              { title: "Cash out", text: "Chiusura anticipata di una giocata a un valore proposto dall'operatore. Vedi la [guida al cash out](/guide/cash-out)." },
              { title: "Combo", text: "Scommessa che unisce due esiti della stessa partita, ad esempio 1 + Over 1,5." },
              { title: "Concessione", text: "Autorizzazione dell'ADM a offrire gioco in Italia. Vedi [siti legali](/guide/siti-scommesse-legali)." },
            ],
          },
        ],
      },
      {
        id: "d-h",
        title: "Dalla D alla H",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Doppia chance", text: "Copre due esiti su tre del 1X2: 1X, 12 o X2." },
              { title: "Draw no bet", text: "Se la partita finisce in pareggio la puntata viene rimborsata." },
              { title: "Expected goals (xG)", text: "Stima della probabilità che un tiro diventi gol. Vedi la [guida agli xG](/guide/expected-goals)." },
              { title: "Goal/No goal", text: "Entrambe le squadre segnano (Goal) o almeno una non segna (No goal)." },
              { title: "Handicap", text: "Vantaggio o svantaggio virtuale assegnato a una squadra. Vedi [handicap asiatico](/guide/handicap-asiatico)." },
            ],
          },
        ],
      },
      {
        id: "l-q",
        title: "Dalla L alla Q",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Live (in diretta)", text: "Scommessa effettuata a evento iniziato, con quote che cambiano di continuo." },
              { title: "Multipla", text: "Più selezioni in una giocata: vince solo se sono tutte corrette. Vedi [singola, multipla e sistema](/guide/singola-multipla-sistema)." },
              { title: "Multigol", text: "Il numero totale di gol cade in un intervallo, ad esempio 2-4." },
              { title: "Over/Under", text: "Il totale di gol o punti è sopra o sotto una soglia." },
              { title: "Probabilità implicita", text: "La probabilità espressa da una quota: 1 diviso la quota." },
              { title: "Quota", text: "Il moltiplicatore della puntata in caso di esito vincente." },
            ],
          },
        ],
      },
      {
        id: "r-z",
        title: "Dalla R alla Z",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Requisito di giocata (rollover)", text: "Quanto bisogna giocare prima di poter convertire un bonus. Vedi [bonus e requisiti](/guide/bonus-requisiti-di-giocata)." },
              { title: "Risultato esatto", text: "Il punteggio finale preciso della partita." },
              { title: "Sistema", text: "Insieme di multiple ricavate da più selezioni, ad esempio tutte le doppie di tre partite." },
              { title: "Singola", text: "Giocata su un solo esito." },
              { title: "Tempi regolamentari", text: "I 90 minuti più il recupero; supplementari e rigori di solito sono esclusi." },
              { title: "Value", text: "Termine usato per una quota ritenuta superiore alla probabilità reale. Valutarlo è difficile e non garantisce alcun risultato." },
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Manca un termine?",
        a: "Scrivici dalla pagina [Contatti](/contatti): aggiorniamo il glossario periodicamente.",
      },
    ],
    related: ["guida-completa-scommesse-sportive", "mercati-del-calcio", "come-leggere-le-quote"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "singola-multipla-sistema",
    title: "Singola, multipla e sistema: le differenze",
    description:
      "Tre modi di costruire una giocata, con esempi: cosa succede quando una selezione è sbagliata e perché più selezioni significano più rischio.",
    category: "principianti",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgTipi,
    sections: [
      {
        id: "singola",
        title: "La singola",
        blocks: [
          {
            type: "p",
            text: "Una giocata su un solo esito. È la forma più semplice da valutare: la probabilità di vincere è quella dell'esito scelto e la vincita è puntata × quota.",
          },
          { type: "example", title: "Esempio", text: "5 € su quota 1,90 → se vinci ricevi 9,50 €." },
        ],
      },
      {
        id: "multipla",
        title: "La multipla",
        blocks: [
          {
            type: "p",
            text: "Più selezioni in un'unica giocata: le quote si moltiplicano, ma la giocata vince solo se tutte le selezioni sono corrette. Basta un errore per perdere l'intera puntata.",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Tre selezioni a 1,80, 2,10 e 1,60 → quota totale 6,05. Con 5 € la vincita possibile è 30,24 €, ma servono tre esiti corretti su tre.",
          },
          {
            type: "p",
            text: "Il calcolo completo, compresa la probabilità, è nella guida [calcolare la vincita di multiple e sistemi](/guide/calcolare-vincita-multipla-sistema).",
          },
        ],
      },
      {
        id: "sistema",
        title: "Il sistema",
        blocks: [
          {
            type: "p",
            text: "Un sistema genera automaticamente più multiple a partire dalle stesse selezioni. Con un \"sistema 2 su 3\", ad esempio, si giocano tutte e tre le doppie possibili: si può vincere qualcosa anche sbagliando una selezione, ma la puntata totale è più alta.",
          },
          {
            type: "table",
            head: ["Tipo", "Selezioni", "Giocate generate", "Se sbagli una selezione"],
            rows: [
              ["Singola", "1", "1", "Perdi la giocata"],
              ["Multipla", "3", "1", "Perdi tutto"],
              ["Sistema 2/3", "3", "3 doppie", "Una doppia può vincere"],
            ],
          },
        ],
      },
      {
        id: "scelta",
        title: "Cosa tenere a mente",
        blocks: [
          {
            type: "list",
            items: [
              "Più selezioni aggiungi, più la quota sale e la probabilità scende: il margine dell'operatore si somma a ogni selezione.",
              "Un sistema non elimina il rischio: distribuisce la puntata su più combinazioni.",
              "Decidi la spesa totale prima di costruire la giocata, non dopo aver visto la quota finale.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Se una partita della multipla viene rinviata?",
        a: "Di solito quella selezione viene considerata con quota 1,00 e la multipla prosegue con le altre, ma le regole variano: controlla il regolamento dell'operatore.",
      },
      {
        q: "Posso combinare esiti della stessa partita in una multipla?",
        a: "Spesso no, perché sono collegati tra loro. Alcuni operatori offrono apposite \"combo\" con quote dedicate.",
      },
    ],
    related: ["calcolare-vincita-multipla-sistema", "guida-completa-scommesse-sportive", "caso-e-probabilita"],
  },
];
