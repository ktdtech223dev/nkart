import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'the_void',
  name: 'THE VOID',
  cup: 'shadow',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_shadow_04',
  skyConfig: {
    topColor:    0x000000,
    bottomColor: 0x000005,
    fogColor:    0x000010,
    fogDensity:  0.004,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 40, 10,   0) },
      { pos: new THREE.Vector3( 48, 20,  20), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 36, 30,  38), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 15, 22,  50) },
      { pos: new THREE.Vector3(  0, 14,  48) },
      { pos: new THREE.Vector3(-18, 24,  40) },
      { pos: new THREE.Vector3(-40, 18,  22) },
      { pos: new THREE.Vector3(-48, 28,   0) },
      { pos: new THREE.Vector3(-40, 18, -22) },
      { pos: new THREE.Vector3(-18, 24, -40), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0, 14, -48), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 15, 22, -50) },
      { pos: new THREE.Vector3( 36, 30, -38) },
      { pos: new THREE.Vector3( 48, 20, -20) },
    ];

    const trackData = TrackSplineBuilder.buildTrack(controlPoints, {
      closed:       true,
      segments:     280,
      defaultWidth: 10,
      wallHeight:   2.0,
    });

    scene.add(trackData.roadMesh);
    scene.add(trackData.curbsMesh);
    scene.add(trackData.walls.visual);
    scene.add(trackData.collisionMesh);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x000000)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0x111133, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x6666ff, 1.2);
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

    // Floating void cubes (emissive)
    const cubeData = [
      { pos: [ 60, 18,  25], color: 0x4444ff },
      { pos: [-60, 22, -20], color: 0x8800ff },
      { pos: [ 15, 25, -65], color: 0x4444ff },
      { pos: [-15, 30,  60], color: 0x8800ff },
      { pos: [ 55, 15, -55], color: 0x4444ff },
    ];
    cubeData.forEach(({ pos, color }) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        toon(color, { emissive: new THREE.Color(color), emissiveIntensity: 0.5 })
      );
      cube.position.set(...pos);
      cube.rotation.set(0.4, 0.6, 0.2);
      scene.add(cube);

      const glow = new THREE.PointLight(color, 0.8, 20);
      glow.position.set(...pos);
      scene.add(glow);
    });

    // Cosmic particle rings (large tori, emissive)
    const ringData = [
      { pos: [  0, 20,   0], rx: 0.3, rz: 0 },
      { pos: [ 35, 25, -35], rx: 0.5, rz: 0.4 },
      { pos: [-35, 18,  35], rx: 0.2, rz: 0.6 },
    ];
    ringData.forEach(({ pos, rx, rz }) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(22, 0.6, 8, 48),
        toon(0x220044, { emissive: new THREE.Color(0x220044), emissiveIntensity: 0.5 })
      );
      ring.position.set(...pos);
      ring.rotation.x = rx;
      ring.rotation.z = rz;
      scene.add(ring);
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
      respawnY:         -20,
    };
  },
};

export default track;
