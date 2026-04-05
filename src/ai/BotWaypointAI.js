import * as THREE from 'three';
import { PHYSICS } from '../constants/physics.js';

// Difficulty presets
const DIFFICULTY = {
  easy:   { speedMult: 0.72, accelMult: 0.80, steerNoise: 1.2, itemDelay: 2.0, rubberBand: true,  pathChoice: 'main' },
  medium: { speedMult: 0.85, accelMult: 0.88, steerNoise: 0.6, itemDelay: 1.0, rubberBand: true,  pathChoice: 'mixed' },
  hard:   { speedMult: 0.94, accelMult: 0.95, steerNoise: 0.2, itemDelay: 0.3, rubberBand: true,  pathChoice: 'smart' },
  expert: { speedMult: 1.00, accelMult: 1.00, steerNoise: 0.0, itemDelay: 0.1, rubberBand: false, pathChoice: 'optimal' },
};

const MAX_STEER_ANGLE = Math.PI / 3; // 60 degrees max steer

export class BotWaypointAI {
  constructor(kartState, waypoints, difficulty = 'medium') {
    this.kartState = kartState;
    this.waypoints = waypoints;       // array from TrackSplineBuilder.generateWaypoints()
    this.difficulty = DIFFICULTY[difficulty] || DIFFICULTY.medium;
    this.difficultyName = difficulty;

    // Navigation state
    this.currentWpIndex = 0;
    this.steerResponse = 0;           // actual smoothed steer value
    this.brakingNow = false;
    this.driftActive = false;

    // Stuck detection — ring buffer of last 30 positions
    this.posHistory = new Array(30).fill(null).map(() => new THREE.Vector3());
    this.posHistoryIdx = 0;
    this.posHistoryTimer = 0;
    this.stuckTimer = 0;
    this.recoveryMode = false;
    this.recoveryPhase = 0;           // 0=brake, 1=reverse, 2=return
    this.recoveryTimer = 0;

    // Lookahead
    this.lookaheadDist = 4.0;

    // Item AI
    this.itemUseTimer = 0;

    // Rubber banding
    this.rubberBandBonus = 0;

    // Response rates per difficulty
    const rateMap = { easy: 3, medium: 5, hard: 8, expert: 12 };
    this.steerResponseRate = rateMap[difficulty] || 5;

    // Noise seed
    this.noiseOffset = Math.random() * 1000;

    // Obstacle avoidance frame counter
    this._avoidanceFrame = 0;
    this._avoidanceSteer = 0;
    this._raycaster = new THREE.Raycaster();
  }

