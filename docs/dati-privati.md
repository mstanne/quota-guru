# Dati del sito in un repository privato

I dati scaricati da API-Football e API-NBA (API-Sports) non possono essere ridistribuiti. Fino a novembre 2026 la
copia permanente dei dati stava nel branch `dati` di questo repository, che è **pubblico**: chiunque poteva
scaricarla. Ora sta nel branch `dati` del repository **privato** `mstanne/quota-guru-dati`.

Cosa cambia:

- `scripts/data-branch.sh` legge e salva solo nel repository privato, con il segreto `DATI_TOKEN`. Senza il
  segreto non salva nulla (mai più nel repository pubblico). Finché il repository privato è vuoto, il ripristino
  legge ancora il vecchio branch pubblico, solo in lettura, se esiste.
- Canale Telegram e video delle partite leggono `football.json` / `basket.json` dal repository privato.
- `scripts/tv-schedule.mjs` (agente delle offerte sul PC) scarica i dati dal repository privato con l'account
  GitHub già collegato sul PC: non serve più `git fetch origin dati`.
- Le pagine delle stagioni passate (`src/data/seasons/`, costruite dall'archivio API-Football) non sono più nel
  repository: le crea la build a ogni aggiornamento. `index.json` committato è vuoto.
- Le Actions restano nel repository pubblico: i minuti restano gratuiti.

## Passi (una volta)

1. **Repository privato.** GitHub → **+** in alto a destra → **New repository** → nome `quota-guru-dati`, owner
   `mstanne`, **Private**, nessun README/licenza/.gitignore → **Create repository**.
2. **Token.** GitHub → foto profilo → **Settings** → **Developer settings** → **Personal access tokens** →
   **Fine-grained tokens** → **Generate new token**:
   - nome `quota-guru-dati`, scadenza a scelta (alla scadenza va rigenerato e aggiornato il segreto);
   - **Repository access** → **Only select repositories** → `quota-guru-dati`;
   - **Permissions** → **Repository permissions** → **Contents** → **Read and write**;
   - **Generate token** e copia il valore (si vede una volta sola).
3. **Segreto.** Repository `quota-guru` → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret** → nome `DATI_TOKEN`, valore il token → **Add secret**.
4. Unisci la pull request.
5. **Copia della cronologia** (facoltativa): **Actions** → **Sposta dati nel repository privato** →
   **Run workflow**. Copia il vecchio branch con tutta la sua storia.
6. **Primo salvataggio**: **Actions** → **Deploy to GitHub Pages** → **Run workflow** _senza_ "rapido". Nel log del
   passo _Save to the data branch_ deve comparire `Dati salvati nel branch dati di mstanne/quota-guru-dati` (o
   `Dati invariati` se il passo 5 ha già copiato tutto). Su GitHub il repository `quota-guru-dati` mostra i file.
7. **Cancella il vecchio branch pubblico**: repository `quota-guru` → **Code** → **Branches** → riga `dati` →
   cestino. Da qui i dati non sono più scaricabili da questo repository.
8. **PR da fork**: **Settings** → **Actions** → **General** → _Fork pull request workflows from outside
   collaborators_ → **Require approval for all external contributors** → **Save**. Una pull request da un fork
   potrebbe altrimenti leggere la cache dei workflow, che contiene dati delle API.

## Limiti

- Chi ha già scaricato il repository o il branch `dati` prima della cancellazione ne conserva la copia.
- La cronologia del ramo `main` contiene ancora le vecchie versioni delle pagine delle stagioni passate; i commit del
  branch cancellato possono restare raggiungibili per un po' tramite il loro identificativo. Per eliminarli del tutto
  serve rendere privato anche questo repository o chiedere la pulizia al supporto GitHub.
- Il sito pubblicato mostra i dati (è l'uso previsto dalla licenza): questo cambia solo dove sta la copia grezza.
