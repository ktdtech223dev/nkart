import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'lunar_base',
  name: 'LUNAR BASE',
  cup: 'space',
  cupIndex: 0,
  lapCount: 3,
  music: 'track_space_01',
  skyConfig: {
    topColor:    0x000005,
    bottomColor: 0x050510,
    fogColor:    0x0a0a20,
    fogDensity:  0.003,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 44,  0,   0) },
      { pos: new THREE.Vector3( 52,  3,  22) },
      { pos: new THREE.Vector3( 44,  6,  44) },
      { pos: new THREE.Vector3( 22,  8,  56), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0,  6,  54), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-22,  8,  46) },
      { pos: new THREE.Vector3(-44,  5,  24) },
      { pos: new THREE.Vector3(-52,  2,   0) },
      { pos: new THREE.Vector3(-44,  5, -24), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-22,  8, -46), surfaceType: 'boost' },
      { pos: new THREE.Vector3(  0,  6, -54) },
      { pos: new THREE.Vector3( 22,  8, -56) },
      { pos: new THREE.Vector3( 44,  6, -44) },
      { pos: new THREE.Vector3( 52,  3, -22) },
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

    // Ground — lunar regolith grey
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0xaaaaaa)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Starlight ambient
    const ambient = new THREE.AmbientLight(0x334455, 0.5);
    scene.add(ambient);

    // Harsh solar sun
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
    const starPos = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 180;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })));

    // Props — 3 dome structures
    const domeData = [
      { x:  0, z:  0, r: 12, col: 0x888888 },
      { x: 22, z:-16, r:  8, col: 0x999999 },
      { x:-20, z: 14, r:  9, col: 0x777777 },
    ];
    domeData.forEach(({ x, z, r, col }) => {
      const domeGeo = new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, toon(col));
      dome.position.set(x, 0, z);
      dome.castShadow = true;
      scene.add(dome);
      // Base ring
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 1.5, 24),
        toon(0x777777)
      );
      base.position.set(x, 0.75, z);
      scene.add(base);
      // Window glow
      const win = new THREE.Mesh(
        new THREE.CircleGeometry(2, 14),
        toon(0x88ccff, { emissive: new THREE.Color(0x4488ff), emissiveIntensity: 0.4 })
      );
      win.position.set(x, r * 0.5, z + r * 0.87);
      win.rotation.y = Math.PI;
      scene.add(win);
      const iLight = new THREE.PointLight(0xffd080, 0.4, r * 2.5);
      iLight.position.set(x, r * 0.4, z);
      scene.add(iLight);
    });

    // Props — 4 crater rims (TorusGeometry)
    const craterData = [
      { x:  35, z: -50, r:  8 },
      { x: -35, z:  48, r: 10 },
      { x:  58, z:  30, r: 12 },
      { x: -56, z: -28, r:  9 },
    ];
    craterData.forEach(({ x, z, r }) => {
      // Crater floor
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(r, 24),
        toon(0x888888)
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, -0.4, z);
      scene.add(floor);
      // Rim torus
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(r, 1.0, 6, 28),
        toon(0x999999)
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, 0.3, z);
      scene.add(rim);
    });

    // Props — communication dish
    const dishX = -58, dishZ = 0;
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.8, 14, 8),
      toon(0x888888)
    );
    mast.position.set(dishX, 7, dishZ);
    mast.castShadow = true;
    scene.add(mast);
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(6, 2, 16, 1, true),
      toon(0xcccccc)
    );
    dish.position.set(dishX, 15, dishZ);
    dish.rotation.x = Math.PI / 2.5;
    dish.castShadow = true;
    scene.add(dish);
    const dishBacking = new THREE.Mesh(
      new THREE.CylinderGeometry(6.2, 6.2, 0.5, 16),
      toon(0xaaaaaa)
    );
    dishBacking.position.set(dishX, 14.5, dishZ);
    scene.add(dishBacking);
    const blinkLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 6, 6),
      toon(0xff2200, { emissive: new THREE.Color(0xff0000), emissiveIntensity: 0.4 })
    );
    blinkLight.position.set(dishX, 17, dishZ);
    scene.add(blinkLight);

    // Electromagnetic launch rail strips (boost zones visual)
    [
      [22, 8, 56, 0],
      [-44, 5, -24, Math.PI * 0.33],
    ].forEach(([rx, ry, rz, rot]) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.2, 2),
        toon(0x00ffff, { emissive: new THREE.Color(0x00aaaa), emissiveIntensity: 0.4 })
      );
      rail.position.set(rx, ry + 0.15, rz);
      rail.rotation.y = rot;
      scene.add(rail);
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
