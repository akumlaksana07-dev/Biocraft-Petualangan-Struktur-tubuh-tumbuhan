import React, { useState } from 'react';
import { ORGANELLES } from '../data/biologyData';
import { OrganelleInfo, PlayerData } from '../types/game';
import { Compass, Maximize2, Minimize2, ZoomIn, ZoomOut, MapPin, Eye, EyeOff } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface MiniMapProps {
  playerPos: { x: number; y: number; z: number };
  playerRotY: number;
  remotePlayers: PlayerData[];
  collectibles: { id: string; x: number; z: number; collected: boolean }[];
  onSelectOrganelle?: (org: OrganelleInfo) => void;
  onTeleportTo?: (pos: [number, number, number]) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerPos,
  playerRotY,
  remotePlayers,
  collectibles,
  onSelectOrganelle,
  onTeleportTo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'zoomed'>('normal');
  const [hoveredOrganelle, setHoveredOrganelle] = useState<OrganelleInfo | null>(null);

  // Map coordinate conversion
  // World bounds: Radius 45 (-45 to +45)
  // MiniMap viewBox: 200 x 200, center at (100, 100)
  const mapSize = isExpanded ? 240 : 130;
  const worldRadius = zoomLevel === 'normal' ? 46 : 28;
  const scale = (mapSize / 2 - 8) / worldRadius;

  const worldToMap = (x: number, z: number) => {
    // In our 3D world: X is horizontal, Z is vertical (depth)
    // In 2D map: X is horizontal (px), Y is vertical (pz)
    const mapCenterX = mapSize / 2;
    const mapCenterY = mapSize / 2;

    // Relative to center if zoomed, or fixed center
    const originX = zoomLevel === 'zoomed' ? playerPos.x : 0;
    const originZ = zoomLevel === 'zoomed' ? playerPos.z : 0;

    const mx = mapCenterX + (x - originX) * scale;
    const my = mapCenterY + (z - originZ) * scale;
    return { x: mx, y: my };
  };

  const playerMapPos = worldToMap(playerPos.x, playerPos.z);
  // Three.js rotY: 0 is facing negative Z (north). Map rotation:
  const playerDeg = (-playerRotY * 180) / Math.PI;

  return (
    <div
      className="absolute z-30 pointer-events-auto transition-all duration-300"
      style={{
        bottom: '168px',
        right: '16px',
      }}
    >
      {/* Minimized Pill Toggle */}
      {isMinimized ? (
        <button
          onClick={() => {
            sounds.playScan();
            setIsMinimized(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-emerald-300 hover:text-white rounded-2xl border border-emerald-400/50 shadow-xl text-xs font-bold backdrop-blur-md active:scale-95 transition-all"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Buka Mini-Map</span>
        </button>
      ) : (
        <div className="relative flex flex-col items-end">
          {/* Top Control Bar of Mini-Map */}
          <div className="flex items-center justify-between w-full px-2 py-1 bg-slate-950/85 backdrop-blur-md rounded-t-2xl border border-emerald-500/30 text-[10px] text-slate-300 mb-[-1px]">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <Compass className="w-3.5 h-3.5" />
              <span>Peta Sel 3D</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Zoom Toggle */}
              <button
                onClick={() => {
                  sounds.playScan();
                  setZoomLevel((z) => (z === 'normal' ? 'zoomed' : 'normal'));
                }}
                className="p-1 hover:bg-white/10 rounded text-slate-300 transition-colors"
                title={zoomLevel === 'normal' ? 'Perbesar (Zoom In)' : 'Lihat Seluruh Sel (Zoom Out)'}
              >
                {zoomLevel === 'normal' ? <ZoomIn className="w-3 h-3" /> : <ZoomOut className="w-3 h-3" />}
              </button>

              {/* Expand/Size Toggle */}
              <button
                onClick={() => {
                  sounds.playScan();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 hover:bg-white/10 rounded text-slate-300 transition-colors"
                title={isExpanded ? 'Kecilkan' : 'Besarkan'}
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>

              {/* Minimize to icon */}
              <button
                onClick={() => {
                  sounds.playScan();
                  setIsMinimized(true);
                }}
                className="p-1 hover:bg-white/10 rounded text-slate-300 transition-colors"
                title="Sembunyikan Mini-Map"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div
            className="relative bg-slate-950/90 backdrop-blur-md rounded-b-2xl border border-emerald-500/40 shadow-2xl overflow-hidden"
            style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
          >
            <svg
              width={mapSize}
              height={mapSize}
              className="w-full h-full select-none"
              style={{ overflow: 'hidden' }}
            >
              {/* Background Cytosol Grid Web */}
              <defs>
                <radialGradient id="cytosolGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#064e3b" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#022c22" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#02160e" stopOpacity="1" />
                </radialGradient>
              </defs>

              <rect width={mapSize} height={mapSize} fill="url(#cytosolGradient)" />

              {/* Cytoskeleton web lines */}
              <line
                x1={worldToMap(0, 0).x}
                y1={worldToMap(0, 0).y}
                x2={worldToMap(-18, 10).x}
                y2={worldToMap(-18, 10).y}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="2,2"
                opacity="0.4"
              />
              <line
                x1={worldToMap(0, 0).x}
                y1={worldToMap(0, 0).y}
                x2={worldToMap(14, -6).x}
                y2={worldToMap(14, -6).y}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="2,2"
                opacity="0.4"
              />
              <line
                x1={worldToMap(0, 0).x}
                y1={worldToMap(0, 0).y}
                x2={worldToMap(0, -14).x}
                y2={worldToMap(0, -14).y}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="2,2"
                opacity="0.4"
              />

              {/* Outer Cell Wall Boundary (Rigid Polygon) */}
              <circle
                cx={worldToMap(0, 0).x}
                cy={worldToMap(0, 0).y}
                r={44 * scale}
                fill="none"
                stroke="#166534"
                strokeWidth="5"
                strokeDasharray="6,3"
                opacity="0.9"
              />

              {/* Inner Plasma Membrane */}
              <circle
                cx={worldToMap(0, 0).x}
                cy={worldToMap(0, 0).y}
                r={41 * scale}
                fill="none"
                stroke="#059669"
                strokeWidth="1.5"
                opacity="0.75"
              />

              {/* Central Vacuole representation (large blue reservoir) */}
              {(() => {
                const vac = worldToMap(18, -8);
                return (
                  <circle
                    cx={vac.x}
                    cy={vac.y}
                    r={8.5 * scale}
                    fill="#0284c7"
                    fillOpacity="0.35"
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                );
              })()}

              {/* Nucleus representation (purple double-membrane) */}
              {(() => {
                const nuc = worldToMap(0, -18);
                return (
                  <circle
                    cx={nuc.x}
                    cy={nuc.y}
                    r={7 * scale}
                    fill="#7c3aed"
                    fillOpacity="0.4"
                    stroke="#a855f7"
                    strokeWidth="1"
                  />
                );
              })()}

              {/* Collectible ATP Gems */}
              {collectibles
                .filter((c) => !c.collected)
                .map((item) => {
                  const p = worldToMap(item.x, item.z);
                  return (
                    <circle
                      key={item.id}
                      cx={p.x}
                      cy={p.y}
                      r="2"
                      fill="#facc15"
                      stroke="#d97706"
                      strokeWidth="0.5"
                    />
                  );
                })}

              {/* Organelle Markers on the Map */}
              {ORGANELLES.map((org) => {
                const p = worldToMap(org.location[0], org.location[2]);
                const isHovered = hoveredOrganelle?.id === org.id;

                return (
                  <g
                    key={org.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredOrganelle(org)}
                    onMouseLeave={() => setHoveredOrganelle(null)}
                    onClick={() => {
                      sounds.playScan();
                      if (onSelectOrganelle) onSelectOrganelle(org);
                      if (onTeleportTo) onTeleportTo(org.location);
                    }}
                  >
                    {/* Pulsing ring on hover */}
                    {isHovered && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isExpanded ? '10' : '7'}
                        fill="none"
                        stroke={org.color}
                        strokeWidth="1.5"
                        opacity="0.8"
                      />
                    )}

                    {/* Organelle marker dot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isExpanded ? '5' : '3.5'}
                      fill={org.color}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />

                    {/* Label if expanded */}
                    {isExpanded && (
                      <text
                        x={p.x}
                        y={p.y - 7}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="7"
                        fontWeight="bold"
                        className="pointer-events-none drop-shadow"
                      >
                        {org.name.split(' ')[0]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Remote Players (Classmates) */}
              {remotePlayers.map((rp) => {
                const rpPos = worldToMap(rp.x, rp.z);
                return (
                  <g key={rp.id}>
                    <circle
                      cx={rpPos.x}
                      cy={rpPos.y}
                      r={isExpanded ? '4' : '3'}
                      fill={rp.customization?.shirtColor || '#2563eb'}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    {isExpanded && (
                      <text
                        x={rpPos.x}
                        y={rpPos.y + 8}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="6"
                        fontWeight="600"
                        className="pointer-events-none"
                      >
                        {rp.name.slice(0, 6)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Local Player (Hero Avatar with FOV Cone) */}
              <g transform={`translate(${playerMapPos.x}, ${playerMapPos.y})`}>
                {/* Vision FOV Cone */}
                <path
                  d="M 0 0 L -12 -24 A 26 26 0 0 1 12 -24 Z"
                  fill="#38bdf8"
                  fillOpacity="0.25"
                  transform={`rotate(${playerDeg})`}
                />

                {/* Heading Arrow Pointer */}
                <polygon
                  points="0,-8 4,3 0,1 -4,3"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1"
                  transform={`rotate(${playerDeg})`}
                />

                {/* Player Center Beacon */}
                <circle cx="0" cy="0" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
              </g>

              {/* Compass Rose */}
              <text x={mapSize - 10} y="12" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="end">
                U (Apikal)
              </text>
            </svg>

            {/* Hovered Organelle Info Tooltip */}
            {hoveredOrganelle && (
              <div className="absolute top-1 inset-x-1 p-1.5 bg-slate-900/95 border border-emerald-400 rounded-xl text-center shadow-lg pointer-events-none animate-fadeIn">
                <div className="text-[10px] font-bold text-white flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{hoveredOrganelle.name}</span>
                </div>
                <div className="text-[9px] text-emerald-300 font-mono">
                  Jarak: ~
                  {Math.round(
                    Math.hypot(playerPos.x - hoveredOrganelle.location[0], playerPos.z - hoveredOrganelle.location[2])
                  )}
                  m
                </div>
              </div>
            )}
          </div>

          {/* Bottom Coordinate Bar */}
          <div className="flex items-center justify-between w-full px-2 py-0.5 bg-slate-950/80 backdrop-blur-md rounded-b-xl text-[9px] font-mono text-slate-400 mt-[-1px] border border-emerald-500/30 border-t-0">
            <span>
              X: {Math.round(playerPos.x)} Z: {Math.round(playerPos.z)}
            </span>
            <span className="text-emerald-400 font-bold">{Math.round(playerPos.y)}m Turgor</span>
          </div>
        </div>
      )}
    </div>
  );
};
