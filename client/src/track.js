/**
 * track.js — Track class: geometry, checkpoints, waypoints
 * Builds tracks as extruded spline paths.
 */

const TRACK_WIDTH = 12;

class Track {
  constructor(trackDef) {
    this.def = trackDef;
    this.name = trackDef.name;
    this.group = new THREE.Group();
    this.checkpoints = trackDef.checkpoints || [];
    this.waypoints = trackDef.waypoints || [];
    this.itemBoxPositions = trackDef.itemBoxPositions || [];
    this.boostPadPositions = trackDef.boostPadPositions || [];
    this.spawnPoints = trackDef.spawnPoints || [];
    this.trackPath = null;
    this.trackMeshes = [];
    this.barriers = [];
    this.decorations = [];
  }

  build() {
    this._buildTrackSurface();
    this._buildBarriers();
    this._buildDecorations();
    this._buildBoostPads();
    this._buildStartLine();
    return this.group;
  }

  _buildTrackSurface() {
    if (!this.def.splinePoints) return;

    const points = this.def.splinePoints.map(p => new THREE.Vector3(p[0], p[1] || 0, p[2]));
    this.trackPath = new THREE.CatmullRomCurve3(points, true); // closed loop

    const segments = 200;
    const halfWidth = TRACK_WIDTH / 2;

    // Build track surface as a series of quads
    const trackGeo = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.trackPath.getPointAt(t);
      const tangent = this.trackPath.getTangentAt(t);

      // Perpendicular direction (cross with up)
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const left = point.clone().add(right.clone().multiplyScalar(-halfWidth));
      const rightPt = point.clone().add(right.clone().multiplyScalar(halfWidth));

      vertices.push(left.x, left.y, left.z);
      vertices.push(rightPt.x, rightPt.y, rightPt.z);
      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, t * 20, 1, t * 20);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trackGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeo.setIndex(indices);

    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x333340,
      roughness: 0.8,
      metalness: 0.1,
    });

    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.receiveShadow = true;
    this.group.add(trackMesh);
    this.trackMeshes.push(trackMesh);

    // Lane markings
    this._buildLaneMarkings(segments);
  }

  _buildLaneMarkings(segments) {
    if (!this.trackPath) return;
    const dashGeo = new THREE.BoxGeometry(0.2, 0.02, 1.0);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x222222 });

    for (let i = 0; i < segments; i += 4) {
      const t = i / segments;
      const point = this.trackPath.getPointAt(t);
      const tangent = this.trackPath.getTangentAt(t);

      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.copy(point);
      dash.position.y += 0.02;
      dash.lookAt(point.clone().add(tangent));
      this.group.add(dash);
    }
  }

  _buildBarriers() {
    if (!this.trackPath) return;
    const segments = 100;
    const halfWidth = TRACK_WIDTH / 2 + 0.5;
    const barrierGeo = new THREE.BoxGeometry(0.4, 0.8, 2.0);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.7 });

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const point = this.trackPath.getPointAt(t);
      const tangent = this.trackPath.getTangentAt(t);
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Left barrier
      const bL = new THREE.Mesh(barrierGeo, barrierMat);
      bL.position.copy(point).add(right.clone().multiplyScalar(-halfWidth));
      bL.position.y += 0.4;
      bL.lookAt(point.clone().add(tangent));
      bL.castShadow = true;
      this.group.add(bL);
      this.barriers.push({ mesh: bL, pos: bL.position.clone(), radius: 0.6 });

      // Right barrier
      const bR = new THREE.Mesh(barrierGeo, barrierMat);
      bR.position.copy(point).add(right.clone().multiplyScalar(halfWidth));
      bR.position.y += 0.4;
      bR.lookAt(point.clone().add(tangent));
      bR.castShadow = true;
      this.group.add(bR);
      this.barriers.push({ mesh: bR, pos: bR.position.clone(), radius: 0.6 });
    }
  }

  _buildDecorations() {
    if (!this.def.buildDecorations) return;
    const decos = this.def.buildDecorations();
    if (decos) this.group.add(decos);
  }

  _buildBoostPads() {
    const padGeo = new THREE.BoxGeometry(3, 0.05, 4);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.4,
      transparent: true, opacity: 0.8,
    });

    this._boostPads = [];
    for (const pos of this.boostPadPositions) {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(pos[0], 0.03, pos[2] || pos[1]);
      if (pos.length > 3) pad.rotation.y = pos[3];
      this.group.add(pad);

      // Arrow on pad
      const arrowGeo = new THREE.BufferGeometry();
      const arrowVerts = new Float32Array([0, 0.06, -1.5, -1, 0.06, 0.5, 1, 0.06, 0.5]);
      arrowGeo.setAttribute('position', new THREE.Float32BufferAttribute(arrowVerts, 3));
      arrowGeo.computeVertexNormals();
      const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshStandardMaterial({
        color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 0.6,
      }));
      arrow.position.copy(pad.position);
      arrow.rotation.y = pad.rotation.y;
      this.group.add(arrow);

      this._boostPads.push({ pos: pad.position.clone(), rot: pad.rotation.y, radius: 2.5 });
    }
  }

  _buildStartLine() {
    const lineGeo = new THREE.BoxGeometry(TRACK_WIDTH, 0.03, 0.5);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const startLine = new THREE.Mesh(lineGeo, lineMat);
    if (this.spawnPoints.length > 0) {
      startLine.position.set(this.spawnPoints[0][0], 0.02, this.spawnPoints[0][2] || 0);
    }
    this.group.add(startLine);
  }

  getHeight(x, z) {
    // For now, flat track
    return 0;
  }

  /**
   * Check if a position is on a boost pad. Returns boost data or null.
   */
  checkBoostPad(pos) {
    for (const pad of (this._boostPads || [])) {
      const dx = pos.x - pad.pos.x;
      const dz = pos.z - pad.pos.z;
      if (dx * dx + dz * dz < pad.radius * pad.radius) {
        return { strength: 0.6, duration: 0.8 };
      }
    }
    return null;
  }

  /**
   * Check if kart crossed a checkpoint. Returns checkpoint index or -1.
   */
  checkCheckpoint(pos, currentCheckpoint) {
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const dx = pos.x - cp[0];
      const dz = pos.z - (cp[2] || cp[1]);
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < (cp[3] || TRACK_WIDTH)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Get kart's normalized progress along track (0-1).
   */
  getProgress(pos) {
    if (!this.trackPath) return 0;
    // Find closest point on track spline
    let bestT = 0;
    let bestDist = Infinity;
    for (let t = 0; t < 1; t += 0.005) {
      const pt = this.trackPath.getPointAt(t);
      const dx = pos.x - pt.x;
      const dz = pos.z - pt.z;
      const d = dx * dx + dz * dz;
      if (d < bestDist) { bestDist = d; bestT = t; }
    }
    return bestT;
  }

  /**
   * Check if position is within track boundaries.
   */
  isOnTrack(pos) {
    if (!this.trackPath) return true;
    const progress = this.getProgress(pos);
    const trackPoint = this.trackPath.getPointAt(progress);
    const dx = pos.x - trackPoint.x;
    const dz = pos.z - trackPoint.z;
    return Math.sqrt(dx * dx + dz * dz) < TRACK_WIDTH / 2 + 1;
  }

  /**
   * Apply off-track penalty (slow down kart).
   */
  getTerrainMultiplier(pos) {
    if (this.isOnTrack(pos)) return 1.0;
    return 0.6; // Off-track = slower
  }
}

