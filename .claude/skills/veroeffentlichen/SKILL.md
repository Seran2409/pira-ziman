---
name: veroeffentlichen
description: Neue Version von Pira Ziman auf GitHub Pages veröffentlichen (Service-Worker-Version erhöhen, Website bauen, committen, pushen, live prüfen).
disable-model-invocation: true
argument-hint: "[kurze Beschreibung der Änderung]"
---

# Veröffentlichen

Änderung: $ARGUMENTS

Stand: !`git status --short`

1. **Prüfen:** Skill `bauen` ausführen. Nur weitermachen, wenn alles grün ist.
2. **Version erhöhen:** In `source/tools/build_pages.py` die Zeile `VERSION = 'pira-vN'` um eins erhöhen. Ohne neue Version liefern installierte Apps die alte Fassung aus dem Cache. Die Zahl auch in `CLAUDE.md` (Abschnitt „Bauen und testen“) nachziehen, falls sie dort steht.
3. **Website bauen:** im Ordner `source/` `python3 tools/build_pages.py`. Das schreibt `index.html`, `audio/`, `sw.js`, `manifest.webmanifest`, die Symbole und `README.md` in die Repo-Wurzel. Fehlt `source/dist/audio/`, erst nach `.claude/rules/audio.md` vorgehen (bei unveränderten Aufnahmen reicht `cp -r ../audio dist/audio`).
4. **Committen:** Quelltext und generierte Dateien zusammen, mit einer Nachricht, die beschreibt, was sich für Lernende ändert. Nichts aus `.gitignore` mitnehmen (Stimmmodell, Rohaufnahmen, Testbilder).
5. **Pushen:** `git push origin main`. Nie mit `--force`.
6. **Live prüfen:** GitHub Pages braucht etwa eine Minute. Dann https://seran2409.github.io/pira-ziman/sw.js laden und nachsehen, ob die neue Version drinsteht, und die Startseite öffnen. Kommt man aus der Umgebung nicht an die Seite, die Person bitten, den Link zu öffnen und einmal neu zu laden.
7. **Kurz berichten:** was neu ist, in Worten für Lernende, und dass installierte Apps beim nächsten Öffnen aktualisieren (eventuell erst nach einem zweiten Neuladen).
