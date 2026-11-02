// T2: privacy-first analytics with explicit consent.
//
// Nothing is loaded and no event is sent until the visitor accepts statistics cookies.
// The provider is chosen at build time with two environment variables (GitHub → Settings → Variables):
//   VITE_ANALYTICS_PROVIDER = "plausible" | "ga4"   (empty = analytics disabled, no banner shown)
//   VITE_ANALYTICS_ID       = site domain for Plausible (e.g. "example.com") or GA4 measurement id ("G-XXXXXXX")
//
// Events sent by the site:
//   outbound_click     { operator, placement, page }   – click on a "Vai al sito" button (affiliate link)
//   bet_slip_add       { operator, market, page }      – odd added to the bet slip
//   offer_terms_click  { operator, offer, placement, page } – click on "termini"/"condizioni" of a welcome offer
//   filter_use         { filter, value, page }         – section/filter chosen (bonus sections, operator filters)
//   guide_read         { guide, category }             – visitor reached the end of a guide
//   helpline_click     { page }                        – click on the gambling helpline number (any tel: link)
//   market_filter      { market, sport, page }         – market chosen in the quick filter of a match list
//   prediction_view    { sport, page }                 – a prediction panel scrolled into view (once per page)
//   track_record_click { sport, result, page }         – click on one of the last-10 predictions of the track record
//   archive_download   { sport, page }                 – download of the archive of published predictions
//   matchday_nav       { competition, to, page }       – move to another round from a matchday page
//   day_switch         { to, page }                    – switch between "pronostici di oggi" and "di domani"
//
// Own visits: opening any page with ?interno=1 marks this browser as internal (saved in localStorage, ?interno=0
// undoes it). GA4 then receives traffic_type=internal, excluded by the "Internal Traffic" data filter of the
// property; Plausible ignores the browser (its own plausible_ignore flag).
//
// offer_terms_click and filter_use are declarative: put data-track="<event>" and data-track-<prop>="…"
// on any clickable element and the click listener installed by initAnalytics() sends it.

type Provider = "plausible" | "ga4";
export type Consent = "granted" | "denied" | null;

const env = import.meta.env;
const PROVIDER = (env.VITE_ANALYTICS_PROVIDER ?? "").trim().toLowerCase() as Provider | "";
const ID = (env.VITE_ANALYTICS_ID ?? "").trim();

// Strict validation: the id ends up in a script URL / attribute.
const VALID_ID =
  (PROVIDER === "plausible" && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(ID)) ||
  (PROVIDER === "ga4" && /^G-[A-Z0-9]{4,}$/.test(ID));

/** True when a provider is configured: only then the consent banner is needed. */
export const analyticsConfigured = Boolean(PROVIDER && VALID_ID);

const CONSENT_KEY = "qg-consent";
const CONSENT_EVENT = "qg-consent-change";
const OPEN_EVENT = "qg-consent-open";

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable: choice lasts for this page view only */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  if (value === "granted") loadProvider();
}

/** Re-opens the consent banner (footer "Preferenze cookie" link). */
export const openConsentSettings = () => window.dispatchEvent(new Event(OPEN_EVENT));
export const onConsentOpen = (fn: () => void) => {
  window.addEventListener(OPEN_EVENT, fn);
  return () => window.removeEventListener(OPEN_EVENT, fn);
};

