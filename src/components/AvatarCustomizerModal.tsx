import React from 'react';
import { Customization, FootstepTrailTheme, FootstepTrailLevel } from '../types/game';
import { TRAIL_THEMES_METADATA, TRAIL_LEVELS_METADATA } from '../game/FootstepTrailSystem';
import { X, Check, Sparkles, User, Palette, Crown, Footprints } from 'lucide-react';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: Customization;
  onUpdate: (c: Customization) => void;
  playerName: string;
  onNameChange: (name: string) => void;
  playerTitle: string;
  onTitleChange: (title: string) => void;
}

const SKIN_COLORS = ['#fed8b1', '#ffd1b3', '#fcd34d', '#f59e0b', '#d97706', '#8d5b4c'];
const SHIRT_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f8fafc', '#7c3aed', '#ea580c'];
const PANTS_COLORS = ['#1e293b', '#1e3a8a', '#3f3f46', '#713f12', '#0f172a'];

const FACES: { id: Customization['face']; label: string; icon: string }[] = [
  { id: 'smile', label: 'Roblox Klasik', icon: '🙂' },
  { id: 'goggles', label: 'Kacamata Lab', icon: '🥽' },
  { id: 'cool', label: 'Kacamata Hitam', icon: '😎' },
  { id: 'nerd', label: 'Cendekiawan', icon: '🤓' },
  { id: 'determined', label: 'Fokus Riset', icon: '🧐' },
  { id: 'happy', label: 'Gembira', icon: '😃' },
];

const HATS: { id: Customization['hat']; label: string; icon: string }[] = [
  { id: 'none', label: 'Tanpa Topi', icon: '🚫' },
  { id: 'goggles', label: 'Goggles Lab', icon: '🧪' },
  { id: 'leaf_cap', label: 'Topi Tunas Daun', icon: '🌱' },
  { id: 'scientist_hair', label: 'Rambut Profesor', icon: '👨‍🔬' },
  { id: 'spiky_hair', label: 'Rambut Keren', icon: '💇' },
  { id: 'peci_hijab', label: 'Peci / Kopiah', icon: '🧢' },
];

const ACCESSORIES: { id: Customization['accessory']; label: string; icon: string }[] = [
  { id: 'none', label: 'Tanpa Aksesoris', icon: '🚫' },
  { id: 'backpack', label: 'Ransel Siswa SMP', icon: '🎒' },
  { id: 'jetpack', label: 'Jetpack Klorofil', icon: '🚀' },
  { id: 'dna_wings', label: 'Sayap DNA Helix', icon: '🧬' },
  { id: 'microscope', label: 'Mikroskop Punggung', icon: '🔬' },
];

