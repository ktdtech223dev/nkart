/**
 * items.js — Item box system, all 10 items
 */

const ITEM_TYPES = {
  RED_SHELL:    { id: 'red_shell',    emoji: '\ud83d\udd34', name: 'Red Shell' },
  GREEN_SHELL:  { id: 'green_shell',  emoji: '\ud83d\udfe2', name: 'Green Shell' },
  BANANA:       { id: 'banana',       emoji: '\ud83c\udf4c', name: 'Banana' },
  STAR:         { id: 'star',         emoji: '\u2b50',       name: 'Star' },
  BOMB:         { id: 'bomb',         emoji: '\ud83d\udca3', name: 'Bob-omb' },
  FREEZE:       { id: 'freeze',       emoji: '\u2744\ufe0f', name: 'Freeze Ray' },
  LIGHTNING:    { id: 'lightning',     emoji: '\u26a1',       name: 'Lightning' },
  BLUE_SHELL:   { id: 'blue_shell',   emoji: '\ud83d\udc99', name: 'Blue Shell' },
  SHIELD:       { id: 'shield',       emoji: '\ud83d\udee1\ufe0f', name: 'Shield' },
  ROCKET:       { id: 'rocket',       emoji: '\ud83d\ude80', name: 'Rocket' },
};

// Item weights by position (1st through 8th)
const ITEM_WEIGHTS = {
  red_shell:   [15, 15, 12, 10,  8,  6,  4,  3],
  green_shell: [20, 18, 15, 12, 10,  8,  6,  5],
  banana:      [25, 20, 15, 12, 10,  8,  5,  3],
  star:        [ 0,  2,  5,  8, 12, 15, 12, 10],
  bomb:        [ 2,  5,  8, 10, 12, 12, 10,  8],
  freeze:      [ 3,  5,  8, 10, 12, 12, 10,  8],
  lightning:   [ 0,  0,  0,  2,  4,  8, 15, 20],
  blue_shell:  [ 0,  0,  0,  0,  2,  5, 12, 18],
  shield:      [20, 18, 15, 12,  8,  5,  3,  2],
  rocket:      [ 0,  0,  2,  4,  8, 12, 18, 23],
};

const ITEM_PRESETS = {
  'Normal':        null, // use default weights
  'No Blue Shell': { exclude: ['blue_shell'] },
  'Shells Only':   { only: ['red_shell', 'green_shell', 'banana'] },
  'Chaos':         { multiplier: 2, guaranteeLightning: 45 },
  'No Items':      { disabled: true },
};

class ItemSystem {
  constructor(scene, preset = 'Normal') {
    this.scene = scene;
    this.preset = preset;
    this.presetConfig = ITEM_PRESETS[preset];
    this.itemBoxes = [];       // visual item box meshes
    this.itemBoxData = [];     // positions for respawn
    this.activeProjectiles = []; // shells, bombs on track
    this.droppedItems = [];    // bananas, etc on track
    this.lastLightning = 0;
  }

