// Under/Over and Goal/No goal statistics (src/lib/goalStats.mjs): league table, team split table, match comparison.
// Every percentage is computed from final scores of the current season; the number of matches is always shown.
import type { ReactNode } from "react";
import type { GoalCounts, TeamGoalStats } from "../../lib/goalStats.mjs";

export const pct = (k: number, n: number) => (n ? `${Math.round((k / n) * 100)}%` : "–");
export const avg = (k: number, n: number) => (n ? (k / n).toFixed(2).replace(".", ",") : "–");

/** Columns shared by every table: [label, short label, value]. */
export const GOAL_COLUMNS: { key: string; label: string; abbr: string; value: (s: GoalCounts) => number | null }[] = [
  { key: "o15", label: "Partite con almeno 2 gol (Over 1,5)", abbr: "Over 1,5", value: (s) => ratio(s.over[0], s.n) },
  { key: "o25", label: "Partite con almeno 3 gol (Over 2,5)", abbr: "Over 2,5", value: (s) => ratio(s.over[1], s.n) },
  { key: "o35", label: "Partite con almeno 4 gol (Over 3,5)", abbr: "Over 3,5", value: (s) => ratio(s.over[2], s.n) },
  {
    key: "gg",
    label: "Partite in cui hanno segnato entrambe le squadre (Goal)",
    abbr: "Goal",
    value: (s) => ratio(s.btts, s.n),
  },
  { key: "cs", label: "Partite senza gol subiti", abbr: "Porta inviolata", value: (s) => ratio(s.clean, s.n) },
  { key: "fts", label: "Partite senza segnare", abbr: "A secco", value: (s) => ratio(s.blank, s.n) },
];
const ratio = (k: number, n: number) => (n ? k / n : null);
const COUNT = {
  o15: (s: GoalCounts) => s.over[0],
  o25: (s: GoalCounts) => s.over[1],
  o35: (s: GoalCounts) => s.over[2],
  gg: (s: GoalCounts) => s.btts,
  cs: (s: GoalCounts) => s.clean,
  fts: (s: GoalCounts) => s.blank,
} as Record<string, (s: GoalCounts) => number>;

/** Percentage cell with the count as tooltip ("5 partite su 8"). */
export function PctCell({ s, col, className = "" }: { s: GoalCounts; col: string; className?: string }) {
  const k = COUNT[col](s);
  return (
    <td
      className={`text-right px-2 py-2.5 tabular-nums text-slate-200 ${className}`}
      title={s.n ? `${k} partite su ${s.n}` : undefined}
    >
      {pct(k, s.n)}
    </td>
  );
}

function Th({ children, title, className = "" }: { children: ReactNode; title?: string; className?: string }) {
  return (
    <th scope="col" className={`text-right font-normal py-3 px-2 whitespace-nowrap ${className}`}>
      {title ? <abbr title={title}>{children}</abbr> : children}
    </th>
  );
}

/** One team, current season: total, home, away and last 5 matches. */
export function TeamGoalTable({ stats, caption }: { stats: TeamGoalStats; caption: string }) {
  const rows: [string, GoalCounts][] = [
    ["Totale", stats.all],
    ["In casa", stats.home],
    ["In trasferta", stats.away],
    ["Ultime 5", stats.last],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th scope="col" className="text-left font-normal py-3 pr-2">
              <span className="sr-only">Partite</span>
            </th>
            <Th title="Partite giocate">G</Th>
            <Th title="Media gol fatti a partita">Fatti</Th>
            <Th title="Media gol subiti a partita">Subiti</Th>
            {GOAL_COLUMNS.map((c) => (
              <Th key={c.key} title={c.label}>
                {c.abbr}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, s]) => (
            <tr key={label} className="border-b border-slate-800 last:border-0">
              <th scope="row" className="text-left font-normal py-2.5 pr-2 text-slate-300 whitespace-nowrap">
                {label}
              </th>
              <td className="text-right px-2 tabular-nums text-slate-300">{s.n}</td>
              <td className="text-right px-2 tabular-nums text-slate-300">{avg(s.gf, s.n)}</td>
              <td className="text-right px-2 tabular-nums text-slate-300">{avg(s.ga, s.n)}</td>
              {GOAL_COLUMNS.map((c) => (
                <PctCell key={c.key} s={s} col={c.key} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Match page: the home team in its home matches next to the away team in its away matches (the split that matters
 * for this match), with the whole-season figure in small print.
 */
export function MatchGoalComparison({
  home,
  away,
  homeName,
  awayName,
}: {
  home: TeamGoalStats;
  away: TeamGoalStats;
  homeName: string;
  awayName: string;
}) {
  const rows: [string, string, (s: GoalCounts) => string][] = [
    ["Media gol a partita (fatti + subiti)", "", (s) => avg(s.gf + s.ga, s.n)],
    ...GOAL_COLUMNS.slice(0, 4).map((c): [string, string, (s: GoalCounts) => string] => [
      c.abbr,
      c.label,
      (s) => pct(COUNT[c.key](s), s.n),
    ]),
    ["Porta inviolata", "Partite senza gol subiti", (s) => pct(s.clean, s.n)],
    ["A secco", "Partite senza segnare", (s) => pct(s.blank, s.n)],
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-slate-400 border-b border-slate-800">
          <th scope="col" className="text-left font-normal py-2">
            {homeName} <span className="block text-xs">in casa ({home.home.n})</span>
          </th>
          <th scope="col" className="font-normal py-2">
            <span className="sr-only">Statistica</span>
          </th>
          <th scope="col" className="text-right font-normal py-2">
            {awayName} <span className="block text-xs">in trasferta ({away.away.n})</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, title, f]) => (
          <tr key={label} className="border-b border-slate-800 last:border-0">
            <td className="py-2.5 text-white tabular-nums">
              {f(home.home)} <span className="text-slate-400 text-xs ml-1">stagione {f(home.all)}</span>
            </td>
            <th scope="row" className="py-2.5 text-center text-slate-400 font-normal">
              {title ? <abbr title={title}>{label}</abbr> : label}
            </th>
            <td className="py-2.5 text-right text-white tabular-nums">
              <span className="text-slate-400 text-xs mr-1">stagione {f(away.all)}</span> {f(away.away)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** "Basate su N partite" note, with the warning when the season is not complete in the data. */
export function GoalStatsNote({ complete, children }: { complete: boolean; children?: ReactNode }) {
  return (
    <p className="text-slate-400 text-xs mt-4">
      Percentuali calcolate sui risultati finali: Over 2,5 = almeno 3 gol nella partita, Goal = hanno segnato entrambe
      le squadre. Passando il mouse su una percentuale compare il numero di partite.{" "}
      {!complete && "Mancano alcune partite della stagione in corso nei dati: le percentuali sono indicative. "}
      {children}
    </p>
  );
}
