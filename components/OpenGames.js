import { useState, useEffect, useCallback, useRef } from 'react';

const DAYS = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 },
];
const TIME_BLOCKS = [
  { key: 'morning',   label: 'Morning',   range: '6am–12pm' },
  { key: 'afternoon', label: 'Afternoon', range: '12–5pm' },
  { key: 'evening',   label: 'Evening',   range: '5pm+' },
];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

const chipBase = { fontSize: 12, fontWeight: 500, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', whiteSpace: 'nowrap' };
const chipActive = { ...chipBase, background: '#3B6D11', color: 'white', border: '1px solid #3B6D11' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4 };

function defaultTitle(player, maxPlayers) {
  const name = player?.preferred_name || player?.name || '';
  const format = maxPlayers === 4 ? 'Doubles' : 'Singles';
  return name ? `${name}'s ${format}` : '';
}

export default function OpenGames({ currentPlayer, ladderId, initialGameId }) {
  const [view, setView] = useState('list');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState(null);
  const [timeFilter, setTimeFilter] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', end_time: '', location: '', map_link: '', max_players: 2, ladder_id: ladderId || '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [myLadders, setMyLadders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const loadGames = useCallback(async () => {
    if (!currentPlayer?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ playerId: currentPlayer.id });
      if (dayFilter !== null) params.set('dayOfWeek', dayFilter);
      if (timeFilter) params.set('timeBlock', timeFilter);
      const res = await fetch(`/api/open-games?${params}`);
      if (res.ok) setGames(await res.json());
    } finally {
      setLoading(false);
    }
  }, [currentPlayer?.id, dayFilter, timeFilter]);

  useEffect(() => { loadGames(); }, [loadGames]);

  useEffect(() => {
    if (!initialGameId || !currentPlayer?.id) return;
    fetch(`/api/open-games?playerId=${currentPlayer.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(all => {
        const game = all.find(g => g.id === initialGameId);
        if (game) openDetail(game);
      });
  }, [initialGameId, currentPlayer?.id]);

  useEffect(() => {
    if (!currentPlayer?.id) return;
    fetch(`/api/game-templates?playerId=${currentPlayer.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setTemplates)
      .catch(() => {});
  }, [currentPlayer?.id]);

  useEffect(() => {
    if (!currentPlayer?.id) return;
    fetch(`/api/ladders?playerId=${currentPlayer.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(all => setMyLadders(all.filter(l => l.my_status === 'approved')))
      .catch(() => {});
  }, [currentPlayer?.id]);

  useEffect(() => {
    if (view !== 'detail' || !selectedGame) return;
    const id = setInterval(() => loadMessages(selectedGame.id), 5000);
    return () => clearInterval(id);
  }, [view, selectedGame?.id]);

  async function sendMessage() {
    if (!chatInput.trim() || sendingChat) return;
    setSendingChat(true);
    try {
      await fetch('/api/game-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: selectedGame.id, playerId: currentPlayer.id, message: chatInput.trim() }),
      });
      setChatInput('');
      await loadMessages(selectedGame.id);
    } finally {
      setSendingChat(false);
    }
  }

  async function loadMessages(gameId) {
    const res = await fetch(`/api/game-messages?gameId=${gameId}`);
    if (res.ok) {
      const msgs = await res.json();
      setMessages(msgs);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  async function openDetail(game) {
    setSelectedGame(game);
    setView('detail');
    setMessages([]);
    setChatInput('');
    setLoadingParts(true);
    try {
      const [partsRes] = await Promise.all([
        fetch(`/api/game-participants?gameId=${game.id}`),
        loadMessages(game.id),
      ]);
      if (partsRes.ok) setParticipants(await partsRes.json());
    } finally {
      setLoadingParts(false);
    }
  }

  async function refreshDetail(gameId) {
    const [partsRes, gamesRes] = await Promise.all([
      fetch(`/api/game-participants?gameId=${gameId}`),
      fetch(`/api/open-games?playerId=${currentPlayer.id}`),
    ]);
    if (partsRes.ok) setParticipants(await partsRes.json());
    if (gamesRes.ok) {
      const updated = await gamesRes.json();
      setGames(updated);
      const fresh = updated.find(g => g.id === gameId);
      if (fresh) setSelectedGame(fresh);
    }
  }

  async function joinGame(game) {
    setActioning(true);
    try {
      await fetch('/api/game-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, playerId: currentPlayer.id }),
      });
      await refreshDetail(game.id);
    } finally { setActioning(false); }
  }

  async function leaveGame(game) {
    setActioning(true);
    try {
      await fetch('/api/game-participants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, playerId: currentPlayer.id }),
      });
      await refreshDetail(game.id);
    } finally { setActioning(false); }
  }

  async function updateParticipant(gameId, playerId, status) {
    setActioning(true);
    try {
      await fetch('/api/game-participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerId, status, requesterId: currentPlayer.id }),
      });
      await refreshDetail(gameId);
    } finally { setActioning(false); }
  }

  async function createGame() {
    setFormError('');
    if (!form.title.trim() || !form.date || !form.time || !form.location.trim()) {
      setFormError('Title, date, time and location are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/open-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, creator_id: currentPlayer.id, ladder_id: form.ladder_id || null }),
      });
      if (!res.ok) throw new Error('Failed to create game');
      await loadGames();
      setForm({ title: '', description: '', date: '', time: '', end_time: '', location: '', map_link: '', max_players: 2, ladder_id: ladderId || '' });
      setView('list');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    setEditSaving(true);
    try {
      const res = await fetch('/api/open-games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, id: selectedGame.id, requesterId: currentPlayer.id }),
      });
      if (res.ok) {
        await refreshDetail(selectedGame.id);
        setIsEditing(false);
      }
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteGame(id) {
    if (!confirm('Delete this game?')) return;
    await fetch('/api/open-games', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, requesterId: currentPlayer.id }),
    });
    await loadGames();
    setView('list');
  }

  function applyTemplate(t) {
    setForm(f => ({
      ...f,
      title: t.title || f.title,
      time: t.time || f.time,
      location: t.location || f.location,
      description: t.description || f.description,
    }));
    setShowTemplates(false);
  }

  async function saveTemplate() {
    if (!templateName.trim()) return;
    setTemplateSaving(true);
    try {
      const res = await fetch('/api/game-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          name: templateName.trim(),
          title: form.title,
          time: form.time,
          location: form.location,
          description: form.description,
        }),
      });
      if (res.ok) {
        const t = await res.json();
        setTemplates(prev => [t, ...prev]);
        setTemplateName('');
        setShowSaveTemplate(false);
      }
    } finally {
      setTemplateSaving(false);
    }
  }

  const cardStyle = { background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1rem', marginBottom: 10 };

  // ── List view ────────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Open Matches</div>
          <button
            onClick={() => { setFormError(''); setForm(f => ({ ...f, title: defaultTitle(currentPlayer, f.max_players) })); setView('create'); }}
            style={{ fontSize: 13, fontWeight: 600, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
          >
            + Create Match
          </button>
        </div>

        {/* Day filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
          <button style={dayFilter === null ? chipActive : chipBase} onClick={() => setDayFilter(null)}>All days</button>
          {DAYS.map(d => (
            <button key={d.value} style={dayFilter === d.value ? chipActive : chipBase} onClick={() => setDayFilter(dayFilter === d.value ? null : d.value)}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Time filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
          <button style={timeFilter === null ? chipActive : chipBase} onClick={() => setTimeFilter(null)}>All times</button>
          {TIME_BLOCKS.map(tb => (
            <button key={tb.key} style={timeFilter === tb.key ? chipActive : chipBase} onClick={() => setTimeFilter(timeFilter === tb.key ? null : tb.key)}>
              {tb.label} <span style={{ opacity: 0.7, fontSize: 11 }}>{tb.range}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF' }}>Loading…</div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎾</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No games yet</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Be the first to create one.</div>
          </div>
        ) : (
          games.map(game => {
            const spotsLeft = game.max_players - parseInt(game.approved_count || 0);
            const isFull = spotsLeft <= 0;
            const isCreator = parseInt(game.creator_id) === parseInt(currentPlayer?.id);
            return (
              <div
                key={game.id}
                onClick={() => openDetail(game)}
                style={{ ...cardStyle, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{game.title}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '2px 8px',
                      background: isFull ? '#FEF3C7' : '#EAF3DE',
                      color: isFull ? '#92580A' : '#3B6D11',
                      border: `1px solid ${isFull ? '#FDE68A' : '#A8D57A'}`,
                    }}>
                      {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    📅 {fmtDate(game.date)} · ⏰ {fmtTime(game.time)}{game.end_time ? ` – ${fmtTime(game.end_time)}` : ''} · {game.map_link ? <a href={game.map_link} target="_blank" rel="noreferrer" style={{ color: '#3B6D11', textDecoration: 'underline' }} onClick={e => e.stopPropagation()}>📍 {game.location}</a> : `📍 ${game.location}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {isCreator ? 'Your game' : `by ${game.creator_name}`}
                    {game.ladder_name
                      ? <span> · 🔒 <span style={{ color: '#6B7280' }}>{game.ladder_name} only</span></span>
                      : <span> · 🌐 <span style={{ color: '#6B7280' }}>Visible to all</span></span>
                    }
                  </div>
                </div>
                <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, paddingTop: 2 }}>
                  {game.my_status === 'approved' && !isCreator
                    ? <span style={{ color: '#3B6D11' }}>✓ Confirmed</span>
                    : game.my_status === 'waitlist'
                    ? <span style={{ color: '#D97706' }}>⏳ Waitlisted</span>
                    : isCreator
                    ? <span style={{ color: '#6B7280' }}>Manage →</span>
                    : <span style={{ color: '#6B7280' }}>View →</span>
                  }
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ── Create view ──────────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div>
        <button
          onClick={() => setView('list')}
          style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>New Game</div>

        <div style={{ ...cardStyle, marginBottom: 0 }}>
          {/* Template row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, position: 'relative' }}>
            {templates.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => { setShowTemplates(v => !v); setShowSaveTemplate(false); }}
                  style={{ fontSize: 13, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#374151' }}
                >
                  Load template ▾
                </button>
                {showTemplates && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 200, marginTop: 4 }}>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, background: 'none', border: 'none', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', color: '#374151' }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => { setShowSaveTemplate(v => !v); setShowTemplates(false); }}
              style={{ fontSize: 13, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#374151' }}
            >
              Save as template
            </button>
          </div>

          {showSaveTemplate && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Template name (e.g. Tuesday Kallang)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={saveTemplate}
                disabled={templateSaving || !templateName.trim()}
                style={{ fontSize: 13, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap', opacity: templateSaving ? 0.7 : 1 }}
              >
                {templateSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}

          {/* Fields */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Tuesday night doubles" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Start time *</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End time</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Location *</label>
            <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Kallang Tennis Centre, Court 3" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Map link <span style={{ color: '#9CA3AF' }}>(optional)</span></label>
            <input type="url" value={form.map_link} onChange={e => setForm(f => ({ ...f, map_link: e.target.value }))} placeholder="Paste a Google Maps or Waze link" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any details, skill level, what to bring…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Format</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ label: 'Singles', sub: '2+ players', value: 2 }, { label: 'Doubles', sub: '4+ players', value: 4 }].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => {
                      const wasDefault = f.title === defaultTitle(currentPlayer, f.max_players) || f.title === '';
                      return { ...f, max_players: opt.value, title: wasDefault ? defaultTitle(currentPlayer, opt.value) : f.title };
                    })}
                    style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: form.max_players === opt.value ? '2px solid #3B6D11' : '1px solid #D1D5DB', background: form.max_players === opt.value ? '#EAF3DE' : 'white', cursor: 'pointer', textAlign: 'center' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.max_players === opt.value ? '#3B6D11' : '#374151' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Link to ladder <span style={{ color: '#9CA3AF' }}>(optional)</span></label>
              <select value={form.ladder_id} onChange={e => setForm(f => ({ ...f, ladder_id: e.target.value }))} style={inputStyle}>
                <option value="">No ladder</option>
                {myLadders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {form.ladder_id && (
                <div style={{ fontSize: 11, color: '#3B6D11', marginTop: 5 }}>
                  Match outcome will count towards this ladder's leaderboard. Only players in this ladder will see this match.
                </div>
              )}
              {!form.ladder_id && (
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>
                  Link a ladder for results to count towards its leaderboard. Leave empty to make this match visible to all players.
                </div>
              )}
            </div>
          </div>

          {formError && <div style={{ fontSize: 13, color: '#A32D2D', marginBottom: 12 }}>{formError}</div>}

          <button
            onClick={createGame}
            disabled={saving}
            style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Creating…' : 'Create Game →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedGame) {
    const game = selectedGame;
    const isCreator = parseInt(game.creator_id) === parseInt(currentPlayer?.id);
    const approvedList = participants.filter(p => p.status === 'approved');
    const waitlist = participants.filter(p => p.status === 'waitlist');
    const myEntry = participants.find(p => parseInt(p.player_id) === parseInt(currentPlayer?.id));
    const spotsLeft = game.max_players - parseInt(game.approved_count || 0);
    const isFull = spotsLeft <= 0;

    return (
      <div>
        <button
          onClick={() => { setView('list'); setSelectedGame(null); setParticipants([]); setIsEditing(false); }}
          style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}
        >
          ← Back
        </button>

        {/* Game info */}
        <div style={cardStyle}>
          {isEditing ? (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Title *</label>
                <input value={editForm.title || ''} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <label style={labelStyle}>Start time *</label>
                    <input type="time" value={editForm.time || ''} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>End time</label>
                    <input type="time" value={editForm.end_time || ''} onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Location *</label>
                <input value={editForm.location || ''} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Map link</label>
                <input type="url" value={editForm.map_link || ''} onChange={e => setEditForm(f => ({ ...f, map_link: e.target.value }))} placeholder="Paste a Google Maps or Waze link" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Description</label>
                <textarea value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEdit} disabled={editSaving} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, cursor: editSaving ? 'default' : 'pointer', opacity: editSaving ? 0.7 : 1 }}>
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={() => setIsEditing(false)} style={{ padding: '9px 16px', fontSize: 13, background: 'none', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{game.title}</div>
                {isCreator && (
                  <button
                    onClick={() => { setEditForm({ title: game.title, date: game.date?.slice(0,10), time: game.time, end_time: game.end_time || '', location: game.location, map_link: game.map_link || '', description: game.description || '', max_players: game.max_players, ladder_id: game.ladder_id || '', status: game.status }); setIsEditing(true); }}
                    style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>📅 {fmtDate(game.date)} · ⏰ {fmtTime(game.time)}{game.end_time ? ` – ${fmtTime(game.end_time)}` : ''}</div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                {game.map_link
                  ? <a href={game.map_link} target="_blank" rel="noreferrer" style={{ color: '#3B6D11', textDecoration: 'underline' }}>📍 {game.location}</a>
                  : `📍 ${game.location}`}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: game.description ? 8 : 0 }}>
                Hosted by {isCreator ? 'you' : game.creator_name}
                {game.ladder_name && <span> · 🎾 {game.ladder_name}</span>}
              </div>
              {game.description && (
                <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                  {game.description}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 18 }}>{game.approved_count}</span>/{game.max_players} confirmed
                  </div>
                  {parseInt(game.waitlist_count) > 0 && (
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      <span style={{ fontWeight: 600, color: '#D97706', fontSize: 18 }}>{game.waitlist_count}</span> on waitlist
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/?match=${game.id}`;
                    try {
                      if (navigator.share) { await navigator.share({ title: game.title, url }); return; }
                    } catch {}
                    navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
                  }}
                  style={{ fontSize: 12, fontWeight: 600, color: '#3B6D11', background: '#EAF3DE', border: '1px solid #A8D57A', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
                >
                  🔗 Share
                </button>
              </div>
            </>
          )}
        </div>

        {/* Confirmed */}
        {approvedList.length > 0 && (
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Confirmed ({approvedList.length}/{game.max_players})
            </div>
            {approvedList.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>{p.player_name}</span>
                {parseInt(p.player_id) === parseInt(game.creator_id) && (
                  <span style={{ fontSize: 11, fontWeight: 600, background: '#EAF3DE', color: '#3B6D11', border: '1px solid #A8D57A', borderRadius: 5, padding: '2px 8px' }}>Host</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Waitlist ({waitlist.length})
            </div>
            {waitlist.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>{p.player_name}</span>
                {isCreator && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => updateParticipant(game.id, p.player_id, 'approved')}
                      disabled={actioning}
                      style={{ fontSize: 12, background: '#EAF3DE', color: '#3B6D11', border: '1px solid #A8D57A', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', opacity: actioning ? 0.6 : 1 }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => updateParticipant(game.id, p.player_id, 'declined')}
                      disabled={actioning}
                      style={{ fontSize: 12, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #FECACA', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', opacity: actioning ? 0.6 : 1 }}
                    >
                      ✗ Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chat */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chat</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Refreshes every ~5 seconds</span>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>No messages yet. Say hello!</div>
            )}
            {messages.map(msg => {
              const isMe = parseInt(msg.player_id) === parseInt(currentPlayer?.id);
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{msg.player_name}</div>}
                  <div style={{
                    maxWidth: '75%', padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMe ? '#3B6D11' : '#F3F4F6',
                    color: isMe ? 'white' : '#111827',
                    fontSize: 13, lineHeight: 1.4,
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message…"
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim() || sendingChat}
              style={{ padding: '8px 14px', background: '#3B6D11', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: chatInput.trim() && !sendingChat ? 'pointer' : 'default', opacity: chatInput.trim() && !sendingChat ? 1 : 0.5 }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Action area */}
        <div style={{ marginTop: 4 }}>
          {loadingParts ? null
            : isCreator ? (
              <button
                onClick={() => deleteGame(game.id)}
                style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 600, background: 'none', color: '#A32D2D', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer' }}
              >
                Delete game
              </button>
            ) : !myEntry ? (
              <button
                onClick={() => joinGame(game)}
                disabled={actioning}
                style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, cursor: actioning ? 'default' : 'pointer', opacity: actioning ? 0.7 : 1 }}
              >
                {isFull ? 'Join waitlist →' : 'Join game →'}
              </button>
            ) : myEntry.status === 'waitlist' ? (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92580A', textAlign: 'center' }}>
                ⏳ You're on the waitlist — waiting for host approval
              </div>
            ) : (
              <>
                <div style={{ background: '#EAF3DE', border: '1px solid #A8D57A', borderRadius: 8, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#3B6D11', textAlign: 'center', marginBottom: 8 }}>
                  ✓ You're confirmed
                </div>
                <button
                  onClick={() => leaveGame(game)}
                  disabled={actioning}
                  style={{ width: '100%', padding: '10px', fontSize: 13, background: 'none', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, cursor: actioning ? 'default' : 'pointer' }}
                >
                  Leave game
                </button>
              </>
            )
          }
        </div>
      </div>
    );
  }

  return null;
}
