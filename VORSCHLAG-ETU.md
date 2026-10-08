# Vorschlag: Verbesserungen für ERP-Lite nach Vorbild ETU (Hottgenroth AVA/Kaufmann)

Stand 08.10.2026, Fassung 2: Alle Aussagen wurden noch einmal im Code geprüft. Grundlage sind 5 Screenshots aus ETU: Angebot Seite 1/2 und 2/2, Druckeinstellungen, Hauptfenster mit dem Reiter „Fußdaten“ und der Dialog „Gesamtkalkulation“. Jede Funktion wurde mit `index.html` verglichen. Geändert ist noch nichts, das hier ist nur der Vorschlag. Zeilenangaben (Z.) beziehen sich auf den Stand von Commit 243c69a.

---

## 1. Kurzfazit

In vier Bereichen ist ETU deutlich weiter:
- **Belegdarstellung je Belegart:** fein einstellbar. Dazu gehören die Zusammenfassung der Titel, der Lohnkostennachweis, wählbare Spalten samt Reihenfolge und abschaltbare Preise und Summen.
- **Briefbild:** Logo mittig, eine Fußzeile mit Beschriftungen, ein eigener Text für vorgedrucktes Briefpapier.
- **Gesamtkalkulation:** Alle Preise lassen sich auf einmal neu kalkulieren. Der „Aufschlag neu“ geht in % oder €, angezeigt werden DB je Lohnstunde und DB gesamt.
- **Persönliche Anrede und Navigationshilfen:** Dokumentenübersicht, „Zuletzt …“, Suche, Statuszeile.

Vieles kann ERP-Lite schon gleich gut oder besser:
- Gruppenpreis und ausgeblendete Einzelpreise je Gruppe
- Spalten Lohn/Sonstiges und der Schalter für Langtexte
- Fußzeile mit Seitenzahl
- PDF ohne Bibliothek
- Live-Vorschau, in der man direkt im Blatt bearbeiten kann
- Rückgängig über mehrere Schritte
- DB-II-Ampel mit Vor- und Nachkalkulation
- K3-Mittellohn nach ÖNORM B 2061
- Einlesen von Belegen (E-Rechnung, PDF, Texterkennung)

Beim Vergleich sind Fehler aufgefallen, die unabhängig von ETU behoben werden sollten. Der erste ist dringend:
- **Seit dem letzten Commit (243c69a)** öffnet „✎ Kundendaten bearbeiten“ im Beleg eine neue Kostenposition, und „Löschen“ im Kontakt tut nichts. Ursache: Die Aktionen `kedit` und `kdel` sind im Objekt `ACT` doppelt angelegt.
- **Strg+P** kann einen alten Beleg drucken, auch den eines anderen Kunden. LV-Ausdrucke haben die Firmenfußzeile nur, wenn vorher ein Beleg gedruckt wurde.
- **Nachdrucke festgeschriebener Belege** zeigen geänderte Firmendaten, den aktuellen Bearbeiter und die aktuelle Unterschrift. Ein geänderter Steuersatz verändert sogar alte Rechnungen samt FiBu und UVA, weil `journal()` die Buchungen über `fibuAuto()` → `summen()` jedes Mal neu ableitet.
- **Positionen in Options- oder Alternativgruppen** werden in Folgebelege übernommen und vom Lager abgebucht.

IDS-Connect ist ohne Server nicht sinnvoll machbar. Ein Datanorm-Import geht dagegen auch ohne Server.

---

## 2. Prinzip „umschaltbar und rückgängig“

1. **Ein Ort für alle Schalter:** Einstellungen → neue Karte **„Erweiterungen“**.
   - **Funktionsschalter** liegen in `S().erw.<name>`. Die Vorgaben stehen in der Konstante `ERW_STD`, gelesen wird über `erw(k)=S().erw?.[k]??ERW_STD[k]`.
   - **Darstellungsoptionen (Druckprofil, einschließlich der Texte)** liegen getrennt davon in `S().druckprofil.<Belegart>.<name>`, die Vorgaben in `DRUCK_STD`. Je Beleg gibt es Abweichungen in `b.druck` und einen Schnappschuss in `b.druckFix` (siehe 3.).
   - **Werte, die keine Schalter sind** (z. B. die DEL-Notiz), bekommen eigene Einstellungen (`S().metall`). So löscht „Alle Schalter auf Standard“ keine Inhalte.
   - In `neueDB().settings` kommen `erw:{}` und `druckprofil:{}` dazu. `migrate()` ergänzt fehlende `settings`-Schlüssel schon automatisch (Schleife über `n.settings`). Unterschlüssel werden immer mit Fallback gelesen.
   - **Bedienung:**
     - Ja/Nein-Werte werden Checkboxen. `case's'` liefert bei Checkboxen schon `true`/`false`.
     - Bei einem `<select>` mit Ja/Nein kommt der Wert als Text an, und `'false'` wäre in `erw()` wahr; deshalb gibt es für `ltDruck` heute schon eine Sonderbehandlung (Z. 3824). Für solche Felder wertet der Pfad-Setter ein Attribut `data-t="b"` aus.
     - Der Pfad-Setter in `case's'` kann Punkt-Pfade schreiben, legt aber keine fehlenden Zwischenobjekte an. Er wird um `o=o[k]??={}` ergänzt.
     - `formDialog()` bekommt gesperrte Felder (`dis:true`).
   - **Zurücksetzen:**
     - Je Paket gibt es „Standard wiederherstellen“ (`delete` der Schlüssel des Pakets).
     - Oben stehen „Alle Schalter auf Standard“ (`S().erw={}`; Profile und Texte bleiben) und eine Anzeige, welche Schalter vom Standard abweichen.
     - Das Druckprofil wird je Belegart zurückgesetzt, mit Rückfrage, weil es Texte enthält.
2. **Der Standard entspricht dem bisherigen Verhalten.** Ausnahmen gibt es nur bei eindeutigem Nutzen: Fehlerbehebungen und reine Bedienhilfen, die keinen Beleg verändern. Jede Ausnahme ist im Paket begründet.
3. **Ein Objekt für Abweichungen, ein eigenes Feld für den Schnappschuss:**
   - Alle Darstellungsoptionen eines Belegs hängen an `b.druck` und nicht an Einzelfeldern wie `b.peDruck`. Dort stehen **nur Abweichungen** vom Profil der Belegart.
   - Beim Festschreiben wird der vollständige Stand **getrennt** in `b.druckFix` eingefroren und nur bei `b.fest` gelesen.
   - `ACT.reopen` (Belegarten in `REOPEN=['AN','AB','BE','PR']`) löscht `b.druckFix`. Danach gilt wieder das Profil mit den Abweichungen.
   - `duplizieren()`, `angebotRevision()` und `folge()` kopieren nur `b.druck`.
   - Für die eingefrorenen Firmen- und Steuerwerte `b.fix` aus P0 gilt dasselbe: Sie werden beim erneuten Festschreiben neu gesetzt und im Entwurf nicht gelesen.
   - Die vorhandenen Felder `b.ltDruck`, `b.optLS` und `b.optRabatt` bleiben, wie sie sind.
4. **Datenmodell nur ergänzend:**
   - Alle neuen Felder sind optional. Fehlen sie, gilt das alte Verhalten.
   - Bei ausgeschaltetem Schalter werden gespeicherte Felder ignoriert, aber nicht gelöscht. Weil `b.druck` nie überschrieben wird, stellt Wiedereinschalten alles wieder her.
   - Es gibt keine Umbenennungen im Datenmodell und keine Umrechnung bestehender Werte.
5. **Rückgängig auf vier Ebenen:**
   - **Schalter aus:** wirkt sofort und ohne Datenverlust.
   - **Strg+Z / `zurueck()`:** gilt für Datenaktionen. Jede Übernahme ist genau ein `persist()`-Schritt. `undoSperre()` schützt weiter Festschreiben und Nummernkreise.
   - **Dauerhafte Teil-Rücknahme bei Massenänderungen:** Eine Preisanpassung lässt sich über `b.kalkAlt` auch später noch zurücknehmen (siehe P10).
   - **Code:**
     - Ein Git-Commit je Paket, bei großen Paketen je Teilfunktion, mit deutscher Nachricht (z. B. „ETU P2: Zusammenfassung der Titel am Belegende“).
     - Zurückgenommen wird per `git revert <commit>`, abhängige Pakete zuerst (siehe „Abhängig von“).
     - Vor Beginn wird der Tag `vor-etu` gesetzt.
     - Gearbeitet wird auf einem Zweig `main-b4f5uz` (Pull Request #1), paketweise nach `main` übernommen, denn jeder Push auf `main` ist nach etwa einer Minute online.
     - Ausnahme: P0 a) behebt einen Fehler, der schon online ist, und geht nach dem Test sofort nach `main`.
6. **Rechtliche Sperren eingebaut:**
   - Bei Rechnungsarten (`RE_V`, also AR, TR, RE, SR, GS) erzwingt `dOpt()` immer Gesamtpreise und Summenblock. Das sind Entgelt, Steuersatz und Steuerbetrag nach § 11 Abs. 1 Z 3 lit. e/f UStG.
   - Einzelpreise darf man ausblenden, wie heute schon mit `ohneEP` je Gruppe.
   - Der Pflichtteil der Fußzeile (§ 14 UGB, eigene UID) bleibt fest.
   - Festgeschriebene Belege bleiben unveränderbar.
7. **Test je Paket** wie in CLAUDE.md beschrieben: „Nur im Browser testen“, Konsole auf Fehler prüfen, Rechenergebnisse nachrechnen. Zusätzlich:
   - Ein alter festgeschriebener Beleg wird vor und nach der Änderung nachgedruckt. Beide Ausdrucke müssen gleich sein.
   - Das PDF wird geprüft.
   - Druckpakete werden auch am Handy (Android, iOS) getestet.

**Legende:**
- Nutzen: hoch, mittel oder gering.
- Aufwand: S ≈ ½ Tag, M ≈ 1 Tag, L ≈ 3 Tage, jeweils mit Browsertest.
- `druck.x` ist eine Option im Druckprofil (`S().druckprofil.<Belegart>.x`, je Beleg `b.druck.x`).
- `erw.x` ist ein Funktionsschalter.

---

## 3. Pakete

### P0 – Fehlerkorrekturen und Nachdruck-Treue (unabhängig von ETU)
- **Ziel:** Bedienfehler und falsche Ausdrucke beseitigen. Ein Nachdruck soll dem Original entsprechen.
- **Heute:**
  - **Doppelte Aktionen (dringend):**
    - Commit 243c69a hat in `const ACT={…}` die Schlüssel `kedit` und `kdel` ein zweites Mal angelegt: Laufende Kosten in Z. 3770/3771, Kontakte in Z. 3749/3729. Der spätere Eintrag gewinnt.
    - „✎ Kundendaten bearbeiten“ im Beleg (Z. 1218) öffnet deshalb `kostenDialog(undefined)`, also eine neue Kostenposition.
    - „Löschen“ im Kontakt (Z. 1738) findet keine Kostenposition und tut nichts.
    - Weitere Doppelungen gibt es in `ACT`, `ACT_LV`, `ACT_LB` und `ACT_FB` nicht (geprüft).
  - **Druck:**
    - `drucken(b)` füllt `#print`, setzt die Klasse `#print.mb` und den Style `#pgfuss` (Firmenfußzeile per `@page`). Nichts davon wird zurückgesetzt.
    - `druckHTML()` (LV, K-Blätter) ersetzt nur den Inhalt. LV-Ausdrucke haben die Firmenfußzeile deshalb nur, wenn vorher ein Beleg gedruckt wurde.
    - Strg+P bzw. das Browsermenü druckt den zuletzt gedruckten Beleg.
  - **Nachdruck:** `docHTML()` liest auch bei festgeschriebenen Belegen aktuelle Werte:
    - `fussZeilen(f)`. Die Fußzeile wird an vier Stellen getrennt gebaut: `fusszeile(f)` in docHTML (Z. 3431), `vorschauSeiten()` (Z. 3502), `drucken()` (Z. 3529) und `pdfAusBeleg()` (Z. 3573).
    - den Bearbeiter `S().bearbeiter`, im Infoblock `f.mail` und `f.tel`, die Unterschrift `f.zeichner`/`f.zeichnerFkt` und `briefkopf(f)` (Logo, Slogan).
    - bei Bestellungen die Art.-Nr. über `artikel(p.artikelId)?.lieferanten` aus dem Artikelstamm.
  - **Steuersätze:** `summen()` rechnet mit dem aktuellen `steuerDef(code)`. `case'st'` sperrt bei verwendeten Codes nur die Änderung des Codes; Satz, Bezeichnung und Hinweis (z. B. der Reverse-Charge-Text) bleiben änderbar. Wer den Satz ändert, ändert USt und Brutto alter Rechnungen beim Nachdruck und über `fibuAuto()` auch FiBu und UVA.
  - **Rechnen:**
    - `onPos('einheit')` rechnet nur `ep` und `ek` um, nicht `epL`/`epS`.
    - `posArtikelPopup` setzt nur `p.ep`.
    - Bei `optLS` ist danach in beiden Fällen `p.ep ≠ epL+epS`.
  - **Optionen und Alternativen:** `lagerBeiFest()` (Z. 879) und `folge()` (Z. 922) prüfen `p.kz` statt `effKz()`. Positionen in Options- oder Alternativgruppen werden deshalb in Folgebelege übernommen und bei Lieferschein bzw. Rechnung vom Lager abgebucht.
  - **Doppelte Lieferanten-Art.-Nr.:** `artikelInPos()` hängt im Einkauf „Ihre Art.-Nr.: …“ an `p.text` an, `docHTML` druckt sie zusätzlich in Klammern. Bei Langtextdruck steht sie doppelt.
  - **Kleinere Lücken:**
    - `duplizieren()` übernimmt `optLS`, `optRabatt` und `ltDruck` nicht.
    - `ACT.kbel` übernimmt nur das Zahlungsziel, und `+k.zahlungsziel||S().zahlungsziel` macht aus 0 Tagen den Standardwert. Skonto fehlt.
  - **PDF-Tabellenkopf:** `pdfAusBeleg()` ordnet an zwei Stellen alles mit `closest('table.p thead')` dem Kopf zu: Flächen, Linien und Bilder sowie Text. Damit wird auch der Kopf der Optionen-Tabelle erfasst. Auf Folgeseiten der Haupttabelle (`s.off`) wird er verschoben um `y−thTop` gezeichnet und fehlt an seiner richtigen Stelle. Das ist aus dem Code gelesen und im Browser noch zu bestätigen.
  - **Summenblock:** Im Druck gilt für `.tot` `break-inside:avoid`. `vorschauSeiten()` teilt aber die Zeilen jeder Tabelle, und die Umbruchliste `brk` in `pdfAusBeleg` enthält `tbody>tr`. Vorschau und PDF können den Summenblock deshalb teilen, der Druck nicht.
  - **Firmenbuchgericht:** `fussZeilen()` druckt es nur, wenn `f.gericht` gesetzt ist. `FIRMA_TBH` (Z. 396) enthält kein `gericht`.
  - **Zweitausfertigungen** von Rechnungen tragen keinen Vermerk (kein Treffer für „Duplikat“).
