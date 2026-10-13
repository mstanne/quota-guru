// T1: route-level code splitting that stays compatible with pre-rendering and hydration.
//
// `lazyPage()` wraps a dynamic import. The page's JS chunk is downloaded only when needed, but it can also be
// *preloaded*: the pre-render script preloads every page before rendering, and the browser preloads the page of
// the current URL before hydrating. A preloaded page renders synchronously, so the server HTML and the first
// client render match exactly. Pages reached later by client-side navigation load on demand (Suspense).
import { lazy, type ComponentType } from "react";

type Loader<P> = () => Promise<ComponentType<P>>;

interface Entry {
  load: () => Promise<unknown>;
}
const registry: Entry[] = [];

export interface LazyPage<P> {
  (props: P): JSX.Element;
  preload: () => Promise<unknown>;
}

export function lazyPage<P extends object = Record<string, never>>(loader: Loader<P>): LazyPage<P> {
  let loaded: ComponentType<P> | undefined;
  let promise: Promise<ComponentType<P>> | undefined;
  const load = () =>
    (promise ??= loader().then((c) => {
      loaded = c;
      return c;
    }));
  const Lazy = lazy(() => load().then((c) => ({ default: c })));
  const Page = ((props: P) => {
    const C = loaded;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return C ? <C {...props} /> : <Lazy {...(props as any)} />;
  }) as LazyPage<P>;
  Page.preload = load;
  registry.push({ load });
  return Page;
}

/** Loads every lazy page (used at build time before rendering static HTML). */
export const preloadAllPages = () => Promise.all(registry.map((e) => e.load()));
