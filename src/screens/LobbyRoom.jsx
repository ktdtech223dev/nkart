import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PALETTE } from '../constants/palette.js';

export default function LobbyRoom() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isReady, setIsReady] = useState(false);
  const [isHost] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [players, setPlayers] = useState([
    { id: 'local', name: 'You', avatarId: 'volta', isReady: false, isHost: true },
  ]);

  const emptySlots = 8 - players.length;

  const handleReady = () => {
    setIsReady(!isReady);
    setPlayers(prev => prev.map(p => p.id === 'local' ? { ...p, isReady: !isReady } : p));
  };

  const handleStart = () => {
    navigate('/race');
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev.slice(-4), { sender: 'You', text: chatInput }]);
    setChatInput('');
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 32, background: PALETTE.UI_SECONDARY }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700 }}>LOBBY</h1>
        <button className="btn-primary" onClick={() => navigate('/lobby')}>LEAVE</button>
      </div>

      <div style={{ display: 'flex', gap: 24, flex: 1 }}>
        {/* Player slots */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map(p => (
            <div key={p.id} className="ui-panel" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${PALETTE.UI_PRIMARY}, ${PALETTE.UI_ACCENT})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700,
              }}>{p.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{p.avatarId} | {p.isHost ? 'HOST' : 'Player'}</div>
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: p.isReady ? '#44FF44' : '#FF4444',
              }}>{p.isReady ? 'READY' : 'NOT READY'}</div>
            </div>
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div key={`bot_${i}`} className="ui-panel" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 16, opacity: 0.4 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
              <div style={{ flex: 1, color: '#666' }}>BOT</div>
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Track info */}
          <div className="ui-panel" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#888' }}>TRACK</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: PALETTE.UI_ACCENT }}>DESK DASH</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Dorm Cup | 3 Laps</div>
          </div>

          {/* Chat */}
          <div className="ui-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>CHAT</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ fontSize: 13 }}>
                  <span style={{ color: PALETTE.UI_PRIMARY, fontWeight: 600 }}>{msg.sender}: </span>
                  <span style={{ color: '#CCC' }}>{msg.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleChat} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Type..."
                style={{
                  flex: 1, padding: '6px 10px', background: 'rgba(10,10,20,0.6)',
                  border: '1px solid #444', borderRadius: 4, color: '#F5F5F5', fontSize: 13,
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              />
              <button type="submit" style={{
                padding: '6px 12px', background: PALETTE.UI_PRIMARY, border: 'none',
                borderRadius: 4, color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}>SEND</button>
            </form>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={handleReady} style={{ flex: 1, background: isReady ? '#44AA44' : 'transparent', borderColor: isReady ? '#44AA44' : undefined }}>
              {isReady ? 'READY!' : 'READY UP'}
            </button>
            {isHost && (
              <button className="btn-primary" onClick={handleStart} style={{ flex: 1 }}>
                START RACE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
