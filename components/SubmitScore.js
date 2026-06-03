import { useState } from 'react';

export default function SubmitScore({ players, settings, onSubmit }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [winner, setWinner] = useState(''); // p1 id | p2 id | 'draw'
  const [sets, setSets] = useState([
    { p1: '', p2: '' },
    { p1: '', p2: '' },
    { p1: '', p2: '' },
  ]);
  const [court, setCourt] = useState('');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const player1 = players.find(p => String(p.id) === p1);
  const player2 = players.find(p => String(p.id) === p2);
  const bothSelected = p1 && p2 && p1 !== p2;

  const winPts  = settings?.win_pts  ?? 3;
  const lossPts = settings?.loss_pts ?? 0;
  const drawPts = settings?.draw_pts ?? 1;

  function handleP1Change(val) { setP1(val); setWinner(''); }
  function handleP2Change(val) { setP2(val); setWinner(''); }

  function updateSet(i, side, val) {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [side]: val } : s));
  }

  function buildScoreString() {
    return sets
      .filter(s => s.p1 !== '' && s.p2 !== '')
      .map(s => `${s.p1}-${s.p2}`)
      .join(', ') || '—';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!p1 || !p2) return setError('Please select both players.');
    if (p1 === p2)  return setError('Players must be different.');
    if (!winner)    return setError('Please select who won.');
    if (sets[0].p1 === '' || sets[0].p2 === '')
      return setError('Please enter the Set 1 score.');

    setLoading(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p1Id: Number(p1),
          p2Id: Number(p2),
          winnerId: winner === 'draw' ? 'draw' : Number(winner),
          score: buildScoreString(),
          court,
          playedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      const winnerPlayer = winner === 'draw' ? null : players.find(p => String(p.id) === winner);
      const msg = winner === 'draw'
        ? `✅ Draw recorded! Both players get +${drawPts} pts`
        : `✅ Match recorded!\n${winnerPlayer?.preferred_name || winnerPlayer?.name} wins · +${winPts} pts`;
      alert(msg);

      setP1(''); setP2(''); setWinner(''); setCourt('');
      setSets([{ p1: '', p2: '' }, { p1: '', p2: '' }, { p1: '', p2: '' }]);
      onSubmit?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 };

  function WinnerBtn({ value, label, pts }) {
    const selected = winner === value;
    return (
      <button
        type="button"
        onClick={() => setWinner(value)}
        style={{
          flex: 1, padding: '10px 6px', fontSize: 13, fontWeight: 600,
          borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
          border: selected ? '2px solid #3B6D11' : '2px solid #E5E7EB',
          background: selected ? '#EAF3DE' : 'white',
          color: selected ? '#27500A' : '#6B7280',
        }}
      >
        <div style={{ marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 400, color: selected ? '#3B6D11' : '#9CA3AF' }}>+{pts} pts</div>
      </button>
    );
  }

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Record a match
      </div>

      <form onSubmit={handleSubmit}>
        {/* Player selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Player 1</label>
            <select value={p1} onChange={e => handleP1Change(e.target.value)}>
              <option value="">Select…</option>
              {players.map(p => (
                <option key={p.id} value={p.id} disabled={String(p.id) === p2}>
                  {p.preferred_name || p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Player 2</label>
            <select value={p2} onChange={e => handleP2Change(e.target.value)}>
              <option value="">Select…</option>
              {players.map(p => (
                <option key={p.id} value={p.id} disabled={String(p.id) === p1}>
                  {p.preferred_name || p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Who won — shown once both players are selected */}
        {bothSelected && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Who won?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <WinnerBtn value={p1} label={player1?.preferred_name || player1?.name} pts={winPts} />
              <WinnerBtn value="draw" label="Draw" pts={drawPts} />
              <WinnerBtn value={p2} label={player2?.preferred_name || player2?.name} pts={winPts} />
            </div>
          </div>
        )}

        {/* Set scores */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Set scores</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sets.map((s, i) => {
              const isRequired = i === 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#6B7280', minWidth: 44 }}>
                    Set {i + 1}
                    {isRequired
                      ? <span style={{ color: '#A32D2D', marginLeft: 2 }}>*</span>
                      : <span style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>opt.</span>
                    }
                  </span>
                  <input
                    type="number" min="0" max="99"
                    value={s.p1} placeholder="0"
                    onChange={e => updateSet(i, 'p1', e.target.value)}
                    style={{
                      width: 64, textAlign: 'center', margin: 0,
                      fontSize: 22, fontWeight: 600, padding: '10px 6px',
                      border: '1.5px solid #D1D5DB', borderRadius: 10,
                      MozAppearance: 'textfield',
                    }}
                  />
                  <span style={{ fontSize: 18, color: '#9CA3AF', fontWeight: 300 }}>–</span>
                  <input
                    type="number" min="0" max="99"
                    value={s.p2} placeholder="0"
                    onChange={e => updateSet(i, 'p2', e.target.value)}
                    style={{
                      width: 64, textAlign: 'center', margin: 0,
                      fontSize: 22, fontWeight: 600, padding: '10px 6px',
                      border: '1.5px solid #D1D5DB', borderRadius: 10,
                      MozAppearance: 'textfield',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Date and court */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Date played</label>
            <input type="date" value={playedAt} onChange={e => setPlayedAt(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Court <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
            <input type="text" value={court} onChange={e => setCourt(e.target.value)} placeholder="e.g. Court 3" />
          </div>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#A32D2D' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !bothSelected || !winner}
          style={{
            background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8,
            padding: '12px 20px', fontSize: 14, fontWeight: 500, width: '100%',
            opacity: (loading || !bothSelected || !winner) ? 0.5 : 1,
            cursor: (loading || !bothSelected || !winner) ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Submitting…' : 'Submit result →'}
        </button>
      </form>
    </div>
  );
}
