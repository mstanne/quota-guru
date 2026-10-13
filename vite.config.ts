import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/quota-guru/").
// Locally and on custom domains it defaults to "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
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
