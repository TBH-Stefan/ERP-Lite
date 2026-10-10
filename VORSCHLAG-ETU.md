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

1. **Ein Ort für alle Schalter:** Einstellungen → neue Karte **„Erweiterungen“**. ✅ Grundgerüst umgesetzt (Commit 4094cd5): Karte mit Liste, Abweichungsanzeige und Zurücksetzen, `ERW`/`ERW_STD`/`erw()`, Pfad-Setter mit Zwischenobjekten und `data-t="b"`, `formDialog` mit `dis:true`; Druckprofil ✅ mit P1 (Commit d5237b2).
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
     - Damit ein Commit auch ohne die späteren einzeln rücknehmbar bleibt, liegen die Änderungen verschiedener Commits nicht in unmittelbar benachbarten Zeilen (sonst meldet `git revert` einen Konflikt). Die Karte „Erweiterungen“ ordnet die Pakete deshalb nach Nummer (Commit 05429d5), neue Schalter stehen an getrennten Stellen in `ERW`. Geprüft für U5: jeder Commit einzeln per `git revert` sauber rücknehmbar, Programm danach ohne Konsolenfehler. Für Stufe 1 gesamt gilt die Rücknahme-Reihenfolge in Abschnitt 4 (einige Commits bauen auf späteren Zeilen bzw. Funktionen auf).
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
  - **PDF-Tabellenkopf:** `pdfAusBeleg()` ordnet an zwei Stellen alles mit `closest('table.p thead')` dem Kopf zu: Flächen, Linien und Bilder sowie Text. Damit wird auch der Kopf der Optionen-Tabelle erfasst. Auf Folgeseiten der Haupttabelle (`s.off`) wird er verschoben um `y−thTop` gezeichnet und fehlt an seiner richtigen Stelle. Das ist aus dem Code gelesen und im Browser noch zu bestätigen. *Bestätigt am 08.10.2026: Der Kopf der Optionen-Tabelle wurde auf Folgeseiten außerhalb der Seite gezeichnet und fehlte über der Tabelle.*
  - **Summenblock:** Im Druck gilt für `.tot` `break-inside:avoid`. `vorschauSeiten()` teilt aber die Zeilen jeder Tabelle, und die Umbruchliste `brk` in `pdfAusBeleg` enthält `tbody>tr`. Vorschau und PDF können den Summenblock deshalb teilen, der Druck nicht.
  - **Firmenbuchgericht:** `fussZeilen()` druckt es nur, wenn `f.gericht` gesetzt ist. `FIRMA_TBH` (Z. 396) enthält kein `gericht`.
  - **Zweitausfertigungen** von Rechnungen tragen keinen Vermerk (kein Treffer für „Duplikat“).
- **Umsetzung** (jeder Buchstabe ein eigener Commit):
  - a) ✅ **Erledigt** (Commit 757b5ed, Namen `kpneu`/`kpedit`/`kpdel`). **Aktionen der Laufenden Kosten umbenennen** in `kkedit`/`kkdel`, in `ACT` und in `V.kosten` (Z. 1669, 1672, 1675, 1686). Vor jedem Commit kurz prüfen, dass keine Aktionsnamen doppelt vorkommen (`grep`). Test: Kundendaten im Beleg bearbeiten, Kontakt löschen, Kostenposition bearbeiten und löschen.
  - b) ✅ umgesetzt (Commit af99b8d). **Druckvorbereitung an einer Stelle:**
    - `druckVorbereiten(b)` wird aus `drucken()` ausgelagert. Es setzt papierCSS, `#print`, `.mb`, `#pgfuss` und den Titel bei jedem Druck neu.
    - `druckHTML()` leert `.mb` und `#pgfuss`.
    - Strg+P auf der Route `beleg`: `preventDefault()` im `keydown`-Handler, danach `drucken(curBeleg())`.
    - Druck über das Browsermenü: `beforeprint` füllt `#print` aus dem aktuellen Beleg, wenn `drucken()`/`druckHTML()` ihn nicht gerade befüllt haben (Merker `DRUCK`). Außerhalb der Route `beleg` wird `#print` geleert.
    - `#print` wird **nicht** in `afterprint` geleert, denn Android und iOS lösen `afterprint` je nach Browser sofort oder gar nicht aus, das gäbe leere Ausdrucke. Geleert wird beim nächsten Routenwechsel im `hashchange`-Handler.
    - Test am Desktop (Chrome, Edge, Firefox), unter Android und unter iOS.
  - c) ✅ umgesetzt (Commit f6526f9; `belegFix()`, `fixAktiv()`, `stDef()`, `ftZeilen()`; Bestellungen: zusätzlich `b.fix.lnr` = Stamm-Art.-Nr. beim Festschreiben, im Entwurf Rückfall auf `p.einkauf.artNr` nur beim selben Lieferanten). **Nachdruck-Treue:**
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
  - d) ✅ umgesetzt (Commit a86ff40; gesperrt sind auch Code und Löschen, `stGesperrt()`; nutzt `steuerCodes()` aus c), Rücknahme daher vor c). **Steuersätze schützen:** `case'st'` sperrt `satz`, `bez` und `hinweis` von Codes, die in festgeschriebenen Belegen verwendet werden, wie heute schon den Code. Dazu der Hinweis „Für einen neuen Satz einen neuen Code anlegen“. Das schützt auch FiBu und UVA alter Rechnungen, die nicht über `b.fix` laufen.
  - e) ✅ umgesetzt (Commit 1c61540). `duplizieren()` übernimmt `optLS`, `optRabatt` und `ltDruck`.
  - f) ✅ umgesetzt (Commit a57eace; Zahlungsziel 0 Tage bleibt 0, Skonto und Kundenrabatt wie bei der Kontaktwahl im Beleg). `ACT.kbel` ruft `konditionenUebernehmen(b,k)` auf.
  - g) ✅ umgesetzt (Commit 1da5180; bei `optLS` `epS=r2(ep−epL)`, damit `ep = epL+epS` trotz Rundung; Positionen ohne `epL`/`epS` unverändert). `onPos('einheit')` rechnet `epL` und `epS` mit demselben Faktor um. P13 ergänzt `ekL` und `zeit`.
  - h) ✅ umgesetzt (Commit 5c2836b; Lohn höchstens bis zum neuen EP, kein negativer Sonstiges-Wert; Positionen ohne Werte wie beim Einschalten der Spalten vorbelegt). `posArtikelPopup`: Bei `optLS` setzt Übernehmen `epS=r2(ep−(+p.epL||0))`.
  - i) ✅ umgesetzt (Commit 6147889; zusätzlich `erledigung()`, sonst bliebe ein Auftrag mit Optionsgruppe „teilweise“; Hinweis in `festschreiben()` unverändert, greift weiter über den Gruppenkopf). `lagerBeiFest()` und `folge()` verwenden `effKz(p,gruppenInfo(b))` statt `p.kz`. Die Ausnahme AN→AB/PR in `folge()` bleibt. Ebenso der Hinweis in `festschreiben()` „Rechnung enthält Options-/Alternativpositionen“.
  - j) ✅ umgesetzt (Commit 7de8798; beim Artikelwechsel wird die Nummer des bisherigen Artikels entfernt, beim Lieferantenwechsel in `onHead()` ersetzt; Tabellen-Editor zeigt „Lief.: …“). `artikelInPos()` schreibt die Lieferanten-Art.-Nr. künftig in `p.lnr` und nicht mehr in `p.text`. Alte Positionen bleiben unverändert; P4 kann die Zeile im Druck ausblenden.
  - k) ✅ umgesetzt (Commit fbdaef7). `pdfAusBeleg()`: `const kopfH=box.querySelector('table.p thead')` wird einmal bestimmt. An beiden Stellen gilt dann `el.closest('thead')===kopfH` bzw. `pe.closest('thead')===kopfH`. Bekannte Einschränkung: Eine mehrseitige Optionen-Tabelle bekommt auf der Folgeseite keinen wiederholten Kopf.
  - l) ✅ umgesetzt (Commit 66bc2b7). **Nur `table.p` wird zeilenweise geteilt:** in `vorschauSeiten()` `c.matches('table.p')` statt `table`, in `brk` `table.p tbody>tr:not(.grpz)`. `.tot` und die neue Zusammenfassung (P2) bleiben in Vorschau und PDF ein Block, wie im Druck. Bei bestehenden Belegen ändert sich dadurch nur die Stelle eines Seitenumbruchs, wenn der Summenblock genau auf der Seitengrenze liegt; der Inhalt bleibt gleich.
  - m) ✅ umgesetzt (Commit abdf44c; nichts eingetragen, `FIRMA_TBH` unverändert). **Pflichtangaben prüfen:** Hinweis in Einstellungen → Firma und vor dem Festschreiben von Rechnungen, wenn `f.gericht`, `f.fn` oder `f.uid` leer ist.
    - Das Firmenbuchgericht tragen Sie in den Einstellungen ein. Vermutlich ist es das LG Wiener Neustadt; bitte bestätigen.
    - Ein Eintrag in `FIRMA_TBH` ist nur optional. `migrate()` füllt leere Firmenfelder aus `FIRMA_TBH` und ändert damit auch Nachdrucke alter Belege ohne `b.fix`.
  - n) ✅ umgesetzt (Commit 24362bd; Standard aus; Druck über das Browsermenü kennzeichnet ohne Rückfrage, da dort kein Dialog möglich ist; ändert dieselben Druckfunktionen wie c), Rücknahme daher vor c)). **Vermerk „DUPLIKAT“** (Schalter):
    - Der Zähler `b.ausgaben` zählt Druck, PDF und Versand festgeschriebener Belege der Arten `RE_V`. Bei alten Belegen zählt `b.versand.length` mit.
    - Er wird nach der Ausgabe per `commit()` erhöht.
    - Ab der zweiten Ausgabe fragt ein Dialog „Als DUPLIKAT kennzeichnen?“ (vorbelegt Ja). `docHTML` setzt den Vermerk dann über den Titel.
    - Das erste Original bleibt unverändert.
  - o) ✅ umgesetzt (Commits 2498cb0, 04c1ad1, d477ebc; je Punkt ein Commit, Fehlerbehebungen ohne Schalter). **Restfehler aus Stufe 1:**
    - a) Lohn/Sonstiges (Commit 2498cb0): Bei `b.optLS` setzen `artikelInPos()`, `ACT.hset` (Preisverlauf), `ACT.padd` und zusätzlich `zeitenInPos()` („+ Stunden aus Zeiterfassung“) auch `epL`/`epS` über `lsAufteilen(b,p,q)`, Aufteilung wie `onHead('optLS')`: Art L ganz auf Lohn, sonst ganz auf Sonstiges. `preisHistorie()` gibt `epL`/`epS` des Quellbelegs nur mit, wenn dort `optLS` aktiv war (sonst können die Felder veraltet sein); übernommen wird der Lohn (höchstens EP), der Rest geht auf Sonstiges. Ohne `optLS` unverändert (keine Felder).
    - b) Optionen/Alternativen über `effKz(p,gruppenInfo(b))` (Commit 04c1ad1): `offeneLS()`, `sammelRechnung()`, „Umsatz nach Artikel/Leistung“ in `V.auswertung`, Hinweis „Preis 0“ in `festschreiben()` und zusätzlich der Hinweis „Positionen ohne EK“ in `kalkBox()` (wie `vorkalk()`). Die Prüfung Reverse Charge / ig. Lieferung läuft über die verrechneten Steuercodes `s.steuern` aus `summen()` (dieselbe Quelle wie der Steuerhinweis im Ausdruck); damit wird auch eine Pauschalgruppe mit RC/IGL geprüft und eine Position einer Optionsgruppe nicht. Der Hinweis „Rechnung enthält Options-/Alternativpositionen“ bleibt (greift über den Gruppenkopf).
    - c) `merge3()` (Commit d477ebc): keine Konfliktmeldung „Einstellungen“, wenn lokal und entfernt gleich sind, auch wenn beide von der Basis abweichen (z. B. beide gleich geändert oder nach einem Programm-Update durch `migrate()` gleich ergänzt; die Basis wird unverändert aus `STORE.lastText` gelesen). Verschiedene Änderungen melden weiter „Einstellungen“, Zähler wie bisher per Maximum.
    - Offen: Positionen in Pauschalgruppen zählen in „Umsatz nach Artikel“ weiter mit ihrem Positionspreis (statt des Gruppenpreises) und lösen „Preis 0“ aus, wenn sie ohne Preis erfasst sind; reine Zähler-Unterschiede (Nummernkreise, Kontakt-/Artikelnummern) melden beim Abgleich weiter „Einstellungen“; Positionen aus „Belege einlesen“ bekommen bei `optLS` noch keine Aufteilung.
- **Schalter:**
  - `erw.strgP` = true und `erw.snapshot` = true. Beide beheben einen Fehler bzw. stellen die Nachdruck-Treue her.
  - `erw.duplikat` = true (vom Anwender am 09.10.2026 so entschieden).
  - Alle anderen Punkte sind reine Fehlerbehebungen ohne Schalter und lassen sich per `git revert` zurücknehmen; f)–i) und o) einzeln, j) erst nach o) a, d) und e) erst nach P1 (benachbarte Zeilen), c) erst nach j) (`lnrStamm()`), siehe Rücknahme-Reihenfolge in Abschnitt 4.
