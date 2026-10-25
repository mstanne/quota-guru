/**
 * Single source of truth for the site's URLs and their SEO metadata.
 * Used by the client router (document title), by the pre-render script (static HTML per page)
 * and to generate sitemap.xml.
 */
export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  /** false = reachable but excluded from sitemap and marked noindex  */
  index?: boolean;
  /** schema.org objects for this page (JSON-LD); BreadcrumbList is added by the pre-render from the visible trail. */
  jsonLd?: Record<string, unknown>[];
  /** Social preview image, path from the site root (e.g. "/og/guide/cash-out.png"); default /og-image.png. */
  image?: { path: string; width: number; height: number };
  /** true = the page is final (finished match): the pre-render archives it and keeps publishing it after the
   *  match leaves the data window. */
  archive?: boolean;
}

export const SITE_NAME = "QuotaGuru";

export const paths = {
  home: "/",
  calcio: "/calcio",
  tennis: "/tennis",
  basket: "/basket",
  sitiScommesse: "/siti-scommesse",
  bonus: "/bonus",
  guide: "/guide",
  // first guide (used for #responsabile links); all guides: src/data/guides.ts
  guidaDettaglio: "/guide/guida-completa-scommesse-sportive",
  squadreCalcio: "/calcio/squadre",
  squadreNba: "/basket/nba/squadre",
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
    title: "QuotaGuru – Pronostici calcio, tennis e NBA basati sui dati",
    description:
      "Probabilità di ogni esito calcolate da modelli statistici per calcio, tennis e NBA, con calendario, risultati, classifiche e guide alle scommesse.",
  },
  {
    path: paths.calcio,
    title: "Pronostici calcio: calendario, risultati e classifiche",
    description:
      "Pronostici con le probabilità 1X2, partite in programma, risultati e classifiche di Serie A, Champions League, Premier League, LaLiga e degli altri principali campionati.",
  },
  {
    path: paths.tennis,
    title: "Pronostici tennis: chi vince tra i top 100 ATP e WTA",
    description:
      "Probabilità di vittoria e risultato in set per ogni sfida tra i top 100 ATP e WTA, con classifiche aggiornate e calendario dei tornei.",
  },
  {
    path: paths.basket,
    title: "Basket: calendario NBA e classifica Serie A",
    description:
      "Calendario e risultati NBA in orario italiano con il pronostico di ogni partita, e classifica della Serie A di basket.",
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
  {
    path: paths.squadreCalcio,
    title: "Squadre di calcio: rose, statistiche e stagioni",
    description:
      "Le squadre di Serie A, Premier League, LaLiga, Bundesliga, Ligue 1 e degli altri campionati: società, rosa e statistiche stagione per stagione.",
  },
  {
    path: paths.squadreNba,
    title: "Squadre NBA: roster, statistiche e stagioni",
    description: "Le 30 squadre NBA: roster, record e statistiche dei giocatori stagione per stagione.",
  },
  {
    path: paths.chiSiamo,
    title: "Chi siamo",
    description: "Cos'è QuotaGuru, come calcola i pronostici, come confronta le offerte degli operatori autorizzati e chi gestisce il sito.",
  },
  {
    path: paths.contatti,
    title: "Contatti",
    description: "Come contattare QuotaGuru per segnalazioni, correzioni e collaborazioni.",
  },
  {
    path: paths.faq,
    title: "Domande frequenti",
    description: "Risposte alle domande più comuni su pronostici, operatori, dati e gioco responsabile.",
  },
  {
    path: paths.metodologia,
    title: "Metodologia",
    description: "Come QuotaGuru calcola i pronostici di calcio, tennis e NBA, da dove arrivano i dati e come aggiorna le offerte degli operatori.",
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
