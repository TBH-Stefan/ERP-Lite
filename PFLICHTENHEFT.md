# ERP-Lite – Pflichtenheft (Stand 05.10.2026)

## 1. Rahmen
| Punkt | Festlegung |
|---|---|
| Unternehmen | Elektrohandel + Sachverständigenleistungen, Österreich, USt-pflichtig (UID vorhanden) |
| Benutzer | 1 Benutzer, PC **und Handy**, Betreuung durch Inhaber |
| Technik | Eine `index.html` (HTML/JS, kein Build), gehostet auf GitHub Pages (https); Handy-Ansicht responsiv |
| Datenhaltung | `ERP-Lite/erp-daten.json` im OneDrive (Microsoft 365 Business) über Microsoft Graph, Anmeldung OAuth 2.0 + PKCE; tägliche Sicherung in `backup/`; Belegfotos in `Belege/`. Alternativ lokaler Ordner (nur PC) |
| Synchronisierung | eTag-Prüfung, 3-Wege-Abgleich je Datensatz, Offline-Erfassung mit Nachtrag; Festschreiben nur online |
| Buchhaltung | bleibt in Excel / beim Steuerberater; ERP liefert CSV-Exporte |
| Nicht im Umfang | Registrierkasse (RKSV), E-Rechnung, Mehrbenutzer, Fremdwährung, Freigaben |

## 2. Belegarten und Belegkette
| Kürzel | Beleg | Folgebelege | Lagerwirkung |
|---|---|---|---|
| AN | Angebot | AB, AR, LS, RE, PR | – |
| AB | Auftragsbestätigung | LS, AR, TR, RE, SR, PR, BE | – |
| PR | Proformarechnung | – | – |
| LS | Lieferschein | RE, SR | Abgang (Ø-EK) |
| AR | Anzahlungsrechnung | GS | – |
| TR | Teilrechnung | GS | Abgang nur ohne LS (Abfrage) |
| RE | Rechnung | GS | Abgang nur ohne LS (Abfrage) |
| SR | Schlussrechnung (abzgl. AR/TR) | GS | Abgang nur ohne LS (Abfrage) |
| GS | Gutschrift / Rechnungskorrektur / Storno | – | – |
| BE | Bestellung an Lieferant | WE, ER | – |
| WE | Wareneingang | ER | Zugang (Bestellpreis) |
| ER | Eingangsrechnung (auch Kosten ohne Bestellung) | – | Zugang nur ohne WE (Abfrage) |

Regeln:
- Folgebelege übernehmen Positionen mit **offener Menge** (Teillieferung/Teilrechnung).
- Alle Belege eines Vorgangs tragen dieselbe **Auftrags-ID** → Grundlage der Nachkalkulation.
- Nummer wird erst beim **Festschreiben** vergeben → lückenlos je Belegart und Jahr (`RE-2026-0001`), Startnummer einstellbar.
- Festgeschriebene Rechnungen, LS, WE, ER sind unveränderbar; Korrektur nur über Gutschrift bzw. Storno (Gegenbuchung).
- AN, AB, BE, PR können wieder geöffnet werden (Nummer bleibt).
- Adresse des Empfängers wird beim Festschreiben eingefroren.
- Protokoll (Audit-Log) aller Festschreibungen, Stornos, Zahlungen, Löschungen.

## 3. Prüfungen beim Festschreiben (§ 11 UStG)
- Empfänger, mindestens eine Position, Bezeichnung je Position.
- Liefer-/Leistungsdatum bzw. -zeitraum auf Rechnungen.
- Eigene UID in den Einstellungen.
- UID des Empfängers bei Rechnungen > 10.000 € brutto (Hinweis), bei Reverse Charge / ig. Lieferung (Pflicht).
- Steuerhinweis (Reverse Charge, ig. Lieferung) wird automatisch gedruckt.
- Eingangsrechnung: Rechnungsnummer des Lieferanten Pflicht.

## 4. Preise
- Positionen frei oder aus Artikelstamm.
- **Preisvorschlag**: bei Artikelwahl der zuletzt diesem Kunden angebotene/verrechnete Preis, sonst letzter Preis allgemein, sonst Artikel-VK.
- Schaltfläche „€“ je Position: Preisverlauf (Kunde zuerst, dann alle) zum Übernehmen; im Einkauf analog EK-Verlauf je Lieferant.
- Mengeneinheiten mit Umrechnung (z. B. Einkauf Krt = 10 Stk, Lager in Basiseinheit).
- Positionskennzeichen OPTION / ALTERNATIV: nicht in der Summe.

## 5. Kalkulation DB II
Definition (wie GWT-Kalkulationsmappe): **DB II = (Umsatz nach Skonto − Herstellkosten) / Umsatz nach Skonto**, Ziel einstellbar (Standard 25 %).

| | Vorkalkulation (AN/AB) | Nachkalkulation (Auftrag) |
|---|---|---|
| Umsatz | Hauptpositionen netto, abzgl. Skonto-% | Rechnungen netto (SR abzgl. AR/TR, abzgl. GS), abzgl. gezogenes Skonto |
| Material | Menge × EK (Ware/Fremdleistung) | Lagerabgänge zu Ø-EK + Eingangsrechnungen mit Auftragsbezug (ohne Lagerartikel) |
| Eigenleistung | Menge × EK (Leistungspositionen) | erfasste Stunden × Kostensatz je Tarif |
| MGZ | % auf Material (einstellbar, Standard 0) | dto. |

Ausweis: DB II € und % vom Umsatz, Aufschlag % auf HK, Fehlbetrag zum Ziel.

## 6. Lager
- **Lagerplätze** als Baum in beliebig vielen Ebenen (z. B. Lager › Regal › Fach › Platz), Code aus dem Pfad, z. B. `HL-R01-F02-P03`; anlegen, umbenennen, verschieben, löschen wie Artikelgruppen. **Mehrfachauswahl** (Haken, „Alle“, Umschalt+Klick = Bereich; Haken an einer Ebene markiert die Unterebenen mit): ausgewählte gemeinsam verschieben, umbenennen (Suchen/Ersetzen, z. B. `R0` → `R`) oder löschen – Unterebenen und Artikel rücken zur nächsten verbleibenden Ebene.
- **Matrix:** Regale (von–bis) × Fächer × Plätze mit Bezeichnung und Stellenzahl in einem Schritt unter einem Lager bzw. Regal anlegen; Erweitern durch erneuten Aufruf mit größerem Bereich (vorhandene bleiben, nur neue werden ergänzt).
- **Zuordnung je Artikel:** Lagerplatz in der Artikelmaske und direkt in der Lagerliste (Auswahlfeld je Zeile); Lagerliste mit Suche (auch Lagerplatz), Filter nach Lagerplatz inkl. Unterebenen bzw. „ohne Lagerplatz“; Spalte „Lagerplatz“ auch in der Artikelliste zuschaltbar. Alle Schritte im Protokoll.
- Bestand ausschließlich aus Bewegungsjournal; Bewertung gleitender Durchschnitt.
- Manuelle Korrektur und Inventur (Ist-Menge → Differenzbuchung).
- Mindestbestand mit Warnung im Überblick.

