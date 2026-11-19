# Dataset dei pronostici fuori dal sito (GitHub, Zenodo, Kaggle, Hugging Face)

Ogni mese il workflow **Dataset pronostici** (`.github/workflows/dataset.yml`) pubblica l'archivio dei pronostici
come dataset, con descrizione, licenza CC BY-NC 4.0 e link al sito. Lo scopo: rendere Quota Guru una fonte citabile
(DOI di Zenodo, Google Dataset Search, cataloghi usati da ricercatori e AI).

## Cosa contiene

`scripts/export-dataset.mjs` legge la **copia pubblica** dell'archivio (branch `archivio-pronostici`, già senza id:
`docs/archivio-pronostici.md`) e scrive:

- `data/calcio.csv`, `data/nba.csv` (e gli stessi in JSON): una riga per partita, con colonne scritte una per una
  dallo script. Squadre come semplici nomi, risultato come due numeri; nessun id, logo o struttura delle risposte del
  fornitore dei dati, e nessun fornitore citato come fonte. Data, squadre e risultato sono fatti pubblici, fuori dalla
  licenza.
- `README.md` (anche scheda del dataset su Hugging Face), `LICENSE.md`, `CITATION.cff`, `.zenodo.json`,
  `dataset-metadata.json` (Kaggle; licenza "other" perché Kaggle non ha CC BY-NC 4.0 tra le sue, la licenza è scritta
  nella descrizione).
- Solo **mesi chiusi**: il 2 di ogni mese esce la versione con il mese appena finito (es. `v2026.11`). Una versione
  pubblicata non cambia più.

## Da fare una volta

1. **Repository GitHub.** GitHub → **+** → **New repository** → owner `mstanne`, nome `quota-guru-pronostici`,
   **Public**, nessun README/licenza/.gitignore → **Create repository**.
2. **Token.** Il modo più rapido: GitHub → foto profilo → **Settings** → **Developer settings** → **Personal access
   tokens** → **Fine-grained tokens** → il token di `DATI_TOKEN` → **Edit** → **Repository access** → aggiungi
   `quota-guru-pronostici` → **Update**. Permesso **Contents: Read and write** (c'è già). In alternativa un token
   nuovo solo per quel repository, salvato come segreto `DATASET_TOKEN`.
3. **Zenodo** (prima della prima release, altrimenti quella release non riceve il DOI): https://zenodo.org → **Log in**
   → **Log in with GitHub** → menu dell'account → **GitHub** → **Sync now** → accendi l'interruttore di
   `mstanne/quota-guru-pronostici`. Da lì ogni release riceve un DOI, più un DOI fisso per tutte le versioni.
   Attenzione: su Zenodo una versione con DOI in pratica non si cancella più.
4. **Kaggle** (facoltativo): https://www.kaggle.com → account → **Settings** → **API** → **Create New Token**. Dal file
   `kaggle.json` scaricato: repository `quota-guru` → **Settings** → **Secrets and variables** → **Actions** →
   segreti `KAGGLE_USERNAME` (il campo `username`) e `KAGGLE_KEY` (il campo `key`). Il primo giro crea il dataset
   `<username>/quota-guru-pronostici`, i successivi aggiungono versioni.
5. **Hugging Face** (facoltativo): https://huggingface.co → account (o un'organizzazione `quotaguru`) → **Settings** →
   **Access Tokens** → token **Write** → segreto `HF_TOKEN`; poi **Variables** → variabile `HF_DATASET` con il nome
   del dataset, es. `quotaguru/quota-guru-pronostici`.
6. **Prova:** **Actions** → **Dataset pronostici** → **Run workflow** con "Solo prova" spuntato: crea i file senza
   pubblicarli e li allega all'esecuzione (artifact `dataset`) da scaricare e controllare.
7. **Prima pubblicazione:** il 2 dicembre parte da sola con ottobre e novembre. Per pubblicare prima: **Run workflow**
   con "Ultimo mese incluso" `2026-10` (solo ottobre).

Ogni destinazione senza il suo segreto viene saltata con un avviso: si possono attivare una alla volta.

## Dopo la prima release

Il DOI è nella pagina della release su Zenodo. Con DOI e indirizzi di Kaggle e Hugging Face si aggiungono al sito:
`identifier` e `sameAs` nei dati strutturati Dataset di `/bilancio-pronostici` (`src/lib/trackRecordMeta.ts`), un
riquadro "Come citare" e una riga in `llms.txt`.
