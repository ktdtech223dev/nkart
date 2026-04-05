import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'corrupted_arcade',
  name: 'CORRUPTED ARCADE',
  cup: 'shadow',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_shadow_03',
  skyConfig: {
    topColor:    0x110022,
    bottomColor: 0x220044,
    fogColor:    0x330066,
    fogDensity:  0.008,
  },

  buildGeometry(scene) {
    // Control points: chaotic zigzag loop with elevation glitches
    const controlPoints = [
      { pos: new THREE.Vector3( 35,  0,   0) },
      { pos: new THREE.Vector3( 42,  8,  15) },
      { pos: new THREE.Vector3( 28, 15,  32), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 10,  5,  42), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-10, 18,  40) },
      { pos: new THREE.Vector3(-28, 10,  30) },
      { pos: new THREE.Vector3(-40,  2,  15) },
      { pos: new THREE.Vector3(-45,  8,   0) },
      { pos: new THREE.Vector3(-40,  2, -15) },
      { pos: new THREE.Vector3(-28, 10, -30), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-10, 18, -40), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 10,  5, -42) },
      { pos: new THREE.Vector3( 28, 15, -32) },
      { pos: new THREE.Vector3( 42,  8, -15) },
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

    // Ground plane (corrupted dark)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x220033)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Checkerboard floor pattern (corrupted)
    const tileSize = 8;
    [0x0d0022, 0x1a0044].forEach((col, ci) => {
      for (let tx = -8; tx <= 8; tx++) {
        for (let tz = -8; tz <= 8; tz++) {
          if ((Math.abs(tx + tz)) % 2 === ci) {
            const tile = new THREE.Mesh(
              new THREE.PlaneGeometry(tileSize - 0.1, tileSize - 0.1),
              toon(col)
            );
            tile.rotation.x = -Math.PI / 2;
            tile.rotation.z = Math.PI / 4;
            tile.position.set(tx * tileSize, -0.48, tz * tileSize);
            scene.add(tile);
          }
        }
      }
    });

    // Magenta grid lines
    const gridMat = toon(0x440033);
    for (let g = -80; g <= 80; g += 8) {
      const hLine = new THREE.Mesh(new THREE.PlaneGeometry(200, 0.2), gridMat);
      hLine.rotation.x = -Math.PI / 2;
      hLine.position.set(0, -0.47, g);
      scene.add(hLine);
      const vLine = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 200), gridMat);
      vLine.rotation.x = -Math.PI / 2;
      vLine.position.set(g, -0.47, 0);
      scene.add(vLine);
    }

    // Lighting
    const ambient = new THREE.AmbientLight(0xff00ff, 0.5);
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

    // Props: 5 floating pixel cubes with glitch colors
    const pixelColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff00ff, 0x00ffff];
    const cubePositions = [
      [ 20,  8,  25], [-22, 12, -18], [ 38, 16,  -5],
      [-15, 20,  38], [  8, 10, -45],
    ];
    cubePositions.forEach(([cx, cy, cz], i) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        toon(pixelColors[i % pixelColors.length])
      );
      cube.position.set(cx, cy, cz);
      cube.rotation.set(i * 0.5, i * 0.3, i * 0.7);
      cube.castShadow = true;
      scene.add(cube);
      // Smaller companion glitch cube
      const mini = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        toon(pixelColors[(i + 2) % pixelColors.length])
      );
      mini.position.set(cx + 2.5, cy + 1, cz + 1);
      mini.rotation.set(i * 0.8, i * 0.4, i * 0.2);
      scene.add(mini);
    });

    // Arcade cabinet silhouettes
    [
      [ 55,  5,  10], [-55,  5, -10], [ 55,  5, -30], [-55,  5,  30],
    ].forEach(([ax, ay, az]) => {
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(5, 10, 4),
        toon(0x0a0011)
      );
      cabinet.position.set(ax, ay, az);
      cabinet.castShadow = true;
      scene.add(cabinet);
      // Glitching screen
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3.5, 0.3),
        toon(0x220033)
      );
      screen.position.set(ax, ay + 2, az + 2.2);
      scene.add(screen);
    });

    // Corrupted neon tube lights overhead
    const neonMat = toon(0x220033);
    [
      [  0, 14, 30], [ 20, 14, 15], [-20, 14, 15],
      [ 30, 14, -5], [-30, 14, -5],
    ].forEach(([tx, ty, tz]) => {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 12, 8),
        neonMat
      );
      tube.position.set(tx, ty, tz);
      tube.rotation.z = Math.PI / 2;
      scene.add(tube);
    });

    // Glitch cracks in floor
    const crackMat = toon(0xff00aa);
    [
      [  8,  18, 7,  0.3], [-10, -15, 9, 0.5],
      [ 22,  -8, 6, -0.2], [-18,  28, 8, 0.7],
    ].forEach(([x, z, len, rot]) => {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.3, len), crackMat);
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = rot;
      crack.position.set(x, -0.45, z);
      scene.add(crack);
    });

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
