// Catan Friends - Board Generator and Procedural Island Expansion
import { HexTile, HexType, Vertex, Edge, BoardState, ResourceType, Harbor, HarborType } from './types.js';

export const HEX_RADIUS = 56; // Size in SVG units

export function hexToPixel(q: number, r: number, radius: number = HEX_RADIUS): { x: number; y: number } {
  const x = radius * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = radius * ((3 / 2) * r);
  return { x, y };
}

export function hexDistance(h1: { q: number; r: number }, h2: { q: number; r: number }): number {
  const dq = h1.q - h2.q;
  const dr = h1.r - h2.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr)) / 2;
}

export function getHexCornerOffsets(radius: number = HEX_RADIUS): Array<{ x: number; y: number }> {
  const corners: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: radius * Math.cos(angleRad),
      y: radius * Math.sin(angleRad)
    });
  }
  return corners;
}

export function makeVertexKey(x: number, y: number): string {
  const rx = Math.round(x);
  const ry = Math.round(y);
  return `v_${rx}_${ry}`;
}

export function makeEdgeKey(v1Id: string, v2Id: string): string {
  return v1Id < v2Id ? `e_${v1Id}_${v2Id}` : `e_${v2Id}_${v1Id}`;
}

export const AXIAL_DIRECTIONS: Array<{ q: number; r: number }> = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

export const ROBBER_LETTER_ORDER = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
  'S', 'T', 'U', 'V', 'W', 'X'
];

export function getNextRobberLetter(currentLetter: string, steps: number = 1): string {
  const currentIndex = ROBBER_LETTER_ORDER.indexOf(currentLetter);
  if (currentIndex === -1) return 'A';
  const nextIndex = (currentIndex + steps) % ROBBER_LETTER_ORDER.length;
  return ROBBER_LETTER_ORDER[nextIndex];
}

export function getPreviousRobberLetter(currentLetter: string, steps: number = 2): string {
  const currentIndex = ROBBER_LETTER_ORDER.indexOf(currentLetter);
  if (currentIndex === -1) return 'A';
  let prevIndex = (currentIndex - steps) % ROBBER_LETTER_ORDER.length;
  if (prevIndex < 0) prevIndex += ROBBER_LETTER_ORDER.length;
  return ROBBER_LETTER_ORDER[prevIndex];
}

export const STANDARD_TOKEN_POOL = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
];

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function drawNumberToken(board: BoardState): number {
  if (!board.numberTokenPool || board.numberTokenPool.length === 0) {
    board.numberTokenPool = shuffleArray([...STANDARD_TOKEN_POOL]);
  }
  return board.numberTokenPool.pop()!;
}

// Find a land hex 2 tiles north of a given vertex in SVG coordinates
export function getTileTwoTilesNorth(board: BoardState, vertexId: string): HexTile | null {
  const vertex = board.vertices[vertexId];
  if (!vertex) return null;

  // 2 tiles north in SVG coordinates:
  // Height of each tile row is 1.5 * HEX_RADIUS (HEX_RADIUS = 56).
  // Target Y is 2 rows north (lower Y).
  const targetX = vertex.x;
  const targetY = vertex.y - 2 * 1.5 * HEX_RADIUS;

  const landHexes = board.hexes.filter(h => h.type !== 'water');
  if (landHexes.length === 0) return null;

  let bestHex: HexTile = landHexes[0];
  let minDistance = Infinity;

  for (const hex of landHexes) {
    const center = hexToPixel(hex.q, hex.r, HEX_RADIUS);
    const dist = Math.hypot(center.x - targetX, center.y - targetY);
    if (dist < minDistance) {
      minDistance = dist;
      bestHex = hex;
    }
  }

  return bestHex;
}

export const STANDARD_HARBOR_POOL: HarborType[] = [
  'generic', 'generic', 'generic', 'generic',
  'wood', 'clay', 'sheep', 'wheat', 'ore'
];

