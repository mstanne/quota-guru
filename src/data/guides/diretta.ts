// Guides – category "Scommesse in diretta". Inline links: [testo](/percorso).
import type { Guide } from "../guides";
import imgCashout from "../../assets/guides/cash-out.svg";

const UPDATED = "13 ottobre 2026";

export const direttaGuides: Guide[] = [
  {
    slug: "cash-out",
    title: "Il cash out: come viene calcolato",
    description:
      "Cos'è il cash out, come l'operatore calcola l'importo proposto, cash out parziale e automatico, e perché non è un modo per vincere senza rischi.",
    category: "in-diretta",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgCashout,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è",
        blocks: [
          {
            type: "p",
            text: "Il cash out permette di chiudere una giocata prima che l'evento sia finito, incassando l'importo proposto in quel momento dall'operatore. Può essere superiore o inferiore alla puntata, a seconda di come sta andando l'evento.",
          },
        ],
      },
      {
        id: "calcolo",
        title: "Come si calcola",
        blocks: [
          {
            type: "p",
            text: "In modo semplificato, l'importo proposto è la vincita possibile moltiplicata per la probabilità attuale che la giocata vinca, ricavata dalla quota live, meno un margine trattenuto dall'operatore.",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Hai puntato 10 € a quota 3,00 sulla vittoria di una squadra: vincita possibile 30 €. Al 70° minuto la squadra vince 1-0 e la quota live sul suo successo è 1,40 (probabilità implicita 71%). Un cash out \"equo\" varrebbe circa 21 €; l'operatore ne propone ad esempio 19,80 €, trattenendo un margine.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Il margine si paga due volte",
            text: "Il cash out include un margine aggiuntivo rispetto alla giocata originale. Usarlo spesso, nel tempo, riduce quanto si riceve in media.",
          },
        ],
      },
      {
        id: "varianti",
        title: "Le varianti",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Cash out totale", text: "Chiudi tutta la giocata e incassi l'importo proposto." },
              { title: "Cash out parziale", text: "Incassi una parte e lasci in gioco il resto della puntata." },
              { title: "Cash out automatico", text: "Fissi in anticipo un importo: se l'offerta lo raggiunge, la giocata si chiude da sola." },
            ],
          },
          {
            type: "p",
            text: "Il cash out non è sempre disponibile: viene sospeso durante le fasi concitate, come dopo un gol o un'espulsione, esattamente come le quote live descritte in [scommesse in diretta](/guide/scommesse-in-diretta).",
          },
        ],
      },
      {
        id: "quando",
        title: "Un uso consapevole",
        blocks: [
          {
            type: "list",
            items: [
              "Decidi prima dell'evento se e a quali condizioni useresti il cash out, invece di reagire d'impulso.",
              "Non usare l'importo incassato per giocare subito di nuovo: rientra nel budget che avevi stabilito.",
              "Ricorda che il cash out chiude il rischio, ma non lo elimina dal calcolo complessivo: la giocata è comunque costata il margine.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Perché a volte il pulsante di cash out sparisce?",
        a: "Perché il mercato è sospeso o perché l'operatore non offre il cash out su quel tipo di giocata.",
      },
      {
        q: "Il cash out vale anche per le multiple?",
        a: "Spesso sì, e l'importo tiene conto delle selezioni già vinte e delle quote attuali di quelle ancora in corso.",
      },
    ],
    related: ["scommesse-in-diretta", "come-leggere-le-quote", "gestione-del-budget"],
  },
];
