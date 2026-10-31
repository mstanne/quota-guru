import { Calculator, CircleAlert, FileText, Gift, Info, Phone } from "lucide-react";
import { Link } from "../lib/links";
import { BONUS_COST_GUIDE, CASINO_RTP, SPORT_MARGIN_PER_EVENT, componentMath } from "../lib/bonusCost";
import { offerPath } from "../lib/offerPages";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { getOperator, isPlaceholder, responsibleGambling as rg, type OperatorData } from "../data/operators";
import {
  amountFor,
  componentKindLabels,
  formatDate,
  formatEuro,
  offersInSection,
  productLabels,
  productSections,
  visibleOffers,
  type OfferComponent,
  type OfferProduct,
  type WelcomeOffer,
} from "../data/offers";
import { OfferDisclaimer, OperatorCta, OperatorLogo } from "./operator/OperatorUi";
import { OffersSidebar } from "./operator/OffersSidebar";
import { PageHeader, MetaItems } from "./layout/PageHeader";

interface BonusPageProps {
  /** Offers to list. Default: approved offers from src/data/offers.json (plus drafts in `npm run dev`). */
  offers?: WelcomeOffer[];
  resolveOperator?: (id: string) => OperatorData;
}

/** Drafts are previewed only on the local dev server, never in the built site. */
const SHOW_DRAFTS = import.meta.env.DEV;

/**
 * /bonus – informational comparison of welcome-offer conditions, grouped by product.
 * No ranking, no ratings, no "claim" language. The headline total of an offer is broken down into its
 * components, so a "sport" offer that is mostly a slot bonus is shown as such.
 */
