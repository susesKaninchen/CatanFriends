import React, { useState } from 'react';
import { BoardState, GamePhase, Player, PlayerColor, ResourceType, ActiveTradeProposal, TradeProposalType } from '../types';
import { Dices, Hammer, Home, Castle, Shield, ArrowRight, UserCheck, BookOpen, ArrowLeftRight, Gift, Users, HelpCircle, Check, X } from 'lucide-react';
import { OreIcon } from './OreIcon';
import { ResourceIcon } from './ResourceIcon';

interface ActionControlsProps {
  phase: GamePhase;
  isMyTurn: boolean;
  activePlayer: Player;
  players: Player[];
  myPlayer: Player;
  diceValues: [number, number];
  buildMode: 'none' | 'road' | 'settlement' | 'city';
  targetColor: PlayerColor;
  board?: BoardState;
  onSetBuildMode: (mode: 'none' | 'road' | 'settlement' | 'city') => void;
  onSetTargetColor: (color: PlayerColor) => void;
  onRollDice: () => void;
  onPlayKnight: () => void;
  onEndTurn: () => void;
  onOpenRulebook?: () => void;
  teamHasLongestRoad?: boolean;
  teamHasLargestArmy?: boolean;
  onTradeBank?: (giveRes: ResourceType, getRes: ResourceType) => void;
  onGiftResource?: (targetPlayerId: string, resource: ResourceType) => void;
  activeTradeProposal?: ActiveTradeProposal | null;
  onProposeTrade?: (
    type: TradeProposalType,
    targetPlayerId: string | null,
    wantedResource: ResourceType,
    wantedAmount?: number,
    giveResource?: ResourceType,
    giveAmount?: number
  ) => void;
  onRespondTrade?: (proposalId: string, action: 'accept' | 'decline') => void;
  onCancelTrade?: (proposalId: string) => void;
}

const COLOR_MAP: { [key in PlayerColor]: { name: string; bg: string; text: string } } = {
  red: { name: 'Rot', bg: 'bg-red-600', text: 'text-red-400' },
  blue: { name: 'Blau', bg: 'bg-blue-600', text: 'text-blue-400' },
  orange: { name: 'Orange', bg: 'bg-amber-600', text: 'text-amber-400' },
  white: { name: 'Weiß', bg: 'bg-slate-200 text-slate-900', text: 'text-slate-200' }
};

const RESOURCE_INFO: { [key in ResourceType]: { name: string; icon: React.ReactNode } } = {
  wood: { name: 'Holz', icon: <ResourceIcon type="wood" className="w-4 h-4 inline-block" /> },
  clay: { name: 'Lehm', icon: <ResourceIcon type="clay" className="w-4 h-4 inline-block" /> },
  sheep: { name: 'Wolle', icon: <ResourceIcon type="sheep" className="w-4 h-4 inline-block" /> },
  wheat: { name: 'Weizen', icon: <ResourceIcon type="wheat" className="w-4 h-4 inline-block" /> },
  ore: { name: 'Erz', icon: <ResourceIcon type="ore" className="w-4 h-4 inline-block" /> }
};

