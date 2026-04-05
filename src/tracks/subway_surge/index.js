import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// SUBWAY SURGE  –  City Cup, Race 2
// Underground subway racing through platforms, tunnels, and maintenance bays.
// Tiled platform floors, static subway trains, support columns, vending
// machines, flickering fluorescent atmosphere.
// ---------------------------------------------------------------------------

export const track = {
  id: 'subway_surge',
  name: 'SUBWAY SURGE',
  cup: 'city',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_city_02',

  skyConfig: {
    topColor:    0x080810,
    bottomColor: 0x0a0a14,
    fogColor:    0x080810,
    fogDensity:  0.022,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Loop through two platforms connected by tunnel bores, a maintenance bay
    // detour, and a return tunnel. All underground – mostly flat with slight
    // dips through the tunnel bores.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Platform A – start/finish
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 20,  0,   0),
        new THREE.Vector3( 40,  0,   0),
        // Tunnel bore A  (slight dip)
        new THREE.Vector3( 55,  0,  -8),
        new THREE.Vector3( 60,  0, -25),
        new THREE.Vector3( 58,  0, -45),
        // Platform B
        new THREE.Vector3( 45,  0, -55),
        new THREE.Vector3( 25,  0, -60),
        new THREE.Vector3(  0,  0, -62),
        new THREE.Vector3(-20,  0, -60),
        // Maintenance bay detour (wider, flat)
        new THREE.Vector3(-38,  0, -50),
        new THREE.Vector3(-50,  0, -35),
        new THREE.Vector3(-52,  0, -18),
        // Tunnel bore B (slight dip then rise)
        new THREE.Vector3(-50,  0,  -5),
        new THREE.Vector3(-45,  0,  10),
        new THREE.Vector3(-35,  0,  20),
        new THREE.Vector3(-20,  0,  18),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY (solid dark – underground)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING (fluorescent)
    TrackBuilder.createLighting(
      scene,
      0x334455, 0.6,          // cool blueish ambient
      0xaaccee, 0.3,          // very dim directional (simulates overall fluorescent wash)
      [0, 50, 0],
      false
    );

    // Fluorescent strip lights – platform A
    [0, 14, 28, 42].forEach(xOff => {
      const fl = new THREE.PointLight(0xcce8ff, 2.2, 40);
      fl.position.set(xOff, 6, 4);
      scene.add(fl);
    });

    // Fluorescent strip lights – platform B
    [-20, -4, 12, 28, 44].forEach(xOff => {
      const fl = new THREE.PointLight(0xcce8ff, 1.8, 38);
      fl.position.set(xOff, 6, -60);
      scene.add(fl);
    });

    // Warm maintenance bay lights
    [-40, -50].forEach(xOff => {
      const ml = new THREE.PointLight(0xffcc88, 1.5, 35);
      ml.position.set(xOff, 6, -35);
      scene.add(ml);
    });

    // ------------------------------------------------------------------ GROUND (platform tiles)
    // Main ground slab
    const tileMat = toon('#3a3a50');
    const groundGeo = new THREE.PlaneGeometry(300, 200);
    const groundMesh = new THREE.Mesh(groundGeo, tileMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.12;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Tile grid lines (thin planes)
    const groutMat = toon('#222232');
    for (let gx = -80; gx <= 80; gx += 6) {
      const gLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 200), groutMat);
      gLine.rotation.x = -Math.PI / 2;
      gLine.position.set(gx, -0.10, 0);
      scene.add(gLine);
    }
    for (let gz = -100; gz <= 100; gz += 6) {
      const gLine = new THREE.Mesh(new THREE.PlaneGeometry(160, 0.15), groutMat);
      gLine.rotation.x = -Math.PI / 2;
      gLine.position.set(0, -0.10, gz);
      scene.add(gLine);
    }

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#282838'); // dark tile/track surface
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Yellow safety edge stripe
    const edgeStripeMat = toon('#ffcc00', { emissive: new THREE.Color('#553300'), emissiveIntensity: 0.5 });
    const edgeStripeGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.08);
    trackGroup.add(new THREE.Mesh(edgeStripeGeo, edgeStripeMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 2.0, 0x1e1e2e);
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
    const mat = (hex, emissive = 0x000000, emissInt = 1) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissInt; }
      return m;
    };

    // --- 1. SUBWAY TRAIN (Platform A – static silver train with door openings)
    // Train body – long box
    const trainBodyA = new THREE.Mesh(
      new THREE.BoxGeometry(35, 4, 5),
      mat(0xaab4be)
    );
    trainBodyA.position.set(20, 2, -9);
    trainBodyA.castShadow = true;
    scene.add(trainBodyA);

    // Train stripe (coloured band)
    const trainStripeA = new THREE.Mesh(
      new THREE.BoxGeometry(35, 0.8, 0.12),
      mat(0x0055cc, 0x002266)
    );
    trainStripeA.position.set(20, 2.5, -6.56);
    scene.add(trainStripeA);

    // Train windows (dark boxes recessed into body)
    for (let wi = 0; wi < 6; wi++) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 2, 0.2),
        mat(0x111122)
      );
      win.position.set(-10 + wi * 6.5, 2.8, -6.5);
      scene.add(win);
    }

    // Door openings (slightly darker panels to suggest doors)
    [-6, 6].forEach(dx => {
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 3.5, 0.25),
        mat(0x778899)
      );
      door.position.set(20 + dx, 1.75, -6.45);
      scene.add(door);
    });

    // Train front face
    const trainFrontA = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 0.6),
      mat(0x8899aa)
    );
    trainFrontA.position.set(37.7, 2, -9);
    scene.add(trainFrontA);

    // --- 2. SUBWAY TRAIN (Platform B – different colour)
    const trainBodyB = new THREE.Mesh(
      new THREE.BoxGeometry(30, 4, 5),
      mat(0xc8bfaa)
    );
    trainBodyB.position.set(15, 2, -66);
    trainBodyB.castShadow = true;
    scene.add(trainBodyB);

    const trainStripeB = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.8, 0.12),
      mat(0xcc3300, 0x661100)
    );
    trainStripeB.position.set(15, 2.5, -63.56);
    scene.add(trainStripeB);

    for (let wi = 0; wi < 5; wi++) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 2, 0.2),
        mat(0x111122)
      );
      win.position.set(-5 + wi * 6.5, 2.8, -63.5);
      scene.add(win);
    }

    // --- 3. SUPPORT COLUMNS (concrete pillars along platforms)
    const columnPositions = [
      [  5, 0,  -8], [ 20, 0,  -8], [ 36, 0,  -8],
      [  5, 0, -55], [ 20, 0, -55], [ 36, 0, -55],
      [-42, 0, -25], [-42, 0, -45],
    ];
    columnPositions.forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 8, 1.4),
        mat(0x3c3c50)
      );
      col.position.set(cx, 4, cz);
      col.castShadow = true;
      scene.add(col);

      // Cap / beam
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.6, 2.2),
        mat(0x2c2c3e)
      );
      cap.position.set(cx, 8.3, cz);
      scene.add(cap);
    });

    // --- 4. CEILING / TUNNEL ARCH over track sections
    // Flat ceiling slabs over Platform A
    [-2, 12, 26, 40].forEach(xOff => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.8, 22),
        mat(0x1e1e2c)
      );
      slab.position.set(xOff, 8.8, -3);
      scene.add(slab);
    });

    // Ceiling over Platform B
    [-18, -4, 10, 26, 42].forEach(xOff => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.8, 22),
        mat(0x1e1e2c)
      );
      slab.position.set(xOff, 8.8, -61);
      scene.add(slab);
    });

    // --- 5. VENDING MACHINES (tall boxes with emissive face)
    const vendingData = [
      { pos: [46,  1.5,  5], color: 0x00bb44 },
      { pos: [46,  1.5, -1], color: 0xff3300 },
      { pos: [-2,  1.5, -65], color: 0x0055ff },
      { pos: [ 6,  1.5, -65], color: 0xffcc00 },
      { pos: [-52, 1.5, -30], color: 0x33bbff },
    ];
    vendingData.forEach(({ pos, color }) => {
      const machine = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 3.5, 1.0),
        mat(0x222233)
      );
      machine.position.set(...pos);
      machine.castShadow = true;
      scene.add(machine);

      // Emissive display face
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 2.8),
        toon('#888888', { emissive: new THREE.Color(color), emissiveIntensity: 1.1 })
      );
      face.position.set(pos[0], pos[1], pos[2] + 0.52);
      scene.add(face);

      const glow = new THREE.PointLight(color, 0.8, 12);
      glow.position.set(...pos);
      scene.add(glow);
    });

    // --- 6. PLATFORM EDGE BUMPERS (yellow safety border along platform A)
    for (let xb = -2; xb <= 46; xb += 4) {
      const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.3, 0.4),
        mat(0xffcc00, 0x553300, 0.4)
      );
      bumper.position.set(xb, 0.15, -4.8);
      scene.add(bumper);
    }

    // Platform B edge bumpers
    for (let xb = -18; xb <= 46; xb += 4) {
      const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.3, 0.4),
        mat(0xffcc00, 0x553300, 0.4)
      );
      bumper.position.set(xb, 0.15, -56.5);
      scene.add(bumper);
    }

    // --- 7. FLUORESCENT LIGHT FIXTURES (ceiling mounted – visible tubes)
    const lightFixtureMat = toon('#ddeeff', { emissive: new THREE.Color('#aaccee'), emissiveIntensity: 0.9 });
    [0, 14, 28, 42].forEach(xOff => {
      const tube = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.18, 3.5),
        lightFixtureMat
      );
      tube.position.set(xOff, 8.5, 2);
      scene.add(tube);
    });
    [-20, -6, 8, 22, 38].forEach(xOff => {
      const tube = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.18, 3.5),
        lightFixtureMat
      );
      tube.position.set(xOff, 8.5, -60);
      scene.add(tube);
    });

    // --- 8. MAINTENANCE BAY – equipment boxes and barrels
    const maintItems = [
      { pos: [-44, 1,   -28], size: [2.5, 2, 2.5], color: 0x445566 },
      { pos: [-48, 0.8, -33], size: [3,   1.6, 2], color: 0x336655 },
      { pos: [-46, 0.5, -40], size: [1.5, 1,   1.5], color: 0x885522 },
      { pos: [-38, 1,   -45], size: [2,   2,   2],   color: 0x554433 },
    ];
    maintItems.forEach(({ pos, size, color }) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        mat(color)
      );
      box.position.set(...pos);
      box.castShadow = true;
      scene.add(box);
    });

    // Barrel cylinders in maintenance bay
    [[-42, -38], [-44, -42]].forEach(([bx, bz]) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 2.2, 10),
        mat(0x664422)
      );
      barrel.position.set(bx, 1.1, bz);
      barrel.castShadow = true;
      scene.add(barrel);
    });

    // --- 9. DIRECTIONAL SIGNS (flat planes, emissive arrows)
    [
      { pos: [ 48, 4,  0], rot: [0, -Math.PI / 2, 0], color: 0x00cc44 },
      { pos: [-54, 4, -20], rot: [0,  Math.PI / 2, 0], color: 0x00cc44 },
    ].forEach(({ pos, rot, color }) => {
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 2),
        toon('#888888', { emissive: new THREE.Color(color), emissiveIntensity: 0.9 })
      );
      sign.position.set(...pos);
      sign.rotation.set(...rot);
      scene.add(sign);
    });

    // ------------------------------------------------------------------ DUST / PARTICLE ATMOSPHERE
    // Flickering-feel ambient particles (fluorescent dust motes)
    TrackBuilder.createParticles(scene, {
      count:  200,
      spread: 120,
      color:  '#cce8ff',
      size:   0.10,
      speed:  0.015,
    });

    // Darker particles in tunnel sections
    TrackBuilder.createParticles(scene, {
      count:  80,
      spread: 60,
      color:  '#223344',
      size:   0.25,
      speed:  0.005,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    return {
      collisionMesh,
      wallMesh,
      trackGroup,
      curve,
      checkpoints,
      startPositions,
      itemBoxPositions,
      waypointPath,
      surfaceZones: [
        { type: 'tile',    traction: 0.92, friction: 0.80 },
        { type: 'asphalt', traction: 1.0,  friction: 0.85 },
      ],
      hazards:  [],
      respawnY: -10,
    };
  },
};
