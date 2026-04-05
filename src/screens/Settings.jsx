import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PALETTE } from '../constants/palette.js';

const TABS = ['CONTROLS', 'AUDIO', 'GRAPHICS'];

function Slider({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
      <span style={{ width: 140, fontSize: 15, fontWeight: 600, color: '#CCC' }}>{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: PALETTE.UI_PRIMARY }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: '#AAA', width: 40, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('CONTROLS');
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);

  // Audio
  const [masterVol, setMasterVol] = useState(80);
  const [musicVol, setMusicVol] = useState(60);
  const [sfxVol, setSfxVol] = useState(80);
  const [engineVol, setEngineVol] = useState(70);
  const [muted, setMuted] = useState(false);

  // Graphics
  const [shadowQuality, setShadowQuality] = useState('High');
  const [particleDensity, setParticleDensity] = useState('Medium');
  const [postProcessing, setPostProcessing] = useState(true);
  const [showFPS, setShowFPS] = useState(false);

  // Controls
  const [steerSens, setSteerSens] = useState(50);
  const [deadzone, setDeadzone] = useState(12);

  const CALIBRATION_STEPS = [
    'Turn wheel fully LEFT, then fully RIGHT',
    'Release wheel to CENTER',
    'Press THROTTLE fully',
    'Press BRAKE fully',
    'Testing force feedback...',
    'Calibration complete!',
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 32, background: PALETTE.UI_SECONDARY }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 42, fontWeight: 700 }}>SETTINGS</h1>
        <button className="btn-primary" onClick={() => navigate('/')}>BACK</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 24px', fontWeight: 700, fontSize: 16,
              background: tab === t ? PALETTE.UI_PRIMARY : 'transparent',
              border: `2px solid ${tab === t ? PALETTE.UI_PRIMARY : '#555'}`,
              borderRadius: 6, color: '#F5F5F5', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif",
            }}
          >{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, maxWidth: 600 }}>
        {/* Controls */}
        {tab === 'CONTROLS' && (
          <div>
            <h3 style={{ fontSize: 18, color: '#AAA', marginBottom: 16 }}>Keyboard</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 24 }}>
              {[
                ['Throttle', 'W / Up'],
                ['Brake', 'S / Down'],
                ['Steer Left', 'A / Left'],
                ['Steer Right', 'D / Right'],
                ['Drift', 'Shift / Z'],
                ['Use Item', 'Space'],
                ['Look Back', 'C'],
                ['Pause', 'Escape'],
              ].map(([action, key]) => (
                <div key={action} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(10,10,20,0.4)', borderRadius: 4 }}>
                  <span style={{ color: '#CCC', fontWeight: 600 }}>{action}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", color: '#888', fontSize: 13 }}>{key}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 18, color: '#AAA', marginBottom: 16 }}>Gamepad</h3>
            <Slider label="Steer Sensitivity" value={steerSens} onChange={setSteerSens} />
            <Slider label="Deadzone" value={deadzone} onChange={setDeadzone} max={30} />

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#CCC', fontWeight: 600 }}>G920 Detected:</span>
              <span style={{ color: '#FF4444' }}>No</span>
              <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => setShowCalibration(true)}>
                CALIBRATE G920
              </button>
            </div>
          </div>
        )}

        {/* Audio */}
        {tab === 'AUDIO' && (
          <div>
            <Slider label="Master Volume" value={masterVol} onChange={setMasterVol} />
            <Slider label="Music" value={musicVol} onChange={setMusicVol} />
            <Slider label="Sound Effects" value={sfxVol} onChange={setSfxVol} />
            <Slider label="Engine Sound" value={engineVol} onChange={setEngineVol} />
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#CCC', fontWeight: 600 }}>
                <input type="checkbox" checked={muted} onChange={e => setMuted(e.target.checked)} style={{ accentColor: PALETTE.UI_PRIMARY }} />
                Mute All
              </label>
            </div>
          </div>
        )}

        {/* Graphics */}
        {tab === 'GRAPHICS' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#CCC', fontWeight: 600, display: 'block', marginBottom: 6 }}>Shadow Quality</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Off', 'Low', 'High'].map(opt => (
                  <button key={opt} onClick={() => setShadowQuality(opt)}
                    style={{
                      padding: '6px 20px', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      background: shadowQuality === opt ? PALETTE.UI_PRIMARY : 'rgba(10,10,20,0.6)',
                      border: `1px solid ${shadowQuality === opt ? PALETTE.UI_PRIMARY : '#444'}`,
                      color: '#F5F5F5', fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#CCC', fontWeight: 600, display: 'block', marginBottom: 6 }}>Particle Density</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Low', 'Medium', 'High'].map(opt => (
                  <button key={opt} onClick={() => setParticleDensity(opt)}
                    style={{
                      padding: '6px 20px', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      background: particleDensity === opt ? PALETTE.UI_PRIMARY : 'rgba(10,10,20,0.6)',
                      border: `1px solid ${particleDensity === opt ? PALETTE.UI_PRIMARY : '#444'}`,
                      color: '#F5F5F5', fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#CCC', fontWeight: 600, marginBottom: 12 }}>
              <input type="checkbox" checked={postProcessing} onChange={e => setPostProcessing(e.target.checked)} style={{ accentColor: PALETTE.UI_PRIMARY }} />
              Post-Processing (FXAA + Cel Shader)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#CCC', fontWeight: 600 }}>
              <input type="checkbox" checked={showFPS} onChange={e => setShowFPS(e.target.checked)} style={{ accentColor: PALETTE.UI_PRIMARY }} />
              Show FPS Counter
            </label>
          </div>
        )}
      </div>

      {/* G920 Calibration Modal */}
      <AnimatePresence>
        {showCalibration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="ui-panel"
              style={{ padding: 40, width: 500, textAlign: 'center' }}
            >
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: PALETTE.UI_ACCENT }}>G920 CALIBRATION</h2>
              <div style={{ fontSize: 18, color: '#F5F5F5', marginBottom: 32, minHeight: 60 }}>
                {CALIBRATION_STEPS[calibrationStep]}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                {CALIBRATION_STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: i <= calibrationStep ? PALETTE.UI_PRIMARY : '#333',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => setShowCalibration(false)}>CANCEL</button>
                <button className="btn-primary" onClick={() => {
                  if (calibrationStep < CALIBRATION_STEPS.length - 1) setCalibrationStep(s => s + 1);
                  else { setShowCalibration(false); setCalibrationStep(0); }
                }}>
                  {calibrationStep < CALIBRATION_STEPS.length - 1 ? 'NEXT' : 'DONE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
