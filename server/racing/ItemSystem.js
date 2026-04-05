/**
 * NKart - Server-authoritative item system.
 *
 * Handles all 14 item types: weighted random distribution based on race
 * position, shell physics (boost / homing), hit detection, effects
 * (stun, shrink, inversion, invincibility, steal, chain, etc.), item-box
 * respawn timers, and active projectile simulation each server tick.
 */

const crypto = require('node:crypto');

// ---------------------------------------------------------------------------
// Constants (mirrors client constants/items.js)
// ---------------------------------------------------------------------------

const ITEM_TYPES = {
  BOOST_SHELL:          'boost_shell',
  HOMING_SHELL:         'homing_shell',
  TRIPLE_BOOST_SHELLS:  'triple_boost_shells',
  TRIPLE_HOMING_SHELLS: 'triple_homing_shells',
  BANANA_PEEL:          'banana_peel',
  BOOST_STAR:           'boost_star',
  LIGHTNING_BOLT:       'lightning_bolt',
  GRAVITY_BOMB:         'gravity_bomb',
  MUSHROOM_BOOST:       'mushroom_boost',
  TRIPLE_MUSHROOM:      'triple_mushroom',
  BOO_GHOST:            'boo_ghost',
  THUNDERCLOUD:         'thundercloud',
  FAKE_ITEM_BOX:        'fake_item_box',
  CORRUPTED_SHELL:      'corrupted_shell',
};

// Position-weighted distribution (index 0 = 1st place, 7 = 8th)
const ITEM_DISTRIBUTION = {
  [ITEM_TYPES.BOOST_SHELL]:          [30, 25, 20, 15, 10,  5,  5,  5],
  [ITEM_TYPES.TRIPLE_BOOST_SHELLS]:  [ 5, 10, 12, 15, 15, 15, 10,  8],
  [ITEM_TYPES.HOMING_SHELL]:         [10, 15, 18, 20, 20, 15, 12,  8],
  [ITEM_TYPES.TRIPLE_HOMING_SHELLS]: [ 0,  5,  8, 10, 15, 20, 20, 18],
  [ITEM_TYPES.BANANA_PEEL]:          [20, 15, 12, 10,  8,  5,  5,  5],
  [ITEM_TYPES.BOOST_STAR]:           [ 0,  0,  2,  3,  5,  8, 10, 12],
  [ITEM_TYPES.LIGHTNING_BOLT]:       [ 0,  0,  0,  2,  3,  5,  8, 12],
  [ITEM_TYPES.GRAVITY_BOMB]:         [ 0,  0,  2,  3,  5,  8, 10, 12],
  [ITEM_TYPES.MUSHROOM_BOOST]:       [20, 15, 10,  8,  5,  3,  3,  3],
  [ITEM_TYPES.TRIPLE_MUSHROOM]:      [ 5,  8,  8,  8,  7,  7,  7,  7],
  [ITEM_TYPES.BOO_GHOST]:            [ 5,  5,  5,  3,  3,  5,  5,  5],
  [ITEM_TYPES.THUNDERCLOUD]:         [ 5,  2,  3,  3,  4,  4,  5,  5],
};

const SHELL = {
  BOOST_SPEED:          40.0,
  HOMING_SPEED:         35.0,
  HOMING_TURN_RATE:     Math.PI / 4,  // 45 deg/s
  HIT_RADIUS:           0.6,
  BOOST_MAX_BOUNCES:    1,
  BOOST_LIFETIME:       6.0,
  HOMING_LIFETIME:      10.0,
  GRAVITY_BOMB_RADIUS:  2.5,
};

