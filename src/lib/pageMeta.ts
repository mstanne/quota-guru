// Sets <title> and meta description for pages whose metadata is computed from data (e.g. football matches).
import { useEffect } from "react";
import { SITE_NAME } from "../routes";

export function usePageMeta(meta: { title: string; description: string } | null | undefined) {
  useEffect(() => {
    if (!meta) return;
    document.title = `${meta.title} | ${SITE_NAME}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  }, [meta?.title, meta?.description]);
}
