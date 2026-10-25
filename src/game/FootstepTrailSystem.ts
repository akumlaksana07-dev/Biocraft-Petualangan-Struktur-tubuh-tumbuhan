import * as THREE from 'three';
import { FootstepTrailTheme, FootstepTrailLevel } from '../types/game';
import { sounds } from '../utils/soundEffects';

export interface TrailThemeMetadata {
  id: FootstepTrailTheme;
  name: string;
  biologyConcept: string;
  organelleOrigin: string;
  palette: number[];
  glowHex: string;
  accentEmoji: string;
  description: string;
  curriculumKey: string;
}

export const TRAIL_THEMES_METADATA: Record<FootstepTrailTheme, TrailThemeMetadata> = {
  chloroplast: {
    id: 'chloroplast',
    name: 'Klorofil Tilakoid',
    biologyConcept: 'Eksitasi Foton Fotosintesis & Fotolisis Air (O2)',
    organelleOrigin: 'Kloroplas',
    palette: [0x10b981, 0x6ee7b7, 0x86efac, 0x34d399, 0xa7f3d0],
    glowHex: '#10b981',
    accentEmoji: '🌱',
    description: 'Pendaran hijau zamrud klorofil dengan mikrobubble oksigen fotolisis air.',
    curriculumKey: 'Reaksi Terang Tilakoid & Fiksasi CO2 Stroma',
  },
  mitochondria: {
    id: 'mitochondria',
    name: 'Matriks ATP Emas',
    biologyConcept: 'Fosforilasi Oksidatif Krista & Sintesis ATP',
    organelleOrigin: 'Mitokondria',
    palette: [0xf59e0b, 0xfbbf24, 0xfef08a, 0xf97316, 0xfde047],
    glowHex: '#f59e0b',
    accentEmoji: '⚡',
    description: 'Percikan bintang emas energi fosforilasi mitokondria penghasil 36 ATP.',
    curriculumKey: 'Respirasi Seluler & Krista Mitokondria',
  },
  vacuole: {
    id: 'vacuole',
    name: 'Turgor Sian Hidro',
    biologyConcept: 'Tekanan Turgor Vakuola & Tonoplas Hidrostatik',
    organelleOrigin: 'Vakuola Sentral',
    palette: [0x06b6d4, 0x38bdf8, 0x67e8f9, 0x0ea5e9, 0xe0f2fe],
    glowHex: '#06b6d4',
    accentEmoji: '💧',
    description: 'Pendaran getah sel biru kristal pembawa tekanan turgor penyokong batang.',
    curriculumKey: 'Tonoplas & Keseimbangan Osmosis Getah Sel',
  },
  nucleus: {
    id: 'nucleus',
    name: 'DNA Kromatin Ungu',
    biologyConcept: 'Pita Heliks Ganda DNA & Fosfodiester Nukleus',
    organelleOrigin: 'Nukleus (Inti Sel)',
    palette: [0x8b5cf6, 0xa855f7, 0xd946ef, 0xc084fc, 0xf472b6],
    glowHex: '#8b5cf6',
    accentEmoji: '🧬',
    description: 'Pendaran ungu neon nukleotida dan pita materi genetik pembelahan sel.',
    curriculumKey: 'Kromosom, Gen, & Pengendali Sintesis Protein',
  },
  chromoplast: {
    id: 'chromoplast',
    name: 'Pelangi Biokromatik',
    biologyConcept: 'Pigmen Karotenoid, Xantofil, & Antosianin',
    organelleOrigin: 'Kromoplas & Plastida',
    palette: [0xf97316, 0xec4899, 0xeab308, 0x22c55e, 0x8b5cf6],
    glowHex: '#ec4899',
    accentEmoji: '🌈',
    description: 'Hamburan debu pigmen warna cerah pemikat polinator pada mahkota bunga.',
    curriculumKey: 'Plastida Non-Fotosintetik & Pigmentasi Tumbuhan',
  },
};

