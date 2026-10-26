---
paths:
  - "source/src/5*.js"
  - "source/src/6*.js"
  - "source/src/7*.js"
---

# Inhalte: Lektionen, Texte, Verben

## Datenmodell

Lektion (`PZ.lessons.push({...})`), je Niveau 8 bis 10 Lektionen:

| Feld | Bedeutung |
|---|---|
| `id`, `lv` | z. B. `a1-1`, `A1`. IDs nie umbenennen: Sie sind Schlüssel im Speicherstand |
| `title`, `sub`, `goal` | kurdischer Titel, deutscher Untertitel, Lernziel als „Du kannst …“ |
| `th` | Theorie als HTML. Kurdisches in `<span class="ku">`. Helfer `T(kopf, zeilen)` für Tabellen und `EX([[ku, de]])` für Beispiele |
| `vocab` | `[ku, de, merkhilfe?]`, etwa 12 bis 20 Wörter |
| `dlg` | `[sprecher, ku, de]`, ein kurzer Dialog |
| `s` | Beispielsätze `[ku, de]`, Quelle für Satzbau, Tippen und Hören (mindestens 8) |
| `g` | Lückensätze `[satz mit ___, lösung, optionen, erklärung]` |
| `dia` | Hinweise zur Sprache in Amed und Êlih (HTML) |

Lesetext (`PZ.texts`): `id, lv, title, de, intro, body, tr, gloss, q`. Verb (`PZ.verbs`): `inf, de, pr, pa, tr, core, note`.

## Sprache

- **Kurmancî im Hawar-Alphabet**, mit ê, î, û, ç, ş. Keine türkischen Buchstaben (ı, ğ, ö, ü) im kurdischen Text.
- **Standard zuerst**, regionale Formen aus **Amed (Diyarbakır)** und **Êlih (Batman)** als Hinweis im Feld `dia`, nicht als Ersatz für die Standardform.
- Grammatik genau: Ezafe (`-ê`, `-a`, `-ên`), Oblique, Ergativ in den Vergangenheitszeiten transitiver Verben, Verbstämme (Präsens/Vergangenheit), `xwe` als Reflexiv.
- Deutsche Erklärungen kurz und freundlich, mit Vergleichen zum Deutschen. Die englische Version bekommt später eigene Vergleiche (siehe `docs/ROADMAP.md`), deshalb Erklärungen nicht mit Kurdisch-Text vermischen, der für beide Sprachen gilt.
- Inhalte sind KI-erstellt und noch nicht muttersprachlich geprüft. Bei Unsicherheit lieber eine einfachere, sichere Formulierung wählen und den Agenten `kurmanci-lektor` prüfen lassen.

## Neue oder geänderte kurdische Texte brauchen Aufnahmen

Jeder kurdische Text (Wörter, Sätze, Dialogzeilen, Lesetexte) bekommt eine Aufnahme, Schlüssel `md5('mms1|' + text)`. Nach dem Ändern von Inhalten: Skill `/audio-erneuern` ausführen, sonst fehlt für neue Texte der Ton (die App liest einen Satz dann Wort für Wort vor, wenn es alle Wörter einzeln gibt, sonst zeigt sie keinen Lautsprecher-Knopf). Tippfehler im kurdischen Text lieber gleich richtig machen, jede Änderung kostet eine neue Aufnahme.

## Prüfen

`python3 tests/smoke.py dist/pira-ziman.html` (im Ordner `source/`) spielt alle Lektionen und Niveautests durch und meldet unbekannte Wörter in Lesetexten.
