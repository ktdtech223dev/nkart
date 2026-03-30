/**
 * particles.js — Drift sparks, boost exhaust, item effects
 */

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      p.vel.y -= p.gravity * dt;
      const alpha = p.life / p.maxLife;
      p.mesh.material.opacity = alpha;
      p.mesh.scale.setScalar(p.size * (0.5 + alpha * 0.5));
    }
  }

  /**
   * Emit drift sparks from a kart
   */
  emitDriftSparks(kart) {
    const tier = kart.driftTier;
    if (tier === 0) return;

    const colors = [0x4488ff, 0xff8800, 0xaa44ff]; // blue, orange, purple
    const color = colors[tier - 1];

    // Spark from rear wheels
    for (let j = 0; j < 2; j++) {
      const side = kart.driftDirection;
      const offset = new THREE.Vector3(
        side * 0.4 + (Math.random() - 0.5) * 0.3,
        0.1,
        0.8 + Math.random() * 0.3
      );
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), kart.rotation);
      const pos = kart.position.clone().add(offset);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 4),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 3, (Math.random() - 0.5) * 2),
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        gravity: 8,
        size: 0.06,
      });
    }
  }

  /**
   * Emit boost exhaust from a kart
   */
  emitBoostExhaust(kart) {
    for (let j = 0; j < 3; j++) {
      const behind = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.15 + Math.random() * 0.1,
        0.8
      );
      behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), kart.rotation);
      const pos = kart.position.clone().add(behind);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 })
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 1, Math.random() * 1.5, (Math.random() - 0.5) * 1),
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.4,
        gravity: 2,
        size: 0.08,
      });
    }
  }

  /**
   * Emit hit effect (spin out)
   */
  emitHitEffect(position) {
    for (let j = 0; j < 15; j++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 1 })
      );
      mesh.position.copy(position);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          2 + Math.random() * 5,
          (Math.random() - 0.5) * 8
        ),
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        gravity: 10,
        size: 0.1,
      });
    }
  }

  cleanup() {
    for (const p of this.particles) this.scene.remove(p.mesh);
    this.particles = [];
  }
}
