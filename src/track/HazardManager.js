import * as THREE from 'three';
import { toon } from '../materials/ToonMaterials.js';

const HAZARD_COLORS = {
  rolling_pencil: 0xffdd00,
  fan_push: 0x888899,
  cannon_fire: 0x555555,
  falling_debris: 0x998877,
  wave_surge: 0x3388cc,
  rockfall: 0x887766,
  lightning_ordeal: 0xffff44,
  crystal_resonance: 0xaa44ff,
  blizzard: 0xccddff,
  sandstorm: 0xddcc88,
  geyser: 0x66aaff,
  traffic_light: 0xff2200,
  subway_train: 0xcccccc,
  wind_gust: 0xaaddff,
  crane_rotate: 0xff8800,
  jaguar_crossing: 0x55aa33,
  electric_surge: 0x44ddff,
  pixel_enemy: 0xff4488,
  pinball_bumper: 0xff6600,
  geometry_glitch: 0xff00ff,
  micrometeorite: 0xaaaaaa,
  asteroid_gravity: 0x886644,
  decompression: 0x4466ff,
  alien_crossing: 0x44ff88,
  void_pulse: 0x220044,
  calving_event: 0xbbddff,
  lava_geyser: 0xff4400,
  ghost_ambush: 0x6633cc,
  data_corruption: 0x00ffaa,
  reality_tear: 0xff00cc,
};

export class HazardManager {
  constructor() {
    this.hazards = [];
    this.scene = null;
    this.activeEffects = [];
  }

  init(hazardDefs, scene) {
    this.scene = scene;
    this.hazards = (hazardDefs || []).map(def => ({
      ...def,
      timer: def.interval || 20,
      active: false,
      mesh: null,
      effectTimer: 0,
      warningTimer: 0,
      warningMesh: null,
    }));

    for (const hazard of this.hazards) {
      this._buildHazardVisual(hazard);
    }
  }

