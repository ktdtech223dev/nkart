import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'snack_attack',
  name: 'SNACK ATTACK',
  cup: 'dorm',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_dorm_02',
  skyConfig: {
    topColor:    0xffe4cc,
    bottomColor: 0xfffaee,
    fogColor:    0xfffaf0,
    fogDensity:  0.007,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 36,  0,   0) },
      { pos: new THREE.Vector3( 42,  1,  15) },
      { pos: new THREE.Vector3( 34,  2,  30) },
      { pos: new THREE.Vector3( 16,  2,  38) },
      { pos: new THREE.Vector3(  0,  1,  36), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-16,  2,  30), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-34,  2,  15) },
      { pos: new THREE.Vector3(-40,  0,   0) },
      { pos: new THREE.Vector3(-34,  2, -15) },
      { pos: new THREE.Vector3(-16,  2, -30) },
      { pos: new THREE.Vector3(  0,  1, -36) },
      { pos: new THREE.Vector3( 16,  2, -38) },
      { pos: new THREE.Vector3( 34,  2, -30) },
      { pos: new THREE.Vector3( 42,  1, -15) },
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xf5e6c8)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0xfff8e8, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeebb, 1.2);
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

    // Cereal boxes
    const cerealData = [
      { pos: [ 50,  4,  10], color: 0xff6600 },
      { pos: [-50,  4, -10], color: 0x0066ff },
      { pos: [  5,  4,  50], color: 0xffcc00 },
    ];
    cerealData.forEach(({ pos, color }) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(4, 8, 2),
        toon(color)
      );
      box.position.set(pos[0], pos[1], pos[2]);
      box.castShadow = true;
      scene.add(box);
    });

    // Giant fruit (spheres)
    const fruitData = [
      { pos: [ 55,  3, -35], color: 0xff4444 },
      { pos: [-55,  3,  30], color: 0xffaa00 },
    ];
    fruitData.forEach(({ pos, color }) => {
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(3, 12, 10),
        toon(color)
      );
      fruit.position.set(...pos);
      fruit.castShadow = true;
      scene.add(fruit);
    });

    // Utensils (thin cylinders)
    const utensilPositions = [
      [ 48,  3, -30],
      [-48,  3,  20],
      [ 20,  3, -50],
      [-20,  3,  50],
    ];
    utensilPositions.forEach(([ux, uy, uz], i) => {
      const utensil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 12, 6),
        toon(0xcccccc)
      );
      utensil.position.set(ux, uy + 6, uz);
      utensil.rotation.z = (i % 2 === 0 ? 0.3 : -0.3);
      utensil.castShadow = true;
      scene.add(utensil);
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
