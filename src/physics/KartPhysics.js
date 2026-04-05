import * as THREE from 'three';
import { PHYSICS, SURFACE_FRICTION, KART_AABB } from '../constants/physics.js';

const _tempVec = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3(0, -1, 0);
const _raycaster = new THREE.Raycaster();

export class KartPhysics {
  constructor() {
    this._ray = new THREE.Raycaster();
  }

  createKartState(position, heading) {
    return {
      position: new THREE.Vector3(position.x, position.y, position.z),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(0, heading || 0, 0, 'YXZ'),
      angularVelocity: 0,
      speed: 0,
      prevPosition: new THREE.Vector3(position.x, position.y, position.z),
      driftState: 'none',
      driftCharge: 0,
      driftBoostLevel: 0,
      isGrounded: true,
      groundNormal: new THREE.Vector3(0, 1, 0),
      surfaceType: 'default',
      itemState: null,
      itemCount: 0,
      isStunned: false,
      stunTimer: 0,
      isBoosting: false,
      boostTimer: 0,
      boostMultiplier: 1,
      isInvincible: false,
      invincibleTimer: 0,
      isCorrupted: false,
      corruptedTimer: 0,
      isMini: false,
      miniTimer: 0,
      lapCount: 0,
      currentCheckpoint: 0,
      racePosition: 1,
      finishTime: null,
      respawnTimer: 0,
      offTrack: false,
      offTrackTimer: 0,
    };
  }

  update(state, input, dt, track) {
    state.prevPosition.copy(state.position);

    // Update timers
    this._updateTimers(state, dt);

    if (state.isStunned) return;
    if (state.respawnTimer > 0) {
      state.respawnTimer -= dt;
      return;
    }

    // Get effective input (corrupted inverts controls)
    const effectiveInput = this._getEffectiveInput(input, state);

    // Steering
    this._updateSteering(state, effectiveInput, dt);

    // Drift
    this._updateDrift(state, effectiveInput, dt);

    // Acceleration/braking
    this._updateSpeed(state, effectiveInput, dt);

    // Apply velocity
    this._applyMovement(state, dt);

    // Ground detection
    this._groundCheck(state, track, dt);

    // Wall collision
    this._wallCollision(state, track);

    // Boundary check
    this._boundaryCheck(state, track);
  }

  _updateTimers(state, dt) {
    if (state.isStunned) {
      state.stunTimer -= dt;
      if (state.stunTimer <= 0) {
        state.isStunned = false;
        state.stunTimer = 0;
      }
    }
    if (state.isBoosting) {
      state.boostTimer -= dt;
      if (state.boostTimer <= 0) {
        state.isBoosting = false;
        state.boostTimer = 0;
        state.boostMultiplier = 1;
      }
    }
    if (state.isInvincible) {
      state.invincibleTimer -= dt;
      if (state.invincibleTimer <= 0) {
        state.isInvincible = false;
        state.invincibleTimer = 0;
      }
    }
    if (state.isCorrupted) {
      state.corruptedTimer -= dt;
      if (state.corruptedTimer <= 0) {
        state.isCorrupted = false;
        state.corruptedTimer = 0;
      }
    }
    if (state.isMini) {
      state.miniTimer -= dt;
      if (state.miniTimer <= 0) {
        state.isMini = false;
        state.miniTimer = 0;
      }
    }
  }

  _getEffectiveInput(input, state) {
    if (state.isCorrupted) {
      return {
        ...input,
        steer: -input.steer,
        throttle: input.brake,
        brake: input.throttle,
      };
    }
    return input;
  }

  _updateSteering(state, input, dt) {
    const speedRatio = Math.min(1, state.speed / PHYSICS.MAX_SPEED);
    const turnReduction = 1 - speedRatio * (1 - PHYSICS.TURN_REDUCTION_AT_SPEED);
    let turnRate = PHYSICS.TURN_SPEED * turnReduction;

    if (state.driftState !== 'none') {
      turnRate *= PHYSICS.DRIFT_TURN_MULTIPLIER;
    }

    state.angularVelocity = input.steer * turnRate;
    state.rotation.y -= state.angularVelocity * dt;
  }

