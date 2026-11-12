// Guides – bet builder and accumulators (multiple): how the odds are built, what the margin does when selections
// are combined, the "bonus multipla" and the operators' rules. Same editorial line as the other guides: informative,
// no promise of winnings, no invitation to play, no links or names of operators.
// Worked figures: every selection with a 60% probability, offered at 1,59 (fair odds 1,67, margin about 5%);
// theoretical return = 0,6^n × 1,5873^n (exact values in the PR notes).
import type { Guide } from "../guides";
import imgBetBuilder from "../../assets/guides/bet-builder.svg";
import imgMultiple from "../../assets/guides/scommesse-multiple.svg";

const UPDATED = "12 novembre 2026";

export const multipleGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "bet-builder",
    title: "Bet builder: cos'è e come si calcola la quota",
    description:
      "Il bet builder combina più esiti della stessa partita in una sola giocata: come funziona, perché la quota non è il prodotto delle singole quote e quali regole controllare.",
    category: "quote-e-probabilita",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgBetBuilder,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è il bet builder",
        blocks: [
          {
            type: "p",
            text: "Il bet builder (a volte chiamato \"crea scommessa\" o \"combo\") permette di mettere nella stessa giocata più esiti di un'unica partita: per esempio la vittoria di una squadra, l'Over 2,5 e il gol di un certo giocatore. Funziona come una [multipla](/guide/singola-multipla-sistema), ma su un solo evento: per vincere devono verificarsi tutti gli esiti scelti.",
          },
          {
            type: "p",
            text: "In una multipla classica gli eventi sono partite diverse e quindi, in genere, indipendenti tra loro. Nel bet builder invece gli esiti appartengono alla stessa partita e si influenzano a vicenda: è questa la differenza che cambia il calcolo della quota.",
          },
        ],
      },
      {
        id: "quota",
        title: "Perché la quota non è il prodotto delle quote",
        blocks: [
          {
            type: "p",
            text: "Se due esiti fossero indipendenti, la probabilità che si verifichino entrambi sarebbe il prodotto delle due probabilità, e la quota combinata il prodotto delle due quote. Nella stessa partita non è così: se una squadra vince, è più probabile che ci siano molti gol; se il suo attaccante segna, è più probabile che la squadra vinca. Gli esiti sono correlati.",
          },
          {
            type: "example",
            title: "Esempio (numeri di fantasia)",
            text: "Vittoria della squadra di casa a quota 1,80 e Over 2,5 a quota 1,90. Moltiplicando si otterrebbe 3,42. Ma quando la squadra di casa vince, l'Over 2,5 è più frequente del solito: la probabilità che accadano entrambi è più alta di quella calcolata come se fossero indipendenti. Per questo l'operatore propone una quota più bassa, per esempio 3,10.",
          },
          {
            type: "p",
            text: "La quota del bet builder è quindi una stima dell'operatore sulla probabilità congiunta, a cui si aggiunge il suo margine. Non c'è un modo semplice per verificarla dall'esterno: si può solo confrontarla con il prodotto delle singole quote, sapendo che sarà quasi sempre più bassa quando gli esiti \"vanno nella stessa direzione\" e più alta quando si contraddicono (per esempio vittoria con molti gol di scarto e Under 1,5, che non possono verificarsi insieme e di solito non sono accettati).",
          },
        ],
      },
      {
        id: "margine",
        title: "Il margine in una combinazione",
        blocks: [
          {
            type: "p",
            text: "Su ogni quota l'operatore applica un margine, cioè paga un po' meno di quanto varrebbe la probabilità (lo spieghiamo in [come leggere le quote](/guide/come-leggere-le-quote)). In una combinazione i margini si sommano: più esiti si aggiungono, più la quota finale si allontana da quella equa. Nel bet builder si aggiunge l'incertezza sulla correlazione, che l'operatore tende a coprire con un margine più ampio rispetto ai mercati singoli.",
          },
          {
            type: "callout",
            tone: "info",
            title: "In pratica",
            text: "Più selezioni significano una quota più alta ma anche un ritorno medio più basso per ogni euro giocato. I numeri sono nella guida alle [scommesse multiple](/guide/scommesse-multiple).",
          },
        ],
      },
      {
        id: "regole",
        title: "Le regole da controllare",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "Mercati ammessi",
                text: "Non tutti i mercati si possono combinare: di solito si possono unire esito finale, gol, angoli, cartellini e marcatori, ma l'elenco cambia da partita a partita.",
              },
              {
                title: "Giocatore che non scende in campo",
                text: "Se un esito riguarda un giocatore che non gioca, alcuni operatori annullano l'intera giocata, altri tolgono solo quell'esito e ricalcolano la quota. È scritto nel regolamento dell'operatore.",
              },
              {
                title: "Cash out",
                text: "Il [cash out](/guide/cash-out) sul bet builder non è sempre disponibile, e quando c'è l'importo proposto include il margine dell'operatore.",
              },
              {
                title: "Bonus",
                text: "Molte offerte escludono il bet builder dalle giocate che contano per i [requisiti di giocata](/guide/bonus-requisiti-di-giocata) o lo trattano come una singola: le condizioni dell'offerta lo dicono.",
              },
            ],
          },
        ],
      },
      {
        id: "rischi",
        title: "Cosa tenere a mente",
        blocks: [
          {
            type: "p",
            text: "Il bet builder rende facile costruire giocate con quote alte su una sola partita, e proprio per questo invita ad aggiungere un esito dopo l'altro. Ogni aggiunta riduce la probabilità di vincere più di quanto aumenti la quota, per effetto del margine. Le giocate perse \"per un solo esito\" sono frequenti e non indicano di essere vicini alla vincita: lo spieghiamo in [caso e probabilità](/guide/caso-e-probabilita).",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Un limite da fissare prima",
            text: "Decidi in anticipo quanto vuoi spendere e non aumentarlo durante la partita. Su ogni conto di gioco si possono impostare limiti di deposito: come si fa in [autoesclusione e limiti di gioco](/guide/autoesclusione-e-limiti-di-gioco).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Il bet builder è una multipla?",
        a: "Sì, nel senso che vince solo se tutti gli esiti si verificano. La differenza è che gli esiti sono della stessa partita e quindi correlati: per questo la quota non è il prodotto delle singole quote.",
      },
      {
        q: "Perché la quota del bet builder è più bassa del prodotto delle quote?",
        a: "Perché esiti come vittoria e Over, o gol di un attaccante e vittoria della sua squadra, tendono a verificarsi insieme: la probabilità congiunta è più alta di quella che risulterebbe moltiplicando, e la quota si abbassa di conseguenza.",
      },
      {
        q: "Cosa succede se un esito viene annullato?",
        a: "Dipende dal regolamento dell'operatore: in alcuni casi la giocata viene annullata e rimborsata, in altri l'esito viene tolto e la quota ricalcolata sugli altri.",
      },
      {
        q: "Si può fare un bet builder su partite diverse?",
        a: "No: per definizione riguarda una sola partita. Più partite nella stessa giocata formano una multipla, che a volte può contenere a sua volta un bet builder per ciascuna partita se l'operatore lo permette.",
      },
    ],
    related: ["scommesse-multiple", "singola-multipla-sistema", "come-leggere-le-quote", "mercati-del-calcio"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-multiple",
    title: "Scommesse multiple: probabilità, margine e bonus multipla",
    description:
      "Cosa succede alla probabilità e al ritorno medio quando si aggiungono eventi a una multipla, come funziona il bonus multipla e quali regole valgono per eventi rinviati e annullati.",
    category: "quote-e-probabilita",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgMultiple,
    sections: [
      {
        id: "come-funziona",
        title: "Come funziona una multipla",
        blocks: [
          {
            type: "p",
            text: "Una multipla (o accumulata) riunisce più eventi in una sola giocata: le quote si moltiplicano tra loro e la giocata vince solo se tutti i pronostici sono corretti. Le differenze con singola e sistema sono spiegate in [singola, multipla e sistema](/guide/singola-multipla-sistema); come calcolare la vincita, in [calcolare la vincita di una multipla](/guide/calcolare-vincita-multipla-sistema).",
          },
          {
            type: "p",
            text: "La quota alta è l'aspetto che si nota di più. Quello che conta, però, è cosa succede alla probabilità di vincere e al ritorno medio per ogni euro giocato quando gli eventi aumentano.",
          },
        ],
      },
      {
        id: "probabilita",
        title: "La probabilità scende in fretta",
        blocks: [
          {
            type: "p",
            text: "Se gli eventi sono indipendenti, la probabilità che siano tutti corretti è il prodotto delle singole probabilità. Anche con pronostici \"probabili\", la probabilità complessiva cala rapidamente.",
          },
          {
            type: "table",
            caption: "Eventi che hanno ciascuno il 60% di probabilità",
            head: ["Eventi nella multipla", "Probabilità che siano tutti corretti"],
            rows: [
              ["1", "60%"],
              ["2", "36%"],
              ["3", "21,6%"],
              ["5", "7,8%"],
              ["8", "1,7%"],
              ["10", "0,6%"],
            ],
          },
          {
            type: "p",
            text: "Con dieci eventi al 60%, in media vince meno di una multipla su 160. Nessuna conoscenza del calcio cambia questo ordine di grandezza: lo cambia solo il numero di eventi.",
          },
        ],
      },
      {
        id: "margine",
        title: "Il margine si moltiplica",
        blocks: [
          {
            type: "p",
            text: "La quota offerta da un operatore è più bassa di quella equa: la differenza è il suo margine. In una multipla le quote si moltiplicano, e con esse si moltiplica il margine. Il ritorno teorico, cioè la parte della puntata che in media torna a chi gioca, scende a ogni evento aggiunto.",
          },
          {
            type: "table",
            caption: "Eventi al 60% offerti a quota 1,59 invece della quota equa 1,67 (margine di circa il 5%)",
            head: ["Eventi", "Quota equa", "Quota offerta", "Ritorno teorico"],
            rows: [
              ["1", "1,67", "1,59", "95,2%"],
              ["3", "4,63", "4,00", "86,4%"],
              ["5", "12,86", "10,08", "78,4%"],
              ["8", "59,54", "40,30", "67,7%"],
              ["10", "165,38", "101,53", "61,4%"],
            ],
          },
          {
            type: "p",
            text: "Con una singola, in media, tornano circa 95 centesimi per ogni euro giocato; con una multipla da dieci eventi ne tornano circa 61. Il concetto di quota equa e di valore atteso è spiegato in [quota equa e valore atteso](/guide/quota-equa-e-valore-atteso).",
          },
        ],
      },
      {
        id: "bonus-multipla",
        title: "Il bonus multipla",
        blocks: [
          {
            type: "p",
            text: "Molti operatori offrono un \"bonus multipla\": una maggiorazione percentuale della vincita che cresce con il numero di eventi, a partire da un minimo (spesso 3, 4 o 5 eventi) e con una quota minima per evento. La maggiorazione riduce l'effetto del margine, ma non lo annulla.",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Multipla da 5 eventi al 60%, quota offerta 10,08, ritorno teorico 78,4%. Con un bonus multipla del 15% sulla vincita il ritorno teorico sale a circa il 90%: resta sotto il 100%, cioè in media si perde comunque una parte della puntata. E per avere diritto alla maggiorazione bisogna aggiungere eventi, che abbassano la probabilità di vincere.",
          },
          {
            type: "p",
            text: "Le condizioni del bonus multipla (numero minimo di eventi, quota minima, mercati esclusi, importo massimo) sono nelle pagine delle promozioni di ogni operatore e cambiano spesso.",
          },
        ],
      },
      {
        id: "regole",
        title: "Eventi rinviati, annullati e correlati",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "Evento rinviato o annullato",
                text: "Di solito l'evento viene considerato a quota 1: la multipla resta valida con gli altri eventi e la quota totale si riduce. I tempi oltre i quali un rinvio conta come annullamento sono nel regolamento dell'operatore.",
              },
              {
                title: "Eventi correlati",
                text: "Esiti collegati tra loro (per esempio il vincitore di una partita e il vincitore del girone che la comprende) spesso non si possono mettere nella stessa multipla. Per combinare esiti della stessa partita esiste il [bet builder](/guide/bet-builder).",
              },
              {
                title: "Minimo e massimo di eventi",
                text: "Alcune partite o mercati richiedono un numero minimo di eventi in schedina; esiste anche un numero massimo di eventi e una vincita massima per giocata, fissati dal regolamento.",
              },
              {
                title: "Cash out",
                text: "Su una multipla il [cash out](/guide/cash-out) è possibile solo se tutti gli eventi rimasti lo prevedono, e l'importo proposto include il margine dell'operatore.",
              },
            ],
          },
        ],
      },
      {
        id: "cosa-sapere",
        title: "Cosa tenere a mente",
        blocks: [
          {
            type: "p",
            text: "Una multipla con molti eventi costa poco e promette una vincita alta: è una combinazione che rende facile sottovalutare quanto sia improbabile vincere. Le multiple perse per un solo evento sono la norma, non un segnale di essere vicini alla vincita.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Gioca solo ciò che puoi perdere",
            text: "Fissa un budget prima di giocare e non provare a recuperare le perdite con multiple più lunghe. Se il gioco smette di essere un divertimento, la guida su [dove chiedere aiuto](/guide/gioco-problematico-dove-chiedere-aiuto) indica i servizi gratuiti e anonimi.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Quanti eventi conviene mettere in una multipla?",
        a: "Ogni evento in più riduce sia la probabilità di vincere sia il ritorno medio, per effetto del margine che si moltiplica. Non esiste un numero che renda la multipla favorevole a chi gioca.",
      },
      {
        q: "Il bonus multipla rende conveniente la giocata?",
        a: "Riduce l'effetto del margine ma di solito non lo compensa: nell'esempio della guida una maggiorazione del 15% su 5 eventi porta il ritorno teorico dal 78% al 90% circa, sempre sotto il 100%.",
      },
      {
        q: "Cosa succede se una partita della multipla viene rinviata?",
        a: "Nella maggior parte dei casi l'evento conta a quota 1 e la multipla prosegue con gli altri. Il regolamento dell'operatore indica dopo quanto tempo un rinvio diventa annullamento.",
      },
      {
        q: "Che differenza c'è tra multipla e bet builder?",
        a: "La multipla unisce eventi di partite diverse, il bet builder esiti della stessa partita. Nel bet builder gli esiti sono correlati e la quota non è il semplice prodotto delle singole quote.",
      },
    ],
    related: ["bet-builder", "singola-multipla-sistema", "calcolare-vincita-multipla-sistema", "quota-equa-e-valore-atteso"],
  },
];
