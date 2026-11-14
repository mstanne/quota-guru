#!/usr/bin/env python3
"""
Video riassuntivi delle guide.

Uso:
  python3 scripts/guide-videos/render.py <slug> [--aspect landscape|portrait|both] [--stills 3.5,12,30]

Legge scripts/guide-videos/storyboards/<slug>.json, disegna ogni fotogramma con player.html (Playwright/Chromium)
e scrive in public/video/guide/:
  <slug>-16x9.mp4, <slug>-9x16.mp4  (H.264, 30 fps, musica di sottofondo AAC; --voice aggiunge la voce, --no-audio per il muto)
  <slug>-16x9.jpg, <slug>-9x16.jpg  (poster)
Con --stills salva solo i fotogrammi indicati (in /tmp/guide-video-stills) per controllare l'impaginazione.

Musica: music.py (generata, originale). Di default i video hanno solo la musica.
Voce (opzionale, --voice): campo "voice" di ogni scena, letto con Piper TTS (voce italiana it_IT-paola-medium, scaricata al primo uso
in ~/.cache/quota-guru-tts). Ogni scena dura almeno quanto la sua voce. Musica: music.py (generata, originale),
abbassata automaticamente mentre parla la voce.

Requisiti: python3 con playwright (`pip install playwright && playwright install chromium`), piper-tts, numpy,
scipy e ffmpeg.
"""
import argparse, base64, json, os, shutil, subprocess, sys, tempfile, urllib.request, wave
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "public" / "video" / "guide"
FPS = 30
SIZES = {"landscape": (1920, 1080, "16x9"), "portrait": (1080, 1920, "9x16")}
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-tune", "animation", "-pix_fmt", "yuv420p", "-r", str(FPS)]


VOICE = "it_IT-paola-medium"
VOICE_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/"
CACHE = Path.home() / ".cache" / "quota-guru-tts"
VOFF, VOFF_INTRO, TAIL = 0.5, 0.9, 0.9  # attacco della voce in ogni scena e pausa dopo (s)


def voice_model():
    CACHE.mkdir(parents=True, exist_ok=True)
    for ext in (".onnx", ".onnx.json"):
        f = CACHE / (VOICE + ext)
        if not f.exists():
            print(f"  scarico {f.name}…", flush=True)
            urllib.request.urlretrieve(VOICE_URL + VOICE + ext, f)
    return CACHE / (VOICE + ".onnx")


def wav_seconds(path):
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def synth_voices(board, work):
    """Una traccia voce per scena; allunga la scena se la voce non ci sta."""
    model = voice_model()
    for i, sc in enumerate(board["scenes"]):
        if not sc.get("voice"):
            continue
        out = work / f"v{i:02d}.wav"
        subprocess.run([sys.executable, "-m", "piper", "-m", str(model), "-f", str(out),
                        "--length-scale", "0.95", "--sentence-silence", "0.3"],
                       input=sc["voice"].encode(), check=True, capture_output=True)
        sc["voiceAt"] = VOFF_INTRO if sc["type"] == "intro" else VOFF
        sc["dur"] = round(max(sc["dur"], sc["voiceAt"] + wav_seconds(out) + TAIL) * FPS) / FPS
        sc["voiceFile"] = str(out)


def mix_audio(board, work, total):
    music = work / "music.wav"
    subprocess.run([sys.executable, str(HERE / "music.py"), f"{total:.3f}", str(music)], check=True)
    inputs, labels, start = [], [], 0.0
    for sc in board["scenes"]:
        if sc.get("voiceFile"):
            inputs += ["-i", sc["voiceFile"]]
            ms = int((start + sc["voiceAt"]) * 1000)
            labels.append((len(labels), ms))
        start += sc["dur"]
    n = len(labels)
    out = work / "mix.m4a"
    if n == 0:  # solo musica, a volume da sottofondo
        f = f"[0:a]atrim=0:{total:.3f},loudnorm=I=-20:TP=-2:LRA=11[out]"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(music), "-filter_complex", f,
                        "-map", "[out]", "-ar", "44100", "-c:a", "aac", "-b:a", "96k", str(out)], check=True)
        return out
    f = "".join(f"[{k}:a]aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms}[d{k}];" for k, ms in labels)
    f += "".join(f"[d{k}]" for k, _ in labels) + f"amix=inputs={n}:normalize=0,apad=whole_dur={total:.3f},asplit=2[voice][key];"
    f += f"[{n}:a]volume=0.32[mus];[mus][key]sidechaincompress=threshold=0.02:ratio=6:attack=60:release=600[duck];"
    f += f"[voice][duck]amix=inputs=2:normalize=0,atrim=0:{total:.3f},loudnorm=I=-16:TP=-1.5:LRA=11[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-i", str(music), "-filter_complex", f,
                    "-map", "[out]", "-ar", "44100", "-c:a", "aac", "-b:a", "96k", str(out)], check=True)
    return out


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


def render(pw, slug, aspect, board, work, audio):
    _, _, tag = SIZES[aspect]
    browser, page, total = open_page(pw, aspect, board)
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
    av = ["-i", str(audio), "-map", "0:v", "-map", "1:a", "-c:a", "copy", "-shortest"] if audio else []
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), *av,
                    "-c:v", "copy", "-movflags", "+faststart", str(part)], check=True)
    part.rename(dest)
    # poster più leggero: JPEG ridotto alla larghezza di pagina
    pjpg = work / "poster.jpg"
    pjpg.write_bytes(poster)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(pjpg), "-vf",
                    "scale='min(1280,iw)':-2" if aspect == "landscape" else "scale=720:-2",
                    "-q:v", "4", str(OUT / f"{slug}-{tag}.jpg")], check=True)
    for f in files:
        f.unlink()
    print(f"  -> {dest.relative_to(ROOT)} ({dest.stat().st_size / 1e6:.1f} MB, {total:.1f} s)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--aspect", default="both", choices=["landscape", "portrait", "both"])
    ap.add_argument("--stills", default="")
    ap.add_argument("--no-audio", action="store_true")
    ap.add_argument("--voice", action="store_true", help="aggiunge la voce narrante (Piper TTS)")
    a = ap.parse_args()
    board = load_board(a.slug)
    work = Path(tempfile.mkdtemp(prefix=f"gv-{a.slug}-"))
    audio = None
    if not a.no_audio and not a.stills:
        if a.voice:
            synth_voices(board, work)
        total = sum(sc["dur"] for sc in board["scenes"])
        audio = mix_audio(board, work, total)
        print(f"  audio pronto: {total:.1f} s", flush=True)
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
                render(pw, a.slug, aspect, board, work, audio)
    shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
