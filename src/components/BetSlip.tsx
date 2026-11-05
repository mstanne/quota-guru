import { Link } from "../lib/links";
import { ExternalLink, ListChecks, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import { useBetSlip, type BetSelection } from "../context/BetSlipContext";
import { getOperator, oddsOperators } from "../data/operators";
import { formatOdd, productOfOdds } from "../lib/odds";
import { OperatorCta, OperatorLogo } from "./operator/OperatorUi";
import { formatChance, oneIn, slipChance, slipFairOdds } from "../lib/slip";
import { pct } from "../lib/predictionsCore";
import { paths } from "../routes";

// The slip is a light "ticket" on the dark site, so it never looks like part of the page: dark header band, light
// body, picks as compact rows of one list, summary pinned at the bottom. Model probabilities use sky-700 here
// (the site's `predict` colour, sky-400, is for dark backgrounds and is not readable on white).

export function BetSlip() {
  const { selections, isOpen, closeBetSlip, openBetSlip, removeSelection, clearAll, stake, setStake, lastChange } =
    useBetSlip();
  // Picks added from the model's predictions have no odds: the odds parts (total, stake, operators) are shown only
  // when every pick has them, the probability whenever at least one pick has it.
  const withOdds = selections.length > 0 && selections.every((s) => s.selectedOdds !== undefined && s.allBookmakers);
  const chance = slipChance(selections);
  const chanceLabel = chance.probability === null ? null : formatChance(chance.probability);
  // Accumulator odds: null while any odd is still a placeholder (template mode).
  const totalOdds = withOdds ? productOfOdds(selections.map((s) => s.selectedOdds!)) : null;
  const totalLabel = totalOdds === null ? "[QUOTA_TOT]" : totalOdds.toFixed(2);
  const winLabel = (total: number | null) => (total === null ? "[VINCITA]" : `${(stake * total).toFixed(0)}€`);

  // Accumulator odds for the whole slip on each operator (only operators offering every pick), best first.
  const bookmakerTotals = (withOdds ? oddsOperators : [])
    .map((operator) => {
      const picks = selections.map((s) => s.allBookmakers?.find((b) => b.operatorId === operator.id));
      const offersAll = picks.every(Boolean);
      return { operator, offersAll, total: offersAll ? productOfOdds(picks.map((p) => p!.odds)) : null };
    })
    .filter((t) => t.offersAll)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  // value on the floating button: total odds, or the probability for a slip of predictions
  const badge = withOdds ? totalLabel : chanceLabel;
  const n = selections.length;

  return (
    <>
      {/* announces every change, also when the slip stays closed (quick picks in the lists) */}
      <div className="sr-only" aria-live="polite">
        {lastChange?.message}
      </div>

      {!isOpen && n > 0 && (
        <button
          type="button"
          onClick={openBetSlip}
          // key: replays the short highlight every time a pick is added or removed
          key={lastChange?.n ?? 0}
          aria-label={`Apri la schedina: ${n} ${n === 1 ? "esito" : "esiti"}${badge ? `, ${withOdds ? "quota" : "probabilità"} ${badge}` : ""}`}
          className="slip-fab fixed z-50 bottom-5 right-4 md:bottom-auto md:top-24 md:right-6 flex items-center gap-3 rounded-full bg-action hover:bg-action-hover text-action-foreground shadow-xl shadow-black/40 pl-3 pr-4 h-12 md:h-11"
        >
          <span className="inline-flex items-center justify-center min-w-7 h-7 rounded-full bg-slate-950 text-white text-sm font-semibold tabular-nums px-2">
            {n}
          </span>
          <span className="font-medium">Schedina</span>
          {badge && (
            <span className="rounded-full bg-white/90 text-slate-900 text-sm tabular-nums px-2 py-0.5">{badge}</span>
          )}
        </button>
      )}

      <Sheet open={isOpen} onOpenChange={closeBetSlip} modal={false}>
        <SheetContent
          className="w-full sm:max-w-sm p-0 gap-0 bg-slate-100 text-slate-900 border-l-0 sm:border-l-4 sm:border-action shadow-2xl"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          {/* header band (the sheet's own close button sits in its top-right corner) */}
          <div className="shrink-0 bg-slate-950 text-white px-4 pt-4 pb-3 pr-16 border-b-4 border-action sm:border-b-0">
            <SheetTitle className="flex items-center gap-2 text-white text-lg">
              <ListChecks className="w-5 h-5 text-action" aria-hidden="true" />
              Schedina
              {n > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm font-normal tabular-nums">
                  {n} {n === 1 ? "esito" : "esiti"}
                </span>
              )}
            </SheetTitle>
            <p className="mt-1 text-slate-400 text-xs">
              {withOdds ? "Quote degli operatori a confronto" : "Probabilità stimate dal modello"}
            </p>
          </div>

          {n === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
              <ListChecks className="w-12 h-12 text-slate-400" aria-hidden="true" />
              <p className="mt-4 text-slate-900 font-medium">La schedina è vuota</p>
              <p className="mt-1 text-slate-600 text-sm">
                Tocca una probabilità nelle liste delle partite o nella pagina di una partita per aggiungere l'esito.
              </p>
              <Button asChild className="mt-6 w-full bg-action hover:bg-action-hover text-action-foreground">
                <Link to={paths.pronostici} onClick={closeBetSlip}>
                  Vai ai pronostici
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-slate-200 bg-white border-b border-slate-200">
                  {selections.map((s) => (
                    <SlipRow key={s.id} selection={s} onRemove={() => removeSelection(s.id!)} />
                  ))}
                </ul>

                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Un esito per partita</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Svuota
                  </button>
                </div>

                {withOdds && (
                  <div className="px-4 pb-4 space-y-3">
                    <label className="block">
                      <span className="text-slate-700 text-sm">Importo della puntata (€)</span>
                      <Input
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(Number(e.target.value) || 0)}
                        className="mt-1 bg-white border-slate-300 text-slate-900"
                        min="1"
                        step="5"
                      />
                    </label>
                    <div className="text-slate-700 text-sm">Quota totale per operatore</div>
                    <ul className="space-y-2">
                      {bookmakerTotals.map(({ operator, total }, index) => {
                        const isBest = index === 0;
                        return (
                          <li
                            key={operator.id}
                            className={`flex items-center gap-3 rounded-lg border p-2.5 bg-white ${isBest ? "border-best ring-1 ring-best" : "border-slate-200"}`}
                          >
                            <OperatorLogo operator={operator} width={32} height={32} className="rounded" />
                            <div className="flex-1 min-w-0 text-sm">
                              <div className="font-semibold tabular-nums">
                                {total === null ? "[QUOTA_TOT]" : total.toFixed(2)}
                              </div>
                              <div className="text-slate-500 text-xs">Vincita {winLabel(total)}</div>
                            </div>
                            <OperatorCta
                              placement="bet-slip"
                              operator={getOperator(operator.id)}
                              label="Vai"
                              size="sm"
                              variant={isBest ? "default" : "outline"}
                              className={
                                isBest
                                  ? "bg-action hover:bg-action-hover text-action-foreground"
                                  : "bg-white border-slate-300 text-slate-700 hover:bg-action hover:text-action-foreground hover:border-action"
                              }
                              icon={<ExternalLink className="w-3 h-3 mr-1" />}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* summary, always visible under the list */}
              <div className="shrink-0 bg-white border-t border-slate-300 px-4 pt-3 pb-4 shadow-[0_-6px_16px_-10px_rgba(0,0,0,0.35)]">
                {chance.probability !== null && chanceLabel && (
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-slate-600 text-xs">
                        {chance.covered > 1 ? "Probabilità che si verifichino tutti" : "Probabilità stimata"}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sky-700 text-3xl font-semibold tabular-nums">{chanceLabel}</span>
                        {chance.probability < 0.5 && (
                          <span className="text-slate-600 text-sm">{oneIn(chance.probability)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-600 text-xs">Quota equa</div>
                      <div className="text-slate-900 text-xl font-semibold tabular-nums">
                        {slipFairOdds(chance.probability)}
                      </div>
                    </div>
                  </div>
                )}
                {withOdds && (
                  <div className={`flex items-center justify-between text-sm ${chanceLabel ? "mt-2" : ""}`}>
                    <span className="text-slate-600">
                      Quota <strong className="text-slate-900 tabular-nums">{totalLabel}</strong>
                    </span>
                    <span className="text-slate-600">
                      Vincita <strong className="text-slate-900 tabular-nums">{winLabel(totalOdds)}</strong>
                    </span>
                  </div>
                )}
                {chance.covered > 0 && chance.covered < chance.total && (
                  <p className="mt-1.5 text-slate-500 text-xs">
                    Su {chance.covered} esiti su {chance.total}: gli altri non hanno un pronostico del modello.
                  </p>
                )}
                {chance.probability !== null && (
                  <p className="mt-2 text-slate-500 text-[11px] leading-snug">
                    Prodotto delle probabilità stimate dal modello: una stima, non un consiglio di gioco. Ogni esito in
                    più la riduce.{" "}
                    <Link
                      to={`${paths.metodologia}#pronostici`}
                      onClick={closeBetSlip}
                      className="text-orange-700 underline underline-offset-2 hover:text-orange-800"
                    >
                      Come funziona
                    </Link>
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** One pick: teams, outcome and match time on the left, odds or probability on the right. */
function SlipRow({ selection: s, onRemove }: { selection: BetSelection; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-2 pl-4 pr-1.5 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-slate-900 text-sm font-medium truncate">
          {s.homeTeam} – {s.awayTeam}
        </div>
        <div className="text-slate-700 text-sm truncate">{s.betTypeLabel}</div>
        <div className="text-slate-500 text-xs truncate">
          {s.competition} · {s.time}
        </div>
      </div>
      {s.selectedOdds !== undefined ? (
        <span className="text-slate-900 font-semibold tabular-nums">{formatOdd(s.selectedOdds)}</span>
      ) : s.probability !== undefined ? (
        <span className="text-sky-700 font-semibold tabular-nums" title="Probabilità stimata dal modello">
          {pct(s.probability)}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Togli ${s.homeTeam} – ${s.awayTeam} dalla schedina`}
        className="inline-flex items-center justify-center size-9 shrink-0 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </li>
  );
}
