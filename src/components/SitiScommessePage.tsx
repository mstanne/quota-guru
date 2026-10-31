import { useState } from "react";
import { Check, ExternalLink, Funnel, Shield, TrendingUp, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Link } from "../lib/links";
import {
  isPlaceholder,
  operators as defaultOperators,
  responsibleGambling as rg,
  type OperatorData,
} from "../data/operators";
import { amountFor, formatEuro, visibleOffers, type WelcomeOffer } from "../data/offers";
import { paths } from "../routes";
import { operatorPath } from "../lib/operatorPages";
import { OperatorCta, OperatorLogo } from "./operator/OperatorUi";
import { OffersSidebar } from "./operator/OffersSidebar";
import { PageHeader, MetaItems } from "./layout/PageHeader";
import { currentPage, track } from "../lib/analytics";

// Neutral, factual filters (no "recommended" / "best bonus" rankings, no ratings).
const filterCategories = [
  { id: "all", name: "Tutti gli operatori", icon: "\u{1F3AF}" },
  { id: "streaming", name: "Diretta streaming", icon: "\u{1F4FA}" },
  { id: "cashout", name: "Cash out", icon: "\u{1F4B0}" },
];

interface SitiScommessePageProps {
  /** Operators to compare (defaults to src/data/operators.ts). */
  operators?: OperatorData[];
  /** Welcome offers (src/data/offers.json), used to show each operator's current offer. */
  offers?: WelcomeOffer[];
}

/** Shows a field only once it has been filled in (placeholders such as [DEPOSITO_MINIMO] are hidden). */
const filled = (v: string) => (isPlaceholder(v) ? "Non ancora indicato" : v);
const filledList = (list: string[]) => list.filter((v) => !isPlaceholder(v));