  _buildHazardVisual(hazard) {
    if (!this.scene) return;

    const color = HAZARD_COLORS[hazard.type] || 0xff0000;

    switch (hazard.type) {
      case 'rolling_pencil': {
        const geo = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
        const mat = toon('#ffdd00');
        hazard.mesh = new THREE.Mesh(geo, mat);
        hazard.mesh.rotation.z = Math.PI / 2;
        break;
      }
      case 'fan_push': {
        const group = new THREE.Group();
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16),
          toon('#888899')
        );
        group.add(base);
        // Fan blades
        for (let i = 0; i < 4; i++) {
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.05, 0.3),
            toon('#667788')
          );
          blade.rotation.y = (i / 4) * Math.PI * 2;
          blade.position.y = 0.2;
          group.add(blade);
        }
        hazard.mesh = group;
        hazard._blades = group.children.slice(1);
        break;
      }
      case 'cannon_fire': {
        const group = new THREE.Group();
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.35, 2, 8),
          toon('#555555')
        );
        barrel.rotation.z = Math.PI / 4;
        group.add(barrel);
        const base2 = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.5, 1.2),
          toon('#444444')
        );
        base2.position.y = -0.5;
        group.add(base2);
        hazard.mesh = group;
        break;
      }
      case 'falling_debris':
      case 'rockfall': {
        // Warning zone indicator (flat ring on ground)
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(hazard.radius || 3, (hazard.radius || 3) + 0.3, 24),
          new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        hazard.warningMesh = ring;
        this.scene.add(ring);
        if (hazard.position) ring.position.copy(hazard.position);
        ring.position.y = 0.05;
        break;
      }
      case 'wave_surge': {
        const wave = new THREE.Mesh(
          new THREE.BoxGeometry((hazard.width || 10), 1.5, 1.0),
          toon('#3388cc', { transparent: true, opacity: 0.6 })
        );
        hazard.mesh = wave;
        break;
      }
      case 'lightning_ordeal': {
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.2, 8, 4),
          new THREE.MeshBasicMaterial({ color: 0xffff44, transparent: true, opacity: 0 })
        );
        hazard.mesh = bolt;
        break;
      }
      case 'crystal_resonance': {
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.8),
          toon('#aa44ff', { emissive: new THREE.Color('#440088') })
        );
        hazard.mesh = crystal;
        break;
      }
      case 'blizzard':
      case 'sandstorm': {
        // Particle-based - just use a zone indicator
        const zone = new THREE.Mesh(
          new THREE.PlaneGeometry(hazard.zoneWidth || 10, hazard.zoneDepth || 10),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        zone.rotation.x = -Math.PI / 2;
        hazard.mesh = zone;
        break;
      }
      case 'geyser':
      case 'lava_geyser': {
        const geyserBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.7, 0.3, 12),
          toon(hazard.type === 'lava_geyser' ? '#ff4400' : '#66aaff')
        );
        const geyserSpout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.4, 3, 8),
          new THREE.MeshBasicMaterial({ color: hazard.type === 'lava_geyser' ? 0xff6600 : 0x88ccff, transparent: true, opacity: 0 })
        );
        geyserSpout.position.y = 1.5;
        const group2 = new THREE.Group();
        group2.add(geyserBase);
        group2.add(geyserSpout);
        hazard.mesh = group2;
        hazard._spout = geyserSpout;
        break;
      }
      case 'traffic_light': {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 4, 8),
          toon('#333333')
        );
        const housing = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 1.0, 0.3),
          toon('#222222')
        );
        housing.position.y = 2.2;
        const light = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        light.position.y = 2.2;
        light.position.z = 0.16;
        const group3 = new THREE.Group();
        group3.add(pole);
        group3.add(housing);
        group3.add(light);
        hazard.mesh = group3;
        hazard._light = light;
        break;
      }
      case 'subway_train': {
        const train = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2.5, 8),
          toon('#cccccc')
        );
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(2.02, 0.3, 8.02),
          toon('#ff4400')
        );
        stripe.position.y = 0.5;
        const group4 = new THREE.Group();
        group4.add(train);
        group4.add(stripe);
        hazard.mesh = group4;
        hazard.mesh.visible = false;
        break;
      }
      case 'wind_gust': {
        // Invisible force, just warning arrows
        const arrow = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 1.5, 6),
          new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.3 })
        );
        hazard.mesh = arrow;
        break;
      }
      case 'crane_rotate': {
        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.5, 0.5),
          toon('#ff8800')
        );
        const pivot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 6, 8),
          toon('#666666')
        );
        pivot.position.y = -2.5;
        const group5 = new THREE.Group();
        group5.add(arm);
        group5.add(pivot);
        hazard.mesh = group5;
        break;
      }
      case 'pixel_enemy': {
        const enemy = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          toon('#ff4488')
        );
        hazard.mesh = enemy;
        break;
      }
      case 'pinball_bumper': {
        const bumper = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12),
          toon('#ff6600', { emissive: new THREE.Color('#331100') })
        );
        hazard.mesh = bumper;
        break;
      }
      case 'geometry_glitch':
      case 'data_corruption': {
        const glitch = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.0),
          new THREE.MeshBasicMaterial({ color, wireframe: true })
        );
        hazard.mesh = glitch;
        break;
      }
      case 'micrometeorite':
      case 'asteroid_gravity': {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.6),
          toon('#887766')
        );
        hazard.mesh = rock;
        hazard.mesh.visible = false;
        break;
      }
      case 'decompression': {
        const vent = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.1, 2),
          new THREE.MeshBasicMaterial({ color: 0x4466ff, transparent: true, opacity: 0.2 })
        );
        hazard.mesh = vent;
        break;
      }
      case 'alien_crossing':
      case 'jaguar_crossing': {
        // Crossing zone - flat warning strip
        const strip = new THREE.Mesh(
          new THREE.PlaneGeometry(hazard.width || 6, 1),
          new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
        );
        strip.rotation.x = -Math.PI / 2;
        hazard.mesh = strip;
        break;
      }
      case 'ghost_ambush': {
        const ghost = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x6633cc, transparent: true, opacity: 0 })
        );
        hazard.mesh = ghost;
        break;
      }
      case 'void_pulse':
      case 'reality_tear': {
        const pulse = new THREE.Mesh(
          new THREE.TorusGeometry(2, 0.3, 8, 24),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, wireframe: true })
        );
        hazard.mesh = pulse;
        break;
      }
      case 'electric_surge': {
        const spark = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0 })
        );
        hazard.mesh = spark;
        break;
      }
      default: break;
    }

    if (hazard.mesh) {
      if (hazard.position) {
        hazard.mesh.position.set(hazard.position.x, hazard.position.y || 0, hazard.position.z);
      }
      this.scene.add(hazard.mesh);
    }
  }

  update(dt) {
    for (const hazard of this.hazards) {
      hazard.timer -= dt;

      // Warning phase (1.5s before activation)
      if (!hazard.active && hazard.timer <= 1.5 && hazard.timer > 0) {
        hazard.warningTimer = hazard.timer;
        this._updateWarning(hazard, 1 - hazard.timer / 1.5);
      }

      if (hazard.timer <= 0 && !hazard.active) {
        hazard.active = true;
        hazard.effectTimer = hazard.duration || 2.0;
        hazard.timer = hazard.interval || 20;
        this._onActivate(hazard);
      }

      if (hazard.active) {
        hazard.effectTimer -= dt;
        this._updateActive(hazard, dt);
        if (hazard.effectTimer <= 0) {
          hazard.active = false;
          this._onDeactivate(hazard);
        }
      }

      // Animate persistent visuals
      this._animateHazard(hazard, dt);
    }
  }

  _updateWarning(hazard, progress) {
    if (hazard.warningMesh) {
      hazard.warningMesh.material.opacity = progress * 0.5;
    }
    // Flash warning for specific types
    if (hazard.type === 'subway_train' && hazard._light) {
      hazard._light.material.color.setHex(Math.sin(progress * 20) > 0 ? 0xff0000 : 0x330000);
    }
  }

  _onActivate(hazard) {
    switch (hazard.type) {
      case 'subway_train':
        if (hazard.mesh) hazard.mesh.visible = true;
        break;
      case 'lightning_ordeal':
      case 'electric_surge':
        if (hazard.mesh) hazard.mesh.material.opacity = 0.9;
        break;
      case 'ghost_ambush':
        if (hazard.mesh) hazard.mesh.material.opacity = 0.7;
        break;
      case 'void_pulse':
      case 'reality_tear':
        if (hazard.mesh) hazard.mesh.material.opacity = 0.8;
        break;
      case 'blizzard':
      case 'sandstorm':
        if (hazard.mesh) hazard.mesh.material.opacity = 0.3;
        break;
      case 'micrometeorite':
      case 'asteroid_gravity':
        if (hazard.mesh) hazard.mesh.visible = true;
        break;
      case 'wave_surge':
        if (hazard.mesh) hazard.mesh.material.opacity = 0.6;
        break;
    }
    if (hazard.warningMesh) {
      hazard.warningMesh.material.opacity = 0.7;
      hazard.warningMesh.material.color.setHex(0xff0000);
    }
  }

  _onDeactivate(hazard) {
    switch (hazard.type) {
      case 'subway_train':
        if (hazard.mesh) hazard.mesh.visible = false;
        break;
      case 'lightning_ordeal':
      case 'electric_surge':
      case 'ghost_ambush':
        if (hazard.mesh) hazard.mesh.material.opacity = 0;
        break;
      case 'void_pulse':
      case 'reality_tear':
        if (hazard.mesh) hazard.mesh.material.opacity = 0;
        break;
      case 'blizzard':
      case 'sandstorm':
        if (hazard.mesh) hazard.mesh.material.opacity = 0;
        break;
      case 'micrometeorite':
      case 'asteroid_gravity':
        if (hazard.mesh) hazard.mesh.visible = false;
        break;
    }
    if (hazard.warningMesh) {
      hazard.warningMesh.material.opacity = 0;
    }
  }

  _updateActive(hazard, dt) {
    const progress = 1 - hazard.effectTimer / (hazard.duration || 2.0);

    switch (hazard.type) {
      case 'subway_train': {
        if (hazard.mesh && hazard.startPos && hazard.endPos) {
          hazard.mesh.position.lerpVectors(
            new THREE.Vector3(hazard.startPos.x, hazard.startPos.y || 0, hazard.startPos.z),
            new THREE.Vector3(hazard.endPos.x, hazard.endPos.y || 0, hazard.endPos.z),
            progress
          );
        }
        break;
      }
      case 'wave_surge': {
        if (hazard.mesh && hazard.startPos && hazard.endPos) {
          hazard.mesh.position.lerpVectors(
            new THREE.Vector3(hazard.startPos.x, 0.5, hazard.startPos.z),
            new THREE.Vector3(hazard.endPos.x, 0.5, hazard.endPos.z),
            progress
          );
        }
        break;
      }
      case 'crane_rotate': {
        if (hazard.mesh) {
          hazard.mesh.rotation.y += (hazard.speed || 1.0) * dt;
        }
        break;
      }
      case 'rolling_pencil': {
        if (hazard.mesh && hazard.startPos && hazard.endPos) {
          hazard.mesh.position.lerpVectors(
            new THREE.Vector3(hazard.startPos.x, 0.15, hazard.startPos.z),
            new THREE.Vector3(hazard.endPos.x, 0.15, hazard.endPos.z),
            Math.abs(Math.sin(progress * Math.PI))
          );
          hazard.mesh.rotation.x += 5 * dt;
        }
        break;
      }
      case 'void_pulse':
      case 'reality_tear': {
        if (hazard.mesh) {
          const scale = 1 + progress * 3;
          hazard.mesh.scale.set(scale, scale, scale);
          hazard.mesh.material.opacity = 0.8 * (1 - progress);
        }
        break;
      }
    }
  }

  _animateHazard(hazard, dt) {
    switch (hazard.type) {
      case 'fan_push': {
        if (hazard._blades) {
          for (const blade of hazard._blades) {
            blade.rotation.y += 8 * dt;
          }
        }
        break;
      }
      case 'crystal_resonance': {
        if (hazard.mesh) {
          hazard.mesh.rotation.y += 0.5 * dt;
          const pulse = 0.9 + 0.1 * Math.sin(performance.now() * 0.003);
          hazard.mesh.scale.set(pulse, pulse, pulse);
        }
        break;
      }
      case 'pixel_enemy': {
        if (hazard.mesh && hazard.path) {
          const t = ((performance.now() * 0.001 * (hazard.speed || 1)) % 1);
          const pathLen = hazard.path.length;
          const idx = Math.floor(t * pathLen);
          const next = (idx + 1) % pathLen;
          const frac = t * pathLen - idx;
          if (hazard.path[idx] && hazard.path[next]) {
            hazard.mesh.position.lerpVectors(
              new THREE.Vector3(hazard.path[idx].x, 0.5, hazard.path[idx].z),
              new THREE.Vector3(hazard.path[next].x, 0.5, hazard.path[next].z),
              frac
            );
          }
        }
        break;
      }
      case 'pinball_bumper': {
        if (hazard.mesh) {
          hazard.mesh.material.emissive.setHex(
            hazard.active ? 0x664400 : 0x331100
          );
        }
        break;
      }
      case 'geyser':
      case 'lava_geyser': {
        if (hazard._spout) {
          hazard._spout.material.opacity = hazard.active ? 0.7 : 0;
          if (hazard.active) {
            const s = 1 + 0.2 * Math.sin(performance.now() * 0.01);
            hazard._spout.scale.set(s, 1, s);
          }
        }
        break;
      }
    }
  }

  getActiveHazardsAt(position, radius) {
    const active = [];
    for (const hazard of this.hazards) {
      if (!hazard.active) continue;
      if (hazard.position) {
        const dist = position.distanceTo(
          new THREE.Vector3(hazard.position.x, hazard.position.y || 0, hazard.position.z)
        );
        if (dist < (hazard.radius || radius || 5)) {
          active.push(hazard);
        }
      } else if (hazard.zone) {
        if (position.x >= hazard.zone.minX && position.x <= hazard.zone.maxX &&
            position.z >= hazard.zone.minZ && position.z <= hazard.zone.maxZ) {
          active.push(hazard);
        }
      }
    }
    return active;
  }

  dispose() {
    for (const hazard of this.hazards) {
      if (hazard.mesh && this.scene) {
        this.scene.remove(hazard.mesh);
        if (hazard.mesh.geometry) hazard.mesh.geometry.dispose();
        if (hazard.mesh.material) hazard.mesh.material.dispose();
      }
      if (hazard.warningMesh && this.scene) {
        this.scene.remove(hazard.warningMesh);
        hazard.warningMesh.geometry.dispose();
        hazard.warningMesh.material.dispose();
      }
    }
    this.hazards = [];
  }
}
