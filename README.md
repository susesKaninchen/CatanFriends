# Catan Friends - Kooperatives Abenteuer

Eine moderne Mehrspieler-Webanwendung für ein kooperatives Catan-Brettspielerlebnis in Echtzeit.

Gemeinsam statt gegeneinander: Erkundet eine prozedural wachsende Insel, erfüllt kooperative Quests, handelt Rohstoffe und verteidigt euer Reich gegen den Räuber!

---

## Spielfeatures & Besonderheiten

- **Kooperatives Spielziel**: Erfüllt gemeinsam modulare Quests (Pionier der Insel, Hafenmeister, Kornkammer, Festungsbau), bevor die W6-Runden-Timer ablaufen.
- **Gemeinschaftliche Straßen**: Alle Straßen gehören dem gesamten Team. Jedes Teammitglied kann an bestehende Straßen anbauen (bis zu 30 Straßen pro Spieler).
- **Prozedurale Insel-Erweiterung**: Das Spielfeld wächst organisch bei jedem Straßenbau an die Küste weiter. Realistisches Gewässer-Clustering sorgt für Buchten, Seen und Fjorde.
- **Stufenloses Pan & Zoom**: Mausrad zum Zoomen, Ziehen per linker Maustaste zum Verschieben der Karte oder On-Screen-Steuerungselemente.
- **Interaktiver Räuber**: Bei einer gewürfelten 7 oder beim Ausspielen einer Ritterkarte platziert der aktive Spieler die hölzerne Räuberfigur per Klick auf ein beliebiges Landfeld, erbeutet Rohstoffe von angrenzenden Spielern und blockiert Erträge.
- **Handelssystem (4:1 Bank & Team-Schenken)**: Tauscht 4 gleiche Rohstoffe bei der Bank gegen einen beliebigen Rohstoff oder verschenkt Rohstoffe an Teammitglieder.
- **Authentische Mittelalter-Optik**: Verzierter Holz- und Pergament-Look, historische Spielkarten mit Eck-Indizes und Wachssiegel-Countern, handgefertigtes kristallines Erz-Icon und saubere Zahlenchips mit Wahrscheinlichkeitspunkten.
- **4 Spezial-Rollen**:
  - **Pionier**: Zahlt für Straßen nur 1 Holz oder 1 Lehm.
  - **Baumeister**: Benötigt für Siedlungen und Städte 1 Rohstoff weniger.
  - **Schürfer**: Erhält auf Erz- und Getreidefeldern +1 Bonus-Rohstoff.
  - **Hauptmann**: Drängt den Räuber mit Ritterkarten zurück und schützt das Reich.

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
