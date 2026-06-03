import { useState, useEffect } from 'react';

export default function Settings({ settings, onSave }) {
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    allow_join: 'bottom',
    whatsapp_group: '',
    win_pts: 3,
    loss_pts: 0,
    draw_pts: 1,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || '',
        start_date: settings.start_date?.split('T')[0] || '',
        end_date: settings.end_date?.split('T')[0] || '',
        allow_join: settings.allow_join || 'bottom',
        whatsapp_group: settings.whatsapp_group || '',
        win_pts: settings.win_pts ?? 3,
        loss_pts: settings.loss_pts ?? 0,
        draw_pts: settings.draw_pts ?? 1,
      });
    }
  }, [settings]);

  function daysLeft() {
    if (!form.end_date) return null;
    const diff = new Date(form.end_date) - new Date();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  function progress() {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const now = new Date();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSave?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const left = daysLeft();
  const prog = progress();

  const fieldStyle = { marginBottom: 12 };
  const labelStyle = { display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 };
  const ptsInput = { width: 72, textAlign: 'center', margin: 0 };

  return (
    <div>
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Ladder settings
        </div>

        <form onSubmit={handleSave}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Ladder name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...fieldStyle }}>
            <div>
              <label style={labelStyle}>Start date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>End date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>WhatsApp group name</label>
            <input type="text" value={form.whatsapp_group} onChange={e => setForm(f => ({ ...f, whatsapp_group: e.target.value }))} placeholder="e.g. Raffles TC Chat" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Allow new players to join</label>
            <select value={form.allow_join} onChange={e => setForm(f => ({ ...f, allow_join: e.target.value }))}>
              <option value="yes">Yes — join at current last place</option>
              <option value="bottom">Yes — always join at the very bottom</option>
              <option value="no">No — ladder locked after start date</option>
            </select>
          </div>

          {/* Points system */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Points per result
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <label style={{ ...labelStyle, textAlign: 'center' }}>Win</label>
                <input
                  type="number" min="0" max="99"
                  value={form.win_pts}
                  onChange={e => setForm(f => ({ ...f, win_pts: Number(e.target.value) }))}
                  style={ptsInput}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <label style={{ ...labelStyle, textAlign: 'center' }}>Loss</label>
                <input
                  type="number" min="0" max="99"
                  value={form.loss_pts}
                  onChange={e => setForm(f => ({ ...f, loss_pts: Number(e.target.value) }))}
                  style={ptsInput}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <label style={{ ...labelStyle, textAlign: 'center' }}>Draw</label>
                <input
                  type="number" min="0" max="99"
                  value={form.draw_pts}
                  onChange={e => setForm(f => ({ ...f, draw_pts: Number(e.target.value) }))}
                  style={ptsInput}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{ background: saved ? '#639922' : '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, width: '100%', opacity: saving ? 0.7 : 1, transition: 'background 0.3s', cursor: 'pointer' }}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </div>

      {/* Season progress */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Season progress
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
          <span>{form.start_date || '—'}</span>
          <span>{form.end_date || '—'}</span>
        </div>
        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${prog}%`, height: '100%', background: '#3B6D11', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        {left !== null && (
          <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 600, color: left < 7 ? '#A32D2D' : '#3B6D11' }}>
            {left} <span style={{ fontSize: 16, fontWeight: 400, color: '#6B7280' }}>days remaining</span>
          </div>
        )}
      </div>
    </div>
  );
}
