import { Customization } from '../types/game';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'eksplorasi' | 'pengetahuan' | 'mini_game' | 'sosial';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  rewardType: 'atp' | 'title' | 'hat' | 'accessory';
  rewardValue: string | number;
  rewardLabel: string;
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_explore_all',
    title: 'Penjelajah Seluruh Sitoplasma',
    description: 'Kunjungi dan scan seluruh 10 organel dan struktur jaringan tumbuhan di peta 3D.',
    icon: '🧭',
    category: 'eksplorasi',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    rewardType: 'title',
    rewardValue: 'Master Penjelajah Sitoplasma',
    rewardLabel: 'Gelar Eksklusif: Master Penjelajah Sitoplasma',
  },
  {
    id: 'ach_atp_15',
    title: 'Kolektor Energi ATP',
    description: 'Kumpulkan 10 kristal molekul energi ATP dari sekitar Mitokondria & Kloroplas.',
    icon: '⚡',
    category: 'eksplorasi',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    rewardType: 'accessory',
    rewardValue: 'jetpack',
    rewardLabel: 'Aksesoris: Jetpack Klorofil Berkilau',
  },
  {
    id: 'ach_build_cell',
    title: 'Arsitek Sel Handal',
    description: 'Selesaikan mini-game "Bangun Sel Tumbuhan" dengan menempatkan semua organel dengan tepat.',
    icon: '🏗️',
    category: 'mini_game',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardType: 'hat',
    rewardValue: 'leaf_cap',
    rewardLabel: 'Topi: Topi Tunas Daun Hijau',
  },
  {
    id: 'ach_photosynthesis',
    title: 'Pakar Fotosintesis Kloroplas',
    description: 'Sintesis minimal 3 molekul glukosa pada mini-game Lab Kloroplas.',
    icon: '☀️',
    category: 'mini_game',
    progress: 0,
    maxProgress: 3,
    unlocked: false,
    rewardType: 'atp',
    rewardValue: 50,
    rewardLabel: '+50 Cadangan Energi ATP',
  },
  {
    id: 'ach_quiz_perfect',
    title: 'Juara Kuis IPA Kelas VIII',
    description: 'Jawab 10 pertanyaan pada kuis evaluasi materi struktur tumbuhan dengan skor sempurna.',
    icon: '🎓',
    category: 'pengetahuan',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    rewardType: 'title',
    rewardValue: 'Profesor Botani SMP',
    rewardLabel: 'Gelar Prestasi: Profesor Botani SMP',
  },
  {
    id: 'ach_trivia_5',
    title: 'Cendekiawan Sel Keliling',
    description: 'Jawab 5 pertanyaan trivia acak saat menjelajahi dunia 3D sel.',
    icon: '💡',
    category: 'pengetahuan',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    rewardType: 'hat',
    rewardValue: 'goggles',
    rewardLabel: 'Item Kepala: Kacamata Peneliti Lab',
  },
  {
    id: 'ach_stomata_master',
    title: 'Penjaga Transpirasi Stomata',
    description: 'Pahami mekanisme turgor sel penjaga dan pelajari sistem pembuluh xilem & floem.',
    icon: '🍃',
    category: 'mini_game',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardType: 'atp',
    rewardValue: 30,
    rewardLabel: '+30 Energi ATP',
  },
  {
    id: 'ach_multiplayer_collab',
    title: 'Kolaborasi Lab SMP',
    description: 'Bergabung di ruang kelas multiplayer dan kirim pesan diskusi biologi dengan teman.',
    icon: '🤝',
    category: 'sosial',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardType: 'accessory',
    rewardValue: 'dna_wings',
    rewardLabel: 'Aksesoris: Sayap DNA Helix Berpendar',
  },
];
