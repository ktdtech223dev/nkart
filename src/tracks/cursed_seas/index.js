import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// CURSED SEAS  –  Shadow Cup, Race 2
// A corrupted galleon ship deck. Based on grand_line_galleon layout but:
// ship pitched 8° starboard, fire particles everywhere,
// half deck submerged (lower section), no horizon – pure void sky.
// Dark red/black palette throughout.
// ---------------------------------------------------------------------------

export const track = {
  id: 'cursed_seas',
  name: 'CURSED SEAS',
  cup: 'shadow',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_shadow_02',

  skyConfig: {
    topColor:    0x030003,
    bottomColor: 0x1a0000,
    fogColor:    0x0d0000,
    fogDensity:  0.035,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 240;

    // ------------------------------------------------------------------ CURVE
    // Ship-deck loop: front bow section elevated, mid-ship flat,
    // aft section dips as if half-submerged. Pitched 8° so port side is high,
    // starboard is low (rolled). Overall loop with figure-S through the rigging.
    const PITCH = Math.PI / 22.5; // 8 degrees starboard list
    // Pre-compute lateral tilt offset (port higher, starboard lower)
    const tiltOffset = (x) => -x * Math.sin(PITCH) * 0.4;

    const curve = new THREE.CatmullRomCurve3(
      [
        // BOW – elevated prow
        new THREE.Vector3(  0,  0,   50),
        new THREE.Vector3( 12,  0,  42),
        new THREE.Vector3( 20,  0,  30),
        // STARBOARD rail – pitching into void water
        new THREE.Vector3( 22,  0,  10),
        new THREE.Vector3( 20,  0,  -8),
        new THREE.Vector3( 16,  0, -24),
        // AFT – submerged section (below water line)
        new THREE.Vector3(  5,  0,  -38),
        new THREE.Vector3( -5,  0, -42),
        new THREE.Vector3(-14,  0, -38),
        // PORT rail – rising up from void water
        new THREE.Vector3(-20,  0, -22),
        new THREE.Vector3(-22,  0,  -5),
        new THREE.Vector3(-20,  0,   12),
        new THREE.Vector3(-16,  0,   28),
        // MID-SHIP cross-run through mast rigging
        new THREE.Vector3( -8,  0,  40),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY (void – no horizon)
    // Pure void – no gradient, just absolute darkness
    scene.background = new THREE.Color(0x030003);
    scene.fog = new THREE.FogExp2(0x0d0000, 0.035);

    // Void sky sphere (no gradient, just black with red tinge at bottom)
    const skyGeo = new THREE.SphereGeometry(300, 16, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor:    { value: new THREE.Color(0x030003) },
        bottomColor: { value: new THREE.Color(0x3a0000) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          // Below horizon is pure red-black void – no visible sea, just nothingness
          float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // ------------------------------------------------------------------ LIGHTING (no sun – only fire)
    const ambient = new THREE.AmbientLight(0x1a0000, 0.3);
    scene.add(ambient);

    // Main fire light – reddish orange flickering from rigging fires
    const fireLight1 = new THREE.PointLight(0xff3300, 3.0, 70);
    fireLight1.position.set(0, 15, 0);
    scene.add(fireLight1);

    // Starboard fire (submerging side – more intense)
    const fireLight2 = new THREE.PointLight(0xff2200, 2.5, 50);
    fireLight2.position.set(18, 5, -15);
    scene.add(fireLight2);

    // Aft fire (submerged section glows from below)
    const aftFireLight = new THREE.PointLight(0xdd1100, 2.0, 40);
    aftFireLight.position.set(0, -1, -40);
    scene.add(aftFireLight);

    // Port side – rising from void water, eerie blue-red
    const portLight = new THREE.PointLight(0x660000, 1.5, 45);
    portLight.position.set(-20, 2, 0);
    scene.add(portLight);

    // Void-water glow from below (submerged section)
    const voidWaterGlow = new THREE.PointLight(0x330011, 1.8, 35);
    voidWaterGlow.position.set(0, -5, -20);
    scene.add(voidWaterGlow);

    // ------------------------------------------------------------------ VOID WATER PLANE
    // The "sea" – pure black, no reflections, just a flat abyss plane
    const voidSeaMat = toon('#050002', { emissive: new THREE.Color('#110000'), transparent: true, opacity: 0.92 });
    const voidSea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), voidSeaMat);
    voidSea.rotation.x = -Math.PI / 2;
    voidSea.position.y = -2.2; // water line – half deck is below this
    scene.add(voidSea);

    // Void water surface detail (dark ripple bands)
    const rippleMat = toon('#1a0000', { transparent: true, opacity: 0.3 });
    for (let r = 0; r < 12; r++) {
      const ripple = new THREE.Mesh(
        new THREE.PlaneGeometry(200 - r * 10, 0.8),
        rippleMat
      );
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(
        (Math.random() - 0.5) * 60,
        -2.15 + r * 0.01,
        (Math.random() - 0.5) * 80
      );
      ripple.rotation.z = Math.random() * Math.PI;
      scene.add(ripple);
    }

    // ------------------------------------------------------------------ SHIP HULL (pitched 8°)
    const hullMat = toon('#1a0800', { emissive: new THREE.Color('#110000') });

    // Main deck planking (pitched group)
    const deckGroup = new THREE.Group();
    deckGroup.rotation.z = PITCH; // 8° starboard list
    scene.add(deckGroup);

    // Hull sides (port and starboard)
    const portHull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 120), hullMat);
    portHull.position.set(-26, 0, 0);
    portHull.castShadow = true;
    deckGroup.add(portHull);

    const starboardHull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 120), hullMat);
    starboardHull.position.set(26, 0, 0);
    starboardHull.castShadow = true;
    deckGroup.add(starboardHull);

    // Deck planks (dark, charred)
    const plankMat = toon('#0d0500');
    for (let pz = -55; pz <= 55; pz += 3) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(50, 0.3, 2.7), plankMat);
      plank.position.set(0, 0, pz);
      deckGroup.add(plank);
    }

    // Charred plank gaps
    const charMat = toon('#080300', { emissive: new THREE.Color('#110000') });
    for (let pz = -55; pz <= 55; pz += 3) {
      const gap = new THREE.Mesh(new THREE.BoxGeometry(50, 0.35, 0.3), charMat);
      gap.position.set(0, 0.02, pz + 1.35);
      deckGroup.add(gap);
    }

    // Bow shape (tapered front)
    const bowMat = toon('#1a0800');
    const bow = new THREE.Mesh(new THREE.ConeGeometry(14, 18, 4), bowMat);
    bow.position.set(0, -2, 62);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    deckGroup.add(bow);

    // ------------------------------------------------------------------ MASTS (burning)
    const mastMat = toon('#0d0500', { emissive: new THREE.Color('#110000') });

    // Fore mast
    const foreMast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 45, 8), mastMat);
    foreMast.position.set(0, 22, 22);
    deckGroup.add(foreMast);

    // Main mast
    const mainMast = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.5, 55, 8), mastMat);
    mainMast.position.set(0, 27, 0);
    deckGroup.add(mainMast);

    // Mizzen mast (aft)
    const mizzenMast = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 35, 8), mastMat);
    mizzenMast.position.set(0, 17, -22);
    deckGroup.add(mizzenMast);

    // Burning yard arm (horizontal crossbeam on fire)
    const yardMat = toon('#1a0800', { emissive: new THREE.Color('#330000') });
    const yardArm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 40, 8), yardMat);
    yardArm.position.set(0, 45, 0);
    yardArm.rotation.z = Math.PI / 2;
    deckGroup.add(yardArm);

    // Burning sail remnants (torn, on fire)
    const sailBurnMat = toon('#2a0800', { emissive: new THREE.Color('#440000'), transparent: true, opacity: 0.7 });
    // Fore sail (torn)
    const foreSail = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), sailBurnMat);
    foreSail.position.set(-5, 35, 22);
    foreSail.rotation.y = 0.2;
    deckGroup.add(foreSail);

    // Main sail (partially burned)
    const mainSail = new THREE.Mesh(new THREE.PlaneGeometry(22, 28), sailBurnMat);
    mainSail.position.set(6, 42, 0);
    mainSail.rotation.y = -0.15;
    deckGroup.add(mainSail);

    // ------------------------------------------------------------------ SHIP CANNONS (melted)
    const cannonMat = toon('#0a0a0a', { emissive: new THREE.Color('#110000') });
    const cannonPositions = [
      [-20, 0.5, 20], [-20, 0.5, -10], [-20, 0.5, -35],
      [ 20, 0.5, 20], [ 20, 0.5, -10], [ 20, 0.5, -35],
    ];
    cannonPositions.forEach(([cx, cy, cz]) => {
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 6, 12), cannonMat);
      cannon.position.set(cx, cy, cz);
      cannon.rotation.z = cx > 0 ? Math.PI / 2 + 0.2 : -Math.PI / 2 - 0.2;
      cannon.rotation.x = 0.1; // slightly melted/sagging
      cannon.castShadow = true;
      deckGroup.add(cannon);
    });

    // ------------------------------------------------------------------ RIGGING ROPES (on fire)
    const ropeMat = toon('#330800', { emissive: new THREE.Color('#220000') });
    const ropeData = [
      { from: [0, 45, 0], to: [-20, 2, -55], segs: 8 },
      { from: [0, 45, 0], to: [20, 2, -55], segs: 8 },
      { from: [0, 27, 22], to: [0, 45, 0], segs: 6 },
    ];
    ropeData.forEach(({ from, to, segs }) => {
      for (let s = 0; s < segs; s++) {
        const t = s / segs;
        const t1 = (s + 1) / segs;
        const px = from[0] + (to[0] - from[0]) * t;
        const py = from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * 4;
        const pz = from[2] + (to[2] - from[2]) * t;
        const ropeSeg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 4), ropeMat);
        ropeSeg.position.set(px, py, pz);
        ropeSeg.lookAt(from[0] + (to[0] - from[0]) * t1, from[1] + (to[1] - from[1]) * t1, from[2] + (to[2] - from[2]) * t1);
        ropeSeg.rotateX(Math.PI / 2);
        deckGroup.add(ropeSeg);
      }
    });

    // ------------------------------------------------------------------ ROAD (dark red-black planks)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#150800', { emissive: new THREE.Color('#110000') });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Blood-red centreline
    const centreMat = toon('#880000', { transparent: true, opacity: 0.6 });
    const centreGeo = TrackBuilder.buildRoad(curve, 0.5, SEGMENTS, 0.08);
    const centreMesh = new THREE.Mesh(centreGeo, centreMat);
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS (railing stumps)
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.0, 0x220500);
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

    // ------------------------------------------------------------------ FIRE PARTICLES
    // Main fire particles (everywhere – consuming the ship)
    TrackBuilder.createParticles(scene, {
      count:  300,
      spread: 70,
      color:  '#ff2200',
      size:   0.35,
      speed:  0.12,
    });

    // Embers floating upward
    TrackBuilder.createParticles(scene, {
      count:  200,
      spread: 50,
      color:  '#ff6600',
      size:   0.18,
      speed:  0.08,
    });

    // Smoke (dark)
    TrackBuilder.createParticles(scene, {
      count:  150,
      spread: 80,
      color:  '#220000',
      size:   0.5,
      speed:  0.04,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [];

    const hazards = [
      {
        type: 'fire_zone',
        position: new THREE.Vector3(0, 0, 0),
        radius: 60,
        damage: 0.5,
      },
      {
        type: 'submerged',
        position: new THREE.Vector3(0, -2.5, -20),
        radius: 22,
        drag: 0.6,
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
      surfaceZones,
      hazards,
      respawnY: -10,
    };
  },
};
