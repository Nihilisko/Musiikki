"""Makes the backing track sounds: piano chords and a small drum kit.

Run from the project folder:  python3 scripts/generate_backing_sounds.py
(needs numpy:  pip install numpy)
Everything is synthesised here, so there are no sample licences to worry about.
"""
import math
import wave

import numpy as np

NAMES = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b']
RATE = 22050
rng = np.random.default_rng(7)


def write(path, samples):
    samples = np.asarray(samples, dtype=np.float64)
    peak = np.max(np.abs(samples)) or 1.0
    if peak > 0.9:
        samples = samples * (0.9 / peak)
    data = (np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes()
    w = wave.open(path, 'wb')
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(RATE)
    w.writeframes(data)
    w.close()


def biquad(x, kind, freq, q=0.707):
    """A standard two-pole filter (RBJ audio EQ cookbook): 'lowpass', 'highpass' or 'bandpass'."""
    w0 = 2 * math.pi * freq / RATE
    alpha = math.sin(w0) / (2 * q)
    cos = math.cos(w0)
    if kind == 'lowpass':
        b = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2]
    elif kind == 'highpass':
        b = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2]
    else:  # bandpass
        b = [alpha, 0, -alpha]
    a = [1 + alpha, -2 * cos, 1 - alpha]
    b = [v / a[0] for v in b]
    a1, a2 = a[1] / a[0], a[2] / a[0]
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, v in enumerate(x):
        out = b[0] * v + b[1] * x1 + b[2] * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, v, y1, out
        y[i] = out
    return y


# --- Piano ------------------------------------------------------------------------------------
# Built like a real piano note:
# - many partials (overtones), each fading at its own speed: high ones fast, low ones slow
# - piano strings are stiff, so the overtones sit a little above exact multiples ("inharmonicity")
# - each note has three strings tuned a hair apart, which gives the slow, living shimmer
# - two-stage decay: a quick drop after the strike, then a long, soft ring
# - a short, soft thump from the hammer

PIANO_SECONDS = 2.4


def piano(freq):
    n = int(RATE * PIANO_SECONDS)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    inharm = 0.00008 * (freq / 261.6) ** 0.5  # kept small so the pitch stays true
    base_decay = 0.9 + freq / 500              # higher notes ring for a shorter time
    for k in range(1, 40):
        fk = k * freq * math.sqrt(1 + inharm * k * k)
        if fk > RATE * 0.45:
            break
        # Brightness: the hammer excites the lower partials most (a gentle slope, with a small
        # dip around the 7th-9th partial where the hammer strikes the string).
        amp = 1 / k ** 1.25 * (0.55 if 7 <= k <= 9 else 1.0)
        fast = base_decay * (2.5 + 0.5 * k)
        slow = base_decay * (0.35 + 0.12 * k)
        env = 0.65 * np.exp(-t * fast) + 0.35 * np.exp(-t * slow)
        for detune in (-0.0005, 0.0, 0.0005):  # three strings, a fraction of a cent apart
            phase = rng.uniform(0, 2 * math.pi)
            out += (amp / 3) * env * np.sin(2 * math.pi * fk * (1 + detune) * t + phase)
    # Hammer thump: a very short burst of low noise.
    thump = biquad(rng.uniform(-1, 1, int(RATE * 0.03)), 'lowpass', 900) * 0.25
    out[: len(thump)] += thump * np.linspace(1, 0, len(thump))
    attack = np.minimum(1, np.arange(n) / (RATE * 0.002))
    release = np.minimum(1, (n - np.arange(n)) / (RATE * 0.06))
    return out * attack * release


# --- Drums ------------------------------------------------------------------------------------


def kick():
    n = int(RATE * 0.45)
    t = np.arange(n) / RATE
    freq = 45 + 90 * np.exp(-t * 30)              # the pitch drops fast: the "thump"
    phase = np.cumsum(2 * math.pi * freq / RATE)
    click = rng.uniform(-1, 1, n) * np.exp(-t * 400) * 0.3
    return np.sin(phase) * np.exp(-t * 7) + click


def snare():
    n = int(RATE * 0.3)
    t = np.arange(n) / RATE
    rattle = biquad(rng.uniform(-1, 1, n), 'highpass', 1800) * np.exp(-t * 16)
    body = np.sin(2 * math.pi * 185 * t) * np.exp(-t * 30) * 0.6
    return rattle * 1.1 + body


