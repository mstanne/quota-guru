// U6: one page-header component used by every section page (title, subtitle, breadcrumb, meta line).
// Always left-aligned; the icon stays on the same line as the title, also on mobile.
import type { ReactNode } from "react";
import { Link } from "../../lib/links";
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
      <div className="container mx-auto px-4 py-5 sm:py-10">
        <nav aria-label="Percorso" className="text-sm text-slate-400 mb-2 sm:mb-3">
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
          {Icon && <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 shrink-0 mt-0.5 sm:mt-1" aria-hidden="true" />}
          <h1 className="text-white text-2xl sm:text-4xl leading-tight">{title}</h1>
        </div>
        {subtitle && <p className="text-slate-400 text-base sm:text-lg mt-2 sm:mt-3 max-w-3xl">{subtitle}</p>}
        {meta && (
          <div className="text-slate-400 text-sm mt-2 sm:mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">{meta}</div>
        )}
        {children && <div className="mt-4 sm:mt-5">{children}</div>}
      </div>
    </div>
  );
}

/**
 * Links under a page header (classifica, statistiche, stagioni…): one row that scrolls sideways on phones, wrapped
 * from `sm` up. Use `headerLinkClass` for the links.
 */
export function HeaderLinks({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-none sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
      {children}
    </div>
  );
}
export const headerLinkClass =
  "shrink-0 inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500";

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
