const { BotAI } = require('./BotAI');
const { ItemSystem } = require('./ItemSystem.js');

const SERVER_TICK_RATE = 20;
const TICK_INTERVAL = 1000 / SERVER_TICK_RATE;

class RaceManager {
  constructor(io) {
    this.io = io;
    this.activeRaces = new Map();
  }

  startRace(roomId, room) {
    const itemSystem = new ItemSystem();

    const race = {
      roomId,
      trackId: room.trackId,
      tick: 0,
      startTime: room.raceStartTime,
      players: new Map(),
      bots: new Map(),
      itemSystem,
      hazards: room.hazards || [],
      finished: false,
      results: [],
      inputQueues: new Map(),
      lapCount: room.lapCount || 3,
    };

    // Init player states
    let slotIndex = 0;
    for (const [id, p] of room.players) {
      race.players.set(id, this._createRacerState(id, p.name, slotIndex++, false));
      race.inputQueues.set(id, []);
    }
    for (const [id, b] of room.bots) {
      race.bots.set(id, this._createRacerState(id, b.name, slotIndex++, true, b.difficulty));
    }

    this.activeRaces.set(roomId, race);

    // Start tick loop
    race.tickInterval = setInterval(() => this._tick(roomId), TICK_INTERVAL);
  }

  _createRacerState(id, name, slot, isBot, difficulty) {
    const angle = (slot / 8) * 0.05;
    const col = slot % 2;
    const row = Math.floor(slot / 2);
    return {
      id,
      name,
      isBot,
      difficulty: difficulty || 'medium',
      position: { x: (col === 0 ? -2 : 2), y: 0.4, z: -row * 3 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      speed: 0,
      stunned: false,
      stunTimer: 0,
      mini: false,
      miniTimer: 0,
      invincible: false,
      invincibleTimer: 0,
      corrupted: false,
      corruptedTimer: 0,
      boosting: false,
      boostTimer: 0,
      boostMult: 1,
      lapCount: 0,
      currentCheckpoint: 0,
      racePosition: slot + 1,
      finished: false,
      finishTime: null,
      itemState: null,
      itemCount: 0,
      driftState: 'none',
      slot,
    };
  }

  queueInput(roomId, socketId, input) {
    const race = this.activeRaces.get(roomId);
    if (!race) return;
    const queue = race.inputQueues.get(socketId);
    if (queue) {
      queue.push(input);
      if (queue.length > 10) queue.shift();
    }
  }

  _tick(roomId) {
    const race = this.activeRaces.get(roomId);
    if (!race || race.finished) return;

    race.tick++;
    const dt = 1 / SERVER_TICK_RATE;
    const now = Date.now();

    if (now < race.startTime) return; // Still in countdown

    // 1. Process player inputs
    for (const [id, racer] of race.players) {
      const queue = race.inputQueues.get(id);
      const input = queue && queue.length > 0 ? queue.shift() : { throttle: 0, brake: 0, steer: 0, drift: false };
      this._updateRacer(racer, input, dt);
    }

    // 2. Update bot AI
    for (const [id, bot] of race.bots) {
      const input = BotAI.generateInput(bot, race);
      this._updateRacer(bot, input, dt);
    }

    // 3. Item collection, usage, and projectile ticks
    this._tickItems(race, dt);

    // 4. Kart-kart collisions
    this._resolveCollisions(race);

    // 5. Update race positions
    this._updatePositions(race);

    // 6. Check finishes
    this._checkFinishes(race);

    // 7. Broadcast state
    this._broadcastState(race);
  }

  _updateRacer(racer, input, dt) {
    // Timers
    if (racer.stunned) {
      racer.stunTimer -= dt;
      if (racer.stunTimer <= 0) { racer.stunned = false; racer.stunTimer = 0; }
      return;
    }
    if (racer.mini) {
      racer.miniTimer -= dt;
      if (racer.miniTimer <= 0) { racer.mini = false; racer.miniTimer = 0; }
    }
    if (racer.invincible) {
      racer.invincibleTimer -= dt;
      if (racer.invincibleTimer <= 0) { racer.invincible = false; racer.invincibleTimer = 0; }
    }
    if (racer.boosting) {
      racer.boostTimer -= dt;
      if (racer.boostTimer <= 0) { racer.boosting = false; racer.boostTimer = 0; racer.boostMult = 1; }
    }

    // Speed
    let maxSpeed = 28.0;
    if (racer.mini) maxSpeed *= 0.65;
    if (racer.boosting) maxSpeed *= racer.boostMult;

    if (racer.isBot) {
      const diffMult = { easy: 0.70, medium: 0.85, hard: 0.95, max: 1.0 }[racer.difficulty] || 0.85;
      maxSpeed *= diffMult;
    }

    if (input.throttle > 0 && racer.speed < maxSpeed) {
      racer.speed += 18.0 * input.throttle * dt;
      racer.speed = Math.min(racer.speed, maxSpeed);
    } else if (input.brake > 0) {
      racer.speed -= 24.0 * input.brake * dt;
      racer.speed = Math.max(racer.speed, 0);
    } else {
      racer.speed -= 8.0 * dt;
      racer.speed = Math.max(racer.speed, 0);
    }

    // Steering
    const speedRatio = Math.min(1, racer.speed / 28.0);
    const turnReduction = 1 - speedRatio * 0.4;
    racer.rotation.y -= input.steer * 2.8 * turnReduction * dt;

    // Movement
    const fx = -Math.sin(racer.rotation.y);
    const fz = -Math.cos(racer.rotation.y);
    racer.position.x += fx * racer.speed * dt;
    racer.position.z += fz * racer.speed * dt;
  }

  _tickItems(race, dt) {
    const allKarts = new Map();
    const positions = [];
    const allRacers = [...race.players.values(), ...race.bots.values()]
      .sort((a, b) => a.racePosition - b.racePosition);

    for (const r of allRacers) {
      allKarts.set(r.id, r);
      positions.push(r.id);
    }

    // Check item box collection for each racer
    for (const [id, racer] of allKarts) {
      if (racer.finished || racer.stunned) continue;
      if (racer.itemState) continue; // already holding an item

      const collected = race.itemSystem.checkItemBoxCollection(racer.position, 0.8);
      if (collected) {
        racer.itemState = race.itemSystem.rollItem(racer.racePosition);
        racer.itemCount = racer.itemState === 'triple_mushroom' ? 3 : 1;
        this.io.to(race.roomId).emit('item:collected', {
          playerId: id,
          boxId: collected.id,
          itemType: racer.itemState,
        });
      }
    }

    // Bot AI item usage
    for (const [id, bot] of race.bots) {
      if (bot.itemState && !bot.stunned && !bot.finished) {
        const useChance = { easy: 0.005, medium: 0.01, hard: 0.02, max: 0.03 }[bot.difficulty] || 0.01;
        if (Math.random() < useChance) {
          const result = race.itemSystem.useItem(id, bot.itemState, bot, allKarts, positions);
          if (result.consumed) {
            if (bot.itemState === 'triple_mushroom') {
              bot.itemCount--;
              if (bot.itemCount <= 0) { bot.itemState = null; bot.itemCount = 0; }
            } else {
              bot.itemState = null;
              bot.itemCount = 0;
            }
          }
        }
      }
    }

    // Tick thunderclouds
    for (const [id, racer] of allKarts) {
      race.itemSystem.tickThundercloud(id, racer, dt, allKarts);
    }

    // Update projectiles and dropped items
    const events = race.itemSystem.update(dt, allKarts);

    // Broadcast item events
    for (const event of events) {
      this.io.to(race.roomId).emit('item:event', event);
    }
  }

  _resolveCollisions(race) {
    const allRacers = [...race.players.values(), ...race.bots.values()];
    for (let i = 0; i < allRacers.length; i++) {
      for (let j = i + 1; j < allRacers.length; j++) {
        const a = allRacers[i];
        const b = allRacers[j];
        const dx = a.position.x - b.position.x;
        const dz = a.position.z - b.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5 && dist > 0.01) {
          const nx = dx / dist;
          const nz = dz / dist;
          const push = (1.5 - dist) / 2;
          a.position.x += nx * push;
          a.position.z += nz * push;
          b.position.x -= nx * push;
          b.position.z -= nz * push;

          if (!a.isBot && !b.isBot) {
            this.io.to(a.id).emit('player:collision', { pushX: nx * push, pushZ: nz * push });
            this.io.to(b.id).emit('player:collision', { pushX: -nx * push, pushZ: -nz * push });
          }
        }
      }
    }
  }

