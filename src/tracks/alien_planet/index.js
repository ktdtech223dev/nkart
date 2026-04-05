import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'alien_planet',
  name: 'ALIEN PLANET',
  cup: 'space',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_space_04',
  skyConfig: {
    topColor:    0x1a0533,
    bottomColor: 0x4b0082,
    fogColor:    0x6600aa,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    // Control points: {pos: THREE.Vector3, surfaceType?: string, width?: number}
    const controlPoints = [
      { pos: new THREE.Vector3( 40,  0,   0) },
      { pos: new THREE.Vector3( 50,  4,  20) },
      { pos: new THREE.Vector3( 42,  8,  40) },
      { pos: new THREE.Vector3( 20, 12,  52) },
      { pos: new THREE.Vector3(  0, 10,  50), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(-20,  8,  42), surfaceType: 'dirt', width: 8 },
      { pos: new THREE.Vector3(-40,  4,  20) },
      { pos: new THREE.Vector3(-45,  0,   0) },
      { pos: new THREE.Vector3(-40,  4, -20) },
      { pos: new THREE.Vector3(-20,  8, -42), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(  0, 10, -50), surfaceType: 'dirt', width: 8 },
      { pos: new THREE.Vector3( 20, 12, -52) },
      { pos: new THREE.Vector3( 42,  8, -40) },
      { pos: new THREE.Vector3( 50,  4, -20) },
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

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x2d0054)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting
    const ambient = new THREE.AmbientLight(0x4400aa, 0.5);
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

    // Props: 6 tall spire rocks (narrow-top cylinders, color 0x9900cc)
    const spirePositions = [
      [ 62,  0,  10], [ 58,  0,  45], [-62,  0,   5],
      [-55,  0, -35], [ 30,  0, -62], [-25,  0,  62],
    ];
    spirePositions.forEach(([sx, sy, sz]) => {
      const h = 10 + Math.random() * 8;
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 2.5, h, 7),
        toon(0x9900cc)
      );
      spire.position.set(sx, h / 2, sz);
      spire.rotation.y = Math.random() * Math.PI;
      spire.castShadow = true;
      scene.add(spire);

      // Smaller companion spire
      const sh2 = h * 0.5;
      const spire2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 1.4, sh2, 6),
        toon(0x7700aa)
      );
      spire2.position.set(sx + 3, sh2 / 2, sz + 2);
      spire2.castShadow = true;
      scene.add(spire2);
    });

    // Bioluminescent ground pools
    [
      [ 20,  38], [-35, -22], [ 48, -28], [ -8,  52],
    ].forEach(([px, pz]) => {
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(4, 16),
        toon(0x00cc88)
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(px, 0.05, pz);
      scene.add(pool);
    });

    // Floating bioluminescent orbs
    [
      [ 35,  6,  30], [-30,  8, -40], [ 10,  5, -55], [-50,  7,  25],
    ].forEach(([ox, oy, oz]) => {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 10, 10),
        toon(0x00ffcc)
      );
      orb.position.set(ox, oy, oz);
      scene.add(orb);
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
