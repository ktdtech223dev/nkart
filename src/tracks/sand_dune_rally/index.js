import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// SAND DUNE RALLY  –  Volcano Cup, Race 3
// A desert canyon track under brutal midday sun. Sand-coloured road threads
// past sandstone arches, broken columns, cacti and a distant shimmering oasis.
// Rolling dune hills at curve elevation changes. Sand drift particles.
// ---------------------------------------------------------------------------

export const track = {
  id: 'sand_dune_rally',
  name: 'SAND DUNE RALLY',
  cup: 'volcano',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_volcano_03',

  skyConfig: {
    topColor:    0x5588cc,
    bottomColor: 0xddbb88,
    fogColor:    0xc8a870,
    fogDensity:  0.010,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 230;

    // ------------------------------------------------------------------ CURVE
    // Desert canyon route: long straights along canyon walls, tight arch
    // chicane, oasis sweep and dune-hill elevation changes.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  50),
        new THREE.Vector3( 20,  0,  42),
        new THREE.Vector3( 40,  0,  25),
        // Arch chicane (slight elevation, canyon walls narrow)
        new THREE.Vector3( 48,  0,   5),
        new THREE.Vector3( 44,  0, -15),
        new THREE.Vector3( 28,  0, -36),
        // Dune hill climb
        new THREE.Vector3( 10,  0, -46),
        new THREE.Vector3( -8,  0, -44),
        new THREE.Vector3(-24,  0, -34),
        // Oasis sweep (wide gentle curve)
        new THREE.Vector3(-42,  0, -18),
        new THREE.Vector3(-50,  0,   0),
        new THREE.Vector3(-44,  0,  18),
        // Dune descent back
        new THREE.Vector3(-28,  0,  36),
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

    // ------------------------------------------------------------------ LIGHTING (brutal midday)
    TrackBuilder.createLighting(
      scene,
      0xfff0cc, 0.65,          // bright warm ambient
      0xfffbe0, 2.2,           // strong overhead directional
      [5, 50, 5],              // nearly overhead sun
      true
    );
    // Heat shimmer fill
    const heatFill = new THREE.PointLight(0xffcc88, 0.4, 80);
    heatFill.position.set(0, 5, 0);
    scene.add(heatFill);

    // ------------------------------------------------------------------ GROUND (sand)
    const sandMat = toon('#d4aa60');
    const sandGeo = new THREE.PlaneGeometry(200, 200, 40, 40);
    // Subtle dune undulation
    const sandVerts = sandGeo.attributes.position;
    for (let i = 0; i < sandVerts.count; i++) {
      const sx = sandVerts.getX(i);
      const sz = sandVerts.getZ(i);
      sandVerts.setY(i, Math.sin(sx * 0.06) * Math.cos(sz * 0.05) * 2.0);
    }
    sandGeo.computeVertexNormals();
    const sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.rotation.x = -Math.PI / 2;
    sandMesh.position.y = -0.2;
    sandMesh.receiveShadow = true;
    scene.add(sandMesh);

    // ------------------------------------------------------------------ ROAD (sand-coloured packed earth)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#c8a85a');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Faint centre marking (white dash)
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.09);
    const centreMat = toon('#ffeecc', { transparent: true, opacity: 0.5 });
    trackGroup.add(new THREE.Mesh(centreGeo, centreMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.0, 0xb89050);
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

    // --- 1. Sandstone arches (two half-tori + side columns)
    const archData = [
      [ 48, 0,  5, 0], [ -4, 0, -46, Math.PI / 4],
    ];
    archData.forEach(([ax, ay, az, ry], archIdx) => {
      // Left pillar
      const pillarL = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2.0, 10, 8),
        mat(0xc8904a)
      );
      pillarL.position.set(ax - 7, ay + 5, az);
      pillarL.rotation.y = ry;
      pillarL.castShadow = true;
      scene.add(pillarL);

      // Right pillar
      const pillarR = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2.0, 10, 8),
        mat(0xc8904a)
      );
      pillarR.position.set(ax + 7, ay + 5, az);
      pillarR.rotation.y = ry;
      pillarR.castShadow = true;
      scene.add(pillarR);

      // Arch lintel
      const lintel = new THREE.Mesh(
        new THREE.TorusGeometry(7, 1.5, 6, 16, Math.PI),
        mat(0xb87f3a)
      );
      lintel.position.set(ax, ay + 10, az);
      lintel.rotation.x = -Math.PI / 2;
      lintel.rotation.y = ry;
      lintel.castShadow = true;
      scene.add(lintel);
    });

    // --- 2. Desert ruins – broken columns (various heights, tilted)
    const columnData = [
      [ 30, 0, -48, 0.10], [ 38, 0, -44, -0.12], [ 22, 0, -50, 0.08],
      [-30, 0,  42, -0.15], [-38, 0,  38,  0.12], [-22, 0,  44,  0.10],
      [ 54, 0, -28,  0.05], [-54, 0,  14, -0.08],
    ];
    columnData.forEach(([cx, cy, cz, tilt], i) => {
      const h = 3 + (i % 4) * 2;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.1, h, 8),
        mat(0xd4a060)
      );
      col.position.set(cx, cy + h / 2, cz);
      col.rotation.z = tilt;
      col.castShadow = true;
      scene.add(col);

      // Fallen capital (flat cylinder)
      if (i % 2 === 0) {
        const capital = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.4, 0.5, 8),
          mat(0xc89850)
        );
        capital.position.set(cx + tilt * 10, cy + 0.25, cz);
        capital.rotation.z = Math.PI / 2;
        scene.add(capital);
      }
    });

    // --- 3. Cacti (cylinders with arm cylinders)
    const cactiPositions = [
      [-15, 0, -55], [ 15, 0, -55], [-55, 0,  15],
      [-55, 0, -15], [ 55, 0,  30], [-20, 0,  55],
      [ 20, 0,  55], [ 55, 0, -20],
    ];
    cactiPositions.forEach(([cax, cay, caz], i) => {
      const h = 5 + (i % 3) * 2;
      const cactus = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, h, 8),
        mat(0x3a6a2a)
      );
      cactus.position.set(cax, cay + h / 2, caz);
      cactus.castShadow = true;
      scene.add(cactus);

      // Arms (horizontal + vertical segments)
      const armDir = i % 2 === 0 ? 1 : -1;
      const armH = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 3, 8),
        mat(0x3a6a2a)
      );
      armH.rotation.z = Math.PI / 2;
      armH.position.set(cax + armDir * 1.5, cay + h * 0.55, caz);
      scene.add(armH);

      const armV = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 2.5, 8),
        mat(0x3a6a2a)
      );
      armV.position.set(cax + armDir * 3, cay + h * 0.55 + 1.25, caz);
      scene.add(armV);
    });

    // --- 4. Oasis (palm trees + water pool) – left side near apex
    const oasisCenter = new THREE.Vector3(-50, 0, 0);

    // Oasis water pool
    const oasisPool = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 0.4, 24),
      mat(0x1a6888, 0x004455)
    );
    oasisPool.position.set(oasisCenter.x, -0.05, oasisCenter.z);
    scene.add(oasisPool);

    // Palm trees
    const palmData = [
      [-66, 0, -8, 0.18], [-66, 0, 8, -0.15], [-58, 0, -14, 0.12],
      [-58, 0, 14, -0.2], [-70, 0, 0,  0.08],
    ];
    palmData.forEach(([px, py, pz, lean], pi) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 10, 8),
        mat(0x8b6914)
      );
      trunk.position.set(px, py + 5, pz);
      trunk.rotation.z = lean;
      trunk.castShadow = true;
      scene.add(trunk);
      // Palm fronds (flat cones splayed around top)
      const frondCount = 6;
      for (let f = 0; f < frondCount; f++) {
        const angle = (f / frondCount) * Math.PI * 2;
        const frond = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 5, 5),
          mat(0x2d7a2a)
        );
        frond.position.set(
          px + Math.cos(angle) * 3,
          py + 10.5,
          pz + Math.sin(angle) * 3
        );
        frond.rotation.z = -0.7 + lean;
        frond.rotation.y = angle;
        scene.add(frond);
      }
    });

    // --- 5. Rolling dune hills (large squashed spheres along elevation changes)
    const duneData = [
      [  5,  0, -50], [ 15,  0, -52], [-10,  0, -50],
      [-30,  0,  40], [-38,  0,  35], [ 40,  0,  30],
      [ 50,  0, -5],  [-52,  0,  5],
    ];
    duneData.forEach(([dx, dy, dz], i) => {
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(10 + (i % 3) * 4, 10, 6),
        mat(0xd4a860)
      );
      dune.scale.set(1.2, 0.28, 1.2);
      dune.position.set(dx, dy + 1, dz);
      dune.receiveShadow = true;
      scene.add(dune);
    });

    // --- 6. Sandstone canyon walls (tall boxes on outer edges)
    const wallData = [
      [ 65, 0,  0, 3, 28, 40], [-65, 0, 0, 3, 28, 40],
      [  0, 0, 65, 40, 28,  3], [  0, 0,-65, 40, 28,  3],
    ];
    wallData.forEach(([wx, wy, wz, ww, wh, wd]) => {
      const canyonWall = new THREE.Mesh(
        new THREE.BoxGeometry(ww, wh, wd),
        mat(0xb87e3a)
      );
      canyonWall.position.set(wx, wy + wh / 2, wz);
      canyonWall.castShadow = true;
      scene.add(canyonWall);
      // Layered striations
      for (let layer = 0; layer < 4; layer++) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(ww + 0.1, 1.5, wd + 0.1),
          mat(layer % 2 === 0 ? 0xa87030 : 0xc89050)
        );
        stripe.position.set(wx, wy + 4 + layer * 6, wz);
        scene.add(stripe);
      }
    });

    // --- 7. Skull / bones (bleached box + sphere)
    const skullMat = mat(0xeeddcc);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), skullMat);
    skull.position.set(32, 0.8, 40);
    scene.add(skull);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), skullMat);
    jaw.position.set(32, 0.2, 40.5);
    scene.add(jaw);
    // Rib bones
    for (let rb = 0; rb < 4; rb++) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 5), skullMat);
      rib.position.set(32 + (rb - 1.5) * 0.6, 0.3, 42);
      rib.rotation.z = Math.PI / 2;
      scene.add(rib);
    }

    // --- 8. Heat shimmer mirages (transparent flat planes at ground level)
    const mirageMat = toon('#aaccff', { emissive: new THREE.Color('#112233'), transparent: true, opacity: 0.18 });
    const mirage1 = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), mirageMat);
    mirage1.rotation.x = -Math.PI / 2;
    mirage1.position.set(-60, 0.05, -30);
    scene.add(mirage1);

    const mirage2 = new THREE.Mesh(new THREE.PlaneGeometry(25, 12), mirageMat);
    mirage2.rotation.x = -Math.PI / 2;
    mirage2.position.set(55, 0.05, 40);
    scene.add(mirage2);

    // --- 9. Tumbleweed (small torus clusters)
    const tumbleweedMat = mat(0x8a7040);
    [[24, 0.8, 48], [-40, 0.8, -42], [52, 0.8, -42]].forEach(([tx, ty, tz]) => {
      const tw = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.35, 6, 12), tumbleweedMat);
      tw.position.set(tx, ty, tz);
      tw.rotation.x = Math.random() * Math.PI;
      scene.add(tw);
      const tw2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.28, 6, 12), tumbleweedMat);
      tw2.position.set(tx, ty, tz);
      tw2.rotation.y = Math.PI / 3;
      scene.add(tw2);
    });

    // --- 10. Ancient stone markers (small obelisks)
    const obeliskData = [
      [ 38, 0,  48], [-38, 0,  48], [ 38, 0, -48], [-38, 0, -48],
    ];
    obeliskData.forEach(([ox, oy, oz]) => {
      const shaft = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 8, 1.5),
        mat(0xc89040)
      );
      shaft.position.set(ox, oy + 4, oz);
      shaft.castShadow = true;
      scene.add(shaft);
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 2, 4),
        mat(0xb87830)
      );
      tip.position.set(ox, oy + 9, oz);
      scene.add(tip);
    });

    // ------------------------------------------------------------------ SAND DRIFT PARTICLES (100)
    TrackBuilder.createParticles(scene, {
      count:  100,
      spread: 80,
      color:  '#d4a860',
      size:   0.16,
      speed:  0.06,
    });

    // Fine dust motes
    TrackBuilder.createParticles(scene, {
      count:  40,
      spread: 60,
      color:  '#eecc88',
      size:   0.08,
      speed:  0.03,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'sand',         traction: 0.65, friction: 0.55 },
      { type: 'packed_earth', traction: 0.88, friction: 0.82 },
    ];

    const hazards = [
      { type: 'sandstorm', position: new THREE.Vector3(0, 0, 0), radius: 8 },
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
