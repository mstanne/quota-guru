import { Link } from "react-router";
import { CircleCheck, ExternalLink, ShoppingCart, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Sheet, SheetHeader, SheetContent, SheetTitle } from "./ui/sheet";
import { useBetSlip } from "../context/BetSlipContext";
import { getOperator, oddsOperators } from "../data/operators";
import { formatOdd, productOfOdds } from "../lib/odds";
import { OperatorCta, OperatorLogo } from "./operator/OperatorUi";

export function BetSlip() {
  const { selections, isOpen, closeBetSlip, openBetSlip, removeSelection, clearAll, stake, setStake } = useBetSlip();
  // Accumulator odds: null while any odd is still a placeholder (template mode).
  const totalOdds = productOfOdds(selections.map((s) => s.selectedOdds));
  const totalLabel = totalOdds === null ? "[QUOTA_TOT]" : totalOdds.toFixed(2);
  const winLabel = (total: number | null) => (total === null ? "[VINCITA]" : `${(stake * total).toFixed(0)}€`);

  // Accumulator odds for the whole slip on each operator (only operators offering every pick), best first.
  const bookmakerTotals = oddsOperators
    .map((operator) => {
      const picks = selections.map((s) => s.allBookmakers.find((b) => b.operatorId === operator.id));
      const offersAll = picks.every(Boolean);
      return { operator, offersAll, total: offersAll ? productOfOdds(picks.map((p) => p!.odds)) : null };
    })
    .filter((t) => t.offersAll)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  return (
    <>
      {!isOpen && selections.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Button
            onClick={openBetSlip}
            className="bg-action hover:bg-action-hover text-action-foreground shadow-lg h-14 px-6 rounded-full"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Schedina ({selections.length})<Badge className="ml-2 bg-white text-slate-900">{totalLabel}</Badge>
          </Button>
        </div>
      )}
      {selections.length > 0 && (
        <div className="hidden md:block fixed top-24 right-6 z-40">
          <Button
            onClick={isOpen ? closeBetSlip : openBetSlip}
            className={`shadow-lg transition-all ${isOpen ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-action hover:bg-action-hover text-action-foreground"}`}
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {selections.length}
            {!isOpen && <Badge className="ml-2 bg-white text-slate-900 text-xs">{totalLabel}</Badge>}
          </Button>
        </div>
      )}
      <Sheet open={isOpen} onOpenChange={closeBetSlip} modal={false}>
        <SheetContent
          className="w-full sm:max-w-md bg-slate-900 border-slate-700 overflow-y-auto"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <SheetHeader className="border-b border-slate-700 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-white flex items-center gap-2">
                <CircleCheck className="w-5 h-5 text-slate-300" />
                {selections.length > 0 ? "Schedina multipla" : "Schedina"}
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={closeBetSlip} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
            {selections.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="bg-slate-800 rounded-lg p-2">
                  <div className="text-slate-400 text-xs">Quota:</div>
                  <div className="text-best tabular-nums">{totalLabel}</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2">
                  <div className="text-slate-400 text-xs">Puntata:</div>
                  <div className="text-white">{stake}€</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2">
                  <div className="text-slate-400 text-xs">Vincita:</div>
                  <div className="text-white">{winLabel(totalOdds)}</div>
                </div>
              </div>
            )}
          </SheetHeader>
          <div className="mt-6">
            {selections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-48 h-48 mb-6 opacity-50 rounded-full bg-slate-800 flex items-center justify-center">
                  <ShoppingCart className="w-20 h-20 text-slate-400" aria-hidden="true" />
                </div>

                <p className="text-slate-400 text-center mb-6">La tua schedina è vuota</p>
                <Button asChild className="w-full bg-action hover:bg-action-hover text-action-foreground">
                  <Link to="/calcio" onClick={closeBetSlip}>
                    Vai alle partite
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selections.map((selection) => (
                  <Card key={selection.id} className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-white mb-1">{selection.homeTeam}</div>
                        <div className="text-white mb-2">{selection.awayTeam}</div>
                        <Badge variant="secondary" className="bg-slate-700 text-white text-xs">
                          {selection.betTypeLabel}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSelection(selection.id)}
                        className="text-slate-400 hover:text-white h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-slate-400 text-xs">
                        {selection.competition}
                        {" \u2022 "}
                        {selection.time}
                      </div>
                      <div className="text-best tabular-nums">{formatOdd(selection.selectedOdds)}</div>
                    </div>
                  </Card>
                ))}
                <Card className="bg-slate-800 border-slate-700 p-4">
                  <div className="text-slate-300 mb-3">Quota totale per operatore:</div>
                  <div className="space-y-2">
                    {bookmakerTotals.map(({ operator, total }, index) => {
                      const isBest = index === 0;
                      return (
                        <div
                          key={operator.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isBest ? "bg-best/10 border-best" : "bg-slate-900 border-slate-700"}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 [&>div]:min-w-0 [&>div>div]:truncate">
                            <OperatorLogo
                              operator={operator}
                              width={40}
                              height={40}
                              className={`rounded ${isBest ? "border-best" : ""}`}
                            />
                            <div>
                              <div className="text-slate-400 text-xs">Quota Totale:</div>
                              <div className={isBest ? "text-best" : "text-white"}>
                                {total === null ? "[QUOTA_TOT]" : total.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Puntata:</div>
                              <div className="text-white text-sm">{stake}€</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Vincita:</div>
                              <div className="text-white text-sm">{winLabel(total)}</div>
                            </div>
                          </div>
                          <OperatorCta
                            operator={getOperator(operator.id)}
                            label="Vai"
                            size="sm"
                            variant={isBest ? "default" : "outline"}
                            className={
                              isBest
                                ? "bg-action hover:bg-action-hover text-action-foreground"
                                : "bg-slate-900 border-slate-600 text-slate-300 hover:bg-action hover:text-action-foreground hover:border-action"
                            }
                            icon={<ExternalLink className="w-3 h-3 mr-1" />}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Card>
                <Card className="bg-slate-800 border-slate-700 p-4">
                  <div className="mb-2">
                    <label className="text-slate-300 text-sm">Importo della puntata (€)</label>
                  </div>
                  <Input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value) || 0)}
                    className="bg-slate-900 border-slate-700 text-white"
                    min="1"
                    step="5"
                  />
                </Card>
                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={clearAll}
                  >
                    Svuota la schedina
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
