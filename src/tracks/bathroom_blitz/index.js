import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'bathroom_blitz',
  name: 'BATHROOM BLITZ',
  cup: 'dorm',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_dorm_04',
  skyConfig: {
    topColor:    0xe8f4f8,
    bottomColor: 0xb8d4e0,
    fogColor:    0xd0e8f0,
    fogDensity:  0.008,
  },

  buildGeometry(scene) {
    // Control points: {pos: THREE.Vector3, surfaceType?: string, width?: number}
    // soapy water puddle sections are 'ice' surface
    const controlPoints = [
      { pos: new THREE.Vector3( 38,  0,   0) },
      { pos: new THREE.Vector3( 42,  0,  16) },
      { pos: new THREE.Vector3( 36,  3,  32) },
      { pos: new THREE.Vector3( 18,  5,  40) },
      { pos: new THREE.Vector3(  0,  5,  38), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-18,  5,  32), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-36,  3,  16), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-42,  0,   0) },
      { pos: new THREE.Vector3(-36,  3, -16) },
      { pos: new THREE.Vector3(-18,  5, -32), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  5, -38), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 18,  5, -40), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 36,  3, -32) },
      { pos: new THREE.Vector3( 42,  0, -16) },
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

    // Ground plane (light blue-white tile)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xd4eaf0)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Tile grout lines
    const groutMat = toon(0xbbccd8);
    for (let g = -120; g <= 120; g += 10) {
      const hLine = new THREE.Mesh(new THREE.PlaneGeometry(300, 0.3), groutMat);
      hLine.rotation.x = -Math.PI / 2;
      hLine.position.set(0, -0.49, g);
      scene.add(hLine);
      const vLine = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 300), groutMat);
      vLine.rotation.x = -Math.PI / 2;
      vLine.position.set(g, -0.49, 0);
      scene.add(vLine);
    }

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff0cc, 1.2);
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

    // Props: 3 soap bars (BoxGeometry 6x2x3, white)
    const soapPositions = [
      [ 50, 0.5,  5, 0.2], [-50, 0.5, -8, 0.5], [ 10, 0.5, 52, -0.3],
    ];
    soapPositions.forEach(([sx, sy, sz, ry]) => {
      const soap = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 3),
        toon(0xffffff)
      );
      soap.position.set(sx, sy, sz);
      soap.rotation.y = ry;
      soap.castShadow = true;
      scene.add(soap);
    });

    // Props: 2 toilet roll cylinders (CylinderGeometry)
    const rollPositions = [
      [ 55,  0, -30], [-48,  0,  42],
    ];
    rollPositions.forEach(([rx, ry, rz]) => {
      const roll = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 5, 16),
        toon(0xfffde7)
      );
      roll.position.set(rx, 2.5, rz);
      roll.castShadow = true;
      scene.add(roll);
      // Inner cardboard tube
      const inner = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 5.2, 12),
        toon(0xd4b896)
      );
      inner.position.set(rx, 2.5, rz);
      scene.add(inner);
    });

    // Shampoo bottles (tall cylinders on the sides)
    [
      { pos: [-55,  0, 15], h: 9, r: 1.5, col: 0x1565c0 },
      { pos: [ 53,  0, 40], h: 8, r: 1.3, col: 0x388e3c },
      { pos: [  0,  0, 58], h: 10, r: 1.6, col: 0xffa000 },
    ].forEach(({ pos, h, r, col }) => {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r * 0.9, h, 12),
        toon(col)
      );
      bottle.position.set(pos[0], h / 2, pos[2]);
      bottle.castShadow = true;
      scene.add(bottle);
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.6, r * 0.6, 1.5, 10),
        toon(0xffffff)
      );
      cap.position.set(pos[0], h + 0.75, pos[2]);
      scene.add(cap);
    });

    // Soapy water puddles (flat glowing planes in ice sections)
    [
      [-15,  32, 7], [ 0,  38, 8], [-35,  16, 6],
      [-15, -32, 7], [ 0, -38, 8],
    ].forEach(([px, pz, pr]) => {
      const puddle = new THREE.Mesh(
        new THREE.CircleGeometry(pr, 16),
        toon(0xaaddff)
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(px, 0.05, pz);
      scene.add(puddle);
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
