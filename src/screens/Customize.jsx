import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { AvatarRenderer } from '../avatar/AvatarRenderer.js';
import { KartRenderer } from '../avatar/KartRenderer.js';
import { AVATARS, KART_BODIES, WHEELS, SPOILERS, DECALS } from '../constants/unlocks.js';
import { PALETTE } from '../constants/palette.js';

const TABS = ['AVATAR', 'KART'];
const AVATAR_SECTIONS = ['CHARACTER', 'HELMET', 'SUIT COLORS', 'GLOVES', 'ACCESSORIES'];
const KART_SECTIONS = ['BODY', 'WHEELS', 'SPOILER', 'DECAL'];

export default function Customize() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [tab, setTab] = useState('AVATAR');
  const [section, setSection] = useState('CHARACTER');
  const [selectedAvatar, setSelectedAvatar] = useState('volta');
  const [suitPrimary, setSuitPrimary] = useState('#FF4D00');
  const [suitAccent, setSuitAccent] = useState('#FFFFFF');
  const [selectedBody, setSelectedBody] = useState('classic');
  const [selectedWheels, setSelectedWheels] = useState('standard');
  const [selectedSpoiler, setSelectedSpoiler] = useState('none');
  const [selectedDecal, setSelectedDecal] = useState('clean');
  const [unlocks] = useState(new Set(['volta','cinder','echo','terra','nova','surge','classic','muscle','standard','slick','none','standard_wing','clean','lightning','flame']));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(400, 500);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d20);
    const camera = new THREE.PerspectiveCamera(50, 400 / 500, 0.1, 100);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0.5, 0);

    const hemi = new THREE.HemisphereLight(0x8899cc, 0x223344, 0.7);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffd580, 2.0);
    dir.position.set(3, 5, 3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.bias = -0.001;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x4466aa, 0.4);
    fill.position.set(-3, 3, -2);
    scene.add(fill);

    const kartRenderer = new KartRenderer();
    const avatarRenderer = new AvatarRenderer();

    const kartGroup = kartRenderer.build(scene, { body: selectedBody, wheels: selectedWheels, spoiler: selectedSpoiler, color: suitPrimary });
    const avatar = avatarRenderer.build(selectedAvatar, { suitPrimary, suitAccent });
    avatar.position.y = 0.3;
    kartGroup.add(avatar);

    sceneRef.current = { scene, camera, renderer, kartGroup, avatar };

    let angle = 0;
    const animate = () => {
      angle += 0.005;
      kartGroup.rotation.y = angle;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => renderer.dispose();
  }, [selectedAvatar, selectedBody, selectedWheels, selectedSpoiler, suitPrimary, suitAccent]);

  const renderGrid = (items, selectedId, onSelect, typeKey) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
      {items.map(item => {
        const isLocked = item.locked && !unlocks.has(item.id);
        const isSelected = item.id === selectedId;
        return (
          <button
            key={item.id}
            onClick={() => !isLocked && onSelect(item.id)}
            style={{
              padding: 12, background: isSelected ? 'rgba(255,77,0,0.3)' : 'rgba(10,10,20,0.6)',
              border: `2px solid ${isSelected ? '#FF4D00' : isLocked ? '#333' : '#555'}`,
              borderRadius: 8, color: isLocked ? '#555' : '#F5F5F5', cursor: isLocked ? 'not-allowed' : 'pointer',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, textAlign: 'center',
              opacity: isLocked ? 0.5 : 1, transition: 'all 0.15s',
            }}
          >
            {isLocked && <span style={{ fontSize: 16 }}>🔒 </span>}
            {item.name}
          </button>
        );
      })}
    </div>
  );

  const sections = tab === 'AVATAR' ? AVATAR_SECTIONS : KART_SECTIONS;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: PALETTE.UI_SECONDARY }}>
      {/* 3D Preview */}
      <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <canvas ref={canvasRef} width={400} height={500} style={{ borderRadius: 12, border: '1px solid rgba(255,77,0,0.3)' }} />
      </div>

      {/* Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#F5F5F5' }}>CUSTOMIZE</h1>
          <button className="btn-primary" onClick={() => navigate('/')}>BACK</button>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setSection(t === 'AVATAR' ? 'CHARACTER' : 'BODY'); }}
              style={{
                padding: '8px 24px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16,
                background: tab === t ? '#FF4D00' : 'transparent', color: '#F5F5F5',
                border: `2px solid ${tab === t ? '#FF4D00' : '#555'}`, borderRadius: 6, cursor: 'pointer',
              }}
            >{t}</button>
          ))}
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sections.map(s => (
            <button key={s} onClick={() => setSection(s)}
              style={{
                padding: '4px 14px', fontSize: 13, fontWeight: 600,
                background: section === s ? 'rgba(255,77,0,0.2)' : 'transparent',
                color: section === s ? '#FF4D00' : '#888', border: 'none', cursor: 'pointer',
                borderBottom: section === s ? '2px solid #FF4D00' : '2px solid transparent',
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >{s}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {section === 'CHARACTER' && renderGrid(AVATARS, selectedAvatar, setSelectedAvatar, 'avatar')}
          {section === 'SUIT COLORS' && (
            <div style={{ display: 'flex', gap: 24 }}>
              <label style={{ color: '#AAA' }}>Primary: <input type="color" value={suitPrimary} onChange={e => setSuitPrimary(e.target.value)} /></label>
              <label style={{ color: '#AAA' }}>Accent: <input type="color" value={suitAccent} onChange={e => setSuitAccent(e.target.value)} /></label>
            </div>
          )}
          {section === 'BODY' && renderGrid(KART_BODIES, selectedBody, setSelectedBody, 'body')}
          {section === 'WHEELS' && renderGrid(WHEELS, selectedWheels, setSelectedWheels, 'wheels')}
          {section === 'SPOILER' && renderGrid(SPOILERS, selectedSpoiler, setSelectedSpoiler, 'spoiler')}
          {section === 'DECAL' && renderGrid(DECALS, selectedDecal, setSelectedDecal, 'decal')}
          {(section === 'HELMET' || section === 'GLOVES' || section === 'ACCESSORIES') && (
            <div style={{ color: '#888', padding: 20 }}>Variant selection — coming with cosmetic assets</div>
          )}
        </div>

        <button className="btn-primary" style={{ alignSelf: 'flex-end' }}>SAVE</button>
      </div>
    </div>
  );
}
