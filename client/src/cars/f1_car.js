/**
 * F1 Car — Unlockable (Gold on all Time Attack)
 * Open wheel, fastest car, fragile to hits.
 */
function buildF1Car(color) {
  color = color || 0xff4400;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.4 });
  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.3 });

  // Nose cone
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.2), mat);
  nose.position.set(0, 0.3, -1.6);
  group.add(nose);

  // Front wing
  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.4), carbonMat);
  frontWing.position.set(0, 0.15, -2.1);
  group.add(frontWing);
  const fwEnd1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.4), mat);
  fwEnd1.position.set(-0.9, 0.18, -2.1); group.add(fwEnd1);
  const fwEnd2 = fwEnd1.clone(); fwEnd2.position.x = 0.9; group.add(fwEnd2);

  // Monocoque body
  const mono = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 2.5), mat);
  mono.position.set(0, 0.38, 0);
  group.add(mono);

  // Cockpit opening
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.6), darkMat);
  cockpit.position.set(0, 0.6, -0.1);
  group.add(cockpit);

  // Halo
  const haloF = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), carbonMat);
  haloF.position.set(0, 0.7, -0.35); group.add(haloF);
  const haloT = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), carbonMat);
  haloT.position.set(0, 0.82, -0.15); group.add(haloT);

  // Engine cover / airbox
  const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), mat);
  airbox.position.set(0, 0.7, 0.2);
  group.add(airbox);
  const engineCover = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 1.5), mat);
  engineCover.position.set(0, 0.45, 0.9);
  group.add(engineCover);

  // Rear wing
  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.35), mat);
  rearWing.position.set(0, 0.85, 1.7);
  group.add(rearWing);
  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), carbonMat);
  pillarL.position.set(-0.5, 0.65, 1.7); group.add(pillarL);
  const pillarR = pillarL.clone(); pillarR.position.x = 0.5; group.add(pillarR);

  // Wheels — open wheel
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 16);
  const wheelPositions = [[-0.85, 0.28, -1.4], [0.85, 0.28, -1.4], [-0.85, 0.28, 1.2], [0.85, 0.28, 1.2]];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z); wheel.rotation.z = Math.PI / 2;
    group.add(wheel); group._wheels.push(wheel);
  }

  // Driver helmet
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshStandardMaterial({ color }));
  driverHead.position.set(0, 0.72, -0.1);
  group.add(driverHead);

  group._tailLights = [];
  group._tailMat = null;
  return group;
}

const F1Car = {
  id: 'f1_car',
  name: 'F1 Car',
  owner: null,
  unlockCondition: 'Gold on all Time Attack',
  defaultColor: 0xff4400,
  stats: { topSpeed: 5, accel: 5, handling: 4, drift: 1 },
  maxSpeed: 110,
  acceleration: 70,
  turnRate: 3.0,
  driftFactor: 0.5,
  mass: 800,
  build: buildF1Car,
};
