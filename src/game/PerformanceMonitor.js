export class PerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.maxSamples = 120;
    this.lastTime = 0;
    this.fps = 60;
    this.avgFrameTime = 16.67;
    this.qualityLevel = 'high'; // high, medium, low
    this.adaptiveEnabled = true;
    this.dropCount = 0;
  }

  beginFrame() {
    this.lastTime = performance.now();
  }

  endFrame() {
    const now = performance.now();
    const frameTime = now - this.lastTime;
    this.frameTimes.push(frameTime);

    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }

    this.avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.fps = 1000 / this.avgFrameTime;

    // Adaptive quality
    if (this.adaptiveEnabled) {
      this._adaptQuality();
    }
  }

  _adaptQuality() {
    if (this.fps < 45 && this.qualityLevel !== 'low') {
      this.dropCount++;
      if (this.dropCount > 30) {
        this.qualityLevel = this.qualityLevel === 'high' ? 'medium' : 'low';
        this.dropCount = 0;
      }
    } else if (this.fps > 80 && this.qualityLevel !== 'high') {
      this.dropCount++;
      if (this.dropCount > 120) {
        this.qualityLevel = this.qualityLevel === 'low' ? 'medium' : 'high';
        this.dropCount = 0;
      }
    } else {
      this.dropCount = 0;
    }
  }

  getSettings() {
    switch (this.qualityLevel) {
      case 'low':
        return {
          shadowMapSize: 512,
          particleBudget: 200,
          postProcessing: false,
          pixelRatio: 1,
          maxDrawCalls: 100,
        };
      case 'medium':
        return {
          shadowMapSize: 1024,
          particleBudget: 500,
          postProcessing: true,
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          maxDrawCalls: 200,
        };
      case 'high':
      default:
        return {
          shadowMapSize: 2048,
          particleBudget: 1000,
          postProcessing: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          maxDrawCalls: 500,
        };
    }
  }
}
