import { useState } from "react";
import { BookOpen, CircleDot, Dribbble, Gift, Goal, Menu, Shield } from "lucide-react";
import { Link, NavLink } from "../lib/links";
import { Button } from "./ui/button";
import { Sheet, SheetHeader, SheetContent, SheetTitle } from "./ui/sheet";
import { BrandLogo } from "./brand/BrandLogo";
import { paths } from "../routes";
import { ResponsibleBar } from "./responsible/ResponsibleGambling";


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
                aria-label="QuotaGuru – Home"
                className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <BrandLogo height={44} alt="" />
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
            <SheetTitle className="flex items-center">
              <BrandLogo height={36} />
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Menu mobile" className="mt-8 space-y-1">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={mobileLink} onClick={closeMenu}>
                <item.icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
