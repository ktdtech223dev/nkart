/**
 * race.js — Race manager: laps, positions, timers, countdown, results
 */

const RACE_POINTS = [10, 7, 5, 4, 3, 2, 1, 0];

class RaceManager {
  constructor(config) {
    this.trackDef = config.trackDef;
    this.laps = config.laps || 3;
    this.speedClass = config.speedClass || '150cc';
    this.itemPreset = config.itemPreset || 'Normal';
    this.botCount = config.botCount !== undefined ? config.botCount : 7;
    this.botDifficulty = config.botDifficulty || 'Medium';
    this.mirror = config.mirror || false;
    this.night = config.night || false;

    this.track = null;
    this.playerKart = null;
    this.karts = [];
    this.bots = [];
    this.itemSystem = null;
    this.particleSystem = null;

    this.state = 'loading'; // loading, countdown, racing, finished
    this.countdownTimer = 4;
    this.raceTime = 0;
    this.finished = false;
    this.results = null;

    this.onCountdownTick = null;
    this.onRaceStart = null;
    this.onLapComplete = null;
    this.onRaceFinish = null;
    this.onPositionChange = null;
  }

  init(scene, playerCarDef, playerColor, profileId) {
    // Build track
    this.track = new Track(this.trackDef);
    const trackGroup = this.track.build();
    if (this.mirror) trackGroup.scale.x = -1;
    scene.add(trackGroup);

    // Player kart
    this.playerKart = new Kart(playerCarDef, playerColor, this.speedClass);
    scene.add(this.playerKart.mesh);
    this.karts.push(this.playerKart);

    // Bots
    const botCars = ALL_CARS.filter(c => c.id !== playerCarDef.id);
    this.bots = createBots(this.botCount, this.botDifficulty, this.track, botCars, this.speedClass);
    for (const bot of this.bots) {
      scene.add(bot.kart.mesh);
      this.karts.push(bot.kart);
    }

    // Place karts at spawn points
    const spawns = this.track.spawnPoints;
    for (let i = 0; i < this.karts.length && i < spawns.length; i++) {
      const sp = spawns[i];
      this.karts[i].position.set(sp[0], sp[1] || 0, sp[2] || 0);
      // Face forward along track
      if (this.track.trackPath) {
        const tangent = this.track.trackPath.getTangentAt(0);
        this.karts[i].rotation = Math.atan2(-tangent.x, -tangent.z);
      }
      this.karts[i]._updateMesh();
    }

    // Items
    this.itemSystem = new ItemSystem(scene, this.itemPreset);
    this.itemSystem.spawnItemBoxes(this.track.itemBoxPositions);

    // Particles
    this.particleSystem = new ParticleSystem(scene);

    this.state = 'countdown';
    this.countdownTimer = 4;
  }

  update(dt) {
    if (this.state === 'countdown') {
      this._updateCountdown(dt);
      return;
    }

    if (this.state !== 'racing') return;

    this.raceTime += dt;

    // Player input
    const steer = Input.getSteer(this.playerKart.speed);
    const throttle = Input.getThrottle();
    const brake = Input.getBrake();

    // Update player kart
    this.playerKart.update(dt, steer, throttle, brake, this.track);

    // Terrain penalty
    const terrainMult = this.track.getTerrainMultiplier(this.playerKart.position);
    if (terrainMult < 1) {
      this.playerKart.speed *= (1 - (1 - terrainMult) * dt * 3);
    }

    // Boost pads
    const boost = this.track.checkBoostPad(this.playerKart.position);
    if (boost) this.playerKart.applyBoost(boost.strength, boost.duration);

    // Player item use
    if (Input.itemPressed && this.playerKart.currentItem) {
      this.itemSystem.useItem(this.playerKart, this.karts, 1);
    }

    // Update bots
    for (const bot of this.bots) {
      bot.update(dt, this.karts, this.raceTime);
      const botBoost = this.track.checkBoostPad(bot.kart.position);
      if (botBoost) bot.kart.applyBoost(botBoost.strength, botBoost.duration);
    }

    // Update items
    this.itemSystem.update(dt, this.karts, this.raceTime);

    // Update particles
    this.particleSystem.update(dt);

    // Drift particles
    if (this.playerKart.isDrifting && this.playerKart.driftTier > 0) {
      this.particleSystem.emitDriftSparks(this.playerKart);
    }
    if (this.playerKart.boostTimer > 0) {
      this.particleSystem.emitBoostExhaust(this.playerKart);
    }

    // Lap / checkpoint tracking
    this._updateCheckpoints();
    this._updatePositions();

    // Check race finish
    if (this.playerKart.finished && !this.finished) {
      this._finishRace();
    }
  }

