import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'glitch_zone',
  name: 'GLITCH ZONE',
  cup: 'arcade',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_arcade_04',
  skyConfig: {
    topColor:    0x050015,
    bottomColor: 0x150030,
    fogColor:    0x200044,
    fogDensity:  0.009,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 36,  0,   0) },
      { pos: new THREE.Vector3( 44, 10,  15) },
      { pos: new THREE.Vector3( 32, 18,  28) },
      { pos: new THREE.Vector3( 12,  5,  40), surfaceType: 'boost' },
      { pos: new THREE.Vector3( -8, 14,  42), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-24, 20,  30) },
      { pos: new THREE.Vector3(-38,  6,  15) },
      { pos: new THREE.Vector3(-44, 15,   0) },
      { pos: new THREE.Vector3(-38,  6, -15) },
      { pos: new THREE.Vector3(-24, 20, -30), surfaceType: 'boost' },
      { pos: new THREE.Vector3( -8, 14, -42), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 12,  5, -40) },
      { pos: new THREE.Vector3( 32, 18, -28) },
      { pos: new THREE.Vector3( 44, 10, -15) },
    ];

    const trackData = TrackSplineBuilder.buildTrack(controlPoints, {
      closed:       true,
      segments:     280,
      defaultWidth: 11,
      wallHeight:   1.5,
    });

    scene.add(trackData.roadMesh);
    scene.add(trackData.curbsMesh);
    scene.add(trackData.walls.visual);
    scene.add(trackData.collisionMesh);

    // Ground plane — glitch void
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x100020)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid lines on ground
    const gridMat = (() => {
      const m = toon(0x440088);
      m.transparent = true;
      m.opacity = 0.4;
      return m;
    })();
    for (let gx = -120; gx <= 120; gx += 8) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 240), gridMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(gx, -0.48, 0);
      scene.add(line);
    }
    for (let gz = -120; gz <= 120; gz += 8) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(240, 0.15), gridMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, -0.48, gz);
      scene.add(line);
    }

    // Lighting — purple glitch + cyan scan
    const ambient = new THREE.AmbientLight(0x8800ff, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x00ffff, 1.2);
    sun.position.set(30, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);

    // RGB split fills
    const redFill = new THREE.PointLight(0xff0000, 0.4, 200);
    redFill.position.set(10, 20, 0);
    scene.add(redFill);
    const blueFill = new THREE.PointLight(0x0000ff, 0.4, 200);
    blueFill.position.set(-10, 20, 0);
    scene.add(blueFill);

    // Props

    // 6 floating glitch cubes at varied heights — emissive 0xff00ff / 0x00ffff
    const glitchCubeData = [
      { x:  50, y: 12, z:   0, size: 2.5, color: 0xff00ff },
      { x: -50, y:  8, z:   0, size: 1.8, color: 0x00ffff },
      { x:   0, y: 18, z:  55, size: 3.0, color: 0xff00ff },
      { x:   0, y:  6, z: -55, size: 2.0, color: 0x00ffff },
      { x:  40, y: 22, z:  40, size: 1.5, color: 0xff00ff },
      { x: -40, y: 14, z: -40, size: 2.2, color: 0x00ffff },
    ];
    glitchCubeData.forEach(({ x, y, z, size, color }, i) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        (() => {
          const m = toon(0x111111);
          m.emissive = new THREE.Color(color);
          m.emissiveIntensity = 1.2;
          return m;
        })()
      );
      cube.position.set(x, y, z);
      cube.rotation.set(i * 0.7, i * 1.1, i * 0.4);
      cube.castShadow = true;
      scene.add(cube);
      // Glow
      const glow = new THREE.PointLight(color, 0.8, 20);
      glow.position.set(x, y, z);
      scene.add(glow);
    });

    // Glitch spike columns
    [[60, 0], [-60, 0], [0, 60], [0, -60]].forEach(([sx, sz], i) => {
      const h = 25 + i * 4;
      const spike = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, h, 1.2),
        toon(0x220044)
      );
      spike.position.set(sx, h / 2, sz);
      scene.add(spike);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2.5, 2.5),
        (() => {
          const m = toon(0x111111);
          m.emissive = new THREE.Color(0xff00ff);
          m.emissiveIntensity = 1.0;
          return m;
        })()
      );
      top.position.set(sx, h + 1.25, sz);
      scene.add(top);
    });

    // Missing-texture checkerboard planes (magenta/black)
    [[48, 8, 20], [-48, 10, -20], [0, 14, 60]].forEach(([px, py, pz]) => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 1.5),
            toon((r + c) % 2 === 0 ? 0xff00ff : 0x000000)
          );
          tile.position.set(
            px + (c - 1.5) * 1.5,
            py + (r - 1.5) * 1.5,
            pz
          );
          scene.add(tile);
        }
      }
    });

    // Glitch particle debris
    const debrisGeo = new THREE.BufferGeometry();
    const debrisPos = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      debrisPos[i * 3]     = (Math.random() - 0.5) * 120;
      debrisPos[i * 3 + 1] = Math.random() * 30;
      debrisPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
    scene.add(new THREE.Points(debrisGeo, new THREE.PointsMaterial({
      color: 0xff00ff, size: 0.15, transparent: true, opacity: 0.8, depthWrite: false,
    })));

    return {
      collisionMesh:    trackData.collisionMesh,
      walls:            trackData.walls,
      curve:            trackData.curve,
      checkpoints:      trackData.checkpoints,
      startPositions:   trackData.startPositions,
      itemBoxPositions: trackData.itemBoxPositions,
      waypointPath:     trackData.waypoints,
      hazards:          [],
      respawnY:         -8,
    };
  },
};

export default track;
