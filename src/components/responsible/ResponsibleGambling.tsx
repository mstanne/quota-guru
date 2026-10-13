// Responsible-gambling UI for the Italian market (N3): persistent top bar, footer block and 18+ age gate.
// All references come from `responsibleGambling` in src/data/operators.ts.
import { useEffect, useState } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { responsibleGambling as rg } from "../../data/operators";
import { OperatorLogo } from "../operator/OperatorUi";
import { Button } from "../ui/button";

const admLogo = { logoUrl: rg.admLogoUrl, logoAlt: "Logo ADM – Gioco sicuro e responsabile", name: "ADM" };

/** Slim, always-visible bar at the top of every page. */
export function ResponsibleBar() {
  return (
    <div className="bg-slate-950 border-b border-slate-800 text-[12px] leading-none text-slate-300">
      <div className="container mx-auto px-4 h-7 flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden">
        <span className="inline-flex items-center justify-center rounded-full border border-slate-500 w-5 h-5 text-[9px] font-bold text-white">
          {rg.minAge}+
        </span>
        <span className="hidden sm:inline">Il gioco può causare dipendenza patologica ·</span>
        <span>
          Telefono Verde{" "}
          <a href={rg.helplineHref} className="text-white underline underline-offset-2">
            {rg.helplineNumber}
          </a>
        </span>
      </div>
    </div>
  );
}

/** Footer block with the Italian references and the ADM logo slot. */
export function ResponsibleFooterBlock() {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <span className="inline-flex items-center justify-center rounded-full border-2 border-warn w-10 h-10 text-sm font-bold text-warn">
          {rg.minAge}+
        </span>
        <OperatorLogo operator={admLogo} width={120} height={40} />
      </div>
      <div className="flex-1">
        <h2 className="text-warn text-base mb-2">Gioco responsabile</h2>
        <p className="text-slate-300 text-sm mb-2">
          Il gioco con vincita in denaro è vietato ai minori di {rg.minAge} anni e può causare dipendenza patologica.
          Gli operatori presentati sono concessionari dell'{rg.regulatorName}; le probabilità di vincita sono pubblicate
          sui siti dei concessionari e su{" "}
          <a
            href={rg.regulatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline underline-offset-2"
          >
            adm.gov.it
          </a>
          .
        </p>
        <p className="text-slate-400 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
          <Phone className="w-4 h-4 text-warn" aria-hidden="true" />
          {rg.helplineName} – {rg.helplineOrg}:
          <a href={rg.helplineHref} className="text-white font-semibold underline underline-offset-2">
            {rg.helplineNumber}
          </a>
          <span>(gratuito e anonimo)</span>
        </p>
      </div>
    </div>
  );
}

const AGE_KEY = "qg-age-ok";

/**
 * 18+ confirmation shown on the first visit. Rendered only after mount (never in the pre-rendered HTML),
 * so search engines and hydration are not affected. The answer is remembered in localStorage.
 */
export function AgeGate() {
  const [state, setState] = useState<"hidden" | "ask" | "underage">("hidden");

  useEffect(() => {
    try {
      if (localStorage.getItem(AGE_KEY) !== "1") setState("ask");
    } catch {
      setState("ask");
    }
  }, []);

  if (state === "hidden") return null;
  const confirm = () => {
    try {
      localStorage.setItem(AGE_KEY, "1");
    } catch {
      /* storage not available: ask again next time */
    }
    setState("hidden");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-center"
      >
        <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
        {state === "ask" ? (
          <>
            <h2 id="age-gate-title" className="text-white text-xl mb-2">
              Hai almeno {rg.minAge} anni?
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Questo sito contiene informazioni su giochi con vincita in denaro, vietati ai minori di {rg.minAge} anni.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button autoFocus onClick={confirm} className="bg-action hover:bg-action-hover text-action-foreground">
                Sì, ho almeno {rg.minAge} anni
              </Button>
              <Button
                variant="outline"
                onClick={() => setState("underage")}
                className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                No
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 id="age-gate-title" className="text-white text-xl mb-2">
              Accesso non consentito
            </h2>
            <p className="text-slate-400 text-sm">
              I contenuti di questo sito sono riservati ai maggiorenni. Per informazioni sul gioco responsabile visita{" "}
              <a href={rg.regulatorUrl} className="text-white underline underline-offset-2">
                adm.gov.it
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
