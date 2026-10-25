// Archived match pages: a finished match keeps its URL after it leaves the data window of the snapshot.
//
// At build time scripts/prerender.mjs stores the final HTML of every finished match page (.cache/seo/archive) and,
// once the match is no longer in the data, publishes that stored HTML inside the current site layout. The page
// components render <ArchivedOrNotFound /> when they cannot find the match:
//   - pre-render: the stored HTML is passed in with setArchivedHtml() before rendering the URL;
//   - browser: main.tsx reads it back from the pre-rendered page before hydrating, so React keeps it unchanged;
//   - in-app navigation to an archived URL (no stored HTML in memory): one full page load fetches the static page.
import { useEffect } from "react";
import { useLocation } from "react-router";
import { NotFoundPage } from "../components/NotFoundPage";

export const ARCHIVED_ATTR = "data-archived-page";

const clean = (p: string) => (p !== "/" ? p.replace(/\/+$/, "") : p);

/** Stored HTML of the archived page currently being rendered, with its URL (and, in the browser, its head). */
let archived: { path: string; html: string; title?: string; description?: string } | null = null;
/** Browser: URL the document was loaded for (null during the pre-render). */
let firstPath: string | null = null;

/** Pre-render: HTML to show for `path` (null after rendering it). */
export function setArchivedHtml(path: string | null, html: string | null = null) {
  archived = path && html !== null ? { path: clean(path), html } : null;
}

/** Browser only: called once before hydration with the URL the document was loaded for. */
export function captureArchivedPage(path: string) {
  firstPath = clean(path);
  const el = document.querySelector(`[${ARCHIVED_ATTR}]`);
  const description = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? undefined;
  archived = el ? { path: firstPath, html: el.innerHTML, title: document.title, description } : null;
}

export function ArchivedOrNotFound() {
  const pathname = clean(useLocation().pathname);
  const page = archived?.path === pathname ? archived : null;
  const html = page?.html ?? null;
  // Reached by in-app navigation: the static file (if it exists) is the only copy of the page.
  const reload = !html && firstPath !== null && firstPath !== pathname;
  useEffect(() => {
    if (reload) window.location.reload();
    // back on the archived page after visiting others: restore its title and description
    if (page?.title) document.title = page.title;
    if (page?.description) document.querySelector('meta[name="description"]')?.setAttribute("content", page.description);
  }, [reload, page]);
  if (html) return <div {...{ [ARCHIVED_ATTR]: "" }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (reload) return null;
  return <NotFoundPage />;
}
