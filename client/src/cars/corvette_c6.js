/**
 * Corvette C6 Z06 — Amari's car — #40c0e0
 * Long flat hood with central power bulge, fastback greenhouse,
 * side vents behind front wheels, wide rear with quad exhaust,
 * most aggressive wide-body stance.
 *
 * Stats: Top Speed 5 | Accel 3 | Handling 3 | Drift 5
 */
function buildCorvetteC6(color) {
  color = color || 0x40c0e0;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x335566, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 0.5 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.5), metalness: 0.7, roughness: 0.3 });

  // Main body — wide aggressive
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.42, 4.3), mat);
  body.position.y = 0.34;
  group.add(body);

  // Long flat hood with central power bulge
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 1.7), mat);
  hood.position.set(0, 0.6, -1.0);
  group.add(hood);
  const bulge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 1.4), mat);
  bulge.position.set(0, 0.68, -1.0);
  group.add(bulge);

  // Fastback greenhouse — drops sharply at C-pillar
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 1.3), glassMat);
  cabin.position.set(0, 0.78, 0.2);
  group.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 1.0), mat);
  roof.position.set(0, 1.02, 0.1);
  group.add(roof);

  // Sharp fastback rear glass
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.7), glassMat);
  rearGlass.position.set(0, 0.88, 0.75);
  rearGlass.rotation.x = 0.55;
  group.add(rearGlass);

  // Front fascia
  const frontFascia = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.32, 0.12), darkMat);
  frontFascia.position.set(0, 0.3, -2.15);
  group.add(frontFascia);

  // Headlights — angular
  const hlGeo = new THREE.BoxGeometry(0.3, 0.1, 0.08);
  const hlL = new THREE.Mesh(hlGeo, lightMat);
  hlL.position.set(-0.7, 0.46, -2.18);
  group.add(hlL);
  const hlR = hlL.clone();
  hlR.position.x = 0.7;
  group.add(hlR);

  // Side vents behind front wheels — Z06 signature
  const ventGeo = new THREE.BoxGeometry(0.06, 0.12, 0.3);
  const ventL = new THREE.Mesh(ventGeo, darkMat);
  ventL.position.set(-1.02, 0.42, -0.5);
  group.add(ventL);
  const ventR = ventL.clone();
  ventR.position.x = 1.02;
  group.add(ventR);

  // Wide body haunches
  const haunchGeo = new THREE.BoxGeometry(0.28, 0.4, 1.4);
  const haunchL = new THREE.Mesh(haunchGeo, mat);
  haunchL.position.set(-1.05, 0.42, 0.8);
  group.add(haunchL);
  const haunchR = haunchL.clone();
  haunchR.position.x = 1.05;
  group.add(haunchR);

  // Rear with taillights
  const rearPanel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 0.1), darkMat);
  rearPanel.position.set(0, 0.38, 2.1);
  group.add(rearPanel);

  // Taillights — rectangular
  const tailGeo = new THREE.BoxGeometry(0.35, 0.1, 0.06);
  const tlL = new THREE.Mesh(tailGeo, tailMat);
  tlL.position.set(-0.6, 0.48, 2.12); group.add(tlL);
  const tlR = tlL.clone();
  tlR.position.x = 0.6; group.add(tlR);

  // Trunk
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.5), mat);
  trunk.position.set(0, 0.58, 1.7);
  group.add(trunk);

  // Quad exhaust tips (two each side)
  const exhGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 8);
  const positions = [[-0.45, 0.15, 2.15], [-0.3, 0.15, 2.15], [0.3, 0.15, 2.15], [0.45, 0.15, 2.15]];
  for (const [x, y, z] of positions) {
    const exh = new THREE.Mesh(exhGeo, trimMat);
    exh.rotation.x = Math.PI / 2;
    exh.position.set(x, y, z);
    group.add(exh);
  }

  // Wheels — widest stance
  const wheelGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.22, 16);
  const wheelPositions = [
    [-0.95, 0.23, -1.4],
    [0.95, 0.23, -1.4],
    [-1.05, 0.23, 1.3],
    [1.05, 0.23, 1.3],
  ];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    group._wheels.push(wheel);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.23, 5), trimMat);
    rim.position.copy(wheel.position);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);
  }

  // Driver
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.25), new THREE.MeshStandardMaterial({ color }));
  driverBody.position.set(0, 0.82, 0.25);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(0, 1.05, 0.25);
  group.add(driverHead);

  group._tailLights = [tlL, tlR];
  group._tailMat = tailMat;

  return group;
}

const CorvetteC6 = {
  id: 'corvette_c6',
  name: 'Corvette C6 Z06',
  owner: 'amari',
  defaultColor: 0x40c0e0,
  stats: { topSpeed: 5, accel: 3, handling: 3, drift: 5 },
  maxSpeed: 92,
  acceleration: 52,
  turnRate: 2.6,
  driftFactor: 1.3,
  mass: 1350,
  build: buildCorvetteC6,
};
