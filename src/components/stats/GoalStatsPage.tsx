// /calcio/:competizione/statistiche-under-over – Under/Over and Goal/No goal percentages of every team of a
// competition in the current season, total, home, away or last 5 matches, sortable by any column.
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "../../lib/links";
import { useCompetitionData } from "../../lib/footballData";
import { usePageMeta } from "../../lib/pageMeta";
import { useQueryChoice } from "../../lib/useQueryChoice";
import {
  competitionPath,
  goalStatsMeta,
  mainTable,
  seasonName,
  standingsPath,
  PRONOSTICI,
} from "../../lib/footballCore";
import type { GoalCounts } from "../../lib/goalStats.mjs";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { TeamBadge } from "../calcio/MatchRow";
import { TeamName } from "../teams/TeamLink";
import { GOAL_COLUMNS, GoalStatsNote, PctCell, avg, pct } from "./GoalStats";

const VIEWS = ["totale", "casa", "trasferta", "ultime5"] as const;
type View = (typeof VIEWS)[number];
const VIEW_LABEL: Record<View, string> = {
  totale: "Totale",
  casa: "In casa",
  trasferta: "In trasferta",
  ultime5: "Ultime 5",
};
const VIEW_KEY = { totale: "all", casa: "home", trasferta: "away", ultime5: "last" } as const;

type SortKey = "team" | "n" | "gf" | "ga" | (typeof GOAL_COLUMNS)[number]["key"];

