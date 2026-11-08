// Images of the Telegram channel posts: one card per rubric, 1080×1350 PNG (4:5, the largest format Telegram shows
// without cropping in the feed), drawn as SVG and rendered with resvg like the match preview images (scripts/lib/og-cards.mjs).
// Look of the site's guide illustrations (scripts/generate-guide-images.py): navy background with dots and orange/green
// glows, #16243B panels, Sora (the logo font). No club crests (trademarks), no operator names, no betting imagery.
//
// renderCard(card) → { png: Buffer, svg: string, text: string (every word on the card, for the compliance filter) }
// card = { type, ... } built by the rubrics (scripts/telegram/rubriche.mjs); one layout per type below.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const FONT_FILES = ["Sora-Regular.ttf", "Sora-Bold.ttf"].map((f) => path.join(root, "scripts", "assets", "fonts", f));
const METRICS = JSON.parse(fs.readFileSync(path.join(here, "sora-metrics.json"), "utf8"));
const LOGO = fs.readFileSync(path.join(root, "src", "assets", "brand", "quotaguru-logo-dark-bg.svg"), "utf8");
const LOGO_RATIO = (() => {
  const vb = LOGO.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
  return vb ? Number(vb[1]) / Number(vb[2]) : 2.75;
})();
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export const W = 1080;
export const H = 1350;
const M = 64; // side margin
const TOP = 300; // first content line
const BOTTOM = 1226; // last content line (footer below)

const C = {
  navy: "#0F1A2C",
  deep: "#0A1220",
  panel: "#16243B",
  panel2: "#1E2F4A",
  line: "#2A3D59",
  light: "#EEF0F3",
  grey: "#BECED8",
  muted: "#7F93AE",
  orange: "#FB6801",
  green: "#06BA55",
  amber: "#FBBF24",
  red: "#E5484D",
};

// ---------------------------------------------------------------------------------------------- text
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
/** Width in px of `s` in Sora at `size` (weight 400 or 700). */
export function textWidth(s, size, weight = 700) {
  const m = METRICS[weight >= 600 ? "700" : "400"];
  let w = 0;
  for (const ch of String(s)) w += m[ch] ?? 0.62;
  return w * size;
}
/** `s` cut with an ellipsis to fit `max` px. */
function clip(s, size, weight, max) {
  s = String(s ?? "");
  if (!max || textWidth(s, size, weight) <= max) return s;
  while (s.length > 1 && textWidth(`${s}…`, size, weight) > max) s = s.slice(0, -1).trimEnd();
  return `${s}…`;
}
/** Largest size ≤ `size` (≥ `min`) at which `s` fits `max` px. */
const fitSize = (s, size, weight, max, min = 20) => {
  while (size > min && textWidth(s, size, weight) > max) size -= 1;
  return size;
};
/** Words of `s` in lines of at most `max` px; at most `maxLines` (the last one cut with an ellipsis). */
function wrap(s, size, weight, max, maxLines = 99) {
  const lines = [];
  let cur = "";
  for (const word of String(s).split(/\s+/)) {
    const next = cur ? `${cur} ${word}` : word;
    if (textWidth(next, size, weight) <= max || !cur) cur = next;
    else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = clip(`${kept[maxLines - 1]} ${lines[maxLines]}`, size, weight, max);
    if (!kept[maxLines - 1].endsWith("…")) kept[maxLines - 1] = clip(`${kept[maxLines - 1]}……`, size, weight, max);
    return kept;
  }
  return lines;
}

