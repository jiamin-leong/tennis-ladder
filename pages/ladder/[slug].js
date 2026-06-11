import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { loadSession, saveSession, clearSession } from '../../lib/auth';
import Leaderboard from '../../components/Leaderboard';
import Matches from '../../components/Matches';
import SubmitScore from '../../components/SubmitScore';
import Players from '../../components/Players';
import Settings from '../../components/Settings';
import MyStats from '../../components/MyStats';
import FAQ from '../../components/FAQ';
import Playoff from '../../components/Playoff';

const MEMBER_TABS  = ['Leaderboard', 'Submit Score', 'Matches', 'FAQ'];
const CREATOR_TABS = ['Leaderboard', 'Submit Score', 'Matches', 'Players', 'Settings', 'Playoff'];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Shared stats card (no CTA) ───────────────────────────────────────────────

function LadderPreviewStats({ ladder }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ background: '#3B6D11', padding: '20px 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 }}>🏆 {ladder.name}</div>
        {ladder.location && <div style={{ fontSize: 13, color: '#A8D57A' }}>📍 {ladder.location}</div>}
      </div>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['Players', ladder.player_count ?? 0],
            ['Matches played', ladder.match_count ?? 0],
            ['Format', ladder.format === 'doubles' ? 'Doubles' : 'Singles'],
            ['Duration', `${formatDate(ladder.start_date)} – ${formatDate(ladder.end_date)}`],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Logged-out preview ──────────────────────────────────────────────────────

function LadderPreview({ ladder, onSignIn }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', textDecoration: 'none', marginBottom: 20 }}>
          ← All ladders
        </a>
        <LadderPreviewStats ladder={ladder} />
        <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', marginTop: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, color: '#374151', marginBottom: 16, textAlign: 'center' }}>
            Sign in to view standings and request to join this ladder.
          </div>
          <button
            onClick={onSignIn}
            style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer' }}
          >
            Sign in to join →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Login modal ──────────────────────────────────────────────────────────────

function LoginModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'pin' | 'set-pin'
  const [phone, setPhone] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true); setError('');
    const digits = phone.replace(/[\s\-().]/g, '').trim();
    const fp = digits.startsWith('65') ? digits : `65${digits}`;
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      if (!data.exists) {
        router.push(`/register?phone=${encodeURIComponent(fp)}&returnTo=${encodeURIComponent(router.asPath)}`);
        return;
      }
      setFullPhone(fp);
      setStep(data.hasPin ? 'pin' : 'set-pin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, pin, action: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect PIN');
      saveSession(fullPhone, data.player);
      onSuccess(data.player, fullPhone);
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPin(e) {
    e.preventDefault();
    if (pin.length < 4) return setError('PIN must be at least 4 digits.');
    if (pin !== confirmPin) return setError('PINs do not match.');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, pin, action: 'set-pin' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set PIN');
      saveSession(fullPhone, data.player);
      onSuccess(data.player, fullPhone);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { flex: 1, border: 'none', outline: 'none', padding: '12px 12px', fontSize: 15, background: 'transparent', boxSizing: 'border-box' };
  const btnStyle = (disabled) => ({
    width: '100%', marginTop: 12, padding: '12px', fontSize: 14, fontWeight: 600,
    background: disabled ? '#9CA3AF' : '#3B6D11', color: 'white',
    border: 'none', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ background: '#3B6D11', padding: '16px 20px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Sign in to continue</div>
          <div style={{ fontSize: 12, color: '#A8D57A', marginTop: 2 }}>
            {step === 'phone' && 'Enter your phone number'}
            {step === 'pin' && 'Enter your PIN to sign in'}
            {step === 'set-pin' && 'Create a PIN for your account'}
          </div>
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Phone number</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 10, background: 'white', overflow: 'hidden', paddingLeft: 14 }}>
                <span style={{ fontSize: 15, color: '#374151', whiteSpace: 'nowrap', userSelect: 'none' }}>+65</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9123 4567" autoFocus style={inputStyle} />
              </div>
              {error && <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{error}</div>}
              <button type="submit" disabled={loading || !phone.trim()} style={btnStyle(loading || !phone.trim())}>
                {loading ? 'Checking…' : 'Continue →'}
              </button>
              <button type="button" onClick={onClose} style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </form>
          )}

          {step === 'pin' && (
            <form onSubmit={handlePinSubmit}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>PIN</label>
              <input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Enter your PIN" autoFocus maxLength={8}
                style={{ width: '100%', padding: '12px 14px', fontSize: 22, letterSpacing: '0.3em', border: '1px solid #D1D5DB', borderRadius: 10, boxSizing: 'border-box', textAlign: 'center' }} />
              {error && <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{error}</div>}
              <button type="submit" disabled={loading || !pin.trim()} style={btnStyle(loading || !pin.trim())}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
              <button type="button" onClick={() => { setStep('phone'); setPin(''); setError(''); }} style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }}>
                ← Use a different number
              </button>
            </form>
          )}

          {step === 'set-pin' && (
            <form onSubmit={handleSetPin}>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, background: '#F9FAFB', borderRadius: 8, padding: '10px 12px' }}>
                You don't have a PIN yet. Set one to secure your account.
              </div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>New PIN (4+ digits)</label>
              <input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 1234" autoFocus maxLength={8}
                style={{ width: '100%', padding: '12px 14px', fontSize: 22, letterSpacing: '0.3em', border: '1px solid #D1D5DB', borderRadius: 10, boxSizing: 'border-box', textAlign: 'center', marginBottom: 10 }} />
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Confirm PIN</label>
              <input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 1234" maxLength={8}
                style={{ width: '100%', padding: '12px 14px', fontSize: 22, letterSpacing: '0.3em', border: '1px solid #D1D5DB', borderRadius: 10, boxSizing: 'border-box', textAlign: 'center' }} />
              {error && <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{error}</div>}
              <button type="submit" disabled={loading || !pin || !confirmPin} style={btnStyle(loading || !pin || !confirmPin)}>
                {loading ? 'Saving…' : 'Set PIN & sign in →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pending / rejected states ────────────────────────────────────────────────

function StatusScreen({ ladder, status, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{status === 'pending' ? '⏳' : '❌'}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#27500A', marginBottom: 8 }}>
          {status === 'pending' ? 'Request sent' : 'Not approved'}
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
          {status === 'pending'
            ? `Your request to join "${ladder.name}" is waiting for the organiser to approve.`
            : `Your request to join "${ladder.name}" was not approved. Contact the organiser for more info.`}
        </div>
        <a href="/" style={{ display: 'inline-block', fontSize: 14, color: '#3B6D11', textDecoration: 'none', fontWeight: 600 }}>← Back to all ladders</a>
      </div>
    </div>
  );
}

// ── Main ladder view ─────────────────────────────────────────────────────────

export default function LadderPage({ initialLadder, notFound }) {
  const router = useRouter();
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [ladder, setLadder] = useState(initialLadder);
  const [membership, setMembership] = useState(null); // 'approved' | 'pending' | 'rejected' | null
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [playoff, setPlayoff] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [joiningId, setJoiningId] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [viewMode, setViewMode] = useState('member'); // 'member' | 'creator'
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    async function init() {
      const session = loadSession();
      if (!session) { setAuthChecked(true); return; }

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: session.phone }),
        });
        const data = await res.json();
        if (res.ok && data.exists) {
          setCurrentPlayer({ ...data.player, phone: session.phone });
        } else {
          clearSession();
        }
      } catch {
        setCurrentPlayer({ ...session.player, phone: session.phone });
      }
      setAuthChecked(true);
    }
    init();
  }, []);

  // Once we know the player, fetch their membership + ladder data
  useEffect(() => {
    if (!authChecked || !ladder) return;
    if (!currentPlayer) return;

    async function fetchMembership() {
      setMembershipLoading(true);
      const res = await fetch(`/api/ladders?slug=${ladder.slug}&playerId=${currentPlayer.id}`);
      if (res.ok) {
        const fresh = await res.json();
        setLadder(fresh);
        const ms = fresh.my_status ?? null;
        setMembership(ms);
        const normalizedPhone = (currentPlayer.phone || '').replace(/[\s\-().+]/g, '').trim();
        const isCreator = parseInt(fresh.creator_id) === parseInt(currentPlayer.id)
          || (fresh.co_organiser_phones || []).includes(normalizedPhone);
        const mode = isCreator ? 'creator' : 'member';
        setViewMode(mode);
        if (ms === 'approved') {
          setActiveTab('Leaderboard');
          loadLadderData(fresh, isCreator);
        }
      }
      setMembershipLoading(false);
    }
    fetchMembership();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, currentPlayer?.id, ladder?.slug]);

  const loadLadderData = useCallback(async (l, isCreator) => {
    if (!l) return;
    setLoadingData(true);
    try {
      const [pRes, mRes, poRes] = await Promise.all([
        fetch(`/api/players?ladderId=${l.id}${isCreator ? '&status=all' : ''}`),
        fetch(`/api/matches?ladderId=${l.id}`),
        fetch(`/api/playoffs?ladderId=${l.id}`),
      ]);
      if (pRes.ok)  setPlayers(await pRes.json());
      if (mRes.ok)  setMatches(await mRes.json());
      if (poRes.ok) setPlayoff(await poRes.json());
    } finally {
      setLoadingData(false);
    }
  }, []);

  async function refreshData() {
    const normalizedPhone = (currentPlayer?.phone || '').replace(/[\s\-().+]/g, '').trim();
    const isCreator = parseInt(ladder?.creator_id) === parseInt(currentPlayer?.id)
      || (ladder?.co_organiser_phones || []).includes(normalizedPhone);
    // Re-fetch the ladder itself so settings changes are reflected when the form remounts
    const lRes = await fetch(`/api/ladders?slug=${ladder.slug}&playerId=${currentPlayer?.id}`);
    if (lRes.ok) {
      const fresh = await lRes.json();
      setLadder(fresh);
      loadLadderData(fresh, isCreator);
    } else {
      loadLadderData(ladder, isCreator);
    }
  }

  function handleLoggedIn(player, phone) {
    setCurrentPlayer({ ...player, phone });
    setShowLogin(false);
  }

  async function requestJoin() {
    setJoiningId(true);
    try {
      const res = await fetch('/api/player-ladders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id, ladderId: ladder.id }),
      });
      if (res.ok) setMembership('pending');
    } finally {
      setJoiningId(false);
    }
  }

  function logout() {
    clearSession();
    setCurrentPlayer(null);
    setMembership(null);
    setPlayers([]);
    setMatches([]);
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#27500A', marginBottom: 8 }}>Ladder not found</div>
          <a href="/" style={{ color: '#3B6D11', fontSize: 14 }}>← Back to all ladders</a>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  // Logged out
  if (!currentPlayer) {
    return (
      <>
        <Head><title>{ladder?.name || 'LadderLive'}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
        <LadderPreview ladder={ladder} onSignIn={() => setShowLogin(true)} />
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleLoggedIn} />}
      </>
    );
  }

  // Still fetching membership
  if (membershipLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  // Logged in — not yet a member
  if (membership === null) {
    return (
      <>
        <Head><title>{ladder?.name || 'LadderLive'}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
        <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', textDecoration: 'none', marginBottom: 20 }}>
              ← All ladders
            </a>
            <LadderPreviewStats ladder={ladder} />
            <button
              onClick={requestJoin}
              disabled={joiningId}
              style={{ width: '100%', marginTop: 12, padding: '13px', fontSize: 15, fontWeight: 600, background: joiningId ? '#9CA3AF' : '#3B6D11', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer' }}
            >
              {joiningId ? 'Sending request…' : 'Request to join →'}
            </button>
          </div>
        </div>
      </>
    );
  }

  // Pending or rejected
  if (membership === 'pending' || membership === 'rejected') {
    return (
      <>
        <Head><title>{ladder?.name || 'LadderLive'}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
        <StatusScreen ladder={ladder} status={membership} onLogout={logout} />
      </>
    );
  }

  // Approved member or creator
  const isCreator = viewMode === 'creator';
  const memberTabs = playoff ? [...MEMBER_TABS, 'Playoff'] : MEMBER_TABS;
  const tabs = isCreator ? CREATOR_TABS : memberTabs;
  const currentTab = activeTab || tabs[0];
  const approvedPlayers = players.filter(p => p.status === 'approved');
  const displayName = currentPlayer?.preferred_name || currentPlayer?.name;

  return (
    <>
      <Head>
        <title>{ladder?.name || 'LadderLive'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Back */}
          <a
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'white', border: '1px solid #D1D5DB', borderRadius: 8,
              padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#374151',
              cursor: 'pointer', marginBottom: 12, textDecoration: 'none',
            }}
          >
            ← All ladders
          </a>

          {/* Header */}
          <div style={{
            background: isCreator ? '#1E4007' : '#EAF3DE',
            borderRadius: 16, padding: '1rem 1.25rem', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: isCreator ? 'white' : '#27500A' }}>🏆 {ladder?.name}</div>
                {isCreator && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1E4007', background: '#F59E0B', borderRadius: 5, padding: '2px 7px', letterSpacing: '0.05em' }}>
                    ORGANISER
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: isCreator ? '#A8D57A' : '#3B6D11' }}>
                {isCreator ? 'Managing this ladder' : `Welcome, ${displayName}`}
              </div>
            </div>
            <button onClick={logout} style={{
              fontSize: 12, cursor: 'pointer', borderRadius: 6, padding: '5px 12px',
              color: isCreator ? '#A8D57A' : '#3B6D11',
              background: 'none',
              border: isCreator ? '1px solid rgba(168,213,122,0.5)' : '1px solid #A8D57A',
            }}>
              Log out
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #E5E7EB', marginBottom: 20, overflowX: 'auto' }}>
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '8px 14px', fontSize: 13, fontWeight: 500,
                  background: 'none', border: 'none',
                  borderBottom: currentTab === t
                    ? `2px solid ${isCreator ? '#D97706' : '#3B6D11'}`
                    : '2px solid transparent',
                  color: currentTab === t
                    ? (isCreator ? '#D97706' : '#3B6D11')
                    : '#6B7280',
                  whiteSpace: 'nowrap', cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Playoff notice banner */}
          {playoff && currentTab !== 'Playoff' && (
            <div
              onClick={() => setActiveTab('Playoff')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #1E4007, #3B6D11)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 18 }}>🏆</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                  Playoffs underway
                </div>
                <div style={{ fontSize: 12, color: '#A8D57A' }}>
                  Ladder standings are frozen · No new match submissions
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#A8D57A' }}>View →</span>
            </div>
          )}

          {/* Content */}
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9CA3AF' }}>Loading…</div>
          ) : (
            <>
              {currentTab === 'Leaderboard' && <Leaderboard players={approvedPlayers} matchCount={matches.length} currentPlayerId={isCreator ? null : currentPlayer?.id} playoffActive={!!playoff} />}
              {currentTab === 'Matches'     && <Matches matches={matches} settings={ladder} isAdmin={isCreator} creatorId={isCreator ? currentPlayer?.id : null} onMatchDeleted={refreshData} />}
              {currentTab === 'My Stats'   && <MyStats currentPlayer={currentPlayer} allPlayers={approvedPlayers} ladderId={ladder?.id} />}
              {currentTab === 'Submit Score' && (
                playoff ? (
                  <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#27500A', marginBottom: 6 }}>Playoffs are underway</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Match submissions are closed. Head to the Playoff tab to follow the bracket.</div>
                  </div>
                ) : (
                  <SubmitScore players={approvedPlayers} settings={ladder} ladderId={ladder?.id} onSubmit={refreshData} />
                )
              )}
              {currentTab === 'Players'    && <Players players={players} ladderId={ladder?.id} creatorId={currentPlayer?.id} onPlayersChange={refreshData} />}
              {currentTab === 'Settings'   && <Settings settings={ladder} ladderId={ladder?.id} requesterId={currentPlayer?.id} onSave={refreshData} />}
              {currentTab === 'FAQ'        && <FAQ />}
              {currentTab === 'Playoff'    && (
                <Playoff
                  playoff={playoff}
                  setPlayoff={setPlayoff}
                  isOrganiser={isCreator}
                  requesterId={currentPlayer?.id}
                  currentPlayerId={currentPlayer?.id}
                  ladderId={ladder?.id}
                  players={approvedPlayers}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

    const { rows } = await pool.query(`
      SELECT l.*,
        COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'approved') AS player_count,
        COUNT(DISTINCT m.id) AS match_count
      FROM ladders l
      LEFT JOIN player_ladders pl ON pl.ladder_id = l.id
      LEFT JOIN matches m ON m.ladder_id = l.id
      WHERE l.slug = $1
      GROUP BY l.id
    `, [params.slug]);

    await pool.end();

    if (rows.length === 0) return { props: { notFound: true, initialLadder: null } };

    // Dates need to be serialized
    const ladder = {
      ...rows[0],
      start_date: rows[0].start_date?.toISOString?.() ?? rows[0].start_date,
      end_date:   rows[0].end_date?.toISOString?.()   ?? rows[0].end_date,
      created_at: rows[0].created_at?.toISOString?.() ?? rows[0].created_at,
      updated_at: rows[0].updated_at?.toISOString?.() ?? rows[0].updated_at,
    };

    return { props: { initialLadder: ladder, notFound: false } };
  } catch (err) {
    console.error('getServerSideProps /ladder/[slug]:', err);
    return { props: { notFound: true, initialLadder: null } };
  }
}
