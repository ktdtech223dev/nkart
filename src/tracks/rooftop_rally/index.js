import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'rooftop_rally',
  name: 'ROOFTOP RALLY',
  cup: 'city',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_city_03',
  skyConfig: {
    topColor:    0x1a2a4a,
    bottomColor: 0x2a4a7a,
    fogColor:    0x3a5a8a,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 40, 10,   0) },
      { pos: new THREE.Vector3( 48, 18,  20) },
      { pos: new THREE.Vector3( 38, 25,  38) },
      { pos: new THREE.Vector3( 20, 20,  50) },
      { pos: new THREE.Vector3(  0, 15,  48), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-20, 22,  40), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-42, 18,  22) },
      { pos: new THREE.Vector3(-50, 10,   0) },
      { pos: new THREE.Vector3(-42, 16, -22) },
      { pos: new THREE.Vector3(-22, 25, -40) },
      { pos: new THREE.Vector3(  0, 20, -50) },
      { pos: new THREE.Vector3( 20, 15, -50) },
      { pos: new THREE.Vector3( 38, 22, -36) },
      { pos: new THREE.Vector3( 48, 14, -18) },
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x2a2a2a)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0x334488, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff4cc, 1.2);
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

    // Building parapet walls
    const parapetData = [
      { pos: [  0, 12,  60], size: [20, 3, 1] },
      { pos: [ 55, 20,  10], size: [20, 3, 1] },
      { pos: [-55, 14,  10], size: [20, 3, 1] },
      { pos: [  0, 18, -55], size: [20, 3, 1] },
      { pos: [ 30, 22, -45], size: [20, 3, 1] },
    ];
    parapetData.forEach(({ pos, size }) => {
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        toon(0x888888)
      );
      parapet.position.set(...pos);
      parapet.castShadow = true;
      scene.add(parapet);
    });

    // Water towers
    const towerPositions = [
      [ 60, 10,  30],
      [-60, 14, -10],
      [ 10, 22, -60],
    ];
    towerPositions.forEach(([tx, ty, tz]) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 8, 10),
        toon(0x664433)
      );
      base.position.set(tx, ty + 4, tz);
      base.castShadow = true;
      scene.add(base);

      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(3, 3, 10),
        toon(0x553322)
      );
      cap.position.set(tx, ty + 9.5, tz);
      scene.add(cap);
    });

    // Rooftop AC units
    const acPositions = [
      [ 50, 10, -20],
      [-30, 22,  50],
    ];
    acPositions.forEach(([ax, ay, az]) => {
      const unit = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 3),
        toon(0xaaaaaa)
      );
      unit.position.set(ax, ay + 1, az);
      unit.castShadow = true;
      scene.add(unit);

      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.3, 10),
        toon(0x999999)
      );
      fan.position.set(ax, ay + 2.15, az);
      scene.add(fan);
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
