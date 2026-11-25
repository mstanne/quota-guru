# Video di Quota Guru

Video brevi, senza voce e con musica di sottofondo originale (`music.py`), disegnati da `player.html` e registrati
con Playwright e ffmpeg (`render.py`). Requisiti: Python con `playwright`, `numpy` e `scipy`, Chromium
(`python -m playwright install chromium`), ffmpeg e il font Inter (`fonts-inter` su Ubuntu).

Ogni video (guide e partite) finisce con la stessa schermata: logo, testo della scena `outro`, e il riquadro "Segui il
canale Telegram · t.me/quotaguru" (`TELEGRAM` in `render.py`), tenuta a schermo almeno 6,5 secondi. Uno storyboard può
toglierlo con `"telegram": ""`.

## Video delle guide

Uno storyboard per guida in `storyboards/<slug>.json`. Il render produce `public/video/guide/<slug>-16x9.mp4`,
`-9x16.mp4` e i poster `.jpg`:

```bash
python3 scripts/guide-videos/render.py come-leggere-le-quote             # entrambi i formati
python3 scripts/guide-videos/render.py come-leggere-le-quote --stills 3,12   # solo alcuni fotogrammi, per controllo
```

Poi la guida va aggiunta in `src/data/guideVideos.ts`. Questi video stanno nel repository. Quando cambiano
`player.html` o `render.py`, il workflow "Video" rigenera tutte le guide al push su main.

## Video dei pronostici delle partite

Automatici, generati da `.github/workflows/video-partite.yml` ogni 3 ore con `match_videos.py`.

- **Partite scelte**: al massimo 3 per giornata o turno, tranne le italiane nelle coppe europee (sempre tutte).
  - Serie A: le coppie meglio piazzate in classifica.
  - Champions, Europa e Conference League: tutte le partite delle squadre italiane, anche più di 3; se sono meno di
    3, si completa con le altre.
  - Coppa Italia e Supercoppa Italiana: le squadre meglio piazzate in Serie A.
  - Nazionali (Mondiali, Europei, qualificazioni europee e mondiali, spareggi, Nations League, amichevoli): un gruppo
    unico per giorno. Prima l'Italia, poi le fasi finali dei tornei, la Lega A di Nations League e le sfide tra
    nazionali di primo piano (`BIG_NATIONS`). Le amichevoli entrano solo con l'Italia o una nazionale di primo piano;
    le giovanili mai.

  La scelta di una giornata si fa la prima volta che una sua partita entra nella finestra, poi resta fissa.
- **Quando**: un video si genera quando mancano tra 3 e 36 ore al calcio d'inizio. Si rifà se le probabilità 1X2
  pubblicate cambiano di almeno 3 punti e mancano più di 6 ore.
- **Contenuto** (`match_storyboard.py`): squadre e orario, classifica (solo Serie A) e forma, probabilità 1X2 del
  modello con la quota equa, chi passa il turno (coppe a eliminazione), gol attesi con Over 2,5 e Goal, i risultati
  esatti più probabili, e l'avviso "probabilità, non certezze". I dati sono gli stessi del sito e del canale Telegram:
  il pronostico pubblicato nel ramo `archivio-pronostici`, classifica e partite dal ramo `dati`. Niente loghi dei club
  e niente nomi di operatori.
- **Dove finiscono**: i file nel bucket R2 dei video, in `analisi/calcio/<AAAA-MM-GG>/<partita>-16x9.mp4` (e 9x16,
  poster), come da `docs/video.md`. L'indice (`index.json`) nel ramo `video-partite`, un solo commit riscritto a ogni
  esecuzione, con le partite fino a 2 giorni dopo il calcio d'inizio. La build del sito (deploy e live-scores) lo copia
  in `src/data/match-videos.json` (nel repository resta vuoto): la pagina della partita mostra il riquadro "Il
  pronostico in video" finché la partita non comincia. La rubrica Telegram `video-pronostico` pubblica il video
  verticale tra 6 ore e 90 minuti prima del calcio d'inizio.
- **Requisiti**: gli stessi segreti Cloudflare del workflow Video (`CLOUDFLARE_API_TOKEN` con permesso R2,
  `CLOUDFLARE_ACCOUNT_ID`); senza, il workflow non fa nulla.

Prova in locale con una copia dei dati:

```bash
python3 scripts/guide-videos/match_videos.py --football <dati>/src/data/football.json \
  --archive <copia di archivio-pronostici> --store /tmp/indice --out /tmp/video --now 2026-11-21T06:00:00Z --dry-run
```

Senza `--dry-run` genera davvero i video in `--out`, con lo stesso percorso del bucket. Per una singola partita:
`match_storyboard.py <id>`, poi `render.py <storyboard.json> --out <cartella>`.
