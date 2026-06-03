import { useState, useEffect } from 'react';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function MyStats({ currentPlayer, allPlayers }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentPlayer?.id) return;
    fetch(`/api/matches?playerId=${currentPlayer.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setMatches(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentPlayer?.id]);

  const rank = allPlayers.findIndex(p => p.id === currentPlayer?.id) + 1;
  const player = allPlayers.find(p => p.id === currentPlayer?.id);
  const wins   = player?.wins   ?? 0;
  const losses = player?.losses ?? 0;
  const points = player?.points ?? 0;

  const displayName = currentPlayer?.preferred_name || currentPlayer?.name;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#EAF3DE', borderRadius: 12, padding: '1rem', gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 13, color: '#3B6D11', marginBottom: 2 }}>Current rank</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#27500A' }}>
            {rank > 0 ? `#${rank}` : '—'}
          </div>
          <div style={{ fontSize: 13, color: '#3B6D11', marginTop: 2 }}>{displayName}</div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Points</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3B6D11' }}>{points}</div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Record</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            <span style={{ color: '#3B6D11' }}>{wins}W</span>
            <span style={{ color: '#D1D5DB', margin: '0 4px' }}>·</span>
            <span style={{ color: '#A32D2D' }}>{losses}L</span>
          </div>
        </div>
      </div>

      {/* Match history */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        My matches ({matches.length})
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9CA3AF' }}>Loading…</div>
      )}

      {!loading && matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF', fontSize: 14 }}>
          No matches yet. Submit your first result!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(m => {
          const isWinner = m.winner_id === currentPlayer?.id;
          const opponent = isWinner ? m.loser_name : m.winner_name;
          const ptsEarned = isWinner ? m.winner_pts : m.loser_pts;
          const result = isWinner ? 'W' : 'L';
          const resultColor = isWinner ? '#3B6D11' : '#A32D2D';
          const resultBg   = isWinner ? '#EAF3DE'  : '#FCEBEB';

          return (
            <div key={m.id} style={{
              background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {/* Result badge */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: resultBg, color: resultColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700,
              }}>
                {result}
              </div>

              {/* Opponent + score */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  vs {opponent}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {m.score && m.score !== '—' ? m.score : 'No score recorded'}
                  {m.court ? ` · ${m.court}` : ''}
                </div>
              </div>

              {/* Points + date */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: resultColor }}>
                  +{ptsEarned} pts
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  {formatDate(m.played_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