- **Umsetzung** (jeder Buchstabe ein eigener Commit):
  - a) ✅ **Erledigt** (Commit 757b5ed, Namen `kpneu`/`kpedit`/`kpdel`). **Aktionen der Laufenden Kosten umbenennen** in `kkedit`/`kkdel`, in `ACT` und in `V.kosten` (Z. 1669, 1672, 1675, 1686). Vor jedem Commit kurz prüfen, dass keine Aktionsnamen doppelt vorkommen (`grep`). Test: Kundendaten im Beleg bearbeiten, Kontakt löschen, Kostenposition bearbeiten und löschen.
  - b) **Druckvorbereitung an einer Stelle:**
    - `druckVorbereiten(b)` wird aus `drucken()` ausgelagert. Es setzt papierCSS, `#print`, `.mb`, `#pgfuss` und den Titel bei jedem Druck neu.
    - `druckHTML()` leert `.mb` und `#pgfuss`.
    - Strg+P auf der Route `beleg`: `preventDefault()` im `keydown`-Handler, danach `drucken(curBeleg())`.
    - Druck über das Browsermenü: `beforeprint` füllt `#print` aus dem aktuellen Beleg, wenn `drucken()`/`druckHTML()` ihn nicht gerade befüllt haben (Merker `DRUCK`). Außerhalb der Route `beleg` wird `#print` geleert.
    - `#print` wird **nicht** in `afterprint` geleert, denn Android und iOS lösen `afterprint` je nach Browser sofort oder gar nicht aus, das gäbe leere Ausdrucke. Geleert wird beim nächsten Routenwechsel im `hashchange`-Handler.
    - Test am Desktop (Chrome, Edge, Firefox), unter Android und unter iOS.
  - c) **Nachdruck-Treue:**
    - `festschreiben()` speichert vor `b.fest=true` den Block `b.fix={fz,bearbeiter,name,mail,tel,zeichner,zeichnerFkt,steuer:[{code,satz,bez,hinweis}]}`. Das Logo wird wegen der Größe nicht gespeichert.
    - `docHTML` liest bei `b.fest&&b.fix` diese Werte, ohne Rückfall auf die aktuellen Einstellungen: `fx?fx.bearbeiter:S().bearbeiter`. Ein beim Festschreiben leerer Bearbeiter bleibt leer.
    - **Fußzeile aus einer Quelle:** `docHTML` schreibt die Zeilen (eingefroren bzw. mit Zusatz aus P5) als `data-fz` (JSON) an das `.ft`-Element.
      - `vorschauSeiten()` liest `bl.querySelector('.ft')?.dataset.fz`. Es hat keinen Beleg-Parameter und läuft über alle `.blatt`, auch über die LV-Vorschau.
      - `drucken()` liest aus dem gerade erzeugten HTML.
      - `pdfAusBeleg()` liest vor `box.querySelector('.ft')?.remove()`.
      - Die Signatur `fussZeilen(f,b)` wird dann nur noch in `docHTML` gebraucht.
    - Bei festgeschriebenen Bestellungen wird nur `p.lnr` bzw. `p.einkauf?.artNr` gedruckt, nicht der aktuelle Artikelstamm.
    - `summen()` und die Steuerhinweise in `docHTML` verwenden bei `b.fest` die Werte aus `b.fix.steuer`.
    - Alte Belege ohne `b.fix` bleiben wie bisher.
  - d) **Steuersätze schützen:** `case'st'` sperrt `satz`, `bez` und `hinweis` von Codes, die in festgeschriebenen Belegen verwendet werden, wie heute schon den Code. Dazu der Hinweis „Für einen neuen Satz einen neuen Code anlegen“. Das schützt auch FiBu und UVA alter Rechnungen, die nicht über `b.fix` laufen.
  - e) `duplizieren()` übernimmt `optLS`, `optRabatt` und `ltDruck`.
  - f) `ACT.kbel` ruft `konditionenUebernehmen(b,k)` auf.
  - g) `onPos('einheit')` rechnet `epL` und `epS` mit demselben Faktor um. P13 ergänzt `ekL` und `zeit`.
  - h) `posArtikelPopup`: Bei `optLS` setzt Übernehmen `epS=r2(ep−(+p.epL||0))`.
  - i) `lagerBeiFest()` und `folge()` verwenden `effKz(p,gruppenInfo(b))` statt `p.kz`. Die Ausnahme AN→AB/PR in `folge()` bleibt. Ebenso der Hinweis in `festschreiben()` „Rechnung enthält Options-/Alternativpositionen“.
  - j) `artikelInPos()` schreibt die Lieferanten-Art.-Nr. künftig in `p.lnr` und nicht mehr in `p.text`. Alte Positionen bleiben unverändert; P4 kann die Zeile im Druck ausblenden.
  - k) `pdfAusBeleg()`: `const kopfH=box.querySelector('table.p thead')` wird einmal bestimmt. An beiden Stellen gilt dann `el.closest('thead')===kopfH` bzw. `pe.closest('thead')===kopfH`. Bekannte Einschränkung: Eine mehrseitige Optionen-Tabelle bekommt auf der Folgeseite keinen wiederholten Kopf.
  - l) **Nur `table.p` wird zeilenweise geteilt:** in `vorschauSeiten()` `c.matches('table.p')` statt `table`, in `brk` `table.p tbody>tr:not(.grpz)`. `.tot` und die neue Zusammenfassung (P2) bleiben in Vorschau und PDF ein Block, wie im Druck. Bei bestehenden Belegen ändert sich dadurch nur die Stelle eines Seitenumbruchs, wenn der Summenblock genau auf der Seitengrenze liegt; der Inhalt bleibt gleich.
  - m) **Pflichtangaben prüfen:** Hinweis in Einstellungen → Firma und vor dem Festschreiben von Rechnungen, wenn `f.gericht`, `f.fn` oder `f.uid` leer ist.
    - Das Firmenbuchgericht tragen Sie in den Einstellungen ein. Vermutlich ist es das LG Wiener Neustadt; bitte bestätigen.
    - Ein Eintrag in `FIRMA_TBH` ist nur optional. `migrate()` füllt leere Firmenfelder aus `FIRMA_TBH` und ändert damit auch Nachdrucke alter Belege ohne `b.fix`.
  - n) **Vermerk „DUPLIKAT“** (Schalter):
    - Der Zähler `b.ausgaben` zählt Druck, PDF und Versand festgeschriebener Belege der Arten `RE_V`. Bei alten Belegen zählt `b.versand.length` mit.
    - Er wird nach der Ausgabe per `commit()` erhöht.
    - Ab der zweiten Ausgabe fragt ein Dialog „Als DUPLIKAT kennzeichnen?“ (vorbelegt Ja). `docHTML` setzt den Vermerk dann über den Titel.
    - Das erste Original bleibt unverändert.
- **Schalter:**
  - `erw.strgP` = true und `erw.snapshot` = true. Beide beheben einen Fehler bzw. stellen die Nachdruck-Treue her.
  - `erw.duplikat` = false, Empfehlung: ein.
  - Alle anderen Punkte sind reine Fehlerbehebungen ohne Schalter und lassen sich je Commit per `git revert` zurücknehmen.
- **Datenmodell:** Beleg `fix` (wird beim Festschreiben gesetzt) und `ausgaben` (Zähler); Position `lnr` (gibt es schon). Alle Felder sind optional.
- **Nutzen** hoch · **Aufwand** M (die Einzelkorrekturen jeweils S oder kleiner) · **Abhängig von:** – · **Recht:**
  - DSGVO: kein fremder Beleg im Ausdruck.
  - Der Nachdruck entspricht danach weitgehend dem Original; das Logo wird nicht eingefroren. Maßgebliches Original im Sinn der BAO bleibt das versendete PDF, das `versenden()` schon heute unverändert über `anhaengeHochladen(…,true)` ablegt.
  - Unveränderbarkeit festgeschriebener Rechnungen samt Steuersatz: § 11 UStG, § 131 BAO.
  - Ohne Vermerk kann eine zweite gleichlautende Rechnung eine zusätzliche Steuerschuld kraft Rechnungslegung auslösen (§ 11 Abs. 12 bzw. 14 UStG). Deshalb ist der Vermerk „Duplikat“ üblich.
  - § 14 UGB verlangt das Firmenbuchgericht.

### P1 – Druckprofil je Belegart (Grundgerüst)
- **Ziel:** Ein zentraler Ort für Darstellungsoptionen, verschieden je Belegart, je Beleg änderbar und beim Festschreiben eingefroren.
- **ETU-Vorbild:** „Einstellungen: Druckvorschau Angebot“ mit den Reitern Drucker, Formular und Positionen; Knopf „Druckformat einstellen“ in der Vorschau.
- **Heute:** Es gibt nur einzelne Schalter: `b.ltDruck`/`S().ltDruck`, `b.optRabatt`, `b.optLS`, `p.ohneEP`/`p.pauschal` und das Papierformat `S().papier`. Alles andere ist fest in `docHTML()` eingebaut. `drucken()`, `pdfAusBeleg()` und `vorschauSeiten()` bauen auf `docHTML()` auf, eine Änderung dort wirkt also in Vorschau, Druck und PDF.
- **Umsetzung:**
  - `const DRUCK_STD={…}` steht neben `PAPIER`. Alle Werte entsprechen dem heutigen Aussehen. Die Schlüssel sind in P2–P5, P8, P9, P14–P17, P24, P25 und P28 aufgeführt.
  - `const dOpt=b=>{const o=b.fest?{...DRUCK_STD,...(b.druckFix||{})}:{...DRUCK_STD,...(erw('druckprofil')?{...(S().druckprofil?.[b.typ]||{}),...(b.druck||{})}:{})};if(RE_V.includes(b.typ)){o.preise=true;o.summen=true}return o}`. `docHTML(b)` liest es einmal als `const o=dOpt(b)`.
  - Festgeschriebene Belege ohne `druckFix`, also alle bisherigen, verwenden `DRUCK_STD` und sehen unverändert aus.
  - Unter „Erweiterungen“ kommt eine Unterkarte „Druck & Belegdarstellung“ mit der Wahl der Belegart und Feldern `data-f="druckprofil.<typ>.<schlüssel>"`. Dazu zwei Knöpfe:
    - „Standard wiederherstellen“ (`delete S().druckprofil[typ]`, mit Rückfrage);
    - „auf alle Rechnungsarten übertragen“, über `RE_V`, also einschließlich Gutschrift.
  - Im Beleg kommt ein Knopf „Druckoptionen …“ neben „Langtext drucken“; derselbe Knopf steht als „Druckformat …“ über der Vorschau.
    - Er öffnet `formDialog()` mit denselben Feldern und speichert nur Abweichungen in `b.druck`. „Wie Belegart“ löscht `b.druck`.
    - Bei `RE_V` sind „Preise“ und „Summen“ gesperrt (`dis:true`).
  - `festschreiben()` speichert vor `b.fest=true` den Schnappschuss `b.druckFix={...dOpt(b)}`. `b.druck` bleibt unverändert, auch wenn `erw.druckprofil` gerade aus ist; dann ist der Schnappschuss `DRUCK_STD`.
  - `ACT.reopen` löscht `b.druckFix`. `duplizieren()`, `angebotRevision()` und `folge()` kopieren nur `b.druck`.
- **Schalter:** `erw.druckprofil` = true. Das Grundgerüst allein ändert nichts am Aussehen. Mit false gilt für Entwürfe `DRUCK_STD`, festgeschriebene Belege drucken weiter mit ihrem Schnappschuss.
- **Datenmodell:** `S().druckprofil={AN:{…},…}`; Beleg `druck` und `druckFix` (beide optional).
- **Nutzen** hoch (Voraussetzung für viele Pakete) · **Aufwand** M · **Abhängig von:** – · **Recht:**
  - § 131 BAO.
  - Bei Rechnungen lassen sich Gesamtpreise und Summenblock (Entgelt, Steuersatz, Steuerbetrag) nicht abschalten (§ 11 Abs. 1 Z 3 lit. e/f UStG). Einzelpreise verlangt das Gesetz nicht.

### P2 – Zusammenfassung der Titel und Gruppensummen
- **Ziel:** Bei mehrseitigen Angeboten sieht der Kunde alle Gewerke-Summen auf einen Blick.
- **ETU-Vorbild:**
  - Bild 8: Tabelle „Zusammenfassung:“ (1 Heizung / 2 Elektro / 3 Dienstleistung, Spalte „Gesamt €“) vor dem Summenblock.
  - Bild 10: „Los/Gewerk/Titel: Summe am Anfang / Summe am Ende“.
- **Heute:**
  - Es gibt nur die Zeile `tr.gsum` „Summe 1 Heizung“ nach jeder Gruppe (`gruppenInfo().sumG`, `gruppePreis(g,gi)`).
  - Bei `p.pauschal`/`p.ohneEP` steht der Betrag schon im Gruppenkopf (`zeigP`).
  - Das Muster einer Zusammenfassung gibt es bereits im LV-Druck: `lvDocHTML(lv,'preise')` listet die LG-Summen in `table.tot`.
- **Umsetzung:**
  - In `docHTML` vor `<table class="tot">`: Ist `o.zus` aktiv und hat der Beleg mindestens 2 Gruppen, wird eine `<table class="zs">` ausgegeben.
    - Erste Zeile „Zusammenfassung | Gesamt €“, dann je Gruppe `pnr[g.id] | g.bez | fmt(gruppePreis(g,gi))`.
    - Positionen vor der ersten Gruppe erscheinen als „Positionen ohne Gruppe“.
    - Optionen und Alternativen (`effKz`) stehen nicht drin.
  - Kontrolle: Die Summe muss `s.netto` ergeben, sonst entfällt die Tabelle.
  - Die Tabelle bekommt bewusst keine Klasse `p`, damit im PDF kein Tabellenkopf wiederholt wird.
  - Vollständiges CSS, weil sonst die allgemeinen Regeln (Z. 97–99) greifen: `th` hellgrau hinterlegt, graue 12-px-Schrift, Rahmen. `pdfAusBeleg` würde den Hintergrund als graues Rechteck zeichnen. Deshalb:
    - `.doc table.zs{width:100%;margin:6mm 0 2mm;break-inside:avoid}`
    - `.doc table.zs th,.doc table.zs td{background:none;color:#000;font-size:9pt;border-bottom:1px solid #bbb;padding:3px 5px}`
  - Seitenumbruch: Nach P0 l) behandeln Vorschau und PDF die Tabelle als einen Block, wie der Druck.
  - `o.grpSumme`:
    - `'anfang'` setzt den Betrag in `tr.grpz` (wie bei `zeigP`);
    - `'beide'` zeigt ihn oben und unten;
    - `'aus'` ist nur zusammen mit der Zusammenfassung sinnvoll, sonst kommt ein Hinweis im Dialog.
  - `o.grpSumLbl` mit `{Nr}` und `{Bez}` (ETU-Form: „Summe {Bez}“).
- **Schalter:**
  - `druck.zus` = `'aus'`. Weitere Werte: `'auto'` (ab 2 Gruppen) und `'immer'`. Empfehlung: `'auto'` im Profil für AN, AB und SR.
  - `druck.grpSumme` = `'ende'`.
  - `druck.grpSumLbl` = `'Summe {Nr} {Bez}'`.
- **Datenmodell:** keines.
- **Nutzen** hoch · **Aufwand** S · **Abhängig von:** P1, P0 l) · **Recht:** –

### P3 – Schalter für Preise und Summen
- **Ziel:** Leistungsbeschreibung ohne Preise, Preisanfrage an Großhändler, Einheitspreisangebote, saubere Schlussrechnungen.
- **ETU-Vorbild:** „Preise und Summen drucken“, „Preise drucken“, „Summenblock nicht drucken“, „0 Menge drucken“ (bei ETU standardmäßig **aus**), „Einzelartikelpreise unterhalb eines Titels drucken“, „Striche anstatt Artikelpreise“; Summenblock mit eigener €-Spalte.
- **Heute:**
  - Ohne Preise gehen nur Lieferschein und Wareneingang (`OHNE_PREIS=['LS','WE']`).
  - `.tot` wird immer gedruckt.
  - Positionen mit Menge 0 werden immer gedruckt.
  - Einzelpreise lassen sich nur je Gruppe ausblenden.
  - Die Beschriftungen „Nettobetrag“, „zzgl. Umsatzsteuer“ und „Gesamtbetrag“ sind fest, das € steht direkt hinter dem Betrag.
- **Umsetzung:**
  - `o.preise`: `ohneP=OHNE_PREIS.includes(b.typ)||(o.preise===false&&!RE_V.includes(b.typ))`.
    - Das ist reine Darstellung, Summen und Editor bleiben gleich.
    - Die Zahlungsbedingungen entfallen dann.
    - Optional bei BE die Überschrift „PREISANFRAGE“ (`o.titel`).
  - `o.summen=false` lässt `.tot` samt Abzugszeilen weg, aber nur außerhalb von `RE_V`.
  - `o.nullMenge`:
    - `'aus'`: `zeile()` liefert '' für `!isInfo(p)&&!(+p.menge)`. Gruppen, deren Positionen alle 0 sind, entfallen samt Summe. Die Nummerierung bleibt mit Lücken erhalten, damit der Bezug zu Angebot und LV stimmt. Im Editor sind diese Positionen grau mit dem Hinweis „wird nicht gedruckt“.
    - `'ep'`: Menge „n. A.“, GP leer (Einheitspreis- und Regieangebote).
  - `o.epGrp=false` wirkt wie `ohneEP` auf alle Gruppen. Das ist auch bei Rechnungen zulässig.
  - `o.striche` setzt `<td class="n">–</td>` statt leerer Preiszellen.
  - `o.lblNetto`, `o.lblUSt` und `o.lblBrutto` ändern die Beschriftungen; Steuersatz und Steuerbetrag werden immer angehängt.
  - `o.euroSp` setzt das € in eine eigene Spalte.
- **Schalter:**
  - `druck.preise` true, `druck.summen` true.
  - `druck.nullMenge` `'zeigen'` (Empfehlung `'aus'` im Profil SR/RE, wie bei ETU).
  - `druck.epGrp` true, `druck.striche` false.
  - `druck.lblNetto`/`lblUSt`/`lblBrutto` wie bisher, `druck.euroSp` false.
