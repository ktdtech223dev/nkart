/**
 * ai.js — Bot AI: racing line, difficulty, rubber banding, personalities
 */

const BOT_DIFFICULTIES = {
  Easy:   { speedMult: 0.70, lineWidth: 5.0, mistakeChance: 0.08, itemAggression: 0.2 },
  Medium: { speedMult: 0.85, lineWidth: 3.0, mistakeChance: 0.03, itemAggression: 0.5 },
  Hard:   { speedMult: 0.95, lineWidth: 1.5, mistakeChance: 0.005, itemAggression: 0.8 },
  Unfair: { speedMult: 1.00, lineWidth: 0.5, mistakeChance: 0, itemAggression: 1.0 },
};

const BOT_PERSONALITIES = {
  Ghost:    { aggression: 1.0, itemSave: 0.1, riskTaking: 0.9, consistency: 0.7 },
  Clutch:   { aggression: 0.3, itemSave: 0.8, riskTaking: 0.3, consistency: 0.9 },
  Wildcard: { aggression: 0.6, itemSave: 0.3, riskTaking: 0.8, consistency: 0.3 },
  Rookie:   { aggression: 0.1, itemSave: 0.5, riskTaking: 0.1, consistency: 1.0 },
};

const DIFFICULTY_PERSONALITIES = {
  Easy:   ['Rookie', 'Rookie', 'Wildcard'],
  Medium: ['Rookie', 'Clutch', 'Clutch', 'Wildcard'],
  Hard:   ['Ghost', 'Ghost', 'Clutch', 'Wildcard'],
  Unfair: ['Ghost', 'Ghost', 'Ghost', 'Clutch'],
};

const BOT_NAMES = [
  'Blaze', 'Nitro', 'Spark', 'Shadow', 'Ace', 'Dash', 'Fury', 'Drift',
  'Flash', 'Storm', 'Turbo', 'Viper', 'Ghost', 'Clutch', 'Bolt',
];

class BotAI {
  constructor(kart, difficulty, personalityName, track) {
    this.kart = kart;
    this.difficulty = difficulty;
    this.config = BOT_DIFFICULTIES[difficulty];
    this.personality = BOT_PERSONALITIES[personalityName];
    this.personalityName = personalityName;
    this.track = track;
    this.waypoints = track.waypoints || [];
    this.currentWaypoint = 0;
    this.name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    this.mistakeTimer = 0;
    this.mistakeSteer = 0;
    this.itemUseTimer = 0;
  }

  update(dt, allKarts, raceTime) {
    if (this.kart.finished || this.kart.frozen || this.kart.spinOutTimer > 0) return;

    const wp = this._getCurrentWaypoint();
    if (!wp) return;

    // Direction to waypoint
    const dx = wp[0] - this.kart.position.x;
    const dz = wp[2] - this.kart.position.z;
    const targetAngle = Math.atan2(-dx, -dz);
    let angleDiff = targetAngle - this.kart.rotation;

    // Normalize angle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Add line width variation
    const wobble = (Math.random() - 0.5) * this.config.lineWidth * 0.01;
    angleDiff += wobble;

    // Steering
    let steer = 0;
    if (angleDiff > 0.05) steer = Math.min(1, angleDiff * 2);
    else if (angleDiff < -0.05) steer = Math.max(-1, angleDiff * 2);

    // Mistakes
    this.mistakeTimer -= dt;
    if (this.mistakeTimer <= 0 && Math.random() < this.config.mistakeChance) {
      this.mistakeTimer = 0.3 + Math.random() * 0.5;
      this.mistakeSteer = (Math.random() - 0.5) * 0.5;
    }
    if (this.mistakeTimer > 0) {
      steer += this.mistakeSteer;
    }

    // Throttle — always go unless sharp turn
    let throttle = this.config.speedMult;
    if (Math.abs(angleDiff) > 0.8) throttle *= 0.6;

    // Rubber banding (Easy + Medium only)
    if (this.difficulty === 'Easy' || this.difficulty === 'Medium') {
      const leader = allKarts.reduce((a, b) => a.raceProgress > b.raceProgress ? a : b);
      const timeBehind = (leader.raceProgress - this.kart.raceProgress) * 100; // rough estimate
      if (timeBehind > 10) throttle = Math.min(1, throttle + 0.05);
      const pack = allKarts.reduce((sum, k) => sum + k.raceProgress, 0) / allKarts.length;
      if (this.kart.raceProgress - pack > 0.15) throttle *= 0.95;
    }

    // Brake for drift on sharp turns
    let brake = 0;
    if (Math.abs(angleDiff) > 1.2 && this.kart.speed > 20) {
      brake = 0.6;
    }

    // Item usage
    this._handleItems(dt, allKarts, steer);

    // Apply inputs to kart
    this.kart.update(dt, steer, throttle, brake, this.track);

    // Advance waypoint
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 8) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
    }

    // Update race progress
    this.kart.raceProgress = this.track.getProgress(this.kart.position) + this.kart.lap;
  }

  _getCurrentWaypoint() {
    if (this.waypoints.length === 0) return null;
    return this.waypoints[this.currentWaypoint % this.waypoints.length];
  }

  _handleItems(dt, allKarts, steer) {
    if (!this.kart.currentItem) return;

    this.itemUseTimer -= dt;
    if (this.itemUseTimer > 0) return;

    const item = this.kart.currentItem;
    const useChance = this.config.itemAggression * (1 - this.personality.itemSave);

    // Clutch personality saves items for key moments
    if (this.personalityName === 'Clutch' && this.kart.position_rank > 3) {
      this.itemUseTimer = 2;
      return;
    }

    // Ghost uses items aggressively when near other karts
    if (Math.random() < useChance * dt * 2) {
      // Decide whether to use
      if (item.id === 'shield') {
        // Hold shield, don't use proactively
        return;
      }
      this.kart.currentItem = null;
      this.kart.itemCount = 0;
      this.kart.itemsUsed++;
      // The actual item effect will be handled by the race manager
      this.itemUseTimer = 1 + Math.random() * 3;
    }
  }
}

/**
 * Create bots for a race
 */
function createBots(count, difficulty, track, availableCars, speedClass) {
  const bots = [];
  const personalities = DIFFICULTY_PERSONALITIES[difficulty] || DIFFICULTY_PERSONALITIES.Medium;

  for (let i = 0; i < count; i++) {
    const carDef = availableCars[i % availableCars.length];
    const kart = new Kart(carDef, carDef.defaultColor, speedClass);
    const personalityName = personalities[i % personalities.length];
    const ai = new BotAI(kart, difficulty, personalityName, track);
    bots.push(ai);
  }

  return bots;
}
