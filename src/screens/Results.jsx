import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { KartRenderer } from '../avatar/KartRenderer.js';
import { toon } from '../materials/ToonMaterials.js';
import { PALETTE } from '../constants/palette.js';
import { RACE_POINTS } from '../constants/items.js';

const POSITION_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function formatTime(ms) {
  if (!ms) return '--:--.---';
  const s = ms / 1000;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.floor(ms % 1000)).padStart(3, '0')}`;
}

export default function Results() {
  const navigate = useNavigate();
  const podiumRef = useRef(null);
  const [showUnlock, setShowUnlock] = useState(null);

  const results = [
    { id: 'p1', name: 'You', position: 1, time: 95420, points: 15, isLocal: true, avatarId: 'volta' },
    { id: 'p2', name: 'Player 2', position: 2, time: 97800, points: 12, avatarId: 'cinder' },
    { id: 'bot_0', name: 'Bot Alpha', position: 3, time: 99100, points: 10, isBot: true, avatarId: 'echo' },
    { id: 'bot_1', name: 'Bot Bravo', position: 4, time: 101500, points: 8, isBot: true, avatarId: 'terra' },
    { id: 'bot_2', name: 'Bot Charlie', position: 5, time: 103200, points: 6, isBot: true, avatarId: 'nova' },
    { id: 'bot_3', name: 'Bot Delta', position: 6, time: 105800, points: 4, isBot: true, avatarId: 'surge' },
    { id: 'bot_4', name: 'Bot Echo', position: 7, time: 108400, points: 2, isBot: true, avatarId: 'volta' },
    { id: 'bot_5', name: 'Bot Foxtrot', position: 8, time: 112000, points: 1, isBot: true, avatarId: 'cinder' },
  ];

  // Podium 3D scene
  useEffect(() => {
    const canvas = podiumRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(400, 250);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    const camera = new THREE.PerspectiveCamera(60, 400 / 250, 0.1, 50);
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0.8, 0);

    const dir = new THREE.DirectionalLight(0xFFF5E0, 3.0);
    dir.position.set(3, 8, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.bias = -0.001;
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x4A6FA5, 0.8));
    scene.add(new THREE.HemisphereLight(0x87CEEB, 0x8B6914, 0.5));

    // Ground
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      toon('#5DBB63')
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Podium blocks (PBR metals)
    const makePodiumMat = (color) => toon('#' + (color >>> 0).toString(16).padStart(6, '0'));
    const podiumData = [
      { pos: [0, 0, 0], h: 1.5, mat: makePodiumMat(0xffd700), kartColor: '#CC2200' },
      { pos: [-1.8, 0, 0], h: 1.0, mat: makePodiumMat(0xc0c0c0), kartColor: '#1144DD' },
      { pos: [1.8, 0, 0], h: 0.7, mat: makePodiumMat(0xcd7f32), kartColor: '#226622' },
    ];

    const kartRenderer = new KartRenderer();
    const kartGroups = [];

    podiumData.forEach(({ pos, h, mat, kartColor }) => {
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.4, h, 1.4), mat);
      block.position.set(pos[0], h / 2, pos[2]);
      block.castShadow = true;
      block.receiveShadow = true;
      scene.add(block);

      const kartGroup = kartRenderer.build(scene, { body: 'classic', wheels: 'standard', spoiler: 'low', color: kartColor });
      kartGroup.scale.setScalar(0.55);
      kartGroup.position.set(pos[0], h + 0.15, 0);
      kartGroups.push(kartGroup);
    });

    let frameId;
    let angle = 0;
    const animate = () => {
      angle += 0.004;
      kartGroups.forEach((kg, i) => {
        kg.rotation.y = angle + (i * Math.PI * 2) / 3;
      });
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(frameId); renderer.dispose(); };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, background: PALETTE.UI_SECONDARY, overflowY: 'auto' }}>
      <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ fontSize: 42, fontWeight: 700, marginBottom: 16 }}>
        RACE RESULTS
      </motion.h1>

      {/* Podium */}
      <canvas ref={podiumRef} width={400} height={250} style={{ borderRadius: 12, marginBottom: 24 }} />

      {/* Results table */}
      <div style={{ width: '100%', maxWidth: 700 }}>
        {results.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * i }}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 16,
              background: r.isLocal ? 'rgba(255,77,0,0.15)' : 'rgba(10,10,20,0.4)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 4,
            }}
          >
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, width: 50, textAlign: 'center',
              color: POSITION_COLORS[r.position] || '#F5F5F5',
            }}>{r.position}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: r.isLocal ? PALETTE.UI_PRIMARY : '#F5F5F5' }}>
                {r.name} {r.isBot && <span style={{ fontSize: 12, color: '#666' }}>(BOT)</span>}
              </div>
            </div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: '#AAA' }}>{formatTime(r.time)}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: PALETTE.UI_ACCENT, width: 40, textAlign: 'right' }}>+{r.points}</span>
          </motion.div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button className="btn-primary" onClick={() => navigate('/race')}>RACE AGAIN</button>
        <button className="btn-primary" onClick={() => navigate('/lobby')}>RETURN TO LOBBY</button>
        <button className="btn-primary" onClick={() => navigate('/')}>MAIN MENU</button>
      </div>

      {/* Unlock reveal */}
      <AnimatePresence>
        {showUnlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => setShowUnlock(null)}
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}
              style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: PALETTE.UI_ACCENT }}>NEW UNLOCK!</div>
              <div style={{ fontSize: 28, marginTop: 16, color: '#F5F5F5' }}>{showUnlock}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
