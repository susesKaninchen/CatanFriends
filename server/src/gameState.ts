// Catan Friends - Authoritative Game State Engine
import {
  GameRoomState,
  BoardState,
  Player,
  PlayerColor,
  PlayerRole,
  ResourceCount,
  ResourceType,
  GamePhase,
  GameLogEntry,
  QuestSlot,
  QuestType,
  HexType,
  HexTile,
  Edge,
  ActiveTradeProposal,
  TradeProposalType,
  GameEndStats,
  PlayerContributionStat
} from './types.js';
import { generateBoard, getNextRobberLetter, getPreviousRobberLetter, ROBBER_LETTER_ORDER, hexToPixel, exploreAdjacent, hexDistance } from './board.js';
import { createQuestSlot, initializeQuestSlots } from './quests.js';

export class GameManager {
  private rooms: Map<string, GameRoomState> = new Map();
  public onStateChanged?: (roomCode: string, state: GameRoomState) => void;

  public notifyStateChanged(roomCode: string) {
    const code = roomCode.toUpperCase();
    const state = this.getRoom(code);
    if (state && this.onStateChanged) {
      this.onStateChanged(code, state);
    }
  }

  public getPlayer(state: GameRoomState, playerIdentifier: string): Player | undefined {
    return state.players.find(p => p.id === playerIdentifier || p.socketId === playerIdentifier);
  }

