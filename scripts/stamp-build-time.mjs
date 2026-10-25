// Writes the build time to .cache/build-time.txt (git-ignored) at the start of `npm run build`.
// The data scripts and both Vite builds (browser + pre-render) read it, so every page of one build decides
// "upcoming / live / result pending" against the same moment and the pre-rendered HTML matches the browser.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TIME_FILE } from "../src/lib/eventTiming.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, BUILD_TIME_FILE);
const now = new Date().toISOString();
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, now + "\n");
console.log(`Ora di build: ${now}`);
