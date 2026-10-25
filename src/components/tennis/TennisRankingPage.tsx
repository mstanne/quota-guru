// /tennis/classifica-atp and /tennis/classifica-wta – top 100 of the world rankings.
import { Link } from "../../lib/links";
import { ListOrdered } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { Movement } from "./TennisUi";
import { formatLong, rankingMeta, tennisPaths, tennisUpdatedAt, tourData, tourLabel, type Tour } from "../../lib/tennis";
import { usePageMeta } from "../../lib/pageMeta";

export function TennisRankingPage({ tour }: { tour: Tour }) {
  const meta = rankingMeta(tour);
  usePageMeta(meta);
  const { rankings, rankingDate } = tourData(tour);
  if (!rankings.length) return <NotFoundPage />;
  const other: Tour = tour === "atp" ? "wta" : "atp";
  const nf = new Intl.NumberFormat("it-IT");
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={ListOrdered}
        title={`Classifica ${tourLabel(tour)}`}
        subtitle={`I primi 100 ${tour === "atp" ? "tennisti" : "tenniste"} del ranking mondiale${rankingDate ? `, classifica del ${formatLong(rankingDate)}` : ""}.`}
        breadcrumb={[{ label: "Tennis", to: "/tennis" }, { label: `Classifica ${tourLabel(tour)}` }]}
        meta={<DataUpdatedNote generatedAt={tennisUpdatedAt} />}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to={tennisPaths.ranking(other)} className="text-slate-300 hover:text-white underline underline-offset-2">
            Classifica {tourLabel(other)}
          </Link>
          <Link to={tennisPaths.calendar(tour)} className="text-slate-300 hover:text-white underline underline-offset-2">
            Calendario tornei {tourLabel(tour)}
          </Link>
        </div>
      </PageHeader>
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <caption className="sr-only">{meta.title}</caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal px-4 py-3 w-14">
                  Pos.
                </th>
                <th scope="col" className="text-left font-normal py-3">
                  {tour === "atp" ? "Giocatore" : "Giocatrice"}
                </th>
                <th scope="col" className="text-left font-normal py-3 px-2">
                  Paese
                </th>
                <th scope="col" className="text-right font-normal py-3 px-2">
                  Punti
                </th>
                <th scope="col" className="text-right font-normal py-3 px-4">
                  <abbr title="Variazione rispetto alla classifica precedente">Var.</abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.player.id} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-2.5 text-slate-300 tabular-nums">{r.rank}</td>
                  <th scope="row" className="py-2.5 text-left font-normal text-white">
                    {r.player.name}
                  </th>
                  <td className="py-2.5 px-2 text-slate-300">{r.player.country ?? "–"}</td>
                  <td className="py-2.5 px-2 text-right text-white tabular-nums">
                    {r.points != null ? nf.format(r.points) : "–"}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">
                    <Movement value={r.movement} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-400 text-sm mt-4">
          Il ranking somma i punti conquistati nei tornei delle ultime 52 settimane. Come funzionano i tornei e le
          categorie è spiegato nella guida{" "}
          <Link to="/guide/tornei-di-tennis" className="text-action-text underline underline-offset-2 hover:text-action-text-hover">
            i tornei di tennis
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
