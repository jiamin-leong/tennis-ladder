import { useState } from 'react';

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 };
const primaryBtn = { background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const cancelBtn  = { background: 'none', border: '1px solid #D1D5DB', borderRadius: 8, padding: '9px 16px', fontSize: 13, color: '#6B7280', cursor: 'pointer' };

export default function CreateLadderModal({ onClose, onCreated, creatorId }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: '', location: '', start_date: today, end_date: '',
    win_pts: 3, loss_pts: 0, draw_pts: 1, format: 'singles', sport: 'tennis',
    join_as_player: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      setError('Name, start date, and end date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/ladders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, creator_id: creatorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ladder');
      onCreated(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#27500A', marginBottom: 16 }}>Create new ladder</div>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Ladder name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer 2026" style={{ marginBottom: 12 }} />

          <label style={labelStyle}>Location <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(city or country)</span></label>
          <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Singapore" style={{ marginBottom: 12 }} />

          <label style={labelStyle}>Sport</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['🎾 Tennis', 'tennis'], ['🏓 Pickleball', 'pickleball']].map(([label, val]) => (
              <button
                key={val} type="button" onClick={() => set('sport', val)}
                style={{
                  flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                  border: form.sport === val ? '2px solid #3B6D11' : '2px solid #E5E7EB',
                  background: form.sport === val ? '#EAF3DE' : 'white',
                  color: form.sport === val ? '#27500A' : '#6B7280',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <label style={labelStyle}>Format</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['singles', 'doubles'].map(f => (
              <button
                key={f} type="button" onClick={() => set('format', f)}
                style={{
                  flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                  border: form.format === f ? '2px solid #3B6D11' : '2px solid #E5E7EB',
                  background: form.format === f ? '#EAF3DE' : 'white',
                  color: form.format === f ? '#27500A' : '#6B7280',
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Start date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>End date</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[['Win pts', 'win_pts'], ['Loss pts', 'loss_pts'], ['Draw pts', 'draw_pts']].map(([label, key]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type="number" min="0" value={form[key]} onChange={e => set(key, parseInt(e.target.value) || 0)} />
              </div>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.join_as_player}
              onChange={e => set('join_as_player', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#3B6D11', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: '#374151' }}>
              Join this ladder as a player
              <span style={{ display: 'block', fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>Uncheck if you're organising but not playing</span>
            </span>
          </label>

          {error && <div style={{ fontSize: 13, color: '#A32D2D', marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...primaryBtn, flex: 1 }}>
              {saving ? 'Creating…' : 'Create ladder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
