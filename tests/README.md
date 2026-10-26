# Regressionstests ERP-Lite

Nur für die Entwicklung; die App selbst bleibt `../index.html` ohne Build-Schritt. Die Tests laden die App im Modus
„Nur im Browser testen“ mit erfundenen Testdaten (`testdaten.js`), fester Uhrzeit (12.10.2026 08:00, Europe/Vienna) und festem Zufall.

## Starten

```
cd tests
npm ci
npx playwright install chromium   # einmalig; in der Claude-Cloud-Umgebung schon vorhanden
npx playwright test               # alles, Bildschirm 1400 × 900 und Handy 390 × 844
node act-duplikate.js             # nur doppelte Aktionen, ohne Browser (Sekunden)
BASIS=a412d32 npx playwright test schalter   # Vergleich gegen einen bestimmten Stand
```

Auf GitHub laufen die Tests bei jedem Pull Request auf `main` (`.github/workflows/tests.yml`) und von Hand unter Actions → Tests.

## Was geprüft wird

| Datei | Prüfung |
|---|---|
| `act.spec.js` / `act-duplikate.js` | Keine doppelten Schlüssel in `ACT`, `ACT_LV`, `ACT_LB`, `ACT_FB`, `ACT_KBW`, `MENUE`, `LIVE`, `FILTER`, `KM`, `V` – auch nicht über `Object.assign(ACT,…)` und `...ACT_KBW`. Erweiterungen eines Eintrags (`const m0=MENUE.beleg;MENUE.beleg=…m0(el)…`) gelten nicht als Duplikat. |
| `schalter.spec.js` | Alle Erweiterungen aus → `#main` aller Ansichten (Belege in Eingabe, Vorschau und „Beides“), `docHTML` (Druck und Editor) und PDF (Inhalt und Datei-Info) gleich wie im Ausgangsstand `BASIS` (Vorgabe `origin/main`, im Pull Request die Spitze von `main`). Die Karte „Erweiterungen“ in den Einstellungen und Leerraum ohne Wirkung auf die Darstellung zählen nicht. Beabsichtigte Unterschiede: `erlaubte-abweichungen.json`. |
| `fest.spec.js` | Festgeschriebene Belege: Druck, PDF (Inhalt und Datei-Info) und Summen bleiben nach Änderung von Firma, Bearbeiter, Steuersätzen, Texten, Druckprofilen, Kontakten, Artikeln und Tarifen gleich; Nummernkreise lückenlos (auch nach weiterem Festschreiben und „Zurück“); Rechnungsarten ohne Eingabefelder. |
| `ansichten.spec.js` | Jede Ansicht ohne Konsolenfehler, nicht leer und ohne waagrechten Überlauf, mit Standard-Schaltern und mit allen aus. Dazu: kein Text läuft aus Knöpfen, Kacheln (`.sfb`), Karten (`.kk`) und Segmenten, mit allen Schaltern ein (auch `#/schnell`). |

Der Vergleich mit dem Ausgangsstand setzt dieselben Testdaten in beide Fassungen; die Daten erzeugt der aktuelle Stand
(`vorbereiten.js`, Ergebnis in `.tmp/`). Gegen weit zurückliegende Stände gibt es daher erwartete Unterschiede (z. B. Felder
wie die Preiseinheit, die die alte Fassung nicht kennt, oder Entscheidungen „Standard neu“ wie der Infoblock vom 12.10.2026).

## Neue Tests

- Neue Ansicht oder Belegart: in `hilfe.js` → `ansichten()` bzw. in `testdaten.js` ergänzen.
- Neue Funktion hinter einem Schalter: nichts zu tun – `schalter.spec.js` prüft automatisch, dass sie ausgeschaltet nichts ändert.
- Keine echten Firmen- oder Kundendaten in `testdaten.js`.
