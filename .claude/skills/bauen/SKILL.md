---
name: bauen
description: Pira Ziman bauen und prüfen. Setzt die App aus source/src zusammen, spielt alle Lektionen und Niveautests durch und macht Screenshots (hell, dunkel, Handy). Nach jeder größeren Änderung verwenden, bevor etwas veröffentlicht wird.
allowed-tools:
  - Bash(python3 build.py)
  - Bash(python3 tests/smoke.py *)
  - Bash(python3 tests/screens.py *)
  - Read
---

# Bauen und prüfen

Arbeite im Ordner `source/`.

1. **Bauen:** `python3 build.py`. Bricht es ab, den Fehler beheben, bevor es weitergeht.
2. **Lektionen durchspielen:** `python3 tests/smoke.py dist/pira-ziman.html`. Erwartet: alle Lektionen von A1 bis C2 abgeschlossen, alle Niveautests bestanden, eine Zeile `GAME {…}` mit Stufe, Zêr und Tagesaufgaben. Am Ende muss `NO ERRORS` stehen. Die Audio-Banken sind dabei blockiert, damit der Lauf in etwa 20 Sekunden fertig ist; mit `PIRA_SMOKE_AUDIO=1` laufen sie mit (dauert viel länger, weil echte Wiedergabe abgewartet wird).
3. **Screenshots:** `python3 tests/screens.py`. Das Skript meldet JS-Fehler und Seiten, die seitlich scrollen (Exit-Code 1). Danach die Bilder in `tests/out/` mit Read ansehen und gegen `.claude/rules/gestaltung.md` prüfen: saftige Rot-Gold-Grün-Karten, lesbarer Text in hell und dunkel, schwebende Leiste unten, nichts abgeschnitten oder überlappend.
4. **Bericht** in wenigen Sätzen: was geprüft wurde, was auffiel, was zu tun ist. Bilder mit Problemen beim Namen nennen.

Gründlichere Sichtprüfung: Agent `ui-pruefer`. Inhalte auf Kurmancî prüfen: Agent `kurmanci-lektor`.
