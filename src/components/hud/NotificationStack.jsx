import { AnimatePresence, motion } from 'framer-motion';

export default function NotificationStack({ notifications = [] }) {
  const visible = notifications.slice(-3);

  return (
    <div style={{
      position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <AnimatePresence>
        {visible.map((notif, i) => (
          <motion.div
            key={notif.id || i}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'rgba(10,10,20,0.85)',
              border: '1px solid rgba(255,77,0,0.6)',
              borderRadius: 6,
              padding: '6px 18px',
              fontSize: 16,
              fontWeight: 600,
              color: notif.color || '#F5F5F5',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            {notif.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
