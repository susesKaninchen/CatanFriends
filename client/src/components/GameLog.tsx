import React from 'react';
import { GameLogEntry } from '../types';
import { ScrollText, Bell, Dices, Hammer, ShieldAlert, Sparkles } from 'lucide-react';

interface GameLogProps {
  logs: GameLogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const getLogIcon = (type: GameLogEntry['type']) => {
    switch (type) {
      case 'roll':
        return <Dices className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'build':
        return <Hammer className="w-3.5 h-3.5 text-[#e0a96d] shrink-0 mt-0.5" />;
      case 'quest':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'robber':
      case 'alert':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#bd966f] shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="bg-[#22150c]/95 border-2 border-[#73451e] rounded-2xl p-4 shadow-2xl space-y-3 flex flex-col h-64 text-[#e8d5b5]">
      <div className="flex items-center gap-2 border-b border-[#5c3718] pb-2">
        <ScrollText className="w-4 h-4 text-[#d4af37]" />
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#dfcfba] font-['Cinzel',serif]">
          Insel-Chronik (Ereignisse)
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs custom-scrollbar">
        {logs.map((entry) => (
          <div
            key={entry.id}
            className={`p-2 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 transition-all font-sans ${
              entry.type === 'alert' || entry.type === 'robber'
                ? 'bg-rose-950/70 border-rose-800 text-rose-200'
                : entry.type === 'quest'
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200 font-semibold'
                : 'bg-[#1c1109] border-[#4a2a14] text-[#dec2a6]'
            }`}
          >
            {getLogIcon(entry.type)}
            <span>{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
