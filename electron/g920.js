// G920 Steering Wheel HID interface for Electron main process
// Requires: node-hid (installed in Electron main process context)

const G920_VENDOR_ID = 0x046D;
const G920_PRODUCT_ID = 0xC262;
const POLL_RATE = 60; // Hz

let device = null;
let pollInterval = null;
let calibration = {
  steerMin: 0, steerMax: 65535, steerCenter: 32767,
  throttleMin: 0, throttleMax: 255,
  brakeMin: 0, brakeMax: 255,
};

function initG920(ipcMain, mainWindow) {
  let HID;
  try {
    HID = require('node-hid');
  } catch {
    console.log('[G920] node-hid not available, G920 support disabled');
    return;
  }

  // Try to find and open G920
  try {
    const devices = HID.devices();
    const g920 = devices.find(d => d.vendorId === G920_VENDOR_ID && d.productId === G920_PRODUCT_ID);
    if (!g920) {
      console.log('[G920] Device not found');
      return;
    }

    device = new HID.HID(g920.path);
    console.log('[G920] Connected');

    // Poll at 60Hz
    pollInterval = setInterval(() => {
      try {
        const report = device.readSync();
        if (!report || report.length < 12) return;

        const state = parseReport(report);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('g920:state', state);
        }
      } catch (err) {
        // Read error, device may have disconnected
        console.log('[G920] Read error:', err.message);
        cleanup();
      }
    }, 1000 / POLL_RATE);

  } catch (err) {
    console.log('[G920] Failed to open:', err.message);
  }

  // Force feedback from renderer
  ipcMain.on('g920:ff', (event, cmd) => {
    if (!device) return;
    try {
      switch (cmd.type) {
        case 'FF_CONSTANT':
          sendFFConstant(cmd.force || 0);
          break;
        case 'FF_RUMBLE':
          sendFFRumble(cmd.magnitude || 0, cmd.duration || 0.1);
          break;
        case 'FF_SPRING':
          sendFFSpring(cmd.coefficient || 0.3);
          break;
      }
    } catch (err) {
      console.log('[G920] FF error:', err.message);
    }
  });

  // Calibration
  ipcMain.handle('g920:calibrate', async (event, step) => {
    if (!device) return { error: 'No device' };
    try {
      const report = device.readSync();
      const raw = parseRawReport(report);
      switch (step) {
        case 'steer_range':
          return { rawSteer: raw.steer };
        case 'steer_center':
          calibration.steerCenter = raw.steer;
          return { center: raw.steer };
        case 'throttle_max':
          calibration.throttleMax = raw.throttle;
          return { max: raw.throttle };
        case 'brake_max':
          calibration.brakeMax = raw.brake;
          return { max: raw.brake };
      }
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('g920:detected', () => !!device);
}

function parseReport(report) {
  const rawSteer = (report[1] << 8) | report[0];
  const rawThrottle = report[4];
  const rawBrake = report[5];
  const buttons = report[12] || 0;

  // Normalize
  const range = calibration.steerMax - calibration.steerMin;
  const steer = range > 0 ? ((rawSteer - calibration.steerCenter) / (range / 2)) : 0;
  const throttle = calibration.throttleMax > 0 ? (1 - rawThrottle / calibration.throttleMax) : 0;
  const brake = calibration.brakeMax > 0 ? (1 - rawBrake / calibration.brakeMax) : 0;

  return {
    steer: Math.max(-1, Math.min(1, steer)),
    throttle: Math.max(0, Math.min(1, throttle)),
    brake: Math.max(0, Math.min(1, brake)),
    drift: !!(buttons & 0x10),     // Left paddle
    useItem: !!(buttons & 0x20),   // Right paddle
  };
}

function parseRawReport(report) {
  return {
    steer: (report[1] << 8) | report[0],
    throttle: report[4],
    brake: report[5],
  };
}

function sendFFConstant(force) {
  if (!device) return;
  const magnitude = Math.abs(force) * 255;
  const direction = force >= 0 ? 0 : 1;
  device.write([0x11, 0x08, direction, Math.round(magnitude), 0, 0, 0]);
}

function sendFFRumble(magnitude, duration) {
  if (!device) return;
  const mag = Math.round(magnitude * 255);
  device.write([0x11, 0x01, mag, mag, Math.round(duration * 100), 0, 0]);
}

function sendFFSpring(coefficient) {
  if (!device) return;
  const coeff = Math.round(coefficient * 255);
  device.write([0x11, 0x02, coeff, coeff, 0, 0, 0]);
}

function cleanup() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  if (device) { try { device.close(); } catch {} device = null; }
}

module.exports = { initG920, cleanup };