export function drawHarborType(board: BoardState): HarborType | null {
  if (!board.harborPool || board.harborPool.length === 0) {
    return null;
  }
  return board.harborPool.pop()!;
}

export function assignHarborToWaterHex(board: BoardState, waterHex: HexTile): boolean {
  if (!board.harborPool || board.harborPool.length === 0) {
    return false;
  }

  const center = hexToPixel(waterHex.q, waterHex.r, HEX_RADIUS);
  const cornerOffsets = getHexCornerOffsets(HEX_RADIUS);

  // Find candidate edges (pairs of adjacent vertices) that touch this water hex AND at least one land hex
  const candidateEdges: Array<{ v1: Vertex; v2: Vertex }> = [];
  for (let i = 0; i < 6; i++) {
    const nextIdx = (i + 1) % 6;
    const v1Key = makeVertexKey(center.x + cornerOffsets[i].x, center.y + cornerOffsets[i].y);
    const v2Key = makeVertexKey(center.x + cornerOffsets[nextIdx].x, center.y + cornerOffsets[nextIdx].y);
    const v1 = board.vertices[v1Key];
    const v2 = board.vertices[v2Key];
    if (v1 && v2 && !v1.harbor && !v2.harbor) {
      const v1HasLand = v1.adjacentHexIds.some(hId => {
        const h = board.hexes.find(hex => hex.id === hId);
        return h && h.type !== 'water';
      });
      const v2HasLand = v2.adjacentHexIds.some(hId => {
        const h = board.hexes.find(hex => hex.id === hId);
        return h && h.type !== 'water';
      });
      if (v1HasLand && v2HasLand) {
        candidateEdges.push({ v1, v2 });
      }
    }
  }

  if (candidateEdges.length === 0) return false;

  const hType = drawHarborType(board);
  if (!hType) return false;

  const harbor: Harbor = {
    type: hType,
    ratio: hType === 'generic' ? 3 : 2,
    waterHexId: waterHex.id
  };

  const chosen = candidateEdges[0];
  chosen.v1.harbor = harbor;
  chosen.v2.harbor = harbor;
  waterHex.harborVertexId = chosen.v1.id;
  waterHex.harbor = harbor;
  return true;
}

export function generateBoard(): BoardState {
  // Complete 19-tile Catan island (radius 2)
  const coreCoords = [
    // Center (0, 0)
    { q: 0, r: 0 },
    // Ring 1 (6 hexes)
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
    // Ring 2 (12 hexes)
    { q: 2, r: 0 },
    { q: 2, r: -1 },
    { q: 2, r: -2 },
    { q: 1, r: -2 },
    { q: 0, r: -2 },
    { q: -1, r: -1 },
    { q: -2, r: 0 },
    { q: -2, r: 1 },
    { q: -2, r: 2 },
    { q: -1, r: 2 },
    { q: 0, r: 2 },
    { q: 1, r: 1 }
  ];

  // Standard Catan resource tiles: 4 wood, 3 clay, 4 sheep, 4 wheat, 3 ore (18 total)
  const resourceTiles: HexType[] = [
    'wood', 'wood', 'wood', 'wood',
    'clay', 'clay', 'clay',
    'sheep', 'sheep', 'sheep', 'sheep',
    'wheat', 'wheat', 'wheat', 'wheat',
    'ore', 'ore', 'ore'
  ];
  const shuffledResources = shuffleArray(resourceTiles);
  // Center is desert, surrounded by all standard resource tiles
  const coreResources: HexType[] = ['desert', ...shuffledResources];

  const board: BoardState = {
    hexes: [],
    vertices: {},
    edges: {},
    robberHexId: '0_0',
    currentLetter: 'A',
    unexploredLettersPool: [],
    numberTokenPool: shuffleArray([...STANDARD_TOKEN_POOL]),
    harborPool: shuffleArray([...STANDARD_HARBOR_POOL])
  };

  // Add 19 land tiles
  coreCoords.forEach((coord, i) => {
    const resType = coreResources[i];
    const isDesert = resType === 'desert';
    const diceNum = isDesert ? null : drawNumberToken(board);

    addHexToBoard(
      board,
      coord.q,
      coord.r,
      resType,
      null, // Letters removed from tokens
      diceNum,
      isDesert // Robber initially on desert
    );
  });

  return board;
}