- **Datenmodell:** Beleg `fix` (wird beim Festschreiben gesetzt) und `ausgaben` (Zähler); Position `lnr` (gibt es schon). Alle Felder sind optional.
- **Nutzen** hoch · **Aufwand** M (die Einzelkorrekturen jeweils S oder kleiner) · **Abhängig von:** – · **Recht:**
  - DSGVO: kein fremder Beleg im Ausdruck.
  - Der Nachdruck entspricht danach weitgehend dem Original; das Logo wird nicht eingefroren. Maßgebliches Original im Sinn der BAO bleibt das versendete PDF, das `versenden()` schon heute unverändert über `anhaengeHochladen(…,true)` ablegt.
  - Unveränderbarkeit festgeschriebener Rechnungen samt Steuersatz: § 11 UStG, § 131 BAO.
  - Ohne Vermerk kann eine zweite gleichlautende Rechnung eine zusätzliche Steuerschuld kraft Rechnungslegung auslösen (§ 11 Abs. 12 bzw. 14 UStG). Deshalb ist der Vermerk „Duplikat“ üblich.
  - § 14 UGB verlangt das Firmenbuchgericht.

### P1 – Druckprofil je Belegart (Grundgerüst)
- **Stand:** ✅ umgesetzt (Commit d5237b2). Abweichungen vom Plan: Die Optionsliste heißt `DRUCKOPT` (`DRUCK` ist schon der Druck-Merker aus P0 b); Felder je Belegart über `nur`/`preis` (`dGilt()`). `preise`/`summen` stehen bereits in `DRUCK_STD` und werden bei `RE_V` über `DRUCK_RE` erzwungen, als Felder erscheinen sie erst mit P3. Der Knopf „Druckoptionen …“/„Druckformat …“ erscheint nur bei eingeschaltetem Schalter und vorhandenen Optionen, bei festgeschriebenen Belegen ist er gesperrt. Die Unterkarte speichert nur Abweichungen (Standardwert löscht den Schlüssel) und zeigt Hinweise widersprüchlicher Einstellungen (`warn`). `formDialog()` bekam Platzhalter, Zeichenzähler, Beschreibung, Hinweiszeilen, dritten Knopf und Bildlauf. Korrektur nach Prüfung: `folge()` übernimmt `b.druck` nicht in Bestellungen (BE) an den Lieferanten.
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
- **Stand:** ✅ umgesetzt (Commit 2dc2fa0). `'immer'` = ab einer Gruppe; Options- und Alternativgruppen behalten bei `grpSumme='aus'` ihre Summe am Ende (sie fehlen in der Zusammenfassung); leere Beschriftung = Standard; „keine“ ohne Zusammenfassung ergibt im Dialog eine Rückfrage und in der Unterkarte einen Hinweis.
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
- **Stand:** ✅ umgesetzt (Commit 06ffa33, Einheit U9). Abweichungen vom Plan: Die Überschrift ist ein freier Text `druck.titel` (z. B. „PREISANFRAGE“, „LEISTUNGSBESCHREIBUNG“) für AN, AB, PR, LS, BE und WE, nicht bei Rechnungsarten; Nummer, Nummernkreis und Dateiname bleiben. „Als Einheitspreis“ (`nullMenge:'ep'`) gilt nicht bei Rechnungsarten (dort wie „drucken“), Striche stehen dann auch im Gesamtpreis. Ohne Preise werden Optionen und Alternativen weiter (ohne Preise und ohne den Zusatz „nicht in der Gesamtsumme enthalten“) gedruckt. Im Editor (Tabelle, einzeilige Zeile, Karten) sind nicht gedruckte Positionen und Gruppen grau mit „wird nicht gedruckt“ markiert (`ndSet()`, `updateCalc()` schaltet beim Ändern der Menge um). Korrektur: `dProfil()` zeigt bei Rechnungsarten die gesperrten Werte wie gedruckt (sonst stand nach „auf alle Rechnungsarten übertragen“ eines Profils ohne Preise ein gesperrtes, leeres Häkchen). Test: `docHTML`, Vorschau und PDF mit Standardeinstellungen 30/30 gleich, Funktionstest bei 390 und 1400 px ohne Fehler.
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
- **Stand:** ✅ umgesetzt in zwei Commits (Einheit U9): Spalten 8a9b49b, Positionsdarstellung und `erw.zuschlag` 1d7338f. Abweichungen vom Plan:
  - `spEinheit` aus setzt die Einheit in die Mengenspalte („40 Stk“), statt sie wegzulassen; so bleibt die Menge eindeutig. `spMenge` ist bei Rechnungsarten über `DRUCK_RE` gesperrt.
  - `artNr:'spalte'`: Spaltenkopf „Art.-Nr.“, im Einkauf die Lieferanten-Art.-Nr. (sonst die eigene); bei „Menge vorn“ steht die Spalte vor der Bezeichnung (wie ETU). Die Langtextzeile „Ihre Art.-Nr.: …“ älterer Einkaufspositionen entfällt nur im Druck (`ohneIAN()`), in der bearbeitbaren Vorschau bleibt der Langtext unverändert (sonst würde ihn schon ein Klick ins Feld ändern).
  - Klassen statt `nth-child` nur bei abweichender Spaltenfolge (`table.p.sp`, Zellen `pn`/`an`/`bz`, Kopf `l`/`n`); im Standard bleibt das HTML byte-gleich.
  - `nrForm` wirkt über `posNummern(b,kurz)` mit der Vorgabe aus `dOpt(b)` auch im Editor.
  - `zusForm`: Standard `'spalte'` = wie bisher negativ in der Rabattspalte („-10 %“), damit bestehende Belege gleich aussehen; „+10 %“ ist die Auswahl `'plus'` (Spaltenkopf „Rab./Zuschl. %“ bzw. „Zuschlag %“), dazu `'text'` (Kleinzeile `zusTxt`).
  - `lsForm:'aus'` lässt auch „davon Lohn … · Sonstiges …“ im Summenblock weg; `kurz` aus druckt den Langtext in normaler Schrift (`.lt.lk`); `grpFarbe` nur als #RRGGBB (sonst Standardfarbe und Hinweis); `rabForm:'netto'` mit Hinweis auf die Cent-Rundung.
  - Langtext breit: `tr.ltz` nach `tr.mlt`; `vorschauSeiten()` nimmt die Positionszeile mit, `brk` in `pdfAusBeleg()` schließt `tr.mlt` aus, im Druck `break-after:avoid`.
  - `erw.zuschlag` (Standard aus) ändert nur die Beschriftung im Editor („Rabatt/Zuschlag %“ mit Hinweis „−10 = 10 % Zuschlag“, Karte „+ 10 % Zuschlag“, Häkchen „Spalte Rabatt/Zuschlag“). Auswertungen summieren keine Positionsrabatte (geprüft), daher keine Anpassung.
  - Test: `docHTML`, Vorschau und PDF mit Standardeinstellungen 30/30 gleich; je Variante stimmt die Spaltenzahl jeder Zeile mit dem Kopf überein; Langtext breit in einem fünfseitigen Angebot in Vorschau und PDF nie von seiner Position getrennt; Funktionstest bei 390 und 1400 px ohne Fehler.
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
- **Stand:** ✅ umgesetzt (Commit 7bca588). Beschriftung der Nummer je Belegart (`NRL`: Angebots-, Auftrags-, Rechnungs-, Gutschrift-, Bestell-Nr. …). Der KV-Text steht nach den Zahlungsbedingungen. Die Kundenart wird schon jetzt in `adressSnapshot()` gespeichert (Teil von P6; nach Prüfung korrigiert: immer, `''` = Unternehmen, sonst las der Nachdruck bei Kontakten ohne Kundenart den aktuellen Kontakt), ältere festgeschriebene Belege lesen sie aus dem Kontakt. Zusatzzeile: 90 Zeichen gemischte Schreibung ≈ 320 pt, nur Großbuchstaben ≈ 414 pt (Abstand zur Seitenzahl dann noch ca. 10 pt im PDF, 13 pt im Druck); ab ca. 400 pt Breite erscheint ein Hinweis (`fzBreite()`), die Seitenzahl bleibt an ihrem Platz.
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
- **Stand:** ✅ Teil umgesetzt (Commit 072ff14): Kunden/Lieferanten-Filter und „Unsere Kunden-Nr.“. Chips mit Anzahl über `erw.kFilter` (Standard ein = „Alle“, aus = Liste und Suche wie bisher), Suche zusätzlich in `zusatz`, `email`, `tel`, `kdNrLief`, Spalte „Unsere Kd.-Nr.“ (`std:false`); `erw.navKL` (Standard aus) wirkt nur mit `kFilter`. `adressSnapshot()` speichert `kdNrLief` nur, wenn eingetragen; Infoblock aller Einkaufsbelege (BE, WE, ER) „Unsere Kunden-Nr.“ statt „Lieferanten-Nr.“, festgeschriebene nur aus dem Schnappschuss (ältere unverändert); die Lieferanten-Karte im Beleg zeigt die Nummer. ✅ Rest umgesetzt (Commit 570074f, Einheit U10, 10.10.2026): Kontaktfelder `anrede`, `titel`, `vorname`, `nachname`, `titelNach`, `briefAnrede` (leere Felder werden nicht angelegt; im Pop-up ohne kompakt nach „Name / Firma“, in kompakt als zuklappbarer Abschnitt am Ende, im Kontakt als Abschnitt „Person und Briefanrede“ mit Vorschau der automatischen Anrede), `ANR`, `persName()`, `briefAnrede()`, Schnappschuss nur mit eingetragenen Feldern, `druck.adrAnrede`/`druck.briefAnrede` (Standard aus), Feld „Briefanrede“ mit „↻ aus Kontakt“, Vorschau-Feld `h:anrede`, E-Mail, Übernahme in Folgebeleg/Duplikat/Revision, `revDiff()`, Rückfrage nach „✎ Kundendaten bearbeiten“, Spalte „Person“ (`std:false`) und Suche nach der Person. Abweichungen vom Plan: `b.anrede` speichert nur eine eigene Anrede; fehlt es, gilt die automatische aus Kontakt bzw. Adress-Schnappschuss (dadurch keine Vorbelegung in `neuBeleg()`/`onHead()` nötig, ein Kontaktwechsel ändert die automatische Anrede sofort; eine eigene Anrede bleibt nur auf Rückfrage). Im Adressblock steht bei Privatkunden mit Nachname der Personenname (Titel, Vor- und Nachname, nachgestellter Titel) statt des Kontaktnamens. Der Favoritenstern (optional) ist nicht umgesetzt.
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
- **Stand:** ✅ umgesetzt (Commit f385ffd, Einheit U10, 10.10.2026). `PLATZH`, `phWerte(b,s)`, `phT()`/`phH()`, aufgelöst in `docHTML` (Kopf-/Fußtext und Briefanrede über `edP()` mit `data-roh`, Grußformel, Kostenvoranschlag, Fußzeilen-Zusatz), in `mailVorlage()` und beim Versenden; Knopf „{…} Platzhalter“ als Pop-up (`menuePop`, im Beleg mit den aktuellen Werten) im Beleg unter Kopf-/Fußtext, bei den Standardtexten, im Druckprofil und in der E-Mail-Vorlage. Abweichungen vom Plan: zusätzlich `{Person}`; neue optionale Einstellung `S().mailVorlage {betreff,text}` (Einstellungen → „E-Mail-Vorlage“, leer = bisheriger Standardtext), damit Platzhalter in der E-Mail nutzbar sind; die Texte aus P2/P4 behalten ihre eigenen Platzhalter ({Nr}, {Bez}, {Rabatt} …); keine eigene Karte „Belegtexte“ (optional). Ein Vorschau-Feld wird nach dem Verlassen neu gezeichnet, „{…} Platzhalter“ fügt dann am Ende des Formularfelds ein. Lohnwerte ({Lohn} …) kommen mit P9.
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
- **Stand:** ✅ umgesetzt (Commit 395368b, Einheit U10, 10.10.2026) nach der Entscheidung des Anwenders: nur auf Wunsch je Beleg (Häkchen „Lohnkostennachweis“ in der Spaltenleiste bzw. „Spalten & Druck …“ = Abweichung `b.druck.lohnNw`), als Vorgabe je Belegart im Druckprofil möglich, Standard `'ls'` = wie bisher. `lohnAnteil()`, `lohnPh()` ({Lohn}, {LohnUSt}, {LohnBrutto}, {Material} auch in den übrigen Texten), `lnwInfo()` in den Summen (Lohnkosten, Hinweise kein Lohn / Pauschalgruppen / kein Privatkunde), `p.ohneLohnNw` im Positions- und Artikel-Pop-up, Tarif `lohnNw` (Spalte „Lohnnachweis“, Pop-up am Handy). Abweichungen vom Plan: `druck.lohnQuelle` Standard `'ls'` (ohne Lohn / Sonstiges die Positionen der Art „Leistung“); die Tarif-Ausnahmen werden beim Festschreiben in `b.fix.lnwAus` eingefroren (sonst änderte ein später geänderter Tarif den Nachdruck); die Position wird über `p.tarif||p.nr` dem Tarif zugeordnet (Stunden aus der Zeiterfassung haben das Kürzel als Art.-Nr.); `'aus'` blendet zusätzlich „davon Lohn … · Sonstiges …“ aus; ohne gedruckte Preise kein Satz.
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
- **Stand:** ✅ Teil umgesetzt (Commit 3e041e7, dazu Korrektur 8452dbd: `.modal` scrollbar, weil das Artikel-Pop-up am Handy höher als der Bildschirm war): Pop-up-Feld „Aufschlag %“ (`erw.gkAufsFeld`, Formel mit Kundenrabatt, nie gespeichert) und VK-Vorschlag. Abweichung: eigener Schalter `erw.vkVorschlag` (Standard ein) für Artikelfeld `vkAufschlag` und Vorschlag; außer in `scanDiffs()` (Zeile `vk`, Standard angehakt, gerechnet aus dem neuen EK bzw. den Herstellkosten; übernommen wird der angezeigte Wert, auch wenn der EK selbst abgewählt ist – Korrektur Commit 724e6b0) erscheint er im Artikel als Knopf „VK-Vorschlag … übernehmen“ (statt Rückfrage beim Speichern). Offen: Spalten „Aufschl. %“/„DB %“ im Editor (`b.optKalk`).
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
- **Stand:** ✅ Prüfung beim Einlesen umgesetzt (Commit d926b4e, Schalter `erw.scanPE`, Standard ein): `scanPE()`; mit GP entscheidet nur die Prüfung (auch Faktor mit Rabatt, ±2 %), ohne GP Spalte `pe` bzw. Spaltenkopf „Preis/100“; passt der GP zu keinem Faktor, wird nicht umgerechnet, sondern die Zeile markiert. Scan-Zeile `pe`, `peQ`, `epRoh`, `lpRoh`, Abwahl `peAus`; `rp()` schon jetzt für EK-Vorschlag/Übernahme bei PE > 1, `fmtP()` für die Anzeige. Dazu Korrektur (Commit bec643e): `edUebernehmen()` schreibt Zahlen nur bei echter Änderung gegenüber dem angezeigten (gerundeten) Wert, ein Klick in den EP der Vorschau kürzt 0,4537 nicht mehr auf 0,45. Offen (Stufe 2): Feld `pe` an Artikel und Position, Anzeige/Druck je PE (bis dahin druckt eine Bestellung aus eingelesenen Zeilen den EP auf Cent gerundet, z. B. 0,45 bei GP 113,43), Umstellung der übrigen Rundungsstellen, `xmlBeleg()`.
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
- **Stand:** ✅ a) umgesetzt (Commit 506e52e), c) (Commit 2aa2bf6), d) Markierung (Commit 2b77577). a) Knopf „🕘 Zuletzt ▾“ in der Seitenleiste, 🕘 in der `.topbar`; der geöffnete Datensatz selbst steht nicht in der Liste. c) Statuszeile unter der `kopfbar`: Belegdatum und „angelegt {erstellt mit Uhrzeit}“ bzw. „festgeschrieben {festAm}“ getrennt; der Status steht weiter neben dem Titel und nur bei `erw.kopfFix` (fixierte Zeile mit Nummer) zusätzlich in der Zeile; Netto über `updateCalc()`. d) zusätzlich Kontakt → „Kunden & Lieferanten“, Auftrag → „Aufträge & DB II“. Offen: b) Vor/Zurück-Pfeile und einklappbare Seitenleiste (Stufe 3).
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