/** Every word written on the card (for the compliance filter). */
let words = [];
function text(x, y, s, { size = 30, weight = 700, fill = C.light, anchor = "start", max, opacity, spacing } = {}) {
  const t = clip(s, size, weight, max);
  words.push(t);
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${opacity ? ` fill-opacity="${opacity}"` : ""}${spacing ? ` letter-spacing="${spacing}"` : ""}>${esc(t)}</text>`;
}
const caps = (x, y, s, opts = {}) =>
  text(x, y, String(s).toUpperCase(), { size: 22, weight: 700, fill: C.orange, spacing: 2, ...opts });

// ---------------------------------------------------------------------------------------------- shapes
const rect = (x, y, w, h, { r = 24, fill = C.panel, stroke = C.line, sw = 2, opacity } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${opacity ? ` fill-opacity="${opacity}"` : ""}${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}/>`;
/** Pill with centred text; returns [svg, width]. `x` is its left edge (or right edge with align "end"). */
function pill(
  x,
  y,
  label,
  { size = 22, fill = C.panel2, color = C.light, stroke = C.line, h = 44, pad = 20, align = "start" } = {},
) {
  const w = textWidth(label, size, 700) + pad * 2;
  const left = align === "end" ? x - w : x;
  return [
    rect(left, y, w, h, { r: h / 2, fill, stroke }) +
      text(left + w / 2, y + h / 2 + size * 0.36, label, { size, fill: color, anchor: "middle" }),
    w,
  ];
}
const pct = (p) => `${Math.round(p * 100)}%`;
const dec = (n, d = 1) => n.toFixed(d).replace(".", ",");
const check = (cx, cy, color = C.green) =>
  `<circle cx="${cx}" cy="${cy}" r="20" fill="${color}"/><path d="M${cx - 9} ${cy}l6 6.5l12 -13" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (cx, cy) =>
  `<circle cx="${cx}" cy="${cy}" r="20" fill="${C.red}"/><path d="M${cx - 7.5} ${cy - 7.5}l15 15M${cx + 7.5} ${cy - 7.5}l-15 15" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`;

/** Three 1/X/2 chips (or two for NBA) ending at `right`; the most likely in green. */
function probChips(right, y, p, { w = 100, h = 56, gap = 10, labels = null, size = 26 } = {}) {
  const top = p.indexOf(Math.max(...p));
  let out = "";
  p.forEach((v, i) => {
    const x = right - (p.length - i) * w - (p.length - 1 - i) * gap;
    const on = i === top;
    out += rect(x, y, w, h, { r: 14, fill: on ? C.green : C.panel2, stroke: on ? null : C.line });
    if (labels) {
      out += text(x + 18, y + h / 2 + 7, labels[i], { size: 19, weight: 700, fill: on ? "#E6FFF0" : C.muted });
      out += text(x + w - 16, y + h / 2 + size * 0.36, pct(v), {
        size,
        weight: 700,
        fill: on ? "#ffffff" : C.light,
        anchor: "end",
      });
    } else
      out += text(x + w / 2, y + h / 2 + size * 0.36, pct(v), {
        size,
        weight: 700,
        fill: on ? "#ffffff" : C.light,
        anchor: "middle",
      });
  });
  return out;
}
/** "1  X  2" over a column of chips ending at `right`. */
function chipHeads(right, y, { w = 100, gap = 10, labels = ["1", "X", "2"] } = {}) {
  return labels
    .map((l, i) =>
      text(right - (labels.length - i) * w - (labels.length - 1 - i) * gap + w / 2, y, l, {
        size: 21,
        fill: C.muted,
        anchor: "middle",
      }),
    )
    .join("");
}
const chipsWidth = (n, w = 100, gap = 10) => n * w + (n - 1) * gap;

// ---------------------------------------------------------------------------------------------- frame
function frame(card, body) {
  const logoH = 74;
  const logoW = logoH * LOGO_RATIO;
  const [badge] = pill(W - M, 66, card.badge, {
    size: 20,
    fill: C.orange,
    color: "#ffffff",
    stroke: null,
    h: 46,
    pad: 22,
    align: "end",
  });
  const titleSize = fitSize(card.title, card.titleSize ?? 62, 700, W - 2 * M, 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.navy}"/><stop offset="1" stop-color="${C.deep}"/></linearGradient>
  <radialGradient id="glowO"><stop offset="0" stop-color="${C.orange}" stop-opacity=".20"/><stop offset="1" stop-color="${C.orange}" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowG"><stop offset="0" stop-color="${C.green}" stop-opacity=".15"/><stop offset="1" stop-color="${C.green}" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="${C.light}" fill-opacity=".06"/></pattern>
  <clipPath id="art"><rect x="${M}" y="${TOP}" width="${W - 2 * M}" height="${Math.round(((W - 2 * M) * 9) / 16)}" rx="28"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
<circle cx="${W - 120}" cy="120" r="560" fill="url(#glowO)"/>
<circle cx="80" cy="${H - 80}" r="600" fill="url(#glowG)"/>
<image x="${M}" y="52" width="${logoW.toFixed(1)}" height="${logoH}" href="${dataUri(LOGO)}"/>
<g font-family="Sora">
${badge}
${text(M, 200, card.title, { size: titleSize, weight: 700 })}
${card.subtitle ? text(M, 250, card.subtitle, { size: 28, weight: 400, fill: C.grey, max: W - 2 * M }) : ""}
${body}
<line x1="${M}" y1="${H - 98}" x2="${W - M}" y2="${H - 98}" stroke="${C.line}" stroke-width="2"/>
${text(M, H - 50, "quotaguru.it", { size: 28, weight: 700 })}
${text(W - M, H - 50, card.footnote ?? "18+ · Il gioco può causare dipendenza", { size: 21, weight: 400, fill: C.muted, anchor: "end" })}
</g>
</svg>`;
}

