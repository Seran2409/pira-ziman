---
paths:
  - "source/src/00-head.html"
  - "source/src/01-body.html"
  - "source/src/47-game.js"
  - "source/src/48-look.js"
  - "source/tools/build_pages.py"
---

# Gestaltung: Farben der kurdischen Flagge

Rot, Weiß, Grün und die goldene Sonne mit **21 Strahlen**. Kräftige, „saftige“ Farben auf allen Tabs, Glas-Effekte für Leisten. Alle Tokens stehen in `00-head.html` unter `:root`, mit Werten für den Dunkelmodus in **zwei** Blöcken (`@media (prefers-color-scheme:dark)` und `:root[data-theme="dark"]`). Neue Tokens in alle drei Blöcke eintragen.

## Grundfarben

| Token | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `--flag-red` / `--flag-white` / `--flag-green` / `--flag-sun` | #ED2024 / #FFFFFF / #278E43 / #FEBD11 | gleich | nur Flaggen-Elemente: Streifen oben, Logo, App-Symbol, Konfetti |
| `--hinar` (Rot) | #D0202A | #FF6B6F | Akzente, aktive Navigation, Titel |
| `--dicle` (Grün) | #1A7A3A | #4CC47A | Erfolg, Fortschritt, Tagesaufgaben, Serienschutz |
| `--roj` (Sonnengold) | #F5B300 | #FFC83D | Sonne, Stufen-Abzeichen, Zêr, Sterne (als Fläche) |
| `--roj-ink` | #8A6100 | #FFC83D | Gold als **Text** (Gold auf Weiß ist sonst zu kontrastarm) |
| `--on-hinar`, `--on-roj`, `--on-dicle` | | | Textfarbe auf der jeweiligen kräftigen Fläche |

## Tiefe, Glas und Widgets

| Token | Verwendung |
|---|---|
| `--shade` | weicher Verlauf im Hintergrund (Gold oben rechts, Rot oben links, Grün unten), fest hinter allem (`body::before`) und im Lektions-Overlay |
| `--glass`, `--glass-line` | halbtransparente Fläche mit `backdrop-filter: blur` für die Leiste unten, die Seitenleiste und Elemente in Widgets |
| `--w-red`, `--w-sun`, `--w-green` (+ `-line`) | kräftige Verläufe für Widgets: `class="card widget w-red"` usw. |
| `--w-shadow` | Schatten von Karten und Kacheln |
| `--btn-red`, `--btn-red-glow`, `--on-btn` | Hauptknöpfe (`.btn.primary`): roter Verlauf mit Leuchten |

- **Startseite:** Tagesziel grün, Stufe rot, Tagesaufgaben gold, Wort des Tages rot, Sprichwort gold, die Brücke neutral.
- **Alle anderen Tabs:** `afterRoute()` in `48-look.js` färbt Karten und Kacheln reihum rot, gold, grün. Karten mit eigener Farbe geben den Takt vor, Karten mit der Brücke bleiben neutral.
- **Lernpfad und Lesen:** Niveaus (`section.level`) wechseln rot, gold, grün (A1 rot, A2 gold, B1 grün, B2 rot, C1 gold, C2 grün). Lektionszeilen, Nummern und der Ring der nächsten Lektion folgen der Niveaufarbe.
- **In einem Widget** werden `--surface`, `--sunk` und `--line` auf Glas umgestellt. Neue Komponenten mit diesen Tokens passen sich darin automatisch an.
- **Leiste unten auf dem Handy:** schwebende, abgerundete Pille wie bei Instagram, halbtransparent mit Unschärfe (`.bottom`).

## Regeln

- Farben nur über Tokens. Neue Farbwerte gehören in die Token-Blöcke, nicht in Komponenten-CSS oder JS.
- Jede Farbe braucht einen Wert für den Dunkelmodus. Gold als Text immer `--roj-ink`.
- Die Sonne hat immer 21 Strahlen (`sunSVG()`, `flagMark()` in `47-game.js`).
- Navigationspunkte tragen kurdische Namen mit Untertitel in der Oberflächensprache.
- Bewegung nur mit `@media (prefers-reduced-motion: no-preference)`.
- Auf 390 px Breite darf nichts seitlich scrollen. Prüfen mit `python3 tests/screens.py` (meldet Seitwärts-Scrollen und JS-Fehler) und die Bilder in `source/tests/out/` ansehen, hell und dunkel.
- App-Symbole (`icon.svg`, `icon-192.png`, `icon-512.png`) entstehen in `tools/build_pages.py`: Flagge mit Sonne.