const EFFECT = {
  STUN_DURATION:                1.2,
  LONG_STUN_DURATION:           2.5,
  BANANA_SPIN_DURATION:         0.8,
  STAR_DURATION:                6.0,
  STAR_SPEED_MULT:              1.4,
  LIGHTNING_SHRINK_DURATION:    5.0,
  LIGHTNING_SPEED_MULT:         0.65,
  LIGHTNING_MINI_SCALE:         0.4,
  BOO_INVISIBLE_DURATION:       3.0,
  THUNDERCLOUD_DURATION:        8.0,
  THUNDERCLOUD_STUN:            2.0,
  THUNDERCLOUD_SHRINK:          3.0,
  CORRUPTED_INVERT_DURATION:    3.0,
  MUSHROOM_BOOST_DURATION:      2.5,
  MUSHROOM_BOOST_MULT:          1.6,
  FAKE_BOX_DETECT_RADIUS:       1.0,
  FAKE_BOX_EXPLODE_RADIUS:      2.0,
  FAKE_BOX_STUN:                1.0,
  MAX_BANANA_PER_PLAYER:        2,
};

const ITEM_BOX_RESPAWN_TIME = 8.0;

function uid() {
  return crypto.randomBytes(4).toString('hex');
}

// ---------------------------------------------------------------------------
// Vec3 helpers (no THREE dependency on server)
// ---------------------------------------------------------------------------

function v3(x, y, z) { return { x: x || 0, y: y || 0, z: z || 0 }; }
function v3copy(a) { return { x: a.x, y: a.y, z: a.z }; }
function v3add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function v3sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function v3scale(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
function v3len(a) { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); }
function v3dist(a, b) { return v3len(v3sub(a, b)); }
function v3normalize(a) {
  const l = v3len(a);
  return l > 0.0001 ? v3scale(a, 1 / l) : v3(0, 0, 0);
}
function v3dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function v3reflect(v, n) {
  const d = 2 * v3dot(v, n);
  return { x: v.x - d * n.x, y: v.y - d * n.y, z: v.z - d * n.z };
}

// ---------------------------------------------------------------------------
// Item System class
// ---------------------------------------------------------------------------

class ItemSystem {
  constructor() {
    /** @type {Map<string, Projectile>} */
    this.projectiles = new Map();

    /** @type {Map<string, DroppedItem>} */
    this.droppedItems = new Map();

    /** @type {ItemBox[]} */
    this.itemBoxes = [];

    /** Events accumulated during a tick, to be broadcast afterwards */
    this.pendingEvents = [];
  }

  // -----------------------------------------------------------------------
  // Item box management
  // -----------------------------------------------------------------------

  initItemBoxes(positions) {
    this.itemBoxes = (positions || []).map((pos, idx) => ({
      id: idx,
      position: v3copy(pos),
      active: true,
      respawnTimer: 0,
    }));
  }