/** "+ altre 12 partite su quotaguru.it" under a list. */
const more = (y, n) =>
  n > 0
    ? text(W / 2, y, n === 1 ? "+ 1 altra partita su quotaguru.it" : `+ altre ${n} partite su quotaguru.it`, {
        size: 24,
        weight: 400,
        fill: C.grey,
        anchor: "middle",
      })
    : "";

// ---------------------------------------------------------------------------------------------- layouts
/**
 * Matches with 1X2 probabilities, grouped by competition (partite-oggi, coppe).
 * card.groups = [{ name, matches: [{ time, label, p: [p1, pX, p2], note? }] }]
 */
function matchList(card) {
  const rowH = 78;
  const gap = 10;
  const headH = 52;
  const total = card.groups.reduce((n, g) => n + g.matches.length, 0);
  let y = TOP;
  let shown = 0;
  let out = "";
  const right = W - M - 18;
  outer: for (const g of card.groups) {
    if (y + headH + rowH > BOTTOM - 44) break;
    out += caps(M, y + 30, g.name, { max: right - chipsWidth(3, 96) - M - 30 });
    out += chipHeads(right, y + 30, { w: 96 });
    y += headH;
    for (const m of g.matches) {
      if (y + rowH > BOTTOM - (shown + 1 < total ? 44 : 0)) break outer;
      out += rect(M, y, W - 2 * M, rowH, { r: 20 });
      out += text(M + 24, y + rowH / 2 + 9, m.time, { size: 25, weight: 700, fill: C.grey });
      const nameX = M + 124;
      const nameMax = right - chipsWidth(3, 96) - 22 - nameX;
      if (m.note) {
        out += text(nameX, y + 35, m.label, { size: 28, max: nameMax });
        out += text(nameX, y + 63, m.note, { size: 20, weight: 400, fill: C.muted, max: nameMax });
      } else
        out += text(nameX, y + rowH / 2 + 10, m.label, { size: fitSize(m.label, 29, 700, nameMax, 24), max: nameMax });
      out += probChips(right, y + 12, m.p, { w: 96, h: rowH - 24, size: 25 });
      y += rowH + gap;
      shown++;
    }
    y += 8;
  }
  return out + more(BOTTOM - 4, total - shown);
}

/** Model vs results of the day (risultati): card.hits, card.n, card.groups = [{ name, matches: [{ label, score, hit, pick }] }] */
function results(card) {
  let out = rect(M, TOP - 6, W - 2 * M, 112, { r: 24, fill: C.panel2 });
  out += text(M + 32, TOP + 68, `${card.hits} su ${card.n}`, { size: 54, fill: C.green });
  out += text(M + 40 + textWidth(`${card.hits} su ${card.n}`, 54, 700), TOP + 46, "esito più probabile del modello", {
    size: 24,
    weight: 400,
    fill: C.grey,
  });
  out += text(M + 40 + textWidth(`${card.hits} su ${card.n}`, 54, 700), TOP + 78, "verificato nelle partite di oggi", {
    size: 24,
    weight: 400,
    fill: C.grey,
  });
  let y = TOP + 136;
  const rowH = 74;
  const total = card.groups.reduce((n, g) => n + g.matches.length, 0);
  let shown = 0;
  outer: for (const g of card.groups) {
    if (y + 50 + rowH > BOTTOM - 44) break;
    out += caps(M, y + 28, g.name);
    y += 46;
    for (const m of g.matches) {
      if (y + rowH > BOTTOM - (shown + 1 < total ? 44 : 0)) break outer;
      out += rect(M, y, W - 2 * M, rowH, { r: 20 });
      out += m.hit ? check(M + 44, y + rowH / 2) : cross(M + 44, y + rowH / 2);
      const scoreW = 112;
      const scoreX = W - M - 18 - scoreW;
      out += text(M + 86, y + 33, m.label, { size: 27, max: scoreX - M - 106 });
      out += text(M + 86, y + 60, `modello: ${m.pick}`, {
        size: 20,
        weight: 400,
        fill: C.muted,
        max: scoreX - M - 106,
      });
      out += rect(scoreX, y + 14, scoreW, rowH - 28, { r: 12, fill: C.panel2 });
      out += text(scoreX + scoreW / 2, y + rowH / 2 + 10, m.score, { size: 28, anchor: "middle" });
      y += rowH + 10;
      shown++;
    }
    y += 6;
  }
  return out + more(BOTTOM - 4, total - shown);
}

