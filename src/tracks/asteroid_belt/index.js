import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'asteroid_belt',
  name: 'ASTEROID BELT',
  cup: 'space',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_space_02',
  skyConfig: {
    topColor:    0x000008,
    bottomColor: 0x050520,
    fogColor:    0x000820,
    fogDensity:  0.003,
  },

  buildGeometry(scene) {
    // Control points: {pos: THREE.Vector3, surfaceType?: string, width?: number}
    const controlPoints = [
      { pos: new THREE.Vector3( 35,  5,   0) },
      { pos: new THREE.Vector3( 45, 12,  18), surfaceType: 'boost' },
      { pos: new THREE.Vector3( 38, 18,  36) },
      { pos: new THREE.Vector3( 20, 22,  48) },
      { pos: new THREE.Vector3(  0, 15,  45) },
      { pos: new THREE.Vector3(-22, 20,  35) },
      { pos: new THREE.Vector3(-40, 12,  18) },
      { pos: new THREE.Vector3(-42,  5,   0), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-40, 12, -18) },
      { pos: new THREE.Vector3(-22, 20, -35) },
      { pos: new THREE.Vector3(  0, 15, -45) },
      { pos: new THREE.Vector3( 20, 22, -48) },
      { pos: new THREE.Vector3( 38, 18, -36) },
      { pos: new THREE.Vector3( 45, 12, -18) },
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

    // Ground plane (dark space floor)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x1a1a2e)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting
    const ambient = new THREE.AmbientLight(0x334466, 0.5);
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

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 170 + Math.random() * 20;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true })));

    // Props: 5 large irregular boulders (IcosahedronGeometry radius 3-5), color 0x555566
    const boulderPositions = [
      [ 58,  2,  10, 4.5], [-58,  8,  -5, 3.8],
      [ 15,  6,  62, 5.0], [-20, 14, -60, 3.2], [ 55, 18,  50, 4.0],
    ];
    boulderPositions.forEach(([bx, by, bz, br]) => {
      const boulder = new THREE.Mesh(
        new THREE.IcosahedronGeometry(br, 1),
        toon(0x555566)
      );
      boulder.position.set(bx, by, bz);
      boulder.rotation.set(Math.random(), Math.random(), Math.random());
      boulder.castShadow = true;
      scene.add(boulder);

      // Small satellite rock
      const sr = br * 0.4;
      const small = new THREE.Mesh(
        new THREE.IcosahedronGeometry(sr, 0),
        toon(0x444455)
      );
      small.position.set(bx + br + sr, by + sr, bz + sr * 0.5);
      small.castShadow = true;
      scene.add(small);
    });

    // Large background asteroid spheres in the distance
    [
      [ 180,  60, -260, 50], [-220,  80, -200, 38],
      [  80, 120, -280, 65], [-120,  35, -230, 28],
    ].forEach(([ax, ay, az, ar]) => {
      const ast = new THREE.Mesh(
        new THREE.SphereGeometry(ar, 10, 8),
        toon(0x333344)
      );
      ast.position.set(ax, ay, az);
      scene.add(ast);
    });

    // Purple crystal veins on ground
    [
      [ 20,  15, 0.6], [-30, -25, 0.4], [ 45,  30, 0.5],
    ].forEach(([vx, vz, vw]) => {
      const vein = new THREE.Mesh(
        new THREE.PlaneGeometry(30, vw),
        toon(0x8800cc)
      );
      vein.rotation.x = -Math.PI / 2;
      vein.position.set(vx, 0.1, vz);
      scene.add(vein);
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
