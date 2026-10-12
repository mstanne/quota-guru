import { CircleAlert, CircleCheckBig, Funnel, Gift, Info, Star } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const bonuses = [
  {
    id: "1",
    bookmaker: "Bet365",
    logo: "\u{1F3AF}",
    title: "Bonus di Benvenuto",
    offerType: "Deposito",
    bonusAmount: "\u20AC100",
    description: "Fino a \u20AC100 in Crediti Scommessa per i nuovi clienti",
    highlights: ["Crediti scommessa fino a \u20AC100", "Quote minime 1.20", "Valido per 30 giorni"],
    termsAndConditions: [
      "Solo per nuovi clienti maggiorenni",
      "Deposito minimo \u20AC5",
      "Le vincite escludono l'importo dei Crediti Scommessa",
      "Si applicano limiti di tempo e termini e condizioni",
    ],

    minDeposit: "\u20AC5",
    wageringRequirement: "1x",
    rating: 4.8,
    isFeatured: true,
    promoCode: "GURU100",
  },
  {
    id: "2",
    bookmaker: "Betway",
    logo: "\u26A1",
    title: "Bonus Primo Deposito",
    offerType: "Match Bonus",
    bonusAmount: "\u20AC50",
    description: "100% fino a \u20AC50 sul primo deposito",
    highlights: ["Match del 100% sul deposito", "Bonus fino a \u20AC50", "Processo semplice e veloce"],
    termsAndConditions: [
      "Nuovi clienti maggiorenni",
      "Deposito minimo \u20AC10",
      "Requisiti di scommessa 3x",
      "Quote minime 1.75",
    ],

    minDeposit: "\u20AC10",
    wageringRequirement: "3x",
    rating: 4.6,
    isFeatured: true,
  },
  {
    id: "3",
    bookmaker: "888sport",
    logo: "\u{1F3C6}",
    title: "Offerta Nuovi Clienti",
    offerType: "Free Bet",
    bonusAmount: "\u20AC30",
    description: "Scommetti \u20AC10 e ricevi \u20AC30 in Free Bet",
    highlights: ["Free Bet del valore di \u20AC30", "Prima scommessa \u20AC10", "Bonus automatico"],
    termsAndConditions: [
      "Solo nuovi clienti",
      "Prima scommessa minimo \u20AC10",
      "Quote minime 1.50",
      "Free Bet valide 7 giorni",
    ],

    minDeposit: "\u20AC10",
    wageringRequirement: "1x",
    rating: 4.5,
    isFeatured: true,
  },
  {
    id: "4",
    bookmaker: "William Hill",
    logo: "\u{1F3B2}",
    title: "Bonus di Benvenuto Sport",
    offerType: "Match Bonus",
    bonusAmount: "\u20AC40",
    description: "Match del 100% fino a \u20AC40 + \u20AC10 Casino",
    highlights: ["Bonus Sport \u20AC40", "Bonus Casino \u20AC10", "Doppio bonus"],
    termsAndConditions: ["Nuovi clienti UK e Irlanda", "Deposito minimo \u20AC10", "Quote minime 1.40", "Rollover 3x"],
    minDeposit: "\u20AC10",
    wageringRequirement: "3x",
    rating: 4.4,
  },
  {
    id: "5",
    bookmaker: "Unibet",
    logo: "\u{1F48E}",
    title: "Bonus Scommessa Sicura",
    offerType: "Risk Free",
    bonusAmount: "\u20AC20",
    description: "Prima scommessa senza rischio fino a \u20AC20",
    highlights: ["Rimborso fino a \u20AC20", "Prima scommessa protetta", "Nessun codice richiesto"],
    termsAndConditions: [
      "Solo per nuovi clienti",
      "Scommessa minima \u20AC5",
      "Rimborso come free bet",
      "Valido per 7 giorni",
    ],

    minDeposit: "\u20AC5",
    wageringRequirement: "1x",
    rating: 4.7,
  },
  {
    id: "6",
    bookmaker: "Ladbrokes",
    logo: "\u{1F3AA}",
    title: "Offerta Speciale Sport",
    offerType: "Free Bet",
    bonusAmount: "\u20AC25",
    description: "Scommetti \u20AC5 e ricevi \u20AC25 in Free Bet",
    highlights: ["\u20AC25 in Free Bet", "Scommessa minima \u20AC5", "Quote competitive"],
    termsAndConditions: [
      "Nuovi clienti maggiorenni",
      "Prima scommessa \u20AC5",
      "Quote minime 1.50",
      "Free Bet valide 4 giorni",
    ],

    minDeposit: "\u20AC5",
    wageringRequirement: "1x",
    rating: 4.3,
  },
];

