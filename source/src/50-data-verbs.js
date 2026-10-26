/* ===== verbs, proverbs, method ===== */
PZ.verbs = [
  { inf: 'bûn', de: 'werden; sein (Vergangenheit)', pr: 'b', pa: 'bû', tr: 0, core: 1, note: '„sein“ im Präsens: Kopula -im/-î/-e (ez baş im)' },
  { inf: 'hatin', de: 'kommen', pr: 'ê', pa: 'hat', tr: 0, core: 1, prs: ['têm', 'têyî', 'tê', 'tên', 'tên', 'tên'], negs: ['nayêm', 'nayî', 'nayê', 'nayên', 'nayên', 'nayên'], sb: 'bê', imp: ['were', 'werin'] },
  { inf: 'çûn', de: 'gehen', pr: 'ç', pa: 'çû', tr: 0, core: 1, imp: ['here', 'herin'], note: 'Imperativ meist here!/herin!, daneben biçe!' },
  { inf: 'kirin', de: 'machen, tun', pr: 'k', pa: 'kir', tr: 1, core: 1 },
  { inf: 'xwarin', de: 'essen', pr: 'xw', pa: 'xwar', tr: 1, core: 1 },
  { inf: 'vexwarin', de: 'trinken', pv: 've', pr: 'xw', pa: 'xwar', tr: 1, core: 1 },
  { inf: 'gotin', de: 'sagen', pr: 'bêj', pa: 'got', tr: 1, core: 1, sb: 'bêj', note: 'Subjunktiv bêjim, auch bibêjim' },
  { inf: 'dan', de: 'geben', pr: 'd', pa: 'da', tr: 1, core: 1 },
  { inf: 'dîtin', de: 'sehen, finden', pr: 'bîn', pa: 'dît', tr: 1, core: 1 },
  { inf: 'zanîn', de: 'wissen', pr: 'zan', pa: 'zanî', tr: 1, core: 1, ng: 'ni' },
  { inf: 'karîn', de: 'können', pr: 'kar', pa: 'karî', tr: 1, core: 1, ng: 'ni', noImp: 1 },
  { inf: 'xwestin', de: 'wollen, möchten', pr: 'xwaz', pa: 'xwest', tr: 1, core: 1 },
  { inf: 'anîn', de: 'bringen', pr: 'în', pa: 'anî', tr: 1, core: 1, prs: ['tînim', 'tînî', 'tîne', 'tînin', 'tînin', 'tînin'], noNeg: 1, sb: 'bîn' },
  { inf: 'birin', de: 'wegbringen, mitnehmen', pr: 'b', pa: 'bir', tr: 1 },
  { inf: 'xwendin', de: 'lesen, studieren', pr: 'xwîn', pa: 'xwend', tr: 1, core: 1 },
  { inf: 'nivîsîn', de: 'schreiben', pr: 'nivîs', pa: 'nivîsî', tr: 1, core: 1 },
  { inf: 'girtin', de: 'nehmen, fassen, schließen', pr: 'gir', pa: 'girt', tr: 1 },
  { inf: 'kirîn', de: 'kaufen', pr: 'kir', pa: 'kirî', tr: 1, core: 1 },
  { inf: 'firotin', de: 'verkaufen', pr: 'firoş', pa: 'firot', tr: 1 },
  { inf: 'bihîstin', de: 'hören', pr: 'bihîz', pa: 'bihîst', tr: 1 },
  { inf: 'hiştin', de: 'lassen, zurücklassen', pr: 'hêl', pa: 'hişt', tr: 1 },
  { inf: 'şandin', de: 'schicken', pr: 'şîn', pa: 'şand', tr: 1 },
  { inf: 'şuştin', de: 'waschen', pr: 'şo', pa: 'şûşt', tr: 1 },
  { inf: 'pirsîn', de: 'fragen', pr: 'pirs', pa: 'pirsî', tr: 1 },
  { inf: 'avêtin', de: 'werfen', pr: 'avêj', pa: 'avêt', tr: 1 },
  { inf: 'vekirin', de: 'öffnen', pv: 've', pr: 'k', pa: 'kir', tr: 1 },
  { inf: 'hilgirtin', de: 'aufheben, tragen', pv: 'hil', pr: 'gir', pa: 'girt', tr: 1 },
  { inf: 'çêkirin', de: 'herstellen, reparieren, zubereiten', pv: 'çê', pr: 'k', pa: 'kir', tr: 1 },
  { inf: 'man', de: 'bleiben', pr: 'mîn', pa: 'ma', tr: 0, core: 1 },
  { inf: 'ketin', de: 'fallen, hineingeraten', pr: 'kev', pa: 'ket', tr: 0 },
  { inf: 'derketin', de: 'hinausgehen', pv: 'der', pr: 'kev', pa: 'ket', tr: 0 },
  { inf: 'rabûn', de: 'aufstehen', pv: 'ra', pr: 'b', pa: 'bû', tr: 0, core: 1 },
  { inf: 'rûniştin', de: 'sich setzen; wohnen', pv: 'rû', pr: 'n', pa: 'nişt', tr: 0 },
  { inf: 'razan', de: 'schlafen', pv: 'ra', pr: 'z', pa: 'za', tr: 0 },
  { inf: 'jiyan', de: 'leben', pr: 'jî', pa: 'jiya', tr: 0 },
  { inf: 'mirin', de: 'sterben', pr: 'mir', pa: 'mir', tr: 0 },
  { inf: 'meşîn', de: 'zu Fuß gehen', pr: 'meş', pa: 'meşî', tr: 0 },
  { inf: 'sekinîn', de: 'stehen bleiben, warten', pr: 'sekin', pa: 'sekinî', tr: 0 },
  { inf: 'peyivîn', de: 'sprechen', pr: 'peyiv', pa: 'peyivî', tr: 0 },
  { inf: 'kenîn', de: 'lachen', pr: 'ken', pa: 'kenî', tr: 0 },
  { inf: 'girîn', de: 'weinen', pr: 'girî', pa: 'girî', tr: 0 },
  { inf: 'gihîştin', de: 'ankommen, erreichen', pr: 'gihîj', pa: 'gihîşt', tr: 0 },
  { inf: 'xebitîn', de: 'arbeiten', pr: 'xebit', pa: 'xebitî', tr: 0, core: 1 },
  { inf: 'zewicîn', de: 'heiraten', pr: 'zewic', pa: 'zewicî', tr: 0 },
  { inf: 'fikirîn', de: 'denken, nachdenken', pr: 'fikir', pa: 'fikirî', tr: 0 },
  { inf: 'bezîn', de: 'rennen', pr: 'bez', pa: 'bezî', tr: 0 },
  { inf: 'lîstin', de: 'spielen', pr: 'lîz', pa: 'lîst', tr: 0 },
  { inf: 'barîn', de: 'regnen, (Niederschlag) fallen', pr: 'bar', pa: 'barî', tr: 0, noDrill: 1 },
  { inf: 'guherîn', de: 'sich verändern', pr: 'guher', pa: 'guherî', tr: 0 },
  { inf: 'vegerîn', de: 'zurückkehren', pv: 've', pr: 'ger', pa: 'geriya', tr: 0 },
  { inf: 'wergirtin', de: 'übernehmen, erhalten', pv: 'wer', pr: 'gir', pa: 'girt', tr: 1 },
  { inf: 'xistin', de: 'schlagen; fallen lassen', pr: 'x', pa: 'xist', tr: 1 },
  { inf: 'temaşe kirin', de: 'anschauen', lvn: 'temaşe', base: 'kirin' },
  { inf: 'guhdarî kirin', de: 'zuhören', lvn: 'guhdarî', base: 'kirin' },
  { inf: 'xeber dan', de: 'sprechen, reden (in Amed sehr üblich)', lvn: 'xeber', base: 'dan', core: 1 },
  { inf: 'hez kirin', de: 'lieben, mögen (ji … hez kirin)', lvn: 'hez', base: 'kirin', core: 1 },
  { inf: 'fêr bûn', de: 'lernen', lvn: 'fêr', base: 'bûn', core: 1 },
  { inf: 'hîn bûn', de: 'lernen; sich gewöhnen', lvn: 'hîn', base: 'bûn' },
  { inf: 'dest pê kirin', de: 'anfangen', lvn: 'dest pê', base: 'kirin' },
  { inf: 'alîkarî kirin', de: 'helfen', lvn: 'alîkarî', base: 'kirin' },
  { inf: 'telefon kirin', de: 'anrufen', lvn: 'telefon', base: 'kirin' },
  { inf: 'bawer kirin', de: 'glauben', lvn: 'bawer', base: 'kirin' },
  { inf: 'ji bîr kirin', de: 'vergessen', lvn: 'ji bîr', base: 'kirin' }
];

