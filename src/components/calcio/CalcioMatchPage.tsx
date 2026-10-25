import { Fragment } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, History, Info, ListOrdered, TrendingUp, Users } from "lucide-react";
import {
  competitionPath,
  findCompetition,
  findMatch,
  formatDay,
  formatShortDate,
  formatTime,
  headToHead,
  isFinished,
  isLive,
  mainTable,
  recentForm,
  roundLabel,
  standingOf,
  standingsPath,
  statusLabel,
  type Competition,
  type Match,
  type StandingRow,
  matchMeta,
} from "../../lib/football";
import { generatedAt } from "../../lib/football";
import { usePageMeta } from "../../lib/pageMeta";
import { footballEditorial } from "../../lib/editorial";
import { MatchEditorial } from "../editorial/MatchEditorial";
import { predictionFor } from "../../lib/predictions";
import { PredictionPanel } from "../predictions/PredictionUi";
import { MatchRow, TeamBadge } from "./MatchRow";
import { DataUpdatedNote } from "./DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";

function SectionTitle({ icon: Icon, children }: { icon: typeof Info; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-white text-xl mb-4">
      <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
      {children}
    </h2>
  );
}

const FORM_STYLE = {
  V: "bg-best text-best-foreground",
  N: "bg-slate-500 text-white",
  P: "bg-live text-white",
} as const;
const FORM_TITLE = { V: "Vittoria", N: "Pareggio", P: "Sconfitta" } as const;

function FormRow({ competition, teamId }: { competition: Competition; teamId: number }) {
  const form = recentForm(competition, teamId);
  if (form.length === 0) return <p className="text-slate-400 text-sm">Nessuna partita recente nei dati.</p>;
  return (
    <ol className="flex gap-1.5" aria-label="Ultimi risultati, dal più recente">
      {form.map(({ result, match }) => (
        <li key={match.id}>
          <span
            title={`${FORM_TITLE[result]}: ${match.homeTeam.shortName} ${match.score.fullTime.home}-${match.score.fullTime.away} ${match.awayTeam.shortName}`}
            className={`w-7 h-7 rounded inline-flex items-center justify-center text-xs font-semibold ${FORM_STYLE[result]}`}
          >
            {result}
          </span>
        </li>
      ))}
    </ol>
  );
}

