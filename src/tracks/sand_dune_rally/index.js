import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'sand_dune_rally',
  name: 'SAND DUNE RALLY',
  cup: 'volcano',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_volcano_03',
  skyConfig: {
    topColor:    0xd4a060,
    bottomColor: 0xe8c080,
    fogColor:    0xf0d090,
    fogDensity:  0.006,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 45,  0,   0) },
      { pos: new THREE.Vector3( 52,  8,  22), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 45, 14,  44), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 22, 10,  56) },
      { pos: new THREE.Vector3(  0,  6,  54), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(-22, 12,  46), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(-46, 16,  24) },
      { pos: new THREE.Vector3(-52,  8,   0), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(-46, 14, -24), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(-22, 10, -46) },
      { pos: new THREE.Vector3(  0,  6, -54), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 22, 12, -56), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 46, 16, -44) },
      { pos: new THREE.Vector3( 52,  8, -22) },
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xd4b060)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0xffcc88, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
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

    // Sand dune mounds (flattened spheres)
    const dunePositions = [
      [ 65,  0,  40],
      [-65,  0, -30],
      [ 10,  0, -70],
      [-10,  0,  70],
    ];
    dunePositions.forEach(([dx, dy, dz]) => {
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(14, 10, 8),
        toon(0xd4b060)
      );
      dune.scale.set(1, 0.3, 1);
      dune.position.set(dx, dy, dz);
      dune.receiveShadow = true;
      scene.add(dune);
    });

    // Cactus groups
    const cactusPositions = [
      [ 68,  0,  -5],
      [-68,  0,  10],
      [  5,  0,  72],
    ];
    cactusPositions.forEach(([cx, cy, cz]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.9, 8, 8),
        toon(0x228B22)
      );
      trunk.position.set(cx, cy + 4, cz);
      trunk.castShadow = true;
      scene.add(trunk);

      // Left arm
      const armH = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 3, 6),
        toon(0x228B22)
      );
      armH.rotation.z = Math.PI / 2;
      armH.position.set(cx - 1.5, cy + 5, cz);
      scene.add(armH);

      const armV = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 2.5, 6),
        toon(0x228B22)
      );
      armV.position.set(cx - 3, cy + 6.25, cz);
      scene.add(armV);
    });

    // Oasis palm trees
    const palmPositions = [
      [-70,  0,  35],
      [ 70,  0, -40],
    ];
    palmPositions.forEach(([px, py, pz]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 10, 8),
        toon(0x8b6914)
      );
      trunk.position.set(px, py + 5, pz);
      trunk.rotation.z = 0.15;
      trunk.castShadow = true;
      scene.add(trunk);

      const top = new THREE.Mesh(
        new THREE.SphereGeometry(4, 8, 6),
        toon(0x228B22)
      );
      top.scale.set(1, 0.5, 1);
      top.position.set(px + 0.75, py + 10.5, pz);
      scene.add(top);
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
