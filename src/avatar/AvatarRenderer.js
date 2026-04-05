import * as THREE from 'three';
import { toon, getGradientMap } from '../materials/ToonMaterials.js';

// ---------------------------------------------------------------------------
// Avatar colour definitions
// ---------------------------------------------------------------------------

const AVATAR_COLORS = {
  volta:   { suit: '#FFDD00', helmet: '#CCCCCC', skin: '#F4C89A' },
  cinder:  { suit: '#FF4400', helmet: '#333333', skin: '#D4A574' },
  echo:    { suit: '#5533BB', helmet: '#3311AA', skin: '#E8C9A0' },
  terra:   { suit: '#225533', helmet: '#1A4422', skin: '#A0785A' },
  nova:    { suit: '#0A0A40', helmet: '#111155', skin: '#F0D5B8' },
  rift:    { suit: '#CC0055', helmet: '#220022', skin: '#DCC0A8' },
  surge:   { suit: '#556688', helmet: '#445577', skin: '#F4C89A' },
  phantom: { suit: '#080808', helmet: '#111111', skin: '#888888' },
};

// ---------------------------------------------------------------------------
// AvatarRenderer
// ---------------------------------------------------------------------------

export class AvatarRenderer {

  /**
   * Build a seated driver avatar and return the THREE.Group.
   * @param {string} avatarId - key in AVATAR_COLORS
   * @param {object} config   - optional overrides (e.g. { suitPrimary: '#FF0000' })
   * @returns {THREE.Group}
   */
  build(avatarId, config = {}) {
    const colors    = AVATAR_COLORS[avatarId] || AVATAR_COLORS.volta;
    const suitColor = config.suitPrimary || colors.suit;

    const group = new THREE.Group();
    group.name  = 'avatar';

    // -----------------------------------------------------------------------
    // Body (torso)
    // -----------------------------------------------------------------------
    const bodyGeo = new THREE.CapsuleGeometry(0.12, 0.22, 4, 8);
    const body    = new THREE.Mesh(bodyGeo, toon(suitColor));
    body.position.y = 0.48;
    body.name       = 'body';
    body.castShadow = true;
    group.add(body);

    // -----------------------------------------------------------------------
    // Head
    // -----------------------------------------------------------------------
    const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const head    = new THREE.Mesh(headGeo, toon(colors.skin));
    head.position.y = 0.82;
    head.name       = 'head';
    head.castShadow = true;
    group.add(head);

    // -----------------------------------------------------------------------
    // Helmet (slightly larger sphere, flattened)
    // -----------------------------------------------------------------------
    const helmetGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const helmet    = new THREE.Mesh(helmetGeo, toon(colors.helmet));
    helmet.position.y = 0.85;
    helmet.scale.y    = 0.88;
    helmet.castShadow = true;
    group.add(helmet);

    // -----------------------------------------------------------------------
    // Visor (dark transparent plane in front of helmet)
    // -----------------------------------------------------------------------
    const visorGeo = new THREE.PlaneGeometry(0.2, 0.1);
    const visorMat = new THREE.MeshToonMaterial({
      color:       0x001133,
      gradientMap: getGradientMap(),
      transparent: true,
      opacity:     0.7,
      side:        THREE.DoubleSide,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.83, 0.14);
    visor.rotation.x = -0.25;
    group.add(visor);

    // -----------------------------------------------------------------------
    // Arms
    // -----------------------------------------------------------------------
    const armGeo = new THREE.CapsuleGeometry(0.055, 0.14, 4, 6);

    const leftArm = new THREE.Mesh(armGeo, toon(suitColor));
    leftArm.position.set(-0.2, 0.52, 0.06);
    leftArm.rotation.z = 0.5;
    leftArm.rotation.x = -0.6;
    leftArm.name       = 'leftArm';
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo.clone(), toon(suitColor));
    rightArm.position.set(0.2, 0.52, 0.06);
    rightArm.rotation.z = -0.5;
    rightArm.rotation.x = -0.6;
    rightArm.name       = 'rightArm';
    group.add(rightArm);

    // -----------------------------------------------------------------------
    // Steering wheel
    // -----------------------------------------------------------------------
    const swGeo = new THREE.TorusGeometry(0.11, 0.012, 6, 18);
    const swMat = toon('#111111');

    const sw = new THREE.Mesh(swGeo, swMat);
    sw.position.set(0, 0.44, 0.22);
    sw.rotation.x = -0.4;
    sw.name       = 'steeringWheel';
    group.add(sw);

    // 3 spokes
    for (let i = 0; i < 3; i++) {
      const spokeGeo = new THREE.BoxGeometry(0.18, 0.01, 0.01);
      const spoke    = new THREE.Mesh(spokeGeo, swMat);
      spoke.rotation.z = (i / 3) * Math.PI * 2;
      sw.add(spoke);
    }

    // -----------------------------------------------------------------------
    // Scale
    // -----------------------------------------------------------------------
    group.scale.setScalar(0.9);

    return group;
  }

  // -------------------------------------------------------------------------
  // Per-frame update
  // -------------------------------------------------------------------------
  update(avatar, kartState, input, dt) {
    if (!avatar) return;

    const time  = performance.now() / 1000;
    const steer = input?.steer || 0;
    const speed = (kartState?.speed || 0) / 28;

    const head     = avatar.getObjectByName('head');
    const leftArm  = avatar.getObjectByName('leftArm');
    const rightArm = avatar.getObjectByName('rightArm');
    const sw       = avatar.getObjectByName('steeringWheel');

    if (head) {
      head.position.y = 0.82 + Math.sin(time * 8 * (0.3 + speed * 0.7)) * 0.002;
      head.rotation.z = steer * -0.06;
    }

    if (sw)       sw.rotation.z       = steer *  0.5;
    if (leftArm)  leftArm.rotation.z  =  0.5  + steer * 0.2;
    if (rightArm) rightArm.rotation.z = -0.5  + steer * 0.2;

    if (kartState?.isStunned) {
      if (head) head.rotation.x = -0.4;
    } else {
      if (head) head.rotation.x = 0;
    }
  }

  // -------------------------------------------------------------------------
  // Win / lose animations (single-frame pose)
  // -------------------------------------------------------------------------
  playWinAnimation(avatar) {
    const rightArm = avatar.getObjectByName('rightArm');
    if (rightArm) {
      rightArm.rotation.z = -2.4;
      rightArm.position.y =  0.72;
    }
  }

  playLoseAnimation(avatar) {
    const head = avatar.getObjectByName('head');
    if (head) {
      head.rotation.x = 0.5;
      head.position.y = 0.76;
    }
  }
}
