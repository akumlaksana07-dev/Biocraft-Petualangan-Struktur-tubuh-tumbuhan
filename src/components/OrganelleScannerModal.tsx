import React, { useState } from 'react';
import { OrganelleInfo } from '../types/game';
import { X, Volume2, Sparkles, BookOpen, CheckCircle, ShieldAlert, Lightbulb } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface OrganelleScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  organelle: OrganelleInfo | null;
  onClaimReward: (organelleId: string, atpReward: number) => void;
  isAlreadyScanned: boolean;
}

export const OrganelleScannerModal: React.FC<OrganelleScannerModalProps> = ({
  isOpen,
  onClose,
  organelle,
  onClaimReward,
  isAlreadyScanned,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen || !organelle) return null;

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${organelle.name}. ${organelle.tagline}. ${organelle.summary}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      sounds.playScan();
    }
  };

  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-white/10"
          style={{ backgroundColor: `${organelle.color}22` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shadow-md"
              style={{ borderColor: organelle.color, backgroundColor: `${organelle.color}33` }}
            >
              🔬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{organelle.name}</h2>
                <span className="text-xs font-mono text-slate-300 italic">({organelle.latinName})</span>
              </div>
              <p className="text-xs font-semibold" style={{ color: organelle.color }}>
                {organelle.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-200">
          {/* Summary Banner */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 leading-relaxed text-sm">
            {organelle.summary}
          </div>

          {/* Audio narration button */}
          <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-white/10">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Dengarkan Penjelasan Suara Guru Biologi</span>
            </div>
            <button
              onClick={handleSpeak}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isPlayingAudio ? 'bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlayingAudio ? '⏹️ Berhenti' : '▶️ Putar Audio'}
            </button>
          </div>

          {/* Structure Points */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Struktur & Ciri Khusus Mikroskopis</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {organelle.structure.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Function Points */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Fungsi Utama dalam Kehidupan Sel</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {organelle.function.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Curriculum Key Point */}
          <div className="bg-amber-950/30 p-3.5 rounded-2xl border border-amber-500/30 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300">Poin Kunci Kurikulum Merdeka / IPA SMP VIII:</div>
              <p className="text-xs text-slate-300 mt-0.5">{organelle.curriculumKeyPoint}</p>
            </div>
          </div>

          {/* Fun Fact */}
          <div className="bg-purple-950/30 p-3.5 rounded-2xl border border-purple-500/30 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-purple-300">Fakta Sains Menarik:</div>
              <p className="text-xs text-slate-300 mt-0.5">{organelle.funFact}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <div>
            {!isAlreadyScanned ? (
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                ⭐ Scan Pertama: +{organelle.atpReward} ATP
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Organel Sudah Terdata di Ensiklopedia
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {!isAlreadyScanned && (
              <button
                onClick={() => {
                  sounds.playScan();
                  onClaimReward(organelle.id, organelle.atpReward);
                }}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95"
              >
                Klaim +{organelle.atpReward} ATP & Simpan
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
