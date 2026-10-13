// Single guide page: /guide/<slug>. Content comes from src/data/guides.ts.
import { Calendar, Clock, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { ImageSlot } from "../media/ImageSlot";
import { NotFoundPage } from "../NotFoundPage";
import { categoryIcons, GuideBlockView, GuideCard } from "./GuideUi";
import { categoryPath, findCategory, findGuide, guideMeta, guides, type Guide } from "../../data/guides";
import { responsibleGambling as rg } from "../../data/operators";
import { usePageMeta } from "../../lib/pageMeta";
import { paths } from "../../routes";

export function GuideArticlePage() {
  const { slug } = useParams();
  const guide = findGuide(slug);
  usePageMeta(guide ? guideMeta(guide) : null);
  if (!guide) return <NotFoundPage />;
  const category = findCategory(guide.category)!;
  // Related: same category first, then the others, max 3.
  const related = [
    ...guides.filter((g) => g.slug !== guide.slug && g.category === guide.category),
    ...guides.filter((g) => g.slug !== guide.slug && g.category !== guide.category),
  ].slice(0, 3);

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
    </ol>
  );
}
