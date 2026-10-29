# Pira Ziman in den App Store und zu Google Play – von Windows aus

Die App ist fertig vorbereitet: `native/` enthält die iOS- und die Android-App (Capacitor), `codemagic.yaml` baut beide in der Cloud. **Einen Mac brauchst du nicht.** Codemagic baut die iOS-App auf einem Mac in der Cloud, signiert sie und lädt sie zu TestFlight hoch. Alles andere erledigst du im Browser.

## Bevor du startest: drei Pflichtpunkte

1. **Impressum und Datenschutz ausfüllen:** In `source/site/impressum.html`, `datenschutz.html` und `nutzungsbedingungen.html` alle `[Platzhalter]` ersetzen (siehe `docs/rechtliches/IMPRESSUM.md`). Dann `py tools/build_pages.py` in `source/` und pushen. Die Stores verlangen eine öffentlich erreichbare Datenschutz-URL: `https://seran2409.github.io/pira-ziman/datenschutz.html`.
2. **Muttersprachliche Prüfung:** Die Inhalte sind KI-erstellt. Lass vor dem Start mindestens A1 und A2 von Sprecher/innen aus Amed oder Êlih gegenlesen. Schlechte Bewertungen wegen Fehlern lassen sich später kaum wieder aufholen.
3. **Kostenlos und werbefrei bleiben:** Die Stimme (MMS-TTS) darf nur nicht-kommerziell genutzt werden (CC BY-NC 4.0). Deshalb gibt es keine Käufe, keine Werbung und keinen Spendenknopf in der App (siehe `docs/GELD_UND_PROMO.md`).

## Was es kostet

| | Kosten | Wofür |
|---|---|---|
| Apple Developer Program | 99 € pro Jahr | App Store, TestFlight |
| Google Play Console | 25 US-$ einmalig | Google Play |
| Codemagic | kostenloses Kontingent für Einzelpersonen (aktuelle Minuten auf codemagic.io prüfen) | Cloud-Builds, iOS ohne Mac |

## Teil A: iOS (App Store) ohne Mac

1. **Apple-Konto:** Auf developer.apple.com dem Developer Program beitreten (als Einzelperson). Mit iPhone geht die Identitätsprüfung am schnellsten über die App „Apple Developer“.
2. **App anlegen:** In App Store Connect → Apps → „+“ → Neue App. Plattform iOS, Name „Pira Ziman: Kurdisch lernen“, Sprache Deutsch, Bundle-ID `io.github.seran2409.piraziman` (vorher unter developer.apple.com → Identifiers anlegen), SKU z. B. `piraziman`.
3. **EU-Händlerstatus (DSA):** App Store Connect fragt, ob du „Händler“ bist. Ohne Einnahmen aus der App wählst du in der Regel „kein Händler“. Dann wird deine Adresse im Store nicht angezeigt. Sobald du gewerblich Geld einnimmst, ändert sich das.
4. **API-Schlüssel für Codemagic:** App Store Connect → Benutzer und Zugriff → Integrationen → App Store Connect API → Schlüssel erzeugen (Rolle „App Manager“). Die `.p8`-Datei, die Key-ID und die Issuer-ID notieren. Die Datei lässt sich nur einmal herunterladen.
5. **Codemagic einrichten:**
   - Auf codemagic.io mit GitHub anmelden und das Repo `pira-ziman` hinzufügen.
   - Teams → Integrations → Developer Portal → den API-Schlüssel unter dem Namen **`Pira Ziman ASC`** eintragen.
   - Code signing identities → iOS certificates → „Generate certificate“ (Typ Apple Distribution). Codemagic erzeugt Zertifikat und Profil automatisch, ohne Mac.
   - In `codemagic.yaml` bei `APP_STORE_APPLE_ID` die Zahl aus App Store Connect → App-Informationen → „Apple-ID“ eintragen.
6. **Bauen:** Ein Tag pushen, z. B. `git tag app-v1.0.0 && git push origin app-v1.0.0`, oder in Codemagic „Start new build“ → `ios-release`. Nach etwa 20 Minuten liegt der Build in TestFlight.
7. **Testen:** Die App „TestFlight“ aufs iPhone laden, dich als Testerin eintragen und die App ausprobieren, vor allem den Aussprache-Trainer mit der Mikrofon-Abfrage.
8. **Store-Eintrag** (Texte unten): Screenshots für 6,9″ (1320 × 2868) und optional 13″ iPad, Datenschutz-URL, Altersfreigabe (alles „Nein“ → 4+), Kategorie „Bildung“.
   - **App-Datenschutz:** „Keine Daten erfasst“. Das stimmt, weil die App nichts sendet.
9. **Zur Prüfung einreichen.** Apple prüft meist in 1–3 Tagen. Ein Hinweis für die Prüfung hilft gegen die Ablehnung als „nur eine Website“ (Richtlinie 4.2):
   > Pira Ziman works fully offline: all 54 lessons and about 4,600 pronunciation recordings are bundled in the app. The pronunciation trainer uses the microphone and scores speech on the device. No account, no tracking, no ads.

## Teil B: Android (Google Play)

