#!/usr/bin/env bash
# Archive of the published predictions (scripts/archive-predictions.mjs), in two copies (docs/archivio-pronostici.md):
#
#   private   branch `archivio-pronostici` of the PRIVATE repository mstanne/quota-guru-dati: the working archive,
#             keyed by the API-Football / API-NBA match ids (which may not be passed on), with the threes, the
#             multiples, the fantasy football advice and the Monday editions. Read and written by the site's
#             workflows with the secret DATI_TOKEN (the same as scripts/data-branch.sh).
#   public    branch `archivio-pronostici` of this repository: only the predictions, without those ids
#             (.cache/archivio-pubblico, written by archive-predictions.mjs). Committed after every build, so its
#             history stays the public, timestamped proof of when each prediction was published.
#
# Until the private branch exists, `restore` takes the public one with its whole history (it held the working
# archive until November 2026) and the first `save` creates the private branch from it: nothing to copy by hand.
#
# Usage (from the repository root; DATI_TOKEN, GH_TOKEN and GITHUB_REPOSITORY set):
#   scripts/archive-branch.sh restore   working archive into $PREDICTION_ARCHIVE_DIR (default .cache/predictions-archive);
#                                       exit 1 if it cannot be reached
#   scripts/archive-branch.sh save      commits the working archive to the private branch, then the public copy
#                                       ($PUBLIC_ARCHIVE_DIR, default .cache/archivio-pubblico) to the public branch;
#                                       only after a successful restore (never publishes a partial archive)
set -euo pipefail

