import { useState } from 'react';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function ladderStatus(ladder) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(ladder.start_date);
  const end   = new Date(ladder.end_date);
  if (end < today) return 'past';
  if (start > today) return 'upcoming';
  return 'active';
}

export default function LadderSelect({ ladders, playerId, onSelectLadder }) {
  const [pastExpanded, setPastExpanded] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [membershipMap, setMembershipMap] = useState(() => {
    // Populate from ladders data: ladders already include membership info
    const map = {};
    ladders.forEach(l => {
      if (l.my_status) map[l.id] = l.my_status;
    });
    return map;
  });

  const active   = ladders.filter(l => ladderStatus(l) === 'active');
  const upcoming = ladders.filter(l => ladderStatus(l) === 'upcoming');
  const past     = ladders.filter(l => ladderStatus(l) === 'past');

  async function requestJoin(ladderId) {
    setJoiningId(ladderId);
    try {
      const res = await fetch('/api/player-ladders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ladderId }),
      });
      if (res.ok) {
        setMembershipMap(m => ({ ...m, [ladderId]: 'pending' }));
      }
    } finally {
      setJoiningId(null);
    }
  }

  function renderCard(ladder) {
    const status = ladderStatus(ladder);
    const membership = membershipMap[ladder.id] || ladder.my_status;

    let action = null;
    if (status === 'past') {
      action = <span style={{ fontSize: 12, color: '#9CA3AF' }}>Ended</span>;
    } else if (membership === 'approved') {
      action = (
        <button
          onClick={() => onSelectLadder(ladder)}
          style={{ background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Enter
        </button>
      );
    } else if (membership === 'pending') {
      action = <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>Awaiting approval</span>;
    } else if (membership === 'rejected') {
      action = <span style={{ fontSize: 12, color: '#A32D2D' }}>Not approved</span>;
    } else {
      action = (
        <button
          onClick={() => requestJoin(ladder.id)}
          disabled={joiningId === ladder.id}
          style={{ background: 'none', border: '1px solid #3B6D11', color: '#3B6D11', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {joiningId === ladder.id ? 'Joining…' : 'Request to join'}
        </button>
      );
    }

    return (
      <div
        key={ladder.id}
        style={{
          background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
          padding: '14px 16px', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{ladder.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {formatDate(ladder.start_date)} – {formatDate(ladder.end_date)}
            {' · '}{ladder.player_count} player{ladder.player_count !== 1 ? 's' : ''}
          </div>
        </div>
        {action}
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Ladders</div>

      {active.length === 0 && upcoming.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9CA3AF', fontSize: 14 }}>
          No active ladders right now. Check back soon!
        </div>
      )}

      {[...active, ...upcoming].map(renderCard)}

      {past.length > 0 && (
        <div style={{ marginTop: active.length + upcoming.length > 0 ? 20 : 0 }}>
          <button
            onClick={() => setPastExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6B7280', padding: '4px 0', marginBottom: 8 }}
          >
            <span style={{ fontSize: 11, transition: 'transform 0.15s', display: 'inline-block', transform: pastExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            Past ladders ({past.length})
          </button>
          {pastExpanded && past.map(renderCard)}
        </div>
      )}
    </div>
  );
}
