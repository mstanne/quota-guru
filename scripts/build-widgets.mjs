// Widgets other sites can embed (iframe): standings with the model's season chances, the Champions League projection
// and the NBA projection. Runs in `npm run build` after the pre-render and writes small standalone pages:
//   dist/embed/<id>/index.html     no app, no age gate, no offers: only the table, inline styles, "Dati: Quota Guru"
// The list is src/data/widgets.json (also read by the /widget page, which shows each one with its embed code).
// The embed code puts the iframe and a link to the site in the host page: the link is what counts for search engines.
// Light theme with ?tema=chiaro. The pages are not indexed (public/_headers: X-Robots-Tag on /embed/*).
//
// Sources: src/data/football.json (standings), src/data/football-season-sim.json (season chances, European cups:
// scripts/predict-football.mjs), src/data/nba-season.json (scripts/predict-basket.mjs), src/data/teams/index.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const SITE = "https://www.quotaguru.it";
const read = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};
const { widgets } = read("src/data/widgets.json", { widgets: [] });
const football = read("src/data/football.json", { competitions: [] });
const sim = read("src/data/football-season-sim.json", { competitions: {} });
const nba = read("src/data/nba-season.json", { teams: {} });
const teams = read("src/data/teams/index.json", { football: [], nba: [] });
const footballSlug = new Map((teams.football ?? []).map((t) => [t.id, t.slug]));
const nbaSlug = new Map((teams.nba ?? []).map((t) => [t.id, t.slug]));

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const pct = (p) => {
  const v = Math.round(p * 100);
  return p > 0 && v < 1 ? "&lt;1%" : `${v}%`;
};
const dec = (n) => n.toFixed(1).replace(".", ",");
const sum = (a, from, to) => a.slice(from, to).reduce((s, x) => s + x, 0);
const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })
    : null;
const out = (href) => `${SITE}${href}${href.endsWith("/") ? "" : "/"}?utm_source=widget&amp;utm_medium=embed`;
const teamLink = (name, slug, base) =>
  slug ? `<a href="${out(`${base}/${slug}`)}" target="_blank" rel="noopener">${esc(name)}</a>` : esc(name);
/** Background tint of a chance (0 → none, 1 → full). */
const tint = (p, kind) => (p >= 0.005 ? ` style="--p:${Math.min(1, p).toFixed(2)}" class="c ${kind}"` : ` class="c"`);

/** Zones of each league: the columns of its widget (as src/lib/seasonOutlook.ts ZONES). */
const ZONES = {
  "serie-a": [["Scudetto", 1, 1, "g"], ["Prime 4", 1, 4, "b"], ["Retrocede", -3, -1, "r"]],
  "serie-b": [["Promozione", 1, 2, "g"], ["Playoff", 3, 8, "b"], ["Retrocede", -3, -1, "r"]],
  "premier-league": [["Titolo", 1, 1, "g"], ["Prime 4", 1, 4, "b"], ["Retrocede", -3, -1, "r"]],
  liga: [["Titolo", 1, 1, "g"], ["Prime 4", 1, 4, "b"], ["Retrocede", -3, -1, "r"]],
  bundesliga: [["Titolo", 1, 1, "g"], ["Prime 4", 1, 4, "b"], ["Retrocede", -2, -1, "r"]],
  "ligue-1": [["Titolo", 1, 1, "g"], ["Prime 3", 1, 3, "b"], ["Retrocede", -2, -1, "r"]],
};
const zoneP = (pos, [, from, to]) => {
  const n = pos.length;
  const a = from < 0 ? n + from : from - 1;
  const b = to < 0 ? n + to + 1 : to;
  return sum(pos, a, b);
};

