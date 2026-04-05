import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'downtown_drift',
  name: 'DOWNTOWN DRIFT',
  cup: 'city',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_city_01',
  skyConfig: {
    topColor:    0x0a0a1a,
    bottomColor: 0x1a1a3a,
    fogColor:    0x0a1a2a,
    fogDensity:  0.009,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 40,  0,   0) },
      { pos: new THREE.Vector3( 40,  0,  16) },
      { pos: new THREE.Vector3( 32,  0,  32), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 16,  0,  40), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0,  0,  40) },
      { pos: new THREE.Vector3(-16,  0,  40) },
      { pos: new THREE.Vector3(-32,  0,  32) },
      { pos: new THREE.Vector3(-40,  0,  16) },
      { pos: new THREE.Vector3(-40,  0,   0) },
      { pos: new THREE.Vector3(-40,  0, -16) },
      { pos: new THREE.Vector3(-32,  0, -32) },
      { pos: new THREE.Vector3(-16,  0, -40) },
      { pos: new THREE.Vector3(  0,  0, -40) },
      { pos: new THREE.Vector3( 16,  0, -40) },
      { pos: new THREE.Vector3( 32,  0, -32) },
      { pos: new THREE.Vector3( 40,  0, -16) },
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

    // Ground plane — dark night asphalt
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x1a1a1a)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting — night city
    const ambient = new THREE.AmbientLight(0x223366, 0.5);
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

    // Props

    // 4 neon sign boxes — emissive colours 0xff0088 / 0x00aaff
    const neonSignData = [
      { x:  48, y: 5, z:  18, color: 0xff0088 },
      { x: -48, y: 5, z:  18, color: 0x00aaff },
      { x:  18, y: 5, z:  50, color: 0xff0088 },
      { x: -18, y: 5, z: -50, color: 0x00aaff },
    ];
    neonSignData.forEach(({ x, y, z, color }) => {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(8, 3, 1),
        toon(0x111111)
      );
      sign.position.set(x, y, z);
      sign.castShadow = true;
      scene.add(sign);
      // Emissive face
      const face = new THREE.Mesh(
        new THREE.BoxGeometry(7, 2.2, 0.2),
        (() => {
          const m = toon(0x888888);
          m.emissive = new THREE.Color(color);
          m.emissiveIntensity = 1.4;
          return m;
        })()
      );
      face.position.set(x, y, z + 0.6);
      scene.add(face);
      // Neon point light
      const neonLight = new THREE.PointLight(color, 1.5, 30);
      neonLight.position.set(x, y, z + 1);
      scene.add(neonLight);
    });

    // 2 street lamp poles — grey cylinders with lamp heads
    const lampData = [
      { x:  50, z:   0 },
      { x: -50, z:   0 },
    ];
    lampData.forEach(({ x, z }) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 10, 8),
        toon(0x888888)
      );
      pole.position.set(x, 5, z);
      pole.castShadow = true;
      scene.add(pole);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.6, 0.6),
        toon(0x888888)
      );
      head.position.set(x, 10.3, z);
      scene.add(head);
      const bulb = new THREE.PointLight(0xffffff, 1.2, 40);
      bulb.position.set(x, 10, z);
      scene.add(bulb);
    });

    // City buildings in the background
    const buildingColors = [0x0c0c1e, 0x0a0a18, 0x111128];
    const buildingData = [
      { x:  62, z:   0, w: 12, h: 40, d: 12 },
      { x: -62, z:   0, w: 12, h: 36, d: 12 },
      { x:   0, z:  62, w: 20, h: 44, d: 10 },
      { x:   0, z: -62, w: 20, h: 32, d: 10 },
    ];
    buildingData.forEach(({ x, z, w, h, d }, i) => {
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        toon(buildingColors[i % buildingColors.length])
      );
      bldg.position.set(x, h / 2, z);
      bldg.castShadow = true;
      scene.add(bldg);
    });

    // Traffic barrier cones
    [
      { x:  38, z:  38 }, { x: -38, z:  38 },
      { x:  38, z: -38 }, { x: -38, z: -38 },
    ].forEach(({ x, z }) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 1.2, 8),
        toon(0xff5500)
      );
      cone.position.set(x, 0.6, z);
      scene.add(cone);
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
