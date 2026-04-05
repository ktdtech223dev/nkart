import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'desk_dash',
  name: 'DESK DASH',
  cup: 'dorm',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_dorm_01',
  skyConfig: {
    topColor:    0xc8b89a,
    bottomColor: 0x9a7c5c,
    fogColor:    0xd4b88a,
    fogDensity:  0.007,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 32,  0,   0) },
      { pos: new THREE.Vector3( 38,  1,  14) },
      { pos: new THREE.Vector3( 30,  2,  30) },
      { pos: new THREE.Vector3( 12,  3,  38) },
      { pos: new THREE.Vector3( -8,  2,  36) },
      { pos: new THREE.Vector3(-24,  1,  28) },
      { pos: new THREE.Vector3(-36,  0,  14) },
      { pos: new THREE.Vector3(-36,  0,  -2) },
      { pos: new THREE.Vector3(-28,  1, -18) },
      { pos: new THREE.Vector3(-14,  2, -30) },
      { pos: new THREE.Vector3(  4,  2, -34) },
      { pos: new THREE.Vector3( 20,  1, -28) },
      { pos: new THREE.Vector3( 32,  0, -14) },
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

    // Ground plane — desk wood surface
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xd4b483)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffeebb, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffcc88, 1.2);
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

    // 3 pencils — yellow cylinders tilted on desk
    const pencilData = [
      { x:  22, z:  12, rotZ: 0.3 },
      { x:  26, z:   8, rotZ: -0.25 },
      { x:  18, z: -20, rotZ: 0.4 },
    ];
    pencilData.forEach(({ x, z, rotZ }) => {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 6, 8),
        toon(0xffdd00)
      );
      body.position.set(x, 1, z);
      body.rotation.z = rotZ;
      body.castShadow = true;
      scene.add(body);
      // Eraser tip
      const eraser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.7, 8),
        toon(0xff9999)
      );
      eraser.position.set(x - Math.sin(rotZ) * 3, 1, z);
      scene.add(eraser);
      // Graphite tip
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.8, 8),
        toon(0x444444)
      );
      tip.position.set(x + Math.sin(rotZ) * 3, 1, z);
      scene.add(tip);
    });

    // 1 coffee mug — brown cylinder open-top
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 1.8, 4.5, 16, 1, true),
      toon(0x8B4513)
    );
    mug.position.set(-38, 2.25, 22);
    mug.castShadow = true;
    scene.add(mug);
    const mugBottom = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 16),
      toon(0x8B4513)
    );
    mugBottom.rotation.x = -Math.PI / 2;
    mugBottom.position.set(-38, 0, 22);
    scene.add(mugBottom);
    // Handle
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.2, 6, 12, Math.PI),
      toon(0x8B4513)
    );
    handle.position.set(-38 + 2.0, 2.0, 22);
    handle.rotation.y = Math.PI / 2;
    scene.add(handle);

    // 2 book stacks — BoxGeometry, colors 0x4169E1 / 0xDC143C
    const bookStackData = [
      { x:  10, z: -20, color: 0x4169E1 },
      { x: -18, z: -26, color: 0xDC143C },
    ];
    bookStackData.forEach(({ x, z, color }) => {
      let stackY = 0;
      for (let b = 0; b < 4; b++) {
        const thick = 0.9;
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(7, thick, 5),
          toon(b % 2 === 0 ? color : 0xeeeeee)
        );
        book.position.set(x, stackY + thick / 2, z);
        book.rotation.y = (b - 1.5) * 0.06;
        book.castShadow = true;
        scene.add(book);
        stackY += thick;
      }
    });

    // Sticky note pads (flat colourful squares)
    [
      { x:  36, z: -18, c: 0xffee55 },
      { x:  38, z: -22, c: 0xf06292 },
    ].forEach(({ x, z, c }) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 4), toon(c));
      pad.position.set(x, 0.08, z);
      scene.add(pad);
    });

    // Water bottle (tall cyan cylinder)
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 10, 16),
      toon(0x80deea)
    );
    bottle.position.set(42, 5, 8);
    bottle.castShadow = true;
    scene.add(bottle);

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
