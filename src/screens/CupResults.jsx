import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PALETTE } from '../constants/palette.js';

const TROPHY_ICONS = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const TROPHY_COLORS = { gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' };

export default function CupResults() {
  const navigate = useNavigate();

  // Sample cup results
  const cupName = 'DORM CUP';
  const standings = [
    { id: 'p1', name: 'You', points: [15, 12, 15, 10], total: 52, isLocal: true },
    { id: 'bot_0', name: 'Bot Alpha', points: [12, 15, 10, 15], total: 52, isBot: true },
    { id: 'p2', name: 'Player 2', points: [10, 10, 12, 12], total: 44 },
    { id: 'bot_1', name: 'Bot Bravo', points: [8, 8, 8, 8], total: 32, isBot: true },
    { id: 'bot_2', name: 'Bot Charlie', points: [6, 6, 6, 6], total: 24, isBot: true },
    { id: 'bot_3', name: 'Bot Delta', points: [4, 4, 4, 4], total: 16, isBot: true },
    { id: 'bot_4', name: 'Bot Echo', points: [2, 2, 2, 2], total: 8, isBot: true },
    { id: 'bot_5', name: 'Bot Foxtrot', points: [1, 1, 1, 1], total: 4, isBot: true },
  ].sort((a, b) => b.total - a.total);

  const getTrophy = (idx) => idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, background: PALETTE.UI_SECONDARY, overflowY: 'auto' }}>
      <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ fontSize: 48, fontWeight: 700, color: PALETTE.UI_ACCENT }}>
        {cupName}
      </motion.h1>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ fontSize: 24, marginBottom: 32, color: '#F5F5F5' }}>
        {standings[0].name} WINS THE {cupName}!
      </motion.div>

      {/* Standings */}
      <div style={{ width: '100%', maxWidth: 800 }}>
        {/* Header */}
        <div style={{ display: 'flex', padding: '8px 20px', color: '#888', fontSize: 13, fontWeight: 600 }}>
          <span style={{ width: 40 }}>#</span>
          <span style={{ flex: 1 }}>RACER</span>
          <span style={{ width: 60, textAlign: 'center' }}>R1</span>
          <span style={{ width: 60, textAlign: 'center' }}>R2</span>
          <span style={{ width: 60, textAlign: 'center' }}>R3</span>
          <span style={{ width: 60, textAlign: 'center' }}>R4</span>
          <span style={{ width: 80, textAlign: 'right' }}>TOTAL</span>
        </div>

        {standings.map((s, idx) => {
          const trophy = getTrophy(idx);
          return (
            <motion.div
              key={s.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx }}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 20px',
                background: s.isLocal ? 'rgba(255,77,0,0.15)' : 'rgba(10,10,20,0.3)',
                borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: 4,
              }}
            >
              <span style={{ width: 40, fontSize: 20, fontWeight: 700, color: trophy ? TROPHY_COLORS[trophy] : '#F5F5F5' }}>
                {trophy ? TROPHY_ICONS[trophy] : idx + 1}
              </span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 18, color: s.isLocal ? PALETTE.UI_PRIMARY : '#F5F5F5' }}>
                {s.name} {s.isBot && <span style={{ fontSize: 11, color: '#666' }}>(BOT)</span>}
              </span>
              {s.points.map((pts, pi) => (
                <span key={pi} style={{ width: 60, textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: 15, color: '#AAA' }}>
                  {pts}
                </span>
              ))}
              <span style={{ width: 80, textAlign: 'right', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: PALETTE.UI_ACCENT }}>
                {s.total}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button className="btn-primary" onClick={() => navigate('/lobby')}>RETURN TO LOBBY</button>
        <button className="btn-primary" onClick={() => navigate('/')}>MAIN MENU</button>
      </div>
    </div>
  );
}