export const TRAIL_LEVELS_METADATA: Record<FootstepTrailLevel, { name: string; tag: string; description: string; atpCost: number }> = {
  1: {
    name: 'Tingkat 1: Debu Sitosol Halus',
    tag: 'Pemula',
    description: 'Partikel debu mikro mengapung lembut di atas permukaan sitosol.',
    atpCost: 0,
  },
  2: {
    name: 'Tingkat 2: Cincin Gelombang Sinar',
    tag: 'Penjelajah',
    description: 'Menghasilkan cincin gelombang kejut bercahaya (shockwave ring) yang meluas di bawah telapak kaki.',
    atpCost: 15,
  },
  3: {
    name: 'Tingkat 3: Aurora & Siklosis Berputar',
    tag: 'Master Sitologi',
    description: 'Hamburan partikel berputar (cyclosis swirl), gelombang ganda, dan pilar aurora vertikal.',
    atpCost: 35,
  },
};

interface TrailParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  size: number;
  initialSize: number;
  life: number;
  maxLife: number;
  swirlRadius: number;
  swirlAngle: number;
  swirlSpeed: number;
  originX: number;
  originZ: number;
}

interface GroundRing {
  mesh: THREE.Mesh;
  active: boolean;
  age: number;
  maxAge: number;
  initialScale: number;
  maxScale: number;
}

export class FootstepTrailSystem {
  private scene: THREE.Scene;
  private isSoftwareGl: boolean;

  // Particle System Pool
  private maxParticles: number;
  private particles: TrailParticle[] = [];
  private particleGeo: THREE.BufferGeometry;
  private particleMat: THREE.PointsMaterial;
  private pointsMesh: THREE.Points;
  private positionsArr: Float32Array;
  private colorsArr: Float32Array;
  private sizesArr: Float32Array;

  // Expanding Ground Rings Pool (Level 2 & 3)
  private maxRings: number = 14;
  private rings: GroundRing[] = [];
  private ringGeo: THREE.RingGeometry;

  // Textures cache for clean disposal
  private textures: THREE.CanvasTexture[] = [];
  private moteTexture: THREE.CanvasTexture;

  // Stride tracking
  private strideDistAccumulator: number = 0;
  private isLeftFoot: boolean = false;
  private lastFootstepSoundTime: number = 0;

