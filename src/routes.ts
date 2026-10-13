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

export const SITE_NAME = "Quota Guru";

export const paths = {
  home: "/",
  calcio: "/calcio",
  tennis: "/tennis",
  basket: "/basket",
  // Tennis and basket event pages still show a single sample match (mock data).
  tennisEvento: "/tennis/djokovic-alcaraz",
  basketEvento: "/basket/lakers-celtics",
  sitiScommesse: "/siti-scommesse",
  bonus: "/bonus",
  guide: "/guide",
  guidaDettaglio: "/guide/guida-completa-scommesse-sportive",
  accedi: "/accedi",
  registrati: "/registrati",
  passwordDimenticata: "/password-dimenticata",
} as const;

export const routes: RouteMeta[] = [
  {
    path: paths.home,
    title: "Quota Guru – Le migliori quote sportive a confronto",
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
    title: "Quote Basket – Confronto quote NBA, Eurolega e Serie A",
    description: "Confronta le quote basket dei migliori bookmaker per NBA, Euroleague, Serie A e tutti i campionati.",
  },
  {
    path: paths.tennisEvento,
    title: "Djokovic – Alcaraz: quote, statistiche e dove vederla",
    description: "Quote a confronto, statistiche dei giocatori e dove vedere Djokovic – Alcaraz.",
  },
  {
    path: paths.basketEvento,
    title: "Lakers – Celtics: quote, quintetti e dove vederla",
    description: "Quote a confronto, quintetti base, statistiche e dove vedere Lakers – Celtics.",
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
    path: paths.guidaDettaglio,
    title: "Guida completa alle scommesse sportive",
    description: "Tutto quello che devi sapere su quote, tipologie di scommessa, strategie e gioco responsabile.",
  },
  { path: paths.accedi, title: "Accedi", description: "Accedi al tuo account Quota Guru.", index: false },
  { path: paths.registrati, title: "Registrati", description: "Crea il tuo account Quota Guru.", index: false },
  {
    path: paths.passwordDimenticata,
    title: "Password dimenticata",
    description: "Reimposta la password del tuo account Quota Guru.",
    index: false,
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
