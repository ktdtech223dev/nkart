/**
 * input.js — Unified input layer (keyboard + gamepad)
 * The rest of the game only calls Input methods — never checks raw keys.
 */
const Input = {
  _keys: {},
  _prevKeys: {},
  _gamepad: null,
  _gpState: {},
  _prevGpState: {},
  _deadzone: 0.15,
  _analogSteer: 0,

  init() {
    window.addEventListener('keydown', (e) => {
      this._keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => { this._keys[e.code] = false; });
    window.addEventListener('blur', () => { this._keys = {}; });
    window.addEventListener('gamepadconnected', (e) => {
      console.log(`[Input] Gamepad connected: ${e.gamepad.id}`);
    });
  },

  update() {
    this._prevKeys = { ...this._keys };
    this._prevGpState = { ...this._gpState };

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    this._gamepad = null;
    for (const gp of gamepads) {
      if (gp && gp.connected) { this._gamepad = gp; break; }
    }

    if (this._gamepad) {
      const gp = this._gamepad;
      const ax0 = Math.abs(gp.axes[0]) > this._deadzone ? gp.axes[0] : 0;
      this._analogSteer = ax0;
      this._gpState = {
        steerLeft: ax0 < -this._deadzone,
        steerRight: ax0 > this._deadzone,
        accelerate: (gp.buttons[7] && gp.buttons[7].value > 0.1) || (gp.buttons[7] && gp.buttons[7].pressed),
        brake: (gp.buttons[6] && gp.buttons[6].value > 0.1) || (gp.buttons[6] && gp.buttons[6].pressed),
        item: (gp.buttons[5] && gp.buttons[5].pressed) || (gp.buttons[0] && gp.buttons[0].pressed),
        lookBack: gp.buttons[4] && gp.buttons[4].pressed,
        pause: gp.buttons[9] && gp.buttons[9].pressed,
        confirm: gp.buttons[0] && gp.buttons[0].pressed,
        back: gp.buttons[1] && gp.buttons[1].pressed,
        dpadUp: gp.buttons[12] && gp.buttons[12].pressed,
        dpadDown: gp.buttons[13] && gp.buttons[13].pressed,
        dpadLeft: gp.buttons[14] && gp.buttons[14].pressed,
        dpadRight: gp.buttons[15] && gp.buttons[15].pressed,
      };
    } else {
      this._gpState = {};
      this._analogSteer = 0;
    }
  },

  // Continuous states
  get steerLeft() {
    return this._keys['KeyA'] || this._keys['ArrowLeft'] || this._gpState.steerLeft;
  },
  get steerRight() {
    return this._keys['KeyD'] || this._keys['ArrowRight'] || this._gpState.steerRight;
  },
  get accelerate() {
    return this._keys['KeyW'] || this._keys['ArrowUp'] || this._gpState.accelerate;
  },
  get brake() {
    return this._keys['KeyS'] || this._keys['ArrowDown'] || this._keys['ShiftLeft'] || this._keys['ShiftRight'] || this._gpState.brake;
  },
  get item() {
    return this._keys['Space'] || this._keys['KeyQ'] || this._gpState.item;
  },
  get lookBack() {
    return this._keys['Tab'] || this._gpState.lookBack;
  },

  // Pressed this frame (edge trigger)
  get pausePressed() {
    const kb = (this._keys['Escape'] && !this._prevKeys['Escape']) || (this._keys['KeyP'] && !this._prevKeys['KeyP']);
    const gp = this._gpState.pause && !this._prevGpState.pause;
    return kb || gp;
  },
  get itemPressed() {
    const kb = (this._keys['Space'] && !this._prevKeys['Space']) || (this._keys['KeyQ'] && !this._prevKeys['KeyQ']);
    const gp = this._gpState.item && !this._prevGpState.item;
    return kb || gp;
  },
  get confirmPressed() {
    const kb = this._keys['Enter'] && !this._prevKeys['Enter'];
    const gp = this._gpState.confirm && !this._prevGpState.confirm;
    return kb || gp;
  },

  /**
   * Get steering value from -1 (left) to 1 (right).
   * Gamepad: analog value. Keyboard: digital -1/0/1.
   * At high speed, analog precision matters.
   */
  getSteer(speed) {
    if (this._gamepad && Math.abs(this._analogSteer) > this._deadzone) {
      return this._analogSteer;
    }
    let val = 0;
    if (this.steerLeft) val -= 1;
    if (this.steerRight) val += 1;
    return val;
  },

  /**
   * Get throttle value 0-1 (analog trigger or digital)
   */
  getThrottle() {
    if (this._gamepad && this._gamepad.buttons[7]) {
      return Math.max(this._gamepad.buttons[7].value, this.accelerate ? 1 : 0);
    }
    return this.accelerate ? 1 : 0;
  },

  /**
   * Get brake value 0-1
   */
  getBrake() {
    if (this._gamepad && this._gamepad.buttons[6]) {
      return Math.max(this._gamepad.buttons[6].value, this.brake ? 1 : 0);
    }
    return this.brake ? 1 : 0;
  },

  /**
   * Trigger rumble on gamepad
   */
  rumble(strong = 0.3, weak = 0.7, duration = 100) {
    try {
      if (this._gamepad && this._gamepad.vibrationActuator) {
        this._gamepad.vibrationActuator.playEffect('dual-rumble', {
          duration, strongMagnitude: strong, weakMagnitude: weak,
        });
      }
    } catch (e) { /* ignore */ }
  },
};