1. **Konto:** play.google.com/console → privates Konto (25 US-$), Identität bestätigen.
2. **Wichtig für neue private Konten:** Bevor die App öffentlich erscheinen darf, verlangt Google einen **geschlossenen Test mit mindestens 12 Tester/innen über 14 Tage**. Frag früh Familie, Freundeskreis und kurdische Vereine nach Gmail-Adressen.
3. **Upload-Schlüssel erzeugen** (einmalig, gut aufbewahren!). Dafür brauchst du Java, z. B. „Eclipse Temurin 21“ von adoptium.net. Danach in PowerShell:
   ```
   keytool -genkey -v -keystore pira-upload.jks -alias pira -keyalg RSA -keysize 2048 -validity 10000
   ```
   In Codemagic → Code signing identities → Android keystores unter dem Namen **`pira_upload_key`** hochladen.
4. **Erster Build:** In Codemagic den Workflow `android-release` starten. Das fertige `.aab` aus den Artefakten herunterladen.
5. **App anlegen:** Play Console → App erstellen. Das **erste** `.aab` lädst du von Hand hoch (Test → Geschlossener Test). Danach kann Codemagic automatisch hochladen.
6. **Automatischer Upload (optional):** In der Google Cloud ein Dienstkonto mit JSON-Schlüssel anlegen, in der Play Console unter Nutzer und Berechtigungen freigeben und in Codemagic als Variable `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` in der Gruppe `google_play` speichern.
7. **Store-Eintrag:**
   - Texte unten verwenden.
   - Grafiken: Symbol 512 × 512 (`icon-512.png`), Vorstellungsgrafik 1024 × 500, mindestens 2 Handy-Screenshots.
   - Formulare ausfüllen: Datenschutzerklärung (URL), Datensicherheit („keine Daten erhoben oder geteilt“), Inhaltsfreigabe (IARC-Fragebogen), Zielgruppe (ab 13 oder ab 16, nicht „Kinder“, sonst gelten Zusatzregeln).

## Neue Version veröffentlichen

1. Änderungen wie gewohnt in `source/` machen, `/bauen`, dann `/veroeffentlichen` (Website).
2. In `native/android/app/build.gradle` `versionName` und in Xcode-Einstellungen bzw. `MARKETING_VERSION` die Versionsnummer erhöhen (z. B. 1.0.1). Die Build-Nummern setzt Codemagic selbst.
3. Tag pushen: `git tag app-v1.0.1 && git push origin app-v1.0.1`. Beide Apps werden gebaut und hochgeladen.

Lokal ausprobieren unter Windows: `cd native && npm install && npm run sync`, dann `npx cap open android` (braucht Android Studio). Für iOS gibt es unter Windows nur TestFlight.

## Store-Texte (Deutsch)

| Feld | Text | Grenze |
|---|---|---|
| Name | Pira Ziman: Kurdisch lernen | 30 |
| Untertitel (Apple) | Kurmancî von A1 bis C2 | 30 |
| Kurzbeschreibung (Google) | Kurdisch (Kurmancî) von A1 bis C2 – mit Aussprache-Trainer, offline & werbefrei | 80 |
| Schlüsselwörter (Apple) | `kurmanci,kurdish,kurdî,sprachkurs,vokabeltrainer,amed,diyarbakir,batman,aussprache,grammatik,kurd` | 100 |
| Kategorie | Bildung (Zweitkategorie: Nachschlagewerke) | |

**Beschreibung:**

> Lerne Kurmancî, das Nordkurdische, Schritt für Schritt – von den ersten Wörtern bis zu Dichtung und Dialekten.
>
> Pira Ziman („Sprachbrücke“) führt dich in 54 Lektionen von A1 bis C2. Jede Lektion erklärt kurz die Grammatik, bringt neue Wörter mit Aussprache, einen Dialog aus dem Alltag und abwechslungsreiche Übungen. Der Schwerpunkt liegt auf der Sprache in Amed (Diyarbakır) und Êlih (Batman): Zu jeder Lektion zeigt dir die App, wie man dort wirklich spricht.
>
> • 54 Lektionen von A1 bis C2 mit Niveautests
> • Aussprache zu jedem Wort und Satz
> • Aussprache-Trainer „Deng“: nachsprechen, aufnehmen, Bewertung direkt auf dem Gerät
> • Karteikarten mit kluger Wiederholung
> • Verbtrainer für 10 Zeiten inklusive Ergativ
> • 12 Lesetexte mit Antipp-Wörterbuch
> • Tagesziel, Serien, Stufen, Abzeichen und Tagesaufgaben – motivierend, ohne Druck
>
> Kostenlos. Keine Werbung. Kein Konto. Funktioniert offline. Dein Lernstand und deine Aufnahmen bleiben auf deinem Gerät.
>
> Hinweis: Die Inhalte wurden mit KI erstellt und werden laufend von Muttersprachler/innen geprüft. Fehler gefunden? Schreib mir, die Adresse steht im Impressum.

Wenn später die englische Version fertig ist (siehe `ROADMAP.md`), bekommt der Store-Eintrag eine englische Fassung. Vorher keinen englischen Eintrag anlegen, sonst gibt es Bewertungen wie „App ist nur auf Deutsch“.
