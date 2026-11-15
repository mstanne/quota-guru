#!/usr/bin/env python3
"""
Storyboard del video di pronostico di una partita di calcio, dai dati che il sito pubblica.

Fonti (le stesse del canale Telegram):
  - il pronostico pubblicato: una voce di `archivio-pronostici/calcio/<mese>.json` (probabilità, gol attesi, mercati,
    risultati esatti, percorso della pagina);
  - `src/data/football.json` del ramo `dati`: classifica, giornata e ultime partite delle squadre.

Niente loghi dei club e niente nomi di operatori (stesse regole dei post Telegram).

Uso singolo (prova):
  python3 scripts/guide-videos/match_storyboard.py <id> --football football.json --archive <cartella archivio>
Poi: python3 scripts/guide-videos/render.py /tmp/partita-<id>.json --out <cartella>
Il flusso automatico è in match_videos.py.
"""
import argparse, json, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROME = ZoneInfo("Europe/Rome")
GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre",
        "novembre", "dicembre"]
LEAGUE_TABLE = {"SA"}  # classifica mostrata solo per la Serie A (una classifica di coppa dice poco)


def pct(p, d=0):
    return f"{p * 100:.{d}f}".replace(".", ",") + "%"


def num(x, d=2):
    return f"{x:.{d}f}".replace(".", ",")


def short(t):
    return t.get("shortName") or t.get("name")


def find_match(football, match_id):
    for c in (football or {}).get("competitions", []):
        for m in c.get("matches", []):
            if m["id"] == match_id:
                return c, m
    return None, None


def form(football, team_id, before):
    """Ultime 5 partite giocate in tutte le competizioni, dalla più recente (come i badge del sito)."""
    done = []
    for c in football.get("competitions", []):
        for m in c.get("matches", []):
            ft = (m.get("score") or {}).get("fullTime") or {}
            if (m.get("status") == "FINISHED" and m["utcDate"] < before and ft.get("home") is not None
                    and team_id in (m["homeTeam"]["id"], m["awayTeam"]["id"])):
                done.append(m)
    done.sort(key=lambda m: m["utcDate"], reverse=True)
    out, gf_tot, ga_tot = [], 0, 0
    for m in done[:5]:
        ft = m["score"]["fullTime"]
        home = m["homeTeam"]["id"] == team_id
        gf, ga = (ft["home"], ft["away"]) if home else (ft["away"], ft["home"])
        gf_tot, ga_tot = gf_tot + gf, ga_tot + ga
        out.append("V" if gf > ga else "N" if gf == ga else "P")
    return out, gf_tot, ga_tot


def when_text(iso):
    w = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(ROME)
    return f"{GIORNI[w.weekday()]} {w.day} {MESI[w.month - 1]} · ore {w:%H:%M}"


