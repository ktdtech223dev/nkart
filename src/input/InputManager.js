const DEFAULT_KEYBOARD_BINDINGS = {
  throttle: ['KeyW', 'ArrowUp'],
  brake: ['KeyS', 'ArrowDown'],
  steerLeft: ['KeyA', 'ArrowLeft'],
  steerRight: ['KeyD', 'ArrowRight'],
  drift: ['ShiftLeft', 'ShiftRight', 'KeyZ'],
  useItem: ['Space'],
  lookBack: ['KeyC'],
  menuConfirm: ['Enter'],
  menuBack: ['Escape'],
  menuUp: ['ArrowUp'],
  menuDown: ['ArrowDown'],
  menuLeft: ['ArrowLeft'],
  menuRight: ['ArrowRight'],
};

const GAMEPAD_DEADZONE = 0.12;
const KEYBOARD_STEER_RAMP_SPEED = 10.0;

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.state = this._emptyState();
    this.keyboardSteerValue = 0;
    this.g920State = null;
    this.bindings = { ...DEFAULT_KEYBOARD_BINDINGS };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    // Listen for G920 via Electron IPC if available
    if (window.electronAPI && window.electronAPI.onG920State) {
      window.electronAPI.onG920State((state) => {
        this.g920State = state;
      });
    }
  }

  _emptyState() {
    return {
      throttle: 0,
      brake: 0,
      steer: 0,
      drift: false,
      useItem: false,
      lookBack: false,
      menuConfirm: false,
      menuBack: false,
      menuUp: false,
      menuDown: false,
      menuLeft: false,
      menuRight: false,
    };
  }

  _onKeyDown(e) {
    this.keys.add(e.code);
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
  }

  _isPressed(action) {
    const codes = this.bindings[action];
    if (!codes) return false;
    return codes.some(code => this.keys.has(code));
  }

  _applyDeadzone(value) {
    return Math.abs(value) < GAMEPAD_DEADZONE ? 0 : value;
  }

  poll() {
    const state = this._emptyState();

    // Keyboard
    if (this._isPressed('throttle')) state.throttle = 1.0;
    if (this._isPressed('brake')) state.brake = 1.0;

    let targetSteer = 0;
    if (this._isPressed('steerLeft')) targetSteer -= 1.0;
    if (this._isPressed('steerRight')) targetSteer += 1.0;

    // Smooth keyboard steering ramp
    const rampDt = 1 / 60;
    if (targetSteer !== 0) {
      this.keyboardSteerValue += (targetSteer - this.keyboardSteerValue) * Math.min(1, KEYBOARD_STEER_RAMP_SPEED * rampDt);
    } else {
      this.keyboardSteerValue *= Math.max(0, 1 - KEYBOARD_STEER_RAMP_SPEED * rampDt);
      if (Math.abs(this.keyboardSteerValue) < 0.01) this.keyboardSteerValue = 0;
    }
    state.steer = Math.max(-1, Math.min(1, this.keyboardSteerValue));

    if (this._isPressed('drift')) state.drift = true;
    if (this._isPressed('useItem')) state.useItem = true;
    if (this._isPressed('lookBack')) state.lookBack = true;
    if (this._isPressed('menuConfirm')) state.menuConfirm = true;
    if (this._isPressed('menuBack')) state.menuBack = true;
    if (this._isPressed('menuUp')) state.menuUp = true;
    if (this._isPressed('menuDown')) state.menuDown = true;
    if (this._isPressed('menuLeft')) state.menuLeft = true;
    if (this._isPressed('menuRight')) state.menuRight = true;

    // Gamepad (Standard / Xbox layout)
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;

      const steerAxis = this._applyDeadzone(gp.axes[0] || 0);
      if (steerAxis !== 0) state.steer = steerAxis;

      const throttleAxis = gp.buttons[7] ? gp.buttons[7].value : 0;
      const brakeAxis = gp.buttons[6] ? gp.buttons[6].value : 0;
      if (throttleAxis > 0) state.throttle = Math.max(state.throttle, throttleAxis);
      if (brakeAxis > 0) state.brake = Math.max(state.brake, brakeAxis);

      if (gp.buttons[0] && gp.buttons[0].pressed) state.useItem = true;
      if (gp.buttons[1] && gp.buttons[1].pressed) state.drift = true;
      if (gp.buttons[11] && gp.buttons[11].pressed) state.lookBack = true;
      if (gp.buttons[9] && gp.buttons[9].pressed) state.menuBack = true;

      break; // Use first gamepad
    }

    // G920 override
    if (this.g920State) {
      state.steer = this.g920State.steer;
      state.throttle = this.g920State.throttle;
      state.brake = this.g920State.brake;
      if (this.g920State.drift) state.drift = true;
      if (this.g920State.useItem) state.useItem = true;
    }

    this.state = state;
    return state;
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
