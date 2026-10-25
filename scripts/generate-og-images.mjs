// Social preview images (og:image, 1200×630 PNG) for the guides, made from their illustrations
// (src/assets/guides/<slug>.svg, 1600×900): the centre band of the illustration is kept, as on the guide pages.
//
// Usage:  node scripts/generate-og-images.mjs        (writes public/og/guide/<slug>.png)
// Run it after adding or changing a guide illustration and commit the PNGs: the build only uses them
// (scripts/prerender.mjs falls back to /og-image.png when a guide has no PNG).
// The illustrations use Inter: install it on the computer that runs the script (https://rsms.me/inter/) for the
// same lettering as on the site; otherwise a similar system font is used.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "src", "assets", "guides");
const OUT = path.join(root, "public", "og", "guide");
const W = 1200;
const H = 630;

fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".svg"));
for (const file of files) {
  const svg = fs.readFileSync(path.join(SRC, file), "utf8");
  const vb = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!vb) {
    console.warn(`${file}: viewBox non trovato, saltato`);
    continue;
  }
  const [vw, vh] = [Number(vb[1]), Number(vb[2])];
  // crop the 1.905:1 band in the middle of the illustration
  const cropH = (vw * H) / W;
  const y = Math.max(0, (vh - cropH) / 2);
  const framed = svg.replace(
    /<svg\b[^>]*>/,
    (tag) =>
      tag
        .replace(/\s(width|height|viewBox)="[^"]*"/g, "")
        .replace("<svg", `<svg width="${W}" height="${H}" viewBox="0 ${y} ${vw} ${Math.min(cropH, vh)}"`),
  );
  const png = new Resvg(framed, {
    fitTo: { mode: "width", value: W },
    font: { loadSystemFonts: true, defaultFontFamily: "Inter" },
  })
    .render()
    .asPng();
  const target = path.join(OUT, file.replace(/\.svg$/, ".png"));
  fs.writeFileSync(target, png);
  console.log(`${path.relative(root, target)}  ${Math.ceil(png.length / 1024)} KB`);
}
