// /pronostici/nazionali — summary page of the national teams: Italy's next matches, every national-team match of the
// next days with the model's 1X2, the competitions in the data with their pages, the team pages and past editions.
import { Flag, ListOrdered, ShieldCheck, Target, Trophy, Users } from "lucide-react";
import { Link } from "../../lib/links";
import { paths } from "../../routes";
import { competitionPath, isLive, isUpcoming, romeDay, standingsPath } from "../../lib/footballCore";
import { useNationalCompetitionData } from "../../lib/footballData";
import { nationalHubMeta } from "../../lib/nationalHub";
import { nationalTrackRecord } from "../../lib/trackRecordFootball";
import { hasSeasons, seasonsPath } from "../../lib/seasons";
import { findFootballRef, teamPaths } from "../../lib/teams";
import { usePageMeta } from "../../lib/pageMeta";
import { PageHeader } from "../layout/PageHeader";
import { MatchList, type MatchListRow } from "../calcio/MatchList";
import { TrackRecordBox } from "./TrackRecordBox";

const card = "rounded-xl border border-slate-800 bg-slate-900";
const linkCls = "text-action-text hover:text-action-text-hover";
const ITALY = "Italia";

export function NationalHubPage() {
  usePageMeta(nationalHubMeta());
  const data = useNationalCompetitionData();
  const rows: MatchListRow[] = data
    .flatMap((d) =>
      d.competition.matches
        .filter((m) => isUpcoming(m) || isLive(m))
        .map((m) => ({ competition: d.competition, match: m, prediction: d.prediction(m.id) })),
    )
    .sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));
  const italy = rows.filter((r) => r.match.homeTeam.name === ITALY || r.match.awayTeam.name === ITALY);
  const italyRef = findFootballRef("italia");
  // the next week of matches: the list stays readable during an international window
  const lastDay = romeDay(new Date(Date.now() + 6 * 86400000).toISOString());
  const week = rows.filter((r) => romeDay(r.match.utcDate) <= lastDay);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Flag}
        title="Pronostici nazionali"
        subtitle="Le partite delle nazionali con le probabilità 1X2 del modello statistico: Italia, Nations League, qualificazioni, tornei e amichevoli."
        breadcrumb={[{ label: "Pronostici", to: paths.pronostici }, { label: "Nazionali" }]}
      />
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <TrackRecordBox record={nationalTrackRecord()} sport="calcio" />

        <section aria-labelledby="italia" className="space-y-3">
          <h2 id="italia" className="text-white text-2xl">
            L'Italia
          </h2>
          {italy.length ? (
            <MatchList rows={italy} idPrefix="italia" />
          ) : (
            <p className="text-slate-300">Nessuna partita dell'Italia in calendario nei prossimi giorni.</p>
          )}
          {italyRef && (
            <Link to={`${teamPaths.football}/${italyRef.slug}`} className={`${linkCls} inline-flex items-center gap-2 text-sm`}>
              <Users className="w-4 h-4" aria-hidden="true" />
              Scheda della nazionale: risultati, bilancio e convocati
            </Link>
          )}
        </section>

        <section aria-labelledby="prossime" className="space-y-3">
          <h2 id="prossime" className="text-white text-2xl">
            Le partite dei prossimi giorni
          </h2>
          {week.length ? (
            <MatchList rows={week} idPrefix="nazionali" />
          ) : (
            <p className="text-slate-300">
              Nessuna partita delle nazionali nei prossimi 7 giorni: le nazionali giocano nelle finestre internazionali
              (di solito marzo, giugno, settembre, ottobre e novembre).
            </p>
          )}
        </section>

        {data.length > 0 && (
          <section aria-labelledby="competizioni" className="space-y-3">
            <h2 id="competizioni" className="text-white text-2xl">
              Le competizioni
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.map(({ competition: c }) => {
                const next = c.matches.filter((m) => isUpcoming(m)).length;
                return (
                  <li key={c.slug} className={`${card} p-4 space-y-2`}>
                    <h3 className="text-white text-lg">
                      <Link to={competitionPath(c)} className="hover:underline">
                        {c.name}
                      </Link>
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {next ? `${next} ${next === 1 ? "partita in programma" : "partite in programma"}` : "Nessuna partita in programma"}
                    </p>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <Link to={competitionPath(c)} className={linkCls}>
                        Pronostici
                      </Link>
                      {c.standings.length > 0 && (
                        <Link to={standingsPath(c)} className={`${linkCls} inline-flex items-center gap-1`}>
                          <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
                          {c.standings.length > 1 ? "Gironi" : "Classifica"}
                        </Link>
                      )}
                      {hasSeasons(c.slug) && (
                        <Link to={seasonsPath(c.slug)} className={`${linkCls} inline-flex items-center gap-1`}>
                          <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                          Edizioni passate
                        </Link>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="altro" className={`${card} p-5 space-y-3`}>
          <h2 id="altro" className="text-white text-xl">
            Da qui puoi anche
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to={`${teamPaths.football}#nazionali`} className={`${linkCls} inline-flex items-center gap-2`}>
                <Users className="w-4 h-4" aria-hidden="true" />
                Le schede di tutte le nazionali, per confederazione
              </Link>
            </li>
            <li>
              <Link to="/pronostici/tris#nazionali" className={`${linkCls} inline-flex items-center gap-2`}>
                <Target className="w-4 h-4" aria-hidden="true" />
                Il tris delle nazionali: le 3 partite più prevedibili di ogni finestra
              </Link>
            </li>
            <li>
              <Link to="/calcio/stagioni" className={`${linkCls} inline-flex items-center gap-2`}>
                <Trophy className="w-4 h-4" aria-hidden="true" />
                Albo d'oro ed edizioni passate di Mondiali, Europei, Nations League e degli altri tornei
              </Link>
            </li>
            <li>
              <Link to="/bilancio-pronostici" className={`${linkCls} inline-flex items-center gap-2`}>
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Il bilancio dei pronostici delle nazionali, giusti e sbagliati
              </Link>
            </li>
          </ul>
          <p className="text-slate-400 text-sm">
            Le probabilità vengono da un modello statistico dedicato alle nazionali, separato da quello dei club: come
            funziona è spiegato nella{" "}
            <Link to={paths.metodologia} className={linkCls}>
              metodologia
            </Link>
            . Sono stime, non quote né consigli di gioco.
          </p>
        </section>
      </div>
    </div>
  );
}
