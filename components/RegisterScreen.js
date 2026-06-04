import { useState, useEffect } from 'react';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function ladderStatus(ladder) {
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(ladder.end_date);
  const start = new Date(ladder.start_date);
  if (end < today) return 'past';
  if (start > today) return 'upcoming';
  return 'active';
}

export default function RegisterScreen({ phone, onSuccess, onBack }) {
  const [form, setForm] = useState({ name: '', preferred_name: '', gender: '', preferred_locations: '' });
  const [ladders, setLadders] = useState([]);
  const [selectedLadders, setSelectedLadders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/ladders')
      .then(r => r.ok ? r.json() : [])
      .then(all => setLadders(all.filter(l => ladderStatus(l) !== 'past')))
      .catch(() => {});
  }, []);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function toggleLadder(id) {
    setSelectedLadders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Full name is required.');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...form, ladderIds: selectedLadders }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      onSuccess(data.player);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 };
  const fieldStyle = { marginBottom: 16 };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#27500A' }}>Create your profile</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Your details will be reviewed before you can join</div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tan Wei Jie" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Preferred name <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(shown on leaderboard)</span></label>
              <input type="text" value={form.preferred_name} onChange={e => set('preferred_name', e.target.value)} placeholder="e.g. Wei Jie" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Gender</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select…</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Preferred courts / locations</label>
              <input type="text" value={form.preferred_locations} onChange={e => set('preferred_locations', e.target.value)} placeholder="e.g. Bishan, Kallang" />
            </div>

            {ladders.length > 0 && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Ladders you'd like to join <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ladders.map(l => {
                    const checked = selectedLadders.includes(l.id);
                    return (
                      <label
                        key={l.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                          border: checked ? '1.5px solid #3B6D11' : '1.5px solid #E5E7EB',
                          background: checked ? '#EAF3DE' : '#F9FAFB',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLadder(l.id)}
                          style={{ width: 16, height: 16, accentColor: '#3B6D11', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{l.name}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>
                            {l.format === 'doubles' ? 'Doubles' : 'Singles'}
                            {' · '}{new Date(l.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                            {' – '}{new Date(l.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', fontSize: 15, fontWeight: 600,
                background: loading ? '#9CA3AF' : '#3B6D11', color: 'white',
                border: 'none', borderRadius: 10, cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Submitting…' : 'Submit profile →'}
            </button>
          </form>
        </div>

        <button
          onClick={onBack}
          style={{ marginTop: 16, display: 'block', width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