- **Datenmodell:** keines.
- **Nutzen** mittel · **Aufwand** S · **Abhängig von:** P1 · **Recht:** Bei Rechnungsarten sind Gesamtpreise und Summenblock gesperrt (§ 11 Abs. 1 Z 3 lit. e/f UStG). Einzelpreise dürfen fehlen. Bei den Beschriftungen ist nur der Text änderbar.

### P4 – Spalten und Positionsdarstellung
- **ETU-Vorbild:**
  - Bild 10, „Anzeige Spalten“: Positionsnummer, Menge, Mengeneinheit, Artikelnummer, Leistung, Einzelpreis.
  - Bild 9, Spaltenfolge Position | Menge | ME | Leistung | Einzel-Preis € | Gesamt €; Menge rechtsbündig, ME linksbündig; Positionsnummern „1.1“.
  - „Kurztexte/Langtexte drucken“, „Langtextbreite erweitert“.
  - „Material und Lohn nebeneinander/untereinander/nicht ausweisen“.
  - „Rabatt je Position“ und „Aufschlag je Position“ mit Text.
  - „1. Warenkorb-Ebene fett“; Titel rot und unterstrichen.
- **Heute:**
  - Die Spalten haben eine feste Reihenfolge: Pos | Bezeichnung | Menge | Einheit | [Lohn | Sonstiges] | EP | [Rabatt %] | [USt] | GP. Menge und Einheit sind zentriert (`td.c`).
  - `ncol=4+…` (Z. 3441) setzt vier feste Spalten voraus. Positionen in Gruppen mit `ohneEP` oder Pauschalpreis haben fest `colspan=ncol-4` (Z. 3448). Text-, Gruppen- und Summenzeilen setzen eine Pos-Spalte voraus.
  - Die CSS-Regeln `th:nth-child(2)` und `tbody td:first-child` hängen an der Spaltenposition.
  - Positionsnummern sind „1.01“ (`posNummern()`, `padStart(2,'0')`).
  - Die Art.-Nr. steht nur grau in Klammern hinter dem Kurztext, im Einkauf als „(Ihre Art.-Nr. …)“.
  - `optLS` gibt es nur nebeneinander, Rabatt nur als Spalte (`showRab()`).
  - Jede Positionsbezeichnung ist fett, die Gruppenzeile `tr.grpz` schwarz und fett.
  - Einen Zuschlag kann man heute nur als negativen Rabatt eingeben. `posGP()` rechnet das richtig, gedruckt wird er aber als „−10 %“ in der Rabattspalte.
- **Umsetzung:**
  - **Feste Spalten zählen:**
    - `nfix` ist die Zahl der festen Spalten: Pos (optional), Art.-Nr. (optional), Bezeichnung, Menge (optional), Einheit (optional).
    - Dann gilt `ncol=nfix+…` und `colspan=ncol-nfix` statt der festen 4.
    - Text-, Gruppen- und Summenzeilen berücksichtigen `o.spPos`.
    - Die CSS-Regeln bekommen Klassen statt `nth-child`, z. B. `th.bz` und `td.pn`.
  - `o.artNr`:
    - `'spalte'`: eigene Spalte „Art.-Nr.“ nach Pos.
    - `'aus'`: keine eigene Art.-Nr. im Druck. Der Einkauf behält in jedem Fall die Lieferanten-Art.-Nr.
    - Bei `o.artNr!=='klammer'` entfernt der Druck bei alten Einkaufspositionen die Zeile `^Ihre Art.-Nr.:` aus dem Langtext. Neue Positionen haben sie nach P0 j) in `p.lnr`.
  - `o.spPos`, `o.spEinheit` und `o.spMenge` (Menge und Einheit gemeinsam). `spMenge` ist nur außerhalb von `RE_V` abschaltbar (§ 11 Abs. 1 Z 3 lit. c UStG). Die Spalte „Leistung“ lässt sich nicht abwählen, denn ohne Bezeichnung ist ein Beleg nicht prüfbar. Den Einzelpreis blendet `o.epGrp` aus P3 aus.
  - `o.spFolge`: `'std'` oder `'mengeVorn'` (Pos | Menge | ME | Bezeichnung | …, wie bei ETU).
  - `o.mengeAusr`: `'mitte'` (heute) oder `'rechts'` (Menge rechts, Einheit links, wie bei ETU).
  - `o.nrForm`: `'std'` (1.01) oder `'kurz'` (1.1), als Parameter `posNummern(b,kurz)`.
    - Das ist nur Darstellung, gespeichert wird keine Nummer.
    - Hinweis im Dialog: Alle Belegarten sollten gleich eingestellt sein, damit Angebot, Auftragsbestätigung und Rechnung dieselben Nummern zeigen. Die OZ aus dem LV stehen ohnehin in `p.nr`.
    - Optional zeigt der Editor die Nummern ebenso.
  - `o.lblEP` und `o.lblGP` (optional).
  - `o.kurz=false` druckt den Kurztext nur, wenn kein Langtext da ist. Das vermeidet doppelten Text bei LB-Texten.
  - `o.ltBreit` setzt den Langtext als eigene Zeile `tr.ltz` über die volle Breite.
    - `vorschauSeiten()` bindet `ltz` an die vorige Zeile, wie heute den Gruppenkopf.
    - In `brk` von `pdfAusBeleg()` werden Zeilen ausgeschlossen, auf die eine `.ltz` folgt.
  - `o.lsForm` (nur bei `b.optLS`):
    - `'zeile'`: Kleinzeile „Lohn 12,00 € · Sonstiges 30,00 € je ME“ unter dem Kurztext; als Spalten bleiben nur EP und GP.
    - `'aus'`: Druck wie ohne optLS. Die Aufteilung bleibt intern für Kalkulation und Nachweis.
  - `o.rabForm`:
    - `'text'`: Kleinzeile aus `o.rabTxt` „abzüglich {Rabatt} % Rabatt = −{Betrag} €“.
    - `'netto'`: EP rabattiert als `fmt(r2(ep*(1-r)))`. Dabei die Rundung prüfen: Menge × gedruckter EP kann um Cent vom GP abweichen.
  - **Zuschlag je Position**, nach ETU „Aufschlag je Position“. Das ist ein für den Kunden sichtbarer Zuschlag, z. B. für Erschwernis, Kleinmengen oder Nachtarbeit.
    - Er wird als negativer Rabatt gespeichert, deshalb bleiben `posGP()`, `summen()` und Folgebelege unverändert.
    - Im Editor heißt die Spalte „Rabatt/Zuschlag %“ mit dem Hinweis „−10 = 10 % Zuschlag“.
    - Druck über `o.zusForm`:
      - `'spalte'`: „+10 %“;
      - `'text'`: Kleinzeile aus `o.zusTxt` „zzgl. {Zuschlag} % Zuschlag = +{Betrag} €“.
    - Auswertungen, die Rabatte summieren, sind darauf zu prüfen.
  - `o.grpStil` `''` | `'farbe'` | `'farbe-u'` mit `o.grpFarbe` und `o.posFett`, umgesetzt über CSS-Klassen am `.doc`.
    - Farbe und Fett erbt das PDF.
    - Die Unterstreichung muss direkt am Element liegen, das den Text enthält (`.doc.gu tr.grpz td>b`), oder als `<u>` in `docHTML` gesetzt werden. Der Grund: `pdfAusBeleg()` erkennt sie nur über `textDecorationLine` des direkten Elternelements oder über `closest('u')`, und `text-decoration` wird nicht vererbt.
- **Schalter:**
  - `druck.artNr` `'klammer'` (Empfehlung: AN `'aus'`, BE `'spalte'`).
  - `druck.spPos`, `spEinheit` und `spMenge` true; `druck.spFolge` `'std'`; `druck.mengeAusr` `'mitte'`; `druck.nrForm` `'std'`.
  - `druck.kurz` true, `druck.ltBreit` false, `druck.lsForm` `'spalten'`.
  - `druck.rabForm` `'spalte'`, `druck.zusForm` `'spalte'`; `erw.zuschlag` false (Bezeichnung und Hinweis im Editor).
  - `druck.grpStil` `''`, `druck.grpFarbe` `'#80704d'` (Farbe der Fußzeilenlinie), `druck.posFett` true.
- **Datenmodell:** keines.
- **Nutzen** mittel (Art.-Nr.-Spalte für Bestellungen, ETU-Spaltenbild) · **Aufwand** M–L · **Abhängig von:** P1, P0 j) · **Recht:** Menge und handelsübliche Bezeichnung (§ 11 Abs. 1 Z 3 lit. c UStG) bleiben bei Rechnungen in allen Varianten erhalten.

### P5 – Infoblock, Grußformel, Fußzeilen-Zusatz, Kostenvoranschlag
- **ETU-Vorbild:**
  - Bild 9: Angebots-Nr. im Infoblock mit „Bei Rückfragen bitte angeben“ und „Bindefrist“.
  - Bild 8: „Mit freundlichen Grüßen“ und Firmenname; Fußzeile mit „Gerichtsstand Wels · Es gelten unsere AGB“; Nachtext zu Änderungen des Leistungsumfangs.
- **Heute:**
  - Der Infoblock zeigt Datum, Kunden-Nr., UID, Leistung, „Gültig bis“, Liefertermin, Ansprechperson, E-Mail und Telefon, jeweils als eine Zeile „Bezeichnung: Wert“.
  - Die Nummer steht nur in der Überschrift „ANGEBOT NR.: …“.
  - `.sig` (`f.zeichner`, `f.zeichnerFkt`) steht rechts, ohne Grußformel und nur bei Verkaufsbelegen.
  - `fussZeilen(f)` erzeugt zwei feste Zeilen. `f.gericht` ist das Firmenbuchgericht, nicht der Gerichtsstand.
- **Umsetzung:**
  - `o.nrInfo`: Im Infoblock kommt nach der Kunden-Nr. die Zeile „{Belegart}-Nr.“ dazu, darunter klein `o.nrHinweis`.
    - Für Verkaufsrechnungen gibt es `o.nrHinweisRE`, Vorschlag „Bitte bei Zahlung als Verwendungszweck angeben“.
    - Die Überschrift zeigt dann nur die Belegart.
  - `o.lblGueltig` gilt im Infoblock und als Beschriftung im Formular.
  - `o.infoTab` druckt den Infoblock als zweispaltige Tabelle `table.infot`.
  - `o.gruss`, `o.sigFirma` und `o.sigLinks` (CSS `.doc .sig.li`).
    - Ist `gruss` gesetzt, gibt es den Block auch bei Bestellungen.
    - Bei festgeschriebenen Belegen kommen Zeichner und Firmenname aus `b.fix`.
  - `o.kvTxt`: eigener Textbaustein für Angebote an Privatkunden, z. B. „Unverbindlicher Kostenvoranschlag gemäß § 5 Abs. 2 KSchG“ oder eine verbindliche Variante. Er wird nur bei Kundenart „privat“ gedruckt.
  - `o.fussZusatz`: eine zusätzliche Fußzeile von **höchstens 90 Zeichen**, mit Zeichenzähler im Dialog.
    - Zur Länge: Die dritte Fußzeile liegt im PDF bei etwa 17 pt, die Seitenzahl bei 14 pt und rechts ab etwa 505 pt. In der Vorschau steht `.pz` bei 9,8 mm, im Druck `@bottom-right` mit 10,5 mm Abstand oben.
    - Eine zentrierte Zeile mit mehr als etwa 100–110 Zeichen überlappt deshalb die Seitenzahl. Das ist aus dem Code abgeleitet; im Test wird eine Zeile mit 130 Zeichen in Vorschau, Druck und PDF geprüft.
    - Alternative: Bei 3 Fußzeilen die Seitenzahl in allen drei Ausgaben unter den Block setzen, wie bei ETU „Seite: x / y“.
    - Die Zeile wird in `docHTML` über `fussZeilen(f,b)` an die Pflichtzeilen angehängt (eingefroren über `b.fix.fz` und `druckFix`). Vorschau, Druck und PDF lesen sie nach P0 c) aus `data-fz`.
    - Mit `o.fussNurB2B` wird sie nur gedruckt, wenn die Kundenart nicht „privat“ ist. Bei festgeschriebenen Belegen kommt die Kundenart aus `b.adresse`.
    - Weil `fussZusatz` im Druckprofil liegt, kann er z. B. nur für AN und AB gelten.
- **Schalter:**
  - `druck.nrInfo` false, `druck.nrHinweis` „Bei Rückfragen bitte angeben“, `druck.nrHinweisRE` ''.
  - `druck.lblGueltig` „Gültig bis“, `druck.infoTab` false.
  - `druck.gruss` '', `druck.sigFirma` false, `druck.sigLinks` false.
  - `druck.kvTxt` ''.
  - `druck.fussZusatz` '', `druck.fussNurB2B` true.
- **Datenmodell:** keines. Genutzt wird `b.adresse.kundenart` aus P6; ohne P6 wird die Kundenart aus dem Kontakt gelesen.
- **Nutzen** mittel · **Aufwand** S · **Abhängig von:** P1, P0 c) · **Recht:**
  - „Bindefrist“ trifft die Annahmefrist nach § 862 ABGB genauer als „Gültig bis“.
  - Ein Handwerkerangebot an Verbraucher ist meist ein Kostenvoranschlag. Dessen Richtigkeit gilt als gewährleistet, außer es wird ausdrücklich anders erklärt (§ 5 Abs. 2 KSchG). Zur Überschreitung siehe § 1170a ABGB. Der ETU-Nachtext zu Änderungen des Leistungsumfangs berührt genau das.
  - Wo die fortlaufende Nummer steht, ist frei (§ 11 Abs. 1 Z 3 lit. h UStG).
  - § 14 UGB ist erfüllt, **wenn das Firmenbuchgericht eingetragen ist** (heute leer, siehe P0 m).
  - Eine Gerichtsstandsklausel ist gegenüber Verbrauchern unwirksam (§ 14 KSchG), daher nur bei B2B drucken.
  - AGB gelten nur, wenn sie vor oder bei Vertragsschluss vereinbart werden (§§ 861 ff. ABGB). Ungewöhnliche nachteilige Klauseln werden nicht Vertragsinhalt (§ 864a ABGB), gegenüber Verbrauchern gilt zusätzlich § 6 KSchG. Der Hinweis gehört deshalb auf Angebot und AB; auf der Rechnung allein reicht er nicht.

### P6 – Anrede, Kontaktfelder, Kunden/Lieferanten-Filter
- **ETU-Vorbild:** Bild 9, Adressblock „Herr / Max Mustermann“ und „Sehr geehrter Hr. Max Mustermann,“; Bild 11, „Meine Kontakte“ und „Meine Lieferanten“.
- **Heute:**
  - Der Kontakt hat `name`, `zusatz` und `kundenart`, aber keine Felder für Anrede, Titel, Vor- oder Nachname.
  - `adressSnapshot()` speichert nr, name, zusatz, strasse, plz, ort, land und uid.
  - `b.kopf` kommt starr aus `S().texte[typ].kopf`.
  - `mailVorlage()` schreibt immer „Sehr geehrte Damen und Herren“; beide Zweige der Bedingung liefern denselben Text.
  - Der Infoblock von Einkaufsbelegen zeigt die interne Lieferanten-Nr. (70001 …).
  - `V.kontakte` hat keinen Typfilter.
