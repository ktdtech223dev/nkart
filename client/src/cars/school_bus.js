/**
 * School Bus — Unlockable (Finish last in 5 races)
 * Huge, slow to turn, surprisingly fast in a straight line.
 */
function buildSchoolBus(color) {
  color = color || 0xf0c020;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x446688, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.5 });

  // Main body — big and boxy
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 5.0), mat);
  body.position.set(0, 0.9, 0);
  group.add(body);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 5.0), mat);
  roof.position.set(0, 1.54, 0);
  group.add(roof);

  // Front
  const front = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.1), darkMat);
  front.position.set(0, 0.8, -2.55);
  group.add(front);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.06), windowMat);
  windshield.position.set(0, 1.1, -2.52);
  group.add(windshield);

  // Side windows (rows)
  for (let i = 0; i < 5; i++) {
    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.6), windowMat);
    winL.position.set(-1.02, 1.1, -1.5 + i * 0.8);
    group.add(winL);
    const winR = winL.clone(); winR.position.x = 1.02;
    group.add(winR);
  }

  // Headlights
  const hlGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10);
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 0.5 });
  const hlL = new THREE.Mesh(hlGeo, hlMat); hlL.rotation.x = Math.PI / 2; hlL.position.set(-0.7, 0.6, -2.56); group.add(hlL);
  const hlR = hlL.clone(); hlR.position.x = 0.7; group.add(hlR);

  // Stop sign arm (folded)
  const stopArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.04), new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
  stopArm.position.set(-1.25, 1.0, -1.0);
  group.add(stopArm);

  // SCHOOL BUS text would go here in final polish

  // Bumpers
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.15), darkMat);
  bumperF.position.set(0, 0.3, -2.55); group.add(bumperF);
  const bumperR = bumperF.clone(); bumperR.position.z = 2.55; group.add(bumperR);

  // Wheels — big
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 14);
  const wheelPositions = [[-0.9, 0.3, -1.6], [0.9, 0.3, -1.6], [-0.9, 0.3, 1.6], [0.9, 0.3, 1.6]];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z); wheel.rotation.z = Math.PI / 2;
    group.add(wheel); group._wheels.push(wheel);
  }

  // Driver
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.25), new THREE.MeshStandardMaterial({ color: 0x4466aa }));
  driverBody.position.set(-0.3, 1.1, -1.8);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(-0.3, 1.4, -1.8);
  group.add(driverHead);

  group._tailLights = [];
  group._tailMat = null;
  return group;
}

const SchoolBus = {
  id: 'school_bus',
  name: 'School Bus',
  owner: null,
  unlockCondition: 'Finish last in 5 races',
  defaultColor: 0xf0c020,
  stats: { topSpeed: 3, accel: 2, handling: 1, drift: 1 },
  maxSpeed: 72,
  acceleration: 38,
  turnRate: 1.4,
  driftFactor: 0.4,
  mass: 5000,
  build: buildSchoolBus,
};
