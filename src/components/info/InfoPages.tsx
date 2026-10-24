// F10: institutional pages (about, contacts, FAQ, methodology, affiliate disclosure, terms, privacy, cookies).
// Texts are TEMPLATES: company data come from src/data/site.ts, and the legal pages (terms, privacy, cookies)
// must be reviewed by a lawyer before publishing.
import type { ReactNode } from "react";
import { Link } from "react-router";
import { BookOpen, Cookie, FileText, HelpCircle, Info, Mail, Scale, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { ConsentSettingsLink } from "../privacy/ConsentBanner";
import { site, isFilled } from "../../data/site";
import { responsibleGambling as rg } from "../../data/operators";
import { analyticsConfigured } from "../../lib/analytics";
import { paths } from "../../routes";

/** Readable long-form text on the dark theme (no typography plugin needed). */
function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl text-slate-300 leading-relaxed [&_h2]:text-white [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-white [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1.5 [&_a]:text-action-text [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-action-text-hover [&_strong]:text-white">
      {children}
    </div>
  );
}

function InfoLayout({
  title,
  subtitle,
  icon,
  crumb,
  updated = false,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  crumb: string;
  updated?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        breadcrumb={[{ label: crumb }]}
        meta={updated ? <span>Ultimo aggiornamento: {site.legalUpdatedAt}</span> : undefined}
      />
      <div className="container mx-auto px-4 py-10">
        <Prose>{children}</Prose>
      </div>
    </div>
  );
}

const Mailto = ({ email }: { email: string }) =>
  isFilled(email) ? (
    <a href={`mailto:${email}`}>{email}</a>
  ) : (
    <span title="Da compilare in src/data/site.ts">{email}</span>
  );

const Company = () => (
  <>
    <strong>{site.company}</strong>, {site.address}, P. IVA {site.vatNumber}
  </>
);

// ---------------------------------------------------------------------------------------------

export function ChiSiamoPage() {
  return (
    <InfoLayout title="Chi siamo" icon={Info} crumb="Chi siamo" subtitle="Cos'è QuotaGuru e come lavoriamo">
      <p>
        {site.name} è un servizio informativo che mette a confronto quote, condizioni delle offerte e caratteristiche
        degli operatori di gioco autorizzati in Italia, insieme a calendari, risultati e classifiche sportive.
      </p>
      <p>
        Non accettiamo giocate, non gestiamo conti di gioco e non siamo un concessionario: le scommesse si effettuano
        esclusivamente sui siti degli operatori con concessione dell'{rg.regulatorName}.
      </p>
      <h2>Indipendenza</h2>
      <p>
        L'ordine delle quote è calcolato automaticamente in base al valore, senza che gli operatori possano influire
        sulla posizione o sull'evidenza grafica. Come funziona il confronto è spiegato nella pagina{" "}
        <Link to={paths.metodologia}>Metodologia</Link>; i rapporti commerciali con gli operatori sono descritti nella{" "}
        <Link to={paths.affiliazione}>dichiarazione di affiliazione</Link>.
      </p>
      <h2>Gioco responsabile</h2>
      <p>
        Il gioco con vincita in denaro è vietato ai minori di {rg.minAge} anni e può causare dipendenza. Se hai bisogno
        di aiuto puoi chiamare il {rg.helplineName} ({rg.helplineOrg}):{" "}
        <a href={rg.helplineHref}>{rg.helplineNumber}</a>, gratuito e anonimo.
      </p>
      <h2>Chi c'è dietro</h2>
      <p>
        Il sito è gestito da <Company />. Per qualsiasi richiesta: <Link to={paths.contatti}>contatti</Link>.
      </p>
    </InfoLayout>
  );
}

export function ContattiPage() {
  return (
    <InfoLayout title="Contatti" icon={Mail} crumb="Contatti" subtitle="Segnalazioni, richieste e collaborazioni">
      <p>
        Per segnalare un errore nelle quote o nei dati, chiedere una correzione o proporre una collaborazione scrivi a{" "}
        <Mailto email={site.email} />. Rispondiamo di solito entro due giorni lavorativi.
      </p>
      <ul>
        <li>
          <strong>Quota o dato sbagliato:</strong> indica la pagina, l'evento e l'orario in cui l'hai visto.
        </li>
        <li>
          <strong>Privacy e dati personali:</strong> <Mailto email={site.privacyEmail} />.
        </li>
        <li>
          <strong>PEC:</strong> {site.pec}.
        </li>
      </ul>
      <p>
        Non possiamo intervenire su conti di gioco, depositi, prelievi o giocate: per questi casi contatta direttamente
        l'assistenza dell'operatore.
      </p>
      <h2>Hai bisogno di aiuto con il gioco?</h2>
      <p>
        {rg.helplineName} ({rg.helplineOrg}): <a href={rg.helplineHref}>{rg.helplineNumber}</a>, gratuito e anonimo.
      </p>
      <h2>Dati societari</h2>
      <p>
        <Company />
      </p>
    </InfoLayout>
  );
}

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Posso scommettere su questo sito?",
    a: "No. Il sito confronta quote e offerte ma non accetta giocate: le scommesse si effettuano solo sui siti degli operatori autorizzati.",
  },
  {
    q: "Quanto sono aggiornate le quote?",
    a: "Ogni quota mostra l'orario dell'ultimo aggiornamento ricevuto dall'operatore. Le quote cambiano spesso: verifica sempre il valore sul sito dell'operatore prima di giocare.",
  },
  {
    q: "Perché un operatore compare prima di un altro?",
    a: (
      <>
        Le quote sono ordinate dalla più alta alla più bassa; a parità di valore l'ordine è alfabetico. Nessun operatore
        può pagare per una posizione migliore. Dettagli nella pagina <Link to={paths.metodologia}>Metodologia</Link>.
      </>
    ),
  },
  {
    q: "Il sito guadagna dagli operatori?",
    a: (
      <>
        Sì, può ricevere un compenso quando un utente visita il sito di un operatore dai nostri link. Lo spieghiamo
        nella <Link to={paths.affiliazione}>dichiarazione di affiliazione</Link>; il compenso non influisce sull'ordine
        dei risultati.
      </>
    ),
  },
  {
    q: "Gli operatori presenti sono legali?",
    a: `Mostriamo solo operatori con concessione dell'${rg.regulatorName}; il numero di concessione è indicato nella scheda di ogni operatore e si può verificare sul sito adm.gov.it.`,
  },
  {
    q: "Da dove arrivano calendario, risultati e classifiche del calcio?",
    a: "Dall'API di football-data.org, aggiornata più volte al giorno. I risultati non sono in diretta.",
  },
  {
    q: "Come funziona la schedina?",
    a: "Raccoglie le selezioni che aggiungi cliccando sulle quote e calcola la quota totale per ciascun operatore che le offre tutte. È solo un promemoria: la giocata va fatta sul sito dell'operatore.",
  },
  {
    q: "Ho bisogno di aiuto con il gioco: a chi posso rivolgermi?",
    a: (
      <>
        Al {rg.helplineName} ({rg.helplineOrg}): <a href={rg.helplineHref}>{rg.helplineNumber}</a>, gratuito e anonimo.
      </>
    ),
  },
];

