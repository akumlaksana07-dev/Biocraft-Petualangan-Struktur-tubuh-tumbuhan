import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ORGANELLES } from '../data/biologyData';
import { OrganelleInfo } from '../types/game';

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

  private clock: THREE.Clock;
  private animTime: number = 0;
  private dnaGroup: THREE.Group | null = null;
  private thylakoidDiscs: THREE.Mesh[] = [];
  private golgiVesicles: THREE.Mesh[] = [];
  private stomataPores: THREE.Group | null = null;
  private atpTurbines: THREE.Mesh[] = [];

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

    // Subtle bioluminescent ambient particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const posArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 80;
      posArr[i * 3 + 1] = Math.random() * 15 + 0.5;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x6ee7b7,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(particles);
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
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.renderer.dispose();
  }
}
