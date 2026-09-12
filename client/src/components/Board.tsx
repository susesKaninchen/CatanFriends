import React, { useMemo, useState, useRef } from 'react';
import { BoardState, HexTile, HexType, PlayerColor, Vertex, Edge, GamePhase } from '../types';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface BoardProps {
  board: BoardState;
  buildMode: 'none' | 'road' | 'settlement' | 'city';
  targetColor: PlayerColor;
  onSelectVertex: (vertexId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onSelectHex?: (hexId: string) => void;
  phase?: GamePhase;
  isMyTurn?: boolean;
  disabled?: boolean;
  diceValues?: [number, number];
}

const HEX_RADIUS = 56;

function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_RADIUS * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_RADIUS * ((3 / 2) * r);
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function getHexCornerPoints(center: { x: number; y: number }): Array<{ x: number; y: number }> {
  const corners: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: Math.round((center.x + HEX_RADIUS * Math.cos(angleRad)) * 10) / 10,
      y: Math.round((center.y + HEX_RADIUS * Math.sin(angleRad)) * 10) / 10
    });
  }
  return corners;
}

const TERRAIN_ASSETS: { [key in HexType]: string } = {
  wood: '/assets/forest.jpg',
  clay: '/assets/hills.jpg',
  sheep: '/assets/pasture.jpg',
  wheat: '/assets/fields.jpg',
  ore: '/assets/mountains.jpg',
  desert: '/assets/desert.jpg',
  water: '/assets/ocean.jpg'
};

const TERRAIN_FALLBACK_COLORS: { [key in HexType]: string } = {
  wood: '#166534',
  clay: '#9a3412',
  sheep: '#4d7c0f',
  wheat: '#ca8a04',
  ore: '#334155',
  desert: '#78350f',
  water: '#0369a1'
};

const COLOR_MAP: { [key in PlayerColor]: string } = {
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f97316',
  white: '#f8fafc'
};

const COLOR_STROKE_MAP: { [key in PlayerColor]: string } = {
  red: '#7f1d1d',
  blue: '#172554',
  orange: '#7c2d12',
  white: '#475569'
};

function getProbabilityDots(num: number | null): number {
  if (!num || num === 7) return 0;
  return 6 - Math.abs(7 - num);
}

