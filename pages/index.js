import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { loadSession, saveSession, clearSession } from '../lib/auth';
import CreateLadderModal from '../components/CreateLadderModal';
import { profileEmoji } from '../lib/playerEmoji';

const APP_NAME = 'LadderLive';

const MOCK_SCREENS = [
  {
    label: 'Leaderboard',
    description: 'Live standings update instantly after every match',
    content: (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Summer Ladder 2026</div>
        {[
          { rank: 1, name: 'Alex',  pts: 15, w: 5, l: 0, you: false },
          { rank: 2, name: 'Sofia', pts: 12, w: 4, l: 1, you: true  },
          { rank: 3, name: 'Kai',   pts:  9, w: 3, l: 2, you: false },
          { rank: 4, name: 'Omar',  pts:  6, w: 2, l: 2, you: false },
          { rank: 5, name: 'Priya', pts:  3, w: 1, l: 3, you: false },
        ].map(p => (
          <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, marginBottom: 4, background: p.you ? '#EAF3DE' : 'white', border: p.you ? '1.5px solid #A8D57A' : '1px solid #F3F4F6' }}>
            <div style={{ width: 18, fontSize: 12, fontWeight: 700, color: p.rank === 1 ? '#D97706' : '#9CA3AF', textAlign: 'center' }}>{p.rank === 1 ? '🥇' : p.rank}</div>
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
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Record a match</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[['Player 1', 'Alex'], ['Player 2', 'Sofia']].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 3 }}>{label}</div>
              <div style={{ background: 'white', border: '1px solid #D1D5DB', borderRadius: 7, padding: '6px 8px', fontSize: 12, fontWeight: 500, color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{val} <span style={{ color: '#9CA3AF', fontSize: 9 }}>▾</span></div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 5 }}>Who won?</div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          {[['Alex', false], ['Draw', false], ['Sofia', true]].map(([label, selected]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: selected ? '2px solid #3B6D11' : '1.5px solid #E5E7EB', background: selected ? '#EAF3DE' : 'white', color: selected ? '#27500A' : '#6B7280' }}>
              {label}
              <div style={{ fontSize: 9, fontWeight: 400, color: selected ? '#3B6D11' : '#9CA3AF', marginTop: 1 }}>+3 pts</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, background: '#3B6D11', color: 'white', borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>Submit result →</div>
      </div>
    ),
  },
  {
    label: 'Match History',
    description: 'Every result is recorded — full history for the whole ladder',
    content: (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Recent results</div>
        {[
          { winner: 'Alex',  loser: 'Kai',   score: '6-3, 7-5',      pts: 3, ago: '3 days ago' },
          { winner: 'Sofia', loser: 'Omar',  score: '7-6, 4-6, 6-3', pts: 3, ago: '6 days ago' },
          { winner: 'Kai',   loser: 'Priya', score: '6-1, 6-2',      pts: 3, ago: '1 week ago' },
          { winner: 'Alex',  loser: 'Sofia', score: '6-4, 6-2',      pts: 3, ago: '2 weeks ago' },
        ].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 600 }}>{m.winner}</span><span style={{ color: '#9CA3AF', margin: '0 4px' }}>def.</span>{m.loser}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{m.score} · {m.ago}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3B6D11', background: '#EAF3DE', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>+{m.pts} pts</div>
          </div>
        ))}
      </div>
    ),
  },
];

