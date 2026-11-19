// Terms of the downloadable archive of predictions (public/dati/archivio-pronostici-*.json and the public copy in
// the `archivio-pronostici` branch, the external dataset of scripts/export-dataset.mjs, docs/archivio-pronostici.md).
// The predictions are QuotaGuru's own work, licensed CC BY-NC 4.0; date, teams and final score of each match are
// public facts, outside the licence. The public files carry only those facts as plain text: no ids, logos or
// response structure of the data provider (docs/archivio-pronostici.md).
// Shared by the build scripts and the site (track record page, structured data, llms.txt).
export const PREDICTIONS_LICENSE = {
  name: "CC BY-NC 4.0",
  url: "https://creativecommons.org/licenses/by-nc/4.0/deed.it",
};
export const ARCHIVE_TERMS =
  "I pronostici (probabilità, esiti indicati, bilancio) sono di QuotaGuru e sono rilasciati con licenza Creative Commons " +
  "Attribuzione - Non commerciale 4.0 (CC BY-NC 4.0): si possono riutilizzare per scopi non commerciali citando " +
  "QuotaGuru con un link a www.quotaguru.it. Data, squadre e risultato finale delle partite sono fatti pubblici e " +
  "non sono coperti dalla licenza.";
