import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// SKYPIEA CIRCUIT  –  Pirate Cup, Race 4
// High in the clouds above the Grand Line floats the sky island of Skypiea.
// The circuit runs along cloud-platform surfaces (white/pale blue), past the
// golden ruins of Shandora, around the base of a colossal beanstalk, and
// over a sky-dive ramp section where the road pitches steeply downward before
// climbing back up through golden Shandoran archways. Fluffy clouds drift
// below; the sky is a perfect, brilliant blue. Golden sparkle particles fill
// the air around the ancient ruins.
// ---------------------------------------------------------------------------

export const track = {
  id: 'skypiea_circuit',
  name: 'SKYPIEA CIRCUIT',
  cup: 'pirate',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_pirate_04',

  skyConfig: {
    topColor:    0x1a7ad4,
    bottomColor: 0x6dc4f5,
    fogColor:    0x88d8f5,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 260;

    // ------------------------------------------------------------------ CURVE
    // Sky-island loop with a dramatic sky-dive dip (negative Y) and golden ruin section
    const curve = new THREE.CatmullRomCurve3(
      [
        // Start/finish on the main cloud platform
        new THREE.Vector3(  0,  0,  60),
        new THREE.Vector3(-22,  0,  50),
        // Cloud platform sweep (port)
        new THREE.Vector3(-45,  0,  28),
        new THREE.Vector3(-55,  0,   0),
        new THREE.Vector3(-48,  0, -25),
        // Shandoran ruin section (elevated golden ruins)
        new THREE.Vector3(-28,  0, -45),
        new THREE.Vector3(  0,  0, -55),
        new THREE.Vector3( 22,  0, -45),
        // Sky-dive ramp: road drops sharply then pulls back up
        new THREE.Vector3( 40,  0, -28),
        new THREE.Vector3( 52,  0,  -5),
        new THREE.Vector3( 48,  0,  18),
        // Beanstalk chicane (tight turns around the stalk base)
        new THREE.Vector3( 35,  0,  38),
        new THREE.Vector3( 18,  0,  50),
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
    // Bright tropical sunlight
    TrackBuilder.createLighting(
      scene,
      0x88bbdd, 0.9,
      0xffffff, 1.4,
      [40, 80, 20],
      true
    );
    // Golden ruin reflected fill (warm)
    const ruinGlow = new THREE.PointLight(0xffcc44, 0.9, 70);
    ruinGlow.position.set(0, 18, -50);
    scene.add(ruinGlow);
    // Sky-dive section – blue fill
    const skyDiveLight = new THREE.PointLight(0x44aaff, 0.7, 55);
    skyDiveLight.position.set(50, -5, 5);
    scene.add(skyDiveLight);

    // ------------------------------------------------------------------ BASE GROUND (sky below – deep blue void)
    TrackBuilder.createGround(scene, 0x1a7ad4);

    // ------------------------------------------------------------------ CLOUD PLATFORM (ground)
    // Main cloud island surface
    const cloudMat = toon('#f0f8ff');
    const cloudBase = new THREE.Mesh(new THREE.CylinderGeometry(75, 65, 12, 18), cloudMat);
    cloudBase.position.set(0, 0, 0);
    cloudBase.receiveShadow = true;
    scene.add(cloudBase);

    // Fluffy cloud bumps on top of the platform
    const bumpMat = toon('#fafafa');
    [
      [20, 5, 20, 18], [-30, 5, 15, 22], [10, 5, -30, 16],
      [-15, 5, -20, 20], [35, 5, 0, 14], [-40, 5, -10, 16],
    ].forEach(([bx, by, bz, br]) => {
      const bump = new THREE.Mesh(new THREE.SphereGeometry(br, 8, 6), bumpMat);
      bump.position.set(bx, by, bz);
      bump.scale.set(1, 0.4, 1);
      scene.add(bump);
    });

    // Cloud platforms BELOW (floating at various heights for sky atmosphere)
    const lowerCloudMat = toon('#d8eeff', { transparent: true, opacity: 0.75 });
    [
      [50, -28, 30, 40], [-60, -35, -20, 50], [0, -25, -80, 35],
      [80, -32, -40, 45], [-80, -20, 40, 38], [20, -40, 80, 42],
    ].forEach(([cx, cy, cz, cr]) => {
      const lCloud = new THREE.Mesh(
        new THREE.SphereGeometry(cr, 8, 6),
        lowerCloudMat
      );
      lCloud.position.set(cx, cy, cz);
      lCloud.scale.set(1, 0.3, 1);
      scene.add(lCloud);
    });

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.07);
    const roadMat  = toon('#ddeeff');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Gold centre stripe (Shandoran influence throughout the track)
    const centreGeo  = TrackBuilder.buildRoad(curve, 0.65, SEGMENTS, 0.1);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#ffd700', { emissive: new THREE.Color('#996600'), transparent: true, opacity: 0.75 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.3, 0xaaccee);
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

    // --- 1. GIANT BEANSTALK (central landmark)
    const stalkMat = mat(0x2d8a3e, 0x0a3010);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 120, 12), stalkMat);
    stalk.position.set(30, 60, 35);
    stalk.castShadow = true;
    scene.add(stalk);
    // Leaf bumps along the beanstalk
    [20, 40, 65, 90].forEach((lh) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(10, 8, 6), mat(0x3da64e, 0x0a4015));
      leaf.position.set(30 + (Math.random() - 0.5) * 10, lh, 35 + (Math.random() - 0.5) * 10);
      leaf.scale.set(1.5, 0.35, 1.5);
      leaf.castShadow = true;
      scene.add(leaf);
      // Vine tendril
      const tendril = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 12, 6), stalkMat);
      tendril.position.set(30 + 6, lh - 4, 35);
      tendril.rotation.z = 0.5;
      scene.add(tendril);
    });

    // --- 2. SHANDORAN GOLDEN RUIN COLUMNS
    const goldMat  = mat(0xffd700, 0x887700);
    const stoneMat = mat(0xccaa44, 0x554400);
    [
      [-35, 0, -48], [-20, 0, -58], [0, 0, -62], [20, 0, -58], [35, 0, -48],
    ].forEach(([px, py, pz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.0, 16, 10), stoneMat);
      col.position.set(px, py + 8, pz);
      col.castShadow = true;
      scene.add(col);
      // Golden capital
      const cap = new THREE.Mesh(new THREE.BoxGeometry(5, 1.5, 5), goldMat);
      cap.position.set(px, py + 16.75, pz);
      scene.add(cap);
      // Column base
      const base = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1, 5.5), stoneMat);
      base.position.set(px, py + 0.5, pz);
      scene.add(base);
    });

    // Shandoran archways (lintel spanning column pairs)
    [[-28, 0, -53], [14, 0, -53]].forEach(([ax, ay, az]) => {
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 4.5), goldMat);
      lintel.position.set(ax, ay + 17.65, az);
      scene.add(lintel);
      // Decorative arch relief
      const arch = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.6, 6, 16, Math.PI), goldMat);
      arch.position.set(ax, ay + 16.5, az);
      arch.rotation.x = Math.PI / 2;
      scene.add(arch);
    });

    // --- 3. Golden Shandoran ruins floor tiles (at ruin section)
    const goldTileMat = mat(0xddaa22, 0x554400);
    for (let rtx = -40; rtx < 40; rtx += 8) {
      for (let rtz = -65; rtz < -35; rtz += 8) {
        if (Math.random() > 0.3) {
          const tile = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.4, 7.5), goldTileMat);
          tile.position.set(rtx, 7.8 + (Math.random() - 0.5) * 0.2, rtz);
          tile.receiveShadow = true;
          scene.add(tile);
        }
      }
    }

    // --- 4. Shandoran bell / golden idol
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(4, 3, 5, 10, 1, true), goldMat);
    bell.position.set(0, 22, -55);
    scene.add(bell);
    const bellRim = new THREE.Mesh(new THREE.TorusGeometry(4, 0.4, 6, 18), goldMat);
    bellRim.position.set(0, 19.5, -55);
    bellRim.rotation.x = Math.PI / 2;
    scene.add(bellRim);
    const bellMount = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 8), stoneMat);
    bellMount.position.set(0, 26, -55);
    scene.add(bellMount);
    // Bell glow
    const bellGlow = new THREE.PointLight(0xffdd44, 1.0, 40);
    bellGlow.position.set(0, 22, -55);
    scene.add(bellGlow);

    // --- 5. Cloud pillar formations (decorative floating chunks below/around the track)
    const cloudPillarMat = mat(0xe8f8ff);
    [
      [-65, -5, 25], [70, -8, -10], [-40, -10, -50], [50, -6, 55],
    ].forEach(([cpx, cpy, cpz]) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(6 + Math.random() * 4, 5 + Math.random() * 3, 20, 10),
        cloudPillarMat
      );
      pillar.position.set(cpx, cpy, cpz);
      scene.add(pillar);
      const pillarTop = new THREE.Mesh(new THREE.SphereGeometry(8, 8, 6), cloudPillarMat);
      pillarTop.position.set(cpx, cpy + 10, cpz);
      pillarTop.scale.set(1, 0.5, 1);
      scene.add(pillarTop);
    });

    // --- 6. Sky-dive ramp guard rails (at the dramatic drop section)
    const railMat = mat(0xffd700);
    // Mark the dive ramp with golden guard post markers
    for (let rdp = 0; rdp < 8; rdp++) {
      const t = 0.5 + rdp / 80;  // parametric position along dive section
      const pt = curve.getPoint(t);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), railMat);
      post.position.set(pt.x + 6, pt.y + 1.5, pt.z);
      scene.add(post);
      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), railMat);
      postR.position.set(pt.x - 6, pt.y + 1.5, pt.z);
      scene.add(postR);
    }

    // --- 7. Wind-kite decorations (Skypiean cloth kites / windsocks)
    const kiteColors = [0xff4488, 0xffaa00, 0x44ff88, 0x4488ff];
    [
      [-50, 20, 15], [55, 25, -30], [0, 28, -65], [-25, 22, 50],
    ].forEach(([kx, ky, kz], idx) => {
      const kiteCol = kiteColors[idx % kiteColors.length];
      const kite = new THREE.Mesh(
        new THREE.ConeGeometry(3, 8, 5),
        mat(kiteCol, 0x000000, true, 0.8)
      );
      kite.position.set(kx, ky, kz);
      kite.rotation.z = Math.PI / 6;
      kite.castShadow = true;
      scene.add(kite);
      // String (thin cylinder)
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 18, 4), mat(0xdddddd));
      string.position.set(kx - 4, ky - 10, kz);
      string.rotation.z = 0.3;
      scene.add(string);
    });

    // --- 8. Floating golden treasure urns (Shandoran artefacts)
    const urnMat = mat(0xddaa33, 0x664400);
    [
      [-10, 9, -45], [10, 9, -45], [-5, 9, -60], [5, 9, -60],
    ].forEach(([ux, uy, uz]) => {
      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 2.5, 10), urnMat);
      urn.position.set(ux, uy, uz);
      urn.castShadow = true;
      scene.add(urn);
      const urnNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, 0.7, 8), urnMat);
      urnNeck.position.set(ux, uy + 1.6, uz);
      scene.add(urnNeck);
      const urnLid = new THREE.Mesh(new THREE.SphereGeometry(0.5, 7, 6), urnMat);
      urnLid.position.set(ux, uy + 2.3, uz);
      scene.add(urnLid);
      // Handle rings
      [-0.8, 0.8].forEach(off => {
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 5, 10), urnMat);
        handle.position.set(ux + off, uy + 0.5, uz);
        handle.rotation.y = Math.PI / 2;
        scene.add(handle);
      });
    });

    // --- 9. Skypiean tribal totems (carved cylindrical poles)
    const totemMat = mat(0x8b6030);
    const totemColors = [0xff6600, 0x44bb44, 0x4488cc];
    [
      [-58, 3, -8], [62, 3, 15], [-20, 3, 65], [20, 3, 65],
    ].forEach(([tx, ty, tz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 12, 8), totemMat);
      pole.position.set(tx, ty + 6, tz);
      pole.castShadow = true;
      scene.add(pole);
      // Stacked face masks
      [4, 7, 10].forEach((fh, fi) => {
        const face = new THREE.Mesh(
          new THREE.BoxGeometry(3, 2.5, 2),
          mat(totemColors[fi % 3], 0x000000)
        );
        face.position.set(tx, ty + fh, tz);
        scene.add(face);
        // Eyes
        [-0.8, 0.8].forEach(ex => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.35, 5, 4), mat(0xffffff));
          eye.position.set(tx + ex, ty + fh + 0.3, tz + 1.0);
          scene.add(eye);
        });
      });
      // Feather top
      const feather = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 6), mat(0xff4488));
      feather.position.set(tx, ty + 14, tz);
      scene.add(feather);
    });

    // --- 10. Start/finish cloud arch
    const archMat = mat(0xffd700, 0x996600);
    [[-8, 8, 64], [8, 8, 64]].forEach(([ax, ay, az]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 10, 8), archMat);
      post.position.set(ax, ay + 5, az);
      scene.add(post);
    });
    const archTop = new THREE.Mesh(new THREE.TorusGeometry(10, 0.7, 8, 18, Math.PI), archMat);
    archTop.position.set(0, 18, 64);
    archTop.rotation.x = Math.PI / 2;
    scene.add(archTop);

    // ------------------------------------------------------------------ PARTICLES
    // Golden sparkles (Shandoran divine energy)
    TrackBuilder.createParticles(scene, {
      count:  180,
      spread: 80,
      color:  '#ffd700',
      size:   0.14,
      speed:  0.05,
    });
    // White cloud wisps
    TrackBuilder.createParticles(scene, {
      count:  120,
      spread: 100,
      color:  '#eef8ff',
      size:   0.3,
      speed:  0.025,
    });
    // Sky-blue motes
    TrackBuilder.createParticles(scene, {
      count:  80,
      spread: 70,
      color:  '#88ddff',
      size:   0.2,
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
