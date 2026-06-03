import { useState, useEffect } from 'react';

function FAQEditor() {
  const [faqs, setFaqs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '' });
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ question: '', answer: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadFaqs(); }, []);

  async function loadFaqs() {
    const res = await fetch('/api/faqs');
    if (res.ok) setFaqs(await res.json());
  }

  function startEdit(faq) {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer });
    setAdding(false);
  }

  async function saveEdit() {
    if (!editForm.question.trim() || !editForm.answer.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditingId(null);
      await loadFaqs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFaq(id) {
    if (!confirm('Delete this FAQ?')) return;
    await fetch('/api/faqs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadFaqs();
  }

  async function addFaq() {
    if (!newForm.question.trim() || !newForm.answer.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (!res.ok) throw new Error('Failed to add');
      setNewForm({ question: '', answer: '' });
      setAdding(false);
      await loadFaqs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const taStyle = { width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 6 };
  const labelStyle = { display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 3 };

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          FAQ editor
        </div>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setEditingId(null); }}
            style={{ fontSize: 12, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}
          >
            + Add question
          </button>
        )}
      </div>

      {error && <div style={{ fontSize: 13, color: '#A32D2D', marginBottom: 10 }}>{error}</div>}

      {/* Existing FAQs */}
      {faqs.map(faq => (
        <div key={faq.id} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px', marginBottom: 8 }}>
          {editingId === faq.id ? (
            <>
              <label style={labelStyle}>Question</label>
              <textarea rows={2} value={editForm.question} onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))} style={taStyle} />
              <label style={labelStyle}>Answer</label>
              <textarea rows={3} value={editForm.answer} onChange={e => setEditForm(f => ({ ...f, answer: e.target.value }))} style={taStyle} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={saveEdit} disabled={saving} style={{ fontSize: 12, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditingId(null)} style={{ fontSize: 12, background: 'none', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{faq.question}</div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{faq.answer}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => startEdit(faq)} style={{ fontSize: 12, background: 'none', color: '#3B6D11', border: '1px solid #A8D57A', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => deleteFaq(faq.id)} style={{ fontSize: 12, background: 'none', color: '#A32D2D', border: '1px solid #FECACA', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new FAQ form */}
      {adding && (
        <div style={{ border: '1px dashed #A8D57A', borderRadius: 8, padding: '12px', marginBottom: 8, background: '#F9FAFB' }}>
          <label style={labelStyle}>Question</label>
          <textarea rows={2} value={newForm.question} onChange={e => setNewForm(f => ({ ...f, question: e.target.value }))} placeholder="e.g. How do I challenge another player?" style={taStyle} />
          <label style={labelStyle}>Answer</label>
          <textarea rows={3} value={newForm.answer} onChange={e => setNewForm(f => ({ ...f, answer: e.target.value }))} placeholder="Type the answer here…" style={taStyle} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={addFaq} disabled={saving} style={{ fontSize: 12, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer' }}>
              {saving ? 'Adding…' : 'Add FAQ'}
            </button>
            <button onClick={() => { setAdding(false); setNewForm({ question: '', answer: '' }); }} style={{ fontSize: 12, background: 'none', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {faqs.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '1rem 0', color: '#9CA3AF', fontSize: 13 }}>
          No FAQs yet. Add your first question above.
        </div>
      )}
    </div>
  );
}

export default function Settings({ settings, onSave, ladderId }) {
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    allow_join: 'bottom',
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
      const url = ladderId ? '/api/ladders' : '/api/settings';
      const body = ladderId ? { id: ladderId, ...form } : form;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      {/* Ladder settings */}
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
            <label style={labelStyle}>Allow new players to join</label>
            <select value={form.allow_join} onChange={e => setForm(f => ({ ...f, allow_join: e.target.value }))}>
              <option value="yes">Yes — join at current last place</option>
              <option value="bottom">Yes — always join at the very bottom</option>
              <option value="no">No — ladder locked after start date</option>
            </select>
          </div>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Points per result
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[['Win', 'win_pts'], ['Loss', 'loss_pts'], ['Draw', 'draw_pts']].map(([label, key]) => (
                <div key={key} style={{ textAlign: 'center' }}>
                  <label style={{ ...labelStyle, textAlign: 'center' }}>{label}</label>
                  <input
                    type="number" min="0" max="99"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    style={ptsInput}
                  />
                </div>
              ))}
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

      {/* FAQ editor */}
      <FAQEditor />
    </div>
  );
}
