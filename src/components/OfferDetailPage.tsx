// /bonus/<offer id>: one welcome offer explained in plain numbers. Informational page: no outbound call to action,
// only the link to the operator's official terms. Data: src/data/offers.json; arithmetic: src/lib/bonusCost.ts.
import { useParams } from "react-router";
import { BookOpen, Calculator, CircleAlert, FileText, Gift, Phone } from "lucide-react";
import { Link } from "../lib/links";
import { usePageMeta } from "../lib/pageMeta";
import { PageHeader, MetaItems } from "./layout/PageHeader";
import { Card } from "./ui/card";
import { NotFoundPage } from "./NotFoundPage";
import { ComponentTable, Fact, OfferPractice } from "./BonusPage";
import { OfferDisclaimer, OperatorLogo } from "./operator/OperatorUi";
import { OffersSidebar } from "./operator/OffersSidebar";
import { getOperator, isPlaceholder, responsibleGambling as rg } from "../data/operators";
import { formatDate, formatEuro, productLabels, type OfferProduct, type WelcomeOffer } from "../data/offers";
import { BONUS_COST_GUIDE, CASINO_RTP, SPORT_MARGIN_PER_EVENT, componentMath } from "../lib/bonusCost";
import { findOffer, offerMeta, offerVolume, operatorNameFor } from "../lib/offerPages";
import { paths } from "../routes";

const SHOW_DRAFTS = import.meta.env.DEV;

export function OfferDetailPage() {
  const { offerta } = useParams();
  const offer = findOffer(offerta, SHOW_DRAFTS);
  usePageMeta(offer ? offerMeta(offer) : null);
  if (!offer) return <NotFoundPage />;
  return <OfferDetail offer={offer} />;
}

