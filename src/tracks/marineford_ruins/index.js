import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// MARINEFORD RUINS  –  Pirate Cup, Race 3
// The aftermath of the greatest war the world had ever seen. The once-proud
// plaza of Marine HQ is shattered: cracked marble tiles, the towering ice wall
// half-collapsed into blue-transparent shards, smouldering magma-rock craters,
// toppled stone battlements. The sky blazes red-orange. Embers and smoke drift
// everywhere. The track runs across the wide central plaza, ducks through a
// chicane of fallen columns, snakes past the ice-wall remnants, and loops back
// through the collapsed execution scaffold.
// ---------------------------------------------------------------------------

export const track = {
  id: 'marineford_ruins',
  name: 'MARINEFORD RUINS',
  cup: 'pirate',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_pirate_03',

  skyConfig: {
    topColor:    0x8a1a00,
    bottomColor: 0x3a0800,
    fogColor:    0x6a1500,
    fogDensity:  0.016,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 12;
    const SEGMENTS   = 250;

    // ------------------------------------------------------------------ CURVE
    // Wide plaza loop with a chicane through fallen columns and an ice-wall section
    const curve = new THREE.CatmullRomCurve3(
      [
        // Start – broad execution plaza front
        new THREE.Vector3(  0,  0,  62),
        new THREE.Vector3(-25,  0,  55),
        // Port side – past fallen wall section
        new THREE.Vector3(-48,  0,  35),
        new THREE.Vector3(-55,  0,  10),
        // Chicane through collapsed battlements
        new THREE.Vector3(-50,  0, -15),
        new THREE.Vector3(-38,  0, -30),
        new THREE.Vector3(-22,  0, -25),
        // Ice-wall passage (narrows, slight elevation)
        new THREE.Vector3( -8,  0, -45),
        new THREE.Vector3(  8,  0, -52),
        new THREE.Vector3( 22,  0, -45),
        // Starboard sweep back
        new THREE.Vector3( 42,  0, -28),
        new THREE.Vector3( 55,  0,  -5),
        new THREE.Vector3( 52,  0,  22),
        // Past the magma craters
        new THREE.Vector3( 38,  0,  42),
        new THREE.Vector3( 18,  0,  58),
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
    // Fiery red-orange directional (setting sun / fire glow)
    TrackBuilder.createLighting(
      scene,
      0x5a1800, 0.8,
      0xff4400, 1.1,
      [40, 60, 10],
      true
    );
    // Magma crack uplighting
    const magmaLight1 = new THREE.PointLight(0xff6600, 1.5, 45);
    magmaLight1.position.set(-20, 2, 0);
    scene.add(magmaLight1);
    const magmaLight2 = new THREE.PointLight(0xff4400, 1.2, 40);
    magmaLight2.position.set(35, 2, -20);
    scene.add(magmaLight2);
    // Ice wall cold fill
    const iceLight = new THREE.PointLight(0x44aaff, 0.8, 50);
    iceLight.position.set(0, 10, -48);
    scene.add(iceLight);

    // ------------------------------------------------------------------ GROUND (cracked marble)
    TrackBuilder.createGround(scene, 0x2a1a18);

    // Cracked marble tiles (grid of flat planes, slightly varied heights)
    const marbleMat = toon('#b0a090');
    const crackMat  = toon('#1a0f0f');
    for (let tx = -70; tx < 70; tx += 10) {
      for (let tz = -70; tz < 70; tz += 10) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.35, 9.4), marbleMat);
        tile.position.set(tx + 4.7, -0.1 + (Math.random() - 0.5) * 0.12, tz + 4.7);
        tile.receiveShadow = true;
        scene.add(tile);
        // Crack lines across the tile
        if (Math.random() > 0.5) {
          const crack = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.1, 0.3), crackMat);
          crack.position.set(tx + 4.7, 0.08, tz + 4.7 + (Math.random() - 0.5) * 4);
          crack.rotation.y = Math.random() * 0.4;
          scene.add(crack);
        }
      }
    }

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.07);
    const roadMat  = toon('#6a5040');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre stripe
    const centreGeo  = TrackBuilder.buildRoad(curve, 0.7, SEGMENTS, 0.1);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#ff4400', { emissive: new THREE.Color('#661100'), transparent: true, opacity: 0.6 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0x4a3030);
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

    // --- 1. ICE WALL remnants (blue transparent, partially shattered)
    const iceMat = toon('#88ccff', { emissive: new THREE.Color('#112244'), transparent: true, opacity: 0.55 });
    // Main wall fragment slabs
    [
      { pos: [-5, 12, -58], rot: [0, 0.1, 0],  size: [18, 22, 3] },
      { pos: [16, 9, -56],  rot: [0, -0.25, 0], size: [12, 16, 3] },
      { pos: [-18, 6, -55], rot: [0, 0.35, 0.08], size: [10, 10, 2.5] },
    ].forEach(({ pos, rot, size }) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(...size), iceMat);
      slab.position.set(...pos);
      slab.rotation.set(...rot);
      slab.castShadow = false;
      scene.add(slab);
    });
    // Ice shard debris (scattered on ground)
    for (let sh = 0; sh < 20; sh++) {
      const shard = new THREE.Mesh(
        new THREE.ConeGeometry(0.4 + Math.random() * 0.8, 1.5 + Math.random() * 3, 5),
        iceMat
      );
      shard.position.set(
        (Math.random() - 0.5) * 40,
        0.5,
        -40 - Math.random() * 25
      );
      shard.rotation.set(
        (Math.random() - 0.5) * 1.0,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.8
      );
      scene.add(shard);
    }

    // --- 2. MAGMA rocks / craters
    const magmaMat = mat(0x1a0800, 0xff3300);
    const lavaMat  = mat(0xff4400, 0xff2200);
    // Large craters
    [
      [30, -0.3, -10], [-30, -0.3, -5], [10, -0.3, 30],
    ].forEach(([cx, cy, cz]) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(6, 1.2, 8, 18), magmaMat);
      rim.position.set(cx, cy + 0.8, cz);
      rim.rotation.x = Math.PI / 2;
      rim.castShadow = true;
      scene.add(rim);
      const lava = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.5, 16), lavaMat);
      lava.position.set(cx, cy, cz);
      scene.add(lava);
      const glow = new THREE.PointLight(0xff4400, 1.4, 28);
      glow.position.set(cx, cy + 2, cz);
      scene.add(glow);
    });
    // Scattered magma rocks
    for (let mr = 0; mr < 18; mr++) {
      const rock = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 + Math.random() * 1.5, 6, 5),
        mat(0x2a0a00, 0x661100)
      );
      rock.position.set(
        (Math.random() - 0.5) * 100,
        0.3 + Math.random() * 0.5,
        (Math.random() - 0.5) * 100
      );
      rock.scale.set(1, 0.55 + Math.random() * 0.3, 1);
      rock.castShadow = true;
      scene.add(rock);
    }

    // --- 3. Fallen stone columns (from the battlements chicane)
    const columnMat = mat(0x5a4a40);
    [
      { pos: [-42, 1.5, -20], rot: [0, 0, Math.PI / 2] },
      { pos: [-30, 1.5, -35], rot: [0, 0.5, Math.PI / 2] },
      { pos: [-15, 1.5, -28], rot: [0, -0.3, Math.PI / 2] },
    ].forEach(({ pos, rot }) => {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 18, 10), columnMat);
      column.position.set(...pos);
      column.rotation.set(...rot);
      column.castShadow = true;
      scene.add(column);
      // Broken cap (cylinder at each end)
      [-9, 9].forEach(off => {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.5, 1.8, 8), columnMat);
        cap.position.set(pos[0] + off * Math.cos(rot[2]), pos[1] + off * Math.sin(rot[2]), pos[2]);
        cap.rotation.set(0, 0, rot[2]);
        scene.add(cap);
      });
    });

    // --- 4. Standing ruined wall sections (battlements)
    const battleMat = mat(0x4a3a30);
    [
      { pos: [-58, 6, 15],  rot: [0, Math.PI / 2, 0], size: [28, 12, 2.5] },
      { pos: [-58, 6, -12], rot: [0, Math.PI / 2, 0], size: [18, 8, 2.5] },
      { pos: [58, 6, 5],    rot: [0, Math.PI / 2, 0], size: [30, 10, 2.5] },
    ].forEach(({ pos, rot, size }) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), battleMat);
      wall.position.set(...pos);
      wall.rotation.set(...rot);
      wall.castShadow = true;
      scene.add(wall);
      // Merlons (battlements on top)
      const mCount = Math.round(size[0] / 4);
      for (let m = 0; m < mCount; m++) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, size[2] + 0.2), battleMat);
        merlon.position.set(pos[0] + (m - mCount / 2 + 0.5) * 4, pos[1] + size[1] / 2 + 1.25, pos[2]);
        merlon.rotation.set(...rot);
        scene.add(merlon);
      }
    });

    // --- 5. Execution scaffold (collapsed wooden structure near plaza)
    const scaffMat = mat(0x4a2808);
    // Upright beams
    [[-3, 0, 60], [3, 0, 60]].forEach(([sx, sy, sz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 14, 8), scaffMat);
      post.position.set(sx, sy + 7, sz);
      scene.add(post);
    });
    const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(10, 0.7, 0.7), scaffMat);
    crossbeam.position.set(0, 14.3, 60);
    scene.add(crossbeam);
    // Collapsed section (tilted)
    const fallen = new THREE.Mesh(new THREE.BoxGeometry(12, 0.7, 0.7), scaffMat);
    fallen.position.set(14, 4, 60);
    fallen.rotation.z = -0.9;
    scene.add(fallen);

    // --- 6. Rubble piles
    const rubbleMat = mat(0x554444);
    for (let rb = 0; rb < 12; rb++) {
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(
          1.5 + Math.random() * 3,
          0.8 + Math.random() * 1.5,
          1.2 + Math.random() * 2.5
        ),
        rubbleMat
      );
      rubble.position.set(
        (Math.random() - 0.5) * 110,
        0.5 + Math.random() * 0.5,
        (Math.random() - 0.5) * 110
      );
      rubble.rotation.y = Math.random() * Math.PI;
      scene.add(rubble);
    }

    // --- 7. Marine HQ gate remnant (twin pillars with broken lintel)
    const gateMat = mat(0x5a5050);
    [[-12, 0, 65], [12, 0, 65]].forEach(([px, py, pz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 20, 10), gateMat);
      pillar.position.set(px, py + 10, pz);
      pillar.castShadow = true;
      scene.add(pillar);
    });
    const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 4), gateMat);
    gateLintel.position.set(0, 20.5, 65);
    gateLintel.rotation.z = 0.04;  // slightly tilted / damaged
    scene.add(gateLintel);
    // Marine HQ emblem (circular)
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.5, 14), mat(0x4488aa, 0x224455));
    emblem.position.set(0, 22, 65);
    emblem.rotation.x = Math.PI / 2;
    scene.add(emblem);

    // --- 8. Destroyed cannon turrets
    const turrMat = mat(0x333333);
    [
      [-55, 4, 20], [55, 4, -15],
    ].forEach(([tx, ty, tz]) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4, 4, 10), turrMat);
      base.position.set(tx, ty, tz);
      base.castShadow = true;
      scene.add(base);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 8, 10), turrMat);
      barrel.position.set(tx + 3, ty + 2, tz);
      barrel.rotation.z = Math.PI / 2;
      scene.add(barrel);
    });

    // --- 9. Debris plumes (smoke columns)
    const smokeMat = toon('#2a1a18', { transparent: true, opacity: 0.3 });
    [[-20, 0, 10], [30, 0, -30], [0, 0, 50]].forEach(([px, py, pz]) => {
      for (let cloud = 0; cloud < 4; cloud++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(3 + cloud * 1.5, 6, 5),
          smokeMat
        );
        puff.position.set(px, py + 5 + cloud * 6, pz);
        scene.add(puff);
      }
    });

    // ------------------------------------------------------------------ PARTICLES
    // Ember sparks (small orange/red)
    TrackBuilder.createParticles(scene, {
      count:  200,
      spread: 90,
      color:  '#ff4400',
      size:   0.15,
      speed:  0.08,
    });
    // Ash flakes (grey, slow drifting)
    TrackBuilder.createParticles(scene, {
      count:  150,
      spread: 80,
      color:  '#442222',
      size:   0.22,
      speed:  0.025,
    });
    // Hot smoke (dark, large)
    TrackBuilder.createParticles(scene, {
      count:  60,
      spread: 60,
      color:  '#1a0808',
      size:   0.5,
      speed:  0.015,
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
