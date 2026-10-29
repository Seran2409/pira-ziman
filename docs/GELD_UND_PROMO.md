# Pira Ziman: Geld und Bekanntheit

## Teil 1: Warum keine (versteckte) Werbung

Du hast recht: Downloads allein bringen kein Geld. Werbung ist trotzdem der falsche Weg, und versteckte Werbung erst recht:

- **Die Stimme verbietet es:** Die Aufnahmen stammen von MMS-TTS und stehen unter CC BY-NC 4.0, also nur für nicht-kommerzielle Nutzung. Werbung, Käufe oder Abos in der App wären ein Lizenzverstoß. Meta könnte das abmahnen, und die Stores können die App entfernen.
- **Versteckte Werbung ist verboten:** Schleichwerbung ist nach § 5a UWG unzulässig. Apple und Google verlangen ebenfalls, dass Werbung klar erkennbar ist.
- **Es lohnt sich kaum:** Banner in einer Nischen-Lern-App bringen pro 1.000 aktive Nutzer/innen meist nur wenige Euro im Monat. Gleichzeitig kosten sie Vertrauen, gerade bei einer Community-App für eine Minderheitensprache.
- **Es widerspricht deinem eigenen Versprechen:** Im Projekt steht „Gamifizierung belohnt Lernen, nicht Klicken: keine Werbung, kein Echtgeld“. Genau das macht die App sympathisch und teilbar.

## Teil 2: So kommt mit Spenden trotzdem etwas rein

### Spendenlink, aber nur außerhalb der Store-Apps

Für private Entwickler/innen erlauben Apple und Google nach ihren aktuellen Richtlinien keine Spenden- oder Trinkgeld-Links an den Bezahlsystemen der Stores vorbei. Die App blendet den Knopf deshalb in den Store-Versionen automatisch aus und zeigt ihn nur auf der Website.

- **Einrichten:** Ein Konto bei **Ko-fi** (keine Gebühr auf einmalige Spenden, Auszahlung über PayPal oder Stripe), **PayPal.Me** oder **GitHub Sponsors** anlegen und den Link in `source/src/49-legal.js` bei `donate:` eintragen.
- **Wo der Link hingehört:** Website (Profil-Seite), Bio auf Instagram und TikTok, YouTube-Beschreibungen, Linktree.
- **Was überzeugt:** Ein konkretes, sichtbares Ziel, z. B. „Echte Stimmen für Pira Ziman: 4.600 Sätze von Sprecherinnen aus Amed und Êlih einsprechen lassen“ mit Fortschrittsbalken. Leute spenden lieber für ein Ziel als „für die App“.
- **Steuern:** Spenden an eine Privatperson sind keine steuerlich absetzbaren Spenden, und bei dir können sie je nach Höhe steuerpflichtig sein. Kurz mit einer Steuerberatung oder einem Lohnsteuerhilfeverein klären.

### Förderungen: oft mehr als Spenden

Für eine kostenlose Lern-App für eine Minderheitensprache passen Förderprogramme besser als Werbung. Ansätze zum Recherchieren:

- Kultur- und Integrationsförderung von Bund, Ländern und Kommunen (Herkunftssprachen, Mehrsprachigkeit)
- Stiftungen für Bildung, digitale Teilhabe und Minderheitensprachen
- Open-Source-Förderprogramme, falls du den Code unter einer freien Lizenz veröffentlichst
- Kurdische Kulturvereine und Institute als Partner: Sie können Anträge mitstellen, Sprecher/innen vermitteln und die App bekannt machen

### Später: echtes Einkommen mit eigener Stimme

Wenn genug Spenden oder Fördermittel da sind, lässt du die Sätze von Muttersprachler/innen einsprechen (`source/audio_build/items.json` ist die fertige Liste). Dann sind die Aufnahmen deine eigenen, und du darfst zum Beispiel:

- **Freemium:** A1 bis B1 bleiben kostenlos, B2 bis C2 und der Aussprache-Trainer kosten ein günstiges Abo oder einen Einmalkauf
- **Kurse und Workshops:** Online-Kurse mit Lehrkraft, in denen die App als Begleitmaterial dient
- **Lizenzen für Schulen und Vereine:** z. B. für den Herkunftssprachenunterricht

Dann gelten die Händler-Regeln (siehe `docs/rechtliches/IMPRESSUM.md`), und die Nutzungsbedingungen brauchen Abschnitte zu Kauf, Widerruf und Abo.

## Teil 3: Promo-Plan

### Zielgruppen

1. **Kurdische Diaspora in Deutschland, vor allem die zweite und dritte Generation:** Viele verstehen etwas, sprechen aber kaum und können nicht lesen und schreiben. Botschaft: „Sprich mit deiner Oma in ihrer Sprache.“
2. **Eltern,** die ihren Kindern Kurmancî weitergeben wollen
3. **Partner/innen und Freund/innen** von Kurd/innen, die die Familie verstehen wollen
4. **Sprachinteressierte, Studierende und Fachleute** (Kurdologie, Sozialarbeit, Medizin, Journalismus)

