export default function LapCounter({ lap = 1, totalLaps = 3 }) {
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 48,
        color: '#FFFFFF',
        textShadow: '2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000',
        letterSpacing: 4,
      }}>
        LAP {Math.min(lap, totalLaps)} / {totalLaps}
      </div>
    </div>
  );
}
