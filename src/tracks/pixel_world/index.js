import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'pixel_world',
  name: 'PIXEL WORLD',
  cup: 'arcade',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_arcade_02',
  skyConfig: {
    topColor:    0x5c94fc,
    bottomColor: 0x2038ec,
    fogColor:    0x3048f0,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 36,  0,   0) },
      { pos: new THREE.Vector3( 40,  4,  14) },
      { pos: new THREE.Vector3( 32,  4,  28) },
      { pos: new THREE.Vector3( 16,  8,  38), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0,  8,  36), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-16,  4,  28) },
      { pos: new THREE.Vector3(-36,  4,  14) },
      { pos: new THREE.Vector3(-40,  0,   0) },
      { pos: new THREE.Vector3(-36,  4, -14) },
      { pos: new THREE.Vector3(-16,  4, -28) },
      { pos: new THREE.Vector3(  0,  8, -36), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 16,  8, -38), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 32,  4, -28) },
      { pos: new THREE.Vector3( 40,  4, -14) },
    ];

    const trackData = TrackSplineBuilder.buildTrack(controlPoints, {
      closed:       true,
      segments:     280,
      defaultWidth: 12,
      wallHeight:   1.5,
    });

    scene.add(trackData.roadMesh);
    scene.add(trackData.curbsMesh);
    scene.add(trackData.walls.visual);
    scene.add(trackData.collisionMesh);

    // Ground — NES green
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x52d059)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // 8-bit checkerboard ground overlay
    for (let gx = -100; gx < 100; gx += 8) {
      for (let gz = -100; gz < 100; gz += 8) {
        if ((Math.floor(gx / 8) + Math.floor(gz / 8)) % 2 === 0) {
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(7.8, 7.8),
            toon(0x3eaa45)
          );
          tile.rotation.x = -Math.PI / 2;
          tile.position.set(gx + 4, -0.48, gz + 4);
          scene.add(tile);
        }
      }
    }

    // Ambient
    const ambient = new THREE.AmbientLight(0x8888ff, 0.5);
    scene.add(ambient);

    // White sun
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
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

    // Props — 6 pixel coin cubes (BoxGeometry 1.5x1.5x1.5, emissive gold)
    const coinPositions = [
      [  8,  4,  20],
      [ 12,  4,  22],
      [ 16,  4,  24],
      [ -8,  8,  36],
      [-12,  8,  38],
      [  5,  4, -36],
    ];
    coinPositions.forEach(([cx, cy, cz]) => {
      const coin = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        toon(0xFFD700, { emissive: new THREE.Color(0xFFD700), emissiveIntensity: 0.4 })
      );
      coin.position.set(cx, cy, cz);
      coin.rotation.y = Math.PI / 4;
      coin.castShadow = true;
      scene.add(coin);
    });

    // Props — 4 classic "?" blocks (BoxGeometry 2x2x2)
    const qBlockPositions = [
      [  20,  6,  10],
      [ -20,  6, -10],
      [  38,  8,  30],
      [ -38,  8,  30],
    ];
    qBlockPositions.forEach(([qx, qy, qz]) => {
      // Main block body
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        toon(0xD27D2C, { emissive: new THREE.Color(0x662200), emissiveIntensity: 0.4 })
      );
      block.position.set(qx, qy, qz);
      block.castShadow = true;
      scene.add(block);
      // "?" mark face (white small box)
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 0.15),
        toon(0xffffff)
      );
      mark.position.set(qx, qy, qz + 1.05);
      scene.add(mark);
      // Dot at bottom of ?
      const dot = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.15),
        toon(0xffffff)
      );
      dot.position.set(qx, qy - 0.6, qz + 1.05);
      scene.add(dot);
    });

    // Props — 3 brick platform steps (BoxGeometry)
    const brickData = [
      { x:  44, y:  2, z:   0, w: 10, h: 4,  d: 8 },
      { x: -44, y:  2, z:   0, w: 10, h: 4,  d: 8 },
      { x:   0, y:  4, z:  42, w: 14, h: 8,  d: 6 },
    ];
    brickData.forEach(({ x, y, z, w, h, d }) => {
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        toon(0xB22222)
      );
      platform.position.set(x, y, z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      // Pixel top layer
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.8, d),
        toon(0xcc2222)
      );
      top.position.set(x, y + h / 2 + 0.4, z);
      scene.add(top);
      // Brick mortar lines
      for (let bz = -d / 2 + 2; bz < d / 2; bz += 2) {
        const mortar = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.1, 0.15, 0.15),
          toon(0x888888)
        );
        mortar.position.set(x, y, z + bz);
        scene.add(mortar);
      }
    });

    // Pixel cloud shapes in sky (white boxes at height ~20)
    const cloudData = [
      [  0, 20,  -80],
      [ 50, 22,  -70],
      [-50, 18,  -75],
    ];
    cloudData.forEach(([cx, cy, cz]) => {
      const cloudParts = [
        [0, 0, 0, 6, 4, 3],
        [4, 1, 0, 4, 4, 3],
        [-4, 1, 0, 4, 4, 3],
        [7, 0, 0, 4, 3, 3],
        [-7, 0, 0, 4, 3, 3],
      ];
      cloudParts.forEach(([ox, oy, oz, w, h, d]) => {
        const cloud = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          toon(0xffffff)
        );
        cloud.position.set(cx + ox, cy + oy, cz + oz);
        scene.add(cloud);
      });
    });

    // Flagpole at start/finish
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 16, 8),
      toon(0x888888)
    );
    pole.position.set(-3, 8, 3);
    pole.castShadow = true;
    scene.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 3),
      toon(0xff1744, { emissive: new THREE.Color(0x440000), emissiveIntensity: 0.4 })
    );
    flag.position.set(-0.5, 15, 3);
    scene.add(flag);

    // Green pipes
    [[28, 0, -46], [-28, 0, -46]].forEach(([px, py, pz]) => {
      const pipeBody = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 9, 16),
        toon(0x2e7d32)
      );
      pipeBody.position.set(px, py + 4.5, pz);
      pipeBody.castShadow = true;
      scene.add(pipeBody);
      const pipeLip = new THREE.Mesh(
        new THREE.CylinderGeometry(3.0, 3.0, 1.5, 16),
        toon(0x388e3c)
      );
      pipeLip.position.set(px, py + 9.75, pz);
      scene.add(pipeLip);
    });

    // Coin boost strip visual near t~0.3-0.4
    const boostStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 10),
      toon(0xFFD700, { emissive: new THREE.Color(0xFFD700), emissiveIntensity: 0.4 })
    );
    boostStrip.rotation.x = -Math.PI / 2;
    boostStrip.position.set(8, -0.45, 37);
    scene.add(boostStrip);

    // Second boost strip visual near t~0.75-0.85
    const boostStrip2 = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 10),
      toon(0xFFD700, { emissive: new THREE.Color(0xFFD700), emissiveIntensity: 0.4 })
    );
    boostStrip2.rotation.x = -Math.PI / 2;
    boostStrip2.position.set(8, -0.45, -37);
    scene.add(boostStrip2);

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
