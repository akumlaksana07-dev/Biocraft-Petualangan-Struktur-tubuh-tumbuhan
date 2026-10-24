import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Award, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

export interface TriviaItem {
  id: string;
  topic: string;
  difficulty: 'sederhana' | 'menengah' | 'menantang';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  rewardAtp: number;
  hint?: string;
}

export const EXPLORATION_TRIVIA_POOL: TriviaItem[] = [
  // ================= SEDERHANA =================
  {
    id: 'tr_s1',
    topic: 'Kloroplas & Daun',
    difficulty: 'sederhana',
    question: 'Warna hijau pada daun tumbuhan disebabkan oleh adanya zat warna yang bernama...',
    options: ['Klorofil', 'Melanin', 'Karoten', 'Hemoglobin'],
    correctIndex: 0,
    hint: 'Zat ini tersimpan rapi di dalam kloroplas.',
    explanation: 'Klorofil adalah pigmen hijau yang menyerap gelombang cahaya matahari untuk melangsungkan proses fotosintesis.',
    rewardAtp: 10,
  },
  {
    id: 'tr_s2',
    topic: 'Dinding Sel Tumbuhan',
    difficulty: 'sederhana',
    question: 'Zat karbohidrat kompleks utama penyusun dinding sel yang membuat tubuh tumbuhan kokoh adalah...',
    options: ['Glikogen', 'Selulosa', 'Kitin', 'Albumin'],
    correctIndex: 1,
    hint: 'Bahan pembuat kertas dan kain katun.',
    explanation: 'Dinding sel tumbuhan tersusun atas serat-serat selulosa yang saling bertautan rapat sehingga kaku dan kokoh.',
    rewardAtp: 10,
  },
  {
    id: 'tr_s3',
    topic: 'Organ Pokok Tumbuhan',
    difficulty: 'sederhana',
    question: 'Organ tumbuhan yang bertugas menyerap air dan hara mineral dari dalam tanah adalah...',
    options: ['Akar', 'Batang', 'Bunga', 'Buah'],
    correctIndex: 0,
    hint: 'Tumbuh menembus ke dalam tanah.',
    explanation: 'Akar memiliki rambut-rambut akar yang berfungsi menyerap air dan mineral serta menopang tegaknya tumbuhan.',
    rewardAtp: 10,
  },
  {
    id: 'tr_s4',
    topic: 'Pusat Sel (Nukleus)',
    difficulty: 'sederhana',
    question: 'Bagian sel tumbuhan yang berfungsi sebagai pusat kendali seluruh aktivitas sel adalah...',
    options: ['Nukleus (Inti Sel)', 'Ribosom', 'Vakuola', 'Dinding Sel'],
    correctIndex: 0,
    hint: 'Memuat kromosom pembawa materi genetik DNA.',
    explanation: 'Nukleus mengendalikan metabolisme, pembelahan sel, dan pewarisan sifat genetik tumbuhan.',
    rewardAtp: 10,
  },

  // ================= MENENGAH =================
  {
    id: 'tr_m1',
    topic: 'Vakuola & Turgor',
    difficulty: 'menengah',
    question: 'Membran semipermeabel khusus yang membungkus vakuola sentral pada sel tumbuhan disebut...',
    options: ['Tonoplas', 'Plasmodesmata', 'Krista', 'Tilakoid'],
    correctIndex: 0,
    hint: 'Membran tunggal pembungkus getah vakuola.',
    explanation: 'Tonoplas adalah membran tunggal pembungkus vakuola sentral yang mengatur pertukaran air dan ion antara getah vakuola dan sitosol.',
    rewardAtp: 20,
  },
  {
    id: 'tr_m2',
    topic: 'Kloroplas & Grana',
    difficulty: 'menengah',
    question: 'Reaksi terang fotosintesis terjadi pada tumpukan kantung pipih tilakoid yang disebut...',
    options: ['Stroma', 'Granum (Grana)', 'Matriks', 'Sisterna'],
    correctIndex: 1,
    hint: 'Tersusun bertingkat seperti tumpukan koin.',
    explanation: 'Granum (jamak: grana) adalah tumpukan tilakoid yang berisi klorofil untuk menyerap foton cahaya matahari pada tahap reaksi terang.',
    rewardAtp: 20,
  },
  {
    id: 'tr_m3',
    topic: 'Fungsi Mitokondria',
    difficulty: 'menengah',
    question: 'Lipatan-lipatan pada membran dalam mitokondria yang memperluas area sintesis ATP disebut...',
    options: ['Krista', 'Silia', 'Vakuola', 'Lamela'],
    correctIndex: 0,
    hint: 'Lipatan berliku-liku di dalam matriks mitokondria.',
    explanation: 'Krista adalah lipatan membran dalam mitokondria yang menyediakan permukaan luas bagi enzim ATP sintase dan rantai transpor elektron respirasi.',
    rewardAtp: 20,
  },
  {
    id: 'tr_m4',
    topic: 'Jaringan Pengangkut Xilem',
    difficulty: 'menengah',
    question: 'Zat yang melapisi dinding sel trakea pada xilem sehingga mengalami lignifikasi dan menjadi keras seperti kayu adalah...',
    options: ['Lignin', 'Klorofil', 'Kutikula', 'Kapsaisin'],
    correctIndex: 0,
    hint: 'Zat kayu yang membuat dinding sel tebal dan kedap air.',
    explanation: 'Penebalan zat lignin (zat kayu) pada dinding sel xilem membuatnya sangat kuat untuk menahan tekanan aliran air dari akar menuju daun.',
    rewardAtp: 20,
  },
  {
    id: 'tr_m5',
    topic: 'Mekanisme Stomata',
    difficulty: 'menengah',
    question: 'Stomata pada daun akan membuka ketika sel penjaga...',
    options: [
      'Menyerap air sehingga menjadi turgid (kencang membusur)',
      'Kehilangan air sehingga mengerut (flasid)',
      'Kehilangan kloroplas',
      'Menghentikan transpirasi sepenuhnya',
    ],
    correctIndex: 0,
    hint: 'Kadar air tinggi di sel penjaga menyebabkan turgor naik.',
    explanation: 'Saat sel penjaga menyerap air secara osmosis, tekanan turgor meningkat dan dinding sel yang lebih tebal di sisi pori melengkung keluar, membuka celah stomata.',
    rewardAtp: 20,
  },
  {
    id: 'tr_m6',
    topic: 'Retikulum Endoplasma',
    difficulty: 'menengah',
    question: 'Fungsi utama Retikulum Endoplasma Halus (REH) di dalam sel tumbuhan adalah...',
    options: [
      'Sintesis lipid/lemak dan detoksifikasi senyawa kimia',
      'Menyerap energi sinar matahari',
      'Mencerna makanan secara fagositosis',
      'Menghasilkan gas oksigen',
    ],
    correctIndex: 0,
    hint: 'Permukaannya tidak berbintik ribosom.',
    explanation: 'RE Halus tidak ditempeli ribosom dan berperan memproduksi lipid, fosfolipid membran, serta menetralkan zat racun tertentu.',
    rewardAtp: 20,
  },

  // ================= MENANTANG (HOTS) =================
  {
    id: 'tr_h1',
    topic: 'Plasmolisis Sel Tumbuhan',
    difficulty: 'menantang',
    question: 'Mengapa sel tumbuhan yang direndam dalam larutan garam pekat mengalami lepasnya membran sel dari dinding sel (plasmolisis)?',
    options: [
      'Karena air di dalam sel ditarik keluar menuju larutan garam secara osmosis hipertonik',
      'Karena garam merusak ikatan selulosa dinding sel',
      'Karena klorofil berubah menjadi gas nitrogen',
      'Karena inti sel membelah diri tak terkendali',
    ],
    correctIndex: 0,
    hint: 'Konsentrasi zat terlarut di luar sel lebih tinggi daripada di dalam vakuola.',
    explanation: 'Air berpindah dari konsentrasi pelarut tinggi (dalam vakuola) ke luar sel menuju larutan garam pekat. Vakuola menyusut hingga membran sel terlepas dari dindingnya.',
    rewardAtp: 35,
  },
  {
    id: 'tr_h2',
    topic: 'Daya Isap Daun & Transpirasi',
    difficulty: 'menantang',
    question: 'Faktor pendorong paling kuat yang memungkinkan air mengalir melawan gravitasi bumi pada pohon setinggi puluhan meter adalah...',
    options: [
      'Tarikan transpirasi (daya isap daun) akibat penguapan air di stomata',
      'Gaya dorong sentrifugal bumi',
      'Tekanan udara di dalam pembuluh floem',
      'Pembentukan amilum di akar',
    ],
    correctIndex: 0,
    hint: 'Penguapan air di daun menciptakan tegangan negatif kolom air.',
    explanation: 'Penguapan air dari daun menimbulkan tarikan transpirasi yang menarik kolom air tak terputus dari akar melalui xilem karena kohesi molekul air.',
    rewardAtp: 35,
  },
  {
    id: 'tr_h3',
    topic: 'Fotolisis Reaksi Terang',
    difficulty: 'menantang',
    question: 'Pada fotosintesis, atom oksigen (O₂) yang dilepaskan ke udara oleh tumbuhan sebenarnya berasal dari pemecahan molekul...',
    options: ['Air (H₂O)', 'Karbondioksida (CO₂)', 'Glukosa (C₆H₁₂O₆)', 'Klorofil'],
    correctIndex: 0,
    hint: 'Dibuktikan melalui percobaan isotop oksigen-18 oleh Ruben dan Kamen.',
    explanation: 'Reaksi fotolisis air (Reaksi Hill) memecah 2H₂O menjadi 4H⁺ + 4e⁻ + O₂ menggunakan energi cahaya matahari pada fotosistem II di tilakoid.',
    rewardAtp: 35,
  },
  {
    id: 'tr_h4',
    topic: 'Adaptasi Tumbuhan Gurun',
    difficulty: 'menantang',
    question: 'Bagaimana tanaman kaktus berfotosintesis tanpa kehilangan banyak air di habitat gurun yang sangat terik?',
    options: [
      'Membuka stomata hanya pada malam hari (fisiologi CAM) dan batangnya menjadi tempat fotosintesis',
      'Tidak memerlukan CO₂ sama sekali untuk fotosintesis',
      'Mengeluarkan air melalui duri pada siang hari',
      'Menyimpan klorofil di ujung akar',
    ],
    correctIndex: 0,
    hint: 'Daun kaktus termodifikasi menjadi duri untuk mengurangi penguapan.',
    explanation: 'Kaktus menggunakan jalur CAM: stomata membuka malam hari saat udara dingin untuk fiksasi CO₂, sedangkan fotosintesis siang hari berlangsung dengan stomata tertutup rapat.',
    rewardAtp: 35,
  },
];

