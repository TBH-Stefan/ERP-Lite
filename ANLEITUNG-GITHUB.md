# GitHub einrichten und ERP-Lite veröffentlichen

Ergebnis: ERP-Lite ist unter `https://<benutzername>.github.io/erp-lite/` erreichbar (PC und Handy).
Diese Adresse brauchst du danach für die Microsoft-Entra-Registrierung (`ANLEITUNG-MOBIL.md`, Schritt 2).

## Vorab: was ins Repository kommt
| kommt hinein | bleibt draußen (`.gitignore`) |
|---|---|
| `index.html`, `README.md`, `PFLICHTENHEFT.md`, Anleitungen, `.gitignore` | `erp-daten.json`, `backup/`, `Belege/` (Firmendaten), `vorlagen/` (LB-HT, 10 MB) |

Mit dem kostenlosen GitHub-Konto muss das Repository für GitHub Pages **öffentlich** sein. Das ist unkritisch: Es enthält nur Programmcode; Client-ID und Mandanten-ID sind keine Geheimnisse. Ein privates Repository mit Pages erfordert GitHub Pro (ca. 4 USD/Monat).

## 1. Konto anlegen (ca. 5 min)
1. https://github.com/signup öffnen.
2. E-Mail: Firmenadresse verwenden (z. B. `office@…` oder deine TBH-Adresse), Passwort, **Benutzername** wählen – er wird Teil der Adresse (`<benutzername>.github.io`). Kurz und neutral wählen, z. B. `tbh-gmbh`.
3. E-Mail bestätigen (Code aus dem Postfach eingeben).
4. **Zwei-Faktor-Anmeldung einschalten:** Profilbild → *Settings* → *Password and authentication* → *Enable two-factor authentication* → Authenticator-App (z. B. Microsoft Authenticator). Wiederherstellungscodes sicher ablegen.

## 2. Repository anlegen (ca. 2 min)
1. Oben rechts **+** → *New repository*.
2. Repository name: `erp-lite` · Sichtbarkeit: **Public** · *Add a README file*: **nicht** anhaken (README kommt aus dem Projektordner).
3. *Create repository*.

## 3. Dateien hochladen
### Variante A – im Browser (ohne Git, für den Start am einfachsten)
1. Im neuen Repository auf *uploading an existing file* klicken.
2. Aus `OneDrive - TBH GmbH\TBH-GmbH\ERP-Lite` diese Dateien hineinziehen:
   `index.html`, `README.md`, `PFLICHTENHEFT.md`, `ANLEITUNG-MOBIL.md`, `ANLEITUNG-GITHUB.md`, `.gitignore`
   (die Ordner `vorlagen` und `backup` **nicht** hochladen).
   Hinweis: `.gitignore` ist im Explorer evtl. ausgeblendet – *Ansicht → Ausgeblendete Elemente* einschalten.
3. Unten *Commit changes*.

Für spätere Updates: Datei im Repository anklicken → *Add file → Upload files* → neue `index.html` hineinziehen → *Commit changes*.

### Variante B – mit Git (empfohlen, sobald Git installiert ist)
Im Terminal im Projektordner:
```
git init -b main
git config user.name "Stefan Horvath"
git config user.email "<E-Mail des GitHub-Kontos>"
git add .
git commit -m "ERP-Lite: erster Stand"
git remote add origin https://github.com/<benutzername>/erp-lite.git
git push -u origin main
```
Beim ersten `git push` öffnet sich ein Anmeldefenster (Browser) – mit dem GitHub-Konto bestätigen.
Spätere Updates: `git add .` · `git commit -m "Beschreibung"` · `git push`.

## 4. GitHub Pages einschalten (ca. 2 min)
1. Im Repository *Settings* → links *Pages*.
2. *Build and deployment* → Source: **Deploy from a branch** · Branch: **main** · Ordner: **/ (root)** → *Save*.
3. Nach 1–2 Minuten erscheint oben: *Your site is live at* `https://<benutzername>.github.io/erp-lite/`.
4. Adresse im Browser öffnen → Startbildschirm von ERP-Lite muss erscheinen.

## 5. Danach
1. Adresse aus Schritt 4.3 in Microsoft Entra als **Umleitungs-URI (Single-Page-Anwendung)** eintragen – genau so, mit `/` am Ende (`ANLEITUNG-MOBIL.md`, Schritt 2).
2. Client-ID und Mandanten-ID in `index.html` im Block `CONFIG` eintragen und die Datei erneut hochladen (Variante A) bzw. committen und pushen (Variante B).
3. Am PC und am Handy die Adresse öffnen → *Mit Microsoft anmelden*.

## Checkliste
- [ ] Konto angelegt, Zwei-Faktor aktiv
- [ ] Repository `erp-lite` (Public) angelegt
- [ ] Dateien hochgeladen, **keine** `erp-daten.json`, kein `backup/`, kein `vorlagen/`
- [ ] Pages aktiv, Adresse öffnet ERP-Lite
- [ ] Adresse als Umleitungs-URI in Entra eingetragen
