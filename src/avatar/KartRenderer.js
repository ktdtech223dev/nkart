import * as THREE from 'three';
import { toon, getGradientMap } from '../materials/ToonMaterials.js';

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function lightenHex(hex, factor) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * factor);
  c.g = Math.min(1, c.g * factor);
  c.b = Math.min(1, c.b * factor);
  return '#' + c.getHexString();
}

function darkenHex(hex, factor) {
  return lightenHex(hex, factor);
}

// ---------------------------------------------------------------------------
// Data tables
// ---------------------------------------------------------------------------

export const KART_BODIES = {
  classic: { color: '#CC2200' },
  muscle:  { color: '#AA0000' },
  wedge:   { color: '#1144DD' },
  bubble:  { color: '#DD4499' },
  flat:    { color: '#228833' },
  pipe:    { color: '#774411' },
  wing:    { color: '#5533BB' },
  box:     { color: '#CC6600' },
  dragon:  { color: '#AA0022' },
  circuit: { color: '#0099CC' },
  phantom: { color: '#1A0A2E' },
  void:    { color: '#111111' },
};

export const WHEEL_STYLES = {
  default:  { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  sport:    { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  offroad:  { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  slick:    { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  chrome:   { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  gold:     { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  carbon:   { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  neon:     { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  classic:  { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  rally:    { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  monster:  { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
  stealth:  { tireColor: '#1A1A1A', hubColor: '#C0C0C0' },
};

// ---------------------------------------------------------------------------
// KartRenderer
// ---------------------------------------------------------------------------

export class KartRenderer {
  constructor() {}

  build(scene, config = {}) {
    const bodyDef    = KART_BODIES[config.body || 'classic'] || KART_BODIES.classic;
    const bodyColor  = config.color || bodyDef.color;
    const bumperColor = lightenHex(bodyColor, 1.15);
    const skirtColor  = darkenHex(bodyColor, 0.85);
    const darkColor   = '#1A1A1A';

    const wheelStyle = WHEEL_STYLES[config.wheelStyle || 'default'] || WHEEL_STYLES.default;

    const hull = new THREE.Group();
    hull.name           = 'kartHull';
    hull.receiveShadow  = true;

    // -----------------------------------------------------------------------
    // Body
    // -----------------------------------------------------------------------
    const bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.35, 1.4),
      toon(bodyColor),
    );
    bodyMesh.position.y    = 0.32;
    bodyMesh.castShadow    = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.name          = 'body';
    hull.add(bodyMesh);

    // Front bumper
    const bumperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.1, 0.18),
      toon(bumperColor),
    );
    bumperMesh.position.set(0, 0.2, 0.78);
    hull.add(bumperMesh);

    // Front spoiler
    const frontSpoilerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.04, 0.22),
      toon(bumperColor),
    );
    frontSpoilerMesh.position.set(0, 0.12, 0.80);
    hull.add(frontSpoilerMesh);

    // Cockpit surround
    const cockpitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.22, 0.7),
      toon(darkColor),
    );
    cockpitMesh.position.set(0, 0.52, -0.05);
    cockpitMesh.castShadow    = true;
    cockpitMesh.receiveShadow = true;
    cockpitMesh.name          = 'cockpit';
    hull.add(cockpitMesh);

    // Roll hoop
    const rollHoopMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.28, 0.06),
      toon(darkColor),
    );
    rollHoopMesh.position.set(0, 0.65, -0.22);
    rollHoopMesh.castShadow    = true;
    rollHoopMesh.receiveShadow = true;
    rollHoopMesh.name          = 'rollHoop';
    hull.add(rollHoopMesh);

    // -----------------------------------------------------------------------
    // Headlights
    // -----------------------------------------------------------------------
    const headlightGeo = new THREE.BoxGeometry(0.18, 0.06, 0.04);
    const headlightMat = new THREE.MeshToonMaterial({
      color:             new THREE.Color('#FFFF88'),
      emissive:          new THREE.Color('#FFFF88'),
      emissiveIntensity: 2,
      gradientMap:       getGradientMap(),
    });

    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(headlightGeo, headlightMat);
      hl.position.set(side * 0.28, 0.30, 0.72);
      hull.add(hl);

      const ptLight = new THREE.PointLight(0xFFFF88, 0.6, 2.5);
      ptLight.position.set(side * 0.28, 0.30, 0.90);
      hull.add(ptLight);
    }

    // -----------------------------------------------------------------------
    // Taillights
    // -----------------------------------------------------------------------
    const taillightGeo = new THREE.BoxGeometry(0.2, 0.05, 0.03);
    const taillightMat = new THREE.MeshToonMaterial({
      color:             new THREE.Color('#FF2200'),
      emissive:          new THREE.Color('#FF0000'),
      emissiveIntensity: 1.5,
      gradientMap:       getGradientMap(),
    });

    for (const side of [-1, 1]) {
      const tl = new THREE.Mesh(taillightGeo, taillightMat);
      tl.position.set(side * 0.28, 0.28, -0.72);
      hull.add(tl);
    }

    // -----------------------------------------------------------------------
    // Exhaust pipes + glow
    // -----------------------------------------------------------------------
    const exhaustGeo     = new THREE.CylinderGeometry(0.03, 0.04, 0.22, 8);
    const exhaustMat     = toon('#444444');
    const exhaustGlowGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.06, 6);

    for (const side of [-1, 1]) {
      const pipe = new THREE.Mesh(exhaustGeo, exhaustMat);
      pipe.position.set(side * 0.22, 0.18, -0.76);
      pipe.rotation.x = Math.PI / 2;
      pipe.rotation.x += 0.15;
      hull.add(pipe);

      const exhaustGlowMat = new THREE.MeshToonMaterial({
        color:             new THREE.Color('#FF4400'),
        emissive:          new THREE.Color('#FF4400'),
        emissiveIntensity: 2,
        gradientMap:       getGradientMap(),
      });
      const glow = new THREE.Mesh(exhaustGlowGeo, exhaustGlowMat);
      glow.position.set(side * 0.22, 0.18, -0.82);
      glow.rotation.x = Math.PI / 2;
      glow.name       = 'exhaustGlow';
      hull.add(glow);
    }

    // -----------------------------------------------------------------------
    // Side skirts
    // -----------------------------------------------------------------------
    const skirtMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.08, 1.28),
      toon(skirtColor),
    );
    skirtMesh.position.y = 0.16;
    hull.add(skirtMesh);

    // -----------------------------------------------------------------------
    // Rear diffuser
    // -----------------------------------------------------------------------
    const diffuserMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.06, 0.24),
      toon(darkColor),
    );
    diffuserMesh.position.set(0, 0.12, -0.72);
    diffuserMesh.rotation.x = 0.18;
    hull.add(diffuserMesh);

    // -----------------------------------------------------------------------
    // Wheels
    // -----------------------------------------------------------------------
    const wheelPositions = [
      { name: 'FL', x: -0.56, y: 0.22, z:  0.52, front: true  },
      { name: 'FR', x:  0.56, y: 0.22, z:  0.52, front: true  },
      { name: 'RL', x: -0.56, y: 0.22, z: -0.48, front: false },
      { name: 'RR', x:  0.56, y: 0.22, z: -0.48, front: false },
    ];

    const wheelData = [];

    for (const wp of wheelPositions) {
      const wheelGroup = new THREE.Group();
      wheelGroup.name  = `wheel_${wp.name}`;
      wheelGroup.position.set(wp.x, wp.y, wp.z);

      // Tire
      const tireMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.15, 8),
        toon(wheelStyle.tireColor),
      );
      tireMesh.rotation.z = Math.PI / 2;
      tireMesh.name       = 'tire';
      wheelGroup.add(tireMesh);

      // Hub
      const hubMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8),
        toon(wheelStyle.hubColor),
      );
      hubMesh.rotation.z = Math.PI / 2;
      hubMesh.name       = 'hub';
      wheelGroup.add(hubMesh);

      // Brake disc
      const brakeMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.17, 6),
        toon('#555555'),
      );
      brakeMesh.rotation.z = Math.PI / 2;
      brakeMesh.name       = 'brakeDisc';
      wheelGroup.add(brakeMesh);

      hull.add(wheelGroup);
      wheelData.push({ group: wheelGroup, front: wp.front });

      // Wheel arch
      const archMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.12, 0.38),
        toon(bodyColor),
      );
      archMesh.position.set(wp.x > 0 ? 0.47 : -0.47, wp.y + 0.1, wp.z);
      hull.add(archMesh);
    }

    // -----------------------------------------------------------------------
    // Spoiler
    // -----------------------------------------------------------------------
    const spoilerType = config.spoiler || 'low';

    if (spoilerType === 'high_wing') {
      // Pillars
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.28, 0.04),
          toon(bodyColor),
        );
        pillar.position.set(side * 0.35, 0.78, -0.6);
        hull.add(pillar);
      }

      // Main wing
      const mainWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.04, 0.22),
        toon(bodyColor),
      );
      mainWing.position.set(0, 0.92, -0.62);
      hull.add(mainWing);

      // End plates
      for (const side of [-1, 1]) {
        const endPlate = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.16, 0.22),
          toon(darkColor),
        );
        endPlate.position.set(side * 0.46, 0.92, -0.62);
        hull.add(endPlate);
      }

      // Second element
      const secondElement = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.03, 0.14),
        toon(darkColor),
      );
      secondElement.position.set(0, 0.86, -0.54);
      hull.add(secondElement);

    } else if (spoilerType !== 'none') {
      // 'low' (default): single wing closer to body
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.28, 0.04),
          toon(bodyColor),
        );
        pillar.position.set(side * 0.35, 0.58, -0.6);
        hull.add(pillar);
      }

      const lowWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.04, 0.22),
        toon(bodyColor),
      );
      lowWing.position.set(0, 0.66, -0.62);
      hull.add(lowWing);
    }
    // 'none' → nothing added

    // -----------------------------------------------------------------------
    // Assemble
    // -----------------------------------------------------------------------
    const kartGroup = new THREE.Group();
    kartGroup.name  = 'kart';
    kartGroup.add(hull);

    kartGroup.userData.wheels = wheelData;

    scene.add(kartGroup);
    return kartGroup;
  }

  // -------------------------------------------------------------------------
  // Per-frame wheel update
  // -------------------------------------------------------------------------
  updateWheels(kartGroup, speed, steer, dt) {
    if (!kartGroup) return;
    const wheels = kartGroup.userData.wheels;
    if (!wheels) return;

    for (const w of wheels) {
      const tire = w.group.getObjectByName('tire');
      if (tire) {
        tire.rotation.x += speed * 5 * dt;
      }
      if (w.front) {
        w.group.rotation.y = steer * 0.42;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Boost effect
  // -------------------------------------------------------------------------
  setBoostEffect(kartGroup, active) {
    if (!kartGroup) return;
    kartGroup.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mat = obj.material;
        // Orange/red exhaust glow: emissive.r is high, emissive.g is low (<0.1)
        if (mat.emissive && mat.emissive.g < 0.1) {
          mat.emissiveIntensity = active ? 4.0 : 2.0;
        }
      }
    });
  }
}