## 7. Auswertungen
- Überblick: offene Forderungen/Verbindlichkeiten, Überfällige, offene Angebote, Umsatz und DB II lfd. Jahr, Mindestbestand.
- Umsatz je Monat, Kunde, Artikel; Angebots-Trefferquote.
- DB II je Auftrag (Vor-/Nachkalkulation, Ampel gegen Ziel).
- Offene Posten Debitoren/Kreditoren mit Fälligkeit.
- USt-Übersicht je Monat (Soll- oder Istbesteuerung) als **Hilfswerte** für die UVA.
- Einnahmen/Ausgaben je Monat nach Zahlungsdatum.
- CSV-Exporte (Excel, `;`, UTF-8): Rechnungsausgangsbuch, Rechnungseingangsbuch, Zahlungen, OP, Lager, Aufträge.

**Bilanz:** wird nicht aus dem ERP erzeugt. Dafür ist eine doppelte Buchhaltung (Finanzbuchhaltung mit Kontenrahmen, Anlagen, Abschreibungen, Abgrenzungen) nötig. Das ERP liefert die Belegdaten dafür; siehe offene Punkte.

## 8. Druck / PDF
- Druckansicht je Beleg, Logo, Firmendaten, Pflichtangaben; LS und WE ohne Preise.
- Summenblock: „Gesamtbetrag“ schwarz; nach Abzug von Teil-/Anzahlungsrechnungen „Zu zahlender Betrag“.
- **Papierformat einstellbar** (Einstellungen → Firma): A4 (Standard), A5, US-Letter – gilt für Druck, PDF und Vorschau (Layout im A4-Maß, auf das Format skaliert).
- **Mehrseitig:** Reicht eine Seite nicht, wird eine weitere angehängt; jede Seite mit Fußzeile und „Seite x von y“, Tabellenkopf wiederholt. Die Vorschau zeigt die Seiten einzeln mit Seitenrand, Fußzeile und Seitenzahl – auch am Handy: dort wird das Blatt in Originalaufteilung (A4, gleiche Umbrüche wie Druck/PDF) auf Bildschirmbreite verkleinert.
- **Seitenumbruch nie innerhalb einer Position:** Bezeichnung und Langtext bleiben zusammen; Gruppen- und Tabellenkopf stehen nie allein am Seitenende; Summenblock und Unterschrift werden nicht getrennt. Nur eine einzelne Position, die länger als eine ganze Seite ist, wird geteilt.
- PDF über „Drucken → Als PDF speichern“; Dateiname wird vorbelegt (Belegart Nr Kunde).
- Kopf-/Fußtexte je Belegart in den Einstellungen.

## 9. Datensicherheit
- Speichern automatisch nach jeder Änderung (Ordner + Browser-Cache).
- Erste Speicherung des Tages legt `backup/erp-daten_JJJJ-MM-TT.json` an.
- Export/Import der Gesamtdatenbank (JSON).
- Aufbewahrung 7 Jahre (BAO § 132): Datenordner und gedruckte PDFs nicht löschen.

## 10. Belegbearbeitung
- Ansicht je Beleg: Eingabe / Vorschau / Beides; Vorschau = Belegblatt direkt im Programm, gestrichelte Felder im Blatt bearbeitbar, Übernahme in die Eingabefelder (und umgekehrt).
- Nummernvorschlag im Entwurf; Vergabe erst beim Festschreiben nach Sicherheitsdialog (bei unveränderbaren Belegen mit Pflicht-Bestätigung).
- Angebote: **Bearbeiten eines festgeschriebenen Angebots erzeugt eine Revision** (`AN-JJJJ-NNNN-R1`, R2 …; optional mit Änderungsgrund) als eigenen Datensatz – jeder Stand bleibt unverändert gespeichert, beim Festschreiben der Revision wird der Vorgänger „ersetzt“ (keine neue Nummer aus dem Nummernkreis). Karte **„Revisionen“** im Beleg zeigt die durchgängige Historie: alle Stände mit Datum, Status, Netto und Differenz, Änderungsgrund sowie die Änderungen gegenüber dem Vorgänger (Positionen neu/entfernt/geändert, Menge, EP, Rabatt, Texte). Folgeangebot (neue Nummer, gleicher Vorgang).
- **Verkauf/Einkauf gruppiert zusammenhängende Belege** (Revisionen, Folgebelege, Storno): Kopfzeile = aktuelle Revision bzw. Ausgangsbeleg, zugehörige Belege mit **+/−** auf- und zuklappen (je Gruppe oder alle). Spalte „Revision“ (R1 von 3).

## 11. Kalkulation ÖNORM B 2061 und Leistungsverzeichnisse
| Teil | Inhalt |
|---|---|
| K2 | Gesamtzuschlag Lohn / Sonstiges (GGK, Bauzinsen, Wagnis, Gewinn – Zeilen frei), Anzeige „vom/im Hundert“ |
| K3 | KV-Löhne gewichtet → Aufzahlungen → Mittellohn → Lohnnebenkosten → sonstige Personalkosten → Mittellohnkosten → PGK → Lohnkosten → + GZ → Mittellohnpreis; mehrere Blätter (Regie-, Gehaltspreis) |
| K4 | Materialkosten aus Listenpreis, Rabatt, Bezugskosten, Verlust; Preis + GZ Sonstiges; Übernahme aus Artikelstamm |
| K5 | zusammengesetzte Komponenten aus Lohnstunden, K4, K6, Fremdleistung |
| K6 | Gerätekosten (Abschreibung + Verzinsung, Reparatur, Betrieb) + GZ |
| K7 | je LV-Position: Zeitansatz × Personalpreis = EP Lohn; Kosten Sonstiges × (1 + GZ) = EP Sonstiges |
| Prüfung SV | K-Blätter von Bietern erfassen, Vergleich mit eigener Basis, Markierung über Prüfgrenze (Einstellungen) |
| LV | LG / ULG / Positionen (OZ automatisch), Kurz-/Langtext, Normal-/Eventual-/Wahlpositionen, Vorbemerkungen, Textbausteine; Druck ohne Preise (Ausschreibung), mit Preisen, K7-Blätter |
| Preisspiegel | mehrere Bieter, EP Lohn/Sonstiges je Position, Nachlass, Rang, Markierung spekulationsverdächtiger EP |
| LV → Angebot | erzeugt Angebot mit OZ, Texten, EP und Kosten (für DB II) |

