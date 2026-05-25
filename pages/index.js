import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Leaderboard from '../components/Leaderboard';
import Matches from '../components/Matches';
import SubmitScore from '../components/SubmitScore';
import Players from '../components/Players';
import Settings from '../components/Settings';

const TABS = ['Leaderboard', 'Matches', 'Submit Score', 'Players', 'Settings'];

export default function Home() {
  const [tab, setTab] = useState('Leaderboard');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, mRes, sRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/matches'),
        fetch('/api/settings'),
      ]);
      if (pRes.ok) setPlayers(await pRes.json());
      if (mRes.ok) setMatches(await mRes.json());
      if (sRes.ok) setSettings(await sRes.json());
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const ladderName = settings?.name || 'Tennis Ladder';

  function formatDateRange() {
    if (!settings?.start_date || !settings?.end_date) return '';
    const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fmt(settings.start_date)} – ${fmt(settings.end_date)}`;
  }

  function ladderStatus() {
    if (!settings?.start_date || !settings?.end_date) return { label: 'Active', color: '#3B6D11', bg: '#EAF3DE' };
    const now = new Date();
    const start = new Date(settings.start_date);
    const end = new Date(settings.end_date);
    if (now < start) return { label: 'Not started', color: '#BA7517', bg: '#FAEEDA' };
    if (now > end) return { label: 'Ended', color: '#A32D2D', bg: '#FCEBEB' };
    return { label: 'Active', color: '#3B6D11', bg: '#EAF3DE' };
  }

  const status = ladderStatus();

  return (
    <>
      <Head>
        <title>{ladderName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Tennis ladder — track matches, standings & scores" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Header banner */}
          <div style={{ background: '#EAF3DE', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#27500A' }}>🎾 {ladderName}</div>
              {formatDateRange() && (
                <div style={{ fontSize: 13, color: '#3B6D11', marginTop: 2 }}>{formatDateRange()}</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: status.bg, color: status.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                ● {status.label}
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #E5E7EB', marginBottom: 20, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid #3B6D11' : '2px solid transparent',
                  color: tab === t ? '#3B6D11' : '#6B7280',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loadingInit ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9CA3AF' }}>
              Loading…
            </div>
          ) : (
            <>
              {tab === 'Leaderboard' && <Leaderboard players={players} matchCount={matches.length} />}
              {tab === 'Matches' && <Matches matches={matches} />}
              {tab === 'Submit Score' && <SubmitScore players={players} onSubmit={fetchAll} />}
              {tab === 'Players' && <Players players={players} onPlayersChange={fetchAll} />}
              {tab === 'Settings' && <Settings settings={settings} onSave={fetchAll} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
