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
- Druckansicht A4 je Beleg, Logo, Firmendaten, Pflichtangaben; LS und WE ohne Preise.
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
- Angebote: Revision (`AN-JJJJ-NNNN-R1`, Vorgänger „ersetzt“) und Folgeangebot (neue Nummer, gleicher Vorgang).

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
- **Lohn / Sonstiges** je Position optional (EP = EP Lohn + EP Sonstiges), im Ausdruck eigene Spalten und Aufteilung der Summe.
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
- **Lieferantenangebot einlesen** legt eine Bestellung (Entwurf) an.
- **Listenpreis und Rabatt** (auch „30+5“) aus Angebot, Lieferschein, Rechnung bzw. E-Rechnung werden je Lieferant im Artikelstamm geführt (Art.-Nr. beim Lieferanten, Listenpreis, Rabatt, Netto-EK, Stand) und nach Zustimmung aktualisiert; K4 übernimmt Listenpreis und Rabatt. Einkaufsbelege drucken die Art.-Nr. des Lieferanten.
- **Abgleich Artikelstamm:** Zuordnung über Lieferanten-Art.-Nr., Art.-Nr./EAN, sonst Bezeichnung (≥ 60 % Wortübereinstimmung); je Zeile änderbar (anderer Artikel, neuer Artikel, ohne Artikel). Abweichungen (EK, Einheit, Bezeichnung, Lieferanten-Art.-Nr.) und fehlender Lieferant am Artikel werden angezeigt und nur angehakt und nach Rückfrage übernommen.
- **Lager:** Schalter „Ins Lager einbuchen“ je Wareneingang; bei abweichender Lieferadresse (Baustelle) automatisch aus. Ohne Einbuchung keine Lagerbuchung, auch nicht später über Eingangs- oder Ausgangsrechnung.
- **Zu verrechnen:** Übersicht der Wareneingänge auf Aufträge bzw. mit Direktlieferung, die noch nicht per Lieferschein/Rechnung (Positionsbezug) an den Kunden weiterverrechnet sind; „→ Rechnung erstellen“ legt einen Rechnungsentwurf für den Auftragskunden an (VK aus Artikelstamm, sonst EK); „nicht verrechnen“ nimmt einen Wareneingang heraus. Kennzahl im Überblick.

- **Neuanlage im Popup:** Kunde/Lieferant direkt aus der Belegauswahl („+ Neuer …“), Lieferant aus dem Scan vorbelegt, Artikel aus einer Position („+A“).
- Logo „TBH ERP-Lite“ führt zum Überblick.

## 16. Offene Punkte
- **ÖNORM A 2063 (Import/Export)**: benötigt das gültige XML-Schema bzw. Beispieldateien (.onlv) – noch nicht umgesetzt.
1. Bilanz vs. Einnahmen-Ausgaben-Rechnung klären (Rechtsform?).
2. Speicherort: privater bzw. Firmen-OneDrive des Kleinunternehmens, nicht der eines Dienstgebers.
3. ~~Briefpapier-Vorlagen einarbeiten~~ erledigt 07.10.2026 (Briefkopf 1:1 aus Vorlage, Fußzeile mit Firmendaten).
4. Optional später: PDF automatisch in den Datenordner ablegen, Mahnwesen mit Mahnstufen, Mehrbenutzer (dann Server/Datenbank).
