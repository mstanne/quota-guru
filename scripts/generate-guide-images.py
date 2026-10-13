"""Generates the guide illustrations (src/assets/guides/<slug>.svg).

Original vector artwork in the QuotaGuru palette, one per guide. Sport/education themed only:
no casino imagery, no cash piles, no "big win" messages.

Canvas 1600x900 (16:9). The pages crop it with object-cover (cover ~2.4:1, cards ~2:1, mobile ~1.6:1),
so all important content stays inside the safe area x 120-1480, y 130-770.

Usage:  python3 scripts/generate-guide-images.py        (writes only inside src/assets/guides)
"""
from math import cos, pi, sin
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "guides"
W, H = 1600, 900

NAVY = "#0F1A2C"
DEEP = "#0A1220"
PANEL = "#16243B"
LINE = "#2A3D59"
LIGHT = "#EEF0F3"
GREY = "#BECED8"
MUTED = "#7F93AE"
ORANGE = "#FB6801"
GREEN = "#06BA55"
AMBER = "#FBBF24"
RED = "#E5484D"
FONT = "Inter, 'Segoe UI', Roboto, Arial, sans-serif"


def frame(body: str, title: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img">
<title>{title}</title>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{NAVY}"/><stop offset="1" stop-color="{DEEP}"/>
  </linearGradient>
  <radialGradient id="glowO"><stop offset="0" stop-color="{ORANGE}" stop-opacity=".22"/><stop offset="1" stop-color="{ORANGE}" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowG"><stop offset="0" stop-color="{GREEN}" stop-opacity=".18"/><stop offset="1" stop-color="{GREEN}" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="{LIGHT}" fill-opacity=".07"/></pattern>
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<rect width="{W}" height="{H}" fill="url(#dots)"/>
<circle cx="1330" cy="170" r="520" fill="url(#glowO)"/>
<circle cx="260" cy="780" r="520" fill="url(#glowG)"/>
<g font-family="{FONT}" font-weight="700">
{body}
</g>
</svg>
"""


def panel(x, y, w, h, r=28, fill=PANEL, stroke=LINE):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'


def text(x, y, s, size=40, fill=LIGHT, anchor="start", weight=700, opacity=1):
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
            f'font-weight="{weight}" fill-opacity="{opacity}">{s}</text>')


def chip(x, y, w, h, label, fill, color=DEEP, size=34):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{fill}"/>'
            + text(x + w / 2, y + h / 2 + size * 0.36, label, size, color, "middle"))


def football(cx, cy, r):
    """Classic ball: white disc, central pentagon and five side patches."""
    def pent(px, py, pr, rot):
        pts = " ".join(f"{px + pr * cos(rot + k * 2 * pi / 5):.1f},{py + pr * sin(rot + k * 2 * pi / 5):.1f}" for k in range(5))
        return f'<polygon points="{pts}" fill="{NAVY}"/>'
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{LIGHT}"/>', pent(cx, cy, r * 0.32, -pi / 2)]
    for k in range(5):
        a = -pi / 2 + k * 2 * pi / 5
        ix, iy = cx + r * 0.32 * cos(a), cy + r * 0.32 * sin(a)
        ox, oy = cx + r * 0.78 * cos(a), cy + r * 0.78 * sin(a)
        out.append(f'<line x1="{ix:.1f}" y1="{iy:.1f}" x2="{ox:.1f}" y2="{oy:.1f}" stroke="{NAVY}" stroke-width="{r*0.05:.1f}"/>')
        out.append(pent(cx + r * 1.0 * cos(a), cy + r * 1.0 * sin(a), r * 0.26, a + pi))
    clip = f"ball{cx}{cy}"
    return (f'<clipPath id="{clip}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
            f'<g clip-path="url(#{clip})">{"".join(out)}</g>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{NAVY}" stroke-width="3"/>')


def pitch(x, y, w, h, color=GREEN, op=0.55):
    s = f'stroke="{color}" stroke-opacity="{op}" stroke-width="4" fill="none"'
    bw, bh = w * 0.16, h * 0.56
    sw, sh = w * 0.06, h * 0.28
    return "".join([
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{GREEN}" fill-opacity=".06" stroke="{color}" stroke-opacity="{op}" stroke-width="4"/>',
        f'<line x1="{x+w/2}" y1="{y}" x2="{x+w/2}" y2="{y+h}" {s}/>',
        f'<circle cx="{x+w/2}" cy="{y+h/2}" r="{h*0.17}" {s}/>',
        f'<rect x="{x}" y="{y+(h-bh)/2}" width="{bw}" height="{bh}" {s}/>',
        f'<rect x="{x+w-bw}" y="{y+(h-bh)/2}" width="{bw}" height="{bh}" {s}/>',
        f'<rect x="{x}" y="{y+(h-sh)/2}" width="{sw}" height="{sh}" {s}/>',
        f'<rect x="{x+w-sw}" y="{y+(h-sh)/2}" width="{sw}" height="{sh}" {s}/>',
    ])


def arc(cx, cy, r, a0, a1, color, width, cap="butt", op=1.0):
    """Arc from a0 to a1 (degrees, 0 = right, clockwise)."""
    x0, y0 = cx + r * cos(a0 * pi / 180), cy + r * sin(a0 * pi / 180)
    x1, y1 = cx + r * cos(a1 * pi / 180), cy + r * sin(a1 * pi / 180)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return (f'<path d="M{x0:.1f},{y0:.1f} A{r},{r} 0 {large} 1 {x1:.1f},{y1:.1f}" fill="none" stroke="{color}" '
            f'stroke-width="{width}" stroke-linecap="{cap}" stroke-opacity="{op}"/>')


# ---------------------------------------------------------------------------------------------- scenes

def guida_completa():
    b = [pitch(130, 200, 700, 500), football(480, 450, 92)]
    # dashed pass towards the slip
    b.append(f'<path d="M590,410 C700,300 800,300 880,330" fill="none" stroke="{ORANGE}" stroke-width="6" stroke-dasharray="4 18" stroke-linecap="round"/>')
    b.append(f'<polygon points="880,312 912,334 878,352" fill="{ORANGE}"/>')
    # slip card
    b.append(panel(930, 180, 520, 540))
    b.append(f'<rect x="930" y="180" width="520" height="84" rx="28" fill="{ORANGE}"/><rect x="930" y="236" width="520" height="28" fill="{ORANGE}"/>')
    b.append(text(970, 236, "1X2 · Esito finale", 34, DEEP))
    rows = [("1", "Casa", "2,50", True), ("X", "Pareggio", "3,20", False), ("2", "Ospite", "2,90", False)]
    for i, (k, lab, q, sel) in enumerate(rows):
        y = 300 + i * 96
        b.append(f'<rect x="960" y="{y}" width="460" height="76" rx="16" fill="{DEEP}" stroke="{GREEN if sel else LINE}" stroke-width="{4 if sel else 2}"/>')
        b.append(text(990, y + 50, k, 34, GREY))
        b.append(text(1040, y + 50, lab, 32, LIGHT, weight=600))
        b.append(chip(1290, y + 14, 110, 48, q, GREEN if sel else LINE, DEEP if sel else LIGHT, 30))
    b.append(f'<line x1="960" y1="606" x2="1420" y2="606" stroke="{LINE}" stroke-width="2"/>')
    b.append(text(960, 664, "10 € × 2,50", 34, GREY, weight=600))
    b.append(text(1420, 664, "= 25 €", 38, GREEN, "end"))
    return frame("".join(b), "Pallone su un campo da calcio e schedina con quota 2,50")


def come_leggere_quote():
    b = []
    tiles = [("1", "2,10", "47,6%"), ("X", "3,40", "29,4%"), ("2", "3,60", "27,8%")]
    for i, (k, q, p) in enumerate(tiles):
        x = 140 + i * 250
        b.append(panel(x, 250, 220, 300, 26))
        b.append(text(x + 110, 312, k, 40, MUTED, "middle"))
        b.append(text(x + 110, 418, q, 76, LIGHT, "middle"))
        b.append(f'<line x1="{x+30}" y1="458" x2="{x+190}" y2="458" stroke="{LINE}" stroke-width="2"/>')
        b.append(text(x + 110, 512, p, 36, GREEN if i == 0 else GREY, "middle", 600))
    b.append(text(140, 640, "1 ÷ quota = probabilità implicita", 38, GREY, weight=600))
    # donut: segments proportional to 104.8 overall, margin highlighted
    cx, cy, r = 1170, 440, 210
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{PANEL}" stroke-width="64"/>')
    a = -90.0
    for share, color in [(47.6, GREEN), (29.4, GREY), (23.0, MUTED)]:
        span = share / 100 * 360
        b.append(arc(cx, cy, r, a + 1.5, a + span - 1.5, color, 64))
        a += span
    b.append(arc(cx, cy, r + 58, -90 - 17.3, -90, ORANGE, 22, "round"))  # 4.8% of 360 ≈ 17.3°
    b.append(text(cx, cy + 6, "104,8%", 66, LIGHT, "middle"))
    b.append(text(cx, cy + 56, "somma delle probabilità", 26, MUTED, "middle", 600))
    b.append(chip(cx - 260, 160, 220, 56, "margine 4,8%", ORANGE, DEEP, 28))
    return frame("".join(b), "Tre quote 1X2 con le probabilità implicite e un grafico ad anello del margine")


def analizzare_partita():
    b = [pitch(130, 190, 760, 520, LIGHT, 0.35)]
    home = [(260, 450), (390, 300), (390, 600), (540, 380), (540, 530)]
    away = [(800, 450), (650, 300), (650, 600), (670, 450)]
    for x, y in home:
        b.append(f'<circle cx="{x}" cy="{y}" r="26" fill="{ORANGE}"/>')
    for x, y in away:
        b.append(f'<g stroke="{GREY}" stroke-width="10" stroke-linecap="round"><line x1="{x-20}" y1="{y-20}" x2="{x+20}" y2="{y+20}"/><line x1="{x+20}" y1="{y-20}" x2="{x-20}" y2="{y+20}"/></g>')
    for d in ["M560,370 C620,300 700,250 790,260", "M410,610 C520,690 640,680 720,620"]:
        b.append(f'<path d="{d}" fill="none" stroke="{GREEN}" stroke-width="6" stroke-dasharray="16 14" stroke-linecap="round"/>')
    b.append(f'<polygon points="788,240 822,262 786,282" fill="{GREEN}"/>')
    b.append(f'<polygon points="712,596 742,628 704,640" fill="{GREEN}"/>')
    # stats panel
    b.append(panel(960, 190, 490, 520))
    b.append(text(1000, 258, "Ultime 5", 34, LIGHT))
    form = [GREEN, GREEN, MUTED, ORANGE, GREEN]
    for i, c in enumerate(form):
        b.append(f'<rect x="{1000 + i*82}" y="286" width="64" height="64" rx="14" fill="{c}"/>')
    b.append(text(1000, 430, "Gol fatti / subiti", 30, GREY, weight=600))
    bars = [(150, 90), (110, 120), (170, 60), (130, 100)]
    for i, (f, s) in enumerate(bars):
        x = 1010 + i * 108
        b.append(f'<rect x="{x}" y="{670-f}" width="38" height="{f}" rx="8" fill="{GREEN}"/>')
        b.append(f'<rect x="{x+44}" y="{670-s}" width="38" height="{s}" rx="8" fill="{MUTED}"/>')
    b.append(f'<line x1="1000" y1="672" x2="1420" y2="672" stroke="{LINE}" stroke-width="3"/>')
    return frame("".join(b), "Lavagna tattica con schemi di gioco e pannello con forma e statistiche")


def gestione_budget():
    b = []
    cx, cy, r = 520, 560, 300
    b.append(arc(cx, cy, r, 180, 252, GREEN, 54))
    b.append(arc(cx, cy, r, 254, 306, AMBER, 54))
    b.append(arc(cx, cy, r, 308, 360, ORANGE, 54))
    ang = 180 + 0.42 * 180
    nx, ny = cx + (r - 70) * cos(ang * pi / 180), cy + (r - 70) * sin(ang * pi / 180)
    b.append(f'<line x1="{cx}" y1="{cy}" x2="{nx:.1f}" y2="{ny:.1f}" stroke="{LIGHT}" stroke-width="14" stroke-linecap="round"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="26" fill="{LIGHT}"/>')
    b.append(text(cx, cy + 110, "12 € su 30 €", 52, LIGHT, "middle"))
    b.append(text(cx, cy + 160, "budget del mese", 30, MUTED, "middle", 600))
    # shield with check
    sx, sy = 1010, 200
    b.append(f'<path d="M{sx+150},{sy} L{sx+300},{sy+56} L{sx+300},{sy+190} C{sx+300},{sy+300} {sx+230},{sy+370} {sx+150},{sy+410} C{sx+70},{sy+370} {sx},{sy+300} {sx},{sy+190} L{sx},{sy+56} Z" fill="{PANEL}" stroke="{GREEN}" stroke-width="8"/>')
    b.append(f'<path d="M{sx+90},{sy+205} L{sx+135},{sy+250} L{sx+220},{sy+160}" fill="none" stroke="{GREEN}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>')
    # limits list
    for i, (lab, on) in enumerate([("Limite di deposito", True), ("Promemoria tempo", True)]):
        y = 650 + i * 64
        b.append(f'<rect x="{sx-40}" y="{y}" width="380" height="50" rx="25" fill="{PANEL}" stroke="{LINE}" stroke-width="2"/>')
        b.append(text(sx - 14, y + 34, lab, 26, LIGHT, weight=600))
        b.append(f'<rect x="{sx+256}" y="{y+9}" width="64" height="32" rx="16" fill="{GREEN if on else LINE}"/><circle cx="{sx+304}" cy="{y+25}" r="12" fill="{LIGHT}"/>')
    return frame("".join(b), "Indicatore del budget mensile e scudo con i limiti di gioco attivi")


def tennis():
    b = []
    courts = [("Terra", "#C2593A"), ("Erba", "#3E8E41"), ("Cemento", "#2B5DA8")]
    for i, (lab, col) in enumerate(courts):
        x, y, w, h = 150 + i * 300, 210, 250, 440
        b.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{col}"/>')
        s = f'stroke="{LIGHT}" stroke-width="4" fill="none" stroke-opacity=".9"'
        b.append(f'<rect x="{x+22}" y="{y+22}" width="{w-44}" height="{h-44}" {s}/>')
        b.append(f'<line x1="{x+48}" y1="{y+22}" x2="{x+48}" y2="{y+h-22}" {s}/><line x1="{x+w-48}" y1="{y+22}" x2="{x+w-48}" y2="{y+h-22}" {s}/>')
        b.append(f'<line x1="{x+48}" y1="{y+130}" x2="{x+w-48}" y2="{y+130}" {s}/><line x1="{x+48}" y1="{y+h-130}" x2="{x+w-48}" y2="{y+h-130}" {s}/>')
        b.append(f'<line x1="{x+w/2}" y1="{y+130}" x2="{x+w/2}" y2="{y+h-130}" {s}/>')
        b.append(f'<line x1="{x+10}" y1="{y+h/2}" x2="{x+w-10}" y2="{y+h/2}" stroke="{DEEP}" stroke-width="8"/>')
        b.append(text(x + w / 2, y + h + 66, lab, 36, GREY, "middle", 600))
    # ball with trajectory
    b.append(f'<path d="M1020,700 C1100,420 1180,330 1250,380" fill="none" stroke="{LIGHT}" stroke-opacity=".35" stroke-width="5" stroke-dasharray="3 16" stroke-linecap="round"/>')
    bx, by, r = 1290, 420, 150
    b.append(f'<circle cx="{bx}" cy="{by}" r="{r}" fill="#D4E34A"/>')
    b.append(f'<path d="M{bx-r*0.92},{by-r*0.38} C{bx-r*0.2},{by-r*0.2} {bx-r*0.2},{by+r*0.2} {bx-r*0.92},{by+r*0.38}" fill="none" stroke="{LIGHT}" stroke-width="12" stroke-linecap="round"/>')
    b.append(f'<path d="M{bx+r*0.92},{by-r*0.38} C{bx+r*0.2},{by-r*0.2} {bx+r*0.2},{by+r*0.2} {bx+r*0.92},{by+r*0.38}" fill="none" stroke="{LIGHT}" stroke-width="12" stroke-linecap="round"/>')
    b.append(chip(1140, 620, 300, 60, "6-4 · 3-6 · 7-5", PANEL, LIGHT, 30))
    return frame("".join(b), "Tre campi da tennis in terra, erba e cemento con una pallina")


def basket():
    b = []
    s = f'stroke="{ORANGE}" stroke-opacity=".6" stroke-width="5" fill="none"'
    b.append(f'<rect x="130" y="170" width="760" height="560" rx="12" fill="{ORANGE}" fill-opacity=".05" stroke="{ORANGE}" stroke-opacity=".6" stroke-width="5"/>')
    b.append(f'<rect x="400" y="170" width="220" height="250" {s}/>')
    b.append(f'<circle cx="510" cy="420" r="110" {s}/>')
    b.append(f'<path d="M180,170 L180,330 A330,330 0 0 0 840,330 L840,170" {s}/>')
    b.append(f'<line x1="450" y1="215" x2="570" y2="215" stroke="{LIGHT}" stroke-width="8"/>')
    b.append(f'<circle cx="510" cy="250" r="30" fill="none" stroke="{ORANGE}" stroke-width="7"/>')
    # ball
    bx, by, r = 660, 560, 120
    b.append(f'<circle cx="{bx}" cy="{by}" r="{r}" fill="{ORANGE}"/>')
    seam = f'stroke="{DEEP}" stroke-width="7" fill="none"'
    b.append(f'<line x1="{bx-r}" y1="{by}" x2="{bx+r}" y2="{by}" {seam}/><line x1="{bx}" y1="{by-r}" x2="{bx}" y2="{by+r}" {seam}/>')
    b.append(f'<path d="M{bx-r*0.7},{by-r*0.71} C{bx-r*0.3},{by-r*0.3} {bx-r*0.3},{by+r*0.3} {bx-r*0.7},{by+r*0.71}" {seam}/>')
    b.append(f'<path d="M{bx+r*0.7},{by-r*0.71} C{bx+r*0.3},{by-r*0.3} {bx+r*0.3},{by+r*0.3} {bx+r*0.7},{by+r*0.71}" {seam}/>')
    # scoreboard
    b.append(panel(960, 200, 490, 500))
    b.append(text(1205, 270, "FINALE", 30, MUTED, "middle"))
    b.append(text(1205, 380, "112 – 110", 92, LIGHT, "middle"))
    b.append(f'<line x1="1000" y1="430" x2="1410" y2="430" stroke="{LINE}" stroke-width="2"/>')
    b.append(text(1000, 500, "Totale punti", 32, GREY, weight=600))
    b.append(text(1410, 500, "222", 38, LIGHT, "end"))
    b.append(text(1000, 570, "Soglia", 32, GREY, weight=600))
    b.append(text(1410, 570, "224,5", 38, LIGHT, "end"))
    b.append(chip(1000, 610, 410, 64, "Under 224,5", GREEN, DEEP, 32))
    return frame("".join(b), "Metà campo da basket con pallone e tabellone con totale punti e soglia Over/Under")


def in_diretta():
    b = []
    b.append(panel(140, 160, 1320, 170))
    b.append(chip(180, 214, 150, 62, "● LIVE", RED, LIGHT, 30))
    b.append(text(380, 262, "Casa", 44, LIGHT))
    b.append(text(800, 268, "1 – 0", 72, LIGHT, "middle"))
    b.append(text(1040, 262, "Ospite", 44, LIGHT))
    b.append(text(1420, 262, "67'", 48, GREEN, "end"))
    # odds chart
    b.append(panel(140, 370, 1320, 400))
    x0, x1, y0, y1 = 200, 1400, 420, 720
    for k in range(4):
        y = y0 + k * (y1 - y0) / 3
        b.append(f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="{LINE}" stroke-width="2" stroke-dasharray="6 10"/>')
    pts = [(200, 560), (300, 552), (400, 566), (500, 548), (600, 556), (700, 540), (760, 540)]
    pts2 = [(860, 660), (960, 650), (1060, 664), (1160, 656), (1260, 670), (1400, 676)]
    path = "M" + " L".join(f"{x},{y}" for x, y in pts)
    path2 = "M" + " L".join(f"{x},{y}" for x, y in pts2)
    b.append(f'<rect x="760" y="{y0}" width="100" height="{y1-y0}" fill="{AMBER}" fill-opacity=".12"/>')
    b.append(f'<line x1="760" y1="{y0}" x2="760" y2="{y1}" stroke="{AMBER}" stroke-width="3"/>')
    b.append(f'<g transform="translate(790,{y0+26})"><rect width="12" height="40" rx="3" fill="{AMBER}"/><rect x="24" width="12" height="40" rx="3" fill="{AMBER}"/></g>')
    b.append(f'<path d="{path}" fill="none" stroke="{GREY}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>')
    b.append(f'<path d="{path2}" fill="none" stroke="{ORANGE}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>')
    b.append(chip(600, 470, 140, 50, "2,40", PANEL, LIGHT, 28))
    b.append(chip(1250, 600, 140, 50, "1,55", ORANGE, DEEP, 28))
    b.append(text(810, 752, "gol: mercato sospeso", 24, AMBER, "middle", 600))
    return frame("".join(b), "Tabellone live al 67° minuto e grafico della quota che cambia dopo un gol")



# ---------------------------------------------------------------------------------------------- scenes (round 2)

def check(x, y, s=1.0, color=GREEN, width=10):
    return (f'<path d="M{x-18*s:.1f},{y:.1f} L{x-5*s:.1f},{y+13*s:.1f} L{x+20*s:.1f},{y-14*s:.1f}" fill="none" '
            f'stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')


def shield(x, y, w, h, stroke=GREEN, fill=PANEL, sw=8):
    return (f'<path d="M{x+w/2},{y} L{x+w},{y+h*0.14} L{x+w},{y+h*0.46} C{x+w},{y+h*0.73} {x+w*0.77},{y+h*0.9} {x+w/2},{y+h} '
            f'C{x+w*0.23},{y+h*0.9} {x},{y+h*0.73} {x},{y+h*0.46} L{x},{y+h*0.14} Z" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')


def siti_legali():
    b = [panel(170, 170, 820, 560)]
    b.append(f'<rect x="170" y="170" width="820" height="70" rx="28" fill="{LINE}"/><rect x="170" y="212" width="820" height="28" fill="{LINE}"/>')
    for i, c in enumerate([ORANGE, AMBER, GREEN]):
        b.append(f'<circle cx="{215 + i*36}" cy="205" r="11" fill="{c}"/>')
    b.append(f'<rect x="340" y="186" width="600" height="38" rx="19" fill="{DEEP}"/>')
    b.append(f'<rect x="362" y="200" width="18" height="14" rx="3" fill="{GREEN}"/><path d="M365,200 v-5 a6,6 0 0 1 12,0 v5" fill="none" stroke="{GREEN}" stroke-width="3"/>')
    b.append(text(395, 214, "https://", 22, MUTED, weight=600))
    b.append(shield(480, 290, 200, 240))
    b.append(check(580, 410, 2.2, GREEN, 18))
    b.append(text(580, 600, "Concessione n. 00000", 36, LIGHT, "middle"))
    b.append(text(580, 650, "elenco ufficiale ADM", 28, MUTED, "middle", 600))
    # unauthorised site
    b.append(panel(1080, 260, 370, 380, 24, PANEL, LINE))
    b.append(f'<rect x="1080" y="260" width="370" height="54" rx="24" fill="{LINE}"/><rect x="1080" y="290" width="370" height="24" fill="{LINE}"/>')
    b.append(f'<circle cx="1265" cy="460" r="92" fill="none" stroke="{RED}" stroke-width="18"/>')
    b.append(f'<line x1="1200" y1="395" x2="1330" y2="525" stroke="{RED}" stroke-width="18" stroke-linecap="round"/>')
    b.append(text(1265, 610, "senza concessione", 28, GREY, "middle", 600))
    return frame("".join(b), "Sito con concessione verificata e sito senza concessione barrato")


def aprire_conto():
    b = [panel(160, 170, 720, 560)]
    b.append(text(210, 245, "Registrazione", 40, LIGHT))
    for i, lab in enumerate(["Nome e cognome", "Codice fiscale", "Documento d'identità"]):
        y = 290 + i * 110
        b.append(text(210, y, lab, 24, MUTED, weight=600))
        b.append(f'<rect x="210" y="{y+14}" width="620" height="62" rx="14" fill="{DEEP}" stroke="{LINE}" stroke-width="2"/>')
        b.append(f'<rect x="234" y="{y+38}" width="{260 - i*40}" height="14" rx="7" fill="{GREY}" fill-opacity=".5"/>')
        b.append(check(796, y + 45, 0.9, GREEN, 7))
    b.append(chip(210, 630, 620, 66, "Imposta il limite di deposito", ORANGE, DEEP, 30))
    # ID card
    b.append(f'<rect x="960" y="250" width="490" height="310" rx="26" fill="{LIGHT}"/>')
    b.append(f'<rect x="960" y="250" width="490" height="70" rx="26" fill="{GREEN}"/><rect x="960" y="290" width="490" height="30" fill="{GREEN}"/>')
    b.append(f'<circle cx="1070" cy="420" r="58" fill="{GREY}"/><circle cx="1070" cy="404" r="24" fill="{LIGHT}"/><path d="M1030,460 a40,34 0 0 1 80,0" fill="{LIGHT}"/>')
    for i, w in enumerate([210, 170, 230]):
        b.append(f'<rect x="1160" y="{376 + i*36}" width="{w}" height="16" rx="8" fill="{MUTED}"/>')
    b.append(chip(1290, 590, 160, 64, "18+", PANEL, LIGHT, 32))
    b.append(text(960, 630, "verifica", 30, MUTED, weight=600))
    b.append(text(960, 670, "dell'identità", 30, MUTED, weight=600))
    return frame("".join(b), "Modulo di registrazione con campi verificati e documento d'identità")


def glossario():
    b = []
    # open book
    b.append(f'<path d="M180,250 Q430,200 680,260 L680,700 Q430,640 180,690 Z" fill="{PANEL}" stroke="{LINE}" stroke-width="3"/>')
    b.append(f'<path d="M1180,250 Q930,200 680,260 L680,700 Q930,640 1180,690 Z" fill="{PANEL}" stroke="{LINE}" stroke-width="3"/>')
    b.append(f'<line x1="680" y1="260" x2="680" y2="700" stroke="{GREY}" stroke-opacity=".5" stroke-width="4"/>')
    b.append(text(430, 340, "A", 96, ORANGE, "middle"))
    for i in range(6):
        y = 400 + i * 42
        b.append(f'<rect x="250" y="{y}" width="{340 - (i % 3) * 50}" height="14" rx="7" fill="{GREY}" fill-opacity=".35"/>')
    b.append(text(930, 340, "Z", 96, GREEN, "middle"))
    for i in range(6):
        y = 400 + i * 42
        b.append(f'<rect x="770" y="{y}" width="{330 - (i % 2) * 60}" height="14" rx="7" fill="{GREY}" fill-opacity=".35"/>')
    terms = [("Aggio", 1250, 230), ("Cash out", 1230, 330), ("Handicap", 1270, 430), ("Rollover", 1220, 530), ("Sistema", 1260, 630)]
    for t, x, y in terms:
        w = 40 + len(t) * 19
        b.append(chip(x, y, w, 62, t, LIGHT if t != "Handicap" else ORANGE, DEEP, 30))
    return frame("".join(b), "Libro aperto dalla A alla Z con alcuni termini delle scommesse")


def _slip(x, y, w, title, n, color, odds=("1,80", "2,10", "1,60")):
    out = [panel(x, y, w, 120 + n * 86, 24)]
    out.append(text(x + w / 2, y + 62, title, 32, color, "middle"))
    for i in range(n):
        yy = y + 96 + i * 86
        out.append(f'<rect x="{x+24}" y="{yy}" width="{w-48}" height="64" rx="14" fill="{DEEP}" stroke="{LINE}" stroke-width="2"/>')
        out.append(f'<rect x="{x+46}" y="{yy+25}" width="{w*0.35:.0f}" height="14" rx="7" fill="{GREY}" fill-opacity=".5"/>')
        out.append(chip(x + w - 136, yy + 12, 90, 40, odds[i], LINE, LIGHT, 24))
    return "".join(out)


def singola_multipla():
    b = [_slip(140, 300, 380, "Singola", 1, LIGHT, ("1,90",)), _slip(610, 220, 380, "Multipla", 3, ORANGE), _slip(1080, 220, 380, "Sistema 2/3", 3, GREEN)]
    b.append(text(800, 690, "1,80 × 2,10 × 1,60", 30, GREY, "middle", 600))
    b.append(text(1270, 690, "3 doppie", 30, GREY, "middle", 600))
    b.append(text(330, 560, "1 esito", 30, GREY, "middle", 600))
    return frame("".join(b), "Tre schedine: singola, multipla e sistema due su tre")


def calcolo_multipla():
    b = []
    xs = [150, 420, 690]
    for x, q in zip(xs, ["1,80", "2,10", "1,60"]):
        b.append(panel(x, 200, 210, 130, 24))
        b.append(text(x + 105, 285, q, 60, LIGHT, "middle"))
    for x in [385, 655]:
        b.append(text(x, 285, "×", 60, MUTED, "middle"))
    b.append(text(950, 285, "=", 60, MUTED, "middle"))
    b.append(chip(1010, 200, 300, 130, "6,05", ORANGE, DEEP, 72))
    # probabilities
    rows = [("A", 55.6, GREY), ("B", 47.6, GREY), ("C", 62.5, GREY), ("A+B+C", 16.5, GREEN)]
    for i, (lab, p, col) in enumerate(rows):
        y = 420 + i * 88
        b.append(text(150, y + 42, lab, 30, LIGHT if i == 3 else GREY, weight=600))
        b.append(f'<rect x="330" y="{y}" width="900" height="56" rx="14" fill="{PANEL}"/>')
        b.append(f'<rect x="330" y="{y}" width="{900*p/100:.0f}" height="56" rx="14" fill="{col}"/>')
        b.append(text(1260, y + 42, f"{str(p).replace('.', ',')}%", 34, LIGHT if i == 3 else GREY))
    return frame("".join(b), "Calcolo della quota di una multipla e probabilità che si riduce a ogni selezione")


def coin(cx, cy, r, label, fill=AMBER, color=DEEP):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/><circle cx="{cx}" cy="{cy}" r="{r*0.8:.0f}" fill="none" stroke="{color}" stroke-opacity=".35" stroke-width="5"/>'
            + text(cx, cy + r * 0.36, label, int(r * 0.95), color, "middle"))


def caso():
    b = []
    for i in range(5):
        b.append(coin(220 + i * 190, 330, 78, "C", GREY))
    b.append(f'<circle cx="1180" cy="330" r="78" fill="none" stroke="{ORANGE}" stroke-width="8" stroke-dasharray="14 12"/>')
    b.append(text(1180, 360, "?", 84, ORANGE, "middle"))
    b.append(text(800, 480, "il sesto lancio non ha memoria", 34, MUTED, "middle", 600))
    for i, (lab, col) in enumerate([("Testa", GREEN), ("Croce", GREY)]):
        x = 380 + i * 460
        b.append(panel(x, 540, 380, 180, 24))
        b.append(text(x + 40, 610, lab, 34, LIGHT))
        b.append(f'<rect x="{x+40}" y="640" width="300" height="34" rx="17" fill="{DEEP}"/><rect x="{x+40}" y="640" width="150" height="34" rx="17" fill="{col}"/>')
        b.append(text(x + 340, 610, "50%", 40, col, "end"))
    return frame("".join(b), "Cinque monete uscite croce e una sesta ancora da lanciare, con probabilità 50 e 50")


def expected_goals():
    b = []
    s = f'stroke="{LIGHT}" stroke-opacity=".35" stroke-width="4" fill="none"'
    b.append(f'<rect x="150" y="160" width="860" height="600" rx="10" fill="{GREEN}" fill-opacity=".05" stroke="{LIGHT}" stroke-opacity=".35" stroke-width="4"/>')
    b.append(f'<rect x="330" y="160" width="500" height="200" {s}/><rect x="460" y="160" width="240" height="80" {s}/>')
    b.append(f'<path d="M480,360 A110,110 0 0 0 680,360" {s}/>')
    b.append(f'<rect x="510" y="140" width="140" height="20" rx="4" fill="{LIGHT}" fill-opacity=".8"/>')
    shots = [(560, 215, 0.62, True), (600, 290, 0.32, False), (480, 300, 0.18, False), (640, 410, 0.08, False),
             (720, 330, 0.12, True), (380, 450, 0.04, False), (580, 520, 0.03, False), (840, 260, 0.06, False), (580, 240, 0.35, False)]
    for x, y, xg, goal in shots:
        r = 14 + xg * 70
        col = GREEN if goal else ORANGE
        b.append(f'<circle cx="{x}" cy="{y}" r="{r:.0f}" fill="{col}" fill-opacity="{0.9 if goal else 0.55}" stroke="{col}" stroke-width="3"/>')
    b.append(panel(1080, 220, 380, 470))
    b.append(text(1270, 300, "xG", 44, MUTED, "middle"))
    b.append(text(1270, 410, "1,8 – 0,6", 64, LIGHT, "middle"))
    b.append(f'<line x1="1120" y1="455" x2="1420" y2="455" stroke="{LINE}" stroke-width="2"/>')
    b.append(f'<circle cx="1140" cy="520" r="18" fill="{GREEN}"/>' + text(1176, 531, "gol", 30, GREY, weight=600))
    b.append(f'<circle cx="1140" cy="590" r="18" fill="{ORANGE}" fill-opacity=".55" stroke="{ORANGE}" stroke-width="3"/>' + text(1176, 601, "tiro", 30, GREY, weight=600))
    b.append(text(1120, 660, "più grande = più xG", 26, MUTED, weight=600))
    return frame("".join(b), "Mappa dei tiri con cerchi proporzionali agli expected goals e riepilogo xG")


def calendario():
    b = [panel(150, 170, 860, 560)]
    days = ["L", "M", "M", "G", "V", "S", "D"]
    for i, d in enumerate(days):
        b.append(text(220 + i * 115, 240, d, 30, MUTED, "middle"))
    marks = {(0, 2): ORANGE, (0, 6): GREEN, (1, 2): ORANGE, (1, 5): GREEN, (2, 1): ORANGE, (2, 4): GREEN, (2, 6): GREEN}
    for r in range(3):
        for c in range(7):
            x, y = 170 + c * 115, 280 + r * 145
            col = marks.get((r, c))
            b.append(f'<rect x="{x}" y="{y}" width="100" height="120" rx="14" fill="{DEEP}" stroke="{col or LINE}" stroke-width="{4 if col else 2}"/>')
            b.append(text(x + 14, y + 34, str(1 + r * 7 + c), 24, MUTED, weight=600))
            if col:
                b.append(f'<circle cx="{x+50}" cy="{y+78}" r="22" fill="{col}"/>')
    # legend + rotation
    b.append(f'<circle cx="1080" cy="250" r="14" fill="{ORANGE}"/>' + text(1104, 260, "coppa", 28, GREY, weight=600))
    b.append(f'<circle cx="1240" cy="250" r="14" fill="{GREEN}"/>' + text(1264, 260, "campionato", 28, GREY, weight=600))
    cx, cy, r = 1270, 500, 150
    b.append(arc(cx, cy, r, 200, 340, LIGHT, 14, "round", 0.8))
    b.append(arc(cx, cy, r, 20, 160, LIGHT, 14, "round", 0.8))
    b.append(f'<polygon points="{cx+r*cos(340*pi/180)+18:.0f},{cy+r*sin(340*pi/180)-6:.0f} {cx+r*cos(340*pi/180)-14:.0f},{cy+r*sin(340*pi/180)-26:.0f} {cx+r*cos(340*pi/180)-4:.0f},{cy+r*sin(340*pi/180)+22:.0f}" fill="{LIGHT}" fill-opacity=".8"/>')
    b.append(f'<polygon points="{cx+r*cos(160*pi/180)-18:.0f},{cy+r*sin(160*pi/180)+6:.0f} {cx+r*cos(160*pi/180)+14:.0f},{cy+r*sin(160*pi/180)+26:.0f} {cx+r*cos(160*pi/180)+4:.0f},{cy+r*sin(160*pi/180)-22:.0f}" fill="{LIGHT}" fill-opacity=".8"/>')
    b.append(f'<circle cx="{cx-50}" cy="{cy}" r="30" fill="{ORANGE}"/><circle cx="{cx+50}" cy="{cy}" r="30" fill="{GREY}"/>')
    b.append(text(cx, cy + 230, "turnover", 32, GREY, "middle", 600))
    return frame("".join(b), "Calendario con partite di coppa e campionato ravvicinate e simbolo di rotazione dei giocatori")


def autoesclusione():
    b = []
    cx, cy = 480, 450
    b.append(f'<circle cx="{cx}" cy="{cy}" r="250" fill="{PANEL}" stroke="{LINE}" stroke-width="3"/>')
    b.append(f'<path d="M{cx-80},{cy-40} v-60 a80,80 0 0 1 160,0 v60" fill="none" stroke="{GREEN}" stroke-width="30"/>')
    b.append(f'<rect x="{cx-125}" y="{cy-50}" width="250" height="190" rx="30" fill="{GREEN}"/>')
    b.append(f'<circle cx="{cx}" cy="{cy+30}" r="22" fill="{DEEP}"/><rect x="{cx-9}" y="{cy+40}" width="18" height="50" rx="6" fill="{DEEP}"/>')
    opts = [("30 giorni", False), ("60 giorni", False), ("90 giorni", True), ("Tempo indeterminato", False)]
    for i, (lab, sel) in enumerate(opts):
        y = 220 + i * 120
        b.append(f'<rect x="900" y="{y}" width="540" height="92" rx="20" fill="{PANEL}" stroke="{GREEN if sel else LINE}" stroke-width="{4 if sel else 2}"/>')
        b.append(f'<circle cx="950" cy="{y+46}" r="18" fill="none" stroke="{GREEN if sel else MUTED}" stroke-width="5"/>')
        if sel:
            b.append(f'<circle cx="950" cy="{y+46}" r="9" fill="{GREEN}"/>')
        b.append(text(990, y + 58, lab, 34, LIGHT, weight=600))
    return frame("".join(b), "Lucchetto dell'autoesclusione e scelta della durata")


def aiuto():
    b = []
    b.append(f'<rect x="230" y="150" width="380" height="640" rx="56" fill="{PANEL}" stroke="{LINE}" stroke-width="4"/>')
    b.append(f'<rect x="370" y="180" width="100" height="14" rx="7" fill="{LINE}"/>')
    b.append(f'<circle cx="420" cy="400" r="100" fill="{GREEN}"/>')
    b.append(f'<path d="M378,352 c-10,10 -12,40 12,70 c24,30 52,46 70,36 l16,-18 c4,-6 2,-12 -4,-16 l-24,-14 c-6,-4 -12,-2 -16,2 l-8,10 c-14,-4 -32,-22 -36,-36 l10,-8 c4,-4 6,-10 2,-16 l-14,-24 c-4,-6 -10,-8 -16,-4 Z" fill="{DEEP}"/>')
    b.append(text(420, 580, "800 558 822", 44, LIGHT, "middle"))
    b.append(text(420, 630, "gratuito e anonimo", 26, MUTED, "middle", 600))
    # chat bubbles
    b.append(f'<path d="M760,250 h560 a30,30 0 0 1 30,30 v120 a30,30 0 0 1 -30,30 h-480 l-60,50 v-50 h-20 a30,30 0 0 1 -30,-30 v-120 a30,30 0 0 1 30,-30 Z" fill="{PANEL}" stroke="{LINE}" stroke-width="3"/>')
    for i, w in enumerate([420, 320]):
        b.append(f'<rect x="790" y="{300 + i*50}" width="{w}" height="18" rx="9" fill="{GREY}" fill-opacity=".45"/>')
    b.append(f'<path d="M880,500 h500 a30,30 0 0 1 30,30 v120 a30,30 0 0 1 -30,30 h-20 v50 l-60,-50 h-420 a30,30 0 0 1 -30,-30 v-120 a30,30 0 0 1 30,-30 Z" fill="{GREEN}" fill-opacity=".18" stroke="{GREEN}" stroke-width="3"/>')
    for i, w in enumerate([380, 260]):
        b.append(f'<rect x="910" y="{550 + i*50}" width="{w}" height="18" rx="9" fill="{GREEN}" fill-opacity=".7"/>')
    return frame("".join(b), "Telefono con il numero verde 800 558 822 e conversazione di supporto")


def pagamenti():
    b = []
    b.append(f'<rect x="150" y="250" width="440" height="280" rx="30" fill="{GREY}"/>')
    b.append(f'<rect x="150" y="310" width="440" height="50" fill="{NAVY}"/>')
    b.append(f'<rect x="190" y="400" width="70" height="52" rx="8" fill="{AMBER}"/>')
    b.append(f'<rect x="190" y="480" width="260" height="16" rx="8" fill="{MUTED}"/>')
    b.append(text(370, 600, "il tuo metodo", 30, MUTED, "middle", 600))
    # arrows
    b.append(f'<line x1="640" y1="350" x2="900" y2="350" stroke="{GREEN}" stroke-width="12" stroke-linecap="round"/><polygon points="900,326 940,350 900,374" fill="{GREEN}"/>')
    b.append(f'<line x1="940" y1="450" x2="680" y2="450" stroke="{ORANGE}" stroke-width="12" stroke-linecap="round"/><polygon points="680,426 640,450 680,474" fill="{ORANGE}"/>')
    b.append(text(790, 320, "deposito", 28, GREEN, "middle"))
    b.append(text(790, 510, "prelievo", 28, ORANGE, "middle"))
    b.append(panel(990, 200, 460, 400))
    b.append(text(1030, 270, "Conto di gioco", 34, LIGHT))
    for i, w in enumerate([300, 240, 340]):
        b.append(f'<rect x="1030" y="{310 + i*48}" width="{w}" height="18" rx="9" fill="{GREY}" fill-opacity=".4"/>')
    b.append(shield(1030, 470, 70, 84, GREEN, PANEL, 6))
    b.append(check(1065, 512, 0.8, GREEN, 7))
    b.append(text(1120, 526, "documento verificato", 26, GREY, weight=600))
    b.append(chip(990, 640, 460, 64, "tempi: da subito a qualche giorno", PANEL, LIGHT, 26))
    return frame("".join(b), "Carta di pagamento, frecce di deposito e prelievo e conto di gioco con documento verificato")


def bonus_requisiti():
    b = [panel(160, 170, 860, 560)]
    b.append(text(210, 250, "Condizioni dell'offerta", 40, LIGHT))
    b.append(text(210, 330, "Requisito di giocata 5x", 30, GREY, weight=600))
    b.append(text(970, 330, "40 € / 50 €", 30, LIGHT, "end"))
    b.append(f'<rect x="210" y="355" width="760" height="40" rx="20" fill="{DEEP}"/><rect x="210" y="355" width="608" height="40" rx="20" fill="{AMBER}"/>')
    rows = [("Quota minima", "1,50"), ("Scadenza", "30 giorni"), ("Deposito minimo", "10 €")]
    for i, (k, v) in enumerate(rows):
        y = 450 + i * 82
        b.append(f'<line x1="210" y1="{y-30}" x2="970" y2="{y-30}" stroke="{LINE}" stroke-width="2"/>')
        b.append(text(210, y + 18, k, 30, GREY, weight=600))
        b.append(text(970, y + 18, v, 32, LIGHT, "end"))
    # magnifier
    b.append(f'<circle cx="1230" cy="410" r="150" fill="{GREEN}" fill-opacity=".08" stroke="{LIGHT}" stroke-width="22"/>')
    b.append(f'<line x1="1340" y1="520" x2="1450" y2="630" stroke="{LIGHT}" stroke-width="40" stroke-linecap="round"/>')
    for i, w in enumerate([160, 120, 180]):
        b.append(f'<rect x="1150" y="{360 + i*40}" width="{w}" height="16" rx="8" fill="{LIGHT}" fill-opacity=".5"/>')
    return frame("".join(b), "Condizioni di un bonus con barra del requisito di giocata e lente di ingrandimento")


def mercati_calcio():
    b = [football(800, 450, 130)]
    chips = [("1X2", 320, 200), ("Doppia chance", 640, 170), ("Goal/No goal", 1040, 200),
             ("Over 2,5", 200, 360), ("Multigol 1-3", 1140, 360),
             ("Risultato esatto", 180, 530), ("Marcatore", 1180, 530),
             ("Draw no bet", 360, 680), ("Cartellini", 700, 700), ("Angoli", 1020, 680)]
    for lab, x, y in chips:
        w = 50 + len(lab) * 18
        hot = lab in ("1X2", "Over 2,5", "Goal/No goal")
        b.append(chip(x, y, w, 62, lab, ORANGE if hot else PANEL, DEEP if hot else LIGHT, 28))
    return frame("".join(b), "Pallone circondato dai nomi dei principali mercati del calcio")


def handicap_asiatico():
    b = []
    x0, x1, y = 180, 1420, 470
    b.append(f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="{GREY}" stroke-width="6" stroke-linecap="round"/>')
    ticks = [-1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5]
    def X(v):
        return x0 + (v + 1.5) / 2.0 * (x1 - x0)
    for v in ticks:
        major = abs(v * 2 - round(v * 2)) < 1e-9
        h = 34 if major else 20
        b.append(f'<line x1="{X(v):.0f}" y1="{y-h}" x2="{X(v):.0f}" y2="{y+h}" stroke="{GREY}" stroke-width="{5 if major else 3}"/>')
        lab = (("+" if v > 0 else "") + f"{v:g}").replace(".", ",")
        b.append(text(X(v), y + 90, lab, 30 if major else 24, LIGHT if major else MUTED, "middle", 700 if major else 600))
    # split -0.75 into -0.5 and -1
    xm, xa, xb = X(-0.75), X(-0.5), X(-1)
    b.append(chip(xm - 90, 230, 180, 66, "-0,75", ORANGE, DEEP, 34))
    b.append(f'<path d="M{xm},{296} C{xm},{350} {xb},{340} {xb},{y-44}" fill="none" stroke="{ORANGE}" stroke-width="6"/>')
    b.append(f'<path d="M{xm},{296} C{xm},{350} {xa},{340} {xa},{y-44}" fill="none" stroke="{ORANGE}" stroke-width="6"/>')
    b.append(text(xb, 400, "½", 34, ORANGE, "end"))
    b.append(text(xa + 10, 400, "½", 34, ORANGE))
    b.append(panel(1060, 180, 380, 170, 24))
    b.append(text(1250, 250, "Risultato", 28, MUTED, "middle"))
    b.append(text(1250, 320, "1 – 0", 60, LIGHT, "middle"))
    b.append(chip(330, 650, 400, 64, "½ vinta su -0,5", GREEN, DEEP, 30))
    b.append(chip(770, 650, 460, 64, "½ rimborsata su -1", PANEL, LIGHT, 30))
    return frame("".join(b), "Linea dell'handicap asiatico con la puntata a -0,75 divisa tra -0,5 e -1")


def tornei_tennis():
    b = []
    # trophy
    cx = 420
    b.append(f'<path d="M{cx-150},220 h300 v90 a150,170 0 0 1 -300,0 Z" fill="{AMBER}"/>')
    b.append(f'<path d="M{cx-150},250 h-60 a60,70 0 0 0 70,110" fill="none" stroke="{AMBER}" stroke-width="20"/>')
    b.append(f'<path d="M{cx+150},250 h60 a60,70 0 0 1 -70,110" fill="none" stroke="{AMBER}" stroke-width="20"/>')
    b.append(f'<rect x="{cx-26}" y="470" width="52" height="90" fill="{AMBER}"/>')
    b.append(f'<rect x="{cx-120}" y="560" width="240" height="70" rx="12" fill="{PANEL}" stroke="{AMBER}" stroke-width="5"/>')
    b.append(f'<circle cx="{cx}" cy="320" r="46" fill="#D4E34A"/>')
    # bracket 8 -> 1
    lx, top, gap = 760, 200, 70
    ys = [top + i * gap for i in range(8)]
    for i, yy in enumerate(ys):
        b.append(f'<rect x="{lx}" y="{yy-22}" width="170" height="44" rx="10" fill="{PANEL}" stroke="{LINE}" stroke-width="2"/>')
        b.append(f'<rect x="{lx+20}" y="{yy-6}" width="{90 + (i*37) % 50}" height="12" rx="6" fill="{GREY}" fill-opacity=".5"/>')
    def join(x, ya, yb, w=70, col=LINE):
        ym = (ya + yb) / 2
        return f'<path d="M{x},{ya} H{x+w/2} V{yb} H{x}" fill="none" stroke="{col}" stroke-width="4"/><line x1="{x+w/2}" y1="{ym}" x2="{x+w}" y2="{ym}" stroke="{col}" stroke-width="4"/>'
    l2 = []
    for i in range(0, 8, 2):
        b.append(join(lx + 170, ys[i], ys[i + 1]))
        l2.append((ys[i] + ys[i + 1]) / 2)
    x2 = lx + 240
    for yy in l2:
        b.append(f'<rect x="{x2}" y="{yy-20}" width="130" height="40" rx="10" fill="{PANEL}" stroke="{LINE}" stroke-width="2"/>')
    l3 = []
    for i in range(0, 4, 2):
        b.append(join(x2 + 130, l2[i], l2[i + 1]))
        l3.append((l2[i] + l2[i + 1]) / 2)
    x3 = x2 + 200
    for yy in l3:
        b.append(f'<rect x="{x3}" y="{yy-20}" width="110" height="40" rx="10" fill="{PANEL}" stroke="{LINE}" stroke-width="2"/>')
    b.append(join(x3 + 110, l3[0], l3[1], 60, AMBER))
    b.append(f'<circle cx="{x3+190}" cy="{(l3[0]+l3[1])/2}" r="22" fill="{AMBER}"/>')
    for i, lab in enumerate(["Slam", "1000", "500", "250"]):
        b.append(chip(190 + i * 120, 680, 106, 52, lab, ORANGE if i == 0 else PANEL, DEEP if i == 0 else LIGHT, 26))
    return frame("".join(b), "Trofeo di tennis, tabellone a eliminazione diretta e categorie dei tornei")


def nba_playoff():
    b = []
    seeds = [(1, 8), (4, 5), (3, 6), (2, 7)]
    lx, top = 170, 190
    for i, (a, c) in enumerate(seeds):
        y = top + i * 140
        for j, s in enumerate((a, c)):
            yy = y + j * 56
            b.append(f'<rect x="{lx}" y="{yy}" width="230" height="46" rx="10" fill="{PANEL}" stroke="{LINE}" stroke-width="2"/>')
            b.append(text(lx + 22, yy + 33, str(s), 26, ORANGE if j == 0 else MUTED))
            b.append(f'<rect x="{lx+60}" y="{yy+17}" width="110" height="12" rx="6" fill="{GREY}" fill-opacity=".5"/>')
            b.append(text(lx + 214, yy + 33, "4" if j == 0 else str(3 - i % 3), 26, LIGHT if j == 0 else MUTED, "end"))
        ym = y + 51
        b.append(f'<path d="M{lx+230},{y+23} H{lx+270} V{y+79} H{lx+230}" fill="none" stroke="{LINE}" stroke-width="4"/><line x1="{lx+270}" y1="{ym}" x2="{lx+310}" y2="{ym}" stroke="{LINE}" stroke-width="4"/>')
    mids = [top + i * 140 + 51 for i in range(4)]
    semis = [(mids[0] + mids[1]) / 2, (mids[2] + mids[3]) / 2]
    for k, ys in enumerate(semis):
        ya, yb = mids[2 * k], mids[2 * k + 1]
        b.append(f'<path d="M{lx+310},{ya} H{lx+330} V{yb} H{lx+310}" fill="none" stroke="{LINE}" stroke-width="4"/>')
        b.append(f'<line x1="{lx+330}" y1="{ys}" x2="{lx+350}" y2="{ys}" stroke="{LINE}" stroke-width="4"/>')
        b.append(f'<rect x="{lx+350}" y="{ys-23}" width="170" height="46" rx="10" fill="{PANEL}" stroke="{LINE}" stroke-width="2"/>')
        b.append(f'<rect x="{lx+370}" y="{ys-6}" width="100" height="12" rx="6" fill="{GREY}" fill-opacity=".5"/>')
    fy = (semis[0] + semis[1]) / 2
    b.append(f'<path d="M{lx+520},{semis[0]} H{lx+550} V{semis[1]} H{lx+520}" fill="none" stroke="{ORANGE}" stroke-width="4"/>')
    b.append(f'<line x1="{lx+550}" y1="{fy}" x2="{lx+580}" y2="{fy}" stroke="{ORANGE}" stroke-width="4"/>')
    b.append(f'<rect x="{lx+580}" y="{fy-27}" width="200" height="54" rx="12" fill="{ORANGE}"/>')
    b.append(text(lx + 680, fy + 10, "Finale", 28, DEEP, "middle"))
    # ball + chip
    bx, by, r = 1250, 380, 140
    b.append(f'<circle cx="{bx}" cy="{by}" r="{r}" fill="{ORANGE}"/>')
    seam = f'stroke="{DEEP}" stroke-width="7" fill="none"'
    b.append(f'<line x1="{bx-r}" y1="{by}" x2="{bx+r}" y2="{by}" {seam}/><line x1="{bx}" y1="{by-r}" x2="{bx}" y2="{by+r}" {seam}/>')
    b.append(f'<path d="M{bx-r*0.7},{by-r*0.71} C{bx-r*0.3},{by-r*0.3} {bx-r*0.3},{by+r*0.3} {bx-r*0.7},{by+r*0.71}" {seam}/>')
    b.append(f'<path d="M{bx+r*0.7},{by-r*0.71} C{bx+r*0.3},{by-r*0.3} {bx+r*0.3},{by+r*0.3} {bx+r*0.7},{by+r*0.71}" {seam}/>')
    b.append(chip(1060, 590, 380, 64, "al meglio delle 7", PANEL, LIGHT, 30))
    b.append(chip(1060, 670, 380, 64, "play-in: 7ª – 10ª", PANEL, GREY, 28))
    return frame("".join(b), "Tabellone dei playoff NBA con le teste di serie e pallone da basket")


def cash_out():
    b = [panel(150, 170, 700, 560)]
    b.append(text(200, 250, "La tua giocata", 36, LIGHT))
    b.append(text(800, 250, "10 € × 3,00", 30, MUTED, "end", 600))
    pts = [(200, 560), (300, 540), (400, 520), (480, 470), (560, 450), (650, 420), (800, 380)]
    b.append(f'<path d="M' + " L".join(f"{x},{y}" for x, y in pts) + f'" fill="none" stroke="{GREEN}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>')
    b.append(f'<line x1="200" y1="600" x2="800" y2="600" stroke="{LINE}" stroke-width="2"/>')
    b.append(text(200, 660, "valore attuale", 28, MUTED, weight=600))
    b.append(text(800, 660, "19,80 €", 36, LIGHT, "end"))
    b.append(chip(980, 250, 470, 96, "Cash out 19,80 €", ORANGE, DEEP, 40))
    b.append(text(1000, 430, "Parziale", 30, GREY, weight=600))
    b.append(f'<rect x="1000" y="460" width="430" height="16" rx="8" fill="{PANEL}"/><rect x="1000" y="460" width="230" height="16" rx="8" fill="{ORANGE}"/>')
    b.append(f'<circle cx="1230" cy="468" r="26" fill="{LIGHT}"/>')
    b.append(text(1000, 580, "Automatico", 30, GREY, weight=600))
    b.append(f'<rect x="1366" y="552" width="64" height="34" rx="17" fill="{GREEN}"/><circle cx="1413" cy="569" r="13" fill="{LIGHT}"/>')
    b.append(text(1000, 670, "include il margine dell'operatore", 26, MUTED, weight=600))
    return frame("".join(b), "Giocata in corso con grafico del valore e pulsante di cash out totale, parziale e automatico")


SCENES2 = {
    "siti-scommesse-legali": siti_legali,
    "aprire-un-conto-di-gioco": aprire_conto,
    "glossario-scommesse": glossario,
    "singola-multipla-sistema": singola_multipla,
    "calcolare-vincita-multipla-sistema": calcolo_multipla,
    "caso-e-probabilita": caso,
    "expected-goals": expected_goals,
    "calendario-coppe-turnover": calendario,
    "autoesclusione-e-limiti-di-gioco": autoesclusione,
    "gioco-problematico-dove-chiedere-aiuto": aiuto,
    "depositi-e-prelievi": pagamenti,
    "bonus-requisiti-di-giocata": bonus_requisiti,
    "mercati-del-calcio": mercati_calcio,
    "handicap-asiatico": handicap_asiatico,
    "tornei-di-tennis": tornei_tennis,
    "nba-stagione-play-in-playoff": nba_playoff,
    "cash-out": cash_out,
}

SCENES = {
    "guida-completa-scommesse-sportive": guida_completa,
    "come-leggere-le-quote": come_leggere_quote,
    "analizzare-una-partita-di-calcio": analizzare_partita,
    "gestione-del-budget": gestione_budget,
    "scommesse-sul-tennis": tennis,
    "basket-over-under-handicap": basket,
    "scommesse-in-diretta": in_diretta,
    **SCENES2,
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, fn in SCENES.items():
        target = OUT / f"{slug}.svg"
        tmp = target.with_suffix(".svg.tmp")
        with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(fn())
        tmp.replace(target)
        print(f"{target.relative_to(OUT.parent.parent.parent)}  {target.stat().st_size // 1024 + 1} KB")


if __name__ == "__main__":
    main()
