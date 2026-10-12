# Quota Guru

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
    ├── GuidesPage.tsx, GuideDetailPage.tsx
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

## URL del sito

| URL | Pagina |
| --- | --- |
| `/` | Home |
| `/calcio`, `/tennis`, `/basket` | Quote per sport |
| `/calcio/arsenal-liverpool`, `/tennis/djokovic-alcaraz`, `/basket/lakers-celtics` | Scheda partita (esempio) |
| `/siti-scommesse` | Bookmaker a confronto |
| `/bonus` | Bonus |
| `/guide`, `/guide/guida-completa-scommesse-sportive` | Guide |
| `/accedi`, `/registrati`, `/password-dimenticata` | Account (nascoste dal menu, `noindex`) |

Per aggiungere una pagina: aggiungi il percorso in `src/routes.ts` (con title e description) e la `<Route>` in
`src/App.tsx`; il pre-rendering e la sitemap la includono automaticamente.

## Note

- Ogni pagina ha un proprio URL (vedi tabella sotto). In build `scripts/prerender.mjs` genera un file HTML statico
  per ogni URL con title, description, canonical e contenuto già visibile ai motori di ricerca, più `404.html`,
  `sitemap.xml` e `robots.txt`. Nel browser React prende il controllo e la navigazione resta istantanea.
- Le schede partita e il dettaglio guida mostrano per ora un solo esempio per sport: tutte le partite di una lista
  portano allo stesso URL di esempio.
- I contenuti riguardano il gioco con vincita in denaro: prima di una pubblicazione reale verifica i requisiti
  normativi (licenze ADM, messaggi di gioco responsabile, divieti di pubblicità vigenti in Italia).
