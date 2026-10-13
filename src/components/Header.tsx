import { useState } from "react";
import { BookOpen, CircleDot, Dribbble, Gift, Goal, Menu, Shield } from "lucide-react";
import { Link, NavLink } from "react-router";
import { Button } from "./ui/button";
import { Sheet, SheetHeader, SheetContent, SheetTitle } from "./ui/sheet";
import logo from "../assets/logo.png";
import { paths } from "../routes";
import { ResponsibleBar } from "./responsible/ResponsibleGambling";

// Login/registrazione temporaneamente nascosti: metti true per mostrare di nuovo "Accedi" e "Registrati".
const SHOW_AUTH = false;

const NAV = [
  { to: paths.calcio, label: "Calcio", icon: Goal },
  { to: paths.tennis, label: "Tennis", icon: CircleDot },
  { to: paths.basket, label: "Basket", icon: Dribbble },
  { to: paths.sitiScommesse, label: "Siti scommesse", icon: Shield },
  { to: paths.bonus, label: "Bonus", icon: Gift },
  { to: paths.guide, label: "Guide", icon: BookOpen },
];

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `transition-colors cursor-pointer ${isActive ? "text-white" : "text-slate-300 hover:text-white"}`;
const mobileLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 w-full text-left px-4 py-3 min-h-11 rounded-md transition-colors cursor-pointer ${
    isActive ? "text-white bg-slate-800" : "text-slate-300 hover:text-white hover:bg-slate-800"
  }`;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <ResponsibleBar />
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                to={paths.home}
                aria-label="Quota Guru – Home"
                className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={logo} alt="Quota Guru" className="w-10 h-10" />
              </Link>
              <nav aria-label="Principale" className="hidden lg:flex items-center gap-6">
                {NAV.map((item) => (
                  <NavLink key={item.to} to={item.to} className={desktopLink}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {SHOW_AUTH && (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <Link to={paths.accedi}>Accedi</Link>
                  </Button>
                  <Button asChild className="bg-action hover:bg-action-hover text-action-foreground cursor-pointer">
                    <Link to={paths.registrati}>Registrati</Link>
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Apri il menu"
                className="lg:hidden size-11 text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className="bg-slate-900 border-slate-800 w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <img src={logo} alt="Quota Guru" className="w-10 h-10" />
              <span className="text-white">Quota Guru</span>
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Menu mobile" className="mt-8 space-y-1">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={mobileLink} onClick={closeMenu}>
                <item.icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            {SHOW_AUTH && (
              <>
                <div className="h-px bg-slate-800 my-4" />
                <div className="space-y-2 px-4">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  >
                    <Link to={paths.accedi} onClick={closeMenu}>
                      Accedi
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-action hover:bg-action-hover text-action-foreground cursor-pointer"
                  >
                    <Link to={paths.registrati} onClick={closeMenu}>
                      Registrati
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