  constructor(scene: THREE.Scene, isSoftwareGl: boolean = false) {
    this.scene = scene;
    this.isSoftwareGl = isSoftwareGl;
    this.maxParticles = isSoftwareGl ? 90 : 180;

    // 1. Procedural particle glow texture
    this.moteTexture = this.generateProceduralMoteTexture();
    this.textures.push(this.moteTexture);

    // 2. Initialize Particles Buffer Pool
    this.positionsArr = new Float32Array(this.maxParticles * 3);
    this.colorsArr = new Float32Array(this.maxParticles * 3);
    this.sizesArr = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        r: 1,
        g: 1,
        b: 1,
        size: 0,
        initialSize: 0.6,
        life: 0,
        maxLife: 1.0,
        swirlRadius: 0,
        swirlAngle: 0,
        swirlSpeed: 0,
        originX: 0,
        originZ: 0,
      });

      this.positionsArr[i * 3 + 1] = -100; // start beneath scene
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.positionsArr, 3));
    this.particleGeo.setAttribute('color', new THREE.BufferAttribute(this.colorsArr, 3));
    this.particleGeo.setAttribute('size', new THREE.BufferAttribute(this.sizesArr, 1));

    this.particleMat = new THREE.PointsMaterial({
      size: isSoftwareGl ? 0.65 : 0.85,
      map: this.moteTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.pointsMesh = new THREE.Points(this.particleGeo, this.particleMat);
    this.pointsMesh.frustumCulled = false;
    this.scene.add(this.pointsMesh);

    // 3. Ground Shockwave Rings Pool (Level 2 & 3)
    this.ringGeo = new THREE.RingGeometry(0.2, 0.38, 24);
    this.ringGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < this.maxRings; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(this.ringGeo, ringMat);
      mesh.position.set(0, -100, 0);
      mesh.visible = false;
      this.scene.add(mesh);

      this.rings.push({
        mesh,
        active: false,
        age: 0,
        maxAge: 0.7,
        initialScale: 0.25,
        maxScale: 1.4,
      });
    }
  }

  private generateProceduralMoteTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Soft luminous radial mote with bright incandescent center and feathered edge
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(240, 253, 244, 0.95)');
    grad.addColorStop(0.5, 'rgba(110, 231, 183, 0.6)');
    grad.addColorStop(0.8, 'rgba(16, 185, 129, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Called during movement when the avatar is walking on ground.
   */
  public updateAvatarMovement(
    avatarPos: THREE.Vector3,
    avatarRotY: number,
    distanceMoved: number,
    isSprinting: boolean,
    themeId: FootstepTrailTheme = 'chloroplast',
    level: FootstepTrailLevel = 1
  ) {
    this.strideDistAccumulator += distanceMoved;
    const strideThreshold = isSprinting ? 0.6 : 0.75;

    if (this.strideDistAccumulator >= strideThreshold) {
      this.strideDistAccumulator = 0;
      this.isLeftFoot = !this.isLeftFoot;

      // Calculate foot position in world coordinates based on avatar rotation
      const footSideOffset = this.isLeftFoot ? -0.22 : 0.22;
      const footBackOffset = -0.05;
      const cosA = Math.cos(avatarRotY);
      const sinA = Math.sin(avatarRotY);

      const footX = avatarPos.x + cosA * footSideOffset - sinA * footBackOffset;
      const footZ = avatarPos.z - sinA * footSideOffset - cosA * footBackOffset;
      const footY = Math.max(0.04, avatarPos.y + 0.04);

      this.spawnFootstepTrail(footX, footY, footZ, avatarRotY, isSprinting, themeId, level);

      // Play subtle footstep sound (throttled to max 5 times/sec)
      const now = performance.now();
      if (now - this.lastFootstepSoundTime > 180) {
        this.lastFootstepSoundTime = now;
        sounds.playFootstep(themeId);
      }
    }
  }

  private spawnFootstepTrail(
    x: number,
    y: number,
    z: number,
    rotY: number,
    isSprinting: boolean,
    themeId: FootstepTrailTheme,
    level: FootstepTrailLevel
  ) {
    const meta = TRAIL_THEMES_METADATA[themeId] || TRAIL_THEMES_METADATA.chloroplast;
    const palette = meta.palette;

    // Particle count per step by level
    const particleCount = level === 1 ? (this.isSoftwareGl ? 2 : 3) : level === 2 ? (this.isSoftwareGl ? 4 : 6) : (this.isSoftwareGl ? 6 : 10);

    for (let p = 0; p < particleCount; p++) {
      const particle = this.findAvailableParticle();
      if (!particle) break;

      const colorHex = palette[Math.floor(Math.random() * palette.length)];
      const color = new THREE.Color(colorHex);

      const spreadAngle = rotY + Math.PI + (Math.random() - 0.5) * 1.5;
      const speed = (0.2 + Math.random() * 0.45) * (isSprinting ? 1.4 : 1.0);

      particle.active = true;
      particle.originX = x;
      particle.originZ = z;
      particle.x = x + (Math.random() - 0.5) * 0.15;
      particle.y = y + 0.02 + Math.random() * 0.06;
      particle.z = z + (Math.random() - 0.5) * 0.15;

      particle.vx = Math.sin(spreadAngle) * speed + (Math.random() - 0.5) * 0.1;
      particle.vy = 0.25 + Math.random() * 0.45 + (level === 3 ? 0.2 : 0);
      particle.vz = Math.cos(spreadAngle) * speed + (Math.random() - 0.5) * 0.1;

      particle.r = color.r;
      particle.g = color.g;
      particle.b = color.b;

      particle.initialSize = (0.45 + Math.random() * 0.4) * (level === 3 ? 1.3 : 1.0);
      particle.size = particle.initialSize;
      particle.life = 0;
      particle.maxLife = 0.65 + Math.random() * 0.55 + (level === 3 ? 0.4 : 0);

      // Swirl vortex properties for Level 3
      particle.swirlRadius = 0.15 + Math.random() * 0.4;
      particle.swirlAngle = Math.random() * Math.PI * 2;
      particle.swirlSpeed = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 3.5);
    }

    // Spawn expanding ground shockwave ring for Level 2 and Level 3
    if (level >= 2) {
      this.spawnGroundRing(x, y, z, meta.palette[0], level);
      if (level === 3) {
        // Additional delayed secondary ring for resonant ripple
        setTimeout(() => {
          this.spawnGroundRing(x, y, z, meta.palette[1], level);
        }, 110);
      }
    }
  }

  private spawnGroundRing(x: number, y: number, z: number, colorHex: number, level: FootstepTrailLevel) {
    const ring = this.rings.find((r) => !r.active);
    if (!ring) return;

    ring.active = true;
    ring.age = 0;
    ring.maxAge = level === 3 ? 0.9 : 0.65;
    ring.initialScale = 0.2;
    ring.maxScale = level === 3 ? 1.6 : 1.15;

    ring.mesh.position.set(x, Math.max(0.02, y), z);
    ring.mesh.scale.set(ring.initialScale, ring.initialScale, ring.initialScale);
    ring.mesh.visible = true;

    const mat = ring.mesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(colorHex);
    mat.opacity = level === 3 ? 0.9 : 0.7;
  }

  private findAvailableParticle(): TrailParticle | null {
    // Find inactive particle or recycle oldest
    let oldest: TrailParticle | null = null;
    let maxLifeRatio = -1;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) return p;
      const ratio = p.life / p.maxLife;
      if (ratio > maxLifeRatio) {
        maxLifeRatio = ratio;
        oldest = p;
      }
    }
    return oldest;
  }

  public update(delta: number) {
    const clampedDelta = Math.min(delta, 0.1);

    // 1. Update Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const idx = i * 3;

      if (!p.active) {
        this.positionsArr[idx + 1] = -100;
        this.sizesArr[i] = 0;
        continue;
      }

      p.life += clampedDelta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.positionsArr[idx + 1] = -100;
        this.sizesArr[i] = 0;
        continue;
      }

      const lifeRatio = p.life / p.maxLife;
      const fade = 1.0 - lifeRatio;

      // Physics: drag + buoyancy
      p.vx *= 0.94;
      p.vy *= 0.96;
      p.vz *= 0.94;

      // Swirl rotation around footprint origin if present
      if (p.swirlSpeed !== 0) {
        p.swirlAngle += p.swirlSpeed * clampedDelta;
        p.swirlRadius += clampedDelta * 0.25;
        p.x = p.originX + Math.cos(p.swirlAngle) * p.swirlRadius + p.vx * clampedDelta;
        p.z = p.originZ + Math.sin(p.swirlAngle) * p.swirlRadius + p.vz * clampedDelta;
      } else {
        p.x += p.vx * clampedDelta;
        p.z += p.vz * clampedDelta;
      }

      p.y += p.vy * clampedDelta;

      // Write to typed arrays
      this.positionsArr[idx] = p.x;
      this.positionsArr[idx + 1] = p.y;
      this.positionsArr[idx + 2] = p.z;

      this.colorsArr[idx] = p.r * fade;
      this.colorsArr[idx + 1] = p.g * fade;
      this.colorsArr[idx + 2] = p.b * fade;

      this.sizesArr[i] = p.initialSize * fade;
    }

    this.particleGeo.attributes.position.needsUpdate = true;
    this.particleGeo.attributes.color.needsUpdate = true;
    this.particleGeo.attributes.size.needsUpdate = true;

    // 2. Update Ground Rings
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      if (!r.active) continue;

      r.age += clampedDelta;
      if (r.age >= r.maxAge) {
        r.active = false;
        r.mesh.visible = false;
        continue;
      }

      const progress = r.age / r.maxAge;
      // Exponential expanding ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentScale = r.initialScale + (r.maxScale - r.initialScale) * ease;
      r.mesh.scale.set(currentScale, currentScale, currentScale);

      const mat = r.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.75;
    }
  }

  public destroy() {
    this.textures.forEach((t) => t.dispose());
    this.particleGeo.dispose();
    this.particleMat.dispose();
    this.ringGeo.dispose();

    this.rings.forEach((r) => {
      this.scene.remove(r.mesh);
      (r.mesh.material as THREE.Material).dispose();
    });
    this.scene.remove(this.pointsMesh);
  }
}
