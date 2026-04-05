import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'fishman_island_reef',
  name: 'FISHMAN ISLAND REEF',
  cup: 'pirate',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_pirate_02',
  skyConfig: {
    topColor:    0x001433,
    bottomColor: 0x002266,
    fogColor:    0x003399,
    fogDensity:  0.01,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 38,  3,   0) },
      { pos: new THREE.Vector3( 46,  6,  18) },
      { pos: new THREE.Vector3( 38, 10,  36), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 20, 12,  48), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0, 10,  46) },
      { pos: new THREE.Vector3(-20, 12,  38) },
      { pos: new THREE.Vector3(-40,  8,  20) },
      { pos: new THREE.Vector3(-46,  4,   0) },
      { pos: new THREE.Vector3(-40,  8, -20), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-20, 12, -38), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0, 10, -46) },
      { pos: new THREE.Vector3( 20, 12, -48) },
      { pos: new THREE.Vector3( 38, 10, -36) },
      { pos: new THREE.Vector3( 46,  6, -18) },
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

    // Ground plane — deep ocean floor
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x002244)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting — underwater deep blue
    const ambient = new THREE.AmbientLight(0x0033aa, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x44aaff, 1.2);
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

    // Underwater caustic light shafts
    const shaftPositions = [[0, 40, 0], [20, 38, 20], [-25, 36, -15], [10, 42, -40]];
    shaftPositions.forEach(([sx, sy, sz]) => {
      const shaft = new THREE.PointLight(0x44aacc, 0.8, 55);
      shaft.position.set(sx, sy, sz);
      scene.add(shaft);
    });

    // Props

    // 6 coral formations — ConeGeometry / CylinderGeometry wider-top
    const coralData = [
      { x:  52, z:  10, color: 0xff6644, h: 6, r: 1.2 },
      { x: -52, z:  10, color: 0xff4488, h: 8, r: 1.0 },
      { x:  20, z:  58, color: 0xffaa00, h: 5, r: 1.4 },
      { x: -20, z: -58, color: 0xff6644, h: 7, r: 1.1 },
      { x:  52, z: -20, color: 0xff4488, h: 9, r: 0.9 },
      { x: -52, z: -20, color: 0xffaa00, h: 6, r: 1.3 },
    ];
    coralData.forEach(({ x, z, color, h, r }) => {
      // Coral stalk — wider at top (inverted cone feel via CylinderGeometry)
      const coral = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 1.8, r * 0.5, h, 8),
        toon(color)
      );
      coral.position.set(x, h / 2 + 0.5, z);
      coral.castShadow = true;
      scene.add(coral);
      // Glow
      const glow = new THREE.PointLight(color, 0.4, 18);
      glow.position.set(x, h + 1, z);
      scene.add(glow);
      // Branch
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.8, r * 0.3, h * 0.6, 6),
        toon(color)
      );
      branch.position.set(x + 1.5, h * 0.5, z + 0.8);
      branch.rotation.z = 0.4;
      scene.add(branch);
    });

    // 2 sea anemone clusters — SphereGeometry 0xff8800
    const anemoneData = [
      { x:  30, z:  35 },
      { x: -30, z: -35 },
    ];
    anemoneData.forEach(({ x, z }) => {
      const base = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 10, 7),
        toon(0xff8800)
      );
      base.position.set(x, 1.0, z);
      base.scale.set(1, 0.5, 1);
      scene.add(base);
      // Tentacles
      for (let t = 0; t < 8; t++) {
        const angle = (t / 8) * Math.PI * 2;
        const tentacle = new THREE.Mesh(
          new THREE.ConeGeometry(0.25, 2.5, 5),
          toon(0xff8800)
        );
        tentacle.position.set(
          x + Math.cos(angle) * 1.4,
          1.8,
          z + Math.sin(angle) * 1.4
        );
        tentacle.rotation.z = Math.cos(angle) * 0.5;
        tentacle.rotation.x = Math.sin(angle) * 0.5;
        scene.add(tentacle);
      }
    });

    // Stone ruin columns
    const ruinData = [[-12, 0, 56], [12, 0, 56], [-10, 0, -58], [10, 0, -58]];
    ruinData.forEach(([rx, ry, rz]) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.8, 12, 10),
        toon(0x2a3a35)
      );
      col.position.set(rx, ry + 6, rz);
      col.castShadow = true;
      scene.add(col);
    });

    // Giant clam props
    [[20, 0, 30], [-20, 0, -30]].forEach(([cx, cy, cz]) => {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 8, 6),
        toon(0xcc88ff)
      );
      shell.position.set(cx, cy + 1.2, cz);
      shell.scale.set(1, 0.4, 0.7);
      scene.add(shell);
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
