import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Zap,
  School,
  User,
  Star,
  RefreshCw,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { sounds } from '../utils/soundEffects';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerName: string;
  currentPlayerSchool: string;
  currentPlayerScore: number;
  currentPlayerAtp: number;
  completedLevelsCount?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPlayerName,
  currentPlayerSchool,
  currentPlayerScore,
  currentPlayerAtp,
  completedLevelsCount = 1,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'top20' | 'my_position'>('top20');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Find if current player matches any row
  const myRankIndex = leaderboard.findIndex(
    (item) =>
      item.name.toLowerCase() === currentPlayerName.toLowerCase() ||
      item.isCurrentPlayer
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/70 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg border border-white/40">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Akumulasi Poin Tertinggi
                </span>
                <span className="text-[10px] text-slate-400">20 Siswa Teratas</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Papan Peringkat Teratas (Top 20)
              </h2>
              <p className="text-xs text-slate-300">
                Peringkat terakumulasi dari seluruh siswa yang telah menyelesaikan kuis & misi seluler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playScan();
                fetchLeaderboard();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Perbarui Peringkat"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Podium Highlight (Top 3) */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 px-6 pt-4 pb-2 bg-slate-950/40 border-b border-white/5">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/50 border border-slate-600/40 text-center relative overflow-hidden order-1 sm:order-1">
              <div className="w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 flex items-center justify-center font-black text-sm mb-1 border border-slate-400">
                🥈 2
              </div>
              <div className="text-xs font-bold text-white truncate max-w-full">
                {leaderboard[1]?.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-full">
                {leaderboard[1]?.school}
              </div>
              <div className="mt-1 font-mono text-xs font-black text-emerald-400">
                {leaderboard[1]?.score} Poin
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="flex flex-col items-center p-3.5 rounded-2xl bg-amber-950/40 border-2 border-amber-400/60 text-center relative overflow-hidden order-2 sm:order-2 shadow-lg shadow-amber-500/10 -translate-y-1">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base mb-1 shadow-md">
                👑 1
              </div>
              <div className="text-xs font-black text-amber-200 truncate max-w-full">
                {leaderboard[0]?.name}
              </div>
              <div className="text-[10px] text-amber-300/80 truncate max-w-full">
                {leaderboard[0]?.school}
              </div>
              <div className="mt-1 font-mono text-sm font-black text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{leaderboard[0]?.score} Poin</span>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/50 border border-amber-700/40 text-center relative overflow-hidden order-3 sm:order-3">
              <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-500 flex items-center justify-center font-black text-sm mb-1 border border-amber-700">
                🥉 3
              </div>
              <div className="text-xs font-bold text-white truncate max-w-full">
                {leaderboard[2]?.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-full">
                {leaderboard[2]?.school}
              </div>
              <div className="mt-1 font-mono text-xs font-black text-emerald-400">
                {leaderboard[2]?.score} Poin
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Leaderboard Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2">
          {isLoading && leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Memuat 20 peringkat teratas...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {leaderboard.map((entry, index) => {
                const rank = entry.rank || index + 1;
                const isTop3 = rank <= 3;
                const isMe =
                  entry.name.toLowerCase() === currentPlayerName.toLowerCase() ||
                  entry.isCurrentPlayer;

                return (
                  <div
                    key={entry.id || `rank_${rank}`}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-xs ${
                      isMe
                        ? 'bg-gradient-to-r from-emerald-950/70 via-slate-800 to-teal-950/70 border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                        : isTop3
                        ? 'bg-slate-800/80 border-amber-500/30 hover:border-amber-400/60'
                        : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/70'
                    }`}
                  >
                    {/* Left: Rank & Player info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank badge */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/40'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {rank}
                      </div>

                      {/* Name & School */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black truncate ${
                              isMe
                                ? 'text-emerald-300 font-extrabold'
                                : isTop3
                                ? 'text-white'
                                : 'text-slate-200'
                            }`}
                          >
                            {entry.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black uppercase tracking-tighter">
                              Kamu
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            • {entry.badge}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
                          <span className="flex items-center gap-1 truncate text-slate-300">
                            <School className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{entry.school}</span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 hidden sm:inline">{entry.completedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Scores & Stats */}
                    <div className="flex items-center gap-4 text-right shrink-0">
                      {/* Levels completed */}
                      <div className="hidden sm:flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 font-medium uppercase">Level</span>
                        <div className="flex items-center text-amber-400 font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{entry.completedLevels || 1}/4</span>
                        </div>
                      </div>

                      {/* ATP count */}
                      <div className="hidden sm:flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 font-medium uppercase">ATP</span>
                        <div className="flex items-center text-amber-400 font-bold text-[11px]">
                          <Zap className="w-3 h-3 fill-current" />
                          <span>{entry.atp}</span>
                        </div>
                      </div>

                      {/* Accumulated Score */}
                      <div className="flex flex-col items-end min-w-[70px]">
                        <span className="text-[9px] text-slate-400 font-medium uppercase">Skor</span>
                        <span
                          className={`font-mono text-sm font-black ${
                            rank === 1
                              ? 'text-amber-400 text-base'
                              : isMe
                              ? 'text-emerald-300'
                              : 'text-white'
                          }`}
                        >
                          {entry.score}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Current Player Status Banner */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{currentPlayerName || 'Siswa IPA'}</span>
                <span className="text-slate-400 font-normal">({currentPlayerSchool})</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                Skor Akumulasi Kamu: <strong>{currentPlayerScore} Poin</strong> • {currentPlayerAtp} ATP
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
          >
            Tutup Peringkat
          </button>
        </div>
      </div>
    </div>
  );
};