Struktur nach Grundaufbau der ÖNORM B 2061 – Zeilen frei anpassbar; Abgleich mit der gültigen Normfassung durch den Anwender.

## 12. Bedienung und Belegdarstellung (Stand 06.10.2026)
- **Speichern nur nach Bestätigung:** Änderungen werden vorgemerkt (Leiste „Ungespeicherte Änderungen – Verwerfen / Speichern“, Strg+S). Beim Verlassen einer Ansicht Rückfrage Speichern / Verwerfen / Abbrechen. Geschäftsaktionen mit eigener Bestätigung (Festschreiben, Storno, Zahlung, Lager-/Zeitbuchung, Anhang, Import) speichern sofort.
- **Rabattspalte** nur bei Bedarf (Option je Beleg; automatisch sichtbar, sobald ein Rabatt erfasst ist).
- **Langtext:** Eingabefeld in der Positionstabelle auf ca. 5 Zeilen begrenzt (scrollbar, aufziehbar); Schalter „Langtext drucken“ je Beleg (Vorschau, Druck, PDF; Gruppen- und Textzeilen bleiben), Vorgabe in den Einstellungen, Folgebelege übernehmen die Einstellung.
- **Lohn / Sonstiges** je Position optional (EP = EP Lohn + EP Sonstiges), im Ausdruck eigene Spalten und Aufteilung der Summe. Spaltenköpfe dann in Eingabe, Druck, PDF und LV: **Lohn | Sonstiges | PP | GP** (statt EP Lohn | EP Sonst. | Einzelpreis | Gesamtpreis).
- **Gruppen** (Positionsart „Gruppe“): Gruppentitel und -text, Nummerierung 1 / 1.01, Gruppensumme; optional **Gruppenpreis** (pauschal, ersetzt die Summe der Positionen) und Ausblenden der Einzelpreise; Gruppe als Option/Alternative.
- **Formatierte Texte** (fett, kursiv, unterstrichen, Aufzählung, Nummerierung) für Positions-, Gruppen-, Kopf- und Fußtexte; Inhalte werden bereinigt gespeichert.

## 13. Standardisierte Leistungsbeschreibung (LB-HT)
- Import der ONLB-Datei (ÖNORM A 2063:2021) des Bundesministeriums, aktuell LB-HT-014 (31.12.2025, 50 LG, 26.443 Positionen); Datei liegt unter `vorlagen\LB-HT-014`.
- Katalog je Gerät im Browser-Speicher (ca. 4 MB), nicht in `erp-daten.json`.
- LB-Browser: LG → ULG → Grundtext → Folgepositionen, Suche nach Stichwort, Positionsnummer und Grundtext, Mehrfachauswahl, Übernahme in bestehendes oder neues LV.
- Übernommene Positionen behalten LB-Nummer (z. B. 08.08.08A), Stichwort, Grund- und Folgetext unverändert; Ausschreiberlücken als Eingabefelder; eigene Positionen erhalten „Z“; Umwandlung in Z-Position möglich.
- Nutzungsbedingungen: Erstellen von LVs und Speichern erlaubt; Texte nicht verändern, nicht als Standalone-Produkt verkaufen.

## 14. Finanzbuchhaltung
- Kontenplan (Vorschlag angelehnt an EKR, editierbar, UVA-Kennzahl je Konto), Kontenzuordnung für automatische Buchungen.
- Automatisch aus Belegen: Ausgangsrechnungen (Erlöse je Steuersatz, USt), Gutschriften, Anzahlungen (bei Zahlung), Schlussrechnungen (Verrechnung der Anzahlungen), Eingangsrechnungen (Aufwand je Positionsart oder gewähltes Konto, Vorsteuer), Zahlungen inkl. Skonto mit Steuerkorrektur.
- Manuelle Buchungen mit Steueraufteilung (Vorsteuer/Umsatzsteuer), Storno per Gegenbuchung.
- Journal, Kontoblatt, Saldenliste (mit Vortrag), UVA-Hilfswerte (Monat/Quartal), GuV, Bilanz (Kontenklassen, Ausgleichsprüfung), CSV-Export des Journals.
- Periodensperre nach UVA-Abgabe.
- Grenzen: kein UGB-Jahresabschluss; Abschreibung, Rückstellungen, Abgrenzungen, Inventur, Ertragsteuern als manuelle Abschlussbuchungen; Personenkonten (Debitoren/Kreditoren) über die offenen Posten der Belege.

