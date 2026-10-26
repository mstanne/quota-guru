// Tells the search engines that support IndexNow (Bing, which ChatGPT search relies on, plus Yandex, Seznam,
// Naver and others) which pages are new or changed, right after the deploy, instead of waiting for the next crawl.
// Reads the list written by scripts/prerender.mjs (.cache/seo/indexnow-urls.txt). Never fails the workflow.
//
// The key is public by design: the engines check it at https://www.quotaguru.it/<key>.txt (file in public/).
// To change it: create a new public/<key>.txt containing only the key, update INDEXNOW_KEY, delete the old file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INDEXNOW_KEY = "ce61d3d2d9357d356d6c9d492ee9e0f8";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = (process.env.SITE_URL ?? "https://www.quotaguru.it").replace(/\/$/, "");
const listFile = path.resolve(root, process.env.SEO_CACHE_DIR ?? path.join(".cache", "seo"), "indexnow-urls.txt");
const MAX = 10000; // IndexNow limit per request

let urls = [];
try {
  urls = fs.readFileSync(listFile, "utf8").split("\n").map((u) => u.trim()).filter((u) => u.startsWith(siteUrl));
} catch {
  console.log("indexnow: nessuna lista di URL, niente da inviare");
  process.exit(0);
}
if (!urls.length) {
  console.log("indexnow: nessuna pagina nuova o cambiata");
  process.exit(0);
}

const host = new URL(siteUrl).host;
let sent = 0;
for (let i = 0; i < urls.length; i += MAX) {
  const urlList = urls.slice(i, i + MAX);
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    // 200 = accepted, 202 = accepted, key still to be verified
    console.log(`indexnow: ${urlList.length} URL inviati, risposta ${res.status}`);
    if (res.ok) sent += urlList.length;
  } catch (e) {
    console.log(`indexnow: invio non riuscito (${e.message})`);
  }
}
console.log(`indexnow: ${sent} di ${urls.length} URL accettati`);
