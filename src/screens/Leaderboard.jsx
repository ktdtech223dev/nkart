import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CUPS, TRACKS, getTracksByCup } from '../constants/tracks.js';
import { PALETTE } from '../constants/palette.js';

function formatTime(ms) {
  if (!ms) return '--:--.---';
  const s = ms / 1000;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.floor(ms % 1000)).padStart(3, '0')}`;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('global');
  const [selectedTrack, setSelectedTrack] = useState(null);

  const globalEntries = [
    { rank: 1, name: 'SpeedDemon', points: 2450, wins: 85, races: 120 },
    { rank: 2, name: 'DriftKing99', points: 2100, wins: 72, races: 110 },
    { rank: 3, name: 'NKartPro', points: 1800, wins: 60, races: 95 },
  ];

  const trackEntries = [
    { rank: 1, name: 'SpeedDemon', lapTime: 28540 },
    { rank: 2, name: 'DriftKing99', lapTime: 29120 },
    { rank: 3, name: 'You', lapTime: 30450 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 32, background: PALETTE.UI_SECONDARY }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 42, fontWeight: 700 }}>LEADERBOARD</h1>
        <button className="btn-primary" onClick={() => navigate('/')}>BACK</button>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setMode('global')}
          style={{
            padding: '8px 24px', fontWeight: 700, fontSize: 16,
            background: mode === 'global' ? PALETTE.UI_PRIMARY : 'transparent',
            border: `2px solid ${mode === 'global' ? PALETTE.UI_PRIMARY : '#555'}`,
            borderRadius: 6, color: '#F5F5F5', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif",
          }}>GLOBAL</button>
        <button onClick={() => setMode('track')}
          style={{
            padding: '8px 24px', fontWeight: 700, fontSize: 16,
            background: mode === 'track' ? PALETTE.UI_PRIMARY : 'transparent',
            border: `2px solid ${mode === 'track' ? PALETTE.UI_PRIMARY : '#555'}`,
            borderRadius: 6, color: '#F5F5F5', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif",
          }}>BY TRACK</button>
      </div>

      <div style={{ display: 'flex', gap: 24, flex: 1 }}>
        {/* Track selector (track mode) */}
        {mode === 'track' && (
          <div style={{ width: 220, overflowY: 'auto' }}>
            {CUPS.filter(c => !c.locked).map(cup => (
              <div key={cup.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 4 }}>{cup.icon} {cup.name}</div>
                {getTracksByCup(cup.id).map(track => (
                  <button key={track.id} onClick={() => setSelectedTrack(track.id)}
                    style={{
                      width: '100%', padding: '6px 12px', textAlign: 'left',
                      background: selectedTrack === track.id ? 'rgba(255,77,0,0.2)' : 'transparent',
                      border: 'none', color: selectedTrack === track.id ? PALETTE.UI_PRIMARY : '#AAA',
                      cursor: 'pointer', fontSize: 14, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                    }}
                  >{track.name}</button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard table */}
        <div style={{ flex: 1 }}>
          {mode === 'global' ? (
            <>
              <div style={{ display: 'flex', padding: '8px 20px', color: '#888', fontSize: 13, fontWeight: 600 }}>
                <span style={{ width: 50 }}>#</span>
                <span style={{ flex: 1 }}>PLAYER</span>
                <span style={{ width: 100, textAlign: 'right' }}>POINTS</span>
                <span style={{ width: 80, textAlign: 'right' }}>WINS</span>
                <span style={{ width: 80, textAlign: 'right' }}>RACES</span>
              </div>
              {globalEntries.map((e, i) => (
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 * i }}
                  style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span style={{ width: 50, fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 20, color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : '#F5F5F5' }}>{e.rank}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 18 }}>{e.name}</span>
                  <span style={{ width: 100, textAlign: 'right', fontFamily: "'Space Mono', monospace", color: PALETTE.UI_ACCENT }}>{e.points}</span>
                  <span style={{ width: 80, textAlign: 'right', fontFamily: "'Space Mono', monospace", color: '#AAA' }}>{e.wins}</span>
                  <span style={{ width: 80, textAlign: 'right', fontFamily: "'Space Mono', monospace", color: '#888' }}>{e.races}</span>
                </motion.div>
              ))}
            </>
          ) : selectedTrack ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: PALETTE.UI_ACCENT }}>
                {TRACKS.find(t => t.id === selectedTrack)?.name || 'Track'}
              </div>
              <div style={{ display: 'flex', padding: '8px 20px', color: '#888', fontSize: 13, fontWeight: 600 }}>
                <span style={{ width: 50 }}>#</span>
                <span style={{ flex: 1 }}>PLAYER</span>
                <span style={{ width: 120, textAlign: 'right' }}>BEST LAP</span>
              </div>
              {trackEntries.map((e, i) => (
                <div key={i} style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ width: 50, fontWeight: 700, fontSize: 20, color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : '#F5F5F5' }}>{e.rank}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 18 }}>{e.name}</span>
                  <span style={{ width: 120, textAlign: 'right', fontFamily: "'Space Mono', monospace", color: '#AAA' }}>{formatTime(e.lapTime)}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Select a track to view lap records</div>
          )}
        </div>
      </div>
    </div>
  );
}
