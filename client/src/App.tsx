import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import { GameRoomState, PlayerColor, ResourceType } from './types';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { QuestTracker } from './components/QuestTracker';
import { ActionControls } from './components/ActionControls';
import { PlayerHand } from './components/PlayerHand';
import { GameLog } from './components/GameLog';
import { GameOverModal } from './components/GameOverModal';
import { RulebookModal } from './components/RulebookModal';
import { BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [roomState, setRoomState] = useState<GameRoomState | null>(null);
  const [buildMode, setBuildMode] = useState<'none' | 'road' | 'settlement' | 'city'>('none');
  const [targetColor, setTargetColor] = useState<PlayerColor>('red');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isRulebookOpen, setIsRulebookOpen] = useState<boolean>(false);

  useEffect(() => {
    const onConnect = () => {
      if (socket.id) {
        setMyPlayerId(socket.id);
      }
    };

    const onRoomStateUpdated = (state: GameRoomState) => {
      setRoomState(state);
      // Update target color default to my color if in game
      const me = state.players.find(p => p.id === socket.id);
      if (me && (!targetColor || targetColor === 'red')) {
        setTargetColor(me.color);
      }
    };

    socket.on('connect', onConnect);
    socket.on('room_state_updated', onRoomStateUpdated);

    if (socket.connected && socket.id) {
      setMyPlayerId(socket.id);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('room_state_updated', onRoomStateUpdated);
    };
  }, []);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleRollDice = () => {
    if (!roomState) return;
    socket.emit('roll_dice', { roomCode: roomState.roomCode }, (res: any) => {
      if (!res.success) showNotification(res.message);
    });
  };

  const handleSelectEdge = (edgeId: string) => {
    if (!roomState) return;
    if (buildMode === 'road' || roomState.phase === 'SETUP_ROAD') {
      socket.emit(
        'build_road',
        { roomCode: roomState.roomCode, edgeId, targetColor: myPlayer?.color },
        (res: any) => {
          if (res.success) {
            setBuildMode('none');
          } else {
            showNotification(res.message);
          }
        }
      );
    }
  };

  const handleSelectVertex = (vertexId: string) => {
    if (!roomState) return;
    if (buildMode === 'settlement' || roomState.phase === 'SETUP_SETTLEMENT') {
      socket.emit(
        'build_settlement',
        { roomCode: roomState.roomCode, vertexId, targetColor: myPlayer?.color },
        (res: any) => {
          if (res.success) {
            setBuildMode('none');
          } else {
            showNotification(res.message);
          }
        }
      );
    } else if (buildMode === 'city') {
      socket.emit(
        'build_city',
        { roomCode: roomState.roomCode, vertexId },
        (res: any) => {
          if (res.success) {
            setBuildMode('none');
          } else {
            showNotification(res.message);
          }
        }
      );
    }
  };

  const handleSelectHex = (hexId: string) => {
    if (!roomState) return;
    if (roomState.phase === 'ROBBER_PLACEMENT') {
      socket.emit('move_robber', { roomCode: roomState.roomCode, hexId }, (res: any) => {
        if (!res.success) {
          showNotification(res.message);
        }
      });
    }
  };

  const handleTradeBank = (giveRes: ResourceType, getRes: ResourceType) => {
    if (!roomState) return;
    socket.emit('trade_bank', { roomCode: roomState.roomCode, giveRes, getRes }, (res: any) => {
      if (!res.success) {
        showNotification(res.message);
      }
    });
  };

  const handleGiftResource = (targetPlayerId: string, resource: ResourceType) => {
    if (!roomState) return;
    socket.emit('gift_resource', { roomCode: roomState.roomCode, targetPlayerId, resource }, (res: any) => {
      if (!res.success) {
        showNotification(res.message);
      }
    });
  };

  const handleDepositQuest = (slotIndex: number, resource: ResourceType, amount: number) => {
    if (!roomState) return;
    socket.emit(
      'deposit_quest',
      { roomCode: roomState.roomCode, slotIndex, resource, amount },
      (res: any) => {
        if (!res.success) showNotification(res.message);
      }
    );
  };

  const handlePlayKnight = () => {
    if (!roomState) return;
    socket.emit('play_knight', { roomCode: roomState.roomCode }, (res: any) => {
      if (!res.success) showNotification(res.message);
    });
  };

  const handleEndTurn = () => {
    if (!roomState) return;
    socket.emit('end_turn', { roomCode: roomState.roomCode }, (res: any) => {
      if (res.success) {
        setBuildMode('none');
      } else {
        showNotification(res.message);
      }
    });
  };

  const handleRestart = () => {
    window.location.reload();
  };

  // If in Lobby phase
  if (!roomState || roomState.phase === 'LOBBY') {
    return (
      <>
        <Lobby
          roomState={roomState}
          myPlayerId={myPlayerId}
          onOpenRulebook={() => setIsRulebookOpen(true)}
        />
        <RulebookModal
          isOpen={isRulebookOpen}
          onClose={() => setIsRulebookOpen(false)}
        />
      </>
    );
  }

  const activePlayer = roomState.players[roomState.activePlayerIndex];
  const myPlayer = roomState.players.find(p => p.id === myPlayerId) || activePlayer;
  const isMyTurn = activePlayer.id === myPlayerId;

  return (
    <div className="min-h-screen bg-[#0e0a07] text-[#e8d5b5] p-2 sm:p-4 md:p-6 flex flex-col justify-between selection:bg-amber-900 selection:text-amber-100">
      {/* Top Navigation Bar with Medieval Styling */}
      <header className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-[#5a3818]">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.jpg"
            alt="Catan Friends"
            className="w-11 h-11 rounded-xl border border-[#d4af37] shadow-md object-cover hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-xl font-bold text-[#fff4e0] font-['MedievalSharp',serif] tracking-wider drop-shadow">
              Catan Friends
            </h1>
            <span className="text-[11px] text-[#d4af37] font-semibold uppercase tracking-wider font-['Cinzel',serif]">
              Kooperatives Teamspiel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          {/* Rulebook Button */}
          <button
            type="button"
            onClick={() => setIsRulebookOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2a1a0f] hover:bg-[#3d2616] border border-[#7a4e22] text-[#d4af37] transition-all shadow hover:shadow-md"
            title="Spielanleitung ansehen"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-['MedievalSharp',serif]">Anleitung & Regeln</span>
          </button>

          <div className="bg-[#19110a] border border-[#5a3818] px-3 py-1.5 rounded-xl text-[#dfcfba] font-serif">
            Raum: <span className="font-mono text-amber-400 font-extrabold">{roomState.roomCode}</span>
          </div>
          <div className="bg-[#19110a] border border-[#5a3818] px-3 py-1.5 rounded-xl text-[#dfcfba] font-serif">
            Runde: <span className="text-white font-extrabold font-mono">{roomState.roundNumber}</span>
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {statusNotification && (
        <div className="fixed top-6 right-6 z-50 bg-rose-900 text-rose-100 font-bold text-xs px-4 py-3 rounded-xl shadow-2xl border-2 border-rose-500 animate-bounce">
          {statusNotification}
        </div>
      )}

      {/* Main Game Layout */}
      <main className="max-w-7xl w-full mx-auto my-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Board & Player Hand (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          <Board
            board={roomState.board}
            buildMode={buildMode}
            targetColor={targetColor}
            onSelectVertex={handleSelectVertex}
            onSelectEdge={handleSelectEdge}
            onSelectHex={handleSelectHex}
            phase={roomState.phase}
            isMyTurn={isMyTurn}
            disabled={!isMyTurn}
          />

          <PlayerHand
            myPlayer={myPlayer}
            players={roomState.players}
            teamHasLongestRoad={roomState.teamHasLongestRoad}
            teamHasLargestArmy={roomState.teamHasLargestArmy}
            roundNumber={roomState.roundNumber}
          />
        </div>

        {/* Right Column: Quests, Action Controls & Log (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* 4 Active Quests with D6 Countdown */}
          <QuestTracker
            questSlots={roomState.questSlots}
            solvedCount={roomState.solvedQuestsCount}
            failedCount={roomState.failedQuestsCount}
            targetToWin={roomState.targetQuestsToWin}
            myResources={myPlayer.resources}
            isMyTurn={isMyTurn && roomState.phase === 'TURN_ACTIONS'}
            onDeposit={handleDepositQuest}
          />

          {/* Action & Building Controls */}
          <ActionControls
            phase={roomState.phase}
            isMyTurn={isMyTurn}
            activePlayer={activePlayer}
            players={roomState.players}
            myPlayer={myPlayer}
            diceValues={roomState.diceValues}
            buildMode={buildMode}
            targetColor={targetColor}
            board={roomState.board}
            onSetBuildMode={setBuildMode}
            onSetTargetColor={setTargetColor}
            onRollDice={handleRollDice}
            onPlayKnight={handlePlayKnight}
            onEndTurn={handleEndTurn}
            onOpenRulebook={() => setIsRulebookOpen(true)}
            onTradeBank={handleTradeBank}
            onGiftResource={handleGiftResource}
          />

          {/* Island Chronicle (Event Log) */}
          <GameLog logs={roomState.logs} />
        </div>
      </main>

      {/* Game Over Modal (Victory or Defeat) */}
      <GameOverModal
        phase={roomState.phase}
        solvedCount={roomState.solvedQuestsCount}
        failedCount={roomState.failedQuestsCount}
        onRestart={handleRestart}
      />

      {/* Interactive Rulebook Modal */}
      <RulebookModal
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
      />
    </div>
  );
};
