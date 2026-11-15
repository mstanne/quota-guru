#!/usr/bin/env bash
# Carica dei file di public/video nel bucket R2 dei video, con lo stesso percorso (docs/video.md):
#   scripts/upload-videos.sh public/video/guide/cash-out-16x9.mp4 public/video/tris/2026-11-15-16x9.mp4 …
# Senza argomenti legge l'elenco dei file da stdin (uno per riga). I file che non esistono sono saltati.
# Richiede CLOUDFLARE_API_TOKEN (permesso "Workers R2 Storage: Edit") e CLOUDFLARE_ACCOUNT_ID; usa il wrangler di
# workers/live (npm ci in quella cartella). Bucket: R2_VIDEO_BUCKET, predefinito quotaguru-video.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${R2_VIDEO_BUCKET:-quotaguru-video}"
WRANGLER="$ROOT/workers/live/node_modules/.bin/wrangler"
[ -x "$WRANGLER" ] || { echo "wrangler mancante: esegui npm ci in workers/live" >&2; exit 1; }
# un segreto incollato con un a capo finale rende l'intestazione HTTP non valida (wrangler-action lo toglie da sé)
export CLOUDFLARE_API_TOKEN="$(printf '%s' "${CLOUDFLARE_API_TOKEN:-}" | tr -d '[:space:]')"
export CLOUDFLARE_ACCOUNT_ID="$(printf '%s' "${CLOUDFLARE_ACCOUNT_ID:-}" | tr -d '[:space:]')"

if [ $# -gt 0 ]; then files=("$@"); else mapfile -t files; fi

upload() {
  local f="$1" key type
  [ -f "$f" ] || { echo "salto (non esiste): $f"; return 0; }
  key="${f#"$ROOT"/}"
  key="${key#public/video/}"
  case "$f" in
    *.mp4) type=video/mp4 ;;
    *.jpg | *.jpeg) type=image/jpeg ;;
    *.webm) type=video/webm ;;
    *) echo "salto (tipo non previsto): $f"; return 0 ;;
  esac
  # un giorno di cache: un video rigenerato con lo stesso nome compare al più entro 24 ore
  local log
  if ! log=$("$WRANGLER" r2 object put "$BUCKET/$key" --file "$f" --remote --content-type "$type" \
    --cache-control "public, max-age=86400" 2>&1); then
    echo "ERRORE: $key" >&2
    echo "$log" | tail -5 >&2
    return 1
  fi
  echo "caricato: $key"
}
export -f upload
export ROOT BUCKET WRANGLER

count=0
for f in "${files[@]}"; do [ -n "$f" ] && count=$((count + 1)); done
[ "$count" -gt 0 ] || { echo "Nessun file da caricare"; exit 0; }
echo "Carico $count file nel bucket $BUCKET"
# quattro caricamenti alla volta
# quattro caricamenti alla volta; se anche uno solo fallisce lo script esce con errore (e il workflow risulta rosso)
if ! printf '%s\0' "${files[@]}" | grep -zv '^$' | xargs -0 -P 4 -I{} bash -c 'upload "$@"' _ {}; then
  echo "::error::Alcuni file non sono stati caricati nel bucket $BUCKET (dettagli sopra)"
  exit 1
fi
echo "Caricamento completato"