const bonusCategories = [
  {
    id: "all",
    name: "Tutti i Bonus",
    count: bonuses.length,
  },
  {
    id: "welcome",
    name: "Bonus Benvenuto",
    count: 4,
  },
  {
    id: "no-deposit",
    name: "Senza Deposito",
    count: 0,
  },
  {
    id: "free-bet",
    name: "Free Bet",
    count: 3,
  },
  {
    id: "cashback",
    name: "Cashback",
    count: 0,
  },
];

export function BonusPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="w-10 h-10 text-orange-500" />
              <h1 className="text-white text-4xl md:text-5xl">Bonus Scommesse</h1>
            </div>
            <p className="text-slate-400 text-lg mb-6">
              Scopri i migliori bonus e promozioni dei bookmaker online. Confronta le offerte e scegli quella più
              vantaggiosa per te.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="bg-slate-800 rounded-lg px-6 py-3">
                <div className="text-green-500 text-2xl">€370+</div>
                <div className="text-slate-400 text-sm">Bonus Totali Disponibili</div>
              </div>
              <div className="bg-slate-800 rounded-lg px-6 py-3">
                <div className="text-green-500 text-2xl">6</div>
                <div className="text-slate-400 text-sm">Bookmaker Verificati</div>
              </div>
              <div className="bg-slate-800 rounded-lg px-6 py-3">
                <div className="text-green-500 text-2xl">100%</div>
                <div className="text-slate-400 text-sm">Sicuri e Regolamentati</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-400 mb-2">Come Funzionano i Bonus?</h3>
                <p className="text-slate-300 text-sm mb-3">
                  I bonus scommesse sono offerte promozionali dei bookmaker per attrarre nuovi clienti. Possono
                  includere crediti gratuiti, scommesse senza rischio, o match bonus sul deposito.
                </p>
                <p className="text-slate-400 text-sm">
                  Leggi sempre i Termini e Condizioni prima di attivare un bonus. Verifica requisiti di scommessa, quote
                  minime e scadenze.
                </p>
              </div>
            </div>
          </div>
        </Card>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Funnel className="w-5 h-5 text-slate-400" />
            <h2 className="text-white text-xl">Filtra per Categoria</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {bonusCategories.map((category) => (
              <Button
                key={category.id}
                variant={category.id === "all" ? "default" : "outline"}
                className={
                  category.id === "all"
                    ? "bg-green-500 hover:bg-green-600 text-slate-950"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                }
              >
                {category.name}
                {category.count > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-slate-800 text-slate-300">
                    {category.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-white text-2xl mb-6">Bonus in Evidenza</h2>
          <div className="grid grid-cols-1 gap-6">
            {bonuses
              .filter((bonus) => bonus.isFeatured)
              .map((bonus, index) => (
                <Card
                  key={bonus.id}
                  className="bg-slate-900 border-slate-700 hover:border-orange-500 transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="lg:w-1/4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                            {bonus.logo}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white text-xl mb-1">{bonus.bookmaker}</h3>
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              <span className="text-slate-300">{bonus.rating}</span>
                            </div>
                            <Badge className="bg-orange-500 text-white text-xs">
                              #{index + 1}
                              {" Consigliato"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="lg:w-1/2 lg:border-l lg:border-r border-slate-800 lg:px-6">
                        <div className="mb-4">
                          <Badge variant="secondary" className="bg-slate-800 text-slate-300 mb-2">
                            {bonus.offerType}
                          </Badge>
                          <h4 className="text-white text-lg mb-2">{bonus.title}</h4>
                          <p className="text-slate-400 text-sm mb-4">{bonus.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Deposito Minimo</div>
                            <div className="text-white">{bonus.minDeposit}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Requisiti</div>
                            <div className="text-white">{bonus.wageringRequirement}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-2">Punti Salienti:</div>
                          <ul className="space-y-1">
                            {bonus.highlights.map((highlight, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                <CircleCheckBig className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="lg:w-1/4 flex flex-col justify-center items-center text-center">
                        <div className="bg-orange-500 rounded-lg p-4 mb-4 w-full">
                          <div className="text-white text-xs mb-1">Bonus Disponibile</div>
                          <div className="text-white text-4xl">{bonus.bonusAmount}</div>
                        </div>
                        {bonus.promoCode && (
                          <div className="bg-slate-800 rounded px-4 py-2 mb-3 w-full">
                            <div className="text-slate-400 text-xs mb-1">Codice Promo</div>
                            <div className="text-green-500 font-mono">{bonus.promoCode}</div>
                          </div>
                        )}
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-slate-950 mb-2">
                          Ottieni Bonus
                        </Button>
                        <p className="text-slate-500 text-xs">T&C Apply • 18+</p>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-slate-800 pt-4">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="terms" className="border-slate-800">
                          <AccordionTrigger className="text-slate-300 hover:text-white">
                            Termini e Condizioni
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2 text-slate-400 text-sm">
                              {bonus.termsAndConditions.map((term, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CircleAlert className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
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
              ))}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-white text-2xl mb-6">Altri Bonus Disponibili</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bonuses
              .filter((bonus) => !bonus.isFeatured)
              .map((bonus) => (
                <Card key={bonus.id} className="bg-slate-900 border-slate-700 hover:border-green-500 transition-all">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl">
                          {bonus.logo}
                        </div>
                        <div>
                          <h3 className="text-white">{bonus.bookmaker}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-slate-400 text-sm">{bonus.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm">{bonus.bonusAmount}</div>
                    </div>
                    <h4 className="text-white mb-2">{bonus.title}</h4>
                    <p className="text-slate-400 text-sm mb-4">{bonus.description}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-800 rounded p-2">
                        <div className="text-slate-400 text-xs mb-1">Min. Deposito</div>
                        <div className="text-white text-sm">{bonus.minDeposit}</div>
                      </div>
                      <div className="bg-slate-800 rounded p-2">
                        <div className="text-slate-400 text-xs mb-1">Requisiti</div>
                        <div className="text-white text-sm">{bonus.wageringRequirement}</div>
                      </div>
                    </div>
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-slate-950 mb-2">
                      Richiedi Bonus
                    </Button>
                    <p className="text-slate-500 text-xs text-center">T&C Apply • 18+</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800">
          <div className="p-8">
            <h2 className="text-white text-2xl mb-6">Domande Frequenti</h2>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="faq-1" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-green-500">
                  Cosa sono i requisiti di scommessa?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  I requisiti di scommessa (wagering requirements) indicano quante volte devi scommettere l'importo del
                  bonus prima di poter prelevare le vincite. Ad esempio, un requisito 3x su un bonus di €30 significa
                  che devi piazzare scommesse per un totale di €90.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-green-500">
                  Posso prelevare immediatamente il bonus?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  No, i bonus non possono essere prelevati immediatamente. Devi soddisfare i requisiti di scommessa
                  specificati nei termini e condizioni. Solo le vincite generate dal bonus possono essere prelevate dopo
                  aver completato i requisiti.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-green-500">
                  Cosa sono le quote minime?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Le quote minime sono un requisito comune per i bonus. Ad esempio, se un bonus richiede quote minime di
                  1.50, le tue scommesse devono essere piazzate su eventi con quota pari o superiore a 1.50 per contare
                  verso il completamento dei requisiti del bonus.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-green-500">
                  I bonus hanno una scadenza?
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  Sì, tutti i bonus hanno una scadenza. Generalmente varia da 7 a 30 giorni dalla ricezione del bonus. È
                  importante utilizzare il bonus e completare i requisiti entro questo periodo, altrimenti il bonus e le
                  eventuali vincite verranno annullati.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-5" className="border-slate-800">
                <AccordionTrigger className="text-white hover:text-green-500">
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
        <Card className="mt-8 bg-orange-500/10 border-orange-500/20">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <CircleAlert className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-orange-400 mb-2">Gioco Responsabile</h3>
                <p className="text-slate-300 text-sm mb-3">
                  I bonus scommesse sono un ottimo modo per provare nuovi bookmaker, ma ricorda sempre di giocare in
                  modo responsabile. Non scommettere mai più di quanto puoi permetterti di perdere e non inseguire le
                  perdite.
                </p>
                <p className="text-slate-400 text-sm">
                  Se ritieni di avere un problema con il gioco, contatta BeGambleAware.org o chiama il numero verde 800
                  558 822. Gioco vietato ai minori di 18 anni.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
