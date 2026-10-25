import { Link } from "../../lib/links";
import { ListOrdered } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { TeamBadge } from "../calcio/MatchRow";
import { NotFoundPage } from "../NotFoundPage";
import { basketPaths, basketUpdatedAt, lbaMeta, lbaSeason, lbaStandings } from "../../lib/basket";
import { usePageMeta } from "../../lib/pageMeta";

/** /basket/serie-a/classifica – Lega Basket Serie A standings. */
export function BasketStandingsPage() {
  usePageMeta(lbaMeta);
  if (lbaStandings.length === 0) return <NotFoundPage />;
  const pct = (w: number, p: number) => (p ? `${Math.round((w / p) * 100)}%` : "–");
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={ListOrdered}
        title={`Classifica Serie A basket ${lbaSeason}`}
        breadcrumb={[{ label: "Basket", to: "/basket" }, { label: "Serie A" }, { label: "Classifica" }]}
        meta={<DataUpdatedNote generatedAt={basketUpdatedAt} />}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <caption className="sr-only">Classifica Lega Basket Serie A {lbaSeason}</caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal px-4 py-3 w-10">
                  #
                </th>
                <th scope="col" className="text-left font-normal py-3">
                  Squadra
                </th>
                <th scope="col" className="text-right font-normal py-3 px-2">
                  <abbr title="Partite giocate">G</abbr>
                </th>
                <th scope="col" className="text-right font-normal py-3 px-2">
                  <abbr title="Vittorie">V</abbr>
                </th>
                <th scope="col" className="text-right font-normal py-3 px-2">
                  <abbr title="Sconfitte">P</abbr>
                </th>
                <th scope="col" className="text-right font-normal py-3 px-2">
                  <abbr title="Percentuale di vittorie">%V</abbr>
                </th>
                <th scope="col" className="text-right font-normal py-3 px-2">
                  <abbr title="Punti fatti">PF</abbr>
                </th>
                <th scope="col" className="text-right font-normal py-3 px-2">
                  <abbr title="Punti subiti">PS</abbr>
                </th>
                <th scope="col" className="text-right font-normal py-3 px-4">
                  <abbr title="Differenza punti">Diff</abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              {lbaStandings.map((r) => {
                const diff = r.pointsFor - r.pointsAgainst;
                return (
                  <tr key={r.team.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.rank}</td>
                    <th scope="row" className="py-2.5 text-left font-normal">
                      <span className="flex items-center gap-2.5">
                        <TeamBadge team={{ tla: r.team.abbr, shortName: r.team.name, crest: null }} />
                        <span className="text-white">{r.team.name}</span>
                      </span>
                    </th>
                    <td className="text-right px-2 text-slate-300 tabular-nums">{r.played}</td>
                    <td className="text-right px-2 text-white font-semibold tabular-nums">{r.won}</td>
                    <td className="text-right px-2 text-slate-300 tabular-nums">{r.lost}</td>
                    <td className="text-right px-2 text-slate-300 tabular-nums">{pct(r.won, r.played)}</td>
                    <td className="text-right px-2 text-slate-300 tabular-nums">{r.pointsFor}</td>
                    <td className="text-right px-2 text-slate-300 tabular-nums">{r.pointsAgainst}</td>
                    <td className="text-right px-4 text-slate-300 tabular-nums">{diff > 0 ? `+${diff}` : diff}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-slate-400 text-sm">
          Calendario e risultati della Serie A non sono inclusi nel piano gratuito della fonte dati.{" "}
          <Link
            to={basketPaths.nba}
            className="text-action-text hover:text-action-text-hover underline underline-offset-2"
          >
            Vai al calendario NBA
          </Link>
        </p>
      </div>
    </div>
  );
}
