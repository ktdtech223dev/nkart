import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// MOUNTAIN PASS  –  Nature Cup, Race 2
// Alpine switchback road ascending from valley floor (y=0) to snowy peak
// (y=15) and back. Gravel/stone surface, pine trees, guardrails, snow caps.
// Crisp blue sky. Snow particles on upper sections.
// ---------------------------------------------------------------------------

export const track = {
  id: 'mountain_pass',
  name: 'MOUNTAIN PASS',
  cup: 'nature',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_nature_02',

  skyConfig: {
    topColor:    0x6aaee8,
    bottomColor: 0xb8d4f0,
    fogColor:    0xc8dff5,
    fogDensity:  0.007,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 11;
    const SEGMENTS   = 240;

    // ------------------------------------------------------------------ CURVE
    // Switchback loop: valley -> ascending hairpins -> peak -> descending back.
    // Y goes from 0 (valley) up to 15 (peak) then back to 0.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Valley start
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 20,  0,  15),
        new THREE.Vector3( 35,  0,   5),
        // First switchback hairpin (ascending)
        new THREE.Vector3( 40,  0,  -8),
        new THREE.Vector3( 30,  0, -20),
        new THREE.Vector3( 10,  0, -25),
        // Second switchback
        new THREE.Vector3( -8,  0, -18),
        new THREE.Vector3(-20,  0,  -5),
        new THREE.Vector3(-22,  0,  10),
        // Third switchback (mid height)
        new THREE.Vector3(-15,  0,  22),
        new THREE.Vector3(  0,  0,  28),
        new THREE.Vector3( 15,  0,  22),
        // Peak approach
        new THREE.Vector3( 22,  0,  10),
        new THREE.Vector3( 18,  0,  -5),
        // Peak
        new THREE.Vector3(  5,  0, -15),
        new THREE.Vector3(-10,  0, -18),
        // Descending switchbacks
        new THREE.Vector3(-20,  0, -10),
        new THREE.Vector3(-28,  0,   5),
        new THREE.Vector3(-25,  0,  18),
        new THREE.Vector3(-12,  0,  25),
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
    // Bright crisp alpine sun
    TrackBuilder.createLighting(
      scene,
      0xd0e8ff, 0.7,         // cool ambient
      0xfff5e0, 2.0,         // bright directional sun
      [30, 80, 20],
      true
    );
    // Blue sky fill
    const skyFill = new THREE.PointLight(0x88bbff, 0.3, 200);
    skyFill.position.set(-20, 50, -20);
    scene.add(skyFill);

    // ------------------------------------------------------------------ GROUND (mountain terrain)
    TrackBuilder.createGround(scene, 0x5a7a3a, 300);

    // Snow ground on upper sections (overlay plane at y=13)
    const snowGroundMat = toon('#e8f0f8');
    const snowGround = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), snowGroundMat);
    snowGround.rotation.x = -Math.PI / 2;
    snowGround.position.y = 12.8;
    snowGround.receiveShadow = true;
    scene.add(snowGround);

    // ------------------------------------------------------------------ ROAD (gravel/stone)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#9a8870'); // gravel grey-brown
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre white dividing line
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.09);
    const centreMesh = new THREE.Mesh(
      centreGeo,
      toon('#ffffff', { transparent: true, opacity: 0.7 })
    );
    trackGroup.add(centreMesh);

    // Edge gravel strips (darker)
    [-1, 1].forEach(side => {
      const edgeGeo = TrackBuilder.buildRoad(curve, 0.8, SEGMENTS, 0.06);
      const edge = new THREE.Mesh(
        edgeGeo,
        toon('#6e5e48', { transparent: true, opacity: 0.8 })
      );
      scene.add(edge);
    });

    // ------------------------------------------------------------------ WALLS (guardrails)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.0, 0xdddddd);
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

    // --- 1. Pine trees (cone + cylinder, scattered on slopes)
    const pinePositions = [
      [ 28,  0,  28], [ 32,  0,  22], [ 40,  0,  20], [ 45,  0,  10],
      [-32,  0,  28], [-38,  0,  15], [-40,  0, -10], [-45,  0,   0],
      [ 15,  0, -30], [ 25,  0, -30], [ 10,  0, -38],
      [-10,  0, -30], [-25,  0, -32],
    ];
    pinePositions.forEach(([px, py, pz]) => {
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 4, 7),
        mat(0x5c3310)
      );
      trunk.position.set(px, py + 2, pz);
      trunk.castShadow = true;
      scene.add(trunk);
      // Three-tier foliage cones
      [[0, 6, 5, 4], [1.5, 8.5, 4, 3.2], [3, 10.5, 3, 2.5]].forEach(([yo, yt, rb, rt]) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(rb, yt - yo, 8),
          mat(0x1e5c14)
        );
        cone.position.set(px, py + (yo + yt) / 2, pz);
        cone.castShadow = true;
        scene.add(cone);
      });
      // Snow cap on taller trees on upper pass
      if (py >= 0 && pz < 0) {
        const snowCap = new THREE.Mesh(
          new THREE.ConeGeometry(2.2, 1.5, 8),
          mat(0xeef4ff)
        );
        snowCap.position.set(px, py + 11.5, pz);
        scene.add(snowCap);
      }
    });

    // --- 2. Guardrail posts (metal cylinders along road edge)
    const guardrailMat = mat(0xcccccc);
    const railPostPositions = [];
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const pt = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      [-1, 1].forEach(s => {
        const postPos = pt.clone().addScaledVector(side, s * (ROAD_WIDTH / 2 + 1.5));
        postPos.y -= 0.5;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6),
          guardrailMat
        );
        post.position.copy(postPos);
        post.castShadow = true;
        scene.add(post);
      });
    }

    // --- 3. Metal guardrail beams connecting posts (long flat boxes)
    for (let i = 0; i < 16; i++) {
      const t  = i / 16;
      const t2 = (i + 1) / 16;
      const p1 = curve.getPoint(t);
      const p2 = curve.getPoint(t2);
      const tan = curve.getTangent(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      [-1, 1].forEach(s => {
        const rp1 = p1.clone().addScaledVector(side, s * (ROAD_WIDTH / 2 + 1.5));
        const rp2 = p2.clone().addScaledVector(side, s * (ROAD_WIDTH / 2 + 1.5));
        const mid = rp1.clone().lerp(rp2, 0.5);
        mid.y += 0.8;
        const len = rp1.distanceTo(rp2);
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(len, 0.25, 0.15),
          guardrailMat
        );
        rail.position.copy(mid);
        const dir = rp2.clone().sub(rp1);
        rail.rotation.y = Math.atan2(dir.x, dir.z);
        scene.add(rail);
      });
    }

    // --- 4. Snow boulders on upper pass (white spheres)
    const snowBoulderMat = mat(0xe0ecff);
    [
      [ 10, 14, -12], [-12, 15, -16], [ 18, 15,  -8],
      [ -5, 14,  -5], [ 22, 14, -18],
    ].forEach(([bx, by, bz]) => {
      const r = 1.2 + Math.random() * 1.5;
      const boulder = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), snowBoulderMat);
      boulder.position.set(bx, by + r, bz);
      boulder.castShadow = true;
      scene.add(boulder);
    });

    // --- 5. Mountain face rock cliffs (large grey boxes, background)
    const rockMat = mat(0x7a7060);
    const darkRockMat = mat(0x5a5248);
    [
      [ 60,  20,  0,  20, 40, 15, 0.2],
      [-60,  20, 10,  18, 35, 12, -0.15],
      [  0,  25,-50,  30, 50, 20, 0.05],
    ].forEach(([rx, ry, rz, rw, rh, rd, rotY]) => {
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(rw, rh, rd), rockMat);
      cliff.position.set(rx, ry, rz);
      cliff.rotation.y = rotY;
      cliff.castShadow = true;
      scene.add(cliff);
      // Dark shadow face
      const face = new THREE.Mesh(new THREE.BoxGeometry(rw - 2, rh - 5, 1), darkRockMat);
      face.position.set(rx, ry - 2, rz + rd / 2 + 0.5);
      face.rotation.y = rotY;
      scene.add(face);
    });

    // --- 6. Road warning sign posts (box on cylinder)
    const signMat = mat(0xffd700);
    const signPostMat = mat(0x999999);
    [
      [36,  2,  -6, 0.4], [-18, 8,  12, -0.3], [ 5, 14, -12, 0.1],
    ].forEach(([sx, sy, sz, rot]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 3, 6),
        signPostMat
      );
      post.position.set(sx, sy + 1.5, sz);
      scene.add(post);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.15), signMat);
      sign.position.set(sx, sy + 3.5, sz);
      sign.rotation.y = rot;
      sign.rotation.z = Math.PI / 4; // diamond shape
      scene.add(sign);
    });

    // --- 7. Distant mountain peaks (large cones behind scene)
    const peakMat = mat(0x8a8078);
    const snowPeakMat = mat(0xf0f4ff);
    [
      [100,  0,  50, 25, 70], [-90,  0, 30, 20, 60], [30,  0, -90, 28, 75],
    ].forEach(([mpx, mpy, mpz, r, h]) => {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), peakMat);
      peak.position.set(mpx, mpy + h / 2, mpz);
      scene.add(peak);
      const snowTop = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, h * 0.25, 10), snowPeakMat);
      snowTop.position.set(mpx, mpy + h * 0.82, mpz);
      scene.add(snowTop);
    });

    // --- 8. Fallen log (rotated cylinder, lower section)
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 14, 9),
      mat(0x4a2c0a)
    );
    log.position.set(38, 0.8, -18);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = 0.4;
    log.castShadow = true;
    scene.add(log);

    // ------------------------------------------------------------------ SNOW PARTICLES (upper sections)
    // Dense snow on upper half of track
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      snowPos[i * 3]     = (Math.random() - 0.5) * 70;
      snowPos[i * 3 + 1] = 10 + Math.random() * 20;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xeef4ff,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const snowParticles = new THREE.Points(snowGeo, snowMat);
    scene.add(snowParticles);

    // Light atmosphere mist (lower valley)
    TrackBuilder.createParticles(scene, {
      count:  40,
      spread: 60,
      color:  '#c8dff5',
      size:   0.15,
      speed:  0.01,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'gravel', traction: 0.82, friction: 0.75 },
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
