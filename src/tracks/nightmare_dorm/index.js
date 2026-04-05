import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'nightmare_dorm',
  name: 'NIGHTMARE DORM',
  cup: 'shadow',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_shadow_01',
  skyConfig: {
    topColor:    0x020408,
    bottomColor: 0x050a10,
    fogColor:    0x0a1520,
    fogDensity:  0.012,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 34,  0,   0) },
      { pos: new THREE.Vector3( 40,  2,  14) },
      { pos: new THREE.Vector3( 32,  4,  28) },
      { pos: new THREE.Vector3( 14,  6,  36), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  4,  34), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-14,  2,  28), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-32,  0,  14), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-38,  2,   0) },
      { pos: new THREE.Vector3(-32,  4, -14) },
      { pos: new THREE.Vector3(-14,  6, -28) },
      { pos: new THREE.Vector3(  0,  4, -34) },
      { pos: new THREE.Vector3( 14,  2, -36), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 32,  0, -28), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 40,  0, -14) },
    ];

    const trackData = TrackSplineBuilder.buildTrack(controlPoints, {
      closed:       true,
      segments:     280,
      defaultWidth: 10,
      wallHeight:   1.5,
    });

    scene.add(trackData.roadMesh);
    scene.add(trackData.curbsMesh);
    scene.add(trackData.walls.visual);
    scene.add(trackData.collisionMesh);

    // Ground — dark dorm floor
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x0a0a0a)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Dim horror ambient
    const ambient = new THREE.AmbientLight(0x112233, 0.5);
    scene.add(ambient);

    // Pale moonlight sun
    const sun = new THREE.DirectionalLight(0x3355aa, 1.2);
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

    // Corruption cracks on floor
    const crackPositions = [
      [ 10,  0,  15, 20, 0.3],
      [-12,  0,  -8, 15, -0.2],
      [ 22,  0,  -5, 25,  0.5],
      [-18,  0,  20, 18, -0.4],
    ];
    crackPositions.forEach(([cx, cy, cz, len, rot]) => {
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, len),
        toon(0x660000)
      );
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = rot;
      crack.position.set(cx, cy - 0.45, cz);
      scene.add(crack);
    });

    // Props — 3 floating desk items at y=3-5
    const deskItemData = [
      { x:  20, y:  3, z: -20, w: 4,   h: 0.4, d: 3,   col: 0x334455 },
      { x: -18, y:  5, z:  18, w: 6,   h: 0.5, d: 4,   col: 0x223344 },
      { x:  28, y:  4, z:  22, w: 3.5, h: 0.4, d: 2.5, col: 0x334455 },
    ];
    deskItemData.forEach(({ x, y, z, w, h, d, col }) => {
      const item = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        toon(col)
      );
      item.position.set(x, y, z);
      item.rotation.y = (x * 0.05) % (Math.PI * 2);
      item.castShadow = true;
      scene.add(item);
      // Floating smaller item on top
      const small = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.5, h * 1.5, d * 0.6),
        toon(0x223344)
      );
      small.position.set(x + 0.5, y + 1.2, z - 0.3);
      small.rotation.z = 0.1;
      scene.add(small);
    });

    // Props — 2 flickering lamps (CylinderGeometry with emissive)
    const lampPositions = [
      [-42,  0,   0],
      [ 42,  0, -20],
    ];
    lampPositions.forEach(([lx, ly, lz]) => {
      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 10, 8),
        toon(0x111122)
      );
      pole.position.set(lx, ly + 5, lz);
      pole.castShadow = true;
      scene.add(pole);
      // Lamp shade emissive
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(2, 2.5, 12, 1, true),
        toon(0x223344, { emissive: new THREE.Color(0x223344), emissiveIntensity: 0.4 })
      );
      shade.rotation.z = Math.PI;
      shade.position.set(lx, ly + 11.5, lz);
      scene.add(shade);
      // Flickering point light
      const lampLight = new THREE.PointLight(0x334466, 0.6, 22);
      lampLight.position.set(lx, ly + 10, lz);
      scene.add(lampLight);
    });

    // Props — ominous shadow geometry (dark vertical PlaneGeometry)
    const shadowPositions = [
      [ 0, 0,  -45, 0 ],
      [ 45, 0,  0, Math.PI / 2 ],
      [-45, 0,  0, -Math.PI / 2 ],
    ];
    shadowPositions.forEach(([sx, sy, sz, ry]) => {
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 8),
        toon(0x020408)
      );
      shadow.position.set(sx, sy + 4, sz);
      shadow.rotation.y = ry;
      scene.add(shadow);
    });

    // Spilled liquid puddles for ice zones (visual)
    [
      [ 14,  6,  36],
      [-14,  2,  28],
      [ 14,  2, -36],
    ].forEach(([px, py, pz]) => {
      const puddle = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 6),
        toon(0x223344)
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(px, py - 0.45, pz);
      scene.add(puddle);
    });

    // Horror atmosphere — red glowing cracks near floor
    const glowCrackMat = toon(0x330000, { emissive: new THREE.Color(0x330000), emissiveIntensity: 0.4 });
    [[-5, 0, 10], [8, 0, -12], [-15, 2, -5]].forEach(([gx, gy, gz]) => {
      const gc = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 10),
        glowCrackMat
      );
      gc.rotation.x = -Math.PI / 2;
      gc.rotation.z = Math.random() * 0.6;
      gc.position.set(gx, gy - 0.44, gz);
      scene.add(gc);
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
