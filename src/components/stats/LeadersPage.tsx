// /calcio/:competizione/marcatori – top scorers, assists, yellow and red cards of a competition (API-Football,
// refreshed daily by scripts/fetch-football.mjs).
import { useParams } from "react-router";
import { Trophy } from "lucide-react";
import { Link } from "../../lib/links";
import { useCompetitionData } from "../../lib/footballData";
import { usePageMeta } from "../../lib/pageMeta";
import { PRONOSTICI, competitionPath, goalStatsPath, leadersMeta, seasonName, standingsPath, type LeaderRow } from "../../lib/footballCore";
import { playerName } from "../../lib/playerNames.mjs";
import { playerPath } from "../../lib/players";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { TeamBadge } from "../calcio/MatchRow";
import { TeamName } from "../teams/TeamLink";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const th = "font-normal py-2.5 px-2 text-right whitespace-nowrap";
const td = "py-2.5 px-2 text-right tabular-nums";

type Col = { label: string; title: string; value: (r: LeaderRow) => string | number; main?: boolean };

function Board({ id, title, rows, cols }: { id: string; title: string; rows: LeaderRow[]; cols: Col[] }) {
  if (!rows.length) return null;
  return (
    <section className={card} aria-labelledby={id}>
      <h2 id={id} className="text-white text-xl mb-4">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="font-normal py-2.5 pr-2 text-left w-8">
                #
              </th>
              <th scope="col" className="font-normal py-2.5 px-2 text-left">
                Giocatore
              </th>
              <th scope="col" className="font-normal py-2.5 px-2 text-left">
                Squadra
              </th>
              {cols.map((c) => (
                <th key={c.label} scope="col" className={th} title={c.title}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const href = playerPath(r);
              const name = playerName(r);
              return (
                <tr key={`${r.id ?? r.name}-${i}`} className="border-b border-slate-800 last:border-0">
                  <td className="py-2.5 pr-2 text-slate-400 tabular-nums">{i + 1}</td>
                  <th scope="row" className="py-2.5 px-2 text-left font-normal text-white whitespace-nowrap">
                    {href ? (
                      <Link to={href} className="hover:text-action-text-hover underline-offset-2 hover:underline">
                        {name}
                      </Link>
                    ) : (
                      name
                    )}
                  </th>
                  <td className="py-2.5 px-2">
                    {r.team && (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <TeamBadge team={{ shortName: r.team.shortName, crest: r.team.crest, tla: "" }} />
                        <TeamName id={r.team.id} name={r.team.shortName} />
                      </span>
                    )}
                  </td>
                  {cols.map((c) => (
                    <td key={c.label} className={`${td} ${c.main ? "text-white font-semibold" : "text-slate-300"}`}>
                      {c.value(r)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const perGoal = (r: LeaderRow) => (r.goals ? Math.round(r.min / r.goals) : "–");

export function LeadersPage() {
  const { competizione } = useParams();
  const data = useCompetitionData(competizione);
  const c = data?.competition;
  usePageMeta(c?.leaders ? leadersMeta(c) : null);
  if (!c?.leaders?.scorers?.length) return <NotFoundPage />;
  const l = c.leaders;
  const season = seasonName(c);
  const updated = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "long" }).format(new Date(l.updatedAt));

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title={`Classifica marcatori ${c.name}${season ? ` ${season}` : ""}`}
        subtitle={`I migliori marcatori, gli assist e i giocatori più ammoniti ed espulsi di ${c.name}, con presenze e minuti. Aggiornata il ${updated}.`}
        breadcrumb={[
          { label: "Pronostici", to: PRONOSTICI },
          { label: c.name, to: competitionPath(c) },
          { label: "Marcatori" },
        ]}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Board
          id="marcatori"
          title="Marcatori"
          rows={l.scorers}
          cols={[
            { label: "Gol", title: "Gol segnati", value: (r) => r.goals, main: true },
            { label: "Rig.", title: "Gol su rigore", value: (r) => r.pen },
            { label: "Pres.", title: "Presenze", value: (r) => r.apps },
            { label: "Min/gol", title: "Minuti giocati per ogni gol", value: perGoal },
          ]}
        />
        <Board
          id="assist"
          title="Assist"
          rows={l.assists}
          cols={[
            { label: "Assist", title: "Assist", value: (r) => r.assists, main: true },
            { label: "Gol", title: "Gol segnati", value: (r) => r.goals },
            { label: "Pres.", title: "Presenze", value: (r) => r.apps },
          ]}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Board
            id="ammoniti"
            title="Ammonizioni"
            rows={l.yellow}
            cols={[
              { label: "Amm.", title: "Cartellini gialli", value: (r) => r.yellow, main: true },
              { label: "Pres.", title: "Presenze", value: (r) => r.apps },
            ]}
          />
          <Board
            id="espulsi"
            title="Espulsioni"
            rows={l.red}
            cols={[
              { label: "Esp.", title: "Cartellini rossi, anche per doppia ammonizione", value: (r) => r.red, main: true },
              { label: "Pres.", title: "Presenze", value: (r) => r.apps },
            ]}
          />
        </div>
        <p className="text-slate-400 text-sm">
          Dati API-Football, solo {c.name}. Vedi anche la{" "}
          <Link to={standingsPath(c)} className="text-action-text hover:text-action-text-hover">
            classifica
          </Link>{" "}
          e le{" "}
          <Link to={goalStatsPath(c)} className="text-action-text hover:text-action-text-hover">
            statistiche Under/Over
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
