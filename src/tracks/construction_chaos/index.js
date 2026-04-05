import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'construction_chaos',
  name: 'CONSTRUCTION CHAOS',
  cup: 'city',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_city_04',
  skyConfig: {
    topColor:    0x8fa8c0,
    bottomColor: 0xc8a878,
    fogColor:    0xd4ba90,
    fogDensity:  0.007,
  },

  buildGeometry(scene) {
    // Control points: ramps and dirt sections, varied elevation
    // dirt sections get wider (14 vs 12)
    const controlPoints = [
      { pos: new THREE.Vector3( 40,  0,   0) },
      { pos: new THREE.Vector3( 48,  3,  18), surfaceType: 'dirt', width: 14 },
      { pos: new THREE.Vector3( 40,  8,  36), surfaceType: 'dirt', width: 14 },
      { pos: new THREE.Vector3( 22, 12,  48), surfaceType: 'dirt', width: 14 },
      { pos: new THREE.Vector3(  0, 10,  50) },
      { pos: new THREE.Vector3(-22,  8,  42) },
      { pos: new THREE.Vector3(-42,  5,  24), surfaceType: 'dirt', width: 14 },
      { pos: new THREE.Vector3(-48,  0,   0) },
      { pos: new THREE.Vector3(-42,  5, -24), surfaceType: 'dirt', width: 14 },
      { pos: new THREE.Vector3(-22,  8, -42), surfaceType: 'dirt', width: 14 },
      { pos: new THREE.Vector3(  0, 10, -50) },
      { pos: new THREE.Vector3( 22, 12, -48) },
      { pos: new THREE.Vector3( 40,  8, -36) },
      { pos: new THREE.Vector3( 48,  3, -18) },
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

    // Ground plane (construction dirt)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x8b7355)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Muddy tire tracks
    const mudMat = toon(0x5a3e22);
    [
      [ 15,  18, 0.6, 40], [-20, -30, 0.6, 35], [ 35,  48, 0.4, 30],
    ].forEach(([mx, mz, mw, ml]) => {
      const rut = new THREE.Mesh(new THREE.PlaneGeometry(ml, mw), mudMat);
      rut.rotation.x = -Math.PI / 2;
      rut.position.set(mx, -0.48, mz);
      scene.add(rut);
    });

    // Lighting
    const ambient = new THREE.AmbientLight(0xfff0cc, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffcc88, 1.2);
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

    // Props: 3 orange construction barriers (BoxGeometry 0.5x2x4)
    const barrierPositions = [
      [ 52,  1.0,  10, 0.1], [-52,  1.0, -10, 0.5], [ 15,  1.0, -52, 0.0],
    ];
    barrierPositions.forEach(([bx, by, bz, ry]) => {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 2, 4),
        toon(0xff6600)
      );
      barrier.position.set(bx, by, bz);
      barrier.rotation.y = ry;
      barrier.castShadow = true;
      scene.add(barrier);
      // Reflective stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 4.1),
        toon(0xffffff)
      );
      stripe.position.set(bx, by + 0.6, bz);
      stripe.rotation.y = ry;
      scene.add(stripe);
    });

    // Props: 2 concrete mixer cylinders
    const mixerPositions = [
      [ 58,  0,  35], [-58,  0, -30],
    ];
    mixerPositions.forEach(([mx, my, mz]) => {
      // Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.5, 5),
        toon(0x555544)
      );
      frame.position.set(mx, 0.75, mz);
      frame.castShadow = true;
      scene.add(frame);
      // Drum (tilted cylinder)
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.5, 5, 12),
        toon(0xcc8833)
      );
      drum.position.set(mx, 4.0, mz);
      drum.rotation.z = Math.PI / 5;
      drum.castShadow = true;
      scene.add(drum);
      // Wheels
      [-1.8, 1.8].forEach(wx => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.7, 0.5, 10),
          toon(0x222222)
        );
        wheel.position.set(mx + wx, 0.5, mz);
        wheel.rotation.z = Math.PI / 2;
        scene.add(wheel);
      });
    });

    // Scaffolding poles
    [
      [ 60,  5,  5], [ 60, 10,  5], [ 65,  5,  5], [ 65, 10,  5],
      [-62,  5, 20], [-62, 10, 20], [-57,  5, 20], [-57, 10, 20],
    ].forEach(([px, py, pz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 10, 7),
        toon(0xcc9900)
      );
      pole.position.set(px, 5, pz);
      pole.castShadow = true;
      scene.add(pole);
    });

    // Cross-members
    [
      [ 62.5, 8,  5, true], [-59.5, 8, 20, true],
    ].forEach(([px, py, pz, horiz]) => {
      const cross = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 5, 7),
        toon(0xcc9900)
      );
      cross.position.set(px, py, pz);
      cross.rotation.z = Math.PI / 2;
      scene.add(cross);
    });

    // Gravel piles
    [
      [ 62,  0,  45], [-60,  0,  55], [ 20,  0, -60],
    ].forEach(([gx, gy, gz]) => {
      const pile = new THREE.Mesh(
        new THREE.SphereGeometry(4, 10, 6),
        toon(0x887755)
      );
      pile.position.set(gx, 0, gz);
      pile.scale.set(1, 0.35, 1.2);
      pile.receiveShadow = true;
      scene.add(pile);
    });

    // Hard hats
    [
      [ 45,  0,  -8], [-45,  0,  55],
    ].forEach(([hx, hy, hz]) => {
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.35, 12),
        toon(0xffcc00)
      );
      brim.position.set(hx, 0.18, hz);
      brim.castShadow = true;
      scene.add(brim);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        toon(0xffcc00)
      );
      dome.position.set(hx, 0.35, hz);
      scene.add(dome);
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
