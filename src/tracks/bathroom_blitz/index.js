import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// BATHROOM BLITZ  –  Dorm Cup, Race 4
// A tight circuit that runs along the bathroom counter, dips into the shower
// stall, circles the toilet, and comes back. White tiles, steam particles
// in the shower section, cool fluorescent lighting.
// ---------------------------------------------------------------------------

export const track = {
  id: 'bathroom_blitz',
  name: 'BATHROOM BLITZ',
  cup: 'dorm',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_dorm_04',

  skyConfig: {
    topColor:    0xdaeaf5,
    bottomColor: 0xb0cde0,
    fogColor:    0xd0e8f0,
    fogDensity:  0.022,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 230;

    // ------------------------------------------------------------------ CURVE
    // Layout (top-down view):
    //   Counter runs along +Z wall from x≈-30 to x≈30 at y≈4 (elevated).
    //   Shower stall occupies x: [-35..-20], z: [-20..-5] at floor level.
    //   Toilet is at x≈25, z≈-15.
    //   The track descends ramps off the counter into each zone and climbs back.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Counter top – left end to right
        new THREE.Vector3(-28,  0,  38),
        new THREE.Vector3(-10,  0,  42),
        new THREE.Vector3( 10,  0,  42),
        new THREE.Vector3( 28,  0,  38),
        // Ramp down off right counter end
        new THREE.Vector3( 36,  0,  28),
        new THREE.Vector3( 38,  0,  12),
        // Toilet loop (floor level, tight chicane around the toilet)
        new THREE.Vector3( 38,  0,  -2),
        new THREE.Vector3( 30,  0, -18),
        new THREE.Vector3( 18,  0, -24),
        new THREE.Vector3(  8,  0, -18),
        new THREE.Vector3( 14,  0,  -5),
        new THREE.Vector3( 20,  0,   8),
        // Through centre back to shower side
        new THREE.Vector3(  5,  0,  10),
        new THREE.Vector3(-10,  0,   5),
        // Shower stall entry (steam zone – y stays low)
        new THREE.Vector3(-22,  0,  -4),
        new THREE.Vector3(-32,  0, -12),
        new THREE.Vector3(-36,  0, -22),
        new THREE.Vector3(-30,  0, -32),
        new THREE.Vector3(-18,  0, -30),
        new THREE.Vector3(-10,  0, -20),
        // Shower exit, ramp up to counter left end
        new THREE.Vector3(-18,  0,  -5),
        new THREE.Vector3(-30,  0,  18),
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
    // Cool fluorescent overhead (bathroom)
    TrackBuilder.createLighting(
      scene,
      0xe8f4fc, 0.65,
      0xffffff, 1.3,
      [0, 45, 10],
      true
    );
    // Vanity mirror light strip (warm)
    const mirrorLight = new THREE.PointLight(0xffeecc, 0.8, 40);
    mirrorLight.position.set(0, 10, 44);
    scene.add(mirrorLight);
    // Shower area tinted light (steamy blue-white)
    const showerLight = new THREE.PointLight(0xaaccff, 0.6, 30);
    showerLight.position.set(-28, 8, -18);
    scene.add(showerLight);

    // ------------------------------------------------------------------ TILE FLOOR
    const tileMat = toon('#f0f0f0');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), tileMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(floor);

    // Tile grout lines (grid of thin dark strips)
    const groutMat = toon('#cccccc');
    for (let gx = -55; gx <= 55; gx += 8) {
      const groutV = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 120), groutMat);
      groutV.rotation.x = -Math.PI / 2;
      groutV.position.set(gx, -0.14, 0);
      scene.add(groutV);
    }
    for (let gz = -55; gz <= 55; gz += 8) {
      const groutH = new THREE.Mesh(new THREE.PlaneGeometry(120, 0.25), groutMat);
      groutH.rotation.x = -Math.PI / 2;
      groutH.position.set(0, -0.14, gz);
      scene.add(groutH);
    }

    // Tile wall (back wall behind counter)
    const wallTileMat = toon('#e8e8e8');
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(90, 25), wallTileMat);
    backWall.position.set(0, 12, 48);
    scene.add(backWall);

    // Shower wall tiles (darker, greenish)
    const showerWallMat = toon('#d0e8d8');
    // Three shower walls
    const showerWallBack = new THREE.Mesh(new THREE.PlaneGeometry(22, 20), showerWallMat);
    showerWallBack.position.set(-28, 10, -34);
    scene.add(showerWallBack);
    const showerWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), showerWallMat);
    showerWallLeft.rotation.y = Math.PI / 2;
    showerWallLeft.position.set(-39, 10, -19);
    scene.add(showerWallLeft);
    const showerWallRight = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), showerWallMat);
    showerWallRight.rotation.y = -Math.PI / 2;
    showerWallRight.position.set(-17, 10, -19);
    scene.add(showerWallRight);

    // ------------------------------------------------------------------ COUNTER TOP
    const counterMat = toon('#f5f0e8');
    const counterEdgeMat = toon('#d8cbb0');
    const counter = new THREE.Mesh(new THREE.BoxGeometry(68, 1.5, 12), counterMat);
    counter.position.set(0, 3.75, 42);
    counter.receiveShadow = true;
    scene.add(counter);
    // Counter front edge
    const counterEdge = new THREE.Mesh(new THREE.BoxGeometry(68, 5, 1), counterEdgeMat);
    counterEdge.position.set(0, 1.5, 48);
    scene.add(counterEdge);
    // Counter supports (cabinet doors)
    [-25, 0, 25].forEach(cx => {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 10), toon('#ffffff'));
      cab.position.set(cx, -1, 43);
      scene.add(cab);
      // Cabinet door handle
      const handle = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 0.4), toon('#aaaaaa'));
      handle.position.set(cx, -1, 48.2);
      scene.add(handle);
    });

    // ------------------------------------------------------------------ SINK
    const sinkBasin = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 4.5, 2.5, 16, 1, true),
      toon('#fafafa')
    );
    sinkBasin.position.set(0, 2.8, 42);
    scene.add(sinkBasin);
    const sinkDrain = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12), toon('#888888'));
    sinkDrain.position.set(0, 1.7, 42);
    scene.add(sinkDrain);
    // Faucet
    const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3, 8), toon('#c0c0c0'));
    faucetBase.position.set(0, 5.5, 44);
    scene.add(faucetBase);
    const faucetArm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5, 8), toon('#c0c0c0'));
    faucetArm.position.set(0, 7, 42);
    faucetArm.rotation.x = Math.PI / 2;
    scene.add(faucetArm);

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#f8f0e8');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre dashed line
    const centreGeo  = TrackBuilder.buildRoad(curve, 0.55, SEGMENTS, 0.09);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#ffcc00', { transparent: true, opacity: 0.6 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0xc0c0c0);
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

    // --- 1. Toothbrush (cylinder handle + angled head)
    [[-8, 4.5, 43], [8, 4.5, 43]].forEach(([tx, ty, tz], i) => {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 7, 8), mat(i === 0 ? 0x1565c0 : 0xe91e63));
      handle.position.set(tx, ty, tz);
      handle.rotation.z = 0.2;
      handle.castShadow = true;
      scene.add(handle);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.8), mat(0xffffff));
      head.position.set(tx + 0.7, ty + 4, tz);
      head.rotation.z = 0.2;
      scene.add(head);
      // Bristles (tiny box on top of head)
      const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.7), mat(0xaaffcc));
      bristles.position.set(tx + 0.9, ty + 5.1, tz);
      scene.add(bristles);
    });

    // --- 2. Shampoo bottle (tall rounded cylinder)
    [
      { pos: [-22, 0, 42], h: 9, r: 1.5, col: 0xffa000, label: 0xff6f00 },
      { pos: [-18, 0, 43], h: 8, r: 1.3, col: 0x0288d1, label: 0x01579b },
      { pos: [-14, 0, 42], h: 10, r: 1.6, col: 0x388e3c, label: 0x1b5e20 },
    ].forEach(({ pos, h, r, col, label }) => {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, h, 12), mat(col));
      bottle.position.set(pos[0], pos[1] + h / 2, pos[2]);
      bottle.castShadow = true;
      scene.add(bottle);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 1.2, 10), mat(0xffffff));
      cap.position.set(pos[0], pos[1] + h + 0.6, pos[2]);
      scene.add(cap);
      // Label strip
      const labelMesh = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.02, r + 0.02, h * 0.4, 12), mat(label));
      labelMesh.position.set(pos[0], pos[1] + h * 0.55, pos[2]);
      scene.add(labelMesh);
    });

    // --- 3. Soap bar (rounded box on counter near sink)
    const soap = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 2.2), mat(0xfffde7));
    soap.position.set(8, 4.7, 44);
    soap.rotation.y = 0.1;
    soap.castShadow = true;
    scene.add(soap);
    // Soap dish
    const soapDish = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5, 3.2), mat(0xc8e6c9));
    soapDish.position.set(8, 4.25, 44);
    scene.add(soapDish);

    // --- 4. Mirror (flat reflective-ish plane with frame on back wall)
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 0.6), mat(0x8d6e63));
    mirrorFrame.position.set(0, 10, 47.7);
    scene.add(mirrorFrame);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(20, 14, 0.2), mat(0xd0e8f5, 0x224488));
    mirror.position.set(0, 10, 47.9);
    scene.add(mirror);
    // Mirror reflection glow
    const mirrorGlow = new THREE.PointLight(0xaaccff, 0.3, 20);
    mirrorGlow.position.set(0, 10, 46);
    scene.add(mirrorGlow);

    // --- 5. Shower curtain (series of flat planes hanging from rod)
    const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 24, 8), mat(0x9e9e9e));
    curtainRod.position.set(-28, 20, -5);
    curtainRod.rotation.z = Math.PI / 2;
    scene.add(curtainRod);
    const curtainMat = mat(0x80cbc4);
    for (let pc = 0; pc < 7; pc++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3, 18, 0.15), curtainMat);
      panel.position.set(-39 + pc * 3.5, 11, -5);
      panel.castShadow = true;
      scene.add(panel);
      // Ring hook
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.12, 6, 12), mat(0xbdbdbd));
      ring.position.set(-39 + pc * 3.5, 20.5, -5);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    }

    // --- 6. Toilet (cylinder bowl + tank box + seat)
    const toiletBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 3.5, 4.5, 16), mat(0xfafafa));
    toiletBase.position.set(28, 2.25, -18);
    toiletBase.castShadow = true;
    scene.add(toiletBase);
    const toiletSeat = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.7, 8, 20), mat(0xeeeeee));
    toiletSeat.position.set(28, 4.7, -18);
    toiletSeat.rotation.x = Math.PI / 2;
    scene.add(toiletSeat);
    const toiletTank = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 3), mat(0xfafafa));
    toiletTank.position.set(28, 5.5, -13);
    toiletTank.castShadow = true;
    scene.add(toiletTank);
    const toiletLid = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 3), mat(0xf0f0f0));
    toiletLid.position.set(28, 9.25, -13);
    scene.add(toiletLid);

    // --- 7. Towel rack + hanging towel
    const towelRack = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 14, 8), mat(0x9e9e9e));
    towelRack.position.set(40, 8, 10);
    towelRack.rotation.z = Math.PI / 2;
    scene.add(towelRack);
    const towel = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 0.4), mat(0x1976d2));
    towel.position.set(40, 3, 10);
    scene.add(towel);

    // --- 8. Toothpaste tube (cylinder + flat nozzle)
    const paste = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 6, 10), mat(0xef5350));
    paste.position.set(-3, 4.6, 44);
    paste.rotation.z = Math.PI / 4;
    paste.castShadow = true;
    scene.add(paste);
    const pasteNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 1.2, 8), mat(0xffffff));
    pasteNozzle.position.set(-3 - 2.5, 4.6 + 2.5, 44);
    pasteNozzle.rotation.z = Math.PI / 4;
    scene.add(pasteNozzle);

    // --- 9. Shower head + arm pipe
    const showerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 8), mat(0xbdbdbd));
    showerArm.position.set(-28, 18, -30);
    showerArm.rotation.x = Math.PI / 4;
    scene.add(showerArm);
    const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.8, 1.2, 16), mat(0x9e9e9e));
    showerHead.position.set(-28, 22, -34);
    showerHead.rotation.x = Math.PI / 6;
    scene.add(showerHead);
    // Spray holes (tiny spheres)
    for (let sh = 0; sh < 9; sh++) {
      const hole = new THREE.Mesh(new THREE.SphereGeometry(0.18, 5, 5), mat(0x555555));
      hole.position.set(
        -28 + (sh % 3 - 1) * 0.8,
        22 - 0.7,
        -34 + Math.floor(sh / 3) * 0.8 - 0.8
      );
      scene.add(hole);
    }

    // --- 10. Rubber bath mat (flat coloured plane, shower floor)
    const bathMat = new THREE.Mesh(new THREE.BoxGeometry(18, 0.35, 22), mat(0x4db6ac));
    bathMat.position.set(-28, 0.18, -19);
    scene.add(bathMat);
    // Anti-slip ridges on bath mat
    for (let br = 0; br < 5; br++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 0.6), mat(0x26a69a));
      ridge.position.set(-28, 0.5, -25 + br * 3.5);
      scene.add(ridge);
    }

    // --- 11. Mouthwash bottle (taller, trapezoidal)
    const mouthwash = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 2), mat(0x00acc1));
    mouthwash.position.set(18, 5, 43);
    mouthwash.castShadow = true;
    scene.add(mouthwash);
    const mwCap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 1.8), mat(0x006064));
    mwCap.position.set(18, 10.5, 43);
    scene.add(mwCap);

    // --- 12. Deodorant stick (cylinder)
    const deo = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6.5, 12), mat(0x7986cb));
    deo.position.set(22, 3.25, 43);
    deo.castShadow = true;
    scene.add(deo);
    const deoCap = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.5, 12), mat(0x3f51b5));
    deoCap.position.set(22, 7, 43);
    scene.add(deoCap);

    // ------------------------------------------------------------------ STEAM PARTICLES (shower zone)
    // Dense mist near shower stall
    TrackBuilder.createParticles(scene, {
      count:   180,
      spread:  22,
      color:   '#c8e8f0',
      size:    0.35,
      speed:   0.03,
    });
    // Second, finer steam layer
    TrackBuilder.createParticles(scene, {
      count:   80,
      spread:  14,
      color:   '#ffffff',
      size:    0.2,
      speed:   0.05,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'tile',    traction: 0.88, friction: 0.75 },  // slippery when wet
      { type: 'bathmat', traction: 1.05, friction: 0.95 },  // grippy mat
    ];

    // Wet patch hazard in shower section
    const hazards = [
      {
        type:     'slick',
        position: new THREE.Vector3(-28, 0.1, -18),
        radius:   8,
        effect:   { tractionMultiplier: 0.55 },
      },
    ];

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