- **Umsetzung:**
  - Neue Kontaktfelder: `anrede` (''|H|F|FAM|FA), `titel`, `vorname`, `nachname`, `titelNach` und optional `briefAnrede` (freier Text).
    - Sie kommen in `kontaktPopup()` als neue Zeile nach „Name / Firma“ und in `V.kontakt`.
    - `name` bleibt Pflicht für Liste, Suche und `kName()`.
  - Hilfen:
    - `const ANR={H:{a:'Herr',ak:'Herrn',b:'Sehr geehrter Herr'},F:{a:'Frau',ak:'Frau',b:'Sehr geehrte Frau'},FAM:{a:'Familie',ak:'Familie',b:'Sehr geehrte Familie'},FA:{a:'Firma',ak:'Firma',b:''}}`
    - `persName(p)` setzt Titel, Vor- und Nachname zusammen.
    - `briefAnrede(p)` nimmt zuerst `p.briefAnrede`, sonst die österreichische Form „Sehr geehrter Herr Ing. Mustermann,“ (mit Titel, ohne Vorname, ohne „Hr.“), sonst „Sehr geehrte Damen und Herren,“.
  - `adressSnapshot()` speichert zusätzlich anrede, titel, vorname, nachname, titelNach, kundenart und kdNrLief.
  - Adressblock bei `o.adrAnrede`: Zeile `ANR[..].a` über dem Namen. Bei B2B mit Nachname und leerem `zusatz` folgt „z. H. Herrn Ing. Max Mustermann“.
  - Beleg: neues Feld `b.anrede`.
    - Bei `o.briefAnrede` belegen `onHead(b,'kontaktId')` und `neuBeleg()` (mit kontaktId, z. B. `ACT.kbel`) es vor, wenn es leer oder automatisch erzeugt ist.
    - Im Formular gibt es ein Feld `data-h="anrede"` und den Knopf „↻ aus Kontakt“.
    - Gedruckt wird es als `.txt` vor `b.kopf`; in der Vorschau ist es über `ed('h:anrede')` bearbeitbar.
    - `folge()`, `duplizieren()` und `angebotRevision()` kopieren es mit. In `revDiff()` kommt `['anrede','Anrede']` dazu.
    - Nach „✎ Kundendaten bearbeiten“ (`kedit` → `konditionenUebernehmen(b,r,true)`, wiederhergestellt durch P0 a) wird gefragt, ob die Anrede neu übernommen werden soll.
  - `mailVorlage()` nutzt bei `o.briefAnrede` die persönliche Anrede.
  - Kontaktfeld `kdNrLief` (nur bei L/KL): Bei Einkaufsbelegen steht im Infoblock „Unsere Kunden-Nr.“ statt der internen Nummer.
  - Kontaktliste:
    - Chips „Alle | Kunden | Lieferanten“ (`UI.kTyp`; KL erscheint in beiden; gemerkt per `lsSet('erp-kTyp')`), Routen `#/kontakte/K` und `#/kontakte/L`.
    - Die Suche findet zusätzlich `email`, `tel` und `zusatz`.
    - Optional eine Spalte „Person“ (`std:false`) und ein Favoritenstern `k.fav`.
- **Schalter:**
  - `druck.adrAnrede` false, `druck.briefAnrede` false.
  - Die neuen Kontaktfelder wirken nur, wenn sie ausgefüllt sind.
  - Chips Standard „Alle“. Seitenleisten-Untereinträge über `erw.navKL` false.
- **Datenmodell:** Kontakt `anrede`, `titel`, `vorname`, `nachname`, `titelNach`, `briefAnrede`, `kdNrLief`, `fav` (alle optional, keine Migration nötig); Beleg `anrede`; `b.adresse` wie oben erweitert.
- **Nutzen** hoch · **Aufwand** M · **Abhängig von:** P1, P0 a) · **Recht:** § 11 Abs. 1 Z 3 lit. b UStG verlangt nur Name und Anschrift, daher bleibt `kontaktFehlt()` unverändert. Die Gestaltung lehnt sich an ÖNORM A 1080 an.

### P7 – Ansprechpersonen je Kontakt
- **Ziel:** Bei Hausverwaltungen, Bauträgern und Generalunternehmern wechselt die Ansprechperson je Projekt.
- **Heute:** Es gibt nur eine E-Mail-Adresse, eine Telefonnummer und die Freitexte `zusatz`/`notiz`.
- **Umsetzung:**
  - `k.personen=[{id,anrede,titel,vorname,nachname,titelNach,funktion,email,tel,std}]`, in `V.kontakt` als Karte „Ansprechpersonen“ nach dem Muster der Steuersätze (`data-o="kp"`).
  - Im Beleg ein Auswahlfeld `b.personId` unter „Kunde“, vorbelegt mit der Standardperson.
  - `adressSnapshot(k,b.personId)` speichert `person`.
  - Die „z. H.“-Zeile wird nur gedruckt, wenn `zusatz` leer ist.
  - `briefAnrede(person)` hat Vorrang vor der Anrede des Kontakts.
  - `versenden()` schickt an `person.email||k.email`.
- **Schalter:** Ohne eingetragene Personen bleibt alles wie bisher. Die „z. H.“-Zeile hängt zusätzlich an `druck.adrAnrede`.
- **Datenmodell:** Kontakt `personen[]`, Beleg `personId`, `b.adresse.person` (alle optional).
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** P6 · **Recht:** DSGVO Art. 6 Abs. 1 lit. b/f (geschäftliche Kontaktdaten); Ändern und Löschen über die Kontaktmaske.

### P8 – Platzhalter in Texten
- **ETU-Vorbild:** „Variable einfügen“ (z. B. „… enthaltene Lohnkosten #“).
- **Heute:** `b.kopf` und `b.fuss` werden über `rt()` wörtlich gedruckt. `mailVorlage()` setzt Nummer, Betreff und Fälligkeit fest im Code zusammen.
- **Umsetzung:**
  - `phWerte(b)` liefert `{Anrede, Kunde, KundenNr, Nr, Datum, GueltigBis, Betreff, Netto, Brutto, Lohn, LohnUSt, LohnBrutto, Material, Belegart, Faellig, Firma, Bearbeiter}`.
    - Bei festgeschriebenen Belegen kommen alle Werte aus eingefrorenen Quellen: `b.adresse`, Positionen, `b.datum`, Zahlungsziel, `b.fix` (Firma, Bearbeiter, Steuersätze) und `b.druckFix`.
  - `ph(t,b,extra)` ersetzt `{Name}`. Unbekannte Platzhalter bleiben stehen, HTML-Texte werden passend maskiert.
  - **Die Texte werden nie überschrieben, auch nicht beim Festschreiben.**
    - `ph()` wird in `docHTML` bei `!edit` immer neu aus den eingefrorenen Quellen aufgelöst, ebenso in `mailVorlage()` und für die Texte aus P2, P4, P5, P9 und P16.
    - Nach „Bearbeiten“ (REOPEN) bleiben die Platzhalter erhalten, und im Entwurf sind die Werte immer aktuell.
  - Bearbeitbare Vorschau:
    - Angezeigt wird der aufgelöste Text. Erst beim Fokus wird auf den Rohtext umgeschaltet (`data-roh`), und `edUebernehmen()` schreibt den Rohtext zurück.
    - So misst `vorschauSeiten()` denselben Text wie Druck und PDF, und die Seitenumbrüche stimmen überein. Beim Fokus kann sich die Zeilenlänge kurz ändern.
  - Bedienung: Auswahl „Platzhalter einfügen …“ neben Kopf- und Fußtext, im Formular und in den Einstellungen. Optional kommen die Standardtexte aus „Nummernkreise“ in eine eigene Karte „Belegtexte“; das ändert nur die Anordnung.
- **Schalter:** `druck.platzhalter` = true. Das ist unbedenklich, weil die bestehenden Texte keine `{…}` enthalten und unbekannte Platzhalter stehen bleiben. Mit false wird der Text wörtlich gedruckt.
- **Datenmodell:** keines.
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** P1, P0 c) · **Recht:** Der Nachdruck wird aus eingefrorenen Werten aufgelöst und bleibt gleich (§ 131 BAO).

### P9 – Lohnkostennachweis (z. B. Handwerkerbonus)
- **ETU-Vorbild:** „Lohnkostensumme nachweisen“ mit dem Text „In der Angebotssumme enthaltene Lohnkosten #“. Die Option ist bei ETU eingeschaltet, im Angebot (Bild 8) steht trotzdem kein Satz, weil der Lohn 0,00 ist (Bild 12).
- **Heute:**
  - `summen()` berechnet `s.lohn`/`s.sonst` immer aus `epL`/`epS` (mit Rabatt, ohne Pauschalgruppen und Optionen). `.tot` zeigt es aber nur bei `b.optLS` als Kleinzeile „davon Lohn … · Sonstiges …“.
  - Beim Abschalten von optLS löscht `onHead` die Felder nicht.
  - Der Text ist fest, es gibt keinen USt- oder Bruttobetrag, und `kundenart` wird nicht genutzt.
  - `zeitenInPos()` legt Fahrtzeiten als Position mit Art L an (`nr:'FAHRT'`).
- **Umsetzung:**
  - `lohnAnteil(b,s)` liefert `{lohn,ust,brutto,material}` und rechnet je Position:
    - Quelle `'ls'` nur bei `b.optLS`: Σ menge×(1−rabatt)×epL. Ohne optLS fällt sie auf `'art'` zurück.
    - Quelle `'art'`: Σ `posGP` aller Positionen mit `art==='L'`, ausgenommen Optionen und Alternativen über `effKz(p,gi)` (auch auf Gruppenebene) und Positionen in Pauschalgruppen.
    - In beiden Quellen ausgenommen: Positionen mit `p.ohneLohnNw` und Positionen, deren Tarif (`p.tarif || tarife.find(t=>t.kz===p.nr)`) `lohnNw===false` hat. Für FAHRT gilt das standardmäßig, denn Fahrtkosten waren beim Handwerkerbonus nicht förderfähig.
    - Die USt wird anteilig je Position über den Steuersatz gerechnet; bei festgeschriebenen Belegen aus `b.fix.steuer`.
  - Ausgabe als `<div class="txt">` direkt nach `.tot`, Text `o.lohnTxt` über `ph()`.
    - Vorschlag für den Standardtext: „Im Gesamtbetrag enthaltene Arbeitskosten: {Lohn} € netto zzgl. {LohnUSt} € USt ({LohnBrutto} € brutto).“
    - Eine Form wie „{Belegart}summe“ geht nicht, sie ergäbe „Angebotsumme“.
  - Bei `lohn<0.005` wird nichts ausgegeben, auch nicht bei `'text'` oder `'privat'`.
  - Hinweise im Editor:
    - Der Nachweis ist aktiv, aber kein Lohn wird erkannt.
    - Pauschalgruppen verdecken einen Teil des Lohns (`s.netto−s.lohn−s.sonst>0`).
  - Häkchen „nicht im Lohnnachweis“ (`p.ohneLohnNw`) im ✎-Popup der Position; Spalte „Lohnnachweis“ in der Tabelle „Stundentarife“.
- **Schalter:**
  - `druck.lohnNw`: `'ls'` (Standard, bisherige Kleinzeile) | `'aus'` | `'text'` (Satz immer) | `'privat'` (Satz nur bei Kundenart Privat).
  - `druck.lohnQuelle`: `'ls'` | `'art'`.
  - `druck.lohnTxt`: '' bedeutet Standardtext.
- **Datenmodell:** Tarif `lohnNw` (fehlt = true, außer FAHRT), Position `ohneLohnNw` (beide optional).
- **Nutzen** hoch · **Aufwand** M · **Abhängig von:** P1, P8; genauer mit P13 · **Recht:**
  - Beim Handwerkerbonus des Bundes 2024/25 wurden nur die Arbeitskosten ohne USt gefördert, Material und Fahrtkosten nicht. Die Arbeitsleistung musste gesondert auf der Rechnung stehen.
  - Weitere Bedingungen waren: nur Privatpersonen, Wohnraum in Österreich, Rechnung auf den Namen des Förderwerbers, unbare Zahlung.
  - Verkaufsbelege in ERP-Lite haben keine abweichende Leistungs- oder Objektadresse (offene Frage 2).
  - Ob es 2026 eine Neuauflage gibt und zu welchen Bedingungen, ist vor der Umsetzung zu prüfen.
  - § 11 UStG verlangt den Ausweis nicht, er ist aber zulässig.

### P10 – Gesamtkalkulation mit „Aufschlag neu“ und teilweiser Rücknahme
- **ETU-Vorbild:** Bild 12:
  - Zeilen Gesamt/Material/Lohn/Geräte mit EK-GP, Aufschlag aktuell in % und €, VK-GP aktuell;
  - die Eingabe „Aufschlag neu“ ergibt VK-GP neu;
  - „Aufschlag pro Position“;
  - DB/Std. und DB/Stk. aktuell und neu. DB/Stk. ist der DB in € absolut, im Beispiel 15.057,83.
- **Heute:**
  - `kalkBox(b)` (Karte „Kalkulation DB II“) zeigt nur an. Die Werte kommen aus `vorkalk(b)`:
    - Umsatz netto und nach Skonto;
    - EK für Material/Fremd (Art W+F) und Eigenleistung (Art L);
    - MGZ und Herstellkosten;
    - DB II mit `dbTag` gegen `S().zielDB2`;
    - Aufschlag auf HK, bezogen auf den Umsatz nach Skonto;
    - Fehlbetrag `v.fehl`.
  - Einen VK je Kostenart gibt es nicht.
  - Preise lassen sich nur einzeln ändern: über das EP-Feld, `posArtikelPopup` oder direkt in der Vorschau.
- **Umsetzung:**
  - `gkWerte(b)` liefert je Kostenart `{ek,vk,std}`.
    - Ohne optLS wird nach `p.art` getrennt (W Material, F Fremdleistung, L Lohn).
    - Mit optLS ist der Lohn Σ menge×(1−rabatt)×epL und das Material entsprechend über epS.
    - Pauschalgruppen gehen anteilig ein. Optionen und Alternativen (`effKz`) zählen wie in `vorkalk` nicht.
  - Modal `gesamtKalk(b)` im Stil von `posArtikelPopup` (Promise, `data-k`, Escape schließt):
    - Zeilen Gesamt/Material/Fremdleistung/Lohn, Spalten EK-GP | Aufschlag akt. % | Aufschlag akt. € | VK-GP akt. | Aufschlag neu % | Aufschlag neu € | VK-GP neu.
    - Die drei Neu-Felder je Zeile sind verknüpft (Muster lp/rab/ek). Die Gesamt-Zeile verteilt denselben Faktor auf alle Zeilen.
    - Darunter **DB gesamt in €** aktuell und neu (VK − EK, wie ETU „DB/Stk.“) und DB II aktuell und neu (bestehende Definition mit MGZ und Skonto).
  - Verteilungsart:
    - `'faktor'`:
      - Positionen mit Aufteilung (`p.epL!=null||p.epS!=null`) bekommen epL und epS skaliert, dazu `p.ep=r2(epL+epS)`.
      - Alle anderen bekommen `p.ep=r2(p.ep×VKneu/VKakt)` skaliert. Das betrifft z. B. die Nachlass-Position aus `lvZuAngebot()`, die nur `ep` hat und sonst auf 0 fiele.
      - `g.pauschal` wird mitskaliert.
    - `'aufschlag'`, beschriftet als „Aufschlag auf EK der Position (wie ETU, ohne MGZ und Skonto)“: `p.ep=r2(p.ek×(1+a/100)/(1−rabatt/100))`.
      - Optional wird bei Positionen außer Art L der MGZ eingerechnet (`×(1+mgz/100)`).
      - Unverändert bleiben und werden gemeldet: Positionen ohne EK, negative Positionen (z. B. der LV-Nachlass) und Positionen mit Rabatt ≥ 100 % (sonst Division durch 0). Meldung z. B. „3 Positionen ohne EK nicht angepasst“.
      - Pauschalgruppen: Der Pauschalpreis wird auf Σ(ek·(1+a/100)) gesetzt, wenn alle Positionen der Gruppe einen EK haben. Sonst bleibt er unverändert, mit Meldung.
    - Optionen und Alternativen werden wahlweise mit angepasst (Häkchen, Standard an). Optional Rundung auf 0,05 bzw. 0,10.
  - Live-Vorschau: DB II neu mit `dbTag`, Aufschlag auf HK neu und Differenz zum alten Netto. Nebeneinander stehen „Aufschlag auf EK (wie ETU)“ und „DB II nach Skonto“ (PFLICHTENHEFT Abschnitt 5). Im Dialog steht ausdrücklich, dass `kalkBox` den Aufschlag auf HK mit MGZ und nach Skonto rechnet und deshalb einen anderen Wert zeigt als die Eingabe.
  - Knopf „Ziel-DB II {zielDB2} %“: VK neu Gesamt = `r2(v.hk/(1−z)/(1−skonto/100))`. Das Netto muss um fehl/(1−Skonto) steigen, nicht nur um fehl. In `kalkBox` kommt neben dem Fehlbetrag der Link „→ auf Ziel anheben …“ dazu, nur bei `v.fehl>0`.
  - Nach dem Übernehmen wird das tatsächlich erreichte Netto angezeigt („erreicht 83.458,80 statt 83.458,86“). Der Artikelstamm bleibt unberührt.
  - Ablauf: `ACT.gkalk` → `log('Preisanpassung',…)` → `persist()`.
  - Nur in Entwürfen möglich. Bei einem festgeschriebenen Angebot verweist ein Hinweis auf „Bearbeiten (Revision)“ (`angebotRevision`).
  - Rücknahme:
    - Vor dem Übernehmen wird `b.kalkAlt={ts,text,pos:{[id]:{ep,epL,epS,pauschal}},neu:{[id]:ep}}` gespeichert.
    - `kalkBox` zeigt dann „Letzte Preisanpassung vom … zurücknehmen …“. Das öffnet einen Dialog mit Häkchen je Position sowie „alle Material“ und „alle Lohn“.
    - Positionen, die seither von Hand geändert wurden (`p.ep!==neu[id]`), sind anfangs nicht angehakt und markiert.
    - `festschreiben()` löscht `b.kalkAlt`. `merge3()` gleicht das Feld als Teil des Belegs mit ab.