### P30 – Kompakte App- und Web-Ansicht
- **Stand:** Konzept vom 09.10.2026. ✅ U7 umgesetzt am 09.10.2026 (Commits 7acb6e1, 4e15709, 439ca23, 7160459, 050e6d5, 56f4235, 89025f2; Ergebnisse und Abweichungen unter „Stand U7“ bei der Umsetzung). ✅ U8 umgesetzt am 09.10.2026 (Commits fcfbee7, 8311235, f974f09, d1dc351, 281c9b9, c5a105f; Ergebnisse und Abweichungen unter „Stand U8“), die optionalen LV-Positionen als Karten (U8 Commit 7) sind offen. Grundlage sind zwei Analysen der Oberfläche mit Testdaten: Handy 390 × 844 und 360 × 740 px, Bildschirm 1400 × 900 und 1024 × 768 px. Gemessen wurden Seitenüberlauf, innere Bildläufe, Tippziele und die Lage wichtiger Elemente. Zeilenangaben (Z.) in diesem Paket beziehen sich auf Commit c9703e5.
- **Entscheidung des Anwenders (09.10.2026):** Die App-Ansicht am Handy ist überladen und soll kompakter werden, damit man besser bearbeiten kann. Die Web-Ansicht wird ebenfalls geprüft, wo nötig mit Pop-up-Fenstern. Die kompakte Ansicht ist ausdrücklich gewünscht: Schalter `erw.kompakt`, **Standard ein**, abschaltbar (aus = bisherige Darstellung). Das ist eine begründete Ausnahme von Abschnitt 2 Nr. 2: Es ändert sich nur die Bildschirmdarstellung, kein Beleg, kein Ausdruck und kein Rechenweg.
- **Ziel:**
  - Am Handy stehen die wichtigste Information und die Hauptaktion ohne Wischen und ohne langes Scrollen bereit.
  - Gleichzeitig sind weniger Bedienelemente sichtbar; Seltenes liegt in Menüs und Pop-ups.
  - Tippziele sind mindestens 40 px groß, und keine Seite ist breiter als der Bildschirm.
  - Am Bildschirm gelten dieselben Muster dort, wo sie Platz und Klicks sparen: Beleg-Editor, festgeschriebene Belege, Kosten, Lager, Kontenplan, Einstellungen.
- **Heute:**
  - **Fehler (unabhängig vom Schalter):**
    1. **Seitenüberlauf:**
       - Ursache: Die Spalten von `.cols` (Z. 130 `1fr 340px`, mobil `1fr!important` Z. 159) haben kein `min-width:0` und nehmen deshalb die Mindestbreite breiter Tabellen an. Tabellen in Karten haben meist keinen eigenen Bildlauf.
       - Handy: 8 Ansichten sind breiter als 390 px, nämlich Überblick 469, Rechnung mit Zahlungen 415, Zu verrechnen 668, Auftrag 541, Laufende Kosten 434, Artikel 540, Export 415 und Einstellungen 469 px.
       - Folge: Der Browser verkleinert die ganze Seite auf 58–94 %. Pop-ups werden abgeschnitten, z. B. „Anlegen“ in „Neuer Kunde“ im Überblick oder „Lagerplatz wählen“ im Artikel.
       - Bildschirm: Das Angebot ist bei 1400 px 1457 px breit, die Summenspalte ist um 57 px abgeschnitten. Bei 1024 px ist es 1103 px breit.
    2. **Abgeschnittene Reiter:** `.seg{overflow:hidden}` (Z. 21). Am Handy sind folgende Reiter nicht erreichbar:
       - FiBu (Z. 2729): UVA (teilweise), GuV, Bilanz, Kontenplan und Einstellungen;
       - K-Blatt (Z. 2198): K4, K5, K6 und „Vergleich / Prüfung“.
    3. **Leiste „Ungespeicherte Änderungen“** (`#dirtybar`, Z. 53/56): Bei 390 px ragt „Speichern“ rechts aus der Leiste.
    4. **Schmale Felder:** `.row>label.w05` (Z. 118) ist spezifischer als die Mobil-Regel `.row>label` (Z. 157). Am Handy stehen deshalb drei schmale Felder je Zeile, und Datumswerte werden abgeschnitten („10/10/202…“).
    5. **Liste „Zuletzt“** (`zuletztPop()`, Z. 1132): Sie hat keine Höhenbegrenzung. Bei 900 px Fensterhöhe sind das Listenende und „Liste leeren“ nicht erreichbar.
  - **Überladung am Handy:**
    - **Angebot-Entwurf** (3 Gruppen, 12 Positionen):
      - Höhe 5867 px, das sind 7 Bildschirme (bei 360 × 740 px 8,1).
      - 235 Bedienelemente, davon 223 kleiner als 40 px.
      - Die erste Position steht bei y = 906, die Summen erst bei y = 5207.
      - Die Kopfleiste hat 9–14 Aktionen in 4–6 Zeilen, „Löschen“ steht gleichrangig neben „Duplizieren“.
      - Jede Position braucht 250–290 px mit 12 Feldern und 5 Knöpfen; leere „Langtext …“-Felder sind immer sichtbar.
    - **Festgeschriebene Belege** erscheinen als Formular mit 66–112 gesperrten Feldern. Die Zahlungserfassung einer offenen Rechnung liegt bei y = 2605, unter allen Positionen.
    - **Belegliste:** Vor dem ersten Beleg stehen ca. 600 px Bedienelemente (9 Neu-Knöpfe, 11 Typ-Chips, 4 Auswahllisten, Suche). Den Status sieht man nur durch Wischen.
    - **Weitere Listen:** In Kontakten sind die Offenen Posten verdeckt, in Artikeln Preise und Bestand, in Zeiten die Stunden, in Laufenden Kosten der Knopf „Buchen“. Im Lager steht je Zeile eine unlesbare Lagerplatz-Auswahl.
    - **Einstellungen:** 10,7 Handy-Bildschirme, jeder Schalter mit langem Hilfetext.
    - **Tippziele:** `button.s` 23 px (✕, ↑↓, ⚙, „Buchen“, „+ Zeile“), Positionsfelder 25–27 px, Chips 29 px, Links in Statuszeile und Kartenköpfen 15–17 px, Artikel-Häkchen 13 px.
  - **Bildschirm:**
    - Listen und Auswertungen sind gut bedienbar.
    - Überladen sind:
      - der Beleg-Editor in Eingabe und Beides: Einheit zeigt „S“, USt „20 ⁰“, das EK-Feld ist 25 px breit, die Summen scrollen weg;
      - festgeschriebene Belege;
      - Laufende Kosten mit 37 Fälligkeiten untereinander;
      - Lager, LV-Positionen und Kontenplan;
      - Einstellungen mit 5,7 Bildschirmen.
    - Die Ansicht „Beides“ ist bei 1024 px nicht bedienbar (linke Spalte 377 px), weil `ansicht()` (Z. 1364) erst unter 1000 px umschaltet.
- **Grundsätze:**
  - **Schalter:**
    - `erw.kompakt` (Standard ein) gilt für alle Ansichten (U7).
    - `erw.kompaktBeleg` (Standard ein) gilt für den Beleg-Editor (U8) und wirkt nur zusammen mit `erw.kompakt`.
    - Paket `'Ansicht (P30)'`: Die Karte „Erweiterungen“ ordnet es nach P19 ein. Die Einträge stehen an eigenen Stellen in `ERW`.
  - **CSS:**
    - `render()` setzt `document.body.classList.toggle('kompakt',erw('kompakt'))`, wie bei `navkl` und `zlaus`.
    - Regeln, die bestehende Elemente anders darstellen, stehen nur unter `body.kompakt …`:
      - für das Handy in `@media(max-width:760px)`;
      - für Touch-Geräte (Tablet) in `@media(pointer:coarse)`;
      - für alle Breiten ohne Media Query.
    - Neue Bausteine bekommen eigene Klassen (`.kk`, `.akk`, `.ih`, `.aktl`, `.mehr`). Deren Regeln wirken nur dort, wo das neue Markup erzeugt wird.
    - Jeder Commit hat einen eigenen CSS-Block mit dem Kommentar `/* Kompakt (P30) … */`.
  - **JS:**
    - Verzweigt wird nur über `kmp()` = `erw('kompakt')` und `kmpH()` = `kmp()&&HANDY.matches`, mit `const HANDY=matchMedia('(max-width:760px)')` (dieselbe Grenze wie im CSS). Im Beleg kommt `erw('kompaktBeleg')` dazu.
    - Wechselt die Breite über die Grenze (Handy gedreht, Fenstergröße geändert), zeichnet ein `change`-Listener auf `HANDY` neu (`render()`, nicht bei offenem `.modal`).
  - **Ohne Schalter bleibt das HTML gleich:** Mit `erw.kompakt=false` liefern alle Ansichten dasselbe `#main.innerHTML` wie vorher. Es wirken nur die Fehlerbehebungen, und die sind reines CSS.
  - **Nur Darstellung:**
    - Es gibt keine neuen Datenfelder.
    - Unverändert bleiben `docHTML()`, `summen()`, `vorschauSeiten()`, `drucken()`, `pdfAusBeleg()`, `persist()`/`commit()`, `merge3()` und der Verlauf.
    - Alle Aktionen laufen über vorhandene `ACT`-Einträge, über `onPos()`/`onHead()` und über die Setter im `change`-Handler. Damit bleiben Rechenwege und Rückgängig-Schritte gleich.
    - Zustände je Gerät liegen nur im localStorage, gelesen und geschrieben über `lsGet`/`lsSet`: `erp-akk` (geöffnete Abschnitte).
  - **Neue `ACT`-Schlüssel** (geprüft, noch nicht vergeben, auch nicht in `ACT_LV`, `ACT_LB`, `ACT_FB`): `menue`, `fweg`, `pneu`, `pbear`, `kopfd`, `zpop`, `sumpop`, `lgpop`, `plt`. Vor jedem Commit wird auf doppelte Schlüssel geprüft.
