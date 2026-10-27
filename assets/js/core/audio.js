// Son démo : boucles originales synthétisées dans le navigateur (Web Audio), une par ambiance.
// Rien n'est chargé, rien n'est joué sans action du visiteur.
import { state, emit, MOODS } from './state.js';

const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

// Grilles de 16 pas par mesure ; accords = notes MIDI, basses = notes MIDI
const PATTERNS = {
  lounge: {
    kick:  'x.....x...x.....', snare: '....x.......x...', hat: '..x...x...x...x.', ohat: '................',
    bassSteps: 'x.........x...x.', stab: 'x.......x.......', swing: 0.14, chordLen: 3.2,
    chords: [[62, 65, 69, 72, 76], [55, 59, 62, 65, 69], [60, 64, 67, 71, 74], [57, 61, 64, 67, 70]],
    bass: [38, 43, 36, 45], voice: 'keys', bassWave: 'sine', hatVol: 0.05, kickVol: 0.7,
  },
  dansant: {
    kick:  'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', ohat: '..x...x...x...x.',
    bassSteps: '..x...x...x...x.', stab: '...x.....x....x.', swing: 0, chordLen: 0.22,
    chords: [[57, 60, 64, 69], [53, 57, 60, 65], [60, 64, 67, 72], [55, 59, 62, 67]],
    bass: [45, 41, 48, 43], voice: 'stab', bassWave: 'sawtooth', hatVol: 0.035, kickVol: 1,
  },
  retro: {
    kick:  'x...x...x...x...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', ohat: '..x...x...x...x.',
    bassSteps: 'x.x.x.x.x.x.x.x.', stab: 'x.......x.......', swing: 0.06, chordLen: 1.9, octaveBass: true,
    chords: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]],
    bass: [38, 43, 36, 45], voice: 'strings', bassWave: 'sawtooth', hatVol: 0.025, kickVol: 0.95,
  },
  moderne: {
    kick:  'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', ohat: '................',
    bassSteps: 'x..x..x...x..x..', stab: 'xxxxxxxxxxxxxxxx', swing: 0, chordLen: 0.12, arp: true, pump: true,
    chords: [[52, 55, 59, 64], [48, 52, 55, 60], [55, 59, 62, 67], [50, 54, 57, 62]],
    bass: [40, 36, 43, 38], voice: 'pluck', bassWave: 'square', hatVol: 0.04, kickVol: 1,
  },
};

class DemoAudio {
  constructor() {
    this.ctx = null; this.on = false; this.step = 0; this.bar = 0; this.nextTime = 0; this.timer = null;
    this.analyser = null; this.freq = null; this.levelValue = 0;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Web Audio indisponible');
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 3; this.comp.attack.value = 0.005; this.comp.release.value = 0.2;
    this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512; this.analyser.smoothingTimeConstant = 0.6;
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    this.music = ctx.createGain(); this.music.gain.value = 1;      // bus « pompé » par le kick (moderne)
    this.music.connect(this.comp);
    this.comp.connect(this.master); this.master.connect(this.analyser); this.analyser.connect(ctx.destination);
    // Réverbe courte générée (bruit décroissant)
    const len = Math.floor(ctx.sampleRate * 1.6); const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    this.verbIn = ctx.createGain(); this.verbIn.gain.value = 0.22; this.verbIn.connect(this.verb); this.verb.connect(this.comp);
    // Bruit blanc partagé
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
  }