function StatsComparison({ home, away }: { home?: StandingRow; away?: StandingRow }) {
  if (!home || !away) return <p className="text-slate-400">Classifica non disponibile per questa competizione.</p>;
  const avg = (r: StandingRow, v: number) => (r.playedGames ? (v / r.playedGames).toFixed(2).replace(".", ",") : "–");
  const rows: [string, string | number, string | number][] = [
    ["Posizione", `${home.position}º`, `${away.position}º`],
    ["Punti", home.points, away.points],
    ["Partite giocate", home.playedGames, away.playedGames],
    [
      "Vittorie / Pareggi / Sconfitte",
      `${home.won} / ${home.draw} / ${home.lost}`,
      `${away.won} / ${away.draw} / ${away.lost}`,
    ],
    ["Gol fatti", home.goalsFor, away.goalsFor],
    ["Gol subiti", home.goalsAgainst, away.goalsAgainst],
    [
      "Differenza reti",
      home.goalDifference > 0 ? `+${home.goalDifference}` : home.goalDifference,
      away.goalDifference > 0 ? `+${away.goalDifference}` : away.goalDifference,
    ],
    ["Media gol fatti", avg(home, home.goalsFor), avg(away, away.goalsFor)],
    ["Media gol subiti", avg(home, home.goalsAgainst), avg(away, away.goalsAgainst)],
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-slate-400 border-b border-slate-800">
          <th scope="col" className="text-left font-normal py-2">
            {home.team.shortName}
          </th>
          <th scope="col" className="font-normal py-2">
            <span className="sr-only">Statistica</span>
          </th>
          <th scope="col" className="text-right font-normal py-2">
            {away.team.shortName}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, h, a]) => (
          <tr key={label} className="border-b border-slate-800 last:border-0">
            <td className="py-2.5 text-white tabular-nums">{h}</td>
            <th scope="row" className="py-2.5 text-center text-slate-400 font-normal">
              {label}
            </th>
            <td className="py-2.5 text-right text-white tabular-nums">{a}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MiniStandings({ competition, match }: { competition: Competition; match: Match }) {
  const table = mainTable(competition);
  if (table.length === 0) return null;
  const ids = [match.homeTeam.id, match.awayTeam.id];
  const positions = table.filter((r) => ids.includes(r.team.id)).map((r) => r.position);
  // Show two positions above and below each team; a gap row marks skipped positions.
  const near = (pos: number) => positions.some((p) => Math.abs(p - pos) <= 2);
  const slice = table.filter((r) => near(r.position));
  return (
    <section className={card} aria-labelledby="classifica">
      <SectionTitle icon={ListOrdered}>
        <span id="classifica">Classifica</span>
      </SectionTitle>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th scope="col" className="text-left font-normal py-2 w-8">
              #
            </th>
            <th scope="col" className="text-left font-normal py-2">
              Squadra
            </th>
            <th scope="col" className="text-right font-normal py-2">
              <abbr title="Partite giocate">G</abbr>
            </th>
            <th scope="col" className="text-right font-normal py-2">
              <abbr title="Differenza reti">DR</abbr>
            </th>
            <th scope="col" className="text-right font-normal py-2">
              Pt
            </th>
          </tr>
        </thead>
        <tbody>
          {slice.map((r, i) => {
            const highlight = ids.includes(r.team.id);
            const gap = i > 0 && r.position - slice[i - 1].position > 1;
            return (
              <Fragment key={r.team.id}>
                {gap && (
                  <tr aria-hidden="true">
                    <td colSpan={5} className="py-1 text-center text-slate-400">
                      ⋯
                    </td>
                  </tr>
                )}
                <tr className={`border-b border-slate-800 last:border-0 ${highlight ? "bg-slate-700/50" : ""}`}>
                  <td className={`py-2 tabular-nums ${highlight ? "text-white" : "text-slate-400"}`}>{r.position}</td>
                  <td className={`py-2 ${highlight ? "text-white font-medium" : "text-slate-300"}`}>
                    {r.team.shortName}
                  </td>
                  <td className="py-2 text-right text-slate-300 tabular-nums">{r.playedGames}</td>
                  <td className="py-2 text-right text-slate-300 tabular-nums">
                    {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                  </td>
                  <td className="py-2 text-right text-white tabular-nums">{r.points}</td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <Link
        to={standingsPath(competition)}
        className="inline-block mt-4 text-action-text hover:text-action-text-hover text-sm"
      >
        Classifica completa {competition.name} →
      </Link>
    </section>
  );
}

/** /calcio/:competizione/:partita */
export function CalcioMatchPage() {
  const { competizione, partita } = useParams();
  const competition = findCompetition(competizione);
  const match = findMatch(competition, partita);
  usePageMeta(competition && match ? matchMeta(competition, match) : null);
  if (!competition || !match) return <NotFoundPage />;

  const finished = isFinished(match);
  const live = isLive(match);
  const ft = match.score.fullTime;
  const ht = match.score.halfTime;
  const home = standingOf(competition, match.homeTeam.id);
  const away = standingOf(competition, match.awayTeam.id);
  const h2h = headToHead(match);
  const prediction = predictionFor(match.id);
  const sameRound = competition.matches.filter(
    (m) => m.matchday === match.matchday && m.stage === match.stage && m.id !== match.id,
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <nav aria-label="Percorso" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <Link to="/calcio" className="hover:text-white">
              Calcio
            </Link>
            <span aria-hidden="true">›</span>
            <Link to={competitionPath(competition)} className="hover:text-white">
              {competition.name}
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-slate-300">
              {match.homeTeam.shortName} – {match.awayTeam.shortName}
            </span>
          </nav>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-sm">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">{competition.name}</span>
            {roundLabel(match) && (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">{roundLabel(match)}</span>
            )}
            <span
              className={`px-2 py-0.5 rounded-md ${live ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300"}`}
            >
              {statusLabel(match)}
            </span>
          </div>

          <h1 className="sr-only">
            {match.homeTeam.shortName} – {match.awayTeam.shortName}, {competition.name}
          </h1>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center gap-3">
              <TeamBadge team={match.homeTeam} size="lg" />
              <span className="text-white text-lg sm:text-2xl">{match.homeTeam.shortName}</span>
            </div>
            <div className="text-center">
              {finished || live ? (
                <>
                  <div className="text-white text-4xl sm:text-5xl tabular-nums">
                    {ft.home ?? 0} <span className="text-slate-400">–</span> {ft.away ?? 0}
                  </div>
                  {ht.home !== null && (
                    <div className="text-slate-400 text-sm mt-1">
                      1º tempo {ht.home}–{ht.away}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-white text-3xl sm:text-4xl tabular-nums">{formatTime(match.utcDate)}</div>
                  <div className="text-slate-400 text-sm mt-1 first-letter:uppercase">{formatDay(match.utcDate)}</div>
                </>
              )}
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <TeamBadge team={match.awayTeam} size="lg" />
              <span className="text-white text-lg sm:text-2xl">{match.awayTeam.shortName}</span>
            </div>
          </div>
          <DataUpdatedNote generatedAt={generatedAt} className="justify-center mt-6" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {prediction && (!finished || prediction.pre) && (
            <PredictionPanel
              prediction={prediction}
              home={match.homeTeam.shortName}
              away={match.awayTeam.shortName}
              result={finished && ft.home !== null && ft.away !== null ? { home: ft.home, away: ft.away } : null}
            />
          )}
          <MatchEditorial article={footballEditorial({ comp: competition, match, h2h, generatedAt })} />

          <section className={card} aria-labelledby="confronto">
            <SectionTitle icon={TrendingUp}>
              <span id="confronto">Le squadre a confronto</span>
            </SectionTitle>
            <StatsComparison home={home} away={away} />
          </section>

          <section className={card} aria-labelledby="forma">
            <SectionTitle icon={Users}>
              <span id="forma">Forma recente</span>
            </SectionTitle>
            <div className="grid sm:grid-cols-2 gap-5">
              {[match.homeTeam, match.awayTeam].map((t) => (
                <div key={t.id}>
                  <p className="text-slate-300 mb-2">{t.shortName}</p>
                  <FormRow competition={competition} teamId={t.id} />
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs mt-4">
              Ultime partite di {competition.name} presenti nei dati, dalla più recente.
            </p>
          </section>

          {h2h && h2h.matches.length > 0 && (
            <section className={card} aria-labelledby="precedenti">
              <SectionTitle icon={History}>
                <span id="precedenti">Precedenti</span>
              </SectionTitle>
              <ul className="divide-y divide-slate-800">
                {h2h.matches.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="w-24 text-slate-400 tabular-nums">{formatShortDate(p.utcDate)}</span>
                    <span className="flex-1 text-white">
                      {p.homeTeam.shortName}{" "}
                      <span className="tabular-nums text-white mx-1">
                        {p.score.fullTime.home}–{p.score.fullTime.away}
                      </span>{" "}
                      {p.awayTeam.shortName}
                    </span>
                    <span className="hidden sm:block text-slate-400">{p.competition}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6 min-w-0">
          <section className={card} aria-labelledby="info">
            <SectionTitle icon={Info}>
              <span id="info">Informazioni</span>
            </SectionTitle>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Data</dt>
                <dd className="text-white text-right first-letter:uppercase">{formatDay(match.utcDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Orario</dt>
                <dd className="text-white tabular-nums">{formatTime(match.utcDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Competizione</dt>
                <dd className="text-white text-right">{competition.name}</dd>
              </div>
              {roundLabel(match) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Turno</dt>
                  <dd className="text-white text-right">{roundLabel(match)}</dd>
                </div>
              )}
              {match.referee && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Arbitro</dt>
                  <dd className="text-white text-right">{match.referee}</dd>
                </div>
              )}
            </dl>
          </section>
          <MiniStandings competition={competition} match={match} />
        </aside>

        {sameRound.length > 0 && (
          <section className="lg:col-span-3" aria-labelledby="stesso-turno">
            <h2 id="stesso-turno" className="flex items-center gap-2 text-white text-xl mb-4">
              <CalendarDays className="w-5 h-5 text-slate-300" aria-hidden="true" />
              Altre partite – {roundLabel(match) || competition.name}
            </h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              {sameRound.map((m) => (
                <MatchRow key={m.id} competition={competition} match={m} prediction={predictionFor(m.id)} />
              ))}
            </div>
          </section>
        )}

        <div className="lg:col-span-3">
          <Link
            to={competitionPath(competition)}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Tutte le partite di {competition.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
