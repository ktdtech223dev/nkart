import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'frozen_tundra',
  name: 'FROZEN TUNDRA',
  cup: 'nature',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_nature_04',
  skyConfig: {
    topColor:    0x8ab4cc,
    bottomColor: 0xcce0ee,
    fogColor:    0xddeef8,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 45,  0,   0), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 52,  2,  22), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 44,  4,  44), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 22,  5,  56), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  4,  54), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-22,  5,  46), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-44,  3,  24), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-50,  0,   0), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-44,  3, -24), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-22,  5, -46), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  4, -54), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 22,  5, -56), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 44,  4, -44), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 52,  2, -22), surfaceType: 'ice' },
    ];

    const trackData = TrackSplineBuilder.buildTrack(controlPoints, {
      closed:       true,
      segments:     280,
      defaultWidth: 14,
      wallHeight:   1.5,
    });

    scene.add(trackData.roadMesh);
    scene.add(trackData.curbsMesh);
    scene.add(trackData.walls.visual);
    scene.add(trackData.collisionMesh);

    // Ground plane — snow white
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xddeef8)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting — cold arctic
    const ambient = new THREE.AmbientLight(0xbbddff, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff0ee, 1.2);
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

    // Props

    // 5 snowdrift mounds — SphereGeometry flattened via scale, color 0xeeeeff
    const driftData = [
      { x:  60, z:  20, r: 8 },
      { x: -60, z: -20, r: 10 },
      { x:  20, z:  70, r: 9 },
      { x: -25, z: -68, r: 7 },
      { x:  65, z: -40, r: 8 },
    ];
    driftData.forEach(({ x, z, r }) => {
      const drift = new THREE.Mesh(
        new THREE.SphereGeometry(r, 10, 6),
        toon(0xeeeeff)
      );
      drift.scale.set(1.2, 0.22, 1.2);
      drift.position.set(x, 0.5, z);
      drift.receiveShadow = true;
      scene.add(drift);
    });

    // 3 pine tree cones — ConeGeometry, color 0x228822
    const pineData = [
      { x:  58, z:   8 },
      { x: -58, z:  12 },
      { x:   0, z: -70 },
    ];
    pineData.forEach(({ x, z }) => {
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 3, 8),
        toon(0x5C4033)
      );
      trunk.position.set(x, 1.5, z);
      trunk.castShadow = true;
      scene.add(trunk);
      // Cone layers
      [0, 1, 2].forEach(layer => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(3.5 - layer * 0.8, 4, 8),
          toon(0x228822)
        );
        cone.position.set(x, 3 + layer * 2.5, z);
        cone.castShadow = true;
        scene.add(cone);
      });
      // Snow on top
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 1.8, 8),
        toon(0xeeeeff)
      );
      snowCap.position.set(x, 11, z);
      scene.add(snowCap);
    });

    // Ice boulders
    const boulderData = [
      { x:  66, z:  45 }, { x: -66, z:  45 },
      { x:  66, z: -45 }, { x: -66, z: -45 },
    ];
    boulderData.forEach(({ x, z }, i) => {
      const r = 3 + (i % 3);
      const boulder = new THREE.Mesh(
        new THREE.SphereGeometry(r, 8, 7),
        toon(0xbbd8ee)
      );
      boulder.position.set(x, r * 0.5, z);
      boulder.scale.set(1, 0.75, 1);
      boulder.castShadow = true;
      scene.add(boulder);
    });

    // Blizzard snow particles
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      snowPos[i * 3]     = (Math.random() - 0.5) * 150;
      snowPos[i * 3 + 1] = Math.random() * 30;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    scene.add(new THREE.Points(snowGeo, new THREE.PointsMaterial({
      color: 0xeef8ff, size: 0.28, transparent: true, opacity: 0.85, depthWrite: false,
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
