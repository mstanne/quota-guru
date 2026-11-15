# Video di Quota Guru

Video brevi, senza voce e con musica di sottofondo originale (`music.py`), disegnati da `player.html` e registrati
con Playwright e ffmpeg (`render.py`). Requisiti: Python con `playwright`, `numpy` e `scipy`, Chromium
(`python -m playwright install chromium`), ffmpeg e il font Inter (`fonts-inter` su Ubuntu).

## Video delle guide

Uno storyboard per guida in `storyboards/<slug>.json`. Il render produce `public/video/guide/<slug>-16x9.mp4`,
`-9x16.mp4` e i poster `.jpg`:

```bash
python3 scripts/guide-videos/render.py come-leggere-le-quote             # entrambi i formati
python3 scripts/guide-videos/render.py come-leggere-le-quote --stills 3,12   # solo alcuni fotogrammi, per controllo
```

Poi la guida va aggiunta in `src/data/guideVideos.ts`. Questi video stanno nel repository.

## Video dei pronostici delle partite

Automatici, generati da `.github/workflows/video-partite.yml` ogni 3 ore con `match_videos.py`.

- **Partite scelte**: al massimo 3 per giornata o turno. In Serie A le coppie meglio piazzate in classifica. In
  Champions, Europa e Conference League prima le squadre italiane, poi le altre. In Coppa Italia e Supercoppa le
  squadre meglio piazzate in Serie A. La scelta di una giornata si fa la prima volta che una sua partita entra nella
  finestra e poi resta fissa.
- **Quando**: un video si genera quando mancano tra 3 e 36 ore al calcio d'inizio. Si rifà se le probabilità 1X2
  pubblicate cambiano di almeno 3 punti e mancano più di 6 ore.
- **Contenuto** (`match_storyboard.py`): squadre e orario, classifica e forma, probabilità 1X2 del modello con la quota
  equa, chi passa il turno (coppe a eliminazione), gol attesi con Over 2,5 e Goal, i risultati esatti più probabili, e
  l'avviso "probabilità, non certezze". I dati sono gli stessi del sito e del canale Telegram: il pronostico pubblicato
  nel ramo `archivio-pronostici`, classifica e partite dal ramo `dati`. Niente loghi dei club e niente nomi di
  operatori.
- **Dove finiscono**: nel ramo `video-partite` (un solo commit, riscritto a ogni esecuzione: `partite/*.mp4`, i
  poster e `index.json`). I video si tengono fino a 2 giorni dopo la partita. Il deploy li copia in
  `public/video/partite` e l'indice in `src/data/match-videos.json` (nel repository resta vuoto): la pagina della
  partita mostra il riquadro "Il pronostico in video" finché la partita non comincia. La rubrica Telegram
  `video-pronostico` pubblica il video verticale tra 6 ore e 90 minuti prima del calcio d'inizio.

Prova in locale con una copia dei dati:

```bash
python3 scripts/guide-videos/match_videos.py --football <dati>/src/data/football.json \
  --archive <copia di archivio-pronostici> --store /tmp/video-partite --now 2026-11-21T06:00:00Z --dry-run
```

Senza `--dry-run` genera davvero i video in `--store`. Per una singola partita: `match_storyboard.py <id>`, poi
`render.py <storyboard.json> --out <cartella>`.
