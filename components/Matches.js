export default function Matches({ matches }) {
  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  return (
    <div>
      {/* Scoring legend */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Scoring system
        </div>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 0', color: '#6B7280', fontWeight: 500, borderBottom: '1px solid #F3F4F6' }}>Result</th>
              <th style={{ textAlign: 'right', padding: '4px 0', color: '#6B7280', fontWeight: 500, borderBottom: '1px solid #F3F4F6' }}>Winner</th>
              <th style={{ textAlign: 'right', padding: '4px 0', color: '#6B7280', fontWeight: 500, borderBottom: '1px solid #F3F4F6' }}>Loser</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Straight sets (2–0)', '+3 pts', '+0 pts'],
              ['Three setter (2–1)', '+2 pts', '+1 pt'],
              ['Walkover / forfeit', '+1 pt', '−1 pt'],
            ].map(([label, w, l]) => (
              <tr key={label}>
                <td style={{ padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>{label}</td>
                <td style={{ padding: '6px 0', borderBottom: '1px solid #F3F4F6', textAlign: 'right', color: '#3B6D11', fontWeight: 500 }}>{w}</td>
                <td style={{ padding: '6px 0', borderBottom: '1px solid #F3F4F6', textAlign: 'right', color: '#A32D2D' }}>{l}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        Recent results
      </div>

      {matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF', fontSize: 14 }}>
          No matches yet. Submit your first result!
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '4px 16px' }}>
        {matches.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: i < matches.length - 1 ? '1px solid #F3F4F6' : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500 }}>{m.winner_name}</span>
              <span style={{ color: '#9CA3AF', margin: '0 6px', fontSize: 13 }}>def.</span>
              <span style={{ color: '#6B7280' }}>{m.loser_name}</span>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>{m.score}</div>
            <div>
              <span style={{ background: '#EAF3DE', color: '#3B6D11', fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 6 }}>
                +{m.winner_pts}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', minWidth: 68, textAlign: 'right' }}>
              {m.court && <span style={{ display: 'block' }}>{m.court}</span>}
              {formatDate(m.played_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