export const ActionControls: React.FC<ActionControlsProps> = ({
  phase,
  isMyTurn,
  activePlayer,
  players,
  myPlayer,
  diceValues,
  buildMode,
  targetColor,
  board,
  teamHasLongestRoad,
  teamHasLargestArmy,
  onSetBuildMode,
  onSetTargetColor,
  onRollDice,
  onPlayKnight,
  onEndTurn,
  onOpenRulebook,
  onTradeBank,
  onGiftResource,
  activeTradeProposal,
  onProposeTrade,
  onRespondTrade,
  onCancelTrade
}) => {
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [tradeTab, setTradeTab] = useState<'bank' | 'trade' | 'request' | 'gift'>('bank');
  const [giveRes, setGiveRes] = useState<ResourceType>('wood');
  const [getRes, setGetRes] = useState<ResourceType>('ore');
  const [giftTargetId, setGiftTargetId] = useState<string>('');
  const [giftRes, setGiftRes] = useState<ResourceType>('wood');
  const [tradeGiveRes, setTradeGiveRes] = useState<ResourceType>('wood');
  const [tradeWantedRes, setTradeWantedRes] = useState<ResourceType>('ore');
  const [tradeTargetId, setTradeTargetId] = useState<string>('');
  const [requestRes, setRequestRes] = useState<ResourceType>('ore');
  const [requestTargetId, setRequestTargetId] = useState<string>('');
  const [isRolling, setIsRolling] = useState(false);
  const [animDice, setAnimDice] = useState<[number, number]>([1, 1]);

  const handleRollClick = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setAnimDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      count++;
      if (count >= 7) {
        clearInterval(interval);
        setIsRolling(false);
        onRollDice();
      }
    }, 55);
  };

  const diceSum = diceValues[0] + diceValues[1];
  const targetPlayer = players.find(p => p.color === targetColor) || myPlayer;

  // Remaining building stock from official Catan limits (roads: 30)
  const remainingRoads = targetPlayer.remainingPieces?.roads ?? 30;
  const remainingSettlements = targetPlayer.remainingPieces?.settlements ?? 5;
  const remainingCities = targetPlayer.remainingPieces?.cities ?? 4;

  // Check if any settlement exists on board that can be upgraded to a city
  const hasSettlementToUpgrade = board
    ? Object.values(board.vertices).some(v => v.building?.type === 'settlement')
    : true;

  // Helper to check building affordability
  const canAffordRoad = () => {
    if (myPlayer.role === 'pioneer') {
      return myPlayer.resources.wood >= 1 || myPlayer.resources.clay >= 1;
    }
    return myPlayer.resources.wood >= 1 && myPlayer.resources.clay >= 1;
  };

  const canAffordSettlement = () => {
    const total = Object.values(myPlayer.resources).reduce((a, b) => a + b, 0);
    if (myPlayer.role === 'builder') {
      return total >= 3 && (myPlayer.resources.wood + myPlayer.resources.clay + myPlayer.resources.sheep + myPlayer.resources.wheat >= 3);
    }
    return (
      myPlayer.resources.wood >= 1 &&
      myPlayer.resources.clay >= 1 &&
      myPlayer.resources.sheep >= 1 &&
      myPlayer.resources.wheat >= 1
    );
  };

  const canAffordCity = () => {
    if (myPlayer.role === 'builder') {
      return myPlayer.resources.ore + myPlayer.resources.wheat >= 4 && myPlayer.resources.ore >= 2;
    }
    return myPlayer.resources.ore >= 3 && myPlayer.resources.wheat >= 2;
  };

  const canAffordKnight = () => {
    if (myPlayer.role === 'captain') {
      return true;
    }
    return (
      myPlayer.resources.ore >= 1 &&
      myPlayer.resources.sheep >= 1 &&
      myPlayer.resources.wheat >= 1
    );
  };

  const getTradeRatio = (res: ResourceType): number => {
    let ratio = teamHasLongestRoad ? 3 : 4;
    if (!board || !board.vertices) return ratio;
    for (const vKey of Object.keys(board.vertices)) {
      const v = board.vertices[vKey];
      if (v.building && v.harbor && v.building.ownerColor === myPlayer.color) {
        if (v.harbor.type === res) return 2;
        if (v.harbor.type === 'generic') ratio = Math.min(ratio, 3);
      }
    }
    return ratio;
  };

  const currentGiveRatio = getTradeRatio(giveRes);

  const handleExecuteBankTrade = () => {
    if (onTradeBank && myPlayer.resources[giveRes] >= currentGiveRatio && giveRes !== getRes) {
      onTradeBank(giveRes, getRes);
    }
  };

  const teammates = players.filter(p => p.id !== myPlayer.id);
  const selectedTeammateId = giftTargetId || (teammates[0]?.id ?? '');

  const handleExecuteGift = () => {
    if (onGiftResource && selectedTeammateId && myPlayer.resources[giftRes] >= 1) {
      onGiftResource(selectedTeammateId, giftRes);
    }
  };

  const handleExecuteTradeProposal = () => {
    if (onProposeTrade && myPlayer.resources[tradeGiveRes] >= 1 && tradeGiveRes !== tradeWantedRes) {
      onProposeTrade('trade', tradeTargetId || null, tradeWantedRes, 1, tradeGiveRes, 1);
      setIsTradeOpen(false);
    }
  };

  const handleExecuteRequest = () => {
    if (onProposeTrade) {
      onProposeTrade('request', requestTargetId || null, requestRes, 1);
      setIsTradeOpen(false);
    }
  };

  return (
    <div className="bg-[#19110a]/95 border-2 border-[#5a3818] rounded-2xl p-4 shadow-2xl space-y-4 text-[#e8d5b5]">
      {/* Top bar: Active Player & Dice Result & Rulebook Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#472c14] pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-3.5 h-3.5 rounded-full ${COLOR_MAP[activePlayer.color].bg} shadow`} />
          <div>
            <span className="text-[11px] text-[#a8825c] block font-semibold">Aktueller Zug:</span>
            <span className="text-sm font-black text-[#fff4e0] flex items-center gap-1.5 font-['MedievalSharp',serif]">
              {activePlayer.name} {isMyTurn && '(Du bist dran!)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dice Result Display */}
          <div className="flex items-center gap-2 bg-[#100b06] px-3 py-1.5 rounded-xl border border-[#52341b]">
            <span className="text-xs text-[#a8825c] font-semibold">Würfel:</span>
            <div className="flex gap-1.5 font-mono font-black text-sm">
              <span className={`w-6 h-6 bg-[#25170d] text-white rounded flex items-center justify-center border transition-all ${isRolling ? 'border-amber-400 text-amber-300 animate-dice-tumble' : 'border-[#6b4220]'}`}>
                {isRolling ? animDice[0] : diceValues[0]}
              </span>
              <span className={`w-6 h-6 bg-[#25170d] text-white rounded flex items-center justify-center border transition-all ${isRolling ? 'border-amber-400 text-amber-300 animate-dice-tumble' : 'border-[#6b4220]'}`}>
                {isRolling ? animDice[1] : diceValues[1]}
              </span>
              <span className={`px-2 py-0.5 rounded font-extrabold ${diceSum === 7 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'text-amber-400'}`}>
                = {isRolling ? animDice[0] + animDice[1] : diceSum}
              </span>
            </div>
          </div>

          {/* Rulebook Button */}
          {onOpenRulebook && (
            <button
              type="button"
              onClick={onOpenRulebook}
              className="bg-[#2a1a0f] hover:bg-[#3d2616] text-[#d4af37] border border-[#7a4e22] p-2 rounded-xl transition-all shadow hover:shadow-md flex items-center gap-1.5 text-xs font-bold"
              title="Catan Friends Spielanleitung öffnen"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Regeln</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Trade Proposal Banner (Visible to all relevant players) */}
      {activeTradeProposal && (
        <div className="p-3 bg-gradient-to-r from-[#2e190b] via-[#3a2010] to-[#2e190b] border-2 border-amber-500 rounded-xl shadow-xl space-y-2 animate-pulse">
          {activeTradeProposal.senderId === myPlayer.id ? (
            /* Proposer View */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 font-['MedievalSharp',serif]">
                  <span>⏳</span> Dein Angebot ist aktiv...
                </span>
                <p className="text-[#e8d5b5]">
                  {activeTradeProposal.type === 'trade' ? (
                    <>
                      Du bietest <span className="text-white font-bold">{activeTradeProposal.giveAmount || 1}x {RESOURCE_INFO[activeTradeProposal.giveResource!].name}</span> im Tausch gegen <span className="text-amber-300 font-bold">{activeTradeProposal.wantedAmount}x {RESOURCE_INFO[activeTradeProposal.wantedResource].name}</span> {activeTradeProposal.targetPlayerId ? `an ${players.find(p => p.id === activeTradeProposal.targetPlayerId)?.name || 'Mitspieler'}` : 'an alle Mitspieler'}.
                    </>
                  ) : (
                    <>
                      Du bittest um <span className="text-amber-300 font-bold">{activeTradeProposal.wantedAmount}x {RESOURCE_INFO[activeTradeProposal.wantedResource].name}</span> {activeTradeProposal.targetPlayerId ? `von ${players.find(p => p.id === activeTradeProposal.targetPlayerId)?.name || 'Mitspieler'}` : 'von allen Mitspielern'}.
                    </>
                  )}
                </p>
              </div>
              {onCancelTrade && (
                <button
                  type="button"
                  onClick={() => onCancelTrade(activeTradeProposal.id)}
                  className="px-3 py-1.5 bg-[#42150d] hover:bg-[#571c12] text-rose-200 border border-rose-600/70 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow"
                >
                  Abbrechen
                </button>
              )}
            </div>
          ) : (!activeTradeProposal.targetPlayerId || activeTradeProposal.targetPlayerId === myPlayer.id) ? (
            /* Eligible Recipient View */
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 font-['MedievalSharp',serif]">
                  {activeTradeProposal.type === 'trade' ? '🤝 Tauschangebot von ' : '🙋 Hilferuf von '}
                  <span className="text-white">{activeTradeProposal.senderName}</span>
                </span>
                <span className="text-[10px] text-[#a8825c]">
                  {activeTradeProposal.targetPlayerId ? 'Nur für dich' : 'An alle gerichtet'}
                </span>
              </div>

              <div className="p-2 bg-[#1b0f08] border border-[#52341b] rounded-lg flex items-center justify-between gap-2 text-xs">
                {activeTradeProposal.type === 'trade' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#c9b59e]">Bietet:</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-300">
                      {RESOURCE_INFO[activeTradeProposal.giveResource!].icon}
                      {activeTradeProposal.giveAmount || 1}x {RESOURCE_INFO[activeTradeProposal.giveResource!].name}
                    </span>
                    <span className="text-[#8f7156]">➔</span>
                    <span className="text-[#c9b59e]">Sucht:</span>
                    <span className="flex items-center gap-1 font-bold text-amber-300">
                      {RESOURCE_INFO[activeTradeProposal.wantedResource].icon}
                      {activeTradeProposal.wantedAmount}x {RESOURCE_INFO[activeTradeProposal.wantedResource].name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[#c9b59e]">Benötigt dringend:</span>
                    <span className="flex items-center gap-1 font-bold text-amber-300">
                      {RESOURCE_INFO[activeTradeProposal.wantedResource].icon}
                      {activeTradeProposal.wantedAmount}x {RESOURCE_INFO[activeTradeProposal.wantedResource].name}
                    </span>
                  </div>
                )}

                <div className="text-[11px] font-mono text-slate-300">
                  Dein Vorrat: {myPlayer.resources[activeTradeProposal.wantedResource]}x
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {onRespondTrade && (
                  <>
                    <button
                      type="button"
                      onClick={() => onRespondTrade(activeTradeProposal.id, 'decline')}
                      className="px-3 py-1.5 bg-[#25150c] hover:bg-[#382114] text-[#a8825c] hover:text-white border border-[#52341b] rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Ablehnen
                    </button>

                    <button
                      type="button"
                      onClick={() => onRespondTrade(activeTradeProposal.id, 'accept')}
                      disabled={myPlayer.resources[activeTradeProposal.wantedResource] < (activeTradeProposal.wantedAmount || 1)}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 disabled:from-stone-800 disabled:to-stone-900 disabled:text-stone-500 text-white font-bold rounded-lg border border-emerald-400 disabled:border-stone-700 text-xs shadow flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {activeTradeProposal.type === 'trade' ? 'Tausch annehmen' : `1x ${RESOURCE_INFO[activeTradeProposal.wantedResource].name} übergeben`}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Other player view */
            <div className="text-xs text-[#a8825c] italic">
              {activeTradeProposal.senderName} verhandelt gerade mit {players.find(p => p.id === activeTradeProposal.targetPlayerId)?.name}...
            </div>
          )}
        </div>
      )}

      {/* Main Action Area */}
      {isMyTurn ? (
        <div className="space-y-4">
          {/* 0a. Setup Settlement Phase */}
          {phase === 'SETUP_SETTLEMENT' && (
            <div className="p-3.5 bg-[#2b180d] border-2 border-emerald-500 rounded-xl text-center space-y-1.5 shadow-lg animate-pulse">
              <span className="text-sm font-bold text-emerald-300 font-['MedievalSharp',serif] flex items-center justify-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-400" />
                Startphase: Setze dein Dorf (Start-Siedlung)!
              </span>
              <p className="text-xs text-[#e8d5b5]">
                Wähle eine freie Kreuzung auf der Insel. Du erhältst sofort alle Rohstoffe der direkt angrenzenden Felder!
              </p>
            </div>
          )}

          {/* 0b. Setup Road Phase */}
          {phase === 'SETUP_ROAD' && (
            <div className="p-3.5 bg-[#2b180d] border-2 border-amber-500 rounded-xl text-center space-y-1.5 shadow-lg animate-pulse">
              <span className="text-sm font-bold text-amber-300 font-['MedievalSharp',serif] flex items-center justify-center gap-1.5">
                <Hammer className="w-4 h-4 text-amber-400" />
                Startphase: Baue deine Start-Straße!
              </span>
              <p className="text-xs text-[#e8d5b5]">
                Klicke auf eine freie Kante direkt an deinem soeben platzierten Dorf.
              </p>
            </div>
          )}

          {/* 1. Dice Phase */}
          {phase === 'TURN_DICE' && (
            <button
              type="button"
              onClick={handleRollClick}
              disabled={isRolling}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm border border-amber-300 font-['MedievalSharp',serif] tracking-wider active:scale-95 cursor-pointer disabled:opacity-85"
            >
              <Dices className={`w-5 h-5 ${isRolling ? 'animate-dice-tumble text-amber-900' : ''}`} />
              {isRolling ? 'Die Würfel rollen...' : 'Würfel werfen!'}
            </button>
          )}

          {/* 2. Robber Placement Phase Banner */}
          {phase === 'ROBBER_PLACEMENT' && (
            <div className="p-3 bg-[#331109] border-2 border-rose-500 rounded-xl text-center space-y-1.5 animate-pulse">
              <span className="text-sm font-bold text-amber-300 font-['MedievalSharp',serif] flex items-center justify-center gap-1.5">
                <span>🦹</span> Wähle ein Zielfeld für den Räuber!
              </span>
              <p className="text-xs text-rose-200">
                Klicke auf ein Landfeld auf dem Spielbrett, um den Räuber zu platzieren und die Produktion zu sperren.
              </p>
            </div>
          )}

          {/* 3. Actions Phase */}
          {phase === 'TURN_ACTIONS' && (
            <div className="space-y-3">
              {/* Fremdbau Target Player Selector */}
              <div className="bg-[#120b06] p-3 rounded-xl border border-[#4a2e16] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#dfcfba] flex items-center gap-1.5 font-serif">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    Siedlung/Stadt bauen für:
                  </span>
                  <span className="text-[10px] text-amber-300 font-medium">
                    {targetColor === myPlayer.color
                      ? 'Eigenes Gebäude'
                      : `Fremdbau für ${players.find(p => p.color === targetColor)?.name}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {players.map((p) => {
                    const cInfo = COLOR_MAP[p.color];
                    const isSelected = targetColor === p.color;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSetTargetColor(p.color)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all truncate ${
                          isSelected
                            ? `${cInfo.bg} text-white border-white shadow-md scale-105`
                            : 'bg-[#22150c] border-[#4a2e16] text-[#bda286] hover:border-[#7a4e22]'
                        }`}
                        title={`Bauen für ${p.name}`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Building Buttons & Trade Button */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {/* 1. Road */}
                <button
                  type="button"
                  onClick={() => onSetBuildMode(buildMode === 'road' ? 'none' : 'road')}
                  disabled={!canAffordRoad() || remainingRoads <= 0}
                  className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                    buildMode === 'road'
                      ? 'bg-amber-500 text-slate-950 border-white shadow-lg scale-105'
                      : canAffordRoad() && remainingRoads > 0
                      ? 'bg-[#22150c] hover:bg-[#342013] border-[#6b4220] text-[#f2e6d6]'
                      : 'bg-[#120b06]/60 border-[#2b170c] text-[#6d5543] cursor-not-allowed'
                  }`}
                  title="Gemeinsame Straße bauen"
                >
                  <div className="flex items-center gap-1">
                    <Hammer className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-['MedievalSharp',serif] text-[11px] sm:text-xs">Straße</span>
                  </div>
                  <span className="text-[10px] font-normal tracking-tight flex items-center justify-center gap-1">
                    <ResourceIcon type="wood" className="w-3.5 h-3.5" />
                    {myPlayer.role === 'pioneer' ? '/' : '+'}
                    <ResourceIcon type="clay" className="w-3.5 h-3.5" />
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold px-1 rounded mt-0.5 ${remainingRoads > 0 ? 'bg-[#3b2311] text-amber-300' : 'bg-rose-950 text-rose-400'}`}>
                    {remainingRoads}/30
                  </span>
                </button>

                {/* 2. Settlement */}
                <button
                  type="button"
                  onClick={() => onSetBuildMode(buildMode === 'settlement' ? 'none' : 'settlement')}
                  disabled={!canAffordSettlement() || remainingSettlements <= 0}
                  className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                    buildMode === 'settlement'
                      ? 'bg-amber-500 text-slate-950 border-white shadow-lg scale-105'
                      : canAffordSettlement() && remainingSettlements > 0
                      ? 'bg-[#22150c] hover:bg-[#342013] border-[#6b4220] text-[#f2e6d6]'
                      : 'bg-[#120b06]/60 border-[#2b170c] text-[#6d5543] cursor-not-allowed'
                  }`}
                  title="Siedlung bauen"
                >
                  <div className="flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-['MedievalSharp',serif] text-[11px] sm:text-xs">Siedlung</span>
                  </div>
                  <span className="text-[10px] font-normal tracking-tight flex items-center justify-center gap-0.5">
                    <ResourceIcon type="wood" className="w-3 h-3" />
                    <ResourceIcon type="clay" className="w-3 h-3" />
                    <ResourceIcon type="sheep" className="w-3 h-3" />
                    <ResourceIcon type="wheat" className="w-3 h-3" />
                    {myPlayer.role === 'builder' && <span className="text-[8px] text-amber-300 font-bold">-1</span>}
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold px-1 rounded mt-0.5 ${remainingSettlements > 0 ? 'bg-[#3b2311] text-emerald-300' : 'bg-rose-950 text-rose-400'}`}>
                    {remainingSettlements}/5
                  </span>
                </button>

                {/* 3. City */}
                <button
                  type="button"
                  onClick={() => onSetBuildMode(buildMode === 'city' ? 'none' : 'city')}
                  disabled={!canAffordCity() || remainingCities <= 0 || !hasSettlementToUpgrade}
                  className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                    buildMode === 'city'
                      ? 'bg-amber-500 text-slate-950 border-white shadow-lg scale-105'
                      : canAffordCity() && remainingCities > 0 && hasSettlementToUpgrade
                      ? 'bg-[#22150c] hover:bg-[#342013] border-[#6b4220] text-[#f2e6d6]'
                      : 'bg-[#120b06]/60 border-[#2b170c] text-[#6d5543] cursor-not-allowed'
                  }`}
                  title={!hasSettlementToUpgrade ? 'Erfordert eine bestehende Siedlung' : 'Siedlung zur Stadt aufwerten'}
                >
                  <div className="flex items-center gap-1">
                    <Castle className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-['MedievalSharp',serif] text-[11px] sm:text-xs">Stadt</span>
                  </div>
                  <span className="text-[10px] font-normal tracking-tight flex items-center justify-center gap-0.5">
                    <ResourceIcon type="ore" className="w-3 h-3" />
                    <span className="text-[9px]">3x</span>
                    <ResourceIcon type="wheat" className="w-3 h-3" />
                    <span className="text-[9px]">2x</span>
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold px-1 rounded mt-0.5 ${remainingCities > 0 ? 'bg-[#3b2311] text-sky-300' : 'bg-rose-950 text-rose-400'}`}>
                    {hasSettlementToUpgrade ? `${remainingCities}/4` : 'Keine Siedl.'}
                  </span>
                </button>

                {/* 4. Trade Button */}
                <button
                  type="button"
                  onClick={() => setIsTradeOpen(!isTradeOpen)}
                  className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                    isTradeOpen
                      ? 'bg-[#42220f] border-amber-400 text-amber-200 shadow-md scale-105'
                      : 'bg-[#22150c] hover:bg-[#342013] border-[#6b4220] text-[#f2e6d6]'
                  }`}
                  title="Handeln: Bank (4:1) oder Rohstoffe an Mitspieler verschenken"
                >
                  <div className="flex items-center gap-1">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-['MedievalSharp',serif] text-[11px] sm:text-xs">Handel</span>
                  </div>
                  <span className="text-[10px] font-normal text-amber-300">4:1 & Team</span>
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1 rounded mt-0.5 bg-[#3b2311] text-amber-300">
                    {isTradeOpen ? 'Schließen' : 'Öffnen'}
                  </span>
                </button>
              </div>

              {/* Interactive Trading Panel */}
              {isTradeOpen && (
                <div className="bg-[#120b06] border-2 border-amber-600/80 rounded-xl p-3 space-y-3">
                  {/* Trade Mode Tabs */}
                  <div className="flex border-b border-[#3d2311] pb-2 gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setTradeTab('bank')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tradeTab === 'bank'
                          ? 'bg-amber-600 text-slate-950 shadow'
                          : 'bg-[#201208] text-[#c4aa90] hover:text-white'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      Bank ({teamHasLongestRoad ? '3:1' : '4:1'})
                    </button>
                    {teammates.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTradeTab('trade')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            tradeTab === 'trade'
                              ? 'bg-amber-600 text-slate-950 shadow'
                              : 'bg-[#201208] text-[#c4aa90] hover:text-white'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Tauschen
                        </button>
                        <button
                          type="button"
                          onClick={() => setTradeTab('request')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            tradeTab === 'request'
                              ? 'bg-amber-600 text-slate-950 shadow'
                              : 'bg-[#201208] text-[#c4aa90] hover:text-white'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Anfragen
                        </button>
                        <button
                          type="button"
                          onClick={() => setTradeTab('gift')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            tradeTab === 'gift'
                              ? 'bg-amber-600 text-slate-950 shadow'
                              : 'bg-[#201208] text-[#c4aa90] hover:text-white'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Schenken
                        </button>
                      </>
                    )}
                  </div>

                  {/* Bank & Harbor Trade */}
                  {tradeTab === 'bank' && (
                    <div className="space-y-2 text-xs">
                      <p className="text-[11px] text-[#c9b59e]">
                        Tausche Rohstoffe bei der Bank (Standard 4:1, oder 3:1 / 2:1 durch deine See-Häfen).
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {/* Give */}
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-[#a8825c] mb-1">
                            Du gibst ({currentGiveRatio}x):
                          </span>
                          <div className="space-y-1">
                            {(['wood', 'clay', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                              const ratio = getTradeRatio(r);
                              const count = myPlayer.resources[r] || 0;
                              const isEligible = count >= ratio;
                              const isSelected = giveRes === r;

                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setGiveRes(r)}
                                  disabled={!isEligible}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-xs transition-all ${
                                    isSelected
                                      ? 'bg-amber-500 text-slate-950 font-bold border-white'
                                      : isEligible
                                      ? 'bg-[#25150c] border-[#5a3617] text-[#e8d5b5] hover:border-amber-500'
                                      : 'bg-[#140c06] border-[#29170a] text-[#5e4331] cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {RESOURCE_INFO[r].icon}
                                    <span>{RESOURCE_INFO[r].name}</span>
                                  </span>
                                  <div className="flex flex-col items-end">
                                    <span className="font-mono font-bold">{count}/{ratio}</span>
                                    {ratio < 4 && (
                                      <span className="text-[9px] text-amber-300 font-bold leading-none">
                                        {ratio === 2 ? '2:1 Hafen' : '3:1 Hafen'}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Receive 1 */}
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-[#a8825c] mb-1">
                            Du erhältst (1x):
                          </span>
                          <div className="space-y-1">
                            {(['wood', 'clay', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                              const isSelected = getRes === r;
                              const isSame = giveRes === r;

                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setGetRes(r)}
                                  disabled={isSame}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-xs transition-all ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white font-bold border-white shadow'
                                      : !isSame
                                      ? 'bg-[#25150c] border-[#5a3617] text-[#e8d5b5] hover:border-emerald-500'
                                      : 'bg-[#140c06] border-[#29170a] text-[#5e4331] cursor-not-allowed opacity-50'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {RESOURCE_INFO[r].icon}
                                    <span>{RESOURCE_INFO[r].name}</span>
                                  </span>
                                  <span className="text-[10px] opacity-80">+1</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleExecuteBankTrade}
                        disabled={myPlayer.resources[giveRes] < currentGiveRatio || giveRes === getRes}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-800 disabled:to-stone-900 disabled:text-stone-500 text-slate-950 font-bold py-2 rounded-xl border border-amber-300 transition-all text-xs font-['MedievalSharp',serif] shadow flex items-center justify-center gap-2 mt-2"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        {currentGiveRatio}x {RESOURCE_INFO[giveRes].name} tauschen gegen 1x {RESOURCE_INFO[getRes].name}
                        {currentGiveRatio < 4 && (
                          <span className="text-[10px] text-amber-950 bg-amber-200 px-1.5 py-0.5 rounded font-black ml-1">
                            {currentGiveRatio === 2 ? '2:1 Hafen' : '3:1 Hafen'}
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Teammate Mutual Trade */}
                  {tradeTab === 'trade' && teammates.length > 0 && (
                    <div className="space-y-3 text-xs">
                      <p className="text-[11px] text-[#c9b59e]">
                        Biete 1 Rohstoff im Tausch gegen einen gewünschten Rohstoff von Mitspielern an.
                      </p>

                      {/* Trade Partner Target */}
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#a8825c] mb-1">
                          Handelspartner:
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setTradeTargetId('')}
                            className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              tradeTargetId === ''
                                ? 'bg-amber-600 text-slate-950 border-white shadow font-black'
                                : 'bg-[#22150c] border-[#4a2e16] text-[#bda286]'
                            }`}
                          >
                            🌐 Alle Mitspieler
                          </button>
                          {teammates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setTradeTargetId(t.id)}
                              className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all truncate cursor-pointer ${
                                tradeTargetId === t.id
                                  ? 'bg-amber-600 text-slate-950 border-white shadow font-black'
                                  : 'bg-[#22150c] border-[#4a2e16] text-[#bda286]'
                              }`}
                            >
                              {t.name} {t.isBot ? '(Bot)' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Give vs Wanted */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {/* You Give (1x) */}
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-emerald-400 mb-1">
                            Du bietest (1x):
                          </span>
                          <div className="space-y-1">
                            {(['wood', 'clay', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                              const count = myPlayer.resources[r] || 0;
                              const isEligible = count >= 1;
                              const isSelected = tradeGiveRes === r;

                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setTradeGiveRes(r)}
                                  disabled={!isEligible}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white font-bold border-white shadow'
                                      : isEligible
                                      ? 'bg-[#25150c] border-[#5a3617] text-[#e8d5b5] hover:border-emerald-500'
                                      : 'bg-[#140c06] border-[#29170a] text-[#5e4331] cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {RESOURCE_INFO[r].icon}
                                    <span>{RESOURCE_INFO[r].name}</span>
                                  </span>
                                  <span className="font-mono font-bold">{count}x</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* You Want (1x) */}
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-amber-300 mb-1">
                            Du suchst (1x):
                          </span>
                          <div className="space-y-1">
                            {(['wood', 'clay', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                              const isSelected = tradeWantedRes === r;
                              const isSame = tradeGiveRes === r;

                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setTradeWantedRes(r)}
                                  disabled={isSame}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-600 text-slate-950 font-bold border-white shadow'
                                      : !isSame
                                      ? 'bg-[#25150c] border-[#5a3617] text-[#e8d5b5] hover:border-amber-500'
                                      : 'bg-[#140c06] border-[#29170a] text-[#5e4331] cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {RESOURCE_INFO[r].icon}
                                    <span>{RESOURCE_INFO[r].name}</span>
                                  </span>
                                  <span className="text-[10px] font-bold">1x</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleExecuteTradeProposal}
                        disabled={myPlayer.resources[tradeGiveRes] < 1 || tradeGiveRes === tradeWantedRes}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-800 disabled:to-stone-900 disabled:text-stone-500 text-slate-950 font-bold py-2 rounded-xl border border-amber-300 transition-all text-xs font-['MedievalSharp',serif] shadow flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Tauschangebot stellen: 1x {RESOURCE_INFO[tradeGiveRes].name} für 1x {RESOURCE_INFO[tradeWantedRes].name}
                      </button>
                    </div>
                  )}

                  {/* Teammate Resource Request (Hilferuf / Bedarf) */}
                  {tradeTab === 'request' && teammates.length > 0 && (
                    <div className="space-y-3 text-xs">
                      <p className="text-[11px] text-[#c9b59e]">
                        Frage einen dringend benötigten Rohstoff beim Team an. Mitspieler (und Bots) können dir direkt helfen!
                      </p>

                      {/* Request Target */}
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#a8825c] mb-1">
                          Anfrage richten an:
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setRequestTargetId('')}
                            className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              requestTargetId === ''
                                ? 'bg-amber-600 text-slate-950 border-white shadow font-black'
                                : 'bg-[#22150c] border-[#4a2e16] text-[#bda286]'
                            }`}
                          >
                            🌐 Alle Mitspieler
                          </button>
                          {teammates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setRequestTargetId(t.id)}
                              className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all truncate cursor-pointer ${
                                requestTargetId === t.id
                                  ? 'bg-amber-600 text-slate-950 border-white shadow font-black'
                                  : 'bg-[#22150c] border-[#4a2e16] text-[#bda286]'
                              }`}
                            >
                              {t.name} {t.isBot ? '(Bot)' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Select Requested Resource */}
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#a8825c] mb-1">
                          Welchen Rohstoff benötigst du?
                        </span>
                        <div className="grid grid-cols-5 gap-1.5">
                          {(['wood', 'clay', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                            const isSelected = requestRes === r;
                            const count = myPlayer.resources[r] || 0;

                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setRequestRes(r)}
                                className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-600 text-slate-950 border-white shadow font-bold scale-105'
                                    : 'bg-[#22150c] border-[#5a3818] text-[#e8d5b5] hover:border-amber-500'
                                }`}
                              >
                                <ResourceIcon type={r} className="w-6 h-6" />
                                <span className="text-[10px] font-mono mt-0.5">{count} im Vorrat</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleExecuteRequest}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-2 rounded-xl border border-amber-300 transition-all text-xs font-['MedievalSharp',serif] shadow flex items-center justify-center gap-2 mt-2 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Hilfe anfragen: 1x {RESOURCE_INFO[requestRes].name} im Team erbitten
                      </button>
                    </div>
                  )}

                  {/* Teammate Resource Gifting */}
                  {tradeTab === 'gift' && teammates.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-[#c9b59e]">
                          Schenke Rohstoffe (1 Schenkung pro Siedlung/Zug).
                        </p>
                        <span className={`text-[10px] whitespace-nowrap px-2 py-0.5 rounded-full font-bold border ${
                          (myPlayer.tradesRemainingThisTurn ?? 0) > 0 
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                            : 'bg-red-950/80 text-red-300 border-red-500/40'
                        }`}>
                          {myPlayer.tradesRemainingThisTurn ?? 0} {(myPlayer.tradesRemainingThisTurn ?? 0) === 1 ? 'Schenkung' : 'Schenkungen'} übrig
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#a8825c] mb-1">
                          Empfänger auswählen:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {teammates.map((t) => {
                            const isSelected = selectedTeammateId === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setGiftTargetId(t.id)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all truncate ${
                                  isSelected
                                    ? 'bg-amber-600 text-slate-950 border-white shadow font-black'
                                    : 'bg-[#22150c] border-[#4a2e16] text-[#bda286]'
                                }`}
                              >
                                {t.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#a8825c] mb-1">
                          Rohstoff zum Schenken:
                        </span>
                        <div className="grid grid-cols-5 gap-1">
                          {(['wood', 'clay', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                            const count = myPlayer.resources[r] || 0;
                            const isSelected = giftRes === r;
                            const canGift = count >= 1;

                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setGiftRes(r)}
                                disabled={!canGift}
                                className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-white shadow font-bold'
                                    : canGift
                                    ? 'bg-[#22150c] border-[#5a3818] text-[#e8d5b5] hover:border-emerald-500'
                                    : 'bg-[#140c06] border-[#29170a] text-[#5e4331] cursor-not-allowed opacity-50'
                                }`}
                              >
                                <ResourceIcon type={r} className="w-6 h-6" />
                                <span className="text-[10px] font-mono mt-0.5">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleExecuteGift}
                        disabled={myPlayer.resources[giftRes] < 1 || !selectedTeammateId || (myPlayer.tradesRemainingThisTurn ?? 0) < 1}
                        className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 disabled:from-stone-800 disabled:to-stone-900 disabled:text-stone-500 text-white font-bold py-2 rounded-xl border border-emerald-400 disabled:border-stone-700 transition-all text-xs font-['MedievalSharp',serif] shadow flex items-center justify-center gap-2 mt-2"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        {(myPlayer.tradesRemainingThisTurn ?? 0) < 1 
                          ? 'Schenk-Limit für diesen Zug erreicht' 
                          : `1x ${RESOURCE_INFO[giftRes].name} verschenken`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Build Instructions Banner */}
              {buildMode !== 'none' && (
                <div className="p-2.5 bg-[#2b1b0d] border border-amber-500/50 rounded-xl text-xs text-amber-300 flex items-center justify-between shadow">
                  <span>
                    {buildMode === 'road' && 'Klicke auf einen der goldenen Kreise an deinen Straßen/Siedlungen!'}
                    {buildMode === 'settlement' && 'Klicke auf einen freien Kreis (an Straße, 2 Kanten Abstand)!'}
                    {buildMode === 'city' && 'Klicke auf eine bestehende Siedlung, um sie zur Stadt auszubauen!'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSetBuildMode('none')}
                    className="underline text-[10px] font-bold text-white hover:text-amber-200 ml-2"
                  >
                    Abbrechen
                  </button>
                </div>
              )}

              {/* Knight Recruitment & End Turn */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onPlayKnight}
                  disabled={!canAffordKnight()}
                  className="w-1/2 bg-[#25160d] hover:bg-[#382114] disabled:opacity-40 disabled:hover:bg-[#25160d] border border-[#6b4220] text-rose-300 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow cursor-pointer disabled:cursor-not-allowed"
                  title={
                    myPlayer.role === 'captain'
                      ? 'Kapitän: Kostenloser Ritter! (Räuber vertreiben & Beute)'
                      : 'Ritter anheuern (1x Erz, 1x Wolle, 1x Weizen): Räuber vertreiben & Beute'
                  }
                >
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span>
                    {myPlayer.role === 'captain'
                      ? 'Ritter (Gratis)'
                      : 'Ritter (1E/1W/1G)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onEndTurn}
                  className="w-1/2 bg-gradient-to-r from-[#5a3818] to-[#6d431d] hover:from-[#6d431d] hover:to-[#855829] border border-[#855829] text-[#fff8ec] font-extrabold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md font-['MedievalSharp',serif] tracking-wider"
                >
                  <span>Zug beenden</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-[#120b06]/80 rounded-xl border border-[#3b2311] text-center space-y-1">
          <p className="text-xs font-semibold text-[#e8d5b5]">
            {phase === 'SETUP_SETTLEMENT'
              ? `${activePlayer.name} wählt die Start-Siedlung (Dorf)...`
              : phase === 'SETUP_ROAD'
              ? `${activePlayer.name} baut die Start-Straße...`
              : `${activePlayer.name} plant gerade den nächsten Zug...`}
          </p>
          <p className="text-[11px] text-[#9c7e65] italic">
            {phase === 'SETUP_SETTLEMENT' || phase === 'SETUP_ROAD'
              ? 'Die Startphase wird reihum durchgeführt.'
              : 'Nutzt den Chat oder plant Absprachen für den gemeinsamen Fremdbau!'}
          </p>
        </div>
      )}
    </div>
  );
};
