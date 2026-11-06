// "Vai a" bar of the long pages (match pages): one sticky row of links to the page's sections, under the site
// header. Sections that the page does not show this time are dropped after loading (the pre-rendered HTML lists them
// all; the links work either way).
import { useEffect, useState } from "react";

export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const [shown, setShown] = useState(items);
  const [active, setActive] = useState<string | null>(null);
  const key = items.map((i) => i.id).join(",");
  useEffect(() => {
    const present = items.filter((i) => document.getElementById(i.id));
    setShown(present);
    // the section being read: the last one whose heading is above the middle of the screen
    const onScroll = () => {
      let cur: string | null = null;
      for (const i of present) {
        const el = document.getElementById(i.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (shown.length < 2) return null;
  return (
    <nav
      aria-label="Sezioni della pagina"
      className="sticky z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800"
      style={{ top: "var(--header-h, 0px)" }}
    >
      <div className="container mx-auto px-4">
        <div className="-mx-4 px-4 flex gap-1 overflow-x-auto scrollbar-none py-2">
          {shown.map((i) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-md text-sm transition-colors ${
                active === i.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {i.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
