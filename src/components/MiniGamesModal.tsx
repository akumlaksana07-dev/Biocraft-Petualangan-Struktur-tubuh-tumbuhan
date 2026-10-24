import React, { useState } from 'react';
import { X, Trophy, CheckCircle, RotateCcw, Zap, Sun, Shield, Award, Play, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface MiniGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardAtp: (amount: number, reason: string) => void;
  initialTab?: 'builder' | 'matcher' | 'photosynthesis' | 'stomata';
}

interface OrganelleDraggable {
  id: string;
  name: string;
  targetSlotId: string;
  icon: string;
  color: string;
  hint: string;
}

const BUILDER_ITEMS: OrganelleDraggable[] = [
  { id: 'b_wall', name: 'Dinding Sel', targetSlotId: 'slot_outer', icon: '🧱', color: 'bg-emerald-700', hint: 'Lapisan kaku selulosa paling luar pelindung sel' },
  { id: 'b_mem', name: 'Membran Sel', targetSlotId: 'slot_inner_wall', icon: '🛡️', color: 'bg-teal-600', hint: 'Selaput tipis semipermeabel pembungkus sitoplasma' },
  { id: 'b_chlor', name: 'Kloroplas', targetSlotId: 'slot_left', icon: '🌿', color: 'bg-green-600', hint: 'Plastida hijau berklorofil penangkap cahaya fotosintesis' },
  { id: 'b_vac', name: 'Vakuola Sentral', targetSlotId: 'slot_center_right', icon: '💧', color: 'bg-sky-500', hint: 'Kantung raksasa penyimpan air penentu turgor sel' },
  { id: 'b_nuc', name: 'Nukleus', targetSlotId: 'slot_center_bottom', icon: '🟣', color: 'bg-purple-600', hint: 'Inti sel pengendali genetik pembawa DNA' },
  { id: 'b_mito', name: 'Mitokondria', targetSlotId: 'slot_top_left', icon: '⚡', color: 'bg-amber-600', hint: 'Organel sosis penghasil energi ATP respirasi aerob' },
  { id: 'b_golgi', name: 'Badan Golgi', targetSlotId: 'slot_bottom_right', icon: '📦', color: 'bg-yellow-500', hint: 'Kantung pipih pengekspor protein dan dinding sel baru' },
  { id: 'b_er', name: 'Retikulum Endoplasma', targetSlotId: 'slot_around_nuc', icon: '〰️', color: 'bg-pink-600', hint: 'Saluran berlipat sintesis protein dan lipid di dekat nukleus' },
];

const MATCH_PAIRS = [
  { id: 'm1', organelle: 'Kloroplas', functionText: 'Fotosintesis menghasilkan glukosa & oksigen', icon: '🌱' },
  { id: 'm2', organelle: 'Vakuola Sentral', functionText: 'Menjaga tekanan turgor & menyimpan cadangan air', icon: '💧' },
  { id: 'm3', organelle: 'Dinding Sel', functionText: 'Memberikan bentuk tetap & kekuatan dari selulosa', icon: '🧱' },
  { id: 'm4', organelle: 'Mitokondria', functionText: 'Pembangkit energi ATP melalui respirasi seluler', icon: '⚡' },
  { id: 'm5', organelle: 'Nukleus', functionText: 'Pusat komando sel & penyimpan materi genetik DNA', icon: '🧬' },
  { id: 'm6', organelle: 'Xilem', functionText: 'Mengangkut air & hara tanah dari akar ke daun', icon: '🪵' },
  { id: 'm7', organelle: 'Floem', functionText: 'Mengangkut hasil fotosintesis dari daun ke seluruh tubuh', icon: '🍯' },
  { id: 'm8', organelle: 'Stomata', functionText: 'Jalur keluar masuk gas CO2/O2 & transpirasi uap air', icon: '🍃' },
];