  _updateDrift(state, input, dt) {
    if (state.driftState === 'none') {
      // Check drift initiation
      if (input.drift && Math.abs(input.steer) > 0.1 && state.speed >= PHYSICS.DRIFT_TRIGGER_SPEED) {
        state.driftState = input.steer < 0 ? 'left' : 'right';
        state.driftCharge = 0;
        state.driftBoostLevel = 0;
      }
    } else {
      // Drifting
      if (!input.drift || state.speed < PHYSICS.DRIFT_TRIGGER_SPEED * 0.5) {
        // Release drift
        this._releaseDrift(state);
      } else {
        // Charge drift
        state.driftCharge = Math.min(100, state.driftCharge + PHYSICS.DRIFT_CHARGE_RATE * dt);
        // Determine boost level
        if (state.driftCharge >= PHYSICS.DRIFT_BOOST_THRESHOLDS[2]) {
          state.driftBoostLevel = 3;
        } else if (state.driftCharge >= PHYSICS.DRIFT_BOOST_THRESHOLDS[1]) {
          state.driftBoostLevel = 2;
        } else if (state.driftCharge >= PHYSICS.DRIFT_BOOST_THRESHOLDS[0]) {
          state.driftBoostLevel = 1;
        }
      }
    }
  }

  _releaseDrift(state) {
    if (state.driftBoostLevel > 0) {
      const idx = state.driftBoostLevel - 1;
      state.isBoosting = true;
      state.boostMultiplier = PHYSICS.DRIFT_BOOST_SPEEDS[idx];
      state.boostTimer = PHYSICS.DRIFT_BOOST_DURATIONS[idx];
    }
    state.driftState = 'none';
    state.driftCharge = 0;
    state.driftBoostLevel = 0;
  }

  _updateSpeed(state, input, dt) {
    let maxSpeed = PHYSICS.MAX_SPEED;

    // Surface friction
    const friction = SURFACE_FRICTION[state.surfaceType] || 1.0;

    // Modifiers
    if (state.isMini) maxSpeed *= PHYSICS.MINI_SPEED_MULTIPLIER;
    if (state.isBoosting) maxSpeed *= state.boostMultiplier;
    if (state.offTrack && !state.isBoosting) maxSpeed *= PHYSICS.OFF_TRACK_SPEED_MULTIPLIER;
    if (state.driftState !== 'none') maxSpeed *= PHYSICS.DRIFT_SPEED_PENALTY;

    // Acceleration
    if (input.throttle > 0 && state.speed < maxSpeed) {
      state.speed += PHYSICS.ACCELERATION * input.throttle * friction * dt;
      state.speed = Math.min(state.speed, maxSpeed);
    } else if (input.brake > 0) {
      state.speed -= PHYSICS.BRAKE_DECELERATION * input.brake * dt;
      state.speed = Math.max(state.speed, -PHYSICS.MAX_SPEED * 0.3);
    } else {
      // Idle deceleration
      state.speed -= PHYSICS.IDLE_DECELERATION * dt;
      state.speed = Math.max(state.speed, 0);
    }

    // Apply friction to clamp above max
    if (state.speed > maxSpeed) {
      state.speed -= PHYSICS.IDLE_DECELERATION * 2 * dt;
      state.speed = Math.max(state.speed, maxSpeed);
    }
  }

  _applyMovement(state, dt) {
    // Forward direction from rotation
    const forward = new THREE.Vector3(
      -Math.sin(state.rotation.y),
      0,
      -Math.cos(state.rotation.y)
    );

    state.velocity.copy(forward).multiplyScalar(state.speed);

    // Gravity if not grounded
    if (!state.isGrounded) {
      state.velocity.y -= PHYSICS.GRAVITY * dt;
    }

    state.position.addScaledVector(state.velocity, dt);
  }

  _groundCheck(state, track, dt) {
    if (!track || !track.collisionMesh) {
      // Default ground plane at y=0
      if (state.position.y < PHYSICS.KART_HOVER_HEIGHT) {
        state.position.y = PHYSICS.KART_HOVER_HEIGHT;
        state.isGrounded = true;
        state.velocity.y = 0;
      } else if (state.position.y > PHYSICS.KART_HOVER_HEIGHT + 0.1) {
        state.isGrounded = false;
      }
      return;
    }

    _rayOrigin.copy(state.position);
    _rayOrigin.y += 1.0;
    this._ray.set(_rayOrigin, _rayDir);
    this._ray.far = PHYSICS.GROUND_RAYCAST_DISTANCE + 1.0;

    const hits = this._ray.intersectObject(track.collisionMesh, true);
    if (hits.length > 0) {
      const hit = hits[0];
      state.isGrounded = true;
      state.groundNormal.copy(hit.face.normal);
      state.position.y = hit.point.y + PHYSICS.KART_HOVER_HEIGHT;
      state.velocity.y = 0;

      // Determine surface type from track zones
      if (track.surfaceZones) {
        const surfaceType = this._getSurfaceType(state.position, track.surfaceZones);
        state.surfaceType = surfaceType;
        state.offTrack = false;
        state.offTrackTimer = 0;
      }
    } else {
      // Fallback: treat y≈0 as a flat ground plane so karts don't fall off the road ribbon
      if (state.position.y <= PHYSICS.KART_HOVER_HEIGHT + 0.5) {
        state.isGrounded = true;
        state.position.y = PHYSICS.KART_HOVER_HEIGHT;
        state.velocity.y = 0;
        state.offTrack = true;
        state.surfaceType = 'offtrack';
        // Off-track respawn: if kart wanders off road for >3s, snap it back
        state.offTrackTimer = (state.offTrackTimer || 0) + dt;
        if (state.offTrackTimer > 3.0) {
          state.offTrackTimer = 0;
          this.respawn(state, track);
        }
      } else {
        state.isGrounded = false;
        state.offTrackTimer = 0;
      }
    }
  }

