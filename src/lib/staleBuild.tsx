// The site is published again every 15 minutes (live scores) and every new build replaces the JS and CSS files
// (their names carry a hash). A tab opened before a publication still asks for the old files: they are gone (404),
// the page's code cannot load and React, with nothing to show, left a white page.
//
// Here: when a page's code fails to load, reload the page once, which brings the HTML and files of the current
// build. A guard in sessionStorage stops a reload loop if the files are really missing; then, and for any other error
// that would empty the page, an error boundary shows a short message with a button instead of a white page.
import { Component, type ReactNode } from "react";

const KEY = "qg-ricarica";
/** Reload at most once every 30 seconds. */
const GAP_MS = 30_000;

/** Reloads the page once; false if a reload already happened in the last 30 seconds (no loop). */
export function reloadOnce(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < GAP_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage blocked: reload anyway, the browser stops after a few */
  }
  window.location.reload();
  return true;
}

/** Errors that mean "a file of the build is missing" (dynamic import, preload, CSS chunk). */
export const isChunkError = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|module script|Unable to preload CSS|Failed to fetch|error loading dynamically|ChunkLoadError/i.test(
    String((e as Error)?.message ?? e),
  );

/** Vite's own event for a failed preload of a page's files. */
export function listenForStaleBuild() {
  if (typeof window === "undefined") return;
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadOnce()) event.preventDefault();
  });
}

/** Instead of a white page: a message and a reload button (after the automatic reload has been tried). */
export class PageErrorBoundary extends Component<
  { children: ReactNode; /** Changes on navigation: the next page starts clean. */ resetKey?: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  componentDidCatch(error: unknown) {
    if (isChunkError(error)) reloadOnce();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center">
        <h1 className="text-white text-2xl mb-3">La pagina non si è caricata</h1>
        <p className="text-slate-300 mb-6">
          Il sito si è appena aggiornato e questa scheda aveva ancora la versione precedente. Ricarica per vedere la
          pagina aggiornata.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-action px-4 py-2 text-action-foreground font-medium"
        >
          Ricarica la pagina
        </button>
      </div>
    );
  }
}
