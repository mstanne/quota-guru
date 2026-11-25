#!/usr/bin/env python3
"""
Video di pronostico delle partite di punta: sceglie le partite, genera i video e aggiorna l'indice.

Gira nel workflow .github/workflows/video-partite.yml (README in scripts/guide-videos/README.md).

Partite scelte, al massimo PER_ROUND per giornata o turno (nelle coppe europee tutte quelle delle italiane, anche oltre):
  - Serie A: le coppie meglio piazzate in classifica (posizione media più bassa, come lo "studio del pronostico");
  - Champions, Europa e Conference League: tutte le partite delle squadre italiane, anche più di PER_ROUND; se sono
    meno di PER_ROUND, si completa con le altre (posizione media nella classifica della fase a campionato, se c'è);
  - Coppa Italia e Supercoppa Italiana: le coppie meglio piazzate in Serie A;
  - nazionali (Mondiali, Europei, qualificazioni europee e mondiali, spareggi, Nations League, amichevoli): prima
    l'Italia, poi le fasi finali dei tornei, la Lega A di Nations League e le sfide tra nazionali di primo piano
    (BIG_NATIONS). Un solo gruppo per giorno, tutte le competizioni insieme. Amichevoli solo con almeno una nazionale
    di primo piano (o l'Italia), mai le giovanili.
La scelta di una giornata si fa una volta sola, la prima volta che una sua partita entra nella finestra, e resta
salvata nell'indice: così non cambia se la classifica si muove durante il weekend.

Ogni video si genera quando mancano tra MIN_LEAD e HORIZON ore al calcio d'inizio; si rifà se le probabilità 1X2
pubblicate sono cambiate di almeno REDO punti e mancano più di 6 ore. I file vanno in
<out>/analisi/calcio/<AAAA-MM-GG>/<partita>-16x9.mp4 (e 9x16, poster), lo stesso percorso del bucket R2 (docs/video.md);
l'elenco dei file nuovi finisce in --uploads, l'indice (--store/index.json) nel ramo `video-partite`.

Uso:
  python3 scripts/guide-videos/match_videos.py --football football.json --archive <archivio-pronostici> \\
      --store <cartella dell'indice> --out public/video [--uploads /tmp/upload.txt] [--now 2026-11-21T08:00:00Z] \\
      [--dry-run]
"""
import argparse, json, math, re, sys
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
    # nazionali
    "Mondiali": "nations-final",
    "Europei": "nations-final",
    "Spareggi intercontinentali Mondiali": "nations-final",
    "Nations League": "nations",
    "Qualificazioni Europei": "nations",
    "Qualificazioni Mondiali Europa": "nations",
    "Amichevoli internazionali": "friendly",
}
NATIONAL_KINDS = {"nations-final", "nations", "friendly"}
# nazionali di primo piano (nomi come nel sito): servono a scegliere tra partite senza l'Italia e ad ammettere le amichevoli
BIG_NATIONS = {
    "Spagna", "Francia", "Argentina", "Inghilterra", "Brasile", "Portogallo", "Paesi Bassi", "Belgio", "Germania",
    "Croazia", "Marocco", "Colombia", "Uruguay", "Stati Uniti", "Messico", "Giappone", "Svizzera", "Danimarca",
    "Norvegia", "Turchia", "Austria", "Senegal",
}
YOUTH = re.compile(r"\bU\d{2}\b")
PER_ROUND = 3
MIN_LEAD = timedelta(hours=3)
HORIZON = timedelta(hours=36)
KEEP_AFTER = timedelta(days=2)
REDO = 0.03


def iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def rome_day(e):
    return f"{parse(e['kickoff']).astimezone(ROME):%Y-%m-%d}"


def teams_of(e, football):
    _, m = find_match(football, e["id"])
    if m:
        return [m["homeTeam"].get("shortName") or m["homeTeam"]["name"],
                m["awayTeam"].get("shortName") or m["awayTeam"]["name"]]
    return e["label"].split(" – ", 1)


def eligible(e, football):
    kind = COMPS.get(e.get("where"))
    if not kind:
        return False
    if kind == "friendly":
        if YOUTH.search(e["label"]):
            return False
        return bool(set(teams_of(e, football)) & (BIG_NATIONS | {"Italia"}))
    return True


def positions(comp):
    out = {}
    for st in (comp or {}).get("standings") or []:
        for r in st.get("table") or []:
            out.setdefault(r["team"]["id"], r["position"])
    return out


def round_key(e, football):
    if COMPS[e["where"]] in NATIONAL_KINDS:
        return f"Nazionali|{rome_day(e)}"
    _, m = find_match(football, e["id"])
    if m and m.get("matchday"):
        return f"{e['where']}|g{m['matchday']}"
    return f"{e['where']}|{rome_day(e)}"


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
        return 50 - sum(ps) / 4 if ids and all(ps) else 10
    if kind == "italy-cup":
        ps = [sa_pos.get(i, 21) for i in ids] or [21, 21]
        return 70 - sum(ps) / 2
    # nazionali
    names = teams_of(e, football)
    if "Italia" in names:
        return 200
    big = sum(n in BIG_NATIONS for n in names)
    p = e["prediction"]["p"]
    balance = 5 - 10 * abs(p[0] - p[2])  # a parità, la partita più equilibrata
    if kind == "nations-final":
        return 120 + 15 * big + balance
    group = (m or {}).get("group") or ""
    tier = {"A": 30, "B": 15, "C": 5}.get(group.split("Lega ")[-1][:1], 0) if "Lega " in group else 0
    return 60 + tier + 15 * big + balance - (20 if kind == "friendly" else 0)