  _getSurfaceType(pos, zones) {
    for (const zone of zones) {
      if (zone.containsPoint) {
        if (zone.containsPoint(pos)) return zone.type;
      } else if (zone.bounds) {
        const b = zone.bounds;
        if (pos.x >= b.minX && pos.x <= b.maxX && pos.z >= b.minZ && pos.z <= b.maxZ) {
          return zone.type;
        }
      }
    }
    return 'default';
  }

  _wallCollision(state, track) {
    if (!track || !track.wallMesh) return;

    // Simple AABB sphere check against wall geometry
    _rayOrigin.copy(state.position);
    const forward = new THREE.Vector3(-Math.sin(state.rotation.y), 0, -Math.cos(state.rotation.y));

    this._ray.set(_rayOrigin, forward);
    this._ray.far = KART_AABB.z / 2;

    const hits = this._ray.intersectObject(track.wallMesh, true);
    if (hits.length > 0) {
      const hit = hits[0];
      // Push back
      const pushDir = hit.face.normal.clone();
      pushDir.y = 0;
      pushDir.normalize();
      state.position.addScaledVector(pushDir, KART_AABB.z / 2 - hit.distance + 0.05);

      // Reflect velocity
      const dot = state.velocity.dot(pushDir);
      if (dot < 0) {
        state.velocity.addScaledVector(pushDir, -dot * (1 + PHYSICS.WALL_BOUNCE_RESTITUTION));
        state.speed *= PHYSICS.WALL_SPEED_PENALTY;
      }
    }
  }

  _boundaryCheck(state, track) {
    if (!track) {
      // Default boundary
      const limit = 60;
      if (Math.abs(state.position.x) > limit || Math.abs(state.position.z) > limit) {
        state.position.x = Math.max(-limit, Math.min(limit, state.position.x));
        state.position.z = Math.max(-limit, Math.min(limit, state.position.z));
        state.speed *= 0.5;
      }
      // Fall respawn
      if (state.position.y < -3) {
        this.respawn(state, track);
      }
      return;
    }

    // Respawn if fallen below threshold (grounded OR not — handles slow falls too)
    if (state.position.y < (track.respawnY ?? -3)) {
      this.respawn(state, track);
    }
  }

  respawn(state, track) {
    // Find nearest checkpoint or start position
    if (track && track.checkpoints && track.checkpoints.length > 0) {
      const cp = track.checkpoints[Math.max(0, state.currentCheckpoint - 1)] || track.checkpoints[0];
      state.position.copy(cp.position);
      state.position.y += PHYSICS.RESPAWN_HOVER_HEIGHT;
      // Face the track's forward direction and place slightly behind checkpoint
      // so the kart can naturally drive forward and cross it
      if (cp.normal) {
        state.rotation.y = Math.atan2(-cp.normal.x, -cp.normal.z);
        state.position.x -= cp.normal.x * 4;
        state.position.z -= cp.normal.z * 4;
      }
    } else {
      state.position.set(0, PHYSICS.RESPAWN_HOVER_HEIGHT, 0);
    }
    state.velocity.set(0, 0, 0);
    state.speed = 0;
    state.driftState = 'none';
    state.driftCharge = 0;
    state.respawnTimer = 1.0;
  }

  applyStun(state, duration) {
    state.isStunned = true;
    state.stunTimer = duration;
    state.speed *= 0.3;
  }

  applyBoost(state, multiplier, duration) {
    state.isBoosting = true;
    state.boostMultiplier = multiplier;
    state.boostTimer = duration;
  }
}
