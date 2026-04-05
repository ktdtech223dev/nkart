import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'crystal_cave',
  name: 'CRYSTAL CAVE',
  cup: 'nature',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_nature_03',
  skyConfig: {
    topColor:    0x000020,
    bottomColor: 0x000840,
    fogColor:    0x001060,
    fogDensity:  0.012,
  },

  buildGeometry(scene) {
    // Control points: winding cave tunnel with steep climbs
    // narrow passages at t≈0.2..0.25, t≈0.45..0.55, t≈0.7..0.75
    // With 14 points each is ~0.071 wide, so points 3, 6-7, 10 fall in those ranges
    const controlPoints = [
      { pos: new THREE.Vector3( 30,  2,   0) },
      { pos: new THREE.Vector3( 38,  5,  14) },
      { pos: new THREE.Vector3( 30, 10,  28) },
      { pos: new THREE.Vector3( 14, 16,  38), width: 8 },  // narrow ~t=0.21
      { pos: new THREE.Vector3(  0, 20,  36) },
      { pos: new THREE.Vector3(-14, 16,  28) },
      { pos: new THREE.Vector3(-30, 10,  14), width: 8 },  // narrow ~t=0.43
      { pos: new THREE.Vector3(-38,  5,   0), width: 8 },  // narrow ~t=0.50
      { pos: new THREE.Vector3(-30, 10, -14) },
      { pos: new THREE.Vector3(-14, 16, -28) },
      { pos: new THREE.Vector3(  0, 20, -36), width: 8 },  // narrow ~t=0.71
      { pos: new THREE.Vector3( 14, 16, -38) },
      { pos: new THREE.Vector3( 30, 10, -28) },
      { pos: new THREE.Vector3( 38,  5, -14) },
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

    // Ground plane (cave floor dark blue)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x080830)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Cave ceiling (dark)
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      toon(0x030318)
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 35;
    scene.add(ceiling);

    // Lighting
    const ambient = new THREE.AmbientLight(0x2233aa, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x4466ff, 1.2);
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

    // Props: 8 crystal spires (ConeGeometry) in blue/purple
    const crystalColors = [0x4488ff, 0x8844ff, 0x4488ff, 0x8844ff, 0x4488ff, 0x8844ff, 0x4488ff, 0x8844ff];
    const crystalPositions = [
      [ 48,  0,  10], [-48,  0, -10], [ 20,  0,  52], [-20,  0, -52],
      [ 48, 12,  -5], [-48, 12,   5], [-15, 20,  48], [ 15, 20, -48],
    ];
    crystalPositions.forEach(([cx, cy, cz], i) => {
      const h = 8 + Math.random() * 8;
      const r = 0.8 + Math.random() * 1.0;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 6),
        toon(crystalColors[i])
      );
      spire.position.set(cx, cy + h / 2, cz);
      spire.rotation.y = Math.random() * Math.PI;
      spire.rotation.z = (Math.random() - 0.5) * 0.3;
      spire.castShadow = true;
      scene.add(spire);

      // Crystal glow point light
      // Crystal glow added via point light below
      const pLight = new THREE.PointLight(crystalColors[i], 0.8, 20);
      pLight.position.set(cx, cy + h * 0.6, cz);
      scene.add(pLight);

      // Smaller companion crystal
      const sh = h * 0.5;
      const sr = r * 0.5;
      const small = new THREE.Mesh(
        new THREE.ConeGeometry(sr, sh, 5),
        toon(crystalColors[(i + 1) % crystalColors.length])
      );
      small.position.set(cx + r * 2, cy + sh / 2, cz + r);
      small.rotation.y = Math.random() * Math.PI;
      scene.add(small);
    });

    // Underground lake
    const lakeMat = toon(0x0a0a28);
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(25, 18), lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-15, 0.05, -20);
    scene.add(lake);

    // Lake glow
    const lakeGlow = new THREE.PointLight(0x2244cc, 1.0, 30);
    lakeGlow.position.set(-15, 0.5, -20);
    scene.add(lakeGlow);

    // Stalactites hanging from ceiling
    [
      [ 20, 28, -10, 4.5, 0.7], [-20, 30,  18, 5.0, 0.6],
      [  5, 28, -20, 3.5, 0.5], [-15, 28,  -8, 4.5, 0.8],
      [ 30, 30,  10, 3.0, 0.4], [-30, 28, -20, 5.5, 0.9],
    ].forEach(([sx, sy, sz, height, radius]) => {
      const stalactite = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 7),
        toon(0x1a1228)
      );
      stalactite.position.set(sx, sy - height / 2, sz);
      stalactite.rotation.z = Math.PI; // point downward
      stalactite.castShadow = true;
      scene.add(stalactite);
    });

    // Stalagmites from floor
    [
      [ 44,  5], [-44, -10], [ 20, -40], [-15,  42],
      [ 38,  30], [-35, -30],
    ].forEach(([sx, sz]) => {
      const h = 3 + Math.random() * 5;
      const r = 0.4 + Math.random() * 0.6;
      const stala = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 7),
        toon(0x1e1830)
      );
      stala.position.set(sx, h / 2, sz);
      scene.add(stala);
    });

    // Crystal dust particles
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 100;
      dustPos[i * 3 + 1] = Math.random() * 30;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xcc88ff, size: 0.18, transparent: true, opacity: 0.7, depthWrite: false,
    })));

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