/** Weekend track record: card.hits, card.n, card.rows = [{ name, hits, n }], card.last30 = { hits, n } | null */
function trackRecord(card) {
  const share = card.hits / card.n;
  const cx = M + 170;
  const cy = TOP + 170;
  const r = 140;
  const len = 2 * Math.PI * r;
  let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.line}" stroke-width="30"/>`;
  out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.green}" stroke-width="30" stroke-linecap="round" stroke-dasharray="${(len * share).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
  out += text(cx, cy + 22, pct(share), { size: 66, anchor: "middle" });
  const tx = M + 380;
  out += text(tx, TOP + 92, `${card.hits} su ${card.n}`, { size: 64, fill: C.green });
  out += text(tx, TOP + 140, "esito più probabile del modello", { size: 26, weight: 400, fill: C.grey });
  out += text(tx, TOP + 174, "verificato nel weekend", { size: 26, weight: 400, fill: C.grey });
  if (card.last30) {
    const [p30] = pill(
      tx,
      TOP + 214,
      `Ultimi 30 giorni: ${pct(card.last30.hits / card.last30.n)} (${card.last30.hits} su ${card.last30.n})`,
      { size: 21, h: 46 },
    );
    out += p30;
  }
  let y = TOP + 380;
  out += caps(M, y, "Per competizione");
  y += 26;
  const rowH = 70;
  const barX = M + 330;
  const barW = W - 2 * M - 330 - 130;
  for (const row of card.rows.slice(0, 7)) {
    out += rect(M, y, W - 2 * M, rowH - 10, { r: 18 });
    out += text(M + 24, y + 40, row.name, { size: 26, max: 290 });
    out += rect(barX, y + 20, barW, 20, { r: 10, fill: C.line, stroke: null });
    out += rect(barX, y + 20, Math.max(20, barW * (row.hits / row.n)), 20, { r: 10, fill: C.green, stroke: null });
    out += text(W - M - 24, y + 40, `${row.hits} su ${row.n}`, { size: 26, anchor: "end" });
    y += rowH;
  }
  out += text(M, BOTTOM - 4, "Contano i pronostici pubblicati prima del calcio d'inizio, anche quelli sbagliati.", {
    size: 21,
    weight: 400,
    fill: C.muted,
    max: W - 2 * M,
  });
  return out;
}

/** Serie A table: card.rows = [{ pos, team, played, gd, points }], card.scorers = [{ name, team, goals }], card.zones */
function standings(card) {
  const rowH = 40;
  let y = TOP - 10;
  let out = "";
  const cols = { pos: M + 30, team: M + 76, played: W - M - 250, gd: W - M - 150, pts: W - M - 30 };
  out += text(cols.pos, y + 22, "#", { size: 20, fill: C.muted, anchor: "middle" });
  out += text(cols.team, y + 22, "SQUADRA", { size: 20, fill: C.muted, spacing: 1 });
  out += text(cols.played, y + 22, "G", { size: 20, fill: C.muted, anchor: "middle" });
  out += text(cols.gd, y + 22, "DR", { size: 20, fill: C.muted, anchor: "middle" });
  out += text(cols.pts, y + 22, "PT", { size: 20, fill: C.muted, anchor: "end" });
  y += 36;
  out += rect(M, y, W - 2 * M, rowH * card.rows.length + 8, { r: 22 });
  y += 4;
  card.rows.forEach((r, i) => {
    const ry = y + i * rowH;
    if (i % 2)
      out += `<rect x="${M + 2}" y="${ry}" width="${W - 2 * M - 4}" height="${rowH}" fill="${C.panel2}" fill-opacity=".55"/>`;
    const zone = r.pos <= card.zones.top ? C.green : r.pos > card.rows.length - card.zones.bottom ? C.red : null;
    if (zone) out += `<rect x="${M + 10}" y="${ry + 8}" width="6" height="${rowH - 16}" rx="3" fill="${zone}"/>`;
    out += text(cols.pos, ry + 28, r.pos, { size: 22, fill: C.grey, anchor: "middle" });
    out += text(cols.team, ry + 28, r.team, { size: 24, max: cols.played - cols.team - 40 });
    out += text(cols.played, ry + 28, r.played, { size: 22, weight: 400, fill: C.grey, anchor: "middle" });
    out += text(cols.gd, ry + 28, r.gd > 0 ? `+${r.gd}` : r.gd, {
      size: 22,
      weight: 400,
      fill: C.grey,
      anchor: "middle",
    });
    out += text(cols.pts, ry + 28, r.points, { size: 24, anchor: "end" });
  });
  y += rowH * card.rows.length + 30;
  if (card.scorers.length) {
    out += caps(M, y + 18, "Marcatori");
    y += 32;
    let x = M;
    card.scorers.slice(0, 3).forEach((s, i) => {
      const w = (W - 2 * M - 20) / 3;
      out += rect(x, y, w, 64, { r: 18, fill: i === 0 ? C.panel2 : C.panel });
      out += text(x + 20, y + 41, s.name, { size: 22, max: w - 90 });
      out += text(x + w - 20, y + 42, s.goals, { size: 30, fill: C.orange, anchor: "end" });
      x += w + 10;
    });
  }
  return out;
}

