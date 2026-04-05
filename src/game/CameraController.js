import * as THREE from 'three';

const CAMERA_DISTANCE = 4.0;
const CAMERA_HEIGHT = 2.0;
const POSITION_LERP = 0.12;
const ROTATION_LERP = 0.08;
const BASE_FOV = 75;
const MAX_FOV = 85;
const SHAKE_DECAY = 0.4;

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this._shakeOffset = new THREE.Vector3();
  }

  update(kartState, input, dt) {
    if (!kartState || this.disabled) return;

    const heading = kartState.rotation.y;
    const forward = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));

    // Desired camera position: behind and above the kart
    this.targetPosition.copy(kartState.position);
    this.targetPosition.addScaledVector(forward, -CAMERA_DISTANCE);
    this.targetPosition.y += CAMERA_HEIGHT;

    // Lerp camera position
    this.currentPosition.lerp(this.targetPosition, POSITION_LERP);

    // Look target: slightly ahead of kart
    this.lookTarget.copy(kartState.position);
    this.lookTarget.addScaledVector(forward, 2.0);
    this.lookTarget.y += 0.5;

    // Apply camera shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const intensity = this.shakeIntensity * (this.shakeTimer / SHAKE_DECAY);
      this._shakeOffset.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.5,
        (Math.random() - 0.5) * intensity
      );
    } else {
      this._shakeOffset.set(0, 0, 0);
    }

    // Set camera
    this.camera.position.copy(this.currentPosition).add(this._shakeOffset);
    this.camera.lookAt(this.lookTarget);

    // FOV based on speed
    const speedRatio = Math.min(1, kartState.speed / 28.0);
    this.camera.fov = BASE_FOV + (MAX_FOV - BASE_FOV) * speedRatio;
    this.camera.updateProjectionMatrix();

    // Look back
    if (input && input.lookBack) {
      this.targetPosition.copy(kartState.position);
      this.targetPosition.addScaledVector(forward, CAMERA_DISTANCE * 0.8);
      this.targetPosition.y += CAMERA_HEIGHT * 0.8;
      this.camera.position.copy(this.currentPosition).lerp(this.targetPosition, 0.3);
      this.lookTarget.copy(kartState.position).addScaledVector(forward, -5);
      this.camera.lookAt(this.lookTarget);
    }
  }

  shake(intensity) {
    this.shakeIntensity = intensity;
    this.shakeTimer = SHAKE_DECAY;
  }

  addShake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = SHAKE_DECAY;
  }
}
