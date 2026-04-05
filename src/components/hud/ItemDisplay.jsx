import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ITEM_DISPLAY } from '../../constants/items.js';

export default function ItemDisplay({ item, itemCount }) {
  const display = item ? ITEM_DISPLAY[item] : null;
  const prevItem = useRef(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (item && item !== prevItem.current) {
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    }
    prevItem.current = item;
  }, [item]);

  return (
    <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)' }}>
      <AnimatePresence mode="wait">
        {display ? (
          <motion.div
            key={item}
            initial={{ y: 24, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: pulse ? 1.1 : 1.0 }}
            exit={{ y: -24, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'rgba(0,0,0,0.75)',
              border: '3px solid #FFD700',
              borderRadius: 14,
              padding: '10px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 110,
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(255,215,0,0.4)',
            }}
          >
            <span style={{ fontSize: 38 }}>{display.icon}</span>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#FFFFFF', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                {display.name}
              </div>
              {itemCount > 1 && (
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#FFD700' }}>x{itemCount}</div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '2px solid rgba(255,215,0,0.25)',
              borderRadius: 14,
              width: 80, height: 64,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 26, color: '#555' }}>?</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
