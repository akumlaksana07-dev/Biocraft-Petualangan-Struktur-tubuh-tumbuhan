import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowUp,
  Zap,
  Scan,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sliders,
} from 'lucide-react';

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

type NavMode = 'hybrid' | 'dpad' | 'analog';

export const TouchJoystick: React.FC<TouchJoystickProps> = React.memo(({
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
  const [navMode, setNavMode] = useState<NavMode>('hybrid');

  // Track active directional buttons
  const [activeDirections, setActiveDirections] = useState<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const cameraTouchId = useRef<number | null>(null);
  const cameraLastPos = useRef<{ x: number; y: number } | null>(null);
  const dpadPressedRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const radius = 54;
  const deadzone = 9;

  // Sync D-Pad vector calculation
  const updateDpadVector = useCallback(() => {
    const { up, down, left, right } = dpadPressedRef.current;
    let x = 0;
    let y = 0;
    if (up) y -= 1;
    if (down) y += 1;
    if (left) x -= 1;
    if (right) x += 1;

    // Normalize diagonal D-Pad movement
    if (x !== 0 && y !== 0) {
      x *= 0.7071;
      y *= 0.7071;
    }

    onMove({ x, y });
    setKnobPos({ x: x * 36, y: y * 36 });
    setIsJoystickActive(x !== 0 || y !== 0);
  }, [onMove]);

  // Touch Start Handler
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const screenWidth = window.innerWidth;

      // Check if touch is within or near the joystick base
      if (joystickBaseRef.current) {
        const rect = joystickBaseRef.current.getBoundingClientRect();
        const baseCenterX = rect.left + rect.width / 2;
        const baseCenterY = rect.top + rect.height / 2;
        const distToBase = Math.hypot(touch.clientX - baseCenterX, touch.clientY - baseCenterY);

        // Within 85px of base center = Joystick touch
        if (distToBase < 85 && joystickTouchId.current === null) {
          joystickTouchId.current = touch.identifier;
          setIsJoystickActive(true);
          handleJoystickMoveFromTouch(touch.clientX, touch.clientY);
          continue;
        }
      }

      // Camera look area: Right 55% of screen (outside action buttons)
      if (touch.clientX >= screenWidth * 0.45 && cameraTouchId.current === null) {
        cameraTouchId.current = touch.identifier;
        cameraLastPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  // Joystick move calculation with deadzone & cardinal stabilization
  const handleJoystickMoveFromTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rawDx = clientX - centerX;
      const rawDy = clientY - centerY;
      const dist = Math.hypot(rawDx, rawDy);

      // Deadzone check
      if (dist < deadzone) {
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        setActiveDirections({ up: false, down: false, left: false, right: false });
        return;
      }

      const clampedDist = Math.min(dist, radius);
      let angle = Math.atan2(rawDy, rawDx);

      // Cardinal direction snapping (stabilizes straight walking within ~16 degrees)
      const snapMargin = 0.28; // ~16 degrees
      // Up (-PI / 2)
      if (Math.abs(angle - -Math.PI / 2) < snapMargin) angle = -Math.PI / 2;
      // Down (PI / 2)
      else if (Math.abs(angle - Math.PI / 2) < snapMargin) angle = Math.PI / 2;
      // Right (0)
      else if (Math.abs(angle) < snapMargin) angle = 0;
      // Left (PI or -PI)
      else if (Math.abs(angle - Math.PI) < snapMargin || Math.abs(angle - -Math.PI) < snapMargin)
        angle = Math.PI;

      const nx = Math.cos(angle) * clampedDist;
      const ny = Math.sin(angle) * clampedDist;

      setKnobPos({ x: nx, y: ny });

      // Scale vector proportionally from deadzone to radius
      const normalizedMagnitude = (clampedDist - deadzone) / (radius - deadzone);
      const vecX = Math.cos(angle) * normalizedMagnitude;
      const vecY = Math.sin(angle) * normalizedMagnitude;

      onMove({ x: vecX, y: vecY });

      // Update visual direction indicators
      setActiveDirections({
        up: vecY < -0.35,
        down: vecY > 0.35,
        left: vecX < -0.35,
        right: vecX > 0.35,
      });
    },
    [deadzone, radius, onMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === joystickTouchId.current) {
          handleJoystickMoveFromTouch(touch.clientX, touch.clientY);
        } else if (touch.identifier === cameraTouchId.current && cameraLastPos.current) {
          const dx = touch.clientX - cameraLastPos.current.x;
          const dy = touch.clientY - cameraLastPos.current.y;
          cameraLastPos.current = { x: touch.clientX, y: touch.clientY };
          onCameraRotate(dx * 0.005, dy * 0.005);
        }
      }
    },
    [handleJoystickMoveFromTouch, onCameraRotate]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId.current) {
          joystickTouchId.current = null;
          setKnobPos({ x: 0, y: 0 });
          setIsJoystickActive(false);
          setActiveDirections({ up: false, down: false, left: false, right: false });
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

    // Global reset safety when app loses focus or questions/modals open
    const handleGlobalReset = () => {
      dpadPressedRef.current = { up: false, down: false, left: false, right: false };
      setActiveDirections({ up: false, down: false, left: false, right: false });
      joystickTouchId.current = null;
      cameraTouchId.current = null;
      cameraLastPos.current = null;
      setKnobPos({ x: 0, y: 0 });
      setIsJoystickActive(false);
      onMove({ x: 0, y: 0 });
    };

    window.addEventListener('blur', handleGlobalReset);
    window.addEventListener('pointerup', handleGlobalReset);
    window.addEventListener('pointercancel', handleGlobalReset);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('blur', handleGlobalReset);
      window.removeEventListener('pointerup', handleGlobalReset);
      window.removeEventListener('pointercancel', handleGlobalReset);
    };
  }, [handleTouchMove, handleTouchEnd, onMove]);

  // Handle D-Pad discrete button press/release
  const setDpadDirection = (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    dpadPressedRef.current[dir] = pressed;
    setActiveDirections((prev) => ({ ...prev, [dir]: pressed }));
    updateDpadVector();
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
    >
      {/* ================= TRANSPARENT CAMERA TOUCH ZONE (Right 55% of screen) ================= */}
      <div
        className="pointer-events-auto absolute inset-y-0 right-0 w-[55%] touch-none z-0"
        onTouchStart={(e) => {
          if (cameraTouchId.current === null && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            cameraTouchId.current = touch.identifier;
            cameraLastPos.current = { x: touch.clientX, y: touch.clientY };
          }
        }}
      />
      {/* ================= LEFT CONTROLS: STABILIZED NAVIGATION D-PAD / JOYSTICK ================= */}
      <div className="pointer-events-auto absolute bottom-24 left-6 flex flex-col items-center gap-1.5">
        {/* Navigation Mode Pill Toggle */}
        <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-bold text-slate-300 shadow-lg">
          <button
            onClick={() => setNavMode('hybrid')}
            className={`px-1.5 py-0.5 rounded-full transition-all ${
              navMode === 'hybrid' ? 'bg-emerald-500 text-slate-950 font-black' : 'hover:text-white'
            }`}
            title="Mode Hybrid (Joystick + Tombol Arah)"
          >
            Hybrid
          </button>
          <button
            onClick={() => setNavMode('dpad')}
            className={`px-1.5 py-0.5 rounded-full transition-all ${
              navMode === 'dpad' ? 'bg-emerald-500 text-slate-950 font-black' : 'hover:text-white'
            }`}
            title="Mode D-Pad (4 Tombol Arah Presisi)"
          >
            D-Pad
          </button>
          <button
            onClick={() => setNavMode('analog')}
            className={`px-1.5 py-0.5 rounded-full transition-all ${
              navMode === 'analog' ? 'bg-emerald-500 text-slate-950 font-black' : 'hover:text-white'
            }`}
            title="Mode Analog (Joystick Bebas)"
          >
            Analog
          </button>
        </div>

        {/* Master Navigation Base */}
        <div
          ref={joystickBaseRef}
          className="relative w-40 h-40 rounded-full bg-slate-950/75 border-2 border-emerald-400/50 flex items-center justify-center backdrop-blur-md shadow-2xl touch-none select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Subtle Outer Compass Degree Ring */}
          <div className="absolute inset-2 rounded-full border border-emerald-500/20 pointer-events-none" />

          {/* D-Pad Directional Buttons (Available in Hybrid and D-Pad modes) */}
          {(navMode === 'hybrid' || navMode === 'dpad') && (
            <>
              {/* UP (Maju) */}
              <button
                onPointerDown={(e) => {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('up', true);
                }}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('up', false);
                }}
                onPointerCancel={() => setDpadDirection('up', false)}
                onPointerLeave={() => setDpadDirection('up', false)}
                className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-11 h-10 rounded-t-xl flex flex-col items-center justify-center transition-all ${
                  activeDirections.up
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-95 border-emerald-300'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-white/20'
                }`}
                title="Maju (W / Atas)"
              >
                <ChevronUp className="w-5 h-5 stroke-[3]" />
                <span className="text-[8px] font-black uppercase tracking-tighter leading-none">MAJU</span>
              </button>

              {/* DOWN (Mundur) */}
              <button
                onPointerDown={(e) => {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('down', true);
                }}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('down', false);
                }}
                onPointerCancel={() => setDpadDirection('down', false)}
                onPointerLeave={() => setDpadDirection('down', false)}
                className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-11 h-10 rounded-b-xl flex flex-col items-center justify-center transition-all ${
                  activeDirections.down
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-95 border-emerald-300'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-white/20'
                }`}
                title="Mundur (S / Bawah)"
              >
                <span className="text-[8px] font-black uppercase tracking-tighter leading-none">MUNDUR</span>
                <ChevronDown className="w-5 h-5 stroke-[3]" />
              </button>

              {/* LEFT (Kiri) */}
              <button
                onPointerDown={(e) => {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('left', true);
                }}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('left', false);
                }}
                onPointerCancel={() => setDpadDirection('left', false)}
                onPointerLeave={() => setDpadDirection('left', false)}
                className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-10 h-11 rounded-l-xl flex items-center justify-center transition-all ${
                  activeDirections.left
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-95 border-emerald-300'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-white/20'
                }`}
                title="Kiri (A)"
              >
                <ChevronLeft className="w-5 h-5 stroke-[3]" />
              </button>

              {/* RIGHT (Kanan) */}
              <button
                onPointerDown={(e) => {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('right', true);
                }}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                  setDpadDirection('right', false);
                }}
                onPointerCancel={() => setDpadDirection('right', false)}
                onPointerLeave={() => setDpadDirection('right', false)}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-11 rounded-r-xl flex items-center justify-center transition-all ${
                  activeDirections.right
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-95 border-emerald-300'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-white/20'
                }`}
                title="Kanan (D)"
              >
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            </>
          )}

          {/* Central Thumb Knob (In Analog and Hybrid modes) with Dynamic Directional Arrow */}
          {navMode !== 'dpad' ? (
            <div
              className={`w-14 h-14 rounded-full border-2 shadow-2xl flex items-center justify-center transition-transform duration-75 pointer-events-none ${
                isJoystickActive
                  ? 'bg-gradient-to-br from-emerald-400 via-teal-300 to-green-500 border-white text-slate-950 scale-110 shadow-emerald-500/70'
                  : 'bg-slate-800/90 border-white/40 text-slate-300'
              }`}
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              }}
            >
              {isJoystickActive ? (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                  style={{
                    transform: `rotate(${Math.atan2(knobPos.x, -knobPos.y) * (180 / Math.PI)}deg)`,
                  }}
                >
                  <ArrowUp className="w-7 h-7 stroke-[3.5] text-slate-950 drop-shadow-md" />
                </div>
              ) : (
                <Compass className="w-6 h-6" />
              )}
            </div>
          ) : (
            /* Center grip pad for Pure D-Pad mode with active direction arrow */
            <div
              className={`w-12 h-12 rounded-full border flex items-center justify-center pointer-events-none transition-all ${
                isJoystickActive
                  ? 'bg-emerald-500 border-white text-slate-950 shadow-lg'
                  : 'bg-slate-900 border-white/20 text-slate-400'
              }`}
            >
              {isJoystickActive ? (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-75"
                  style={{
                    transform: `rotate(${Math.atan2(knobPos.x, -knobPos.y) * (180 / Math.PI)}deg)`,
                  }}
                >
                  <ArrowUp className="w-6 h-6 stroke-[3] text-slate-950" />
                </div>
              ) : (
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">ARAH</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT CONTROLS: ACTION BUTTONS (ROBLOX STYLE) ================= */}
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
});
