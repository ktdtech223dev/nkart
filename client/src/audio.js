/**
 * audio.js — Howler.js based audio + Web Audio engine synth
 * All sounds procedurally generated for now.
 */

const Audio = {
  _ctx: null,
  _engineOsc: null,
  _engineGain: null,
  _masterGain: null,
  _volumes: { master: 0.7, engine: 0.5, items: 0.7, ui: 0.8 },
  _initialized: false,

  init() {
    // Load saved volumes
    try {
      const saved = localStorage.getItem('nkart_audio');
      if (saved) Object.assign(this._volumes, JSON.parse(saved));
    } catch (e) { /* ignore */ }
  },

  _ensureContext() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = this._volumes.master;
    this._masterGain.connect(this._ctx.destination);
    this._initialized = true;
  },

  /**
   * Start engine sound (oscillator-based hum)
   */
  startEngine(baseFreq = 80) {
    this._ensureContext();
    if (this._engineOsc) this.stopEngine();

    this._engineOsc = this._ctx.createOscillator();
    this._engineOsc.type = 'sawtooth';
    this._engineOsc.frequency.value = baseFreq;

    this._engineGain = this._ctx.createGain();
    this._engineGain.gain.value = 0.05 * this._volumes.engine;

    // Add some filter for warmth
    const filter = this._ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 2;

    this._engineOsc.connect(filter);
    filter.connect(this._engineGain);
    this._engineGain.connect(this._masterGain);
    this._engineOsc.start();
    this._engineFilter = filter;
    this._engineBaseFreq = baseFreq;
  },

  /**
   * Update engine pitch based on speed
   */
  updateEngine(speed, maxSpeed) {
    if (!this._engineOsc) return;
    const ratio = Math.abs(speed) / maxSpeed;
    const freq = this._engineBaseFreq + ratio * 200;
    this._engineOsc.frequency.setTargetAtTime(freq, this._ctx.currentTime, 0.05);
    this._engineGain.gain.setTargetAtTime(
      (0.03 + ratio * 0.07) * this._volumes.engine,
      this._ctx.currentTime, 0.05
    );
    if (this._engineFilter) {
      this._engineFilter.frequency.setTargetAtTime(300 + ratio * 600, this._ctx.currentTime, 0.1);
    }
  },

  stopEngine() {
    if (this._engineOsc) {
      try { this._engineOsc.stop(); } catch (e) { /* ignore */ }
      this._engineOsc = null;
      this._engineGain = null;
    }
  },

  /**
   * Play a quick synth sound effect
   */
  playSound(type) {
    if (!this._initialized) this._ensureContext();

    const vol = this._volumes;
    switch (type) {
      case 'countdown_beep':
        this._playTone(440, 0.1, 0.15 * vol.ui, 'sine');
        break;
      case 'countdown_go':
        this._playTone(880, 0.2, 0.2 * vol.ui, 'sine');
        setTimeout(() => this._playTone(1100, 0.15, 0.15 * vol.ui, 'sine'), 100);
        break;
      case 'item_pickup':
        this._playTone(600, 0.05, 0.1 * vol.items, 'sine');
        setTimeout(() => this._playTone(800, 0.05, 0.1 * vol.items, 'sine'), 50);
        setTimeout(() => this._playTone(1000, 0.08, 0.12 * vol.items, 'sine'), 100);
        break;
      case 'item_use':
        this._playTone(300, 0.1, 0.15 * vol.items, 'square');
        break;
      case 'item_hit':
        this._playNoise(0.2, 0.2 * vol.items);
        this._playTone(150, 0.15, 0.15 * vol.items, 'sawtooth');
        break;
      case 'boost':
        this._playTone(200, 0.05, 0.1 * vol.items, 'sawtooth');
        this._playTone(400, 0.1, 0.08 * vol.items, 'sawtooth');
        break;
      case 'drift_tier':
        this._playTone(500, 0.05, 0.08 * vol.items, 'triangle');
        break;
      case 'lap_complete':
        this._playTone(523, 0.08, 0.12 * vol.ui, 'sine');
        setTimeout(() => this._playTone(659, 0.08, 0.12 * vol.ui, 'sine'), 80);
        setTimeout(() => this._playTone(784, 0.12, 0.15 * vol.ui, 'sine'), 160);
        break;
      case 'finish_win':
        [523, 659, 784, 1047].forEach((f, i) => {
          setTimeout(() => this._playTone(f, 0.15, 0.15 * vol.ui, 'sine'), i * 120);
        });
        break;
      case 'finish_lose':
        this._playTone(300, 0.2, 0.12 * vol.ui, 'sine');
        setTimeout(() => this._playTone(250, 0.3, 0.1 * vol.ui, 'sine'), 200);
        break;
    }
  },

  _playTone(freq, duration, volume, type = 'sine') {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.setTargetAtTime(0, this._ctx.currentTime + duration * 0.7, duration * 0.3);
    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  },

  _playNoise(duration, volume) {
    if (!this._ctx) return;
    const bufferSize = this._ctx.sampleRate * duration;
    const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this._ctx.createGain();
    gain.gain.value = volume;
    gain.gain.setTargetAtTime(0, this._ctx.currentTime + duration * 0.5, duration * 0.3);
    source.connect(gain);
    gain.connect(this._masterGain);
    source.start();
  },

  saveVolumes() {
    try {
      localStorage.setItem('nkart_audio', JSON.stringify(this._volumes));
    } catch (e) { /* ignore */ }
  },
};
