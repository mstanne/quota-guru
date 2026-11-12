// Guides – other sports: horse racing (Italian tote and fixed-odds bets), Formula 1, ice hockey, eSports and national
// teams. Same editorial line as the other guides: informative, no promise of winnings, no invitation to play, no
// operator names. Rules that change from operator to operator are described as such ("controlla il regolamento").
import type { Guide } from "../guides";
import imgIppica from "../../assets/guides/scommesse-ippiche.svg";
import imgF1 from "../../assets/guides/scommesse-formula-1.svg";
import imgHockey from "../../assets/guides/scommesse-hockey-su-ghiaccio.svg";
import imgEsports from "../../assets/guides/scommesse-esports.svg";
import imgNazionali from "../../assets/guides/nazionali-mondiali-europei.svg";

const UPDATED = "12 novembre 2026";

export const altriSportGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-ippiche",
    title: "Scommesse sui cavalli: totalizzatore, quota fissa e tipi di giocata",
    description:
      "Come funzionano le scommesse ippiche in Italia: differenza tra totalizzatore e quota fissa, vincente, piazzato, accoppiata, trio, quartè e quintè, cavalli ritirati.",
    category: "sport",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgIppica,
    sections: [
      {
        id: "trotto-galoppo",
        title: "Trotto e galoppo",
        blocks: [
          {
            type: "p",
            text: "Le corse ippiche si dividono in due grandi famiglie. Nel trotto il cavallo traina il guidatore seduto su un carrello a due ruote (il sulky) e deve mantenere l'andatura al trotto: se rompe al galoppo per troppo tempo può essere squalificato. Nel galoppo il fantino monta direttamente il cavallo. Le scommesse sono le stesse per entrambe, ma cambiano i fattori da considerare: nel trotto pesano molto la partenza e la regolarità dell'andatura, nel galoppo il peso portato e il terreno.",
          },
        ],
      },
      {
        id: "totalizzatore-quota-fissa",
        title: "Totalizzatore o quota fissa",
        blocks: [
          {
            type: "p",
            text: "È la differenza più importante. A quota fissa la quota è nota quando si gioca, come nelle scommesse sportive: la possibile vincita è quella indicata sullo scontrino. A totalizzatore invece le puntate di tutti confluiscono in un montepremi: tolta la parte trattenuta per legge, il resto viene diviso tra chi ha indovinato. La quota si conosce solo a corsa finita e dipende da quanto è stato giocato su ogni cavallo.",
          },
          {
            type: "table",
            caption: "Le due modalità a confronto",
            head: ["", "Quota fissa", "Totalizzatore"],
            rows: [
              ["Quota", "Nota al momento della giocata", "Calcolata dopo l'arrivo"],
              ["Da cosa dipende", "Dalla valutazione dell'operatore", "Da quanto hanno puntato tutti sui vari cavalli"],
              ["Giocate disponibili", "Di solito vincente e piazzato", "Vincente, piazzato, accoppiata, trio e, nelle corse previste, quartè e quintè"],
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Quota indicativa",
            text: "Nel totalizzatore la quota mostrata prima della partenza è solo una stima basata sulle puntate fino a quel momento: può cambiare molto negli ultimi minuti.",
          },
        ],
      },
      {
        id: "tipi",
        title: "I tipi di giocata",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Vincente", text: "Si indica il cavallo che arriverà primo." },
              {
                title: "Piazzato",
                text: "Si vince se il cavallo arriva nei primi posti: di solito i primi due o i primi tre, a seconda del numero di partenti. Quota più bassa del vincente.",
              },
              {
                title: "Accoppiata",
                text: "Si indicano i primi due arrivati: in ordine (primo e secondo esatti) oppure in disordine (i due cavalli, in qualunque ordine).",
              },
              {
                title: "Trio (o tris)",
                text: "Si indicano i primi tre arrivati, in ordine o in disordine. Esistono varianti che fissano uno o più cavalli in una posizione e fanno girare gli altri.",
              },
              {
                title: "Quartè e quintè",
                text: "I primi quattro o cinque arrivati. Si giocano solo a totalizzatore e solo nelle corse indicate nel palinsesto nazionale.",
              },
              {
                title: "Abbinate",
                text: "Due giocate nella stessa schedina, per esempio vincente e piazzato sullo stesso cavallo: due possibilità di vincita, ma anche doppio costo.",
              },
            ],
          },
          {
            type: "p",
            text: "Più cavalli bisogna indovinare, più la probabilità scende e la quota sale. Nelle giocate con molte combinazioni (trio in disordine, sistemi) il costo cresce con il numero di combinazioni: il calcolo è lo stesso dei [sistemi](/guide/calcolare-vincita-multipla-sistema).",
          },
        ],
      },
      {
        id: "ritirati",
        title: "Cavalli ritirati e altre regole",
        blocks: [
          {
            type: "p",
            text: "Se un cavallo indicato in una giocata a quota fissa su vincente o piazzato non parte, di norma la giocata su quel cavallo viene rimborsata. Nelle giocate a più cavalli del totalizzatore le regole sui ritirati sono più articolate (per alcune giocate nazionali esistono quote dedicate \"con ritirato\"). L'arrivo che conta è quello ufficiale, dopo eventuali reclami e squalifiche: i dettagli sono nel regolamento del concessionario.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Molte corse, ritmo veloce",
            text: "Le riunioni ippiche propongono una corsa ogni pochi minuti, italiane ed estere, tutto il giorno. È un ritmo che rende facile giocare più del previsto: fissa un limite prima di iniziare ([come si fa](/guide/autoesclusione-e-limiti-di-gioco)).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Che differenza c'è tra vincente e piazzato?",
        a: "Con il vincente il cavallo deve arrivare primo; con il piazzato basta che arrivi nei primi posti (di solito due o tre, secondo il numero di partenti). Il piazzato vince più spesso ma paga meno.",
      },
      {
        q: "Perché la quota del totalizzatore cambia fino all'ultimo?",
        a: "Perché dipende da quanto è stato puntato su ogni cavallo: ogni nuova giocata sposta il montepremi e quindi le quote, che diventano definitive solo dopo l'arrivo.",
      },
      {
        q: "Cosa succede se il mio cavallo non parte?",
        a: "Nelle giocate a quota fissa su vincente e piazzato la puntata viene di norma rimborsata. Per accoppiata, trio, quartè e quintè valgono le regole specifiche del totalizzatore, indicate dal concessionario.",
      },
    ],
    related: ["singola-multipla-sistema", "calcolare-vincita-multipla-sistema", "come-leggere-le-quote", "gestione-del-budget"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-formula-1",
    title: "Formula 1: mercati, weekend di gara e regole di assegnazione",
    description:
      "Vincitore del Gran Premio, podio, pole position, testa a testa e mondiale: come funzionano i mercati della Formula 1, cosa cambia nei weekend sprint e quando un risultato è definitivo.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgF1,
    sections: [
      {
        id: "weekend",
        title: "Com'è fatto un weekend di gara",
        blocks: [
          {
            type: "p",
            text: "Un weekend normale comprende prove libere, qualifiche (il sabato, in tre fasi che eliminano progressivamente i più lenti e stabiliscono la griglia di partenza) e gara la domenica. In alcuni weekend c'è anche una gara sprint, più corta, con una propria qualifica e punti ridotti: sulle sprint esistono mercati separati da quelli del Gran Premio.",
          },
        ],
      },
      {
        id: "mercati",
        title: "I mercati principali",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Vincitore del Gran Premio", text: "Il pilota che vince la gara. È il mercato con più scelta e quote molto diverse tra i favoriti e il resto della griglia." },
              { title: "Podio e piazzamenti", text: "Il pilota chiude tra i primi tre (o tra i primi sei, dieci...). Quote più basse del vincitore." },
              { title: "Pole position", text: "Il pilota più veloce in qualifica, cioè chi partirà primo." },
              { title: "Testa a testa", text: "Quale di due piloti, spesso compagni di squadra, finisce davanti all'altro. Di solito vale la posizione finale, con regole precise se uno dei due si ritira." },
              { title: "Giro veloce, safety car, ritirati", text: "Mercati speciali sul giro più veloce, sull'ingresso della safety car o sul numero di piloti che non arrivano al traguardo." },
              { title: "Mondiale piloti e costruttori", text: "Antepost sui vincitori di fine stagione. Le quote cambiano gara dopo gara." },
            ],
          },
        ],
      },
      {
        id: "regole",
        title: "Quando un risultato è definitivo",
        blocks: [
          {
            type: "p",
            text: "Le penalità in Formula 1 possono arrivare anche ore dopo la bandiera a scacchi, e a volte cambiano l'ordine d'arrivo. Per questo gli operatori fissano un momento di riferimento: molti considerano valida la classifica ufficiale al momento della premiazione sul podio, e le modifiche successive non cambiano l'esito delle scommesse. Non è una regola uguale per tutti: va controllata nel regolamento del concessionario.",
          },
          {
            type: "list",
            items: [
              "Gara interrotta: se la gara viene sospesa e non riparte, conta in genere la classifica ufficiale dichiarata dalla direzione gara.",
              "Pilota che non parte: le giocate sul vincitore di solito restano valide (il pilota è perdente); i testa a testa possono essere annullati. Dipende dal regolamento.",
              "Sprint e Gran Premio: sono eventi diversi, con mercati e risultati separati.",
            ],
          },
        ],
      },
      {
        id: "cosa-conta",
        title: "Cosa incide sul risultato",
        blocks: [
          {
            type: "p",
            text: "La macchina conta più che in quasi ogni altro sport: le differenze di prestazione tra le squadre sono spesso più grandi di quelle tra i piloti. Poi la posizione in griglia (su alcune piste sorpassare è molto difficile), la strategia dei pit stop, il meteo e l'affidabilità. Una safety car o un guasto possono cambiare la gara in un giro: anche il favorito più netto vince molte meno gare di quanto suggerisca la sua velocità.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Se un pilota viene penalizzato dopo la gara, la scommessa cambia?",
        a: "Dipende dal regolamento dell'operatore. Molti considerano definitiva la classifica al momento della premiazione sul podio, quindi le penalità successive non cambiano l'esito.",
      },
      {
        q: "La gara sprint conta per le scommesse sul Gran Premio?",
        a: "No: sprint e Gran Premio sono eventi distinti, ciascuno con i propri mercati e il proprio risultato.",
      },
      {
        q: "Cos'è un testa a testa?",
        a: "Una scommessa su quale di due piloti indicati finirà davanti all'altro, indipendentemente dalla posizione in classifica.",
      },
    ],
    related: ["come-leggere-le-quote", "caso-e-probabilita", "singola-multipla-sistema", "glossario-scommesse"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-hockey-su-ghiaccio",
    title: "Hockey su ghiaccio: 60 minuti, overtime e mercati",
    description:
      "Tempi regolamentari, overtime e shootout nell'NHL e nei campionati europei, esito a tre vie o testa a testa, puck line e totali: cosa sapere prima di leggere le quote dell'hockey.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgHockey,
    sections: [
      {
        id: "durata",
        title: "Tempi regolamentari e overtime",
        blocks: [
          {
            type: "p",
            text: "Una partita di hockey dura 60 minuti effettivi, divisi in tre tempi da 20. Se il punteggio è pari, nella stagione regolare NHL si gioca un overtime di 5 minuti a \"morte improvvisa\" con tre giocatori di movimento per squadra: chi segna vince. Se nessuno segna si va allo shootout, una serie di rigori. Nei playoff invece niente shootout: si giocano tempi supplementari di 20 minuti, cinque contro cinque, finché qualcuno segna.",
          },
          {
            type: "p",
            text: "Molti campionati europei usano lo stesso schema (overtime breve e shootout in stagione, tempi supplementari interi nei playoff), con differenze di dettaglio. Il punto per chi legge le quote è uno solo: bisogna sapere se il mercato comprende overtime e shootout o solo i 60 minuti.",
          },
        ],
      },
      {
        id: "esito",
        title: "Esito a tre vie o testa a testa",
        blocks: [
          {
            type: "table",
            caption: "I due mercati sull'esito",
            head: ["Mercato", "Cosa conta", "Il pareggio"],
            rows: [
              ["1X2 (tre vie)", "Solo i 60 minuti regolamentari", "È un esito possibile (X)"],
              ["Testa a testa (moneyline)", "Partita intera, overtime e shootout compresi", "Non esiste: c'è sempre un vincitore"],
            ],
          },
          {
            type: "example",
            title: "Esempio",
            text: "Partita 2-2 dopo 60 minuti, la squadra di casa vince all'overtime. Chi ha giocato \"1\" sull'esito a tre vie perde (il risultato regolamentare è X); chi ha giocato la squadra di casa nel testa a testa vince.",
          },
        ],
      },
      {
        id: "mercati",
        title: "Puck line e totali",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "Puck line",
                text: "È l'handicap dell'hockey, di solito a ±1,5 gol: la favorita deve vincere con almeno due gol di scarto. Le partite si decidono spesso di un gol, anche per le reti a porta vuota negli ultimi minuti. Il funzionamento delle linee è spiegato in [handicap asiatico](/guide/handicap-asiatico).",
              },
              {
                title: "Over/Under",
                text: "Il totale dei gol, spesso intorno a 5,5 o 6,5. Verifica se conta anche l'overtime: in molti casi sì, mentre lo shootout vale al massimo un gol per la squadra vincente.",
              },
              {
                title: "Mercati per tempo",
                text: "Esito, gol e handicap del singolo tempo da 20 minuti. Valgono solo per quel tempo.",
              },
            ],
          },
        ],
      },
      {
        id: "cosa-conta",
        title: "Cosa incide sulle partite",
        blocks: [
          {
            type: "p",
            text: "Il portiere titolare pesa moltissimo e spesso viene annunciato poco prima della partita. Contano poi le partite ravvicinate (le squadre NHL giocano spesso due sere di fila e fanno riposare il portiere), le superiorità numeriche e gli infortuni. Il punteggio è basso e la fortuna incide molto: anche le squadre più forti perdono spesso contro le più deboli.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Nell'hockey il 1X2 comprende l'overtime?",
        a: "No: l'esito a tre vie vale solo per i 60 minuti regolamentari. Per includere overtime e shootout c'è il testa a testa (moneyline).",
      },
      {
        q: "Lo shootout conta nel totale dei gol?",
        a: "Di norma lo shootout assegna un solo gol alla squadra che lo vince, ai fini del risultato. Se e come conta nell'Over/Under lo stabilisce il regolamento del mercato.",
      },
      {
        q: "Cos'è la puck line?",
        a: "L'handicap dell'hockey, quasi sempre di 1,5 gol: la favorita a -1,5 deve vincere con almeno due gol di scarto, la sfavorita a +1,5 può anche perdere di un gol.",
      },
    ],
    related: ["handicap-asiatico", "mercati-del-calcio", "come-leggere-le-quote", "caso-e-probabilita"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-esports",
    title: "eSports: giochi, formati e mercati delle scommesse",
    description:
      "League of Legends, Counter-Strike, Dota 2 e Valorant: come sono strutturate le partite (mappe e serie al meglio di), quali mercati si trovano e cosa rende le quote degli eSports diverse.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgEsports,
    sections: [
      {
        id: "cosa-sono",
        title: "Cosa sono gli eSports",
        blocks: [
          {
            type: "p",
            text: "Gli eSports sono competizioni professionistiche di videogiochi, con squadre, campionati e tornei internazionali. In Italia alcuni operatori con concessione ADM li inseriscono nel palinsesto, di solito per i titoli più seguiti: League of Legends e Dota 2 (strategia a squadre), Counter-Strike e Valorant (sparatutto tattici).",
          },
        ],
      },
      {
        id: "formati",
        title: "Mappe e serie \"al meglio di\"",
        blocks: [
          {
            type: "p",
            text: "Una sfida è quasi sempre una serie: al meglio di 1, di 3 o di 5 partite (nei giochi tattici si parla di mappe). In una serie al meglio di 3 vince chi conquista per primo due mappe. Il formato conta molto: in una singola mappa la sorpresa è più probabile, in una serie lunga la squadra più forte tende a prevalere.",
          },
        ],
      },
      {
        id: "mercati",
        title: "I mercati principali",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Vincente della serie", text: "Chi vince l'incontro. Non esiste il pareggio, salvo formati particolari indicati nel palinsesto." },
              { title: "Risultato esatto", text: "Il punteggio della serie, per esempio 2-0 o 2-1 in un al meglio di 3." },
              { title: "Handicap mappe", text: "La favorita a -1,5 deve vincere senza perdere mappe (2-0 in un al meglio di 3)." },
              { title: "Totale mappe", text: "Se la serie si chiude al minimo di mappe o va alla decisiva (Over/Under 2,5 mappe)." },
              { title: "Mercati nella mappa", text: "Vincitore della singola mappa, primo obiettivo, totale round o uccisioni: cambiano da gioco a gioco." },
            ],
          },
        ],
      },
      {
        id: "differenze",
        title: "Cosa li rende diversi",
        blocks: [
          {
            type: "list",
            items: [
              "Aggiornamenti del gioco: le patch cambiano personaggi e armi, e con loro gli equilibri tra le squadre. I risultati di qualche mese prima possono contare poco.",
              "Rose che cambiano spesso: un solo giocatore sostituito può cambiare il livello di una squadra.",
              "Meno informazioni: statistiche e notizie sono meno diffuse che nel calcio, e le quote possono avere margini più alti sui tornei minori.",
              "Regole di annullamento: problemi tecnici, partite rigiocate o squadre che si ritirano hanno regole proprie, indicate nel regolamento del concessionario.",
            ],
          },
          {
            type: "callout",
            tone: "warn",
            title: "Vietato ai minori",
            text: "Molti appassionati di videogiochi sono minorenni: le scommesse, anche sugli eSports, sono vietate ai minori di 18 anni.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Cosa significa \"al meglio di 3\"?",
        a: "Che vince la serie chi conquista per primo due mappe (o partite). Se una squadra vince le prime due, la terza non si gioca.",
      },
      {
        q: "Gli eSports si possono giocare sui siti legali italiani?",
        a: "Sì, quando l'operatore con concessione ADM li inserisce nel palinsesto. L'offerta è di solito più ridotta rispetto agli sport tradizionali.",
      },
      {
        q: "Cosa succede se una partita viene rigiocata per problemi tecnici?",
        a: "Dipende dal regolamento dell'operatore: in genere conta il risultato ufficiale del torneo, ma alcuni mercati della singola mappa possono essere annullati.",
      },
    ],
    related: ["handicap-asiatico", "come-leggere-le-quote", "scommesse-in-diretta", "caso-e-probabilita"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "nazionali-mondiali-europei",
    title: "Nazionali: Mondiali, Europei, Nations League e qualificazioni",
    description:
      "Come sono organizzate le competizioni delle nazionali, cosa cambia per le scommesse tra 90 minuti, supplementari e rigori, e quali sono i prossimi grandi tornei.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgNazionali,
    sections: [
      {
        id: "competizioni",
        title: "Le competizioni",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "Mondiali",
                text: "Ogni quattro anni. L'edizione 2026 (Stati Uniti, Canada e Messico) è stata la prima con 48 nazionali e l'ha vinta la Spagna. Il Mondiale 2030 si giocherà tra Spagna, Portogallo e Marocco; il numero di squadre non è ancora definitivo.",
              },
              {
                title: "Europei",
                text: "Ogni quattro anni, a metà tra due Mondiali. Il prossimo, nel 2028, si gioca nel Regno Unito e in Irlanda; le qualificazioni sono previste da marzo a novembre 2027, con gli spareggi a marzo 2028.",
              },
              {
                title: "Nations League",
                text: "Torneo UEFA a leghe con promozioni e retrocessioni, che assegna anche posti negli spareggi per Europei e Mondiali. La UEFA ha approvato un nuovo formato a partire dal 2028.",
              },
              {
                title: "Qualificazioni e amichevoli",
                text: "Le partite di qualificazione si giocano nelle finestre internazionali, quando i campionati si fermano. Le amichevoli contano poco in classifica e le formazioni cambiano molto.",
              },
            ],
          },
        ],
      },
      {
        id: "regolamentari",
        title: "90 minuti, supplementari e rigori",
        blocks: [
          {
            type: "p",
            text: "Nelle fasi a eliminazione diretta una partita in parità va ai supplementari e poi ai rigori. Per le scommesse è decisivo sapere cosa conta: l'esito 1X2, i gol e quasi tutti i mercati valgono solo per i 90 minuti più recupero, come spiegato in [i mercati del calcio](/guide/mercati-del-calcio). Per includere supplementari e rigori esistono mercati dedicati come \"passaggio del turno\" o \"vincente della coppa\".",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Ottavo di finale finito 1-1 dopo 90 minuti, una squadra passa ai rigori. Il segno del mercato 1X2 è X; chi ha giocato quella squadra nel mercato \"passaggio del turno\" vince.",
          },
        ],
      },
      {
        id: "cosa-conta",
        title: "Cosa rende diverse le partite delle nazionali",
        blocks: [
          {
            type: "list",
            items: [
              "Poche partite e rose che cambiano: le nazionali giocano poco e i commissari tecnici cambiano spesso formazione, quindi i dati recenti sono meno affidabili che nei club.",
              "Motivazioni: nelle ultime giornate di un girone una squadra già qualificata può far riposare i titolari.",
              "Viaggi e clima: nei tornei con sedi lontane tra loro contano spostamenti, fusi orari e temperature.",
              "Antepost: le quote sul vincitore del torneo si muovono con sorteggi, infortuni e risultati del girone.",
            ],
          },
          {
            type: "p",
            text: "Sul sito trovi i [pronostici delle nazionali](/pronostici) con le probabilità del modello: sono stime, non certezze.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Nei Mondiali il 1X2 comprende supplementari e rigori?",
        a: "No: l'esito 1X2 vale per i 90 minuti più recupero. Per supplementari e rigori ci sono mercati come \"passaggio del turno\".",
      },
      {
        q: "Quando si gioca il prossimo grande torneo per nazionali?",
        a: "Gli Europei del 2028 nel Regno Unito e in Irlanda; il Mondiale successivo è nel 2030 tra Spagna, Portogallo e Marocco.",
      },
      {
        q: "Le amichevoli sono affidabili per valutare una nazionale?",
        a: "Poco: si sperimentano giocatori e moduli e spesso si fanno molti cambi. Le partite ufficiali danno indicazioni migliori.",
      },
    ],
    related: ["mercati-del-calcio", "analizzare-una-partita-di-calcio", "calendario-coppe-turnover", "caso-e-probabilita"],
  },
];
