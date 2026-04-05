import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'storm_coast',
  name: 'STORM COAST',
  cup: 'volcano',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_volcano_02',
  skyConfig: {
    topColor:    0x1a2233,
    bottomColor: 0x2a3a55,
    fogColor:    0x3a4a66,
    fogDensity:  0.008,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 42,  4,   0) },
      { pos: new THREE.Vector3( 50, 10,  22), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 42, 16,  42), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 22, 12,  54) },
      { pos: new THREE.Vector3(  0,  8,  52) },
      { pos: new THREE.Vector3(-22, 14,  44) },
      { pos: new THREE.Vector3(-44, 10,  24) },
      { pos: new THREE.Vector3(-50,  4,   0) },
      { pos: new THREE.Vector3(-44, 10, -24), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-22, 14, -44), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  8, -52) },
      { pos: new THREE.Vector3( 22, 12, -54) },
      { pos: new THREE.Vector3( 42, 16, -42) },
      { pos: new THREE.Vector3( 50, 10, -22) },
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x3a5a3a)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0x334466, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x8899aa, 1.2);
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

    // Lighthouse
    const lighthouseBody = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3.0, 24, 12),
      toon(0xddddcc)
    );
    lighthouseBody.position.set(62, 16, 0);
    lighthouseBody.castShadow = true;
    scene.add(lighthouseBody);

    const lighthouseTop = new THREE.Mesh(
      new THREE.SphereGeometry(3, 10, 8),
      toon(0xffffaa, { emissive: new THREE.Color(0xffff88), emissiveIntensity: 0.5 })
    );
    lighthouseTop.position.set(62, 29, 0);
    scene.add(lighthouseTop);

    const lighthouseCap = new THREE.Mesh(
      new THREE.ConeGeometry(3, 4, 12),
      toon(0x333333)
    );
    lighthouseCap.position.set(62, 33, 0);
    scene.add(lighthouseCap);

    const beaconLight = new THREE.PointLight(0xffff88, 1.5, 80);
    beaconLight.position.set(62, 29, 0);
    scene.add(beaconLight);

    // Large sea rocks
    const rockPositions = [
      [ 70,  4,  40],
      [ 68,  4, -35],
      [-65,  4,  30],
      [-68,  4, -40],
    ];
    rockPositions.forEach(([rx, ry, rz], i) => {
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(5 + i * 1.5, 1),
        toon(0x557755)
      );
      rock.position.set(rx, ry, rz);
      rock.castShadow = true;
      scene.add(rock);
    });

    // Cliff wall sections
    const cliffData = [
      { pos: [ 72,  8,  10], size: [6, 16, 20] },
      { pos: [-72,  8, -10], size: [6, 16, 20] },
      { pos: [  0,  8,  70], size: [20, 16, 6] },
    ];
    cliffData.forEach(({ pos, size }) => {
      const cliff = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        toon(0x667755)
      );
      cliff.position.set(...pos);
      cliff.castShadow = true;
      scene.add(cliff);
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
