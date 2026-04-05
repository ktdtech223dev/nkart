import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { KartRenderer } from '../avatar/KartRenderer.js';
import { toon, getGradientMap } from '../materials/ToonMaterials.js';
import { PALETTE } from '../constants/palette.js';

export default function MainMenu() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.012);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 0, 0);

    // Toon 3-light rig
    const sun = new THREE.DirectionalLight(0xFFF5E0, 3.0);
    sun.position.set(8, 18, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    scene.add(new THREE.AmbientLight(0x4A6FA5, 0.8));
    scene.add(new THREE.HemisphereLight(0x87CEEB, 0x8B6914, 0.5));

    // Track ring (road surface)
    const ringCurve = new THREE.TorusGeometry(8, 1.4, 2, 80);
    const roadTex = (() => {
      const sz = 512;
      const cv = document.createElement('canvas');
      cv.width = sz; cv.height = sz;
      const c = cv.getContext('2d');
      c.fillStyle = '#222230';
      c.fillRect(0, 0, sz, sz);
      c.strokeStyle = 'rgba(255,220,0,0.6)';
      c.lineWidth = 8;
      c.setLineDash([40, 30]);
      c.beginPath(); c.moveTo(sz / 2, 0); c.lineTo(sz / 2, sz); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 5;
      c.setLineDash([]);
      c.beginPath(); c.moveTo(16, 0); c.lineTo(16, sz); c.stroke();
      c.beginPath(); c.moveTo(sz - 16, 0); c.lineTo(sz - 16, sz); c.stroke();
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1, 6);
      return t;
    })();
    const trackMat = toon('#2C2C2C', { map: roadTex });
    const trackMesh = new THREE.Mesh(ringCurve, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // Ground / arena floor
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = toon('#5DBB63');
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.32;
    ground.receiveShadow = true;
    scene.add(ground);

    // Decorative neon strip lights on ground
    const neonColors = ['#ff4d00', '#ffdd00', '#00aaff'];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(7 + i * 1.5, 0.03, 4, 64),
        toon(neonColors[i], { emissive: new THREE.Color(neonColors[i]), emissiveIntensity: 0.8 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.29;
      scene.add(ring);
    }

    // Full PBR kart using KartRenderer
    const kartRenderer = new KartRenderer();
    const kartGroup = kartRenderer.build(scene, { body: 'classic', wheels: 'chrome', spoiler: 'high_wing' });
    kartGroup.scale.setScalar(1.1);
    kartGroup.position.set(8, 0.18, 0);

    // Floating particles
    const particleCount = 150;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 50;
      pPos[i * 3 + 1] = Math.random() * 12;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffdd00,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    let angle = 0;
    const animate = () => {
      angle += 0.006;
      kartGroup.position.x = Math.cos(angle) * 8;
      kartGroup.position.z = Math.sin(angle) * 8;
      kartGroup.rotation.y = -angle + Math.PI / 2;
      kartRenderer.updateWheels(kartGroup, 12, 0, 0.016);

      // Slow camera orbit
      camera.position.x = Math.cos(angle * 0.25 + 1.2) * 13;
      camera.position.z = Math.sin(angle * 0.25 + 1.2) * 13;
      camera.position.y = 4.5 + Math.sin(angle * 0.15) * 1.0;
      camera.lookAt(0, 0.5, 0);

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const menuItems = [
    { label: 'QUICK RACE', path: '/race' },
    { label: 'RACE ONLINE', path: '/lobby' },
    { label: 'CUSTOMIZE', path: '/customize' },
    { label: 'LEADERBOARD', path: '/leaderboard' },
    { label: 'SETTINGS', path: '/settings' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Dark gradient overlay so text stays readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(10,10,30,0.75) 0%, rgba(10,10,30,0.2) 60%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'center',
        paddingLeft: 72, zIndex: 10,
      }}>
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: 8 }}
        >
          <div style={{
            fontSize: 11, letterSpacing: 6, color: '#FF4D00',
            fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 6,
          }}>
            SEASON 1 · DORM CUP
          </div>
          <h1 style={{
            fontSize: 88, fontWeight: 900, color: '#F5F5F5',
            textShadow: '0 0 40px rgba(255,77,0,0.5), 0 4px 16px rgba(0,0,0,0.8)',
            letterSpacing: 12, margin: 0, lineHeight: 1,
            fontFamily: "'Rajdhani', sans-serif",
          }}>
            N KART
          </h1>
          <div style={{ width: 80, height: 3, background: '#FF4D00', marginTop: 12, borderRadius: 2 }} />
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 40 }}>
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              className="btn-primary"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.45 }}
              onClick={() => navigate(item.path)}
              style={{ minWidth: 260, textAlign: 'left', paddingLeft: 24 }}
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2 }}
          style={{ fontSize: 11, color: '#888', marginTop: 40, fontFamily: "'Space Mono', monospace" }}
        >
          v0.1.0 · © N KART TEAM
        </motion.div>
      </div>
    </div>
  );
}
