// Web Audio API Soundscapes and Cognitive Chimes
// Zero external asset dependencies; purely synthesized client-side

class AudioController {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private currentMode: 'off' | 'rain' | 'whitenoise' | 'alpha' = 'off';
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play pleasant crystal chime for correct active recall validation
  playSuccessChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two harmonic oscillators for clean celestial chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Harmonic E6 / B6 / G#7 progression
      osc1.frequency.setValueAtTime(1318.51, now); // E6
      osc1.frequency.exponentialRampToValueAtTime(1975.53, now + 0.12); // B6

      osc2.frequency.setValueAtTime(1648.14, now); // G#6
      osc2.frequency.exponentialRampToValueAtTime(2637.02, now + 0.14); // E7

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.46);
      osc2.stop(now + 0.46);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Soft subtle click for flip card or UI interaction
  playFlipSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  // Ambient Focus Generator
  setAmbience(mode: 'off' | 'rain' | 'whitenoise' | 'alpha') {
    this.stopAmbience();
    this.currentMode = mode;
    if (mode === 'off') return;

    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (mode === 'alpha') {
      // Binaural alpha flow: 200Hz base + 210Hz (10Hz difference for relaxed focus)
      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();

      this.osc1.type = 'sine';
      this.osc2.type = 'sine';
      this.osc1.frequency.setValueAtTime(200, now);
      this.osc2.frequency.setValueAtTime(210, now);

      this.gainNode.gain.setValueAtTime(0.001, now);
      this.gainNode.gain.linearRampToValueAtTime(0.04, now + 1.5);

      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc1.start(now);
      this.osc2.start(now);
      return;
    }

    // White Noise or Gentle Rain via synthesized buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === 'rain') {
        // Brown/pink filtering for rain drop feeling
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 3.5;
      } else {
        // Soft white noise
        output[i] = white * 0.15;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    if (mode === 'rain') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(800, now);
    } else {
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(1200, now);
      this.filterNode.Q.setValueAtTime(0.5, now);
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.001, now);
    this.gainNode.gain.linearRampToValueAtTime(0.03, now + 1.2);

    whiteNoise.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    whiteNoise.start(now);
    this.noiseNode = whiteNoise;
  }

  stopAmbience() {
    if (this.gainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      } catch {}
    }
    setTimeout(() => {
      if (this.noiseNode && 'stop' in this.noiseNode) {
        try {
          (this.noiseNode as AudioScheduledSourceNode).stop();
        } catch {}
      }
      if (this.osc1) {
        try {
          this.osc1.stop();
        } catch {}
      }
      if (this.osc2) {
        try {
          this.osc2.stop();
        } catch {}
      }
      this.noiseNode = null;
      this.filterNode = null;
      this.gainNode = null;
      this.osc1 = null;
      this.osc2 = null;
      this.currentMode = 'off';
    }, 550);
  }

  getCurrentMode() {
    return this.currentMode;
  }
}

export const soundController = new AudioController();
