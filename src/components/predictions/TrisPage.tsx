// /pronostici/tris – the three matches where the model is most sure of one outcome, weekend and European cups, with the
// chance that all three come in and how every past three went (src/lib/trisPage.ts). Informative: the point is how
// quickly "near certain" outcomes stop being certain when put together.
import { Check, Clock, Target, X } from "lucide-react";
import { Link } from "../../lib/links";
import { paths } from "../../routes";
import { formatDay, formatShortDate, formatTime, formatUpdated } from "../../lib/footballCore";
import { pct } from "../../lib/predictionsCore";
import { usePageMeta } from "../../lib/pageMeta";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { TRIS_KINDS, trisData, trisLead, trisMeta, trisOf, type Tris, type TrisPick } from "../../lib/trisPage";
import { TelegramBanner } from "../TelegramBanner";
import { site } from "../../data/site";

const STATUS: Record<Tris["status"], string> = {
  "in-attesa": "Da giocare",
  "in-corso": "In corso",
  concluso: "Concluso",
};
const day = (d: string) => formatDay(`${d}T12:00:00Z`);

function PickRow({ p, showWhere }: { p: TrisPick; showWhere: boolean }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm font-semibold tabular-nums ${
          p.hit === true
            ? "bg-best text-best-foreground"
            : p.hit === false
              ? "bg-slate-700 text-slate-200"
              : "bg-slate-800 border border-slate-700 text-white"
        }`}
        aria-hidden="true"
      >
        {p.sign}
      </span>
      <span className="flex-1 min-w-0">
        <Link to={p.path} className="text-white font-medium hover:underline">
          {p.label}
        </Link>
        <span className="block text-slate-400 text-sm">
          <time dateTime={p.kickoff}>
            {formatDay(p.kickoff)}, {formatTime(p.kickoff)}
          </time>
          {showWhere && <> · {p.where}</>}
        </span>
        <span className="block text-slate-300 text-sm">
          {p.outcome} · <span className="tabular-nums">{pct(p.p)}</span>
        </span>
      </span>
      <span className="shrink-0 text-right text-sm">
        {p.result ? (
          <span className="inline-flex items-center gap-1.5 text-white tabular-nums">
            {p.result}
            {p.hit ? (
              <Check className="w-4 h-4 text-best" aria-label="esito indicato verificato" />
            ) : (
              <X className="w-4 h-4 text-slate-400" aria-label="esito diverso" />
            )}
          </span>
        ) : p.void ? (
          <span className="text-slate-400">rinviata</span>
        ) : (
          <span className="text-slate-500">–</span>
        )}
      </span>
    </li>
  );
}

function TrisCard({ t, showWhere }: { t: Tris; showWhere: boolean }) {
  const played = t.picks.filter((p) => p.hit !== null).length;
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h3 className="text-white text-lg">Pubblicato {day(t.day)}</h3>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border border-slate-700 text-slate-300">
          {t.status !== "concluso" && <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
          {STATUS[t.status]}
        </span>
      </header>
      <ul className="divide-y divide-slate-800">
        {t.picks.map((p) => (
          <PickRow key={p.id} p={p} showWhere={showWhere} />
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-slate-300 text-sm">Probabilità che si verifichino tutte e tre</span>
          <span className="text-white text-xl font-semibold tabular-nums">{pct(t.all)}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-action" style={{ width: `${Math.round(t.all * 100)}%` }} />
        </div>
        {played > 0 && (
          <p className="text-slate-300 text-sm">
            {t.status === "concluso" ? "Com'è andata" : "Finora"}:{" "}
            <strong className="text-white font-medium">
              {t.hits} su {played}
            </strong>
            {t.status === "concluso" &&
              (t.hits === 3 ? " – tutte e tre come indicato." : " – almeno una è andata diversamente.")}
          </p>
        )}
      </div>
    </article>
  );
}

function PastList({ list }: { list: Tris[] }) {
  if (!list.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-slate-300 text-sm mb-2">Tris precedenti</h3>
      <ul className="divide-y divide-slate-800 text-sm rounded-xl border border-slate-800 bg-slate-900 px-4">
        {list.map((t) => (
          <li key={`${t.id}-${t.day}`} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <time dateTime={t.day} className="text-white">
                {formatShortDate(`${t.day}T12:00:00Z`)}
              </time>
              <span className="text-slate-300 tabular-nums">
                {t.status === "concluso" ? `${t.hits} su 3` : STATUS[t.status]} · attese tutte e tre al {pct(t.all)}
              </span>
            </div>
            <p className="text-slate-400">
              {t.picks.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && " · "}
                  <Link to={p.path} className="hover:text-white hover:underline">
                    {p.label}
                  </Link>{" "}
                  {p.sign}
                  {p.hit === true ? " ✓" : p.hit === false ? " ✗" : ""}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrisPage() {
  usePageMeta(trisMeta());
  const lead = trisLead();
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Target}
        title="Il tris: le 3 partite più prevedibili"
        subtitle="Ogni settimana, nel weekend e in ogni coppa europea, le tre partite in cui il modello statistico è più sicuro di un esito, e la probabilità che vadano tutte e tre come indicato."
        breadcrumb={[{ label: "Pronostici", to: paths.pronostici }, { label: "Tris" }]}
        meta={
          <MetaItems
            items={[
              ...(trisData.generatedAt ? [`Aggiornato al ${formatUpdated(trisData.generatedAt)}`] : []),
              "Stime statistiche, non consigli di gioco",
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-10">
        {lead && <p className="text-slate-200 text-lg leading-relaxed">{lead}</p>}

        <nav aria-label="Tipi di tris" className="flex flex-wrap gap-2">
          {TRIS_KINDS.map((k) => (
            <a
              key={k.slug}
              href={`#${k.slug}`}
              className="px-3 py-1.5 rounded-md text-sm border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
            >
              {k.name}
            </a>
          ))}
        </nav>

        <section aria-labelledby="perche" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="perche" className="text-white text-lg mb-2">
            Perché tre partite "sicure" insieme non lo sono
          </h2>
          <p className="text-slate-300 text-sm mb-2">
            Ogni esito qui sotto è il più probabile della sua partita, spesso oltre il 70-80%. Ma perché vadano tutte e
            tre come indicato le probabilità si moltiplicano: tre esiti all'80% ciascuno si verificano insieme solo nel
            51% dei casi, cioè circa una volta su due.
          </p>
          <p className="text-slate-400 text-sm">
            Il tris serve a vedere questo effetto sui dati veri, settimana dopo settimana: per questo pubblichiamo anche
            com'è andato ogni tris, non solo quelli riusciti.
          </p>
        </section>

        {TRIS_KINDS.map((k) => {
          const list = trisOf(k.id);
          const [latest, ...past] = list;
          const showWhere = k.id === "tris-weekend";
          return (
            <section key={k.id} id={k.slug} aria-labelledby={`tris-${k.slug}`} className="scroll-mt-20">
              <h2 id={`tris-${k.slug}`} className="text-white text-2xl mb-1">
                {k.title}
              </h2>
              <p className="text-slate-400 text-sm mb-4">{k.when}</p>
              {latest ? (
                <TrisCard t={latest} showWhere={showWhere} />
              ) : (
                <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300 text-sm">
                  Il primo {k.title.replace(/^Il /, "")} non è ancora uscito.
                </p>
              )}
              <PastList list={past.slice(0, 12)} />
            </section>
          );
        })}

        <TelegramBanner topic="tris" />

        <section aria-labelledby="come-tris" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="come-tris" className="text-white text-lg mb-2">
            Come viene scelto
          </h2>
          <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1.5">
            <li>
              Tra le partite in programma con un pronostico, le tre con l'esito più probabile più alto (1, X o 2). In
              Champions League contano insieme le partite di martedì e mercoledì.
            </li>
            <li>
              Il tris viene registrato la mattina in cui esce, con le probabilità di quel momento, e non viene più
              cambiato: anche quando le stime delle partite si aggiornano, qui resta quello pubblicato.
            </li>
            <li>
              Lo stesso tris esce sul nostro{" "}
              <a
                href={site.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-action-text hover:text-action-text-hover"
              >
                canale Telegram
              </a>
              ; il lunedì il bilancio dice com'è andato.
            </li>
          </ul>
          <p className="mt-3 text-slate-400 text-sm">
            Il modello non conosce infortuni, squalifiche e turnover.{" "}
            <Link to={paths.metodologia} className="text-action-text hover:text-action-text-hover">
              Come calcoliamo le probabilità
            </Link>{" "}
            ·{" "}
            <Link to="/bilancio-pronostici" className="text-action-text hover:text-action-text-hover">
              Bilancio di tutti i pronostici
            </Link>{" "}
            ·{" "}
            <Link to="/pronostici/multiple" className="text-action-text hover:text-action-text-hover">
              Le multiple del giorno
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