export const Board: React.FC<BoardProps> = ({
  board,
  buildMode,
  targetColor,
  onSelectVertex,
  onSelectEdge,
  onSelectHex,
  phase,
  isMyTurn,
  disabled,
  diceValues
}) => {
  // Compute active dice roll sum for harvest tile highlight
  const diceSum = diceValues ? diceValues[0] + diceValues[1] : null;
  const isDiceHarvestActive = Boolean(
    diceSum !== null && diceSum >= 2 && diceSum <= 12 && diceSum !== 7 && phase === 'TURN_ACTIONS'
  );

  // Pan and Zoom Interactive State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Interactive robber placement phase check
  const isRobberPlacementPhase = phase === 'ROBBER_PLACEMENT' && Boolean(isMyTurn);

  // Base bounding box computed from all current hex tiles
  const baseBounds = useMemo(() => {
    if (!board.hexes || board.hexes.length === 0) {
      return { cx: 0, cy: 0, w: 580, h: 500 };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    board.hexes.forEach((hex) => {
      const { x, y } = hexToPixel(hex.q, hex.r);
      minX = Math.min(minX, x - HEX_RADIUS - 30);
      maxX = Math.max(maxX, x + HEX_RADIUS + 30);
      minY = Math.min(minY, y - HEX_RADIUS - 30);
      maxY = Math.max(maxY, y + HEX_RADIUS + 30);
    });

    const w = Math.max(580, maxX - minX);
    const h = Math.max(500, maxY - minY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { cx, cy, w, h };
  }, [board.hexes]);

  // Dynamic SVG viewBox integrating pan and zoom
  const viewBox = useMemo(() => {
    const w = baseBounds.w / zoom;
    const h = baseBounds.h / zoom;
    const x = baseBounds.cx - w / 2 + pan.x;
    const y = baseBounds.cy - h / 2 + pan.y;
    return `${Math.round(x)} ${Math.round(y)} ${Math.round(w)} ${Math.round(h)}`;
  }, [baseBounds, zoom, pan]);

  // Pan and Zoom Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    hasDraggedRef.current = false;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDraggedRef.current = true;
    }
    setPan(prev => ({
      x: prev.x - dx / zoom,
      y: prev.y - dy / zoom
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(z => Math.min(3.0, Math.max(0.4, z * factor)));
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(z => Math.min(3.0, z * 1.25));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(z => Math.max(0.4, z / 1.25));
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Setup phase interactive flags
  const isSetupSettlement = phase === 'SETUP_SETTLEMENT' && Boolean(isMyTurn);
  const isSetupRoad = phase === 'SETUP_ROAD' && Boolean(isMyTurn);

  // Rule 1: Valid Roads
  // Can only be built on edges touching an existing road or building.
  // In SETUP_ROAD: Must connect to player's newly built settlement.
  const buildableEdgeIds = useMemo(() => {
    if ((buildMode !== 'road' && !isSetupRoad) || disabled) return new Set<string>();

    const valid = new Set<string>();
    Object.values(board.edges).forEach((edge) => {
      if (edge.road !== null || edge.isWaterEdge) return;

      const v1 = board.vertices[edge.vertex1Id];
      const v2 = board.vertices[edge.vertex2Id];
      if (!v1 || !v2) return;

      if (isSetupRoad) {
        const connectsToMyBuilding =
          (v1.building && v1.building.ownerColor === targetColor) ||
          (v2.building && v2.building.ownerColor === targetColor);
        if (connectsToMyBuilding) {
          valid.add(edge.id);
        }
      } else {
        const touchesBuilding = Boolean(v1.building) || Boolean(v2.building);
        const touchesRoad =
          v1.adjacentEdgeIds.some(eId => eId !== edge.id && Boolean(board.edges[eId]?.road)) ||
          v2.adjacentEdgeIds.some(eId => eId !== edge.id && Boolean(board.edges[eId]?.road));

        if (touchesBuilding || touchesRoad) {
          valid.add(edge.id);
        }
      }
    });

    return valid;
  }, [board.edges, board.vertices, buildMode, isSetupRoad, targetColor, disabled]);

  // Rule 2: Valid Settlements
  // Must be empty, not pure water, respect distance rule.
  // In regular phase, also must connect to an existing road.
  // In SETUP_SETTLEMENT, free choice of any valid vertex without road!
  const buildableSettlementVertexIds = useMemo(() => {
    if ((buildMode !== 'settlement' && !isSetupSettlement) || disabled) return new Set<string>();

    const valid = new Set<string>();
    Object.values(board.vertices).forEach((vertex) => {
      if (vertex.building !== null) return;

      const touchingHexes = vertex.adjacentHexIds.map(hId => board.hexes.find(h => h.id === hId)).filter(Boolean);
      const isPureWater = touchingHexes.length > 0 && touchingHexes.every(h => h?.type === 'water');
      if (isPureWater) return;

      // Distance rule: No building on adjacent vertices
      const hasAdjBuilding = vertex.adjacentVertexIds.some(adjId => Boolean(board.vertices[adjId]?.building));
      if (hasAdjBuilding) return;

      if (!isSetupSettlement) {
        // Road connection rule: Must connect to an existing road
        const hasRoadConnection = vertex.adjacentEdgeIds.some(eId => Boolean(board.edges[eId]?.road));
        if (!hasRoadConnection) return;
      }

      valid.add(vertex.id);
    });

    return valid;
  }, [board.vertices, board.edges, board.hexes, buildMode, isSetupSettlement, disabled]);

  // Rule 3: Valid Cities
  // Strict upgrade: ONLY on existing settlements.
  const buildableCityVertexIds = useMemo(() => {
    if (buildMode !== 'city' || disabled) return new Set<string>();

    const valid = new Set<string>();
    Object.values(board.vertices).forEach((vertex) => {
      if (vertex.building && vertex.building.type === 'settlement') {
        valid.add(vertex.id);
      }
    });

    return valid;
  }, [board.vertices, buildMode, disabled]);

  return (
    <div
      className="relative w-full max-w-3xl mx-auto aspect-[1.12] bg-[#1f140c] rounded-2xl border-2 border-[#7a4920] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Outer wooden vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a1b10]/20 via-transparent to-[#140d07]/35 pointer-events-none z-10" />

      {/* Robber Placement Floating Banner */}
      {isRobberPlacementPhase && (
        <div className="absolute top-3 left-3 bg-[#3d110a]/95 backdrop-blur border-2 border-rose-500 rounded-xl px-3.5 py-2 text-xs text-rose-100 flex items-center gap-2.5 shadow-2xl z-20 animate-pulse font-serif pointer-events-none">
          <span className="text-xl">🦹</span>
          <div>
            <span className="font-bold text-amber-300 block font-['MedievalSharp',serif]">Räuber versetzen!</span>
            <span className="text-[10px] text-rose-200">Klicke auf ein Zielfeld, um Rohstoffe zu sperren</span>
          </div>
        </div>
      )}

      {/* Interactive Zoom & Pan Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#26170d]/95 backdrop-blur border border-[#8a5324] rounded-xl p-1 shadow-xl z-20">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#382011] hover:bg-[#4d2d18] text-amber-200 border border-[#7a481e] transition-colors"
          title="Vergrößern (Mausrad hoch)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#382011] hover:bg-[#4d2d18] text-amber-200 border border-[#7a481e] transition-colors"
          title="Verkleinern (Mausrad runter)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#382011] hover:bg-[#4d2d18] text-[#e0cfbb] hover:text-white border border-[#7a481e] transition-colors"
          title="Ansicht zurücksetzen (Zentrieren)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <svg
        viewBox={viewBox}
        className="w-full h-full select-none z-10"
        style={{ touchAction: 'none' }}
      >
        <defs>
          <filter id="catan-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.7" />
          </filter>
          <radialGradient id="token-parchment" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fffdf5" />
            <stop offset="70%" stopColor="#faecd0" />
            <stop offset="100%" stopColor="#e2cca0" />
          </radialGradient>

          {/* Radiant Golden Harvest Glow Filter */}
          <filter id="catan-gold-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#fbbf24" floodOpacity="0.85" />
          </filter>

          {/* Wooden Charcoal Robber Gradient */}
          <linearGradient id="robber-wood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="45%" stopColor="#27272a" />
            <stop offset="85%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          {/* Clip path for each hex polygon */}
          {board.hexes.map((hex) => {
            const center = hexToPixel(hex.q, hex.r);
            const corners = getHexCornerPoints(center);
            const pointsStr = corners.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <clipPath id={`clip-${hex.id}`} key={`clip-${hex.id}`}>
                <polygon points={pointsStr} />
              </clipPath>
            );
          })}
        </defs>

        {/* 1. Hexagons Layer */}
        <g id="hexes">
          {board.hexes.map((hex) => {
            const center = hexToPixel(hex.q, hex.r);
            const corners = getHexCornerPoints(center);
            const pointsStr = corners.map((p) => `${p.x},${p.y}`).join(' ');
            const isWater = hex.type === 'water';
            const isRobberHere = hex.id === board.robberHexId;
            const canPlaceRobberHere = isRobberPlacementPhase && !isWater && !isRobberHere;
            const isRolledHex = isDiceHarvestActive && !isWater && hex.diceNumber === diceSum;
            const isHarvesting = isRolledHex && !isRobberHere;
            const isBlockedByRobber = isRolledHex && isRobberHere;

            return (
              <g
                key={hex.id}
                className="transition-all duration-300"
                onClick={canPlaceRobberHere ? () => onSelectHex?.(hex.id) : undefined}
                style={{ cursor: canPlaceRobberHere ? 'pointer' : undefined }}
              >
                {/* Hex background fallback */}
                <polygon
                  points={pointsStr}
                  fill={TERRAIN_FALLBACK_COLORS[hex.type]}
                />

                {/* Hex AI-generated textured image */}
                <image
                  href={TERRAIN_ASSETS[hex.type]}
                  x={center.x - HEX_RADIUS - 2}
                  y={center.y - HEX_RADIUS - 2}
                  width={(HEX_RADIUS + 2) * 2}
                  height={(HEX_RADIUS + 2) * 2}
                  clipPath={`url(#clip-${hex.id})`}
                  preserveAspectRatio="xMidYMid slice"
                  className={isWater ? 'opacity-90' : 'opacity-100'}
                />

                {/* Ocean subtle wave shimmer overlay without dashed lines */}
                {isWater && (
                  <polygon
                    points={pointsStr}
                    fill="#0284c7"
                    fillOpacity="0.12"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}

                {/* Harvest Golden Glowing Wave Ring */}
                {isHarvesting && (
                  <circle
                    cx={center.x}
                    cy={center.y + 4}
                    r="20"
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="2.5"
                    className="animate-harvest-wave pointer-events-none"
                  />
                )}

                {/* Wooden border outline / Harvest Glow */}
                {isHarvesting ? (
                  <polygon
                    points={pointsStr}
                    fill="#f59e0b"
                    fillOpacity="0.22"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    className="animate-pulse"
                    filter="url(#catan-gold-glow)"
                  />
                ) : isBlockedByRobber ? (
                  <polygon
                    points={pointsStr}
                    fill="#ef4444"
                    fillOpacity="0.22"
                    stroke="#ef4444"
                    strokeWidth="4"
                    className="animate-pulse"
                  />
                ) : isRobberHere ? (
                  <polygon
                    points={pointsStr}
                    fill="#7f1d1d"
                    fillOpacity="0.18"
                    stroke="#dc2626"
                    strokeWidth="3"
                  />
                ) : (
                  <polygon
                    points={pointsStr}
                    fill="none"
                    stroke={canPlaceRobberHere ? '#ef4444' : isWater ? '#0369a1' : '#3d200f'}
                    strokeWidth={canPlaceRobberHere ? 3.5 : 2.2}
                  />
                )}

                {/* Glowing warning halo if targetable for robber placement */}
                {canPlaceRobberHere && (
                  <polygon
                    points={pointsStr}
                    fill="#ef4444"
                    fillOpacity="0.16"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}

                {/* Clean Number Token without letters */}
                {hex.diceNumber !== null && !isWater && (
                  <g
                    transform={`translate(${center.x}, ${center.y + 4})`}
                    filter="url(#catan-shadow)"
                  >
                    {/* Harvest golden aura around number token */}
                    {isHarvesting && (
                      <circle
                        r="20"
                        fill="#fbbf24"
                        fillOpacity="0.35"
                        stroke="#fef08a"
                        strokeWidth="1.5"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer dark wooden ring */}
                    <circle
                      r="16.5"
                      fill="#2e1a0e"
                      stroke={isHarvesting ? '#fbbf24' : '#855829'}
                      strokeWidth={isHarvesting ? 2.5 : 1.5}
                      filter={isHarvesting ? 'url(#catan-gold-glow)' : undefined}
                    />

                    {/* Antique parchment inner circular token */}
                    <circle
                      r="14"
                      fill="url(#token-parchment)"
                      stroke="#b58d59"
                      strokeWidth="0.8"
                    />

                    {/* Centered Dice Number */}
                    <text
                      x="0"
                      y="-1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="14.5"
                      fontWeight="900"
                      fill={hex.diceNumber === 6 || hex.diceNumber === 8 ? '#b91c1c' : '#1e293b'}
                      fontFamily="Cinzel, serif"
                    >
                      {hex.diceNumber}
                    </text>

                    {/* Probability dots */}
                    <g transform="translate(0, 7.5)">
                      {Array.from({ length: getProbabilityDots(hex.diceNumber) }).map((_, i, arr) => {
                        const spacing = 3.5;
                        const startX = -((arr.length - 1) * spacing) / 2;
                        return (
                          <circle
                            key={i}
                            cx={startX + i * spacing}
                            cy="0"
                            r="1.2"
                            fill={hex.diceNumber === 6 || hex.diceNumber === 8 ? '#b91c1c' : '#475569'}
                          />
                        );
                      })}
                    </g>
                  </g>
                )}

                {/* Floating Harvest Ertrag Badge */}
                {isHarvesting && (
                  <g transform={`translate(${center.x}, ${center.y - 25})`} filter="url(#catan-shadow)" className="pointer-events-none">
                    <g className="animate-harvest-badge">
                      <rect x="-24" y="-8.5" width="48" height="17" rx="8.5" fill="#2d1709" stroke="#fbbf24" strokeWidth="1.2" />
                      <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fontWeight="900" fill="#fef08a" fontFamily="MedievalSharp, serif">
                        ✨ Ertrag
                      </text>
                    </g>
                  </g>
                )}

                {/* Floating Blocked Badge if Robber blocks rolled tile */}
                {isBlockedByRobber && (
                  <g transform={`translate(${center.x}, ${center.y - 32})`} filter="url(#catan-shadow)" className="pointer-events-none">
                    <g className="animate-harvest-badge">
                      <rect x="-28" y="-8.5" width="56" height="17" rx="8.5" fill="#3f0f0f" stroke="#ef4444" strokeWidth="1.2" />
                      <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="900" fill="#fca5a5" fontFamily="MedievalSharp, serif">
                        🏴‍☠️ Blockiert
                      </text>
                    </g>
                  </g>
                )}

                {/* Robber Meeple - Static, crisp 3D wooden pawn silhouette with menacing eyes */}
                {isRobberHere && (
                  <g
                    transform={`translate(${center.x}, ${hex.diceNumber !== null ? center.y - 12 : center.y})`}
                    filter="url(#catan-shadow)"
                    className="animate-robber-hover pointer-events-none"
                  >
                    {/* Ground drop shadow */}
                    <ellipse cx="0" cy="15" rx="14" ry="5.5" fill="#000000" opacity="0.65" />

                    {/* Meeple Base / Body */}
                    <path
                      d="M -11,14 C -11,11 -9,8 -5,4 C -4,2 -3,-2 -3,-5 C -4,-6 -4,-7 0,-7 C 4,-7 4,-6 3,-5 C 3,-2 4,2 5,4 C 9,8 11,11 11,14 Z"
                      fill="url(#robber-wood)"
                      stroke="#09090b"
                      strokeWidth="1.2"
                    />

                    {/* Meeple Head */}
                    <circle cx="0" cy="-11" r="6.5" fill="url(#robber-wood)" stroke="#09090b" strokeWidth="1.2" />

                    {/* Menacing red eye gleam */}
                    <ellipse cx="-2.2" cy="-10.5" rx="1.2" ry="1.4" fill="#ef4444" />
                    <ellipse cx="2.2" cy="-10.5" rx="1.2" ry="1.4" fill="#ef4444" />
                    <circle cx="-2.0" cy="-10.7" r="0.4" fill="#ffffff" />
                    <circle cx="2.4" cy="-10.7" r="0.4" fill="#ffffff" />

                    {/* Wood sheen light highlight */}
                    <path
                      d="M -7,12 C -6,9 -3,4 -2,0"
                      stroke="#71717a"
                      strokeWidth="1"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.45"
                    />

                    {/* Prominent Robber Badge - wide enough for text and emoji */}
                    <g transform="translate(0, 20)">
                      <rect x="-27" y="-7" width="54" height="14" rx="4" fill="#18181b" stroke="#ef4444" strokeWidth="1" />
                      <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="900" fill="#fca5a5" fontFamily="Cinzel, serif">
                        🏴‍☠️ RÄUBER
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 1.5 Harbors Layer (Authentic Catan Coastal Piers and Trading Medallions) */}
        <g id="harbors">
          {board.hexes
            .filter((hex) => hex.type === 'water' && hex.harbor)
            .map((waterHex) => {
              const harbor = waterHex.harbor!;
              const waterCenter = hexToPixel(waterHex.q, waterHex.r);

              // Find coastal vertices assigned to this harbor
              const harborVertices = Object.values(board.vertices).filter(
                (v) => v.harbor && v.harbor.waterHexId === waterHex.id
              );

              if (harborVertices.length === 0) return null;

              // Calculate dock medallion position shifted toward water hex center
              let mx = 0;
              let my = 0;
              harborVertices.forEach((v) => {
                mx += v.x;
                my += v.y;
              });
              mx /= harborVertices.length;
              my /= harborVertices.length;

              const dx = waterCenter.x - mx;
              const dy = waterCenter.y - my;
              const dist = Math.hypot(dx, dy) || 1;
              const offsetDist = harborVertices.length > 1 ? 22 : 24;
              const hx = mx + (dx / dist) * offsetDist;
              const hy = my + (dy / dist) * offsetDist;

              // Check if any building is built on one of these harbor vertices
              const activeBuilding = harborVertices.find((v) => v.building !== null)?.building;

              return (
                <g key={`harbor-${waterHex.id}`} filter="url(#catan-shadow)">
                  {/* Wooden Pier Walkways from coastal vertices to harbor medallion */}
                  {harborVertices.map((v) => (
                    <g key={`pier-${v.id}`}>
                      {/* Dark timber substructure */}
                      <line
                        x1={v.x}
                        y1={v.y}
                        x2={hx}
                        y2={hy}
                        stroke="#221308"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                      />
                      {/* Warm timber plank surface */}
                      <line
                        x1={v.x}
                        y1={v.y}
                        x2={hx}
                        y2={hy}
                        stroke="#78350f"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {/* Wood plank texture highlight */}
                      <line
                        x1={v.x}
                        y1={v.y}
                        x2={hx}
                        y2={hy}
                        stroke="#d97706"
                        strokeWidth="1.2"
                        strokeDasharray="2 3"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </g>
                  ))}

                  {/* Harbor Trading Medallion */}
                  <g transform={`translate(${hx}, ${hy})`}>
                    {/* Active building colored glow halo if settled */}
                    {activeBuilding && (
                      <circle
                        r="18"
                        fill={COLOR_MAP[activeBuilding.ownerColor]}
                        fillOpacity="0.3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Outer dark timber ring */}
                    <circle
                      r="14"
                      fill="#261408"
                      stroke={activeBuilding ? COLOR_MAP[activeBuilding.ownerColor] : '#92400e'}
                      strokeWidth={activeBuilding ? 2 : 1.5}
                    />

                    {/* Inner parchment badge */}
                    <circle
                      r="11.5"
                      fill="url(#token-parchment)"
                      stroke="#b45309"
                      strokeWidth="0.8"
                    />

                    {/* Harbor Badge Content */}
                    {harbor.type === 'generic' ? (
                      <g>
                        <text
                          x="0"
                          y="-2"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="9"
                          fontWeight="900"
                          fill="#1e293b"
                          fontFamily="Cinzel, serif"
                        >
                          3:1
                        </text>
                        {/* Anchor nautical symbol */}
                        <text
                          x="0"
                          y="6"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="7.5"
                          fill="#0369a1"
                        >
                          ⚓
                        </text>
                      </g>
                    ) : (
                      <g>
                        <text
                          x="0"
                          y="-4"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="7.5"
                          fontWeight="900"
                          fill="#1e293b"
                          fontFamily="Cinzel, serif"
                        >
                          2:1
                        </text>
                        {/* Resource Mini Token */}
                        <clipPath id={`clip-harbor-icon-${waterHex.id}`}>
                          <circle cx="0" cy="4" r="5" />
                        </clipPath>
                        <image
                          href={`/assets/icon_${harbor.type}.jpg`}
                          x="-5"
                          y="-1"
                          width="10"
                          height="10"
                          clipPath={`url(#clip-harbor-icon-${waterHex.id})`}
                        />
                      </g>
                    )}
                  </g>
                </g>
              );
            })}
        </g>

        {/* 2. Edges (Roads) Layer */}
        {/* All roads belong to the entire team - authentic warm timber pieces */}
        <g id="edges">
          {Object.values(board.edges).map((edge) => {
            const v1 = board.vertices[edge.vertex1Id];
            const v2 = board.vertices[edge.vertex2Id];
            if (!v1 || !v2) return null;

            const isBuilt = edge.road !== null;
            const canClickToBuild = buildableEdgeIds.has(edge.id);
            const mx = (v1.x + v2.x) / 2;
            const my = (v1.y + v2.y) / 2;

            return (
              <g key={edge.id}>
                {/* Built Road: Distinct, authentic neutral 3D wooden beam belonging to the whole team */}
                {isBuilt && edge.road && (
                  <g className="animate-road-draw">
                    {/* Heavy dark outline for maximum visibility on all terrains */}
                    <line
                      x1={v1.x}
                      y1={v1.y}
                      x2={v2.x}
                      y2={v2.y}
                      stroke="#1c0d02"
                      strokeWidth="9.5"
                      strokeLinecap="round"
                    />
                    {/* Rich golden honey wood core (neutral team road) */}
                    <line
                      x1={v1.x}
                      y1={v1.y}
                      x2={v2.x}
                      y2={v2.y}
                      stroke="#c28340"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                    />
                    {/* Warm amber grain surface highlight */}
                    <line
                      x1={v1.x}
                      y1={v1.y}
                      x2={v2.x}
                      y2={v2.y}
                      stroke="#fde047"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  </g>
                )}

                {/* Road Build Point: Subtle circle badge on edge midpoint (NO blue lines across the whole map) */}
                {canClickToBuild && (
                  <g
                    transform={`translate(${mx}, ${my})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasDraggedRef.current) {
                        onSelectEdge(edge.id);
                      }
                    }}
                  >
                    {/* Subtle pulse halo */}
                    <circle r="12" fill="#f59e0b" fillOpacity="0.2" className="animate-ping" />
                    {/* Circle badge */}
                    <circle
                      r="8.5"
                      fill="#92400e"
                      stroke="#fef08a"
                      strokeWidth="1.8"
                      filter="url(#catan-shadow)"
                      className="transition-all duration-200 group-hover:scale-125 group-hover:fill-[#b45309]"
                    />
                    {/* Plus icon inside */}
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 3. Vertices (Settlements and Cities) Layer */}
        <g id="vertices">
          {Object.values(board.vertices).map((vertex) => {
            const building = vertex.building;
            const isBuilt = building !== null;

            const canBuildSettlement = buildableSettlementVertexIds.has(vertex.id);
            const canBuildCity = buildableCityVertexIds.has(vertex.id);

            return (
              <g key={vertex.id} transform={`translate(${vertex.x}, ${vertex.y})`}>
                {/* Built Settlement: Authentic gable cottage with wood trim and player color */}
                {isBuilt && building.type === 'settlement' && (
                  <g className="animate-building-pop" filter="url(#catan-shadow)">
                    {/* Base trim / shadow outline */}
                    <polygon
                      points="0,-14 12,-4 12,10 -12,10 -12,-4"
                      fill="#2b1509"
                    />
                    {/* Player color house body */}
                    <polygon
                      points="0,-12 10,-3 10,8 -10,8 -10,-3"
                      fill={COLOR_MAP[building.ownerColor]}
                    />
                    {/* Roof ridge highlight */}
                    <polygon
                      points="0,-12 9.5,-3 0,-1.5 -9.5,-3"
                      fill="#ffffff"
                      fillOpacity="0.25"
                    />
                    {/* Timber door */}
                    <rect x="-2.5" y="1" width="5" height="7" rx="1" fill="#1e1008" />
                  </g>
                )}

                {/* Built City: Authentic grand fortress with double tower and cathedral crest */}
                {isBuilt && building.type === 'city' && (
                  <g className="animate-city-upgrade" filter="url(#catan-shadow)">
                    {/* Silhouette shadow */}
                    <polygon
                      points="-14,-5 -10,-5 -10,-12 -5,-12 -5,-5 5,-5 5,-12 10,-12 10,-5 14,-5 14,11 -14,11"
                      fill="#1c0f06"
                    />
                    {/* Player color fortress body */}
                    <polygon
                      points="-12.5,-3.5 -8.5,-3.5 -8.5,-10.5 -3.5,-10.5 -3.5,-3.5 3.5,-3.5 3.5,-10.5 8.5,-10.5 8.5,-3.5 12.5,-3.5 12.5,9.5 -12.5,9.5"
                      fill={COLOR_MAP[building.ownerColor]}
                    />
                    {/* Tower crenelations highlight */}
                    <line x1="-8.5" y1="-10.5" x2="-3.5" y2="-10.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.35" />
                    <line x1="3.5" y1="-10.5" x2="8.5" y2="-10.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.35" />
                    {/* Center arched gate */}
                    <path d="M -3.5,9.5 L -3.5,4 Q 0,1.5 3.5,4 L 3.5,9.5 Z" fill="#1c0f06" />
                    {/* Golden heraldic shield in center */}
                    <circle cx="0" cy="-1.5" r="2.5" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />
                  </g>
                )}

                {/* Settlement Build Spot: Subtle circular badge at valid vertices */}
                {canBuildSettlement && (
                  <g
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasDraggedRef.current) {
                        onSelectVertex(vertex.id);
                      }
                    }}
                  >
                    <circle r="13" fill={COLOR_MAP[targetColor]} fillOpacity="0.25" className="animate-ping" />
                    <circle
                      r="9"
                      fill={COLOR_MAP[targetColor]}
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#catan-shadow)"
                      className="transition-all duration-200 group-hover:scale-130"
                    />
                    <polygon points="0,-4 3,0 1.5,0 1.5,3 -1.5,3 -1.5,0 -3,0" fill="#ffffff" />
                  </g>
                )}

                {/* City Upgrade Spot: Pulsing golden upgrade halo strictly around existing settlements */}
                {canBuildCity && (
                  <g
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasDraggedRef.current) {
                        onSelectVertex(vertex.id);
                      }
                    }}
                  >
                    <circle
                      r="16"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                    {/* Golden upgrade crest badge */}
                    <g transform="translate(0, -18)">
                      <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" filter="url(#catan-shadow)" />
                      <path d="M 0,-3 L 3,1 L -3,1 Z" fill="#18181b" />
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
