import * as THREE from 'three';

// Singleton 4-step gradient map: dark shadow → lit → bright → specular
let _gradientMap = null;

export function getGradientMap() {
  if (_gradientMap) return _gradientMap;
  const data = new Uint8Array([40, 100, 180, 255]);
  const tex = new THREE.DataTexture(data, 4, 1);
  tex.format = THREE.RedFormat;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  _gradientMap = tex;
  return tex;
}

export function toon(color, options = {}) {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: getGradientMap(),
    ...options,
  });
}

export const TOON = {
  ROAD:        '#2C2C2C',
  ROAD_DASH:   '#F0F0F0',
  CURB_RED:    '#E8002D',
  CURB_WHITE:  '#FFFFFF',
  GRASS:       '#5DBB63',
  SKY_TOP:     '#1A1A2E',
  SKY_MID:     '#4A90D9',
  SKY_HORIZON: '#87CEEB',
  BARRIER:     '#FF6B00',
  ITEM_BOX:    '#FFD700',
};
