import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Leaderboard from '../components/Leaderboard';
import Matches from '../components/Matches';
import SubmitScore from '../components/SubmitScore';
import Players from '../components/Players';
import Settings from '../components/Settings';
import FAQ from '../components/FAQ';
import MyStats from '../components/MyStats';
import LoginScreen from '../components/LoginScreen';
import RegisterScreen from '../components/RegisterScreen';
import PendingScreen from '../components/PendingScreen';

const ADMIN_TABS = ['Leaderboard', 'Matches', 'Players', 'Settings'];
const PARTICIPANT_TABS = ['Leaderboard', 'My Stats', 'Submit Score', 'FAQ'];
const SESSION_KEY = 'tennis_ladder_session';

// 'loading' | 'login' | 'register' | 'pending' | 'rejected' | 'participant' | 'admin'

export default function Home() {
  const [screen, setScreen] = useState('loading');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [pendingPhone, setPendingPhone] = useState('');
  const [tab, setTab] = useState('Leaderboard');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [ladderName, setLadderName] = useState('Tennis Ladder');

  // Load ladder name even before login
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s?.name) setLadderName(s.name); })
      .catch(() => {});
  }, []);

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const { phone, player } = JSON.parse(saved);
        verifySession(phone, player);
      } else {
        setScreen('login');
      }
    } catch {
      setScreen('login');
    }
  }, []);

  async function verifySession(phone, fallback) {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.exists) {
        enterApp(data.player, phone);
      } else {
        localStorage.removeItem(SESSION_KEY);
        setScreen('login');
      }
    } catch {
      if (fallback) enterApp(fallback, phone);
      else setScreen('login');
    }
  }

  function enterApp(player, phone) {
    const session = { phone, player };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setCurrentPlayer({ ...player, phone });
    if (player.is_admin) {
      setScreen('admin');
      setTab('Leaderboard');
    } else if (player.status === 'approved') {
      setScreen('participant');
      setTab('Leaderboard');
    } else if (player.status === 'rejected') {
      setScreen('rejected');
    } else {
      setScreen('pending');
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setCurrentPlayer(null);
    setPendingPhone('');
    setPlayers([]);
    setMatches([]);
    setScreen('login');
  }

  // Phone check on login page
  async function handlePhoneContinue(phone) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    if (data.exists) {
      enterApp(data.player, phone);
    } else {
      setPendingPhone(phone);
      setScreen('register');
    }
  }

  async function handleAdminLogin(phone, pin) {
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin login failed');
    enterApp(data.player, phone);
  }

  function handleRegistered(player) {
    enterApp(player, pendingPhone);
  }

  const fetchAll = useCallback(async (isAdmin = false) => {
    setLoadingData(true);
    try {
      const [pRes, mRes, sRes] = await Promise.all([
        fetch(isAdmin ? '/api/players?status=all' : '/api/players'),
        fetch('/api/matches'),
        fetch('/api/settings'),
      ]);
      if (pRes.ok) setPlayers(await pRes.json());
      if (mRes.ok) setMatches(await mRes.json());
      if (sRes.ok) {
        const s = await sRes.json();
        setSettings(s);
        if (s?.name) setLadderName(s.name);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (screen === 'admin') fetchAll(true);
    if (screen === 'participant') fetchAll(false);
  }, [screen, fetchAll]);

  const isAdmin = screen === 'admin';
  const tabs = isAdmin ? ADMIN_TABS : PARTICIPANT_TABS;
  const approvedPlayers = players.filter(p => p.status === 'approved');

  // ── Screens ──────────────────────────────────────────────

  if (screen === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (screen === 'login') {
    return <LoginScreen ladderName={ladderName} onContinue={handlePhoneContinue} onAdminLogin={handleAdminLogin} />;
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        phone={pendingPhone}
        onSuccess={handleRegistered}
        onBack={() => setScreen('login')}
      />
    );
  }

  if (screen === 'pending') {
    return <PendingScreen player={currentPlayer} onLogout={logout} />;
  }

  if (screen === 'rejected') {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#27500A', marginBottom: 8 }}>Application not approved</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
            Unfortunately your profile was not approved for this ladder. Please contact the admin for more information.
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 8, padding: '10px 24px', fontSize: 14, color: '#6B7280', cursor: 'pointer' }}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // ── Main app (participant or admin) ───────────────────────

  const displayName = currentPlayer?.preferred_name || currentPlayer?.name;

  return (
    <>
      <Head>
        <title>{ladderName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Tennis ladder — track matches, standings & scores" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Header */}
          <div style={{ background: '#EAF3DE', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#27500A' }}>🎾 {ladderName}</div>
              <div style={{ fontSize: 13, color: '#3B6D11', marginTop: 2 }}>
                {isAdmin ? '🔧 Admin view' : `Welcome, ${displayName}`}
              </div>
            </div>
            <button
              onClick={logout}
              style={{ fontSize: 12, color: '#3B6D11', background: 'none', border: '1px solid #A8D57A', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}
            >
              Log out
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #E5E7EB', marginBottom: 20, overflowX: 'auto' }}>
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 14px', fontSize: 13, fontWeight: 500,
                  background: 'none', border: 'none',
                  borderBottom: tab === t ? '2px solid #3B6D11' : '2px solid transparent',
                  color: tab === t ? '#3B6D11' : '#6B7280',
                  whiteSpace: 'nowrap', cursor: 'pointer', transition: 'color 0.15s',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9CA3AF' }}>Loading…</div>
          ) : (
            <>
              {tab === 'Leaderboard' && (
                <Leaderboard
                  players={approvedPlayers}
                  matchCount={matches.length}
                  currentPlayerId={isAdmin ? null : currentPlayer?.id}
                />
              )}
              {tab === 'Matches'      && <Matches matches={matches} settings={settings} />}
              {tab === 'My Stats'      && <MyStats currentPlayer={currentPlayer} allPlayers={approvedPlayers} />}
              {tab === 'Submit Score' && <SubmitScore players={approvedPlayers} settings={settings} onSubmit={() => fetchAll(false)} />}
              {tab === 'Players'      && <Players players={players} onPlayersChange={() => fetchAll(true)} />}
              {tab === 'Settings'     && <Settings settings={settings} onSave={() => fetchAll(true)} />}
              {tab === 'FAQ'          && <FAQ />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