  updateItemBoxes(dt) {
    for (const box of this.itemBoxes) {
      if (!box.active) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.active = true;
          this.pendingEvents.push({ type: 'item-box-respawn', boxId: box.id, position: box.position });
        }
      }
    }
  }

  /**
   * Check if a kart at `pos` collects any active item box.
   * Returns true if collected (caller should call rollItem).
   */
  checkItemBoxCollection(pos, radius) {
    radius = radius || 0.8;
    for (const box of this.itemBoxes) {
      if (!box.active) continue;
      if (v3dist(pos, box.position) < radius) {
        box.active = false;
        box.respawnTimer = ITEM_BOX_RESPAWN_TIME;
        return box;
      }
    }
    return null;
  }

  // -----------------------------------------------------------------------
  // Item roll (position-weighted)
  // -----------------------------------------------------------------------

  rollItem(racePosition) {
    const idx = Math.max(0, Math.min(7, racePosition - 1));
    const weights = [];
    const types = [];
    for (const [type, dist] of Object.entries(ITEM_DISTRIBUTION)) {
      const w = dist[idx] || 0;
      if (w > 0) {
        weights.push(w);
        types.push(type);
      }
    }

    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return types[i];
    }
    return types[types.length - 1];
  }

  // -----------------------------------------------------------------------
  // Use item (called when player/bot uses their held item)
  // -----------------------------------------------------------------------

  /**
   * @param {string} userId        - id of the user/bot
   * @param {string} itemType      - ITEM_TYPES value
   * @param {object} kartState     - the user's kart state { position, rotation, speed, ... }
   * @param {Map}    allKarts      - id -> kartState for every racer
   * @param {number[]} positions   - sorted array of ids by race position (index 0 = 1st)
   * @returns {{ consumed: boolean, remaining: number }} whether the item was consumed
   */
  useItem(userId, itemType, kartState, allKarts, positions) {
    switch (itemType) {
      case ITEM_TYPES.BOOST_SHELL:
        this._fireBoostShell(userId, kartState);
        return { consumed: true };

      case ITEM_TYPES.HOMING_SHELL: {
        const target = this._findNextAhead(userId, positions);
        this._fireHomingShell(userId, kartState, target, allKarts);
        return { consumed: true };
      }

      case ITEM_TYPES.TRIPLE_BOOST_SHELLS:
        this._fireBoostShell(userId, kartState, -0.3);
        this._fireBoostShell(userId, kartState, 0);
        this._fireBoostShell(userId, kartState, 0.3);
        return { consumed: true };

      case ITEM_TYPES.TRIPLE_HOMING_SHELLS: {
        const target3 = this._findNextAhead(userId, positions);
        for (let i = 0; i < 3; i++) {
          this._fireHomingShell(userId, kartState, target3, allKarts, i * 0.3);
        }
        return { consumed: true };
      }

      case ITEM_TYPES.BANANA_PEEL:
        this._dropBanana(userId, kartState);
        return { consumed: true };

      case ITEM_TYPES.BOOST_STAR:
        this._applyStarEffect(userId, kartState);
        return { consumed: true };

      case ITEM_TYPES.LIGHTNING_BOLT:
        this._applyLightningEffect(userId, allKarts);
        return { consumed: true };

      case ITEM_TYPES.GRAVITY_BOMB:
        this._fireGravityBomb(userId, kartState);
        return { consumed: true };

      case ITEM_TYPES.MUSHROOM_BOOST:
        this._applyMushroomBoost(userId, kartState);
        return { consumed: true };

      case ITEM_TYPES.TRIPLE_MUSHROOM:
        this._applyMushroomBoost(userId, kartState);
        // Remaining uses tracked by the caller -- just apply one boost each call
        return { consumed: true };

      case ITEM_TYPES.BOO_GHOST:
        this._applyBooEffect(userId, kartState, allKarts, positions);
        return { consumed: true };

      case ITEM_TYPES.THUNDERCLOUD:
        this._applyThundercloudEffect(userId, kartState, allKarts, positions);
        return { consumed: true };

      case ITEM_TYPES.FAKE_ITEM_BOX:
        this._dropFakeItemBox(userId, kartState);
        return { consumed: true };

      case ITEM_TYPES.CORRUPTED_SHELL: {
        const corTarget = this._findNextAhead(userId, positions);
        this._fireCorruptedShell(userId, kartState, corTarget, allKarts);
        return { consumed: true };
      }

      default:
        return { consumed: false };
    }
  }

  // -----------------------------------------------------------------------
  // Projectile / dropped item tick
  // -----------------------------------------------------------------------

  update(dt, allKarts) {
    this.pendingEvents = [];

    // Update item boxes
    this.updateItemBoxes(dt);

    // Update projectiles
    this._updateProjectiles(dt, allKarts);

    // Update dropped items
    this._updateDroppedItems(dt, allKarts);

    return this.pendingEvents;
  }

  _updateProjectiles(dt, allKarts) {
    for (const [projId, proj] of this.projectiles) {
      proj.age += dt;

      // Lifetime expiry
      if (proj.age > proj.maxLifetime) {
        this.projectiles.delete(projId);
        this.pendingEvents.push({ type: 'item-destroy', id: projId });
        continue;
      }

      // Move
      if (proj.kind === 'boost_shell') {
        this._tickBoostShell(projId, proj, dt, allKarts);
      } else if (proj.kind === 'homing_shell') {
        this._tickHomingShell(projId, proj, dt, allKarts);
      } else if (proj.kind === 'gravity_bomb') {
        this._tickGravityBomb(projId, proj, dt, allKarts);
      } else if (proj.kind === 'corrupted_shell') {
        this._tickHomingShell(projId, proj, dt, allKarts); // Same flight logic as homing
      }
    }
  }

  _tickBoostShell(projId, proj, dt, allKarts) {
    // Advance position
    proj.position.x += proj.direction.x * SHELL.BOOST_SPEED * dt;
    proj.position.y += proj.direction.y * SHELL.BOOST_SPEED * dt;
    proj.position.z += proj.direction.z * SHELL.BOOST_SPEED * dt;

    // Hit detection against all karts except owner
    for (const [kartId, kart] of allKarts) {
      if (kartId === proj.ownerId) continue;
      if (kart.isInvincible) continue;
      if (kart.finishTime !== null) continue;

      const dist = v3dist(proj.position, kart.position);
      if (dist < SHELL.HIT_RADIUS) {
        this._onShellHit(projId, proj, kartId, kart, EFFECT.STUN_DURATION);
        return;
      }
    }

    // Simple track boundary bounce (shell stays in play area)
    const limit = 80;
    let bounced = false;
    if (Math.abs(proj.position.x) > limit) {
      proj.direction.x = -proj.direction.x;
      proj.position.x = Math.sign(proj.position.x) * limit;
      bounced = true;
    }
    if (Math.abs(proj.position.z) > limit) {
      proj.direction.z = -proj.direction.z;
      proj.position.z = Math.sign(proj.position.z) * limit;
      bounced = true;
    }
    if (bounced) {
      proj.bounces++;
      if (proj.bounces > SHELL.BOOST_MAX_BOUNCES) {
        this.projectiles.delete(projId);
        this.pendingEvents.push({ type: 'item-destroy', id: projId });
      }
    }
  }

  _tickHomingShell(projId, proj, dt, allKarts) {
    // Track target
    let targetPos = null;
    if (proj.targetId && allKarts.has(proj.targetId)) {
      const target = allKarts.get(proj.targetId);
      if (target.finishTime === null && !target.isInvincible) {
        targetPos = target.position;
      }
    }

    if (targetPos) {
      // Turn toward target
      const toTarget = v3normalize(v3sub(targetPos, proj.position));
      const currentDir = v3normalize(proj.direction);

      // Blend direction toward target at HOMING_TURN_RATE
      const maxTurn = SHELL.HOMING_TURN_RATE * dt;
      const cross = currentDir.x * toTarget.z - currentDir.z * toTarget.x; // 2D cross for sign
      const dot = v3dot(currentDir, toTarget);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      const turnAmount = Math.min(angle, maxTurn);
      const sign = cross >= 0 ? 1 : -1;

      const sinT = Math.sin(turnAmount * sign);
      const cosT = Math.cos(turnAmount * sign);
      proj.direction = v3normalize({
        x: currentDir.x * cosT - currentDir.z * sinT,
        y: 0,
        z: currentDir.x * sinT + currentDir.z * cosT,
      });
    }

    const speed = proj.kind === 'corrupted_shell' ? SHELL.HOMING_SPEED : SHELL.HOMING_SPEED;
    proj.position.x += proj.direction.x * speed * dt;
    proj.position.y += proj.direction.y * speed * dt;
    proj.position.z += proj.direction.z * speed * dt;

    // Hit detection
    for (const [kartId, kart] of allKarts) {
      if (kartId === proj.ownerId) continue;
      if (kart.isInvincible) continue;
      if (kart.finishTime !== null) continue;

      const dist = v3dist(proj.position, kart.position);
      if (dist < SHELL.HIT_RADIUS) {
        if (proj.kind === 'corrupted_shell') {
          this._onCorruptedHit(projId, proj, kartId, kart);
        } else {
          this._onShellHit(projId, proj, kartId, kart, EFFECT.STUN_DURATION);
        }
        return;
      }
    }
  }

  _tickGravityBomb(projId, proj, dt, allKarts) {
    // Gravity bomb arcs forward then detonates
    proj.position.x += proj.direction.x * 25.0 * dt;
    proj.position.y += proj.verticalVelocity * dt;
    proj.position.z += proj.direction.z * 25.0 * dt;
    proj.verticalVelocity -= 20.0 * dt; // gravity

    // Detonate when it hits ground
    if (proj.position.y <= 0 && proj.verticalVelocity < 0) {
      proj.position.y = 0;
      // Blast radius
      for (const [kartId, kart] of allKarts) {
        if (kart.finishTime !== null) continue;
        if (kart.isInvincible) continue;
        const dist = v3dist(proj.position, kart.position);
        if (dist < SHELL.GRAVITY_BOMB_RADIUS) {
          this._applyStun(kartId, kart, EFFECT.LONG_STUN_DURATION);
          this.pendingEvents.push({
            type: 'item-hit',
            projectileId: projId,
            itemKind: 'gravity_bomb',
            hitPlayerId: kartId,
            position: v3copy(proj.position),
          });
        }
      }
      this.projectiles.delete(projId);
      this.pendingEvents.push({ type: 'item-destroy', id: projId, subtype: 'gravity_bomb_explode', position: v3copy(proj.position) });
    }
  }

  // -----------------------------------------------------------------------
  // Dropped items (bananas, fake item boxes)
  // -----------------------------------------------------------------------

  _updateDroppedItems(dt, allKarts) {
    for (const [itemId, item] of this.droppedItems) {
      item.age += dt;

      // Lifetime
      if (item.age > 30) {
        this.droppedItems.delete(itemId);
        this.pendingEvents.push({ type: 'item-destroy', id: itemId });
        continue;
      }

      // Hit detection
      for (const [kartId, kart] of allKarts) {
        if (kart.finishTime !== null) continue;
        if (kart.isInvincible) {
          // Star destroys dropped items on contact
          if (v3dist(kart.position, item.position) < SHELL.HIT_RADIUS * 2) {
            this.droppedItems.delete(itemId);
            this.pendingEvents.push({ type: 'item-destroy', id: itemId });
            break;
          }
          continue;
        }

        const dist = v3dist(kart.position, item.position);

        if (item.kind === 'banana_peel' && dist < SHELL.HIT_RADIUS) {
          // Owner grace period: skip for first 0.5s
          if (kartId === item.ownerId && item.age < 0.5) continue;

          this._applyStun(kartId, kart, EFFECT.BANANA_SPIN_DURATION);
          this.pendingEvents.push({ type: 'item-hit', projectileId: itemId, itemKind: 'banana_peel', hitPlayerId: kartId, position: v3copy(item.position) });
          this.droppedItems.delete(itemId);
          break;
        }

        if (item.kind === 'fake_item_box') {
          if (dist < EFFECT.FAKE_BOX_DETECT_RADIUS) {
            if (kartId === item.ownerId && item.age < 0.5) continue;
            // Explode
            for (const [kid, kk] of allKarts) {
              if (kk.finishTime !== null || kk.isInvincible) continue;
              if (v3dist(kk.position, item.position) < EFFECT.FAKE_BOX_EXPLODE_RADIUS) {
                this._applyStun(kid, kk, EFFECT.FAKE_BOX_STUN);
                this.pendingEvents.push({ type: 'item-hit', projectileId: itemId, itemKind: 'fake_item_box', hitPlayerId: kid, position: v3copy(item.position) });
              }
            }
            this.droppedItems.delete(itemId);
            this.pendingEvents.push({ type: 'item-destroy', id: itemId, subtype: 'fake_box_explode', position: v3copy(item.position) });
            break;
          }
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Fire / drop helpers
  // -----------------------------------------------------------------------

  _fireBoostShell(userId, kartState, steerOffset) {
    const heading = (kartState.rotation?.y ?? kartState.heading ?? 0) + (steerOffset || 0);
    const dir = v3normalize({ x: -Math.sin(heading), y: 0, z: -Math.cos(heading) });
    const startPos = v3add(kartState.position, v3scale(dir, 1.5));

    const id = `bshell_${uid()}`;
    this.projectiles.set(id, {
      id,
      kind: 'boost_shell',
      ownerId: userId,
      position: v3copy(startPos),
      direction: v3copy(dir),
      bounces: 0,
      maxLifetime: SHELL.BOOST_LIFETIME,
      age: 0,
    });

    this.pendingEvents.push({
      type: 'item-spawn',
      id,
      itemKind: 'boost_shell',
      ownerId: userId,
      position: v3copy(startPos),
      direction: v3copy(dir),
    });
  }

  _fireHomingShell(userId, kartState, targetId, allKarts, delay) {
    const heading = kartState.rotation?.y ?? kartState.heading ?? 0;
    const dir = v3normalize({ x: -Math.sin(heading), y: 0, z: -Math.cos(heading) });
    const startPos = v3add(kartState.position, v3scale(dir, 1.5));

    const id = `hshell_${uid()}`;
    this.projectiles.set(id, {
      id,
      kind: 'homing_shell',
      ownerId: userId,
      targetId: targetId || null,
      position: v3copy(startPos),
      direction: v3copy(dir),
      bounces: 0,
      maxLifetime: SHELL.HOMING_LIFETIME,
      age: -(delay || 0), // negative age = spawn delay
    });

    this.pendingEvents.push({
      type: 'item-spawn',
      id,
      itemKind: 'homing_shell',
      ownerId: userId,
      targetId,
      position: v3copy(startPos),
      direction: v3copy(dir),
    });
  }

  _fireGravityBomb(userId, kartState) {
    const heading = kartState.rotation?.y ?? kartState.heading ?? 0;
    const dir = v3normalize({ x: -Math.sin(heading), y: 0, z: -Math.cos(heading) });
    const startPos = v3add(kartState.position, v3scale(dir, 1.5));
    startPos.y += 1.0;

    const id = `gbomb_${uid()}`;
    this.projectiles.set(id, {
      id,
      kind: 'gravity_bomb',
      ownerId: userId,
      position: v3copy(startPos),
      direction: v3copy(dir),
      verticalVelocity: 12.0, // arc upward
      maxLifetime: 8.0,
      age: 0,
    });

    this.pendingEvents.push({
      type: 'item-spawn',
      id,
      itemKind: 'gravity_bomb',
      ownerId: userId,
      position: v3copy(startPos),
      direction: v3copy(dir),
    });
  }

  _fireCorruptedShell(userId, kartState, targetId, allKarts) {
    const heading = kartState.rotation?.y ?? kartState.heading ?? 0;
    const dir = v3normalize({ x: -Math.sin(heading), y: 0, z: -Math.cos(heading) });
    const startPos = v3add(kartState.position, v3scale(dir, 1.5));

    const id = `cshell_${uid()}`;
    this.projectiles.set(id, {
      id,
      kind: 'corrupted_shell',
      ownerId: userId,
      targetId: targetId || null,
      position: v3copy(startPos),
      direction: v3copy(dir),
      bounces: 0,
      maxLifetime: SHELL.HOMING_LIFETIME,
      age: 0,
    });

    this.pendingEvents.push({
      type: 'item-spawn',
      id,
      itemKind: 'corrupted_shell',
      ownerId: userId,
      targetId,
      position: v3copy(startPos),
      direction: v3copy(dir),
    });
  }

  _dropBanana(userId, kartState) {
    const heading = kartState.rotation?.y ?? kartState.heading ?? 0;
    const backDir = v3normalize({ x: Math.sin(heading), y: 0, z: Math.cos(heading) });
    const dropPos = v3add(kartState.position, v3scale(backDir, 1.5));

    const id = `banana_${uid()}`;
    this.droppedItems.set(id, {
      id,
      kind: 'banana_peel',
      ownerId: userId,
      position: v3copy(dropPos),
      age: 0,
    });

    this.pendingEvents.push({
      type: 'item-spawn',
      id,
      itemKind: 'banana_peel',
      ownerId: userId,
      position: v3copy(dropPos),
    });
  }

  _dropFakeItemBox(userId, kartState) {
    const heading = kartState.rotation?.y ?? kartState.heading ?? 0;
    const backDir = v3normalize({ x: Math.sin(heading), y: 0, z: Math.cos(heading) });
    const dropPos = v3add(kartState.position, v3scale(backDir, 1.5));

    const id = `fakebox_${uid()}`;
    this.droppedItems.set(id, {
      id,
      kind: 'fake_item_box',
      ownerId: userId,
      position: v3copy(dropPos),
      age: 0,
    });

    this.pendingEvents.push({
      type: 'item-spawn',
      id,
      itemKind: 'fake_item_box',
      ownerId: userId,
      position: v3copy(dropPos),
    });
  }

  // -----------------------------------------------------------------------
  // Effect application
  // -----------------------------------------------------------------------

  _applyStarEffect(userId, kartState) {
    kartState.isInvincible = true;
    kartState.invincibleTimer = EFFECT.STAR_DURATION;
    kartState.isBoosting = true;
    kartState.boostMultiplier = EFFECT.STAR_SPEED_MULT;
    kartState.boostTimer = EFFECT.STAR_DURATION;

    this.pendingEvents.push({
      type: 'effect-applied',
      effectKind: 'boost_star',
      playerId: userId,
      duration: EFFECT.STAR_DURATION,
    });
  }

  _applyLightningEffect(userId, allKarts) {
    for (const [kartId, kart] of allKarts) {
      if (kartId === userId) continue;
      if (kart.isInvincible) continue;
      if (kart.finishTime !== null) continue;

      kart.isMini = true;
      kart.miniTimer = EFFECT.LIGHTNING_SHRINK_DURATION;
      // Brief stun too
      this._applyStun(kartId, kart, EFFECT.STUN_DURATION);

      this.pendingEvents.push({
        type: 'effect-applied',
        effectKind: 'lightning_bolt',
        playerId: kartId,
        duration: EFFECT.LIGHTNING_SHRINK_DURATION,
      });
    }

    this.pendingEvents.push({
      type: 'global-effect',
      effectKind: 'lightning_bolt',
      sourcePlayerId: userId,
    });
  }

  _applyMushroomBoost(userId, kartState) {
    kartState.isBoosting = true;
    kartState.boostMultiplier = EFFECT.MUSHROOM_BOOST_MULT;
    kartState.boostTimer = EFFECT.MUSHROOM_BOOST_DURATION;

    this.pendingEvents.push({
      type: 'effect-applied',
      effectKind: 'mushroom_boost',
      playerId: userId,
      duration: EFFECT.MUSHROOM_BOOST_DURATION,
    });
  }

  _applyBooEffect(userId, kartState, allKarts, positions) {
    // Make user invisible
    kartState.isInvisible = true;
    kartState.invisibleTimer = EFFECT.BOO_INVISIBLE_DURATION;

    // Steal item from the player directly ahead
    const aheadId = this._findNextAhead(userId, positions);
    let stolenItem = null;
    if (aheadId) {
      const aheadKart = allKarts.get(aheadId);
      if (aheadKart && aheadKart.heldItem) {
        stolenItem = aheadKart.heldItem;
        aheadKart.heldItem = null;
        aheadKart.heldItemCount = 0;
      }
    }

    this.pendingEvents.push({
      type: 'effect-applied',
      effectKind: 'boo_ghost',
      playerId: userId,
      duration: EFFECT.BOO_INVISIBLE_DURATION,
      stolenFrom: aheadId,
      stolenItem,
    });

    return stolenItem;
  }

  _applyThundercloudEffect(userId, kartState, allKarts, positions) {
    // Thundercloud attaches to the user, then after duration it stuns + shrinks.
    // The user can pass it by bumping another racer.
    kartState.hasThundercloud = true;
    kartState.thundercloudTimer = EFFECT.THUNDERCLOUD_DURATION;
    kartState.thundercloudOwnerId = userId;

    this.pendingEvents.push({
      type: 'effect-applied',
      effectKind: 'thundercloud',
      playerId: userId,
      duration: EFFECT.THUNDERCLOUD_DURATION,
    });
  }

  /**
   * Called each tick for any kart that has an active thundercloud.
   * If timer expires, stun + shrink.  If the kart bumps another,
   * transfer the cloud.
   */
  tickThundercloud(kartId, kart, dt, allKarts) {
    if (!kart.hasThundercloud) return;

    kart.thundercloudTimer -= dt;

    // Check bump transfer
    for (const [otherId, other] of allKarts) {
      if (otherId === kartId) continue;
      if (other.hasThundercloud) continue;
      if (other.finishTime !== null) continue;
      if (v3dist(kart.position, other.position) < 2.0) {
        // Transfer
        kart.hasThundercloud = false;
        kart.thundercloudTimer = 0;
        other.hasThundercloud = true;
        other.thundercloudTimer = kart.thundercloudTimer > 0 ? kart.thundercloudTimer : EFFECT.THUNDERCLOUD_DURATION * 0.5;
        other.thundercloudOwnerId = kart.thundercloudOwnerId;

        this.pendingEvents.push({
          type: 'effect-applied',
          effectKind: 'thundercloud_transfer',
          fromPlayerId: kartId,
          playerId: otherId,
          duration: other.thundercloudTimer,
        });
        return;
      }
    }

    if (kart.thundercloudTimer <= 0) {
      // Strike
      kart.hasThundercloud = false;
      this._applyStun(kartId, kart, EFFECT.THUNDERCLOUD_STUN);
      kart.isMini = true;
      kart.miniTimer = EFFECT.THUNDERCLOUD_SHRINK;

      this.pendingEvents.push({
        type: 'effect-applied',
        effectKind: 'thundercloud_strike',
        playerId: kartId,
        stunDuration: EFFECT.THUNDERCLOUD_STUN,
        shrinkDuration: EFFECT.THUNDERCLOUD_SHRINK,
      });
    }
  }

  _applyStun(kartId, kart, duration) {
    kart.isStunned = true;
    kart.stunTimer = duration;
    kart.speed *= 0.3;
  }

  // -----------------------------------------------------------------------
  // Hit callbacks
  // -----------------------------------------------------------------------

  _onShellHit(projId, proj, kartId, kart, stunDuration) {
    this._applyStun(kartId, kart, stunDuration);
    this.projectiles.delete(projId);

    this.pendingEvents.push({
      type: 'item-hit',
      projectileId: projId,
      itemKind: proj.kind,
      hitPlayerId: kartId,
      ownerId: proj.ownerId,
      position: v3copy(proj.position),
    });
    this.pendingEvents.push({ type: 'item-destroy', id: projId });
  }

  _onCorruptedHit(projId, proj, kartId, kart) {
    // Corrupted shell inverts controls
    kart.isCorrupted = true;
    kart.corruptedTimer = EFFECT.CORRUPTED_INVERT_DURATION;
    this._applyStun(kartId, kart, EFFECT.STUN_DURATION * 0.5);
    this.projectiles.delete(projId);

    this.pendingEvents.push({
      type: 'item-hit',
      projectileId: projId,
      itemKind: 'corrupted_shell',
      hitPlayerId: kartId,
      ownerId: proj.ownerId,
      position: v3copy(proj.position),
    });
    this.pendingEvents.push({ type: 'item-destroy', id: projId });

    this.pendingEvents.push({
      type: 'effect-applied',
      effectKind: 'corrupted_inversion',
      playerId: kartId,
      duration: EFFECT.CORRUPTED_INVERT_DURATION,
    });
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  _findNextAhead(userId, positions) {
    const idx = positions.indexOf(userId);
    if (idx <= 0) return null; // already 1st
    return positions[idx - 1];
  }

  // -----------------------------------------------------------------------
  // Serialisation for game state broadcast
  // -----------------------------------------------------------------------

  serialiseState() {
    const projectiles = [];
    for (const [id, proj] of this.projectiles) {
      projectiles.push({
        id,
        kind: proj.kind,
        ownerId: proj.ownerId,
        targetId: proj.targetId || null,
        position: v3copy(proj.position),
        direction: v3copy(proj.direction),
      });
    }

    const droppedItems = [];
    for (const [id, item] of this.droppedItems) {
      droppedItems.push({
        id,
        kind: item.kind,
        ownerId: item.ownerId,
        position: v3copy(item.position),
      });
    }

    const itemBoxes = this.itemBoxes.map(b => ({
      id: b.id,
      position: b.position,
      active: b.active,
    }));

    return { projectiles, droppedItems, itemBoxes };
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  reset() {
    this.projectiles.clear();
    this.droppedItems.clear();
    this.itemBoxes = [];
    this.pendingEvents = [];
  }
}

module.exports = { ItemSystem, ITEM_TYPES, ITEM_DISTRIBUTION, SHELL, EFFECT, ITEM_BOX_RESPAWN_TIME };
