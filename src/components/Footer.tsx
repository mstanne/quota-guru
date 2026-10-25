import { Facebook, Instagram, Mail, Twitter } from "lucide-react";
import { Link } from "../lib/links";
import { BrandLogo } from "./brand/BrandLogo";
import { paths } from "../routes";
import { isFilled, site } from "../data/site";
import { ResponsibleFooterBlock } from "./responsible/ResponsibleGambling";
import { ConsentSettingsLink } from "./privacy/ConsentBanner";

// Only profiles configured in src/data/site.ts are shown (no dead "#" links).
const socialLinks = [
  { href: site.social.facebook, label: "Facebook", Icon: Facebook },
  { href: site.social.x, label: "X (Twitter)", Icon: Twitter },
  { href: site.social.instagram, label: "Instagram", Icon: Instagram },
  { href: isFilled(site.email) ? `mailto:${site.email}` : "", label: "Scrivici una email", Icon: Mail },
].filter((l) => isFilled(l.href));

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <div className="mb-4">
              <BrandLogo height={44} />
            </div>
            <p className="text-slate-400 text-sm">Confronta le quote sportive degli operatori autorizzati</p>
          </div>
          <div>
            <h2 className="text-white text-base mb-4">Sport</h2>
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
              <li>
                <Link to={paths.squadreCalcio} className="text-slate-400 hover:text-white transition-colors">
                  Squadre di calcio
                </Link>
              </li>
              <li>
                <Link to={paths.squadreNba} className="text-slate-400 hover:text-white transition-colors">
                  Squadre NBA
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-white text-base mb-4">Risorse</h2>
            <ul className="space-y-2">
              <li>
                <Link to={paths.sitiScommesse} className="text-slate-400 hover:text-white transition-colors">
                  Siti scommesse
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
            <h2 className="text-white text-base mb-4">Supporto</h2>
            <ul className="space-y-2">
              <li>
                <Link to={paths.contatti} className="text-slate-400 hover:text-white transition-colors">
                  Contatti
                </Link>
              </li>
              <li>
                <Link to={paths.faq} className="text-slate-400 hover:text-white transition-colors">
                  Domande frequenti
                </Link>
              </li>
              <li>
                <Link to={paths.chiSiamo} className="text-slate-400 hover:text-white transition-colors">
                  Chi siamo
                </Link>
              </li>
              <li>
                <Link to={paths.metodologia} className="text-slate-400 hover:text-white transition-colors">
                  Metodologia
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-white text-base mb-4">Note legali</h2>
            <ul className="space-y-2">
              <li>
                <Link to={paths.termini} className="text-slate-400 hover:text-white transition-colors">
                  Termini e condizioni
                </Link>
              </li>
              <li>
                <Link to={paths.privacy} className="text-slate-400 hover:text-white transition-colors">
                  Informativa privacy
                </Link>
              </li>
              <li>
                <Link to={paths.cookie} className="text-slate-400 hover:text-white transition-colors">
                  Cookie policy
                </Link>
              </li>
              <li>
                <Link to={paths.affiliazione} className="text-slate-400 hover:text-white transition-colors">
                  Affiliazione
                </Link>
              </li>
              <li>
                <ConsentSettingsLink className="text-slate-400 hover:text-white transition-colors cursor-pointer" />
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8">
          <ResponsibleFooterBlock />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left space-y-1">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} QuotaGuru. Tutti i diritti riservati.
              </p>
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
            {socialLinks.length > 0 && (
              <ul className="flex items-center gap-2" aria-label="Profili social e contatti">
                {socialLinks.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex size-11 items-center justify-center rounded-md text-slate-400 hover:text-white transition-colors"
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