// =================== TRACK DEFINITIONS ===================

/**
 * Helper: build a simple oval track from spline points
 */
function buildTrackDef(name, cup, difficulty, splinePoints, opts = {}) {
  const numCp = opts.numCheckpoints || 8;
  const checkpoints = [];
  const waypoints = [];
  const path = new THREE.CatmullRomCurve3(
    splinePoints.map(p => new THREE.Vector3(p[0], p[1] || 0, p[2])), true
  );

  // Generate checkpoints and waypoints from spline
  for (let i = 0; i < numCp; i++) {
    const t = i / numCp;
    const pt = path.getPointAt(t);
    checkpoints.push([pt.x, pt.y, pt.z, TRACK_WIDTH + 2]);
  }
  for (let i = 0; i < 60; i++) {
    const t = i / 60;
    const pt = path.getPointAt(t);
    waypoints.push([pt.x, pt.y, pt.z]);
  }

  // Spawn points at start
  const startPt = path.getPointAt(0);
  const startTan = path.getTangentAt(0);
  const startRight = new THREE.Vector3().crossVectors(startTan, new THREE.Vector3(0, 1, 0)).normalize();
  const spawnPoints = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const offset = startRight.clone().multiplyScalar((col - 0.5) * 3);
      const forward = startTan.clone().multiplyScalar(-row * 3);
      const sp = startPt.clone().add(offset).add(forward);
      spawnPoints.push([sp.x, sp.y, sp.z]);
    }
  }

  // Boost pad positions (a few along straights)
  const boostPadPositions = opts.boostPads || [];

  return {
    name,
    cup,
    difficulty,
    lapRecord: null,
    splinePoints,
    checkpoints,
    waypoints,
    itemBoxPositions: opts.itemBoxPositions || [],
    boostPadPositions,
    spawnPoints,
    theme: opts.theme || { skyColor: 0x111827, fogColor: 0x111827, ambientColor: 0x334455, accentColor: 0xff6600 },
    buildDecorations: opts.buildDecorations || null,
  };
}

