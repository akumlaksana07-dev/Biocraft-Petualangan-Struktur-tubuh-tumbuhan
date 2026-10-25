import React, { useEffect, useState } from 'react';
import { Sparkles, Dna, Compass, Zap } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface LevelTransitionOverlayProps {
  isActive: boolean;
  levelTitle?: string;
  levelSubtitle?: string;
  badge?: string;
  accentColor?: string;
  onMidpoint?: () => void;
  onComplete?: () => void;
  durationMs?: number;
}

export const LevelTransitionOverlay: React.FC<LevelTransitionOverlayProps> = ({
  isActive,
  levelTitle = 'Memasuki Tingkatan Baru',
  levelSubtitle = 'Menginisialisasi Bank Soal Kurikulum Merdeka...',
  badge = 'Portal Dimensi Seluler',
  accentColor = '#10b981',
  onMidpoint,
  onComplete,
  durationMs = 950,
}) => {
  // Phase: 'idle' | 'warping' | 'dark_midpoint' | 'fade_in' | 'done'
  const [phase, setPhase] = useState<'idle' | 'warping' | 'dark_midpoint' | 'fade_in'>('idle');

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }

    sounds.playWarp();
    setPhase('warping');

    // 1. Warping speed-lines & vignette closing in (~380ms)
    const midTimer = setTimeout(() => {
      setPhase('dark_midpoint');
      if (onMidpoint) onMidpoint();

      // 2. Hold dark for instant smooth state swap (~240ms)
      const fadeTimer = setTimeout(() => {
        setPhase('fade_in');

        // 3. Smooth reveal back to clear (~330ms)
        const completeTimer = setTimeout(() => {
          setPhase('idle');
          if (onComplete) onComplete();
        }, 330);

        return () => clearTimeout(completeTimer);
      }, 240);

      return () => clearTimeout(fadeTimer);
    }, 380);

    return () => clearTimeout(midTimer);
  }, [isActive, onMidpoint, onComplete, durationMs]);

  if (!isActive && phase === 'idle') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] pointer-events-auto flex items-center justify-center overflow-hidden transition-all select-none ${
        phase === 'dark_midpoint'
          ? 'bg-black opacity-100 backdrop-blur-2xl'
          : phase === 'warping'
          ? 'bg-black/95 opacity-95 backdrop-blur-xl'
          : phase === 'fade_in'
          ? 'bg-black/40 opacity-40 backdrop-blur-sm'
          : 'opacity-0 pointer-events-none'
      }`}
      style={{
        transitionDuration: phase === 'fade_in' ? '320ms' : '280ms',
      }}
    >
      {/* Dynamic Cytological Warp Tunnel & Radial Streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Hyperspace Radial Speed Rays */}
        <div
          className={`absolute inset-[-50%] w-[200%] h-[200%] origin-center transition-transform duration-700 ${
            phase === 'warping' ? 'scale-150 rotate-45' : 'scale-100 rotate-0'
          }`}
          style={{
            background: `radial-gradient(circle at center, transparent 15%, rgba(16, 185, 129, 0.15) 45%, rgba(6, 78, 59, 0.5) 75%, #000000 100%)`,
          }}
        />

        {/* Warp Stream Particle Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-60">
          <defs>
            <radialGradient id="warpGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Circular Shockwave Rings */}
          <circle
            cx="50%"
            cy="50%"
            r="120"
            fill="none"
            stroke={accentColor}
            strokeWidth="3"
            className="animate-ping opacity-30"
          />
          <circle
            cx="50%"
            cy="50%"
            r="240"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            className="animate-pulse opacity-40"
          />

          {/* Radial cytological rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="50%"
              y1="50%"
              x2={`${50 + 60 * Math.cos((deg * Math.PI) / 180)}%`}
              y2={`${50 + 60 * Math.sin((deg * Math.PI) / 180)}%`}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="8,12"
              opacity="0.35"
              className="animate-pulse"
            />
          ))}
        </svg>
      </div>

      {/* Center Cinematic Warp Badge */}
      <div
        className={`relative z-10 flex flex-col items-center text-center p-6 max-w-md mx-4 transition-all duration-300 transform ${
          phase === 'warping'
            ? 'scale-110 opacity-100 translate-y-0'
            : phase === 'dark_midpoint'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-4'
        }`}
      >
        {/* Glowing Portal Orb Icon */}
        <div
          className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mb-4 border-2 border-white/60 animate-bounce"
          style={{
            backgroundColor: `${accentColor}33`,
            boxShadow: `0 0 50px ${accentColor}88, inset 0 0 20px ${accentColor}66`,
          }}
        >
          <Dna className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 rounded-3xl border border-white/30 animate-pulse" />
        </div>

        {/* Level Badge Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black text-emerald-300 uppercase tracking-widest mb-2 shadow-lg">
          <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span>{badge}</span>
        </div>

        {/* Level Title */}
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide drop-shadow-md">
          {levelTitle}
        </h3>

        {/* Level Subtitle */}
        <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium flex items-center gap-1.5 drop-shadow">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span>{levelSubtitle}</span>
        </p>

        {/* Warping Progress Line */}
        <div className="w-48 h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 rounded-full animate-pulse transition-all duration-500"
            style={{
              width: phase === 'warping' ? '65%' : phase === 'dark_midpoint' ? '100%' : '15%',
            }}
          />
        </div>
      </div>
    </div>
  );
};
