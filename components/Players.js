import { useState } from 'react';

const colors = ['green', 'blue', 'amber', 'red'];
const avatarBg = {
  green: { bg: '#EAF3DE', text: '#3B6D11' },
  blue:  { bg: '#E6F1FB', text: '#185FA5' },
  amber: { bg: '#FAEEDA', text: '#BA7517' },
  red:   { bg: '#FCEBEB', text: '#A32D2D' },
};

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_BADGE = {
  approved: { label: 'Approved', bg: '#EAF3DE', color: '#3B6D11' },
  pending:  { label: 'Pending',  bg: '#FAEEDA', color: '#BA7517' },
  rejected: { label: 'Rejected', bg: '#FCEBEB', color: '#A32D2D' },
};

function PlayerRow({ player, i, ladderId, showApprove, showReject, onStatusChange }) {
  const color = colors[i % colors.length];
  const { bg, text } = avatarBg[color];
  const badge = STATUS_BADGE[player.status] || STATUS_BADGE.approved;
  const displayName = player.preferred_name || player.name;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
        {initials(displayName)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
        {player.preferred_name && player.name !== player.preferred_name && (
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{player.name}</div>
        )}
        {player.gender && (
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{player.gender}{player.preferred_locations ? ` · ${player.preferred_locations}` : ''}</div>
        )}
      </div>
      <span style={{ fontSize: 11, background: badge.bg, color: badge.color, padding: '2px 7px', borderRadius: 5, fontWeight: 600, flexShrink: 0 }}>
        {badge.label}
      </span>
      {showApprove && (
        <button
          onClick={() => onStatusChange(player.player_id ?? player.id, 'approved')}
          style={{ fontSize: 12, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}
        >
          Approve
        </button>
      )}
      {showReject && (
        <button
          onClick={() => onStatusChange(player.player_id ?? player.id, 'rejected')}
          style={{ fontSize: 12, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}
        >
          Reject
        </button>
      )}
    </div>
  );
}

export default function Players({ players, ladderId, onPlayersChange }) {
  const [error, setError] = useState('');

  async function updateStatus(playerId, status) {
    setError('');
    try {
      let res;
      if (ladderId) {
        res = await fetch('/api/player-ladders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, ladderId, status }),
        });
      } else {
        res = await fetch('/api/players', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: playerId, status }),
        });
      }
      if (!res.ok) throw new Error('Failed to update status');
      onPlayersChange?.();
    } catch (err) {
      setError(err.message);
    }
  }

  const pending  = players.filter(p => p.status === 'pending');
  const approved = players.filter(p => p.status === 'approved');
  const rejected = players.filter(p => p.status === 'rejected');

  return (
    <div>
      {error && (
        <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Awaiting approval ({pending.length})
          </div>
          {pending.map((p, i) => (
            <PlayerRow key={p.player_id ?? p.id} player={p} i={i} ladderId={ladderId} showApprove showReject={false} onStatusChange={updateStatus} />
          ))}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          In ladder ({approved.length})
        </div>
        {approved.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0' }}>No approved players yet.</div>
        ) : (
          approved.map((p, i) => (
            <PlayerRow key={p.player_id ?? p.id} player={p} i={i} ladderId={ladderId} showApprove={false} showReject onStatusChange={updateStatus} />
          ))
        )}
      </div>

      {rejected.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#A32D2D', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Rejected ({rejected.length})
          </div>
          {rejected.map((p, i) => (
            <PlayerRow key={p.player_id ?? p.id} player={p} i={i} ladderId={ladderId} showApprove showReject={false} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