// =================== STREET CUP ===================

const TRACK_DOWNTOWN_DRAG = buildTrackDef(
  'Downtown Drag', 'Street Cup', 1,
  [
    [0, 0, -80], [40, 0, -80], [60, 0, -60], [60, 0, -20],
    [60, 0, 20], [40, 0, 60], [0, 0, 80], [-40, 0, 80],
    [-60, 0, 60], [-60, 0, 20], [-60, 0, -20], [-40, 0, -60],
  ],
  {
    theme: { skyColor: 0x0a0a1a, fogColor: 0x0a0a1a, ambientColor: 0x334466, accentColor: 0xff6600 },
    boostPads: [[0, 0, -80], [0, 0, 80]],
    itemBoxPositions: [
      [30, 0, -70], [-30, 0, -70], [60, 0, 0], [-60, 0, 0],
      [30, 0, 70], [-30, 0, 70],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1a1d2a });
      const neonMats = [
        new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0088dd, emissiveIntensity: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xcc00cc, emissiveIntensity: 0.5 }),
      ];
      // City buildings around the track
      for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const dist = 80 + Math.random() * 30;
        const h = 10 + Math.random() * 30;
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(6 + Math.random() * 8, h, 6 + Math.random() * 8),
          buildingMat
        );
        building.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
        building.castShadow = true;
        g.add(building);

        // Neon strip on some buildings
        if (Math.random() > 0.5) {
          const strip = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, h * 0.3, 0.2),
            neonMats[Math.floor(Math.random() * 3)]
          );
          strip.position.copy(building.position);
          strip.position.y = h * 0.6;
          g.add(strip);
        }
      }
      // Ground plane
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({ color: 0x111118 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      ground.receiveShadow = true;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_HARBOR_RUSH = buildTrackDef(
  'Harbor Rush', 'Street Cup', 1,
  [
    [0, 0, -100], [50, 0, -100], [80, 0, -70], [80, 0, 0],
    [80, 0, 50], [50, 0, 80], [0, 0, 80], [-30, 0, 60],
    [-50, 0, 20], [-50, 0, -30], [-50, 0, -70], [-30, 0, -90],
  ],
  {
    theme: { skyColor: 0x0d1520, fogColor: 0x0d1520, ambientColor: 0x2a3a4a, accentColor: 0x44aaff },
    boostPads: [[80, 0, -35]],
    itemBoxPositions: [
      [25, 0, -100], [80, 0, -35], [25, 0, 80], [-50, 0, -5],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Shipping containers
      const containerColors = [0xcc3333, 0x3366cc, 0x33aa33, 0xcccc33];
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 70 + Math.random() * 40;
        const container = new THREE.Mesh(
          new THREE.BoxGeometry(4, 3, 12),
          new THREE.MeshStandardMaterial({ color: containerColors[i % 4] })
        );
        container.position.set(Math.cos(angle) * dist, 1.5, Math.sin(angle) * dist);
        container.rotation.y = Math.random() * Math.PI;
        g.add(container);
      }
      // Water plane
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshStandardMaterial({ color: 0x0a2040, transparent: true, opacity: 0.8 })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = -0.5;
      g.add(water);
      // Ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_NIGHT_MARKET = buildTrackDef(
  'Night Market', 'Street Cup', 2,
  [
    [0, 0, -40], [20, 0, -35], [30, 0, -15], [25, 0, 10],
    [10, 0, 25], [-5, 0, 35], [-25, 0, 30], [-35, 0, 10],
    [-30, 0, -10], [-20, 0, -25],
  ],
  {
    theme: { skyColor: 0x0a0810, fogColor: 0x0a0810, ambientColor: 0x442233, accentColor: 0xff4444 },
    itemBoxPositions: [
      [10, 0, -37], [28, 0, -2], [-15, 0, 33], [-33, 0, 0],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Lanterns overhead (as glowing spheres)
      const lanternMat = new THREE.MeshStandardMaterial({ color: 0xff6633, emissive: 0xff4422, emissiveIntensity: 0.8 });
      for (let i = 0; i < 30; i++) {
        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), lanternMat);
        lantern.position.set(
          (Math.random() - 0.5) * 60,
          5 + Math.random() * 3,
          (Math.random() - 0.5) * 60
        );
        g.add(lantern);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x151510 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_FREEWAY_FURY = buildTrackDef(
  'Freeway Fury', 'Street Cup', 2,
  [
    [0, 0, -120], [20, 0, -120], [40, 0, -110], [50, 0, -80],
    [50, 0, 0], [50, 0, 60], [40, 0, 90], [20, 0, 110],
    [0, 0, 120], [-20, 0, 110], [-40, 0, 90], [-50, 0, 60],
    [-50, 0, 0], [-50, 0, -80], [-40, 0, -110], [-20, 0, -120],
  ],
  {
    theme: { skyColor: 0x080818, fogColor: 0x080818, ambientColor: 0x223344, accentColor: 0xffaa00 },
    boostPads: [[50, 0, -40], [50, 0, 30], [-50, 0, -40], [-50, 0, 30]],
    itemBoxPositions: [
      [10, 0, -120], [50, 0, -40], [10, 0, 115], [-50, 0, 30],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Highway lights
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffcc66, emissiveIntensity: 0.6 });
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 58;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 6), poleMat);
        pole.position.set(Math.cos(angle) * dist, 4, Math.sin(angle) * dist);
        g.add(pole);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), lampMat);
        lamp.position.copy(pole.position);
        lamp.position.y = 8.2;
        g.add(lamp);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({ color: 0x111115 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

// =================== NATURE CUP ===================

const TRACK_VOLCANO_PEAK = buildTrackDef(
  'Volcano Peak', 'Nature Cup', 2,
  [
    [0, 0, -90], [30, 2, -85], [55, 5, -60], [65, 8, -20],
    [60, 10, 20], [40, 8, 55], [10, 5, 70], [-20, 3, 65],
    [-50, 5, 40], [-60, 8, 0], [-55, 5, -35], [-30, 2, -65],
  ],
  {
    theme: { skyColor: 0x1a0800, fogColor: 0x1a0800, ambientColor: 0x442211, accentColor: 0xff4400 },
    boostPads: [[-55, 8, 0]],
    itemBoxPositions: [
      [15, 0, -88], [63, 0, -40], [25, 0, 63], [-55, 0, -18],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Volcano in center
      const volcanoGeo = new THREE.ConeGeometry(40, 30, 8);
      const volcanoMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
      const volcano = new THREE.Mesh(volcanoGeo, volcanoMat);
      volcano.position.set(0, 10, 0);
      g.add(volcano);
      // Lava glow at top
      const lava = new THREE.Mesh(
        new THREE.SphereGeometry(5, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 1.0 })
      );
      lava.position.set(0, 26, 0);
      g.add(lava);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({ color: 0x1a1008 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_JUNGLE_RUN = buildTrackDef(
  'Jungle Run', 'Nature Cup', 2,
  [
    [0, 0, -60], [25, 0, -55], [40, 0, -30], [35, 0, 0],
    [20, 0, 25], [0, 0, 40], [-25, 0, 45], [-40, 0, 30],
    [-45, 0, 0], [-35, 0, -25], [-20, 0, -45],
  ],
  {
    theme: { skyColor: 0x0a1a0a, fogColor: 0x0a1a0a, ambientColor: 0x224422, accentColor: 0x44ff44 },
    itemBoxPositions: [
      [12, 0, -58], [38, 0, -15], [-12, 0, 43], [-40, 0, 15],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      const treeMat = new THREE.MeshStandardMaterial({ color: 0x225522 });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 40;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 6, 6), trunkMat);
        trunk.position.set(Math.cos(angle) * dist, 3, Math.sin(angle) * dist);
        g.add(trunk);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), treeMat);
        canopy.position.copy(trunk.position);
        canopy.position.y = 7;
        g.add(canopy);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300),
        new THREE.MeshStandardMaterial({ color: 0x1a2a10 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_DESERT_STORM = buildTrackDef(
  'Desert Storm', 'Nature Cup', 1,
  [
    [0, 0, -100], [50, 0, -90], [80, 2, -50], [90, 4, 0],
    [80, 2, 50], [50, 0, 80], [0, 0, 90], [-50, 0, 80],
    [-80, 2, 50], [-90, 4, 0], [-80, 2, -50], [-50, 0, -90],
  ],
  {
    theme: { skyColor: 0x2a2010, fogColor: 0x2a2010, ambientColor: 0x554422, accentColor: 0xffaa44 },
    boostPads: [[85, 0, -25], [-85, 0, 25]],
    itemBoxPositions: [
      [25, 0, -95], [85, 0, 25], [-25, 0, 85], [-85, 0, -25],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Sand dunes
      const sandMat = new THREE.MeshStandardMaterial({ color: 0xc4a44a });
      for (let i = 0; i < 15; i++) {
        const dune = new THREE.Mesh(
          new THREE.SphereGeometry(10 + Math.random() * 15, 8, 4),
          sandMat
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 50;
        dune.position.set(Math.cos(angle) * dist, -5, Math.sin(angle) * dist);
        dune.scale.y = 0.3;
        g.add(dune);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshStandardMaterial({ color: 0x8a7a3a })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_ARCTIC_SLIDE = buildTrackDef(
  'Arctic Slide', 'Nature Cup', 3,
  [
    [0, 0, -70], [30, 0, -65], [50, 0, -40], [55, 0, -10],
    [45, 0, 20], [25, 0, 45], [0, 0, 55], [-25, 0, 50],
    [-45, 0, 30], [-55, 0, 0], [-45, 0, -30], [-25, 0, -55],
  ],
  {
    theme: { skyColor: 0x0a1530, fogColor: 0x1a2540, ambientColor: 0x445566, accentColor: 0x88ddff },
    itemBoxPositions: [
      [15, 0, -68], [53, 0, -25], [-12, 0, 53], [-50, 0, 15],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      const iceMat = new THREE.MeshStandardMaterial({ color: 0xaaccee, transparent: true, opacity: 0.7 });
      // Ice formations
      for (let i = 0; i < 20; i++) {
        const ice = new THREE.Mesh(
          new THREE.ConeGeometry(1 + Math.random() * 2, 3 + Math.random() * 5, 5),
          iceMat
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 30;
        ice.position.set(Math.cos(angle) * dist, 2, Math.sin(angle) * dist);
        g.add(ice);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({ color: 0xddeeff })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

// =================== FANTASY CUP ===================

const TRACK_CLOUD_CITY = buildTrackDef(
  'Cloud City', 'Fantasy Cup', 3,
  [
    [0, 10, -60], [25, 15, -55], [45, 20, -30], [40, 25, 0],
    [25, 20, 30], [0, 15, 50], [-25, 20, 45], [-40, 25, 20],
    [-45, 20, -10], [-30, 15, -35],
  ],
  {
    theme: { skyColor: 0x4488cc, fogColor: 0x88bbee, ambientColor: 0x88aacc, accentColor: 0xffdd44 },
    itemBoxPositions: [
      [12, 10, -58], [43, 20, -15], [-12, 15, 48], [-43, 20, 5],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
      for (let i = 0; i < 30; i++) {
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(5 + Math.random() * 10, 6, 6), cloudMat);
        cloud.position.set(
          (Math.random() - 0.5) * 200,
          -5 + Math.random() * 10,
          (Math.random() - 0.5) * 200
        );
        cloud.scale.y = 0.3;
        g.add(cloud);
      }
      return g;
    },
  }
);

const TRACK_NEON_GRID = buildTrackDef(
  'Neon Grid', 'Fantasy Cup', 3,
  [
    [0, 0, -90], [40, 0, -85], [70, 0, -55], [75, 0, -10],
    [60, 0, 30], [30, 0, 60], [0, 0, 70], [-30, 0, 60],
    [-60, 0, 30], [-70, 0, -10], [-65, 0, -55], [-35, 0, -80],
  ],
  {
    theme: { skyColor: 0x000005, fogColor: 0x000010, ambientColor: 0x112244, accentColor: 0x00ffff },
    boostPads: [[73, 0, -33], [-68, 0, 10]],
    itemBoxPositions: [
      [20, 0, -88], [73, 0, -33], [-15, 0, 65], [-68, 0, 10],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Grid floor
      const gridMat = new THREE.MeshStandardMaterial({
        color: 0x000020, emissive: 0x001133, emissiveIntensity: 0.2,
      });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 40, 40), gridMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      g.add(ground);
      // Neon lines
      const neonMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00aaff, emissiveIntensity: 1.0 });
      for (let i = -10; i <= 10; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 400), neonMat);
        line.position.set(i * 20, 0, 0);
        g.add(line);
        const line2 = new THREE.Mesh(new THREE.BoxGeometry(400, 0.05, 0.1), neonMat);
        line2.position.set(0, 0, i * 20);
        g.add(line2);
      }
      return g;
    },
  }
);

const TRACK_LAVA_CASTLE = buildTrackDef(
  'Lava Castle', 'Fantasy Cup', 3,
  [
    [0, 0, -50], [20, 0, -45], [35, 0, -25], [30, 0, 0],
    [20, 0, 20], [5, 0, 35], [-15, 0, 40], [-30, 0, 30],
    [-40, 0, 10], [-35, 0, -15], [-20, 0, -35],
  ],
  {
    theme: { skyColor: 0x100000, fogColor: 0x150500, ambientColor: 0x331100, accentColor: 0xff4400 },
    itemBoxPositions: [
      [10, 0, -48], [33, 0, -12], [-10, 0, 38], [-38, 0, -3],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x332222 });
      const lavaMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.8 });
      // Castle walls
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 50;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 2), stoneMat);
        wall.position.set(Math.cos(angle) * dist, 5, Math.sin(angle) * dist);
        wall.rotation.y = angle + Math.PI / 2;
        g.add(wall);
      }
      // Lava moat
      const lava = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), lavaMat);
      lava.rotation.x = -Math.PI / 2;
      lava.position.y = -0.5;
      g.add(lava);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x221111 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_SPACE_STATION = buildTrackDef(
  'Space Station', 'Fantasy Cup', 4,
  [
    [0, 0, -70], [30, 0, -65], [50, 0, -40], [55, 0, -5],
    [45, 0, 25], [20, 0, 50], [0, 0, 60], [-25, 0, 50],
    [-45, 0, 25], [-55, 0, -5], [-50, 0, -40], [-25, 0, -60],
  ],
  {
    theme: { skyColor: 0x000008, fogColor: 0x000005, ambientColor: 0x112233, accentColor: 0x4488ff },
    boostPads: [[53, 0, -22]],
    itemBoxPositions: [
      [15, 0, -68], [53, 0, -22], [-12, 0, 55], [-53, 0, 10],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Stars
      const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let i = 0; i < 200; i++) {
        const star = new THREE.Mesh(new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 4, 4), starMat);
        star.position.set(
          (Math.random() - 0.5) * 400,
          20 + Math.random() * 100,
          (Math.random() - 0.5) * 400
        );
        g.add(star);
      }
      // Station structure
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.8, roughness: 0.3 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(80, 3, 8, 32), metalMat);
      ring.position.y = -3;
      g.add(ring);
      return g;
    },
  }
);

// =================== N GAMES CUP ===================

const TRACK_THE_PIT = buildTrackDef(
  'The Pit', 'N Games Cup', 3,
  [
    [0, 0, -50], [25, 0, -45], [40, 0, -20], [35, 0, 10],
    [20, 0, 35], [0, 0, 45], [-20, 0, 40], [-35, 0, 20],
    [-40, 0, -10], [-30, 0, -35],
  ],
  {
    theme: { skyColor: 0x0a0a0a, fogColor: 0x0a0a0a, ambientColor: 0x333333, accentColor: 0x80e060 },
    boostPads: [[38, 0, -5]],
    itemBoxPositions: [
      [12, 0, -48], [38, 0, -5], [-10, 0, 43], [-38, 0, 5],
      [0, 0, 0], [20, 0, -25], [-20, 0, 25],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      // Arena pillars with crew colors
      const colors = [0x80e060, 0xf0c040, 0xe04040, 0x40c0e0];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
          new THREE.MeshStandardMaterial({ color: colors[i % 4], emissive: colors[i % 4], emissiveIntensity: 0.3 })
        );
        pillar.position.set(Math.cos(angle) * 55, 6, Math.sin(angle) * 55);
        g.add(pillar);
      }
      return g;
    },
  }
);

const TRACK_EMBER_DEPTHS = buildTrackDef(
  'Ember Depths', 'N Games Cup', 3,
  [
    [0, 0, -45], [15, 0, -42], [30, 0, -30], [35, 0, -10],
    [28, 0, 10], [15, 0, 28], [0, 0, 35], [-15, 0, 30],
    [-30, 0, 15], [-35, 0, -5], [-28, 0, -22], [-12, 0, -38],
  ],
  {
    theme: { skyColor: 0x050000, fogColor: 0x080200, ambientColor: 0x221100, accentColor: 0xff6600 },
    itemBoxPositions: [
      [8, 0, -44], [33, 0, -20], [-8, 0, 33], [-33, 0, 5],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Torches
      const torchMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 1.0 });
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 42;
        const torch = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), torchMat);
        torch.position.set(Math.cos(angle) * dist, 3, Math.sin(angle) * dist);
        g.add(torch);
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 3, 6),
          new THREE.MeshStandardMaterial({ color: 0x553311 })
        );
        pole.position.copy(torch.position);
        pole.position.y = 1.5;
        g.add(pole);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x0a0500 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_CASE_FACTORY = buildTrackDef(
  'Case Factory', 'N Games Cup', 3,
  [
    [0, 0, -70], [30, 0, -65], [55, 0, -40], [60, 0, 0],
    [50, 0, 35], [25, 0, 55], [0, 0, 60], [-30, 0, 55],
    [-50, 0, 30], [-55, 0, -5], [-45, 0, -40], [-20, 0, -60],
  ],
  {
    theme: { skyColor: 0x0a0a15, fogColor: 0x0a0a15, ambientColor: 0x333355, accentColor: 0xaa44ff },
    boostPads: [[58, 0, -20]],
    itemBoxPositions: [
      [15, 0, -68], [58, 0, -20], [-15, 0, 58], [-53, 0, 13],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // Conveyor belts (decorative)
      const convMat = new THREE.MeshStandardMaterial({ color: 0x444455 });
      for (let i = 0; i < 6; i++) {
        const conv = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 20), convMat);
        const angle = (i / 6) * Math.PI * 2;
        conv.position.set(Math.cos(angle) * 75, 0.25, Math.sin(angle) * 75);
        conv.rotation.y = angle;
        g.add(conv);
      }
      // Floating "skins" (colorful boxes)
      const skinColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff];
      for (let i = 0; i < 15; i++) {
        const skin = new THREE.Mesh(
          new THREE.BoxGeometry(1, 2, 0.1),
          new THREE.MeshStandardMaterial({ color: skinColors[i % 5], emissive: skinColors[i % 5], emissiveIntensity: 0.3 })
        );
        skin.position.set(
          (Math.random() - 0.5) * 120,
          5 + Math.random() * 10,
          (Math.random() - 0.5) * 120
        );
        skin.rotation.y = Math.random() * Math.PI;
        g.add(skin);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300),
        new THREE.MeshStandardMaterial({ color: 0x111122 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      g.add(ground);
      return g;
    },
  }
);

