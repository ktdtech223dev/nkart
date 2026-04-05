import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameLoop } from '../game/GameLoop.js';
import HUD from '../components/HUD.jsx';

const ALL_TRACKS = [
  'desk_dash','alien_planet','asteroid_belt','construction_chaos','corrupted_arcade',
  'crystal_cave','cursed_seas','downtown_drift','fishman_island_reef','frozen_tundra',
  'glacier_pass','grand_line_galleon','jungle_canopy','lava_flow','lunar_base',
  'marineford_ruins','mountain_pass','nightmare_dorm','rooftop_rally','sand_dune_rally',
  'skypiea_circuit','space_station_interior','storm_coast','subway_surge','the_void',
  'bathroom_blitz','circuit_board','glitch_zone','laundry_loop','neon_arcade',
  'pixel_world','snack_attack',
];

// ── AI DRIVER ────────────────────────────────────────────────────────────────
// Steers toward each next checkpoint directly.  Checkpoints are placed along
// the track by TrackBuilder, so hitting them in order guarantees lap progress.
function startAIDriver(game, trackId) {
  const makeEv = (code, type) => new KeyboardEvent(type, { code, bubbles: true });
  const press   = (code) => window.dispatchEvent(makeEv(code, 'keydown'));
  const release = (code) => window.dispatchEvent(makeEv(code, 'keyup'));

  const cps = game.checkpoints?.checkpoints || [];
  const wps = game.currentTrack?.waypointPath || [];

  let currentSteerKey = null;
  let brakingNow = false;
  let stuckTimer = 0;
  let reversingUntil = 0;
  let recoveryUntil = 0;
  let activelyReversing = false;

  press('ArrowUp');

  const steerInterval = setInterval(() => {
    const ks = game.localKartState;
    if (!ks) return;

    const now = performance.now();
    const pos = ks.position;

    // ── Stuck detection ──────────────────────────────────────────────────────
    const inRecovery = now < recoveryUntil;
    if (!inRecovery && Math.abs(ks.speed) < 0.5 && !ks.isStunned && ks.respawnTimer <= 0) {
      stuckTimer += 0.05;
    } else {
      stuckTimer = 0;
    }

    if (now < reversingUntil) {
      activelyReversing = true;
      release('ArrowUp');
      press('ArrowDown');
      if (currentSteerKey) release(currentSteerKey);
      const rev = currentSteerKey === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
      press(rev);
      currentSteerKey = rev;
      return;
    }

    // Reversal just ended — reset to forward driving
    if (activelyReversing) {
      activelyReversing = false;
      brakingNow = false;
      release('ArrowDown');
      press('ArrowUp');
    }

    if (stuckTimer > 1.5) {
      stuckTimer = 0;
      reversingUntil = now + 1500;
      recoveryUntil  = now + 4000;
      return;
    }

    // ── Pick target: next checkpoint, or fall back to waypoints ─────────────
    let tx, tz;
    if (cps.length > 0) {
      const nextCp = cps[ks.currentCheckpoint % cps.length];
      tx = nextCp.position.x;
      tz = nextCp.position.z;
    } else if (wps.length > 0) {
      const wp = wps[ks.currentCheckpoint % wps.length];
      // Support both old format (wp.x/wp.z) and new TrackSplineBuilder format (wp.position)
      tx = wp.position?.x ?? wp.x;
      tz = wp.position?.z ?? wp.z;
    } else {
      return;
    }

    const dx = tx - pos.x;
    const dz = tz - pos.z;

    // ── Heading to target ────────────────────────────────────────────────────
    const targetAngle = Math.atan2(-dx, -dz);
    let diff = targetAngle - ks.rotation.y;
    while (diff >  Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;

    // ── Brake when off-course or approaching too fast ────────────────────────
    const dist = Math.hypot(dx, dz);
    // Speed-limit based on how sharp the required turn is — generous so AI maintains pace
    const safespeed = Math.max(6, 22 - Math.abs(diff) * 12);
    const needsBrake = ks.speed > safespeed;

    if (needsBrake) {
      if (!brakingNow) { release('ArrowUp'); press('ArrowDown'); brakingNow = true; }
    } else {
      if (brakingNow)  { release('ArrowDown'); press('ArrowUp'); brakingNow = false; }
    }

    // ── Steering ─────────────────────────────────────────────────────────────
    const THRESHOLD = 0.08;
    const newSteerKey = diff < -THRESHOLD ? 'ArrowRight'
                      : diff >  THRESHOLD ? 'ArrowLeft'
                      : null;

    if (newSteerKey !== currentSteerKey) {
      if (currentSteerKey) release(currentSteerKey);
      if (newSteerKey)     press(newSteerKey);
      currentSteerKey = newSteerKey;
    }
  }, 50);

  return () => {
    clearInterval(steerInterval);
    release('ArrowUp');
    release('ArrowDown');
    if (currentSteerKey) release(currentSteerKey);
  };
}

// ── RESULT PERSISTENCE ────────────────────────────────────────────────────────
function saveResult(trackId, result) {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('nkart_test') || '{}'); } catch (_) {}
  stored[trackId] = result;
  localStorage.setItem('nkart_test', JSON.stringify(stored));

  const status = result.ok ? '✓ PASS' : '✗ FAIL';
  console.log(`TRACK_RESULT [${status}] ${trackId}:`, JSON.stringify(result));

  const allDone = ALL_TRACKS.every(t => stored[t] !== undefined);
  if (allDone) {
    const passed = ALL_TRACKS.filter(t => stored[t]?.ok);
    const failed = ALL_TRACKS.filter(t => !stored[t]?.ok);
    console.log(`\n══ ALL TRACKS DONE ══ ${passed.length}/${ALL_TRACKS.length} passed`);
    if (failed.length) console.log('FAILED:', failed.join(', '));
    else               console.log('ALL PASS!');
    console.log('FULL RESULTS:', JSON.stringify(stored, null, 2));
  }
}

