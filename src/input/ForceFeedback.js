const FF_RATE_LIMIT = 60;
const FF_INTERVAL = 1000 / FF_RATE_LIMIT;

export class ForceFeedback {
  constructor() {
    this.available = !!(window.electronAPI && window.electronAPI.sendG920FF);
    this.lastSendTime = 0;
    this.pendingCommand = null;
    this.collisionCooldown = 0;
  }

  sendFF(type, params) {
    if (!this.available) return;

    const now = performance.now();
    if (now - this.lastSendTime < FF_INTERVAL) {
      this.pendingCommand = { type, params };
      return;
    }

    this.lastSendTime = now;
    this.pendingCommand = null;
    window.electronAPI.sendG920FF({ type, ...params });
  }

  flush() {
    if (this.pendingCommand) {
      this.sendFF(this.pendingCommand.type, this.pendingCommand.params);
    }
  }

  spring(coefficient) {
    this.sendFF('FF_SPRING', { coefficient });
  }

  constant(force) {
    this.sendFF('FF_CONSTANT', { force });
  }

  rumble(magnitude, duration) {
    this.sendFF('FF_RUMBLE', { magnitude, duration });
  }

  // Collision impact feedback
  onCollision(impactForce) {
    if (this.collisionCooldown > 0) return;
    this.collisionCooldown = 0.3;
    const mag = Math.min(1.0, impactForce);
    this.rumble(mag, 0.15);
    this.constant(impactForce > 0.5 ? 0.4 : 0.2);
  }

  // Wall scrape feedback
  onWallScrape(side) {
    this.constant(side === 'left' ? -0.3 : 0.3);
    this.rumble(0.25, 0.05);
  }

  // Item hit feedback
  onItemHit(itemType) {
    switch (itemType) {
      case 'boost_shell':
      case 'homing_shell':
      case 'corrupted_shell':
        this.rumble(0.9, 0.4);
        break;
      case 'banana_peel':
        this.rumble(0.6, 0.3);
        this.constant(Math.random() > 0.5 ? -0.5 : 0.5);
        break;
      case 'lightning_bolt':
        this.rumble(0.7, 0.6);
        break;
      case 'gravity_bomb':
        this.rumble(1.0, 0.5);
        break;
      default:
        this.rumble(0.5, 0.3);
    }
  }

  // Boost feedback
  onBoostStart() {
    this.rumble(0.4, 0.3);
    this.spring(0.1);
  }

  // Drift boost release feedback
  onDriftBoost(level) {
    const mag = 0.3 + level * 0.2;
    this.rumble(mag, 0.2);
  }

  updateFromKartState(kartState) {
    if (!this.available) return;

    // Update cooldowns
    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= 1 / 60;
    }

    // Stunned — strong rumble
    if (kartState.stunTimer > 0) {
      this.rumble(0.8, 0.1);
      return;
    }

    // Invincible star — continuous light vibration
    if (kartState.invincibleTimer > 0) {
      this.rumble(0.3, 0.05);
      this.spring(0.1);
      return;
    }

    // Boosting
    if (kartState.boostTimer > 0) {
      this.rumble(0.35, 0.05);
      this.spring(0.15);
      return;
    }

    // Corrupted controls — erratic force
    if (kartState.corruptedTimer > 0) {
      const erratic = Math.sin(performance.now() * 0.02) * 0.3;
      this.constant(erratic);
      this.rumble(0.2, 0.05);
      return;
    }

    // Drifting
    if (kartState.driftState && kartState.driftState !== 'none') {
      this.spring(0.15);
      const driftDir = kartState.driftState === 'left' ? -0.2 : 0.2;
      this.constant(driftDir);
      // Charge feedback
      if (kartState.driftCharge > 0.5) {
        this.rumble(0.15, 0.016);
      }
      return;
    }

    // Surface-based feedback
    const surface = kartState.surfaceType || 'default';
    const speedRatio = kartState.speed / 28;

    switch (surface) {
      case 'sand':
      case 'mud':
      case 'dirt':
      case 'moon_dust':
      case 'alien_soil':
        this.spring(0.5 + speedRatio * 0.2);
        this.rumble(0.3 * speedRatio, 0.016);
        break;
      case 'ice':
      case 'glacier_ice':
      case 'frozen_river':
      case 'ice_tunnel':
      case 'permafrost':
        this.spring(0.05);
        break;
      case 'gravel':
      case 'rubble':
      case 'moon_regolith':
        this.spring(0.4);
        this.rumble(0.25 * speedRatio, 0.016);
        break;
      case 'water':
      case 'shallow_water':
      case 'coral_reef':
        this.spring(0.35);
        this.rumble(0.15 * speedRatio, 0.016);
        break;
      case 'lava_crust':
      case 'volcanic_rock':
        this.spring(0.5);
        this.rumble(0.2 * speedRatio, 0.016);
        break;
      case 'metal':
      case 'steel_grate':
      case 'station_floor':
        this.spring(0.3);
        break;
      case 'wood':
      case 'deck_plank':
        this.spring(0.35);
        this.rumble(0.1 * speedRatio, 0.016);
        break;
      case 'circuit_trace':
      case 'pixel_road':
      case 'neon_tile':
        this.spring(0.25);
        break;
      case 'void':
      case 'corrupted_ground':
        this.spring(0.1);
        this.rumble(0.1, 0.05);
        break;
      default:
        // Normal road — proportional to speed
        this.spring(0.25 + speedRatio * 0.1);
        break;
    }
  }
}
