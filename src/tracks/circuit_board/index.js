import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// CIRCUIT BOARD  –  Arcade Cup, Race 1
// A giant PCB surface with 90-degree turns, capacitors, IC chips, resistors,
// and glowing solder points. Black void sky with green ambient glow.
// ---------------------------------------------------------------------------

export const track = {
  id: 'circuit_board',
  name: 'CIRCUIT BOARD',
  cup: 'arcade',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_arcade_01',

  skyConfig: {
    topColor:    0x000a00,
    bottomColor: 0x001500,
    fogColor:    0x000800,
    fogDensity:  0.012,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Angular PCB-style circuit with mostly 90-degree turns.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 30,  0,   0),
        new THREE.Vector3( 45,  0,  15),
        new THREE.Vector3( 45,  0,  40),
        new THREE.Vector3( 30,  0,  55),
        new THREE.Vector3(  0,  0,  55),
        new THREE.Vector3(-15,  0,  40),
        new THREE.Vector3(-15,  0,  25),
        new THREE.Vector3(-30,  0,  25),
        new THREE.Vector3(-45,  0,  10),
        new THREE.Vector3(-45,  0, -15),
        new THREE.Vector3(-30,  0, -30),
        new THREE.Vector3( -5,  0, -30),
        new THREE.Vector3( 10,  0, -15),
        new THREE.Vector3( 10,  0,  -5),
      ],
      true,
      'catmullrom',
      0.2   // low tension for sharper corners
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY + FOG
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING
    // Green-tinted ambient for PCB feel
    TrackBuilder.createLighting(
      scene,
      0x003300, 1.2,          // strong green ambient
      0x00ff44, 0.6,          // green directional
      [20, 60, 10],
      false
    );
    // Secondary cool fill
    const fillLight = new THREE.PointLight(0x00ff88, 0.8, 200);
    fillLight.position.set(0, 30, 25);
    scene.add(fillLight);

    // ------------------------------------------------------------------ GROUND (PCB surface)
    const pcbMat = toon('#0a2e0a'); // dark green PCB
    const pcbGeo = new THREE.PlaneGeometry(220, 180);
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.rotation.x = -Math.PI / 2;
    pcbMesh.position.y = -0.15;
    pcbMesh.receiveShadow = true;
    scene.add(pcbMesh);

    // PCB trace lines (bright green lines on the surface)
    const traceMat = toon('#00cc44', { emissive: new THREE.Color('#003300') });
    const traceConfigs = [
      { x: -50, z: 0,  w: 120, d: 0.4 },
      { x:   0, z: 30, w: 0.4, d: 80  },
      { x:  20, z:-20, w: 60,  d: 0.4 },
      { x: -20, z: 50, w: 0.4, d: 60  },
      { x:  40, z: 15, w: 0.4, d: 50  },
      { x: -35, z:-10, w: 80,  d: 0.4 },
    ];
    traceConfigs.forEach(({ x, z, w, d }) => {
      const traceGeo = new THREE.PlaneGeometry(w, d);
      const trace = new THREE.Mesh(traceGeo, traceMat);
      trace.rotation.x = -Math.PI / 2;
      trace.position.set(x, -0.05, z);
      scene.add(trace);
    });

    // ------------------------------------------------------------------ ROAD (copper trace style)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#1a5c1a', { emissive: new THREE.Color('#003300') });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre line (bright green emissive trace)
    const centreMat = toon('#00ff44', { emissive: new THREE.Color('#00cc22'), transparent: true, opacity: 0.7 });
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.09);
    trackGroup.add(new THREE.Mesh(centreGeo, centreMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.4, 0x00aa33);
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

    // Helper materials
    const mat = (hex, emissive = 0x000000) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); }
      return m;
    };

    // --- 1. Capacitors (tall cylinders, clustered near start)
    const capPositions = [
      [ 22,  0,  12], [ 25,  0,  12], [ 22,  0,   8],
      [-10,  0,  45], [-13,  0,  45], [-10,  0,  48],
      [ 35,  0, -25], [ 38,  0, -25],
    ];
    capPositions.forEach(([x, y, z], i) => {
      const height = 6 + (i % 3) * 2;
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, height, 12),
        mat(0x4a8a3a, 0x003300)
      );
      cap.position.set(x, height / 2, z);
      cap.castShadow = true;
      scene.add(cap);
      // Top lead
      const lead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6),
        mat(0xdddddd)
      );
      lead.position.set(x, height + 0.75, z);
      scene.add(lead);
      // Silver top ring
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 0.4, 12),
        mat(0xbbbbbb)
      );
      ring.position.set(x, height + 0.2, z);
      scene.add(ring);
    });

    // --- 2. Resistors (rectangular components with colour bands)
    const resistorPositions = [
      [ 10,  0,  30], [ 15,  0,  30], [ 20,  0,  30],
      [-25,  0,   5], [-25,  0,   0], [-25,  0,  -5],
      [  5,  0, -20], [ 10,  0, -20],
    ];
    const bandColors = [0xff0000, 0xff8800, 0xffff00, 0x0000ff, 0x008800];
    resistorPositions.forEach(([x, y, z], i) => {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.8, 0.8),
        mat(0xc8a850)
      );
      body.position.set(x, 0.4, z);
      body.rotation.y = (i % 2) * Math.PI / 2;
      body.castShadow = true;
      scene.add(body);
      // Colour bands
      [-0.5, 0, 0.5].forEach((bx, bi) => {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.85, 0.85),
          mat(bandColors[(i + bi) % bandColors.length])
        );
        band.position.set(x + bx, 0.4, z);
        band.rotation.y = body.rotation.y;
        scene.add(band);
      });
      // Wire leads
      [-1.5, 1.5].forEach(bx => {
        const wire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6),
          mat(0xaaaaaa)
        );
        wire.rotation.z = Math.PI / 2;
        wire.position.set(x + bx, 0.4, z);
        scene.add(wire);
      });
    });

    // --- 3. IC Chip buildings (flat black rectangles with pin legs)
    const icPositions = [
      [-35,  0,  30], [-20,  0, -15], [ 40,  0,  25], [-5,  0, -28],
    ];
    icPositions.forEach(([x, y, z], i) => {
      const w = 8 + i * 2;
      const d = 5 + i;
      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(w, 2, d),
        mat(0x111111)
      );
      chip.position.set(x, 1, z);
      chip.castShadow = true;
      scene.add(chip);
      // Label text stripe
      const label = new THREE.Mesh(
        new THREE.BoxGeometry(w - 1, 0.05, 1.5),
        mat(0xffffff, 0x222222)
      );
      label.position.set(x, 2.05, z);
      scene.add(label);
      // Pin legs on both sides
      const pinCount = 4 + i;
      for (let p = 0; p < pinCount; p++) {
        const pinX = x - (w / 2 - 0.5) + p * (w / (pinCount));
        [z - d / 2 - 0.5, z + d / 2 + 0.5].forEach(pz => {
          const pin = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.4, 1.0),
            mat(0xaaaaaa)
          );
          pin.position.set(pinX, 0.2, pz);
          scene.add(pin);
        });
      }
    });

    // --- 4. Glowing solder points (emissive spheres)
    const solderPositions = [
      [  5, 0,  15], [-15, 0, 20], [ 25, 0,  45], [ 35, 0,  10],
      [-40, 0,   5], [ 15, 0, -25], [-5, 0, -10], [ 30, 0, -20],
      [-20, 0, -28], [  0, 0,  35], [ 45, 0,  30], [-30, 0,  15],
    ];
    const solderMat = toon('#aaddaa', { emissive: new THREE.Color('#00ff44') });
    solderPositions.forEach(([x, y, z]) => {
      const solder = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 10),
        solderMat
      );
      solder.position.set(x, 0.5, z);
      scene.add(solder);
      // Glow point light
      const glow = new THREE.PointLight(0x00ff44, 0.4, 8);
      glow.position.set(x, 1, z);
      scene.add(glow);
    });

    // --- 5. Large via holes (dark circles on PCB)
    for (let i = 0; i < 20; i++) {
      const vx = (Math.random() - 0.5) * 180;
      const vz = (Math.random() - 0.5) * 140;
      const via = new THREE.Mesh(
        new THREE.CircleGeometry(0.6, 12),
        mat(0x002200)
      );
      via.rotation.x = -Math.PI / 2;
      via.position.set(vx, 0.0, vz);
      scene.add(via);
    }

    // --- 6. Transformer coils (torus shapes)
    [
      [ 50,  0,  50], [-50,  0, -25],
    ].forEach(([x, y, z]) => {
      for (let ring = 0; ring < 5; ring++) {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(2.5, 0.25, 8, 20),
          mat(0xcc8800)
        );
        coil.position.set(x, ring * 0.6 + 0.3, z);
        coil.castShadow = true;
        scene.add(coil);
      }
    });

    // --- 7. Diodes (small elongated capsules with stripe)
    [
      [ 42,  0,  42], [ 44,  0,  42], [ 42,  0, -28],
    ].forEach(([x, y, z]) => {
      const diodeBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 2.5, 10),
        mat(0x888844)
      );
      diodeBody.rotation.z = Math.PI / 2;
      diodeBody.position.set(x, 0.4, z);
      scene.add(diodeBody);
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.41, 0.41, 0.3, 10),
        mat(0x888888)
      );
      stripe.rotation.z = Math.PI / 2;
      stripe.position.set(x + 0.8, 0.4, z);
      scene.add(stripe);
    });

    // --- 8. Tall antenna towers (thin cylinders at corners)
    [
      [ 60,  0,  65], [-60,  0,  65], [ 60,  0, -40], [-60,  0, -40],
    ].forEach(([x, y, z]) => {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 25, 8),
        mat(0x334433)
      );
      antenna.position.set(x, 12.5, z);
      antenna.castShadow = true;
      scene.add(antenna);
      const antLight = new THREE.PointLight(0x00ff44, 0.6, 20);
      antLight.position.set(x, 26, z);
      scene.add(antLight);
      const blink = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        mat(0x00ff44, 0x00cc00)
      );
      blink.position.set(x, 26, z);
      scene.add(blink);
    });

    // ------------------------------------------------------------------ BINARY PARTICLES
    // Green glowing points drifting upward
    TrackBuilder.createParticles(scene, {
      count:  300,
      spread:  120,
      color:  '#00ff44',
      size:    0.22,
      speed:   0.03,
    });
    // Smaller dim secondary layer
    TrackBuilder.createParticles(scene, {
      count:  150,
      spread:  100,
      color:  '#004422',
      size:    0.12,
      speed:   0.01,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'asphalt', traction: 1.0, friction: 0.9 },
    ];

    const hazards = [];

    return {
      collisionMesh,
      wallMesh,
      trackGroup,
      curve,
      checkpoints,
      startPositions,
      itemBoxPositions,
      waypointPath,
      surfaceZones,
      hazards,
      respawnY: -5,
    };
  },
};