const TITLES = [
  'Penjelajah Sel Muda',
  'Pakar Fotosintesis',
  'Peneliti Sitologi',
  'Master Organel Sel',
  'Detektif Jaringan Daun',
  'Ahli Biologi SMP',
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  customization,
  onUpdate,
  playerName,
  onNameChange,
  playerTitle,
  onTitleChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-900 to-slate-900 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Kustomisasi Avatar Roblox</h2>
              <p className="text-xs text-emerald-300">Sesuaikan karakter penjelajah IPA Kelas VIII kamu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-100">
          {/* Identity Section */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <User className="w-4 h-4" />
              <span>Identitas Siswa</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Nama Avatar</label>
                <input
                  type="text"
                  maxLength={18}
                  value={playerName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Ketik nama kamu..."
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Gelar Prestasi</label>
                <select
                  value={playerTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400 text-sm"
                >
                  {TITLES.map((t) => (
                    <option key={t} value={t}>
                      🎖️ {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Skin & Clothing Colors */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Palette className="w-4 h-4" />
              <span>Warna Kulit & Seragam</span>
            </div>

            {/* Skin Color */}
            <div>
              <span className="text-xs text-slate-400 font-semibold mb-2 block">Warna Kulit Avatar</span>
              <div className="flex flex-wrap gap-3">
                {SKIN_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ ...customization, skinColor: color })}
                    style={{ backgroundColor: color }}
                    className={`w-9 h-9 rounded-full border-2 transition-transform ${
                      customization.skinColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Shirt Color */}
            <div>
              <span className="text-xs text-slate-400 font-semibold mb-2 block">Warna Baju / Jas Lab</span>
              <div className="flex flex-wrap gap-3">
                {SHIRT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ ...customization, shirtColor: color })}
                    style={{ backgroundColor: color }}
                    className={`w-9 h-9 rounded-xl border-2 transition-transform ${
                      customization.shirtColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Pants Color */}
            <div>
              <span className="text-xs text-slate-400 font-semibold mb-2 block">Warna Celana</span>
              <div className="flex flex-wrap gap-3">
                {PANTS_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ ...customization, pantsColor: color })}
                    style={{ backgroundColor: color }}
                    className={`w-9 h-9 rounded-xl border-2 transition-transform ${
                      customization.pantsColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Faces */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <span>😀 Ekspresi Wajah Roblox</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FACES.map((face) => (
                <button
                  key={face.id}
                  onClick={() => onUpdate({ ...customization, face: face.id })}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    customization.face === face.id
                      ? 'bg-sky-500/20 border-sky-400 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{face.icon}</span>
                  <span className="text-xs font-semibold">{face.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hats & Hair */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Crown className="w-4 h-4" />
              <span>Topi & Gaya Rambut</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {HATS.map((hat) => (
                <button
                  key={hat.id}
                  onClick={() => onUpdate({ ...customization, hat: hat.id })}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    customization.hat === hat.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{hat.icon}</span>
                  <span className="text-xs font-semibold">{hat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Back Accessories */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <span>🎒 Aksesoris Punggung</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACCESSORIES.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onUpdate({ ...customization, accessory: acc.id })}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    customization.accessory === acc.id
                      ? 'bg-purple-500/20 border-purple-400 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{acc.icon}</span>
                  <span className="text-xs font-semibold">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footstep Bioluminescent Trail & Levels */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Footprints className="w-4 h-4" />
                <span>Jejak Bioluminesensi Langkah Kaki</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                Efek Visual Eksplorasi
              </span>
            </div>

            {/* Trail Level */}
            <div>
              <span className="text-xs text-slate-400 font-semibold mb-2 block">Tingkat Pendaran (Level Efek):</span>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as FootstepTrailLevel[]).map((lvl) => {
                  const meta = TRAIL_LEVELS_METADATA[lvl];
                  const isSel = (customization.trailLevel || 2) === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => onUpdate({ ...customization, trailLevel: lvl })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSel
                          ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[11px] font-black text-white">{meta.tag} (Lvl {lvl})</div>
                      <div className="text-[9px] text-slate-300 line-clamp-1">{meta.name.split(':')[1]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trail Theme */}
            <div>
              <span className="text-xs text-slate-400 font-semibold mb-2 block">Tema Organel Sel:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(TRAIL_THEMES_METADATA) as FootstepTrailTheme[]).map((thmKey) => {
                  const theme = TRAIL_THEMES_METADATA[thmKey];
                  const isSel = (customization.trailTheme || 'chloroplast') === thmKey;
                  return (
                    <button
                      key={thmKey}
                      onClick={() => onUpdate({ ...customization, trailTheme: thmKey })}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSel
                          ? 'bg-slate-900 border-2 text-white shadow-md'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800'
                      }`}
                      style={{ borderColor: isSel ? theme.glowHex : undefined }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{theme.accentEmoji}</span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{theme.name}</div>
                          <div className="text-[9px] text-slate-400 truncate">{theme.organelleOrigin}</div>
                        </div>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: theme.glowHex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            <Check className="w-5 h-5" />
            <span>Simpan & Terapkan Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