/** /siti-scommesse – factual comparison of authorised operators, in alphabetical order. */
export function SitiScommessePage({
  operators = defaultOperators,
  offers = visibleOffers({ includeDrafts: import.meta.env.DEV }),
}: SitiScommessePageProps) {
  const [selectedCategory, setCategory] = useState("all");
  const setSelectedCategory = (value: string) => {
    setCategory(value);
    track("filter_use", { filter: "operator-category", value, page: currentPage() });
  };
  // Sport welcome offer of the operator (the site is a sports-odds comparison); falls back to any offer.
  const offerOf = (o: OperatorData) =>
    offers.find((x) => x.operatorId === o.id && x.sections.includes("sport")) ??
    offers.find((x) => x.operatorId === o.id);
  // operators still to be filled in ([NOME_OPERATORE_n]) are not listed
  const listed = operators.filter((o) => !isPlaceholder(o.name));
  const filteredBookmakers = listed
    .filter((o) =>
      selectedCategory === "streaming" ? o.liveStreaming : selectedCategory === "cashout" ? o.cashOut : true,
    )
    // alphabetical; operators still to be filled in ([NOME_OPERATORE_n]) go last
    .sort(
      (a, b) => Number(isPlaceholder(a.name)) - Number(isPlaceholder(b.name)) || a.name.localeCompare(b.name, "it"),
    );
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Shield}
        title="Operatori a confronto"
        subtitle="Caratteristiche, metodi di pagamento, tempi di prelievo e condizioni degli operatori con concessione ADM"
        breadcrumb={[{ label: "Siti scommesse" }]}
        meta={
          <MetaItems
            items={[
              `${listed.length} operatori`,
              "Solo concessionari ADM",
              "In ordine alfabetico",
              `Vietato ai minori di ${rg.minAge} anni`,
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:items-start">
        <div className="min-w-0">
          <Card className="bg-slate-900 border-slate-800 mb-8">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Funnel className="w-5 h-5 text-slate-400" />
                <h2 className="text-white text-xl">Filtra operatori</h2>
              </div>
              <div className="max-w-md mb-6">
                <label className="text-slate-400 text-sm mb-2 block">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger aria-label="Categoria" className="bg-slate-800 border-slate-500 text-white">
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
              <div className="flex flex-wrap gap-2">
                {filterCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={
                      selectedCategory === category.id
                        ? "bg-selected hover:bg-selected text-selected-foreground cursor-pointer"
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
                        <h3 className="text-white text-2xl">
                          <Link to={operatorPath(bookmaker)} className="hover:underline underline-offset-4">
                            {bookmaker.name}
                          </Link>
                        </h3>
                        <Link
                          to={operatorPath(bookmaker)}
                          className="text-sm text-action-text hover:text-action-text-hover"
                        >
                          Scheda completa →
                        </Link>
                      </div>
                    </div>
                    <OfferSummary offer={offerOf(bookmaker)} />
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 mb-6">
                    <p className="text-white text-center">{bookmaker.description}</p>
                    <p className="text-slate-400 text-sm text-center mt-2">
                      {"Deposito minimo: "}
                      {filled(bookmaker.minDeposit)}
                    </p>
                  </div>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-slate-800 mb-4">
                      <TabsTrigger
                        value="overview"
                        className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
                      >
                        Panoramica
                      </TabsTrigger>
                      <TabsTrigger
                        value="pros"
                        className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
                      >
                        Pro e contro
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
                      >
                        Dettagli
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-white mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-300" />
                            Caratteristiche principali
                          </h4>
                          <div className="space-y-2">
                            {filledList(bookmaker.features).map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-slate-300">
                                <Check className="w-4 h-4 text-slate-300" />
                                <span>{feature}</span>
                              </div>
                            ))}
                            {filledList(bookmaker.features).length === 0 && (
                              <p className="text-slate-500 text-sm">Non ancora indicati</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white mb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-slate-300" />
                            Metodi di pagamento
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {filledList(bookmaker.paymentMethods).map((method, i) => (
                              <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300">
                                {method}
                              </Badge>
                            ))}
                            {filledList(bookmaker.paymentMethods).length === 0 && (
                              <p className="text-slate-500 text-sm">Non ancora indicati</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="pros">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-best mb-3 flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            Vantaggi
                          </h4>
                          <ul className="space-y-2">
                            {filledList(bookmaker.pros).map((pro, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300">
                                <Check className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                                <span>{pro}</span>
                              </li>
                            ))}
                            {filledList(bookmaker.pros).length === 0 && (
                              <p className="text-slate-500 text-sm">Non ancora indicati</p>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-red-400 mb-3 flex items-center gap-2">
                            <X className="w-5 h-5" />
                            Svantaggi
                          </h4>
                          <ul className="space-y-2">
                            {filledList(bookmaker.cons).map((con, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300">
                                <X className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                                <span>{con}</span>
                              </li>
                            ))}
                            {filledList(bookmaker.cons).length === 0 && (
                              <p className="text-slate-500 text-sm">Non ancora indicati</p>
                            )}
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
                          <div className="text-slate-400 text-sm mb-1">Tempo di prelievo</div>
                          <div className="text-white">{filled(bookmaker.withdrawalTime)}</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                          <div className="text-slate-400 text-sm mb-1">Deposito minimo</div>
                          <div className="text-white">{filled(bookmaker.minDeposit)}</div>
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
                      {!isPlaceholder(bookmaker.reviewUrl) && (
                        <OperatorCta
                          placement="operator-review"
                          operator={bookmaker}
                          href={bookmaker.reviewUrl}
                          label="Scheda completa"
                          variant="outline"
                          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                          icon={<ExternalLink className="w-4 h-4 ml-2" />}
                          iconPosition="end"
                        />
                      )}
                      <OperatorCta
                        placement="operator-card"
                        operator={bookmaker}
                        label="Vai al sito"
                        className="bg-action hover:bg-action-hover text-action-foreground cursor-pointer"
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
        <div className="mt-10 lg:mt-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-xl">
          <OffersSidebar />
        </div>
      </div>
    </div>
  );
}

/** Operator's current welcome offer: the part usable on sports, with a link to the full conditions. */
function OfferSummary({ offer }: { offer?: WelcomeOffer }) {
  if (!offer) {
    return (
      <div className="text-center md:text-right">
        <div className="text-slate-400 text-sm mb-1">Offerta di benvenuto</div>
        <div className="text-slate-300 text-sm max-w-[16rem]">Nessuna offerta verificata al momento</div>
      </div>
    );
  }
  const product = offer.sections.includes("sport") ? "sport" : offer.sections[0];
  const label = product === "sport" ? "sulle scommesse sportive" : "su casinò e slot";
  return (
    <div className="text-center md:text-right">
      <div className="text-slate-400 text-sm mb-1">Offerta di benvenuto {label}</div>
      <div className="text-white text-2xl mb-1">fino a {formatEuro(amountFor(offer, product))}</div>
      <p className="text-slate-400 text-xs">
        18+ · Si applicano i termini dell'operatore ·{" "}
        <Link
          to={`${paths.bonus}#${product}`}
          className="underline underline-offset-2 hover:text-slate-300"
          data-track="offer_terms_click"
          data-track-operator={offer.operatorId}
          data-track-offer={offer.id}
          data-track-placement="operator-card"
        >
          condizioni
        </Link>
      </p>
    </div>
  );
}
