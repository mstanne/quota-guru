// Sets <title> and meta description for pages whose metadata is computed from data (e.g. football matches).
import { useEffect } from "react";
import { fullTitle, snippet } from "../routes";

export function usePageMeta(meta: { title: string; description: string } | null | undefined) {
  useEffect(() => {
    if (!meta) return;
    document.title = fullTitle({ path: location.pathname, title: meta.title });
    document.querySelector('meta[name="description"]')?.setAttribute("content", snippet(meta.description));
  }, [meta?.title, meta?.description]);
}
