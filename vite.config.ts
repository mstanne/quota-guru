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

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [react(), tailwindcss()],
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
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler|react-router)\//.test(id)) return "react";
          if (id.includes("node_modules/lucide-react/")) return "icons"; // one request instead of one per icon
        },
      },
    },
  },
});
