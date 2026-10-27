import React from 'react';
import { User, Gamepad2, BookOpen, Award, Target, Users, ChevronDown, ChevronUp, Trophy, UserCheck, Footprints, GraduationCap, Compass, Navigation } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface ControlDockProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isGuideModeActive?: boolean;
  onToggleGuideMode?: () => void;
  onOpenAvatarCustomizer: () => void;
  onOpenTrailCustomizer: () => void;
  onOpenMiniGames: () => void;
  onOpenCodex: () => void;
  onOpenQuiz: () => void;
  onOpenAchievements: () => void;
  onOpenQuests: () => void;
  onOpenMultiplayer: () => void;
  onOpenDeveloperProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenLoginProfile: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  isCollapsed,
  onToggleCollapse,
  isGuideModeActive = false,
  onToggleGuideMode,
  onOpenAvatarCustomizer,
  onOpenTrailCustomizer,
  onOpenMiniGames,
  onOpenCodex,
  onOpenQuiz,
  onOpenAchievements,
  onOpenQuests,
  onOpenMultiplayer,
  onOpenDeveloperProfile,
  onOpenLeaderboard,
  onOpenLoginProfile,
}) => {
  return (
    <div
      className="fixed z-40 flex flex-col items-center pointer-events-auto transition-transform duration-300"
      style={{
        bottom: isCollapsed ? '-80px' : '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'min(940px, 96vw)',
      }}
    >
      {/* Collapse / Expand Tab attached to top edge */}
      <button
        onClick={onToggleCollapse}
        className="px-4 py-1 bg-slate-900/90 border border-white/20 border-b-0 rounded-t-xl text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 mb-[-1px] transition-colors"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tampilkan Menu BioCraft</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Mode Layar Penuh (Sembunyikan Menu)</span>
          </>
        )}
      </button>

      {/* Main Bottom Dock Bar */}
      <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-x-auto max-w-full">
        {/* 1. Avatar Customizer */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenAvatarCustomizer();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-emerald-600/30 active:scale-95 transition-all text-slate-200 hover:text-white border border-transparent hover:border-emerald-400/50 min-w-[58px] sm:min-w-[68px]"
          title="Kustomisasi Avatar Roblox"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Avatar</span>
        </button>

        {/* 1b. Footstep Bioluminescent Trail */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenTrailCustomizer();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-t from-teal-950/60 to-slate-900/60 hover:from-teal-900/80 hover:to-slate-800/80 active:scale-95 transition-all text-teal-300 hover:text-white border border-teal-500/30 hover:border-teal-400 min-w-[58px] sm:min-w-[68px]"
          title="Ubah Tema & Level Pendaran Jejak Kaki Bioluminesensi"
        >
          <Footprints className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Jejak Kaki</span>
        </button>

        {/* 1c. Mode Bantu: Sinar Laser Tipis di Lantai Menuju Organel Terdekat */}
        <button
          onClick={() => {
            sounds.playScan();
            if (onToggleGuideMode) onToggleGuideMode();
          }}
          className={`flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl transition-all min-w-[62px] sm:min-w-[72px] border active:scale-95 ${
            isGuideModeActive
              ? 'bg-gradient-to-t from-cyan-950 via-teal-950 to-slate-900 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400/50'
              : 'bg-white/5 hover:bg-cyan-950/30 border-transparent hover:border-cyan-400/40 text-slate-300 hover:text-white'
          }`}
          title="Mode Bantu (Tekan B): Tampilkan Sinar Laser Tipis di Lantai Menuju Organel Terdekat"
        >
          <div className="relative mb-0.5">
            <Compass className={`w-4 h-4 sm:w-5 sm:h-5 ${isGuideModeActive ? 'text-cyan-300 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '6s' }} />
            {isGuideModeActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] sm:text-[10px] font-black tracking-tight">Bantu</span>
            <span
              className={`text-[8px] font-mono px-1 py-0.2 rounded font-extrabold uppercase ${
                isGuideModeActive
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isGuideModeActive ? 'ON' : 'OFF'}
            </span>
          </div>
        </button>

        {/* 2. Mini-Games Lab */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenMiniGames();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-t from-emerald-950 to-emerald-900/40 hover:from-emerald-900 hover:to-emerald-800/60 active:scale-95 transition-all text-white border border-emerald-400/40 min-w-[64px] sm:min-w-[76px] shadow-sm"
          title="Mini-Game Edukasi (Bangun Sel, Cocok Cepat, Fotosintesis)"
        >
          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-black tracking-tight text-emerald-200">Mini-Game</span>
        </button>

        {/* 3. Codex / Encyclopedia */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenCodex();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-teal-600/30 active:scale-95 transition-all text-slate-200 hover:text-white border border-transparent hover:border-teal-400/50 min-w-[58px] sm:min-w-[68px]"
          title="Ensiklopedia Sel & Jaringan Tumbuhan"
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Ensiklopedia</span>
        </button>

        {/* 4. Quiz */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenQuiz();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-sky-600/30 active:scale-95 transition-all text-slate-200 hover:text-white border border-transparent hover:border-sky-400/50 min-w-[58px] sm:min-w-[68px]"
          title="Kuis Evaluasi IPA Kelas VIII"
        >
          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Kuis IPA</span>
        </button>

        {/* 5. Papan Peringkat Top 20 */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-t from-amber-950/80 to-amber-900/40 hover:from-amber-900 hover:to-amber-800/60 active:scale-95 transition-all text-amber-300 hover:text-white border border-amber-400/50 min-w-[62px] sm:min-w-[74px] shadow-sm"
          title="Papan Peringkat Top 20 Siswa Terakumulasi"
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-black tracking-tight text-amber-200">Top 20</span>
        </button>

        {/* 5b. Achievements */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenAchievements();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-amber-600/30 active:scale-95 transition-all text-slate-200 hover:text-white border border-transparent hover:border-amber-400/50 min-w-[58px] sm:min-w-[68px]"
          title="Piala & Prestasi Siswa"
        >
          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Prestasi</span>
        </button>

        {/* 6. Team Quests */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenQuests();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-pink-600/30 active:scale-95 transition-all text-slate-200 hover:text-white border border-transparent hover:border-pink-400/50 min-w-[58px] sm:min-w-[68px]"
          title="Misi Kelas & Donasi ATP"
        >
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Misi Tim</span>
        </button>

        {/* 7. Multiplayer Class Lobby */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenMultiplayer();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-purple-600/30 active:scale-95 transition-all text-slate-200 hover:text-white border border-transparent hover:border-purple-400/50 min-w-[58px] sm:min-w-[68px]"
          title="Ruang Kelas Multiplayer"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Kelas</span>
        </button>

        {/* 8. Panduan & Data Siswa */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenLoginProfile();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-emerald-600/30 active:scale-95 transition-all text-slate-200 hover:text-white border border-transparent hover:border-emerald-400/50 min-w-[58px] sm:min-w-[68px]"
          title="Data Siswa, Panduan Bermain & Tujuan Pembelajaran"
        >
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">Panduan</span>
        </button>

        {/* 9. Profil Pengembang */}
        <button
          onClick={() => {
            sounds.playScan();
            onOpenDeveloperProfile();
          }}
          className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-t from-teal-950 to-emerald-950/40 hover:from-teal-900 hover:to-emerald-800/60 active:scale-95 transition-all text-emerald-300 hover:text-white border border-teal-400/40 min-w-[62px] sm:min-w-[72px]"
          title="Profil Pengembang & Pendidik"
        >
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-tight text-emerald-200">Guru/Dev</span>
        </button>
      </div>
    </div>
  );
};
