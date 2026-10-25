/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "plausible" | "ga4" – empty disables analytics (and the consent banner). */
  readonly VITE_ANALYTICS_PROVIDER?: string;
  /** Plausible site domain or GA4 measurement id. */
  readonly VITE_ANALYTICS_ID?: string;
  /** Cookie policy URL shown in the consent banner. */
  readonly VITE_COOKIE_POLICY_URL?: string;
}

/** ISO time of the build (vite.config.ts): reference for "upcoming / live / result pending". */
declare const __BUILD_TIME__: string;
