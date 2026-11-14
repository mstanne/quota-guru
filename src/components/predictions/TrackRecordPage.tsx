// /bilancio-pronostici – the track record of the models on one page, written to be quoted: the figures first in a
// plain sentence, then by competition and by month, the latest predictions, the calibration chart and the archive
// to download (every prediction, hits and misses alike). Structured data: Dataset (src/lib/trackRecordMeta.ts).
import { Download, ShieldCheck } from "lucide-react";
import { Link } from "../../lib/links";
import { paths } from "../../routes";
import { formatShortDate } from "../../lib/footballCore";
import { pct } from "../../lib/predictionsCore";
import { footballTrackRecord, nationalTrackRecord } from "../../lib/trackRecordFootball";
import { nbaTrackRecord } from "../../lib/trackRecordNba";
import type { TrackRecord } from "../../lib/trackRecord";
import { PageHeader } from "../layout/PageHeader";
import { CalibrationSection } from "./CalibrationChart";
import { usePageMeta } from "../../lib/pageMeta";
import { trackRecordMeta, trackLead, ARCHIVE_FILES } from "../../lib/trackRecordMeta";
import { ARCHIVE_TERMS, PREDICTIONS_LICENSE } from "../../lib/archiveLicense.mjs";
import { TelegramBanner } from "../TelegramBanner";

