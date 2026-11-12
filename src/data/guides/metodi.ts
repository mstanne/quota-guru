// Guides – Academy: surebet (arbitrage) and the "scommessa senza rischi" (refund offers). Informative only: what they
// are, the arithmetic and the real limits. No promise of winnings, no invitation to play, no operator names.
// Surebet example: odds 2,10 and 2,05 on the two outcomes of a tennis match; 100 € split 49,40 / 50,60 → 103,73 €.
import type { Guide } from "../guides";
import imgSurebet from "../../assets/guides/surebet.svg";
import imgSenzaRischi from "../../assets/guides/scommessa-senza-rischi.svg";

const UPDATED = "12 novembre 2026";

export const metodiGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "surebet",
    title: "Surebet: cos'è, come si calcola e perché non è un guadagno sicuro",
    description:
      "La surebet sfrutta quote diverse tra operatori per coprire tutti gli esiti. Come si riconosce, come si dividono le puntate e quali limiti la rendono molto meno sicura di quanto dica il nome.",
    category: "academy",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgSurebet,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è una surebet",
        blocks: [
          {
            type: "p",
            text: "Ogni quota corrisponde a una probabilità implicita (1 diviso la quota). Sulle quote di un solo operatore la somma delle probabilità implicite di tutti gli esiti supera il 100%: l'eccedenza è il suo margine. Se però si prendono, per ogni esito, le quote più alte offerte da operatori diversi, a volte la somma scende sotto il 100%. In quel caso, dividendo bene le puntate, si coprono tutti gli esiti con un ritorno più alto della spesa: è la surebet, o arbitraggio.",
          },
        ],
      },
      {
        id: "calcolo",
        title: "Come si calcola",
        blocks: [
          {
            type: "example",
            title: "Esempio su una partita di tennis",
            text: "Un operatore paga il giocatore A a 2,10, un altro paga il giocatore B a 2,05. Probabilità implicite: 1/2,10 = 47,6% e 1/2,05 = 48,8%, in totale 96,4%. Con 100 € si giocano 49,40 € su A e 50,60 € su B: in entrambi i casi tornano circa 103,73 €, cioè 3,73 € in più della spesa.",
          },
          {
            type: "p",
            text: "La regola: ogni puntata è proporzionale alla probabilità implicita del suo esito (puntata = totale × (1/quota) / somma delle probabilità). Il margine di guadagno è 1 diviso la somma delle probabilità, meno 1: nell'esempio 1/0,964 − 1 ≈ 3,7%. Le quote e la probabilità implicita sono spiegate in [come leggere le quote](/guide/come-leggere-le-quote).",
          },
        ],
      },
      {
        id: "limiti",
        title: "Perché non è un guadagno sicuro",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "Le quote cambiano",
                text: "Le differenze che creano una surebet durano poco. Se una delle quote cambia mentre si piazzano le giocate, la copertura salta e una parte resta scoperta.",
              },
              {
                title: "Giocate rifiutate o ridotte",
                text: "Un operatore può accettare solo una parte dell'importo o rifiutare la giocata. Anche in questo caso si resta esposti su un esito.",
              },
              {
                title: "Errori di quota (palpable error)",
                text: "Una quota molto fuori mercato è spesso un errore: i regolamenti permettono all'operatore di annullare o ricalcolare la giocata, mentre l'altra resta valida.",
              },
              {
                title: "Regole diverse tra operatori",
                text: "Ritiri nel tennis, partite rinviate, mercati che includono o no i supplementari: se due operatori assegnano lo stesso evento in modo diverso, si possono perdere entrambe le giocate.",
              },
              {
                title: "Limiti sul conto",
                text: "Gli operatori possono limitare gli importi accettati sui conti che giocano in questo modo, come previsto dai loro termini.",
              },
              {
                title: "Margini piccoli",
                text: "Il guadagno è di pochi punti percentuali: basta un solo errore per cancellare il risultato di molte giocate riuscite.",
              },
            ],
          },
          {
            type: "callout",
            tone: "warn",
            title: "Il nome inganna",
            text: "\"Sure\" significa sicura, ma nella pratica non lo è. Servono capitale distribuito su più conti, tempi rapidi e attenzione ai regolamenti: un approccio che espone a errori costosi e a giocare molto più del previsto.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Le surebet sono legali?",
        a: "Confrontare quote e giocare con operatori diversi non è vietato. Gli operatori però possono limitare i conti o annullare giocate su quote errate, secondo i propri termini.",
      },
      {
        q: "Come capisco se c'è una surebet?",
        a: "Sommando le probabilità implicite (1 diviso la quota) delle quote più alte per ogni esito: se il totale è sotto il 100%, in teoria c'è margine di arbitraggio.",
      },
      {
        q: "Perché le surebet durano poco?",
        a: "Perché gli operatori aggiornano le quote di continuo e le differenze più grandi vengono corrette in fretta, spesso in pochi minuti.",
      },
    ],
    related: ["come-leggere-le-quote", "quota-equa-e-valore-atteso", "varianza-e-serie-negative", "caso-e-probabilita"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommessa-senza-rischi",
    title: "\"Scommessa senza rischi\": cosa significa davvero un rimborso",
    description:
      "Le offerte che rimborsano una giocata persa non la rendono senza rischi: il rimborso arriva di solito come bonus, con requisiti e scadenze. Come leggerle e quanto valgono.",
    category: "academy",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgSenzaRischi,
    sections: [
      {
        id: "cos-e",
        title: "Di cosa si tratta",
        blocks: [
          {
            type: "p",
            text: "Con \"scommessa senza rischi\" o \"rimborso\" si indicano le offerte in cui, se una giocata perde, l'operatore restituisce l'importo o una parte. Il nome fa pensare che non si possa perdere nulla, ma non è così: la giocata si paga comunque e, se perde, quello che torna di solito non è denaro prelevabile.",
          },
        ],
      },
      {
        id: "come-funziona",
        title: "Come arriva il rimborso",
        blocks: [
          {
            type: "list",
            items: [
              "Bonus da rigiocare: il rimborso arriva come bonus (fun bonus o real bonus) che va giocato una o più volte prima di poter prelevare le eventuali vincite.",
              "Freebet: una scommessa gratuita di cui si incassa solo la vincita netta, non l'importo della freebet.",
              "Condizioni sulla giocata: quota minima, numero di eventi, mercati ammessi, importo massimo rimborsabile.",
              "Scadenze: sia per piazzare la giocata sia per usare il rimborso, spesso pochi giorni.",
            ],
          },
        ],
      },
      {
        id: "valore",
        title: "Quanto vale davvero",
        blocks: [
          {
            type: "example",
            title: "Esempio (numeri di fantasia)",
            text: "Giocata da 10 € a quota 2,00 con rimborso in bonus se perde. Se vince, tornano 20 € come senza offerta. Se perde, arrivano 10 € di bonus da giocare, per esempio, tre volte su multiple: per trasformarli in denaro prelevabile bisogna giocare 30 €, e ogni giocata ha il margine dell'operatore. Quello che resta in media è meno di 10 €, e può essere zero.",
          },
          {
            type: "p",
            text: "Il calcolo del valore di un bonus, con requisiti e margine, è spiegato con esempi in [quanto costa un bonus](/guide/quanto-costa-un-bonus) e in [bonus e requisiti di giocata](/guide/bonus-requisiti-di-giocata). Il rimborso riduce la perdita media di quella giocata, ma non toglie il rischio.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Una promessa che le regole non consentono",
            text: "In Italia la pubblicità del gioco è vietata e un'offerta non può essere presentata come un modo per vincere senza rischi. Nessuna giocata è senza rischi: gioca solo somme che puoi permetterti di perdere.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Il rimborso è in denaro prelevabile?",
        a: "Di solito no: arriva come bonus o freebet, con requisiti di giocata e scadenze. Le condizioni dell'offerta indicano la forma esatta.",
      },
      {
        q: "Con un rimborso non si può perdere nulla?",
        a: "No: la giocata si paga comunque e, se perde, il rimborso in bonus vale meno del suo importo nominale per via dei requisiti e del margine dell'operatore.",
      },
      {
        q: "Che differenza c'è tra freebet e bonus da rigiocare?",
        a: "Con la freebet si incassa solo la vincita netta; il bonus va giocato un certo numero di volte prima di poter prelevare le vincite. In entrambi i casi il valore reale è inferiore alla cifra indicata.",
      },
    ],
    related: ["quanto-costa-un-bonus", "bonus-requisiti-di-giocata", "cash-out", "varianza-e-serie-negative"],
  },
];
