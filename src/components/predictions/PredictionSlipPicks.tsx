// "Aggiungi alla schedina" on the prediction panel of an upcoming match: each outcome with the model's probability.
// The slip then shows the probability that all its picks come true (src/lib/slip.ts). One pick per match, so the
// outcomes of the slip are always from different matches.
import { ListPlus } from "lucide-react";
import { useBetSlip } from "../../context/BetSlipContext";
import { pct, type Prediction } from "../../lib/predictionsCore";

interface PickOption {
  key: string;
  /** Short label on the button. */
  label: string;
  /** Text in the slip, e.g. "Esito finale 1X2 – Inter vincente". */
  slipLabel: string;
  p: number;
}

function options(p: Prediction, home: string, away: string): { title: string; items: PickOption[] }[] {
  return [
    {
      title: "Esito finale",
      items: [
        { key: "1", label: "1", slipLabel: `Esito finale – ${home} vincente`, p: p.p[0] },
        { key: "X", label: "X", slipLabel: "Esito finale – Pareggio", p: p.p[1] },
        { key: "2", label: "2", slipLabel: `Esito finale – ${away} vincente`, p: p.p[2] },
      ],
    },
    {
      title: "Doppia chance",
      items: [
        { key: "1X", label: "1X", slipLabel: `Doppia chance – ${home} o pareggio`, p: p.dc[0] },
        { key: "12", label: "12", slipLabel: `Doppia chance – ${home} o ${away}`, p: p.dc[1] },
        { key: "X2", label: "X2", slipLabel: `Doppia chance – ${away} o pareggio`, p: p.dc[2] },
      ],
    },
    {
      title: "Gol",
      items: [
        { key: "over25", label: "Over 2,5", slipLabel: "Over 2,5", p: p.over["2.5"] },
        { key: "under25", label: "Under 2,5", slipLabel: "Under 2,5", p: 1 - p.over["2.5"] },
        { key: "gg", label: "Goal", slipLabel: "Goal (entrambe segnano)", p: p.btts },
        { key: "ng", label: "No goal", slipLabel: "No goal", p: 1 - p.btts },
      ],
    },
  ];
}

export function PredictionSlipPicks({
  prediction,
  matchId,
  home,
  away,
  competition,
  date,
  time,
}: {
  prediction: Prediction;
  matchId: number;
  home: string;
  away: string;
  competition: string;
  date?: string;
  time: string;
}) {
  const { selections, addSelection, removeSelection } = useBetSlip();
  // same id format as the odds block (MatchOddsSlot), so odds and prediction picks share the one-pick-per-match rule
  const slipMatchId = `football-${matchId}`;
  const current = selections.find((s) => s.matchId === slipMatchId);

  const toggle = (o: PickOption) => {
    const id = `${slipMatchId}-pred-${o.key}`;
    if (current?.id === id) return removeSelection(id);
    addSelection({
      id,
      matchId: slipMatchId,
      competition,
      homeTeam: home,
      awayTeam: away,
      date,
      time,
      betType: o.key,
      betTypeLabel: o.slipLabel,
      probability: o.p,
    });
  };

  return (
    <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3">
      <h3 className="flex items-center gap-2 text-white text-base">
        <ListPlus className="w-4 h-4 text-slate-300" aria-hidden="true" />
        Aggiungi un esito alla schedina
      </h3>
      <p className="mt-1 text-slate-400 text-xs leading-relaxed">
        La schedina calcola la probabilità stimata che si verifichino tutti gli esiti scelti. Un esito per partita.
      </p>
      <div className="mt-3 space-y-3">
        {options(prediction, home, away).map((group) => (
          <div key={group.title}>
            <div className="text-slate-400 text-xs mb-1.5">{group.title}</div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((o) => {
                const active = current?.id === `${slipMatchId}-pred-${o.key}`;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => toggle(o)}
                    aria-pressed={active}
                    aria-label={`${o.slipLabel}: probabilità stimata ${pct(o.p)}. ${active ? "Togli dalla" : "Aggiungi alla"} schedina`}
                    className={`inline-flex items-baseline gap-2 rounded-md border px-3 py-1.5 text-sm tabular-nums transition-colors ${
                      active
                        ? "bg-selected text-selected-foreground border-selected"
                        : "bg-slate-900 border-slate-700 text-white hover:border-slate-500"
                    }`}
                  >
                    <span className="font-medium">{o.label}</span>
                    <span className={active ? "text-selected-foreground/80" : "text-slate-400"}>{pct(o.p)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
