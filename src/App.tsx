import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import { BetSlipProvider } from "./context/BetSlipContext";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { UpcomingMatches } from "./components/calcio/UpcomingMatches";
import { CalcioPage } from "./components/calcio/CalcioPage";
import { CalcioMatchPage } from "./components/calcio/CalcioMatchPage";
import { StandingsPage } from "./components/calcio/StandingsPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { BonusSection } from "./components/BonusSection";
import { BasketEventDetail } from "./components/BasketEventDetail";
import { TennisEventDetail } from "./components/TennisEventDetail";
import { Footer } from "./components/Footer";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { GuidesPage } from "./components/GuidesPage";
import { GuideDetailPage } from "./components/GuideDetailPage";
import { BonusPage } from "./components/BonusPage";
import { TennisPage } from "./components/TennisPage";
import { BasketPage } from "./components/BasketPage";
import { SitiScommessePage } from "./components/SitiScommessePage";
import { BetSlip } from "./components/BetSlip";
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
          <Route path={paths.calcio} element={<CalcioPage />} />
          <Route path="/calcio/:competizione" element={<CalcioPage />} />
          <Route path="/calcio/:competizione/classifica" element={<StandingsPage />} />
          <Route path="/calcio/:competizione/:partita" element={<CalcioMatchPage />} />
          <Route path={paths.tennis} element={<TennisPage onMatchClick={go(paths.tennisEvento)} />} />
          <Route path={paths.basket} element={<BasketPage onMatchClick={go(paths.basketEvento)} />} />
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
