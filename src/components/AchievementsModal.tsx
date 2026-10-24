import React from 'react';
import { X, Award, CheckCircle2, Lock, Gift, Sparkles } from 'lucide-react';
import { Achievement } from '../data/achievementsData';
import { sounds } from '../utils/soundEffects';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  onClaimReward: (ach: Achievement) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
  onClaimReward,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const percentComplete = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Piala & Pencapaian Siswa</h2>
              <p className="text-xs text-amber-300">Prestasi Petualangan Struktur Tumbuhan IPA Kelas VIII</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Progress Banner */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">Status Kelulusan Petualangan:</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">{unlockedCount} / {achievements.length}</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                {percentComplete}% Terbuka
              </span>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Achievements Cards */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {achievements.map((ach) => {
            const isCompleted = ach.progress >= ach.maxProgress;

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  ach.unlocked
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-400/50 shadow-md ring-1 ring-emerald-400'
                    : 'bg-slate-800/40 border-white/5 opacity-85'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl flex-shrink-0 ${
                      ach.unlocked
                        ? 'bg-amber-500/20 border-amber-400'
                        : isCompleted
                        ? 'bg-emerald-500/20 border-emerald-400'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {ach.unlocked ? ach.icon : isCompleted ? '🎁' : '🔒'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{ach.title}</h4>
                      {ach.unlocked && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Didapatkan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{ach.description}</p>
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      <span>Hadiah: {ach.rewardLabel}</span>
                    </div>

                    {/* Progress indicator */}
                    {!ach.unlocked && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ach.progress}/{ach.maxProgress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claim / Status Action */}
                <div className="w-full sm:w-auto flex justify-end">
                  {isCompleted && !ach.unlocked ? (
                    <button
                      onClick={() => {
                        sounds.playCorrect();
                        onClaimReward(ach);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Klaim Hadiah
                    </button>
                  ) : ach.unlocked ? (
                    <span className="text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                      Telah Diklaim
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Terkunci
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
