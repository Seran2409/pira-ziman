# Pira Ziman · Roadmap

**Die Web-App ist ein erster Entwurf.** Sie dient als Prototyp für Inhalte, Didaktik und Gestaltung. Zwei Ziele stehen fest:

1. **Eine deutsche und eine englische Version.**
2. **Eine funktionierende native App für Android und iOS**, die in den Stores erscheint.

Neue Arbeit soll diese Ziele erleichtern und nicht verbauen.

## 1. Deutsche und englische Version

Oberfläche, Erklärungen, Übersetzungen und Übungen gibt es dann jeweils komplett auf Deutsch oder Englisch. Kurdisch bleibt die Zielsprache. Heute stehen deutsche Texte direkt in den Template-Strings (`source/src/*.js`) und in den Datenfeldern (`de`, `th`, `goal`, `sub`, `dia`, Erklärungen in `g`).

Vorgehen:

1. **Oberflächentexte auslagern** in Sprachdateien (`source/src/i18n/de.js`, `source/src/i18n/en.js`) und über `t('schlüssel')` holen. Die kurdischen Navigationsnamen bleiben, nur die Untertitel wechseln.
2. **Inhalte trennen:** ein sprachneutraler kurdischer Kern (IDs, `ku`-Texte, Dialogsprecher, Lückensätze, Audio-Schlüssel) und pro Sprache eine Schicht mit Übersetzungen und Erklärungen. Vorschlag: Inhalte als JSON in `content/core/`, `content/de/`, `content/en/`. Das brauchen später auch die nativen Apps.
3. **Erklärungen neu schreiben, nicht wörtlich übersetzen.** Die deutschen Texte vergleichen oft mit deutscher Grammatik und Aussprache („wie deutsches w“). Die englische Version braucht eigene Vergleiche für Englischsprachige.
4. **Übersetzungsübungen** brauchen je Sprache eigene akzeptierte Antworten.
5. **Sprachwahl** beim ersten Start und im Profil (`S.ui = 'de' | 'en'`). Der Speicherstand bleibt sprachunabhängig, die Aufnahmen werden geteilt (Schlüssel hängen nur vom kurdischen Text ab).
6. **Auslieferung:** eine App mit Umschalter oder getrennte Pfade `/de/` und `/en/`, mit `hreflang`.

## 2. Native App für Android und iOS

Anforderungen:

- Offline-Nutzung inklusive aller rund 4.600 Aufnahmen (als MP3-Dateien mitliefern, nicht als Base64-Banken)
- Mikrofon und Aufnahme für den Aussprache-Trainer, saubere Abfrage der Rechte
- dauerhafter lokaler Speicher (SQLite oder Preferences statt localStorage), Übernahme des bisherigen Speicherstands per Export/Import
- Erinnerungen an die Serie (lokale Benachrichtigungen)
- optional Sync zwischen Geräten
- Datenschutzerklärung (Mikrofon, keine Weitergabe von Aufnahmen)
- Konten bei Google Play und im Apple App Store. Ein iOS-Build braucht einen Mac oder einen Cloud-Build-Dienst

| Weg | Vorteil | Nachteil |
|---|---|---|
| **Capacitor** (Web-App in nativer Hülle) | nutzt den bestehenden Code fast unverändert, am schnellsten im Store | fühlt sich weniger nativ an, Audio muss als echte Dateien vorliegen |
| **React Native / Expo** | native Bedienung, große Community, JS-Logik teils übertragbar, Cloud-Builds für iOS (EAS) | Oberfläche neu bauen |
| **Flutter** | sehr flüssige Oberfläche, ein Code für beide Plattformen | kompletter Neubau in Dart |

Empfohlene Reihenfolge: zuerst die Inhalte als JSON auslagern (siehe oben), dann mit **Capacitor** eine erste Store-Version bauen und danach entscheiden, ob sich ein Neubau lohnt.

## Vor einer Store-Veröffentlichung

- **Muttersprachliche Prüfung** aller Inhalte, am besten von Sprecher/innen aus Amed und Êlih. Die Inhalte sind KI-erstellt.
- **Lizenz der Stimme:** MMS-TTS steht unter CC BY-NC 4.0, also nur nicht-kommerziell. Eine kostenlose App ohne Werbung ist damit vereinbar. Für eine kostenpflichtige App, Abos oder Werbung braucht es eigene Aufnahmen von Muttersprachler/innen (`source/audio_build/items.json` ist die fertige Liste aller Sätze) oder eine kommerziell lizenzierte Stimme.
- Barrierefreiheit prüfen (Kontraste hell und dunkel, Bedienung per Tastatur und Screenreader).
