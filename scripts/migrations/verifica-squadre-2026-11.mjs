// Checks of the club-id correction (scripts/migrations/correggi-squadre-2026-11.mjs) on a built site (dist/).
// Usage: node scripts/migrations/verifica-squadre-2026-11.mjs   (after `npm run build`; exit 1 if a check fails)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = path.join(root, "dist");
const read = (f, fb = null) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
  } catch {
    return fb;
  }
};
const page = (p) => {
  const f = path.join(dist, p.slice(1), "index.html");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
};
const isBridge = (html) => html?.includes('http-equiv="refresh"');
const out = [];
let failed = 0;
const check = (ok, msg) => {
  out.push(`${ok ? "OK " : "ERRORE"} ${msg}`);
  if (!ok) failed++;
};

// 1. moved URLs: a bridge at the old one, a real page at the new one
const moved = read("data/url-spostati.json", {});
const entries = Object.entries(moved);
const badBridge = entries.filter(([from]) => !isBridge(page(from)));
const badTarget = entries.filter(([, to]) => !page(to) || isBridge(page(to)));
check(entries.length > 0, `${entries.length} indirizzi spostati in data/url-spostati.json`);
check(
  !badBridge.length,
  `pagina ponte su ogni vecchio indirizzo${
    badBridge.length
      ? `: mancano ${badBridge
          .slice(0, 10)
          .map(([f]) => f)
          .join(", ")}`
      : ""
  }`,
);
check(
  !badTarget.length,
  `pagina vera su ogni nuovo indirizzo${
    badTarget.length
      ? `: mancano ${badTarget
          .slice(0, 10)
          .map(([, t]) => t)
          .join(", ")}`
      : ""
  }`,
);

// 2. team pages: one per club, with the names of before November
const index = read("src/data/teams/index.json", { football: [] }).football;
for (const [id, slug, name] of [
  [10000034, "newcastle", "Newcastle"],
  [10000072, "qpr", "QPR"],
  [10000106, "brest", "Brest"],
  [10000426, "sparta", "Sparta"],
  [10000427, "telstar", "Telstar"],
  [10000039, "wolverhampton", "Wolverhampton"],
  [10000529, "barca", "Barça"],
  [10000094, "stade-rennais", "Stade Rennais"],
  [10001062, "mineiro", "Mineiro"],
]) {
  const t = index.filter((x) => x.id === id);
  check(
    t.length === 1 && t[0].slug === slug && t[0].shortName === name,
    `pagina squadra ${name}: ${t.map((x) => `/calcio/squadre/${x.slug}`).join(", ") || "assente"}`,
  );
  check(
    !!page(`/calcio/squadre/${slug}`) && !isBridge(page(`/calcio/squadre/${slug}`)),
    `/calcio/squadre/${slug} pubblicata`,
  );
}
check(
  !index.some((x) => [67, 69, 512, 6806, 1912, 76, 81, 529, 1766].includes(x.id)),
  "nessuna pagina squadra con gli id vecchi",
);

// 3. no club under a wrong name in the current data
const football = read("src/data/football.json", { competitions: [] });
const wrong = [];
for (const c of football.competitions)
  for (const m of c.matches)
    for (const t of [m.homeTeam, m.awayTeam]) {
      if ([67, 69, 512, 6806, 1912, 76, 81, 529, 1766].includes(t.id)) wrong.push(`${c.code} ${t.id} ${t.name}`);
      if (
        ["CL", "EL", "ECL"].includes(c.code) &&
        /^(Newcastle United FC|Queens Park Rangers FC|Telstar 1963|Stade Brestois 29)$/.test(t.name)
      )
        wrong.push(`${c.code} ${t.id} ${t.name}`);
      if (c.code === "EL" && t.name === "Sparta Rotterdam") wrong.push(`${c.code} ${t.id} ${t.name}`);
    }
check(
  !wrong.length,
  `nomi giusti nelle coppe e id nuovi ovunque${wrong.length ? `: ${[...new Set(wrong)].slice(0, 10).join("; ")}` : ""}`,
);

// 4. history: the 9 clubs have their whole history under one id
const hist = read("data/football-history.json", { results: [] }).results;
for (const [id, name] of [
  [10000034, "Newcastle"],
  [10000529, "Barça"],
  [10000039, "Wolverhampton"],
  [10001062, "Mineiro"],
]) {
  const n = hist.filter((r) => r.home === id || r.away === id).length;
  check(n > 60, `storico ${name}: ${n} partite`);
}

// 5. predictions archive: no match recorded twice
const dir = path.join(root, process.env.PREDICTION_ARCHIVE_DIR ?? ".cache/predictions-archive", "calcio");
const all = fs.existsSync(dir)
  ? fs.readdirSync(dir).flatMap((n) => Object.values(read(path.relative(root, path.join(dir, n)), {})))
  : [];
const seen = new Map();
for (const e of all) {
  const k = `${e.where}|${e.label}|${e.kickoff.slice(0, 10)}`;
  seen.set(k, (seen.get(k) ?? 0) + 1);
}
const dup = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
check(
  all.length > 0 && !dup.length,
  `archivio pronostici: ${all.length} voci${dup.length ? `, doppie: ${dup.slice(0, 10).join("; ")}` : ", nessuna doppia"}`,
);

const text = out.join("\n");
console.log(text);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n\`\`\`\n${text}\n\`\`\`\n`);
process.exit(failed ? 1 : 0);
