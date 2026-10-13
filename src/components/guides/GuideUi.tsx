// Shared building blocks for the guides section: category icons, guide cards and content blocks.
import { Award, BookOpen, Calculator, ChevronRight, Clock, Info, Shield, Target, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { Rich } from "../content/Rich";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { ImageSlot } from "../media/ImageSlot";
import { findCategory, findGuide, guidePath, type Guide, type GuideBlock, type GuideCategory } from "../../data/guides";

export const categoryIcons: Record<GuideCategory["icon"], LucideIcon> = {
  book: BookOpen,
  calculator: Calculator,
  target: Target,
  shield: Shield,
  award: Award,
  clock: Clock,
};

export { Rich, linksIn } from "../content/Rich";

export function GuideCard({ guide, featured = false }: { guide: Guide; featured?: boolean }) {
  const category = findCategory(guide.category);
  return (
    <Link
      to={guidePath(guide)}
      className="block group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
    >
      <Card className="bg-slate-900 border-slate-800 hover:border-slate-500 transition-all overflow-hidden group h-full">
        <div className="relative h-48 overflow-hidden">
          <ImageSlot
            placeholder="[PLACEHOLDER_IMMAGINE_GUIDA_800x450]"
            src={guide.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {featured && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-slate-700 text-white">In evidenza</Badge>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            {category && (
              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                {category.name}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{guide.readTime}</span>
            </div>
          </div>
          <h3 className="text-white text-lg mb-2 group-hover:underline underline-offset-2">{guide.title}</h3>
          <p className="text-slate-400 text-sm line-clamp-2">{guide.description}</p>
        </div>
      </Card>
    </Link>
  );
}

export function GuideBlockView({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-slate-300 leading-relaxed mb-4">
          <Rich text={block.text} />
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={`${block.ordered ? "list-decimal" : "list-disc"} pl-6 mb-4 space-y-2 text-slate-300 marker:text-slate-500`}
        >
          {block.items.map((it) => (
            <li key={it}>
              <Rich text={it} />
            </li>
          ))}
        </List>
      );
    }
    case "callout": {
      const warn = block.tone === "warn";
      const Icon = warn ? TriangleAlert : Info;
      return (
        <div
          className={`flex gap-3 rounded-lg border p-4 mb-4 ${warn ? "bg-warn/10 border-warn/30" : "bg-slate-800/60 border-slate-700"}`}
        >
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${warn ? "text-warn" : "text-slate-300"}`} aria-hidden="true" />
          <div>
            <p className="text-white mb-1">{block.title}</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              <Rich text={block.text} />
            </p>
          </div>
        </div>
      );
    }
    case "example":
      return (
        <div className="rounded-lg border-l-4 border-best bg-slate-900 p-4 mb-4">
          <p className="text-white text-sm mb-1">{block.title}</p>
          <p className="text-slate-300 text-sm leading-relaxed">
            <Rich text={block.text} />
          </p>
        </div>
      );
    case "cards":
      return (
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          {block.items.map((c) => (
            <div key={c.title} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-white mb-1">{c.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                <Rich text={c.text} />
              </p>
            </div>
          ))}
        </div>
      );
    case "guides":
      return (
        <ol className="mb-4 space-y-2">
          {block.slugs.map((slug, i) => {
            const g = findGuide(slug);
            if (!g) return null;
            return (
              <li key={slug}>
                <Link
                  to={guidePath(g)}
                  className="group flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-500"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-white group-hover:underline underline-offset-2">{g.title}</span>
                    <span className="block text-slate-400 text-sm line-clamp-1">{g.description}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto mb-4 rounded-lg border border-slate-800">
          <table className="w-full text-sm text-left">
            {block.caption && <caption className="caption-bottom text-slate-400 text-xs p-2">{block.caption}</caption>}
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-3 font-medium">
                    {h || <span className="sr-only">Voce</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-800">
                  {r.map((c, j) =>
                    j === 0 ? (
                      <th key={j} scope="row" className="px-4 py-3 text-white font-normal">
                        {c}
                      </th>
                    ) : (
                      <td key={j} className="px-4 py-3 text-slate-300">
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
