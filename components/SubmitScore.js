import { useState } from 'react';

export default function SubmitScore({ players, onSubmit }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [sets, setSets] = useState([
    { p1: 6, p2: 3 },
    { p1: 6, p2: 4 },
    { p1: null, p2: null },
  ]);
  const [court, setCourt] = useState('');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeSets = sets[0].p1 !== null && sets[1].p1 !== null;

  // Work out who wins based on current set inputs
  function preview() {
    if (!p1 || !p2) return null;
    let s1 = 0, s2 = 0;
    for (const s of sets) {
      if (s.p1 === null || s.p2 === null) continue;
      if (s.p1 > s.p2) s1++; else if (s.p2 > s.p1) s2++;
    }
    if (s1 < 2 && s2 < 2) return null;
    const winnerName = s1 > s2 ? players.find(p => String(p.id) === p1)?.name : players.find(p => String(p.id) === p2)?.name;
    const setsPlayed = s1 + s2;
    const winPts = setsPlayed === 2 ? 3 : 2;
    const losPts = setsPlayed === 3 ? 1 : 0;
    return { winnerName, winPts, losPts };
  }

  function updateSet(i, side, val) {
    const next = sets.map((s, idx) => idx === i ? { ...s, [side]: val === '' ? null : Number(val) } : s);
    setSets(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!p1 || !p2) return setError('Please select both players.');
    if (p1 === p2) return setError('Players must be different.');

    setLoading(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p1Id: Number(p1), p2Id: Number(p2), sets, court, playedAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      const winner = players.find(p => p.id === data.winnerId);
      alert(`✅ Match recorded!\n${winner?.name} wins (${data.scoreString})\n+${data.winnerPts} pts`);

      // Reset form
      setP1(''); setP2(''); setCourt('');
      setSets([{ p1: 6, p2: 3 }, { p1: 6, p2: 4 }, { p1: null, p2: null }]);
      onSubmit?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const pre = preview();

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Record a match
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Player 1</label>
            <select value={p1} onChange={e => setP1(e.target.value)}>
              <option value="">Select player…</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Player 2</label>
            <select value={p2} onChange={e => setP2(e.target.value)}>
              <option value="">Select player…</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 6 }}>Set scores</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {sets.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
              <span>Set {i + 1}:</span>
              <input
                type="number" min="0" max="7" style={{ width: 48, textAlign: 'center', opacity: i === 2 && s.p1 === null ? 0.5 : 1 }}
                value={s.p1 ?? ''} placeholder="–"
                onChange={e => updateSet(i, 'p1', e.target.value)}
              />
              <span>–</span>
              <input
                type="number" min="0" max="7" style={{ width: 48, textAlign: 'center', opacity: i === 2 && s.p2 === null ? 0.5 : 1 }}
                value={s.p2 ?? ''} placeholder="–"
                onChange={e => updateSet(i, 'p2', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Date played</label>
            <input type="date" value={playedAt} onChange={e => setPlayedAt(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Court (optional)</label>
            <input type="text" value={court} onChange={e => setCourt(e.target.value)} placeholder="e.g. Court 3" />
          </div>
        </div>

        {pre && (
          <div style={{ background: '#EAF3DE', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#27500A' }}>
            🎾 <strong>{pre.winnerName}</strong> wins · +{pre.winPts} pts
            {pre.losPts > 0 && ` · loser gets +${pre.losPts} pt`}
          </div>
        )}

        {error && (
          <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#A32D2D' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, width: '100%', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Submitting…' : 'Submit result →'}
        </button>
      </form>
    </div>
  );
}
