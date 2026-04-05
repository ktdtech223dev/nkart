import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// THE VOID  –  Shadow Cup, Race 4  (Final / Hardest Track)
// Pure abstract void. A complex geometric circuit suspended in absolute
// nothingness. Faint grid lines on pure black. No props except glowing
// item boxes. Maximum complexity: many elevation changes, tight turns,
// corkscrews, loops, and dips. The hardest track in the game.
// ---------------------------------------------------------------------------

export const track = {
  id: 'the_void',
  name: 'THE VOID',
  cup: 'shadow',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_shadow_04',

  skyConfig: {
    topColor:    0x000000,
    bottomColor: 0x000000,
    fogColor:    0x000000,
    fogDensity:  0.012,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 320;

    // ------------------------------------------------------------------ CURVE
    // Maximum complexity: 20 control points with extreme elevation variation,
    // tight turns, corkscrew descents, loop-the-loop inspired rises,
    // and snap-hairpin reversals.
    // The track snakes through 3D space in a complex knot pattern.
    const curve = new THREE.CatmullRomCurve3(
      [
        // --- SECTOR 1: START STRAIGHT then DROP ---
        new THREE.Vector3(  0,   0,  55),   //  0  Start/finish line
        new THREE.Vector3( 30,   0,  30),   //  1  Right kink
        // --- SECTOR 2: CORKSCREW LEFT ---
        new THREE.Vector3( 28,   0,  10),   //  2  Corkscrew entry
        new THREE.Vector3( 18,   0,  -2),   //  3  Corkscrew apex
        new THREE.Vector3(  5,   0, -10),   //  4  Corkscrew exit
        // --- SECTOR 3: TIGHT CHICANE + HAIRPIN ---
        new THREE.Vector3( -8,   0, -18),   //  5  Chicane left
        new THREE.Vector3(-22,   0, -20),   //  6  Chicane right + hairpin entry
        new THREE.Vector3(-20,   0, -40),   //  7  Hairpin
        new THREE.Vector3( -8,   0, -48),   //  8  Hairpin apex
        // --- SECTOR 4: BIG CLIMB ---
        new THREE.Vector3(  8,   0, -45),   //  9  Rise begins
        new THREE.Vector3( 32,   0, -20),   // 10  Straight
        new THREE.Vector3( 35,   0,  -5),   // 11  Crest
        // --- SECTOR 5: SWEEPING ARC ---
        new THREE.Vector3( 28,   0,  12),   // 12  Left sweep
        new THREE.Vector3( 12,   0,  22),   // 13  Dropping sweep
        new THREE.Vector3(  0,   0,  30),   // 14  Loop-hump
        // --- SECTOR 6: RETURN + SECOND CORKSCREW ---
        new THREE.Vector3(-24,   0,  20),   // 15  Return
        new THREE.Vector3(-30,   0,   8),   // 16  Low sweeper
        new THREE.Vector3(-18,   0, -15),   // 17  Corkscrew 2 apex
        // --- SECTOR 7: ESSES to FINISH ---
        new THREE.Vector3(  8,   0, -15),   // 18  Right esse
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY: PURE BLACK VOID
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.012);

    // Minimal ambient – just enough to see the road
    const ambient = new THREE.AmbientLight(0x050505, 0.4);
    scene.add(ambient);

    // Faint directional from above – very dim, cold
    const dirLight = new THREE.DirectionalLight(0x111122, 0.5);
    dirLight.position.set(0, 50, 0);
    scene.add(dirLight);

    // Point lights along the track path (sparse, cold blue-white)
    const voidLightPositions = [
      new THREE.Vector3( 28, -8,  10),   // corkscrew 1
      new THREE.Vector3(-10, -12, -44),  // hairpin
      new THREE.Vector3( 33,  14,  -5),  // high crest
      new THREE.Vector3(-25, -8,   4),   // corkscrew 2
      new THREE.Vector3(  0,   8,  30),  // loop hump
    ];
    voidLightPositions.forEach(pos => {
      const vl = new THREE.PointLight(0x2244aa, 1.0, 35);
      vl.position.copy(pos);
      scene.add(vl);
    });

    // ------------------------------------------------------------------ VOID GRID (faint)
    // The only decoration: a barely-visible infinite grid on the void floor
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a14,
      transparent: true,
      opacity: 0.35,
    });

    // Horizontal grid lines (Z-axis)
    for (let g = -200; g <= 200; g += 10) {
      const hLine = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.15), gridMat);
      hLine.rotation.x = -Math.PI / 2;
      hLine.position.set(0, -20, g);
      scene.add(hLine);

      const vLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 400), gridMat);
      vLine.rotation.x = -Math.PI / 2;
      vLine.position.set(g, -20, 0);
      scene.add(vLine);
    }

    // Faint grid on vertical planes (like walls of void cube at extreme distance)
    const farGridMat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      transparent: true,
      opacity: 0.2,
    });
    for (let g = -200; g <= 200; g += 20) {
      // Back wall grid
      const wallLine = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.2), farGridMat);
      wallLine.position.set(0, g * 0.5, -200);
      scene.add(wallLine);

      const floorCross = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 400), farGridMat);
      floorCross.position.set(g, g * 0.5, -200);
      scene.add(floorCross);
    }

    // ------------------------------------------------------------------ TRACK GEOMETRY
    // Road: pure black, very faint blue edge glow
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#080810', { emissive: new THREE.Color('#060610') });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    trackGroup.add(roadMesh);

    // Centreline: faint cold white
    const centreMat = toon('#3344aa', { emissive: new THREE.Color('#1122aa'), transparent: true, opacity: 0.55 });
    const centreGeo  = TrackBuilder.buildRoad(curve, 0.4, SEGMENTS, 0.08);
    const centreMesh = new THREE.Mesh(centreGeo, centreMat);
    trackGroup.add(centreMesh);

    // Edge glows (two thin strips at road edges – glowing faint blue)
    const edgeMat = toon('#0011aa', { emissive: new THREE.Color('#0022cc'), transparent: true, opacity: 0.6 });
    const edgeWidth = 0.3;

    // Build left and right edge strips by offsetting the road-building approach
    // Left edge strip
    const leftEdgeGeo  = TrackBuilder.buildRoad(curve, edgeWidth, SEGMENTS, 0.06);
    // We'll position it manually – build a road at full width and crop, or just use
    // two separate narrow roads offset. Use the centre road approach at ROAD_WIDTH - edgeWidth.
    const leftEdge = new THREE.Mesh(leftEdgeGeo, edgeMat);
    trackGroup.add(leftEdge);

    // ------------------------------------------------------------------ WALLS (minimal, dark)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.2, 0x050510);
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

    // ================================================================== GEOMETRIC DECORATION
    // No props – only abstract geometry markers at key track sections
    const sectionMat = (emissive) =>
      toon('#030306');

    // --- CORKSCREW 1 MARKER (rotating torus frame at corkscrew apex)
    const corkscrew1Ring = new THREE.Mesh(
      new THREE.TorusGeometry(8, 0.3, 8, 32),
      sectionMat(0x002255)
    );
    corkscrew1Ring.position.set(18, -13, -2);
    corkscrew1Ring.rotation.x = Math.PI / 4;
    scene.add(corkscrew1Ring);

    const corkscrew1Ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(8, 0.15, 8, 32),
      sectionMat(0x001133)
    );
    corkscrew1Ring2.position.set(18, -13, -2);
    corkscrew1Ring2.rotation.z = Math.PI / 4;
    scene.add(corkscrew1Ring2);

    // --- HAIRPIN ABYSS MARKER (glowing sphere at deepest point)
    const abyssSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      sectionMat(0x001144)
    );
    abyssSphere.position.set(-8, -16, -48);
    scene.add(abyssSphere);

    // Abyss light
    const abyssLight = new THREE.PointLight(0x0033aa, 2.0, 30);
    abyssLight.position.set(-8, -16, -48);
    scene.add(abyssLight);

    // Ring around abyss
    const abyssRing = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.2, 6, 32),
      sectionMat(0x003388)
    );
    abyssRing.position.set(-8, -18, -48);
    abyssRing.rotation.x = Math.PI / 2;
    scene.add(abyssRing);

    // --- HIGH CREST MARKER (pyramid at highest point)
    const crestPyramid = new THREE.Mesh(
      new THREE.ConeGeometry(3, 8, 4),
      sectionMat(0x112244)
    );
    crestPyramid.position.set(35, 20, -5);
    scene.add(crestPyramid);

    const crestLight = new THREE.PointLight(0x2244aa, 1.5, 25);
    crestLight.position.set(35, 22, -5);
    scene.add(crestLight);

    // --- CORKSCREW 2 MARKER
    const corkscrew2Ring = new THREE.Mesh(
      new THREE.TorusGeometry(7, 0.3, 8, 32),
      sectionMat(0x002244)
    );
    corkscrew2Ring.position.set(-18, -12, -15);
    corkscrew2Ring.rotation.y = Math.PI / 4;
    scene.add(corkscrew2Ring);

    // --- SECTOR DIVIDERS (faint geometric gates along the track)
    const gateData = [
      { t: 0.05,  color: 0x001133 },
      { t: 0.15,  color: 0x001133 },
      { t: 0.30,  color: 0x001133 },
      { t: 0.50,  color: 0x001133 },
      { t: 0.65,  color: 0x001133 },
      { t: 0.78,  color: 0x001133 },
      { t: 0.90,  color: 0x001133 },
    ];

    gateData.forEach(({ t, color }) => {
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const gateMat = toon('#030306', { emissive: new THREE.Color(color) });

      // Left post
      const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), gateMat);
      leftPost.position.copy(pt.clone().addScaledVector(normal, -ROAD_WIDTH / 2 - 1));
      leftPost.position.y += 2;
      scene.add(leftPost);

      // Right post
      const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), gateMat);
      rightPost.position.copy(pt.clone().addScaledVector(normal, ROAD_WIDTH / 2 + 1));
      rightPost.position.y += 2;
      scene.add(rightPost);

      // Cross beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH + 3, 0.2, 0.2), gateMat);
      beam.position.copy(pt.clone());
      beam.position.y += 4.1;
      beam.rotation.y = Math.atan2(tangent.x, tangent.z);
      scene.add(beam);
    });

    // --- VOID DEPTH INDICATORS (vertical shafts falling into the abyss below)
    const shaftMat = toon('#010104', { emissive: new THREE.Color('#000011'), transparent: true, opacity: 0.5 });
    // At the lowest points of the track
    const shaftPositions = [
      new THREE.Vector3( 18, -15,  -2),
      new THREE.Vector3( -8, -14, -48),
      new THREE.Vector3(-18, -14, -15),
    ];
    shaftPositions.forEach(pos => {
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 3, 30, 8, 1, true),
        shaftMat
      );
      shaft.position.copy(pos);
      shaft.position.y -= 15; // extend downward
      scene.add(shaft);
    });

    // --- FLOATING GEOMETRIC DEBRIS in the void (sparse)
    const debrisMat = toon('#030308', { emissive: new THREE.Color('#000022') });
    const debrisData = [
      [45, -5, 15, 'box', [1.5, 1.5, 1.5]],
      [-45, 5, -20, 'sphere', [1.2]],
      [40, 20, -30, 'box', [2, 0.5, 2]],
      [-40, -10, 30, 'sphere', [0.8]],
      [5, 25, -15, 'box', [1, 3, 1]],
      [-20, 18, 40, 'sphere', [1.5]],
      [25, -20, 40, 'box', [2, 2, 0.5]],
    ];
    debrisData.forEach(([x, y, z, type, params]) => {
      let geo;
      if (type === 'box') geo = new THREE.BoxGeometry(...params);
      else geo = new THREE.SphereGeometry(...params, 8, 8);
      const debris = new THREE.Mesh(geo, debrisMat);
      debris.position.set(x, y, z);
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(debris);
    });

    // ------------------------------------------------------------------ MINIMAL PARTICLES
    // Just a few cold white specks – void stars
    TrackBuilder.createParticles(scene, {
      count:  60,
      spread: 150,
      color:  '#111122',
      size:   0.3,
      speed:  0.01,
    });

    // ------------------------------------------------------------------ NAVIGATION
    // More checkpoints for the complex layout
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 20, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [];

    const hazards = [
      // Void drop zones at abyss sections – fall off = instant respawn
      {
        type: 'void_drop',
        position: new THREE.Vector3(-8, -14, -48),
        radius: 15,
        respawnY: -10,
      },
      {
        type: 'void_drop',
        position: new THREE.Vector3(18, -15, -2),
        radius: 12,
        respawnY: -10,
      },
      // Speed boost strip on the start straight (last straight is rewarded)
      {
        type: 'boost_strip',
        position: new THREE.Vector3(8, 0, 30),
        radius: 8,
        boost: 1.4,
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
      surfaceZones,
      hazards,
      respawnY: -10,
    };
  },
};
