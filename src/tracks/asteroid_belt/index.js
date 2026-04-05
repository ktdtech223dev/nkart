import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// ASTEROID BELT  –  Space Cup, Race 2
// Racing across the jagged surface of a large asteroid. Cracked dark-grey rock,
// veins of emissive purple crystal, massive background asteroid spheres floating
// in deep space, and a nebula painted across the purple-gold sky dome.
// ---------------------------------------------------------------------------

export const track = {
  id: 'asteroid_belt',
  name: 'ASTEROID BELT',
  cup: 'space',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_space_02',

  skyConfig: {
    topColor:    0x090012,
    bottomColor: 0x1a0828,
    fogColor:    0x0d0018,
    fogDensity:  0.005,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 250;

    // ------------------------------------------------------------------ CURVE
    // Layout: irregular oval following the asteroid's natural ridges.
    // Deep elevation changes simulate rough terrain.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  58),
        new THREE.Vector3( 22,  0,  50),
        new THREE.Vector3( 42,  0,  35),
        new THREE.Vector3( 55,  0,  12),
        new THREE.Vector3( 56,  0,  -8),
        new THREE.Vector3( 48,  0, -30),
        new THREE.Vector3( 32,  0, -48),
        new THREE.Vector3( 12,  0, -56),
        new THREE.Vector3(-10,  0, -52),
        new THREE.Vector3(-30,  0, -40),
        new THREE.Vector3(-50,  0, -22),
        new THREE.Vector3(-58,  0,   0),
        new THREE.Vector3(-52,  0,  22),
        new THREE.Vector3(-36,  0,  42),
        new THREE.Vector3(-16,  0,  54),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY (deep space nebula)
    // Custom gradient sky with nebula hues (purple → gold horizon)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // Nebula glow overlay (large translucent spheres of colour)
    [
      { pos: [  80, 120, -200], r: 80, col: 0x6600aa, opa: 0.18 },
      { pos: [-100, 100, -180], r: 60, col: 0xcc6600, opa: 0.14 },
      { pos: [  20, 140, -220], r: 70, col: 0x440088, opa: 0.12 },
    ].forEach(({ pos, r, col, opa }) => {
      const neb = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: opa, side: THREE.BackSide, depthWrite: false })
      );
      neb.position.set(...pos);
      scene.add(neb);
    });

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 175 + Math.random() * 15;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.45, sizeAttenuation: true })));

    // ------------------------------------------------------------------ LIGHTING
    // Distant sun (harsh, directional from one side)
    TrackBuilder.createLighting(
      scene,
      0x220033, 0.40,    // deep purple ambient
      0xfff5cc, 1.6,     // bright sun
      [100, 60, 20],
      true
    );
    // Crystal vein fill light (purple)
    const crystalLight = new THREE.PointLight(0x8800ff, 0.6, 80);
    crystalLight.position.set(0, 15, 0);
    scene.add(crystalLight);

    // ------------------------------------------------------------------ GROUND  (dark cracked rock)
    const rockFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon('#2a2a2a')
    );
    rockFloor.rotation.x = -Math.PI / 2;
    rockFloor.position.y = -0.15;
    rockFloor.receiveShadow = true;
    scene.add(rockFloor);

    // Crack lines (thin dark boxes scored into surface)
    const crackMat = toon('#111111');
    [
      { x:  10, z:  20, len: 35, ry: 0.4 },
      { x: -15, z: -10, len: 28, ry: 1.1 },
      { x:  30, z: -30, len: 22, ry: -0.6 },
      { x: -35, z:  25, len: 30, ry: 0.8 },
      { x:   5, z: -45, len: 40, ry: 0.2 },
      { x: -50, z: -15, len: 18, ry: 1.5 },
    ].forEach(({ x, z, len, ry }) => {
      const crack = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.5), crackMat);
      crack.position.set(x, 0.01, z);
      crack.rotation.y = ry;
      scene.add(crack);
    });

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#383838');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre line (faint purple glow)
    trackGroup.add(new THREE.Mesh(
      TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.09),
      toon('#aa44ff', { emissive: new THREE.Color('#440088'), emissiveIntensity: 0.6, transparent: true, opacity: 0.5 })
    ));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0x3a3a3a);
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

    // --- 1. EMISSIVE PURPLE CRYSTAL CLUSTERS (scattered across surface)
    const crystalPositions = [
      [ 30, 0,  20], [-25, 0,  35], [ 50, 0, -15], [-45, 0, -10],
      [ 15, 0, -50], [-20, 0, -45], [ 40, 0,  40], [-55, 0,  10],
      [ -5, 0,  30], [ 25, 0, -30],
    ];
    crystalPositions.forEach(([cx, cy, cz]) => {
      const clusterCount = 3 + Math.floor(Math.random() * 3);
      for (let c = 0; c < clusterCount; c++) {
        const h  = 2 + Math.random() * 5;
        const rb = 0.3 + Math.random() * 0.5;
        const crystal = new THREE.Mesh(
          new THREE.ConeGeometry(rb, h, 6),
          mat(0x9922cc, 0x7700bb, 1.8)
        );
        crystal.position.set(
          cx + (Math.random() - 0.5) * 5,
          h / 2,
          cz + (Math.random() - 0.5) * 5
        );
        crystal.rotation.set(
          (Math.random() - 0.5) * 0.5,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.5
        );
        crystal.castShadow = true;
        scene.add(crystal);
      }
      // Glow light near cluster
      const glow = new THREE.PointLight(0xaa00ff, 0.5, 18);
      glow.position.set(cx, 3, cz);
      scene.add(glow);
    });

    // --- 2. LARGE ROCK FORMATIONS (boulder groups)
    [
      { x:  38, z: -20, s: 7 }, { x: -42, z:  30, s: 9 },
      { x:  10, z:  44, s: 6 }, { x: -10, z: -40, s: 8 },
      { x:  55, z:  30, s: 5 }, { x: -58, z: -35, s: 7 },
    ].forEach(({ x, z, s }) => {
      // Main boulder
      const bould = new THREE.Mesh(
        new THREE.SphereGeometry(s, 8, 7),
        mat(0x303030)
      );
      bould.position.set(x, s * 0.4, z);
      bould.scale.set(1, 0.65, 1.1);
      bould.castShadow = true;
      scene.add(bould);
      // Satellite rocks
      for (let r = 0; r < 3; r++) {
        const sr = s * (0.3 + Math.random() * 0.35);
        const rx = x + (Math.random() - 0.5) * s * 2.5;
        const rz = z + (Math.random() - 0.5) * s * 2.5;
        const rock = new THREE.Mesh(new THREE.SphereGeometry(sr, 6, 5), mat(0x2a2a2a));
        rock.position.set(rx, sr * 0.45, rz);
        rock.scale.set(1, 0.7, 1.05);
        scene.add(rock);
      }
    });

    // --- 3. BACKGROUND ASTEROIDS (large spheres floating in distance)
    [
      { x:  180, y:  60, z: -250, r: 55, col: 0x252525 },
      { x: -220, y:  90, z: -200, r: 40, col: 0x2a2a2a },
      { x:   80, y: 130, z: -280, r: 70, col: 0x222222 },
      { x: -120, y:  40, z: -230, r: 30, col: 0x303030 },
      { x:  250, y:  30, z: -150, r: 45, col: 0x282828 },
    ].forEach(({ x, y, z, r, col }) => {
      const ast = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 10),
        mat(col)
      );
      ast.position.set(x, y, z);
      ast.scale.set(1, 0.8 + Math.random() * 0.4, 1.1);
      scene.add(ast);
      // Purple crystal streak on background asteroid
      const streak = new THREE.Mesh(
        new THREE.BoxGeometry(r * 0.3, r * 0.1, r * 0.8),
        mat(0x6600cc, 0x440088, 1.0)
      );
      streak.position.set(x + r * 0.5, y + r * 0.1, z);
      streak.rotation.y = Math.random();
      scene.add(streak);
    });

    // --- 4. IMPACT CRATERS with crystal lining
    [
      { x:  20, z: -20, r: 10 }, { x: -30, z:  15, r:  7 },
      { x:  -5, z:  42, r:  9 }, { x:  44, z:  -5, r:  6 },
    ].forEach(({ x, z, r }) => {
      // Crater floor (dark)
      const floor = new THREE.Mesh(new THREE.CircleGeometry(r, 18), mat(0x1a1a1a));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, -0.1, z);
      scene.add(floor);
      // Rim ring (slightly raised)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.8, 6, 24), mat(0x3a3a3a));
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x, 0.3, z);
      scene.add(rim);
      // Crystal rim segments
      for (let k = 0; k < 6; k++) {
        const angle = (k / 6) * Math.PI * 2;
        const cx2 = x + Math.cos(angle) * (r - 1);
        const cz2 = z + Math.sin(angle) * (r - 1);
        const cv = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.5, 5), mat(0x8800ee, 0x6600cc, 1.5));
        cv.position.set(cx2, 1, cz2);
        cv.rotation.y = angle;
        scene.add(cv);
      }
    });

    // --- 5. MINING OUTPOST (derelict equipment near south section)
    // Main structure box
    const miningBase = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 8), mat(0x505050, 0x222222, 0.05));
    miningBase.position.set(-15, 1.5, -46);
    miningBase.castShadow = true;
    scene.add(miningBase);
    // Drill arm
    const drillArm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14, 8), mat(0x666666));
    drillArm.position.set(-15, 8, -46);
    drillArm.rotation.z = Math.PI / 4;
    scene.add(drillArm);
    // Drill bit (cone)
    const drillBit = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 8), mat(0x888888, 0x444444, 0.1));
    drillBit.position.set(-21, 13, -46);
    drillBit.rotation.z = Math.PI / 4;
    scene.add(drillBit);
    // Warning light on outpost
    const warnLight = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), mat(0xff6600, 0xff4400, 2.0));
    warnLight.position.set(-15, 4, -42);
    scene.add(warnLight);
    scene.add(new THREE.PointLight(0xff4400, 0.5, 15)).position.set(-15, 4, -42);

    // --- 6. CRYSTAL ARCH over track (north sector)
    [-8, 8].forEach(side => {
      const arch = new THREE.Mesh(new THREE.ConeGeometry(0.6, 10, 6), mat(0xaa22ff, 0x8800cc, 2.0));
      arch.position.set(side, 5, 30);
      arch.rotation.z = side > 0 ? -0.5 : 0.5;
      arch.castShadow = true;
      scene.add(arch);
    });
    // Arch top crystal
    const archTop = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), mat(0xcc44ff, 0xaa00ff, 2.5));
    archTop.position.set(0, 10, 30);
    scene.add(archTop);
    scene.add(new THREE.PointLight(0xaa00ff, 1.0, 20)).position.set(0, 10, 30);

    // --- 7. COMMUNICATION BEACON (glowing tower, east rim)
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 18, 8), mat(0x555555));
    beacon.position.set(52, 9, -5);
    beacon.castShadow = true;
    scene.add(beacon);
    const beaconTop = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), mat(0x00aaff, 0x0088ff, 2.0));
    beaconTop.position.set(52, 19, -5);
    scene.add(beaconTop);
    scene.add(new THREE.PointLight(0x0066ff, 0.8, 22)).position.set(52, 19, -5);

    // --- 8. WRECKAGE DEBRIS (scattered metal chunks)
    [
      { x:  35, z:  44, ry: 0.4,  w: 5, h: 1.5, d: 3 },
      { x: -48, z: -40, ry: 1.2,  w: 7, h: 1.2, d: 4 },
      { x:  -8, z:  55, ry: -0.3, w: 4, h: 2,   d: 2.5 },
    ].forEach(({ x, z, ry, w, h, d }) => {
      const wreck = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(0x444444, 0x111111, 0.05));
      wreck.position.set(x, h / 2, z);
      wreck.rotation.set(
        (Math.random() - 0.5) * 0.6,
        ry,
        (Math.random() - 0.5) * 0.6
      );
      wreck.castShadow = true;
      scene.add(wreck);
    });

    // ------------------------------------------------------------------ PARTICLES  (space dust)
    TrackBuilder.createParticles(scene, {
      count:  150,
      spread:  90,
      color:   '#6622aa',
      size:    0.22,
      speed:   0.03,
    });
    TrackBuilder.createParticles(scene, {
      count:   80,
      spread:  50,
      color:   '#331155',
      size:    0.12,
      speed:   0.015,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

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
