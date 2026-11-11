"""Reproduce original sample recordings and fetch the credited OFL fonts.

Run from the repository root with Python, NumPy, fontTools and brotli installed.
No reference image or existing song is used as input.
"""
from pathlib import Path
from urllib.request import urlopen
import math
import wave
import numpy as np
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]


def fetch(url: str, target: Path):
    target.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(url, timeout=45) as response:
        target.write_bytes(response.read())
    print("Downloaded", target.relative_to(ROOT), flush=True)


def recordings():
    folder = ROOT / "public/audio/orangeui"
    folder.mkdir(parents=True, exist_ok=True)
    sample_rate, duration = 22050, 24
    palettes = {
        "sunroom": ([57, 60, 64, 67], [69, 72, 76, 72, 69, 67, 64, 67]),
        "blue-hour": ([50, 57, 60, 65], [69, 65, 64, 60, 62, 65, 69, 72]),
        "pocket-garden": ([55, 59, 62, 66], [74, 71, 69, 67, 66, 67, 71, 74]),
    }
    t = np.arange(sample_rate * duration) / sample_rate
    for name, (chord, melody) in palettes.items():
        audio = np.zeros_like(t)
        for position, note in enumerate(chord):
            frequency = 440 * 2 ** ((note - 69) / 12)
            envelope = np.sin(np.pi * np.clip(t / duration, 0, 1)) ** 0.7
            audio += (np.sin(2 * math.pi * frequency * t + position) +
                      0.18 * np.sin(2 * math.pi * frequency * 2 * t)) * envelope * 0.055
        for beat in range(32):
            start = beat * 0.7 + 0.4
            elapsed = t - start
            active = (elapsed >= 0) & (elapsed < 2.5)
            frequency = 440 * 2 ** ((melody[beat % len(melody)] - 69) / 12)
            local = np.maximum(elapsed, 0)
            envelope = (1 - np.exp(-local * 85)) * np.exp(-local * 2.4) * active
            audio += (np.sin(2 * math.pi * frequency * local) +
                      0.24 * np.sin(2 * math.pi * frequency * 3 * local)) * envelope * 0.105
        # A quiet echo uses only the newly synthesized signal.
        delayed = np.zeros_like(audio)
        shift = int(sample_rate * 0.35)
        delayed[shift:] = audio[:-shift] * 0.18
        audio += delayed
        fade = np.minimum(1, t / 0.35) * np.minimum(1, (duration - t) / 1.2)
        pcm = (np.clip(audio * fade, -0.8, 0.8) * 32767).astype("<i2")
        with wave.open(str(folder / (name + ".wav")), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(sample_rate)
            output.writeframes(pcm.tobytes())
        print("Generated", name, "24s original PCM recording", flush=True)
    (folder / "LICENSE.txt").write_text(
        "Orange sessions: Sunroom, Blue hour, Pocket garden\n"
        "Original synthesized recordings created for oRangeUi, 2026.\n"
        "The authors dedicate these recordings to the public domain under CC0 1.0.\n"
        "You may use, modify and distribute them, including commercially, without attribution.\n"
        "No third-party recording, melody, sample or reference artwork was used.\n"
        "The reproducible generator source is tools/generate-creative-assets.py, under the repo MIT license.\n"
        "Full CC0 legal text: CC0-1.0.txt in this folder.\n"
        "https://creativecommons.org/publicdomain/zero/1.0/\n", encoding="utf-8")
    fetch("https://raw.githubusercontent.com/spdx/license-list-data/main/text/CC0-1.0.txt", folder / "CC0-1.0.txt")


def fonts():
    folder = ROOT / "public/fonts/desi"
    for directory, original, name in [
        ("yatraone", "YatraOne-Regular.ttf", "yatra-one"),
        ("baloo2", "Baloo2%5Bwght%5D.ttf", "baloo-2"),
    ]:
        target = folder / (name + ".ttf")
        fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/" + directory + "/" + original, target)
        font = TTFont(target)
        font.flavor = "woff2"
        font.save(folder / (name + ".woff2"))
        fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/" + directory + "/OFL.txt", folder / ("OFL-" + name + ".txt"))
    (folder / "README.md").write_text(
        "# Display fonts\n\n"
        "Yatra One by Catherine Leigh Schmidt is used for the Hindi display token.\n"
        "Baloo 2 by Ek Type is used for the Hinglish display token; Latin and Devanagari share the same family.\n"
        "Both fonts are distributed under SIL Open Font License 1.1; full notices are included.\n"
        "Sources: https://github.com/google/fonts/tree/main/ofl/yatraone and https://github.com/google/fonts/tree/main/ofl/baloo2\n\n"
        "styles/desi-text.css exposes --font-hindi-display and --font-hinglish-display.\n"
        "Replace these tokens and supply your licensed font assets to change the typefaces without changing the component API.\n"
        "This folder is independent of component source so a future premium font package can be shipped separately.\n",
        encoding="utf-8")


if __name__ == "__main__":
    recordings()
    fonts()
