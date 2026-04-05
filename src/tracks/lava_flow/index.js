import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// LAVA FLOW  –  Volcano Cup, Race 1
// An active volcano track. Dark obsidian road winds past lava rivers, towering
// obsidian spires and charred dead trees under a deep volcanic sunset sky.
// Ember particles drift upward; a lava-tube tunnel punches through the crater rim.
// ---------------------------------------------------------------------------

export const track = {
  id: 'lava_flow',
  name: 'LAVA FLOW',
  cup: 'volcano',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_volcano_01',

  skyConfig: {
    topColor:    0x1a0500,
    bottomColor: 0x8b1a00,
    fogColor:    0x5a0e00,
    fogDensity:  0.012,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Winding volcano track with crater-rim chicane, tunnel approach and lava
    // flow crossing section. Slight elevation gives the crater feel.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  50),
        new THREE.Vector3( 26,  0,  42),
        new THREE.Vector3( 44,  0,  24),
        new THREE.Vector3( 50,  0,   0),
        new THREE.Vector3( 44,  0, -22),
        new THREE.Vector3( 26,  0, -40),
        new THREE.Vector3(  0,  0, -48),
        new THREE.Vector3(-26,  0, -40),
        new THREE.Vector3(-44,  0, -22),
        new THREE.Vector3(-50,  0,   0),
        new THREE.Vector3(-44,  0,  24),
        new THREE.Vector3(-26,  0,  42),
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
      0xff4400, 0.45,          // amber ambient
      0xff6600, 1.3,           // directional – low volcanic sun
      [-30, 25, 10],
      true
    );
    // Lava glow point lights scattered around the scene
    const lavaGlowPositions = [
      [ 10, 1, -5], [-15, 1, 15], [ 25, 1, -28],
      [-28, 1,  5], [  0, 1, 35],
    ];
    lavaGlowPositions.forEach(([lx, ly, lz]) => {
      const glow = new THREE.PointLight(0xff5500, 1.2, 35);
      glow.position.set(lx, ly, lz);
      scene.add(glow);
    });

    // ------------------------------------------------------------------ GROUND (volcanic rock)
    const groundMat = toon('#1a1a1a');
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.15;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // ------------------------------------------------------------------ LAVA PLANE (glowing orange layer below)
    const lavaMat = toon('#ff3300', { emissive: new THREE.Color('#cc2200') });
    const lavaGeo  = new THREE.PlaneGeometry(180, 180, 40, 40);
    // Slightly rippled via vertex displacement
    const lavaVerts = lavaGeo.attributes.position;
    for (let i = 0; i < lavaVerts.count; i++) {
      lavaVerts.setY(i, (Math.random() - 0.5) * 0.4);
    }
    lavaGeo.computeVertexNormals();
    const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
    lavaMesh.rotation.x = -Math.PI / 2;
    lavaMesh.position.y = -2.5;
    scene.add(lavaMesh);

    // ------------------------------------------------------------------ ROAD (dark obsidian)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#1c1c1c');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Orange centre warning stripe
    const centreGeo = TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.09);
    const centreMat = toon('#ff6600', { emissive: new THREE.Color('#441100'), transparent: true, opacity: 0.8 });
    trackGroup.add(new THREE.Mesh(centreGeo, centreMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0x2a1a08);
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

    // --- 1. Obsidian spires (tall shiny black cones)
    const spirePositions = [
      [ 48, 0,  10], [ 50, 0, -5],  [ 45, 0, -22],
      [-48, 0,  12], [-50, 0, -8],  [ 15, 0, -50],
      [-15, 0,  52], [ 30, 0,  50],
    ];
    spirePositions.forEach(([sx, sy, sz], i) => {
      const height = 8 + (i % 3) * 5;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.2 + (i % 2) * 0.6, height, 5),
        mat(0x0d0d12, 0x111122)
      );
      spire.position.set(sx, sy + height / 2, sz);
      spire.rotation.y = i * 0.7;
      spire.castShadow = true;
      scene.add(spire);
      // Smaller cluster spires
      const cluster = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, height * 0.6, 5),
        mat(0x111116, 0x0a0a18)
      );
      cluster.position.set(sx + 2, sy + (height * 0.6) / 2, sz + 1.5);
      scene.add(cluster);
    });

    // --- 2. Dead / charred trees (cylinders + thin branch boxes)
    const treePositions = [
      [-25, 0,  42], [ 25, 0,  48], [-45, 0,  30],
      [ 48, 0,  30], [-48, 0, -30], [ 48, 0, -30],
    ];
    treePositions.forEach(([tx, ty, tz], i) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 10, 8),
        mat(0x1a1008)
      );
      trunk.position.set(tx, ty + 5, tz);
      trunk.castShadow = true;
      scene.add(trunk);
      // Gnarled branches
      const branchAngles = [0.6, -0.5, 0.8];
      branchAngles.forEach((angle, b) => {
        const branch = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.25, 4, 6),
          mat(0x1a1008)
        );
        branch.position.set(tx + Math.cos(b * 2.1) * 2, ty + 8 + b * 0.5, tz + Math.sin(b * 2.1) * 2);
        branch.rotation.z = angle;
        branch.rotation.y = b * 1.2;
        scene.add(branch);
      });
    });

    // --- 3. Lava tube tunnel (arch formed from a series of ring segments)
    // Tunnel sits around t≈0.5 on the curve (left-side crater approach)
    const tunnelLength = 20;
    const tunnelGrp = new THREE.Group();
    scene.add(tunnelGrp);
    for (let ri = 0; ri <= 8; ri++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(7.5, 1.2, 8, 16),
        mat(0x1a1008, 0x220800)
      );
      ring.position.set(-34 + ri * (tunnelLength / 8), 5, -18 + ri * 0.5);
      ring.rotation.y = Math.PI / 2;
      ring.castShadow = true;
      tunnelGrp.add(ring);
    }
    // Tunnel ceiling fill
    const tunnelCeilMat = mat(0x111108, 0x110400);
    const tunnelCeil = new THREE.Mesh(
      new THREE.BoxGeometry(tunnelLength + 2, 1, 16),
      tunnelCeilMat
    );
    tunnelCeil.position.set(-24, 12, -15);
    scene.add(tunnelCeil);

    // Lava glow inside tunnel
    const tunnelGlow = new THREE.PointLight(0xff4400, 0.9, 20);
    tunnelGlow.position.set(-28, 4, -16);
    scene.add(tunnelGlow);

    // --- 4. Lava river crossing (glowing flat box sections near start)
    const lavaRiverMat = mat(0xff4400, 0xcc2200);
    for (let lr = 0; lr < 3; lr++) {
      const river = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.3, 40),
        lavaRiverMat
      );
      river.position.set(-5 + lr * 6, -0.05, 0);
      river.rotation.y = 0.15;
      scene.add(river);
    }

    // --- 5. Volcanic boulders (sphere clusters)
    const boulderData = [
      [ 30, 0, -45], [-30, 0, -45], [ 52, 0, -38],
      [-52, 0,  20], [ 52, 0,  20], [  0, 0, -55],
    ];
    boulderData.forEach(([bx, by, bz], i) => {
      const r = 2 + (i % 3);
      const boulder = new THREE.Mesh(
        new THREE.SphereGeometry(r, 7, 7),
        mat(0x1a1008)
      );
      boulder.position.set(bx, by + r, bz);
      boulder.castShadow = true;
      scene.add(boulder);
      // Small satellite boulder
      const small = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.55, 6, 6),
        mat(0x151005)
      );
      small.position.set(bx + r * 1.2, by + r * 0.55, bz + r * 0.8);
      scene.add(small);
    });

    // --- 6. Sulphur vents (small cones with emissive yellow)
    const ventPositions = [
      [ 18, 0,  28], [-18, 0, -28], [ 38, 0, -40], [-38, 0,  40],
    ];
    ventPositions.forEach(([vx, vy, vz]) => {
      const vent = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 3, 8, 1, true),
        mat(0x5a4a00, 0x332800)
      );
      vent.position.set(vx, vy + 1.5, vz);
      scene.add(vent);
      const ventGlow = new THREE.PointLight(0xffee00, 0.5, 10);
      ventGlow.position.set(vx, vy + 3.5, vz);
      scene.add(ventGlow);
    });

    // --- 7. Ash dunes (flat dark hills via squashed spheres)
    const ashDunePositions = [
      [-55, 0, -55], [ 55, 0, -55], [-55, 0,  55], [ 55, 0,  55],
      [-60, 0,   0], [ 60, 0,   0], [  0, 0, -60], [  0, 0,  60],
    ];
    ashDunePositions.forEach(([dx, dy, dz]) => {
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(14, 10, 6),
        mat(0x181210)
      );
      dune.scale.set(1, 0.22, 1);
      dune.position.set(dx, dy + 1.5, dz);
      dune.receiveShadow = true;
      scene.add(dune);
    });

    // --- 8. Fallen obsidian columns (rotated cylinders)
    const colPositions = [
      [ 42, 0,  38], [-42, 0, -36],
    ];
    colPositions.forEach(([cx, cy, cz], i) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 12, 6),
        mat(0x0d0d12)
      );
      col.position.set(cx, cy + 1, cz);
      col.rotation.z = Math.PI / 2 + (i % 2) * 0.2;
      col.rotation.y = i * 0.8;
      col.castShadow = true;
      scene.add(col);
    });

    // --- 9. Crater wall background arc (large torus segment)
    const craterWall = new THREE.Mesh(
      new THREE.TorusGeometry(65, 8, 5, 24, Math.PI * 1.5),
      mat(0x141008)
    );
    craterWall.rotation.x = Math.PI / 2;
    craterWall.position.y = -3;
    scene.add(craterWall);

    // --- 10. Geyser spray visual (thin tall cylinder, semi-transparent)
    const geyserMat = toon('#ff8800', { emissive: new THREE.Color('#441100'), transparent: true, opacity: 0.45 });
    const geyser = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 15, 8), geyserMat);
    geyser.position.set(8, 7.5, -48);
    scene.add(geyser);

    // ------------------------------------------------------------------ EMBER PARTICLES (200, upward)
    TrackBuilder.createParticles(scene, {
      count:  200,
      spread: 80,
      color:  '#ff5500',
      size:   0.22,
      speed:  0.08,
    });

    // Extra hot embers (brighter, smaller)
    TrackBuilder.createParticles(scene, {
      count:  80,
      spread: 60,
      color:  '#ffbb00',
      size:   0.12,
      speed:  0.12,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'obsidian', traction: 0.95, friction: 0.9 },
    ];

    const hazards = [
      { type: 'lava', position: new THREE.Vector3(0, -2, 0), radius: 3 },
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
