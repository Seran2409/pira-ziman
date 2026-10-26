---
paths:
  - "source/tools/**"
  - "source/audio_build/**"
  - "source/src/15-audio.js"
  - "source/src/45-pron.js"
---

# Audio: Aufnahmen und Aussprache-Trainer

Jeder kurdische Text in der App hat eine Aufnahme. Der Schlüssel hängt nur vom kurdischen Text ab (`md5('mms1|' + text)`, `name_for()` in `gen_mms.py`), nicht von der Oberflächensprache: Die deutsche und die englische Version teilen sich die Aufnahmen.

## Pipeline (im Ordner `source/`)

1. `tools/unpack_banks.py`: holt die MP3s aus den Banken `../audio/m*.js` nach `audio_build/mms/` zurück. Nur nötig, wenn nach einem frischen Klon neu gepackt werden soll, ohne neu zu erzeugen.
2. `tools/run_collect.py` (Playwright, `collect.js`): sammelt alle Sprechtexte aus der gebauten App nach `audio_build/items.json`. Vorher `build.py`.
3. `tools/gen_mms.py audio_build/items.json audio_build/raw SHARD NSHARDS`: erzeugt fehlende **Rohaufnahmen** (WAV, 16 kHz, unbearbeitet) mit der Stimme **MMS-TTS** `facebook/mms-tts-kmr-script_latin` in reinem NumPy (`vits_np.py`). Vorhandene Dateien werden übersprungen, die Erzeugung ist deterministisch (Seed aus dem Text). Für alle rund 4.570 Texte etwa 2 Stunden mit zwei Shards parallel:
   ```bash
   python3 tools/gen_mms.py audio_build/items.json audio_build/raw 0 2 &
   python3 tools/gen_mms.py audio_build/items.json audio_build/raw 1 2 &
   wait
   ```
   Einstellungen: `noise_scale` 0.42, `noise_scale_w` 0.5 (ruhig und deutlich), Tempo 0.92 für Sätze und 0.85 für Wörter. Einzelne Wörter: drei Varianten, genommen wird die typischste (`medoid()` mit MFCC + DTW). Zum Ausprobieren `PIRA_NS`, `PIRA_NSW`, `PIRA_TAKES_WORD`.
4. `tools/encode_mms.py audio_build/items.json`: **Klanggestaltung** von `raw/` nach `mms/`, parallel, einige Minuten. Hier am Klang feilen, ohne neu zu erzeugen:
   - Stimme `PIRA_VOICE`: `freundlich` (Standard, von Seran ausgewählt: etwa 2 Halbtöne höher, Satzmelodie 20 % lebendiger, leichtes „Lächeln“), `sauber` (Originalstimme), `hell` (experimentell, frauenähnlich, künstlicher)
   - Tonhöhe und Melodie per TD-PSOLA (`voice_fx.py`), „Lächeln“ per `asetrate` + `atempo` (Formanten und Tonhöhe +6 %). Kein `rubberband`: Der Phase-Vocoder verschmiert die Obertöne hörbar
   - Säubern: Hochpass, Rauschminderung, weniger kastig (−2,5 dB bei 350 Hz), etwas Wärme, Präsenz bei 2,6 kHz, weichere Höhen, De-Esser, sanfter Kompressor, Limiter, kurze Blenden. Ziel etwa −16 LUFS, Spitzen unter −1 dB
   - MP3 24 kHz, 64 kbit/s, Tiefpass 8 kHz (die Stimme selbst reicht nur bis 8 kHz)
   - **Falle in ffmpeg 6.1:** `aresample=…:resampler=soxr` **nach** `atempo` hängt sich auf. Der Resampler steht immer davor
5. `tools/pack_mms.py audio_build/items.json`: packt die MP3s in Banken von etwa 400 KB (`dist/audio/m{n}.js`, Anzahl `nb` automatisch, Zuordnung FNV-Hash % nb) und schreibt `audio_build/index.json` und die Lautschrift `audio_build/ipa.json`. Braucht `espeak-ng` (Pfad über `ESPEAK_NG`, Daten über `ESPEAK_DATA_PATH`).
6. `build.py` (bettet `index.json` und `ipa.json` ein), dann `tools/build_pages.py` (kopiert `dist/audio` nach `../audio`).

Ordner `audio_build/raw/`, `audio_build/mms/` und `voice/` sind gitignored. Das Stimmmodell (`config.json`, `model.safetensors`, `tokenizer_config.json`, `vocab.json`) kommt von Hugging Face nach `source/voice/`.

## Aussprache-Trainer (`45-pron.js`)

Bewertung per MFCC + DTW gegen die Referenzaufnahme, beides auf 16 kHz: `score = 100 * clamp((2.62 - d) / 0.91)`. Kalibriert: gleicher Satz von einer anderen Stimme ≈ 78, anderer Satz ≈ 25. Mit Version 2 geprüft: gleicher Satz alt gegen neu = 100, ‚sauber‘ gegen ‚freundlich‘ = 100, verschiedene Sätze 13 bis 42. Die MFCCs werden pro Aufnahme normalisiert, deshalb ändert die Klangbearbeitung die Bewertung nicht. Einzelne Wörter bewertet das Maß unzuverlässig, deshalb übt der Trainer Sätze. Python-Referenz: `tools/mfcc_dtw.py`. Nach Änderungen an Stimme oder Kette die Kalibrierung mit dieser Referenz nachprüfen.

## Lizenz

MMS-TTS steht unter **CC BY-NC 4.0** (nur nicht-kommerziell). Für eine kostenpflichtige App, Abos oder Werbung braucht es eigene Aufnahmen von Muttersprachler/innen (`audio_build/items.json` ist die fertige Liste aller Sätze) oder eine kommerziell lizenzierte Stimme. eSpeak NG (GPL) wird nur beim Bauen verwendet.
