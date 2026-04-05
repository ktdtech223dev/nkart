import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// DESK DASH  –  Dorm Cup, Race 1
// A figure-8 loop that weaves across the surface of a cluttered student desk.
// Cream road surface, warm incandescent lamp lighting, dust-mote particles.
// ---------------------------------------------------------------------------

export const track = {
  id: 'desk_dash',
  name: 'DESK DASH',
  cup: 'dorm',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_dorm_01',

  skyConfig: {
    topColor:    0xc8b89a,
    bottomColor: 0x9a7c5c,
    fogColor:    0xd4b88a,
    fogDensity:  0.007,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 11;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Oval loop around the desk surface – no crossovers, fully driveable.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3( 32,  0,   0),
        new THREE.Vector3( 36,  0,  14),
        new THREE.Vector3( 28,  0,  28),
        new THREE.Vector3( 12,  0,  34),
        new THREE.Vector3( -8,  0,  34),
        new THREE.Vector3(-24,  0,  28),
        new THREE.Vector3(-34,  0,  14),
        new THREE.Vector3(-34,  0,  -2),
        new THREE.Vector3(-28,  0, -18),
        new THREE.Vector3(-14,  0, -30),
        new THREE.Vector3(  4,  0, -34),
        new THREE.Vector3( 20,  0, -28),
        new THREE.Vector3( 32,  0, -14),
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
    // Warm overhead lamp (slightly off-centre, mimics a desk lamp)
    TrackBuilder.createLighting(
      scene,
      0xffeebb, 0.4,          // ambient
      0xffcc88, 1.0,          // directional (lamp)
      [10, 40, -5],           // lamp position
      true
    );
    // Soft fill from below (reflected light off desk surface)
    const fillLight = new THREE.PointLight(0xffe8b0, 0.15, 80);
    fillLight.position.set(-20, 5, 20);
    scene.add(fillLight);

    // ------------------------------------------------------------------ GROUND (desk surface)
    const woodTex = TrackBuilder.makeWoodTexture(0xd4b483);
    const deskMat = toon('#d4b483', { map: woodTex });
    const deskGeo = new THREE.PlaneGeometry(160, 120, 2, 2);
    const deskMesh = new THREE.Mesh(deskGeo, deskMat);
    deskMesh.rotation.x = -Math.PI / 2;
    deskMesh.position.y = -2.5;
    deskMesh.receiveShadow = true;
    scene.add(deskMesh);

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = TrackBuilder.makeRoadMaterial(0xf5ead0);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Road centre line
    const centreMat = toon('#888888', { transparent: true, opacity: 0.6 });
    const centreGeo = TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.08);
    const centreMesh = new THREE.Mesh(centreGeo, centreMat);
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0x8b6914);
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
    // Helper to reduce boilerplate — PBR materials
    const mat = (hex, emissiveHex = null) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissiveHex) { m.emissive = new THREE.Color(emissiveHex); m.emissiveIntensity = 0.25; }
      return m;
    };

    // --- 1. Pencils (yellow cylinders, scattered near right lobe)
    const pencilPositions = [
      [22, 0.4, 10], [24, 0.4, 8], [26, 0.4, 12],
      [-22, 0.4, -10], [-25, 0.4, -8],
    ];
    pencilPositions.forEach(([x, y, z], i) => {
      // Pencil body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 5, 8),
        mat(0xffd54f)
      );
      body.position.set(x, y + 2.5, z);
      body.rotation.z = 0.3 + i * 0.15;
      body.castShadow = true;
      scene.add(body);
      // Eraser tip
      const eraser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.6, 8),
        mat(0xff8a80)
      );
      eraser.position.set(x - Math.sin(body.rotation.z) * 2.8, y + 2.5, z);
      scene.add(eraser);
      // Lead tip (cone)
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.7, 8),
        mat(0x555555)
      );
      tip.position.set(x + Math.sin(body.rotation.z) * 2.8, y + 2.5, z);
      scene.add(tip);
    });

    // --- 2. Monitor (tall box stack behind left lobe)
    const monitorBase = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 10), mat(0x212121));
    monitorBase.position.set(-32, 0.4, 5);
    monitorBase.castShadow = true;
    scene.add(monitorBase);

    const monitorScreen = new THREE.Mesh(new THREE.BoxGeometry(17, 11, 0.6), mat(0x1a237e, 0x0d47a1));
    monitorScreen.position.set(-32, 6.5, 0);
    monitorScreen.castShadow = true;
    scene.add(monitorScreen);

    const monitorStand = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 4, 8), mat(0x424242));
    monitorStand.position.set(-32, 2.4, 4);
    monitorStand.castShadow = true;
    scene.add(monitorStand);

    // Monitor screen glow as emissive point light
    const screenGlow = new THREE.PointLight(0x4488ff, 0.3, 20);
    screenGlow.position.set(-32, 6.5, 1);
    scene.add(screenGlow);

    // --- 3. Textbook stacks (boxes, right side obstacles near crossover)
    const bookColors = [0xc62828, 0x1565c0, 0x2e7d32, 0xf57f17, 0x6a1b9a];
    [
      [10, 0, -18], [10, 0, -22], [8, 0, -20]
    ].forEach(([bx, by, bz]) => {
      let stackY = by + 0.4;
      for (let b = 0; b < 3 + Math.floor(Math.random() * 3); b++) {
        const thick = 0.8 + Math.random() * 0.4;
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(8, thick, 5.5),
          mat(bookColors[b % bookColors.length])
        );
        book.position.set(bx, stackY + thick / 2, bz);
        book.rotation.y = (Math.random() - 0.5) * 0.25;
        book.castShadow = true;
        scene.add(book);
        stackY += thick;
      }
    });

    // --- 4. Mousepad (flat dark rectangle, left lobe interior)
    const mousepad = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.3, 14),
      mat(0x1a1a2e)
    );
    mousepad.position.set(-20, -0.05, -5);
    mousepad.receiveShadow = true;
    scene.add(mousepad);

    // Mouse on mousepad
    const mouse = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 4), mat(0x303030));
    mouse.position.set(-18, 0.7, -4);
    mouse.castShadow = true;
    scene.add(mouse);

    // --- 5. Water bottle (tall cylinder, right lobe outer edge)
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 12, 16),
      mat(0x80deea, 0x006064)
    );
    bottle.position.set(40, 6, 5);
    bottle.castShadow = true;
    scene.add(bottle);
    const bottleCap = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.5, 16), mat(0xffffff));
    bottleCap.position.set(40, 12.75, 5);
    scene.add(bottleCap);

    // --- 6. Keyboard (flat box near bottom of right lobe)
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.7, 8),
      mat(0x37474f)
    );
    keyboard.position.set(18, 0.35, 30);
    keyboard.castShadow = true;
    scene.add(keyboard);

    // Keyboard key bumps (rows of tiny boxes)
    const keyMat = mat(0x546e7a);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 12; col++) {
        const key = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.2), keyMat);
        key.position.set(
          18 - 9 + col * 1.7,
          0.9,
          30 - 2.5 + row * 1.6
        );
        scene.add(key);
      }
    }

    // --- 7. Mug with pencils / pens
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.0, 5, 16, 1, true),
      mat(0xff7043)
    );
    mug.position.set(-35, 2.5, 20);
    mug.castShadow = true;
    scene.add(mug);
    const mugBottom = new THREE.Mesh(new THREE.CircleGeometry(2.0, 16), mat(0xff7043));
    mugBottom.rotation.x = -Math.PI / 2;
    mugBottom.position.set(-35, 0, 20);
    scene.add(mugBottom);
    // Pens inside mug
    [0, 1.2, -1.2].forEach(dx => {
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7, 8), mat(0x1565c0));
      pen.position.set(-35 + dx, 6, 20);
      scene.add(pen);
    });

    // --- 8. Sticky-note stack (flat box, colourful)
    const stickyColors = [0xffee58, 0xf06292, 0x81d4fa];
    stickyColors.forEach((c, i) => {
      const sticky = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 5), mat(c));
      sticky.position.set(36, 0.15 + i * 0.16, -20 + i * 0.1);
      sticky.rotation.y = (i - 1) * 0.08;
      scene.add(sticky);
    });

    // --- 9. Desk lamp (cone shade + cylinder arm)
    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 20, 8), mat(0x9e9e9e));
    lampArm.position.set(-50, 10, -30);
    lampArm.rotation.z = 0.4;
    lampArm.castShadow = true;
    scene.add(lampArm);
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(4, 5, 12, 1, true), mat(0xfff59d));
    lampShade.position.set(-42, 20, -28);
    lampShade.rotation.z = Math.PI; // open end down
    scene.add(lampShade);
    const lampBulb = new THREE.PointLight(0xffdd88, 0.6, 50);
    lampBulb.position.set(-42, 18, -28);
    scene.add(lampBulb);

    // --- 10. Headphones (torus + cylinders)
    const hpBand = new THREE.Mesh(new THREE.TorusGeometry(4, 0.5, 8, 24, Math.PI), mat(0x212121));
    hpBand.position.set(32, 2, -25);
    hpBand.rotation.x = Math.PI / 2;
    hpBand.castShadow = true;
    scene.add(hpBand);
    [-4, 4].forEach(dx => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.5, 16), mat(0x424242));
      ear.position.set(32 + dx, 0.8, -25);
      scene.add(ear);
    });

    // ------------------------------------------------------------------ DUST MOTE PARTICLES
    TrackBuilder.createParticles(scene, {
      count:     200,
      spread:    80,
      color:     '#ffe8b0',
      size:      0.18,
      speed:     0.02,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints     = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions  = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath    = TrackBuilder.generateWaypoints(curve, 100);

    // ------------------------------------------------------------------ SURFACE ZONES
    const surfaceZones = [
      { type: 'asphalt', traction: 1.0, friction: 0.85 },  // default road
    ];

    // ------------------------------------------------------------------ HAZARDS (none active on desk)
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
