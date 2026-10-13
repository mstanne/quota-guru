// "Quote a confronto" block, reusable on every event page (basket now, calcio when the operator feeds arrive).
// Odds come from the template (src/data/operators.ts / src/lib/odds.ts): numbers or placeholders like "[QUOTA_1]".
import { Check, ExternalLink, Target } from "lucide-react";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { OperatorCta, OperatorLogo } from "../operator/OperatorUi";
import { getOperator } from "../../data/operators";
import { formatOdd, isBestAt, type OddValue, type OddsByOperator } from "../../lib/odds";
import { useBetSlip } from "../../context/BetSlipContext";

export interface Outcome {
  key: string;
  /** Column header, e.g. "1 (Lakers)". */
  label: string;
  /** Text for the bet slip, e.g. "Lakers vincente". */
  selection: string;
}

interface OddsComparisonProps {
  title?: string;
  outcomes: Outcome[];
  odds: OddsByOperator;
  event: { id: string; home: string; away: string; competition: string; time: string };
  market: string;
}

export function OddsComparison({ title = "Quote a confronto", outcomes, odds, event, market }: OddsComparisonProps) {
  const { addSelection } = useBetSlip();
  const rows = Object.entries(odds);
  const column = (key: string) => rows.map(([, o]) => o[key] as OddValue);

  const add = (operatorId: string, o: Outcome, value: OddValue) =>
    addSelection({
      matchId: event.id,
      competition: event.competition,
      homeTeam: event.home,
      awayTeam: event.away,
      time: event.time,
      betType: o.key,
      betTypeLabel: `${market} – ${o.selection}`,
      selectedBookmaker: operatorId,
      selectedOdds: value,
      allBookmakers: rows.map(([id, v]) => ({ operatorId: id, odds: v[o.key] })),
    });

  return (
    <Card className="bg-slate-900 border-slate-800 p-5">
      <h2 className="flex items-center gap-2 text-white text-xl mb-1">
        <Target className="w-5 h-5 text-slate-300" aria-hidden="true" />
        {title}
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        {market} · quote fornite dagli operatori; verifica sempre il valore sul sito dell'operatore.
      </p>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="text-slate-400">Operatore</TableHead>
            {outcomes.map((o) => (
              <TableHead key={o.key} className="text-center text-slate-400">
                {o.label}
              </TableHead>
            ))}
            <TableHead className="text-slate-400">
              <span className="sr-only">Azioni</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([operatorId, values], rowIndex) => {
            const operator = getOperator(operatorId);
            return (
              <TableRow key={operatorId} className="border-slate-800 hover:bg-slate-800/40">
                <TableCell className="text-white">
                  <span className="flex items-center gap-2">
                    <OperatorLogo operator={operator} width={24} height={24} />
                    {operator.name}
                  </span>
                </TableCell>
                {outcomes.map((o) => {
                  const value = values[o.key];
                  const best = isBestAt(column(o.key), rowIndex);
                  return (
                    <TableCell key={o.key} className="text-center">
                      <button
                        type="button"
                        onClick={() => add(operatorId, o, value)}
                        aria-label={`Aggiungi alla schedina: ${o.selection} a ${formatOdd(value)} su ${operator.name}${best ? " (quota migliore)" : ""}`}
                        className={`inline-flex items-center px-3 py-1.5 rounded tabular-nums cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${best ? "bg-best text-best-foreground font-bold" : "text-slate-300"}`}
                      >
                        {formatOdd(value)}
                        {best && <Check className="w-3.5 h-3.5 ml-1" aria-hidden="true" />}
                      </button>
                    </TableCell>
                  );
                })}
                <TableCell>
                  <OperatorCta
                    operator={operator}
                    placement="event-odds"
                    label="Vai al sito"
                    size="sm"
                    className="bg-action hover:bg-action-hover text-action-foreground cursor-pointer"
                    icon={<ExternalLink className="w-3 h-3 ml-1" />}
                    iconPosition="end"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
