// Guides – "Academy": method and discipline (fair odds, Kelly, variance, emotions) plus the cost of a bonus.
// Editorial line as everywhere: informative, no promise of winnings, no invitation to play, no links to operators.
// Figures are worked examples; the variance percentages come from exact binomial sums / simulations (see PR notes).
import type { Guide } from "../guides";
import imgQuotaEqua from "../../assets/guides/quota-equa-e-valore-atteso.svg";
import imgKelly from "../../assets/guides/criterio-di-kelly.svg";
import imgVarianza from "../../assets/guides/varianza-e-serie-negative.svg";
import imgEmozioni from "../../assets/guides/emozioni-e-disciplina.svg";
import imgCostoBonus from "../../assets/guides/quanto-costa-un-bonus.svg";

const UPDATED = "31 ottobre 2026";

export const academyGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "quota-equa-e-valore-atteso",
    title: "Quota equa e valore atteso: come leggere le probabilità del modello",
    description:
      "Cos'è la quota equa, come si ricava da una probabilità, cosa significa confrontarla con le quote di mercato e perché un modello può sbagliare.",
    category: "academy",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgQuotaEqua,
    sections: [
      {
        id: "definizione",
        title: "Cos'è la quota equa",
        blocks: [
          {
            type: "p",
            text: "La quota equa è il prezzo che avrebbe un esito se nessuno ci guadagnasse sopra: si ottiene dividendo 1 per la probabilità. Un esito stimato al 40% ha una quota equa di 2,50; uno stimato al 25% di 4,00.",
          },
          {
            type: "table",
            head: ["Probabilità", "Quota equa"],
            rows: [
              ["80%", "1,25"],
              ["60%", "1,67"],
              ["50%", "2,00"],
              ["40%", "2,50"],
              ["25%", "4,00"],
              ["10%", "10,00"],
            ],
            caption: "Quota equa = 1 ÷ probabilità. Probabilità = 1 ÷ quota equa.",
          },
          {
            type: "p",
            text: "Nelle pagine dei [pronostici](/pronostici) la quota equa compare accanto a ogni probabilità del modello. Non è una quota offerta da un operatore: è lo stesso numero scritto in un altro modo, per poterlo confrontare con le quote che si trovano in giro.",
          },
        ],
      },
      {
        id: "margine",
        title: "Perché le quote dei bookmaker sono più basse",
        blocks: [
          {
            type: "p",
            text: "Le quote degli operatori includono un margine. Se trasformi in probabilità le tre quote di un 1X2 e le sommi, ottieni più del 100%: la parte in eccesso è il guadagno dell'operatore.",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Quote 2,10 – 3,40 – 3,60. Probabilità implicite: 47,6% + 29,4% + 27,8% = 104,8%. Il margine è circa il 4,8%. Per ricavare le probabilità \"pulite\" si divide ciascuna per 1,048: 45,4%, 28,1%, 26,5%.",
          },
          {
            type: "p",
            text: "Per questo, a parità di stima, la quota di un operatore è quasi sempre più bassa della quota equa. Più il margine è alto, più la differenza cresce. Il calcolo completo è in [come leggere le quote](/guide/come-leggere-le-quote).",
          },
        ],
      },
      {
        id: "valore-atteso",
        title: "Il valore atteso, con i numeri",
        blocks: [
          {
            type: "p",
            text: "Il valore atteso di una giocata è quanto restituirebbe in media, per ogni euro puntato, se la si ripetesse moltissime volte nelle stesse condizioni: probabilità × quota − 1.",
          },
          {
            type: "example",
            title: "Stessa quota, stime diverse",
            text: "Quota di mercato 2,70. Se la probabilità vera è il 40%, il valore atteso è 0,40 × 2,70 − 1 = +8%. Se è il 35%, è 0,35 × 2,70 − 1 = −5,5%. Basta un errore di cinque punti nella stima per cambiare segno al risultato.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Il punto debole è la stima",
            text: "Il calcolo è semplice; la difficoltà è conoscere la probabilità vera. Nessuno la conosce: il modello ne dà una stima, il mercato un'altra. Una quota più alta della quota equa dice solo che le due stime sono diverse, non chi ha ragione.",
          },
        ],
      },
      {
        id: "modello-vs-mercato",
        title: "Modello e mercato: chi sa di più",
        blocks: [
          {
            type: "p",
            text: "Le quote dei mercati principali raccolgono moltissime informazioni: formazioni ufficiali, infortuni dell'ultima ora, motivazioni, volumi di gioco. Il modello di QuotaGuru considera solo i gol segnati e subiti, il peso delle partite recenti e il fattore campo: non sa nulla di tutto il resto.",
          },
          {
            type: "list",
            items: [
              "Quando modello e mercato sono molto distanti, spesso il mercato sta usando un'informazione che il modello non ha (un titolare squalificato, una rotazione annunciata).",
              "Una differenza piccola, di uno o due punti percentuali, è più piccola dell'errore tipico di qualsiasi modello.",
              "L'unico modo serio per capire se un modello è affidabile è guardare come sono andate centinaia di stime passate: per questo pubblichiamo il [bilancio dei pronostici](/metodologia#calibrazione), anche quando è negativo.",
            ],
          },
        ],
      },
      {
        id: "cosa-non-facciamo",
        title: "Perché non segnaliamo \"giocate di valore\"",
        blocks: [
          {
            type: "p",
            text: "Molti siti etichettano come \"value bet\" ogni quota più alta della propria stima. Non lo facciamo per due motivi: la differenza può dipendere da un errore del modello, e un'etichetta del genere spinge a giocare più di quanto ci si era proposti. La quota equa serve a capire cosa dice il modello, non a decidere al posto tuo.",
          },
          {
            type: "callout",
            tone: "info",
            title: "In sintesi",
            text: "Quota equa = 1 ÷ probabilità. Il margine rende le quote di mercato più basse. Il valore atteso dipende da una probabilità che nessuno conosce con certezza. Nel lungo periodo, in media, chi scommette perde una parte di quanto punta.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "La quota equa di una multipla è il prodotto delle quote eque?",
        a: "Solo se gli eventi sono indipendenti. Esiti della stessa partita (ad esempio 1 e Over 2,5) sono collegati tra loro, e moltiplicarne le quote eque dà un risultato sbagliato.",
      },
      {
        q: "Se la quota di mercato è più alta della quota equa, conviene giocare?",
        a: "Non necessariamente. Significa che il mercato stima l'esito meno probabile del modello. Il modello può avere torto, soprattutto quando mancano informazioni su formazioni e assenze. Vedi anche [caso e probabilità](/guide/caso-e-probabilita).",
      },
      {
        q: "Perché sotto il 2% la quota equa non compare?",
        a: "Perché a probabilità così basse piccoli errori di stima cambiano moltissimo la quota (1% = 100, 2% = 50): il numero non sarebbe informativo.",
      },
    ],
    related: ["come-leggere-le-quote", "varianza-e-serie-negative", "criterio-di-kelly"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "criterio-di-kelly",
    title: "Il criterio di Kelly: cos'è e perché è rischioso",
    description:
      "La formula di Kelly per dimensionare le puntate, un esempio di calcolo e i limiti che la rendono pericolosa quando la probabilità è solo stimata.",
    category: "academy",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgKelly,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è il criterio di Kelly",
        blocks: [
          {
            type: "p",
            text: "Il criterio di Kelly è una formula, nata nel 1956 nello studio delle telecomunicazioni, che indica quale frazione del capitale puntare per farlo crescere il più velocemente possibile nel lungo periodo, a una condizione: conoscere la probabilità vera dell'esito.",
          },
          {
            type: "example",
            title: "La formula",
            text: "Frazione da puntare = (b × p − q) ÷ b, dove b è la quota meno 1, p la probabilità di vincere e q = 1 − p quella di perdere. Se il risultato è zero o negativo, la formula dice di non puntare nulla.",
          },
        ],
      },
      {
        id: "esempio",
        title: "Un esempio di calcolo",
        blocks: [
          {
            type: "p",
            text: "Quota 2,50, quindi b = 1,5. Supponiamo una probabilità stimata del 45%.",
          },
          {
            type: "table",
            head: ["Probabilità usata", "Calcolo", "Frazione indicata"],
            rows: [
              ["45% (la stima)", "(1,5 × 0,45 − 0,55) ÷ 1,5", "8,3% del capitale"],
              ["40% (stima troppo alta di 5 punti)", "(1,5 × 0,40 − 0,60) ÷ 1,5", "0%: nessun vantaggio"],
              ["38% (stima troppo alta di 7 punti)", "(1,5 × 0,38 − 0,62) ÷ 1,5", "negativa: giocata in perdita"],
            ],
            caption: "Stessa quota, tre probabilità diverse: la formula è molto sensibile all'errore di stima.",
          },
          {
            type: "p",
            text: "Con la stima del 45% Kelly indica di puntare l'8,3% del capitale. Ma se la probabilità vera fosse il 40%, quella stessa puntata non avrebbe alcun vantaggio; al 38% sarebbe una giocata in perdita di quasi un dodicesimo del capitale.",
          },
        ],
      },
      {
        id: "limiti",
        title: "I limiti nelle scommesse sportive",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "La probabilità vera non si conosce",
                text: "Kelly è nato per situazioni in cui la probabilità è nota. Nelle scommesse è sempre una stima, e chi sovrastima la propria precisione punta troppo.",
              },
              {
                title: "Puntare troppo è peggio che puntare poco",
                text: "Puntando il doppio della frazione di Kelly la crescita attesa del capitale scende a zero; oltre, diventa negativa anche se la stima di partenza era corretta.",
              },
              {
                title: "Oscillazioni molto ampie",
                text: "Anche con la probabilità giusta, Kelly pieno porta spesso a perdere metà del capitale prima di recuperare. Per questo chi lo usa ricorre a frazioni (metà o un quarto), rinunciando a parte della crescita.",
              },
              {
                title: "Il margine dell'operatore",
                text: "Per avere un vantaggio la tua stima deve battere il mercato di più del margine incluso nelle quote. Per quasi tutti, quasi sempre, non succede: e allora Kelly indica di non puntare.",
              },
            ],
          },
        ],
      },
      {
        id: "budget",
        title: "Kelly e budget di gioco",
        blocks: [
          {
            type: "p",
            text: "Kelly ragiona in termini di capitale da far crescere e lega l'importo delle puntate al saldo: dopo una serie positiva punteresti di più. È l'opposto dell'approccio che consigliamo per il gioco come intrattenimento: un [budget mensile fisso](/guide/gestione-del-budget), deciso prima e indipendente dai risultati.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Da sapere",
            text: "Nessuna formula di puntata trasforma una giocata svantaggiosa in una vantaggiosa: cambia solo quanto in fretta si vince o si perde. Se ti accorgi di aumentare le puntate per recuperare, leggi [dove chiedere aiuto](/guide/gioco-problematico-dove-chiedere-aiuto).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Il \"Kelly frazionario\" risolve il problema?",
        a: "Lo attenua: puntare metà o un quarto della frazione indicata riduce le oscillazioni e il danno di una stima sbagliata. Non risolve il punto di partenza: serve una stima migliore di quella del mercato.",
      },
      {
        q: "Posso usare le probabilità di QuotaGuru nella formula?",
        a: "Sono stime di un modello che non conosce formazioni e assenze. Usarle per dimensionare le puntate significa dare per scontata una precisione che nessun modello ha. Vedi [quota equa e valore atteso](/guide/quota-equa-e-valore-atteso).",
      },
    ],
    related: ["quota-equa-e-valore-atteso", "varianza-e-serie-negative", "gestione-del-budget"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "varianza-e-serie-negative",
    title: "Varianza: perché i risultati di breve periodo non dimostrano nulla",
    description:
      "Quanto possono durare le serie negative, quante giocate servono per distinguere la bravura dal caso e cosa significa per la gestione del budget.",
    category: "academy",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgVarianza,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è la varianza",
        blocks: [
          {
            type: "p",
            text: "La varianza misura quanto i risultati reali si allontanano da quelli medi. Nelle scommesse è molto alta: anche chi gioca sempre allo stesso modo, sugli stessi mercati, vede periodi positivi e negativi che non dipendono dalle sue scelte.",
          },
        ],
      },
      {
        id: "serie",
        title: "Le serie negative sono normali",
        blocks: [
          {
            type: "table",
            head: ["Situazione", "Probabilità"],
            rows: [
              ["Almeno 6 perdite di fila in 100 giocate con il 50% di probabilità ciascuna", "circa 54%"],
              ["Almeno 8 perdite di fila in 200 giocate con il 50% di probabilità", "circa 32%"],
              ["Almeno 10 perdite di fila in 200 giocate a quota 2,50 (40% di probabilità)", "circa 39%"],
            ],
            caption: "Valori calcolati con simulazioni ripetute.",
          },
          {
            type: "p",
            text: "Una serie di dieci giocate perse non significa che \"qualcosa non va\", e una serie di vincite non significa che hai trovato un metodo. Sono esiti che capitano spesso per puro caso.",
          },
        ],
      },
      {
        id: "quante-giocate",
        title: "Quante giocate servono per capire qualcosa",
        blocks: [
          {
            type: "p",
            text: "Prendiamo giocate a quota 2,00 con un margine del 5%: la probabilità vera di ciascuna è il 47,5% e, in media, si perde il 5% di quanto si punta.",
          },
          {
            type: "table",
            head: ["", "Dopo 100 giocate", "Dopo 1.000 giocate"],
            rows: [
              ["Chi gioca con lo svantaggio del margine: probabilità di essere in attivo", "27%", "5%"],
              ["Chi avesse un vantaggio reale del 2%: probabilità di essere in perdita", "38%", "25%"],
            ],
            caption: "Calcolo esatto sulla distribuzione binomiale; a parità di vincite e perdite il saldo è zero.",
          },
          {
            type: "p",
            text: "Dopo cento giocate più di un giocatore svantaggiato su quattro è in attivo, mentre più di un giocatore avvantaggiato su tre è in perdita. Il saldo di qualche settimana non dice quasi nulla; nel lungo periodo il margine prevale.",
          },
        ],
      },
      {
        id: "pratica",
        title: "Cosa significa in pratica",
        blocks: [
          {
            type: "list",
            items: [
              "Fissa il budget pensando alle serie negative: con puntate da 2 € e un budget di 50 €, 25 giocate perse lo esauriscono, e serie lunghe sono frequenti.",
              "Non aumentare le puntate dopo le perdite per \"recuperare\": la varianza non ti deve nulla.",
              "Non aumentarle neppure dopo le vincite: un buon periodo è compatibile con il semplice caso.",
              "Diffida di chi mostra il risultato di poche settimane come prova di bravura. Per questo il nostro [bilancio dei pronostici](/metodologia#calibrazione) riporta tutte le stime pubblicate, non una selezione.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "La varianza si \"compensa\" dopo una serie negativa?",
        a: "No. Le giocate successive non sanno nulla di quelle precedenti: è la [fallacia del giocatore](/guide/caso-e-probabilita).",
      },
      {
        q: "Giocare quote più alte aumenta la varianza?",
        a: "Sì. A quote alte si vince meno spesso, e le serie di perdite diventano più lunghe e frequenti, a parità di valore atteso.",
      },
    ],
    related: ["caso-e-probabilita", "emozioni-e-disciplina", "gestione-del-budget"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "emozioni-e-disciplina",
    title: "Emozioni e disciplina: come evitare il \"tilt\"",
    description:
      "Rincorsa delle perdite, euforia dopo una vincita, giocate impulsive: come riconoscerle e quali regole personali aiutano a mantenere il controllo.",
    category: "academy",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgEmozioni,
    sections: [
      {
        id: "tilt",
        title: "Cos'è il tilt",
        blocks: [
          {
            type: "p",
            text: "\"Tilt\" è il termine, nato nel poker, per lo stato in cui le emozioni prendono il posto del ragionamento: dopo una perdita bruciante, una serie storta o anche una grande vincita si gioca di più, più in fretta e su eventi che normalmente si ignorerebbero.",
          },
        ],
      },
      {
        id: "segnali",
        title: "I segnali da riconoscere",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Rincorrere le perdite", text: "Giocare subito un'altra scommessa, più alta, per rientrare di quanto appena perso." },
              { title: "Giocare per noia", text: "Scommettere su campionati o sport che non segui solo perché c'è una partita in corso." },
              { title: "Euforia", text: "Dopo una vincita sentirsi \"in forma\" e alzare le puntate: le vincite passate non cambiano le probabilità future." },
              { title: "Fretta e segretezza", text: "Giocare di notte, di nascosto o senza controllare il saldo sono segnali da prendere sul serio." },
            ],
          },
        ],
      },
      {
        id: "regole",
        title: "Regole personali che aiutano",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Decidi il budget del mese prima di iniziare e impostalo come limite di deposito sul conto: così non dipende dall'umore del momento. Vedi [limiti di gioco e autoesclusione](/guide/autoesclusione-e-limiti-di-gioco).",
              "Fissa un tempo massimo per sessione e, se l'operatore lo offre, attiva il promemoria del tempo di gioco.",
              "Stabilisci in anticipo una pausa obbligatoria, ad esempio dopo tre giocate perse di fila o a fine giornata.",
              "Scegli le partite prima che inizino, a mente fredda; evita le giocate decise durante l'evento.",
              "Tieni un registro di tutte le giocate, anche quelle perse: la memoria tende a ricordare le vincite.",
              "Non giocare per recuperare soldi destinati ad altro, né quando sei stanco, arrabbiato o hai bevuto.",
            ],
          },
        ],
      },
      {
        id: "quando-fermarsi",
        title: "Quando fermarsi",
        blocks: [
          {
            type: "callout",
            tone: "warn",
            title: "Se il gioco smette di essere un divertimento",
            text: "Se pensi spesso a come recuperare, nascondi quanto giochi o le regole che ti eri dato non reggono, fermati e chiedi aiuto. La guida [dove chiedere aiuto](/guide/gioco-problematico-dove-chiedere-aiuto) elenca i servizi gratuiti e anonimi, e l'[autoesclusione](/guide/autoesclusione-e-limiti-di-gioco) blocca l'accesso a tutti gli operatori autorizzati.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Un limite di perdita giornaliero è utile?",
        a: "Sì, purché sia deciso prima e non spostato durante la giornata. Il limite di deposito impostato sul conto è più efficace, perché non si può aumentare all'istante.",
      },
    ],
    related: ["varianza-e-serie-negative", "autoesclusione-e-limiti-di-gioco", "gioco-problematico-dove-chiedere-aiuto"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "quanto-costa-un-bonus",
    title: "Quanto costa davvero un bonus: il calcolo del requisito di giocata",
    description:
      "Come calcolare quanto bisogna giocare per sbloccare un bonus e quanto si perde in media per farlo, con esempi per scommesse sportive e casinò.",
    category: "gestione-del-budget",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgCostoBonus,
    sections: [
      {
        id: "idea",
        title: "L'idea in breve",
        blocks: [
          {
            type: "p",
            text: "Un bonus si sblocca giocando una certa somma. Ogni euro giocato restituisce in media un po' meno di un euro, per via del margine dell'operatore. Il costo medio di un bonus è quindi: somma da giocare × perdita media per euro. Se il costo supera l'importo del bonus, in media completare il requisito fa perdere denaro.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Medie, non previsioni",
            text: "I calcoli che seguono descrivono il risultato medio su moltissimi giocatori. Il singolo può andare meglio o peggio, ma nessun metodo cambia la media.",
          },
        ],
      },
      {
        id: "casino",
        title: "Bonus casinò e slot",
        blocks: [
          {
            type: "p",
            text: "Per i giochi da casinò il ritorno teorico al giocatore (RTP) indica quanto torna in media di ogni euro giocato. Per molte slot online è intorno al 96%: la perdita media è il 4% delle giocate.",
          },
          {
            type: "example",
            title: "Bonus di 100 € con requisito 35 volte",
            text: "Giocate richieste: 100 € × 35 = 3.500 €. Perdita media: 3.500 € × 4% = 140 €. In media, il requisito costa più del bonus stesso. Con un requisito di 60 volte le giocate salgono a 6.000 € e il costo medio a 240 €.",
          },
          {
            type: "p",
            text: "Spesso non tutti i giochi contano allo stesso modo: se la roulette vale il 10% del requisito, ogni euro giocato alla roulette ne copre solo 10 centesimi, e le giocate necessarie si moltiplicano.",
          },
        ],
      },
      {
        id: "sport",
        title: "Bonus per le scommesse sportive",
        blocks: [
          {
            type: "p",
            text: "Molti bonus sport non sono prelevabili e vanno usati su multiple con un numero minimo di eventi e una quota minima per evento. Nelle multiple il margine si applica a ogni evento e si moltiplica.",
          },
          {
            type: "table",
            head: ["Eventi nella multipla", "Parte restituita in media", "Perdita media"],
            rows: [
              ["1 (singola)", "95%", "5%"],
              ["3", "86%", "14%"],
              ["5", "77%", "23%"],
              ["7", "70%", "30%"],
            ],
            caption: "Ipotesi: margine del 5% su ogni evento, tipico dei mercati principali (sui mercati secondari è più alto).",
          },
          {
            type: "example",
            title: "Bonus di 100 € da usare su multiple di 5 eventi a quota minima 1,50",
            text: "Una multipla di 5 eventi a quota 1,50 paga 7,59 volte la puntata e, con un margine del 5% per evento, si vince circa una volta su dieci. In media il bonus restituisce circa 77 €; se la vincita viene pagata al netto della puntata del bonus, come prevedono molte condizioni, circa 67 €. Nove volte su dieci il bonus si esaurisce senza vincite.",
          },
        ],
      },
      {
        id: "checklist",
        title: "Cosa controllare prima di accettare",
        blocks: [
          {
            type: "list",
            items: [
              "Su quale prodotto si usa davvero il bonus: molte offerte \"sport\" sono in gran parte bonus per le slot.",
              "Quante volte va giocato e su quale importo (solo il bonus, o bonus più deposito).",
              "Entro quanti giorni: un requisito alto con una scadenza breve obbliga a giocare molto in poco tempo.",
              "Numero minimo di eventi e quota minima: più sono alti, più il margine pesa.",
              "Importo massimo convertibile: a volte, qualunque cosa succeda, si può prelevare solo una piccola parte.",
              "Se il bonus attivo blocca i prelievi finché il requisito non è completato.",
            ],
          },
          {
            type: "p",
            text: "Nella pagina [offerte di benvenuto](/bonus) questi calcoli sono già fatti per ogni offerta, con le stesse ipotesi. Le condizioni vincolanti restano quelle pubblicate dall'operatore.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Un bonus non è un motivo per giocare",
            text: "Se per completare un requisito dovresti giocare più del budget che ti eri dato, la scelta più semplice è rinunciare al bonus.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Perché usate il 96% per le slot e il 5% per lo sport?",
        a: "Sono valori tipici, scelti per rendere i calcoli confrontabili tra offerte. Ogni gioco ha il proprio RTP, indicato nelle sue informazioni; ogni mercato il proprio margine. Con valori diversi il costo cambia in proporzione.",
      },
      {
        q: "Esiste un modo per sbloccare un bonus senza rischiare?",
        a: "No. Per completare un requisito bisogna giocare, e ogni giocata comporta il rischio di perdere. Diffida di chi promette il contrario.",
      },
    ],
    related: ["bonus-requisiti-di-giocata", "varianza-e-serie-negative", "gestione-del-budget"],
  },
];