/** Serie A, last five: card.panels = [{ title, note, rows: [{ team, count, n }] }] */
function numbers(card) {
  let y = TOP;
  let out = "";
  const ph = 282;
  for (const p of card.panels) {
    out += rect(M, y, W - 2 * M, ph - 18, { r: 26 });
    out += caps(M + 30, y + 46, p.title);
    if (p.note) out += text(M + 30, y + 78, p.note, { size: 21, weight: 400, fill: C.muted, max: W - 2 * M - 60 });
    let ry = y + 104;
    for (const r of p.rows) {
      out += text(M + 30, ry + 36, r.team, { size: 30, max: 380 });
      for (let k = 0; k < r.n; k++) {
        const on = k < r.count;
        out += `<circle cx="${M + 470 + k * 52}" cy="${ry + 26}" r="17" fill="${on ? (p.color ?? C.green) : C.panel2}" stroke="${on ? "none" : C.line}" stroke-width="2"/>`;
      }
      out += text(W - M - 30, ry + 36, `${r.count} su ${r.n}`, { size: 28, anchor: "end" });
      ry += 52;
    }
    y += ph;
  }
  out += text(M, BOTTOM - 4, "Statistiche, non previsioni: su 5 partite i numeri oscillano molto.", {
    size: 21,
    weight: 400,
    fill: C.muted,
    max: W - 2 * M,
  });
  return out;
}

/** NBA night: card.games = [{ time, home, away, p: [pHome, pAway] }] */
function nba(card) {
  const rowH = 104;
  let y = TOP;
  let out = "";
  const n = card.games.length;
  const fit = Math.floor((BOTTOM - TOP - 44) / (rowH + 10));
  const shown = n <= Math.floor((BOTTOM - TOP) / (rowH + 10)) ? n : fit;
  for (const g of card.games.slice(0, shown)) {
    out += rect(M, y, W - 2 * M, rowH, { r: 22 });
    out += text(M + 26, y + 42, g.time, { size: 24, fill: C.grey });
    const x0 = M + 130;
    const x1 = W - M - 26;
    out += text(x0, y + 42, g.home, { size: 27, max: (x1 - x0) / 2 - 20 });
    out += text(x1, y + 42, g.away, { size: 27, anchor: "end", max: (x1 - x0) / 2 - 20 });
    const fav = g.p[0] >= g.p[1] ? 0 : 1;
    const wHome = Math.max(90, Math.min(x1 - x0 - 90, (x1 - x0) * g.p[0]));
    out += rect(x0, y + 58, wHome - 3, 30, { r: 10, fill: fav === 0 ? C.green : C.panel2, stroke: null });
    out += rect(x0 + wHome + 3, y + 58, x1 - x0 - wHome - 3, 30, {
      r: 10,
      fill: fav === 1 ? C.green : C.panel2,
      stroke: null,
    });
    out += text(x0 + 14, y + 81, pct(g.p[0]), { size: 21, fill: "#ffffff" });
    out += text(x1 - 14, y + 81, pct(g.p[1]), { size: 21, fill: "#ffffff", anchor: "end" });
    y += rowH + 10;
  }
  return out + more(BOTTOM - 4, n - shown);
}

