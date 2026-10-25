// Reads the build time written by scripts/stamp-build-time.mjs. Falls back to "now" when the stamp is
// missing or older than BUILD_TIME_MAX_AGE_MS (e.g. `npm run dev` or a script run on its own).
import fs from "node:fs";
import path from "node:path";
import { BUILD_TIME_FILE, BUILD_TIME_MAX_AGE_MS } from "../../src/lib/eventTiming.mjs";

/** @param {string} root project folder @returns {string} ISO timestamp */
export function readBuildTime(root) {
  try {
    const iso = fs.readFileSync(path.join(root, BUILD_TIME_FILE), "utf8").trim();
    const t = Date.parse(iso);
    if (Number.isFinite(t) && Math.abs(Date.now() - t) < BUILD_TIME_MAX_AGE_MS) return new Date(t).toISOString();
  } catch {
    // no stamp: use the current time
  }
  return new Date().toISOString();
}
