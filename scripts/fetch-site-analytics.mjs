#!/usr/bin/env node
// Weekly export of the site's visitor statistics (Google Analytics 4) and Google searches (Search Console),
// used by .github/workflows/analytics.yml. The files end up in the `statistiche-sito` branch, where Claude reads them
// to suggest improvements to the site. Read-only: nothing is changed on Google's side.
//
// Configuration (repo Settings → Secrets and variables → Actions):
//   secret   GOOGLE_SERVICE_ACCOUNT_JSON  JSON key of a Google Cloud service account (see docs/statistiche-sito.md);
//                                         the account must be "Visualizzatore" on GA4 and a user of Search Console
//   variable GA4_PROPERTY_ID              numeric GA4 property id (Amministrazione → Dettagli della proprietà)
//   variable GSC_SITE                     Search Console property, default "sc-domain:quotaguru.it"
// Without the secret the script stops without errors. GA4 and Search Console are independent: if one is not set up
// or fails, the other is still exported.
//
// Output (OUT_DIR, default .cache/statistiche):
//   ga4.json   last 28 days: totals, by day, pages, landing pages, channels, sources, devices, countries, events
//   gsc.json   last 28 days (Search Console data arrive with ~3 days of delay): totals, by day, queries, pages,
//              query+page pairs, devices, countries, sitemaps
//   riepilogo.md  short readable summary
import { createSign } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = process.env.OUT_DIR || ".cache/statistiche";
const DAYS = Number(process.env.ANALYTICS_DAYS || 28);
const GSC_SITE = process.env.GSC_SITE || "sc-domain:quotaguru.it";
const GA4_PROPERTY = (process.env.GA4_PROPERTY_ID || "").replace(/^properties\//, "").trim();

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

const b64url = (b) => Buffer.from(b).toString("base64url");

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: key.client_email, scope: SCOPES.join(" "), aud: key.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${b64url(signer.sign(key.private_key))}`;
  const res = await fetch(key.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`token Google: HTTP ${res.status} ${JSON.stringify(body)}`);
  return body.access_token;
}

async function call(token, url, payload) {
  const res = await fetch(url, {
    method: payload ? "POST" : "GET",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}\n${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : {};
}

const day = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => day(new Date(Date.now() - n * 86400000));

// ---------- Google Analytics 4 ----------
async function ga4(token) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`;
  const range = [{ startDate: `${DAYS}daysAgo`, endDate: "yesterday" }];
  const report = async (dimensions, metrics, { limit = 100, orderBy } = {}) => {
    const r = await call(token, url, {
      dateRanges: range,
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      limit,
      orderBys: [orderBy ? { dimension: { dimensionName: orderBy } } : { metric: { metricName: metrics[0] }, desc: true }],
    });
    return (r.rows ?? []).map((row) => {
      const o = {};
      dimensions.forEach((d, i) => (o[d] = row.dimensionValues[i].value));
      metrics.forEach((m, i) => (o[m] = Number(row.metricValues[i].value)));
      return o;
    });
  };
  const core = ["activeUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration"];
  const [totali] = await report([], [...core, "newUsers", "bounceRate"], { limit: 1 });
  return {
    periodo: { da: daysAgo(DAYS), a: daysAgo(1) },
    totali: totali ?? null,
    perGiorno: await report(["date"], ["activeUsers", "sessions", "screenPageViews"], { limit: 400, orderBy: "date" }),
    pagine: await report(["pagePath"], ["screenPageViews", "activeUsers", "userEngagementDuration"], { limit: 250 }),
    pagineDiIngresso: await report(["landingPage"], ["sessions", "engagementRate", "bounceRate", "averageSessionDuration"], { limit: 150 }),
    canali: await report(["sessionDefaultChannelGroup"], ["sessions", "activeUsers", "engagementRate"], { limit: 30 }),
    sorgenti: await report(["sessionSourceMedium"], ["sessions", "activeUsers", "engagementRate"], { limit: 60 }),
    dispositivi: await report(["deviceCategory"], ["sessions", "activeUsers", "engagementRate"], { limit: 10 }),
    paesi: await report(["country"], ["sessions", "activeUsers"], { limit: 30 }),
    eventi: await report(["eventName"], ["eventCount", "totalUsers"], { limit: 60 }),
  };
}

