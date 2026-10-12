import { useState } from "react";
import { Check, ExternalLink, Funnel, Gift, Shield, Star, TrendingUp, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

const bookmakers = [
  {
    id: "1",
    name: "Bet365",
    logo: "\u{1F3AF}",
    rating: 4.8,
    bonus: "\u20AC30",
    bonusDescription: "Scommetti \u20AC10 e Ricevi \u20AC30 in Free Bet",
    minDeposit: "\u20AC10",
    paymentMethods: ["Carta di Credito", "PayPal", "Skrill", "Neteller", "Bonifico"],
    features: ["Live Streaming", "Cash Out", "Quote Maggiorate", "App Mobile"],
    pros: ["Piattaforma completa e affidabile", "Ottimo live streaming", "Ampia copertura eventi", "Cash out veloce"],
    cons: ["Interfaccia complessa per principianti", "Assistenza solo in inglese"],
    isRecommended: true,
    licenseInfo: "ADM - Licenza n. 15012",
    withdrawalTime: "1-3 giorni",
    liveStreaming: true,
    cashOut: true,
  },
  {
    id: "2",
    name: "Betway",
    logo: "\u26A1",
    rating: 4.6,
    bonus: "\u20AC50",
    bonusDescription: "Bonus Primo Deposito 100% fino a \u20AC50",
    minDeposit: "\u20AC10",
    paymentMethods: ["Carta di Credito", "PayPal", "Skrill", "Paysafecard", "Bonifico"],
    features: ["Cash Out", "Quote Competitive", "App Mobile", "Bonus Multipla"],
    pros: ["Interfaccia intuitiva", "Ottimo bonus di benvenuto", "Quote competitive", "Assistenza in italiano"],
    cons: ["Limitato live streaming", "Tempi di prelievo medio-lunghi"],
    isRecommended: true,
    licenseInfo: "ADM - Licenza n. 15216",
    withdrawalTime: "2-5 giorni",
    liveStreaming: false,
    cashOut: true,
  },
  {
    id: "3",
    name: "888sport",
    logo: "\u{1F3C6}",
    rating: 4.5,
    bonus: "\u20AC40",
    bonusDescription: "Scommetti \u20AC10 e Ricevi \u20AC40 in Bonus",
    minDeposit: "\u20AC10",
    paymentMethods: ["Carta di Credito", "PayPal", "Skrill", "Neteller", "Apple Pay"],
    features: ["Quote Maggiorate", "Cash Out", "App Mobile", "Statistiche Avanzate"],
    pros: [
      "Marchio storico e affidabile",
      "Quote maggiorate frequenti",
      "Buona app mobile",
      "Processo di registrazione veloce",
    ],

    cons: ["Palinsesto meno ampio", "Nessun live streaming"],
    licenseInfo: "ADM - Licenza n. 15006",
    withdrawalTime: "1-4 giorni",
    liveStreaming: false,
    cashOut: true,
  },
  {
    id: "4",
    name: "Unibet",
    logo: "\u{1F48E}",
    rating: 4.7,
    bonus: "\u20AC20",
    bonusDescription: "Scommessa Senza Rischio fino a \u20AC20",
    minDeposit: "\u20AC10",
    paymentMethods: ["Carta di Credito", "PayPal", "Skrill", "Neteller", "Bonifico"],
    features: ["Cash Out", "Live Streaming", "App Mobile", "Quote Boost"],
    pros: ["Piattaforma user-friendly", "Ottimo servizio clienti", "Variet\xE0 di mercati", "Affidabilit\xE0 elevata"],
    cons: ["Bonus meno generoso", "Quote non sempre competitive"],
    isNew: false,
    licenseInfo: "ADM - Licenza n. 15028",
    withdrawalTime: "1-3 giorni",
    liveStreaming: true,
    cashOut: true,
  },
  {
    id: "5",
    name: "William Hill",
    logo: "\u{1F451}",
    rating: 4.4,
    bonus: "\u20AC25",
    bonusDescription: "Bonus Benvenuto \u20AC25 in Free Bet",
    minDeposit: "\u20AC10",
    paymentMethods: ["Carta di Credito", "PayPal", "Skrill", "Paysafecard"],
    features: ["Cash Out", "Quote Maggiorate", "App Mobile", "Negozi Fisici"],
    pros: [
      "Marchio storico e affidabile",
      "Presenza negozi fisici in Italia",
      "Buone quote calcio",
      "Cash out parziale",
    ],

    cons: ["Interfaccia datata", "Live streaming limitato", "Tempi prelievo lenti"],
    licenseInfo: "ADM - Licenza n. 15214",
    withdrawalTime: "3-7 giorni",
    liveStreaming: false,
    cashOut: true,
  },
  {
    id: "6",
    name: "Sisal",
    logo: "\u{1F1EE}\u{1F1F9}",
    rating: 4.3,
    bonus: "\u20AC35",
    bonusDescription: "Bonus Sport 100% fino a \u20AC35",
    minDeposit: "\u20AC10",
    paymentMethods: ["Carta di Credito", "PayPal", "Sisal Pay", "Bonifico"],
    features: ["Cash Out", "App Mobile", "Negozi Fisici", "Matchpoint"],
    pros: [
      "Operatore 100% italiano",
      "Ampia rete negozi fisici",
      "Assistenza in italiano eccellente",
      "Metodi pagamento locali",
    ],

    cons: ["Quote meno competitive", "Palinsetto limitato", "Nessun live streaming"],
    licenseInfo: "ADM - Licenza n. 15001",
    withdrawalTime: "2-4 giorni",
    liveStreaming: false,
    cashOut: true,
  },
];

const filterCategories = [
  {
    id: "all",
    name: "Tutti i Siti",
    icon: "\u{1F3AF}",
  },
  {
    id: "recommended",
    name: "Consigliati",
    icon: "\u2B50",
  },
  {
    id: "bonus",
    name: "Miglior Bonus",
    icon: "\u{1F381}",
  },
  {
    id: "streaming",
    name: "Live Streaming",
    icon: "\u{1F4FA}",
  },
  {
    id: "cashout",
    name: "Cash Out",
    icon: "\u{1F4B0}",
  },
];

export function SitiScommessePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const filteredBookmakers = [
    ...bookmakers.filter((bookmaker) =>
      selectedCategory === "all"
        ? true
        : selectedCategory === "recommended"
          ? bookmaker.isRecommended
          : selectedCategory === "streaming"
            ? bookmaker.liveStreaming
            : selectedCategory === "cashout"
              ? bookmaker.cashOut
              : selectedCategory === "bonus"
                ? parseInt(bookmaker.bonus.replace("\u20AC", "")) >= 30
                : true,
    ),
  ].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "bonus") {
      const bonusA = parseInt(a.bonus.replace("\u20AC", ""));
      return parseInt(b.bonus.replace("\u20AC", "")) - bonusA;
    }
    return 0;
  });
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-500" />
            <h1 className="text-white text-4xl">Migliori Siti di Scommesse</h1>
          </div>
          <p className="text-slate-400 text-lg mb-6">
            Confronta i migliori bookmaker legali in Italia. Bonus, quote e recensioni verificate
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">{bookmakers.length}</div>
                <div className="text-slate-400 text-sm">Bookmaker</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">100%</div>
                <div className="text-slate-400 text-sm">Legali ADM</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">€185</div>
                <div className="text-slate-400 text-sm">Bonus Totali</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1 flex items-center justify-center gap-1">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-slate-400 text-sm">Sicuri e Verificati</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Funnel className="w-5 h-5 text-slate-400" />
              <h2 className="text-white text-xl">Filtra Bookmaker</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {filterCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-white">
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Ordina per</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Ordina per" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="rating" className="text-white">
                      ⭐ Valutazione
                    </SelectItem>
                    <SelectItem value="bonus" className="text-white">
                      🎁 Bonus
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={
                    selectedCategory === category.id
                      ? "bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  }
                >
                  {category.icon} {category.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
        <div className="space-y-6">
          {filteredBookmakers.map((bookmaker, index) => (
            <Card key={bookmaker.id} className="bg-slate-900 border-slate-800 hover:border-green-500 transition-all">
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{bookmaker.logo}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white text-2xl">{bookmaker.name}</h3>
                        {bookmaker.isRecommended && <Badge className="bg-green-500 text-white">Consigliato</Badge>}
                        {bookmaker.isNew && <Badge className="bg-orange-500 text-white">Nuovo</Badge>}
                        {index === 0 && (
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            #1
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(bookmaker.rating) ? "fill-yellow-500 text-yellow-500" : "text-slate-600"}`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-400 text-sm">{bookmaker.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-slate-400 text-sm mb-1">Bonus Benvenuto</div>
                    <div className="text-green-500 text-3xl mb-2">{bookmaker.bonus}</div>
                    <Button className="bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer">
                      <Gift className="w-4 h-4 mr-2" />
                      Richiedi Bonus
                    </Button>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 mb-6">
                  <p className="text-white text-center">{bookmaker.bonusDescription}</p>
                  <p className="text-slate-400 text-sm text-center mt-2">
                    {"Deposito minimo: "}
                    {bookmaker.minDeposit}
                  </p>
                </div>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-slate-800 mb-4">
                    <TabsTrigger
                      value="overview"
                      className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
                    >
                      Panoramica
                    </TabsTrigger>
                    <TabsTrigger
                      value="pros"
                      className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
                    >
                      Pro e Contro
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
                    >
                      Dettagli
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-white mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          Caratteristiche Principali
                        </h4>
                        <div className="space-y-2">
                          {bookmaker.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-slate-300">
                              <Check className="w-4 h-4 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-green-500" />
                          Metodi di Pagamento
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {bookmaker.paymentMethods.map((method, i) => (
                            <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="pros">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-green-500 mb-3 flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          Vantaggi
                        </h4>
                        <ul className="space-y-2">
                          {bookmaker.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-300">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-orange-500 mb-3 flex items-center gap-2">
                          <X className="w-5 h-5" />
                          Svantaggi
                        </h4>
                        <ul className="space-y-2">
                          {bookmaker.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-300">
                              <X className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="details">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Licenza</div>
                        <div className="text-white">{bookmaker.licenseInfo}</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Tempo Prelievo</div>
                        <div className="text-white">{bookmaker.withdrawalTime}</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Deposito Minimo</div>
                        <div className="text-white">{bookmaker.minDeposit}</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-slate-400 text-sm">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Bookmaker legale e autorizzato ADM
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                    >
                      Recensione Completa
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer">
                      Visita Sito
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="bg-blue-500/10 border-blue-500/20 mt-8">
          <div className="p-6">
            <h3 className="text-blue-400 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gioca Responsabilmente
            </h3>
            <p className="text-slate-300 text-sm mb-3">
              Tutti i siti di scommesse presenti in questa pagina sono legali e autorizzati dall'Agenzia delle Dogane e
              dei Monopoli (ADM). Il gioco è vietato ai minori di 18 anni e può causare dipendenza patologica.
            </p>
            <p className="text-slate-400 text-sm">
              {"Consulta le probabilit\xE0 di vincita sul sito del concessionario e su "}
              <a href="#" className="text-blue-400 hover:text-blue-300 cursor-pointer">
                www.adm.gov.it
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
