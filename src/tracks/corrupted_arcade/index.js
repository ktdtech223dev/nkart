import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// CORRUPTED ARCADE  –  Shadow Cup, Race 3
// A corrupted neon arcade. Standard arcade layout corrupted:
// all lighting is corrupted pink-magenta, rotating floor tile pattern,
// moving pinball bumpers as hazards. Void purple-black palette.
// ---------------------------------------------------------------------------

export const track = {
  id: 'corrupted_arcade',
  name: 'CORRUPTED ARCADE',
  cup: 'shadow',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_shadow_03',

  skyConfig: {
    topColor:    0x050010,
    bottomColor: 0x1a0033,
    fogColor:    0x0d0022,
    fogDensity:  0.032,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 250;

    // ------------------------------------------------------------------ CURVE
    // Arcade layout: figure-8 loop through cabinet rows with a central
    // pinball bumper island, tight chicanes past cabinet banks,
    // wide sweeper past the prize counter.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Start / straight (entrance)
        new THREE.Vector3(  0,  0,  48),
        new THREE.Vector3( 12,  0,  42),
        new THREE.Vector3( 22,  0,  30),
        // Right cabinet bank sweep
        new THREE.Vector3( 30,  0,  18),
        new THREE.Vector3( 35,  0,   5),
        new THREE.Vector3( 35,  0, -10),
        // Right hairpin around prize counter
        new THREE.Vector3( 28,  0, -25),
        new THREE.Vector3( 14,  0, -35),
        // Bottom cross under central bumper island
        new THREE.Vector3(  0,  0, -40),
        new THREE.Vector3(-14,  0, -35),
        // Left hairpin around left cabinet bank
        new THREE.Vector3(-28,  0, -25),
        new THREE.Vector3(-35,  0, -10),
        new THREE.Vector3(-35,  0,   5),
        new THREE.Vector3(-30,  0,  18),
        // Left cabinet sweep back
        new THREE.Vector3(-22,  0,  30),
        new THREE.Vector3(-12,  0,  42),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY (void ceiling)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING (corrupted pink-magenta only)
    // No white or warm lights – everything is pink-magenta or void
    const ambient = new THREE.AmbientLight(0x0d0022, 0.2);
    scene.add(ambient);

    // Main overhead corrupted neon (pink-magenta)
    const overheadNeon1 = new THREE.PointLight(0xff00aa, 2.5, 60);
    overheadNeon1.position.set(0, 20, 0);
    scene.add(overheadNeon1);

    const overheadNeon2 = new THREE.PointLight(0xcc0088, 2.0, 55);
    overheadNeon2.position.set(25, 18, 20);
    scene.add(overheadNeon2);

    const overheadNeon3 = new THREE.PointLight(0xcc0088, 2.0, 55);
    overheadNeon3.position.set(-25, 18, 20);
    scene.add(overheadNeon3);

    // Corrupted floor glow (magenta from below)
    const floorGlow = new THREE.PointLight(0x880055, 1.5, 70);
    floorGlow.position.set(0, 1, 0);
    scene.add(floorGlow);

    // Pinball bumper lights (multiple, cycling pink-purple)
    const bumperLight1 = new THREE.PointLight(0xff00ff, 2.8, 25);
    bumperLight1.position.set(0, 3, -5);
    scene.add(bumperLight1);

    const bumperLight2 = new THREE.PointLight(0xaa00ff, 2.5, 25);
    bumperLight2.position.set(15, 3, 10);
    scene.add(bumperLight2);

    const bumperLight3 = new THREE.PointLight(0xaa00ff, 2.5, 25);
    bumperLight3.position.set(-15, 3, 10);
    scene.add(bumperLight3);

    // Back wall sign glow
    const signGlow = new THREE.PointLight(0xff0066, 1.8, 50);
    signGlow.position.set(0, 12, -45);
    scene.add(signGlow);

    // ------------------------------------------------------------------ ROTATING FLOOR PATTERN
    // Void black floor with magenta grid that appears to rotate
    const floorMat = toon('#030008');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(floor);

    // Rotating checker pattern (alternating tiles at 45° to simulate rotation)
    const tileColors = [0x0d0022, 0x1a0044];
    const tileSize = 6;
    for (let tx = -15; tx <= 15; tx++) {
      for (let tz = -15; tz <= 15; tz++) {
        const col = tileColors[(Math.abs(tx + tz)) % 2];
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(tileSize - 0.1, tileSize - 0.1),
          toon('#' + (col >>> 0).toString(16).padStart(6, '0'), { emissive: new THREE.Color(col) })
        );
        tile.rotation.x = -Math.PI / 2;
        // Tiles rotated 45° to give the "spinning" illusion
        tile.rotation.z = Math.PI / 4;
        tile.position.set(tx * tileSize, -0.14, tz * tileSize);
        scene.add(tile);
      }
    }

    // Magenta grid lines over floor
    const gridMat = toon('#440033', { emissive: new THREE.Color('#220022'), transparent: true, opacity: 0.5 });
    for (let g = -90; g <= 90; g += 6) {
      const hLine = new THREE.Mesh(new THREE.PlaneGeometry(200, 0.2), gridMat);
      hLine.rotation.x = -Math.PI / 2;
      hLine.position.set(0, -0.12, g);
      scene.add(hLine);

      const vLine = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 200), gridMat);
      vLine.rotation.x = -Math.PI / 2;
      vLine.position.set(g, -0.12, 0);
      scene.add(vLine);
    }

    // ------------------------------------------------------------------ ROAD (void with magenta edge)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#06000f', { emissive: new THREE.Color('#110022') });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Corrupted centreline (magenta)
    const centreMat = toon('#ff00aa', { emissive: new THREE.Color('#660044'), transparent: true, opacity: 0.8 });
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.08);
    const centreMesh = new THREE.Mesh(centreGeo, centreMat);
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS (corrupted cabinet backs)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0x1a0033);
    trackGroup.add(walls.visual);

    // ------------------------------------------------------------------ COLLISION
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

    // --- 1. CORRUPTED ARCADE CABINETS (right bank)
    const cabinetPositions = [
      [32, 0, 30], [36, 0, 20], [38, 0, 8], [38, 0, -5], [35, 0, -18],
    ];
    cabinetPositions.forEach(([cx, cy, cz], i) => {
      // Cabinet body
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(5, 10, 4),
        mat(0x0a0011, 0x220033)
      );
      cabinet.position.set(cx, cy + 5, cz);
      cabinet.rotation.y = -Math.PI / 2 + i * 0.1; // facing inward, slightly skewed
      cabinet.castShadow = true;
      scene.add(cabinet);

      // Corrupted screen (flickering magenta)
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3.5, 0.3),
        mat(0x220033, 0xaa0066)
      );
      screen.position.set(cx - 0.5, cy + 7, cz + Math.cos(i) * 0.5);
      screen.rotation.y = cabinet.rotation.y;
      scene.add(screen);

      // Corruption lines on screen
      for (let l = 0; l < 3; l++) {
        const scanLine = new THREE.Mesh(
          new THREE.BoxGeometry(4, 0.15, 0.1),
          mat(0xff00aa, 0xff00aa)
        );
        scanLine.position.set(cx - 0.5, cy + 6 + l * 0.8, cz + Math.cos(i) * 0.5 - 0.22);
        scanLine.rotation.y = cabinet.rotation.y;
        scene.add(scanLine);
      }
    });

    // --- 2. CORRUPTED CABINETS (left bank, mirrored)
    const cabinetPosLeft = [
      [-32, 0, 30], [-36, 0, 20], [-38, 0, 8], [-38, 0, -5], [-35, 0, -18],
    ];
    cabinetPosLeft.forEach(([cx, cy, cz], i) => {
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(5, 10, 4),
        mat(0x0a0011, 0x220033)
      );
      cabinet.position.set(cx, cy + 5, cz);
      cabinet.rotation.y = Math.PI / 2 - i * 0.1;
      cabinet.castShadow = true;
      scene.add(cabinet);

      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3.5, 0.3),
        mat(0x220033, 0xaa0066)
      );
      screen.position.set(cx + 0.5, cy + 7, cz);
      screen.rotation.y = cabinet.rotation.y;
      scene.add(screen);

      for (let l = 0; l < 3; l++) {
        const scanLine = new THREE.Mesh(
          new THREE.BoxGeometry(4, 0.15, 0.1),
          mat(0xff00aa, 0xff00aa)
        );
        scanLine.position.set(cx + 0.5, cy + 6 + l * 0.8, cz + 0.22);
        scanLine.rotation.y = cabinet.rotation.y;
        scene.add(scanLine);
      }
    });

    // --- 3. PINBALL BUMPERS (central island – main hazards)
    // These are the main "moving" hazard objects – represented as large glowing cylinders
    const bumperData = [
      { pos: [0, 0, -5],  color: 0xff00ff, emissive: 0x880088 },
      { pos: [15, 0, 10], color: 0xaa00ff, emissive: 0x550088 },
      { pos: [-15, 0, 10],color: 0xaa00ff, emissive: 0x550088 },
      { pos: [8, 0, -18], color: 0xff0099, emissive: 0x660044 },
      { pos: [-8, 0, -18],color: 0xff0099, emissive: 0x660044 },
    ];
    bumperData.forEach(({ pos, color, emissive }) => {
      // Bumper base ring
      const bumperRing = new THREE.Mesh(
        new THREE.TorusGeometry(4, 0.5, 12, 32),
        mat(color, emissive)
      );
      bumperRing.position.set(...pos);
      bumperRing.rotation.x = Math.PI / 2;
      scene.add(bumperRing);

      // Inner bumper cylinder
      const bumperBody = new THREE.Mesh(
        new THREE.CylinderGeometry(3.0, 3.0, 2.5, 16),
        mat(color, emissive)
      );
      bumperBody.position.set(pos[0], pos[1] + 1.25, pos[2]);
      bumperBody.castShadow = true;
      scene.add(bumperBody);

      // Cap
      const bumperCap = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 3.0, 1, 16),
        mat(0xffffff, color)  // bright cap
      );
      bumperCap.position.set(pos[0], pos[1] + 3, pos[2]);
      scene.add(bumperCap);

      // Bumper glow light
      const bumperGlow = new THREE.PointLight(color, 2.0, 20);
      bumperGlow.position.set(pos[0], pos[1] + 4, pos[2]);
      scene.add(bumperGlow);
    });

    // --- 4. PRIZE COUNTER (corrupted, items floating)
    // Counter structure
    const counter = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 5), mat(0x0a0011, 0x220033));
    counter.position.set(20, 1.5, -38);
    counter.castShadow = true;
    scene.add(counter);

    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 5.5), mat(0x1a0033));
    counterTop.position.set(20, 3.2, -38);
    scene.add(counterTop);

    // Floating prize items (corrupted, glitching)
    const prizeData = [
      [16, 5, -38], [20, 6.5, -38], [24, 4.5, -38],
    ];
    prizeData.forEach(([px, py, pz], i) => {
      const prize = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        mat(0xff00aa, 0xaa0066)
      );
      prize.position.set(px, py, pz);
      prize.rotation.set(i * 0.5, i * 0.3, i * 0.2); // corrupted rotations
      scene.add(prize);
    });

    // --- 5. CORRUPTED NEON SIGNS (warped letters as box arrays)
    // Main sign: "PLAY" – letters as extruded boxes
    const signMat = mat(0x440066, 0xff00aa);
    const letterData = [
      // P
      { x: -12, segs: [[0,0,0,0.8,4,0.5],[0,2,0,0.8,0.8,0.5],[1,2,0,0.8,0.8,0.5],[1,1,0,0.8,0.8,0.5],[0,1,0,0.8,0.8,0.5]] },
      // L
      { x: -8,  segs: [[0,0,0,0.8,4,0.5],[1,0,0,0.8,0.8,0.5]] },
      // A
      { x: -4,  segs: [[0,0,0,0.8,2,0.5],[1,0,0,0.8,2,0.5],[0,2,0,2,0.8,0.5],[0,1,0,2,0.8,0.5]] },
      // Y
      { x: 0,   segs: [[0,2,0,0.8,2,0.5],[1,2,0,0.8,2,0.5],[0.5,0.5,0,0.8,2,0.5]] },
    ];
    letterData.forEach(({ x, segs }) => {
      segs.forEach(([sx, sy, sz, sw, sh, sd]) => {
        const seg = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), signMat);
        seg.position.set(x + sx + sw / 2, sy + sh / 2 + 8, -46);
        scene.add(seg);
      });
    });

    // --- 6. CORRUPTED OVERHEAD NEON TUBE LIGHTS
    const neonTubeMat = mat(0x220033, 0xff00aa);
    const tubePositions = [
      [0, 14, 30], [20, 14, 20], [-20, 14, 20],
      [30, 14, 0], [-30, 14, 0], [20, 14, -20], [-20, 14, -20],
    ];
    tubePositions.forEach(([tx, ty, tz]) => {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 15, 8),
        neonTubeMat
      );
      tube.position.set(tx, ty, tz);
      tube.rotation.z = Math.PI / 2;
      scene.add(tube);
    });

    // --- 7. GLITCHING SCORE DISPLAYS (corrupted numeric displays)
    const displayData = [
      [30, 8, 5], [-30, 8, 5], [0, 10, -44],
    ];
    displayData.forEach(([dx, dy, dz], i) => {
      const displayFrame = new THREE.Mesh(
        new THREE.BoxGeometry(8, 4, 0.5),
        mat(0x0a0011)
      );
      displayFrame.position.set(dx, dy, dz);
      displayFrame.rotation.y = i === 2 ? 0 : dx > 0 ? -Math.PI / 4 : Math.PI / 4;
      scene.add(displayFrame);

      // Score digits (glowing red-magenta blocks)
      for (let d = 0; d < 6; d++) {
        const digit = new THREE.Mesh(
          new THREE.BoxGeometry(1, 2.5, 0.3),
          mat(0x220022, 0xdd0066)
        );
        digit.position.set(dx - 3 + d * 1.2, dy + 0.3, dz + 0.5);
        digit.rotation.y = displayFrame.rotation.y;
        scene.add(digit);
      }
    });

    // --- 8. CORRUPTED CHANGE MACHINE (right near start)
    const changeMachine = new THREE.Mesh(
      new THREE.BoxGeometry(4, 12, 3),
      mat(0x0a0011, 0x110022)
    );
    changeMachine.position.set(30, 6, 43);
    changeMachine.castShadow = true;
    scene.add(changeMachine);

    // Coin slot (glowing wrong color)
    const coinSlot = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.3, 0.5),
      mat(0xff0066, 0xff0066)
    );
    coinSlot.position.set(30, 9, 42);
    scene.add(coinSlot);

    // Coins floating out (glitch)
    for (let c = 0; c < 5; c++) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.12, 12),
        mat(0xffaa00, 0x884400)
      );
      coin.position.set(
        30 + (Math.random() - 0.5) * 3,
        9 + c * 1.2,
        42 + Math.random()
      );
      coin.rotation.x = Math.random() * Math.PI;
      scene.add(coin);
    }

    // --- 9. GLITCH FLOOR CRACKS (void beneath)
    const glitchCrackMat = mat(0xff00aa, 0xaa0066);
    const glitchCracks = [
      [5, 0, 15, 8, 0.1], [-8, 0, -12, 10, 0.4],
      [20, 0, -8, 7, -0.2], [-18, 0, 25, 9, 0.6],
    ];
    glitchCracks.forEach(([x, y, z, len, rot]) => {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.3, len), glitchCrackMat);
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = rot;
      crack.position.set(x, y - 0.11, z);
      scene.add(crack);

      // Magenta void light from crack
      const crackLight = new THREE.PointLight(0xff00aa, 0.8, 8);
      crackLight.position.set(x, y + 0.5, z);
      scene.add(crackLight);
    });

    // --- 10. CORRUPTED CEILING (low, pressing down)
    const ceilingMat = mat(0x030008, 0x110022);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 18;
    scene.add(ceiling);

    // Ceiling grid (inverted neon tubes looking down)
    for (let cg = -90; cg <= 90; cg += 12) {
      const ceilStrip = new THREE.Mesh(
        new THREE.BoxGeometry(200, 0.3, 0.3),
        mat(0x330044, 0x880044)
      );
      ceilStrip.position.set(0, 17.9, cg);
      scene.add(ceilStrip);

      const ceilStripV = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 200),
        mat(0x330044, 0x880044)
      );
      ceilStripV.position.set(cg, 17.9, 0);
      scene.add(ceilStripV);
    }

    // ------------------------------------------------------------------ PARTICLES
    // Corrupted pixel sparks
    TrackBuilder.createParticles(scene, {
      count:  250,
      spread: 70,
      color:  '#ff00aa',
      size:   0.2,
      speed:  0.06,
    });

    // Void static
    TrackBuilder.createParticles(scene, {
      count:  180,
      spread: 60,
      color:  '#6600cc',
      size:   0.1,
      speed:  0.03,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [];

    const hazards = [
      {
        type: 'pinball_bumper',
        position: new THREE.Vector3(0, 0, -5),
        radius: 4,
        force: 18,
        moving: true,
        moveRadius: 5,
        moveSpeed: 0.8,
      },
      {
        type: 'pinball_bumper',
        position: new THREE.Vector3(15, 0, 10),
        radius: 4,
        force: 18,
        moving: true,
        moveRadius: 4,
        moveSpeed: 1.1,
      },
      {
        type: 'pinball_bumper',
        position: new THREE.Vector3(-15, 0, 10),
        radius: 4,
        force: 18,
        moving: true,
        moveRadius: 4,
        moveSpeed: 0.9,
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
