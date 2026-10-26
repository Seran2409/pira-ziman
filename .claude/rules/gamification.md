---
paths:
  - "source/src/47-game.js"
  - "source/src/10-core.js"
  - "source/src/20-learn.js"
---

# Gamifizierung (`47-game.js`)

| Element | Regel |
|---|---|
| **Ast (Stufe)** | Gesamt-XP für Stufe n: `25 · n · (n − 1)` (Stufe 2 = 50 XP, 5 = 500, 10 = 2250, 20 = 9500) |
| **Ränge** | Nûhatî (1) · Şagirt (3) · Xwendekar (5) · Axaftvan (8) · Zimanzan (12) · Dengbêj (16) · Hosta (20) |
| **Zêr (Gold)** | +5 je Tagesaufgabe, +15 Schatzkiste, +10 je Stufenaufstieg |
| **Erkên rojê (Tagesaufgaben)** | 3 pro Tag, per Datum fest ausgelost (`pickQuests`), immer mindestens eine Lernaufgabe (Lektion oder Karteikarten). Je +10 XP und +5 Zêr |
| **Sindoq (Schatzkiste)** | alle drei Aufgaben geschafft: +15 Zêr |
| **Mertal (Serienschutz)** | kostet 40 Zêr, höchstens 2, wird für verpasste Tage automatisch eingesetzt (`ensureDay`). Die Tage landen in `S.game.frozen` und zählen für die Serie |
| **Abzeichen** | `BADGES` in `10-core.js`, ergänzt um Ast 5/10/20, 10 Aufgaben, 7 Schatzkisten |
| **Feiern** | `celebrate()`: Overlay mit drehender Sonne und Konfetti in Flaggenfarben |
| **Tagesziel** | die Sonne auf der Startseite, jeder der 21 Strahlen leuchtet für 1/21 des Tagesziels |

Zustand: `S.game = { zer, shields, frozen, day: { date, ids, done, chest, base }, quests, lvSeen, chests, bought }`.

## Neue Tagesaufgabe

Aufgaben zählen über Zähler im Speicherstand gegenüber einem Schnappschuss vom Tagesbeginn (`day.base`). Eine neue Aufgabe braucht:
1. einen Zähler in `S`, der bei der Aktivität hochgezählt wird (Beispiel: `S.pron.qn` im Hörtraining), eingetragen in `fresh()`/`merge()`,
2. den Zähler in `day.base` in `ensureDay()`,
3. einen Eintrag in `QUESTS` mit `id, ic, t, n, get, ok` (`ok` entscheidet, ob die Aufgabe schon passt, z. B. erst ab genug Karten).

## Grundsätze

- Belohnen, was beim Lernen hilft: Wiederholen, Sprechen, tägliche Routine. Nicht bloßes Klicken.
- Keine Strafen, keine Werbung, keine Käufe mit echtem Geld, keine künstliche Verknappung.
- Bestehende Spielstände dürfen nie Fortschritt verlieren. `lvSeen` startet bei der aktuellen Stufe, damit alte Nutzer keine Flut von Aufstiegs-Feiern bekommen.
- Neue XP-Quellen über `addXP()`.