- **Schalter:** `erw.gkalk` = true (es kommt nur eine Schaltfläche dazu, Belege und Druck bleiben unverändert), `erw.gkModus` = `'faktor'`, `erw.gkMerken` = true.
- **Datenmodell:** Beleg `kalkAlt` (optional, nur in Entwürfen).
- **Nutzen** hoch · **Aufwand** L · **Abhängig von:** – (P11, P12 und P13 ergänzen es) · **Recht:** nur Entwürfe; festgeschriebene Belege werden nur über eine Revision geändert.

### P11 – Aufschlag je Position (intern)
- **Heute:**
  - `posArtikelPopup` zeigt nur „VK − HK = Ergebnis (x %)“.
  - Die Artikelliste hat eine Spalte „Aufschlag“, nur zur Anzeige.
  - Ändert sich der EK über `scanUebernehmen()`, bleibt der VK im Stamm alt, und die Marge schrumpft unbemerkt.
- **Umsetzung:**
  - `posArtikelPopup(b,i)` bekommt ein neues Feld `data-k="aufs"` „Aufschlag % auf HK“, in beide Richtungen verknüpft:
    - Eingabe → `ep=r2(hk×(1+aufs/100)/(1−vrab/100))`. Das ist dieselbe Formel wie in P10, mit Kundenrabatt.
    - Änderung von EP, HK oder Rabatt → Aufschlag neu berechnen.
    - Bei optLS setzt Übernehmen `epS=ep−epL` (P0 h).
  - Editor: Häkchen „Kalkulation“ neben „Rabatt“ und „Lohn / Sonstiges“ (`b.optKalk`, `onHead` wie bei `optRabatt`). Es blendet zwei Spalten ein:
    - „Aufschl. %“ als Eingabe. In `onPos` wird bei `f==='aufs'` `ep` berechnet (bei optLS die Differenz auf `epS`) und **vor** der allgemeinen Zuweisung `p[f]=v` zurückgekehrt, damit das Feld nicht gespeichert wird.
    - „DB %“ als Anzeige mit `dbTag`, aktualisiert in `updateCalc()`.
    - Die Spalten erscheinen nie in `docHTML`/`pdfAusBeleg`. `angebotRevision()` und die Folgebeleg-Optionen übernehmen `optKalk`.
  - Artikel `vkAufschlag` (%): Bei einer EK-Änderung (`scanUebernehmen`, Datanorm P26, `artikelEdit`) schlägt `scanDiffs()` eine zusätzliche Zeile `vk` mit `r2((hk||ek)×(1+x/100))` vor. Übernommen wird nur, was angehakt ist.
- **Schalter:** `erw.gkAufsFeld` = true (nur das Popup-Feld), `b.optKalk` mit Vorgabe `erw.optKalk` = false, `a.vkAufschlag` wirkt nur, wenn eingetragen.
- **Datenmodell:** Beleg `optKalk`, Artikel `vkAufschlag` (optional).
- **Nutzen** hoch · **Aufwand** S (Popup) bis M (Spalten) · **Abhängig von:** P0 h) · **Recht:** Dieser interne Aufschlag wird nicht auf den Kundenbeleg gedruckt. Ein für den Kunden sichtbarer Zuschlag steht in P4.

### P12 – DB je Lohnstunde, Mindest-DB/Std, Lohnkalkulation je Tarif
- **ETU-Vorbild:** Bild 12:
  - „DB/Std.“ aktuell und neu (grün hinterlegt), „Mindest-DB/Std.“, „Kalk.-DB/Std.“;
  - „VK-EP (Lohn)“, „VK-GP (Lohn)“, „enthaltene Lohnpauschale(n)“;
  - Tabelle „Lohnkalkulation“ je Lohngruppe (Mittellohn) mit EK/Std., Aufschlag, VK/Std. Stamm und neu, Zeit in Minuten und Stunden.
- **Heute:**
  - Stunden erkennt man nur an Positionen der Art L mit Einheit h (`zeitenInPos()`), an `DB.zeiten` (→ `nachkalk(aid).std`) und an `k7calc().std`. `lvZuAngebot()` verliert diese Stunden.
  - Einen DB je Stunde gibt es nirgends; `dbTag` arbeitet nur mit Prozent.
  - `S().tarife` (Kostensatz und Verkauf in €/h) entspricht den Lohngruppen, ist aber nicht mit K3 verbunden.
- **Umsetzung:**
  - `posStd(p)` = `+p.zeit>0` ? menge×zeit : (Art L und Einheit h) ? menge×faktor : 0.
  - `vorkalk()` ergänzt `std` (ohne `effKz`) und `dbh`, `nachkalk()` ergänzt `dbh`.
  - Anzeige:
    - `kalkBox`: Zeilen „Lohnstunden“ und „DB II je Stunde“ (nur bei std>0).
    - `V.auftrag`: Zeile „DB II je Stunde“ mit Vor- und Ist-Wert.
    - `V.auftraege`: neue Spalten `vdbh` und `idbh` (`std:false`).
    - `gesamtKalk`: DB/Std aktuell und neu.
  - Einstellungen `erw.mindestDBh` und `erw.kalkDBh` (0 = aus). `dbhTag(x)`: grün ab dem Kalk-Wert, gelb ab dem Mindestwert, sonst rot. Neben dem Feld steht als Hilfe der Vorschlag Tarif-VK − Kostensatz.
  - Lohnkalkulation in `gesamtKalk` (nur bei Lohnpositionen):
    - Zuordnung je Tarif über `p.tarif || tarife.find(kz===p.nr)`, sonst Zeile „ohne Tarif“.
    - Spalten: EK/Std | Aufschlag Stamm % | VK/Std Stamm | VK/Std im Beleg | VK/Std neu bzw. Aufschlag neu % | Zeit Std./Min. | VK-GP Lohn.
    - **Lohnpauschalen:** Positionen der Art L ohne Stundenbezug (Einheit nicht h, kein `zeit`, z. B. PA) stehen als eigene Zeile „enthaltene Lohnpauschale(n)“ mit ihrem VK-GP. Sie zählen zum Lohn-VK, aber nicht zu den Stunden und nicht zum DB/Std.
    - **VK-EP (Lohn)** = VK-GP der Stundenpositionen ÷ Stunden, also der mittlere Stundensatz.
    - Übernehmen setzt bei Einheit h `p.ep` (bei optLS `epL`). Bei Positionen mit `zeit` wird `epL=r2(zeit×VK/Std neu)` gesetzt.
    - Optionales Häkchen „auch in Stundentarife übernehmen“ (Standard aus).
  - Die Tabelle „Stundentarife“ zeigt zusätzlich Aufschlag % und DB/Std (nur Anzeige). `zeitenInPos()` setzt künftig zusätzlich `tarif`.
  - Im K3-Blatt kommt der Knopf „als Stundentarif übernehmen …“ dazu: `tarif.kosten=r2(x.lk)`, `tarif.vk=r2(x.mlp)`. Bereits erfasste Zeiten bleiben unverändert, weil sie die Sätze beim Erfassen kopiert haben.
- **Schalter:** `erw.dbStd` false, `erw.mindestDBh` 0, `erw.kalkDBh` 0, `erw.gkLohn` true (wirkt nur im Dialog), `erw.k3Tarif` true (nur eine Schaltfläche).
- **Datenmodell:** Position `tarif` (optional, sonst Zuordnung über `p.nr` wie bisher).
- **Nutzen** hoch · **Aufwand** M · **Abhängig von:** P10; genauer mit P13 · **Recht:** ÖNORM B 2061 (K3 ist schon umgesetzt).

### P13 – Kostentrennung Material/Lohn je Position, Montagezeit je Artikel
- **Heute:**
  - `p.ek` sind die gesamten Herstellkosten, `vorkalk()` trennt nur nach `p.art`.
  - `lvZuAngebot()` legt LV-Positionen als Art W an, ihre Lohnkosten landen deshalb unter „Material/Fremd“.
  - optLS trennt nur den VK, nicht die Kosten.
  - Artikel haben keine Montagezeit. Den Lohnanteil einer Ware-Position (z. B. Steckdose inkl. Montage) tippt man von Hand in epL.
- **Umsetzung:**
  - Neue Positionsfelder `zeit` (h je Einheit), `ekL` (davon Lohnkosten je Einheit) und `tarif`. `p.ek` bleibt die Gesamt-HK, damit nichts doppelt zählt.
  - `vorkalk()`: Lohn-EK = Art L ? menge×ek : menge×(ekL||0); Material = Rest.
  - `lvZuAngebot()`: `zeit=pr.k7.std` und `ekL=r2(std×lk)`.
  - `posArtikelPopup` bekommt die Felder „Lohnzeit h je Einheit“ und „Tarif“ → `ekL=zeit×tarif.kosten`, darunter „davon Lohn … €“.
  - Artikel bekommen `zeit` (Eingabe in Minuten, ÷60) und `tarif`. `artikelInPos()` übernimmt bei `a.zeit>0`:
    - `p.zeit`, `p.tarif`, `p.ekL` und `p.ek=(hk||ek)+ekL`;
    - bei optLS außerdem `epS=a.vk`, `epL=r2(zeit×tarif.vk)` und `p.ep=r2(epL+epS)`.
  - Bei einem Einheitenwechsel rechnet `onPos('einheit')` zusätzlich zu P0 g) auch `ekL` und `zeit` mit demselben Faktor um.
- **Schalter:** `erw.posZeit` false, `erw.artZeit` false. Abschalten stellt die bisherige Rechnung exakt wieder her; gespeicherte Felder stören nicht.
- **Datenmodell:** Position `zeit`, `ekL`, `tarif`; Artikel `zeit`, `tarif` (alle optional).
- **Nutzen** mittel · **Aufwand** M–L · **Abhängig von:** P12 (Auswertung), P0 g); nützt P9 und P10 · **Recht:** getrennter Ausweis der Arbeitsleistung (z. B. für Förderungen).

### P14 – Preiseinheit (PE) und Prüfung beim Einlesen
- **ETU-Vorbild:** „Einzelpreis pro Preiseinheit drucken“ (z. B. Kabel € je 100 m).
- **Heute:**
  - `faktor` dient nur zur Umrechnung von Einheiten, eine Preiseinheit gibt es nicht.
  - `xmlBeleg()` teilt bereits durch die BaseQuantity, die PE geht dabei aber verloren.
  - **Fehler beim Einlesen:** Der KOL-Ausdruck für `ep` (`preis\s*\/`) erkennt einen Spaltenkopf „Preis/100“ als EP je Einheit. Bei Kabelrechnungen ist der EP dann 100-fach zu hoch, und `scanDiffs()` schlägt einen falschen EK für den Artikelstamm vor. Menge × EP wird nicht gegen den GP geprüft.
  - **Rundung:** EP und EK werden an vielen Stellen auf Cent gerundet: `posArtikelPopup`, `artikelPopup`, `onPos('einheit')`, `scanUebernehmen` (drei Stellen) und `scanDiffs` (`epB=r2(…)`).
  - Die Vorschau zeigt den EP als `fmt(p.ep)`. `edUebernehmen()` schreibt ihn beim Verlassen des Feldes mit `deNum` zurück und vergleicht dabei mit dem ungerundeten Wert. Schon ein Klick ins Feld kürzt einen EP mit mehr als 2 Nachkommastellen: 0,4537 €/m wird zu 0,45, also 45,00 statt 45,37 € je 100 m.
- **Umsetzung:**
  - Neues Feld `pe` (1/10/100/1000) an Artikel und Position.
  - Gespeichert wird weiter der Preis je Basiseinheit, bei `pe>1` aber mit 2+log₁₀(pe) Nachkommastellen: `rp=(x,pe)=>+(+x).toFixed(2+Math.round(Math.log10(pe||1)))` statt `r2`.
    - Alle oben genannten Stellen werden umgestellt. Bei `pe=1` bleibt es bei `r2`, also unverändert.
    - `posGP()` und `summen()` bleiben unverändert, denn menge×ep ist dann exakt.
  - Anzeige und Eingabe:
    - Das EP-Feld zeigt `ep×pe` mit dem Zusatz „/100“. `onPos('ep')` teilt durch `pe`.
    - In der Vorschau steht `fmt(ep×pe)`. `edUebernehmen()` vergleicht künftig mit dem **formatierten** Wert und schreibt nur bei echter Änderung (`deNum(txt)/pe`). Das behebt nebenbei das Kürzen beim Klick.
    - Im Druck steht `fmt(ep×pe)` und darunter klein „je 100 m“.
  - Felder „Preiseinheit“ in `artikelEdit()`, `artikelPopup()` und `posArtikelPopup()`; `artikelInPos()` übernimmt `a.pe`.
  - `xmlBeleg()`: `pe:bq>1?bq:1`.
  - `textBeleg()`:
    - Neuer KOL-Eintrag `['pe',/^(pe|preiseinh\w*)$/i]`. Er ist verankert, sonst träfe er z. B. „Periode“.
    - Plausibilitätsprüfung: Liegt menge×ep×(1−rab)/gp bei etwa 10, 100 oder 1000 (±2 %), wird der EP entsprechend korrigiert und die PE gesetzt.
  - `scanUebernehmen()`, `wvRechnung()` und `ACT.mkart` geben `pe` weiter.
  - Die Plausibilitätsprüfung kann als eigener Commit vorgezogen werden (Stufe 1).
- **Schalter:**
  - `erw.pe` = true. Das wirkt nur bei pe>1, was es bisher nicht gibt. Die Prüfung beim Einlesen behebt einen Fehler, und das Ergebnis wird in `scanBox()` ohnehin bestätigt.
  - `druck.peDruck` = `'pe'` | `'einheit'` (EP je Einheit mit bis zu 4 Nachkommastellen), über `b.druckFix` eingefroren.
- **Datenmodell:** Artikel `pe`, Position `pe`, Scan-Zeile `pe` (fehlt = 1).
- **Nutzen** hoch · **Aufwand** M (wegen der vielen Rundungsstellen eher M–L) · **Abhängig von:** P1 (nur `peDruck`) · **Recht:** Menge, Bezeichnung und Entgelt bleiben eindeutig (§ 11 Abs. 1 Z 3 lit. c/e UStG); keine scheinbaren Rundungsdifferenzen zwischen gedrucktem EP und GP.

### P15 – Mengenformel / Aufmaß
- **ETU-Vorbild:** „Mengenformel drucken“.
- **Heute:** Die Menge ist ein reines Zahlenfeld (`onPos` mit `num(v)`). Formeln gibt es nicht, auch nicht im LV.
- **Umsetzung:**
  - Positionsfeld `formel`. Bei eingeschalteter Option wird das Menge-Feld zu `type="text" inputmode="decimal"`.
  - Enthält die Eingabe in `onPos('menge')` Rechenzeichen, rechnet `formelWert(s)` sie aus:
    - ein eigener kleiner Parser (rekursiver Abstieg, kein `eval`, deutsches Komma, Text in `[eckigen Klammern]` als Bezeichnung);
    - danach gilt `p.menge=r3(w)` und `p.formel=s`.
  - Druck in `zeile()`: „Mengenermittlung: [Küche] 2 × 3,50 + [Bad] 4,00 = 11,00 m“, aber nur, wenn `r3(formelWert(p.formel))===r3(p.menge)`. So zeigen Folgebelege mit Teilmengen und in der Vorschau geänderte Mengen keine veraltete Formel. `folge()`, `sammelRechnung()` und `edUebernehmen()` bleiben unverändert.
  - Später optional dasselbe für LV-Positionen.
- **Schalter:** `erw.mengenFormel` false; `druck.formelDruck` false (je Beleg über `b.druck`).
- **Datenmodell:** Position `formel` (optional).
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** P1 · **Recht:** prüffähige Abrechnungsunterlagen (ÖNORM B 2110 sinngemäß).

