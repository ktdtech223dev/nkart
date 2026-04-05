import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'jungle_canopy',
  name: 'JUNGLE CANOPY',
  cup: 'nature',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_nature_01',
  skyConfig: {
    topColor:    0x1a3a0a,
    bottomColor: 0x2a5a14,
    fogColor:    0x3a7020,
    fogDensity:  0.01,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 38,  8,   0) },
      { pos: new THREE.Vector3( 46, 14,  18) },
      { pos: new THREE.Vector3( 38, 20,  36), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 20, 24,  48), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(  0, 18,  46) },
      { pos: new THREE.Vector3(-20, 22,  38) },
      { pos: new THREE.Vector3(-40, 16,  20) },
      { pos: new THREE.Vector3(-46, 10,   0) },
      { pos: new THREE.Vector3(-40, 16, -20), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(-20, 22, -38), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(  0, 18, -46) },
      { pos: new THREE.Vector3( 20, 24, -48) },
      { pos: new THREE.Vector3( 38, 20, -36) },
      { pos: new THREE.Vector3( 46, 14, -18) },
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

    // Ground plane — jungle floor far below
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x2a5a0a)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting — dappled green canopy
    const ambient = new THREE.AmbientLight(0x44aa22, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffaa, 1.2);
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

    // Warm forest floor fill
    const fillLight = new THREE.PointLight(0x44aa22, 0.4, 100);
    fillLight.position.set(0, 0, 0);
    scene.add(fillLight);

    // Props

    // 5 tree trunk cylinders — radius 3-4, color 0x5C3317
    const trunkData = [
      { x:  52, z:  18, r: 4 },
      { x: -52, z: -18, r: 3.5 },
      { x:  18, z: -54, r: 4 },
      { x: -18, z:  54, r: 3 },
      { x:  52, z: -30, r: 3.5 },
    ];
    trunkData.forEach(({ x, z, r }) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r + 1, 55, 10),
        toon(0x5C3317)
      );
      trunk.position.set(x, 27, z);
      trunk.castShadow = true;
      scene.add(trunk);
      // Bark stripes
      for (let b = 0; b < 5; b++) {
        const stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(r + 0.1, r + 1.1, 0.5, 10, 1, true),
          toon(0x3a1e0a)
        );
        stripe.position.set(x, 5 + b * 9, z);
        scene.add(stripe);
      }
    });

    // 4 large leaf clusters — SphereGeometry flattened, color 0x228B22
    const leafData = [
      { x:  40, y: 28, z:  25 },
      { x: -40, y: 32, z: -25 },
      { x:  20, y: 30, z: -55 },
      { x: -20, y: 26, z:  55 },
    ];
    leafData.forEach(({ x, y, z }) => {
      const cluster = new THREE.Mesh(
        new THREE.SphereGeometry(10, 10, 6),
        toon(0x228B22)
      );
      cluster.scale.set(1.5, 0.35, 1.5);
      cluster.position.set(x, y, z);
      cluster.castShadow = true;
      scene.add(cluster);
      // Darker underside
      const under = new THREE.Mesh(
        new THREE.SphereGeometry(9.5, 10, 6),
        toon(0x165a16)
      );
      under.scale.set(1.4, 0.25, 1.4);
      under.position.set(x, y - 2, z);
      scene.add(under);
    });

    // Hanging vines (thin cylinders)
    const vineData = [
      { x:  15, y: 38, z:   5 },
      { x: -10, y: 40, z: -15 },
      { x:  32, y: 35, z: -10 },
      { x: -32, y: 38, z:  12 },
    ];
    vineData.forEach(({ x, y, z }) => {
      const len = 20 + Math.random() * 10;
      const vine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.14, len, 6),
        toon(0x3a6b12)
      );
      vine.position.set(x, y - len / 2, z);
      vine.rotation.z = (Math.random() - 0.5) * 0.25;
      scene.add(vine);
    });

    // Tropical flowers
    const flowerData = [
      { x: -12, y: 16, z:  18, petal: 0xff4499 },
      { x:  28, y: 18, z: -20, petal: 0xff7700 },
      { x: -30, y: 14, z:   5, petal: 0xee22cc },
      { x:   8, y: 16, z:  30, petal: 0xff0066 },
    ];
    flowerData.forEach(({ x, y, z, petal }) => {
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petalMesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.7, 2.8, 6),
          toon(petal)
        );
        petalMesh.position.set(
          x + Math.cos(angle) * 1.8,
          y,
          z + Math.sin(angle) * 1.8
        );
        petalMesh.rotation.z = Math.cos(angle) * 0.8;
        petalMesh.rotation.x = -Math.sin(angle) * 0.8;
        scene.add(petalMesh);
      }
      const centre = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 10, 8),
        toon(0xffee00)
      );
      centre.position.set(x, y + 0.4, z);
      scene.add(centre);
    });

    // Macaw birds (box bodies + wings)
    const macawData = [
      { x:  22, y: 22,  z:  8, body: 0xff2222, wing: 0x0044ff },
      { x: -18, y: 24,  z: -22, body: 0x22cc11, wing: 0xff9900 },
      { x:  35, y: 20,  z: -12, body: 0xffcc00, wing: 0xff2200 },
    ];
    macawData.forEach(({ x, y, z, body, wing }) => {
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.7), toon(body));
      bodyMesh.position.set(x, y, z);
      bodyMesh.castShadow = true;
      scene.add(bodyMesh);
      [-1, 1].forEach(side => {
        const wingMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.8), toon(wing));
        wingMesh.position.set(x + side * 1.4, y, z);
        wingMesh.rotation.z = side * 0.5;
        scene.add(wingMesh);
      });
    });

    // Firefly particles
    const fireflyGeo = new THREE.BufferGeometry();
    const ffPos = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      ffPos[i * 3]     = (Math.random() - 0.5) * 90;
      ffPos[i * 3 + 1] = 8 + Math.random() * 22;
      ffPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    scene.add(new THREE.Points(fireflyGeo, new THREE.PointsMaterial({
      color: 0xccff44, size: 0.25, transparent: true, opacity: 0.85, depthWrite: false,
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
