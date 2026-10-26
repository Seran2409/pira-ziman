---
paths:
  - "source/src/**"
  - "source/build.py"
---

# Architektur der App

## Zusammenbau

`source/build.py` hängt die Dateien aus `source/src/` in dieser Reihenfolge aneinander: `00-head.html`, `01-body.html`, dann alle **Daten** `[5-9]*.js`, dann die eingebetteten Audio-Infos (`PZ.audio`, `PZ.silent`, `PZ.ipa` aus `audio_build/`), dann aller **Code** `[1-4]*.js` (alphabetisch) und zum Schluss `buildVForms(); boot();`. Alles läuft in **einem** Skript-Scope. Die Dateinamen-Nummern sind also Programmlogik: Eine neue Code-Datei bekommt eine Nummer, die zu ihrem Platz in der Kette passt.

| Datei | Inhalt |
|---|---|
| `00-head.html` | CSS: Design-Tokens, Layout, alle Komponenten |
| `01-body.html` | App-Rahmen (Seitenleiste, Hauptbereich, Lektions-Overlay) |
| `10-core.js` | Helfer (`$`, `$$`, `esc`, `norm`, `flat`, `check`), Speicherstand `S`, XP und Serie, Karteikarten (SRS), Abzeichen, Navigation, Router `VIEWS`/`route()`, Startseite, Lernpfad, `boot()` |
| `15-audio.js` | Audio: Bank-Loader `PZA`, Wiedergabe, Tempo, `sayBtn()` |
| `20-learn.js` | Lektionsablauf (Theorie, Wörter, Dialog, Übungen), `finish()`, Niveautests |
| `30-verbs.js` | Verbtrainer (10 Zeiten inkl. Ergativ), `buildVForms()` |
| `40-tools.js` | Karteikarten, Lesen, Wörterbuch, Grammatik, Methode, Profil |
| `45-pron.js` | Aussprache-Trainer „Deng“: Aufnahme, MFCC + DTW-Bewertung, Lautschule, Hörtraining, Shadowing |
| `47-game.js` | Gamifizierung, ummantelt Funktionen aus früheren Dateien |
| `48-look.js` | `afterRoute()`: färbt Karten auf allen Tabs (rot, gold, grün) |
| `50-53-data-*.js` | Verben, Grammatik-Referenz, Redemittel, Laute und Minimalpaare |
| `60-6b-*.js` | Lektionen A1 bis C2 (je Niveau zwei Dateien, `6a/6b` = C2) |
| `70-72-texts-*.js` | Lesetexte |

## Ummanteln statt umschreiben

Funktionsdeklarationen sind global. Spätere Dateien ersetzen sie mit einem Wrapper:

```js
const _addXP = addXP;
addXP = function (n) { ensureDay(); _addXP(n); /* … */ };
```

`47-game.js` hängt sich so an `addXP`, `finish`, `renderSideFoot`, `boot`, `VIEWS.home` und `VIEWS.profile`. Wer eine dieser Funktionen ändert, muss die Wrapper mitdenken. `VIEWS.home` wird per String-Ersetzung erweitert (Sonne statt Ring, Spielerkarte und Tagesaufgaben vor `<section class="card stack">` der Brücke): Markup dort nur mit Blick auf diese Ersetzungen ändern.

`route()` ruft nach dem Rendern `VIEWS[v].after(m)` und dann `afterRoute(m)` auf. Achtung: Der `hashchange`-Listener hält die ursprüngliche `route`-Funktion, ein Wrapper um `route` greift dort nicht. Für „nach jedem Seitenwechsel“ deshalb `afterRoute` erweitern.

## Speicherstand

`S` liegt in `localStorage` unter `piraziman.v1` (siehe `fresh()` und `merge()` in `10-core.js`):
`xp, days{datum: xp}, lessons{id: {stars, best, times, last, lastStars}}, levels, cards{ku: {i, e, d, r, l}}, texts, verbs{n, ok}, badges, reviews, pron{n, best, quiz, qn}, game{…}` sowie Einstellungen (`name, goal, theme, free, rate, autoplay`).

- Neue Felder immer in `fresh()` eintragen und, wenn es Objekte sind, in `merge()`, damit alte Speicherstände weiter laden.
- Den Schlüssel `piraziman.v1` nie ändern (sonst verlieren alle ihren Fortschritt). Migrationen im Code, nicht über einen neuen Schlüssel.
- Export und Import als JSON gibt es im Profil. Auf claude.ai synchronisiert die App zusätzlich über `window.claude` (auf GitHub Pages ohne Wirkung, immer mit Prüfung, ob es existiert).

## Regeln für Code

- Vanilla JS, kein Framework, kein Bundler, keine Laufzeit-Abhängigkeiten außer Google Fonts.
- Ausgaben, die Nutzertext enthalten, immer mit `esc()` maskieren.
- Antworten prüfen mit `check(given, targets)`: `ok`, `near` (nur Sonderzeichen fehlen, wird angezeigt) oder `bad`.
- Neue XP-Quellen über `addXP()`, dann greifen Aufgaben, Stufen und Abzeichen automatisch.
- Der Hook `.claude/hooks/nach_aenderung.py` baut nach jeder Änderung neu und prüft die JS-Syntax. Meldet er einen Fehler, beziehen sich die Zeilennummern auf das zusammengesetzte Skript in `source/dist/pira-ziman.html`.
