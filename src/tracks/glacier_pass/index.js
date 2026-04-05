import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// GLACIER PASS  –  Volcano Cup, Race 4
// A glacial surface track. Blue-white ice road threads between crystalline ice
// spires, dark crevasse voids and meltwater streams. Pale blue arctic sky.
// Ice crystal particles. A tight tunnel section bores through the glacier body.
// ---------------------------------------------------------------------------

export const track = {
  id: 'glacier_pass',
  name: 'GLACIER PASS',
  cup: 'volcano',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_volcano_04',

  skyConfig: {
    topColor:    0x8ab8d8,
    bottomColor: 0xc8e0f0,
    fogColor:    0xaad0e8,
    fogDensity:  0.009,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 230;

    // ------------------------------------------------------------------ CURVE
    // Glacier surface: wide sweeping arcs across the ice field, a tight
    // tunnel chicane bored through the glacier core, and a precarious
    // crevasse section with narrow passage.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  48),
        new THREE.Vector3( 20,  0,  40),
        new THREE.Vector3( 38,  0,  22),
        new THREE.Vector3( 46,  0,   0),
        new THREE.Vector3( 40,  0, -20),
        // Tunnel entry
        new THREE.Vector3( 24,  0, -38),
        new THREE.Vector3(  5,  0, -46),
        // Tunnel exit – slight dip through ice
        new THREE.Vector3(-14,  0, -42),
        new THREE.Vector3(-30,  0, -28),
        // Crevasse section – zig-zag
        new THREE.Vector3(-44,  0, -10),
        new THREE.Vector3(-48,  0,  10),
        new THREE.Vector3(-40,  0,  28),
        new THREE.Vector3(-22,  0,  42),
        new THREE.Vector3( -6,  0,  48),
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

    // ------------------------------------------------------------------ LIGHTING (arctic overcast)
    TrackBuilder.createLighting(
      scene,
      0xc8e0f4, 0.7,           // bright cold ambient
      0xddeeff, 1.1,           // diffuse white-blue directional
      [20, 45, 10],
      true
    );
    // Sub-surface ice glow (blue-teal)
    const iceFill = new THREE.PointLight(0x88bbdd, 0.5, 60);
    iceFill.position.set(0, 3, 0);
    scene.add(iceFill);

    const iceFill2 = new THREE.PointLight(0x66aacc, 0.4, 50);
    iceFill2.position.set(-30, 3, -20);
    scene.add(iceFill2);

    // ------------------------------------------------------------------ GROUND (glacier ice surface)
    const iceSurfMat = toon('#d4ecf8', { emissive: new THREE.Color('#0a1825') });
    const iceSurfGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    // Subtle undulations for glacier flow
    const iceVerts = iceSurfGeo.attributes.position;
    for (let i = 0; i < iceVerts.count; i++) {
      const ix = iceVerts.getX(i);
      const iz = iceVerts.getZ(i);
      iceVerts.setY(i, Math.sin(ix * 0.08) * Math.cos(iz * 0.07) * 1.5);
    }
    iceSurfGeo.computeVertexNormals();
    const iceSurfMesh = new THREE.Mesh(iceSurfGeo, iceSurfMat);
    iceSurfMesh.rotation.x = -Math.PI / 2;
    iceSurfMesh.position.y = -0.3;
    iceSurfMesh.receiveShadow = true;
    scene.add(iceSurfMesh);

    // ------------------------------------------------------------------ DEEP ICE LAYER (darker blue-green below)
    const deepIceMat = toon('#224455', { emissive: new THREE.Color('#051015'), transparent: true, opacity: 0.85 });
    const deepIceMesh = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), deepIceMat);
    deepIceMesh.rotation.x = -Math.PI / 2;
    deepIceMesh.position.y = -8;
    scene.add(deepIceMesh);

    // ------------------------------------------------------------------ ROAD (blue-white ice road)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#e8f4ff', { emissive: new THREE.Color('#0a1420') });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Ice traction marks (pale blue strip)
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.09);
    const centreMat = toon('#aaddff', { emissive: new THREE.Color('#001122'), transparent: true, opacity: 0.55 });
    trackGroup.add(new THREE.Mesh(centreGeo, centreMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.4, 0x88bbcc);
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

    // --- 1. Ice spires (crystalline – tall, faceted cones / prisms)
    const spireData = [
      [ 52,  0,  15], [ 55,  0, -5],  [ 50,  0, -25],
      [-52,  0,  10], [-54,  0, -12], [-50,  0,  28],
      [ 20,  0, -55], [-20,  0, -55], [  0,  0, -58],
    ];
    spireData.forEach(([sx, sy, sz], i) => {
      const h = 8 + (i % 4) * 5;
      // Main spire
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.0 + (i % 2) * 0.5, h, 4),
        mat(0xc0e8ff, 0x0a2035)
      );
      spire.position.set(sx, sy + h / 2, sz);
      spire.rotation.y = i * 0.8;
      spire.castShadow = true;
      scene.add(spire);

      // Cluster of smaller spires at base
      for (let cs = 0; cs < 3; cs++) {
        const smallH = h * 0.4;
        const small = new THREE.Mesh(
          new THREE.ConeGeometry(0.4, smallH, 4),
          mat(0xaadcf8, 0x081828)
        );
        const offset = cs * 1.5;
        small.position.set(
          sx + Math.cos(cs * 2.1) * 2,
          sy + smallH / 2,
          sz + Math.sin(cs * 2.1) * 2
        );
        small.rotation.y = cs * 1.3;
        scene.add(small);
      }
    });

    // --- 2. Crevasse voids (dark elongated boxes cutting the surface)
    const crevasseData = [
      [-42, 0, -10, 18, 0, 3], [-46, 0,  10, 16, 0, 2.5],
      [ 30, 0, -44, 14, 0, 2], [-20, 0, -52, 20, 0, 2.5],
      [ 50, 0,  30, 12, 0, 2],
    ];
    crevasseData.forEach(([cx, cy, cz, cl, ch, cw], i) => {
      // Dark void surface
      const crevasse = new THREE.Mesh(
        new THREE.BoxGeometry(cl, 0.4, cw),
        mat(0x080c12, 0x010204)
      );
      crevasse.position.set(cx, cy - 0.1, cz);
      crevasse.rotation.y = i * 0.35;
      scene.add(crevasse);

      // Crevasse walls (darker deep sides)
      const sideL = new THREE.Mesh(
        new THREE.BoxGeometry(cl, 5, 0.2),
        mat(0x0a1520)
      );
      sideL.position.set(cx, cy - 2.5, cz - cw / 2);
      sideL.rotation.y = i * 0.35;
      scene.add(sideL);
      const sideR = sideL.clone();
      sideR.position.set(cx, cy - 2.5, cz + cw / 2);
      scene.add(sideR);

      // Glow from within (icy blue-green)
      const crevasseGlow = new THREE.PointLight(0x224455, 0.6, 12);
      crevasseGlow.position.set(cx, cy - 3, cz);
      scene.add(crevasseGlow);
    });

    // --- 3. Glacier tunnel (cylinder arch segments)
    // Sits at t≈0.35–0.50 on curve (right side, through glacier core)
    const tunnelGrp = new THREE.Group();
    scene.add(tunnelGrp);

    const tunnelLen = 24;
    const tunnelSegCount = 10;
    for (let ti = 0; ti <= tunnelSegCount; ti++) {
      const frac = ti / tunnelSegCount;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(6.5, 1.0, 8, 14),
        mat(0x88ccee, 0x0a2030)
      );
      ring.position.set(
        24 - frac * tunnelLen,
        -3,
        -38 - frac * 8
      );
      ring.rotation.y = Math.PI / 2 + 0.15;
      ring.castShadow = true;
      tunnelGrp.add(ring);
    }

    // Tunnel ceiling fill (opaque ice block)
    const tunnelCeil = new THREE.Mesh(
      new THREE.BoxGeometry(tunnelLen + 4, 2, 14),
      mat(0x99ccdd, 0x0a1822)
    );
    tunnelCeil.position.set(12, 4.5, -42);
    tunnelCeil.rotation.y = 0.15;
    scene.add(tunnelCeil);

    // Tunnel glow
    const tunnelGlow1 = new THREE.PointLight(0x55aacc, 0.8, 22);
    tunnelGlow1.position.set(18, -1, -40);
    scene.add(tunnelGlow1);
    const tunnelGlow2 = new THREE.PointLight(0x44aacc, 0.7, 22);
    tunnelGlow2.position.set(2, -1, -46);
    scene.add(tunnelGlow2);

    // --- 4. Meltwater streams (thin luminous planes)
    const streamMat = toon('#66bbdd', { emissive: new THREE.Color('#102028'), transparent: true, opacity: 0.65 });
    const streamData = [
      [ 10, 0,  35, 22, 0, 1.5, 0.1],
      [-15, 0,  38, 20, 0, 1.2, -0.15],
      [ 38, 0,  10, 18, 0, 1.0,  0.05],
    ];
    streamData.forEach(([sx, sy, sz, sl, sh, sw, ry]) => {
      const stream = new THREE.Mesh(
        new THREE.BoxGeometry(sl, 0.15, sw),
        streamMat
      );
      stream.position.set(sx, sy + 0.02, sz);
      stream.rotation.y = ry;
      scene.add(stream);
    });

    // --- 5. Snowdrift mounds (flat-squashed spheres)
    const snowdriftData = [
      [ 55,  0,  50], [-55,  0,  50], [ 55,  0, -50],
      [-55,  0, -50], [  0,  0, -65], [  0,  0,  65],
      [ 65,  0,   0], [-65,  0,   0],
    ];
    snowdriftData.forEach(([dx, dy, dz], i) => {
      const snowdrift = new THREE.Mesh(
        new THREE.SphereGeometry(10 + (i % 3) * 3, 10, 6),
        mat(0xeef6ff)
      );
      snowdrift.scale.set(1.3, 0.18, 1.3);
      snowdrift.position.set(dx, dy + 0.9, dz);
      snowdrift.receiveShadow = true;
      scene.add(snowdrift);
    });

    // --- 6. Ice boulders (irregular spheres)
    const iceBoulderData = [
      [ 58, 0,  30], [ 60, 0, -20], [-58, 0,  20],
      [-60, 0, -30], [ 25, 0,  58], [-25, 0, -58],
    ];
    iceBoulderData.forEach(([bx, by, bz], i) => {
      const r = 2.5 + (i % 3) * 1.5;
      const boulder = new THREE.Mesh(
        new THREE.SphereGeometry(r, 7, 6),
        mat(0xbbd8ee, 0x08151e)
      );
      boulder.position.set(bx, by + r, bz);
      boulder.castShadow = true;
      scene.add(boulder);
    });

    // --- 7. Frozen waterfall (flat box cascade on background wall)
    const fwMat = mat(0x99ccee, 0x0a1a26);
    for (let fw = 0; fw < 4; fw++) {
      const slice = new THREE.Mesh(
        new THREE.BoxGeometry(4 - fw * 0.5, 12, 0.5),
        fwMat
      );
      slice.position.set(-65 + fw * 1.5, 6, -20 + fw * 2);
      slice.rotation.y = 0.05 * fw;
      scene.add(slice);
    }
    // Frozen pool at base
    const frozenPool = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 0.3, 16),
      mat(0x88bbdd, 0x081525)
    );
    frozenPool.position.set(-62, 0.1, -16);
    scene.add(frozenPool);

    // --- 8. Arctic rime formations (box clusters on walls)
    const rimeMat = mat(0xddeefc, 0x080f18);
    [[ 54, 0, -35], [-54, 0, 28], [ 30, 0, 56]].forEach(([rx, ry, rz], ri) => {
      for (let r = 0; r < 5; r++) {
        const rime = new THREE.Mesh(
          new THREE.BoxGeometry(0.5 + r * 0.2, 3 + r * 1.5, 0.5),
          rimeMat
        );
        rime.position.set(
          rx + (r - 2) * 1.2,
          ry + (3 + r * 1.5) / 2,
          rz
        );
        rime.rotation.z = (r - 2) * 0.05;
        scene.add(rime);
      }
    });

    // --- 9. Broken ice slabs (flat tilted boxes)
    const slabData = [
      [-35, 0,  52, 0.25, 0.4], [ 45, 0,  42, -0.2, -0.3],
      [-48, 0, -38, 0.15,  0.5], [ 48, 0, -42, -0.3, -0.2],
    ];
    slabData.forEach(([sx, sy, sz, rx, rz]) => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.5, 4),
        mat(0xc8e4f8, 0x081520)
      );
      slab.position.set(sx, sy + 1, sz);
      slab.rotation.x = rx;
      slab.rotation.z = rz;
      slab.castShadow = true;
      scene.add(slab);
    });

    // --- 10. Survey marker pole (distant navigation reference)
    const poleMat = mat(0xdd2200);
    const poleData = [[40, 0, 52], [-40, 0, 52], [40, 0, -52], [-40, 0, -52]];
    poleData.forEach(([px, py, pz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
        poleMat
      );
      pole.position.set(px, py + 4, pz);
      scene.add(pole);
      // Horizontal flag
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.5, 0.1),
        mat(0xee3300, 0x440800)
      );
      flag.position.set(px + 1.25, py + 7.5, pz);
      scene.add(flag);
    });

    // ------------------------------------------------------------------ ICE CRYSTAL PARTICLES (60)
    TrackBuilder.createParticles(scene, {
      count:  60,
      spread: 70,
      color:  '#c8e8ff',
      size:   0.20,
      speed:  0.03,
    });

    // Finer glitter particles
    TrackBuilder.createParticles(scene, {
      count:  40,
      spread: 50,
      color:  '#ffffff',
      size:   0.08,
      speed:  0.02,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'ice',      traction: 0.45, friction: 0.30 },
      { type: 'snowpack', traction: 0.70, friction: 0.60 },
    ];

    const hazards = [
      { type: 'crevasse', position: new THREE.Vector3(-44, -3, -10), radius: 5 },
      { type: 'crevasse', position: new THREE.Vector3(-20, -3, -50), radius: 4 },
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
