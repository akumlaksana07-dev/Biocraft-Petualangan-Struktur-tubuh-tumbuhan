import React, { useState } from 'react';
import {
  User,
  School,
  BookOpen,
  Compass,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Award,
  ChevronRight,
  ArrowRight,
  Dna,
  Zap,
  Gamepad2,
  GraduationCap,
  Info,
} from 'lucide-react';
import { StudentProfile } from '../types/game';
import { sounds } from '../utils/soundEffects';

interface LoginOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
  isFirstTime?: boolean;
}

export const LoginOnboardingModal: React.FC<LoginOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  isFirstTime = false,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'guide' | 'curriculum'>('login');
  const [name, setName] = useState(currentProfile.name || '');
  const [school, setSchool] = useState(currentProfile.school || '');
  const [grade, setGrade] = useState(currentProfile.grade || 'Kelas VIII-A');
  const [title, setTitle] = useState(currentProfile.title || 'Penjelajah Sel Muda');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Wajib diisi: Harap masukkan nama lengkap siswa untuk memulai permainan!');
      return;
    }
    if (!school.trim()) {
      setErrorMsg('Wajib diisi: Harap masukkan nama asal sekolah (SMP / MTs) untuk memulai permainan!');
      return;
    }

    sounds.playCorrect();
    onSaveProfile({
      name: name.trim(),
      school: school.trim(),
      grade,
      title,
    });
    onClose();
  };

  const TITLE_OPTIONS = [
    'Penjelajah Sel Muda',
    'Peneliti Sitologi Junior',
    'Pakar Fotosintesis Kloroplas',
    'Master Fisiologi Tumbuhan',
    'Detektif Mikroskopik SMP',
  ];

  const SCHOOL_SUGGESTIONS = [
    'SMP Negeri 1',
    'SMP Negeri 2',
    'SMP Labschool',
    'SMP BPK Penabur',
    'SMP Al Azhar',
    'SMP Kesatuan Bangsa',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 overflow-hidden">
          {/* Subtle cytological particles pattern */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg text-slate-950 font-black border border-white/40">
                <Dna className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Kurikulum Merdeka IPA Fase D
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  BioCraft 3D: Ekspedisi Sel
                </h2>
                <p className="text-xs text-slate-300">
                  Pembelajaran Interaktif Struktur & Fisiologi Sel Tumbuhan SMP Kelas VIII
                </p>
              </div>
            </div>

            {!isFirstTime && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/10 text-xs font-bold">
            <button
              onClick={() => {
                sounds.playScan();
                setActiveTab('login');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Data Siswa & Masuk</span>
            </button>

            <button
              onClick={() => {
                sounds.playScan();
                setActiveTab('guide');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'guide'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Panduan Bermain</span>
            </button>

            <button
              onClick={() => {
                sounds.playScan();
                setActiveTab('curriculum');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Materi & Tujuan Pelajaran</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* ================= TAB 1: FORM LOGIN / DATA SISWA ================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleStartGame} className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Selamat Datang di Laboratorium Sel 3D!</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Silakan masukkan Nama Lengkap dan Asal Sekolah kamu. Skor kuis dan hasil eksplorasi
                  kamu akan dicatat dan diakumulasikan secara resmi ke dalam Papan Peringkat Top 20!
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-400/50 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Input Nama Siswa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nama Lengkap Siswa:</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Contoh: Arya Satria Pratama"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 focus:border-emerald-400 focus:outline-none text-white text-sm placeholder:text-slate-500 shadow-inner"
                  required
                />
              </div>

              {/* Input Asal Sekolah */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Asal Sekolah (SMP / MTs):</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => {
                    setSchool(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Contoh: SMP Negeri 1 Surabaya"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 focus:border-emerald-400 focus:outline-none text-white text-sm placeholder:text-slate-500 shadow-inner"
                  required
                />

                {/* Quick School Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                  {SCHOOL_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSchool(s)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-slate-300 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row: Kelas & Gelar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Rombel / Kelas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kelas / Rombel:</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 focus:border-emerald-400 focus:outline-none text-white text-sm cursor-pointer"
                  >
                    <option value="Kelas VIII-A">Kelas VIII-A</option>
                    <option value="Kelas VIII-B">Kelas VIII-B</option>
                    <option value="Kelas VIII-C">Kelas VIII-C</option>
                    <option value="Kelas VIII-D">Kelas VIII-D</option>
                    <option value="Kelas VIII-E">Kelas VIII-E</option>
                    <option value="Kelas VIII-F">Kelas VIII-F</option>
                    <option value="Klub Sains Biologi">Klub Sains Biologi (Olimpiade)</option>
                  </select>
                </div>

                {/* Gelar Penjelajah */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gelar Penjelajah Awal:</span>
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-white/20 focus:border-emerald-400 focus:outline-none text-white text-sm cursor-pointer"
                  >
                    {TITLE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span>Mulai Masuk & Jelajahi Sel 3D</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          )}

          {/* ================= TAB 2: PANDUAN BERMAIN SEDERHANA ================= */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span>Panduan Sederhana Kontrol & Eksplorasi Game</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Kendalikan avatar siswa penjelajah berukuran nano di dalam sel tumbuhan hidup!
                </p>
              </div>

              {/* Key Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Navigasi Bergerak */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 font-black text-emerald-300">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      1
                    </span>
                    <span>Navigasi & Berjalan</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Gunakan tombol keyboard <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/20 font-mono text-[10px] text-white">W</kbd>{' '}
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/20 font-mono text-[10px] text-white">A</kbd>{' '}
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/20 font-mono text-[10px] text-white">S</kbd>{' '}
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/20 font-mono text-[10px] text-white">D</kbd>{' '}
                    atau <strong>Tombol Panah</strong> arah. Pada perangkat layar sentuh, gerakkan <strong>Virtual Joystick</strong> atau sentuh tombol arah D-Pad di kiri bawah.
                  </p>
                </div>

                {/* 2. Kamera & Lompat */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 font-black text-cyan-300">
                    <span className="w-5 h-5 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      2
                    </span>
                    <span>Putar Sudut Pandang & Lompat</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Geser layar sebelah kanan untuk memutar kamera 3D. Tekan tombol <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/20 font-mono text-[10px] text-white">Spasi</kbd> atau tombol <strong>LOMPAT</strong> di kanan bawah.
                  </p>
                </div>

                {/* 3. Trampolin Vakuola */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 font-black text-sky-300">
                    <span className="w-5 h-5 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
                      3
                    </span>
                    <span>Trampolin Tekanan Turgor Vakuola</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Lompatlah ke atas kubah biru <strong>Vakuola Sentral</strong> untuk memantul tinggi ke angkasa sel dan melihat pemandangan seluruh organel dari atas!
                  </p>
                </div>

                {/* 4. Panah Penunjuk Arah & Scan */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 font-black text-amber-300">
                    <span className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                      4
                    </span>
                    <span>Panah Kompas & Pindai Organel</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Ikuti jarum <strong>Panah Penunjuk Arah</strong> di bagian atas layar. Saat mendekati organel, tombol <strong>PINDAI / SCAN</strong> akan menyala untuk membuka materi dan mendapatkan poin ATP!
                  </p>
                </div>
              </div>

              {/* Ready button */}
              <button
                onClick={() => setActiveTab('login')}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Sudah Paham? Lanjut Isi Data Siswa</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= TAB 3: PENGENALAN MATERI & TUJUAN PEMBELAJARAN ================= */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              {/* Deskripsi Materi */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>Pengenalan Materi: Struktur & Fungsi Tubuh Tumbuhan</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Materi ini merupakan bagian pokok dari <strong>Mata Pelajaran IPA SMP Kelas VIII Fase D</strong>. Siswa diajak memahami bahwa tumbuhan tingkat tinggi tersusun atas unit fungsional terkecil berupa <strong>sel tumbuhan</strong> yang memiliki dinding sel kaku dari serat selulosa, plastida berklorofil (kloroplas), dan vakuola turgor raksasa yang membedakannya secara fundamental dari sel hewan.
                </p>
              </div>

              {/* 4 Tujuan Pembelajaran (TP) Lengkap */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Tujuan Pembelajaran (TP) Kurikulum Merdeka:
                </h4>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>TP 1: Identifikasi Organel & Struktur Sel Tumbuhan</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                    Peserta didik mampu mengidentifikasi dan mendeskripsikan struktur organel sel (dinding sel, membran sel, kloroplas, vakuola sentral, nukleus, mitokondria, retikulum endoplasma, dan badan golgi) serta fungsinya dalam menjaga kehidupan seluler.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-teal-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>TP 2: Analisis Proses Fisiologi & Metabolisme Seluler</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                    Peserta didik mampu menjelaskan mekanisme fotosintesis pada tilakoid & stroma kloroplas, respirasi seluler aerob penghasil molekul energi ATP pada krista mitokondria, serta peran tekanan turgor vakuola dalam menegakkan tubuh tumbuhan.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-cyan-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>TP 3: Keterpaduan Jaringan Tumbuhan & Transportasi Vaskular</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                    Peserta didik mampu membedakan karakteristik jaringan epidermis (dengan derivat stomata dan kutikula), jaringan parenkim dasar, jaringan penguat (kolenkim dan sklerenkim), serta berkas pengangkut xilem dan floem dalam translokasi air dan nutrisi.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>TP 4: Penalaran Kritis Eksperimen Sains (HOTS)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                    Peserta didik mampu menganalisis hasil percobaan klasik biologi (percobaan Sachs untuk uji amilum dan percobaan Ingenhousz untuk pelepasan gas oksigen) serta fenomena plasmolisis pada larutan hipertonik.
                  </p>
                </div>
              </div>

              {/* Ready button */}
              <button
                onClick={() => setActiveTab('login')}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Siap Belajar? Lanjut ke Formulir Masuk</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Server Kelas Aktif • Mode Multiplayer Sinkron</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">IPA Kelas 8 SMP</span>
        </div>
      </div>
    </div>
  );
};
