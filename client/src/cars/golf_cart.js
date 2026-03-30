/**
 * Golf Cart — Unlockable (Win a race without using items)
 * Extremely slow but nimble.
 */
function buildGolfCart(color) {
  color = color || 0xeeeeee;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x886644, metalness: 0.2, roughness: 0.7 });

  // Body / frame
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 2.2), mat);
  body.position.set(0, 0.35, 0);
  group.add(body);

  // Front cowl
  const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.8), mat);
  cowl.position.set(0, 0.45, -0.8);
  group.add(cowl);

  // Roof (canopy)
  const roofPosts = [[-0.55, 0, -0.4], [0.55, 0, -0.4], [-0.55, 0, 0.6], [0.55, 0, 0.6]];
  for (const [x, _, z] of roofPosts) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), darkMat);
    post.position.set(x, 0.9, z);
    group.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 1.3), mat);
  roof.position.set(0, 1.22, 0.1);
  group.add(roof);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.5), seatMat);
  seat.position.set(0, 0.56, 0.3);
  group.add(seat);
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.08), seatMat);
  seatBack.position.set(0, 0.75, 0.55);
  group.add(seatBack);

  // Rear cargo area
  const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.5), darkMat);
  cargo.position.set(0, 0.4, 0.95);
  group.add(cargo);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.3 }));
  windshield.position.set(0, 0.8, -0.45);
  windshield.rotation.x = -0.15;
  group.add(windshield);

  // Wheels — small
  const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 12);
  const wheelPositions = [[-0.6, 0.15, -0.7], [0.6, 0.15, -0.7], [-0.6, 0.15, 0.7], [0.6, 0.15, 0.7]];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z); wheel.rotation.z = Math.PI / 2;
    group.add(wheel); group._wheels.push(wheel);
  }

  // Driver
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.25), new THREE.MeshStandardMaterial({ color }));
  driverBody.position.set(0, 0.8, 0.3);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(0, 1.08, 0.3);
  group.add(driverHead);

  group._tailLights = [];
  group._tailMat = null;
  return group;
}

const GolfCart = {
  id: 'golf_cart',
  name: 'Golf Cart',
  owner: null,
  unlockCondition: 'Win a race without using items',
  defaultColor: 0xeeeeee,
  stats: { topSpeed: 1, accel: 3, handling: 5, drift: 3 },
  maxSpeed: 45,
  acceleration: 50,
  turnRate: 3.5,
  driftFactor: 1.0,
  mass: 500,
  build: buildGolfCart,
};