export const MiniGamesModal: React.FC<MiniGamesModalProps> = ({
  isOpen,
  onClose,
  onRewardAtp,
  initialTab = 'builder',
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'matcher' | 'photosynthesis' | 'stomata'>(initialTab);

  // --- STATE FOR GAME 1: BUILD CELL ---
  const [placedSlots, setPlacedSlots] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<OrganelleDraggable | null>(null);
  const [builderScore, setBuilderScore] = useState<number>(0);
  const [builderFinished, setBuilderFinished] = useState<boolean>(false);

  // --- STATE FOR GAME 2: MATCHER ---
  const [selectedOrganelle, setSelectedOrganelle] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [matcherScore, setMatcherScore] = useState<number>(0);

  // --- STATE FOR GAME 3: PHOTOSYNTHESIS LAB ---
  const [co2Count, setCo2Count] = useState(0);
  const [h2oCount, setH2oCount] = useState(0);
  const [lightEnergy, setLightEnergy] = useState(0);
  const [glucoseProduced, setGlucoseProduced] = useState(0);
  const [oxygenProduced, setOxygenProduced] = useState(0);

  // --- STATE FOR GAME 4: STOMATA & VASCULAR ---
  const [stomataOpen, setStomataOpen] = useState(false);
  const [waterLevel, setWaterLevel] = useState(80);
  const [carbonCaptured, setCarbonCaptured] = useState(0);
  const [selectedVesselAnswer, setSelectedVesselAnswer] = useState<string | null>(null);
  const [vesselScore, setVesselScore] = useState(0);

  if (!isOpen) return null;

  // Handler for Game 1 slot placement
  const handleSlotClick = (slotId: string) => {
    if (!selectedItem) return;
    if (selectedItem.targetSlotId === slotId) {
      sounds.playCorrect();
      const updated = { ...placedSlots, [slotId]: selectedItem.name };
      setPlacedSlots(updated);
      setSelectedItem(null);
      const newScore = builderScore + 15;
      setBuilderScore(newScore);

      if (Object.keys(updated).length === BUILDER_ITEMS.length) {
        setBuilderFinished(true);
        sounds.playScan();
        confetti({ particleCount: 70, spread: 60 });
        onRewardAtp(50, 'Menyelesaikan Bangun Sel Tumbuhan Sempurna!');
      }
    } else {
      sounds.playWrong();
    }
  };

  // Handler for Game 2 matching
  const handleOrganelleClick = (id: string) => {
    if (matchedPairs.includes(id)) return;
    setSelectedOrganelle(id);
    sounds.playJump();
  };

  const handleFunctionClick = (id: string) => {
    if (matchedPairs.includes(id)) return;
    if (selectedOrganelle === id) {
      // Correct match!
      sounds.playCorrect();
      const updated = [...matchedPairs, id];
      setMatchedPairs(updated);
      setSelectedOrganelle(null);
      setMatcherScore(matcherScore + 20);

      if (updated.length === MATCH_PAIRS.length) {
        confetti({ particleCount: 80, spread: 70 });
        onRewardAtp(40, 'Juara Cepat Cocok Organel & Fungsi Sel!');
      }
    } else {
      sounds.playWrong();
      setSelectedOrganelle(null);
    }
  };

  // Handler for Photosynthesis synthesis
  const handlePhotosynthesisRun = () => {
    if (co2Count >= 6 && h2oCount >= 6 && lightEnergy >= 6) {
      sounds.playCorrect();
      confetti({ particleCount: 60, spread: 60 });
      setCo2Count((prev) => prev - 6);
      setH2oCount((prev) => prev - 6);
      setLightEnergy((prev) => prev - 6);
      setGlucoseProduced((prev) => prev + 1);
      setOxygenProduced((prev) => prev + 6);
      onRewardAtp(20, 'Berhasil Merakit 1 Molekul Glukosa (C6H12O6)!');
    } else {
      sounds.playWrong();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Mini-Game Lab IPA Kelas VIII</h2>
              <p className="text-xs text-emerald-300">Praktikum Interaktif Struktur Sel & Jaringan Tumbuhan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/80 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'builder'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏗️ Bangun Sel Tumbuhan</span>
          </button>

          <button
            onClick={() => setActiveTab('matcher')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'matcher'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🧩 Cocok Organel & Fungsi</span>
          </button>

          <button
            onClick={() => setActiveTab('photosynthesis')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'photosynthesis'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>☀️ Lab Fotosintesis Kloroplas</span>
          </button>

          <button
            onClick={() => setActiveTab('stomata')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'stomata'
                ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🍃 Stomata & Xilem-Floem</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-200 bg-slate-900/90">
          {/* ================= TAB 1: BANGUN SEL TUMBUHAN ================= */}
          {activeTab === 'builder' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Tantangan Arsitektur Sel Tumbuhan</h3>
                  <p className="text-xs text-slate-300">
                    Pilih salah satu organel di bawah, lalu klik slot posisi yang tepat di dalam sel!
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Terpasang:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    {Object.keys(placedSlots).length} / {BUILDER_ITEMS.length}
                  </span>
                  <button
                    onClick={() => {
                      setPlacedSlots({});
                      setSelectedItem(null);
                      setBuilderScore(0);
                      setBuilderFinished(false);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Ulangi"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2D Interactive Cell Blueprint Grid */}
              <div className="relative w-full h-[340px] bg-emerald-950/20 border-4 border-dashed border-emerald-600/40 rounded-3xl p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                {/* Outermost Ring: Dinding Sel */}
                <div
                  onClick={() => handleSlotClick('slot_outer')}
                  className={`w-full py-1.5 px-3 rounded-xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                    placedSlots['slot_outer']
                      ? 'bg-emerald-800/80 border-emerald-400 text-white shadow-md'
                      : 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-800/40 animate-pulse'
                  }`}
                >
                  🧱 [Slot 1: Lapisan Terluar Kaku] {placedSlots['slot_outer'] || 'Pasang Dinding Sel Di Sini'}
                </div>

                {/* Sub-layer: Membran Sel */}
                <div
                  onClick={() => handleSlotClick('slot_inner_wall')}
                  className={`w-full py-1 px-3 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                    placedSlots['slot_inner_wall']
                      ? 'bg-teal-800/80 border-teal-400 text-white'
                      : 'bg-teal-900/30 border-teal-500/40 text-teal-300 hover:bg-teal-800/40'
                  }`}
                >
                  🛡️ [Slot 2: Selaput Dalam] {placedSlots['slot_inner_wall'] || 'Pasang Membran Sel Di Sini'}
                </div>

                {/* Cytoplasm Core Grid */}
                <div className="grid grid-cols-3 gap-3 flex-1 my-2">
                  {/* Top Left: Mitokondria */}
                  <div
                    onClick={() => handleSlotClick('slot_top_left')}
                    className={`rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center text-xs font-bold cursor-pointer transition-all ${
                      placedSlots['slot_top_left']
                        ? 'bg-amber-900/70 border-amber-400 text-white shadow-lg'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-amber-400 hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="text-xl">⚡</span>
                    <span>{placedSlots['slot_top_left'] || 'Slot Daya Sel (ATP)'}</span>
                  </div>

                  {/* Top Center: Kloroplas */}
                  <div
                    onClick={() => handleSlotClick('slot_left')}
                    className={`rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center text-xs font-bold cursor-pointer transition-all ${
                      placedSlots['slot_left']
                        ? 'bg-green-900/70 border-green-400 text-white shadow-lg'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-green-400 hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="text-xl">🌿</span>
                    <span>{placedSlots['slot_left'] || 'Slot Pabrik Fotosintesis'}</span>
                  </div>

                  {/* Center Right: Vakuola Sentral (Large) */}
                  <div
                    onClick={() => handleSlotClick('slot_center_right')}
                    className={`row-span-2 rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center text-xs font-bold cursor-pointer transition-all ${
                      placedSlots['slot_center_right']
                        ? 'bg-sky-900/70 border-sky-400 text-white shadow-lg'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-sky-400 hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="text-3xl">💧</span>
                    <span className="mt-1">{placedSlots['slot_center_right'] || 'Slot Vakuola Air Raksasa (80% Sel)'}</span>
                  </div>

                  {/* Center Bottom: Nukleus */}
                  <div
                    onClick={() => handleSlotClick('slot_center_bottom')}
                    className={`rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center text-xs font-bold cursor-pointer transition-all ${
                      placedSlots['slot_center_bottom']
                        ? 'bg-purple-900/70 border-purple-400 text-white shadow-lg'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-purple-400 hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="text-2xl">🟣</span>
                    <span>{placedSlots['slot_center_bottom'] || 'Slot Inti Sel (DNA)'}</span>
                  </div>

                  {/* Near Nucleus: Retikulum Endoplasma */}
                  <div
                    onClick={() => handleSlotClick('slot_around_nuc')}
                    className={`rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center text-xs font-bold cursor-pointer transition-all ${
                      placedSlots['slot_around_nuc']
                        ? 'bg-pink-900/70 border-pink-400 text-white shadow-lg'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-pink-400 hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="text-xl">〰️</span>
                    <span>{placedSlots['slot_around_nuc'] || 'Slot Saluran Protein & Lipid'}</span>
                  </div>

                  {/* Bottom Right: Badan Golgi */}
                  <div
                    onClick={() => handleSlotClick('slot_bottom_right')}
                    className={`col-span-3 rounded-2xl border-2 py-1.5 px-3 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                      placedSlots['slot_bottom_right']
                        ? 'bg-yellow-900/70 border-yellow-400 text-white shadow-lg'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-yellow-400 hover:bg-slate-800/70'
                    }`}
                  >
                    <span>📦</span>
                    <span>{placedSlots['slot_bottom_right'] || 'Slot Pengemasan & Ekspor Vesikula (Badan Golgi)'}</span>
                  </div>
                </div>
              </div>

              {/* Organelle Palette to Pick From */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 block">
                  Pilih Organel yang akan ditempatkan:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUILDER_ITEMS.map((item) => {
                    const isPlaced = Object.values(placedSlots).includes(item.name);
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        disabled={isPlaced}
                        onClick={() => {
                          setSelectedItem(item);
                          sounds.playJump();
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                          isPlaced
                            ? 'opacity-40 bg-slate-900 border-white/5 line-through'
                            : isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400 shadow-md'
                            : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="text-xs font-bold">{item.name}</div>
                          <div className="text-[10px] text-slate-400 leading-tight line-clamp-1">{item.hint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {builderFinished && (
                <div className="p-4 bg-emerald-900/50 border border-emerald-400 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-300" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Luar Biasa! Sel Tumbuhan Berhasil Dibangun!</h4>
                      <p className="text-xs text-emerald-200">Kamu mendapatkan +50 ATP dan pemahaman posisi organel yang kokoh.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: COCOK ORGANEL & FUNGSI ================= */}
          {activeTab === 'matcher' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-sky-950/40 border border-sky-500/30 p-3 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-sky-300">Tantangan Cocok Kilat Organel & Fungsi</h3>
                  <p className="text-xs text-slate-300">Klik satu nama organel di kiri, lalu klik fungsi yang sesuai di kanan!</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Skor:</span>
                  <span className="font-black text-sky-400 text-sm">+{matcherScore}</span>
                  <button
                    onClick={() => {
                      setMatchedPairs([]);
                      setSelectedOrganelle(null);
                      setMatcherScore(0);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Ulangi"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Organelle Names */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Organel / Jaringan</h4>
                  {MATCH_PAIRS.map((pair) => {
                    const isMatched = matchedPairs.includes(pair.id);
                    const isSelected = selectedOrganelle === pair.id;

                    return (
                      <button
                        key={pair.id}
                        disabled={isMatched}
                        onClick={() => handleOrganelleClick(pair.id)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isMatched
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 opacity-60'
                            : isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg ring-2 ring-sky-400'
                            : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <span>{pair.icon}</span>
                          <span>{pair.organelle}</span>
                        </div>
                        {isMatched ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <ArrowRight className="w-4 h-4 text-slate-500" />}
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Functions (shuffled display) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fungsi & Ciri Khas Sel</h4>
                  {MATCH_PAIRS.slice().reverse().map((pair) => {
                    const isMatched = matchedPairs.includes(pair.id);

                    return (
                      <button
                        key={pair.id}
                        disabled={isMatched}
                        onClick={() => handleFunctionClick(pair.id)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                          isMatched
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 opacity-60'
                            : 'bg-slate-800/80 border-white/10 text-slate-200 hover:border-sky-400 hover:bg-slate-700'
                        }`}
                      >
                        {pair.functionText}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: FOTOSINTESIS LAB ================= */}
          {activeTab === 'photosynthesis' && (
            <div className="space-y-5">
              <div className="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-2xl">
                <h3 className="text-sm font-bold text-amber-300">Simulasi Reaksi Fotosintesis (Kloroplas)</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Reaksi: <span className="font-mono text-amber-200">6 CO₂ + 6 H₂O + Cahaya Matahari → C₆H₁₂O₆ (Glukosa) + 6 O₂</span>.
                  Kumpulkan reaktan yang cukup untuk menyalakan kloroplas!
                </p>
              </div>

              {/* Reactant Generators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CO2 Card */}
                <div className="bg-slate-800/70 p-4 rounded-2xl border border-white/10 text-center space-y-2">
                  <span className="text-2xl">☁️</span>
                  <h4 className="text-xs font-bold text-slate-200">Karbondioksida (CO₂)</h4>
                  <div className="text-2xl font-black text-sky-400">{co2Count} / 6</div>
                  <p className="text-[10px] text-slate-400">Masuk melalui mulut daun (Stomata)</p>
                  <button
                    onClick={() => {
                      setCo2Count((c) => c + 1);
                      sounds.playJump();
                    }}
                    className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold active:scale-95"
                  >
                    + Serap CO₂
                  </button>
                </div>

                {/* H2O Card */}
                <div className="bg-slate-800/70 p-4 rounded-2xl border border-white/10 text-center space-y-2">
                  <span className="text-2xl">💧</span>
                  <h4 className="text-xs font-bold text-slate-200">Air Tanah (H₂O)</h4>
                  <div className="text-2xl font-black text-blue-400">{h2oCount} / 6</div>
                  <p className="text-[10px] text-slate-400">Diangkut dari akar lewat pembuluh Xilem</p>
                  <button
                    onClick={() => {
                      setH2oCount((c) => c + 1);
                      sounds.playJump();
                    }}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold active:scale-95"
                  >
                    + Angkut H₂O
                  </button>
                </div>

                {/* Light Energy Card */}
                <div className="bg-slate-800/70 p-4 rounded-2xl border border-white/10 text-center space-y-2">
                  <span className="text-2xl">☀️</span>
                  <h4 className="text-xs font-bold text-slate-200">Foton Cahaya</h4>
                  <div className="text-2xl font-black text-amber-400">{lightEnergy} / 6</div>
                  <p className="text-[10px] text-slate-400">Diserap klorofil pada membran Tilakoid</p>
                  <button
                    onClick={() => {
                      setLightEnergy((c) => c + 1);
                      sounds.playJump();
                    }}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold active:scale-95"
                  >
                    + Tangkap Foton
                  </button>
                </div>
              </div>

              {/* Synthesis Action Button */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Jalankan Reaksi Fotosintesis</h4>
                  <p className="text-xs text-slate-400">Butuh minimal 6 CO₂, 6 H₂O, dan 6 Foton Cahaya.</p>
                </div>
                <button
                  onClick={handlePhotosynthesisRun}
                  disabled={co2Count < 6 || h2oCount < 6 || lightEnergy < 6}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-green-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-black rounded-xl text-sm shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                >
                  ⚡ Sintesis Glukosa & O₂
                </button>
              </div>

              {/* Production Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 text-center">
                  <div className="text-xs text-slate-300">Glukosa Tersimpan (C₆H₁₂O₆):</div>
                  <div className="text-xl font-black text-emerald-400">{glucoseProduced} molekul amilum</div>
                </div>
                <div className="bg-teal-950/40 p-3 rounded-xl border border-teal-500/30 text-center">
                  <div className="text-xs text-slate-300">Oksigen Dilepaskan (O₂):</div>
                  <div className="text-xl font-black text-teal-400">{oxygenProduced} molekul oksigen</div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: STOMATA & VASCULAR ================= */}
          {activeTab === 'stomata' && (
            <div className="space-y-5">
              <div className="bg-teal-950/40 border border-teal-500/30 p-3.5 rounded-2xl">
                <h3 className="text-sm font-bold text-teal-300">Stomata Daun & Berkas Pengangkut Tumbuhan</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Pelajari bagaimana sel penjaga membuka pori stomata untuk bernapas dan bagaimana pipa Xilem & Floem mendistribusikan zat.
                </p>
              </div>

              {/* Interactive Stomata Simulator */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Simulasi Tekanan Turgor Sel Penjaga</h4>
                    <p className="text-xs text-slate-400">Kadar air tinggi = Sel Penjaga bengkak (Turgid) = Stomata MEMBUKA.</p>
                  </div>
                  <button
                    onClick={() => {
                      const nextState = !stomataOpen;
                      setStomataOpen(nextState);
                      sounds.playScan();
                      if (nextState) {
                        setCarbonCaptured((c) => c + 3);
                        setWaterLevel((w) => Math.max(20, w - 15));
                        onRewardAtp(10, 'Stomata membuka: Pertukaran CO2 aktif!');
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      stomataOpen
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {stomataOpen ? 'Pori Stomata: TERBUKA' : 'Pori Stomata: TERTUTUP'}
                  </button>
                </div>

                <div className="flex items-center justify-center py-4 bg-slate-900 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-12 h-20 rounded-full border-4 border-emerald-500 bg-emerald-600/80 transition-all ${
                        stomataOpen ? '-rotate-12 translate-x-1' : 'rotate-0 translate-x-3'
                      }`}
                    />
                    <div
                      className={`w-6 h-14 rounded-full transition-all flex items-center justify-center text-xs font-bold ${
                        stomataOpen ? 'bg-sky-400/80 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {stomataOpen ? 'CO₂' : 'X'}
                    </div>
                    <div
                      className={`w-12 h-20 rounded-full border-4 border-emerald-500 bg-emerald-600/80 transition-all ${
                        stomataOpen ? 'rotate-12 -translate-x-1' : 'rotate-0 -translate-x-3'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Xilem vs Floem Quick Quiz */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white">Kuis Cepat: Xilem vs Floem</h4>
                <p className="text-xs text-slate-300">
                  "Manakah pembuluh yang bertugas mengedarkan hasil fotosintesis (gula sukrosa) dari daun ke seluruh tubuh tanaman?"
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      sounds.playWrong();
                      setSelectedVesselAnswer('xilem');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedVesselAnswer === 'xilem'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-white/10 text-slate-200'
                    }`}
                  >
                    🪵 Xilem (Pembuluh Kayu)
                  </button>
                  <button
                    onClick={() => {
                      sounds.playCorrect();
                      setSelectedVesselAnswer('floem');
                      setVesselScore(100);
                      onRewardAtp(25, 'Tepat! Floem mengedarkan hasil fotosintesis.');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedVesselAnswer === 'floem'
                        ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-white/10 text-slate-200'
                    }`}
                  >
                    🍯 Floem (Pembuluh Tapis)
                  </button>
                </div>
                {selectedVesselAnswer === 'floem' && (
                  <p className="text-xs text-emerald-400 font-semibold">
                    ✅ Benar! Floem tersusun dari sel hidup yang mengalirkan hasil fotosintesis, sedangkan Xilem mengangkut air & mineral dari akar.
                  </p>
                )}
                {selectedVesselAnswer === 'xilem' && (
                  <p className="text-xs text-rose-400 font-semibold">
                    ❌ Kurang tepat. Xilem bertugas mengangkut air dari akar ke daun. Yang mengangkut hasil fotosintesis adalah Floem!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-between items-center">
          <div className="text-xs text-slate-400">
            IPA Kelas VIII • Materi Struktur & Fungsi Tumbuhan
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Tutup Mini-Game
          </button>
        </div>
      </div>
    </div>
  );
};
