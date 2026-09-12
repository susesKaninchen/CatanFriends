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
  ActiveTradeProposal,
  TradeProposalType
} from './types.js';
import { generateBoard, getNextRobberLetter, getPreviousRobberLetter, ROBBER_LETTER_ORDER, exploreSurroundings, getTileTwoTilesNorth, hexToPixel } from './board.js';
import { createQuestSlot, initializeQuestSlots } from './quests.js';

export class GameManager {
  private rooms: Map<string, GameRoomState> = new Map();
  public onStateChanged?: (roomCode: string, state: GameRoomState) => void;

  public notifyStateChanged(roomCode: string) {
    const state = this.getRoom(roomCode);
    if (state && this.onStateChanged) {
      this.onStateChanged(roomCode, state);
    }
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
      targetQuestsToWin: 4,
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
    this.addLog(state, `${fullPlayer.name} ist beigetreten (${color}, ${role}).`, 'info');

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
    this.addLog(state, `${name} (Bot) wurde hinzugefügt.`, 'info');

    return { success: true, room: state };
  }

  public setPlayerReady(roomCode: string, playerId: string, isReady: boolean): boolean {
    const state = this.getRoom(roomCode);
    if (!state) return false;
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;
    player.isReady = isReady;
    return true;
  }

  public updatePlayerPreferences(roomCode: string, playerId: string, color: PlayerColor, role: PlayerRole): boolean {
    const state = this.getRoom(roomCode);
    if (!state || state.phase !== 'LOBBY') return false;

    // Verify color and role availability
    const colorTaken = state.players.some(p => p.id !== playerId && p.color === color);
    const roleTaken = state.players.some(p => p.id !== playerId && p.role === role);

    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;

    if (!colorTaken) player.color = color;
    if (!roleTaken) player.role = role;
    return true;
  }

  public startGame(roomCode: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };
    if (state.phase !== 'LOBBY') return { success: false, message: 'Spiel läuft bereits.' };

    state.phase = 'SETUP_SETTLEMENT';
    state.activePlayerIndex = 0;
    state.setupTurnIndex = 0;
    state.roundNumber = 1;
    state.lastBuiltSetupVertexId = null;

    // Reset starting piece stocks and clear starting resources (collected when placing settlement)
    state.players.forEach(p => {
      p.resources = { wood: 0, clay: 0, sheep: 0, wheat: 0, ore: 0 };
      p.remainingPieces = { roads: 30, settlements: 5, cities: 4 };
      p.tradesRemainingThisTurn = 1;
    });

    const activePlayer = state.players[0];
    this.addLog(state, 'Das Spiel hat begonnen! Gründungsphase: Jeder Spieler gründet 1 Siedlung und 1 Straße.', 'alert');
    this.addLog(state, `Gründungsphase: ${activePlayer.name} wählt eine freie Kreuzung für die Startsiedlung.`, 'info');

    if (activePlayer.isBot) {
      setTimeout(() => this.executeBotSetupTurn(roomCode, activePlayer.id), 1000);
    }