- **Bausteine (wiederverwendbar):**
  - **B1 ⋯-Menü** `menuePop(btn,eintraege)`:
    - Vorbild ist `zuletztPop()`: `.pop`, geschlossen wird über `closePop()`, Esc und Klick daneben.
    - Einträge `{l,ic,act,d:{…},value,dis,titel,gefahr,trenn,sub,datei:{id,accept}}`:
      - Normale Einträge werden Knöpfe mit `data-act` und rufen vorhandene Aktionen auf.
      - `sub` ergibt ein Untermenü, z. B. „Folgebeleg ▸“ mit `<button data-act="folge" value="AB">` statt einer Auswahlliste.
      - `datei` ergibt `<label class="btn"><input type="file" id="lsscan" …>`. Der `change`-Handler (Z. 4075) erkennt die IDs `lsscan`/`erfoto`/`bescan` schon. Die IDs bleiben eindeutig, weil die Knöpfe in kompakt nur im Menü stehen. Das Menü schließt erst nach der Dateiauswahl (wegen iOS).
      - Gefährliche Einträge (Löschen, Stornieren) stehen abgesetzt am Ende, in Rot.
    - Die Menüs werden je Ansicht als `MENUE.<name>=…` direkt neben der Ansicht definiert. Auslöser: `<button class="mehr" data-act="menue" data-m="beleg">⋯</button>`, 40 × 40 px.
    - Breite `min(320px, clientWidth − 16)` über `document.documentElement.clientWidth`. Am Handy erscheint das Menü als Blatt am unteren Rand.
    - In kompakt liegt `.pop` über `.modal` (z-index). So sind Menüs und Preisverlauf auch aus einem Pop-up heraus sichtbar.
  - **B2 Dialoge als Blatt von unten** (nur CSS, kein HTML wird geändert):
    - Am Handy gilt `.modal{align-items:flex-end;padding:0}` und `.mbox{max-width:none;max-height:92dvh;overflow:auto;border-radius:12px 12px 0 0}`. Die Inline-Höhe aus `formDialog({scroll})` wird dabei übersteuert.
    - In allen Breiten sind Titel (`.mbox>h2:first-child`) und Knopfleiste (`.mbox>.bar:last-child`) `position:sticky`. „OK“ bzw. „Übernehmen“ ist damit immer sichtbar.
    - Das wirkt auf `dialog()`, `formDialog()` (und damit `kontaktPopup()`, `artikelPopup()`, `kostenDialog()`, `druckDialog()`), `frageSpeichern()`, `posArtikelPopup()`, `spaltenDialog()`, `dupFrage()`, `baumWahl()` und `lagerMatrix()`. Je Dialog ist zu prüfen, ob die Knopfleiste das letzte `.bar` der `.mbox` ist.
    - `formDialog()` bekommt in kompakt:
      - den Feldtyp `'abschnitt'` (`{typ:'abschnitt',l,zu}`): ohne kompakt wie heute eine fette Hinweiszeile, mit kompakt der Beginn eines zuklappbaren Abschnitts;
      - `info` hinter ⓘ (siehe B6);
      - Häkchen als Zeile „☐ Titel“;
      - die Feldoption `im` für `inputmode`: `numeric` für PLZ und Zahlungsziel, `decimal` für Beträge; als `type` `tel` bzw. `email`.
  - **B3 Karten statt Tabellen:**
    - `karte({t,s,u,z,b})` liefert ein `<div class="kk">`:
      - Zeile 1: Titel `t` fett links, Status bzw. Tag `s` rechts;
      - Zeile 2: Unterzeile `u` grau, einzeilig gekürzt;
      - Zeile 3: Zusatz `z` klein links, Betrag `b` fett rechts.
    - `tabelle()` (Z. 2788) bekommt am Handy einen Kartenmodus:
      - Spalten erhalten optional `m:'t'|'s'|'u'|'z'|'b'`. Mehrere Spalten mit demselben Platz werden mit „ · “ verbunden.
      - Optional `mf(r)` für eine eigene Kartendarstellung, z. B. die Nummer ohne die Unterzeile „AN · Datum“.
      - Je Zeile wird eine Zelle `td.kk` mit der Karte erzeugt, unabhängig von der Spaltenauswahl.
      - `zeile` (Tippziel), `vor`, `nach`, `zwischen` und `fuss` (Summenzeile) bleiben erhalten.
      - Kopfzeile und ⚙ entfallen am Handy; die Spaltenauswahl bleibt am Bildschirm.
      - Ohne `m`-Angaben bleibt es eine Tabelle mit Bildlauf.
    - `karte()` dient auch für Listen ohne `tabelle()`: Überblick, Belege im Kontakt und im Auftrag, Zahlungen, Fälligkeiten, Verrechnung, Journal, Protokoll.
    - Die ganze Karte ist das Tippziel (mindestens 48 px hoch). Das Löschen-✕ steht nie in der Karte, sondern im ⋯ bzw. im Bearbeiten-Pop-up.
  - **B4 Filter-Pop-up:**
    - Am Handy ersetzt der Knopf „Filter (n) ▾“ neben dem Suchfeld die Auswahllisten und Chips.
    - Er öffnet `formDialog()` (siehe B2) mit den bisherigen Filtern als Feldern: z. B. Belegart, Jahr, Quartal, Monat, Status; Gruppe über `baumWahl`; deaktivierte Artikel.
    - „Anzeigen“ schreibt die `UI`-Schlüssel und zeichnet neu, „Zurücksetzen“ leert sie.
    - Über der Liste stehen die aktiven Filter als Chips mit ✕ (`ACT.fweg`, `data-f` = `UI`-Schlüssel).
    - Suchfeld und Live-Suche bleiben unverändert, ebenso die `UI`-Schlüssel.
  - **B5 Akkordeon** `akk(id,titel,inhalt,{offen,zusatz})` erzeugt `<details class="akk" data-akk="id"><summary>…</summary>…</details>`:
    - Der Zustand gilt je Gerät (`erp-akk`, Liste der geöffneten IDs). Er wird beim Zeichnen gelesen und über einen `toggle`-Listener in der Capture-Phase geschrieben, denn `toggle` steigt nicht auf.
    - So übersteht er auch das Neuzeichnen einzelner Teile, z. B. `dpSetzen()` → `dpKarte()`.
    - Die Kopfzeile zeigt eine Zusammenfassung, z. B. „Zahlungsbedingungen · 14 Tage · 2 % Skonto 10 Tage“.
    - Ohne kompakt wird nur der Inhalt ausgegeben, wie bisher.
  - **B6 ⓘ-Hilfe** `hilfe(text)`: Lange Erklärtexte stehen in kompakt als `<details class="ih"><summary>ⓘ</summary>…</details>` hinter dem Titel; ohne kompakt bleibt der Text wie bisher. Betroffen sind `p.mut` in Kosten, Aufträgen, Verrechnung, K-Blättern, Einstellungen und Erweiterungen sowie die Texte unter den Feldern der Druckoptionen.
  - **B7 Kennzahlen** (nur CSS):
    - Am Handy wird `.grid` mit `.kpi` zweispaltig (`repeat(2,minmax(0,1fr))`, Wert 17 px, Zusatzzeile einzeilig gekürzt). Das spart im Überblick ca. 400 px.
    - Am Bildschirm `minmax(170px,1fr)` mit weniger Innenabstand: 7 Kacheln passen bei 1400 px in eine Zeile.
  - **B8 Aktionsleiste unten** `.aktl` (U8):
    - Links steht die Summe; Tippen öffnet ein Pop-up mit `sumBox()` und `kalkBox()`. Rechts steht die Hauptaktion.
    - Am Handy sitzt sie fest am unteren Rand. Ist `#dirtybar` sichtbar, rückt sie darüber (`body:has(#dirtybar) .aktl`), und `main` bekommt unten den nötigen Abstand.
    - Später lässt sie sich auch in der Zeiterfassung nutzen („Erfassen“).
  - **B9 Bearbeiten-Pop-up mit Live-Feldern** `livePop(titel,inhalt,{verwerfen})`:
    - Ein `.modal`, dessen Felder dieselben Attribute tragen wie die bisherigen Formulare: `data-p`/`data-f`, `data-h`, `data-o`/`data-i`, `data-ed`.
    - Der vorhandene `change`-Handler bzw. `edUebernehmen()` schreibt die Werte: `onPos()`, `onHead()` und die Setter `case'st'`, `'tf'`, `'nk'`, `'tx'`, `'k'`, `'al'`, `'fbk'`, `'path'`. Es gibt also keine doppelte Logik, und jede Änderung ist ein `persist()`-Schritt (Strg+Z).
    - Nach jeder Änderung zeichnet das Pop-up seinen Inhalt neu, und zwar nach dem globalen Handler (`setTimeout 0`); der Fokus bleibt im Pop-up. `render()` schließt kein `.modal`.
    - Knöpfe:
      - „Fertig“;
      - optional „Änderungen verwerfen“: stellt den beim Öffnen gemerkten Stand in einem `persist()`-Schritt wieder her.
    - Danach folgt `render()`.
  - **Tippziele, Abstände, Schrift** (CSS in kompakt):
    - Am Handy sind `button`, `.btn`, `select` und `input` (außer Häkchen) mindestens 40 px hoch, `button.s` mindestens 40 × 36 px. Häkchen 20 px, Chips 36 px, Abstand zwischen Symbolknöpfen mindestens 8 px.
    - Kartenköpfe mit „→“ sind als ganze Zeile tippbar.
    - `main` und `.card` haben 10 px Innenabstand, Karten 10 px Abstand zueinander.
    - Die Eingabeschrift bleibt bei 16 px, sonst zoomt iOS.
    - Auf Tablets (`pointer:coarse`) gelten ebenfalls 40 px; am Bildschirm mit Maus bleibt alles wie bisher.
    - Die Seitenleiste bekommt bei niedriger Fensterhöhe geringere Abstände; bei 768 px ist heute der Speicherstatus abgeschnitten.
  - **Kopfzeile einer Ansicht:** Titel links, rechts eine Hauptaktion und „⋯“ bzw. „+ Neu ▾“. Alles Seltene liegt im Menü: Löschen, Kopie, Verwaltung, Drucken bei Listen.
- **Ansichten:** „Handy“ heißt bis 760 px. Die Spalte „Bildschirm“ nennt, was sich mit `erw.kompakt` auch am Desktop ändert; alles andere bleibt dort wie bisher. Den Beleg beschreibt der folgende Abschnitt.