const STYLE = `
:root{--bg:#0b1220;--panel:#111a2b;--line:#22314a;--text:#e8edf3;--muted:#8fa1b8;--link:#7cc4ff;--g:6,186,85;--b:56,152,236;--r:229,72,77}
.chiaro{--bg:#ffffff;--panel:#f6f8fb;--line:#e3e8ef;--text:#152033;--muted:#5d6b80;--link:#0b63c4}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--text);font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.w{padding:12px 12px 8px}h1{font-size:16px;margin:0 0 2px}p.s{margin:0 0 10px;color:var(--muted);font-size:12px}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}th{font-weight:500;color:var(--muted);font-size:12px;text-align:right;padding:6px 6px;border-bottom:1px solid var(--line);white-space:nowrap}
th:first-child,th.l{text-align:left}td{padding:5px 6px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}td.l{text-align:left;white-space:normal}td.n{color:var(--muted);width:22px}
td.c{position:relative}td.c[style]{background:rgba(var(--k),calc(var(--p)*.38))}td.g{--k:var(--g)}td.b{--k:var(--b)}td.r{--k:var(--r)}
a{color:var(--text);text-decoration:none}a:hover{text-decoration:underline}
.f{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;color:var(--muted);font-size:11px}.f a{color:var(--link);font-weight:600}
.tabs{display:flex;gap:6px;margin-bottom:8px}.tabs button{border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:999px;padding:4px 10px;font:inherit;font-size:12px;cursor:pointer}.tabs button[aria-pressed=true]{background:var(--text);color:var(--bg)}
`;
const SCRIPT = `<script>
if(/[?&]tema=chiaro/.test(location.search))document.documentElement.classList.add("chiaro");
document.querySelectorAll(".tabs button").forEach(function(b){b.addEventListener("click",function(){document.querySelectorAll(".tabs button").forEach(function(x){x.setAttribute("aria-pressed",x===b)});document.querySelectorAll("[data-tab]").forEach(function(t){t.hidden=t.getAttribute("data-tab")!==b.getAttribute("data-for")})})});
</script>`;

function page({ title, subtitle, body, link, updated }) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} | QuotaGuru</title>
<meta name="robots" content="noindex" />
<link rel="canonical" href="${SITE}${link.href}/" />
<style>${STYLE}</style>
</head>
<body>
<div class="w">
<h1>${esc(title)}</h1>
<p class="s">${esc(subtitle)}</p>
${body}
<div class="f"><span>${updated ? `Aggiornato al ${esc(updated)} · ` : ""}stime statistiche, non certezze</span><span>Dati e probabilità: <a href="${out(link.href)}" target="_blank" rel="noopener">Quota Guru</a></span></div>
</div>
${SCRIPT}
</body>
</html>
`;
}

function leagueWidget(w) {
  const c = football.competitions.find((x) => x.slug === w.slug);
  const s = sim.competitions?.[w.slug];
  const table = c?.standings?.find((t) => !t.stage || t.stage === "REGULAR_SEASON")?.table;
  const zones = ZONES[w.slug];
  if (!table?.length || !zones) return null;
  const rows = table
    .map((r) => {
      const pos = s?.teams?.[r.team.id]?.pos;
      const cells = zones.map((z) => (pos ? `<td${tint(zoneP(pos, z), z[3])}>${pct(zoneP(pos, z))}</td>` : `<td>–</td>`)).join("");
      return `<tr><td class="n">${r.position}</td><td class="l">${teamLink(r.team.shortName, footballSlug.get(r.team.id), "/calcio/squadre")}</td><td>${r.playedGames}</td><td><b>${r.points}</b></td>${cells}</tr>`;
    })
    .join("\n");
  const head = `<tr><th>#</th><th class="l">Squadra</th><th title="Partite giocate">G</th><th>Pt</th>${zones.map((z) => `<th>${z[0]}</th>`).join("")}</tr>`;
  return page({
    title: `Classifica ${c.name} e probabilità`,
    subtitle: s ? `Le probabilità di fine stagione secondo il modello di Quota Guru (${(sim.runs ?? 10000).toLocaleString("it-IT")} stagioni simulate)` : "Classifica aggiornata",
    body: `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`,
    link: { href: `/calcio/${w.slug}/classifica` },
    updated: when(sim.generatedAt),
  });
}

