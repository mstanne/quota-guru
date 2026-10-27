// /calcio/:competizione/giornata/:numero – every match of one round with the model's probabilities,
// the data points behind them and, for played matches, how the prediction went.
import { useParams } from "react-router";
import { ChevronLeft, ChevronRight, ListChecks, Check, X as XIcon, CalendarDays } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "./DataUpdatedNote";
import { TeamBadge } from "./MatchRow";
import { ProbabilityBar, ReasonList, ConfidenceBadge } from "../predictions/PredictionUi";
import { ArchivedOrNotFound } from "../../lib/archive";
import { usePageMeta } from "../../lib/pageMeta";
import {
  competitionPath,
  formatDay,
  formatTime,
  generatedAt,
  isFinished,
  isLive,
  isResultPending,
  matchdayPath,
  matchPath,
  statusLabel,
  type Competition,
  type Match,
} from "../../lib/football";
import { predictionFor, pct, pickLabel, type Prediction } from "../../lib/predictions";
import { findMatchday, matchdayDates, matchdayLabel, matchdayMeta, matchdaysOf, type Matchday } from "../../lib/matchdays";
import { footballReasons } from "../../lib/predictionReasons";

const card = "rounded-xl border border-slate-800 bg-slate-900";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Three data-based lines about the whole round (only from upcoming matches with a prediction). */
function roundSummary(d: Matchday) {
  const open = d.matches
    .filter((m) => !isFinished(m) && !isLive(m) && !isResultPending(m))
    .map((m) => ({ m, p: predictionFor(m.id) }))
    .filter((x): x is { m: Match; p: Prediction } => !!x.p);
  if (open.length < 2) return [];
  const name = (m: Match) => `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`;
  const top = (p: Prediction) => p.p.indexOf(Math.max(...p.p));
  const outcomeText = (m: Match, i: number) =>
    i === 1 ? "pareggio" : `vittoria ${i === 0 ? m.homeTeam.shortName : m.awayTeam.shortName}`;
  const home = open.filter(({ p }) => top(p) === 0).length;
  const away = open.filter(({ p }) => top(p) === 2).length;
  const surest = [...open].sort((a, b) => Math.max(...b.p.p) - Math.max(...a.p.p))[0];
  const closest = [...open].sort((a, b) => Math.max(...a.p.p) - Math.max(...b.p.p))[0];
  const goals = [...open].sort((a, b) => b.p.over["2.5"] - a.p.over["2.5"])[0];
  const out = [
    `Su ${open.length} partite ancora da giocare il modello vede favorita la squadra di casa in ${home} e quella in trasferta in ${away}${open.length - home - away ? `; nelle altre ${open.length - home - away} il pareggio è l'esito più probabile` : ""}.`,
    `L'esito più netto è in ${name(surest.m)}: ${outcomeText(surest.m, top(surest.p))} al ${pct(Math.max(...surest.p.p))}. La più incerta: ${name(closest.m)}, nessun esito oltre il ${pct(Math.max(...closest.p.p))}.`,
    `Più gol attesi in ${name(goals.m)}: ${(goals.p.xg[0] + goals.p.xg[1]).toFixed(1).replace(".", ",")} in media, Over 2,5 al ${pct(goals.p.over["2.5"])}.`,
  ];
  return out;
}

