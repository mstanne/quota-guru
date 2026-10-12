import { useEffect } from "react";
import { Link, Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import { BetSlipProvider } from "./context/BetSlipContext";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { LiveOddsTable } from "./components/LiveOddsTable";
import { BonusSection } from "./components/BonusSection";
import { FootballEventDetail } from "./components/FootballEventDetail";
import { BasketEventDetail } from "./components/BasketEventDetail";
import { TennisEventDetail } from "./components/TennisEventDetail";
import { Footer } from "./components/Footer";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { GuidesPage } from "./components/GuidesPage";
import { GuideDetailPage } from "./components/GuideDetailPage";
import { BonusPage } from "./components/BonusPage";
import { FootballPage } from "./components/FootballPage";
import { TennisPage } from "./components/TennisPage";
import { BasketPage } from "./components/BasketPage";
import { SitiScommessePage } from "./components/SitiScommessePage";
import { BetSlip } from "./components/BetSlip";
import { Button } from "./components/ui/button";
import { findRoute, fullTitle, paths } from "./routes";

/** On every navigation: scroll to top and update <title> / meta description. */
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const meta = findRoute(pathname);
    document.title = fullTitle(meta);
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  }, [pathname]);
  return null;
}

/** Pages with header, footer and bet slip. */
function SiteLayout() {
  return (
    <BetSlipProvider>
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
        <BetSlip />
      </div>
    </BetSlipProvider>
  );
}

function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <HeroSection />
      <LiveOddsTable onMatchClick={() => navigate(paths.calcioEvento)} />
      <BonusSection onViewAllClick={() => navigate(paths.bonus)} />
    </>
  );
}

function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="text-green-500 text-6xl mb-4">404</p>
      <h1 className="text-white text-3xl mb-3">Pagina non trovata</h1>
      <p className="text-slate-400 mb-8">La pagina che cerchi non esiste o è stata spostata.</p>
      <Button asChild className="bg-green-500 hover:bg-green-600 text-slate-950">
        <Link to={paths.home}>Torna alla home</Link>
      </Button>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const go = (to: string) => () => navigate(to);

  return (
    <>
      <RouteEffects />
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
        <Route path={paths.registrati} element={<RegisterPage onLogin={go(paths.accedi)} onBack={go(paths.home)} />} />
        <Route
          path={paths.passwordDimenticata}
          element={<ForgotPasswordPage onLogin={go(paths.accedi)} onBack={go(paths.home)} />}
        />

        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path={paths.calcio} element={<FootballPage onMatchClick={go(paths.calcioEvento)} />} />
          <Route path={paths.tennis} element={<TennisPage onMatchClick={go(paths.tennisEvento)} />} />
          <Route path={paths.basket} element={<BasketPage onMatchClick={go(paths.basketEvento)} />} />
          <Route path={paths.calcioEvento} element={<FootballEventDetail onBack={go(paths.calcio)} />} />
          <Route path={paths.tennisEvento} element={<TennisEventDetail onBack={go(paths.tennis)} />} />
          <Route path={paths.basketEvento} element={<BasketEventDetail onBack={go(paths.basket)} />} />
          <Route path={paths.sitiScommesse} element={<SitiScommessePage />} />
          <Route path={paths.bonus} element={<BonusPage />} />
          <Route path={paths.guide} element={<GuidesPage onGuideClick={go(paths.guidaDettaglio)} />} />
          <Route path={paths.guidaDettaglio} element={<GuideDetailPage onBack={go(paths.guide)} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
