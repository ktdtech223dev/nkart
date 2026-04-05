import * as THREE from 'three';
import { ITEM_TYPES, ITEM_DISPLAY, SHELL_PHYSICS } from '../constants/items.js';
import { toon } from '../materials/ToonMaterials.js';

function makeMat(color, emissive = null, emissiveIntensity = 1, transparent = false, opacity = 1) {
  const mat = toon(color);
  if (emissive) { mat.emissive = new THREE.Color(emissive); mat.emissiveIntensity = emissiveIntensity; }
  if (transparent) { mat.transparent = true; mat.opacity = opacity; }
  return mat;
}

export class ItemRenderer {
  constructor(scene) {
    this.scene = scene;
    this.activeItems = [];
    this.orbiting = [];
  }

  spawnShell(type, position, direction, targetId) {
    const display = ITEM_DISPLAY[type];
    const isHoming = type === ITEM_TYPES.HOMING_SHELL || type === ITEM_TYPES.CORRUPTED_SHELL;
    const speed = isHoming ? SHELL_PHYSICS.HOMING_SHELL_SPEED : SHELL_PHYSICS.BOOST_SHELL_SPEED;

    const geo = new THREE.SphereGeometry(0.22, 12, 10);
    const mat = makeMat(display.color, display.color, 0.4);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.copy(position);

    // Trail light
    const ptLight = new THREE.PointLight(new THREE.Color(display.color), 0.6, 2.5);
    mesh.add(ptLight);

    this.scene.add(mesh);

    const vel = direction.clone().normalize().multiplyScalar(speed);
    this.activeItems.push({
      type, mesh, velocity: vel,
      lifetime: isHoming ? SHELL_PHYSICS.HOMING_SHELL_LIFETIME : SHELL_PHYSICS.BOOST_SHELL_LIFETIME,
      age: 0, bounces: 0,
      maxBounces: isHoming ? 0 : SHELL_PHYSICS.BOOST_SHELL_MAX_BOUNCES,
      targetId, isHoming,
    });
  }

  spawnBananaPeel(position) {
    const geo = new THREE.SphereGeometry(0.18, 8, 6);
    geo.scale(1.2, 0.25, 0.9);
    const mat = makeMat('#FFDD00', '#FFAA00', 0.4);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.copy(position);
    mesh.position.y = 0.1;
    this.scene.add(mesh);

    this.activeItems.push({
      type: ITEM_TYPES.BANANA_PEEL, mesh,
      velocity: new THREE.Vector3(),
      lifetime: 60, age: 0, isStatic: true,
    });
  }

  spawnFakeItemBox(position) {
    const geo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const mat = makeMat('#CC2200', '#FF0000', 0.4, true, 0.85);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.copy(position);
    mesh.position.y = 0.5;
    this.scene.add(mesh);

    this.activeItems.push({
      type: ITEM_TYPES.FAKE_ITEM_BOX, mesh,
      velocity: new THREE.Vector3(),
      lifetime: 60, age: 0, isStatic: true,
    });
  }

  addOrbitingItem(kartGroup, type, count) {
    const display = ITEM_DISPLAY[type];
    const items = [];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.18, 10, 8);
      const mat = makeMat(display.color, display.color, 0.4);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      kartGroup.add(mesh);
      items.push({ mesh, angle: (i / count) * Math.PI * 2 });
    }

    this.orbiting.push({ kartGroup, items, type, radius: 1.3, speed: 3.0 });
  }

  removeOrbitingItem(kartGroup) {
    const idx = this.orbiting.findIndex(o => o.kartGroup === kartGroup);
    if (idx !== -1) {
      const orbit = this.orbiting[idx];
      for (const item of orbit.items) {
        kartGroup.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
      }
      this.orbiting.splice(idx, 1);
    }
  }

  update(dt) {
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i];
      item.age += dt;

      if (item.age >= item.lifetime) {
        this._removeItem(i);
        continue;
      }

      if (!item.isStatic) {
        item.mesh.position.addScaledVector(item.velocity, dt);
        if (!item.isHoming) {
          item.velocity.y -= 9.8 * dt;
          if (item.mesh.position.y < 0.22) {
            item.mesh.position.y = 0.22;
            item.velocity.y = 0;
          }
        }
      }

      if (item.isStatic) {
        item.mesh.rotation.y += 1.5 * dt;
      }
    }

    // Orbiting items
    for (const orbit of this.orbiting) {
      for (const item of orbit.items) {
        item.angle += orbit.speed * dt;
        item.mesh.position.x = Math.cos(item.angle) * orbit.radius;
        item.mesh.position.z = Math.sin(item.angle) * orbit.radius;
        item.mesh.position.y = 0.45;
      }
    }
  }

  _removeItem(index) {
    const item = this.activeItems[index];
    this.scene.remove(item.mesh);
    item.mesh.geometry.dispose();
    item.mesh.material.dispose();
    this.activeItems.splice(index, 1);
  }

  removeItemById(id) {
    const idx = this.activeItems.findIndex(item => item.id === id);
    if (idx !== -1) this._removeItem(idx);
  }

  dispose() {
    while (this.activeItems.length > 0) this._removeItem(0);
    for (const orbit of this.orbiting) {
      for (const item of orbit.items) {
        orbit.kartGroup.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
      }
    }
    this.orbiting = [];
  }
}
