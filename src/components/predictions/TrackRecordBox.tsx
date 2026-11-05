// Transparent track record: share of correct "most likely outcome" calls, last 30 days and the last 10
// predictions, wins and misses alike. One line above the lists (number + 10 dots), explanation on request. No ROI or yield: the site has no bookmaker odds to compute them honestly.
import { Link } from "../../lib/links";
import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  if (record.all.n < 10) return null;
  const outcomes = sport === "calcio" ? "tre esiti possibili (1, X, 2)" : "due esiti possibili";
  const chance = sport === "calcio" ? "1 volta su 3" : "1 volta su 2";
  const anchor = sport === "calcio" ? "pronostici" : "pronostici-basket";
  const id = `track-${sport}`;
  // until the archive is older than 30 days the two periods are the same: show one number
  const same = record.last30.n === record.all.n && record.last30.hits === record.all.hits;
  return (
    <section
      aria-labelledby={id}
      className={`rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <h2 id={id} className="sr-only">
          Come sono andati i pronostici {sport === "calcio" ? "del calcio" : "NBA"}
        </h2>
        <p className="flex items-baseline gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 shrink-0 self-center text-slate-300" aria-hidden="true" />
          <span className="text-predict text-xl font-semibold tabular-nums">{rate(record.last30)}%</span>
          <span className="text-slate-300 text-sm">
            azzeccati{same ? "" : <span className="hidden sm:inline"> negli ultimi 30 giorni</span>}
          </span>
          <span className="text-slate-400 text-sm tabular-nums whitespace-nowrap">
            {record.last30.hits} su {record.last30.n}
          </span>
          {!same && (
            <span className="hidden sm:inline text-slate-400 text-sm tabular-nums">
              · totale <span className="text-white">{rate(record.all)}%</span>
            </span>
          )}
        </p>
        <ol className="flex items-center" aria-label="Ultimi 10 pronostici, dal più recente">
          {record.recent.map((e) => (
            <li key={e.key}>
              <Link
                to={e.path}
                title={`${e.label} (${e.where}, ${formatShortDate(e.utcDate)}): indicato ${e.pick} al ${pct(e.prob)}${e.published ? ` (pubblicato il ${formatShortDate(e.published)})` : ""}, finita ${e.result}`}
                aria-label={`${e.label}, ${e.where}: indicato ${e.pick} al ${pct(e.prob)}, finita ${e.result}, ${e.hit ? "corretto" : "sbagliato"}`}
                data-track="track_record_click"
                data-track-sport={sport}
                data-track-result={e.hit ? "corretto" : "sbagliato"}
                // 24 px touch target around a small dot
                className="group/dot flex h-6 w-5 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-action"
              >
                <span
                  className={`block h-2.5 w-2.5 rounded-full group-hover/dot:scale-125 transition-transform ${
                    e.hit ? "bg-best" : "bg-slate-500"
                  }`}
                />
              </Link>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${id}-details`}
          className="ml-auto inline-flex items-center gap-1 text-action-text hover:text-action-text-hover text-sm cursor-pointer"
        >
          Dettagli
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div id={`${id}-details`} hidden={!open} className="pt-3 pb-1 space-y-2 text-slate-400 text-sm">
        <p>
          Quante volte l'esito indicato come più probabile si è verificato. Contano tutte le partite, anche quelle
          sbagliate (i puntini sono gli ultimi 10 pronostici, dal più recente: verde = corretto). Con {outcomes},
          tirare a caso indovina {chance}.
        </p>
        {!same && (
          <p className="tabular-nums">
            Ultimi 30 giorni: {rate(record.last30)}% ({record.last30.hits} su {record.last30.n}) · Totale:{" "}
            {rate(record.all)}% ({record.all.hits} su {record.all.n})
          </p>
        )}
        <p className="text-xs">
          {record.source === "archivio" ? (
            <>
              Contano tutti i pronostici pubblicati sul sito
              {record.since ? ` dal ${formatShortDate(record.since)}` : ""}: ognuno viene archiviato prima del calcio
              d'inizio e non viene più modificato.{" "}
              <a
                href={`/dati/archivio-pronostici-${sport}.json`}
                className="text-action-text hover:text-action-text-hover"
                data-track="archive_download"
                data-track-sport={sport}
                download
              >
                Scarica l'archivio completo
              </a>
              .{" "}
            </>
          ) : (
            <>
              Pronostici ricalcolati con i soli dati disponibili prima di ogni partita
              {sport === "calcio" ? ", escluse le partite che il modello segnala ad affidabilità bassa" : ""}. Appena
              l'archivio dei pronostici pubblicati avrà almeno 10 partite concluse, il bilancio userà quello.{" "}
            </>
          )}
          Sono stime statistiche, non consigli di gioco.{" "}
          <Link to={`${paths.metodologia}#${anchor}`} className="text-action-text hover:text-action-text-hover">
            Come lo calcoliamo
          </Link>
        </p>
      </div>
    </section>
  );
}
