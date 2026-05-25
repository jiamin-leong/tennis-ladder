export default function Leaderboard({ players, matchCount }) {
  const colors = ['green', 'blue', 'amber', 'red'];
  const avatarBg = {
    green: { bg: '#EAF3DE', text: '#3B6D11' },
    blue: { bg: '#E6F1FB', text: '#185FA5' },
    amber: { bg: '#FAEEDA', text: '#BA7517' },
    red: { bg: '#FCEBEB', text: '#A32D2D' },
  };

  function initials(name) {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  function rankColor(i) {
    if (i === 0) return '#BA7517';
    if (i === 1) return '#888780';
    if (i === 2) return '#854F0B';
    return '#9CA3AF';
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '1rem' }}>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Players</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{players.length}</div>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '1rem' }}>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Matches played</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{matchCount}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        Standings
      </div>

      {players.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF', fontSize: 14 }}>
          No players yet. Go to the Players tab to add your group members.
        </div>
      )}

      {players.map((player, i) => {
        const color = colors[i % colors.length];
        const { bg, text } = avatarBg[color];
        return (
          <div key={player.id} style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: rankColor(i), minWidth: 28, textAlign: 'right' }}>
              {i + 1}
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
              {initials(player.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>{player.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {player.wins}W · {player.losses}L
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#3B6D11' }}>{player.points}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>pts</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