export function addHexToBoard(
  board: BoardState,
  q: number,
  r: number,
  type: HexType,
  letter: string | null,
  diceNumber: number | null,
  hasRobber: boolean = false
): HexTile {
  const hexId = `${q}_${r}`;
  const existing = board.hexes.find(h => h.id === hexId);
  if (existing) return existing;

  const hex: HexTile = {
    id: hexId,
    q,
    r,
    type,
    diceNumber,
    letter,
    hasRobber,
    isDiscovered: true
  };
  board.hexes.push(hex);

  const center = hexToPixel(q, r, HEX_RADIUS);
  const cornerOffsets = getHexCornerOffsets(HEX_RADIUS);
  const hexCornerVertexIds: string[] = [];

  for (let i = 0; i < 6; i++) {
    const offset = cornerOffsets[i];
    const vx = center.x + offset.x;
    const vy = center.y + offset.y;
    const vKey = makeVertexKey(vx, vy);

    if (!board.vertices[vKey]) {
      board.vertices[vKey] = {
        id: vKey,
        x: Math.round(vx * 10) / 10,
        y: Math.round(vy * 10) / 10,
        adjacentHexIds: [],
        adjacentVertexIds: [],
        adjacentEdgeIds: [],
        isCoastal: type === 'water',
        building: null
      };
    }

    if (!board.vertices[vKey].adjacentHexIds.includes(hexId)) {
      board.vertices[vKey].adjacentHexIds.push(hexId);
    }

    hexCornerVertexIds.push(vKey);
  }

  // Connect adjacent corners with edges
  for (let i = 0; i < 6; i++) {
    const v1 = hexCornerVertexIds[i];
    const v2 = hexCornerVertexIds[(i + 1) % 6];
    const eKey = makeEdgeKey(v1, v2);

    if (!board.edges[eKey]) {
      board.edges[eKey] = {
        id: eKey,
        vertex1Id: v1,
        vertex2Id: v2,
        adjacentHexIds: [],
        isWaterEdge: false,
        road: null
      };
    }

    if (!board.edges[eKey].adjacentHexIds.includes(hexId)) {
      board.edges[eKey].adjacentHexIds.push(hexId);
    }

    if (!board.vertices[v1].adjacentVertexIds.includes(v2)) {
      board.vertices[v1].adjacentVertexIds.push(v2);
    }
    if (!board.vertices[v2].adjacentVertexIds.includes(v1)) {
      board.vertices[v2].adjacentVertexIds.push(v1);
    }
    if (!board.vertices[v1].adjacentEdgeIds.includes(eKey)) {
      board.vertices[v1].adjacentEdgeIds.push(eKey);
    }
    if (!board.vertices[v2].adjacentEdgeIds.includes(eKey)) {
      board.vertices[v2].adjacentEdgeIds.push(eKey);
    }
  }

  // Check which edges and vertices are completely engulfed by water
  for (const edge of Object.values(board.edges)) {
    const touchingHexes = edge.adjacentHexIds.map(id => board.hexes.find(h => h.id === id)).filter(Boolean);
    if (touchingHexes.length > 0 && touchingHexes.every(h => h?.type === 'water')) {
      edge.isWaterEdge = true;
    }
  }

  return hex;
}

