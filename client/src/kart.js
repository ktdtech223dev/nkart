/**
 * kart.js — Kart class: physics, controls, drift, boost
 * Arcade physics — fun over realism.
 */

const SPEED_MULTIPLIERS = { '100cc': 0.7, '150cc': 1.0, '200cc': 1.4 };

class Kart {
  constructor(carDef, color, speedClass = '150cc') {
    this.carDef = carDef;
    this.color = color || carDef.defaultColor;
    this.speedClass = speedClass;
    this.speedMult = SPEED_MULTIPLIERS[speedClass] || 1.0;

    // Build visual model
    this.mesh = carDef.build(this.color);
    this.mesh.scale.set(0.5, 0.5, 0.5); // Scale karts to reasonable race size

    // Physics state
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = 0; // Y axis rotation in radians
    this.speed = 0;
    this.velocity = new THREE.Vector3();
    this.angularVelocity = 0;
    this.onGround = true;
    this.airTime = 0;
    this.verticalSpeed = 0;

    // Car stats
    this.maxSpeed = carDef.maxSpeed * this.speedMult;
    this.acceleration = carDef.acceleration * this.speedMult;
    this.turnRate = carDef.turnRate;
    this.driftFactor = carDef.driftFactor;
    this.mass = carDef.mass;

    // Drift state
    this.isDrifting = false;
    this.driftDirection = 0; // -1 left, 1 right
    this.driftMeter = 0;
    this.driftTier = 0; // 0=none, 1=mini(blue), 2=medium(orange), 3=super(purple)
    this.driftAngle = 0;

    // Boost state
    this.boostTimer = 0;
    this.boostStrength = 0;
    this.slipstreamTimer = 0;

    // Item state
    this.currentItem = null;
    this.itemCount = 0;
    this.shielded = false;
    this.starred = false;
    this.starTimer = 0;
    this.frozen = false;
    this.frozenTimer = 0;
    this.shrunk = false;
    this.shrunkTimer = 0;
    this.spinOutTimer = 0;

    // Race state
    this.lap = 0;
    this.checkpoint = 0;
    this.position_rank = 1;
    this.finished = false;
    this.totalTime = 0;
    this.bestLap = Infinity;
    this.currentLapTime = 0;
    this.raceProgress = 0; // 0-1 normalized progress along track

    // Stats tracking
    this.itemsUsed = 0;
    this.hitsLanded = 0;
    this.timesHit = 0;

    // Rocket start state
    this.rocketStartHeld = false;
    this.rocketStartTime = 0;
  }

  update(dt, steer, throttle, brake, trackData) {
    if (this.finished) return;

    // Frozen — can't move
    if (this.frozen) {
      this.frozenTimer -= dt;
      if (this.frozenTimer <= 0) {
        this.frozen = false;
        this.mesh.material && (this.mesh.visible = true);
      }
      this.speed *= 0.95;
      this._updateMesh();
      return;
    }

    // Spin out
    if (this.spinOutTimer > 0) {
      this.spinOutTimer -= dt;
      this.rotation += 8 * dt;
      this.speed *= 0.96;
      this._updateMesh();
      return;
    }

    // Shrunk debuff
    if (this.shrunk) {
      this.shrunkTimer -= dt;
      if (this.shrunkTimer <= 0) {
        this.shrunk = false;
        this.mesh.scale.set(0.5, 0.5, 0.5);
      }
    }

    // Star timer
    if (this.starred) {
      this.starTimer -= dt;
      if (this.starTimer <= 0) {
        this.starred = false;
        this.boostStrength = 0;
      }
    }

    const effectiveMaxSpeed = this.starred ? this.maxSpeed * 1.3 :
      (this.shrunk ? this.maxSpeed * 0.6 : this.maxSpeed);

    // Acceleration / braking
    if (throttle > 0 && !brake) {
      const accelCurve = 1 - (this.speed / effectiveMaxSpeed) * 0.7;
      this.speed += this.acceleration * throttle * accelCurve * dt;
    }
    if (brake > 0 && !this.isDrifting) {
      if (this.speed > 0) {
        this.speed -= this.acceleration * 1.5 * brake * dt;
        if (this.speed < 0) this.speed = 0;
      } else {
        // Reverse
        this.speed -= this.acceleration * 0.3 * brake * dt;
      }
    }

    // Natural deceleration (friction)
    if (throttle === 0 && !brake) {
      this.speed *= (1 - 1.2 * dt);
    }

    // Boost
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      this.speed = Math.max(this.speed, effectiveMaxSpeed * (1 + this.boostStrength * 0.3));
    }

    // Speed cap
    this.speed = Math.max(-effectiveMaxSpeed * 0.3, Math.min(this.speed, effectiveMaxSpeed * 1.4));

    // Steering
    const speedFactor = Math.min(1, Math.abs(this.speed) / 30);
    const steerAmount = steer * this.turnRate * speedFactor * dt;

    // Drift handling
    if (this.isDrifting) {
      this._updateDrift(dt, steer, brake);
    } else if (brake > 0.5 && Math.abs(steer) > 0.3 && Math.abs(this.speed) > 15) {
      // Initiate drift
      this.isDrifting = true;
      this.driftDirection = steer > 0 ? 1 : -1;
      this.driftMeter = 0;
      this.driftTier = 0;
      this.driftAngle = 0;
    }

