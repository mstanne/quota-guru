import { Gift, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const bonusOffers = [
  {
    id: "1",
    bookmaker: "Bet365",
    logo: "\u{1F3AF}",
    title: "Bonus di Benvenuto",
    description: "Scommetti \u20AC10 e Ricevi \u20AC30 in Free Bet",
    bonus: "\u20AC30",
    rating: 4.8,
    isPopular: true,
  },
  {
    id: "2",
    bookmaker: "Betway",
    logo: "\u26A1",
    title: "Bonus Primo Deposito",
    description: "100% fino a \u20AC50",
    bonus: "\u20AC50",
    rating: 4.6,
    isPopular: true,
  },
  {
    id: "3",
    bookmaker: "888sport",
    logo: "\u{1F3C6}",
    title: "Offerta Nuovi Clienti",
    description: "Scommetti \u20AC10 e Ricevi \u20AC40 in Bonus",
    bonus: "\u20AC40",
    rating: 4.5,
  },
  {
    id: "4",
    bookmaker: "Unibet",
    logo: "\u{1F48E}",
    title: "Pacchetto Benvenuto",
    description: "Scommessa Senza Rischio fino a \u20AC20",
    bonus: "\u20AC20",
    rating: 4.7,
  },
];
export function BonusSection({ onViewAllClick }: { onViewAllClick?: () => void }) {
  return (
    <div className="py-12 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-orange-500" />
            <h2 className="text-white text-2xl">I Migliori Bonus di Benvenuto</h2>
          </div>
          <Button
            variant="outline"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={onViewAllClick}
          >
            Vedi tutti i Bonus
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bonusOffers.map((offer) => (
            <Card
              key={offer.id}
              className="bg-slate-800 border-slate-700 hover:border-orange-500 transition-all duration-300 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-2xl">
                      {offer.logo}
                    </div>
                    <div>
                      <h3 className="text-white">{offer.bookmaker}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-slate-400 text-sm">{offer.rating}</span>
                      </div>
                    </div>
                  </div>
                  {offer.isPopular && <Badge className="bg-orange-500 text-white text-xs">Popolare</Badge>}
                </div>
                <div className="bg-orange-500 rounded-lg p-4 mb-4 text-center">
                  <div className="text-white text-xs mb-1">{offer.title}</div>
                  <div className="text-white text-3xl">{offer.bonus}</div>
                </div>
                <p className="text-slate-300 text-sm mb-4 text-center">{offer.description}</p>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-slate-950">Ottieni il Bonus</Button>
                <p className="text-slate-500 text-xs text-center mt-2">T&C Applicati. 18+</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
