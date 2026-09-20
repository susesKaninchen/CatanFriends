import React from 'react';
import { Player, ResourceType, PlayerRole } from '../types';
import { Compass, Hammer, Pickaxe, Shield, Award } from 'lucide-react';
import { OreIcon } from './OreIcon';
import { ResourceIcon } from './ResourceIcon';

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
    renderIcon: (size = 'w-9 h-9') => <ResourceIcon type="wood" className={size} />,
    bgGradient: 'from-[#0f2413] via-[#1a3821] to-[#0c1c0f]',
    borderColor: 'border-[#2d6a3f]',
    textColor: 'text-emerald-200',
    accentBadge: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60',
    cornerIcon: <ResourceIcon type="wood" className="w-3.5 h-3.5" />
  },
  clay: {
    name: 'Lehm',
    renderIcon: (size = 'w-9 h-9') => <ResourceIcon type="clay" className={size} />,
    bgGradient: 'from-[#2e130a] via-[#451f12] to-[#240e06]',
    borderColor: 'border-[#8f3d1b]',
    textColor: 'text-amber-200',
    accentBadge: 'bg-amber-950/90 text-amber-300 border-amber-600/60',
    cornerIcon: <ResourceIcon type="clay" className="w-3.5 h-3.5" />
  },
  sheep: {
    name: 'Wolle',
    renderIcon: (size = 'w-9 h-9') => <ResourceIcon type="sheep" className={size} />,
    bgGradient: 'from-[#1b260c] via-[#2d3e15] to-[#141d08]',
    borderColor: 'border-[#5b7e28]',
    textColor: 'text-lime-200',
    accentBadge: 'bg-lime-950/90 text-lime-300 border-lime-600/60',
    cornerIcon: <ResourceIcon type="sheep" className="w-3.5 h-3.5" />
  },
  wheat: {
    name: 'Weizen',
    renderIcon: (size = 'w-9 h-9') => <ResourceIcon type="wheat" className={size} />,
    bgGradient: 'from-[#2c2007] via-[#45330e] to-[#221804]',
    borderColor: 'border-[#a17c24]',
    textColor: 'text-amber-100',
    accentBadge: 'bg-yellow-950/90 text-yellow-300 border-yellow-600/60',
    cornerIcon: <ResourceIcon type="wheat" className="w-3.5 h-3.5" />
  },
  ore: {
    name: 'Erz',
    renderIcon: (size = 'w-9 h-9') => <ResourceIcon type="ore" className={size} />,
    bgGradient: 'from-[#131722] via-[#202738] to-[#0e111a]',
    borderColor: 'border-[#4b5563]',
    textColor: 'text-slate-100',
    accentBadge: 'bg-slate-900/90 text-sky-200 border-slate-500/60',
    cornerIcon: <ResourceIcon type="ore" className="w-3.5 h-3.5" />
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
    <div className="bg-[#22150c]/95 border-2 border-[#73451e] rounded-2xl p-4 shadow-2xl space-y-4 text-[#e8d5b5]">
      {/* Hand Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#5c3718] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-['MedievalSharp',serif] font-bold text-base text-[#f7ecd9]">Deine Handkarten</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
            totalCards > 7 ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse' : 'bg-[#2b180d] text-[#e0cfbb] border border-[#6b4220]'
          }`}>
            {totalCards} Karte(n) {totalCards > 7 && '(Gefahr bei 7!)'}
          </span>
        </div>

        {/* Player Piece Stock */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-[#1c1109] border border-[#6b4220] px-2 py-1 rounded-lg text-amber-300" title="Verbleibende Straßen im Vorrat">
            🛣️ {roadsLeft}/30
          </span>
          <span className="bg-[#1c1109] border border-[#6b4220] px-2 py-1 rounded-lg text-emerald-300" title="Verbleibende Siedlungen">
            🏠 {settlementsLeft}/5
          </span>
          <span className="bg-[#1c1109] border border-[#6b4220] px-2 py-1 rounded-lg text-sky-300" title="Verbleibende Städte">
            🏰 {citiesLeft}/4
          </span>
        </div>

        {/* Team Milestones */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
              teamHasLongestRoad
                ? 'bg-amber-950/80 text-amber-300 border-amber-600/60 shadow animate-pulse'
                : 'bg-[#1c1109] text-[#8e6e54] border-[#422512]'
            }`}
            title={
              teamHasLongestRoad
                ? 'Handelsstraße aktiv: +1 SP, +1 Schenkung/Zug, 3:1 Bankhandel, +1 W6-Timer'
                : 'Handelsstraße: Ab 7 zusammenhängenden Straßen (+1 SP, +1 Handel, 3:1 Bank, +1 W6)'
            }
          >
            <Award className="w-3.5 h-3.5" />
            Handelsstraße {teamHasLongestRoad ? '(+1 SP / 3:1)' : '(<7)'}
          </span>

          <span
            className={`px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
              teamHasLargestArmy
                ? 'bg-rose-950/80 text-rose-300 border-rose-600/60 shadow animate-pulse'
                : 'bg-[#1c1109] text-[#8e6e54] border-[#422512]'
            }`}
            title={
              teamHasLargestArmy
                ? 'Größte Rittermacht aktiv: +3 SP, 3-Felder-Rückstoß, 1 Runde Betäubung, Patrouille nur jede 2. Runde'
                : 'Rittermacht: Ab 3 Rittern im Team (+3 SP, 3-Felder-Rückstoß, Betäubung, 1/2 Patrouille)'
            }
          >
            <Shield className="w-3.5 h-3.5" />
            Rittermacht {teamHasLargestArmy ? '(+3 SP / 3 Felder)' : '(<3)'}
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
              className={`relative rounded-2xl overflow-hidden aspect-[0.66] border-2 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(212,175,55,0.35)] select-none group flex flex-col justify-between p-2 ${
                count > 0
                  ? 'border-[#d4af37] ring-1 ring-amber-400/50'
                  : 'border-[#3e2612] opacity-60 saturate-60'
              }`}
            >
              {/* Full Art AI Card Background */}
              <img
                src={`/assets/card_${res}.jpg`}
                alt={cfg.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Protective Dark Vignette Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/70 pointer-events-none" />

              {/* Shimmer sweep effect on hover */}
              <div className="absolute inset-0 catan-card-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Top Row: Left & Right Corner Pips with Resource Icon */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex flex-col items-center leading-none bg-black/65 backdrop-blur-sm px-1.5 py-1 rounded-lg border border-amber-500/40 shadow">
                  <span className="font-mono font-black text-xs text-amber-200">{count}</span>
                  <ResourceIcon type={res} className="w-3.5 h-3.5 mt-0.5" />
                </div>
                <div className="flex flex-col items-center leading-none bg-black/65 backdrop-blur-sm px-1.5 py-1 rounded-lg border border-amber-500/40 shadow">
                  <span className="font-mono font-black text-xs text-amber-200">{count}</span>
                  <ResourceIcon type={res} className="w-3.5 h-3.5 mt-0.5" />
                </div>
              </div>

              {/* Center Space for Art */}
              <div className="flex-1" />

              {/* Bottom Card Ribbon with Name and Count Badge */}
              <div className="relative z-10 w-full flex items-center justify-between bg-[#22150c]/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-amber-500/50 shadow-lg">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ResourceIcon type={res} className="w-4 h-4 shadow shrink-0" />
                  <span className="text-xs font-black text-[#fff4e0] font-['MedievalSharp',serif] tracking-wide truncate">
                    {cfg.name}
                  </span>
                </div>
                <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border shrink-0 ${
                  count > 0
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 border-amber-300 shadow'
                    : 'bg-[#22150c] text-[#91765f] border-[#4a2e16]'
                }`}>
                  {count}x
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Teammates Summary Bar */}
      <div className="pt-2 border-t border-[#5c3718]">
        <span className="text-[10px] uppercase font-bold text-[#bd966f] block mb-2 tracking-wider font-['Cinzel',serif]">
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
                className="bg-[#1c1109] border border-[#5c3718] rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full shadow ${
                    teammate.color === 'red' ? 'bg-red-500' :
                    teammate.color === 'blue' ? 'bg-blue-500' :
                    teammate.color === 'orange' ? 'bg-amber-500' : 'bg-slate-200'
                  }`} />
                  <div>
                    <span className="font-bold text-[#f2e6d6] block leading-tight font-['MedievalSharp',serif]">{teammate.name}</span>
                    <span className="text-[10px] text-[#bd966f] flex items-center gap-1">
                      {ROLE_ICONS[teammate.role]}
                      {teammate.role}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-mono font-bold text-white block text-xs">
                    {teamTotal} Karten
                  </span>
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-[#e8d5b5]">
                    <span className="flex items-center gap-0.5"><ResourceIcon type="wood" className="w-3 h-3" />{teammate.resources.wood}</span>
                    <span className="flex items-center gap-0.5"><ResourceIcon type="clay" className="w-3 h-3" />{teammate.resources.clay}</span>
                    <span className="flex items-center gap-0.5"><ResourceIcon type="sheep" className="w-3 h-3" />{teammate.resources.sheep}</span>
                    <span className="flex items-center gap-0.5"><ResourceIcon type="wheat" className="w-3 h-3" />{teammate.resources.wheat}</span>
                    <span className="flex items-center gap-0.5"><ResourceIcon type="ore" className="w-3 h-3" />{teammate.resources.ore}</span>
                  </div>
                  <span className="text-[9px] text-[#bd966f] font-mono block">
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