| Ansicht | Handy | Bildschirm | Funktionen |
|---|---|---|---|
| Überblick | Schnellknöpfe in einer Zeile: „+ Neu ▾“ (Angebot, Lieferschein, Rechnung, weitere Belegarten), „📷 Einlesen ▾“ (Lieferschein, Eingangsrechnung, Lieferantenangebot), „⏱ Zeit“. Kennzahlen zweispaltig. Leere Listen zu einer Zeile zusammengefasst („Nichts überfällig · keine fälligen Eingangsrechnungen“). Listen als Karten | Einlesen als ein Menü, dadurch 5 Schnellknöpfe in einer Zeile; Kennzahlen in einer Zeile | `V.dash`, `liste()`, `MENUE.neu`, `MENUE.einlesen` |
| Verkauf, Einkauf | „+ Neu ▾“ (Belegarten mit Piktogramm, „RE aus LS …“) und im Einkauf „📷 Einlesen ▾“ neben der Überschrift. Suche und Filter-Pop-up (Belegart, Jahr, Quartal, Monat, Status), aktive Filter als Chips. Karten: Nummer bzw. „Entwurf“ mit Status; Kunde · Betreff; Datum · Art links, Brutto/Offen rechts. Gruppen-Knopf „+2“ und Projektname als 40-px-Ziele | „Neu:“-Reihe als „+ Neu ▾“, Typ-Chips einzeilig, Nummer ohne Zeilenumbruch | `V.belege`, `tabelle()`, `grpAuf()`, `projektName()` |
| Kunden & Lieferanten | Chips bleiben (36 px hoch), „+ Neu ▾“ (Kunde, Lieferant). Karten: Name; Nr. · PLZ Ort; Tags Kunde/Lieferant/Privat; Offene Posten rechts als „Forderung“ bzw. „Verbindlichkeit“ | Chips, Suche und Knöpfe in einer Zeile | `V.kontakte` |
| Kontakt | Visitenkarte statt Formular: Adresse, 📞 `tel:`-Link, ✉ `mailto:`-Link, UID, Konditionen in einer Zeile. „✎ Bearbeiten“ öffnet das bisherige Formular als Live-Pop-up (B9, Setter `'k'`, samt Prüfung der Nummer). Sichtbar bleiben „+ Angebot/+ Rechnung“ bzw. „+ Bestellung/+ Eingangsrechnung“, „Löschen“ liegt im ⋯. Belege als Karten, darüber die Summe offener Posten | gleich wie am Handy | `V.kontakt` |
| Artikel | Karten: Nr. und Bezeichnung; Gruppe · Lagerplatz · Bestand; VK rechts (EK klein). Filter-Pop-up (Gruppe, deaktivierte). Im ⋯: „Gruppen verwalten“ und „Auswählen“; Mehrfachauswahl nur in diesem Modus, mit den Aktionen Gruppe zuordnen, Deaktivieren und Löschen in einer Leiste unten | Gruppe nur mit der letzten Ebene (ganzer Pfad als `title`), Häkchen-Zelle als 32-px-Ziel | `V.artikel` |
| Artikel-Detail | Abschnitte als Akkordeon: Stammdaten (offen); Preise (EK, HK, VK, Aufschlag, VK-Vorschlag); Lager (Bestand, Ø-EK und Lagerwert als Text statt gesperrter Felder). Lieferanten als Karten mit ✎-Pop-up (B9, Setter `'al'`) und „+ Lieferant“. „Löschen“ im ⋯ | Akkordeon; Lieferanten-Tabelle bleibt | `artikelEdit()` |
| Lager | „± Bestand buchen …“ öffnet ein Pop-up mit den bisherigen Feldern und IDs (`lg-…`), gebucht wird unverändert über `ACT.lgbook`; aus einer Karte heraus mit vorbelegtem Artikel. Karten: Artikel, Lagerplatz als Text, Bestand und Einheit rechts (rot unter Mindestbestand). Lagerplatz ändern über ⋯ → `baumWahl('lp',…)` statt einer Auswahlliste je Zeile. Lagerwert gesamt als Kennzahl. Bewegungen als Akkordeon (zu, 20 Einträge + „mehr“). Filter-Pop-up; „Lagerplätze …“ und „▦ Matrix …“ im ⋯ | Korrektur als Pop-up-Knopf, Lagerplatz als Text mit ✎, Bewegungen als Akkordeon | `V.lager` |
| Zeiterfassung | Das Formular bleibt, denn es ist die typische Handy-Aufgabe. Stunden in voller Breite mit Schnellwahl 0,5/1/2/4/8 h, Auftrag kurz (Nr. · Kunde). Liste nach Tag gruppiert als Karten („Tarif · 6 h · Tätigkeit“, Auftrag kurz, Status). Löschen im ⋯ | Auftrag kurz, voller Text als `title` | `V.zeiten` |
| Laufende Kosten | Kennzahlen zweispaltig, Erklärtext hinter ⓘ. „Fällig & demnächst“ als Karten mit sichtbarem Knopf „Buchen“ (40 px), überfällige rot. „Abgaben & Löhne“ als Menü „Buchungshilfen ▾“ (Lohnbuchung, USt-Zahllast, Zahlung Abgaben), die Salden als Akkordeon. Register als Akkordeon je Kategorie (Kopf: Kategorie · € je Monat), Positionen als Karten; Tippen öffnet `kostenDialog()`, Löschen im ⋯. Jahresübersicht als Akkordeon | Abschnitte als Akkordeon („Fällig“ offen), Fälligkeiten je Kostenposition zusammengefasst (Einzeltermine aufklappbar) | `V.kosten` |
| Zu verrechnen | Je Auftrag eine Karte; Kopf: Auftrag · Kunde mit „→ Rechnung erstellen“. Darunter je Wareneingang eine Zwischenzeile (Lieferant · LS-Nr.) und die Positionen als Zeilen („Art.-Nr. Bezeichnung · 25 m offen · 172,50 €“). „nicht verrechnen“ im ⋯, Erklärtext hinter ⓘ | Zwischenzeile je Wareneingang statt eigener Spalte | `V.verrechnung` |
| Aufträge, Auftrag | Karten: Nr. mit Phase; Kunde · Betreff; DB II Vorkalkulation/Ist als Tags. Im Auftrag: Kennzahlen 2 × 2 (Umsatz, Herstellkosten, DB II Vorkalkulation, DB II Ist), Belege und Stunden als Karten (ohne Spalte Partner). Hauptknopf „Zeiten abrechnen“, „+ Bestellung“ und „+ Eingangsrechnung“ im Menü „+ ▾“ | Erklärtext hinter ⓘ | `V.auftraege`, `V.auftrag` |
| Auswertung | Abschnitte als Akkordeon: Umsatz & USt, Aufträge, Kunden & Artikel, Skonto, Offene Posten. Kennzahlen zweispaltig. Monate ohne Werte ausgeblendet (Umschalter „alle Monate“), Hinweise hinter ⓘ | gleich wie am Handy | `V.auswertung` |
| LV, K-Blätter, Textbausteine | Listen als Karten. LV-Kopf als Zusammenfassung (Titel, Auftraggeber, Datum) im Akkordeon, Reiter direkt unter dem Titel. Reiter der K-Blätter umbrechend (Fehler 2). LV-Positionen als Karten mit Pop-up nach dem Muster aus U8 (optional, U8 Commit 7) | LV-Kopf nach dem Anlegen zugeklappt | `V.lvs`, `lvEdit()`, `V.kbs`, `V.lvbib` |
| FiBu | Reiter umbrechend (Fehler 2). Journal als Karten: Datum und Beleg, Text, „Soll an Haben“, Betrag rechts. Kontenplan als Leseliste mit Suche; Tippen öffnet ein ✎-Pop-up (B9, Setter `'fbk'`), gelöscht wird nur dort (`fbkdel`) | Kontenplan als Leseliste je Kontenklasse (Akkordeon) mit ✎-Pop-up | `V.fibu`, `ACT_FB` |
| Export | Protokoll als Akkordeon (zu, 20 Einträge + „mehr“) mit Karten. Ein leerer Papierkorb braucht nur eine Zeile | gleich wie am Handy | `V.export` |
| Einstellungen | Akkordeon je Abschnitt (Firma, Belege einlesen, Kaufmännisch, Steuersätze, Stundentarife, Nummernkreise & Texte, Erweiterungen, Druck & Belegdarstellung), Zustand je Gerät. Steuersätze, Tarife und Nummernkreise als Karten mit ✎-Pop-up (B9; Setter `'st'` samt `stGesperrt()`, `'tf'`, `'nk'`, `'tx'`; Kopf- und Fußtext als volle Textfelder). Erweiterungen: je Schalter eine Zeile „☐ Titel (Standard: ein)“, Hilfetext hinter ⓘ, Paket als Akkordeon (offen, wenn es vom Standard abweicht), „Standard wiederherstellen“ im Paketkopf. Druckprofil je Gruppe als Akkordeon. Lange Texte (KI-Schlüssel) hinter ⓘ | Akkordeon und ⓘ ebenso; Tabellen bleiben, Kopf- und Fußtext der Nummernkreise über „Texte …“ (Pop-up) | `V.einstellungen`, `erwKarte()`, `dpKarte()` |
| Pop-ups | Blatt von unten mit stets sichtbaren Knöpfen (B2). Druckoptionen mit den Gruppen (P2, P5 …) als Akkordeon und Hilfetexten hinter ⓘ. Kontakt- und Kostendialog mit zuklappbaren Abschnitten „Konditionen“ bzw. „Buchhaltung“. ▲▼ in der Spaltenauswahl als 40-px-Ziele | Knöpfe immer sichtbar, Abschnitte zuklappbar | `formDialog()`, `druckDialog()`, `kontaktPopup()`, `kostenDialog()`, `spaltenDialog()` |

- **Beleg-Editor (U8, `erw.kompaktBeleg`):**
  - **Kopfleiste** (`kopfbar`, Z. 1290):
    - Titel und Status stehen in einer Zeile. Darunter folgen Eingabe | Vorschau, eine Hauptaktion und „⋯“.
    - Die Hauptaktion hängt vom Zustand ab:
      - Entwurf: „Festschreiben …“;
      - offene Rechnung: „💶 Zahlung erfassen …“;
      - festgeschriebenes AN, AB, LS oder PR: der nächste Folgebeleg („→ Auftragsbestätigung“ bzw. „→ Rechnung“);
      - sonst „PDF / Drucken“.
    - `MENUE.beleg` enthält:
      - PDF / Drucken, PDF speichern, Senden … (nicht bei WE und ER);
      - → Rechnung, Folgebeleg ▸, Sammelrechnung … (bei LS);
      - „Spalten & Druck …“: ein Live-Pop-up mit den bisherigen `data-h`-Häkchen Rabatt, Lohn / Sonstiges und Langtext drucken, dazu „Druckoptionen …“;
      - Duplizieren;
      - beim festgeschriebenen Angebot „Neue Revision bearbeiten“ (`anrev`), „Folgeangebot“, „abgelehnt“ bzw. „wieder offen“;
      - „Wieder öffnen“ (`reopen`, anders beschriftet als die Revision);
      - abgesetzt am Ende „Löschen“ bzw. „Stornieren“.
    - Am Bildschirm sind zusätzlich „PDF / Drucken“ und „→ Rechnung“ sichtbar, der Rest liegt im ⋯. Die Leiste passt so auch bei 1024 px in eine Zeile.
  - **Kopfdaten** (`formHTML`, Z. 1304):
    - **Handy:**
      - Eine Zusammenfassung in drei Zeilen: Kunde · Ort (mit Hinweis „fehlt: …“); Datum · Gültig bis bzw. Liefertermin; Betreff · Bezug.
      - „✎“ öffnet das Live-Pop-up „Kopfdaten“ (`ACT.kopfd`) mit denselben Feldern (`data-h`). Dazu werden die Felder in die Hilfsfunktion `kopfFelder(b)` ausgelagert; ohne Schalter bleibt das HTML byte-gleich.
      - Ein neuer Beleg ohne Kunde zeigt das Formular offen, wie bisher.
      - „Zahlungsbedingungen“ und „Kopf-/Fußtext“ stehen als Akkordeon (zu) mit Zusammenfassung. Kopf- und Fußtext stehen untereinander in voller Breite.
    - **Bildschirm:** Kunde, Datum, Gültig bis, Betreff und Bezug bleiben als Formular; Zahlungsbedingungen und Kopf-/Fußtext werden zum Akkordeon.
    - Die Leiste „Spalten einblenden …“ (Z. 1330) entfällt in kompakt (stattdessen ⋯ → „Spalten & Druck …“), bei festgeschriebenen Belegen ganz.
  - **Positionen am Handy** (Z. 1260–1285):
    - **Karten** (ca. 56–64 px hoch):
      - Pos-Nr. und Bezeichnung fett, GP rechts (bei Pauschalgruppen in Klammern).
      - Darunter „40 Stk × 189,00“, bei Rabatt „− 10 %“, bei Lohn/Sonstiges „L 12,00 + S 30,00“.
      - Tags: Option/Alternative (über `effKz`), Art Leistung/Fremdleistung, USt nur bei Abweichung vom Standard, im Einkauf „Lief.: …“.
      - Der Langtext steht einzeilig gekürzt darunter.
    - **Pop-up „Position bearbeiten“** (Live-Pop-up `posPopup(b,i)`, `ACT.pbear`), geöffnet durch Tippen auf die Karte:
      - alle Felder der Zeile: Art, Artikel (mit Vorschlägen aus `dl-art`), Bezeichnung, Langtext (`.rte` mit `data-ed`), Menge, Einheit, EP bzw. Lohn/Sonstiges, Rabatt, USt, EK, Kz;
      - GP live (`id="gp<i>"`, `updateCalc()` aktualisiert es);
      - Knöpfe Preisverlauf, „Artikel ✎“ (`posArtikelPopup()`) bzw. „+A“, Löschen.
    - Im ⋯ der Karte: Nach oben/unten, Preisverlauf, Artikel ✎, Löschen.
    - **Gruppen** stehen als Akkordeon-Kopf: Nr., Bezeichnung und Gruppensumme, dazu Tags Pauschal, Einzelpreise ausgeblendet, Option. Tippen auf den Titel öffnet das Gruppen-Pop-up mit Bezeichnung, Gruppentext, „Einzelpreise ausblenden“, Pauschalpreis, USt und Kz.
    - **Textpositionen** erscheinen als Karte mit gekürztem Text.
    - **„+ Position ▾“** (Ware, Leistung, Fremdleistung, Gruppe, Text, Stunden aus Zeiterfassung) läuft über `ACT.pneu`: Es ruft `ACT.padd` auf und öffnet das Pop-up der neuen Position.
    - Erwartete Wirkung: Der Positionsteil schrumpft von ca. 3900 auf ca. 900 px.
  - **Positionen am Bildschirm:**
    - Eine Zeile je Position: Pos | Art.-Nr. | Bezeichnung | Menge | Einh. | EP (bzw. Lohn/Sonstiges) | (Rabatt) | GP | ✎ ⋯, mit denselben Eingabefeldern (`data-p`/`data-f`).
    - Die Art steht als Kürzel im Pos-Feld, die USt nur bei Abweichung als Tag. EK und Kz stehen im Pop-up (✎ öffnet `posPopup`), ↑↓ € ✕ im ⋯.
    - Leere Langtexte sind ausgeblendet; „+ Langtext“ über ✎ bzw. 📝 (`ACT.plt`).
    - Das Gruppen-Häkchen „Einzelpreise ausblenden“ und der Gruppenpreis liegen im Gruppen-Pop-up, ein Pauschalpreis erscheint als Tag.
    - Die Tabelle passt damit bei 1400 px ohne Bildlauf.
    - In kompakt gilt „Beides“ erst ab 1280 px (`ansicht()`), darunter „Eingabe“.
  - **Festgeschriebene Belege als Lese-Ansicht:**
    - Kopfdaten als `dl.kv`-Zusammenfassung.
    - Positionen am Handy als Karten, am Bildschirm als schlanke Tabelle ohne Eingabefelder (Pos, Bezeichnung + Langtext, Menge, Einh., EP, Rabatt, GP, USt).
    - Keine gesperrten Felder, keine leeren Langtext-Kästen. Das ist nur Anzeige, die Sperre bleibt unverändert.
  - **Zahlung:**
    - Bei offener Rechnung steht oben eine Statuskarte „offen 1 007,33 € · fällig 23.10.2026 · Skonto 2 % bis 19.10.“ mit dem Knopf „💶 Zahlung erfassen …“. Derselbe Knopf ist Hauptaktion und steht in der Aktionsleiste.
    - Das Pop-up (`ACT.zpop`) enthält die bisherigen Felder mit denselben IDs (`z-dat`, `z-bet`, `z-sk`, `z-art`, `z-not`, `z-skan`, `z-skinfo`). `zSkonto()` und `ACT.zadd` arbeiten deshalb unverändert, samt Periodensperre und Prüfung der Skontofrist. Das Pop-up schließt, sobald eine Zahlung gebucht ist.
    - Die Zahlungen erscheinen als Karten („09.10.2026 · Bank · 1 510,99 € · Teilzahlung“), Löschen im ⋯ (`ACT.zdel`).
    - Die Inline-Maske entfällt in kompakt, damit die IDs eindeutig bleiben.
    - Die Eingangsrechnung bekommt dasselbe; dort steht zusätzlich der Original-Anhang oben.
  - **Summe und Aktionsleiste** (B8):
    - **Handy:**
      - Links „netto 15 987,25 € Σ“. Tippen zeigt `sumBox()` und `kalkBox()` als Pop-up (`ACT.sumpop`); `updateCalc()` hält den Wert aktuell.
      - Rechts „+ Position ▾“ (Entwurf), „💶 Zahlung“ (offene Rechnung) bzw. „PDF“.
      - Die Statuszeile wird am Handy kürzer, ohne Brotkrumen und ohne Netto.
    - **Bildschirm:** Die rechte Spalte (Summen, Kalkulation) ist ab 1100 px `position:sticky`, mit eigener Höhe und Bildlauf wie `.split .sticky`.
  - **Beleg-Info:**
    - Am Handy stehen Anhänge, Belegkette, Versand und Revisionen im Akkordeon „Beleg-Info“ (zu; bei ER sind die Anhänge offen).
    - Die Karte „Kunde“ entfällt am Handy, weil der Kunde in der Zusammenfassung steht.
    - Am Bildschirm wandern die Anhänge in die rechte Spalte.
  - **Vorschau:**
    - Am Handy ist sie nur zum Lesen da: `docHTML(b,vEdit())`, wobei `vEdit()` bei `kmpH()&&erw('kompaktBeleg')` false liefert. Das gilt auch in `updateCalc()`. Im Blatt mit 45 % Größe stehen dann keine gestrichelten Felder mehr, und der Hinweistext entfällt.
    - Bearbeitet wird in der Eingabe bzw. im Positions-Pop-up.
    - „Druckformat …“ wandert ins ⋯.
    - Pinch-Zoom ist erlaubt (`viewport` ohne `user-scalable=no`).
    - P21 erweitert `vEdit()` später um den Schalter „Änderungsmodus“ (`erp-vEdit`).
