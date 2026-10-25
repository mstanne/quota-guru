/**
 * SITE / COMPANY DATA (template)
 * Shown in the footer and in the institutional pages (contacts, privacy, cookie policy, terms).
 * Empty strings ("") hide the corresponding detail (address, VAT number, PEC).
 */
export const site = {
  name: "QuotaGuru",
  company: "Francesco Torcè",
  vatNumber: "",
  address: "",
  email: "francescotorce@gmail.com",
  privacyEmail: "francescotorce@gmail.com",
  pec: "",
  /** Date of the last review of the legal pages, e.g. "13 ottobre 2026". */
  legalUpdatedAt: "25 ottobre 2026",
  /** Social profiles: leave empty ("") to hide the icon. */
  social: {
    facebook: "",
    x: "",
    instagram: "",
  },
};

export const isFilled = (v: string) => Boolean(v) && !/^\[.*\]$/.test(v.trim());
