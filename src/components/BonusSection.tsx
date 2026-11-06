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
}

/** Home page block: sport welcome offers, informational (no ranking, no ratings, no "popular" badges). */
export function BonusSection({
  offers = offersInSection(visibleOffers({ includeDrafts: import.meta.env.DEV }), "sport").slice(0, 4),
  resolveOperator = getOperator,
  onViewAllClick,
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
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={onViewAllClick}
          >
            Tutte<span className="hidden sm:inline">&nbsp;le offerte</span>
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
                className="w-[78%] max-w-[18rem] shrink-0 snap-start lg:w-auto lg:max-w-none flex flex-col rounded-xl border border-slate-700 bg-slate-800 p-4"
              >
                <div className="flex items-center gap-2.5">
                  <OperatorLogo operator={operator} width={40} height={40} className="rounded-md" />
                  <div className="min-w-0">
                    <h3 className="text-white text-base leading-tight truncate">{name}</h3>
                    <p className="text-slate-400 text-xs truncate" title={offer.title}>
                      {offer.title}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-white text-xl leading-tight">
                  fino a {formatEuro(sport)}
                  <span className="block text-slate-400 text-xs mt-0.5">
                    sulle scommesse sportive
                    {offer.advertisedTotal !== null && offer.advertisedTotal !== sport
                      ? ` · totale indicato ${formatEuro(offer.advertisedTotal)}`
                      : ""}
                  </span>
                </p>
                <div className="mt-auto pt-3">
                  <OperatorCta
                    placement="home-offers"
                    operator={operator}
                    label="Vai al sito"
                    size="sm"
                    className="w-full bg-action hover:bg-action-hover text-action-foreground"
                  />
                  <OfferDisclaimer
                    className="text-center mt-1.5"
                    termsUrl={offer.termsUrl}
                    operator={offer.operatorId}
                    offer={offer.id}
                    placement="home-offers"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
