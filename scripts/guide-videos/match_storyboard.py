#!/usr/bin/env python3
"""
Storyboard del video di una partita di calcio, a partire dai dati del sito.

Uso:
  python3 scripts/guide-videos/match_storyboard.py <id partita> --data <cartella> [--out file.json]

<cartella> è una copia del sito con i dati generati: src/data/football.json e src/data/football-predictions.json
(dopo `node scripts/fit-counts.mjs && node scripts/predict-football.mjs`), più i loghi dei club in
public/loghi/ oppure archivio/loghi/ (ramo `dati`).
Poi: python3 scripts/guide-videos/render.py <file.json> --out public/video/partite
"""
import argparse, base64, json, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROME = ZoneInfo("Europe/Rome")
GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre",
        "novembre", "dicembre"]


def pct(p, d=0):
    return f"{p * 100:.{d}f}".replace(".", ",") + "%"


def num(x, d=2):
    return f"{x:.{d}f}".replace(".", ",")


def crest_uri(root, crest):
    if not crest:
        return ""
    rel = crest.lstrip("/")
    for base in (root / "public", root / "archivio", root):
        f = base / rel
        if f.exists():
            return "data:image/png;base64," + base64.b64encode(f.read_bytes()).decode()
    return ""


def form(matches, team_id, before):
    done = [m for m in matches if m["status"] == "FINISHED" and m["utcDate"] < before
            and team_id in (m["homeTeam"]["id"], m["awayTeam"]["id"])]
    done.sort(key=lambda m: m["utcDate"])
    out = []
    for m in done[-5:]:
        ft = m["score"]["fullTime"]
        home = m["homeTeam"]["id"] == team_id
        gf, ga = (ft["home"], ft["away"]) if home else (ft["away"], ft["home"])
        out.append("V" if gf > ga else "N" if gf == ga else "P")
    return out


def build(match_id, root):
    fb = json.loads((root / "src/data/football.json").read_text("utf-8"))
    preds = json.loads((root / "src/data/football-predictions.json").read_text("utf-8"))["predictions"]
    comp = m = None
    for c in fb["competitions"]:
        for x in c["matches"]:
            if str(x["id"]) == str(match_id):
                comp, m = c, x
    if not m:
        sys.exit(f"partita {match_id} non trovata")
    p = preds.get(str(match_id))
    if not p:
        sys.exit(f"nessun pronostico per la partita {match_id}")
    H, A = m["homeTeam"], m["awayTeam"]
    hn, an = H.get("shortName") or H["name"], A.get("shortName") or A["name"]
    hc, ac = crest_uri(root, H.get("crest")), crest_uri(root, A.get("crest"))
    when = datetime.fromisoformat(m["utcDate"].replace("Z", "+00:00")).astimezone(ROME)
    when_txt = f"{GIORNI[when.weekday()]} {when.day} {MESI[when.month - 1]} · ore {when:%H:%M}"
    kicker = f"Pronostico · {comp['name']}" + (f" · {m['matchday']}ª giornata" if m.get("matchday") else "")

    table = {}
    for st in comp.get("standings") or []:
        for r in st.get("table") or []:
            table[r["team"]["id"]] = r

    def team_card(t, crest):
        r = table.get(t["id"])
        stats = [[f"{r['position']}°", "in classifica"], [str(r["points"]), "punti"],
                 [f"{r['goalsFor']}-{r['goalsAgainst']}", "gol fatti-subiti"]] if r else []
        return {"name": t.get("shortName") or t["name"], "crest": crest, "stats": stats,
                "form": form(comp["matches"], t["id"], m["utcDate"])}

    p1, px, p2 = p["p"]
    rows = [{"label": hn, "crest": hc, "p": p1, "fair": num(1 / p1)},
            {"label": "Pareggio", "p": px, "fair": num(1 / px)},
            {"label": an, "crest": ac, "p": p2, "fair": num(1 / p2)}]
    k = max(range(3), key=lambda i: rows[i]["p"])
    fav_txt = [f"l'1 (vittoria {hn})", "la X (pareggio)", f"il 2 (vittoria {an})"][k]
    other = 1 - rows[k]["p"]

    scores = p["scores"][:3]
    scenes = [
        {"type": "match", "dur": 5, "kicker": kicker, "when": when_txt,
         "home": {"name": hn, "crest": hc}, "away": {"name": an, "crest": ac}},
        {"type": "teams", "dur": 8, "title": f"Classifica e forma in {comp['name']}",
         "formLabel": "ultime 5", "teams": [team_card(H, hc), team_card(A, ac)],
         "note": "Forma: V vittoria, N pareggio, P sconfitta, dalla più vecchia alla più recente."},
        {"type": "probs", "dur": 9, "title": "Le probabilità del modello", "rows": rows,
         "note": "Stime del modello di Quota Guru, non quote di un operatore. Quota equa = 1 ÷ probabilità, senza margine."},
        {"type": "cards", "dur": 8, "title": "Gol attesi e mercati", "step": 0.5, "items": [
            {"big": f"{num(p['xg'][0])} – {num(p['xg'][1])}", "title": "Gol attesi (xG)", "text": f"{hn} – {an}"},
            {"big": pct(p["over"]["2.5"]), "title": "Over 2,5", "text": "Almeno 3 gol in totale."},
            {"big": pct(p["btts"]), "title": "Goal", "text": "Segnano entrambe le squadre."}]},
        {"type": "cards", "dur": 7.5, "title": "I risultati esatti più probabili", "step": 0.5, "items": [
            {"big": f"{s[0]}-{s[1]}", "title": pct(s[2], 1)} for s in scores],
         "note": f"Anche il risultato più probabile si verifica in media circa una volta su {round(1 / scores[0][2])}."},
        {"type": "callout", "tone": "warn", "dur": 6.5, "title": "Probabilità, non certezze",
         "text": f"Per il modello l'esito più probabile è {fav_txt}, ma in circa il {pct(other)} dei casi la partita finirebbe diversamente.",
         "note": "Nessun pronostico è sicuro. Gioca solo ciò che puoi permetterti di perdere."},
        {"type": "outro", "dur": 5, "text": "Analisi completa, quote a confronto e statistiche nella pagina della partita.",
         "cta": f"Dati aggiornati al {datetime.now(ROME):%d/%m/%Y} · Quota Guru"},
    ]
    return {"slug": f"partita-{match_id}", "scenes": scenes}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("match_id")
    ap.add_argument("--data", required=True)
    ap.add_argument("--out")
    a = ap.parse_args()
    board = build(a.match_id, Path(a.data))
    out = Path(a.out or f"/tmp/partita-{a.match_id}.json")
    out.write_text(json.dumps(board, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(out)


if __name__ == "__main__":
    main()
