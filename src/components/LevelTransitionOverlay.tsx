import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Dna, Zap } from 'lucide-react';
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
  levelSubtitle = 'Melintasi Lingkungan Seluler 3D...',
  badge = 'Portal Dimensi Seluler',
  accentColor = '#10b981',
  onMidpoint,
  onComplete,
  durationMs = 750,
}) => {
  // Phase: 'idle' | 'warping' | 'dark_midpoint' | 'fade_in'
  const [phase, setPhase] = useState<'idle' | 'warping' | 'dark_midpoint' | 'fade_in'>('idle');

  // Keep latest callbacks in refs so re-renders of the parent DO NOT cancel or restart timers!
  const onMidpointRef = useRef(onMidpoint);
  onMidpointRef.current = onMidpoint;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }

    try {
      sounds.playWarp();
    } catch {}

    setPhase('warping');

    // Step 1: Warp close-in (240ms)
    const midTimer = setTimeout(() => {
      setPhase('dark_midpoint');
      if (onMidpointRef.current) {
        try {
          onMidpointRef.current();
        } catch (err) {
          console.warn('Warp midpoint error:', err);
        }
      }

      // Step 2: Instant smooth reveal (160ms)
      const fadeTimer = setTimeout(() => {
        setPhase('fade_in');

        // Step 3: Complete & clean dismiss (220ms)
        const completeTimer = setTimeout(() => {
          setPhase('idle');
          if (onCompleteRef.current) {
            try {
              onCompleteRef.current();
            } catch (err) {
              console.warn('Warp complete error:', err);
            }
          }
        }, 220);

        return () => clearTimeout(completeTimer);
      }, 160);

      return () => clearTimeout(fadeTimer);
    }, 240);

    // Absolute fail-safe: guaranteed force dismiss after 950ms so screen CAN NEVER get stuck
    const safetyTimer = setTimeout(() => {
      setPhase('idle');
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 950);

    return () => {
      clearTimeout(midTimer);
      clearTimeout(safetyTimer);
    };
  }, [isActive]);

  if (!isActive && phase === 'idle') return null;

  return (
    <div
      onClick={() => {
        // Immediate escape hatch if user clicks
        setPhase('idle');
        onCompleteRef.current?.();
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden select-none transition-all cursor-pointer ${
        phase === 'dark_midpoint'
          ? 'bg-black opacity-100 backdrop-blur-2xl pointer-events-auto'
          : phase === 'warping'
          ? 'bg-black/90 opacity-90 backdrop-blur-md pointer-events-auto'
          : phase === 'fade_in'
          ? 'bg-black/20 opacity-20 backdrop-blur-none pointer-events-none'
          : 'opacity-0 pointer-events-none'
      }`}
      style={{
        transitionDuration: phase === 'fade_in' ? '200ms' : '180ms',
      }}
    >
      {/* Dynamic Cytological Warp Tunnel & Radial Streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial Gradient */}
        <div
          className={`absolute inset-[-40%] w-[180%] h-[180%] origin-center transition-transform duration-500 ${
            phase === 'warping' ? 'scale-125 rotate-30' : 'scale-100 rotate-0'
          }`}
          style={{
            background: `radial-gradient(circle at center, transparent 20%, rgba(16, 185, 129, 0.2) 50%, rgba(6, 78, 59, 0.6) 80%, #000000 100%)`,
          }}
        />

        {/* Warp Stream SVG Rings */}
        <svg className="absolute inset-0 w-full h-full opacity-60">
          <circle
            cx="50%"
            cy="50%"
            r="100"
            fill="none"
            stroke={accentColor}
            strokeWidth="3"
            className="animate-ping opacity-40"
          />
          <circle
            cx="50%"
            cy="50%"
            r="200"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            className="animate-pulse opacity-40"
          />
        </svg>
      </div>

      {/* Center Cinematic Warp Badge */}
      <div
        className={`relative z-10 flex flex-col items-center text-center p-6 max-w-sm mx-4 transition-all duration-200 transform ${
          phase === 'warping' || phase === 'dark_midpoint'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-3'
        }`}
      >
        {/* Glowing Portal Orb Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl mb-3 border-2 border-white/60 bg-emerald-500/20"
          style={{
            boxShadow: `0 0 40px ${accentColor}88`,
          }}
        >
          <Dna className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* Level Badge Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1.5 shadow-md">
          <Zap className="w-3 h-3 fill-current text-amber-400" />
          <span>{badge}</span>
        </div>

        {/* Level Title */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow">
          {levelTitle}
        </h3>

        {/* Subtitle */}
        <p className="text-xs text-slate-300 mt-1 font-medium flex items-center gap-1 drop-shadow">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{levelSubtitle}</span>
        </p>
      </div>
    </div>
  );
};
