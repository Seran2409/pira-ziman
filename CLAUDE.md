# Pira Ziman · Hinweise für Claude Code

Lern-App für **Kurmancî (Nordkurdisch)** von A1 bis C2, mit Schwerpunkt auf der Sprache in **Amed (Diyarbakır)** und **Êlih (Batman)**. Schrift: Hawar-Alphabet. Oberfläche und Erklärungen sind zurzeit auf Deutsch.

- Live: https://seran2409.github.io/pira-ziman/ (GitHub Pages, Branch `main`, Ordner `/`)
- Repo: `Seran2409/pira-ziman`

## Status und Ziel

**Die Web-App ist ein erster Entwurf.** Sie dient als Prototyp für Inhalte, Didaktik und Gestaltung. Zwei Ziele stehen fest:

1. **Eine deutsche und eine englische Version.** Oberfläche, Erklärungen, Übersetzungen und Übungen gibt es dann jeweils komplett auf Deutsch oder Englisch. Kurdisch bleibt die Zielsprache.
2. **Eine funktionierende native App für Android und iOS**, die in den Stores erscheint.

Neue Arbeit soll diese Ziele erleichtern und nicht verbauen. Der Abschnitt [Roadmap](#roadmap) beschreibt, wie.

## Aufbau des Repos

```
/                       ← von GitHub Pages ausgeliefert (generiert, nicht von Hand ändern)
  index.html            die komplette App in einer Datei
  audio/m0.js … m74.js  Aussprache-Aufnahmen (MP3 als Base64), werden bei Bedarf nachgeladen
  sw.js                 Service Worker (Offline; VERSION bei jeder Auslieferung erhöhen)
  manifest.webmanifest, icon.svg, icon-192.png, icon-512.png, .nojekyll
  README.md             wird aus source/tools/README_site.md kopiert
source/
  build.py              setzt src/ zu dist/pira-ziman.html zusammen
  src/                  Quelltext (siehe unten)
  tools/                Build-, Audio- und Pages-Skripte
  audio_build/          items.json (alle Sprechtexte), index.json (Audio-Schlüssel), ipa.json, silent.mp3
                        mms/ (Einzel-MP3s, gitignored)
  tests/smoke.py        Playwright-Test: alle Lektionen und Niveautests durchspielen
```

### `source/src/`: Reihenfolge ist Programmlogik

`build.py` hängt die Dateien so aneinander: `00-head.html`, `01-body.html`, dann alle **Daten** `[5-9]*.js`, dann die eingebetteten Audio-Infos (`PZ.audio`, `PZ.silent`, `PZ.ipa`), dann aller **Code** `[1-4]*.js` und zum Schluss `buildVForms(); boot();`. Alles läuft in einem einzigen Skript-Scope.

| Datei | Inhalt |
|---|---|
| `00-head.html` | CSS: Design-Tokens, Layout, alle Komponenten |
| `01-body.html` | App-Rahmen (Seitenleiste, Hauptbereich, Lektions-Overlay) |
| `10-core.js` | Helfer, Speicherstand `S`, XP/Serie, Karteikarten (SRS), Abzeichen, Navigation, Router `VIEWS`, Startseite, Lernpfad, `boot()` |
| `15-audio.js` | Audio: Bank-Loader `PZA`, Wiedergabe, Tempo |
| `20-learn.js` | Lektionsablauf (Theorie, Wörter, Dialog, Übungen), `finish()`, Niveautests |
| `30-verbs.js` | Verbtrainer (10 Zeiten inkl. Ergativ), `buildVForms()` |
| `40-tools.js` | Karteikarten, Lesen, Wörterbuch, Grammatik, Methode, Profil |
| `45-pron.js` | Aussprache-Trainer „Deng“: Aufnahme, MFCC + DTW-Bewertung, Lautschule, Hörtraining, Shadowing |
| `47-game.js` | Gamifizierung (siehe unten). Ummantelt Funktionen aus früheren Dateien |
| `50-53-data-*.js` | Verben, Grammatik-Referenz, Redemittel, Laute und Minimalpaare |
| `60-6b-*.js` | Lektionen A1 bis C2 (je Niveau zwei Dateien, `6a/6b` = C2) |
| `70-72-texts-*.js` | Lesetexte |

**Ummanteln statt umschreiben:** Funktionsdeklarationen sind global. Spätere Dateien ersetzen sie mit einem Wrapper (`const _addXP = addXP; addXP = function (n) { … _addXP(n) … }`). So hängt sich `47-game.js` an `addXP`, `finish`, `renderSideFoot`, `boot`, `VIEWS.home` und `VIEWS.profile`. Wer eine dieser Funktionen ändert, muss die Wrapper mitdenken.

### Datenmodell

Lektion (`PZ.lessons.push({...})`):

| Feld | Bedeutung |
|---|---|
| `id`, `lv` | z. B. `a1-1`, `A1` |
| `title`, `sub`, `goal` | kurdischer Titel, deutscher Untertitel, Lernziel |
| `th` | Theorie als HTML. Kurdisches in `<span class="ku">`. Helfer `T(kopf, zeilen)` für Tabellen und `EX([[ku, de]])` für Beispiele |
| `vocab` | `[ku, de, merkhilfe?]` |
| `dlg` | `[sprecher, ku, de]` |
| `s` | Beispielsätze `[ku, de]` (Quelle für Satzbau, Tippen, Hören) |
| `g` | Lückensätze `[satz mit ___, lösung, optionen, erklärung]` |
| `dia` | Hinweise zur Sprache in Amed und Êlih (HTML) |

Lesetext: `id, lv, title, de, intro, body, tr, gloss, q`. Verb: `inf, de, pr, pa, tr, core, note`.

Speicherstand `S` (localStorage-Schlüssel `piraziman.v1`, siehe `fresh()` in `10-core.js`): `xp, days{datum: xp}, lessons{id: {stars, best, times, last, lastStars}}, levels, cards{ku: {i, e, d, r, l}}, texts, verbs{n, ok}, badges, reviews, pron{n, best, quiz, qn}, game{…}` sowie Einstellungen. Neue Felder immer in `fresh()` und, wenn es Objekte sind, in `merge()` eintragen, damit alte Speicherstände weiter laden. Export und Import als JSON gibt es im Profil. Auf claude.ai synchronisiert die App zusätzlich über `window.claude` (auf GitHub Pages ohne Wirkung).

## Bauen und testen

```bash
cd source
python3 build.py                      # → dist/pira-ziman.html
python3 tests/smoke.py dist/pira-ziman.html   # alle 54 Lektionen + Niveautests, Ausgabe GAME/STATE
python3 tools/build_pages.py          # schreibt die Website in die Repo-Wurzel (index.html, audio/, sw.js, Icons, README.md)
```

`build_pages.py` braucht `source/dist/audio/`. Fehlt der Ordner (frischer Klon), entweder die Audio-Pipeline laufen lassen oder `cp -r ../audio dist/audio`. Vor jedem Push: `VERSION` in `build_pages.py` erhöhen (zurzeit `pira-v5`), sonst liefern installierte Apps die alte Version aus dem Cache.

### Audio-Pipeline

Jeder kurdische Text in der App hat eine Aufnahme. Der Schlüssel hängt nur vom kurdischen Text ab (`md5('mms1|' + text)`), nicht von der Oberflächensprache.

1. `tools/unpack_banks.py`: holt die Einzel-MP3s aus `audio/m*.js` zurück nach `audio_build/mms/` (nach einem frischen Klon).
2. `tools/run_collect.py` (nutzt `collect.js`, Playwright): sammelt alle Sprechtexte aus der gebauten App → `audio_build/items.json`.
3. `tools/gen_mms.py`: erzeugt fehlende Aufnahmen mit der neuronalen Stimme **MMS-TTS** (`facebook/mms-tts-kmr-script_latin`, Modell in `source/voice/`, gitignored), reines NumPy (`vits_np.py`), etwa 1,8 s pro Satz.
4. `tools/pack_mms.py audio_build/items.json`: packt die MP3s in 75 Banken `dist/audio/m{n}.js` (FNV-Hash % 75), schreibt `index.json` und die Lautschrift `ipa.json` (braucht `espeak-ng`; Pfad über `ESPEAK_NG`, Daten über `ESPEAK_DATA_PATH`).
5. `build.py`, dann `build_pages.py`.

Bewertung im Aussprache-Trainer: MFCC + DTW, `score = 100 * clamp((2.62 - d) / 0.91)`. Kalibriert: derselbe Satz von einer anderen Stimme ≈ 78, ein anderer Satz ≈ 25. Für einzelne Wörter ist das Maß unzuverlässig, deshalb übt der Trainer Sätze. `tools/mfcc_dtw.py` ist die Python-Referenz.

## Gamifizierung (`47-game.js`)

| Element | Regel |
|---|---|
| **Ast (Stufe)** | Gesamt-XP für Stufe n: `25 · n · (n − 1)` (Stufe 2 = 50 XP, 5 = 500, 10 = 2250, 20 = 9500) |
| **Ränge** | Nûhatî (1) · Şagirt (3) · Xwendekar (5) · Axaftvan (8) · Zimanzan (12) · Dengbêj (16) · Hosta (20) |
| **Zêr (Gold)** | +5 je Tagesaufgabe, +15 Schatzkiste, +10 je Stufenaufstieg |
| **Erkên rojê (Tagesaufgaben)** | 3 pro Tag, per Datum fest ausgelost (`pickQuests`), immer mindestens eine Lernaufgabe (Lektion oder Karteikarten). Je +10 XP und +5 Zêr |
| **Sindoq (Schatzkiste)** | alle drei Aufgaben geschafft: +15 Zêr |
| **Mertal (Serienschutz)** | kostet 40 Zêr, höchstens 2. Wird für verpasste Tage automatisch eingesetzt (`ensureDay`), die Tage landen in `S.game.frozen` und zählen für die Serie |
| **Abzeichen** | `BADGES` in `10-core.js`, ergänzt um Ast 5/10/20, 10 Aufgaben, 7 Schatzkisten |
| **Feiern** | `celebrate()` zeigt ein Overlay mit drehender Sonne und Konfetti in Flaggenfarben (respektiert `prefers-reduced-motion`) |
| **Tagesziel** | die Sonne auf der Startseite: Jeder ihrer 21 Strahlen leuchtet für 1/21 des Tagesziels |

Zustand: `S.game = { zer, shields, frozen, day: { date, ids, done, chest, base }, quests, lvSeen, chests, bought }`. Aufgaben zählen über Zähler im Speicherstand gegenüber einem Tagesstart-Schnappschuss (`day.base`). Eine neue Aufgabe braucht also einen Zähler in `S`, der bei der Aktivität hochgezählt wird (Beispiel: `S.pron.qn` im Hörtraining), plus einen Eintrag in `QUESTS`. Neue XP-Quellen immer über `addXP()` laufen lassen, dann greifen Aufgaben, Stufen und Abzeichen automatisch.

Grundsätze: belohnen, was beim Lernen hilft (Wiederholen, Sprechen, tägliche Routine), und nicht bloßes Klicken. Keine Strafen, keine Werbung, keine Käufe mit echtem Geld.

## Gestaltung: Farben der kurdischen Flagge

Rot, Weiß, Grün und die goldene Sonne mit **21 Strahlen**. Die Tokens stehen in `00-head.html` unter `:root`:

| Token | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `--flag-red` / `--flag-white` / `--flag-green` / `--flag-sun` | #ED2024 / #FFFFFF / #278E43 / #FEBD11 | gleich | nur für Flaggen-Elemente: Streifen oben, Logo, App-Symbol, Konfetti |
| `--hinar` (Rot) | #D0202A | #FF6B6F | Hauptaktionen, aktive Navigation, Titel-Akzente |
| `--dicle` (Grün) | #1A7A3A | #4CC47A | Erfolg, Fortschritt, Tagesaufgaben, Serienschutz |
| `--roj` (Sonnengold) | #F5B300 | #FFC83D | Sonne, Stufen-Abzeichen, Zêr, Sterne (als Fläche) |
| `--roj-ink` | #8A6100 | #FFC83D | Gold als **Text** (Gold auf Weiß ist sonst zu kontrastarm) |

Weitere Tokens für Tiefe und Widgets (jeweils mit Dunkel-Variante):

| Token | Verwendung |
|---|---|
| `--shade` | weicher Farbverlauf im Hintergrund: Sonnengold oben rechts, Rot oben links, Grün unten. Liegt fest hinter allem (`body::before`) und im Lektions-Overlay |
| `--glass`, `--glass-line` | halbtransparente Fläche für Leiste unten, Seitenleiste und Chips in Widgets (mit `backdrop-filter: blur`) |
| `--w-red`, `--w-sun`, `--w-green` (+ `-line`) | kräftigere Verläufe für Widgets: Klasse `card widget w-red` usw. Startseite: Tagesziel grün, Stufe rot, Tagesaufgaben gold, Wort des Tages rot, Sprichwort gold. `.tints` färbt eine Kartenliste reihum |
| `--w-shadow` | Schatten der Karten |

Die **Leiste unten auf dem Handy** schwebt wie bei Instagram: abgerundete Pille mit Abstand zum Rand, halbtransparent mit Unschärfe (`.bottom`).

Regeln: Farben nur über Tokens, keine Hex-Werte im Code. Jede Farbe braucht einen Wert für den Dunkelmodus. Text in Gold immer mit `--roj-ink`. Die Sonne hat immer 21 Strahlen (`sunSVG()`, `flagMark()`). Die Navigationspunkte tragen kurdische Namen mit deutschem Untertitel.

## Konventionen

- Keine Abhängigkeiten zur Laufzeit außer Google Fonts. Vanilla JS, kein Framework, kein Bundler.
- Kurdisch korrekt mit ê, î, û, ç, ş schreiben. Beim Prüfen von Antworten sind fehlende Sonderzeichen erlaubt (`flat()`), werden aber angezeigt.
- Inhalte wurden mit KI erstellt und sind noch nicht von Muttersprachlern geprüft. Vor einer Store-Veröffentlichung muss eine muttersprachliche Prüfung passieren, am besten von Sprecher/innen aus Amed und Êlih.
- Commits: kleine, beschreibende Commits auf `main`. Nach `build_pages.py` die generierten Dateien in der Wurzel mit committen.

## Roadmap

### 1. Deutsche und englische Version

Heute sind deutsche Texte direkt in den Template-Strings (`*.js`) und in den Datenfeldern (`de`, `th`, `goal`, `sub`, `dia`, Erklärungen in `g`). Vorgehen:

1. **Oberflächentexte** in Sprachdateien auslagern (`src/i18n/de.js`, `src/i18n/en.js`) und über `t('schlüssel')` holen. Die kurdischen Navigationsnamen bleiben, nur die Untertitel wechseln.
2. **Inhalte trennen:** ein sprachneutraler kurdischer Kern (IDs, `ku`-Texte, Dialogsprecher, Lückensätze, Audio-Schlüssel) und pro Sprache eine Schicht mit Übersetzungen und Erklärungen. Vorschlag: Inhalte als JSON in `content/core/` und `content/de/`, `content/en/`. Das brauchen später auch die nativen Apps.
3. **Erklärungen neu schreiben, nicht wörtlich übersetzen:** Die deutschen Texte vergleichen oft mit deutscher Grammatik und Aussprache („wie deutsches w“). Die englische Version braucht eigene Vergleiche für Englischsprachige.
4. Übersetzungsübungen brauchen je Sprache eigene akzeptierte Antworten.
5. Sprachwahl beim ersten Start und im Profil (`S.ui = 'de' | 'en'`). Der Speicherstand bleibt sprachunabhängig, Aufnahmen werden geteilt.
6. Auslieferung: eine App mit Umschalter oder getrennte Pfade `/de/` und `/en/`, mit `hreflang`.

### 2. Native App für Android und iOS

Anforderungen: Offline-Nutzung inklusive aller rund 4.600 Aufnahmen (etwa 30 MB), Mikrofon und Aufnahme für den Trainer, dauerhafter lokaler Speicher, Erinnerungen an die Serie (Push), optional Sync zwischen Geräten, Datenschutzerklärung (Mikrofon), Konten bei Google Play und im Apple App Store.

| Weg | Vorteil | Nachteil |
|---|---|---|
| **Capacitor** (Web-App in nativer Hülle) | nutzt den bestehenden Code fast unverändert, am schnellsten im Store | fühlt sich weniger nativ an; Audio als echte Dateien statt Base64-Banken nötig |
| **React Native / Expo** | native Bedienung, große Community, JS-Logik teils übertragbar | Oberfläche neu bauen |
| **Flutter** | sehr flüssige Oberfläche, ein Code für beide Plattformen | kompletter Neubau in Dart |

Empfohlene Reihenfolge: zuerst die Inhalte als JSON auslagern (siehe i18n), dann mit **Capacitor** eine erste Store-Version bauen und später entscheiden, ob sich ein Neubau lohnt. Audio als MP3-Dateien mitliefern, Speicher über SQLite oder Preferences statt localStorage, Mikrofonrechte sauber anfragen.

### Lizenz der Stimme

Die Aufnahmen stammen von **MMS-TTS (Meta), Lizenz CC BY-NC 4.0: nur nicht-kommerziell.** Eine kostenlose App ohne Werbung ist damit vereinbar, eine kostenpflichtige App, Abos oder Werbung nicht. Für eine kommerzielle App braucht es Aufnahmen von Muttersprachler/innen (am besten aus Amed und Êlih; `audio_build/items.json` ist die fertige Liste aller Sätze) oder eine kommerziell lizenzierte Stimme. Die Lautschrift kommt von eSpeak NG (GPL, wird nur beim Bauen genutzt).
