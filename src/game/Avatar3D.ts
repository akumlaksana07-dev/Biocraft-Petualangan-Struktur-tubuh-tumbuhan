import * as THREE from 'three';
import { Customization } from '../types/game';

export class Avatar3D {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public torsoMesh: THREE.Mesh;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public accessoryGroup: THREE.Group;
  public hatGroup: THREE.Group;
  public nametagSprite: THREE.Sprite;

  private walkCycle: number = 0;
  private currentAnim: 'idle' | 'walk' | 'jump' | 'cheer' | 'dance' = 'idle';
  private speechTimeout: number | null = null;
  private currentSpeech: string = '';
  private playerName: string = '';
  private playerTitle: string = '';

  constructor(customization: Customization, name: string = 'Siswa', title: string = 'Penjelajah Sel') {
    this.playerName = name;
    this.playerTitle = title;
    this.group = new THREE.Group();

    // 1. Torso (Primary silhouette)
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.4);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: customization.shirtColor,
      roughness: 0.6,
      metalness: 0.1,
    });
    this.torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    this.torsoMesh.position.y = 1.3;
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.group.add(this.torsoMesh);

    // 2. Head & Neck
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.7, 0); // relative to torso center
    this.torsoMesh.add(this.headGroup);

    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const faceTex = this.generateFaceTexture(customization.face);
    faceTex.colorSpace = THREE.SRGBColorSpace;

    const headMaterials = [
      new THREE.MeshStandardMaterial({ color: customization.skinColor, roughness: 0.8 }), // right
      new THREE.MeshStandardMaterial({ color: customization.skinColor, roughness: 0.8 }), // left
      new THREE.MeshStandardMaterial({ color: customization.skinColor, roughness: 0.8 }), // top
      new THREE.MeshStandardMaterial({ color: customization.skinColor, roughness: 0.8 }), // bottom
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.7 }), // front
      new THREE.MeshStandardMaterial({ color: customization.skinColor, roughness: 0.8 }), // back
    ];
    const headMesh = new THREE.Mesh(headGeo, headMaterials);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // 3. Hat / Hair Group
    this.hatGroup = new THREE.Group();
    this.headGroup.add(this.hatGroup);
    this.buildHat(customization.hat);

    // 4. Arms (Pivoted at shoulders)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(0.6, 0.4, 0);
    const armGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
    armGeo.translate(0, -0.35, 0); // pivot at shoulder
    const armMat = new THREE.MeshStandardMaterial({
      color: customization.shirtColor,
      roughness: 0.6,
    });
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.torsoMesh.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(-0.6, 0.4, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, armMat);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.torsoMesh.add(this.rightArm);

    // 5. Legs (Pivoted at hips)
    const legGeo = new THREE.BoxGeometry(0.36, 0.9, 0.38);
    legGeo.translate(0, -0.45, 0); // pivot at hip
    const legMat = new THREE.MeshStandardMaterial({
      color: customization.pantsColor,
      roughness: 0.7,
    });

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(0.22, -0.5, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, legMat);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);
    this.torsoMesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(-0.22, -0.5, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, legMat);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);
    this.torsoMesh.add(this.rightLeg);

    // 6. Backpack / Back Accessory
    this.accessoryGroup = new THREE.Group();
    this.accessoryGroup.position.set(0, 0, -0.25);
    this.torsoMesh.add(this.accessoryGroup);
    this.buildAccessory(customization.accessory);

    // 7. Overhead Nametag & Speech Billboard Sprite
    this.nametagSprite = this.createNametagSprite(this.playerName, this.playerTitle);
    this.nametagSprite.position.set(0, 2.5, 0);
    this.group.add(this.nametagSprite);

    // Ground contact shadow disc
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.02;
    this.group.add(shadowMesh);
  }

  public updateCustomization(c: Customization) {
    (this.torsoMesh.material as THREE.MeshStandardMaterial).color.set(c.shirtColor);
    ((this.leftArm.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(c.shirtColor);
    ((this.rightArm.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(c.shirtColor);
    ((this.leftLeg.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(c.pantsColor);
    ((this.rightLeg.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(c.pantsColor);

    // Update face
    const headMesh = this.headGroup.children[0] as THREE.Mesh;
    const mats = headMesh.material as THREE.MeshStandardMaterial[];
    mats.forEach((m, idx) => {
      if (idx === 4) {
        m.map?.dispose();
        const faceTex = this.generateFaceTexture(c.face);
        faceTex.colorSpace = THREE.SRGBColorSpace;
        m.map = faceTex;
        m.needsUpdate = true;
      } else {
        m.color.set(c.skinColor);
      }
    });

    // Rebuild hat & accessory
    this.buildHat(c.hat);
    this.buildAccessory(c.accessory);
  }

  public updateNameAndTitle(name: string, title: string) {
    this.playerName = name;
    this.playerTitle = title;
    this.refreshNametag();
  }

  public showSpeech(text: string) {
    this.currentSpeech = text;
    this.refreshNametag();
    if (this.speechTimeout) window.clearTimeout(this.speechTimeout);
    this.speechTimeout = window.setTimeout(() => {
      this.currentSpeech = '';
      this.refreshNametag();
    }, 4500);
  }

  private refreshNametag() {
    const newSprite = this.createNametagSprite(this.playerName, this.playerTitle, this.currentSpeech);
    this.nametagSprite.material.dispose();
    this.nametagSprite.material = newSprite.material;
  }

  private generateFaceTexture(faceType: Customization['face']): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Yellowish Roblox face background
    ctx.fillStyle = '#fed8b1';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';

    if (faceType === 'cool') {
      // Sunglasses
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 80, 75, 45);
      ctx.fillRect(141, 80, 75, 45);
      ctx.fillRect(115, 90, 26, 12);
      // Smirk
      ctx.beginPath();
      ctx.arc(140, 160, 40, 0.1 * Math.PI, 0.7 * Math.PI);
      ctx.stroke();
    } else if (faceType === 'goggles') {
      // Lab goggles
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(80, 100, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(176, 100, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // strap
      ctx.fillStyle = '#334155';
      ctx.fillRect(118, 94, 20, 12);
      ctx.fillRect(0, 94, 42, 12);
      ctx.fillRect(214, 94, 42, 12);

      // smile
      ctx.beginPath();
      ctx.arc(128, 160, 45, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else if (faceType === 'nerd') {
      // Round glasses
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(55, 75, 60, 50);
      ctx.strokeRect(141, 75, 60, 50);
      ctx.beginPath();
      ctx.moveTo(115, 100);
      ctx.lineTo(141, 100);
      ctx.stroke();
      // eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(85, 100, 10, 0, Math.PI * 2);
      ctx.arc(171, 100, 10, 0, Math.PI * 2);
      ctx.fill();
      // buck teeth
      ctx.beginPath();
      ctx.arc(128, 155, 30, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(122, 172, 12, 16);
      ctx.strokeRect(122, 172, 12, 16);
    } else if (faceType === 'determined') {
      // Slanted brows
      ctx.beginPath();
      ctx.moveTo(50, 75);
      ctx.lineTo(105, 95);
      ctx.moveTo(206, 75);
      ctx.lineTo(151, 95);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(65, 105, 25, 20);
      ctx.fillRect(166, 105, 25, 20);
      // Grin line
      ctx.beginPath();
      ctx.moveTo(85, 180);
      ctx.lineTo(171, 170);
      ctx.stroke();
    } else {
      // Classic Roblox Smile
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(75, 95, 14, 0, Math.PI * 2);
      ctx.arc(181, 95, 14, 0, Math.PI * 2);
      ctx.fill();

      // Curved wide smile
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(128, 140, 55, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  private buildHat(hatType: Customization['hat']) {
    // Clear existing hat children
    while (this.hatGroup.children.length > 0) {
      const obj = this.hatGroup.children[0];
      this.hatGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    }

    if (hatType === 'none') return;

    if (hatType === 'leaf_cap') {
      const capMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
      const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.15, 16), capMat);
      capMesh.position.y = 0.32;
      this.hatGroup.add(capMesh);

      // Visor
      const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.25), capMat);
      visorMesh.position.set(0, 0.28, 0.35);
      this.hatGroup.add(visorMesh);

      // Little sprout leaf on top
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4ade80 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), stemMat);
      stem.position.set(0, 0.45, 0);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), stemMat);
      leaf.scale.set(1.5, 0.4, 0.8);
      leaf.position.set(0.08, 0.5, 0);
      this.hatGroup.add(stem, leaf);
    } else if (hatType === 'goggles') {
      // Big lab goggles on forehead
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.1, metalness: 0.8 });

      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.58), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      strap.position.y = 0.22;
      this.hatGroup.add(strap);

      const lLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), frameMat);
      lLens.rotation.x = Math.PI / 2;
      lLens.position.set(-0.16, 0.22, 0.3);

      const rLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), frameMat);
      rLens.rotation.x = Math.PI / 2;
      rLens.position.set(0.16, 0.22, 0.3);

      this.hatGroup.add(lLens, rLens);
    } else if (hatType === 'scientist_hair') {
      const hairMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
      for (let i = 0; i < 7; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hairMat);
        const ang = (i / 7) * Math.PI * 2;
        puff.position.set(Math.cos(ang) * 0.26, 0.32 + (i % 2) * 0.08, Math.sin(ang) * 0.26);
        this.hatGroup.add(puff);
      }
    } else if (hatType === 'spiky_hair') {
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 });
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), hairMat);
        spike.position.set((i - 2) * 0.1, 0.38, (Math.random() - 0.5) * 0.2);
        spike.rotation.z = (i - 2) * -0.15;
        this.hatGroup.add(spike);
      }
    } else if (hatType === 'peci_hijab') {
      const peciMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const peciMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.25, 16), peciMat);
      peciMesh.position.y = 0.38;
      this.hatGroup.add(peciMesh);
    }
  }

  private buildAccessory(acc: Customization['accessory']) {
    while (this.accessoryGroup.children.length > 0) {
      const obj = this.accessoryGroup.children[0];
      this.accessoryGroup.remove(obj);
      if (obj instanceof THREE.Mesh) obj.geometry.dispose();
    }

    if (acc === 'none') return;

    if (acc === 'backpack') {
      // Classic student school backpack
      const packMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.28), packMat);
      pack.castShadow = true;

      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.12), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
      pocket.position.set(0, -0.12, -0.18);

      this.accessoryGroup.add(pack, pocket);
    } else if (acc === 'jetpack') {
      // Chlorophyll dual jetpack
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.5, roughness: 0.3 });
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });

      const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.75, 12), tankMat);
      tank1.position.set(-0.24, 0, 0);

      const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.75, 12), tankMat);
      tank2.position.set(0.24, 0, 0);

      const nozzle1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 12), nozzleMat);
      nozzle1.rotation.x = Math.PI;
      nozzle1.position.set(-0.24, -0.42, 0);

      const nozzle2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 12), nozzleMat);
      nozzle2.rotation.x = Math.PI;
      nozzle2.position.set(0.24, -0.42, 0);

      this.accessoryGroup.add(tank1, tank2, nozzle1, nozzle2);
    } else if (acc === 'dna_wings') {
      // Glowing DNA wings
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });

      const wingL = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 24, Math.PI * 1.3), wingMat);
      wingL.position.set(-0.45, 0.1, 0.05);
      wingL.rotation.y = -0.4;

      const wingR = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 24, Math.PI * 1.3), wingMat);
      wingR.position.set(0.45, 0.1, 0.05);
      wingR.rotation.y = 0.4;
      wingR.rotation.z = Math.PI;

      this.accessoryGroup.add(wingL, wingR);
    } else if (acc === 'microscope') {
      // Microscope carried on the back
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6 });
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), baseMat);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), baseMat);
      arm.position.set(0, 0.25, 0.1);

      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12), tubeMat);
      tube.rotation.x = 0.5;
      tube.position.set(0, 0.35, -0.05);

      this.accessoryGroup.add(base, arm, tube);
    }
  }

  private createNametagSprite(name: string, title: string, speech?: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = speech ? 256 : 140;
    const ctx = canvas.getContext('2d')!;

    if (speech) {
      // Draw speech bubble at top
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      this.drawRoundedRect(ctx, 30, 20, 452, 70, 16);
      ctx.fill();
      ctx.stroke();

      // Pointer tail
      ctx.beginPath();
      ctx.moveTo(240, 90);
      ctx.lineTo(256, 108);
      ctx.lineTo(272, 90);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      const truncatedSpeech = speech.length > 32 ? speech.substring(0, 30) + '...' : speech;
      ctx.fillText(`💬 ${truncatedSpeech}`, 256, 62);
    }

    const baseY = speech ? 140 : 20;

    // Roblox style name banner background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.drawRoundedRect(ctx, 60, baseY, 392, 90, 14);
    ctx.fill();

    // Grade pill [SMP VIII]
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌿 SMP KELAS VIII • IPA', 256, baseY + 26);

    // Player Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(name, 256, baseY + 56);

    // Active Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 18px "Segoe UI", sans-serif';
    ctx.fillText(title, 256, baseY + 80);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(speech ? 2.8 : 2.2, speech ? 1.4 : 0.65, 1);
    return sprite;
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

  public animate(delta: number, isMoving: boolean, isJumping: boolean, emote?: 'cheer' | 'dance' | null) {
    if (emote) {
      this.currentAnim = emote;
    } else if (isJumping) {
      this.currentAnim = 'jump';
    } else if (isMoving) {
      this.currentAnim = 'walk';
    } else {
      this.currentAnim = 'idle';
    }

    if (this.currentAnim === 'walk') {
      this.walkCycle += delta * 11;
      const angle = Math.sin(this.walkCycle) * 0.75;

      this.leftArm.rotation.x = angle;
      this.rightArm.rotation.x = -angle;
      this.leftLeg.rotation.x = -angle;
      this.rightLeg.rotation.x = angle;

      // Subtle torso bobbing and roll
      this.torsoMesh.position.y = 1.3 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.08;
      this.torsoMesh.rotation.z = Math.sin(this.walkCycle) * 0.04;
      this.headGroup.rotation.y = Math.sin(this.walkCycle) * 0.05;
    } else if (this.currentAnim === 'jump') {
      // Arms raised upwards in Roblox classic jump
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -2.8, 12, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, -2.8, 12, delta);
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0.4, 12, delta);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, -0.3, 12, delta);
      this.torsoMesh.position.y = 1.3;
      this.torsoMesh.rotation.z = 0;
    } else if (this.currentAnim === 'dance') {
      this.walkCycle += delta * 8;
      const d = Math.sin(this.walkCycle);
      this.torsoMesh.rotation.y = d * 0.6;
      this.torsoMesh.position.y = 1.3 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.15;
      this.leftArm.rotation.z = 1.2 + d * 0.5;
      this.rightArm.rotation.z = -1.2 - d * 0.5;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.headGroup.rotation.z = -d * 0.3;
    } else if (this.currentAnim === 'cheer') {
      this.walkCycle += delta * 10;
      this.leftArm.rotation.x = -2.6 + Math.sin(this.walkCycle) * 0.3;
      this.rightArm.rotation.x = -2.6 + Math.cos(this.walkCycle) * 0.3;
      this.torsoMesh.position.y = 1.3 + Math.abs(Math.sin(this.walkCycle)) * 0.1;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    } else {
      // Idle breathing
      this.walkCycle += delta * 2.5;
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 8, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 8, delta);
      this.leftArm.rotation.z = 0.05 + Math.sin(this.walkCycle) * 0.03;
      this.rightArm.rotation.z = -0.05 - Math.sin(this.walkCycle) * 0.03;
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0, 8, delta);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0, 8, delta);
      this.torsoMesh.position.y = 1.3 + Math.sin(this.walkCycle) * 0.02;
      this.torsoMesh.rotation.z = 0;
      this.headGroup.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.05;
    }
  }

  public destroy() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      } else if (obj instanceof THREE.Sprite) {
        obj.material.dispose();
      }
    });
  }
}
