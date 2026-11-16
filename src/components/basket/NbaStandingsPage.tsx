// /basket/nba/classifica — NBA standings by conference, with the season projection of the model (vittorie attese,
// play-in, playoffs and title), see src/lib/nbaSeason.ts.
import { ListOrdered } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { TeamBadge } from "../calcio/MatchRow";
import { TeamName } from "../teams/TeamLink";
import { NotFoundPage } from "../NotFoundPage";
import { usePageMeta } from "../../lib/pageMeta";
import { paths } from "../../routes";
import { basketPaths, nbaSeason } from "../../lib/basket";
import { pct } from "../../lib/seasonOutlook";
import { numberFormat } from "../../lib/intl";
import {
  CONFERENCES,
  NBA_STAGES,
  fmtGb,
  fmtPct,
  hasNbaProjection,
  hasNbaStandings,
  nbaProjectionInfo,
  nbaSeasonUpdatedAt,
  nbaStandings,
  nbaStandingsMeta,
  seedZones,
  type Conference,
} from "../../lib/nbaSeason";

const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");
const th = "text-right font-normal px-2 py-3 whitespace-nowrap";
const td = "text-right px-2 tabular-nums";

function Team({ r }: { r: { id: number; abbr: string; shortName: string; name: string } }) {
  return (
    <span className="flex items-center gap-2.5">
      <TeamBadge team={{ tla: r.abbr, shortName: r.name, crest: null }} size="xs" />
      <TeamName id={r.id} name={r.shortName} sport="nba" />
    </span>
  );
}

