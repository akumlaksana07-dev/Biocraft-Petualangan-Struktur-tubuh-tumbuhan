import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, Award, Flame, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundEffects';

export interface MilestoneToastData {
  id: string;
  achievementId: string;
  title: string;
  icon: string;
  percent: 25 | 50 | 75 | 100;
  currentProgress: number;
  maxProgress: number;
  rewardLabel: string;
  message?: string;
}

interface MilestoneToastProps {
  toasts: MilestoneToastData[];
  onDismiss: (id: string) => void;
  onOpenAchievements?: () => void;
}

export const MilestoneToast: React.FC<MilestoneToastProps> = ({
  toasts,
  onDismiss,
  onOpenAchievements,
}) => {
  if (toasts.length === 0) return null;

  // Render the most recent toast on top
  const currentToast = toasts[toasts.length - 1];

  return (
    <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto w-[92vw] max-w-md select-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <MilestoneToastItem
        key={currentToast.id}
        data={currentToast}
        queueCount={toasts.length}
        onDismiss={() => onDismiss(currentToast.id)}
        onOpenAchievements={onOpenAchievements}
      />
    </div>
  );
};

interface MilestoneToastItemProps {
  data: MilestoneToastData;
  queueCount: number;
  onDismiss: () => void;
  onOpenAchievements?: () => void;
}

const MilestoneToastItem: React.FC<MilestoneToastItemProps> = ({
  data,
  queueCount,
  onDismiss,
  onOpenAchievements,
}) => {
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    // Play celebratory sound based on milestone tier
    sounds.playMilestone(data.percent);

    if (data.percent === 100) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.15 },
      });
    }

    // Trigger visual progress bar animation
    const animTimer = setTimeout(() => {
      setProgressWidth(data.percent);
    }, 50);

    // Auto dismiss after 4.8 seconds
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 4800);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(dismissTimer);
    };
  }, [data.id, data.percent, onDismiss]);

  // Visual Styling per Milestone Tier
  const tierConfig = {
    25: {
      badgeBg: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300',
      badgeLabel: 'MILESTONE 25% • LANGKAH AWAL',
      cardBorder: 'border-emerald-400/70 shadow-emerald-500/25',
      gradient: 'from-emerald-950/95 via-slate-900/95 to-slate-900/95',
      barColor: 'from-emerald-500 to-green-400',
      iconEmoji: '🌱',
      defaultMessage: 'Hebat! Kamu telah menyelesaikan 25% target pencapaian ini.',
    },
    50: {
      badgeBg: 'bg-amber-500/25 border-amber-400/50 text-amber-300',
      badgeLabel: 'MILESTONE 50% • SEPARUH JALAN',
      cardBorder: 'border-amber-400/70 shadow-amber-500/30',
      gradient: 'from-amber-950/95 via-slate-900/95 to-slate-900/95',
      barColor: 'from-amber-500 to-yellow-400',
      iconEmoji: '⚡',
      defaultMessage: 'Mantap! Separuh jalan tercapai. Terus jelajahi sel tumbuhan!',
    },
    75: {
      badgeBg: 'bg-orange-500/25 border-orange-400/50 text-orange-300',
      badgeLabel: 'MILESTONE 75% • HAMPIR SELESAI',
      cardBorder: 'border-orange-400/70 shadow-orange-500/35',
      gradient: 'from-orange-950/95 via-slate-900/95 to-slate-900/95',
      barColor: 'from-orange-500 to-amber-400',
      iconEmoji: '🔥',
      defaultMessage: 'Luar biasa! Sedikit lagi menuju pencapaian penuh dan hadiah!',
    },
    100: {
      badgeBg: 'bg-yellow-400/25 border-yellow-300/60 text-yellow-200 animate-pulse',
      badgeLabel: '🏆 100% LENGKAP • PENCAPAIAN TERBUKA!',
      cardBorder: 'border-yellow-400 shadow-yellow-500/40',
      gradient: 'from-yellow-950/95 via-purple-950/95 to-slate-900/95',
      barColor: 'from-yellow-400 via-amber-300 to-emerald-400',
      iconEmoji: '👑',
      defaultMessage: 'Selamat! Target selesai 100%. Hadiah siap diklaim di menu Prestasi!',
    },
  }[data.percent];

  return (
    <div
      className={`relative rounded-3xl border-2 bg-gradient-to-br ${tierConfig.gradient} ${tierConfig.cardBorder} p-4 shadow-2xl backdrop-blur-md overflow-hidden`}
    >
      {/* Auto-dismiss countdown bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div className="h-full bg-white/40 animate-[toastCountdown_4.8s_linear_forwards]" />
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${tierConfig.badgeBg}`}
          >
            {tierConfig.badgeLabel}
          </span>
          {queueCount > 1 && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
              +{queueCount - 1} lagi
            </span>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          title="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex items-start gap-3.5">
        {/* Achievement Icon Orb */}
        <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-slate-800/90 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
          <span>{data.icon || tierConfig.iconEmoji}</span>
          <span className="absolute -bottom-1 -right-1 text-xs">{tierConfig.iconEmoji}</span>
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-black text-white truncate leading-tight">{data.title}</h4>
            {data.percent === 100 && <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />}
          </div>

          <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
            {data.message || tierConfig.defaultMessage}
          </p>

          {/* Reward hint */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-300 font-medium">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{data.rewardLabel}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Numerical Tag */}
      <div className="mt-3.5 pt-2.5 border-t border-white/10">
        <div className="flex items-center justify-between text-xs mb-1 font-mono font-bold">
          <span className="text-slate-400">
            Progres: <span className="text-white">{data.currentProgress}</span> / {data.maxProgress}
          </span>
          <span className="text-emerald-400">{data.percent}%</span>
        </div>

        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r ${tierConfig.barColor} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Bottom Action: Open Achievements Button */}
      {onOpenAchievements && (
        <button
          onClick={() => {
            onOpenAchievements();
            onDismiss();
          }}
          className="w-full mt-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 active:scale-95"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Lihat di Menu Prestasi</span>
        </button>
      )}
    </div>
  );
};
