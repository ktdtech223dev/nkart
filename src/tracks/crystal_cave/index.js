import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// CRYSTAL CAVE  –  Nature Cup, Race 3
// Underground crystal cavern with enormous glowing formations, stalactites,
// underground lake, torch posts, and crystal-dust particle atmosphere.
// Deep cave fog (density 0.06). Smooth stone floor.
// ---------------------------------------------------------------------------

export const track = {
  id: 'crystal_cave',
  name: 'CRYSTAL CAVE',
  cup: 'nature',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_nature_03',

  skyConfig: {
    topColor:    0x080414,
    bottomColor: 0x030208,
    fogColor:    0x0a0618,
    fogDensity:  0.06,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 12;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Cave circuit winding between giant crystal clusters.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 16,  0,  10),
        new THREE.Vector3( 30,  0,   5),
        new THREE.Vector3( 36,  0, -10),
        new THREE.Vector3( 28,  0, -24),
        new THREE.Vector3( 12,  0, -30),
        new THREE.Vector3( -5,  0, -26),
        new THREE.Vector3(-18,  0, -15),
        new THREE.Vector3(-28,  0,  -2),
        new THREE.Vector3(-30,  0,  12),
        new THREE.Vector3(-22,  0,  24),
        new THREE.Vector3( -8,  0,  30),
        new THREE.Vector3(  8,  0,  26),
        new THREE.Vector3( 18,  0,  14),
        new THREE.Vector3( 10,  0,   5),
        new THREE.Vector3(  0,  0,  -4),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY + FOG (deep cave)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING
    // Very dim ambient – mostly dark cave, crystals provide most light
    TrackBuilder.createLighting(
      scene,
      0x1a0a28, 0.4,        // very dim purple ambient
      0x442266, 0.6,        // weak directional
      [0, 30, 0],
      false
    );

    // ------------------------------------------------------------------ GROUND (smooth stone)
    const stoneMat = toon('#1a1520');
    const stoneGeo = new THREE.PlaneGeometry(200, 200);
    const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
    stoneMesh.rotation.x = -Math.PI / 2;
    stoneMesh.position.y = -0.15;
    stoneMesh.receiveShadow = true;
    scene.add(stoneMesh);

    // Cave ceiling (dark plane high above)
    const ceilingMat = toon('#0d0a14');
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 30;
    scene.add(ceiling);

    // ------------------------------------------------------------------ ROAD (smooth stone floor)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#2a2035'); // dark polished stone
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Faint glowing centre line (crystal reflection)
    const centreGeo = TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.09);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#9944cc', { emissive: new THREE.Color('#220033'), transparent: true, opacity: 0.55 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS (dark stone)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0x1a1525);
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

    // --- 1. Enormous crystal formations (elongated cones & boxes)
    const crystalData = [
      // [x, z, color, emissive, height, radius, rotY]
      [ 44,  0, 0xaa44ff, 0x550088, 14, 2.5, 0.2],
      [-44,  0, 0x4488ff, 0x002266, 12, 2.2, -0.3],
      [ 35, -28, 0xff66cc, 0x661144, 16, 2.8, 0.5],
      [-35,  28, 0x44ccff, 0x006688, 11, 2.0, -0.1],
      [ 10, -38, 0xbb44ff, 0x440077, 18, 3.2, 0.4],
      [-10,  38, 0x88aaff, 0x223388, 13, 2.4, -0.4],
      [ 40,  20, 0xff44aa, 0x660033, 10, 1.8, 0.6],
      [-40, -15, 0x66ffcc, 0x008844, 15, 2.6, -0.2],
    ];
    crystalData.forEach(([cx, cz, color, emissive, height, radius, rotY]) => {
      // Main crystal spike
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 7),
        toon('#888888', { emissiveIntensity: 0.8 })
      );
      crystal.position.set(cx, height / 2, cz);
      crystal.rotation.y = rotY;
      crystal.rotation.z = (Math.random() - 0.5) * 0.25;
      crystal.castShadow = true;
      scene.add(crystal);

      // Cluster of smaller crystals around base
      for (let s = 0; s < 4; s++) {
        const angle = (s / 4) * Math.PI * 2 + rotY;
        const sr = radius * (0.35 + Math.random() * 0.25);
        const sh = height * (0.4 + Math.random() * 0.35);
        const small = new THREE.Mesh(
          new THREE.ConeGeometry(sr, sh, 6),
          toon('#888888', { emissiveIntensity: 0.6 })
        );
        small.position.set(
          cx + Math.cos(angle) * (radius + 1.5),
          sh / 2,
          cz + Math.sin(angle) * (radius + 1.5)
        );
        small.rotation.y = angle;
        small.rotation.z = (Math.random() - 0.5) * 0.5;
        scene.add(small);
      }

      // Point light at crystal base (emissive glow)
      const glow = new THREE.PointLight(color, 1.2, 22);
      glow.position.set(cx, height * 0.6, cz);
      scene.add(glow);
    });

    // --- 2. Stalactites from ceiling (downward cones)
    const stalaCtiteData = [
      [ 20, 30, -10, 4, 0.8], [-20, 30,  18, 5, 0.6], [ 5, 28, -20, 3.5, 0.5],
      [-15, 28,  -8, 4.5, 0.7], [ 30, 30,  10, 3, 0.4], [-30, 28, -20, 5.5, 0.9],
      [ 15, 29,  25, 3.8, 0.6], [  0, 30,  15, 4, 0.7], [-5, 28, -30, 5, 0.8],
    ];
    stalaCtiteData.forEach(([sx, sy, sz, height, radius]) => {
      const stalactite = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 7),
        mat(0x1a1228)
      );
      stalactite.position.set(sx, sy - height / 2, sz);
      stalactite.rotation.z = Math.PI; // point downward
      stalactite.castShadow = true;
      scene.add(stalactite);

      // Occasional glowing crystal-tipped stalactite
      if (Math.random() > 0.5) {
        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(radius * 0.4, 1.2, 6),
          toon('#9966ff', { emissive: new THREE.Color('#440088') })
        );
        tip.position.set(sx, sy - height, sz);
        tip.rotation.z = Math.PI;
        scene.add(tip);
      }
    });

    // --- 3. Underground lake (reflective plane with blue tint)
    const lakeMat = toon('#0a0a28', { emissive: new THREE.Color('#080820'), transparent: true, opacity: 0.88 });
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-18, 0.02, -20);
    scene.add(lake);

    // Lake glow (deep blue point light under surface)
    const lakeGlow = new THREE.PointLight(0x2244cc, 1.0, 35);
    lakeGlow.position.set(-18, 0.5, -20);
    scene.add(lakeGlow);

    // Lake edge shimmer
    const lakeEdge = new THREE.Mesh(
      new THREE.RingGeometry(13, 15, 24),
      toon('#3355ff', { emissive: new THREE.Color('#111144'), transparent: true, opacity: 0.4 })
    );
    lakeEdge.rotation.x = -Math.PI / 2;
    lakeEdge.position.set(-18, 0.03, -20);
    scene.add(lakeEdge);

    // --- 4. Torch posts (cylinder + flame point light)
    const torchPostData = [
      [ 22,  0,  0], [-22,  0,  0], [ 10,  0, -28],
      [-10,  0,  28], [ 32,  0, -18], [-32,  0,  18],
      [  0,  0,  20], [  0,  0, -20],
    ];
    torchPostData.forEach(([tx, ty, tz]) => {
      // Post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 4, 7),
        mat(0x4a3010)
      );
      post.position.set(tx, ty + 2, tz);
      post.castShadow = true;
      scene.add(post);

      // Torch bowl
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.3, 0.6, 7),
        mat(0x7a5020)
      );
      bowl.position.set(tx, ty + 4.3, tz);
      scene.add(bowl);

      // Flame (small cone)
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.8, 7),
        toon('#ff8800', { emissive: new THREE.Color('#ff4400') })
      );
      flame.position.set(tx, ty + 5.0, tz);
      scene.add(flame);

      // Torch point light
      const torchLight = new THREE.PointLight(0xff7700, 1.5, 18);
      torchLight.position.set(tx, ty + 5.0, tz);
      scene.add(torchLight);
    });

    // --- 5. Stalagmites from floor (upward cones)
    const stalagmitePositions = [
      [ 44,  5], [-44, -10], [ 20, -38], [-15,  40],
      [ 38,  28], [-35, -30], [  8,  42], [-8, -42],
    ];
    stalagmitePositions.forEach(([sx, sz]) => {
      const h = 3 + Math.random() * 5;
      const r = 0.4 + Math.random() * 0.5;
      const stala = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 7),
        mat(0x1e1830)
      );
      stala.position.set(sx, h / 2, sz);
      scene.add(stala);
    });

    // --- 6. Cave rock boulders (grey irregular spheres)
    const boulderMat = mat(0x2a2435);
    [
      [-42, 0.8, 15, 2.2], [42, 0.8, -20, 1.8], [0, 0.8, 38, 2.5],
      [15, 0.8, -40, 2.0], [-25, 0.8, 38, 1.5],
    ].forEach(([bx, by, bz, br]) => {
      const boulder = new THREE.Mesh(new THREE.SphereGeometry(br, 7, 6), boulderMat);
      boulder.position.set(bx, by, bz);
      boulder.castShadow = true;
      scene.add(boulder);
    });

    // --- 7. Crystal dust particle system (200 particles)
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 90;
      dustPos[i * 3 + 1] = Math.random() * 25;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xcc88ff,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const crystalDust = new THREE.Points(dustGeo, dustMat);
    scene.add(crystalDust);

    // Floating crystal shards (larger, distinct colors)
    const shardGeo = new THREE.BufferGeometry();
    const shardPos = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      shardPos[i * 3]     = (Math.random() - 0.5) * 80;
      shardPos[i * 3 + 1] = 2 + Math.random() * 18;
      shardPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    shardGeo.setAttribute('position', new THREE.BufferAttribute(shardPos, 3));
    const shardMat = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.35,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    scene.add(new THREE.Points(shardGeo, shardMat));

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'stone', traction: 0.95, friction: 0.88 },
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
