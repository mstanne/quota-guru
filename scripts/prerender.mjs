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
import { writeCard } from "./lib/og-cards.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");
const cacheDir = path.resolve(root, process.env.SEO_CACHE_DIR ?? path.join(".cache", "seo"));
const stateFile = path.join(cacheDir, "state.json");
const archiveDir = path.join(cacheDir, "archive");

const base = (process.env.BASE_PATH ?? "/").replace(/\/?$/, "/"); // always ends with "/"
const basename = base.replace(/\/$/, ""); // "" or "/quota-guru"
const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
const buildIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const today = buildIso.slice(0, 10);

const { render, routes, notFoundMeta, fullTitle, preloadAllPages, site, legacyTarget, rewriteLegacyLinks } = await import(
  pathToFileURL(ssrEntry).href
);
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

/** Element marked data-faq="q"|"a" starting at `start`: its inner HTML, closing tag found by counting same-name tags. */
function elementAt(html, start) {
  const tag = html.slice(start).match(/^<([a-z0-9]+)/i)?.[1];
  if (!tag) return "";
  const open = html.indexOf(">", start) + 1;
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  re.lastIndex = open;
  let depth = 1;
  for (let m; (m = re.exec(html)); ) {
    if (m[0].endsWith("/>")) continue;
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index);
  }
  return "";
}

/**
 * FAQPage from the questions visible on the page (elements marked data-faq="q" and data-faq="a", in pairs),
 * so the structured data always matches the text. Pages that already declare a FAQPage (guides) are skipped.
 */
function faqPage(meta, appHtml) {
  if ((meta.jsonLd ?? []).some((n) => n["@type"] === "FAQPage")) return null;
  const main = mainContent(appHtml);
  const items = [];
  let question = null;
  for (const m of main.matchAll(/<[a-z0-9]+\b[^>]*\bdata-faq="(q|a)"[^>]*>/gi)) {
    const text = decode(elementAt(main, m.index));
    if (!text) continue;
    if (m[1] === "q") question = text;
    else if (question) {
      items.push({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text } });
      question = null;
    }
  }
  return items.length ? { "@type": "FAQPage", mainEntity: items } : null;
}

/**
 * Article for the match and event pages (meta.article): an analysis with its author and real dates. Published = first
 * build that produced the page, modified = last build that changed its content (state between builds, see emit).
 */
function article(meta, dates) {
  if (!meta.article || !dates) return null;
  const img = ogImage(meta);
  return {
    "@type": "Article",
    "@id": `${meta.path}#articolo`,
    mainEntityOfPage: meta.path,
    headline: meta.article.headline,
    description: meta.description,
    inLanguage: "it-IT",
    articleSection: meta.article.section,
    image: { "@type": "ImageObject", url: img.path, width: img.width, height: img.height },
    datePublished: dates.published,
    dateModified: dates.modified,
    author: { "@type": "Person", name: site.company, url: "/chi-siamo" },
    publisher: { "@id": "/#organizzazione" },
    ...((meta.jsonLd ?? []).some((n) => n["@type"] === "SportsEvent") ? { about: { "@id": `${meta.path}#evento` } } : {}),
  };
}

function jsonLd(meta, appHtml, dates) {
  if (meta.index === false) return "";
  const graph = [organization()];
  if (meta.path === "/") graph.push(website());
  const crumbs = breadcrumb(appHtml, meta.path);
  if (crumbs) graph.push(crumbs);
  graph.push(...(meta.jsonLd ?? []));
  const art = article(meta, dates);
  if (art) graph.push(art);
  const faq = faqPage(meta, appHtml);
  if (faq) graph.push(faq);
  const json = JSON.stringify(absolutize({ "@context": "https://schema.org", "@graph": graph }));
  // "<" is escaped so that the content can never close the script element
  return `<script type="application/ld+json">${json.replace(/</g, "\\u003c")}</script>`;
}

function ogImage(meta) {
  const img = meta.image;
  if (img && fs.existsSync(path.join(dist, img.path.slice(1)))) return img;
  return { path: "/og-image.png", width: 1200, height: 630 };
}