## 15. Lieferschein-Scan und Weiterverrechnung (Stand 07.10.2026)
- **Einlesen (kostenlos, ohne Fremdbibliothek, im Browser):** „📷 Lieferschein einlesen“ bzw. „📄 Eingangsrechnung einlesen“ (Überblick, Einkauf) legt Wareneingang bzw. Eingangsrechnung an und hängt die Datei an. Gelesen werden E-Rechnungen (ZUGFeRD/Factur-X eingebettet im PDF, XRechnung/PEPPOL UBL, ebInterface, UBL-Lieferavis) exakt sowie PDFs mit Textebene (eigener PDF-Textleser, Positionstabelle über Spaltenkopf): Lieferant (UID), Beleg-Nr., Datum, Bestell-Nr., Lieferadresse, Positionen; bei Rechnungen zusätzlich Netto/USt/Brutto, Fälligkeit, Skonto und Bezug auf Lieferscheine (Verknüpfung mit dem Wareneingang, Positionsbezug für Lager).
- **Fotos/eingescannte Belege:** Texterkennung (Tesseract, lokal im Browser, kostenlos; einmalig ca. 5–15 MB von jsDelivr, danach zwischengespeichert), Seitenbilder werden aus Scan-PDFs entnommen; Ergebnis immer prüfen. Optional (kostenpflichtig, nur mit API-Schlüssel je Gerät): KI-Erkennung durch Claude (Anthropic) statt Texterkennung.
- **Geschützte PDFs** (RC4/AES ohne Öffnungskennwort) und Formular-Objekte werden gelesen.
- **Originale:** eingelesene Dateien werden unverändert als Anhang abgelegt (auch E-Rechnungs-XML), im Test-Modus im Browser-Speicher.
- **Dateiname der Originale:** Lieferant-Kürzel-Nummer (LS Lieferschein, RE Eingangsrechnung, AN Lieferantenangebot), Rechtsform entfällt, z. B. `Krannich-Solar-LS-2106-4016286.pdf`; Ablage `Belege/<Belegart>/<Jahr>/`; vorhandene Dateien werden nie überschrieben (Zusatz `_2`).
- **Lieferantenangebot einlesen:** wahlweise „Als Bestellung übernehmen“ (Bestellung im Entwurf) oder „Nur Artikelstamm aktualisieren“ (neue Artikel, Listenpreis/Rabatt/EK nach Zustimmung, keine Bestellung); das Angebot wird dann bei den Artikeln unter „Unterlagen“ abgelegt.
- **Listenpreis und Rabatt** (auch „30+5“) aus Angebot, Lieferschein, Rechnung bzw. E-Rechnung werden je Lieferant im Artikelstamm geführt (Art.-Nr. beim Lieferanten, Listenpreis, Rabatt, Netto-EK, Stand) und nach Zustimmung aktualisiert; K4 übernimmt Listenpreis und Rabatt. Einkaufsbelege drucken die Art.-Nr. des Lieferanten.
- **Abgleich Artikelstamm:** Zuordnung über Lieferanten-Art.-Nr., Art.-Nr./EAN, sonst Bezeichnung (≥ 60 % Wortübereinstimmung); je Zeile änderbar (anderer Artikel, neuer Artikel, ohne Artikel). Abweichungen (EK, Einheit, Bezeichnung, Lieferanten-Art.-Nr.) und fehlender Lieferant am Artikel werden angezeigt und nur angehakt und nach Rückfrage übernommen.
- **Lager:** Schalter „Ins Lager einbuchen“ je Wareneingang; bei abweichender Lieferadresse (Baustelle) automatisch aus. Ohne Einbuchung keine Lagerbuchung, auch nicht später über Eingangs- oder Ausgangsrechnung.
- **Zu verrechnen:** Übersicht der Wareneingänge auf Aufträge bzw. mit Direktlieferung, die noch nicht per Lieferschein/Rechnung (Positionsbezug) an den Kunden weiterverrechnet sind; „→ Rechnung erstellen“ legt einen Rechnungsentwurf für den Auftragskunden an (VK aus Artikelstamm, sonst EK); „nicht verrechnen“ nimmt einen Wareneingang heraus. Kennzahl im Überblick.

- **Neuanlage im Popup:** Kunde/Lieferant direkt aus der Belegauswahl („+ Neuer …“), Lieferant aus dem Scan vorbelegt, Artikel aus einer Position („+A“).
- Logo „TBH ERP-Lite“ führt zum Überblick.
- **Kunden-/Lieferantennummer:** automatisch fortlaufend (Nummernkreis in Einstellungen „Letzte Kunden-/Lieferanten-Nr.“), in der Kontaktmaske und im Neuanlage-Popup änderbar; eindeutig über alle Kontakte; höhere manuelle Nummer setzt den Zähler nach; Änderung im Protokoll.
- **Folgebelege:** „Folgebeleg …“ auch im Entwurf (wird vorher nach Rückfrage festgeschrieben); Schnellknopf „→ Rechnung“ bei Angebot, Auftragsbestätigung, Lieferschein, Proforma; neue Wege Proforma → AB/LS/RE, Angebot → Bestellung. Weiterführend aus jedem Folgebeleg möglich.
- **Spaltenauswahl:** In allen Listen (Artikel, Verkauf, Einkauf, Kunden & Lieferanten, Lager, Aufträge, Zeiterfassung, LV, K-Blätter) über ⚙ wählbare Spalten und Reihenfolge, gespeichert in den Einstellungen; Artikel zeigen standardmäßig die Lieferanten-Art.-Nr.
- **Kontakte:** Art Privat (B2C) oder Unternehmen (B2B); Pflichtfelder Name, Straße, PLZ, Ort, Land (gekennzeichnet); UID-Nr. für B2B empfohlen (Rückfrage); optional Zahlungsziel, Skonto, Kundenrabatt – werden bei Auswahl in neue Belege übernommen (Rabatt auf Positionen ohne Rabatt und neue Positionen). Bearbeiten direkt aus dem Beleg („✎ … bearbeiten“), Hinweis auf fehlende Pflichtangaben; Rechnung nur mit vollständiger Empfängeranschrift festschreibbar. Festgeschriebene Belege behalten ihre Adresse.
- **Sammelrechnung:** „Rechnung aus Lieferscheinen …“ (Verkauf) bzw. „Sammelrechnung …“ (Lieferschein): Auswahl offener, festgeschriebener Lieferscheine eines Kunden; je Lieferschein Zwischenzeile, offene Mengen mit Positionsbezug, Leistungszeitraum (erstes–letztes LS-Datum), Bezug.
- **PDF und Versand:** „PDF speichern“ erzeugt ein echtes PDF (Text durchsuchbar, Layout wie Druck, Seitenumbruch zwischen Positionen, Kopfzeile der Tabelle wiederholt). „✉ Senden …“: E-Mail mit PDF über das angemeldete Office-365-Konto (Mail.Send), Empfänger aus dem Kontakt, Betreff/Text vorbelegt, Cc, Kopie an mich; versendetes PDF als Anhang, Versandvermerk am Beleg, Protokoll. Ohne O365-Anmeldung: PDF speichern und E-Mail-Programm öffnen.
- **Artikel-Übersicht:** Mehrfachauswahl (einzeln, „alle“ des Filters) mit Löschen, Deaktivieren, Aktivieren. Artikel in festgeschriebenen Belegen oder mit Lagerbewegung werden nicht gelöscht, sondern auf Wunsch deaktiviert (Meldung nennt den Beleg); nur in Entwürfen verwendete Artikel sind löschbar – die Entwurfspositionen behalten den Text, beim Wiederherstellen wird neu verknüpft.
- **Auswahl von Gruppe und Lagerplatz** in Artikelmaske und Neuanlage-Popup („+ Artikel“, „+A“): Klick auf das Feld öffnet ein Struktur-Popup; jeder Klick auf einen Eintrag öffnet dessen nächste Ebene, Pfad oben anklickbar (zurück), „Übernehmen“ wählt die aktuelle Ebene, Doppelklick wählt sofort; auf jeder Ebene neue Unterebene anlegen.
- **Artikelgruppen:** als Baum in beliebig vielen Ebenen (Untergruppen „+ Unter“, Verschieben samt Untergruppen, Zyklen ausgeschlossen); anlegen, umbenennen, löschen („Gruppen …“, Anzahl inkl. Untergruppen; beim Löschen rücken Untergruppen und Artikel eine Ebene nach oben); Anzeige als Pfad „PV › Speicher › Zubehör“; Filter auf eine Gruppe zeigt auch alle Untergruppen; Zuordnung in der Artikelmaske, im Neuanlage-Popup (vorbelegt mit gewähltem Filter) und für mehrere ausgewählte Artikel („Gruppe zuordnen …“, auch neue Gruppe); Auswahlfeld zum Filtern (alle / ohne Gruppe / Gruppe), Suche findet auch den Gruppennamen, Spalte „Gruppe“. Alle Schritte im Protokoll.
- Deaktivierte Artikel sind in der Übersicht ausgeblendet; Schalter „deaktivierte anzeigen (Anzahl)“, Einstellung je Gerät.
- **Live-Suche** in allen Suchfeldern (Verkauf, Einkauf, Kontakte, Artikel, LV-Bausteine, LB-Katalog) beim Tippen.
- **Papierkorb / Rückgängig:** Gelöschte Artikel, Kontakte, Belegentwürfe und Zeiteinträge kommen in den Papierkorb (Export & Sicherung) und sind wiederherstellbar; direkt nach dem Löschen Hinweis mit „Rückgängig“ (15 s). Endgültiges Löschen nur ausdrücklich. Alle Schritte im Protokoll. Festgeschriebene Belege werden nie gelöscht (nur Storno).
- **Zurück (Verlauf):** Jede Änderung (Feld, Position, Stammdaten, Dialog) ist schrittweise rücknehmbar (bis 50 Schritte): **Maus-Zurücktaste** nimmt Änderungen auf der aktuellen Seite zurück (gibt es dort nichts mehr, navigiert sie wie gewohnt), Maus-Vortaste wiederholt; außerdem Strg+Z / Strg+Y (außerhalb von Eingabefeldern) und „↶ Zurück“ in der Seitenleiste bzw. der Leiste „Ungespeicherte Änderungen“. Hinweis zeigt, was zurückgenommen wurde. Festschreiben, Storno und vergebene Belegnummern werden nie zurückgedreht (lückenlose Nummernkreise); der Verlauf beginnt nach Laden/Abgleich neu.

