# ERP-Lite auf PC und Handy – Einrichtung (einmalig, ca. 20 min)

Aufbau: Die App (`index.html`) liegt unter einer festen https-Adresse. Daten, Sicherungen und Belegfotos liegen in **deinem OneDrive (Microsoft 365 Business)** im Ordner `ERP-Lite`. PC und Handy melden sich mit demselben Microsoft-Konto an.

## 1. App veröffentlichen (GitHub Pages, kostenlos)
1. Konto auf github.com anlegen (falls nicht vorhanden).
2. Neues Repository, z. B. `erp-lite` → *Add file → Upload files* → `index.html` hochladen → *Commit*.
3. *Settings → Pages → Source: Deploy from a branch → Branch `main`, Ordner `/ (root)` → Save*.
4. Nach ca. 1 min ist die App erreichbar unter `https://tbh-stefan.github.io/erp-lite/` – diese Adresse notieren.

Das Repository ist öffentlich, enthält aber **nur den Programmcode**, keine Daten. Client-ID und Mandanten-ID sind keine Geheimnisse.

## 2. App in Microsoft Entra registrieren (mit Admin-Konto des M365-Mandanten)
1. https://entra.microsoft.com → *Identität → Anwendungen → App-Registrierungen → Neue Registrierung*.
2. Name: `ERP-Lite` · Kontotypen: *Nur Konten in diesem Organisationsverzeichnis*.
3. Umleitungs-URI: Plattform **Single-Page-Anwendung (SPA)**, Adresse aus Schritt 1.4 (genau so, mit `/` am Ende) → *Registrieren*.
4. Auf der Übersichtsseite kopieren: **Anwendungs-ID (Client)** und **Verzeichnis-ID (Mandant)**.
5. *API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Delegierte Berechtigungen*: `Files.ReadWrite`, `offline_access`, `openid`, `profile` (`User.Read` ist schon da) → *Administratorzustimmung erteilen*.

## 3. IDs eintragen
In `index.html` ganz oben im Block `CONFIG` die beiden IDs eintragen, Datei erneut auf GitHub hochladen (ersetzen).
Alternativ beim ersten Start in die Felder des Startbildschirms eingeben (dann pro Gerät).

## 4. Erster Start
- **PC:** Adresse in Edge/Chrome öffnen → *Mit Microsoft anmelden*. Der Ordner `ERP-Lite` mit `erp-daten.json` wird im OneDrive angelegt. Firmendaten unter *Einstellungen* erfassen.
- **Handy:** Adresse in Chrome (Android) bzw. Safari (iPhone) öffnen → anmelden → *Zum Startbildschirm hinzufügen*. Danach startet ERP-Lite wie eine App.

## Verhalten im Alltag
| Thema | Verhalten |
|---|---|
| Speichern | automatisch nach jeder Änderung; Anzeige oben rechts (Handy) bzw. unten links (PC) |
| Gerätewechsel | beim Zurückkehren in die App und jede Minute wird der neueste Stand geholt |
| Gleichzeitige Änderung | wird je Datensatz zusammengeführt; nur wenn **derselbe** Beleg auf beiden Geräten geändert wurde, gilt die zuerst gespeicherte Version (Hinweis erscheint) |
| Kein Netz (Keller, Baustelle) | Entwürfe, Zeiten, Kontakte können weiter erfasst werden und werden später nachgetragen – auch nach Schließen der App |
| Festschreiben / Nummernvergabe | **nur mit Internet** – verhindert doppelte Rechnungsnummern zwischen PC und Handy |
| Eingangsrechnung | Überblick → *📷 Eingangsrechnung* → Foto; wird verkleinert und unter `ERP-Lite/Belege/ER/<Jahr>/` abgelegt |
| PDF am Handy | *Drucken / PDF* → im Druckdialog *Als PDF speichern* bzw. *Teilen* |
| Anmeldung | Microsoft verlangt bei Browser-Apps spätestens nach 24 h eine neue Anmeldung (meist nur ein Tippen) |
| Sicherung | täglich `ERP-Lite/backup/erp-daten_JJJJ-MM-TT.json`; OneDrive-Versionsverlauf zusätzlich |

## Sicherheit
- Die Berechtigung `Files.ReadWrite` erlaubt der App Zugriff auf das OneDrive des angemeldeten Benutzers; sie schreibt nur in den Ordner `ERP-Lite`.
- Die Anmeldung gilt im Browser des Geräts → **Bildschirmsperre am Handy** verwenden. MFA/Richtlinien des Mandanten gelten automatisch.
- Abmelden: *Export & Sicherung → Abmelden*.

## Updates der App
Neue `index.html` auf GitHub hochladen (CONFIG-Werte vorher übernehmen). Die Daten im OneDrive bleiben unberührt.
