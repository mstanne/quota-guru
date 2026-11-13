// "Altri mercati" on the football match page: every other goal market of the match from the model's score matrix
// (src/lib/footballMarkets.ts), with probability and fair odds. Upcoming matches: each outcome goes in the slip, and
// outcomes of different markets of this match can be combined there (joint probability). Finished matches: the
// outcomes that came true are marked. Informational: no operator odds, no link to any operator.
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  asianTable,
  chance,
  drawNoBet,
  exactScores,
  goalMarkets,
  lamOf,
  scoreGrid,
  type Grid,
  type MarketGroup,
  type Outcome,
} from "../../lib/footballMarkets";
import { fairOdds, pct, type Prediction } from "../../lib/predictionsCore";
import { useSlipPicks, type SlipMatch } from "./SlipPicks";

const OUT = ["1", "X", "2"] as const;
const outTest = (o: number) => (h: number, a: number) => (o === 0 ? h > a : o === 1 ? h === a : h < a);

/** Full combo tables 1X2 + Under/Over 2,5 and 1X2 + Goal/No goal (same keys as the "Combo" cells of the lists). */
function comboGroups(home: string, away: string): MarketGroup[] {
  const who = [home, "pareggio", away];
  return [
    {
      id: "combo-ou",
      title: "1X2 + Under/Over 2,5",
      outcomes: OUT.flatMap((o, i) =>
        (["Under", "Over"] as const).map((u) => ({
          key: `${o}+${u}`,
          label: `${o} + ${u}`,
          slipLabel: `Combo – ${o} + ${u} 2,5`,
          spoken: `${i === 1 ? "pareggio" : `vittoria ${who[i]}`} e ${u === "Under" ? "meno" : "più"} di 2,5 gol`,
          test: (h: number, a: number) => outTest(i)(h, a) && (u === "Under" ? h + a < 2.5 : h + a > 2.5),
        })),
      ),
    },
    {
      id: "combo-gg",
      title: "1X2 + Goal/No goal",
      outcomes: OUT.flatMap((o, i) =>
        (["Goal", "NoGol"] as const).map((u) => ({
          key: `${o}+${u}`,
          label: `${o} + ${u === "Goal" ? "Goal" : "No goal"}`,
          slipLabel: `Combo – ${o} + ${u === "Goal" ? "Goal" : "No goal"}`,
          spoken: `${i === 1 ? "pareggio" : `vittoria ${who[i]}`} e ${u === "Goal" ? "entrambe segnano" : "almeno una non segna"}`,
          test: (h: number, a: number) => outTest(i)(h, a) && (u === "Goal" ? h > 0 && a > 0 : h === 0 || a === 0),
        })),
      ),
    },
  ];
}

