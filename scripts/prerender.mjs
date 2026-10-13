// Build step: writes a static HTML file for every route (dist/<path>/index.html) so each page
// has its own URL, <title>, description and content visible to search engines without JavaScript.
// Also writes 404.html (GitHub Pages fallback), sitemap.xml and robots.txt.
//
// Env:
//   BASE_PATH  – same value used by Vite (e.g. "/quota-guru/"), default "/"
//   SITE_URL   – public origin + base, e.g. "https://mstanne.github.io/quota-guru" (optional;
//                needed for canonical URLs and the sitemap)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

const base = (process.env.BASE_PATH ?? "/").replace(/\/?$/, "/"); // always ends with "/"
const basename = base.replace(/\/$/, ""); // "" or "/quota-guru"
const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");

const { render, routes, notFoundMeta, fullTitle, preloadAllPages } = await import(pathToFileURL(ssrEntry).href);
// lazy page chunks must be loaded before rendering synchronously with renderToString
await preloadAllPages();
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const publicUrl = (p) => (siteUrl ? `${siteUrl}${p === "/" ? "/" : `${p}/`}` : "");

function page(meta, url, { prerendered }) {
  const appHtml = render(url, basename);
  const title = esc(fullTitle(meta));
  const desc = esc(meta.description);
  const canonical = publicUrl(meta.path);
  const head = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    meta.index === false ? `<meta name="robots" content="noindex" />` : "",
    canonical && meta.index !== false ? `<link rel="canonical" href="${canonical}" />` : "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Quota Guru" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    canonical ? `<meta property="og:url" content="${canonical}" />` : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta name="description"[^>]*>\s*/, "")
    .replace("</head>", `  ${head}\n  </head>`)
    .replace(
      '<div id="root"><!--app-html--></div>',
      `<div id="root" data-prerendered="${prerendered}">${appHtml}</div>`,
    );
}

let count = 0;
for (const meta of routes) {
  const out = meta.path === "/" ? path.join(dist, "index.html") : path.join(dist, meta.path.slice(1), "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page(meta, basename + meta.path, { prerendered: true }));
  count++;
}

// GitHub Pages serves 404.html for unknown URLs; the client renders it from scratch.
fs.writeFileSync(path.join(dist, "404.html"), page(notFoundMeta, `${basename}/404`, { prerendered: false }));

const indexable = routes.filter((r) => r.index !== false);
if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = indexable
    .map((r) => `  <url><loc>${publicUrl(r.path)}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n");
  fs.writeFileSync(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
}
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ""}`,
);

fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`prerender: ${count} pagine + 404.html${siteUrl ? " + sitemap.xml" : ""} (base "${base}")`);