/** Serie A round preview: card.highlights = [{ label, match, value, color }], card.matches = [{ when, label, p }] */
function preview(card) {
  let out = "";
  const tw = (W - 2 * M - 2 * 16) / 3;
  card.highlights.forEach((h, i) => {
    const x = M + i * (tw + 16);
    out += rect(x, TOP - 6, tw, 196, { r: 24, fill: C.panel2 });
    out += caps(x + 22, TOP + 34, h.label, { size: 19, fill: h.color ?? C.orange });
    const [home, away] = h.match.split(" – ");
    out += text(x + 22, TOP + 78, home, { size: 26, max: tw - 44 });
    out += text(x + 22, TOP + 112, away ?? "", { size: 26, max: tw - 44 });
    out += text(x + 22, TOP + 164, h.value, { size: 30, fill: h.color === C.amber ? C.amber : C.green, max: tw - 44 });
  });
  let y = TOP + 226;
  const rowH = 62;
  const right = W - M - 14;
  out += chipHeads(right, y - 2, { w: 90, gap: 8 });
  y += 12;
  for (const m of card.matches.slice(0, 10)) {
    out += rect(M, y, W - 2 * M, rowH, { r: 18 });
    out += text(M + 22, y + 39, m.when, { size: 22, fill: C.grey });
    const nameX = M + 190;
    const nameMax = right - chipsWidth(3, 90, 8) - 16 - nameX;
    out += text(nameX, y + 40, m.label, { size: fitSize(m.label, 26, 700, nameMax, 21), max: nameMax });
    out += probChips(right, y + 9, m.p, { w: 90, h: rowH - 18, gap: 8, size: 22 });
    y += rowH + 8;
  }
  return out;
}

/** TV channels of the round: card.matches = [{ when, label, channels: [..] }], card.note */
function tv(card) {
  let y = TOP;
  let out = "";
  const rowH = 70;
  for (const m of card.matches.slice(0, 10)) {
    out += rect(M, y, W - 2 * M, rowH, { r: 18 });
    out += text(M + 22, y + 44, m.when, { size: 22, fill: C.grey });
    let x = W - M - 16;
    const pills = [];
    for (const ch of [...m.channels].reverse()) {
      const [svg, w] = pill(x, y + 13, ch, { size: 21, h: 44, align: "end", fill: C.panel2 });
      pills.push(svg);
      x -= w + 8;
    }
    out += text(M + 190, y + 45, m.label, { size: 26, max: x - M - 200 });
    out += pills.join("");
    y += rowH + 8;
  }
  y += 18;
  for (const line of wrap(card.note, 22, 400, W - 2 * M, 4)) {
    out += text(M, y + 24, line, { size: 22, weight: 400, fill: C.muted });
    y += 32;
  }
  return out;
}

/** Official line-ups: card.teams = [{ name, formation, coach, starters: [11 names] }], card.p (1X2 or null) */
function lineups(card) {
  let out = "";
  const cw = (W - 2 * M - 20) / 2;
  const ph = card.p ? 760 : 900;
  card.teams.forEach((t, i) => {
    const x = M + i * (cw + 20);
    out += rect(x, TOP - 6, cw, ph, { r: 26 });
    out += text(x + 26, TOP + 46, t.name, { size: fitSize(t.name, 32, 700, cw - 52, 24), max: cw - 52 });
    if (t.formation)
      out += pill(x + 26, TOP + 70, t.formation, { size: 22, fill: C.orange, color: "#fff", stroke: null, h: 42 })[0];
    let y = TOP + 160;
    const step = card.p ? 50 : 60;
    t.starters.slice(0, 11).forEach((name) => {
      out += `<circle cx="${x + 34}" cy="${y - 9}" r="5" fill="${C.green}"/>`;
      out += text(x + 52, y, name, { size: 27, weight: 400, max: cw - 78 });
      y += step;
    });
    if (t.coach)
      out += text(x + 26, TOP - 6 + ph - 30, `All. ${t.coach}`, { size: 21, weight: 400, fill: C.muted, max: cw - 52 });
  });
  if (card.p) {
    const y = TOP + ph + 22;
    out += rect(M, y, W - 2 * M, 130, { r: 24, fill: C.panel2 });
    out += caps(M + 28, y + 44, "Il modello prima delle formazioni", { size: 19 });
    out += probChips(W - M - 24, y + 62, card.p, { w: 124, h: 52, size: 26, labels: ["1", "X", "2"] });
  }
  return out;
}

/** Academy: guide illustration, title, first paragraph. card.slug, card.lead */
function academy(card) {
  const artW = W - 2 * M;
  const artH = Math.round((artW * 9) / 16);
  const file = path.join(root, "src", "assets", "guides", `${card.slug}.svg`);
  let out = "";
  if (fs.existsSync(file)) {
    // inlined (not <image>): the illustration's text then uses the card's fonts
    const art = fs
      .readFileSync(file, "utf8")
      .replace(/<\?xml[^>]*>/, "")
      .replace(/<svg\b([^>]*)>/, (_, attrs) => {
        const vb = attrs.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 1600 900";
        return `<svg x="${M}" y="${TOP}" width="${artW}" height="${artH}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">`;
      })
      .replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/id="([^"]+)"/g, 'id="art-$1"')
      .replace(/url\(#([^)]+)\)/g, "url(#art-$1)")
      .replace(/href="#([^"]+)"/g, 'href="#art-$1"')
      .replace(/font-family="[^"]*"/g, 'font-family="Sora"');
    out += `<g clip-path="url(#art)">${art}</g>`;
    out += rect(M, TOP, artW, artH, { r: 28, fill: "none" });
  } else out += rect(M, TOP, artW, artH, { r: 28 });
  let y = TOP + artH + 62;
  for (const line of wrap(card.lead, 30, 400, artW, 7)) {
    out += text(M, y, line, { size: 30, weight: 400, fill: C.light });
    y += 44;
  }
  // the following paragraphs, while they fit whole
  for (const para of card.rest ?? []) {
    const lines = wrap(para, 26, 400, artW);
    if (y + 20 + lines.length * 38 > BOTTOM) break;
    y += 20;
    for (const line of lines) {
      out += text(M, y, line, { size: 26, weight: 400, fill: C.grey });
      y += 38;
    }
  }
  return out;
}

