import { Facebook, Instagram, Mail, Twitter } from "lucide-react";
import logo from "../assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Quota Guru" className="w-10 h-10" />
              <span className="text-white text-xl">Quota Guru</span>
            </div>
            <p className="text-slate-400 text-sm">Confronta le migliori quote sportive in tempo reale</p>
          </div>
          <div>
            <h3 className="text-white mb-4">Sport</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Calcio
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Tennis
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Basket
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white mb-4">Risorse</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Siti Scommesse
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Bonus
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Guide
                </a>
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
            <p className="text-slate-500 text-sm">© 2024 Quota Guru. Tutti i diritti riservati.</p>
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
