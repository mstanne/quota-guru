import { useState } from "react";
import { Check, ExternalLink, Funnel, Shield, Star, TrendingUp, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  offers as defaultOffers,
  operators as defaultOperators,
  responsibleGambling as rg,
  type OfferData,
  type OperatorData,
} from "../data/operators";
import { OperatorCta, OperatorLogo } from "./operator/OperatorUi";

// Neutral, factual filters (no "recommended" / "best bonus" rankings).
const filterCategories = [
  { id: "all", name: "Tutti gli operatori", icon: "\u{1F3AF}" },
  { id: "streaming", name: "Live Streaming", icon: "\u{1F4FA}" },
  { id: "cashout", name: "Cash Out", icon: "\u{1F4B0}" },
];

interface SitiScommessePageProps {
  /** Operators to compare (defaults to src/data/operators.ts). */
  operators?: OperatorData[];
  /** Offers, used to show each operator's current offer. */
  offers?: OfferData[];
}

const ratingValue = (o: OperatorData) => (typeof o.rating === "number" ? o.rating : 0);

/** /siti-scommesse – factual comparison of authorised operators. */
export function SitiScommessePage({ operators = defaultOperators, offers = defaultOffers }: SitiScommessePageProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const offerOf = (o: OperatorData) => offers.find((x) => x.operatorId === o.id);
  const filteredBookmakers = operators
    .filter((o) =>
      selectedCategory === "streaming" ? o.liveStreaming : selectedCategory === "cashout" ? o.cashOut : true,
    )
    .sort((a, b) => (sortBy === "rating" ? ratingValue(b) - ratingValue(a) : a.name.localeCompare(b.name)));
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-500" />
            <h1 className="text-white text-4xl">Operatori a confronto</h1>
          </div>
          <p className="text-slate-400 text-lg mb-6">
            Caratteristiche, metodi di pagamento, tempi di prelievo e condizioni degli operatori con concessione ADM
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">{operators.length}</div>
                <div className="text-slate-400 text-sm">Operatori</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">ADM</div>
                <div className="text-slate-400 text-sm">Concessione verificata</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">{rg.minAge}+</div>
                <div className="text-slate-400 text-sm">Gioco vietato ai minori</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1 flex items-center justify-center gap-1">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-slate-400 text-sm">Metodologia trasparente</div>
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
              <h2 className="text-white text-xl">Filtra operatori</h2>
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
                    <SelectItem value="name" className="text-white">
                      🔤 Nome
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
          {filteredBookmakers.map((bookmaker) => (
            <Card key={bookmaker.id} className="bg-slate-900 border-slate-800 transition-all">
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <OperatorLogo operator={bookmaker} width={48} height={48} />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white text-2xl">{bookmaker.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(ratingValue(bookmaker)) ? "fill-yellow-500 text-yellow-500" : "text-slate-600"}`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-400 text-sm">{bookmaker.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-slate-400 text-sm mb-1">Offerta attuale</div>
                    <div className="text-white text-2xl mb-2 [overflow-wrap:anywhere]">
                      {offerOf(bookmaker)?.amount ?? "[BONUS_BENVENUTO]"}
                    </div>
                    <p className="text-slate-500 text-xs">18+ · Si applicano i termini dell'operatore</p>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 mb-6">
                  <p className="text-white text-center">{offerOf(bookmaker)?.description ?? "[DESCRIZIONE_PROMO]"}</p>
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
                        <div className="text-white">ADM - Concessione n. {bookmaker.admLicense}</div>
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
                    Concessione ADM n. {bookmaker.admLicense}
                  </div>
                  <div className="flex gap-2">
                    <OperatorCta
                      operator={bookmaker}
                      href={bookmaker.reviewUrl}
                      label="Scheda completa"
                      variant="outline"
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                      icon={<ExternalLink className="w-4 h-4 ml-2" />}
                      iconPosition="end"
                    />
                    <OperatorCta
                      operator={bookmaker}
                      label="Vai al sito"
                      className="bg-orange-700 hover:bg-orange-800 text-white cursor-pointer"
                      icon={<ExternalLink className="w-4 h-4 ml-2" />}
                      iconPosition="end"
                    />
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
              Gioca responsabilmente
            </h3>
            <p className="text-slate-300 text-sm mb-3">
              In questa pagina compaiono solo operatori con concessione dell'{rg.regulatorName}: verifica il numero di
              concessione sull'elenco ufficiale. Il gioco è vietato ai minori di {rg.minAge} anni e può causare
              dipendenza patologica.
            </p>
            <p className="text-slate-400 text-sm">
              {"Consulta le probabilità di vincita sul sito del concessionario e su "}
              <a
                href={rg.regulatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                www.adm.gov.it
              </a>
              {". Aiuto: "}
              {rg.helplineName}{" "}
              <a href={rg.helplineHref} className="text-white underline underline-offset-2">
                {rg.helplineNumber}
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