/** Weekend three: card.picks = [{ when, where, label, sign, outcome, p }], card.all (product of the three) */
/**
 * A few outcomes and the chance they all come in (the threes, the predictions of the day).
 * card.picks = [{ when, where, label, sign, outcome, p }], card.all, card.allLabel
 */
function tris(card) {
  let out = "";
  const n = card.picks.length;
  const compact = n > 3;
  const ph = compact ? 136 : 192;
  const gap = compact ? 12 : 16;
  const r = compact ? 44 : 62;
  const textMax = W - 2 * M - (compact ? 200 : 260);
  let y = TOP - 6;
  card.picks.forEach((k) => {
    out += rect(M, y, W - 2 * M, ph, { r: 26 });
    out += caps(M + 30, y + (compact ? 36 : 44), `${k.where} · ${k.when}`, { size: compact ? 17 : 19, max: textMax });
    out += text(M + 30, y + (compact ? 78 : 98), k.label, {
      size: fitSize(k.label, compact ? 30 : 36, 700, textMax, 24),
      max: textMax,
    });
    out += text(M + 30, y + (compact ? 116 : 146), `${k.sign} · ${k.outcome}`, {
      size: compact ? 22 : 26,
      weight: 400,
      fill: C.grey,
      max: textMax,
    });
    const cx = W - M - (compact ? 84 : 110);
    const cy = y + ph / 2;
    const len = 2 * Math.PI * r;
    const sw = compact ? 11 : 14;
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.line}" stroke-width="${sw}"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.green}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${(len * k.p).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    out += text(cx, cy + (compact ? 9 : 12), pct(k.p), { size: compact ? 26 : 34, anchor: "middle" });
    y += ph + gap;
  });
  y += 4;
  const bh = BOTTOM - y;
  const bw = W - 2 * M - 60;
  out += rect(M, y, W - 2 * M, bh, { r: 26, fill: C.panel2 });
  out += caps(M + 30, y + (compact ? 50 : 60), card.allLabel ?? "Tutte e tre insieme", { fill: C.amber });
  out += text(M + 30, y + (compact ? 104 : 128), card.picks.map((k) => pct(k.p)).join("  ×  "), {
    size: compact ? 24 : 32,
    weight: 400,
    fill: C.grey,
    max: bw - 260,
  });
  out += text(W - M - 30, y + (compact ? 116 : 140), pct(card.all), {
    size: compact ? 80 : 92,
    fill: C.amber,
    anchor: "end",
  });
  const barY = y + (compact ? 142 : 180);
  out += rect(M + 30, barY, bw, 22, { r: 11, fill: C.line, stroke: null });
  out += rect(M + 30, barY, Math.max(22, bw * card.all), 22, { r: 11, fill: C.amber, stroke: null });
  if (bh > (compact ? 200 : 250))
    out += text(M + 30, y + bh - 30, "Esiti probabili, presi insieme, sbagliano spesso.", {
      size: 24,
      weight: 400,
      fill: C.muted,
      max: bw,
    });
  return out;
}

/**
 * Study of one match: 1X2 with fair odds, goals, likeliest scores, recent form, the model's outcome.
 * card = { home, away, p, xg, over25, btts, scores: [[h, a, p]], form: [home, away] | null, pick: { sign, text, p } }
 */