def hat(length, decay):
    """TR-808 style: six square waves at unrelated pitches, then only the highs are kept."""
    n = int(RATE * length)
    t = np.arange(n) / RATE
    metal = sum(np.sign(np.sin(2 * math.pi * f * t)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    metal = biquad(metal, 'bandpass', 8000, q=0.9)
    metal = biquad(metal, 'highpass', 6500)
    sizzle = biquad(rng.uniform(-1, 1, n), 'highpass', 7500) * 0.35
    return (metal + sizzle) * np.exp(-t * decay)


def ride():
    n = int(RATE * 1.2)
    t = np.arange(n) / RATE
    metal = sum(np.sign(np.sin(2 * math.pi * f * t)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    metal = biquad(metal, 'bandpass', 5200, q=1.2)
    bell = sum(a * np.sin(2 * math.pi * f * t) for f, a in ((2230, 0.35), (3410, 0.2)))
    return metal * 0.5 * np.exp(-t * 3.5) + bell * np.exp(-t * 2.5) * 0.4


def rim():
    n = int(RATE * 0.08)
    t = np.arange(n) / RATE
    tone = np.sin(2 * math.pi * 1650 * t) + 0.5 * np.sin(2 * math.pi * 520 * t)
    return (tone * 0.6 + rng.uniform(-1, 1, n) * 0.3) * np.exp(-t * 70)


# --- Piano chords -----------------------------------------------------------------------------
# One file per chord instead of one per note: a phone browser only lets a page load about 40
# sounds at once, and one player per chord hit also keeps the notes perfectly together.

CHORD_SECONDS = 1.6
# Chord types the progressions use: file name -> intervals above the root.
CHORD_TYPES = {
    'maj': [0, 4, 7],
    'min': [0, 3, 7],
    '7': [0, 4, 7, 10],
    'm7': [0, 3, 7, 10],
    'maj7': [0, 4, 7, 11],
    'm7b5': [0, 3, 6, 10],
}


def chord_voicing(root, intervals):
    """Left hand: the root low (E2-D#3). Right hand: the other notes close together between
    G3 and F#4, so the chords sit in the same place and move smoothly from one to the next."""
    bass = 40 + (root - 40) % 12
    upper = intervals[1:] if len(intervals) == 4 else intervals
    right = sorted(55 + (root + i - 55) % 12 for i in upper)
    return [bass] + right


def piano_chord(root, intervals):
    n = int(RATE * CHORD_SECONDS)
    out = np.zeros(n)
    notes = chord_voicing(root, intervals)
    for i, midi in enumerate(notes):
        f = 440 * 2 ** ((midi - 69) / 12)
        out += piano(f)[:n] * (0.8 if i == 0 else 0.6)
    release = np.minimum(1, (n - np.arange(n)) / (RATE * 0.15))
    return out * release * 0.35


def write_chord_index():
    """The app needs a require() line per file, so write that list as TypeScript."""
    lines = [
        '// Made by scripts/generate_backing_sounds.py - do not edit by hand.',
        '// Piano chord sounds by file name, e.g. "a-7" = A7, "cs-m7b5" = C#m7b5.',
        '',
        'export const CHORD_SOUNDS: Record<string, number> = {',
    ]
    for root in range(12):
        for name in CHORD_TYPES:
            key = f'{NAMES[root]}-{name}'
            lines.append(f"  '{key}': require('../../assets/sounds/chords/{key}.wav'),")
    lines.append('};')
    open('src/audio/chordSounds.ts', 'w').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    import os
    os.makedirs('assets/sounds/chords', exist_ok=True)
    for root in range(12):
        for name, intervals in CHORD_TYPES.items():
            write(f'assets/sounds/chords/{NAMES[root]}-{name}.wav', piano_chord(root, intervals))
    write_chord_index()
    write('assets/sounds/drums/kick.wav', kick())
    write('assets/sounds/drums/snare.wav', snare())
    write('assets/sounds/drums/hat.wav', hat(0.09, 45))
    write('assets/sounds/drums/hat-open.wav', hat(0.45, 7))
    write('assets/sounds/drums/ride.wav', ride())
    write('assets/sounds/drums/rim.wav', rim())
    print('done')
