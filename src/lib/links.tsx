// Internal links always point at the canonical URL of a page, which ends with "/" (each page is published as
// <path>/index.html and its canonical is https://www.quotaguru.it/<path>/). Without the slash every internal link
// would go through a 301 redirect of GitHub Pages. Use these instead of Link / NavLink from react-router.
import { forwardRef } from "react";
import { Link as RouterLink, NavLink as RouterNavLink, type LinkProps, type NavLinkProps, type To } from "react-router";

/** "/calcio" → "/calcio/", "/guide/x#faq" → "/guide/x/#faq"; root, files ("/og.png") and relative paths unchanged. */
export function withSlash(href: string): string {
  if (!href.startsWith("/")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? "" : href.slice(cut);
  if (path === "/" || path.endsWith("/") || /\.[a-z0-9]{2,5}$/i.test(path)) return href;
  return `${path}/${rest}`;
}

const slashTo = (to: To): To =>
  typeof to === "string" ? withSlash(to) : to.pathname ? { ...to, pathname: withSlash(to.pathname) } : to;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  return <RouterLink ref={ref} to={slashTo(to)} {...rest} />;
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, ...rest }, ref) {
  return <RouterNavLink ref={ref} to={slashTo(to)} {...rest} />;
});