  // -------------------------------------------------------------------------
  // Public update — returns input object { throttle, brake, steer, drift, useItem }
  // -------------------------------------------------------------------------
  update(dt, physics, track, allKartStates) {
    // 1. Update position history and stuck detection
    this._updatePositionHistory(dt);

    // 2. Recovery mode checks
    if (this.stuckTimer > 5.0) {
      // Hard stuck — teleport to nearest waypoint
      const nearest = this._findNearestWaypoint();
      this.kartState.position.copy(nearest.position).add(new THREE.Vector3(0, 0.5, 0));
      this.kartState.velocity.set(0, 0, 0);
      this.kartState.speed = 0;
      const wp = this.waypoints[nearest.index];
      this.kartState.rotation.y = Math.atan2(-wp.tangent.x, -wp.tangent.z);
      this.currentWpIndex = nearest.index;
      this.stuckTimer = 0;
      this.recoveryMode = false;
    } else if (this.stuckTimer > 1.5 && !this.recoveryMode) {
      this.recoveryMode = true;
      this.recoveryPhase = 0;
      this.recoveryTimer = 0;
      this.stuckTimer = 0;
    }

    if (this.recoveryMode) {
      const recoveryInput = this._updateRecovery(dt);
      if (recoveryInput !== null) {
        return recoveryInput;
      }
      // null means phase 2 finished — fall through to normal update
    }

    const ks = this.kartState;

    // 3. Waypoint advancement
    const advanceThreshold = Math.max(1.5, Math.abs(ks.speed) * 0.15);
    const currentWp = this.waypoints[this.currentWpIndex];

    if (currentWp && ks.position.distanceTo(currentWp.position) < advanceThreshold) {
      this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
    }

    // Catch-up: check if any of next 5 waypoints are already behind kart
    const forward = new THREE.Vector3(-Math.sin(ks.rotation.y), 0, -Math.cos(ks.rotation.y));
    for (let i = 1; i <= 5; i++) {
      const checkIdx = (this.currentWpIndex + i) % this.waypoints.length;
      const checkWp = this.waypoints[checkIdx];
      if (!checkWp) break;
      const toWp = checkWp.position.clone().sub(ks.position);
      if (toWp.dot(forward) < 0) { // waypoint is behind us
        this.currentWpIndex = checkIdx;
      }
    }

    // 4. Lookahead target computation
    this.lookaheadDist = 3.0 + Math.abs(ks.speed) * 0.2;
    let cumDist = 0;
    let targetWpIndex = this.currentWpIndex;
    for (let i = 0; i < this.waypoints.length; i++) {
      const idx = (this.currentWpIndex + i) % this.waypoints.length;
      const nextIdx = (idx + 1) % this.waypoints.length;
      cumDist += this.waypoints[idx].position.distanceTo(this.waypoints[nextIdx].position);
      if (cumDist >= this.lookaheadDist) {
        targetWpIndex = nextIdx;
        break;
      }
    }
    const targetWp = this.waypoints[targetWpIndex];

    // Apply racing line offset (perpendicular to tangent)
    const side = new THREE.Vector3(-targetWp.tangent.z, 0, targetWp.tangent.x).normalize();
    const racingLinePos = targetWp.position.clone().addScaledVector(side, targetWp.racingLineOffset || 0);

    // Add difficulty noise
    if (this.difficulty.steerNoise > 0) {
      const noise = (Math.sin(Date.now() * 0.001 + this.noiseOffset) * 0.5 +
                     Math.cos(Date.now() * 0.0007 + this.noiseOffset * 1.3) * 0.5);
      racingLinePos.x += noise * this.difficulty.steerNoise;
      racingLinePos.z += noise * this.difficulty.steerNoise * 0.7;
    }

    // 5. Steering computation
    const toTarget = racingLinePos.clone().sub(ks.position);
    const targetAngle = Math.atan2(-toTarget.x, -toTarget.z);
    let angleError = targetAngle - ks.rotation.y;

    // Normalize to -PI..PI
    while (angleError > Math.PI)  angleError -= 2 * Math.PI;
    while (angleError < -Math.PI) angleError += 2 * Math.PI;

    const rawSteer = THREE.MathUtils.clamp(angleError / MAX_STEER_ANGLE, -1, 1);

    // Surface modifiers
    let steerScale = 1.0;
    if (ks.surfaceType === 'ice' || ks.surfaceType === 'glacier_ice' || ks.surfaceType === 'ice_tunnel') {
      steerScale = 0.6;
    }

    // Smooth steer with response rate
    this.steerResponse = THREE.MathUtils.lerp(
      this.steerResponse,
      rawSteer * steerScale,
      Math.min(1, dt * this.steerResponseRate)
    );

    // 6. Obstacle avoidance rays (every 3 frames)
    this._avoidanceFrame++;
    if (this._avoidanceFrame >= 3) {
      this._avoidanceFrame = 0;
      this._updateObstacleAvoidance(track, ks);
    }
    // Blend avoidance steer into steerResponse
    this.steerResponse = THREE.MathUtils.clamp(
      this.steerResponse + this._avoidanceSteer,
      -1,
      1
    );

    // 7. Speed / throttle computation
    const snappedWp = this.waypoints[this.currentWpIndex];
    const curvature = Math.abs(snappedWp?.curvature || 0);
    let throttle = 1.0;
    if (curvature < 0.05)      throttle = 1.0;
    else if (curvature < 0.15) throttle = 0.75;
    else                        throttle = 0.5;

    // Slope modifiers
    if (ks.slopeAngle > 0.05)  throttle = Math.max(0.6, throttle * 0.95); // uphill min 0.6
    if (ks.slopeAngle < -0.05) throttle *= 1.1;                            // downhill boost

    // Surface modifiers
    if (ks.surfaceType === 'ice' || ks.surfaceType === 'glacier_ice') {
      throttle = Math.min(0.7, throttle);
    }
    if (['clothing', 'carpet', 'mud', 'soft'].includes(ks.surfaceType)) {
      throttle = Math.min(0.8, throttle);
    }
    if (ks.onBoostPad) throttle = 0.0; // let boost carry

    // Apply difficulty speed mult (simulates lower top speed for easier bots)
    const effectiveMaxSpeed = PHYSICS.MAX_SPEED * this.difficulty.speedMult;
    let brake = 0;

    // Brake to not exceed effective max speed
    if (Math.abs(ks.speed) > effectiveMaxSpeed) {
      throttle = 0;
      brake = 0.5;
    }

    // Rubber banding
    if (this.difficulty.rubberBand) {
      const myPos = ks.racePosition || 1;
      if (myPos >= 4) {
        this.rubberBandBonus = Math.min(0.25, (myPos - 1) * 0.06);
      } else if (myPos === 1) {
        this.rubberBandBonus = -0.05;
      } else {
        this.rubberBandBonus = 0;
      }
      throttle = Math.min(1.0, throttle * (1 + this.rubberBandBonus));
    }

    // 8. Drift logic
    const shouldDrift = Math.abs(ks.speed) > PHYSICS.MAX_SPEED * 0.7
                     && curvature > 0.12
                     && (this.difficultyName === 'hard' || this.difficultyName === 'expert');

    // Expert bots time drift for boost
    const holdDrift = shouldDrift && (
      this.difficultyName === 'expert' ? ks.driftCharge < 50 : curvature > 0.06
    );

    // 9. Item use AI
    this.itemUseTimer -= dt;
    let useItem = false;
    if (this.itemUseTimer <= 0 && ks.itemState && ks.itemCount > 0) {
      useItem = true;
      this.itemUseTimer = this.difficulty.itemDelay + Math.random() * 0.5;
    }

    return {
      throttle: Math.max(0, throttle),
      brake,
      steer: this.steerResponse,
      drift: holdDrift,
      useItem,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Record position every 0.5 s and detect if the kart is stuck.
   */
  _updatePositionHistory(dt) {
    this.posHistoryTimer += dt;
    if (this.posHistoryTimer >= 0.5) {
      this.posHistoryTimer = 0;
      this.posHistory[this.posHistoryIdx] = this.kartState.position.clone();
      this.posHistoryIdx = (this.posHistoryIdx + 1) % 30;

      const oldIdx = this.posHistoryIdx; // oldest entry = current write position
      const oldPos = this.posHistory[oldIdx];
      if (oldPos && oldPos.x !== 0) {
        const displacement = this.kartState.position.distanceTo(oldPos);
        if (displacement < 0.8 && Math.abs(this.kartState.speed) < 2.0) {
          this.stuckTimer += 0.5;
        } else {
          this.stuckTimer = Math.max(0, this.stuckTimer - 0.25);
        }
      }
    }
  }

  /**
   * Drive the three-phase recovery sequence.
   * Returns an input object while recovery is active, or null when done.
   */
  _updateRecovery(dt) {
    this.recoveryTimer += dt;

    if (this.recoveryPhase === 0) {
      // Phase 0: brake hard for 0.2 s
      if (this.recoveryTimer >= 0.2) {
        this.recoveryPhase = 1;
        this.recoveryTimer = 0;
      }
      return { throttle: 0, brake: 1, steer: 0, drift: false, useItem: false };
    }

    if (this.recoveryPhase === 1) {
      // Phase 1: reverse for 0.8 s, steer toward nearest waypoint
      const nearest = this._findNearestWaypoint();
      const toWp = nearest.position.clone().sub(this.kartState.position);
      const wpAngle = Math.atan2(-toWp.x, -toWp.z);
      // When reversing, steer direction is inverted relative to desired heading
      let reverseAngleError = wpAngle - this.kartState.rotation.y + Math.PI;
      while (reverseAngleError > Math.PI)  reverseAngleError -= 2 * Math.PI;
      while (reverseAngleError < -Math.PI) reverseAngleError += 2 * Math.PI;
      const reversedSteer = THREE.MathUtils.clamp(reverseAngleError / MAX_STEER_ANGLE, -1, 1);

      if (this.recoveryTimer >= 0.8) {
        this.recoveryPhase = 2;
        this.recoveryTimer = 0;
      }
      // Use brake at 0.6 to drive in reverse; throttle=0
      return { throttle: 0, brake: 0.6, steer: reversedSteer, drift: false, useItem: false };
    }

    // Phase 2: return to normal navigation
    this.recoveryMode = false;
    this.currentWpIndex = this._findNearestWaypoint().index;
    return null; // fall through to normal update
  }

  /**
   * Cast three rays (center, left −20°, right +20°) against track.wallMesh
   * and compute an avoidance steer correction.
   */
  _updateObstacleAvoidance(track, ks) {
    this._avoidanceSteer = 0;

    if (!track || !track.wallMesh) return;

    const rayLen = 4 + Math.abs(ks.speed) * 0.1;
    const fwd = new THREE.Vector3(-Math.sin(ks.rotation.y), 0, -Math.cos(ks.rotation.y));
    const origin = ks.position.clone().add(new THREE.Vector3(0, 0.3, 0));

    // Angles: 0 = center, -20° = left, +20° = right
    const angles = [0, -Math.PI / 9, Math.PI / 9];
    let avoidance = 0;

    for (let a = 0; a < angles.length; a++) {
      const angle = angles[a];
      const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
      this._raycaster.set(origin, dir);
      this._raycaster.far = rayLen;

      let hits;
      try {
        hits = this._raycaster.intersectObject(track.wallMesh, true);
      } catch (_) {
        hits = [];
      }

      if (hits.length > 0) {
        const dist = hits[0].distance;
        const strength = 1 - dist / rayLen; // closer = stronger avoidance
        if (angle <= 0) {
          // Center or left ray hit — steer right
          avoidance += strength * 0.6;
        } else {
          // Right ray hit — steer left
          avoidance -= strength * 0.6;
        }
      }
    }

    this._avoidanceSteer = THREE.MathUtils.clamp(avoidance, -1, 1);
  }

  /**
   * Return { index, position } for the waypoint closest to the kart.
   */
  _findNearestWaypoint() {
    let bestIndex = 0;
    let bestDist = Infinity;

    for (let i = 0; i < this.waypoints.length; i++) {
      const dist = this.kartState.position.distanceTo(this.waypoints[i].position);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }

    return { index: bestIndex, position: this.waypoints[bestIndex].position };
  }
}
