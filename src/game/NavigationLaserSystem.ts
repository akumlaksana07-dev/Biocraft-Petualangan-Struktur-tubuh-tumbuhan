import * as THREE from 'three';
import { OrganelleInfo } from '../types/game';

export class NavigationLaserSystem {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private organelles: OrganelleInfo[];
  private isSoftwareGl: boolean;

  // Floor laser ribbon mesh
  private laserMesh: THREE.Mesh;
  private laserGeo: THREE.PlaneGeometry;
  private laserMat: THREE.MeshBasicMaterial;
  private laserTex: THREE.CanvasTexture;

  // Ultra-bright core filament
  private coreMesh: THREE.Mesh;
  private coreGeo: THREE.PlaneGeometry;
  private coreMat: THREE.MeshBasicMaterial;

  // Foot anchor ring at player's position
  private playerRingMesh: THREE.Mesh;

  // Target organelle floor beacon & reticle
  private targetBeaconGroup: THREE.Group;
  private targetRingMesh: THREE.Mesh;
  private targetDashedRingMesh: THREE.Mesh;
  private targetCenterDot: THREE.Mesh;
  private targetLabelSprite: THREE.Sprite | null = null;
  private targetLabelTex: THREE.CanvasTexture | null = null;

  // Target vertical light beacon
  private targetBeamMesh: THREE.Mesh;

  // Animation state
  private animTime: number = 0;
  private lastTargetName: string = '';
  private lastTargetDist: number = -1;
  public currentNearestOrganelle: OrganelleInfo | null = null;

