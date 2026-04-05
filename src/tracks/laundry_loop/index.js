import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'laundry_loop',
  name: 'LAUNDRY LOOP',
  cup: 'dorm',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_dorm_03',
  skyConfig: {
    topColor:    0x88aacc,
    bottomColor: 0xaaccee,
    fogColor:    0xccddee,
    fogDensity:  0.008,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 36,  0,   0) },
      { pos: new THREE.Vector3( 40,  0,  14) },
      { pos: new THREE.Vector3( 32,  0,  28) },
      { pos: new THREE.Vector3( 14,  0,  36), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  0,  34), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-14,  0,  28), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-32,  0,  14) },
      { pos: new THREE.Vector3(-40,  0,   0) },
      { pos: new THREE.Vector3(-32,  0, -14), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-14,  0, -28), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  0, -34), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 14,  0, -36) },
      { pos: new THREE.Vector3( 32,  0, -28) },
      { pos: new THREE.Vector3( 40,  0, -14) },
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

    // Ground — linoleum floor
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xd4d4d4)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Fluorescent ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    // Sun
    const sun = new THREE.DirectionalLight(0xfff8f0, 1.2);
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

    // Props — 4 washing machine boxes
    const machinePositions = [
      [ 44,  0,   8],
      [ 44,  0, -8],
      [-44,  0,   8],
      [-44,  0,  -8],
    ];
    machinePositions.forEach(([mx, my, mz]) => {
      // Machine body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(4, 5, 4),
        toon(0xffffff)
      );
      body.position.set(mx, my + 2.5, mz);
      body.castShadow = true;
      scene.add(body);
      // Door circle overlay (dark disc on front face)
      const door = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.2, 20),
        toon(0x222222)
      );
      door.rotation.x = Math.PI / 2;
      door.position.set(mx, my + 2.8, mz + 2.1);
      scene.add(door);
      // Door glass inner
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 0.22, 20),
        toon(0x88ccff)
      );
      glass.rotation.x = Math.PI / 2;
      glass.position.set(mx, my + 2.8, mz + 2.15);
      scene.add(glass);
      // Control panel top strip
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.8, 0.3),
        toon(0xdddddd)
      );
      panel.position.set(mx, my + 5.4, mz + 1.85);
      scene.add(panel);
    });

    // Props — 2 dryer cylinders
    const dryerPositions = [
      [  0,  0,  44],
      [  0,  0, -44],
    ];
    dryerPositions.forEach(([dx, dy, dz]) => {
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 5, 20),
        toon(0xcccccc)
      );
      drum.rotation.z = Math.PI / 2;
      drum.position.set(dx, dy + 2.5, dz);
      drum.castShadow = true;
      scene.add(drum);
      // End caps
      [-2.6, 2.6].forEach(ox => {
        const cap = new THREE.Mesh(
          new THREE.CircleGeometry(2.5, 20),
          toon(0xbbbbbb)
        );
        cap.rotation.y = ox < 0 ? Math.PI / 2 : -Math.PI / 2;
        cap.position.set(dx + ox, dy + 2.5, dz);
        scene.add(cap);
      });
      // Lint trap handle
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 1.2),
        toon(0x999999)
      );
      handle.position.set(dx, dy + 5.1, dz);
      scene.add(handle);
    });

    // Soapy puddle highlight near center
    const puddle = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8),
      toon(0xe8f4ff)
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(0, -0.48, 0);
    scene.add(puddle);

    // Detergent bottles near machines
    [[-46, 0, 14], [46, 0, 14]].forEach(([bx, by, bz]) => {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.9, 3.5, 12),
        toon(0xff6600)
      );
      bottle.position.set(bx, by + 1.75, bz);
      bottle.castShadow = true;
      scene.add(bottle);
      const cap2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 0.6, 12),
        toon(0xffffff)
      );
      cap2.position.set(bx, by + 3.8, bz);
      scene.add(cap2);
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
