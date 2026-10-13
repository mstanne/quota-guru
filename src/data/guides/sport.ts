// Guides – category "Sport specifici". Inline links: [testo](/percorso).
import type { Guide } from "../guides";
import imgMercati from "../../assets/guides/mercati-del-calcio.svg";
import imgAsiatico from "../../assets/guides/handicap-asiatico.svg";
import imgTornei from "../../assets/guides/tornei-di-tennis.svg";
import imgNba from "../../assets/guides/nba-stagione-play-in-playoff.svg";

const UPDATED = "13 ottobre 2026";

export const sportGuides: Guide[] = [
  {
    slug: "mercati-del-calcio",
    title: "I mercati del calcio spiegati",
    description:
      "Doppia chance, draw no bet, Goal/No goal, multigol, risultato esatto, marcatori, cartellini e calci d'angolo: come funzionano e a cosa fare attenzione.",
    category: "sport",
    readTime: "8 min",
    updatedAt: UPDATED,
    image: imgMercati,
    sections: [
      {
        id: "regolamentari",
        title: "Prima regola: i tempi regolamentari",
        blocks: [
          {
            type: "p",
            text: "Salvo indicazione diversa, i mercati del calcio si riferiscono ai 90 minuti più il recupero. Supplementari e rigori non contano: in una finale di coppa decisa ai rigori, il 1X2 viene pagato come pareggio.",
          },
        ],
      },
      {
        id: "esito",
        title: "Mercati sull'esito",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "1X2", text: "Vittoria della squadra di casa, pareggio o vittoria della squadra ospite." },
              { title: "Doppia chance", text: "Due esiti su tre: 1X (casa o pareggio), 12 (non finisce pari), X2 (ospite o pareggio). Quote più basse, perché copre più esiti." },
              { title: "Draw no bet", text: "Si sceglie una squadra; se la partita finisce in pareggio la puntata viene rimborsata." },
              { title: "Parziale/finale", text: "Esito del primo tempo e della partita insieme, ad esempio X/1: pari all'intervallo, vince la squadra di casa." },
            ],
          },
        ],
      },
      {
        id: "gol",
        title: "Mercati sui gol",
        blocks: [
          {
            type: "table",
            head: ["Mercato", "Vince se…", "Esempio con 2-1"],
            rows: [
              ["Over 2,5", "Si segnano almeno 3 gol", "Vinto"],
              ["Under 2,5", "Si segnano al massimo 2 gol", "Perso"],
              ["Goal", "Segnano entrambe le squadre", "Vinto"],
              ["Multigol 1-3", "I gol totali sono tra 1 e 3", "Vinto"],
              ["Risultato esatto 1-0", "Il punteggio è esattamente 1-0", "Perso"],
            ],
          },
          {
            type: "p",
            text: "Le soglie Over/Under hanno quasi sempre il mezzo punto, così non può esserci parità. Le linee intere e i quarti sono spiegati in [handicap asiatico](/guide/handicap-asiatico).",
          },
        ],
      },
      {
        id: "giocatori",
        title: "Marcatori e giocatori",
        blocks: [
          {
            type: "list",
            items: [
              "Marcatore \"in qualsiasi momento\": il giocatore segna almeno un gol nei tempi regolamentari.",
              "Primo marcatore: deve segnare il primo gol della partita.",
              "Gli autogol di solito non contano per i mercati marcatori.",
              "Se il giocatore non scende in campo, in genere la giocata viene rimborsata; se entra a partita in corso, di solito è valida.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Leggi il regolamento",
            text: "Le regole su giocatori subentrati, gol annullati dal VAR e partite sospese cambiano da operatore a operatore.",
          },
        ],
      },
      {
        id: "statistiche",
        title: "Cartellini e calci d'angolo",
        blocks: [
          {
            type: "p",
            text: "Molti operatori offrono mercati sul numero di cartellini o di calci d'angolo. Per i cartellini si usa spesso un punteggio (ad esempio 1 punto per il giallo, 2 per il rosso) e un giallo seguito da un rosso diretto può contare in modo diverso: verifica sempre la definizione esatta del mercato.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Cosa succede se una partita viene sospesa?",
        a: "Di solito i mercati già decisi restano validi e gli altri vengono rimborsati se la partita non riprende entro un certo termine. Le regole precise sono nel regolamento dell'operatore.",
      },
      {
        q: "Un gol nel recupero conta?",
        a: "Sì, il recupero fa parte dei tempi regolamentari.",
      },
    ],
    related: ["handicap-asiatico", "analizzare-una-partita-di-calcio", "glossario-scommesse"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "handicap-asiatico",
    title: "Handicap asiatico spiegato con esempi",
    description:
      "Linee intere, mezze e quarti: come funziona l'handicap asiatico, quando la puntata viene rimborsata e come si calcola la vincita sulle linee divise.",
    category: "sport",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgAsiatico,
    sections: [
      {
        id: "idea",
        title: "L'idea di base",
        blocks: [
          {
            type: "p",
            text: "L'handicap asiatico assegna un vantaggio o uno svantaggio in gol a una squadra ed elimina il pareggio come esito a sé. A seconda della linea, quando il risultato \"corretto\" con l'handicap è in parità la puntata viene rimborsata in tutto o in parte.",
          },
        ],
      },
      {
        id: "linee",
        title: "Le linee più comuni",
        blocks: [
          {
            type: "table",
            caption: "Puntata sulla squadra favorita",
            head: ["Linea", "Vince 1 gol di scarto", "Pareggio", "Vince 2+ gol di scarto"],
            rows: [
              ["0", "Vinta", "Rimborsata", "Vinta"],
              ["-0,25", "Vinta", "Metà persa, metà rimborsata", "Vinta"],
              ["-0,5", "Vinta", "Persa", "Vinta"],
              ["-0,75", "Metà vinta, metà rimborsata", "Persa", "Vinta"],
              ["-1", "Rimborsata", "Persa", "Vinta"],
              ["-1,5", "Persa", "Persa", "Vinta"],
            ],
          },
          {
            type: "p",
            text: "La linea 0 equivale al \"draw no bet\". Le linee con il mezzo punto funzionano come un handicap normale: non c'è mai rimborso.",
          },
        ],
      },
      {
        id: "quarti",
        title: "Le linee divise (quarti)",
        blocks: [
          {
            type: "p",
            text: "Le linee che finiscono in ,25 o ,75 dividono la puntata in due metà uguali su due linee vicine. -0,75, ad esempio, è metà su -0,5 e metà su -1.",
          },
          {
            type: "example",
            title: "Esempio: 10 € sulla favorita a -0,75, quota 1,90, risultato 1-0",
            text: "5 € su -0,5: vinta, ricevi 9,50 €. 5 € su -1: vittoria di un solo gol, rimborsata, ricevi 5 €. Totale 14,50 € a fronte di 10 € puntati.",
          },
          {
            type: "example",
            title: "Stessa giocata con linea -0,25 e risultato 1-1",
            text: "5 € su 0: rimborsati. 5 € su -0,5: persi. Ricevi 5 € dei 10 € puntati.",
          },
        ],
      },
      {
        id: "totali",
        title: "Anche sui totali gol",
        blocks: [
          {
            type: "p",
            text: "Lo stesso principio vale per l'Over/Under asiatico: con Over 2 e risultato 1-1 la puntata viene rimborsata; con Over 2,25 metà è rimborsata e metà persa. Per i mercati di base vedi [i mercati del calcio](/guide/mercati-del-calcio).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "L'handicap asiatico è più conveniente dell'1X2?",
        a: "Non è più o meno conveniente: riduce gli esiti possibili e introduce i rimborsi. Anche qui le quote includono il margine dell'operatore.",
      },
      {
        q: "Si usa anche in altri sport?",
        a: "Il concetto di handicap esiste ovunque; nel basket, ad esempio, si usano linee in punti come spiegato nella [guida al basket](/guide/basket-over-under-handicap).",
      },
    ],
    related: ["mercati-del-calcio", "basket-over-under-handicap", "calcolare-vincita-multipla-sistema"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "tornei-di-tennis",
    title: "I tornei di tennis: Slam, Masters 1000, ATP e WTA",
    description:
      "Come è organizzata la stagione del tennis, quali sono le differenze tra le categorie di torneo, quanti set si giocano e come funziona il tie-break.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgTornei,
    sections: [
      {
        id: "categorie",
        title: "Le categorie di torneo",
        blocks: [
          {
            type: "table",
            head: ["Categoria", "Caratteristiche"],
            rows: [
              ["Grande Slam", "Australian Open, Roland Garros, Wimbledon e US Open: tabelloni da 128 giocatori, due settimane di gara."],
              ["ATP Masters 1000 / WTA 1000", "I tornei più importanti dopo gli Slam, tra cui Indian Wells, Miami, Roma e Madrid."],
              ["ATP / WTA 500 e 250", "Tornei di livello intermedio e di base, con tabelloni più piccoli."],
              ["ATP Finals / WTA Finals", "A fine stagione, riservate ai migliori 8 del ranking, con un girone iniziale."],
              ["Coppa Davis / Billie Jean King Cup", "Competizioni a squadre tra nazionali."],
            ],
          },
        ],
      },
      {
        id: "set",
        title: "Quanti set si giocano",
        blocks: [
          {
            type: "list",
            items: [
              "Negli Slam maschili si gioca al meglio dei cinque set: vince chi ne conquista tre.",
              "Negli Slam femminili e in quasi tutti gli altri tornei si gioca al meglio dei tre set.",
              "Più set ci sono, più è probabile che il giocatore più forte riesca a recuperare un momento negativo.",
            ],
          },
        ],
      },
      {
        id: "tiebreak",
        title: "Il tie-break",
        blocks: [
          {
            type: "p",
            text: "Sul 6-6 in un set si gioca il tie-break: vince chi arriva per primo a 7 punti con almeno due punti di vantaggio. Negli Slam, nel set decisivo, si gioca un tie-break più lungo, a 10 punti.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Perché conta",
            text: "Il formato influisce sui mercati sul totale dei game e sul risultato in set: un tie-break chiude il set 7-6 e vale un game in più rispetto a un 6-4.",
          },
        ],
      },
      {
        id: "calendario",
        title: "La stagione e le superfici",
        blocks: [
          {
            type: "p",
            text: "La stagione parte a gennaio sul cemento australiano, passa alla terra battuta in primavera, all'erba tra giugno e luglio e torna sul cemento fino a novembre. Le differenze tra superfici sono spiegate in [tennis: mercati e fattori](/guide/scommesse-sul-tennis); il calendario delle partite è nella pagina [Tennis](/tennis).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Cosa succede alle scommesse se un giocatore si ritira?",
        a: "Le regole variano: alcuni operatori annullano la giocata se il match non si completa, altri la considerano valida se è stato giocato almeno un set. Leggi il regolamento prima di giocare.",
      },
    ],
    related: ["scommesse-sul-tennis", "analizzare-una-partita-di-calcio", "glossario-scommesse"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "nba-stagione-play-in-playoff",
    title: "NBA: regular season, play-in e playoff",
    description:
      "Come funziona la stagione NBA: 82 partite di regular season, la NBA Cup, il torneo play-in, i playoff al meglio delle sette e cosa cambia per chi segue le partite.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgNba,
    sections: [
      {
        id: "regular",
        title: "La regular season",
        blocks: [
          {
            type: "p",
            text: "Le 30 squadre NBA sono divise in due conference, Est e Ovest. Da ottobre ad aprile ognuna gioca 82 partite: spesso due in due giorni consecutivi (back-to-back) e con lunghi viaggi tra una città e l'altra.",
          },
          {
            type: "p",
            text: "Durante la regular season si disputa anche la NBA Cup, un torneo con fase a gironi e fase finale a eliminazione diretta a dicembre. Le partite della fase a gironi contano anche per la classifica di regular season.",
          },
        ],
      },
      {
        id: "play-in",
        title: "Il torneo play-in",
        blocks: [
          {
            type: "p",
            text: "Le prime sei di ogni conference vanno direttamente ai playoff. Le squadre dalla settima alla decima si giocano gli ultimi due posti nel play-in.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "7ª contro 8ª: chi vince è testa di serie numero 7.",
              "9ª contro 10ª: chi perde è eliminata.",
              "Perdente di 7ª-8ª contro vincente di 9ª-10ª: chi vince è testa di serie numero 8.",
            ],
          },
        ],
      },
      {
        id: "playoff",
        title: "I playoff",
        blocks: [
          {
            type: "p",
            text: "Sedici squadre, quattro turni, ogni serie al meglio delle sette partite: passa chi ne vince quattro. La squadra con il miglior piazzamento gioca in casa le partite 1, 2, 5 e 7. Le Finali si giocano a giugno tra le vincitrici delle due conference.",
          },
        ],
      },
      {
        id: "cosa-conta",
        title: "Cosa conta per chi segue le partite",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Riposo e rotazioni", text: "Nei back-to-back e a fine stagione le squadre gestiscono i minuti dei giocatori principali." },
              { title: "Supplementari", text: "In caso di parità si giocano tempi supplementari di 5 minuti; molti mercati li includono." },
              { title: "Playoff più tattici", text: "Nelle serie i ritmi spesso calano e le squadre si adattano partita dopo partita." },
              { title: "Orari italiani", text: "Le partite si giocano di notte per l'Italia: nella pagina [Basket](/basket) trovi gli orari già convertiti." },
            ],
          },
          {
            type: "p",
            text: "Totali e handicap sono spiegati in [basket: Over/Under e handicap](/guide/basket-over-under-handicap).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "La finale della NBA Cup conta per la classifica?",
        a: "No, la finale della NBA Cup non viene conteggiata nella classifica di regular season.",
      },
    ],
    related: ["basket-over-under-handicap", "tornei-di-tennis", "mercati-del-calcio"],
  },
];