const TRACK_N_GRAND_PRIX = buildTrackDef(
  'N Grand Prix', 'N Games Cup', 4,
  [
    // Long track combining elements — large loop
    [0, 0, -140], [40, 0, -135], [75, 2, -110], [95, 5, -70],
    [100, 5, -20], [95, 3, 30], [80, 0, 70], [50, 2, 100],
    [10, 5, 120], [-30, 5, 115], [-65, 3, 90], [-85, 0, 55],
    [-95, 2, 10], [-90, 5, -35], [-75, 3, -70], [-50, 0, -100],
    [-20, 0, -130],
  ],
  {
    numCheckpoints: 16,
    theme: { skyColor: 0x050510, fogColor: 0x050510, ambientColor: 0x334455, accentColor: 0x80e060 },
    boostPads: [[98, 0, -45], [-93, 0, -12], [30, 0, 110], [-78, 0, 73]],
    itemBoxPositions: [
      [20, 0, -138], [93, 0, -45], [65, 0, 85], [-10, 0, 118],
      [-75, 0, 73], [-93, 0, -12], [-63, 0, -80], [0, 0, 0],
    ],
    buildDecorations: () => {
      const g = new THREE.Group();
      // N Games logo pillars at intervals
      const colors = [0x80e060, 0xf0c040, 0xe04040, 0x40c0e0];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 110;
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(1, 1, 15, 6),
          new THREE.MeshStandardMaterial({ color: colors[i % 4], emissive: colors[i % 4], emissiveIntensity: 0.3 })
        );
        pillar.position.set(Math.cos(angle) * dist, 7.5, Math.sin(angle) * dist);
        g.add(pillar);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshStandardMaterial({ color: 0x111118 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      g.add(ground);
      return g;
    },
  }
);

// =================== ALL TRACKS ===================

const ALL_TRACKS = [
  TRACK_DOWNTOWN_DRAG, TRACK_HARBOR_RUSH, TRACK_NIGHT_MARKET, TRACK_FREEWAY_FURY,
  TRACK_VOLCANO_PEAK, TRACK_JUNGLE_RUN, TRACK_DESERT_STORM, TRACK_ARCTIC_SLIDE,
  TRACK_CLOUD_CITY, TRACK_NEON_GRID, TRACK_LAVA_CASTLE, TRACK_SPACE_STATION,
  TRACK_THE_PIT, TRACK_EMBER_DEPTHS, TRACK_CASE_FACTORY, TRACK_N_GRAND_PRIX,
];

const CUPS = {
  'Street Cup': [TRACK_DOWNTOWN_DRAG, TRACK_HARBOR_RUSH, TRACK_NIGHT_MARKET, TRACK_FREEWAY_FURY],
  'Nature Cup': [TRACK_VOLCANO_PEAK, TRACK_JUNGLE_RUN, TRACK_DESERT_STORM, TRACK_ARCTIC_SLIDE],
  'Fantasy Cup': [TRACK_CLOUD_CITY, TRACK_NEON_GRID, TRACK_LAVA_CASTLE, TRACK_SPACE_STATION],
  'N Games Cup': [TRACK_THE_PIT, TRACK_EMBER_DEPTHS, TRACK_CASE_FACTORY, TRACK_N_GRAND_PRIX],
};

const ALL_CARS = [Nissan350Z, NissanGTR, BMWM8, CorvetteC6, ShoppingCart, Lawnmower, F1Car, SchoolBus, GolfCart];
const CREW_CARS = { keshawn: Nissan350Z, sean: NissanGTR, dart: BMWM8, amari: CorvetteC6 };