DIR="${PREDICTION_ARCHIVE_DIR:-.cache/predictions-archive}"
PUB_DIR="${PUBLIC_ARCHIVE_DIR:-.cache/archivio-pubblico}"
PUB_GIT=.cache/archivio-pubblico-branch
BRANCH=archivio-pronostici
DATI_REPO="${DATI_REPO:-mstanne/quota-guru-dati}"
# ARCHIVE_PRIVATE_URL / ARCHIVE_PUBLIC_URL override the remotes (tests only)
URL="${ARCHIVE_PRIVATE_URL:-https://x-access-token:${DATI_TOKEN:-}@github.com/${DATI_REPO}.git}"
PUB_URL="${ARCHIVE_PUBLIC_URL:-https://x-access-token:${GH_TOKEN:-}@github.com/${GITHUB_REPOSITORY:-}.git}"
# actions/checkout makes git send the workflow's own GITHUB_TOKEN to github.com (http.<url>.extraheader), and that
# token cannot see the private repository: for it, the header is reset so the token in the URL is used.
gitp() { git -c "http.https://github.com/.extraheader=" "$@"; }
bot() { git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" "$@"; }
stamp() { date -u +%Y-%m-%dT%H:%MZ; }

# 0: exists, 2: no such branch, other: unreachable
branch_state() {
  set +e
  gitp ls-remote --exit-code --heads "$1" "$BRANCH" >/dev/null 2>&1
  local r=$?
  set -e
  return $r
}

restore() {
  rm -rf "$DIR"
  if [ -z "${DATI_TOKEN:-}" ] && [ -z "${ARCHIVE_PRIVATE_URL:-}" ]; then
    echo "::warning::Segreto DATI_TOKEN mancante: archivio pronostici non raggiungibile (docs/archivio-pronostici.md)"
    return 1
  fi
  local s=0
  branch_state "$URL" || s=$?
  if [ "$s" -eq 0 ]; then
    gitp clone --quiet --depth 1 --branch "$BRANCH" "$URL" "$DIR"
  elif [ "$s" -eq 2 ]; then
    # first run: the public branch still holds the working archive; its whole history goes to the private one
    local p=0
    branch_state "$PUB_URL" || p=$?
    if [ "$p" -eq 0 ]; then
      gitp clone --quiet --single-branch --branch "$BRANCH" "$PUB_URL" "$DIR"
      local first
      first=$(ls "$DIR"/calcio/*.json 2>/dev/null | head -1 || true)
      # the working archive has objects keyed by match id ("{"), the public copy has lists ("[")
      if [ -z "$first" ] || [ "$(head -c 1 "$first")" = "{" ]; then
        echo "Archivio privato ancora vuoto: parte dal branch pubblico con la sua cronologia ($(git -C "$DIR" rev-list --count HEAD) commit)"
      else
        # the public branch already has the public copy (no ids): it cannot be the working archive
        echo "::error::Branch $BRANCH assente in $DATI_REPO e il branch pubblico contiene già la copia senza id: archivio non ripristinabile"
        rm -rf "$DIR"
        return 1
      fi
    elif [ "$p" -eq 2 ]; then
      mkdir -p "$DIR"
      git -C "$DIR" init --quiet -b "$BRANCH"
    else
      echo "::warning::Archivio pronostici non raggiungibile"
      return 1
    fi
    git -C "$DIR" remote remove origin 2>/dev/null || true
    git -C "$DIR" remote add origin "$URL"
  else
    echo "::warning::Repository $DATI_REPO non raggiungibile (segreto DATI_TOKEN, docs/archivio-pronostici.md)"
    return 1
  fi
  : > "$DIR/.git/ripristinato"
}

save() {
  if [ ! -f "$DIR/.git/ripristinato" ]; then
    echo "::warning::Archivio pronostici non ripristinato: non salvo nulla"
    return 1
  fi
  local code=0
  # the restore marker is in .git, never committed
  git -C "$DIR" add -A
  if git -C "$DIR" diff --cached --quiet; then
    echo "Archivio pronostici invariato"
  else
    bot -C "$DIR" commit --quiet -m "Archivio pronostici $(stamp)"
  fi
  # push also when unchanged: the first save creates the private branch
  if gitp -C "$DIR" push --quiet origin "HEAD:refs/heads/$BRANCH"; then
    echo "Archivio pronostici salvato in $DATI_REPO"
  else
    # the public branch is updated only after the private one: on the very first save the public branch is still
    # the only copy of the working archive, and the next run would start again from it
    echo "::warning::Salvataggio dell'archivio in $DATI_REPO non riuscito: branch pubblico non aggiornato"
    return 1
  fi

  # public copy
  if [ ! -f "$PUB_DIR/README.md" ]; then
    echo "::warning::Copia pubblica dell'archivio assente ($PUB_DIR): branch pubblico non aggiornato"
    return 1
  fi
  rm -rf "$PUB_GIT"
  local p=0
  branch_state "$PUB_URL" || p=$?
  if [ "$p" -eq 0 ]; then
    git clone --quiet --depth 1 --branch "$BRANCH" "$PUB_URL" "$PUB_GIT"
  elif [ "$p" -eq 2 ]; then
    mkdir -p "$PUB_GIT"
    git -C "$PUB_GIT" init --quiet -b "$BRANCH"
    git -C "$PUB_GIT" remote add origin "$PUB_URL"
  else
    echo "::warning::Branch pubblico $BRANCH non raggiungibile"
    return 1
  fi
  # the branch becomes exactly the public copy (the files of the old working archive go away)
  find "$PUB_GIT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  cp -R "$PUB_DIR"/. "$PUB_GIT"/
  git -C "$PUB_GIT" add -A
  if git -C "$PUB_GIT" diff --cached --quiet; then
    echo "Copia pubblica dell'archivio invariata"
    return $code
  fi
  bot -C "$PUB_GIT" commit --quiet -m "Archivio pronostici $(stamp)"
  if git -C "$PUB_GIT" push --quiet origin "HEAD:refs/heads/$BRANCH"; then
    echo "Copia pubblica dell'archivio salvata nel branch $BRANCH"
  else
    echo "::warning::Salvataggio della copia pubblica dell'archivio non riuscito"
    code=1
  fi
  return $code
}

case "${1:-}" in
  restore) restore ;;
  save) save ;;
  *)
    echo "uso: $0 restore|save" >&2
    exit 2
    ;;
esac
