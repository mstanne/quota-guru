// Build step: writes a static HTML file for every route (dist/<path>/index.html) so each page
// has its own URL, <title>, description, structured data and content visible to search engines without JavaScript.
// Also writes 404.html (GitHub Pages fallback), robots.txt and the sitemaps (sitemap.xml is an index of
// sitemap-pagine.xml and sitemap-partite.xml).
//
// Between builds it keeps a small state in .cache/seo (restored by the GitHub workflow with actions/cache):
//   state.json   – for every URL a hash of its main content and the date it last changed (sitemap <lastmod>);
//   archive/     – the final HTML of every finished match page. When a match leaves the data window of the
//                  snapshot its page keeps being published from here (see src/lib/archive.tsx).
// Without the cache (first build, local build) every page gets today's date and only the matches in the data
// are archived: nothing breaks, the history simply starts from that build.
//
// Env:
//   BASE_PATH      – same value used by Vite (e.g. "/quota-guru/"), default "/"
//   SITE_URL       – public origin + base, e.g. "https://www.quotaguru.it" (optional;
//                    needed for canonical URLs, structured data and the sitemap)
//   SEO_CACHE_DIR  – where the state is kept, default .cache/seo
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");
const cacheDir = path.resolve(root, process.env.SEO_CACHE_DIR ?? path.join(".cache", "seo"));
const stateFile = path.join(cacheDir, "state.json");
const archiveDir = path.join(cacheDir, "archive");

const base = (process.env.BASE_PATH ?? "/").replace(/\/?$/, "/"); // always ends with "/"
const basename = base.replace(/\/$/, ""); // "" or "/quota-guru"
const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);

const { render, routes, notFoundMeta, fullTitle, preloadAllPages, site } = await import(pathToFileURL(ssrEntry).href);
// lazy page chunks must be loaded before rendering synchronously with renderToString
await preloadAllPages();
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const publicUrl = (p) => (siteUrl ? `${siteUrl}${p === "/" ? "/" : `${p}/`}` : "");
/** URL the page is served at (GitHub Pages: "/calcio/" for dist/calcio/index.html). */
const pageUrl = (p) => basename + (p === "/" ? "/" : `${p}/`);
/** Same rule as src/lib/links.tsx: internal links end with "/" (used on archived HTML saved by older builds). */
const slashLinks = (html) =>
  html.replace(/href="(\/[^"?#]*?)([?#][^"]*)?"/g, (all, p, rest = "") =>
    p === "/" || p.endsWith("/") || /\.[a-z0-9]{2,5}$/i.test(p) ? all : `href="${p}/${rest}"`,
  );
const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");

// ---------- state between builds ----------
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
const prevState = readJson(stateFile, { pages: {} });
const nextState = { updatedAt: new Date().toISOString(), pages: {} };

const archiveFile = (p) => path.join(archiveDir, `${sha1(p).slice(0, 20)}.json.gz`);
function readArchive(file) {
  try {
    return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
  } catch {
    return null;
  }
}
function writeArchive(entry) {
  fs.mkdirSync(archiveDir, { recursive: true });
  const file = archiveFile(entry.meta.path);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, zlib.gzipSync(JSON.stringify(entry), { level: 9 }));
  fs.renameSync(tmp, file);
}

// ---------- page content ----------
/** Inner HTML of <main>, without React's Suspense markers: the page itself, without header and footer. */
function mainContent(appHtml) {
  const m = appHtml.match(/<main[^>]*>([\s\S]*)<\/main>/);
  return m ? m[1].replace(/^<!--\$-->/, "").replace(/<!--\/\$-->$/, "") : appHtml;
}
/** Hash of the page content (inner HTML of <main>), minus parts that change at every build (data-volatile). */
const contentHash = (main) => sha1(main.replace(/<(p|span|time)\b[^>]*\bdata-volatile=""[^>]*>[\s\S]*?<\/\1>/g, ""));

