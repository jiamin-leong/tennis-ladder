import { useState } from 'react';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function ladderStatus(ladder) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(ladder.start_date);
  const end   = new Date(ladder.end_date);
  if (end < today) return 'past';
  if (start > today) return 'upcoming';
  return 'active';
}

const STATUS_LABEL = { active: 'Active', upcoming: 'Upcoming', past: 'Ended' };
const STATUS_COLOR = { active: '#3B6D11', upcoming: '#92400E', past: '#6B7280' };
const STATUS_BG    = { active: '#EAF3DE', upcoming: '#FEF3C7', past: '#F3F4F6' };

function CreateLadderModal({ onClose, onCreated }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: '', start_date: today, end_date: '',
    win_pts: 3, loss_pts: 0, draw_pts: 1, format: 'singles',
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
        body: JSON.stringify(form),
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
      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#27500A', marginBottom: 16 }}>Create new ladder</div>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Ladder name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer 2026" style={{ marginBottom: 12 }} />

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

export default function AdminHome({ ladders, onSelectLadder, onLaddersChange }) {
  const [showCreate, setShowCreate] = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);

  const active   = ladders.filter(l => ladderStatus(l) === 'active');
  const upcoming = ladders.filter(l => ladderStatus(l) === 'upcoming');
  const past     = ladders.filter(l => ladderStatus(l) === 'past');

  function handleCreated(ladder) {
    setShowCreate(false);
    onLaddersChange();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>All ladders</div>
        <button onClick={() => setShowCreate(true)} style={primaryBtn}>+ New ladder</button>
      </div>

      {ladders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9CA3AF', fontSize: 14 }}>
          No ladders yet. Create your first one!
        </div>
      )}

      {[...active, ...upcoming].map(ladder => (
        <LadderCard key={ladder.id} ladder={ladder} onSelect={() => onSelectLadder(ladder)} />
      ))}

      {past.length > 0 && (
        <div style={{ marginTop: active.length + upcoming.length > 0 ? 20 : 0 }}>
          <button
            onClick={() => setPastExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6B7280', padding: '4px 0', marginBottom: 8 }}
          >
            <span style={{ fontSize: 11, transition: 'transform 0.15s', display: 'inline-block', transform: pastExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            Past ladders ({past.length})
          </button>
          {pastExpanded && past.map(ladder => (
            <LadderCard key={ladder.id} ladder={ladder} onSelect={() => onSelectLadder(ladder)} />
          ))}
        </div>
      )}

      {showCreate && <CreateLadderModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

function LadderCard({ ladder, onSelect }) {
  const status = ladderStatus(ladder);
  return (
    <div
      onClick={onSelect}
      style={{
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
        padding: '14px 16px', marginBottom: 10, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{ladder.name}</div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          {formatDate(ladder.start_date)} – {formatDate(ladder.end_date)}
          {' · '}{ladder.format === 'doubles' ? 'Doubles' : 'Singles'}
          {' · '}{ladder.player_count} player{ladder.player_count !== 1 ? 's' : ''}
          {ladder.pending_count > 0 && <span style={{ color: '#D97706', fontWeight: 600 }}> · {ladder.pending_count} pending</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: STATUS_BG[status], color: STATUS_COLOR[status] }}>
          {STATUS_LABEL[status]}
        </span>
        <span style={{ color: '#9CA3AF', fontSize: 16 }}>›</span>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 };
const primaryBtn = { background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const cancelBtn  = { background: 'none', border: '1px solid #D1D5DB', borderRadius: 8, padding: '9px 16px', fontSize: 13, color: '#6B7280', cursor: 'pointer' };
