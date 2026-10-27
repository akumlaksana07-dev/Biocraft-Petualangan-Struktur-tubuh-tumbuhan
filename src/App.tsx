/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CellWorld3D } from './game/CellWorld3D';
import { Avatar3D } from './game/Avatar3D';
import { Customization, PlayerData, ChatMessage, Quest, OrganelleInfo, StudentProfile } from './types/game';
import { INITIAL_QUESTS } from './data/biologyData';
import { INITIAL_ACHIEVEMENTS, Achievement } from './data/achievementsData';
import { TouchJoystick } from './components/TouchJoystick';
import { ControlDock } from './components/ControlDock';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { MiniGamesModal } from './components/MiniGamesModal';
import { OrganelleScannerModal } from './components/OrganelleScannerModal';
import { QuizModal } from './components/QuizModal';
import { CodexModal } from './components/CodexModal';
import { AchievementsModal } from './components/AchievementsModal';
import { TeamQuestsModal } from './components/TeamQuestsModal';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { ChatOverlay } from './components/ChatOverlay';
import { TriviaPopupModal, EXPLORATION_TRIVIA_POOL, TriviaItem } from './components/TriviaPopupModal';
import { DeveloperProfileModal } from './components/DeveloperProfileModal';
import { FootstepTrailModal } from './components/FootstepTrailModal';
import { MiniMap } from './components/MiniMap';
import { MilestoneToast, MilestoneToastData } from './components/MilestoneToast';
import { DirectionalIndicator } from './components/DirectionalIndicator';
import { LevelTransitionOverlay } from './components/LevelTransitionOverlay';
import { LoginOnboardingModal } from './components/LoginOnboardingModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { sounds } from './utils/soundEffects';
import { positionalAudio, PositionalAudioStatus } from './utils/positionalAudio';
import { Volume2, VolumeX, Maximize2, Sparkles, HelpCircle, Zap, UserCheck, Footprints, Compass, Trophy, GraduationCap, School, Radio, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

const DEFAULT_CUSTOMIZATION: Customization = {
  skinColor: '#fed8b1',
  shirtColor: '#2563eb',
  pantsColor: '#1e293b',
  face: 'goggles',
  hat: 'goggles',
  accessory: 'backpack',
  trailTheme: 'chloroplast',
  trailLevel: 2,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<CellWorld3D | null>(null);
  const localAvatarRef = useRef<Avatar3D | null>(null);
  const remoteAvatarsRef = useRef<Map<string, Avatar3D>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);

  // Player state & Student Profile (Nama, Asal Sekolah, Kelas, Gelar)
  const [selfId, setSelfId] = useState<string>(() => `p_${Math.random().toString(36).substring(2, 7)}`);
  
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('biocraft_student_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: '',
      school: '',
      grade: 'Kelas VIII-A',
      title: 'Penjelajah Sel Muda',
    };
  });

  // Mandatory login before starting: require both Name and School
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('biocraft_student_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return !parsed.name || !parsed.school;
      }
      return true;
    } catch {
      return true;
    }
  });

  // Sequential Level Progression: Level 1 must be completed to unlock Level 2
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('biocraft_unlocked_level');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 1) return val;
      }
    } catch {}
    return 1;
  });

  // Real-time Positional Audio Status for HUD
  const [audioStatus, setAudioStatus] = useState<PositionalAudioStatus>(positionalAudio.currentStatus);

  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('biocraft_student_profile');
      if (saved && JSON.parse(saved).name) return JSON.parse(saved).name;
    } catch {}
    return 'Siswa IPA VIII';
  });

  const [playerTitle, setPlayerTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('biocraft_student_profile');
      if (saved && JSON.parse(saved).title) return JSON.parse(saved).title;
    } catch {}
    return 'Penjelajah Sel Muda';
  });

  const [customization, setCustomization] = useState<Customization>(DEFAULT_CUSTOMIZATION);
  const [currentRoom, setCurrentRoom] = useState<string>('KELAS-8A');
  const [atpCount, setAtpCount] = useState<number>(15);
  const [score, setScore] = useState<number>(0);
  const [remotePlayers, setRemotePlayers] = useState<PlayerData[]>([]);

  // Mini-Map & Compass Real-Time Position & Collectibles State
  const [mapPlayerPos, setMapPlayerPos] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [mapPlayerRotY, setMapPlayerRotY] = useState<number>(0);
  const [mapCameraTheta, setMapCameraTheta] = useState<number>(0);
  const [mapCollectibles, setMapCollectibles] = useState<{ id: string; x: number; z: number; collected: boolean }[]>([]);

  // Cinematic Exploration Warp Transition
  const [isWarpTransitionActive, setIsWarpTransitionActive] = useState<boolean>(false);
  const [warpTargetInfo, setWarpTargetInfo] = useState<{ title: string; subtitle: string; color?: string }>({
    title: 'Teleportasi Organel',
    subtitle: 'Warping Melintasi Sitosol & Mikrotubulus...',
  });
  const pendingTeleportPosRef = useRef<[number, number, number] | null>(null);

  // Cooperative State
  const [sharedAtp, setSharedAtp] = useState<number>(8);
  const [photosynthesisReady, setPhotosynthesisReady] = useState<boolean>(false);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [scannedOrganelles, setScannedOrganelles] = useState<Set<string>>(new Set());

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Modals & Navigation
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [activeModal, setActiveModal] = useState<
    | 'customizer'
    | 'trail'
    | 'mini_games'
    | 'scanner'
    | 'quiz'
    | 'codex'
    | 'achievements'
    | 'quests'
    | 'lobby'
    | 'developer'
    | 'leaderboard'
    | 'login_profile'
    | null
  >(null);
  const [activeOrganelleToScan, setActiveOrganelleToScan] = useState<OrganelleInfo | null>(null);
  const [nearbyOrganelle, setNearbyOrganelle] = useState<OrganelleInfo | null>(null);

  // Interactive Exploration Trivia (Answered questions are retired and replaced with fresh ones)
  const [currentTrivia, setCurrentTrivia] = useState<TriviaItem | null>(null);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const answeredTriviaIdsRef = useRef<Set<string>>(new Set());
  const nextTriviaDistanceRef = useRef<number>(60);
  const totalDistanceWalkedRef = useRef<number>(0);

  // Audio & Fullscreen
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Player Physics & Control vectors
  const moveVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngle = useRef<{ phi: number; theta: number }>({ phi: 0.35, theta: 0 });
  const playerPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const playerVelocityY = useRef<number>(0);
  const isGrounded = useRef<boolean>(true);
  const isSprinting = useRef<boolean>(false);
  const [isSprintingState, setIsSprintingState] = useState(false);
  const activeEmoteRef = useRef<'cheer' | 'dance' | null>(null);

  // Dedicated Progressive Milestone Toasts (25%, 50%, 75%, 100%)
  const [milestoneToasts, setMilestoneToasts] = useState<MilestoneToastData[]>([]);
  const milestonesReachedRef = useRef<Set<string>>(new Set());

  // Show Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Update Achievement Progress Helper with Gradual Milestone Recognition (25%, 50%, 75%, 100%)
  const recordAchievementProgress = useCallback(
    (achId: string, delta: number = 1) => {
      setAchievements((prev) =>
        prev.map((a) => {
          if (a.id === achId) {
            const oldRatio = a.progress / a.maxProgress;
            const newProg = Math.min(a.maxProgress, a.progress + delta);
            const newRatio = newProg / a.maxProgress;

            // Check milestone progression (25%, 50%, 75%, 100%)
            const milestoneTiers: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100];
            milestoneTiers.forEach((m) => {
              const threshold = m / 100;
              const milestoneKey = `${a.id}_${m}`;
              if (oldRatio < threshold && newRatio >= threshold && !milestonesReachedRef.current.has(milestoneKey)) {
                milestonesReachedRef.current.add(milestoneKey);

                setMilestoneToasts((curr) => [
                  ...curr,
                  {
                    id: `m_${a.id}_${m}_${Date.now()}`,
                    achievementId: a.id,
                    title: a.title,
                    icon: a.icon,
                    percent: m,
                    currentProgress: newProg,
                    maxProgress: a.maxProgress,
                    rewardLabel: a.rewardLabel,
                  },
                ]);
              }
            });

            return { ...a, progress: newProg };
          }
          return a;
        })
      );
    },
    []
  );

  // Claim Achievement Reward
  const handleClaimAchievementReward = (ach: Achievement) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === ach.id ? { ...a, unlocked: true } : a))
    );
    showToast(`🎁 Hadiah Diklaim: ${ach.rewardLabel}`);

    if (ach.rewardType === 'atp' && typeof ach.rewardValue === 'number') {
      setAtpCount((prev) => prev + (ach.rewardValue as number));
    } else if (ach.rewardType === 'title' && typeof ach.rewardValue === 'string') {
      setPlayerTitle(ach.rewardValue);
      localAvatarRef.current?.updateNameAndTitle(playerName, ach.rewardValue);
    } else if (ach.rewardType === 'hat' && typeof ach.rewardValue === 'string') {
      const updated = { ...customization, hat: ach.rewardValue as Customization['hat'] };
      setCustomization(updated);
      localAvatarRef.current?.updateCustomization(updated);
    } else if (ach.rewardType === 'accessory' && typeof ach.rewardValue === 'string') {
      const updated = { ...customization, accessory: ach.rewardValue as Customization['accessory'] };
      setCustomization(updated);
      localAvatarRef.current?.updateCustomization(updated);
    }
  };

  // Synchronized refs to decouple high-frequency state updates from 3D world re-mounting
  const atpCountRef = useRef(atpCount);
  const scoreRef = useRef(score);
  const playerNameRef = useRef(playerName);
  const playerTitleRef = useRef(playerTitle);
  const customizationRef = useRef(customization);
  const recordAchievementProgressRef = useRef(recordAchievementProgress);
  const showToastRef = useRef(showToast);
  const nearbyOrganelleRef = useRef<OrganelleInfo | null>(nearbyOrganelle);
  const isTriviaOpenRef = useRef(isTriviaOpen);
  const currentTriviaRef = useRef<TriviaItem | null>(currentTrivia);

  useEffect(() => {
    atpCountRef.current = atpCount;
  }, [atpCount]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    playerNameRef.current = playerName;
    playerTitleRef.current = playerTitle;
  }, [playerName, playerTitle]);
  useEffect(() => {
    customizationRef.current = customization;
  }, [customization]);
  useEffect(() => {
    nearbyOrganelleRef.current = nearbyOrganelle;
  }, [nearbyOrganelle]);
  useEffect(() => {
    recordAchievementProgressRef.current = recordAchievementProgress;
    showToastRef.current = showToast;
  }, [recordAchievementProgress, showToast]);
  useEffect(() => {
    isTriviaOpenRef.current = isTriviaOpen;
    if (isTriviaOpen) {
      moveVector.current = { x: 0, y: 0 };
      keysPressed.current.clear();
    }
  }, [isTriviaOpen]);
  useEffect(() => {
    currentTriviaRef.current = currentTrivia;
  }, [currentTrivia]);

  // Sync photosynthesis directly into 3D world without re-creating scene
  useEffect(() => {
    worldRef.current?.setPhotosynthesisActive(photosynthesisReady);
  }, [photosynthesisReady]);

  // Sync avatar customization directly into 3D world without re-creating scene
  useEffect(() => {
    localAvatarRef.current?.updateCustomization(customization);
  }, [customization]);

  // Sync player name and title directly into 3D world without re-creating scene
  useEffect(() => {
    localAvatarRef.current?.updateNameAndTitle(playerName, playerTitle);
  }, [playerName, playerTitle]);

  // Sync score and completion to Leaderboard API
  const syncScoreToLeaderboard = useCallback(
    async (
      currentScore: number,
      currentAtp: number,
      completedLevels: number = 1,
      overrideProfile?: StudentProfile
    ) => {
      const prof = overrideProfile || studentProfile;
      if (!prof.name) return;
      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selfId,
            name: prof.name,
            school: prof.school || 'SMP Indonesia',
            score: currentScore,
            atp: currentAtp,
            completedLevels,
            badge: prof.title,
          }),
        });
      } catch (err) {
        console.warn('Leaderboard sync error:', err);
      }
    },
    [selfId, studentProfile]
  );

  // Save student profile handler from login/onboarding modal
  const handleSaveStudentProfile = (profile: StudentProfile) => {
    setStudentProfile(profile);
    setPlayerName(profile.name);
    setPlayerTitle(profile.title);
    playerNameRef.current = profile.name;
    playerTitleRef.current = profile.title;
    try {
      localStorage.setItem('biocraft_student_profile', JSON.stringify(profile));
    } catch {}
    localAvatarRef.current?.updateNameAndTitle(profile.name, profile.title);
    showToast(`🎓 Selamat Datang, ${profile.name} (${profile.school})!`);

    // Broadcast update via WebSocket
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'update',
          name: profile.name,
          title: profile.title,
          grade: profile.grade,
        })
      );
    }

    // Immediately sync to leaderboard
    syncScoreToLeaderboard(score, atpCount, 1, profile);
  };

  // Stabilized keyboard keys tracking set
  const keysPressed = useRef<Set<string>>(new Set());

  // Stabilized Keyboard controls listener (WASD, Arrow keys, Space, Shift, E, H, Q)
  useEffect(() => {
    const updateMoveFromKeys = () => {
      let x = 0;
      let y = 0;
      if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) y -= 1;
      if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) y += 1;
      if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) x -= 1;
      if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) x += 1;

      // Normalize diagonal vectors so diagonal walk isn't faster or jittery
      if (x !== 0 && y !== 0) {
        x *= 0.7071;
        y *= 0.7071;
      }
      moveVector.current.x = x;
      moveVector.current.y = y;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      keysPressed.current.add(e.code);
      updateMoveFromKeys();

      if (e.code === 'Space' && isGrounded.current) {
        playerVelocityY.current = 14;
        isGrounded.current = false;
        sounds.playJump();
      }

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        isSprinting.current = true;
        setIsSprintingState(true);
      }

      if (e.code === 'KeyE') {
        if (nearbyOrganelleRef.current) {
          setActiveOrganelleToScan(nearbyOrganelleRef.current);
          setActiveModal('scanner');
        }
      }

      if (e.code === 'KeyH') {
        setIsDockCollapsed((prev) => !prev);
      }

      if (e.code === 'KeyQ') {
        if (currentTriviaRef.current && !isTriviaOpenRef.current) {
          moveVector.current = { x: 0, y: 0 };
          keysPressed.current.clear();
          setIsTriviaOpen(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      keysPressed.current.delete(e.code);
      updateMoveFromKeys();

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        isSprinting.current = false;
        setIsSprintingState(false);
      }
    };

    const handleWindowBlur = () => {
      keysPressed.current.clear();
      moveVector.current = { x: 0, y: 0 };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Stabilized Memoized Touch Handlers
  const handleMove = useCallback((vec: { x: number; y: number }) => {
    moveVector.current = vec;
  }, []);

  const handleCameraRotate = useCallback((dx: number, dy: number) => {
    cameraAngle.current.theta += dx * 2.5;
    cameraAngle.current.phi = Math.max(0.1, Math.min(1.2, cameraAngle.current.phi - dy * 2.0));
  }, []);

  const handleJump = useCallback(() => {
    if (isGrounded.current) {
      playerVelocityY.current = 14;
      isGrounded.current = false;
      sounds.playJump();
    }
  }, []);

  const handleSprintToggle = useCallback((active: boolean) => {
    isSprinting.current = active;
    setIsSprintingState(active);
  }, []);

  const handleScan = useCallback(() => {
    if (nearbyOrganelleRef.current) {
      setActiveOrganelleToScan(nearbyOrganelleRef.current);
      setActiveModal('scanner');
    }
  }, []);

  // Three.js Scene Setup & Render Loop (Runs ONCE on mount; never destroyed on ATP pickup)
  useEffect(() => {
    if (!mountRef.current) return;

    const world = new CellWorld3D(mountRef.current);
    worldRef.current = world;
    world.setPhotosynthesisActive(photosynthesisReady);

    // Initialize collectibles for mini-map
    setMapCollectibles(
      world.collectibles.map((c) => ({
        id: c.id,
        x: c.position.x,
        z: c.position.z,
        collected: c.collected,
      }))
    );

    // Create Local Avatar
    const localAvatar = new Avatar3D(customizationRef.current, playerNameRef.current, playerTitleRef.current);
    localAvatarRef.current = localAvatar;
    world.scene.add(localAvatar.group);

    // Camera initial position
    cameraAngle.current = { phi: 0.35, theta: 0 };

    let animationFrameId: number;
    let lastNetworkSync = 0;
    let lastMapSync = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      const delta = Math.min(clock.getDelta(), 0.1);

      // 1. Move Player
      const speed = isSprinting.current ? 12 : 7;
      const inputX = moveVector.current.x;
      const inputY = moveVector.current.y;
      const hasInput = Math.abs(inputX) > 0.05 || Math.abs(inputY) > 0.05;

      if (hasInput && !isTriviaOpenRef.current) {
        // Calculate move direction relative to camera theta
        const angle = Math.atan2(inputX, inputY) + cameraAngle.current.theta;
        const dx = Math.sin(angle) * speed * delta;
        const dz = Math.cos(angle) * speed * delta;

        playerPos.current.x += dx;
        playerPos.current.z += dz;
        localAvatar.group.rotation.y = angle;

        // Track exploration distance for random trivia trigger
        const stepDist = Math.sqrt(dx * dx + dz * dz);
        totalDistanceWalkedRef.current += stepDist;

        // Emit footstep bioluminescent trail & fine dust particles under avatar's feet
        if (isGrounded.current) {
          world.footstepTrailSystem.updateAvatarMovement(
            playerPos.current,
            localAvatar.group.rotation.y,
            stepDist,
            isSprinting.current,
            customizationRef.current.trailTheme || 'chloroplast',
            customizationRef.current.trailLevel || 2
          );
        }

        if (totalDistanceWalkedRef.current >= nextTriviaDistanceRef.current) {
          totalDistanceWalkedRef.current = 0;
          nextTriviaDistanceRef.current = 80 + Math.random() * 40;

          // Filter out questions that have already been answered and replace with unasked questions
          const unaskedTrivia = EXPLORATION_TRIVIA_POOL.filter(
            (t) => !answeredTriviaIdsRef.current.has(t.id)
          );
          const poolToUse = unaskedTrivia.length > 0 ? unaskedTrivia : EXPLORATION_TRIVIA_POOL;
          if (unaskedTrivia.length === 0) {
            answeredTriviaIdsRef.current.clear();
          }
          const randomTrivia = poolToUse[Math.floor(Math.random() * poolToUse.length)];
          setCurrentTrivia(randomTrivia);
          currentTriviaRef.current = randomTrivia;
          moveVector.current = { x: 0, y: 0 };
          keysPressed.current.clear();
          setIsTriviaOpen(true);
        }
      }

      // Bound player inside cell wall perimeter
      const distFromCenter = Math.sqrt(playerPos.current.x ** 2 + playerPos.current.z ** 2);
      if (distFromCenter > 42) {
        const rad = Math.atan2(playerPos.current.z, playerPos.current.x);
        playerPos.current.x = Math.cos(rad) * 42;
        playerPos.current.z = Math.sin(rad) * 42;
      }

      // 2. Vertical Physics (Gravity & Bouncy Trampoline on Vacuole)
      playerVelocityY.current -= 28 * delta; // Gravity
      playerPos.current.y += playerVelocityY.current * delta;

      // Check Vacuole trampoline zone (x: 18, z: -8, radius: 5.5)
      const distToVacuole = Math.sqrt((playerPos.current.x - 18) ** 2 + (playerPos.current.z - (-8)) ** 2);
      if (distToVacuole < 5.5 && playerPos.current.y <= 1.2) {
        // High bouncy trampoline jump!
        playerVelocityY.current = 22;
        sounds.playJump();
        showToastRef.current('💧 Melompat Tinggi di Tekanan Turgor Vakuola!');
      }

      if (playerPos.current.y <= 0) {
        playerPos.current.y = 0;
        playerVelocityY.current = 0;
        isGrounded.current = true;
      }

      localAvatar.group.position.copy(playerPos.current);

      // Animate avatar
      localAvatar.animate(delta, hasInput, !isGrounded.current, activeEmoteRef.current);

      // 3. Third-Person Camera follow with smooth damping
      const camDist = 7.5;
      const targetCamX =
        playerPos.current.x - Math.sin(cameraAngle.current.theta) * Math.cos(cameraAngle.current.phi) * camDist;
      const targetCamY = playerPos.current.y + Math.sin(cameraAngle.current.phi) * camDist + 1.8;
      const targetCamZ =
        playerPos.current.z - Math.cos(cameraAngle.current.theta) * Math.cos(cameraAngle.current.phi) * camDist;

      world.camera.position.x = THREE.MathUtils.damp(world.camera.position.x, targetCamX, 8, delta);
      world.camera.position.y = THREE.MathUtils.damp(world.camera.position.y, targetCamY, 8, delta);
      world.camera.position.z = THREE.MathUtils.damp(world.camera.position.z, targetCamZ, 8, delta);
      world.camera.lookAt(playerPos.current.x, playerPos.current.y + 1.4, playerPos.current.z);

      // 4. Update Organelles & Collectibles
      world.update(delta);

      // Check Collectibles Pickup (Ultra-smooth zero-lag ATP collection)
      world.collectibles.forEach((item) => {
        if (!item.collected && playerPos.current.distanceTo(item.position) < 2.0) {
          if (world.collectItem(item.id)) {
            sounds.playCollect();

            // Update state and synced ref without causing 3D re-initialization
            setAtpCount((prev) => {
              const next = prev + 1;
              atpCountRef.current = next;
              return next;
            });
            setScore((prev) => {
              const next = prev + 5;
              scoreRef.current = next;
              return next;
            });
            showToastRef.current('⚡ +1 Molekul Energi ATP Diperoleh! Navigasi & Soal Stabil');

            // Update mini-map collectibles
            setMapCollectibles(
              world.collectibles.map((c) => ({
                id: c.id,
                x: c.position.x,
                z: c.position.z,
                collected: c.collected,
              }))
            );

            // Record Quest & Achievement
            setQuests((prev) =>
              prev.map((q) => (q.id === 'q3' ? { ...q, currentCount: q.currentCount + 1 } : q))
            );
            recordAchievementProgressRef.current('ach_atp_15', 1);
          }
        }
      });

      // Check proximity to interactive organelles (Only trigger re-render on actual change)
      let closest: OrganelleInfo | null = null;
      let minDistance = 6.0;

      for (let i = 0; i < world.interactiveOrganelles.length; i++) {
        const org = world.interactiveOrganelles[i];
        const orgPos = new THREE.Vector3(org.location[0], org.location[1], org.location[2]);
        const dist = playerPos.current.distanceTo(orgPos);
        if (dist < minDistance) {
          closest = org;
          minDistance = dist;
        }
      }

      const closestId = closest ? closest.id : null;
      const currentNearbyId = nearbyOrganelleRef.current ? nearbyOrganelleRef.current.id : null;
      if (closestId !== currentNearbyId) {
        nearbyOrganelleRef.current = closest;
        setNearbyOrganelle(closest);
      }

      const now = performance.now();

      // Update Positional Audio System (Organelle Hums & Cellular Fluid Flow)
      positionalAudio.update(
        playerPos.current,
        hasInput,
        isSprinting.current,
        photosynthesisReady
      );

      // Sync mini-map, compass heading & positional audio HUD status (throttled ~12 times/sec)
      if (now - lastMapSync > 80) {
        lastMapSync = now;
        setMapPlayerPos({ x: playerPos.current.x, y: playerPos.current.y, z: playerPos.current.z });
        setMapPlayerRotY(localAvatar.group.rotation.y);
        setMapCameraTheta(cameraAngle.current.theta);
        setAudioStatus({ ...positionalAudio.currentStatus });
      }

      // 5. Network Sync (throttle to 15 times/sec)
      if (now - lastNetworkSync > 66 && socketRef.current?.readyState === WebSocket.OPEN) {
        lastNetworkSync = now;
        socketRef.current.send(
          JSON.stringify({
            type: 'update',
            x: playerPos.current.x,
            y: playerPos.current.y,
            z: playerPos.current.z,
            rotY: localAvatar.group.rotation.y,
            anim: !isGrounded.current
              ? 'jump'
              : hasInput
              ? 'walk'
              : activeEmoteRef.current || 'idle',
            customization: customizationRef.current,
            name: playerNameRef.current,
            title: playerTitleRef.current,
            score: scoreRef.current,
            collectedAtp: atpCountRef.current,
          })
        );
      }

      // Render Three.js scene
      world.renderer.render(world.scene, world.camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (mountRef.current && worldRef.current) {
        worldRef.current.resize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      world.destroy();
    };
  }, []);

  // WebSocket Multiplayer Connection
  const connectWebSocket = useCallback((roomToJoin: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          id: selfId,
          room: roomToJoin,
          name: playerName,
          title: playerTitle,
          customization,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'init') {
          setRemotePlayers(data.players.filter((p: PlayerData) => p.id !== selfId));
          if (data.sharedAtp !== undefined) setSharedAtp(data.sharedAtp);
          if (data.photosynthesisReady !== undefined) setPhotosynthesisReady(data.photosynthesisReady);
        } else if (data.type === 'player:joined') {
          if (data.player.id !== selfId) {
            setRemotePlayers((prev) => [...prev.filter((p) => p.id !== data.player.id), data.player]);
            showToast(`👋 ${data.player.name} bergabung ke ruang kelas!`);
          }
        } else if (data.type === 'player:left') {
          setRemotePlayers((prev) => prev.filter((p) => p.id !== data.id));
          // Remove remote avatar from 3D scene
          const existing = remoteAvatarsRef.current.get(data.id);
          if (existing && worldRef.current) {
            worldRef.current.scene.remove(existing.group);
            existing.destroy();
            remoteAvatarsRef.current.delete(data.id);
          }
        } else if (data.type === 'player:moved') {
          if (data.id === selfId) return;

          // Update or spawn remote 3D avatar
          let avatar = remoteAvatarsRef.current.get(data.id);
          if (!avatar && worldRef.current) {
            avatar = new Avatar3D(data.customization || DEFAULT_CUSTOMIZATION, data.name || 'Teman', 'Siswa SMP');
            worldRef.current.scene.add(avatar.group);
            remoteAvatarsRef.current.set(data.id, avatar);
          }

          if (avatar) {
            // Smooth lerp
            avatar.group.position.x = THREE.MathUtils.lerp(avatar.group.position.x, data.x, 0.4);
            avatar.group.position.y = THREE.MathUtils.lerp(avatar.group.position.y, data.y, 0.4);
            avatar.group.position.z = THREE.MathUtils.lerp(avatar.group.position.z, data.z, 0.4);
            avatar.group.rotation.y = data.rotY || 0;
            avatar.animate(0.016, data.anim === 'walk', data.anim === 'jump', data.anim === 'cheer' || data.anim === 'dance' ? data.anim : null);
          }
        } else if (data.type === 'chat') {
          setMessages((prev) => [...prev.slice(-25), {
            id: `msg_${Date.now()}_${Math.random()}`,
            senderId: data.id,
            senderName: data.name,
            text: data.text,
            time: data.time || '10:00',
          }]);

          // Show speech bubble over 3D avatar
          if (data.id === selfId) {
            localAvatarRef.current?.showSpeech(data.text);
          } else {
            const remoteAvatar = remoteAvatarsRef.current.get(data.id);
            if (remoteAvatar) {
              remoteAvatar.showSpeech(data.text);
            }
          }
        } else if (data.type === 'coop:update') {
          setSharedAtp(data.sharedAtp);
          setPhotosynthesisReady(data.photosynthesisReady);
          if (data.photosynthesisReady) {
            sounds.playCorrect();
            confetti({ particleCount: 120, spread: 90 });
            showToast('🌱 REAKTOR FOTOSINTESIS AKTIF! Seluruh kelas berhasil!');
          } else if (data.donorName) {
            showToast(`⚡ ${data.donorName} mendonasikan 1 ATP untuk kelas!`);
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };
  }, [selfId, playerName, playerTitle, customization, showToast]);

  useEffect(() => {
    connectWebSocket(currentRoom);
    return () => {
      socketRef.current?.close();
    };
  }, [connectWebSocket, currentRoom]);

  // Sync photosynthesis state to 3D CellWorld
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.setPhotosynthesisActive(photosynthesisReady);
    }
  }, [photosynthesisReady]);

  // Handle Switch Room
  const handleSwitchRoom = (newRoom: string) => {
    // Clear remote avatars
    remoteAvatarsRef.current.forEach((av) => {
      if (worldRef.current) worldRef.current.scene.remove(av.group);
      av.destroy();
    });
    remoteAvatarsRef.current.clear();
    setRemotePlayers([]);
    setCurrentRoom(newRoom);
    connectWebSocket(newRoom);
    showToast(`Pindah ke Ruang: ${newRoom}`);
  };

  // Handle Send Chat
  const handleSendMessage = (text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat',
          text,
          name: playerName,
        })
      );
    }
    localAvatarRef.current?.showSpeech(text);
    recordAchievementProgress('ach_multiplayer_collab', 1);
  };

  // Handle Emote trigger
  const handleEmote = (emote: 'cheer' | 'dance') => {
    activeEmoteRef.current = emote;
    sounds.playJump();
    setTimeout(() => {
      activeEmoteRef.current = null;
    }, 3200);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'emote',
          emote,
        })
      );
    }
  };

  // Donate ATP to classroom
  const handleDonateAtp = () => {
    if (atpCount >= 1) {
      setAtpCount((prev) => prev - 1);
      sounds.playJump();
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'coop:atp',
            amount: 1,
            name: playerName,
          })
        );
      }
    }
  };

  // Teleport to 3D coordinate with Cinematic Warp Portal Transition (Stabilized & Smooth)
  const handleTeleportTo = (pos: [number, number, number], label: string = 'Organel Sel') => {
    setActiveModal(null);
    setIsTriviaOpen(false);
    moveVector.current = { x: 0, y: 0 };
    keysPressed.current.clear();
    pendingTeleportPosRef.current = pos;
    setWarpTargetInfo({
      title: `Warp Portal: ${label}`,
      subtitle: 'Melintasi Jalur Sitosol & Mikrotubulus...',
      color: '#10b981',
    });
    setIsWarpTransitionActive(true);
  };

  const handleWarpMidpoint = () => {
    if (pendingTeleportPosRef.current) {
      playerPos.current.set(
        pendingTeleportPosRef.current[0],
        pendingTeleportPosRef.current[1] + 1.0,
        pendingTeleportPosRef.current[2] + 4.0
      );
      playerVelocityY.current = 0;
      isGrounded.current = true;
      moveVector.current = { x: 0, y: 0 };
      keysPressed.current.clear();

      if (localAvatarRef.current) {
        localAvatarRef.current.group.position.copy(playerPos.current);
      }
      if (worldRef.current) {
        worldRef.current.camera.position.set(
          playerPos.current.x,
          playerPos.current.y + 3.0,
          playerPos.current.z + 7.5
        );
        worldRef.current.camera.lookAt(playerPos.current.x, playerPos.current.y + 1.4, playerPos.current.z);
      }

      showToast('🚀 Teleportasi berhasil!');
      pendingTeleportPosRef.current = null;
    }
  };

  const handleWarpComplete = () => {
    setIsWarpTransitionActive(false);
  };

  // Claim Scan Organelle
  const handleClaimOrganelleReward = (organelleId: string, atpReward: number) => {
    setScannedOrganelles((prev) => new Set([...prev, organelleId]));
    setAtpCount((prev) => prev + atpReward);
    setScore((prev) => prev + 20);
    showToast(`🔍 Data ${organelleId} ditambahkan ke Ensiklopedia! +${atpReward} ATP`);

    // Record Quest & Achievement
    recordAchievementProgress('ach_explore_all', 1);
    if (organelleId === 'dinding_sel' || organelleId === 'membran_sel') {
      setQuests((prev) =>
        prev.map((q) => (q.id === 'q1' ? { ...q, currentCount: q.currentCount + 1 } : q))
      );
    } else if (organelleId === 'kloroplas') {
      setQuests((prev) =>
        prev.map((q) => (q.id === 'q2' ? { ...q, currentCount: q.currentCount + 1 } : q))
      );
    } else if (organelleId === 'nukleus') {
      setQuests((prev) =>
        prev.map((q) => (q.id === 'q4' ? { ...q, currentCount: q.currentCount + 1 } : q))
      );
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.enabled = !nextMuted;
    positionalAudio.setMuted(nextMuted);
    showToast(nextMuted ? '🔇 Audio Dibisukan' : '🔊 Audio & Akustik Organel Diaktifkan');
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
      {/* 1. 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Top HUD Bar (Roblox-style minimal status) */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 pointer-events-none flex items-center justify-between">
        {/* Left: Player Profile Pill (Clickable to open profile & guide) */}
        <div
          onClick={() => {
            sounds.playScan();
            setActiveModal('login_profile');
          }}
          className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-lg cursor-pointer hover:border-emerald-400/60 active:scale-95 transition-all"
          title="Klik untuk melihat Data Siswa, Panduan Bermain & Tujuan Pembelajaran"
        >
          <div
            className="w-9 h-9 rounded-xl border border-white/30 flex items-center justify-center font-black text-white text-sm shadow-inner"
            style={{ backgroundColor: customization.shirtColor }}
          >
            {playerName ? playerName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-tight">{playerName}</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-400/30">
                Level {unlockedLevel}
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-400/30">
                {studentProfile.grade || 'SMP VIII'}
              </span>
            </div>
            <div className="text-[10px] text-emerald-300 font-medium leading-tight truncate max-w-[120px] sm:max-w-[170px]">
              {studentProfile.school || playerTitle}
            </div>
          </div>
        </div>

        {/* Center: Real-time ATP, Leaderboard Top 20, & Shared Class Indicator */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Top 20 Leaderboard Pill */}
          <button
            onClick={() => {
              sounds.playScan();
              setActiveModal('leaderboard');
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-slate-900/90 to-amber-950/40 hover:from-amber-500/30 hover:to-slate-900 border border-amber-400/60 px-3 py-1.5 rounded-2xl shadow-lg text-amber-300 hover:text-white transition-all active:scale-95"
            title="Buka Papan Peringkat Akumulasi Top 20 Siswa"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300 hidden sm:inline">Papan Peringkat</span>
            <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded-full border border-amber-400/30">
              {score} Pts
            </span>
          </button>

          {/* Positional Audio Organelle Resonance Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
              audioStatus.nearestOrganelleName
                ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300 shadow-emerald-500/10'
                : 'bg-slate-900/85 border-white/10 text-slate-400'
            }`}
            title={`Akustik 3D Organel: ${audioStatus.soundDescription || 'Aliran Sitosol'}`}
          >
            <Activity className={`w-3.5 h-3.5 ${audioStatus.nearestOrganelleName ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[11px] font-bold">
              {audioStatus.nearestOrganelleName ? audioStatus.nearestOrganelleName : 'Aliran Sitosol'}
            </span>
            <span className="text-[9px] font-mono font-bold bg-white/10 px-1 py-0.2 rounded">
              {audioStatus.intensityPercent}%
            </span>
          </div>

          {/* Personal ATP */}
          <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-400/40 shadow-lg">
            <span className="text-sm">⚡</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-amber-300 uppercase leading-none">Energi ATP</span>
              <span className="text-xs font-black text-white leading-tight">{atpCount}</span>
            </div>
          </div>

          {/* Room Pill */}
          <button
            onClick={() => setActiveModal('lobby')}
            className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-400/40 shadow-lg text-emerald-300 hover:text-white transition-colors"
          >
            <span className="text-xs">🏫</span>
            <span className="text-xs font-bold">{currentRoom}</span>
            <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono">
              {remotePlayers.length + 1}
            </span>
          </button>

          {/* Quick Footstep Trail Pill */}
          <button
            onClick={() => setActiveModal('trail')}
            className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-2xl border border-teal-400/40 shadow-lg text-teal-300 hover:text-white transition-colors"
            title="Ganti Tema & Level Jejak Bioluminesensi Langkah Kaki"
          >
            <Footprints className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline text-xs font-bold capitalize">{customization.trailTheme || 'klorofil'}</span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
              Lvl {customization.trailLevel || 2}
            </span>
          </button>
        </div>

        {/* Right: Quick Settings & Developer Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => setActiveModal('developer')}
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            title="Profil Pengembang & Pendidik"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guru / Dev</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="w-9 h-9 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-md active:scale-95"
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="w-9 h-9 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-md active:scale-95"
            title="Layar Penuh"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cinematic Warp Transition Overlay for Teleportation / Level Warp */}
      <LevelTransitionOverlay
        isActive={isWarpTransitionActive}
        levelTitle={warpTargetInfo.title}
        levelSubtitle={warpTargetInfo.subtitle}
        accentColor={warpTargetInfo.color || '#10b981'}
        onMidpoint={handleWarpMidpoint}
        onComplete={handleWarpComplete}
      />

      {/* 2b. 360-Degree Heading Compass & Directional Indicator (Penunjuk Arah Sesuai Panah) */}
      <DirectionalIndicator
        playerPos={mapPlayerPos}
        cameraTheta={mapCameraTheta}
        onTeleportTo={(pos) => handleTeleportTo(pos)}
        onOpenOrganelleScan={(org) => {
          setActiveOrganelleToScan(org);
          setActiveModal('scanner');
        }}
      />

      {/* 3. Real-Time Chat Overlay */}
      <ChatOverlay
        messages={messages}
        onSendMessage={handleSendMessage}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      {/* 4. Touch Virtual Joystick & Mobile Buttons */}
      <TouchJoystick
        onMove={handleMove}
        onCameraRotate={handleCameraRotate}
        onJump={handleJump}
        onSprintToggle={handleSprintToggle}
        onScan={handleScan}
        onEmote={handleEmote}
        nearbyOrganelleName={nearbyOrganelle ? nearbyOrganelle.name : null}
        isSprinting={isSprintingState}
      />

      {/* 4b. Status Soal Siap Dijawab Banner (Stabilized Question Prompt) */}
      {currentTrivia && !isTriviaOpen && (
        <button
          onClick={() => {
            moveVector.current = { x: 0, y: 0 };
            keysPressed.current.clear();
            setIsTriviaOpen(true);
          }}
          className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 px-4 py-2 rounded-full font-black text-xs shadow-2xl border-2 border-white/80 animate-pulse active:scale-95 transition-transform"
        >
          <HelpCircle className="w-4 h-4 text-slate-950" />
          <span>💡 Soal Tantangan Siap Dijawab! (Tekan [Q] / Sentuh di Sini)</span>
        </button>
      )}

      {/* 5. Toast Notification Banner */}
      {toastMessage && (
        <div className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-2 border-emerald-400 px-5 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 5b. Dedicated Progressive Milestone Toast Notifications (25%, 50%, 75%, 100%) */}
      <MilestoneToast
        toasts={milestoneToasts}
        onDismiss={(id) => setMilestoneToasts((prev) => prev.filter((t) => t.id !== id))}
        onOpenAchievements={() => setActiveModal('achievements')}
      />

      {/* 6. Collapsible Bottom Control Dock */}
      <ControlDock
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed(!isDockCollapsed)}
        onOpenAvatarCustomizer={() => setActiveModal('customizer')}
        onOpenTrailCustomizer={() => setActiveModal('trail')}
        onOpenMiniGames={() => setActiveModal('mini_games')}
        onOpenCodex={() => setActiveModal('codex')}
        onOpenQuiz={() => setActiveModal('quiz')}
        onOpenAchievements={() => setActiveModal('achievements')}
        onOpenQuests={() => setActiveModal('quests')}
        onOpenMultiplayer={() => setActiveModal('lobby')}
        onOpenDeveloperProfile={() => setActiveModal('developer')}
        onOpenLeaderboard={() => setActiveModal('leaderboard')}
        onOpenLoginProfile={() => setActiveModal('login_profile')}
      />

      {/* 7. Real-Time Interactive Mini-Map (Pojok Kanan Bawah) */}
      <MiniMap
        playerPos={mapPlayerPos}
        playerRotY={mapPlayerRotY}
        remotePlayers={remotePlayers}
        collectibles={mapCollectibles}
        onSelectOrganelle={(org) => {
          setActiveOrganelleToScan(org);
          setActiveModal('scanner');
        }}
        onTeleportTo={handleTeleportTo}
      />

      {/* ================= MODALS ================= */}

      {/* Avatar Customizer */}
      <AvatarCustomizerModal
        isOpen={activeModal === 'customizer'}
        onClose={() => setActiveModal(null)}
        customization={customization}
        onUpdate={(c) => {
          setCustomization(c);
          customizationRef.current = c;
          localAvatarRef.current?.updateCustomization(c);
        }}
        playerName={playerName}
        onNameChange={(name) => {
          setPlayerName(name);
          localAvatarRef.current?.updateNameAndTitle(name, playerTitle);
        }}
        playerTitle={playerTitle}
        onTitleChange={(title) => {
          setPlayerTitle(title);
          localAvatarRef.current?.updateNameAndTitle(playerName, title);
        }}
      />

      {/* Footstep Bioluminescent Trail Modal */}
      <FootstepTrailModal
        isOpen={activeModal === 'trail'}
        onClose={() => setActiveModal(null)}
        currentTheme={customization.trailTheme || 'chloroplast'}
        currentLevel={customization.trailLevel || 2}
        onSelectTheme={(theme) => {
          const next = { ...customization, trailTheme: theme };
          setCustomization(next);
          customizationRef.current = next;
          showToast(`✨ Tema Jejak Diaktifkan: ${theme.toUpperCase()}`);
        }}
        onSelectLevel={(level) => {
          const next = { ...customization, trailLevel: level };
          setCustomization(next);
          customizationRef.current = next;
          showToast(`⚡ Level Pendaran Jejak Diubah ke Tingkat ${level}`);
        }}
        userAtp={atpCount}
      />

      {/* Mini-Games Lab Hub */}
      <MiniGamesModal
        isOpen={activeModal === 'mini_games'}
        onClose={() => setActiveModal(null)}
        onRewardAtp={(amt, reason) => {
          setAtpCount((prev) => {
            const nextAtp = prev + amt;
            atpCountRef.current = nextAtp;
            return nextAtp;
          });
          setScore((prev) => {
            const nextScore = prev + amt * 2;
            scoreRef.current = nextScore;
            syncScoreToLeaderboard(nextScore, atpCount + amt, 1);
            return nextScore;
          });
          showToast(`🎉 +${amt} ATP: ${reason}`);
          if (reason.includes('Bangun Sel')) {
            recordAchievementProgress('ach_build_cell', 1);
          } else if (reason.includes('Glukosa')) {
            recordAchievementProgress('ach_photosynthesis', 1);
            setPhotosynthesisReady(true);
            showToast('🌱 Partikel Kloroplas Menyala setelah Reaksi Fotosintesis!');
          } else if (reason.includes('Stomata')) {
            recordAchievementProgress('ach_stomata_master', 1);
          }
        }}
      />

      {/* Organelle Scanner Modal */}
      <OrganelleScannerModal
        isOpen={activeModal === 'scanner'}
        onClose={() => {
          setActiveModal(null);
          setActiveOrganelleToScan(null);
        }}
        organelle={activeOrganelleToScan}
        isAlreadyScanned={activeOrganelleToScan ? scannedOrganelles.has(activeOrganelleToScan.id) : false}
        onClaimReward={(orgId, reward) => {
          handleClaimOrganelleReward(orgId, reward);
        }}
      />

      {/* Multi-Level Quiz Modal with Sequential Gating */}
      <QuizModal
        isOpen={activeModal === 'quiz'}
        onClose={() => setActiveModal(null)}
        playerName={playerName}
        playerSchool={studentProfile.school}
        unlockedLevel={unlockedLevel}
        onLevelUnlocked={(newLevel) => {
          setUnlockedLevel(newLevel);
          showToast(`🌟 Level ${newLevel} Berhasil Terbuka!`);
        }}
        onOpenLeaderboard={() => setActiveModal('leaderboard')}
        onQuizComplete={(finalScore, levelId, atpReward) => {
          setScore((s) => {
            const nextScore = s + finalScore;
            scoreRef.current = nextScore;
            syncScoreToLeaderboard(nextScore, atpCount + atpReward, levelId);
            return nextScore;
          });
          setAtpCount((a) => {
            const nextAtp = a + atpReward;
            atpCountRef.current = nextAtp;
            return nextAtp;
          });
          showToast(`🏆 Level ${levelId} Selesai! Skor: ${finalScore}% (+${atpReward} ATP)`);

          if (finalScore >= 80) {
            setQuests((prev) =>
              prev.map((q) => (q.id === 'q5' ? { ...q, currentCount: 1, completed: true } : q))
            );
          }
          if (finalScore >= 90) {
            recordAchievementProgress('ach_quiz_perfect', 10);
          }

          // Automatically open Leaderboard so player immediately sees their rank among Top 20!
          setTimeout(() => {
            setActiveModal('leaderboard');
          }, 1200);
        }}
      />

      {/* Codex Modal */}
      <CodexModal
        isOpen={activeModal === 'codex'}
        onClose={() => setActiveModal(null)}
        onTeleportTo={handleTeleportTo}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={activeModal === 'achievements'}
        onClose={() => setActiveModal(null)}
        achievements={achievements}
        onClaimReward={handleClaimAchievementReward}
      />

      {/* Team Quests Modal */}
      <TeamQuestsModal
        isOpen={activeModal === 'quests'}
        onClose={() => setActiveModal(null)}
        quests={quests}
        sharedAtp={sharedAtp}
        maxSharedAtp={25}
        photosynthesisReady={photosynthesisReady}
        onDonateAtp={handleDonateAtp}
        onTogglePhotosynthesisSimulation={() => {
          const next = !photosynthesisReady;
          setPhotosynthesisReady(next);
          if (next) {
            sounds.playCorrect();
            confetti({ particleCount: 100, spread: 80 });
            showToast('🌱 Partikel Fotosintesis Kloroplas DIAKTIFKAN!');
          } else {
            showToast('Partikel Fotosintesis Dinonaktifkan.');
          }
        }}
        onTeleportToChloroplast={() => {
          handleTeleportTo([-22, 1.5, 20]);
        }}
        userAtp={atpCount}
      />

      {/* Multiplayer Lobby Modal */}
      <MultiplayerLobbyModal
        isOpen={activeModal === 'lobby'}
        onClose={() => setActiveModal(null)}
        currentRoom={currentRoom}
        onSwitchRoom={handleSwitchRoom}
        players={remotePlayers}
        selfId={selfId}
      />

      {/* Profil Pengembang & Pendidik Modal */}
      <DeveloperProfileModal
        isOpen={activeModal === 'developer'}
        onClose={() => setActiveModal(null)}
      />

      {/* Random Interactive Exploration Trivia Encounter */}
      {currentTrivia && (
        <TriviaPopupModal
          isOpen={isTriviaOpen}
          onClose={() => {
            setIsTriviaOpen(false);
            moveVector.current = { x: 0, y: 0 };
            keysPressed.current.clear();
          }}
          trivia={currentTrivia}
          onAnswerCorrect={(rewardAtp) => {
            if (currentTrivia) {
              answeredTriviaIdsRef.current.add(currentTrivia.id);
            }
            setAtpCount((prev) => {
              const next = prev + rewardAtp;
              atpCountRef.current = next;
              return next;
            });
            setScore((prev) => {
              const next = prev + rewardAtp * 2;
              scoreRef.current = next;
              return next;
            });
            recordAchievementProgressRef.current('ach_trivia_5', 1);
            showToastRef.current(`💡 +${rewardAtp} ATP Jawaban Benar! Soal baru disiapkan.`);
          }}
        />
      )}

      {/* Papan Peringkat Akumulasi Top 20 Pemain */}
      <LeaderboardModal
        isOpen={activeModal === 'leaderboard'}
        onClose={() => setActiveModal(null)}
        currentPlayerName={playerName}
        currentPlayerSchool={studentProfile.school}
        currentPlayerScore={score}
        currentPlayerAtp={atpCount}
        completedLevelsCount={unlockedLevel}
      />

      {/* Halaman Login Wajib & Panduan Belajar Sederhana */}
      <LoginOnboardingModal
        isOpen={isLoginModalOpen || activeModal === 'login_profile'}
        onClose={() => {
          setIsLoginModalOpen(false);
          if (activeModal === 'login_profile') setActiveModal(null);
        }}
        currentProfile={studentProfile}
        onSaveProfile={handleSaveStudentProfile}
        isFirstTime={!studentProfile.name || !studentProfile.school}
      />
    </div>
  );
}
