export default function Matches({ matches, settings, isAdmin, onMatchDeleted }) {
  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  const winPts  = settings?.win_pts  ?? '—';
  const lossPts = settings?.loss_pts ?? '—';
  const drawPts = settings?.draw_pts ?? '—';

  async function deleteMatch(matchId) {
    if (!confirm('Delete this match? Points and records will be reversed.')) return;
    const res = await fetch('/api/matches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    });
    if (res.ok) onMatchDeleted?.();
  }

  return (
    <div>
      {/* Points legend */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Points per result
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Win',  pts: winPts,  color: '#3B6D11', bg: '#EAF3DE' },
            { label: 'Draw', pts: drawPts, color: '#BA7517', bg: '#FAEEDA' },
            { label: 'Loss', pts: lossPts, color: '#A32D2D', bg: '#FCEBEB' },
          ].map(({ label, pts, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{pts}</div>
              <div style={{ fontSize: 12, color, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 500 }}>
                {m.winner_name}{m.winner_partner_name ? ` & ${m.winner_partner_name}` : ''}
              </span>
              <span style={{ color: '#9CA3AF', margin: '0 6px', fontSize: 13 }}>def.</span>
              <span style={{ color: '#6B7280' }}>
                {m.loser_name}{m.loser_partner_name ? ` & ${m.loser_partner_name}` : ''}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{m.score}</div>
            <div style={{ flexShrink: 0 }}>
              <span style={{ background: '#EAF3DE', color: '#3B6D11', fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 6 }}>
                +{m.winner_pts}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
              {m.court && <span style={{ display: 'block' }}>{m.court}</span>}
              {formatDate(m.played_at)}
            </div>
            {isAdmin && (
              <button
                onClick={() => deleteMatch(m.id)}
                style={{
                  flexShrink: 0, background: '#FCEBEB', color: '#A32D2D',
                  border: '1px solid #FECACA', borderRadius: 6,
                  padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
