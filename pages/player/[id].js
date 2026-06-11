import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { loadSession } from '../../lib/auth';
import { profileEmoji } from '../../lib/playerEmoji';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ladderStatus(ladder) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(ladder.start_date);
  const end   = new Date(ladder.end_date);
  if (end < today) return 'past';
  if (start > today) return 'upcoming';
  return 'active';
}

const STATUS_LABEL = { active: 'Active', upcoming: 'Upcoming', past: 'Ended' };
const STATUS_COLOR = { active: '#3B6D11', upcoming: '#92400E', past: '#6B7280' };
const STATUS_BG    = { active: '#EAF3DE', upcoming: '#FEF3C7', past: '#F3F4F6' };

const MEMBERSHIP_LABEL = { approved: '✓ Member', pending: '⏳ Pending', rejected: '✗ Not approved' };
const MEMBERSHIP_COLOR = { approved: '#3B6D11', pending: '#D97706', rejected: '#A32D2D' };

export default function PlayerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ preferred_name: '', gender: '', preferred_locations: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const session = loadSession();
    if (session?.player) setCurrentPlayer(session.player);
  }, []);

  function startEdit() {
    setEditForm({
      preferred_name: player.preferred_name || '',
      gender: player.gender || '',
      preferred_locations: player.preferred_locations || '',
    });
    setEditError('');
    setEditing(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true); setEditError('');
    try {
      const res = await fetch(`/api/player/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentPlayer.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPlayer(p => ({ ...p, ...data.player }));
      setEditing(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    fetch(`/api/player/${id}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error)))
      .then(data => { setPlayer(data); setLoading(false); })
      .catch(err => { setError(err || 'Failed to load profile'); setLoading(false); });
  }, [id]);

  const isOwnProfile = currentPlayer?.id === Number(id);
  const displayName = player?.preferred_name || player?.name;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#A32D2D', fontSize: 14 }}>{error || 'Player not found'}</div>
      </div>
    );
  }

  const approvedLadders = player.ladders.filter(l => l.membership_status === 'approved');
  const pendingLadders  = player.ladders.filter(l => l.membership_status === 'pending');

  return (
    <>
      <Head>
        <title>{displayName} — LadderLive</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
        {/* Nav */}
        <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="/" style={{ fontSize: 16, fontWeight: 800, color: '#27500A', textDecoration: 'none' }}>🏆 LadderLive</a>
            <button onClick={() => router.back()} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

          {/* Profile header */}
          <div style={{ background: '#3B6D11', borderRadius: 16, padding: '24px 24px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
              {profileEmoji(player.id)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{displayName}</div>
              {player.preferred_name && player.name !== player.preferred_name && (
                <div style={{ fontSize: 13, color: '#A8D57A', marginTop: 2 }}>{player.name}</div>
              )}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                Member since {formatDate(player.joined_at)}
              </div>
            </div>
          </div>

          {/* Profile details */}
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 20px', marginBottom: 12, border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Profile details</div>
              {isOwnProfile && !editing && (
                <button onClick={startEdit} style={{ fontSize: 13, fontWeight: 500, color: '#3B6D11', background: '#EAF3DE', border: '1px solid #A8D57A', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={saveEdit}>
                {[
                  { label: 'Preferred name', key: 'preferred_name', placeholder: 'e.g. Wei Jie' },
                  { label: 'Preferred locations', key: 'preferred_locations', placeholder: 'e.g. Bishan, Kallang' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{label}</label>
                    <input
                      type="text"
                      value={editForm[key]}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ margin: 0, fontSize: 14 }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} style={{ margin: 0, fontSize: 14 }}>
                    <option value="">Select…</option>
                    {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                {editError && (
                  <div style={{ fontSize: 13, color: '#A32D2D', background: '#FCEBEB', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>{editError}</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: 14, fontWeight: 600, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} style={{ padding: '10px 16px', fontSize: 14, background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {[
                  { label: 'Full name',           value: player.name },
                  { label: 'Preferred name',      value: player.preferred_name || '—' },
                  { label: 'Gender',              value: player.gender || '—' },
                  { label: 'Preferred locations', value: player.preferred_locations || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 13, color: '#6B7280', flexShrink: 0, marginRight: 12 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', textAlign: 'right' }}>{value}</div>
                  </div>
                ))}
                {isOwnProfile && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>Phone</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{loadSession()?.phone || '—'}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Ladder stats */}
          {approvedLadders.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Ladders</div>
              {approvedLadders.map(l => {
                const st = ladderStatus(l);
                return (
                  <a key={l.id} href={`/ladder/${l.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
                    <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #F3F4F6', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{l.name}</div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: STATUS_BG[st], color: STATUS_COLOR[st] }}>
                          {STATUS_LABEL[st]}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        {[
                          ['Pts', l.points ?? 0],
                          ['W',   l.wins   ?? 0],
                          ['L',   l.losses ?? 0],
                        ].map(([label, val]) => (
                          <div key={label} style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '8px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{val}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {l.format === 'doubles' ? '👥 Doubles' : '🎾 Singles'} · {formatDate(l.start_date)} – {formatDate(l.end_date)}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Pending ladders */}
          {pendingLadders.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Pending approval</div>
              {pendingLadders.map(l => (
                <div key={l.id} style={{ background: 'white', borderRadius: 14, padding: '14px 18px', border: '1px solid #F3F4F6', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{l.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: MEMBERSHIP_COLOR.pending }}>{MEMBERSHIP_LABEL.pending}</div>
                </div>
              ))}
            </div>
          )}

          {player.ladders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: 14, border: '1px dashed #D1D5DB', color: '#9CA3AF', fontSize: 13 }}>
              Not yet a member of any ladder.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
