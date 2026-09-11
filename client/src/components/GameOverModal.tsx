import React, { useEffect } from 'react';
import { GamePhase } from '../types';
import { Trophy, Skull, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  phase: GamePhase;
  solvedCount: number;
  failedCount: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  phase,
  solvedCount,
  failedCount,
  onRestart
}) => {
  const isVictory = phase === 'GAME_OVER_VICTORY';
  const isDefeat = phase === 'GAME_OVER_DEFEAT';

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }, [isVictory]);

  if (!isVictory && !isDefeat) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {/* Victory or Defeat Icon */}
        <div className="flex justify-center">
          {isVictory ? (
            <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center text-amber-400 shadow-xl animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-400 shadow-xl animate-pulse">
              <Skull className="w-10 h-10" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isVictory ? 'Glorreicher Sieg fuer das Team!' : 'Die Insel ist verloren!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isVictory
              ? 'Gemeinsam habt ihr alle Quest-Ziele gemeistert und Catan vor dem Raeuber beschuetzt!'
              : 'Vier Quests sind abgelaufen. Der Raeuber hat die Siedlungen ueberrannt.'}
          </p>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Geloeste Quests</span>
            <span className="text-xl font-extrabold text-amber-400 font-mono">{solvedCount}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Gescheiterte Quests</span>
            <span className="text-xl font-extrabold text-rose-400 font-mono">{failedCount} / 4</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Neues Spiel starten
        </button>
      </div>
    </div>
  );
};
