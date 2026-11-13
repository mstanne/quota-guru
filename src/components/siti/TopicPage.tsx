// /siti-scommesse/<tema> and /siti-scommesse/<metodo>: thematic comparison pages modelled on the big comparison
// sites (comparison table, operators in detail, what to know, FAQ, other comparisons) but with the site's rules:
// operators in alphabetical order, no ratings, no ranking, no buttons to the operators, only verified data.
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import {
  ArrowLeftRight,
  BookOpen,
  CircleAlert,
  Coins,
  IdCard,
  Info,
  ListOrdered,
  Phone,
  Scale,
  ShieldCheck,
  Table2,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { Link } from "../../lib/links";
import { usePageMeta } from "../../lib/pageMeta";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { OperatorLogo } from "../operator/OperatorUi";
import { OffersSidebar } from "../operator/OffersSidebar";
import { NotFoundPage } from "../NotFoundPage";
import { isPlaceholder, responsibleGambling as rg, type OperatorData } from "../../data/operators";
import { formatEuro, offerTotals } from "../../data/offers";
import { operatorPath, publishedOperators } from "../../lib/operatorPages";
import {
  bonusStatus,
  cardsWithoutCircuit,
  fastestWithdrawal,
  findTopic,
  hasMethodTable,
  lowDeposit,
  methodMeta,
  methodOperators,
  methodHighlights,
  methodPath,
  methodRows,
  offerAmount,
  paymentMethods,
  speedLabels,
  sportOffer,
  topicMeta,
  topicOperators,
  topics,
  type PaymentMethodInfo,
  type Speed,
  type Topic,
  type TopicId,
} from "../../lib/topicPages";
import { admPaymentRules, methodGuides, type Source } from "../../lib/methodGuides";
import { paths } from "../../routes";
import { methodMenu, sitiMenu } from "./topicMenu";

const real = (v: string) => !isPlaceholder(v);
const alphabetical = () => publishedOperators().sort((a, b) => a.name.localeCompare(b.name, "it"));
const others = (list: OperatorData[]) => alphabetical().filter((o) => !list.some((x) => x.id === o.id));
/** "A, B e C" */
export const names = (list: string[]) =>
  list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} e ${list[list.length - 1]}`;
const opNames = (list: OperatorData[]) => names(list.map((o) => o.name));

interface Faq {
  q: string;
  a: string;
}

// ---------- layout ----------

function Section({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; title: string; children: ReactNode }) {
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

const linkCls = "text-action-text hover:text-action-text-hover";

function OperatorName({ op }: { op: OperatorData }) {
  return (
    <Link to={operatorPath(op)} className="flex items-center gap-3 text-white hover:underline underline-offset-4">
      <OperatorLogo operator={op} width={36} height={36} className="rounded-md bg-slate-800 p-1 shrink-0" />
      <span>{op.name}</span>
    </Link>
  );
}

/** Comparison table: on phones each row becomes a card (label above each value). */
function CompareTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: { key: string; op: OperatorData; cells: ReactNode[] }[];
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="hidden md:table-header-group bg-slate-800/60 text-slate-400 text-xs text-left">
          <tr>
            <th scope="col" className="p-3 font-normal">
              Operatore
            </th>
            {columns.map((c) => (
              <th key={c} scope="col" className="p-3 font-normal">
                {c}
              </th>
            ))}
            <th scope="col" className="p-3 font-normal">
              <span className="sr-only">Scheda</span>
            </th>
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {rows.map((r) => (
            <tr
              key={r.key}
              className="block md:table-row border-t border-slate-800 first:border-t-0 md:first:border-t p-4 md:p-0 align-top"
            >
              <th scope="row" className="block md:table-cell md:p-3 text-left font-normal mb-3 md:mb-0">
                <OperatorName op={r.op} />
              </th>
              {r.cells.map((c, i) => (
                <td key={i} className="flex justify-between gap-4 md:table-cell py-1 md:p-3">
                  <span className="md:hidden text-slate-400 text-xs shrink-0">{columns[i]}</span>
                  <span className="text-right md:text-left">{c}</span>
                </td>
              ))}
              <td className="block md:table-cell pt-3 md:p-3 md:text-right whitespace-nowrap">
                <Link to={operatorPath(r.op)} className={`text-sm ${linkCls}`}>
                  Scheda completa →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Muted = ({ children }: { children: ReactNode }) => <span className="text-slate-400">{children}</span>;

function Faqs({ faqs }: { faqs: Faq[] }) {
  return (
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
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-slate-300 leading-relaxed [&_h3]:text-white [&_h3]:text-lg [&_h3]:pt-2">{children}</div>;
}

/** Tiles to the other comparisons and the list of payment methods. */
function OtherComparisons({ current }: { current: string }) {
  return (
    <section aria-labelledby="altri-confronti">
      <h2 id="altri-confronti" className="text-white text-xl mb-3">
        Altri confronti tra siti scommesse
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sitiMenu
          .filter((i) => i.to !== current)
          .map((i) => (
            <li key={i.to}>
              <Link
                to={i.to}
                className="flex h-full flex-col items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-4 text-center text-slate-200 hover:border-slate-600 hover:text-white"
              >
                <i.icon className="w-7 h-7 text-slate-300" aria-hidden="true" />
                <span className="text-sm">{i.label}</span>
              </Link>
            </li>
          ))}
      </ul>
      <p className="text-slate-400 text-sm mt-4 mb-2">Per metodo di pagamento:</p>
      <ul className="flex flex-wrap gap-2">
        {methodMenu
          .filter((m) => m.to !== current)
          .map((m) => (
            <li key={m.to}>
              <Link
                to={m.to}
                className="inline-block px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-sm"
              >
                {m.label}
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}

const SECTIONS = [
  { id: "confronto", title: "Confronto" },
  { id: "dettaglio", title: "In dettaglio" },
  { id: "cosa-sapere", title: "Cosa sapere" },
  { id: "come-verifichiamo", title: "Come verifichiamo" },
  { id: "domande", title: "Domande frequenti" },
];

interface ShellProps {
  path: string;
  heading: string;
  subtitle: string;
  icon: LucideIcon;
  crumbs: { label: string; to?: string }[];
  count: number;
  intro: ReactNode;
  table: ReactNode;
  tableTitle: string;
  detail?: ReactNode;
  detailTitle?: string;
  /** Extra sections after "In dettaglio" (payment method pages). */
  extra?: { id: string; title: string; nav: string; icon: LucideIcon; node: ReactNode }[];
  know: ReactNode;
  knowTitle: string;
  faqs: Faq[];
  faqTitle: string;
  /** Sources of the facts that do not come from the operators. */
  sources?: Source[];
}

function Shell(p: ShellProps) {
  const nav = [
    SECTIONS[0],
    ...(p.detail ? [SECTIONS[1]] : []),
    ...(p.extra ?? []).map((e) => ({ id: e.id, title: e.nav })),
    ...SECTIONS.slice(2),
  ];
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={p.icon}
        title={p.heading}
        subtitle={p.subtitle}
        breadcrumb={[{ label: "Siti scommesse", to: paths.sitiScommesse }, ...p.crumbs]}
        meta={
          <MetaItems
            items={[
              `${p.count} ${p.count === 1 ? "operatore" : "operatori"} su ${publishedOperators().length}`,
              "Solo concessionari ADM",
              "In ordine alfabetico, senza voti",
              `Vietato ai minori di ${rg.minAge} anni`,
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:items-start">
        <div className="min-w-0 space-y-12">
          <div>
            <Prose>{p.intro}</Prose>
            <nav aria-label="In questa pagina" className="mt-5">
              <ul className="flex flex-wrap gap-2">
                {nav.map((s) => (
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
          </div>
          <Section id="confronto" icon={Table2} title={p.tableTitle}>
            {p.table}
          </Section>
          {p.detail && (
            <Section id="dettaglio" icon={Info} title={p.detailTitle ?? "In dettaglio"}>
              {p.detail}
            </Section>
          )}
          {p.extra?.map((e) => (
            <Section key={e.id} id={e.id} icon={e.icon} title={e.title}>
              {e.node}
            </Section>
          ))}
          <Section id="cosa-sapere" icon={BookOpen} title={p.knowTitle}>
            <Prose>{p.know}</Prose>
          </Section>
          <Section id="come-verifichiamo" icon={Scale} title="Come verifichiamo i dati">
            <Prose>
              <p>
                Ogni valore di questa pagina viene dalle pagine ufficiali degli operatori (aiuto, pagamenti,
                registrazione, promozioni), lette e datate nella{" "}
                <Link to={paths.sitiScommesse} className={linkCls}>
                  scheda di ciascun operatore
                </Link>
                . Quando un operatore non pubblica un dato lo indichiamo come "Non indicato" invece di stimarlo; quando
                una funzione non compare sul suo sito scriviamo "non rilevata", perché potrebbe esistere in una parte del
                sito che non abbiamo visto.
              </p>
              <p>
                Gli operatori sono in ordine alfabetico: non diamo voti né classifiche. Limiti, tempi e condizioni
                cambiano spesso: prima di depositare fanno fede le pagine dell'operatore. Come lavoriamo:{" "}
                <Link to={paths.metodologia} className={linkCls}>
                  metodologia
                </Link>{" "}
                e{" "}
                <Link to={paths.affiliazione} className={linkCls}>
                  rapporti con gli operatori
                </Link>
                .
              </p>
              {p.sources && p.sources.length > 0 && (
                <>
                  <p>Le informazioni sul metodo di pagamento (costi, regole, società) vengono da queste fonti:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {p.sources.map((src) => (
                      <li key={src.url}>
                        <a href={src.url} rel="noopener nofollow" target="_blank" className={linkCls}>
                          {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Prose>
          </Section>
          <Section id="domande" icon={BookOpen} title={p.faqTitle}>
            <Faqs faqs={p.faqs} />
          </Section>
          <OtherComparisons current={p.path} />
          <aside aria-label="Gioco responsabile" className="rounded-lg border border-warn/30 bg-warn/10 p-5 flex gap-3">
            <CircleAlert className="w-6 h-6 text-warn shrink-0" aria-hidden="true" />
            <p className="text-slate-300 text-sm leading-relaxed">
              Il gioco è vietato ai minori di {rg.minAge} anni e può causare dipendenza. Puoi fissare limiti di deposito
              su ogni conto di gioco:{" "}
              <Link to="/guide/autoesclusione-e-limiti-di-gioco" className="text-white underline underline-offset-2">
                come si fa
              </Link>
              . Se hai bisogno di aiuto: <Phone className="inline w-4 h-4 text-warn" aria-hidden="true" />{" "}
              {rg.helplineName} ({rg.helplineOrg}),{" "}
              <a href={rg.helplineHref} className="text-white underline underline-offset-2">
                {rg.helplineNumber}
              </a>
              , gratuito e anonimo.
            </p>
          </aside>
        </div>
        <div className="mt-10 lg:mt-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-xl">
          <OffersSidebar />
        </div>
      </div>
    </div>
  );
}

/** One short card per operator in the "In dettaglio" section. */
function DetailList({ items }: { items: { op: OperatorData; text: ReactNode }[] }) {
  return (
    <div className="space-y-4">
      {items.map(({ op, text }) => (
        <div key={op.id} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-2">
            <OperatorName op={op} />
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
          <Link to={operatorPath(op)} className={`inline-block mt-2 text-sm ${linkCls}`}>
            Tutti i dati di {op.name} →
          </Link>
        </div>
      ))}
    </div>
  );
}

function NotListed({ list, what, value }: { list: OperatorData[]; what: string; value: (o: OperatorData) => string }) {
  if (!list.length) return null;
  return (
    <>
      <h3>{what}</h3>
      <ul className="grid gap-x-8 sm:grid-cols-2">
        {list.map((o) => (
          <li key={o.id} className="flex justify-between gap-4 py-2 border-b border-slate-800 text-sm">
            <Link to={operatorPath(o)} className="text-white hover:underline underline-offset-4">
              {o.name}
            </Link>
            <span className="text-slate-400 text-right">{value(o)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

const offerCell = (op: OperatorData) => {
  const offer = sportOffer(op);
  return offer ? (
    <>
      <span className="block text-white text-base">Fino a {formatEuro(offerTotals(offer, "sport").total)}</span>
      {offerTotals(offer, "sport").partLabel && (
        <span className="block text-white">{offerTotals(offer, "sport").partLabel}</span>
      )}
      {offer.minDeposit !== null && (
        <span className="block text-slate-400 text-xs">deposito minimo per l'offerta {formatEuro(offer.minDeposit)}</span>
      )}
    </>
  ) : (
    <Muted>Nessuna offerta sport verificata</Muted>
  );
};

// ---------- pages ----------

export function TopicPage({ topic: id }: { topic: TopicId }) {
  const t = findTopic(id);
  usePageMeta(topicMeta(t));
  switch (id) {
    case "deposito-5":
      return <DepositPage t={t} />;
    case "prelievo":
      return <WithdrawalPage t={t} />;
    case "cash-out":
      return <CashOutPage t={t} />;
    case "streaming":
      return <StreamingPage t={t} />;
    case "spid":
      return <SpidPage t={t} />;
    case "metodi":
      return <MethodsHubPage t={t} />;
  }
}

const iconOf = (path: string) => sitiMenu.find((i) => i.to === path)?.icon ?? Table2;

function DepositPage({ t }: { t: Topic }) {
  const list = topicOperators(t.id);
  const path = `${paths.sitiScommesse}/${t.slug}`;
  const from1 = list.filter((o) => lowDeposit(o)!.min < 5);
  const withBonus5 = list.filter((o) => {
    const off = sportOffer(o);
    return off?.minDeposit != null && off.minDeposit <= 5;
  });
  const bonusMore = list.filter((o) => {
    const off = sportOffer(o);
    return off?.minDeposit != null && off.minDeposit > 5;
  });
  const shops = alphabetical().filter((o) => real(o.minDeposit) && /punti vendita/i.test(o.minDeposit));
  return (
    <Shell
      path={path}
      heading={t.heading}
      subtitle="Gli operatori ADM che accettano ricariche online da 5 € o meno, con il metodo che lo permette"
      icon={iconOf(path)}
      crumbs={[{ label: t.label }]}
      count={list.length}
      intro={
        <p>
          Il deposito minimo è la ricarica più bassa che il conto di gioco accetta. Su {list.length} dei{" "}
          {publishedOperators().length} operatori che confrontiamo si può versare online 5 € o meno:{" "}
          {opNames(list)}. Spesso il minimo basso vale solo per alcuni metodi, mentre con carte e PayPal ne servono 10,
          e le offerte di benvenuto chiedono quasi sempre un primo deposito più alto.
        </p>
      }
      tableTitle="I siti scommesse con deposito minimo di 5 € a confronto"
      table={
        <CompareTable
          caption="Siti scommesse con deposito minimo di 5 euro"
          columns={["Da 5 € o meno con", "Deposito minimo indicato", "Offerta di benvenuto sport"]}
          rows={list.map((op) => ({
            key: op.id,
            op,
            cells: [lowDeposit(op)!.methods.join(", "), op.minDeposit, offerCell(op)],
          }))}
        />
      }
      detailTitle="Gli operatori con ricarica minima di 5 € in dettaglio"
      detail={
        <DetailList
          items={list.map((op) => {
            const low = lowDeposit(op)!;
            const off = sportOffer(op);
            return {
              op,
              text: (
                <>
                  {hasMethodTable(op)
                    ? `Secondo la tabella dei pagamenti di ${op.name}, si versa 5 € o meno con ${names(low.methods)}. Con gli altri metodi il minimo è più alto: ${op.minDeposit}.`
                    : `${op.name} indica un deposito minimo di ${op.minDeposit}.`}{" "}
                  {off
                    ? off.minDeposit !== null
                      ? `Per l'offerta di benvenuto sport (${offerAmount(off)!.toLowerCase()}) il primo deposito deve essere di almeno ${formatEuro(off.minDeposit)}.`
                      : `L'offerta di benvenuto sport vale ${offerAmount(off)!.toLowerCase()}.`
                    : "Al momento non mostriamo un'offerta di benvenuto sport verificata."}
                </>
              ),
            };
          })}
        />
      }
      knowTitle="Deposito minimo di 5 €: cosa sapere"
      know={
        <>
          <h3>Il minimo dipende dal metodo</h3>
          <p>
            Gli operatori fissano un minimo diverso per ogni metodo di pagamento. I portafogli elettronici come Skrill e
            Neteller, per esempio, possono avere soglie più alte delle carte, e alcuni metodi accettano solo depositi.
            Limiti e tempi di ogni metodo sono nella pagina{" "}
            <Link to={`${paths.sitiScommesse}/metodi-di-pagamento`} className={linkCls}>
              metodi di pagamento
            </Link>
            .
          </p>
          <h3>Il bonus chiede quasi sempre di più</h3>
          <p>
            {bonusMore.length
              ? `Per attivare l'offerta di benvenuto sport, ${opNames(bonusMore)} chiedono un primo deposito più alto di 5 €. `
              : ""}
            {withBonus5.length
              ? `Con ${opNames(withBonus5)} l'offerta si attiva anche con un primo deposito da 5 €. `
              : "Nessuna offerta sport che mostriamo si attiva con un primo deposito da 5 €. "}
            Prima di ricaricare controlla anche quali metodi sono esclusi dall'offerta: come leggere le condizioni nella
            guida ai{" "}
            <Link to="/guide/bonus-requisiti-di-giocata" className={linkCls}>
              requisiti di giocata
            </Link>
            .
          </p>
          {shops.length > 0 && (
            <>
              <h3>Ricariche in contanti nei punti vendita</h3>
              <p>
                {opNames(shops)} accettano ricariche più basse nei punti vendita ({shops
                  .map((o) => `${o.name}: ${o.minDeposit}`)
                  .join("; ")}). Online, però, il minimo resta quello indicato.
              </p>
            </>
          )}
          <h3>Un deposito basso aiuta a controllare la spesa</h3>
          <p>
            Un versamento piccolo serve a provare il sito, i tempi di prelievo e l'assistenza senza impegnare molto
            denaro. Su ogni conto si può impostare un limite di deposito settimanale o mensile: è il modo più semplice
            per tenere sotto controllo quanto si gioca.
          </p>
          <NotListed
            list={others(list)}
            what="Operatori con deposito minimo più alto"
            value={(o) => (real(o.minDeposit) ? o.minDeposit : "Non indicato")}
          />
        </>
      }
      faqTitle="Domande frequenti sul deposito minimo di 5 €"
      faqs={[
        {
          q: "Quali siti scommesse accettano un deposito minimo di 5 euro?",
          a: `Tra gli operatori ADM che confrontiamo: ${opNames(list)}. Il minimo può valere solo per alcuni metodi di pagamento: il dettaglio è nella tabella.`,
        },
        ...(from1.length
          ? [
              {
                q: "Si può depositare anche meno di 5 euro?",
                a: `Sì, con alcuni metodi: ${from1
                  .map((o) => `${o.name} (${lowDeposit(o)!.methods[0]})`)
                  .join(", ")}.${shops.length ? ` Nei punti vendita di ${opNames(shops)} si ricarica anche da 1 €.` : ""}`,
              },
            ]
          : []),
        {
          q: "Con un deposito di 5 euro si ottiene il bonus di benvenuto?",
          a: withBonus5.length
            ? `Sì con ${opNames(withBonus5)}. ${bonusMore.length ? `${opNames(bonusMore)} chiedono un primo deposito più alto.` : ""}`.trim()
            : `Nelle offerte sport che mostriamo il primo deposito minimo è più alto di 5 €.`,
        },
        {
          q: "Il deposito minimo è lo stesso con tutti i metodi di pagamento?",
          a: "No: ogni operatore fissa limiti diversi per carte, portafogli elettronici, bonifico e voucher. Per questo nella tabella indichiamo il metodo con cui si può versare 5 € o meno.",
        },
        {
          q: "Ci sono commissioni sui depositi da 5 euro?",
          a: "Gli operatori che confrontiamo non applicano spese sui depositi online secondo le loro pagine di aiuto; possono esserci costi del circuito o della banca, come le spese postali sui bollettini.",
        },
      ]}
    />
  );
}

