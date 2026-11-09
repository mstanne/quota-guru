import { Suspense, useEffect } from "react";
import { matchPath, Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import { BetSlipProvider } from "./context/BetSlipContext";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { HowPredictionsWork } from "./components/HowPredictionsWork";
import { BonusSection } from "./components/BonusSection";
import { Footer } from "./components/Footer";
import { BetSlip } from "./components/BetSlip";
import { AgeGate } from "./components/responsible/ResponsibleGambling";
import { ConsentBanner } from "./components/privacy/ConsentBanner";
import { lazyPage } from "./lib/lazyPage";
import { findStaticRoute, fullTitle, paths } from "./routes";

// Pages are split into separate JS chunks (T1). Home components above stay in the main bundle.
const UpcomingMatches = lazyPage(() => import("./components/calcio/UpcomingMatches").then((m) => m.UpcomingMatches));
const CalcioPage = lazyPage(() => import("./components/calcio/CalcioPage").then((m) => m.CalcioPage));
const CalcioMatchPage = lazyPage(() => import("./components/calcio/CalcioMatchPage").then((m) => m.CalcioMatchPage));
const PronosticiLeagueChild = lazyPage(() =>
  import("./components/calcio/PronosticiLeaguePage").then((m) => m.PronosticiLeagueChild),
);
const BasketEventPage = lazyPage(() => import("./components/basket/BasketEventPage").then((m) => m.BasketEventPage));
const GoalStatsPage = lazyPage(() => import("./components/stats/GoalStatsPage").then((m) => m.GoalStatsPage));
const LeadersPage = lazyPage(() => import("./components/stats/LeadersPage").then((m) => m.LeadersPage));
const PlayerPage = lazyPage(() => import("./components/players/PlayerPage").then((m) => m.PlayerPage));
const NbaPlayerPage = lazyPage(() => import("./components/players/NbaPlayerPage").then((m) => m.NbaPlayerPage));
const CornersCardsPage = lazyPage(() => import("./components/stats/CornersCardsPage").then((m) => m.CornersCardsPage));
const LegacyRedirect = lazyPage(() => import("./components/LegacyRedirect").then((m) => m.LegacyRedirect));
const DayPredictionsPage = lazyPage(() =>
  import("./components/predictions/DayPredictionsPage").then((m) => m.DayPredictionsPage),
);
const TrackRecordPage = lazyPage(() =>
  import("./components/predictions/TrackRecordPage").then((m) => m.TrackRecordPage),
);
const TvGuidePage = lazyPage(() => import("./components/tv/TvGuidePage").then((m) => m.TvGuidePage));
const TrisPage = lazyPage(() => import("./components/predictions/TrisPage").then((m) => m.TrisPage));
const MarketPredictionsPage = lazyPage(() =>
  import("./components/predictions/MarketPredictionsPage").then((m) => m.MarketPredictionsPage),
);
const NationalHubPage = lazyPage(() =>
  import("./components/predictions/NationalHubPage").then((m) => m.NationalHubPage),
);
const PronosticiPage = lazyPage(() => import("./components/predictions/PronosticiPage").then((m) => m.PronosticiPage));
const StandingsPage = lazyPage(() => import("./components/calcio/StandingsPage").then((m) => m.StandingsPage));
const NotFoundPage = lazyPage(() => import("./components/NotFoundPage").then((m) => m.NotFoundPage));
const TennisPage = lazyPage(() => import("./components/TennisPage").then((m) => m.TennisPage));
const BasketPage = lazyPage(() => import("./components/basket/BasketPage").then((m) => m.BasketPage));
const BasketGamePage = lazyPage(() => import("./components/basket/BasketGamePage").then((m) => m.BasketGamePage));
const BasketStandingsPage = lazyPage(() =>
  import("./components/basket/BasketStandingsPage").then((m) => m.BasketStandingsPage),
);
const TennisRankingPage = lazyPage(() =>
  import("./components/tennis/TennisRankingPage").then((m) => m.TennisRankingPage),
);
const TennisCalendarPage = lazyPage(() =>
  import("./components/tennis/TennisCalendarPage").then((m) => m.TennisCalendarPage),
);
const SitiScommessePage = lazyPage(() => import("./components/SitiScommessePage").then((m) => m.SitiScommessePage));
const BonusPage = lazyPage(() => import("./components/BonusPage").then((m) => m.BonusPage));
const OperatorPage = lazyPage(() => import("./components/OperatorPage").then((m) => m.OperatorPage));
const OfferDetailPage = lazyPage(() => import("./components/OfferDetailPage").then((m) => m.OfferDetailPage));
const GuidesPage = lazyPage(() => import("./components/GuidesPage").then((m) => m.GuidesPage));
const GuideArticlePage = lazyPage(() =>
  import("./components/guides/GuideArticlePage").then((m) => m.GuideArticlePage),
);
const GuideCategoryPage = lazyPage(() =>
  import("./components/guides/GuideCategoryPage").then((m) => m.GuideCategoryPage),
);
const FootballTeamPage = lazyPage(() => import("./components/teams/FootballTeamPage").then((m) => m.FootballTeamPage));
const NbaTeamPage = lazyPage(() => import("./components/teams/NbaTeamPage").then((m) => m.NbaTeamPage));
const TeamsIndexPage = lazyPage(() => import("./components/teams/TeamsIndexPage").then((m) => m.TeamsIndexPage));
const results = () => import("./components/results/ResultsPages");
const FootballResultsPage = lazyPage(() => results().then((m) => m.FootballResultsPage));
const NbaResultsPage = lazyPage(() => results().then((m) => m.NbaResultsPage));
const seasons = () => import("./components/seasons/SeasonPages");
const SeasonsHubPage = lazyPage(() => seasons().then((m) => m.SeasonsHubPage));
const SeasonsIndexPage = lazyPage(() => seasons().then((m) => m.SeasonsIndexPage));
const SeasonPage = lazyPage(() => seasons().then((m) => m.SeasonPage));
const info = () => import("./components/info/InfoPages");
const ChiSiamoPage = lazyPage(() => info().then((m) => m.ChiSiamoPage));
const ContattiPage = lazyPage(() => info().then((m) => m.ContattiPage));
const FaqPage = lazyPage(() => info().then((m) => m.FaqPage));
const MetodologiaPage = lazyPage(() => info().then((m) => m.MetodologiaPage));
const AffiliazionePage = lazyPage(() => info().then((m) => m.AffiliazionePage));
const TerminiPage = lazyPage(() => info().then((m) => m.TerminiPage));
const PrivacyPage = lazyPage(() => info().then((m) => m.PrivacyPage));
const CookiePage = lazyPage(() => info().then((m) => m.CookiePage));

/** Which lazy chunks a URL needs – preloaded before hydration (see main.tsx). */
const PRELOAD: [string, { preload: () => Promise<unknown> }[]][] = [
  ["/", [UpcomingMatches]],
  [paths.calcio, [CalcioPage]],
  ["/calcio/squadre", [TeamsIndexPage]],
  ["/calcio/squadre/:squadra", [FootballTeamPage, NotFoundPage]],
  ["/calcio/giocatori/:giocatore", [PlayerPage, NotFoundPage]],
  ["/basket/nba/giocatori/:giocatore", [NbaPlayerPage, NotFoundPage]],
  ["/basket/nba/squadre", [TeamsIndexPage]],
  ["/basket/nba/squadre/:squadra", [NbaTeamPage, NotFoundPage]],
  ["/calcio/:competizione/risultati", [FootballResultsPage, NotFoundPage]],
  ["/calcio/stagioni", [SeasonsHubPage, NotFoundPage]],
  ["/calcio/:competizione/stagioni", [SeasonsIndexPage, NotFoundPage]],
  ["/calcio/:competizione/stagioni/:stagione", [SeasonPage, NotFoundPage]],
  ["/basket/nba/risultati", [NbaResultsPage]],
  ["/basket/nba/risultati/:mese", [NbaResultsPage, NotFoundPage]],
  ["/calcio/:competizione", [LegacyRedirect, NotFoundPage]],
  ["/calcio/:competizione/classifica", [StandingsPage, NotFoundPage]],
  ["/calcio/:competizione/statistiche-under-over", [GoalStatsPage, NotFoundPage]],
  ["/calcio/:competizione/marcatori", [LeadersPage, NotFoundPage]],
  ["/calcio/:competizione/statistiche-corner-cartellini", [CornersCardsPage, NotFoundPage]],
  ["/calcio/:competizione/giornata/:numero", [LegacyRedirect, NotFoundPage]],
  [paths.pronostici, [PronosticiPage]],
  ["/pronostici/tris", [TrisPage]],
  ["/pronostici/nazionali", [NationalHubPage]],
  ["/pronostici/oggi", [DayPredictionsPage]],
  ["/pronostici/domani", [DayPredictionsPage]],
  ["/pronostici/under-over", [MarketPredictionsPage]],
  ["/pronostici/goal-no-goal", [MarketPredictionsPage]],
  ["/pronostici/multigol", [MarketPredictionsPage]],
  ["/calcio-in-tv-oggi", [TvGuidePage]],
  ["/pronostici/nba", [BasketPage]],
  ["/pronostici/nba/:evento", [BasketEventPage, NotFoundPage]],
  ["/pronostici/:competizione", [CalcioPage, NotFoundPage]],
  ["/pronostici/:competizione/:evento", [PronosticiLeagueChild, NotFoundPage]],
  ["/calcio/:competizione/:partita", [CalcioMatchPage, NotFoundPage]],
  [paths.tennis, [TennisPage]],
  [paths.basket, [BasketPage]],
  ["/tennis/classifica-atp", [TennisRankingPage, NotFoundPage]],
  ["/tennis/classifica-wta", [TennisRankingPage, NotFoundPage]],
  ["/tennis/calendario-atp", [TennisCalendarPage, NotFoundPage]],
  ["/tennis/calendario-wta", [TennisCalendarPage, NotFoundPage]],
  ["/basket/nba", [LegacyRedirect]],
  ["/basket/serie-a/classifica", [BasketStandingsPage, NotFoundPage]],
  ["/basket/nba/:partita", [BasketGamePage, NotFoundPage]],
  [paths.sitiScommesse, [SitiScommessePage]],
  ["/siti-scommesse/:operatore", [OperatorPage, NotFoundPage]],
  [paths.bonus, [BonusPage]],
  ["/bonus/:offerta", [OfferDetailPage, NotFoundPage]],
  [paths.guide, [GuidesPage]],
  ["/guide/categoria/:categoria", [GuideCategoryPage, NotFoundPage]],
  ["/guide/:slug", [GuideArticlePage, NotFoundPage]],
  [paths.chiSiamo, [ChiSiamoPage]],
  [paths.contatti, [ContattiPage]],
  [paths.faq, [FaqPage]],
  [paths.metodologia, [MetodologiaPage]],
  ["/bilancio-pronostici", [TrackRecordPage]],
  [paths.affiliazione, [AffiliazionePage]],
  [paths.termini, [TerminiPage]],
  [paths.privacy, [PrivacyPage]],
  [paths.cookie, [CookiePage]],
];
export function preloadForPath(pathname: string) {
  const clean = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  const hit = PRELOAD.find(([pattern]) => matchPath({ path: pattern, end: true }, clean));
  // team pages also need their league's data (loaded with the team module, kept out of the main bundle)
  const team = /^\/(calcio|basket\/nba)\/squadre\/[^/]+$/.test(clean)
    ? import("./lib/teams").then((m) => m.preloadTeamData(clean))
    : null;
  const results = /^\/(calcio\/[^/]+|basket\/nba)\/risultati(\/[^/]+)?$/.test(clean)
    ? import("./lib/results").then((m) => m.preloadResultsData(clean))
    : null;
  // football pages: the data of their competition (all of them for /calcio)
  const football =
    (/^\/calcio(\/|$)/.test(clean) && !/^\/calcio\/(squadre|giocatori|stagioni)/.test(clean) && !/\/stagioni(\/|$)/.test(clean)) ||
    /^\/pronostici\/(?!nba(\/|$)|oggi$|domani$|tris$)[^/]+/.test(clean)
    ? import("./lib/footballData").then((m) => m.preloadFootballData(clean))
    : null;
  const season = /^\/calcio\/[^/]+\/stagioni\/[^/]+$/.test(clean)
    ? import("./lib/seasons").then((m) => m.preloadSeasonData(clean))
    : null;
  const player = /^\/calcio\/giocatori\/[^/]+$/.test(clean) ? import("./lib/players").then((m) => m.preloadPlayerData(clean)) : null;
  const nbaPlayer = /^\/basket\/nba\/giocatori\/[^/]+$/.test(clean)
    ? import("./lib/nbaPlayers").then((m) => m.preloadNbaPlayerData(clean))
    : null;
  return Promise.all([...(hit ? hit[1] : [NotFoundPage]).map((p) => p.preload()), team, results, season, football, player, nbaPlayer]);
}

function PageLoading() {
  return (
    <div className="container mx-auto px-4 py-24 text-center text-slate-400" role="status">
      Caricamento…
    </div>
  );
}

/** On every navigation: scroll to top and update <title> / meta description. */
function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // go to the #anchor if there is one (e.g. /guide/...#responsabile), otherwise to the top
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    const meta = findStaticRoute(pathname);
    if (!meta) return; // data-driven pages set their own title (usePageMeta)
    document.title = fullTitle(meta);
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  }, [pathname, hash]);
  return null;
}