  constructor(scene: THREE.Scene, organelles: OrganelleInfo[], isSoftwareGl: boolean = false) {
    this.scene = scene;
    this.organelles = organelles;
    this.isSoftwareGl = isSoftwareGl;
    this.group = new THREE.Group();
    this.group.name = 'NavigationLaserSystem';
    this.group.visible = false; // Hidden until Mode Bantu is activated

    // 1. Procedural Glowing Floor Laser Texture with Flowing Energy Chevrons
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Background gradient across width (X)
    const hGrad = ctx.createLinearGradient(0, 0, 128, 0);
    hGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
    hGrad.addColorStop(0.18, 'rgba(6, 182, 212, 0.45)');
    hGrad.addColorStop(0.42, 'rgba(34, 211, 238, 0.85)');
    hGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)'); // Incandescent core
    hGrad.addColorStop(0.58, 'rgba(34, 211, 238, 0.85)');
    hGrad.addColorStop(0.82, 'rgba(6, 182, 212, 0.45)');
    hGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, 128, 512);

    // Repeated glowing navigation arrows / laser pulses along length (Y)
    for (let y = 0; y < 512; y += 64) {
      // Forward arrow chevron pointing towards target
      ctx.beginPath();
      ctx.moveTo(32, y + 20);
      ctx.lineTo(64, y + 4);
      ctx.lineTo(96, y + 20);
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.stroke();

      // Energy dash pulse
      ctx.beginPath();
      ctx.arc(64, y + 36, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
      ctx.fill();
    }

    this.laserTex = new THREE.CanvasTexture(canvas);
    this.laserTex.wrapS = THREE.RepeatWrapping;
    this.laserTex.wrapT = THREE.RepeatWrapping;
    this.laserTex.repeat.set(1, 4);
    this.laserTex.colorSpace = THREE.SRGBColorSpace;

    // 2. Main Floor Laser Ribbon (Width: ~0.26 units)
    this.laserGeo = new THREE.PlaneGeometry(0.26, 1);
    this.laserGeo.rotateX(-Math.PI / 2); // Lay flat horizontally on floor
    this.laserGeo.translate(0, 0, 0.5); // Pivot at start (player's feet)

    this.laserMat = new THREE.MeshBasicMaterial({
      map: this.laserTex,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.laserMesh = new THREE.Mesh(this.laserGeo, this.laserMat);
    this.laserMesh.position.y = 0.08; // Hover slightly above cytosol floor to avoid z-fighting
    this.group.add(this.laserMesh);

    // 3. Ultra-Bright Central Laser Filament (Width: ~0.08 units)
    this.coreGeo = new THREE.PlaneGeometry(0.08, 1);
    this.coreGeo.rotateX(-Math.PI / 2);
    this.coreGeo.translate(0, 0, 0.5);

    this.coreMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe, // Pure bright luminous cyan-white
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.coreMesh = new THREE.Mesh(this.coreGeo, this.coreMat);
    this.coreMesh.position.y = 0.085;
    this.group.add(this.coreMesh);

    // 4. Floor Emitter Ring at Player's Feet
    const ringGeo = new THREE.RingGeometry(0.35, 0.48, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.playerRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.playerRingMesh.position.y = 0.082;
    this.group.add(this.playerRingMesh);

    // 5. Destination Organelle Floor Beacon Group
    this.targetBeaconGroup = new THREE.Group();

    // Floor Target Concentric Rings
    const targetRingGeo = new THREE.RingGeometry(1.6, 2.0, 32);
    targetRingGeo.rotateX(-Math.PI / 2);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.targetRingMesh = new THREE.Mesh(targetRingGeo, targetRingMat);
    this.targetRingMesh.position.y = 0.082;
    this.targetBeaconGroup.add(this.targetRingMesh);

    // Outer Dashed Rotating Reticle
    const dashedGeo = new THREE.RingGeometry(2.3, 2.5, 32);
    dashedGeo.rotateX(-Math.PI / 2);
    const dashedMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.targetDashedRingMesh = new THREE.Mesh(dashedGeo, dashedMat);
    this.targetDashedRingMesh.position.y = 0.083;
    this.targetBeaconGroup.add(this.targetDashedRingMesh);

    // Central target floor dot
    const dotGeo = new THREE.CircleGeometry(0.4, 16);
    dotGeo.rotateX(-Math.PI / 2);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.targetCenterDot = new THREE.Mesh(dotGeo, dotMat);
    this.targetCenterDot.position.y = 0.084;
    this.targetBeaconGroup.add(this.targetCenterDot);

    // Vertical Holographic Light Pillar at target center
    const beamGeo = new THREE.CylinderGeometry(0.06, 0.18, 5.5, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.targetBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.targetBeamMesh.position.y = 2.75;
    this.targetBeaconGroup.add(this.targetBeamMesh);

    this.group.add(this.targetBeaconGroup);
    this.scene.add(this.group);
  }

  // Update target 3D text billboard sprite
  private updateTargetLabel(organelleName: string, distanceMeters: number) {
    if (this.lastTargetName === organelleName && this.lastTargetDist === distanceMeters) {
      return;
    }
    this.lastTargetName = organelleName;
    this.lastTargetDist = distanceMeters;

    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;

    // Rounded glowing pill background
    ctx.fillStyle = 'rgba(2, 22, 14, 0.88)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    this.roundRect(ctx, 4, 4, 376, 88, 22);
    ctx.fill();
    ctx.stroke();

    // Icon & Header
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#67e8f9';
    ctx.textAlign = 'center';
    ctx.fillText(`🎯 ${organelleName}`, 192, 40);

    // Distance Subtitle
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText(`Jarak: ${distanceMeters} meter • Mode Bantu`, 192, 72);

    if (this.targetLabelTex) {
      this.targetLabelTex.dispose();
    }
    this.targetLabelTex = new THREE.CanvasTexture(canvas);
    this.targetLabelTex.colorSpace = THREE.SRGBColorSpace;

    if (!this.targetLabelSprite) {
      const spriteMat = new THREE.SpriteMaterial({
        map: this.targetLabelTex,
        transparent: true,
        depthWrite: false,
      });
      this.targetLabelSprite = new THREE.Sprite(spriteMat);
      this.targetLabelSprite.scale.set(3.8, 0.95, 1);
      this.targetBeaconGroup.add(this.targetLabelSprite);
    } else {
      this.targetLabelSprite.material.map = this.targetLabelTex;
      this.targetLabelSprite.material.needsUpdate = true;
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  public update(playerPos: THREE.Vector3, isGuideModeActive: boolean, delta: number) {
    if (!isGuideModeActive) {
      if (this.group.visible) {
        this.group.visible = false;
      }
      return;
    }

    if (!this.group.visible) {
      this.group.visible = true;
    }

    this.animTime += delta;

    // 1. Find nearest organelle on XZ plane
    let nearest: OrganelleInfo = this.organelles[0];
    let minDist = Infinity;

    for (let i = 0; i < this.organelles.length; i++) {
      const org = this.organelles[i];
      const dx = org.location[0] - playerPos.x;
      const dz = org.location[2] - playerPos.z;
      const d = Math.hypot(dx, dz);
      if (d < minDist) {
        minDist = d;
        nearest = org;
      }
    }
    this.currentNearestOrganelle = nearest;

    const targetX = nearest.location[0];
    const targetZ = nearest.location[2];
    const dx = targetX - playerPos.x;
    const dz = targetZ - playerPos.z;
    const distance = Math.hypot(dx, dz);

    // 2. Position Floor Emitter at player feet
    this.playerRingMesh.position.set(playerPos.x, 0.082, playerPos.z);
    const ringScale = 1.0 + Math.sin(this.animTime * 4.5) * 0.12;
    this.playerRingMesh.scale.set(ringScale, ringScale, ringScale);

    // 3. Orient and scale the floor laser beam
    // Angle in XZ plane from player to target
    const angle = Math.atan2(dx, dz);

    this.laserMesh.position.set(playerPos.x, 0.08, playerPos.z);
    this.laserMesh.rotation.y = angle;
    this.laserMesh.scale.set(1, 1, Math.max(distance, 0.1));

    this.coreMesh.position.set(playerPos.x, 0.085, playerPos.z);
    this.coreMesh.rotation.y = angle;
    this.coreMesh.scale.set(1, 1, Math.max(distance, 0.1));

    // Dynamic texture repeating and animated flow along the laser line towards the organelle
    this.laserTex.repeat.set(1, Math.max(distance / 2.5, 1));
    this.laserTex.offset.y -= delta * 2.4; // Moving forward towards the organelle!

    // Laser breathing intensity
    const pulseOpacity = 0.82 + Math.sin(this.animTime * 5.0) * 0.15;
    this.laserMat.opacity = pulseOpacity;
    this.coreMat.opacity = Math.min(1.0, pulseOpacity + 0.1);

    // 4. Update Destination Beacon
    this.targetBeaconGroup.position.set(targetX, 0, targetZ);

    // Concentric floor rings pulsing & spinning
    const targetPulse = 1.0 + Math.sin(this.animTime * 3.5) * 0.18;
    this.targetRingMesh.scale.set(targetPulse, targetPulse, targetPulse);

    this.targetDashedRingMesh.rotation.y += delta * 0.8;
    const dashedPulse = 1.0 + Math.cos(this.animTime * 3.5) * 0.12;
    this.targetDashedRingMesh.scale.set(dashedPulse, dashedPulse, dashedPulse);

    // Vertical light beam breathing
    this.targetBeamMesh.rotation.y += delta * 0.5;
    (this.targetBeamMesh.material as THREE.MeshBasicMaterial).opacity =
      0.25 + Math.sin(this.animTime * 4.0) * 0.12;

    // 5. Update Floating Target Billboard Label
    this.updateTargetLabel(nearest.name, Math.round(distance));
    if (this.targetLabelSprite) {
      this.targetLabelSprite.position.set(0, 3.8 + Math.sin(this.animTime * 2.5) * 0.25, 0);
    }
  }

  public destroy() {
    this.laserTex.dispose();
    this.laserGeo.dispose();
    this.laserMat.dispose();
    this.coreGeo.dispose();
    this.coreMat.dispose();
    this.targetLabelTex?.dispose();
    this.scene.remove(this.group);
  }
}