export function FaqPage() {
  return (
    <InfoLayout
      title="Domande frequenti"
      icon={HelpCircle}
      crumb="FAQ"
      subtitle="Le risposte alle domande più comuni sul sito"
    >
      <h2 className="sr-only">Elenco delle domande</h2>
      <Accordion type="single" collapsible className="not-prose">
        {FAQ.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-slate-800">
            <AccordionTrigger className="text-white text-base hover:no-underline hover:text-white">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-300 text-base">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="mt-8">
        Non trovi la risposta? <Link to={paths.contatti}>Scrivici</Link>.
      </p>
    </InfoLayout>
  );
}

export function MetodologiaPage() {
  return (
    <InfoLayout
      title="Metodologia"
      icon={Scale}
      crumb="Metodologia"
      subtitle="Come raccogliamo e confrontiamo quote, offerte e informazioni sugli operatori"
      updated
    >
      <h2>Quali operatori</h2>
      <p>
        Compaiono solo operatori con concessione dell'{rg.regulatorName} valida. La concessione viene verificata
        sull'elenco ufficiale all'inserimento dell'operatore e periodicamente in seguito.
      </p>
      <h2>Da dove arrivano i dati</h2>
      <ul>
        <li>
          <strong>Quote:</strong> fornite dagli operatori stessi tramite feed, e controllate automaticamente (formato,
          scadenza, coerenza) prima della pubblicazione.
        </li>
        <li>
          <strong>Offerte di benvenuto:</strong> rilevate dalla redazione sulle pagine ufficiali degli operatori e
          ricontrollate periodicamente; ogni offerta riporta la data dell'ultima verifica.
        </li>
        <li>
          <strong>Calendario, risultati e classifiche del calcio:</strong> API di football-data.org.
        </li>
      </ul>
      <h2>Come ordiniamo le quote</h2>
      <p>
        Per ogni esito la quota più alta è evidenziata come <strong>quota migliore</strong>. Le righe sono ordinate per
        valore; a parità di valore l'ordine è alfabetico. Gli operatori non possono acquistare posizioni, colori o
        etichette. Le quote non aggiornate di recente o sospese non partecipano al calcolo della migliore.
      </p>
      <h2>Aggiornamento</h2>
      <p>
        Ogni quota riporta l'orario dell'ultimo aggiornamento ricevuto. Le quote cambiano di continuo: il valore valido
        è sempre quello mostrato sul sito dell'operatore al momento della giocata.
      </p>
      <h2>Offerte</h2>
      <p>
        Le condizioni delle offerte (importo di ciascuna parte, deposito minimo, requisiti di giocata, scadenze) sono
        riportate in campi separati per permettere un confronto oggettivo. Quando un operatore indica un totale che somma
        bonus su prodotti diversi, mostriamo separatamente la parte utilizzabile su ciascun prodotto. Le offerte non
        verificate di recente o scadute non vengono mostrate.
      </p>
      <h2>Operatori</h2>
      <p>
        Non assegniamo voti o classifiche agli operatori: nella pagina degli operatori compaiono in ordine alfabetico,
        con caratteristiche, metodi di pagamento e condizioni rilevate dai loro siti.
      </p>
      <h2>Errori</h2>
      <p>
        Se noti un dato sbagliato <Link to={paths.contatti}>segnalacelo</Link>: lo verifichiamo e lo correggiamo.
      </p>
    </InfoLayout>
  );
}

export function AffiliazionePage() {
  return (
    <InfoLayout title="Dichiarazione di affiliazione" icon={FileText} crumb="Affiliazione" updated>
      <p>
        Alcuni link presenti sul sito, in particolare i pulsanti &laquo;Vai al sito&raquo;, sono link di affiliazione:
        se visiti il sito di un operatore da questi link, {site.name} può ricevere un compenso dall'operatore. Per te
        non cambia nulla e non comporta alcun costo.
      </p>
      <p>
        Il compenso <strong>non influisce</strong> sull'ordine delle quote, sull'evidenza della quota migliore né sul
        modo in cui presentiamo operatori e offerte, che seguono i criteri descritti nella pagina{" "}
        <Link to={paths.metodologia}>Metodologia</Link>. I link di affiliazione sono marcati come sponsorizzati per i
        motori di ricerca.
      </p>
      <p>Operatori con cui esiste un accordo: [ELENCO_OPERATORI_CON_ACCORDO].</p>
    </InfoLayout>
  );
}

export function TerminiPage() {
  return (
    <InfoLayout title="Termini e condizioni d'uso" icon={BookOpen} crumb="Termini e condizioni" updated>
      <h2>1. Chi gestisce il sito</h2>
      <p>
        Il sito {site.name} è gestito da <Company /> (di seguito &laquo;il Gestore&raquo;). Contatti:{" "}
        <Mailto email={site.email} />.
      </p>
      <h2>2. Cosa offre il sito</h2>
      <p>
        Il sito fornisce informazioni di confronto su quote, offerte e caratteristiche di operatori di gioco
        autorizzati, oltre a dati sportivi. Il sito non raccoglie giocate, non gestisce conti di gioco e non è un
        concessionario.
      </p>
      <h2>3. Accesso riservato ai maggiorenni</h2>
      <p>I contenuti riguardano giochi con vincita in denaro e sono destinati a persone di almeno {rg.minAge} anni.</p>
      <h2>4. Accuratezza delle informazioni</h2>
      <p>
        Il Gestore cura l'aggiornamento dei dati ma non può garantirne la completa esattezza in ogni momento: quote e
        condizioni sono stabilite dagli operatori e possono cambiare senza preavviso. Prima di giocare verifica sempre
        le informazioni sul sito dell'operatore, che prevalgono su quelle mostrate qui.
      </p>
      <h2>5. Link a siti di terzi</h2>
      <p>
        Il sito contiene link a siti di operatori e di terzi, sui quali il Gestore non ha controllo. L'uso di tali siti
        è regolato dai rispettivi termini. Alcuni link sono di affiliazione: vedi la{" "}
        <Link to={paths.affiliazione}>dichiarazione di affiliazione</Link>.
      </p>
      <h2>6. Proprietà intellettuale</h2>
      <p>
        Testi, grafica e codice del sito appartengono al Gestore o ai rispettivi titolari. Marchi e loghi degli
        operatori e delle squadre appartengono ai legittimi proprietari e sono usati a fini identificativi. Dati
        calcistici forniti da football-data.org.
      </p>
      <h2>7. Limitazione di responsabilità</h2>
      <p>
        Nei limiti consentiti dalla legge, il Gestore non risponde di decisioni di gioco prese sulla base delle
        informazioni del sito, né di interruzioni o errori del servizio. [CLAUSOLE_DA_VALIDARE_CON_LEGALE]
      </p>
      <h2>8. Modifiche</h2>
      <p>I presenti termini possono essere aggiornati; la data dell'ultima modifica è indicata in alto.</p>
      <h2>9. Legge applicabile</h2>
      <p>Si applica la legge italiana. Foro competente: [FORO_COMPETENTE], salvo diversa previsione inderogabile.</p>
    </InfoLayout>
  );
}

export function PrivacyPage() {
  return (
    <InfoLayout title="Informativa privacy" icon={ShieldCheck} crumb="Privacy" updated>
      <p>Informativa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR).</p>
      <h2>Titolare del trattamento</h2>
      <p>
        <Company />. Contatto privacy: <Mailto email={site.privacyEmail} />.
      </p>
      <h2>Quali dati trattiamo</h2>
      <ul>
        <li>
          <strong>Dati tecnici di navigazione</strong> (indirizzo IP, browser, pagine richieste) trattati dai server che
          ospitano il sito per garantirne il funzionamento e la sicurezza.
        </li>
        <li>
          <strong>Preferenze salvate nel browser</strong>: conferma della maggiore età, scelte sui cookie, contenuto
          della schedina. Restano sul tuo dispositivo.
        </li>
        <li>
          <strong>Statistiche di utilizzo</strong> (pagine visitate, clic sui link verso gli operatori), solo se hai
          dato il consenso. Vedi la <Link to={paths.cookie}>cookie policy</Link>.
        </li>
        <li>
          <strong>Dati che ci invii</strong> scrivendoci (indirizzo email e contenuto del messaggio).
        </li>
      </ul>
      <h2>Finalità e basi giuridiche</h2>
      <ul>
        <li>Fornire il sito e garantirne la sicurezza: legittimo interesse del Titolare.</li>
        <li>Statistiche di utilizzo: consenso, revocabile in qualsiasi momento.</li>
        <li>Rispondere alle richieste: esecuzione di misure richieste dall'interessato.</li>
        <li>Adempiere a obblighi di legge: obbligo legale.</li>
      </ul>
      <h2>Destinatari</h2>
      <p>
        Fornitori che trattano dati per conto del Titolare come responsabili del trattamento: hosting
        ([FORNITORE_HOSTING]) e, se attivo, statistiche ([FORNITORE_STATISTICHE]). Non vendiamo dati a terzi e non li
        condividiamo con gli operatori di gioco.
      </p>
      <h2>Trasferimenti fuori dall'UE</h2>
      <p>[DESCRIVERE_EVENTUALI_TRASFERIMENTI_E_GARANZIE]</p>
      <h2>Conservazione</h2>
      <p>
        Dati tecnici: [DURATA]. Statistiche: in forma aggregata, [DURATA]. Richieste via email: per il tempo necessario
        a gestirle e comunque non oltre [DURATA].
      </p>
      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento scrivendo a{" "}
        <Mailto email={site.privacyEmail} />. Puoi revocare il consenso alle statistiche dalle preferenze cookie. Hai
        diritto di proporre reclamo al Garante per la protezione dei dati personali (
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
          garanteprivacy.it
        </a>
        ).
      </p>
    </InfoLayout>
  );
}

