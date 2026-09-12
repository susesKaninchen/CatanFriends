// Catan Friends - Types and Interfaces

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
  id: string; // Socket ID or user ID
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

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexTile {
  id: string; // e.g. "q_r"
  q: number;
  r: number;
  type: HexType;
  diceNumber: number | null; // 2-12, null for desert & water
  letter: string | null; // "A" - "R", null for desert & water
  hasRobber: boolean;
  isDiscovered?: boolean;
  harborVertexId?: string | null;
  harbor?: Harbor | null;
}

export type HarborType = 'generic' | ResourceType;

export interface Harbor {
  type: HarborType;
  ratio: 2 | 3;
  waterHexId: string;
}

export interface Vertex {
  id: string; // e.g. "0_0_0" normalized
  x: number;
  y: number;
  adjacentHexIds: string[];
  adjacentVertexIds: string[];
  adjacentEdgeIds: string[];
  isCoastal?: boolean;
  harbor?: Harbor | null;
  building: {
    type: 'settlement' | 'city';
    ownerColor: PlayerColor;
    builtByColor?: PlayerColor; // For Fremdbau statistics
  } | null;
}

export interface Edge {
  id: string; // e.g. "v1_v2" sorted
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
  currentLetter: string; // Current position on A-R cycle
  unexploredLettersPool: Array<{ letter: string; num: number }>;
  numberTokenPool: number[];
  harborPool: HarborType[];
}

export type QuestType =
  | 'DELIVER_RESOURCES' // Deposit specific resources
  | 'BUILD_ROADS' // Team must build X total roads
  | 'BUILD_SETTLEMENTS' // Team must build X settlements
  | 'CONNECT_PLAYERS' // Two players must connect road networks
  | 'HARVEST_TOTAL' // Produce X resources total
  | 'BUILD_CITY_ON_RESOURCE'; // Build city on specific resource type

export interface QuestSlot {
  slotIndex: number; // 0, 1, 2, 3
  tier: number; // 1 - 6
  title: string;
  description: string;
  type: QuestType;
  d6Timer: number; // 1 - 6
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
  | 'SETUP_SETTLEMENT'
  | 'SETUP_ROAD'
  | 'TURN_DICE' // Active player must roll
  | 'TURN_ACTIONS' // Trade, build, quest deposit
  | 'ROBBER_DISCARD' // If 7 rolled and someone has > 7 cards
  | 'ROBBER_PLACEMENT' // Active player places robber or knight used
  | 'GAME_OVER_VICTORY'
  | 'GAME_OVER_DEFEAT';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'roll' | 'build' | 'quest' | 'robber' | 'alert';
}

export type TradeProposalType = 'trade' | 'request';

export interface ActiveTradeProposal {
  id: string;
  type: TradeProposalType; // 'trade' = biete Rohstoff A für Rohstoff B, 'request' = bitte um Rohstoff B
  senderId: string;
  senderName: string;
  senderColor: PlayerColor;
  targetPlayerId: string | null; // null = offenes Angebot an das gesamte Team
  giveResource?: ResourceType;   // Angebotener Rohstoff (bei 'trade')
  giveAmount?: number;           // Anzahl angebotener Rohstoffe (Standard 1)
  wantedResource: ResourceType;  // Gesuchter Rohstoff
  wantedAmount: number;          // Anzahl gesuchter Rohstoffe (Standard 1)
  createdAt: number;
}

export interface GameRoomState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  activePlayerIndex: number;
  roundNumber: number;
  setupTurnIndex: number;
  lastBuiltSetupVertexId?: string | null;
  board: BoardState;
  questSlots: QuestSlot[];
  solvedQuestsCount: number;
  failedQuestsCount: number; // Defeat at 4
  pointsPerPlayer: number; // Default 10 (or 6 for short, 14 for epic)
  teamVictoryPoints: number; // Current sum of settlements (1), cities (2), quests (1), road (3), army (3)
  targetQuestsToWin: number; // Target team victory points to win (pointsPerPlayer * players.length)
  diceValues: [number, number];
  logs: GameLogEntry[];
  longestRoadOwner: PlayerColor | null;
  longestRoadLength: number;
  teamHasLongestRoad: boolean; // >= 7 roads connected (+3 VP)
  teamHasLargestArmy: boolean; // >= 3 knights played (+3 VP)
  robberMovedThisRound: boolean;
  robberStunnedRounds?: number;
  activeTradeProposal?: ActiveTradeProposal | null;
}
