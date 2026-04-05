import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// GRAND LINE GALLEON  –  Pirate Cup, Race 1
// A racing circuit laid out across the deck of a massive pirate galleon sailing
// the Grand Line. Wooden plank surface, rope ramps, a plank bridge spanning
// the cannon deck, and a full deck loop. The entire ship tilts ±3° on a slow
// sine cycle (applied via the trackGroup). Props: barrels, rope coils, cannons,
// Jolly Roger flag, seagulls. Ocean water below. Stormy navy/brown palette.
// ---------------------------------------------------------------------------

export const track = {
  id: 'grand_line_galleon',
  name: 'GRAND LINE GALLEON',
  cup: 'pirate',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_pirate_01',

  skyConfig: {
    topColor:    0x0d1b2a,
    bottomColor: 0x1a3550,
    fogColor:    0x0d1b2a,
    fogDensity:  0.012,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 240;

    // ------------------------------------------------------------------ CURVE
    // Deck loop: bow to stern along port side, across poop deck, down
    // starboard, over a rope ramp at the bow, across a plank bridge mid-ship.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  60),
        new THREE.Vector3( 24,  0,  52),
        new THREE.Vector3( 44,  0,  32),
        new THREE.Vector3( 56,  0,   6),
        new THREE.Vector3( 54,  0, -20),
        new THREE.Vector3( 40,  0, -42),
        new THREE.Vector3( 18,  0, -56),
        new THREE.Vector3( -8,  0, -58),
        new THREE.Vector3(-30,  0, -50),
        new THREE.Vector3(-48,  0, -32),
        new THREE.Vector3(-56,  0,  -6),
        new THREE.Vector3(-50,  0,  20),
        new THREE.Vector3(-34,  0,  42),
        new THREE.Vector3(-14,  0,  54),
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
    // Stormy diffuse – low directional from port bow
    TrackBuilder.createLighting(
      scene,
      0x223355, 0.7,
      0x8899bb, 1.0,
      [-30, 60, -20],
      true
    );
    // Lantern warm glow at the mast
    const mastLight = new THREE.PointLight(0xffaa44, 1.2, 70);
    mastLight.position.set(0, 22, 0);
    scene.add(mastLight);
    // Stern cabin porthole light
    const sternLight = new THREE.PointLight(0xff8833, 0.8, 35);
    sternLight.position.set(0, 8, 62);
    scene.add(sternLight);
    // Lightning flash – faint blue fill
    const lightningFill = new THREE.AmbientLight(0x334466, 0.2);
    scene.add(lightningFill);

    // ------------------------------------------------------------------ BASE GROUND (deep ocean floor – kept invisible below waterline)
    TrackBuilder.createGround(scene, 0x050e1a);

    // ------------------------------------------------------------------ OCEAN WATER (ground plane)
    const waterGeo = new THREE.PlaneGeometry(400, 400, 1, 1);
    const waterMat = toon('#0a2a4a', { transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -18;
    scene.add(water);
    // Second water layer for depth shimmer
    const waterDeep = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      toon('#051525')
    );
    waterDeep.rotation.x = -Math.PI / 2;
    waterDeep.position.y = -22;
    scene.add(waterDeep);

    // Wave crests (long thin boxes floating slightly above water)
    const waveMat = toon('#1a4a6a', { transparent: true, opacity: 0.5 });
    for (let w = 0; w < 12; w++) {
      const wave = new THREE.Mesh(new THREE.BoxGeometry(80 + Math.random() * 60, 0.4, 1.5 + Math.random()), waveMat);
      wave.position.set(
        (Math.random() - 0.5) * 200,
        -17.5,
        (Math.random() - 0.5) * 200
      );
      wave.rotation.y = Math.random() * Math.PI;
      scene.add(wave);
    }

    // ------------------------------------------------------------------ SHIP HULL
    const hullMat   = toon('#3a1f0a');
    const plankMat  = toon('#6b3d15');
    const darkPlank = toon('#4a2a0a');

    // Hull sides (port/starboard) – tall dark brown boxes
    const hullPort = new THREE.Mesh(new THREE.BoxGeometry(8, 22, 140), hullMat);
    hullPort.position.set(-30, -8, 0);
    scene.add(hullPort);
    const hullStarboard = new THREE.Mesh(new THREE.BoxGeometry(8, 22, 140), hullMat);
    hullStarboard.position.set(30, -8, 0);
    scene.add(hullStarboard);
    // Hull bow curve (wedge)
    const bowMat = toon('#2e1608');
    const bowBox = new THREE.Mesh(new THREE.BoxGeometry(55, 22, 20), bowMat);
    bowBox.position.set(0, -8, -60);
    bowBox.rotation.y = 0;
    scene.add(bowBox);
    // Keel bottom
    const keel = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 140), hullMat);
    keel.position.set(0, -18, 0);
    scene.add(keel);

    // Main deck surface (wooden planks – series of flat boxes)
    for (let pz = -65; pz < 70; pz += 3) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(56, 0.5, 2.6), plankMat);
      plank.position.set(0, 2.5, pz);
      plank.receiveShadow = true;
      scene.add(plank);
      // Alternate dark seam
      const seam = new THREE.Mesh(new THREE.BoxGeometry(56, 0.15, 0.25), darkPlank);
      seam.position.set(0, 2.65, pz + 1.5);
      scene.add(seam);
    }

    // Poop deck (elevated stern platform)
    const poopDeck = new THREE.Mesh(new THREE.BoxGeometry(50, 1, 30), plankMat);
    poopDeck.position.set(0, 4.5, 53);
    poopDeck.receiveShadow = true;
    scene.add(poopDeck);
    // Poop deck railing
    const railMat = toon('#8b5e2a');
    [[0, 6.5, 68], [0, 6.5, 38]].forEach(pos => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(52, 1, 0.6), railMat);
      rail.position.set(...pos);
      scene.add(rail);
    });
    [[-25, 6.5, 53], [25, 6.5, 53]].forEach(pos => {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 32), railMat);
      sideRail.position.set(...pos);
      scene.add(sideRail);
    });

    // Crow's nest / main mast
    const mastMat = toon('#5c3310');
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 40, 10), mastMat);
    mast.position.set(0, 22, -10);
    mast.castShadow = true;
    scene.add(mast);
    const crow = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3, 2.5, 10), toon('#7a4820'));
    crow.position.set(0, 41, -10);
    scene.add(crow);
    // Yardarms
    const yard1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 34, 8), mastMat);
    yard1.position.set(0, 28, -10);
    yard1.rotation.z = Math.PI / 2;
    scene.add(yard1);
    const yard2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 24, 8), mastMat);
    yard2.position.set(0, 36, -10);
    yard2.rotation.z = Math.PI / 2;
    scene.add(yard2);

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.07);
    const roadMat  = toon('#7d4e1a');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre stripe (rope-yellow dash)
    const centreGeo  = TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.1);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#ddaa44', { transparent: true, opacity: 0.65 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.4, 0x5c3310);
    trackGroup.add(walls.visual);

    // ------------------------------------------------------------------ COLLISION
    const collisionGeo  = roadGeo.clone();
    const collisionMesh = new THREE.Mesh(
      collisionGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(collisionMesh);
    const wallMesh = walls.collision;
    trackGroup.add(wallMesh);

    // ================================================================== PROPS
    const mat = (hex, emissive = 0x000000, transparent = false, opacity = 1) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); }
      if (transparent) { m.transparent = true; m.opacity = opacity; }
      return m;
    };

    // --- 1. Barrels (8 across deck)
    const barrelPositions = [
      [-20, 3, 10], [-20, 3, 20], [ 20, 3, 15], [ 20, 3, -5],
      [-16, 3, -30], [ 16, 3, -35], [ -8, 3, -50], [  8, 3, -50],
    ];
    barrelPositions.forEach(([bx, by, bz]) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 3, 12), mat(0x6b3d15));
      barrel.position.set(bx, by, bz);
      barrel.castShadow = true;
      scene.add(barrel);
      // Barrel hoop (torus)
      [0, 1].forEach(ring => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.12, 6, 18), mat(0x2a2a2a));
        hoop.position.set(bx, by - 0.7 + ring * 1.4, bz);
        hoop.rotation.x = Math.PI / 2;
        scene.add(hoop);
      });
    });

    // --- 2. Rope coils (5 coils scattered on deck)
    const ropeCoilPositions = [
      [-14, 3, 40], [14, 3, 38], [-10, 3, 0], [10, 3, -25], [0, 3, -40],
    ];
    ropeCoilPositions.forEach(([rx, ry, rz]) => {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(2.0, 0.45, 6, 20),
        mat(0xd4a55a)
      );
      coil.position.set(rx, ry, rz);
      coil.rotation.x = Math.PI / 2;
      coil.castShadow = true;
      scene.add(coil);
      // Inner coil
      const inner = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.3, 6, 16),
        mat(0xbb8f48)
      );
      inner.position.set(rx, ry, rz);
      inner.rotation.x = Math.PI / 2;
      scene.add(inner);
    });

    // --- 3. Cannons (4 on each side, pointing out through gun ports)
    const cannonMat  = mat(0x222222);
    const wheelMat   = mat(0x5c3310);
    [[-27, 3.5, -35], [-27, 3.5, -10], [-27, 3.5, 15], [-27, 3.5, 38],
     [ 27, 3.5, -35], [ 27, 3.5, -10], [ 27, 3.5, 15], [ 27, 3.5, 38]
    ].forEach(([cx, cy, cz], i) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 5, 10), cannonMat);
      barrel.position.set(cx, cy, cz);
      barrel.rotation.z = (i < 4) ? Math.PI / 2 : -Math.PI / 2;
      barrel.castShadow = true;
      scene.add(barrel);
      // Carriage wheels
      [-1, 1].forEach(side => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12), wheelMat);
        wheel.position.set(cx + side * 0.8, cy - 1.0, cz);
        wheel.rotation.x = Math.PI / 2;
        scene.add(wheel);
      });
      // Cannon ball stack
      [0, 1, 2].forEach(b => {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), cannonMat);
        ball.position.set(cx, cy - 0.9, cz + 1.8 + (b % 2) * 1.1);
        scene.add(ball);
      });
    });

    // --- 4. Jolly Roger flag
    const flagPoleMat = mat(0x4a2808);
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 12, 8), flagPoleMat);
    flagPole.position.set(-4, 44, -10);
    scene.add(flagPole);
    // Flag cloth (black)
    const flagCloth = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.18), mat(0x0a0a0a));
    flagCloth.position.set(0, 48, -10);
    scene.add(flagCloth);
    // Skull (sphere)
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), mat(0xeeeeee));
    skull.position.set(0, 48.5, -9.9);
    scene.add(skull);
    // Crossbones (two thin cylinders)
    [[-1.4, 0.5], [1.4, -0.5]].forEach(([ox, rz]) => {
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 3.5, 6), mat(0xeeeeee));
      bone.position.set(ox, 46.5, -9.9);
      bone.rotation.z = rz;
      scene.add(bone);
    });

    // --- 5. Seagulls (V-shapes made of thin boxes, scattered at height)
    const seagullMat = mat(0xdddddd);
    [
      [10, 30, -30], [-25, 28, -15], [30, 35, 10], [0, 32, -55], [-15, 26, 45],
    ].forEach(([gx, gy, gz]) => {
      // Left wing
      const lwing = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 0.8), seagullMat);
      lwing.position.set(gx - 1.5, gy, gz);
      lwing.rotation.z = 0.35;
      scene.add(lwing);
      // Right wing
      const rwing = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 0.8), seagullMat);
      rwing.position.set(gx + 1.5, gy, gz);
      rwing.rotation.z = -0.35;
      scene.add(rwing);
      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 5), seagullMat);
      body.position.set(gx, gy, gz);
      scene.add(body);
    });

    // --- 6. Ship's wheel (torus + spokes)
    const wheelRimMat = mat(0x7a4820);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.35, 8, 24), wheelRimMat);
    rim.position.set(0, 8, 62);
    rim.rotation.x = Math.PI / 8;
    scene.add(rim);
    for (let sp = 0; sp < 8; sp++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7, 6), wheelRimMat);
      const angle = (sp / 8) * Math.PI * 2;
      spoke.position.set(
        Math.cos(angle) * 1.75,
        8 + Math.sin(angle) * 1.75,
        62
      );
      spoke.rotation.z = angle;
      scene.add(spoke);
    }
    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.8, 10), wheelRimMat);
    hubCap.position.set(0, 8, 62.4);
    hubCap.rotation.x = Math.PI / 2;
    scene.add(hubCap);

    // --- 7. Anchor chain (series of torus links)
    const chainMat = mat(0x333333);
    for (let l = 0; l < 10; l++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 6, 10), chainMat);
      link.position.set(-28, 2 - l * 1.1, -58 + l * 0.4);
      link.rotation.z = l % 2 === 0 ? 0 : Math.PI / 2;
      scene.add(link);
    }

    // --- 8. Treasure chest (box stack near stern)
    const chestBody = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 3.5), mat(0x7a4820));
    chestBody.position.set(8, 4.2, 56);
    chestBody.castShadow = true;
    scene.add(chestBody);
    const chestLid = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 3.5), mat(0x6b3d15));
    chestLid.position.set(8, 6.2, 56);
    scene.add(chestLid);
    // Gold trim
    const chestTrim = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.35, 3.6), mat(0xffd700));
    chestTrim.position.set(8, 4.9, 56);
    scene.add(chestTrim);
    // Lock
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.4), mat(0xffd700));
    lock.position.set(8, 5.2, 57.9);
    scene.add(lock);

    // --- 9. Lanterns hanging from yardarm
    const lanternMat   = mat(0xffaa44, 0xff6600);
    const lanternHookMat = mat(0x333333);
    [[-10, 0], [10, 0]].forEach(([lx]) => {
      const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.8, 8), lanternMat);
      lanternBody.position.set(lx, 25.5, -10);
      scene.add(lanternBody);
      const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 6), lanternHookMat);
      hook.position.set(lx, 27, -10);
      scene.add(hook);
      const glow = new THREE.PointLight(0xffaa33, 0.6, 18);
      glow.position.set(lx, 25.5, -10);
      scene.add(glow);
    });

    // --- 10. Sails (large transparent planes)
    const sailMat = toon('#eeddbb', { transparent: true, opacity: 0.85 });
    const mainSail = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 0.25), sailMat);
    mainSail.position.set(0, 28, -10);
    scene.add(mainSail);
    const topSail = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 0.25), sailMat);
    topSail.position.set(0, 36, -10);
    scene.add(topSail);

    // ------------------------------------------------------------------ STORM CLOUDS
    const cloudMat = toon('#1a2233', { transparent: true, opacity: 0.7 });
    [
      [60, 55, -80], [-70, 50, -60], [30, 60, 80], [-40, 58, 70], [0, 65, -100],
    ].forEach(([cx, cy, cz]) => {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(18 + Math.random() * 12, 8, 6),
        cloudMat
      );
      cloud.position.set(cx, cy, cz);
      cloud.scale.set(1 + Math.random() * 0.5, 0.4 + Math.random() * 0.3, 1 + Math.random() * 0.5);
      scene.add(cloud);
    });

    // ------------------------------------------------------------------ PARTICLES
    // Sea spray
    TrackBuilder.createParticles(scene, {
      count:  120,
      spread: 60,
      color:  '#aaccdd',
      size:   0.2,
      speed:  0.06,
    });
    // Dark storm debris
    TrackBuilder.createParticles(scene, {
      count:  60,
      spread: 80,
      color:  '#334455',
      size:   0.3,
      speed:  0.04,
    });

    // ------------------------------------------------------------------ DECK TILT ANIMATION (stored on group)
    // Consumers can call trackGroup.userData.updateTilt(time) each frame.
    trackGroup.userData.updateTilt = (time) => {
      const tilt = Math.sin(time * 0.4) * (3 * Math.PI / 180);
      trackGroup.rotation.z = tilt;
    };

    // ------------------------------------------------------------------ NAVIGATION
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
      surfaceZones: [],
      hazards: [],
      respawnY: -10,
    };
  },
};
