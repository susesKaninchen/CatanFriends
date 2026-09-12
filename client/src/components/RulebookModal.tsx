import React, { useState } from 'react';
import { BookOpen, X, Scroll, Users, Compass, Shield, Flame, Hammer, ArrowLeftRight } from 'lucide-react';

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'trading' | 'quests' | 'robber' | 'fremdbau' | 'exploration' | 'pieces';

export const RulebookModal: React.FC<RulebookModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#1c140d] border-2 border-[#855829] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] text-[#e8d5b5] font-serif overflow-hidden">
        {/* Header with Walnut Wood banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5a3818] bg-gradient-to-r from-[#2b1810] via-[#3a2016] to-[#2b1810]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#d4af37]" />
            <div>
              <h2 className="text-xl font-bold font-['MedievalSharp',serif] text-[#f6ebd7] tracking-wide">
                Catan Friends - Das Buch der Regeln
              </h2>
              <p className="text-xs text-[#c49a6c]">
                Gemeinsam siedeln, entdecken und siegen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#c49a6c] hover:text-[#f6ebd7] hover:bg-[#4a2e1b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 px-6 py-2.5 bg-[#170e08] border-b border-[#3d2412] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'overview'
                ? 'bg-[#855829] text-[#fff8ec] shadow'
                : 'text-[#a8825c] hover:bg-[#2e1c10] hover:text-[#e8d5b5]'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            Übersicht & Ziel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trading')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'trading'
                ? 'bg-[#855829] text-[#fff8ec] shadow'
                : 'text-[#a8825c] hover:bg-[#2e1c10] hover:text-[#e8d5b5]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Handel & Tausch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quests')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'quests'
                ? 'bg-[#855829] text-[#fff8ec] shadow'
                : 'text-[#a8825c] hover:bg-[#2e1c10] hover:text-[#e8d5b5]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Quests & W6-Timer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('robber')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'robber'
                ? 'bg-[#855829] text-[#fff8ec] shadow'
                : 'text-[#a8825c] hover:bg-[#2e1c10] hover:text-[#e8d5b5]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Räuber-Patrouille
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fremdbau')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'fremdbau'
                ? 'bg-[#855829] text-[#fff8ec] shadow'
                : 'text-[#a8825c] hover:bg-[#2e1c10] hover:text-[#e8d5b5]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Fremdbau & Rollen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exploration')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'exploration'
                ? 'bg-[#855829] text-[#fff8ec] shadow'
                : 'text-[#a8825c] hover:bg-[#2e1c10] hover:text-[#e8d5b5]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Insel-Wachstum & Meer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pieces')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'pieces'
                ? 'bg-[#855829] text-[#fff8ec] shadow'
                : 'text-[#a8825c] hover:bg-[#2e1c10] hover:text-[#e8d5b5]'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            Baulimits
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm leading-relaxed text-[#dfcfba] font-sans custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-['MedievalSharp',serif] text-[#f4caa1] border-b border-[#5a3818] pb-1">
                Ein kooperatives Catan-Erlebnis
              </h3>
              <p>
                In <strong>Catan Friends</strong> spielt ihr nicht gegeneinander, sondern als ein eingespieltes Team von Pionieren. Euer gemeinsames Ziel ist es, den Gefahren der Insel zu trotzen und anspruchsvolle <strong>Quests</strong> zu erfüllen, bevor der Räuber oder ablaufende Fristen das Land ins Verderben stürzen!
              </p>
              <div className="bg-[#2a1a10] border border-[#5c3a1e] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#f0af68] flex items-center gap-2">
                  <span>🏆</span> Siegesbedingung (10 Punkte pro Spieler)
                </h4>
                <p className="text-xs text-[#c9b59e] leading-relaxed">
                  Erreicht als Team das gemeinsame Siegziel von standardmäßig <strong>10 Team-Siegpunkten pro Spieler</strong> (z. B. 20 Punkte bei 2 Spielern, 30 bei 3 Spielern)! In der Lobby kann der Host zwischen Kurz (6/Spieler), Standard (10/Spieler) und Episch (14/Spieler) wählen.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="bg-[#1e130a] p-2 rounded-lg border border-[#4a2e16]">
                    <span className="text-amber-400 font-bold block">🏠 Siedlungen</span>
                    <span className="text-[#a88260]">+1 Punkt pro Siedlung</span>
                  </div>
                  <div className="bg-[#1e130a] p-2 rounded-lg border border-[#4a2e16]">
                    <span className="text-amber-400 font-bold block">🏰 Städte</span>
                    <span className="text-[#a88260]">+2 Punkte pro Stadt</span>
                  </div>
                  <div className="bg-[#1e130a] p-2 rounded-lg border border-[#4a2e16]">
                    <span className="text-amber-400 font-bold block">📜 Quests</span>
                    <span className="text-[#a88260]">+1 Punkt pro Quest</span>
                  </div>
                  <div className="bg-[#1e130a] p-2 rounded-lg border border-[#4a2e16]">
                    <span className="text-amber-400 font-bold block">🛤️ Handelsstraße</span>
                    <span className="text-[#a88260]">+3 Punkte fürs Team</span>
                  </div>
                  <div className="bg-[#1e130a] p-2 rounded-lg border border-[#4a2e16]">
                    <span className="text-amber-400 font-bold block">⚔️ Rittermacht</span>
                    <span className="text-[#a88260]">+3 Punkte fürs Team</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#241a10] border border-[#5c3e1e] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#f59e0b] flex items-center gap-2">
                  <span>🏡</span> Gründungsphase & Startrohstoffe
                </h4>
                <p className="text-xs text-[#c9b59e] leading-relaxed">
                  Damit kleinere Teams faire Startchancen haben, richtet sich der Spielbeginn nach der Gruppengröße:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#cfbeaa]">
                  <li>
                    <strong>1-2 Spieler:</strong> Jeder Spieler darf mit <strong>2 Siedlungen und 2 Straßen</strong> starten (serpentine Reihenfolge).
                  </li>
                  <li>
                    <strong>3-4 Spieler:</strong> Jeder Spieler startet mit <strong>1 Siedlung und 1 Straße</strong>.
                  </li>
                  <li>
                    <strong>Sofortige Startrohstoffe:</strong> Für jede gegründete Startsiedlung erhält der Spieler sofort je 1 Rohstoff von allen direkt angrenzenden Ertragsfeldern.
                  </li>
                </ul>
              </div>
              <div className="bg-[#2a1210] border border-[#6b231d] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#f87171] flex items-center gap-2">
                  <span>💀</span> Niederlagebedingung (4 Fehlschläge)
                </h4>
                <p className="text-xs text-[#e5b3af] leading-relaxed">
                  Quests fordern euch heraus und lenken vom Siedlungsbau ab: Bei 4 abgelaufenen Quests verliert das Team sofort! Eingezahlte Rohstoffe sind vor dem Räuber geschützt, aber der W6-Timer läuft unerbittlich jede Runde weiter. Erfüllt die Aufträge rechtzeitig gemeinsam!
                </p>
              </div>
              <div className="bg-[#1f1910] border border-[#6b4e28] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#f4d068] flex items-center gap-2">
                  <span>⭐</span> Kooperative Team-Meilensteine (+3 Punkte)
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#cfbeaa]">
                  <li>
                    <strong>Längste Handelsstraße (ab 7 Straßen):</strong> +3 Team-Siegpunkte, +1 zusätzliche Schenkung pro Zug, 3:1 Bankhandel auch ohne Hafen und +1 W6-Timer für künftige Quests.
                  </li>
                  <li>
                    <strong>Größte Rittermacht (ab 3 Rittern):</strong> +3 Team-Siegpunkte, schleudert den Räuber maximal weit weg, betäubt ihn für 1 Runde und halbiert seine Patrouille (nur noch jede 2. Runde).
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'trading' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-['MedievalSharp',serif] text-[#f4caa1] border-b border-[#5a3818] pb-1">
                Handel, Tausch & Rohstoff-Anfragen
              </h3>
              <p>
                In <strong>Catan Friends</strong> ist enge wirtschaftliche Zusammenarbeit der Schlüssel zum Sieg. Über das <strong>Handel & Tausch Menü</strong> stehen euch vier mächtige Werkzeuge zur Verfügung:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3 space-y-1">
                  <h4 className="font-bold text-[#f59e0b] text-xs flex items-center gap-1.5">
                    🏛️ 1. Bankhandel & Häfen
                  </h4>
                  <p className="text-[11px] text-[#c9b59e]">
                    Tausche überschüssige Rohstoffe direkt mit der Bank. Der Standardkurs beträgt 4:1. Besitzt euer Team eine Siedlung an einem 3:1 Allzweckhafen oder den Meilenstein <em>Längste Handelsstraße</em>, sinkt der Kurs auf 3:1. An 2:1 Spezial-Häfen handelt ihr den entsprechenden Rohstoff sogar 2:1!
                  </p>
                </div>

                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3 space-y-1">
                  <h4 className="font-bold text-[#60a5fa] text-xs flex items-center gap-1.5">
                    🤝 2. Mitspieler-Tausch (2-Wege)
                  </h4>
                  <p className="text-[11px] text-[#c9b59e]">
                    Biete einen fairen Tausch an: Biete z. B. 1x Holz für 1x Lehm. Das Angebot kann gezielt an einen bestimmten Mitspieler oder als offene Anfrage an das gesamte Team gerichtet werden. Der Empfänger (oder ein Team-Bot) kann annehmen oder ablehnen.
                  </p>
                </div>

                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3 space-y-1">
                  <h4 className="font-bold text-[#34d399] text-xs flex items-center gap-1.5">
                    📢 3. Rohstoff-Anfrage (Hilferuf)
                  </h4>
                  <p className="text-[11px] text-[#c9b59e]">
                    Fehlt dir genau 1x Erz oder 1x Wolle für eine wichtige Siedlung? Stelle eine offene Anfrage ans Team! Alle Mitspieler sehen eine leuchtende Karte und können mit einem Klick den gewünschten Rohstoff übergeben. Team-Bots helfen sofort aus, wenn sie den Rohstoff besitzen.
                  </p>
                </div>

                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3 space-y-1">
                  <h4 className="font-bold text-[#e879f9] text-xs flex items-center gap-1.5">
                    🎁 4. Rohstoff schenken (1-Weg)
                  </h4>
                  <p className="text-[11px] text-[#c9b59e]">
                    Möchtest du einem Mitspieler bedingungslos unter die Arme greifen? Verschenke in deinem Zug bis zu 1 Rohstoffkarte (oder 2 Karten mit dem Meilenstein <em>Längste Handelsstraße</em>) direkt an einen Partner deiner Wahl.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-['MedievalSharp',serif] text-[#f4caa1] border-b border-[#5a3818] pb-1">
                Quests und die W6-Würfel-Timer
              </h3>
              <p>
                Auf dem Spielbrett gibt es ständig <strong>4 aktive Quest-Slots</strong>. Jede Quest besitzt einen eigenen Würfel-Countdown (W6-Timer von 6 bis 1).
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-[#cfbeaa]">
                <li>
                  <strong>Ticken der Zeit:</strong> Zu Beginn jeder vollen Spielrunde wird der W6-Timer für alle offenen Quests um 1 Punkt reduziert (z. B. von 4 auf 3).
                </li>
                <li>
                  <strong>Ablauf:</strong> Erreicht ein Timer 0, scheitert der Auftrag und wird durch eine neue Herausforderung ersetzt. Bei 4 Fehlschlägen hat das Team verloren!
                </li>
                <li>
                  <strong>Rohstoff-Einzahlung & Zeitgewinn:</strong> Quests verlangen Rohstofflieferungen (z. B. Holz oder Erz). Eingezahlte Rohstoffe sind sicher vor der Räuber-7 gelagert! Jede Einzahlung belohnt das Team mit wertvoller Zeit: Der W6-Timer steigt sofort um +2 Runden (maximal 6 Runden). Jede erfüllte Quest bringt dem Team +1 Team-Siegpunkt.
                </li>
                <li>
                  <strong>Bau- und Verbindungsquests:</strong> Manche Aufträge fordern den Bau einer bestimmten Anzahl Straßen oder Siedlungen auf bestimmten Landschaften.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'robber' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-['MedievalSharp',serif] text-[#f4caa1] border-b border-[#5a3818] pb-1">
                Die Patrouille des Räubers
              </h3>
              <p>
                Der Räuber startet zu Spielbeginn in der <strong>Wüste</strong> und lauert dort vorerst friedlich.
              </p>
              <div className="bg-[#2b1710] border border-[#5e381d] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#f59e0b] text-xs uppercase tracking-wider">
                  Wie bewegt sich der Räuber?
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#cfbeaa]">
                  <li>
                    Wird eine <strong>7</strong> gewürfelt oder beginnt eine neue Runde, zieht der Räuber <strong>genau 1 Feld</strong> Schritt für Schritt in Richtung des ertragreichsten Feldes der Siedler.
                  </li>
                  <li>
                    Alle Spieler mit mehr als <strong>7 Handkarten</strong> müssen bei einer 7 die Hälfte ihrer Handkarten an die Bank abgeben. In Quests eingelagerte Rohstoffe sind sicher!
                  </li>
                  <li>
                    Der Räuber blockiert immer <strong>nur genau das Feld, auf dem er steht</strong> (keine Nachbarfelder).
                  </li>
                  <li>
                    Wird eine <strong>7</strong> gewürfelt, zieht er 1 Feld vor und <strong>stiehlt von allen anliegenden Gebäuden</strong> (Siedlungen und Städten) je eine Rohstoffkarte von deren Besitzern. Bei Runden-Patrouillen wird nicht gestohlen.
                  </li>
                </ul>
              </div>
              <div className="bg-[#241510] border border-[#5e2d1d] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider">
                  Ritter anheuern & Räuber zurückwerfen
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#cfbeaa]">
                  <li>
                    <strong>Für alle Spieler:</strong> Jeder Spieler kann in seinem Zug für 1x Erz, 1x Wolle und 1x Weizen einen Ritter rufen.
                  </li>
                  <li>
                    <strong>Kapitän-Vorteil:</strong> Der Kapitän erhält pro Zug 1 kostenlosen Ritter!
                  </li>
                  <li>
                    <strong>Progressiver Rückstoß:</strong> Jeder Ritter drängt den Räuber auf der Route zurück und erbeutet 1 Rohstoffkarte. Je mehr Ritter das Team versammelt hat, desto weiter wird der Räuber nach hinten geworfen!
                  </li>
                  <li>
                    <strong>Größte Rittermacht (ab 3 Rittern):</strong> Bringt +1 Siegpunkt, verbannt den Räuber an den fernsten Punkt der Insel, betäubt ihn für 1 Runde und halbiert seine Patrouille auf jede 2. Runde!
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'fremdbau' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-['MedievalSharp',serif] text-[#f4caa1] border-b border-[#5a3818] pb-1">
                Fremdbau und Charakterrollen
              </h3>
              <p>
                Das Herzstück von Catan Friends ist der <strong>Fremdbau</strong>: Ein Spieler, der am Zug ist und die nötigen Rohstoffe besitzt, kann ein Gebäude oder eine Straße in der Farbe eines <em>Mitspielers</em> errichten!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3">
                  <h4 className="font-bold text-[#34d399] text-xs flex items-center gap-1.5">
                    <Compass className="w-4 h-4" /> Pionier
                  </h4>
                  <p className="text-[11px] text-[#c9b59e] mt-1">
                    Baut Straßen für nur 1 Holz ODER 1 Lehm (statt beidem). Perfekt, um entlegene Gebiete schnell zu erschließen!
                  </p>
                </div>
                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3">
                  <h4 className="font-bold text-[#fbbf24] text-xs flex items-center gap-1.5">
                    <Hammer className="w-4 h-4" /> Baumeister
                  </h4>
                  <p className="text-[11px] text-[#c9b59e] mt-1">
                    Erhält beim Bau von Siedlungen und Städten einen Rabatt von 1 frei wählbaren Rohstoff.
                  </p>
                </div>
                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3">
                  <h4 className="font-bold text-[#38bdf8] text-xs flex items-center gap-1.5">
                    <PickaxeIcon className="w-4 h-4" /> Bergmann
                  </h4>
                  <p className="text-[11px] text-[#c9b59e] mt-1">
                    Garantiert zusätzliche Erz- und Lehm-Erträge bei hohen Würfelwürfen (8, 9, 10, 11).
                  </p>
                </div>
                <div className="bg-[#20150d] border border-[#52341b] rounded-xl p-3">
                  <h4 className="font-bold text-[#f87171] text-xs flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Kapitän
                  </h4>
                  <p className="text-[11px] text-[#c9b59e] mt-1">
                    Kann Ritterkarten aktivieren, um den Räuber auf seiner Route zurückzuwerfen und Plünderungen abzuwehren.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exploration' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-['MedievalSharp',serif] text-[#f4caa1] border-b border-[#5a3818] pb-1">
                Dynamisches Insel-Wachstum & Küsten-Häfen
              </h3>
              <p>
                Die Insel beginnt als großes <strong>19-Hex-Kernland</strong> mit allen 5 Rohstoffarten und der Wüste. Die weite Welt dahinter wird beim Bauen erkundet!
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-[#cfbeaa]">
                <li>
                  <strong>Bauen als Erkundungswerkzeug:</strong> Wird eine Straße oder Siedlung am Rand des bekannten Gebiets gebaut, werden die direkt anliegenden Felder aufgedeckt (keine riesigen Kaskaden, sondern Schritt für Schritt).
                </li>
                <li>
                  <strong>Endloser Kontinent:</strong> Nach Norden, Osten und Westen erstrecken sich unendliche Landmassen mit neuen Rohstofffeldern, Zahlenchips und Räuber-Routen.
                </li>
                <li>
                  <strong>Südküste & Häfen:</strong> Stoßt ihr weit nach Süden vor, trefft ihr auf das offene Meer und strategische See-Häfen (2:1 Spezial-Häfen und 3:1 Allzweck-Häfen für günstigen Bankhandel)!
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'pieces' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-['MedievalSharp',serif] text-[#f4caa1] border-b border-[#5a3818] pb-1">
                Authentische Baulimits
              </h3>
              <p>
                Wie im originalen Brettspiel besitzt jeder Spieler einen begrenzten Vorrat an Baumaterialien:
              </p>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-[#22160d] border border-[#5a381a] rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">🛣️</div>
                  <span className="font-bold text-white block text-sm">30 Straßen</span>
                  <span className="text-[10px] text-[#b39578]">Pro Spieler</span>
                </div>
                <div className="bg-[#22160d] border border-[#5a381a] rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">🏠</div>
                  <span className="font-bold text-white block text-sm">5 Siedlungen</span>
                  <span className="text-[10px] text-[#b39578]">Pro Spieler</span>
                </div>
                <div className="bg-[#22160d] border border-[#5a381a] rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">🏰</div>
                  <span className="font-bold text-white block text-sm">4 Städte</span>
                  <span className="text-[10px] text-[#b39578]">Pro Spieler</span>
                </div>
              </div>
              <div className="bg-[#2b1b11] border border-[#6b4421] rounded-xl p-3 text-xs text-[#cfbeaa]">
                <strong>Rückgabe beim Ausbau:</strong> Wird eine Siedlung zu einer Stadt ausgebaut, geht die Siedlungs-Spielfigur sofort wieder zurück in den persönlichen Vorrat des Spielers und kann später erneut gebaut werden!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#3d2412] bg-[#170e08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#855829] hover:bg-[#9d6932] text-[#fff8ec] font-bold text-xs shadow-md transition-all font-sans"
          >
            Verstanden, weiter zum Spiel!
          </button>
        </div>
      </div>
    </div>
  );
};

function PickaxeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.531 4.268a18.047 18.047 0 0 1 4.7 4.7" />
      <path d="M13.887 5.176c-.958-.958-2.512-.958-3.47 0L8.71 6.883a2.454 2.454 0 0 0 0 3.47l.956.956L3 18l3 3 6.691-6.666.956.956a2.454 2.454 0 0 0 3.47 0l1.707-1.707c.958-.958.958-2.512 0-3.47l-4.937-4.937z" />
    </svg>
  );
}