- **Umsetzung in zwei Einheiten:** je Commit ein Teil, Präfix „Kompakt: …“.
  - **U7 „Grundmuster & Überlauf“** (Aufwand L, ca. 3–4 Tage), in dieser Reihenfolge:
    1. „Kompakt: Fehlerbehebung Seitenüberlauf, Reiter, Leiste ‚Ungespeichert‘, schmale Felder“. Nur CSS, ohne Schalter, weil es Fehler behebt: ✅ umgesetzt (Commit 7acb6e1)
       - `.cols{grid-template-columns:minmax(0,1fr) 340px}` und `.cols>*{min-width:0}`; das gilt auch für das Inline-Raster im Überblick;
       - Tabellen in Karten mit waagrechtem Bildlauf: `.card{overflow-x:auto}` bis 1100 px als Sicherheitsnetz (`.pop` und `.modal` hängen am `body` und sind nicht betroffen);
       - am Handy `.seg{flex-wrap:wrap}` und `#dirtybar{flex-wrap:wrap}`;
       - am Handy `.row>label.w05` wie `.row>label`, also zwei Felder je Zeile;
       - `.pop.zlpop` mit begrenzter Höhe und Bildlauf.

       Prüfung: `scrollWidth = innerWidth` in allen Ansichten bei 360, 390, 1024 und 1400 px.
    2. „Kompakt: Schalter erw.kompakt und Grundbausteine“: ERW-Eintrag, `body.kompakt`, `kmp()`/`kmpH()`/`HANDY`, B1 (`menuePop`, `MENUE`, `ACT.menue`), B2 samt den Ergänzungen in `formDialog()`, B3 `karte()` mit CSS, B5 `akk()`, B6 `hilfe()`, B7 (Kennzahlen), B9 `livePop()`, Tippziele und Abstände. Sichtbar ändern sich dadurch nur Dialoge, Kennzahlen und Tippziele. ✅ umgesetzt (Commit 4e15709)
    3. „Kompakt: Listen als Karten“: Kartenmodus in `tabelle()` mit `m`-Angaben in allen 8 Aufrufen (Verkauf/Einkauf, Aufträge, Zeiten, Kontakte, Artikel, Lager, K-Blätter, LVs); `karte()` im Überblick, bei den Belegen im Kontakt, im Auftrag, in der Verrechnung, im Journal und im Protokoll. ✅ umgesetzt (Commit 439ca23)
    4. „Kompakt: Neu-/Einlesen-Menüs und Filter-Pop-up“ für Überblick, Verkauf/Einkauf, Kontakte, Artikel und Lager (B4, `ACT.fweg`, „± Bestand buchen“ über `ACT.lgpop`). ✅ umgesetzt (Commit 7160459)
    5. „Kompakt: Kontakt, Artikel, Kosten, Verrechnung, Aufträge, Auswertung, FiBu, Export“: Visitenkarte, Akkordeons, ⓘ, Live-Pop-ups für Kontakt, Lieferanten und Konten. Bei Bedarf in zwei Commits teilen: Stammdaten und Kaufmännisch. ✅ umgesetzt in zwei Commits: 050e6d5 (Kontakt, Artikel) und 56f4235 (Kosten, Verrechnung, Aufträge, Auswertung, Kontenplan, Export, K-Blätter)
    6. „Kompakt: Einstellungen als Akkordeon“: `V.einstellungen`, `erwKarte()`, `dpKarte()`, Karten mit Live-Pop-up für Steuersätze, Tarife und Nummernkreise. Der Dialog Druckoptionen bekommt Abschnitte: `druckDialog()` verwendet `typ:'abschnitt'` statt der fetten Hinweiszeile, was ohne kompakt gleich aussieht. ✅ umgesetzt (Commit 89025f2)
    7. Doku: PFLICHTENHEFT (Abschnitt Erweiterungen), CLAUDE.md (Bausteine und Namen), dieser Vorschlag (Stand, Rücknahme-Reihenfolge). ✅ umgesetzt
    - **Stand U7 (09.10.2026):**
      - **Messung** (Testdaten der Analyse, 45 Ansichten samt FiBu-, LV- und K-Blatt-Reitern): kein Seitenüberlauf bei 360, 390, 1024 und 1400 px, mit `erw.kompakt` ein und aus. Am Handy (390 px, ohne Beleg-Editor) sind Knöpfe und Felder unter 40 px von 864 auf 0 gesunken; erster Beleg der Belegliste bei y = 214; Einstellungen zugeklappt 1,0 Bildschirme (vorher 8,9), Überblick 1,5 (1,9), Kosten 1,7 (3,0), Lager 1,7 (2,9), Auswertung 1,0 (3,9), Kontenplan 1,4 (3,7). Länger wurden die LV-Bearbeitung (5,1 statt 4,1, größere Tippziele; Karten optional in U8) sowie Artikel und Zeiten (Karten, Schnellwahl).
      - **Regression:** Mit `erw.kompakt=false` ist `#main` in allen 45 Ansichten gleich wie vor U7 (Vergleich mit festen IDs und fester Uhrzeit), nur die Einstellungen zeigen den neuen Schalter; ebenso der Dialog „Druckoptionen“. `docHTML`, Vorschau und PDF 30/30 gleich (1500 px und 390 px). Gesamttest Stufe 1 (alle Schalter einzeln aus/an, „Alle Schalter auf Standard“, „Standard wiederherstellen“) ohne Fehler; das Testskript klickt die Schalter jetzt bei aufgeklapptem Abschnitt.
      - **Abweichungen vom Konzept:** `erp-akk` speichert je Abschnitt nur Abweichungen vom Standard (`{id:1|0}`), weil manche Abschnitte standardmäßig offen sind; das `toggle`-Ereignis beim Zeichnen ändert den Zustand nicht (`data-auf`). Live-Pop-ups über einen gemeinsamen Auslöser `ACT.lpop` mit `LIVE.<name>` (Kontakt, Lieferant, Konto, Steuersatz, Tarif, Nummernkreis; „+ …“ legt an und öffnet das Pop-up), Filter über `ACT.filter` mit `FILTER.<name>`, Mehrfachauswahl Artikel über `ACT.awahl`; zusätzlich `ACT.fweg`, `ACT.lgpop`, `ACT.menue`. Die Karten der Verrechnung und der Belege im Kontakt/Auftrag kamen mit Commit 5 (dort wurden die Ansichten ohnehin umgebaut), Zeiterfassung (Karten nach Tag, Schnellwahl, Auftrag kurz) mit Commit 3. Lagerwert als Kennzahl nur am Handy (am Bildschirm Summenzeile wie bisher), Belege im Kontakt und Auftrag am Bildschirm weiter als Tabelle. Der „Standard wiederherstellen“-Knopf eines Pakets steht nur bei Abweichung im Kopf (ein gesperrter Knopf im Kopf schluckte das Antippen).
      - **Offen:** Test an echten Geräten (Android, iOS: Blatt von unten, Bildschirmtastatur, Dateiauswahl aus dem Menü); U8 siehe unten.
  - **U8 „Beleg-Editor“** (Aufwand L, ca. 3–4 Tage), setzt U7 Commit 2 voraus:
    1. „Kompakt: Beleg – Schalter erw.kompaktBeleg, Kopfleiste mit Hauptaktion und ⋯-Menü“ (`MENUE.beleg`, Live-Pop-up „Spalten & Druck …“). ✅ umgesetzt (Commit fcfbee7)
    2. „Kompakt: Beleg – Kopfdaten als Zusammenfassung mit Pop-up“ (`kopfFelder(b)`, `ACT.kopfd`, Akkordeons für Zahlungsbedingungen und Texte). ✅ umgesetzt (Commit 8311235)
    3. „Kompakt: Beleg – Positionen am Handy als Karten mit Positions-Pop-up“ (`posKarte()`, `posPopup()`, Gruppen-Pop-up, `ACT.pbear`/`ACT.pneu`, `MENUE.pos`). ✅ umgesetzt (Commit f974f09)
    4. „Kompakt: Beleg – einzeilige Positionszeile am Bildschirm“ (✎ und ⋯, leere Langtexte, `ACT.plt`, Schwelle für „Beides“ in `ansicht()`). ✅ umgesetzt (Commit d1dc351)
    5. „Kompakt: Beleg – Lese-Ansicht festgeschriebener Belege, Zahlung als Pop-up“ (`ACT.zpop`, Statuskarte, Zahlungen als Karten). ✅ umgesetzt (Commit 281c9b9)
    6. „Kompakt: Beleg – Aktionsleiste mit Summe, Beleg-Info, Vorschau zum Lesen“ (B8, `ACT.sumpop`, `vEdit()`; `updateCalc()` aktualisiert `#aktsum`; kürzere Statuszeile am Handy über `belegStatus()`). ✅ umgesetzt (Commit c5a105f)
    7. Optional: „Kompakt: LV-Positionen als Karten mit Pop-up“ (`lvEdit()`, Setter `'path'`). Offen (nicht Teil des Auftrags U8).
    8. Doku. ✅ umgesetzt
    - **Stand U8 (09.10.2026):**
      - **Messung** (Testdaten der Analyse): Angebot-Entwurf mit 12 Positionen am Handy 1 791 px hoch = 2,1 Bildschirme bei 390 × 844 (vorher 6 028 px = 7,1), bei 360 × 740 2,5 Bildschirme; erste Position bei y = 570 (vorher 906), Netto und Hauptaktion immer sichtbar (Aktionsleiste). Rechnung mit Zahlung 1 271 px (vorher 3 917), „Zahlung erfassen“ als Hauptaktion bei y = 95, Statuskarte bei y = 195 (vorher 2 605); festgeschriebenes Angebot 1 072 px (vorher 3 477). Am Handy im Beleg und in seinen Pop-ups alle Knöpfe, Auswahllisten und Eingabefelder (auch Kopf-, Fuß- und Langtext) mindestens 40 px. Bildschirm: Positionstabelle passt bei 1024, 1280 und 1400 px ohne waagrechten Bildlauf, auch mit Lohn/Sonstiges und Rabatt (Bezeichnung mindestens 125 px); die Aktionen der Kopfleiste stehen bei 1024 px in einer Zeile. Kein Seitenüberlauf in allen 45 Ansichten bei 360, 390, 1024 und 1400 px.
      - **Regression:** Mit `erw.kompakt=false` und mit `erw.kompaktBeleg=false` ist `#main` in allen 45 Ansichten gleich wie vor U8 (nur die Karte „Erweiterungen“ zeigt den neuen Schalter). `docHTML`, Vorschau und PDF 30/30 gleich (1500 px); am Handy (390 px) 30/30 beim Druck und PDF, die Vorschau der 3 Entwürfe ist beabsichtigt ohne gestrichelte Felder (Inhalt = `docHTML(b,false)`), mit `erw.kompaktBeleg=false` 30/30. Rechenwege: dieselben Änderungen über Positions-, Kopfdaten- und Spalten-Pop-up bzw. über die bisherige Tabelle ergeben denselben Beleg (Positionen, Kopf, Netto, Brutto, Optionen, DB II, `docHTML`) und je Änderung einen Rückgängig-Schritt (390 und 1400 px). Zahlung über das Pop-up wie bisher (Skontovorschlag, Skontofrist, Periodensperre). Gesamttest Stufe 1 ohne Fehler, keine doppelten `ACT`-Schlüssel, keine Konsolenfehler.
      - **Abweichungen vom Konzept:** „Senden …“ bleibt auch bei WE und ER im ⋯ (alle bisherigen Funktionen erreichbar). Hauptaktion beim festgeschriebenen Angebot nur „→ Auftragsbestätigung“, solange es offen ist (sonst PDF / Drucken; „→ Rechnung“ und „Folgebeleg ▸“ bleiben im ⋯ bzw. am Bildschirm sichtbar). In „Beides“ (ab 1280 px) erscheinen die Positionen als Karten mit Pop-up, weil die linke Spalte für die einzeilige Zeile zu schmal ist; dort bleiben die Anhänge links wie bisher. Die Karte „Kunde“ bleibt am Handy im zugeklappten Akkordeon „Beleg-Info“ (Link zum Kontakt, UID). „Druckformat …“ über der Vorschau entfällt nur am Handy (dort ⋯ → „Spalten & Druck …“ → „Druckoptionen …“). Am Bildschirm bleiben „+ Gruppe / + Ware …“ als Knöpfe unter der Tabelle, „📝“ blendet einen leeren Langtext ein (`ACT.plt`, je Sitzung `UI.ltAuf`). Zusätzlich: `render()` zeichnet offene Bearbeiten-Pop-ups neu (`d._zeich`, z. B. nach neuem Kunden, Preisverlauf, Artikel-Pop-up), Esc schließt zuerst ein offenes Menü bzw. den Preisverlauf, der Preisverlauf erscheint am Handy als Blatt über dem Pop-up (`popLage()`).
      - **Korrektur nach Prüfung** („U8: Korrektur Beleg-Pop-ups beim Belegwechsel, Gruppensumme“): Ein offenes Beleg-Pop-up (Position, Kopfdaten, Spalten & Druck, Summen, Zahlung) blieb nach einem Belegwechsel (Zurück-Taste am Handy, Link) bzw. nach dem Abgleich offen und schrieb dann in den gerade angezeigten Beleg; es schließt jetzt (`anBeleg()`, `d._gilt`). Die Gruppensumme (Akkordeon-Kopf, Gruppenzeile) und der GP von Positionen einer Pauschalgruppe („(…)“) laufen bei Änderungen mit (`updateCalc()`, auch ohne kompakte Ansicht).
      - **Offen:** Test an echten Geräten (Android, iOS: Bildschirmtastatur im Positions-Pop-up, Aktionsleiste mit Safe-Area); LV-Positionen als Karten (optional).
