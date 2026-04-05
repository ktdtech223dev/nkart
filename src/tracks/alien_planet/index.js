import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// ALIEN PLANET  –  Space Cup, Race 4
// Racing across the surface of a bioluminescent alien world. Purple-black dirt,
// glowing cyan/green flora, enormous mushroom canopies, alien creature silhouettes
// in the distance. Two moons hang in a purple-orange gas-cloud sky.
// Bioluminescent spore particles drift through the air.
// ---------------------------------------------------------------------------

export const track = {
  id: 'alien_planet',
  name: 'ALIEN PLANET',
  cup: 'space',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_space_04',

  skyConfig: {
    topColor:    0x200030,
    bottomColor: 0x6a2010,
    fogColor:    0x300820,
    fogDensity:  0.007,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 250;

    // ------------------------------------------------------------------ CURVE
    // Layout: sweeping alien landscape – wide arcs around mushroom groves,
    // a pass through a bioluminescent canyon, and a high-speed straight
    // beneath the twin moons.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  55),   // start/finish
        new THREE.Vector3( 22,  0,  48),
        new THREE.Vector3( 44,  0,  32),   // eastern mushroom grove
        new THREE.Vector3( 56,  0,  10),
        new THREE.Vector3( 54,  0, -12),
        new THREE.Vector3( 42,  0, -34),   // canyon section
        new THREE.Vector3( 24,  0, -50),
        new THREE.Vector3(  4,  0, -56),   // deep south
        new THREE.Vector3(-18,  0, -52),
        new THREE.Vector3(-36,  0, -40),   // western grove
        new THREE.Vector3(-52,  0, -20),
        new THREE.Vector3(-58,  0,   2),
        new THREE.Vector3(-52,  0,  22),   // northern sweep
        new THREE.Vector3(-36,  0,  40),
        new THREE.Vector3(-14,  0,  52),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY (purple-orange gas cloud)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // Gas cloud layers (translucent large spheres at varying heights)
    [
      { pos: [  60, 80, -180], r: 70, col: 0x8800aa, opa: 0.20 },
      { pos: [-100, 90, -160], r: 55, col: 0xcc4400, opa: 0.16 },
      { pos: [ -20,110, -200], r: 80, col: 0x550077, opa: 0.14 },
      { pos: [ 140, 60, -150], r: 45, col: 0xff6600, opa: 0.12 },
    ].forEach(({ pos, r, col, opa }) => {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(r, 14, 10),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: opa, side: THREE.BackSide, depthWrite: false })
      );
      cloud.position.set(...pos);
      scene.add(cloud);
    });

    // Stars (visible through the atmosphere)
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 170 + Math.random() * 15;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xddbbff, size: 0.5, sizeAttenuation: true })));

    // ------------------------------------------------------------------ LIGHTING
    TrackBuilder.createLighting(
      scene,
      0x330044, 0.55,   // purple ambient
      0xff8833, 1.2,    // orange alien sun
      [50, 70, 40],
      true
    );
    // Bioluminescent fill (cyan)
    const bioFill = new THREE.PointLight(0x00ffcc, 0.4, 100);
    bioFill.position.set(0, 8, 0);
    scene.add(bioFill);
    // Western grove glow (green)
    const groveGlow = new THREE.PointLight(0x00cc44, 0.5, 60);
    groveGlow.position.set(-45, 10, 0);
    scene.add(groveGlow);

    // ------------------------------------------------------------------ GROUND  (purple-black alien dirt)
    const dirtMat = toon('#1a0a22');
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), dirtMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    scene.add(ground);

    // Bioluminescent ground veins (glowing lines in the dirt)
    const veinMat = toon('#003322', { emissive: new THREE.Color('#00aa66'), emissiveIntensity: 0.8 });
    [
      { x:  10, z:  20, len: 40, ry: 0.5 },
      { x: -15, z: -15, len: 35, ry: 1.3 },
      { x:  30, z: -35, len: 28, ry: -0.4 },
      { x: -40, z:  20, len: 45, ry: 0.9 },
      { x:   5, z: -50, len: 32, ry: 0.1 },
      { x: -50, z: -30, len: 20, ry: 1.7 },
      { x:  45, z:  35, len: 25, ry: -0.7 },
    ].forEach(({ x, z, len, ry }) => {
      const vein = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.8), veinMat);
      vein.rotation.x = -Math.PI / 2;
      vein.rotation.z = ry;
      vein.position.set(x, 0.01, z);
      scene.add(vein);
    });

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#2a1535');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre line (cyan bioluminescent glow)
    trackGroup.add(new THREE.Mesh(
      TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.09),
      toon('#00ffcc', { emissive: new THREE.Color('#00aaaa'), emissiveIntensity: 1.0, transparent: true, opacity: 0.65 })
    ));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.0, 0x3a1848);
    trackGroup.add(walls.visual);

    // ------------------------------------------------------------------ COLLISION MESH
    const collisionGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH + 2, SEGMENTS, 0);
    const collisionMesh = new THREE.Mesh(
      collisionGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    trackGroup.add(collisionMesh);
    const wallMesh = walls.collision;
    trackGroup.add(wallMesh);

    // ================================================================== PROPS
    const mat = (hex, emissive = 0x000000, emissiveIntensity = 1) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissiveIntensity; }
      return m;
    };

    // --- 1. BIOLUMINESCENT FLORA – tall stalk plants (glowing cyan/green)
    const floraPositions = [
      [ 60, 0,  25], [ 58, 0,  -8], [ 62, 0,  -20],  // east border
      [-62, 0,  10], [-60, 0, -25], [-64, 0,  28],    // west border
      [ 20, 0,  62], [-18, 0,  60], [  2, 0, -64],    // north/south
      [ 38, 0, -52], [-30, 0, -55], [ 55, 0,  45],
    ];
    floraPositions.forEach(([fx, fy, fz]) => {
      const count = 3 + Math.floor(Math.random() * 4);
      for (let p = 0; p < count; p++) {
        const h  = 4 + Math.random() * 10;
        const rb = 0.2 + Math.random() * 0.4;
        // Stalk
        const stalk = new THREE.Mesh(
          new THREE.CylinderGeometry(rb * 0.5, rb, h, 6),
          mat(0x003322, 0x00cc66, 1.0)
        );
        stalk.position.set(
          fx + (Math.random() - 0.5) * 8,
          h / 2,
          fz + (Math.random() - 0.5) * 8
        );
        stalk.rotation.y = Math.random() * Math.PI;
        stalk.castShadow = true;
        scene.add(stalk);
        // Bulb/flower at top (sphere)
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(rb * 2.5, 7, 7),
          mat(0x00ffaa, 0x00ddaa, 2.0)
        );
        bulb.position.set(stalk.position.x, h + rb * 2, stalk.position.z);
        scene.add(bulb);
      }
      // Glow point per cluster
      const glow = new THREE.PointLight(Math.random() > 0.5 ? 0x00ffcc : 0x44ff44, 0.45, 16);
      glow.position.set(fx, 4, fz);
      scene.add(glow);
    });

    // --- 2. MUSHROOM CANOPY (large cone + cylinder – eastern grove)
    const mushroomDefs = [
      { x:  52, z:  20, stemH: 18, capR: 20, col: 0x550088 },
      { x:  62, z: -10, stemH: 14, capR: 16, col: 0x442266 },
      { x: -58, z:  -5, stemH: 20, capR: 22, col: 0x440066 },
      { x: -52, z:  28, stemH: 15, capR: 18, col: 0x660088 },
      { x:   5, z: -65, stemH: 22, capR: 24, col: 0x4d0077 },
    ];
    mushroomDefs.forEach(({ x, z, stemH, capR, col }) => {
      // Stem (cylinder)
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2, stemH, 12),
        mat(0x220033, 0x110022, 0.05)
      );
      stem.position.set(x, stemH / 2, z);
      stem.castShadow = true;
      scene.add(stem);
      // Cap (flat cone / wide disc)
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(capR, capR * 0.35, 16),
        mat(col, col, 0.6)
      );
      cap.position.set(x, stemH + capR * 0.15, z);
      cap.castShadow = true;
      scene.add(cap);
      // Cap underside glow (emissive ring)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(capR * 0.6, 0.8, 6, 24),
        mat(0x00ffcc, 0x00ffcc, 1.8)
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, stemH + 0.5, z);
      scene.add(ring);
      // Mushroom glow light
      const mLight = new THREE.PointLight(0x8800cc, 0.6, capR * 2.5);
      mLight.position.set(x, stemH * 0.7, z);
      scene.add(mLight);
      // Spore drips (small emissive cones hanging under cap)
      for (let s = 0; s < 8; s++) {
        const angle = (s / 8) * Math.PI * 2;
        const sr = capR * 0.45;
        const spore = new THREE.Mesh(
          new THREE.ConeGeometry(0.25, 1.2, 5),
          mat(0x00ddaa, 0x00bbaa, 2.0)
        );
        spore.rotation.x = Math.PI; // point down
        spore.position.set(
          x + Math.cos(angle) * sr,
          stemH,
          z + Math.sin(angle) * sr
        );
        scene.add(spore);
      }
    });

    // --- 3. TWO MOONS IN SKY
    const moonDefs = [
      { pos: [ -80, 120, -200], r: 22, col: 0xddccff, emit: 0x8866cc, opa: 0.5 },
      { pos: [  60, 100, -220], r: 14, col: 0xffddcc, emit: 0xcc8844, opa: 0.35 },
    ];
    moonDefs.forEach(({ pos, r, col, emit, opa }) => {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(r, 20, 20),
        toon('#' + (col >>> 0).toString(16).padStart(6, '0'), { emissive: new THREE.Color(emit), emissiveIntensity: 0.3 })
      );
      moon.position.set(...pos);
      scene.add(moon);
      // Moon glow halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.15, 16, 16),
        new THREE.MeshBasicMaterial({ color: emit, transparent: true, opacity: opa * 0.35, side: THREE.FrontSide, depthWrite: false })
      );
      halo.position.set(...pos);
      scene.add(halo);
      // Moon light
      const mL = new THREE.PointLight(col, 0.3, 200);
      mL.position.set(...pos);
      scene.add(mL);
    });

    // --- 4. ALIEN CREATURES (background silhouettes – simple geometric shapes)
    const creatureDefs = [
      { x:  70, z: -50 }, { x: -75, z:  40 }, { x:  30, z: -70 }, { x: -20, z:  72 },
    ];
    creatureDefs.forEach(({ x, z }) => {
      // Body (elongated sphere)
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        mat(0x110022, 0x220033, 0.05)
      );
      body.scale.set(0.8, 1.4, 1.0);
      body.position.set(x, 5, z);
      scene.add(body);
      // Neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 4, 6), mat(0x110022));
      neck.position.set(x, 9.5, z);
      scene.add(neck);
      // Head (sphere)
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), mat(0x110022));
      head.position.set(x, 12.5, z);
      scene.add(head);
      // Eyes (emissive small spheres)
      [-0.6, 0.6].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 5, 5), mat(0x00ffaa, 0x00ffaa, 3.0));
        eye.position.set(x + ex, 13, z + 1.5);
        scene.add(eye);
      });
      // Legs (4 cylinders)
      [[-1.5, -1], [-1.5, 1], [1.5, -1], [1.5, 1]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 4, 6), mat(0x110022));
        leg.position.set(x + lx, 2, z + lz);
        leg.rotation.z = lx > 0 ? 0.2 : -0.2;
        scene.add(leg);
      });
    });

    // --- 5. GLOWING CRYSTAL SPIRES (south canyon section)
    [
      { x:  28, z: -44, h: 12 }, { x:  16, z: -52, h:  9 },
      { x:  34, z: -50, h: 14 }, { x:  40, z: -38, h:  8 },
    ].forEach(({ x, z, h }) => {
      // Main spire
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, h, 5),
        mat(0x004422, 0x00cc66, 1.5)
      );
      spire.position.set(x, h / 2, z);
      spire.rotation.y = Math.random() * Math.PI;
      spire.castShadow = true;
      scene.add(spire);
      // Secondary smaller spires
      for (let s = 0; s < 2; s++) {
        const sh = h * 0.5;
        const sp = new THREE.Mesh(
          new THREE.ConeGeometry(0.6, sh, 5),
          mat(0x003318, 0x00aa55, 1.2)
        );
        sp.position.set(x + (Math.random() - 0.5) * 4, sh / 2, z + (Math.random() - 0.5) * 4);
        sp.rotation.y = Math.random() * Math.PI;
        scene.add(sp);
      }
      scene.add(new THREE.PointLight(0x00cc44, 0.5, 18)).position.set(x, h * 0.6, z);
    });

    // --- 6. ALIEN RUINS (ancient carved stone blocks)
    [
      { x: -30, z:  52, ry: 0.3,  w: 8, h: 5, d: 6 },
      { x:  48, z:  48, ry: -0.5, w: 6, h: 4, d: 5 },
      { x: -55, z: -45, ry: 0.8,  w: 10, h: 6, d: 7 },
    ].forEach(({ x, z, ry, w, h, d }) => {
      const ruin = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(0x221133, 0x110022, 0.03));
      ruin.position.set(x, h / 2, z);
      ruin.rotation.y = ry;
      ruin.rotation.z = (Math.random() - 0.5) * 0.2;
      ruin.castShadow = true;
      scene.add(ruin);
      // Glowing rune etchings (thin emissive plane on face)
      const rune = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.7, h * 0.6),
        mat(0x001a0a, 0x00ff88, 1.0)
      );
      rune.position.set(x, h * 0.5, z + d / 2 + 0.05);
      rune.rotation.y = ry;
      scene.add(rune);
    });

    // --- 7. FLOATING ENERGY ORBS (decorative, near track)
    [
      { x:  10, z:  35, h: 6 }, { x: -12, z: -30, h: 8 },
      { x:  38, z:  15, h: 5 }, { x: -42, z:  -8, h: 7 },
    ].forEach(({ x, z, h }) => {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 12, 12),
        mat(0x00ffdd, 0x00ffdd, 3.0)
      );
      orb.position.set(x, h, z);
      scene.add(orb);
      // Halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x00ddcc, transparent: true, opacity: 0.18, depthWrite: false })
      );
      halo.position.copy(orb.position);
      scene.add(halo);
      scene.add(new THREE.PointLight(0x00ffcc, 0.7, 14)).position.set(x, h, z);
      // Tether beam (cylinder from orb to ground)
      const tether = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, h, 4),
        mat(0x00bbaa, 0x00aaaa, 1.2)
      );
      tether.position.set(x, h / 2, z);
      scene.add(tether);
    });

    // --- 8. BIOLUMINESCENT GROUND POOLS (flat glowing circles)
    [
      { x:  25, z:  38, r: 5, col: 0x00cc88 },
      { x: -38, z: -20, r: 7, col: 0x00aa44 },
      { x:  -8, z:  48, r: 4, col: 0x44ffcc },
      { x:  48, z: -30, r: 6, col: 0x00ddaa },
    ].forEach(({ x, z, r, col }) => {
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(r, 20),
        toon('#' + (col >>> 0).toString(16).padStart(6, '0'), { emissive: new THREE.Color(col), emissiveIntensity: 0.8, transparent: true, opacity: 0.75 })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x, 0.02, z);
      scene.add(pool);
      // Reflection glow
      const pLight = new THREE.PointLight(col, 0.4, r * 4);
      pLight.position.set(x, 1, z);
      scene.add(pLight);
    });

    // ------------------------------------------------------------------ BIOLUMINESCENT SPORE PARTICLES (150)
    TrackBuilder.createParticles(scene, {
      count:  150,
      spread:  90,
      color:   '#00ffcc',
      size:    0.20,
      speed:   0.04,
    });
    // Secondary spore layer (green tint)
    TrackBuilder.createParticles(scene, {
      count:   80,
      spread:  60,
      color:   '#44ff88',
      size:    0.12,
      speed:   0.025,
    });
    // Slow large spores
    TrackBuilder.createParticles(scene, {
      count:   30,
      spread:  50,
      color:   '#00ddaa',
      size:    0.35,
      speed:   0.015,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'alien_dirt',  traction: 0.88, friction: 0.80 },
      { type: 'bio_pool',    traction: 0.70, friction: 0.65 },
    ];

    const hazards = [
      {
        type:     'spore_cloud',
        position: new THREE.Vector3(28, 0.5, -46),
        radius:   10,
        effect:   { tractionMultiplier: 0.72, visibilityReduction: 0.4 },
      },
    ];

    return {
      collisionMesh,
      wallMesh: walls.collision,
      trackGroup,
      curve,
      checkpoints,
      startPositions,
      itemBoxPositions,
      waypointPath,
      surfaceZones: [],
      hazards: [],
      respawnY: -10,
    };
  },
};