const speedOrder: Speed[] = ["immediato", "24h", "oltre"];
const speedCls: Record<Speed, string> = {
  immediato: "bg-best/15 text-best border-best/30",
  "24h": "bg-slate-800 text-white border-slate-600",
  oltre: "bg-slate-900 text-slate-400 border-slate-700",
};

function WithdrawalPage({ t }: { t: Topic }) {
  const path = `${paths.sitiScommesse}/${t.slug}`;
  const list = topicOperators(t.id);
  const all = alphabetical()
    .map((op) => ({ op, f: fastestWithdrawal(op) }))
    .sort(
      (a, b) =>
        speedOrder.indexOf(a.f?.speed ?? "oltre") - speedOrder.indexOf(b.f?.speed ?? "oltre") ||
        a.op.name.localeCompare(b.op.name, "it"),
    );
  const immediate = all.filter((x) => x.f?.speed === "immediato").map((x) => x.op);
  const day = all.filter((x) => x.f?.speed === "24h").map((x) => x.op);
  const slow = all.filter((x) => !x.f || x.f.speed === "oltre").map((x) => x.op);
  return (
    <Shell
      path={path}
      heading={t.heading}
      subtitle="Il metodo di prelievo più veloce di ogni operatore ADM, con i tempi dichiarati nelle sue pagine di aiuto"
      icon={iconOf(path)}
      crumbs={[{ label: t.label }]}
      count={list.length}
      intro={
        <p>
          Il tempo di prelievo dipende soprattutto dal metodo: portafogli elettronici e bonifico istantaneo sono di solito
          i più rapidi, carte e bonifico ordinario i più lenti. {immediate.length} operatori indicano almeno un metodo con
          prelievo immediato ({opNames(immediate)}){day.length ? `, altri ${day.length} entro 24 ore (${opNames(day)})` : ""}
          . In tabella tutti gli operatori, raggruppati per tempo dichiarato e in ordine alfabetico in ogni gruppo.
        </p>
      }
      tableTitle="Tempi di prelievo a confronto"
      table={
        <CompareTable
          caption="Tempi di prelievo dei siti scommesse"
          columns={["Prelievo più veloce", "Con", "Tempo dichiarato"]}
          rows={all.map(({ op, f }) => ({
            key: op.id,
            op,
            cells: f
              ? [
                  <span className={`inline-block px-2 py-0.5 rounded-md border text-xs ${speedCls[f.speed]}`}>
                    {speedLabels[f.speed]}
                  </span>,
                  f.methods.length ? f.methods.join(", ") : <Muted>Tutti i metodi</Muted>,
                  f.time,
                ]
              : [<Muted>Non indicato</Muted>, <Muted>—</Muted>, real(op.withdrawalTime) ? op.withdrawalTime : <Muted>Non indicato</Muted>],
          }))}
        />
      }
      detailTitle="Prelievi veloci operatore per operatore"
      detail={
        <DetailList
          items={list.map((op) => {
            const f = fastestWithdrawal(op)!;
            return {
              op,
              text: `${f.speed === "immediato" ? "Prelievo indicato come immediato" : "Prelievo indicato entro la giornata"}${
                f.methods.length ? ` con ${names(f.methods)}` : ""
              } (${f.time.toLowerCase()}). Tempi complessivi dichiarati: ${real(op.withdrawalTime) ? op.withdrawalTime : "non indicati"}.`,
            };
          })}
        />
      }
      knowTitle="Prelievo immediato: cosa sapere"
      know={
        <>
          <h3>"Immediato" non vuol dire sempre in pochi secondi</h3>
          <p>
            Quando un operatore scrive "immediato" o "generalmente immediato" intende che approva e invia subito la
            richiesta. Il tempo in cui il denaro compare sul conto dipende poi dal circuito: un portafoglio elettronico o
            un bonifico istantaneo arrivano in pochi minuti, una carta può richiedere giorni.
          </p>
          <h3>Cosa allunga i tempi</h3>
          <p>
            Il primo prelievo arriva solo dopo la verifica del conto (documento d'identità e, a volte, prova del metodo di
            pagamento). Molti operatori pagano sullo stesso metodo usato per depositare, e i tempi espressi in giorni
            lavorativi non contano sabato, domenica e festivi. Le vincite ottenute con un bonus si possono prelevare solo
            dopo aver completato i requisiti di giocata.
          </p>
          <h3>Commissioni</h3>
          <p>
            Gli operatori di questa pagina non applicano spese sui prelievi online secondo le loro pagine di aiuto, salvo
            casi indicati nella scheda (per esempio il ritiro in contanti con bonifico domiciliato). Guida completa:{" "}
            <Link to="/guide/depositi-e-prelievi" className={linkCls}>
              depositi e prelievi
            </Link>
            .
          </p>
          <NotListed
            list={slow}
            what="Operatori con prelievi oltre le 24 ore"
            value={(o) => fastestWithdrawal(o)?.time ?? (real(o.withdrawalTime) ? o.withdrawalTime : "Non indicato")}
          />
        </>
      }
      faqTitle="Domande frequenti sui prelievi"
      faqs={[
        {
          q: "Quali siti scommesse hanno il prelievo immediato?",
          a: immediate.length
            ? `Secondo le pagine di aiuto degli operatori: ${immediate
                .map((o) => `${o.name} (${names(fastestWithdrawal(o)!.methods)})`)
                .join(", ")}.`
            : "Nessun operatore che confrontiamo indica un prelievo immediato.",
        },
        {
          q: "Qual è il metodo di prelievo più veloce?",
          a: "Di solito i portafogli elettronici (PayPal, Skrill, Neteller) e il bonifico istantaneo. Le carte e il bonifico ordinario richiedono in genere da uno a più giorni lavorativi.",
        },
        {
          q: "Perché il primo prelievo è più lento?",
          a: "Prima del primo pagamento l'operatore deve verificare l'identità del titolare del conto, come richiesto dalle regole ADM e antiriciclaggio. Inviare subito il documento accorcia i tempi.",
        },
        {
          q: "Si può prelevare con un metodo diverso da quello del deposito?",
          a: "Dipende dall'operatore: molti pagano sullo stesso metodo usato per depositare, e chi ha depositato con metodi solo di ricarica (come Paysafecard) preleva di solito con bonifico.",
        },
      ]}
    />
  );
}

