// Guides – "Sport specifici": football markets in depth, tennis retirements and NBA player props.
// Inline links: [testo](/percorso). Informative only: no operator links or calls to play (Decreto Dignità).
import type { Guide } from "../guides";
import imgUnderOver from "../../assets/guides/under-over-2-5.svg";
import imgGoal from "../../assets/guides/goal-no-goal.svg";
import imgCorner from "../../assets/guides/calci-d-angolo-e-cartellini.svg";
import imgMarcatori from "../../assets/guides/scommesse-marcatori.svg";
import imgEsatto from "../../assets/guides/risultato-esatto-parziale-finale.svg";
import imgTennis from "../../assets/guides/tennis-ritiri-e-walkover.svg";
import imgProps from "../../assets/guides/nba-player-props.svg";

const UPDATED = "8 novembre 2026";

export const mercatiGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "under-over-2-5",
    title: "Under/Over 2,5: come funziona e come leggere le statistiche",
    description:
      "Cosa significano Under e Over 2,5, perché la soglia ha il mezzo gol, come si ricava la probabilità dai gol attesi e quali statistiche dei campionati guardare.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgUnderOver,
    sections: [
      {
        id: "regola",
        title: "La regola in una riga",
        blocks: [
          {
            type: "p",
            text: "L'Over 2,5 è vincente se nella partita si segnano almeno 3 gol in totale, l'Under 2,5 se se ne segnano 2 o meno. Contano i gol di entrambe le squadre, compresi gli autogol, nei soli tempi regolamentari: supplementari e rigori restano fuori, come spiegato in [i mercati del calcio](/guide/mercati-del-calcio).",
          },
          {
            type: "table",
            head: ["Risultato", "Gol totali", "Under 2,5", "Over 2,5"],
            rows: [
              ["0-0, 1-0, 1-1, 2-0", "0–2", "Vincente", "Perdente"],
              ["2-1, 3-0", "3", "Perdente", "Vincente"],
              ["2-2, 3-1, 4-0 e oltre", "4 o più", "Perdente", "Vincente"],
            ],
          },
        ],
      },
      {
        id: "mezzo-gol",
        title: "Perché il mezzo gol",
        blocks: [
          {
            type: "p",
            text: "Con una soglia intera, per esempio 3, un risultato con esattamente 3 gol non sarebbe né sopra né sotto. Il mezzo gol elimina la parità: l'esito è sempre uno dei due. Le stesse regole valgono per le altre soglie: 0,5, 1,5, 3,5, 4,5. Esistono anche soglie su un solo tempo o su una sola squadra (Over 1,5 della squadra di casa, per esempio).",
          },
          {
            type: "p",
            text: "Le soglie intere o divise in quarti appartengono all'Under/Over asiatico, dove in caso di parità la puntata viene rimborsata in tutto o in parte: trovi gli esempi in [handicap asiatico](/guide/handicap-asiatico).",
          },
        ],
      },
      {
        id: "probabilita",
        title: "Dai gol attesi alla probabilità",
        blocks: [
          {
            type: "p",
            text: "Se si stima quanti gol produrranno in media le due squadre insieme, la distribuzione di Poisson dà la probabilità di ogni numero di gol. È lo stesso principio usato dal modello di QuotaGuru, descritto in [come funzionano le probabilità di QuotaGuru](/guide/come-funzionano-le-probabilita-di-quotaguru).",
          },
          {
            type: "example",
            title: "Esempio: 2,6 gol attesi in totale",
            text: "Con 2,6 gol attesi la probabilità di 0, 1 o 2 gol è circa il 51,8%: è la probabilità dell'Under 2,5. L'Over 2,5 vale il restante 48,2%. Le quote equivalenti, senza margine, sarebbero circa 1,93 per l'Under e 2,08 per l'Over: una quota offerta più bassa contiene il margine dell'operatore.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Una stima, non una certezza",
            text: "Anche un 52% contro 48% significa che quasi una partita su due va dall'altra parte. Il confronto fra probabilità e quota è spiegato in [quota equa e valore atteso](/guide/quota-equa-e-valore-atteso).",
          },
        ],
      },
      {
        id: "statistiche",
        title: "Quali statistiche guardare",
        blocks: [
          {
            type: "list",
            items: [
              "La media gol del campionato: alcuni tornei producono stabilmente più gol di altri. Le pagine [statistiche Under/Over della Serie A](/calcio/serie-a/statistiche-under-over) e degli altri campionati mostrano le percentuali di ogni squadra.",
              "Gol fatti e subiti in casa e in trasferta separatamente: la stessa squadra può avere profili molto diversi.",
              "Expected goals (xG): dicono quante occasioni crea e concede una squadra, al di là della fortuna sotto porta. Vedi [cosa sono gli expected goals](/guide/expected-goals).",
              "Contesto: assenze in attacco o in difesa, turnover per le coppe, partite in cui a una squadra basta un pareggio.",
            ],
          },
          {
            type: "p",
            text: "Le percentuali delle ultime 5 partite cambiano molto da una settimana all'altra: per farsi un'idea servono campioni più ampi, come una stagione intera.",
          },
        ],
      },
    ],
    faq: [
      { q: "L'autogol conta per l'Over?", a: "Sì: per l'Under/Over contano tutti i gol registrati nel risultato finale dei tempi regolamentari." },
      { q: "E se la partita viene sospesa?", a: "Dipende dal regolamento: se l'Over è già stato superato prima della sospensione, di solito la scommessa viene pagata; altrimenti segue le regole sugli eventi non conclusi." },
      { q: "L'Under/Over del primo tempo funziona allo stesso modo?", a: "Sì, ma conta solo il risultato all'intervallo, recupero del primo tempo compreso." },
    ],
    related: ["goal-no-goal", "risultato-esatto-parziale-finale", "expected-goals", "mercati-del-calcio"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "goal-no-goal",
    title: "Goal/No goal: cosa significa e quando conta",
    description:
      "Il mercato \"entrambe le squadre segnano\": regole, differenze con l'Under/Over, come stimare la probabilità e quali dati osservare nelle due squadre.",
    category: "sport",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgGoal,
    sections: [
      {
        id: "regola",
        title: "La regola",
        blocks: [
          {
            type: "p",
            text: "Goal (GG) è vincente se entrambe le squadre segnano almeno un gol nei tempi regolamentari; No goal (NG) se almeno una delle due resta a zero. Il risultato conta solo per chi ha segnato, non per quanto: 1-1 e 4-3 sono entrambi Goal, 5-0 è No goal.",
          },
          {
            type: "cards",
            items: [
              { title: "Goal", text: "1-1, 2-1, 3-2, 1-4: tutte e due le squadre hanno segnato." },
              { title: "No goal", text: "0-0, 1-0, 3-0, 0-2: almeno una squadra non ha segnato." },
              { title: "Autogol", text: "Vale per la squadra a cui viene assegnato il gol, cioè l'avversaria di chi lo ha segnato." },
            ],
          },
        ],
      },
      {
        id: "differenze",
        title: "Non è un Over",
        blocks: [
          {
            type: "p",
            text: "Goal e Over 2,5 vengono spesso confusi, ma non coincidono. Un 1-1 è Goal e Under 2,5; un 3-0 è No goal e Over 2,5. Il Goal dipende dall'equilibrio fra le due squadre più che dal numero totale di gol: una partita con un netto favorito che difende bene può essere da molti gol e da No goal insieme.",
          },
          {
            type: "p",
            text: "Molti operatori offrono anche combinazioni come Goal + Over 2,5 o 1 + Goal: sono come una piccola multipla sulla stessa partita, con una quota più alta perché devono verificarsi entrambe le condizioni.",
          },
        ],
      },
      {
        id: "probabilita",
        title: "Come si stima la probabilità",
        blocks: [
          {
            type: "p",
            text: "Se si conoscono i gol attesi di ciascuna squadra, la probabilità che una squadra segni almeno un gol si ricava con la distribuzione di Poisson. Moltiplicando le due probabilità (con l'ipotesi, semplificata, che i gol delle due squadre siano indipendenti) si ottiene il Goal.",
          },
          {
            type: "example",
            title: "Esempio: 1,5 gol attesi per la squadra di casa, 1,1 per l'ospite",
            text: "La squadra di casa segna almeno un gol con probabilità del 77,7% circa, l'ospite del 66,7%. Il Goal vale 0,777 × 0,667 ≈ 51,8%, il No goal il 48,2%. Basta che una delle due squadre abbia pochi gol attesi perché il No goal diventi il favorito.",
          },
        ],
      },
      {
        id: "dati",
        title: "Quali dati osservare",
        blocks: [
          {
            type: "list",
            items: [
              "Percentuale di partite in cui ciascuna squadra segna e in cui non subisce gol (clean sheet), divise fra casa e trasferta. Le trovi nelle pagine [statistiche Under/Over e Goal](/calcio/serie-a/statistiche-under-over) di ogni campionato.",
              "Expected goals creati e concessi: una squadra che segna poco ma crea molto può tornare a segnare presto ([expected goals](/guide/expected-goals)).",
              "Assenze dei titolari in attacco o del portiere, e partite in cui una squadra ha poco da chiedere al risultato.",
            ],
          },
        ],
      },
    ],
    faq: [
      { q: "Il Goal si può giocare anche sul primo tempo?", a: "Sì, alcuni operatori offrono Goal/No goal sul primo o sul secondo tempo: conta solo la frazione indicata." },
      { q: "Una partita sospesa sull'1-1 è Goal?", a: "Spesso sì, perché l'esito è già deciso, ma fa fede il regolamento dell'operatore sulle partite non concluse." },
    ],
    related: ["under-over-2-5", "risultato-esatto-parziale-finale", "mercati-del-calcio", "analizzare-una-partita-di-calcio"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "calci-d-angolo-e-cartellini",
    title: "Calci d'angolo e cartellini: come funzionano questi mercati",
    description:
      "Totale corner, handicap corner, cartellini e punteggio cartellini: le regole di conteggio, le eccezioni più comuni e i dati utili per farsi un'idea.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgCorner,
    sections: [
      {
        id: "corner",
        title: "I mercati sui calci d'angolo",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Totale corner", text: "Under/Over su una soglia, per esempio 9,5: contano i corner battuti da entrambe le squadre." },
              { title: "Corner di squadra", text: "Under/Over sui soli corner di una squadra." },
              { title: "Handicap corner", text: "Si aggiunge o toglie un numero di corner a una squadra, come nell'handicap sui gol." },
              { title: "1X2 corner", text: "Quale squadra batterà più calci d'angolo." },
            ],
          },
          {
            type: "p",
            text: "Di norma conta un corner assegnato e battuto: se l'arbitro lo concede ma poi lo annulla prima della battuta, oppure lo fa ripetere, viene conteggiato una sola volta o per nulla secondo il regolamento. Contano i tempi regolamentari.",
          },
        ],
      },
      {
        id: "cartellini",
        title: "I mercati sui cartellini",
        blocks: [
          {
            type: "p",
            text: "Qui le regole cambiano parecchio da un operatore all'altro. Prima di valutare questo mercato serve leggere come vengono contati:",
          },
          {
            type: "table",
            head: ["Sistema", "Come funziona"],
            rows: [
              ["Numero di cartellini", "Ogni giallo vale 1; il rosso diretto vale di solito 2. Il secondo giallo che porta all'espulsione può valere 1 o 2, a seconda del regolamento."],
              ["Punteggio cartellini", "Ogni cartellino ha un valore in punti (per esempio 10 il giallo e 25 il rosso) e si gioca l'Under/Over sul totale dei punti."],
              ["Giocatore ammonito", "Si sceglie un giocatore: è vincente se riceve almeno un cartellino durante la partita."],
            ],
            caption: "Valori indicativi: ogni operatore definisce i propri nel regolamento.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Cartellini che di solito non contano",
            text: "Ammonizioni a giocatori in panchina, ad allenatori o allo staff, e cartellini mostrati dopo il fischio finale, spesso non vengono conteggiati. Controlla sempre questa parte del regolamento.",
          },
        ],
      },
      {
        id: "dati",
        title: "I dati utili",
        blocks: [
          {
            type: "list",
            items: [
              "Corner e cartellini medi di ogni squadra, fatti e subiti: li trovi nelle pagine [statistiche corner e cartellini](/calcio/serie-a/statistiche-corner-cartellini) dei campionati.",
              "Stile di gioco: chi attacca sulle fasce e crossa molto tende a guadagnare più corner; chi difende basso ne concede.",
              "Arbitro e tipo di partita: derby, scontri salvezza e partite con molto in palio hanno in media più ammonizioni. L'arbitro designato si conosce di solito pochi giorni prima.",
              "Andamento della partita: una squadra in svantaggio attacca di più e guadagna corner, ma il risultato non si conosce in anticipo.",
            ],
          },
          {
            type: "p",
            text: "Sono eventi meno frequenti e più legati a singoli episodi rispetto ai gol: la varianza è alta anche quando le medie sembrano chiare. Ne parla [varianza e serie negative](/guide/varianza-e-serie-negative).",
          },
        ],
      },
    ],
    faq: [
      { q: "I corner dei tempi supplementari contano?", a: "Di solito no: questi mercati si riferiscono ai tempi regolamentari, recupero compreso." },
      { q: "Un rosso diretto quanti cartellini vale?", a: "In molti regolamenti 2, in altri 1. Nel punteggio cartellini ha un valore più alto del giallo. Dipende dall'operatore." },
    ],
    related: ["mercati-del-calcio", "under-over-2-5", "scommesse-marcatori", "analizzare-una-partita-di-calcio"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "scommesse-marcatori",
    title: "Marcatori: primo, ultimo e in qualsiasi momento",
    description:
      "Come funzionano i mercati sui marcatori, cosa succede con autogol, sostituzioni e giocatori che non entrano, e perché le quote sono così alte.",
    category: "sport",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgMarcatori,
    sections: [
      {
        id: "mercati",
        title: "I mercati principali",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Marcatore in qualsiasi momento", text: "Il giocatore segna almeno un gol durante la partita. È il mercato più semplice." },
              { title: "Primo marcatore", text: "Il giocatore segna il primo gol della partita. Se la partita finisce 0-0 la giocata è perdente (salvo un'apposita opzione \"nessun marcatore\")." },
              { title: "Ultimo marcatore", text: "Il giocatore segna l'ultimo gol della partita." },
              { title: "Doppietta o tripletta", text: "Il giocatore segna almeno 2 o 3 gol." },
            ],
          },
        ],
      },
      {
        id: "regole",
        title: "Le regole che contano",
        blocks: [
          {
            type: "list",
            items: [
              "Gli autogol non valgono per nessun marcatore. Per il primo marcatore, se il primo gol è un autogol di solito si considera il gol successivo; le regole esatte sono nel regolamento.",
              "Un giocatore che non scende in campo: le giocate su di lui vengono di norma rimborsate.",
              "Un giocatore che entra dopo il primo gol: per il mercato \"primo marcatore\" la giocata è di solito perdente, anche se non era in campo quando è stato segnato il primo gol. Alcuni operatori la rimborsano.",
              "Contano solo i tempi regolamentari: i gol dei supplementari e i rigori della lotteria finale restano fuori.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Formazioni ufficiali",
            text: "Le formazioni ufficiali escono circa un'ora prima della partita: sulle pagine delle partite di QuotaGuru compaiono appena disponibili.",
          },
        ],
      },
      {
        id: "quote",
        title: "Perché le quote sono alte",
        blocks: [
          {
            type: "p",
            text: "Anche il miglior attaccante di un campionato segna in una minoranza delle partite che gioca. Il mercato \"primo marcatore\" è ancora più difficile, perché richiede che segni lui e che nessun altro segni prima: le probabilità sono basse e il margine dell'operatore, distribuito su decine di giocatori, pesa di più che su un 1X2.",
          },
          {
            type: "example",
            title: "Un ordine di grandezza",
            text: "Un attaccante che segna in media un gol ogni tre partite ha, a grandi linee, una probabilità intorno al 30% di segnare in una partita qualsiasi. Come primo marcatore la probabilità scende molto, perché deve anticipare tutti gli altri 21 giocatori in campo.",
          },
          {
            type: "p",
            text: "Per avere un'idea dei rendimenti, le pagine [marcatori della Serie A](/calcio/serie-a/marcatori) e degli altri campionati mostrano gol, assist e minuti giocati, e ogni giocatore ha la sua scheda con le statistiche stagionali.",
          },
        ],
      },
    ],
    faq: [
      { q: "Il rigore conta come gol del marcatore?", a: "Sì, il rigore segnato durante la partita vale come un normale gol. Non contano i rigori della lotteria finale." },
      { q: "Se il mio giocatore viene sostituito dopo aver segnato?", a: "Per il marcatore in qualsiasi momento la giocata resta vincente: conta solo che abbia segnato." },
    ],
    related: ["mercati-del-calcio", "calci-d-angolo-e-cartellini", "risultato-esatto-parziale-finale", "come-leggere-le-quote"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "risultato-esatto-parziale-finale",
    title: "Risultato esatto e parziale/finale spiegati",
    description:
      "Come funzionano il risultato esatto e il parziale/finale, quante combinazioni ci sono, come si stimano le probabilità e perché quote alte non significano occasioni.",
    category: "sport",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgEsatto,
    sections: [
      {
        id: "esatto",
        title: "Il risultato esatto",
        blocks: [
          {
            type: "p",
            text: "Si indica il punteggio finale preciso dei tempi regolamentari, per esempio 2-1. Basta un gol in più o in meno per perdere. Gli operatori elencano i risultati più comuni e raggruppano gli altri in una voce come \"altro risultato\".",
          },
          {
            type: "example",
            title: "Probabilità con il modello di Poisson",
            text: "Con 1,5 gol attesi per la squadra di casa e 1,1 per l'ospite, l'1-1 è il risultato più probabile con circa il 12,3%, seguito da 1-0 (11,1%) e 2-1 (9,2%); lo 0-0 vale circa il 7,4%. Anche il risultato più probabile, quindi, non si verifica quasi nove volte su dieci.",
          },
          {
            type: "p",
            text: "Il modello semplice tende a sottostimare i pareggi con pochi gol: per questo QuotaGuru usa la correzione di Dixon e Coles, descritta in [come funzionano le probabilità di QuotaGuru](/guide/come-funzionano-le-probabilita-di-quotaguru). I risultati esatti più probabili di ogni partita sono nelle pagine dei [pronostici](/pronostici).",
          },
        ],
      },
      {
        id: "parziale-finale",
        title: "Il parziale/finale",
        blocks: [
          {
            type: "p",
            text: "Si indovina l'esito del primo tempo e quello della partita insieme. Le combinazioni sono nove: 1/1, 1/X, 1/2, X/1, X/X, X/2, 2/1, 2/X, 2/2. La prima indicazione è il risultato all'intervallo, la seconda quello finale.",
          },
          {
            type: "table",
            head: ["Parziale", "Finale", "Esito"],
            rows: [
              ["1-0", "2-0", "1/1"],
              ["0-0", "1-0", "X/1"],
              ["0-0", "1-1", "X/X"],
              ["1-0", "1-2", "1/2 (ribaltone)"],
            ],
          },
          {
            type: "p",
            text: "X/1 e X/2 sono più frequenti di quanto si pensi, perché molti primi tempi finiscono in parità. I ribaltoni (1/2 e 2/1) sono rari e per questo hanno quote molto alte.",
          },
        ],
      },
      {
        id: "quote-alte",
        title: "Quote alte, margine alto",
        blocks: [
          {
            type: "p",
            text: "Su questi mercati gli esiti possibili sono molti e il margine dell'operatore viene distribuito su ognuno: sommando le probabilità implicite delle quote si supera il 100% molto più che su un 1X2. Una quota alta riflette una probabilità bassa, non un'occasione. Come calcolare il margine è spiegato in [come leggere le quote](/guide/come-leggere-le-quote).",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Attenzione alle serie",
            text: "Avere indovinato un risultato esatto non dice nulla sulla capacità di indovinare il prossimo. Vedi [caso e probabilità](/guide/caso-e-probabilita).",
          },
        ],
      },
    ],
    faq: [
      { q: "Il risultato esatto considera i supplementari?", a: "No, solo i tempi regolamentari, recupero compreso." },
      { q: "Cosa vuol dire \"altro risultato\"?", a: "Raggruppa tutti i punteggi non elencati singolarmente (di solito quelli con molti gol). È vincente se il risultato finale non è fra quelli in lista." },
    ],
    related: ["under-over-2-5", "goal-no-goal", "come-funzionano-le-probabilita-di-quotaguru", "mercati-del-calcio"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "tennis-ritiri-e-walkover",
    title: "Tennis: ritiri, walkover e come vengono pagate le scommesse",
    description:
      "Cosa succede alle scommesse sul tennis se un giocatore si ritira durante la partita, se non scende in campo, se la partita viene rinviata o cambia campo.",
    category: "sport",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgTennis,
    sections: [
      {
        id: "perche",
        title: "Perché è un caso frequente",
        blocks: [
          {
            type: "p",
            text: "Nel tennis i ritiri sono più comuni che in altri sport: infortuni, problemi fisici, calendari fitti fra un torneo e l'altro. Per questo ogni operatore dedica al tennis una parte del regolamento, e le soluzioni non sono tutte uguali.",
          },
        ],
      },
      {
        id: "casi",
        title: "I casi principali",
        blocks: [
          {
            type: "table",
            head: ["Situazione", "Regola più diffusa"],
            rows: [
              ["Walkover: un giocatore non scende in campo", "Scommesse rimborsate"],
              ["Ritiro durante la partita, testa a testa", "Varia: in alcuni regolamenti la scommessa è persa per chi ha puntato sul giocatore ritirato (vince chi passa il turno), in altri è rimborsata, in altri ancora conta solo se è stato completato almeno un set"],
              ["Ritiro, mercati già decisi", "Di solito pagati: per esempio il vincitore del primo set, se il set era già finito"],
              ["Ritiro, mercati non decisi", "Di solito rimborsati: totale game, handicap game, risultato esatto in set"],
              ["Partita rinviata o interrotta", "Valida se si conclude entro il termine fissato dal regolamento, altrimenti rimborsata"],
            ],
            caption: "Le regole precise sono quelle del regolamento dell'operatore al momento della giocata.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Il mercato \"escluso ritiro\"",
            text: "Alcuni operatori offrono il testa a testa in due versioni: una standard e una \"escluso ritiro\", che in caso di ritiro viene rimborsata. La quota può essere leggermente diversa.",
          },
        ],
      },
      {
        id: "altri",
        title: "Altri cambiamenti",
        blocks: [
          {
            type: "list",
            items: [
              "Cambio di campo o di superficie (per esempio da campo all'aperto a coperto): le scommesse di solito restano valide.",
              "Cambio di formato deciso dall'organizzazione (numero di set, regole del tie-break): di solito valgono le regole ufficiali del torneo, senza rimborsi.",
              "Partite sospese per pioggia e riprese il giorno dopo: restano valide se concluse entro il termine del regolamento.",
            ],
          },
          {
            type: "p",
            text: "Per capire in che contesto si gioca una partita (superficie, categoria del torneo, partite nei giorni precedenti) leggi [tennis: mercati e fattori da considerare](/guide/scommesse-sul-tennis) e [i tornei di tennis](/guide/tornei-di-tennis).",
          },
        ],
      },
    ],
    faq: [
      { q: "Il giocatore si ritira al terzo set e io avevo puntato sull'altro: vinco?", a: "Con la regola \"passa il turno\" sì; con le regole che rimborsano in caso di ritiro, ricevi indietro la puntata. Dipende dall'operatore." },
      { q: "Nelle multiple cosa succede?", a: "Una selezione rimborsata viene di solito considerata a quota 1,00 e la multipla resta valida sugli altri eventi." },
    ],
    related: ["scommesse-sul-tennis", "tornei-di-tennis", "controllare-una-bolletta", "scommesse-in-diretta"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "nba-player-props",
    title: "NBA: le scommesse sui giocatori (punti, rimbalzi, assist)",
    description:
      "Cosa sono le player props dell'NBA, come vengono pagate con supplementari e assenze, quali fattori spostano le statistiche di un giocatore e perché la varianza è alta.",
    category: "sport",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgProps,
    sections: [
      {
        id: "cosa",
        title: "Cosa sono",
        blocks: [
          {
            type: "p",
            text: "Le scommesse sui giocatori (in inglese player props) riguardano le statistiche individuali di una partita, non il risultato. La forma più comune è un Under/Over su una soglia: per esempio Over 24,5 punti di un giocatore.",
          },
          {
            type: "cards",
            items: [
              { title: "Punti, rimbalzi, assist", text: "Under/Over sulla singola statistica." },
              { title: "Combinate", text: "Somma di più statistiche: punti + rimbalzi + assist, punti + rimbalzi e così via." },
              { title: "Triple", text: "Numero di tiri da tre segnati." },
              { title: "Doppia doppia", text: "Almeno 10 in due categorie statistiche (per esempio punti e rimbalzi)." },
            ],
          },
        ],
      },
      {
        id: "regole",
        title: "Le regole di pagamento",
        blocks: [
          {
            type: "list",
            items: [
              "Nel basket i tempi supplementari di solito contano: le statistiche segnate all'overtime fanno parte del totale. Verifica nella descrizione del mercato.",
              "Se il giocatore non scende in campo, le giocate su di lui vengono di norma rimborsate. Se gioca anche un solo minuto, la scommessa è valida.",
              "Fanno fede le statistiche ufficiali della lega, che a volte vengono corrette nelle ore successive: ogni regolamento dice se si considerano le correzioni.",
            ],
          },
        ],
      },
      {
        id: "fattori",
        title: "Cosa sposta le statistiche",
        blocks: [
          {
            type: "list",
            items: [
              "Minuti: la variabile più importante. Una partita chiusa in anticipo (blowout) toglie minuti ai titolari nell'ultimo quarto.",
              "Assenze dei compagni: quando manca un titolare, gli altri hanno più tiri e più palloni.",
              "Ritmo (pace): squadre che giocano più possessi producono più punti per tutti.",
              "Back-to-back: la seconda partita in due giorni porta spesso a minuti ridotti o turni di riposo programmati.",
              "Avversario: alcune difese concedono più punti agli esterni, altre ai lunghi.",
            ],
          },
          {
            type: "p",
            text: "Le medie stagionali di ogni giocatore sono nelle schede dei giocatori delle pagine [NBA](/basket/nba). Come funzionano stagione regolare, play-in e playoff è spiegato in [NBA: regular season, play-in e playoff](/guide/nba-stagione-play-in-playoff).",
          },
        ],
      },
      {
        id: "varianza",
        title: "Una media non è una previsione",
        blocks: [
          {
            type: "example",
            title: "Esempio",
            text: "Un giocatore con una media di 25 punti può segnarne 15 una sera e 35 quella dopo. Una soglia a 24,5 vicina alla sua media è, per costruzione, vicina a un testa o croce: la quota tiene conto di questo e del margine.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Le giocate combinate sullo stesso giocatore",
            text: "Molte multiple con più statistiche dello stesso giocatore o della stessa partita sono legate fra loro: se il giocatore gioca pochi minuti, falliscono tutte insieme. Il rischio è più alto di quanto suggerisca la quota totale.",
          },
        ],
      },
    ],
    faq: [
      { q: "Le statistiche dei supplementari contano?", a: "Nella maggior parte dei regolamenti sì. Alcuni mercati specificano \"tempi regolamentari\": in quel caso no." },
      { q: "Il giocatore esce per infortunio dopo 5 minuti: rimborso?", a: "Di norma no: se è sceso in campo, la scommessa è valida con le statistiche fatte fino a quel momento." },
    ],
    related: ["nba-stagione-play-in-playoff", "basket-over-under-handicap", "varianza-e-serie-negative", "caso-e-probabilita"],
  },
];