  async start() {
    this.ensure();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.on) return;
    this.on = true; state.soundOn = true;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.42, t + 0.6);
    this.step = 0; this.bar = 0; this.nextTime = t + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
    emit('sound', true);
  }

  stop() {
    if (!this.ctx || !this.on) return;
    this.on = false; state.soundOn = false;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.35);
    clearInterval(this.timer);
    setTimeout(() => { if (!this.on && this.ctx) this.ctx.suspend(); }, 450);
    emit('sound', false);
  }

  toggle() { return this.on ? (this.stop(), false) : this.start().then(() => true); }

  get pattern() { return PATTERNS[state.mood] || PATTERNS.dansant; }

  schedule() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime);
      const spb = 60 / (MOODS[state.mood]?.bpm || 124) / 4;
      const sw = this.pattern.swing || 0;
      this.nextTime += spb * (this.step % 2 === 0 ? 1 + sw : 1 - sw);
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar = (this.bar + 1) % 4;
    }
  }

  playStep(s, t) {
    const p = this.pattern; const bar = this.bar;
    const spb = 60 / (MOODS[state.mood]?.bpm || 124);
    if (p.kick[s] === 'x') { this.kick(t, p.kickVol); if (p.pump) this.pump(t, spb); }
    if (p.snare[s] === 'x') state.mood === 'lounge' ? this.rim(t) : this.clap(t);
    if (p.hat[s] === 'x') this.hat(t, 0.04, p.hatVol * (s % 4 === 2 ? 1.4 : 1));
    if (p.ohat[s] === 'x') this.hat(t, 0.22, p.hatVol * 1.3);
    if (p.bassSteps[s] === 'x') {
      let n = p.bass[bar];
      if (p.octaveBass && s % 4 === 2) n += 12;
      this.bass(t, n, p.bassWave, spb * (state.mood === 'lounge' ? 1.2 : 0.22));
    }
    if (p.stab[s] === 'x') {
      const ch = p.chords[bar];
      if (p.arp) this.pluck(t, ch[(s * 3 + bar) % ch.length] + (s % 8 === 7 ? 12 : 0) + 12);
      else this.chord(t, ch, p.voice, p.chordLen * (state.mood === 'dansant' ? 1 : spb));
    }
    if (state.mood === 'moderne' && s === 0) this.chord(t, p.chords[bar], 'pad', spb * 4);
  }

  env(g, t, a, peak, d, sustain = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
  }

  kick(t, vol = 1) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    this.env(g, t, 0.003, 0.95 * vol, 0.38);
    o.connect(g); g.connect(this.comp); o.start(t); o.stop(t + 0.45);
  }

  pump(t, spb) {
    const g = this.music.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(0.35, t); g.linearRampToValueAtTime(1, t + spb * 0.8);
  }

  noiseHit(t, dur, type, freq, q, vol, toVerb = false) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    this.env(g, t, 0.002, vol, dur);
    src.connect(f); f.connect(g); g.connect(this.music); if (toVerb) g.connect(this.verbIn);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  hat(t, dur, vol) { this.noiseHit(t, dur, 'highpass', 7800, 0.7, vol); }
  clap(t) { [0, 0.012, 0.024].forEach((d, i) => this.noiseHit(t + d, i === 2 ? 0.2 : 0.03, 'bandpass', 1500, 1.1, 0.32, i === 2)); }
  rim(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = 1700; this.env(g, t, 0.001, 0.12, 0.05);
    o.connect(g); g.connect(this.music); g.connect(this.verbIn); o.start(t); o.stop(t + 0.08);
  }

  bass(t, note, wave, dur) {
    const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = wave; o.frequency.value = N(note);
    f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(wave === 'sine' ? 900 : 1400, t); f.frequency.exponentialRampToValueAtTime(wave === 'sine' ? 300 : 220, t + dur);
    this.env(g, t, 0.006, wave === 'sine' ? 0.5 : 0.32, dur);
    o.connect(f); f.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.1);
  }

  chord(t, notes, voice, dur) {
    const c = this.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass';
    const conf = {
      keys:    { wave: 'triangle', a: 0.01, peak: 0.07, cut: 2400, det: 4 },
      stab:    { wave: 'sawtooth', a: 0.004, peak: 0.07, cut: 2600, det: 9 },
      strings: { wave: 'sawtooth', a: 0.25, peak: 0.045, cut: 3200, det: 14 },
      pad:     { wave: 'sawtooth', a: 0.4, peak: 0.03, cut: 1300, det: 12 },
    }[voice] || { wave: 'triangle', a: 0.01, peak: 0.06, cut: 2000, det: 5 };
    f.frequency.setValueAtTime(conf.cut, t);
    if (voice === 'stab') f.frequency.exponentialRampToValueAtTime(700, t + dur);
    this.env(g, t, conf.a, conf.peak, Math.max(0.08, dur));
    f.connect(g); g.connect(this.music); g.connect(this.verbIn);
    notes.forEach((n, i) => {
      [-1, 1].forEach((side) => {
        const o = c.createOscillator(); o.type = conf.wave; o.frequency.value = N(n); o.detune.value = side * conf.det + i;
        o.connect(f); o.start(t); o.stop(t + conf.a + dur + 0.2);
      });
    });
    if (voice === 'keys') {
      const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = 5; tg.gain.value = 0.02;
      trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + dur + 0.3);
    }
  }

  pluck(t, note) {
    const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'square'; o.frequency.value = N(note);
    f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.12);
    this.env(g, t, 0.003, 0.045, 0.14);
    o.connect(f); f.connect(g); g.connect(this.music); g.connect(this.verbIn); o.start(t); o.stop(t + 0.2);
  }

  buzz() {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(220, t); o.frequency.linearRampToValueAtTime(180, t + 0.35);
    this.env(g, t, 0.005, 0.09, 0.4); o.connect(g); g.connect(this.comp); o.start(t); o.stop(t + 0.45);
  }

  // Niveau mesuré (0 → 1), pondéré vers les basses
  measure() {
    if (!this.on || !this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.freq);
    let low = 0; for (let i = 1; i < 10; i++) low += this.freq[i];
    let mid = 0; for (let i = 10; i < 60; i++) mid += this.freq[i];
    return Math.min(1, (low / 9 / 255) * 0.75 + (mid / 50 / 255) * 0.5);
  }

  bands(n = 4) {
    if (!this.on || !this.analyser) return null;
    const out = []; const per = Math.floor(80 / n);
    for (let b = 0; b < n; b++) { let s = 0; for (let i = 1 + b * per; i < 1 + (b + 1) * per; i++) s += this.freq[i]; out.push(s / per / 255); }
    return out;
  }
}

export const audio = new DemoAudio();
