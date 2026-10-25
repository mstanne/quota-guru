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
- **Partite "scadute":** le fonti non sono in diretta e a volte lasciano una partita "in programma" o "in corso"
  anche dopo la fine. Il sito non si fida solo dello stato: passata la durata media più un margine
  (`src/lib/eventTiming.mjs`: calcio 115′, NBA 150′, più 60′ di ritardo della fonte) la partita esce da "Prossime",
  finisce in "Risultati" e mostra "Risultato in arrivo" finché la fonte non pubblica il finale. Il riferimento è
  l'ora della build (`scripts/stamp-build-time.mjs`), uguale per le pagine pre-renderizzate e il browser; per i tornei
  di tennis vale la data di fine del torneo.
- Il workflow aggiorna i dati e ripubblica il sito ogni 3 ore. Senza token usa lo snapshot già presente nel repo.
- I termini d'uso richiedono l'attribuzione "Football data provided by the Football-Data.org API", presente nel footer:
  non rimuoverla.

## Pronostici calcio (modello Poisson)

Al posto delle quote (che arriveranno con i feed degli operatori) home, liste partite e pagine partita mostrano le
**probabilità stimate da un modello statistico**: 1X2, doppia chance, over/under, goal/no goal, risultati esatti.

- **Modello** (`scripts/lib/poisson-model.mjs`): Poisson con correzione Dixon-Coles. Ogni squadra ha una forza in
  attacco e in difesa; ogni competizione un livello di gol e un fattore campo; per le coppe europee c'è anche la forza
  del campionato di appartenenza. Stima a massima verosimiglianza penalizzata, partite pesate per recenza (il peso si
  dimezza in un anno). Parametri tarati con un backtest su 2022-2026 (5 campionati maggiori, ~3.400 partite):
  log-loss 1X2 ≈ 0,978, esito più probabile corretto ≈ 54%.
