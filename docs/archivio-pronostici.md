# Archivio dei pronostici: copia privata e copia pubblica

Ogni pronostico pubblicato dal sito viene archiviato (`scripts/archive-predictions.mjs`): il bilancio, le pagine delle
partite giocate, tris, multiple, fantacalcio, il "punto" del lunedì, il canale Telegram e i video lo leggono da lì.

Fino a novembre 2026 l'archivio stava solo nel branch `archivio-pronostici` di questo repository, che è **pubblico**,
con le partite indicizzate dall'identificativo di API-Football / API-NBA. Quegli identificativi vengono dalle API e
non vanno ridistribuiti. Ora le copie sono due (`scripts/archive-branch.sh`):

| | dove | cosa contiene | chi lo usa |
|---|---|---|---|
| **privata** | branch `archivio-pronostici` del repository privato `mstanne/quota-guru-dati` | l'archivio di lavoro: partite indicizzate per id API, `tris.json`, `multiple.json`, `fantacalcio.json`, `punto/`, `correzioni.json` | build del sito, aggiornamento live, controllo delle PR, video, Telegram (segreto `DATI_TOKEN`, lo stesso dei dati) |
| **pubblica** | branch `archivio-pronostici` di questo repository e file `/dati/archivio-pronostici-<sport>.json` del sito | solo i pronostici: data, competizione, partita, link alla pagina, probabilità, esito indicato, ore di pubblicazione, risultato e se era giusto. **Nessun id API** | chiunque: è la prova pubblica e verificabile del bilancio |

La copia pubblica è riscritta a ogni build e aggiunge un commit con l'ora al branch pubblico: la cronologia dei
commit resta la prova di quando ogni pronostico è stato pubblicato. I campi pubblici sono un elenco esplicito
(`PUBLIC_FIELDS` in `scripts/archive-predictions.mjs`): un campo nuovo dell'archivio resta privato finché non lo si
aggiunge lì.

## Passaggio (automatico)

Non serve nessun segreto nuovo: `DATI_TOKEN` ha già accesso in scrittura a `quota-guru-dati`.

1. Unisci la pull request.
2. **Actions** → **Deploy to GitHub Pages** → **Run workflow** (va bene anche l'aggiornamento programmato).
   - Il ripristino non trova il branch privato: prende il branch pubblico con tutta la sua cronologia
     (log: `Archivio privato ancora vuoto: parte dal branch pubblico…`).
   - Il salvataggio crea il branch `archivio-pronostici` in `quota-guru-dati` (log: `Archivio pronostici salvato in
     mstanne/quota-guru-dati`) e **solo dopo** sostituisce il contenuto del branch pubblico con la copia senza id
     (log: `Copia pubblica dell'archivio salvata nel branch archivio-pronostici`).
3. Controlla su GitHub: `quota-guru-dati` → branch `archivio-pronostici` con i file `calcio/AAAA-MM.json` e
   `tris.json`; in `quota-guru` il branch `archivio-pronostici` ha solo `README.md`, `calcio/` e `nba/`, con elenchi
   senza `"id"`.

Se il salvataggio nel repository privato non riesce, il branch pubblico non viene toccato e il giro successivo
riparte da lì: l'archivio non si perde.

## Limiti

- **I commit vecchi del branch pubblico contengono ancora gli id** (fino al passaggio). Non vengono cancellati di
  proposito: riscrivere la cronologia eliminerebbe la prova pubblica delle date di pubblicazione di ottobre e novembre
  2026. Da un id da solo non si ricavano i dati delle API.
- Data, squadre e risultato finale restano nella copia pubblica: sono i fatti che rendono verificabile il bilancio.
  Le condizioni di uso in `src/lib/archiveLicense.mjs` dicono che quei dati non sono coperti dalla licenza CC BY-NC.
