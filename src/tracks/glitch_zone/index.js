import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// GLITCH ZONE  –  Arcade Cup, Race 4
// Corrupted digital void. White grid ground, flickering error boxes,
// RGB-split visual, minimal geometry. Harsh white environment.
// ---------------------------------------------------------------------------

export const track = {
  id: 'glitch_zone',
  name: 'GLITCH ZONE',
  cup: 'arcade',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_arcade_04',

  skyConfig: {
    topColor:    0xffffff,
    bottomColor: 0xe0e0e0,
    fogColor:    0xffffff,
    fogDensity:  0.01,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 10;
    const SEGMENTS   = 200;

    // ------------------------------------------------------------------ CURVE
    // Glitchy irregular loop that feels unpredictable.
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(  0,  0,   0),
        new THREE.Vector3( 15,  0, -10),
        new THREE.Vector3( 35,  0,  -5),
        new THREE.Vector3( 45,  0,  10),
        new THREE.Vector3( 38,  0,  28),
        new THREE.Vector3( 20,  0,  38),
        new THREE.Vector3(  0,  0,  42),
        new THREE.Vector3(-18,  0,  35),
        new THREE.Vector3(-30,  0,  20),
        new THREE.Vector3(-40,  0,   5),
        new THREE.Vector3(-35,  0, -12),
        new THREE.Vector3(-20,  0, -22),
        new THREE.Vector3( -8,  0, -18),
        new THREE.Vector3(  5,  0, -10),
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
    // Harsh white lighting to convey corrupted digital void
    TrackBuilder.createLighting(
      scene,
      0xffffff, 1.5,       // very bright white ambient
      0xffffff, 1.0,       // white directional
      [0, 80, 0],
      false
    );
    // Red channel offset fill (RGB split effect suggestion)
    const redFill = new THREE.PointLight(0xff0000, 0.3, 200);
    redFill.position.set(10, 20, 0);
    scene.add(redFill);
    // Blue channel offset fill
    const blueFill = new THREE.PointLight(0x0000ff, 0.3, 200);
    blueFill.position.set(-10, 20, 0);
    scene.add(blueFill);

    // ------------------------------------------------------------------ GROUND (white + grid)
    const groundMat = toon('#ffffff');
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.15;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Grid lines on ground
    const gridLineMat = toon('#000000', { transparent: true, opacity: 0.15 });
    const gridSpacing = 6;
    for (let gx = -120; gx <= 120; gx += gridSpacing) {
      const vLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 240),
        gridLineMat
      );
      vLine.rotation.x = -Math.PI / 2;
      vLine.position.set(gx, -0.13, 0);
      scene.add(vLine);
    }
    for (let gz = -120; gz <= 120; gz += gridSpacing) {
      const hLine = new THREE.Mesh(
        new THREE.PlaneGeometry(240, 0.2),
        gridLineMat
      );
      hLine.rotation.x = -Math.PI / 2;
      hLine.position.set(0, -0.13, gz);
      scene.add(hLine);
    }

    // Flickering broken grid cells (randomly darker squares)
    const brokenMat = toon('#000000', { transparent: true, opacity: 0.08 });
    for (let i = 0; i < 40; i++) {
      const bx = (Math.floor(Math.random() * 40) - 20) * gridSpacing;
      const bz = (Math.floor(Math.random() * 40) - 20) * gridSpacing;
      const broken = new THREE.Mesh(
        new THREE.PlaneGeometry(gridSpacing - 0.3, gridSpacing - 0.3),
        brokenMat
      );
      broken.rotation.x = -Math.PI / 2;
      broken.position.set(bx, -0.12, bz);
      scene.add(broken);
    }

    // ------------------------------------------------------------------ ROAD (pure white with dark edges)
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#f0f0f0');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Road edge lines (black)
    const edgeMat = toon('#000000', { transparent: true, opacity: 0.5 });
    const edgeL = TrackBuilder.buildRoad(curve, 0.4, SEGMENTS, 0.09);
    trackGroup.add(new THREE.Mesh(edgeL, edgeMat));

    // RGB-split ghost centre lines (red slightly offset, blue slightly offset)
    const redLineMat = toon('#ff0000', { transparent: true, opacity: 0.4 });
    const blueLineMat = toon('#0000ff', { transparent: true, opacity: 0.4 });
    const redLineGeo = TrackBuilder.buildRoad(curve, 0.4, SEGMENTS, 0.1);
    const blueLineGeo = TrackBuilder.buildRoad(curve, 0.4, SEGMENTS, 0.11);
    const redLineMesh = new THREE.Mesh(redLineGeo, redLineMat);
    const blueLineMesh = new THREE.Mesh(blueLineGeo, blueLineMat);
    // Slight world-space offset to simulate channel split
    redLineMesh.position.x += 0.15;
    blueLineMesh.position.x -= 0.15;
    trackGroup.add(redLineMesh);
    trackGroup.add(blueLineMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.5, 0xcccccc);
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

    const mat = (hex, emissive = 0x000000) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); }
      return m;
    };

    // --- 1. Floating error message boxes (planes with colored frames)
    const errorBoxData = [
      { x:  12, y:  6, z:  18, w: 14, h: 6, c: 0xff0000, label: 0xffffff },
      { x: -18, y:  8, z:  30, w: 16, h: 5, c: 0x0000cc, label: 0xffffff },
      { x:  30, y:  5, z: -10, w: 12, h: 7, c: 0x000000, label: 0xff0000 },
      { x: -35, y: 10, z:   8, w: 18, h: 5, c: 0xff6600, label: 0x000000 },
      { x:  10, y: 12, z:  42, w: 15, h: 6, c: 0x0000ff, label: 0xffffff },
      { x: -10, y:  7, z: -20, w: 14, h: 5, c: 0xcc0000, label: 0xffffff },
    ];
    errorBoxData.forEach(({ x, y, z, w, h, c, label }) => {
      // Box background panel
      const bgPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        mat(c)
      );
      bgPanel.position.set(x, y, z);
      bgPanel.castShadow = false;
      scene.add(bgPanel);
      // Back face (double-sided appearance)
      const bgBack = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        mat(c)
      );
      bgBack.position.set(x, y, z + 0.01);
      bgBack.rotation.y = Math.PI;
      scene.add(bgBack);
      // Title bar
      const titleBar = new THREE.Mesh(
        new THREE.PlaneGeometry(w, 1.2),
        mat(label)
      );
      titleBar.position.set(x, y + h / 2 - 0.6, z + 0.02);
      scene.add(titleBar);
      // Inner content lines (dark rectangles)
      for (let line = 0; line < 2; line++) {
        const textLine = new THREE.Mesh(
          new THREE.PlaneGeometry(w - 2, 0.6),
          mat(0x333333)
        );
        textLine.position.set(x, y + 0.5 - line * 1.4, z + 0.02);
        scene.add(textLine);
      }
      // OK button
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 0.2),
        mat(0xdddddd)
      );
      button.position.set(x, y - h / 2 + 1, z + 0.1);
      scene.add(button);
    });

    // --- 2. Missing-texture polygons (magenta/black checkered planes)
    const missingMat1 = toon('#ff00ff');
    const missingMat2 = toon('#000000');
    const missingData = [
      { x:  40, y: 4, z:  35 }, { x: -42, y: 6, z: -18 }, { x: -5, y: 8, z:  55 },
    ];
    missingData.forEach(({ x, y, z }) => {
      const size = 6 + Math.random() * 4;
      // Checkerboard 4x4 pattern
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(size / 4, size / 4),
            (r + c) % 2 === 0 ? missingMat1 : missingMat2
          );
          tile.position.set(
            x + (c - 1.5) * (size / 4),
            y + (r - 1.5) * (size / 4),
            z
          );
          scene.add(tile);
        }
      }
    });

    // --- 3. Corrupted cubes (misaligned/skewed boxes)
    [
      { x:  20, y: 3, z:  -8 },
      { x: -28, y: 5, z:  12 },
      { x:   5, y: 4, z:  50 },
      { x:  48, y: 6, z:  20 },
    ].forEach(({ x, y, z }, i) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 4),
        mat(0xffffff)
      );
      cube.position.set(x, y, z);
      cube.rotation.set(
        (i * 0.4) % Math.PI,
        (i * 0.7) % Math.PI,
        (i * 0.3) % Math.PI
      );
      cube.castShadow = true;
      scene.add(cube);
      // Black wireframe-style edges (slightly larger transparent black cube)
      const outline = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 4.2, 4.2),
        toon('#000000', { transparent: true, opacity: 0.5 })
      );
      outline.position.set(x, y, z);
      outline.rotation.copy(cube.rotation);
      scene.add(outline);
    });

    // --- 4. Glitch spike columns (tall thin boxes in random orientations)
    [
      { x:  55, z:   0 }, { x: -55, z:   0 },
      { x:   0, z:  65 }, { x:   0, z: -65 },
      { x:  50, z:  50 }, { x: -50, z: -50 },
    ].forEach(({ x, z }, i) => {
      const h = 20 + i * 5;
      const spike = new THREE.Mesh(
        new THREE.BoxGeometry(1, h, 1),
        mat(0x000000)
      );
      spike.position.set(x, h / 2, z);
      spike.rotation.y = (i * Math.PI) / 3;
      scene.add(spike);
      // Red top marker
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        mat(0xff0000, 0x440000)
      );
      marker.position.set(x, h + 1, z);
      scene.add(marker);
    });

    // --- 5. Scan line planes (horizontal dark transparent strips)
    for (let sl = 0; sl < 8; sl++) {
      const scanLine = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 0.5),
        toon('#000000', { transparent: true, opacity: 0.06 })
      );
      scanLine.rotation.x = -Math.PI / 2;
      scanLine.position.set(0, 0.2 + sl * 0.05, sl * 10 - 40);
      scene.add(scanLine);
    }

    // --- 6. Floating null-pointer spheres (black void spheres)
    const nullMat = toon('#000000');
    [
      [ 15, 10, 25 ], [-20,  8,  -8 ], [ 35, 14, 40 ],
      [-40, 12,  20 ], [  0, 16, -15 ], [ 28,  9, 15 ],
    ].forEach(([x, y, z]) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 8),
        nullMat
      );
      sphere.position.set(x, y, z);
      sphere.castShadow = true;
      scene.add(sphere);
    });

    // --- 7. RGB channel ghost planes (semi-transparent coloured planes)
    const rgbPlaneData = [
      { x:  25, y: 5, z: 10, c: 0xff0000, ox:  0.3, ry: 0 },
      { x:  25, y: 5, z: 10, c: 0x0000ff, ox: -0.3, ry: 0 },
      { x: -30, y: 6, z: 30, c: 0xff0000, ox:  0.3, ry: Math.PI / 3 },
      { x: -30, y: 6, z: 30, c: 0x0000ff, ox: -0.3, ry: Math.PI / 3 },
    ];
    rgbPlaneData.forEach(({ x, y, z, c, ox, ry }) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        toon('#' + (c >>> 0).toString(16).padStart(6, '0'), { transparent: true, opacity: 0.25 })
      );
      plane.position.set(x + ox, y, z);
      plane.rotation.y = ry;
      scene.add(plane);
    });

    // --- 8. Data fragment boxes (scattered small box debris)
    const fragmentMat = toon('#ffffff');
    const fragmentMat2 = toon('#000000');
    for (let f = 0; f < 30; f++) {
      const fx = (Math.random() - 0.5) * 160;
      const fz = (Math.random() - 0.5) * 130;
      const fy = Math.random() * 8 + 1;
      const frag = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.5 + Math.random(),
          0.5 + Math.random(),
          0.5 + Math.random()
        ),
        f % 3 === 0 ? fragmentMat2 : fragmentMat
      );
      frag.position.set(fx, fy, fz);
      frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(frag);
    }

    // ------------------------------------------------------------------ GLITCH PARTICLES
    // White static particles
    TrackBuilder.createParticles(scene, {
      count:  400,
      spread:  140,
      color:  '#ffffff',
      size:    0.1,
      speed:   0.08,
    });
    // Red channel shift particles
    TrackBuilder.createParticles(scene, {
      count:  100,
      spread:  100,
      color:  '#ff0000',
      size:    0.08,
      speed:   0.06,
    });
    // Blue channel shift particles
    TrackBuilder.createParticles(scene, {
      count:  100,
      spread:  100,
      color:  '#0000ff',
      size:    0.08,
      speed:   0.06,
    });

    // ------------------------------------------------------------------ NAVIGATION DATA
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'asphalt', traction: 1.0, friction: 0.9 },
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
      respawnY: -5,
    };
  },
};
