// Title, description, lead sentence and structured data (Dataset) of the track record page /bilancio-pronostici.
import type { TrackRecord } from "./trackRecord";
import { footballTrackRecord } from "./trackRecordFootball";
import { nbaTrackRecord } from "./trackRecordNba";
import { formatShortDate } from "./footballCore";
import { PREDICTIONS_LICENSE } from "./archiveLicense.mjs";

export const TRACK_RECORD_PATH = "/bilancio-pronostici";
export const ARCHIVE_FILES = [
  { name: "Archivio pronostici calcio (JSON)", url: "/dati/archivio-pronostici-calcio.json" },
  { name: "Archivio pronostici NBA (JSON)", url: "/dati/archivio-pronostici-nba.json" },
];

const rate = (x: { n: number; hits: number }) => (x.n ? Math.round((x.hits / x.n) * 100) : 0);

function sportSentence(name: string, r: TrackRecord) {
  const since = r.source === "archivio" && r.since ? ` dal ${formatShortDate(r.since)}` : "";
  const what = r.source === "archivio" ? "pronostici pubblicati" : "partite ricalcolate";
  return `${name}: ${rate(r.all)}% di esiti più probabili azzeccati (${r.all.hits} su ${r.all.n} ${what}${since}), ${rate(r.last30)}% negli ultimi 30 giorni`;
}

/** The figures in one sentence (page lead and description). */
export function trackLead(football: TrackRecord, nba: TrackRecord) {
  const parts = [sportSentence("Calcio", football)];
  if (nba.all.n) parts.push(sportSentence("NBA", nba));
  return `Il bilancio dei pronostici di QuotaGuru, aggiornato a ogni partita. ${parts.join(". ")}.`;
}

export function trackRecordMeta() {
  const football = footballTrackRecord();
  const nba = nbaTrackRecord();
  const description = `Calcio ${rate(football.all)}% e NBA ${rate(nba.all)}% di esiti più probabili azzeccati: il bilancio di tutti i pronostici di QuotaGuru per competizione e mese, con l'archivio da scaricare.`;
  const dates = [...football.recent, ...nba.recent].map((e) => e.utcDate).sort();
  const since = [football.since, nba.since].filter(Boolean).sort()[0] ?? dates[0];
  return {
    path: TRACK_RECORD_PATH,
    title: "Bilancio dei pronostici: quanti ne azzecchiamo",
    description,
    jsonLd: [
      {
        "@type": "Dataset",
        "@id": `${TRACK_RECORD_PATH}#archivio`,
        name: "Archivio dei pronostici di QuotaGuru (calcio e NBA)",
        description: `${trackLead(football, nba)} Ogni pronostico pubblicato, con probabilità, risultato ed esito.`,
        url: TRACK_RECORD_PATH,
        inLanguage: "it-IT",
        isAccessibleForFree: true,
        // the predictions only: the match data inside come from API-Football and may not be reproduced
        license: PREDICTIONS_LICENSE.url,
        creditText: "QuotaGuru (www.quotaguru.it)",
        keywords: ["pronostici calcio", "pronostici NBA", "track record", "probabilità", "modello statistico"],
        creator: { "@id": "/#organizzazione" },
        temporalCoverage: since ? `${since.slice(0, 10)}/..` : undefined,
        variableMeasured: ["probabilità 1X2", "esito più probabile", "risultato finale", "pronostico azzeccato"],
        distribution: ARCHIVE_FILES.map((f) => ({
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: f.url,
          name: f.name,
        })),
      },
    ],
  };
}
