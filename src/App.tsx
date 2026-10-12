import { useState } from "react";
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

export type Page =
  | "home"
  | "event-detail"
  | "login"
  | "register"
  | "forgot-password"
  | "guides"
  | "guide-detail"
  | "bonus"
  | "football"
  | "tennis"
  | "basket"
  | "siti-scommesse";

export type Sport = "football" | "tennis" | "basket";

/**
 * Single-page app with state-based navigation (same behaviour as the Figma Make prototype).
 * Login / Register / Forgot password are full-screen pages without header and footer.
 */
export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [eventSport, setEventSport] = useState<Sport>("football");

  const go = (page: Page) => () => setCurrentPage(page);

  const handleMatchClick = (_matchId: string, sport: Sport = "football") => {
    setCurrentPage("event-detail");
    setEventSport(sport);
  };

  if (currentPage === "login") {
    return <LoginPage onForgotPassword={go("forgot-password")} onRegister={go("register")} onBack={go("home")} />;
  }
  if (currentPage === "register") {
    return <RegisterPage onLogin={go("login")} onBack={go("home")} />;
  }
  if (currentPage === "forgot-password") {
    return <ForgotPasswordPage onLogin={go("login")} onBack={go("home")} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <>
            <HeroSection />
            <LiveOddsTable onMatchClick={(id) => handleMatchClick(id, "football")} />
            <BonusSection onViewAllClick={go("bonus")} />
          </>
        );
      case "event-detail":
        return (
          <>
            {eventSport === "football" && <FootballEventDetail onBack={go("home")} />}
            {eventSport === "basket" && <BasketEventDetail onBack={go("home")} />}
            {eventSport === "tennis" && <TennisEventDetail onBack={go("home")} />}
          </>
        );
      case "guides":
        return <GuidesPage onGuideClick={go("guide-detail")} />;
      case "guide-detail":
        return <GuideDetailPage onBack={go("guides")} />;
      case "bonus":
        return <BonusPage />;
      case "football":
        return <FootballPage onMatchClick={(id) => handleMatchClick(id, "football")} />;
      case "tennis":
        return <TennisPage onMatchClick={(id) => handleMatchClick(id, "tennis")} />;
      case "basket":
        return <BasketPage onMatchClick={(id) => handleMatchClick(id, "basket")} />;
      case "siti-scommesse":
        return <SitiScommessePage />;
      default:
        return null;
    }
  };

  return (
    <BetSlipProvider>
      <div className="min-h-screen bg-slate-950">
        <Header
          onLoginClick={go("login")}
          onGuidesClick={go("guides")}
          onHomeClick={go("home")}
          onFootballClick={go("football")}
          onTennisClick={go("tennis")}
          onBasketClick={go("basket")}
          onSitiScommesseClick={go("siti-scommesse")}
          onBonusClick={go("bonus")}
        />
        {renderPage()}
        <Footer />
        <BetSlip />
      </div>
    </BetSlipProvider>
  );
}
