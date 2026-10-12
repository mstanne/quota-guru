import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "./styles/globals.css";

// Vite's BASE_URL ends with "/" (e.g. "/quota-guru/"); the router wants it without the trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

const app = (
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

const root = document.getElementById("root")!;
// Pre-rendered pages are hydrated; the 404 fallback (and `npm run dev`) render from scratch.
if (root.hasChildNodes() && root.dataset.prerendered === "true") hydrateRoot(root, app);
else createRoot(root).render(app);
