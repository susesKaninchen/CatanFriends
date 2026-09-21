import React, { useState } from 'react';
import { GameRoomState, PlayerColor, PlayerRole } from '../types';
import { socket } from '../socket';
import { Users, Bot, Play, CheckCircle2, Shield, Compass, Hammer, Pickaxe, BookOpen } from 'lucide-react';

interface LobbyProps {
  roomState: GameRoomState | null;
  myPlayerId: string;
  onOpenRulebook?: () => void;
}

const ROLES: { id: PlayerRole; name: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'pioneer',
    name: 'Pionier',
    icon: <Compass className="w-5 h-5 text-emerald-400" />,
    description: 'Zahlt für Straßen wahlweise nur 1 Holz ODER 1 Lehm.'
  },
  {
    id: 'builder',
    name: 'Baumeister',
    icon: <Hammer className="w-5 h-5 text-amber-400" />,
    description: 'Benötigt für Siedlungen und Städte je 1 Rohstoff weniger nach freier Wahl.'
  },
  {
    id: 'miner',
    name: 'Schürfer',
    icon: <Pickaxe className="w-5 h-5 text-sky-400" />,
    description: 'Erhält auf Erz- und Getreidefeldern bei passendem Wurf +1 Bonus-Rohstoff.'
  },
  {
    id: 'captain',
    name: 'Hauptmann',
    icon: <Shield className="w-5 h-5 text-rose-400" />,
    description: 'Heuert Ritter mit 1 Rohstoff Rabatt an (2 statt 3 Rohstoffe aus Erz, Wolle, Weizen; max. 1x/Zug).'
  }
];

