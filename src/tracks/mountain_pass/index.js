import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'mountain_pass',
  name: 'MOUNTAIN PASS',
  cup: 'nature',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_nature_02',
  skyConfig: {
    topColor:    0x5588aa,
    bottomColor: 0x88b8d0,
    fogColor:    0xa0c8d8,
    fogDensity:  0.005,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 40,  0,   0) },
      { pos: new THREE.Vector3( 46,  8,  18) },
      { pos: new THREE.Vector3( 36, 16,  34) },
      { pos: new THREE.Vector3( 18, 22,  44) },
      { pos: new THREE.Vector3(  0, 28,  42), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-18, 24,  34), surfaceType: 'ice' },
      { pos: new THREE.Vector3(-34, 18,  20) },
      { pos: new THREE.Vector3(-44, 12,   0) },
      { pos: new THREE.Vector3(-40, 16, -18) },
      { pos: new THREE.Vector3(-28, 22, -32) },
      { pos: new THREE.Vector3(-10, 28, -42) },
      { pos: new THREE.Vector3( 10, 26, -46), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 30, 20, -36), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 44, 10, -18) },
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

    // Ground — alpine meadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x778866)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Mountain crisp ambient
    const ambient = new THREE.AmbientLight(0xaacccc, 0.5);
    scene.add(ambient);

    // Alpine sun
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

    // Props — 5 large mountain boulders (IcosahedronGeometry radius 3-7)
    const boulderData = [
      { x:  52, y:  0, z:  18, r: 5 },
      { x: -52, y:  0, z:  10, r: 4 },
      { x:  30, y:  0, z: -50, r: 7 },
      { x: -48, y:  0, z: -30, r: 3 },
      { x:   0, y: 28, z:  46, r: 4 },
    ];
    boulderData.forEach(({ x, y, z, r }) => {
      const boulder = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        toon(0x887766)
      );
      boulder.position.set(x, y + r * 0.6, z);
      boulder.rotation.y = Math.random() * Math.PI;
      boulder.castShadow = true;
      scene.add(boulder);
    });

    // Props — 3 pine trees (ConeGeometry green + CylinderGeometry trunk)
    const pinePositions = [
      [  56,  0,  0 ],
      [ -56,  0, 20 ],
      [  20,  0,-56 ],
    ];
    pinePositions.forEach(([px, py, pz]) => {
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 5, 7),
        toon(0x5c3310)
      );
      trunk.position.set(px, py + 2.5, pz);
      trunk.castShadow = true;
      scene.add(trunk);
      // Three-tier foliage
      [[0, 5, 5, 4], [1.5, 8, 4, 3], [3, 10, 3, 2.2]].forEach(([yo, yt, rb]) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(rb, yt - yo, 8),
          toon(0x1e5c14)
        );
        cone.position.set(px, py + (yo + yt) / 2, pz);
        cone.castShadow = true;
        scene.add(cone);
      });
    });

    // Snow cap BoxGeometry on highest point (near t~0.35 — around (0,28,42))
    const snowCap = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.5, 18),
      toon(0xeef4ff)
    );
    snowCap.position.set(0, 28.75, 42);
    snowCap.receiveShadow = true;
    scene.add(snowCap);

    // Snow cap at second peak (-10,28,-42)
    const snowCap2 = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1.5, 16),
      toon(0xeef4ff)
    );
    snowCap2.position.set(-10, 28.75, -42);
    snowCap2.receiveShadow = true;
    scene.add(snowCap2);

    // Distant background mountain peaks
    [
      [100,  0,  50, 22, 65],
      [-95,  0,  30, 18, 55],
      [ 25,  0, -95, 25, 70],
    ].forEach(([mpx, mpy, mpz, r, h]) => {
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 10),
        toon(0x8a8078)
      );
      peak.position.set(mpx, mpy + h / 2, mpz);
      scene.add(peak);
      const snowTop = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.35, h * 0.22, 10),
        toon(0xf0f4ff)
      );
      snowTop.position.set(mpx, mpy + h * 0.85, mpz);
      scene.add(snowTop);
    });

    // Guardrail posts along key sections
    const guardrailMat = toon(0xdddddd);
    for (let i = 0; i < 18; i++) {
      const t = i / 18;
      const pt = trackData.curve.getPoint(t);
      const tan = trackData.curve.getTangent(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      [-1, 1].forEach(s => {
        const postPos = pt.clone().addScaledVector(side, s * 6);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6),
          guardrailMat
        );
        post.position.copy(postPos);
        post.position.y += 0.5;
        post.castShadow = true;
        scene.add(post);
      });
    }

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