// ---------- Search Console ----------
async function gsc(token) {
  const site = encodeURIComponent(GSC_SITE);
  // Search Console data arrive with ~2-3 days of delay
  const startDate = daysAgo(DAYS + 2);
  const endDate = daysAgo(3);
  const query = async (dimensions, rowLimit = 1000) => {
    const r = await call(token, `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      dataState: "all",
    });
    return (r.rows ?? []).map((row) => {
      const o = {};
      dimensions.forEach((d, i) => (o[d] = row.keys[i]));
      return { ...o, clic: row.clicks, impressioni: row.impressions, ctr: Number(row.ctr.toFixed(4)), posizione: Number(row.position.toFixed(1)) };
    });
  };
  const [totali] = await query([], 1);
  const sitemaps = await call(token, `https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps`).catch((e) => ({ errore: e.message }));
  return {
    proprieta: GSC_SITE,
    periodo: { da: startDate, a: endDate },
    totali: totali ?? null,
    perGiorno: await query(["date"], 400),
    ricerche: await query(["query"], 1000),
    pagine: await query(["page"], 1000),
    ricerchePerPagina: await query(["query", "page"], 5000),
    dispositivi: await query(["device"], 10),
    paesi: await query(["country"], 30),
    sitemap: sitemaps.sitemap ?? sitemaps,
  };
}

// ---------- summary ----------
const pct = (x) => (x == null ? "–" : `${(x * 100).toFixed(1)}%`);
const n = (x) => (x == null ? "–" : Math.round(x).toLocaleString("it-IT"));

function summary(g, s, errors) {
  const out = [`# Statistiche Quota Guru — ${day(new Date())}`, ""];
  if (g) {
    const t = g.totali ?? {};
    out.push(
      `## Visitatori (GA4, ${g.periodo.da} → ${g.periodo.a})`,
      "",
      `Utenti ${n(t.activeUsers)} (nuovi ${n(t.newUsers)}) · sessioni ${n(t.sessions)} · pagine viste ${n(t.screenPageViews)} · coinvolgimento ${pct(t.engagementRate)} · durata media ${n(t.averageSessionDuration)} s`,
      "",
      "**Canali:** " + g.canali.slice(0, 6).map((c) => `${c.sessionDefaultChannelGroup} ${n(c.sessions)}`).join(" · "),
      "",
      "**Pagine più viste:**",
      ...g.pagine.slice(0, 10).map((p) => `- ${p.pagePath} — ${n(p.screenPageViews)}`),
      "",
    );
  }
  if (s) {
    const t = s.totali ?? {};
    out.push(
      `## Ricerche Google (Search Console, ${s.periodo.da} → ${s.periodo.a})`,
      "",
      `Clic ${n(t.clic)} · impressioni ${n(t.impressioni)} · CTR ${pct(t.ctr)} · posizione media ${t.posizione ?? "–"}`,
      "",
      "**Ricerche con più impressioni:**",
      ...[...s.ricerche]
        .sort((a, b) => b.impressioni - a.impressioni)
        .slice(0, 15)
        .map((q) => `- ${q.query} — ${n(q.impressioni)} impr., ${n(q.clic)} clic, pos. ${q.posizione}`),
      "",
    );
  }
  if (errors.length) out.push("## Problemi", "", ...errors.map((e) => `- ${e}`), "");
  return out.join("\n");
}

// ---------- main ----------
const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.log("::notice::Secret GOOGLE_SERVICE_ACCOUNT_JSON mancante: statistiche non esportate (vedi docs/statistiche-sito.md)");
  process.exit(0);
}
let key;
try {
  key = JSON.parse(raw);
} catch {
  console.log("::error::GOOGLE_SERVICE_ACCOUNT_JSON non è un JSON valido: incolla l'intero file della chiave");
  process.exit(1);
}
console.log(`Account di servizio: ${key.client_email}`);
let token;
try {
  token = await accessToken(key);
} catch (e) {
  console.log(`::error::Accesso a Google non riuscito (chiave errata, revocata o API non abilitate): ${e.message}`);
  process.exit(1);
}
await mkdir(OUT, { recursive: true });

const errors = [];
let g = null;
let s = null;
if (GA4_PROPERTY) {
  try {
    g = await ga4(token);
    await writeFile(path.join(OUT, "ga4.json"), JSON.stringify(g, null, 1));
    console.log(`GA4: ${g.pagine.length} pagine, ${g.totali?.sessions ?? 0} sessioni`);
  } catch (e) {
    errors.push(`GA4: ${e.message.split("\n")[0]}`);
    console.log(`::warning::GA4 non esportato: ${e.message}`);
  }
} else {
  errors.push("GA4: variabile GA4_PROPERTY_ID non impostata");
  console.log("::notice::Variabile GA4_PROPERTY_ID non impostata: GA4 saltato");
}
try {
  s = await gsc(token);
  await writeFile(path.join(OUT, "gsc.json"), JSON.stringify(s, null, 1));
  console.log(`Search Console: ${s.ricerche.length} ricerche, ${s.pagine.length} pagine`);
} catch (e) {
  errors.push(`Search Console: ${e.message.split("\n")[0]}`);
  console.log(`::warning::Search Console non esportato: ${e.message}`);
}

const md = summary(g, s, errors);
await writeFile(path.join(OUT, "riepilogo.md"), md);
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, md, { flag: "a" });
if (!g && !s) process.exit(1);
