/**
 * Nissan GTR R35 — Sean's car — #f0c040
 * Wide aggressive front, quad round taillights, boxy muscular haunches,
 * hood power bulge, wide rear diffuser, higher profile.
 *
 * Stats: Top Speed 5 | Accel 4 | Handling 3 | Drift 3
 */
function buildNissanGTR(color) {
  color = color || 0xf0c040;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x335566, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 0.5 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.5), metalness: 0.7, roughness: 0.3 });

  // Main body — wider and taller than 350Z
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.2), mat);
  body.position.y = 0.38;
  group.add(body);

  // Hood with power bulge
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 1.5), mat);
  hood.position.set(0, 0.68, -0.9);
  group.add(hood);
  // Twin hood bumps
  const bumpGeo = new THREE.BoxGeometry(0.25, 0.06, 1.0);
  const bumpL = new THREE.Mesh(bumpGeo, mat);
  bumpL.position.set(-0.3, 0.78, -0.9);
  group.add(bumpL);
  const bumpR = bumpL.clone();
  bumpR.position.x = 0.3;
  group.add(bumpR);

  // Boxy muscular haunches (widest rear)
  const haunchGeo = new THREE.BoxGeometry(0.3, 0.45, 1.5);
  const haunchL = new THREE.Mesh(haunchGeo, mat);
  haunchL.position.set(-1.05, 0.48, 0.7);
  group.add(haunchL);
  const haunchR = haunchL.clone();
  haunchR.position.x = 1.05;
  group.add(haunchR);

  // Cabin — more upright than 350Z
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.48, 1.5), glassMat);
  cabin.position.set(0, 0.85, 0.1);
  group.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.2), mat);
  roof.position.set(0, 1.12, 0.0);
  group.add(roof);

  // Rear windshield
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.7), glassMat);
  rearGlass.position.set(0, 0.98, 0.7);
  rearGlass.rotation.x = 0.4;
  group.add(rearGlass);

  // Front bumper — wide aggressive with two large rectangular intakes
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 0.15), darkMat);
  frontBumper.position.set(0, 0.32, -2.1);
  group.add(frontBumper);
  const intakeGeo = new THREE.BoxGeometry(0.5, 0.18, 0.1);
  const intakeL = new THREE.Mesh(intakeGeo, new THREE.MeshStandardMaterial({ color: 0x050505 }));
  intakeL.position.set(-0.45, 0.22, -2.12);
  group.add(intakeL);
  const intakeR = intakeL.clone();
  intakeR.position.x = 0.45;
  group.add(intakeR);

  // Headlights — angular
  const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.08);
  const hlL = new THREE.Mesh(hlGeo, lightMat);
  hlL.position.set(-0.7, 0.52, -2.12);
  group.add(hlL);
  const hlR = hlL.clone();
  hlR.position.x = 0.7;
  group.add(hlR);

  // Quad round taillights — THE iconic R35 feature (two stacked each side)
  const tailGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
  const tl1 = new THREE.Mesh(tailGeo, tailMat); tl1.rotation.x = Math.PI / 2;
  tl1.position.set(-0.6, 0.55, 2.02); group.add(tl1);
  const tl2 = new THREE.Mesh(tailGeo, tailMat); tl2.rotation.x = Math.PI / 2;
  tl2.position.set(-0.6, 0.40, 2.02); group.add(tl2);
  const tl3 = new THREE.Mesh(tailGeo, tailMat); tl3.rotation.x = Math.PI / 2;
  tl3.position.set(0.6, 0.55, 2.02); group.add(tl3);
  const tl4 = new THREE.Mesh(tailGeo, tailMat); tl4.rotation.x = Math.PI / 2;
  tl4.position.set(0.6, 0.40, 2.02); group.add(tl4);

  // Wide rear diffuser
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.2), darkMat);
  diffuser.position.set(0, 0.12, 2.05);
  group.add(diffuser);

  // Trunk
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.6), mat);
  trunk.position.set(0, 0.65, 1.6);
  group.add(trunk);

  // Wheels — wider stance than 350Z
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16);
  const wheelPositions = [
    [-0.92, 0.24, -1.3],
    [0.92, 0.24, -1.3],
    [-1.0, 0.24, 1.2],
    [1.0, 0.24, 1.2],
  ];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    group._wheels.push(wheel);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.21, 6), trimMat);
    rim.position.copy(wheel.position);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);
  }

  // Driver
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.25), new THREE.MeshStandardMaterial({ color }));
  driverBody.position.set(0, 0.88, 0.15);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(0, 1.12, 0.15);
  group.add(driverHead);

  group._tailLights = [tl1, tl2, tl3, tl4];
  group._tailMat = tailMat;

  return group;
}

const NissanGTR = {
  id: 'nissan_gtr',
  name: 'Nissan GTR R35',
  owner: 'sean',
  defaultColor: 0xf0c040,
  stats: { topSpeed: 5, accel: 4, handling: 3, drift: 3 },
  maxSpeed: 95,
  acceleration: 60,
  turnRate: 2.6,
  driftFactor: 0.95,
  mass: 1500,
  build: buildNissanGTR,
};
