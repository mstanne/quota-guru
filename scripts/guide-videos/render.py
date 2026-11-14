#!/usr/bin/env python3
"""
Video riassuntivi delle guide.

Uso:
  python3 scripts/guide-videos/render.py <slug> [--aspect landscape|portrait|both] [--stills 3.5,12,30]

Legge scripts/guide-videos/storyboards/<slug>.json, disegna ogni fotogramma con player.html (Playwright/Chromium)
e scrive in public/video/guide/:
  <slug>-16x9.mp4, <slug>-9x16.mp4  (H.264, 30 fps, senza audio)
  <slug>-16x9.jpg, <slug>-9x16.jpg  (poster)
Con --stills salva solo i fotogrammi indicati (in /tmp/guide-video-stills) per controllare l'impaginazione.

Requisiti: python3 con playwright (`pip install playwright && playwright install chromium`) e ffmpeg.
"""
import argparse, base64, json, os, shutil, subprocess, sys, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "public" / "video" / "guide"
FPS = 30
SIZES = {"landscape": (1920, 1080, "16x9"), "portrait": (1080, 1920, "9x16")}
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-tune", "animation", "-pix_fmt", "yuv420p", "-r", str(FPS)]


def load_board(slug):
    board = json.loads((HERE / "storyboards" / f"{slug}.json").read_text("utf-8"))
    svg = (ROOT / "src" / "assets" / "brand" / "quotaguru-logo-white.svg").read_bytes()
    board["logo"] = "data:image/svg+xml;base64," + base64.b64encode(svg).decode()
    return board


def open_page(pw, aspect, board):
    w, h, _ = SIZES[aspect]
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    page.goto((HERE / "player.html").as_uri())
    page.evaluate("document.fonts.ready")
    total = page.evaluate("([b, a]) => setup(b, a)", [board, aspect])
    page.wait_for_timeout(200)
    return browser, page, total


def shot(page, t):
    page.evaluate("(t) => renderAt(t)", t)
    return page.screenshot(type="jpeg", quality=92)


def render(pw, slug, aspect, board):
    _, _, tag = SIZES[aspect]
    browser, page, total = open_page(pw, aspect, board)
    work = Path(tempfile.mkdtemp(prefix=f"gv-{slug}-{tag}-"))
    files, start = [], 0.0
    for i, scene in enumerate(board["scenes"]):
        n = round(scene["dur"] * FPS)
        tmp, final = work / f"s{i:02d}.part.mp4", work / f"s{i:02d}.mp4"
        ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS),
                               "-c:v", "mjpeg", "-i", "-", *ENC, str(tmp)], stdin=subprocess.PIPE)
        for f in range(n):
            ff.stdin.write(shot(page, start + f / FPS))
        ff.stdin.close()
        if ff.wait() != 0:
            sys.exit(f"ffmpeg fallito sulla scena {i}")
        tmp.rename(final)
        files.append(final)
        start += scene["dur"]
        print(f"  {tag} scena {i + 1}/{len(board['scenes'])}", flush=True)
    poster = shot(page, min(2.5, total))
    browser.close()

    OUT.mkdir(parents=True, exist_ok=True)
    lst = work / "list.txt"
    lst.write_text("".join(f"file '{f}'\n" for f in files))
    dest = OUT / f"{slug}-{tag}.mp4"
    part = OUT / f".{slug}-{tag}.part.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-c", "copy", "-movflags", "+faststart", str(part)], check=True)
    part.rename(dest)
    # poster più leggero: JPEG ridotto alla larghezza di pagina
    pjpg = work / "poster.jpg"
    pjpg.write_bytes(poster)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(pjpg), "-vf",
                    "scale='min(1280,iw)':-2" if aspect == "landscape" else "scale=720:-2",
                    "-q:v", "4", str(OUT / f"{slug}-{tag}.jpg")], check=True)
    shutil.rmtree(work)
    print(f"  -> {dest.relative_to(ROOT)} ({dest.stat().st_size / 1e6:.1f} MB, {total:.1f} s)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--aspect", default="both", choices=["landscape", "portrait", "both"])
    ap.add_argument("--stills", default="")
    a = ap.parse_args()
    board = load_board(a.slug)
    aspects = ["landscape", "portrait"] if a.aspect == "both" else [a.aspect]
    with sync_playwright() as pw:
        for aspect in aspects:
            if a.stills:
                browser, page, _ = open_page(pw, aspect, board)
                d = Path("/tmp/guide-video-stills"); d.mkdir(exist_ok=True)
                for t in [float(x) for x in a.stills.split(",")]:
                    p = d / f"{a.slug}-{SIZES[aspect][2]}-{t:05.1f}.jpg"
                    p.write_bytes(shot(page, t))
                    print(p)
                browser.close()
            else:
                render(pw, a.slug, aspect, board)


if __name__ == "__main__":
    main()
