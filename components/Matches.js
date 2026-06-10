import { useState } from 'react';

export default function Matches({ matches, settings, isAdmin, creatorId, onMatchDeleted }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', court: '', playedAt: '', newWinnerSide: 'same' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  const winPts  = settings?.win_pts  ?? '—';
  const lossPts = settings?.loss_pts ?? '—';
  const drawPts = settings?.draw_pts ?? '—';

  function startEdit(m) {
    setEditingId(m.id);
    setEditForm({
      score: m.score === 'Draw' || m.score === '—' ? '' : m.score,
      court: m.court || '',
      playedAt: m.played_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      newWinnerSide: m.score === 'Draw' ? 'draw' : 'same',
    });
    setEditError('');
  }

  async function saveEdit(m) {
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch('/api/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: m.id,
          requesterId: creatorId,
          newWinnerSide: editForm.newWinnerSide,
          score: editForm.score.trim() || (editForm.newWinnerSide === 'draw' ? 'Draw' : '—'),
          court: editForm.court,
          playedAt: editForm.playedAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setEditingId(null);
      onMatchDeleted?.();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMatch(matchId) {
    if (!confirm('Delete this match? Points and records will be reversed.')) return;
    const res = await fetch('/api/matches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, requesterId: creatorId }),
    });
    if (res.ok) onMatchDeleted?.();
  }

  const labelStyle = { display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 3 };

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

      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {matches.map((m, i) => {
          const sideALabel = m.winner_name + (m.winner_partner_name ? ` & ${m.winner_partner_name}` : '');
          const sideBLabel = m.loser_name  + (m.loser_partner_name  ? ` & ${m.loser_partner_name}`  : '');
          const isEditing = editingId === m.id;

          return (
            <div key={m.id} style={{ borderBottom: i < matches.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              {/* Match row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 500 }}>{sideALabel}</span>
                  <span style={{ color: '#9CA3AF', margin: '0 6px', fontSize: 13 }}>def.</span>
                  <span style={{ color: '#6B7280' }}>{sideBLabel}</span>
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
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(m)}
                      style={{
                        background: isEditing ? '#F3F4F6' : 'white', color: isEditing ? '#6B7280' : '#3B6D11',
                        border: `1px solid ${isEditing ? '#D1D5DB' : '#A8D57A'}`, borderRadius: 6,
                        padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      onClick={() => deleteMatch(m.id)}
                      style={{
                        background: '#FCEBEB', color: '#A32D2D',
                        border: '1px solid #FECACA', borderRadius: 6,
                        padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6', padding: '14px 16px' }}>
                  {/* Who won */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Who won?</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[
                        { value: 'same', label: sideALabel },
                        { value: 'draw', label: 'Draw' },
                        { value: 'swap', label: sideBLabel },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditForm(f => ({ ...f, newWinnerSide: opt.value }))}
                          style={{
                            flex: 1, padding: '7px 4px', fontSize: 12, fontWeight: 600,
                            borderRadius: 8, cursor: 'pointer',
                            border: editForm.newWinnerSide === opt.value ? '2px solid #3B6D11' : '2px solid #E5E7EB',
                            background: editForm.newWinnerSide === opt.value ? '#EAF3DE' : 'white',
                            color: editForm.newWinnerSide === opt.value ? '#27500A' : '#6B7280',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Score</label>
                      <input
                        type="text"
                        value={editForm.score}
                        onChange={e => setEditForm(f => ({ ...f, score: e.target.value }))}
                        placeholder="e.g. 6-3, 7-5"
                        style={{ margin: 0, fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Date played</label>
                      <input
                        type="date"
                        value={editForm.playedAt}
                        onChange={e => setEditForm(f => ({ ...f, playedAt: e.target.value }))}
                        style={{ margin: 0, fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Court <span style={{ color: '#9CA3AF' }}>(opt.)</span></label>
                      <input
                        type="text"
                        value={editForm.court}
                        onChange={e => setEditForm(f => ({ ...f, court: e.target.value }))}
                        placeholder="e.g. Court 3"
                        style={{ margin: 0, fontSize: 13 }}
                      />
                    </div>
                  </div>

                  {editError && (
                    <div style={{ fontSize: 12, color: '#A32D2D', background: '#FCEBEB', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>
                      {editError}
                    </div>
                  )}

                  <button
                    onClick={() => saveEdit(m)}
                    disabled={saving}
                    style={{
                      background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8,
                      padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
