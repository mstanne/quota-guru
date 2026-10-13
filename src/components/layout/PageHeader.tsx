// U6: one page-header component used by every section page (title, subtitle, breadcrumb, meta line).
// Always left-aligned; the icon stays on the same line as the title, also on mobile.
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  /** Breadcrumb trail; "Home" is added automatically. */
  breadcrumb?: Crumb[];
  /** Short factual line under the subtitle (U4: replaces the big statistics boxes). */
  meta?: ReactNode;
  /** Extra content (links, notes) under the header. */
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, breadcrumb = [], meta, children }: PageHeaderProps) {
  const trail: Crumb[] = [{ label: "Home", to: "/" }, ...breadcrumb];
  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <nav aria-label="Percorso" className="text-sm text-slate-400 mb-3">
          <ol className="flex flex-wrap items-center gap-1.5">
            {trail.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">›</span>}
                {c.to && i < trail.length - 1 ? (
                  <Link to={c.to} className="hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-slate-300" aria-current={i === trail.length - 1 ? "page" : undefined}>
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex items-start gap-3">
          {Icon && <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 shrink-0 mt-1" aria-hidden="true" />}
          <h1 className="text-white text-3xl sm:text-4xl leading-tight">{title}</h1>
        </div>
        {subtitle && <p className="text-slate-400 text-base sm:text-lg mt-3 max-w-3xl">{subtitle}</p>}
        {meta && <div className="text-slate-400 text-sm mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">{meta}</div>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}

/** "6 partite · 5 operatori" style meta line. */
export function MetaItems({ items }: { items: ReactNode[] }) {
  return (
    <>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden="true">·</span>}
          {it}
        </span>
      ))}
    </>
  );
}