## 16. Offene Punkte
- **ÖNORM A 2063 (Import/Export)**: benötigt das gültige XML-Schema bzw. Beispieldateien (.onlv) – noch nicht umgesetzt.
1. Bilanz vs. Einnahmen-Ausgaben-Rechnung klären (Rechtsform?).
2. Speicherort: privater bzw. Firmen-OneDrive des Kleinunternehmens, nicht der eines Dienstgebers.
3. ~~Briefpapier-Vorlagen einarbeiten~~ erledigt 07.10.2026 (Briefkopf 1:1 aus Vorlage, Fußzeile mit Firmendaten).
4. Optional später: PDF automatisch in den Datenordner ablegen, Mahnwesen mit Mahnstufen, Mehrbenutzer (dann Server/Datenbank).

## Überblick – Verweise
- Jede Kennzahl und jede Liste im Überblick führt zu den zugehörigen Unterlagen: Offene Forderungen → Verkauf, Filter „offene Rechnungen“ („überfällig“ → Filter „überfällig“); Offene Verbindlichkeiten → Einkauf, „offene Rechnungen“; Offene Angebote → Verkauf, Angebote offen; Umsatz → Auswertungen; DB II → Aufträge; Noch zu verrechnen → Zu verrechnen; Listen-Überschriften (Überfällige Ausgangsrechnungen, Eingangsrechnungen fällig, Unter Mindestbestand, Offene Bestellungen, Entwürfe Verkauf/Einkauf) → gefilterte Liste; einzelne Zeilen → Beleg bzw. Artikel.

## Skonto
- **Zahlung buchen:** Liegt das Zahlungsdatum innerhalb der Skontofrist (Belegdatum + Skontotage), wird der Skonto (Satz × offener Bruttobetrag) vorgeschlagen: Haken „Skonto abziehen“ gesetzt, Skontobetrag und Zahlbetrag vorbelegt; Datumsänderung prüft die Frist neu, Haken und Felder bleiben änderbar. Skonto nach Fristablauf nur nach Rückfrage. Gilt für Ausgangs- und Eingangsrechnungen; FiBu bucht wie bisher Kunden-/Lieferantenskonto mit USt-/VSt-Korrektur.
- **Auswertungen → Skonto (Jahr, nach Zahlungsdatum):** Kundenskonto gewährt und Lieferantenskonto erhalten (brutto, netto, Anzahl; Kundenabzüge außerhalb der Frist markiert), nicht genutzte Lieferantenskonti (ohne Abzug bezahlt, entgangener Betrag), noch nutzbare Skonti offener Eingangsrechnungen mit Frist; Aufstellung je Monat und je Partner, Einzelliste der Zahlungen (Zahlbetrag, Skonto, %, Frist) mit Sprung zum Beleg.

## Preise und Rabatt in Verkaufsbelegen
- Artikel in Position: Einzelpreis und Rabatt nur aus früheren Belegen **desselben Kunden**; sonst VK des Artikels und Kundenrabatt (Kontakt). Preise anderer Kunden nur bewusst über die Preishistorie (Klick) übernehmen.
- **Artikel in der Position bearbeiten (✎, Verkaufsbelege):** Pop-up mit Bezeichnung, Art, Einheit, Langtext; Einkauf: Lieferant, Art.-Nr. Lieferant, Listenpreis, Rabatt Einkauf % → EK netto (rechnet in beide Richtungen), **Herstellkosten** je Einheit (Kostenwert für Kalkulation/DB II, Vorgabe = EK); Verkauf: VK/EP und Kundenrabatt mit Ergebnis je Einheit (VK − HK, %). Gilt zunächst nur für die Position; optional „im Artikelstamm speichern“ (bestehenden Artikel ändern inkl. Lieferantenkonditionen, VK nur auf Wunsch) bzw. als neuen Artikel anlegen (Nr., Gruppe). Artikelstamm: neues Feld Herstellkosten (0 = EK).
- Schalter „Rabatt“ jederzeit bedienbar: Abwählen bei Positionen mit Rabatt fragt nach und setzt den Rabatt aller Positionen auf 0 (Spalte ausgeblendet).

