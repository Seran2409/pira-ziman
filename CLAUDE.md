# Pira Ziman · Hinweise für Claude Code

Lern-App für **Kurmancî (Nordkurdisch)** von A1 bis C2, mit Schwerpunkt auf der Sprache in **Amed (Diyarbakır)** und **Êlih (Batman)**. Schrift: Hawar-Alphabet. Oberfläche und Erklärungen sind zurzeit auf Deutsch. Gamifiziert (Stufen, Ränge, Tagesaufgaben, Zêr) und in den Farben der kurdischen Flagge gestaltet.

- Live: https://seran2409.github.io/pira-ziman/ (GitHub Pages, Branch `main`, Ordner `/`)
- Repo: `Seran2409/pira-ziman`. Ansprechperson und Entscheiderin: Seran. Mit ihr auf Deutsch sprechen.

## Status und Ziel

**Die Web-App ist ein erster Entwurf.** Fest geplant sind eine **deutsche und eine englische Version** und eine **native App für Android und iOS**. Neue Arbeit soll diese Ziele erleichtern und nicht verbauen: Inhalte sauber vom Code trennen, deutsche Texte nicht weiter im Code verstreuen, nichts einbauen, was nur im Browser geht, ohne Ausweg für eine native Hülle. Details und Vorgehen: `docs/ROADMAP.md`.

## Aufbau

```
/                       von GitHub Pages ausgeliefert, GENERIERT von source/tools/build_pages.py, nie von Hand ändern
  index.html            die komplette App in einer Datei
  audio/m*.js           Aussprache-Aufnahmen als Banken (MP3 in Base64), werden bei Bedarf nachgeladen
  sw.js, manifest.webmanifest, icon*.png, icon.svg, .nojekyll, README.md
source/
  build.py              setzt src/ zu dist/pira-ziman.html zusammen
  src/                  Quelltext: 00-01 HTML/CSS, 1x-4x Code, 5x-7x Inhalte (Reihenfolge ist Programmlogik)
  tools/                Build-, Audio- und Pages-Skripte
  audio_build/          items.json (alle Sprechtexte), index.json, ipa.json; raw/ und mms/ gitignored
  tests/                smoke.py (alle Lektionen durchspielen), screens.py (Screenshots)
  requirements.txt      Python-Pakete
docs/ROADMAP.md         deutsche/englische Version, native App, Lizenz der Stimme
.claude/                Regeln, Skills, Agenten, Hooks und Einstellungen für Claude Code
```

Ausführliches Wissen steht in `.claude/rules/` und lädt automatisch, sobald du die passenden Dateien liest:

| Regel | gilt für | Inhalt |
|---|---|---|
| `architektur.md` | `source/src/**` | Zusammenbau, Wrapper-Prinzip, Router, Speicherstand |
| `inhalte.md` | `source/src/5-7*.js` | Datenmodell der Lektionen, Sprachregeln, Aufnahmen für neue Texte |
| `gestaltung.md` | CSS, `47-game.js`, `48-look.js` | Flaggenfarben, Tokens, saftige Widgets, Glas-Leiste |
| `gamification.md` | `47-game.js`, `10-core.js` | Stufen, Ränge, Tagesaufgaben, Zêr, Mertal |
| `audio.md` | `source/tools/**`, Audio-Code | Aufnahmen erzeugen, Klang, Banken, Aussprache-Bewertung |

## Befehle

Alles im Ordner `source/`:

```bash
python3 build.py                              # → dist/pira-ziman.html
python3 tests/smoke.py dist/pira-ziman.html   # alle Lektionen + Niveautests, Zeile GAME {…}
python3 tests/screens.py                      # Screenshots nach tests/out/, meldet JS-Fehler und Seitwärts-Scrollen
python3 tools/build_pages.py                  # Website in die Repo-Wurzel schreiben
```