declare global {
  interface Window {
    plausible?: ((event: string, options?: { props?: Record<string, string> }) => void) & { q?: unknown[] };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const INTERNAL_KEY = "qg-interno";

/** True when this browser was marked as the site owner's (see ?interno=1 above). */
export function isInternal() {
  try {
    return localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}

/** Reads ?interno=1 / ?interno=0, saves the choice, removes the parameter from the address and confirms it. */
function readInternalFlag() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const v = url.searchParams.get("interno");
  if (v !== "1" && v !== "0") return;
  try {
    if (v === "1") {
      localStorage.setItem(INTERNAL_KEY, "1");
      localStorage.setItem("plausible_ignore", "true");
    } else {
      localStorage.removeItem(INTERNAL_KEY);
      localStorage.removeItem("plausible_ignore");
    }
  } catch {
    return; // storage unavailable: nothing can be remembered
  }
  url.searchParams.delete("interno");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  const note = document.createElement("div");
  note.setAttribute("role", "status");
  note.textContent =
    v === "1"
      ? "Questo browser è segnato come interno: le tue visite non contano nelle statistiche."
      : "Questo browser non è più segnato come interno.";
  note.style.cssText =
    "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;max-width:calc(100% - 32px);" +
    "background:#0f172a;color:#fff;border:1px solid #334155;border-radius:10px;padding:12px 16px;font:14px/1.4 sans-serif;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.4)";
  document.body.appendChild(note);
  window.setTimeout(() => note.remove(), 5000);
}

let loaded = false;
function loadProvider() {
  if (loaded || !analyticsConfigured || typeof document === "undefined") return;
  loaded = true;
  const script = document.createElement("script");
  script.async = true;
  if (PROVIDER === "plausible") {
    // queue calls made before the script has loaded
    window.plausible =
      window.plausible ||
      Object.assign((...args: unknown[]) => (window.plausible!.q = window.plausible!.q || []).push(args), { q: [] });
    script.defer = true;
    script.dataset.domain = ID;
    script.src = "https://plausible.io/js/script.js";
  } else {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    // own visits (?interno=1) are tagged and dropped by the GA4 "Internal Traffic" data filter
    window.gtag("config", ID, { anonymize_ip: true, ...(isInternal() ? { traffic_type: "internal" } : {}) });
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
  }
  document.head.appendChild(script);
}

let listening = false;
/** One document-level listener for declarative events (data-track) and helpline (tel:) links. */
function listenForClicks() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const tagged = target.closest<HTMLElement>("[data-track]");
      if (tagged) {
        const props: Record<string, string> = { page: currentPage() };
        for (const [key, value] of Object.entries(tagged.dataset)) {
          // data-track-operator="eurobet" -> dataset.trackOperator -> props.operator
          if (key.startsWith("track") && key !== "track" && value) props[key[5].toLowerCase() + key.slice(6)] = value;
        }
        track(tagged.dataset.track!, props);
        return;
      }
      if (target.closest('a[href^="tel:"]')) track("helpline_click", { page: currentPage() });
    },
    { capture: true },
  );
}

/** Call once at start-up: loads the provider if consent was already given and starts listening for clicks. */
export function initAnalytics() {
  readInternalFlag();
  listenForClicks();
  if (getConsent() === "granted") loadProvider();
}

/** Human-readable name of the configured provider, for the cookie policy and privacy notice. */
export const analyticsProvider: "plausible" | "ga4" | null = analyticsConfigured ? (PROVIDER as Provider) : null;

/** Sends an event – silently ignored without consent or without a configured provider. */
export function track(event: string, props: Record<string, string> = {}) {
  if (!analyticsConfigured || getConsent() !== "granted" || typeof window === "undefined") return;
  loadProvider();
  if (PROVIDER === "plausible") window.plausible?.(event, { props });
  else window.gtag?.("event", event, props);
}

/** Current page path without the GitHub Pages base path. */
export const currentPage = () =>
  typeof window === "undefined"
    ? ""
    : window.location.pathname.slice(import.meta.env.BASE_URL.replace(/\/$/, "").length) || "/";

/** Sends `event` once, the first time `el` is at least half visible (no-op without IntersectionObserver). */
export function trackWhenVisible(el: Element | null, event: string, props: Record<string, string>) {
  if (!el || typeof IntersectionObserver === "undefined") return () => {};
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        track(event, { ...props, page: currentPage() });
        io.disconnect();
      }
    },
    { threshold: 0.5 },
  );
  io.observe(el);
  return () => io.disconnect();
}
