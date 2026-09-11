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
    description: 'Drängt den Räuber mit Ritterkarten 2 Felder zurück auf seiner Route.'
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
    socket.emit('create_room', { playerName, color: selectedColor, role: selectedRole }, (res: any) => {
      if (!res.success) setError(res.message);
    });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setError('Bitte gib einen 4-stelligen Raumcode ein.');
      return;
    }
    setError(null);
    socket.emit('join_room', { roomCode: joinCode.trim(), playerName, color: selectedColor, role: selectedRole }, (res: any) => {
      if (!res.success) setError(res.message);
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

  const myPlayer = roomState?.players.find(p => p.id === myPlayerId);
  const isHost = myPlayer?.isHost;

  if (!roomState) {
    return (
      <div className="min-h-screen bg-[#0d0906] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#19110a]/95 border-2 border-[#5a3818] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 space-y-6 text-[#e8d5b5]">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2a1a0f] hover:bg-[#3d2616] border border-[#7a4e22] text-[#d4af37] text-xs font-bold transition-all shadow"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a8825c] mb-1.5 font-['Cinzel',serif]">
                Dein Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={18}
                className="w-full bg-[#100b06] border border-[#4a2e16] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a8825c] mb-1.5 font-['Cinzel',serif]">
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
                        : 'bg-[#120b06] border-[#3b2311] text-[#9c7e65] hover:border-[#6b4220]'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a8825c] mb-1.5 font-['Cinzel',serif]">
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
                        ? 'bg-[#2b1b0d] border-amber-500 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-[#100b06] border-[#3b2311] text-[#9c7e65] hover:border-[#6b4220]'
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
                  className="w-1/2 bg-[#100b06] border border-[#4a2e16] rounded-xl px-3 py-2.5 text-center tracking-widest font-mono text-sm text-white placeholder-[#5c3e27] focus:outline-none focus:border-amber-500 uppercase"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  className="w-1/2 bg-[#25170d] hover:bg-[#382114] border border-[#6b4220] text-[#f2e6d6] font-bold py-2.5 px-3 rounded-xl transition-all text-xs font-['MedievalSharp',serif]"
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
    <div className="min-h-screen bg-[#0d0906] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-[#19110a]/95 border-2 border-[#5a3818] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 space-y-6 text-[#e8d5b5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#472c14] pb-4">
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
                Raumcode: <span className="font-mono text-amber-400 bg-[#2b1b0d] px-3 py-1 rounded-lg border border-amber-600/50">{roomState.roomCode}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenRulebook && (
              <button
                type="button"
                onClick={onOpenRulebook}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2a1a0f] hover:bg-[#3d2616] border border-[#7a4e22] rounded-xl text-xs font-bold text-[#d4af37] transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Regeln
              </button>
            )}
            {isHost && roomState.players.length < 4 && (
              <button
                type="button"
                onClick={handleAddBot}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25170d] hover:bg-[#382114] border border-[#6b4220] rounded-xl text-xs font-bold text-sky-300 transition-all font-sans"
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
          <h2 className="text-xs font-semibold text-[#a8825c] uppercase tracking-wider font-['Cinzel',serif]">
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
                      ? 'bg-[#2b1b0d] border-amber-500/80 ring-1 ring-amber-500/30'
                      : 'bg-[#120b06] border-[#3b2311]'
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
                      <div className="flex items-center gap-1 text-xs text-[#a8825c] mt-0.5 font-sans">
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
                      <span className="text-[#6d5543] text-xs italic font-sans">
                        Wartet...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-[#120b06] rounded-xl border border-[#472c14] space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-['Cinzel',serif]">
            <span>🛡️</span> Team-Missionsregeln
          </h3>
          <p className="text-xs text-[#c9b59e] leading-relaxed font-sans">
            Gemeinsam gegen den Räuber! Erfüllt die 4 ausliegenden Quests, bevor ihre D6-Timer ablaufen.
            Nutzt <strong>Fremdbau</strong>, um Mitspielern Gebäude mit euren Rohstoffen zu errichten.
            Bei 4 abgelaufenen Quests verliert das Team sofort!
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#472c14]">
          <button
            type="button"
            onClick={handleToggleReady}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all font-['MedievalSharp',serif] ${
              myPlayer?.isReady
                ? 'bg-[#25170d] hover:bg-[#382114] text-[#d4af37] border border-[#6b4220]'
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
