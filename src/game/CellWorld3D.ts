import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ORGANELLES } from '../data/biologyData';
import { OrganelleInfo } from '../types/game';
import { FootstepTrailSystem } from './FootstepTrailSystem';

export interface CollectibleItem {
  id: string;
  type: 'atp' | 'photon';
  mesh: THREE.Group;
  position: THREE.Vector3;
  collected: boolean;
  baseY: number;
}

export class CellWorld3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public isSoftwareGl: boolean = false;

  public organellesGroup: THREE.Group;
  public collectibles: CollectibleItem[] = [];
  public organelleMarkers: Map<string, THREE.Group> = new Map();
  public interactiveOrganelles: OrganelleInfo[] = ORGANELLES;
  public footstepTrailSystem: FootstepTrailSystem;

  private clock: THREE.Clock;
  private animTime: number = 0;
  private dnaGroup: THREE.Group | null = null;
  private thylakoidDiscs: THREE.Mesh[] = [];
  private golgiVesicles: THREE.Mesh[] = [];
  private stomataPores: THREE.Group | null = null;
  private atpTurbines: THREE.Mesh[] = [];

  // Photosynthesis Particle System around Chloroplast
  public isPhotosynthesisActive: boolean = false;
  private chlorGroup: THREE.Group | null = null;
  private photosynthesisParticleGroup: THREE.Group | null = null;
  private photonParticles: THREE.Points | null = null;
  private photonGeo: THREE.BufferGeometry | null = null;
  private photonPositions: Float32Array | null = null;
  private photonAngles: Float32Array | null = null;
  private photonSpeeds: Float32Array | null = null;
  private photonRadii: Float32Array | null = null;
  private photonHeights: Float32Array | null = null;

  private oxygenParticles: THREE.Points | null = null;
  private oxygenGeo: THREE.BufferGeometry | null = null;
  private oxygenPositions: Float32Array | null = null;
  private oxygenSpeeds: Float32Array | null = null;
  private oxygenWobbles: Float32Array | null = null;

  private glucoseParticles: THREE.Points | null = null;
  private glucoseGeo: THREE.BufferGeometry | null = null;
  private glucosePositions: Float32Array | null = null;
  private glucoseVelocities: Float32Array | null = null;
  private glucoseLifetimes: Float32Array | null = null;

  private sunBeamMesh: THREE.Mesh | null = null;
  private chloroplastAuraRing: THREE.Mesh | null = null;
  private chloroplastLight: THREE.PointLight | null = null;
  private particleTextures: THREE.CanvasTexture[] = [];

  // Cytosol Floating Dust & Bioluminescent Glow Atmosphere
  private cytosolDustParticles: THREE.Points | null = null;
  private cytosolDustGeo: THREE.BufferGeometry | null = null;
  private cytosolDustPositions: Float32Array | null = null;
  private cytosolDustRotAngles: Float32Array | null = null;
  private cytosolDustRadii: Float32Array | null = null;
  private cytosolDustDriftSpeed: Float32Array | null = null;
  private cytosolDustPhases: Float32Array | null = null;
  private cytosolDustTexture: THREE.CanvasTexture | null = null;

  constructor(container: HTMLDivElement) {
    // 1. Detect software WebGL as instructed by skill
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup scene & fog
    this.scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x02160e); // Deep plant cytosol emerald dark
    this.scene.background = bgColor;
    this.scene.fog = new THREE.FogExp2(0x02160e, 0.015);

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 300);
    this.camera.position.set(0, 8, 14);

    // 4. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 5. Studio Environment map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Lighting rig: Warm directional key light, cool hemisphere light, rim light
    const keyLight = new THREE.DirectionalLight(0xfef08a, 1.8);
    keyLight.position.set(25, 45, 20);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 120;
      keyLight.shadow.camera.left = -45;
      keyLight.shadow.camera.right = 45;
      keyLight.shadow.camera.top = 45;
      keyLight.shadow.camera.bottom = -45;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x86efac, 0x064e3b, 1.0);
    this.scene.add(hemiLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);

    this.clock = new THREE.Clock();
    this.organellesGroup = new THREE.Group();
    this.scene.add(this.organellesGroup);

    // Build the microscopic world
    this.buildCytoplasmFloor();
    this.buildCellWallAndMembrane();
    this.buildOrganelles();
    this.buildMicrotubuleBridges();
    this.spawnCollectibles();
    this.footstepTrailSystem = new FootstepTrailSystem(this.scene, this.isSoftwareGl);
  }

  private buildCytoplasmFloor() {
    // Floor representing the cytoplasm / cytosol base
    const floorGeo = new THREE.CylinderGeometry(46, 48, 2, 32);
    floorGeo.translate(0, -1, 0);

    // Procedural organic cellular texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 512);

    // Cellular cytosol hexagonal web
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 4;
    for (let x = 0; x < 512; x += 64) {
      for (let y = 0; y < 512; y += 64) {
        ctx.strokeRect(x + 4, y + 4, 56, 56);
      }
    }
    // Bioluminescent dots
    ctx.fillStyle = '#34d399';
    for (let i = 0; i < 70; i++) {
      const rx = (i * 97) % 512;
      const ry = (i * 131) % 512;
      ctx.beginPath();
      ctx.arc(rx, ry, (i % 4) + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const floorTex = new THREE.CanvasTexture(canvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(10, 10);
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Build the dynamic glowing cytosol dust mote atmosphere
    this.buildCytosolAtmosphere();
  }

  private buildCytosolAtmosphere() {
    // 1. Procedural Glowing Mote Texture (Luminous Bioluminescent Cytosol Dust)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Concentric radial gradient for soft luminous mote with incandescent core
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(217, 249, 157, 0.95)'); // Bright warm lime core
    grad.addColorStop(0.45, 'rgba(110, 231, 183, 0.65)'); // Emerald bioluminescence
    grad.addColorStop(0.75, 'rgba(56, 189, 248, 0.25)'); // Oceanic cytosol cyan halo
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Gentle transparent dissipation
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    this.cytosolDustTexture = new THREE.CanvasTexture(canvas);
    this.cytosolDustTexture.colorSpace = THREE.SRGBColorSpace;
    this.particleTextures.push(this.cytosolDustTexture);

    // 2. Geometry & Attributes (480 particles for rich presence, 240 for software GL)
    const dustCount = this.isSoftwareGl ? 240 : 480;
    this.cytosolDustGeo = new THREE.BufferGeometry();
    this.cytosolDustPositions = new Float32Array(dustCount * 3);
    this.cytosolDustRotAngles = new Float32Array(dustCount);
    this.cytosolDustRadii = new Float32Array(dustCount);
    this.cytosolDustDriftSpeed = new Float32Array(dustCount);
    this.cytosolDustPhases = new Float32Array(dustCount);

    const colors = new Float32Array(dustCount * 3);
    const colorPalette = [
      new THREE.Color(0x6ee7b7), // Emerald Mint Bioluminescence
      new THREE.Color(0x38bdf8), // Cytosol Cyan Glow
      new THREE.Color(0xfef08a), // Golden Glucose Dust Mote
      new THREE.Color(0xa7f3d0), // Soft Thylakoid Green
      new THREE.Color(0x67e8f9), // Bright Electric Cytoplasmic Ion
    ];

    for (let i = 0; i < dustCount; i++) {
      // Distribute particles across the 3D plant cell interior
      const radius = 3.0 + Math.sqrt(Math.random()) * 38.0;
      const angle = Math.random() * Math.PI * 2;
      const height = 0.6 + Math.random() * 13.5;

      this.cytosolDustRadii[i] = radius;
      this.cytosolDustRotAngles[i] = angle;
      this.cytosolDustPositions[i * 3] = Math.cos(angle) * radius;
      this.cytosolDustPositions[i * 3 + 1] = height;
      this.cytosolDustPositions[i * 3 + 2] = Math.sin(angle) * radius;

      // Cytoplasmic streaming (cyclosis): slow circulation around cell interior
      const baseDirection = Math.random() > 0.2 ? 1 : -1;
      this.cytosolDustDriftSpeed[i] = baseDirection * (0.04 + Math.random() * 0.09);
      this.cytosolDustPhases[i] = Math.random() * Math.PI * 2;

      // Assign organic palette colors
      const pickedColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = pickedColor.r;
      colors[i * 3 + 1] = pickedColor.g;
      colors[i * 3 + 2] = pickedColor.b;
    }

    this.cytosolDustGeo.setAttribute('position', new THREE.BufferAttribute(this.cytosolDustPositions, 3));
    this.cytosolDustGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 3. Points Material with additive blending for ethereal glow
    const dustMat = new THREE.PointsMaterial({
      size: this.isSoftwareGl ? 0.7 : 0.95,
      map: this.cytosolDustTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.cytosolDustParticles = new THREE.Points(this.cytosolDustGeo, dustMat);
    this.scene.add(this.cytosolDustParticles);
  }

  private buildCellWallAndMembrane() {
    // Giant hexagonal/polyhedral wall representing the plant's rigid CELL WALL & MEMBRANE
    const wallRadius = 45;
    const wallHeight = 12;
    const wallSegments = 24;

    const wallGroup = new THREE.Group();

    // 1. Dinding Sel (Outer thick cellulose frame)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.8,
      metalness: 0.1,
    });

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.6,
      transparent: true,
      opacity: 0.85,
    });

    // Outer wall ring pillars
    for (let i = 0; i < wallSegments; i++) {
      const angle = (i / wallSegments) * Math.PI * 2;
      const x = Math.cos(angle) * wallRadius;
      const z = Math.sin(angle) * wallRadius;

      // Wall pillar
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(4.2, wallHeight, 2.5), wallMat);
      pillar.position.set(x, wallHeight / 2, z);
      pillar.rotation.y = -angle;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      wallGroup.add(pillar);

      // Top lintel beam connecting pillars
      const beam = new THREE.Mesh(new THREE.BoxGeometry(12, 1.8, 2.2), innerMat);
      beam.position.set(x, wallHeight + 0.5, z);
      beam.rotation.y = -angle + Math.PI / 2;
      beam.castShadow = true;
      wallGroup.add(beam);

      // Plasmodesmata pores (tunnels in the wall) at every 4th segment
      if (i % 4 === 0) {
        const tunnelRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.6, 0.3, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0x86efac, emissive: 0x15803d, emissiveIntensity: 0.5 })
        );
        tunnelRing.position.set(x * 0.96, 3, z * 0.96);
        tunnelRing.rotation.y = -angle;
        wallGroup.add(tunnelRing);
      }
    }

    // 2. Membran Sel (Inner delicate membrane layer)
    const memGeo = new THREE.CylinderGeometry(wallRadius - 3, wallRadius - 3, wallHeight - 1, 32, 1, true);
    const memMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      roughness: 0.2,
      depthWrite: false,
    });
    const membraneMesh = new THREE.Mesh(memGeo, memMat);
    membraneMesh.position.y = (wallHeight - 1) / 2;
    wallGroup.add(membraneMesh);

    this.scene.add(wallGroup);
  }

  private buildOrganelles() {
    // 1. KLOROPLAS (Chloroplast) - Emerald stadium capsule with thylakoid coin stacks
    const chlorGroup = new THREE.Group();
    chlorGroup.position.set(-22, 0, 12);
    this.chlorGroup = chlorGroup;

    // Translucent emerald shell
    const outerShellGeo = new THREE.SphereGeometry(6, 24, 16);
    outerShellGeo.scale(1.4, 0.7, 0.9);
    const outerShellMat = new THREE.MeshPhysicalMaterial({
      color: 0x15803d,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const chlorShell = new THREE.Mesh(outerShellGeo, outerShellMat);
    chlorShell.position.y = 4;
    chlorGroup.add(chlorShell);

    // Stacks of Thylakoids (Grana) inside
    const thylakoidMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.4,
      emissive: 0x14532d,
      emissiveIntensity: 0.3,
    });

    const stackPositions = [
      [-3.5, 0],
      [-1.2, 2.0],
      [1.5, -1.8],
      [3.8, 1.2],
      [0, 0],
    ];

    stackPositions.forEach(([sx, sz]) => {
      for (let h = 0; h < 6; h++) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.35, 16), thylakoidMat);
        disc.position.set(sx, 1.2 + h * 0.65, sz);
        disc.castShadow = true;
        disc.receiveShadow = true;
        chlorGroup.add(disc);
        this.thylakoidDiscs.push(disc);
      }
    });

    // Build the dynamic photosynthesis particle system inside Chloroplast
    this.buildChloroplastParticleSystem();

    this.organellesGroup.add(chlorGroup);

    // 2. VAKUOLA SENTRAL (Central Vacuole) - Giant bouncy water sphere
    const vacGroup = new THREE.Group();
    vacGroup.position.set(18, 0, -8);

    const vacGeo = new THREE.SphereGeometry(8.5, 28, 20);
    vacGeo.scale(1.1, 0.9, 1.1);
    const vacMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const vacMesh = new THREE.Mesh(vacGeo, vacMat);
    vacMesh.position.y = 7;
    vacMesh.castShadow = true;
    vacGroup.add(vacMesh);

    // Inner bouncy core / trampoline pad
    const padGeo = new THREE.CylinderGeometry(5.5, 5.5, 0.4, 24);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
    });
    const trampPad = new THREE.Mesh(padGeo, padMat);
    trampPad.position.y = 1.0;
    trampPad.receiveShadow = true;
    vacGroup.add(trampPad);

    this.organellesGroup.add(vacGroup);

    // 3. NUKLEUS & NUKLEOLUS (Nucleus) - Majestic spherical command center with DNA
    const nucGroup = new THREE.Group();
    nucGroup.position.set(0, 0, -18);

    // Nuclear membrane with pores
    const nucGeo = new THREE.SphereGeometry(7, 24, 20);
    const nucMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.5,
      metalness: 0.2,
      transparent: true,
      opacity: 0.7,
    });
    const nucMesh = new THREE.Mesh(nucGeo, nucMat);
    nucMesh.position.y = 6.5;
    nucMesh.castShadow = true;
    nucGroup.add(nucMesh);

    // Nucleolus (dense inner core)
    const nucleolusGeo = new THREE.SphereGeometry(2.8, 16, 16);
    const nucleolusMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x6b21a8,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });
    const nucleolusMesh = new THREE.Mesh(nucleolusGeo, nucleolusMat);
    nucleolusMesh.position.y = 6.5;
    nucGroup.add(nucleolusMesh);

    // Glowing DNA Double Helix spiral floating near the entrance
    this.dnaGroup = new THREE.Group();
    this.dnaGroup.position.set(0, 4.5, 7.5);
    const sphereMatA = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
    const sphereMatB = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c });
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });

    for (let i = 0; i < 28; i++) {
      const angle = i * 0.45;
      const dy = i * 0.22;
      const r = 0.9;
      const x1 = Math.cos(angle) * r;
      const z1 = Math.sin(angle) * r;
      const x2 = -x1;
      const z2 = -z1;

      const beadA = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), sphereMatA);
      beadA.position.set(x1, dy, z1);

      const beadB = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), sphereMatB);
      beadB.position.set(x2, dy, z2);

      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, r * 2, 6), bridgeMat);
      bar.position.set(0, dy, 0);
      bar.rotation.z = Math.PI / 2;
      bar.rotation.y = -angle;

      this.dnaGroup.add(beadA, beadB, bar);
    }
    nucGroup.add(this.dnaGroup);

    this.organellesGroup.add(nucGroup);

    // 4. MITOKONDRIA (Mitochondria) - Sausage with folding cristae & spinning ATP turbine
    const mitoGroup = new THREE.Group();
    mitoGroup.position.set(-16, 0, -12);

    const mitoOuterGeo = new THREE.CapsuleGeometry(2.8, 6.5, 12, 20);
    mitoOuterGeo.rotateZ(Math.PI / 2.3);
    const mitoOuterMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
    });
    const mitoMesh = new THREE.Mesh(mitoOuterGeo, mitoOuterMat);
    mitoMesh.position.y = 3.2;
    mitoMesh.castShadow = true;
    mitoGroup.add(mitoMesh);

    // Spinning ATP Synthase turbine on top
    const turbineGeo = new THREE.TorusGeometry(1.2, 0.25, 8, 16);
    const turbineMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.2,
    });
    const turbine = new THREE.Mesh(turbineGeo, turbineMat);
    turbine.position.set(0, 5.8, 0);
    turbine.rotation.x = Math.PI / 2;
    mitoGroup.add(turbine);
    this.atpTurbines.push(turbine);

    this.organellesGroup.add(mitoGroup);

    // 5. RETIKULUM ENDOPLASMA (Rough & Smooth ER) - Wavy membrane ribbons
    const erGroup = new THREE.Group();
    erGroup.position.set(8, 0, -22);

    const erMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const riboMat = new THREE.MeshStandardMaterial({
      color: 0xfdf2f8,
      roughness: 0.8,
    });

    for (let layer = 0; layer < 5; layer++) {
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(7, 1.6, 0.3), erMat);
      ribbon.position.set(Math.sin(layer * 0.7) * 1.5, 1.2 + layer * 1.2, (layer - 2) * 1.4);
      ribbon.rotation.y = 0.2 * layer;
      ribbon.castShadow = true;
      erGroup.add(ribbon);

      // Ribosome beads on Rough ER
      for (let r = 0; r < 8; r++) {
        const ribo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), riboMat);
        ribo.position.set((r - 3.5) * 0.8, 1.2 + layer * 1.2 + 0.5, (layer - 2) * 1.4 + 0.18);
        erGroup.add(ribo);
      }
    }
    this.organellesGroup.add(erGroup);

    // 6. BADAN GOLGI (Golgi Apparatus) - Stacked curved saucers & drifting vesicles
    const golgiGroup = new THREE.Group();
    golgiGroup.position.set(20, 0, 16);

    const golgiMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.4,
      metalness: 0.2,
    });

    for (let g = 0; g < 5; g++) {
      const saucer = new THREE.Mesh(new THREE.TorusGeometry(3.2 - g * 0.35, 0.45, 8, 20, Math.PI * 0.9), golgiMat);
      saucer.rotation.x = Math.PI / 2;
      saucer.rotation.z = 0.2;
      saucer.position.set(0, 1.2 + g * 0.85, 0);
      saucer.castShadow = true;
      golgiGroup.add(saucer);
    }

    // Secretory vesicles
    const vesMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xca8a04,
      emissiveIntensity: 0.4,
    });
    for (let v = 0; v < 6; v++) {
      const ves = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), vesMat);
      ves.position.set((Math.random() - 0.5) * 5, 2 + Math.random() * 3, 3 + Math.random() * 3);
      golgiGroup.add(ves);
      this.golgiVesicles.push(ves);
    }
    this.organellesGroup.add(golgiGroup);

    // 7. STOMATA & SEL PENJAGA (Guard Cells)
    const stomataGroup = new THREE.Group();
    stomataGroup.position.set(-28, 0, 26);

    const guardCellMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.4,
    });

    const guardL = new THREE.Mesh(new THREE.TorusGeometry(3.5, 1.1, 12, 24, Math.PI), guardCellMat);
    guardL.rotation.x = Math.PI / 2;
    guardL.position.set(-1.2, 1.2, 0);
    guardL.castShadow = true;

    const guardR = new THREE.Mesh(new THREE.TorusGeometry(3.5, 1.1, 12, 24, Math.PI), guardCellMat);
    guardR.rotation.x = Math.PI / 2;
    guardR.rotation.z = Math.PI;
    guardR.position.set(1.2, 1.2, 0);
    guardR.castShadow = true;

    stomataGroup.add(guardL, guardR);
    this.stomataPores = stomataGroup;
    this.organellesGroup.add(stomataGroup);

    // 8. BERKAS PENGANGKUT (Xilem & Floem)
    const vascularGroup = new THREE.Group();
    vascularGroup.position.set(28, 0, -26);

    // Xilem (Woody thick blue pipe)
    const xilemPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 10, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 })
    );
    xilemPipe.position.set(-2.5, 5, 0);
    xilemPipe.castShadow = true;

    // Floem (Nutrient green-gold pipe)
    const floemPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 10, 16),
      new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.5, metalness: 0.2 })
    );
    floemPipe.position.set(2.5, 5, 0);
    floemPipe.castShadow = true;

    vascularGroup.add(xilemPipe, floemPipe);
    this.organellesGroup.add(vascularGroup);

    // Setup 3D Interactive Inspection Markers for each organelle
    this.buildOrganelleMarkers();
  }

  private buildOrganelleMarkers() {
    this.interactiveOrganelles.forEach((org) => {
      const markerGroup = new THREE.Group();
      markerGroup.position.set(org.location[0], org.location[1] + 2.5, org.location[2]);

      // Glowing pulsing base beacon ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: org.color,
        wireframe: true,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 8, 24), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -org.location[1] + 0.15;
      markerGroup.add(ring);

      // Floating billboard badge
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = org.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(10, 10, 364, 108, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔍 ${org.name}`, 192, 54);

      ctx.fillStyle = org.color;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`[Ketuk / Tekan E]`, 192, 88);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const spriteMat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.8, 1.25, 1);
      sprite.position.y = 2.0;

      markerGroup.add(sprite);
      this.scene.add(markerGroup);
      this.organelleMarkers.set(org.id, markerGroup);
    });
  }

  private buildMicrotubuleBridges() {
    // Cytoskeleton bridges & ramps for Roblox obby parkour between organelles!
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });

    const bridgePaths = [
      { start: new THREE.Vector3(0, 0.5, 0), end: new THREE.Vector3(-18, 2.5, 10), width: 2.2 },
      { start: new THREE.Vector3(0, 0.5, 0), end: new THREE.Vector3(14, 2.8, -6), width: 2.2 },
      { start: new THREE.Vector3(0, 0.5, 0), end: new THREE.Vector3(0, 2.0, -14), width: 2.5 },
      { start: new THREE.Vector3(-14, 2.5, -8), end: new THREE.Vector3(-6, 1.5, -14), width: 1.8 },
      { start: new THREE.Vector3(14, 2.0, 12), end: new THREE.Vector3(22, 3.0, 16), width: 2.0 },
    ];

    bridgePaths.forEach((path) => {
      const dist = path.start.distanceTo(path.end);
      const mid = path.start.clone().add(path.end).multiplyScalar(0.5);

      const geo = new THREE.BoxGeometry(path.width, 0.35, dist);
      const bridge = new THREE.Mesh(geo, bridgeMat);
      bridge.position.copy(mid);
      bridge.lookAt(path.end);
      bridge.receiveShadow = true;
      this.scene.add(bridge);
    });
  }

  private spawnCollectibles() {
    // Spawn glowing ATP crystals & Photon orbs across the cell
    const atpLocations = [
      new THREE.Vector3(-14, 2.0, -10),
      new THREE.Vector3(-17, 2.2, -14),
      new THREE.Vector3(-12, 1.8, -16),
      new THREE.Vector3(-22, 2.8, 14),
      new THREE.Vector3(-20, 3.2, 9),
      new THREE.Vector3(16, 2.5, -6),
      new THREE.Vector3(19, 3.0, -10),
      new THREE.Vector3(0, 2.5, -13),
      new THREE.Vector3(18, 2.0, 18),
      new THREE.Vector3(-26, 2.0, 24),
      new THREE.Vector3(26, 2.2, -24),
      new THREE.Vector3(0, 1.8, 30),
    ];

    const atpGeo = new THREE.IcosahedronGeometry(0.45, 0);
    const atpMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      metalness: 0.6,
      roughness: 0.2,
    });

    atpLocations.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      const crystal = new THREE.Mesh(atpGeo, atpMat);
      crystal.castShadow = true;
      group.add(crystal);

      // Light halo ring
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, wireframe: true });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 6, 16), haloMat);
      halo.rotation.x = Math.PI / 2;
      group.add(halo);

      this.scene.add(group);
      this.collectibles.push({
        id: `atp_${idx}`,
        type: 'atp',
        mesh: group,
        position: pos.clone(),
        collected: false,
        baseY: pos.y,
      });
    });
  }

  public collectItem(id: string): boolean {
    const item = this.collectibles.find((c) => c.id === id);
    if (item && !item.collected) {
      item.collected = true;
      item.mesh.visible = false;
      return true;
    }
    return false;
  }

  public update(delta: number) {
    this.animTime += delta;

    // Animate DNA helix
    if (this.dnaGroup) {
      this.dnaGroup.rotation.y = this.animTime * 0.8;
    }

    // Animate thylakoid pulsing
    this.thylakoidDiscs.forEach((d, idx) => {
      d.rotation.y = this.animTime * 0.2 + idx * 0.1;
    });

    // Animate ATP turbines in mitochondria
    this.atpTurbines.forEach((t) => {
      t.rotation.z = this.animTime * 2.5;
    });

    // Animate floating Golgi vesicles
    this.golgiVesicles.forEach((v, idx) => {
      v.position.y += Math.sin(this.animTime * 2 + idx) * 0.005;
      v.position.x += Math.cos(this.animTime * 1.5 + idx) * 0.005;
    });

    // Animate stomata guard cells breathing
    if (this.stomataPores) {
      const breath = 1.0 + Math.sin(this.animTime * 1.2) * 0.15;
      this.stomataPores.scale.set(breath, 1.0, 1.0);
    }

    // Animate ATP crystal floating & rotation
    this.collectibles.forEach((item) => {
      if (!item.collected) {
        item.mesh.rotation.y += delta * 1.5;
        item.mesh.position.y = item.baseY + Math.sin(this.animTime * 3 + item.position.x) * 0.2;
      }
    });

    // Pulse organelle beacon rings
    this.organelleMarkers.forEach((marker) => {
      const ring = marker.children[0] as THREE.Mesh;
      if (ring) {
        const s = 1.0 + Math.sin(this.animTime * 3) * 0.08;
        ring.scale.set(s, s, s);
      }
    });

    // Animate Photosynthesis Particle System when active
    if (this.isPhotosynthesisActive && this.photosynthesisParticleGroup) {
      this.photosynthesisParticleGroup.visible = true;

      // 1. Photons swirl around chloroplast
      if (
        this.photonGeo &&
        this.photonPositions &&
        this.photonAngles &&
        this.photonSpeeds &&
        this.photonRadii &&
        this.photonHeights
      ) {
        const pCount = this.photonAngles.length;
        for (let i = 0; i < pCount; i++) {
          this.photonAngles[i] += this.photonSpeeds[i] * delta * 1.6;
          const a = this.photonAngles[i];
          const r = this.photonRadii[i];
          const h = this.photonHeights[i];

          // Ellipsoidal orbit matching chloroplast shape
          this.photonPositions[i * 3] = Math.cos(a) * r * 1.35;
          this.photonPositions[i * 3 + 1] = h + Math.sin(this.animTime * 2.5 + a * 2) * 0.9;
          this.photonPositions[i * 3 + 2] = Math.sin(a) * r * 0.95;
        }
        this.photonGeo.attributes.position.needsUpdate = true;
      }

      // 2. Oxygen bubbles rise and wobble upwards
      if (this.oxygenGeo && this.oxygenPositions && this.oxygenSpeeds && this.oxygenWobbles) {
        const oCount = this.oxygenSpeeds.length;
        for (let i = 0; i < oCount; i++) {
          this.oxygenPositions[i * 3 + 1] += this.oxygenSpeeds[i] * delta * 2.2;
          this.oxygenWobbles[i] += delta * 3.5;

          // Subtle horizontal wobble
          this.oxygenPositions[i * 3] += Math.sin(this.oxygenWobbles[i]) * 0.04;
          this.oxygenPositions[i * 3 + 2] += Math.cos(this.oxygenWobbles[i] * 1.2) * 0.04;

          // Reset when reached upper cytoplasm height
          if (this.oxygenPositions[i * 3 + 1] > 16.0) {
            this.oxygenPositions[i * 3 + 1] = 1.0 + Math.random() * 2.0;
            this.oxygenPositions[i * 3] = (Math.random() - 0.5) * 6.5;
            this.oxygenPositions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
          }
        }
        this.oxygenGeo.attributes.position.needsUpdate = true;
      }

      // 3. Glucose & ATP energy particles radiate outwards
      if (this.glucoseGeo && this.glucosePositions && this.glucoseVelocities && this.glucoseLifetimes) {
        const gCount = this.glucoseLifetimes.length;
        for (let i = 0; i < gCount; i++) {
          this.glucoseLifetimes[i] += delta;
          this.glucosePositions[i * 3] += this.glucoseVelocities[i * 3] * delta;
          this.glucosePositions[i * 3 + 1] += this.glucoseVelocities[i * 3 + 1] * delta;
          this.glucosePositions[i * 3 + 2] += this.glucoseVelocities[i * 3 + 2] * delta;

          if (this.glucoseLifetimes[i] > 2.8) {
            this.resetGlucoseParticle(i, false);
          }
        }
        this.glucoseGeo.attributes.position.needsUpdate = true;
      }

      // 4. Sunbeam rotation and ethereal breathing
      if (this.sunBeamMesh) {
        this.sunBeamMesh.rotation.y += delta * 0.4;
        const beamMat = this.sunBeamMesh.material as THREE.MeshBasicMaterial;
        beamMat.opacity = 0.22 + Math.sin(this.animTime * 3) * 0.08;
      }

      // 5. Chloroplast aura ring expansion & pulse
      if (this.chloroplastAuraRing) {
        const pulse = 1.0 + Math.sin(this.animTime * 4) * 0.12;
        this.chloroplastAuraRing.scale.set(pulse, pulse, pulse);
        this.chloroplastAuraRing.rotation.z += delta * 0.6;
      }

      // 6. Dynamic Point Light pulse
      if (this.chloroplastLight) {
        const targetIntensity = 2.8 + Math.sin(this.animTime * 3.5) * 0.6;
        this.chloroplastLight.intensity = THREE.MathUtils.damp(
          this.chloroplastLight.intensity,
          targetIntensity,
          4,
          delta
        );
      }
    } else if (this.photosynthesisParticleGroup && this.photosynthesisParticleGroup.visible) {
      // Fade out light when turned off
      if (this.chloroplastLight && this.chloroplastLight.intensity > 0.05) {
        this.chloroplastLight.intensity = THREE.MathUtils.damp(this.chloroplastLight.intensity, 0, 5, delta);
      } else {
        this.photosynthesisParticleGroup.visible = false;
      }
    }

    // Animate Cytosol Dust & Bioluminescent Floating Motes (Cyclosis streaming & buoyant drift)
    if (
      this.cytosolDustGeo &&
      this.cytosolDustPositions &&
      this.cytosolDustRotAngles &&
      this.cytosolDustRadii &&
      this.cytosolDustDriftSpeed &&
      this.cytosolDustPhases
    ) {
      const count = this.cytosolDustPhases.length;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        this.cytosolDustPhases[i] += delta * 1.6;

        // Cytoplasmic cyclosis: gentle angular circulation around cell center
        this.cytosolDustRotAngles[i] += this.cytosolDustDriftSpeed[i] * delta * 0.45;
        const a = this.cytosolDustRotAngles[i];
        const r = this.cytosolDustRadii[i];

        // Horizontal position with subtle sinusoidal breathing
        this.cytosolDustPositions[idx] = Math.cos(a) * r;
        this.cytosolDustPositions[idx + 2] = Math.sin(a) * r;

        // Vertical floating drift (simulating microscopic protoplasmic buoyancy)
        this.cytosolDustPositions[idx + 1] += Math.sin(this.cytosolDustPhases[i]) * delta * 0.35;

        // Loop smoothly between cytosol floor and ceiling
        if (this.cytosolDustPositions[idx + 1] > 14.5) {
          this.cytosolDustPositions[idx + 1] = 0.8;
        } else if (this.cytosolDustPositions[idx + 1] < 0.5) {
          this.cytosolDustPositions[idx + 1] = 14.2;
        }
      }
      this.cytosolDustGeo.attributes.position.needsUpdate = true;
    }

    // Animate Footstep & Bioluminescent Trail Particles
    this.footstepTrailSystem.update(delta);
  }

  public setPhotosynthesisActive(active: boolean) {
    this.isPhotosynthesisActive = active;
    if (active && this.photosynthesisParticleGroup) {
      this.photosynthesisParticleGroup.visible = true;
    }
  }

  private buildChloroplastParticleSystem() {
    if (!this.chlorGroup) return;

    this.photosynthesisParticleGroup = new THREE.Group();
    this.photosynthesisParticleGroup.visible = false; // Initially dormant until activated

    // 1. Procedural Glow Textures (Zero 404 dependencies)
    const photonTexture = this.createProceduralParticleTexture('photon');
    const oxygenTexture = this.createProceduralParticleTexture('oxygen');
    const glucoseTexture = this.createProceduralParticleTexture('glucose');
    this.particleTextures.push(photonTexture, oxygenTexture, glucoseTexture);

    // 2. Foton & Klorofil Excitation Particles (Swirling Orbiters)
    const photonCount = this.isSoftwareGl ? 140 : 280;
    this.photonGeo = new THREE.BufferGeometry();
    this.photonPositions = new Float32Array(photonCount * 3);
    this.photonAngles = new Float32Array(photonCount);
    this.photonSpeeds = new Float32Array(photonCount);
    this.photonRadii = new Float32Array(photonCount);
    this.photonHeights = new Float32Array(photonCount);
    const photonColors = new Float32Array(photonCount * 3);

    for (let i = 0; i < photonCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4.2 + Math.random() * 5.2;
      const height = 1.0 + Math.random() * 6.5;
      const speed = (0.8 + Math.random() * 1.6) * (Math.random() > 0.3 ? 1 : -1);

      this.photonAngles[i] = angle;
      this.photonSpeeds[i] = speed;
      this.photonRadii[i] = radius;
      this.photonHeights[i] = height;

      this.photonPositions[i * 3] = Math.cos(angle) * radius * 1.35;
      this.photonPositions[i * 3 + 1] = height;
      this.photonPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.95;

      // Color variation: Lime Green, Solar Yellow, Cyan
      const colorType = Math.random();
      if (colorType < 0.6) {
        // Chlorophyll neon green
        photonColors[i * 3] = 0.3;
        photonColors[i * 3 + 1] = 0.95;
        photonColors[i * 3 + 2] = 0.45;
      } else if (colorType < 0.85) {
        // Solar photon gold
        photonColors[i * 3] = 0.98;
        photonColors[i * 3 + 1] = 0.88;
        photonColors[i * 3 + 2] = 0.2;
      } else {
        // Excited reaction center cyan
        photonColors[i * 3] = 0.25;
        photonColors[i * 3 + 1] = 0.9;
        photonColors[i * 3 + 2] = 0.85;
      }
    }

    this.photonGeo.setAttribute('position', new THREE.BufferAttribute(this.photonPositions, 3));
    this.photonGeo.setAttribute('color', new THREE.BufferAttribute(photonColors, 3));

    const photonMat = new THREE.PointsMaterial({
      size: this.isSoftwareGl ? 0.7 : 0.9,
      map: photonTexture,
      transparent: true,
      opacity: 0.88,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.photonParticles = new THREE.Points(this.photonGeo, photonMat);
    this.photosynthesisParticleGroup.add(this.photonParticles);

    // 3. Gelembung Oksigen (O2 Bubbles rising upwards)
    const o2Count = this.isSoftwareGl ? 50 : 110;
    this.oxygenGeo = new THREE.BufferGeometry();
    this.oxygenPositions = new Float32Array(o2Count * 3);
    this.oxygenSpeeds = new Float32Array(o2Count);
    this.oxygenWobbles = new Float32Array(o2Count);

    for (let i = 0; i < o2Count; i++) {
      // Spawn within grana stack boundary
      const sx = (Math.random() - 0.5) * 6.5;
      const sz = (Math.random() - 0.5) * 4.0;
      const sy = 1.0 + Math.random() * 14.0;

      this.oxygenPositions[i * 3] = sx;
      this.oxygenPositions[i * 3 + 1] = sy;
      this.oxygenPositions[i * 3 + 2] = sz;

      this.oxygenSpeeds[i] = 1.4 + Math.random() * 2.2;
      this.oxygenWobbles[i] = Math.random() * Math.PI * 2;
    }

    this.oxygenGeo.setAttribute('position', new THREE.BufferAttribute(this.oxygenPositions, 3));
    const oxygenMat = new THREE.PointsMaterial({
      size: this.isSoftwareGl ? 0.8 : 1.1,
      map: oxygenTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.oxygenParticles = new THREE.Points(this.oxygenGeo, oxygenMat);
    this.photosynthesisParticleGroup.add(this.oxygenParticles);

    // 4. Molekul Glukosa & ATP (Radiating Outward into Cytoplasm)
    const glucoseCount = this.isSoftwareGl ? 40 : 80;
    this.glucoseGeo = new THREE.BufferGeometry();
    this.glucosePositions = new Float32Array(glucoseCount * 3);
    this.glucoseVelocities = new Float32Array(glucoseCount * 3);
    this.glucoseLifetimes = new Float32Array(glucoseCount);

    for (let i = 0; i < glucoseCount; i++) {
      this.resetGlucoseParticle(i, true);
    }

    this.glucoseGeo.setAttribute('position', new THREE.BufferAttribute(this.glucosePositions, 3));
    const glucoseMat = new THREE.PointsMaterial({
      size: this.isSoftwareGl ? 0.75 : 1.0,
      map: glucoseTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glucoseParticles = new THREE.Points(this.glucoseGeo, glucoseMat);
    this.photosynthesisParticleGroup.add(this.glucoseParticles);

    // 5. Apical Solar Sunbeam
    const sunBeamGeo = new THREE.CylinderGeometry(1.8, 6.2, 18, 16, 1, true);
    const sunBeamMat = new THREE.MeshBasicMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sunBeamMesh = new THREE.Mesh(sunBeamGeo, sunBeamMat);
    this.sunBeamMesh.position.set(0, 10, 0);
    this.photosynthesisParticleGroup.add(this.sunBeamMesh);

    // 6. Resonance Light Halo Ring
    const haloGeo = new THREE.TorusGeometry(7.6, 0.18, 8, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.chloroplastAuraRing = new THREE.Mesh(haloGeo, haloMat);
    this.chloroplastAuraRing.position.set(0, 4, 0);
    this.chloroplastAuraRing.rotation.x = Math.PI / 2;
    this.photosynthesisParticleGroup.add(this.chloroplastAuraRing);

    // 7. Dynamic Chlorophyll Glow Point Light
    this.chloroplastLight = new THREE.PointLight(0x4ade80, 0, 24);
    this.chloroplastLight.position.set(0, 4.5, 0);
    this.photosynthesisParticleGroup.add(this.chloroplastLight);

    this.chlorGroup.add(this.photosynthesisParticleGroup);
  }

  private resetGlucoseParticle(i: number, randomStart: boolean) {
    if (!this.glucosePositions || !this.glucoseVelocities || !this.glucoseLifetimes) return;
    const progress = randomStart ? Math.random() : 0;
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI * 0.7;
    const speed = 2.0 + Math.random() * 2.5;

    const vx = Math.cos(angle) * Math.cos(elevation) * speed;
    const vy = Math.sin(elevation) * speed * 0.8;
    const vz = Math.sin(angle) * Math.cos(elevation) * speed;

    this.glucoseVelocities[i * 3] = vx;
    this.glucoseVelocities[i * 3 + 1] = vy;
    this.glucoseVelocities[i * 3 + 2] = vz;

    this.glucosePositions[i * 3] = vx * progress * 2.0;
    this.glucosePositions[i * 3 + 1] = 4.0 + vy * progress * 2.0;
    this.glucosePositions[i * 3 + 2] = vz * progress * 2.0;

    this.glucoseLifetimes[i] = progress * 2.8;
  }

  private createProceduralParticleTexture(type: 'photon' | 'oxygen' | 'glucose'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    if (type === 'photon') {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(167, 243, 208, 0.95)');
      grad.addColorStop(0.5, 'rgba(74, 222, 128, 0.6)');
      grad.addColorStop(0.8, 'rgba(21, 128, 61, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    } else if (type === 'oxygen') {
      // Oxygen O2 spherical gas bubble
      const grad = ctx.createRadialGradient(24, 24, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.35, 'rgba(186, 230, 253, 0.6)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.3)');
      grad.addColorStop(0.9, 'rgba(14, 165, 233, 0.85)'); // Bright luminous edge
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();

      // Specular shine highlight
      ctx.beginPath();
      ctx.arc(24, 22, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
    } else {
      // Glucose C6H12O6 / ATP star crystal
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(254, 240, 138, 0.95)');
      grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.55)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.particleTextures.forEach((t) => t.dispose());
    this.cytosolDustTexture?.dispose();
    this.cytosolDustGeo?.dispose();
    this.photonGeo?.dispose();
    this.oxygenGeo?.dispose();
    this.glucoseGeo?.dispose();
    this.footstepTrailSystem.destroy();
    this.renderer.dispose();
  }
}
