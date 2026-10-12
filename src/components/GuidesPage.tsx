import { Award, BookOpen, Calculator, Clock, Shield, Target, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageSlot } from "./media/ImageSlot";

const guides = [
  {
    id: "1",
    title: "Guida Completa alle Scommesse Sportive",
    description:
      "Tutto quello che devi sapere per iniziare a scommettere in modo responsabile e informato. Dalle basi alle strategie avanzate.",
    category: "Per Principianti",
    readTime: "8 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
    featured: true,
  },
  {
    id: "2",
    title: "Come Leggere le Quote Sportive",
    description:
      "Impara a interpretare le quote decimali, frazionarie e americane. Scopri come calcolare le probabilit\xE0 implicite.",
    category: "Quote e Probabilit\xE0",
    readTime: "5 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
    featured: true,
  },
  {
    id: "3",
    title: "Strategie di Betting sul Calcio",
    description: "Le migliori strategie per scommettere sul calcio: 1X2, Over/Under, Handicap asiatico e molto altro.",
    category: "Strategie",
    readTime: "10 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
    featured: true,
  },
  {
    id: "4",
    title: "Gestione del Bankroll",
    description:
      "Come gestire il tuo budget di scommessa in modo efficace. Le regole d'oro per non perdere il controllo.",
    category: "Bankroll Management",
    readTime: "6 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
  },
  {
    id: "5",
    title: "Scommesse sul Tennis: Guida Completa",
    description:
      "Tutto sul betting tennistico: superfici, head-to-head, mercati live e statistiche chiave da analizzare.",
    category: "Sport Specifici",
    readTime: "7 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
  },
  {
    id: "6",
    title: "Betting sul Basket: Over/Under e Handicap",
    description:
      "Le particolarit\xE0 delle scommesse sul basket NBA ed europeo. Come sfruttare i quarti e gli handicap.",
    category: "Sport Specifici",
    readTime: "6 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
  },
];

const categories = [
  {
    name: "Per Principianti",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    name: "Quote e Probabilit\xE0",
    icon: Calculator,
    color: "text-green-500",
  },
  {
    name: "Strategie",
    icon: Target,
    color: "text-orange-500",
  },
  {
    name: "Bankroll Management",
    icon: Shield,
    color: "text-purple-500",
  },
  {
    name: "Sport Specifici",
    icon: Award,
    color: "text-yellow-500",
  },
  {
    name: "Scommesse Live",
    icon: Clock,
    color: "text-red-500",
  },
];

export function GuidesPage({ onGuideClick }: { onGuideClick?: (guideId: string) => void }) {
  return (
    <div className="py-12 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-green-500" />
            <h2 className="text-white text-3xl">Guide alle Scommesse</h2>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Impara le basi, scopri strategie avanzate e diventa un esperto di betting sportivo
          </p>
        </div>
        <div className="mb-12">
          <h3 className="text-white text-xl mb-6">Esplora per Categoria</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  className="bg-slate-900 border-slate-800 hover:border-green-500 transition-all cursor-pointer group"
                >
                  <div className="p-4 text-center">
                    <Icon
                      className={`w-8 h-8 ${category.color} mx-auto mb-2 group-hover:scale-110 transition-transform`}
                    />

                    <p className="text-slate-300 text-sm group-hover:text-white transition-colors">{category.name}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-white text-xl mb-6">Guide in Evidenza</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides
              .filter((guide) => guide.featured)
              .map((guide) => (
                <Card
                  key={guide.id}
                  className="bg-slate-900 border-slate-800 hover:border-green-500 transition-all overflow-hidden cursor-pointer group"
                  onClick={() => onGuideClick?.(guide.id)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <ImageSlot
                      placeholder="[PLACEHOLDER_IMMAGINE_GUIDA_800x450]"
                      src={guide.image}
                      alt={guide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-4 left-4">
                      <Badge className="bg-green-500 text-white">In Evidenza</Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {guide.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{guide.readTime}</span>
                      </div>
                    </div>
                    <h4 className="text-white text-lg mb-2 group-hover:text-green-500 transition-colors">
                      {guide.title}
                    </h4>
                    <p className="text-slate-400 text-sm line-clamp-2">{guide.description}</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        <div>
          <h3 className="text-white text-xl mb-6">Tutte le Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides
              .filter((guide) => !guide.featured)
              .map((guide) => (
                <Card
                  key={guide.id}
                  className="bg-slate-900 border-slate-800 hover:border-green-500 transition-all overflow-hidden cursor-pointer group"
                  onClick={() => onGuideClick?.(guide.id)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <ImageSlot
                      placeholder="[PLACEHOLDER_IMMAGINE_GUIDA_800x450]"
                      src={guide.image}
                      alt={guide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {guide.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{guide.readTime}</span>
                      </div>
                    </div>
                    <h4 className="text-white text-lg mb-2 group-hover:text-green-500 transition-colors">
                      {guide.title}
                    </h4>
                    <p className="text-slate-400 text-sm line-clamp-2">{guide.description}</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        <Card className="mt-12 bg-green-500/10 border-green-500/20">
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-white text-2xl mb-3">Hai Bisogno di Aiuto?</h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Il nostro team di esperti è sempre disponibile per aiutarti a comprendere meglio il mondo delle scommesse
              sportive. Contattaci per domande o approfondimenti.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-slate-950 rounded-lg transition-colors cursor-pointer"
              >
                <BookOpen className="w-5 h-5" />
                Esplora Tutte le Guide
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Shield className="w-5 h-5" />
                Gioco Responsabile
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
