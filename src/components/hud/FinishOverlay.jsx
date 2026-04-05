import { motion } from 'framer-motion';

const POSITION_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function FinishOverlay({ position }) {
  const color = POSITION_COLORS[position] || '#F5F5F5';
  const suffix = position === 1 ? 'ST' : position === 2 ? 'ND' : position === 3 ? 'RD' : 'TH';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 90,
      }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 48, fontWeight: 700, color: '#F5F5F5', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
      >
        FINISH!
      </motion.div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 96, fontWeight: 700, color, textShadow: `0 0 30px ${color}` }}>
          {position}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 36, color }}>
          {suffix}
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ fontSize: 18, color: '#AAA', marginTop: 24 }}
      >
        Waiting for other racers...
      </motion.div>
    </motion.div>
  );
}