- **Passung der Stufe-2-Pakete:**
  - **P3/P4 (Preise, Summen, Spalten, Positionsdarstellung):** ✅ umgesetzt (U9); die Druckoptionen stehen im Dialog und in der Unterkarte als Abschnitte „Preise und Summen (P3)“, „Spalten (P4)“ und „Positionsdarstellung (P4)“, im Editor nur die Markierung „wird nicht gedruckt“, die Nummern „1.1“ und die Beschriftung „Rabatt/Zuschlag“.
    - Die Druckoptionen wirken nur in `docHTML()`; P30 berührt sie nicht.
    - Neue Optionen erscheinen ohne eigene Gestaltung im Dialog „Druckoptionen“ und in `dpKarte()`. Beide sind in kompakt nach Gruppen (`DRUCKOPT.p`) als Akkordeon mit ⓘ-Hilfen aufgebaut, der Dialog über `typ:'abschnitt'`.
    - Anteile im Editor: die Spalte „Rabatt/Zuschlag %“ (P4, `erw.zuschlag`), Nummern „1.1“ im Editor und die Spalten „Aufschl. %“/„DB %“ aus dem Rest von P11 (`b.optKalk`).
      - Am Handy kommen sie in die Positionskarte (Zeile 2 bzw. Tag „DB 32 %“) und als Felder ins Positions-Pop-up.
      - Am Bildschirm werden sie zusätzliche Spalten der einzeiligen Positionszeile.
      - Das Häkchen dafür gehört in „Spalten & Druck …“.
  - **P10 (Gesamtkalkulation):**
    - Der Dialog `gesamtKalk(b)` wird als `.modal`/`.mbox` gebaut und bekommt dadurch das Blatt von unten und die stets sichtbaren Knöpfe (B2).
    - Die Tabelle (Gesamt/Material/Fremdleistung/Lohn × 7 Spalten) wird am Handy als eine Karte je Kostenart dargestellt: EK, VK aktuell, Aufschlag neu in % ↔ €, VK neu. DB gesamt und DB II neu bleiben als Kopfzeile sichtbar.
    - Auslöser:
      - der Eintrag „Gesamtkalkulation …“ im ⋯ des Belegs;
      - das Summen-Pop-up, dort auch „→ auf Ziel anheben …“ aus `kalkBox`.
    - Bei festgeschriebenen Belegen ist der Eintrag ausgegraut, mit Hinweis auf die Revision.
    - Der Rücknahme-Dialog (`b.kalkAlt`) nutzt `karte()` mit Häkchen.
  - **P18 (Gliederung):**
    - Am Handy übernimmt die Gruppenansicht der Positionskarten die Gliederung (Akkordeon mit Gruppensumme).
    - Zusätzlich gibt es „☰ Gliederung“ im ⋯ bzw. in der Aktionsleiste, als Blatt mit Sprung zur Karte (`ACT.spring`).
    - Die geplanten Attribute `data-pi`/`data-g` gelten auch für Karten und einzeilige Zeilen.
    - Am Bildschirm bleibt es wie geplant (Spalte bzw. erste Karte).
    - Den Auf-/Zuklapp-Zustand merkt sich `akk()` statt eines eigenen `erp-glZu`.
  - **P20 (globale Suche):**
    - Eine Lupe 🔍 steht in der `.topbar` neben 🕘 und in der Seitenleiste.
    - Die Treffer erscheinen gruppiert als Karten (`karte()`), jede Gruppe aufklappbar (`akk()`).
    - Das Eingabefeld steht oben fest; Strg+K und F3 bleiben.
  - **Weitere Pakete:**
    - P6 (Anrede, Titel, Namen): Abschnitt „Person & Anrede“ in `kontaktPopup()` und in der Visitenkarte.
    - Positionsfelder aus P9, P13, P15 und P17 (`ohneLohnNw`, `zeit`, `ekL`, `tarif`, `formel`, `ergAus`): Abschnitt „Weitere“ im Positions-Pop-up.
    - P12: die neuen Zeilen im Summen-Pop-up.
    - P21 baut auf `vEdit()` auf.
    - P22: Die geplanten Teile (Kopf, Positionen, Texte, Beleg-Info, Kalkulation) entsprechen den kompakten Abschnitten.
    - P23 (Sortieren, Summenzeile): am Handy „Sortieren nach“ im Filter-Pop-up und `fuss` im Kartenmodus.
    - P19 b (Pfeile) braucht Platz in der `.topbar`.
- **Test und Abnahme** (zusätzlich zu Abschnitt 2 Nr. 7):
  - **Messung** wie in der Analyse bei 360 × 740, 390 × 844 (Touch), 1024 × 768 und 1400 × 900 px: kein Seitenüberlauf; Lage der ersten Position, der Summe und der Hauptaktion; Tippziele.
  - **Zielwerte** mit den Testdaten der Analyse:
    - Angebot-Entwurf (12 Positionen) am Handy höchstens ca. 2,5 Bildschirme hoch, erste Position im ersten Bildschirm, Summe immer sichtbar;
    - erster Beleg der Belegliste bei y ≤ 250;
    - „Zahlung erfassen“ einer offenen Rechnung im ersten Bildschirm;
    - Einstellungen zugeklappt höchstens 2 Bildschirme;
    - am Handy alle sichtbaren Bedienelemente außer Textlinks mindestens 40 px.
  - **Regression:**
    - Mit `erw.kompakt=false` ist `#main.innerHTML` in allen Ansichten gleich wie vor U7; es wirkt nur das CSS der Fehlerbehebungen. Screenshots sind gleich, außer an den behobenen Stellen.
    - `docHTML`, Vorschau-Seiten, PDF und Druck sind mit Standardeinstellungen in beiden Schalterstellungen gleich. Beabsichtigte Ausnahme: die Handy-Vorschau ohne gestrichelte Felder, ihr Inhalt entspricht `docHTML(b,false)`.
  - **Rechenwege:**
    - Änderungen über das Positions- und das Kopfdaten-Pop-up ergeben dieselben Summen, Folgebelege und Rückgängig-Schritte wie über die Tabelle.
    - Eine Zahlung über das Pop-up wirkt wie über die bisherige Maske (Skonto, Periodensperre).
  - Keine Konsolenfehler, keine doppelten `ACT`-Schlüssel, jeder Commit einzeln per `git revert` rücknehmbar (Reihenfolge unten).
  - Offen: Test an echten Geräten (Android, iOS): Blatt von unten, Bildschirmtastatur, Dateiauswahl aus dem Menü.
- **Schalter:**
  - `erw.kompakt` = true (Entscheidung des Anwenders).
  - `erw.kompaktBeleg` = true; wirkt nur zusammen mit `kompakt`.
  - Die Fehlerbehebungen (U7 Commit 1) haben keinen Schalter.
- **Datenmodell:** keines. Je Gerät wird nur `erp-akk` gespeichert (geöffnete Abschnitte).
- **Nutzen** hoch (Bedienung am Handy, Übersicht am Bildschirm) · **Aufwand** U7 L und U8 L, je ca. 3–4 Tage (LV-Positionen optional M) · **Abhängig von:** – (nutzt `belegStatus()` aus P19 c; U8 setzt U7 Commit 2 voraus) · **Recht:**
  - Festgeschriebene Belege bleiben unveränderbar; die Lese-Ansicht zeigt nur an (§ 11 UStG, § 131 BAO).
  - Ausdruck, PDF und versendete Belege bleiben unverändert.
  - Die Tippziele liegen über der Vorgabe von WCAG 2.2 AA (24 × 24 px).
- **Rücknahme** (`git revert`):
  - U7 Commit 1 lässt sich einzeln zurücknehmen.
  - Die U8-Commits werden in umgekehrter Reihenfolge zurückgenommen, von 6 bis 1 (c5a105f, 281c9b9, d1dc351, f974f09, 8311235, fcfbee7); einzeln rücknehmbar sind Commit 6 und 4. Geprüft: Rücknahme konfliktfrei, Programm nach jedem Schritt ohne Konsolenfehler, danach `index.html` gleich wie vor U8. Vor allen U8-Commits zuerst die Korrektur „U8: Korrektur Beleg-Pop-ups beim Belegwechsel, Gruppensumme“ zurücknehmen (ändert Zeilen aus U8 Commit 1, 2, 3, 5 und 6).
  - U7 Commits 3–6 sind einzeln rücknehmbar, aber vor U7 Commit 2. Geprüft (09.10.2026): U7 Commit 1, 3, 4, 5 (beide Teile) und 6 jeweils einzeln per `git revert` konfliktfrei, Programm danach ohne Konsolenfehler; U7 Commit 2 erst nach 3–6 (diese nutzen `kmp()`, `karte()`, `akk()` …; Commit 6 ändert außerdem `akk()`); alle U7-Commits in umgekehrter Reihenfolge ergeben wieder genau den Stand vor U7.
  - Die Korrektur „U7: Korrektur Auswahlleiste Artikel …“ (nur CSS) vor U7 Commit 4 zurücknehmen.
  - U7 Commit 2 kommt erst nach allen U8-Commits dran.
  - P19 c lässt sich erst zurücknehmen, wenn U8 Commit 6 zurückgenommen ist, weil dieser `belegStatus()` ändert.