export function GoalStatsPage() {
  const { competizione } = useParams();
  const data = useCompetitionData(competizione);
  const c = data?.competition;
  const league = data ? data.leagueGoalStats() : null;
  usePageMeta(c ? goalStatsMeta(c, league ?? undefined) : null);
  const [view, setView] = useQueryChoice<View>("vista", VIEWS, "totale");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "o25", desc: true });

  const rows = useMemo(() => {
    if (!data || !c) return [];
    return mainTable(c).map((r) => ({ team: r.team, stats: data.goalStats(r.team.id) }));
  }, [data, c]);

  if (!data || !c || !league || rows.length === 0 || league.n === 0) return <NotFoundPage />;

  const pick = (s: (typeof rows)[number]): GoalCounts => s.stats[VIEW_KEY[view]];
  const value = (r: (typeof rows)[number]): number | string => {
    const s = pick(r);
    if (sort.key === "team") return r.team.shortName;
    if (sort.key === "n") return s.n;
    if (sort.key === "gf") return s.n ? s.gf / s.n : -1;
    if (sort.key === "ga") return s.n ? s.ga / s.n : -1;
    return GOAL_COLUMNS.find((col) => col.key === sort.key)!.value(s) ?? -1;
  };
  const sorted = [...rows].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    const d = typeof va === "string" ? va.localeCompare(vb as string, "it") : va - (vb as number);
    // ties: alphabetical, so the order never depends on the table order
    return (sort.desc ? -d : d) || a.team.shortName.localeCompare(b.team.shortName, "it");
  });

  const season = seasonName(c);
  const SortTh = ({ k, label, title, left = false }: { k: SortKey; label: string; title?: string; left?: boolean }) => {
    const active = sort.key === k;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
        className={`font-normal py-3 px-2 whitespace-nowrap ${left ? "text-left" : "text-right"}`}
      >
        <button
          type="button"
          onClick={() => setSort({ key: k, desc: active ? !sort.desc : k !== "team" })}
          className={`inline-flex items-center gap-1 hover:text-white ${active ? "text-white" : ""}`}
          title={title ? `${title}: ordina` : "Ordina"}
        >
          {label}
          {active &&
            (sort.desc ? (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ))}
        </button>
      </th>
    );
  };

  const summary: [string, string][] = [
    ["Partite giocate", String(league.n)],
    ["Gol a partita", avg(league.gf + league.ga, league.n)],
    ["Over 1,5", pct(league.over[0], league.n)],
    ["Over 2,5", pct(league.over[1], league.n)],
    ["Over 3,5", pct(league.over[2], league.n)],
    ["Goal (entrambe a segno)", pct(league.btts, league.n)],
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={BarChart3}
        title={`Statistiche Under/Over ${c.name}${season ? ` ${season}` : ""}`}
        subtitle={`Quante partite di ogni squadra finiscono Over 1,5, 2,5 e 3,5 e in quante segnano entrambe le squadre (Goal), in totale, in casa, in trasferta e nelle ultime 5.`}
        breadcrumb={[
          { label: "Pronostici", to: PRONOSTICI },
          { label: c.name, to: competitionPath(c) },
          { label: "Statistiche Under/Over" },
        ]}
        meta={<DataUpdatedNote generatedAt={data.generatedAt} />}
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <section aria-labelledby="campionato" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="campionato" className="text-white text-lg mb-4">
            {c.name} {season}: il campionato in cifre
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {summary.map(([label, v]) => (
              <div key={label}>
                <dt className="text-slate-400 text-xs">{label}</dt>
                <dd className="text-white text-2xl tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div
          role="group"
          aria-label="Partite considerate"
          className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800"
        >
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-3 py-1.5 rounded-md text-sm ${view === v ? "bg-selected text-selected-foreground" : "text-slate-300 hover:text-white"}`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <caption className="sr-only">
              Statistiche Under/Over e Goal delle squadre di {c.name}, {VIEW_LABEL[view].toLowerCase()}. Le colonne si
              possono ordinare.
            </caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="w-10 px-4">
                  <span className="sr-only">Posizione</span>
                </th>
                <SortTh k="team" label="Squadra" left />
                <SortTh k="n" label="G" title="Partite giocate" />
                <SortTh k="gf" label="Fatti" title="Media gol fatti a partita" />
                <SortTh k="ga" label="Subiti" title="Media gol subiti a partita" />
                {GOAL_COLUMNS.map((col) => (
                  <SortTh key={col.key} k={col.key} label={col.abbr} title={col.label} />
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const s = pick(r);
                return (
                  <tr key={r.team.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                    <td className="px-4 text-slate-400 tabular-nums">{i + 1}</td>
                    <th scope="row" className="py-2.5 px-2 text-left font-normal">
                      <span className="flex items-center gap-2.5">
                        <TeamBadge team={r.team} />
                        <TeamName id={r.team.id} name={r.team.shortName} />
                      </span>
                    </th>
                    <td className="text-right px-2 tabular-nums text-slate-300">{s.n}</td>
                    <td className="text-right px-2 tabular-nums text-slate-300">{avg(s.gf, s.n)}</td>
                    <td className="text-right px-2 tabular-nums text-slate-300">{avg(s.ga, s.n)}</td>
                    {GOAL_COLUMNS.map((col) => (
                      <PctCell
                        key={col.key}
                        s={s}
                        col={col.key}
                        className={sort.key === col.key ? "text-white font-semibold" : ""}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <GoalStatsNote complete={data.season.complete}>
          Sono dati del passato, non previsioni: le probabilità delle prossime partite sono nei{" "}
          <Link to={competitionPath(c)} className="text-action-text hover:text-action-text-hover">
            pronostici di {c.name}
          </Link>
          .
        </GoalStatsNote>

        <section aria-labelledby="faq-uo" className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h2 id="faq-uo" className="text-white text-lg">
            Domande frequenti
          </h2>
          <div>
            <h3 className="text-white" data-faq="q">
              Che cosa vuol dire Over 2,5?
            </h3>
            <p className="text-slate-300 text-sm mt-1" data-faq="a">
              Una partita è Over 2,5 quando finisce con almeno 3 gol in totale, sommando quelli delle due squadre (per
              esempio 2-1 o 3-0). Con 2 gol o meno è Under 2,5. Lo stesso vale per 1,5 (almeno 2 gol) e 3,5 (almeno 4).
            </p>
          </div>
          <div>
            <h3 className="text-white" data-faq="q">
              Quante partite di {c.name} finiscono Over 2,5?
            </h3>
            <p className="text-slate-300 text-sm mt-1" data-faq="a">
              Nella stagione {season} finora {league.over[1]} partite su {league.n} ({pct(league.over[1], league.n)})
              sono finite con almeno 3 gol, con una media di {avg(league.gf + league.ga, league.n)} gol a partita.
            </p>
          </div>
          <div>
            <h3 className="text-white" data-faq="q">
              Che cosa vuol dire Goal o No Goal?
            </h3>
            <p className="text-slate-300 text-sm mt-1" data-faq="a">
              Goal significa che entrambe le squadre segnano almeno un gol; No Goal che almeno una delle due non segna.
              In {c.name} è successo finora in {league.btts} partite su {league.n} ({pct(league.btts, league.n)}).
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to={competitionPath(c)} className="text-action-text hover:text-action-text-hover">
            Pronostici {c.name} →
          </Link>
          {c.standings.length > 0 && (
            <Link to={standingsPath(c)} className="text-action-text hover:text-action-text-hover">
              Classifica {c.name} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
