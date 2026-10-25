// Single guide page: /guide/<slug>. Content comes from src/data/guides.ts.
import { useEffect, useRef } from "react";
import { Calendar, ChevronDown, Clock, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { ImageSlot } from "../media/ImageSlot";
import { NotFoundPage } from "../NotFoundPage";
import { categoryIcons, GuideBlockView, GuideCard, Rich } from "./GuideUi";
import { categoryPath, findCategory, findGuide, guideMeta, relatedGuides, type Guide } from "../../data/guides";
import { responsibleGambling as rg } from "../../data/operators";
import { usePageMeta } from "../../lib/pageMeta";
import { track } from "../../lib/analytics";
import { paths } from "../../routes";

export function GuideArticlePage() {
  const { slug } = useParams();
  const guide = findGuide(slug);
  usePageMeta(guide ? guideMeta(guide) : null);
  if (!guide) return <NotFoundPage />;
  const category = findCategory(guide.category)!;
  const related = relatedGuides(guide);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={categoryIcons[category.icon]}
        title={guide.title}
        subtitle={guide.description}
        breadcrumb={[
          { label: "Guide", to: paths.guide },
          { label: category.name, to: categoryPath(category) },
          { label: guide.title },
        ]}
        meta={
          <MetaItems
            items={[
              <Link
                key="c"
                to={categoryPath(category)}
                className="text-slate-300 hover:text-white underline underline-offset-2"
              >
                {category.name}
              </Link>,
              <span key="t" className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {guide.readTime} di lettura
              </span>,
              <span key="d" className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Aggiornata il {guide.updatedAt}
              </span>,
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0 max-w-3xl">
            <div className="mb-8 rounded-lg overflow-hidden">
              <ImageSlot
                placeholder="[PLACEHOLDER_IMMAGINE_COPERTINA_1200x500]"
                src={guide.image}
                alt=""
                className="w-full h-56 sm:h-80 object-cover"
              />
            </div>
            <nav aria-label="Indice" className="lg:hidden mb-8 rounded-lg border border-slate-800 bg-slate-900 p-5">
              <p className="text-white text-lg mb-3">In questa guida</p>
              <Toc guide={guide} />
            </nav>
            {guide.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
                <h2 className="text-white text-2xl mb-4">
                  {i + 1}. {s.title}
                </h2>
                {s.blocks.map((b, j) => (
                  <GuideBlockView key={j} block={b} />
                ))}
              </section>
            ))}
            {guide.faq?.length ? (
              <section id="domande" className="mb-10 scroll-mt-24">
                <h2 className="text-white text-2xl mb-4">Domande frequenti</h2>
                <div className="space-y-3">
                  {guide.faq.map((f) => (
                    <details key={f.q} className="group rounded-lg border border-slate-800 bg-slate-900">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-white [&::-webkit-details-marker]:hidden">
                        <h3 className="text-base">{f.q}</h3>
                        <ChevronDown
                          className="w-5 h-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>
                      <p className="px-4 pb-4 text-slate-300 leading-relaxed">
                        <Rich text={f.a} />
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
            <ReadMarker guide={guide.slug} category={guide.category} />
            <aside aria-label="Gioco responsabile" className="rounded-lg border border-warn/30 bg-warn/10 p-5 flex gap-3">
              <ShieldCheck className="w-6 h-6 text-warn shrink-0" aria-hidden="true" />
              <p className="text-slate-300 text-sm leading-relaxed">
                Il gioco è vietato ai minori di {rg.minAge} anni e può causare dipendenza. Se hai bisogno di aiuto chiama
                il {rg.helplineName} ({rg.helplineOrg}):{" "}
                <a href={rg.helplineHref} className="text-white underline underline-offset-2">
                  {rg.helplineNumber}
                </a>
                , gratuito e anonimo.
              </p>
            </aside>
          </article>
          <nav aria-label="Indice laterale" className="hidden lg:block">
            <div className="sticky top-24 rounded-lg border border-slate-800 bg-slate-900 p-5">
              <p className="text-white text-lg mb-3">In questa guida</p>
              <Toc guide={guide} />
            </div>
          </nav>
        </div>
        <section aria-labelledby="related" className="mt-12">
          <h2 id="related" className="text-white text-xl mb-6">
            Altre guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Toc({ guide }: { guide: Guide }) {
  return (
    <ol className="space-y-2 text-sm">
      {guide.sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="text-slate-300 hover:text-white hover:underline underline-offset-2">
            {i + 1}. {s.title}
          </a>
        </li>
      ))}
      {guide.faq?.length ? (
        <li>
          <a href="#domande" className="text-slate-300 hover:text-white hover:underline underline-offset-2">
            Domande frequenti
          </a>
        </li>
      ) : null}
    </ol>
  );
}

/** Invisible marker at the end of the article: sends guide_read once when the visitor scrolls to it. */
function ReadMarker({ guide, category }: { guide: string; category: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        track("guide_read", { guide, category });
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [guide, category]);
  return <div ref={ref} aria-hidden="true" />;
}
