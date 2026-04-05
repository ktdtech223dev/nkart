import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// PIXEL WORLD  –  Arcade Cup, Race 2
// Classic 2D platformer brought to life in 3D. Giant pixel-cube platforms,
// floating coins, question-mark blocks, and a scrolling billboard sky.
// Bright sky, green/blue retro palette.
// ---------------------------------------------------------------------------

export const track = {
  id: 'pixel_world',
  name: 'PIXEL WORLD',
  cup: 'arcade',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_arcade_02',

  skyConfig: {
    topColor:    0x5c94fc,
    bottomColor: 0x74b8fc,
    fogColor:    0x6aaaf8,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 200;

    // ------------------------------------------------------------------ CURVE
    // Winding platformer-style path with hills (Y variation) and wide curves.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 20,  0,  -5),
        new THREE.Vector3( 40,  0,   0),
        new THREE.Vector3( 50,  0,  15),
        new THREE.Vector3( 45,  0,  30),
        new THREE.Vector3( 30,  0,  42),
        new THREE.Vector3( 10,  0,  50),
        new THREE.Vector3( -8,  0,  45),
        new THREE.Vector3(-20,  0,  32),
        new THREE.Vector3(-35,  0,  20),
        new THREE.Vector3(-45,  0,   5),
        new THREE.Vector3(-40,  0, -10),
        new THREE.Vector3(-25,  0, -20),
        new THREE.Vector3(-10,  0, -15),
        new THREE.Vector3(  0,  0, -10),
      ],
      true,
      'catmullrom',
      0.5
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
    TrackBuilder.createLighting(
      scene,
      0xddeeff, 0.8,        // bright ambient
      0xffffff, 1.4,        // white sun
      [30, 80, 20],
      true
    );
    // Slight blue fill from below (sky reflection)
    const fillLight = new THREE.PointLight(0x5599ff, 0.3, 150);
    fillLight.position.set(0, 5, 25);
    scene.add(fillLight);

    // ------------------------------------------------------------------ GROUND (grass/earth pixelated)
    // Checkerboard-style grass using two-color planes
    const grassMat = toon('#6ab04c'); // bright green
    const earthMat = toon('#c8a870'); // dirt brown
    const groundSize = 200;
    const tileSize = 8;
    for (let gx = -groundSize / 2; gx < groundSize / 2; gx += tileSize) {
      for (let gz = -groundSize / 2; gz < groundSize / 2; gz += tileSize) {
        const isGrass = (Math.floor(gx / tileSize) + Math.floor(gz / tileSize)) % 2 === 0;
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(tileSize, tileSize),
          isGrass ? grassMat : earthMat
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(gx + tileSize / 2, -0.15, gz + tileSize / 2);
        tile.receiveShadow = true;
        scene.add(tile);
      }
    }

    // ------------------------------------------------------------------ ROAD (pixel-brick style)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#c8a870'); // sandy tan
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Road centre dashes (white)
    const centreMat = toon('#ffffff', { transparent: true, opacity: 0.6 });
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.08);
    trackGroup.add(new THREE.Mesh(centreGeo, centreMat));

    // ------------------------------------------------------------------ WALLS (brick style)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0xd4703c);
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

    const mat = (hex, emissive = 0x000000) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); }
      return m;
    };

    // --- 1. Giant pixel-cube platforms (floating over the ground)
    const platformData = [
      { x:  30, y:  3, z:  8,  w: 12, h: 3, d: 8,  c: 0x4caf50 },
      { x: -20, y:  5, z: 35,  w: 10, h: 5, d: 8,  c: 0x4caf50 },
      { x:  48, y:  2, z: 22,  w: 8,  h: 2, d: 10, c: 0x795548 },
      { x: -40, y:  4, z: 12,  w: 14, h: 4, d: 6,  c: 0x4caf50 },
      { x:  15, y:  6, z: 55,  w: 10, h: 6, d: 10, c: 0x795548 },
      { x: -30, y:  3, z: -5,  w: 12, h: 3, d: 8,  c: 0x4caf50 },
    ];
    platformData.forEach(({ x, y, z, w, h, d, c }) => {
      // Main platform block
      const plat = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mat(c)
      );
      plat.position.set(x, y / 2, z);
      plat.castShadow = true;
      plat.receiveShadow = true;
      scene.add(plat);
      // Top grass layer
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.8, d),
        mat(0x388e3c)
      );
      top.position.set(x, y + 0.4, z);
      scene.add(top);
    });

    // --- 2. Floating coins (gold torus rings, above ground)
    const coinPositions = [
      [  8, 3,  20], [ 12, 3,  20], [ 16, 3,  20],
      [-15, 4,  10], [-15, 4,  14],
      [ 35, 5,  48], [ 40, 5,  48], [ 45, 5,  48],
      [-35, 3, -12], [-30, 3, -12],
      [  5, 3, -18], [ 10, 3, -18],
    ];
    const coinMat = toon('#ffd700', { emissive: new THREE.Color('#886600') });
    coinPositions.forEach(([x, y, z]) => {
      const coin = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.3, 8, 16),
        coinMat
      );
      coin.position.set(x, y, z);
      coin.rotation.x = Math.PI / 2;
      coin.castShadow = true;
      scene.add(coin);
    });

    // --- 3. Question mark blocks (yellow cubes with ? symbol approximated)
    const qBlockPositions = [
      [  5, 5,  12], [ 25, 6,  35], [-10, 4,  40], [ 50, 7,  38],
      [-25, 5, -15], [ 30, 5, -10],
    ];
    qBlockPositions.forEach(([x, y, z]) => {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 3.5, 3.5),
        mat(0xffc107, 0x664400)
      );
      block.position.set(x, y, z);
      block.castShadow = true;
      scene.add(block);
      // Face detail: darker center square
      const face = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 3.6, 0.1),
        mat(0xe65100, 0x331100)
      );
      face.position.set(x, y, z + 1.8);
      scene.add(face);
      // White inner mark
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 0.15),
        mat(0xffffff)
      );
      mark.position.set(x, y, z + 1.85);
      scene.add(mark);
    });

    // --- 4. Brick block rows (classic obstacle breakables look)
    const brickMat = mat(0xc0392b);
    const brickMortarMat = mat(0xaaaaaa);
    [-38, 20].forEach(bx => {
      for (let col = 0; col < 6; col++) {
        for (let row = 0; row < 3; row++) {
          const brick = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 1.8, 2),
            row % 2 === 0 ? brickMat : brickMortarMat
          );
          brick.position.set(bx + col * 3.4, 0.9 + row * 1.9, -18);
          brick.castShadow = true;
          scene.add(brick);
        }
      }
    });

    // --- 5. Scrolling pixel billboard background panels
    const billboardMat = toon('#5c94fc', { emissive: new THREE.Color('#1a3366'), transparent: true, opacity: 0.85 });
    // Two large vertical panels far back
    [
      { x: -80, z: 0,  ry: Math.PI / 2 },
      { x:  80, z: 0,  ry: -Math.PI / 2 },
    ].forEach(({ x, z, ry }) => {
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(140, 40),
        billboardMat
      );
      board.position.set(x, 15, z);
      board.rotation.y = ry;
      scene.add(board);
      // Pixel cloud shapes on billboard (white boxes)
      [[0, 8], [20, 5], [-20, 6], [40, 9]].forEach(([cx, cy]) => {
        [
          [0, 0, 4, 3], [3, 1, 4, 4], [-3, 1, 4, 4], [6, 0, 4, 3], [-6, 0, 4, 3],
        ].forEach(([ox, oy, w, h]) => {
          const cloud = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            toon('#ffffff', { transparent: true, opacity: 0.7 })
          );
          cloud.position.set(x + (ry > 0 ? 0.05 : -0.05), cy + oy + 15, z + cx + ox);
          cloud.rotation.y = ry;
          scene.add(cloud);
        });
      });
    });

    // --- 6. Pixel hill mounds (half-spheres in background)
    [[60, -40], [-60, -40], [0, -70]].forEach(([hx, hz]) => {
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(20, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0x388e3c)
      );
      hill.position.set(hx, 0, hz);
      scene.add(hill);
    });

    // --- 7. Flagpole at finish area
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 20, 8),
      mat(0x888888)
    );
    pole.position.set(-3, 10, 3);
    pole.castShadow = true;
    scene.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4),
      mat(0xff1744, 0x440000)
    );
    flag.position.set(0, 19, 3);
    scene.add(flag);

    // --- 8. Giant mushroom decorations (sphere+cylinder)
    [[55, 0, 55], [-55, 0, -30]].forEach(([mx, my, mz]) => {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 8, 12),
        mat(0xfff8e1)
      );
      stem.position.set(mx, 4, mz);
      scene.add(stem);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0xe53935, 0x220000)
      );
      cap.position.set(mx, 9, mz);
      scene.add(cap);
      // White spots on cap
      for (let s = 0; s < 5; s++) {
        const spot = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 8, 8),
          mat(0xffffff)
        );
        const angle = (s / 5) * Math.PI * 2;
        spot.position.set(mx + Math.cos(angle) * 4, 10, mz + Math.sin(angle) * 4);
        scene.add(spot);
      }
    });

    // --- 9. Pipe tubes (classic green pipes)
    [[22, 0, -22], [-22, 0, 58]].forEach(([px, py, pz]) => {
      const pipeBody = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 10, 16),
        mat(0x2e7d32)
      );
      pipeBody.position.set(px, 5, pz);
      pipeBody.castShadow = true;
      scene.add(pipeBody);
      const pipeLip = new THREE.Mesh(
        new THREE.CylinderGeometry(3.0, 3.0, 1.5, 16),
        mat(0x388e3c)
      );
      pipeLip.position.set(px, 10.75, pz);
      scene.add(pipeLip);
    });

    // ------------------------------------------------------------------ PARTICLES (sparkles)
    TrackBuilder.createParticles(scene, {
      count:  200,
      spread:  80,
      color:  '#ffd700',
      size:    0.2,
      speed:   0.03,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'asphalt', traction: 1.0, friction: 0.88 },
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
