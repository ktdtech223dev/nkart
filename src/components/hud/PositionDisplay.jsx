export default function PositionDisplay({ position = 1 }) {
  const suffix = position === 1 ? 'ST' : position === 2 ? 'ND' : position === 3 ? 'RD' : 'TH';
  const color = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : position === 3 ? '#CD7F32' : '#F5F5F5';

  return (
    <div style={{ position: 'absolute', top: 16, left: 20 }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 96,
        lineHeight: 1,
        color,
        textShadow: '3px 3px 0px #000000, -1px -1px 0px #000000',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}>
        <span>{position}</span>
        <span style={{ fontSize: 48, marginTop: 8 }}>{suffix}</span>
      </div>
    </div>
  );
}