export function CookiePage() {
  return (
    <InfoLayout title="Cookie policy" icon={Cookie} crumb="Cookie" updated>
      <p>
        Questa pagina descrive i cookie e le tecnologie simili (come l'archiviazione locale del browser) usati dal sito.
      </p>
      <h2>Strumenti tecnici (sempre attivi)</h2>
      <p>Necessari al funzionamento; non richiedono consenso e non servono a profilarti.</p>
      <ul>
        <li>
          <strong>qg-age-ok</strong> (archiviazione locale): ricorda che hai confermato la maggiore età.
        </li>
        <li>
          <strong>qg-consent</strong> (archiviazione locale): ricorda la tua scelta sulle statistiche.
        </li>
      </ul>
      <h2>Statistiche (solo con consenso)</h2>
      {analyticsConfigured ? (
        <p>
          Con il tuo consenso usiamo [FORNITORE_STATISTICHE] per misurare in forma aggregata le pagine visitate e i clic
          sui link verso gli operatori. Lo strumento viene caricato solo dopo che hai accettato.
        </p>
      ) : (
        <p>Al momento il sito non usa strumenti di statistica né cookie di terze parti.</p>
      )}
      <h2>Come cambiare le preferenze</h2>
      <p>
        {analyticsConfigured ? (
          <>
            Puoi modificare la scelta in qualsiasi momento:{" "}
            <ConsentSettingsLink className="text-action-text underline underline-offset-2 hover:text-action-text-hover cursor-pointer" />
            . Puoi anche cancellare i dati del sito dalle impostazioni del browser.
          </>
        ) : (
          <>Puoi cancellare i dati salvati dal sito dalle impostazioni del browser.</>
        )}
      </p>
      <p>
        Per maggiori informazioni sul trattamento dei dati vedi l'<Link to={paths.privacy}>informativa privacy</Link>.
      </p>
    </InfoLayout>
  );
}
