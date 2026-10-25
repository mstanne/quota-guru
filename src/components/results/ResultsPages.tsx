// /calcio/:competizione/risultati, /basket/nba/risultati and /basket/nba/risultati/:mese:
// every finished match with its page (archived ones included), so each match page is reachable from the site.
import { useParams } from "react-router";
import { ListChecks } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { NotFoundPage } from "../NotFoundPage";
import { TeamName } from "../teams/TeamLink";
import { formatDay, formatTime, standingsPath } from "../../lib/footballCore";
import { findCompetition } from "../../lib/football";
import {
  footballResults,
  monthLabel,
  nbaResults,
  nbaResultsPath,
  resultsIndex,
  resultsRoutes,
  type ResultRow,
} from "../../lib/results";
import { usePageMeta } from "../../lib/pageMeta";

/** Title and description of a results URL (same as in the pre-rendered page). */
const metaFor = (path: string) => resultsRoutes().find((r) => r.path === path) ?? null;

function Row({ r, sport }: { r: ResultRow; sport: "football" | "nba" }) {
  const won = (side: 0 | 1) => (r.score[side] > r.score[1 - side] ? "text-white font-semibold" : "text-slate-300");
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <span className="w-12 shrink-0 tabular-nums text-slate-400">{formatTime(r.date)}</span>
      <span className="flex-1 min-w-0 flex items-center justify-end gap-2 text-right">
        <TeamName id={r.home.id} name={r.home.name} sport={sport} className={won(0)} />
      </span>
      <Link
        to={r.path}
        className="shrink-0 rounded-md bg-slate-800 px-2.5 py-1 tabular-nums text-white hover:bg-slate-700"
        aria-label={`${r.home.name} ${r.score[0]}-${r.score[1]} ${r.away.name}: scheda della partita`}
      >
        {r.score[0]}–{r.score[1]}
      </Link>
      <span className="flex-1 min-w-0">
        <TeamName id={r.away.id} name={r.away.name} sport={sport} className={won(1)} />
      </span>
    </li>
  );
}

function Group({ title, rows, sport }: { title: string; rows: ResultRow[]; sport: "football" | "nba" }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">
      <h3 className="text-white py-2 first-letter:uppercase">{title}</h3>
      <ul className="divide-y divide-slate-800">
        {rows.map((r) => (
          <Row key={r.id} r={r} sport={sport} />
        ))}
      </ul>
    </section>
  );
}

export function FootballResultsPage() {
  const { competizione } = useParams();
  const competition = findCompetition(competizione);
  usePageMeta(metaFor(`/calcio/${competizione}/risultati`));
  const data = footballResults(competizione);
  if (data instanceof Promise) throw data; // loading (Suspense)
  if (!competition || !data) return <NotFoundPage />;
  const total = data.reduce((t, s) => t + s.rounds.reduce((u, r) => u + r.matches.length, 0), 0);
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={`Risultati ${competition.name}`}
        icon={ListChecks}
        subtitle="Tutte le partite giocate, dalla giornata più recente. Clicca sul risultato per la scheda della partita."
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: competition.name, to: `/calcio/${competition.slug}` },
          { label: "Risultati" },
        ]}
        meta={<span>{total} partite</span>}
      >
        <Link to={standingsPath(competition)} className="text-sm text-action-text hover:text-action-text-hover">
          Classifica {competition.name}
        </Link>
      </PageHeader>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {data.map((s) => (
          <section key={s.season} aria-labelledby={`stagione-${s.season}`} className="space-y-4">
            {s.label && (
              <h2 id={`stagione-${s.season}`} className="text-white text-xl">
                Stagione {s.label}
              </h2>
            )}
            {s.rounds.map((r) => (
              <Group key={r.round} title={r.round} rows={r.matches} sport="football" />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export function NbaResultsPage() {
  const { mese } = useParams();
  usePageMeta(metaFor(nbaResultsPath(mese)));
  const data = nbaResults();
  if (data instanceof Promise) throw data; // loading (Suspense)
  const months = resultsIndex.nba; // newest first
  if (!mese) {
    // index: one link per month (the games are on the month pages, so each game is listed once)
    return (
      <div className="min-h-screen bg-slate-950">
        <PageHeader
          title="Risultati NBA"
          icon={ListChecks}
          subtitle="Le partite giocate mese per mese, in orario italiano, con il link alla scheda di ogni partita."
          breadcrumb={[{ label: "Basket", to: "/basket" }, { label: "NBA", to: "/basket/nba" }, { label: "Risultati" }]}
        />
        <div className="container mx-auto px-4 py-8">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {months.map((m) => (
              <li key={m.month}>
                <Link
                  to={nbaResultsPath(m.month)}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white hover:border-slate-600"
                >
                  <span className="first-letter:uppercase">{monthLabel(m.month)}</span>
                  <span className="text-slate-400 text-sm">{m.count} partite</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  const month = mese;
  const days = data[month];
  if (!days) return <NotFoundPage />;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={`Risultati NBA · ${monthLabel(month)}`}
        icon={ListChecks}
        subtitle="Le partite giocate, in orario italiano. Clicca sul risultato per la scheda della partita."
        breadcrumb={[
          { label: "Basket", to: "/basket" },
          { label: "NBA", to: "/basket/nba" },
          { label: "Risultati", to: nbaResultsPath() },
          { label: monthLabel(month) },
        ]}
      >
        {months.length > 1 && (
          <nav aria-label="Mesi" className="flex flex-wrap gap-2 text-sm">
            {months.map(({ month: m }) => (
              <Link
                key={m}
                to={nbaResultsPath(m)}
                className={`rounded-md border px-3 py-1.5 ${m === month ? "border-slate-500 text-white" : "border-slate-700 text-slate-300 hover:text-white"}`}
              >
                {monthLabel(m)}
              </Link>
            ))}
          </nav>
        )}
      </PageHeader>
      <div className="container mx-auto px-4 py-8 space-y-4">
        {days.map((d) => (
          <Group key={d.day} title={formatDay(d.games[0].date)} rows={d.games} sport="nba" />
        ))}
      </div>
    </div>
  );
}
