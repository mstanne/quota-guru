import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChartColumn,
  CircleDot,
  Dribbble,
  Gift,
  Goal,
  ListPlus,
  Menu,
  Phone,
  Send,
  Shield,
} from "lucide-react";
import { useBetSlip } from "../context/BetSlipContext";
import { Link, NavLink } from "../lib/links";
import { isFilled, site } from "../data/site";
import { Button } from "./ui/button";
import { Sheet, SheetHeader, SheetContent, SheetTitle } from "./ui/sheet";
import { BrandLogo } from "./brand/BrandLogo";
import { paths } from "../routes";
import { ResponsibleBar } from "./responsible/ResponsibleGambling";
import { methodMenu, sitiMenu } from "./siti/topicMenu";


const NAV = [
  { to: paths.pronostici, label: "Pronostici", icon: ChartColumn },
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
  const { selections, openBetSlip } = useBetSlip();
  const closeMenu = () => setIsMenuOpen(false);
  // height of the sticky header as a CSS variable (--header-h): toolbars that stick under it use it as `top`
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      <header ref={ref} className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
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
                {NAV.map((item) =>
                  item.to === paths.sitiScommesse ? (
                    <SitiMenuDesktop key={item.to} label={item.label} />
                  ) : (
                    <NavLink key={item.to} to={item.to} className={desktopLink}>
                      {item.label}
                    </NavLink>
                  ),
                )}
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
            {NAV.map((item) =>
              item.to === paths.sitiScommesse ? (
                <SitiMenuMobile key={item.to} label={item.label} icon={item.icon} onNavigate={closeMenu} />
              ) : (
                <NavLink key={item.to} to={item.to} className={mobileLink} onClick={closeMenu}>
                  <item.icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          {/* shortcuts: today's and tomorrow's predictions, the Telegram channel, the slip, the helpline */}
          <div className="mt-6 pt-6 border-t border-slate-800 px-4 space-y-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Scorciatoie</p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/pronostici/oggi"
                  onClick={closeMenu}
                  className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md bg-slate-800 border border-slate-700 text-white text-sm hover:border-slate-500"
                >
                  <CalendarDays className="w-4 h-4 text-slate-300" aria-hidden="true" />
                  Oggi
                </Link>
                <Link
                  to="/pronostici/domani"
                  onClick={closeMenu}
                  className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md bg-slate-800 border border-slate-700 text-white text-sm hover:border-slate-500"
                >
                  <CalendarDays className="w-4 h-4 text-slate-300" aria-hidden="true" />
                  Domani
                </Link>
                {isFilled(site.social.telegram) && (
                  <a
                    href={site.social.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="col-span-2 inline-flex items-center gap-2 px-3 py-2.5 rounded-md bg-slate-800 border border-slate-700 text-white text-sm hover:border-slate-500"
                  >
                    <Send className="w-4 h-4 text-slate-300" aria-hidden="true" />
                    Canale Telegram
                  </a>
                )}
              </div>
              {selections.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    openBetSlip();
                  }}
                  className="mt-2 w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-md border border-action/50 text-white text-sm hover:border-action cursor-pointer"
                >
                  <ListPlus className="w-4 h-4 text-action" aria-hidden="true" />
                  Apri la schedina ({selections.length} {selections.length === 1 ? "esito" : "esiti"})
                </button>
              )}
            </div>
            <a
              href="tel:800558822"
              className="flex items-start gap-2 text-slate-300 text-sm hover:text-white"
            >
              <Phone className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                Telefono Verde gioco d'azzardo <span className="text-white underline">800 558 822</span>
                <span className="block text-slate-400 text-xs">Gratuito e anonimo · vietato ai minori di 18 anni</span>
              </span>
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * "Siti scommesse" with a dropdown of the thematic comparisons (icon tiles) and the payment methods.
 * Opens on hover and when the link gets keyboard focus; closes on Escape, on leaving and on navigation.
 * The panel is always in the HTML (hidden when closed), so its links are in the pre-rendered pages too.
 */
function SitiMenuDesktop({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  };
  return (
    <div
      className="flex items-center gap-1 self-stretch"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <NavLink to={paths.sitiScommesse} className={desktopLink}>
        {label}
      </NavLink>
      <div
        id="menu-siti-scommesse"
        hidden={!open}
        className="absolute left-0 right-0 top-full bg-slate-900 border-y border-slate-700 shadow-2xl shadow-black/40"
      >
        <div className="container mx-auto px-4 py-6">
          <ul className="grid grid-cols-4 xl:grid-cols-7 gap-3">
            {sitiMenu.map((i) => (
              <li key={i.to}>
                <NavLink
                  to={i.to}
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex h-full flex-col items-center gap-2 rounded-lg border px-3 py-4 text-center text-sm transition-colors ${
                      isActive
                        ? "border-selected bg-slate-800 text-white"
                        : "border-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <i.icon className="w-8 h-8 text-slate-300" strokeWidth={1.5} aria-hidden="true" />
                  {i.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="text-slate-400">Per metodo di pagamento:</span>
            {methodMenu.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? "text-white" : "text-slate-300 hover:text-white")}
              >
                {m.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile menu: "Siti scommesse" with an expandable list of the comparisons. */
function SitiMenuMobile({
  label,
  icon: Icon,
  onNavigate,
}: {
  label: string;
  icon: (typeof NAV)[number]["icon"];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center">
        <NavLink to={paths.sitiScommesse} end className={(s) => `${mobileLink(s)} flex-1`} onClick={onNavigate}>
          <Icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
          {label}
        </NavLink>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-mobile-siti"
          aria-label={open ? "Chiudi i confronti tra siti scommesse" : "Apri i confronti tra siti scommesse"}
          onClick={() => setOpen((v) => !v)}
          className="size-11 shrink-0 inline-flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>
      <div id="menu-mobile-siti" hidden={!open} className="pl-4">
        <ul className="grid grid-cols-2 gap-2 py-2">
          {sitiMenu.slice(1).map((i) => (
            <li key={i.to}>
              <NavLink
                to={i.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2 h-full rounded-md border px-3 py-2.5 text-sm ${
                    isActive ? "border-selected text-white" : "border-slate-700 text-slate-300 hover:text-white"
                  }`
                }
              >
                <i.icon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                {i.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="text-slate-400 text-xs mt-2 mb-1">Per metodo di pagamento</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-2 text-sm">
          {methodMenu.map((m) => (
            <li key={m.to}>
              <NavLink to={m.to} onClick={onNavigate} className="inline-block py-1 text-slate-300 hover:text-white">
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
