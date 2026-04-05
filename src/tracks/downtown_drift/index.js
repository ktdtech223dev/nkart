import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// DOWNTOWN DRIFT  –  City Cup, Race 1
// Night street racing through a neon-lit downtown grid. Asphalt road,
// glowing storefronts, parked cars, a tunnel underpass. Deep blue-black sky,
// rain particles, synthwave palette.
// ---------------------------------------------------------------------------

export const track = {
  id: 'downtown_drift',
  name: 'DOWNTOWN DRIFT',
  cup: 'city',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_city_01',

  skyConfig: {
    topColor:    0x03010f,
    bottomColor: 0x0a0520,
    fogColor:    0x050215,
    fogDensity:  0.014,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 11;
    const SEGMENTS   = 220;

    // ------------------------------------------------------------------ CURVE
    // Urban grid loop: straight city blocks connected by 90-degree bends,
    // a long tunnel section in the lower section, and a chicane near the end.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Start/finish straight – main boulevard
        new THREE.Vector3(  0,  0,  10),
        new THREE.Vector3( 25,  0,   5),
        // First corner – right turn south
        new THREE.Vector3( 42,  0, -10),
        new THREE.Vector3( 48,  0, -28),
        // South straight
        new THREE.Vector3( 46,  0, -48),
        new THREE.Vector3( 36,  0, -62),
        // South U-turn
        new THREE.Vector3( 16,  0, -70),
        new THREE.Vector3( -4,  0, -72),
        new THREE.Vector3(-22,  0, -68),
        new THREE.Vector3(-36,  0, -56),
        // Back straight heading north
        new THREE.Vector3(-44,  0, -38),
        new THREE.Vector3(-46,  0, -18),
        // North curve back to start
        new THREE.Vector3(-38,  0,  -2),
        new THREE.Vector3(-20,  0,   8),
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

    // ------------------------------------------------------------------ LIGHTING  (night + neon)
    TrackBuilder.createLighting(
      scene,
      0x1a0a2e, 0.5,          // deep purple ambient
      0x3311aa, 0.4,          // dim directional (moonish)
      [20, 60, -20],
      true
    );

    // Streetlight point lights along the main straight
    const streetLightColors = [0xff00cc, 0x00ccff, 0xff6600, 0xccff00];
    [
      [ 12,  8,  5],
      [ 30,  8,  5],
      [ 48,  8,  5],
      [-15,  8,  5],
      [-35,  8,  5],
      [ 58,  8, -45],
      [-58,  8, -45],
      [  0,  8, -88],
    ].forEach(([x, y, z], i) => {
      const pl = new THREE.PointLight(streetLightColors[i % streetLightColors.length], 1.8, 50);
      pl.position.set(x, y, z);
      scene.add(pl);
    });

    // ------------------------------------------------------------------ GROUND (wet asphalt)
    TrackBuilder.createGround(scene, 0x0d0d14, 300);

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#1a1a22'); // dark asphalt
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Reflective centre stripe (neon pink)
    const stripeMat = toon('#ff007f', { emissive: new THREE.Color('#550033'), transparent: true, opacity: 0.7 });
    const stripeGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.07);
    trackGroup.add(new THREE.Mesh(stripeGeo, stripeMat));

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.8, 0x1c1c30);
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

    // --- 1. NEON STOREFRONT SIGNS (emissive planes along main straight)
    const neonSigns = [
      { pos: [ 10, 5,  14], rot: [0, 0, 0],           color: 0xff00aa, label: 'pink' },
      { pos: [ 28, 6,  14], rot: [0, 0, 0],           color: 0x00eeff, label: 'cyan' },
      { pos: [ 44, 5,  14], rot: [0, 0, 0],           color: 0xff6600, label: 'orange' },
      { pos: [-16, 5,  14], rot: [0, Math.PI, 0],     color: 0xaaff00, label: 'green' },
      { pos: [-34, 6,  14], rot: [0, Math.PI, 0],     color: 0xff00cc, label: 'magenta' },
      { pos: [ 64, 5, -30], rot: [0, -Math.PI / 2, 0], color: 0x00ffcc, label: 'teal' },
      { pos: [-64, 5, -30], rot: [0,  Math.PI / 2, 0], color: 0xff3300, label: 'red' },
    ];
    neonSigns.forEach(({ pos, rot, color }) => {
      // Storefront backing box
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(12, 10, 1.5),
        mat(0x0a0a18)
      );
      building.position.set(...pos);
      building.rotation.set(...rot);
      building.castShadow = true;
      scene.add(building);

      // Neon sign plane (emissive)
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 3.5),
        toon('#888888', { emissive: new THREE.Color(color), emissiveIntensity: 1.4 })
      );
      sign.position.set(pos[0], pos[1] + 1.5, pos[2] + (rot[1] === 0 ? -1 : 1));
      sign.rotation.set(...rot);
      scene.add(sign);

      // Neon glow point light
      const neonLight = new THREE.PointLight(color, 1.2, 30);
      neonLight.position.set(pos[0], pos[1] + 1, pos[2]);
      scene.add(neonLight);
    });

    // --- 2. CITY BUILDINGS (tall box towers flanking the track)
    const buildingData = [
      [ 68, 25, -50,  14, 50, 14],
      [ 68, 20, -10,  12, 40, 12],
      [-68, 25, -50,  14, 50, 14],
      [-68, 18, -10,  10, 36, 10],
      [ 20, 22, -95,  16, 44, 16],
      [-20, 18, -95,  12, 36, 12],
      [ 65, 15,  15,  18, 30, 10],
      [-65, 20,  15,  14, 40, 10],
    ];
    buildingData.forEach(([bx, by, bz, bw, bh, bd]) => {
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bd),
        mat(0x0c0c1e)
      );
      bldg.position.set(bx, by, bz);
      bldg.castShadow = true;
      scene.add(bldg);

      // Window grid dots (emissive small planes)
      for (let wy = 0; wy < 4; wy++) {
        for (let wx = 0; wx < 3; wx++) {
          if (Math.random() > 0.4) {
            const win = new THREE.Mesh(
              new THREE.PlaneGeometry(2, 2.5),
              toon('#ffdd88', { emissive: new THREE.Color('#ffcc44'), emissiveIntensity: 0.8 })
            );
            win.position.set(bx - bw / 2 + 2 + wx * 4, by - bh / 2 + 5 + wy * 8, bz + bd / 2 + 0.1);
            scene.add(win);
          }
        }
      }
    });

    // --- 3. PARKED CARS (simple box assemblies along the road edge)
    const carData = [
      [ 52,  0.8,  8, 0],
      [ 52,  0.8,  2, 0],
      [-50,  0.8,  8, Math.PI],
      [-50,  0.8,  2, Math.PI],
      [ 58,  0.8, -55, Math.PI / 2],
      [-58,  0.8, -55, -Math.PI / 2],
    ];
    const carBodyColors = [0x8800aa, 0x003388, 0x880000, 0x006633];
    carData.forEach(([cx, cy, cz, cr], i) => {
      // Car body
      const carBody = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 1.5, 2.2),
        mat(carBodyColors[i % carBodyColors.length])
      );
      carBody.position.set(cx, cy, cz);
      carBody.rotation.y = cr;
      carBody.castShadow = true;
      scene.add(carBody);

      // Car cabin
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.1, 2.0),
        mat(0x111122)
      );
      cabin.position.set(cx, cy + 1.3, cz);
      cabin.rotation.y = cr;
      scene.add(cabin);

      // Headlights (emissive)
      [-0.85, 0.85].forEach(dx => {
        const headlight = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 0.1),
          toon('#ffffcc', { emissive: new THREE.Color('#ffffcc'), emissiveIntensity: 2 })
        );
        headlight.position.set(cx + dx, cy + 0.1, cz + 2.3);
        headlight.rotation.y = cr;
        scene.add(headlight);
      });
    });

    // --- 4. TUNNEL SECTION (box tunnel over the underground part of the track)
    // Ceiling boxes to form tunnel ceiling over the dipped section
    const tunnelPositions = [
      [-10, 4, -88], [0, 4, -88], [10, 4, -88],
      [20, 3.5, -88], [-20, 3.5, -88],
    ];
    tunnelPositions.forEach(([tx, ty, tz]) => {
      const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(14, 1, 18),
        mat(0x0e0e1c)
      );
      ceiling.position.set(tx, ty, tz);
      scene.add(ceiling);

      // Tunnel wall left
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 18), mat(0x141424));
      wallL.position.set(tx - 7, ty - 2, tz);
      scene.add(wallL);

      // Tunnel wall right
      const wallR = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 18), mat(0x141424));
      wallR.position.set(tx + 7, ty - 2, tz);
      scene.add(wallR);

      // Tunnel strip light (cyan emissive)
      const stripLight = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.2, 0.3),
        toon('#00ffff', { emissive: new THREE.Color('#00ffff'), emissiveIntensity: 1.5 })
      );
      stripLight.position.set(tx, ty - 0.6, tz);
      scene.add(stripLight);
    });

    // --- 5. STREETLIGHT POLES along the main straight
    [10, 28, 44, -15, -33].forEach(xPos => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.25, 9, 8),
        mat(0x444455)
      );
      pole.position.set(xPos, 4.5, 8);
      pole.castShadow = true;
      scene.add(pole);

      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.5, 0.5),
        toon('#fff0aa', { emissive: new THREE.Color('#ffd055'), emissiveIntensity: 1.2 })
      );
      lamp.position.set(xPos, 9.5, 6.5);
      scene.add(lamp);
    });

    // --- 6. TRAFFIC BARRIERS / CONES (orange, near chicane)
    [
      [-44, 0.5, -8],
      [-48, 0.5, -2],
      [-52, 0.5,  4],
    ].forEach(([cx, cy, cz]) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 1.2, 8),
        mat(0xff5500)
      );
      cone.position.set(cx, cy, cz);
      scene.add(cone);

      // Reflective stripe (white band)
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.47, 0.47, 0.22, 8),
        mat(0xffffff)
      );
      band.position.set(cx, cy + 0.2, cz);
      scene.add(band);
    });

    // --- 7. MANHOLE COVERS (flat cylinders in road – decorative)
    [
      [  5, 0.06, -30],
      [-10, 0.06, -88],
      [ 30, 0.06, -50],
    ].forEach(([mx, my, mz]) => {
      const manhole = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.08, 16),
        mat(0x222233)
      );
      manhole.position.set(mx, my, mz);
      scene.add(manhole);
    });

    // --- 8. BILLBOARD FRAMES (large vertical boxes with emissive face)
    [
      { pos: [ 72, 12, -65], rot: [0, -Math.PI / 2, 0], color: 0xff00bb },
      { pos: [-72, 12, -65], rot: [0,  Math.PI / 2, 0], color: 0x00ccff },
    ].forEach(({ pos, rot, color }) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(16, 8, 1),
        mat(0x111111)
      );
      frame.position.set(...pos);
      frame.rotation.set(...rot);
      scene.add(frame);

      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 6),
        toon('#888888', { emissive: new THREE.Color(color), emissiveIntensity: 0.9 })
      );
      face.position.set(pos[0], pos[1], pos[2] + (rot[1] < 0 ? 0.6 : -0.6));
      face.rotation.set(...rot);
      scene.add(face);
    });

    // ------------------------------------------------------------------ RAIN PARTICLES
    TrackBuilder.createParticles(scene, {
      count:  350,
      spread: 120,
      color:  '#88aaff',
      size:   0.12,
      speed:  0.1,
    });

    // Distant atmosphere glow particles (synthwave purple)
    TrackBuilder.createParticles(scene, {
      count:  80,
      spread: 200,
      color:  '#cc00ff',
      size:   0.4,
      speed:  0.01,
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
        { type: 'asphalt', traction: 1.0, friction: 0.82 },
        { type: 'wet',     traction: 0.85, friction: 0.7 },
      ],
      hazards:  [],
      respawnY: -10,
    };
  },
};
