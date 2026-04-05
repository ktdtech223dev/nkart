import { motion } from 'framer-motion';

const COLORS = { 3: '#FF4444', 2: '#FF4444', 1: '#FF8800', 0: '#44FF44' };
const LABELS = { 3: '3', 2: '2', 1: '1', 0: 'GO!' };

export default function CountdownOverlay({ count }) {
  const color = COLORS[count] || '#FF4444';
  const label = LABELS[count] || '';

  return (
    <motion.div
      key={count}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 100,
      }}
    >
      <motion.div
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: count === 0 ? 96 : 128,
          fontWeight: 700,
          color,
          textShadow: `0 0 40px ${color}, 0 4px 12px rgba(0,0,0,0.8)`,
        }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}
