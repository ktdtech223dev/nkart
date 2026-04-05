import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// NIGHTMARE DORM  –  Shadow Cup, Race 1
// Corrupted figure-8 mirror of Desk Dash. Same general layout, void palette.
// Colors inverted: cream road → black abyss, warm blue → blood red.
// Lamp stretched 10× taller, keyboard keys float mid-air, gravity anomalies.
// Only harsh point lights from corrupted electronics. Void purple-black sky.
// ---------------------------------------------------------------------------

export const track = {
  id: 'nightmare_dorm',
  name: 'NIGHTMARE DORM',
  cup: 'shadow',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_shadow_01',

  skyConfig: {
    topColor:    0x050008,
    bottomColor: 0x1a0030,
    fogColor:    0x0a0015,
    fogDensity:  0.028,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Same figure-8 points as Desk Dash, slightly warped with y corruption.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Right lobe – clockwise outer arc (slightly warped)
        new THREE.Vector3( 30,  0,   0),
        new THREE.Vector3( 38,  0,  15),
        new THREE.Vector3( 32,  0,  28),
        new THREE.Vector3( 15,  0,  32),
        new THREE.Vector3(  0,  0,  25),
        // Crossover – gravity anomaly dip
        new THREE.Vector3( -8,  0,  10),
        new THREE.Vector3( -2,  0,   0),
        new THREE.Vector3(  8,  0, -10),
        // Left lobe – anti-clockwise outer arc
        new THREE.Vector3(  0,  0, -25),
        new THREE.Vector3(-15,  0, -32),
        new THREE.Vector3(-32,  0, -28),
        new THREE.Vector3(-38,  0, -15),
        new THREE.Vector3(-30,  0,   0),
        new THREE.Vector3(-20,  0,  12),
        // Return crossover
        new THREE.Vector3( -8,  0,  10),
        new THREE.Vector3(  2,  0,   0),
        new THREE.Vector3(  8,  0, -10),
        new THREE.Vector3( 18,  0, -12),
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
    // No directional lights – only harsh corrupted point lights
    const ambient = new THREE.AmbientLight(0x0d0020, 0.25);
    scene.add(ambient);

    // Corrupted monitor – blood red glow
    const monitorGlow = new THREE.PointLight(0x8b0000, 2.5, 50);
    monitorGlow.position.set(-32, 6.5, 0);
    scene.add(monitorGlow);

    // Corrupted lamp – sickly purple from above
    const lampCorrupt = new THREE.PointLight(0x6600aa, 3.0, 80);
    lampCorrupt.position.set(-42, 60, -28);
    scene.add(lampCorrupt);

    // Gravity anomaly zones – harsh magenta pulses
    const anomalyLight1 = new THREE.PointLight(0xff00ff, 1.8, 30);
    anomalyLight1.position.set(-8, 3, 10);
    scene.add(anomalyLight1);

    const anomalyLight2 = new THREE.PointLight(0xff00ff, 1.8, 30);
    anomalyLight2.position.set(8, 3, -10);
    scene.add(anomalyLight2);

    // Corrupted electronics at crossover – cold blue-white spark
    const sparkLight = new THREE.PointLight(0x4444ff, 2.2, 35);
    sparkLight.position.set(-2, 5, 0);
    scene.add(sparkLight);

    // ------------------------------------------------------------------ VOID FLOOR (corrupted desk)
    const voidFloorMat = toon('#050005');
    const voidFloor = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), voidFloorMat);
    voidFloor.rotation.x = -Math.PI / 2;
    voidFloor.position.y = -0.15;
    scene.add(voidFloor);

    // Corruption cracks (dark red veins on floor)
    const crackMat = toon('#660000', { transparent: true, opacity: 0.6 });
    const crackPositions = [
      [0, 0, 10, 25, 0.1], [-10, 0, -5, 18, 0.3], [20, 0, 5, 30, -0.2],
      [-20, 0, 15, 22, 0.5], [5, 0, -20, 28, -0.4],
    ];
    crackPositions.forEach(([x, y, z, len, rot]) => {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.4, len), crackMat);
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = rot;
      crack.position.set(x, y - 0.12, z);
      scene.add(crack);
    });

    // ------------------------------------------------------------------ ROAD (void black)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#080008', { emissive: new THREE.Color('#110011') });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Corrupted centreline (blood red instead of white)
    const centreMat = toon('#990000', { transparent: true, opacity: 0.7 });
    const centreGeo = TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.08);
    const centreMesh = new THREE.Mesh(centreGeo, centreMat);
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS (dark purple-red)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.4, 0x330022);
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

    // --- 1. CORRUPTED PENCILS (blackened, bent)
    const pencilPositions = [
      [22, 0.4, 10], [24, 0.4, 8], [26, 0.4, 12],
      [-22, 0.4, -10], [-25, 0.4, -8],
    ];
    pencilPositions.forEach(([x, y, z], i) => {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 5, 8),
        mat(0x111111, 0x220000)
      );
      body.position.set(x, y + 2.5, z);
      body.rotation.z = 0.3 + i * 0.15;
      body.rotation.x = i * 0.2; // corruption warp
      body.castShadow = true;
      scene.add(body);
      // Corroded eraser
      const eraser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.6, 8),
        mat(0x4a0000, 0x110000)
      );
      eraser.position.set(x - Math.sin(body.rotation.z) * 2.8, y + 2.5, z);
      scene.add(eraser);
      // Bone-white tip
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.7, 8),
        mat(0xddddcc)
      );
      tip.position.set(x + Math.sin(body.rotation.z) * 2.8, y + 2.5, z);
      scene.add(tip);
    });

    // --- 2. CORRUPTED MONITOR (blood red screen, cracked)
    const monitorBase = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 10), mat(0x0a0a0a));
    monitorBase.position.set(-32, 0.4, 5);
    monitorBase.castShadow = true;
    scene.add(monitorBase);

    const monitorScreen = new THREE.Mesh(
      new THREE.BoxGeometry(17, 11, 0.6),
      mat(0x1a0000, 0x660000)  // blood red emissive glow
    );
    monitorScreen.position.set(-32, 6.5, 0);
    monitorScreen.castShadow = true;
    scene.add(monitorScreen);

    // Screen cracks (thin dark planes across the screen)
    const screenCrackMat = mat(0x000000, 0x220000);
    [[0, 0], [3, -2], [-4, 3]].forEach(([dx, dy]) => {
      const screenCrack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 9, 0.2), screenCrackMat);
      screenCrack.position.set(-32 + dx, 6.5 + dy * 0.2, -0.4);
      screenCrack.rotation.z = dx * 0.15;
      scene.add(screenCrack);
    });

    const monitorStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 1.0, 4, 8),
      mat(0x0a0a0a)
    );
    monitorStand.position.set(-32, 2.4, 4);
    monitorStand.castShadow = true;
    scene.add(monitorStand);

    // --- 3. CORRUPTED TEXTBOOK STACKS (blackened, floating slightly)
    const bookColors = [0x1a0000, 0x000d1a, 0x0a1a00, 0x1a1400, 0x0d001a];
    [
      [10, 0, -18], [10, 0, -22], [8, 0, -20]
    ].forEach(([bx, by, bz], si) => {
      let stackY = by + 0.4 + si * 0.3; // slight float corruption
      for (let b = 0; b < 3 + (si % 3); b++) {
        const thick = 0.8 + b * 0.15;
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(8, thick, 5.5),
          mat(bookColors[b % bookColors.length], 0x110000)
        );
        book.position.set(bx, stackY + thick / 2, bz);
        book.rotation.y = (b - 1) * 0.15;
        book.rotation.x = si * 0.03; // floating tilt
        book.castShadow = true;
        scene.add(book);
        stackY += thick;
      }
    });

    // --- 4. VOID MOUSEPAD (pure black, oozing)
    const mousepad = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.3, 14),
      mat(0x020002, 0x110011)
    );
    mousepad.position.set(-20, -0.05, -5);
    mousepad.receiveShadow = true;
    scene.add(mousepad);

    // Corrupted mouse (melting shape)
    const mouse = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 4), mat(0x0d0d0d, 0x110000));
    mouse.position.set(-18, 1.0, -4);
    mouse.rotation.x = 0.15; // melting tilt
    mouse.castShadow = true;
    scene.add(mouse);

    // --- 5. VOID BOTTLE (dissolved, just outline)
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 12, 16, 1, true), // open
      mat(0x001a33, 0x003366)
    );
    bottle.position.set(40, 6, 5);
    bottle.castShadow = true;
    scene.add(bottle);

    // --- 6. FLOATING KEYBOARD KEYS
    // Base keyboard (blackened)
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.7, 8),
      mat(0x0a0a0a)
    );
    keyboard.position.set(18, 0.35, 30);
    keyboard.castShadow = true;
    scene.add(keyboard);

    // Keys floating at various heights – gravity anomaly
    const keyMat = mat(0x1a0030, 0x330066);
    const keyFloatPattern = [
      [0, 2], [1, 4], [2, 1.5], [3, 5], [4, 2.5],
      [5, 3], [6, 1], [7, 4.5], [8, 2], [9, 3.5],
      [10, 1.5], [11, 6],
    ];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 12; col++) {
        const floatHeight = keyFloatPattern[col][1] * (row === 0 ? 1 : 0.5 + row * 0.3);
        const key = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.2), keyMat);
        key.position.set(
          18 - 9 + col * 1.7,
          0.9 + floatHeight,
          30 - 2.5 + row * 1.6
        );
        // Rotational corruption on floating keys
        key.rotation.x = (col % 3 - 1) * 0.2;
        key.rotation.z = (row % 2 - 0.5) * 0.15;
        scene.add(key);
      }
    }

    // --- 7. CORRUPTED MUG (cracked, dark blood stains)
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.0, 5, 16, 1, true),
      mat(0x330000, 0x220000)
    );
    mug.position.set(-35, 2.5, 20);
    mug.castShadow = true;
    scene.add(mug);
    const mugBottom = new THREE.Mesh(new THREE.CircleGeometry(2.0, 16), mat(0x1a0000));
    mugBottom.rotation.x = -Math.PI / 2;
    mugBottom.position.set(-35, 0, 20);
    scene.add(mugBottom);
    // Corrupted pens – glowing wrong colors
    [0, 1.2, -1.2].forEach((dx, i) => {
      const penColors = [0x660000, 0x000066, 0x006600];
      const pen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 7, 8),
        mat(penColors[i], penColors[i])
      );
      pen.position.set(-35 + dx, 6, 20);
      scene.add(pen);
    });

    // --- 8. VOID STICKY NOTES (pure black, barely visible)
    const voidStickyColors = [0x0a0005, 0x05000a, 0x000a05];
    voidStickyColors.forEach((c, i) => {
      const sticky = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 5), mat(c, 0x220033));
      sticky.position.set(36, 0.15 + i * 0.16, -20 + i * 0.1);
      sticky.rotation.y = (i - 1) * 0.08;
      scene.add(sticky);
    });

    // --- 9. NIGHTMARE LAMP (10× taller, corrupted purple light)
    const lampArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 200, 8),  // 10× taller than original 20
      mat(0x111111, 0x110022)
    );
    lampArm.position.set(-50, 100, -30);
    lampArm.rotation.z = 0.4;
    lampArm.castShadow = true;
    scene.add(lampArm);
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(8, 10, 12, 1, true),  // larger to match scale
      mat(0x1a0033, 0x330066)
    );
    lampShade.position.set(-42, 200, -28);
    lampShade.rotation.z = Math.PI;
    scene.add(lampShade);
    // No warm glow – harsh void purple instead
    const lampBulb = new THREE.PointLight(0x6600aa, 2.5, 120);
    lampBulb.position.set(-42, 198, -28);
    scene.add(lampBulb);

    // --- 10. HEADPHONES (dissolved, floating apart)
    const hpBand = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.5, 8, 24, Math.PI),
      mat(0x0a0a0a, 0x220033)
    );
    hpBand.position.set(32, 8, -25);  // floating high
    hpBand.rotation.x = Math.PI / 2;
    hpBand.rotation.y = 0.3; // drifting
    hpBand.castShadow = true;
    scene.add(hpBand);
    [-4, 4].forEach((dx, i) => {
      const ear = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 1.5, 16),
        mat(0x110011, 0x440044)
      );
      ear.position.set(32 + dx, 4 + i * 3, -25);  // floating asymmetrically
      scene.add(ear);
    });

    // --- 11. GRAVITY ANOMALY ZONES (floating debris rings)
    // At crossover points – where gravity is inverted
    const anomalyPositions = [
      { center: [-5, 2, 10], axis: 'x' },
      { center: [5, 2, -10], axis: 'z' },
    ];
    anomalyPositions.forEach(({ center, axis }) => {
      // Ring of floating debris
      for (let d = 0; d < 8; d++) {
        const angle = (d / 8) * Math.PI * 2;
        const radius = 6;
        const debrisMat = mat(0x220044, 0x440088);
        const debris = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5
          ),
          debrisMat
        );
        debris.position.set(
          center[0] + Math.cos(angle) * radius,
          center[1] + Math.sin(angle) * (axis === 'x' ? radius : 0) + (axis === 'z' ? Math.sin(angle) * radius : 0),
          center[2] + (axis === 'z' ? Math.cos(angle) * 0 : Math.sin(angle) * radius)
        );
        debris.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        scene.add(debris);
      }

      // Anomaly indicator (glowing torus ring)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(6, 0.2, 8, 32),
        mat(0x440088, 0x8800ff)
      );
      ring.position.set(...center);
      ring.rotation.x = axis === 'x' ? Math.PI / 2 : 0;
      ring.rotation.z = axis === 'z' ? Math.PI / 2 : 0;
      scene.add(ring);
    });

    // ------------------------------------------------------------------ CORRUPTION PARTICLES
    TrackBuilder.createParticles(scene, {
      count:  180,
      spread: 80,
      color:  '#440066',
      size:   0.22,
      speed:  0.03,
    });

    // Secondary void sparks
    TrackBuilder.createParticles(scene, {
      count:  80,
      spread: 60,
      color:  '#660000',
      size:   0.15,
      speed:  0.05,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    // ------------------------------------------------------------------ SURFACE ZONES
    const surfaceZones = [];

    // ------------------------------------------------------------------ HAZARDS
    const hazards = [
      {
        type: 'gravity_anomaly',
        position: new THREE.Vector3(-5, 0, 10),
        radius: 8,
        strength: -0.5,
      },
      {
        type: 'gravity_anomaly',
        position: new THREE.Vector3(5, 0, -10),
        radius: 8,
        strength: -0.5,
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
      surfaceZones,
      hazards,
      respawnY: -10,
    };
  },
};
