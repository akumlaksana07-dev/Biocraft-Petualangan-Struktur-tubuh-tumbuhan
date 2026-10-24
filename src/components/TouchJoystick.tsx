import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Zap, Scan, Sparkles } from 'lucide-react';

interface TouchJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onCameraRotate: (deltaX: number, deltaY: number) => void;
  onJump: () => void;
  onSprintToggle: (active: boolean) => void;
  onScan: () => void;
  onEmote: (type: 'cheer' | 'dance') => void;
  nearbyOrganelleName: string | null;
  isSprinting: boolean;
}

export const TouchJoystick: React.FC<TouchJoystickProps> = ({
  onMove,
  onCameraRotate,
  onJump,
  onSprintToggle,
  onScan,
  onEmote,
  nearbyOrganelleName,
  isSprinting,
}) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [showEmotePicker, setShowEmotePicker] = useState(false);

  const joystickTouchId = useRef<number | null>(null);
  const cameraTouchId = useRef<number | null>(null);
  const cameraLastPos = useRef<{ x: number; y: number } | null>(null);
  const joystickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const radius = 55;

  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const screenWidth = window.innerWidth;

      // Left 45% of screen = Joystick area
      if (touch.clientX < screenWidth * 0.45 && joystickTouchId.current === null) {
        joystickTouchId.current = touch.identifier;
        joystickCenter.current = { x: touch.clientX, y: touch.clientY };
        setKnobPos({ x: 0, y: 0 });
        setIsJoystickActive(true);
      }
      // Right 55% of screen (outside action buttons) = Camera look area
      else if (touch.clientX >= screenWidth * 0.45 && cameraTouchId.current === null) {
        cameraTouchId.current = touch.identifier;
        cameraLastPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === joystickTouchId.current) {
          const dx = touch.clientX - joystickCenter.current.x;
          const dy = touch.clientY - joystickCenter.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const clampedDist = Math.min(dist, radius);
          const angle = Math.atan2(dy, dx);

          const nx = Math.cos(angle) * clampedDist;
          const ny = Math.sin(angle) * clampedDist;

          setKnobPos({ x: nx, y: ny });

          // Normalize vector (-1 to 1)
          const normX = nx / radius;
          const normY = ny / radius;
          onMove({ x: normX, y: normY });
        } else if (touch.identifier === cameraTouchId.current && cameraLastPos.current) {
          const dx = touch.clientX - cameraLastPos.current.x;
          const dy = touch.clientY - cameraLastPos.current.y;
          cameraLastPos.current = { x: touch.clientX, y: touch.clientY };
          onCameraRotate(dx * 0.005, dy * 0.005);
        }
      }
    },
    [onMove, onCameraRotate, radius]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId.current) {
          joystickTouchId.current = null;
          setKnobPos({ x: 0, y: 0 });
          setIsJoystickActive(false);
          onMove({ x: 0, y: 0 });
        } else if (touch.identifier === cameraTouchId.current) {
          cameraTouchId.current = null;
          cameraLastPos.current = null;
        }
      }
    },
    [onMove]
  );

  useEffect(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
    >
      {/* Dynamic or Fixed Virtual Joystick on the bottom left */}
      <div
        className="pointer-events-auto absolute bottom-24 left-8 w-36 h-36 rounded-full bg-slate-900/50 border-2 border-emerald-400/40 flex items-center justify-center backdrop-blur-sm"
        style={{ touchAction: 'none' }}
      >
        <div
          className={`w-14 h-14 rounded-full border border-white/50 shadow-lg transition-transform duration-75 ${
            isJoystickActive ? 'bg-emerald-500/80 scale-110' : 'bg-white/40'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-white/90 text-xs font-bold">
            🕹️
          </div>
        </div>
      </div>

      {/* Action Buttons on the bottom right (Roblox style layout) */}
      <div className="pointer-events-auto absolute bottom-24 right-6 flex flex-col items-end gap-3">
        {/* Nearby Organelle Scan Button */}
        {nearbyOrganelleName && (
          <button
            onClick={onScan}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-bold px-4 py-2.5 rounded-full shadow-lg border-2 border-emerald-200 animate-bounce"
          >
            <Scan className="w-5 h-5" />
            <span className="text-sm">Scan {nearbyOrganelleName}!</span>
          </button>
        )}

        {/* Emote Picker popup */}
        {showEmotePicker && (
          <div className="flex gap-2 bg-slate-900/90 p-2 rounded-2xl border border-white/20 shadow-xl mb-1">
            <button
              onClick={() => {
                onEmote('dance');
                setShowEmotePicker(false);
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl active:scale-90"
            >
              🕺 Joget
            </button>
            <button
              onClick={() => {
                onEmote('cheer');
                setShowEmotePicker(false);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl active:scale-90"
            >
              🎉 Semangat
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Emote toggle */}
          <button
            onClick={() => setShowEmotePicker(!showEmotePicker)}
            className="w-12 h-12 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white flex items-center justify-center border border-white/20 shadow-md active:scale-90"
            title="Animasi / Emote"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </button>

          {/* Sprint / Turbo Toggle */}
          <button
            onClick={() => onSprintToggle(!isSprinting)}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all active:scale-90 shadow-md ${
              isSprinting
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/50'
                : 'bg-slate-800/80 text-slate-200 border-white/20'
            }`}
            title="Lari Cepat (Sprint)"
          >
            <Zap className="w-5 h-5 fill-current" />
          </button>

          {/* Jump Button (Roblox Classic Big Jump Button) */}
          <button
            onClick={onJump}
            className="w-16 h-16 rounded-full bg-gradient-to-t from-emerald-600 to-green-500 active:from-emerald-700 active:to-green-600 text-white flex flex-col items-center justify-center border-2 border-white/60 shadow-xl active:scale-95"
            title="Lompat (Space / Jump)"
          >
            <ArrowUp className="w-7 h-7 stroke-[3]" />
            <span className="text-[10px] font-black tracking-widest uppercase">LOMPAT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
