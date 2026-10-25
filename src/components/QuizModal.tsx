import React, { useState, useMemo } from 'react';
import { QUIZ_QUESTIONS, QUIZ_LEVELS, QuizLevelMeta } from '../data/biologyData';
import { QuizQuestion } from '../types/game';
import {
  X,
  CheckCircle,
  XCircle,
  Award,
  RotateCcw,
  Sparkles,
  ChevronRight,
  HelpCircle,
  ArrowLeft,
  Star,
  Check,
  Zap,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { LevelTransitionOverlay } from './LevelTransitionOverlay';
import confetti from 'canvas-confetti';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onQuizComplete: (score: number, levelId: number, atpReward: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  playerName,
  onQuizComplete,
}) => {
  // Current view: 'level_select' | 'in_quiz' | 'result'
  const [viewState, setViewState] = useState<'level_select' | 'in_quiz' | 'result'>('level_select');
  const [selectedLevel, setSelectedLevel] = useState<QuizLevelMeta>(QUIZ_LEVELS[0]);
  const [levelScores, setLevelScores] = useState<Record<number, { score: number; stars: number }>>({});

  // Question replacement tracking (persisted so answered questions get filtered out and replaced)
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('biocraft_answered_questions');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Cinematic Level Transition State (Warping / Fade-to-black)
  const [transitionActive, setTransitionActive] = useState<boolean>(false);
  const [transitionTargetLevel, setTransitionTargetLevel] = useState<QuizLevelMeta | null>(null);
  const [transitionSubtitle, setTransitionSubtitle] = useState<string>('Menyiapkan Bank Soal Baru Kurikulum...');

  // Quiz execution state
  const [levelQuestions, setLevelQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Helper to persist answered questions
  const saveAnsweredQuestions = (newSet: Set<number>) => {
    setAnsweredQuestionIds(newSet);
    try {
      localStorage.setItem('biocraft_answered_questions', JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  // Filter out answered questions and draw fresh questions
  const loadQuestionsForLevel = (lvl: QuizLevelMeta): QuizQuestion[] => {
    const allForLevel = QUIZ_QUESTIONS.filter((q) => q.levelId === lvl.id);
    const unasked = allForLevel.filter((q) => !answeredQuestionIds.has(q.id));

    if (unasked.length >= 6) {
      // Pick 6 random fresh unasked questions
      return [...unasked].sort(() => Math.random() - 0.5).slice(0, 6);
    } else if (unasked.length > 0) {
      // Use all remaining unasked questions, and supplement with recycled questions
      const remainingNeed = 6 - unasked.length;
      const recycled = allForLevel
        .filter((q) => answeredQuestionIds.has(q.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingNeed);
      return [...unasked, ...recycled];
    } else {
      // All questions completed! Reset answered tracking for this level to allow practice
      const updated = new Set(answeredQuestionIds);
      allForLevel.forEach((q) => updated.delete(q.id));
      saveAnsweredQuestions(updated);
      return [...allForLevel].sort(() => Math.random() - 0.5).slice(0, 6);
    }
  };

  // Start Level with Cinematic Visual Transition (Warping / Fade-to-black)
  const handleStartLevelWithTransition = (
    lvl: QuizLevelMeta,
    subtitle: string = 'Menyiapkan Bank Soal Baru Kurikulum...'
  ) => {
    setTransitionTargetLevel(lvl);
    setTransitionSubtitle(subtitle);
    setTransitionActive(true);
  };

  // Transition Midpoint Callback: Execute state changes while screen is completely dark
  const handleTransitionMidpoint = () => {
    if (transitionTargetLevel) {
      setSelectedLevel(transitionTargetLevel);
      const questions = loadQuestionsForLevel(transitionTargetLevel);
      setLevelQuestions(questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsAnswerSubmitted(false);
      setEarnedScore(0);
      setShowHint(false);
      setViewState('in_quiz');
    }
  };

  const handleTransitionComplete = () => {
    setTransitionActive(false);
  };

  // Reset answered questions history for fresh test
  const handleResetHistoryForLevel = (levelId?: number) => {
    if (levelId !== undefined) {
      const updated = new Set(answeredQuestionIds);
      QUIZ_QUESTIONS.filter((q) => q.levelId === levelId).forEach((q) => updated.delete(q.id));
      saveAnsweredQuestions(updated);
    } else {
      saveAnsweredQuestions(new Set());
    }
    sounds.playScan();
  };

  if (!isOpen) return null;

  const currentQ = levelQuestions[currentIndex] || levelQuestions[0];
  const totalQuestions = levelQuestions.length;
  const maxPossibleScore = levelQuestions.reduce((acc, q) => acc + q.points, 0) || 100;

  const handleSelectOption = (optIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: optIndex });
    setIsAnswerSubmitted(true);

    // Record answered question so it is retired and replaced with fresh questions next time
    if (currentQ) {
      const updated = new Set(answeredQuestionIds);
      updated.add(currentQ.id);
      saveAnsweredQuestions(updated);
    }

    if (optIndex === currentQ.correctIndex) {
      sounds.playCorrect();
      setEarnedScore((s) => s + currentQ.points);
    } else {
      sounds.playWrong();
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((c) => c + 1);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      // Quiz finished
      setViewState('result');
      const finalScorePercent = Math.round((earnedScore / maxPossibleScore) * 100);

      let stars = 0;
      if (finalScorePercent >= 90) stars = 3;
      else if (finalScorePercent >= 75) stars = 2;
      else if (finalScorePercent >= selectedLevel.minPassScore) stars = 1;

      setLevelScores((prev) => ({
        ...prev,
        [selectedLevel.id]: {
          score: Math.max(prev[selectedLevel.id]?.score || 0, finalScorePercent),
          stars: Math.max(prev[selectedLevel.id]?.stars || 0, stars),
        },
      }));

      const passed = finalScorePercent >= selectedLevel.minPassScore;
      const atpEarned = passed ? selectedLevel.atpReward : Math.floor(selectedLevel.atpReward * 0.25);
      onQuizComplete(finalScorePercent, selectedLevel.id, atpEarned);

      if (passed) {
        confetti({ particleCount: 110, spread: 80 });
      }
    }
  };

  const finalPercent = Math.round((earnedScore / maxPossibleScore) * 100);
  const isPassed = finalPercent >= selectedLevel.minPassScore;
  const nextLevel = QUIZ_LEVELS.find((l) => l.id === selectedLevel.id + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      {/* Cinematic Warp & Fade-to-Black Transition Overlay */}
      <LevelTransitionOverlay
        isActive={transitionActive}
        levelTitle={transitionTargetLevel?.title}
        levelSubtitle={transitionSubtitle}
        badge={transitionTargetLevel?.badge}
        accentColor={transitionTargetLevel?.color}
        onMidpoint={handleTransitionMidpoint}
        onComplete={handleTransitionComplete}
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            {viewState !== 'level_select' && (
              <button
                onClick={() => setViewState('level_select')}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Kembali ke Pilihan Level"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                {viewState === 'level_select' ? 'Tingkatan Kuis & Ujian Sel' : selectedLevel.title}
              </h2>
              <p className="text-xs text-emerald-300">
                {viewState === 'level_select'
                  ? 'Pilih level tantangan dari sederhana hingga HOTS menantang'
                  : selectedLevel.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= VIEW 1: LEVEL SELECTION ================= */}
        {viewState === 'level_select' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Dynamic Question Replacement Info Banner */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-800/80 p-3.5 rounded-2xl border border-emerald-400/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Sistem Bank Soal Dinamis Aktif</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      Anti-Duplikasi
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Soal yang sudah kamu jawab otomatis diganti dengan pertanyaan baru yang relevan dari kurikulum IPA SMP.
                  </p>
                </div>
              </div>
              {answeredQuestionIds.size > 0 && (
                <button
                  onClick={() => handleResetHistoryForLevel()}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Reset semua riwayat soal"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Riwayat ({answeredQuestionIds.size})</span>
                </button>
              )}
            </div>

            {/* Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {QUIZ_LEVELS.map((lvl) => {
                const recorded = levelScores[lvl.id];
                const allForLvl = QUIZ_QUESTIONS.filter((q) => q.levelId === lvl.id);
                const unaskedCount = allForLvl.filter((q) => !answeredQuestionIds.has(q.id)).length;

                return (
                  <div
                    key={lvl.id}
                    onClick={() =>
                      handleStartLevelWithTransition(
                        lvl,
                        `Memasuki ${lvl.title} • Menyiapkan Soal Kurikulum...`
                      )
                    }
                    className="p-4 rounded-2xl border border-white/15 hover:border-emerald-400/80 bg-slate-800/70 hover:bg-slate-800/90 transition-all cursor-pointer shadow-md flex flex-col justify-between space-y-3 group active:scale-[0.98]"
                    style={{ borderLeftColor: lvl.color, borderLeftWidth: '5px' }}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                          {lvl.badge}
                        </span>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3.5 h-3.5 ${
                                recorded && recorded.stars >= starIdx
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                        {lvl.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                        {lvl.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{unaskedCount} soal baru tersedia</span>
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>+{lvl.atpReward} ATP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= VIEW 2: IN QUIZ ================= */}
        {viewState === 'in_quiz' && currentQ && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Progress bar and badges */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-2">
                  <span>
                    Soal {currentIndex + 1} dari {totalQuestions}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-bold"
                    style={{ color: selectedLevel.color }}
                  >
                    {currentQ.difficulty === 'sederhana'
                      ? '🟢 Sederhana'
                      : currentQ.difficulty === 'menengah'
                      ? '🟡 Menengah'
                      : '🔴 Menantang'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    ✨ Pertanyaan Baru
                  </span>
                </span>
                <span className="text-emerald-400 font-bold">
                  Nilai: {earnedScore} / {maxPossibleScore}
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="p-5 bg-slate-800/60 rounded-2xl border border-white/15 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-400">{currentQ.topic}</span>
                <span className="font-mono text-amber-300 font-bold">+{currentQ.points} Poin</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;

                let btnStyle = 'border-white/10 bg-slate-800 hover:bg-slate-750 text-slate-200';
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/70 text-emerald-200 shadow-md shadow-emerald-500/20';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-950/70 text-rose-200';
                  } else {
                    btnStyle = 'border-white/5 bg-slate-900/40 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-emerald-400 bg-emerald-900/40 text-white';
                }

                return (
                  <button
                    key={optIdx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between group active:scale-[0.99] ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold font-mono">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswerSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Hint Section */}
            {isAnswerSubmitted && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Penjelasan Guru IPA SMP:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                <div className="text-[10px] text-emerald-400 font-medium pt-1">
                  💡 Pertanyaan ini telah dicatat dan akan diganti dengan soal baru berikutnya!
                </div>
              </div>
            )}

            {!isAnswerSubmitted && currentQ.hint && (
              <div className="flex items-center justify-between text-xs pt-1">
                {showHint ? (
                  <span className="text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Petunjuk: {currentQ.hint}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Butuh Petunjuk?</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: RESULT VIEW ================= */}
        {viewState === 'result' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-center">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-xl border-2 border-white/20 bg-emerald-500/20 text-emerald-400">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">
                {isPassed ? 'Selamat, Kamu Lulus Level Ini!' : 'Ayo Semangat, Coba Lagi!'}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {isPassed
                  ? `Luar biasa! Kamu telah menguasai kompetensi dasar "${selectedLevel.subtitle}". Soal baru telah disiapkan untuk tantangan berikutnya.`
                  : `Skor kamu belum mencapai batas minimal kelulusan (${selectedLevel.minPassScore}%). Soal akan diganti dengan variasi pertanyaan baru!`}
              </p>
            </div>

            {/* Score & Stars Banner */}
            <div className="inline-flex flex-col items-center bg-slate-800/80 px-8 py-4 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-6 h-6 ${
                      (finalPercent >= 90 && starIdx <= 3) ||
                      (finalPercent >= 75 && starIdx <= 2) ||
                      (finalPercent >= selectedLevel.minPassScore && starIdx === 1)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-3xl font-black text-emerald-400">{finalPercent}%</span>
              <span className="text-xs text-slate-400">
                Skor: {earnedScore} dari total {maxPossibleScore} poin
              </span>
            </div>

            {/* Certificate Card */}
            {isPassed && (
              <div className="p-6 bg-gradient-to-b from-amber-950/40 via-slate-900 to-emerald-950/40 rounded-3xl border-2 border-amber-400/60 shadow-xl space-y-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                      SERTIFIKAT KETUNTASAN BELAJAR IPA SMP
                    </span>
                    <h4 className="text-base font-black text-white">BioCraft 3D: {selectedLevel.title}</h4>
                  </div>
                  <span className="text-2xl">🌱</span>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p>Diberikan dengan bangga kepada:</p>
                  <p className="text-lg font-black text-amber-300">{playerName || 'Siswa Berprestasi'}</p>
                  <p className="text-xs text-slate-400">Mata Pelajaran: Ilmu Pengetahuan Alam (IPA) Kelas VIII SMP</p>
                  <p className="text-xs text-slate-400">Materi: {selectedLevel.subtitle}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400 font-mono">
                  <span>Predikat: {finalPercent >= 90 ? 'Amat Baik' : 'Baik'}</span>
                  <span>Tanggal: {new Date().toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          {viewState === 'level_select' ? (
            <>
              <div className="text-xs text-slate-400">Total 64 Soal Terstruktur • 4 Tingkatan Kompetensi</div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Tutup
              </button>
            </>
          ) : viewState === 'in_quiz' ? (
            <>
              <button
                onClick={() => setViewState('level_select')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Pilih Level Lain</span>
              </button>

              <button
                disabled={!isAnswerSubmitted}
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-lg transition-transform active:scale-95"
              >
                <span>{currentIndex < totalQuestions - 1 ? 'Soal Selanjutnya' : 'Lihat Hasil & Nilai'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  handleStartLevelWithTransition(
                    selectedLevel,
                    'Mengganti Soal yang Sudah Dijawab dengan Soal Baru...'
                  )
                }
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Mainkan Soal Baru Berikutnya</span>
              </button>

              <div className="flex gap-2">
                {nextLevel && (
                  <button
                    onClick={() =>
                      handleStartLevelWithTransition(
                        nextLevel,
                        `Melompati Membran Menuju ${nextLevel.title}...`
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all active:scale-95"
                  >
                    <span>Lanjut ke Level {nextLevel.id}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setViewState('level_select')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                >
                  Pilihan Level
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Selesai
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
