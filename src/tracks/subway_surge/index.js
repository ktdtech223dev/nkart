import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'subway_surge',
  name: 'SUBWAY SURGE',
  cup: 'city',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_city_02',
  skyConfig: {
    topColor:    0x080808,
    bottomColor: 0x111111,
    fogColor:    0x0a0a0a,
    fogDensity:  0.015,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 36,  3,   0) },
      { pos: new THREE.Vector3( 42,  6,  16) },
      { pos: new THREE.Vector3( 34, 10,  30) },
      { pos: new THREE.Vector3( 16, 14,  40) },
      { pos: new THREE.Vector3(  0, 12,  38), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-16, 10,  30), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-34,  6,  16) },
      { pos: new THREE.Vector3(-40,  3,   0) },
      { pos: new THREE.Vector3(-34,  6, -16) },
      { pos: new THREE.Vector3(-16, 10, -30) },
      { pos: new THREE.Vector3(  0, 12, -38) },
      { pos: new THREE.Vector3( 16, 14, -40) },
      { pos: new THREE.Vector3( 34, 10, -30) },
      { pos: new THREE.Vector3( 42,  6, -16) },
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
      toon(0x181818)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const ambient = new THREE.AmbientLight(0x334433, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffff88, 1.2);
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

    // Subway tile pillars
    const pillarPositions = [
      [ 45,  3,  20],
      [-45,  3, -20],
      [ 20,  6,  45],
      [-20,  6, -45],
    ];
    pillarPositions.forEach(([px, py, pz]) => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(1, 6, 1),
        toon(0xddddcc)
      );
      pillar.position.set(px, py + 3, pz);
      pillar.castShadow = true;
      scene.add(pillar);

      // Tile accent stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.4, 1.05),
        toon(0xaaaaaa)
      );
      stripe.position.set(px, py + 2, pz);
      scene.add(stripe);
    });

    // Overhead signal lights (emissive)
    const signalData = [
      { pos: [ 38,  8,  0], color: 0xff0000 },
      { pos: [-38,  8,  0], color: 0x00ff00 },
      { pos: [  0,  8, 40], color: 0xff0000 },
    ];
    signalData.forEach(({ pos, color }) => {
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.8, 1.5),
        toon(0x222222)
      );
      housing.position.set(...pos);
      scene.add(housing);

      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        toon(color, { emissive: new THREE.Color(color), emissiveIntensity: 0.5 })
      );
      lens.position.set(pos[0], pos[1] - 0.5, pos[2]);
      scene.add(lens);

      const glow = new THREE.PointLight(color, 0.6, 15);
      glow.position.set(...pos);
      scene.add(glow);
    });

    // Platform edge strip (long yellow box)
    const edgeStrip = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.3, 0.8),
      toon(0xffff00)
    );
    edgeStrip.position.set(0, 3.15, 42);
    scene.add(edgeStrip);

    const edgeStrip2 = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.3, 0.8),
      toon(0xffff00)
    );
    edgeStrip2.position.set(0, 3.15, -42);
    scene.add(edgeStrip2);

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
