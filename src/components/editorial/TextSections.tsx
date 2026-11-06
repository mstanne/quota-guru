// A block of generated text: an h2, then sections with an h3, paragraphs and bullets (links as [testo](/percorso)).
// Used by the competition pages (src/lib/editorial/extraTexts.ts).
import type { ReactNode } from "react";
import { Rich } from "../content/Rich";
import type { ArticleSection } from "../../lib/editorial/engine.mjs";

export function TextSections({
  id,
  title,
  sections,
  note,
  className = "",
}: {
  id: string;
  title: ReactNode;
  sections: ArticleSection[];
  note?: string;
  className?: string;
}) {
  if (!sections.length) return null;
  return (
    <section aria-labelledby={id} className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${className}`}>
      <h2 id={id} className="text-white text-xl mb-4">
        {title}
      </h2>
      <div className="space-y-5 text-slate-300 leading-relaxed max-w-3xl">
        {sections.map((s) => (
          <div key={s.id}>
            <h3 className="text-white text-base mb-2">{s.title}</h3>
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
        {note && <p className="text-slate-400 text-sm italic">{note}</p>}
      </div>
    </section>
  );
}
