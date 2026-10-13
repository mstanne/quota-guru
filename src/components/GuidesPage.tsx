import { Award, BookOpen, Calculator, Clock, Shield, Target, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageSlot } from "./media/ImageSlot";
import { PageHeader } from "./layout/PageHeader";

const guides = [
  {
    id: "1",
    title: "Guida Completa alle Scommesse Sportive",
    description:
      "Tutto quello che devi sapere per iniziare a scommettere in modo responsabile e informato. Dalle basi alle strategie avanzate.",
    category: "Per principianti",
    readTime: "8 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
    featured: true,
  },
  {
    id: "2",
    title: "Come Leggere le Quote Sportive",
    description:
      "Impara a interpretare le quote decimali, frazionarie e americane. Scopri come calcolare le probabilit\xE0 implicite.",
    category: "Quote e probabilità",
    readTime: "5 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
    featured: true,
  },
  {
    id: "3",
    title: "Strategie per le scommesse sul calcio",
    description: "Le migliori strategie per scommettere sul calcio: 1X2, Over/Under, Handicap asiatico e molto altro.",
    category: "Strategie",
    readTime: "10 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
    featured: true,
  },
  {
    id: "4",
    title: "Gestione del budget",
    description:
      "Come gestire il tuo budget di scommessa in modo efficace. Le regole d'oro per non perdere il controllo.",
    category: "Gestione del budget",
    readTime: "6 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
  },
  {
    id: "5",
    title: "Scommesse sul Tennis: Guida Completa",
    description:
      "Tutto sul betting tennistico: superfici, head-to-head, mercati live e statistiche chiave da analizzare.",
    category: "Sport specifici",
    readTime: "7 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
  },
  {
    id: "6",
    title: "Betting sul Basket: Over/Under e Handicap",
    description:
      "Le particolarit\xE0 delle scommesse sul basket NBA ed europeo. Come sfruttare i quarti e gli handicap.",
    category: "Sport specifici",
    readTime: "6 min",
    image: null as string | null, // [URL_IMMAGINE_GUIDA] – own, sport-themed image (no casino imagery)
  },
];

const categories = [
  {
    name: "Per principianti",
    icon: BookOpen,
    color: "text-slate-300",
  },
  {
    name: "Quote e probabilità",
    icon: Calculator,
    color: "text-slate-300",
  },
  {
    name: "Strategie",
    icon: Target,
    color: "text-slate-300",
  },
  {
    name: "Gestione del budget",
    icon: Shield,
    color: "text-slate-300",
  },
  {
    name: "Sport specifici",
    icon: Award,
    color: "text-slate-300",
  },
  {
    name: "Scommesse in diretta",
    icon: Clock,
    color: "text-slate-300",
  },
];

export function GuidesPage({ onGuideClick }: { onGuideClick?: (guideId: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={BookOpen}
        title="Guide alle scommesse"
        subtitle="Le basi per leggere le quote, gestire il budget e giocare in modo informato e responsabile"
        breadcrumb={[{ label: "Guide" }]}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h3 className="text-white text-xl mb-6">Esplora per categoria</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  className="bg-slate-900 border-slate-800 hover:border-slate-500 transition-all cursor-pointer group"
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
          <h3 className="text-white text-xl mb-6">Guide in evidenza</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides
              .filter((guide) => guide.featured)
              .map((guide) => (
                <Card
                  key={guide.id}
                  className="bg-slate-900 border-slate-800 hover:border-slate-500 transition-all overflow-hidden cursor-pointer group"
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
                      <Badge className="bg-slate-700 text-white">In evidenza</Badge>
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
                    <h4 className="text-white text-lg mb-2 group-hover:text-white transition-colors">{guide.title}</h4>
                    <p className="text-slate-400 text-sm line-clamp-2">{guide.description}</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        <div>
          <h3 className="text-white text-xl mb-6">Tutte le guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides
              .filter((guide) => !guide.featured)
              .map((guide) => (
                <Card
                  key={guide.id}
                  className="bg-slate-900 border-slate-800 hover:border-slate-500 transition-all overflow-hidden cursor-pointer group"
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
                    <h4 className="text-white text-lg mb-2 group-hover:text-white transition-colors">{guide.title}</h4>
                    <p className="text-slate-400 text-sm line-clamp-2">{guide.description}</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        <Card className="mt-12 bg-slate-800/60 border-slate-700">
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-white text-2xl mb-3">Hai bisogno di aiuto?</h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Il nostro team di esperti è sempre disponibile per aiutarti a comprendere meglio il mondo delle scommesse
              sportive. Contattaci per domande o approfondimenti.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 bg-action hover:bg-action-hover text-action-foreground rounded-lg transition-colors cursor-pointer"
              >
                <BookOpen className="w-5 h-5" />
                Esplora Tutte le guide
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