def has_italian(e, football, sa_pos):
    """Coppe europee: la partita ha una squadra di Serie A (queste vanno tutte, anche oltre PER_ROUND)."""
    if COMPS[e["where"]] != "europe":
        return False
    _, m = find_match(football, e["id"])
    return bool(m) and any(m[s]["id"] in sa_pos for s in ("homeTeam", "awayTeam"))


def postponed(e, football):
    _, m = find_match(football, e["id"])
    return bool(m and m.get("status") in ("POSTPONED", "CANCELLED", "SUSPENDED"))


def plan(football, archive, index, now):
    """Aggiorna index["rounds"] e restituisce le partite da generare (con il motivo)."""
    sa = next((c for c in football.get("competitions", []) if c.get("code") == "SA"), None)
    sa_pos = positions(sa)
    rounds = index.setdefault("rounds", {})
    by_round = {}
    for e in archive.values():
        if eligible(e, football):
            by_round.setdefault(round_key(e, football), []).append(e)
    todo = []
    for e in sorted(archive.values(), key=lambda x: x["kickoff"]):
        if not eligible(e, football) or postponed(e, football):
            continue
        ko = parse(e["kickoff"])
        if not (now + MIN_LEAD < ko <= now + HORIZON):
            continue
        key = round_key(e, football)
        if key not in rounds:
            ranked = sorted(by_round[key], key=lambda x: (-score(x, football, sa_pos), x["kickoff"], x["id"]))
            ita = [x for x in ranked if has_italian(x, football, sa_pos)]
            rest = [x for x in ranked if x not in ita]
            chosen = ita + rest[: max(0, PER_ROUND - len(ita))]
            rounds[key] = {"chosen": [x["id"] for x in chosen], "decided": iso(now)}
        if e["id"] not in rounds[key]["chosen"]:
            continue
        old = index["videos"].get(str(e["id"]))
        if not old:
            todo.append((e, "nuovo"))
        elif ko - now > timedelta(hours=6) and max(abs(a - b) for a, b in zip(old["p"], e["prediction"]["p"])) >= REDO:
            todo.append((e, "probabilità cambiate"))
    return todo


def prune(index, now):
    """Toglie dall'indice le partite finite da più di KEEP_AFTER (i file restano nel bucket)."""
    for k, v in list(index["videos"].items()):
        if parse(v["kickoff"]) < now - KEEP_AFTER:
            del index["videos"][k]
    for k, v in list(index["rounds"].items()):
        if parse(v["decided"]) < now - timedelta(days=30):
            del index["rounds"][k]


def video_key(e):
    """analisi/calcio/<data italiana>/<slug della pagina> (videoKeys.analisi in src/data/videos.ts)."""
    return f"analisi/calcio/{rome_day(e)}/{e['path'].rstrip('/').split('/')[-1]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--football", required=True)
    ap.add_argument("--archive", required=True)
    ap.add_argument("--store", required=True, help="cartella con index.json (checkout del ramo video-partite)")
    ap.add_argument("--out", default="public/video", help="radice dei file, con la struttura del bucket")
    ap.add_argument("--uploads", help="file in cui aggiungere l'elenco dei file generati (da caricare nel bucket)")
    ap.add_argument("--now")
    ap.add_argument("--dry-run", action="store_true", help="stampa le partite scelte senza generare nulla")
    a = ap.parse_args()
    now = parse(a.now) if a.now else datetime.now(timezone.utc)
    football = json.loads(Path(a.football).read_text("utf-8"))
    archive = load_archive(a.archive)
    store = Path(a.store)
    store.mkdir(parents=True, exist_ok=True)
    idx_file = store / "index.json"
    index = json.loads(idx_file.read_text("utf-8")) if idx_file.exists() else {}
    index.setdefault("videos", {})
    index.setdefault("rounds", {})
    before = json.dumps({k: v for k, v in index.items() if k != "updated"}, sort_keys=True)

    todo = plan(football, archive, index, now)
    for e, why in todo:
        print(f"{e['kickoff']}  {e['where']}: {e['label']} ({why}) → {video_key(e)}", flush=True)
    if a.dry_run:
        return
    # playwright serve solo per generare: la prova a secco gira con il python di sistema, senza playwright
    from render import render_board  # noqa: E402
    prune(index, now)
    out_root = Path(a.out)
    for e, _ in todo:
        key = video_key(e)
        board = build(e, football, now.astimezone(ROME))
        board["slug"] = key.split("/")[-1]
        seconds = render_board(board, out_root / Path(key).parent)
        if a.uploads:
            with open(a.uploads, "a", encoding="utf-8") as f:
                for suf in ("16x9.mp4", "9x16.mp4", "16x9.jpg", "9x16.jpg"):
                    f.write(f"{out_root / key}-{suf}\n")
        index["videos"][str(e["id"])] = {
            "id": e["id"], "label": e["label"], "where": e["where"], "kickoff": e["kickoff"], "path": e["path"],
            "generated": iso(now), "seconds": math.ceil(seconds), "p": e["prediction"]["p"], "key": key,
        }
    if json.dumps({k: v for k, v in index.items() if k != "updated"}, sort_keys=True) != before:
        index["updated"] = iso(now)
        idx_file.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"{len(todo)} video generati, {len(index['videos'])} nell'indice")


if __name__ == "__main__":
    main()