const decode = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** BreadcrumbList from the visible trail (<nav aria-label="Percorso">), so the two always match. */
function breadcrumb(appHtml, pagePath) {
  const nav = appHtml.match(/<nav aria-label="Percorso"[^>]*>([\s\S]*?)<\/nav>/);
  if (!nav) return null;
  const items = [];
  for (const m of nav[1].matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = m[1].startsWith(basename) ? m[1].slice(basename.length) || "/" : m[1];
    items.push({ name: decode(m[2]), path: href });
  }
  // the current page is the last element of the trail and is not a link
  const tail = [...nav[1].matchAll(/<span\b(?![^>]*aria-hidden)[^>]*>([\s\S]*?)<\/span>/g)].pop();
  if (tail) items.push({ name: decode(tail[1]), path: pagePath });
  if (items.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.path })),
  };
}

const organization = () => ({
  "@type": "Organization",
  "@id": "/#organizzazione",
  name: site.name,
  url: "/",
  logo: "/icon-512.png",
  ...(site.email ? { email: site.email } : {}),
});
const website = () => ({
  "@type": "WebSite",
  "@id": "/#sito",
  url: "/",
  name: site.name,
  inLanguage: "it-IT",
  publisher: { "@id": "/#organizzazione" },
});

/** Site paths in the structured data ("/calcio/...", "/og/x.png", "/#id") become absolute URLs. */
const URL_KEYS = new Set(["@id", "url", "item", "image", "logo", "mainEntityOfPage"]);
function absolute(value) {
  if (!siteUrl || typeof value !== "string" || !value.startsWith("/")) return value;
  const [p, hash] = value.split("#");
  const isFile = /\.[a-z0-9]{2,5}$/i.test(p);
  return (isFile ? `${siteUrl}${p}` : publicUrl(p.replace(/\/+$/, "") || "/")) + (hash ? `#${hash}` : "");
}
function absolutize(node) {
  if (Array.isArray(node)) return node.map(absolutize);
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node).map(([k, v]) => [k, URL_KEYS.has(k) && typeof v === "string" ? absolute(v) : absolutize(v)]),
  );
}

function jsonLd(meta, appHtml) {
  if (meta.index === false) return "";
  const graph = [organization()];
  if (meta.path === "/") graph.push(website());
  const crumbs = breadcrumb(appHtml, meta.path);
  if (crumbs) graph.push(crumbs);
  graph.push(...(meta.jsonLd ?? []));
  const json = JSON.stringify(absolutize({ "@context": "https://schema.org", "@graph": graph }));
  // "<" is escaped so that the content can never close the script element
  return `<script type="application/ld+json">${json.replace(/</g, "\\u003c")}</script>`;
}

function ogImage(meta) {
  const img = meta.image;
  if (img && fs.existsSync(path.join(dist, img.path.slice(1)))) return img;
  return { path: "/og-image.png", width: 1200, height: 630 };
}

