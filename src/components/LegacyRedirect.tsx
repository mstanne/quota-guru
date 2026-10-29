// Old URL moved by the URL schema (src/lib/legacyUrls.ts): the browser goes straight to the new one.
// Pre-rendered visits never get here (the old URL is a static bridge page); this covers links inside the app
// and the dev server.
import { Navigate, useLocation } from "react-router";
import { legacyTarget } from "../lib/legacyUrls";
import { withSlash } from "../lib/links";
import { NotFoundPage } from "./NotFoundPage";

export function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = legacyTarget(pathname);
  if (!target) return <NotFoundPage />;
  return <Navigate replace to={`${withSlash(target)}${search}${hash}`} />;
}