### P16 – Metallzuschlag (Kupfer, DEL-Notiz)
- **ETU-Vorbild:** „Rohstoffzuschlag je Position“ mit Text.
- **Heute:** Es gibt kein Feld dafür. Zuschlagszeilen in Großhändlerrechnungen hängt `textBeleg()` als Text an die vorige Position oder übergeht sie. `scanBox()` meldet dann nur „Summe weicht ab“.
- **Umsetzung:**
  - Artikel bekommen `cu` (kg Cu je km) und `cuBasis`.
  - Werte in eigener Einstellung, nicht unter `erw`, damit „Alle Schalter auf Standard“ sie nicht löscht: `S().metall={del:0,datum:'',basis:150,bezug:1,text:'inkl. Metallzuschlag {mz} €/{eh} (DEL {del} €/100 kg vom {datum})'}`. Gelesen wird mit Fallback.
  - `mzBetrag(a)=cu/1000×max(0,del×(1+bezug/100)−basis)/100` € je Einheit.
  - `artikelInPos()` friert `p.mz={del,datum,cu,basis,b}` ein und rechnet den Zuschlag in EP und EK ein, **nur auf dem Weg über `a.vk`**.
    - Stammt der EP aus der Preishistorie desselben Kunden (`g.ep`), enthält er schon einen früheren Zuschlag.
    - Dann wird höchstens die Differenz zum damaligen `mz` angeboten, zur Bestätigung.
  - Weil der Zuschlag im EP steckt, bleiben `posGP`, `summen()`, Folgebelege und Teillieferungen unverändert.
  - Für Entwürfe die Knöpfe „Metallzuschlag aktualisieren (DEL …)“ und „herausrechnen“. Druckzeile über `druck.mzDruck`. Bei einem neuen Angebot erscheint ein Hinweis, wenn die DEL älter als 7 Tage ist.
  - Die DEL wird von Hand eingegeben oder aus einer Rechnung bzw. aus Datanorm übernommen. Eine Quelle, die der Browser abrufen darf, gibt es nicht (CORS).
  - `textBeleg()` erkennt `/metall|cu-?zuschlag|kupfer|DEL/` als eigene Position.
- **Schalter:** `erw.metall` false; `druck.mzDruck` false.
- **Datenmodell:** `S().metall`; Artikel `cu`, `cuBasis`; Position `mz`.
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** P1; optional P26 · **Recht:** DEL-Basis und Datum nennen; Metallklausel bzw. ÖNORM B 2111 bei veränderlichen Preisen.

### P17 – Textergänzungen „liefern / montieren“
- **ETU-Vorbild:** Bild 10, „Textergänzungen Material / Lohn / Material und Lohn“ mit „Standard wiederherstellen“. Sie sind Teil der Druckeinstellungen **je Belegart**.
- **Heute:** Die Bezeichnung wird frei erfasst. Textbausteine gibt es nur im LV.
- **Umsetzung:**
  - `ergArt(p)`: ML, wenn epL und epS beide gesetzt sind; L bei Art L oder nur epL; M bei Art W oder nur epS; bei F leer.
  - In `zeile()` folgt nach der fetten Bezeichnung `<span class="erg">– liefern und montieren</span>`, im Editor als grauer Hinweis.
  - Die Texte liegen im Druckprofil (`druck.ergM`, `druck.ergL`, `druck.ergML`) und sind über `b.druckFix` eingefroren. Nachdrucke bleiben gleich, auch wenn die Einstellung später geändert wird. Ein eigenes Feld `b.textErg` ist nicht nötig.
  - „Standard wiederherstellen“ je Text setzt den Vorschlag ein.
  - `p.ergAus` schaltet die Ergänzung je Position ab (Häkchen im ✎-Popup).
- **Schalter:** `druck.ergM`/`ergL`/`ergML` = ''. Leer bedeutet aus. Die Vorschläge stehen als Platzhalter im Feld.
- **Datenmodell:** Position `ergAus` (optional).
- **Nutzen** mittel · **Aufwand** S · **Abhängig von:** P1 · **Recht:** –

### P18 – Gliederung / Dokumentenübersicht
- **ETU-Vorbild:** Bild 8, „Dokumentenübersicht“ als Baum neben der Vorschau; ein Klick springt zur Stelle.
- **Heute:**
  - `posNummern()`, `gruppenInfo()`, `gruppePreis()` und `effKz()` liefern die Daten, aber es gibt keinen Baum und keinen Sprung.
  - Positionen lassen sich nur einzeln verschieben (`ACT.pup`/`pdown`), `ACT.padd` hängt immer am Ende an.
  - Das PDF hat keine Lesezeichen.
- **Umsetzung:**
  - `gliederung(b)`: Gruppen mit Nr., Bezeichnung, Summe und Kennzeichen Option/Alternative, darunter eingerückt die Positionen.
    - Die Gruppen sind über `<details>` auf- und zuklappbar, ab 30 Positionen anfangs zugeklappt (`lsGet('erp-glZu')`).
    - Ein Klick (`ACT.spring`) scrollt in `table.pos` und im Blatt zur Zeile und lässt sie kurz aufleuchten (`.blink`). Dafür bekommen die Zeilen im Blatt neue Attribute `data-pi` bzw. `data-g`; Aussehen, Druck und PDF bleiben gleich.
  - Platz: in der Ansicht Vorschau als schmale linke Spalte (wie bei ETU), in Eingabe/Beides als erste Karte bzw. über dem Blatt.
  - Erweiterung für Entwürfe: ganze Gruppe ↑↓ verschieben und „+ Position hier“.
  - Optional PDF-Lesezeichen (`/Outlines` je Gruppe) in `pdfAusBeleg()`.
- **Schalter:** `erw.gliederung` = true. Sie erscheint nur bei Belegen mit Gruppen oder mehr als 15 Positionen und ist eine reine Bedienhilfe ohne Wirkung auf den Druck. `druck.pdfLz` = false.
- **Datenmodell:** keines.
- **Nutzen** hoch · **Aufwand** M · **Abhängig von:** – · **Recht:** –

### P19 – Navigation: „Zuletzt“, Vor/Zurück, Statuszeile, Seitenleiste
- **ETU-Vorbild:** Bild 11: „Zuletzt …“, grüne Pfeile Zurück/Vor, Statuszeile „[Angebote] Angebot: <AN2026/0005> vom 22.09.2026 19:42 (Offen)“.
- **Heute:**
  - Eine Liste der zuletzt geöffneten Datensätze gibt es nicht.
  - Der Knopf `#undobtn` „↶ Zurück“ ist Rückgängig, keine Navigation. Als App vom Startbildschirm (Vollbild) fehlt die Zurück-Taste des Browsers.
  - Der Belegstatus steht schon als `statusTag(b)` neben dem Titel in der `kopfbar`. Die `kopfbar` scrollt aber mit weg.
  - `b.erstellt` und `b.festAm` werden gespeichert, aber nirgends angezeigt.
  - Bei einem geöffneten Beleg ist in der Seitenleiste nichts markiert, und am Desktop lässt sie sich nicht einklappen.
- **Umsetzung:**
  - a) **Zuletzt:**
    - `render()` ruft für beleg, kontakt, artikel, auftrag, lvs und kbs `zuletztMerk(view,arg)` auf.
    - Gemerkt werden höchstens 12 Einträge ohne Doppel per `lsSet('erp-zuletzt')`, bewusst nicht in der DB, sonst würde jedes Öffnen eine Änderung auslösen.
    - Knopf „Zuletzt ▾“ in der Seitenleiste und in der `.topbar`. Die Beschriftung wird erst beim Öffnen berechnet (Belegart, Nummer, Kunde, Status bzw. Nr. und Name).
    - Gelöschte Einträge und solche im Papierkorb werden übersprungen. Dazu „Liste leeren“.
  - b) **Vor/Zurück-Pfeile** ◀ ▶ (`history.back()`/`forward()`) neben `#undobtn` und in der `.topbar`.
    - Ein Ansichtsindex verhindert, dass man aus der App hinausnavigiert. Der `hashchange`-Handler setzt ihn bei jedem Wechsel per `history.replaceState({i},…)`, auch im Zweig mit ungespeicherten Änderungen (heute `replaceState(null,…)`, Z. 1046, das den Index löschen würde).
    - Alternativ wird der Index in `sessionStorage` geführt.
    - Die Rückfrage bei ungespeicherten Änderungen greift weiter.
  - c) **Statuszeile** `belegStatus(b)` unter dem Titel:
    - Brotkrumen „Verkauf › Angebote“ (Klick führt zur Liste);
    - „vom {Datum} {Uhrzeit aus b.erstellt}“, Kunde, Netto (`#kopfsum`, aktualisiert über `updateCalc()`);
    - Status über `statusTag(b)` (offen, angenommen, abgelehnt, abgelaufen, bezahlt, überfällig);
    - „festgeschrieben {festAm}“ bzw. „angelegt …“.
    - Optional ein fixierter Kopf, der den Status mitnimmt.
  - d) **Seitenleiste:** Bei geöffnetem Beleg wird „Verkauf“ bzw. „Einkauf“ markiert. Am Desktop wird sie mit dem Knopf « einklappbar (`body.navzu`, die Mobil-Regeln werden wiederverwendet).
- **Schalter:** `erw.zuletzt` true, `erw.navPfeile` `'auto'` (Pfeile nur im Vollbild/App-Modus; `'an'`, `'aus'`), `erw.statuszeile` true, `erw.kopfFix` false (am Handy würde die Knopfleiste zweizeilig). Ob die Seitenleiste eingeklappt ist, merkt sich jedes Gerät über `lsGet('erp-navzu')`. Die Markierung braucht keinen Schalter.
- **Datenmodell:** keines.
- **Nutzen** hoch (Zuletzt) bzw. mittel · **Aufwand** S je Teil · **Abhängig von:** – · **Recht:** Im Browser stehen nur interne IDs, keine Namen (DSGVO-schonend).

### P20 – Globale Suche (Strg+K)
- **ETU-Vorbild:** Lupe in der Symbolleiste.
- **Heute:** Es gibt nur Suchfelder je Liste (`UI.vQ`, `eQ`, `kQ`, `aQ`, `lgQ`, `bQ`, `lbQ`). Positionstexte, Beträge, Aufträge und LVs findet man nicht bereichsübergreifend.
- **Umsetzung:**
  - Neue Ansicht `V.suche` (`#/suche`), Eintrag in der Seitenleiste und in der `.topbar`, Tastenkürzel Strg+K bzw. F3 (nicht innerhalb eines Dialogs). Das Eingabefeld `data-o="ui" data-f="gQ"` nutzt die vorhandene Live-Suche.
  - Treffer gruppiert, je Gruppe höchstens 15, mit dem Link „alle in Liste“:
    - Belege: Nr., Fremd-Nr., Betreff, Projekt, Kunde und Positionstexte ohne HTML.
    - Beträge: Eingabe wie „1.234,56“ über `deNum()`, verglichen mit `summen(b).zahlbar` bzw. Netto auf ±0,005.
    - Kontakte (zusätzlich E-Mail und Telefon), Artikel (zusätzlich Lieferanten-Art.-Nr.), Aufträge, LVs, K-Blätter, Textbausteine.
  - Enter öffnet den ersten Treffer, ↑/↓ wählt aus.
- **Schalter:** `erw.suche` true (zusätzlicher Menüeintrag, keine Datenänderung).
- **Datenmodell:** keines.
- **Nutzen** hoch · **Aufwand** M · **Abhängig von:** – · **Recht:** –

### P21 – Werkzeugleiste der Vorschau
- **ETU-Vorbild:** Bilder 8/9: Zoom 82 %, Seiten blättern, Drucken, per E-Mail versenden, „Änderungsmodus“; außerdem Suche im Dokument (Fernglas), Mehrseitenansicht, Speichern/Export und Hand-Werkzeug.
- **Heute:**
  - `vorschauSeiten()` teilt das Blatt in Seiten und verkleinert nur automatisch bei schmaler Spalte.
  - Drucken, Senden und PDF liegen in der `kopfbar` und sind außer Sicht, sobald man in der Vorschau scrollt.
  - `.sticky` gibt es nur in der Ansicht Beides. Es ist ein Container mit `overflow:auto` (Z. 25). In der Ansicht Vorschau steht das Blatt ohne ihn in `.cols`.
  - Der Änderungsmodus ist bei Entwürfen immer aktiv.
  - In der Ansicht Beides ist die Aufteilung fest 50/50.
  - Die Suche im Dokument geht schon heute mit Strg+F des Browsers, denn das Blatt ist HTML.
- **Umsetzung:**
  - `vorschauLeiste(b)` über dem Blatt, mit eigenem `position:sticky;top:0`, getrennt für beide Ansichten: in Beides innerhalb von `.sticky`, in Vorschau im Seitenfluss. Inhalt:
    - Zoom: − | Auto/Seitenbreite/Ganze Seite/50–150 % | +. Angewendet wird er am Ende von `vorschauSeiten()`, gemessen wird weiter ungezoomt. Strg+Mausrad zoomt ebenfalls.
    - Blättern: |◀ ◀ Seite n/N ▶ ▶| (aktuelle Seite über einen IntersectionObserver).
    - Drucken, Senden, PDF speichern (entspricht ETU „Speichern/Export“).
    - Häkchen „Änderungsmodus“: `docHTML(b,vEdit())`. Der Hinweis zu den gestrichelten Feldern erscheint nur bei aktivem Modus.
  - Zusätzlich ein ziehbarer Trenner in der Ansicht Beides (Doppelklick stellt 50/50 her) und Strg+Alt+V zum Wechseln der Ansicht.
  - Mehrseitenansicht und Hand-Werkzeug sind nicht vorgesehen (siehe Abschnitt 5).
- **Schalter:** `erw.vLeiste` true (reine Bedienleiste). Je Gerät: `lsGet('erp-zoom')` (leer = automatisch wie heute), `lsGet('erp-vEdit')` (Standard '1' = bearbeitbar wie heute), `lsGet('erp-split')` (leer = 50/50).
- **Datenmodell:** keines.
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** – · **Recht:** Festgeschriebene Belege bleiben gesperrt.

### P22 – Beleg in Reitern (optional)
- **ETU-Vorbild:** Bild 11: Reiter Kopfdaten | Positionsdaten | Fußdaten | Gesamtansicht | Angebotsdaten | Kalkulieren | Erweitert…, unten „Zurück/Weiter“. Was unter „Angebotsdaten“ und „Erweitert…“ steht, ist auf den Screenshots nicht zu sehen (offene Frage 11).
- **Heute:** `V.beleg` zeigt alles auf einer langen Seite. Der Fußtext wird über den Positionen bearbeitet. Am Handy stehen Summen und Kalkulation ganz unten.
- **Umsetzung:**
  - `formHTML`, `side` und `extra` werden in Teile zerlegt:
    - `kopfC`;
    - `posC`;
    - `textC` (Kopftext oben, Fußtext unten; dazu `druck.fussZusatz` aus P5 als „Fußzeile auf jeder Seite“ je Beleg);
    - `belegC` (Status, Revisionen, Belegkette, Versand, Anhänge, Zahlungen);
    - `kalkC` (`sumBox`, `kalkBox`, Gesamtkalkulation).
  - Reiterleiste `.seg` (`data-act="btab"`), am Ende „← Zurück: … / Weiter: … →“. Die Gesamtansicht ist das vorhandene Blatt.
  - Der aktive Reiter liegt flüchtig in `UI.bTab`: Ein neuer Beleg startet bei Kopfdaten, ein bestehender bei Positionen. Alt+1…6 wechselt den Reiter.
  - In der Ansicht Beides steht der Reiter links, die Vorschau rechts.
  - Ohne Reitermodus bleibt der bisherige Aufbau unverändert (nur eine Verzweigung am Ende).
- **Schalter:** `erw.reiter` false.
- **Datenmodell:** keines.
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** sinnvoll nach P10 und P18 · **Recht:** Festgeschriebene Belege bleiben in allen Reitern gesperrt.

### P23 – Listen: Sortieren per Spaltenkopf und Summenzeile
- **Heute:** `tabelle()` hat eine Spaltenauswahl. `V.belege` sortiert fest nach Datum und Nummer und nutzt die Summenoption `fuss` nicht.
- **Umsetzung:**
  - Spalten bekommen einen optionalen Sortierschlüssel `s`, der Spaltenkopf wird klickbar (▲/▼, Zustand flüchtig in `UI.tsort`). `V.belege` sortiert die Gruppenköpfe; die zugehörigen Belege bleiben darunter.
  - Summenzeile über `fuss`: Anzahl, Netto, Brutto und Offen der gefilterten Belege, ohne Entwürfe; Stornos werden über `sgn()` ausgeglichen.
- **Schalter:** Sortiert wird nur nach einem Klick. `erw.listSumme` true (zusätzliche Information).
- **Datenmodell:** keines.
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** – · **Recht:** –

