import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// STORM COAST  –  Volcano Cup, Race 2
// A sea-cliff track battered by a hurricane. Wet stone road, a tall lighthouse,
// storm-bent trees, a wrecked boat and tide pools. Black stormcloud sky with
// lightning flashes. Heavy rain particles. The ocean churns below the cliffs.
// ---------------------------------------------------------------------------

export const track = {
  id: 'storm_coast',
  name: 'STORM COAST',
  cup: 'volcano',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_volcano_02',

  skyConfig: {
    topColor:    0x050810,
    bottomColor: 0x111820,
    fogColor:    0x0a1018,
    fogDensity:  0.016,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 230;

    // ------------------------------------------------------------------ CURVE
    // Cliff-top road with a dramatic lighthouse hairpin, a crumbling coastal
    // section near the boat wreck and a sweeping ocean-view straight.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  45),
        new THREE.Vector3( 22,  0,  38),
        new THREE.Vector3( 40,  0,  20),
        // Lighthouse hairpin
        new THREE.Vector3( 46,  0,   0),
        new THREE.Vector3( 40,  0, -18),
        new THREE.Vector3( 24,  0, -34),
        // Cliff edge – slight elevation drop then recover
        new THREE.Vector3(  5,  0, -44),
        new THREE.Vector3(-16,  0, -40),
        new THREE.Vector3(-32,  0, -26),
        // Wreck section – tighter bends
        new THREE.Vector3(-42,  0, -10),
        new THREE.Vector3(-44,  0,   8),
        new THREE.Vector3(-38,  0,  26),
        new THREE.Vector3(-22,  0,  38),
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
      0x304050, 0.5,           // cold stormy ambient
      0x8899bb, 0.8,           // directional – diffuse stormlight
      [20, 40, 10],
      true
    );
    // Lightning flash fill (white, wide)
    const lightningLight = new THREE.PointLight(0xddeeff, 0.0, 200);
    lightningLight.position.set(0, 50, 0);
    scene.add(lightningLight);

    // Lighthouse beacon light
    const beaconLight = new THREE.SpotLight(0xffdd88, 2.0, 120, Math.PI / 8, 0.4);
    beaconLight.position.set(46, 28, 0);
    beaconLight.target.position.set(0, 0, 0);
    scene.add(beaconLight);
    scene.add(beaconLight.target);

    // ------------------------------------------------------------------ GROUND (cliff-top stone)
    const cliffMat = toon('#3a3a40');
    const cliffGeo = new THREE.PlaneGeometry(200, 200);
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
    cliffMesh.rotation.x = -Math.PI / 2;
    cliffMesh.position.y = -0.15;
    cliffMesh.receiveShadow = true;
    scene.add(cliffMesh);

    // ------------------------------------------------------------------ OCEAN (below cliffs)
    const oceanMat = toon('#0a1e2e', { emissive: new THREE.Color('#001015'), transparent: true, opacity: 0.92 });
    const oceanGeo  = new THREE.PlaneGeometry(300, 300, 60, 60);
    const oceanVerts = oceanGeo.attributes.position;
    for (let i = 0; i < oceanVerts.count; i++) {
      const ox = oceanVerts.getX(i);
      const oz = oceanVerts.getZ(i);
      oceanVerts.setY(i, Math.sin(ox * 0.15) * Math.cos(oz * 0.1) * 1.2);
    }
    oceanGeo.computeVertexNormals();
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.set(80, -20, 0);
    scene.add(oceanMesh);

    // Cliff face (dark tall box on ocean side)
    const cliffFaceMat = toon('#2a2830');
    const cliffFace = new THREE.Mesh(
      new THREE.BoxGeometry(200, 20, 8),
      cliffFaceMat
    );
    cliffFace.position.set(60, -10, 0);
    cliffFace.rotation.y = Math.PI / 2;
    scene.add(cliffFace);

    // ------------------------------------------------------------------ ROAD (wet stone)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#4a4a52', { emissive: new THREE.Color('#050508') });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Wet sheen strip
    const sheenGeo = TrackBuilder.buildRoad(curve, ROAD_WIDTH * 0.8, SEGMENTS, 0.07);
    const sheenMat = toon('#6080a0', { emissive: new THREE.Color('#050810'), transparent: true, opacity: 0.28 });
    trackGroup.add(new THREE.Mesh(sheenGeo, sheenMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0x2a2834);
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

    // --- 1. Lighthouse (tall cylinder + conical top + beacon dome)
    const lighthouseBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4.0, 28, 16),
      mat(0xddddd0)
    );
    lighthouseBase.position.set(52, 14, 0);
    lighthouseBase.castShadow = true;
    scene.add(lighthouseBase);

    // Red stripes on lighthouse
    const stripeColors = [0xcc2222, 0xddddcc, 0xcc2222];
    stripeColors.forEach((sc, i) => {
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(3.55, 3.55, 3, 16),
        mat(sc)
      );
      stripe.position.set(52, 6 + i * 7, 0);
      scene.add(stripe);
    });

    // Lighthouse gallery (wide ring)
    const gallery = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 5.0, 1, 16),
      mat(0x444450)
    );
    gallery.position.set(52, 28.5, 0);
    scene.add(gallery);

    // Beacon room (glass-like cylinder)
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(3.0, 3.0, 4.5, 16),
      mat(0x88aabb, 0x226688)
    );
    beacon.position.set(52, 31.5, 0);
    scene.add(beacon);

    // Roof cone
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 5, 16),
      mat(0x222228)
    );
    roof.position.set(52, 36, 0);
    scene.add(roof);

    // Beacon glow point
    const beaconPt = new THREE.PointLight(0xffdd88, 1.8, 80);
    beaconPt.position.set(52, 32, 0);
    scene.add(beaconPt);

    // --- 2. Storm-bent trees (leaning cylinders + sparse branch cones)
    const bentTreeData = [
      [-10, 0,  52, 0.35], [ 10, 0,  52, -0.3], [-30, 0,  46, 0.42],
      [ 30, 0,  44, -0.38], [-45, 0, -15, 0.3], [ 45, 0, -30, -0.4],
    ];
    bentTreeData.forEach(([tx, ty, tz, lean], i) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, 9, 8),
        mat(0x2a1e10)
      );
      trunk.position.set(tx, ty + 4.5, tz);
      trunk.rotation.z = lean;
      trunk.castShadow = true;
      scene.add(trunk);
      // Bent canopy (dark green cones, storm-battered)
      for (let c = 0; c < 2; c++) {
        const canopy = new THREE.Mesh(
          new THREE.ConeGeometry(2.5 - c * 0.5, 4, 7),
          mat(0x1a2e1a)
        );
        canopy.position.set(
          tx + Math.sin(lean) * (5 + c * 2),
          ty + 6 + c * 2.5,
          tz + (i % 2 === 0 ? 1 : -1) * c
        );
        canopy.rotation.z = lean * 0.6;
        scene.add(canopy);
      }
    });

    // --- 3. Boat wreck (hull box + mast + rigging lines)
    const hullMat = mat(0x2a1a0a);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 6), hullMat);
    hull.position.set(-45, 0, 30);
    hull.rotation.z = 0.25;
    hull.rotation.y = 0.6;
    hull.castShadow = true;
    scene.add(hull);

    // Hull bottom keel
    const keel = new THREE.Mesh(new THREE.BoxGeometry(16, 1.5, 2), mat(0x1a1208));
    keel.position.set(-45, -2, 30);
    keel.rotation.z = 0.25;
    keel.rotation.y = 0.6;
    scene.add(keel);

    // Broken mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 12, 8),
      mat(0x3a2a1a)
    );
    mast.position.set(-44, 6, 28);
    mast.rotation.z = 0.5;
    mast.castShadow = true;
    scene.add(mast);

    // Sail remnant (flat torn plane)
    const sail = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 5),
      mat(0x887766, 0x111100)
    );
    sail.position.set(-41, 8, 26);
    sail.rotation.y = 0.4;
    sail.rotation.z = 0.3;
    scene.add(sail);

    // --- 4. Tide pools (flat circles with reflective teal colour)
    const tidepoolPositions = [
      [ 18, 0.05, -50], [-18, 0.05, -50], [ 0, 0.05, -55],
      [ 28, 0.05, -46], [-28, 0.05, -44],
    ];
    tidepoolPositions.forEach(([px, py, pz], i) => {
      const r = 2.5 + (i % 3) * 1.0;
      const pool = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 0.2, 20),
        mat(0x0a3040, 0x001820)
      );
      pool.position.set(px, py, pz);
      scene.add(pool);
      // Water surface shimmer
      const water = new THREE.Mesh(
        new THREE.CircleGeometry(r - 0.15, 20),
        toon('#0d4458', { emissive: new THREE.Color('#002030'), transparent: true, opacity: 0.7 })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(px, py + 0.12, pz);
      scene.add(water);
    });

    // --- 5. Storm clouds (dark squashed spheres at height)
    const cloudData = [
      [  0, 55, -20], [ 30, 60, 20], [-30, 58, 10],
      [ 15, 52, -40], [-15, 56, 40],
    ];
    cloudData.forEach(([cx, cy, cz], i) => {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(12 + i * 3, 8, 5),
        mat(0x080a0f)
      );
      cloud.scale.set(1.6, 0.4, 1);
      cloud.position.set(cx, cy, cz);
      scene.add(cloud);
    });

    // --- 6. Coastal rocks / sea stacks
    const rockData = [
      [ 65, -5,  15], [ 70, -8, -10], [ 72, -3, 25],
      [-52, 0,  -35], [ 55, 0, -38],
    ];
    rockData.forEach(([rx, ry, rz], i) => {
      const h = 8 + (i % 3) * 6;
      const rock = new THREE.Mesh(
        new THREE.CylinderGeometry(2 + i % 2, 3 + i % 2, h, 6),
        mat(0x303038)
      );
      rock.position.set(rx, ry + h / 2, rz);
      rock.castShadow = true;
      scene.add(rock);
    });

    // --- 7. Dock / pier remnants (boxes)
    const pierMat = mat(0x2a1e10);
    for (let p = 0; p < 5; p++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 8), pierMat);
      plank.position.set(60 + p * 2.2, -0.5 - p * 0.3, -25);
      plank.rotation.y = 0.05 * p;
      scene.add(plank);
    }
    // Pier piles
    [0, 4, 8].forEach(offset => {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 12, 8), pierMat);
      pile.position.set(60 + offset, -6, -26);
      scene.add(pile);
    });

    // --- 8. Warning buoy (sphere + pole)
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), mat(0xdd2200, 0x440000));
    buoy.position.set(68, -16, 18);
    scene.add(buoy);
    const buoyPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), mat(0x888880));
    buoyPole.position.set(68, -13, 18);
    scene.add(buoyPole);

    // --- 9. Coastal barrier walls (low concrete blocks)
    const barrierMat = mat(0x484850);
    for (let b = 0; b < 6; b++) {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.8, 1.2),
        barrierMat
      );
      barrier.position.set(
        20 + Math.cos(b * 1.05) * 40,
        0.9,
        -30 + Math.sin(b * 1.05) * 15
      );
      barrier.rotation.y = b * 0.35;
      barrier.castShadow = true;
      scene.add(barrier);
    }

    // --- 10. Seaweed / kelp tangles near tide pools (thin green boxes)
    const seaweedMat = mat(0x1a3018);
    for (let sw = 0; sw < 8; sw++) {
      const seaweed = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.5 + (sw % 3) * 0.5, 0.15),
        seaweedMat
      );
      seaweed.position.set(
        12 + (sw % 4) * 3.5,
        0.75,
        -46 + (sw % 3) * 2
      );
      seaweed.rotation.z = (sw % 2 === 0 ? 0.25 : -0.2);
      seaweed.rotation.y = sw * 0.4;
      scene.add(seaweed);
    }

    // ------------------------------------------------------------------ HEAVY RAIN PARTICLES (300)
    TrackBuilder.createParticles(scene, {
      count:  300,
      spread: 100,
      color:  '#8899bb',
      size:   0.08,
      speed:  0.4,
    });

    // Foam/spray particles near cliff edge
    TrackBuilder.createParticles(scene, {
      count:  60,
      spread: 40,
      color:  '#ccddeeff',
      size:   0.15,
      speed:  0.12,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'wet_stone', traction: 0.7, friction: 0.65 },
    ];

    const hazards = [
      { type: 'puddle', position: new THREE.Vector3(-20, 0, 10), radius: 4 },
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
