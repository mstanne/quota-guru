/**
 * SITE / COMPANY DATA (template)
 * Fill in these values before publishing: they appear in the footer and in the institutional pages
 * (contacts, privacy, cookie policy, terms). Placeholders use the [UPPER_SNAKE_CASE] convention.
 */
export const site = {
  name: "Quota Guru",
  company: "[RAGIONE_SOCIALE]",
  vatNumber: "[PARTITA_IVA]",
  address: "[INDIRIZZO_SEDE_LEGALE]",
  email: "[EMAIL_CONTATTO]",
  privacyEmail: "[EMAIL_PRIVACY]",
  pec: "[PEC]",
  /** Date of the last review of the legal pages, e.g. "13 ottobre 2026". */
  legalUpdatedAt: "[DATA_AGGIORNAMENTO]",
  /** Social profiles: leave empty ("") to hide the icon. */
  social: {
    facebook: "",
    x: "",
    instagram: "",
  },
};

export const isFilled = (v: string) => Boolean(v) && !/^\[.*\]$/.test(v.trim());
