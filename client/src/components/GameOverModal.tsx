import React, { useEffect, useState, useMemo } from 'react';
import { GamePhase, GameRoomState, GameEndStats, PlayerContributionStat, PlayerColor } from '../types';
import { Trophy, Skull, RotateCcw, Eye, BarChart3, Users, Award, Shield, Dices, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  roomState: GameRoomState;
  onRestart: () => void;
  phase?: GamePhase;
  solvedCount?: number;
  failedCount?: number;
}

const COLOR_MAP: Record<PlayerColor, { name: string; bg: string; border: string; text: string; dot: string }> = {
  red: { name: 'Rot', bg: 'bg-rose-950/60', border: 'border-rose-700/60', text: 'text-rose-300', dot: 'bg-rose-500' },
  blue: { name: 'Blau', bg: 'bg-blue-950/60', border: 'border-blue-700/60', text: 'text-blue-300', dot: 'bg-blue-500' },
  orange: { name: 'Orange', bg: 'bg-amber-950/60', border: 'border-amber-700/60', text: 'text-amber-300', dot: 'bg-amber-500' },
  white: { name: 'Weiß', bg: 'bg-slate-800/60', border: 'border-slate-500/60', text: 'text-slate-200', dot: 'bg-slate-200' }
};

const ROLE_LABELS: Record<string, string> = {
  pioneer: 'Pionier',
  builder: 'Baumeister',
  miner: 'Schürfer',
  captain: 'Hauptmann'
};