function study(card) {
  let out = "";
  const inner = W - 2 * M;
  let y = TOP - 6;
  // 1X2: three panels, probability and fair odds
  const tw = (inner - 2 * 16) / 3;
  const top = card.p.indexOf(Math.max(...card.p));
  const heads = [card.home, "Pareggio", card.away];
  card.p.forEach((p, i) => {
    const x = M + i * (tw + 16);
    const on = i === top;
    out += rect(x, y, tw, 196, { r: 24, fill: on ? C.panel2 : C.panel, stroke: on ? C.green : C.line, sw: on ? 3 : 2 });
    out += caps(x + 24, y + 40, `${["1", "X", "2"][i]} · ${heads[i]}`, {
      size: 18,
      max: tw - 48,
      fill: on ? C.green : C.grey,
    });
    out += text(x + 24, y + 116, pct(p), { size: 60, fill: on ? C.green : C.light });
    out += text(x + 24, y + 164, `quota equa ${dec(1 / p, 2)}`, { size: 22, weight: 400, fill: C.muted, max: tw - 48 });
  });
  y += 196 + 18;
  // goals
  const stats = [
    card.xg ? ["Gol attesi", `${dec(card.xg[0])} – ${dec(card.xg[1])}`] : null,
    card.over25 != null ? ["Over 2,5", pct(card.over25)] : null,
    card.btts != null ? ["Goal", pct(card.btts)] : null,
  ].filter(Boolean);
  if (stats.length) {
    const sw = (inner - (stats.length - 1) * 16) / stats.length;
    stats.forEach(([label, value], i) => {
      const x = M + i * (sw + 16);
      out += rect(x, y, sw, 126, { r: 22 });
      out += caps(x + 24, y + 42, label, { size: 18, max: sw - 48 });
      out += text(x + 24, y + 100, value, { size: 40, max: sw - 48 });
    });
    y += 126 + 18;
  }
  // likeliest scores
  if (card.scores?.length) {
    out += rect(M, y, inner, 118, { r: 22 });
    out += caps(M + 24, y + 42, "Risultati più probabili", { size: 18 });
    let x = M + 24;
    for (const [h, a, p] of card.scores) {
      const label = `${h}-${a}`;
      out += text(x, y + 96, label, { size: 36 });
      x += textWidth(label, 36) + 12;
      out += text(x, y + 96, pct(p), { size: 24, weight: 400, fill: C.muted });
      x += textWidth(pct(p), 24, 400) + 44;
    }
    y += 118 + 18;
  }
  // recent form
  if (card.form) {
    out += rect(M, y, inner, 176, { r: 22 });
    out += caps(M + 24, y + 42, "Ultime partite", { size: 18 });
    [card.home, card.away].forEach((name, t) => {
      const ry = y + 66 + t * 54; // top of the row
      out += text(M + 24, ry + 31, name, { size: 26, max: 380 });
      [...card.form[t]].forEach((r, j) => {
        const fill = r === "V" ? C.green : r === "S" ? C.red : C.line;
        out += rect(M + 430 + j * 52, ry + 4, 42, 38, { r: 8, fill, stroke: null });
        out += text(M + 451 + j * 52, ry + 31, r, { size: 20, anchor: "middle", fill: "#ffffff" });
      });
    });
    out += text(W - M - 24, y + 42, "V vinta · P pari · S persa", {
      size: 20,
      weight: 400,
      fill: C.muted,
      anchor: "end",
    });
    y += 176 + 18;
  }
  // the model's outcome, centred in the space left
  const bh = BOTTOM - y;
  if (bh >= 110) {
    out += rect(M, y, inner, bh, { r: 26, fill: C.panel2 });
    const mid = y + bh / 2;
    const note = bh >= 200;
    const base = note ? mid - 20 : mid;
    out += caps(M + 30, base - 22, "Per il modello", { fill: C.amber, size: 19 });
    const label = `${card.pick.sign} · ${card.pick.text}`;
    out += text(M + 30, base + 30, label, { size: fitSize(label, 40, 700, inner - 280, 26), max: inner - 280 });
    out += text(W - M - 30, base + 34, pct(card.pick.p), { size: 72, fill: C.amber, anchor: "end" });
    if (note)
      out += text(M + 30, y + bh - 30, "Stima statistica, non un consiglio di gioco.", {
        size: 22,
        weight: 400,
        fill: C.muted,
      });
  }
  return out;
}

const LAYOUTS = {
  tris,
  study,
  matchList,
  results,
  trackRecord,
  standings,
  numbers,
  nba,
  preview,
  tv,
  lineups,
  academy,
};

/** SVG, PNG and words of a card. */
export function renderCard(card) {
  words = [card.title, card.subtitle, card.badge].filter(Boolean);
  const layout = LAYOUTS[card.type];
  if (!layout) throw new Error(`layout sconosciuto: ${card.type}`);
  const svg = frame(card, layout(card));
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Sora" },
  })
    .render()
    .asPng();
  return { svg, png, text: words.join("\n") };
}
export const COLORS = C;
