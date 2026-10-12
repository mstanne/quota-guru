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
        // keep third-party code in a separate, long-cacheable chunk
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
});
