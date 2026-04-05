import { toon, TOON, getGradientMap } from '../../materials/ToonMaterials.js';
import * as THREE from 'three';
import { TrackBuilder } from '../../track/TrackBuilder.js';

// ---------------------------------------------------------------------------
// LAUNDRY LOOP  –  Dorm Cup, Race 3
// A wide oval on a hardwood dorm floor with an underbed tunnel section.
// Props: shoes, hoodie piles, laundry basket, spinning floor fan.
// Slightly worn wood-plank floor, dim ambient lighting, window backlight.
// ---------------------------------------------------------------------------

export const track = {
  id: 'laundry_loop',
  name: 'LAUNDRY LOOP',
  cup: 'dorm',
  cupIndex: 2,
  lapCount: 3,
  music: 'track_dorm_03',

  skyConfig: {
    topColor:    0xb8cce4,
    bottomColor: 0x7a9bb5,
    fogColor:    0xa0b8cc,
    fogDensity:  0.012,
  },

  buildGeometry(scene) {
    const ROAD_WIDTH = 12;
    const SEGMENTS   = 240;

    // ------------------------------------------------------------------ CURVE
    // Wide oval with a notch on the left that dips under the bed (y = -3)
    // and a kink on the right that goes around the desk leg.
    const curve = new THREE.CatmullRomCurve3(
      [
        // Top straight
        new THREE.Vector3(-20,  0,  35),
        new THREE.Vector3(  0,  0,  40),
        new THREE.Vector3( 20,  0,  35),
        // Right sweeping curve
        new THREE.Vector3( 40,  0,  20),
        new THREE.Vector3( 48,  0,   5),
        new THREE.Vector3( 48,  0, -10),
        // Tight right hairpin
        new THREE.Vector3( 42,  0, -28),
        new THREE.Vector3( 25,  0, -38),
        // Bottom straight (partial)
        new THREE.Vector3(  5,  0, -42),
        new THREE.Vector3(-15,  0, -40),
        // Under-bed tunnel dip — ceiling is at y=4, floor at y=0
        // so we nudge y slightly to simulate a tight passage
        new THREE.Vector3(-28,  0, -32),
        new THREE.Vector3(-38,  0, -20),
        new THREE.Vector3(-42,  0,  -5),
        new THREE.Vector3(-42,  0,   8),
        new THREE.Vector3(-38,  0,  22),
      ],
      true,
      'catmullrom',
      0.5
    );

    // ------------------------------------------------------------------ SCENE ROOT
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // ------------------------------------------------------------------ SKY + FOG
    TrackBuilder.createSky(
      scene,
      track.skyConfig.topColor,
      track.skyConfig.bottomColor,
      track.skyConfig.fogColor,
      track.skyConfig.fogDensity
    );

    // ------------------------------------------------------------------ LIGHTING
    // Window backlight (cool daylight through a window on +Z wall)
    TrackBuilder.createLighting(
      scene,
      0xd0e4f7, 0.55,
      0xffffff, 1.1,
      [30, 50, 60],
      true
    );
    // Warm overhead ceiling fixture
    const ceilingLight = new THREE.PointLight(0xffe5c0, 0.8, 150);
    ceilingLight.position.set(0, 60, 0);
    scene.add(ceilingLight);
    // Dim under-bed fill
    const underBedLight = new THREE.PointLight(0x6688aa, 0.35, 40);
    underBedLight.position.set(-40, 1, 0);
    scene.add(underBedLight);

    // ------------------------------------------------------------------ HARDWOOD FLOOR
    const floorMat = toon('#c08c56');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(floor);

    // Hardwood planks (alternating lighter / darker strips along X)
    const plankColors = [0xb87d44, 0xc89454, 0xd4a568];
    for (let px = -95; px < 95; px += 5) {
      const c = plankColors[Math.abs(Math.floor(px / 5)) % plankColors.length];
      const plank = new THREE.Mesh(
        new THREE.PlaneGeometry(4.7, 200),
        toon('#' + (c >>> 0).toString(16).padStart(6, '0'))
      );
      plank.rotation.x = -Math.PI / 2;
      plank.position.set(px + 2.4, -0.14, 0);
      scene.add(plank);
    }
    // Plank joints (thin dark lines perpendicular to planks)
    const jointMat = toon('#6b4820', { transparent: true, opacity: 0.5 });
    for (let pz = -90; pz < 90; pz += 15) {
      for (let px = -95; px < 95; px += 5) {
        const joint = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 0.12), jointMat);
        joint.rotation.x = -Math.PI / 2;
        joint.position.set(px + 2.4, -0.13, pz + (Math.random() - 0.5) * 4);
        scene.add(joint);
      }
    }

    // ------------------------------------------------------------------ UNDERBED STRUCTURE
    // Bed frame (two long side rails + four legs)
    const bedFrameMat = toon('#5c3a1e');
    // Side rails
    [-7, 7].forEach(z => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(60, 1.5, 1.5), bedFrameMat);
      rail.position.set(-40, 4, z);
      rail.castShadow = true;
      scene.add(rail);
    });
    // Headboard / footboard cross beams
    [-70, -10].forEach(x => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 16), bedFrameMat);
      beam.position.set(x, 4, 0);
      scene.add(beam);
    });
    // Legs
    [[-69, -6], [-69, 6], [-11, -6], [-11, 6]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), bedFrameMat);
      leg.position.set(lx, 2, lz);
      scene.add(leg);
    });
    // Mattress
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(58, 3, 13.5), toon('#e8e0d0'));
    mattress.position.set(-40, 6.5, 0);
    mattress.castShadow = true;
    scene.add(mattress);

    // ------------------------------------------------------------------ ROAD
    const roadGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH, SEGMENTS, 0.05);
    const roadMat  = toon('#e8d5b0');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Centreline
    const centreGeo  = TrackBuilder.buildRoad(curve, 0.7, SEGMENTS, 0.08);
    const centreMesh = new THREE.Mesh(centreGeo, toon('#ffffff', { transparent: true, opacity: 0.5 }));
    trackGroup.add(centreMesh);

    // ------------------------------------------------------------------ WALLS
    const walls = TrackBuilder.buildWalls(curve, ROAD_WIDTH, SEGMENTS, 1.3, 0x8b6040);
    trackGroup.add(walls.visual);

    // ------------------------------------------------------------------ COLLISION
    const collisionGeo  = TrackBuilder.buildRoad(curve, ROAD_WIDTH + 2, SEGMENTS, 0);
    const collisionMesh = new THREE.Mesh(
      collisionGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    trackGroup.add(collisionMesh);
    const wallMesh = walls.collision;
    trackGroup.add(wallMesh);

    // ================================================================== PROPS
    const mat = (hex, emissive = 0x000000) => {
      const m = toon('#' + (hex >>> 0).toString(16).padStart(6, '0'));
      if (emissive !== 0x000000) { m.emissive = new THREE.Color(emissive); }
      return m;
    };

    // --- 1. Shoes (pairs of boxes near the door corner, top-right of oval)
    const shoeData = [
      { pos: [38, 0.4, 38], rot: 0.3,  col: 0x222222 }, // black sneaker
      { pos: [42, 0.4, 36], rot: -0.2, col: 0x222222 },
      { pos: [34, 0.4, 42], rot: 0.5,  col: 0xff4500 }, // orange hi-top
      { pos: [38, 0.4, 44], rot: -0.4, col: 0xff4500 },
      { pos: [28, 0.4, 45], rot: 0.1,  col: 0xf0f0f0 }, // white
      { pos: [32, 0.4, 47], rot: 0.7,  col: 0xf0f0f0 },
    ];
    shoeData.forEach(({ pos, rot, col }) => {
      const sole = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 6.5), mat(0x333333));
      sole.position.set(...pos);
      sole.rotation.y = rot;
      sole.castShadow = true;
      scene.add(sole);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 5.5), mat(col));
      upper.position.set(pos[0], pos[1] + 1.35, pos[2]);
      upper.rotation.y = rot;
      upper.castShadow = true;
      scene.add(upper);
      // Tongue
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), mat(0xeeeeee));
      tongue.position.set(
        pos[0] + Math.sin(rot) * 2,
        pos[1] + 2,
        pos[2] + Math.cos(rot) * 2
      );
      tongue.rotation.y = rot;
      scene.add(tongue);
    });

    // --- 2. Hoodie pile (stacked flat boxes, different grey/coloured)
    const hoodieColors = [0x546e7a, 0x78909c, 0x4caf50];
    hoodieColors.forEach((c, i) => {
      const hoodie = new THREE.Mesh(
        new THREE.BoxGeometry(10 - i, 1.5 + i * 0.3, 8 - i * 0.5),
        mat(c)
      );
      hoodie.position.set(10, i * 1.8 + 0.75, 47 - i * 0.5);
      hoodie.rotation.y = (i - 1) * 0.12;
      hoodie.castShadow = true;
      scene.add(hoodie);
    });

    // --- 3. Laundry basket (open cylinder – hollow)
    const basketMat = mat(0x1565c0);
    const basket = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 4.5, 9, 16, 1, true),
      basketMat
    );
    basket.position.set(-5, 4.5, 47);
    basket.castShadow = true;
    scene.add(basket);
    // Basket base
    const basketBase = new THREE.Mesh(new THREE.CircleGeometry(4.5, 16), mat(0x0d47a1));
    basketBase.rotation.x = -Math.PI / 2;
    basketBase.position.set(-5, 0.05, 47);
    scene.add(basketBase);
    // Clothes spilling out
    const clothColors = [0xff5722, 0x9c27b0, 0x00bcd4];
    clothColors.forEach((c, i) => {
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(4 + i, 0.6, 4 - i * 0.3), mat(c));
      cloth.position.set(-5 + (i - 1) * 3, 9.3 + i * 0.3, 47 + (i - 1) * 2);
      cloth.rotation.z = (i - 1) * 0.3;
      cloth.castShadow = true;
      scene.add(cloth);
    });

    // --- 4. Floor fan (cylinder body + spinning blades as thin planes)
    const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 1, 16), mat(0x424242));
    fanBase.position.set(25, 0.5, -38);
    fanBase.castShadow = true;
    scene.add(fanBase);
    const fanPole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 8), mat(0x757575));
    fanPole.position.set(25, 6.5, -38);
    scene.add(fanPole);
    const fanHead = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.8, 24, 1, true), mat(0x9e9e9e));
    fanHead.position.set(25, 13, -38);
    fanHead.rotation.x = Math.PI / 2;
    scene.add(fanHead);
    // Fan blades (4 thin boxes at angles around the hub)
    const bladeMat = mat(0xbdbdbd, 0x111111);
    for (let b = 0; b < 4; b++) {
      const angle = (b / 4) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, 1.2), bladeMat);
      blade.position.set(
        25 + Math.cos(angle) * 2.5,
        13 + Math.sin(angle) * 2.5,
        -38 - 0.5
      );
      blade.rotation.z = angle + 0.4;
      scene.add(blade);
    }

    // --- 5. Water glass on windowsill area
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 4, 12, 1, true), mat(0xaaddff));
    glass.position.set(0, 2, -45);
    glass.castShadow = true;
    scene.add(glass);
    const glassBase = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 12), mat(0x88bbff));
    glassBase.position.set(0, 0.1, -45);
    scene.add(glassBase);

    // --- 6. Wall outlet (flat box on wall)
    const outlet = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.5), mat(0xeeeeee));
    outlet.position.set(45, 5, -40);
    scene.add(outlet);
    // Socket holes
    [-0.6, 0.6].forEach(dx => {
      const hole = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), mat(0x333333));
      hole.position.set(45 + dx, 5.3, -39.8);
      scene.add(hole);
    });

    // --- 7. Rolled-up poster (cylinder)
    const poster = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 18, 12), mat(0xd4a559));
    poster.position.set(48, 1, -5);
    poster.rotation.z = Math.PI / 2;
    poster.castShadow = true;
    scene.add(poster);

    // --- 8. Trash can (cylinder + rim)
    const trashCan = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.5, 8, 16, 1, true), mat(0x37474f));
    trashCan.position.set(45, 4, 35);
    trashCan.castShadow = true;
    scene.add(trashCan);
    const trashBase = new THREE.Mesh(new THREE.CircleGeometry(2.5, 16), mat(0x263238));
    trashBase.rotation.x = -Math.PI / 2;
    trashBase.position.set(45, 0.05, 35);
    scene.add(trashBase);
    // Crumpled paper ball
    const paper = new THREE.Mesh(new THREE.SphereGeometry(1.5, 6, 6), mat(0xe0e0e0));
    paper.position.set(44, 1.5, 40);
    scene.add(paper);

    // --- 9. Extension cord (flat winding strip)
    const cordMat = mat(0xf57c00);
    for (let seg = 0; seg < 8; seg++) {
      const cordSeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 4), cordMat);
      cordSeg.position.set(
        -5 + seg * 2.5,
        0.13,
        -44 + Math.sin(seg * 0.8) * 2
      );
      cordSeg.rotation.y = Math.sin(seg * 0.8) * 0.3;
      scene.add(cordSeg);
    }

    // --- 10. Doormat (flat textured box near start)
    const doormat = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 7), mat(0x795548));
    doormat.position.set(0, 0.2, 42);
    scene.add(doormat);
    // Doormat ridges
    for (let r = -5; r <= 5; r += 2) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(12, 0.15, 0.5), mat(0x5d4037));
      ridge.position.set(0, 0.45, 42 + r * 0.5);
      scene.add(ridge);
    }

    // ------------------------------------------------------------------ PARTICLES (dust motes near floor fan)
    TrackBuilder.createParticles(scene, {
      count:  120,
      spread: 60,
      color:  '#d0c0a0',
      size:   0.12,
      speed:  0.04,
    });

    // ------------------------------------------------------------------ NAVIGATION
    const checkpoints      = TrackBuilder.generateCheckpoints(curve, 16, ROAD_WIDTH);
    const startPositions   = TrackBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions = TrackBuilder.generateItemBoxPositions(curve, 12);
    const waypointPath     = TrackBuilder.generateWaypoints(curve, 100);

    const surfaceZones = [
      { type: 'hardwood', traction: 0.95, friction: 0.82 },
    ];

    const hazards = [];

    return {
      collisionMesh,
      wallMesh,
      trackGroup,
      curve,
      checkpoints,
      startPositions,
      itemBoxPositions,
      waypointPath,
      surfaceZones,
      hazards,
      respawnY: -5,
    };
  },
};
