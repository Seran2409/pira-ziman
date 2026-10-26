---
name: neue-lektion
description: Eine neue Lektion für Pira Ziman schreiben oder eine bestehende ausbauen (Theorie, Wörter, Dialog, Sätze, Lückensätze, Hinweise zu Amed und Êlih), mit Aufnahmen und Prüfung.
argument-hint: "<Niveau> <Thema>, z. B. B1 Beim Arzt"
---

# Neue Lektion: $ARGUMENTS

Lies zuerst `.claude/rules/inhalte.md` (Datenmodell und Sprachregeln) und eine bestehende Lektion desselben Niveaus als Vorbild für Umfang und Ton.

1. **Platz finden:** Die Lektionen eines Niveaus stehen in zwei Dateien (`source/src/60-a1a.js` … `6b-c2b.js`). Neue Lektion ans Ende der passenden Datei, ID fortlaufend (z. B. `b1-11`). Bestehende IDs nie ändern.
2. **Inhalt schreiben:**
   - `title` auf Kurmancî, `sub` und `goal` auf Deutsch („Du kannst …“)
   - `th`: kurze Erklärung mit Tabelle (`T(...)`) oder Beispielen (`EX(...)`), nur Grammatik, die zum Niveau passt und auf früheren Lektionen aufbaut
   - `vocab` 12 bis 20 Einträge, `dlg` ein natürlicher Dialog, `s` mindestens 8 Sätze, `g` mindestens 6 Lückensätze mit Erklärung
   - `dia`: wie man es in Amed und Êlih sagt, wo es vom Standard abweicht
   - Kurmancî im Hawar-Alphabet, keine türkischen Buchstaben
3. **Sprachlich prüfen lassen:** Agent `kurmanci-lektor` mit der neuen Lektion beauftragen und seine Hinweise einarbeiten.
4. **Aufnahmen:** Skill `audio-erneuern` ausführen (nur die neuen Texte werden erzeugt).
5. **Prüfen:** Skill `bauen`. Die neue Lektion muss im Smoke-Test als abgeschlossen auftauchen.
6. **Berichten:** Thema, Lernziel, Umfang, offene Fragen zur Sprache. Veröffentlichen nur, wenn die Person es möchte (`/veroeffentlichen`).
