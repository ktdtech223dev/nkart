import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'grand_line_galleon',
  name: 'GRAND LINE GALLEON',
  cup: 'pirate',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_pirate_01',
  skyConfig: {
    topColor:    0x0a1a3a,
    bottomColor: 0x1a3a6a,
    fogColor:    0x1a2a4a,
    fogDensity:  0.007,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 42,  4,   0) },
      { pos: new THREE.Vector3( 50,  8,  20) },
      { pos: new THREE.Vector3( 42, 12,  40), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 22, 14,  52), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0, 12,  50) },
      { pos: new THREE.Vector3(-22, 14,  42) },
      { pos: new THREE.Vector3(-42, 10,  22) },
      { pos: new THREE.Vector3(-50,  4,   0) },
      { pos: new THREE.Vector3(-42, 10, -22), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-22, 14, -42), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0, 12, -50) },
      { pos: new THREE.Vector3( 22, 14, -52) },
      { pos: new THREE.Vector3( 42, 12, -40) },
      { pos: new THREE.Vector3( 50,  8, -20) },
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

    // Ground plane — dark ocean
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x1a3a5a)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ocean water layer
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      (() => {
        const m = toon(0x0a2a4a);
        m.transparent = true;
        m.opacity = 0.85;
        return m;
      })()
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -18;
    scene.add(water);

    // Lighting — sea night + full moon
    const ambient = new THREE.AmbientLight(0x334466, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff4cc, 1.2);
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

    // Lantern warm fill
    const mastLight = new THREE.PointLight(0xffaa44, 1.0, 70);
    mastLight.position.set(0, 22, 0);
    scene.add(mastLight);

    // Props

    // 4 cannon barrels — CylinderGeometry, color 0x333333
    const cannonData = [
      { x: -28, y:  4, z: -30, rotZ:  Math.PI / 2 },
      { x:  28, y:  4, z: -30, rotZ: -Math.PI / 2 },
      { x: -28, y:  4, z:  15, rotZ:  Math.PI / 2 },
      { x:  28, y:  4, z:  15, rotZ: -Math.PI / 2 },
    ];
    cannonData.forEach(({ x, y, z, rotZ }) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.9, 5, 10),
        toon(0x333333)
      );
      barrel.position.set(x, y, z);
      barrel.rotation.z = rotZ;
      barrel.castShadow = true;
      scene.add(barrel);
      // Cannon balls
      for (let b = 0; b < 3; b++) {
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, 8, 6),
          toon(0x333333)
        );
        ball.position.set(x, y - 1, z + 1.5 + b * 1.1);
        scene.add(ball);
      }
    });

    // 3 rope coils — TorusGeometry, color 0x8B4513
    const ropeCoilData = [
      { x: -14, y: 4, z:  40 },
      { x:  14, y: 4, z:  38 },
      { x:   0, y: 4, z: -40 },
    ];
    ropeCoilData.forEach(({ x, y, z }) => {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(2.0, 0.45, 6, 20),
        toon(0x8B4513)
      );
      coil.position.set(x, y, z);
      coil.rotation.x = Math.PI / 2;
      coil.castShadow = true;
      scene.add(coil);
      const inner = new THREE.Mesh(
        new THREE.TorusGeometry(1.1, 0.3, 6, 16),
        toon(0x8B4513)
      );
      inner.position.set(x, y, z);
      inner.rotation.x = Math.PI / 2;
      scene.add(inner);
    });

    // 2 mast bases — tall CylinderGeometry, color 0x8B7355
    [[0, 4, -10], [0, 4, 30]].forEach(([mx, my, mz]) => {
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.2, 38, 10),
        toon(0x8B7355)
      );
      mast.position.set(mx, my + 19, mz);
      mast.castShadow = true;
      scene.add(mast);
      // Yardarm
      const yard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.3, 30, 8),
        toon(0x8B7355)
      );
      yard.position.set(mx, my + 30, mz);
      yard.rotation.z = Math.PI / 2;
      scene.add(yard);
    });

    // Ship hull sides
    const hullMat = toon(0x3a1f0a);
    const hullPort = new THREE.Mesh(new THREE.BoxGeometry(8, 20, 130), hullMat);
    hullPort.position.set(-30, -8, 0);
    scene.add(hullPort);
    const hullStarboard = new THREE.Mesh(new THREE.BoxGeometry(8, 20, 130), hullMat);
    hullStarboard.position.set(30, -8, 0);
    scene.add(hullStarboard);

    // Deck planks
    const plankMat = toon(0x6b3d15);
    for (let pz = -60; pz < 65; pz += 3) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(54, 0.5, 2.6),
        plankMat
      );
      plank.position.set(0, 2.5, pz);
      plank.receiveShadow = true;
      scene.add(plank);
    }

    // Jolly Roger flag
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 12, 8),
      toon(0x4a2808)
    );
    flagPole.position.set(-4, 44, -10);
    scene.add(flagPole);
    const flagCloth = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 0.2),
      toon(0x0a0a0a)
    );
    flagCloth.position.set(0, 48, -10);
    scene.add(flagCloth);

    // Barrels on deck
    const barrelData = [[-20, 3, 10], [20, 3, 15], [-16, 3, -30], [16, 3, -35]];
    barrelData.forEach(([bx, by, bz]) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.2, 3, 12),
        toon(0x6b3d15)
      );
      barrel.position.set(bx, by, bz);
      barrel.castShadow = true;
      scene.add(barrel);
    });

    // Storm clouds in background
    const cloudMat = (() => {
      const m = toon(0x1a2233);
      m.transparent = true;
      m.opacity = 0.7;
      return m;
    })();
    [[60, 55, -80], [-70, 50, -60], [30, 60, 80]].forEach(([cx, cy, cz]) => {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(20, 8, 6),
        cloudMat
      );
      cloud.position.set(cx, cy, cz);
      cloud.scale.set(1.2, 0.4, 1.2);
      scene.add(cloud);
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
