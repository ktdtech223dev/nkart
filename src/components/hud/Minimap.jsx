import { useRef, useEffect } from 'react';

export default function Minimap({ players = [], trackCurve = null }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, r = W/2 - 4;

    ctx.clearRect(0, 0, W, H);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    // Track outline
    if (trackCurve) {
      const pts = trackCurve.getPoints(80);
      // Compute bounds
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
      }
      const scaleX = (r*1.7) / (maxX - minX || 1);
      const scaleZ = (r*1.7) / (maxZ - minZ || 1);
      const scale = Math.min(scaleX, scaleZ);
      const toCanvas = (p) => ({
        x: cx + (p.x - (minX+maxX)/2) * scale,
        y: cy + (p.z - (minZ+maxZ)/2) * scale,
      });
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const first = toCanvas(pts[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const cp = toCanvas(pts[i]);
        ctx.lineTo(cp.x, cp.y);
      }
      ctx.closePath();
      ctx.stroke();

      // Players
      for (const p of players) {
        if (!p.position) continue;
        const cp = toCanvas(p.position);
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, p.isLocal ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.isLocal ? '#FFD700' : (p.color || '#FF4D00');
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();

    // Circle border
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  return (
    <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
      <canvas ref={canvasRef} width={110} height={110} style={{ borderRadius: '50%' }} />
    </div>
  );
}
