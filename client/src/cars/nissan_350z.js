/**
 * Nissan 350Z — Keshawn's car — #80e060
 * Short front hood, wide rear haunches, fastback roofline,
 * circular headlights, round taillights, low wide stance.
 *
 * Stats: Top Speed 4 | Accel 3 | Handling 5 | Drift 4
 */
function buildNissan350Z(color) {
  color = color || 0x80e060;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x335566, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 0.5 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.5), metalness: 0.7, roughness: 0.3 });

  // Body — main lower body box
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 4.0), mat);
  body.position.y = 0.35;
  group.add(body);

  // Front hood — shorter, lower
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.2), mat);
  hood.position.set(0, 0.62, -1.0);
  hood.rotation.x = -0.06;
  group.add(hood);

  // Rear haunches — wider than front (signature 350Z flare)
  const haunchL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 1.3), mat);
  haunchL.position.set(-0.95, 0.45, 0.8);
  group.add(haunchL);
  const haunchR = haunchL.clone();
  haunchR.position.x = 0.95;
  group.add(haunchR);

  // Fastback roofline — slopes aggressively from roof to trunk
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.6), glassMat);
  cabin.position.set(0, 0.80, 0.0);
  group.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.2), mat);
  roof.position.set(0, 1.06, -0.1);
  group.add(roof);

  // Fastback slope (rear windshield)
  const fastback = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.8), glassMat);
  fastback.position.set(0, 0.92, 0.7);
  fastback.rotation.x = 0.5;
  group.add(fastback);

  // Trunk
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.6), mat);
  trunk.position.set(0, 0.6, 1.6);
  group.add(trunk);

  // Front fascia
  const frontFascia = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 0.1), darkMat);
  frontFascia.position.set(0, 0.35, -2.0);
  group.add(frontFascia);

  // Circular headlights (two cylinders)
  const headlightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  const hlL = new THREE.Mesh(headlightGeo, lightMat);
  hlL.rotation.x = Math.PI / 2;
  hlL.position.set(-0.5, 0.45, -2.02);
  group.add(hlL);
  const hlR = hlL.clone();
  hlR.position.x = 0.5;
  group.add(hlR);

  // Round taillights (signature 350Z)
  const tailGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12);
  const tlL = new THREE.Mesh(tailGeo, tailMat);
  tlL.rotation.x = Math.PI / 2;
  tlL.position.set(-0.6, 0.5, 1.92);
  group.add(tlL);
  const tlR = tlL.clone();
  tlR.position.x = 0.6;
  group.add(tlR);

  // Lower intake
  const intake = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.08), darkMat);
  intake.position.set(0, 0.18, -2.0);
  group.add(intake);

  // Side skirts
  const skirtGeo = new THREE.BoxGeometry(0.06, 0.12, 3.6);
  const skirtL = new THREE.Mesh(skirtGeo, darkMat);
  skirtL.position.set(-0.92, 0.12, 0);
  group.add(skirtL);
  const skirtR = skirtL.clone();
  skirtR.position.x = 0.92;
  group.add(skirtR);

  // Rear diffuser
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.15), darkMat);
  diffuser.position.set(0, 0.12, 1.95);
  group.add(diffuser);

  // Exhaust tips
  const exhGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8);
  const exhL = new THREE.Mesh(exhGeo, trimMat);
  exhL.rotation.x = Math.PI / 2;
  exhL.position.set(-0.35, 0.15, 2.0);
  group.add(exhL);
  const exhR = exhL.clone();
  exhR.position.x = 0.35;
  group.add(exhR);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16);
  const wheelPositions = [
    [-0.85, 0.22, -1.2],  // FL
    [0.85, 0.22, -1.2],   // FR
    [-0.90, 0.22, 1.2],   // RL (wider stance)
    [0.90, 0.22, 1.2],    // RR
  ];
  group._wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    group._wheels.push(wheel);

    // Rim detail
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.19, 6), trimMat);
    rim.position.copy(wheel.position);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);
  }

  // Driver figure
  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.25), new THREE.MeshStandardMaterial({ color }));
  driverBody.position.set(0, 0.82, 0.1);
  group.add(driverBody);
  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0x443322 }));
  driverHead.position.set(0, 1.05, 0.1);
  group.add(driverHead);

  // Tag for brake lights
  group._tailLights = [tlL, tlR];
  group._tailMat = tailMat;
  group._exhaustL = exhL;
  group._exhaustR = exhR;

  return group;
}

const Nissan350Z = {
  id: 'nissan_350z',
  name: 'Nissan 350Z',
  owner: 'keshawn',
  defaultColor: 0x80e060,
  stats: { topSpeed: 4, accel: 3, handling: 5, drift: 4 },
  // Physics values derived from stats
  maxSpeed: 85,       // base at 150cc
  acceleration: 55,
  turnRate: 3.2,
  driftFactor: 1.15,
  mass: 1200,
  build: buildNissan350Z,
};
