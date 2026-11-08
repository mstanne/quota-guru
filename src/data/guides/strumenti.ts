// Guides – how to use the site's own tools: the prediction model and the TV guide. Inline links: [testo](/percorso).
import type { Guide } from "../guides";
import imgModello from "../../assets/guides/come-funzionano-le-probabilita-di-quotaguru.svg";
import imgTv from "../../assets/guides/calcio-in-tv-diritti.svg";

const UPDATED = "8 novembre 2026";

export const strumentiGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "come-funzionano-le-probabilita-di-quotaguru",
    title: "Come funzionano le probabilità di QuotaGuru",
    description:
      "Il modello di Poisson spiegato in modo semplice: da dove vengono le probabilità delle partite, cosa significa l'affidabilità, cosa il modello non sa e come verificarne i risultati.",
    category: "analisi",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgModello,
    sections: [
      {
        id: "idea",
        title: "L'idea in breve",
        blocks: [
          {
            type: "p",
            text: "Le probabilità che trovi nelle pagine dei [pronostici](/pronostici) non sono opinioni della redazione: le calcola un modello statistico, sempre con lo stesso metodo, senza alcun rapporto con gli operatori. Il modello stima quanti gol segnerà in media ciascuna squadra e da lì ricava la probabilità di ogni risultato.",
          },
        ],
      },
      {
        id: "forza",
        title: "1. La forza delle squadre",
        blocks: [
          {
            type: "p",
            text: "Per ogni squadra il modello stima una forza in attacco e una in difesa, partendo dai gol segnati e subiti nella stagione in corso e nelle due precedenti. Le partite recenti contano di più: il peso di una partita si dimezza dopo un anno. Si aggiungono il fattore campo di ogni campionato e, nelle coppe europee, la differenza di livello fra i campionati.",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Una squadra che segna più della media del campionato ha un attacco superiore a 1; una che subisce meno della media ha una difesa migliore. Mettendo insieme l'attacco di una squadra, la difesa dell'altra e il fattore campo si ottengono i gol attesi, per esempio 1,5 per la squadra di casa e 1,1 per l'ospite.",
          },
        ],
      },
      {
        id: "poisson",
        title: "2. Dai gol attesi alle probabilità",
        blocks: [
          {
            type: "p",
            text: "I gol attesi di ciascuna squadra diventano una distribuzione di Poisson: la probabilità che segni 0, 1, 2, 3 gol e così via. Incrociando le due distribuzioni si ottiene la probabilità di ogni risultato esatto. Il modello di Poisson puro sottostima i pareggi con pochi gol, perciò si applica la correzione di Dixon e Coles su 0-0, 1-0, 0-1 e 1-1.",
          },
          {
            type: "p",
            text: "Sommando i risultati esatti si ricavano tutti i mercati: 1X2, doppia chance, [Under/Over](/guide/under-over-2-5), [Goal/No goal](/guide/goal-no-goal) e i [risultati esatti](/guide/risultato-esatto-parziale-finale) più probabili.",
          },
          {
            type: "table",
            head: ["Gol attesi", "Casa 1,5 · Ospite 1,1"],
            rows: [
              ["Risultato più probabile", "1-1 (circa 12%)"],
              ["Under 2,5", "circa 52%"],
              ["Goal", "circa 52%"],
            ],
            caption: "Valori del modello di Poisson semplice, prima della correzione per i pareggi.",
          },
        ],
      },
      {
        id: "affidabilita",
        title: "3. L'affidabilità",
        blocks: [
          {
            type: "p",
            text: "Ogni pronostico ha un'indicazione di affidabilità (alta, media o bassa) che dipende da quante partite recenti il modello conosce delle due squadre. Se una squadra ha troppo pochi dati, per esempio un club alla prima partita europea contro squadre che il sito non segue, il pronostico non viene pubblicato.",
          },
        ],
      },
      {
        id: "limiti",
        title: "4. Cosa il modello non sa",
        blocks: [
          {
            type: "list",
            items: [
              "Infortuni, squalifiche e formazioni: li trovi a parte nelle pagine delle partite, ma il modello non li usa.",
              "Turnover dovuto alle coppe e al calendario ([calendario, coppe e turnover](/guide/calendario-coppe-turnover)).",
              "Motivazioni di classifica, cambi di allenatore, meteo.",
            ],
          },
          {
            type: "callout",
            tone: "warn",
            title: "Un punto di partenza",
            text: "Una probabilità del 60% significa che, su molte partite simili, l'esito si verifica circa 6 volte su 10: le altre 4 no. Il modello non indica giocate e non garantisce risultati.",
          },
        ],
      },
      {
        id: "verifica",
        title: "5. Come verificare i risultati",
        blocks: [
          {
            type: "list",
            items: [
              "Ogni pronostico viene archiviato prima del calcio d'inizio e da quel momento non cambia più: le pagine delle partite giocate mostrano il pronostico pubblicato e il risultato.",
              "Il [bilancio dei pronostici](/bilancio-pronostici) misura nel tempo quante volte l'esito più probabile si è verificato.",
              "L'archivio completo è scaricabile dalla pagina [Metodologia](/metodologia), dove trovi anche la descrizione tecnica del modello e di quello per l'NBA.",
            ],
          },
          {
            type: "p",
            text: "Per confrontare una probabilità con una quota leggi [quota equa e valore atteso](/guide/quota-equa-e-valore-atteso).",
          },
        ],
      },
    ],
    faq: [
      { q: "Le probabilità cambiano prima della partita?", a: "Sì, a ogni aggiornamento del sito, quando arrivano nuovi risultati. Dal calcio d'inizio il pronostico archiviato resta bloccato." },
      { q: "Perché non viene considerata la formazione?", a: "Il modello si basa solo su dati misurabili allo stesso modo per tutte le squadre. Le formazioni ufficiali sono mostrate a parte nella pagina della partita." },
      { q: "Il modello usa le quote degli operatori?", a: "No: le probabilità sono calcolate solo dai risultati delle partite, in modo indipendente dalle quote." },
    ],
    related: ["quota-equa-e-valore-atteso", "under-over-2-5", "expected-goals", "varianza-e-serie-negative"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "calcio-in-tv-diritti",
    title: "Calcio in TV: chi trasmette le partite in Italia",
    description:
      "Come sono divisi i diritti TV del calcio in Italia nella stagione 2026/27: Serie A, Serie B, coppe europee e campionati esteri, e come trovare il canale di ogni partita.",
    category: "analisi",
    readTime: "4 min",
    updatedAt: UPDATED,
    image: imgTv,
    sections: [
      {
        id: "come",
        title: "Come funzionano i diritti",
        blocks: [
          {
            type: "p",
            text: "Ogni competizione vende i diritti di trasmissione per più stagioni, spesso a più emittenti insieme. Per questo la stessa sera due partite dello stesso turno possono andare su piattaforme diverse, e lo stesso campionato può cambiare canale da un ciclo di contratti all'altro.",
          },
        ],
      },
      {
        id: "stagione",
        title: "La stagione 2026/27",
        blocks: [
          {
            type: "table",
            head: ["Competizione", "Dove si vede"],
            rows: [
              ["Serie A", "Tutte le 380 partite su DAZN; 3 partite per giornata anche su Sky, in co-esclusiva (sabato 20:45, domenica 18:00, lunedì 20:45)"],
              ["Serie B", "Tutte le partite su DAZN e Prime Video (LaB Channel)"],
              ["Champions League", "Sky e NOW, finale compresa; la miglior partita del mercoledì in esclusiva su Prime Video"],
              ["Europa League e Conference League", "Tutte le partite su Sky e NOW"],
              ["Premier League e Bundesliga", "Sky e NOW"],
              ["LaLiga", "DAZN"],
            ],
            caption: "Accordi verificati per la stagione 2026/27. Per gli altri campionati seguiti dal sito non è indicato un canale finché non c'è un accordo verificato.",
          },
        ],
      },
      {
        id: "canale",
        title: "Come trovare il canale di una partita",
        blocks: [
          {
            type: "list",
            items: [
              "La pagina [calcio in TV oggi](/calcio-in-tv-oggi) elenca le partite di oggi e domani con il canale di ciascuna, ricontrollato ogni giorno sui palinsesti ufficiali.",
              "Nella pagina di ogni partita la riga \"In TV\" del riquadro informazioni indica il canale secondo gli accordi sui diritti.",
              "Quando il canale dipende da una scelta settimanale non ancora comunicata (per esempio la partita di Champions su Prime Video), la pagina lo dice invece di indovinare.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Solo canali legali",
            text: "Le trasmissioni pirata espongono a sanzioni anche chi le guarda e spesso a malware. Il sito indica solo emittenti titolari dei diritti.",
          },
        ],
      },
    ],
    faq: [
      { q: "Perché una partita di Serie A non è su Sky?", a: "Sky trasmette solo 3 partite per giornata, in fasce orarie fisse; tutte le altre sono solo su DAZN." },
      { q: "I diritti cambiano ogni anno?", a: "Dipende dai contratti: la Serie A ha accordi pluriennali, altre competizioni cambiano più spesso. Il sito aggiorna i canali all'inizio di ogni stagione." },
    ],
    related: ["calendario-coppe-turnover", "come-funzionano-le-probabilita-di-quotaguru", "analizzare-una-partita-di-calcio", "scommesse-in-diretta"],
  },
];
