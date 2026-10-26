// Editorial block of a match page (preview before kick-off, recap after the final whistle).
import { ChevronDown, FileText } from "lucide-react";
import { Rich } from "../content/Rich";
import type { Article } from "../../lib/editorial";

export function MatchEditorial({ article, className = "" }: { article: Article | null; className?: string }) {
  if (!article) return null;
  const headingId = `editoriale-${article.key.replace(/[^a-z0-9]+/gi, "-")}`;
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${className}`}
      aria-labelledby={headingId}
      data-source={article.source}
    >
      <h2 id={headingId} className="flex items-center gap-2 text-white text-xl mb-4">
        <FileText className="w-5 h-5 text-slate-300" aria-hidden="true" />
        {article.kind === "preview" ? "Anteprima" : "Com'è andata"}
      </h2>
      <div className="space-y-5 text-slate-300 leading-relaxed">
        {article.sections.map((s, i) => (
          <div key={s.id}>
            {i > 0 && <h3 className="text-white text-base mb-2">{s.title}</h3>}
            {s.paragraphs.map((p, j) => (
              <p key={j} className="mb-3 last:mb-0">
                <Rich text={p} />
              </p>
            ))}
            {s.bullets.length > 0 && (
              <ul className="list-disc pl-6 space-y-1.5 marker:text-slate-500">
                {s.bullets.map((b, j) => (
                  <li key={j}>
                    <Rich text={b} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {article.faq.length > 0 && (
          <div>
            <h3 className="text-white text-base mb-2">Domande frequenti</h3>
            <div className="space-y-2">
              {article.faq.map((f) => (
                <details key={f.q} className="group rounded-lg border border-slate-800 bg-slate-950/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
                    <span data-faq="q">{f.q}</span>
                    <ChevronDown
                      className="w-5 h-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-4 pb-3" data-faq="a">
                    <Rich text={f.a} />
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}
        <p className="text-slate-400 text-sm italic">{article.note}</p>
      </div>
    </section>
  );
}