function page(meta, appHtml, { prerendered }) {
  const title = esc(fullTitle(meta));
  const desc = esc(meta.description);
  const canonical = publicUrl(meta.path);
  const img = ogImage(meta);
  const isArticle = (meta.jsonLd ?? []).some((n) => n["@type"] === "Article");
  const head = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    meta.index === false ? `<meta name="robots" content="noindex" />` : "",
    canonical && meta.index !== false ? `<link rel="canonical" href="${canonical}" />` : "",
    `<meta property="og:type" content="${isArticle ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="QuotaGuru" />`,
    `<meta property="og:locale" content="it_IT" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    canonical ? `<meta property="og:url" content="${canonical}" />` : "",
    siteUrl ? `<meta property="og:image" content="${siteUrl}${img.path}" />` : "",
    siteUrl ? `<meta property="og:image:width" content="${img.width}" />` : "",
    siteUrl ? `<meta property="og:image:height" content="${img.height}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    jsonLd(meta, appHtml),
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

// Two sitemaps under one index: evergreen pages (home, sections, competitions, standings, tennis, guides,
// information) and match pages, so that Search Console reports their indexing separately.
const sitemapPages = [];
const sitemapMatches = [];

/** Writes one page and records when its content last changed (`main`: the page content, see mainContent). */
function emit(meta, appHtml, main = mainContent(appHtml)) {
  const out = meta.path === "/" ? path.join(dist, "index.html") : path.join(dist, meta.path.slice(1), "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page(meta, appHtml, { prerendered: true }));
  const hash = contentHash(main);
  const prev = prevState.pages[meta.path];
  nextState.pages[meta.path] = { hash, lastmod: prev?.hash === hash ? prev.lastmod : today };
  if (meta.index !== false) {
    const isMatch = (meta.jsonLd ?? []).some((n) => n["@type"] === "SportsEvent");
    (isMatch ? sitemapMatches : sitemapPages).push(meta.path);
  }
}

// ---------- live pages (from the current data) ----------
const metaOnly = ({ path: p, title, description, index, jsonLd: ld, image }) => ({
  path: p,
  title,
  description,
  index,
  jsonLd: ld,
  image,
});
const live = new Set();
let archivedNow = 0;
for (const meta of routes) {
  const appHtml = render(pageUrl(meta.path), basename);
  emit(meta, appHtml);
  live.add(meta.path);
  if (meta.archive) {
    // finished match: keep its final page (refreshed while the match is still in the data)
    const html = mainContent(appHtml);
    const prev = readArchive(archiveFile(meta.path));
    if (prev?.html !== html || JSON.stringify(prev?.meta) !== JSON.stringify(metaOnly(meta))) {
      writeArchive({ meta: metaOnly(meta), html, savedAt: new Date().toISOString() });
    }
    archivedNow++;
  }
}

// ---------- archived pages (finished matches no longer in the data) ----------
let restored = 0;
let unreadable = 0;
if (fs.existsSync(archiveDir)) {
  for (const name of fs.readdirSync(archiveDir).filter((n) => n.endsWith(".json.gz"))) {
    const entry = readArchive(path.join(archiveDir, name));
    if (!entry?.meta?.path || typeof entry.html !== "string") {
      unreadable++;
      continue;
    }
    if (live.has(entry.meta.path)) continue;
    const appHtml = render(pageUrl(entry.meta.path), basename, slashLinks(entry.html));
    if (!appHtml.includes("data-archived-page")) {
      // the URL no longer leads to a match page (route renamed or removed): do not publish it
      unreadable++;
      continue;
    }
    // same hash as when the page was live: archiving alone does not change its lastmod
    emit(entry.meta, appHtml, entry.html);
    live.add(entry.meta.path);
    restored++;
  }
}

// GitHub Pages serves 404.html for unknown URLs; the client renders it from scratch.
fs.writeFileSync(
  path.join(dist, "404.html"),
  page(notFoundMeta, render(`${basename}/404`, basename), { prerendered: false }),
);

// ---------- sitemap and robots ----------
const XML = '<?xml version="1.0" encoding="UTF-8"?>';
const NS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
const lastmodOf = (p) => nextState.pages[p]?.lastmod ?? today;
if (siteUrl) {
  const files = [
    ["sitemap-pagine.xml", sitemapPages],
    ["sitemap-partite.xml", sitemapMatches],
  ].filter(([, list]) => list.length);
  for (const [file, list] of files) {
    const urls = list.map((p) => `  <url><loc>${publicUrl(p)}</loc><lastmod>${lastmodOf(p)}</lastmod></url>`).join("\n");
    fs.writeFileSync(path.join(dist, file), `${XML}\n<urlset ${NS}>\n${urls}\n</urlset>\n`);
  }
  const index = files
    .map(([file, list]) => {
      const newest = list.map(lastmodOf).sort().pop();
      return `  <sitemap><loc>${siteUrl}/${file}</loc><lastmod>${newest}</lastmod></sitemap>`;
    })
    .join("\n");
  fs.writeFileSync(path.join(dist, "sitemap.xml"), `${XML}\n<sitemapindex ${NS}>\n${index}\n</sitemapindex>\n`);
}
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ""}`,
);

fs.mkdirSync(cacheDir, { recursive: true });
fs.writeFileSync(stateFile, JSON.stringify(nextState) + "\n");
fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });

const changed = Object.values(nextState.pages).filter((p) => p.lastmod === today).length;
console.log(
  `prerender: ${routes.length} pagine dai dati + ${restored} partite archiviate + 404.html` +
    `${siteUrl ? ` + sitemap (${sitemapPages.length} pagine, ${sitemapMatches.length} partite)` : ""} (base "${base}")\n` +
    `  archivio: ${archivedNow} partite finite salvate/aggiornate${unreadable ? `, ${unreadable} voci ignorate` : ""}; ` +
    `pagine con data di modifica di oggi: ${changed}`,
);
