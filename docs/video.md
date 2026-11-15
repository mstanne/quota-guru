# Video del sito

I video stanno nel bucket R2 di Cloudflare **`quotaguru-video`**, pubblicato su **https://video.quotaguru.it**
(dominio collegato in R2 → bucket → Settings → Custom Domains). Il traffico in uscita da R2 è gratuito; il piano
gratuito comprende 10 GB di spazio (un video delle guide pesa circa 3 MB).

## Struttura del bucket

| Percorso | Contenuto |
| --- | --- |
| `guide/<slug>-16x9.mp4`, `-9x16.mp4`, `-16x9.jpg`, `-9x16.jpg` | video riassuntivi delle guide |
| `analisi/<sport>/<AAAA-MM-GG>/<partita>-16x9.mp4` (e 9x16, poster) | analisi di una partita (`calcio`, `basket`, `tennis`; `<partita>` = slug della pagina). Oggi: i pronostici delle partite di calcio di punta, generati da `video-partite.yml` (`scripts/guide-videos/README.md`) |
| `tris/<AAAA-MM-GG>-16x9.mp4` (e 9x16, poster) | la tripla del giorno |
| `multiple/<AAAA-MM-GG>-16x9.mp4` (e 9x16, poster) | le multiple del giorno |

Ogni video ha due formati: orizzontale (16:9) per il sito su schermi larghi, verticale (9:16) per smartphone e
social. Le date sono quelle italiane. Gli indirizzi si costruiscono con `src/data/videos.ts` (`videoKeys`,
`videoFiles`); sotto `public/video` vale la stessa struttura.

## Come arrivano nel bucket

Il workflow **Video** (`.github/workflows/video.yml`) usa `scripts/upload-videos.sh`:

- a ogni push su `main` rigenera le guide il cui storyboard è cambiato (`scripts/guide-videos/storyboards/<slug>.json`)
  e carica quei video, più i file di `public/video` aggiunti o cambiati;
- a mano (Actions → Video → Run workflow): `rendi` = slug separati da spazi o `tutte`; `carica_tutto` = carica tutti i
  file di `public/video`.

I video dei pronostici delle partite arrivano invece dal workflow **Video partite** (`.github/workflows/video-partite.yml`,
ogni 3 ore), che li genera e li carica con lo stesso script; il loro indice sta nel ramo `video-partite`.

I file hanno una cache di un giorno: un video rigenerato con lo stesso nome compare entro 24 ore.

## Configurazione (una volta sola)

1. Il segreto `CLOUDFLARE_API_TOKEN` (già usato da `live-worker.yml`) deve avere il permesso
   **Account → Workers R2 Storage → Edit** (il modello "Edit Cloudflare Workers" lo comprende). `CLOUDFLARE_ACCOUNT_ID`
   è lo stesso del worker.
2. Se il bucket non si chiama `quotaguru-video`: variabile del repository `R2_VIDEO_BUCKET` con il nome giusto.
3. Actions → **Video** → Run workflow con **carica_tutto** attivo: copia nel bucket i video già presenti nel repository.
   Prova: `https://video.quotaguru.it/guide/cash-out-16x9.mp4` deve aprire il video.
4. Variabile del repository **`VIDEO_BASE`** = `https://video.quotaguru.it`: dal deploy successivo il sito prende i
   video dal bucket. Vuota = il sito usa i file di `public/video`.

Dopo il punto 4 i file `.mp4` e `.jpg` di `public/video` si possono togliere dal repository: le guide si rigenerano
dagli storyboard con il workflow.
