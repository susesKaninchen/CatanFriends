import React, { useState } from 'react';
import { BookOpen, X, Scroll, Users, Compass, Shield, Flame, Hammer } from 'lucide-react';

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'quests' | 'robber' | 'fremdbau' | 'exploration' | 'pieces';

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
                  <span>🏆</span> Siegesbedingung
                </h4>
                <p className="text-xs text-[#c9b59e]">
                  Erfüllt insgesamt 12 Quests über alle Quest-Stufen hinweg als Team. Jeder erledigte Auftrag bringt euch dem endgültigen Triumph näher!
                </p>
              </div>
              <div className="bg-[#2a1210] border border-[#6b231d] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#f87171] flex items-center gap-2">
                  <span>💀</span> Niederlagebedingung
                </h4>
                <p className="text-xs text-[#e5b3af]">
                  Sollte die Insel von Katastrophen überrollt werden oder zu viele Quests scheitern (4 Fehlschläge), verliert das Team gemeinsam.
                </p>
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
                  <strong>Ablauf:</strong> Erreicht ein Timer 0, scheitert der Auftrag und wird durch eine neue Herausforderung ersetzt. Zudem drohen dem Team empfindliche Strafen!
                </li>
                <li>
                  <strong>Rohstoff-Einzahlung:</strong> Viele Quests verlangen Rohstofflieferungen (z. B. 4 Holz). Jeder Spieler kann in seinem Zug per Klick auf die Einzahlungs-Schaltfläche passende Rohstoffe direkt spenden. Eingezahlte Rohstoffe sind vor der 7 des Räubers geschützt!
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
                Der Räuber wandert unerbittlich auf einer festen <strong>Buchstaben-Route (A bis R)</strong> über die Insel.
              </p>
              <div className="bg-[#2b1710] border border-[#5e381d] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-[#f59e0b] text-xs uppercase tracking-wider">
                  Wie bewegt sich der Räuber?
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#cfbeaa]">
                  <li>
                    Wird eine <strong>7</strong> gewürfelt, zieht der Räuber sofort zum nächsten Buchstaben seiner Route (z. B. von D nach E).
                  </li>
                  <li>
                    Alle Spieler mit mehr als <strong>7 Handkarten</strong> müssen sofort die Hälfte ihrer Karten abgeben.
                  </li>
                  <li>
                    Alle Siedlungen und Städte, die direkt an das Zielfeld des Räubers angrenzen, werden geplündert (jeder betroffene Spieler verliert 1 Rohstoffkarte).
                  </li>
                </ul>
              </div>
              <p className="text-xs text-[#c9b59e]">
                <strong>Ritterkarte & Kapitän:</strong> Der Kapitän kann gespielte Ritterkarten einsetzen, um den Räuber auf seiner Route um 2 Felder zurückzudrängen und wertvolle Zeit für das Team zu gewinnen!
              </p>
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
                Dynamisches Insel-Wachstum & Ozeane
              </h3>
              <p>
                Die Insel beginnt als kompaktes <strong>7-Hex-Kernland</strong>. Die weite Welt dahinter liegt im Verborgenen!
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-[#cfbeaa]">
                <li>
                  <strong>Straßen als Erkundungswerkzeug:</strong> Baut ein Spieler eine Straße in Richtung des unerforschten Inselrandes, wird das umliegende Gelände aufgedeckt.
                </li>
                <li>
                  <strong>Zufällige Landschaften:</strong> Neue Felder können fruchtbares Land (Wald, Hügel, Weideland, Ackerland, Gebirge) mit Würfelzahlen und Räuber-Buchstaben sein.
                </li>
                <li>
                  <strong>Ozean & Wasser-Sperren:</strong> Zu 25% trifft eure Expedition auf offenes Meer. Auf reinen Wasserfeldern können <em>weder Straßen noch Siedlungen</em> gebaut werden - ihr müsst einen anderen Weg um die Küste finden!
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
                Wie im originalen Brettspiel besitzt jeder Spieler einen streng begrenzten Vorrat an Baumaterialien:
              </p>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-[#22160d] border border-[#5a381a] rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">🛣️</div>
                  <span className="font-bold text-white block text-sm">15 Straßen</span>
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