// Local Fog of War: Uncover ONLY the directly adjacent empty hexes when a road or settlement is built
export function exploreAdjacent(
  board: BoardState,
  location: { edgeId?: string; vertexId?: string }
): HexTile[] {
  const newlyDiscovered: HexTile[] = [];
  const existingCoords = new Set(board.hexes.map(h => `${h.q}_${h.r}`));
  const candidateCoords = new Map<string, { q: number; r: number }>();

  if (location.edgeId) {
    const edge = board.edges[location.edgeId];
    if (!edge) return [];
    const v1 = board.vertices[edge.vertex1Id];
    const v2 = board.vertices[edge.vertex2Id];
    if (!v1 || !v2) return [];

    // Road placement: find the empty hex across this edge (touches both v1 and v2)
    for (const hexId of edge.adjacentHexIds) {
      const parts = hexId.split('_').map(Number);
      const hq = parts[0];
      const hr = parts[1];

      for (const dir of AXIAL_DIRECTIONS) {
        const nq = hq + dir.q;
        const nr = hr + dir.r;
        const key = `${nq}_${nr}`;

        if (existingCoords.has(key) || candidateCoords.has(key)) continue;

        const center = hexToPixel(nq, nr, HEX_RADIUS);
        const d1 = Math.hypot(center.x - v1.x, center.y - v1.y);
        const d2 = Math.hypot(center.x - v2.x, center.y - v2.y);

        if (Math.abs(d1 - HEX_RADIUS) < 3.0 && Math.abs(d2 - HEX_RADIUS) < 3.0) {
          const axialDist = Math.max(Math.abs(nq), Math.abs(nr), Math.abs(-nq - nr));
          if (axialDist <= 6) {
            candidateCoords.set(key, { q: nq, r: nr });
          }
        }
      }
    }
  } else if (location.vertexId) {
    const vertex = board.vertices[location.vertexId];
    if (!vertex) return [];

    // Settlement placement: find empty hexes touching this vertex (at distance HEX_RADIUS)
    for (const hexId of vertex.adjacentHexIds) {
      const parts = hexId.split('_').map(Number);
      const hq = parts[0];
      const hr = parts[1];

      for (const dir of AXIAL_DIRECTIONS) {
        const nq = hq + dir.q;
        const nr = hr + dir.r;
        const key = `${nq}_${nr}`;

        if (existingCoords.has(key) || candidateCoords.has(key)) continue;

        const center = hexToPixel(nq, nr, HEX_RADIUS);
        const dist = Math.hypot(center.x - vertex.x, center.y - vertex.y);

        if (Math.abs(dist - HEX_RADIUS) < 3.0) {
          const axialDist = Math.max(Math.abs(nq), Math.abs(nr), Math.abs(-nq - nr));
          if (axialDist <= 6) {
            candidateCoords.set(key, { q: nq, r: nr });
          }
        }
      }
    }
  }

  // Create discovered adjacent hexes (strictly local, no cascade)
  for (const [key, coord] of candidateCoords.entries()) {
    existingCoords.add(key);

    const isWater = coord.r >= 3;
    let type: HexType = 'water';
    let diceNum: number | null = null;

    if (!isWater) {
      const landTypes: HexType[] = ['wood', 'clay', 'sheep', 'wheat', 'ore'];
      type = landTypes[Math.floor(Math.random() * landTypes.length)];
      diceNum = drawNumberToken(board);
    }

    const newHex = addHexToBoard(board, coord.q, coord.r, type, null, diceNum, false);
    if (type === 'water') {
      // Not every water tile gets a harbor:
      // Only coastal water tiles bordering land (r === 3) have a ~50% chance of a harbor, up to max 9 harbors
      const isCoastal = coord.r === 3;
      const shouldHaveHarbor = isCoastal && Math.random() < 0.5 && Boolean(board.harborPool && board.harborPool.length > 0);
      if (shouldHaveHarbor) {
        assignHarborToWaterHex(board, newHex);
      }
    }
    newlyDiscovered.push(newHex);
  }

  return newlyDiscovered;
}

// Backward compatibility alias for edge-based exploration
export function exploreSurroundings(board: BoardState, edgeId: string): HexTile[] {
  return exploreAdjacent(board, { edgeId });
}
