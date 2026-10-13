import { useState } from "react";
import { CircleAlert, CircleCheckBig, Funnel, Gift, Info, Phone, Star } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  getOperator,
  offerCategories,
  offers as defaultOffers,
  operators,
  responsibleGambling as rg,
  type OfferData,
  type OperatorData,
} from "../data/operators";
import { OfferDisclaimer, OperatorCta, OperatorLogo } from "./operator/OperatorUi";
import { PageHeader, MetaItems } from "./layout/PageHeader";

interface BonusPageProps {
  /** Offers to list (defaults to src/data/operators.ts). */
  offers?: OfferData[];
  resolveOperator?: (id: string) => OperatorData;
}

/** /bonus – informational comparison of offer conditions (no ranking, no "claim" language). */
export function BonusPage({ offers = defaultOffers, resolveOperator = getOperator }: BonusPageProps) {
  const [category, setCategory] = useState<string>("all");
  const visible = offers.filter((o) => category === "all" || o.category === category);
  const countFor = (id: string) => (id === "all" ? offers.length : offers.filter((o) => o.category === id).length);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Gift}
        title="Offerte a confronto"
        subtitle="Le condizioni delle offerte degli operatori autorizzati, una accanto all'altra: deposito minimo, requisiti di giocata, scadenze e termini."
        breadcrumb={[{ label: "Offerte" }]}
        meta={
          <MetaItems items={[`${offers.length} offerte`, `${operators.length} operatori`, "Solo concessionari ADM"]} />
        }
      />
      <div className="container mx-auto px-4 py-12">
        <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-blue-400 text-lg mb-2">Come leggere le condizioni</h2>
                <p className="text-slate-300 text-sm mb-3">
                  Le offerte degli operatori sono soggette a requisiti precisi: importo minimo di deposito, numero di
                  volte in cui l'importo va giocato prima del prelievo, quote minime e scadenza.
                </p>
                <p className="text-slate-400 text-sm">
                  Leggi sempre i termini completi sul sito dell'operatore. Un'offerta non è un motivo per giocare: gioca
                  solo somme che puoi permetterti di perdere.
                </p>
              </div>
            </div>
          </div>
        </Card>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Funnel className="w-5 h-5 text-slate-400" />
            <h2 className="text-white text-xl">Filtra per categoria</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {offerCategories.map((c) => (
              <Button
                key={c.id}
                variant={category === c.id ? "default" : "outline"}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
                className={
                  category === c.id
                    ? "bg-selected hover:bg-selected text-selected-foreground cursor-pointer"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                }
              >
                {c.name}
                {countFor(c.id) > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-slate-800 text-slate-300">
                    {countFor(c.id)}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-white text-2xl mb-6">Offerte in primo piano</h2>
          <div className="grid grid-cols-1 gap-6">
            {visible
              .filter((offer) => offer.featured)
              .map((offer) => {
                const operator = resolveOperator(offer.operatorId);
                return (
                  <Card key={offer.id} className="bg-slate-900 border-slate-700 transition-all overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-1/4">
                          <div className="flex items-start gap-4">
                            <OperatorLogo operator={operator} width={64} height={64} className="rounded-lg" />
                            <div className="flex-1">
                              <h3 className="text-white text-xl mb-1">{operator.name}</h3>
                              <div className="flex items-center gap-1 mb-2">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                                <span className="text-slate-300">{operator.rating}</span>
                              </div>
                              <p className="text-slate-400 text-xs">Concessione ADM {operator.admLicense}</p>
                            </div>
                          </div>
                        </div>
                        <div className="lg:w-1/2 lg:border-l lg:border-r border-slate-800 lg:px-6">
                          <div className="mb-4">
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300 mb-2">
                              {offer.offerType}
                            </Badge>
                            <h4 className="text-white text-lg mb-2">{offer.title}</h4>
                            <p className="text-slate-400 text-sm mb-4">{offer.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-slate-400 text-xs mb-1">Deposito minimo</div>
                              <div className="text-white">{offer.minDeposit}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs mb-1">Requisiti di giocata</div>
                              <div className="text-white">{offer.wageringRequirement}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-2">Condizioni principali:</div>
                            <ul className="space-y-1">
                              {offer.highlights.map((highlight, i) => (
                                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                  <CircleCheckBig className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="lg:w-1/4 flex flex-col justify-center items-center text-center">
                          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4 w-full">
                            <div className="text-slate-400 text-xs mb-1">Importo dell'offerta</div>
                            <div className="text-white text-2xl leading-tight [overflow-wrap:anywhere]">
                              {offer.amount}
                            </div>
                          </div>
                          {offer.promoCode && (
                            <div className="bg-slate-800 rounded px-4 py-2 mb-3 w-full">
                              <div className="text-slate-400 text-xs mb-1">Codice promo</div>
                              <div className="text-white font-mono">{offer.promoCode}</div>
                            </div>
                          )}
                          <OperatorCta
                            placement="offer-featured"
                            operator={operator}
                            label="Vai al sito"
                            className="w-full bg-action hover:bg-action-hover text-action-foreground mb-2"
                          />
                          <OfferDisclaimer termsUrl={offer.termsUrl} />
                        </div>
                      </div>
                      <div className="mt-6 border-t border-slate-800 pt-4">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="terms" className="border-slate-800">
                            <AccordionTrigger className="text-slate-300 hover:text-white">
                              Termini e condizioni
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-2 text-slate-400 text-sm">
                                {offer.terms.map((term, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CircleAlert className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                                    <span>{term}</span>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-white text-2xl mb-6">Altre offerte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visible
              .filter((offer) => !offer.featured)
              .map((offer) => {
                const operator = resolveOperator(offer.operatorId);
                return (
                  <Card key={offer.id} className="bg-slate-900 border-slate-700 transition-all">
                    <div className="p-6">
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
                        <div className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1 rounded text-sm">
                          {offer.amount}
                        </div>
                      </div>
                      <h4 className="text-white mb-2">{offer.title}</h4>
                      <p className="text-slate-400 text-sm mb-4">{offer.description}</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-800 rounded p-2">
                          <div className="text-slate-400 text-xs mb-1">Deposito minimo</div>
                          <div className="text-white text-sm">{offer.minDeposit}</div>
                        </div>
                        <div className="bg-slate-800 rounded p-2">
                          <div className="text-slate-400 text-xs mb-1">Requisiti di giocata</div>
                          <div className="text-white text-sm">{offer.wageringRequirement}</div>
                        </div>
                      </div>
                      <OperatorCta
                        placement="offer-list"
                        operator={operator}
                        label="Vai al sito"
                        className="w-full bg-action hover:bg-action-hover text-action-foreground mb-2"
                      />
                      <OfferDisclaimer className="text-center" termsUrl={offer.termsUrl} />
                    </div>
                  </Card>
                );
              })}
            {visible.length === 0 && <p className="text-slate-400">Nessuna offerta in questa categoria.</p>}
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800">
          <div className="p-8">
            <h2 className="text-white text-2xl mb-6">Domande frequenti</h2>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="faq-1" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-white">
                  Cosa sono i requisiti di scommessa?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  I requisiti di scommessa (wagering requirements) indicano quante volte devi scommettere l'importo del
                  bonus prima di poter prelevare le vincite. Ad esempio, un requisito 3x su un bonus di €30 significa
                  che devi piazzare scommesse per un totale di €90.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-white">
                  Posso prelevare immediatamente il bonus?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  No, i bonus non possono essere prelevati immediatamente. Devi soddisfare i requisiti di scommessa
                  specificati nei termini e condizioni. Solo le vincite generate dal bonus possono essere prelevate dopo
                  aver completato i requisiti.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-white">Cosa sono le quote minime?</AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Le quote minime sono un requisito comune per i bonus. Ad esempio, se un bonus richiede quote minime di
                  1.50, le tue scommesse devono essere piazzate su eventi con quota pari o superiore a 1.50 per contare
                  verso il completamento dei requisiti del bonus.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-white">I bonus hanno una scadenza?</AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Sì, tutti i bonus hanno una scadenza. Generalmente varia da 7 a 30 giorni dalla ricezione del bonus. È
                  importante utilizzare il bonus e completare i requisiti entro questo periodo, altrimenti il bonus e le
                  eventuali vincite verranno annullati.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-5" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-white">
                  Posso usare più bonus contemporaneamente?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Generalmente no. La maggior parte dei bookmaker permette di attivare un solo bonus alla volta. Devi
                  completare i requisiti del primo bonus prima di poterne attivare un altro. Alcuni siti potrebbero
                  avere regole diverse, quindi leggi sempre i T&C.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Card>
        <Card className="mt-8 bg-warn/10 border-warn/30">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <CircleAlert className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-warn mb-2">Gioco responsabile</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Il gioco con vincita in denaro è vietato ai minori di {rg.minAge} anni e può causare dipendenza
                  patologica. Stabilisci un limite, non giocare mai più di quanto puoi permetterti di perdere e non
                  inseguire le perdite.
                </p>
                <p className="text-slate-400 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Phone className="w-4 h-4 text-warn" aria-hidden="true" />
                  {rg.helplineName} ({rg.helplineOrg}):
                  <a href={rg.helplineHref} className="text-white underline underline-offset-2">
                    {rg.helplineNumber}
                  </a>
                  · gratuito e anonimo
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
