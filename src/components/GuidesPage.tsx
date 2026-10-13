import { BookOpen, Shield, Users } from "lucide-react";
import { Link } from "react-router";
import { Card } from "./ui/card";
import { PageHeader } from "./layout/PageHeader";
import { categoryIcons, GuideCard } from "./guides/GuideUi";
import { categoryPath, guideCategories, guides, guidesIn } from "../data/guides";
import { paths } from "../routes";

/** Guides index: categories (each with its own page), featured guides, then up to 3 guides per category. */
export function GuidesPage() {
  const categories = guideCategories.filter((c) => guidesIn(c.slug).length);
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={BookOpen}
        title="Guide alle scommesse"
        subtitle="Le basi per leggere le quote, gestire il budget e giocare in modo informato e responsabile"
        breadcrumb={[{ label: "Guide" }]}
        meta={<span>{guides.length} guide</span>}
      />
      <div className="container mx-auto px-4 py-12">
        <nav aria-labelledby="cats" className="mb-12">
          <h2 id="cats" className="text-white text-xl mb-6">
            Esplora per categoria
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => {
              const Icon = categoryIcons[c.icon];
              const n = guidesIn(c.slug).length;
              return (
                <li key={c.slug}>
                  <Link
                    to={categoryPath(c)}
                    className="group flex h-full flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-4 text-center transition-colors hover:border-slate-500"
                  >
                    <Icon
                      className="w-8 h-8 text-slate-300 mb-2 group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span className="text-slate-300 text-sm group-hover:text-white">{c.name}</span>
                    <span className="text-slate-400 text-xs mt-1">{n === 1 ? "1 guida" : `${n} guide`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <section aria-labelledby="featured" className="mb-12">
          <h2 id="featured" className="text-white text-xl mb-6">
            Guide in evidenza
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides
              .filter((g) => g.featured)
              .map((g) => (
                <GuideCard key={g.slug} guide={g} featured />
              ))}
          </div>
        </section>
        {categories.map((c) => (
          <section key={c.slug} aria-labelledby={`cat-${c.slug}`} className="mb-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
              <h2 id={`cat-${c.slug}`} className="text-white text-xl">
                {c.name}
              </h2>
              <Link
                to={categoryPath(c)}
                className="text-sm text-slate-300 hover:text-white underline underline-offset-2"
              >
                Vedi tutte le {guidesIn(c.slug).length} guide<span className="sr-only"> della categoria {c.name}</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guidesIn(c.slug)
                .filter((g) => !g.featured)
                .slice(0, 3)
                .map((g) => (
                  <GuideCard key={g.slug} guide={g} />
                ))}
            </div>
          </section>
        ))}
        <Card className="bg-slate-800/60 border-slate-700">
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-white text-2xl mb-3">Hai bisogno di aiuto?</h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Hai una domanda su quote, mercati o sul funzionamento del confronto? Scrivici: rispondiamo di solito entro
              due giorni lavorativi.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to={paths.contatti}
                className="inline-flex items-center gap-2 px-6 py-3 bg-action hover:bg-action-hover text-action-foreground rounded-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" aria-hidden="true" />
                Scrivici
              </Link>
              <Link
                to={`${paths.guidaDettaglio}#responsabile`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <Shield className="w-5 h-5" aria-hidden="true" />
                Gioco responsabile
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
