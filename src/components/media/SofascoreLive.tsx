// SofaScore live widgets (line-ups with ratings, attack momentum) on football match pages, from shortly before
// kick-off until a few hours after it. Like the YouTube highlights, nothing is loaded from SofaScore until the
// reader asks for it: the widgets set analytics cookies (Google Analytics, Firebase). The choice can be
// remembered on this browser. Rendered only in the browser (time-dependent), never in the pre-rendered HTML.
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Link } from "../../lib/links";
import { paths } from "../../routes";
import { inLiveWindow } from "../../lib/sofascore";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const REMEMBER_KEY = "qg-sofascore-auto";

function readRemember(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}
function writeRemember(on: boolean) {
  try {
    if (on) localStorage.setItem(REMEMBER_KEY, "1");
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* storage blocked: the choice is simply not remembered */
  }
}

export function SofascoreLive({ eventId, utcDate, teams }: { eventId: number; utcDate: string; teams: string }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const check = () => setVisible(inLiveWindow(utcDate));
    check();
    if (readRemember()) {
      setRemember(true);
      setOpen(true);
    }
    const t = window.setInterval(check, 60_000);
    return () => window.clearInterval(t);
  }, [utcDate]);

  if (!visible) return null;

  const base = "https://widgets.sofascore.com/it/embed";
  const query = `id=${eventId}&widgetTheme=dark`;

  return (
    <section className={`${card} lg:col-span-3`} aria-labelledby="sofascore-live">
      <h2 id="sofascore-live" className="flex items-center gap-2 text-white text-xl mb-4">
        <Activity className="w-5 h-5 text-slate-300" aria-hidden="true" />
        Formazioni e andamento live
      </h2>
      {open ? (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="min-w-0 space-y-2">
            <h3 className="text-slate-300 text-sm">Andamento della partita (attack momentum)</h3>
            <div className="overflow-hidden rounded-lg" style={{ height: 180 }}>
              <iframe
                src={`${base}/attackMomentum?${query}`}
                title={`Andamento live ${teams} (SofaScore)`}
                className="w-full border-0"
                style={{ height: 286 }}
                loading="lazy"
                scrolling="no"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <h3 className="text-slate-300 text-sm">Formazioni, voti e sostituzioni</h3>
            <iframe
              src={`${base}/lineups?${query}`}
              title={`Formazioni ${teams} (SofaScore)`}
              className="w-full border-0 rounded-lg"
              style={{ height: 786 }}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-slate-300 text-sm flex-1">
            Formazioni ufficiali con i voti, sostituzioni e grafico dell'andamento, aggiornati durante la partita da
            SofaScore.
          </p>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (remember) writeRemember(true);
                setOpen(true);
              }}
              className="px-4 py-2 rounded-md bg-action hover:bg-action-hover text-action-foreground focus-visible:outline-2"
            >
              Mostra i dati live
            </button>
            <label className="flex items-center gap-2 text-slate-400 text-xs cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Mostra sempre senza chiedere
            </label>
          </div>
        </div>
      )}
      <p className="text-slate-400 text-xs mt-3">
        Dati e widget di SofaScore. Con il clic i contenuti vengono caricati da SofaScore, che usa cookie di
        statistica: vedi la <Link to={paths.cookie}>cookie policy</Link>.
        {open && remember && (
          <>
            {" · "}
            <button
              type="button"
              onClick={() => {
                writeRemember(false);
                setRemember(false);
                setOpen(false);
              }}
              className="text-action-text hover:text-action-text-hover underline-offset-2 hover:underline"
            >
              Non caricare più in automatico
            </button>
          </>
        )}
      </p>
    </section>
  );
}
