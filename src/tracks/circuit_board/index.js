import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'circuit_board',
  name: 'CIRCUIT BOARD',
  cup: 'arcade',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_arcade_01',
  skyConfig: {
    topColor:    0x002200,
    bottomColor: 0x003300,
    fogColor:    0x004400,
    fogDensity:  0.01,
  },

  buildGeometry(scene) {
    // Control points: tight technical S-bends, completely flat Y=0
    // boost pads and width variations encoded on control points
    const controlPoints = [
      { pos: new THREE.Vector3( 30,  0,   0), width: 16 },
      { pos: new THREE.Vector3( 30,  0,  12) },
      { pos: new THREE.Vector3( 20,  0,  20) },
      { pos: new THREE.Vector3( 10,  0,  30) },
      { pos: new THREE.Vector3( 20,  0,  38), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 30,  0,  45), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 20,  0,  50), width: 16 },
      { pos: new THREE.Vector3(  0,  0,  50) },
      { pos: new THREE.Vector3(-20,  0,  50) },
      { pos: new THREE.Vector3(-30,  0,  45) },
      { pos: new THREE.Vector3(-20,  0,  38) },
      { pos: new THREE.Vector3(-10,  0,  30) },
      { pos: new THREE.Vector3(-20,  0,  20) },
      { pos: new THREE.Vector3(-30,  0,  12) },
      { pos: new THREE.Vector3(-30,  0,   0) },
      { pos: new THREE.Vector3(-30,  0, -12) },
      { pos: new THREE.Vector3(-20,  0, -20) },
      { pos: new THREE.Vector3(  0,  0, -30), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 20,  0, -20), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 30,  0, -12) },
    ];

    const trackData = TrackSplineBuilder.buildTrack(controlPoints, {
      closed:       true,
      segments:     280,
      defaultWidth: 10,
      wallHeight:   1.5,
    });

    scene.add(trackData.roadMesh);
    scene.add(trackData.curbsMesh);
    scene.add(trackData.walls.visual);
    scene.add(trackData.collisionMesh);

    // Ground plane (PCB green)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x1a3300)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // PCB trace lines on ground
    const traceMat = toon(0x00aa33);
    [
      [ -50,   0, 120,   0.5], [   0, -60,   0.5, 120],
      [  25,  -15,  70,   0.5], [ -20,  48,   0.5,  80],
      [  42,   12,   0.5,  60], [ -38, -12,  90,   0.5],
    ].forEach(([x, z, w, d]) => {
      const trace = new THREE.Mesh(new THREE.PlaneGeometry(w, d), traceMat);
      trace.rotation.x = -Math.PI / 2;
      trace.position.set(x, -0.48, z);
      scene.add(trace);
    });

    // Lighting
    const ambient = new THREE.AmbientLight(0x00ff44, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x99ff99, 1.2);
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

    // Props: 4 large chip components (BoxGeometry, dark color)
    const chipPositions = [
      [ 42,  0,  25, 10, 2, 6], [-42,  0,  25, 12, 2, 7],
      [ 42,  0, -25,  8, 2, 5], [-38,  0, -20, 11, 2, 7],
    ];
    chipPositions.forEach(([cx, cy, cz, w, h, d]) => {
      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        toon(0x222222)
      );
      chip.position.set(cx, h / 2, cz);
      chip.castShadow = true;
      scene.add(chip);
      // White label stripe
      const label = new THREE.Mesh(
        new THREE.BoxGeometry(w - 1, 0.05, 1.5),
        toon(0xffffff)
      );
      label.position.set(cx, h + 0.05, cz);
      scene.add(label);
      // Pin legs
      const pinCount = 4;
      for (let p = 0; p < pinCount; p++) {
        const pinX = cx - w / 2 + 1 + p * (w - 2) / (pinCount - 1);
        [cz - d / 2 - 0.6, cz + d / 2 + 0.6].forEach(pz => {
          const pin = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.4, 1.2),
            toon(0xaaaaaa)
          );
          pin.position.set(pinX, 0.2, pz);
          scene.add(pin);
        });
      }
    });

    // Resistors (small components near track)
    const resMat = toon(0xc8a850);
    [
      [ 18,  0,  12], [-18,  0,  38], [ 10,  0, -18], [-10,  0, -28],
    ].forEach(([rx, ry, rz], i) => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.8), resMat);
      body.position.set(rx, 0.4, rz);
      body.castShadow = true;
      scene.add(body);
      // Color band
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.85, 0.85), toon([0xff0000, 0xffff00, 0x0000ff, 0x00cc00][i % 4]));
      band.position.set(rx, 0.4, rz);
      scene.add(band);
    });

    // Capacitors (tall cylinders at corners)
    [
      [ 36,  0,  -5], [-36,  0,  55], [ 36,  0,  55], [-36,  0,  -5],
    ].forEach(([capx, capy, capz]) => {
      const capHeight = 6 + Math.random() * 3;
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, capHeight, 12),
        toon(0x4a8a3a)
      );
      cap.position.set(capx, capHeight / 2, capz);
      cap.castShadow = true;
      scene.add(cap);
    });

    // Glowing solder points
    [
      [  5,  15], [-15, 20], [ 25, 45], [ 35, 10],
      [-40,  5], [ 15, -25], [ -5, -10], [ 30, -20],
    ].forEach(([sx, sz]) => {
      const solder = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        toon(0xaaddaa)
      );
      solder.position.set(sx, 0.5, sz);
      scene.add(solder);
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
