import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// SPACE STATION INTERIOR  –  Space Cup, Race 3
// Racing through the corridors, engine rooms, and observation dome of a massive
// orbital station. Chrome-white panels, red warning lights, engine turbines,
// and debris particles floating through zero-g sections.
// ---------------------------------------------------------------------------

export const track = {
  id: 'space_station_interior',
  name: 'SPACE STATION INTERIOR',
  cup: 'space',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_space_03',

  skyConfig: {
    topColor:    0x080c14,
    bottomColor: 0x101828,
    fogColor:    0x0a1020,
    fogDensity:  0.018,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 260;

    // ------------------------------------------------------------------ CURVE
    // Layout: tight interior circuit — long corridor straights, tight bends
    // through engine rooms, a sweeping loop under the observation dome,
    // and a chicane through the reactor core section.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  52),   // main corridor start
        new THREE.Vector3( 20,  0,  48),
        new THREE.Vector3( 40,  0,  35),   // turn into east wing
        new THREE.Vector3( 52,  0,  14),
        new THREE.Vector3( 52,  0,  -8),   // engine room straight
        new THREE.Vector3( 46,  0, -28),
        new THREE.Vector3( 34,  0, -44),   // elevated walkway (flattened)
        new THREE.Vector3( 14,  0, -54),
        new THREE.Vector3( -8,  0, -52),   // observation dome rear
        new THREE.Vector3(-28,  0, -42),
        new THREE.Vector3(-50,  0, -22),   // west corridor
        new THREE.Vector3(-55,  0,   0),
        new THREE.Vector3(-50,  0,  20),   // chicane left
        new THREE.Vector3(-38,  0,  36),
        new THREE.Vector3(-20,  0,  48),
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
    // Cool white station lighting
    TrackBuilder.createLighting(
      scene,
      0x223344, 0.65,
      0xe8f0ff, 1.2,
      [10, 60, 20],
      true
    );
    // Engine room red glow
    const engineGlow = new THREE.PointLight(0xff2200, 0.6, 50);
    engineGlow.position.set(52, 8, -18);
    scene.add(engineGlow);
    // Reactor core blue glow
    const reactorGlow = new THREE.PointLight(0x0088ff, 0.8, 55);
    reactorGlow.position.set(-48, 10, 0);
    scene.add(reactorGlow);
    // Observation dome soft light
    const domeLight = new THREE.PointLight(0x6699ff, 0.5, 45);
    domeLight.position.set(0, 12, -52);
    scene.add(domeLight);

    // ------------------------------------------------------------------ FLOOR (station deck)
    const deckMat = toon('#2a3040');
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), deckMat);
    deck.rotation.x = -Math.PI / 2;
    deck.position.y = -0.15;
    deck.receiveShadow = true;
    scene.add(deck);

    // Floor panel grid lines
    const panelLineMat = toon('#1a2030');
    for (let gx = -95; gx <= 95; gx += 10) {
      const lineV = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 200), panelLineMat);
      lineV.rotation.x = -Math.PI / 2;
      lineV.position.set(gx, -0.14, 0);
      scene.add(lineV);
    }
    for (let gz = -95; gz <= 95; gz += 10) {
      const lineH = new THREE.Mesh(new THREE.PlaneGeometry(200, 0.3), panelLineMat);
      lineH.rotation.x = -Math.PI / 2;
      lineH.position.set(0, -0.14, gz);
      scene.add(lineH);
    }

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#3a4555');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Racing line (emissive blue stripe)
    trackGroup.add(new THREE.Mesh(
      TrackBuilder.buildRoad(curve, 0.7, SEGMENTS, 0.09),
      toon('#0088ff', { emissive: new THREE.Color('#004499'), emissiveIntensity: 0.8, transparent: true, opacity: 0.7 })
    ));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 2.5, 0xd0d8e4);
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

    // --- 1. WALL PANEL SECTIONS (chrome/white rectangular panels lining corridors)
    const corridorPanelPositions = [
      // East corridor
      { x:  56, z:  22, ry: Math.PI / 2,  rows: 3 },
      { x:  56, z:   5, ry: Math.PI / 2,  rows: 3 },
      { x:  56, z: -12, ry: Math.PI / 2,  rows: 3 },
      // West corridor
      { x: -58, z:  12, ry: -Math.PI / 2, rows: 3 },
      { x: -58, z:  -8, ry: -Math.PI / 2, rows: 3 },
      // North corridor
      { x:  10, z:  56, ry: 0, rows: 3 },
      { x: -12, z:  56, ry: 0, rows: 3 },
    ];
    corridorPanelPositions.forEach(({ x, z, ry, rows }) => {
      for (let row = 0; row < rows; row++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(10, 3, 0.4),
          mat(0xdde4ee, 0x223355, 0.04)
        );
        panel.position.set(x, 1.5 + row * 3.2, z);
        panel.rotation.y = ry;
        scene.add(panel);
        // Inset detail strip
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(9, 0.5, 0.3),
          mat(0x9aafcc, 0x334466, 0.1)
        );
        strip.position.set(x, 1.5 + row * 3.2, z);
        strip.rotation.y = ry;
        scene.add(strip);
      }
    });

    // --- 2. WARNING LIGHTS (red emissive blinking units along walls)
    const warnPositions = [
      [ 50, 4,  10], [ 50, 4, -20], [-52, 4,  10], [-52, 4, -10],
      [ 14, 4,  54], [-14, 4,  54], [ 30, 4, -50], [-25, 4, -48],
    ];
    warnPositions.forEach(([wx, wy, wz]) => {
      // Housing box
      const housing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1), mat(0x333333));
      housing.position.set(wx, wy, wz);
      scene.add(housing);
      // Light lens (emissive red sphere)
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), mat(0xff2200, 0xff0000, 2.5));
      lens.position.set(wx, wy, wz + 0.6);
      scene.add(lens);
      // Projected red glow
      const wl = new THREE.PointLight(0xff1100, 0.6, 12);
      wl.position.set(wx, wy, wz);
      scene.add(wl);
    });

    // --- 3. ENGINE ROOM (large cylinders – east section turbines)
    const enginePositions = [
      { x: 60, z:  -5 }, { x: 60, z: -20 }, { x: 60, z: -35 },
      { x: 75, z:  -5 }, { x: 75, z: -20 }, { x: 75, z: -35 },
    ];
    enginePositions.forEach(({ x, z }) => {
      // Main turbine cylinder (tall)
      const turbine = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 18, 16),
        mat(0x556677, 0x112233, 0.08)
      );
      turbine.position.set(x, 9, z);
      turbine.castShadow = true;
      scene.add(turbine);
      // Rotating ring band
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 0.5, 8, 24),
        mat(0x889aaa, 0x334455, 0.1)
      );
      band.position.set(x, 9, z);
      band.rotation.x = Math.PI / 2;
      scene.add(band);
      // Exhaust nozzle (cone at bottom)
      const nozzle = new THREE.Mesh(
        new THREE.ConeGeometry(3.5, 5, 12, 1, true),
        mat(0x445566)
      );
      nozzle.position.set(x, 0.5, z);
      scene.add(nozzle);
      // Thruster glow (orange/yellow)
      const thrustGlow = new THREE.Mesh(
        new THREE.ConeGeometry(2, 4, 8),
        mat(0xff8800, 0xff6600, 2.5)
      );
      thrustGlow.position.set(x, -2, z);
      scene.add(thrustGlow);
      scene.add(new THREE.PointLight(0xff5500, 0.4, 10)).position.set(x, -1, z);
      // Intake vent cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 1, 16), mat(0x778899));
      cap.position.set(x, 18.5, z);
      scene.add(cap);
    });

    // Engine room ceiling structure
    const engCeiling = new THREE.Mesh(new THREE.BoxGeometry(35, 1, 50), mat(0x334455, 0x111122, 0.05));
    engCeiling.position.set(68, 20, -18);
    scene.add(engCeiling);

    // --- 4. OBSERVATION DOME (large glass-like dome, south section)
    const domeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(28, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      toon('#88aadd', { transparent: true, opacity: 0.25 })
    );
    domeSphere.position.set(0, 0, -52);
    scene.add(domeSphere);
    // Dome frame rings
    [8, 16, 22].forEach(h => {
      const r = Math.sqrt(28 * 28 - h * h);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.5, 6, 32),
        mat(0x889aaa)
      );
      ring.position.set(0, h, -52);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    });
    // Dome base ring
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 1.5, 32), mat(0x556677));
    domeBase.position.set(0, 0.75, -52);
    scene.add(domeBase);
    // Stars visible through dome (positioned outside)
    const domeStarGeo = new THREE.BufferGeometry();
    const domeStarPos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 60 + Math.random() * 5;
      domeStarPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      domeStarPos[i * 3 + 1] = r * Math.abs(Math.cos(phi));
      domeStarPos[i * 3 + 2] = -52 + r * Math.sin(phi) * Math.sin(theta);
    }
    domeStarGeo.setAttribute('position', new THREE.BufferAttribute(domeStarPos, 3));
    scene.add(new THREE.Points(domeStarGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.4 })));

    // --- 5. REACTOR CORE (west section – glowing cylinder with rings)
    const reactorCore = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 25, 20),
      mat(0x002244, 0x0044cc, 1.2)
    );
    reactorCore.position.set(-68, 12, 0);
    reactorCore.castShadow = true;
    scene.add(reactorCore);
    // Containment rings
    [4, 8, 12, 16, 20].forEach(h => {
      const cRing = new THREE.Mesh(
        new THREE.TorusGeometry(5.5, 0.8, 8, 24),
        mat(0x0066ff, 0x0044cc, 1.0)
      );
      cRing.position.set(-68, h, 0);
      cRing.rotation.x = Math.PI / 2;
      scene.add(cRing);
    });
    scene.add(new THREE.PointLight(0x0044ff, 1.2, 40)).position.set(-68, 12, 0);
    // Reactor cooling pipes
    [[-60, 6], [-60, -6], [-76, 6], [-76, -6]].forEach(([px, pz]) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), mat(0x445566));
      pipe.position.set(px, 10, pz);
      scene.add(pipe);
    });

    // --- 6. CORRIDOR CEILING SUPPORTS (arched beams spanning width)
    [50, 30, 10, -10, -30, -50].forEach(z => {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(8, 0.7, 6, 20, Math.PI), mat(0x667788));
      arch.position.set(0, 12, z);
      arch.rotation.z = Math.PI;
      arch.rotation.y = Math.PI / 2;
      scene.add(arch);
    });

    // --- 7. CONTROL PANELS (along corridor walls – box with emissive screens)
    [
      { x:  18, z:  52, ry: Math.PI },
      { x: -18, z:  52, ry: Math.PI },
      { x:  52, z:  25, ry: Math.PI / 2 },
      { x: -52, z: -15, ry: -Math.PI / 2 },
    ].forEach(({ x, z, ry }) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.8), mat(0x223344, 0x113355, 0.1));
      panel.position.set(x, 2, z);
      panel.rotation.y = ry;
      scene.add(panel);
      // Screen display (emissive green)
      const screen = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.8, 0.1), mat(0x001100, 0x00aa22, 1.5));
      screen.position.set(x, 2, z);
      screen.rotation.y = ry;
      scene.add(screen);
      // Button row (tiny emissive boxes)
      [-1, 0, 1].forEach(bx => {
        const btn = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.3),
          mat(bx < 0 ? 0xff2200 : bx === 0 ? 0xffaa00 : 0x00cc44, bx < 0 ? 0xff0000 : bx === 0 ? 0xff8800 : 0x00ff44, 1.5));
        btn.position.set(x + bx * 0.8, 0.4, z);
        btn.rotation.y = ry;
        scene.add(btn);
      });
    });

    // --- 8. FLOATING STRUCTURAL BEAMS (crossing overhead)
    [
      { x:  20, y: 14, z: 20, len: 20, axis: 'x' },
      { x: -10, y: 16, z: -30, len: 24, axis: 'z' },
      { x:  40, y: 15, z: -40, len: 18, axis: 'x' },
    ].forEach(({ x, y, z, len, axis }) => {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(axis === 'x' ? len : 1.5, 1.5, axis === 'z' ? len : 1.5),
        mat(0x889aaa)
      );
      beam.position.set(x, y, z);
      scene.add(beam);
    });

    // --- 9. AIRLOCK DOOR FRAMES (transition markers)
    [{ x: 0, z: 35 }, { x: 35, z: 0 }, { x: 0, z: -35 }, { x: -35, z: 0 }].forEach(({ x, z }) => {
      // Door frame (U-shape: two vertical + one horizontal box)
      const frameColor = mat(0x8899aa);
      const leftPost  = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), frameColor);
      const rightPost = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), frameColor);
      const topBeam   = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 1), frameColor);
      leftPost.position.set(x - 5.5, 4, z);
      rightPost.position.set(x + 5.5, 4, z);
      topBeam.position.set(x, 8, z);
      scene.add(leftPost, rightPost, topBeam);
      // Warning stripe (yellow-black)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 0.8), mat(0xffcc00));
      stripe.position.set(x, 0.5, z);
      scene.add(stripe);
    });

    // ------------------------------------------------------------------ PARTICLES  (floating debris)
    TrackBuilder.createParticles(scene, {
      count:  120,
      spread:  70,
      color:   '#8899bb',
      size:    0.25,
      speed:   0.02,
    });
    // Micro-debris (fine)
    TrackBuilder.createParticles(scene, {
      count:   60,
      spread:  40,
      color:   '#ccddee',
      size:    0.10,
      speed:   0.01,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'deck',        traction: 1.0,  friction: 0.92 },
      { type: 'engine_grate', traction: 0.85, friction: 0.80 },
    ];

    const hazards = [
      {
        type:     'steam_vent',
        position: new THREE.Vector3(52, 0.5, -18),
        radius:   6,
        effect:   { pushForce: new THREE.Vector3(0, 3, 0) },
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
      surfaceZones: [],
      hazards: [],
      respawnY: -10,
    };
  },
};