- **Storico** (`data/football-history.json`, non incluso nel sito): stagione in corso da football-data.org a ogni
  aggiornamento; le due stagioni precedenti si scaricano una sola volta, da football-data.org se il piano lo consente,
  altrimenti da [openfootball](https://github.com/openfootball/football.json) (stessi nomi squadra). `npm run history`
  aggiorna solo lo storico (anche senza token). Per riscaricare tutto da zero, cancella il file.
- **Previsioni** (`npm run predict` → `src/data/football-predictions.json`): per le partite in programma e, per quelle
  già giocate, il pronostico calcolato prima del calcio d'inizio (serve per il "Pronostico corretto/sbagliato" e per
  il dato di affidabilità in `/metodologia#pronostici`). Se una squadra ha meno di 3 partite pesate il pronostico non
  viene pubblicato (succede ai club esteri in Champions League finché non c'è storico europeo).
- `npm run predict:backtest` stampa anche un backtest walk-forward sullo storico.
- Le previsioni si ricalcolano dentro `npm run build` (quindi anche in GitHub Actions, dopo il download dei dati).

## Pronostici tennis

- **Modello** (`src/lib/tennis/model.mjs`, usato sia dal sito sia dagli script): forza dei giocatori su scala Elo.
  Oggi deriva dai punti della classifica ATP/WTA (`R = 1800 + 170 · ln(punti/1000)`, 155 per la WTA): con il doppio
  dei punti dell'avversario si vince ~66% al meglio dei 3. Dalla probabilità della partita si ricava quella del
  singolo set (con una variabilità "di giornata", parametro `FORM`), e da lì risultato in set, numero di set,
  scarto di set e formato al meglio dei 5.
- **Rating** (`npm run build` / `npm run data` → `scripts/predict-tennis.mjs` → `src/data/tennis-ratings.json`).
  Se esiste `data/tennis-matches.json` (risultati partita per partita: `{ date, tour, surface, winner, loser }` con
  gli id giocatore di BALLDONTLIE) il rating diventa un **Elo per superficie** aggiornato partita per partita
  (stile FiveThirtyEight/Tennis Abstract), e nel calcolatore compare la scelta della superficie. Il piano
  gratuito BALLDONTLIE non include le partite: serve un piano a pagamento o un altro feed.
- **Sul sito:** `/tennis` ha il calcolatore "Pronostico testa a testa" (top 100 ATP e WTA) al posto delle quote finte;
  la pagina di esempio `/tennis/djokovic-alcaraz` mostra il pronostico del modello per quella sfida.
- `SLOPE` e `FORM` sono valori iniziali da letteratura: vanno ritarati appena ci sono risultati reali.

## Pronostici basket (NBA)

- **Modello** (`scripts/lib/basket-model.mjs`): ogni squadra ha un rating di attacco e uno di difesa in punti; in più
  livello medio di punti della lega, fattore campo e penalità per la seconda partita in due giorni. Minimi quadrati
  pesati con priori (le squadre partono dalla media), peso delle partite dimezzato ogni 90 giorni. Scarto e totale
  seguono una normale con deviazione stimata sui residui → probabilità di vittoria, scarto, punti totali.
- **Backtest** (stagioni 2018-19 → 2023-24, previsione di ogni partita con i soli dati precedenti): esito corretto
  65%, log-loss 0,628, errore medio sullo scarto 10,6 punti.
- **Storico** (`data/basket-history.json`): stagione in corso + precedente, da BALLDONTLIE (endpoint `games`, gratuito).
  La stagione precedente si scarica una volta sola (~15 richieste, ~4 minuti col piano gratuito), poi solo
  aggiornamenti incrementali. **Prima volta:** `npm run history:basket` in locale e committa il file, così
  GitHub Actions non lo riscarica a ogni build.
- **Previsioni** (`scripts/predict-basket.mjs` → `src/data/basket-predictions.json`) girano dentro `npm run build`.
  Senza storico il file resta vuoto e il sito non mostra pronostici NBA.

## Dati basket (BALLDONTLIE)

Calendario e risultati **NBA** e classifica della **Serie A di basket** arrivano dal piano gratuito di
[balldontlie.io](https://www.balldontlie.io) (5 richieste al minuto: il download richiede circa un minuto).
Calendario e risultati della Serie A e dell'EuroLeague richiedono il piano a pagamento della stessa fonte.

- Script: `scripts/fetch-basket-data.mjs` → `src/data/basket.json` (chiave nell'header `Authorization`).
- Chiave: secret **`BALLDONTLIE_API_KEY`** su GitHub; in locale nel file `.env` (escluso da git).
- Le condizioni d'uso della fonte non richiedono attribuzione e ammettono l'uso commerciale.

## Dati tennis (BALLDONTLIE)

`scripts/fetch-tennis-data.mjs` scarica con la stessa chiave del basket (`BALLDONTLIE_API_KEY`) i dati inclusi nel
piano gratuito: classifiche ATP e WTA (primi 100) e calendario dei tornei della stagione (da ottobre anche della
successiva). Scrive `src/data/tennis.json`, normalizzando nomi e sedi in italiano. Pagine: `/tennis/classifica-atp`,
`/tennis/classifica-wta`, `/tennis/calendario-atp`, `/tennis/calendario-wta`, più il riquadro "Classifiche e tornei"
nella pagina Tennis. Partite, testa a testa e statistiche richiedono un piano a pagamento (ALL-STAR o GOAT): quando
saranno disponibili si potranno collegare le schede partita e i testi editoriali (`tennisArticle` nel motore).


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
  per ogni URL con title, description, canonical, dati strutturati e contenuto già visibile ai motori di ricerca, più
  `404.html`, `robots.txt` e le sitemap (`sitemap.xml` è l'indice di `sitemap-pagine.xml` e `sitemap-partite.xml`,
  così Search Console mostra separatamente l'indicizzazione delle pagine stabili e delle schede partita).
- **Link interni con la barra finale**: ogni pagina è pubblicata come `<percorso>/index.html` e il suo URL canonico
  finisce con `/`. Per non far passare ogni link da un redirect usa `Link` e `NavLink` di `src/lib/links.tsx`
  (aggiungono la barra da soli), non quelli di `react-router`. Nel browser React prende il controllo e la navigazione resta istantanea.
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

## SEO: dati strutturati, lastmod e archivio delle partite

- **Dati strutturati (JSON-LD)**, generati dal pre-render in ogni pagina: `Organization` (tutte), `WebSite` (home),
  `BreadcrumbList` (ricavato dal percorso visibile in pagina, così coincidono), `SportsEvent` (schede partita di calcio
  e NBA), `Article` + `FAQPage` (guide). I dati di ogni pagina stanno nel campo `jsonLd` dei metadati
  (`src/routes.ts`, `matchMeta`, `gameMeta`, `guideMeta`); i percorsi che iniziano con `/` diventano URL assoluti.
- **`<lastmod>` della sitemap**: è la data in cui il contenuto della pagina è cambiato davvero, non quella della build.
  Il pre-render confronta un'impronta del contenuto (`<main>`) con quella della build precedente; le parti che
  cambiano a ogni aggiornamento (es. "Dati aggiornati al…") hanno l'attributo `data-volatile` e non contano.
- **Archivio delle partite**: la pagina di ogni partita finita viene salvata e continua a essere pubblicata (con lo
  stesso URL, nella sitemap) anche quando la partita esce dalla finestra dei dati scaricati
  (`src/lib/archive.tsx`). Stato e archivio stanno in `.cache/seo`, conservato tra un'esecuzione e l'altra del
  workflow con la cache di GitHub Actions (passo "Restore SEO state"): se la cache venisse persa, le partite ancora
  nei dati si riarchiviano subito, quelle più vecchie no.
- **Immagini di anteprima delle guide** (`og:image`, 1200×630): `public/og/guide/<slug>.png`, ricavate dalle
  illustrazioni con `npm run og` (da rilanciare quando aggiungi o cambi un'illustrazione). Senza PNG si usa
  `og-image.png`.

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
