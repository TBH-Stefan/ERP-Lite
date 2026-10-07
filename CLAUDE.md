# ERP-Lite – Hinweise für Claude

Einzelplatz-ERP der TBH GmbH (Österreich): Handel, Elektrotechnik, Sachverständigenleistungen.
Anwender: Stefan Horvath. Sprache in Code-Kommentaren, Oberfläche und Antworten: **Deutsch**.

## Aufbau
- **Eine Datei:** `index.html` (HTML, CSS, JavaScript ohne Build-Schritt, keine Frameworks, keine Fremdbibliotheken). So soll es bleiben.
  Einzige Ausnahme (vom Anwender freigegeben): Texterkennung für Scans/Fotos mit Tesseract.js 5.1.1, wird nur bei Bedarf von jsDelivr nachgeladen (`TESS`, `ocrZeilen()`); PDF-Text und E-Rechnungen liest das Programm selbst (`pdfLesen()`, `xmlBeleg()`).
- Veröffentlicht über GitHub Pages: https://tbh-stefan.github.io/ERP-Lite/ (Groß-/Kleinschreibung beachten). Jeder Push auf `main` geht nach ca. 1 Minute online.
- Daten liegen **nicht** im Repository: `erp-daten.json` im OneDrive (Microsoft Graph, Login per OAuth/PKCE) oder in einem lokalen Ordner. Niemals Firmen- oder Kundendaten committen.
- Fachlicher Umfang und Regeln: `PFLICHTENHEFT.md`. Einrichtung: `ANLEITUNG-MOBIL.md`, `ANLEITUNG-GITHUB.md`.

## Wichtige Bereiche in index.html
- `CONFIG` (oben im Script): Client-ID / Mandanten-ID aus Microsoft Entra (keine Geheimnisse).
- Speichern: `persist()` merkt Änderungen nur vor (Leiste „Ungespeicherte Änderungen“), `commit()` speichert. Geschäftsaktionen mit eigener Bestätigung (Festschreiben, Storno, Zahlung, Lager, Zeiten, Anhänge, Import, Buchungen) rufen `commit()` auf. Navigation durch das Programm: `go()`, durch den Benutzer: `nav()`.
- Belege: `T` (Belegarten), `summen()`, `gruppenInfo()`, `festschreiben()` (lückenlose Nummern, Sicherheitsdialog), `docHTML()` (Vorschau/Druck).
- Kalkulation ÖNORM B 2061 (K2–K7), LV, Preisspiegel; Standard-LB-Import (ONLB, ÖNORM A 2063): `lbParse()`.
- Finanzbuchhaltung: `fibuAuto()` leitet Buchungen aus Belegen ab, `fibuManuell()`, `salden()`, `guv()`.
- Abgleich zwischen Geräten: `merge3()` (3-Wege je Datensatz).
- Belege einlesen: `belegScan()` → `belegLokal()` (E-Rechnung, PDF-Text, Texterkennung; KI nur mit Schlüssel) → `textBeleg()` → Abgleich `scanBox()`/`scanUebernehmen()`. Originale unverändert über `anhaengeHochladen(…,true)`.
- Popups für Neuanlage: `formDialog()`, `kontaktPopup()`, `artikelPopup()`.

## Regeln für Änderungen
- Bestehende Funktionen gezielt ändern, nicht die Datei neu schreiben. Stil des umgebenden Codes übernehmen (kompakt, deutsche Bezeichner).
- Rechtliche Vorgaben (Österreich) beachten: § 11 UStG Rechnungsmerkmale, lückenlose Nummernkreise, festgeschriebene Belege unveränderbar (Korrektur nur per Storno/Gutschrift), BAO-Aufbewahrung.
- Datenmodell nur abwärtskompatibel erweitern; fehlende Felder in `migrate()` bzw. `neueDB()` ergänzen.
- Nach Änderungen im Browser testen (Start „Nur im Browser testen“), Konsole auf Fehler prüfen, Rechenergebnisse nachrechnen.
- Commit-Nachrichten auf Deutsch, kurz und beschreibend.
