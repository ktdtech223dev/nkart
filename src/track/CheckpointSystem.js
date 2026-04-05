import * as THREE from 'three';

export class CheckpointSystem {
  constructor() {
    this.checkpoints = [];
    this.totalLaps = 3;
    this.onLapComplete = null;
    this.onRaceFinish = null;
    this.onWrongWay = null;
    this.lastCheckpointTime = 0;
  }

  init(checkpoints, lapCount) {
    this.checkpoints = checkpoints || [];
    this.totalLaps = lapCount || 3;
  }

  update(kartState) {
    if (!kartState || this.checkpoints.length === 0) return;
    if (kartState.finishTime !== null) return;

    const pos = kartState.position;
    const currentCp = kartState.currentCheckpoint;
    const nextCpIndex = currentCp % this.checkpoints.length;
    const nextCp = this.checkpoints[nextCpIndex];

    if (!nextCp) return;

    // Check if kart crossed the checkpoint plane
    const toKart = new THREE.Vector3().subVectors(pos, nextCp.position);
    const dot = toKart.dot(nextCp.normal);
    // Use 2D (XZ) distance so vertical offset (hills, airborne karts) doesn't block detection
    const xzDist = Math.hypot(toKart.x, toKart.z);
    // Use road width + generous buffer so karts slightly off-road still trigger
    const withinWidth = xzDist < ((nextCp.width || 15) + 10);

    if (dot > 0 && dot < 6 && withinWidth) {
      kartState.currentCheckpoint++;

      // Check if lap complete (crossed all checkpoints)
      if (kartState.currentCheckpoint >= this.checkpoints.length * (kartState.lapCount + 1)) {
        kartState.lapCount++;
        const now = performance.now();
        const lapTime = now - this.lastCheckpointTime;
        this.lastCheckpointTime = now;

        if (kartState.lapCount > this.totalLaps) {
          kartState.finishTime = performance.now();
          if (this.onRaceFinish) this.onRaceFinish(kartState);
        } else {
          if (this.onLapComplete) this.onLapComplete(kartState.lapCount, lapTime);
        }
      }
    }

    // Wrong way detection: check if heading toward previous checkpoint
    if (currentCp > 0) {
      const prevCpIndex = (currentCp - 1) % this.checkpoints.length;
      const prevCp = this.checkpoints[prevCpIndex];
      if (prevCp) {
        const toPrev = new THREE.Vector3().subVectors(prevCp.position, pos);
        const forward = new THREE.Vector3(-Math.sin(kartState.rotation.y), 0, -Math.cos(kartState.rotation.y));
        const wrongDot = forward.dot(toPrev.normalize());
        if (wrongDot > 0.8 && toPrev.length() < 5) {
          if (this.onWrongWay) this.onWrongWay();
        }
      }
    }
  }

  getRaceProgress(kartState) {
    if (!kartState || this.checkpoints.length === 0) return 0;
    const completedLaps = kartState.lapCount;
    const currentCp = kartState.currentCheckpoint % this.checkpoints.length;
    return (completedLaps * this.checkpoints.length) + currentCp;
  }
}
