import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'skypiea_circuit',
  name: 'SKYPIEA CIRCUIT',
  cup: 'pirate',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_pirate_04',
  skyConfig: {
    topColor:    0x87CEEB,
    bottomColor: 0xb8e4ff,
    fogColor:    0xdaf0ff,
    fogDensity:  0.004,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 40, 20,   0) },
      { pos: new THREE.Vector3( 48, 26,  20) },
      { pos: new THREE.Vector3( 40, 30,  40), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 20, 24,  52), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0, 20,  50) },
      { pos: new THREE.Vector3(-20, 28,  42) },
      { pos: new THREE.Vector3(-42, 22,  22) },
      { pos: new THREE.Vector3(-50, 16,   0) },
      { pos: new THREE.Vector3(-42, 22, -22), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-20, 28, -42), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0, 20, -50) },
      { pos: new THREE.Vector3( 20, 24, -52) },
      { pos: new THREE.Vector3( 40, 30, -40) },
      { pos: new THREE.Vector3( 48, 26, -20) },
    ];

    const trackData = TrackSplineBuilder.buildTrack(controlPoints, {
      closed:       true,
      segments:     280,
      defaultWidth: 13,
      wallHeight:   1.5,
    });

    scene.add(trackData.roadMesh);
    scene.add(trackData.curbsMesh);
    scene.add(trackData.walls.visual);
    scene.add(trackData.collisionMesh);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xffffff)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0xffeedd, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffcc, 1.2);
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

    // Cloud puff clusters (semi-transparent white spheres)
    const cloudPositions = [
      [ 70, 10,  20],
      [-70, 15, -10],
      [ 10, 12,  70],
      [-10, 18, -70],
      [ 60, 14, -50],
      [-60,  8,  50],
    ];
    cloudPositions.forEach(([cx, cy, cz]) => {
      [0, 1, 2].forEach(i => {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(8 + i * 3, 8, 6),
          toon(0xffffff)
        );
        puff.scale.set(1, 0.45, 1);
        puff.position.set(cx + i * 6, cy, cz + i * 4);
        scene.add(puff);
      });
    });

    // Golden ruin pillars (emissive)
    const pillarPositions = [
      [  5, 18, -60],
      [-10, 24, -55],
      [ 10, 24, -55],
      [-25, 20, -45],
    ];
    pillarPositions.forEach(([px, py, pz]) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.5, 10, 10),
        toon(0xddaa44, { emissive: new THREE.Color(0xffaa00), emissiveIntensity: 0.5 })
      );
      pillar.position.set(px, py + 5, pz);
      pillar.castShadow = true;
      scene.add(pillar);

      const capital = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.2, 4),
        toon(0xddaa44, { emissive: new THREE.Color(0xffaa00), emissiveIntensity: 0.5 })
      );
      capital.position.set(px, py + 10.6, pz);
      scene.add(capital);
    });

    // Angel statue silhouette
    const statueBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 5, 1.5),
      toon(0xeeeeee)
    );
    statueBody.position.set(55, 25, -30);
    statueBody.castShadow = true;
    scene.add(statueBody);

    const statueHead = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      toon(0xeeeeee)
    );
    statueHead.position.set(55, 28, -30);
    scene.add(statueHead);

    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 0.5),
      toon(0xeeeeee)
    );
    wingL.position.set(53, 26.5, -30);
    wingL.rotation.z = 0.4;
    scene.add(wingL);

    const wingR = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 0.5),
      toon(0xeeeeee)
    );
    wingR.position.set(57, 26.5, -30);
    wingR.rotation.z = -0.4;
    scene.add(wingR);

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
