// Social preview images of the match pages: 1200×675 PNG (16:9, the format Google Discover and the social networks
// show large), drawn from the page data at build time. No club crests (they are trademarks): team names, date,
// the model's probabilities and, for finished matches, the result and whether the prediction was right.
//
// card = {
//   sport: "football" | "nba", competition, when ("Sabato 17 ottobre · 18:00"), home, away,
//   probs: [{ label, p }] (1/X/2 or the two teams), pick: { label, p } | null,
//   result: { home, away, hit: boolean | null } | null
// }
// Rendered once per distinct image: PNGs are cached by content hash in .cache/og (kept between workflow runs).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const FONTS = [
  path.join(here, "..", "assets", "fonts", "Sora-Regular.ttf"),
  path.join(here, "..", "assets", "fonts", "Sora-Bold.ttf"),
];
const LOGO = fs.readFileSync(path.join(root, "src", "assets", "brand", "quotaguru-logo-dark-bg.svg"), "utf8");
const LOGO_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO).toString("base64")}`;
const LOGO_RATIO = (() => {
  const vb = LOGO.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
  return vb ? Number(vb[1]) / Number(vb[2]) : 2.75;
})();

export const W = 1200;
export const H = 675;
const C = {
  bg: "#0f172a",
  bg2: "#020617",
  line: "#1e293b",
  text: "#ffffff",
  muted: "#94a3b8",
  soft: "#cbd5e1",
  predict: "#38bdf8",
  bar: "#334155",
  good: "#22c55e",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pc = (p) => `${Math.min(99, Math.max(1, Math.round(p * 100)))}%`;
/** Font size that fits `text` in `width` px (Sora is about 0.62 em per character at bold weight). */
const fit = (text, width, max) => Math.max(30, Math.min(max, Math.floor(width / (String(text).length * 0.7))));

export function cardSvg(card) {
  const { home, away } = card;
  // scoreboard: one line per team, the score (finished matches) at the right
  const nameW = card.result ? 860 : 1040;
  const size = Math.min(fit(home, nameW, 70), fit(away, nameW, 70));
  const team = (name, y, score) =>
    `<text x="80" y="${y}" font-size="${size}" font-weight="700" fill="${C.text}">${esc(name)}</text>` +
    (score != null
      ? `<text x="${W - 80}" y="${y}" font-size="${size}" font-weight="700" fill="${C.text}" text-anchor="end">${score}</text>`
      : "");
  const teams = team(home, 268, card.result?.home) + team(away, 350, card.result?.away);

  // probability bar
  const barX = 80;
  const barW = W - 160;
  const barY = 400;
  const top = card.probs.reduce((b, x, i) => (x.p > card.probs[b].p ? i : b), 0);
  let x = barX;
  const segs = card.probs
    .map((o, i) => {
      const w = Math.max(70, barW * o.p);
      return { o, i, w };
    })
    .map((s, _, all) => ({ ...s, w: (s.w / all.reduce((a, b) => a + b.w, 0)) * barW }))
    .map(({ o, i, w }) => {
      const sx = x;
      x += w;
      const fill = i === top ? C.predict : C.bar;
      const color = i === top ? C.bg2 : C.text;
      return (
        `<rect x="${sx + (i ? 3 : 0)}" y="${barY}" width="${w - (i ? 3 : 0)}" height="64" rx="10" fill="${fill}"/>` +
        `<text x="${sx + w / 2}" y="${barY + 43}" font-size="30" font-weight="700" fill="${color}" text-anchor="middle">${pc(o.p)}</text>` +
        `<text x="${sx + w / 2}" y="${barY + 100}" font-size="22" fill="${C.muted}" text-anchor="middle">${esc(o.label)}</text>`
      );
    })
    .join("");

  const pickText = `${card.result ? "Esito indicato prima della partita" : "Esito più probabile"}: ${card.pick?.label} (${card.pick ? pc(card.pick.p) : ""})`;
  const pickSize = fit(pickText, W - 160, 30);
  const pickLine = card.pick
    ? `<text x="80" y="596" font-size="${pickSize}" fill="${C.soft}">${card.result ? "Esito indicato prima della partita" : "Esito più probabile"}: <tspan font-weight="700" fill="${C.predict}">${esc(card.pick.label)}</tspan> <tspan fill="${C.muted}">(${pc(card.pick.p)})</tspan></text>`
    : "";
  const verdict =
    card.result && card.result.hit != null
      ? `<rect x="${W - 80 - 290}" y="166" width="290" height="44" rx="10" fill="${card.result.hit ? "#14532d" : C.line}"/>` +
        `<text x="${W - 80 - 145}" y="196" font-size="22" font-weight="700" fill="${card.result.hit ? C.good : C.soft}" text-anchor="middle">Pronostico ${card.result.hit ? "corretto" : "non corretto"}</text>`
      : "";

  const logoH = 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Sora">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}"/><stop offset="1" stop-color="${C.bg2}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${C.predict}"/>
  <image href="${LOGO_URI}" x="72" y="44" width="${Math.round(logoH * LOGO_RATIO)}" height="${logoH}"/>
  <text x="${W - 80}" y="76" font-size="26" font-weight="700" fill="${C.soft}" text-anchor="end">${esc(card.competition)}</text>
  <text x="${W - 80}" y="112" font-size="24" fill="${C.muted}" text-anchor="end">${esc(card.when)}</text>
  <text x="80" y="196" font-size="26" fill="${C.muted}">${card.result ? "Risultato e pronostico" : "Pronostico"}</text>
  ${teams}
  ${segs}
  ${pickLine}
  ${verdict}
  <text x="80" y="648" font-size="18" fill="${C.muted}">Probabilità di un modello statistico, non quote né consigli di gioco · 18+ · quotaguru.it</text>
</svg>`;
}

/**
 * Writes the PNG of `card` into `distDir/og/partite/<hash>.png` (from the cache when it was already drawn) and
 * returns its site path, e.g. "/og/partite/3f2a….png".
 */
export function writeCard(card, distDir, cacheDir) {
  const svg = cardSvg(card);
  const hash = crypto.createHash("sha1").update(svg).digest("hex").slice(0, 16);
  const rel = `og/partite/${hash}.png`;
  const out = path.join(distDir, rel);
  if (fs.existsSync(out)) return `/${rel}`;
  const cached = path.join(cacheDir, `${hash}.png`);
  let png;
  if (fs.existsSync(cached)) png = fs.readFileSync(cached);
  else {
    png = new Resvg(svg, {
      fitTo: { mode: "width", value: W },
      font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Sora" },
    })
      .render()
      .asPng();
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cached, png);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, png);
  return `/${rel}`;
}