export function BonusPage({
  offers = visibleOffers({ includeDrafts: SHOW_DRAFTS }),
  resolveOperator = getOperator,
}: BonusPageProps) {
  const sections = productSections.filter((s) => s.visible);
  const operatorCount = new Set(offers.map((o) => o.operatorId)).size;

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Gift}
        title="Offerte di benvenuto a confronto"
        subtitle="Le condizioni delle offerte per i nuovi iscritti degli operatori autorizzati, divise per prodotto: importi reali di ogni componente, requisiti di giocata, scadenze e termini."
        breadcrumb={[{ label: "Offerte" }]}
        meta={
          <MetaItems items={[`${offers.length} offerte`, `${operatorCount} operatori`, "Solo concessionari ADM"]} />
        }
      />
      <div className="container mx-auto px-4 py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:items-start">
        <div className="min-w-0">
          <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h2 className="text-blue-400 text-lg mb-2">Come leggere le condizioni</h2>
                  <p className="text-slate-300 text-sm mb-3">
                    Il totale che un operatore indica per un'offerta è spesso la somma di più bonus su prodotti diversi.
                    Per ogni offerta mostriamo quanto vale ciascuna parte, dove si può usare, quante volte va giocata
                    prima di poter prelevare e entro quanti giorni.
                  </p>
                  <p className="text-slate-300 text-sm mb-3">
                    Per ogni parte calcoliamo anche quanto bisogna giocare in totale e quanto costano in media quelle
                    giocate, con due ipotesi dichiarate: un margine del {Math.round(SPORT_MARGIN_PER_EVENT * 100)}% per
                    evento sulle scommesse sportive e un ritorno teorico del {Math.round(CASINO_RTP * 100)}% per le
                    slot. Il calcolo è spiegato in{" "}
                    <Link to={BONUS_COST_GUIDE} className="text-white underline underline-offset-2">
                      quanto costa davvero un bonus
                    </Link>
                    .
                  </p>
                  <p className="text-slate-400 text-sm">
                    I dati sono ricavati dai termini pubblicati dagli operatori e riportano la data dell'ultima
                    verifica. In caso di differenze valgono i termini sul sito dell'operatore. Un'offerta non è un
                    motivo per giocare: gioca solo somme che puoi permetterti di perdere.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {sections.length > 1 && (
            <nav aria-label="Sezioni" className="flex flex-wrap gap-3 mb-10">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  data-track="filter_use"
                  data-track-filter="bonus-section"
                  data-track-value={s.id}
                  className="px-4 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-500 text-sm"
                >
                  {s.label}
                  <span className="ml-2 text-slate-500">{offersInSection(offers, s.id).length}</span>
                </a>
              ))}
            </nav>
          )}

          {sections.map((section) => {
            const list = offersInSection(offers, section.id);
            return (
              <section
                key={section.id}
                id={section.id}
                className="mb-14 scroll-mt-24"
                aria-labelledby={`h-${section.id}`}
              >
                <h2 id={`h-${section.id}`} className="text-white text-2xl mb-2">
                  {section.label}
                </h2>
                <p className="text-slate-400 text-sm mb-6">{section.intro}</p>
                {list.length === 0 ? (
                  <p className="text-slate-400 text-sm border border-dashed border-slate-700 rounded-lg p-6">
                    Nessuna offerta verificata da mostrare in questo momento.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {list.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        section={section.id}
                        operator={resolveOperator(offer.operatorId)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          <Card className="bg-slate-900 border-slate-800">
            <div className="p-8">
              <h2 className="text-white text-2xl mb-6">Domande frequenti</h2>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="faq-1" className="border-slate-800">
                  <AccordionTrigger className="text-white hover:text-white">
                    <span data-faq="q">Cosa sono i requisiti di giocata?</span>
                  </AccordionTrigger>
                  <AccordionContent data-faq="a" className="text-slate-400">
                    Indicano quante volte va giocato l'importo del bonus prima che diventi prelevabile. Un requisito di
                    5 volte su un bonus di 100 € significa giocate per 500 €; un requisito di 40 volte su 1.000 €
                    significa giocate per 40.000 €, spesso da completare in pochi giorni.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2" className="border-slate-800">
                  <AccordionTrigger className="text-white hover:text-white">
                    <span data-faq="q">Perché un'offerta sport contiene un bonus slot?</span>
                  </AccordionTrigger>
                  <AccordionContent data-faq="a" className="text-slate-400">
                    Molti operatori uniscono nella stessa offerta di benvenuto bonus per prodotti diversi e ne indicano
                    la somma. Per questo mostriamo separatamente la parte utilizzabile sulle scommesse sportive e le
                    parti che valgono solo su altri giochi.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3" className="border-slate-800">
                  <AccordionTrigger className="text-white hover:text-white">
                    <span data-faq="q">Cosa sono le quote minime?</span>
                  </AccordionTrigger>
                  <AccordionContent data-faq="a" className="text-slate-400">
                    Molti bonus sport valgono solo su scommesse multiple con un numero minimo di eventi, ciascuno con
                    una quota pari o superiore a un valore minimo (ad esempio 5 eventi a quota 1,70).
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4" className="border-slate-800">
                  <AccordionTrigger className="text-white hover:text-white">
                    <span data-faq="q">Posso usare più offerte insieme?</span>
                  </AccordionTrigger>
                  <AccordionContent data-faq="a" className="text-slate-400">
                    In genere no: l'offerta di benvenuto si sceglie una sola volta in fase di registrazione e vale una
                    sola volta per persona e nucleo familiare.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </Card>
          <Card className="mt-8 bg-warn/10 border-warn/30">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <CircleAlert className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" aria-hidden="true" />
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
        <div className="mt-10 lg:mt-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-xl">
          <OffersSidebar />
        </div>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  section,
  operator,
}: {
  offer: WelcomeOffer;
  section: OfferProduct;
  operator: OperatorData;
}) {
  const name = isPlaceholder(operator.name) ? offer.operatorName : operator.name;
  const op = { ...operator, name, logoAlt: `Logo ${name}` };
  const own = offer.components.filter((c) => c.product === section);
  const other = offer.components.filter((c) => c.product !== section);
  const isDraft = offer.status !== "approvata";

  return (
    <Card
      className={`bg-slate-900 overflow-hidden ${isDraft ? "border-amber-500/60 border-dashed" : "border-slate-700"}`}
    >
      <div className="p-6">
        {isDraft && (
          <div className="mb-4 rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-200">
            <strong>Bozza da approvare</strong> (visibile solo in sviluppo).
            {offer.issues.length > 0 && (
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {offer.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/4">
            <div className="flex items-start gap-4">
              <OperatorLogo operator={op} width={64} height={64} className="rounded-lg" />
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-xl mb-1">{name}</h3>
                {!isPlaceholder(operator.admLicense) && (
                  <p className="text-slate-400 text-xs">Concessione ADM {operator.admLicense}</p>
                )}
              </div>
            </div>
            <div className="mt-4 bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-xs mb-1">Utilizzabile su {productLabels[section].toLowerCase()}</div>
              <div className="text-white text-2xl leading-tight">fino a {formatEuro(amountFor(offer, section))}</div>
              {offer.advertisedTotal !== null && offer.advertisedTotal !== amountFor(offer, section) && (
                <div className="text-slate-400 text-xs mt-2">
                  Totale indicato dall'operatore: {formatEuro(offer.advertisedTotal)}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-3/4 lg:border-l border-slate-800 lg:pl-6">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 mb-2">
              {offer.title}
            </Badge>
            <p className="text-slate-300 text-sm mb-4">{offer.description}</p>

            <ComponentTable components={own} />

            {other.length > 0 && (
              <div className="mt-4">
                <h4 className="text-slate-300 text-sm mb-2">Nella stessa offerta, su altri prodotti</h4>
                <ComponentTable components={other} showProduct />
              </div>
            )}

            <OfferPractice components={own} />

            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-sm">
              <Fact
                label="Deposito minimo"
                value={offer.minDeposit !== null ? formatEuro(offer.minDeposit) : "Non indicato"}
              />
              <Fact
                label="Deposito entro"
                value={
                  offer.depositWithinDays !== null
                    ? `${offer.depositWithinDays} giorni dalla registrazione`
                    : "Non indicato"
                }
              />
              <Fact
                label="Offerta valida fino al"
                value={offer.validUntil ? formatDate(offer.validUntil) : "Non indicato"}
              />
              <Fact label="Condizioni verificate il" value={formatDate(offer.verifiedAt)} />
            </dl>

            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="terms" className="border-slate-800">
                <AccordionTrigger className="text-slate-300 hover:text-white">Requisiti ed esclusioni</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    {offer.requirements.map((r, i) => (
                      <li key={`r${i}`} className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{r}</span>
                      </li>
                    ))}
                    {offer.excludedPaymentMethods.length > 0 && (
                      <li className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Metodi di deposito esclusi: {offer.excludedPaymentMethods.join(", ")}</span>
                      </li>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
              <OperatorCta
                placement={`offer-${section}`}
                operator={op}
                label="Vai al sito"
                className="bg-action hover:bg-action-hover text-action-foreground"
              />
              {!isDraft && (
                <Link
                  to={offerPath(offer)}
                  className="text-sm text-action-text hover:text-action-text-hover underline underline-offset-2"
                >
                  Condizioni spiegate
                </Link>
              )}
              <OfferDisclaimer
                termsUrl={offer.termsUrl}
                operator={offer.operatorId}
                offer={offer.id}
                placement={`bonus-${section}`}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded p-2">
      <dt className="text-slate-400 text-xs mb-1">{label}</dt>
      <dd className="text-white">{value}</dd>
    </div>
  );
}

const times = (n: number | null) => (n === null ? "—" : n === 1 ? "1 volta" : `${n} volte`);

function volumeText(c: OfferComponent) {
  const v = componentMath(c).volume;
  return v === null ? "—" : formatEuro(v);
}

/** "In pratica": what the conditions mean in euro, from src/lib/bonusCost.ts. Exported for the offer page. */
export function OfferPractice({
  components,
  className = "mt-4",
}: {
  components: OfferComponent[];
  className?: string;
}) {
  const lines = components.flatMap((c) => componentMath(c).lines);
  if (!lines.length) return null;
  return (
    <div className={`${className} rounded-lg border border-slate-800 bg-slate-950/40 p-4`}>
      <h4 className="flex items-center gap-2 text-white text-sm mb-2">
        <Calculator className="w-4 h-4 text-slate-300" aria-hidden="true" />
        In pratica
      </h4>
      <ul className="space-y-1.5 text-sm text-slate-300">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-slate-500 text-xs">
        Medie calcolate su molte giocate: il risultato del singolo può essere migliore o peggiore.{" "}
        <Link to={BONUS_COST_GUIDE} className="underline underline-offset-2 hover:text-slate-300">
          Come calcoliamo
        </Link>
      </p>
    </div>
  );
}

function conditions(c: OfferComponent) {
  const parts = [c.usableOn];
  if (c.minOddsPerEvent !== null)
    parts.push(`quota minima ${c.minOddsPerEvent.toFixed(2).replace(".", ",")} per evento`);
  return parts.join(" · ");
}

function deadline(c: OfferComponent) {
  const d = c.wageringDays ?? c.validityDays;
  return d === null ? "—" : `${d} giorni`;
}

export function ComponentTable({
  components,
  showProduct = false,
}: {
  components: OfferComponent[];
  showProduct?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-800/60 text-slate-400 text-xs text-left">
          <tr>
            {showProduct && <th className="p-2 font-normal">Prodotto</th>}
            <th className="p-2 font-normal">Tipo</th>
            <th className="p-2 font-normal">Importo massimo</th>
            <th className="p-2 font-normal">Requisito</th>
            <th className="p-2 font-normal">Giocate richieste</th>
            <th className="p-2 font-normal">Entro</th>
            <th className="p-2 font-normal">Dove si usa</th>
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {components.map((c) => (
            <tr key={c.id} className="border-t border-slate-800 align-top">
              {showProduct && <td className="p-2">{productLabels[c.product]}</td>}
              <td className="p-2">
                {componentKindLabels[c.kind]}
                {c.percent !== null && <span className="text-slate-400"> ({c.percent}%)</span>}
              </td>
              <td className="p-2 whitespace-nowrap">
                {formatEuro(c.maxAmount)}
                {c.maxConvertible !== null && c.maxConvertible < c.maxAmount && (
                  <div className="text-slate-400 text-xs">convertibili max {formatEuro(c.maxConvertible)}</div>
                )}
              </td>
              <td className="p-2 whitespace-nowrap">{times(c.wagering)}</td>
              <td className="p-2 whitespace-nowrap">{volumeText(c)}</td>
              <td className="p-2 whitespace-nowrap">{deadline(c)}</td>
              <td className="p-2">
                {conditions(c)}
                {c.notes.length > 0 && (
                  <ul className="text-slate-400 text-xs mt-1 space-y-0.5">
                    {c.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