- **Einordnung:**
  - Der Anwender wünscht das Paket, deshalb kommt es vor bzw. parallel zu Stufe 2: zuerst U7, dann U8.
  - Pakete, die den Beleg-Editor ändern (P10, P18 und die Editor-Anteile von P4 und P11), möglichst nach U8 umsetzen. Dann nutzen sie gleich die Muster.

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
1. P0 b)–n) Fehlerkorrekturen und Nachdruck-Treue (M) – ✅ b)–n) umgesetzt
2. P1 Druckprofil-Grundgerüst (M) – ✅ umgesetzt (Commit d5237b2)
3. P2 Zusammenfassung der Titel und Gruppensummen (S) – ✅ umgesetzt (Commit 2dc2fa0)
4. P5 Infoblock, Grußformel, Fußzeilen-Zusatz, Kostenvoranschlag (S) – ✅ umgesetzt (Commit 7bca588)
5. P14, nur der Teil „Prüfung beim Einlesen“ (behebt den 100-fach zu hohen EP) (S) – ✅ umgesetzt (Commit d926b4e)
6. P11, nur das Popup-Feld „Aufschlag %“ und der VK-Vorschlag bei EK-Änderung (S) – ✅ umgesetzt (Commit 3e041e7)
7. P19 a/c/d: Zuletzt, Statuszeile, Markierung in der Seitenleiste (S) – ✅ umgesetzt (Commits 506e52e, 2aa2bf6, 2b77577)
8. P6, nur Kunden/Lieferanten-Filter und „Unsere Kunden-Nr.“ (S) – ✅ umgesetzt (Commit 072ff14)
9. Restfehler aus Stufe 1 (P0 o: Lohn/Sonstiges bei Artikelwahl, Preisverlauf, neuer Position und Stunden; Optionen über die Gruppe in Sammelrechnung, Auswertung und Festschreib-Prüfungen; Abgleich der Einstellungen) – ✅ umgesetzt (Commits 2498cb0, 04c1ad1, d477ebc), Tests in beiden Ansichten (1400 px, 390 px), `docHTML`/Vorschau/PDF unverändert (28/28)

**Gesamttest nach Stufe 1 (08.10.2026):** ✅
- Alle Browsertests (Chromium, 1400 px und 390 px) ohne Konsolenfehler: alle Hauptansichten (Übersicht, Verkauf, Einkauf, Belege in Eingabe und Vorschau, Kosten, Zeiten, Kontakte mit Filter, Artikel, Lager, Auswertung, LVs, K-Blätter, FiBu mit allen 8 Reitern, Einstellungen), jeder Schalter einzeln aus/an (Summen unverändert, Druck/PDF ohne Fehler), „Alle Schalter auf Standard“ (Druckprofile bleiben, Strg+Z stellt wieder her) und „Standard wiederherstellen“ je Paket. Keine doppelten Schlüssel in `ACT`, `ACT_LV`, `ACT_LB`, `ACT_FB`.
- Bestehende Testskripte t2–t36: alle Ergebnisse gleich wie vor ETU (Commit 8eefb2d); zwei Skripte waren schon vor ETU veraltet (Struktur-Popup statt Auswahllisten, Belegansicht startet in „Eingabe“).
- Regressionsvergleich mit dem Stand vor ETU (30 Belege mit Standardeinstellungen): `docHTML` 30/30 gleich. Abweichungen nur beabsichtigt: Summenblock nicht mehr geteilt (P0 l, 6 Belege in Vorschau und PDF), Kopf der Optionen-Tabelle im PDF (P0 k, 2 Belege, gleiche Texte).
- **Rücknahme-Reihenfolge** (`git revert`, nur Code; geprüft: Rücknahme konfliktfrei, Programm danach ohne Konsolenfehler; die Doku-Commits werden nicht zurückgenommen):
  - einzeln: P0 f, g, h, i, k, l, P2, P19 c, d, P6 (Teil), Korrekturen f358a37, 10f3241, 05429d5, 8452dbd, 724e6b0, bec643e, Firmenvorgabe/Duplikat-Standard c9703e5, Restfehler P0 o a (2498cb0), b (04c1ad1), c (d477ebc)
  - P0 j (7de8798): vorher P0 o a (2498cb0); P0 m (abdf44c): vorher P0 o b (04c1ad1) und c9703e5; P14 (d926b4e): vorher c9703e5; P19 a (506e52e): vorher P0 o a und c9703e5
  - P11 (3e041e7): vorher 724e6b0
  - Korrektur b626535: vorher P6 (072ff14); P5 (7bca588): vorher b626535 und P6
  - P1 (d5237b2): vorher P2, P5, b626535, P19 a (samt P0 o a und c9703e5), P19 c, P6
  - P0 d (a86ff40), P0 e (1c61540): vorher P1 samt Vorgängern
  - P0 n (24362bd): vorher 10f3241, P14 und P1 samt Vorgängern
  - P0 c (f6526f9): vorher P0 j (nutzt `lnrStamm()`), P0 d, P0 n, P11 samt 724e6b0 und deren Vorgänger
  - P0 b (af99b8d): vorher zusätzlich P0 c; Grundgerüst (4094cd5): ganz zuletzt, nach allen Paketen mit Schaltern und 05429d5
  - seit der Kompakten Ansicht (P30 U7, 09.10.2026): U7 einzeln wie bei P30 beschrieben (Commit 2 nach 3–6). P6 (Teil, 072ff14), Korrektur b626535 und P5 (7bca588): vorher U7 Commit 3 (439ca23), 4 (7160459) und 5 Stammdaten (050e6d5). P19 c (2aa2bf6) und P1 (d5237b2) samt allen Commits, die P1 voraussetzen (P0 b, c, d, e, n, Grundgerüst): vorher U7 Commit 2 (4e15709) und damit U7 Commit 3–6. U7 Commit 1 (7acb6e1) bleibt unabhängig.
  - seit dem kompakten Beleg-Editor (P30 U8, 09.10.2026): U8 rückwärts 6 → 1 (c5a105f, 281c9b9, d1dc351, f974f09, 8311235, fcfbee7), einzeln nur Commit 6 und 4; alle U8-Commits vor U7 Commit 2 (4e15709) und damit vor P1, P19 c und P0 b, c, d, e, n. P5 (7bca588): vorher zusätzlich U8 Commit 6 bis 2 (8311235 verlagert die Formularzeilen samt „Gültig bis“ aus P5 in `kopfFelder()`). Alle übrigen Commits sind wie vor U8 rücknehmbar (geprüft: jeder Code-Commit seit ETU einzeln gegen den Stand vor U8, Ketten von P0 j, m, P14, P19 a, P11, P6, U7). Vor allen U8-Commits zuerst die Korrektur „U8: Korrektur Beleg-Pop-ups beim Belegwechsel, Gruppensumme“ zurücknehmen (ändert Zeilen aus U8 Commit 1, 2, 3, 5 und 6).
  - seit U9 (P3/P4, 09.10.2026): U9 rückwärts P4 Positionsdarstellung (1d7338f) → P4 Spalten (8a9b49b) → P3 (06ffa33); einzeln nur 1d7338f. U9 vor: P0 c, P0 j, P0 l (66bc2b7, `brk`), P0 n, P1, P2, P5, P19 c, U7 Commit 2 (4e15709), U8 Commit 1, 3, 4, 5, 6 und der Korrektur 68e30f6 (geändert bzw. direkt angrenzend; neu ist die Abhängigkeit für P0 l, P2, U8 Commit 4 und die Korrektur 68e30f6, die vorher einzeln rücknehmbar waren). Geprüft: U9 rückwärts konfliktfrei, Programm nach jedem Schritt ohne Konsolenfehler (390 und 1400 px), danach `index.html` gleich dem Stand ohne U9. Hinweis: U7 Commit 5 Stammdaten (050e6d5) ist seit dem Commit 1e322aa (Pflichtfelder) erst nach dessen Rücknahme rücknehmbar (nicht durch U9).
  - seit U10 (P6, P8, P9, 10.10.2026): rückwärts P9 (395368b) → P8 (f385ffd) → P6 (570074f); einzeln nur P9 (P8 nutzt `briefAnrede()`/`anrBeleg()` aus P6 und ändert dessen Zeilen, P9 erweitert `PLATZH`/`phWerte()` aus P8). U10 vor (geänderte bzw. direkt angrenzende Zeilen): P0 c (f6526f9, `belegFix()` mit `lnwAus`), P0 e (1c61540), P0 j (7de8798), P1 (d5237b2), P3 (06ffa33), P4 Spalten (8a9b49b), P4 Positionsdarstellung (1d7338f), P5 (7bca588) samt Korrektur b626535, P6 Teil (072ff14), P11 (3e041e7), U7 Commit 5 (050e6d5) und 6 (89025f2), U8 Commit 1 (fcfbee7), 2 (8311235), 3 (f974f09) und Korrektur 68e30f6. Davon neu nur erst nach U10 rücknehmbar: U7 Commit 6 (89025f2, Einstellungen: E-Mail-Vorlage und Spalte „Lohnnachweis“; nach P9 und P8) und P4 Positionsdarstellung (1d7338f, Zeile „davon Lohn“; nach P9); alle übrigen Code-Commits seit ETU wie vor U10. Geprüft: U10 rückwärts konfliktfrei, Programm nach jedem Schritt ohne Konsolenfehler (390 und 1400 px), danach `index.html` gleich dem Stand vor U10 (6daa4c2).
  - Korrektur iOS-Schalterbreite (Prüfung U9, 10.10.2026; Schalter in „Druckoptionen“, Einstellungen und Pop-ups waren am Handy 20 px breit, der Knopf überdeckte den Text): einzeln rücknehmbar, vor dem iOS-Commit ae69ae6.
- Noch offen: Test an echten Geräten (Edge, Firefox, Android, iOS; Druck, Strg+P, Browsermenü), echter Mailversand und Abgleich über OneDrive mit zwei Geräten, Tag `vor-etu` (nicht gesetzt).

**Stufe 2: Kernfunktionen nach ETU (ca. 12–13 Tage)**
- P10 Gesamtkalkulation mit Rücknahme (L)
- P12 DB je Stunde und Lohnkalkulation (M)
- P8 Platzhalter (M), danach P9 Lohnkostennachweis (M) – ✅ umgesetzt (U10: Commits f385ffd, 395368b)
- P6 Anrede und Briefanrede, vollständig (M) – ✅ umgesetzt (U10: Commit 570074f)
- P3 Schalter für Preise und Summen (S), P4 Spalten und Positionsdarstellung (M–L) – ✅ umgesetzt (U9: Commits 06ffa33, 8a9b49b, 1d7338f)
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
- **Lohnkostennachweis (P9):** nur auf Wunsch je Beleg (Standard aus). ✅ umgesetzt (U10).
- **Briefanrede (P6):** österreichische Form „Sehr geehrter Herr Ing. Mustermann,“, je Kontakt überschreibbar. ✅ umgesetzt (U10).
- **Pflichtangaben/Duplikat (P0 m/n):** Firmenbuchgericht nicht vorbelegen, nur Hinweis bei leerem Feld; Duplikat-Vermerk Standard aus.
- Noch offen: Fragen 5, 6, 7, 9, 10, 11.

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
   *Vorschlag:* nur bei Bedarf einschalten (`erw.zuschlag`). *Umgesetzt (U9):* Schalter `erw.zuschlag` (Standard aus) für die Beschriftung im Editor, Druck über das Druckprofil (Positionsdarstellung → Zuschlag je Position).
8. **Pflichtangaben und Duplikat (P0 m/n):** Ist das Firmenbuchgericht der TBH GmbH das Landesgericht Wiener Neustadt? Soll eine erneute Ausgabe einer Rechnung als „DUPLIKAT“ gekennzeichnet werden?
   *Vorschlag:* Gericht in den Einstellungen eintragen; Duplikat einschalten.
9. **E-Mail-Versand:** Versenden Sie über ein Microsoft-365-Firmenkonto oder auch über ein privates Outlook.com- bzw. Hotmail-Konto (ETU „per HotMail versenden“)?
   *Vorschlag:* beim Firmenkonto bleiben. Ein Privatkonto bräuchte eine geänderte App-Registrierung, und der Mandant `common` gälte dann auch für die OneDrive-Anmeldung.
10. **Briefbild (P28/P29):** Wollen Sie das Logo zentriert wie bei ETU, eine Fußzeile mit Beschriftungen statt Großbuchstaben, einen Modus für vorgedrucktes Briefpapier? Brauchen Sie mehr als eine Gliederungsebene (Los/Gewerk/Titel)?
    *Vorschlag:* Logo und Fußzeile nach Ihrer Wahl in Stufe 3; die mehrstufige Gliederung nur, wenn Sie große, mehrstufige Angebote erstellen.
11. **Weitere Screenshots:** Der Inhalt der ETU-Reiter „Angebotsdaten“ und „Erweitert…“ (Bild 11), „Weitere Einstellungen…“ (Bild 10) sowie der Reiter „Drucker“ und „Formular“ ist auf den Bildern nicht zu sehen. Können Sie diese nachreichen?
    *Vorschlag:* Ja, dann ergänze ich den Vorschlag gezielt.