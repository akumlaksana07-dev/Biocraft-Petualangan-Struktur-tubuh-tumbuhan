import React, { useState } from 'react';
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
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
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

  // Quiz execution state
  const [levelQuestions, setLevelQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  // Start a specific level
  const handleStartLevel = (lvl: QuizLevelMeta) => {
    setSelectedLevel(lvl);
    const questions = QUIZ_QUESTIONS.filter((q) => q.levelId === lvl.id);
    setLevelQuestions(questions);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsAnswerSubmitted(false);
    setEarnedScore(0);
    setShowHint(false);
    setViewState('in_quiz');
    sounds.playJump();
  };

  const currentQ = levelQuestions[currentIndex] || levelQuestions[0];
  const totalQuestions = levelQuestions.length;
  const maxPossibleScore = levelQuestions.reduce((acc, q) => acc + q.points, 0) || 100;

  const handleSelectOption = (optIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: optIndex });
    setIsAnswerSubmitted(true);

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

  const handleRestartLevel = () => {
    handleStartLevel(selectedLevel);
  };

  const finalPercent = Math.round((earnedScore / maxPossibleScore) * 100);
  const isPassed = finalPercent >= selectedLevel.minPassScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
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
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Jenjang Kompetensi IPA SMP Kelas VIII</h3>
                <p className="text-xs text-slate-300">
                  Selesaikan setiap level untuk mengumpulkan bintang, poin ATP, dan sertifikat ketuntasan!
                </p>
              </div>
              <span className="text-2xl">🌱</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {QUIZ_LEVELS.map((lvl) => {
                const recorded = levelScores[lvl.id];
                const count = QUIZ_QUESTIONS.filter((q) => q.levelId === lvl.id).length;

                return (
                  <div
                    key={lvl.id}
                    onClick={() => handleStartLevel(lvl)}
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
                      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{lvl.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                      <span className="text-slate-400 font-semibold">{count} Soal Pilihan</span>
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
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-2">
                  <span>Soal {currentIndex + 1} dari {totalQuestions}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-bold" style={{ color: selectedLevel.color }}>
                    {currentQ.difficulty === 'sederhana'
                      ? '🟢 Sederhana'
                      : currentQ.difficulty === 'menengah'
                      ? '🟡 Menengah'
                      : '🔴 Menantang'}
                  </span>
                </span>
                <span className="text-emerald-400 font-bold">
                  Nilai: {earnedScore} / {maxPossibleScore}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Topic & Prompt */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Topik: {currentQ.topic}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">+{currentQ.points} Poin</span>
              </div>
              <h3 className="text-base font-bold text-white leading-relaxed">{currentQ.question}</h3>
            </div>

            {/* Hint Button */}
            {currentQ.hint && !isAnswerSubmitted && (
              <div>
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 font-semibold"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Petunjuk Guru (Klik untuk Membuka)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-amber-950/40 border border-amber-400/30 rounded-xl text-xs text-amber-200">
                    💡 <b>Petunjuk:</b> {currentQ.hint}
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentIndex] === idx;
                let btnStyle = 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-700/80';

                if (isAnswerSubmitted) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/80 border-rose-400 text-rose-200 line-through';
                  } else {
                    btnStyle = 'bg-slate-900/40 border-white/5 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isAnswerSubmitted && idx === currentQ.correctIndex && (
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && idx !== currentQ.correctIndex && (
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box on submit */}
            {isAnswerSubmitted && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  selectedAnswers[currentIndex] === currentQ.correctIndex
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {selectedAnswers[currentIndex] === currentQ.correctIndex
                    ? `🎉 Hebat! Jawaban Benar (+${currentQ.points} Poin)`
                    : '💡 Pembahasan IPA Kelas VIII:'}
                </div>
                <p className="text-slate-300 leading-normal">{currentQ.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: RESULTS & CERTIFICATE ================= */}
        {viewState === 'result' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-center">
            <div className="space-y-2">
              <div className="text-4xl">{isPassed ? '🏆' : '📚'}</div>
              <h3 className="text-2xl font-black text-white">
                {isPassed ? `Selamat! Kamu Lulus ${selectedLevel.title}` : 'Hasil Evaluasi Level'}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {isPassed
                  ? `Prestasi gemilang! Kamu telah menuntaskan target kompetensi IPA untuk ${selectedLevel.subtitle}.`
                  : `Skor kamu belum mencapai batas minimal kelulusan (${selectedLevel.minPassScore}%). Pelajari kembali materi dan coba lagi!`}
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
                    <h4 className="text-base font-black text-white">
                      BioCraft 3D: {selectedLevel.title}
                    </h4>
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
              <div className="text-xs text-slate-400">Total 38 Soal Terstruktur • 4 Tingkatan</div>
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
                onClick={handleRestartLevel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Level Ini</span>
              </button>

              <div className="flex gap-2">
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
