# Statistiche del sito (GA4 e Search Console)

Ogni lunedì `.github/workflows/analytics.yml` scarica gli ultimi 28 giorni di Google Analytics 4 (visitatori, pagine,
canali, eventi) e di Search Console (ricerche Google, impressioni, clic, posizione, sitemap) e li salva nel ramo
`statistiche-sito` (`ultimo/` e `storico/<data>/`). Solo lettura: non cambia nulla su Google. Nel riepilogo, sotto i
totali dei 28 giorni di GA4 e di Search Console c'è anche la riga degli ultimi 7 giorni, per vedere com'è andata la
settimana (per Search Console sono gli ultimi 7 giorni con dati, circa 3 giorni indietro).
Script: `scripts/fetch-site-analytics.mjs`. Avvio: worker live (lunedì 05:37 UTC), cron di riserva, o a mano da
Actions → **Statistiche sito** → *Run workflow*.

## Messa in funzione (una volta, meglio dal computer)

### 1. Account di servizio Google
1. <https://console.cloud.google.com> con lo stesso account Google di Analytics → in alto *Seleziona progetto* →
   **Nuovo progetto** → nome `quotaguru-statistiche` → *Crea*, poi selezionalo.
2. Menu → *API e servizi* → **Libreria**: cerca e **abilita** `Google Analytics Data API` e `Google Search Console API`.
3. Menu → *IAM e amministrazione* → **Account di servizio** → *Crea account di servizio* → nome
   `quotaguru-statistiche` → *Crea e continua* → nessun ruolo → *Fine*.
4. Copia l'**email** dell'account (`quotaguru-statistiche@….iam.gserviceaccount.com`).
5. Aprilo → scheda **Chiavi** → *Aggiungi chiave* → *Crea nuova chiave* → **JSON** → *Crea*: si scarica un file `.json`.
   È una password: non condividerlo e non metterlo nel repository.

### 2. Accesso a Google Analytics
GA4 → **Amministrazione** → *Proprietà* → **Gestione dell'accesso alla proprietà** → **+** → *Aggiungi utenti* →
email del punto 1.4 → ruolo **Visualizzatore** → *Aggiungi*.
Nella stessa colonna, **Dettagli della proprietà**: copia l'**ID proprietà** (solo numeri).

### 3. Accesso a Search Console
Search Console (proprietà `quotaguru.it`) → **Impostazioni** → **Utenti e autorizzazioni** → *Aggiungi utente* →
email del punto 1.4 → autorizzazione **Limitato** → *Aggiungi*.

### 4. GitHub
Repository → *Settings* → *Secrets and variables* → *Actions*:
- scheda **Secrets** → *New repository secret* `GOOGLE_SERVICE_ACCOUNT_JSON` = **tutto** il contenuto del file `.json`
  (aprilo con il Blocco note, *Ctrl+A*, *Ctrl+C*, incolla).
- scheda **Variables** → *New repository variable* `GA4_PROPERTY_ID` = l'ID del punto 2.

Poi *Actions* → **Statistiche sito** → *Run workflow*. Il riepilogo del run mostra i numeri principali; se qualcosa
manca, la sezione *Problemi* dice cosa (di solito un accesso non ancora concesso: riprova dopo qualche minuto).

Facoltativo: variabile `GSC_SITE` se la proprietà Search Console non è `sc-domain:quotaguru.it`.

## Clic verso i bookmaker

Il riepilogo ha la sezione **Clic verso i bookmaker**, con i clic sui pulsanti "Vai al sito" (evento `outbound_click`)
degli ultimi 28 e 7 giorni, divisi per operatore, posizione del pulsante e pagina di partenza. Per avere il dettaglio,
in GA4 → **Amministrazione** → *Definizioni personalizzate* → **Crea dimensione personalizzata** vanno create tre
dimensioni con ambito **Evento**, con parametro `operator`, `placement` e `page`. Finché mancano, il riepilogo
mostra solo il totale e una nota. I clic registrati prima della loro creazione compaiono come "(not set)".
Lo stesso riepilogo arriva ogni lunedì per email con un'attività pianificata di Claude, fuori dal repository.
