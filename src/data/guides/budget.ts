// Guides – category "Gestione del budget" (budget, tutela, pagamenti, bonus). Inline links: [testo](/percorso).
import type { Guide } from "../guides";
import imgAutoesclusione from "../../assets/guides/autoesclusione-e-limiti-di-gioco.svg";
import imgAiuto from "../../assets/guides/gioco-problematico-dove-chiedere-aiuto.svg";
import imgPagamenti from "../../assets/guides/depositi-e-prelievi.svg";
import imgBonus from "../../assets/guides/bonus-requisiti-di-giocata.svg";

const UPDATED = "13 ottobre 2026";

export const budgetGuides: Guide[] = [
  {
    slug: "autoesclusione-e-limiti-di-gioco",
    title: "Autoesclusione e limiti di gioco: come funzionano",
    description:
      "Limiti di deposito, pause, autoesclusione da un operatore o da tutti gli operatori autorizzati: cosa prevede la normativa italiana e come attivarli.",
    category: "gestione-del-budget",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgAutoesclusione,
    sections: [
      {
        id: "limiti",
        title: "I limiti sul conto",
        blocks: [
          {
            type: "p",
            text: "Gli operatori autorizzati devono permetterti di impostare limiti di deposito e di gestire il tempo di gioco. Al momento della registrazione ti viene chiesto di fissare un limite di deposito, che puoi modificare in seguito dall'area personale del conto.",
          },
          {
            type: "list",
            items: [
              "Ridurre un limite ha effetto subito.",
              "Aumentarlo richiede in genere un periodo di attesa, per evitare decisioni prese d'impulso.",
              "I limiti valgono per il singolo conto: se hai conti presso più operatori, considera la somma.",
            ],
          },
        ],
      },
      {
        id: "autoesclusione",
        title: "L'autoesclusione",
        blocks: [
          {
            type: "p",
            text: "L'autoesclusione blocca l'accesso al gioco: non puoi depositare né giocare, e l'operatore non può inviarti comunicazioni promozionali. Esistono due livelli.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Da un singolo operatore",
                text: "Si richiede dall'area personale del conto e riguarda solo quell'operatore.",
              },
              {
                title: "Da tutti gli operatori autorizzati",
                text: "Si richiede dal conto di qualsiasi operatore o tramite i servizi dell'ADM e vale per tutto il gioco online legale in Italia.",
              },
            ],
          },
          {
            type: "table",
            head: ["Durata", "Come funziona"],
            rows: [
              ["Temporanea", "Per un periodo prefissato (ad esempio 30, 60 o 90 giorni); al termine il conto si riattiva."],
              ["A tempo indeterminato", "Resta attiva finché non la revochi, e la revoca è possibile solo dopo un periodo minimo (attualmente sei mesi)."],
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Regole aggiornate",
            text: "Durate e modalità sono fissate dalla normativa e possono cambiare: fai riferimento alle informazioni pubblicate dall'ADM e alla sezione \"gioco responsabile\" del tuo operatore.",
          },
        ],
      },
      {
        id: "altri-strumenti",
        title: "Altri strumenti utili",
        blocks: [
          {
            type: "list",
            items: [
              "Pause brevi (\"time out\") di 24 ore o qualche giorno, offerte da molti operatori.",
              "Software di blocco dei siti di gioco da installare su computer e smartphone.",
              "Disattivare le notifiche e le comunicazioni promozionali dell'operatore.",
              "Chiedere alla banca di bloccare i pagamenti verso siti di gioco, se il servizio è disponibile.",
            ],
          },
          {
            type: "p",
            text: "Se senti di aver perso il controllo, oltre a questi strumenti puoi chiedere aiuto: vedi [segnali di gioco problematico e dove chiedere aiuto](/guide/gioco-problematico-dove-chiedere-aiuto).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Durante l'autoesclusione posso prelevare il saldo?",
        a: "Sì, il saldo resta tuo e puoi chiederne il prelievo secondo le modalità dell'operatore.",
      },
      {
        q: "Posso aprire un conto nuovo mentre sono autoescluso?",
        a: "No, se l'autoesclusione riguarda tutti gli operatori: il codice fiscale viene bloccato per tutto il gioco online autorizzato.",
      },
    ],
    related: ["gioco-problematico-dove-chiedere-aiuto", "gestione-del-budget", "aprire-un-conto-di-gioco"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "gioco-problematico-dove-chiedere-aiuto",
    title: "Segnali di gioco problematico e dove chiedere aiuto",
    description:
      "Come riconoscere quando il gioco smette di essere un divertimento, alcune domande per un'autovalutazione e i servizi gratuiti a cui rivolgersi, anche per i familiari.",
    category: "gestione-del-budget",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgAiuto,
    sections: [
      {
        id: "cos-e",
        title: "Quando il gioco diventa un problema",
        blocks: [
          {
            type: "p",
            text: "Il disturbo da gioco d'azzardo è riconosciuto come una dipendenza e si può curare. Non riguarda solo chi gioca somme alte: il segnale principale è la perdita di controllo, cioè giocare più tempo o più denaro di quanto si vorrebbe, anche quando questo causa problemi.",
          },
        ],
      },
      {
        id: "autovalutazione",
        title: "Alcune domande da farsi",
        blocks: [
          {
            type: "list",
            items: [
              "Ti è capitato di sentire il bisogno di giocare somme sempre più alte?",
              "Hai mai mentito a familiari o amici su quanto giochi o su quanto hai perso?",
              "Torni a giocare per recuperare le perdite?",
              "Il gioco ti ha causato problemi di soldi, di lavoro o nelle relazioni?",
              "Ti senti irritabile o in ansia quando provi a smettere o a giocare meno?",
            ],
          },
          {
            type: "callout",
            tone: "warn",
            title: "Se hai risposto sì",
            text: "Anche una sola risposta affermativa è un buon motivo per parlarne con qualcuno. Non serve aspettare che la situazione peggiori.",
          },
        ],
      },
      {
        id: "aiuto",
        title: "A chi rivolgersi",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "Telefono Verde Nazionale",
                text: "800 558 822, servizio dell'Istituto Superiore di Sanità: gratuito e anonimo, offre ascolto e informazioni sui servizi del territorio.",
              },
              {
                title: "Servizi per le dipendenze (SerD)",
                text: "I servizi pubblici delle ASL si occupano anche di gioco d'azzardo, con percorsi gratuiti e riservati.",
              },
              {
                title: "Gruppi di auto-aiuto",
                text: "Associazioni come i Giocatori Anonimi offrono incontri tra persone che vivono lo stesso problema.",
              },
              {
                title: "Il medico di famiglia",
                text: "Può essere un primo punto di contatto per orientarsi verso i servizi adatti.",
              },
            ],
          },
        ],
      },
      {
        id: "familiari",
        title: "Per familiari e amici",
        blocks: [
          {
            type: "list",
            items: [
              "Parlane con calma, senza accuse, e proponi di chiedere aiuto insieme.",
              "Evita di saldare i debiti di gioco della persona: rischia di rimandare la presa di coscienza.",
              "Anche i familiari possono rivolgersi al Telefono Verde e ai servizi per le dipendenze, e ci sono gruppi dedicati a loro.",
            ],
          },
          {
            type: "p",
            text: "Tra gli strumenti pratici per fermarsi c'è l'[autoesclusione](/guide/autoesclusione-e-limiti-di-gioco), che blocca l'accesso a tutti i siti autorizzati.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Chiamare il Telefono Verde ha un costo?",
        a: "No, la chiamata è gratuita ed è possibile restare anonimi.",
      },
      {
        q: "Serve l'impegnativa del medico per i SerD?",
        a: "Di norma ai servizi per le dipendenze si può accedere direttamente; il Telefono Verde può indicarti il servizio più vicino e come contattarlo.",
      },
    ],
    related: ["autoesclusione-e-limiti-di-gioco", "gestione-del-budget", "caso-e-probabilita"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "depositi-e-prelievi",
    title: "Depositi e prelievi: metodi, tempi e verifiche",
    description:
      "Come si versa e si preleva da un conto di gioco, quanto tempo serve, perché il primo prelievo richiede la verifica dei documenti e cosa fare se un pagamento tarda.",
    category: "gestione-del-budget",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgPagamenti,
    sections: [
      {
        id: "metodi",
        title: "I metodi più diffusi",
        blocks: [
          {
            type: "table",
            head: ["Metodo", "Deposito", "Prelievo"],
            rows: [
              ["Carta di debito o prepagata", "Di solito immediato", "Alcuni giorni lavorativi"],
              ["Bonifico bancario", "Uno o più giorni", "Alcuni giorni lavorativi"],
              ["Portafogli elettronici", "Di solito immediato", "Spesso più rapido"],
              ["Voucher e ricariche in punto vendita", "Immediato", "Non sempre disponibile"],
            ],
            caption: "Tempi indicativi: dipendono dall'operatore e dal circuito di pagamento",
          },
          {
            type: "p",
            text: "Ogni metodo di pagamento deve essere intestato al titolare del conto. Gli operatori indicano importi minimi e massimi e se applicano commissioni.",
          },
        ],
      },
      {
        id: "verifica",
        title: "La verifica prima del prelievo",
        blocks: [
          {
            type: "p",
            text: "Prima del primo prelievo l'operatore deve aver verificato la tua identità: se il documento non è ancora stato approvato, il prelievo resta in attesa. Per motivi antiriciclaggio può chiedere anche una prova della titolarità del metodo di pagamento.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Un consiglio",
            text: "Carica il documento subito dopo la registrazione: eviti attese quando vorrai prelevare. Vedi [aprire un conto di gioco](/guide/aprire-un-conto-di-gioco).",
          },
        ],
      },
      {
        id: "ritardi",
        title: "Se un prelievo tarda",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Controlla lo stato della richiesta nell'area personale e che i documenti siano approvati.",
              "Verifica di aver rispettato eventuali condizioni di un bonus attivo, che possono bloccare il prelievo.",
              "Contatta l'assistenza dell'operatore e conserva le comunicazioni.",
              "Se il problema non si risolve, puoi presentare reclamo all'operatore e, se necessario, segnalarlo all'ADM.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Posso prelevare su un metodo diverso da quello usato per depositare?",
        a: "Dipende dall'operatore: spesso il prelievo va effettuato sullo stesso metodo o su un conto bancario intestato a te.",
      },
      {
        q: "Annullare un prelievo per continuare a giocare è una buona idea?",
        a: "Alcuni operatori lo permettono, ma è un comportamento a rischio: se lo fai spesso, considera di impostare limiti più stretti.",
      },
    ],
    related: ["aprire-un-conto-di-gioco", "bonus-requisiti-di-giocata", "siti-scommesse-legali"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "bonus-requisiti-di-giocata",
    title: "Bonus: come leggere i requisiti di giocata",
    description:
      "Requisito di giocata, quota minima, scadenza e bonus non prelevabili: come leggere le condizioni di un'offerta prima di accettarla.",
    category: "gestione-del-budget",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgBonus,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è un bonus",
        blocks: [
          {
            type: "p",
            text: "Un bonus è un importo che l'operatore accredita sul conto a determinate condizioni. Quasi sempre non è denaro prelevabile subito: per convertirlo in saldo reale bisogna rispettare dei requisiti. Leggerli prima di accettare evita sorprese.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Un bonus non è un guadagno",
            text: "Per sbloccarlo devi giocare una somma diverse volte superiore al bonus stesso, con il margine dell'operatore che si applica a ogni giocata.",
          },
        ],
      },
      {
        id: "condizioni",
        title: "Le condizioni da controllare",
        blocks: [
          {
            type: "table",
            head: ["Condizione", "Cosa significa"],
            rows: [
              ["Requisito di giocata (rollover)", "Quante volte va giocato l'importo del bonus. Requisito 5x su 10 € = 50 € di giocate."],
              ["Quota minima", "Solo le giocate con quota pari o superiore (es. 1,50) contano per il requisito."],
              ["Scadenza", "Entro quanti giorni va completato il requisito; dopo, il bonus decade."],
              ["Deposito minimo", "L'importo da versare per ricevere l'offerta, se previsto."],
              ["Giochi validi", "Su quali sport, mercati o tipi di giocata il bonus può essere usato."],
            ],
          },
        ],
      },
      {
        id: "esempio",
        title: "Un esempio completo",
        blocks: [
          {
            type: "example",
            title: "Bonus di 10 € con requisito 5x, quota minima 1,50, scadenza 30 giorni",
            text: "Per convertire il bonus devi effettuare 50 € di giocate su quote da 1,50 in su entro 30 giorni. Una singola a quota 1,40 non conta. Se al trentesimo giorno hai giocato 40 €, il bonus e le eventuali vincite collegate vengono annullati.",
          },
          {
            type: "p",
            text: "Nella pagina [Bonus](/bonus) le condizioni principali di ogni offerta sono riportate in campi separati, così da confrontarle in modo oggettivo.",
          },
        ],
      },
      {
        id: "attenzione",
        title: "Cosa tenere a mente",
        blocks: [
          {
            type: "list",
            items: [
              "Non accettare un bonus solo perché c'è: se le condizioni ti spingono a giocare più di quanto avevi deciso, rinuncia.",
              "Un bonus attivo può bloccare i prelievi finché il requisito non è completato.",
              "Le condizioni vincolanti sono sempre quelle pubblicate dall'operatore.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Posso rinunciare a un bonus già accreditato?",
        a: "Di solito sì, dall'area personale o tramite assistenza; il bonus e le vincite collegate vengono rimossi.",
      },
      {
        q: "Perché il sito non usa espressioni come \"bonus gratis\"?",
        a: "Perché un bonus ha sempre condizioni da rispettare, e la normativa italiana limita fortemente la comunicazione promozionale sul gioco.",
      },
    ],
    related: ["depositi-e-prelievi", "gestione-del-budget", "calcolare-vincita-multipla-sistema"],
  },
];
