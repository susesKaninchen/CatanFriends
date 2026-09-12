import React from 'react';
import { QuestSlot, ResourceType, ResourceCount } from '../types';
import { Trophy, Skull, Plus } from 'lucide-react';
import { OreIcon } from './OreIcon';
import { ResourceIcon } from './ResourceIcon';

interface QuestTrackerProps {
  questSlots: QuestSlot[];
  solvedCount: number;
  failedCount: number;
  targetToWin: number;
  myResources: ResourceCount;
  isMyTurn: boolean;
  onDeposit: (slotIndex: number, resource: ResourceType, amount: number) => void;
}

const RESOURCE_LABELS: { [key in ResourceType]: { name: string; icon: React.ReactNode; bg: string; text: string } } = {
  wood: { name: 'Holz', icon: <ResourceIcon type="wood" className="w-4 h-4 inline-block" />, bg: 'bg-[#142617]/80 border-emerald-700/60', text: 'text-emerald-300' },
  clay: { name: 'Lehm', icon: <ResourceIcon type="clay" className="w-4 h-4 inline-block" />, bg: 'bg-[#31160d]/80 border-amber-700/60', text: 'text-amber-300' },
  sheep: { name: 'Wolle', icon: <ResourceIcon type="sheep" className="w-4 h-4 inline-block" />, bg: 'bg-[#222b10]/80 border-lime-700/60', text: 'text-lime-300' },
  wheat: { name: 'Weizen', icon: <ResourceIcon type="wheat" className="w-4 h-4 inline-block" />, bg: 'bg-[#34270b]/80 border-yellow-700/60', text: 'text-amber-200' },
  ore: { name: 'Erz', icon: <ResourceIcon type="ore" className="w-4 h-4 inline-block" />, bg: 'bg-[#181a24]/80 border-slate-600/60', text: 'text-slate-200' }
};

const TIER_COLORS: { [tier: number]: { badge: string; border: string } } = {
  1: { badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/60', border: 'border-emerald-700/40' },
  2: { badge: 'bg-sky-950 text-sky-300 border-sky-700/60', border: 'border-sky-700/40' },
  3: { badge: 'bg-indigo-950 text-indigo-300 border-indigo-700/60', border: 'border-indigo-700/40' },
  4: { badge: 'bg-purple-950 text-purple-300 border-purple-700/60', border: 'border-purple-700/40' },
  5: { badge: 'bg-rose-950 text-rose-300 border-rose-700/60', border: 'border-rose-700/40' },
  6: { badge: 'bg-amber-950 text-amber-200 border-amber-600 shadow-md', border: 'border-amber-600/60' }
};

// Render 3D-styled D6 dice showing remaining countdown rounds
const D6Die: React.FC<{ value: number }> = ({ value }) => {
  const isUrgent = value <= 1;

  return (
    <div
      className={`relative w-9 h-9 rounded-lg flex items-center justify-center font-black text-base shadow-md border shrink-0 transition-all ${
        isUrgent
          ? 'bg-rose-700 text-white border-rose-400 animate-pulse ring-2 ring-rose-500/50'
          : 'bg-[#fff5dc] text-[#341b0b] border-[#c49a6c]'
      }`}
      title={`D6-Timer: Noch ${value} Runde(n)`}
    >
      <div className="flex flex-col items-center leading-none">
        <span className="text-xs font-black font-['Cinzel',serif]">{value}</span>
        <span className="text-[7px] tracking-tight uppercase opacity-80 font-bold">W6</span>
      </div>
    </div>
  );
};

export const QuestTracker: React.FC<QuestTrackerProps> = ({
  questSlots,
  solvedCount,
  failedCount,
  targetToWin,
  myResources,
  isMyTurn,
  onDeposit
}) => {
  return (
    <div className="bg-[#19110a]/95 border-2 border-[#5a3818] rounded-2xl p-4 shadow-2xl space-y-4 text-[#e8d5b5]">
      {/* Top Bar: Progress & Skull Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#472c14] pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#d4af37]" />
          <span className="font-['MedievalSharp',serif] font-bold text-base text-[#fff4e0]">
            Gelöste Quests: <span className="text-amber-400 font-mono">{solvedCount}</span> / {targetToWin}
          </span>
        </div>

        {/* Failed Quests Skull Tracker (Defeat at 4) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#a8825c] uppercase tracking-wider font-['Cinzel',serif]">
            Fehlschläge (max. 4):
          </span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((index) => {
              const hasFailed = index < failedCount;
              return (
                <div
                  key={index}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                    hasFailed
                      ? 'bg-rose-950 border-rose-600 text-rose-400 shadow-md animate-bounce'
                      : 'bg-[#100b06] border-[#3b2311] text-[#5c3e27]'
                  }`}
                  title={hasFailed ? 'Quest gescheitert!' : 'Slot intakt'}
                >
                  <Skull className="w-4 h-4" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Active Quest Slots in a spacious 2-column grid for the sidebar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questSlots.map((slot) => {
          const tierStyle = TIER_COLORS[slot.tier] || TIER_COLORS[1];

          return (
            <div
              key={slot.slotIndex}
              className={`bg-[#120b06] border ${tierStyle.border} rounded-xl p-3 flex flex-col justify-between space-y-2.5 transition-all relative overflow-hidden`}
            >
              {/* Header: Slot title, Tier badge, D6 Timer */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierStyle.badge}`}>
                      Stufe {slot.tier}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[#f4caa1] leading-snug font-['MedievalSharp',serif] break-words">
                    {slot.title}
                  </h3>
                </div>
                <D6Die value={slot.d6Timer} />
              </div>

              <p className="text-[11px] text-[#c9b59e] leading-tight font-sans">
                {slot.description}
              </p>

              {/* Progress / Deposit Area */}
              <div className="pt-2 border-t border-[#2b170d] space-y-2">
                {slot.type === 'DELIVER_RESOURCES' && slot.requiredResources && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-semibold text-[#a8825c] flex items-center justify-between font-serif">
                      <span>Bedarf einlagern:</span>
                      <span className="text-[9px] text-amber-400 font-sans">Schützt vor 7er</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(slot.requiredResources).map(([rKey, needed]) => {
                        const res = rKey as ResourceType;
                        const deposited = slot.depositedResources[res] || 0;
                        const isDone = deposited >= (needed || 0);
                        const canDeposit = isMyTurn && !isDone && (myResources[res] || 0) > 0;
                        const meta = RESOURCE_LABELS[res];

                        return (
                          <div
                            key={res}
                            className={`flex items-center justify-between px-2 py-1 rounded-lg border text-[11px] ${meta.bg} ${
                              isDone ? 'opacity-60 border-emerald-600' : ''
                            }`}
                          >
                            <span className="flex items-center gap-1 font-mono">
                              {meta.icon}
                              <span className="font-semibold text-white">{deposited}/{needed}</span>
                            </span>

                            {canDeposit && (
                              <button
                                type="button"
                                onClick={() => onDeposit(slot.slotIndex, res, 1)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black w-5 h-5 rounded flex items-center justify-center transition-all shadow shrink-0 ml-1"
                                title={`1x ${meta.name} einzahlen`}
                              >
                                <Plus className="w-3 h-3 stroke-[3]" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Road / Settlement Target progress */}
                {slot.targetCount && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#a8825c] font-semibold">
                      <span>Fortschritt:</span>
                      <span className="text-white font-mono">{slot.currentCount} / {slot.targetCount}</span>
                    </div>
                    <div className="w-full bg-[#201309] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (slot.currentCount / slot.targetCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
