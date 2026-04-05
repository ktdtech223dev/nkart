import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// FISHMAN ISLAND REEF  –  Pirate Cup, Race 2
// An underwater coral palace circuit deep beneath the ocean. Bioluminescent
// coral formations glow in orange and purple. Giant fish drift lazily in the
// murky background. Shafts of filtered sunlight pierce the blue-green water.
// Thick exponential fog (density 0.04) cuts visibility to give an oppressive
// deep-sea feel. The road winds through coral archways and ancient stone ruins.
// ---------------------------------------------------------------------------

export const track = {
  id: 'fishman_island_reef',
  name: 'FISHMAN ISLAND REEF',
  cup: 'pirate',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_pirate_02',

  skyConfig: {
    topColor:    0x001a2e,
    bottomColor: 0x003322,
    fogColor:    0x012a35,
    fogDensity:  0.04,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 250;

    // ------------------------------------------------------------------ CURVE
    // Spiral through coral formations and ruin archways then loops back
    const curve = new THREE.CatmullRomCurve3(
      [
        // Grand palace entrance
        new THREE.Vector3(  0,  0,  65),
        new THREE.Vector3(-20,  0,  55),
        new THREE.Vector3(-38,  0,  38),
        // Port coral garden sweep
        new THREE.Vector3(-48,  0,  15),
        new THREE.Vector3(-50,  0, -10),
        // Deep trench chicane
        new THREE.Vector3(-42,  0, -30),
        new THREE.Vector3(-28,  0, -48),
        // Ruin archway passage
        new THREE.Vector3(  0,  0, -60),
        new THREE.Vector3( 22,  0, -52),
        // Starboard coral sweep
        new THREE.Vector3( 42,  0, -30),
        new THREE.Vector3( 50,  0, -5),
        new THREE.Vector3( 48,  0,  20),
        // Light shaft plaza (centre high)
        new THREE.Vector3( 30,  0,  42),
        new THREE.Vector3( 14,  0,  56),
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
    // Deep ambient – teal blue
    TrackBuilder.createLighting(
      scene,
      0x003a44, 1.0,
      0x004466, 0.6,
      [0, 80, 0],
      false
    );
    // Filtered sunlight shafts – several narrow point lights from above
    const shaftPositions = [
      [0, 40, 0], [20, 38, 20], [-25, 36, -15], [10, 42, -40],
    ];
    shaftPositions.forEach(([sx, sy, sz]) => {
      const shaft = new THREE.PointLight(0x44aacc, 0.9, 55);
      shaft.position.set(sx, sy, sz);
      scene.add(shaft);
    });
    // Bioluminescent ambient fill
    const bioAmbient = new THREE.AmbientLight(0x112233, 0.5);
    scene.add(bioAmbient);

    // ------------------------------------------------------------------ GROUND (sea floor)
    TrackBuilder.createGround(scene, 0x0a1a14);
    // Sand patches
    const sandMat = toon('#2a3a28');
    for (let s = 0; s < 20; s++) {
      const sand = new THREE.Mesh(
        new THREE.CylinderGeometry(
          4 + Math.random() * 8,
          4 + Math.random() * 8,
          0.2, 10
        ),
        sandMat
      );
      sand.position.set(
        (Math.random() - 0.5) * 140,
        0,
        (Math.random() - 0.5) * 140
      );
      scene.add(sand);
    }

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.07);
    const roadMat  = toon('#1a3a30');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Glowing centre stripe (orange bioluminescent)
    const centreGeo  = TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.1);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#ff6600', { emissive: new THREE.Color('#ff3300'), transparent: true, opacity: 0.7 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0x224433);
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
    const mat = (hex, emissive = 0x000000, transparent = false, opacity = 1.0) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); }
      if (transparent) { m.transparent = true; m.opacity = opacity; }
      return m;
    };

    // Helper: add bioluminescent coral cluster
    const addCoral = (x, y, z, colorHex, emissHex, scale = 1) => {
      // Main stalk
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 4 * scale, 8),
        mat(colorHex, emissHex)
      );
      stalk.position.set(x, y + 2 * scale, z);
      stalk.castShadow = true;
      scene.add(stalk);
      // Branch
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, 2.5 * scale, 6),
        mat(colorHex, emissHex)
      );
      branch.position.set(x + 0.8 * scale, y + 3.8 * scale, z + 0.4 * scale);
      branch.rotation.z = 0.5;
      scene.add(branch);
      // Tip sphere (glow bulb)
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.6 * scale, 7, 6),
        mat(colorHex, emissHex)
      );
      bulb.position.set(x, y + 4.3 * scale, z);
      scene.add(bulb);
      // Point glow
      const glow = new THREE.PointLight(new THREE.Color(emissHex), 0.5 * scale, 12 * scale);
      glow.position.set(x, y + 4.3 * scale, z);
      scene.add(glow);
    };

    // --- 1. Orange bioluminescent coral clusters (left side of track)
    [
      [-30, 0, 50], [-45, 0, 30], [-52, 0, 5], [-45, 0, -25],
      [-35, 0, -45],
    ].forEach(([cx, cy, cz]) => addCoral(cx, cy, cz, 0xff6600, 0xff4400, 1.2));

    // --- 2. Purple bioluminescent coral (right side)
    [
      [30, 0, 45], [48, 0, 25], [52, 0, -2], [45, 0, -28],
      [28, 0, -50],
    ].forEach(([cx, cy, cz]) => addCoral(cx, cy, cz, 0xcc44ff, 0xaa00ff, 1.0));

    // --- 3. Fan coral (flat disc-like planes)
    const fanPositions = [
      [-15, 0, -55, 0xff8833], [ 15, 0, -55, 0xcc66ff],
      [-20, 0,  60, 0xff5500], [ 22, 0,  60, 0xaa33ff],
    ];
    fanPositions.forEach(([fx, fy, fz, col]) => {
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 0.3, 0.3, 14),
        mat(col, col, true, 0.75)
      );
      fan.position.set(fx, fy + 4, fz);
      fan.rotation.x = Math.PI / 2;
      scene.add(fan);
      const fanStalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.4, 4, 8),
        mat(col, col)
      );
      fanStalk.position.set(fx, fy + 2, fz);
      scene.add(fanStalk);
    });

    // --- 4. Stone ruin columns (entrance archway)
    const ruinMat = mat(0x2a3a35);
    [[-10, 0, 64], [10, 0, 64], [-8, 0, -62], [8, 0, -62]].forEach(([px, py, pz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 14, 10), ruinMat);
      col.position.set(px, py + 7, pz);
      col.castShadow = true;
      scene.add(col);
      // Capital
      const capital = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 5), ruinMat);
      capital.position.set(px, py + 14.6, pz);
      scene.add(capital);
    });
    // Archway lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(24, 2, 4.5), ruinMat);
    lintel.position.set(0, 15.2, 64);
    scene.add(lintel);
    const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 4.5), ruinMat);
    lintel2.position.set(0, 15.2, -62);
    scene.add(lintel2);

    // --- 5. Ruin wall sections (broken ancient palace walls)
    const wallMat2 = mat(0x253530);
    [
      { pos: [-60, 0, 0],  rot: [0, Math.PI/2, 0], size: [40, 12, 2] },
      { pos: [ 60, 0, 0],  rot: [0, Math.PI/2, 0], size: [40, 12, 2] },
      { pos: [-35, 0, -62], rot: [0, 0, 0], size: [30, 8, 2] },
      { pos: [ 35, 0, -62], rot: [0, 0, 0], size: [30, 8, 2] },
    ].forEach(({ pos, rot, size }) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat2);
      wall.position.set(...pos);
      wall.rotation.set(...rot);
      scene.add(wall);
    });

    // --- 6. Mossy ruin blocks (scattered debris)
    const mossBlockMat = mat(0x1e3028);
    [
      [-22, 0, -18], [22, 0, -18], [-18, 0, 20], [18, 0, 20],
      [0, 0, -35], [-30, 0, 30], [30, 0, -40],
    ].forEach(([bx, by, bz]) => {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(
          3 + Math.random() * 3,
          1.5 + Math.random() * 2,
          2 + Math.random() * 3
        ),
        mossBlockMat
      );
      block.position.set(bx, by + 0.9, bz);
      block.rotation.y = Math.random() * Math.PI;
      block.castShadow = true;
      scene.add(block);
    });

    // --- 7. Giant fish silhouettes (background – large flat planes)
    const fishMat = toon('#0a2a3a', { transparent: true, opacity: 0.4 });
    [
      { pos: [-90, 15, -30], rot: [0, 0.3, 0],  scale: [1, 0.55, 0.4], sx: 50 },
      { pos: [ 85, 20,  20], rot: [0, -0.4, 0], scale: [1, 0.5, 0.35], sx: 40 },
      { pos: [  0, 25, -95], rot: [0, 0.1, 0],  scale: [1, 0.6, 0.5],  sx: 60 },
    ].forEach(({ pos, rot, scale, sx }) => {
      const fish = new THREE.Mesh(new THREE.SphereGeometry(sx * 0.5, 8, 6), fishMat);
      fish.position.set(...pos);
      fish.rotation.set(...rot);
      fish.scale.set(...scale);
      scene.add(fish);
      // Tail fin
      const tail = new THREE.Mesh(new THREE.ConeGeometry(sx * 0.25, sx * 0.35, 6), fishMat);
      tail.position.set(pos[0] - sx * 0.7 * Math.cos(rot[1]), pos[1], pos[2] - sx * 0.7 * Math.sin(rot[1]));
      tail.rotation.set(0, rot[1], Math.PI / 2);
      scene.add(tail);
    });

    // --- 8. Light shaft geometry (tall thin cones from above)
    const shaftGeoMat = toon('#88ddee', { transparent: true, opacity: 0.06 });
    [[0, 40, 0], [20, 38, 20], [-25, 36, -15], [10, 42, -40]].forEach(([sx, sy, sz]) => {
      const shaftCone = new THREE.Mesh(new THREE.ConeGeometry(8, 50, 8, 1, true), shaftGeoMat);
      shaftCone.position.set(sx, sy - 25, sz);
      scene.add(shaftCone);
    });

    // --- 9. Sea anemones (star-shaped – cone cluster)
    const anemoneColors = [0xff4488, 0xff6600, 0xffaa00];
    [
      [-38, 0, 20], [38, 0, 15], [-12, 0, -42], [12, 0, -42],
      [-50, 0, -5], [50, 0, -8],
    ].forEach(([ax, ay, az]) => {
      const col = anemoneColors[Math.floor(Math.random() * 3)];
      for (let arm = 0; arm < 6; arm++) {
        const angle = (arm / 6) * Math.PI * 2;
        const tentacle = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 2.5, 5),
          mat(col, col)
        );
        tentacle.position.set(
          ax + Math.cos(angle) * 1.2,
          ay + 1.2,
          az + Math.sin(angle) * 1.2
        );
        tentacle.rotation.z = Math.cos(angle) * 0.55;
        tentacle.rotation.x = Math.sin(angle) * 0.55;
        scene.add(tentacle);
      }
      const base = new THREE.Mesh(new THREE.SphereGeometry(0.8, 7, 6), mat(col, col));
      base.position.set(ax, ay + 0.3, az);
      scene.add(base);
    });

    // --- 10. Giant clam props
    const clamMat = mat(0xcc88ff, 0x6600aa);
    [[-18, 0, 35], [18, 0, -20]].forEach(([cx, cy, cz]) => {
      const shell1 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), clamMat);
      shell1.position.set(cx, cy + 1.2, cz);
      shell1.scale.set(1, 0.45, 0.7);
      scene.add(shell1);
      const shell2 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), clamMat);
      shell2.position.set(cx, cy + 3.8, cz);
      shell2.scale.set(1, 0.45, 0.7);
      shell2.rotation.x = Math.PI;
      scene.add(shell2);
      // Pearl
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 7), mat(0xeeeeff, 0x8888cc));
      pearl.position.set(cx, cy + 2.5, cz);
      scene.add(pearl);
    });

    // ------------------------------------------------------------------ PARTICLES
    // Bioluminescent plankton sparkles
    TrackBuilder.createParticles(scene, {
      count:  200,
      spread: 80,
      color:  '#00ffcc',
      size:   0.12,
      speed:  0.02,
    });
    // Blue water motes
    TrackBuilder.createParticles(scene, {
      count:  150,
      spread: 100,
      color:  '#0044aa',
      size:   0.25,
      speed:  0.015,
    });
    // Orange coral spores
    TrackBuilder.createParticles(scene, {
      count:  80,
      spread: 50,
      color:  '#ff6600',
      size:   0.18,
      speed:  0.03,
    });

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
