import { Suspense, useEffect } from "react";
import { matchPath, Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import { BetSlipProvider } from "./context/BetSlipContext";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
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
const StandingsPage = lazyPage(() => import("./components/calcio/StandingsPage").then((m) => m.StandingsPage));
const NotFoundPage = lazyPage(() => import("./components/NotFoundPage").then((m) => m.NotFoundPage));
const TennisPage = lazyPage(() => import("./components/TennisPage").then((m) => m.TennisPage));
const BasketPage = lazyPage(() => import("./components/basket/BasketPage").then((m) => m.BasketPage));
const BasketGamePage = lazyPage(() => import("./components/basket/BasketGamePage").then((m) => m.BasketGamePage));
const BasketStandingsPage = lazyPage(() =>
  import("./components/basket/BasketStandingsPage").then((m) => m.BasketStandingsPage),
);
const TennisEventDetail = lazyPage(() => import("./components/TennisEventDetail").then((m) => m.TennisEventDetail));
const SitiScommessePage = lazyPage(() => import("./components/SitiScommessePage").then((m) => m.SitiScommessePage));
const BonusPage = lazyPage(() => import("./components/BonusPage").then((m) => m.BonusPage));
const GuidesPage = lazyPage(() => import("./components/GuidesPage").then((m) => m.GuidesPage));
const GuideArticlePage = lazyPage(() =>
  import("./components/guides/GuideArticlePage").then((m) => m.GuideArticlePage),
);
const GuideCategoryPage = lazyPage(() =>
  import("./components/guides/GuideCategoryPage").then((m) => m.GuideCategoryPage),
);
const LoginPage = lazyPage(() => import("./components/LoginPage").then((m) => m.LoginPage));
const RegisterPage = lazyPage(() => import("./components/RegisterPage").then((m) => m.RegisterPage));
const info = () => import("./components/info/InfoPages");
const ChiSiamoPage = lazyPage(() => info().then((m) => m.ChiSiamoPage));
const ContattiPage = lazyPage(() => info().then((m) => m.ContattiPage));
const FaqPage = lazyPage(() => info().then((m) => m.FaqPage));
const MetodologiaPage = lazyPage(() => info().then((m) => m.MetodologiaPage));
const AffiliazionePage = lazyPage(() => info().then((m) => m.AffiliazionePage));
const TerminiPage = lazyPage(() => info().then((m) => m.TerminiPage));
const PrivacyPage = lazyPage(() => info().then((m) => m.PrivacyPage));
const CookiePage = lazyPage(() => info().then((m) => m.CookiePage));
const ForgotPasswordPage = lazyPage(() => import("./components/ForgotPasswordPage").then((m) => m.ForgotPasswordPage));

/** Which lazy chunks a URL needs – preloaded before hydration (see main.tsx). */
const PRELOAD: [string, { preload: () => Promise<unknown> }[]][] = [
  ["/", [UpcomingMatches]],
  [paths.accedi, [LoginPage]],
  [paths.registrati, [RegisterPage]],
  [paths.passwordDimenticata, [ForgotPasswordPage]],
  [paths.calcio, [CalcioPage]],
  ["/calcio/:competizione", [CalcioPage, NotFoundPage]],
  ["/calcio/:competizione/classifica", [StandingsPage, NotFoundPage]],
  ["/calcio/:competizione/:partita", [CalcioMatchPage, NotFoundPage]],
  [paths.tennis, [TennisPage]],
  [paths.basket, [BasketPage]],
  [paths.tennisEvento, [TennisEventDetail]],
  ["/basket/nba", [BasketPage]],
  ["/basket/serie-a/classifica", [BasketStandingsPage, NotFoundPage]],
  ["/basket/nba/:partita", [BasketGamePage, NotFoundPage]],
  [paths.sitiScommesse, [SitiScommessePage]],
  [paths.bonus, [BonusPage]],
  [paths.guide, [GuidesPage]],
  ["/guide/categoria/:categoria", [GuideCategoryPage, NotFoundPage]],
  ["/guide/:slug", [GuideArticlePage, NotFoundPage]],
  [paths.chiSiamo, [ChiSiamoPage]],
  [paths.contatti, [ContattiPage]],
  [paths.faq, [FaqPage]],
  [paths.metodologia, [MetodologiaPage]],
  [paths.affiliazione, [AffiliazionePage]],
  [paths.termini, [TerminiPage]],
  [paths.privacy, [PrivacyPage]],
  [paths.cookie, [CookiePage]],
];
export function preloadForPath(pathname: string) {
  const clean = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  const hit = PRELOAD.find(([pattern]) => matchPath({ path: pattern, end: true }, clean));
  return Promise.all((hit ? hit[1] : [NotFoundPage]).map((p) => p.preload()));
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
      <UpcomingMatches />
      <BonusSection onViewAllClick={() => navigate(paths.bonus)} />
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const go = (to: string) => () => navigate(to);

  return (
    <>
      <RouteEffects />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Full-screen pages without header/footer (currently hidden from the navigation) */}
          <Route
            path={paths.accedi}
            element={
              <LoginPage
                onForgotPassword={go(paths.passwordDimenticata)}
                onRegister={go(paths.registrati)}
                onBack={go(paths.home)}
              />
            }
          />
          <Route
            path={paths.registrati}
            element={<RegisterPage onLogin={go(paths.accedi)} onBack={go(paths.home)} />}
          />
          <Route
            path={paths.passwordDimenticata}
            element={<ForgotPasswordPage onLogin={go(paths.accedi)} onBack={go(paths.home)} />}
          />

          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path={paths.calcio} element={<CalcioPage />} />
            <Route path="/calcio/:competizione" element={<CalcioPage />} />
            <Route path="/calcio/:competizione/classifica" element={<StandingsPage />} />
            <Route path="/calcio/:competizione/:partita" element={<CalcioMatchPage />} />
            <Route path={paths.tennis} element={<TennisPage onMatchClick={go(paths.tennisEvento)} />} />
            <Route path={paths.basket} element={<BasketPage />} />
            <Route path="/basket/nba" element={<BasketPage league="nba" />} />
            <Route path="/basket/serie-a/classifica" element={<BasketStandingsPage />} />
            <Route path="/basket/nba/:partita" element={<BasketGamePage />} />
            <Route path={paths.tennisEvento} element={<TennisEventDetail onBack={go(paths.tennis)} />} />
            <Route path={paths.sitiScommesse} element={<SitiScommessePage />} />
            <Route path={paths.bonus} element={<BonusPage />} />
            <Route path={paths.guide} element={<GuidesPage />} />
            <Route path="/guide/categoria/:categoria" element={<GuideCategoryPage />} />
            <Route path="/guide/:slug" element={<GuideArticlePage />} />
            <Route path={paths.chiSiamo} element={<ChiSiamoPage />} />
            <Route path={paths.contatti} element={<ContattiPage />} />
            <Route path={paths.faq} element={<FaqPage />} />
            <Route path={paths.metodologia} element={<MetodologiaPage />} />
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
