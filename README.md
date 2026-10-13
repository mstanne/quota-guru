# QuotaGuru

Comparatore di quote sportive (calcio, tennis, basket) con schedina, pagine bonus, siti di scommesse e guide.
Il codice è ricostruito dal prototipo Figma Make **"Betting Affiliate Site UI"**
(<https://header-lace-50375015.figma.site>) ed è pronto per essere versionato su Git e pubblicato su GitHub Pages.

## Stack

- [React 18](https://react.dev) + TypeScript, bundling con [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) (plugin `@tailwindcss/vite`, nessun `tailwind.config` necessario)
- Componenti [shadcn/ui](https://ui.shadcn.com) basati su Radix UI (`src/components/ui`)
- Icone [lucide-react](https://lucide.dev), form con [react-hook-form](https://react-hook-form.com)

## Avvio in locale

Serve Node.js 20 o superiore (consigliato 22, vedi `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
```

Altri comandi:

| Comando             | Cosa fa                                       |
| ------------------- | --------------------------------------------- |
| `npm run build`     | type-check + build di produzione in `dist/`   |
| `npm run preview`   | serve la build di `dist/` in locale           |
| `npm run typecheck` | solo controllo TypeScript                     |

## Struttura

```
src/
├── App.tsx                  # rotte (React Router) e layout con header/footer
├── routes.ts                # elenco URL con title e description di ogni pagina
├── main.tsx                 # entry point del browser
├── entry-server.tsx         # render lato server usato solo in build (pre-rendering)
├── assets/logo.png
├── context/BetSlipContext.tsx  # stato della schedina (selezioni, puntata)
├── styles/globals.css       # Tailwind + token di tema
└── components/
    ├── Header.tsx, Footer.tsx, BetSlip.tsx
    ├── HeroSection.tsx, LiveOddsTable.tsx, BonusSection.tsx      # home
    ├── FootballPage.tsx, TennisPage.tsx, BasketPage.tsx          # liste quote per sport
    ├── FootballEventDetail.tsx, TennisEventDetail.tsx, BasketEventDetail.tsx
    ├── SitiScommessePage.tsx, BonusPage.tsx
    ├── GuidesPage.tsx, guides/ (GuideArticlePage, GuideCategoryPage, GuideUi)   # contenuti in src/data/guides.ts
    ├── LoginPage.tsx, RegisterPage.tsx, ForgotPasswordPage.tsx
    ├── figma/ImageWithFallback.tsx
    └── ui/                  # componenti shadcn/ui
```

Tutti i dati (partite, quote, bookmaker, bonus, guide) sono **mock statici** definiti in cima a ciascun componente:
per andare in produzione vanno sostituiti con un feed/API di quote reale. Login e registrazione validano i campi ma
non inviano dati a nessun backend.

## Pubblicare su GitHub

```bash
git remote add origin https://github.com/<utente>/<repo>.git
git push -u origin main
```

Poi su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Il workflow `.github/workflows/deploy.yml` builda e pubblica il sito a ogni push su `main`
all'indirizzo `https://<utente>.github.io/<repo>/`.

Il percorso base viene impostato automaticamente con la variabile `BASE_PATH` (= nome del repo) e l'indirizzo
pubblico con `SITE_URL` (usato per canonical e sitemap). Se usi un dominio
personalizzato o un repo `<utente>.github.io`, imposta nel workflow `BASE_PATH: /` e `SITE_URL` con il tuo dominio.

## Design system

- **Colori semantici** (definiti in `src/styles/globals.css`, usali al posto dei colori Tailwind diretti):
  `action` = azione principale e link verso gli operatori (arancione) · `action-text` = link testuali ·
  `best` = quota migliore / esito positivo (l'unico uso del verde) · `live` = stati in corso ·
  `warn` = avvisi e gioco responsabile · `selected` = filtro, tab o chip attivo (neutro).
- **Intestazioni di pagina:** `src/components/layout/PageHeader.tsx` (breadcrumb, titolo con icona, sottotitolo,
  riga di dati essenziali). Tutte le pagine di sezione la usano.
- **Numeri:** le tabelle usano cifre a larghezza fissa (`tabular-nums`) e i nomi degli operatori sotto le quote sono a 14 px.
- **Caricamento a pezzi:** ogni pagina ha il suo file JavaScript (`src/lib/lazyPage.tsx`); i dati completi del calcio
  si scaricano solo nelle pagine calcio, la home usa un estratto (`src/data/football-home.json`, rigenerato da
  `scripts/derive-football-home.mjs` a ogni build).
- **Accessibilità:** quote e card cliccabili sono veri pulsanti/link con etichetta descrittiva; la quota migliore ha
  anche un'icona ✓ (non solo il colore); focus da tastiera sempre visibile. Verificato con axe-core: 0 violazioni.
- **Stemmi** delle squadre: arrivano da football-data.org (`crest`); se mancano o non si caricano viene mostrata la sigla.

## Pagine istituzionali

`/chi-siamo`, `/contatti`, `/faq`, `/metodologia`, `/affiliazione`, `/termini`, `/privacy`, `/cookie`
(`src/components/info/InfoPages.tsx`). I dati societari (ragione sociale, P. IVA, email, PEC, data di aggiornamento,
profili social) si compilano in **`src/data/site.ts`**; le icone social compaiono solo per i profili inseriti.
I testi di termini, privacy e cookie sono **modelli**: vanno completati (segnaposto come `[FORNITORE_HOSTING]`,
`[DURATA]`) e fatti verificare da un legale prima della pubblicazione.

## Statistiche e consenso cookie

Le statistiche sono **spente per impostazione predefinita**: nessuno script esterno, nessun banner.
Per attivarle, su GitHub → Settings → Secrets and variables → Actions → **Variables** aggiungi:

| Variabile | Valore |
| --- | --- |
| `ANALYTICS_PROVIDER` | `plausible` oppure `ga4` |
| `ANALYTICS_ID` | dominio del sito per Plausible (es. `mstanne.github.io`) oppure ID GA4 (`G-XXXXXXX`) |
| `COOKIE_POLICY_URL` | indirizzo della cookie policy |

Con il provider attivo compare il banner (Accetta statistiche / Rifiuta, modificabile da "Preferenze cookie" nel
footer). Lo script del provider viene caricato **solo dopo il consenso**. Eventi registrati (`src/lib/analytics.ts`):

- `outbound_click` – clic su "Vai al sito", con operatore, posizione del bottone (`placement`) e pagina;
- `bet_slip_add` – quota aggiunta alla schedina, con operatore e mercato.

Prima di attivarle prepara informativa privacy e cookie policy (GDPR e linee guida del Garante sui cookie).

## Template operatori (segnaposto)

Il sito è un **template neutro**: nessun nome, logo, bonus o quota di un operatore reale è scritto nei componenti.
Tutti i dati degli operatori stanno in un solo file, **`src/data/operators.ts`**, e arrivano ai componenti come props
strutturate (`operator.name`, `operator.logoUrl`, `offer.amount`, …), quindi possono essere sostituiti da un JSON,
un CMS o un'API senza toccare il layout.

| Dato | Dove | Segnaposto |
| --- | --- | --- |
| Operatore (nome, sigla, logo, link, concessione ADM, valutazione, pagamenti, pro/contro) | `operators` | `[NOME_OPERATORE_1]`, `[URL_AFFILIAZIONE_OPERATORE]`, `[NUMERO_CONCESSIONE_ADM]`, `[VALUTAZIONE]`… |
| Offerte (titolo, importo, descrizione, requisiti, termini) | `offers` | `[TITOLO_PROMO]`, `[BONUS_BENVENUTO]`, `[DESCRIZIONE_PROMO]`, `[REQUISITI_SCOMMESSA]`… |
| Quote | dati di ogni pagina, creati con `placeholderOdds()` (`src/lib/odds.ts`) | `[QUOTA_1]`, `[QUOTA_X]`, `[QUOTA_2]`, `[QUOTA_OVER]`… |
| Gioco responsabile (numero verde, ADM, logo ADM) | `responsibleGambling` | — |

- **Loghi:** imposta `logoUrl`. Finché è `null` viene mostrato un riquadro neutro con la misura esatta dello slot
  (`[PLACEHOLDER_LOGO_48x48]`, `64x64`, `40x40`, `24x24`, logo ADM `120x40`), così il layout non cambia.
- **Link:** `OperatorCta` (`src/components/operator/OperatorUi.tsx`) mantiene lo stile del bottone originale e aggiunge
  `rel="sponsored nofollow"`. Finché l'URL è un segnaposto il link è inattivo.
- **Quote:** accettano numeri o segnaposto. Con i numeri il sito calcola da solo quota migliore, quota totale e vincita
  della schedina; con i segnaposto mostra `[QUOTA_TOTALE]` e `[VINCITA_POTENZIALE]`.
- **Immagini editoriali** (guide): `ImageSlot` mostra `[PLACEHOLDER_IMMAGINE_GUIDA_800x450]` finché non imposti l'URL.

## Dati calcio (football-data.org)

Calendario, risultati, classifiche e precedenti del calcio arrivano dall'API gratuita di
[football-data.org](https://www.football-data.org) (10 competizioni del piano gratuito, risultati non in diretta).

- `scripts/fetch-football-data.mjs` scarica i dati inviando il token nell'header HTTP `X-Auth-Token` e scrive
  `src/data/football.json` (≈50 richieste, rispettando il limite di 10 al minuto: circa 5–6 minuti).
- Il token **non va mai scritto nel codice**: su GitHub sta nel secret `FOOTBALL_DATA_TOKEN`
  (Settings → Secrets and variables → Actions); in locale in un file `.env` (già escluso da git):

  ```
  FOOTBALL_DATA_TOKEN=il-tuo-token
  ```

  poi `npm run data` scarica i dati aggiornati.
- Il workflow aggiorna i dati e ripubblica il sito ogni 3 ore. Senza token usa lo snapshot già presente nel repo.
- I termini d'uso richiedono l'attribuzione "Football data provided by the Football-Data.org API", presente nel footer:
  non rimuoverla.

## Dati basket (BALLDONTLIE)

Calendario e risultati **NBA** e classifica della **Serie A di basket** arrivano dal piano gratuito di
[balldontlie.io](https://www.balldontlie.io) (5 richieste al minuto: il download richiede circa un minuto).
Calendario e risultati della Serie A e dell'EuroLeague richiedono il piano a pagamento della stessa fonte.

- Script: `scripts/fetch-basket-data.mjs` → `src/data/basket.json` (chiave nell'header `Authorization`).
- Chiave: secret **`BALLDONTLIE_API_KEY`** su GitHub; in locale nel file `.env` (escluso da git).
- Le condizioni d'uso della fonte non richiedono attribuzione e ammettono l'uso commerciale.

## URL del sito

| URL | Pagina |
| --- | --- |
| `/` | Home |
| `/calcio` | Calendario e risultati di tutte le competizioni |
| `/calcio/serie-a` (e `champions-league`, `premier-league`, `liga`, …) | Calendario di una competizione |
| `/calcio/serie-a/classifica` | Classifica |
| `/calcio/serie-a/inter-juventus-2026-10-18` | Scheda partita (generata per ogni partita) |
| `/basket`, `/basket/nba` | Calendario e risultati NBA |
| `/basket/nba/pistons-celtics-2026-10-20` | Scheda partita NBA (generata per ogni partita, con quote a confronto) |
| `/basket/serie-a/classifica` | Classifica Serie A basket |
| `/tennis`, `/tennis/djokovic-alcaraz` | Quote tennis e scheda partita (dati di esempio) |
| `/siti-scommesse` | Bookmaker a confronto |
| `/bonus` | Bonus |
| `/guide`, `/guide/<slug>`, `/guide/categoria/<slug>` | Guide (indice, singola guida, categoria) |
| `/accedi`, `/registrati`, `/password-dimenticata` | Account (nascoste dal menu, `noindex`) |

Per aggiungere una pagina: aggiungi il percorso in `src/routes.ts` (con title e description) e la `<Route>` in
`src/App.tsx`; il pre-rendering e la sitemap la includono automaticamente.

## Note

- Ogni pagina ha un proprio URL (vedi tabella sotto). In build `scripts/prerender.mjs` genera un file HTML statico
  per ogni URL con title, description, canonical e contenuto già visibile ai motori di ricerca, più `404.html`,
  `sitemap.xml` e `robots.txt`. Nel browser React prende il controllo e la navigazione resta istantanea.
- Per il tennis c'è ancora un solo esempio: tutte le partite della lista portano allo stesso URL di esempio. Le quote
  mostrate in home, tennis e basket sono ancora dati di esempio.
- Guide (24): tipi, categorie e guide di base in `src/data/guides.ts`, le altre in `src/data/guides/<categoria>.ts`.
  Ogni guida ha sezioni a blocchi, domande frequenti (`faq`), guide correlate (`related`) e link interni scritti
  come `[testo](/percorso)`. Per aggiungerne una basta un nuovo elemento nel file della categoria;
  pagina, indice, categoria e sitemap si aggiornano da soli. Le illustrazioni (SVG originali, palette del brand) sono in
  `src/assets/guides/` e si rigenerano con `python3 scripts/generate-guide-images.py`; per una guida nuova aggiungi
  la sua scena nello script oppure metti `image: null` per avere il segnaposto.
- I contenuti riguardano il gioco con vincita in denaro: prima di una pubblicazione reale verifica i requisiti
  normativi (licenze ADM, messaggi di gioco responsabile, divieti di pubblicità vigenti in Italia).

## Testi editoriali delle partite (agente)

Ogni pagina partita di calcio e NBA mostra un testo: **anteprima** prima del fischio d'inizio (per le partite dei
prossimi 14 giorni) e **resoconto** dopo, più alcune domande frequenti. Funziona in due livelli:

1. **Testi a modelli** (sempre attivi, gratuiti): `src/lib/editorial/engine.mjs` costruisce ogni frase dai dati
   scaricati (classifica, forma, bilancio casa/trasferta, precedenti, parziali). Se un dato manca la frase non compare.
   Lo stesso codice gira nel sito (anche nel pre-render) e nell'agente.
2. **Riscrittura con Claude** (facoltativa): `scripts/generate-editorial.mjs` gira a ogni aggiornamento in GitHub
   Actions. Se è impostato il secret `ANTHROPIC_API_KEY`, chiede a Claude di riscrivere i testi a modelli in un
   italiano più naturale usando solo i fatti presenti. Ogni riscrittura viene controllata in automatico (numeri e link
   devono comparire nel testo a modelli, stessa struttura, nessuna espressione promozionale, lunghezza simile): se non
   passa i controlli viene scartata e resta online il testo a modelli. Le riscritture accettate finiscono in
   `src/data/editorial-ai.json` e restano valide finché i dati della partita non cambiano.

Senza chiave l'agente controlla solo i testi a modelli: il sito funziona allo stesso modo.

Per collegare Claude: repo **Settings → Secrets and variables → Actions → New repository secret**
`ANTHROPIC_API_KEY`. Variabili facoltative (scheda *Variables*): `EDITORIAL_AI_MODEL` (modello, predefinito
`claude-sonnet-4-5`), `EDITORIAL_AI_MAX` (nuove riscritture per esecuzione, predefinito 40), `EDITORIAL_AI=off` per
sospendere la riscrittura. Le riscritture già accettate sono conservate nella cache di GitHub Actions e non vengono
ripagate. Il riepilogo di ogni esecuzione (testi nuovi, riutilizzati, scartati) compare nella pagina del workflow.

In locale: `npm run editorial` (legge la chiave da `.env` se presente). Il tennis è già previsto nel motore
(`tennisArticle`) ma si attiverà quando ci sarà un feed dati reale per le partite.
