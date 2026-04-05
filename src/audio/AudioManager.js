import { Howl, Howler } from 'howler';

export class AudioManager {
  constructor() {
    this.initialized = false;
    this.sounds = {};
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.masterVolume = 1.0;
    this.currentMusic = null;
    this.engineLoop = null;
    this.driftLoop = null;
    this.surfaceLoop = null;
    this.muted = true; // Start muted since no audio files exist yet
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Mute globally since no audio assets exist yet
    Howler.mute(true);

    // Architecture is complete — audio files needed:
    // music/menu.mp3, music/track_dorm_01.mp3, etc.
    // sfx/engine_loop.mp3, sfx/drift_loop.mp3
    // sfx/boost_1.mp3, sfx/boost_2.mp3, sfx/boost_3.mp3
    // sfx/shell_fire.mp3, sfx/shell_hit.mp3, sfx/item_get.mp3
    // sfx/countdown_beep.mp3, sfx/countdown_go.mp3
    // sfx/wall_hit.mp3, sfx/banana_spin.mp3
    // sfx/star_jingle.mp3, sfx/lightning.mp3
    // sfx/lap_chime.mp3, sfx/final_lap.mp3, sfx/finish.mp3
    // sfx/wrong_way.mp3, sfx/position_up.mp3, sfx/unlock.mp3
    // ambient/city.mp3, ambient/ocean.mp3, ambient/wind.mp3, etc.

    this._createPlaceholderSounds();
  }

  _createPlaceholderSounds() {
    // Create silent placeholder Howl objects for the full API
    // These will be replaced with real audio files later
    const categories = [
      'engine_loop', 'drift_loop', 'surface_loop',
      'boost_1', 'boost_2', 'boost_3',
      'shell_fire', 'shell_hit', 'item_get',
      'countdown_beep', 'countdown_go',
      'wall_hit', 'banana_spin', 'star_jingle', 'lightning',
      'lap_chime', 'final_lap', 'finish',
      'wrong_way', 'position_up', 'unlock',
      'menu_hover', 'menu_select',
    ];

    // We don't create actual Howl objects without files to avoid errors
    for (const name of categories) {
      this.sounds[name] = null;
    }
  }

  playMusic(trackId) {
    if (this.currentMusic) {
      this.currentMusic.fade(this.musicVolume, 0, 1500);
      setTimeout(() => {
        if (this.currentMusic) this.currentMusic.stop();
      }, 1500);
    }
    // Would load and play: `music/${trackId}.mp3`
    this.currentMusic = null;
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  playSFX(name) {
    if (this.sounds[name]) {
      this.sounds[name].play();
    }
  }

  updateEngine(speedRatio) {
    // Pitch shift engine loop based on speed
    if (this.engineLoop) {
      const pitch = 0.6 + speedRatio * 0.8;
      this.engineLoop.rate(pitch);
    }
  }

  updateSurface(surfaceType) {
    // Switch surface rolling sound
  }

  startDriftSound() {
    if (this.driftLoop && !this.driftLoop.playing()) {
      this.driftLoop.play();
    }
  }

  stopDriftSound() {
    if (this.driftLoop) {
      this.driftLoop.stop();
    }
  }

  setVolume(category, value) {
    switch (category) {
      case 'master': this.masterVolume = value; Howler.volume(value); break;
      case 'music': this.musicVolume = value; break;
      case 'sfx': this.sfxVolume = value; break;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    Howler.mute(this.muted);
  }

  destroy() {
    Howler.unload();
    this.initialized = false;
  }
}
