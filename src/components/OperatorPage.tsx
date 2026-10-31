// /siti-scommesse/<operatore>: factual profile of one authorised operator, modelled on the structure of the big
// review sites (summary box, products, welcome offer, payments, company card, strengths/limits, FAQ) but without
// ratings, rankings or buttons to the operator. Data: src/data/operators.ts, offers.json.
import { useParams } from "react-router";
import {
  BookOpen,
  Check,
  CircleAlert,
  CreditCard,
  Gift,
  IdCard,
  Phone,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Scale,
  Smartphone,
} from "lucide-react";
import { Link } from "../lib/links";
import { usePageMeta } from "../lib/pageMeta";
import { PageHeader, MetaItems } from "./layout/PageHeader";
import { NotFoundPage } from "./NotFoundPage";
import { ComponentTable, OfferPractice } from "./BonusPage";
import { OfferDisclaimer, OperatorLogo } from "./operator/OperatorUi";
import { OffersSidebar } from "./operator/OffersSidebar";
import { isPlaceholder, responsibleGambling as rg, type OperatorData } from "../data/operators";
import { amountFor, formatDate, formatEuro, productLabels, type WelcomeOffer } from "../data/offers";
import { offerVolume, offerPath } from "../lib/offerPages";
import {
  findOperator,
  offersOfOperator,
  operatorMeta,
  operatorPath,
  operatorSite,
  publishedOperators,
} from "../lib/operatorPages";
import { paths } from "../routes";
import { profileOf, type OperatorProfile } from "../data/operatorProfiles";

const SHOW_DRAFTS = import.meta.env.DEV;
const real = (v: string) => !isPlaceholder(v);
const realList = (l: string[]) => l.filter(real);
const orNot = (v: string) => (real(v) ? v : "Non ancora indicato");

export function OperatorPage() {
  const { operatore } = useParams();
  const op = findOperator(operatore);
  usePageMeta(op ? operatorMeta(op) : null);
  if (!op) return <NotFoundPage />;
  return <OperatorProfile op={op} />;
}

const SECTIONS = [
  { id: "prodotti", title: "Scommesse e prodotti" },
  { id: "offerta", title: "Offerta di benvenuto" },
  { id: "pagamenti", title: "Depositi e prelievi" },
  { id: "app-assistenza", title: "App e assistenza" },
  { id: "limiti", title: "Limiti di puntata e vincita" },
  { id: "carta-identita", title: "Carta d'identità" },
  { id: "pro-contro", title: "Punti di forza e limiti" },
  { id: "domande", title: "Domande frequenti" },
];