const EXPECTED_PIPS: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  roomState,
  onRestart,
  phase: legacyPhase,
  solvedCount: legacySolved,
  failedCount: legacyFailed
}) => {
  const currentPhase = roomState?.phase || legacyPhase;
  const isVictory = currentPhase === 'GAME_OVER_VICTORY';
  const isDefeat = currentPhase === 'GAME_OVER_DEFEAT';

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'team' | 'dice' | 'players'>('team');

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }, [isVictory]);

  const stats: GameEndStats = useMemo(() => {
    if (roomState?.gameStats) {
      return roomState.gameStats;
    }

    const diceRolls: { [sum: number]: number } = {
      2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
    };
    let totalRolls = 0;

    if (roomState?.logs) {
      for (const log of roomState.logs) {
        if (log.type === 'roll') {
          const match = log.message.match(/würfelt eine (\d+)/);
          if (match) {
            const sum = parseInt(match[1], 10);
            if (sum >= 2 && sum <= 12) {
              diceRolls[sum] = (diceRolls[sum] || 0) + 1;
              totalRolls++;
            }
          }
        }
      }
    }

    let settlementsCount = 0;
    let citiesCount = 0;
    if (roomState?.board?.vertices) {
      for (const vertex of Object.values(roomState.board.vertices)) {
        if (vertex.building?.type === 'settlement') settlementsCount++;
        else if (vertex.building?.type === 'city') citiesCount++;
      }
    }

    const playerStats: { [playerId: string]: PlayerContributionStat } = {};
    if (roomState?.players) {
      for (const p of roomState.players) {
        let pSettlements = 0;
        let pCities = 0;
        if (roomState.board?.vertices) {
          for (const vertex of Object.values(roomState.board.vertices)) {
            if (vertex.building?.ownerColor === p.color) {
              if (vertex.building.type === 'settlement') pSettlements++;
              else if (vertex.building.type === 'city') pCities++;
            }
          }
        }

        let pRoads = 0;
        if (roomState.board?.edges) {
          for (const edge of Object.values(roomState.board.edges)) {
            if (edge.road?.ownerColor === p.color) {
              pRoads++;
            }
          }
        }

        let deposited = 0;
        let harvested = 0;
        if (roomState.logs) {
          for (const log of roomState.logs) {
            if (log.message.startsWith(`${p.name} zahlt `)) {
              const m = log.message.match(/zahlt (\d+)x/);
              deposited += m ? parseInt(m[1], 10) : 1;
            } else if (log.message.startsWith(`${p.name} erhält `) || log.message.includes(`: ${p.name} erhält +`)) {
              const m = log.message.match(/(\d+)x/);
              harvested += m ? parseInt(m[1], 10) : 1;
            }
          }
        }

        playerStats[p.id] = {
          playerId: p.id,
          name: p.name,
          color: p.color,
          role: p.role,
          isBot: Boolean(p.isBot),
          roadsBuilt: pRoads,
          settlementsBuilt: pSettlements,
          citiesBuilt: pCities,
          resourcesDepositedToQuests: deposited,
          resourcesHarvested: harvested,
          knightsPlayed: p.knightsPlayed,
          longestRoadLength: p.longestRoadLength
        };
      }
    }

    const solvedQuests = roomState?.solvedQuestsCount ?? legacySolved ?? 0;
    const failedQuests = roomState?.failedQuestsCount ?? legacyFailed ?? 0;
    const longestRoadPts = roomState?.teamHasLongestRoad ? 3 : 0;
    const largestArmyPts = roomState?.teamHasLargestArmy ? 3 : 0;
    const totalPts = settlementsCount * 1 + citiesCount * 2 + solvedQuests * 1 + longestRoadPts + largestArmyPts;

    return {
      diceRolls,
      totalRolls,
      playerStats,
      totalResourcesHarvested: Object.values(playerStats).reduce((acc, ps) => acc + ps.resourcesHarvested, 0),
      totalQuestsSolved: solvedQuests,
      totalQuestsFailed: failedQuests,
      totalRounds: roomState?.roundNumber ?? 1,
      victoryPointsBreakdown: {
        settlements: settlementsCount * 1,
        cities: citiesCount * 2,
        quests: solvedQuests * 1,
        longestRoad: longestRoadPts,
        largestArmy: largestArmyPts,
        total: totalPts,
        target: roomState?.targetQuestsToWin ?? 24
      }
    };
  }, [roomState, legacySolved, legacyFailed]);

  if (!isVictory && !isDefeat) return null;

  // Max rolled count for bar chart scaling
  const maxRollCount = Math.max(1, ...Object.values(stats.diceRolls));

  // If minimized, display sleek floating top header bar to inspect board freely
  if (isMinimized) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[95%] bg-[#1c1109]/95 border-2 border-[#73451e] rounded-2xl shadow-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-[#e8d5b5] backdrop-blur-md transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
            isVictory ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
          }`}>
            {isVictory ? <Trophy className="w-5 h-5" /> : <Skull className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-['MedievalSharp',serif] text-sm sm:text-base">
                {isVictory ? 'Glorreicher Sieg!' : 'Die Insel ist verloren!'}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#331c0f] text-amber-400 border border-[#73451e]">
                {stats.victoryPointsBreakdown.total} / {stats.victoryPointsBreakdown.target} SP
              </span>
            </div>
            <p className="text-[11px] text-[#cbb299]">
              Spielfeld-Inspektion aktiv (Runde {stats.totalRounds}, {stats.totalQuestsSolved} Quests gelöst)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="bg-[#73451e] hover:bg-[#8c5425] text-amber-100 font-bold px-3 py-1.5 rounded-xl border border-[#a6632c] shadow flex items-center gap-1.5 text-xs transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Statistik & Details
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5 text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Neues Spiel
          </button>
        </div>
      </div>
    );
  }

  // Full Screen / Modal view with tabs
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="max-w-3xl w-full bg-[#20130a] border-2 border-[#73451e] rounded-3xl shadow-2xl p-5 sm:p-7 text-[#e8d5b5] space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#5c3718] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg ${
              isVictory ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-bounce' : 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
            }`}>
              {isVictory ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
            </div>
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-black text-white font-['MedievalSharp',serif]">
                {isVictory ? 'Glorreicher Sieg für das Team!' : 'Die Insel ist verloren!'}
              </h2>
              <p className="text-xs text-[#cbb299]">
                {isVictory
                  ? 'Gemeinsam habt ihr alle Quest-Ziele gemeistert und Catan vor dem Räuber beschützt!'
                  : 'Vier Quests sind abgelaufen. Der Räuber hat die Siedlungen überrannt.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="flex-1 sm:flex-initial bg-[#3a2010] hover:bg-[#522d17] text-amber-200 font-bold py-2 px-3 rounded-xl border border-[#73451e] shadow transition-colors flex items-center justify-center gap-1.5 text-xs"
              title="Modal minimieren, um das Spielfeld anzusehen"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              Spielfeld ansehen
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2 px-3 rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Neues Spiel
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#4d2c12] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'team'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-[#2a170b] text-[#cbb299] hover:bg-[#381f0f] border border-[#5c3718]'
            }`}
          >
            <Award className="w-4 h-4" />
            Teamergebnis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dice')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'dice'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-[#2a170b] text-[#cbb299] hover:bg-[#381f0f] border border-[#5c3718]'
            }`}
          >
            <Dices className="w-4 h-4" />
            Würfelstatistik
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'players'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-[#2a170b] text-[#cbb299] hover:bg-[#381f0f] border border-[#5c3718]'
            }`}
          >
            <Users className="w-4 h-4" />
            Spielerbeiträge
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* TAB 1: Teamergebnis */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              {/* Primary KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#170c06] p-3 rounded-2xl border border-[#5c3718] text-center">
                  <span className="text-[#a8825c] block uppercase font-bold text-[10px] font-['Cinzel',serif]">
                    Team-Siegpunkte
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {stats.victoryPointsBreakdown.total} / {stats.victoryPointsBreakdown.target}
                  </span>
                </div>
                <div className="bg-[#170c06] p-3 rounded-2xl border border-[#5c3718] text-center">
                  <span className="text-[#a8825c] block uppercase font-bold text-[10px] font-['Cinzel',serif]">
                    Gelöste Quests
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {stats.totalQuestsSolved}
                  </span>
                </div>
                <div className="bg-[#170c06] p-3 rounded-2xl border border-[#5c3718] text-center">
                  <span className="text-[#a8825c] block uppercase font-bold text-[10px] font-['Cinzel',serif]">
                    Fehlschläge
                  </span>
                  <span className="text-2xl font-black text-rose-400 font-mono">
                    {stats.totalQuestsFailed} / 4
                  </span>
                </div>
                <div className="bg-[#170c06] p-3 rounded-2xl border border-[#5c3718] text-center">
                  <span className="text-[#a8825c] block uppercase font-bold text-[10px] font-['Cinzel',serif]">
                    Runden gespielt
                  </span>
                  <span className="text-2xl font-black text-amber-200 font-mono">
                    {stats.totalRounds}
                  </span>
                </div>
              </div>

              {/* Victory Points Breakdown Detail */}
              <div className="bg-[#170c06] p-4 rounded-2xl border border-[#5c3718] space-y-3">
                <h3 className="text-xs font-bold text-[#e0caa7] uppercase tracking-wider font-['Cinzel',serif] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Zusammensetzung der Siegpunkte
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#24140a] border border-[#4d2c12]">
                    <span className="flex items-center gap-2">
                      <span>🏠</span>
                      <span>Siedlungen (1 SP pro Stück)</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      +{stats.victoryPointsBreakdown.settlements} SP
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#24140a] border border-[#4d2c12]">
                    <span className="flex items-center gap-2">
                      <span>🏰</span>
                      <span>Städte (2 SP pro Stück)</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      +{stats.victoryPointsBreakdown.cities} SP
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#24140a] border border-[#4d2c12]">
                    <span className="flex items-center gap-2">
                      <span>📜</span>
                      <span>Erfüllte Quests (1 SP pro Quest)</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      +{stats.victoryPointsBreakdown.quests} SP
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#24140a] border border-[#4d2c12]">
                    <span className="flex items-center gap-2">
                      <span>🛣️</span>
                      <span>Handelsstraße ({'>'}= 7 Straßen)</span>
                    </span>
                    <span className={`font-mono font-bold ${stats.victoryPointsBreakdown.longestRoad > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {stats.victoryPointsBreakdown.longestRoad > 0 ? '+3 SP (Aktiv)' : '0 SP'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#24140a] border border-[#4d2c12] sm:col-span-2">
                    <span className="flex items-center gap-2">
                      <span>⚔️</span>
                      <span>Größte Rittermacht ({'>'}= 3 Ritter)</span>
                    </span>
                    <span className={`font-mono font-bold ${stats.victoryPointsBreakdown.largestArmy > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {stats.victoryPointsBreakdown.largestArmy > 0 ? '+3 SP (Aktiv)' : '0 SP'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Würfelstatistik */}
          {activeTab === 'dice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs bg-[#170c06] p-3 rounded-2xl border border-[#5c3718]">
                <span className="text-[#cbb299]">
                  Gesamtzahl der Würfe: <strong className="text-white font-mono">{stats.totalRolls}</strong>
                </span>
                <span className="text-[#a8825c] text-[11px]">
                  Punkte unter der Zahl entsprechen der statistischen Wahrscheinlichkeit
                </span>
              </div>

              {/* Bar Chart 2 to 12 */}
              <div className="bg-[#170c06] p-4 rounded-2xl border border-[#5c3718] space-y-2">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                  const count = stats.diceRolls[num] || 0;
                  const pct = stats.totalRolls > 0 ? ((count / stats.totalRolls) * 100).toFixed(1) : '0.0';
                  const barWidth = `${Math.max(4, Math.round((count / maxRollCount) * 100))}%`;
                  const isRed = num === 6 || num === 8;
                  const isSeven = num === 7;
                  const dots = '•'.repeat(EXPECTED_PIPS[num]);

                  return (
                    <div key={num} className="flex items-center gap-2 text-xs">
                      {/* Number Chip */}
                      <div className={`w-8 h-7 rounded-lg flex flex-col items-center justify-center font-bold font-mono border ${
                        isRed
                          ? 'bg-red-950/80 border-red-500 text-red-400'
                          : isSeven
                          ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                          : 'bg-[#2b170c] border-[#5c3718] text-[#e8d5b5]'
                      }`}>
                        <span className="text-xs leading-none">{num}</span>
                        <span className="text-[8px] tracking-tighter leading-none text-slate-400">{dots}</span>
                      </div>

                      {/* Bar */}
                      <div className="flex-1 bg-[#25140a] h-6 rounded-lg overflow-hidden border border-[#4d2c12] p-0.5 relative flex items-center">
                        <div
                          className={`h-full rounded-md transition-all duration-500 ${
                            isRed
                              ? 'bg-gradient-to-r from-red-600 to-amber-500'
                              : isSeven
                              ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                              : 'bg-gradient-to-r from-[#8c5425] to-[#c28340]'
                          }`}
                          style={{ width: count > 0 ? barWidth : '0%' }}
                        />
                        <span className="absolute left-2 text-[11px] font-mono font-bold text-white drop-shadow">
                          {count}x ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Spielerbeiträge */}
          {activeTab === 'players' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(stats.playerStats).map(player => {
                  const colorStyle = COLOR_MAP[player.color] || COLOR_MAP.white;
                  const roleName = ROLE_LABELS[player.role] || player.role;

                  return (
                    <div
                      key={player.playerId}
                      className={`p-4 rounded-2xl border ${colorStyle.bg} ${colorStyle.border} space-y-3`}
                    >
                      {/* Player Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${colorStyle.dot} shadow`} />
                          <span className="font-bold text-white text-sm">
                            {player.name}
                          </span>
                          {player.isBot && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-slate-700">
                              Bot
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-[#cbb299] px-2 py-0.5 rounded-full bg-[#1c1109] border border-[#5c3718]">
                          {roleName}
                        </span>
                      </div>

                      {/* Player Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                          <span className="text-[#a8825c] block text-[9px] uppercase font-bold">Straßen</span>
                          <span className="font-mono font-black text-amber-300 text-sm">{player.roadsBuilt}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                          <span className="text-[#a8825c] block text-[9px] uppercase font-bold">Siedlungen</span>
                          <span className="font-mono font-black text-amber-300 text-sm">{player.settlementsBuilt}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                          <span className="text-[#a8825c] block text-[9px] uppercase font-bold">Städte</span>
                          <span className="font-mono font-black text-amber-300 text-sm">{player.citiesBuilt}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                          <span className="text-[#a8825c] block text-[9px] uppercase font-bold">Quest-Abgabe</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {player.resourcesDepositedToQuests}x
                          </span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                          <span className="text-[#a8825c] block text-[9px] uppercase font-bold">Ritter</span>
                          <span className="font-mono font-black text-indigo-300 text-sm">{player.knightsPlayed}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                          <span className="text-[#a8825c] block text-[9px] uppercase font-bold">Max. Straße</span>
                          <span className="font-mono font-black text-amber-200 text-sm">{player.longestRoadLength}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
