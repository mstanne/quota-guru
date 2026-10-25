// Guides – category "Quote e probabilità". Inline links: [testo](/percorso).
import type { Guide } from "../guides";
import imgCalcolo from "../../assets/guides/calcolare-vincita-multipla-sistema.svg";
import imgCaso from "../../assets/guides/caso-e-probabilita.svg";

const UPDATED = "13 ottobre 2026";

export const quoteGuides: Guide[] = [
  {
    slug: "calcolare-vincita-multipla-sistema",
    title: "Calcolare la vincita di una multipla e di un sistema",
    description:
      "Esempi passo passo: quota totale, vincita possibile e probabilità di una multipla, e quanto si recupera con un sistema se una selezione è sbagliata.",
    category: "quote-e-probabilita",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgCalcolo,
    sections: [
      {
        id: "multipla",
        title: "La quota totale di una multipla",
        blocks: [
          {
            type: "p",
            text: "In una multipla le quote delle singole selezioni si moltiplicano tra loro. La vincita possibile è la puntata moltiplicata per la quota totale.",
          },
          {
            type: "example",
            title: "Esempio con tre selezioni",
            text: "Quote 1,80 × 2,10 × 1,60 = 6,05. Con una puntata di 10 € la vincita possibile è 60,48 € (gli operatori arrotondano in modo diverso i decimali).",
          },
        ],
      },
      {
        id: "probabilita",
        title: "Quanto è probabile vincerla",
        blocks: [
          {
            type: "p",
            text: "Anche le probabilità implicite si moltiplicano. Ogni selezione aggiunta riduce la probabilità complessiva, e il margine dell'operatore si applica a ogni selezione.",
          },
          {
            type: "table",
            caption: "Probabilità implicite (1 ÷ quota) della multipla dell'esempio",
            head: ["Selezione", "Quota", "Probabilità implicita"],
            rows: [
              ["A", "1,80", "55,6%"],
              ["B", "2,10", "47,6%"],
              ["C", "1,60", "62,5%"],
              ["A + B + C", "6,05", "16,5%"],
            ],
          },
          {
            type: "callout",
            tone: "warn",
            title: "In pratica",
            text: "Tre esiti che singolarmente sembrano \"probabili\" diventano insieme una giocata che, secondo le quote stesse, si perde più di 8 volte su 10.",
          },
        ],
      },
      {
        id: "sistema",
        title: "Un sistema 2 su 3",
        blocks: [
          {
            type: "p",
            text: "Con le stesse tre selezioni, un sistema 2/3 gioca le tre doppie possibili. Puntando 3 € per doppia la spesa totale è 9 €.",
          },
          {
            type: "table",
            head: ["Doppia", "Quota", "Vincita con 3 €"],
            rows: [
              ["A + B", "3,78", "11,34 €"],
              ["A + C", "2,88", "8,64 €"],
              ["B + C", "3,36", "10,08 €"],
            ],
          },
          {
            type: "list",
            items: [
              "Tutte e tre corrette: vincono tutte le doppie, 30,06 € in totale.",
              "Solo A e B corrette: vince una doppia, 11,34 € a fronte di 9 € spesi.",
              "Solo A e C corrette: 8,64 €, meno di quanto speso.",
              "Una sola corretta o nessuna: nessuna vincita.",
            ],
          },
        ],
      },
      {
        id: "formule",
        title: "Le formule in breve",
        blocks: [
          {
            type: "table",
            head: ["Cosa", "Come si calcola"],
            rows: [
              ["Quota multipla", "Prodotto delle quote"],
              ["Vincita", "Puntata × quota totale"],
              ["Probabilità implicita", "Prodotto di (1 ÷ quota) di ogni selezione"],
              ["Giocate di un sistema k su n", "Combinazioni di n elementi presi k alla volta (es. 2 su 4 = 6 doppie)"],
            ],
          },
          {
            type: "p",
            text: "Le differenze tra tipi di giocata sono spiegate in [singola, multipla e sistema](/guide/singola-multipla-sistema).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Perché la vincita sul sito dell'operatore è leggermente diversa?",
        a: "Per l'arrotondamento dei decimali e per eventuali regole sulla vincita massima. Fa sempre fede il calcolo dell'operatore.",
      },
      {
        q: "Un sistema conviene più di una multipla?",
        a: "Non in assoluto: riduce l'impatto di un errore ma costa di più. La probabilità di ogni singola combinazione resta la stessa.",
      },
    ],
    related: ["singola-multipla-sistema", "come-leggere-le-quote", "caso-e-probabilita"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "caso-e-probabilita",
    title: "Caso e probabilità: perché le serie ingannano",
    description:
      "Fallacia del giocatore, \"ritardi\", mano calda e illusione di controllo: gli errori di ragionamento più comuni quando si gioca e come riconoscerli.",
    category: "quote-e-probabilita",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgCaso,
    sections: [
      {
        id: "fallacia",
        title: "La fallacia del giocatore",
        blocks: [
          {
            type: "p",
            text: "Se lanci una moneta e esce croce cinque volte di fila, la probabilità che al sesto lancio esca testa resta il 50%. La moneta non ha memoria. Eppure molte persone sono convinte che \"ormai debba uscire testa\": è la fallacia del giocatore.",
          },
          {
            type: "p",
            text: "Nello sport gli eventi non sono indipendenti come i lanci di una moneta, ma il principio vale lo stesso: il fatto che una squadra non pareggi da otto partite non rende il pareggio \"dovuto\" alla nona.",
          },
        ],
      },
      {
        id: "trappole",
        title: "Altre trappole comuni",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "La \"mano calda\"",
                text: "Dopo qualche vincita si tende a sentirsi in un momento fortunato e ad aumentare le puntate. Le vincite passate non cambiano le probabilità future.",
              },
              {
                title: "L'illusione di controllo",
                text: "Studiare una partita dà la sensazione di poterne prevedere l'esito. L'informazione aiuta a capire, non a controllare il risultato.",
              },
              {
                title: "La quasi vincita",
                text: "Perdere una multipla \"per un solo risultato\" sembra un segnale di essere vicini alla vincita. In realtà è una giocata persa come le altre.",
              },
              {
                title: "I piccoli campioni",
                text: "Dieci giocate sono troppo poche per capire se un metodo funziona: il caso domina sui numeri piccoli.",
              },
            ],
          },
        ],
      },
      {
        id: "media",
        title: "La regressione verso la media",
        blocks: [
          {
            type: "p",
            text: "Una squadra che segna molto più del solito per qualche settimana tende, nel tempo, a tornare verso il proprio livello abituale. Non è un \"ritardo\" che si compensa, ma il normale effetto della variabilità. Indicatori come gli [expected goals](/guide/expected-goals) aiutano a distinguere il rendimento dalla fortuna.",
          },
        ],
      },
      {
        id: "lungo-periodo",
        title: "E nel lungo periodo?",
        blocks: [
          {
            type: "p",
            text: "Nel lungo periodo vince la matematica: il margine incluso nelle quote fa sì che, in media, chi gioca perda una parte di quanto punta. Nessuna serie, sistema o \"metodo\" può cambiare questo fatto.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Un segnale da non ignorare",
            text: "Se ti accorgi di giocare per \"recuperare\" o perché \"adesso tocca a te\", fermati. La guida sui [segnali di gioco problematico](/guide/gioco-problematico-dove-chiedere-aiuto) spiega dove chiedere aiuto.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Esistono sistemi per battere il banco?",
        a: "No. Progressioni come raddoppiare la puntata dopo ogni perdita aumentano solo la velocità con cui si può perdere il budget.",
      },
      {
        q: "Allora informarsi non serve?",
        a: "Serve a fare scelte consapevoli e a capire lo sport, non a garantire risultati.",
      },
    ],
    related: ["come-leggere-le-quote", "gioco-problematico-dove-chiedere-aiuto", "expected-goals"],
  },
];
