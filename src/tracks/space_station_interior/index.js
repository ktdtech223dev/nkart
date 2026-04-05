import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'space_station_interior',
  name: 'SPACE STATION INTERIOR',
  cup: 'space',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_space_03',
  skyConfig: {
    topColor:    0x000010,
    bottomColor: 0x000820,
    fogColor:    0x001030,
    fogDensity:  0.008,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 32,  5,   0) },
      { pos: new THREE.Vector3( 38, 10,  16) },
      { pos: new THREE.Vector3( 30, 16,  30), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 14, 20,  38), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0, 16,  36) },
      { pos: new THREE.Vector3(-14, 20,  30) },
      { pos: new THREE.Vector3(-32, 14,  16) },
      { pos: new THREE.Vector3(-38,  8,   0) },
      { pos: new THREE.Vector3(-32, 14, -16), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-14, 20, -30), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0, 16, -36) },
      { pos: new THREE.Vector3( 14, 20, -38) },
      { pos: new THREE.Vector3( 30, 16, -30) },
      { pos: new THREE.Vector3( 38, 10, -16) },
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x111122)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0x224466, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x88aaff, 1.2);
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

    // Airlock door frames
    const airlockPositions = [
      { pos: [  0, 10,  45], ry: 0 },
      { pos: [ 45, 10,   0], ry: Math.PI / 2 },
      { pos: [  0, 10, -45], ry: 0 },
      { pos: [-45, 10,   0], ry: Math.PI / 2 },
    ];
    airlockPositions.forEach(({ pos, ry }) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 0.5),
        toon(0x334455)
      );
      frame.position.set(...pos);
      frame.rotation.y = ry;
      frame.castShadow = true;
      scene.add(frame);

      // Inner opening cutout suggestion (darker inset)
      const inner = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4.5, 0.3),
        toon(0x111122)
      );
      inner.position.set(pos[0], pos[1], pos[2]);
      inner.rotation.y = ry;
      scene.add(inner);
    });

    // Instrument panel boxes (emissive)
    const panelPositions = [
      [ 50, 10,  20],
      [-50, 12, -15],
      [  5, 18, -50],
    ];
    panelPositions.forEach(([px, py, pz]) => {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3, 1),
        toon(0x223344, { emissive: new THREE.Color(0x0088ff), emissiveIntensity: 0.5 })
      );
      panel.position.set(px, py, pz);
      panel.castShadow = true;
      scene.add(panel);

      // Screen glow
      const screenGlow = new THREE.PointLight(0x0088ff, 0.5, 15);
      screenGlow.position.set(px, py, pz);
      scene.add(screenGlow);
    });

    // Spinning ring decoration (large torus)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(18, 0.8, 8, 32),
      toon(0x445566)
    );
    ring.position.set(0, 12, 0);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(18, 0.5, 8, 32),
      toon(0x334455)
    );
    ring2.position.set(0, 12, 0);
    ring2.rotation.z = Math.PI / 4;
    scene.add(ring2);

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
