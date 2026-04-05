import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// FROZEN TUNDRA  –  Nature Cup, Race 4
// Arctic frozen wasteland. Ice/snow ground, igloos, ice boulders, frozen
// trees, blizzard zone, frozen river section. Heavy snowfall (200 particles).
// Pale white-blue sky.
// ---------------------------------------------------------------------------

export const track = {
  id: 'frozen_tundra',
  name: 'FROZEN TUNDRA',
  cup: 'nature',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_nature_04',

  skyConfig: {
    topColor:    0xaac8e0,
    bottomColor: 0xddeeff,
    fogColor:    0xc8dcee,
    fogDensity:  0.016,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 12;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Arctic circuit: flat tundra loop with frozen river crossing section.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  42),
        new THREE.Vector3( 22,  0,  35),
        new THREE.Vector3( 38,  0,  16),
        new THREE.Vector3( 42,  0,  -6),
        new THREE.Vector3( 36,  0, -24),
        new THREE.Vector3( 18,  0, -34),
        new THREE.Vector3( -4,  0, -38),
        new THREE.Vector3(-22,  0, -32),
        new THREE.Vector3(-36,  0, -16),
        new THREE.Vector3(-40,  0,   6),
        new THREE.Vector3(-36,  0,  24),
        new THREE.Vector3(-22,  0,  36),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY + FOG (blizzard haze)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING
    // Pale cold overcast light
    TrackBuilder.createLighting(
      scene,
      0xb8cce0, 0.9,         // cold blue-grey ambient
      0xd0e8ff, 1.4,         // pale white directional
      [20, 60, 30],
      true
    );
    // Cold rim light (blizzard backlight)
    const rimLight = new THREE.PointLight(0x88bbcc, 0.4, 150);
    rimLight.position.set(-30, 30, -30);
    scene.add(rimLight);

    // ------------------------------------------------------------------ GROUND (ice & snow)
    // Deep snow ground
    const snowGroundMat = toon('#ddeeff');
    const snowGround = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), snowGroundMat);
    snowGround.rotation.x = -Math.PI / 2;
    snowGround.position.y = -0.15;
    snowGround.receiveShadow = true;
    scene.add(snowGround);

    // Frozen river section (blue-white ice plane)
    const iceMat = toon('#88bbcc', { emissive: new THREE.Color('#112233'), transparent: true, opacity: 0.9 });
    const iceRiver = new THREE.Mesh(new THREE.PlaneGeometry(20, 40), iceMat);
    iceRiver.rotation.x = -Math.PI / 2;
    iceRiver.position.set(-3, -0.08, -34);
    iceRiver.receiveShadow = true;
    scene.add(iceRiver);

    // Ice cracks on frozen river
    const crackMat = toon('#445566', { transparent: true, opacity: 0.4 });
    [[-5, -30], [0, -34], [4, -38], [-3, -42]].forEach(([cx, cz]) => {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 6), crackMat);
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = Math.random() * Math.PI;
      crack.position.set(cx, -0.05, cz);
      scene.add(crack);
    });

    // ------------------------------------------------------------------ ROAD (compressed ice/snow surface)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#c8dce8'); // pale ice
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Tyre track marks (subtle darker strip)
    const tyreTrackGeo = TrackBuilder.buildRoad(curve, 0.6, SEGMENTS, 0.08);
    const tyreTrackMesh = new THREE.Mesh(
      tyreTrackGeo,
      toon('#99aabb', { transparent: true, opacity: 0.5 })
    );
    trackGroup.add(tyreTrackMesh);

    // ------------------------------------------------------------------ WALLS (snow banks)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0xddeeff);
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

    // --- 1. Igloos (hemisphere + cylinder entrance tunnel)
    const iglooPositions = [
      [ 30,  0,  22], [-30,  0,  22], [ 38,  0, -28],
    ];
    iglooPositions.forEach(([ix, iy, iz]) => {
      // Dome body
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat(0xe8f4ff)
      );
      dome.position.set(ix, iy, iz);
      dome.castShadow = true;
      scene.add(dome);

      // Snow texture blocks (stacked ring seams)
      for (let row = 0; row < 3; row++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(5 * Math.cos(row * 0.35), 0.15, 6, 18),
          mat(0xc8dcee)
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(ix, iy + row * 1.6 + 0.5, iz);
        scene.add(ring);
      }

      // Entrance tunnel (short half-cylinder)
      const tunnel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3.5, 8, 1, true, 0, Math.PI),
        mat(0xddeeff)
      );
      tunnel.rotation.z = Math.PI / 2;
      tunnel.rotation.y = Math.PI / 4;
      tunnel.position.set(ix + 4, iy + 1.5, iz);
      scene.add(tunnel);
    });

    // --- 2. Ice boulders (irregular white-blue spheres)
    const iceBoulderMat = toon('#aaccdd', { emissive: new THREE.Color('#112233'), transparent: true, opacity: 0.85 });
    const boulderPositions = [
      [ 20,  0, -18, 2.5], [-22,  0, -20, 3.0], [ 42,  0,  14, 2.0],
      [-42,  0,  10, 2.8], [ 28,  0,  35, 1.8], [-25,  0,  35, 2.2],
      [ 10,  0, -44, 1.5], [-14,  0, -44, 2.0],
    ];
    boulderPositions.forEach(([bx, by, bz, br]) => {
      const boulder = new THREE.Mesh(
        new THREE.SphereGeometry(br, 8, 7),
        iceBoulderMat
      );
      boulder.position.set(bx, by + br * 0.5, bz);
      boulder.scale.set(1, 0.75, 1.1); // slightly squashed
      boulder.castShadow = true;
      scene.add(boulder);
      // Snow cap on top
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(br * 0.7, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.4),
        mat(0xf0f8ff)
      );
      cap.position.set(bx, by + br * 1.1, bz);
      scene.add(cap);
    });

    // --- 3. Frozen dead trees (trunk + bare branches)
    const frozenTreePositions = [
      [ 46,  0, -10], [-46,  0,   5], [ 25,  0, -42],
      [-25,  0,  42], [ 46,  0,  25], [-46,  0, -20],
    ];
    frozenTreePositions.forEach(([tx, ty, tz]) => {
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 8, 7),
        mat(0x556677)
      );
      trunk.position.set(tx, ty + 4, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      // Branches (short diagonal cylinders)
      const branchAngles = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
      branchAngles.forEach((angle, i) => {
        const branchH = 3 - i * 0.2;
        const branch = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.2, branchH, 6),
          mat(0x556677)
        );
        branch.position.set(
          tx + Math.cos(angle) * 1.2,
          ty + 5 + i * 0.8,
          tz + Math.sin(angle) * 1.2
        );
        branch.rotation.z = Math.cos(angle) * 0.6;
        branch.rotation.x = -Math.sin(angle) * 0.6;
        scene.add(branch);
      });

      // Ice icicles hanging from branches
      [0, 1, 2].forEach(j => {
        const icicle = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.8 + Math.random() * 0.5, 5),
          toon('#aaddff', { emissive: new THREE.Color('#112233'), transparent: true, opacity: 0.8 })
        );
        icicle.position.set(
          tx + (Math.random() - 0.5) * 2,
          ty + 5 - 0.4,
          tz + (Math.random() - 0.5) * 2
        );
        icicle.rotation.z = Math.PI; // point down
        scene.add(icicle);
      });
    });

    // --- 4. Blizzard zone concept – dense particle wall & wind marker flags
    // Wind direction flags (poles with flat planes)
    const flagMat = mat(0xff4444);
    const blizzardFlagPositions = [
      [-14, 0, -30], [-10, 0, -36], [-6, 0, -38],
    ];
    blizzardFlagPositions.forEach(([fx, fy, fz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 5, 6),
        mat(0xaaaaaa)
      );
      pole.position.set(fx, fy + 2.5, fz);
      scene.add(pole);

      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1),
        flagMat
      );
      flag.position.set(fx + 1, fy + 5, fz);
      flag.rotation.y = 0.3;
      scene.add(flag);
    });

    // --- 5. Northern lights (faint aurora planes in sky)
    const auroraColors = [0x00ff88, 0x0088ff, 0xaa00ff];
    auroraColors.forEach((col, i) => {
      const aurora = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 20),
        toon('#' + (col >>> 0).toString(16).padStart(6, '0'), { emissive: new THREE.Color(col), emissiveIntensity: 0.15, transparent: true, opacity: 0.08 })
      );
      aurora.position.set(-10 + i * 15, 45, -60);
      aurora.rotation.x = -0.2;
      aurora.rotation.y = 0.1 * i;
      scene.add(aurora);
    });

    // --- 6. Supply crates / expedition equipment (boxes)
    const crateMat = mat(0x886633);
    const metalMat = mat(0x888888);
    [
      [ 44,  0, -4], [-20,  0,  15], [ 15,  0, -38],
    ].forEach(([ex, ey, ez]) => {
      // Wooden crate
      const crate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 2.5), crateMat);
      crate.position.set(ex, ey + 1, ez);
      crate.castShadow = true;
      scene.add(crate);

      // Metal band around crate
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.6), metalMat);
      band.position.set(ex, ey + 1, ez);
      scene.add(band);
    });

    // --- 7. Ice wall formations (flat large boxes as background terrain)
    const iceWallMat = toon('#aaccdd', { emissive: new THREE.Color('#081824'), transparent: true, opacity: 0.75 });
    [
      [ 65, 8, 0, 8, 16, 20, 0],
      [-65, 8, 0, 8, 14, 24, 0.1],
      [  0, 8, 65, 20, 16, 8, 0],
    ].forEach(([wx, wy, wz, wd, wh, ww, rotY]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(wd, wh, ww), iceWallMat);
      wall.position.set(wx, wy, wz);
      wall.rotation.y = rotY;
      wall.castShadow = true;
      scene.add(wall);
    });

    // --- 8. Snowdrift mounds (half-spheres, low flat bumps)
    const driftMat = mat(0xeef5ff);
    [
      [30, 0, 15, 3], [-32, 0, -5, 4], [0, 0, 42, 3.5],
      [42, 0, 30, 2.5], [-42, 0, 28, 3],
    ].forEach(([dx, dy, dz, dr]) => {
      const drift = new THREE.Mesh(
        new THREE.SphereGeometry(dr, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.4),
        driftMat
      );
      drift.position.set(dx, dy, dz);
      drift.receiveShadow = true;
      scene.add(drift);
    });

    // ------------------------------------------------------------------ HEAVY SNOWFALL PARTICLES (200)
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      snowPos[i * 3]     = (Math.random() - 0.5) * 100;
      snowPos[i * 3 + 1] = Math.random() * 25;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xeef8ff,
      size: 0.28,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const blizzardSnow = new THREE.Points(snowGeo, snowMat);
    scene.add(blizzardSnow);

    // Blizzard zone extra dense particles near frozen river
    const blizzardGeo = new THREE.BufferGeometry();
    const blizzardPos = new Float32Array(80 * 3);
    for (let i = 0; i < 80; i++) {
      blizzardPos[i * 3]     = -8 + (Math.random() - 0.5) * 28;
      blizzardPos[i * 3 + 1] = Math.random() * 15;
      blizzardPos[i * 3 + 2] = -28 + (Math.random() - 0.5) * 20;
    }
    blizzardGeo.setAttribute('position', new THREE.BufferAttribute(blizzardPos, 3));
    const blizzardMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.22,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    scene.add(new THREE.Points(blizzardGeo, blizzardMat));

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'ice', traction: 0.55, friction: 0.4 },
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
