// Catan Friends - Authoritative Game State Engine
import {
  GameRoomState,
  Player,
  PlayerColor,
  PlayerRole,
  ResourceCount,
  ResourceType,
  GamePhase,
  GameLogEntry,
  QuestSlot,
  QuestType,
  HexType
} from './types.js';
import { generateBoard, getNextRobberLetter, getPreviousRobberLetter, ROBBER_LETTER_ORDER, exploreSurroundings } from './board.js';
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
      resources: { wood: 4, clay: 4, sheep: 3, wheat: 3, ore: 2 }, // Friendly starting reserve
      remainingPieces: { roads: 29, settlements: 4, cities: 4 },
      knightsPlayed: 0,
      longestRoadLength: 0,
      tradesRemainingThisTurn: 2
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
      resources: { wood: 4, clay: 4, sheep: 3, wheat: 3, ore: 2 },
      remainingPieces: { roads: 29, settlements: 4, cities: 4 },
      knightsPlayed: 0,
      longestRoadLength: 0,
      tradesRemainingThisTurn: 2
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
      resources: { wood: 4, clay: 4, sheep: 3, wheat: 3, ore: 2 },
      remainingPieces: { roads: 29, settlements: 4, cities: 4 },
      knightsPlayed: 0,
      longestRoadLength: 0,
      tradesRemainingThisTurn: 2
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

    state.phase = 'TURN_DICE';
    state.activePlayerIndex = 0;
    state.roundNumber = 1;

    // Place initial settlements and roads for quick start or friendly start
    this.setupFriendlyInitialBoard(state);

    this.addLog(state, 'Das Spiel hat begonnen! Erste Würfelphase aktiv.', 'alert');
    return { success: true };
  }

  // Set up 1 starting settlement and road per player automatically on balanced spots
  private setupFriendlyInitialBoard(state: GameRoomState) {
    const vertexKeys = Object.keys(state.board.vertices);
    const usedVertices = new Set<string>();

    state.players.forEach((player, index) => {
      // Find a vertex touching 3 resource hexes if possible, respecting distance rule
      let chosenVertexId = '';
      for (const vKey of vertexKeys) {
        if (usedVertices.has(vKey)) continue;
        const v = state.board.vertices[vKey];
        // Check distance rule: no settlement in adjacent vertices
        const hasAdjacentBuilding = v.adjacentVertexIds.some(adjId => state.board.vertices[adjId].building !== null);
        if (hasAdjacentBuilding) continue;

        // Check if touches resource hexes
        if (v.adjacentHexIds.length >= 2) {
          chosenVertexId = vKey;
          break;
        }
      }

      if (!chosenVertexId) {
        chosenVertexId = vertexKeys.find(vKey => state.board.vertices[vKey].building === null) || vertexKeys[0];
      }

      usedVertices.add(chosenVertexId);
      state.board.vertices[chosenVertexId].building = {
        type: 'settlement',
        ownerColor: player.color
      };

      // Connect 1 road from this settlement
      const v = state.board.vertices[chosenVertexId];
      if (v.adjacentEdgeIds.length > 0) {
        const edgeId = v.adjacentEdgeIds[0];
        state.board.edges[edgeId].road = {
          ownerColor: player.color
        };
      }

      this.addLog(state, `Startsiedlung für ${player.name} (${player.color}) platziert.`, 'build');
    });
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
    this.addLog(state, 'Eine 7 gewürfelt! Der Räuber bricht aus!', 'alert');

    // 1. Half card discard for players with > 7 resources
    state.players.forEach(player => {
      const totalCards = Object.values(player.resources).reduce((a, b) => a + b, 0);
      if (totalCards > 7) {
        const toDiscard = Math.floor(totalCards / 2);
        this.discardRandomCards(player, toDiscard);
        this.addLog(state, `${player.name} hatte ${totalCards} Handkarten und verliert ${toDiscard} Karten an die Bank.`, 'robber');
      }
    });

    // 2. Robber placement phase
    if (activePlayer.isBot) {
      // Bot chooses a valid hex touching an opponent if possible
      const availableHexes = state.board.hexes.filter(h => h.type !== 'water' && h.id !== state.board.robberHexId);
      const chosenHex = availableHexes[Math.floor(Math.random() * availableHexes.length)] || availableHexes[0];
      if (chosenHex) {
        this.moveRobberInternal(state, activePlayer, chosenHex.id);
      }
      state.phase = 'TURN_ACTIONS';
    } else {
      state.phase = 'ROBBER_PLACEMENT';
      this.addLog(state, `${activePlayer.name} muss den Räuber auf ein Zielfeld versetzen (Feld anklicken)!`, 'alert');
    }
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
    if (state.phase !== 'TURN_ACTIONS') {
      return { success: false, message: 'Bauen ist in dieser Phase nicht möglich.' };
    }

    const edge = state.board.edges[edgeId];
    if (!edge) return { success: false, message: 'Ungültige Kante.' };
    if (edge.road !== null) return { success: false, message: 'Kante ist bereits besetzt.' };
    if (edge.isWaterEdge) return { success: false, message: 'Im offenen Ozean können keine Straßen gebaut werden!' };

    const totalRemainingRoads = state.players.reduce((sum, p) => sum + p.remainingPieces.roads, 0);
    if (totalRemainingRoads <= 0) {
      return { success: false, message: 'Das Team hat das globale Straßen-Limit erreicht (alle Straßen gebaut).' };
    }

    const recipientColor = targetColor || activePlayer.color;
    const recipientPlayer = state.players.find(p => p.color === recipientColor);
    if (!recipientPlayer) return { success: false, message: 'Zielspieler existiert nicht.' };
    if (recipientPlayer.remainingPieces.roads <= 0) {
      return { success: false, message: `${recipientPlayer.name} hat keine Straßen mehr im Vorrat.` };
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

    recipientPlayer.remainingPieces.roads -= 1;

    // All roads belong to the whole team
    edge.road = {
      ownerColor: recipientColor,
      builtByColor: activePlayer.color
    };

    this.addLog(state, `${activePlayer.name} baut eine gemeinsame Straße für das Team.`, 'build');

    // Procedural island expansion: Reveal surroundings when building roads
    const newlyDiscovered = exploreSurroundings(state.board, edgeId);
    if (newlyDiscovered.length > 0) {
      const landCount = newlyDiscovered.filter(h => h.type !== 'water').length;
      const waterCount = newlyDiscovered.filter(h => h.type === 'water').length;
      this.addLog(state, `Entdeckung! ${landCount} neues Land und ${waterCount} Ozeanfeld(er) aufgedeckt!`, 'info');
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
    if (state.phase !== 'TURN_ACTIONS') {
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

    // Road connection rule: Must be connected to at least one existing road
    const hasConnectingRoad = vertex.adjacentEdgeIds.some(eId => Boolean(state.board.edges[eId]?.road));
    if (!hasConnectingRoad) {
      return { success: false, message: 'Siedlungen müssen an eine bestehende Straße angebunden sein.' };
    }

    const recipientColor = targetColor || activePlayer.color;
    const recipientPlayer = state.players.find(p => p.color === recipientColor);
    if (!recipientPlayer) return { success: false, message: 'Zielspieler existiert nicht.' };
    if (recipientPlayer.remainingPieces.settlements <= 0) {
      return { success: false, message: `${recipientPlayer.name} hat das Siedlungs-Limit erreicht (5/5 gebaut).` };
    }

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

    recipientPlayer.remainingPieces.settlements -= 1;

    vertex.building = {
      type: 'settlement',
      ownerColor: recipientColor,
      builtByColor: activePlayer.color
    };

    const fremdbauNote = activePlayer.color !== recipientColor ? ` (Fremdbau für ${recipientPlayer.name})` : '';
    this.addLog(state, `${activePlayer.name} baut eine Siedlung in ${recipientColor}${fremdbauNote}.`, 'build');

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

    this.addLog(state, `${activePlayer.name} zahlt ${toDeposit}x ${resource} in Quest "${slot.title}" ein.`, 'quest');

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

  private completeQuest(state: GameRoomState, slot: QuestSlot) {
    slot.isCompleted = true;
    state.solvedQuestsCount += 1;

    this.addLog(state, `ERFOLG: Quest "${slot.title}" erfüllt! (${state.solvedQuestsCount} gelöst)`, 'quest');

    if (state.solvedQuestsCount >= state.targetQuestsToWin) {
      state.phase = 'GAME_OVER_VICTORY';
      this.addLog(state, `SIEG! Das Team hat ${state.solvedQuestsCount} Quests gemeistert und Catan gerettet!`, 'alert');
      return;
    }

    // Advance slot to next tier
    const nextTier = Math.min(6, slot.tier + 1);
    const newSlot = createQuestSlot(slot.slotIndex, nextTier, state.teamHasLongestRoad);
    state.questSlots[slot.slotIndex] = newSlot;
    this.addLog(state, `Neuer Auftrag für Slot ${slot.slotIndex + 1}: "${newSlot.title}" (Stufe ${newSlot.tier}, W6-Timer: ${newSlot.d6Timer}).`, 'quest');
  }

  // Captain / Knight card: allows placing robber + increments knight count
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

    activePlayer.knightsPlayed += 1;
    this.addLog(state, `${activePlayer.name} spielt eine Ritterkarte! Wähle ein Feld für den Räuber.`, 'alert');

    // Check Largest Army milestone (>= 3 knights in team)
    const teamTotalKnights = state.players.reduce((sum, p) => sum + p.knightsPlayed, 0);
    if (teamTotalKnights >= 3 && !state.teamHasLargestArmy) {
      state.teamHasLargestArmy = true;
      this.addLog(state, 'MEILENSTEIN: Größte Rittermacht erreicht! Der Räuber patrouilliert nur noch jede 2. Runde!', 'alert');
    }

    state.phase = 'ROBBER_PLACEMENT';
    return { success: true };
  }

  // Bank Trade (4:1)
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
    if (activePlayer.resources[giveRes] < 4) {
      return { success: false, message: `Du benötigst 4x ${giveRes} für den Bank-Handel (4:1).` };
    }

    activePlayer.resources[giveRes] -= 4;
    activePlayer.resources[getRes] += 1;

    this.addLog(state, `${activePlayer.name} tauscht 4x ${giveRes} gegen 1x ${getRes} bei der Bank (4:1).`, 'info');
    return { success: true };
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

    if (activePlayer.resources[resource] < 1) {
      return { success: false, message: `Nicht genügend ${resource} vorhanden.` };
    }

    activePlayer.resources[resource] -= 1;
    targetPlayer.resources[resource] += 1;

    this.addLog(state, `${activePlayer.name} schenkt 1x ${resource} an ${targetPlayer.name} für gemeinsame Bauprojekte!`, 'info');
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
    // If Largest Army active: moves only on even rounds
    const shouldRobberPatrol = !state.teamHasLargestArmy || (state.roundNumber % 2 === 0);
    if (shouldRobberPatrol) {
      this.patrolRobberToNeighbor(state);
    } else {
      this.addLog(state, 'Ritterwache hält den Räuber diese Runde auf!', 'info');
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
        state.questSlots[slot.slotIndex] = createQuestSlot(slot.slotIndex, nextTier, state.teamHasLongestRoad);
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
    return Math.max(1, points);
  }

  private updateLongestRoad(state: GameRoomState) {
    // Check total team road network
    const totalRoads = Object.values(state.board.edges).filter(e => e.road !== null).length;
    state.longestRoadLength = totalRoads;

    if (totalRoads >= 7 && !state.teamHasLongestRoad) {
      state.teamHasLongestRoad = true;
      this.addLog(state, 'MEILENSTEIN: Längste Handelsstraße erreicht (>= 7 Straßen)! Alle künftigen Quests erhalten +1 W6-Timer!', 'alert');
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
