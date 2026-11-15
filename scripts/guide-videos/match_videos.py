#!/usr/bin/env python3
"""
Video di pronostico delle partite di punta: sceglie le partite, genera i video e aggiorna l'indice.

Gira nel workflow .github/workflows/video-partite.yml. Partite scelte (al massimo PER_ROUND per giornata o turno):
  - Serie A: le coppie meglio piazzate in classifica (posizione media più bassa, come lo "studio del pronostico");
  - Champions, Europa e Conference League: prima le partite delle squadre italiane, poi le altre (posizione media
    nella classifica della fase a campionato, se c'è);
  - Coppa Italia e Supercoppa Italiana: le coppie meglio piazzate in Serie A.
La scelta di una giornata si fa una volta sola, la prima volta che una sua partita entra nella finestra, e resta
salvata nell'indice: così non cambia se la classifica si muove durante il weekend.

Ogni video si genera quando mancano tra MIN_LEAD e HORIZON ore al calcio d'inizio; si rigenera se le probabilità 1X2
pubblicate sono cambiate di almeno REDO punti e mancano più di 6 ore. Video e indice vivono nel ramo `video-partite`
(un solo commit, riscritto a ogni esecuzione): il deploy li copia nel sito (public/video/partite e
src/data/match-videos.json) e la rubrica Telegram `video-pronostico` li pubblica.

Uso:
  python3 scripts/guide-videos/match_videos.py --football football.json --archive <archivio-pronostici> \\
      --store <checkout del ramo video-partite> [--now 2026-11-21T08:00:00Z] [--dry-run]
"""
import argparse, json, math, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from match_storyboard import ROME, build, find_match, load_archive  # noqa: E402

COMPS = {
    "Serie A": "league",
    "Champions League": "europe",
    "Europa League": "europe",
    "Conference League": "europe",
    "Coppa Italia": "italy-cup",
    "Supercoppa Italiana": "italy-cup",
}
PER_ROUND = 3
MIN_LEAD = timedelta(hours=3)
HORIZON = timedelta(hours=36)
KEEP_AFTER = timedelta(days=2)
REDO = 0.03


def iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def positions(comp):
    out = {}
    for st in (comp or {}).get("standings") or []:
        for r in st.get("table") or []:
            out.setdefault(r["team"]["id"], r["position"])
    return out


def round_key(e, football):
    comp, m = find_match(football, e["id"])
    if m and m.get("matchday"):
        return f"{e['where']}|g{m['matchday']}"
    return f"{e['where']}|{parse(e['kickoff']).astimezone(ROME):%Y-%m-%d}"


def score(e, football, sa_pos):
    """Più alto = più di punta. sa_pos: posizioni in Serie A (squadre italiane)."""
    comp, m = find_match(football, e["id"])
    kind = COMPS[e["where"]]
    ids = [m["homeTeam"]["id"], m["awayTeam"]["id"]] if m else []
    if kind == "league":
        ps = [sa_pos.get(i) for i in ids]
        return 70 - sum(ps) / 2 if ids and all(ps) else 0
    if kind == "europe":
        ita = [sa_pos[i] for i in ids if i in sa_pos]
        if ita:
            return 100 - min(ita) / 2
        ps = [positions(comp).get(i) for i in ids]
        return 50 - sum(ps) / 2 / 2 if ids and all(ps) else 10
    ps = [sa_pos.get(i, 21) for i in ids] or [21, 21]
    return 70 - sum(ps) / 2


def started(e, football):
    _, m = find_match(football, e["id"])
    return bool(m and m.get("status") in ("POSTPONED", "CANCELLED", "SUSPENDED"))


def plan(football, archive, index, now):
    """Aggiorna index["rounds"] e restituisce gli id da generare (con il motivo)."""
    sa = next((c for c in football.get("competitions", []) if c.get("code") == "SA"), None)
    sa_pos = positions(sa)
    rounds = index.setdefault("rounds", {})
    by_round = {}
    for e in archive.values():
        if e.get("where") in COMPS:
            by_round.setdefault(round_key(e, football), []).append(e)
    todo = []
    for e in archive.values():
        if e.get("where") not in COMPS or started(e, football):
            continue
        ko = parse(e["kickoff"])
        if not (now + MIN_LEAD < ko <= now + HORIZON):
            continue
        key = round_key(e, football)
        if key not in rounds:
            ranked = sorted(by_round[key], key=lambda x: (-score(x, football, sa_pos), x["kickoff"], x["id"]))
            rounds[key] = {"chosen": [x["id"] for x in ranked[:PER_ROUND]], "decided": iso(now)}
        if e["id"] not in rounds[key]["chosen"]:
            continue
        old = index["videos"].get(str(e["id"]))
        if not old:
            todo.append((e, "nuovo"))
        elif ko - now > timedelta(hours=6) and max(abs(a - b) for a, b in zip(old["p"], e["prediction"]["p"])) >= REDO:
            todo.append((e, "probabilità cambiate"))
    return todo


def prune(index, store, now):
    for k, v in list(index["videos"].items()):
        if parse(v["kickoff"]) < now - KEEP_AFTER:
            for f in v["files"].values():
                (store / f).unlink(missing_ok=True)
            del index["videos"][k]
    for k, v in list(index["rounds"].items()):
        if parse(v["decided"]) < now - timedelta(days=30):
            del index["rounds"][k]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--football", required=True)
    ap.add_argument("--archive", required=True)
    ap.add_argument("--store", required=True)
    ap.add_argument("--now")
    ap.add_argument("--dry-run", action="store_true", help="stampa le partite scelte senza generare nulla")
    a = ap.parse_args()
    now = parse(a.now) if a.now else datetime.now(timezone.utc)
    football = json.loads(Path(a.football).read_text("utf-8"))
    archive = load_archive(a.archive)
    store = Path(a.store)
    idx_file = store / "index.json"
    index = json.loads(idx_file.read_text("utf-8")) if idx_file.exists() else {}
    index.setdefault("videos", {})
    index.setdefault("rounds", {})
    before = json.dumps({k: v for k, v in index.items() if k != "updated"}, sort_keys=True)

    todo = plan(football, archive, index, now)
    for e, why in todo:
        print(f"{e['kickoff']}  {e['where']}: {e['label']} ({why})", flush=True)
    if a.dry_run:
        return
    prune(index, store, now)
    out = store / "partite"
    for e, _ in todo:
        board = build(e, football, now.astimezone(ROME))
        seconds = render_board(board, out)
        sid = str(e["id"])
        index["videos"][sid] = {
            "id": e["id"], "label": e["label"], "where": e["where"], "kickoff": e["kickoff"], "path": e["path"],
            "generated": iso(now), "seconds": math.ceil(seconds), "p": e["prediction"]["p"],
            "files": {k: f"partite/{board['slug']}-{suf}" for k, suf in
                      (("landscape", "16x9.mp4"), ("portrait", "9x16.mp4"), ("poster", "16x9.jpg"), ("posterPortrait", "9x16.jpg"))},
        }
        idx_file.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", "utf-8")
    if json.dumps({k: v for k, v in index.items() if k != "updated"}, sort_keys=True) != before:
        index["updated"] = iso(now)
        idx_file.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"{len(todo)} video generati, {len(index['videos'])} nell'indice")


if __name__ == "__main__":
    from render import render_board  # noqa: E402  (playwright serve solo qui)
    main()