function page(meta, appHtml, { prerendered, dates = null }) {
  const title = esc(fullTitle(meta));
  const desc = esc(meta.description);
  // a dated match page whose evergreen page shows the same match points its canonical there
  const canonical = publicUrl(meta.canonical ?? meta.path);
  const img = ogImage(meta);
  const isArticle = (meta.jsonLd ?? []).some((n) => n["@type"] === "Article");
  const head = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    // large previews in Google Search and Discover
    meta.index === false
      ? `<meta name="robots" content="noindex" />`
      : `<meta name="robots" content="max-image-preview:large" />`,
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
    jsonLd(meta, appHtml, dates),
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
/** Indexable pages that are new or whose content changed in this build (sent to IndexNow after the deploy). */
const changedNow = [];

const outFile = (p) => (p === "/" ? path.join(dist, "index.html") : path.join(dist, p.slice(1), "index.html"));

/**
 * Moved URL (src/lib/legacyUrls.ts). GitHub Pages cannot send a 301, so the old URL gets a small page with the
 * canonical of the new one and an immediate redirect (meta refresh 0 + location.replace), which search engines
 * treat as a permanent move. Not in the sitemap.
 */
const bridges = [];
function emitBridge(from, to, title) {
  const target = pageUrl(to);
  const abs = publicUrl(to) || target;
  const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <title>${esc(title)} | QuotaGuru</title>
    <link rel="canonical" href="${abs}" />
    <meta http-equiv="refresh" content="0; url=${abs}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <p>Questa pagina si è spostata: <a href="${target}">${esc(title)}</a>.</p>
    <script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script>
  </body>
</html>
`;
  fs.mkdirSync(path.dirname(outFile(from)), { recursive: true });
  fs.writeFileSync(outFile(from), html);
  bridges.push(from);
}

// 16:9 social images of the match pages (scripts/lib/og-cards.mjs), cached between builds next to the SEO state
const ogCacheDir = path.join(cacheDir, "..", "og");
let cards = 0;
const usedCards = new Set();
/** Draws the page's card (if any) and makes it the page image, also in its SportsEvent. */
function withCard(meta) {
  if (!meta.card) return meta;
  const image = { path: writeCard(meta.card, dist, ogCacheDir), width: 1200, height: 675 };
  cards++;
  usedCards.add(path.basename(image.path));
  const jsonLd = (meta.jsonLd ?? []).map((n) => (n["@type"] === "SportsEvent" ? { ...n, image: image.path } : n));
  return { ...meta, image, jsonLd };
}

/** Writes one page and records when its content last changed (`main`: the page content, see mainContent). */
function emit(meta0, appHtml, main = mainContent(appHtml)) {
  const meta = withCard(meta0);
  const out = outFile(meta.path);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const hash = contentHash(main);
  const prev = prevState.pages[meta.path];
  const same = prev?.hash === hash;
  // full timestamps for the Article dates; pages known only from older states get the day of their last change
  const prevModified = prev ? (prev.modified ?? `${prev.lastmod}T00:00:00Z`) : null;
  const entry = {
    hash,
    lastmod: same ? prev.lastmod : today,
    published: prev?.published ?? prevModified ?? buildIso,
    modified: same ? prevModified : buildIso,
  };
  nextState.pages[meta.path] = entry;
  fs.writeFileSync(out, page(meta, appHtml, { prerendered: true, dates: entry }));
  // only canonical pages go to the sitemap and to IndexNow
  const indexable = meta.index !== false && (!meta.canonical || meta.canonical === meta.path);
  if (prev?.hash !== hash && indexable) changedNow.push(meta.path);
  if (indexable) {
    const isMatch = meta.event || (meta.jsonLd ?? []).some((n) => n["@type"] === "SportsEvent");
    (isMatch ? sitemapMatches : sitemapPages).push(meta.path);
  }
}

// ---------- live pages (from the current data) ----------
const metaOnly = ({ path: p, title, description, index, jsonLd: ld, image, event, article: art, card }) => ({
  ...(event ? { event } : {}),
  ...(art ? { article: art } : {}),
  ...(card ? { card } : {}),
  path: p,
  title,
  description,
  index,
  jsonLd: ld,
  image,
});
// (an archived page is final: it has no `canonical` to another URL)
const live = new Set();
let archivedNow = 0;
for (const meta of routes) {
  if (meta.redirect) {
    emitBridge(meta.path, meta.redirect, meta.title);
    live.add(meta.path);
    continue;
  }
  const appHtml = render(pageUrl(meta.path), basename);
  emit(meta, appHtml);
  live.add(meta.path);
  if (meta.archive && appHtml.includes("data-not-found")) {
    // the route list and the page data disagree: never store a "page not found" over a good archived copy
    console.warn(`prerender: ${meta.path} non trovata nei dati della pagina, archivio non aggiornato`);
  } else if (meta.archive) {
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
    // archived under a URL that has moved since (old round pages): publish a bridge to the new URL
    const moved = legacyTarget(entry.meta.path);
    if (moved) {
      emitBridge(entry.meta.path, moved, entry.meta.title);
      live.add(entry.meta.path);
      restored++;
      continue;
    }
    // links saved by older builds point at moved URLs: rewrite them to the new ones
    const stored = slashLinks(rewriteLegacyLinks(entry.html));
    const appHtml = render(pageUrl(entry.meta.path), basename, stored);
    if (!appHtml.includes("data-archived-page")) {
      // the URL no longer leads to a match page (route renamed or removed): do not publish it
      unreadable++;
      continue;
    }
    // same hash as when the page was live: archiving alone does not change its lastmod
    emit(entry.meta, appHtml, stored === slashLinks(entry.html) ? entry.html : stored);
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
// Full W3C timestamp of the last real change (the site is rebuilt every 3 hours: a match page that gets its
// prediction or line-ups in the afternoon must look newer than the version crawled in the morning). Pages known
// only from older states, without the time, keep their day at midnight UTC.
const lastmodOf = (p) => nextState.pages[p]?.modified ?? buildIso;
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
// AI search and assistant crawlers are named explicitly: the site wants to be read and cited by them.
// (Allowed anyway by "User-agent: *"; listing them makes the choice visible and survives future rules for "*".)
const AI_CRAWLERS = [
  "OAI-SearchBot", // ChatGPT search
  "ChatGPT-User", // pages opened by ChatGPT on a user's request
  "GPTBot", // OpenAI training
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended", // Gemini and Google AI products
  "Applebot-Extended",
  "Amazonbot",
  "CCBot", // Common Crawl, used by many models
  "meta-externalagent",
  "MistralAI-User",
  "DuckAssistBot",
];
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  [
    "User-agent: *",
    "Allow: /",
    "",
    ...AI_CRAWLERS.map((ua) => `User-agent: ${ua}`),
    "Allow: /",
    "",
    siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : "",
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n") + "\n",
);

fs.mkdirSync(cacheDir, { recursive: true });
// URLs for IndexNow (scripts/indexnow.mjs runs after the deploy): only what is new or changed in this build.
if (siteUrl) fs.writeFileSync(path.join(cacheDir, "indexnow-urls.txt"), changedNow.map(publicUrl).join("\n") + "\n");

// drop cached images no page uses any more (old matches whose card changed), so the cache does not grow forever
if (fs.existsSync(ogCacheDir))
  for (const f of fs.readdirSync(ogCacheDir)) if (!usedCards.has(f)) fs.rmSync(path.join(ogCacheDir, f));

fs.mkdirSync(cacheDir, { recursive: true });
fs.writeFileSync(stateFile, JSON.stringify(nextState) + "\n");
fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });

const changed = Object.values(nextState.pages).filter((p) => p.lastmod === today).length;
console.log(
  `prerender: ${routes.filter((r) => !r.redirect).length} pagine dai dati + ${restored} partite archiviate + ${bridges.length} URL spostati (reindirizzati) + 404.html, ${cards} immagini partita` +
    `${siteUrl ? ` + sitemap (${sitemapPages.length} pagine, ${sitemapMatches.length} partite)` : ""} (base "${base}")\n` +
    `  archivio: ${archivedNow} partite finite salvate/aggiornate${unreadable ? `, ${unreadable} voci ignorate` : ""}; ` +
    `pagine con data di modifica di oggi: ${changed}; nuove o cambiate in questa build: ${changedNow.length}`,
);
