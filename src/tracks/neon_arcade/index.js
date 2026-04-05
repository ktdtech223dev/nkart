import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// NEON ARCADE  –  Arcade Cup, Race 3
// A neon-lit arcade interior. Purple carpet, giant cabinet props,
// claw machine, air hockey table, pinball section. Neon fog, spark particles.
// ---------------------------------------------------------------------------

export const track = {
  id: 'neon_arcade',
  name: 'NEON ARCADE',
  cup: 'arcade',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_arcade_03',

  skyConfig: {
    topColor:    0x120018,
    bottomColor: 0x1a0022,
    fogColor:    0x1f0028,
    fogDensity:  0.015,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 210;

    // ------------------------------------------------------------------ CURVE
    // Loop through the arcade floor weaving between cabinet rows.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 20,  0,  -8),
        new THREE.Vector3( 40,  0,   0),
        new THREE.Vector3( 50,  0,  15),
        new THREE.Vector3( 42,  0,  32),
        new THREE.Vector3( 25,  0,  42),
        new THREE.Vector3(  5,  0,  38),
        new THREE.Vector3(-12,  0,  28),
        new THREE.Vector3(-25,  0,  18),
        new THREE.Vector3(-40,  0,  10),
        new THREE.Vector3(-48,  0,  -5),
        new THREE.Vector3(-38,  0, -20),
        new THREE.Vector3(-20,  0, -28),
        new THREE.Vector3( -5,  0, -22),
        new THREE.Vector3(  5,  0, -12),
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
    // Dark ambient; neon point lights carry the visuals
    TrackBuilder.createLighting(
      scene,
      0x220033, 0.5,       // dark purple ambient
      0xcc00ff, 0.4,       // purple directional
      [0, 50, 0],
      false
    );
    // Neon pink fill strip
    const pinkFill = new THREE.PointLight(0xff00cc, 1.0, 120);
    pinkFill.position.set(-20, 10, 20);
    scene.add(pinkFill);
    // Neon blue fill strip
    const blueFill = new THREE.PointLight(0x0088ff, 0.8, 100);
    blueFill.position.set(30, 10, 30);
    scene.add(blueFill);

    // ------------------------------------------------------------------ GROUND (arcade carpet)
    // Dark purple base
    const carpetMat = toon('#1a0028');
    const carpetGeo = new THREE.PlaneGeometry(200, 160);
    const carpetMesh = new THREE.Mesh(carpetGeo, carpetMat);
    carpetMesh.rotation.x = -Math.PI / 2;
    carpetMesh.position.y = -0.15;
    carpetMesh.receiveShadow = true;
    scene.add(carpetMesh);

    // Carpet diamond pattern (alternating neon strips)
    const carpetPatMat = toon('#330044', { emissive: new THREE.Color('#110022'), transparent: true, opacity: 0.6 });
    for (let gx = -90; gx < 90; gx += 10) {
      for (let gz = -70; gz < 70; gz += 10) {
        if ((Math.floor(gx / 10) + Math.floor(gz / 10)) % 2 === 0) {
          const diamond = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 8),
            carpetPatMat
          );
          diamond.rotation.x = -Math.PI / 2;
          diamond.rotation.z = Math.PI / 4;
          diamond.position.set(gx + 5, -0.12, gz + 5);
          scene.add(diamond);
        }
      }
    }

    // ------------------------------------------------------------------ CEILING
    const ceilMat = toon('#0d0015');
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(200, 160), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 35;
    scene.add(ceiling);

    // Ceiling neon strip lights
    const ceilingNeonMat = toon('#ff00ff', { emissive: new THREE.Color('#cc00cc') });
    for (let i = -60; i <= 60; i += 20) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 160), ceilingNeonMat);
      strip.position.set(i, 34.5, 0);
      scene.add(strip);
      const neonLight = new THREE.PointLight(0xff00ff, 0.5, 40);
      neonLight.position.set(i, 32, 0);
      scene.add(neonLight);
    }

    // ------------------------------------------------------------------ ROAD (arcade carpet lane)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#2a003a');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Neon lane border lines
    const laneMat = toon('#ff00ff', { emissive: new THREE.Color('#cc00aa'), transparent: true, opacity: 0.8 });
    const laneInner = TrackBuilder.buildRoad(curve, ROAD_WIDTH - 0.5, SEGMENTS, 0.07);
    const laneOuter = TrackBuilder.buildRoad(curve, ROAD_WIDTH + 0.5, SEGMENTS, 0.07);
    // Thin centre glow
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.09);
    trackGroup.add(new THREE.Mesh(centreGeo, laneMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 2.0, 0x6600aa);
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

    // --- 1. Arcade cabinets (tall boxes with emissive screen faces)
    const cabinetData = [
      { x:  30, z: -18, ry: 0,          c: 0xff00aa },
      { x:  35, z: -18, ry: 0,          c: 0x00aaff },
      { x:  40, z: -18, ry: 0,          c: 0xff6600 },
      { x: -22, z:  50, ry: Math.PI,    c: 0xffff00 },
      { x: -27, z:  50, ry: Math.PI,    c: 0x00ffaa },
      { x: -32, z:  50, ry: Math.PI,    c: 0xff00ff },
      { x:  60, z:  25, ry: -Math.PI/2, c: 0x88ff00 },
      { x:  60, z:  15, ry: -Math.PI/2, c: 0xff2200 },
    ];
    cabinetData.forEach(({ x, z, ry, c }) => {
      // Cabinet body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(4, 10, 3),
        mat(0x111111)
      );
      body.position.set(x, 5, z);
      body.rotation.y = ry;
      body.castShadow = true;
      scene.add(body);
      // Screen face (emissive)
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 4, 0.15),
        mat(c, c)
      );
      screen.position.set(
        x + Math.sin(ry) * 1.55,
        7,
        z + Math.cos(ry) * 1.55
      );
      screen.rotation.y = ry;
      scene.add(screen);
      // Marquee top glow
      const marquee = new THREE.Mesh(
        new THREE.BoxGeometry(4.1, 1, 3.1),
        mat(c, c)
      );
      marquee.position.set(x, 10.5, z);
      scene.add(marquee);
      // Cabinet point light
      const cLight = new THREE.PointLight(c, 0.8, 15);
      cLight.position.set(x, 7, z);
      scene.add(cLight);
    });

    // --- 2. Claw machine (box + dome + mechanical arm)
    const clawBase = new THREE.Mesh(
      new THREE.BoxGeometry(8, 12, 6),
      mat(0x003388)
    );
    clawBase.position.set(-50, 6, -10);
    clawBase.castShadow = true;
    scene.add(clawBase);
    const clawGlass = new THREE.Mesh(
      new THREE.BoxGeometry(7, 9, 5),
      mat(0xaaccff, 0x002244)
    );
    clawGlass.position.set(-50, 7.5, -10);
    scene.add(clawGlass);
    const clawTop = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 1, 6.5),
      mat(0x002266)
    );
    clawTop.position.set(-50, 12.5, -10);
    scene.add(clawTop);
    // Claw arm
    const armH = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 5, 8),
      mat(0xcccccc)
    );
    armH.rotation.z = Math.PI / 2;
    armH.position.set(-50, 13, -10);
    scene.add(armH);
    const armV = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 4, 8),
      mat(0xcccccc)
    );
    armV.position.set(-48, 11, -10);
    scene.add(armV);
    const clawLight = new THREE.PointLight(0x0044ff, 0.9, 18);
    clawLight.position.set(-50, 8, -10);
    scene.add(clawLight);
    // Stuffed animal placeholders (small spheres)
    [[0, 0], [1.5, 1], [-1.5, -1], [0, 2]].forEach(([ox, oz]) => {
      const toy = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        mat([0xff4081, 0xffff00, 0x69f0ae, 0xff6e40][Math.floor(Math.random() * 4)])
      );
      toy.position.set(-50 + ox, 4, -10 + oz);
      scene.add(toy);
    });

    // --- 3. Air hockey table (flat box with rail sides and disc)
    const hockeyBase = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.5, 8),
      mat(0x333333)
    );
    hockeyBase.position.set(10, 0.75, 55);
    hockeyBase.castShadow = true;
    scene.add(hockeyBase);
    const hockeySurface = new THREE.Mesh(
      new THREE.BoxGeometry(13, 0.1, 7),
      mat(0x1a8cff, 0x003366)
    );
    hockeySurface.position.set(10, 1.55, 55);
    scene.add(hockeySurface);
    // Rails
    [[0, 1, 4], [0, -1, 4]].forEach(([ox, oz, len]) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.8, 0.5),
        mat(0x555555)
      );
      rail.position.set(10, 1.9, 55 + oz * 3.7);
      scene.add(rail);
    });
    [-7, 7].forEach(ox => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.8, 8),
        mat(0x555555)
      );
      rail.position.set(10 + ox, 1.9, 55);
      scene.add(rail);
    });
    // Puck
    const puck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.25, 12),
      mat(0xff0000)
    );
    puck.position.set(10, 1.7, 55);
    scene.add(puck);
    const hockeyLight = new THREE.PointLight(0x2299ff, 0.7, 20);
    hockeyLight.position.set(10, 8, 55);
    scene.add(hockeyLight);

    // --- 4. Pinball machine section (wedge-shaped box tilted, with flippers)
    const pinballBody = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1.2, 12),
      mat(0x222222)
    );
    pinballBody.position.set(-15, 4, -30);
    pinballBody.rotation.x = -0.25;
    pinballBody.castShadow = true;
    scene.add(pinballBody);
    const pinballGlass = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.1, 11),
      mat(0xccddff, 0x1144aa)
    );
    pinballGlass.position.set(-15, 4.7, -30);
    pinballGlass.rotation.x = -0.25;
    scene.add(pinballGlass);
    const pinballBack = new THREE.Mesh(
      new THREE.BoxGeometry(7, 9, 0.5),
      mat(0xff6600, 0x882200)
    );
    pinballBack.position.set(-15, 8.5, -35.5);
    scene.add(pinballBack);
    // Bumper spheres on playfield
    [[0, 0], [1.5, -2], [-1.5, -2]].forEach(([bx, bz]) => {
      const bumper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.5, 12),
        mat(0xff0000, 0x880000)
      );
      bumper.position.set(-15 + bx, 5.0, -30 + bz);
      bumper.rotation.x = -0.25;
      scene.add(bumper);
    });
    const pinLight = new THREE.PointLight(0xff6600, 0.8, 20);
    pinLight.position.set(-15, 10, -30);
    scene.add(pinLight);

    // --- 5. Token exchange kiosk (tall box with slot)
    const kiosk = new THREE.Mesh(
      new THREE.BoxGeometry(5, 14, 4),
      mat(0x880088)
    );
    kiosk.position.set(58, 7, -5);
    kiosk.castShadow = true;
    scene.add(kiosk);
    const kioskScreen = new THREE.Mesh(
      new THREE.BoxGeometry(4, 5, 0.15),
      mat(0xffcc00, 0xcc6600)
    );
    kioskScreen.position.set(58, 10, -2.93);
    scene.add(kioskScreen);
    const kioskLight = new THREE.PointLight(0xffcc00, 1.0, 15);
    kioskLight.position.set(58, 10, -2);
    scene.add(kioskLight);

    // --- 6. Prize ticket dispenser (cylinder with strip)
    const dispenser = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 10, 16),
      mat(0xff4400, 0x220000)
    );
    dispenser.position.set(-58, 5, 15);
    dispenser.castShadow = true;
    scene.add(dispenser);
    const dispenserLight = new THREE.PointLight(0xff4400, 0.7, 12);
    dispenserLight.position.set(-58, 12, 15);
    scene.add(dispenserLight);

    // --- 7. Neon sign frames (thin box outlines glowing)
    const signColors = [0xff00ff, 0x00ffff, 0xff6600, 0xffff00];
    [
      { x:  0, z: -70, ry: 0    },
      { x:  0, z:  80, ry: Math.PI },
      { x: -80, z: 15, ry: Math.PI/2 },
      { x:  80, z: 15, ry: -Math.PI/2 },
    ].forEach(({ x, z, ry }, i) => {
      const c = signColors[i % signColors.length];
      // Outer frame
      const signMat = mat(c, c);
      [[0, 0, 20, 0.6], [0, 10, 20, 0.6], [-10, 5, 0.6, 10], [10, 5, 0.6, 10]].forEach(
        ([ox, oy, w, h]) => {
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, 0.3),
            signMat
          );
          bar.position.set(x + ox, oy + 12, z);
          bar.rotation.y = ry;
          scene.add(bar);
        }
      );
      const signLight = new THREE.PointLight(c, 0.6, 30);
      signLight.position.set(x, 17, z);
      scene.add(signLight);
    });

    // --- 8. Speaker stacks (layered boxes with cone grilles)
    [[-55, 0, 45], [65, 0, -15]].forEach(([sx, sy, sz]) => {
      for (let s = 0; s < 3; s++) {
        const spk = new THREE.Mesh(
          new THREE.BoxGeometry(5, 5, 4),
          mat(0x111111)
        );
        spk.position.set(sx, 2.5 + s * 5.1, sz);
        spk.castShadow = true;
        scene.add(spk);
        // Grille cone
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 1.5, 12),
          mat(0x333333)
        );
        cone.rotation.x = Math.PI / 2;
        cone.position.set(sx, 2.5 + s * 5.1, sz + 2.1);
        scene.add(cone);
      }
    });

    // ------------------------------------------------------------------ NEON SPARK PARTICLES
    TrackBuilder.createParticles(scene, {
      count:  250,
      spread:  100,
      color:  '#ff00cc',
      size:    0.18,
      speed:   0.05,
    });
    TrackBuilder.createParticles(scene, {
      count:  180,
      spread:  80,
      color:  '#00ccff',
      size:    0.14,
      speed:   0.04,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'asphalt', traction: 1.0, friction: 0.85 },
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
