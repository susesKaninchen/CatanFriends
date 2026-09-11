import React from 'react';
import { Player, ResourceType, PlayerRole } from '../types';
import { Compass, Hammer, Pickaxe, Shield, Award } from 'lucide-react';
import { OreIcon } from './OreIcon';

interface PlayerHandProps {
  myPlayer: Player;
  players: Player[];
  teamHasLongestRoad: boolean;
  teamHasLargestArmy: boolean;
  roundNumber: number;
}

interface ResourceCardConfig {
  name: string;
  renderIcon: (sizeClass?: string) => React.ReactNode;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentBadge: string;
  cornerIcon: React.ReactNode;
}

const RESOURCE_CONFIG: { [key in ResourceType]: ResourceCardConfig } = {
  wood: {
    name: 'Holz',
    renderIcon: (size = 'text-3xl') => <span className={size}>🌲</span>,
    bgGradient: 'from-[#0f2413] via-[#1a3821] to-[#0c1c0f]',
    borderColor: 'border-[#2d6a3f]',
    textColor: 'text-emerald-200',
    accentBadge: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60',
    cornerIcon: <span className="text-[11px]">🌲</span>
  },
  clay: {
    name: 'Lehm',
    renderIcon: (size = 'text-3xl') => <span className={size}>🧱</span>,
    bgGradient: 'from-[#2e130a] via-[#451f12] to-[#240e06]',
    borderColor: 'border-[#8f3d1b]',
    textColor: 'text-amber-200',
    accentBadge: 'bg-amber-950/90 text-amber-300 border-amber-600/60',
    cornerIcon: <span className="text-[11px]">🧱</span>
  },
  sheep: {
    name: 'Wolle',
    renderIcon: (size = 'text-3xl') => <span className={size}>🐑</span>,
    bgGradient: 'from-[#1b260c] via-[#2d3e15] to-[#141d08]',
    borderColor: 'border-[#5b7e28]',
    textColor: 'text-lime-200',
    accentBadge: 'bg-lime-950/90 text-lime-300 border-lime-600/60',
    cornerIcon: <span className="text-[11px]">🐑</span>
  },
  wheat: {
    name: 'Weizen',
    renderIcon: (size = 'text-3xl') => <span className={size}>🌾</span>,
    bgGradient: 'from-[#2c2007] via-[#45330e] to-[#221804]',
    borderColor: 'border-[#a17c24]',
    textColor: 'text-amber-100',
    accentBadge: 'bg-yellow-950/90 text-yellow-300 border-yellow-600/60',
    cornerIcon: <span className="text-[11px]">🌾</span>
  },
  ore: {
    name: 'Erz',
    renderIcon: (size = 'w-9 h-9') => <OreIcon className={size} />,
    bgGradient: 'from-[#131722] via-[#202738] to-[#0e111a]',
    borderColor: 'border-[#4b5563]',
    textColor: 'text-slate-100',
    accentBadge: 'bg-slate-900/90 text-sky-200 border-slate-500/60',
    cornerIcon: <OreIcon className="w-3 h-3 inline-block" />
  }
};

const ROLE_ICONS: { [key in PlayerRole]: React.ReactNode } = {
  pioneer: <Compass className="w-3.5 h-3.5 text-emerald-400" />,
  builder: <Hammer className="w-3.5 h-3.5 text-amber-400" />,
  miner: <Pickaxe className="w-3.5 h-3.5 text-sky-400" />,
  captain: <Shield className="w-3.5 h-3.5 text-rose-400" />
};

