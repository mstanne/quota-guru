#!/usr/bin/env python3
"""
Musica di sottofondo originale per i video delle guide, generata via codice (nessun brano di terzi).
Pad morbido + arpeggio pizzicato + basso, 92 BPM, giro La- Fa Do Sol. Deterministica.

Uso: python3 music.py <secondi> <out.wav>
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


if __name__ == "__main__":
    secs, path = float(sys.argv[1]), sys.argv[2]
    data = make(secs)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
