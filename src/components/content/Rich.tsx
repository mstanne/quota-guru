// Text with inline links written as [testo](/percorso) – internal paths only (guides, match texts).
import type { ReactNode } from "react";
import { Link } from "../../lib/links";

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
const linkClass = "text-action-text underline underline-offset-2 hover:text-action-text-hover";

export function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push(
      <Link key={m.index} to={m[2]} className={linkClass}>
        {m[1]}
      </Link>,
    );
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** Internal paths referenced by a text (used by the link checks). */
export const linksIn = (text: string) => [...text.matchAll(LINK)].map((m) => m[2]);
