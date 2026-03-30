/**
 * Riding Lawnmower — Unlockable (Complete all 16 tracks)
 */
function buildLawnmower(color) {
  color = color || 0x44aa22;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.4, roughness: 0.4 });

  // Body/engine housing
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.8), mat);
  body.position.set(0, 0.45, 0);
  group.add(body);

  // Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.8), mat);
  hood.position.set(0, 0.55, -0.9);
  group.add(hood);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), darkMat);
  seat.position.set(0, 0.75, 0.3);
  group.add(seat);
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), darkMat);
  seatBack.position.set(0, 0.9, 0.55);
  group.add(seatBack);

  // Steering wheel
  const steeringCol = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), darkMat);
  steeringCol.position.set(0, 0.85, -0.3);
  steeringCol.rotation.x = -0.4;
  group.add(steeringCol);

  // Mowing deck underneath
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.2), redMat);
  deck.position.set(0, 0.1, -0.2);
  group.add(deck);

  // Wheels
  const frontWheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12);
  const rearWheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
  group._wheels = [];

  const fl = new THREE.Mesh(frontWheelGeo, darkMat); fl.position.set(-0.55, 0.15, -0.7); fl.rotation.z = Math.PI / 2; group.add(fl); group._wheels.push(fl);
  const fr = fl.clone(); fr.position.x = 0.55; group.add(fr); group._wheels.push(fr);
  const rl = new THREE.Mesh(rearWheelGeo, darkMat); rl.position.set(-0.55, 0.25, 0.7); rl.rotation.z = Math.PI / 2; group.add(rl); group._wheels.push(rl);
  const rr = rl.clone(); rr.position.x = 0.55; group.add(rr); group._wheels.push(rr);

  // Driver
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.25), new THREE.MeshStandardMaterial({ color }));
  driverBody.position.set(0, 0.95, 0.3);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(0, 1.22, 0.3);
  group.add(driverHead);

  group._tailLights = [];
  group._tailMat = null;
  return group;
}

const Lawnmower = {
  id: 'lawnmower',
  name: 'Riding Lawnmower',
  owner: null,
  unlockCondition: 'Complete all 16 tracks',
  defaultColor: 0x44aa22,
  stats: { topSpeed: 2, accel: 2, handling: 4, drift: 2 },
  maxSpeed: 55,
  acceleration: 40,
  turnRate: 2.8,
  driftFactor: 0.7,
  mass: 400,
  build: buildLawnmower,
};
