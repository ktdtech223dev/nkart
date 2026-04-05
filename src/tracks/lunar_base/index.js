import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// LUNAR BASE  –  Space Cup, Race 1
// A moon-surface circuit weaving between habitat domes, radio dishes, and
// parked lunar rovers. The Earth hangs billboard-style in the black sky.
// Regolith dust particles drift across the grey surface.
// ---------------------------------------------------------------------------

export const track = {
  id: 'lunar_base',
  name: 'LUNAR BASE',
  cup: 'space',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_space_01',

  skyConfig: {
    topColor:    0x000008,
    bottomColor: 0x111122,
    fogColor:    0x050510,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 240;

    // ------------------------------------------------------------------ CURVE
    // Layout: circuit loops around the main habitat cluster at the centre,
    // dips toward the south crater rim, passes the radio-dish array, and
    // returns past the rover depot.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,  55),   // start/finish straight
        new THREE.Vector3( 25,  0,  48),
        new THREE.Vector3( 48,  0,  30),   // turn 1 – east side
        new THREE.Vector3( 55,  0,   5),
        new THREE.Vector3( 52,  0, -18),   // sweeping right
        new THREE.Vector3( 38,  0, -38),   // crater approach
        new THREE.Vector3( 15,  0, -52),   // south crater rim
        new THREE.Vector3(-10,  0, -55),
        new THREE.Vector3(-30,  0, -48),   // radio-dish array
        new THREE.Vector3(-50,  0, -32),
        new THREE.Vector3(-56,  0,  -8),   // tight left sweep
        new THREE.Vector3(-50,  0,  18),   // rover depot
        new THREE.Vector3(-35,  0,  38),
        new THREE.Vector3(-16,  0,  50),   // return to habitat
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

    // ------------------------------------------------------------------ STARS
    // Dense star field – two layers for depth
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 180 + Math.random() * 10;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi));        // upper hemisphere
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // ------------------------------------------------------------------ LIGHTING
    TrackBuilder.createLighting(
      scene,
      0x334466, 0.55,     // cool ambient (star-lit)
      0xfff8ee, 1.4,      // harsh sun from upper right
      [60, 80, 30],
      true
    );
    // Habitat glow – warm interior light spilling outward
    const habitatGlow = new THREE.PointLight(0xffd080, 0.7, 60);
    habitatGlow.position.set(0, 6, 0);
    scene.add(habitatGlow);

    // ------------------------------------------------------------------ GROUND  (grey regolith)
    TrackBuilder.createGround(scene, 0x9a9a9a, 280);

    // Crater rings (dark depressions – darker flat circles)
    const craterMat = toon('#707070');
    [
      { x:  22, z: -46, r: 14 },
      { x: -12, z: -28, r:  8 },
      { x:  42, z:  18, r:  6 },
      { x: -40, z:  10, r: 10 },
    ].forEach(({ x, z, r }) => {
      const c = new THREE.Mesh(new THREE.CircleGeometry(r, 24), craterMat);
      c.rotation.x = -Math.PI / 2;
      c.position.set(x, -0.05, z);
      scene.add(c);
      // Crater rim ring (slightly raised)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.6, 6, 28), toon('#aaaaaa'));
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x, 0.2, z);
      scene.add(rim);
    });

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.06);
    const roadMat  = toon('#b0a898');   // compacted grey dust
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centre dashed line (faint white)
    const centreMesh = new THREE.Mesh(
      TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.09),
      toon('#ffffff', { transparent: true, opacity: 0.4 })
    );
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.0, 0x888888);
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
    const mat = (hex, emissive = 0x000000, emissiveIntensity = 1) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissiveIntensity; }
      return m;
    };

    // --- 1. HABITAT DOMES (half-spheres – cluster near centre)
    [
      { x:  0, z:  5, r: 14, col: 0xcccccc },
      { x: 20, z: -5, r:  9, col: 0xbbbbbb },
      { x:-18, z:  8, r: 10, col: 0xbbbbbb },
      { x:  8, z: 20, r:  7, col: 0xaaaaaa },
    ].forEach(({ x, z, r, col }) => {
      // Dome shell (half sphere)
      const domeGeo = new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, mat(col));
      dome.position.set(x, 0, z);
      dome.castShadow = true;
      scene.add(dome);
      // Base ring
      const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.2, 24), mat(0x999999));
      base.position.set(x, 0.6, z);
      scene.add(base);
      // Window glow (emissive small sphere embedded in dome face)
      const win = new THREE.Mesh(
        new THREE.CircleGeometry(2, 12),
        mat(0x88ccff, 0x4488ff, 0.8)
      );
      win.position.set(x, r * 0.5, z + r * 0.87);
      win.rotation.y = Math.PI;
      scene.add(win);
      // Interior glow light
      const interiorLight = new THREE.PointLight(0xffd080, 0.4, r * 2.5);
      interiorLight.position.set(x, r * 0.4, z);
      scene.add(interiorLight);
    });

    // --- 2. AIRLOCK CORRIDOR CONNECTING DOMES (chrome boxes)
    [
      { x:  10, z:  2, ry: 0.3,   w: 12, h: 4, d: 4 },
      { x:  -9, z:  6, ry: -0.25, w: 14, h: 3.5, d: 4 },
      { x:   4, z: 13, ry: 1.2,   w: 10, h: 3, d: 4 },
    ].forEach(({ x, z, ry, w, h, d }) => {
      const corridor = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mat(0xd0d8e0, 0x223344, 0.05)
      );
      corridor.position.set(x, h / 2, z);
      corridor.rotation.y = ry;
      corridor.castShadow = true;
      scene.add(corridor);
    });

    // --- 3. RADIO DISH ARRAY (south-west sector)
    [
      { x: -40, z: -38, ry: 0.3 },
      { x: -52, z: -22, ry: -0.5 },
      { x: -28, z: -50, ry: 0.7 },
    ].forEach(({ x, z, ry }) => {
      // Dish (cone pointing forward)
      const dish = new THREE.Mesh(
        new THREE.ConeGeometry(6, 2, 16, 1, true),
        mat(0xc0c8d0)
      );
      dish.position.set(x, 10, z);
      dish.rotation.x = Math.PI / 2.5;
      dish.rotation.y = ry;
      dish.castShadow = true;
      scene.add(dish);
      // Dish backing plate
      const backing = new THREE.Mesh(
        new THREE.CylinderGeometry(6.2, 6.2, 0.4, 16),
        mat(0xaaaaaa)
      );
      backing.position.set(x, 10, z);
      scene.add(backing);
      // Support mast
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 12, 8),
        mat(0x888888)
      );
      mast.position.set(x, 5, z);
      scene.add(mast);
      // Signal blink light
      const blink = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), mat(0xff2200, 0xff0000, 1.5));
      blink.position.set(x, 12.5, z);
      scene.add(blink);
    });

    // --- 4. LUNAR ROVER (south-east depot)
    const roverMat  = mat(0xccccaa);
    const roverBody = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 4.5), roverMat);
    roverBody.position.set(44, 1.5, -10);
    roverBody.castShadow = true;
    scene.add(roverBody);
    // Rover cabin
    const roverCabin = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2, 3.5), mat(0xddddcc));
    roverCabin.position.set(43, 3.5, -10);
    scene.add(roverCabin);
    // Wheels (4 cylinders on their sides)
    [[-3.5, -3], [2, -3], [-3.5, 2.5], [2, 2.5]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.4, 12), mat(0x333333));
      wheel.position.set(44 + wx, 0.7, -10 + wz);
      wheel.rotation.z = Math.PI / 2;
      scene.add(wheel);
    });
    // Solar panel array on rover
    const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 4), mat(0x224488, 0x1144aa, 0.3));
    solarPanel.position.set(44, 5, -10);
    scene.add(solarPanel);

    // --- 5. EARTH IN SKY (billboarded large sphere)
    const earthGeo = new THREE.SphereGeometry(18, 32, 32);
    const earthMat = toon('#2255cc', { emissive: new THREE.Color('#112244'), emissiveIntensity: 0.4 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(-80, 110, -150);
    scene.add(earth);
    // Continent patches (lighter sphere overlay)
    const continentMat = toon('#33aa55', { transparent: true, opacity: 0.8 });
    [
      { x: -4, y:  6, z: 15, r: 5 },
      { x:  8, y:  2, z: 14, r: 4 },
      { x: -8, y: -5, z: 15, r: 3.5 },
    ].forEach(({ x, y, z, r }) => {
      const patch = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), continentMat);
      patch.position.set(-80 + x, 110 + y, -150 + z);
      scene.add(patch);
    });
    // Atmosphere halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(19.5, 24, 24),
      toon('#88aaff', { transparent: true, opacity: 0.18 })
    );
    halo.position.copy(earth.position);
    scene.add(halo);

    // --- 6. FUEL TANKS / SUPPLY CONTAINERS (near start)
    [
      { x: 14, z: 48, col: 0xcccccc },
      { x: 18, z: 44, col: 0xbbbbcc },
      { x:  8, z: 44, col: 0xdddddd },
    ].forEach(({ x, z, col }) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 6, 12), mat(col));
      tank.position.set(x, 3, z);
      tank.rotation.z = Math.PI / 2;
      tank.castShadow = true;
      scene.add(tank);
      // End caps
      [-3, 3].forEach(dx => {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(col));
        cap.position.set(x + dx, 3, z);
        cap.rotation.z = dx > 0 ? -Math.PI / 2 : Math.PI / 2;
        scene.add(cap);
      });
    });

    // --- 7. ANTENNA SPIRE (tall thin mast at start line)
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 22, 8), mat(0xaaaaaa));
    spire.position.set(-10, 11, 55);
    scene.add(spire);
    const spireTop = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), mat(0xff2200, 0xff0000, 1.5));
    spireTop.position.set(-10, 22.5, 55);
    scene.add(spireTop);
    // Cross-beams
    [-3, 3].forEach(dy => {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 6), mat(0x999999));
      beam.position.set(-10, 11 + dy, 55);
      beam.rotation.z = Math.PI / 2;
      scene.add(beam);
    });

    // --- 8. LANDING PAD (flat octagonal platform near rover depot)
    const padMat = toon('#888888');
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 0.5, 8), padMat);
    pad.position.set(48, 0.25, -22);
    pad.receiveShadow = true;
    scene.add(pad);
    // Pad markings – X cross
    const markMat = toon('#ffcc00');
    ['h', 'v'].forEach(dir => {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(dir === 'h' ? 30 : 1, 0.1, dir === 'v' ? 30 : 1), markMat);
      mark.position.set(48, 0.55, -22);
      scene.add(mark);
    });
    // Corner lights
    [[-14, -14], [14, -14], [-14, 14], [14, 14]].forEach(([ox, oz]) => {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), mat(0xffffff, 0xffff00, 1.5));
      light.position.set(48 + ox, 0.8, -22 + oz);
      scene.add(light);
    });

    // --- 9. INTERIOR CORRIDOR SECTION (chrome box tunnel, north-east passage)
    [
      { x: 30, z: 30, w: 20, h: 5, d: 8, ry: -0.6 },
      { x: 42, z: 10, w: 18, h: 5, d: 8, ry: -0.1 },
    ].forEach(({ x, z, w, h, d, ry }) => {
      const tunnel = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mat(0xd8dde4, 0x334455, 0.08)
      );
      tunnel.position.set(x, h / 2, z);
      tunnel.rotation.y = ry;
      tunnel.castShadow = true;
      scene.add(tunnel);
      // Interior strip lights (emissive box inside)
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w - 1, 0.3, 0.3),
        mat(0xffffff, 0xeeeeff, 1.0)
      );
      strip.position.set(x, h - 0.3, z);
      strip.rotation.y = ry;
      scene.add(strip);
    });

    // ------------------------------------------------------------------ PARTICLES  (moon dust)
    TrackBuilder.createParticles(scene, {
      count:  200,
      spread:  80,
      color:   '#bbbbbb',
      size:    0.18,
      speed:   0.02,
    });
    // Fine dust layer close to ground
    TrackBuilder.createParticles(scene, {
      count:   80,
      spread:  40,
      color:   '#cccccc',
      size:    0.08,
      speed:   0.01,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'regolith', traction: 0.82, friction: 0.70 },
      { type: 'pad',      traction: 1.0,  friction: 0.90 },
    ];

    const hazards = [
      {
        type:     'crater',
        position: new THREE.Vector3(22, 0.1, -46),
        radius:   14,
        effect:   { tractionMultiplier: 0.65 },
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
      surfaceZones: [],
      hazards: [],
      respawnY: -10,
    };
  },
};
