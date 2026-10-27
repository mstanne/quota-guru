// /pronostici/oggi and /pronostici/domani – every match of the day with the model's prediction.
import { CalendarDays, ChevronRight, Dribbble, Goal } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { MatchRow } from "../calcio/MatchRow";
import { BasketGameRow } from "../basket/BasketGameRow";
import { MarketFilter } from "./MarketFilter";
import { FOOTBALL_MARKETS, predictionFor, type FootballMarket } from "../../lib/predictions";
import { useQueryChoice } from "../../lib/useQueryChoice";
import { usePageMeta } from "../../lib/pageMeta";
import { competitionPath, formatUpdated, generatedAt, type Competition, type Match } from "../../lib/football";
import { basketPaths } from "../../lib/basket";
import { dayMatches, dayMeta, dayOf, dayPath, type DayKey } from "../../lib/dayPages";
import { paths } from "../../routes";

const MARKET_IDS = FOOTBALL_MARKETS.map((m) => m.id);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function DayPredictionsPage({ day }: { day: DayKey }) {
  usePageMeta(dayMeta(day));
  const [market, setMarket] = useQueryChoice<FootballMarket>("mercato", MARKET_IDS, "1x2");
  const { label } = dayOf(day);
  const { football, nba } = dayMatches(day);
  const other: DayKey = day === "oggi" ? "domani" : "oggi";

  // football grouped by competition, in the site's competition order
  const groups: { c: Competition; items: Match[] }[] = [];
  for (const { competition, match } of football) {
    let g = groups.find((x) => x.c === competition);
    if (!g) groups.push((g = { c: competition, items: [] }));
    g.items.push(match);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={CalendarDays}
        title={`Pronostici ${day === "oggi" ? "di oggi" : "di domani"}`}
        subtitle={`${cap(label)}: le probabilità del modello statistico per ogni partita di calcio e NBA.`}
        breadcrumb={[{ label: "Pronostici", to: paths.pronostici }, { label: cap(day) }]}
        meta={
          <MetaItems
            items={[
              `${football.length} partite di calcio · ${nba.length} NBA`,
              `Dati aggiornati al ${formatUpdated(generatedAt)}`,
            ]}
          />
        }
      >
        <Link
          to={dayPath(other)}
          data-track="day_switch"
          data-track-to={other}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
        >
          Pronostici {other === "oggi" ? "di oggi" : "di domani"}
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        {football.length + nba.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-white mb-1">Nessuna partita con un pronostico {day === "oggi" ? "oggi" : "domani"}</p>
            <p className="text-slate-400 text-sm">
              Trovi le prossime partite nella pagina{" "}
              <Link to={paths.pronostici} className="text-action-text hover:text-action-text-hover">
                Pronostici
              </Link>
              .
            </p>
          </div>
        )}

        {groups.length > 0 && (
          <section aria-labelledby="calcio" className="mb-10">
            <h2 id="calcio" className="flex items-center gap-2 text-white text-2xl mb-4">
              <Goal className="w-6 h-6 text-slate-300" aria-hidden="true" />
              Calcio
            </h2>
            <MarketFilter options={FOOTBALL_MARKETS} value={market} onChange={setMarket} />
            <div className="space-y-6">
              {groups.map(({ c, items }) => (
                <section key={c.slug} aria-labelledby={`c-${c.slug}`}>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h3 id={`c-${c.slug}`} className="text-slate-300 text-sm uppercase tracking-wide">
                      {c.name}
                    </h3>
                    <Link to={competitionPath(c)} className="text-xs text-slate-400 hover:text-white">
                      Calendario {c.name}
                    </Link>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                    {items.map((m) => (
                      <MatchRow key={m.id} competition={c} match={m} prediction={predictionFor(m.id)} market={market} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        )}

        {nba.length > 0 && (
          <section aria-labelledby="nba" className="mb-10">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 id="nba" className="flex items-center gap-2 text-white text-2xl">
                <Dribbble className="w-6 h-6 text-slate-300" aria-hidden="true" />
                NBA
              </h2>
              <Link to={basketPaths.nba} className="text-sm text-slate-400 hover:text-white">
                Calendario NBA
              </Link>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              {nba.map((g) => (
                <BasketGameRow key={g.id} game={g} />
              ))}
            </div>
          </section>
        )}

        <p className="text-slate-400 text-xs">
          Orari in ora italiana. Probabilità stimate da modelli statistici: non conoscono infortuni, squalifiche e
          turnover e non sono consigli di gioco.{" "}
          <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
            Come funzionano
          </Link>
        </p>
      </div>
    </div>
  );
}
