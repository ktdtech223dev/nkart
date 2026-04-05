import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'neon_arcade',
  name: 'NEON ARCADE',
  cup: 'arcade',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_arcade_03',
  skyConfig: {
    topColor:    0x050010,
    bottomColor: 0x0a0020,
    fogColor:    0x100030,
    fogDensity:  0.01,
  },

  buildGeometry(scene) {
    const controlPoints = [
      { pos: new THREE.Vector3( 38,  0,   0) },
      { pos: new THREE.Vector3( 44,  0,  16) },
      { pos: new THREE.Vector3( 36,  0,  30) },
      { pos: new THREE.Vector3( 20,  0,  40) },
      { pos: new THREE.Vector3(  4,  0,  42), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-14,  0,  36), surfaceType: 'boost' },
      { pos: new THREE.Vector3(-28,  0,  22) },
      { pos: new THREE.Vector3(-36,  0,   0) },
      { pos: new THREE.Vector3(-28,  0, -22) },
      { pos: new THREE.Vector3(-14,  0, -36) },
      { pos: new THREE.Vector3(  4,  0, -42) },
      { pos: new THREE.Vector3( 20,  0, -40) },
      { pos: new THREE.Vector3( 36,  0, -30) },
      { pos: new THREE.Vector3( 44,  0, -16) },
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

    // Ground — dark arcade floor
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x111111)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Checkerboard floor overlay
    for (let gx = -100; gx < 100; gx += 10) {
      for (let gz = -100; gz < 100; gz += 10) {
        if ((Math.floor(gx / 10) + Math.floor(gz / 10)) % 2 === 0) {
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(9.5, 9.5),
            toon(0x222222)
          );
          tile.rotation.x = -Math.PI / 2;
          tile.position.set(gx + 5, -0.48, gz + 5);
          scene.add(tile);
        }
      }
    }

    // Neon magenta ambient
    const ambient = new THREE.AmbientLight(0xff00ff, 0.5);
    scene.add(ambient);

    // Neon cyan sun
    const sun = new THREE.DirectionalLight(0x00ffff, 1.2);
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

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x0d0015)
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 32;
    scene.add(ceiling);

    // Ceiling neon strips
    const ceilNeonColors = [0xff00ff, 0x00ffff, 0xff00ff, 0x00ffff, 0xff00ff];
    for (let i = -60; i <= 60; i += 30) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.2, 200),
        toon(0xff00ff, { emissive: new THREE.Color(0xff00ff), emissiveIntensity: 0.4 })
      );
      strip.position.set(i, 31.5, 0);
      scene.add(strip);
      const neonLight = new THREE.PointLight(0xff00ff, 0.5, 50);
      neonLight.position.set(i, 30, 0);
      scene.add(neonLight);
    }

    // Props — 6 arcade cabinet boxes with emissive screens
    const cabinetColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff00aa, 0x00ff88, 0xff6600];
    const cabinetPositions = [
      [  48,  0,  10, 0 ],
      [  48,  0,  -5, 0 ],
      [ -46,  0,  10, Math.PI ],
      [ -46,  0,  -5, Math.PI ],
      [  10,  0,  50, -Math.PI / 2 ],
      [ -10,  0,  50, -Math.PI / 2 ],
    ];
    cabinetPositions.forEach(([cx, cy, cz, ry], i) => {
      const col = cabinetColors[i % cabinetColors.length];
      // Body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 5, 2),
        toon(0x111111)
      );
      body.position.set(cx, cy + 2.5, cz);
      body.rotation.y = ry;
      body.castShadow = true;
      scene.add(body);
      // Screen face emissive
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2, 0.15),
        toon(col, { emissive: new THREE.Color(col), emissiveIntensity: 0.4 })
      );
      screen.position.set(cx + Math.sin(ry) * 1.1, cy + 3.5, cz + Math.cos(ry) * 1.1);
      screen.rotation.y = ry;
      scene.add(screen);
      // Marquee
      const marquee = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.8, 2.1),
        toon(col, { emissive: new THREE.Color(col), emissiveIntensity: 0.4 })
      );
      marquee.position.set(cx, cy + 5.4, cz);
      scene.add(marquee);
      // Cabinet glow
      const cLight = new THREE.PointLight(col, 0.7, 12);
      cLight.position.set(cx, cy + 3, cz);
      scene.add(cLight);
    });

    // Props — 4 neon sign tubes (thin cylinders with emissive colors)
    const tubeColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff6600];
    const tubePositions = [
      [  0,  8, -52, 0 ],
      [  0,  8,  52, Math.PI ],
      [ -52,  8,  0, Math.PI / 2 ],
      [  52,  8,  0, -Math.PI / 2 ],
    ];
    tubePositions.forEach(([tx, ty, tz, ry], i) => {
      const col = tubeColors[i % tubeColors.length];
      // Horizontal neon tube
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 20, 12),
        toon(col, { emissive: new THREE.Color(col), emissiveIntensity: 0.4 })
      );
      tube.rotation.z = Math.PI / 2;
      tube.position.set(tx, ty, tz);
      scene.add(tube);
      // Vertical tube
      const tubeV = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 12, 12),
        toon(col, { emissive: new THREE.Color(col), emissiveIntensity: 0.4 })
      );
      tubeV.position.set(tx, ty - 4, tz);
      scene.add(tubeV);
      const tubeLight = new THREE.PointLight(col, 0.8, 25);
      tubeLight.position.set(tx, ty, tz);
      scene.add(tubeLight);
    });

    // Neon boost strip visual (at t~0.45-0.55, around (-14..4, 0, 36..42))
    const boostStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 18),
      toon(0x00ffff, { emissive: new THREE.Color(0x00aaaa), emissiveIntensity: 0.4 })
    );
    boostStrip.rotation.x = -Math.PI / 2;
    boostStrip.position.set(-5, -0.45, 39);
    scene.add(boostStrip);

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