function advanceTest(trackId) {
  const idx = ALL_TRACKS.indexOf(trackId);
  const next = ALL_TRACKS[idx + 1];
  if (next) {
    setTimeout(() => { window.location.href = `/race?track=${next}&autotest=1`; }, 300);
  }
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Race() {
  const canvasRef = useRef(null);
  const gameRef   = useRef(null);
  const [searchParams] = useSearchParams();
  const trackId  = searchParams.get('track') || 'desk_dash';
  const autoTest = searchParams.get('autotest') === '1';

  const [hudState, setHudState] = useState({
    position: 1, lap: 1, totalLaps: 3,
    raceTime: 0, lapTime: 0, bestLapTime: null,
    speed: 0, maxSpeed: 28,
    item: null, itemCount: 0,
    driftCharge: 0, driftLevel: 0, surfaceType: 'default',
    countdown: 3, finished: false, finishPosition: 0,
    players: [], trackCurve: null, notifications: [],
  });
  const [testInfo, setTestInfo] = useState({ x:0, y:0, z:0, speed:0, cp:0, elapsed:0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new GameLoop(canvasRef.current);
    gameRef.current = game;
    window.__gameRef = game;

    game.loadTrack(trackId).then(() => {
      game.start();

      let countVal = 3;
      setHudState(prev => ({ ...prev, countdown: 3, trackCurve: game.currentTrack?.curve || null }));

      const countdownInterval = setInterval(() => {
        countVal--;
        if (countVal < 0) {
          clearInterval(countdownInterval);
          setHudState(prev => ({ ...prev, countdown: -1 }));
        } else {
          setHudState(prev => ({ ...prev, countdown: countVal }));
        }
      }, 1000);

      const hudInterval = setInterval(() => {
        if (!game.localKartState) return;
        const ks = game.localKartState;
        setHudState(prev => ({
          ...prev,
          position: ks.racePosition,
          lap: Math.max(1, ks.lapCount + 1),
          speed: ks.speed,
          driftCharge: ks.driftCharge,
          driftLevel: ks.driftBoostLevel,
          surfaceType: ks.surfaceType,
          item: ks.itemState,
          itemCount: ks.itemCount,
          finished: ks.finishTime !== null,
          finishPosition: ks.racePosition,
          raceTime: performance.now() - (game.raceStartTime || performance.now()),
        }));
      }, 33);

      // ── AUTO-TEST ──────────────────────────────────────────────────────────
      if (autoTest) {
        // Lock camera to fixed overhead view so it doesn't chase kart into the void
        game.cameraController.disabled = true;
        game.camera.position.set(0, 120, 0);
        game.camera.lookAt(0, 0, 0);
        game.camera.fov = 75;
        game.camera.updateProjectionMatrix();
        let finished = false;

        const finish = (ok, reason) => {
          if (finished) return;
          finished = true;
          stopDriver();
          clearTimeout(timeoutHandle);
          clearInterval(lapPoll);

          const ks = game.localKartState;
          saveResult(trackId, {
            ok,
            reason,
            laps: ks?.lapCount ?? 0,
            checkpoints: ks?.currentCheckpoint ?? 0,
            speed: ks?.speed?.toFixed(1) ?? '?',
          });
          advanceTest(trackId);
        };

        // Start AI after 1.5s (let the track settle + countdown start)
        let stopDriver = () => {};
        const initTimer = setTimeout(() => {
          stopDriver = startAIDriver(game, trackId);
        }, 1500);

        // Poll for lap completion + live position (250ms cadence)
        const testStart = performance.now();
        const lapPoll = setInterval(() => {
          const ks = game.localKartState;
          if (!ks) return;
          const pos = ks.position || {};
          setTestInfo({
            x: (pos.x ?? 0).toFixed(1),
            y: (pos.y ?? 0).toFixed(1),
            z: (pos.z ?? 0).toFixed(1),
            speed: ks.speed?.toFixed(1) ?? '?',
            cp: ks.currentCheckpoint ?? 0,
            elapsed: ((performance.now() - testStart) / 1000).toFixed(0),
          });
          if (ks?.lapCount >= 1) finish(true, 'lap_completed');
        }, 250);

        // Hard timeout: 150 seconds
        const timeoutHandle = setTimeout(() => {
          finish(false, 'timeout_90s');
        }, 150000);

        return () => {
          clearTimeout(initTimer);
          clearTimeout(timeoutHandle);
          clearInterval(lapPoll);
          clearInterval(countdownInterval);
          clearInterval(hudInterval);
          if (!finished) stopDriver();
        };
      }
      // ── END AUTO-TEST ──────────────────────────────────────────────────────

      return () => {
        clearInterval(countdownInterval);
        clearInterval(hudInterval);
      };
    }).catch(err => {
      console.error('Failed to load track:', err);

      if (autoTest) {
        saveResult(trackId, { ok: false, reason: 'load_error', error: err.message });
        advanceTest(trackId);
      } else {
        game.start();
      }
    });

    return () => {
      if (game) {
        game.stop();
        gameRef.current = null;
        window.__gameRef = null;
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <HUD gameState={hudState} />
      {autoTest && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace',
          fontSize: 13, padding: '6px 16px', borderRadius: 4, zIndex: 999,
          pointerEvents: 'none', whiteSpace: 'nowrap', lineHeight: '1.6',
        }}>
          <div>AUTO-TEST [{ALL_TRACKS.indexOf(trackId)+1}/{ALL_TRACKS.length}]: {trackId}</div>
          <div>pos: ({testInfo.x}, {testInfo.y}, {testInfo.z})  spd: {testInfo.speed}  cp: {testInfo.cp}/16  t: {testInfo.elapsed}s</div>
        </div>
      )}
    </div>
  );
}