interface TriviaPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  trivia: TriviaItem;
  onAnswerCorrect: (atp: number) => void;
}

export const TriviaPopupModal: React.FC<TriviaPopupModalProps> = ({
  isOpen,
  onClose,
  trivia,
  onAnswerCorrect,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelect = (idx: number) => {
    if (hasSubmitted) return;
    setSelectedIndex(idx);
    setHasSubmitted(true);

    if (idx === trivia.correctIndex) {
      sounds.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
      onAnswerCorrect(trivia.rewardAtp);
    } else {
      sounds.playWrong();
    }
  };

  const isCorrect = selectedIndex === trivia.correctIndex;

  const difficultyBadge =
    trivia.difficulty === 'sederhana'
      ? { label: '🟢 Sederhana', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' }
      : trivia.difficulty === 'menengah'
      ? { label: '🟡 Menengah', style: 'bg-amber-500/20 text-amber-300 border-amber-400/40' }
      : { label: '🔴 Menantang (HOTS)', style: 'bg-rose-500/20 text-rose-300 border-rose-400/40' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Trivia Keliling IPA VIII
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${difficultyBadge.style}`}>
                  {difficultyBadge.label}
                </span>
              </div>
              <h3 className="text-base font-black text-white">{trivia.topic}</h3>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-400/40">
            +{trivia.rewardAtp} ATP
          </span>
        </div>

        {/* Question body */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            "{trivia.question}"
          </p>

          {/* Hint button */}
          {trivia.hint && !hasSubmitted && (
            <div>
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Butuh Petunjuk? Buka Hint</span>
                </button>
              ) : (
                <div className="p-2.5 bg-amber-950/40 border border-amber-400/30 rounded-xl text-xs text-amber-200">
                  💡 <b>Petunjuk:</b> {trivia.hint}
                </div>
              )}
            </div>
          )}

          {/* Options */}
          <div className="space-y-2.5">
            {trivia.options.map((opt, idx) => {
              let btnClass = 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-700/80';
              if (hasSubmitted) {
                if (idx === trivia.correctIndex) {
                  btnClass = 'bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400 font-bold';
                } else if (idx === selectedIndex) {
                  btnClass = 'bg-rose-950/80 border-rose-400 text-rose-200 line-through';
                } else {
                  btnClass = 'bg-slate-900/40 border-white/5 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={hasSubmitted}
                  onClick={() => handleSelect(idx)}
                  className={`w-full p-3 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between ${btnClass}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {hasSubmitted && idx === trivia.correctIndex && (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  {hasSubmitted && idx === selectedIndex && idx !== trivia.correctIndex && (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {hasSubmitted && (
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                isCorrect
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {isCorrect ? '🎉 Jawaban Tepat!' : '💡 Pembahasan IPA:'}
              </div>
              <p className="text-slate-300 leading-normal">{trivia.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-transform active:scale-95"
          >
            {hasSubmitted ? 'Lanjutkan Penjelajahan' : 'Lewati'}
          </button>
        </div>
      </div>
    </div>
  );
};
