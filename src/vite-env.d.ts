/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "plausible" | "ga4" – empty disables analytics (and the consent banner). */
  readonly VITE_ANALYTICS_PROVIDER?: string;
  /** Plausible site domain or GA4 measurement id. */
  readonly VITE_ANALYTICS_ID?: string;
  /** Cookie policy URL shown in the consent banner. */
  readonly VITE_COOKIE_POLICY_URL?: string;
  /** Address of the live data service (workers/live), e.g. https://quotaguru-live.<account>.workers.dev. */
  readonly VITE_LIVE_URL?: string;
  /** Address of the video bucket (Cloudflare R2), e.g. https://video.quotaguru.it. Empty = files of the site (public/video). */
  readonly VITE_VIDEO_BASE?: string;
}

/** ISO time of the build (vite.config.ts, pre-render only): reference for "upcoming / live / result pending". */
declare const __BUILD_TIME__: string;
