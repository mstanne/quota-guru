import { Gift } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
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
    <div className="py-12 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-slate-300" />
            <h2 className="text-white text-2xl">Offerte di benvenuto</h2>
          </div>
          <Button
            variant="outline"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={onViewAllClick}
          >
            Tutte le offerte
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {offers.map((offer) => {
            const resolved = resolveOperator(offer.operatorId);
            const name = isPlaceholder(resolved.name) ? offer.operatorName : resolved.name;
            const operator = { ...resolved, name, logoAlt: `Logo ${name}` };
            return (
              <Card
                key={offer.id}
                className="bg-slate-800 border-slate-700 transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <OperatorLogo operator={operator} width={48} height={48} className="rounded-lg" />
                    <h3 className="text-white">{name}</h3>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 text-center">
                    <div className="text-slate-400 text-xs mb-1">Utilizzabile sulle scommesse sportive</div>
                    <div className="text-white text-2xl leading-tight">fino a {formatEuro(amountFor(offer, "sport"))}</div>
                    {offer.advertisedTotal !== null && offer.advertisedTotal !== amountFor(offer, "sport") && (
                      <div className="text-slate-400 text-xs mt-2">
                        Totale indicato dall'operatore: {formatEuro(offer.advertisedTotal)}
                      </div>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm mb-4 text-center">{offer.title}</p>
                  <OperatorCta
                    placement="home-offers"
                    operator={operator}
                    label="Vai al sito"
                    className="w-full bg-action hover:bg-action-hover text-action-foreground"
                  />
                  <OfferDisclaimer
                    className="text-center mt-2"
                    termsUrl={offer.termsUrl}
                    operator={offer.operatorId}
                    offer={offer.id}
                    placement="home-offers"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
