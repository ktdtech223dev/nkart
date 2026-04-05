import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const SpeedBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = length(center);
      float vignette = 1.0 - smoothstep(0.35, 0.85, dist) * intensity;
      gl_FragColor = texture2D(tDiffuse, uv) * vec4(vec3(vignette), 1.0);
    }
  `,
};

export class PostProcessingPipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    this._speedIntensity = 0;

    this.composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Cel-shader outline pass — black outlines on all objects
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );
    this.outlinePass.edgeStrength = 4;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.edgeThickness = 2;
    this.outlinePass.visibleEdgeColor.set('#000000');
    this.outlinePass.hiddenEdgeColor.set('#000000');
    this.outlinePass.selectedObjects = [];
    this.composer.addPass(this.outlinePass);

    // Speed blur radial vignette
    this.speedBlurPass = new ShaderPass(SpeedBlurShader);
    this.composer.addPass(this.speedBlurPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  // Collect all non-basic meshes in the scene for outline rendering
  collectSceneObjects() {
    const objects = [];
    this.scene.traverse(obj => {
      if (
        obj.isMesh &&
        obj.material &&
        !(obj.material instanceof THREE.MeshBasicMaterial) &&
        obj.visible
      ) {
        objects.push(obj);
      }
    });
    this.outlinePass.selectedObjects = objects;
  }

  setOutlineObjects(objects) {
    this.outlinePass.selectedObjects = objects;
  }

  // normalizedSpeed 0-1 → blur intensity 0→0.4 from 80%→100% speed
  setSpeedIntensity(normalizedSpeed) {
    const t = Math.max(0, (normalizedSpeed - 0.8) / 0.2);
    this._speedIntensity = t * 0.4;
    this.speedBlurPass.uniforms.intensity.value = this._speedIntensity;
  }

  setBoostMode(active) {
    this.speedBlurPass.uniforms.intensity.value = active ? 0.5 : this._speedIntensity;
  }

  resize(width, height) {
    this.composer.setSize(width, height);
    if (this.outlinePass.resolution) {
      this.outlinePass.resolution.set(width, height);
    }
  }

  render() {
    if (this.enabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  dispose() {
    this.composer.dispose();
  }
}
