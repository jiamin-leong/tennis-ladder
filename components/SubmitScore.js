import { useState } from 'react';

export default function SubmitScore({ players, settings, ladderId, onSubmit }) {
  const isDoubles = settings?.format === 'doubles';

  // Singles: p1, p2
  // Doubles: p1a, p1b (team 1), p2a, p2b (team 2)
  const [p1a, setP1a] = useState('');
  const [p1b, setP1b] = useState('');
  const [p2a, setP2a] = useState('');
  const [p2b, setP2b] = useState('');
  const [winner, setWinner] = useState(''); // singles: player id | doubles: 'p1side' | 'p2side' | 'draw'
  const [sets, setSets] = useState([
    { p1: '', p2: '' },
    { p1: '', p2: '' },
    { p1: '', p2: '' },
  ]);
  const [court, setCourt] = useState('');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [matchType, setMatchType] = useState('full'); // 'full' | 'proset'

  const winPts  = settings?.win_pts  ?? 4;
  const lossPts = settings?.loss_pts ?? 1;
  const drawPts = settings?.draw_pts ?? 1;
  const effectiveWinPts = matchType === 'proset' ? 2 : winPts;

  // All selected IDs (to prevent double-picking)
  const selectedIds = [p1a, p1b, p2a, p2b].filter(Boolean);
  function isUnavailable(id, exceptSlot) {
    return selectedIds.filter((_, i) => ['p1a','p1b','p2a','p2b'][i] !== exceptSlot).includes(id);
  }

  function resetWinner() { setWinner(''); }

  const bothSidesReady = isDoubles
    ? p1a && p1b && p2a && p2b
    : p1a && p2a && p1a !== p2a;

  function updateSet(i, side, val) {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [side]: val } : s));
  }

  function buildScoreString() {
    return sets
      .filter(s => s.p1 !== '' && s.p2 !== '')
      .map(s => `${s.p1}-${s.p2}`)
      .join(', ') || '—';
  }

  function teamLabel(side) {
    if (!isDoubles) return null;
    const a = side === 1 ? p1a : p2a;
    const b = side === 1 ? p1b : p2b;
    const nameA = players.find(p => String(p.id) === a)?.name || '';
    const nameB = players.find(p => String(p.id) === b)?.name || '';
    return nameB ? `${nameA} & ${nameB}` : nameA;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isDoubles && (!p1a || !p1b || !p2a || !p2b)) return setError('Please select both players for each team.');
    if (!isDoubles && (!p1a || !p2a)) return setError('Please select both players.');
    if (!winner)       return setError('Please select who won.');
    if (sets[0].p1 === '' || sets[0].p2 === '')
      return setError('Please enter the Set 1 score.');
    if (matchType === 'full' && (sets[1].p1 === '' || sets[1].p2 === ''))
      return setError('Please enter the Set 2 score.');

    if (isDoubles && p1a === p2a) return setError('Players must be different.');
    if (!isDoubles && p1a === p2a) return setError('Players must be different.');

    setLoading(true);
    try {
      const body = {
        p1Id: Number(p1a),
        p2Id: Number(p2a),
        winnerId: winner,
        score: buildScoreString(),
        matchType,
        court,
        playedAt,
        ladderId: ladderId ? Number(ladderId) : undefined,
      };
      if (isDoubles) {
        body.p1PartnerId = Number(p1b);
        body.p2PartnerId = Number(p2b);
      } else {
        // Singles: winnerId is an actual player id or 'draw'
        // winner state holds the player id string or 'draw'
      }

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      const msg = winner === 'draw'
        ? `✅ Draw recorded! All players get +${drawPts} pts`
        : `✅ Match recorded! Winners get +${effectiveWinPts} pts`;
      alert(msg);

      setP1a(''); setP1b(''); setP2a(''); setP2b('');
      setWinner(''); setCourt('');
      setSets([{ p1: '', p2: '' }, { p1: '', p2: '' }, { p1: '', p2: '' }]);
      onSubmit?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 };

  function PlayerSelect({ value, onChange, label, slot }) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <select value={value} onChange={e => { onChange(e.target.value); resetWinner(); }}>
          <option value="">Select…</option>
          {players.map(p => (
            <option key={p.id} value={p.id} disabled={isUnavailable(String(p.id), slot)}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

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
        <div style={{ marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 400, color: selected ? '#3B6D11' : '#9CA3AF' }}>+{pts} pts</div>
      </button>
    );
  }

  const p1Player = players.find(p => String(p.id) === p1a);
  const p2Player = players.find(p => String(p.id) === p2a);

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Record a match
      </div>

      <form onSubmit={handleSubmit}>
        {/* Player selectors */}
        {isDoubles ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Team 1</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <PlayerSelect value={p1a} onChange={setP1a} label="Player" slot="p1a" />
              <PlayerSelect value={p1b} onChange={setP1b} label="Partner" slot="p1b" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Team 2</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <PlayerSelect value={p2a} onChange={setP2a} label="Player" slot="p2a" />
              <PlayerSelect value={p2b} onChange={setP2b} label="Partner" slot="p2b" />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <PlayerSelect value={p1a} onChange={setP1a} label="Player 1" slot="p1a" />
            <PlayerSelect value={p2a} onChange={setP2a} label="Player 2" slot="p2a" />
          </div>
        )}

        {/* Match type */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Match format</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'full',   label: 'Full sets', sub: `+${winPts} pts` },
              { value: 'proset', label: 'Pro-set',   sub: '+2 pts' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMatchType(opt.value)}
                style={{
                  flex: 1, padding: '10px 6px', fontSize: 13, fontWeight: 600,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  border: matchType === opt.value ? '2px solid #3B6D11' : '2px solid #E5E7EB',
                  background: matchType === opt.value ? '#EAF3DE' : 'white',
                  color: matchType === opt.value ? '#27500A' : '#6B7280',
                }}
              >
                <div style={{ marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: matchType === opt.value ? '#3B6D11' : '#9CA3AF' }}>{opt.sub} (winner)</div>
              </button>
            ))}
          </div>
        </div>

        {/* Who won */}
        {bothSidesReady && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Who won?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {isDoubles ? (
                <>
                  <WinnerBtn value="p1side" label={teamLabel(1) || 'Team 1'} pts={effectiveWinPts} />
                  <WinnerBtn value="draw"   label="Draw"                      pts={drawPts} />
                  <WinnerBtn value="p2side" label={teamLabel(2) || 'Team 2'} pts={effectiveWinPts} />
                </>
              ) : (
                <>
                  <WinnerBtn value={p1a}    label={p1Player?.name || 'Player 1'} pts={effectiveWinPts} />
                  <WinnerBtn value="draw"   label="Draw"                          pts={drawPts} />
                  <WinnerBtn value={p2a}    label={p2Player?.name || 'Player 2'} pts={effectiveWinPts} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Set scores */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{matchType === 'proset' ? 'Score' : 'Set scores'}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sets.map((s, i) => {
              if (matchType === 'proset' && i > 0) return null;
              return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#6B7280', minWidth: 44 }}>
                  {matchType === 'proset' ? 'Pro-set' : `Set ${i + 1}`}
                  {i === 0
                    ? <span style={{ color: '#A32D2D', marginLeft: 2 }}>*</span>
                    : i === 1 && matchType === 'full'
                      ? <span style={{ color: '#A32D2D', marginLeft: 2 }}>*</span>
                      : <span style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>opt.</span>
                  }
                </span>
                <input
                  type="number" min="0" max="99"
                  value={s.p1} placeholder="0"
                  onChange={e => updateSet(i, 'p1', e.target.value)}
                  style={{ width: 64, textAlign: 'center', margin: 0, fontSize: 22, fontWeight: 600, padding: '10px 6px', border: '1.5px solid #D1D5DB', borderRadius: 10, MozAppearance: 'textfield' }}
                />
                <span style={{ fontSize: 18, color: '#9CA3AF', fontWeight: 300 }}>–</span>
                <input
                  type="number" min="0" max="99"
                  value={s.p2} placeholder="0"
                  onChange={e => updateSet(i, 'p2', e.target.value)}
                  style={{ width: 64, textAlign: 'center', margin: 0, fontSize: 22, fontWeight: 600, padding: '10px 6px', border: '1.5px solid #D1D5DB', borderRadius: 10, MozAppearance: 'textfield' }}
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
          disabled={loading || !bothSidesReady || !winner}
          style={{
            background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8,
            padding: '12px 20px', fontSize: 14, fontWeight: 500, width: '100%',
            opacity: (loading || !bothSidesReady || !winner) ? 0.5 : 1,
            cursor: (loading || !bothSidesReady || !winner) ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Submitting…' : 'Submit result →'}
        </button>
      </form>
    </div>
  );
}
