# Catan Friends - Kooperatives Abenteuer

Eine moderne Mehrspieler-Webanwendung für ein kooperatives Catan-Brettspielerlebnis in Echtzeit.

Gemeinsam statt gegeneinander: Erkundet einen unendlichen Kontinent, erfüllt modulare Team-Quests mit W6-Timern, handelt über 4 Tausch-Modi, spielt mit kooperativen KI-Bots und verteidigt euer Reich gegen die Patrouille des Räubers!

---

## Spielfeatures & Spielmechanik

### 1. Kooperatives Teamspiel & Siegesbedingungen
- **Gemeinsames Team-Siegziel**: Standardmäßig **10 Team-Siegpunkte pro Spieler** (z. B. 20 Punkte bei 2 Spielern, 30 bei 3 Spielern). Die Spiellänge kann in der Lobby vom Host gewählt werden (Kurz: 6 Pkt/Spieler, Standard: 10 Pkt/Spieler, Episch: 14 Pkt/Spieler).
- **Punktquellen für das Team**:
  - Jede **Siedlung** auf dem Feld bringt **+1 Team-Siegpunkt**.
  - Jede **Stadt** auf dem Feld bringt **+2 Team-Siegpunkte**.
  - Jede gelöste **Quest** bringt **+1 Team-Siegpunkt**.
  - **Längste Handelsstraße** (ab 7 zusammenhängenden Straßen) bringt **+3 Team-Siegpunkte**.
  - **Größte Rittermacht** (ab 3 gespielten Rittern) bringt **+3 Team-Siegpunkte**.
- **Niederlage**: Scheitern 4 Quests durch abgelaufene Zeitlimits, verliert das Team gemeinsam.

### 2. Modulare Quests mit W6-Würfel-Timer & Krisen-Management
- **4 aktive Quest-Slots**: Ständig 4 offene Herausforderungen mit W6-Timer (6 bis 1 Runde).
- **Balancierte Auftragsstufen (Tiers 1 bis 6)**: Von ersten Holz- und Lehm-Lieferungen (2 Rohstoffe) über Straßenbau- und Siedlungs-Aufträge bis hin zum monumentalen Endgame.
- **Runden-Countdown**: Zu Beginn jeder vollen Spielrunde sinkt der Timer aller offenen Quests um 1.
- **Bedarf einlagern (Schutz vor der 7 & Zeitgewinn)**: Rohstoffe für Quests können schrittweise eingezahlt werden. Eingelagerte Ressourcen sind **vollständig vor dem Räuber geschützt**, wenn eine 7 gewürfelt wird! Zudem steigt der W6-Timer bei jeder Einzahlung um **+2 Runden** (bis max. 6), was gezieltes Abwenden drohender Fehlschläge ermöglicht.

### 3. Handels-, Tausch- und Hilfesystem (4 Modi)
- **🏛️ Bankhandel & Häfen**: Standardkurs 4:1. An 3:1 Allzweckhäfen oder mit der *Längsten Handelsstraße* sinkt die Quote auf 3:1. An 2:1 Spezial-Häfen handelt das Team Rohstoffe 2:1.
- **🤝 Mitspieler-Tausch (2-Wege-Tausch)**: Biete 1 Rohstoff im Tausch gegen einen gewünschten Zielrohstoff an (gezielt an einen Mitspieler oder offen ans gesamte Team).
- **📢 Rohstoff-Anfrage (Hilferuf)**: Fehlt dir 1 Rohstoff für eine Siedlung oder Stadt? Stelle eine Hilfeanfrage! Mitspieler und Bots sehen ein interaktives Banner und können den Rohstoff mit einem Klick übergeben.
- **🎁 Rohstoff schenken (1-Weg)**: Bedingungslose Unterstützung für Teamkameraden (1 Rohstoffkarte pro Zug, bzw. 2 mit der *Längsten Handelsstraße*).