## Belegliste Verkauf / Einkauf
- Oben **Schaltflächen mit Piktogrammen** zum Anlegen je Belegart (Verkauf: Angebot, Auftragsbestätigung, Proforma, Lieferschein, Anzahlungs-, Teil-, Rechnung, Schlussrechnung, Rechnung aus Lieferscheinen; Einkauf: Bestellung, Wareneingang, Eingangsrechnung) statt Auswahlliste; Belegart-Filter als Schaltflächen (Alle + je Belegart).
- **Zeitraum-Filter:** Jahr, Quartal, Monat (kombinierbar, z. B. 2026 + Q2) zusätzlich zu Status und Suche.
- **Projektname:** Hängen mehrere Belege zusammen (Auftrag/Belegkette), kann über 🏷 optional ein Projektname vergeben werden; er steht fett als Überschrift über der Gruppe (✎ ändern, leer = entfernen), auch wenn nur ein Beleg im gewählten Zeitraum liegt, und ist durchsuchbar. Gespeichert am Ausgangsbeleg als reine Ordnungsangabe (ändert keinen Belegtext).

## Laufende Kosten (Nebenkosten, Versicherungen, Abgaben)
- Menü **Laufende Kosten**: Register wiederkehrender Zahlungen – Kategorien Versicherungen, Miete & Betriebskosten, Energie, Kfz & Leasing, Telefon/Internet/IT, Steuerberatung & Recht, Kammer/Beiträge/Gebühren, Steuern & Abgaben, Sozialversicherung, Bank, Werbung, Sonstiges. Je Position: Partner, Vertrags-/Polizzen-Nr., Zahlbetrag, Intervall (monatlich, vierteljährlich, halbjährlich, jährlich, einmalig), erste Fälligkeit, Laufzeit, Kündigungsfrist, Vorsteuer ja/nein (Satz), Aufwandskonto (automatisch nach Kategorie), bezahlt über (Bank, Kassa, Verrechnung Finanzamt/SV/Gemeinde), „buchen ab“, Notiz, aktiv.
- Übersicht: Kosten je Monat/Jahr, fällige noch nicht gebuchte Zahlungen (rot), nächste 45 Tage, Kündigungstermine der nächsten 90 Tage, Register je Kategorie mit Summen, Jahresübersicht Plan (Register) / Gebucht je Kategorie. Kachel im Überblick.
- **Buchen** einzeln (Datum/Betrag änderbar, z. B. Nachzahlung) oder „Alle fälligen buchen“ → manuelle FiBu-Buchung (Aufwand an Bank bzw. Verrechnungskonto; bei Vorsteuer Aufteilung netto/VSt). Storno in der FiBu macht die Fälligkeit wieder offen.
- **Abgaben & Löhne** über Verrechnungskonten: Lohnbuchung laut Lohnjournal (Brutto, SV DN, LSt, SV DG inkl. BV, DB, DZ, Kommunalsteuer → Gehälter/Löhne, 6500, 6560, 6570, 6580 an 3600/3540/3610/3620), USt-Zahllast je Monat/Quartal von 3500/2500 auf 3540 umbuchen (nicht doppelt; UVA-Auswertung bleibt unverändert), Zahlung an Finanzamt/ÖGK/Gemeinde/Nettolöhne (Vorschlag = offener Saldo). Salden der Verrechnungskonten = Abgabenkonto bzw. Beitragskonto.
- Kontenplan ergänzt (bestehende Daten einmalig): 0810 Beteiligungen, 3610 Verrechnung Gemeinde, 3620 Verbindlichkeiten Löhne, 6560 DB, 6570 DZ, 6580 Kommunalsteuer, 7340 Leasing, 7390 Software/IT, 7410 Betriebskosten, 7420 Energie, 7650 Werbung, 7780 Kammer-/Mitgliedsbeiträge, 7785 Gebühren und Abgaben, 7880 Nicht abzugsfähige Aufwendungen, 8300/8350 Erträge/Aufwand Abgang Finanzanlagen – mit dem Steuerberater abstimmen.

