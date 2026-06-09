import { useState, useEffect } from 'react';

const MOCK_SCREENS = [
  {
    label: 'Leaderboard',
    description: 'Live standings update instantly after every match',
    content: (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Summer Ladder 2026
        </div>
        {[
          { rank: 1, name: 'Alex',  pts: 15, w: 5, l: 0, you: false },
          { rank: 2, name: 'Sofia', pts: 12, w: 4, l: 1, you: true  },
          { rank: 3, name: 'Kai',   pts:  9, w: 3, l: 2, you: false },
          { rank: 4, name: 'Omar',  pts:  6, w: 2, l: 2, you: false },
          { rank: 5, name: 'Priya', pts:  3, w: 1, l: 3, you: false },
        ].map(p => (
          <div key={p.rank} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, marginBottom: 4,
            background: p.you ? '#EAF3DE' : 'white',
            border: p.you ? '1.5px solid #A8D57A' : '1px solid #F3F4F6',
          }}>
            <div style={{ width: 18, fontSize: 12, fontWeight: 700, color: p.rank === 1 ? '#D97706' : '#9CA3AF', textAlign: 'center' }}>
              {p.rank === 1 ? '🥇' : p.rank}
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: p.you ? 600 : 400, color: '#111827' }}>{p.name}</div>
            {p.you && <div style={{ fontSize: 10, fontWeight: 700, color: '#3B6D11', background: '#EAF3DE', border: '1px solid #A8D57A', borderRadius: 4, padding: '1px 5px' }}>YOU</div>}
            <div style={{ fontSize: 12, color: '#6B7280' }}>{p.w}W · {p.l}L</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3B6D11', minWidth: 36, textAlign: 'right' }}>{p.pts} pts</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: 'Submit Score',
    description: 'Log results in seconds — winners and set scores in one tap',
    content: (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Record a match
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[['Player 1', 'Alex'], ['Player 2', 'Sofia']].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 3 }}>{label}</div>
              <div style={{ background: 'white', border: '1px solid #D1D5DB', borderRadius: 7, padding: '6px 8px', fontSize: 12, fontWeight: 500, color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {val} <span style={{ color: '#9CA3AF', fontSize: 9 }}>▾</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 5 }}>Who won?</div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          {[['Alex', false], ['Draw', false], ['Sofia', true]].map(([label, selected]) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: 7, fontSize: 11, fontWeight: 600,
              border: selected ? '2px solid #3B6D11' : '1.5px solid #E5E7EB',
              background: selected ? '#EAF3DE' : 'white',
              color: selected ? '#27500A' : '#6B7280',
            }}>
              {label}
              <div style={{ fontSize: 9, fontWeight: 400, color: selected ? '#3B6D11' : '#9CA3AF', marginTop: 1 }}>+3 pts</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 5 }}>Set scores</div>
        {[['Set 1 *', '6', '4'], ['Set 2', '3', '6']].map(([label, a, b]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <div style={{ fontSize: 10, color: '#6B7280', minWidth: 36 }}>{label}</div>
            <div style={{ width: 30, textAlign: 'center', border: '1px solid #D1D5DB', borderRadius: 6, padding: '4px 0', fontSize: 13, fontWeight: 700, background: 'white' }}>{a}</div>
            <div style={{ color: '#9CA3AF', fontSize: 11 }}>–</div>
            <div style={{ width: 30, textAlign: 'center', border: '1px solid #D1D5DB', borderRadius: 6, padding: '4px 0', fontSize: 13, fontWeight: 700, background: 'white' }}>{b}</div>
          </div>
        ))}
        <div style={{ marginTop: 10, background: '#3B6D11', color: 'white', borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
          Submit result →
        </div>
      </div>
    ),
  },
  {
    label: 'Match History',
    description: 'Every result is recorded — full history for the whole ladder',
    content: (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Recent results
        </div>
        {[
          { winner: 'Alex',  loser: 'Kai',   score: '6-3, 7-5',     pts: 3, ago: '3 days ago' },
          { winner: 'Sofia', loser: 'Omar',  score: '7-6, 4-6, 6-3', pts: 3, ago: '6 days ago' },
          { winner: 'Kai',   loser: 'Priya', score: '6-1, 6-2',      pts: 3, ago: '1 week ago' },
          { winner: 'Alex',  loser: 'Sofia', score: '6-4, 6-2',      pts: 3, ago: '2 weeks ago' },
        ].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 600 }}>{m.winner}</span>
                <span style={{ color: '#9CA3AF', margin: '0 4px', fontWeight: 400 }}>def.</span>
                {m.loser}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{m.score} · {m.ago}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3B6D11', background: '#EAF3DE', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
              +{m.pts} pts
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function LoginScreen({ ladderName, onContinue, onAdminLogin }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [mockScreen, setMockScreen] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMockScreen(s => (s + 1) % MOCK_SCREENS.length), 3000);
    return () => clearInterval(t);
  }, []);

  async function handleContinue(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setError('');
    setLoading(true);
    const digits = phone.replace(/[\s\-().]/g, '').trim();
    const fullPhone = digits.startsWith('65') ? digits : `65${digits}`;
    try {
      await onContinue(fullPhone);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    if (!adminPhone.trim() || !adminPin.trim()) return;
    setAdminError('');
    setAdminLoading(true);
    const adminDigits = adminPhone.replace(/[\s\-().]/g, '').trim();
    const fullAdminPhone = adminDigits.startsWith('65') ? adminDigits : `65${adminDigits}`;
    try {
      await onAdminLogin(fullAdminPhone, adminPin.trim());
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }

  const btnStyle = (disabled) => ({
    width: '100%', padding: '13px', fontSize: 15, fontWeight: 600,
    background: disabled ? '#9CA3AF' : '#3B6D11', color: 'white',
    border: 'none', borderRadius: 10, cursor: disabled ? 'default' : 'pointer', marginTop: 12,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem 3rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 16 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#27500A', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {ladderName}
          </div>
          <div style={{ fontSize: 16, color: '#3B6D11', fontWeight: 500, marginTop: 8 }}>
            Run your ladder. Track every match.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            {['🎾 Tennis', '🏓 Pickleball'].map(tag => (
              <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: '#3B6D11', background: '#EAF3DE', border: '1px solid #A8D57A', borderRadius: 20, padding: '4px 12px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* App preview animation */}
        <div style={{ marginBottom: 28 }}>
          {/* Screen tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, justifyContent: 'center' }}>
            {MOCK_SCREENS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setMockScreen(i)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: mockScreen === i ? '#3B6D11' : '#E5E7EB',
                  color: mockScreen === i ? 'white' : '#6B7280',
                  transition: 'all 0.2s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#6B7280', marginBottom: 8, minHeight: 18 }}>
            {MOCK_SCREENS[mockScreen].description}
          </div>
          {/* Phone frame */}
          <div style={{
            background: 'white', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #E5E7EB', overflow: 'hidden', minHeight: 260,
            position: 'relative',
          }}>
            {/* Status bar mock */}
            <div style={{ background: '#EAF3DE', padding: '8px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #D1FAE5' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#27500A' }}>🏆 {ladderName}</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>{MOCK_SCREENS[mockScreen].label}</div>
            </div>
            {/* Animated screen content */}
            <div style={{ position: 'relative', minHeight: 220 }}>
              {MOCK_SCREENS.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    position: i === 0 ? 'relative' : 'absolute',
                    top: 0, left: 0, right: 0,
                    opacity: mockScreen === i ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                    pointerEvents: mockScreen === i ? 'auto' : 'none',
                  }}
                >
                  {s.content}
                </div>
              ))}
            </div>
          </div>
          {/* Dots indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {MOCK_SCREENS.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: mockScreen === i ? '#3B6D11' : '#D1D5DB', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textAlign: 'center', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Everything you need
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { icon: '📋', label: 'Multiple ladders' },
              { icon: '✅', label: 'Approve & track players' },
              { icon: '🎾', label: 'Singles & doubles' },
              { icon: '⚡', label: 'Submit scores instantly' },
              { icon: '🏆', label: "See who's on top" },
              { icon: '📜', label: 'Full match history' },
            ].map(f => (
              <div key={f.label} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#374151', lineHeight: 1.4 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Login */}
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(59,109,17,0.18)', border: '2px solid #3B6D11' }}>
          <div style={{ background: '#3B6D11', padding: '14px 20px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.2px' }}>Get started</div>
            <div style={{ fontSize: 12, color: '#A8D57A', marginTop: 2 }}>Enter your phone number to sign in or create an account.</div>
          </div>
          <div style={{ background: 'white', padding: '1.25rem 1.5rem' }}>

          {!showAdmin ? (
            <form onSubmit={handleContinue}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Phone number</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 10, background: 'white', overflow: 'hidden', paddingLeft: 14 }}>
                <span style={{ fontSize: 16, color: '#374151', whiteSpace: 'nowrap', userSelect: 'none' }}>+65</span>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="9123 4567" autoFocus
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 12px', fontSize: 16, background: 'transparent', boxSizing: 'border-box' }}
                />
              </div>
              {error && <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{error}</div>}
              <button type="submit" disabled={loading || !phone.trim()} style={btnStyle(loading || !phone.trim())}>
                {loading ? 'Checking…' : 'Continue →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#27500A', marginBottom: 12 }}>Admin login</div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Phone number</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 10, background: 'white', overflow: 'hidden', paddingLeft: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 16, color: '#374151', whiteSpace: 'nowrap', userSelect: 'none' }}>+65</span>
                <input
                  type="tel" value={adminPhone} onChange={e => setAdminPhone(e.target.value)}
                  placeholder="9123 4567"
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 12px', fontSize: 16, background: 'transparent', boxSizing: 'border-box' }}
                />
              </div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Admin PIN</label>
              <input type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="Enter PIN"
                style={{ width: '100%', padding: '12px 14px', fontSize: 16, border: '1px solid #D1D5DB', borderRadius: 10, boxSizing: 'border-box', outline: 'none', marginBottom: 0 }} />
              {adminError && <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{adminError}</div>}
              <button type="submit" disabled={adminLoading || !adminPhone.trim() || !adminPin.trim()} style={btnStyle(adminLoading)}>
                {adminLoading ? 'Signing in…' : 'Sign in as admin'}
              </button>
              <button type="button" onClick={() => { setShowAdmin(false); setAdminError(''); }}
                style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                ← Back
              </button>
            </form>
          )}
          </div>
        </div>

        {!showAdmin && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => setShowAdmin(true)}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
              Admin login
            </button>
          </div>
        )}

        {/* Access comparison table */}
        <div style={{ marginTop: 20, borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', background: 'white' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px', padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#27500A', textAlign: 'center' }}>🔑 Admin</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textAlign: 'center' }}>👤 Player</div>
          </div>
          {[
            { label: 'Create & manage ladders',  admin: true,  player: false },
            { label: 'Approve join requests',     admin: true,  player: false },
            { label: 'Delete matches',            admin: true,  player: false },
            { label: 'Join a ladder',             admin: true,  player: true  },
            { label: 'Submit match scores',       admin: true,  player: true  },
            { label: 'View standings & history',  admin: true,  player: true  },
          ].map((row, i) => (
            <div key={row.label} style={{
              display: 'grid', gridTemplateColumns: '1fr 72px 72px',
              padding: '11px 16px', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none',
            }}>
              <div style={{ fontSize: 12, color: '#374151' }}>{row.label}</div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: row.admin ? '#3B6D11' : '#D1D5DB' }}>{row.admin ? '✓' : '✗'}</div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: row.player ? '#3B6D11' : '#D1D5DB' }}>{row.player ? '✓' : '✗'}</div>
            </div>
          ))}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6', background: '#F9FAFB' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>💡 The same phone number can be registered as both a player and an admin.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
