// Catan Friends - Client Types

export type ResourceType = 'wood' | 'clay' | 'sheep' | 'wheat' | 'ore';

export type HexType = ResourceType | 'desert' | 'water';

export type PlayerColor = 'red' | 'blue' | 'orange' | 'white';

export type PlayerRole = 'pioneer' | 'builder' | 'miner' | 'captain';

export interface ResourceCount {
  wood: number;
  clay: number;
  sheep: number;
  wheat: number;
  ore: number;
}

export interface PlayerPieces {
  roads: number; // Max 30
  settlements: number; // Max 5
  cities: number; // Max 4
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  role: PlayerRole;
  isReady: boolean;
  isHost: boolean;
  isBot?: boolean;
  resources: ResourceCount;
  remainingPieces: PlayerPieces;
  knightsPlayed: number;
  longestRoadLength: number;
  tradesRemainingThisTurn: number;
}

export interface HexTile {
  id: string;
  q: number;
  r: number;
  type: HexType;
  diceNumber: number | null;
  letter: string | null;
  hasRobber: boolean;
  isDiscovered?: boolean;
}

export interface Vertex {
  id: string;
  x: number;
  y: number;
  adjacentHexIds: string[];
  adjacentVertexIds: string[];
  adjacentEdgeIds: string[];
  isCoastal?: boolean;
  building: {
    type: 'settlement' | 'city';
    ownerColor: PlayerColor;
    builtByColor?: PlayerColor;
  } | null;
}

export interface Edge {
  id: string;
  vertex1Id: string;
  vertex2Id: string;
  adjacentHexIds: string[];
  isWaterEdge?: boolean;
  road: {
    ownerColor: PlayerColor;
    builtByColor?: PlayerColor;
  } | null;
}

export interface BoardState {
  hexes: HexTile[];
  vertices: { [id: string]: Vertex };
  edges: { [id: string]: Edge };
  robberHexId: string;
  currentLetter: string;
  unexploredLettersPool: Array<{ letter: string; num: number }>;
}

export type QuestType =
  | 'DELIVER_RESOURCES'
  | 'BUILD_ROADS'
  | 'BUILD_SETTLEMENTS'
  | 'CONNECT_PLAYERS'
  | 'HARVEST_TOTAL'
  | 'BUILD_CITY_ON_RESOURCE';

export interface QuestSlot {
  slotIndex: number;
  tier: number;
  title: string;
  description: string;
  type: QuestType;
  d6Timer: number;
  maxTimer: number;
  requiredResources?: Partial<ResourceCount>;
  depositedResources: ResourceCount;
  targetCount?: number;
  currentCount: number;
  targetResourceType?: HexType;
  isCompleted: boolean;
  isFailed: boolean;
}

export type GamePhase =
  | 'LOBBY'
  | 'TURN_DICE'
  | 'TURN_ACTIONS'
  | 'ROBBER_DISCARD'
  | 'ROBBER_PLACEMENT'
  | 'GAME_OVER_VICTORY'
  | 'GAME_OVER_DEFEAT';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'roll' | 'build' | 'quest' | 'robber' | 'alert';
}

export interface GameRoomState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  activePlayerIndex: number;
  roundNumber: number;
  setupTurnIndex: number;
  board: BoardState;
  questSlots: QuestSlot[];
  solvedQuestsCount: number;
  failedQuestsCount: number;
  targetQuestsToWin: number;
  diceValues: [number, number];
  logs: GameLogEntry[];
  longestRoadOwner: PlayerColor | null;
  longestRoadLength: number;
  teamHasLongestRoad: boolean;
  teamHasLargestArmy: boolean;
  robberMovedThisRound: boolean;
}
