// Small building blocks shared by the team pages.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { referenceTime } from "../../lib/footballCore";

export function Card({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-xl border border-slate-800 bg-slate-900 p-5" aria-labelledby={`${id}-titolo`}>
      {children}
    </section>
  );
}

export function SectionTitle({ id, icon: Icon, children }: { id: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-white text-xl mb-4">
      <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
      {children}
    </h2>
  );
}

export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-8 sm:grid-cols-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-2 border-b border-slate-800">
          <dt className="text-slate-400">{label}</dt>
          <dd className="text-white text-right tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Age at the time of the build (same value in the pre-rendered page and in the browser). */
export function age(born: string) {
  const b = new Date(born);
  const now = new Date(referenceTime);
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) a--;
  return a;
}

export const num = (v: number, digits = 1) => v.toFixed(digits).replace(".", ",");

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Rome" }).format(
    new Date(iso),
  );