## Erweiterungen nach ETU (Stand 08.10.2026)
Grundlage: `VORSCHLAG-ETU.md`, Prinzip „umschaltbar und rückgängig“. Jede Neuerung ist ein eigener Commit (per `git revert` einzeln rücknehmbar); der Standard entspricht dem bisherigen Verhalten, außer bei Fehlerbehebungen.
- **Einstellungen → Erweiterungen:** Liste aller Funktionsschalter (nach Paketnummer geordnet) mit Beschreibung und Standardwert, Anzeige der vom Standard abweichenden Schalter, „Standard wiederherstellen“ je Paket und „Alle Schalter auf Standard“ (Druckprofile und Texte bleiben). Schalter wirken sofort, gespeicherte Angaben bleiben beim Ausschalten erhalten; Änderungen lassen sich mit Strg+Z zurücknehmen.
- **Druck (P0 b), Schalter „Strg+P druckt den geöffneten Beleg“ (Standard ein, Fehlerbehebung):** Strg+P im Beleg und der Druck über das Browsermenü drucken immer den gerade geöffneten Beleg (offene Eingabe wird vorher übernommen); außerhalb eines Belegs bleibt der Ausdruck leer, nie ein früher gedruckter Beleg eines anderen Kunden. Der Druckbereich wird erst beim Seitenwechsel geleert (Android/iOS). LV- und K-Blatt-Ausdrucke übernehmen nicht mehr die Firmenfußzeile eines zuvor gedruckten Belegs.
- **PDF-Tabellenkopf (P0 k):** Auf Folgeseiten wird nur der Kopf der Positionstabelle wiederholt; der Kopf der Tabelle „Optionale Positionen / Alternativen“ steht an seiner Stelle (fehlte bisher auf Folgeseiten). Einschränkung: Eine mehrseitige Optionen-Tabelle bekommt auf der Folgeseite keinen wiederholten Kopf.
- **Summenblock (P0 l):** Vorschau und PDF teilen nur noch Positionstabellen zeilenweise; der Summenblock bleibt wie im Druck zusammen und rückt bei Platzmangel als Ganzes auf die nächste Seite.
- **Nachdruck wie das Original (P0 c), Schalter „Nachdruck wie das Original“ (Standard ein, Fehlerbehebung):** Beim Festschreiben werden Fußzeile, Ansprechperson (Bearbeiter), E-Mail, Telefon, Unterzeichner und die verwendeten Steuersätze (Satz, Bezeichnung, Hinweistext) im Beleg eingefroren, bei Bestellungen auch die Lieferanten-Art.-Nr. aus dem Artikelstamm. Nachdruck, PDF, Vorschau, Summen, FiBu und UVA festgeschriebener Belege verwenden diese Werte, auch wenn sich die Einstellungen später ändern; ein beim Festschreiben leerer Wert bleibt leer. Das Logo wird nicht eingefroren. Belege, die vor dieser Änderung festgeschrieben wurden, und Entwürfe zeigen wie bisher die aktuellen Einstellungen. Bestellungen drucken zusätzlich die Lieferanten-Art.-Nr. aus den Einkaufsdaten der Position, wenn der Artikelstamm keine hat (nur beim selben Lieferanten). Ausgeschaltet gelten wieder die aktuellen Einstellungen; die eingefrorenen Werte bleiben gespeichert. Fußzeile in Vorschau, Druck und PDF stammt aus einer Quelle (der Belegdarstellung).
- **Steuersätze geschützt (P0 d):** Steuersätze, die in festgeschriebenen Belegen vorkommen, sind in Einstellungen → Steuersätze gesperrt (Code, Satz, Bezeichnung, Hinweistext; Kennzeichnung „gesperrt“). Für einen neuen Satz wird ein neuer Code angelegt. Damit ändern sich USt, Brutto, FiBu und UVA alter Rechnungen nicht mehr (§ 11 UStG, § 131 BAO).
- **Pflichtangaben (P0 m):** Einstellungen → Firma und der Dialog beim Festschreiben von Rechnungen weisen auf fehlende Firmenbuch-Nr., Firmenbuchgericht oder UID-Nr. hin (§ 14 UGB, § 11 UStG). Es wird nichts automatisch eingetragen; das Firmenbuchgericht trägt der Anwender selbst ein.
- **Vermerk „DUPLIKAT“ (P0 n), Schalter „Vermerk DUPLIKAT bei erneuter Ausgabe von Rechnungen“ (Standard aus):** Druck, PDF und E-Mail-Versand festgeschriebener Rechnungen (AR, TR, RE, SR, GS) werden je Beleg gezählt (bei älteren Rechnungen zählen bereits per E-Mail versendete mit). Ab der zweiten Ausgabe fragt das Programm „Als DUPLIKAT kennzeichnen?“ (vorbelegt Ja; Abbrechen, Ohne Vermerk); der Vermerk steht über dem Belegtitel, auch im PDF und im Dateinamen des Druckdialogs. Druck über das Browsermenü kennzeichnet ab der zweiten Ausgabe ohne Rückfrage. Das erste Original bleibt unverändert, die Bildschirm-Vorschau zeigt keinen Vermerk. Der Zähler wird nach der Ausgabe gespeichert, ist im Beleg als „n× ausgegeben“ sichtbar und wird weder durch Rückgängig noch durch den Abgleich zwischen Geräten verkleinert; ein nur auf einem Gerät erhöhter Zähler gilt beim Abgleich nicht als Konflikt.
- **Kleinere Korrekturen (P0 e–j, Fehlerbehebungen ohne Schalter):**
  - *Duplizieren* übernimmt Langtextdruck sowie die Spalten Rabatt und Lohn/Sonstiges wie ein Folgebeleg.
  - *Neuer Beleg aus dem Kontakt* („+ Angebot“, „+ Rechnung“, „+ Bestellung“, „+ Eingangsrechnung“) übernimmt die Konditionen wie die Kontaktwahl im Beleg: Zahlungsziel auch bei 0 Tagen (bisher Standardwert), Skonto und Kundenrabatt.
  - *Lohn/Sonstiges:* Einheitenwechsel rechnet Lohn und Sonstiges mit um; Änderungen des Preises im Artikel-Pop-up gehen auf Sonstiges (Lohn höchstens bis zum neuen Preis). In beiden Fällen gilt Einzelpreis = Lohn + Sonstiges, ein Rundungsrest geht auf Sonstiges.
  - *Optionen und Alternativen:* Positionen in Options- oder Alternativgruppen werden nicht mehr in Lieferschein, Rechnung, Bestellung oder Korrektur-Gutschrift übernommen (bisher ohne Gruppenkopf und damit voll verrechnet) und nicht vom Lager gebucht; ein Auftrag mit Optionsgruppe gilt nach vollständiger Lieferung als erledigt. Angebot → Auftragsbestätigung bzw. Proformarechnung übernimmt weiterhin alles; der Hinweis beim Festschreiben von Rechnungen mit Optionen bleibt.
  - *Lieferanten-Art.-Nr.:* Bei Einkaufsbelegen steht sie in der Position (Feld `lnr`) statt im Langtext und wird einmal als „(Ihre Art.-Nr. …)“ gedruckt (bisher bei Langtextdruck doppelt); der Tabellen-Editor zeigt sie unter der Art.-Nr. Beim Lieferantenwechsel im Beleg wird sie durch die des neuen Lieferanten ersetzt. Ältere Positionen bleiben unverändert.