/** Pages with header, footer and bet slip. */
function SiteLayout() {
  return (
    <BetSlipProvider>
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <BetSlip />
        <AgeGate />
        <ConsentBanner />
      </div>
    </BetSlipProvider>
  );
}

function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <HeroSection />
      <BonusSection onViewAllClick={() => navigate(paths.bonus)} />
      <UpcomingMatches />
      <HowPredictionsWork />
    </>
  );
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path={paths.calcio} element={<CalcioPage />} />
            <Route path="/calcio/squadre" element={<TeamsIndexPage sport="football" />} />
            <Route path="/calcio/squadre/:squadra" element={<FootballTeamPage />} />
            <Route path="/calcio/giocatori/:giocatore" element={<PlayerPage />} />
            <Route path="/basket/nba/squadre" element={<TeamsIndexPage sport="nba" />} />
            <Route path="/basket/nba/squadre/:squadra" element={<NbaTeamPage />} />
            <Route path="/basket/nba/giocatori/:giocatore" element={<NbaPlayerPage />} />
            <Route path="/calcio/:competizione/risultati" element={<FootballResultsPage />} />
            <Route path="/calcio/stagioni" element={<SeasonsHubPage />} />
            <Route path="/calcio/:competizione/stagioni" element={<SeasonsIndexPage />} />
            <Route path="/calcio/:competizione/stagioni/:stagione" element={<SeasonPage />} />
            <Route path="/basket/nba/risultati" element={<NbaResultsPage />} />
            <Route path="/basket/nba/risultati/:mese" element={<NbaResultsPage />} />
            {/* moved URLs (src/lib/legacyUrls.ts) */}
            <Route path="/calcio/:competizione" element={<LegacyRedirect />} />
            <Route path="/calcio/:competizione/giornata/:numero" element={<LegacyRedirect />} />
            <Route path="/basket/nba" element={<LegacyRedirect />} />
            <Route path="/calcio/:competizione/classifica" element={<StandingsPage />} />
            <Route path="/calcio/:competizione/statistiche-under-over" element={<GoalStatsPage />} />
            <Route path="/calcio/:competizione/marcatori" element={<LeadersPage />} />
            <Route path="/calcio/:competizione/statistiche-corner-cartellini" element={<CornersCardsPage />} />
            <Route path={paths.pronostici} element={<PronosticiPage />} />
            <Route path="/pronostici/tris" element={<TrisPage />} />
            <Route path="/pronostici/nazionali" element={<NationalHubPage />} />
            <Route path="/pronostici/oggi" element={<DayPredictionsPage day="oggi" />} />
            <Route path="/pronostici/domani" element={<DayPredictionsPage day="domani" />} />
            <Route path="/pronostici/under-over" element={<MarketPredictionsPage market="under-over" />} />
            <Route path="/pronostici/goal-no-goal" element={<MarketPredictionsPage market="goal-no-goal" />} />
            <Route path="/pronostici/multigol" element={<MarketPredictionsPage market="multigol" />} />
            <Route path="/calcio-in-tv-oggi" element={<TvGuidePage />} />
            <Route path="/pronostici/nba" element={<BasketPage league="nba" />} />
            <Route path="/pronostici/nba/:evento" element={<BasketEventPage />} />
            <Route path="/pronostici/:competizione" element={<CalcioPage />} />
            <Route path="/pronostici/:competizione/:evento" element={<PronosticiLeagueChild />} />
            <Route path="/calcio/:competizione/:partita" element={<CalcioMatchPage />} />
            <Route path={paths.tennis} element={<TennisPage />} />
            <Route path={paths.basket} element={<BasketPage />} />
            <Route path="/basket/serie-a/classifica" element={<BasketStandingsPage />} />
            <Route path="/basket/nba/:partita" element={<BasketGamePage />} />
            <Route path="/tennis/classifica-atp" element={<TennisRankingPage tour="atp" />} />
            <Route path="/tennis/classifica-wta" element={<TennisRankingPage tour="wta" />} />
            <Route path="/tennis/calendario-atp" element={<TennisCalendarPage tour="atp" />} />
            <Route path="/tennis/calendario-wta" element={<TennisCalendarPage tour="wta" />} />
            <Route path={paths.sitiScommesse} element={<SitiScommessePage />} />
            <Route path="/siti-scommesse/:operatore" element={<OperatorPage />} />
            <Route path={paths.bonus} element={<BonusPage />} />
            <Route path="/bonus/:offerta" element={<OfferDetailPage />} />
            <Route path={paths.guide} element={<GuidesPage />} />
            <Route path="/guide/categoria/:categoria" element={<GuideCategoryPage />} />
            <Route path="/guide/:slug" element={<GuideArticlePage />} />
            <Route path={paths.chiSiamo} element={<ChiSiamoPage />} />
            <Route path={paths.contatti} element={<ContattiPage />} />
            <Route path={paths.faq} element={<FaqPage />} />
            <Route path={paths.metodologia} element={<MetodologiaPage />} />
            <Route path="/bilancio-pronostici" element={<TrackRecordPage />} />
            <Route path={paths.affiliazione} element={<AffiliazionePage />} />
            <Route path={paths.termini} element={<TerminiPage />} />
            <Route path={paths.privacy} element={<PrivacyPage />} />
            <Route path={paths.cookie} element={<CookiePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
