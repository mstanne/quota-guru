// Guides – category "Analisi delle partite". Inline links: [testo](/percorso).
import type { Guide } from "../guides";
import imgXg from "../../assets/guides/expected-goals.svg";
import imgCalendario from "../../assets/guides/calendario-coppe-turnover.svg";

const UPDATED = "13 ottobre 2026";

export const analisiGuides: Guide[] = [
  {
    slug: "expected-goals",
    title: "Cosa sono gli expected goals (xG)",
    description:
      "Come si calcolano gli expected goals, cosa dicono di una squadra che il risultato non mostra e quali sono i loro limiti.",
    category: "analisi",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgXg,
    sections: [
      {
        id: "definizione",
        title: "Una definizione semplice",
        blocks: [
          {
            type: "p",
            text: "Gli expected goals (xG) stimano la probabilità che un tiro diventi gol, in base a come e da dove viene effettuato: distanza, angolo, parte del corpo, tipo di azione, presenza di difensori. Un tiro da 30 metri può valere 0,03 xG, un tiro a porta vuota da due metri oltre 0,9.",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Una squadra tira 12 volte: la somma dei valori dei tiri è 1,8 xG. In media, con occasioni di quella qualità, segnerebbe circa due gol. Un rigore vale circa 0,75–0,8 xG.",
          },
        ],
      },
      {
        id: "a-cosa-servono",
        title: "A cosa servono",
        blocks: [
          {
            type: "list",
            items: [
              "Capire se un risultato rispecchia l'andamento della partita: chi vince 1-0 con 0,4 xG contro 2,1 è stato soprattutto fortunato o bravo in porta.",
              "Valutare il rendimento su più partite, meno influenzato dagli episodi rispetto ai soli gol.",
              "Individuare squadre che creano molto ma segnano poco (o il contrario), un segnale che spesso tende a riequilibrarsi.",
            ],
          },
        ],
      },
      {
        id: "limiti",
        title: "I limiti",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Modelli diversi", text: "Ogni fornitore usa un proprio modello: i valori di xG di siti diversi non coincidono." },
              { title: "Non vedono tutto", text: "Un'azione pericolosa senza tiro vale zero xG, anche se ha messo in difficoltà la difesa." },
              { title: "Qualità dei giocatori", text: "Il modello considera il tiro medio: un attaccante molto preciso può segnare stabilmente più dei suoi xG." },
              { title: "Campioni piccoli", text: "Su poche partite gli xG oscillano molto; diventano utili su almeno 8-10 gare." },
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Da ricordare",
            text: "Gli xG descrivono quello che è successo, non predicono il risultato. Le quote degli operatori tengono già conto di questi dati.",
          },
        ],
      },
      {
        id: "dove",
        title: "Come usarli insieme agli altri dati",
        blocks: [
          {
            type: "p",
            text: "Gli xG funzionano meglio insieme a classifica, forma e contesto della partita, come spiegato in [come analizzare una partita di calcio](/guide/analizzare-una-partita-di-calcio). Per i limiti del ragionamento sulle serie di risultati vedi [caso e probabilità](/guide/caso-e-probabilita).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Esistono anche gli xG subiti?",
        a: "Sì (xGA): misurano la qualità delle occasioni concesse agli avversari e dicono molto sulla solidità di una difesa.",
      },
      {
        q: "Gli xG valgono anche per altri sport?",
        a: "Il concetto esiste anche per hockey e altri sport, con modelli diversi. Nel basket si usano più spesso percentuali di tiro ed efficienza offensiva.",
      },
    ],
    related: ["analizzare-una-partita-di-calcio", "calendario-coppe-turnover", "caso-e-probabilita"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "calendario-coppe-turnover",
    title: "Calendario, coppe e turnover",
    description:
      "Partite ravvicinate, soste per le nazionali, trasferte e fine stagione: come il calendario cambia formazioni e motivazioni di una squadra.",
    category: "analisi",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgCalendario,
    sections: [
      {
        id: "ravvicinate",
        title: "Partite ravvicinate",
        blocks: [
          {
            type: "p",
            text: "Le squadre impegnate nelle coppe europee giocano spesso ogni tre o quattro giorni. Per gestire la fatica gli allenatori cambiano più giocatori (turnover), soprattutto nella partita meno importante della settimana.",
          },
          {
            type: "table",
            head: ["Situazione", "Cosa può cambiare"],
            rows: [
              ["Coppa a metà settimana", "Turnover nella partita di campionato precedente o successiva"],
              ["Trasferta lunga", "Recupero più breve, possibile calo fisico"],
              ["Sosta per le nazionali", "Giocatori rientrati stanchi o infortunati, allenamenti ridotti"],
              ["Ultime giornate", "Motivazioni diverse: chi lotta per un obiettivo e chi non ha più nulla da chiedere"],
            ],
          },
        ],
      },
      {
        id: "formazioni",
        title: "Le formazioni ufficiali",
        blocks: [
          {
            type: "p",
            text: "Le formazioni ufficiali vengono comunicate di solito circa un'ora prima del calcio d'inizio. Prima di allora circolano solo formazioni probabili: notizie e indiscrezioni possono rivelarsi sbagliate.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Le quote si muovono",
            text: "Quando una notizia su formazioni o assenze diventa pubblica, le quote si aggiornano rapidamente. Per questo ogni quota sul sito mostra l'orario dell'ultimo aggiornamento.",
          },
        ],
      },
      {
        id: "dove-trovarlo",
        title: "Dove trovare il calendario",
        blocks: [
          {
            type: "p",
            text: "Nelle pagine [Calcio](/calcio) trovi calendario, risultati e classifiche dei principali campionati e delle coppe europee in orario italiano: è il modo più rapido per vedere quante partite ha giocato una squadra negli ultimi giorni.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Il turnover rende sempre più debole una squadra?",
        a: "Non sempre: le squadre con rose ampie cambiano molti giocatori senza perdere qualità. Conta chi entra, non solo chi esce.",
      },
    ],
    related: ["analizzare-una-partita-di-calcio", "expected-goals", "mercati-del-calcio"],
  },
];