export const PlayerHand: React.FC<PlayerHandProps> = ({
  myPlayer,
  players,
  teamHasLongestRoad,
  teamHasLargestArmy,
  roundNumber
}) => {
  const totalCards = Object.values(myPlayer.resources).reduce((a, b) => a + b, 0);

  const roadsLeft = myPlayer.remainingPieces?.roads ?? 30;
  const settlementsLeft = myPlayer.remainingPieces?.settlements ?? 5;
  const citiesLeft = myPlayer.remainingPieces?.cities ?? 4;

  return (
    <div className="bg-[#19110a]/95 border-2 border-[#5a3818] rounded-2xl p-4 shadow-2xl space-y-4 text-[#e8d5b5]">
      {/* Hand Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#472c14] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-['MedievalSharp',serif] font-bold text-base text-[#f7ecd9]">Deine Handkarten</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
            totalCards > 7 ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse' : 'bg-[#2b180d] text-[#e0cfbb] border border-[#52341b]'
          }`}>
            {totalCards} Karte(n) {totalCards > 7 && '(Gefahr bei 7!)'}
          </span>
        </div>

        {/* Player Piece Stock */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-[#120b06] border border-[#52341b] px-2 py-1 rounded-lg text-amber-300" title="Verbleibende Straßen im Vorrat">
            🛣️ {roadsLeft}/30
          </span>
          <span className="bg-[#120b06] border border-[#52341b] px-2 py-1 rounded-lg text-emerald-300" title="Verbleibende Siedlungen">
            🏠 {settlementsLeft}/5
          </span>
          <span className="bg-[#120b06] border border-[#52341b] px-2 py-1 rounded-lg text-sky-300" title="Verbleibende Städte">
            🏰 {citiesLeft}/4
          </span>
        </div>

        {/* Team Milestones */}
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
            teamHasLongestRoad ? 'bg-amber-950/80 text-amber-300 border-amber-600/60 shadow' : 'bg-[#120b06] text-[#735843] border-[#311c0e]'
          }`}>
            <Award className="w-3.5 h-3.5" />
            Handelsstraße ({teamHasLongestRoad ? '+1 W6' : '<7'})
          </span>

          <span className={`px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
            teamHasLargestArmy ? 'bg-rose-950/80 text-rose-300 border-rose-600/60 shadow' : 'bg-[#120b06] text-[#735843] border-[#311c0e]'
          }`}>
            <Shield className="w-3.5 h-3.5" />
            Rittermacht ({teamHasLargestArmy ? 'Aktiv' : '<3'})
          </span>
        </div>
      </div>

      {/* Authentic Medieval Playing Cards (5 Resource Cards) */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {(['wood', 'clay', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((res) => {
          const cfg = RESOURCE_CONFIG[res];
          const count = myPlayer.resources[res] || 0;

          return (
            <div
              key={res}
              className={`bg-gradient-to-b ${cfg.bgGradient} border-2 ${cfg.borderColor} rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-between aspect-[0.68] shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-amber-400/80 group select-none`}
            >
              {/* Antique card inner filigree outline */}
              <div className="absolute inset-1 border border-white/10 rounded-lg pointer-events-none" />

              {/* Top-Left Card Corner Pip (Suit + Count) */}
              <div className="absolute top-1.5 left-1.5 sm:left-2 flex flex-col items-center leading-none">
                <span className="font-mono font-bold text-[10px] text-white/90">{count}</span>
                <span className="mt-0.5 opacity-80">{cfg.cornerIcon}</span>
              </div>

              {/* Bottom-Right Inverted Corner Pip */}
              <div className="absolute bottom-1.5 right-1.5 sm:right-2 flex flex-col items-center leading-none rotate-180">
                <span className="font-mono font-bold text-[10px] text-white/90">{count}</span>
                <span className="mt-0.5 opacity-80">{cfg.cornerIcon}</span>
              </div>

              {/* Center Medallion Emblem */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#000000]/40 border border-[#d4af37]/50 flex items-center justify-center mt-2.5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                {cfg.renderIcon()}
              </div>

              {/* Card Title Ribbon Banner */}
              <div className="text-center w-full px-1 z-10">
                <span className={`block text-[11px] sm:text-xs font-black tracking-wide ${cfg.textColor} font-['MedievalSharp',serif] drop-shadow`}>
                  {cfg.name}
                </span>
              </div>

              {/* Bottom Count Seal */}
              <div className="mb-0.5 z-10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#382112] to-[#1a0f07] border-2 border-amber-400/80 shadow-lg flex items-center justify-center font-mono font-black text-base text-amber-200">
                  {count}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Teammates Summary Bar */}
      <div className="pt-2 border-t border-[#472c14]">
        <span className="text-[10px] uppercase font-bold text-[#a8825c] block mb-2 tracking-wider font-['Cinzel',serif]">
          Team-Übersicht & Rohstoffe
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {players.filter(p => p.id !== myPlayer.id).map(teammate => {
            const teamTotal = Object.values(teammate.resources).reduce((a, b) => a + b, 0);
            const tRoads = teammate.remainingPieces?.roads ?? 30;
            const tSettlements = teammate.remainingPieces?.settlements ?? 5;
            const tCities = teammate.remainingPieces?.cities ?? 4;

            return (
              <div
                key={teammate.id}
                className="bg-[#120b06] border border-[#4a2e16] rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full shadow ${
                    teammate.color === 'red' ? 'bg-red-500' :
                    teammate.color === 'blue' ? 'bg-blue-500' :
                    teammate.color === 'orange' ? 'bg-amber-500' : 'bg-slate-200'
                  }`} />
                  <div>
                    <span className="font-bold text-[#f2e6d6] block leading-tight font-['MedievalSharp',serif]">{teammate.name}</span>
                    <span className="text-[10px] text-[#a8825c] flex items-center gap-1">
                      {ROLE_ICONS[teammate.role]}
                      {teammate.role}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="font-mono font-bold text-white block text-xs">
                    {teamTotal} Karten
                  </span>
                  <span className="text-[9px] text-[#8e6e53] font-mono block">
                    H{teammate.resources.wood} L{teammate.resources.clay} W{teammate.resources.sheep} G{teammate.resources.wheat} E{teammate.resources.ore}
                  </span>
                  <span className="text-[9px] text-[#a8825c] font-mono block">
                    Bau: {tRoads}S / {tSettlements}H / {tCities}C
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