### P24 – Bilder je Artikel/Position
- **ETU-Vorbild:** Bild 10, Abschnitt „Bilder“ in den Druckeinstellungen.
- **Heute:** Artikel haben kein Bild. `bildVerkleinern()` gibt es. `pdfAusBeleg()` bettet jedes `<img>` ein, ein mehrfach verwendetes Bild aber mehrfach.
- **Umsetzung:**
  - **Bilder nicht in `erp-daten.json`:** `merk()` legt bis zu 50 vollständige Stände von `JSON.stringify(DB)` in `UNDO` ab (Z. 429). Bei 2–3 MB Bildern wären das am Handy über 100 MB Speicher. Dazu kämen jedes Speichern, jede Sicherung und die Vergleiche in `merge3`.
  - Die Bilder werden deshalb wie Anhänge als Dateien abgelegt: `STORE.putFile('bilder/<id>.jpg',blob)` (OneDrive-Ordner bzw. lokaler Ordner), als JPEG mit höchstens 300 px und ca. 20 kB.
    - Gelesen wird über eine neue Methode `STORE.getBlob(path)` mit Zwischenspeicher in IndexedDB.
    - Artikel und Position speichern nur `bild:'bilder/<id>.jpg'`.
    - `merge3`, `neueDB` und `migrate` brauchen für die Bilddaten nichts.
  - In `artikelEdit()` gibt es eine Karte „Bild“ (Datei/Kamera). Ein neues Bild bekommt eine neue ID. Alte Dateien bleiben, solange festgeschriebene Belege darauf verweisen.
  - Im Druck steht `<img class="pbild">` links neben dem Langtext. `docHTML` setzt Blob-URLs aus dem Zwischenspeicher; vor Druck und PDF werden fehlende Bilder geladen.
  - `pdfAusBeleg()` bettet JPEG direkt als `/DCTDecode` ein, je Quelle nur einmal.
  - Ein Knopf räumt unbenutzte Bilddateien auf.
- **Schalter:** `druck.bilder` false (je Beleg „Bilder drucken“), `erw.bildMM` 25.
- **Datenmodell:** Artikel `bild`, Position `bild` (Pfad, optional).
- **Nutzen** mittel · **Aufwand** M–L · **Abhängig von:** P1 · **Recht:** –

### P25 – Set-/Jumbo-Artikel und LV-Titel als Gruppen
- **ETU-Vorbild:** „Jumbo Menge drucken“ (Druckoption, Standard ✓), „Einzelartikelpreise unterhalb eines Titels/Jumbos“.
- **Heute:**
  - Gruppen mit Pauschalpreis und `ohneEP` gibt es schon. Eine Menge je Gruppe und Stücklisten-Artikel fehlen.
  - `lvZuAngebot()` macht aus LG/ULG nur Textzeilen (`art:'T'`), deshalb fehlen bei Angeboten aus dem LV die Titelsummen.
- **Umsetzung:**
  - Artikel `teile:[{artikelId,menge}]` (Karte „Bestandteile (Set)“). `artikelInPos()` legt eine Gruppe mit `jumbo:{m,eh}`, `ohneEP` und Pauschalpreis sowie die Unterpositionen an (`p.jm` = Basismenge).
  - Die Menge in der Gruppenzeile skaliert alle Unterpositionen und den Pauschalpreis. `lagerBeiFest()` bucht dann je Teil ab; Optionsgruppen bleiben nach P0 i) außen vor.
  - `lvZuAngebot()` legt LG wahlweise als Gruppe an. ULG bleiben dann Zwischenüberschriften (Textzeile) innerhalb der Gruppe; als echte zweite Ebene nur mit P29. Damit funktioniert die Zusammenfassung aus P2 auch bei Angeboten aus dem LV.
- **Schalter:**
  - `erw.setEinfuegen` `'frage'` (betrifft nur Artikel mit Teilen, die es heute nicht gibt).
  - `druck.jumboMenge` true: Druckoption, wirkt nur bei Jumbo-Gruppen und wird mit `druckFix` eingefroren.
  - `erw.lvGruppen` `'T'` (wie bisher) | `'LG'`.
- **Datenmodell:** Artikel `teile`, Gruppe `jumbo`, Unterposition `jm`.
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** P2 (für den LV-Nutzen), P0 i) · **Recht:** –

### P26 – Datanorm-/ELDANORM-Import
- **ETU-Vorbild:** Großhandelsdaten (Bild 11, Umfeld IDS-Connect).
- **Heute:**
  - Es gibt keinen Import. Artikel entstehen von Hand oder über „Lieferantenangebot einlesen“ (`scanUebernehmen(b,true)` mit `scanDiffs()`).
  - Die Konditionen stehen in `a.lieferanten[]`, `ean` ist nicht bearbeitbar.
  - Als Vorbild für große Kataloge gibt es den LB-Import (`lbParse` → IndexedDB). Er liest aber mit `file.text()` als UTF-8.
  - **Einen ZIP-Leser gibt es nicht.** `inflate()` ist nur ein Aufruf von `DecompressionStream` für PDF-Streams. Sein Zweig `'deflate-raw'` überspringt 2 Bytes (`u8.subarray(2)`, Z. 2848) und würde rohe ZIP-Einträge beschädigen.
- **Umsetzung:**
  - Datenformat: Datanorm 4 ist Text mit Semikolon. Sätze:
    - V (Vorlauf);
    - A (Artikel, Kurztexte, PE 0–3, Mengeneinheit, Preis, Rabatt- und Warengruppe);
    - B (Matchcode, EAN, VPE, je nach Lieferant Metallgewicht);
    - Langtext;
    - P (Preise);
    - R (Rabatte).
  - Die Feldbelegung von Datanorm 5 und ELDANORM wird vor der Umsetzung an einer echten Lieferantendatei geprüft.
  - **Grundlagen (in Stufe 1 enthalten):**
    - Ein kleiner ZIP-Leser (Local File Header bzw. Central Directory, ca. 20 Zeilen), der `new DecompressionStream('deflate-raw')` direkt auf die Einträge anwendet.
    - Gelesen wird mit `arrayBuffer()` und einer eigenen Zeichentabelle für CP437/850, denn `TextDecoder` kennt diese Codepages nicht.
  - **Stufe 1 (M–L), Preispflege:**
    - Beim Lieferanten „Datanorm einlesen …“ (Datei oder ZIP).
    - Abgeglichen werden nur Artikel mit Art.-Nr. oder EAN bei diesem Lieferanten.
    - Die Tabelle funktioniert wie `scanBox()` mit der Logik von `scanDiffs()` (LP, Rabatt aus Rabattgruppe, EK, PE, Bezeichnung, EAN).
    - Übernommen wird nur, was angehakt ist; danach `l.stand` und `log()`.
  - **Stufe 2 (L), Katalog:**
    - Ablage in IndexedDB (`'dn:'+Lieferant`) mit Suche nach Nr., EAN, Matchcode und Text.
    - Einzelne Artikel lassen sich in den Stamm oder direkt in die Position übernehmen.
    - EAN in `artikelEdit()` bearbeitbar machen.
- **Schalter:** eigener Knopf. Ohne Zustimmung wird nichts geändert, jede Übernahme ist über Strg+Z rücknehmbar, und der Katalog ist löschbar.
- **Datenmodell:** `lieferanten[].rg`, Kontakt `rabattgruppen{RG:%}`, Artikel `pe`/`cu`/`ean`. Der Katalog kommt nie in `erp-daten.json`.
- **Nutzen** hoch · **Aufwand** L (Stufe 1 M–L) · **Abhängig von:** P14 (pe); optional P16 (cu) und P11 (vkAufschlag) · **Recht:** –

### P27 – Frei wählbares Nummernformat (nur auf Wunsch)
- **ETU-Vorbild:** AN2026/0005.
- **Heute:** `nextNr()` und `vorschlagNr()` erzeugen fest `PRÄFIX-JJJJ-0001`. Die Prüfung in `case'nk'` zählt über `b.nr.includes('-'+j+'-')`.
- **Umsetzung:**
  - `erw.nrFormat` mit den Platzhaltern `{P}`, `{JJJJ}`, `{JJ}` und `{N3}`…`{N6}`; `nrBilden(typ,j,n)` wird in `nextNr()` und `vorschlagNr()` verwendet.
  - `case'nk'` zählt künftig über `b.datum.startsWith(j)`.
  - In der Karte Nummernkreise steht ein Live-Beispiel. Das Format muss eine Jahreszahl und `{N…}` enthalten. Sind im laufenden Jahr schon Rechnungsnummern vergeben, kommt eine Rückfrage.
- **Schalter:** `erw.nrFormat` = `'{P}-{JJJJ}-{N4}'` (heutiges Format). Eine Änderung wirkt nur auf künftige Nummern.
- **Datenmodell:** keines (nur die Einstellung).
- **Nutzen** gering · **Aufwand** S · **Abhängig von:** – · **Recht:** Die Nummer muss fortlaufend und einmalig sein (§ 11 Abs. 1 Z 3 lit. h UStG). Ein Formatwechsel am besten zum Jahreswechsel; vergebene Nummern bleiben unverändert (`undoSperre()`).

### P28 – Formular: Briefkopf, Fußzeilenvorlage, vorgedrucktes Briefpapier
- **ETU-Vorbild:**
  - Bild 10, Reiter „Formular“ (Formular „XrptStandard“ im Baum, Bild 8).
  - Bild 9: Logo zentriert, darunter Adresse, Telefon und Mail.
  - Bilder 8/9: Fußzeile mit einer Angabe je Zeile und Beschriftung („Bankverbindung:“, „IBAN:“, „UID-Nr.:“, „Firmenbuch-Nr.:“), ohne Großbuchstaben, „Seite: x / y“ rechts darunter.
- **Heute:**
  - `briefkopf(f)`: Logo fest rechts oben (`.doc .logo{position:absolute;right:0}`) bzw. die Kopfgrafik `KOPF_TBH`.
  - `fussZeilen(f)`: fest 2 Zeilen, in GROSSBUCHSTABEN, getrennt mit „|“.
  - Der Fußraum von 17,3 mm ist an fünf Stellen fest: `papier().hc`, `papierCSS()`, `@page` (Z. 172), `pdfAusBeleg()` (`MB`) und `.pgband`.
  - Einen Modus für vorgedrucktes Briefpapier gibt es nicht.
- **Umsetzung:**
  - `druck.logoPos`:
    - `'rechts'` (heute);
    - `'mitte'`: Logo zentriert, darunter klein „Adresse · Tel. · Mail“ aus der Firma; bei festgeschriebenen Belegen Tel. und Mail aus `b.fix`.
    - Umgesetzt als CSS-Klasse am `.doc`. Adress- und Infoblock rücken nach unten; die Höhe wird in Vorschau, Druck und PDF geprüft.
  - Fußzeilenvorlage in Einstellungen → Firma, `f.fussForm`:
    - `'std'` (heute);
    - `'liste'`: eine Angabe je Zeile mit Beschriftung, ohne Großschreibung, höchstens 3 Zeilen einschließlich Zusatz aus P5, damit der Fußraum reicht. Zum Beispiel:
      - „Bankverbindung: … · IBAN: … · BIC: …“
      - „UID-Nr.: … · Firmenbuch-Nr.: FN … · Firmenbuchgericht: …“
    - Mehr als 3 Zeilen brächten einen größeren Fußraum an allen fünf Stellen mit sich; das ist nicht vorgesehen.
    - Eine Prüfung der Pflichtangaben (Firma, Sitz, FN, Firmenbuchgericht, UID) zeigt einen Hinweis.
    - Eingefroren wird über `b.fix.fz`. Alte Belege ohne `b.fix` ändern ihre Fußzeile mit, so wie heute bei jeder Änderung der Firmendaten.
  - `druck.briefpapier`, nur für `drucken()` und nicht für PDF oder Versand:
    - Kopf und Fußzeile werden nicht gedruckt, der Platz bleibt frei.
    - Bei Rechnungsarten kommt ein Hinweis, dass das Briefpapier die Angaben nach § 14 UGB und die eigene UID enthalten muss.
- **Schalter:** `druck.logoPos` `'rechts'`, `f.fussForm` `'std'` (in `neueDB().settings.firma` ergänzen), `druck.briefpapier` false.
- **Datenmodell:** keines (Einstellungen).
- **Nutzen** mittel · **Aufwand** M · **Abhängig von:** P1, P0 c) und m) · **Recht:** § 14 UGB; eigene UID nach § 11 Abs. 1 Z 3 lit. i UStG.

### P29 – Mehrstufige Gliederung (Los / Gewerk / Titel), nur auf Wunsch
- **ETU-Vorbild:** Bild 10, „Los / Gewerk / Titel / Jumbo: Summe am Anfang / Summe am Ende“; mehrstufiger Baum in der Dokumentenübersicht (Bild 8).
- **Heute:**
  - ERP-Lite kennt nur eine Gruppenebene (`art:'G'`). `gruppenInfo()` ordnet jede Position der letzten Gruppe zu, `posNummern()` erzeugt „1.01“.
  - Das LV kennt LG und ULG, `lvZuAngebot()` macht daraus Textzeilen.
- **Umsetzung:**
  - Gruppen bekommen das Feld `ebene` (1|2, fehlt = 1). Eine Gruppe der Ebene 2 gehört zur vorangehenden Gruppe der Ebene 1.
  - `gruppenInfo()` liefert Summen je Ebene, `posNummern()` „1.2.03“ (bzw. „1.2.3“ mit `nrForm` 'kurz').
  - Summenzeilen gibt es je Ebene. Die Zusammenfassung aus P2 zeigt Ebene 1 mit eingerückter Ebene 2 (`druck.zusEbenen`).
  - `effKz()`, `gruppePreis()`, Pauschalpreis und `ohneEP` vererben über die Ebenen.
  - `lvZuAngebot()`: LG → Ebene 1, ULG → Ebene 2. Die Gliederung (P18) zeigt die Ebenen.
- **Schalter:** `erw.ebenen` false. Ohne Gruppen der Ebene 2 gibt es keinen Unterschied.
- **Datenmodell:** Gruppe `ebene` (optional).
- **Nutzen** gering bis mittel (nur bei großen Angeboten) · **Aufwand** L (berührt `gruppenInfo`, `summen`, `effKz`, `folge`, `revDiff`, Druck und PDF) · **Abhängig von:** P2, P18 · **Recht:** –

---

### Bereits vorhanden (kein eigenes Paket)

