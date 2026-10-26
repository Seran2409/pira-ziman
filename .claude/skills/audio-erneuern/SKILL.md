---
name: audio-erneuern
description: Aufnahmen für Pira Ziman erzeugen oder erneuern, wenn kurdische Texte neu sind oder sich geändert haben, oder den Klang der Stimme ändern (freundlich, sauber, hell).
argument-hint: "[neu | klang <freundlich|sauber|hell> | alles]"
---

# Aufnahmen erneuern: $ARGUMENTS

Lies zuerst `.claude/rules/audio.md`. Alle Befehle im Ordner `source/`.

Stand: !`ls source/audio_build/raw 2>/dev/null | wc -l` Rohaufnahmen, !`ls source/audio_build/mms 2>/dev/null | wc -l` fertige MP3s, Stimmmodell: !`ls source/voice 2>/dev/null | tr '\n' ' '`

**Voraussetzungen:** Stimmmodell in `source/voice/` (sonst die vier Dateien `config.json`, `model.safetensors`, `tokenizer_config.json`, `vocab.json` von Hugging Face `facebook/mms-tts-kmr-script_latin` dort ablegen lassen), ffmpeg mit libmp3lame, eSpeak NG für die Lautschrift, Python-Pakete aus `source/requirements.txt`.

## `neu` (Standard): nur neue oder geänderte Texte

1. Ist `audio_build/mms/` leer (frischer Klon): `python3 tools/unpack_banks.py` holt die vorhandenen Aufnahmen aus den Banken zurück.
2. `python3 build.py` und `python3 tools/run_collect.py` (aktualisiert `audio_build/items.json`).
3. Fehlende Aufnahmen erzeugen. Texte mit fertiger MP3 werden übersprungen:
   `python3 tools/gen_mms.py audio_build/items.json audio_build/raw 0 2 & python3 tools/gen_mms.py audio_build/items.json audio_build/raw 1 2 & wait`
   Mit zwei Shards etwa 1,5 Sekunden pro Text. Bei vielen Texten im Hintergrund laufen lassen und den Fortschritt verfolgen.
4. `python3 tools/encode_mms.py audio_build/items.json` (kodiert nur neue Rohaufnahmen).
5. `python3 tools/pack_mms.py audio_build/items.json` (mit `ESPEAK_NG` und `ESPEAK_DATA_PATH`, falls eSpeak nicht im Pfad liegt). Die Ausgabe muss `missing 0` zeigen.
6. `python3 build.py`, dann Skill `bauen`.

## `klang <stimme>`: nur den Klang ändern

Braucht die Rohaufnahmen aller Texte in `audio_build/raw/`. Fehlen sie (frischer Klon), ist das eine vollständige Neuerzeugung von etwa 2 Stunden: vorher fragen.

1. Hörprobe: einige Wörter und Sätze mit `PIRA_VOICE=<stimme>` kodieren, alt und neu hintereinander in eine MP3 legen und der Person zum Anhören geben.
2. Nach Zustimmung: `PIRA_VOICE=<stimme> PIRA_FORCE=1 python3 tools/encode_mms.py audio_build/items.json`, dann `pack_mms.py` und `build.py`.
3. Die gewählte Stimme als Standard in `encode_mms.py` eintragen (`VOICE = VOICES[...]`) und in `.claude/rules/audio.md` vermerken.

## `alles`: komplett neu

Nur wenn sich die Synthese-Einstellungen in `gen_mms.py` ändern. Nach Rückfrage `audio_build/raw/` leeren, dann `PIRA_FORCE=1` bei `gen_mms.py` und `encode_mms.py`, sonst wie bei `neu`. Danach die Kalibrierung des Aussprache-Trainers mit `tools/mfcc_dtw.py` nachprüfen.

Zum Schluss berichten: wie viele Aufnahmen neu sind, Größe der Banken, und ob veröffentlicht werden soll (`/veroeffentlichen`).
