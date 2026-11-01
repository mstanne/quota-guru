// /calcio/:competizione/statistiche-corner-cartellini – corners and cards of every team of a competition in the
// current season: averages per match (for, against, total) and how many of its matches went over the usual lines.
// Computed from the match statistics in the archive (scripts/archive-data.mjs).
import { useState } from "react";
import { useParams } from "react-router";
import { Flag } from "lucide-react";
import { Link } from "../../lib/links";
import { useCompetitionData, type MatchStatsCounts } from "../../lib/footballData";
import { usePageMeta } from "../../lib/pageMeta";
import { PRONOSTICI, competitionPath, cornersCardsMeta, goalStatsPath, mainTable, seasonName } from "../../lib/footballCore";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { TeamBadge } from "../calcio/MatchRow";
import { TeamName } from "../teams/TeamLink";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const dec = (v: number) => v.toFixed(1).replace(".", ",");
const avg = (v: number, n: number) => (n ? dec(v / n) : "–");
const pct = (k: number, n: number) => (n ? `${Math.round((k / n) * 100)}%` : "–");
const line = (l: number) => String(l).replace(".", ",");

type Kind = "corner" | "cartellini";

export function CornersCardsPage() {
  const { competizione } = useParams();
  const data = useCompetitionData(competizione);
  const c = data?.competition;
  const ms = data?.matchStats ?? null;
  usePageMeta(c ? cornersCardsMeta(c, ms?.league) : null);
  const [kind, setKind] = useState<Kind>("corner");
  if (!data || !c || !ms) return <NotFoundPage />;

  const season = seasonName(c);
  const lg = ms.league;
  const rows = mainTable(c)
    .map((r) => ({ team: r.team, s: ms.teams[String(r.team.id)] as MatchStatsCounts | undefined }))
    .filter((r): r is { team: typeof r.team; s: MatchStatsCounts } => !!r.s?.n);
  const total = (s: MatchStatsCounts) => (kind === "corner" ? s.cf + s.ca : s.yf + s.ya + s.rf + s.ra);
  const sorted = [...rows].sort((a, b) => total(b.s) / b.s.n - total(a.s) / a.s.n || a.team.shortName.localeCompare(b.team.shortName, "it"));
  const lines = kind === "corner" ? ms.lines.corners : ms.lines.cards;
  const over = (s: MatchStatsCounts) => (kind === "corner" ? s.cOver : s.kOver);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Flag}
        title={`Statistiche corner e cartellini ${c.name}${season ? ` ${season}` : ""}`}
        subtitle="Calci d'angolo e cartellini di ogni squadra: medie a partita, fatti e subiti, e in quante partite il totale ha superato le soglie più comuni."
        breadcrumb={[
          { label: "Pronostici", to: PRONOSTICI },
          { label: c.name, to: competitionPath(c) },
          { label: "Statistiche corner e cartellini" },
        ]}
        meta={<DataUpdatedNote generatedAt={data.generatedAt} />}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <section aria-labelledby="campionato" className={card}>
          <h2 id="campionato" className="text-white text-lg mb-4">
            {c.name} {season}: medie a partita
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                ["Partite con statistiche", String(lg.n)],
                ["Corner a partita", avg(lg.cf + lg.ca, lg.n)],
                ["Ammonizioni a partita", avg(lg.yf + lg.ya, lg.n)],
                ["Espulsioni ogni 10 partite", avg((lg.rf + lg.ra) * 10, lg.n)],
              ] as const
            ).map(([label, v]) => (
              <div key={label}>
                <dt className="text-slate-400 text-xs">{label}</dt>
                <dd className="text-white text-2xl tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div role="tablist" aria-label="Statistica" className="flex gap-2">
          {(["corner", "cartellini"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`px-4 py-2 rounded-md border text-sm ${kind === k ? "bg-slate-700 border-slate-500 text-white" : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"}`}
            >
              {k === "corner" ? "Calci d'angolo" : "Cartellini"}
            </button>
          ))}
        </div>

        <section className={card} aria-label={kind === "corner" ? "Calci d'angolo per squadra" : "Cartellini per squadra"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th scope="col" className="font-normal py-2.5 pr-2 text-left">Squadra</th>
                  <th scope="col" className="font-normal py-2.5 px-2 text-right" title="Partite con statistiche">PG</th>
                  <th scope="col" className="font-normal py-2.5 px-2 text-right">Fatti</th>
                  <th scope="col" className="font-normal py-2.5 px-2 text-right">Subiti</th>
                  <th scope="col" className="font-normal py-2.5 px-2 text-right">Totale</th>
                  {lines.map((l) => (
                    <th key={l} scope="col" className="font-normal py-2.5 px-2 text-right whitespace-nowrap" title={`Partite con più di ${line(l)} ${kind === "corner" ? "calci d'angolo" : "cartellini"} in totale`}>
                      Over {line(l)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ team, s }) => {
                  const f = kind === "corner" ? s.cf : s.yf + s.rf;
                  const a = kind === "corner" ? s.ca : s.ya + s.ra;
                  return (
                    <tr key={team.id} className="border-b border-slate-800 last:border-0">
                      <th scope="row" className="py-2.5 pr-2 text-left font-normal">
                        <span className="flex items-center gap-2.5 whitespace-nowrap">
                          <TeamBadge team={team} />
                          <TeamName id={team.id} name={team.shortName} />
                        </span>
                      </th>
                      <td className="text-right px-2 tabular-nums text-slate-300">{s.n}</td>
                      <td className="text-right px-2 tabular-nums text-slate-300">{avg(f, s.n)}</td>
                      <td className="text-right px-2 tabular-nums text-slate-300">{avg(a, s.n)}</td>
                      <td className="text-right px-2 tabular-nums text-white font-semibold">{avg(f + a, s.n)}</td>
                      {over(s).map((k, i) => (
                        <td key={i} className="text-right px-2 tabular-nums text-slate-300">
                          {pct(k, s.n)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-slate-400 text-xs mt-3">
            Medie a partita nelle partite di {c.name} con statistiche disponibili (dati API-Football). I cartellini
            contano ammonizioni ed espulsioni. Sono dati del passato, non previsioni: le probabilità delle prossime
            partite sono nei{" "}
            <Link to={competitionPath(c)} className="text-action-text hover:text-action-text-hover">
              pronostici di {c.name}
            </Link>
            ; per i gol vedi le{" "}
            <Link to={goalStatsPath(c)} className="text-action-text hover:text-action-text-hover">
              statistiche Under/Over
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
