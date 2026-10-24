export interface Customization {
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  face: 'smile' | 'cool' | 'goggles' | 'nerd' | 'happy' | 'determined';
  hat: 'none' | 'goggles' | 'leaf_cap' | 'scientist_hair' | 'spiky_hair' | 'peci_hijab';
  accessory: 'none' | 'backpack' | 'jetpack' | 'dna_wings' | 'microscope';
}

export interface PlayerData {
  id: string;
  name: string;
  grade: string;
  title: string;
  room: string;
  customization: Customization;
  x: number;
  y: number;
  z: number;
  rotY: number;
  anim: 'idle' | 'walk' | 'jump' | 'cheer' | 'dance';
  score: number;
  collectedAtp: number;
}

export interface OrganelleInfo {
  id: string;
  name: string;
  latinName: string;
  category: 'organel_utama' | 'pembungkus' | 'jaringan_tumbuhan';
  location: [number, number, number];
  color: string;
  tagline: string;
  summary: string;
  structure: string[];
  function: string[];
  curriculumKeyPoint: string;
  funFact: string;
  atpReward: number;
}

export interface QuizQuestion {
  id: number;
  levelId: 1 | 2 | 3 | 4;
  difficulty: 'sederhana' | 'menengah' | 'menantang';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  hint?: string;
  points: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardAtp: number;
  completed: boolean;
  type: 'scan' | 'collect_atp' | 'quiz' | 'photosynthesis';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
}
