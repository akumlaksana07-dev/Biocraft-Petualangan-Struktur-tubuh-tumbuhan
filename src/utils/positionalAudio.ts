/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Positional Audio System for BioCraft 3D
 * Generates procedural organelle hums and cellular fluid flow
 * based on player's 3D proximity to organelles in the plant cell.
 */

export interface PositionalAudioStatus {
  enabled: boolean;
  nearestOrganelleName: string | null;
  soundDescription: string | null;
  intensityPercent: number;
  fluidFlowIntensity: number;
}

class PositionalAudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private isInitialized: boolean = false;

  // Master Gain
  private masterGain: GainNode | null = null;

  // 1. Cellular Fluid Flow (Cytosol Streaming)
  private fluidGain: GainNode | null = null;
  private fluidFilter: BiquadFilterNode | null = null;
  private fluidOsc1: OscillatorNode | null = null;
  private fluidOsc2: OscillatorNode | null = null;

  // 2. Mitochondria Hum (ATP Synthase Dynamo)
  private mitoGain: GainNode | null = null;
  private mitoOsc1: OscillatorNode | null = null;
  private mitoOsc2: OscillatorNode | null = null;

  // 3. Nucleus Resonance (Genetic Command Drone)
  private nucGain: GainNode | null = null;
  private nucOsc1: OscillatorNode | null = null;
  private nucOsc2: OscillatorNode | null = null;

  // 4. Chloroplast Hum (Photosynthetic Bubbling / Photon Resonance)
  private chloroGain: GainNode | null = null;
  private chloroOsc1: OscillatorNode | null = null;
  private chloroOsc2: OscillatorNode | null = null;

  // 5. Vacuole Hydraulic Turgor Flow (Water Reservoir Surge)
  private vacuoleGain: GainNode | null = null;
  private vacuoleFilter: BiquadFilterNode | null = null;
  private vacuoleOsc1: OscillatorNode | null = null;

  // 6. ER / Golgi Transport Hum (Enzymatic Assembly)
  private erGain: GainNode | null = null;
  private erOsc: OscillatorNode | null = null;

  // Active Status for HUD
  public currentStatus: PositionalAudioStatus = {
    enabled: true,
    nearestOrganelleName: null,
    soundDescription: null,
    intensityPercent: 0,
    fluidFlowIntensity: 10,
  };

  // Known 3D Coordinates of Organelles
  private readonly MITOCHONDRIA_POSITIONS = [
    { x: 22, y: 1.5, z: 18 },
    { x: 28, y: 1.5, z: 10 },
    { x: 16, y: 1.5, z: 24 },
  ];

  private readonly NUCLEUS_POSITIONS = [
    { x: 0, y: 2.5, z: 0 },
  ];

  private readonly CHLOROPLAST_POSITIONS = [
    { x: -22, y: 1.5, z: 20 },
    { x: -16, y: 1.5, z: 26 },
    { x: -28, y: 1.5, z: 14 },
  ];

  private readonly VACUOLE_POSITIONS = [
    { x: 18, y: 1.5, z: -8 },
  ];

  private readonly ER_GOLGI_POSITIONS = [
    { x: -8, y: 2.0, z: -6 },
    { x: -16, y: 2.0, z: -18 },
  ];

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      const now = this.ctx.currentTime;

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.8 : 0, now);
      this.masterGain.connect(this.ctx.destination);

      // --- 1. Cellular Fluid Flow (Cytoplasm Streaming) ---
      this.fluidGain = this.ctx.createGain();
      this.fluidGain.gain.setValueAtTime(0.03, now);

      this.fluidFilter = this.ctx.createBiquadFilter();
      this.fluidFilter.type = 'lowpass';
      this.fluidFilter.frequency.setValueAtTime(240, now);
      this.fluidFilter.Q.setValueAtTime(2.0, now);

      this.fluidOsc1 = this.ctx.createOscillator();
      this.fluidOsc1.type = 'triangle';
      this.fluidOsc1.frequency.setValueAtTime(90, now);

      this.fluidOsc2 = this.ctx.createOscillator();
      this.fluidOsc2.type = 'sine';
      this.fluidOsc2.frequency.setValueAtTime(125, now);

      this.fluidOsc1.connect(this.fluidFilter);
      this.fluidOsc2.connect(this.fluidFilter);
      this.fluidFilter.connect(this.fluidGain);
      this.fluidGain.connect(this.masterGain);

      this.fluidOsc1.start(now);
      this.fluidOsc2.start(now);

      // --- 2. Mitochondria Hum (ATP Synthase Dynamo Buzz) ---
      this.mitoGain = this.ctx.createGain();
      this.mitoGain.gain.setValueAtTime(0, now);

      const mitoFilter = this.ctx.createBiquadFilter();
      mitoFilter.type = 'bandpass';
      mitoFilter.frequency.setValueAtTime(180, now);
      mitoFilter.Q.setValueAtTime(3.0, now);

      this.mitoOsc1 = this.ctx.createOscillator();
      this.mitoOsc1.type = 'sawtooth';
      this.mitoOsc1.frequency.setValueAtTime(115, now);

      this.mitoOsc2 = this.ctx.createOscillator();
      this.mitoOsc2.type = 'triangle';
      this.mitoOsc2.frequency.setValueAtTime(230, now);

      this.mitoOsc1.connect(mitoFilter);
      this.mitoOsc2.connect(mitoFilter);
      mitoFilter.connect(this.mitoGain);
      this.mitoGain.connect(this.masterGain);

      this.mitoOsc1.start(now);
      this.mitoOsc2.start(now);

      // --- 3. Nucleus Resonance (Genetic Command Deep Drone) ---
      this.nucGain = this.ctx.createGain();
      this.nucGain.gain.setValueAtTime(0, now);

      const nucFilter = this.ctx.createBiquadFilter();
      nucFilter.type = 'lowpass';
      nucFilter.frequency.setValueAtTime(140, now);

      this.nucOsc1 = this.ctx.createOscillator();
      this.nucOsc1.type = 'sine';
      this.nucOsc1.frequency.setValueAtTime(65, now);

      this.nucOsc2 = this.ctx.createOscillator();
      this.nucOsc2.type = 'sine';
      this.nucOsc2.frequency.setValueAtTime(130, now);

      this.nucOsc1.connect(nucFilter);
      this.nucOsc2.connect(nucFilter);
      nucFilter.connect(this.nucGain);
      this.nucGain.connect(this.masterGain);

      this.nucOsc1.start(now);
      this.nucOsc2.start(now);

      // --- 4. Chloroplast Hum (Photosynthetic Photon Buzz & Bubbling) ---
      this.chloroGain = this.ctx.createGain();
      this.chloroGain.gain.setValueAtTime(0, now);

      const chloroFilter = this.ctx.createBiquadFilter();
      chloroFilter.type = 'bandpass';
      chloroFilter.frequency.setValueAtTime(432, now);
      chloroFilter.Q.setValueAtTime(4.0, now);

      this.chloroOsc1 = this.ctx.createOscillator();
      this.chloroOsc1.type = 'sine';
      this.chloroOsc1.frequency.setValueAtTime(432, now);

      this.chloroOsc2 = this.ctx.createOscillator();
      this.chloroOsc2.type = 'triangle';
      this.chloroOsc2.frequency.setValueAtTime(864, now);

      this.chloroOsc1.connect(chloroFilter);
      this.chloroOsc2.connect(chloroFilter);
      chloroFilter.connect(this.chloroGain);
      this.chloroGain.connect(this.masterGain);

      this.chloroOsc1.start(now);
      this.chloroOsc2.start(now);

      // --- 5. Vacuole Turgor Hydraulic Surge ---
      this.vacuoleGain = this.ctx.createGain();
      this.vacuoleGain.gain.setValueAtTime(0, now);

      this.vacuoleFilter = this.ctx.createBiquadFilter();
      this.vacuoleFilter.type = 'bandpass';
      this.vacuoleFilter.frequency.setValueAtTime(210, now);
      this.vacuoleFilter.Q.setValueAtTime(2.5, now);

      this.vacuoleOsc1 = this.ctx.createOscillator();
      this.vacuoleOsc1.type = 'sine';
      this.vacuoleOsc1.frequency.setValueAtTime(105, now);

      this.vacuoleOsc1.connect(this.vacuoleFilter);
      this.vacuoleFilter.connect(this.vacuoleGain);
      this.vacuoleGain.connect(this.masterGain);

      this.vacuoleOsc1.start(now);

      // --- 6. ER & Golgi Secretory Assembly ---
      this.erGain = this.ctx.createGain();
      this.erGain.gain.setValueAtTime(0, now);

      this.erOsc = this.ctx.createOscillator();
      this.erOsc.type = 'triangle';
      this.erOsc.frequency.setValueAtTime(310, now);

      const erFilter = this.ctx.createBiquadFilter();
      erFilter.type = 'bandpass';
      erFilter.frequency.setValueAtTime(310, now);

      this.erOsc.connect(erFilter);
      erFilter.connect(this.erGain);
      this.erGain.connect(this.masterGain);

      this.erOsc.start(now);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Positional Audio Context initialization deferred until user interaction.', e);
    }
  }

  public setMuted(muted: boolean) {
    this.enabled = !muted;
    this.currentStatus.enabled = !muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, now, 0.05);
    }
  }

  private minDistanceTo(pos: { x: number; y: number; z: number }, points: { x: number; y: number; z: number }[]): number {
    let minD = Infinity;
    for (const p of points) {
      const d = Math.hypot(p.x - pos.x, p.z - pos.z);
      if (d < minD) minD = d;
    }
    return minD;
  }

  /**
   * Main positional audio update called in the render loop.
   * Calculates proximity and smoothly ramps the audio gains.
   */
  public update(
    playerPos: { x: number; y: number; z: number },
    isMoving: boolean,
    isSprinting: boolean,
    photosynthesisActive: boolean = false
  ) {
    if (!this.enabled) return;

    if (!this.isInitialized) {
      // Lazy init on first user input if permitted
      this.init();
      if (!this.isInitialized) return;
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx!.currentTime;
    const maxAudibleDist = 13.0; // Distance in meters where organelle sound becomes audible

    // 1. Mitochondria proximity
    const distMito = this.minDistanceTo(playerPos, this.MITOCHONDRIA_POSITIONS);
    const mitoProximity = Math.max(0, 1 - distMito / maxAudibleDist);
    const mitoVol = Math.pow(mitoProximity, 1.4) * 0.14;
    this.mitoGain?.gain.setTargetAtTime(mitoVol, now, 0.12);

    // 2. Nucleus proximity
    const distNuc = this.minDistanceTo(playerPos, this.NUCLEUS_POSITIONS);
    const nucProximity = Math.max(0, 1 - distNuc / (maxAudibleDist + 2.0));
    const nucVol = Math.pow(nucProximity, 1.3) * 0.18;
    this.nucGain?.gain.setTargetAtTime(nucVol, now, 0.12);

    // 3. Chloroplast proximity
    const distChloro = this.minDistanceTo(playerPos, this.CHLOROPLAST_POSITIONS);
    const chloroProximity = Math.max(0, 1 - distChloro / maxAudibleDist);
    const chloroBoost = photosynthesisActive ? 1.4 : 1.0;
    const chloroVol = Math.pow(chloroProximity, 1.4) * 0.12 * chloroBoost;
    this.chloroGain?.gain.setTargetAtTime(chloroVol, now, 0.12);

    // 4. Vacuole proximity
    const distVacuole = this.minDistanceTo(playerPos, this.VACUOLE_POSITIONS);
    const vacuoleProximity = Math.max(0, 1 - distVacuole / (maxAudibleDist + 1.0));
    const vacuoleVol = Math.pow(vacuoleProximity, 1.3) * 0.15;
    this.vacuoleGain?.gain.setTargetAtTime(vacuoleVol, now, 0.12);

    // 5. ER & Golgi proximity
    const distER = this.minDistanceTo(playerPos, this.ER_GOLGI_POSITIONS);
    const erProximity = Math.max(0, 1 - distER / maxAudibleDist);
    const erVol = Math.pow(erProximity, 1.5) * 0.09;
    this.erGain?.gain.setTargetAtTime(erVol, now, 0.12);

    // 6. Cellular Fluid Flow (Dynamic Cytoplasm Movement)
    let fluidVol = 0.025;
    let fluidFreq = 220;
    if (isSprinting) {
      fluidVol = 0.075;
      fluidFreq = 380;
    } else if (isMoving) {
      fluidVol = 0.045;
      fluidFreq = 290;
    }
    this.fluidGain?.gain.setTargetAtTime(fluidVol, now, 0.15);
    this.fluidFilter?.frequency.setTargetAtTime(fluidFreq, now, 0.2);

    // Determine highest audible organelle for HUD feedback
    const soundList = [
      { name: 'Mitokondria', desc: 'Dengungan Sintesis ATP (180Hz)', prox: mitoProximity, vol: mitoVol },
      { name: 'Nukleus', desc: 'Resonansi Genetik Inti Sel (65Hz)', prox: nucProximity, vol: nucVol },
      { name: 'Kloroplas', desc: 'Desir Fluida Reaksi Fotosintesis', prox: chloroProximity, vol: chloroVol },
      { name: 'Vakuola', desc: 'Aliran Tekanan Turgor Air Sel', prox: vacuoleProximity, vol: vacuoleVol },
      { name: 'Retikulum & Golgi', desc: 'Sintesis Enzimatik & Transpor', prox: erProximity, vol: erVol },
    ];

    soundList.sort((a, b) => b.prox - a.prox);
    const strongest = soundList[0];

    if (strongest && strongest.prox > 0.08) {
      this.currentStatus.nearestOrganelleName = strongest.name;
      this.currentStatus.soundDescription = strongest.desc;
      this.currentStatus.intensityPercent = Math.round(strongest.prox * 100);
    } else {
      this.currentStatus.nearestOrganelleName = null;
      this.currentStatus.soundDescription = 'Aliran Sitosol & Mikrotubulus';
      this.currentStatus.intensityPercent = isMoving ? 35 : 15;
    }

    this.currentStatus.fluidFlowIntensity = isSprinting ? 90 : isMoving ? 55 : 20;
  }
}

export const positionalAudio = new PositionalAudioManager();
