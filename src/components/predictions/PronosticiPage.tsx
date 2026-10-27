// /pronostici – hub of the model's predictions: next football and NBA matches, the round pages,
// the tennis predictor and the verifiable track record of both models.
import { ChartColumn, ChevronRight, CircleDot, Goal, Dribbble } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "../../lib/links";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { MatchRow } from "../calcio/MatchRow";
import { BasketGameRow } from "../basket/BasketGameRow";
import { TrackRecordBox } from "./TrackRecordBox";
import { allMatches, competitions, formatUpdated, generatedAt, isLive, isUpcoming, matchdayPath } from "../../lib/football";
import { predictionFor } from "../../lib/predictions";
import { featuredMatchday } from "../../lib/matchdays";
import { basketPaths, isGameUpcoming, nbaGames } from "../../lib/basket";
import { basketPredictionFor } from "../../lib/basketPredict";
import { footballTrackRecord } from "../../lib/trackRecordFootball";
import { nbaTrackRecord } from "../../lib/trackRecordNba";
import { paths } from "../../routes";

const more = "inline-flex items-center gap-1 text-sm text-action-text hover:text-action-text-hover";

function Section({
  id,
  icon: Icon,
  title,
  link,
  children,
}: {
  id: string;
  icon: typeof Goal;
  title: string;
  link?: { to: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mb-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h2 id={id} className="flex items-center gap-2 text-white text-2xl">
          <Icon className="w-6 h-6 text-slate-300" aria-hidden="true" />
          {title}
        </h2>
        {link && (
          <Link to={link.to} className={more}>
            {link.label}
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PronosticiPage() {
  const football = allMatches
    .filter(({ match }) => (isUpcoming(match) || isLive(match)) && predictionFor(match.id))
    .slice(0, 12);
  const rounds = competitions
    .map((c) => ({ c, d: featuredMatchday(c) }))
    .filter((x): x is { c: (typeof competitions)[number]; d: NonNullable<ReturnType<typeof featuredMatchday>> } => !!x.d);
  const nba = nbaGames.filter((g) => isGameUpcoming(g) && basketPredictionFor(g.id)).slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={ChartColumn}
        title="Pronostici del modello statistico"
        subtitle="Probabilità calcolate dai dati per calcio, NBA e tennis, con i motivi di ogni stima e il bilancio dei pronostici passati, giusti e sbagliati."
        breadcrumb={[{ label: "Pronostici" }]}
        meta={<MetaItems items={[`Dati calcio aggiornati al ${formatUpdated(generatedAt)}`, "Stime statistiche, non consigli di gioco"]} />}
      />

      <div className="container mx-auto px-4 py-8">
        <Section
          id="calcio"
          icon={Goal}
          title="Calcio: prossime partite"
          link={{ to: paths.calcio, label: "Tutto il calendario" }}
        >
          {rounds.length > 0 && (
            <nav aria-label="Pronostici per giornata" className="flex flex-wrap gap-2 mb-4">
              {rounds.map(({ c, d }) => (
                <Link
                  key={c.slug}
                  to={matchdayPath(c, d.n)}
                  className="px-3 py-1.5 rounded-md text-sm border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                >
                  {c.name} · {d.n}ª giornata
                </Link>
              ))}
            </nav>
          )}
          {football.length > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              {football.map(({ competition, match }) => (
                <MatchRow
                  key={match.id}
                  competition={competition}
                  match={match}
                  prediction={predictionFor(match.id)}
                  showCompetition
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nessuna partita in programma con un pronostico in questo momento.</p>
          )}
          <TrackRecordBox record={footballTrackRecord()} sport="calcio" className="mt-6" />
        </Section>

        <Section
          id="nba"
          icon={Dribbble}
          title="NBA: prossime partite"
          link={{ to: basketPaths.nba, label: "Calendario NBA" }}
        >
          {nba.length > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              {nba.map((g) => (
                <BasketGameRow key={g.id} game={g} />
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nessuna partita NBA in programma con un pronostico in questo momento.</p>
          )}
          <TrackRecordBox record={nbaTrackRecord()} sport="nba" className="mt-6" />
        </Section>

        <Section id="tennis" icon={CircleDot} title="Tennis: chi vince tra due giocatori">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-300 mb-3">
              Scegli due giocatori tra i top 100 ATP o WTA e il formato della partita: il modello calcola la probabilità
              di vittoria e il risultato in set più probabile.
            </p>
            <Link to={paths.tennis} className={more}>
              Apri il calcolatore del tennis
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </Section>

        <section aria-labelledby="come" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="come" className="text-white text-lg mb-2">
            Come nascono questi pronostici
          </h2>
          <p className="text-slate-300 text-sm mb-2">
            Non c'è nessun "tipster" né intuito: per il calcio un modello di Poisson stima i gol attesi dai risultati
            delle ultime stagioni, per la NBA un modello a punti stima scarto e totale. Le probabilità che ne escono
            sono pubblicate tutte, insieme al bilancio di quelle passate.
          </p>
          <p className="text-slate-400 text-sm">
            I modelli non conoscono infortuni, squalifiche e turnover: usali come punto di partenza.{" "}
            <Link to={paths.metodologia} className="text-action-text hover:text-action-text-hover">
              La metodologia completa
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