Einrichtung: `python3 -m pip install -r source/requirements.txt && python3 -m playwright install chromium`. Für Aufnahmen zusätzlich ffmpeg, eSpeak NG und das Stimmmodell (siehe `.claude/rules/audio.md`). `build_pages.py` braucht `source/dist/audio/`. Fehlt der Ordner nach einem frischen Klon und haben sich die Aufnahmen nicht geändert: `cp -r ../audio dist/audio`.

**Vor jedem Push** die Service-Worker-Version `VERSION` in `source/tools/build_pages.py` erhöhen (zurzeit `pira-v6`), sonst liefern installierte Apps die alte Fassung aus dem Cache.

## Skills und Agenten

| | Wofür |
|---|---|
| `/bauen` | bauen, alle Lektionen durchspielen, Screenshots ansehen |
| `/veroeffentlichen [Änderung]` | Version erhöhen, Website bauen, committen, pushen, live prüfen (nur auf Anweisung) |
| `/neue-lektion <Niveau> <Thema>` | Lektion schreiben, prüfen lassen, Aufnahmen erzeugen |
| `/audio-erneuern [neu \| klang <stimme> \| alles]` | Aufnahmen für neue Texte oder anderen Klang |
| Agent `kurmanci-lektor` | prüft kurdische Inhalte auf Rechtschreibung, Grammatik, Natürlichkeit, Amed/Êlih |
| Agent `ui-pruefer` | prüft Screenshots gegen die Gestaltungsregeln |

Hooks (`.claude/settings.json`): Nach jeder Änderung an `source/src/` baut `.claude/hooks/nach_aenderung.py` neu und prüft die JavaScript-Syntax. Meldet er einen Fehler, zuerst den beheben. Beim Start zeigt `sitzungsstart.py` den Projektstand (Git, Version, Audio).

## So arbeitest du hier

1. Änderungen im Quelltext unter `source/`, nie in den generierten Dateien der Wurzel.
2. Nach Änderungen `/bauen`. Bei Oberflächen-Änderungen die Screenshots ansehen, hell und dunkel, Desktop und Handy (390 px).
3. Neue oder geänderte kurdische Texte brauchen Aufnahmen: `/audio-erneuern`.
4. Veröffentlichen nur, wenn Seran es möchte: `/veroeffentlichen`.
5. Kleine, beschreibende Commits auf `main`, generierte Dateien nach `build_pages.py` mit committen. Kein `--force`.

## Regeln

- Vanilla JS, kein Framework, kein Bundler, keine Laufzeit-Abhängigkeiten außer Google Fonts.
- Funktionen werden in späteren Dateien ummantelt, nicht umgeschrieben (`.claude/rules/architektur.md`).
- Speicherstand-Schlüssel `piraziman.v1` und Lektions-IDs nie ändern. Neue Felder in `fresh()` und `merge()`.
- Farben nur über Tokens, immer mit Wert für den Dunkelmodus. Die Sonne hat 21 Strahlen.
- Kurdisch im Hawar-Alphabet mit ê, î, û, ç, ş. Standard zuerst, Amed/Êlih als Hinweis.
- Gamifizierung belohnt Lernen, nicht Klicken: keine Strafen, keine Werbung, kein Echtgeld.
- Inhalte sind KI-erstellt und noch nicht muttersprachlich geprüft. Vor einer Store-Veröffentlichung braucht es eine Prüfung durch Muttersprachler/innen.
- Die Stimme (MMS-TTS) ist nur nicht-kommerziell nutzbar (CC BY-NC 4.0). Kostenpflichtige App, Abos oder Werbung nur mit anderen Aufnahmen.

## Fertig heißt

- `build.py` und `tests/smoke.py` laufen ohne Fehler, alle Lektionen und Niveautests bestanden.
- `tests/screens.py` meldet keine Probleme, und die Bilder sehen in hell und dunkel stimmig aus.
- Bei neuen Texten: `pack_mms.py` meldet `missing 0`.
- Nach einer Veröffentlichung: Die Live-Seite liefert die neue Service-Worker-Version.