    return { success: true };
  }

  public rollDice(roomCode: string, playerId: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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
      if (hex.hasRobber) {
        this.addLog(state, `Räuber blockiert Hexfeld ${hex.letter} (${hex.type})! Keine Rohstoffe.`, 'alert');
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

    // 2. Automated Robber Movement (Cooperative AI: attacks highest-yielding team land tile)
    this.autoMoveRobber(state);
    state.phase = 'TURN_ACTIONS';
  }

  private autoMoveRobber(state: GameRoomState) {
    const candidateHexes = state.board.hexes.filter(h => h.type !== 'water' && h.id !== state.board.robberHexId);
    if (candidateHexes.length === 0) return;

    // Threat scoring: (buildings > 0 ? 100 : 0) + buildings * 10 + pips
    const scoredHexes = candidateHexes.map(hex => {
      let buildingWeight = 0;
      const touchingPlayers = new Set<Player>();

      for (const vKey of Object.keys(state.board.vertices)) {
        const v = state.board.vertices[vKey];
        if (v.adjacentHexIds.includes(hex.id) && v.building) {
          buildingWeight += (v.building.type === 'city' ? 2 : 1);
          const owner = state.players.find(p => p.color === v.building!.ownerColor);
          if (owner) touchingPlayers.add(owner);
        }
      }

      const pips = hex.diceNumber ? (6 - Math.abs(7 - hex.diceNumber)) : 0;
      const score = (buildingWeight > 0 ? 100 : 0) + (buildingWeight * 10) + pips;

      return {
        hex,
        buildingWeight,
        pips,
        score,
        touchingPlayers: Array.from(touchingPlayers)
      };
    });

    scoredHexes.sort((a, b) => b.score - a.score);
    const maxScore = scoredHexes[0].score;
    const topCandidates = scoredHexes.filter(h => h.score === maxScore);
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

    // Relocate robber
    state.board.hexes.forEach(h => { h.hasRobber = false; });
    chosen.hex.hasRobber = true;
    state.board.robberHexId = chosen.hex.id;

    // Plunder 1 card from an affected player to the bank
    const victims = chosen.touchingPlayers.filter(p => Object.values(p.resources).reduce((a, b) => a + b, 0) > 0);
    let stolenMsg = '';
    if (victims.length > 0) {
      const victim = victims[Math.floor(Math.random() * victims.length)];
      const resKeys: ResourceType[] = ['wood', 'clay', 'sheep', 'wheat', 'ore'];
      const available = resKeys.filter(r => victim.resources[r] > 0);
      if (available.length > 0) {
        const stolen = available[Math.floor(Math.random() * available.length)];
        victim.resources[stolen]--;
        stolenMsg = ` und erbeutet 1x ${stolen} von ${victim.name}!`;
      }
    }

    const numStr = chosen.hex.diceNumber ? `Zahl ${chosen.hex.diceNumber}` : 'Wüste';
    this.addLog(state, `Der Räuber überfällt automatisch das ertragreichste Feld: ${chosen.hex.type} (${numStr}, ${chosen.pips} Punkte)${stolenMsg}`, 'robber');
  }

  public moveRobber(roomCode: string, playerId: string, targetHexId: string): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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
    const currentHex = state.board.hexes.find(h => h.id === state.board.robberHexId);
    let targetHex: typeof state.board.hexes[0] | undefined;

    if (currentHex) {
      // Find neighbor land hexes
      const neighborLandHexes = state.board.hexes.filter(h => {
        if (h.type === 'water' || h.id === currentHex.id) return false;
        const dq = Math.abs(h.q - currentHex.q);
        const dr = Math.abs(h.r - currentHex.r);
        const ds = Math.abs((-h.q - h.r) - (-currentHex.q - currentHex.r));
        return Math.max(dq, dr, ds) === 1;
      });

      if (neighborLandHexes.length > 0) {
        targetHex = neighborLandHexes[Math.floor(Math.random() * neighborLandHexes.length)];
      }
    }

    if (!targetHex) {
      const landHexes = state.board.hexes.filter(h => h.type !== 'water' && h.id !== state.board.robberHexId);
      targetHex = landHexes[Math.floor(Math.random() * landHexes.length)];
    }

    if (!targetHex) return;

    state.board.hexes.forEach(h => { h.hasRobber = false; });
    targetHex.hasRobber = true;
    state.board.robberHexId = targetHex.id;

    const numStr = targetHex.diceNumber ? `Zahl ${targetHex.diceNumber}` : 'Wüste';
    this.addLog(state, `Der Räuber zieht weiter auf ${targetHex.type} (${numStr})!`, 'robber');

    // Plunder from adjacent settlements: each player loses 1 card
    const affectedOwners = new Set<PlayerColor>();
    for (const vKey of Object.keys(state.board.vertices)) {
      const vertex = state.board.vertices[vKey];
      if (vertex.adjacentHexIds.includes(targetHex.id) && vertex.building) {
        affectedOwners.add(vertex.building.ownerColor);
      }
    }

    affectedOwners.forEach(color => {
      const player = state.players.find(p => p.color === color);
      if (player) {
        const total = Object.values(player.resources).reduce((a, b) => a + b, 0);
        if (total > 0) {
          this.discardRandomCards(player, 1);
          this.addLog(state, `Räuber-Plünderung: ${player.name} verliert 1 Rohstoffkarte!`, 'robber');
        }
      }
    });
  }

  // Fremdbau: active player pays, target player receives building
  public buildRoad(roomCode: string, playerId: string, edgeId: string, targetColor?: PlayerColor): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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

    // Procedural island expansion: Reveal surroundings when building roads
    const newlyDiscovered = exploreSurroundings(state.board, edgeId);
    if (newlyDiscovered.length > 0) {
      const landCount = newlyDiscovered.filter(h => h.type !== 'water').length;
      const waterCount = newlyDiscovered.filter(h => h.type === 'water').length;
      this.addLog(state, `Entdeckung! ${landCount} neues Land und ${waterCount} Ozeanfeld(er) aufgedeckt!`, 'info');
    }

    if (isSetup) {
      state.setupTurnIndex += 1;
      if (state.setupTurnIndex < state.players.length) {
        state.activePlayerIndex = state.setupTurnIndex;
        state.phase = 'SETUP_SETTLEMENT';
        state.lastBuiltSetupVertexId = null;
        const nextPlayer = state.players[state.activePlayerIndex];
        this.addLog(state, `Gründungsphase: ${nextPlayer.name} ist an der Reihe für Startsiedlung und Startstraße.`, 'info');
        if (nextPlayer.isBot) {
          setTimeout(() => this.executeBotSetupTurn(roomCode, nextPlayer.id), 1000);
        }
      } else {
        // Setup complete! Position Robber 2 tiles north of what was built
        const northHex = getTileTwoTilesNorth(state.board, state.lastBuiltSetupVertexId || edge.vertex1Id);
        if (northHex) {
          state.board.hexes.forEach(h => { h.hasRobber = false; });
          northHex.hasRobber = true;
          state.board.robberHexId = northHex.id;
          this.addLog(state, `Gründungsphase beendet! Der Räuber lauert 2 Felder nördlich auf Feld ${northHex.id} (${northHex.type}).`, 'alert');
        }

        state.activePlayerIndex = 0;
        state.phase = 'TURN_DICE';
        state.roundNumber = 1;
        state.lastBuiltSetupVertexId = null;

        state.players.forEach(p => {
          p.tradesRemainingThisTurn = this.calculateTradeCapacity(p, state);
        });

        const firstPlayer = state.players[0];
        this.addLog(state, `Alle Startsiedlungen und Startstraßen errichtet! Das Spiel beginnt - ${firstPlayer.name} würfelt!`, 'alert');
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
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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

    if (isSetup) {
      state.lastBuiltSetupVertexId = vertexId;

      // Startrohstoffe wo man gebaut hat (direkte Auszahlung der angrenzenden Ertragsfelder)
      const gained: string[] = [];
      touchingHexes.forEach(h => {
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

    return { success: true };
  }

  public buildCity(roomCode: string, playerId: string, vertexId: string, chosenDiscountRes?: ResourceType): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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

    return { success: true };
  }

  // Contribute resources directly to an active quest
  public depositToQuest(roomCode: string, playerId: string, slotIndex: number, resource: ResourceType, amount: number = 1): { success: boolean; message?: string } {
    const state = this.getRoom(roomCode);
    if (!state) return { success: false, message: 'Raum nicht gefunden.' };

    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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

    // Einlagern schuetzt vor Verfall und verlaengert den Timer (Herauszoegern-Mechanik)
    slot.d6Timer = Math.min(6, slot.d6Timer + 3);

    this.addLog(state, `${activePlayer.name} zahlt ${toDeposit}x ${resource} in Quest "${slot.title}" ein. Timer steigt auf ${slot.d6Timer}!`, 'quest');

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

  private checkTeamVictory(state: GameRoomState) {
    const totalPoints = state.solvedQuestsCount + (state.teamHasLongestRoad ? 1 : 0) + (state.teamHasLargestArmy ? 1 : 0);
    if (totalPoints >= state.targetQuestsToWin && state.phase !== 'GAME_OVER_VICTORY') {
      state.phase = 'GAME_OVER_VICTORY';
      this.addLog(state, `SIEG! Das Team hat ${totalPoints} Siegpunkte erreicht (Quests: ${state.solvedQuestsCount}, Meilensteine: ${(state.teamHasLongestRoad ? 1 : 0) + (state.teamHasLargestArmy ? 1 : 0)}) und Catan gerettet!`, 'alert');
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
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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
        this.addLog(state, 'MEILENSTEIN: Größte Rittermacht erreicht (>= 3 Ritter)! +1 Siegpunkt für das Team! Der Räuber patrouilliert nur noch jede 2. Runde!', 'alert');
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
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
      return { success: false, message: 'Du bist nicht am Zug.' };
    }
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Rohstoffe können nur in der Aktionsphase verschenkt werden.' };
    }

    const targetPlayer = state.players.find(p => p.id === targetPlayerId);
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
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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

    if (proposal.senderId === responderId) {
      return { success: false, message: 'Du kannst dein eigenes Angebot nicht annehmen oder ablehnen.' };
    }

    if (proposal.targetPlayerId && proposal.targetPlayerId !== responderId) {
      return { success: false, message: 'Dieses Angebot war an einen anderen Mitspieler gerichtet.' };
    }

    const sender = state.players.find(p => p.id === proposal.senderId);
    const responder = state.players.find(p => p.id === responderId);
    if (!sender || !responder) {
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

    if (proposal.senderId !== senderId) {
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
    if (activePlayer.id !== playerId && !activePlayer.isBot) {
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
      this.addLog(state, 'MEILENSTEIN: Längste Handelsstraße erreicht (>= 7 Straßen)! +1 Siegpunkt für das Team, +1 Schenkung pro Zug, 3:1 Bankhandel und +1 W6-Timer!', 'alert');
      this.checkTeamVictory(state);
    }
  }

  // Bot setup turn AI: smart placement of starting settlement and road
  private executeBotSetupTurn(roomCode: string, botId: string) {
    const state = this.getRoom(roomCode);
    if (!state || state.players[state.activePlayerIndex]?.id !== botId) return;
    if (state.phase !== 'SETUP_SETTLEMENT') return;

    const validVertices: Array<{ id: string; score: number }> = [];
    for (const [vId, vertex] of Object.entries(state.board.vertices)) {
      if (vertex.building !== null) continue;

      const hasAdjBuilding = vertex.adjacentVertexIds.some(adjId => Boolean(state.board.vertices[adjId]?.building));
      if (hasAdjBuilding) continue;

      const touchingHexes = vertex.adjacentHexIds.map(hId => state.board.hexes.find(h => h.id === hId)).filter(Boolean);
      if (touchingHexes.length === 0 || touchingHexes.every(h => h?.type === 'water')) continue;

      let score = touchingHexes.filter(h => h?.type !== 'water' && h?.type !== 'desert').length * 10;
      touchingHexes.forEach(h => {
        if (h && h.diceNumber) {
          score += 6 - Math.abs(7 - h.diceNumber);
        }
      });

      validVertices.push({ id: vId, score });
    }

    validVertices.sort((a, b) => b.score - a.score);
    const chosen = validVertices[0] || { id: Object.keys(state.board.vertices)[0] };

    this.buildSettlement(roomCode, botId, chosen.id);
    this.notifyStateChanged(roomCode);
  }

  private executeBotSetupRoad(roomCode: string, botId: string, vertexId: string) {
    const state = this.getRoom(roomCode);
    if (!state || state.players[state.activePlayerIndex]?.id !== botId) return;
    if (state.phase !== 'SETUP_ROAD') return;

    const vertex = state.board.vertices[vertexId];
    if (!vertex) return;

    const validEdges = vertex.adjacentEdgeIds
      .map(eId => state.board.edges[eId])
      .filter(e => e && e.road === null && !e.isWaterEdge);

    if (validEdges.length > 0) {
      this.buildRoad(roomCode, botId, validEdges[0].id);
      this.notifyStateChanged(roomCode);
    }
  }

  // Simple autonomous bot AI for testing and multiplayer filling
  private executeBotTurn(roomCode: string, botId: string) {
    const state = this.getRoom(roomCode);
    if (!state || state.players[state.activePlayerIndex].id !== botId) return;

    // 1. Roll dice
    this.rollDice(roomCode, botId);
    this.notifyStateChanged(roomCode);

    // 2. Deposit to quests if matching resources exist
    state.questSlots.forEach((slot, slotIdx) => {
      if (slot.type === 'DELIVER_RESOURCES' && slot.requiredResources) {
        const bot = state.players.find(p => p.id === botId);
        if (!bot) return;
        for (const [r, needed] of Object.entries(slot.requiredResources)) {
          const res = r as ResourceType;
          if (bot.resources[res] > 0) {
            this.depositToQuest(roomCode, botId, slotIdx, res, 1);
          }
        }
      }
    });
    this.notifyStateChanged(roomCode);

    // 3. End turn after brief delay
    setTimeout(() => {
      this.endTurn(roomCode, botId);
      this.notifyStateChanged(roomCode);
    }, 1000);
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
