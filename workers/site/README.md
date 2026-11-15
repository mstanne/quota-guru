# Sito su Cloudflare (Worker `quotaguru-site`)

Il sito resta costruito su GitHub Actions come oggi (`deploy.yml` ogni 3 ore e a ogni merge, `live-scores.yml` ogni
15 minuti durante le partite). Cambia solo dove viene pubblicato: invece di GitHub Pages, un Worker Cloudflare con i
soli file statici (nessuno script: le visite non contano come richieste Worker).

- `wrangler.toml`: il Worker. Pagine sconosciute → `404.html` con stato 404; `/calcio` → `/calcio/` come oggi.
- `.github/workflows/cloudflare-site.yml`: prende la build già fatta (lo stesso pacchetto che va su GitHub Pages) e la
  carica con `wrangler deploy`. Carica solo i file cambiati; la nuova versione va online tutta insieme alla fine.
- `public/_headers`: cache di un anno per `/assets/*` (nomi con hash) e `noindex` sull'indirizzo di prova `workers.dev`.
- `dist/_redirects` (scritto da `scripts/prerender.mjs`): gli URL spostati rispondono con un vero **301** invece della
  pagina ponte (che resta, per GitHub Pages e oltre il limite di 2.000 regole).

Tutto si accende con la variabile del repository **`SITO_CLOUDFLARE`**:

| Valore | GitHub Pages | Cloudflare |
| --- | --- | --- |
| (assente) | serve www.quotaguru.it | non usato (situazione di oggi) |
| `prova` | serve www.quotaguru.it | copia identica su `quotaguru-site.<account>.workers.dev`, non indicizzata |
| `attivo` | non più aggiornato | serve www.quotaguru.it |

Per tornare indietro basta rimettere `prova` (o cancellare la variabile) e ripristinare il DNS (sotto, *Ritorno a
GitHub Pages*).

## Perché Workers Paid

Il sito pubblicato ha oltre 20.000 file (15 novembre 2026: 20.308, di cui ~13.000 pagine sotto `/calcio`) e cresce
con l'archivio delle partite. Il piano gratuito accetta al massimo 20.000 file per sito, Workers Paid (5 $ al mese)
100.000. Il workflow scrive nel riepilogo di ogni run quanti file ci sono e avvisa sopra i 90.000.

## Fase 1 – Prova (nessun effetto sul sito pubblico)

1. **Piano**: dashboard Cloudflare → *Workers & Pages* → *Plans* → **Workers Paid**.
2. **Token**: lo stesso segreto `CLOUDFLARE_API_TOKEN` già usato dal live worker e dai video. Per la fase 2 deve poter
   gestire anche il dominio: *My Profile* → *API Tokens* → il token → *Edit* → aggiungi i permessi
   *Zone → Workers Routes → Edit* e *Zone → DNS → Edit*, con *Zone Resources* = `quotaguru.it` (o tutte le zone).
   Modificare i permessi non cambia il valore del token: su GitHub non serve toccare nulla.
3. GitHub → *Settings* → *Secrets and variables* → *Actions* → scheda **Variables** → *New repository variable*:
   `SITO_CLOUDFLARE` = `prova`.
4. *Actions* → **Deploy to GitHub Pages** → *Run workflow* (con *rapido* se i dati sono freschi). Il primo caricamento
   dura di più (~1,9 GB); i successivi caricano solo i file cambiati. Il riepilogo del job *cloudflare* mostra
   l'indirizzo di prova.
5. Controlli sull'indirizzo di prova:
   - home, una pagina partita, una squadra, un giocatore, la pagina bonus;
   - un indirizzo inesistente → pagina 404 del sito;
   - `/calcio/serie-a` (senza `/` finale) → va a `/calcio/serie-a/`;
   - un vecchio URL elencato in `_redirects` (es. `/basket/nba/`) → 301 verso il nuovo;
   - video delle guide e immagini social.

   Il widget live delle partite **non** funziona sull'indirizzo di prova (il live worker accetta solo
   www.quotaguru.it): è previsto, sul dominio vero funziona.

## Fase 2 – Passaggio del dominio

Meglio in un momento senza partite in corso. Il sito resta irraggiungibile solo per qualche minuto (tra i passi 1 e 2).

1. Cloudflare → `quotaguru.it` → *DNS* → *Records*: elimina il record **`www`** (CNAME verso `mstanne.github.io`).
2. *Workers & Pages* → `quotaguru-site` → *Settings* → *Domains & Routes* → *Add* → *Custom domain* →
   `www.quotaguru.it`. Cloudflare crea da solo il record DNS e il certificato (pochi minuti).
3. GitHub → variabile `SITO_CLOUDFLARE` = **`attivo`**: da qui le build vanno solo su Cloudflare (il workflow tiene il
   dominio collegato e spegne l'indirizzo `workers.dev`) e GitHub Pages non viene più aggiornato.
4. **Dominio senza www** (`quotaguru.it` → `https://www.quotaguru.it`, oggi lo fa GitHub Pages):
   - *DNS*: elimina i record `A`/`AAAA` di `quotaguru.it` che puntano a GitHub (185.199.108–111.153 e simili) e
     crea `A` `quotaguru.it` → `192.0.2.1` **con proxy attivo** (nuvola arancione; l'IP non viene mai contattato);
   - *Rules* → *Redirect Rules* → *Create rule* → modello **Redirect from Root to WWW**, codice **301**, con
     *Preserve query string*. Salva.
5. *SSL/TLS* → *Edge Certificates*: **Always Use HTTPS** attivo.
6. *Actions* → **Deploy to GitHub Pages** → *Run workflow*, poi controlla:
   - `https://www.quotaguru.it/` e le pagine della fase 1;
   - `http://quotaguru.it/calcio/` → 301 a `https://www.quotaguru.it/calcio/`;
   - una partita in corso: il widget live si aggiorna.
7. Dopo qualche giorno senza problemi: GitHub → *Settings* → *Pages* → rimuovi il dominio personalizzato e
   *Unpublish site*.

Search Console, GA4, IndexNow, sitemap e live worker non cambiano: il dominio è lo stesso.

## Ritorno a GitHub Pages

1. Variabile `SITO_CLOUDFLARE` = `prova` (o cancellala).
2. Cloudflare: togli il custom domain dal Worker, ricrea il CNAME `www` → `mstanne.github.io` (solo DNS, nuvola grigia)
   e, se serve, i record di `quotaguru.it` verso GitHub.
3. GitHub → *Settings* → *Pages*: dominio personalizzato `www.quotaguru.it`, poi *Run workflow* su
   **Deploy to GitHub Pages**.