/** Conference table: seeds 1-6 playoffs, 7-10 play-in (a line under the 6th and the 10th). */
function ConferenceTable({ conf, name }: { conf: Conference; name: string }) {
  const rows = nbaStandings(conf);
  return (
    <section aria-labelledby={`classifica-${conf}`}>
      <h2 id={`classifica-${conf}`} className="text-white text-xl mb-3">
        {name}
      </h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <caption className="sr-only">Classifica NBA {name}</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal px-4 py-3 w-10">#</th>
              <th scope="col" className="text-left font-normal py-3">Squadra</th>
              <th scope="col" className={th}><abbr title="Vittorie">V</abbr></th>
              <th scope="col" className={th}><abbr title="Sconfitte">P</abbr></th>
              <th scope="col" className={th}><abbr title="Percentuale di vittorie">%V</abbr></th>
              <th scope="col" className={th}><abbr title="Partite di distacco dalla prima">Distacco</abbr></th>
              <th scope="col" className={th}>Casa</th>
              <th scope="col" className={th}>Trasferta</th>
              <th scope="col" className={th}><abbr title="Record contro squadre della stessa conference">Conf.</abbr></th>
              <th scope="col" className={th}>Ultime 10</th>
              <th scope="col" className={th}><abbr title="Vittorie (V) o sconfitte (P) consecutive">Serie</abbr></th>
              <th scope="col" className={`${th} pr-4`}><abbr title="Differenza punti a partita">Diff.</abbr></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const g = r.w + r.l;
              const diff = g ? (r.pf - r.pa) / g : 0;
              const line = r.pos === 6 || r.pos === 10 ? "border-b-2 border-slate-600" : "border-b border-slate-800 last:border-0";
              return (
                <tr key={r.id} className={line}>
                  <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.pos}</td>
                  <th scope="row" className="py-2.5 text-left font-normal"><Team r={r} /></th>
                  <td className={`${td} text-white font-semibold`}>{r.w}</td>
                  <td className={`${td} text-slate-300`}>{r.l}</td>
                  <td className={`${td} text-slate-300`}>{fmtPct(r)}</td>
                  <td className={`${td} text-slate-300`}>{fmtGb(r.gb)}</td>
                  <td className={`${td} text-slate-300`}>{r.hw}-{r.hl}</td>
                  <td className={`${td} text-slate-300`}>{r.aw}-{r.al}</td>
                  <td className={`${td} text-slate-300`}>{r.cw}-{r.cl}</td>
                  <td className={`${td} text-slate-300`}>{r.last10[0]}-{r.last10[1]}</td>
                  <td className={`${td} text-slate-300`}>{r.streak ?? "–"}</td>
                  <td className={`${td} pr-4 ${diff > 0 ? "text-predict" : diff < 0 ? "text-rose-300" : "text-slate-300"}`}>
                    {diff > 0 ? "+" : ""}
                    {fmt1(diff)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Projection of one conference, teams by expected wins. */
function ConferenceProjection({ conf, name }: { conf: Conference; name: string }) {
  const rows = nbaStandings(conf)
    .filter((r) => r.sim)
    .sort((a, b) => b.sim!.xw - a.sim!.xw);
  if (!rows.length) return null;
  return (
    <div>
      <h3 className="text-white text-lg mb-2">{name}</h3>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <caption className="sr-only">Proiezione NBA {name}</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal px-4 py-3">Squadra</th>
              <th scope="col" className={th} title="Record attuale">Ora</th>
              <th scope="col" className={th} title="Vittorie attese a fine stagione regolare">Vittorie attese</th>
              <th scope="col" className={th} title="Chiude tra le prime 6: playoff senza play-in">1°-6°</th>
              <th scope="col" className={th} title="Chiude dal 7° al 10° posto: play-in">Play-in</th>
              {NBA_STAGES.slice(1).map((s) => (
                <th key={s.i} scope="col" className={th} title={s.long}>
                  {s.short}
                </th>
              ))}
              <th scope="col" className={`${th} pr-4`} title="Posizione finale più frequente nelle stagioni simulate">Più probabile</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = r.sim!;
              const z = seedZones(s);
              const cell = (p: number, strong = 0.5) => (
                <td className={`${td} ${p >= strong ? "text-predict font-semibold" : p > 0 ? "text-slate-200" : "text-slate-500"}`}>{pct(p)}</td>
              );
              return (
                <tr key={r.id} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className="text-left font-normal px-4 py-2.5"><Team r={r} /></th>
                  <td className={`${td} text-slate-400`}>{r.w}-{r.l}</td>
                  <td className={`${td} text-white font-semibold`}>{fmt1(s.xw)}</td>
                  {cell(z.top6)}
                  {cell(z.playIn)}
                  {NBA_STAGES.slice(1).map((st) => (
                    <td key={st.i} className={`${td} ${s.stage[st.i] >= 0.5 ? "text-predict font-semibold" : s.stage[st.i] > 0 ? "text-slate-200" : "text-slate-500"}`}>
                      {pct(s.stage[st.i])}
                    </td>
                  ))}
                  <td className={`${td} pr-4 text-slate-300`}>{z.likely}°</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NbaStandingsPage() {
  const ok = hasNbaStandings();
  usePageMeta(ok ? nbaStandingsMeta() : null);
  if (!ok) return <NotFoundPage />;
  const proj = hasNbaProjection();
  const { runs, remaining } = nbaProjectionInfo();
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={ListOrdered}
        title={`Classifica NBA ${nbaSeason}`}
        subtitle="Eastern e Western Conference, con la proiezione del nostro modello fino al titolo."
        breadcrumb={[{ label: "Basket", to: "/basket" }, { label: "NBA", to: basketPaths.nba }, { label: "Classifica" }]}
        meta={nbaSeasonUpdatedAt ? <DataUpdatedNote generatedAt={nbaSeasonUpdatedAt} cadence="dopo ogni giornata" /> : undefined}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <p className="text-slate-300 max-w-3xl">
          Le prime 6 di ogni conference vanno direttamente ai playoff; dalla 7ª alla 10ª si gioca il play-in, che assegna
          gli ultimi due posti (7° e 8°). In classifica conta la percentuale di vittorie; a parità valgono gli scontri
          diretti e gli altri criteri NBA, qui non applicati.
        </p>
        {CONFERENCES.map((c) => (
          <ConferenceTable key={c.key} conf={c.key} name={c.name} />
        ))}
        {proj && (
          <section aria-labelledby="proiezione" className="space-y-5">
            <div>
              <h2 id="proiezione" className="text-white text-xl">
                Proiezione NBA {nbaSeason}: vittorie attese, playoff e titolo
              </h2>
              <p className="text-slate-300 mt-2 max-w-3xl">
                Abbiamo simulato {numberFormat("it-IT").format(runs)} volte le {remaining} partite di stagione regolare
                che restano, poi il play-in e i playoff (serie al meglio delle 7), con le stesse probabilità dei nostri
                pronostici NBA. Per ogni squadra: le vittorie attese e in quante stagioni simulate arriva a ogni turno.
              </p>
            </div>
            {CONFERENCES.map((c) => (
              <ConferenceProjection key={c.key} conf={c.key} name={c.name} />
            ))}
            <p className="text-slate-400 text-xs max-w-3xl">
              Stime statistiche aggiornate dopo ogni giornata, non certezze. Il modello tiene conto della forza di ogni
              squadra in attacco e in difesa e del fattore campo, con un margine di incertezza sulla forza stessa; non
              conosce infortuni, scambi e riposi futuri. Le parità in classifica sono decise a sorte.{" "}
              <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
                Come funziona il modello
              </Link>
            </p>
          </section>
        )}
        <p className="text-sm">
          <Link to={basketPaths.nba} className="text-action-text hover:text-action-text-hover">
            Pronostici delle prossime partite NBA
          </Link>
          {" · "}
          <Link to="/basket/nba/squadre" className="text-action-text hover:text-action-text-hover">
            Le 30 squadre NBA
          </Link>
          {" · "}
          <Link to="/basket/nba/risultati" className="text-action-text hover:text-action-text-hover">
            Risultati NBA
          </Link>
        </p>
      </div>
    </div>
  );
}