  _updatePositions(race) {
    const allRacers = [...race.players.values(), ...race.bots.values()];
    allRacers.sort((a, b) => {
      const scoreA = a.lapCount * 100 + a.currentCheckpoint;
      const scoreB = b.lapCount * 100 + b.currentCheckpoint;
      return scoreB - scoreA;
    });
    for (let i = 0; i < allRacers.length; i++) {
      allRacers[i].racePosition = i + 1;
    }
  }

  _checkFinishes(race) {
    const allFinished = [...race.players.values(), ...race.bots.values()].every(r => r.finished);
    if (allFinished && !race.finished) {
      race.finished = true;
      clearInterval(race.tickInterval);
      this.io.to(race.roomId).emit('race:end', { results: race.results });
    }
  }

  _broadcastState(race) {
    const players = [];
    for (const [, r] of race.players) {
      players.push({
        id: r.id, position: r.position, velocity: r.velocity, rotation: r.rotation,
        speed: r.speed, stunned: r.stunned, mini: r.mini, invincible: r.invincible,
        lapCount: r.lapCount, racePosition: r.racePosition, itemState: r.itemState,
      });
    }
    for (const [, r] of race.bots) {
      players.push({
        id: r.id, position: r.position, velocity: r.velocity, rotation: r.rotation,
        speed: r.speed, stunned: r.stunned, mini: r.mini, invincible: r.invincible,
        lapCount: r.lapCount, racePosition: r.racePosition, itemState: r.itemState,
      });
    }

    // Include item state in broadcast
    const itemState = race.itemSystem.serialiseState();
    this.io.to(race.roomId).emit('game:state', { players, items: itemState, tick: race.tick });
  }