function CashOutPage({ t }: { t: Topic }) {
  const path = `${paths.sitiScommesse}/${t.slug}`;
  const list = topicOperators(t.id);
  return (
    <Shell
      path={path}
      heading={t.heading}
      subtitle="Gli operatori ADM che permettono di chiudere una giocata prima della fine dell'evento"
      icon={iconOf(path)}
      crumbs={[{ label: t.label }]}
      count={list.length}
      intro={
        <p>
          Il cash out permette di chiudere una scommessa prima che gli eventi siano finiti, incassando l'importo che
          l'operatore propone in quel momento. Lo abbiamo rilevato su {list.length} dei {publishedOperators().length}{" "}
          operatori che confrontiamo: {opNames(list)}.
        </p>
      }
      tableTitle="I siti scommesse con cash out a confronto"
      table={
        <CompareTable
          caption="Siti scommesse con cash out"
          columns={["Cash out", "Streaming", "Offerta di benvenuto sport"]}
          rows={list.map((op) => ({
            key: op.id,
            op,
            cells: ["Disponibile", op.liveStreaming ? "Disponibile" : <Muted>Non rilevato</Muted>, offerCell(op)],
          }))}
        />
      }
      detailTitle="Il cash out operatore per operatore"
      detail={
        <DetailList
          items={list.map((op) => ({
            op,
            text: `${op.name} offre il cash out su una parte delle giocate e degli eventi${
              op.liveStreaming ? "; per alcuni eventi c'è anche lo streaming video" : ""
            }. Prodotti: ${op.features.filter(real).join(", ").toLowerCase() || "non ancora indicati"}.`,
          }))}
        />
      }
      knowTitle="Cash out: cosa sapere"
      know={
        <>
          <h3>Come funziona</h3>
          <p>
            Durante l'evento, o prima che inizi, l'operatore mostra un importo per cui è disposto a chiudere la giocata.
            Accettandolo la scommessa termina subito: il risultato finale non conta più. Alcuni operatori permettono anche
            il cash out parziale (si chiude solo una parte della puntata) o automatico (si fissa una soglia). Non tutte le
            giocate lo prevedono: di solito è escluso da alcuni mercati, dalle scommesse fatte con un bonus e dai sistemi.
          </p>
          <h3>Ha un costo</h3>
          <p>
            L'importo proposto include il margine dell'operatore, quindi è in media più basso del valore che la giocata ha
            in quel momento. Usato spesso, il cash out riduce le vincite nel lungo periodo: conviene sapere prima in quali
            casi usarlo. Lo spieghiamo con esempi nella guida al{" "}
            <Link to="/guide/cash-out" className={linkCls}>
              cash out
            </Link>
            .
          </p>
          <NotListed list={others(list)} what="Operatori senza cash out rilevato" value={() => "Non rilevato"} />
        </>
      }
      faqTitle="Domande frequenti sul cash out"
      faqs={[
        { q: "Quali siti scommesse hanno il cash out?", a: `Tra gli operatori ADM che confrontiamo: ${opNames(list)}.` },
        {
          q: "Il cash out conviene?",
          a: "Non in media: l'importo proposto contiene il margine dell'operatore. Può avere senso per limitare una perdita o bloccare un guadagno quando le condizioni dell'evento sono cambiate, ma non come abitudine.",
        },
        {
          q: "Si può fare cash out su una multipla?",
          a: "Di solito sì, finché tutti gli eventi rimasti sono aperti al cash out. Se anche un solo evento della multipla non lo prevede, l'opzione non compare.",
        },
        {
          q: "Il cash out vale con il bonus di benvenuto?",
          a: "In genere le giocate fatte con un bonus, o che servono a sbloccarlo, escludono il cash out o non lo contano per i requisiti. Fanno fede le condizioni dell'offerta.",
        },
      ]}
    />
  );
}

