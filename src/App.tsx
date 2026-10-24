/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CellWorld3D } from './game/CellWorld3D';
import { Avatar3D } from './game/Avatar3D';
import { Customization, PlayerData, ChatMessage, Quest, OrganelleInfo } from './types/game';
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
import { sounds } from './utils/soundEffects';
import { Volume2, VolumeX, Maximize2, Sparkles, HelpCircle, Zap, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const DEFAULT_CUSTOMIZATION: Customization = {
  skinColor: '#fed8b1',
  shirtColor: '#2563eb',
  pantsColor: '#1e293b',
  face: 'goggles',
  hat: 'goggles',
  accessory: 'backpack',
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<CellWorld3D | null>(null);
  const localAvatarRef = useRef<Avatar3D | null>(null);
  const remoteAvatarsRef = useRef<Map<string, Avatar3D>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);

  // Player state
  const [selfId, setSelfId] = useState<string>(() => `p_${Math.random().toString(36).substring(2, 7)}`);
  const [playerName, setPlayerName] = useState<string>('Siswa IPA VIII');
  const [playerTitle, setPlayerTitle] = useState<string>('Penjelajah Sel Muda');
  const [customization, setCustomization] = useState<Customization>(DEFAULT_CUSTOMIZATION);
  const [currentRoom, setCurrentRoom] = useState<string>('KELAS-8A');
  const [atpCount, setAtpCount] = useState<number>(15);
  const [score, setScore] = useState<number>(0);
  const [remotePlayers, setRemotePlayers] = useState<PlayerData[]>([]);

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
    'customizer' | 'mini_games' | 'scanner' | 'quiz' | 'codex' | 'achievements' | 'quests' | 'lobby' | 'developer' | null
  >(null);
  const [activeOrganelleToScan, setActiveOrganelleToScan] = useState<OrganelleInfo | null>(null);
  const [nearbyOrganelle, setNearbyOrganelle] = useState<OrganelleInfo | null>(null);

  // Interactive Exploration Trivia
  const [currentTrivia, setCurrentTrivia] = useState<TriviaItem | null>(null);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
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

  // Show Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Update Achievement Progress Helper
  const recordAchievementProgress = useCallback(
    (achId: string, delta: number = 1) => {
      setAchievements((prev) =>
        prev.map((a) => {
          if (a.id === achId) {
            const newProg = Math.min(a.maxProgress, a.progress + delta);
            const nowUnlocked = newProg >= a.maxProgress && !a.unlocked;
            if (nowUnlocked) {
              sounds.playCorrect();
              showToast(`🏆 Pencapaian Terbuka: ${a.title}!`);
            }
            return { ...a, progress: newProg };
          }
          return a;
        })
      );
    },
    [showToast]
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

  // Keyboard controls listener (WASD, Space, Shift, E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') moveVector.current.y = -1;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') moveVector.current.y = 1;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveVector.current.x = -1;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') moveVector.current.x = 1;

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
        if (nearbyOrganelle) {
          setActiveOrganelleToScan(nearbyOrganelle);
          setActiveModal('scanner');
        }
      }

      if (e.code === 'KeyH') {
        setIsDockCollapsed((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(e.code)) moveVector.current.y = 0;
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) moveVector.current.x = 0;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
        isSprinting.current = false;
        setIsSprintingState(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyOrganelle]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    if (!mountRef.current) return;

    const world = new CellWorld3D(mountRef.current);
    worldRef.current = world;

    // Create Local Avatar
    const localAvatar = new Avatar3D(customization, playerName, playerTitle);
    localAvatarRef.current = localAvatar;
    world.scene.add(localAvatar.group);

    // Camera initial position
    cameraAngle.current = { phi: 0.35, theta: 0 };

    let animationFrameId: number;
    let lastNetworkSync = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      const delta = Math.min(clock.getDelta(), 0.1);

      // 1. Move Player
      const speed = isSprinting.current ? 12 : 7;
      const inputX = moveVector.current.x;
      const inputY = moveVector.current.y;
      const hasInput = Math.abs(inputX) > 0.05 || Math.abs(inputY) > 0.05;

      if (hasInput) {
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
        if (totalDistanceWalkedRef.current >= nextTriviaDistanceRef.current) {
          totalDistanceWalkedRef.current = 0;
          nextTriviaDistanceRef.current = 80 + Math.random() * 40;
          const randomTrivia = EXPLORATION_TRIVIA_POOL[Math.floor(Math.random() * EXPLORATION_TRIVIA_POOL.length)];
          setCurrentTrivia(randomTrivia);
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
        showToast('💧 Melompat Tinggi di Tekanan Turgor Vakuola!');
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

      // Check Collectibles Pickup
      world.collectibles.forEach((item) => {
        if (!item.collected && playerPos.current.distanceTo(item.position) < 2.0) {
          if (world.collectItem(item.id)) {
            sounds.playCollect();
            setAtpCount((prev) => prev + 1);
            setScore((prev) => prev + 5);
            showToast('⚡ +1 Molekul Energi ATP Diperoleh!');

            // Record Quest & Achievement
            setQuests((prev) =>
              prev.map((q) => (q.id === 'q3' ? { ...q, currentCount: q.currentCount + 1 } : q))
            );
            recordAchievementProgress('ach_atp_15', 1);
          }
        }
      });

      // Check proximity to interactive organelles
      let closest: OrganelleInfo | null = null;
      let minDistance = 6.0;

      world.interactiveOrganelles.forEach((org) => {
        const orgPos = new THREE.Vector3(org.location[0], org.location[1], org.location[2]);
        const dist = playerPos.current.distanceTo(orgPos);
        if (dist < minDistance) {
          closest = org;
          minDistance = dist;
        }
      });
      setNearbyOrganelle(closest);

      // 5. Network Sync (throttle to 15 times/sec)
      const now = performance.now();
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
            customization,
            name: playerName,
            title: playerTitle,
            score,
            collectedAtp: atpCount,
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
  }, [customization, playerName, playerTitle, score, atpCount, recordAchievementProgress, showToast]);

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

  // Teleport to 3D coordinate (from Codex)
  const handleTeleportTo = (pos: [number, number, number]) => {
    playerPos.current.set(pos[0], pos[1] + 1.0, pos[2] + 4.0);
    showToast('🚀 Teleportasi berhasil!');
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
        {/* Left: Player Profile Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-lg">
          <div
            className="w-9 h-9 rounded-xl border border-white/30 flex items-center justify-center font-black text-white text-sm shadow-inner"
            style={{ backgroundColor: customization.shirtColor }}
          >
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-tight">{playerName}</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-400/30">
                SMP VIII
              </span>
            </div>
            <div className="text-[10px] text-emerald-300 font-medium leading-tight">{playerTitle}</div>
          </div>
        </div>

        {/* Center: Real-time ATP & Shared Class Indicator */}
        <div className="pointer-events-auto flex items-center gap-2">
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

      {/* 3. Real-Time Chat Overlay */}
      <ChatOverlay
        messages={messages}
        onSendMessage={handleSendMessage}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      {/* 4. Touch Virtual Joystick & Mobile Buttons */}
      <TouchJoystick
        onMove={(vec) => {
          moveVector.current = vec;
        }}
        onCameraRotate={(dx, dy) => {
          cameraAngle.current.theta += dx * 2.5;
          cameraAngle.current.phi = Math.max(0.1, Math.min(1.2, cameraAngle.current.phi - dy * 2.0));
        }}
        onJump={() => {
          if (isGrounded.current) {
            playerVelocityY.current = 14;
            isGrounded.current = false;
            sounds.playJump();
          }
        }}
        onSprintToggle={(active) => {
          isSprinting.current = active;
          setIsSprintingState(active);
        }}
        onScan={() => {
          if (nearbyOrganelle) {
            setActiveOrganelleToScan(nearbyOrganelle);
            setActiveModal('scanner');
          }
        }}
        onEmote={handleEmote}
        nearbyOrganelleName={nearbyOrganelle ? nearbyOrganelle.name : null}
        isSprinting={isSprintingState}
      />

      {/* 5. Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-2 border-emerald-400 px-5 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 6. Collapsible Bottom Control Dock */}
      <ControlDock
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed(!isDockCollapsed)}
        onOpenAvatarCustomizer={() => setActiveModal('customizer')}
        onOpenMiniGames={() => setActiveModal('mini_games')}
        onOpenCodex={() => setActiveModal('codex')}
        onOpenQuiz={() => setActiveModal('quiz')}
        onOpenAchievements={() => setActiveModal('achievements')}
        onOpenQuests={() => setActiveModal('quests')}
        onOpenMultiplayer={() => setActiveModal('lobby')}
        onOpenDeveloperProfile={() => setActiveModal('developer')}
      />

      {/* ================= MODALS ================= */}

      {/* Avatar Customizer */}
      <AvatarCustomizerModal
        isOpen={activeModal === 'customizer'}
        onClose={() => setActiveModal(null)}
        customization={customization}
        onUpdate={(c) => {
          setCustomization(c);
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

      {/* Mini-Games Lab Hub */}
      <MiniGamesModal
        isOpen={activeModal === 'mini_games'}
        onClose={() => setActiveModal(null)}
        onRewardAtp={(amt, reason) => {
          setAtpCount((prev) => prev + amt);
          setScore((prev) => prev + amt * 2);
          showToast(`🎉 +${amt} ATP: ${reason}`);
          if (reason.includes('Bangun Sel')) {
            recordAchievementProgress('ach_build_cell', 1);
          } else if (reason.includes('Glukosa')) {
            recordAchievementProgress('ach_photosynthesis', 1);
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

      {/* Multi-Level Quiz Modal */}
      <QuizModal
        isOpen={activeModal === 'quiz'}
        onClose={() => setActiveModal(null)}
        playerName={playerName}
        onQuizComplete={(finalScore, levelId, atpReward) => {
          setScore((s) => s + finalScore);
          setAtpCount((a) => a + atpReward);
          showToast(`🏆 Level ${levelId} Selesai! Skor: ${finalScore}% (+${atpReward} ATP)`);

          if (finalScore >= 80) {
            setQuests((prev) =>
              prev.map((q) => (q.id === 'q5' ? { ...q, currentCount: 1, completed: true } : q))
            );
          }
          if (finalScore >= 90) {
            recordAchievementProgress('ach_quiz_perfect', 10);
          }
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
          onClose={() => setIsTriviaOpen(false)}
          trivia={currentTrivia}
          onAnswerCorrect={(rewardAtp) => {
            setAtpCount((prev) => prev + rewardAtp);
            setScore((prev) => prev + rewardAtp * 2);
            recordAchievementProgress('ach_trivia_5', 1);
            showToast(`💡 +${rewardAtp} ATP Jawaban Trivia Benar!`);
          }}
        />
      )}
    </div>
  );
}
