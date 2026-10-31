/**
 * OPERATOR PROFILES – details for the operator pages (/siti-scommesse/<id>): customer service, apps, bet limits.
 * Every value was read on the operator's own site (or its App Store page) on `checkedAt`; the pages used are in
 * `sources`. A field that could not be verified is simply left out: the page then says "Non ancora indicato".
 * Re-check periodically: contacts, apps and limits change.
 */

export interface OperatorProfile {
  support?: {
    /** "Live chat", "Telefono", "Email", "WhatsApp", "Modulo online"... */
    channels: string[];
    /** Opening hours as stated by the operator. */
    hours?: string;
    phone?: string;
    email?: string;
    /** Extra condition worth knowing (e.g. chat only after login). */
    note?: string;
  };
  apps?: {
    /** App Store URL of the sports (or main) app. */
    ios?: string;
    /** Google Play URL, or "apk" when the Android app is downloaded from the operator's site. */
    android?: string;
  };
  limits?: {
    minStake?: string;
    maxWin?: string;
  };
  /** Pages the data was read from. */
  sources: { label: string; url: string }[];
  /** ISO date of the check. */
  checkedAt: string;
}

const CHECKED = "2026-10-31";

export const operatorProfiles: Record<string, OperatorProfile> = {
  planetwin365: {
    support: {
      channels: ["Telefono", "Live chat", "Email"],
      hours: "09:00–22:00, 7 giorni su 7",
      phone: "06 40400860",
      email: "assistenza@planetwin365.it",
      note: "La live chat è disponibile dopo l'accesso al conto.",
    },
    apps: { ios: "https://apps.apple.com/it/app/planetwin365-scommesse-sport/id6742659283", android: "apk" },
    limits: {
      minStake: "1 € (nei sistemi ogni combinazione deve essere un multiplo di 0,05 €)",
      maxWin: "50.000 € per scommesse singole e multiple",
    },
    sources: [
      { label: "Contatti", url: "https://www.planetwin365.it/guida/contatti" },
      { label: "FAQ scommesse", url: "https://www.planetwin365.it/guida/faq-scommesse" },
      {
        label: "Regolamento generale scommesse",
        url: "https://www.planetwin365.it/guida/scommesse-regolamento-generale",
      },
      { label: "App sport", url: "https://www.planetwin365.it/app/sport" },
    ],
    checkedAt: CHECKED,
  },
  goldbet: {
    support: {
      channels: ["Telefono", "Live chat", "Email", "Fax (documenti)"],
      hours: "09:00–22:00, 7 giorni su 7",
      phone: "06 40400860",
      email: "assistenza@lottomatica.com",
      note: "La live chat è disponibile nel pannello utente dopo l'accesso.",
    },
    apps: { ios: "https://apps.apple.com/it/app/goldbet-scommesse-sportive/id1103180588", android: "apk" },
    limits: {
      minStake: "1 € (nei sistemi ogni combinazione deve essere un multiplo di 0,05 €)",
      maxWin: "50.000 € per scommesse singole e multiple",
    },
    sources: [
      { label: "Contatti", url: "https://www.goldbet.it/guida/contatti" },
      { label: "FAQ scommesse", url: "https://www.goldbet.it/guida/faq-scommesse" },
      { label: "Regolamento generale scommesse", url: "https://www.goldbet.it/guida/scommesse-regolamento-generale" },
      { label: "App sport", url: "https://www.goldbet.it/app/sport" },
    ],
    checkedAt: CHECKED,
  },
  lottomatica: {
    support: {
      channels: ["Telefono", "Live chat", "Email"],
      hours: "09:00–22:00, 7 giorni su 7",
      phone: "06 40400860",
      email: "supporto@lottomatica.com",
      note: "La live chat è disponibile dopo l'accesso al conto.",
    },
    apps: { ios: "https://apps.apple.com/it/app/ltmc-scommesse/id1620013330", android: "apk" },
    limits: { maxWin: "50.000 € per scommesse singole e multiple" },
    sources: [
      { label: "Contatti", url: "https://www.lottomatica.it/guida/contatti" },
      {
        label: "Regolamento generale scommesse",
        url: "https://www.lottomatica.it/guida/scommesse-regolamento-generale",
      },
      { label: "App", url: "https://www.lottomatica.it/app/tutte" },
    ],
    checkedAt: CHECKED,
  },
  eurobet: {
    support: {
      channels: ["Live chat", "Email"],
      hours: "Chat: risposta tra le 9:00 e le 21:00",
      note: "La chat è riservata ai clienti dopo l'accesso al conto.",
    },
    apps: {
      ios: "https://eurobet-sport.onelink.me/LBbU/600f8855",
      android: "https://eurobet-sport.onelink.me/LBbU/600f8855",
    },
    sources: [
      { label: "Contatti", url: "https://www.eurobet.it/it/guide/informazioni/contatti" },
      { label: "App scommesse (iOS e Android)", url: "https://www.eurobet.it/it/app/scommesse/app-scommesse/" },
    ],
    checkedAt: CHECKED,
  },
  sisal: {
    support: {
      channels: ["Live chat", "Numero verde", "Richiamata", "Email"],
      hours: "24 ore su 24, 7 giorni su 7",
      phone: "800 999 445 (gratuito; dall'estero +39 02 82900563)",
      email: "info@sisal.it",
    },
    apps: {
      ios: "https://apps.apple.com/it/app/sisal-scommesse-sportive/id525415975",
      android: "https://www.sisal.it/app-mobile",
    },
    sources: [
      { label: "Contatti", url: "https://www.sisal.it/contatti" },
      { label: "App", url: "https://www.sisal.it/app-mobile" },
      { label: "App Store", url: "https://apps.apple.com/it/app/sisal-scommesse-sportive/id525415975" },
    ],
    checkedAt: CHECKED,
  },
  bwin: {
    apps: { ios: "https://www.bwin.it/it/p/sports-app", android: "https://www.bwin.it/it/p/sports-app" },
    sources: [{ label: "App scommesse (Android e iOS)", url: "https://www.bwin.it/it/p/sports-app" }],
    checkedAt: CHECKED,
  },
  bet365: {
    support: {
      channels: ["Live chat", "Modulo online", "Posta"],
      hours: "Live chat 24 ore su 24, 7 giorni su 7",
    },
    apps: { ios: "https://apps.apple.com/it/app/bet365-scommesse-sportive/id519684662" },
    sources: [
      { label: "Contattaci", url: "https://help.bet365.it/s/it-it/contact-us" },
      { label: "App Store", url: "https://apps.apple.com/it/app/bet365-scommesse-sportive/id519684662" },
    ],
    checkedAt: CHECKED,
  },
  betsson: {
    support: {
      channels: ["Live chat", "Email", "WhatsApp"],
      hours: "24 ore su 24, 7 giorni su 7",
      phone: "WhatsApp +356 79769800",
    },
    apps: { ios: "https://apps.apple.com/it/app/betsson-sportsbook-casin%C3%B2/id6478149161" },
    sources: [
      { label: "Centro assistenza", url: "https://support.betsson.it/" },
      { label: "App Store", url: "https://apps.apple.com/it/app/betsson-sportsbook-casin%C3%B2/id6478149161" },
    ],
    checkedAt: CHECKED,
  },
  admiralbet: {
    support: {
      channels: ["Numero verde", "Email"],
      hours: "08:00–21:00, tutti i giorni",
      phone: "800 213 191",
      email: "supporto@admiralbet.it",
    },
    apps: { ios: "https://apps.apple.com/it/app/admiralbet-casino-e-scommesse/id1629631267" },
    sources: [
      { label: "Servizio clienti", url: "https://www.admiralbet.it/help/info-generali/servizio-clienti" },
      { label: "App Store", url: "https://apps.apple.com/it/app/admiralbet-casino-e-scommesse/id1629631267" },
    ],
    checkedAt: CHECKED,
  },
  leovegas: {
    support: { channels: ["Live chat", "Email"], email: "support-it@leovegas.com" },
    apps: { ios: "https://apps.apple.com/it/app/leovegas-casino-con-soldi-veri/id1499499692" },
    sources: [
      { label: "Assistenza", url: "https://www.leovegas.it/assistenza" },
      { label: "App Store", url: "https://apps.apple.com/it/app/leovegas-casino-con-soldi-veri/id1499499692" },
    ],
    checkedAt: CHECKED,
  },
  "888": {
    support: {
      channels: ["Live chat (messaggi)"],
      note: "Dal centro assistenza, dall'area del conto o dal menu dell'app, con \"Inviaci un messaggio\".",
    },
    apps: { ios: "https://apps.apple.com/it/app/888-sport-scommesse-sportive/id1055294694/" },
    sources: [
      {
        label: "Come contattarci",
        url: "https://help.888casino.it/hc/it-it/articles/19974205606941-Come-posso-contattarvi/",
      },
      { label: "App Store", url: "https://apps.apple.com/it/app/888-sport-scommesse-sportive/id1055294694/" },
    ],
    checkedAt: CHECKED,
  },
  codere: {
    apps: { ios: "https://apps.apple.com/it/app/360bet/id6473166933", android: "apk" },
    sources: [{ label: "Link alle app nel sito", url: "https://www.codere.it/" }],
    checkedAt: CHECKED,
  },
};

export const profileOf = (id: string): OperatorProfile | undefined => operatorProfiles[id];