| ETU-Funktion | ERP-Lite heute (wo) | Kleine Ergänzung |
|---|---|---|
| Vortext / Nachtext je Beleg, Standard je Belegart | `b.kopf`/`b.fuss`, Vorgabe `S().texte[typ]` (Einstellungen → Nummernkreise), Rich-Text `rte()`, im Blatt `ed('h:fuss')` | Platzhalter (P8), Grußformel (P5) |
| Fußdaten „Fußzeile auf jeder Seite“ je Beleg | – (nur feste Firmenfußzeile) | Zusatzzeile je Beleg über `b.druck.fussZusatz` (P5); Pflichtteil bleibt fest |
| Langtexte drucken | `b.ltDruck`, Vorgabe `S().ltDruck` (Einstellungen → Kaufmännisch), Leiste im Beleg | „nur Langtext“, „Langtext breit“ (P4) |
| Einzelpreise unter Titel ausblenden, Titelpreis | je Gruppe `p.ohneEP` und `p.pauschal` | für alle Gruppen, Striche (P3) |
| Material und Lohn getrennt (nebeneinander) | `b.optLS`, `epL`/`epS`, `summen().lohn/sonst`, „davon Lohn … · Sonstiges …“ | untereinander/aus (P4), Nachweis (P9) |
| Rabatt je Position | `b.optRabatt`, `showRab()`, Kundenrabatt über `konditionenUebernehmen()` | als Text/netto, Zuschlag (P4) |
| Summenblock Netto / USt / Endbetrag | `.tot` in `docHTML` (USt je Satz, Gesamtbetrag fett, Abzüge bei SR) | Beschriftungen, €-Spalte (P3) |
| Summe je Titel | `tr.gsum` „Summe 1 Heizung“ (`gruppenInfo().sumG`) | Zusammenfassung, Anfang/Ende (P2) |
| Infoblock mit Datum, Kunden-Nr., Bindefrist | `info` in `docHTML`: Datum, Kunden-Nr. (ab 10001), „Gültig bis“ (`S().angebotGueltig`, Status „abgelaufen“), Ansprechperson, E-Mail, Telefon | Beleg-Nr. mit Hinweis, Beschriftung (P5) |
| Fußzeile auf jeder Seite (Bank, IBAN, UID, FN, Seite x/y) | `fussZeilen(f)` in Vorschau, Druck und PDF; Firmenbuchgericht nur, wenn `f.gericht` eingetragen ist (heute leer) | Prüfung (P0 m), Zusatzzeile (P5), Vorlage (P28), Schnappschuss (P0 c) |
| Druckvorschau mit Seiten | `vorschauSeiten()`; Ansicht Eingabe/Vorschau/Beides live (`ACT.ansicht`) | Werkzeugleiste (P21) |
| Suche im Dokument (Fernglas) | Browsersuche Strg+F findet Text im Blatt der Vorschau | – |
| Änderungsmodus | `docHTML(b,true)` + `edUebernehmen()`: Betreff, Texte, Bezeichnung, Menge, EP, Rabatt, Lohn/Sonstiges direkt im Blatt; mehr als bei ETU | Schalter (P21) |
| Drucken, PDF, per E-Mail versenden | `drucken()`, `pdfAusBeleg()` ohne Bibliothek (Tabellenkopf wird wiederholt), `versenden()` über Graph `/me/sendMail`; ohne O365 PDF + mailto. Das versendete PDF wird als Anhang abgelegt, `b.versand` protokolliert. | persönliche Anrede in der Mail (P6), Duplikat-Vermerk (P0 n) |
| per HotMail versenden | `versenden()` nutzt den Mandanten aus `odCfg()`, Standard `organizations`, also nur Geschäfts- und Schulkonten. Ein Outlook.com- bzw. Hotmail-Konto geht nur, wenn die App-Registrierung persönliche Microsoft-Konten zulässt und als Mandant `common` bzw. `consumers` eingetragen ist; das betrifft auch die OneDrive-Anmeldung. Sonst bleibt PDF speichern + mailto (öffnet das Standard-Mailprogramm). | Frage 9 |
| Druckformat einstellen | Papierformat `S().papier` (`papier()`, `papierCSS()`) | Druckprofil (P1), Formular (P28) |
| Belegstatus „(Offen)“ | `statusTag(b)` neben dem Belegtitel und in den Listen (Entwurf, offen, angenommen, abgelehnt, abgelaufen, bezahlt, überfällig) | Statuszeile mit Uhrzeit (P19c) |
| Zurück/Vor (Rückgängig) | `merk()`/`UNDO` (50 Schritte), `zurueck()`/`vor()`, Strg+Z/Y, Maustasten 4/5, `undoSperre()`; mehr als bei ETU | Navigations-Pfeile (P19b), optional Verlauf als Liste |
| Startseite (Haus-Symbol) | `#/dash` (`V.dash`) mit Sprung in gefilterte Listen (`zuListe()`) | – |
| Listen (Symbolleiste) | `#/auswertung` (`V.auswertung`) | Sortieren, Summenzeile (P23) |
| Aufschlag aktuell, DB-Anzeige | `kalkBox`/`vorkalk()`: DB II in € und %, Aufschlag auf HK, Fehlbetrag zum Ziel; `dbTag` gegen `S().zielDB2`; Vor- und Nachkalkulation in `V.auftrag`/`V.auftraege`; MGZ | Gesamtkalkulation (P10) |
| Lohngruppen mit EK/VK je Stunde | `S().tarife` (Einstellungen → Stundentarife), Zeiterfassung, `zeitenInPos()` | Lohnkalkulation (P12) |
| Mittellohn | K3-Blätter `k3calc` (ÖNORM B 2061) | Übernahme als Stundentarif (P12) |
| Lieferanten-Art.-Nr. auf Bestellung | `artikel.lieferanten[].artNr` → „(Ihre Art.-Nr. …)“; bei Langtextdruck heute doppelt | Korrektur (P0 j), als Spalte (P4), „Unsere Kunden-Nr.“ (P6) |
| Meine Kontakte / Meine Lieferanten | Menü „Kunden & Lieferanten“, Spalte Typ, getrennte Neuanlage `ACT.knew` | Filter-Chips (P6) |
| Großhandelsdaten übernehmen | Belege einlesen: `belegScan()` → `xmlBeleg()`/`textBeleg()` → `scanBox()`/`scanDiffs()` | Datanorm (P26) |
| Suche | Live-Suche je Liste | globale Suche (P20) |

---

## 4. Empfohlene Reihenfolge

**Sofort (vor allem anderen):** ✅ erledigt (Commit 757b5ed) – P0 a) Doppelte Aktionen `kedit`/`kdel`. Der Fehler ist online. Nach dem Test als eigener Commit direkt nach `main`.

**Stufe 1: schnell und mit hohem Nutzen (ca. 5–6 Tage)**
1. P0 b)–n) Fehlerkorrekturen und Nachdruck-Treue (M)
2. P1 Druckprofil-Grundgerüst (M)
3. P2 Zusammenfassung der Titel und Gruppensummen (S)
4. P5 Infoblock, Grußformel, Fußzeilen-Zusatz, Kostenvoranschlag (S)
5. P14, nur der Teil „Prüfung beim Einlesen“ (behebt den 100-fach zu hohen EP) (S)
6. P11, nur das Popup-Feld „Aufschlag %“ und der VK-Vorschlag bei EK-Änderung (S)
7. P19 a/c/d: Zuletzt, Statuszeile, Markierung in der Seitenleiste (S)
8. P6, nur Kunden/Lieferanten-Filter und „Unsere Kunden-Nr.“ (S)

**Stufe 2: Kernfunktionen nach ETU (ca. 12–13 Tage)**
- P10 Gesamtkalkulation mit Rücknahme (L)
- P12 DB je Stunde und Lohnkalkulation (M)
- P8 Platzhalter (M), danach P9 Lohnkostennachweis (M)
- P6 Anrede und Briefanrede, vollständig (M)
- P3 Schalter für Preise und Summen (S), P4 Spalten und Positionsdarstellung (M–L)
- P14 Preiseinheit, vollständig (M)
- P18 Gliederung (M), P20 globale Suche (M)

**Stufe 3: optional nach Bedarf (ca. 18–21 Tage)**
- P26 Datanorm: Stufe 1 (M–L, mit ZIP-Leser und Zeichentabelle), sobald eine Musterdatei da ist; Stufe 2 (L)
- P13 Kostentrennung und Montagezeit (M–L)
- P15 Mengenformel (M), P16 Metallzuschlag (M), P17 Textergänzungen (S)
- P7 Ansprechpersonen (M)
- P28 Formular: Briefkopf, Fußzeilenvorlage, Briefpapier (M)
- P21 Werkzeugleiste der Vorschau (M), P22 Reiter (M), P23 Listen (M), P19b Vor/Zurück-Pfeile und einklappbare Seitenleiste (S)
- P24 Bilder (M–L), P25 Set-Artikel und LV-Titel (M), P27 Nummernformat (S, nur auf Wunsch)
- P29 Mehrstufige Gliederung (L, nur auf Wunsch)

Jedes Paket wird erst nach Ihrem Test im Browser nach `main` übernommen. Bis dahin lässt sich jedes Paket einzeln per Schalter abschalten oder per `git revert` entfernen.

---

## 5. Nicht empfohlen oder nicht machbar

| Thema | Begründung | Alternative |
|---|---|---|
| **IDS-Connect** (Warenkorb vom Großhändler-Shop empfangen) | Der Shop schickt den Warenkorb per Formular-POST an eine Rücksprung-Adresse, und GitHub Pages nimmt kein POST an (405). Es ginge nur mit einem Service Worker (`sw.js`); das ist eine Ausnahme von der Ein-Datei-Regel und braucht Ihre Freigabe. Außerdem muss der Großhändler die Software freischalten. Nur „Senden“ ginge, bringt allein aber wenig. | Warenkorb im Shop als Datei (CSV/Datanorm/PDF) exportieren und über „Lieferantenangebot einlesen“ übernehmen; später P26 |
| Ganze Fußzeile je Beleg frei bearbeitbar (ETU „Fußdaten“) | § 14 UGB verlangt vollständige Angaben auf allen Geschäftsbriefen. Die eigene UID steht in ERP-Lite nur in der Fußzeile, nicht im Infoblock (§ 11 Abs. 1 Z 3 lit. i UStG). Ein frei überschreibbarer Pflichtteil könnte beides verlieren. | Pflichtteil fest, frei änderbar nur der Zusatz `b.druck.fussZusatz` (P5); das deckt die ETU-Fußdaten weitgehend ab |
| ETU-Fußzeile unverändert übernehmen | Sie nennt die FN ohne Firmenbuchgericht; § 14 UGB verlangt beides | Prüfung der Pflichtangaben (P0 m), Vorlage (P28) |
| Zeile „Geräte“ bzw. neue Positionsart | Berührt `ART`, `fibuAuto` und den Druck; für Elektrotechnik, Handel und Sachverständigenleistungen kaum relevant | Zeile „Fremdleistung“ in P10; notfalls Artikelkennzeichen `geraet` (`erw.gkGeraet` false) |
| Interne Kalkulation (Aufschlag auf EK, DB) auf den Kundenbeleg drucken | Interne Kalkulation geht den Kunden nichts an | nur in Editor und Dialog (P10, P11). Einen für den Kunden sichtbaren „Aufschlag je Position“ (Zuschlag) sieht P4 vor. |
| Rohstoffzuschlag als eigenes Positionsfeld mit Änderung an `posGP()`/`summen()` | Großer Eingriff in Summen, Folgebelege und Teillieferungen | Zuschlag im EP mit eingefrorenem `p.mz` (P16) |
| Gesamtpreise oder Summenblock bei Rechnungen abschalten | Entgelt, Steuersatz und Steuerbetrag sind Pflichtangaben (§ 11 Abs. 1 Z 3 lit. e/f UStG) | in `dOpt()` gesperrt; Einzelpreise ausblenden ist erlaubt (P3) |
| DEL-Notiz automatisch abrufen | Keine Quelle, die der Browser abrufen darf (CORS) | Eingabe in den Einstellungen bzw. Übernahme aus Rechnung oder Datanorm |
| Datanorm-Vollkatalog in `erp-daten.json` | 0,5–1 Mio. Artikel bzw. 100 MB und mehr; das würde Abgleich (`merge3`), Rückgängig (`UNDO`) und OneDrive-Speicherung sprengen | nur in der Browser-Datenbank (IndexedDB), P26 Stufe 2 |
| Bilder in `erp-daten.json` | `UNDO` hält bis zu 50 vollständige DB-Stände; am Handy Speicherprobleme | Dateien im OneDrive bzw. Ordner mit IndexedDB-Zwischenspeicher (P24) |
| Gerichtsstand gegenüber Verbrauchern; AGB-Hinweis nur auf Rechnungen | Gerichtsstand gegenüber Verbrauchern: § 14 KSchG. AGB müssen vor oder bei Vertragsschluss vereinbart werden (§§ 861 ff. ABGB); ungewöhnliche Klauseln: § 864a ABGB; Verbraucher: § 6 KSchG | `fussNurB2B` und ein eigenes Profil für AN/AB (P5) |
| Reiter „Drucker“: Druckerwahl, Kopienzahl | Im Browser nicht steuerbar, `window.print()` öffnet immer den Druckdialog | Druckdialog des Browsers; Kennzeichnung von Zweitausfertigungen über „Duplikat“ (P0 n) |
| Ränder frei einstellbar | Das Layout wird in A4-mm gemessen; die Ränder stehen an fünf Stellen (`papier().hc`, `papierCSS()`, `@page`, `pdfAusBeleg`, `.pgband`). Hohes Risiko abweichender Seitenumbrüche. | Papierformat (vorhanden), Briefpapier-Modus (P28) |
| Mehrseitenansicht und Hand-Werkzeug in der Vorschau | Das Blatt ist ein durchgehender Block mit Seitenbändern; Scrollen bzw. Wischen reicht | Zoom „Ganze Seite“ (P21) |
| Änderungsmodus als neue Funktion | Gibt es schon, und er kann mehr als bei ETU | nur ein Schalter (P21) |

---

## Entscheidungen des Anwenders (08.10.2026)
- **Umfang:** Stufe 1 umsetzen (P0 b–n, P1, P2, P5, P14 nur Prüfung beim Einlesen, P11 nur Aufschlag % im Pop-up, P19 a/c/d, P6 nur Filter und „Unsere Kunden-Nr.“).
- **Gesamtkalkulation (P10, später):** proportional als Standard; einheitlicher Aufschlag im Dialog wählbar.
- **Lohnkostennachweis (P9, später):** nur auf Wunsch je Beleg (Standard aus).
- **Briefanrede (P6, später):** österreichische Form „Sehr geehrter Herr Ing. Mustermann,“, je Kontakt überschreibbar.
- Noch offen: Firmenbuchgericht (Frage 8), Duplikat-Vermerk Standard (bis zur Antwort aus), Fragen 5, 6, 7, 9, 10, 11.

## 6. Offene Fragen

1. **Umfang und Arbeitsweise:** Soll ich zuerst P0 a) als Sofortkorrektur umsetzen und danach Stufe 1 wie beschrieben (Zweig `main-b4f5uz` (Pull Request #1), Tag `vor-etu`, ein Commit je Paket, Übernahme nach `main` erst nach Ihrem Test)?
   *Vorschlag:* Ja.
2. **Lohnkostennachweis (P9):** Soll der Satz zu den Arbeitskosten immer, nur bei Privatkunden oder nur auf Wunsch je Beleg gedruckt werden? Soll der Lohn nur aus der Aufteilung Lohn/Sonstiges kommen oder auch automatisch aus den Positionen der Art „Leistung“? Brauchen Sie für Förderungen eine abweichende Leistungs- bzw. Objektadresse am Verkaufsbeleg?
   *Vorschlag:* nur bei Privatkunden (`'privat'`), Quelle `'art'` ohne Fahrtzeit, im Profil für AN, AB, RE und SR. Die Leistungsadresse kommt erst dazu, wenn eine Neuauflage des Handwerkerbonus sie verlangt.
3. **Gesamtkalkulation (P10/P12):** Soll die Neukalkulation standardmäßig proportional verteilen, sodass die Preisverhältnisse bleiben, oder wie ETU mit einheitlichem Aufschlag auf den EK rechnen? Welche Werte gelten für Mindest- und Kalk.-DB je Stunde?
   *Vorschlag:* proportional als Standard, der Aufschlag ist im Dialog wählbar. Kalk.-DB/Std = Verkauf − Kostensatz Ihres Haupttarifs; den Mindest-DB/Std geben Sie vor.
4. **Briefanrede (P6):** österreichisch „Sehr geehrter Herr Ing. Mustermann,“ (mit Titel, ohne Vorname) oder wie bei ETU „Sehr geehrter Hr. Max Mustermann,“?
   *Vorschlag:* die österreichische Form. Im Kontakt kann `briefAnrede` sie je Kontakt überschreiben.
5. **Großhandel (P26/P16):** Welche Großhändler nutzen Sie, und liefern diese Datanorm- oder ELDANORM-Dateien? Brauchen Sie den Kupferzuschlag regelmäßig in Angeboten?
   *Vorschlag:* Schicken Sie eine Musterdatei eines Großhändlers (sie wird nicht ins Repository übernommen), dann setze ich P26 Stufe 1 um. Den Metallzuschlag würde ich zurückstellen, bis der Bedarf bestätigt ist.
6. **Bedienung (P22):** Wollen Sie Reiter wie bei ETU oder die lange Belegseite behalten, ergänzt um Gliederung und Statuszeile?
   *Vorschlag:* zuerst Gliederung (P18) und Statuszeile (P19). Reiter später als Option, Standard aus.
7. **Zuschlag je Position (P4):** Brauchen Sie einen für den Kunden sichtbaren Zuschlag je Position, z. B. für Erschwernis, Kleinmengen oder Nachtarbeit, wie ETU „Aufschlag je Position“?
   *Vorschlag:* nur bei Bedarf einschalten (`erw.zuschlag`).
8. **Pflichtangaben und Duplikat (P0 m/n):** Ist das Firmenbuchgericht der TBH GmbH das Landesgericht Wiener Neustadt? Soll eine erneute Ausgabe einer Rechnung als „DUPLIKAT“ gekennzeichnet werden?
   *Vorschlag:* Gericht in den Einstellungen eintragen; Duplikat einschalten.
9. **E-Mail-Versand:** Versenden Sie über ein Microsoft-365-Firmenkonto oder auch über ein privates Outlook.com- bzw. Hotmail-Konto (ETU „per HotMail versenden“)?
   *Vorschlag:* beim Firmenkonto bleiben. Ein Privatkonto bräuchte eine geänderte App-Registrierung, und der Mandant `common` gälte dann auch für die OneDrive-Anmeldung.
10. **Briefbild (P28/P29):** Wollen Sie das Logo zentriert wie bei ETU, eine Fußzeile mit Beschriftungen statt Großbuchstaben, einen Modus für vorgedrucktes Briefpapier? Brauchen Sie mehr als eine Gliederungsebene (Los/Gewerk/Titel)?
    *Vorschlag:* Logo und Fußzeile nach Ihrer Wahl in Stufe 3; die mehrstufige Gliederung nur, wenn Sie große, mehrstufige Angebote erstellen.
11. **Weitere Screenshots:** Der Inhalt der ETU-Reiter „Angebotsdaten“ und „Erweitert…“ (Bild 11), „Weitere Einstellungen…“ (Bild 10) sowie der Reiter „Drucker“ und „Formular“ ist auf den Bildern nicht zu sehen. Können Sie diese nachreichen?
    *Vorschlag:* Ja, dann ergänze ich den Vorschlag gezielt.