// Shared Intl formatters. Creating an Intl.DateTimeFormat or Intl.NumberFormat is expensive and allocates native ICU
// objects outside the JS heap; the pre-rendering of ~16,000 pages created hundreds of thousands of them and the build
// ran out of memory (scripts/prerender.mjs, 14 November 2026). Each distinct locale + options pair is created once and
// reused: same output as `new Intl.DateTimeFormat(locale, options)` and `n.toLocaleString(locale, options)`.

const dateFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();

/** `new Intl.DateTimeFormat(locale, options)`, created once per locale + options. */
export function dateFormat(locale: string, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = dateFormats.get(key);
  if (!f) dateFormats.set(key, (f = new Intl.DateTimeFormat(locale, options)));
  return f;
}

/** `new Intl.NumberFormat(locale, options)`, created once per locale + options. */
export function numberFormat(locale: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = numberFormats.get(key);
  if (!f) numberFormats.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
}
