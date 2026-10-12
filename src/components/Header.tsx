import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetHeader, SheetContent, SheetTitle } from "./ui/sheet";
import logo from "../assets/logo.png";

interface HeaderProps {
  onMenuClick?: () => void;
  onLoginClick?: () => void;
  onGuidesClick?: () => void;
  onHomeClick?: () => void;
  onFootballClick?: () => void;
  onTennisClick?: () => void;
  onBasketClick?: () => void;
  onSitiScommesseClick?: () => void;
  onBonusClick?: () => void;
}

export function Header({
  onMenuClick,
  onLoginClick,
  onGuidesClick,
  onHomeClick,
  onFootballClick,
  onTennisClick,
  onBasketClick,
  onSitiScommesseClick,
  onBonusClick,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleMobileNav = (action) => {
    setIsMenuOpen(false);
    action && action();
  };
  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={onHomeClick}
                className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={logo} alt="Quota Guru" className="w-10 h-10" />
              </button>
              <nav className="hidden lg:flex items-center gap-6">
                <button
                  onClick={onFootballClick}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Calcio
                </button>
                <button
                  onClick={onTennisClick}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Tennis
                </button>
                <button
                  onClick={onBasketClick}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Basket
                </button>
                <button
                  onClick={onSitiScommesseClick}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Siti Scommesse
                </button>
                <button
                  onClick={onBonusClick}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Bonus
                </button>
                <button
                  onClick={onGuidesClick}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Guide
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                  onClick={onLoginClick}
                >
                  Accedi
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer"
                  onClick={onLoginClick}
                >
                  Registrati
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-300 cursor-pointer"
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
          <div className="mt-8 space-y-1">
            <button
              onClick={() => handleMobileNav(onFootballClick)}
              className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              ⚽ Calcio
            </button>
            <button
              onClick={() => handleMobileNav(onTennisClick)}
              className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              🎾 Tennis
            </button>
            <button
              onClick={() => handleMobileNav(onBasketClick)}
              className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              🏀 Basket
            </button>
            <button
              onClick={() => handleMobileNav(onSitiScommesseClick)}
              className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              🛡️ Siti Scommesse
            </button>
            <button
              onClick={() => handleMobileNav(onBonusClick)}
              className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              🎁 Bonus
            </button>
            <button
              onClick={() => handleMobileNav(onGuidesClick)}
              className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              📚 Guide
            </button>
            <div className="h-px bg-slate-800 my-4" />
            <div className="space-y-2 px-4">
              <Button
                variant="outline"
                className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                onClick={() => handleMobileNav(onLoginClick)}
              >
                Accedi
              </Button>
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer"
                onClick={() => handleMobileNav(onLoginClick)}
              >
                Registrati
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