- **Druckprofil je Belegart (P1), Schalter „Druckprofil je Belegart“ (Standard ein):** Einstellungen → Erweiterungen → „Druck & Belegdarstellung“ legt die Darstellungsoptionen je Belegart fest (Wahl der Belegart, „Standard wiederherstellen“ mit Rückfrage, „auf alle Rechnungsarten übertragen“ inkl. Gutschrift). Im Beleg öffnet „Druckoptionen …“ (bzw. „Druckformat …“ über der Vorschau) dieselben Felder; gespeichert werden nur Abweichungen für diesen Beleg, „Wie Belegart“ setzt sie zurück (ein Rückgängig-Schritt). Beim Festschreiben wird die Darstellung im Beleg eingefroren (Nachdruck wie das Original), „Bearbeiten“ (AN, AB, BE, PR) hebt das auf. Duplizieren, Folgebeleg und Revision übernehmen die Abweichungen (nicht die Bestellung an den Lieferanten). Bei Rechnungsarten sind Gesamtpreise und Summenblock immer enthalten (§ 11 UStG). Ausgeschaltet: Entwürfe im Standard-Aussehen, festgeschriebene Belege mit ihrem eingefrorenen Stand; alle Einstellungen bleiben gespeichert. Alle Vorgaben entsprechen dem bisherigen Aussehen.
- **Zusammenfassung der Titel und Gruppensummen (P2, Druckoptionen):** „Zusammenfassung der Titel“ (aus/ab 2 Gruppen/immer, Standard aus) druckt vor dem Summenblock eine Tabelle mit Nummer, Bezeichnung und Summe jeder Gruppe, Positionen vor der ersten Gruppe als „Positionen ohne Gruppe“; Optionen und Alternativen sind nicht enthalten. Ergibt die Tabelle nicht den Nettobetrag, entfällt sie. „Gruppensumme“ am Ende (Standard), am Anfang im Gruppenkopf, an beiden Stellen oder keine (Options-/Alternativgruppen behalten ihre Summe am Ende; Hinweis, wenn ohne Zusammenfassung keine Gruppensumme gedruckt würde). Beschriftung mit {Nr} und {Bez} (Standard „Summe {Nr} {Bez}“). Nicht bei Lieferschein und Wareneingang.
- **Infoblock, Grußformel, Fußzeile, Kostenvoranschlag (P5, Druckoptionen, Standard wie bisher):** Beleg-Nr. im Infoblock nach der Kunden-Nr. (z. B. „Angebots-Nr.“, „Rechnungs-Nr.“) mit Hinweis darunter (Standard „Bei Rückfragen bitte angeben“, bei Rechnungen eigener Text, Standard leer), die Überschrift zeigt dann nur die Belegart; Beschriftung „Gültig bis“ (z. B. „Bindefrist“, auch im Formular); Infoblock als zweispaltige Tabelle; Grußformel und Firmenname über der Unterschrift (mit Grußformel auch bei Bestellungen), Unterschriftsblock wahlweise links; Kostenvoranschlag-Text nur bei Angeboten an Privatkunden (nach den Zahlungsbedingungen, § 5 Abs. 2 KSchG); Zusatzzeile der Fußzeile (höchstens 90 Zeichen, Hinweis bei zu breiter Zeile) als dritte Zeile auf jeder Seite in Vorschau, Druck und PDF, Standard nur bei Unternehmern (Gerichtsstand gegenüber Verbrauchern unwirksam, § 14 KSchG). Die Pflichtangaben der Fußzeile bleiben fest. Festgeschriebene Belege behalten Grußformel, Firmenname, Zusatzzeile und Kundenart (die Kundenart steht nun im Adress-Schnappschuss).
- **Prüfung beim Einlesen (P14 Stufe 1), Schalter „Preiseinheit beim Einlesen prüfen“ (Standard ein, Fehlerbehebung):** Beim Einlesen aus PDF-Text und Scans wird je Zeile Menge × Einzelpreis (ohne bzw. mit Rabatt) gegen den Gesamtpreis geprüft. Ergibt sich ein Faktor 10, 100 oder 1000 (±2 %), stand der Preis je 10/100/1000 Einheiten (z. B. Kabel „Preis/100“) und wird auf je Einheit umgerechnet (bisher 100-fach zu hoher EK im Artikelstamm); ohne Gesamtpreis gilt eine Spalte „PE“ bzw. der Spaltenkopf „Preis/100“. Im Abgleich ist die Umrechnung markiert („÷ 100“ mit gelesenem Preis) und je Zeile abwählbar; Zeilen mit Menge × EP ≠ GP sind rot markiert. EK-Vorschlag und neuer Artikel erhalten dann mehr Nachkommastellen (z. B. 0,4537 €/m), sonst wie bisher Cent. Korrektur: Ein Klick in Menge, Preis oder Rabatt der Vorschau ändert den Wert nur noch bei echter Eingabe (bisher wurde z. B. ein EP 0,4537 schon beim Verlassen des Feldes auf 0,45 gekürzt). E-Rechnungen unverändert. Preiseinheit je Artikel/Position und Druck „je 100 m“ folgen mit P14 Stufe 2.
- **Aufschlag (P11, Teil):** Schalter „Feld Aufschlag %“ (Standard ein): Im Artikel-Pop-up einer Verkaufsposition (✎) zeigt „Aufschlag %“ den Aufschlag des VK nach Kundenrabatt auf die Herstellkosten; eine Eingabe berechnet EP = HK × (1 + Aufschlag/100) ÷ (1 − Rabatt/100), Änderungen von EP, Rabatt, EK oder HK rechnen den Aufschlag neu. Der Aufschlag ist intern (nicht gespeichert, nie gedruckt). Schalter „VK-Vorschlag aus dem Aufschlag je Artikel“ (Standard ein): Artikelfeld „VK-Aufschlag % auf HK“; ändert sich beim Einlesen der EK, schlägt der Abgleich VK = (HK bzw. EK) × (1 + Aufschlag/100) vor (abwählbar; übernommen wird der angezeigte Wert, auch bei abgewähltem EK), im Artikel erscheint bei abweichendem VK „VK-Vorschlag … übernehmen“. Ohne eingetragenen Aufschlag ändert sich nichts. Dazu Korrektur: hohe Dialoge (Artikel-Pop-up) sind am Handy scrollbar.
- **Navigation (P19 a/c/d):** „Zuletzt geöffnet“ (Schalter, Standard ein): 🕘 in der Seitenleiste bzw. in der Kopfzeile am Handy listet die 12 zuletzt geöffneten Belege, Kontakte, Artikel, Aufträge, LVs und K-Blätter mit Belegart, Nummer, Kunde und Status; gemerkt je Gerät nur als interne Kennung (keine Namen, keine Datenänderung), Gelöschtes wird übersprungen, „Liste leeren“. Statuszeile unter dem Belegtitel (Schalter, Standard ein): „Verkauf › Angebote“ (anklickbar, gefilterte Liste), Belegdatum, Kunde bzw. Lieferant, Netto (läuft mit), angelegt bzw. festgeschrieben mit Uhrzeit; wahlweise beim Scrollen oben fixiert mit Nummer und Status (Schalter, Standard aus). Die Seitenleiste markiert bei geöffnetem Beleg „Verkauf“ bzw. „Einkauf“, bei Kontakt und Auftrag die zugehörige Liste.
- **Kontakte (P6, Teil):** Filter „Alle | Kunden | Lieferanten“ über der Kontaktliste (Schalter, Standard ein mit „Alle“; Kunde + Lieferant erscheint in beiden; Wahl je Gerät gemerkt; direkt über `#/kontakte/K` bzw. `#/kontakte/L`), Suche zusätzlich in Zusatz, E-Mail, Telefon und Kunden-Nr.; Untereinträge „Kunden“/„Lieferanten“ in der Seitenleiste (Schalter, Standard aus). Feld „Unsere Kunden-Nr.“ beim Lieferanten: Bestellung, Wareneingang und Eingangsrechnung zeigen im Infoblock „Unsere Kunden-Nr.“ statt der internen Lieferanten-Nr., nur wenn eingetragen; beim Festschreiben eingefroren, ältere festgeschriebene Belege bleiben unverändert. Anrede und Briefanrede folgen in Stufe 2.