  spawnItemBoxes(positions) {
    if (this.presetConfig && this.presetConfig.disabled) return;

    const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xffdd44,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85,
    });

    for (const pos of positions) {
      const box = new THREE.Mesh(boxGeo, boxMat.clone());
      box.position.set(pos[0], 1.5, pos[2] || pos[1]);
      box.userData = { active: true, respawnTimer: 0 };
      this.scene.add(box);
      this.itemBoxes.push(box);
      this.itemBoxData.push([pos[0], pos[2] || pos[1]]);
    }
  }

  update(dt, karts, raceTime) {
    if (this.presetConfig && this.presetConfig.disabled) return;

    // Rotate item boxes
    for (const box of this.itemBoxes) {
      if (box.userData.active) {
        box.rotation.y += 1.5 * dt;
        box.rotation.x += 0.5 * dt;
        box.position.y = 1.5 + Math.sin(raceTime * 2 + box.position.x) * 0.3;
      } else {
        box.userData.respawnTimer -= dt;
        if (box.userData.respawnTimer <= 0) {
          box.userData.active = true;
          box.visible = true;
        }
      }
    }

    // Check kart-itembox collisions
    for (const kart of karts) {
      if (kart.currentItem) continue; // already has item
      for (const box of this.itemBoxes) {
        if (!box.userData.active) continue;
        const dx = kart.position.x - box.position.x;
        const dz = kart.position.z - box.position.z;
        if (dx * dx + dz * dz < 2.5) {
          // Hit item box
          box.userData.active = false;
          box.visible = false;
          box.userData.respawnTimer = 5;
          kart.currentItem = this._rollItem(kart.position_rank, karts.length);
          kart.itemCount = 1;
        }
      }
    }

    // Update projectiles
    this._updateProjectiles(dt, karts);
    this._updateDroppedItems(dt, karts);
  }

  _rollItem(position, totalRacers) {
    const posIdx = Math.min(position - 1, 7);
    let pool = Object.keys(ITEM_WEIGHTS);

    // Apply preset filters
    if (this.presetConfig) {
      if (this.presetConfig.exclude) {
        pool = pool.filter(id => !this.presetConfig.exclude.includes(id));
      }
      if (this.presetConfig.only) {
        pool = this.presetConfig.only.slice();
      }
    }

    // Build weighted array
    let totalWeight = 0;
    const weights = [];
    for (const id of pool) {
      let w = ITEM_WEIGHTS[id][posIdx] || 0;
      if (this.presetConfig && this.presetConfig.multiplier) w *= this.presetConfig.multiplier;
      weights.push({ id, w });
      totalWeight += w;
    }

    // Roll
    let roll = Math.random() * totalWeight;
    for (const { id, w } of weights) {
      roll -= w;
      if (roll <= 0) {
        return ITEM_TYPES[id.toUpperCase()] || ITEM_TYPES.GREEN_SHELL;
      }
    }
    return ITEM_TYPES.GREEN_SHELL;
  }

  useItem(kart, karts, facing) {
    if (!kart.currentItem) return;
    const item = kart.currentItem;
    kart.currentItem = null;
    kart.itemCount = 0;
    kart.itemsUsed++;

    switch (item.id) {
      case 'red_shell':
        this._fireRedShell(kart, karts);
        break;
      case 'green_shell':
        this._fireGreenShell(kart, facing);
        break;
      case 'banana':
        this._dropBanana(kart);
        break;
      case 'star':
        kart.activateStar(10);
        break;
      case 'bomb':
        this._dropBomb(kart);
        break;
      case 'freeze':
        this._fireFreeze(kart, karts);
        break;
      case 'lightning':
        this._fireLightning(kart, karts);
        break;
      case 'blue_shell':
        this._fireBlueShell(kart, karts);
        break;
      case 'shield':
        kart.shielded = true;
        break;
      case 'rocket':
        kart.applyBoost(1.5, 5);
        break;
    }
  }

  _fireRedShell(source, karts) {
    // Find kart directly ahead
    let target = null;
    let bestRank = source.position_rank;
    for (const k of karts) {
      if (k === source) continue;
      if (k.position_rank < bestRank && (!target || k.position_rank > target.position_rank)) {
        target = k;
      }
    }
    if (!target) {
      // If in 1st, fire forward like green shell
      this._fireGreenShell(source, 1);
      return;
    }
    this.activeProjectiles.push({
      type: 'red_shell',
      pos: source.position.clone(),
      target,
      speed: 50,
      lifetime: 10,
      mesh: this._createShellMesh(0xff2222),
    });
    this.scene.add(this.activeProjectiles[this.activeProjectiles.length - 1].mesh);
  }

  _fireGreenShell(source, facing) {
    const dir = new THREE.Vector3(-Math.sin(source.rotation), 0, -Math.cos(source.rotation));
    if (facing < 0) dir.negate(); // fire backward
    this.activeProjectiles.push({
      type: 'green_shell',
      pos: source.position.clone(),
      dir: dir.normalize(),
      speed: 60,
      lifetime: 8,
      bounces: 0,
      mesh: this._createShellMesh(0x22ff22),
    });
    this.scene.add(this.activeProjectiles[this.activeProjectiles.length - 1].mesh);
  }

  _dropBanana(source) {
    const behind = new THREE.Vector3(Math.sin(source.rotation), 0, Math.cos(source.rotation));
    const pos = source.position.clone().add(behind.multiplyScalar(2));
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xffdd00 })
    );
    mesh.position.copy(pos);
    mesh.position.y = 0.4;
    this.scene.add(mesh);
    this.droppedItems.push({ type: 'banana', pos: pos.clone(), mesh, radius: 1.2 });
  }

  _dropBomb(source) {
    const behind = new THREE.Vector3(Math.sin(source.rotation), 0, Math.cos(source.rotation));
    const pos = source.position.clone().add(behind.multiplyScalar(2));
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    mesh.position.copy(pos);
    mesh.position.y = 0.5;
    this.scene.add(mesh);
    this.droppedItems.push({ type: 'bomb', pos: pos.clone(), mesh, radius: 5, timer: 3 });
  }

  _fireFreeze(source, karts) {
    // Freeze kart directly ahead
    let target = null;
    let bestRank = source.position_rank;
    for (const k of karts) {
      if (k === source) continue;
      if (k.position_rank < bestRank && (!target || k.position_rank > target.position_rank)) {
        target = k;
      }
    }
    if (target) {
      target.freeze(3);
      target.timesHit++;
      source.hitsLanded++;
    }
  }

  _fireLightning(source, karts) {
    for (const k of karts) {
      if (k === source) continue;
      k.shrink(5);
      k.timesHit++;
    }
    source.hitsLanded += karts.length - 1;
  }

  _fireBlueShell(source, karts) {
    // Target 1st place
    let target = null;
    for (const k of karts) {
      if (k.position_rank === 1) { target = k; break; }
    }
    if (!target || target === source) return;
    this.activeProjectiles.push({
      type: 'blue_shell',
      pos: source.position.clone(),
      target,
      speed: 45,
      lifetime: 15,
      mesh: this._createShellMesh(0x4488ff),
    });
    this.scene.add(this.activeProjectiles[this.activeProjectiles.length - 1].mesh);
  }

  _createShellMesh(color) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
    );
    return mesh;
  }

  _updateProjectiles(dt, karts) {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      proj.lifetime -= dt;
      if (proj.lifetime <= 0) {
        this.scene.remove(proj.mesh);
        this.activeProjectiles.splice(i, 1);
        continue;
      }

      if (proj.type === 'red_shell' || proj.type === 'blue_shell') {
        // Homing
        if (proj.target) {
          const toTarget = proj.target.position.clone().sub(proj.pos).normalize();
          proj.pos.add(toTarget.multiplyScalar(proj.speed * dt));
          // Check hit
          const dist = proj.pos.distanceTo(proj.target.position);
          if (dist < 1.5) {
            proj.target.hitByItem();
            proj.target.timesHit++;
            this.scene.remove(proj.mesh);
            this.activeProjectiles.splice(i, 1);
            continue;
          }
        }
      } else if (proj.type === 'green_shell') {
        proj.pos.add(proj.dir.clone().multiplyScalar(proj.speed * dt));
        // Check hit against all karts
        for (const k of karts) {
          const dist = proj.pos.distanceTo(k.position);
          if (dist < 1.5) {
            k.hitByItem();
            this.scene.remove(proj.mesh);
            this.activeProjectiles.splice(i, 1);
            break;
          }
        }
      }

      if (proj.mesh) {
        proj.mesh.position.copy(proj.pos);
        proj.mesh.position.y = 0.5;
        proj.mesh.rotation.y += 10 * dt;
      }
    }
  }

  _updateDroppedItems(dt, karts) {
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];

      // Bomb timer
      if (item.type === 'bomb' && item.timer !== undefined) {
        item.timer -= dt;
        if (item.timer <= 0) {
          // Explode — hit nearby karts
          for (const k of karts) {
            const dist = item.pos.distanceTo(k.position);
            if (dist < item.radius) {
              k.hitByItem();
            }
          }
          this.scene.remove(item.mesh);
          this.droppedItems.splice(i, 1);
          continue;
        }
      }

      // Check kart collision
      for (const k of karts) {
        const dx = k.position.x - item.pos.x;
        const dz = k.position.z - item.pos.z;
        if (dx * dx + dz * dz < item.radius * item.radius) {
          if (item.type === 'banana') {
            k.hitByItem();
          } else if (item.type === 'bomb') {
            // Triggered explosion
            for (const k2 of karts) {
              if (k2.position.distanceTo(item.pos) < item.radius) {
                k2.hitByItem();
              }
            }
          }
          this.scene.remove(item.mesh);
          this.droppedItems.splice(i, 1);
          break;
        }
      }
    }
  }

  cleanup() {
    for (const box of this.itemBoxes) this.scene.remove(box);
    for (const proj of this.activeProjectiles) this.scene.remove(proj.mesh);
    for (const item of this.droppedItems) this.scene.remove(item.mesh);
    this.itemBoxes = [];
    this.activeProjectiles = [];
    this.droppedItems = [];
  }
}
