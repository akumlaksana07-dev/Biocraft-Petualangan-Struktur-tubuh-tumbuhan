import React, { useState, useMemo } from 'react';
import { ORGANELLES } from '../data/biologyData';
import { OrganelleInfo } from '../types/game';
import { Navigation, Compass, ChevronDown, CheckCircle2, Target, MapPin } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface DirectionalIndicatorProps {
  playerPos: { x: number; y: number; z: number };
  cameraTheta: number; // Camera azimuth angle (radians)
  onTeleportTo?: (pos: [number, number, number]) => void;
  onOpenOrganelleScan?: (org: OrganelleInfo) => void;
}

export const DirectionalIndicator: React.FC<DirectionalIndicatorProps> = ({
  playerPos,
  cameraTheta,
  onTeleportTo,
  onOpenOrganelleScan,
}) => {
  // Target organelle mode: 'auto_nearest' or specific organelle id
  const [selectedTargetId, setSelectedTargetId] = useState<string>('auto_nearest');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Compute nearest organelle
  const nearestOrganelle = useMemo(() => {
    let nearest: OrganelleInfo = ORGANELLES[0];
    let minD = Infinity;

    for (const org of ORGANELLES) {
      const d = Math.hypot(org.location[0] - playerPos.x, org.location[2] - playerPos.z);
      if (d < minD) {
        minD = d;
        nearest = org;
      }
    }
    return nearest;
  }, [playerPos.x, playerPos.z]);

  // Active target organelle
  const activeOrganelle = useMemo(() => {
    if (selectedTargetId === 'auto_nearest') {
      return nearestOrganelle;
    }
    return ORGANELLES.find((o) => o.id === selectedTargetId) || nearestOrganelle;
  }, [selectedTargetId, nearestOrganelle]);

  // Compute distance and angle
  const { distanceMeters, relativeAngleDeg, isAtTarget } = useMemo(() => {
    const dx = activeOrganelle.location[0] - playerPos.x;
    const dz = activeOrganelle.location[2] - playerPos.z;
    const dist = Math.hypot(dx, dz);

    // World angle: in Three.js Z is forward/back, X is right/left
    // Angle in world: 0 is +Z, pi/2 is +X, etc.
    const worldAngle = Math.atan2(dx, dz);

    // Relative angle against camera view angle
    // In our camera system: cameraTheta is the horizontal angle
    let diff = worldAngle - cameraTheta;

    // Normalize diff to -PI to +PI
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;

    const angleDeg = (diff * 180) / Math.PI;

    return {
      distanceMeters: Math.round(dist),
      relativeAngleDeg: angleDeg,
      isAtTarget: dist <= 6.0,
    };
  }, [activeOrganelle, playerPos.x, playerPos.z, cameraTheta]);

  return (
    <div className="absolute top-16 sm:top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center">
      {/* Main Direction Compass Capsule */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-400/50 shadow-2xl backdrop-blur-md text-white select-none transition-all">
        {/* The Dynamic Directional Arrow (Panah Arah) */}
        <div
          className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-100 ${
            isAtTarget
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 animate-pulse'
              : 'bg-slate-800 border border-emerald-400/40 text-emerald-400'
          }`}
          title={`Arah ke ${activeOrganelle.name}`}
        >
          {isAtTarget ? (
            <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `rotate(${relativeAngleDeg}deg)`,
              }}
            >
              {/* Sharp Sci-fi Direction Pointer Arrow */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow">
                {/* Pointer Arrow Head */}
                <path
                  d="M12 2L19 19L12 15L5 19L12 2Z"
                  fill={activeOrganelle.color || '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Waypoint Target Info */}
        <div className="flex flex-col text-left cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
              {selectedTargetId === 'auto_nearest' ? 'Terdekat' : 'Target'}
            </span>
            <span className="text-xs font-black text-white flex items-center gap-1">
              <span>{activeOrganelle.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            {isAtTarget ? (
              <span className="text-emerald-300 font-bold">🎯 Kamu telah sampai di sini!</span>
            ) : (
              <>
                <span className="font-mono text-amber-300 font-bold">{distanceMeters} m</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  {Math.abs(relativeAngleDeg) < 20
                    ? 'Lurus di depan'
                    : relativeAngleDeg > 0
                    ? 'Belok ke kanan'
                    : 'Belok ke kiri'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Action Button */}
        {isAtTarget && onOpenOrganelleScan && (
          <button
            onClick={() => {
              sounds.playScan();
              onOpenOrganelleScan(activeOrganelle);
            }}
            className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-[10px] rounded-full shadow-md active:scale-95 transition-all"
          >
            Pelajari
          </button>
        )}
      </div>

      {/* Target Organelle Selector Dropdown */}
      {isDropdownOpen && (
        <div className="mt-2 w-64 max-h-60 overflow-y-auto bg-slate-950/95 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">
            Pilih Sasaran Penunjuk Arah:
          </div>

          {/* Option: Auto Nearest */}
          <button
            onClick={() => {
              sounds.playScan();
              setSelectedTargetId('auto_nearest');
              setIsDropdownOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left ${
              selectedTargetId === 'auto_nearest'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Otomatis (Organel Terdekat)</span>
            </div>
            {selectedTargetId === 'auto_nearest' && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>

          {/* List of all organelles */}
          {ORGANELLES.map((org) => {
            const isCurrent = selectedTargetId === org.id;
            const dist = Math.round(
              Math.hypot(org.location[0] - playerPos.x, org.location[2] - playerPos.z)
            );

            return (
              <button
                key={org.id}
                onClick={() => {
                  sounds.playScan();
                  setSelectedTargetId(org.id);
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isCurrent
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: org.color }}
                  />
                  <span>{org.name}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{dist}m</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
