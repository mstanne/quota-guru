// /calcio/giocatori/:giocatore – a player: profile and season by season statistics (API-Football data, built by
// scripts/derive-players.mjs).
import { useParams } from "react-router";
import { User } from "lucide-react";
import { Link } from "../../lib/links";
import { usePageMeta } from "../../lib/pageMeta";
import { footballPlayer } from "../../lib/players";
import { playerMeta } from "../../lib/playerMeta";
import { leadersPath } from "../../lib/footballCore";
import { teamPaths } from "../../lib/teams";
import { NotFoundPage } from "../NotFoundPage";
import { PlayerSeasonDetail } from "./PlayerSeasonDetail";
import { PageHeader } from "../layout/PageHeader";
import { TeamBadge } from "../calcio/MatchRow";
import { Card, Facts, SectionTitle, age, formatDate, num } from "../teams/TeamUi";

const th = "text-right font-normal py-2 px-2 whitespace-nowrap";
const td = "text-right px-2 py-2 tabular-nums";

export function PlayerPage() {
  const { giocatore } = useParams();
  const p = footballPlayer(giocatore);
  if (p instanceof Promise) throw p; // data still loading (Suspense)
  usePageMeta(p ? playerMeta(p) : null);
  if (!p) return <NotFoundPage />;

  const teamHref = `${teamPaths.football}/${p.team.slug}`;
  const facts: [string, React.ReactNode][] = [
    ["Nome completo", p.fullName],
    ...(p.birth ? ([["Data di nascita", `${formatDate(p.birth)} (${age(p.birth)} anni)`]] as [string, string][]) : []),
    ...(p.nationality ? ([["Nazionalità", p.nationality]] as [string, string][]) : []),
    ...(p.position ? ([["Ruolo", p.position]] as [string, string][]) : []),
    ...(p.number != null ? ([["Numero di maglia", String(p.number)]] as [string, string][]) : []),
    ...(p.height ? ([["Altezza", `${p.height} cm`]] as [string, string][]) : []),
    ...(p.weight ? ([["Peso", `${p.weight} kg`]] as [string, string][]) : []),
    [
      "Squadra",
      <Link key="t" to={teamHref} className="text-action-text hover:text-action-text-hover">
        {p.team.shortName}
      </Link>,
    ],
  ];
  const rank = (r: NonNullable<FootballPlayer["ranks"]>["scorers"], what: string) =>
    r && (
      <li>
        {r.rank}º nella{" "}
        <Link to={leadersPath({ slug: r.slug })} className="text-action-text hover:text-action-text-hover">
          classifica {what} di {r.competition}
        </Link>{" "}
        ({r.value})
      </li>
    );

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={User}
        title={p.name}
        subtitle={[p.position, p.team.shortName, p.competition?.name].filter(Boolean).join(" · ")}
        breadcrumb={[
          { label: "Squadre", to: teamPaths.football },
          { label: p.team.shortName, to: teamHref },
          { label: p.name },
        ]}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card id="profilo">
          <SectionTitle id="profilo-titolo" icon={User}>
            Profilo
          </SectionTitle>
          <Facts rows={facts} />
          {(p.ranks?.scorers || p.ranks?.assists) && (
            <ul className="mt-4 space-y-1 text-sm text-slate-300">
              {rank(p.ranks?.scorers, "marcatori")}
              {rank(p.ranks?.assists, "assist")}
            </ul>
          )}
        </Card>

        <PlayerSeasonDetail player={p} />

        <Card id="stagioni">
          <SectionTitle id="stagioni-titolo" icon={User}>
            Carriera: statistiche stagione per stagione
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-slate-400 text-xs mb-2">
                Tutte le competizioni della squadra in quella stagione (campionato e coppe).
              </caption>
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th scope="col" className="text-left font-normal py-2 pr-2">Stagione</th>
                  <th scope="col" className="text-left font-normal py-2 px-2">Squadra</th>
                  <th scope="col" className={th}>Pres.</th>
                  <th scope="col" className={th}>Tit.</th>
                  <th scope="col" className={th}>Minuti</th>
                  <th scope="col" className={th}>Gol</th>
                  <th scope="col" className={th}>Assist</th>
                  <th scope="col" className={th}>Amm.</th>
                  <th scope="col" className={th}>Esp.</th>
                  <th scope="col" className={th}>Voto</th>
                </tr>
              </thead>
              <tbody>
                {p.seasons.map((s) => (
                  <tr key={`${s.season}-${s.team.id}`} className="border-b border-slate-800 last:border-0">
                    <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">
                      {s.label}
                    </th>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <Link to={`${teamPaths.football}/${s.team.slug}`} className="flex items-center gap-2 text-slate-200 hover:text-white">
                        <TeamBadge team={{ shortName: s.team.shortName, crest: s.team.crest, tla: "" }} />
                        {s.team.shortName}
                      </Link>
                    </td>
                    <td className={`${td} text-slate-300`}>{s.apps}</td>
                    <td className={`${td} text-slate-300`}>{s.starts}</td>
                    <td className={`${td} text-slate-300`}>{s.min}</td>
                    <td className={`${td} text-white font-semibold`}>{s.goals}</td>
                    <td className={`${td} text-slate-300`}>{s.assists}</td>
                    <td className={`${td} text-slate-300`}>{s.yellow}</td>
                    <td className={`${td} text-slate-300`}>{s.red}</td>
                    <td className={`${td} text-slate-300`}>{s.rating != null ? num(s.rating, 2) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-400 text-xs mt-3">Statistiche e voti: dati API-Football.</p>
        </Card>
      </div>
    </div>
  );
}

type FootballPlayer = Exclude<ReturnType<typeof footballPlayer>, Promise<unknown> | null>;
