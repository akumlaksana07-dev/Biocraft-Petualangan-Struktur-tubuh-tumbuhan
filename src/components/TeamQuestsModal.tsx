import React from 'react';
import { Quest } from '../types/game';
import { X, Target, Zap, CheckCircle2, Gift } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface TeamQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  sharedAtp: number;
  maxSharedAtp: number;
  photosynthesisReady: boolean;
  onDonateAtp: () => void;
  userAtp: number;
}

export const TeamQuestsModal: React.FC<TeamQuestsModalProps> = ({
  isOpen,
  onClose,
  quests,
  sharedAtp,
  maxSharedAtp = 25,
  photosynthesisReady,
  onDonateAtp,
  userAtp,
}) => {
  if (!isOpen) return null;

  const percentShared = Math.min(100, Math.round((sharedAtp / maxSharedAtp) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Misi Petualangan & Tim Kelas</h2>
              <p className="text-xs text-emerald-300">Tugas Eksplorasi Sel Tumbuhan Bersama</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Cooperative Team Goal Card */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 p-5 rounded-2xl border-2 border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  MISI KOPERATIF SATU KELAS
                </span>
                <h3 className="text-base font-black text-white">Aktifkan Reaktor Fotosintesis Sel Tumbuhan</h3>
              </div>
              <span className="text-2xl">🌱</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Kumpulkan dan donasikan energi molekul ATP bersama teman-teman sekelas untuk menyalakan kloroplas di seluruh sel!
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Total Donasi Kelas:</span>
                <span className="text-emerald-400 font-bold">{sharedAtp} / {maxSharedAtp} ATP ({percentShared}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${percentShared}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400">
                ATP Kamu: <span className="font-bold text-amber-400">{userAtp} ATP</span>
              </div>
              <button
                disabled={userAtp < 1 || photosynthesisReady}
                onClick={onDonateAtp}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                {photosynthesisReady ? 'Fotosintesis Telah Aktif!' : 'Donasikan 1 ATP'}
              </button>
            </div>
          </div>

          {/* Individual Quests List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Misi Eksplorasi Pribadi</h4>
            <div className="space-y-2.5">
              {quests.map((q) => {
                const isCompleted = q.currentCount >= q.targetCount;

                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isCompleted
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-slate-800/40 border-white/10'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{q.title}</span>
                        {isCompleted && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{q.description}</p>
                      <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Hadiah: +{q.rewardAtp} ATP
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {q.currentCount} / {q.targetCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
