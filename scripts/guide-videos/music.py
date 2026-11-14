#!/usr/bin/env python3
"""
Musica di sottofondo originale per i video delle guide, generata via codice (nessun brano di terzi).
Deterministica. Due stili:
  sport (predefinito): 124 BPM, cassa dritta, clap, charleston, basso in ottavi, accordi "stab" in levare,
                       pad con effetto pompa; giro La- Fa Do Sol.
  calm: pad morbido + arpeggio pizzicato + basso, 92 BPM.

Uso: python3 music.py <secondi> <out.wav> [sport|calm]
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 92
BEAT = 60 / BPM
# accordi (note MIDI): La-, Fa, Do, Sol — due battute ciascuno
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOTS = [45, 41, 48, 43]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, cutoff):
    from scipy.signal import lfilter  # type: ignore

    a = np.exp(-2 * np.pi * cutoff / SR)
    return lfilter([1 - a], [1, -a], x)


def pad_note(f, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for det in (-0.12, 0.0, 0.11):  # tre voci leggermente stonate = coro morbido
        ff = f * 2 ** (det / 12)
        for h, amp in ((1, 1), (2, 0.35), (3, 0.15), (4, 0.06)):
            s += amp * np.sin(2 * np.pi * ff * h * t + det * 7)
    att, rel = 1.2, 1.4
    env = np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel).clip(0)
    return s * env / 6


def pluck(f, dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)
    return s * np.exp(-t * 4.5) * np.minimum(1, t / 0.004)


def bass(f, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.exp(-t * 1.6) * np.minimum(1, t / 0.01)


def add(buf, sig, at):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i]


def make(seconds):
    n = int((seconds + 3) * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    bar = 4 * BEAT
    seg = 2 * bar
    k = 0
    t0 = 0.0
    arp = [0, 1, 2, 1, 2, 0, 1, 2]
    while t0 < seconds + 1:
        ch = CHORDS[k % 4]
        for m in ch:
            p = pad_note(hz(m), seg + 1.2)
            add(L, p, t0)
            add(R, p, t0)
        for b in range(2):
            add(L, 0.35 * bass(hz(ROOTS[k % 4]), bar), t0 + b * bar)
            add(R, 0.35 * bass(hz(ROOTS[k % 4]), bar), t0 + b * bar)
            for e in range(8):  # crome
                note = ch[arp[e]] + 12
                vel = 0.16 if e % 2 == 0 else 0.11
                pan = 0.35 + 0.3 * ((e * 3) % 4) / 3
                pl = vel * pluck(hz(note))
                at = t0 + b * bar + e * BEAT / 2
                add(L, pl * (1 - pan), at)
                add(R, pl * pan, at)
        t0 += seg
        k += 1
    # eco semplice (ping-pong) per dare spazio
    d = int(BEAT * 0.75 * SR)
    for _ in range(3):
        L[d:] += 0.22 * R[:-d]
        R[d:] += 0.22 * L[:-d]
    L, R = lowpass(L, 5000), lowpass(R, 5000)
    out = np.stack([L, R], 1)[: int(seconds * SR)]
    fade = int(2.5 * SR)
    out[:int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR))[:, None]
    out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    out /= np.abs(out).max() + 1e-9
    return (out * 0.8 * 32767).astype(np.int16)


# ---------------------------------------------------------------- stile "sport"
def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 50 + 110 * np.exp(-t * 28)  # caduta di intonazione
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) + 0.15 * np.sin(ph * 2) * np.exp(-t * 30)


def noise(n, seed):
    return np.random.default_rng(seed).uniform(-1, 1, n)


def clap(seed):
    from scipy.signal import butter, lfilter  # type: ignore

    n = int(0.25 * SR)
    t = np.arange(n) / SR
    b, a = butter(2, [900 / (SR / 2), 5000 / (SR / 2)], "band")
    x = lfilter(b, a, noise(n, seed))
    env = np.exp(-t * 18)
    for d in (0.0, 0.011, 0.022):  # tre colpi ravvicinati = clap
        env += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 120) * 0.8
    tone = 0.3 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return x * env * 1.4 + tone


def hat(seed, open_=False):
    from scipy.signal import butter, lfilter  # type: ignore

    n = int((0.22 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    b, a = butter(2, 7000 / (SR / 2), "high")
    return lfilter(b, a, noise(n, seed)) * np.exp(-t * (14 if open_ else 70))


def saw(f, n, harm=10):
    t = np.arange(n) / SR
    return sum(((-1) ** (h + 1)) * np.sin(2 * np.pi * f * h * t) / h for h in range(1, harm + 1))


def bass_note(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = saw(f, n, 8) * 0.6 + np.sin(2 * np.pi * f * t)
    return lowpass(x, 700) * np.exp(-t * 6) * np.minimum(1, t / 0.004) * np.minimum(1, (dur - t) / 0.01).clip(0)


def stab(freqs, dur=0.22):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(saw(f * 2 ** (d / 12), n, 12) for f in freqs for d in (-0.1, 0.1))
    return lowpass(x, 2600) * np.exp(-t * 11) * np.minimum(1, t / 0.003) / len(freqs)


def make_sport(seconds):
    bpm = 124
    beat = 60 / bpm
    bar = 4 * beat
    n = int((seconds + 3) * SR)
    L, R = np.zeros(n), np.zeros(n)

    def put(sig, at, gl=1.0, gr=1.0):
        add(L, sig * gl, at)
        add(R, sig * gr, at)

    K, H, HO = kick(), [hat(s) for s in range(8)], hat(99, True)
    pump = np.ones(n)  # inviluppo "pompa" applicato a pad e stab
    t0, k, nbar = 0.0, 0, 0
    while t0 < seconds + bar:
        ch = CHORDS[(nbar // 2) % 4]
        root = ROOTS[(nbar // 2) % 4]
        intro = nbar < 1  # prima battuta: solo charleston e basso, poi entra tutto
        for b in range(4):
            at = t0 + b * beat
            if not intro:
                put(0.9 * K, at)
                i = int(at * SR)
                m = min(n, i + int(beat * SR))
                pump[i:m] = np.minimum(pump[i:m], 0.35 + 0.65 * np.minimum(1, np.arange(m - i) / (beat * SR * 0.6)))
                if b in (1, 3):
                    put(0.45 * clap(nbar * 4 + b), at, 0.9, 1.0)
            for s16 in range(4):  # charleston in sedicesimi, accento in levare
                h = H[(nbar + b + s16) % 8] * (0.22 if s16 == 2 else 0.09)
                put(h, at + s16 * beat / 4, 0.7, 1.0)
            if b == 3 and nbar % 2 == 1:
                put(0.12 * HO, at + beat / 2, 1.0, 0.7)
            # basso in ottavi: tonica, ottava in levare
            put(0.42 * bass_note(hz(root - 12), beat / 2 * 0.9), at)
            put(0.32 * bass_note(hz(root), beat / 2 * 0.9), at + beat / 2)
        nbar += 1
        t0 += bar
    # pad + stab (passano dalla pompa)
    P = np.zeros(n)
    t0, nbar = 0.0, 0
    while t0 < seconds + bar:
        ch = CHORDS[(nbar // 2) % 4]
        if nbar % 2 == 0:
            for m in ch:
                add(P, 0.5 * pad_note(hz(m), 2 * bar + 0.8), t0)
        if nbar >= 1:
            for b in range(4):
                add(P, 0.28 * stab([hz(m + 12) for m in ch]), t0 + b * beat + beat / 2)
        nbar += 1
        t0 += bar
    P *= pump
    L += P
    R += P
    d = int(beat * 0.75 * SR)  # eco leggera
    for _ in range(2):
        L[d:] += 0.12 * R[:-d]
        R[d:] += 0.12 * L[:-d]
    return L, R


def finish(L, R, seconds):
    out = np.stack([L, R], 1)[: int(seconds * SR)]
    fi, fo = int(0.3 * SR), int(2.5 * SR)
    out[:fi] *= np.linspace(0, 1, fi)[:, None]
    out[-fo:] *= np.linspace(1, 0, fo)[:, None]
    out = np.tanh(out / (np.abs(out).max() + 1e-9) * 1.6) / np.tanh(1.6)  # leggera saturazione
    return (out * 0.85 * 32767).astype(np.int16)


if __name__ == "__main__":
    secs, path = float(sys.argv[1]), sys.argv[2]
    style = sys.argv[3] if len(sys.argv) > 3 else "sport"
    data = finish(*make_sport(secs), secs) if style == "sport" else make(secs)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
