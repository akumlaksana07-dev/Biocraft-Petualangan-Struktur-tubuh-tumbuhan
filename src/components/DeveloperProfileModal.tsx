import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Mail,
  GraduationCap,
  Sparkles,
  Layers,
  Heart,
  Check,
  Copy,
  BookOpen,
  Award,
  Globe,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const email = 'akumlaksana07@guru.smp.belajar.id';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    sounds.playScan();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Profil Pengembang & Pendidik</h2>
              <p className="text-xs text-emerald-300">BioCraft 3D • Media Pembelajaran IPA SMP Kelas VIII</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* Main Developer Identity Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-800/80 to-slate-900 border-2 border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-white/50 flex items-center justify-center text-3xl shadow-lg text-white font-black">
                AL
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-slate-900 text-xs">
                🌱
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-black text-white">Akum Laksana, S.Pd.</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Guru IPA SMP
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Pendidik & Inovator Media Pembelajaran Digital Berbasis Gamifikasi 3D
              </p>

              {/* Email Contact pill */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-mono text-emerald-300">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{email}</span>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Salin Email"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Visi Pembelajaran */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>Visi & Filosofi Pembelajaran</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aplikasi ini dikembangkan untuk mentransformasi materi biologi sel dan struktur jaringan tumbuhan yang
              biasanya bersifat mikroskopis dan abstrak menjadi pengalaman petualangan interaktif yang nyata (*experiential learning*).
              Mengadopsi daya tarik dunia bergaya <b>Roblox</b> yang digemari peserta didik usia SMP, siswa didorong untuk
              bereksplorasi secara mandiri, berkolaborasi dengan teman sekelas, dan menguji kemampuan dari tingkat konsep dasar hingga
              penalaran tinggi (*HOTS*).
            </p>
          </div>

          {/* 4 Pilar Edukasi BioCraft 3D */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Pilar Pembelajaran yang Diterapkan</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-emerald-300">🔬 1. Eksplorasi Seluler 3D</span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Melihat organel sel (Kloroplas, Vakuola, Mitokondria, Inti Sel) secara spasial 3 dimensi.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-amber-300">📈 2. 4 Level Evaluasi Berjenjang</span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  38 soal terstruktur dari pengenalan sederhana hingga analisis HOTS Olimpiade Sains SMP.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-sky-300">👥 3. Ruang Kelas Multiplayer</span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Siswa dapat bergabung menggunakan kode kelas yang sama untuk riset dan donasi energi ATP bersama.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-purple-300">🧪 4. Lab Mini-Game Praktikum</span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Simulasi fotosintesis kloroplas, bangun sel, cocok cepat organel, dan turgor stomata.
                </p>
              </div>
            </div>
          </div>

          {/* Teknologi & Spesifikasi */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Teknologi: Three.js 3D • React 19 • TypeScript • WebSocket Real-Time • Web Audio API</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-300/80">Versi 2.0 • Kurikulum Merdeka</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-between items-center">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>Dedikasi untuk Kemajuan Pendidikan IPA Indonesia</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Tutup Profil
          </button>
        </div>
      </div>
    </div>
  );
};