function MatchCard({ c, m }: { c: Competition; m: Match }) {
  const p = predictionFor(m.id);
  const finished = isFinished(m);
  const live = isLive(m);
  const pending = isResultPending(m);
  const ft = m.score.fullTime;
  const open = !finished && !live && !pending;
  const showPred = p && (open || pending || (finished && p.pre));
  const hit =
    finished && p?.pre && ft.home != null && ft.away != null
      ? p.p.indexOf(Math.max(...p.p)) === (ft.home > ft.away ? 0 : ft.home === ft.away ? 1 : 2)
      : null;
  const reason = open && p ? footballReasons(p, c, m)[0] : undefined;
  const home = m.homeTeam.shortName;
  const away = m.awayTeam.shortName;

  return (
    <article className={`${card} p-4 sm:p-5`} aria-labelledby={`m-${m.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-sm">
        <span className="text-slate-400 first-letter:uppercase">
          {formatDay(m.utcDate)} · {formatTime(m.utcDate)}
        </span>
        {(finished || live || pending || m.status === "POSTPONED") && (
          <span className={live ? "text-red-400 font-semibold" : pending ? "text-warn" : "text-slate-400"}>
            {statusLabel(m)}
          </span>
        )}
        {open && p && <ConfidenceBadge confidence={p.confidence} />}
      </div>

      <h2 id={`m-${m.id}`} className="flex items-center gap-3 text-white text-lg mb-3">
        <span className="flex items-center gap-2 min-w-0">
          <TeamBadge team={m.homeTeam} />
          <span className="truncate">{home}</span>
        </span>
        {finished || live ? (
          <span className="tabular-nums text-xl shrink-0">
            {ft.home ?? 0}–{ft.away ?? 0}
          </span>
        ) : (
          <span className="text-slate-500 shrink-0">–</span>
        )}
        <span className="flex items-center gap-2 min-w-0">
          <TeamBadge team={m.awayTeam} />
          <span className="truncate">{away}</span>
        </span>
      </h2>

      {showPred && p && (
        <>
          <ProbabilityBar prediction={p} home={home} away={away} showTeams={false} />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="text-slate-400">
              {open ? "Esito più probabile: " : "Indicato prima della partita: "}
              <strong className="text-predict">{pickLabel(p, home, away)}</strong>
            </span>
            {open && (
              <>
                <span className="text-slate-400 tabular-nums">
                  Over 2,5 <span className="text-white">{pct(p.over["2.5"])}</span>
                </span>
                <span className="text-slate-400 tabular-nums">
                  Goal <span className="text-white">{pct(p.btts)}</span>
                </span>
              </>
            )}
            {hit !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${
                  hit ? "bg-best text-best-foreground" : "bg-slate-700 text-white"
                }`}
              >
                {hit ? <Check className="w-4 h-4" aria-hidden="true" /> : <XIcon className="w-4 h-4" aria-hidden="true" />}
                {hit ? "Corretto" : "Sbagliato"}
              </span>
            )}
          </div>
          {reason && (
            <div className="mt-3">
              <ReasonList reasons={[reason]} compact />
            </div>
          )}
        </>
      )}
      {!showPred && open && <p className="text-slate-400 text-sm">Dati insufficienti per un pronostico affidabile.</p>}

      <Link
        to={matchPath(c, m)}
        className="inline-flex items-center gap-1 mt-4 text-sm text-action-text hover:text-action-text-hover"
      >
        {open ? "Analisi completa" : "Scheda della partita"}
        <span className="sr-only">
          {" "}
          {home} – {away}
        </span>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function MatchdayPage() {
  const { competizione, numero } = useParams();
  const { competition: c, matchday: d } = findMatchday(competizione, numero);
  usePageMeta(c && d ? matchdayMeta(c, d) : null);
  if (!c || !d) return <ArchivedOrNotFound />;

  const list = matchdaysOf(c);
  const i = list.indexOf(d);
  const prev = list[i - 1];
  const next = list[i + 1];
  const label = matchdayLabel(d);
  const summary = roundSummary(d);
  const done = d.matches.every(isFinished);

  const navBtn =
    "inline-flex items-center gap-1 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white text-sm";

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={CalendarDays}
        title={`Pronostici ${c.name}: ${label}`}
        subtitle={`${cap(matchdayDates(d))}. ${done ? "Tutte le partite sono state giocate: ecco come sono andati i pronostici." : "Le probabilità del modello statistico per ogni partita, con i dati che le spiegano."}`}
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: c.name, to: competitionPath(c) },
          { label: cap(label) },
        ]}
        meta={<DataUpdatedNote generatedAt={generatedAt} />}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <nav aria-label="Altre giornate" className="flex flex-wrap items-center gap-2 mb-6">
          {prev && (
            <Link to={matchdayPath(c, prev.n)} className={navBtn}>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              {prev.n}ª giornata
            </Link>
          )}
          {next && (
            <Link to={matchdayPath(c, next.n)} className={navBtn}>
              {next.n}ª giornata
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
          <Link to={competitionPath(c)} className={`${navBtn} sm:ml-auto`}>
            <ListChecks className="w-4 h-4" aria-hidden="true" />
            Calendario {c.name}
          </Link>
        </nav>

        {summary.length > 0 && (
          <section aria-labelledby="sintesi" className={`${card} p-5 mb-6`}>
            <h2 id="sintesi" className="text-white text-lg mb-3">
              La giornata in sintesi
            </h2>
            <ReasonList reasons={summary} compact />
          </section>
        )}

        <div className="space-y-4">
          {d.matches.map((m) => (
            <MatchCard key={m.id} c={c} m={m} />
          ))}
        </div>

        <p className="text-slate-400 text-xs mt-8">
          Probabilità stimate da un modello statistico (Poisson con correzione Dixon-Coles) sui gol fatti e subiti:
          non conosce infortuni, squalifiche e turnover. Non sono quote né consigli di gioco.{" "}
          <Link to="/metodologia#pronostici" className="text-action-text hover:text-action-text-hover">
            Come funziona il modello
          </Link>
        </p>
      </div>
    </div>
  );
}
