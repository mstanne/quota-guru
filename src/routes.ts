/**
 * Single source of truth for the site's URLs and their SEO metadata.
 * Used by the client router (document title), by the pre-render script (static HTML per page)
 * and to generate sitemap.xml.
 */
export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  /** false = reachable but excluded from sitemap and marked noindex (e.g. hidden login pages) */
  index?: boolean;
}

export const SITE_NAME = "QuotaGuru";

export const paths = {
  home: "/",
  calcio: "/calcio",
  tennis: "/tennis",
  basket: "/basket",
  // The tennis event page still shows a single sample match (mock data).
  tennisEvento: "/tennis/djokovic-alcaraz",
  sitiScommesse: "/siti-scommesse",
  bonus: "/bonus",
  guide: "/guide",
  // first guide (used for #responsabile links); all guides: src/data/guides.ts
  guidaDettaglio: "/guide/guida-completa-scommesse-sportive",
  accedi: "/accedi",
  registrati: "/registrati",
  passwordDimenticata: "/password-dimenticata",
  chiSiamo: "/chi-siamo",
  contatti: "/contatti",
  faq: "/faq",
  metodologia: "/metodologia",
  affiliazione: "/affiliazione",
  termini: "/termini",
  privacy: "/privacy",
  cookie: "/cookie",
} as const;

export const routes: RouteMeta[] = [
  {
    path: paths.home,
    title: "QuotaGuru – Le migliori quote sportive a confronto",
    description:
      "Confronta le quote di calcio, tennis e basket dei principali bookmaker e trova sempre la quota più alta.",
  },
  {
    path: paths.calcio,
    title: "Calcio: calendario, risultati e classifiche",
    description:
      "Partite in programma, risultati e classifiche di Serie A, Champions League, Premier League, LaLiga e degli altri principali campionati.",
  },
  {
    path: paths.tennis,
    title: "Quote Tennis – Confronto quote ATP, WTA e Grand Slam",
    description: "Confronta le quote tennis dei migliori bookmaker per ATP, WTA e tutti i tornei internazionali.",
  },
  {
    path: paths.basket,
    title: "Basket: calendario NBA e classifica Serie A",
    description:
      "Calendario e risultati NBA in orario italiano, classifica della Serie A di basket e quote a confronto degli operatori autorizzati.",
  },
  {
    path: paths.tennisEvento,
    title: "Djokovic – Alcaraz: quote, statistiche e dove vederla",
    description: "Quote a confronto, statistiche dei giocatori e dove vedere Djokovic – Alcaraz.",
  },
  {
    path: paths.sitiScommesse,
    title: "Siti di scommesse legali in Italia a confronto",
    description: "Confronta i bookmaker autorizzati ADM: caratteristiche, metodi di pagamento, pro e contro.",
  },
  {
    path: paths.bonus,
    title: "Bonus scommesse a confronto",
    description: "Le offerte dei bookmaker online con requisiti, deposito minimo e termini a confronto.",
  },
  {
    path: paths.guide,
    title: "Guide alle scommesse sportive",
    description: "Impara a leggere le quote, gestire il bankroll e scommettere in modo responsabile.",
  },
  { path: paths.accedi, title: "Accedi", description: "Accedi al tuo account QuotaGuru.", index: false },
  { path: paths.registrati, title: "Registrati", description: "Crea il tuo account QuotaGuru.", index: false },
  {
    path: paths.passwordDimenticata,
    title: "Password dimenticata",
    description: "Reimposta la password del tuo account QuotaGuru.",
    index: false,
  },
  {
    path: paths.chiSiamo,
    title: "Chi siamo",
    description: "Cos'è QuotaGuru, come confronta quote e operatori autorizzati e chi gestisce il sito.",
  },
  {
    path: paths.contatti,
    title: "Contatti",
    description: "Come contattare QuotaGuru per segnalazioni, correzioni e collaborazioni.",
  },
  {
    path: paths.faq,
    title: "Domande frequenti",
    description: "Risposte alle domande più comuni su quote, operatori, schedina e gioco responsabile.",
  },
  {
    path: paths.metodologia,
    title: "Metodologia",
    description: "Come QuotaGuru raccoglie, ordina e aggiorna quote, offerte e valutazioni degli operatori.",
  },
  {
    path: paths.affiliazione,
    title: "Dichiarazione di affiliazione",
    description: "I rapporti commerciali tra QuotaGuru e gli operatori e perché non influiscono sul confronto.",
  },
  {
    path: paths.termini,
    title: "Termini e condizioni d'uso",
    description: "Condizioni di utilizzo del sito QuotaGuru.",
  },
  {
    path: paths.privacy,
    title: "Informativa privacy",
    description: "Come QuotaGuru tratta i dati personali ai sensi del GDPR.",
  },
  {
    path: paths.cookie,
    title: "Cookie policy",
    description: "Cookie e strumenti tecnici e statistici usati da QuotaGuru.",
  },
];

export const notFoundMeta: RouteMeta = {
  path: "/404",
  title: "Pagina non trovata",
  description: "La pagina che cerchi non esiste o è stata spostata.",
  index: false,
};

/** Static route metadata, or undefined for data-driven pages (they set their own title with usePageMeta). */
export function findStaticRoute(pathname: string): RouteMeta | undefined {
  const clean = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
  return routes.find((r) => r.path === clean);
}

export function fullTitle(meta: RouteMeta) {
  return meta.path === "/" ? meta.title : `${meta.title} | ${SITE_NAME}`;
}
