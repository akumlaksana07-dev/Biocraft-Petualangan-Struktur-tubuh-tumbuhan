import React from 'react';
import { FootstepTrailTheme, FootstepTrailLevel } from '../types/game';
import { TRAIL_THEMES_METADATA, TRAIL_LEVELS_METADATA } from '../game/FootstepTrailSystem';
import { X, Sparkles, Check, Footprints, Volume2, Info, Zap } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface FootstepTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: FootstepTrailTheme;
  currentLevel: FootstepTrailLevel;
  onSelectTheme: (theme: FootstepTrailTheme) => void;
  onSelectLevel: (level: FootstepTrailLevel) => void;
  userAtp: number;
}

export const FootstepTrailModal: React.FC<FootstepTrailModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  currentLevel,
  onSelectTheme,
  onSelectLevel,
  userAtp,
}) => {
  if (!isOpen) return null;

  const currentThemeMeta = TRAIL_THEMES_METADATA[currentTheme] || TRAIL_THEMES_METADATA.chloroplast;
  const currentLevelMeta = TRAIL_LEVELS_METADATA[currentLevel] || TRAIL_LEVELS_METADATA[1];

  const handleTestSound = (theme: FootstepTrailTheme) => {
    sounds.playFootstep(theme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-400/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-inner">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">Jejak Bioluminesensi Langkah</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  IPA VIII
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pancarkan partikel pendaran organel sel & gelombang cincin di bawah kakimu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-100">
          {/* Active Status Banner */}
          <div className="bg-gradient-to-r from-slate-950 to-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{currentThemeMeta.accentEmoji}</div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tema & Level Aktif
                </div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>{currentThemeMeta.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {currentLevelMeta.name}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-300/90 mt-0.5">
                  Organel: <span className="font-bold text-white">{currentThemeMeta.organelleOrigin}</span> • {currentThemeMeta.biologyConcept}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleTestSound(currentTheme)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 rounded-xl border border-white/10 shadow active:scale-95 transition-all"
              title="Dengarkan efek suara langkah kaki tema ini"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Tes Audio</span>
            </button>
          </div>

          {/* 1. Pilih Tingkat / Level Pendaran */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>Pilih Level Pendaran Jejak (Tingkat Efek)</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Energi Kamu: <span className="text-amber-400 font-bold">⚡ {userAtp} ATP</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([1, 2, 3] as FootstepTrailLevel[]).map((lvl) => {
                const meta = TRAIL_LEVELS_METADATA[lvl];
                const isSelected = currentLevel === lvl;

                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      sounds.playScan();
                      onSelectLevel(lvl);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-500/50'
                        : 'bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                          {meta.tag}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <h4 className="text-xs font-black text-white mt-1 leading-snug">{meta.name}</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{meta.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Status:</span>
                      <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {isSelected ? '✓ Terpasang' : 'Tersedia'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pilih Tema Bioluminesensi Organel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Pilih Tema Bioluminesensi Organel (Konsep Biologi)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(Object.keys(TRAIL_THEMES_METADATA) as FootstepTrailTheme[]).map((themeKey) => {
                const theme = TRAIL_THEMES_METADATA[themeKey];
                const isSelected = currentTheme === themeKey;

                return (
                  <div
                    key={themeKey}
                    onClick={() => {
                      sounds.playScan();
                      onSelectTheme(themeKey);
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-2 text-white shadow-xl scale-[1.01]'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                    style={{
                      borderColor: isSelected ? theme.glowHex : undefined,
                      boxShadow: isSelected ? `0 0 20px ${theme.glowHex}33` : undefined,
                    }}
                  >
                    <div>
                      {/* Top Row: Icon + Name + Selection Indicator */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{theme.accentEmoji}</span>
                          <div>
                            <h4 className="text-sm font-black text-white leading-tight">{theme.name}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Asal: {theme.organelleOrigin}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0"
                            style={{ backgroundColor: theme.glowHex }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestSound(themeKey);
                            }}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center"
                            title="Dengarkan nada jejak"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Description & Biological Concept */}
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{theme.description}</p>

                      <div className="mt-2.5 p-2 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-300 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <b className="text-emerald-300">Materi IPA:</b> {theme.biologyConcept}
                        </div>
                      </div>
                    </div>

                    {/* Color Swatches Palette */}
                    <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Palet Pendaran:</span>
                      <div className="flex items-center gap-1.5">
                        {theme.palette.map((c, i) => (
                          <div
                            key={i}
                            className="w-3.5 h-3.5 rounded-full shadow-sm border border-white/20"
                            style={{ backgroundColor: `#${c.toString(16).padStart(6, '0')}` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/20 font-mono text-[10px]">W A S D</kbd> untuk melihat pendaran jejak kakimu!
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 text-xs flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Jejak & Lanjut Eksplorasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