const rate = (x: { n: number; hits: number }) => (x.n ? Math.round((x.hits / x.n) * 100) : 0);
const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string;
  rows: { key: string; label: string; n: number; hits: number }[];
}) {
  if (!rows.length) return null;
  return (
    <table className="w-full text-sm">
      <caption className="text-left text-slate-300 mb-2">{caption}</caption>
      <thead>
        <tr className="text-slate-400 text-xs">
          <th scope="col" className="text-left font-normal py-1.5">
            {head}
          </th>
          <th scope="col" className="text-right font-normal py-1.5">
            Pronostici
          </th>
          <th scope="col" className="text-right font-normal py-1.5">
            Azzeccati
          </th>
          <th scope="col" className="text-right font-normal py-1.5 w-16">
            %
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-t border-slate-800">
            <th scope="row" className="text-left font-normal text-white py-1.5">
              {r.label}
            </th>
            <td className="text-right tabular-nums text-slate-300">{r.n}</td>
            <td className="text-right tabular-nums text-slate-300">{r.hits}</td>
            <td className="text-right tabular-nums text-white font-medium">{rate(r)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SportSection({ sport, record }: { sport: "calcio" | "nazionali" | "nba"; record: TrackRecord }) {
  const title = sport === "calcio" ? "Calcio" : sport === "nazionali" ? "Calcio, nazionali" : "NBA";
  const outcomes =
    sport !== "nba"
      ? "tre esiti (1, X, 2): tirando a caso si azzecca 1 volta su 3"
      : "due esiti: tirando a caso si azzecca 1 volta su 2";
  return (
    <section
      aria-labelledby={`bilancio-${sport}`}
      className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5"
    >
      <div>
        <h2 id={`bilancio-${sport}`} className="text-white text-xl mb-2">
          {title}
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <dt className="text-slate-400 text-xs">Azzeccati in totale</dt>
            <dd className="text-predict text-2xl font-semibold tabular-nums">{rate(record.all)}%</dd>
            <dd className="text-slate-400 text-xs tabular-nums">
              {record.all.hits} su {record.all.n}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs">Ultimi 30 giorni</dt>
            <dd className="text-white text-2xl font-semibold tabular-nums">{rate(record.last30)}%</dd>
            <dd className="text-slate-400 text-xs tabular-nums">
              {record.last30.hits} su {record.last30.n}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-slate-400 text-xs">Fonte</dt>
            <dd className="text-white text-sm">
              {record.source === "archivio"
                ? `Pronostici pubblicati${record.since ? ` dal ${formatShortDate(record.since)}` : ""}`
                : "Ricalcolo sulle partite giocate"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-slate-400 text-xs">
          Conta come azzeccato quando si verifica l'esito che il modello indicava come più probabile; le partite hanno{" "}
          {outcomes}.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Table
          caption="Per competizione"
          head="Competizione"
          rows={(record.byWhere ?? []).map((r) => ({ key: r.where, label: r.where, ...r }))}
        />
        <Table
          caption="Per mese"
          head="Mese"
          rows={(record.byMonth ?? []).slice(0, 12).map((r) => ({ key: r.month, label: monthLabel(r.month), ...r }))}
        />
      </div>
      {record.recent.length > 0 && (
        <div>
          <h3 className="text-slate-300 text-sm mb-2">Ultimi pronostici</h3>
          <ul className="divide-y divide-slate-800 text-sm">
            {record.recent.map((e) => (
              <li key={e.key} className="flex items-center gap-3 py-1.5">
                <span
                  className={`shrink-0 w-2.5 h-2.5 rounded-full ${e.hit ? "bg-best" : "bg-slate-500"}`}
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0">
                  <Link to={e.path} className="text-white hover:underline">
                    {e.label}
                  </Link>
                  <span className="text-slate-400">
                    {" "}
                    · {e.where} · <time dateTime={e.utcDate}>{formatShortDate(e.utcDate)}</time>
                  </span>
                </span>
                <span className="text-slate-300 tabular-nums text-right">
                  {e.pick} ({pct(e.prob)}) → {e.result}
                  <span className="sr-only">{e.hit ? ", azzeccato" : ", sbagliato"}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function TrackRecordPage() {
  const football = footballTrackRecord();
  const nba = nbaTrackRecord();
  const nationals = nationalTrackRecord();
  usePageMeta(trackRecordMeta());
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={ShieldCheck}
        title="Bilancio dei pronostici"
        breadcrumb={[{ label: "Pronostici", to: paths.pronostici }, { label: "Bilancio" }]}
        subtitle="Quante volte si è verificato l'esito indicato dai modelli: tutti i pronostici, giusti e sbagliati."
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* the figures in one sentence, the part search engines and AI assistants quote */}
        <p className="text-slate-200 text-lg leading-relaxed">{trackLead(football, nba)}</p>
        <SportSection sport="calcio" record={football} />
        <TelegramBanner topic="bilancio" />
        {nationals.all.n > 0 && <SportSection sport="nazionali" record={nationals} />}
        {nba.all.n > 0 && <SportSection sport="nba" record={nba} />}
        <CalibrationSection />
        <section aria-labelledby="scarica" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="scarica" className="text-white text-xl mb-2">
            Scarica l'archivio
          </h2>
          <p className="text-slate-300 text-sm mb-3">
            Ogni pronostico pubblicato, con data di pubblicazione, probabilità, risultato ed esito, in formato JSON. Il
            pronostico non viene più modificato dopo l'inizio della partita.
          </p>
          <ul className="flex flex-wrap gap-2">
            {ARCHIVE_FILES.map((f) => (
              <li key={f.url}>
                <a
                  href={f.url}
                  download
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm hover:border-slate-500"
                >
                  <Download className="w-4 h-4 text-slate-300" aria-hidden="true" />
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-slate-300 text-xs leading-relaxed">
            <strong className="font-medium text-white">Licenza.</strong> {ARCHIVE_TERMS}{" "}
            <a
              href={PREDICTIONS_LICENSE.url}
              rel="license noopener"
              target="_blank"
              className="text-action-text hover:text-action-text-hover"
            >
              Testo della licenza {PREDICTIONS_LICENSE.name}
            </a>
            .
          </p>
          <p className="mt-3 text-slate-400 text-xs">
            Come vengono calcolati i pronostici:{" "}
            <Link to={paths.metodologia} className="text-action-text hover:text-action-text-hover">
              metodologia
            </Link>
            . Sono stime statistiche, non consigli di gioco.
          </p>
        </section>
      </div>
    </div>
  );
}
