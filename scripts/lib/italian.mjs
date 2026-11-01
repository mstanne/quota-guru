// Italian names for the data (the sources are in English) and URL slugs, shared by the build scripts.

export const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const COUNTRY = new Map();
{
  const en = new Intl.DisplayNames(["en"], { type: "region" });
  const it = new Intl.DisplayNames(["it"], { type: "region" });
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of A) for (const b of A) {
    const code = a + b;
    try {
      const e = en.of(code);
      if (e && e !== code) COUNTRY.set(e.toLowerCase(), it.of(code));
    } catch {
      /* not a region code */
    }
  }
  for (const [e, i] of Object.entries({
    England: "Inghilterra", Scotland: "Scozia", Wales: "Galles", "Northern Ireland": "Irlanda del Nord",
    USA: "Stati Uniti", "United States": "Stati Uniti", "Korea Republic": "Corea del Sud", "South Korea": "Corea del Sud",
    "Côte d'Ivoire": "Costa d'Avorio", "Ivory Coast": "Costa d'Avorio", "Congo DR": "Repubblica Democratica del Congo",
    "DR Congo": "Repubblica Democratica del Congo", "Czech Republic": "Repubblica Ceca", Türkiye: "Turchia", Turkey: "Turchia",
    "Cape Verde Islands": "Capo Verde", "Bosnia-Herzegovina": "Bosnia ed Erzegovina", Kosovo: "Kosovo",
  })) COUNTRY.set(e.toLowerCase(), i);
}
export const country = (s) => (s ? COUNTRY.get(String(s).toLowerCase()) ?? s : s);

/** Player position (API-Football) in Italian. */
const POSITIONS = { Goalkeeper: "Portiere", Defender: "Difensore", Midfielder: "Centrocampista", Attacker: "Attaccante" };
export const positionIt = (p) => (p ? POSITIONS[p] ?? p : null);