def build(entry, football, now=None):
    """entry = voce dell'archivio pronostici; football = football.json (la partita può mancare)."""
    now = now or datetime.now(ROME)
    p = entry["prediction"]
    comp, m = find_match(football, entry["id"])
    if m:
        H, A = m["homeTeam"], m["awayTeam"]
        hn, an = short(H), short(A)
    else:
        hn, an = entry["label"].split(" – ", 1)
    where = entry["where"]
    kicker = f"Pronostico · {where}"
    if comp and comp.get("code") == "SA" and m.get("matchday"):
        kicker += f" · {m['matchday']}ª giornata"
    elif m and where == "Nations League" and m.get("group"):
        kicker += f" · {m['group'].split(' · ')[0]}"

    scenes = [{"type": "match", "dur": 5, "kicker": kicker, "when": when_text(entry["kickoff"]),
               "home": {"name": hn}, "away": {"name": an}}]

    if m:
        table = {}
        if comp.get("code") in LEAGUE_TABLE:
            for st in comp.get("standings") or []:
                for r in st.get("table") or []:
                    table[r["team"]["id"]] = r
        teams = []
        for t in (H, A):
            f, gf, ga = form(football, t["id"], m["utcDate"])
            r = table.get(t["id"])
            stats = [[f"{r['position']}°", "in classifica"], [str(r["points"]), "punti"]] if r else []
            if len(f) >= 3:
                stats.append([f"{gf}-{ga}", f"gol fatti-subiti, ultime {len(f)}"])
            teams.append({"name": short(t), "stats": stats, "form": f})
        if all(len(t["form"]) >= 3 for t in teams):
            scenes.append({"type": "teams", "dur": 8, "title": "Classifica e forma" if table else "Il momento delle squadre",
                           "formLabel": "dalla più recente", "teams": teams,
                           "note": "Ultime partite in tutte le competizioni: V vittoria, N pareggio, P sconfitta."})

    p1, px, p2 = p["p"]
    scenes.append({"type": "probs", "dur": 9, "title": "Le probabilità del modello",
                   "rows": [{"label": hn, "p": p1, "fair": num(1 / p1)},
                            {"label": "Pareggio", "p": px, "fair": num(1 / px)},
                            {"label": an, "p": p2, "fair": num(1 / p2)}],
                   "note": "Stime del modello di Quota Guru, non quote di un operatore. Quota equa = 1 ÷ probabilità, senza margine."})

    q = p.get("qualify")
    if q:
        trophy = entry.get("final") or where == "Supercoppa Italiana"
        scenes.append({"type": "probs", "dur": 7, "title": "Chi alza il trofeo" if trophy else "Chi passa il turno",
                       "rows": [{"label": hn, "p": q[0], "fair": num(1 / q[0])},
                                {"label": an, "p": q[1], "fair": num(1 / q[1])}],
                       "note": "Compresi supplementari e rigori, se previsti."})

    items = []
    if p.get("xg"):
        items.append({"big": f"{num(p['xg'][0])} – {num(p['xg'][1])}", "title": "Gol attesi (xG)", "text": f"{hn} – {an}"})
    if (p.get("over") or {}).get("2.5") is not None:
        items.append({"big": pct(p["over"]["2.5"]), "title": "Over 2,5", "text": "Almeno 3 gol in totale."})
    if p.get("btts") is not None:
        items.append({"big": pct(p["btts"]), "title": "Goal", "text": "Segnano entrambe le squadre."})
    if items:
        scenes.append({"type": "cards", "dur": 8, "title": "Gol attesi e mercati", "step": 0.5, "items": items})

    scores = (p.get("scores") or [])[:3]
    if scores:
        scenes.append({"type": "cards", "dur": 7.5, "title": "I risultati esatti più probabili", "step": 0.5,
                       "items": [{"big": f"{s[0]}-{s[1]}", "title": pct(s[2], 1)} for s in scores],
                       "note": f"Anche il risultato più probabile si verifica in media circa una volta su {round(1 / scores[0][2])}."})

    k = max(range(3), key=lambda i: p["p"][i])
    fav = [f"l'1 (vittoria {hn})", "la X (pareggio)", f"il 2 (vittoria {an})"][k]
    scenes.append({"type": "callout", "tone": "warn", "dur": 6.5, "title": "Probabilità, non certezze",
                   "text": f"Per il modello l'esito più probabile è {fav}, ma in circa il {pct(1 - p['p'][k])} dei casi la partita finirebbe diversamente.",
                   "note": "Nessun pronostico è sicuro. Gioca solo ciò che puoi permetterti di perdere."})
    scenes.append({"type": "outro", "dur": 5,
                   "text": "Analisi completa, statistiche e confronto nella pagina della partita su quotaguru.it.",
                   "cta": f"Dati del {now:%d/%m/%Y, ore %H:%M} · Quota Guru"})
    return {"slug": f"partita-{entry['id']}", "scenes": scenes}


def load_archive(folder):
    out = {}
    for f in sorted(Path(folder).glob("calcio/*.json")):
        for e in json.loads(f.read_text("utf-8")).values():
            out[e["id"]] = e
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("match_id", type=int)
    ap.add_argument("--football", required=True)
    ap.add_argument("--archive", required=True)
    ap.add_argument("--out")
    a = ap.parse_args()
    entry = load_archive(a.archive).get(a.match_id)
    if not entry:
        sys.exit(f"nessun pronostico pubblicato per la partita {a.match_id}")
    board = build(entry, json.loads(Path(a.football).read_text("utf-8")))
    out = Path(a.out or f"/tmp/partita-{a.match_id}.json")
    out.write_text(json.dumps(board, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(out)


if __name__ == "__main__":
    main()
