#!/usr/bin/env bash
# Permanent copy of the site's data in the `dati` branch of this repository (used by .github/workflows/deploy.yml).
#
# The site has no database: every full run downloads the data from the APIs into JSON files and keeps the state that
# must survive between runs (API-Sports details already downloaded, highlights found, archived pages of finished
# matches, sitemap dates, data log, Claude rewrites) in the GitHub Actions cache. GitHub deletes cache entries unused
# for 7 days or beyond 10 GB, so after every full run the same files are also committed to the `dati` branch: its
# history is a dated record of every change, and if the cache is lost the next run starts again from there.
# Social images (.cache/og) and the short-lived HTTP caches are not kept: they are rebuilt automatically.
#
# Usage (from the repository root, GH_TOKEN and GITHUB_REPOSITORY set):
#   scripts/data-branch.sh restore-data    before the downloads: the last saved data replace the old snapshot
#                                          committed in main (used if an API is unreachable)
#   scripts/data-branch.sh restore-state   after the cache restore: brings back .cache/seo and .cache/match-details
#                                          only if the cache was lost
#   scripts/data-branch.sh restore-editorial  same for the Claude rewrites (.cache/editorial-ai.json)
#   scripts/data-branch.sh save            after the build: commits the current files to `dati`
# Never meant to block the deploy: the workflow runs it with continue-on-error.
set -euo pipefail

DIR=.cache/dati-branch
BRANCH=dati
# DATA_BRANCH_URL overrides the remote (tests only)
URL="${DATA_BRANCH_URL:-https://x-access-token:${GH_TOKEN:-}@github.com/${GITHUB_REPOSITORY:-}.git}"

# Data written by the download steps (same list as the snapshot used by live-scores.yml).
DATA_FILES=(
  src/data/football.json src/data/basket.json src/data/tennis.json
  src/data/football-details.json src/data/basket-details.json src/data/highlights.json
  src/data/editorial-ai.json
  data/football-history.json data/football-teams.json data/basket-history.json data/team-seasons-api.json
  data/id-map.json
  public/stato-dati.json
)

checkout() {
  [ -d "$DIR/.git" ] && return 0
  set +e
  git ls-remote --exit-code --heads "$URL" "$BRANCH" >/dev/null
  local found=$?
  set -e
  if [ "$found" -eq 0 ]; then
    git clone --quiet --depth 1 --branch "$BRANCH" "$URL" "$DIR"
  elif [ "$found" -eq 2 ]; then
    return 1 # no branch yet: created by the first save
  else
    echo "::warning::Branch $BRANCH non raggiungibile"
    exit 1
  fi
}

case "${1:-}" in
  restore-data)
    checkout || { echo "Branch $BRANCH non ancora creato: uso i dati del repository"; exit 0; }
    n=0
    for f in "${DATA_FILES[@]}"; do
      if [ -f "$DIR/$f" ]; then mkdir -p "$(dirname "$f")"; cp "$DIR/$f" "$f"; n=$((n + 1)); fi
    done
    # permanent archive (scripts/archive-data.mjs) and the club logos it holds
    if [ -d "$DIR/archivio" ]; then rm -rf data/archivio; cp -r "$DIR/archivio" data/archivio; fi
    echo "Dati ripristinati dal branch $BRANCH: $n file$( [ -d data/archivio ] && echo ' e archivio')"
    ;;
  restore-state)
    if [ -f .cache/seo/state.json ]; then echo "Cache presente: niente da ripristinare"; exit 0; fi
    checkout || { echo "Cache assente e branch $BRANCH non ancora creato"; exit 0; }
    echo "::warning::Cache dei workflow assente: ripristino lo stato dal branch $BRANCH"
    mkdir -p .cache
    for d in seo match-details; do
      [ -d "$DIR/stato/$d" ] && rm -rf ".cache/$d" && cp -r "$DIR/stato/$d" ".cache/$d"
    done
    ;;
  restore-editorial)
    if [ -f .cache/editorial-ai.json ]; then exit 0; fi
    checkout || exit 0
    for f in editorial-ai.json editorial-stats.json; do
      [ -f "$DIR/stato/$f" ] && cp "$DIR/stato/$f" ".cache/$f"
    done
    echo "Riscritture Claude ripristinate dal branch $BRANCH"
    ;;
  save)
    if ! checkout; then
      mkdir -p "$DIR"
      git -C "$DIR" init --quiet -b "$BRANCH"
      git -C "$DIR" remote add origin "$URL"
    fi
    for f in "${DATA_FILES[@]}"; do
      if [ -f "$f" ]; then mkdir -p "$DIR/$(dirname "$f")"; cp "$f" "$DIR/$f"; fi
    done
    if [ -d data/archivio ]; then rm -rf "$DIR/archivio"; cp -r data/archivio "$DIR/archivio"; fi
    mkdir -p "$DIR/stato"
    for d in seo match-details; do
      if [ -d ".cache/$d" ]; then rm -rf "$DIR/stato/$d"; cp -r ".cache/$d" "$DIR/stato/$d"; fi
    done
    # rebuilt at every run / already kept elsewhere
    rm -f "$DIR/stato/seo/indexnow-urls.txt" "$DIR/stato/match-details/snapshot.tgz"
    for f in editorial-ai.json editorial-stats.json; do
      [ -f ".cache/$f" ] && cp ".cache/$f" "$DIR/stato/$f"
    done
    cat > "$DIR/README.md" <<'TXT'
# Dati di Quota Guru

Copia permanente dei dati del sito, salvata a ogni aggiornamento completo da `.github/workflows/deploy.yml`
(script `scripts/data-branch.sh` sul ramo main). Non modificare a mano: viene sovrascritta.

- `src/data/`, `data/`, `public/stato-dati.json`: dati scaricati dalle API (partite, classifiche, NBA, tennis,
  dettagli API-Sports, highlights, testi riscritti, storico per i modelli).
- `stato/seo/`: date di modifica delle pagine, archivio HTML delle partite finite, registro dei dati.
- `stato/match-details/`: dettagli e highlights già scaricati.
- `stato/editorial-*.json`: riscritture dei testi con Claude già pagate.
- `archivio/`: archivio permanente (non si cancella mai): partite finite con tutti i dettagli per competizione,
  stagione e mese, risultati usati dai modelli, squadre e rose per stagione, statistiche dei giocatori, loghi dei club.
  Le stagioni passate si aggiungono a piccoli blocchi (`scripts/backfill-archive.mjs`, avanzamento in
  `archivio/recupero.json`).

La cronologia dei commit è lo storico datato di ogni modifica. Se la cache dei workflow va persa,
il giro successivo riparte da qui.
TXT
    cd "$DIR"
    git add -A
    if git diff --cached --quiet; then echo "Dati invariati"; exit 0; fi
    git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
      commit --quiet -m "Dati $(date -u +%Y-%m-%dT%H:%MZ)"
    git push --quiet origin "HEAD:$BRANCH"
    echo "Dati salvati nel branch $BRANCH"
    ;;
  *)
    echo "Uso: scripts/data-branch.sh restore-data|restore-state|restore-editorial|save" >&2
    exit 2
    ;;
esac

exit 0
