function pad(n, len) { return String(n).padStart(len, '0'); }
function fmt(ms) {
  if (!ms || ms < 0) return '00:00.000';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms2 = Math.floor(ms % 1000);
  return `${pad(m,2)}:${pad(s,2)}.${pad(ms2,3)}`;
}

export default function RaceTimer({ raceTime = 0, lapTime = 0, bestLapTime = null }) {
  return (
    <div style={{ position: 'absolute', top: 16, right: 20, textAlign: 'right' }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 22, color: '#FFFFFF', textShadow: '1px 1px 0 #000' }}>
        {fmt(raceTime)}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 14, color: '#AAAAAA', textShadow: '1px 1px 0 #000' }}>
        LAP {fmt(lapTime)}
      </div>
      {bestLapTime && (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: '#AA44FF', textShadow: '1px 1px 0 #000' }}>
          BEST {fmt(bestLapTime)}
        </div>
      )}
    </div>
  );
}