const COLORS: { id: PlayerColor; name: string; bg: string; text: string; border: string }[] = [
  { id: 'red', name: 'Rot', bg: 'bg-red-600', text: 'text-red-400', border: 'border-red-500' },
  { id: 'blue', name: 'Blau', bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500' },
  { id: 'orange', name: 'Orange', bg: 'bg-amber-600', text: 'text-amber-400', border: 'border-amber-500' },
  { id: 'white', name: 'Weiß', bg: 'bg-slate-200 text-slate-900', text: 'text-slate-200', border: 'border-slate-300' }
];

export const Lobby: React.FC<LobbyProps> = ({ roomState, myPlayerId, onOpenRulebook }) => {
  const [playerName, setPlayerName] = useState('Siedler ' + Math.floor(Math.random() * 100));
  const [joinCode, setJoinCode] = useState('');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [selectedRole, setSelectedRole] = useState<PlayerRole>('pioneer');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    socket.emit('create_room', { playerName, color: selectedColor, role: selectedRole, sessionId: myPlayerId }, (res: any) => {
      if (!res.success) {
        setError(res.message);
      } else {
        sessionStorage.setItem('catan_friends_room_code', res.roomCode);
        if (res.playerId) sessionStorage.setItem('catan_friends_player_id', res.playerId);
      }
    });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setError('Bitte gib einen 4-stelligen Raumcode ein.');
      return;
    }
    setError(null);
    socket.emit('join_room', { roomCode: joinCode.trim(), playerName, color: selectedColor, role: selectedRole, sessionId: myPlayerId }, (res: any) => {
      if (!res.success) {
        setError(res.message);
      } else {
        sessionStorage.setItem('catan_friends_room_code', res.roomCode);
        if (res.playerId) sessionStorage.setItem('catan_friends_player_id', res.playerId);
      }
    });
  };

  const handleAddBot = () => {
    if (!roomState) return;
    socket.emit('add_bot', { roomCode: roomState.roomCode }, (res: any) => {
      if (!res.success) setError(res.message);
    });
  };

  const handleToggleReady = () => {
    if (!roomState) return;
    const me = roomState.players.find(p => p.id === myPlayerId);
    if (!me) return;
    socket.emit('set_ready', { roomCode: roomState.roomCode, isReady: !me.isReady });
  };

  const handleStartGame = () => {
    if (!roomState) return;
    socket.emit('start_game', { roomCode: roomState.roomCode }, (res: any) => {
      if (!res.success) setError(res.message);
    });
  };

  const handleSetPointsPerPlayer = (pts: number) => {
    if (!roomState) return;
    socket.emit('set_points_per_player', { roomCode: roomState.roomCode, points: pts }, (res: any) => {
      if (res && !res.success) setError(res.message);
    });
  };

  const myPlayer = roomState?.players.find(p => p.id === myPlayerId);
  const isHost = myPlayer?.isHost;

  if (!roomState) {
    return (
      <div className="min-h-screen bg-[#1c120a] bg-gradient-to-b from-[#2a1b10] via-[#1c120a] to-[#120b06] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#22150c]/95 border-2 border-[#73451e] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 space-y-6 text-[#e8d5b5]">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <img
                src="/assets/logo.jpg"
                alt="Catan Friends Wappen"
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(212,175,55,0.25)] object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h1 className="text-3xl font-bold font-['MedievalSharp',serif] tracking-wide text-[#fff4e0] drop-shadow">
              Catan Friends
            </h1>
            <p className="text-xs text-[#c49a6c]">
              Das kooperative Abenteuer auf Catan. Bildet ein Team, löst Quests und bezwingt den Räuber!
            </p>
            {onOpenRulebook && (
              <button
                type="button"
                onClick={onOpenRulebook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#362012] hover:bg-[#4a2e1a] border border-[#8a5726] text-[#d4af37] text-xs font-bold transition-all shadow"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Spielanleitung & Regeln öffnen</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#bd966f] mb-1.5 font-['Cinzel',serif]">
                Dein Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={18}
                className="w-full bg-[#1c1109] border border-[#5c3718] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#bd966f] mb-1.5 font-['Cinzel',serif]">
                Farbe wählen
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      selectedColor === c.id
                        ? `${c.bg} text-white border-white shadow-lg scale-105`
                        : 'bg-[#1c1109] border-[#4a2a14] text-[#b3957a] hover:border-[#7a4d25]'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#bd966f] mb-1.5 font-['Cinzel',serif]">
                Charakter-Rolle
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all space-y-1 ${
                      selectedRole === r.id
                        ? 'bg-[#341d0e] border-amber-500 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-[#1c1109] border-[#4a2a14] text-[#b3957a] hover:border-[#7a4d25]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {r.icon}
                      <span className="font-bold text-xs text-white font-['MedievalSharp',serif]">{r.name}</span>
                    </div>
                    <p className="text-[10px] text-[#c9b59e] leading-tight font-sans">
                      {r.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleCreate}
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm border border-amber-300 font-['MedievalSharp',serif] tracking-wide"
              >
                <Users className="w-4 h-4" />
                Neues Spiel erstellen
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE (z.B. CATN)"
                  className="w-1/2 bg-[#1c1109] border border-[#5c3718] rounded-xl px-3 py-2.5 text-center tracking-widest font-mono text-sm text-white placeholder-[#735237] focus:outline-none focus:border-amber-500 uppercase"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  className="w-1/2 bg-[#2d1a0e] hover:bg-[#422614] border border-[#7a4d25] text-[#f7eee1] font-bold py-2.5 px-3 rounded-xl transition-all text-xs font-['MedievalSharp',serif]"
                >
                  Beitreten
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c120a] bg-gradient-to-b from-[#2a1b10] via-[#1c120a] to-[#120b06] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-[#22150c]/95 border-2 border-[#73451e] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 space-y-6 text-[#e8d5b5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5c3718] pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.jpg"
              alt="Catan Friends"
              className="w-12 h-12 rounded-xl border border-[#d4af37] shadow-md object-cover"
            />
            <div>
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider font-['Cinzel',serif]">
                Kooperative Spielrunde
              </span>
              <h1 className="text-2xl font-extrabold text-[#fff4e0] flex items-center gap-2 font-['MedievalSharp',serif]">
                Raumcode: <span className="font-mono text-amber-400 bg-[#341d0e] px-3 py-1 rounded-lg border border-amber-600/50">{roomState.roomCode}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenRulebook && (
              <button
                type="button"
                onClick={onOpenRulebook}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#362012] hover:bg-[#4a2e1a] border border-[#8a5726] rounded-xl text-xs font-bold text-[#d4af37] transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Regeln
              </button>
            )}
            {isHost && roomState.players.length < 4 && (
              <button
                type="button"
                onClick={handleAddBot}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2d1a0e] hover:bg-[#422614] border border-[#7a4d25] rounded-xl text-xs font-bold text-sky-300 transition-all font-sans"
              >
                <Bot className="w-4 h-4 text-sky-400" />
                + Bot hinzufügen
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#bd966f] uppercase tracking-wider font-['Cinzel',serif]">
            Spieler in der Lobby ({roomState.players.length}/4)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomState.players.map((p) => {
              const roleInfo = ROLES.find(r => r.id === p.role);
              const colorInfo = COLORS.find(c => c.id === p.color);
              const isMe = p.id === myPlayerId;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-[#341d0e] border-amber-500/80 ring-1 ring-amber-500/30'
                      : 'bg-[#1c1109] border-[#4a2a14]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${colorInfo?.bg || 'bg-slate-500'} shadow-sm`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#fff4e0] font-['MedievalSharp',serif]">
                          {p.name} {isMe && '(Du)'}
                        </span>
                        {p.isHost && (
                          <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-semibold border border-amber-700">
                            Host
                          </span>
                        )}
                        {p.isBot && (
                          <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded font-semibold border border-sky-700 flex items-center gap-0.5 font-sans">
                            <Bot className="w-3 h-3" /> Bot
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#bd966f] mt-0.5 font-sans">
                        {roleInfo?.icon}
                        <span>{roleInfo?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {p.isReady ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-700 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bereit
                      </span>
                    ) : (
                      <span className="text-[#8e6e54] text-xs italic font-sans">
                        Wartet...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Length & Victory Target Selector */}
        <div className="p-4 bg-[#1c1109] rounded-xl border border-[#5c3718] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-['Cinzel',serif]">
              <span>🏆</span> Spiellänge & Siegziel
            </h3>
            <span className="text-xs font-bold text-[#f3dfc8] font-mono bg-[#2a170d] px-2.5 py-1 rounded-lg border border-amber-600/50">
              Ziel: {roomState.targetQuestsToWin} Team-Siegpunkte
            </span>
          </div>

          <p className="text-xs text-[#dec2a6] font-sans leading-relaxed">
            Alle Siegpunkte werden gemeinsam für das Team gesammelt: Siedlung (+1 Pkt), Stadt (+2 Pkt), gelöste Quest (+1 Pkt), Handelsstraße (+3 Pkt) und Rittermacht (+3 Pkt).
          </p>

          {isHost ? (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { pts: 6, label: 'Kurz', desc: '6 Pkt/Spieler' },
                { pts: 10, label: 'Standard', desc: '10 Pkt/Spieler' },
                { pts: 14, label: 'Episch', desc: '14 Pkt/Spieler' }
              ].map((opt) => {
                const isSelected = (roomState.pointsPerPlayer || 10) === opt.pts;
                return (
                  <button
                    key={opt.pts}
                    type="button"
                    onClick={() => handleSetPointsPerPlayer(opt.pts)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-slate-950 border-amber-300 font-bold shadow-md ring-1 ring-amber-400'
                        : 'bg-[#28160b] hover:bg-[#381f10] text-[#dec2a6] border-[#5c3718]'
                    }`}
                  >
                    <div className="text-xs font-bold font-['MedievalSharp',serif]">{opt.label}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-[#a88260]'}`}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2a170d] rounded-lg border border-[#5c3718] text-xs text-[#e8d5b5]">
              <span className="text-[#bd966f]">Gewählte Spiellänge:</span>
              <span className="font-bold text-amber-300 font-['MedievalSharp',serif]">
                {(roomState.pointsPerPlayer || 10) === 6 ? 'Kurz (6 Pkt/Spieler)' : (roomState.pointsPerPlayer || 10) === 14 ? 'Episch (14 Pkt/Spieler)' : 'Standard (10 Pkt/Spieler)'}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#1c1109] rounded-xl border border-[#5c3718] space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-['Cinzel',serif]">
            <span>🛡️</span> Team-Missionsregeln
          </h3>
          <p className="text-xs text-[#dec2a6] leading-relaxed font-sans">
            Gemeinsam gegen den Räuber! Erfüllt die ausliegenden Quests, bevor ihre D6-Timer ablaufen, baut Straßen und Siedlungen aus.
            Nutzt <strong>Fremdbau</strong>, um Mitspielern Gebäude mit euren Rohstoffen zu errichten.
            Bei 1-2 Spielern startet jeder mit <strong>2 Siedlungen und 2 Straßen</strong>, bei 3-4 Spielern mit <strong>1 Siedlung und 1 Straße</strong>.
            Bei 4 abgelaufenen Quests verliert das Team sofort!
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#5c3718]">
          <button
            type="button"
            onClick={handleToggleReady}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all font-['MedievalSharp',serif] ${
              myPlayer?.isReady
                ? 'bg-[#2d1a0e] hover:bg-[#422614] text-[#d4af37] border border-[#7a4d25]'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg'
            }`}
          >
            {myPlayer?.isReady ? 'Bereit widerrufen' : 'Ich bin bereit!'}
          </button>

          {isHost && (
            <button
              type="button"
              onClick={handleStartGame}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-xl transition-all text-xs border border-amber-300 font-['MedievalSharp',serif] tracking-wider"
            >
              <Play className="w-4 h-4 fill-current" />
              Spiel starten ({roomState.players.length} Spieler)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
