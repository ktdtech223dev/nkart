/**
 * Shopping Cart — Unlockable (Win 10 races)
 * Terrible handling, decent speed, hilarious to drive.
 */
function buildShoppingCart(color) {
  color = color || 0xcccccc;
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.3, wireframe: true });

  // Cart basket (wireframe look)
  const basket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.6), wireMat);
  basket.position.set(0, 0.7, 0);
  group.add(basket);
  // Solid bottom
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 1.5), metalMat);
  bottom.position.set(0, 0.35, 0);
  group.add(bottom);

  // Handle
  const handle = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.06), metalMat);
  handle.position.set(0, 1.2, -0.9);
  group.add(handle);
  const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), metalMat);
  handleL.position.set(-0.47, 0.95, -0.9);
  group.add(handleL);
  const handleR = handleL.clone(); handleR.position.x = 0.47;
  group.add(handleR);

  // Child seat flap
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.05), metalMat);
  flap.position.set(0, 0.7, -0.75);
  flap.rotation.x = -0.2;
  group.add(flap);

  // Wheels — small wobbly casters
  const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  const wheelPositions = [[-0.5, 0.12, -0.65], [0.5, 0.12, -0.65], [-0.5, 0.12, 0.65], [0.5, 0.12, 0.65]];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    group._wheels.push(wheel);
  }

  // Driver sitting in cart
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.3), new THREE.MeshStandardMaterial({ color }));
  driverBody.position.set(0, 0.8, 0.2);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(0, 1.15, 0.2);
  group.add(driverHead);

  group._tailLights = [];
  group._tailMat = null;
  return group;
}

const ShoppingCart = {
  id: 'shopping_cart',
  name: 'Shopping Cart',
  owner: null,
  unlockCondition: 'Win 10 races',
  defaultColor: 0xcccccc,
  stats: { topSpeed: 3, accel: 4, handling: 1, drift: 2 },
  maxSpeed: 75,
  acceleration: 58,
  turnRate: 1.6,
  driftFactor: 0.6,
  mass: 300,
  build: buildShoppingCart,
};
