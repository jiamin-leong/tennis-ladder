import { useState } from 'react';
import { profileEmoji } from '../lib/playerEmoji';

function roundLabel(round, totalRounds) {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return 'Final';
  if (fromFinal === 1) return 'Semifinals';
  if (fromFinal === 2) return 'Quarterfinals';
  return `Round of ${Math.pow(2, fromFinal + 1)}`;
}

function PlayerSlot({ playerId, name, seed, isWinner, isLoser }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
      borderRadius: 8,
      background: isWinner ? '#EAF3DE' : 'white',
      opacity: isLoser ? 0.45 : 1,
    }}>
      {playerId ? (
        <>
          <span style={{ fontSize: 15 }}>{profileEmoji(playerId)}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: isWinner ? 600 : 400, color: '#111827' }}>
            {name}
          </span>
          {seed && (
            <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', borderRadius: 4, padding: '1px 5px' }}>
              #{seed}
            </span>
          )}
          {isWinner && <span style={{ fontSize: 12 }}>🏆</span>}
        </>
      ) : (
        <>
          <span style={{ fontSize: 15, opacity: 0.25 }}>👤</span>
          <span style={{ flex: 1, fontSize: 13, color: '#D1D5DB', fontStyle: 'italic' }}>TBD</span>
        </>
      )}
    </div>
  );
}

