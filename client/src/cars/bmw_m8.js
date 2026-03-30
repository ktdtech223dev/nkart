/**
 * BMW M8 Competition — Dart's car — #e04040
 * Long front hood (longest), kidney grille, low wide stance, longest wheelbase,
 * subtle trunk lip spoiler, L-shaped rear lights, refined proportions.
 *
 * Stats: Top Speed 4 | Accel 5 | Handling 3 | Drift 3
 */
function buildBMWM8(color) {
  color = color || 0xe04040;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.65, roughness: 0.25 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x335566, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 0.5 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.5), metalness: 0.7, roughness: 0.3 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });

  // Main body — longest of the four
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 4.6), mat);
  body.position.y = 0.36;
  group.add(body);

  // Long front hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.8), mat);
  hood.position.set(0, 0.64, -1.1);
  hood.rotation.x = -0.03;
  group.add(hood);

  // Kidney grille — two tall rounded rectangles (instantly BMW)
  const grilleGeo = new THREE.BoxGeometry(0.3, 0.25, 0.08);
  const grilleL = new THREE.Mesh(grilleGeo, chromeMat);
  grilleL.position.set(-0.22, 0.42, -2.3);
  group.add(grilleL);
  const grilleR = grilleL.clone();
  grilleR.position.x = 0.22;
  group.add(grilleR);
  // Grille inner (dark)
  const gInner = new THREE.BoxGeometry(0.24, 0.2, 0.06);
  const gInL = new THREE.Mesh(gInner, darkMat);
  gInL.position.set(-0.22, 0.42, -2.32);
  group.add(gInL);
  const gInR = gInL.clone();
  gInR.position.x = 0.22;
  group.add(gInR);

  // Front bumper
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 0.12), darkMat);
  frontBumper.position.set(0, 0.28, -2.3);
  group.add(frontBumper);

  // Angular headlights
  const hlGeo = new THREE.BoxGeometry(0.3, 0.1, 0.08);
  const hlL = new THREE.Mesh(hlGeo, lightMat);
  hlL.position.set(-0.7, 0.5, -2.32);
  group.add(hlL);
  const hlR = hlL.clone();
  hlR.position.x = 0.7;
  group.add(hlR);

  // Cabin — set further back (long hood proportion)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.4), glassMat);
  cabin.position.set(0, 0.82, 0.3);
  group.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.1), mat);
  roof.position.set(0, 1.08, 0.2);
  group.add(roof);

  // Rear windshield
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.6), glassMat);
  rearGlass.position.set(0, 0.95, 0.9);
  rearGlass.rotation.x = 0.35;
  group.add(rearGlass);

  // Trunk with subtle lip spoiler
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.7), mat);
  trunk.position.set(0, 0.6, 1.8);
  group.add(trunk);
  const spoilerLip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.08), darkMat);
  spoilerLip.position.set(0, 0.7, 2.12);
  group.add(spoilerLip);

  // L-shaped taillights
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.06), tailMat);
  const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), tailMat);
  const tlLH = tailH.clone(); tlLH.position.set(-0.65, 0.55, 2.22); group.add(tlLH);
  const tlLV = tailV.clone(); tlLV.position.set(-0.78, 0.48, 2.22); group.add(tlLV);
  const tlRH = tailH.clone(); tlRH.position.set(0.65, 0.55, 2.22); group.add(tlRH);
  const tlRV = tailV.clone(); tlRV.position.set(0.78, 0.48, 2.22); group.add(tlRV);

  // Rear diffuser
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.15), darkMat);
  diffuser.position.set(0, 0.12, 2.2);
  group.add(diffuser);

  // Exhaust
  const exhGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8);
  const exhL = new THREE.Mesh(exhGeo, trimMat); exhL.rotation.x = Math.PI / 2;
  exhL.position.set(-0.4, 0.15, 2.25); group.add(exhL);
  const exhR = exhL.clone(); exhR.position.x = 0.4; group.add(exhR);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.2, 16);
  const wheelPositions = [
    [-0.88, 0.23, -1.5],
    [0.88, 0.23, -1.5],
    [-0.92, 0.23, 1.4],
    [0.92, 0.23, 1.4],
  ];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    group._wheels.push(wheel);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.21, 5), trimMat);
    rim.position.copy(wheel.position);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);
  }

  // Driver
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.25), new THREE.MeshStandardMaterial({ color }));
  driverBody.position.set(0, 0.85, 0.35);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(0, 1.08, 0.35);
  group.add(driverHead);

  group._tailLights = [tlLH, tlLV, tlRH, tlRV];
  group._tailMat = tailMat;

  return group;
}

const BMWM8 = {
  id: 'bmw_m8',
  name: 'BMW M8 Competition',
  owner: 'dart',
  defaultColor: 0xe04040,
  stats: { topSpeed: 4, accel: 5, handling: 3, drift: 3 },
  maxSpeed: 88,
  acceleration: 65,
  turnRate: 2.6,
  driftFactor: 0.95,
  mass: 1600,
  build: buildBMWM8,
};
