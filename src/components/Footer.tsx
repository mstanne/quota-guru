import { Facebook, Instagram, Mail, Twitter } from "lucide-react";
import { Link } from "react-router";
import logo from "../assets/logo.png";
import { paths } from "../routes";

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="" className="w-10 h-10" />
              <span className="text-white text-xl">Quota Guru</span>
            </div>
            <p className="text-slate-400 text-sm">Confronta le migliori quote sportive in tempo reale</p>
          </div>
          <div>
            <h3 className="text-white mb-4">Sport</h3>
            <ul className="space-y-2">
              <li>
                <Link to={paths.calcio} className="text-slate-400 hover:text-white transition-colors">
                  Calcio
                </Link>
              </li>
              <li>
                <Link to={paths.tennis} className="text-slate-400 hover:text-white transition-colors">
                  Tennis
                </Link>
              </li>
              <li>
                <Link to={paths.basket} className="text-slate-400 hover:text-white transition-colors">
                  Basket
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white mb-4">Risorse</h3>
            <ul className="space-y-2">
              <li>
                <Link to={paths.sitiScommesse} className="text-slate-400 hover:text-white transition-colors">
                  Siti Scommesse
                </Link>
              </li>
              <li>
                <Link to={paths.bonus} className="text-slate-400 hover:text-white transition-colors">
                  Bonus
                </Link>
              </li>
              <li>
                <Link to={paths.guide} className="text-slate-400 hover:text-white transition-colors">
                  Guide
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white mb-4">Supporto</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Contatti
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Termini e Condizioni
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <h4 className="text-orange-500 mb-2">⚠️ Gioco Responsabile</h4>
            <p className="text-slate-400 text-sm">
              Il gioco può causare dipendenza. Gioca responsabilmente. Vietato ai minori di 18 anni. Le quote possono
              variare. Verifica sempre sui siti ufficiali degli operatori.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left space-y-1">
              <p className="text-slate-500 text-sm">© 2024 Quota Guru. Tutti i diritti riservati.</p>
              {/* Required by the football-data.org terms of use (section 7, Attribution) – do not remove. */}
              <p className="text-slate-400 text-sm">
                Football data provided by the{" "}
                <a
                  href="https://www.football-data.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-white transition-colors"
                >
                  Football-Data.org
                </a>{" "}
                API
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