    if (!this.isDrifting) {
      this.rotation -= steerAmount;
    }

    // Apply velocity
    const forward = new THREE.Vector3(
      -Math.sin(this.rotation),
      0,
      -Math.cos(this.rotation)
    );

    this.velocity.copy(forward).multiplyScalar(this.speed * dt);
    this.position.add(this.velocity);

    // Gravity / ground
    if (trackData) {
      const groundY = this._getGroundHeight(trackData);
      if (this.position.y > groundY + 0.1) {
        this.onGround = false;
        this.verticalSpeed -= 30 * dt; // gravity
        this.airTime += dt;
      } else {
        if (!this.onGround && this.airTime > 0.3) {
          // Landing — could apply trick boost here
        }
        this.onGround = true;
        this.airTime = 0;
        this.verticalSpeed = 0;
        this.position.y = groundY;
      }
      this.position.y += this.verticalSpeed * dt;
    }

    // Track timer
    this.totalTime += dt;
    this.currentLapTime += dt;

    // Update visual
    this._updateMesh();
    this._updateWheels(dt);
    this._updateBrakeLights(brake > 0.1);
  }

  _updateDrift(dt, steer, brake) {
    // Drift angle builds
    this.driftAngle += this.driftDirection * 2.5 * dt;
    this.driftAngle = Math.max(-0.6, Math.min(0.6, this.driftAngle));

    // Steer offset during drift (counter-steer lets you control it)
    const driftSteer = this.driftDirection * this.turnRate * 0.7 * dt;
    const counterSteer = steer * this.turnRate * 0.4 * dt;
    this.rotation -= driftSteer + counterSteer;

    // Speed reduction during drift
    this.speed *= (1 - 0.3 * dt);

    // Drift meter fills
    this.driftMeter += dt * this.driftFactor;

    // Tier check
    if (this.driftMeter >= 2.5 && this.driftTier < 3) {
      this.driftTier = 3; // purple
    } else if (this.driftMeter >= 1.5 && this.driftTier < 2) {
      this.driftTier = 2; // orange
    } else if (this.driftMeter >= 0.5 && this.driftTier < 1) {
      this.driftTier = 1; // blue
    }

    // Release drift
    if (brake < 0.3) {
      this.isDrifting = false;
      // Apply boost based on tier
      if (this.driftTier >= 1) {
        const boosts = [0, 0.4, 0.7, 1.0];
        const durations = [0, 0.5, 0.8, 1.2];
        this.boostStrength = boosts[this.driftTier];
        this.boostTimer = durations[this.driftTier];
        Input.rumble(0.2 * this.driftTier, 0.4 * this.driftTier, 150);
      }
      this.driftMeter = 0;
      this.driftTier = 0;
      this.driftAngle = 0;
    }
  }

  _getGroundHeight(trackData) {
    // Simple ground height from track — flat for now
    if (!trackData || !trackData.getHeight) return 0;
    return trackData.getHeight(this.position.x, this.position.z);
  }

  _updateMesh() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation + (this.isDrifting ? this.driftAngle : 0);
  }

  _updateWheels(dt) {
    if (!this.mesh._wheels) return;
    const spinSpeed = this.speed * dt * 2;
    for (const wheel of this.mesh._wheels) {
      wheel.rotation.x += spinSpeed;
    }
  }

  _updateBrakeLights(braking) {
    if (!this.mesh._tailLights || !this.mesh._tailMat) return;
    this.mesh._tailMat.emissiveIntensity = braking ? 1.0 : 0.3;
  }

  applyBoost(strength, duration) {
    this.boostStrength = Math.max(this.boostStrength, strength);
    this.boostTimer = Math.max(this.boostTimer, duration);
  }

  hitByItem() {
    if (this.starred) return; // Invincible
    if (this.shielded) { this.shielded = false; return; }
    this.spinOutTimer = 1.0;
    this.speed *= 0.3;
    this.timesHit++;
    Input.rumble(0.8, 1.0, 300);
  }

  freeze(duration) {
    if (this.starred) return;
    if (this.shielded) { this.shielded = false; return; }
    this.frozen = true;
    this.frozenTimer = duration;
    this.speed = 0;
  }

  shrink(duration) {
    if (this.starred) return;
    this.shrunk = true;
    this.shrunkTimer = duration;
    this.mesh.scale.set(0.3, 0.3, 0.3);
  }

  activateStar(duration) {
    this.starred = true;
    this.starTimer = duration;
    this.boostStrength = 0.5;
    this.boostTimer = duration;
  }

  getDisplaySpeed() {
    return Math.abs(Math.round(this.speed * 3.6)); // convert to "kph" display
  }

  reset(position, rotation) {
    this.position.copy(position);
    this.rotation = rotation;
    this.speed = 0;
    this.velocity.set(0, 0, 0);
    this.verticalSpeed = 0;
    this.isDrifting = false;
    this.driftMeter = 0;
    this.driftTier = 0;
    this.boostTimer = 0;
    this.spinOutTimer = 0;
    this.frozen = false;
    this.shrunk = false;
    this.starred = false;
    this.mesh.scale.set(0.5, 0.5, 0.5);
  }
}