### Zeitplan

| Phase | Wann | Was |
|---|---|---|
| Vorbereitung | 6–8 Wochen vor dem Start | Accounts auf Instagram, TikTok und YouTube Shorts unter „@piraziman“. 15–20 Videos vorproduzieren. 12+ Tester/innen für den Google-Test sammeln. Inhalte gegenlesen lassen. |
| Warteliste | 4 Wochen vorher | Website mit „Bald im App Store“ und E-Mail- oder WhatsApp-Kanal. Kurdische Vereine, Studierendengruppen und Moscheegemeinden bzw. alevitische und ezidische Gemeinden anschreiben. |
| **Start an Newroz** | **21. März** | Das kurdische Neujahr ist der stärkste Anlass im Jahr. Store-Start, Video „Newroz pîroz be – lerne jetzt Kurmancî“, alle Partner teilen gleichzeitig. |
| Wachstum | ab dann laufend | 3–5 Kurzvideos pro Woche, Mitmach-Challenges, Kooperationen, Store-Eintrag nach Daten verbessern |

### Inhalte für Social Media (Kurzvideo, 15–40 Sekunden)

- **„Wort des Tages“** mit Bildschirmaufnahme aus der App, Aussprache und einem Beispielsatz. Funktioniert jeden Tag.
- **„So sagt man das in Amed“:** Standard gegen Dialekt (Material steckt in jeder Lektion). Sorgt für Diskussionen in den Kommentaren, und die bringen Reichweite.
- **„Sprichwort der Woche“** (Gotina pêşiyan) mit Bedeutung. Wird gern geteilt.
- **Familien-Challenge:** „Lass deine Mutter / deinen Vater dieses Wort aussprechen“, mit Duett und Stitch. Die besten Videos kommen von der Community selbst.
- **Fehler, die Deutsche machen** (z. B. ê und e, x und h). Lustig und lehrreich.
- **Fortschritt teilen:** Screenshot der Brücke oder des Rangs „Dengbêj“ mit `#piraziman`.
- **Kurdische Feiertage und Musik:** Newroz, Hochzeiten, Dengbêj-Gesang mit Vokabeln aus den Texten.

Format: Untertitel auf Deutsch und Kurmancî, das App-Symbol im Bild und am Ende „Kostenlos im App Store und bei Google Play“. Die beste Postzeit lässt sich nach 2–3 Wochen in der Statistik der Plattformen ablesen.

### Partner und Kanäle ohne Budget

- Kurdische Kulturvereine und Dachverbände (Newsletter, Veranstaltungen, Flyer mit QR-Code)
- Herkunftssprachenunterricht Kurdisch an Schulen: Lehrkräfte direkt ansprechen, die App als kostenloses Übungsmaterial anbieten
- Kurdologie an Universitäten
- Kurdische Creator/innen auf TikTok und Instagram: Kooperation gegen Erwähnung in der App unter „Danke“, oder mit Spendenanteil, sobald es welche gibt. Kooperationen immer als Werbung kennzeichnen.
- Facebook- und Telegram-Gruppen, Reddit r/kurdish
- Lokale Presse und kurdische Medien: „Junge Frau aus [Stadt] baut kostenlose Kurdisch-App“ ist eine gute Geschichte

### App-Store-Optimierung (ASO)

- **Name und Untertitel** enthalten die Suchbegriffe „Kurdisch“, „lernen“ und „Kurmancî“ (Texte in `docs/STORE.md`).
- **Screenshots:** Der erste zeigt den Nutzen in einem Satz („Kurdisch lernen, von A1 bis C2“). Danach kommen Lektion, Aussprache-Trainer, Gamifizierung sowie „Offline & werbefrei“. Mit großer Schrift und Flaggenfarben.
- **Bewertungen** sind der wichtigste Faktor. Später in der App nach einer geschafften Lektion um eine Bewertung bitten, mit dem offiziellen Bewertungsdialog. Den kann ich einbauen, sobald die App im Store ist. Auf jede Bewertung antworten, vor allem auf kritische.
- **Promotional Text (Apple)** kannst du jederzeit ohne neue Prüfung ändern, z. B. „Neu zu Newroz: …“.
- **In-App-Events (Apple) und LiveOps (Google)** für Newroz oder eine „30-Tage-Sprachchallenge“ bringen zusätzliche Sichtbarkeit in den Stores.
- Monatlich in App Store Connect bzw. der Play Console nachsehen, über welche Suchbegriffe Leute kommen, und die Schlüsselwörter anpassen.

### Messen, ob es wirkt (ohne Tracking in der App)

- Downloads, Seitenaufrufe im Store und Konversionsrate liefern die Stores selbst.
- Für Social Media eigene Links pro Kanal (Apple: Kampagnen-Links mit `ct=tiktok`; Google: UTM-Parameter). Dann siehst du, welcher Kanal Downloads bringt, ohne dass die App etwas misst.
- Ziel für die ersten 3 Monate, als Orientierung: 1.000 Downloads, Bewertung über 4,5, 3 Partnervereine.
