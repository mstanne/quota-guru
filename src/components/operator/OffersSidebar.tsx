// Comparative sidebar of every operator's welcome offer, shown next to /bonus, /siti-scommesse and /bonus/<offerta>.
// Neutral by design (Decreto Dignità): alphabetical order, no ranking or "best" label, no button to the operator –
// each row links to the offer explained on this site. Figures come from src/data/offers.json and src/lib/bonusCost.ts.
import { useState } from "react";
import { ChevronRight, Scale } from "lucide-react";
import { Link } from "../../lib/links";
import { getOperator, isPlaceholder } from "../../data/operators";
import { amountFor, formatEuro, offersInSection, visibleOffers, type WelcomeOffer } from "../../data/offers";
import { offerPath, operatorNameFor } from "../../lib/offerPages";
import { paths } from "../../routes";
import { OperatorLogo } from "./OperatorUi";

type Product = "sport" | "casino";
const TABS: { id: Product; label: string }[] = [
  { id: "sport", label: "Scommesse" },
  { id: "casino", label: "Casinò" },
];

export function OffersSidebar({
  currentOfferId,
  initial = "sport",
  offers = visibleOffers({ includeDrafts: import.meta.env.DEV }),
}: {
  /** Offer of the page being viewed: highlighted in the list. */
  currentOfferId?: string;
  initial?: Product;
  offers?: WelcomeOffer[];
}) {
  const [product, setProduct] = useState<Product>(initial);
  const list = offersInSection(offers, product)
    .filter((o) => o.components.some((c) => c.product === product))
    .map((o) => ({ o, name: operatorNameFor(o) }))
    .sort((a, b) => a.name.localeCompare(b.name, "it") || a.o.title.localeCompare(b.o.title, "it"));
  // an operator with two offers in the same section: show the offer's own name too
  const twins = new Set(list.map((x) => x.name).filter((n, i, all) => all.indexOf(n) !== i));

  return (
    <aside aria-labelledby="confronto-offerte" className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="p-4 border-b border-slate-800">
        <h2 id="confronto-offerte" className="flex items-center gap-2 text-white text-lg">
          <Scale className="w-5 h-5 text-slate-300" aria-hidden="true" />
          Offerte a confronto
        </h2>
        <p className="text-slate-400 text-xs mt-1">Tutti gli operatori, in ordine alfabetico.</p>
        <div
          role="group"
          aria-label="Prodotto"
          className="mt-3 flex gap-1 p-1 rounded-lg bg-slate-950/60 border border-slate-800"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setProduct(t.id)}
              aria-pressed={product === t.id}
              data-track="filter_use"
              data-track-filter="offers-sidebar"
              data-track-value={t.id}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                product === t.id ? "bg-predict/15 text-predict" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <p className="p-4 text-slate-400 text-sm">Nessuna offerta verificata da mostrare.</p>
      ) : (
        <ul>
          {list.map(({ o, name }) => {
            const current = o.id === currentOfferId;
            const op = getOperator(o.operatorId);
            const draft = o.status !== "approvata";
            const body = (
              <>
                <OperatorLogo
                  operator={{ ...op, name, logoAlt: `Logo ${name}` }}
                  width={44}
                  height={44}
                  className="rounded-lg bg-slate-800 p-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-white font-semibold leading-tight truncate">
                    {name}
                    {twins.has(name) && <span className="text-slate-400 font-normal text-sm"> · {o.title}</span>}
                  </span>
                  <span className="block text-slate-400 text-sm tabular-nums">
                    Fino a {formatEuro(amountFor(o, product))}
                  </span>
                </span>
                {!current && (
                  <span className="self-stretch flex items-center pl-3 border-l border-slate-800">
                    <ChevronRight className="w-5 h-5 text-slate-300" aria-hidden="true" />
                  </span>
                )}
              </>
            );
            const cls = `flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 ${
              current ? "bg-predict/10" : "hover:bg-slate-800/40"
            }`;
            return (
              <li key={o.id}>
                {current || draft || isPlaceholder(o.id) ? (
                  <div className={cls} aria-current={current ? "page" : undefined}>
                    {body}
                  </div>
                ) : (
                  <Link to={offerPath(o)} className={cls}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="p-4 text-slate-500 text-xs leading-relaxed">
        Importi massimi indicati dagli operatori per la sola parte {product === "sport" ? "scommesse" : "casinò"}. Non è
        una classifica. 18+ · Valgono i termini degli operatori ·{" "}
        <Link to={paths.bonus} className="underline underline-offset-2 hover:text-slate-300">
          tutte le condizioni
        </Link>
      </p>
    </aside>
  );
}