  _updateCountdown(dt) {
    const prevSec = Math.ceil(this.countdownTimer);
    this.countdownTimer -= dt;
    const currSec = Math.ceil(this.countdownTimer);

    if (currSec !== prevSec && currSec > 0 && this.onCountdownTick) {
      this.onCountdownTick(currSec);
    }

    if (this.countdownTimer <= 0) {
      this.state = 'racing';
      if (this.onRaceStart) this.onRaceStart();

      // Rocket start check
      if (this.playerKart.rocketStartHeld) {
        const holdTime = this.playerKart.rocketStartTime;
        if (holdTime >= 0.5 && holdTime <= 1.5) {
          this.playerKart.applyBoost(0.8, 1.5);
        } else if (holdTime > 1.5) {
          this.playerKart.spinOutTimer = 1.0;
        }
      }
    }
  }

  _updateCheckpoints() {
    for (const kart of this.karts) {
      if (kart.finished) continue;

      const cpIdx = this.track.checkCheckpoint(kart.position, kart.checkpoint);
      if (cpIdx >= 0) {
        // Check if this is the next expected checkpoint
        const expected = kart.checkpoint;
        if (cpIdx === expected || cpIdx === (expected + 1) % this.track.checkpoints.length) {
          kart.checkpoint = (cpIdx + 1) % this.track.checkpoints.length;

          // Lap completion check (crossed start after all checkpoints)
          if (kart.checkpoint === 0 && cpIdx === this.track.checkpoints.length - 1) {
            kart.lap++;
            if (kart.currentLapTime < kart.bestLap) {
              kart.bestLap = kart.currentLapTime;
            }
            kart.currentLapTime = 0;

            if (kart === this.playerKart && this.onLapComplete) {
              this.onLapComplete(kart.lap, this.laps);
            }

            if (kart.lap >= this.laps) {
              kart.finished = true;
            }
          }
        }
      }

      // Update race progress
      kart.raceProgress = this.track.getProgress(kart.position) + kart.lap;
    }
  }

  _updatePositions() {
    // Sort by progress (higher = further ahead)
    const sorted = [...this.karts].sort((a, b) => b.raceProgress - a.raceProgress);
    for (let i = 0; i < sorted.length; i++) {
      const prevRank = sorted[i].position_rank;
      sorted[i].position_rank = i + 1;
      if (sorted[i] === this.playerKart && prevRank !== i + 1 && this.onPositionChange) {
        this.onPositionChange(i + 1, prevRank);
      }
    }
  }

  _finishRace() {
    this.finished = true;
    this.state = 'finished';

    // Auto-finish remaining karts
    const sorted = [...this.karts].sort((a, b) => b.raceProgress - a.raceProgress);
    const results = sorted.map((kart, idx) => ({
      kart,
      position: idx + 1,
      time: kart.totalTime,
      bestLap: kart.bestLap === Infinity ? kart.totalTime : kart.bestLap,
      points: RACE_POINTS[idx] || 0,
      isPlayer: kart === this.playerKart,
      itemsUsed: kart.itemsUsed,
    }));

    this.results = results;
    if (this.onRaceFinish) this.onRaceFinish(results);
  }

  getPlayerPosition() {
    return this.playerKart ? this.playerKart.position_rank : 1;
  }

  getPlayerLap() {
    return this.playerKart ? Math.min(this.playerKart.lap + 1, this.laps) : 1;
  }

  cleanup(scene) {
    if (this.track) scene.remove(this.track.group);
    for (const kart of this.karts) scene.remove(kart.mesh);
    if (this.itemSystem) this.itemSystem.cleanup();
    if (this.particleSystem) this.particleSystem.cleanup();
    this.karts = [];
    this.bots = [];
  }
}
