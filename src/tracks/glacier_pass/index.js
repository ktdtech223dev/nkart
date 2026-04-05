import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'glacier_pass',
  name: 'GLACIER PASS',
  cup: 'volcano',
  cupIndex: 3,
  lapCount: 3,
  music: 'track_volcano_04',
  skyConfig: {
    topColor:    0x6090c0,
    bottomColor: 0x90b8d8,
    fogColor:    0xa0c0d8,
    fogDensity:  0.005,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 40,  0,   0) },
      { pos: new THREE.Vector3( 44,  6,  18), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 32, 14,  32), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 14, 20,  40) },
      { pos: new THREE.Vector3(  0, 25,  38) },
      { pos: new THREE.Vector3(-14, 20,  30), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-30, 15,  18), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-40, 10,   0) },
      { pos: new THREE.Vector3(-38, 14, -18), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-26, 20, -30), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-10, 26, -40) },
      { pos: new THREE.Vector3( 10, 22, -44) },
      { pos: new THREE.Vector3( 30, 16, -34) },
      { pos: new THREE.Vector3( 42,  8, -18) },
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

    // Ground plane — glacial grey-blue
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x9ab8c8)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting — crisp mountain
    const ambient = new THREE.AmbientLight(0x88aacc, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
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

    // Sub-surface ice glow
    const iceFill = new THREE.PointLight(0x88bbdd, 0.5, 60);
    iceFill.position.set(0, 5, 0);
    scene.add(iceFill);

    // Props

    // 4 large rock boulders — IcosahedronGeometry radius 4-6, color 0x888898
    const rockData = [
      { x:  55, y:  2, z:  15, r: 5 },
      { x: -55, y:  2, z: -15, r: 4 },
      { x:  15, y:  2, z: -55, r: 6 },
      { x: -15, y:  2, z:  55, r: 4.5 },
    ];
    rockData.forEach(({ x, y, z, r }) => {
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        toon(0x888898)
      );
      rock.position.set(x, y, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      scene.add(rock);
    });

    // 3 ice wall slabs — BoxGeometry, transparent blue 0x88ccff
    const iceWallData = [
      { x:  62, y: 6, z:   0, w: 6, h: 12, d: 20 },
      { x: -62, y: 6, z:   0, w: 6, h: 10, d: 18 },
      { x:   0, y: 6, z: -62, w: 20, h: 12, d: 6 },
    ];
    iceWallData.forEach(({ x, y, z, w, h, d }) => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        (() => {
          const m = toon(0x88ccff);
          m.transparent = true;
          m.opacity = 0.75;
          return m;
        })()
      );
      slab.position.set(x, y, z);
      slab.castShadow = true;
      scene.add(slab);
      // Blue ice glow
      const iceGlow = new THREE.PointLight(0x88ccff, 0.4, 25);
      iceGlow.position.set(x, y, z);
      scene.add(iceGlow);
    });

    // Snowdrift mounds flanking the pass
    const driftData = [
      { x:  68, z:  30 }, { x: -68, z:  30 },
      { x:  68, z: -30 }, { x: -68, z: -30 },
      { x:   0, z:  72 },
    ];
    driftData.forEach(({ x, z }) => {
      const drift = new THREE.Mesh(
        new THREE.SphereGeometry(9, 10, 6),
        toon(0xddeef8)
      );
      drift.scale.set(1.3, 0.2, 1.3);
      drift.position.set(x, 0.5, z);
      scene.add(drift);
    });

    // Survey poles for navigation
    [[45, 55], [-45, 55], [45, -55], [-45, -55]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
        toon(0xdd2200)
      );
      pole.position.set(px, 4, pz);
      scene.add(pole);
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
