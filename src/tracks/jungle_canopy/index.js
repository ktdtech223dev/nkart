import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// JUNGLE CANOPY  –  Nature Cup, Race 1
// Dense jungle canopy track woven through giant trees, vine bridges, and
// tropical foliage. Branch-wood surface. Green-tinted lighting. Fireflies.
// ---------------------------------------------------------------------------

export const track = {
  id: 'jungle_canopy',
  name: 'JUNGLE CANOPY',
  cup: 'nature',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_nature_01',

  skyConfig: {
    topColor:    0x1a3d0a,
    bottomColor: 0x0d2206,
    fogColor:    0x1a3d0a,
    fogDensity:  0.014,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 12;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Winding canopy path through giant tree trunks, slight elevation changes.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  38),
        new THREE.Vector3( 20,  0,  32),
        new THREE.Vector3( 34,  0,  14),
        new THREE.Vector3( 38,  0,  -8),
        new THREE.Vector3( 30,  0, -26),
        new THREE.Vector3( 12,  0, -34),
        new THREE.Vector3( -8,  0, -32),
        new THREE.Vector3(-24,  0, -18),
        new THREE.Vector3(-35,  0,   2),
        new THREE.Vector3(-32,  0,  20),
        new THREE.Vector3(-18,  0,  34),
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
    // Green-tinted ambient – light filtering through dense canopy
    TrackBuilder.createLighting(
      scene,
      0x2d6e1a, 0.8,         // ambient – green-tinted
      0x88cc44, 1.2,         // directional – dappled canopy light
      [10, 60, 20],
      true
    );
    // Warm fill from below (forest floor reflection)
    const fillLight = new THREE.PointLight(0x44aa22, 0.5, 100);
    fillLight.position.set(0, 0, 0);
    scene.add(fillLight);

    // ------------------------------------------------------------------ GROUND
    // Deep forest floor far below the canopy
    const groundMat = toon('#1a3306');
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -20;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Canopy floor (the branch/bark platforms the track sits on)
    const canopyFloorMat = toon('#3d2008');
    const canopyFloor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), canopyFloorMat);
    canopyFloor.rotation.x = -Math.PI / 2;
    canopyFloor.position.y = 6.0;
    canopyFloor.receiveShadow = true;
    scene.add(canopyFloor);

    // ------------------------------------------------------------------ ROAD (branch wood surface)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#5c3310'); // dark bark brown
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Wood grain centre stripe
    const centreGeo = TrackBuilder.buildRoad(curve, 0.7, SEGMENTS, 0.09);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#7a4820', { transparent: true, opacity: 0.6 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS (vine walls)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0x2d5a0e);
    trackGroup.add(walls.visual);

    // ------------------------------------------------------------------ COLLISION
    const collisionGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH + 2, SEGMENTS, 0);
    const collisionMesh = new THREE.Mesh(
      collisionGeo.clone(),
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

    // --- 1. Giant tree trunks (tall cylinders, scattered around)
    const trunkPositions = [
      [ 45,  0,  20], [-45,  0, -20], [ 20,  0, -45],
      [-20,  0,  45], [ 45,  0, -30], [-45,  0,  30],
    ];
    trunkPositions.forEach(([tx, ty, tz]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 60, 10),
        mat(0x3d1f05)
      );
      trunk.position.set(tx, ty + 30, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      // Bark texture stripes
      for (let b = 0; b < 6; b++) {
        const barkStripe = new THREE.Mesh(
          new THREE.CylinderGeometry(4.1, 5.1, 0.5, 10, 1, true),
          mat(0x2a1403)
        );
        barkStripe.position.set(tx, ty + 5 + b * 9, tz);
        scene.add(barkStripe);
      }
    });

    // --- 2. Giant tropical leaves (flat ellipses built from scaled planes)
    const leafMat = mat(0x2d7d0f);
    const darkLeafMat = mat(0x1a5208);
    const leafPositions = [
      [ 30,  18,  15,  0.4], [-30,  22, -18, -0.3], [ 10,  20, -30,  0.6],
      [-15,  16,  30, -0.2], [ 40,  14, -10,  0.5], [-40,  20,  10, -0.6],
      [ 20,  25,  20,  0.1], [-20,  18, -25,  0.3],
    ];
    leafPositions.forEach(([lx, ly, lz, rot]) => {
      // Main leaf blade
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), leafMat);
      leaf.position.set(lx, ly, lz);
      leaf.rotation.set(-0.3 + Math.random() * 0.2, rot, 0.2 * Math.random());
      leaf.castShadow = true;
      scene.add(leaf);
      // Smaller dark underside droop
      const leafB = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), darkLeafMat);
      leafB.position.set(lx + 1, ly - 0.5, lz + 1);
      leafB.rotation.set(-0.5, rot + 0.2, 0.1);
      scene.add(leafB);
    });

    // --- 3. Hanging vines (thin long cylinders)
    const vineMat = mat(0x3a6b12);
    const vinePositions = [
      [ 15,  35,  5], [-10,  38, -15], [ 35,  32, -5],
      [-35,  35,  10], [ 5,  36,  35], [-25,  34, 20],
    ];
    vinePositions.forEach(([vx, vy, vz]) => {
      const vineLen = 18 + Math.random() * 12;
      const vine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.15, vineLen, 6),
        vineMat
      );
      vine.position.set(vx, vy - vineLen / 2, vz);
      vine.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(vine);

      // Vine node bumps
      for (let n = 0; n < 4; n++) {
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 6, 4),
          mat(0x2e5c0e)
        );
        node.position.set(vx, vy - 4 - n * 4, vz);
        scene.add(node);
      }
    });

    // --- 4. Macaws (colourful birds – layered box bodies + wings)
    const macawData = [
      { pos: [22, 18,  8], bodyCol: 0xff2222, wingCol: 0x0044ff },
      { pos: [-18, 20, -22], bodyCol: 0x22cc11, wingCol: 0xff9900 },
      { pos: [35, 16, -12], bodyCol: 0xffcc00, wingCol: 0xff2200 },
    ];
    macawData.forEach(({ pos: [mx, my, mz], bodyCol, wingCol }) => {
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.6, 0.7), mat(bodyCol));
      body.position.set(mx, my, mz);
      body.castShadow = true;
      scene.add(body);
      // Wings (flat planes angled out)
      [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.8), mat(wingCol));
        wing.position.set(mx + side * 1.4, my, mz);
        wing.rotation.set(0, 0, side * 0.5);
        scene.add(wing);
      });
      // Beak (small cone)
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), mat(0xffdd00));
      beak.position.set(mx, my + 0.5, mz + 0.5);
      beak.rotation.x = Math.PI / 2;
      scene.add(beak);
    });

    // --- 5. Giant tropical flowers (cones + spheres)
    const flowerData = [
      { pos: [-12, 12,  18], petalCol: 0xff4499, centreCol: 0xffee00 },
      { pos: [ 28, 14, -20], petalCol: 0xff7700, centreCol: 0xff2200 },
      { pos: [-30, 10,   5], petalCol: 0xee22cc, centreCol: 0xffff00 },
      { pos: [  8, 13,  30], petalCol: 0xff0066, centreCol: 0xffffff },
    ];
    flowerData.forEach(({ pos: [fx, fy, fz], petalCol, centreCol }) => {
      // Petals (cones arranged radially)
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petal = new THREE.Mesh(
          new THREE.ConeGeometry(0.8, 3, 6),
          mat(petalCol)
        );
        petal.position.set(
          fx + Math.cos(angle) * 2,
          fy,
          fz + Math.sin(angle) * 2
        );
        petal.rotation.z = Math.cos(angle) * 0.8;
        petal.rotation.x = -Math.sin(angle) * 0.8;
        scene.add(petal);
      }
      // Flower centre
      const centre = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), mat(centreCol, 0x442200));
      centre.position.set(fx, fy + 0.5, fz);
      centre.castShadow = true;
      scene.add(centre);
      // Stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 5, 6),
        mat(0x2d7d0f)
      );
      stem.position.set(fx, fy - 2.5, fz);
      scene.add(stem);
    });

    // --- 6. Waterfall (white translucent plane cascade)
    const waterfallMat = toon('#aaddff', { transparent: true, opacity: 0.7 });
    const wfBase = new THREE.Mesh(new THREE.PlaneGeometry(6, 20), waterfallMat);
    wfBase.position.set(-42, 8, -38);
    wfBase.rotation.y = 0.5;
    scene.add(wfBase);
    // Mist pool
    const mistPool = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 0.4, 16),
      toon('#88ccff', { transparent: true, opacity: 0.4 })
    );
    mistPool.position.set(-41, -2, -40);
    scene.add(mistPool);
    // Waterfall point light (blue-white)
    const wfLight = new THREE.PointLight(0x88ccff, 0.8, 30);
    wfLight.position.set(-42, 6, -38);
    scene.add(wfLight);

    // --- 7. Vine bridge section (planks + rope sides)
    const plankMat = mat(0x6b3a10);
    const ropeMat  = mat(0x7a5c2e);
    // Bridge planks across a gap around position (-5, 9, -20)
    for (let b = 0; b < 10; b++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_WIDTH + 2, 0.3, 1.0),
        plankMat
      );
      plank.position.set(-5 + b * 0.1, 8.3, -12 - b * 1.1);
      plank.rotation.y = 0.02 * b;
      scene.add(plank);
    }
    // Rope sides
    [-7, 7].forEach(side => {
      for (let r = 0; r < 5; r++) {
        const rope = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 10, 5),
          ropeMat
        );
        rope.position.set(-5 + side, 10, -14 - r * 2.2);
        rope.rotation.z = Math.PI / 2;
        rope.rotation.y = 0.05;
        scene.add(rope);
      }
    });

    // --- 8. Tree trunk hollow arch (half-cylinder tunnel)
    const hollowMat = mat(0x2a1403);
    const hollowArch = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 3, 12, 1, true, 0, Math.PI),
      hollowMat
    );
    hollowArch.position.set(20, 11, -14);
    hollowArch.rotation.y = Math.PI / 4;
    scene.add(hollowArch);

    // Hollow interior darkness
    const hollowInner = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 3, 12, 1, true, 0, Math.PI),
      mat(0x0d0a05)
    );
    hollowInner.position.set(20, 11, -14);
    hollowInner.rotation.y = Math.PI / 4;
    scene.add(hollowInner);

    // ------------------------------------------------------------------ FIREFLY PARTICLES
    const fireflyGeo = new THREE.BufferGeometry();
    const ffPositions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      ffPositions[i * 3]     = (Math.random() - 0.5) * 80;
      ffPositions[i * 3 + 1] = 6 + Math.random() * 20;
      ffPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(ffPositions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xccff44,
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
    scene.add(fireflies);

    // General canopy atmosphere particles (pollen/spores)
    TrackBuilder.createParticles(scene, {
      count:  60,
      spread: 70,
      color:  '#aaffaa',
      size:   0.12,
      speed:  0.015,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'wood', traction: 0.88, friction: 0.78 },
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
      respawnY: -10,
    };
  },
};
