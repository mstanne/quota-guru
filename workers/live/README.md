# Servizio dati live (Cloudflare Worker)

Aggiorna da sole, ogni 30 secondi, le pagine delle partite in corso: punteggio e minuto, cronaca (gol, cartellini,
cambi, VAR), formazioni ufficiali e statistiche. Sostituisce i widget SofaScore: nessun sito esterno, nessun cookie,
contenuto nel tema del sito.

- `src/index.mjs`: il worker. Ogni minuto, solo se ci sono partite da 75 minuti prima del calcio d'inizio alla fine,
  chiede ad API-Football le partite delle competizioni del sito (10 per richiesta) e le espone in
  `GET /match/<id API-Football>`. La chiave API resta nel worker. Tetto: 3.000 richieste al giorno (`wrangler.toml`).
- `GET /stato`: ultimo aggiornamento, richieste usate oggi, partite in calendario.
- Pagina partita: `src/components/calcio/LiveMatch.tsx` (si attiva con la variabile `LIVE_URL`).

## Messa in funzione (una volta)

1. **Account Cloudflare** gratuito su <https://dash.cloudflare.com/sign-up>. Il piano gratuito dei Workers basta per
   partire (100.000 richieste al giorno); con molto traffico sulle partite serve il piano Workers Paid (5 $ al mese).
2. **Account ID**: dashboard → *Workers & Pages* → colonna di destra, *Account ID*. Copialo.
3. **Token API**: *My Profile* → *API Tokens* → *Create Token* → modello **Edit Cloudflare Workers** → *Continue to
   summary* → *Create Token*. Copialo subito (non si rivede).
4. Su GitHub, nel repository: *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:
   - `CLOUDFLARE_API_TOKEN` = il token del punto 3
   - `CLOUDFLARE_ACCOUNT_ID` = l'Account ID del punto 2
5. *Actions* → **Live worker** → *Run workflow*. Al termine il riepilogo del run mostra l'indirizzo del worker
   (`https://quotaguru-live.<nome-account>.workers.dev`). La prima volta Cloudflare può chiedere di scegliere il
   sottodominio `workers.dev` dalla dashboard (*Workers & Pages*): se il run fallisce per questo, sceglilo e rilancia.
6. *Settings* → *Secrets and variables* → *Actions* → scheda **Variables** → *New repository variable*:
   `LIVE_URL` = l'indirizzo del punto 5. Dal prossimo aggiornamento del sito le pagine partita usano il servizio e
   SofaScore non compare più. Per tornare a SofaScore basta cancellare la variabile.

7. **Avvio puntuale degli aggiornamenti del sito (consigliato).** GitHub avvia i workflow programmati "quando può":
   nei momenti di carico li ritarda o li salta (il 2 novembre 2026 *Live scores*, previsto ogni 15 minuti, è partito
   due volte in tutto il giorno). Il worker, che gira ogni minuto, li avvia lui: *Live scores* ai minuti 00/15/30/45 e
   l'aggiornamento completo (*Deploy to GitHub Pages*) alle xx:17 ogni 3 ore (UTC). I `schedule:` di GitHub restano
   come riserva.
   - GitHub → avatar → *Settings* → *Developer settings* → *Personal access tokens* → **Fine-grained tokens** →
     *Generate new token*: *Repository access* → *Only select repositories* → `quota-guru`; *Permissions* →
     *Repository permissions* → **Actions: Read and write** (nient'altro). Scadenza: la più lunga che ti va bene
     (ricordati di rinnovarlo).
   - Nel repository: *Settings* → *Secrets and variables* → *Actions* → *New repository secret*
     `GH_DISPATCH_TOKEN` = il token.
   - *Actions* → **Live worker** → *Run workflow*. Da quel momento nella pagina Actions vedrai i run con evento
     `workflow_dispatch` ogni 15 minuti.

**Server ponte (necessario)**: API-Football limita gli indirizzi condivisi dei Cloudflare Workers, quindi le
richieste passano da un piccolo server con IP dedicato: vedi `server/README.md`.

Facoltativo: indirizzo `live.quotaguru.it` invece di `workers.dev` (richiede di gestire il DNS del dominio su
Cloudflare, oggi è su OVH): non serve per funzionare.

## Prova in locale

```
cd workers/live && npm ci
printf 'API_FOOTBALL_KEY=la-tua-chiave\n' > .dev.vars
npx wrangler dev --test-scheduled
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"   # simula il minuto
curl http://localhost:8787/stato
```
