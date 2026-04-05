import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'lava_flow',
  name: 'LAVA FLOW',
  cup: 'volcano',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_volcano_01',
  skyConfig: {
    topColor:    0x1a0a00,
    bottomColor: 0x4a1a00,
    fogColor:    0x6a2a00,
    fogDensity:  0.009,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 38,  8,   0) },
      { pos: new THREE.Vector3( 46, 14,  18), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 40, 22,  36), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 20, 26,  48), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0, 22,  46) },
      { pos: new THREE.Vector3(-20, 26,  38) },
      { pos: new THREE.Vector3(-42, 18,  20), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-48, 10,   0), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-42, 18, -20), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-20, 26, -38) },
      { pos: new THREE.Vector3(  0, 22, -46) },
      { pos: new THREE.Vector3( 20, 26, -48) },
      { pos: new THREE.Vector3( 40, 22, -36) },
      { pos: new THREE.Vector3( 46, 14, -18) },
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

    // Ground — cooled lava black
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x1a0800)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lava glow ambient
    const ambient = new THREE.AmbientLight(0xff4400, 0.5);
    scene.add(ambient);

    // Sun
    const sun = new THREE.DirectionalLight(0xff8800, 1.2);
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

    // Props — 6 lava rock pillars
    const pillarPositions = [
      [ 52,  0,   0],
      [-52,  0,   0],
      [ 30,  0,  50],
      [-30,  0,  50],
      [ 30,  0, -50],
      [-30,  0, -50],
    ];
    pillarPositions.forEach(([px, py, pz], i) => {
      const height = 10 + (i % 3) * 5;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5 + (i % 2) * 0.5, 2.5, height, 8),
        toon(0x1a0800)
      );
      pillar.position.set(px, py + height / 2, pz);
      pillar.castShadow = true;
      scene.add(pillar);
      // Cluster rock beside main pillar
      const smallH = height * 0.55;
      const small = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.5, smallH, 6),
        toon(0x150600)
      );
      small.position.set(px + 2.5, py + smallH / 2, pz + 1.5);
      scene.add(small);
    });

    // Props — 4 lava pool flats
    const poolPositions = [
      [  0,  0,  0],
      [ 20,  0, 20],
      [-20,  0,-20],
      [ 15,  0,-15],
    ];
    poolPositions.forEach(([px, py, pz]) => {
      const pool = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 5, 0.5, 20),
        toon(0xff4400, { emissive: new THREE.Color(0xff4400), emissiveIntensity: 0.4 })
      );
      pool.position.set(px, py - 0.25, pz);
      scene.add(pool);
      // Glow point light above pool
      const glow = new THREE.PointLight(0xff4400, 1.2, 25);
      glow.position.set(px, py + 3, pz);
      scene.add(glow);
    });

    // Obsidian boulders scattered
    const boulderPositions = [
      [55, 0, 30], [-55, 0, 30], [55, 0, -30],
      [-55, 0, -30], [0, 0, 55], [0, 0, -55],
    ];
    boulderPositions.forEach(([bx, by, bz], i) => {
      const r = 2.5 + (i % 3);
      const boulder = new THREE.Mesh(
        new THREE.SphereGeometry(r, 7, 6),
        toon(0x1a0800)
      );
      boulder.scale.set(1, 0.6, 1);
      boulder.position.set(bx, by + r * 0.6, bz);
      boulder.castShadow = true;
      scene.add(boulder);
    });

    // Ember glow point lights along track edges
    [
      [ 45, 12, 0], [-45, 12, 0],
      [ 20, 28, 48], [-20, 28, -38],
    ].forEach(([lx, ly, lz]) => {
      const ember = new THREE.PointLight(0xff5500, 0.8, 30);
      ember.position.set(lx, ly + 5, lz);
      scene.add(ember);
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
