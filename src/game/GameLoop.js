import * as THREE from 'three';
import { InputManager } from '../input/InputManager.js';
import { KartPhysics } from '../physics/KartPhysics.js';
import { CameraController } from './CameraController.js';
import { TrackLoader } from '../track/TrackLoader.js';
import { CheckpointSystem } from '../track/CheckpointSystem.js';
import { AvatarRenderer } from '../avatar/AvatarRenderer.js';
import { KartRenderer } from '../avatar/KartRenderer.js';
import { ItemBoxManager } from '../items/ItemBoxManager.js';
import { ItemRenderer } from '../items/ItemRenderer.js';
import { AudioManager } from '../audio/AudioManager.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { HazardManager } from '../track/HazardManager.js';
import { ParticleManager } from '../game/ParticleManager.js';
import { PostProcessingPipeline } from '../game/PostProcessing.js';
import { PerformanceMonitor } from '../game/PerformanceMonitor.js';
import { ForceFeedback } from '../input/ForceFeedback.js';
import { PHYSICS } from '../constants/physics.js';
import { BotWaypointAI } from '../ai/BotWaypointAI.js';

const PHYSICS_TIMESTEP = 1 / 60;
const MAX_PHYSICS_STEPS = 5;

export class GameLoop {
  constructor(canvas) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 60, 200);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 12);

    // Systems
    this.input = new InputManager();
    this.physics = new KartPhysics();
    this.cameraController = new CameraController(this.camera);
    this.trackLoader = new TrackLoader();
    this.checkpoints = new CheckpointSystem();
    this.avatarRenderer = new AvatarRenderer();
    this.kartRenderer = new KartRenderer();
    this.itemBoxManager = new ItemBoxManager();
    this.itemRenderer = new ItemRenderer(this.scene);
    this.audio = new AudioManager();
    this.network = new NetworkManager();
    this.hazardManager = new HazardManager();
    this.particles = new ParticleManager(this.scene);
    this.postProcessing = null;
    this.perfMonitor = new PerformanceMonitor();
    this.forceFeedback = new ForceFeedback();

    // State
    this.remoteKarts = new Map();
    this.localKartState = null;
    this.localKartGroup = null;
    this.localAvatar = null;
    this.currentTrack = null;

    // Bot kart state
    this.botKarts = [];   // [{ state, group, avatar, ai }]

    this.raceState = {
      started: false,
      finished: false,
      lap: 0,
      position: 1,
      itemHeld: null,
      countdown: 3,
    };

    // Loop state
    this._running = false;
    this._lastTime = 0;
    this._accumulator = 0;
    this._rafId = null;
    this._useTimeout = false;

    // Resize
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  async loadTrack(trackId) {
    const trackDef = await this.trackLoader.load(trackId, this.scene);
    this.currentTrack = trackDef;

    // Apply per-track sky and fog
    if (trackDef.skyConfig) {
      const sky = trackDef.skyConfig;
      const fogColor = new THREE.Color(sky.fogColor ?? sky.bottomColor ?? 0x87ceeb);
      this.scene.background = new THREE.Color(sky.topColor ?? 0x87ceeb);
      this.scene.fog = new THREE.Fog(fogColor, 60, 200);
      if (sky.fogDensity && sky.fogDensity < 0.01) {
        // Wide open tracks — push fog further out
        this.scene.fog = new THREE.Fog(fogColor, 80, 300);
      }
    }

    this.checkpoints.init(trackDef.checkpoints, trackDef.lapCount);
    this.itemBoxManager.init(trackDef.itemBoxPositions, this.scene);
    this.hazardManager.init(trackDef.hazards, this.scene);

    const startPos = trackDef.startPositions[0];
    this.localKartGroup = this.kartRenderer.build(this.scene);
    this.localKartGroup.position.copy(startPos.position);
    this.localKartGroup.rotation.y = startPos.heading;

    this.localAvatar = this.avatarRenderer.build('volta');
    this.localAvatar.position.y = 0.3;
    this.localKartGroup.add(this.localAvatar);

    this.localKartState = this.physics.createKartState(startPos.position, startPos.heading);
    this.audio.init();

    // Initialize post-processing
    if (!this.postProcessing) {
      this.postProcessing = new PostProcessingPipeline(this.renderer, this.scene, this.camera);
    }

    // Collect all scene objects for outline pass (after a short delay so all geometry is built)
    setTimeout(() => {
      if (this.postProcessing) {
        this.postProcessing.collectSceneObjects();
      }
    }, 100);
  }

  /**
   * Add AI bot karts to the race.
   * @param {number} count - number of bots (1-7)
   * @param {string} difficulty - 'easy' | 'medium' | 'hard' | 'expert'
   */
  addBots(count = 3, difficulty = 'medium') {
    if (!this.currentTrack || !this.currentTrack.waypointPath) return;
    const waypoints = this.currentTrack.waypointPath;
    const startPositions = this.currentTrack.startPositions;

    // Clear existing bots
    for (const bot of this.botKarts) {
      if (bot.group) this.scene.remove(bot.group);
    }
    this.botKarts = [];

    const botCount = Math.min(count, startPositions.length - 1);
    for (let i = 0; i < botCount; i++) {
      const startIdx   = i + 1; // slot 0 is player
      const startPos   = startPositions[startIdx] || startPositions[0];
      const kartGroup  = this.kartRenderer.build(this.scene);
      kartGroup.position.copy(startPos.position);
      kartGroup.rotation.y = startPos.heading;

      const avatar = this.avatarRenderer.build('volta');
      avatar.position.y = 0.3;
      kartGroup.add(avatar);

      const kartState = this.physics.createKartState(startPos.position, startPos.heading);
      const ai        = new BotWaypointAI(kartState, waypoints, difficulty);

      this.botKarts.push({ state: kartState, group: kartGroup, avatar, ai });
    }
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._accumulator = 0;
    this._useTimeout = false;

    // MessageChannel gives unthrottled callbacks even in hidden background tabs
    if (!this._msgChannel) {
      this._msgChannel = new MessageChannel();
      this._msgChannel.port1.onmessage = () => {
        if (this._running) this._loop(performance.now());
      };
    }

    this._scheduleFrame();
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      if (this._useTimeout) {
        clearTimeout(this._rafId);
      } else {
        cancelAnimationFrame(this._rafId);
      }
      this._rafId = null;
    }
  }

  _scheduleFrame() {
    // Use MessageChannel when tab is hidden — postMessage isn't throttled like setTimeout/RAF
    if (document.visibilityState === 'hidden') {
      this._useTimeout = true;
      this._rafId = 1; // sentinel so stop() knows we're running
      this._msgChannel.port2.postMessage(null);
    } else {
      this._useTimeout = false;
      this._rafId = requestAnimationFrame(this._loop.bind(this));
    }
  }

  _loop(timestamp) {
    if (!this._running) return;

    this.perfMonitor.beginFrame();

    const hidden = document.visibilityState === 'hidden';
    // In background tabs timers fire ~1/s; allow catching up to 2s of physics per call
    const dtMax = hidden ? 2.0 : 0.1;
    const maxSteps = hidden ? 120 : MAX_PHYSICS_STEPS;

    const dt = Math.min((timestamp - this._lastTime) / 1000, dtMax);
    this._lastTime = timestamp;
    this._accumulator += dt;

    let steps = 0;
    while (this._accumulator >= PHYSICS_TIMESTEP && steps < maxSteps) {
      this._physicsStep(PHYSICS_TIMESTEP);
      this._accumulator -= PHYSICS_TIMESTEP;
      steps++;
    }

    const alpha = this._accumulator / PHYSICS_TIMESTEP;
    this._render(alpha);

    this.perfMonitor.endFrame();

    // Adaptive quality: disable outline pass at low FPS to save GPU
    if (this.postProcessing) {
      const fps = this.perfMonitor.fps;
      if (fps < 30) {
        this.postProcessing.outlinePass.enabled = false;
      } else if (fps > 55) {
        this.postProcessing.outlinePass.enabled = true;
      }
    }

    this._scheduleFrame();
  }

  _physicsStep(dt) {
    const inputState = this.input.poll();
    this.network.applyQueuedUpdates(this.remoteKarts);

    if (this.localKartState) {
      this.physics.update(this.localKartState, inputState, dt, this.currentTrack);

      this.localKartGroup.position.copy(this.localKartState.position);
      this.localKartGroup.rotation.y = this.localKartState.rotation.y + Math.PI;
      this.kartRenderer.updateWheels(this.localKartGroup, this.localKartState.speed, inputState.steer, dt);

      this.checkpoints.update(this.localKartState);
      this.avatarRenderer.update(this.localAvatar, this.localKartState, inputState, dt);
      this.cameraController.update(this.localKartState, inputState, dt);
      this.network.sendInput(inputState);

      // Boost visual effect
      const isBoosting = this.localKartState.boostTimer > 0;
      this.kartRenderer.setBoostEffect(this.localKartGroup, isBoosting);

      // Speed blur post-processing
      if (this.postProcessing) {
        this.postProcessing.setSpeedIntensity(this.localKartState.speed / PHYSICS.MAX_SPEED);
        this.postProcessing.setBoostMode(isBoosting);
      }

      this.audio.updateEngine(this.localKartState.speed / PHYSICS.MAX_SPEED);
      this.audio.updateSurface(this.localKartState.surfaceType);
      this.itemBoxManager.update(this.localKartState.position, dt);

      // Drift particles
      if (this.localKartState.driftState !== 'none' && this.localKartState.speed > 5) {
        this.particles.spawnDriftSmoke(this.localKartState.position, this.localKartState.driftState);
      }

      const activeHazards = this.hazardManager.getActiveHazardsAt(this.localKartState.position, 3);
      for (const hazard of activeHazards) {
        this._applyHazardEffect(hazard, this.localKartState, dt);
      }
      this.forceFeedback.updateFromKartState(this.localKartState);
    }

    // ── Bot karts ────────────────────────────────────────────────────────────
    if (this.botKarts.length > 0) {
      const allKartStates = [this.localKartState, ...this.botKarts.map(b => b.state)].filter(Boolean);
      for (const bot of this.botKarts) {
        bot.state.prevPosition.copy(bot.state.position);
        const botInput = bot.ai.update(dt, this.physics, this.currentTrack, allKartStates);
        this.physics.update(bot.state, botInput, dt, this.currentTrack);
        this.checkpoints.update(bot.state);
        bot.group.position.copy(bot.state.position);
        bot.group.rotation.y = bot.state.rotation.y + Math.PI;
        this.kartRenderer.updateWheels(bot.group, bot.state.speed, botInput.steer, dt);
        this.avatarRenderer.update(bot.avatar, bot.state, botInput, dt);
        if (bot.state.driftState !== 'none' && bot.state.speed > 5) {
          this.particles.spawnDriftSmoke(bot.state.position, bot.state.driftState);
        }
      }
    }

    this.hazardManager.update(dt);
    this.itemRenderer.update(dt);
    this.particles.update(dt);
  }

  _render(alpha) {
    // Interpolate local kart position for smooth rendering
    if (this.localKartState && this.localKartGroup) {
      const prevPosition = this.localKartState.prevPosition;
      if (prevPosition) {
        const lerpedPos = new THREE.Vector3().lerpVectors(prevPosition, this.localKartState.position, alpha);
        this.localKartGroup.position.copy(lerpedPos);
      }
    }

    // Interpolate bot karts
    for (const bot of this.botKarts) {
      if (bot.group && bot.state.prevPosition && bot.state.position) {
        const lerpedPos = new THREE.Vector3().lerpVectors(bot.state.prevPosition, bot.state.position, alpha);
        bot.group.position.copy(lerpedPos);
      }
    }

    // Interpolate remote karts
    for (const [id, kartData] of this.remoteKarts) {
      if (kartData.group && kartData.prevPosition && kartData.position) {
        const lerpedPos = new THREE.Vector3().lerpVectors(kartData.prevPosition, kartData.position, alpha);
        kartData.group.position.copy(lerpedPos);
      }
    }

    if (this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  _applyHazardEffect(hazard, kartState, dt) {
    if (kartState.isStunned) return;

    switch (hazard.type) {
      case 'fan_push': {
        const pushDir = new THREE.Vector3().copy(hazard.direction).normalize();
        kartState.velocity.addScaledVector(pushDir, hazard.force * dt);
        break;
      }
      case 'rolling_pencil': {
        this.physics.applyStun(kartState, 0.5);
        kartState.velocity.multiplyScalar(0.3);
        break;
      }
      case 'cannon_fire': {
        this.physics.applyStun(kartState, 0.8);
        const cannonDir = new THREE.Vector3().subVectors(kartState.position, hazard.position).normalize();
        kartState.velocity.addScaledVector(cannonDir, hazard.knockback);
        break;
      }
      case 'wave_surge': {
        kartState.velocity.y += hazard.upforce * dt;
        kartState.velocity.x *= 1 - hazard.drag * dt;
        kartState.velocity.z *= 1 - hazard.drag * dt;
        break;
      }
      case 'lightning_ordeal': {
        this.physics.applyStun(kartState, hazard.stunDuration || 1.5);
        kartState.speed *= 0.1;
        break;
      }
      case 'crystal_resonance': {
        const resonanceDir = new THREE.Vector3().subVectors(hazard.position, kartState.position).normalize();
        kartState.velocity.addScaledVector(resonanceDir, hazard.pullForce * dt);
        break;
      }
      case 'blizzard': {
        kartState.speed = Math.max(kartState.speed - hazard.slowAmount * dt, 0);
        kartState.handling = (kartState.handling || 1) * (1 - hazard.slipFactor * dt);
        break;
      }
      case 'geyser': {
        kartState.velocity.y += hazard.upforce;
        this.physics.applyStun(kartState, 0.4);
        break;
      }
      case 'pinball_bumper': {
        const bounceDir = new THREE.Vector3().subVectors(kartState.position, hazard.position).normalize();
        kartState.velocity.addScaledVector(bounceDir, hazard.bounceForce);
        this.physics.applyStun(kartState, 0.2);
        break;
      }
      case 'geometry_glitch': {
        // Random velocity perturbation
        kartState.velocity.x += (Math.random() - 0.5) * hazard.glitchStrength;
        kartState.velocity.z += (Math.random() - 0.5) * hazard.glitchStrength;
        break;
      }
      case 'crane_rotate': {
        const craneDir = new THREE.Vector3().subVectors(kartState.position, hazard.pivotPoint).normalize();
        const tangent = new THREE.Vector3(-craneDir.z, 0, craneDir.x);
        kartState.velocity.addScaledVector(tangent, hazard.rotationForce * dt);
        break;
      }
      case 'ghost_ambush': {
        this.physics.applyStun(kartState, hazard.stunDuration || 1.0);
        kartState.speed *= 0.5;
        break;
      }
      case 'asteroid_gravity': {
        const gravDir = new THREE.Vector3().subVectors(hazard.position, kartState.position).normalize();
        kartState.velocity.addScaledVector(gravDir, hazard.gravityStrength * dt);
        break;
      }
      case 'traffic_light': {
        if (hazard.isRed) {
          kartState.speed = Math.max(kartState.speed - 30 * dt, 0);
        }
        break;
      }
      default:
        break;
    }
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.postProcessing) {
      this.postProcessing.resize(width, height);
    }
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    // Remove bot karts from scene
    for (const bot of this.botKarts) {
      if (bot.group) this.scene.remove(bot.group);
    }
    this.botKarts = [];
    this.input.dispose();
    this.audio.dispose();
    this.network.dispose();
    this.particles.dispose();
    if (this.postProcessing) this.postProcessing.dispose();
    this.renderer.dispose();
  }
}
