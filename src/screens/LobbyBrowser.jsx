import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CUPS, TRACKS, getTracksByCup } from '../constants/tracks.js';
import { PALETTE } from '../constants/palette.js';

export default function LobbyBrowser() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedCup, setSelectedCup] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [cupMode, setCupMode] = useState(false);

  const handleCreate = () => {
    const trackId = cupMode ? getTracksByCup(selectedCup)[0]?.id : selectedTrack;
    if (!trackId && !selectedCup) return;
    // Would emit lobby:create via NetworkManager
    navigate('/lobby/new');
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 32, background: PALETTE.UI_SECONDARY }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 42, fontWeight: 700 }}>RACE ONLINE</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>CREATE ROOM</button>
          <button className="btn-primary" onClick={() => navigate('/')}>BACK</button>
        </div>
      </div>

      {/* Room list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rooms.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', padding: 48, fontSize: 18 }}>
            No rooms available. Create one to start racing!
          </div>
        )}
        {rooms.map(room => (
          <div key={room.id} className="ui-panel" style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5' }}>{room.name}</div>
              <div style={{ fontSize: 14, color: '#888' }}>Host: {room.host} | {room.cupMode ? 'Cup Mode' : room.trackId}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: PALETTE.UI_ACCENT }}>{room.playerCount}/8</div>
            <div style={{
              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 4,
              background: room.status === 'WAITING' ? 'rgba(68,170,68,0.3)' : 'rgba(255,77,0,0.3)',
              color: room.status === 'WAITING' ? '#44AA44' : '#FF4D00',
            }}>{room.status}</div>
            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 14 }}
              onClick={() => navigate(`/lobby/${room.id}`)}
              disabled={room.status !== 'WAITING'}
            >JOIN</button>
          </div>
        ))}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="ui-panel"
              style={{ padding: 32, width: 600, maxHeight: '80vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, color: '#F5F5F5' }}>CREATE ROOM</h2>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 4 }}>Room Name</label>
                <input
                  value={roomName} onChange={e => setRoomName(e.target.value)}
                  placeholder="My Race Room"
                  style={{
                    width: '100%', padding: '10px 16px', background: 'rgba(10,10,20,0.6)',
                    border: '1px solid #555', borderRadius: 6, color: '#F5F5F5', fontSize: 16,
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#F5F5F5' }}>
                  <input type="checkbox" checked={cupMode} onChange={e => setCupMode(e.target.checked)} />
                  Cup Mode (4 races)
                </label>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 8 }}>
                  {cupMode ? 'Select Cup' : 'Select Track'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {CUPS.filter(c => !c.locked).map(cup => (
                    <button key={cup.id} onClick={() => { setSelectedCup(cup.id); if (!cupMode) setSelectedTrack(null); }}
                      style={{
                        padding: 12, background: selectedCup === cup.id ? 'rgba(255,77,0,0.3)' : 'rgba(10,10,20,0.6)',
                        border: `2px solid ${selectedCup === cup.id ? '#FF4D00' : '#444'}`,
                        borderRadius: 8, color: '#F5F5F5', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      <div style={{ fontSize: 24 }}>{cup.icon}</div>
                      {cup.name}
                    </button>
                  ))}
                </div>
              </div>

              {!cupMode && selectedCup && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {getTracksByCup(selectedCup).map(track => (
                      <button key={track.id} onClick={() => setSelectedTrack(track.id)}
                        style={{
                          padding: 10, background: selectedTrack === track.id ? 'rgba(255,77,0,0.3)' : 'rgba(10,10,20,0.4)',
                          border: `1px solid ${selectedTrack === track.id ? '#FF4D00' : '#333'}`,
                          borderRadius: 6, color: '#F5F5F5', cursor: 'pointer', fontSize: 14,
                          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                        }}
                      >{track.name}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => setShowCreate(false)} style={{ opacity: 0.6 }}>CANCEL</button>
                <button className="btn-primary" onClick={handleCreate}>CREATE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