function AppPreview() {
  const [mockScreen, setMockScreen] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMockScreen(s => (s + 1) % MOCK_SCREENS.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Key Features</div>
      <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#27500A', marginBottom: 8, minHeight: 24 }}>
        {MOCK_SCREENS[mockScreen].description}
      </div>
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', overflow: 'hidden', minHeight: 260, position: 'relative' }}>
        <div style={{ background: '#EAF3DE', padding: '8px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #D1FAE5' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#27500A' }}>🏆 LadderLive</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3B6D11', background: 'white', border: '1px solid #A8D57A', borderRadius: 6, padding: '2px 8px' }}>{MOCK_SCREENS[mockScreen].label}</div>
        </div>
        <div style={{ position: 'relative', minHeight: 220 }}>
          {MOCK_SCREENS.map((s, i) => (
            <div key={s.label} style={{ position: i === 0 ? 'relative' : 'absolute', top: 0, left: 0, right: 0, opacity: mockScreen === i ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: mockScreen === i ? 'auto' : 'none' }}>
              {s.content}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {MOCK_SCREENS.map((_, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: mockScreen === i ? '#3B6D11' : '#D1D5DB', transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  );
}

const FEATURE_ICONS = {
  ladders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="2" y="3" width="6" height="18" rx="1"/>
      <rect x="9" y="8" width="6" height="13" rx="1"/>
      <rect x="16" y="13" width="6" height="8" rx="1"/>
    </svg>
  ),
  players: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  ),
  format: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="8" cy="12" r="4"/>
      <circle cx="16" cy="12" r="4"/>
    </svg>
  ),
  score: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

function FeatureGrid() {
  const takeaways = [
    {
      emoji: '🎾🏓',
      headline: 'Tennis & Pickleball',
      sub: 'Built for both sports — one platform for your whole club',
    },
    {
      emoji: '👤👥',
      headline: 'Singles & Doubles',
      sub: 'Run singles, doubles, or both formats',
    },
    {
      emoji: '⚡',
      headline: 'Multiple Ladders',
      sub: 'Manage as many ladders as you need, all in one place',
    },
  ];
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Built for your game</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {takeaways.map(t => (
          <div key={t.headline} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0, width: 52, textAlign: 'center' }}>{t.emoji}</div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{t.headline}</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PastLadders({ ladders, showMembership }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}
      >
        <span>Ended ladders ({ladders.length})</span>
        <span style={{ fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ marginTop: 6 }}>
          {ladders.map(l => (
            <LadderCard key={l.id} ladder={l} showMembership={showMembership} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
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

function LadderCard({ ladder, showMembership, onEnter, onJoin, joiningId }) {
  const router = useRouter();
  const status = ladderStatus(ladder);
  const membership = ladder.my_status;

  function handleClick() {
    router.push(`/ladder/${ladder.slug}`);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
        padding: '16px', marginBottom: 10, cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{ladder.name}</div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: ladder.sport === 'pickleball' ? '#FEF3C7' : '#EAF3DE', color: ladder.sport === 'pickleball' ? '#92400E' : '#3B6D11' }}>
            {ladder.sport === 'pickleball' ? '🏓 Pickleball' : '🎾 Tennis'}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: STATUS_BG[status], color: STATUS_COLOR[status], flexShrink: 0, marginLeft: 8 }}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 12, color: '#6B7280', marginBottom: showMembership ? 12 : 0 }}>
        {ladder.location && <span>📍 {ladder.location}</span>}
        <span>📅 {formatDate(ladder.start_date)} – {formatDate(ladder.end_date)}</span>
        <span>{ladder.format === 'doubles' ? '👥 Doubles' : '🎾 Singles'}</span>
        <span>👤 {ladder.player_count ?? 0} player{ladder.player_count !== 1 ? 's' : ''}</span>
        <span>🎯 {ladder.match_count ?? 0} match{ladder.match_count !== 1 ? 'es' : ''}</span>
      </div>
      {showMembership && membership && (
        <div style={{ fontSize: 12, fontWeight: 600, color: membership === 'approved' ? '#3B6D11' : membership === 'pending' ? '#D97706' : '#A32D2D' }}>
          {membership === 'approved' ? '✓ Member' : membership === 'pending' ? '⏳ Awaiting approval' : '✗ Not approved'}
        </div>
      )}
    </div>
  );
}

function LoginModal({ onClose, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true); setError('');
    const digits = phone.replace(/[\s\-().]/g, '').trim();
    const fullPhone = digits.startsWith('65') ? digits : `65${digits}`;
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      if (data.exists) {
        saveSession(fullPhone, data.player);
        onSuccess(data.player, fullPhone);
      } else {
        window.location.href = `/register?phone=${encodeURIComponent(fullPhone)}`;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ background: '#3B6D11', padding: '16px 20px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Sign in to LadderLive</div>
          <div style={{ fontSize: 12, color: '#A8D57A', marginTop: 2 }}>Enter your phone number to continue</div>
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Phone number</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 10, background: 'white', overflow: 'hidden', paddingLeft: 14 }}>
              <span style={{ fontSize: 15, color: '#374151', whiteSpace: 'nowrap', userSelect: 'none' }}>+65</span>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="9123 4567" autoFocus
                style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 12px', fontSize: 15, background: 'transparent', boxSizing: 'border-box' }}
              />
            </div>
            {error && <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{error}</div>}
            <button type="submit" disabled={loading || !phone.trim()} style={{
              width: '100%', marginTop: 12, padding: '12px', fontSize: 14, fontWeight: 600,
              background: loading || !phone.trim() ? '#9CA3AF' : '#3B6D11', color: 'white',
              border: 'none', borderRadius: 10, cursor: loading || !phone.trim() ? 'default' : 'pointer',
            }}>
              {loading ? 'Checking…' : 'Continue →'}
            </button>
          </form>
          <button onClick={onClose} style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [publicLadders, setPublicLadders] = useState([]);
  const [myLadders, setMyLadders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    async function init() {
      // Check session
      const session = loadSession();
      let player = null;
      if (session) {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: session.phone }),
          });
          const data = await res.json();
          if (res.ok && data.exists) {
            player = data.player;
            setCurrentPlayer({ ...data.player, phone: session.phone });
          } else {
            clearSession();
          }
        } catch {
          setCurrentPlayer({ ...session.player, phone: session.phone });
          player = session.player;
        }
      }

      // Fetch public ladders
      const pubRes = await fetch('/api/ladders');
      if (pubRes.ok) setPublicLadders(await pubRes.json());

      // Fetch player's own ladders if logged in
      if (player?.id) {
        const myRes = await fetch(`/api/ladders?playerId=${player.id}`);
        if (myRes.ok) setMyLadders(await myRes.json());
      }

      setLoading(false);
    }
    init();
  }, []);

  function handleLoggedIn(player, phone) {
    setCurrentPlayer({ ...player, phone });
    setShowLogin(false);
    fetch(`/api/ladders?playerId=${player.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setMyLadders);
  }

  function handleLadderCreated(ladder) {
    setShowCreate(false);
    fetch(`/api/ladders?playerId=${currentPlayer.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setMyLadders);
    fetch('/api/ladders').then(r => r.ok ? r.json() : []).then(setPublicLadders);
    window.location.href = `/ladder/${ladder.slug}`;
  }

  function logout() {
    clearSession();
    setCurrentPlayer(null);
    setMyLadders([]);
  }

  const displayName = currentPlayer?.preferred_name || currentPlayer?.name;
  const myLadderIds = new Set(myLadders.map(l => l.id));
  const otherPublicLadders = publicLadders.filter(l => !myLadderIds.has(l.id));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Run your tennis or pickleball ladder. Track every match." />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
        {/* Top nav */}
        <div style={{ background: currentPlayer ? 'white' : '#1E4007', borderBottom: currentPlayer ? '1px solid #E5E7EB' : 'none', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: currentPlayer ? '#27500A' : 'white' }}>🏆 {APP_NAME}</div>
            {currentPlayer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a href={`/player/${currentPlayer.id}`} style={{ fontSize: 12, color: '#3B6D11', textDecoration: 'none', fontWeight: 600, background: '#EAF3DE', border: '1px solid #A8D57A', borderRadius: 6, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {profileEmoji(currentPlayer.id)} {displayName}
                </a>
                <button onClick={logout} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                  Log out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{ fontSize: 13, fontWeight: 600, color: '#27500A', background: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Hero (logged out only) */}
        {!currentPlayer && (
          <div style={{ background: '#1E4007', padding: '2.5rem 1rem 3rem' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {['🎾 Tennis', '🏓 Pickleball'].map(tag => (
                  <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: '#A8D57A', background: 'rgba(168,213,122,0.15)', border: '1px solid rgba(168,213,122,0.4)', borderRadius: 20, padding: '4px 12px' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 12, lineHeight: 1.2 }}>
                Run your ladder.<br />Track every match.
              </div>
              <div style={{ fontSize: 15, color: '#A8D57A', marginBottom: 28 }}>
                The easiest way to manage your sports community.
              </div>
              <button
                onClick={() => setShowLogin(true)}
                style={{ background: '#A8D57A', color: '#1E4007', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
              >
                Get started →
              </button>
            </div>
          </div>
        )}

        <div style={{ maxWidth: 680, margin: '0 auto', padding: currentPlayer ? '1.5rem 1rem 3rem' : '2rem 1rem 3rem' }}>

          {/* Preview + features (logged out only) */}
          {!currentPlayer && (
            <>
              <FeatureGrid />
              <AppPreview />
            </>
          )}

          {/* My Ladders */}
          {currentPlayer && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>My ladders</div>
                <button
                  onClick={() => setShowCreate(true)}
                  style={{ background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + New ladder
                </button>
              </div>
              {myLadders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: 12, border: '1px dashed #D1D5DB', color: '#9CA3AF', fontSize: 13 }}>
                  You haven't joined any ladders yet. Create one or browse below.
                </div>
              ) : (
                (() => {
                  const active = myLadders.filter(l => ladderStatus(l) !== 'past');
                  const past   = myLadders.filter(l => ladderStatus(l) === 'past');
                  return (
                    <>
                      {active.map(l => (
                        <LadderCard key={l.id} ladder={l} showMembership currentPlayer={currentPlayer} />
                      ))}
                      {past.length > 0 && <PastLadders ladders={past} showMembership />}
                    </>
                  );
                })()
              )}
            </div>
          )}

        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleLoggedIn} />}
      {showCreate && currentPlayer && (
        <CreateLadderModal
          creatorId={currentPlayer.id}
          onClose={() => setShowCreate(false)}
          onCreated={handleLadderCreated}
        />
      )}
    </>
  );
}