function StreamingPage({ t }: { t: Topic }) {
  const path = `${paths.sitiScommesse}/${t.slug}`;
  const list = topicOperators(t.id);
  return (
    <Shell
      path={path}
      heading={t.heading}
      subtitle="Gli operatori ADM che trasmettono in streaming alcuni eventi su cui si scommette dal vivo"
      icon={iconOf(path)}
      crumbs={[{ label: t.label }]}
      count={list.length}
      intro={
        <p>
          Tutti gli operatori ADM permettono di scommettere sugli eventi in corso. Solo alcuni li trasmettono anche in
          video sul proprio sito o nell'app: lo streaming risulta su {list.length} dei {publishedOperators().length}{" "}
          operatori che confrontiamo ({opNames(list)}). Gli eventi trasmessi dipendono dai diritti di ciascuno: spesso
          tennis, basket e campionati di calcio esteri, raramente la Serie A.
        </p>
      }
      tableTitle="I siti scommesse con streaming a confronto"
      table={
        <CompareTable
          caption="Siti scommesse con streaming"
          columns={["Streaming", "Cash out", "Offerta di benvenuto sport"]}
          rows={list.map((op) => ({
            key: op.id,
            op,
            cells: ["Disponibile", op.cashOut ? "Disponibile" : <Muted>Non rilevato</Muted>, offerCell(op)],
          }))}
        />
      }
      detailTitle="Lo streaming operatore per operatore"
      detail={
        <DetailList
          items={list.map((op) => ({
            op,
            text: `${op.name} trasmette in streaming una parte degli eventi in palinsesto${
              op.cashOut ? " e offre il cash out sulle giocate live" : ""
            }. Prodotti: ${op.features.filter(real).join(", ").toLowerCase() || "non ancora indicati"}.`,
          }))}
        />
      }
      knowTitle="Scommesse live e streaming: cosa sapere"
      know={
        <>
          <h3>Le condizioni per vedere gli eventi</h3>
          <p>
            Di solito lo streaming è riservato a chi ha un conto attivo e verificato; alcuni operatori chiedono anche un
            saldo positivo o una giocata sull'evento. Il video arriva con qualche secondo di ritardo rispetto alla realtà:
            le quote live si muovono prima di quello che vedi.
          </p>
          <h3>Il ritmo delle scommesse live</h3>
          <p>
            Dal vivo le quote cambiano in continuazione e le decisioni si prendono in pochi secondi, condizioni in cui è
            più facile puntare più del previsto. Come leggere le quote in diretta e quali errori evitare: guida alle{" "}
            <Link to="/guide/scommesse-in-diretta" className={linkCls}>
              scommesse in diretta
            </Link>
            .
          </p>
          <h3>Dove vedere le partite in TV</h3>
          <p>
            Per le partite di calcio trasmesse in Italia, canali e piattaforme di ogni incontro sono nella pagina{" "}
            <Link to="/calcio-in-tv-oggi" className={linkCls}>
              calcio in TV oggi
            </Link>
            .
          </p>
          <NotListed list={others(list)} what="Operatori senza streaming rilevato" value={() => "Non rilevato"} />
        </>
      }
      faqTitle="Domande frequenti sullo streaming"
      faqs={[
        { q: "Quali siti scommesse hanno lo streaming delle partite?", a: `Tra gli operatori ADM che confrontiamo: ${opNames(list)}.` },
        {
          q: "Lo streaming dei siti scommesse è gratis?",
          a: "Non si paga un abbonamento, ma di solito serve un conto attivo e verificato e talvolta un saldo positivo o una giocata sull'evento.",
        },
        {
          q: "Si può vedere la Serie A sui siti di scommesse?",
          a: "Raramente: i diritti della Serie A sono delle emittenti televisive. Lo streaming dei siti di scommesse riguarda soprattutto tennis, basket e campionati esteri.",
        },
        {
          q: "Lo streaming è in diretta?",
          a: "Con qualche secondo di ritardo rispetto all'evento reale, come ogni trasmissione via internet.",
        },
      ]}
    />
  );
}

