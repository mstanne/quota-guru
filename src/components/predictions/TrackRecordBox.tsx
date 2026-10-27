// Transparent track record: share of correct "most likely outcome" calls, last 30 days and the last 10
// predictions, wins and misses alike. No ROI or yield: the site has no bookmaker odds to compute them honestly.
import { Link } from "../../lib/links";
import { Check, ShieldCheck, X as XIcon } from "lucide-react";
import { paths } from "../../routes";
import { formatShortDate } from "../../lib/footballCore";
import { pct } from "../../lib/predictionsCore";
import type { TrackRecord } from "../../lib/trackRecord";

const rate = (x: { n: number; hits: number }) => (x.n ? Math.round((x.hits / x.n) * 100) : 0);

export function TrackRecordBox({
  record,
  sport,
  className = "",
}: {
  record: TrackRecord;
  sport: "calcio" | "nba";
  className?: string;
}) {
  if (record.all.n < 10) return null;
  const outcomes = sport === "calcio" ? "tre esiti possibili (1, X, 2)" : "due esiti possibili";
  const chance = sport === "calcio" ? "1 volta su 3" : "1 volta su 2";
  const anchor = sport === "calcio" ? "pronostici" : "pronostici-basket";
  const id = `track-${sport}`;
  return (
    <section
      aria-labelledby={id}
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div>
          <h2 id={id} className="flex items-center gap-2 text-white text-lg mb-1">
            <ShieldCheck className="w-5 h-5 text-slate-300" aria-hidden="true" />
            Come sono andati i pronostici {sport === "calcio" ? "del calcio" : "NBA"}
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Quante volte l'esito indicato come più probabile si è verificato. Contano tutte le partite giocate, anche
            quelle sbagliate. Con {outcomes}, tirare a caso indovina {chance}.
          </p>
        </div>
        <dl className="flex gap-6">
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide">Ultimi 30 giorni</dt>
            <dd className="text-white">
              <span className="text-2xl tabular-nums text-predict font-semibold">{rate(record.last30)}%</span>{" "}
              <span className="text-slate-400 text-sm tabular-nums">
                {record.last30.hits} su {record.last30.n}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide">Totale</dt>
            <dd className="text-white">
              <span className="text-2xl tabular-nums font-semibold">{rate(record.all)}%</span>{" "}
              <span className="text-slate-400 text-sm tabular-nums">
                {record.all.hits} su {record.all.n}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <h3 className="text-slate-300 text-sm mt-5 mb-2">Ultimi 10 pronostici</h3>
      <ol className="flex flex-wrap gap-1.5" aria-label="Ultimi 10 pronostici, dal più recente">
        {record.recent.map((e) => (
          <li key={e.key}>
            <Link
              to={e.path}
              title={`${e.label} (${e.where}, ${formatShortDate(e.utcDate)}): indicato ${e.pick} al ${pct(e.prob)}, finita ${e.result}`}
              aria-label={`${e.label}, ${e.where}: indicato ${e.pick} al ${pct(e.prob)}, finita ${e.result}, ${e.hit ? "corretto" : "sbagliato"}`}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                e.hit ? "bg-best text-best-foreground" : "bg-red-500/90 text-white"
              } hover:opacity-80 focus-visible:outline-2 focus-visible:outline-action`}
            >
              {e.hit ? <Check className="w-4 h-4" aria-hidden="true" /> : <XIcon className="w-4 h-4" aria-hidden="true" />}
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-slate-400 text-xs">
        Ogni pronostico è calcolato con i soli dati disponibili prima della partita
        {sport === "calcio" ? "; sono escluse solo le partite che il modello stesso segnala ad affidabilità bassa" : ""}.
        Sono stime statistiche, non consigli di gioco.{" "}
        <Link to={`${paths.metodologia}#${anchor}`} className="text-action-text hover:text-action-text-hover">
          Come lo calcoliamo
        </Link>
      </p>
    </section>
  );
}
