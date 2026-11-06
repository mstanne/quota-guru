import { Gift } from "lucide-react";
import { Button } from "./ui/button";
import { getOperator, isPlaceholder, type OperatorData } from "../data/operators";
import { amountFor, formatEuro, offersInSection, visibleOffers, type WelcomeOffer } from "../data/offers";
import { OfferDisclaimer, OperatorCta, OperatorLogo } from "./operator/OperatorUi";

interface BonusSectionProps {
  /** Offers to show. Default: up to 4 sport welcome offers from src/data/offers.json (drafts only in `npm run dev`). */
  offers?: WelcomeOffer[];
  /** Resolves an offer's operator (defaults to the template operator list). */
  resolveOperator?: (id: string) => OperatorData;
  onViewAllClick?: () => void;
  /** Analytics placement of the buttons and terms links ("home-offers", "site-offers"). */
  placement?: string;
}

/** Home page block: sport welcome offers, informational (no ranking, no ratings, no "popular" badges). */
export function BonusSection({
  offers = offersInSection(visibleOffers({ includeDrafts: import.meta.env.DEV }), "sport").slice(0, 4),
  resolveOperator = getOperator,
  onViewAllClick,
  placement = "home-offers",
}: BonusSectionProps) {
  if (offers.length === 0) return null;
  return (
    <section aria-labelledby="offerte-benvenuto" className="py-6 sm:py-8 bg-slate-900 border-y border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-slate-300" aria-hidden="true" />
            <h2 id="offerte-benvenuto" className="text-white text-lg sm:text-xl whitespace-nowrap">
              Offerte di benvenuto
            </h2>
            <span className="hidden sm:inline text-slate-400 text-sm">· importi per le scommesse sportive</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={onViewAllClick}
          >
            <span className="sm:hidden">Tutte</span>
            <span className="hidden sm:inline">Tutte le offerte</span>
          </Button>
        </div>
        {/* one row of compact cards that scrolls sideways (snaps card by card); from lg the four fit side by side */}
        <ul className="-mx-4 px-4 flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {offers.map((offer) => {
            const resolved = resolveOperator(offer.operatorId);
            const name = isPlaceholder(resolved.name) ? offer.operatorName : resolved.name;
            const operator = { ...resolved, name, logoAlt: `Logo ${name}` };
            const sport = amountFor(offer, "sport");
            return (
              <li
                key={offer.id}
                className="w-[72%] max-w-[17rem] shrink-0 snap-start lg:w-auto lg:max-w-none rounded-xl border border-slate-700 bg-slate-800 p-3"
              >
                {/* one row: logo, operator and offer name, amount on the right */}
                <div className="flex items-center gap-2.5">
                  <OperatorLogo operator={operator} width={36} height={36} className="rounded-md" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white text-sm leading-tight truncate">{name}</h3>
                    <p className="text-slate-400 text-xs truncate" title={offer.title}>
                      {offer.title}
                    </p>
                  </div>
                  <p className="shrink-0 text-right leading-tight" title="Utilizzabile sulle scommesse sportive">
                    <span className="block text-slate-400 text-[10px]">fino a</span>
                    <span className="block text-white text-lg whitespace-nowrap">{formatEuro(sport)}</span>
                    {offer.advertisedTotal !== null && offer.advertisedTotal !== sport && (
                      <span className="block text-slate-400 text-[10px] whitespace-nowrap">
                        su {formatEuro(offer.advertisedTotal)} totali
                      </span>
                    )}
                  </p>
                </div>
                <OperatorCta
                  placement={placement}
                  operator={operator}
                  label="Vai al sito"
                  size="sm"
                  className="mt-2.5 w-full h-8 bg-action hover:bg-action-hover text-action-foreground"
                />
                <OfferDisclaimer
                  compact
                  className="text-center mt-1.5"
                  termsUrl={offer.termsUrl}
                  operator={offer.operatorId}
                  offer={offer.id}
                  placement={placement}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