export function MoreMarkets({
  prediction,
  home,
  away,
  slip,
  result,
}: {
  prediction: Prediction;
  home: string;
  away: string;
  /** Upcoming matches: outcomes become buttons that add them to the slip. */
  slip?: SlipMatch;
  /** Finished matches (90-minute score): the outcomes that came true are marked. */
  result?: { home: number; away: number } | null;
}) {
  const lam = lamOf(prediction);
  const grid = scoreGrid(lam);
  const byId = new Map(goalMarkets(home, away).map((g) => [g.id, g]));
  const pick = (...ids: string[]) => ids.map((id) => byId.get(id)!).filter(Boolean);
  const scores: MarketGroup = {
    id: "cs",
    title: "Risultato esatto",
    note: "I nove risultati più probabili.",
    outcomes: exactScores(grid),
  };
  const sections: { title: string; groups: MarketGroup[]; extra?: ReactNode }[] = [
    { title: "Gol della partita", groups: pick("ou05", "ou15", "ou35", "ou45", "ou55", "oe") },
    { title: `Gol di ${home} e ${away}`, groups: pick("hou05", "hou15", "hou25", "aou05", "aou15", "aou25", "w2n") },
    { title: "Risultato esatto e margine", groups: [scores, ...pick("margin")] },
    {
      title: "Handicap",
      groups: pick("eh-1", "eh1", "eh-2", "eh2"),
      extra: <AsianHandicap grid={grid} home={home} away={away} />,
    },
    { title: "Combo", groups: [...comboGroups(home, away), ...pick("dc-ou", "dc-gg")] },
  ];

  return (
    <section className="mt-6" aria-labelledby="altri-mercati">
      <h3 id="altri-mercati" className="text-white text-base mb-1">
        Altri mercati
      </h3>
      <p className="text-slate-400 text-xs mb-3">
        Tutti calcolati dalla stessa stima dei gol, sul risultato dei 90 minuti: probabilità e, in grigio, quota equa.
        {slip && " Tocca un esito per metterlo in schedina: puoi unire più mercati di questa partita."}
      </p>
      <div className="space-y-2">
        {sections.map((s, i) => (
          <details
            key={s.title}
            open={i === 0}
            className="group/mm rounded-lg border border-slate-800 bg-slate-950/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-white text-sm [&::-webkit-details-marker]:hidden">
              {s.title}
              <ChevronDown
                className="w-4 h-4 text-slate-400 transition-transform group-open/mm:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-4 px-4 pb-4 pt-1">
              {s.groups.map((g) => (
                <OutcomeGroup key={g.id} group={g} grid={grid} slip={slip} result={result} lam={lam} />
              ))}
              {s.extra}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function OutcomeGroup({
  group,
  grid,
  slip,
  result,
  lam,
}: {
  group: MarketGroup;
  grid: Grid;
  slip?: SlipMatch;
  result?: { home: number; away: number } | null;
  lam: [number, number, number];
}) {
  const { picked, toggle } = useSlipPicks(slip);
  return (
    <div>
      <h4 className="text-slate-300 text-sm">{group.title}</h4>
      {group.note && <p className="text-slate-500 text-xs">{group.note}</p>}
      <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label={group.title}>
        {group.outcomes.map((o) => (
          <OutcomeCell
            key={o.key}
            outcome={o}
            p={chance(grid, [o.test])}
            on={!!slip && picked(o.key)}
            came={result ? o.test(result.home, result.away) : null}
            onToggle={slip ? (p) => toggle({ key: o.key, slipLabel: o.slipLabel, value: p, lam }) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function OutcomeCell({
  outcome: o,
  p,
  on,
  came,
  onToggle,
}: {
  outcome: Outcome;
  p: number;
  on: boolean;
  /** Finished match: did it come true? */
  came: boolean | null;
  onToggle?: (p: number) => void;
}) {
  const body = (
    <>
      <span className="font-medium">{o.label}</span>
      <span className={on ? "text-slate-600" : "text-slate-400"}>{pct(p)}</span>
      <span className={`text-xs ${on ? "text-slate-500" : "text-slate-500"}`} title="Quota equa: 1 ÷ probabilità">
        {fairOdds(p)}
      </span>
    </>
  );
  if (!onToggle)
    return (
      <span
        className={`inline-flex items-baseline gap-2 rounded-md border px-3 py-1.5 text-sm tabular-nums ${
          came ? "border-best/60 bg-best/10 text-white" : "border-slate-800 bg-slate-900 text-white"
        }`}
        aria-label={`${o.spoken}: probabilità stimata ${pct(p)}${came ? ", esito verificato" : ""}`}
      >
        {came && <Check className="w-3.5 h-3.5 self-center text-best" aria-hidden="true" />}
        {body}
      </span>
    );
  return (
    <button
      type="button"
      onClick={() => onToggle(p)}
      aria-pressed={on}
      aria-label={`${o.slipLabel}: probabilità stimata ${pct(p)}, quota equa ${fairOdds(p)}. ${on ? "Togli dalla" : "Aggiungi alla"} schedina`}
      className={`inline-flex items-baseline gap-2 rounded-md border px-3 py-1.5 text-sm tabular-nums transition-colors ${
        on ? "bg-selected text-selected-foreground border-selected" : "bg-slate-900 border-slate-700 text-white hover:border-slate-500"
      }`}
    >
      {body}
    </button>
  );
}

/** Asian handicap lines around the most balanced one, and draw no bet: fair odds only (stake refunds included). */
function AsianHandicap({ grid, home, away }: { grid: Grid; home: string; away: string }) {
  const lines = asianTable(grid);
  const dnb = drawNoBet(grid);
  const sign = (x: number) => (x > 0 ? `+${String(x).replace(".", ",")}` : x === 0 ? "0" : `−${String(-x).replace(".", ",")}`);
  const odd = (x: number) => (Number.isFinite(x) && x < 100 ? x.toFixed(2).replace(".", ",") : "–");
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-slate-300 text-sm">Draw no bet (pareggio rimborsato)</h4>
        <p className="text-slate-500 text-xs">
          Se finisce pari la puntata torna indietro ({pct(dnb.draw)} di probabilità): per questo qui c'è solo la quota
          equa e l'esito non va in schedina.
        </p>
        <dl className="mt-1.5 grid grid-cols-2 gap-2 text-sm tabular-nums">
          {(
            [
              [home, dnb.home],
              [away, dnb.away],
            ] as const
          ).map(([name, o]) => (
            <div key={name} className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5">
              <dt className="text-slate-400 text-xs truncate">{name}</dt>
              <dd className="text-white">Quota equa {odd(o)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h4 className="text-slate-300 text-sm">Handicap asiatico</h4>
        <p className="text-slate-500 text-xs">
          Il pareggio con l'handicap rimborsa la puntata; le linee da ¼ sono metà su ciascuna delle due linee vicine.
          Quote eque, con la linea più equilibrata in evidenza. Non va in schedina.
        </p>
        <table className="mt-1.5 w-full text-sm tabular-nums">
          <thead>
            <tr className="text-slate-400 text-xs">
              <th scope="col" className="text-left font-normal py-1">
                Linea {home}
              </th>
              <th scope="col" className="text-right font-normal py-1 truncate">
                {home}
              </th>
              <th scope="col" className="text-right font-normal py-1 truncate">
                {away}
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const balanced = Math.abs(l.home - 2) === Math.min(...lines.map((x) => Math.abs(x.home - 2)));
              return (
                <tr key={l.line} className={`border-t border-slate-800 ${balanced ? "text-predict" : "text-white"}`}>
                  <td className="py-1">{sign(l.line)}</td>
                  <td className="py-1 text-right">{odd(l.home)}</td>
                  <td className="py-1 text-right">{odd(l.away)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