function OfferDetail({ offer }: { offer: WelcomeOffer }) {
  const name = operatorNameFor(offer);
  const operator = getOperator(offer.operatorId);
  const op = { ...operator, name, logoAlt: `Logo ${name}` };
  const products = [...new Set(offer.components.map((c) => c.product))] as OfferProduct[];
  const volume = offerVolume(offer);
  const costs = offer.components.map(componentMath);
  const anyCostAboveCap = costs.some((m) => m.expectedCost !== null && m.expectedCost >= m.cap);
  const faqs = buildFaq(offer, name, volume);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Gift}
        title={`Offerta di benvenuto ${name}: condizioni spiegate`}
        subtitle={`${offer.title}. Cosa comprende, quanto bisogna giocare per sbloccarla e quanto costa in media farlo, calcolato dai termini pubblicati dall'operatore.`}
        breadcrumb={[{ label: "Offerte", to: paths.bonus }, { label: name }]}
        meta={
          <MetaItems
            items={[
              `Verificata il ${formatDate(offer.verifiedAt)}`,
              !isPlaceholder(operator.admLicense) ? `Concessione ADM ${operator.admLicense}` : "Concessionario ADM",
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:items-start">
        <div className="min-w-0">
          <div className="space-y-10">
            <section aria-labelledby="sintesi">
              <div className="flex items-start gap-4 mb-4">
                <OperatorLogo operator={op} width={56} height={56} className="rounded-lg" />
                <div>
                  <h2 id="sintesi" className="text-white text-2xl mb-1">
                    In sintesi
                  </h2>
                  <p className="text-slate-300">{offer.description}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Fact
                  label="Deposito minimo"
                  value={offer.minDeposit !== null ? formatEuro(offer.minDeposit) : "Non indicato"}
                />
                <Fact
                  label="Deposito entro"
                  value={offer.depositWithinDays !== null ? `${offer.depositWithinDays} giorni` : "Non indicato"}
                />
                <Fact
                  label="Giocate richieste in totale"
                  value={volume !== null ? formatEuro(volume) : "Nessun requisito"}
                />
                <Fact label="Valida fino al" value={offer.validUntil ? formatDate(offer.validUntil) : "Non indicato"} />
              </dl>
              {anyCostAboveCap && (
                <p className="mt-4 rounded-lg border border-warn/30 bg-warn/10 p-4 text-sm text-slate-200">
                  Per almeno una parte dell'offerta, in media, completare il requisito costa più di quanto si può
                  ottenere. I dettagli sono qui sotto.
                </p>
              )}
            </section>

            <section aria-labelledby="composizione">
              <h2 id="composizione" className="text-white text-2xl mb-2">
                Cosa comprende
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                {products.length > 1
                  ? `L'offerta riunisce bonus per prodotti diversi (${products.map((p) => productLabels[p].toLowerCase()).join(", ")}): ciascuno ha importo e requisiti propri.`
                  : `L'offerta vale per ${productLabels[products[0]].toLowerCase()}.`}
              </p>
              <ComponentTable components={offer.components} showProduct={products.length > 1} />
            </section>

            <section aria-labelledby="in-pratica">
              <h2 id="in-pratica" className="flex items-center gap-2 text-white text-2xl mb-2">
                <Calculator className="w-6 h-6 text-slate-300" aria-hidden="true" />
                Quanto bisogna giocare e quanto costa
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Ipotesi dichiarate: margine del {Math.round(SPORT_MARGIN_PER_EVENT * 100)}% per evento sulle scommesse
                sportive, ritorno teorico del {Math.round(CASINO_RTP * 100)}% per le slot. Ogni gioco e ogni mercato
                hanno valori propri: con ipotesi diverse i costi cambiano in proporzione.{" "}
                <Link to={BONUS_COST_GUIDE} className="text-action-text hover:text-action-text-hover">
                  Come si calcola
                </Link>
                .
              </p>
              {products.map((p) => (
                <div key={p} className="mb-4">
                  {products.length > 1 && <h3 className="text-white text-lg mb-1">{productLabels[p]}</h3>}
                  <OfferPractice components={offer.components.filter((c) => c.product === p)} className="mt-2" />
                </div>
              ))}
            </section>

            <section aria-labelledby="condizioni">
              <h2 id="condizioni" className="text-white text-2xl mb-4">
                Requisiti ed esclusioni
              </h2>
              <ul className="space-y-2 text-slate-300 text-sm">
                {offer.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{r}</span>
                  </li>
                ))}
                {offer.excludedPaymentMethods.length > 0 && (
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Metodi di deposito esclusi: {offer.excludedPaymentMethods.join(", ")}</span>
                  </li>
                )}
              </ul>
              <OfferDisclaimer
                className="mt-4"
                termsUrl={offer.termsUrl}
                operator={offer.operatorId}
                offer={offer.id}
                placement="offer-page"
              />
              <p className="mt-2 text-slate-500 text-xs">
                In caso di differenze valgono i termini pubblicati sul sito dell'operatore.
              </p>
            </section>

            <section aria-labelledby="rinunciare">
              <h2 id="rinunciare" className="text-white text-2xl mb-4">
                Quando ha senso rinunciare
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li>Se per completare il requisito dovresti giocare più del budget che ti eri dato.</li>
                <li>Se la scadenza ti costringerebbe a giocare ogni giorno o più in fretta del solito.</li>
                <li>Se la parte che ti interessa è piccola e il resto vale solo su giochi che non usi.</li>
                <li>
                  Se il bonus attivo blocca i prelievi: in genere si può rinunciare dall'area personale, perdendo il
                  bonus e le vincite collegate.
                </li>
              </ul>
            </section>

            <section aria-labelledby="domande">
              <h2 id="domande" className="text-white text-2xl mb-4">
                Domande frequenti
              </h2>
              <div className="space-y-3">
                {faqs.map((f) => (
                  <details key={f.q} className="rounded-lg border border-slate-800 bg-slate-900">
                    <summary className="cursor-pointer p-4 text-white">
                      <span data-faq="q">{f.q}</span>
                    </summary>
                    <p data-faq="a" className="px-4 pb-4 text-slate-300 leading-relaxed">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <nav aria-label="Approfondimenti" className="flex flex-wrap gap-3 text-sm">
              <Link
                to={paths.bonus}
                className="px-4 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              >
                Tutte le offerte a confronto
              </Link>
              <Link
                to={BONUS_COST_GUIDE}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Quanto costa davvero un bonus
              </Link>
              <Link
                to="/guide/bonus-requisiti-di-giocata"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Come leggere i requisiti di giocata
              </Link>
            </nav>

            <Card className="bg-warn/10 border-warn/30">
              <div className="p-6 flex items-start gap-3">
                <CircleAlert className="w-6 h-6 text-slate-300 shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h2 className="text-warn mb-2">Gioco responsabile</h2>
                  <p className="text-slate-300 text-sm mb-3">
                    Il gioco con vincita in denaro è vietato ai minori di {rg.minAge} anni e può causare dipendenza
                    patologica. Un'offerta non è un motivo per giocare: gioca solo somme che puoi permetterti di
                    perdere.
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
            </Card>
          </div>
        </div>
        <div className="mt-10 lg:mt-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-xl">
          <OffersSidebar currentOfferId={offer.id} initial={offer.sections.includes("sport") ? "sport" : "casino"} />
        </div>
      </div>
    </div>
  );
}

function buildFaq(offer: WelcomeOffer, name: string, volume: number | null) {
  const out: { q: string; a: string }[] = [];
  const parts = offer.components
    .map((c) => ({ c, m: componentMath(c) }))
    .filter(({ m }) => m.volume !== null && m.volume > m.cap);
  out.push({
    q: `Quanto bisogna giocare per sbloccare il bonus ${name}?`,
    a:
      volume === null
        ? "Le condizioni rilevate non indicano un requisito di giocata: il bonus va però usato secondo le regole indicate (numero di eventi, quota minima, scadenza)."
        : `In totale ${formatEuro(volume)} di giocate, sommando le parti dell'offerta che hanno un requisito` +
          (parts.length
            ? `: ${parts.map(({ c, m }) => `${formatEuro(m.volume!)} per ${formatEuro(c.maxAmount)} di bonus ${productLabels[c.product].toLowerCase()}`).join("; ")}.`
            : "."),
  });
  out.push({
    q: "Esiste un modo per sbloccarlo senza rischiare?",
    a: "No. Per completare un requisito bisogna giocare, e ogni giocata può essere persa. In media il margine dell'operatore fa perdere una parte di quanto si gioca.",
  });
  out.push({
    q: "Le condizioni possono cambiare?",
    a: `Sì. Le riportiamo come le abbiamo lette il ${formatDate(offer.verifiedAt)}; in caso di differenze valgono i termini pubblicati da ${name}.`,
  });
  return out;
}
