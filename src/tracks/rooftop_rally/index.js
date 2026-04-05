import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// ROOFTOP RALLY  –  City Cup, Race 3
// High-altitude rooftop racing at golden hour. HVAC units as obstacles, water
// towers, plank bridges between buildings, city skyline silhouette in the BG.
// Warm amber lighting, wind particles.
// ---------------------------------------------------------------------------

export const track = {
  id: 'rooftop_rally',
  name: 'ROOFTOP RALLY',
  cup: 'city',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_city_03',

  skyConfig: {
    topColor:    0x1a2040,
    bottomColor: 0xff7c1e,
    fogColor:    0xc85a10,
    fogDensity:  0.008,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 9;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Loop spanning three rooftops at slightly different heights.
    // Narrow plank-bridge sections between buildings, sweeping turns.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Rooftop A (tallest – start/finish)
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 18,  0,   0),
        new THREE.Vector3( 34,  0,   5),
        new THREE.Vector3( 42,  0,  18),
        // Bridge crossing to Rooftop B (slight rise)
        new THREE.Vector3( 46,  0,  30),
        new THREE.Vector3( 44,  0,  42),
        // Rooftop B (mid height – longer)
        new THREE.Vector3( 38,  0,  52),
        new THREE.Vector3( 20,  0,  58),
        new THREE.Vector3(  0,  0,  58),
        new THREE.Vector3(-20,  0,  54),
        new THREE.Vector3(-38,  0,  46),
        // Bridge crossing to Rooftop C (slight dip then rise)
        new THREE.Vector3(-46,  0,  34),
        new THREE.Vector3(-48,  0,  20),
        // Rooftop C (lowest – tight end section)
        new THREE.Vector3(-46,  0,   8),
        new THREE.Vector3(-38,  0,  -5),
        new THREE.Vector3(-24,  0, -10),
        // Bridge return to Rooftop A
        new THREE.Vector3(-12,  0,  -8),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY + FOG (golden hour)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING (golden hour)
    TrackBuilder.createLighting(
      scene,
      0xff9944, 0.7,          // warm amber ambient
      0xffcc55, 2.2,          // strong low-angle sun
      [-60, 20, -30],         // sun from west-ish (low angle)
      true
    );

    // Subtle cool fill from above (sky reflection)
    const skyFill = new THREE.DirectionalLight(0x6688cc, 0.3);
    skyFill.position.set(0, 60, 0);
    scene.add(skyFill);

    // ------------------------------------------------------------------ GROUND PLANE
    // Rooftop gravel/tar surface base
    TrackBuilder.createGround(scene, 0x2a2a34, 300);

    // Rooftop A slab
    const roofAMat = toon('#383840');
    const roofA = new THREE.Mesh(new THREE.BoxGeometry(60, 1.0, 30), roofAMat);
    roofA.position.set(18, -0.5, -2);
    roofA.receiveShadow = true;
    scene.add(roofA);

    // Rooftop B slab
    const roofBMat = toon('#32323a');
    const roofB = new THREE.Mesh(new THREE.BoxGeometry(98, 1.0, 30), roofBMat);
    roofB.position.set(0, 1.5, 54);
    roofB.receiveShadow = true;
    scene.add(roofB);

    // Rooftop C slab
    const roofCMat = toon('#2e2e38');
    const roofC = new THREE.Mesh(new THREE.BoxGeometry(30, 1.0, 28), roofCMat);
    roofC.position.set(-40, -0.5, -2);
    roofC.receiveShadow = true;
    scene.add(roofC);

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#3a3a44'); // grey rooftop tarmac
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // White centre dashes (bright line)
    const dashMat = toon('#ffffff', { transparent: true, opacity: 0.6 });
    const dashGeo = TrackBuilder.buildRoad(curve, 0.45, SEGMENTS, 0.07);
    trackGroup.add(new THREE.Mesh(dashGeo, dashMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0x554433);
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

    // --- 1. HVAC UNITS (box obstacles, Rooftop A)
    const hvacData = [
      { pos: [ 12, 1.2,  -8], size: [5, 2.4, 4] },
      { pos: [ 28, 1.5,  -8], size: [6, 3.0, 3.5] },
      { pos: [ 36, 1.0,  10], size: [4, 2.0, 3] },
      { pos: [  5, 1.2,  10], size: [4.5, 2.4, 3.5] },
    ];
    hvacData.forEach(({ pos, size }) => {
      const hvac = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        mat(0x888888)
      );
      hvac.position.set(...pos);
      hvac.castShadow = true;
      scene.add(hvac);

      // Fan grill (flat torus-like cylinder on top)
      const grill = new THREE.Mesh(
        new THREE.CylinderGeometry(size[2] * 0.35, size[2] * 0.35, 0.25, 12),
        mat(0x666666)
      );
      grill.position.set(pos[0], pos[1] + size[1] / 2 + 0.12, pos[2]);
      scene.add(grill);

      // Exhaust pipe (small cylinder on side)
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8),
        mat(0x777777)
      );
      pipe.position.set(pos[0] + size[0] / 2 + 0.2, pos[1] + 0.3, pos[2]);
      pipe.rotation.z = Math.PI / 2;
      scene.add(pipe);
    });

    // --- 2. HVAC UNITS (Rooftop B)
    [
      { pos: [ 10, 3.2, 48], size: [5, 2.4, 4] },
      { pos: [-10, 3.0, 48], size: [4, 2.0, 3.5] },
      { pos: [ 25, 3.2, 62], size: [5.5, 2.4, 4] },
      { pos: [-25, 3.0, 62], size: [4, 2.2, 3] },
    ].forEach(({ pos, size }) => {
      const hvac = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        mat(0x7a7a82)
      );
      hvac.position.set(...pos);
      hvac.castShadow = true;
      scene.add(hvac);

      const grill = new THREE.Mesh(
        new THREE.CylinderGeometry(size[2] * 0.32, size[2] * 0.32, 0.22, 12),
        mat(0x606068)
      );
      grill.position.set(pos[0], pos[1] + size[1] / 2 + 0.11, pos[2]);
      scene.add(grill);
    });

    // --- 3. WATER TOWERS (cylinder + cone cap)
    const waterTowerData = [
      { pos: [ 50, 0, 22],  r: 3,   h: 8,   capColor: 0x8b5e3c },
      { pos: [-55, 0, 15],  r: 2.5, h: 7,   capColor: 0x7a5230 },
      { pos: [-10, 2, 70],  r: 2,   h: 6,   capColor: 0x6b4828 },
    ];
    waterTowerData.forEach(({ pos, r, h, capColor }) => {
      // Support legs (4 cylinders)
      const legMat = mat(0x885522);
      [[-r * 0.6, -r * 0.6], [r * 0.6, -r * 0.6], [-r * 0.6, r * 0.6], [r * 0.6, r * 0.6]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, h * 0.55, 6), legMat);
        leg.position.set(pos[0] + lx, pos[1] + h * 0.275, pos[2] + lz);
        leg.castShadow = true;
        scene.add(leg);
      });

      // Tank
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h * 0.65, 12),
        mat(0x7a5c3c)
      );
      tank.position.set(pos[0], pos[1] + h * 0.68, pos[2]);
      tank.castShadow = true;
      scene.add(tank);

      // Cone cap
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(r + 0.2, h * 0.25, 12),
        mat(capColor)
      );
      cap.position.set(pos[0], pos[1] + h * 0.68 + h * 0.43, pos[2]);
      scene.add(cap);
    });

    // --- 4. PLANK BRIDGES between buildings (narrow elevated sections)
    // Bridge A-to-B  (around x=44, z=30-42)
    for (let bi = 0; bi < 5; bi++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_WIDTH - 1.5, 0.22, 2.6),
        mat(0x8b6040)
      );
      plank.position.set(45.5, 1.3 + bi * 0.04, 31 + bi * 2.4);
      plank.castShadow = true;
      scene.add(plank);
    }

    // Rope / railing posts on bridge A-to-B
    for (let rp = 0; rp < 5; rp++) {
      [-4.5, 4.5].forEach(dx => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6),
          mat(0xaa8844)
        );
        post.position.set(45.5 + dx, 2.4, 31 + rp * 2.4);
        scene.add(post);
      });
    }

    // Bridge B-to-C  (around x=-46, z=20-34)
    for (let bi = 0; bi < 6; bi++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_WIDTH - 2, 0.22, 2.5),
        mat(0x7a5530)
      );
      plank.position.set(-47, 0.5 - bi * 0.04, 21 + bi * 2.4);
      plank.castShadow = true;
      scene.add(plank);
    }

    // --- 5. CITY SKYLINE SILHOUETTE (distant background buildings)
    const skylineColors = [0x0a1020, 0x0d1530, 0x0c1228];
    const skylineData = [
      [  90, 30, -80,  20, 60, 12],
      [ 110, 20, -80,  16, 40, 12],
      [  75, 18, -80,  14, 36, 12],
      [ 130, 25, -80,  18, 50, 12],
      [ -90, 28, -80,  20, 56, 12],
      [-110, 22, -80,  16, 44, 12],
      [ -70, 16, -80,  12, 32, 12],
      [-130, 30, -80,  22, 60, 12],
      [  50, 22, -80,  14, 44, 12],
      [ -50, 18, -80,  12, 36, 12],
    ];
    skylineData.forEach(([bx, by, bz, bw, bh, bd], i) => {
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bd),
        mat(skylineColors[i % skylineColors.length])
      );
      bldg.position.set(bx, by, bz);
      scene.add(bldg);

      // A few lit windows on skyline buildings
      if (Math.random() > 0.4) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(3, 3),
          toon('#ffee88', { emissive: new THREE.Color('#ffcc33'), emissiveIntensity: 0.7 })
        );
        win.position.set(bx, by + 5, bz + bd / 2 + 0.1);
        scene.add(win);
      }
    });

    // --- 6. ROOF EDGE PARAPET WALLS (low walls at rooftop edges)
    // Rooftop A front/back parapet
    [
      { pos: [ 18, 0.5, -17], size: [60, 1.2, 0.8] },
      { pos: [ 18, 0.5,  15], size: [60, 1.2, 0.8] },
      { pos: [-11, 0.5,   0], size: [0.8, 1.2, 28] },
      { pos: [ 47, 0.5,   0], size: [0.8, 1.2, 28] },
    ].forEach(({ pos, size }) => {
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        mat(0x444455)
      );
      parapet.position.set(...pos);
      scene.add(parapet);
    });

    // --- 7. SATELLITE DISH (sphere + cone on Rooftop C)
    const dishBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8),
      mat(0x888888)
    );
    dishBase.position.set(-42, 1.25, -5);
    scene.add(dishBase);

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(0x999999)
    );
    dish.position.set(-42, 3.5, -5);
    dish.rotation.x = -Math.PI / 3;
    dish.castShadow = true;
    scene.add(dish);

    // --- 8. GENERATOR / ELECTRICAL BOX (Rooftop C)
    const genBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 2.5, 2),
      mat(0x556644)
    );
    genBox.position.set(-35, 1.25, -12);
    genBox.castShadow = true;
    scene.add(genBox);

    // Warning stripe on generator
    const warnStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.5),
      toon('#ffcc00', { emissive: new THREE.Color('#554400'), emissiveIntensity: 0.5 })
    );
    warnStripe.position.set(-35, 1.5, -11.02);
    scene.add(warnStripe);

    // ------------------------------------------------------------------ WIND PARTICLES (warm golden dust)
    TrackBuilder.createParticles(scene, {
      count:  250,
      spread: 120,
      color:  '#ffcc77',
      size:   0.18,
      speed:  0.08,
    });

    // Cloud wisps (very large sparse particles high up)
    TrackBuilder.createParticles(scene, {
      count:  40,
      spread: 200,
      color:  '#ffddaa',
      size:   0.9,
      speed:  0.03,
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
        { type: 'rooftop', traction: 0.95, friction: 0.80 },
        { type: 'plank',   traction: 0.85, friction: 0.75 },
      ],
      hazards:  [],
      respawnY: -10,
    };
  },
};