function MatchCard({ match, isOrganiser, requesterId, currentPlayerId, onUpdated }) {
  const [recording, setRecording] = useState(false);
  const [winnerId, setWinnerId] = useState('');
  const [score, setScore] = useState('');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasResult  = !!match.winner_id;
  const isParticipant = currentPlayerId &&
    (Number(currentPlayerId) === match.player1_id || Number(currentPlayerId) === match.player2_id);
  const canRecord  = !hasResult && match.player1_id && match.player2_id && (isOrganiser || isParticipant);

  async function save() {
    if (!winnerId) return setError('Select a winner.');
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/playoffs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, winnerId: Number(winnerId), score, playedAt, requesterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRecording(false);
      onUpdated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginBottom: 8, background: 'white' }}>
      <div style={{ padding: '6px' }}>
        <PlayerSlot
          playerId={match.player1_id} name={match.player1_name} seed={match.player1_seed}
          isWinner={hasResult && match.winner_id === match.player1_id}
          isLoser={hasResult  && match.winner_id !== match.player1_id && !!match.player1_id}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px' }}>
          <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em' }}>VS</span>
          {match.score && <span style={{ fontSize: 11, color: '#6B7280' }}>{match.score}</span>}
          <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
        </div>
        <PlayerSlot
          playerId={match.player2_id} name={match.player2_name} seed={match.player2_seed}
          isWinner={hasResult && match.winner_id === match.player2_id}
          isLoser={hasResult  && match.winner_id !== match.player2_id && !!match.player2_id}
        />
      </div>

      {canRecord && !recording && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '8px' }}>
          <button
            onClick={() => setRecording(true)}
            style={{
              width: '100%', padding: '7px', fontSize: 12, fontWeight: 600,
              background: '#3B6D11', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer',
            }}
          >
            Record result →
          </button>
        </div>
      )}

      {recording && (
        <div style={{ borderTop: '1px solid #F3F4F6', background: '#F9FAFB', padding: '12px' }}>
          {/* Winner selector */}
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>Who won?</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { id: match.player1_id, name: match.player1_name },
              { id: match.player2_id, name: match.player2_name },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setWinnerId(String(p.id))}
                style={{
                  flex: 1, padding: '7px 4px', fontSize: 12, fontWeight: 600,
                  borderRadius: 8, cursor: 'pointer',
                  border: String(winnerId) === String(p.id) ? '2px solid #3B6D11' : '2px solid #E5E7EB',
                  background: String(winnerId) === String(p.id) ? '#EAF3DE' : 'white',
                  color: String(winnerId) === String(p.id) ? '#27500A' : '#6B7280',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>Score <span style={{ color: '#9CA3AF' }}>(opt.)</span></div>
              <input
                type="text" value={score} onChange={e => setScore(e.target.value)}
                placeholder="e.g. 6-3, 7-5"
                style={{ margin: 0, fontSize: 13 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>Date played</div>
              <input
                type="date" value={playedAt} onChange={e => setPlayedAt(e.target.value)}
                style={{ margin: 0, fontSize: 13 }}
              />
            </div>
          </div>

          {error && <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={save} disabled={saving}
              style={{
                flex: 1, padding: '8px', fontSize: 13, fontWeight: 600,
                background: '#3B6D11', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save result'}
            </button>
            <button
              onClick={() => { setRecording(false); setError(''); setWinnerId(''); }}
              style={{
                padding: '8px 14px', fontSize: 13, background: 'none',
                color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 7, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Generate UI ───────────────────────────────────────────────────────────────

function GeneratePlayoff({ ladderId, requesterId, players, onGenerated }) {
  const sorted = [...players].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  const defaultN = [4, 8, 16].find(n => sorted.length >= n) ?? 0;
  const [topN, setTopN] = useState(defaultN || 8);
  // selected is a Set of player id strings, pre-seeded with top N
  const [selected, setSelected] = useState(() => new Set(sorted.slice(0, defaultN || 8).map(p => String(p.id))));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function changeSize(n) {
    setTopN(n);
    // Re-default selection to top N; keep any manually added players if still ≤ n
    setSelected(new Set(sorted.slice(0, n).map(p => String(p.id))));
  }

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  const selectionValid = selected.size === topN;
  // Seeds assigned by points rank among selected players
  const selectedPlayers = sorted.filter(p => selected.has(String(p.id)));

  async function generate() {
    if (!selectionValid) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/playoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ladderId, requesterId, playerIds: selectedPlayers.map(p => p.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      onGenerated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Generate playoff bracket
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
          Select exactly {topN} players — seeded by their points ranking.
        </div>

        {sorted.length < 4 ? (
          <div style={{ fontSize: 13, color: '#A32D2D', background: '#FCEBEB', borderRadius: 8, padding: '10px 14px' }}>
            Need at least 4 approved players to generate a bracket.
          </div>
        ) : (
          <>
            {/* Bracket size */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Bracket size</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[4, 8, 16].map(n => (
                  <button key={n} type="button" onClick={() => changeSize(n)} disabled={sorted.length < n}
                    style={{
                      flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, borderRadius: 8,
                      cursor: sorted.length < n ? 'not-allowed' : 'pointer',
                      border: topN === n ? '2px solid #3B6D11' : '2px solid #E5E7EB',
                      background: topN === n ? '#EAF3DE' : sorted.length < n ? '#F9FAFB' : 'white',
                      color: topN === n ? '#27500A' : sorted.length < n ? '#D1D5DB' : '#6B7280',
                    }}
                  >
                    {n} players
                  </button>
                ))}
              </div>
            </div>

            {/* Player selection */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Select players</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: selected.size === topN ? '#3B6D11' : '#D97706' }}>
                  {selected.size} / {topN} selected
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sorted.map((p, i) => {
                  const isSelected = selected.has(String(p.id));
                  const seedAmongSelected = selectedPlayers.findIndex(sp => sp.id === p.id) + 1;
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggle(String(p.id))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        border: isSelected ? '1.5px solid #A8D57A' : '1.5px solid #E5E7EB',
                        background: isSelected ? '#F2F9EA' : 'white',
                        transition: 'all 0.1s',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: isSelected ? '2px solid #3B6D11' : '2px solid #D1D5DB',
                        background: isSelected ? '#3B6D11' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', minWidth: 18, textAlign: 'right' }}>
                        #{i + 1}
                      </span>
                      <span style={{ fontSize: 14 }}>{profileEmoji(p.id)}</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: isSelected ? 500 : 400 }}>
                        {p.preferred_name || p.name}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{p.points ?? 0} pts</span>
                      {isSelected && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#3B6D11', background: '#EAF3DE', borderRadius: 4, padding: '1px 5px' }}>
                          Seed {seedAmongSelected}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {!selectionValid && selected.size > 0 && (
              <div style={{ fontSize: 12, color: '#BA7517', background: '#FAEEDA', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                {selected.size < topN ? `Select ${topN - selected.size} more player${topN - selected.size > 1 ? 's' : ''}.` : `Too many selected — deselect ${selected.size - topN}.`}
              </div>
            )}

            {error && (
              <div style={{ fontSize: 13, color: '#A32D2D', background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button
              onClick={generate} disabled={loading || !selectionValid}
              style={{
                width: '100%', padding: '11px', fontSize: 14, fontWeight: 600,
                background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8,
                cursor: loading || !selectionValid ? 'default' : 'pointer',
                opacity: loading || !selectionValid ? 0.5 : 1,
              }}
            >
              {loading ? 'Generating…' : `Generate ${topN}-player bracket →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Playoff({ playoff, setPlayoff, isOrganiser, requesterId, currentPlayerId, ladderId, players }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function resetPlayoff() {
    setResetting(true);
    try {
      const res = await fetch('/api/playoffs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playoffId: playoff.id, requesterId }),
      });
      if (res.ok) { setPlayoff(null); setConfirmReset(false); }
    } finally {
      setResetting(false);
    }
  }

  if (!playoff) {
    if (!isOrganiser) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9CA3AF', fontSize: 14 }}>
          No playoff bracket yet.
        </div>
      );
    }
    return <GeneratePlayoff ladderId={ladderId} requesterId={requesterId} players={players} onGenerated={setPlayoff} />;
  }

  const totalRounds = Math.log2(playoff.player_count);
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const isComplete = playoff.status === 'completed';

  // Group matches by round
  const byRound = {};
  for (const m of playoff.matches) {
    if (!byRound[m.round]) byRound[m.round] = [];
    byRound[m.round].push(m);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Playoff bracket
          </div>
          <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>
            {playoff.player_count}-player · {isComplete ? '🏆 Complete' : 'In progress'}
          </div>
        </div>
        {isOrganiser && (
          confirmReset ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={resetPlayoff} disabled={resetting}
                style={{ fontSize: 12, background: '#A32D2D', color: 'white', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
              >
                {resetting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                style={{ fontSize: 12, background: 'none', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              style={{ fontSize: 12, background: 'none', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
            >
              Reset
            </button>
          )
        )}
      </div>

      {/* Champion banner */}
      {isComplete && (() => {
        const final = byRound[totalRounds]?.[0];
        const champion = playoff.matches.find(m => m.winner_id && m.round === totalRounds);
        if (!champion) return null;
        return (
          <div style={{ background: 'linear-gradient(135deg, #1E4007, #3B6D11)', borderRadius: 12, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A8D57A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Champion</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{champion.winner_name}</div>
          </div>
        );
      })()}

      {/* Rounds */}
      {rounds.map(round => (
        <div key={round} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {roundLabel(round, totalRounds)}
          </div>
          {(byRound[round] || []).map(match => (
            <MatchCard
              key={match.id}
              match={match}
              isOrganiser={isOrganiser}
              requesterId={requesterId}
              currentPlayerId={currentPlayerId}
              onUpdated={setPlayoff}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
