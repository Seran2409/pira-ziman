# Impressum, Datenschutz und Nutzungsbedingungen ausfüllen

Die Texte liegen in `source/site/` und werden mit `py tools/build_pages.py` (im Ordner `source/`) auf die Website und in die App übernommen. **Diese Vorlagen ersetzen keine Rechtsberatung.** Vor dem Store-Start lohnt sich ein kurzer Check, z. B. durch eine Anwältin für IT-Recht oder einen Generator wie den von e-recht24 oder der IT-Recht Kanzlei.

## Welche Variante passt?

| | Privatperson (kostenlose App, keine Einnahmen) | Kleinunternehmerin (Gewerbe, § 19 UStG) |
|---|---|---|
| Wann | jetzt, solange die App nichts einbringt | sobald du regelmäßig Geld einnimmst, z. B. Förderungen, Workshops oder später eine Premium-Version |
| Impressum | Name, ladungsfähige Anschrift, E-Mail | zusätzlich Hinweis auf § 19 UStG (Block in `impressum.html` auskommentiert), ggf. Wirtschafts-Identifikationsnummer |
| App Store (EU) | „kein Händler“ → Adresse wird im Store nicht gezeigt | „Händler“ → Adresse, Telefon und E-Mail stehen öffentlich im Store |
| Google Play | privates Konto, Kontaktdaten laut Google-Vorgaben | Organisationskonto möglich (braucht D-U-N-S-Nummer) |

**Ist ein Impressum für eine private, kostenlose App Pflicht?** Nach § 5 DDG müssen „geschäftsmäßige“ digitale Dienste ein Impressum haben, die meist gegen Entgelt angeboten werden. Bei einer rein privaten, kostenlosen App ist das umstritten. Weil die App aber öffentlich in Stores steht und Spenden geplant sind, ist ein Impressum die sichere Wahl.

## Deine Adresse schützen

Ins Impressum gehört eine **ladungsfähige Anschrift**, ein Postfach reicht nicht. Wenn du deine Wohnadresse nicht veröffentlichen willst:

- **Impressums-Service / Geschäftsadresse:** Anbieter stellen gegen eine Monatsgebühr eine ladungsfähige Adresse mit Postweiterleitung bereit.
- **Coworking-Space:** Manche bieten eine Geschäftsadresse an.
- Eine Telefonnummer ist nicht zwingend, wenn du auf E-Mails schnell antwortest (in der Regel innerhalb von 60 Minuten bis zu einem Tag, die Rechtsprechung ist hier nicht ganz einheitlich). Ein Kontaktformular oder eine zweite Kontaktmöglichkeit ist trotzdem empfehlenswert.

## Checkliste

- [ ] In allen drei Dateien `[Vorname Nachname]`, `[Straße Hausnummer]`, `[PLZ Ort]`, `[kontakt@beispiel.de]` und `[Monat Jahr]` ersetzen
- [ ] Eigene E-Mail-Adresse nur für die App anlegen (z. B. `hallo@…` oder ein eigenes Postfach)
- [ ] Bei Gewerbe: den § 19-Block in `impressum.html` einkommentieren
- [ ] Falls ein Spendenlink kommt: in `datenschutz.html` einen Abschnitt zum Zahlungsdienst ergänzen (z. B. Ko-fi oder PayPal: wer verarbeitet welche Daten, mit Link zu deren Datenschutzerklärung)
- [ ] `py tools/build_pages.py`, dann prüfen, dass die Seiten unter `…/pira-ziman/impressum.html` usw. erreichbar sind
- [ ] Die URLs in App Store Connect und in der Play Console eintragen
