export default function SpeedBar({ speed = 0, maxSpeed = 28, driftCharge = 0, driftLevel = 0, surfaceType = 'default' }) {
  const pct = Math.min(100, (speed / maxSpeed) * 100);
  const barColor = pct > 80 ? '#FF2200' : pct > 50 ? '#FFAA00' : '#44DD44';
  const driftColors = ['#4488FF', '#FF8800', '#AA44FF'];
  const driftColor = driftLevel > 0 ? driftColors[Math.min(driftLevel-1, 2)] : '#4488FF';
  const driftPct = Math.min(100, driftCharge);

  const surfaceLabels = {
    ice: 'ICE', sand: 'SAND', mud: 'MUD', gravel: 'GRAVEL',
    snow: 'SNOW', carpet: 'CARPET', wet: 'WET', moon_dust: 'DUST',
  };
  const surfaceLabel = surfaceLabels[surfaceType] || '';

  return (
    <div style={{ position: 'absolute', bottom: 24, left: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* Speed bar */}
      <div style={{
        width: 18, height: 130,
        background: 'rgba(0,0,0,0.7)',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', bottom: 0, width: '100%',
          height: `${pct}%`,
          background: barColor,
          transition: 'height 0.05s linear, background 0.15s',
          boxShadow: `0 0 8px ${barColor}`,
        }} />
      </div>
      {/* Speed number */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 20, color: '#FFFFFF',
        textShadow: '1px 1px 0 #000',
      }}>
        {Math.round(speed)}
      </div>
      {/* Drift charge */}
      {driftCharge > 0 && (
        <div style={{
          width: 18, height: 60,
          background: 'rgba(0,0,0,0.7)',
          border: `2px solid ${driftColor}`,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', bottom: 0, width: '100%',
            height: `${driftPct}%`,
            background: driftColor,
            boxShadow: `0 0 6px ${driftColor}`,
          }} />
        </div>
      )}
      {surfaceLabel && (
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#FFDD00', textShadow: '1px 1px 0 #000' }}>
          {surfaceLabel}
        </div>
      )}
    </div>
  );
}
