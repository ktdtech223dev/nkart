import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'marineford_ruins',
  name: 'MARINEFORD RUINS',
  cup: 'pirate',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_pirate_03',
  skyConfig: {
    topColor:    0x1a0a00,
    bottomColor: 0x3a1a00,
    fogColor:    0x4a2200,
    fogDensity:  0.01,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 40,  2,   0) },
      { pos: new THREE.Vector3( 46,  6,  18), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 38, 10,  34), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 20, 14,  44), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(  2, 12,  42) },
      { pos: new THREE.Vector3(-18,  8,  34) },
      { pos: new THREE.Vector3(-36,  4,  20) },
      { pos: new THREE.Vector3(-44,  2,   0) },
      { pos: new THREE.Vector3(-38,  6, -18) },
      { pos: new THREE.Vector3(-20, 10, -32), surfaceType: 'dirt' },
      { pos: new THREE.Vector3(  0, 14, -44), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 18, 10, -44), surfaceType: 'dirt' },
      { pos: new THREE.Vector3( 36,  6, -32) },
      { pos: new THREE.Vector3( 44,  4, -18) },
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

    // Ground — scorched earth
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x4a3a28)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Fire glow ambient
    const ambient = new THREE.AmbientLight(0xff8833, 0.5);
    scene.add(ambient);

    // Battle light sun
    const sun = new THREE.DirectionalLight(0xff4400, 1.2);
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

    // Props — 5 crumbled wall sections
    const wallData = [
      { x: -52, y:  4, z:  10, w: 20, h:  8, d: 3, ry: Math.PI / 2 },
      { x:  52, y:  3, z:  -5, w: 16, h:  6, d: 3, ry: Math.PI / 2 },
      { x:   0, y:  5, z: -52, w: 22, h: 10, d: 3, ry: 0 },
      { x: -30, y:  2, z:  48, w: 14, h:  5, d: 3, ry: 0.2 },
      { x:  35, y:  3, z:  46, w: 12, h:  4, d: 3, ry: -0.15 },
    ];
    wallData.forEach(({ x, y, z, w, h, d, ry }) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        toon(0x888877)
      );
      wall.position.set(x, y, z);
      wall.rotation.y = ry;
      wall.castShadow = true;
      scene.add(wall);
      // Merlons on top
      const mCount = Math.max(2, Math.floor(w / 5));
      for (let m = 0; m < mCount; m++) {
        const merlon = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2.5, d + 0.2),
          toon(0x777766)
        );
        // Position along local width axis
        const localX = (m - (mCount - 1) / 2) * (w / mCount);
        merlon.position.set(x + Math.cos(ry) * localX, y + h / 2 + 1.25, z + Math.sin(ry) * localX);
        merlon.rotation.y = ry;
        scene.add(merlon);
      }
    });

    // Props — 3 burning barrel emissive cylinders
    const barrelPositions = [
      [ 10,  2,  10],
      [-10,  8, -20],
      [ 25,  6, -30],
    ];
    barrelPositions.forEach(([bx, by, bz]) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 3, 12),
        toon(0x444433)
      );
      barrel.position.set(bx, by + 1.5, bz);
      barrel.castShadow = true;
      scene.add(barrel);
      // Fire glow top
      const fire = new THREE.Mesh(
        new THREE.ConeGeometry(1.0, 2, 8),
        toon(0xff4400, { emissive: new THREE.Color(0xff4400), emissiveIntensity: 0.4 })
      );
      fire.position.set(bx, by + 4, bz);
      scene.add(fire);
      const glow = new THREE.PointLight(0xff4400, 1.0, 18);
      glow.position.set(bx, by + 5, bz);
      scene.add(glow);
    });

    // Props — 2 broken pillar stumps
    const stumpPositions = [
      [-25,  2, -10],
      [ 30,  4,  30],
    ];
    stumpPositions.forEach(([sx, sy, sz], i) => {
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 2.2, 4 + i * 2, 10),
        toon(0x888877)
      );
      stump.position.set(sx, sy + 2, sz);
      stump.castShadow = true;
      scene.add(stump);
      // Broken top cap
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(2.0, 1.8, 0.8, 10),
        toon(0x777766)
      );
      cap.position.set(sx + (i * 0.5 - 0.25), sy + 4.4 + i * 2, sz + (i * 0.3));
      cap.rotation.z = (i - 0.5) * 0.3;
      scene.add(cap);
    });

    // Rubble scatter
    for (let r = 0; r < 14; r++) {
      const rb = new THREE.Mesh(
        new THREE.BoxGeometry(
          1 + (r % 3),
          0.5 + (r % 2) * 0.8,
          1 + (r % 4) * 0.5
        ),
        toon(0x777766)
      );
      const angle = (r / 14) * Math.PI * 2;
      const radius = 25 + (r % 4) * 8;
      rb.position.set(
        Math.cos(angle) * radius,
        1,
        Math.sin(angle) * radius
      );
      rb.rotation.y = r * 0.7;
      rb.castShadow = true;
      scene.add(rb);
    }

    // Smoke columns
    [[-20, 2, 10], [30, 6, -30], [0, 2, 48]].forEach(([px, py, pz]) => {
      for (let c = 0; c < 4; c++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(2.5 + c * 1.2, 6, 5),
          toon(0x2a1a18)
        );
        puff.position.set(px, py + 5 + c * 5, pz);
        scene.add(puff);
      }
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
