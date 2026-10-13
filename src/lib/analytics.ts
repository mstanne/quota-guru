// T2: privacy-first analytics with explicit consent.
//
// Nothing is loaded and no event is sent until the visitor accepts statistics cookies.
// The provider is chosen at build time with two environment variables (GitHub → Settings → Variables):
//   VITE_ANALYTICS_PROVIDER = "plausible" | "ga4"   (empty = analytics disabled, no banner shown)
//   VITE_ANALYTICS_ID       = site domain for Plausible (e.g. "example.com") or GA4 measurement id ("G-XXXXXXX")
//
// Events sent by the site:
//   outbound_click  { operator, placement, page }   – click on a "Vai al sito" button (affiliate link)
//   bet_slip_add    { operator, market, page }      – odd added to the bet slip

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
    window.gtag("config", ID, { anonymize_ip: true });
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
  }
  document.head.appendChild(script);
}

/** Call once at start-up: loads the provider if consent was already given. */
export function initAnalytics() {
  if (getConsent() === "granted") loadProvider();
}

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
