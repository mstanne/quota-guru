// Guides – rules of play and player protection: systems, odds boosts, stake and payout limits, Decreto Dignità,
// taxes on winnings, account verification. Inline links: [testo](/percorso).
// Informative only, not legal or tax advice; no operator links or calls to play (Decreto Dignità).
import type { Guide } from "../guides";
import imgSistemi from "../../assets/guides/sistemi-integrali-e-ridotti.svg";
import imgBoost from "../../assets/guides/quote-maggiorate.svg";
import imgLimiti from "../../assets/guides/vincita-massima-e-importo-minimo.svg";
import imgDignita from "../../assets/guides/decreto-dignita-scommesse.svg";
import imgTasse from "../../assets/guides/tasse-sulle-vincite.svg";
import imgVerifica from "../../assets/guides/verifica-del-conto-di-gioco.svg";

const UPDATED = "8 novembre 2026";

export const regoleGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "sistemi-integrali-e-ridotti",
    title: "Sistemi integrali e ridotti: come si leggono e quanto costano",
    description:
      "Cos'è un sistema, la differenza fra integrale e ridotto, come si contano le combinazioni, quanto costa e quanto restituisce se sbagli uno o più esiti.",
    category: "quote-e-probabilita",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgSistemi,
    sections: [
      {
        id: "idea",
        title: "L'idea del sistema",
        blocks: [
          {
            type: "p",
            text: "Un sistema è un insieme di multiple giocate insieme, costruite combinando gli stessi esiti. Invece di puntare tutto su una sola multipla, dove basta un errore per perdere, si giocano tutte le combinazioni di una certa dimensione: se uno o più esiti vanno male, le combinazioni che non li contengono possono comunque vincere.",
          },
          {
            type: "p",
            text: "Le basi (singola, multipla, sistema) sono in [singola, multipla e sistema](/guide/singola-multipla-sistema); qui si entra nel dettaglio dei sistemi più grandi.",
          },
        ],
      },
      {
        id: "combinazioni",
        title: "Come si contano le combinazioni",
        blocks: [
          {
            type: "p",
            text: "Un sistema si indica con la dimensione delle combinazioni e il numero di esiti: \"2 su 4\" sono tutte le doppie che si possono formare con 4 esiti. Il numero cresce in fretta con gli esiti scelti.",
          },
          {
            type: "table",
            head: ["Esiti", "Doppie", "Triple", "Quadruple", "Integrale completo"],
            rows: [
              ["3", "3", "1", "–", "4 combinazioni"],
              ["4", "6", "4", "1", "11 combinazioni"],
              ["5", "10", "10", "5 (+1 quintupla)", "26 combinazioni"],
              ["6", "15", "20", "15 (+6 quintuple, 1 sestupla)", "57 combinazioni"],
            ],
            caption: "L'integrale completo comprende tutte le combinazioni dalla doppia in su.",
          },
          {
            type: "p",
            text: "Il costo del sistema è il numero di combinazioni giocate per l'importo di ciascuna: un sistema di 6 doppie da 1 € costa 6 €.",
          },
        ],
      },
      {
        id: "integrale-ridotto",
        title: "Integrale e ridotto",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Integrale", text: "Si giocano tutte le combinazioni di una o più dimensioni (per esempio tutte le doppie e tutte le triple). Copre ogni caso, ma il numero di combinazioni, e quindi il costo, cresce rapidamente." },
              { title: "Ridotto", text: "Si gioca solo una parte delle combinazioni, scelte secondo uno schema. Costa meno, ma garantisce una vincita solo in alcuni casi (per esempio se si indovinano almeno 4 esiti su 6)." },
              { title: "Con base fissa", text: "Uno o più esiti, detti fissi o basi, compaiono in tutte le combinazioni. Se una base sbaglia, perdono tutte." },
            ],
          },
        ],
      },
      {
        id: "esempio",
        title: "Un esempio completo",
        blocks: [
          {
            type: "example",
            title: "Sistema 2 su 4, 1 € per doppia (costo 6 €)",
            text: "Quote: A 1,80, B 2,10, C 1,60, D 2,00. Se si indovinano A, B e C vincono 3 doppie: 3,78 + 2,88 + 3,36 = 10,02 €. Se si indovinano tutti e quattro gli esiti vincono tutte le 6 doppie, per 21,02 €. Se si indovinano solo A e B vince una sola doppia, 3,78 €: meno dei 6 € spesi.",
          },
          {
            type: "p",
            text: "Il sistema riduce l'effetto di un singolo errore, ma non annulla il margine dell'operatore: ogni combinazione lo contiene, e giocarne tante significa pagarlo su ognuna. Le formule per calcolare le vincite sono in [calcolare la vincita di una multipla e di un sistema](/guide/calcolare-vincita-multipla-sistema).",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Il costo sale in fretta",
            text: "Un integrale completo su 6 esiti sono 57 combinazioni: anche a pochi euro l'una, l'importo totale può superare di molto quello che si pensava di spendere. Controlla sempre il costo totale prima di confermare.",
          },
        ],
      },
    ],
    faq: [
      { q: "Che differenza c'è fra sistema e multiple separate?", a: "Nessuna nel risultato: un sistema 2 su 4 equivale a giocare 6 doppie una per una. Il sistema le raccoglie in un'unica giocata." },
      { q: "Si può avere un importo diverso per ogni combinazione?", a: "Di solito no: l'importo è lo stesso per tutte le combinazioni della stessa dimensione." },
    ],
    related: ["calcolare-vincita-multipla-sistema", "singola-multipla-sistema", "bolletta-scommesse", "vincita-massima-e-importo-minimo"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "quote-maggiorate",
    title: "Quote maggiorate: cosa sono davvero",
    description:
      "Come funzionano le quote maggiorate (boost), come calcolare quanto cambiano il margine dell'operatore e quali condizioni le accompagnano di solito.",
    category: "quote-e-probabilita",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgBoost,
    sections: [
      {
        id: "cosa",
        title: "Cosa sono",
        blocks: [
          {
            type: "p",
            text: "Una quota maggiorata (in inglese boost) è una quota che l'operatore alza rispetto a quella normale su un singolo esito o su una combinazione prestabilita, per un periodo limitato. Compaiono di solito su partite molto seguite.",
          },
          {
            type: "p",
            text: "Per capire quanto vale una maggiorazione bisogna confrontarla non con la quota di prima, ma con la probabilità reale dell'esito: solo così si vede se la quota maggiorata è più vicina alla [quota equa](/guide/quota-equa-e-valore-atteso) o se resta comunque sotto.",
          },
        ],
      },
      {
        id: "calcolo",
        title: "Il calcolo del margine",
        blocks: [
          {
            type: "example",
            title: "Esempio su un 1X2",
            text: "Quote normali: 1,80 / 3,60 / 4,50. Sommando le probabilità implicite (1/1,80 + 1/3,60 + 1/4,50) si ottiene circa 105,6%: il margine dell'operatore è intorno al 5,6%. Se la quota della squadra di casa viene maggiorata a 2,00, la somma diventa esattamente 100%: su quell'esito il margine è stato di fatto azzerato.",
          },
          {
            type: "p",
            text: "Nella maggior parte dei casi la maggiorazione riduce il margine senza ribaltarlo: la quota resta sotto quella equa e, nel lungo periodo, la giocata continua a costare in media. Come si legge il margine è spiegato in [come leggere le quote](/guide/come-leggere-le-quote).",
          },
        ],
      },
      {
        id: "condizioni",
        title: "Le condizioni da leggere",
        blocks: [
          {
            type: "list",
            items: [
              "Importo massimo: la quota maggiorata vale spesso solo fino a una puntata bassa; oltre, si applica la quota normale.",
              "Pagamento della differenza: a volte la parte di vincita dovuta alla maggiorazione viene accreditata come bonus, con [requisiti di giocata](/guide/bonus-requisiti-di-giocata), e non come saldo prelevabile.",
              "Mercati combinati: molte maggiorazioni riguardano combinazioni di più esiti nella stessa partita, la cui probabilità è più bassa di quanto sembri.",
              "Un utilizzo per cliente e scadenza all'inizio dell'evento.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Perché esistono",
            text: "Per l'operatore sono uno strumento per attirare giocate su un evento. Non sono un regalo: nel complesso dell'offerta il margine resta.",
          },
        ],
      },
    ],
    faq: [
      { q: "Una quota maggiorata è sempre conveniente?", a: "No: è più alta di quella normale dello stesso operatore, ma può restare sotto la quota equa e persino sotto le quote normali di altri operatori." },
      { q: "Vale anche nelle multiple?", a: "Dipende dalle condizioni: alcune maggiorazioni sono valide solo come singola." },
    ],
    related: ["come-leggere-le-quote", "quota-equa-e-valore-atteso", "quanto-costa-un-bonus", "bonus-requisiti-di-giocata"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "vincita-massima-e-importo-minimo",
    title: "Vincita massima e importo minimo: i limiti di una giocata",
    description:
      "Quanto si può puntare al minimo, quanto si può vincere al massimo con una scommessa, chi fissa questi limiti e perché un operatore può accettare solo una parte della puntata.",
    category: "principianti",
    readTime: "4 min",
    updatedAt: UPDATED,
    image: imgLimiti,
    sections: [
      {
        id: "legge",
        title: "I limiti fissati dalla legge",
        blocks: [
          {
            type: "p",
            text: "Le regole generali delle scommesse a quota fissa sono stabilite da un decreto del Ministero dell'Economia (n. 145 del 2022, in vigore dal 28 ottobre 2022). Fra le altre cose fissa l'importo minimo di una giocata, l'unità minima con cui si può puntare e la vincita massima per scommessa, che con quel decreto è stata portata a 50.000 €.",
          },
          {
            type: "table",
            head: ["Limite", "Valore generale"],
            rows: [
              ["Importo minimo per giocata", "1 €"],
              ["Unità minima di puntata", "5 centesimi (per esempio nelle combinazioni di un sistema)"],
              ["Vincita massima per scommessa", "50.000 €"],
            ],
            caption: "Valori generali previsti dal decreto; ogni operatore può applicare limiti più stretti, indicati nel suo regolamento.",
          },
        ],
      },
      {
        id: "operatore",
        title: "I limiti dell'operatore",
        blocks: [
          {
            type: "list",
            items: [
              "Puntata massima per evento o per mercato: spesso più bassa su campionati minori e mercati secondari, dove l'operatore ha meno informazioni.",
              "Vincita massima per giocata o per giornata, più bassa di quella di legge.",
              "Accettazione parziale: se una giocata supera il limite, l'operatore può proporre di accettarne solo una parte. Online compare un messaggio da confermare.",
              "Numero massimo di eventi in una multipla.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Dove trovarli",
            text: "Tutti questi valori sono nel regolamento delle scommesse dell'operatore, di solito in una sezione dedicata ai limiti. In agenzia il terminale avvisa prima della stampa della [bolletta](/guide/bolletta-scommesse).",
          },
        ],
      },
      {
        id: "multiple",
        title: "Nelle multiple e nei sistemi",
        blocks: [
          {
            type: "p",
            text: "In una multipla con molte selezioni la possibile vincita cresce in fretta e può superare la vincita massima: in quel caso viene pagato solo il tetto, anche se il calcolo dà una cifra più alta. Prima di confermare conviene controllare che la possibile vincita mostrata non sia già stata ridotta al massimo consentito.",
          },
          {
            type: "p",
            text: "Per calcolare le vincite di multiple e sistemi vedi [calcolare la vincita di una multipla](/guide/calcolare-vincita-multipla-sistema) e [sistemi integrali e ridotti](/guide/sistemi-integrali-e-ridotti).",
          },
        ],
      },
    ],
    faq: [
      { q: "Il limite di vincita vale anche online?", a: "Sì, i limiti generali valgono sia per il gioco in agenzia sia per quello a distanza; ogni operatore può fissarne di più bassi." },
      { q: "Un operatore può limitare il mio conto?", a: "Può fissare limiti alle puntate accettate secondo il proprio regolamento. Diversi sono i limiti di deposito, che decidi tu: vedi [autoesclusione e limiti di gioco](/guide/autoesclusione-e-limiti-di-gioco)." },
    ],
    related: ["bolletta-scommesse", "sistemi-integrali-e-ridotti", "calcolare-vincita-multipla-sistema", "siti-scommesse-legali"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "decreto-dignita-scommesse",
    title: "Decreto Dignità: cosa cambia per chi gioca",
    description:
      "Il divieto di pubblicità del gioco con vincite in denaro introdotto nel 2018: cosa vieta, cosa resta permesso, le questioni aperte e perché QuotaGuru non ha inviti a giocare.",
    category: "principianti",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgDignita,
    sections: [
      {
        id: "cosa",
        title: "Cos'è",
        blocks: [
          {
            type: "p",
            text: "Il Decreto Dignità (decreto-legge 87 del 2018, convertito dalla legge 96 dello stesso anno) contiene, all'articolo 9, un divieto ampio di pubblicità dei giochi e delle scommesse con vincite in denaro. È stato introdotto come misura di contrasto al disturbo da gioco d'azzardo.",
          },
          {
            type: "list",
            items: [
              "Vieta qualsiasi forma di pubblicità, anche indiretta, su qualunque mezzo: televisione, radio, stampa, cartelloni, internet e social.",
              "Vieta le sponsorizzazioni di eventi, squadre e attività da parte degli operatori di gioco.",
              "Restano escluse le lotterie nazionali a estrazione differita, come la Lotteria Italia.",
              "La vigilanza spetta all'Autorità per le garanzie nelle comunicazioni (AGCOM); la sanzione minima per ogni violazione è di 50.000 €.",
            ],
          },
        ],
      },
      {
        id: "permesso",
        title: "Cosa resta permesso",
        blocks: [
          {
            type: "p",
            text: "Le linee guida dell'AGCOM distinguono la pubblicità, vietata, dalle informazioni che servono al giocatore. Rientrano fra queste, entro certi limiti:",
          },
          {
            type: "cards",
            items: [
              { title: "Informazioni sull'offerta", text: "Sul proprio sito un operatore può descrivere giochi, quote e condizioni a chi lo visita." },
              { title: "Segni distintivi", text: "Il marchio può comparire dove serve a identificare l'operatore, per esempio sull'insegna del punto vendita." },
              { title: "Gioco responsabile", text: "Le comunicazioni su rischi, limiti e servizi di aiuto sono sempre consentite e anzi richieste." },
              { title: "Informazione giornalistica", text: "Cronaca, analisi e approfondimenti sul settore, senza finalità promozionali." },
            ],
          },
        ],
      },
      {
        id: "giocatore",
        title: "Cosa cambia per chi gioca",
        blocks: [
          {
            type: "list",
            items: [
              "Le condizioni delle offerte di benvenuto vanno cercate sul sito dell'operatore: non vengono pubblicizzate in televisione o sui social.",
              "Un contenuto che spinge a giocare, promettendo vincite facili o \"schedine sicure\", è un segnale d'allarme: oltre a violare il divieto, spesso proviene da siti senza concessione.",
              "Restano obbligatori i messaggi sul gioco responsabile, il divieto di gioco ai minori e il numero del Telefono Verde, presenti anche su questo sito.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Perché QuotaGuru è fatto così",
            text: "Le guide non contengono inviti a giocare né collegamenti agli operatori, e le pagine sulle offerte di benvenuto le descrivono con le loro condizioni e il loro costo, senza classifiche. Il criterio è spiegato nella pagina [Metodologia](/metodologia).",
          },
        ],
      },
      {
        id: "aperte",
        title: "Le questioni aperte",
        blocks: [
          {
            type: "p",
            text: "Dal 2018 il divieto è stato discusso più volte. Nel 2025 il TAR del Lazio ha chiesto alla Corte costituzionale di valutare la sanzione minima fissa di 50.000 €, e davanti alla Corte di giustizia dell'Unione europea sono aperte cause sul rapporto fra la norma italiana e le regole europee. Fino alle decisioni il divieto resta in vigore.",
          },
          {
            type: "p",
            text: "Questa guida descrive il quadro generale e non è una consulenza legale.",
          },
        ],
      },
    ],
    faq: [
      { q: "Il divieto vale anche per gli influencer?", a: "Sì, riguarda qualsiasi forma di comunicazione promozionale, comprese quelle sui social e quelle non dichiarate." },
      { q: "Il Decreto Dignità limita quanto posso giocare?", a: "No: riguarda la pubblicità. I limiti alla spesa sono quelli che imposti sul conto di gioco: vedi [autoesclusione e limiti di gioco](/guide/autoesclusione-e-limiti-di-gioco)." },
    ],
    related: ["siti-scommesse-legali", "bonus-requisiti-di-giocata", "gioco-problematico-dove-chiedere-aiuto", "tasse-sulle-vincite"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "tasse-sulle-vincite",
    title: "Tasse sulle vincite delle scommesse: come funziona",
    description:
      "Chi paga le imposte sulle scommesse con i concessionari ADM, se le vincite vanno dichiarate, cosa cambia con i giochi numerici e perché i siti senza concessione sono un problema anche fiscale.",
    category: "gestione-del-budget",
    readTime: "4 min",
    updatedAt: UPDATED,
    image: imgTasse,
    sections: [
      {
        id: "adm",
        title: "Con un concessionario ADM",
        blocks: [
          {
            type: "p",
            text: "Sulle scommesse sportive con operatori autorizzati dall'ADM le imposte sono a carico del concessionario, che versa allo Stato un'imposta calcolata sulla differenza fra le somme giocate e le vincite pagate. Per il giocatore la vincita è già netta: l'importo indicato sulla bolletta o accreditato sul conto è quello che si incassa, senza ritenute.",
          },
          {
            type: "p",
            text: "Per lo stesso motivo queste vincite non vanno indicate nella dichiarazione dei redditi.",
          },
        ],
      },
      {
        id: "altri-giochi",
        title: "Altri giochi, altre regole",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Giochi numerici e lotterie", text: "Per alcuni giochi, come Lotto e SuperEnalotto, sulle vincite più alte viene trattenuta una percentuale direttamente al momento del pagamento. Anche in questo caso non c'è altro da dichiarare." },
              { title: "Betting exchange", text: "Il giocatore paga una commissione sulle vincite; le imposte sono assolte dall'operatore." },
              { title: "Siti senza concessione", text: "Oltre a non offrire tutele, i siti non autorizzati non assolvono le imposte italiane: le eventuali vincite sono redditi da dichiarare, e giocarci può avere conseguenze anche per il giocatore." },
            ],
          },
          {
            type: "p",
            text: "Come riconoscere un operatore autorizzato è spiegato in [come riconoscere un sito di scommesse legale](/guide/siti-scommesse-legali).",
          },
        ],
      },
      {
        id: "perdite",
        title: "E le perdite?",
        blocks: [
          {
            type: "p",
            text: "Le somme perse al gioco non sono deducibili. Il saldo che conta, per chi gioca, è quello fra depositi e prelievi nel tempo: lo storico del conto di gioco lo mostra. Tenerlo sotto controllo è la base di una corretta [gestione del budget](/guide/gestione-del-budget).",
          },
          {
            type: "callout",
            tone: "info",
            title: "Non è una consulenza fiscale",
            text: "Questa guida descrive le regole generali. Per casi particolari (redditi da gioco elevati, attività all'estero) conviene rivolgersi a un commercialista.",
          },
        ],
      },
    ],
    faq: [
      { q: "Devo dichiarare una vincita da 10.000 € fatta in agenzia?", a: "No, se il concessionario è autorizzato ADM: le imposte sono già assolte dall'operatore." },
      { q: "Prelevare una vincita sul conto corrente può creare problemi?", a: "Il movimento proviene da un operatore autorizzato ed è tracciato. La banca può chiederne l'origine: lo storico del conto di gioco la documenta." },
    ],
    related: ["depositi-e-prelievi", "siti-scommesse-legali", "gestione-del-budget", "verifica-del-conto-di-gioco"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "verifica-del-conto-di-gioco",
    title: "Verifica del conto di gioco: documenti, tempi e regole sui pagamenti",
    description:
      "Perché l'operatore chiede documento e codice fiscale, cosa succede se la verifica non è completata, le regole sui metodi di pagamento intestati e sulle ricariche in contanti.",
    category: "principianti",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgVerifica,
    sections: [
      {
        id: "perche",
        title: "Perché serve",
        blocks: [
          {
            type: "p",
            text: "In Italia un conto di gioco è sempre intestato a una persona identificata. La verifica serve a escludere i minori, a impedire che una persona giochi con l'identità di un'altra, a far funzionare l'autoesclusione e a rispettare le norme antiriciclaggio. Non è una scelta dell'operatore: è un obbligo della concessione.",
          },
        ],
      },
      {
        id: "documenti",
        title: "Cosa viene chiesto",
        blocks: [
          {
            type: "list",
            items: [
              "Dati anagrafici e codice fiscale, controllati con l'Anagrafe tributaria.",
              "Copia di un documento d'identità valido (carta d'identità, passaporto o patente).",
              "In alcuni casi, documenti aggiuntivi: prova di residenza, intestazione della carta o del conto bancario, origine dei fondi per importi elevati.",
            ],
          },
          {
            type: "p",
            text: "I passaggi dell'apertura sono in [aprire un conto di gioco](/guide/aprire-un-conto-di-gioco). Finché l'identità non è verificata, l'operatore limita l'uso del conto: in particolare non sono possibili i prelievi, e se i documenti non arrivano entro il termine indicato il conto viene sospeso.",
          },
        ],
      },
      {
        id: "pagamenti",
        title: "Le regole sui pagamenti",
        blocks: [
          {
            type: "table",
            head: ["Regola", "Cosa significa"],
            rows: [
              ["Prelievi verso strumenti intestati", "Le vincite si prelevano solo su un conto o una carta intestati al titolare del conto di gioco. Se l'intestatario è diverso, il pagamento non viene eseguito."],
              ["Niente prelievi al banco", "Il saldo del conto online non si ritira in contanti nei punti vendita, nemmeno in quelli dello stesso concessionario."],
              ["Ricariche in contanti limitate", "Le ricariche in contanti o con strumenti non tracciabili hanno un tetto di 100 € a settimana."],
              ["Ricariche tracciabili", "Bonifico, carte di pagamento e prepagate di istituti che identificano chi paga. Le carte ricaricabili con codice o voucher richiedono che l'acquirente sia il titolare del conto."],
            ],
            caption: "Regole del riordino del gioco a distanza (d.lgs. 41/2024) e delle determinazioni ADM sui pagamenti, aggiornate a ottobre 2026.",
          },
          {
            type: "p",
            text: "Tempi e metodi di deposito e prelievo sono confrontati in [depositi e prelievi](/guide/depositi-e-prelievi).",
          },
        ],
      },
      {
        id: "attenzione",
        title: "Attenzione a",
        blocks: [
          {
            type: "list",
            items: [
              "Richieste di documenti via messaggio o email non provenienti dai canali ufficiali dell'operatore: carica i documenti solo dall'area riservata del sito o dell'app.",
              "Conti intestati a parenti o amici: sono vietati e, oltre al blocco del conto, rendono inutili limiti e autoesclusione.",
              "Siti che non chiedono alcuna verifica: un operatore autorizzato la chiede sempre.",
            ],
          },
        ],
      },
    ],
    faq: [
      { q: "Quanto tempo richiede la verifica?", a: "Il controllo del codice fiscale è immediato; quello del documento richiede di solito da pochi minuti a qualche giorno, a seconda dell'operatore." },
      { q: "Perché mi chiedono di nuovo i documenti dopo mesi?", a: "Il documento può essere scaduto, oppure l'operatore deve fare controlli antiriciclaggio su movimenti più consistenti. È una procedura normale." },
    ],
    related: ["aprire-un-conto-di-gioco", "depositi-e-prelievi", "siti-scommesse-legali", "autoesclusione-e-limiti-di-gioco"],
  },
];