function OperatorProfile({ op }: { op: OperatorData }) {
  const offers = offersOfOperator(op.id, SHOW_DRAFTS);
  const sport = offers.find((o) => o.sections.includes("sport"));
  const site = operatorSite(op);
  const payments = realList(op.paymentMethods);
  const pros = realList(op.pros);
  const cons = realList(op.cons);
  const others = publishedOperators()
    .filter((o) => o.id !== op.id)
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
  const profile = profileOf(op.id);
  const faqs = buildFaq(op, sport, profile);

  const summary: [string, string][] = [
    ["Concessione ADM", real(op.admLicense) ? op.admLicense : "Non ancora indicata"],
    ["Società", op.company ?? "Non ancora indicata"],
    ["Prodotti", realList(op.features).join(" · ") || "Non ancora indicati"],
    ["Cash out", op.cashOut ? "Disponibile" : "Non rilevato"],
    ["Streaming", op.liveStreaming ? "Disponibile" : "Non rilevato"],
    ["Deposito minimo", orNot(op.minDeposit)],
    ["Tempi di prelievo", orNot(op.withdrawalTime)],
    ["App", appsText(profile)],
    [
      "Assistenza",
      profile?.support
        ? [profile.support.channels.join(", "), profile.support.hours].filter(Boolean).join(" · ")
        : "Non ancora indicata",
    ],
    ["Vincita massima", profile?.limits?.maxWin ?? "Non ancora indicata"],
    ["Offerta sport", sport ? `Fino a ${formatEuro(amountFor(sport, "sport"))}` : "Nessuna offerta verificata"],
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Shield}
        title={`${op.name}: scheda dell'operatore`}
        subtitle={real(op.description) ? op.description : undefined}
        breadcrumb={[{ label: "Siti scommesse", to: paths.sitiScommesse }, { label: op.name }]}
        meta={
          <MetaItems
            items={[
              real(op.admLicense) ? `Concessione ADM ${op.admLicense}` : "Concessionario ADM",
              "Nessun voto né classifica",
              `Vietato ai minori di ${rg.minAge} anni`,
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:items-start">
        <div className="min-w-0 space-y-12">
          {/* In breve */}
          <section aria-labelledby="in-breve" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center gap-4 mb-5">
              <OperatorLogo operator={op} width={64} height={64} className="rounded-lg bg-slate-800 p-1.5" />
              <div>
                <h2 id="in-breve" className="text-white text-2xl">
                  {op.name} in breve
                </h2>
                {site && (
                  <p className="text-slate-400 text-sm">
                    Sito ufficiale:{" "}
                    <a
                      href={site.href}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="text-slate-300 underline underline-offset-2"
                    >
                      {site.host}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {summary.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2 border-b border-slate-800">
                  <dt className="text-slate-400 text-sm shrink-0">{k}</dt>
                  <dd className="text-white text-sm text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <nav aria-label="In questa pagina" className="mt-5">
              <p className="text-slate-400 text-xs mb-2">In questa pagina</p>
              <ul className="flex flex-wrap gap-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="inline-block px-3 py-1 rounded-md border border-slate-700 text-slate-300 hover:text-white text-sm"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </section>

          {/* Prodotti */}
          <Section id="prodotti" icon={Trophy} title={`${op.name} scommesse: palinsesto e prodotti`}>
            <ul className="grid gap-2 sm:grid-cols-2 mb-5">
              {realList(op.features).map((f) => (
                <li key={f} className="flex items-start gap-2 text-slate-200">
                  <Check className="w-4 h-4 text-best mt-1 shrink-0" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <h3 className="text-white text-lg mb-2">Live, streaming e cash out</h3>
            <p className="text-slate-300">
              {op.cashOut
                ? `${op.name} offre il cash out, cioè la possibilità di chiudere una giocata prima della fine dell'evento a un importo proposto dall'operatore.`
                : `Sul sito di ${op.name} non abbiamo rilevato la funzione di cash out.`}{" "}
              {op.liveStreaming
                ? "Per alcuni eventi è disponibile lo streaming video."
                : "Lo streaming video degli eventi non risulta tra le funzioni che abbiamo verificato."}{" "}
              Come funzionano e quali rischi comportano:{" "}
              <Link to="/guide/cash-out" className="text-action-text hover:text-action-text-hover">
                cash out
              </Link>{" "}
              e{" "}
              <Link to="/guide/scommesse-in-diretta" className="text-action-text hover:text-action-text-hover">
                scommesse in diretta
              </Link>
              .
            </p>
          </Section>

          {/* Offerta */}
          <Section id="offerta" icon={Gift} title={`Bonus di benvenuto ${op.name}`}>
            {offers.length === 0 ? (
              <p className="text-slate-400">
                Al momento non mostriamo un'offerta di benvenuto verificata per {op.name}. Le offerte degli altri
                operatori sono nella pagina{" "}
                <Link to={paths.bonus} className="text-action-text hover:text-action-text-hover">
                  offerte di benvenuto
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-8">
                {offers.map((o) => (
                  <OfferBlock key={o.id} offer={o} />
                ))}
              </div>
            )}
          </Section>

          {/* Pagamenti */}
          <Section id="pagamenti" icon={CreditCard} title={`Metodi di deposito e prelievo su ${op.name}`}>
            <dl className="grid gap-3 sm:grid-cols-2 mb-5">
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
                <dt className="text-slate-400 text-sm mb-1">Deposito minimo</dt>
                <dd className="text-white">{orNot(op.minDeposit)}</dd>
              </div>
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
                <dt className="text-slate-400 text-sm mb-1">Tempi di prelievo</dt>
                <dd className="text-white">{orNot(op.withdrawalTime)}</dd>
              </div>
            </dl>
            {payments.length ? (
              <>
                <h3 className="text-white text-lg mb-2">Metodi accettati</h3>
                <ul className="flex flex-wrap gap-2">
                  {payments.map((m) => (
                    <li key={m} className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 text-sm">
                      {m}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-slate-400">
                I metodi di pagamento non sono ancora stati verificati sul sito dell'operatore.
              </p>
            )}
            <p className="text-slate-400 text-sm mt-4">
              Limiti, commissioni e tempi possono cambiare: fanno fede le pagine di aiuto dell'operatore. Guida:{" "}
              <Link to="/guide/depositi-e-prelievi" className="text-action-text hover:text-action-text-hover">
                depositi e prelievi
              </Link>
              .
            </p>
          </Section>

          {/* App e assistenza */}
          <Section id="app-assistenza" icon={Smartphone} title={`App e servizio clienti di ${op.name}`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-white text-lg mb-3">App</h3>
                {profile?.apps && (profile.apps.ios || profile.apps.android) ? (
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>
                      <span className="text-slate-400">iPhone e iPad: </span>
                      {profile.apps.ios ? (
                        <a
                          href={profile.apps.ios}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="text-white underline underline-offset-2"
                        >
                          disponibile
                        </a>
                      ) : (
                        "non verificata"
                      )}
                    </li>
                    <li>
                      <span className="text-slate-400">Android: </span>
                      {profile.apps.android === "apk"
                        ? "disponibile, si scarica dal sito dell'operatore (file APK)"
                        : profile.apps.android
                          ? "disponibile"
                          : "non verificata"}
                    </li>
                  </ul>
                ) : (
                  <p className="text-slate-400 text-sm">Non ancora verificata.</p>
                )}
                <p className="text-slate-500 text-xs mt-3">
                  Scarica le app solo dallo store ufficiale o dal sito dell'operatore.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-white text-lg mb-3">Servizio clienti</h3>
                {profile?.support ? (
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-slate-400">Canali</dt>
                      <dd className="text-white">{profile.support.channels.join(", ")}</dd>
                    </div>
                    {profile.support.hours && (
                      <div>
                        <dt className="text-slate-400">Orari</dt>
                        <dd className="text-white">{profile.support.hours}</dd>
                      </div>
                    )}
                    {profile.support.phone && (
                      <div>
                        <dt className="text-slate-400">Telefono</dt>
                        <dd className="text-white">{profile.support.phone}</dd>
                      </div>
                    )}
                    {profile.support.email && (
                      <div>
                        <dt className="text-slate-400">Email</dt>
                        <dd className="text-white break-all">{profile.support.email}</dd>
                      </div>
                    )}
                    {profile.support.note && <p className="text-slate-400 text-xs pt-1">{profile.support.note}</p>}
                  </dl>
                ) : (
                  <p className="text-slate-400 text-sm">Non ancora verificato.</p>
                )}
              </div>
            </div>
          </Section>

          {/* Limiti */}
          <Section id="limiti" icon={Scale} title="Limiti di puntata e vincita">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
                <dt className="text-slate-400 text-sm mb-1">Puntata minima</dt>
                <dd className="text-white">{profile?.limits?.minStake ?? "Non ancora indicata"}</dd>
              </div>
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
                <dt className="text-slate-400 text-sm mb-1">Vincita massima</dt>
                <dd className="text-white">{profile?.limits?.maxWin ?? "Non ancora indicata"}</dd>
              </div>
            </dl>
            <p className="text-slate-400 text-sm mt-3">
              Valori dai regolamenti dell'operatore: alcuni mercati o eventi possono avere limiti diversi.
            </p>
          </Section>

          {/* Carta d'identità */}
          <Section id="carta-identita" icon={IdCard} title={`La carta d'identità di ${op.name}`}>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <tbody className="text-slate-200">
                  {(
                    [
                      ["Società", op.company ?? "Non ancora indicata"],
                      ["Concessione", real(op.admLicense) ? `ADM ${op.admLicense}` : "Non ancora indicata"],
                      ["Sito", site?.host ?? "Non ancora indicato"],
                      ["Prodotti", realList(op.features).join(", ") || "Non ancora indicati"],
                      [
                        "Assistenza",
                        profile?.support?.phone ?? profile?.support?.email ?? "Vedi sezione App e assistenza",
                      ],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <tr key={k} className="border-b border-slate-800 last:border-0">
                      <th scope="row" className="p-3 text-left font-normal text-slate-400 w-40 align-top">
                        {k}
                      </th>
                      <td className="p-3">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-white text-lg mt-6 mb-2">Sicurezza e tutela del giocatore</h3>
            <p className="text-slate-300">
              Come ogni concessionario dell'{rg.regulatorName}, {op.name} deve verificare l'identità e la maggiore età
              dei clienti e permettere di impostare limiti di deposito e di chiedere l'autoesclusione. Il numero di
              concessione si può controllare sull'elenco ufficiale pubblicato su{" "}
              <a
                href={rg.regulatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-action-text hover:text-action-text-hover"
              >
                adm.gov.it
              </a>
              . Come attivare i limiti:{" "}
              <Link
                to="/guide/autoesclusione-e-limiti-di-gioco"
                className="text-action-text hover:text-action-text-hover"
              >
                autoesclusione e limiti di gioco
              </Link>
              .
            </p>
          </Section>

          {/* Pro e contro */}
          <Section id="pro-contro" icon={ThumbsUp} title="Punti di forza e limiti">
            {pros.length || cons.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                  <h3 className="flex items-center gap-2 text-white mb-3">
                    <ThumbsUp className="w-4 h-4 text-best" aria-hidden="true" />
                    Punti di forza
                  </h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    {pros.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                    {!pros.length && <li className="text-slate-400">Non ancora indicati</li>}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                  <h3 className="flex items-center gap-2 text-white mb-3">
                    <ThumbsDown className="w-4 h-4 text-warn" aria-hidden="true" />
                    Limiti
                  </h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    {cons.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                    {!cons.length && <li className="text-slate-400">Non ancora indicati</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Non ancora indicati.</p>
            )}
            <p className="text-slate-500 text-xs mt-3">
              Elementi fattuali rilevati dal sito dell'operatore, senza voti: non assegniamo punteggi né classifiche.
            </p>
          </Section>

          {/* FAQ */}
          <Section id="domande" icon={BookOpen} title={`Domande frequenti su ${op.name}`}>
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
          </Section>

          {profile && (
            <section aria-labelledby="fonti" className="text-sm">
              <h2 id="fonti" className="text-white text-lg mb-2">
                Fonti
              </h2>
              <p className="text-slate-400 mb-2">
                Dati letti sul sito di {op.name} il {formatDate(profile.checkedAt)}. In caso di differenze valgono le
                pagine dell'operatore.
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {profile.sources.map((src) => (
                  <li key={src.url}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="text-slate-300 underline underline-offset-2 hover:text-white"
                    >
                      {src.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Altri operatori */}
          <section aria-labelledby="altri-operatori">
            <h2 id="altri-operatori" className="text-white text-xl mb-3">
              Gli altri operatori
            </h2>
            <ul className="flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    to={operatorPath(o)}
                    className="inline-block px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-sm"
                  >
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <aside aria-label="Gioco responsabile" className="rounded-lg border border-warn/30 bg-warn/10 p-5 flex gap-3">
            <CircleAlert className="w-6 h-6 text-warn shrink-0" aria-hidden="true" />
            <p className="text-slate-300 text-sm leading-relaxed">
              Il gioco è vietato ai minori di {rg.minAge} anni e può causare dipendenza. Se hai bisogno di aiuto:{" "}
              <Phone className="inline w-4 h-4 text-warn" aria-hidden="true" /> {rg.helplineName} ({rg.helplineOrg}),{" "}
              <a href={rg.helplineHref} className="text-white underline underline-offset-2">
                {rg.helplineNumber}
              </a>
              , gratuito e anonimo.
            </p>
          </aside>
        </div>
        <div className="mt-10 lg:mt-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-xl">
          <OffersSidebar currentOperatorId={op.id} />
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="scroll-mt-24">
      <h2 id={`h-${id}`} className="flex items-center gap-2 text-white text-2xl mb-4">
        <Icon className="w-6 h-6 text-slate-300 shrink-0" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function OfferBlock({ offer }: { offer: WelcomeOffer }) {
  const products = [...new Set(offer.components.map((c) => c.product))];
  return (
    <div>
      <h3 className="text-white text-lg mb-1">
        {offer.title}
        <span className="text-slate-400 text-sm font-normal">
          {" "}
          · {offer.sections.map((s) => productLabels[s].toLowerCase()).join(" e ")}
        </span>
      </h3>
      <p className="text-slate-300 text-sm mb-3">{offer.description}</p>
      <ComponentTable components={offer.components} showProduct={products.length > 1} />
      <OfferPractice components={offer.components} />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {offer.status === "approvata" && (
          <Link
            to={offerPath(offer)}
            className="text-sm text-action-text hover:text-action-text-hover underline underline-offset-2"
          >
            Condizioni spiegate
          </Link>
        )}
        <span className="text-slate-500 text-xs">Condizioni verificate il {formatDate(offer.verifiedAt)}</span>
        <OfferDisclaimer
          termsUrl={offer.termsUrl}
          operator={offer.operatorId}
          offer={offer.id}
          placement="operator-page"
        />
      </div>
    </div>
  );
}

function appsText(p?: OperatorProfile) {
  if (!p?.apps) return "Non ancora indicata";
  const list = [p.apps.ios && "iOS", p.apps.android && "Android"].filter(Boolean);
  return list.length ? list.join(" e ") : "Non ancora indicata";
}

function buildFaq(op: OperatorData, sport?: WelcomeOffer, profile?: OperatorProfile) {
  const out: { q: string; a: string }[] = [];
  out.push({
    q: `${op.name} è legale in Italia?`,
    a: real(op.admLicense)
      ? `Sì: ${op.name} opera con la concessione ADM ${op.admLicense}${op.company ? `, intestata a ${op.company}` : ""}. Il numero si può verificare sull'elenco ufficiale dell'Agenzia delle Dogane e dei Monopoli.`
      : `${op.name} compare tra i concessionari ADM; il numero di concessione è in corso di verifica.`,
  });
  if (real(op.minDeposit))
    out.push({
      q: `Qual è il deposito minimo su ${op.name}?`,
      a: `${op.minDeposit}, secondo le pagine di aiuto dell'operatore.`,
    });
  if (real(op.withdrawalTime))
    out.push({
      q: `Quanto tempo serve per prelevare da ${op.name}?`,
      a: `${op.withdrawalTime}. I tempi dipendono dal metodo scelto e dalla verifica del conto.`,
    });
  if (profile?.support)
    out.push({
      q: `Come si contatta l'assistenza di ${op.name}?`,
      a:
        `Canali: ${profile.support.channels.join(", ").toLowerCase()}` +
        (profile.support.phone ? `; telefono ${profile.support.phone}` : "") +
        (profile.support.email ? `; email ${profile.support.email}` : "") +
        (profile.support.hours ? ` (${profile.support.hours})` : "") +
        "." +
        (profile.support.note ? ` ${profile.support.note}` : ""),
    });
  if (profile?.limits?.maxWin)
    out.push({
      q: `Qual è la vincita massima su ${op.name}?`,
      a: `${profile.limits.maxWin}, secondo il regolamento dell'operatore.`,
    });
  out.push({
    q: `${op.name} ha il cash out?`,
    a: op.cashOut
      ? "Sì, su una parte delle giocate e degli eventi."
      : "Non lo abbiamo rilevato tra le funzioni del sito.",
  });
  if (sport) {
    const vol = offerVolume(sport);
    out.push({
      q: `Come funziona il bonus di benvenuto ${op.name}?`,
      a:
        `L'offerta "${sport.title}" vale fino a ${formatEuro(amountFor(sport, "sport"))} sulle scommesse sportive` +
        (vol !== null ? `; per sbloccare tutte le sue parti servono in totale ${formatEuro(vol)} di giocate` : "") +
        ". Il dettaglio è nella pagina delle condizioni spiegate.",
    });
  }
  return out;
}
