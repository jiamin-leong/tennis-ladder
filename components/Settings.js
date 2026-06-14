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

function formatPhoneDisplay(digits) {
  if (digits.startsWith('65') && digits.length === 10) {
    return `+65 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return digits;
}

export default function Settings({ settings, onSave, ladderId, requesterId }) {
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    allow_join: 'bottom',
    win_pts: 3,
    loss_pts: 0,
    draw_pts: 1,
    format: 'singles',
    location: '',
    is_public: true,
    sport: 'tennis',
    co_organiser_phones: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newCoPhone, setNewCoPhone] = useState('');
  const [coPhoneError, setCoPhoneError] = useState('');
  const [posterImage, setPosterImage] = useState(null);
  const [posterSaving, setPosterSaving] = useState(false);
  const [posterSaved, setPosterSaved] = useState(false);

  const isPrimaryCreator = parseInt(settings?.creator_id) === parseInt(requesterId);

  useEffect(() => {
    if (settings?.poster_image) setPosterImage(settings.poster_image);
  }, [settings?.poster_image]);

  function handlePosterFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPosterImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function savePoster() {
    setPosterSaving(true);
    try {
      const res = await fetch('/api/ladders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ladderId, ...form, poster_image: posterImage, requesterId }),
      });
      if (!res.ok) throw new Error('Failed to save poster');
      setPosterSaved(true);
      setTimeout(() => setPosterSaved(false), 3000);
      onSave?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setPosterSaving(false);
    }
  }

  async function removePoster() {
    if (!confirm('Remove the poster from this ladder?')) return;
    setPosterSaving(true);
    try {
      const res = await fetch('/api/ladders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ladderId, ...form, poster_image: null, requesterId }),
      });
      if (!res.ok) throw new Error('Failed to remove poster');
      setPosterImage(null);
      onSave?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setPosterSaving(false);
    }
  }

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
        format: settings.format || 'singles',
        location: settings.location || '',
        is_public: settings.is_public !== false,
        sport: settings.sport || 'tennis',
        co_organiser_phones: settings.co_organiser_phones || [],
      });
    }
  }, [settings]);

  function addCoPhone() {
    setCoPhoneError('');
    const digits = newCoPhone.replace(/[\s\-().+]/g, '').trim();
    if (!digits) return;
    const normalized = digits.startsWith('65') ? digits : `65${digits}`;
    if (normalized.length !== 10) {
      setCoPhoneError('Phone number must be 8 digits.');
      return;
    }
    if (form.co_organiser_phones.includes(normalized)) {
      setCoPhoneError('This number is already added.');
      return;
    }
    setForm(f => ({ ...f, co_organiser_phones: [...f.co_organiser_phones, normalized] }));
    setNewCoPhone('');
  }

  function removeCoPhone(phone) {
    setForm(f => ({ ...f, co_organiser_phones: f.co_organiser_phones.filter(p => p !== phone) }));
  }

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
      const url = '/api/ladders';
      const body = { id: ladderId, ...form, requesterId };
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

          <div style={fieldStyle}>
            <label style={labelStyle}>Location <span style={{ color: '#9CA3AF' }}>(city or country)</span></label>
            <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Singapore" />
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
              Fixed at creation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8 }}>
              {[
                ['Sport',  form.sport === 'pickleball' ? '🏓 Pickleball' : '🎾 Tennis'],
                ['Format', form.format === 'doubles' ? 'Doubles' : 'Singles'],
                ['Win',    `${form.win_pts} pts`],
                ['Draw',   `${form.draw_pts} pts`],
                ['Loss',   `${form.loss_pts} pts`],
              ].map(([label, value]) => (
                <div key={label} style={{ textAlign: 'center', background: 'white', borderRadius: 8, padding: '10px 6px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {isPrimaryCreator && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Co-organiser access</label>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                Phone numbers listed here will have full organiser permissions.
              </div>
              {form.co_organiser_phones.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {form.co_organiser_phones.map(phone => (
                    <div key={phone} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>
                        📞 {formatPhoneDisplay(phone)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCoPhone(phone)}
                        style={{ fontSize: 12, background: 'none', color: '#A32D2D', border: '1px solid #FECACA', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 8, background: 'white', overflow: 'hidden', paddingLeft: 12 }}>
                  <span style={{ fontSize: 14, color: '#374151', whiteSpace: 'nowrap', userSelect: 'none' }}>+65</span>
                  <input
                    type="text"
                    value={newCoPhone}
                    onChange={e => { setNewCoPhone(e.target.value); setCoPhoneError(''); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCoPhone())}
                    placeholder="8489 7670"
                    style={{ flex: 1, border: 'none', outline: 'none', margin: 0, padding: '10px 10px', fontSize: 14, background: 'transparent' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addCoPhone}
                  style={{ fontSize: 13, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + Add
                </button>
              </div>
              {coPhoneError && (
                <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 4 }}>{coPhoneError}</div>
              )}
            </div>
          )}

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

      {/* Poster */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem', marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Ladder poster
        </div>
        {posterImage ? (
          <div style={{ marginBottom: 12 }}>
            <img src={posterImage} alt="Poster preview" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 200 }} />
          </div>
        ) : (
          <div style={{ border: '2px dashed #D1D5DB', borderRadius: 8, padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>
            No poster uploaded yet
          </div>
        )}
        <input type="file" accept="image/*" onChange={handlePosterFile} style={{ fontSize: 13, marginBottom: 10, display: 'block' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={savePoster}
            disabled={posterSaving || !posterImage}
            style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, background: posterSaved ? '#639922' : '#3B6D11', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: (posterSaving || !posterImage) ? 0.6 : 1 }}
          >
            {posterSaved ? '✓ Saved!' : posterSaving ? 'Saving…' : 'Save poster'}
          </button>
          {posterImage && (
            <button
              onClick={removePoster}
              disabled={posterSaving}
              style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer' }}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* FAQ editor */}
      <FAQEditor />
    </div>
  );
}
