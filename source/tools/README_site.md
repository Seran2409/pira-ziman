# Pira Ziman · Kurmancî lernen

Eine Lern-App für Kurmancî (Nordkurdisch) von **A1 bis C2**, mit Schwerpunkt auf der Sprache in **Amed (Diyarbakır)** und **Êlih (Batman)**. Grundlage ist die Standardschrift (Hawar-Alphabet). Hinweise zur regionalen Aussprache und Umgangssprache stehen in jeder Lektion.

**App öffnen:** https://seran2409.github.io/pira-ziman/

## Was drin ist

- **54 Lektionen** von A1 bis C2, jeweils mit Erklärung, Wörtern, Dialog und gemischten Übungen (Paare, Satzbau, Lücken, Tippen)
- **C2 · Meisterschaft:** Dialekte verstehen, feste Formeln und offizielle Briefe, klassische Dichtung, Humor und Wortspiele, idiomatisches Übersetzen, Fachsprache, feine Grammatik, flüssiges Sprechen
- **Niveautests:** Wer 80 % schafft, schaltet ein Niveau frei und kann es überspringen
- **Natürliche Aussprache** zu jedem kurdischen Wort und Satz (neuronale Kurmancî-Stimme)
- **Aussprache-Trainer „Deng“:** nachsprechen mit Aufnahme und Bewertung (Ähnlichkeit, schwächste Stelle, Tempo, Satzmelodie), Lautschule mit Mundstellungen, Hörtraining mit Minimalpaaren, Shadowing
- **Karteikarten** mit verteilter Wiederholung, **Verbtrainer** für 10 Zeiten inklusive Ergativ
- **12 Lesetexte** mit Antipp-Wörterbuch und Verständnisfragen
- Wörterbuch, Grammatik zum Nachschlagen und eine Seite mit Lernmethoden
- **Spielerisch lernen:** Stufen und Ränge (von *Nûhatî* bis *Hosta*), drei Tagesaufgaben mit Schatzkiste, die Münze **Zêr**, Serienschutz **Mertal**, Abzeichen und eine Tagesziel-Sonne mit 21 Strahlen
- Gestaltet in den Farben der kurdischen Flagge: Rot, Weiß, Grün und die goldene Sonne

## Fortschritt

Der Lernstand wird im Browser auf dem jeweiligen Gerät gespeichert. Unter **Profîl** kannst du eine Sicherungsdatei herunterladen und auf einem anderen Gerät wieder laden. Aufnahmen im Aussprache-Trainer verlassen dein Gerät nicht.

## Als App installieren

Öffne den Link auf dem Handy und wähle im Browsermenü **„Zum Startbildschirm hinzufügen“**. Danach startet Pira Ziman wie eine App. Die Seite und alle Aufnahmen, die du schon einmal gehört hast, funktionieren dann auch ohne Internet.

## Hinweise

- **Stimme:** Die Aufnahmen sind mit dem Sprachmodell [MMS-TTS](https://huggingface.co/facebook/mms-tts-kmr-script_latin) von Meta (Massively Multilingual Speech) erzeugt. Lizenz: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), also nur für nicht-kommerzielle Nutzung. Die Lautschrift im Trainer stammt von [eSpeak NG](https://github.com/espeak-ng/espeak-ng).
- **Inhalte:** Die Texte und Übungen wurden mit Claude (KI von Anthropic) erstellt und noch nicht von Muttersprachlern geprüft. Hinweise auf Fehler sind willkommen.
- **Schriften:** Bricolage Grotesque, Figtree und JetBrains Mono über Google Fonts.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | die komplette App (Inhalte, Logik, Gestaltung) |
| `audio/m0.js` … | Aussprache-Aufnahmen, werden bei Bedarf nachgeladen |
| `sw.js`, `manifest.webmanifest`, `icon*.png`, `icon.svg` | Offline-Nutzung und App-Symbol |
| `.nojekyll` | sorgt dafür, dass GitHub Pages die Dateien unverändert ausliefert |
| `source/` | Quelltext, Build- und Audio-Werkzeuge, Tests (siehe `CLAUDE.md`) |

## Ausblick

Die Web-App ist ein erster Entwurf. Geplant sind eine **deutsche und eine englische Version** (Oberfläche und Erklärungen jeweils komplett in einer der beiden Sprachen) sowie eine richtige **App für Android und iOS**. Details stehen in `CLAUDE.md`.
