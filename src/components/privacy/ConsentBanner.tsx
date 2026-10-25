// T2: cookie/statistics consent banner. Shown only when an analytics provider is configured
// and the visitor has not chosen yet; rendered after mount so it never appears in pre-rendered HTML.
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { analyticsConfigured, getConsent, initAnalytics, onConsentOpen, setConsent } from "../../lib/analytics";

// Defaults to the site's own cookie page (/cookie), under the configured base path.
const POLICY_URL = import.meta.env.VITE_COOKIE_POLICY_URL || `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}cookie`;
const policyIsPlaceholder = /^\[.*\]$/.test(POLICY_URL);

export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!analyticsConfigured) return;
    initAnalytics();
    if (getConsent() === null) setOpen(true);
    return onConsentOpen(() => setOpen(true));
  }, []);

  if (!open) return null;
  const choose = (v: "granted" | "denied") => {
    setConsent(v);
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Preferenze cookie"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-slate-300 text-sm flex-1">
          Usiamo cookie tecnici necessari al funzionamento del sito e, solo con il tuo consenso, strumenti di statistica
          per capire quali pagine e quali confronti sono utili. Nessun dato viene usato per pubblicità.{" "}
          <a
            href={policyIsPlaceholder ? undefined : POLICY_URL}
            title={policyIsPlaceholder ? POLICY_URL : undefined}
            className="text-white underline underline-offset-2"
          >
            Cookie policy
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => choose("denied")}
            className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            Rifiuta
          </Button>
          <Button onClick={() => choose("granted")} className="bg-action hover:bg-action-hover text-action-foreground">
            Accetta statistiche
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Footer link to change the choice later (rendered only when analytics is configured). */
export function ConsentSettingsLink({ className }: { className?: string }) {
  if (!analyticsConfigured) return null;
  return (
    <button
      type="button"
      onClick={() => import("../../lib/analytics").then((m) => m.openConsentSettings())}
      className={className}
    >
      Preferenze cookie
    </button>
  );
}
