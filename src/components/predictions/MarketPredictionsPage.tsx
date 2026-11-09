// /pronostici/under-over, /pronostici/goal-no-goal, /pronostici/multigol – the matches of the next days ranked by the
// model's probability of one market, and how often outcomes rated that likely came true (src/lib/marketPages.ts).
import { ChartColumn } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { usePageMeta } from "../../lib/pageMeta";
import { formatUpdated, generatedAt, goalStatsPath } from "../../lib/football";
import { pct } from "../../lib/predictionsCore";
import {
  MARKET_KEYS,
  MARKETS,
  RECORD_THRESHOLD,
  WINDOW_DAYS,
  marketLists,
  marketMeta,
  marketPath,
  marketRecord,
  type MarketKey,
  type MarketRow,
} from "../../lib/marketPages";
import { dayPath } from "../../lib/dayPages";
import { paths } from "../../routes";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const link = "text-action-text hover:text-action-text-hover";
const SHORT: Record<MarketKey, string> = { "under-over": "Under/Over", "goal-no-goal": "Goal/No goal", multigol: "Multigol" };

function Row({ r, i, side }: { r: MarketRow; i: number; side: string }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm tabular-nums bg-slate-800 border border-slate-700 text-slate-300"
        aria-hidden="true"
      >
        {i + 1}
      </span>
      <span className="flex-1 min-w-0">
        <Link to={r.path} className="text-white font-medium hover:underline">
          {r.label}
        </Link>
        <span className="block text-slate-400 text-sm">
          <time dateTime={r.m.utcDate}>{cap(r.when)}</time> · {r.c.name}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-white text-lg font-semibold tabular-nums">
          <span className="sr-only">{side}: </span>
          {pct(r.p)}
        </span>
        <span className="block text-slate-400 text-xs">{r.detail}</span>
      </span>
    </li>
  );
}

export function MarketPredictionsPage({ market }: { market: MarketKey }) {
  usePageMeta(marketMeta(market));
  const def = MARKETS[market];
  const lists = marketLists(market);
  const record = marketRecord(market);
  const empty = lists.every((l) => l.rows.length === 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={ChartColumn}
        title={def.h1}
        subtitle={def.intro}
        breadcrumb={[{ label: "Pronostici", to: paths.pronostici }, { label: SHORT[market] }]}
        meta={
          <MetaItems items={[`Prossimi ${WINDOW_DAYS} giorni`, `Dati aggiornati al ${formatUpdated(generatedAt)}`, "Stime statistiche, non consigli di gioco"]} />
        }
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-10">
        <nav aria-label="Pronostici per tipo di esito" className="flex flex-wrap gap-2">
          {MARKET_KEYS.map((k) => (
            <Link
              key={k}
              to={marketPath(k)}
              aria-current={k === market ? "page" : undefined}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                k === market ? "border-slate-400 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              {SHORT[k]}
            </Link>
          ))}
        </nav>

        {empty && (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300 text-sm">
            Nei prossimi {WINDOW_DAYS} giorni non ci sono partite con un pronostico affidabile (succede nelle pause per
            le nazionali). Le liste tornano con la prossima giornata; intanto trovi tutte le partite nella pagina{" "}
            <Link to={paths.pronostici} className={link}>
              Pronostici
            </Link>
            .
          </p>
        )}

        {lists.map(({ side, rows }) =>
          rows.length ? (
            <section key={side.id} aria-labelledby={`lista-${side.id}`}>
              <h2 id={`lista-${side.id}`} className="text-white text-2xl mb-1">
                {market === "multigol" ? `${side.name}: le partite in cui è la fascia più probabile` : `${side.name}: le partite più probabili`}
              </h2>
              <p className="text-slate-400 text-sm mb-3">
                {cap(side.meaning)}, recupero compreso.{" "}
                Accanto, la probabilità calcolata dal modello.
              </p>
              <ol className="rounded-xl border border-slate-800 bg-slate-900 px-4 divide-y divide-slate-800">
                {rows.map((r, i) => (
                  <Row key={r.m.id} r={r} i={i} side={side.name} />
                ))}
              </ol>
            </section>
          ) : null,
        )}

        {record.length > 0 && (
          <section aria-labelledby="bilancio" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 id="bilancio" className="text-white text-lg mb-2">
              Com'è andata nelle partite già giocate
            </h2>
            <p className="text-slate-300 text-sm mb-4">
              {market === "multigol"
                ? "Per ogni fascia, le partite finite in cui era la più probabile delle tre"
                : `Le partite finite in cui il modello dava l'esito almeno al ${Math.round(RECORD_THRESHOLD * 100)}%`}
              , e quante volte si è verificato davvero. Se il modello è ben tarato, la percentuale verificata è vicina a
              quella attesa.
            </p>
            <dl className={`grid gap-3 ${record.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              {record.map((r) => (
                <div key={r.side} className="rounded-lg border border-slate-800 p-4">
                  <dt className="text-slate-300 text-sm mb-1">{r.side}</dt>
                  <dd className="text-white">
                    <span className="text-2xl font-semibold tabular-nums">{pct(r.hits / r.n)}</span>{" "}
                    <span className="text-slate-400 text-sm">
                      verificato ({r.hits} su {r.n}), atteso in media {pct(r.expected)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-slate-400 text-xs">
              Probabilità ricalcolate per ogni partita con i soli dati disponibili prima del calcio d'inizio, come nel{" "}
              <Link to="/bilancio-pronostici" className={link}>
                bilancio dei pronostici
              </Link>
              . Escluse le partite in cui il modello aveva pochi dati sulle squadre.
            </p>
          </section>
        )}

        <section aria-labelledby="come" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="come" className="text-white text-lg mb-2">
            Come leggere le liste
          </h2>
          <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1.5">
            <li>
              Le probabilità vengono dai gol attesi di ciascuna squadra, stimati dai risultati recenti, e si aggiornano a
              ogni aggiornamento dei dati, più volte al giorno.
            </li>
            <li>
              Restano fuori le amichevoli e le partite in cui il modello ha pochi dati sulle squadre: le trovi comunque
              nelle pagine{" "}
              <Link to={dayPath("oggi")} className={link}>
                Pronostici di oggi
              </Link>{" "}
              e{" "}
              <Link to={dayPath("domani")} className={link}>
                di domani
              </Link>
              .
            </li>
            <li>
              Anche un esito al 70% non si verifica in 3 casi su 10. E più esiti messi insieme diventano molto meno
              probabili di ciascuno preso da solo: lo mostra il{" "}
              <Link to="/pronostici/tris" className={link}>
                tris
              </Link>
              .
            </li>
          </ul>
          <p className="mt-3 text-slate-400 text-sm">
            Il modello non conosce infortuni, squalifiche e turnover.{" "}
            <Link to={`${paths.metodologia}#pronostici`} className={link}>
              Come calcoliamo le probabilità
            </Link>
            {" · "}
            <Link to={goalStatsPath({ slug: "serie-a" })} className={link}>
              Statistiche Under/Over della Serie A
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
