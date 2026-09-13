/**
 * High-quality Web Audio API Synthesizer and Ambient Sound Generator
 * Provides realistic procedural lofi chords, soothing background ambiance,
 * and satisfying interactive sound effects with zero external audio assets required.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private lofiInterval: number | null = null;
  private isLofiPlaying = false;
  
  // Ambient nodes
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;
  private fireNode: AudioNode | null = null;
  private fireGain: GainNode | null = null;
  private cafeNode: AudioNode | null = null;
  private cafeGain: GainNode | null = null;
  private birdsInterval: number | null = null;
  private birdsGain: GainNode | null = null;
  private cricketsInterval: number | null = null;
  private cricketsGain: GainNode | null = null;
  private oceanGain: GainNode | null = null;
  private clockInterval: number | null = null;
  private clockGain: GainNode | null = null;

  private masterGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects ---
  public playChime(type: 'bell' | 'chime' | 'soft_gong' | 'digital' = 'bell') {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (type === 'bell' || type === 'chime') {
      // Warm meditative crystal singing bowl / bell
      const freqs = [528, 660, 792, 1056];
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2 / (idx + 1), now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 2.6);
      });
    } else if (type === 'soft_gong') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 3);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.1);
    } else {
      // Digital cheerful melody
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
    }
  }

  public playCoin() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playPop() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playHighFive() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    // Pop + gentle cheerful chord
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      gain.gain.setValueAtTime(0.15, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.65);
    });
  }

  public playSplash() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    // Filtered noise pop
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    whiteNoise.start();
  }

  public playSwish() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playSynthNote(freq: number, type: OscillatorType = 'sine', duration = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  public playCustomSample(params: {
    freq?: number;
    type?: OscillatorType | 'bell' | 'noise';
    duration?: number;
    filterFreq?: number;
    wobble?: boolean;
    audioDataUrl?: string;
  }) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (params.audioDataUrl) {
      try {
        const audio = new Audio(params.audioDataUrl);
        audio.volume = 0.8;
        audio.play().catch(() => {});
      } catch (err) {
        console.warn('Audio playback error', err);
      }
      return;
    }

    const now = this.ctx.currentTime;
    const duration = Math.max(0.15, Math.min(2.5, params.duration || 0.6));
    const freq = params.freq || 440;
    const type = params.type || 'triangle';

    if (type === 'bell') {
      const freqs = [freq, freq * 2.02, freq * 3.01, freq * 4.05];
      freqs.forEach((f, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.18 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
      return;
    }

    if (type === 'noise') {
      const bufferSize = Math.floor(this.ctx.sampleRate * Math.min(0.6, duration));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(params.filterFreq || 1200, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + duration + 0.02);
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type as OscillatorType;
    osc.frequency.setValueAtTime(freq, now);

    if (params.wobble) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4.5, now);
      lfoGain.gain.setValueAtTime(8, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + duration + 0.1);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(params.filterFreq || 2000, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // --- Lofi Electric Piano / Chords Engine ---
  private lofiChordsProgression = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7 (C4, E4, G4, B4)
    [220.0, 261.63, 329.63, 392.0],  // Am7 (A3, C4, E4, G4)
    [293.66, 349.23, 440.0, 523.25], // Dm7 (D4, F4, A4, C5)
    [196.0, 246.94, 293.66, 349.23], // G7 (G3, B3, D4, F4)
    [246.94, 311.13, 370.0, 440.0], // Em7 (E3, G#3, B3, D4)
    [349.23, 440.0, 523.25, 659.25], // Fmaj7 (F4, A4, C5, E5)
  ];
  private chordIndex = 0;

  public startLofiChords(volume = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.isLofiPlaying) return;
    this.isLofiPlaying = true;

    const playNextChord = () => {
      if (!this.isLofiPlaying || !this.ctx || !this.masterGain) return;
      const chord = this.lofiChordsProgression[this.chordIndex % this.lofiChordsProgression.length];
      this.chordIndex++;

      const now = this.ctx.currentTime;
      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0.001, now);
      chordGain.gain.linearRampToValueAtTime(0.18 * volume, now + 0.4);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      // Lowpass filter for warm cozy vintage lo-fi Rhodes warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900 + Math.random() * 200, now);

      chord.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        // Subtle analog detuning for lofi wobble
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, now + i * 0.04);
        osc.connect(filter);
        osc.start(now + i * 0.04);
        osc.stop(now + 4.0);
      });

      filter.connect(chordGain);
      chordGain.connect(this.masterGain);
    };

    playNextChord();
    this.lofiInterval = window.setInterval(playNextChord, 4000);
  }

  public stopLofiChords() {
    this.isLofiPlaying = false;
    if (this.lofiInterval) {
      clearInterval(this.lofiInterval);
      this.lofiInterval = null;
    }
  }

  // --- Rain Ambiance ---
  public setRainVolume(vol: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (vol <= 0) {
      if (this.rainGain) {
        this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return;
    }

    if (!this.rainNode) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);
      noise.start();
      this.rainNode = noise;
    }

    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(vol * 0.35, this.ctx.currentTime, 0.1);
    }
  }

  // --- Fireplace Ambiance ---
  public setFireplaceVolume(vol: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (vol <= 0) {
      if (this.fireGain) {
        this.fireGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return;
    }

    if (!this.fireNode) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      // Brownish / low frequency crackle
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.fireGain);
      this.fireGain.connect(this.masterGain);
      noise.start();
      this.fireNode = noise;
    }

    if (this.fireGain) {
      this.fireGain.gain.setTargetAtTime(vol * 0.45, this.ctx.currentTime, 0.1);
    }
  }

  // --- Cafe Murmur ---
  public setCafeVolume(vol: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (vol <= 0) {
      if (this.cafeGain) {
        this.cafeGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return;
    }

    if (!this.cafeNode) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 1.2;

      this.cafeGain = this.ctx.createGain();
      this.cafeGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.cafeGain);
      this.cafeGain.connect(this.masterGain);
      noise.start();
      this.cafeNode = noise;
    }

    if (this.cafeGain) {
      this.cafeGain.gain.setTargetAtTime(vol * 0.3, this.ctx.currentTime, 0.1);
    }
  }

  // --- Forest Birds Ambiance ---
  public setForestBirdsVolume(vol: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (vol <= 0) {
      if (this.birdsInterval) {
        clearInterval(this.birdsInterval);
        this.birdsInterval = null;
      }
      return;
    }

    if (!this.birdsGain) {
      this.birdsGain = this.ctx.createGain();
      this.birdsGain.connect(this.masterGain);
    }
    this.birdsGain.gain.setTargetAtTime(vol * 0.25, this.ctx.currentTime, 0.1);

    if (!this.birdsInterval) {
      const chirp = () => {
        if (!this.ctx || !this.birdsGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const startFreq = 2200 + Math.random() * 1000;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq + 600, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(startFreq - 200, now + 0.16);

        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(g);
        g.connect(this.birdsGain);
        osc.start(now);
        osc.stop(now + 0.2);
      };

      this.birdsInterval = window.setInterval(() => {
        if (Math.random() > 0.3) {
          chirp();
          if (Math.random() > 0.5) {
            setTimeout(chirp, 250);
          }
        }
      }, 3500);
    }
  }

  // --- Night Crickets ---
  public setNightCricketsVolume(vol: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (vol <= 0) {
      if (this.cricketsInterval) {
        clearInterval(this.cricketsInterval);
        this.cricketsInterval = null;
      }
      return;
    }

    if (!this.cricketsGain) {
      this.cricketsGain = this.ctx.createGain();
      this.cricketsGain.connect(this.masterGain);
    }
    this.cricketsGain.gain.setTargetAtTime(vol * 0.15, this.ctx.currentTime, 0.1);

    if (!this.cricketsInterval) {
      const cricketChirp = () => {
        if (!this.ctx || !this.cricketsGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500, now);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(g);
        g.connect(this.cricketsGain);
        osc.start(now);
        osc.stop(now + 0.08);
      };

      this.cricketsInterval = window.setInterval(() => {
        cricketChirp();
        setTimeout(cricketChirp, 100);
        setTimeout(cricketChirp, 200);
      }, 2000);
    }
  }

  // --- Clock Ticking ---
  public setClockTickVolume(vol: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (vol <= 0) {
      if (this.clockInterval) {
        clearInterval(this.clockInterval);
        this.clockInterval = null;
      }
      return;
    }

    if (!this.clockGain) {
      this.clockGain = this.ctx.createGain();
      this.clockGain.connect(this.masterGain);
    }
    this.clockGain.gain.setTargetAtTime(vol * 0.2, this.ctx.currentTime, 0.1);

    if (!this.clockInterval) {
      let isTick = true;
      this.clockInterval = window.setInterval(() => {
        if (!this.ctx || !this.clockGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isTick ? 800 : 650, now);
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(g);
        g.connect(this.clockGain);
        osc.start(now);
        osc.stop(now + 0.04);
        isTick = !isTick;
      }, 1000);
    }
  }

  // --- Master Volume ---
  public setMasterVolume(vol: number) {
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }
}

export const soundEngine = new SoundEngine();
