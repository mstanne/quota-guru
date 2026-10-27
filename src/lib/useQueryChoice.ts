// A choice kept in the page URL (?mercato=uo) without reloading or re-routing the page, so a filtered view can be
// bookmarked or shared. The pre-rendered HTML always shows the default: the URL is read only after hydration,
// which keeps server and client markup identical.
import { useCallback, useEffect, useState } from "react";

export function useQueryChoice<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const read = () => {
      const v = new URLSearchParams(window.location.search).get(key) as T | null;
      setValue(v && allowed.includes(v) ? v : fallback);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback]);

  const choose = useCallback(
    (v: T) => {
      setValue(v);
      const url = new URL(window.location.href);
      if (v === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, v);
      // keep react-router's history state, only the query string changes
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    },
    [key, fallback],
  );

  return [value, choose] as const;
}
