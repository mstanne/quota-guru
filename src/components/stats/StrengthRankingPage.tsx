// /calcio/ranking-squadre — strength ranking of the clubs of the leagues with predictions, from the ratings of the
// prediction model (src/lib/strengthRanking.ts). Filter by league on the page (all leagues in the pre-rendered HTML).
import { useState } from "react";
import { Trophy } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { TeamName } from "../teams/TeamLink";
import { usePageMeta } from "../../lib/pageMeta";
import { paths } from "../../routes";
import { hasStrengthRanking, rankedClubs, strengthRankingMeta, strengthUpdatedAt } from "../../lib/strengthRanking";

const fmt = (n: number) => n.toFixed(2).replace(".", ",");
const chip = (on: boolean) =>
  `shrink-0 rounded-full px-3 py-1.5 text-sm border ${on ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-300 hover:border-slate-500"}`;

export function StrengthRankingPage() {
  const ok = hasStrengthRanking();
  usePageMeta(ok ? strengthRankingMeta() : null);
  const [league, setLeague] = useState<string | null>(null);
  if (!ok) return <NotFoundPage />;
  const all = rankedClubs();
  const leagues = [...new Map(all.map((c) => [c.league.slug, c.league])).values()];
  const shown = league ? all.filter((c) => c.league.slug === league) : all;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title="Ranking delle squadre di calcio secondo il modello"
        subtitle="Le squadre dei campionati che seguiamo, dalla più forte, con i gol attesi contro una squadra media."
        breadcrumb={[{ label: "Calcio", to: "/calcio" }, { label: "Ranking squadre" }]}
        meta={strengthUpdatedAt ? <DataUpdatedNote generatedAt={strengthUpdatedAt} cadence="dopo ogni giornata" /> : undefined}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <p className="text-slate-300 max-w-3xl">
          È la stessa valutazione che usiamo per i pronostici: per ogni squadra la forza in attacco e in difesa, stimata
          dai risultati e dagli expected goals delle partite recenti (le più recenti pesano di più), più la forza del suo
          campionato misurata nelle coppe europee. Per confrontarle tutte sulla stessa scala, la tabella mostra i gol che
          ogni squadra segnerebbe e subirebbe in media contro una squadra di riferimento, in campo neutro; l'ordine è dato
          dalla differenza.
        </p>
        <nav aria-label="Campionati" className="flex gap-2 overflow-x-auto scrollbar-none">
          <button type="button" className={chip(league === null)} onClick={() => setLeague(null)} aria-pressed={league === null}>
            Tutti
          </button>
          {leagues.map((l) => (
            <button key={l.slug} type="button" className={chip(league === l.slug)} onClick={() => setLeague(l.slug)} aria-pressed={league === l.slug}>
              {l.name}
            </button>
          ))}
        </nav>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <caption className="sr-only">Ranking delle squadre secondo il modello</caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal px-4 py-3 w-12">#</th>
                <th scope="col" className="text-left font-normal py-3">Squadra</th>
                <th scope="col" className="text-left font-normal px-2">Campionato</th>
                <th scope="col" className="text-right font-normal px-2" title="Gol attesi a partita contro la squadra di riferimento">Gol fatti</th>
                <th scope="col" className="text-right font-normal px-2" title="Gol attesi subiti a partita contro la squadra di riferimento">Gol subiti</th>
                <th scope="col" className="text-right font-normal px-4" title="Differenza reti attesa a partita">Differenza</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-2.5 text-slate-400 tabular-nums">{c.rank}</td>
                  <th scope="row" className="py-2.5 text-left font-normal">
                    <TeamName id={c.id} name={c.name} />
                  </th>
                  <td className="px-2 text-slate-300">
                    <Link to={`/calcio/${c.league.slug}/classifica`} className="hover:text-white">
                      {c.league.name}
                    </Link>
                  </td>
                  <td className="text-right px-2 text-slate-300 tabular-nums">{fmt(c.gf)}</td>
                  <td className="text-right px-2 text-slate-300 tabular-nums">{fmt(c.ga)}</td>
                  <td className={`text-right px-4 tabular-nums font-semibold ${c.gd > 0 ? "text-predict" : "text-rose-300"}`}>
                    {c.gd > 0 ? "+" : ""}
                    {fmt(c.gd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-400 text-xs max-w-3xl">
          Stime statistiche aggiornate dopo ogni giornata, non un giudizio: il modello conosce risultati ed expected goals,
          non infortuni, mercato e motivazioni. La squadra di riferimento ha forza zero in un campionato di forza zero, con
          il livello di gol della Champions League.{" "}
          <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
            Come funziona il modello
          </Link>
        </p>
      </div>
    </div>
  );
}
