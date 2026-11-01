# Server ponte per API-Football (IP dedicato)

API-Football limita gli indirizzi di uscita condivisi dei Cloudflare Workers: dal Worker metà delle richieste viene
respinta ("Too many requests") anche con una richiesta al minuto. Il supporto di API-Sports consiglia un IP dedicato.
Questo server piccolo, con IP tutto nostro, riceve le richieste del Worker e le inoltra ad API-Football. Fa solo
questo: un programma (Caddy) che inoltra le richieste con la nostra parola d'ordine e respinge tutte le altre. Il
certificato HTTPS lo prende e lo rinnova da solo; gli aggiornamenti di sicurezza di Ubuntu si installano da soli.

## Messa in funzione (una volta)

1. **Server** (es. Hetzner Cloud, il modello più piccolo, Ubuntu 24.04, con IPv4): al momento della creazione,
   nella casella *Cloud config*, incolla `cloud-config.yaml` sostituendo `api.quotaguru.it` (se usi un altro nome) e
   `SEGRETO` con una parola d'ordine lunga e casuale.
2. **DNS su OVH**: record **A** `api` → indirizzo IPv4 del server. Dopo qualche minuto il server ottiene da solo il
   certificato HTTPS. Prova: `https://api.quotaguru.it/status` deve rispondere *403* (giusto: manca la parola d'ordine).
3. **GitHub** → *Settings* → *Secrets and variables* → *Actions*:
   - segreto `LIVE_PROXY_SECRET` = la parola d'ordine del punto 1
   - variabile `LIVE_API_BASE` = `https://api.quotaguru.it`
4. *Actions* → **Live worker** → *Run workflow*. Da quel momento il Worker passa dal server: `…workers.dev/prova`
   deve mostrare il piano Pro e `…workers.dev/stato` niente più "Too many requests".

Per tornare al collegamento diretto: cancella la variabile `LIVE_API_BASE`, rilancia *Live worker* e cancella i
segreti `API_BASE` e `PROXY_SECRET` del worker dalla dashboard di Cloudflare (*Workers* → *quotaguru-live* →
*Settings* → *Variables and Secrets*).
