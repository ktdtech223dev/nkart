import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// SNACK ATTACK  –  Dorm Cup, Race 2
// A multi-level shelf track that descends and climbs three wooden dorm shelves.
// Ramp sections connect the levels. Wood-grain shelves, warm storage-room light.
// ---------------------------------------------------------------------------

export const track = {
  id: 'snack_attack',
  name: 'SNACK ATTACK',
  cup: 'dorm',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_dorm_02',

  skyConfig: {
    topColor:    0x3e2a1a,
    bottomColor: 0x1a0f07,
    fogColor:    0x2a1a0e,
    fogDensity:  0.025,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 240;

    // ------------------------------------------------------------------ CURVE
    // Three shelf levels:
    //   Level 0  y ≈ 0   (bottom shelf)
    //   Level 1  y ≈ 18  (middle shelf)
    //   Level 2  y ≈ 36  (top shelf)
    // Ramps at z ≈ 35 (ascending) and z ≈ -35 (descending).
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0, -38),
        new THREE.Vector3( 22,  0, -30),
        new THREE.Vector3( 38,  0, -12),
        new THREE.Vector3( 42,  0,   8),
        new THREE.Vector3( 34,  0,  28),
        new THREE.Vector3( 16,  0,  40),
        new THREE.Vector3( -6,  0,  42),
        new THREE.Vector3(-24,  0,  34),
        new THREE.Vector3(-38,  0,  18),
        new THREE.Vector3(-40,  0,  -4),
        new THREE.Vector3(-28,  0, -22),
        new THREE.Vector3(-10,  0, -36),
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
      0xffe0b0, 0.5,
      0xffc86a, 1.4,
      [5, 60, 10],
      true
    );
    // Under-shelf strip lights (fluorescent blue-white)
    [0, 18, 36].forEach(y => {
      const strip = new THREE.PointLight(0xffeecc, 0.7, 80);
      strip.position.set(0, y + 2, 0);
      scene.add(strip);
    });

    // ------------------------------------------------------------------ SHELF GEOMETRY
    const shelfMat = toon('#8b5e3c');
    const shelfEdgeMat = toon('#5c3a1e');

    // Wood grain overlay material
    const grainMat = toon('#6b4423', { transparent: true, opacity: 0.3 });

    const buildShelf = (yPos, label) => {
      // Shelf board
      const board = new THREE.Mesh(new THREE.BoxGeometry(90, 1.5, 90), shelfMat);
      board.position.set(0, yPos - 0.75, 0);
      board.receiveShadow = true;
      scene.add(board);
      // Front lip
      const lip = new THREE.Mesh(new THREE.BoxGeometry(90, 3, 1.2), shelfEdgeMat);
      lip.position.set(0, yPos + 0.75, 45);
      scene.add(lip);
      // Back wall bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(90, 20, 1.2), shelfEdgeMat);
      bracket.position.set(0, yPos + 9, -45);
      scene.add(bracket);
      // Wood grain strips
      for (let g = -40; g <= 40; g += 9) {
        const grain = new THREE.Mesh(new THREE.BoxGeometry(90, 0.05, 0.8), grainMat);
        grain.position.set(0, yPos + 0.01, g);
        scene.add(grain);
      }
    };

    buildShelf(-1,  'bottom');
    buildShelf(17,  'middle');
    buildShelf(35,  'top');

    // Side supports
    [-44, 44].forEach(x => {
      const support = new THREE.Mesh(new THREE.BoxGeometry(1.5, 55, 1.5), shelfEdgeMat);
      support.position.set(x, 27, -44);
      scene.add(support);
    });

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.08);
    const roadMat  = toon('#d9c4a0');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Ramp traction strips (visual only – darker dashes on ramp)
    const rampStripMat = toon('#aa8855', { transparent: true, opacity: 0.6 });
    const centreLineGeo = TrackBuilder.buildRoad(curve, 0.7, SEGMENTS, 0.1);
    const centreLine    = new THREE.Mesh(centreLineGeo, toon('#ffffff', { transparent: true, opacity: 0.45 }));
    trackGroup.add(centreLine);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.4, 0x6b4423);
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

    // --- 1. Red Bull cans (tall cylinders, bottom & mid shelf)
    const canPositions = [
      [-20, 0, -8], [-16, 0, -8], [-12, 0, -8],
      [ 10, 18,-15], [ 14, 18,-15],
    ];
    canPositions.forEach(([cx, cy, cz]) => {
      // Can body
      const can = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 5.5, 16), mat(0x1c1c1c));
      can.position.set(cx, cy + 2.75, cz);
      can.castShadow = true;
      scene.add(can);
      // Red band
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 2, 16), mat(0xcc0000, 0x550000));
      band.position.set(cx, cy + 3, cz);
      scene.add(band);
      // Can top
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 0.4, 16), mat(0x888888));
      top.position.set(cx, cy + 5.7, cz);
      scene.add(top);
    });

    // --- 2. Takis bag (wedge-ish box with purple/red)
    const takis = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 3), mat(0x4a0080));
    takis.position.set(20, 18 + 4, 25);
    takis.rotation.y = 0.3;
    takis.castShadow = true;
    scene.add(takis);
    const takisLabel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4, 0.1), mat(0xcc0000));
    takisLabel.position.set(20, 18 + 5, 26.6);
    scene.add(takisLabel);

    // Second Takis bag (toppled)
    const takis2 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 3), mat(0x4a0080));
    takis2.position.set(26, 18 + 1.5, 22);
    takis2.rotation.z = Math.PI / 2;
    takis2.rotation.y = 0.5;
    takis2.castShadow = true;
    scene.add(takis2);

    // --- 3. Succulent (sphere + cylinder pot)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.0, 3, 12), mat(0xd2691e));
    pot.position.set(-20, 36 + 1.5, -20);
    pot.castShadow = true;
    scene.add(pot);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.3, 12), mat(0x3e2000));
    soil.position.set(-20, 36 + 3.15, -20);
    scene.add(soil);
    // Succulent leaves (cones)
    const leafMat = mat(0x4caf50);
    [0, 60, 120, 180, 240, 300].forEach((deg, i) => {
      const rad = deg * Math.PI / 180;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.5, 6), leafMat);
      leaf.position.set(
        -20 + Math.cos(rad) * 1.6,
        36 + 4 + (i % 2) * 0.5,
        -20 + Math.sin(rad) * 1.6
      );
      leaf.rotation.z = 0.55 * (i % 2 === 0 ? 1 : -1);
      leaf.rotation.y = rad;
      scene.add(leaf);
    });

    // --- 4. Charger cable (torus coil simulation using multiple small tori)
    for (let i = 0; i < 6; i++) {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(2.5 - i * 0.1, 0.18, 6, 20),
        mat(0x222222)
      );
      coil.position.set(30, 36 + i * 0.36, -25);
      coil.rotation.x = Math.PI / 2;
      scene.add(coil);
    }
    // USB plug at end
    const usbPlug = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 2), mat(0xaaaaaa));
    usbPlug.position.set(30, 36 + 0.25, -22);
    scene.add(usbPlug);

    // --- 5. Ramen cup (cylinder with lid)
    const ramenCup = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.0, 5, 16), mat(0xff6f00));
    ramenCup.position.set(0, 0 + 2.5, -30);
    ramenCup.castShadow = true;
    scene.add(ramenCup);
    const ramenLid = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.4, 16), mat(0xeeeeee));
    ramenLid.position.set(0, 5.2, -30);
    scene.add(ramenLid);

    // --- 6. Granola bar wrapper (flat box, crinkled look)
    const wrapper = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 2.5), mat(0xf9a825));
    wrapper.position.set(-30, 0 + 0.4, 30);
    wrapper.rotation.y = 0.4;
    wrapper.castShadow = true;
    scene.add(wrapper);

    // --- 7. Phone (black slab with screen glow)
    const phone = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 7), mat(0x111111));
    phone.position.set(15, 36 + 0.25, 10);
    phone.rotation.y = 0.2;
    phone.castShadow = true;
    scene.add(phone);
    const phoneScreen = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 6.5), mat(0x1a237e, 0x0d47a1));
    phoneScreen.position.set(15, 36 + 0.55, 10);
    scene.add(phoneScreen);
    const phonGlow = new THREE.PointLight(0x4466ff, 0.3, 10);
    phonGlow.position.set(15, 36 + 1.5, 10);
    scene.add(phonGlow);

    // --- 8. Pringles can (tall cylinder)
    const pringles = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 10, 16), mat(0xcc0000));
    pringles.position.set(-12, 18 + 5, 28);
    pringles.castShadow = true;
    scene.add(pringles);
    const pringlesCap = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.8, 16), mat(0xeeeeee));
    pringlesCap.position.set(-12, 18 + 10.4, 28);
    scene.add(pringlesCap);

    // --- 9. Airpod case (small rounded box)
    const airpodCase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 2), mat(0xfafafa));
    airpodCase.position.set(22, 36 + 1.75, -10);
    airpodCase.castShadow = true;
    scene.add(airpodCase);

    // --- 10. Sticky notes cluster on back wall (mid shelf)
    const stickyNoteColors = [0xffee58, 0xf06292, 0x80deea, 0x69f0ae];
    stickyNoteColors.forEach((c, i) => {
      const note = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 0.2), mat(c));
      note.position.set(-30 + i * 7, 18 + 8, -44.4);
      note.rotation.y = (Math.random() - 0.5) * 0.2;
      scene.add(note);
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'wood', traction: 0.9, friction: 0.8 },
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
      respawnY: -5,
    };
  },
};
