import * as THREE from 'three';

// Create smoke sprite texture
function makeSmokeTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, 'rgba(220,220,220,0.9)');
  grad.addColorStop(0.5, 'rgba(180,180,180,0.5)');
  grad.addColorStop(1, 'rgba(150,150,150,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

// Create star shape texture for item hit
function makeStarTexture(color) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size/2, size/2);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 4 * Math.PI / 5) - Math.PI/2;
    const innerAngle = outerAngle + Math.PI / 5;
    if (i === 0) ctx.moveTo(Math.cos(outerAngle)*28, Math.sin(outerAngle)*28);
    else ctx.lineTo(Math.cos(outerAngle)*28, Math.sin(outerAngle)*28);
    ctx.lineTo(Math.cos(innerAngle)*11, Math.sin(innerAngle)*11);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return new THREE.CanvasTexture(canvas);
}

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this._smokeTexture = makeSmokeTexture();
    this._starTextures = ['#FFD700','#FF6B00','#FF0000'].map(makeStarTexture);
    this._driftCooldown = 0;
  }

  // Drift smoke: white/grey circles, scale up and fade over 0.8s, 8 per drift tick
  spawnDriftSmoke(position, driftDir) {
    this._driftCooldown -= 1;
    if (this._driftCooldown > 0) return;
    this._driftCooldown = 3; // spawn every 3 physics ticks

    for (let i = 0; i < 8; i++) {
      const brightness = 180 + Math.floor(Math.random() * 60);
      const color = `rgb(${brightness},${brightness},${brightness})`;
      const mat = new THREE.SpriteMaterial({
        map: this._smokeTexture,
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.7 + Math.random() * 0.2,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const sprite = new THREE.Sprite(mat);
      const spread = 0.6;
      sprite.position.set(
        position.x + (Math.random()-0.5)*spread,
        position.y + 0.1 + Math.random()*0.3,
        position.z + (Math.random()-0.5)*spread
      );
      const initScale = 0.3 + Math.random()*0.3;
      sprite.scale.setScalar(initScale);
      this.scene.add(sprite);
      this.particles.push({
        sprite, mat,
        age: 0, lifetime: 0.8,
        initScale,
        type: 'smoke',
        vx: (Math.random()-0.5)*0.5,
        vz: (Math.random()-0.5)*0.5,
        vy: 0.3 + Math.random()*0.4,
      });
    }
  }

  // Boost trail: yellow/orange streaks, emissive, spawn behind exhaust
  spawnBoostTrail(position) {
    const colors = ['#FFD700', '#FF8800', '#FF4400'];
    const col = colors[Math.floor(Math.random()*colors.length)];
    const mat = new THREE.SpriteMaterial({
      map: this._smokeTexture,
      color: new THREE.Color(col),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(
      position.x + (Math.random()-0.5)*0.4,
      position.y + 0.15,
      position.z + (Math.random()-0.5)*0.4
    );
    sprite.scale.setScalar(0.5);
    this.scene.add(sprite);
    this.particles.push({
      sprite, mat,
      age: 0, lifetime: 0.4,
      initScale: 0.5,
      type: 'boost',
      vx: (Math.random()-0.5)*0.3,
      vz: (Math.random()-0.5)*0.3,
      vy: 0.2,
    });
  }

  // Item hit burst: 12 stars, colors #FFD700 #FF6B00 #FF0000, explode 2 units
  spawnItemHit(position) {
    for (let i = 0; i < 12; i++) {
      const texIdx = i % 3;
      const mat = new THREE.SpriteMaterial({
        map: this._starTextures[texIdx],
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.setScalar(0.5);
      this.scene.add(sprite);

      const angle = (i / 12) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 0.8;
      this.particles.push({
        sprite, mat,
        age: 0, lifetime: 0.6,
        initScale: 0.5,
        type: 'star',
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        vy: 1.5 + Math.random(),
        targetRadius: 2.0,
      });
    }
  }

  // Generic ambient particle system (returns object for tracking)
  createSystem(config) {
    const { count = 50, spread = 20, color = '#ffffff', speed = 0.1, size = 0.1, lifetime = -1 } = config;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random()-0.5)*spread;
      positions[i*3+1] = Math.random()*spread*0.5;
      positions[i*3+2] = (Math.random()-0.5)*spread;
      velocities[i*3] = (Math.random()-0.5)*speed;
      velocities[i*3+1] = Math.random()*speed;
      velocities[i*3+2] = (Math.random()-0.5)*speed;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: new THREE.Color(color), size, transparent: true, opacity: 0.6, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    return { points, velocities, count, spread, lifetime, age: 0, active: true };
  }

  createBurst(position, config) {
    // Delegate to spawnItemHit for now
    this.spawnItemHit(position);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      const t = p.age / p.lifetime;

      if (t >= 1) {
        this.scene.remove(p.sprite);
        p.mat.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Move
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      p.sprite.position.z += p.vz * dt;
      p.vy -= 2 * dt; // gentle gravity

      if (p.type === 'smoke') {
        // Scale up, fade out
        const scale = p.initScale + t * 1.2;
        p.sprite.scale.setScalar(scale);
        p.mat.opacity = (1 - t) * 0.7;
      } else if (p.type === 'boost') {
        // Fade in then out quickly
        const opacity = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        p.mat.opacity = opacity * 0.9;
        p.sprite.scale.setScalar(p.initScale * (1 + t * 0.5));
      } else if (p.type === 'star') {
        // Scale down, fade out
        p.sprite.scale.setScalar(p.initScale * (1 - t * 0.5));
        p.mat.opacity = 1 - t * t;
      }
    }
  }

  dispose() {
    for (const p of this.particles) {
      this.scene.remove(p.sprite);
      p.mat.dispose();
    }
    this.particles = [];
    if (this._smokeTexture) this._smokeTexture.dispose();
    this._starTextures.forEach(t => t.dispose());
  }
}
