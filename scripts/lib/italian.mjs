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

// ---------- player pages: injuries, suspensions, transfers, trophies (API-Football wording → Italian) ----------
const ABSENCE = new Map(
  Object.entries({
    "suspended": "Squalifica", "suspension": "Squalifica", "red card": "Squalifica (espulsione)", "yellow cards": "Squalifica (ammonizioni)",
    "illness": "Malattia", "virus": "Malattia", "covid-19": "Covid-19", "knock": "Contusione", "injury": "Infortunio",
    "concussion": "Commozione cerebrale", "broken leg": "Frattura alla gamba", "broken ankle": "Frattura alla caviglia",
    "broken foot": "Frattura al piede", "broken arm": "Frattura al braccio", "broken nose": "Frattura al naso",
    "cruciate ligament injury": "Lesione al legamento crociato", "cruciate ligament rupture": "Rottura del legamento crociato",
    "muscle strain": "Stiramento muscolare", "groin strain": "Stiramento all'inguine", "hamstring strain": "Stiramento al bicipite femorale",
    "lacking match fitness": "Condizione non ottimale", "fitness": "Condizione fisica", "rest": "Riposo",
    "personal reasons": "Motivi personali", "coach's decision": "Scelta tecnica", "inactive": "Inattivo",
    "international duty": "Impegni con la nazionale", "loan agreement": "Clausola del prestito", "surgery": "Intervento chirurgico",
  }),
);
const BODY = {
  knee: "al ginocchio", hamstring: "al bicipite femorale", ankle: "alla caviglia", muscle: "muscolare", thigh: "alla coscia",
  calf: "al polpaccio", groin: "all'inguine", back: "alla schiena", foot: "al piede", hip: "all'anca", shoulder: "alla spalla",
  "achilles tendon": "al tendine d'Achille", achilles: "al tendine d'Achille", head: "alla testa", face: "al volto",
  hand: "alla mano", wrist: "al polso", arm: "al braccio", elbow: "al gomito", leg: "alla gamba", toe: "al dito del piede",
  finger: "al dito", rib: "alle costole", chest: "al torace", abdominal: "addominale", adductor: "all'adduttore",
  quadriceps: "al quadricipite", heel: "al tallone", shin: "alla tibia", neck: "al collo", eye: "all'occhio", pelvis: "al bacino",
  "metatarsal": "al metatarso", "cruciate ligament": "al legamento crociato", ligament: "ai legamenti", tendon: "al tendine",
};
/** Injury or suspension description in Italian ("Knee Injury" → "Infortunio al ginocchio"); unknown ones unchanged. */
export function absenceIt(s) {
  if (!s) return s;
  const k = String(s).trim().toLowerCase();
  if (ABSENCE.has(k)) return ABSENCE.get(k);
  const m = k.match(/^(.+?) (injury|problems?|surgery|strain|fracture)$/);
  if (m && BODY[m[1]]) {
    const what = { injury: "Infortunio", problem: "Problema", problems: "Problemi", surgery: "Intervento", strain: "Stiramento", fracture: "Frattura" }[m[2]];
    return `${what} ${BODY[m[1]]}`;
  }
  if (BODY[k]) return `Infortunio ${BODY[k]}`;
  return s;
}

/** Transfer type in Italian: loan, free, return; fees ("€ 25M") stay as they are, "N/A" becomes empty. */
export function transferTypeIt(s) {
  if (!s) return null;
  const k = String(s).trim().toLowerCase();
  if (k === "n/a" || k === "-" || k === "?") return null;
  if (k === "loan") return "Prestito";
  if (k === "free" || k === "free transfer" || k === "free agent") return "Parametro zero";
  if (k === "back from loan" || k === "return from loan" || k === "end of loan") return "Rientro dal prestito";
  if (k === "transfer") return "Trasferimento";
  if (k.startsWith("loan fee")) return `Prestito oneroso${s.slice(8)}`;
  return s;
}

/** Placing in a competition, in Italian ("Winner" → "Vincitore", "2nd Place" → "2º posto"). */
export function placeIt(s) {
  if (!s) return null;
  const k = String(s).trim().toLowerCase();
  if (k === "winner") return "Vincitore";
  if (k === "runner-up" || k === "2nd place") return "Secondo posto";
  const m = k.match(/^(\d+)(st|nd|rd|th) place$/);
  if (m) return `${m[1]}º posto`;
  if (k === "promoted") return "Promozione";
  return s;
}