function SpidPage({ t }: { t: Topic }) {
  const path = `${paths.sitiScommesse}/${t.slug}`;
  const list = topicOperators(t.id);
  const unknown = alphabetical().filter((o) => o.spidRegistration === undefined);
  const no = alphabetical().filter((o) => o.spidRegistration === false);
  return (
    <Shell
      path={path}
      heading={t.heading}
      subtitle="Gli operatori ADM che permettono di aprire il conto di gioco con l'identità digitale"
      icon={iconOf(path)}
      crumbs={[{ label: t.label }]}
      count={list.length}
      intro={
        <p>
          Con SPID il modulo di registrazione si compila con i dati dell'identità digitale e non serve caricare un
          documento per la verifica. Abbiamo controllato le pagine di registrazione degli operatori: l'opzione SPID c'è
          su {opNames(list)}.
        </p>
      }
      tableTitle="I siti scommesse con SPID a confronto"
      table={
        <CompareTable
          caption="Siti scommesse con registrazione SPID"
          columns={["Registrazione SPID", "Deposito minimo", "Offerta di benvenuto sport"]}
          rows={list.map((op) => ({
            key: op.id,
            op,
            cells: ["Disponibile", real(op.minDeposit) ? op.minDeposit : <Muted>Non indicato</Muted>, offerCell(op)],
          }))}
        />
      }
      detailTitle="La registrazione con SPID operatore per operatore"
      detail={
        <DetailList
          items={list.map((op) => ({
            op,
            text: `Nella pagina di registrazione di ${op.name} c'è l'opzione per aprire il conto con SPID. Deposito minimo: ${
              real(op.minDeposit) ? op.minDeposit : "non indicato"
            }; tempi di prelievo: ${real(op.withdrawalTime) ? op.withdrawalTime.toLowerCase() : "non indicati"}.`,
          }))}
        />
      }
      knowTitle="Registrazione con SPID: cosa sapere"
      know={
        <>
          <h3>Come funziona</h3>
          <p>
            Nel modulo di registrazione si sceglie "Registrati con SPID", si seleziona il proprio gestore (Poste, Aruba,
            InfoCert…) e si autorizza la condivisione dei dati. Nome, codice fiscale, data di nascita e residenza arrivano
            già compilati e verificati, quindi l'operatore non deve chiedere la copia del documento e il conto si può usare
            prima, prelievi compresi.
          </p>
          <h3>SPID e offerte di benvenuto</h3>
          <p>
            Alcuni operatori legano una parte dell'offerta di benvenuto alla registrazione con SPID. Le condizioni di ogni
            offerta sono nella pagina{" "}
            <Link to={paths.bonus} className={linkCls}>
              offerte di benvenuto
            </Link>
            . Come si apre un conto, passo per passo:{" "}
            <Link to="/guide/aprire-un-conto-di-gioco" className={linkCls}>
              aprire un conto di gioco
            </Link>
            .
          </p>
          <NotListed list={no} what="Operatori senza registrazione SPID" value={() => "Non disponibile"} />
          <NotListed list={unknown} what="Operatori non ancora verificati" value={() => "Da verificare"} />
        </>
      }
      faqTitle="Domande frequenti sulla registrazione con SPID"
      faqs={[
        { q: "Quali siti scommesse permettono la registrazione con SPID?", a: `Tra gli operatori ADM che confrontiamo: ${opNames(list)}.` },
        {
          q: "Perché registrarsi con SPID?",
          a: "Perché i dati anagrafici arrivano già verificati dall'identità digitale: non serve caricare il documento e il conto è pronto prima, anche per prelevare.",
        },
        {
          q: "Serve comunque il documento d'identità?",
          a: "Con SPID di norma no, perché la verifica dell'identità avviene attraverso il gestore SPID. L'operatore può comunque chiedere documenti in casi particolari, per esempio per controlli antiriciclaggio.",
        },
        {
          q: "Si può usare la Carta d'Identità Elettronica (CIE)?",
          a: "Alcuni operatori accettano anche la CIE come identità digitale. Non l'abbiamo ancora verificato operatore per operatore: controlla la pagina di registrazione.",
        },
      ]}
    />
  );
}

