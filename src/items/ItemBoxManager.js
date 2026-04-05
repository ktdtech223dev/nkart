import * as THREE from 'three';
import { toon, getGradientMap, TOON } from '../materials/ToonMaterials.js';
import { ITEM_BOX_RESPAWN_TIME } from '../constants/items.js';

const BOX_SIZE = 0.7;
const PROXIMITY_DISTANCE = 0.9;
const SPIN_SPEED = 2.2;
const BOB_SPEED = 2.5;
const BOB_AMPLITUDE = 0.12;

// Canvas texture for the "?" face with gold bg
function makeQTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, size-8, size-8);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', size/2, size/2 + 4);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText('?', size/2, size/2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// Shimmer material: cycles hue each frame
function makeShimmerMat(faceTex) {
  return new THREE.MeshToonMaterial({
    map: faceTex,
    color: new THREE.Color('#FFD700'),
    gradientMap: getGradientMap(),
    emissive: new THREE.Color('#886600'),
    emissiveIntensity: 0.3,
  });
}

export class ItemBoxManager {
  constructor() {
    this.boxes = [];
    this.scene = null;
    this.onItemCollected = null;
    this._qTex = null;
    this._shimmerHue = 0;
  }

  init(positions, scene) {
    this.scene = scene;
    this.dispose();
    this._qTex = makeQTexture();
    if (!positions) return;
    for (const pos of positions) {
      this.boxes.push(this._createBox(pos));
    }
  }

  _createBox(position) {
    const group = new THREE.Group();

    // Main cube
    const geo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    const mat = makeShimmerMat(this._qTex);
    const cube = new THREE.Mesh(geo, mat);
    cube.castShadow = true;
    group.add(cube);

    // Black outline edges (slightly larger dark cube)
    const outlineGeo = new THREE.BoxGeometry(BOX_SIZE + 0.06, BOX_SIZE + 0.06, BOX_SIZE + 0.06);
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    const outline = new THREE.Mesh(outlineGeo, outlineMat);
    group.add(outline);

    // Point light for glow
    const ptLight = new THREE.PointLight(0xFFD700, 0.4, 2.5);
    group.add(ptLight);

    group.position.copy(position);
    this.scene.add(group);

    return {
      group, mat,
      baseY: position.y,
      active: true,
      respawnTimer: 0,
      position: position.clone(),
    };
  }

  update(kartPosition, dt) {
    const time = performance.now() / 1000;
    // Advance shimmer hue
    this._shimmerHue = (this._shimmerHue + dt * 120) % 360;

    for (const box of this.boxes) {
      if (box.active) {
        box.group.rotation.y += SPIN_SPEED * dt;
        box.group.position.y = box.baseY + Math.sin(time * BOB_SPEED) * BOB_AMPLITUDE;

        // Rainbow shimmer: shift hue of the emissive
        const shimmerColor = new THREE.Color().setHSL(this._shimmerHue / 360, 1, 0.5);
        box.mat.emissive.copy(shimmerColor);
        box.mat.emissiveIntensity = 0.25 + Math.sin(time * 6) * 0.1;

        if (kartPosition) {
          const dist = kartPosition.distanceTo(box.position);
          if (dist < PROXIMITY_DISTANCE) this._collect(box);
        }
      } else {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.active = true;
          box.group.visible = true;
          box.group.scale.setScalar(1);
        } else if (box.respawnTimer < 0.4) {
          const t = 1 - box.respawnTimer / 0.4;
          box.group.visible = true;
          box.group.scale.setScalar(t);
        }
      }
    }
  }

  _collect(box) {
    box.active = false;
    box.group.visible = false;
    box.respawnTimer = ITEM_BOX_RESPAWN_TIME;
    if (this.onItemCollected) this.onItemCollected(box.position);
  }

  dispose() {
    for (const box of this.boxes) {
      if (this.scene) this.scene.remove(box.group);
      box.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    this.boxes = [];
    if (this._qTex) { this._qTex.dispose(); this._qTex = null; }
  }
}
