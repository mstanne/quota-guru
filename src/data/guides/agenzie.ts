// Guides – "Per principianti": agenzie fisiche, prenotatore e bolletta. Inline links: [testo](/percorso).
// Editorial line: informative only, no operator links or calls to play in the text (Decreto Dignità).
import type { Guide } from "../guides";
import imgAgenzie from "../../assets/guides/agenzie-scommesse-fisiche-o-online.svg";
import imgPrenotatore from "../../assets/guides/prenotatore-scommesse.svg";
import imgBolletta from "../../assets/guides/bolletta-scommesse.svg";
import imgControllo from "../../assets/guides/controllare-una-bolletta.svg";

const UPDATED = "8 novembre 2026";

export const agenzieGuides: Guide[] = [
  // ------------------------------------------------------------------------------------------------
  {
    slug: "agenzie-scommesse-fisiche-o-online",
    title: "Agenzia scommesse fisica o sito online: cosa cambia",
    description:
      "Palinsesto, pagamenti, controllo della spesa, assistenza e legalità: le differenze concrete tra giocare al banco di un'agenzia e su un conto di gioco online.",
    category: "principianti",
    readTime: "7 min",
    updatedAt: UPDATED,
    image: imgAgenzie,
    sections: [
      {
        id: "due-canali",
        title: "Due canali, le stesse regole di fondo",
        blocks: [
          {
            type: "p",
            text: "In Italia si può scommettere in due modi: in un punto vendita fisico (agenzia o corner in un bar o tabaccheria) oppure a distanza, con un conto di gioco su un sito o un'app. In entrambi i casi l'operatore deve avere una concessione dell'Agenzia delle Dogane e dei Monopoli (ADM), il gioco è vietato ai minori di 18 anni e le quote includono il margine dell'operatore.",
          },
          {
            type: "p",
            text: "Cambia invece il modo in cui si gioca: chi gestisce la giocata, come si paga, quanto è facile tenere traccia della spesa e a chi rivolgersi se qualcosa va storto. Non esiste un canale migliore in assoluto: dipende dalle abitudini di chi gioca.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "In entrambi i casi",
            text: "Le scommesse sono intrattenimento a pagamento, non un modo per guadagnare. Decidi prima quanto puoi spendere, in agenzia come online: trovi un metodo in [gestione del budget](/guide/gestione-del-budget).",
          },
        ],
      },
      {
        id: "agenzia",
        title: "Come funziona l'agenzia",
        blocks: [
          {
            type: "p",
            text: "Nel punto vendita il palinsesto è esposto su monitor e su fogli stampati, dove ogni evento ha un codice numerico. Si comunica all'operatore al banco (o si inserisce in un terminale self-service) codice evento, esito e importo; il terminale emette lo scontrino della giocata, la [bolletta](/guide/bolletta-scommesse), che va pagata e conservata.",
          },
          {
            type: "list",
            items: [
              "Non serve aprire un conto: per le giocate ordinarie basta pagare al banco. Oltre le soglie previste dalla normativa antiriciclaggio il punto vendita deve però identificare il giocatore con un documento.",
              "L'operatore al banco può verificare l'età, spiegare un mercato o controllare un errore prima della stampa, ma non dovrebbe consigliare cosa giocare.",
              "La vincita si riscuote presentando la bolletta, che va custodita fino all'incasso.",
            ],
          },
        ],
      },
      {
        id: "online",
        title: "Come funziona un sito di scommesse",
        blocks: [
          {
            type: "p",
            text: "Online serve un conto di gioco intestato, aperto con codice fiscale e documento d'identità (i passaggi sono in [aprire un conto di gioco](/guide/aprire-un-conto-di-gioco)). Si deposita con un metodo tracciabile, si gioca dal sito o dall'app e le vincite tornano sul conto, da cui si possono prelevare.",
          },
          {
            type: "p",
            text: "Ogni giocata resta nello storico del conto, con data, quote e stato: non c'è uno scontrino da conservare e non si può perdere.",
          },
        ],
      },
      {
        id: "confronto",
        title: "Le differenze, punto per punto",
        blocks: [
          {
            type: "table",
            head: ["Aspetto", "Agenzia fisica", "Sito o app"],
            rows: [
              ["Palinsesto", "Ampio sugli eventi principali; mercati e live dipendono dal terminale", "Di solito più mercati e più eventi in diretta"],
              ["Pagamento", "Contanti o carta al banco", "Solo metodi tracciabili, dal conto di gioco"],
              ["Identificazione", "Documento sopra le soglie antiriciclaggio e per la verifica dell'età", "Sempre, all'apertura del conto"],
              ["Traccia della spesa", "Da tenere a mano (bollette)", "Storico automatico di depositi e giocate"],
              ["Limiti di spesa", "Nessun limite tecnico: decide chi gioca", "Limiti di deposito da impostare sul conto, autoesclusione"],
              ["Vincite", "Riscossione con la bolletta, entro i termini", "Accredito sul conto, poi prelievo"],
              ["Assistenza", "Di persona, negli orari del punto vendita", "Chat, email o telefono dell'operatore"],
            ],
            caption: "Le condizioni precise (mercati, metodi di pagamento, termini di riscossione) variano da un operatore all'altro: fa fede il regolamento.",
          },
        ],
      },
      {
        id: "spesa",
        title: "Il controllo della spesa",
        blocks: [
          {
            type: "p",
            text: "È la differenza più importante. Il conto online obbliga a fissare limiti di deposito e offre strumenti come promemoria e [autoesclusione](/guide/autoesclusione-e-limiti-di-gioco); in compenso è sempre disponibile, a qualunque ora, e questo può spingere a giocare più spesso.",
          },
          {
            type: "p",
            text: "In agenzia il gesto di andare al punto vendita e pagare in contanti rende la spesa più visibile, ma non c'è un limite automatico né un registro: chi gioca abitualmente in agenzia fa bene a segnarsi importi e bollette, così da sapere a fine mese quanto ha speso davvero.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Un segnale da non ignorare",
            text: "Se ti accorgi di giocare in più punti vendita, o su più conti, per non vedere il totale, fermati. In [segnali di gioco problematico](/guide/gioco-problematico-dove-chiedere-aiuto) trovi i servizi di aiuto gratuiti.",
          },
        ],
      },
      {
        id: "legalita",
        title: "Sicurezza e legalità: cosa controllare",
        blocks: [
          {
            type: "cards",
            items: [
              {
                title: "In agenzia",
                text: "All'interno del punto vendita devono essere esposti il riferimento alla concessione ADM, il divieto di gioco ai minori e le informazioni sul gioco responsabile. La bolletta riporta il codice univoco della giocata.",
              },
              {
                title: "Online",
                text: "Il sito deve mostrare il numero di concessione e comparire nell'elenco dei siti autorizzati sul sito dell'ADM. I passaggi sono in [come riconoscere un sito legale](/guide/siti-scommesse-legali).",
              },
              {
                title: "Diffida di",
                text: "Raccoglitori di scommesse informali, gruppi che vendono \"schedine sicure\", siti senza concessione o raggiunti con VPN: nessuna tutela su pagamenti e vincite.",
              },
            ],
          },
        ],
      },
      {
        id: "ibrido",
        title: "Usare entrambi i canali",
        blocks: [
          {
            type: "p",
            text: "Molti operatori hanno sia una rete di agenzie sia un sito. Il ponte tra i due è il [prenotatore](/guide/prenotatore-scommesse): si prepara la giocata online, si ottiene un codice e la si convalida e paga in agenzia. In alcuni punti vendita si può anche ricaricare il conto online, ma le ricariche in contanti hanno un tetto settimanale fissato dalla legge e il saldo del conto non si può prelevare al banco: le vincite online si incassano solo sul conto bancario o sulla carta intestati al titolare del conto.",
          },
          {
            type: "p",
            text: "Chi usa entrambi i canali dovrebbe considerare un unico budget: la spesa in agenzia e quella online si sommano.",
          },
        ],
      },
      {
        id: "scegliere",
        title: "In sintesi: dipende da come giochi",
        blocks: [
          {
            type: "list",
            items: [
              "Se giochi raramente e preferisci pagare in contanti e parlare con una persona, l'agenzia è più semplice.",
              "Se vuoi uno storico preciso, limiti automatici e più mercati, il conto online è più comodo, a patto di impostare subito i limiti.",
              "In tutti e due i casi, prima di giocare conviene capire come si legge una quota: [come leggere le quote](/guide/come-leggere-le-quote).",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Serve un documento per scommettere in agenzia?",
        a: "Per le giocate ordinarie no, ma l'operatore può chiederlo per verificare la maggiore età ed è obbligato a identificare il giocatore oltre le soglie previste dalla normativa antiriciclaggio.",
      },
      {
        q: "Le quote in agenzia e online sono le stesse?",
        a: "Spesso sì per lo stesso operatore, ma non è garantito: alcune offerte o quote maggiorate valgono solo su un canale. Fa fede la quota stampata sulla bolletta o mostrata al momento della giocata.",
      },
      {
        q: "Posso riscuotere in agenzia una vincita fatta online?",
        a: "No. Le vincite online vengono accreditate sul conto di gioco e si prelevano solo verso un conto o una carta intestati al titolare: le regole ADM vietano di restituire il saldo in contanti nei punti vendita, anche se appartengono allo stesso concessionario.",
      },
      {
        q: "Un corner in un bar è legale come un'agenzia?",
        a: "Sì, se è collegato a un concessionario ADM. Deve rispettare le stesse regole, compreso il divieto di gioco ai minori.",
      },
    ],
    related: ["prenotatore-scommesse", "bolletta-scommesse", "siti-scommesse-legali", "aprire-un-conto-di-gioco"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "prenotatore-scommesse",
    title: "Prenotatore scommesse: come funziona la prenotazione",
    description:
      "Cos'è il codice di prenotazione, come si prepara una giocata online e si convalida in agenzia, cosa succede alle quote e quando la prenotazione scade.",
    category: "principianti",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgPrenotatore,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è il prenotatore",
        blocks: [
          {
            type: "p",
            text: "Il prenotatore è uno strumento offerto dai concessionari che hanno sia un sito sia una rete di agenzie. Permette di comporre una giocata sul sito o sull'app, anche senza un conto di gioco, e di ottenere un codice di prenotazione. In agenzia basta mostrare il codice: l'operatore lo inserisce nel terminale, la giocata compare già compilata e, dopo il pagamento, viene stampata la [bolletta](/guide/bolletta-scommesse).",
          },
          {
            type: "p",
            text: "Serve soprattutto a chi gioca in agenzia e vuole evitare di dettare decine di codici evento al banco, con il rischio di errori di trascrizione.",
          },
        ],
      },
      {
        id: "passaggi",
        title: "Come si usa, passo per passo",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Apri la sezione scommesse del sito o dell'app del concessionario e aggiungi gli esiti alla schedina, come per una normale giocata.",
              "Indica l'importo e il tipo di giocata (singola, multipla o sistema), poi scegli \"Prenota\" invece di \"Scommetti\".",
              "Annota il codice di prenotazione o salva il QR code che il sito mostra.",
              "In un punto vendita dello stesso concessionario mostra il codice: l'operatore lo carica e ti fa vedere il riepilogo.",
              "Controlla eventi, esiti, quote e importo prima di pagare: la giocata diventa valida solo con la convalida e la stampa della bolletta.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Stesso concessionario",
            text: "Un codice di prenotazione funziona solo nei punti vendita dell'operatore che l'ha generato: il codice di un concessionario non è leggibile dai terminali di un altro.",
          },
        ],
      },
      {
        id: "quote",
        title: "La prenotazione non blocca le quote",
        blocks: [
          {
            type: "p",
            text: "Prenotare non è scommettere: nessuna somma viene pagata e nessuna quota viene garantita. Al momento della convalida il terminale applica le quote in vigore in quel momento, che possono essere salite o scese rispetto a quelle viste online.",
          },
          {
            type: "example",
            title: "Esempio",
            text: "Prenoti la sera una multipla di tre partite a quota complessiva 6,13. La mattina dopo una delle quote è scesa da 1,95 a 1,80 per notizie di formazione: in agenzia la quota totale diventa 5,66 e anche la possibile vincita si riduce. Il riepilogo al banco te lo mostra prima del pagamento.",
          },
          {
            type: "p",
            text: "Per lo stesso motivo un evento già iniziato non può essere convalidato a quota prepartita: l'operatore lo segnala e la giocata va modificata. Per ricalcolare la possibile vincita trovi le formule in [calcolare la vincita di una multipla](/guide/calcolare-vincita-multipla-sistema).",
          },
        ],
      },
      {
        id: "scadenza",
        title: "Scadenza e modifiche",
        blocks: [
          {
            type: "list",
            items: [
              "Ogni prenotazione ha una validità limitata, indicata dall'operatore: di solito scade dopo un certo tempo o al primo evento che inizia.",
              "Una prenotazione scaduta non ha alcun valore: si crea un nuovo codice, senza costi.",
              "Al banco si può chiedere di togliere un evento o cambiare l'importo prima della stampa; dopo la stampa la giocata è definitiva.",
            ],
          },
        ],
      },
      {
        id: "errori",
        title: "Gli errori più comuni",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Pagare senza leggere", text: "Il riepilogo al banco è l'ultimo momento per accorgersi di una quota cambiata o di un esito sbagliato." },
              { title: "Confondere prenotazione e giocata", text: "Finché la bolletta non è stampata e pagata non c'è nessuna scommessa in corso, anche se l'evento poi va come previsto." },
              { title: "Codici condivisi da sconosciuti", text: "Codici di prenotazione venduti o diffusi sui social come \"schedine sicure\" non hanno nulla di speciale: sono giocate come le altre, con lo stesso margine." },
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: "Serve un conto di gioco per prenotare?",
        a: "In genere no: la prenotazione si può fare anche senza accedere. Il conto serve solo per giocare direttamente online.",
      },
      {
        q: "Posso convalidare la prenotazione in qualsiasi agenzia?",
        a: "Solo nei punti vendita del concessionario che ha generato il codice.",
      },
      {
        q: "Se la quota cambia, la prenotazione si annulla?",
        a: "No: in agenzia vengono applicate le quote del momento e il riepilogo mostra la nuova possibile vincita. Sta a te decidere se confermare.",
      },
    ],
    related: ["bolletta-scommesse", "agenzie-scommesse-fisiche-o-online", "controllare-una-bolletta", "singola-multipla-sistema"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "bolletta-scommesse",
    title: "Bolletta scommesse: come si compila e come si legge",
    description:
      "Codici evento, esiti, quote, importo e possibile vincita: come si compila una bolletta in agenzia, come leggerla riga per riga e come funziona la giocata online.",
    category: "principianti",
    readTime: "6 min",
    updatedAt: UPDATED,
    image: imgBolletta,
    sections: [
      {
        id: "cos-e",
        title: "Cos'è la bolletta",
        blocks: [
          {
            type: "p",
            text: "\"Bolletta\" è il nome comune dello scontrino emesso dal terminale dell'agenzia quando una scommessa viene accettata. È la prova della giocata: riporta gli eventi scelti, le quote, l'importo pagato e un codice univoco. Online lo stesso ruolo lo svolge la giocata registrata nello storico del conto, che molti chiamano ancora schedina o bolletta.",
          },
        ],
      },
      {
        id: "compilare",
        title: "Come si compila in agenzia",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Nel palinsesto esposto (monitor o fogli stampati) trova l'evento e il suo codice numerico.",
              "Scegli l'esito: 1, X, 2, Over, Goal e così via. Ogni mercato ha la sua sigla, spiegata in [i mercati del calcio](/guide/mercati-del-calcio).",
              "Comunica all'operatore codice evento ed esito per ogni selezione, oppure usa un codice di [prenotazione](/guide/prenotatore-scommesse).",
              "Indica il tipo di giocata (singola, multipla o sistema) e l'importo.",
              "Controlla il riepilogo, paga e ritira la bolletta stampata.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Singola, multipla o sistema",
            text: "Con più eventi sulla stessa bolletta la differenza è decisiva: in una multipla basta un esito sbagliato per perdere tutto. Le regole sono in [singola, multipla e sistema](/guide/singola-multipla-sistema).",
          },
        ],
      },
      {
        id: "leggere",
        title: "Come si legge, riga per riga",
        blocks: [
          {
            type: "table",
            head: ["Voce", "Cosa indica"],
            rows: [
              ["Codice della giocata", "Il numero univoco che identifica la bolletta: serve per controllarla e riscuoterla"],
              ["Data e ora", "Il momento in cui la giocata è stata accettata"],
              ["Codice evento e avvenimento", "L'incontro scelto, con data e squadre o giocatori"],
              ["Esito", "La previsione giocata, con la sigla del mercato"],
              ["Quota", "La quota di ogni selezione, fissata al momento della stampa"],
              ["Quota totale", "Nelle multiple, il prodotto delle quote"],
              ["Importo", "La somma pagata"],
              ["Possibile vincita", "Importo × quota totale, al lordo di eventuali bonus o arrotondamenti previsti dal regolamento"],
              ["Concessione", "Il riferimento al concessionario ADM che ha accettato la giocata"],
            ],
            caption: "L'ordine e il nome delle voci cambiano da un concessionario all'altro, ma le informazioni sono queste.",
          },
          {
            type: "example",
            title: "Esempio di calcolo",
            text: "Multipla di tre eventi a quote 1,85, 1,70 e 1,95 con 10 € di importo: la quota totale è 1,85 × 1,70 × 1,95 = 6,13 e la possibile vincita è circa 61,33 €. Basta un esito sbagliato e la bolletta è perdente.",
          },
        ],
      },
      {
        id: "online",
        title: "La giocata online",
        blocks: [
          {
            type: "p",
            text: "Sul sito o sull'app la logica è la stessa, senza codici evento: si clicca sugli esiti, la schedina si compone da sola e mostra quota totale e possibile vincita prima della conferma. Una volta accettata, la giocata compare nello storico del conto con il suo codice e il suo stato (aperta, vincente, perdente, rimborsata).",
          },
          {
            type: "p",
            text: "Se durante la conferma una quota cambia, il sito lo segnala e chiede di accettare la nuova quota: leggere sempre il messaggio prima di confermare.",
          },
        ],
      },
      {
        id: "conservare",
        title: "Conservare la bolletta",
        blocks: [
          {
            type: "list",
            items: [
              "La bolletta cartacea vale come titolo per riscuotere la vincita: chi la presenta incassa. Va custodita come denaro contante.",
              "Il calore e la luce sbiadiscono la carta termica: meglio tenerla piegata in un portafoglio e fotografarla, anche se la foto non sostituisce l'originale.",
              "Le vincite vanno riscosse entro i termini fissati dal regolamento del concessionario; oltre la scadenza si perde il diritto all'incasso.",
            ],
          },
          {
            type: "p",
            text: "Come verificare l'esito e cosa succede se un evento viene rinviato è spiegato in [controllare una bolletta](/guide/controllare-una-bolletta).",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Posso annullare una bolletta dopo averla pagata?",
        a: "Di norma no: una volta stampata la giocata è definitiva. Alcuni concessionari ammettono l'annullamento solo in casi limitati e subito dopo l'emissione, secondo il proprio regolamento.",
      },
      {
        q: "Se perdo la bolletta posso riscuotere lo stesso?",
        a: "In genere no, perché la bolletta è un titolo al portatore. Chiedi comunque al punto vendita: le procedure per smarrimento, se previste, dipendono dal concessionario.",
      },
      {
        q: "Qual è l'importo minimo di una bolletta?",
        a: "Lo fissa il regolamento del concessionario, così come la vincita massima per giocata.",
      },
    ],
    related: ["controllare-una-bolletta", "prenotatore-scommesse", "calcolare-vincita-multipla-sistema", "agenzie-scommesse-fisiche-o-online"],
  },
  // ------------------------------------------------------------------------------------------------
  {
    slug: "controllare-una-bolletta",
    title: "Controllare una bolletta: esito, eventi rinviati e riscossione",
    description:
      "Come verificare se una bolletta è vincente, cosa succede se un evento è rinviato o annullato, come si riscuote una vincita in agenzia e cosa fare in caso di contestazione.",
    category: "principianti",
    readTime: "5 min",
    updatedAt: UPDATED,
    image: imgControllo,
    sections: [
      {
        id: "verificare",
        title: "Come verificare l'esito",
        blocks: [
          {
            type: "list",
            items: [
              "Al banco o al terminale self-service: la scansione del codice a barre mostra subito lo stato della giocata.",
              "Sul sito del concessionario: molti operatori hanno una funzione di controllo in cui si inserisce il codice della bolletta.",
              "Online: la giocata fatta dal conto si aggiorna da sola nello storico, con lo stato e l'eventuale accredito.",
            ],
          },
          {
            type: "p",
            text: "Lo stato ufficiale arriva quando l'operatore ha registrato i risultati di tutti gli eventi, che di solito avviene poco dopo la fine dell'ultimo. Per i risultati delle partite puoi consultare le pagine [Calcio](/calcio) e [Basket](/basket) del sito, ma fa sempre fede il risultato registrato dal concessionario secondo il suo regolamento.",
          },
        ],
      },
      {
        id: "rinviati",
        title: "Eventi rinviati, sospesi o annullati",
        blocks: [
          {
            type: "p",
            text: "Se un evento non si gioca o non si conclude, il regolamento del concessionario stabilisce cosa succede. La regola più diffusa è questa:",
          },
          {
            type: "cards",
            items: [
              { title: "Nella singola", text: "Se l'evento non viene disputato entro i tempi previsti dal regolamento, la giocata è rimborsata." },
              { title: "Nella multipla", text: "La selezione annullata viene di solito considerata a quota 1,00: la bolletta resta valida sugli altri eventi, con una quota totale più bassa." },
              { title: "Nel sistema", text: "Vale lo stesso principio per ogni combinazione che contiene l'evento annullato." },
            ],
          },
          {
            type: "example",
            title: "Esempio",
            text: "Multipla a quote 1,85, 1,70 e 1,95 con 10 € di importo. La terza partita viene rinviata e annullata: la sua quota diventa 1,00, la quota totale scende a 3,15 e, se gli altri due esiti sono corretti, la vincita è circa 31,45 € invece di 61,33 €.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Le eccezioni ci sono",
            text: "Tempi di attesa, mercati già decisi (per esempio un Over superato prima della sospensione) e ritiri nel tennis seguono regole diverse da operatore a operatore. Se hai un dubbio, leggi la sezione del regolamento sugli eventi sospesi.",
          },
        ],
      },
      {
        id: "riscuotere",
        title: "Come si riscuote",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Porta la bolletta originale in un punto vendita del concessionario che l'ha emessa: la scansione verifica stato e importo.",
              "Per le vincite più alte il punto vendita può chiedere un documento d'identità, come previsto dalla normativa antiriciclaggio, e pagare con un mezzo tracciabile invece che in contanti.",
              "Rispetta il termine di riscossione indicato nel regolamento: dopo la scadenza la vincita non è più esigibile.",
            ],
          },
          {
            type: "p",
            text: "Le vincite delle giocate online vengono invece accreditate sul conto di gioco; i tempi di prelievo dipendono dal metodo scelto, come spiegato in [depositi e prelievi](/guide/depositi-e-prelievi).",
          },
        ],
      },
      {
        id: "contestare",
        title: "Se pensi che ci sia un errore",
        blocks: [
          {
            type: "list",
            items: [
              "Controlla prima il regolamento: molti dubbi nascono da come viene definito un mercato (tempi regolamentari, supplementari, autogol, ritiri).",
              "Chiedi al punto vendita o all'assistenza dell'operatore, indicando il codice della giocata. Conserva bolletta e ricevute.",
              "Se la risposta non ti soddisfa puoi presentare un reclamo scritto al concessionario e, in seconda battuta, rivolgerti all'ADM.",
            ],
          },
          {
            type: "p",
            text: "Anche una quota palesemente sbagliata per un errore materiale può essere corretta o annullata dall'operatore, nei limiti previsti dal regolamento: è un caso raro, ma conviene sapere che esiste.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Posso riscuotere una bolletta in un'altra agenzia?",
        a: "Sì, se il punto vendita appartiene allo stesso concessionario e il regolamento lo consente; in un'agenzia di un altro operatore no.",
      },
      {
        q: "Una partita sospesa al 70' conta come giocata?",
        a: "Dipende dal regolamento: spesso conta solo se viene completata entro un certo termine, ma i mercati già decisi possono essere pagati comunque.",
      },
      {
        q: "Il cash out si può fare su una bolletta di agenzia?",
        a: "Alcuni concessionari lo offrono anche sulle giocate fatte al banco, tramite terminale o codice della bolletta. Come viene calcolato è spiegato in [il cash out](/guide/cash-out).",
      },
    ],
    related: ["bolletta-scommesse", "prenotatore-scommesse", "cash-out", "depositi-e-prelievi"],
  },
];
