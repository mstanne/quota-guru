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
  /** Per-method table, as published in the operator's payment pages. "—" = not available for that operation. */
  payments?: { method: string; deposit: string; withdrawal: string; withdrawalTime: string; fee?: string }[];
  /** One-line notes shown under the payments table (weekly caps, conditions). */
  paymentNotes?: string[];
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
    payments: [
      {
        method: "Carta di credito/debito",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Apple Pay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Google Pay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Postepay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "PayPal",
        deposit: "10 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Skrill",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Neteller",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "MuchBetter",
        deposit: "1 – 2.000 €",
        withdrawal: "30 – 2.000 €",
        withdrawalTime: "Immediato",
        fee: "Gratis",
      },
      {
        method: "Rapid Transfer",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 1.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Paysafecard / myPaysafe",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      { method: "Onshop", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Titolo di ricarica (punti vendita)", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Ricarica digitale", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico bancario",
        deposit: "5 – 100.000 €",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "48-72 ore lavorative",
        fee: "Gratis",
      },
      { method: "Bonifico postale", deposit: "da 5 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Bollettino postale", deposit: "da 5 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico istantaneo",
        deposit: "—",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "Immediato",
        fee: "Gratis",
      },
      {
        method: "Bonifico domiciliato",
        deposit: "—",
        withdrawal: "10 – 6.000 €",
        withdrawalTime: "Ritiro in posta dopo 3-4 giorni lavorativi",
        fee: "Gratis",
      },
      {
        method: "MuchBetter Punto Vendita",
        deposit: "—",
        withdrawal: "10 – 4.999 €",
        withdrawalTime: "Immediato",
        fee: "Gratis",
      },
    ],
    paymentNotes: [
      "Depositi senza commissioni, tranne bonifico, bonifico postale e bollettino (eventuali spese della banca o di Poste). Prelievi senza commissioni.",
    ],
    sources: [
      { label: "Depositi", url: "https://www.planetwin365.it/guida/depositi" },
      { label: "Prelievi", url: "https://www.planetwin365.it/guida/prelievi" },
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
    payments: [
      {
        method: "Carta di credito/debito",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente 24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Quick2Cash",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Apple Pay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente 24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Google Pay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Postepay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente 24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "PayPal",
        deposit: "10 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Skrill",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Neteller",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "MuchBetter",
        deposit: "1 – 2.000 €",
        withdrawal: "30 – 2.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Rapid Transfer",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 1.000 €",
        withdrawalTime: "Generalmente entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Paysafecard / myPaysafe",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      { method: "Onshop", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Titolo di ricarica (punti vendita)", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Ricarica digitale", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico bancario",
        deposit: "5 – 100.000 €",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "48-72 ore lavorative",
        fee: "Gratis",
      },
      { method: "Bonifico postale", deposit: "da 5 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Bollettino postale", deposit: "da 5 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Epay", deposit: "10 – 100 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico istantaneo",
        deposit: "—",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Bonifico domiciliato",
        deposit: "—",
        withdrawal: "10 – 6.000 €",
        withdrawalTime: "Ritiro in posta dopo 3-4 giorni lavorativi",
        fee: "Gratis",
      },
      {
        method: "MuchBetter Punto Vendita",
        deposit: "—",
        withdrawal: "10 – 4.999 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Sonect",
        deposit: "—",
        withdrawal: "20 – 250 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
    ],
    paymentNotes: [
      "Depositi senza commissioni, tranne bonifico, bonifico postale e bollettino (eventuali spese della banca o di Poste). Prelievi senza commissioni.",
    ],
    sources: [
      { label: "Depositi", url: "https://www.goldbet.it/guida/depositi" },
      { label: "Prelievi", url: "https://www.goldbet.it/guida/prelievi" },
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
    payments: [
      {
        method: "Carta di credito/debito",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente 24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Quick2Cash",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Apple Pay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente 24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Google Pay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "Postepay",
        deposit: "10 – 2.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Generalmente 24-48 ore lavorative",
        fee: "Gratis",
      },
      {
        method: "PayPal",
        deposit: "10 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Skrill",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Neteller",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "MuchBetter",
        deposit: "1 – 2.000 €",
        withdrawal: "30 – 2.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Rapid Transfer",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 1.000 €",
        withdrawalTime: "Generalmente entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Paysafecard / myPaysafe",
        deposit: "30 – 1.000 €",
        withdrawal: "10 – 2.000 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      { method: "Onshop", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Titolo di ricarica (punti vendita)", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Ricarica digitale", deposit: "2 – 4.999 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico bancario",
        deposit: "5 – 100.000 €",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "48-72 ore lavorative",
        fee: "Gratis",
      },
      { method: "Bonifico postale", deposit: "da 5 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Bollettino postale", deposit: "da 5 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Epay", deposit: "10 – 100 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico istantaneo",
        deposit: "—",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Bonifico domiciliato",
        deposit: "—",
        withdrawal: "10 – 6.000 €",
        withdrawalTime: "Ritiro in posta dopo 3-4 giorni lavorativi",
        fee: "Gratis",
      },
      {
        method: "MuchBetter Punto Vendita",
        deposit: "—",
        withdrawal: "10 – 4.999 €",
        withdrawalTime: "Entro 24 ore",
        fee: "Gratis",
      },
      {
        method: "Sonect",
        deposit: "—",
        withdrawal: "20 – 250 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
    ],
    paymentNotes: [
      "Depositi senza commissioni, tranne bonifico, bonifico postale e bollettino (eventuali spese della banca o di Poste). Prelievi senza commissioni.",
    ],
    sources: [
      { label: "Strumenti di ricarica", url: "https://www.lottomatica.it/guida/ricarica/strumenti-di-ricarica" },
      { label: "Strumenti di prelievo", url: "https://www.lottomatica.it/guida/prelievo/strumenti-di-prelievo" },
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
    payments: [
      {
        method: "Visa / Mastercard / Maestro",
        deposit: "da 10 €",
        withdrawal: "5 – 6.000 €",
        withdrawalTime: "Sulla carta entro 2-10 giorni",
        fee: "Gratis",
      },
      {
        method: "Postepay",
        deposit: "da 10 €",
        withdrawal: "5 – 6.000 €",
        withdrawalTime: "Sulla carta entro 2-10 giorni",
        fee: "Gratis",
      },
      {
        method: "PayPal",
        deposit: "da 10 €",
        withdrawal: "5 – 6.000 €",
        withdrawalTime: "Entro 1 giorno lavorativo",
        fee: "Gratis",
      },
      {
        method: "Skrill",
        deposit: "da 10 €",
        withdrawal: "5 – 5.000 €",
        withdrawalTime: "Entro 1 giorno lavorativo",
        fee: "Gratis",
      },
      {
        method: "Neteller",
        deposit: "da 10 € (primo versamento max 100 €)",
        withdrawal: "5 – 5.000 €",
        withdrawalTime: "Entro 1 giorno lavorativo",
        fee: "Gratis",
      },
      { method: "Apple Pay", deposit: "da 10 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Paysafecard", deposit: "da 10 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "MyBank", deposit: "da 10 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Admiral Pay",
        deposit: "da 10 €",
        withdrawal: "5 – 5.000 €",
        withdrawalTime: "Immediato",
        fee: "Gratis",
      },
      { method: "Ricarica Eurobet (punti vendita)", deposit: "da 5 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Buono Onshop", deposit: "da 10 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "Bollettino postale", deposit: "da 5 € (spese postali)", withdrawal: "—", withdrawalTime: "—" },
      { method: "Postagiro", deposit: "da 10 € (spese postali)", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico istantaneo (SEPA)",
        deposit: "—",
        withdrawal: "5 – 100.000 €",
        withdrawalTime: "Pochi minuti se la banca riceve bonifici istantanei",
        fee: "Gratis",
      },
      {
        method: "Bonifico domiciliato",
        deposit: "—",
        withdrawal: "25 – 6.000 €",
        withdrawalTime: "Ritiro in posta entro 3-5 giorni lavorativi",
        fee: "Gratis",
      },
      {
        method: "Assegno vidimato",
        deposit: "—",
        withdrawal: "25 – 6.000 €",
        withdrawalTime: "Ritiro in posta entro 10 giorni lavorativi",
        fee: "Gratis",
      },
    ],
    paymentNotes: [
      "La pagina dei depositi indica solo l'importo minimo. Si possono prelevare solo vincite e rimborsi, non gli importi depositati e non giocati.",
    ],
    sources: [
      { label: "Deposito", url: "https://www.eurobet.it/it/guide/conto-di-gioco/deposito" },
      { label: "Prelievo", url: "https://www.eurobet.it/it/guide/conto-di-gioco/prelievo" },
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
    payments: [
      {
        method: "Visa / Mastercard",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato*",
        fee: "Gratis",
      },
      {
        method: "Postepay",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato*",
        fee: "Gratis",
      },
      {
        method: "Apple Pay",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "PayPal",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Skrill",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Neteller",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      { method: "Paysafecard", deposit: "10 – 1.000 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "MyBank", deposit: "10 – 10.000 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico istantaneo",
        deposit: "—",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Bonifico bancario",
        deposit: "fino a 50.000 €",
        withdrawal: "10 – 100.000 €",
        withdrawalTime: "1-2 giorni lavorativi",
        fee: "Gratis",
      },
      { method: "Punti vendita Sisal", deposit: "1 – 4.999 € al giorno", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Istituti di pagamento",
        deposit: "10 – 999 €",
        withdrawal: "10 – 4.999 €",
        withdrawalTime: "Autorizzazione generalmente immediata",
        fee: "Gratis",
      },
      {
        method: "Domiciliazione postale",
        deposit: "—",
        withdrawal: "10 – 6.000 €",
        withdrawalTime: "4-5 giorni lavorativi",
        fee: "Gratis",
      },
    ],
    paymentNotes: [
      "Ricariche: massimo 50.000 € ogni 7 giorni; nei punti vendita 999 € al giorno se il documento non è stato inviato o è scaduto.",
      "* Carte: accredito immediato se la banca aderisce ai pagamenti in tempo reale di Visa e Mastercard, altrimenti 2-3 giorni; con controlli a campione fino a 12 ore o 3-5 giorni.",
    ],
    sources: [
      { label: "FAQ ricariche", url: "https://www.sisal.it/faq/ricariche" },
      { label: "FAQ prelievi", url: "https://www.sisal.it/faq/prelievi" },
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
      channels: ["Live chat", "Numero verde", "Richiesta di chiamata", "Email", "WhatsApp"],
      hours: "24 ore su 24, 7 giorni su 7",
      phone: "800 819 577 (numero verde); WhatsApp +356 79769800",
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
  snai: {
    support: {
      channels: ["Live chat", "Assistente automatico", "Email"],
      hours: "Live chat con operatore 9:00–24:00 tutti i giorni; assistente automatico 24 ore su 24",
      email: "info@snai.it",
    },
    apps: {
      ios: "https://apps.apple.com/it/app/snai-sport-scommesse-sportive/id518361690",
      android: "https://www.snai.it/app/sport",
    },
    payments: [
      {
        method: "Visa / Mastercard",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato*",
        fee: "Gratis",
      },
      {
        method: "Postepay",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Apple Pay",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "PayPal",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Skrill",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Neteller",
        deposit: "10 – 10.000 €",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      { method: "Paysafecard", deposit: "10 – 1.000 €", withdrawal: "—", withdrawalTime: "—" },
      { method: "MyBank", deposit: "10 – 10.000 €", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Bonifico istantaneo",
        deposit: "—",
        withdrawal: "10 – 5.000 €",
        withdrawalTime: "Generalmente immediato",
        fee: "Gratis",
      },
      {
        method: "Bonifico bancario",
        deposit: "fino a 50.000 €",
        withdrawal: "10 – 30.000 €",
        withdrawalTime: "1-2 giorni lavorativi",
        fee: "Gratis",
      },
      { method: "Punti vendita Snai", deposit: "1 – 4.999 € al giorno", withdrawal: "—", withdrawalTime: "—" },
      {
        method: "Istituti di pagamento",
        deposit: "10 – 999 €",
        withdrawal: "10 – 4.999 €",
        withdrawalTime: "Autorizzazione generalmente immediata",
        fee: "Gratis",
      },
      {
        method: "Domiciliazione postale",
        deposit: "—",
        withdrawal: "10 – 6.000 €",
        withdrawalTime: "4-5 giorni lavorativi",
        fee: "Gratis",
      },
    ],
    paymentNotes: [
      "Ricariche: massimo 50.000 € ogni 7 giorni; nei punti vendita 999 € al giorno se il documento non è stato inviato o è scaduto.",
      "Istituti di pagamento: massimo 999 € al giorno, 4.999 € in 7 giorni e 9.999 € in 30 giorni.",
      "* Carte: accredito immediato se la banca aderisce ai pagamenti in tempo reale di Visa e Mastercard, altrimenti 2-3 giorni; con controlli a campione fino a 12 ore o 3-5 giorni.",
    ],
    sources: [
      { label: "FAQ ricariche", url: "https://www.snai.it/faq/ricariche" },
      { label: "FAQ prelievi", url: "https://www.snai.it/faq/prelievi" },
      { label: "Contatti", url: "https://www.snai.it/contatti" },
      { label: "App sport", url: "https://www.snai.it/app/sport" },
      { label: "App Store", url: "https://apps.apple.com/it/app/snai-sport-scommesse-sportive/id518361690" },
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