  public isPlayerActive(state: GameRoomState, playerIdentifier: string): boolean {
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer) return false;
    if (activePlayer.isBot) return true;
    const caller = this.getPlayer(state, playerIdentifier);
    return Boolean(caller && caller.id === activePlayer.id);
  }

  public reconnectPlayer(roomCode: string, playerId: string, newSocketId: string): GameRoomState | null {
    const state = this.getRoom(roomCode);
    if (!state) return null;
    const player = state.players.find(p => p.id === playerId || p.socketId === playerId);
    if (player) {
      player.socketId = newSocketId;
      return state;
    }
    return null;
  }

  public getRoom(roomCode: string): GameRoomState | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public createRoom(roomCode: string, hostPlayer: Omit<Player, 'resources' | 'knightsPlayed' | 'longestRoadLength' | 'tradesRemainingThisTurn' | 'remainingPieces'>): GameRoomState {
    const code = roomCode.toUpperCase();
    const board = generateBoard();
    const questSlots = initializeQuestSlots(false);

    const fullHost: Player = {
      ...hostPlayer,
      resources: { wood: 0, clay: 0, sheep: 0, wheat: 0, ore: 0 },
      remainingPieces: { roads: 30, settlements: 5, cities: 4 },
      knightsPlayed: 0,
      longestRoadLength: 0,
      tradesRemainingThisTurn: 1
    };

    const state: GameRoomState = {
      roomCode: code,
      phase: 'LOBBY',
      players: [fullHost],
      activePlayerIndex: 0,
      roundNumber: 1,
      setupTurnIndex: 0,
      board,
      questSlots,
      solvedQuestsCount: 0,
      failedQuestsCount: 0,
      pointsPerPlayer: 10,
      teamVictoryPoints: 0,
      targetQuestsToWin: 10,
      diceValues: [1, 1],
      logs: [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          message: `Lobby für Raum ${code} erstellt. Willkommen bei Catan Friends!`,
          type: 'info'
        }
      ],
      longestRoadOwner: null,
      longestRoadLength: 0,
      teamHasLongestRoad: false,
      teamHasLargestArmy: false,
      robberMovedThisRound: false
    };

    this.rooms.set(code, state);
    return state;
  }

  public joinRoom(roomCode: string, player: Omit<Player, 'resources' | 'knightsPlayed' | 'longestRoadLength' | 'tradesRemainingThisTurn' | 'remainingPieces'>): { success: boolean; message?: string; room?: GameRoomState } {
    const state = this.getRoom(roomCode);
    if (!state) {
      return { success: false, message: 'Raum nicht gefunden.' };
    }
    if (state.phase !== 'LOBBY') {
      return { success: false, message: 'Spiel läuft bereits.' };
    }
    if (state.players.length >= 4) {
      return { success: false, message: 'Raum ist bereits voll (max. 4 Spieler).' };
    }

    // Assign unique color and role if already taken
    const takenColors = new Set(state.players.map(p => p.color));
    const allColors: PlayerColor[] = ['red', 'blue', 'orange', 'white'];
    let color = player.color;
    if (takenColors.has(color)) {
      color = allColors.find(c => !takenColors.has(c)) || 'white';
    }

    const takenRoles = new Set(state.players.map(p => p.role));
    const allRoles: PlayerRole[] = ['pioneer', 'builder', 'miner', 'captain'];
    let role = player.role;
    if (takenRoles.has(role)) {
      role = allRoles.find(r => !takenRoles.has(r)) || 'pioneer';
    }

    const fullPlayer: Player = {
      ...player,
      color,
      role,
      resources: { wood: 0, clay: 0, sheep: 0, wheat: 0, ore: 0 },
      remainingPieces: { roads: 30, settlements: 5, cities: 4 },
      knightsPlayed: 0,
      longestRoadLength: 0,
      tradesRemainingThisTurn: 1
    };

    state.players.push(fullPlayer);
    state.targetQuestsToWin = (state.pointsPerPlayer || 10) * state.players.length;
    this.addLog(state, `${fullPlayer.name} ist beigetreten (${color}, ${role}). Team-Siegziel: ${state.targetQuestsToWin} Siegpunkte (${state.pointsPerPlayer || 10}/Spieler).`, 'info');

    return { success: true, room: state };
  }

  public addBot(roomCode: string): { success: boolean; message?: string; room?: GameRoomState } {
    const state = this.getRoom(roomCode);
    if (!state || state.phase !== 'LOBBY' || state.players.length >= 4) {
      return { success: false, message: 'Bot konnte nicht hinzugefügt werden.' };
    }

    const takenColors = new Set(state.players.map(p => p.color));
    const allColors: PlayerColor[] = ['red', 'blue', 'orange', 'white'];
    const color = allColors.find(c => !takenColors.has(c)) || 'white';

    const takenRoles = new Set(state.players.map(p => p.role));
    const allRoles: PlayerRole[] = ['pioneer', 'builder', 'miner', 'captain'];
    const role = allRoles.find(r => !takenRoles.has(r)) || 'builder';

    const botNames = ['Bot Erik', 'Bot Mia', 'Bot Lucas', 'Bot Sophie'];
    const name = botNames[state.players.length] || `Bot ${state.players.length + 1}`;

    const botPlayer: Player = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      color,
      role,
      isReady: true,
      isHost: false,
      isBot: true,
      resources: { wood: 0, clay: 0, sheep: 0, wheat: 0, ore: 0 },
      remainingPieces: { roads: 30, settlements: 5, cities: 4 },
      knightsPlayed: 0,
      longestRoadLength: 0,
      tradesRemainingThisTurn: 1
    };

    state.players.push(botPlayer);
    state.targetQuestsToWin = (state.pointsPerPlayer || 10) * state.players.length;
    this.addLog(state, `${name} (Bot) wurde hinzugefügt. Team-Siegziel: ${state.targetQuestsToWin} Siegpunkte (${state.pointsPerPlayer || 10}/Spieler).`, 'info');

    return { success: true, room: state };
  }

  public setPointsPerPlayer(roomCode: string, playerId: string, points: number): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };
    const player = this.getPlayer(state, playerId);
    if (!player || !player.isHost) {
      return { success: false, message: 'Nur der Host kann die Spiellänge anpassen.' };
    }
    if (state.phase !== 'LOBBY') {
      return { success: false, message: 'Spiellänge kann nur in der Lobby geändert werden.' };
    }
    const validPoints = [6, 10, 14];
    if (!validPoints.includes(points)) {
      return { success: false, message: 'Ungültige Punktzahl. Erlaubt sind: 6 (Kurz), 10 (Standard), 14 (Episch).' };
    }

    state.pointsPerPlayer = points;
    state.targetQuestsToWin = points * state.players.length;
    const modeName = points === 6 ? 'Kurz (6 Pkt/Spieler)' : points === 10 ? 'Standard (10 Pkt/Spieler)' : 'Episch (14 Pkt/Spieler)';
    this.addLog(state, `Host ${player.name} setzt Spiellänge auf "${modeName}". Neues Team-Siegziel: ${state.targetQuestsToWin} Siegpunkte.`, 'info');
    return { success: true };
  }

  public setPlayerReady(roomCode: string, playerId: string, isReady: boolean): boolean {
    const state = this.getRoom(roomCode);
    if (!state) return false;
    const player = this.getPlayer(state, playerId);
    if (!player) return false;
    player.isReady = isReady;
    return true;
  }

  public updatePlayerPreferences(roomCode: string, playerId: string, color: PlayerColor, role: PlayerRole): boolean {
    const state = this.getRoom(roomCode);
    if (!state || state.phase !== 'LOBBY') return false;

    const player = this.getPlayer(state, playerId);
    if (!player) return false;

    // Verify color and role availability
    const colorTaken = state.players.some(p => p.id !== player.id && p.color === color);
    const roleTaken = state.players.some(p => p.id !== player.id && p.role === role);

    if (!colorTaken) player.color = color;
    if (!roleTaken) player.role = role;
    return true;
  }

  private getSetupOrder(playerCount: number): number[] {
    if (playerCount <= 2) {
      // 1-2 players: 2 settlements and 2 roads each
      if (playerCount === 1) return [0, 0];
      // Serpentine for 2 players: P0 -> P1 -> P1 -> P0
      return [0, 1, 1, 0];
    }
    // 3-4 players: 1 settlement and 1 road each
    const order: number[] = [];
    for (let i = 0; i < playerCount; i++) {
      order.push(i);
    }
    return order;
  }

  public startGame(roomCode: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };
    if (state.phase !== 'LOBBY') return { success: false, message: 'Spiel läuft bereits.' };

    const setupOrder = this.getSetupOrder(state.players.length);
    state.phase = 'SETUP_SETTLEMENT';
    state.activePlayerIndex = setupOrder[0];
    state.setupTurnIndex = 0;
    state.roundNumber = 1;
    state.pointsPerPlayer = state.pointsPerPlayer || 10;
    state.targetQuestsToWin = state.pointsPerPlayer * state.players.length;
    state.teamVictoryPoints = 0;

    // Reset starting piece stocks and clear starting resources (collected when placing settlement)
    state.players.forEach(p => {
      p.resources = { wood: 0, clay: 0, sheep: 0, wheat: 0, ore: 0 };
      p.remainingPieces = { roads: 30, settlements: 5, cities: 4 };
      p.tradesRemainingThisTurn = 1;
    });

    const activePlayer = state.players[state.activePlayerIndex];
    const settlementsPerPlayer = state.players.length <= 2 ? 2 : 1;
    this.addLog(
      state,
      `Das Spiel hat begonnen! Gründungsphase: ${state.players.length <= 2 ? '1-2 Spieler: Jeder gründet 2 Siedlungen und 2 Straßen!' : '3-4 Spieler: Jeder gründet 1 Siedlung und 1 Straße.'}`,
      'alert'
    );
    this.addLog(
      state,
      `Gründungsphase (1/${setupOrder.length}): ${activePlayer.name} wählt eine freie Kreuzung für die ${settlementsPerPlayer > 1 ? 'erste ' : ''}Startsiedlung.`,
      'info'
    );

    if (activePlayer.isBot) {
      setTimeout(() => this.executeBotSetupTurn(roomCode, activePlayer.id), 1000);
    }

    return { success: true };
  }

  public rollDice(roomCode: string, playerId: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_DICE') {
      return { success: false, message: 'Würfeln ist in dieser Phase nicht möglich.' };
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    state.diceValues = [d1, d2];

    this.addLog(state, `${activePlayer.name} würfelt eine ${sum} (${d1} + ${d2}).`, 'roll');

    if (sum === 7) {
      this.handleSevenRoll(state, activePlayer);
    } else {
      this.distributeResources(state, sum);
      state.phase = 'TURN_ACTIONS';
    }

    return { success: true };
  }

  private distributeResources(state: GameRoomState, diceSum: number) {
    const hexesWithNumber = state.board.hexes.filter(h => h.diceNumber === diceSum);

    for (const hex of hexesWithNumber) {
      if (hex.id === state.board.robberHexId) {
        const numStr = hex.diceNumber ? `Zahl ${hex.diceNumber}` : 'Wüste';
        this.addLog(state, `Räuber blockiert Ertrag auf ${hex.type} (${numStr})! Keine Rohstoffe.`, 'alert');
        continue;
      }

      const resourceType = hex.type as ResourceType;
      // Check vertices touching this hex
      for (const vKey of Object.keys(state.board.vertices)) {
        const vertex = state.board.vertices[vKey];
        if (vertex.adjacentHexIds.includes(hex.id) && vertex.building) {
          const owner = state.players.find(p => p.color === vertex.building!.ownerColor);
          if (owner) {
            const amount = vertex.building.type === 'city' ? 2 : 1;
            owner.resources[resourceType] += amount;
            this.addLog(state, `${owner.name} erhält ${amount}x ${resourceType}.`, 'info');

            // Miner Role Bonus: +1 extra resource on ore and wheat hexes
            if (owner.role === 'miner' && (resourceType === 'ore' || resourceType === 'wheat')) {
              owner.resources[resourceType] += 1;
              this.addLog(state, `Schürfer-Bonus: ${owner.name} erhält +1x ${resourceType}!`, 'info');
            }
          }
        }
      }
    }
  }

  private handleSevenRoll(state: GameRoomState, activePlayer: Player) {
    this.addLog(state, 'Eine 7 gewürfelt! Der Räuber schlägt zu!', 'alert');

    // 1. Half card discard for players with > 7 resources
    state.players.forEach(player => {
      const totalCards = Object.values(player.resources).reduce((a, b) => a + b, 0);
      if (totalCards > 7) {
        const toDiscard = Math.floor(totalCards / 2);
        this.discardRandomCards(player, toDiscard);
        this.addLog(state, `${player.name} hatte ${totalCards} Handkarten und verliert ${toDiscard} Karten an die Bank.`, 'robber');
      }
    });

    // 2. Automated Robber Movement (Cooperative AI: moves only 1 field towards highest-yielding team land tile)
    this.stepRobberTowardsTarget(state, true);
    state.phase = 'TURN_ACTIONS';
  }

  private stealFromAdjacentBuildings(state: GameRoomState, hexId: string): string {
    const adjacentBuildings: Array<{ building: { type: 'settlement' | 'city'; ownerColor: PlayerColor }; vertexKey: string }> = [];
    for (const vKey of Object.keys(state.board.vertices)) {
      const v = state.board.vertices[vKey];
      if (v.adjacentHexIds.includes(hexId) && v.building) {
        adjacentBuildings.push({ building: v.building, vertexKey: vKey });
      }
    }

    if (adjacentBuildings.length === 0) {
      return ' (Keine anliegenden Gebäude zum Bestehlen)';
    }

    const stolenList: string[] = [];
    for (const { building } of adjacentBuildings) {
      const owner = state.players.find(p => p.color === building.ownerColor);
      if (!owner) continue;

      const resKeys: ResourceType[] = ['wood', 'clay', 'sheep', 'wheat', 'ore'];
      const available = resKeys.filter(r => owner.resources[r] > 0);
      if (available.length > 0) {
        const stolen = available[Math.floor(Math.random() * available.length)];
        owner.resources[stolen]--;
        const bTypeStr = building.type === 'city' ? 'Stadt' : 'Siedlung';
        stolenList.push(`1x ${stolen} von ${owner.name} (${bTypeStr})`);
      }
    }

    if (stolenList.length > 0) {
      return ` und stiehlt von allen anliegenden Gebäuden: ${stolenList.join(', ')}!`;
    } else {
      return ' (Anliegende Gebäude besitzen keine Handkarten mehr zum Stehlen)';
    }
  }

  private stepRobberTowardsTarget(state: GameRoomState, isSevenRoll: boolean = false) {
    // 1. Current robber hex
    let currentHex = state.board.hexes.find(h => h.id === state.board.robberHexId);
    if (!currentHex) {
      currentHex = state.board.hexes.find(h => h.type === 'desert') || state.board.hexes[0];
      if (!currentHex) return;
      state.board.robberHexId = currentHex.id;
    }
    state.board.hexes.forEach(h => { h.hasRobber = (h.id === state.board.robberHexId); });

    // 2. Find target: highest-yielding land hex with team buildings
    const candidateHexes = state.board.hexes.filter(h => h.type !== 'water');
    if (candidateHexes.length === 0) return;

    const scoredHexes = candidateHexes.map(hex => {
      let buildingWeight = 0;
      for (const vKey of Object.keys(state.board.vertices)) {
        const v = state.board.vertices[vKey];
        if (v.adjacentHexIds.includes(hex.id) && v.building) {
          buildingWeight += (v.building.type === 'city' ? 2 : 1);
        }
      }

      const pips = hex.diceNumber ? (6 - Math.abs(7 - hex.diceNumber)) : 0;
      // Prioritize hexes with buildings (1000 base + 100 per building + pips)
      const score = (buildingWeight > 0 ? 1000 : 0) + (buildingWeight * 100) + pips;

      return { hex, score };
    });

    scoredHexes.sort((a, b) => b.score - a.score);
    const targetHex = scoredHexes[0].hex;

    let destinationHex = currentHex;
    let movedStep = false;
    let minDist = 0;

    // 3. If robber is NOT at target hex: Take exactly 1 step in the direction of targetHex!
    if (currentHex.id !== targetHex.id) {
      const neighbors = state.board.hexes.filter(h => {
        if (h.type === 'water' || h.id === currentHex!.id) return false;
        return hexDistance(currentHex!, h) === 1;
      });

      if (neighbors.length > 0) {
        const neighborsWithDist = neighbors.map(n => ({
          hex: n,
          dist: hexDistance(n, targetHex)
        }));

        neighborsWithDist.sort((a, b) => a.dist - b.dist);
        minDist = neighborsWithDist[0].dist;
        const bestStepCandidates = neighborsWithDist.filter(n => n.dist === minDist).map(n => n.hex);
        destinationHex = bestStepCandidates[Math.floor(Math.random() * bestStepCandidates.length)];

        // Relocate robber by 1 step
        state.board.robberHexId = destinationHex.id;
        state.board.hexes.forEach(h => { h.hasRobber = (h.id === destinationHex.id); });
        movedStep = true;
      }
    }

    // 4. If triggered by rolling a 7: steal from ALL adjacent buildings of destinationHex!
    let stolenMsg = '';
    if (isSevenRoll) {
      stolenMsg = this.stealFromAdjacentBuildings(state, destinationHex.id);
    }

    // 5. Game Log messages
    const currentNumStr = destinationHex.diceNumber ? `Zahl ${destinationHex.diceNumber}` : 'Wüste';
    const targetNumStr = targetHex.diceNumber ? `Zahl ${targetHex.diceNumber}` : 'Wüste';
    const reasonPrefix = isSevenRoll ? 'Eine 7 gewürfelt!' : 'Runden-Patrouille:';

    if (destinationHex.id === targetHex.id) {
      if (movedStep) {
        this.addLog(
          state,
          `${reasonPrefix} Der Räuber erreicht das ertragreichste Feld: ${destinationHex.type} (${currentNumStr})${stolenMsg}`,
          'robber'
        );
      } else {
        this.addLog(
          state,
          `${reasonPrefix} Der Räuber besetzt weiterhin das ertragreichste Feld: ${destinationHex.type} (${currentNumStr}) und blockiert dort die Erträge.${stolenMsg}`,
          'robber'
        );
      }
    } else {
      this.addLog(
        state,
        `${reasonPrefix} Der Räuber zieht 1 Feld vor auf ${destinationHex.type} (${currentNumStr}) in Richtung ${targetHex.type} (${targetNumStr}, noch ${minDist} Felder entfernt).${stolenMsg}`,
        'robber'
      );
    }
  }

  public moveRobber(roomCode: string, playerId: string, targetHexId: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'ROBBER_PLACEMENT') {
      return { success: false, message: 'Räuber kann in dieser Phase nicht versetzt werden.' };
    }

    const targetHex = state.board.hexes.find(h => h.id === targetHexId);
    if (!targetHex) return { success: false, message: 'Ungültiges Zielfeld.' };
    if (targetHex.type === 'water') return { success: false, message: 'Der Räuber kann nicht ins Wasser gesetzt werden!' };
    if (targetHex.id === state.board.robberHexId) return { success: false, message: 'Der Räuber muss auf ein anderes Feld versetzt werden.' };

    this.moveRobberInternal(state, activePlayer, targetHexId);
    state.phase = 'TURN_ACTIONS';
    return { success: true };
  }

  private moveRobberInternal(state: GameRoomState, activePlayer: Player, targetHexId: string) {
    const targetHex = state.board.hexes.find(h => h.id === targetHexId);
    if (!targetHex) return;

    // Unset old robber
    state.board.hexes.forEach(h => { h.hasRobber = false; });
    targetHex.hasRobber = true;
    state.board.robberHexId = targetHex.id;

    // Find opponent buildings touching this hex
    const touchingColors = new Set<PlayerColor>();
    for (const vKey of Object.keys(state.board.vertices)) {
      const vertex = state.board.vertices[vKey];
      if (vertex.adjacentHexIds.includes(targetHex.id) && vertex.building) {
        if (vertex.building.ownerColor !== activePlayer.color) {
          touchingColors.add(vertex.building.ownerColor);
        }
      }
    }

    const victims = state.players.filter(p => touchingColors.has(p.color) && Object.values(p.resources).reduce((a, b) => a + b, 0) > 0);

    let stolenMsg = '';
    if (victims.length > 0) {
      const victim = victims[Math.floor(Math.random() * victims.length)];
      const resKeys: ResourceType[] = ['wood', 'clay', 'sheep', 'wheat', 'ore'];
      const available = resKeys.filter(r => victim.resources[r] > 0);
      if (available.length > 0) {
        const stolen = available[Math.floor(Math.random() * available.length)];
        victim.resources[stolen]--;
        activePlayer.resources[stolen]++;
        stolenMsg = ` und erbeutet 1x ${stolen} von ${victim.name}!`;
      }
    }

    const numStr = targetHex.diceNumber ? `Zahl ${targetHex.diceNumber}` : 'Wüste';
    this.addLog(state, `${activePlayer.name} platziert den Räuber auf ${targetHex.type} (${numStr})${stolenMsg}`, 'robber');
  }

  private discardRandomCards(player: Player, amount: number) {
    let remaining = amount;
    const resKeys: ResourceType[] = ['wood', 'clay', 'sheep', 'wheat', 'ore'];

    while (remaining > 0) {
      const available = resKeys.filter(k => player.resources[k] > 0);
      if (available.length === 0) break;
      const chosen = available[Math.floor(Math.random() * available.length)];
      player.resources[chosen]--;
      remaining--;
    }
  }

  private patrolRobberToNeighbor(state: GameRoomState) {
    this.stepRobberTowardsTarget(state, false);
  }

  // Fremdbau: active player pays, target player receives building
  public buildRoad(roomCode: string, playerId: string, edgeId: string, targetColor?: PlayerColor): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS' && state.phase !== 'SETUP_ROAD') {
      return { success: false, message: 'Bauen ist in dieser Phase nicht möglich.' };
    }

    const edge = state.board.edges[edgeId];
    if (!edge) return { success: false, message: 'Ungültige Kante.' };
    if (edge.road !== null) return { success: false, message: 'Kante ist bereits besetzt.' };
    if (edge.isWaterEdge) return { success: false, message: 'Im offenen Ozean können keine Straßen gebaut werden!' };

    const isSetup = state.phase === 'SETUP_ROAD';

    if (isSetup) {
      const connectsToSetup =
        edge.vertex1Id === state.lastBuiltSetupVertexId ||
        edge.vertex2Id === state.lastBuiltSetupVertexId;
      if (!connectsToSetup) {
        return { success: false, message: 'Die Startstraße muss direkt an deine soeben gegründete Startsiedlung anschließen!' };
      }
    } else {
      const totalRemainingRoads = state.players.reduce((sum, p) => sum + p.remainingPieces.roads, 0);
      if (totalRemainingRoads <= 0) {
        return { success: false, message: 'Das Team hat das globale Straßen-Limit erreicht (alle Straßen gebaut).' };
      }

      // Adjacency rule: road must connect to an existing road or any building
      const v1 = state.board.vertices[edge.vertex1Id];
      const v2 = state.board.vertices[edge.vertex2Id];
      if (!v1 || !v2) return { success: false, message: 'Ungültige Kantenverbindung.' };

      const hasAdjacentBuilding = Boolean(v1.building) || Boolean(v2.building);
      const hasAdjacentRoad =
        v1.adjacentEdgeIds.some(eId => eId !== edgeId && Boolean(state.board.edges[eId]?.road)) ||
        v2.adjacentEdgeIds.some(eId => eId !== edgeId && Boolean(state.board.edges[eId]?.road));

      if (!hasAdjacentBuilding && !hasAdjacentRoad) {
        return { success: false, message: 'Straßen dürfen nur an bestehende Straßen oder Gebäude angebaut werden.' };
      }

      // Cost calculation (Pioneer bonus: 1 wood OR 1 clay instead of 1 wood AND 1 clay)
      if (activePlayer.role === 'pioneer') {
        if (activePlayer.resources.wood >= 1) {
          activePlayer.resources.wood -= 1;
        } else if (activePlayer.resources.clay >= 1) {
          activePlayer.resources.clay -= 1;
        } else {
          return { success: false, message: 'Pionier benötigt mindestens 1 Holz oder 1 Lehm.' };
        }
      } else {
        if (activePlayer.resources.wood < 1 || activePlayer.resources.clay < 1) {
          return { success: false, message: 'Für eine Straße werden 1 Holz und 1 Lehm benötigt.' };
        }
        activePlayer.resources.wood -= 1;
        activePlayer.resources.clay -= 1;
      }
    }

    const recipientColor = isSetup ? activePlayer.color : (targetColor || activePlayer.color);
    const recipientPlayer = state.players.find(p => p.color === recipientColor);
    if (!recipientPlayer) return { success: false, message: 'Zielspieler existiert nicht.' };
    if (recipientPlayer.remainingPieces.roads <= 0) {
      return { success: false, message: `${recipientPlayer.name} hat keine Straßen mehr im Vorrat.` };
    }

    recipientPlayer.remainingPieces.roads -= 1;

    // All roads belong to the whole team
    edge.road = {
      ownerColor: recipientColor,
      builtByColor: activePlayer.color
    };

    this.addLog(state, `${activePlayer.name} baut eine ${isSetup ? 'Startstraße' : 'gemeinsame Straße für das Team'}.`, 'build');

    // Reveal adjacent empty hexes when building a road
    const newlyDiscoveredRoad = exploreAdjacent(state.board, { edgeId });
    if (newlyDiscoveredRoad.length > 0) {
      const landParts = newlyDiscoveredRoad.filter(h => h.type !== 'water').map(h => `${h.type} (${h.diceNumber})`);
      const waterCount = newlyDiscoveredRoad.filter(h => h.type === 'water').length;
      const descParts: string[] = [...landParts];
      if (waterCount > 0) descParts.push(`${waterCount}x Ozean`);
      this.addLog(state, `Entdeckung! Neues Feld aufgedeckt: ${descParts.join(', ')}.`, 'info');
    }

    if (isSetup) {
      const setupOrder = this.getSetupOrder(state.players.length);
      state.setupTurnIndex += 1;
      if (state.setupTurnIndex < setupOrder.length) {
        state.activePlayerIndex = setupOrder[state.setupTurnIndex];
        state.phase = 'SETUP_SETTLEMENT';
        state.lastBuiltSetupVertexId = null;
        const nextPlayer = state.players[state.activePlayerIndex];
        const isSecondRound = state.setupTurnIndex >= state.players.length;
        const roundLabel = isSecondRound ? 'zweite' : 'erste';
        this.addLog(
          state,
          `Gründungsphase (${state.setupTurnIndex + 1}/${setupOrder.length}): ${nextPlayer.name} ist an der Reihe für die ${roundLabel} Startsiedlung und Startstraße.`,
          'info'
        );
        if (nextPlayer.isBot) {
          setTimeout(() => this.executeBotSetupTurn(roomCode, nextPlayer.id), 1000);
        }
      } else {
        // Setup complete: Robber remains on the desert until moved by a 7, knight, or patrol
        this.addLog(state, 'Gründungsphase beendet! Der Räuber lauert vorerst in der Wüste.', 'info');

        state.activePlayerIndex = 0;
        state.phase = 'TURN_DICE';
        state.roundNumber = 1;
        state.lastBuiltSetupVertexId = null;

        state.players.forEach(p => {
          p.tradesRemainingThisTurn = this.calculateTradeCapacity(p, state);
        });

        const score = this.calculateTeamVictoryPoints(state);
        state.teamVictoryPoints = score.totalPoints;
        const firstPlayer = state.players[0];
        const totalSettlements = Object.values(state.board.vertices).filter(v => v.building?.type === 'settlement').length;
        this.addLog(
          state,
          `Alle Startsiedlungen und Startstraßen errichtet! Das Team startet mit ${score.totalPoints} Siegpunkten (${totalSettlements} Siedlungen). Das Spiel beginnt: ${firstPlayer.name} würfelt!`,
          'alert'
        );
        if (firstPlayer.isBot) {
          setTimeout(() => this.executeBotTurn(roomCode, firstPlayer.id), 1200);
        }
      }
      return { success: true };
    }

    // Check Quests for roads
    this.checkProgressiveQuests(state, 'BUILD_ROADS', 1);
    this.updateLongestRoad(state);

    return { success: true };
  }

  public buildSettlement(roomCode: string, playerId: string, vertexId: string, targetColor?: PlayerColor, chosenDiscountRes?: ResourceType): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS' && state.phase !== 'SETUP_SETTLEMENT') {
      return { success: false, message: 'Bauen ist in dieser Phase nicht möglich.' };
    }

    const vertex = state.board.vertices[vertexId];
    if (!vertex) return { success: false, message: 'Ungültige Kreuzung.' };
    if (vertex.building !== null) return { success: false, message: 'Hier steht bereits ein Gebäude.' };

    const touchingHexes = vertex.adjacentHexIds.map(hId => state.board.hexes.find(h => h.id === hId)).filter(Boolean);
    if (touchingHexes.length > 0 && touchingHexes.every(h => h?.type === 'water')) {
      return { success: false, message: 'Auf reinem Ozean kann keine Siedlung gebaut werden!' };
    }

    // Distance rule: No building on adjacent vertices
    const hasAdjBuilding = vertex.adjacentVertexIds.some(adjId => Boolean(state.board.vertices[adjId]?.building));
    if (hasAdjBuilding) {
      return { success: false, message: 'Abstandsregel verletzt: Mindestens 2 Kanten Abstand zu anderen Siedlungen erforderlich.' };
    }

    const isSetup = state.phase === 'SETUP_SETTLEMENT';

    if (!isSetup) {
      // Road connection rule: Must be connected to at least one existing road
      const hasConnectingRoad = vertex.adjacentEdgeIds.some(eId => Boolean(state.board.edges[eId]?.road));
      if (!hasConnectingRoad) {
        return { success: false, message: 'Siedlungen müssen an eine bestehende Straße angebunden sein.' };
      }
    }

    const recipientColor = isSetup ? activePlayer.color : (targetColor || activePlayer.color);
    const recipientPlayer = state.players.find(p => p.color === recipientColor);
    if (!recipientPlayer) return { success: false, message: 'Zielspieler existiert nicht.' };
    if (recipientPlayer.remainingPieces.settlements <= 0) {
      return { success: false, message: `${recipientPlayer.name} hat das Siedlungs-Limit erreicht (5/5 gebaut).` };
    }

    if (!isSetup) {
      // Base cost: 1 wood, 1 clay, 1 sheep, 1 wheat
      // Builder discount: -1 resource of choice
      const required: ResourceCount = { wood: 1, clay: 1, sheep: 1, wheat: 1, ore: 0 };
      if (activePlayer.role === 'builder') {
        const discount = chosenDiscountRes || 'wood';
        if (required[discount] > 0) required[discount]--;
      }

      // Validate active player resources
      for (const [r, needed] of Object.entries(required)) {
        const resKey = r as ResourceType;
        if (activePlayer.resources[resKey] < needed) {
          return { success: false, message: `Nicht genügend ${resKey} für Siedlung.` };
        }
      }

      // Deduct resources
      for (const [r, needed] of Object.entries(required)) {
        const resKey = r as ResourceType;
        activePlayer.resources[resKey] -= needed;
      }
    }

    recipientPlayer.remainingPieces.settlements -= 1;

    vertex.building = {
      type: 'settlement',
      ownerColor: recipientColor,
      builtByColor: activePlayer.color
    };

    // Reveal adjacent empty hexes when building a settlement
    const newlyDiscoveredSettlement = exploreAdjacent(state.board, { vertexId });
    if (newlyDiscoveredSettlement.length > 0) {
      const landParts = newlyDiscoveredSettlement.filter(h => h.type !== 'water').map(h => `${h.type} (${h.diceNumber})`);
      const waterCount = newlyDiscoveredSettlement.filter(h => h.type === 'water').length;
      const descParts: string[] = [...landParts];
      if (waterCount > 0) descParts.push(`${waterCount}x Ozean`);
      this.addLog(state, `Entdeckung! Neues Feld aufgedeckt: ${descParts.join(', ')}.`, 'info');
    }

    if (isSetup) {
      state.lastBuiltSetupVertexId = vertexId;

      // Startrohstoffe wo man gebaut hat (direkte Auszahlung aller angrenzenden Ertragsfelder, inkl. neu aufgedeckter)
      const currentTouchingHexes = vertex.adjacentHexIds.map(hId => state.board.hexes.find(h => h.id === hId)).filter(Boolean);
      const gained: string[] = [];
      currentTouchingHexes.forEach(h => {
        if (h && h.type !== 'desert' && h.type !== 'water') {
          const res = h.type as ResourceType;
          activePlayer.resources[res] = (activePlayer.resources[res] || 0) + 1;
          gained.push(res);
        }
      });
      const resMsg = gained.length > 0 ? gained.join(', ') : 'keine Rohstoffe';
      this.addLog(state, `${activePlayer.name} gründet Startsiedlung und erhält Startrohstoffe: ${resMsg}.`, 'build');

      state.phase = 'SETUP_ROAD';
      this.addLog(state, `${activePlayer.name} platziert nun eine angeschlossene Startstraße.`, 'info');

      if (activePlayer.isBot) {
        setTimeout(() => this.executeBotSetupRoad(roomCode, activePlayer.id, vertexId), 800);
      }
      return { success: true };
    }

    const fremdbauNote = activePlayer.color !== recipientColor ? ` (Fremdbau für ${recipientPlayer.name})` : '';
    this.addLog(state, `${activePlayer.name} baut eine Siedlung in ${recipientColor}${fremdbauNote}.`, 'build');

    if (activePlayer.color === recipientColor) {
      activePlayer.tradesRemainingThisTurn += 1;
    }

    this.checkProgressiveQuests(state, 'BUILD_SETTLEMENTS', 1);
    this.checkTeamVictory(state);

    return { success: true };
  }

  public buildCity(roomCode: string, playerId: string, vertexId: string, chosenDiscountRes?: ResourceType): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Bauen ist in dieser Phase nicht möglich.' };
    }

    const vertex = state.board.vertices[vertexId];
    if (!vertex || !vertex.building) return { success: false, message: 'Keine Siedlung zum Ausbauen vorhanden.' };
    if (vertex.building.type === 'city') return { success: false, message: 'Ist bereits eine Stadt.' };

    const ownerPlayer = state.players.find(p => p.color === vertex.building?.ownerColor) || activePlayer;
    if (ownerPlayer.remainingPieces.cities <= 0) {
      return { success: false, message: `${ownerPlayer.name} hat das Städte-Limit erreicht (4/4 gebaut).` };
    }

    // Base cost: 3 ore, 2 wheat
    // Builder discount: 1 less resource of choice
    const required: ResourceCount = { wood: 0, clay: 0, sheep: 0, wheat: 2, ore: 3 };
    if (activePlayer.role === 'builder') {
      const discount = chosenDiscountRes || 'ore';
      if (required[discount] > 0) required[discount]--;
    }

    for (const [r, needed] of Object.entries(required)) {
      const resKey = r as ResourceType;
      if (activePlayer.resources[resKey] < needed) {
        return { success: false, message: `Nicht genügend ${resKey} für Stadt.` };
      }
    }

    for (const [r, needed] of Object.entries(required)) {
      const resKey = r as ResourceType;
      activePlayer.resources[resKey] -= needed;
    }

    vertex.building.type = 'city';
    ownerPlayer.remainingPieces.cities -= 1;
    ownerPlayer.remainingPieces.settlements += 1; // Returned to player stock!

    if (activePlayer.color === ownerPlayer.color) {
      activePlayer.tradesRemainingThisTurn += 1;
    }

    this.addLog(state, `${activePlayer.name} baut Siedlung zu einer Stadt aus!`, 'build');

    // Check city on resource quests
    const touchingHexes = vertex.adjacentHexIds.map(hId => state.board.hexes.find(h => h.id === hId));
    state.questSlots.forEach(slot => {
      if (!slot.isCompleted && slot.type === 'BUILD_CITY_ON_RESOURCE' && slot.targetResourceType) {
        const matchesResource = touchingHexes.some(h => h?.type === slot.targetResourceType);
        if (matchesResource) {
          this.completeQuest(state, slot);
        }
      }
    });

    this.checkTeamVictory(state);

    return { success: true };
  }

  // Contribute resources directly to an active quest
  public depositToQuest(roomCode: string, playerId: string, slotIndex: number, resource: ResourceType, amount: number = 1): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Einzahlen ist nur in der Aktionsphase möglich.' };
    }

    const slot = state.questSlots[slotIndex];
    if (!slot || slot.isCompleted) return { success: false, message: 'Quest ist nicht verfügbar.' };
    if (slot.type !== 'DELIVER_RESOURCES' || !slot.requiredResources) {
      return { success: false, message: 'Diese Quest benötigt keine Rohstoff-Einzahlungen.' };
    }

    const needed = slot.requiredResources[resource] || 0;
    const current = slot.depositedResources[resource] || 0;
    if (current >= needed) {
      return { success: false, message: `Bedarf an ${resource} ist für diese Quest bereits gedeckt.` };
    }

    const toDeposit = Math.min(amount, needed - current, activePlayer.resources[resource]);
    if (toDeposit <= 0) {
      return { success: false, message: `Nicht genügend ${resource} auf der Hand.` };
    }

    activePlayer.resources[resource] -= toDeposit;
    slot.depositedResources[resource] += toDeposit;

    this.addLog(state, `${activePlayer.name} zahlt ${toDeposit}x ${resource} in Quest "${slot.title}" ein (${slot.depositedResources[resource]}/${needed}).`, 'quest');

    // Check if fully satisfied
    let allFulfilled = true;
    for (const [r, req] of Object.entries(slot.requiredResources)) {
      const resKey = r as ResourceType;
      if ((slot.depositedResources[resKey] || 0) < (req || 0)) {
        allFulfilled = false;
        break;
      }
    }

    if (allFulfilled) {
      this.completeQuest(state, slot);
    }

    return { success: true };
  }

  private checkProgressiveQuests(state: GameRoomState, type: QuestType, progressIncrement: number = 1) {
    state.questSlots.forEach(slot => {
      if (!slot.isCompleted && slot.type === type && slot.targetCount) {
        slot.currentCount += progressIncrement;
        if (slot.currentCount >= slot.targetCount) {
          this.completeQuest(state, slot);
        }
      }
    });
  }

  public calculateTeamVictoryPoints(state: GameRoomState): {
    settlementsCount: number;
    settlementPoints: number;
    citiesCount: number;
    cityPoints: number;
    solvedQuestsCount: number;
    questPoints: number;
    longestRoadPoints: number;
    largestArmyPoints: number;
    totalPoints: number;
  } {
    let settlementsCount = 0;
    let citiesCount = 0;
    for (const vertex of Object.values(state.board.vertices)) {
      if (vertex.building?.type === 'settlement') {
        settlementsCount++;
      } else if (vertex.building?.type === 'city') {
        citiesCount++;
      }
    }

    const settlementPoints = settlementsCount * 1;
    const cityPoints = citiesCount * 2;
    const questPoints = state.solvedQuestsCount * 1;
    const longestRoadPoints = state.teamHasLongestRoad ? 3 : 0;
    const largestArmyPoints = state.teamHasLargestArmy ? 3 : 0;
    const totalPoints = settlementPoints + cityPoints + questPoints + longestRoadPoints + largestArmyPoints;

    return {
      settlementsCount,
      settlementPoints,
      citiesCount,
      cityPoints,
      solvedQuestsCount: state.solvedQuestsCount,
      questPoints,
      longestRoadPoints,
      largestArmyPoints,
      totalPoints
    };
  }

  public buildGameEndStats(state: GameRoomState): GameEndStats {
    const diceRolls: { [sum: number]: number } = {
      2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
    };
    let totalRolls = 0;

    for (const log of state.logs) {
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

    const playerStats: { [playerId: string]: PlayerContributionStat } = {};
    for (const p of state.players) {
      let settlementsCount = 0;
      let citiesCount = 0;
      for (const vertex of Object.values(state.board.vertices)) {
        if (vertex.building?.ownerColor === p.color) {
          if (vertex.building.type === 'settlement') settlementsCount++;
          else if (vertex.building.type === 'city') citiesCount++;
        }
      }

      let roadsCount = 0;
      for (const edge of Object.values(state.board.edges)) {
        if (edge.road?.ownerColor === p.color) {
          roadsCount++;
        }
      }

      let depositedCount = 0;
      let harvestedCount = 0;
      for (const log of state.logs) {
        if (log.message.startsWith(`${p.name} zahlt `)) {
          const m = log.message.match(/zahlt (\d+)x/);
          if (m) depositedCount += parseInt(m[1], 10);
          else depositedCount += 1;
        } else if (log.message.startsWith(`${p.name} erhält `) || log.message.includes(`: ${p.name} erhält +`)) {
          const m = log.message.match(/(\d+)x/);
          if (m) harvestedCount += parseInt(m[1], 10);
          else harvestedCount += 1;
        }
      }

      playerStats[p.id] = {
        playerId: p.id,
        name: p.name,
        color: p.color,
        role: p.role,
        isBot: Boolean(p.isBot),
        roadsBuilt: roadsCount,
        settlementsBuilt: settlementsCount,
        citiesBuilt: citiesCount,
        resourcesDepositedToQuests: depositedCount,
        resourcesHarvested: harvestedCount,
        knightsPlayed: p.knightsPlayed,
        longestRoadLength: p.longestRoadLength
      };
    }

    const score = this.calculateTeamVictoryPoints(state);

    return {
      diceRolls,
      totalRolls,
      playerStats,
      totalResourcesHarvested: Object.values(playerStats).reduce((acc, ps) => acc + ps.resourcesHarvested, 0),
      totalQuestsSolved: state.solvedQuestsCount,
      totalQuestsFailed: state.failedQuestsCount,
      totalRounds: state.roundNumber,
      victoryPointsBreakdown: {
        settlements: score.settlementPoints,
        cities: score.cityPoints,
        quests: score.questPoints,
        longestRoad: score.longestRoadPoints,
        largestArmy: score.largestArmyPoints,
        total: score.totalPoints,
        target: state.targetQuestsToWin
      }
    };
  }

  private checkTeamVictory(state: GameRoomState) {
    const score = this.calculateTeamVictoryPoints(state);
    state.teamVictoryPoints = score.totalPoints;

    if (score.totalPoints >= state.targetQuestsToWin && state.phase !== 'GAME_OVER_VICTORY') {
      state.phase = 'GAME_OVER_VICTORY';
      state.gameStats = this.buildGameEndStats(state);
      const parts = [
        `${score.settlementsCount} Siedlung(en) (${score.settlementPoints} Pkt)`,
        `${score.citiesCount} Stadt/Städte (${score.cityPoints} Pkt)`,
        `${score.solvedQuestsCount} Quest(s) (${score.questPoints} Pkt)`
      ];
      if (state.teamHasLongestRoad) parts.push('Handelsstraße (+3 Pkt)');
      if (state.teamHasLargestArmy) parts.push('Rittermacht (+3 Pkt)');

      this.addLog(state, `SIEG! Das Team hat ${score.totalPoints} von benötigten ${state.targetQuestsToWin} Siegpunkten erreicht! (${parts.join(', ')}) Catan ist gerettet!`, 'alert');
    }
  }

  private completeQuest(state: GameRoomState, slot: QuestSlot) {
    slot.isCompleted = true;
    state.solvedQuestsCount += 1;

    this.addLog(state, `ERFOLG: Quest "${slot.title}" erfüllt! (${state.solvedQuestsCount} gelöst)`, 'quest');

    this.checkTeamVictory(state);
    if (state.phase === 'GAME_OVER_VICTORY') return;

    // Advance slot to next tier
    const nextTier = Math.min(6, slot.tier + 1);
    const activeTitles = state.questSlots.filter(s => s.slotIndex !== slot.slotIndex).map(s => s.title);
    const newSlot = createQuestSlot(slot.slotIndex, nextTier, state.teamHasLongestRoad, activeTitles);
    state.questSlots[slot.slotIndex] = newSlot;
    this.addLog(state, `Neuer Auftrag für Slot ${slot.slotIndex + 1}: "${newSlot.title}" (Stufe ${newSlot.tier}, W6-Timer: ${newSlot.d6Timer}).`, 'quest');
  }

  // Knight card / recruitment:
  // Captain can play 1 free knight per turn.
  // Other roles can recruit a knight for 1x Erz, 1x Wolle, 1x Weizen.
  // The more knights the team has, the further back the robber is banished!
  public playKnightCard(roomCode: string, playerId: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Ritterkarte kann nur in der Aktionsphase gespielt werden.' };
    }

    const isCaptain = activePlayer.role === 'captain';
    if (!isCaptain) {
      if (activePlayer.resources.ore < 1 || activePlayer.resources.sheep < 1 || activePlayer.resources.wheat < 1) {
        return { success: false, message: 'Ritter anheuern erfordert: 1x Erz, 1x Wolle und 1x Weizen.' };
      }
      activePlayer.resources.ore -= 1;
      activePlayer.resources.sheep -= 1;
      activePlayer.resources.wheat -= 1;
    }

    activePlayer.knightsPlayed += 1;

    // Check Largest Army milestone (>= 3 knights in team)
    const teamTotalKnights = state.players.reduce((sum, p) => sum + p.knightsPlayed, 0);

    // Progressive Robber Exile: The more knights the team has, the further the robber is banished
    const candidateHexes = state.board.hexes.filter(h => h.type !== 'water' && h.id !== state.board.robberHexId);
    if (candidateHexes.length === 0) return { success: false, message: 'Kein Zielfeld verfügbar.' };

    const scoredHexes = candidateHexes.map(hex => {
      const center = hexToPixel(hex.q, hex.r);
      let minBuildingDist = Infinity;
      let hasBuildingDirectly = false;

      for (const vKey of Object.keys(state.board.vertices)) {
        const v = state.board.vertices[vKey];
        if (v.building) {
          const d = Math.hypot(center.x - v.x, center.y - v.y);
          if (d < minBuildingDist) minBuildingDist = d;
          if (v.adjacentHexIds.includes(hex.id)) hasBuildingDirectly = true;
        }
      }

      const pips = hex.diceNumber ? (6 - Math.abs(7 - hex.diceNumber)) : 0;
      return { hex, minBuildingDist, hasBuildingDirectly, pips };
    });

    const safeHexes = scoredHexes.filter(h => !h.hasBuildingDirectly);
    const pool = safeHexes.length > 0 ? safeHexes : scoredHexes;

    // Sort by minBuildingDist descending (furthest away from team buildings first)
    pool.sort((a, b) => b.minBuildingDist - a.minBuildingDist);

    // Pick exile distance based on teamTotalKnights
    let chosenIndex = 0;
    if (teamTotalKnights >= 3) {
      chosenIndex = 0; // Absolute furthest hex away (maximum exile)
    } else if (teamTotalKnights === 2) {
      chosenIndex = Math.min(pool.length - 1, Math.floor(Math.random() * Math.min(2, pool.length)));
    } else {
      chosenIndex = Math.min(pool.length - 1, Math.floor(Math.random() * Math.min(4, pool.length)));
    }

    const targetHex = pool[chosenIndex].hex;

    state.board.hexes.forEach(h => { h.hasRobber = false; });
    targetHex.hasRobber = true;
    state.board.robberHexId = targetHex.id;

    const numStr = targetHex.diceNumber ? `Zahl ${targetHex.diceNumber}` : 'Wüste';
    this.addLog(state, `${activePlayer.name} ${isCaptain ? 'befiehlt die Ritterwache' : 'heuert einen Ritter an'} (Team-Ritter: ${teamTotalKnights})! Der Räuber wird ${teamTotalKnights >= 3 ? 'maximal weit in die Einöde verbannt' : `${teamTotalKnights}x weiter zurückgedrängt`} auf ${targetHex.type} (${numStr})!`, 'alert');

    if (teamTotalKnights >= 3) {
      if (!state.teamHasLargestArmy) {
        state.teamHasLargestArmy = true;
        this.addLog(state, 'MEILENSTEIN: Größte Rittermacht erreicht (>= 3 Ritter)! +3 Siegpunkte für das Team! Der Räuber patrouilliert nur noch jede 2. Runde!', 'alert');
        this.checkTeamVictory(state);
      }
      state.robberStunnedRounds = 1;
      this.addLog(state, 'Ritterwache überwältigt den Räuber: Seine nächste Patrouille fällt komplett aus!', 'info');
    }

    return { success: true };
  }

  // Bank & Harbor Trade (4:1, 3:1 generic harbor, or 2:1 resource harbor)
  public tradeWithBank(roomCode: string, playerId: string, giveRes: ResourceType, getRes: ResourceType): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Handeln ist nur in der Aktionsphase möglich.' };
    }
    if (giveRes === getRes) {
      return { success: false, message: 'Bitte unterschiedliche Rohstoffe wählen.' };
    }

    const ratio = this.getPlayerTradeRatio(state.board, activePlayer.color, giveRes, state.teamHasLongestRoad);

    if (activePlayer.resources[giveRes] < ratio) {
      return { success: false, message: `Du benötigst ${ratio}x ${giveRes} für diesen Handel (${ratio}:1).` };
    }

    activePlayer.resources[giveRes] -= ratio;
    activePlayer.resources[getRes] += 1;

    const ratioLabel = ratio === 2 ? '2:1 Spezial-Hafen' : ratio === 3 ? (state.teamHasLongestRoad ? '3:1 Handelsstraße' : '3:1 See-Hafen') : '4:1 Standard-Bank';
    this.addLog(state, `${activePlayer.name} tauscht ${ratio}x ${giveRes} gegen 1x ${getRes} (${ratioLabel}).`, 'info');
    return { success: true };
  }

  public getPlayerTradeRatio(board: BoardState, playerColor: PlayerColor, res: ResourceType, teamHasLongestRoad: boolean = false): number {
    let bestRatio = teamHasLongestRoad ? 3 : 4;
    for (const vKey of Object.keys(board.vertices)) {
      const v = board.vertices[vKey];
      if (v.building && v.harbor && v.building.ownerColor === playerColor) {
        if (v.harbor.type === res) {
          return 2;
        }
        if (v.harbor.type === 'generic') {
          bestRatio = Math.min(bestRatio, 3);
        }
      }
    }
    return bestRatio;
  }

  // Teammate Resource Gifting
  public giftResource(roomCode: string, playerId: string, targetPlayerId: string, resource: ResourceType): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Rohstoffe können nur in der Aktionsphase verschenkt werden.' };
    }

    const targetPlayer = this.getPlayer(state, targetPlayerId);
    if (!targetPlayer) return { success: false, message: 'Zielspieler nicht gefunden.' };
    if (targetPlayer.id === activePlayer.id) return { success: false, message: 'Du kannst dir nicht selbst Rohstoffe schenken.' };

    if (activePlayer.tradesRemainingThisTurn <= 0) {
      const cap = this.calculateTradeCapacity(activePlayer, state);
      return {
        success: false,
        message: `Du hast dein Schenk-Limit für diesen Zug erreicht (Kapazität: ${cap} Schenkung(en) pro Zug basierend auf deinen Siedlungen/Städten).`
      };
    }

    if (activePlayer.resources[resource] < 1) {
      return { success: false, message: `Nicht genügend ${resource} vorhanden.` };
    }

    activePlayer.resources[resource] -= 1;
    targetPlayer.resources[resource] += 1;
    activePlayer.tradesRemainingThisTurn -= 1;

    this.addLog(state, `${activePlayer.name} schenkt 1x ${resource} an ${targetPlayer.name} (${activePlayer.tradesRemainingThisTurn} Schenkung(en) verbleiben diesen Zug).`, 'info');
    return { success: true };
  }

  // Propose a Trade or Resource Request
  public proposeTrade(
    roomCode: string,
    playerId: string,
    type: TradeProposalType,
    targetPlayerId: string | null,
    wantedResource: ResourceType,
    wantedAmount: number = 1,
    giveResource?: ResourceType,
    giveAmount: number = 1
  ): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Handeln und Anfragen sind nur in der Aktionsphase möglich.' };
    }

    if (type === 'trade') {
      if (!giveResource) {
        return { success: false, message: 'Bitte gib an, welchen Rohstoff du anbietest.' };
      }
      if (giveResource === wantedResource) {
        return { success: false, message: 'Angebotener und gewünschter Rohstoff müssen unterschiedlich sein.' };
      }
      if (activePlayer.resources[giveResource] < giveAmount) {
        return { success: false, message: `Du besitzt nicht genügend ${giveResource} (${activePlayer.resources[giveResource]}/${giveAmount}).` };
      }
    }

    if (targetPlayerId && targetPlayerId === activePlayer.id) {
      return { success: false, message: 'Du kannst nicht mit dir selbst handeln.' };
    }

    const proposalId = 'trade_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const proposal: ActiveTradeProposal = {
      id: proposalId,
      type,
      senderId: activePlayer.id,
      senderName: activePlayer.name,
      senderColor: activePlayer.color,
      targetPlayerId: targetPlayerId || null,
      giveResource,
      giveAmount: type === 'trade' ? giveAmount : undefined,
      wantedResource,
      wantedAmount,
      createdAt: Date.now()
    };

    state.activeTradeProposal = proposal;

    const targetName = targetPlayerId
      ? (state.players.find(p => p.id === targetPlayerId)?.name || 'Mitspieler')
      : 'alle Mitspieler';

    if (type === 'trade') {
      this.addLog(
        state,
        `Tauschangebot von ${activePlayer.name}: Bietet ${giveAmount}x ${giveResource} für ${wantedAmount}x ${wantedResource} an ${targetName}.`,
        'info'
      );
    } else {
      this.addLog(
        state,
        `Rohstoff-Anfrage: ${activePlayer.name} fragt dringend nach ${wantedAmount}x ${wantedResource} bei ${targetName} an!`,
        'alert'
      );
    }

    // Check if Bot can immediately respond or help
    this.evaluateBotTradeProposal(state, proposal);

    return { success: true };
  }

  // Evaluate Bot trade / request response
  private evaluateBotTradeProposal(state: GameRoomState, proposal: ActiveTradeProposal) {
    const targetBots = state.players.filter(p => p.isBot && p.id !== proposal.senderId && (!proposal.targetPlayerId || proposal.targetPlayerId === p.id));
    if (targetBots.length === 0) return;

    const helperBot = targetBots.find(b => b.resources[proposal.wantedResource] >= proposal.wantedAmount);
    if (!helperBot) {
      if (proposal.targetPlayerId && targetBots[0]) {
        setTimeout(() => {
          if (state.activeTradeProposal?.id === proposal.id) {
            this.addLog(state, `${targetBots[0].name} (Bot) hat leider kein(e) ${proposal.wantedResource}.`, 'info');
            state.activeTradeProposal = null;
            this.notifyStateChanged(state.roomCode);
          }
        }, 900);
      }
      return;
    }

    // Bot accepts/fulfills after short natural thinking pause
    setTimeout(() => {
      if (state.activeTradeProposal?.id !== proposal.id) return;
      this.respondTrade(state.roomCode, helperBot.id, proposal.id, 'accept');
      this.notifyStateChanged(state.roomCode);
    }, 1000);
  }

  // Respond to a Trade Proposal (Accept or Decline)
  public respondTrade(
    roomCode: string,
    responderId: string,
    proposalId: string,
    action: 'accept' | 'decline'
  ): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const proposal = state.activeTradeProposal;
    if (!proposal || proposal.id !== proposalId) {
      return { success: false, message: 'Dieses Tauschangebot ist nicht mehr aktiv.' };
    }

    const responder = this.getPlayer(state, responderId);
    if (!responder) {
      return { success: false, message: 'Spieler nicht gefunden.' };
    }

    if (proposal.senderId === responder.id) {
      return { success: false, message: 'Du kannst dein eigenes Angebot nicht annehmen oder ablehnen.' };
    }

    if (proposal.targetPlayerId && proposal.targetPlayerId !== responder.id) {
      return { success: false, message: 'Dieses Angebot war an einen anderen Mitspieler gerichtet.' };
    }

    const sender = state.players.find(p => p.id === proposal.senderId);
    if (!sender) {
      return { success: false, message: 'Spieler nicht gefunden.' };
    }

    if (action === 'decline') {
      this.addLog(state, `${responder.name} lehnt das Angebot von ${sender.name} ab.`, 'info');
      state.activeTradeProposal = null;
      return { success: true };
    }

    // Action is 'accept'
    if (responder.resources[proposal.wantedResource] < proposal.wantedAmount) {
      return {
        success: false,
        message: `${responder.name} besitzt nicht genügend ${proposal.wantedResource} (${responder.resources[proposal.wantedResource]}/${proposal.wantedAmount}).`
      };
    }

    if (proposal.type === 'trade') {
      const giveRes = proposal.giveResource!;
      const giveAmt = proposal.giveAmount || 1;
      if (sender.resources[giveRes] < giveAmt) {
        state.activeTradeProposal = null;
        return { success: false, message: `${sender.name} besitzt das angebotene ${giveRes} nicht mehr.` };
      }

      sender.resources[giveRes] -= giveAmt;
      responder.resources[giveRes] += giveAmt;
      responder.resources[proposal.wantedResource] -= proposal.wantedAmount;
      sender.resources[proposal.wantedResource] += proposal.wantedAmount;

      this.addLog(
        state,
        `Tausch vollzogen! ${sender.name} tauscht ${giveAmt}x ${giveRes} mit ${responder.name} gegen ${proposal.wantedAmount}x ${proposal.wantedResource}.`,
        'info'
      );
    } else {
      // type === 'request' (Aid given)
      responder.resources[proposal.wantedResource] -= proposal.wantedAmount;
      sender.resources[proposal.wantedResource] += proposal.wantedAmount;

      this.addLog(
        state,
        `Gemeinschaftshilfe! ${responder.name} hilft aus und übergibt ${proposal.wantedAmount}x ${proposal.wantedResource} an ${sender.name}.`,
        'info'
      );
    }

    state.activeTradeProposal = null;
    return { success: true };
  }

  // Cancel trade proposal by sender
  public cancelTrade(
    roomCode: string,
    senderId: string,
    proposalId: string
  ): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const proposal = state.activeTradeProposal;
    if (!proposal || proposal.id !== proposalId) {
      return { success: false, message: 'Kein aktives Angebot gefunden.' };
    }

    const caller = this.getPlayer(state, senderId);
    if (!caller || proposal.senderId !== caller.id) {
      return { success: false, message: 'Nur der Ersteller kann das Angebot zurückziehen.' };
    }

    state.activeTradeProposal = null;
    this.addLog(state, `${proposal.senderName} zieht das Angebot zurück.`, 'info');
    return { success: true };
  }

  // End active player's turn
  public endTurn(roomCode: string, playerId: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (!this.isPlayerActive(state, playerId)) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Zug kann in dieser Phase nicht beendet werden.' };
    }

    // Clear any pending trade proposals
    state.activeTradeProposal = null;

    // Advance to next player
    state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;

    // Check if full round completed (all players took a turn)
    if (state.activePlayerIndex === 0) {
      const isGameOver = this.processRoundEnd(state);
      if (isGameOver) {
        return { success: true };
      }
    }

    // Ready next player
    const nextPlayer = state.players[state.activePlayerIndex];
    nextPlayer.tradesRemainingThisTurn = this.calculateTradeCapacity(nextPlayer, state);
    state.phase = 'TURN_DICE';

    this.addLog(state, `Zug beendet. ${nextPlayer.name} ist am Zug.`, 'info');

    // If next player is bot, trigger bot turn
    if (nextPlayer.isBot) {
      setTimeout(() => this.executeBotTurn(roomCode, nextPlayer.id), 1200);
    }

    return { success: true };
  }

  // End of full round: Robber patrol + D6 Quest Countdown
  private processRoundEnd(state: GameRoomState): boolean {
    state.roundNumber += 1;
    this.addLog(state, `=== RUNDE ${state.roundNumber} STARTET ===`, 'info');

    // 1. Robber Patrol
    if ((state.robberStunnedRounds ?? 0) > 0) {
      state.robberStunnedRounds = (state.robberStunnedRounds ?? 0) - 1;
      this.addLog(state, 'Ritterwache: Der überwältigte Räuber ist betäubt und setzt seine Patrouille aus!', 'info');
    } else {
      // If Largest Army active: moves only on even rounds
      const shouldRobberPatrol = !state.teamHasLargestArmy || (state.roundNumber % 2 === 0);
      if (shouldRobberPatrol) {
        this.patrolRobberToNeighbor(state);
      } else {
        this.addLog(state, 'Ritterwache hält den Räuber diese Runde auf!', 'info');
      }
    }

    // 2. D6 Quest Timers decrement
    for (const slot of state.questSlots) {
      if (slot.isCompleted) continue;

      slot.d6Timer -= 1;
      this.addLog(state, `Quest-Timer "${slot.title}": W6 fällt auf ${slot.d6Timer}.`, 'quest');

      if (slot.d6Timer <= 0) {
        slot.isFailed = true;
        state.failedQuestsCount += 1;
        this.addLog(state, `FEHLSCHLAG: Quest "${slot.title}" ist abgelaufen! (${state.failedQuestsCount}/4 gescheitert)`, 'alert');

        if (state.failedQuestsCount >= 4) {
          state.phase = 'GAME_OVER_DEFEAT';
          state.gameStats = this.buildGameEndStats(state);
          this.addLog(state, 'NIEDERLAGE: 4 Quests gescheitert! Der Räuber hat Catan überrannt.', 'alert');
          return true;
        }

        // Draw next tier quest in this slot
        const nextTier = Math.min(6, slot.tier + 1);
        const activeTitles = state.questSlots.filter(s => s.slotIndex !== slot.slotIndex).map(s => s.title);
        state.questSlots[slot.slotIndex] = createQuestSlot(slot.slotIndex, nextTier, state.teamHasLongestRoad, activeTitles);
      }
    }
    return false;
  }

  private calculateTradeCapacity(player: Player, state: GameRoomState): number {
    let points = 0;
    for (const vKey of Object.keys(state.board.vertices)) {
      const b = state.board.vertices[vKey].building;
      if (b && b.ownerColor === player.color) {
        points += b.type === 'city' ? 2 : 1;
      }
    }
    const roadBonus = state.teamHasLongestRoad ? 1 : 0;
    return Math.max(1, points) + roadBonus;
  }

  private updateLongestRoad(state: GameRoomState) {
    // Check total team road network
    const totalRoads = Object.values(state.board.edges).filter(e => e.road !== null).length;
    state.longestRoadLength = totalRoads;

    if (totalRoads >= 7 && !state.teamHasLongestRoad) {
      state.teamHasLongestRoad = true;
      const activePlayer = state.players[state.activePlayerIndex];
      if (activePlayer) {
        activePlayer.tradesRemainingThisTurn += 1;
      }
      this.addLog(state, 'MEILENSTEIN: Längste Handelsstraße erreicht (>= 7 Straßen)! +3 Siegpunkte für das Team, +1 Schenkung pro Zug, 3:1 Bankhandel und +1 W6-Timer!', 'alert');
      this.checkTeamVictory(state);
    }
  }

  // Evaluate vertex value for settlement placement: Red numbers (6, 8), pips, team diversification & expansion
  private evaluateVertexForSettlement(state: GameRoomState, vertexId: string, bot: Player, isSetup: boolean = false): number {
    const vertex = state.board.vertices[vertexId];
    if (!vertex || vertex.building !== null) return -9999;

    // Check distance rule
    const hasAdjBuilding = vertex.adjacentVertexIds.some(adjId => Boolean(state.board.vertices[adjId]?.building));
    if (hasAdjBuilding) return -9999;

    const touchingHexes = vertex.adjacentHexIds
      .map(hId => state.board.hexes.find(h => h.id === hId))
      .filter((h): h is HexTile => Boolean(h));

    if (touchingHexes.length === 0 || touchingHexes.every(h => h.type === 'water')) return -9999;

    // 1. Pip score & Red Numbers (6, 8)
    let pipScore = 0;
    let redNumberBonus = 0;
    const vertexResources: ResourceType[] = [];

    touchingHexes.forEach(h => {
      if (h.type !== 'water' && h.type !== 'desert') {
        const res = h.type as ResourceType;
        vertexResources.push(res);
        const pips = h.diceNumber ? (6 - Math.abs(7 - h.diceNumber)) : 0;
        pipScore += pips * 4;
        if (h.diceNumber === 6 || h.diceNumber === 8) {
          redNumberBonus += 14; // Strong bonus for high-frequency red tiles
        } else if (h.diceNumber === 5 || h.diceNumber === 9) {
          pipScore += 6; // Boost for 5 and 9
        }
      }
    });

    // 2. Resource Diversity at this vertex
    const distinctRes = new Set(vertexResources);
    let diversityBonus = 0;
    if (distinctRes.size >= 3) diversityBonus += 18;
    else if (distinctRes.size === 2) diversityBonus += 8;

    // Key engine combinations
    if (distinctRes.has('wood') && distinctRes.has('clay')) diversityBonus += 12; // Roads/settlements engine
    if (distinctRes.has('ore') && distinctRes.has('wheat')) diversityBonus += 12; // Cities/knights engine

    // 3. Team resource needs (Scarcity & Coverage)
    const teamResCoverage: Record<ResourceType, number> = { wood: 0, clay: 0, sheep: 0, wheat: 0, ore: 0 };
    for (const v of Object.values(state.board.vertices)) {
      if (v.building) {
        for (const hId of v.adjacentHexIds) {
          const h = state.board.hexes.find(hx => hx.id === hId);
          if (h && h.type !== 'water' && h.type !== 'desert') {
            teamResCoverage[h.type as ResourceType] += 1;
          }
        }
      }
    }

    let teamNeedBonus = 0;
    distinctRes.forEach(res => {
      if (teamResCoverage[res] === 0) {
        teamNeedBonus += 30; // HUGE bonus for covering resources the team currently lacks
      } else if (teamResCoverage[res] === 1) {
        teamNeedBonus += 10;
      }
    });

    // 4. Harbor synergy
    let harborBonus = 0;
    if (vertex.harbor) {
      if (vertex.harbor.type !== 'generic' && distinctRes.has(vertex.harbor.type as ResourceType)) {
        harborBonus += 20; // 2:1 matching harbor
      } else if (vertex.harbor.type === 'generic') {
        harborBonus += 10; // 3:1 harbor
      }
    }

    // 5. Room to expand
    const freeOutgoingEdges = vertex.adjacentEdgeIds.filter(eId => {
      const e = state.board.edges[eId];
      return e && e.road === null && !e.isWaterEdge;
    }).length;

    let expansionBonus = 0;
    if (freeOutgoingEdges >= 3) expansionBonus += 10;
    else if (freeOutgoingEdges === 2) expansionBonus += 4;
    else if (freeOutgoingEdges <= 1) expansionBonus -= 15;

    // Check potential settlement spots 2 steps away
    let reachableSpotBonus = 0;
    vertex.adjacentVertexIds.forEach(adjId => {
      const adjV = state.board.vertices[adjId];
      if (adjV) {
        adjV.adjacentVertexIds.forEach(twoStepId => {
          if (twoStepId !== vertexId) {
            const twoStepV = state.board.vertices[twoStepId];
            if (twoStepV && twoStepV.building === null) {
              const isBlocked = twoStepV.adjacentVertexIds.some(neighborId => Boolean(state.board.vertices[neighborId]?.building));
              if (!isBlocked) reachableSpotBonus += 4;
            }
          }
        });
      }
    });

    return pipScore + redNumberBonus + diversityBonus + teamNeedBonus + harborBonus + expansionBonus + Math.min(16, reachableSpotBonus);
  }

  // Evaluate setup road direction towards open valuable land, 6/8 tiles and away from dead ends
  private evaluateEdgeForSetupRoad(state: GameRoomState, edgeId: string, setupVertexId: string): number {
    const edge = state.board.edges[edgeId];
    if (!edge || edge.road !== null || edge.isWaterEdge) return -9999;

    const targetVertexId = edge.vertex1Id === setupVertexId ? edge.vertex2Id : edge.vertex1Id;
    const targetVertex = state.board.vertices[targetVertexId];
    if (!targetVertex) return -9999;

    let score = 0;

    // 1. Open directions from targetVertex
    const outgoingEdges = targetVertex.adjacentEdgeIds.filter(eId => {
      const e = state.board.edges[eId];
      return e && e.id !== edgeId && e.road === null && !e.isWaterEdge;
    });
    score += outgoingEdges.length * 8;
    if (outgoingEdges.length === 0) score -= 30; // Dead end

    // 2. Reachable settlement spots from targetVertex (distance 2 from setupVertex)
    targetVertex.adjacentVertexIds.forEach(v2Id => {
      if (v2Id !== setupVertexId) {
        const v2 = state.board.vertices[v2Id];
        if (v2 && v2.building === null) {
          const hasAdjBuilding = v2.adjacentVertexIds.some(adjId => Boolean(state.board.vertices[adjId]?.building));
          if (!hasAdjBuilding) {
            const touching = v2.adjacentHexIds.map(hId => state.board.hexes.find(h => h.id === hId)).filter(Boolean);
            if (touching.length > 0 && !touching.every(h => h?.type === 'water')) {
              let spotScore = 15;
              touching.forEach(h => {
                if (h && h.type !== 'water' && h.type !== 'desert') {
                  if (h.diceNumber === 6 || h.diceNumber === 8) spotScore += 10;
                  else if (h.diceNumber) spotScore += (6 - Math.abs(7 - h.diceNumber)) * 2;
                }
              });
              score += spotScore;
            }
          }
        }
      }
    });

    // 3. Exploring fog / new hexes
    const newlyDiscovered = edge.adjacentHexIds
      .map(hId => state.board.hexes.find(h => h.id === hId))
      .filter(h => h && !h.isDiscovered);
    if (newlyDiscovered.length > 0) {
      score += 15;
    }

    // 4. Harbor on targetVertex
    if (targetVertex.harbor) {
      score += 10;
    }

    return score;
  }

  // Smart Setup Settlement Placement
  private executeBotSetupTurn(roomCode: string, botId: string) {
    const state = this.getRoom(roomCode);
    if (!state || state.players[state.activePlayerIndex]?.id !== botId) return;
    if (state.phase !== 'SETUP_SETTLEMENT') return;

    const bot = state.players.find(p => p.id === botId);
    if (!bot) return;

    const validVertices: Array<{ id: string; score: number }> = [];
    for (const [vId, vertex] of Object.entries(state.board.vertices)) {
      if (vertex.building !== null) continue;

      const score = this.evaluateVertexForSettlement(state, vId, bot, true);
      if (score > -9000) {
        validVertices.push({ id: vId, score });
      }
    }

    validVertices.sort((a, b) => b.score - a.score);
    const chosen = validVertices[0] || { id: Object.keys(state.board.vertices)[0] };

    this.buildSettlement(roomCode, botId, chosen.id);
    this.notifyStateChanged(roomCode);
  }

  // Smart Setup Road Direction
  private executeBotSetupRoad(roomCode: string, botId: string, vertexId: string) {
    const state = this.getRoom(roomCode);
    if (!state || state.players[state.activePlayerIndex]?.id !== botId) return;
    if (state.phase !== 'SETUP_ROAD') return;

    const vertex = state.board.vertices[vertexId];
    if (!vertex) return;

    const candidateEdges = vertex.adjacentEdgeIds
      .map(eId => ({ edge: state.board.edges[eId], id: eId }))
      .filter((e): e is { edge: Edge; id: string } => Boolean(e.edge && e.edge.road === null && !e.edge.isWaterEdge));

    if (candidateEdges.length === 0) {
      const anyEdge = vertex.adjacentEdgeIds.find(eId => state.board.edges[eId]?.road === null);
      if (anyEdge) {
        this.buildRoad(roomCode, botId, anyEdge);
        this.notifyStateChanged(roomCode);
      }
      return;
    }

    const scoredEdges = candidateEdges.map(({ id }) => ({
      id,
      score: this.evaluateEdgeForSetupRoad(state, id, vertexId)
    }));

    scoredEdges.sort((a, b) => b.score - a.score);
    const chosenEdgeId = scoredEdges[0].id;

    this.buildRoad(roomCode, botId, chosenEdgeId);
    this.notifyStateChanged(roomCode);
  }

  // Intelligent Bot Turn Execution
  private executeBotTurn(roomCode: string, botId: string) {
    const state = this.getRoom(roomCode);
    if (!state || state.players[state.activePlayerIndex]?.id !== botId) return;

    // 1. Roll dice if in TURN_DICE
    if (state.phase === 'TURN_DICE') {
      this.rollDice(roomCode, botId);
      this.notifyStateChanged(roomCode);
    }

    if (state.phase !== 'TURN_ACTIONS') {
      return;
    }

    const bot = state.players.find(p => p.id === botId);
    if (!bot) return;

    // 2. DEFENSE: Check if Robber threatens team settlements and play/recruit Knight
    const robberHex = state.board.hexes.find(h => h.id === state.board.robberHexId);
    if (robberHex) {
      const touchesTeamBuilding = Object.values(state.board.vertices).some(
        v => v.building && v.adjacentHexIds.includes(robberHex.id)
      );
      const isHighValue = robberHex.diceNumber === 6 || robberHex.diceNumber === 8 || robberHex.diceNumber === 5 || robberHex.diceNumber === 9;

      if (touchesTeamBuilding && (isHighValue || (robberHex.diceNumber !== null && state.players.reduce((sum, p) => sum + p.knightsPlayed, 0) === 0))) {
        if (bot.role === 'captain') {
          this.playKnightCard(roomCode, botId);
          this.notifyStateChanged(roomCode);
        } else if (bot.resources.ore >= 1 && bot.resources.sheep >= 1 && bot.resources.wheat >= 1) {
          this.playKnightCard(roomCode, botId);
          this.notifyStateChanged(roomCode);
        }
      }
    }

    // 3. TIME-CRITICAL QUESTS: Prioritize saving quests with low timers (<= 2) or close to completion
    this.botHandleQuests(roomCode, botId, true);
    this.notifyStateChanged(roomCode);

    // 4. ENGINE BUILDING: Cities & Settlements
    // If a BUILD_SETTLEMENTS quest is active, prioritize settlements first; otherwise cities for double production
    const hasSettlementQuest = state.questSlots.some(s => !s.isCompleted && !s.isFailed && s.type === 'BUILD_SETTLEMENTS');
    if (hasSettlementQuest) {
      this.botTryBuildSettlement(roomCode, botId);
      this.notifyStateChanged(roomCode);
      this.botTryUpgradeCity(roomCode, botId);
      this.notifyStateChanged(roomCode);
    } else {
      this.botTryUpgradeCity(roomCode, botId);
      this.notifyStateChanged(roomCode);
      this.botTryBuildSettlement(roomCode, botId);
      this.notifyStateChanged(roomCode);
    }

    // 6. ROAD EXPANSION: Build towards high-value spots or fog
    this.botTryBuildRoad(roomCode, botId);
    this.notifyStateChanged(roomCode);

    // 7. REMAINING QUESTS: Deposit spare resources into open quests
    this.botHandleQuests(roomCode, botId, false);
    this.notifyStateChanged(roomCode);

    // 8. End Turn cleanly
    setTimeout(() => {
      const currentState = this.getRoom(roomCode);
      if (
        currentState &&
        currentState.phase === 'TURN_ACTIONS' &&
        currentState.players[currentState.activePlayerIndex]?.id === botId
      ) {
        this.endTurn(roomCode, botId);
        this.notifyStateChanged(roomCode);
      }
    }, 1200);
  }

  // Handle Quests with Urgency Scoring and Trade Assistance
  private botHandleQuests(roomCode: string, botId: string, onlyUrgent: boolean = false) {
    const state = this.getRoom(roomCode);
    if (!state) return;
    const bot = state.players.find(p => p.id === botId);
    if (!bot) return;

    const activeSlots = state.questSlots
      .map((slot, slotIndex) => ({ slot, slotIndex }))
      .filter(({ slot }) => !slot.isCompleted && !slot.isFailed);

    const scoredSlots = activeSlots.map(entry => {
      const { slot } = entry;
      let urgency = 100 - slot.d6Timer * 10;
      if (slot.d6Timer <= 2) urgency += 500; // Critical
      else if (slot.d6Timer === 3) urgency += 200;

      let neededCount = 0;
      if (slot.type === 'DELIVER_RESOURCES' && slot.requiredResources) {
        for (const [r, req] of Object.entries(slot.requiredResources)) {
          const resKey = r as ResourceType;
          const deposited = slot.depositedResources[resKey] || 0;
          neededCount += Math.max(0, (req || 0) - deposited);
        }
        if (neededCount <= 2) urgency += 150; // Close to victory point
      }

      return { ...entry, urgency, neededCount };
    });

    // Check if bot is close to building a City or Settlement so it doesn't drain needed materials
    const isBuilder = bot.role === 'builder';
    const cityOreNeeded = isBuilder ? 2 : 3;
    const cityWheatNeeded = isBuilder ? 1 : 2;
    const isSavingForCity = (bot.resources.ore >= cityOreNeeded - 1 && bot.resources.wheat >= cityWheatNeeded - 1 && bot.remainingPieces.cities > 0);
    const settlementResCount = (['wood', 'clay', 'sheep', 'wheat'] as ResourceType[]).filter(r => bot.resources[r] >= 1).length;
    const isSavingForSettlement = (settlementResCount >= (isBuilder ? 2 : 3) && bot.remainingPieces.settlements > 0);

    for (const { slot, slotIndex } of scoredSlots) {
      // Phase 3 only handles emergency quests on the brink of timeout (timer <= 2)
      // All other quests are handled in Phase 7 AFTER settlements and cities are built!
      if (onlyUrgent && slot.d6Timer > 2) continue;

      if (slot.type === 'DELIVER_RESOURCES' && slot.requiredResources) {
        let totalStillNeededForQuest = 0;
        for (const [r, req] of Object.entries(slot.requiredResources)) {
          const res = r as ResourceType;
          const currentDep = slot.depositedResources[res] || 0;
          totalStillNeededForQuest += Math.max(0, (req || 0) - currentDep);
        }

        for (const [r, req] of Object.entries(slot.requiredResources)) {
          const res = r as ResourceType;
          const currentDep = slot.depositedResources[res] || 0;
          const stillNeeded = (req || 0) - currentDep;

          if (stillNeeded > 0 && bot.resources[res] > 0) {
            // Check building reservation in non-urgent mode (Phase 7):
            if (!onlyUrgent && slot.d6Timer > 2) {
              const finishesQuest = (totalStillNeededForQuest <= 1);
              if (!finishesQuest) {
                // If saving for city, protect ore and wheat
                if (isSavingForCity && (res === 'ore' || res === 'wheat')) {
                  const safeKeep = res === 'ore' ? cityOreNeeded : cityWheatNeeded;
                  if (bot.resources[res] <= safeKeep) continue;
                }
                // If saving for settlement, protect 1 of each settlement resource
                if (isSavingForSettlement && ['wood', 'clay', 'sheep', 'wheat'].includes(res)) {
                  if (bot.resources[res] <= 1) continue;
                }
              }
            }

            const amount = Math.min(bot.resources[res], stillNeeded);
            this.depositToQuest(roomCode, botId, slotIndex, res, amount);
            totalStillNeededForQuest -= amount;
          }
        }

        // If quest is critical (timer <= 2) and bot is missing a resource, trade surplus to save it
        if (slot.d6Timer <= 2) {
          for (const [r, req] of Object.entries(slot.requiredResources)) {
            const neededRes = r as ResourceType;
            const currentDep = slot.depositedResources[neededRes] || 0;
            const stillNeeded = (req || 0) - currentDep;

            if (stillNeeded > 0 && bot.resources[neededRes] === 0) {
              const resKeys: ResourceType[] = ['wood', 'clay', 'sheep', 'wheat', 'ore'];
              for (const giveRes of resKeys) {
                if (giveRes === neededRes) continue;
                const ratio = this.getPlayerTradeRatio(state.board, bot.color, giveRes, state.teamHasLongestRoad);
                if (bot.resources[giveRes] >= ratio) {
                  const tradeRes = this.tradeWithBank(roomCode, botId, giveRes, neededRes);
                  if (tradeRes.success && bot.resources[neededRes] > 0) {
                    this.depositToQuest(roomCode, botId, slotIndex, neededRes, 1);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // City Upgrade Strategy
  private botTryUpgradeCity(roomCode: string, botId: string) {
    const state = this.getRoom(roomCode);
    if (!state) return;
    const bot = state.players.find(p => p.id === botId);
    if (!bot) return;

    let citiesBuilt = 0;
    while (citiesBuilt < 2) {
      const isBuilder = bot.role === 'builder';
      const discountRes: ResourceType = bot.resources.ore < 3 ? 'ore' : 'wheat';
      const neededOre = isBuilder && discountRes === 'ore' ? 2 : 3;
      const neededWheat = isBuilder && discountRes === 'wheat' ? 1 : 2;

      // Check if surplus trade can unlock city
      if (bot.resources.ore < neededOre || bot.resources.wheat < neededWheat) {
        const resKeys: ResourceType[] = ['wood', 'clay', 'sheep', 'wheat', 'ore'];
        for (const giveRes of resKeys) {
          const ratio = this.getPlayerTradeRatio(state.board, bot.color, giveRes, state.teamHasLongestRoad);
          const safeKeep = (giveRes === 'ore' ? neededOre : (giveRes === 'wheat' ? neededWheat : 0));
          if (bot.resources[giveRes] >= ratio + safeKeep) {
            if (bot.resources.ore < neededOre && giveRes !== 'ore') {
              this.tradeWithBank(roomCode, botId, giveRes, 'ore');
              break;
            } else if (bot.resources.wheat < neededWheat && giveRes !== 'wheat') {
              this.tradeWithBank(roomCode, botId, giveRes, 'wheat');
              break;
            }
          }
        }
      }

      if (bot.resources.ore >= neededOre && bot.resources.wheat >= neededWheat) {
        const candidateSettlements: Array<{ vId: string; score: number }> = [];
        for (const [vId, vertex] of Object.entries(state.board.vertices)) {
          if (vertex.building && vertex.building.type === 'settlement') {
            const owner = state.players.find(p => p.color === vertex.building?.ownerColor);
            if (owner && owner.remainingPieces.cities > 0) {
              let vScore = (owner.id === bot.id) ? 15 : 0;
              vertex.adjacentHexIds.forEach(hId => {
                const h = state.board.hexes.find(hx => hx.id === hId);
                if (h && h.type !== 'water' && h.type !== 'desert') {
                  if (h.diceNumber === 6 || h.diceNumber === 8) vScore += 25;
                  else if (h.diceNumber) vScore += (6 - Math.abs(7 - h.diceNumber)) * 4;
                }
              });
              candidateSettlements.push({ vId, score: vScore });
            }
          }
        }

        candidateSettlements.sort((a, b) => b.score - a.score);
        if (candidateSettlements.length > 0) {
          const buildRes = this.buildCity(roomCode, botId, candidateSettlements[0].vId, isBuilder ? discountRes : undefined);
          if (buildRes.success) {
            citiesBuilt++;
            continue;
          }
        }
      }
      break;
    }
  }

  // Settlement Building Strategy
  private botTryBuildSettlement(roomCode: string, botId: string) {
    const state = this.getRoom(roomCode);
    if (!state) return;
    const bot = state.players.find(p => p.id === botId);
    if (!bot) return;

    let settlementsBuilt = 0;
    while (settlementsBuilt < 2) {
      // Recipient: bot itself if it has settlements left, otherwise teammate with remaining settlements
      const recipient = bot.remainingPieces.settlements > 0
        ? bot
        : state.players.find(p => p.remainingPieces.settlements > 0);
      if (!recipient) break;

      const isBuilder = bot.role === 'builder';
      const req: ResourceCount = { wood: 1, clay: 1, sheep: 1, wheat: 1, ore: 0 };
      let discountRes: ResourceType | undefined;
      if (isBuilder) {
        discountRes = (['wood', 'clay', 'sheep', 'wheat'] as ResourceType[]).find(r => bot.resources[r] === 0) || 'wood';
        req[discountRes]--;
      }

      const settlementResources: ResourceType[] = ['wood', 'clay', 'sheep', 'wheat'];

      // Check if surplus trading can unlock settlement
      for (const neededRes of settlementResources) {
        if (bot.resources[neededRes] < req[neededRes]) {
          const candidateGive: ResourceType[] = ['ore', 'sheep', 'wheat', 'wood', 'clay'];
          for (const giveRes of candidateGive) {
            if (giveRes === neededRes) continue;
            const ratio = this.getPlayerTradeRatio(state.board, bot.color, giveRes, state.teamHasLongestRoad);
            const safeKeep = req[giveRes] || 0;
            if (bot.resources[giveRes] >= ratio + safeKeep) {
              this.tradeWithBank(roomCode, botId, giveRes, neededRes);
              break;
            }
          }
        }
      }

      const canAfford = settlementResources.every(r => bot.resources[r] >= req[r]);
      if (!canAfford) break;

      const validSpots: Array<{ id: string; score: number }> = [];
      for (const [vId, vertex] of Object.entries(state.board.vertices)) {
        if (vertex.building !== null) continue;

        const hasAdjBuilding = vertex.adjacentVertexIds.some(adjId => Boolean(state.board.vertices[adjId]?.building));
        if (hasAdjBuilding) continue;

        const hasRoad = vertex.adjacentEdgeIds.some(eId => Boolean(state.board.edges[eId]?.road));
        if (!hasRoad) continue;

        const score = this.evaluateVertexForSettlement(state, vId, bot, false);
        if (score > 0) {
          validSpots.push({ id: vId, score });
        }
      }

      validSpots.sort((a, b) => b.score - a.score);
      if (validSpots.length > 0) {
        const buildRes = this.buildSettlement(roomCode, botId, validSpots[0].id, recipient.color, discountRes);
        if (buildRes.success) {
          settlementsBuilt++;
          continue;
        }
      }
      break;
    }
  }

  // Road Building Strategy
  private botTryBuildRoad(roomCode: string, botId: string) {
    const state = this.getRoom(roomCode);
    if (!state) return;
    const bot = state.players.find(p => p.id === botId);
    if (!bot) return;

    let roadsBuilt = 0;
    while (roadsBuilt < 3 && bot.remainingPieces.roads > 0) {
      const isPioneer = bot.role === 'pioneer';
      const roadQuest = state.questSlots.find(s => !s.isCompleted && !s.isFailed && s.type === 'BUILD_ROADS');

      // Check if team has ANY valid settlement spot reachable by road
      const hasValidSettlementSpot = Object.values(state.board.vertices).some(v => {
        if (v.building !== null) return false;
        const hasAdjBuilding = v.adjacentVertexIds.some(adjId => Boolean(state.board.vertices[adjId]?.building));
        if (hasAdjBuilding) return false;
        return v.adjacentEdgeIds.some(eId => Boolean(state.board.edges[eId]?.road));
      });

      const isRoadUrgent = (roadQuest && roadQuest.d6Timer <= 3) || !hasValidSettlementSpot;
      if (isRoadUrgent) {
        if (!isPioneer && (bot.resources.wood === 0 || bot.resources.clay === 0)) {
          const needed: ResourceType = bot.resources.wood === 0 ? 'wood' : 'clay';
          for (const giveRes of ['sheep', 'wheat', 'ore'] as ResourceType[]) {
            const ratio = this.getPlayerTradeRatio(state.board, bot.color, giveRes, state.teamHasLongestRoad);
            if (bot.resources[giveRes] >= ratio) {
              this.tradeWithBank(roomCode, botId, giveRes, needed);
              break;
            }
          }
        } else if (isPioneer && bot.resources.wood === 0 && bot.resources.clay === 0) {
          for (const giveRes of ['sheep', 'wheat', 'ore'] as ResourceType[]) {
            const ratio = this.getPlayerTradeRatio(state.board, bot.color, giveRes, state.teamHasLongestRoad);
            if (bot.resources[giveRes] >= ratio) {
              this.tradeWithBank(roomCode, botId, giveRes, 'wood');
              break;
            }
          }
        }
      }

      const canAfford = isPioneer
        ? (bot.resources.wood >= 1 || bot.resources.clay >= 1)
        : (bot.resources.wood >= 1 && bot.resources.clay >= 1);

      if (!canAfford) break;

      const candidateEdges: Array<{ edgeId: string; score: number }> = [];
      for (const [eId, edge] of Object.entries(state.board.edges)) {
        if (edge.road !== null || edge.isWaterEdge) continue;

        const v1 = state.board.vertices[edge.vertex1Id];
        const v2 = state.board.vertices[edge.vertex2Id];
        if (!v1 || !v2) continue;

        const touchesBuilding = Boolean(v1.building) || Boolean(v2.building);
        const touchesRoad =
          v1.adjacentEdgeIds.some(adjEId => adjEId !== eId && Boolean(state.board.edges[adjEId]?.road)) ||
          v2.adjacentEdgeIds.some(adjEId => adjEId !== eId && Boolean(state.board.edges[adjEId]?.road));

        if (touchesBuilding || touchesRoad) {
          let edgeScore = 10;
          for (const v of [v1, v2]) {
            if (v.building === null) {
              const hasAdjBuilding = v.adjacentVertexIds.some(adjId => Boolean(state.board.vertices[adjId]?.building));
              if (!hasAdjBuilding) {
                // This vertex is a valid settlement spot right now!
                const settlementPotential = this.evaluateVertexForSettlement(state, v.id, bot, false);
                edgeScore += 60 + Math.max(0, settlementPotential);
              } else {
                // Stepping stone road towards distance 2
                edgeScore += 20;
              }
            }

            v.adjacentHexIds.forEach(hId => {
              const h = state.board.hexes.find(hx => hx.id === hId);
              if (h && !h.isDiscovered) edgeScore += 25;
              else if (h && h.type !== 'water' && h.type !== 'desert') {
                if (h.diceNumber === 6 || h.diceNumber === 8) edgeScore += 10;
              }
            });
          }

          candidateEdges.push({ edgeId: eId, score: edgeScore });
        }
      }

      candidateEdges.sort((a, b) => b.score - a.score);
      if (candidateEdges.length > 0) {
        const buildRes = this.buildRoad(roomCode, botId, candidateEdges[0].edgeId);
        if (buildRes.success) {
          roadsBuilt++;
          continue;
        }
      }
      break;
    }
  }

  private addLog(state: GameRoomState, message: string, type: GameLogEntry['type']) {
    state.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      message,
      type
    });
    if (state.logs.length > 50) state.logs.pop();
  }
}

export const gameManager = new GameManager();
