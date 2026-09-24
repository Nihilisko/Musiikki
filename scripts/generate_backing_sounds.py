"""Makes the backing track sounds: electric piano notes and a small drum kit.

Run from the project folder:  python3 scripts/generate_backing_sounds.py
Everything is synthesised here, so there are no sample licences to worry about.
"""
import math
import random
import struct
import wave

NAMES = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b']


def write(path, samples, rate):
    peak = max(1e-9, max(abs(s) for s in samples))
    scale = 0.9 / peak if peak > 0.9 else 1.0
    frames = b''.join(struct.pack('<h', int(max(-1, min(1, s * scale)) * 32767)) for s in samples)
    w = wave.open(path, 'wb')
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(rate)
    w.writeframes(frames)
    w.close()


# --- Electric piano ---------------------------------------------------------------------------
# A simple FM "tine" sound: the tone is a sine whose phase is wobbled by another sine at the same
# frequency. The wobble (modulation index) starts high for a bright, bell-like attack and fades,
# leaving a warm tone. A quiet high "tine ping" adds the typical click at the start.

EP_RATE = 22050
EP_SECONDS = 1.6


def epiano(freq):
    n = int(EP_RATE * EP_SECONDS)
    out = []
    for i in range(n):
        t = i / EP_RATE
        index = 0.4 + 2.2 * math.exp(-t * 9)          # brightness fades quickly
        mod = math.sin(2 * math.pi * freq * t)
        tone = math.sin(2 * math.pi * freq * t + index * mod)
        ping = 0.25 * math.sin(2 * math.pi * freq * 7.02 * t) * math.exp(-t * 28)
        attack = min(1.0, i / (EP_RATE * 0.004))
        decay = math.exp(-t * (1.6 + freq / 700))     # higher notes die away a bit faster
        release = min(1.0, (n - i) / (EP_RATE * 0.05))  # no click at the end of the file
        out.append((tone + ping) * attack * decay * release * 0.5)
    return out


# --- Drums ------------------------------------------------------------------------------------

DR_RATE = 22050
rnd = random.Random(7)


def noise():
    return rnd.uniform(-1, 1)


def kick():
    n = int(DR_RATE * 0.45)
    out, phase = [], 0.0
    for i in range(n):
        t = i / DR_RATE
        freq = 45 + 90 * math.exp(-t * 30)             # pitch drops fast: the "thump"
        phase += 2 * math.pi * freq / DR_RATE
        click = noise() * math.exp(-t * 400) * 0.3
        out.append((math.sin(phase) * math.exp(-t * 7) + click))
    return out


def snare():
    n = int(DR_RATE * 0.3)
    out, prev = [], 0.0
    for i in range(n):
        t = i / DR_RATE
        x = noise()
        hp = x - prev                                   # rough high-pass: brighter noise
        prev = x
        body = math.sin(2 * math.pi * 185 * t) * math.exp(-t * 30) * 0.6
        out.append((hp * 0.8 * math.exp(-t * 16) + body))
    return out


def hat(length, decay):
    n = int(DR_RATE * length)
    out, prev = [], 0.0
    for i in range(n):
        t = i / DR_RATE
        x = noise()
        hp = x - prev
        prev = x
        metal = sum(math.sin(2 * math.pi * f * t) for f in (3150, 4320, 5710, 7440)) * 0.08
        out.append((hp * 0.7 + metal) * math.exp(-t * decay))
    return out


def ride():
    n = int(DR_RATE * 1.2)
    out, prev = [], 0.0
    for i in range(n):
        t = i / DR_RATE
        x = noise()
        hp = x - prev
        prev = x
        bell = sum(a * math.sin(2 * math.pi * f * t) for f, a in ((2230, 0.5), (3410, 0.35), (5170, 0.25)))
        out.append((bell * 0.5 * math.exp(-t * 3.2) + hp * 0.25 * math.exp(-t * 5)))
    return out


def rim():
    n = int(DR_RATE * 0.08)
    out = []
    for i in range(n):
        t = i / DR_RATE
        tone = math.sin(2 * math.pi * 1650 * t) + 0.5 * math.sin(2 * math.pi * 520 * t)
        out.append((tone * 0.6 + noise() * 0.3) * math.exp(-t * 70))
    return out


if __name__ == '__main__':
    for midi in range(48, 73):  # C3 .. C5
        f = 440 * 2 ** ((midi - 69) / 12)
        write(f'assets/sounds/epiano/{NAMES[midi % 12]}{midi // 12 - 1}.wav', epiano(f), EP_RATE)
    write('assets/sounds/drums/kick.wav', kick(), DR_RATE)
    write('assets/sounds/drums/snare.wav', snare(), DR_RATE)
    write('assets/sounds/drums/hat.wav', hat(0.08, 55), DR_RATE)
    write('assets/sounds/drums/hat-open.wav', hat(0.4, 9), DR_RATE)
    write('assets/sounds/drums/ride.wav', ride(), DR_RATE)
    write('assets/sounds/drums/rim.wav', rim(), DR_RATE)
    print('done')
