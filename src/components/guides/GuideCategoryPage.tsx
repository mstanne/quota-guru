// Guides of one category: /guide/categoria/<slug>.
import { Link, useParams } from "react-router";
import { PageHeader } from "../layout/PageHeader";
import { NotFoundPage } from "../NotFoundPage";
import { categoryIcons, GuideCard } from "./GuideUi";
import { categoryMeta, categoryPath, findCategory, guideCategories, guidesIn } from "../../data/guides";
import { usePageMeta } from "../../lib/pageMeta";
import { paths } from "../../routes";

export function GuideCategoryPage() {
  const { categoria } = useParams();
  const category = findCategory(categoria);
  const list = category ? guidesIn(category.slug) : [];
  usePageMeta(category && list.length ? categoryMeta(category) : null);
  if (!category || !list.length) return <NotFoundPage />;
  const others = guideCategories.filter((c) => c.slug !== category.slug && guidesIn(c.slug).length);

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={categoryIcons[category.icon]}
        title={category.name}
        subtitle={category.description}
        breadcrumb={[{ label: "Guide", to: paths.guide }, { label: category.name }]}
        meta={<span>{list.length === 1 ? "1 guida" : `${list.length} guide`}</span>}
      />
      <div className="container mx-auto px-4 py-10">
        <h2 className="sr-only">Guide della categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
        <nav aria-labelledby="other-cats" className="mt-12">
          <h2 id="other-cats" className="text-white text-xl mb-4">
            Altre categorie
          </h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((c) => {
              const Icon = categoryIcons[c.icon];
              return (
                <li key={c.slug}>
                  <Link
                    to={categoryPath(c)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