### 4. Die Patrouille des Räubers & Rittermacht
- **Feste Patrouillen-Route (A bis R)**: Bei einer gewürfelten 7 zieht der Räuber automatisch zum nächsten Buchstaben seiner Route und plündert angrenzende Siedlungen.
- **Handkarten-Abwurf**: Spieler mit mehr als 7 Handkarten müssen bei einer 7 die Hälfte ihrer Karten abgeben (eingelagerte Quest-Rohstoffe bleiben geschützt).
- **Ritter anheuern**: Jeder Spieler kann für 1x Erz, 1x Wolle und 1x Weizen einen Ritter rufen (Kapitän erhält pro Zug 1 kostenlosen Ritter).
- **Progressiver Rückstoß**: Jeder Ritter wirft den Räuber auf seiner Route nach hinten und erbeutet 1 Rohstoffkarte.
- **Größte Rittermacht (ab 3 Rittern)**: Schleudert den Räuber maximal weit weg, betäubt ihn für 1 Runde und halbiert seine Patrouille (nur noch jede 2. Runde).

### 5. Kooperative Team-Meilensteine
- **Längste Handelsstraße (ab 7 Straßen)**:
  - +3 permanente Team-Siegpunkte
  - +1 zusätzliche Schenkung pro Zug (2 Schenkungen)
  - 3:1 Bankhandel auch ohne See-Hafen
  - +1 W6-Timer-Puffer für alle künftigen Quests
- **Größte Rittermacht (ab 3 Rittern)**:
  - +3 permanente Team-Siegpunkte
  - Maximales Exil für den Räuber
  - Betäubung des Räubers für 1 Runde (kein Raubzug)
  - Halbierung der Räuber-Aktivität auf jede 2. Runde

### 6. Offener Kontinent & Küsten-Häfen
- **Unendliche Landmasse**: Das Spiel startet mit dem klassischen 19-Hex-Kernland. Straßenbau nach Norden, Osten und Westen deckt fortlaufend neues Festland mit Rohstoffen und Zahlenchips auf.
- **Südküste & See-Häfen**: Nach Süden hin trifft das Team auf das offene Meer mit 2:1 Spezial- und 3:1 Allzweck-Häfen.

### 7. KI-Bots & Fremdbau
- **Kooperative Bots**: Bots (z. B. Bot Mia) können in der Lobby hinzugefügt werden. Sie platzieren Startsiedlungen, würfeln, bedienen Quests und helfen bei Tauschangeboten und Rohstoff-Anfragen verlässlich aus.
- **Fremdbau**: Ein aktiver Spieler kann mit den eigenen Rohstoffen Straßen, Siedlungen oder Städte in der Farbe seiner Teammitglieder errichten.
- **4 Charakterrollen**:
  - **Pionier**: Zahlt für Straßen nur 1 Holz oder 1 Lehm.
  - **Baumeister**: Benötigt für Siedlungen und Städte je 1 Rohstoff weniger.
  - **Schürfer**: Erhält auf Erz- und Getreidefeldern bei passendem Wurf +1 Bonus-Rohstoff.
  - **Hauptmann**: Erhält pro Zug 1 kostenlosen Ritter und wirft den Räuber weiter zurück.

### 8. Dynamische Animationen & Visuals
- Taumelnde 3D-Würfel mit echter Wurf-Animation.
- Pulsierende Ertrags-Felder mit goldenem Glow und schwebenden "✨ Ertrag"-Badges.
- "🏴‍☠️ Blockiert"-Badges für vom Räuber besetzte Rohstofffelder.
- Generierte, detailreiche Rohstoffkarten und handgefertigte Icons.
- Stufenloses Pan & Zoom (Mausrad und Drag).
- Interaktives Regelbuch ("Das Buch der Regeln") im Spiel integriert.

---

## Technologie-Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas Confetti
- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Echtzeit-Kommunikation**: WebSocket-Synchronisation für Aktionen, Chat und Spielzustand

---

## Lokale Installation & Start

### Voraussetzungen
- Node.js (v18+)
- npm

### 1. Repository klonen
```bash
git clone git@github.com:susesKaninchen/CatanFriends.git
cd CatanFriends
```

### 2. Abhängigkeiten installieren
```bash
# Server-Abhängigkeiten installieren
cd server
npm install

# Client-Abhängigkeiten installieren
cd ../client
npm install
```

### 3. Entwicklungsserver starten

Im Hauptverzeichnis stehen bequeme npm-Skripte zur Verfügung:

```bash
# Backend starten (Port 3001)
npm run server

# Frontend starten (Port 5173)
npm run client
```

Oder alternativ direkt in den jeweiligen Unterordnern:
- **Server**: `cd server && npm run dev`
- **Client**: `cd client && npm run dev`

Öffne anschließend [http://localhost:5173](http://localhost:5173) im Browser.