PZ.proverbs = [
  ['Dilop bi dilop dibe gol.', 'Tropfen für Tropfen wird es ein See.', 'Das Motto für jeden Lerntag.'],
  ['Zimanê şîrîn mar ji qulê derdixe.', 'Eine süße Zunge lockt die Schlange aus dem Loch.', 'Freundliche Worte erreichen mehr als harte.'],
  ['Mêvan mêvanê Xwedê ye.', 'Der Gast ist Gottes Gast.', 'Gastfreundschaft ist in Amed und Êlih Ehrensache.'],
  ['Bi destekî çepik nayê lêdan.', 'Mit einer Hand kann man nicht klatschen.', 'Zusammen geht es besser.'],
  ['Mirov bi mirovan mirov e.', 'Der Mensch ist Mensch durch die Menschen.', ''],
  ['Av di bin kayê re diçe.', 'Das Wasser fließt unter dem Stroh hindurch.', 'Etwas geschieht heimlich.'],
  ['Kevir li cihê xwe giran e.', 'Der Stein ist an seinem eigenen Platz schwer.', 'Man hat Gewicht dort, wo man hingehört.'],
  ['Ne her tiştê ku dibiriqe zêr e.', 'Nicht alles, was glänzt, ist Gold.', '']
];

PZ.method = `
<section class="grid2">
  <div class="card stack"><div class="eyebrow">1 · Dubare</div><h3>Verteilte Wiederholung</h3><p>Das Gedächtnis vergisst nach einer Kurve. Wer ein Wort genau dann wiederholt, wenn es zu verblassen beginnt, braucht nur wenige Wiederholungen, bis es sitzt. Der Kartenstapel plant das für dich: zuerst nach einem Tag, dann nach 4, 10, 25 Tagen und so weiter.</p><p class="muted">So nutzt du es: Jeden Tag zuerst die fälligen Karten, dann Neues. Sei ehrlich bei „Nochmal“, sonst lernst du dich selbst an.</p></div>
  <div class="card stack"><div class="eyebrow">2 · Abrufen</div><h3>Aktives Erinnern</h3><p>Wiedererkennen ist leicht, aus dem Kopf holen ist Lernen. Deshalb musst du in den Übungen Sätze bauen und Wörter tippen, statt nur zu lesen. Schalte bei den Karteikarten „Antwort tippen“ ein, wenn du schneller vorankommen willst.</p></div>
  <div class="card stack"><div class="eyebrow">3 · Input</div><h3>Verständlicher Input</h3><p>Sprachen wachsen vor allem durch viel Hören und Lesen von Material, das du zu etwa 90 % verstehst. Die Lesetexte sind gestuft. Ab A2: täglich etwas hören, zum Beispiel Lieder von Dengbêjs, Kinderserien oder Gespräche in der Familie.</p></div>
  <div class="card stack"><div class="eyebrow">4 · Aussprache</div><h3>Shadowing und Aufnahme</h3><p>Sprich Sätze direkt nach dem Vorbild nach, als würdest du jemanden imitieren. Achte auf Rhythmus und auf die Laute x, q, ê und das dumpfe i. Nimm dich im Aussprache-Trainer auf und vergleiche: Wer sich selbst hört, korrigiert sich schneller. Wer laut übt, spricht später flüssiger, weil Mund und Ohr mitlernen.</p></div>
  <div class="card stack"><div class="eyebrow">5 · Chunks</div><h3>Ganze Wendungen lernen</h3><p>Muttersprachler denken in Bausteinen: <span class="ku">Tu çawa yî?</span>, <span class="ku">Ez nizanim.</span>, <span class="ku">Ji kerema xwe.</span> Lerne solche Wendungen als ein Stück. Die Grammatik dahinter verstehst du später von selbst.</p></div>
  <div class="card stack"><div class="eyebrow">6 · Eselsbrücken</div><h3>Verwandte Wörter nutzen</h3><p>Kurmancî ist eine indoeuropäische Sprache, also entfernt mit dem Deutschen verwandt: <span class="ku">nav</span> (Name), <span class="ku">nû</span> (neu), <span class="ku">bira</span> (Bruder), <span class="ku">stêrk</span> (Stern), <span class="ku">mişk</span> (Maus), <span class="ku">germ</span> (warm), <span class="ku">neh</span> (neun), <span class="ku">tu</span> (du). Bei Lernkarten stehen solche Brücken in Blau.</p></div>
  <div class="card stack"><div class="eyebrow">7 · Mischen</div><h3>Interleaving</h3><p>Übungstypen und Wörter kommen gemischt, nicht in Blöcken. Das fühlt sich schwerer an, verankert aber besser, weil dein Kopf jedes Mal neu entscheiden muss, welche Regel gilt.</p></div>
  <div class="card stack"><div class="eyebrow">8 · Fehler</div><h3>Fehler sind Futter</h3><p>Was du falsch beantwortest, kommt am Ende der Lektion noch einmal und landet heute schon im Kartenstapel. Ein Fehler, den du korrigierst, bleibt besser hängen als eine Antwort, die du zufällig richtig hattest.</p></div>
</section>
<section class="card stack"><h2>Dein Wochenplan</h2>
  <div class="tbl"><table><thead><tr><th>Niveau</th><th>Täglich</th><th>Zusätzlich pro Woche</th></tr></thead><tbody>
    <tr><td><b>A1–A2</b></td><td>10 min Karteikarten, 1 neue Lektion (15 min)</td><td>2 Lesetexte, 5 Lieder bewusst anhören, 1 Gespräch: „Ev bi kurmancî çi ye?“</td></tr>
    <tr><td><b>B1</b></td><td>10 min Karten, 1 Lektion oder Verbtraining, 10 min Hören</td><td>3 Texte, ein kurzer Tagebucheintrag auf Kurmancî, 1 Telefonat mit Verwandten</td></tr>
    <tr><td><b>B2</b></td><td>10 min Karten, 20 min echte Inhalte (Nachrichten, Videos)</td><td>Texte schreiben und korrigieren lassen, Sprichwörter sammeln</td></tr>
    <tr><td><b>C1</b></td><td>30+ min Kurmancî-Medien, Wortschatz aus Texten in den Stapel</td><td>Literatur lesen, Dengbêj-Lieder transkribieren, Diskussionen führen</td></tr>
    <tr><td><b>C2</b></td><td>Den Alltag teilweise auf Kurmancî leben: Selbstgespräche, Nachrichten, Telefonate; 5 min Shadowing</td><td>Dialekte gezielt anhören, klassische Verse auswendig lernen, eigene Texte schreiben und korrigieren lassen</td></tr>
  </tbody></table></div>
  <p class="muted">Ehrlich gesagt: C1 oder C2 erreicht niemand allein mit einer App. Rechne mit vielen hundert bis über tausend Stunden. Pira Ziman gibt dir das Gerüst: Grammatik, Wortschatz und Aussprache. Der Weg zur Meisterschaft führt über viel echtes Kurmancî: Menschen, Musik, Bücher.</p>
</section>
<section class="card stack"><h2>Sätze, die dir überall helfen</h2>
  <div class="list">
    <div class="it"><span class="k">Ev bi kurmancî çi ye?</span><span>Was heißt das auf Kurmancî?</span></div>
    <div class="it"><span class="k">Hêdî hêdî xeber bide, ji kerema xwe.</span><span>Sprich bitte langsam.</span></div>
    <div class="it"><span class="k">Careke din bêje.</span><span>Sag es noch einmal.</span></div>
    <div class="it"><span class="k">Min fêm nekir.</span><span>Ich habe es nicht verstanden.</span></div>
    <div class="it"><span class="k">Ez nû fêrî kurmancî dibim.</span><span>Ich lerne gerade erst Kurmancî.</span></div>
    <div class="it"><span class="k">Rast e? / Wisa tê gotin?</span><span>Ist das richtig? / Sagt man das so?</span></div>
  </div>
</section>
<section class="card stack"><h2>Weiterführend</h2>
  <ul class="theory" style="padding-left:20px">
    <li><a href="https://ku.wiktionary.org" target="_blank" rel="noopener">Wîkîferheng</a>: großes einsprachiges und mehrsprachiges Kurmancî-Wörterbuch.</li>
    <li><a href="https://ku.wikipedia.org" target="_blank" rel="noopener">Wîkîpediya bi kurmancî</a>: Lesestoff zu jedem Thema, ideal ab B1.</li>
    <li><a href="http://kurdish.humanities.manchester.ac.uk/" target="_blank" rel="noopener">The Dialects of Kurdish</a> (Universität Manchester): Tonaufnahmen und Daten aus vielen Orten, auch aus der Region Amed und Êlih.</li>
    <li>W. M. Thackston: <i>Kurmanji Kurdish – A Reference Grammar with Selected Readings</i> (Harvard), eine frei verfügbare Referenzgrammatik.</li>
    <li>Dengbêj-Gesang: Suche nach „dengbêj“ und „Mala Dengbêjan Amed“. Die Erzähllieder sind anspruchsvoller Hörinput für B2–C1.</li>
  </ul>
</section>`;
