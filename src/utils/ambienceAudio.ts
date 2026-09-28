// Procedural Ambience Audio Engine using Web Audio API
// High performance, zero external network requests, works offline & on all mobile browsers

class AmbienceAudioEngine {
  private ctx: AudioContext | null = null;
  private currentType: string = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private rainInterval: any = null;
  private crackleInterval: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.25;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      const safeVol = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.setTargetAtTime(safeVol, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    if (this.rainInterval) {
      clearInterval(this.rainInterval);
      this.rainInterval = null;
    }
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
    for (const n of this.activeNodes) {
      try {
        if (n.stop) n.stop();
        n.disconnect();
      } catch (e) {}
    }
    this.activeNodes = [];
    this.currentType = 'none';
  }

  public play(type: 'rain' | 'crackle' | 'breeze' | 'none', volume: number = 0.3) {
    this.stop();
    if (type === 'none') return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentType = type;
    this.setVolume(volume);

    if (type === 'rain') {
      this.startRainSound();
    } else if (type === 'crackle') {
      this.startCrackleSound();
    } else if (type === 'breeze') {
      this.startBreezeSound();
    }
  }

  // Soft Continuous Rain sound with filtered pink noise
  private startRainSound() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    noiseSource.connect(filter);
    filter.connect(this.masterGain);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter);
  }

  // Campfire and Cozy Vinyl Crackle
  private startCrackleSound() {
    if (!this.ctx || !this.masterGain) return;

    // Gentle deep room rumble
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.03;
    }
    const rumbleSource = this.ctx.createBufferSource();
    rumbleSource.buffer = buffer;
    rumbleSource.loop = true;

    const lowFilter = this.ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 250;

    rumbleSource.connect(lowFilter);
    lowFilter.connect(this.masterGain);
    rumbleSource.start();
    this.activeNodes.push(rumbleSource, lowFilter);

    // Random pops and crackles
    this.crackleInterval = setInterval(() => {
      if (!this.ctx || !this.masterGain) return;
      if (Math.random() > 0.4) {
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.value = 120 + Math.random() * 800;

        const now = this.ctx.currentTime;
        popGain.gain.setValueAtTime(0.04 * Math.random(), now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03 + Math.random() * 0.04);

        popOsc.connect(popGain);
        popGain.connect(this.masterGain);
        popOsc.start(now);
        popOsc.stop(now + 0.08);
      }
    }, 90);
  }

  // Calming Night Starlight Breeze
  private startBreezeSound() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 1.2;

    // LFO to create undulating wind gusts
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.15; // slow breathe
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(this.masterGain);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }
}

export const ambienceAudio = new AmbienceAudioEngine();