  handleItemUse(roomId, socketId) {
    const race = this.activeRaces.get(roomId);
    if (!race) return;

    const racer = race.players.get(socketId);
    if (!racer || !racer.itemState || racer.stunned || racer.finished) return;

    const allKarts = new Map();
    const positions = [];
    const allRacers = [...race.players.values(), ...race.bots.values()]
      .sort((a, b) => a.racePosition - b.racePosition);
    for (const r of allRacers) {
      allKarts.set(r.id, r);
      positions.push(r.id);
    }

    const result = race.itemSystem.useItem(socketId, racer.itemState, racer, allKarts, positions);
    if (result.consumed) {
      if (racer.itemState === 'triple_mushroom') {
        racer.itemCount--;
        if (racer.itemCount <= 0) { racer.itemState = null; racer.itemCount = 0; }
      } else {
        racer.itemState = null;
        racer.itemCount = 0;
      }
    }
  }

  handleCheckpoint(roomId, socketId, checkpointIndex) {
    const race = this.activeRaces.get(roomId);
    if (!race) return;

    const racer = race.players.get(socketId);
    if (!racer || racer.finished) return;

    // Validate sequential checkpoint crossing
    if (checkpointIndex === racer.currentCheckpoint + 1 ||
        (checkpointIndex === 0 && racer.currentCheckpoint >= 0)) {
      if (checkpointIndex === 0 && racer.currentCheckpoint > 0) {
        // Completed a lap
        racer.lapCount++;
        if (racer.lapCount >= race.lapCount) {
          racer.finished = true;
          racer.finishTime = Date.now() - race.startTime;
          race.results.push({
            id: racer.id,
            name: racer.name,
            position: race.results.length + 1,
            finishTime: racer.finishTime,
          });
          this.io.to(race.roomId).emit('race:playerFinished', {
            playerId: racer.id,
            position: race.results.length,
            finishTime: racer.finishTime,
          });
        }
      }
      racer.currentCheckpoint = checkpointIndex;
    }
  }

  endRace(roomId) {
    const race = this.activeRaces.get(roomId);
    if (!race) return;
    race.finished = true;
    clearInterval(race.tickInterval);
    this.activeRaces.delete(roomId);
  }
}

module.exports = { RaceManager };
