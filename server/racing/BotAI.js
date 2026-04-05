const DIFFICULTY = {
  easy:   { speedMult: 0.70, steerNoise: 0.15, itemUseRate: 0.30 },
  medium: { speedMult: 0.85, steerNoise: 0.08, itemUseRate: 0.60 },
  hard:   { speedMult: 0.95, steerNoise: 0.03, itemUseRate: 0.90 },
  max:    { speedMult: 1.00, steerNoise: 0.01, itemUseRate: 1.00 },
};

const RUBBER_BAND = {
  far_ahead:  0.85,  // Positions 1-2
  midfield:   1.00,  // Positions 3-5
  far_behind: 1.10,  // Positions 6-8
};

class BotAI {
  static generateInput(bot, race) {
    const diff = DIFFICULTY[bot.difficulty] || DIFFICULTY.medium;
    const input = { throttle: 1.0, brake: 0, steer: 0, drift: false, useItem: false };

    // Rubber banding
    let rubberBand = RUBBER_BAND.midfield;
    if (bot.racePosition <= 2) rubberBand = RUBBER_BAND.far_ahead;
    else if (bot.racePosition >= 6) rubberBand = RUBBER_BAND.far_behind;

    // Waypoint steering
    if (race.waypointPath && race.waypointPath.length > 0) {
      const target = this._getTargetWaypoint(bot, race.waypointPath, diff);
      input.steer = this._steerToward(bot, target, diff);
    } else {
      // Simple oval fallback — steer in a circle
      input.steer = this._simpleCircleSteer(bot, diff);
    }

    // Throttle control near sharp turns
    if (Math.abs(input.steer) > 0.6) {
      input.throttle = 0.7;
    }

    // Drift on sharp corners
    if (Math.abs(input.steer) > 0.5 && bot.speed > 12) {
      input.drift = true;
    }

    // Item usage
    if (bot.itemState && Math.random() < diff.itemUseRate * 0.02) {
      input.useItem = true;
    }

    // Apply speed multiplier via throttle modulation
    input.throttle *= diff.speedMult * rubberBand;

    return input;
  }

  static _getTargetWaypoint(bot, waypoints, diff) {
    // Find nearest waypoint
    let minDist = Infinity;
    let nearestIdx = 0;
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const dx = bot.position.x - wp.x;
      const dz = bot.position.z - wp.z;
      const dist = dx * dx + dz * dz;
      if (dist < minDist) { minDist = dist; nearestIdx = i; }
    }

    // Look ahead based on difficulty
    const lookAhead = diff === DIFFICULTY.easy ? 3 : diff === DIFFICULTY.max ? 6 : 4;
    const targetIdx = (nearestIdx + lookAhead) % waypoints.length;
    return waypoints[targetIdx];
  }

  static _steerToward(bot, target, diff) {
    const dx = target.x - bot.position.x;
    const dz = target.z - bot.position.z;
    const targetAngle = Math.atan2(-dx, -dz);
    let angleDiff = targetAngle - bot.rotation.y;

    // Normalize to -PI..PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Add noise
    angleDiff += (Math.random() - 0.5) * diff.steerNoise;

    // Clamp to -1..1
    return Math.max(-1, Math.min(1, angleDiff * 2));
  }

  static _simpleCircleSteer(bot, diff) {
    // Default: steer in a large oval
    const targetAngle = Math.atan2(-bot.position.x, -bot.position.z) + Math.PI / 2;
    let angleDiff = targetAngle - bot.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    angleDiff += (Math.random() - 0.5) * diff.steerNoise;
    return Math.max(-1, Math.min(1, angleDiff * 1.5));
  }
}

module.exports = { BotAI };
