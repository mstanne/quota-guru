// /calcio/giocatori/:giocatore – a player: profile and season by season statistics (API-Football data, built by
// scripts/derive-players.mjs).
import { useParams } from "react-router";
import { Target, User } from "lucide-react";
import { Link } from "../../lib/links";
import { usePageMeta } from "../../lib/pageMeta";
import { footballPlayer } from "../../lib/players";
import { playerMeta } from "../../lib/playerMeta";
import { eventPath, formatDay, formatTime, leadersPath } from "../../lib/footballCore";
import { teamPaths } from "../../lib/teams";
import { NotFoundPage } from "../NotFoundPage";
import { PlayerSeasonDetail } from "./PlayerSeasonDetail";
import { PlayerHistory } from "./PlayerHistory";
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
    ...(p.availability
      ? ([
          [
            "Prossima partita",
            <span key="a" className={p.availability.doubtful ? "text-amber-300" : "text-red-300"}>
              {p.availability.doubtful ? "In dubbio" : "Indisponibile"}
              {p.availability.reason ? ` (${p.availability.reason.toLowerCase()})` : ""}
            </span>,
          ],
        ] as [string, React.ReactNode][])
      : []),
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

        <NextMatchCard player={p} />

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

        <PlayerHistory history={p.history} />
      </div>
    </div>
  );
}

type FootballPlayer = Exclude<ReturnType<typeof footballPlayer>, Promise<unknown> | null>;

/** One chance of the next match: share and fair odds. */
function Chance({ label, p, hint }: { label: string; p: number; hint: string }) {
  const pct = Math.round(p * 100);
  return (
    <div className="rounded-lg bg-slate-950/60 p-3" title={hint}>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-predict text-2xl font-semibold tabular-nums">{pct < 1 ? "<1" : pct}%</p>
      {p > 0 && <p className="text-slate-400 text-xs tabular-nums">quota equa {(1 / p).toFixed(2).replace(".", ",")}</p>}
    </div>
  );
}

/** The player's chances in his next match (model of the predictions, scripts/lib/scorers.mjs). */
function NextMatchCard({ player: p }: { player: FootballPlayer }) {
  const n = p.nextMatch;
  if (!n) return null;
  const opponent = n.side === "h" ? n.away.shortName : n.home.shortName;
  const chances: { label: string; p: number | undefined; hint: string }[] = [
    { label: "Segna almeno un gol", p: n.goal, hint: "Gol nei 90 minuti, rigori compresi" },
    { label: "Porta inviolata", p: n.cleanSheet, hint: `${opponent} non segna e lui gioca` },
    { label: "Ammonito o espulso", p: n.card, hint: "Almeno un cartellino nella partita" },
    { label: "Segna un rigore", p: n.penScored, hint: "È tra i rigoristi della squadra" },
    { label: "Para un rigore", p: n.penSaved, hint: "Rigore contro e parata" },
  ];
  const shown = chances.filter((c): c is { label: string; p: number; hint: string } => c.p != null);
  if (!shown.length) return null;
  return (
    <Card id="prossima-partita">
      <SectionTitle id="prossima-partita-titolo" icon={Target}>
        Probabilità nella prossima partita
      </SectionTitle>
      <p className="text-slate-300">
        {n.home.shortName} – {n.away.shortName} · {n.competition.name}{" "}
        <span className="text-slate-400 text-sm">
          ({formatDay(n.date)} ore {formatTime(n.date)})
        </span>
      </p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {shown.map((c) => (
          <Chance key={c.label} {...c} />
        ))}
      </div>
      <p className="text-slate-400 text-sm mt-3 max-w-3xl">
        Stime del modello dei nostri pronostici. Gol: i gol attesi della squadra contro {opponent}, divisi tra i giocatori
        in base ai gol ogni 90 minuti di questa stagione e ai minuti che gioca di solito. Cartellini: i cartellini attesi
        della squadra, divisi in base ai suoi ogni 90 minuti. Porta inviolata e rigori: per il portiere titolare e per i
        rigoristi abituali, dai rigori della squadra in questa stagione e nella scorsa. Non tiene conto della formazione
        ufficiale. La quota equa è 1 diviso la probabilità: una quota più alta del bookmaker indica un valore secondo il
        modello.
      </p>
      <Link
        // eventPath needs only the short names (teamSlug)
        to={eventPath(n.competition, { homeTeam: n.home, awayTeam: n.away } as unknown as Parameters<typeof eventPath>[1])}
        className="inline-block mt-3 text-action-text hover:text-action-text-hover"
      >
        Pronostico {n.home.shortName} – {n.away.shortName} e probabili marcatori →
      </Link>
    </Card>
  );
}
