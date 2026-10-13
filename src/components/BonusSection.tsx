import { Gift, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { getOperator, offers as defaultOffers, type OfferData, type OperatorData } from "../data/operators";
import { OfferDisclaimer, OperatorCta, OperatorLogo } from "./operator/OperatorUi";

interface BonusSectionProps {
  /** Offers to show (defaults to the first 4 from src/data/operators.ts). */
  offers?: OfferData[];
  /** Resolves an offer's operator (defaults to the template operator list). */
  resolveOperator?: (id: string) => OperatorData;
  onViewAllClick?: () => void;
}

/** Home page block: operator offers, informational (no ranking, no "popular" badges). */
export function BonusSection({
  offers = defaultOffers.slice(0, 4),
  resolveOperator = getOperator,
  onViewAllClick,
}: BonusSectionProps) {
  return (
    <div className="py-12 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-slate-300" />
            <h2 className="text-white text-2xl">Offerte degli operatori</h2>
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
            const operator = resolveOperator(offer.operatorId);
            return (
              <Card
                key={offer.id}
                className="bg-slate-800 border-slate-700 transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <OperatorLogo operator={operator} width={48} height={48} className="rounded-lg" />
                      <div>
                        <h3 className="text-white">{operator.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                          <span className="text-slate-400 text-sm">{operator.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 text-center">
                    <div className="text-slate-400 text-xs mb-1">{offer.title}</div>
                    <div className="text-white text-2xl leading-tight [overflow-wrap:anywhere]">{offer.amount}</div>
                  </div>
                  <p className="text-slate-300 text-sm mb-4 text-center">{offer.description}</p>
                  <OperatorCta
                    placement="home-offers"
                    operator={operator}
                    label="Vai al sito"
                    className="w-full bg-action hover:bg-action-hover text-action-foreground"
                  />
                  <OfferDisclaimer className="text-center mt-2" termsUrl={offer.termsUrl} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