function cupWidget(w) {
  const c = football.competitions.find((x) => x.slug === w.slug);
  const s = sim.competitions?.[w.slug];
  const table = c?.standings?.[0]?.table;
  if (!table?.length || s?.kind !== "uefa") return null;
  const rows = table
    .map((r) => {
      const t = s.teams[r.team.id];
      const cell = (p, k) => (t ? `<td${tint(p, k)}>${pct(p)}</td>` : "<td>–</td>");
      return `<tr><td class="n">${r.position}</td><td class="l">${teamLink(r.team.shortName, footballSlug.get(r.team.id), "/calcio/squadre")}</td><td><b>${r.points}</b></td>${cell(t?.stage?.[0] ?? 0, "b")}${cell(t?.stage?.[2] ?? 0, "b")}${cell(t?.stage?.[6] ?? 0, "g")}</tr>`;
    })
    .join("\n");
  return page({
    title: `${c.name}: classifica e chi vince`,
    subtitle: "Fase campionato e probabilità del modello di Quota Guru: prime 8, ottavi e vittoria finale",
    body: `<table><thead><tr><th>#</th><th class="l">Squadra</th><th>Pt</th><th>Prime 8</th><th>Ottavi</th><th>Vince</th></tr></thead><tbody>${rows}</tbody></table>`,
    link: { href: `/calcio/${w.slug}/classifica` },
    updated: when(sim.generatedAt),
  });
}

function nbaWidget() {
  const list = Object.values(nba.teams ?? {}).filter((t) => t.conf);
  if (list.length < 30) return null;
  const confTable = (conf) => {
    const rows = list
      .filter((t) => t.conf === conf)
      .sort((a, b) => b.w / Math.max(1, b.w + b.l) - a.w / Math.max(1, a.w + a.l) || b.w - a.w)
      .map((t, i) => {
        const s = t.sim;
        const cell = (p, k) => (s ? `<td${tint(p, k)}>${pct(p)}</td>` : "<td>–</td>");
        return `<tr><td class="n">${i + 1}</td><td class="l">${teamLink(t.shortName, nbaSlug.get(t.id), "/basket/nba/squadre")}</td><td><b>${t.w}-${t.l}</b></td><td>${s ? dec(s.xw) : "–"}</td>${cell(s?.stage?.[1] ?? 0, "b")}${cell(s?.stage?.[5] ?? 0, "g")}</tr>`;
      })
      .join("\n");
    return `<table data-tab="${conf}"${conf === "ovest" ? " hidden" : ""}><thead><tr><th>#</th><th class="l">Squadra</th><th>Record</th><th title="Vittorie attese a fine stagione regolare">V. attese</th><th>Playoff</th><th>Titolo</th></tr></thead><tbody>${rows}</tbody></table>`;
  };
  return page({
    title: "Classifica NBA e proiezione",
    subtitle: "Vittorie attese e probabilità di playoff e titolo secondo il modello di Quota Guru",
    body: `<div class="tabs"><button type="button" data-for="est" aria-pressed="true">Est</button><button type="button" data-for="ovest" aria-pressed="false">Ovest</button></div>${confTable("est")}${confTable("ovest")}`,
    link: { href: "/basket/nba/classifica" },
    updated: when(nba.generatedAt),
  });
}

let written = 0;
for (const w of widgets) {
  const html = w.kind === "league" ? leagueWidget(w) : w.kind === "cup" ? cupWidget(w) : w.kind === "nba" ? nbaWidget() : null;
  if (!html) continue;
  const dir = path.join(dist, "embed", w.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  written++;
}
console.log(`widget: ${written} di ${widgets.length} (dist/embed)`);
