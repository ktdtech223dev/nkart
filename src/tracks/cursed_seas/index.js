import * as THREE from 'three';
import { TrackSplineBuilder } from '../../track/TrackSplineBuilder.js';
import { toon, TOON } from '../../materials/ToonMaterials.js';

export const track = {
  id: 'cursed_seas',
  name: 'CURSED SEAS',
  cup: 'shadow',
  cupIndex: 1,
  lapCount: 3,
  music: 'track_shadow_02',
  skyConfig: {
    topColor:    0x002211,
    bottomColor: 0x004422,
    fogColor:    0x006633,
    fogDensity:  0.008,
  },

  buildGeometry(scene) {
    // Control points: wavy ocean path with rolling swell elevation
    // wet deck sections are 'ice' surface
    const controlPoints = [
      { pos: new THREE.Vector3( 40,  2,   0) },
      { pos: new THREE.Vector3( 48,  6,  20), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 38, 10,  38), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 20,  8,  50) },
      { pos: new THREE.Vector3(  0,  6,  48) },
      { pos: new THREE.Vector3(-20,  8,  40) },
      { pos: new THREE.Vector3(-40,  6,  20) },
      { pos: new THREE.Vector3(-45,  2,   0) },
      { pos: new THREE.Vector3(-40,  6, -20) },
      { pos: new THREE.Vector3(-20,  8, -40), surfaceType: 'ice' },
      { pos: new THREE.Vector3(  0,  6, -48), surfaceType: 'ice' },
      { pos: new THREE.Vector3( 20,  8, -50) },
      { pos: new THREE.Vector3( 38, 10, -38) },
      { pos: new THREE.Vector3( 48,  6, -20) },
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

    // Ground plane (dark sea green)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      toon(0x004422)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Cursed ocean surface (translucent eerie green plane)
    const seaMat = toon(0x003318);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -0.3;
    scene.add(sea);

    // Wave ripple bands on the sea
    const rippleMat = toon(0x005533);
    for (let r = 0; r < 8; r++) {
      const ripple = new THREE.Mesh(
        new THREE.PlaneGeometry(150 - r * 10, 1.5),
        rippleMat
      );
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(
        (Math.random() - 0.5) * 80,
        -0.28 + r * 0.01,
        (Math.random() - 0.5) * 100
      );
      ripple.rotation.z = Math.random() * Math.PI;
      scene.add(ripple);
    }

    // Lighting
    const ambient = new THREE.AmbientLight(0x00aa66, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x88ffcc, 1.2);
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

    // Spectral fill light from below the water
    const spectralGlow = new THREE.PointLight(0x00ff88, 0.6, 80);
    spectralGlow.position.set(0, -2, 0);
    scene.add(spectralGlow);

    // Props: 4 ghost ship masts (tall thin boxes, color 0x334433)
    const mastPositions = [
      [  0,  0,  55, 45], [ 60,  0,  20, 38],
      [-60,  0, -20, 40], [  0,  0, -58, 35],
    ];
    mastPositions.forEach(([mx, my, mz, mh]) => {
      const mast = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, mh, 1.2),
        toon(0x334433)
      );
      mast.position.set(mx, mh / 2, mz);
      mast.castShadow = true;
      scene.add(mast);
      // Tattered sail (flat plane)
      const sail = new THREE.Mesh(
        new THREE.PlaneGeometry(12, mh * 0.55),
        toon(0x223322)
      );
      sail.position.set(mx + 6, mh * 0.65, mz);
      sail.rotation.y = 0.15;
      scene.add(sail);
      // Yard arm (horizontal box)
      const yard = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.6, 0.6),
        toon(0x334433)
      );
      yard.position.set(mx, mh * 0.6, mz);
      scene.add(yard);
    });

    // Props: 3 anchor chains (CylinderGeometry)
    const chainPositions = [
      [ 52,  0,  45], [-52,  0,  50], [ 20,  0, -58],
    ];
    chainPositions.forEach(([ax, ay, az]) => {
      // Anchor chain (cylinder going down into water)
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 12, 6),
        toon(0x446644)
      );
      chain.position.set(ax, 5, az);
      chain.castShadow = true;
      scene.add(chain);
      // Anchor head (box)
      const anchor = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1, 1.5),
        toon(0x334433)
      );
      anchor.position.set(ax, -0.5, az);
      anchor.rotation.z = 0.3;
      scene.add(anchor);
      // Vertical bar of anchor
      const anchorBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 5, 0.8),
        toon(0x334433)
      );
      anchorBar.position.set(ax, 2.5, az);
      scene.add(anchorBar);
    });

    // Ghostly floating debris
    [
      [ 42,  3,  -35, 4, 0.8, 2], [-38,  4,  55, 6, 1.2, 2.5],
      [-55,  2,  -40, 5, 1.0, 1.8],
    ].forEach(([dx, dy, dz, w, h, d]) => {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        toon(0x223322)
      );
      debris.position.set(dx, dy, dz);
      debris.rotation.set(0.2, Math.random(), 0.1);
      debris.castShadow = true;
      scene.add(debris);
    });

    // Eerie bioluminescent patches on ocean surface
    [
      [ 25,  35, 6], [-30, -45, 5], [ 50, -20, 7], [-45,  30, 4],
    ].forEach(([px, pz, pr]) => {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(pr, 16),
        toon(0x00cc88)
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(px, 0.05, pz);
      scene.add(patch);
      const pLight = new THREE.PointLight(0x00ff88, 0.4, pr * 4);
      pLight.position.set(px, 1, pz);
      scene.add(pLight);
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
