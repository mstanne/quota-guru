// /widget — free widgets other sites can embed (src/lib/widgets.ts): preview and embed code of each one.
import { useState } from "react";
import { Code2, Check, Copy } from "lucide-react";
import { Link } from "../lib/links";
import { PageHeader } from "./layout/PageHeader";
import { usePageMeta } from "../lib/pageMeta";
import { paths } from "../routes";
import { site } from "../data/site";
import { WIDGET_PAGE, embedCode, embedSrc, widgetPageMeta, widgetTitle, widgets, type WidgetDef } from "../lib/widgets";

function WidgetCard({ w }: { w: WidgetDef }) {
  const [light, setLight] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = embedCode(w, light);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <section id={w.id} aria-labelledby={`${w.id}-titolo`} className="scroll-mt-24 grid gap-4 lg:grid-cols-2 items-start">
      <div className="space-y-3">
        <h2 id={`${w.id}-titolo`} className="text-white text-xl">
          {widgetTitle(w)}
        </h2>
        <div className="flex gap-2 text-sm" role="group" aria-label="Tema del widget">
          {[
            [false, "Scuro"],
            [true, "Chiaro"],
          ].map(([v, label]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => setLight(v as boolean)}
              aria-pressed={light === v}
              className={`rounded-full border px-3 py-1 ${light === v ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="block text-sm text-slate-400" htmlFor={`${w.id}-codice`}>
          Codice da incollare nella pagina (HTML)
        </label>
        <textarea
          id={`${w.id}-codice`}
          readOnly
          value={code}
          rows={6}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-200"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-900 hover:bg-white"
        >
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
          {copied ? "Copiato" : "Copia il codice"}
        </button>
      </div>
      <iframe
        src={embedSrc(w, light).replace("https://www.quotaguru.it", "")}
        title={`Anteprima: ${widgetTitle(w)}`}
        height={w.height}
        loading="lazy"
        className="w-full max-w-[640px] rounded-xl border border-slate-800"
      />
    </section>
  );
}

export function WidgetPage() {
  usePageMeta(widgetPageMeta());
  const list = widgets();
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Code2}
        title="Widget gratuiti per il tuo sito"
        subtitle="Le classifiche con le probabilità del nostro modello, da incorporare in un sito, un blog o un forum. Gratis, senza registrazione, si aggiornano da soli."
        breadcrumb={[{ label: "Widget" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <div className="max-w-3xl text-slate-300 space-y-3">
          <p>
            Scegli un widget, copia il codice e incollalo nella tua pagina dove vuoi che compaia (in WordPress con un
            blocco "HTML personalizzato"). Si aggiorna a ogni nostro aggiornamento dei dati, più volte al giorno: non devi
            fare nient'altro.
          </p>
          <p>
            Puoi usarlo liberamente, anche su siti con pubblicità; ti chiediamo solo di lasciare il link a Quota Guru che è
            nel codice. Il widget non contiene pubblicità né contenuti sulle scommesse: solo classifica e probabilità.
            Per un widget su misura scrivi a{" "}
            <a href={`mailto:${site.email}`} className="text-action-text hover:text-action-text-hover">
              {site.email}
            </a>
            .
          </p>
          <nav aria-label="Widget disponibili" className="flex flex-wrap gap-2 pt-2">
            {list.map((w) => (
              <a
                key={w.id}
                href={`#${w.id}`}
                className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
              >
                {w.name}
              </a>
            ))}
          </nav>
        </div>
        {list.map((w) => (
          <WidgetCard key={w.id} w={w} />
        ))}
        <p className="max-w-3xl text-slate-400 text-xs">
          Le probabilità sono stime statistiche, non certezze: come le calcoliamo è spiegato nella{" "}
          <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
            metodologia
          </Link>
          . Indirizzo di questa pagina da condividere: www.quotaguru.it{WIDGET_PAGE}
        </p>
      </div>
    </div>
  );
}
