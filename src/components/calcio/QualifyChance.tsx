// Knockout ties of the cups: chance that each side goes through (or wins the trophy, in a final), from the model
// (scripts/lib/knockout.mjs). Extra time and penalties are included; over two legs it is the aggregate.
import { Swords } from "lucide-react";
import type { Match } from "../../lib/footballCore";
import { fairOdds, pct, type Prediction } from "../../lib/predictionsCore";

/** `firstLeg`: score of the first leg already played, e.g. "Inter – Milan 2-1", on second-leg pages. */
export function QualifyChance({ match, prediction, firstLeg }: { match: Match; prediction: Prediction; firstLeg?: string }) {
  const q = prediction.qualify;
  if (!q) return null;
  const final = match.stage === "FINAL";
  const title = final ? "Chi alza il trofeo" : "Passaggio del turno";
  const rows: [string, number][] = [
    [match.homeTeam.shortName, q[0]],
    [match.awayTeam.shortName, q[1]],
  ];
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="passaggio-turno">
      <h2 id="passaggio-turno" className="flex items-center gap-2 text-white text-xl mb-4">
        <Swords className="w-5 h-5 text-slate-300" aria-hidden="true" />
        {title}
      </h2>
      <ul className="space-y-3">
        {rows.map(([name, p]) => (
          <li key={name}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-white">{name}</span>
              <span className="tabular-nums text-slate-300">
                {pct(p)} <span className="text-slate-500">· quota equa {fairOdds(p)}</span>
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-selected" style={{ width: `${Math.round(p * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        {firstLeg ? `Tiene conto dell'andata (${firstLeg}). ` : ""}
        Comprende supplementari e rigori, se servono. Stima del nostro modello statistico, non un consiglio di gioco.
      </p>
    </section>
  );
}
