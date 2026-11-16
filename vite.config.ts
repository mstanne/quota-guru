import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { readBuildTime } from "./scripts/lib/build-time.mjs";

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/quota-guru/").
// Locally and on custom domains it defaults to "/".
// One reference time for the whole build (browser bundle and pre-render): matches past their expected end
// are shown as "result pending" even if the data source still lists them as scheduled or live.
const buildTime = readBuildTime(__dirname);

// The build time reaches the browser through a <meta> of index.html, not through the JavaScript: a constant compiled
// into the code changed ~90 of the ~630 chunk names at every build (every 15 minutes during matches), and Googlebot
// spent two thirds of its crawl requests downloading the renamed JavaScript (Search Console, November 2026). The
// pre-render (SSR bundle) keeps the compiled constant. Read by referenceTime in src/lib/footballCore.ts.
const buildTimeMeta = {
  name: "build-time-meta",
  transformIndexHtml: (html: string) =>
    html.replace("</head>", `  <meta name="qg-build-time" content="${buildTime}" />\n  </head>`),
};

/** Data files (src/data/**.json): chunk "qgdata-<path with dashes>", see chunkFileNames below. */
const DATA_PREFIX = "qgdata-";
const dataDir = path.resolve(__dirname, "src", "data") + path.sep;
function dataChunk(id: string) {
  const file = id.split("?")[0];
  if (!file.startsWith(dataDir) || !file.endsWith(".json")) return null;
  return DATA_PREFIX + file.slice(dataDir.length, -".json".length).split(path.sep).join("-");
}

export default defineConfig(({ isSsrBuild }) => ({
  base: process.env.BASE_PATH ?? "/",
  define: isSsrBuild ? { __BUILD_TIME__: JSON.stringify(buildTime) } : {},
  plugins: [react(), tailwindcss(), buildTimeMeta],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    target: "es2020",
    rollupOptions: {
      output: {
        // React + router in a long-cacheable chunk shared by every page; other libraries
        // (Radix, react-hook-form, lucide icons) are split per page by Vite automatically.
        // Browser build: every data file of src/data in its own chunk with a fixed name (dati-js/<file>.js, revalidated
        // at every visit: public/_headers). The data change at every build; with a hash in their names, the names of
        // the ~90 code chunks that import them changed too, and Googlebot downloaded them again every time.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler|react-router)\//.test(id)) return "react";
          if (id.includes("node_modules/lucide-react/")) return "icons"; // one request instead of one per icon
          if (!isSsrBuild) {
            const data = dataChunk(id);
            if (data) return data;
          }
        },
        ...(isSsrBuild
          ? {}
          : {
              chunkFileNames: (chunk: { name: string }) =>
                chunk.name.startsWith(DATA_PREFIX) ? `dati-js/${chunk.name.slice(DATA_PREFIX.length)}.js` : "assets/[name]-[hash].js",
            }),
      },
    },
  },
}));
