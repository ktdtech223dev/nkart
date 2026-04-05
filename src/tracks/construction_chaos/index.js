import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// CONSTRUCTION CHAOS  –  City Cup, Race 4
// Active construction site chaos. Dirt ground, scaffolding poles, concrete
// mixer, rebar bundles, a narrow elevated crane-arm section, and plenty of
// dust particles. Industrial palette – dirty yellows, greys, rust.
// ---------------------------------------------------------------------------

export const track = {
  id: 'construction_chaos',
  name: 'CONSTRUCTION CHAOS',
  cup: 'city',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_city_04',

  skyConfig: {
    topColor:    0x6b7c8e,
    bottomColor: 0xa8906a,
    fogColor:    0x8e7a5a,
    fogDensity:  0.016,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Winding site loop: ground-level dirt sections, a tight turn around the
    // concrete mixer, narrow elevated crane arm section (raised segment),
    // and a ramp back down through the scaffolding yard.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Start – site entrance
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 18,  0,   0),
        new THREE.Vector3( 35,  0,   5),
        // Loop around concrete mixer area
        new THREE.Vector3( 46,  0,  18),
        new THREE.Vector3( 48,  0,  34),
        new THREE.Vector3( 40,  0,  48),
        new THREE.Vector3( 22,  0,  55),
        // Wide dirt straight
        new THREE.Vector3(  0,  0,  55),
        new THREE.Vector3(-22,  0,  50),
        // Ramp up to crane arm section
        new THREE.Vector3(-36,  0,  38),
        new THREE.Vector3(-42,  0,  24),
        // Elevated crane-arm (narrow, high)
        new THREE.Vector3(-44,  0,  10),
        new THREE.Vector3(-42,  0,  -5),
        new THREE.Vector3(-36,  0, -16),
        // Ramp back down
        new THREE.Vector3(-24,  0, -22),
        new THREE.Vector3(-10,  0, -20),
        // Return straight with chicane
        new THREE.Vector3(  2,  0, -15),
        new THREE.Vector3( 10,  0,  -8),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY + FOG (hazy overcast)
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING (overcast industrial)
    TrackBuilder.createLighting(
      scene,
      0x9aaa88, 0.9,          // warm dusty ambient
      0xffeedd, 1.4,          // soft diffuse sun through haze
      [30, 50, -20],
      true
    );

    // Work-light point lights (construction site halogens)
    [
      [ 48, 8,  26],
      [ 25, 8,  57],
      [-42, 8,  10],
      [-30, 8, -20],
      [  0, 8,  -5],
    ].forEach(([x, y, z]) => {
      const workLight = new THREE.PointLight(0xffdd88, 1.5, 55);
      workLight.position.set(x, y, z);
      scene.add(workLight);
    });

    // ------------------------------------------------------------------ GROUND (dirt / mud)
    const dirtMat = toon('#7a5c38'); // earthy brown
    const dirtGeo = new THREE.PlaneGeometry(300, 300);
    const dirtMesh = new THREE.Mesh(dirtGeo, dirtMat);
    dirtMesh.rotation.x = -Math.PI / 2;
    dirtMesh.position.y = -0.12;
    dirtMesh.receiveShadow = true;
    scene.add(dirtMesh);

    // Muddy tread-marks (darker strips)
    const mudMat = toon('#5a3e22', { transparent: true, opacity: 0.55 });
    [
      { pos: [10,  0,  15], size: [3, 40] },
      { pos: [22,  0,  30], size: [2.5, 35] },
      { pos: [-10, 0, -10], size: [2, 30] },
    ].forEach(({ pos, size }) => {
      const rut = new THREE.Mesh(new THREE.PlaneGeometry(...size), mudMat);
      rut.rotation.x = -Math.PI / 2;
      rut.position.set(...pos);
      scene.add(rut);
    });

    // ------------------------------------------------------------------ ROAD (dirt track)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#6a4c28'); // packed dirt / gravel
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Gravel/rubble edge tint
    const edgeMat = toon('#888878', { transparent: true, opacity: 0.45 });
    const edgeGeo = TrackBuilder.buildRoad(curve, ROAD_WIDTH + 1.5, SEGMENTS, 0.02);
    trackGroup.add(new THREE.Mesh(edgeGeo, edgeMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0xcc8800);
    trackGroup.add(walls.visual);

    // ------------------------------------------------------------------ COLLISION MESH
    const collisionGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH + 2, SEGMENTS, 0);
    const collisionMesh = new THREE.Mesh(
      collisionGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    trackGroup.add(collisionMesh);

    const wallMesh = walls.collision;
    trackGroup.add(wallMesh);

    // ================================================================== PROPS
    const mat = (hex, emissive = 0x000000, emissInt = 1) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissInt; }
      return m;
    };

    // --- 1. SCAFFOLDING POLES (thin cylinders in grid, along left side of track)
    const scaffoldRows = [
      { base: [52,  0, 10], gridX: 3, gridZ: 4, stepX: 5, stepZ: 5 },
      { base: [-50, 0, -20], gridX: 2, gridZ: 3, stepX: 5, stepZ: 5 },
    ];
    const poleMat = mat(0xcc9900);
    scaffoldRows.forEach(({ base, gridX, gridZ, stepX, stepZ }) => {
      for (let gx = 0; gx < gridX; gx++) {
        for (let gz = 0; gz < gridZ; gz++) {
          // Vertical pole
          const vPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 10, 7),
            poleMat
          );
          vPole.position.set(base[0] + gx * stepX, 5, base[2] + gz * stepZ);
          vPole.castShadow = true;
          scene.add(vPole);

          // Horizontal cross-member (X axis)
          if (gx < gridX - 1) {
            const hPoleX = new THREE.Mesh(
              new THREE.CylinderGeometry(0.14, 0.14, stepX, 7),
              poleMat
            );
            hPoleX.position.set(base[0] + gx * stepX + stepX / 2, 8, base[2] + gz * stepZ);
            hPoleX.rotation.z = Math.PI / 2;
            scene.add(hPoleX);

            // Mid-level cross-member
            const hPoleMid = new THREE.Mesh(
              new THREE.CylinderGeometry(0.14, 0.14, stepX, 7),
              poleMat
            );
            hPoleMid.position.set(base[0] + gx * stepX + stepX / 2, 4.5, base[2] + gz * stepZ);
            hPoleMid.rotation.z = Math.PI / 2;
            scene.add(hPoleMid);
          }

          // Cross-member Z axis
          if (gz < gridZ - 1) {
            const hPoleZ = new THREE.Mesh(
              new THREE.CylinderGeometry(0.14, 0.14, stepZ, 7),
              poleMat
            );
            hPoleZ.position.set(base[0] + gx * stepX, 8, base[2] + gz * stepZ + stepZ / 2);
            hPoleZ.rotation.x = Math.PI / 2;
            scene.add(hPoleZ);
          }
        }
      }

      // Plank platform level (box)
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(gridX * stepX, 0.3, gridZ * stepZ),
        mat(0x8b6040)
      );
      platform.position.set(
        base[0] + (gridX - 1) * stepX / 2,
        8.15,
        base[2] + (gridZ - 1) * stepZ / 2
      );
      scene.add(platform);
    });

    // --- 2. CONCRETE MIXER (cylinder body on wheeled frame)
    const mixerPos = [50, 0, 26];

    // Frame (box base)
    const mixerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, 5),
      mat(0x555544)
    );
    mixerFrame.position.set(...mixerPos);
    mixerFrame.castShadow = true;
    scene.add(mixerFrame);

    // Drum (tilted cylinder)
    const mixerDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.5, 5, 12),
      mat(0xcc8833)
    );
    mixerDrum.position.set(mixerPos[0], mixerPos[1] + 3.5, mixerPos[2]);
    mixerDrum.rotation.z = Math.PI / 5;
    mixerDrum.castShadow = true;
    scene.add(mixerDrum);

    // Chute (flat narrow box)
    const mixerChute = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.3, 3.5),
      mat(0x888866)
    );
    mixerChute.position.set(mixerPos[0] + 1.5, mixerPos[1] + 1.5, mixerPos[2] + 3);
    mixerChute.rotation.x = -0.4;
    scene.add(mixerChute);

    // Wheels (cylinders)
    [[-1.8, -2], [1.8, -2], [-1.8, 2], [1.8, 2]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.5, 10),
        mat(0x222222)
      );
      wheel.position.set(mixerPos[0] + wx, mixerPos[1] - 0.1, mixerPos[2] + wz);
      wheel.rotation.z = Math.PI / 2;
      scene.add(wheel);
    });

    // --- 3. REBAR BUNDLES (thin cylinders in tight groups)
    const rebarData = [
      { center: [ 40,  0, -5],  count: 6 },
      { center: [-15,  0,  55], count: 5 },
      { center: [ 25,  0,  -8], count: 7 },
    ];
    const rebarMat = mat(0x7a4422);
    rebarData.forEach(({ center, count }) => {
      for (let ri = 0; ri < count; ri++) {
        const rebar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 8 + Math.random() * 4, 6),
          rebarMat
        );
        rebar.position.set(
          center[0] + (Math.random() - 0.5) * 2.5,
          center[1] + 3.5,
          center[2] + (Math.random() - 0.5) * 0.8
        );
        rebar.rotation.z = 0.1 + (Math.random() - 0.5) * 0.3;
        rebar.castShadow = true;
        scene.add(rebar);
      }

      // Binding wire (thin cylinder around bundle)
      const bind = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 0.25, 10, 1, true),
        mat(0x555555)
      );
      bind.position.set(center[0], center[1] + 2.5, center[2]);
      scene.add(bind);
    });

    // --- 4. CRANE ARM SECTION (elevated track representation – large overhead beam)
    // The curve already dips through this area; add visual crane elements alongside
    const craneBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 18, 3),
      mat(0xcc8800)
    );
    craneBase.position.set(-48, 9, 8);
    craneBase.castShadow = true;
    scene.add(craneBase);

    // Horizontal crane arm (long narrow box at height)
    const craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(38, 1.2, 1.2),
      mat(0xdd9900)
    );
    craneArm.position.set(-28, 17.5, 8);
    craneArm.castShadow = true;
    scene.add(craneArm);

    // Counter-weight end
    const counterWeight = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 3),
      mat(0x444433)
    );
    counterWeight.position.set(-65, 17.5, 8);
    scene.add(counterWeight);

    // Crane cable (thin cylinder going down from arm)
    const cableMat = mat(0x333333);
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 12, 5),
      cableMat
    );
    cable.position.set(-10, 11.5, 8);
    scene.add(cable);

    // Hook box
    const hook = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.2, 1.5),
      mat(0x555555)
    );
    hook.position.set(-10, 5.5, 8);
    scene.add(hook);

    // --- 5. CONCRETE BARRIERS / JERSEY BARRIERS (blocky road dividers)
    const barrierData = [
      [ 15,  0,  -5],
      [ 18,  0, -12],
      [ 21,  0,  -5],
      [-28,  0,  45],
      [-32,  0,  52],
    ];
    const barrierMat = mat(0xaaa888);
    barrierData.forEach(([bx, by, bz]) => {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 3.5),
        barrierMat
      );
      barrier.position.set(bx, by + 0.6, bz);
      barrier.castShadow = true;
      scene.add(barrier);

      // Safety stripe
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.22),
        toon('#ff5500', { emissive: new THREE.Color('#441100'), emissiveIntensity: 0.4 })
      );
      stripe.position.set(bx, by + 0.8, bz + 1.76);
      scene.add(stripe);
    });

    // --- 6. GRAVEL PILES (flattened sphere / scaled box)
    [
      [ 55, 0,  50, 0.9],
      [-18, 0,  58, 0.7],
      [ 10, 0, -25, 0.8],
    ].forEach(([gx, gy, gz, gscale]) => {
      const pile = new THREE.Mesh(
        new THREE.SphereGeometry(4, 10, 6),
        mat(0x887755)
      );
      pile.position.set(gx, gy, gz);
      pile.scale.set(1, 0.35 * gscale, 1.2);
      pile.receiveShadow = true;
      scene.add(pile);
    });

    // --- 7. SITE FENCE / HOARDING PANELS (flat box panels around perimeter)
    const fencePositions = [
      { pos: [ 70,  1,  28], rot: [0, 0, 0],           len: 30 },
      { pos: [ 30,  1, -30], rot: [0, Math.PI / 2, 0], len: 25 },
      { pos: [-60,  1,  58], rot: [0, 0, 0],            len: 40 },
    ];
    const fenceMat = mat(0xcc8800);
    fencePositions.forEach(({ pos, rot, len }) => {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(len, 3, 0.4),
        fenceMat
      );
      panel.position.set(...pos);
      panel.rotation.set(...rot);
      panel.castShadow = true;
      scene.add(panel);

      // Hazard stripes on fence
      for (let sp = 0; sp < 4; sp++) {
        const sPanel = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 2.8),
          toon('#000000', { transparent: true, opacity: 0.5 })
        );
        sPanel.position.set(pos[0] - len / 2 + 3 + sp * 8, pos[1], pos[2] + 0.21);
        sPanel.rotation.set(...rot);
        scene.add(sPanel);
      }
    });

    // --- 8. HARD HAT / SAFETY HELMET (cone + cylinder, decorative obstacles)
    [
      [ 38, 0,  10],
      [-22, 0,  35],
      [  8, 0,  42],
    ].forEach(([hx, hy, hz]) => {
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.35, 12),
        mat(0xffcc00)
      );
      brim.position.set(hx, hy + 0.18, hz);
      brim.castShadow = true;
      scene.add(brim);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0xffcc00)
      );
      dome.position.set(hx, hy + 0.35, hz);
      scene.add(dome);
    });

    // --- 9. WORK LIGHT TOWERS (tall poles with lamp box on top)
    [
      [ 48, 0, 10],
      [-44, 0, 40],
    ].forEach(([lx, ly, lz]) => {
      const lightPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.25, 12, 8),
        mat(0x888866)
      );
      lightPole.position.set(lx, 6, lz);
      lightPole.castShadow = true;
      scene.add(lightPole);

      const lampBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.8, 0.8),
        mat(0xffffff, 0xffee88, 1.2)
      );
      lampBox.position.set(lx, 12.5, lz);
      scene.add(lampBox);
    });

    // ------------------------------------------------------------------ DUST PARTICLES
    TrackBuilder.createParticles(scene, {
      count:  300,
      spread: 140,
      color:  '#c8a870',
      size:   0.22,
      speed:  0.06,
    });

    // Heavy ground-level dust
    TrackBuilder.createParticles(scene, {
      count:  120,
      spread: 80,
      color:  '#9a7a50',
      size:   0.45,
      speed:  0.03,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
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
      surfaceZones: [
        { type: 'dirt',    traction: 0.80, friction: 0.70 },
        { type: 'gravel',  traction: 0.75, friction: 0.65 },
        { type: 'asphalt', traction: 1.0,  friction: 0.85 },
      ],
      hazards:  [],
      respawnY: -10,
    };
  },
};