function MethodsHubPage({ t }: { t: Topic }) {
  const path = `${paths.sitiScommesse}/${t.slug}`;
  const list = topicOperators(t.id);
  const hubMethods = paymentMethods.filter((m) => m.hub);
  return (
    <Shell
      path={path}
      heading={t.heading}
      subtitle="Quali operatori ADM accettano PayPal, Postepay, carte, Apple Pay, Skrill, bonifico e gli altri metodi"
      icon={iconOf(path)}
      crumbs={[{ label: t.label }]}
      count={list.length}
      intro={
        <>
          <p>
            Ogni operatore accetta metodi diversi, con limiti, tempi e condizioni diverse. Qui sotto la mappa completa;
            per ogni metodo c'è una pagina con deposito minimo e massimo, tempi di prelievo, commissioni e validità per le
            offerte di benvenuto.
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 not-prose">
            {paymentMethods.map((m) => (
              <li key={m.id}>
                <Link
                  to={methodPath(m)}
                  className="flex h-full items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white hover:border-slate-600"
                >
                  <span>{m.name}</span>
                  <span className="text-slate-400 text-sm whitespace-nowrap">
                    {methodOperators(m).length ? `${methodOperators(m).length} siti` : "nessun sito"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      }
      tableTitle="I metodi di pagamento operatore per operatore"
      table={
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-sm">
            <caption className="sr-only">Metodi di pagamento accettati dai siti scommesse</caption>
            <thead className="bg-slate-800/60 text-slate-400 text-xs">
              <tr>
                <th scope="col" className="p-3 font-normal text-left sticky left-0 bg-slate-800">
                  Operatore
                </th>
                {hubMethods.map((m) => (
                  <th key={m.id} scope="col" className="p-3 font-normal text-center">
                    <Link to={methodPath(m)} className="hover:text-white">
                      {m.id === "carte" ? "Carte" : m.id === "bonifico" ? "Bonifico" : m.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((op) => (
                <tr key={op.id} className="border-t border-slate-800">
                  <th scope="row" className="p-3 text-left font-normal sticky left-0 bg-slate-900 whitespace-nowrap">
                    <Link to={operatorPath(op)} className="text-white hover:underline underline-offset-4">
                      {op.name}
                    </Link>
                  </th>
                  {hubMethods.map((m) => {
                    const rows = methodRows(op, m);
                    const depositOnly = rows.length > 0 && rows.every((r) => r.withdrawal === null);
                    const withdrawOnly = rows.length > 0 && rows.every((r) => r.deposit === null);
                    return (
                      <td key={m.id} className="p-3 text-center">
                        {rows.length ? (
                          <span className="text-best" title={`${m.name} su ${op.name}`}>
                            ✓
                            {(depositOnly || withdrawOnly) && (
                              <span className="block text-slate-400 text-[11px]">
                                {depositOnly ? "solo depositi" : "solo prelievi"}
                              </span>
                            )}
                            <span className="sr-only"> accettato</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            —<span className="sr-only">non accettato</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
      detailTitle="I metodi uno per uno"
      detail={
        <div className="space-y-4">
          {paymentMethods.map((m) => {
            const ops = methodOperators(m);
            return (
              <div key={m.id} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-white text-lg mb-2">
                  <Link to={methodPath(m)} className="hover:underline underline-offset-4">
                    {m.name}
                  </Link>
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{m.about}</p>
                <p className="text-slate-400 text-sm mt-2">
                  {ops.length
                    ? `Accettato da ${ops.length} operatori: ${opNames(ops)}.`
                    : "Non accettato dagli operatori che confrontiamo."}
                </p>
                <Link to={methodPath(m)} className={`inline-block mt-2 text-sm ${linkCls}`}>
                  {ops.length ? `Limiti, tempi e costi con ${m.name}` : `${m.name}: perché no e alternative`} →
                </Link>
              </div>
            );
          })}
        </div>
      }
      knowTitle="Scegliere il metodo di pagamento: cosa sapere"
      know={
        <>
          <h3>Deposito e prelievo vanno pensati insieme</h3>
          <p>
            Molti operatori pagano le vincite sullo stesso metodo usato per depositare, e alcuni metodi (Paysafecard,
            voucher, MyBank) servono solo per ricaricare. Scegliere fin dall'inizio un metodo che vale anche per i
            prelievi evita passaggi in più.
          </p>
          <h3>Attenzione alle esclusioni dai bonus</h3>
          <p>
            Skrill, Neteller e i voucher sono spesso esclusi dalle offerte di benvenuto: un primo deposito con un metodo
            escluso fa perdere l'offerta. Nella pagina di ogni metodo indichiamo, operatore per operatore, se le condizioni
            dell'offerta sport lo escludono.
          </p>
          <h3>Il conto deve essere tuo</h3>
          <p>
            Carta, portafoglio elettronico o conto corrente devono essere intestati al titolare del conto di gioco:
            pagamenti da metodi di altre persone vengono bloccati. Guida completa:{" "}
            <Link to="/guide/depositi-e-prelievi" className={linkCls}>
              depositi e prelievi
            </Link>
            .
          </p>
        </>
      }
      faqTitle="Domande frequenti sui metodi di pagamento"
      faqs={[
        {
          q: "Qual è il metodo di pagamento più diffuso sui siti scommesse?",
          a: (() => {
            const top = [...paymentMethods].sort((a, b) => methodOperators(b).length - methodOperators(a).length)[0];
            return `Tra gli operatori che confrontiamo, ${top.name}: lo accettano ${methodOperators(top).length} siti su ${list.length}.`;
          })(),
        },
        {
          q: "Quali metodi sono esclusi dai bonus di benvenuto?",
          a: "Più spesso Skrill, Neteller e i voucher acquistati nei punti vendita; alcuni operatori escludono anche il bonifico. L'elenco è nelle condizioni di ogni offerta.",
        },
        {
          q: "Si paga una commissione per depositare?",
          a: "Gli operatori che confrontiamo non applicano spese sui depositi online; possono esserci costi del circuito, come le spese postali sui bollettini.",
        },
        {
          q: "Quale metodo è il più veloce per prelevare?",
          a: "Di solito i portafogli elettronici e il bonifico istantaneo. Il confronto completo è nella pagina sul prelievo immediato.",
        },
      ]}
    />
  );
}

// ---------- one payment method ----------

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((t, i) => (
        <li key={t} className="flex gap-3">
          <span
            className="size-7 shrink-0 inline-flex items-center justify-center rounded-full bg-slate-800 text-white text-sm"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <span className="text-slate-300 leading-relaxed pt-0.5">{t}</span>
        </li>
      ))}
    </ol>
  );
}

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  const col = (title: string, items: string[], mark: string, cls: string) => (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-white text-lg mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-slate-300 text-sm leading-relaxed">
            <span className={`${cls} shrink-0`} aria-hidden="true">
              {mark}
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pros.length > 0 && col("Vantaggi", pros, "+", "text-best")}
      {cons.length > 0 && col("Svantaggi", cons, "−", "text-warn")}
    </div>
  );
}

const methodLabel = (m: PaymentMethodInfo) =>
  m.id === "carte" ? "carta di credito o debito" : m.id === "bitcoin" ? "Bitcoin e criptovalute" : m.name;

/** Operators' own fees for the method, grouped by the stated value ("Gratis": A, B; "2 €": C). */
function operatorFees(list: OperatorData[], m: PaymentMethodInfo) {
  const byFee = new Map<string, string[]>();
  for (const op of list)
    for (const r of methodRows(op, m))
      if (r.fee) byFee.set(r.fee, [...new Set([...(byFee.get(r.fee) ?? []), op.name])]);
  return [...byFee.entries()];
}

export function MethodPage({ method: m }: { method: PaymentMethodInfo }) {
  usePageMeta(methodMeta(m));
  const g = methodGuides[m.id];
  const path = methodPath(m);
  const hubPath = `${paths.sitiScommesse}/metodi-di-pagamento`;
  const total = publishedOperators().length;
  const list = methodOperators(m);
  const noTable = list.filter((o) => !hasMethodTable(o));
  const without = others(list);
  const withdrawals = list.filter((o) => methodRows(o, m).some((r) => r.withdrawal !== null));
  const depositOnly = list.filter((o) => methodRows(o, m).every((r) => r.withdrawal === null));
  const excluded = list.filter((o) => bonusStatus(sportOffer(o), m) === "escluso");
  const fast = list.filter((o) =>
    methodRows(o, m).some((r) => r.withdrawalTime && /^(generalmente )?immediat|pochi minuti(?! a)/i.test(r.withdrawalTime)),
  );
  const noCircuit = cardsWithoutCircuit(m);
  const highlights = methodHighlights(m);
  const fees = operatorFees(list, m);
  const label = methodLabel(m);
  const rows = list.flatMap((op) => {
    const offer = sportOffer(op);
    return methodRows(op, m).map((r, i) => ({ op, r, first: i === 0, offer }));
  });
  const alternatives = g.alternatives.map((id) => paymentMethods.find((x) => x.id === id)!);
  const none = list.length === 0;

  const table = none ? (
    <Prose>
      {g.instead?.paragraphs.map((t) => <p key={t}>{t}</p>)}
      <h3>I metodi più diffusi tra gli operatori che confrontiamo</h3>
      <ul className="flex flex-wrap gap-2">
        {paymentMethods
          .filter((x) => x.hub)
          .map((x) => ({ x, n: methodOperators(x).length }))
          .sort((a, b) => b.n - a.n)
          .slice(0, 6)
          .map(({ x, n }) => (
            <li key={x.id}>
              <Link
                to={methodPath(x)}
                className="inline-block px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-200 hover:text-white text-sm"
              >
                {x.name} · {n} operatori
              </Link>
            </li>
          ))}
      </ul>
    </Prose>
  ) : (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <caption className="sr-only">Siti scommesse che accettano {m.name}</caption>
          <thead className="bg-slate-800/60 text-slate-400 text-xs text-left">
            <tr>
              {["Operatore", "Metodo", "Deposito", "Prelievo", "Tempi di prelievo", "Costo", "Primo deposito per il bonus sport"].map(
                (c) => (
                  <th key={c} scope="col" className="p-3 font-normal">
                    {c}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {rows.map(({ op, r, first, offer }) => {
              const bonus = r.deposit === null ? null : bonusStatus(offer, m);
              return (
                <tr key={`${op.id}-${r.method}`} className={`align-top ${first ? "border-t border-slate-800" : ""}`}>
                  <th scope="row" className="p-3 text-left font-normal whitespace-nowrap">
                    {first && (
                      <Link to={operatorPath(op)} className="text-white hover:underline underline-offset-4">
                        {op.name}
                      </Link>
                    )}
                  </th>
                  <td className="p-3">{r.method}</td>
                  <td className="p-3 whitespace-nowrap">{r.deposit ?? <Muted>No</Muted>}</td>
                  <td className="p-3 whitespace-nowrap">{r.withdrawal ?? <Muted>No</Muted>}</td>
                  <td className="p-3">{r.withdrawalTime ?? <Muted>{r.withdrawal ? "Non indicato" : "—"}</Muted>}</td>
                  <td className="p-3">{r.fee ?? <Muted>Non indicato</Muted>}</td>
                  <td className="p-3">
                    {bonus === "escluso" ? (
                      <span className="text-warn">Escluso dall'offerta</span>
                    ) : bonus === "valido" ? (
                      "Non escluso"
                    ) : (
                      <Muted>{offer ? "—" : "Nessuna offerta sport"}</Muted>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {noTable.length > 0 && (
        <p className="text-slate-400 text-xs mt-2">
          {opNames(noTable)} non pubblicano limiti e tempi per singolo metodo nelle pagine che abbiamo verificato: i valori
          generali sono nella scheda dell'operatore.
        </p>
      )}
      {noCircuit.length > 0 && (
        <p className="text-slate-400 text-xs mt-2">
          {opNames(noCircuit)} accettano carte ma non indicano i circuiti nelle pagine che abbiamo verificato: sono nella
          pagina sulle{" "}
          <Link to={`${paths.sitiScommesse}/carte-di-credito`} className={linkCls}>
            carte di credito e debito
          </Link>
          .
        </p>
      )}
      {highlights.length > 0 && (
        <>
          <h3 className="text-white text-lg mt-8 mb-3">Come si differenziano gli operatori con {m.name}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {highlights.map((h) => (
              <li key={h.label} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <span className="block text-slate-400 text-xs">{h.label}</span>
                <span className="block text-white text-xl mt-1">{h.value}</span>
                <span className="block text-slate-300 text-sm mt-1">{opNames(h.ops)}</span>
              </li>
            ))}
          </ul>
          <p className="text-slate-400 text-xs mt-2">
            Valori dichiarati dagli operatori che pubblicano limiti e tempi per metodo; non è una classifica.
          </p>
        </>
      )}
    </>
  );

  const extra: NonNullable<ShellProps["extra"]> = [];
  if (g.deposit)
    extra.push({
      id: "come-funziona",
      nav: "Come funziona",
      title: `Come si usa ${m.name} sui siti scommesse`,
      icon: ListOrdered,
      node: (
        <div className="space-y-8">
          <div>
            <h3 className="text-white text-lg mb-3">Depositare con {m.name}</h3>
            <Steps items={g.deposit} />
          </div>
          <div>
            <h3 className="text-white text-lg mb-3">Prelevare con {m.name}</h3>
            {g.withdraw && withdrawals.length > 0 ? (
              <Steps items={g.withdraw} />
            ) : (
              <Prose>
                <p>
                  {withdrawals.length
                    ? `Con ${m.name} si preleva solo su ${opNames(withdrawals)}; presso gli altri operatori le vincite vanno prelevate con un altro metodo intestato a te, di solito bonifico, carta o portafoglio elettronico.`
                    : `${m.name} serve solo per depositare: le vincite vanno prelevate con un altro metodo intestato a te, di solito bonifico, carta o portafoglio elettronico.`}
                </p>
              </Prose>
            )}
          </div>
        </div>
      ),
    });
  if (g.costs.length || fees.length)
    extra.push({
      id: "costi",
      nav: "Costi",
      title: `Quanto costa usare ${m.name}`,
      icon: Coins,
      node: (
        <Prose>
          {g.costs.map((t) => (
            <p key={t}>{t}</p>
          ))}
          {fees.length > 0 && (
            <p>
              Costi indicati dagli operatori per {m.name}:{" "}
              {fees.map(([fee, ops], i) => (
                <span key={fee}>
                  {i > 0 && "; "}
                  {fee.toLowerCase()} per {names(ops)}
                </span>
              ))}
              . Gli altri non pubblicano il dato.
            </p>
          )}
        </Prose>
      ),
    });
  if (g.pros.length || g.cons.length)
    extra.push({
      id: "pro-contro",
      nav: "Pro e contro",
      title: `${m.name}: vantaggi e svantaggi`,
      icon: ThumbsUp,
      node: <ProsCons pros={g.pros} cons={g.cons} />,
    });
  extra.push({
    id: "sicurezza",
    nav: "Sicurezza",
    title: none ? "Sicurezza e tutele" : `${m.name} è sicuro?`,
    icon: ShieldCheck,
    node: (
      <Prose>
        {g.security.map((t) => (
          <p key={t}>{t}</p>
        ))}
        <p>
          Qualunque metodo usi, gioca solo su siti con concessione ADM: il numero di concessione è in fondo alla pagina
          dell'operatore e in ogni{" "}
          <Link to={paths.sitiScommesse} className={linkCls}>
            scheda operatore
          </Link>{" "}
          di questo sito.
        </p>
      </Prose>
    ),
  });
  extra.push({
    id: "scheda",
    nav: "Scheda",
    title: `${m.name} in breve`,
    icon: IdCard,
    node: (
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <dl className="text-sm">
          {[
            { label: "Tipo", value: g.kind },
            ...g.facts.filter((f) => f.label !== "Tipo"),
            {
              label: "Operatori che lo accettano",
              value: none ? `Nessuno su ${total}` : `${list.length} su ${total}`,
            },
          ].map((f) => (
            <div key={f.label} className="grid sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 p-3 border-t border-slate-800 first:border-t-0">
              <dt className="text-slate-400">{f.label}</dt>
              <dd className="text-slate-200">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    ),
  });
  extra.push({
    id: "alternative",
    nav: "Alternative",
    title: `Le alternative ${/^[aeiou]/i.test(m.name) ? "ad" : "a"} ${m.name}`,
    icon: ArrowLeftRight,
    node: (
      <ul className="grid gap-3 sm:grid-cols-2">
        {alternatives.map((a) => {
          const ops = methodOperators(a);
          return (
            <li key={a.id} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <Link to={methodPath(a)} className="text-white text-lg hover:underline underline-offset-4">
                {a.name}
              </Link>
              <span className="block text-slate-400 text-sm mt-1">
                Accettato da {ops.length} operatori su {total}
              </span>
              <p className="text-slate-300 text-sm leading-relaxed mt-2">{a.about}</p>
            </li>
          );
        })}
      </ul>
    ),
  });

  const genericFaqs: Faq[] = none
    ? [
        {
          q: `Quali siti scommesse accettano ${m.name}?`,
          a: `Nessuno dei ${total} operatori ADM che confrontiamo lo indica tra i metodi di pagamento. Le alternative più diffuse sono ${names(alternatives.map((a) => `${a.name} (${methodOperators(a).length} operatori)`))}.`,
        },
      ]
    : [
        { q: `Quali siti scommesse accettano ${m.name}?`, a: `Tra gli operatori ADM che confrontiamo: ${opNames(list)}.` },
        {
          q: `Si può prelevare con ${m.name}?`,
          a: withdrawals.length
            ? `Sì, su ${opNames(withdrawals)}.${depositOnly.length ? ` Su ${opNames(depositOnly)} vale solo per i depositi.` : ""}`
            : `No: con gli operatori che confrontiamo ${m.name} serve solo per depositare.`,
        },
        {
          q: `${m.name} è valido per il bonus di benvenuto?`,
          a: excluded.length
            ? `Dipende dall'operatore: le offerte sport di ${opNames(excluded)} lo escludono, le altre che mostriamo no.`
            : `Nelle offerte sport che mostriamo ${m.name} non è tra i metodi esclusi. Controlla sempre le condizioni prima del primo deposito.`,
        },
        {
          q: `Ci sono commissioni con ${m.name}?`,
          a: `Gli operatori che confrontiamo non applicano spese sui depositi online. ${g.costs[0] ?? ""}`.trim(),
        },
      ];

  return (
    <Shell
      path={path}
      heading={`Siti scommesse con ${label}`}
      subtitle={
        none
          ? `${m.name} sui siti di scommesse ADM: chi lo accetta e quali metodi usare al suo posto`
          : `Gli operatori ADM che accettano ${m.name}: limiti, tempi, costi, come si usa e validità per le offerte di benvenuto`
      }
      icon={iconOf(hubPath)}
      crumbs={[{ label: "Metodi di pagamento", to: hubPath }, { label: m.name }]}
      count={list.length}
      intro={
        <>
          <p>{m.about}</p>
          <p>
            {none ? (
              `Nessuno dei ${total} operatori che confrontiamo lo accetta: qui sotto spieghiamo perché, cosa usare al suo posto e come funzionano le alternative.`
            ) : (
              <>
                {list.length === total ? `Tutti i ${total}` : `${list.length} dei ${total}`} operatori che confrontiamo
                accettano {m.name}: {opNames(list)}.
                {depositOnly.length ? ` Con ${opNames(depositOnly)} serve solo per depositare.` : ""}
              </>
            )}
          </p>
        </>
      }
      tableTitle={none ? (g.instead?.title ?? `${m.name} sui siti scommesse`) : `${m.name}: limiti e tempi operatore per operatore`}
      table={table}
      detailTitle={`${m.name} sui siti scommesse in dettaglio`}
      detail={
        none ? undefined : (
          <DetailList
            items={list.map((op) => {
              const rs = methodRows(op, m);
              const offer = sportOffer(op);
              const st = bonusStatus(offer, m);
              const dep = rs.find((r) => r.deposit && r.deposit !== "Non indicato");
              const wd = rs.find((r) => r.withdrawalTime);
              return {
                op,
                text: [
                  `${op.name} accetta ${rs.map((r) => r.method).join(", ")}`,
                  dep ? ` (deposito ${dep.deposit})` : "",
                  ". ",
                  wd
                    ? `Prelievo: ${wd.withdrawalTime!.toLowerCase()}. `
                    : rs.every((r) => r.withdrawal === null)
                      ? "Non vale per i prelievi. "
                      : "",
                  st === "escluso"
                    ? `Le condizioni dell'offerta di benvenuto sport escludono ${m.name} per il primo deposito.`
                    : st === "valido"
                      ? `Le condizioni dell'offerta di benvenuto sport non escludono ${m.name}.`
                      : "",
                ].join(""),
              };
            })}
          />
        )
      }
      extra={extra}
      knowTitle={none ? "Cosa sapere sui pagamenti nel gioco online" : `Pagare con ${m.name}: cosa sapere`}
      know={
        <>
          {excluded.length > 0 && (
            <>
              <h3>Escluso da alcune offerte di benvenuto</h3>
              <p>
                Le condizioni dell'offerta sport di {opNames(excluded)} escludono {m.name}: un primo deposito con questo
                metodo non attiva l'offerta. Le altre esclusioni sono nelle condizioni di ogni offerta, nella pagina{" "}
                <Link to={paths.bonus} className={linkCls}>
                  offerte di benvenuto
                </Link>
                .
              </p>
            </>
          )}
          {!none && (
            <>
              <h3>Prelievi</h3>
              <p>
                {withdrawals.length
                  ? `Si può prelevare con ${m.name} su ${opNames(withdrawals)}.`
                  : `Nessun operatore che confrontiamo paga le vincite con ${m.name}.`}{" "}
                {fast.length ? `Tempi indicati come immediati da ${opNames(fast)}.` : ""} Il primo prelievo arriva solo
                dopo la verifica del conto, e molti operatori pagano sullo stesso metodo usato per depositare: confronto
                completo nella pagina sul{" "}
                <Link to={`${paths.sitiScommesse}/prelievo-immediato`} className={linkCls}>
                  prelievo immediato
                </Link>
                .
              </p>
            </>
          )}
          <h3>Le regole ADM sui pagamenti</h3>
          {admPaymentRules.paragraphs.map((t) => (
            <p key={t}>{t}</p>
          ))}
          {!none && (
            <>
              <h3>Intestazione</h3>
              <p>
                {m.name} deve essere intestato alla stessa persona del conto di gioco: pagamenti da metodi di altre persone
                vengono bloccati e le vincite non vengono pagate su strumenti intestati ad altri.
              </p>
              <NotListed list={without} what={`Operatori che non accettano ${m.name}`} value={() => "Non nell'elenco dei metodi"} />
            </>
          )}
        </>
      }
      faqTitle={`Domande frequenti su ${m.name}`}
      faqs={[...genericFaqs, ...g.faqs]}
      sources={[...g.sources, admPaymentRules.source]}
    />
  );
}

/** /siti-scommesse/<slug> for a thematic page or a payment method page (explicit routes in App.tsx). */
export function SitiTopicRoute() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/\/+$/, "").split("/").pop();
  const t = topics.find((x) => x.slug === slug);
  if (t) return <TopicPage key={t.id} topic={t.id} />;
  const m = paymentMethods.find((x) => x.slug === slug);
  return m ? <MethodPage key={m.id} method={m} /> : <NotFoundPage />;
}
