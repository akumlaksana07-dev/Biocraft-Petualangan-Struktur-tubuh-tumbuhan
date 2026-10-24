import React, { useState } from 'react';
import { ORGANELLES } from '../data/biologyData';
import { OrganelleInfo } from '../types/game';
import { X, Search, BookOpen, Compass, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeleportTo: (pos: [number, number, number]) => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  isOpen,
  onClose,
  onTeleportTo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'organel_utama' | 'pembungkus' | 'jaringan_tumbuhan'>('all');
  const [activeOrganelle, setActiveOrganelle] = useState<OrganelleInfo>(ORGANELLES[0]);

  if (!isOpen) return null;

  const filtered = ORGANELLES.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.latinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || org.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Ensiklopedia Sel & Jaringan Tumbuhan</h2>
              <p className="text-xs text-emerald-300">Pustaka Pintar Materi IPA Kelas VIII SMP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950 border-b border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari organel atau fungsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua Bagian
            </button>
            <button
              onClick={() => setSelectedCategory('organel_utama')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'organel_utama'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Organel Utama
            </button>
            <button
              onClick={() => setSelectedCategory('pembungkus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'pembungkus'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Dinding & Membran
            </button>
            <button
              onClick={() => setSelectedCategory('jaringan_tumbuhan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'jaringan_tumbuhan'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Jaringan Tumbuhan
            </button>
          </div>
        </div>

        {/* Master Detail Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: List */}
          <div className="w-full md:w-72 border-r border-white/10 p-3 overflow-y-auto space-y-1.5 bg-slate-900/60 max-h-52 md:max-h-full">
            {filtered.map((org) => {
              const isSelected = activeOrganelle.id === org.id;

              return (
                <button
                  key={org.id}
                  onClick={() => {
                    sounds.playJump();
                    setActiveOrganelle(org);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{org.name}</div>
                    <div className="text-[10px] text-slate-400 italic">{org.latinName}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-black text-white">{activeOrganelle.name}</h3>
                <span className="text-xs font-mono text-emerald-400">{activeOrganelle.latinName}</span>
                <p className="text-xs text-slate-300 font-semibold mt-1">{activeOrganelle.tagline}</p>
              </div>

              <button
                onClick={() => {
                  sounds.playScan();
                  onTeleportTo(activeOrganelle.location);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 whitespace-nowrap self-start"
              >
                <Compass className="w-4 h-4" />
                <span>Teleport ke Lokasi 3D</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-800/40 p-4 rounded-2xl border border-white/5">
              {activeOrganelle.summary}
            </p>

            {/* Structure & Function highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ciri & Struktur</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {activeOrganelle.structure.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Peran & Fungsi</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {activeOrganelle.function.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-xs text-amber-200">
              <span className="font-bold text-amber-300 block mb-0.5">Catatan Ujian IPA Kelas 8:</span>
              {activeOrganelle.curriculumKeyPoint}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
          >
            Tutup Ensiklopedia
          </button>
        </div>
      </div>
    </div>
  );
};
