import * as THREE from 'three';
import { PHYSICS, SURFACE_FRICTION, KART_AABB } from '../constants/physics.js';

// Module-level reusable vectors to reduce GC pressure
const _tempVec = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3(0, -1, 0);
const _down = new THREE.Vector3(0, -1, 0);
const _worldUp = new THREE.Vector3(0, 1, 0);
const _normalMatrix = new THREE.Matrix3();

export class KartPhysics {
  constructor() {
    this._ray = new THREE.Raycaster();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // createKartState
  // ─────────────────────────────────────────────────────────────────────────────
  createKartState(position, heading) {
    return {
      position:          new THREE.Vector3(position.x, position.y, position.z),
      velocity:          new THREE.Vector3(),
      rotation:          new THREE.Euler(0, heading || 0, 0, 'YXZ'),
      angularVelocity:   0,
      speed:             0,

      groundNormal:      new THREE.Vector3(0, 1, 0),
      isGrounded:        true,
      airtime:           0,
      lastGrounded:      true,

      surfaceType:       'default',
      offTrack:          false,
      offTrackTimer:     0,
      bankingAngle:      0,
      slopeAngle:        0,
      lateralGrip:       1,

      onBoostPad:        false,
      boostPadTimer:     0,
      screenShake:       0,

      driftBoostLevel:   0,
      driftCharge:       0,
      driftState:        'none',

      itemState:         null,
      itemCount:         0,

      isStunned:         false,
      stunTimer:         0,

      isBoosting:        false,
      boostTimer:        0,
      boostMultiplier:   1,

      isInvincible:      false,
      invincibleTimer:   0,

      isCorrupted:       false,
      corruptedTimer:    0,

      isMini:            false,
      miniTimer:         0,

      lapCount:          0,
      currentCheckpoint: 0,
      racePosition:      1,
      finishTime:        null,

      respawnTimer:      0,
      prevPosition:      new THREE.Vector3(position.x, position.y, position.z),

      // Internal ground tilt Euler, used by renderer for pitch/roll visual
      _groundTilt:       new THREE.Euler(0, 0, 0, 'YXZ'),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // update  — main per-frame entry point
  // ─────────────────────────────────────────────────────────────────────────────
  update(state, input, dt, track) {
    // 1. Record previous position
    state.prevPosition.copy(state.position);

    // 2. Tick all status timers
    this._updateTimers(state, dt);

    // 3. Stunned — skip physics
    if (state.isStunned) return;

    // 4. Respawn countdown — kart is frozen
    if (state.respawnTimer > 0) {
      state.respawnTimer -= dt;
      return;
    }

    // 5. Effective input (corrupted inverts controls)
    const effectiveInput = this._getEffectiveInput(input, state);

    // 6. Steering
    this._updateSteering(state, effectiveInput, dt);

    // 7. Drift
    this._updateDrift(state, effectiveInput, dt);

    // 8. Acceleration / braking / surface speed
    this._updateSpeed(state, effectiveInput, dt);

    // 9. 3-D movement with slope and banking
    this._applyMovement(state, dt);

    // 10. 3-D ground raycast — aligns kart to terrain, detects airtime
    this._groundCheck(state, track, dt);

    // 11. Wall deflection
    this._wallCollision(state, track);

    // 12. Hard boundary / fall respawn
    this._boundaryCheck(state, track);

    // 13. Decay screen shake
    this._updateScreenShake(state, dt);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _updateTimers
  // ─────────────────────────────────────────────────────────────────────────────
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

    if (state.onBoostPad) {
      state.boostPadTimer -= dt;
      if (state.boostPadTimer <= 0) {
        state.onBoostPad = false;
        state.boostPadTimer = 0;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _getEffectiveInput
  // ─────────────────────────────────────────────────────────────────────────────
  _getEffectiveInput(input, state) {
    if (state.isCorrupted) {
      return {
        ...input,
        steer:    -input.steer,
        throttle:  input.brake,
        brake:     input.throttle,
      };
    }
    return input;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _updateSteering
  // ─────────────────────────────────────────────────────────────────────────────
  _updateSteering(state, input, dt) {
    const speedRatio    = Math.min(1, state.speed / PHYSICS.MAX_SPEED);
    const turnReduction = 1 - speedRatio * (1 - PHYSICS.TURN_REDUCTION_AT_SPEED);
    let turnRate        = PHYSICS.TURN_SPEED * turnReduction;

    if (state.driftState !== 'none') {
      turnRate *= PHYSICS.DRIFT_TURN_MULTIPLIER;
    }

    // ICE surface — much less steering authority
    if (state.surfaceType === 'ice' ||
        state.surfaceType === 'glacier_ice' ||
        state.surfaceType === 'ice_tunnel' ||
        state.surfaceType === 'frozen_river') {
      turnRate *= 0.5;
    }

    let av = input.steer * turnRate;

    // Banked road naturally fights lateral angular drift
    if (state.isGrounded && state.bankingAngle !== 0) {
      av -= state.bankingAngle * 0.3;
    }

    state.angularVelocity = av;
    state.rotation.y -= state.angularVelocity * dt;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _updateDrift
  // ─────────────────────────────────────────────────────────────────────────────
  _updateDrift(state, input, dt) {
    if (state.driftState === 'none') {
      if (input.drift && Math.abs(input.steer) > 0.1 && state.speed >= PHYSICS.DRIFT_TRIGGER_SPEED) {
        state.driftState    = input.steer < 0 ? 'left' : 'right';
        state.driftCharge   = 0;
        state.driftBoostLevel = 0;
      }
    } else {
      if (!input.drift || state.speed < PHYSICS.DRIFT_TRIGGER_SPEED * 0.5) {
        this._releaseDrift(state);
      } else {
        state.driftCharge = Math.min(100, state.driftCharge + PHYSICS.DRIFT_CHARGE_RATE * dt);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // _releaseDrift
  // ─────────────────────────────────────────────────────────────────────────────
  _releaseDrift(state) {
    if (state.driftBoostLevel > 0) {
      const idx = state.driftBoostLevel - 1;
      state.isBoosting      = true;
      state.boostMultiplier = PHYSICS.DRIFT_BOOST_SPEEDS[idx];
      state.boostTimer      = PHYSICS.DRIFT_BOOST_DURATIONS[idx];
    }
    state.driftState      = 'none';
    state.driftCharge     = 0;
    state.driftBoostLevel = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _updateSpeed
  // ─────────────────────────────────────────────────────────────────────────────
  _updateSpeed(state, input, dt) {
    let maxSpeed = PHYSICS.MAX_SPEED;

    // Surface friction coefficient
    const friction = SURFACE_FRICTION[state.surfaceType] ?? 1.0;

    // Status modifiers
    if (state.isMini)                          maxSpeed *= PHYSICS.MINI_SPEED_MULTIPLIER;
    if (state.isBoosting)                      maxSpeed *= state.boostMultiplier;
    if (state.offTrack && !state.isBoosting)   maxSpeed *= PHYSICS.OFF_TRACK_SPEED_MULTIPLIER;
    if (state.driftState !== 'none')           maxSpeed *= PHYSICS.DRIFT_SPEED_PENALTY;

    // Boost pad — override speed for its duration
    if (state.onBoostPad) {
      maxSpeed = PHYSICS.MAX_SPEED * 1.4;
      state.speed = Math.max(state.speed, maxSpeed);
      // No normal accel/decel while boost pad is active
      state.speed = THREE.MathUtils.lerp(state.speed, maxSpeed, Math.min(1, dt * 8));
      return;
    }

    // Banking improves lateral grip (store for steering / other systems)
    state.lateralGrip = 1 + Math.abs(state.bankingAngle) * 0.8;

    if (input.throttle > 0) {
      if (state.speed < maxSpeed) {
        state.speed += PHYSICS.ACCELERATION * input.throttle * friction * dt;
        state.speed  = Math.min(state.speed, maxSpeed);
      }
      // Prevent stalling on uphills — enforce a minimum speed when throttle held
      if (state.slopeAngle > 0.08) {
        state.speed = Math.max(state.speed, 1.0);
      }
    } else if (input.brake > 0) {
      state.speed -= PHYSICS.BRAKE_DECELERATION * input.brake * dt;
      state.speed  = Math.max(state.speed, -PHYSICS.MAX_SPEED * 0.3);
    } else {
      // Coast / idle deceleration
      state.speed -= PHYSICS.IDLE_DECELERATION * dt;
      state.speed  = Math.max(state.speed, 0);
    }

    // Bleed off speed if over cap (e.g. after boost expires)
    if (state.speed > maxSpeed) {
      state.speed -= PHYSICS.IDLE_DECELERATION * 2 * dt;
      state.speed  = Math.max(state.speed, maxSpeed);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _applyMovement  — 3-D movement with slope/banking influence
  // ─────────────────────────────────────────────────────────────────────────────
  _applyMovement(state, dt) {
    // Forward direction in XZ plane derived from steering heading
    const forward = new THREE.Vector3(
      -Math.sin(state.rotation.y),
      0,
      -Math.cos(state.rotation.y)
    );

    // Slope gravity component — only when grounded on non-flat terrain
    if (state.isGrounded && state.groundNormal) {
      // slopeVec: component of gravity projected onto the road plane
      //   = down - (down · n̂) * n̂   (removes the normal component)
      const slopeVec = _down.clone()
        .addScaledVector(state.groundNormal, -_down.dot(state.groundNormal));

      // Only push if slope is significant (> ~3 degrees, length > 0.05)
      if (slopeVec.length() > 0.05) {
        const slopeMagnitude = _down.dot(slopeVec.clone().normalize()) * PHYSICS.GRAVITY;
        state.velocity.addScaledVector(slopeVec.normalize(), slopeMagnitude * dt);
        // Re-project speed along forward so steering stays coherent
        state.speed = state.velocity.dot(forward);
      }
    }

    // Horizontal velocity from forward + speed
    state.velocity.x = forward.x * state.speed;
    state.velocity.z = forward.z * state.speed;

    // Vertical integration
    if (!state.isGrounded) {
      state.velocity.y -= PHYSICS.GRAVITY * dt;
      state.airtime    += dt;
    } else {
      state.velocity.y  = 0;
    }

    state.position.addScaledVector(state.velocity, dt);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _groundCheck  — downward raycast, terrain snapping, surface classification
  // ─────────────────────────────────────────────────────────────────────────────
  _groundCheck(state, track, dt) {
    const wasGrounded = state.isGrounded;

    if (!track || !track.collisionMesh) {
      // ── Flat-ground fallback ──────────────────────────────────────────────
      if (state.position.y <= PHYSICS.KART_HOVER_HEIGHT + 0.5) {
        state.isGrounded = true;
        state.groundNormal.set(0, 1, 0);
        state.position.y = PHYSICS.KART_HOVER_HEIGHT;
        state.velocity.y = 0;
      } else {
        state.isGrounded = false;
      }
    } else {
      // ── Terrain raycast ───────────────────────────────────────────────────
      const rayOrigin = state.position.clone();
      rayOrigin.y    += 1.0;                          // start 1 unit above kart centre
      const rayDir    = new THREE.Vector3(0, -1, 0);
      const ray       = new THREE.Raycaster(
        rayOrigin, rayDir, 0, PHYSICS.GROUND_RAYCAST_DISTANCE + 1.0
      );

      const hits = ray.intersectObject(track.collisionMesh, true);

      if (hits.length > 0) {
        const hit = hits[0];
        state.isGrounded = true;

        // Transform face normal into world space
        if (hit.face) {
          _normalMatrix.getNormalMatrix(hit.object.matrixWorld);
          state.groundNormal
            .copy(hit.face.normal)
            .applyMatrix3(_normalMatrix)
            .normalize();
        } else {
          state.groundNormal.set(0, 1, 0);
        }

        // Smooth Y snapping — lerp toward ground + hover height to avoid jitter
        const targetY    = hit.point.y + PHYSICS.KART_HOVER_HEIGHT;
        state.position.y = THREE.MathUtils.lerp(
          state.position.y, targetY, Math.min(1, dt * 15)
        );
        // Don't yank kart upward if it's already above the snap target
        state.velocity.y = Math.max(0, state.velocity.y);

        // Surface classification
        if (track.surfaceZones) {
          state.surfaceType = _getSurfaceTypeAt(state.position, track.surfaceZones) || 'default';
        } else {
          state.surfaceType = 'default';
        }
        state.offTrack     = false;
        state.offTrackTimer = 0;

        // Banking angle: groundNormal projected onto the lateral axis
        const lateralAxis = new THREE.Vector3(
          -Math.sin(state.rotation.y + Math.PI / 2),
          0,
          -Math.cos(state.rotation.y + Math.PI / 2)
        );
        state.bankingAngle = Math.asin(
          THREE.MathUtils.clamp(state.groundNormal.dot(lateralAxis), -1, 1)
        );

        // Slope angle: signed angle between groundNormal and world-up, along forward
        const fwd = new THREE.Vector3(
          -Math.sin(state.rotation.y),
          0,
          -Math.cos(state.rotation.y)
        );
        state.slopeAngle = Math.atan2(
          -state.groundNormal.dot(fwd), state.groundNormal.y
        );

      } else {
        // ── No hit — low-altitude fallback ───────────────────────────────────
        if (state.position.y <= PHYSICS.KART_HOVER_HEIGHT + 0.5) {
          state.isGrounded    = true;
          state.groundNormal.set(0, 1, 0);
          state.position.y    = PHYSICS.KART_HOVER_HEIGHT;
          state.velocity.y    = 0;
          state.offTrack      = true;
          state.surfaceType   = 'offtrack';
          state.offTrackTimer = (state.offTrackTimer || 0) + dt;
          if (state.offTrackTimer > 3.0) {
            state.offTrackTimer = 0;
            this.respawn(state, track);
          }
        } else {
          state.isGrounded    = false;
          state.offTrackTimer = 0;
        }
      }
    }

    // ── Landing detection ─────────────────────────────────────────────────────
    if (!wasGrounded && state.isGrounded) {
      this._onLanding(state);
    }

    // ── Kart pitch / roll alignment to ground normal ──────────────────────────
    if (state.isGrounded && state.groundNormal) {
      if (!state._groundTilt) state._groundTilt = new THREE.Euler(0, 0, 0, 'YXZ');
      state._groundTilt.set(state.slopeAngle, 0, -state.bankingAngle, 'YXZ');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _onLanding  — called the frame a kart transitions from air to ground
  // ─────────────────────────────────────────────────────────────────────────────
  _onLanding(state) {
    if (state.airtime > 0.3) {
      // Screen shake proportional to airtime, capped at 0.8
      state.screenShake = Math.min(state.airtime * 0.3, 0.8);
      // Speed reduction on hard landing
      state.speed *= Math.max(0.85, 1 - state.airtime * 0.08);
      state.velocity.y = 0;
    }
    state.airtime = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _updateScreenShake  — exponential-like decay of landing shake amplitude
  // ─────────────────────────────────────────────────────────────────────────────
  _updateScreenShake(state, dt) {
    state.screenShake = Math.max(0, state.screenShake - dt * 2.5);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _wallCollision  — push kart out of wall geometry and reflect velocity
  // ─────────────────────────────────────────────────────────────────────────────
  _wallCollision(state, track) {
    // Support both old format (track.wallMesh) and new TrackSplineBuilder format (track.walls.collision)
    const wallMesh = track?.wallMesh || track?.walls?.collision;
    if (!track || !wallMesh) return;

    _rayOrigin.copy(state.position);
    const forward = new THREE.Vector3(
      -Math.sin(state.rotation.y),
      0,
      -Math.cos(state.rotation.y)
    );

    this._ray.set(_rayOrigin, forward);
    this._ray.far = KART_AABB.z / 2;

    const hits = this._ray.intersectObject(wallMesh, true);
    if (hits.length > 0) {
      const hit     = hits[0];
      const pushDir = hit.face.normal.clone();
      pushDir.y = 0;
      pushDir.normalize();

      // Push kart out of wall
      state.position.addScaledVector(
        pushDir, KART_AABB.z / 2 - hit.distance + 0.05
      );

      // Reflect velocity component into wall
      const dot = state.velocity.dot(pushDir);
      if (dot < 0) {
        state.velocity.addScaledVector(pushDir, -dot * (1 + PHYSICS.WALL_BOUNCE_RESTITUTION));
        state.speed *= PHYSICS.WALL_SPEED_PENALTY;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // _boundaryCheck  — world-edge clamping and fall-respawn
  // ─────────────────────────────────────────────────────────────────────────────
  _boundaryCheck(state, track) {
    if (!track) {
      const limit = 60;
      if (Math.abs(state.position.x) > limit || Math.abs(state.position.z) > limit) {
        state.position.x = Math.max(-limit, Math.min(limit, state.position.x));
        state.position.z = Math.max(-limit, Math.min(limit, state.position.z));
        state.speed *= 0.5;
      }
      if (state.position.y < -3) {
        this.respawn(state, track);
      }
      return;
    }

    const respawnY = track.respawnY ?? -3;
    if (state.position.y < respawnY) {
      this.respawn(state, track);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // respawn  — places kart behind nearest checkpoint, facing forward
  // ─────────────────────────────────────────────────────────────────────────────
  respawn(state, track) {
    if (track && track.checkpoints && track.checkpoints.length > 0) {
      // Use the last-crossed checkpoint (clamped to valid index)
      const cpIndex = Math.max(0, (state.currentCheckpoint - 1 + track.checkpoints.length) % track.checkpoints.length);
      const cp      = track.checkpoints[cpIndex] || track.checkpoints[0];

      // Place kart at checkpoint height with hover clearance
      state.position.copy(cp.position);
      state.position.y += PHYSICS.RESPAWN_HOVER_HEIGHT;

      if (cp.normal) {
        // Face checkpoint's forward direction (cp.normal points forward along track)
        state.rotation.y = Math.atan2(-cp.normal.x, -cp.normal.z);
        // Position 4 units behind the checkpoint in its forward direction
        state.position.x -= cp.normal.x * 4;
        state.position.z -= cp.normal.z * 4;
      }
    } else {
      // No track / checkpoint data — reset to origin
      state.position.set(0, PHYSICS.RESPAWN_HOVER_HEIGHT, 0);
    }

    state.velocity.set(0, 0, 0);
    state.speed         = 0;
    state.driftState    = 'none';
    state.driftCharge   = 0;
    state.respawnTimer  = 1.5;
    state.airtime       = 0;
    state.screenShake   = 0;
    state.offTrackTimer = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // applyStun  — external: item hits, etc.
  // ─────────────────────────────────────────────────────────────────────────────
  applyStun(state, duration) {
    state.isStunned  = true;
    state.stunTimer  = duration;
    state.speed     *= 0.3;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // applyBoost  — external: mushroom, star, etc.
  // ─────────────────────────────────────────────────────────────────────────────
  applyBoost(state, multiplier, duration) {
    state.isBoosting      = true;
    state.boostMultiplier = multiplier;
    state.boostTimer      = duration;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level helper: surface type lookup from zone list
// (mirrors the old _getSurfaceType, promoted to a pure function)
// ─────────────────────────────────────────────────────────────────────────────
function _getSurfaceTypeAt(pos, zones) {
  for (const zone of zones) {
    if (zone.containsPoint) {
      if (zone.containsPoint(pos)) return zone.type;
    } else if (zone.bounds) {
      const b = zone.bounds;
      if (pos.x >= b.minX && pos.x <= b.maxX &&
          pos.z >= b.minZ && pos.z <= b.maxZ) {
        return zone.type;
      }
    }
  }
  return 'default';
}
