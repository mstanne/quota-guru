// "Aggiungi alla schedina" on the prediction panel of an upcoming match: each outcome with the model's probability.
// Same picks (keys and texts) as the cells of the match lists (marketCells), so the selection is shared.
import { marketCells, pct, type FootballMarket, type Prediction } from "../../lib/predictionsCore";
import { SlipPicksBox, useSlipPicks, type SlipMatch } from "./SlipPicks";

const GROUPS: { title: string; market: FootballMarket }[] = [
  { title: "Esito finale", market: "1x2" },
  { title: "Doppia chance", market: "dc" },
  { title: "Under/Over 2,5", market: "uo" },
  { title: "Goal/No goal", market: "gg" },
];
// longer button texts than the list cells, where space is short
const BUTTON_LABEL: Record<string, string> = { under25: "Under 2,5", over25: "Over 2,5", gg: "Goal", ng: "No goal" };

export function PredictionSlipPicks({ prediction, slip }: { prediction: Prediction; slip: SlipMatch }) {
  const { picked, toggle } = useSlipPicks(slip);
  return (
    <SlipPicksBox>
      <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <div key={g.market}>
            <div className="text-slate-400 text-xs mb-1.5">{g.title}</div>
            <div className="flex flex-wrap gap-2">
              {marketCells(prediction, g.market, slip.home, slip.away).map((c) => {
                const on = picked(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggle(c)}
                    aria-pressed={on}
                    aria-label={`${c.slipLabel}: probabilità stimata ${pct(c.value)}. ${on ? "Togli dalla" : "Aggiungi alla"} schedina`}
                    className={`inline-flex items-baseline gap-2 rounded-md border px-3 py-1.5 text-sm tabular-nums transition-colors ${
                      on
                        ? "bg-selected text-selected-foreground border-selected"
                        : "bg-slate-900 border-slate-700 text-white hover:border-slate-500"
                    }`}
                  >
                    <span className="font-medium">{BUTTON_LABEL[c.key] ?? c.label}</span>
                    <span className={on ? "text-slate-600" : "text-slate-400"}>{pct(c.value)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SlipPicksBox>
  );
}
